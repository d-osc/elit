import { spawn } from 'node:child_process';
import { createWriteStream, mkdirSync } from 'node:fs';
import { EOL } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import { watch as createWatcher } from '../../server/chokidar';
import {
    DEFAULT_PM_DUMP_FILE,
    DEFAULT_PM_EXP_BACKOFF_MAX_DELAY,
    DEFAULT_PM_MEMORY_CHECK_INTERVAL,
    DEFAULT_PM_STOP_POLL_MS,
    PM_WAPK_ONLINE_SHUTDOWN_COMMAND,
    PM_WAPK_ONLINE_SHUTDOWN_TIMEOUT_MS,
    type ParsedPmRunnerArgs,
    type PmPaths,
    type PmRecord,
    type PmRecordMatch,
    type PmRestartRequest,
} from './shared';
import { isIgnoredWatchPath, readRequiredValue } from './helpers';
import {
    findPmRecordMatch,
    isProcessAlive,
    readLatestPmRecord,
    writePmRecord,
} from './records';
import { parsePmRestartSchedule, resolveNextPmScheduleOccurrence } from './schedule';
import { buildPmCommand, isPmOnlineWapkRecord, samplePmProcessMetrics, terminateProcessTree } from './process';

function writePmLog(stream: { write: (value: string) => unknown; writableEnded?: boolean; destroyed?: boolean }, message: string): void {
    if (stream.writableEnded || stream.destroyed) {
        return;
    }

    try {
        stream.write(`[elit pm] ${new Date().toISOString()} ${message}${EOL}`);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ERR_STREAM_WRITE_AFTER_END') {
            throw error;
        }
    }
}

function waitForExit(code: number | null, signal: string | null): number {
    if (typeof code === 'number') {
        return code;
    }

    if (signal === 'SIGINT' || signal === 'SIGTERM') {
        return 0;
    }

    return 1;
}

async function delay(milliseconds: number): Promise<void> {
    await new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

function createPmReadinessMonitor(
    record: PmRecord,
    onReady: (message: string) => void,
    onFailure: (message: string) => void,
) {
    if (!record.waitReady || !record.healthCheck) {
        return {
            stop() {},
        };
    }

    const healthCheck = record.healthCheck;
    const pollInterval = Math.max(50, Math.min(healthCheck.interval, 250));
    let stopped = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;

    const clearTimers = (): void => {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
        if (timeoutTimer) {
            clearTimeout(timeoutTimer);
            timeoutTimer = null;
        }
    };

    const runHealthCheck = async (): Promise<void> => {
        if (stopped || inFlight) {
            return;
        }

        inFlight = true;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), healthCheck.timeout);
        timeoutId.unref?.();

        try {
            const response = await fetch(healthCheck.url, {
                method: 'GET',
                signal: controller.signal,
            });

            if (stopped) {
                return;
            }

            if (!response.ok) {
                throw new Error(`health check returned ${response.status}`);
            }

            stopped = true;
            clearTimers();
            onReady(`readiness check passed: ${healthCheck.url}`);
        } catch {
        } finally {
            clearTimeout(timeoutId);
            inFlight = false;
        }
    };

    timeoutTimer = setTimeout(() => {
        if (stopped) {
            return;
        }

        stopped = true;
        clearTimers();
        onFailure(`listen timeout reached after ${record.listenTimeout}ms while waiting for ${healthCheck.url}`);
    }, record.listenTimeout);
    timeoutTimer.unref?.();

    void runHealthCheck();
    timer = setInterval(() => {
        void runHealthCheck();
    }, pollInterval);
    timer.unref?.();

    return {
        stop() {
            stopped = true;
            clearTimers();
        },
    };
}

function resolvePmStopTimeout(record: PmRecord): number {
    if (isPmOnlineWapkRecord(record)) {
        return Math.max(record.killTimeout, PM_WAPK_ONLINE_SHUTDOWN_TIMEOUT_MS);
    }

    return record.killTimeout;
}

export async function waitForProcessTermination(pid: number | undefined, timeoutMs: number): Promise<boolean> {
    if (!pid || !isProcessAlive(pid)) {
        return true;
    }

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (!isProcessAlive(pid)) {
            return true;
        }
        await delay(DEFAULT_PM_STOP_POLL_MS);
    }

    return !isProcessAlive(pid);
}

async function waitForManagedChildExit(child: ReturnType<typeof spawn>) {
    return await new Promise((resolvePromise) => {
        let resolved = false;

        child.once('error', (error) => {
            if (resolved) {
                return;
            }
            resolved = true;
            resolvePromise({ code: 1, signal: null, error: error instanceof Error ? error.message : String(error) });
        });

        child.once('close', (code, signal) => {
            if (resolved) {
                return;
            }
            resolved = true;
            resolvePromise({ code, signal });
        });
    });
}

async function createPmWatchController(
    record: PmRecord,
    onChange: (filePath: string) => void,
    onError: (message: string) => void,
) {
    if (!record.watch || record.watchPaths.length === 0) {
        return {
            async close() {},
        };
    }

    const watcher = createWatcher(record.watchPaths);
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRestart = (filePath: string): void => {
        const normalizedPath = filePath.replace(/\\/g, '/');
        if (isIgnoredWatchPath(normalizedPath, record.watchIgnore)) {
            return;
        }

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(() => {
            debounceTimer = null;
            onChange(normalizedPath);
        }, record.watchDebounce);
        debounceTimer.unref?.();
    };

    watcher.on('add', scheduleRestart);
    watcher.on('change', scheduleRestart);
    watcher.on('unlink', scheduleRestart);
    watcher.on('error', (error) => onError(error instanceof Error ? error.message : String(error)));

    return {
        async close() {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
                debounceTimer = null;
            }
            await watcher.close();
        },
    };
}

function createPmHealthMonitor(
    record: PmRecord,
    onFailure: (message: string) => void,
    onLog: (message: string) => void,
) {
    if (!record.healthCheck) {
        return {
            stop() {},
        };
    }

    const healthCheck = record.healthCheck;
    let stopped = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    let initialDelay: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;
    let failureCount = 0;

    const runHealthCheck = async (): Promise<void> => {
        if (stopped || inFlight) {
            return;
        }

        inFlight = true;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), healthCheck.timeout);
        timeoutId.unref?.();

        try {
            const response = await fetch(healthCheck.url, {
                method: 'GET',
                signal: controller.signal,
            });

            if (stopped) {
                return;
            }

            if (!response.ok) {
                throw new Error(`health check returned ${response.status}`);
            }

            failureCount = 0;
        } catch (error) {
            if (stopped) {
                return;
            }

            failureCount += 1;
            const message = error instanceof Error ? error.message : String(error);
            onLog(`health check failed (${failureCount}/${healthCheck.maxFailures}): ${message}`);
            if (failureCount >= healthCheck.maxFailures) {
                stopped = true;
                onFailure(`health check failed ${failureCount} times: ${message}`);
            }
        } finally {
            clearTimeout(timeoutId);
            inFlight = false;
        }
    };

    initialDelay = setTimeout(() => {
        void runHealthCheck();
        timer = setInterval(() => {
            void runHealthCheck();
        }, healthCheck.interval);
        timer.unref?.();
    }, healthCheck.gracePeriod);
    initialDelay.unref?.();

    return {
        stop() {
            stopped = true;
            if (initialDelay) {
                clearTimeout(initialDelay);
                initialDelay = null;
            }
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        },
    };
}

function createPmMemoryMonitor(
    record: PmRecord,
    pid: number | undefined,
    onFailure: (message: string) => void,
) {
    if (!record.maxMemoryBytes || !pid) {
        return {
            stop() {},
        };
    }

    const memoryLimit = record.maxMemoryBytes;
    let stopped = false;
    const timer = setInterval(() => {
        if (stopped) {
            return;
        }

        const memoryRssBytes = samplePmProcessMetrics(pid).memoryRssBytes;
        if (memoryRssBytes === undefined || memoryRssBytes <= memoryLimit) {
            return;
        }

        stopped = true;
        onFailure(`memory usage ${memoryRssBytes} exceeded limit ${memoryLimit}`);
    }, DEFAULT_PM_MEMORY_CHECK_INTERVAL);
    timer.unref?.();

    return {
        stop() {
            stopped = true;
            clearInterval(timer);
        },
    };
}

function createPmScheduleMonitor(
    record: PmRecord,
    onTrigger: (message: string) => void,
    onLog: (message: string) => void,
) {
    if (!record.cronRestart) {
        return {
            stop() {},
        };
    }

    const schedule = parsePmRestartSchedule(record.cronRestart, 'pm cronRestart');
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const armTimer = (from: Date = new Date()): void => {
        const nextOccurrence = resolveNextPmScheduleOccurrence(schedule, from);
        if (!nextOccurrence) {
            onLog(`schedule has no next occurrence: ${record.cronRestart}`);
            return;
        }

        const delayMs = Math.max(0, nextOccurrence.getTime() - Date.now());
        timer = setTimeout(() => {
            timer = null;
            if (stopped) {
                return;
            }

            onTrigger(`restart schedule matched: ${record.cronRestart}`);
        }, delayMs);
        timer.unref?.();
    };

    armTimer();

    return {
        stop() {
            stopped = true;
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        },
    };
}

function resolvePmRestartDelay(record: PmRecord, restartCount: number, shouldApplyBackoff: boolean): number {
    if (!shouldApplyBackoff || !record.expBackoffRestartDelay) {
        return record.restartDelay;
    }

    const exponent = Math.max(0, restartCount - 1);
    return Math.min(record.expBackoffRestartDelay * (2 ** exponent), DEFAULT_PM_EXP_BACKOFF_MAX_DELAY);
}

function readPlannedRestartRequest(state: { request: PmRestartRequest | null }) {
    return state.request;
}

export async function runManagedProcessLoop(filePath: string, initialRecord: PmRecord): Promise<void> {
    let record = initialRecord;
    let activeChild: ReturnType<typeof spawn> | null = null;
    let activeChildStopTimer: ReturnType<typeof setTimeout> | null = null;
    let stopRequested = false;
    const restartState: { request: PmRestartRequest | null } = { request: null };

    mkdirSync(dirname(initialRecord.logFiles.out), { recursive: true });
    mkdirSync(dirname(initialRecord.logFiles.err), { recursive: true });

    const stdoutLog = createWriteStream(initialRecord.logFiles.out, { flags: 'a' });
    const stderrLog = createWriteStream(initialRecord.logFiles.err, { flags: 'a' });

    const persist = (mutator: (current: PmRecord) => PmRecord): PmRecord => {
        const current = readLatestPmRecord(filePath, record);
        record = mutator(current);
        writePmRecord(filePath, record);
        return record;
    };

    const clearActiveChildStopTimer = (): void => {
        if (activeChildStopTimer) {
            clearTimeout(activeChildStopTimer);
            activeChildStopTimer = null;
        }
    };

    const scheduleForcedActiveChildStop = (timeoutMs: number, reason: string): void => {
        if (!activeChild?.pid || process.platform === 'win32') {
            return;
        }

        clearActiveChildStopTimer();
        activeChildStopTimer = setTimeout(() => {
            if (activeChild?.pid && isProcessAlive(activeChild.pid)) {
                writePmLog(stderrLog, `${reason} after ${timeoutMs}ms; forcing process termination`);
                terminateProcessTree(activeChild.pid, { force: true });
            }
        }, timeoutMs);
        activeChildStopTimer.unref?.();
    };

    const stopActiveChild = (): void => {
        if (!activeChild?.pid || !isProcessAlive(activeChild.pid)) {
            return;
        }

        const current = readLatestPmRecord(filePath, record);
        const stopTimeout = resolvePmStopTimeout(current);
        if (isPmOnlineWapkRecord(current) && activeChild.stdin && !activeChild.stdin.destroyed && activeChild.stdin.writable) {
            try {
                activeChild.stdin.end(`${PM_WAPK_ONLINE_SHUTDOWN_COMMAND}\n`);
                scheduleForcedActiveChildStop(stopTimeout, 'graceful WAPK online shutdown timed out');
                return;
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                writePmLog(stderrLog, `graceful WAPK online shutdown failed: ${message}`);
            }
        }

        terminateProcessTree(activeChild.pid);
        scheduleForcedActiveChildStop(stopTimeout, 'graceful shutdown timed out');
    };

    const requestManagedStop = (reason: string): void => {
        if (stopRequested) {
            return;
        }

        stopRequested = true;
        persist((current) => ({
            ...current,
            desiredState: 'stopped',
            status: 'stopping',
            updatedAt: new Date().toISOString(),
        }));
        writePmLog(stdoutLog, reason);
        stopActiveChild();
    };

    const handleStopSignal = (signal: string) => {
        requestManagedStop(`received ${signal}, stopping managed process`);
    };

    process.on('SIGINT', handleStopSignal);
    process.on('SIGTERM', handleStopSignal);

    persist((current) => ({
        ...current,
        runnerPid: process.pid,
        desiredState: 'running',
        status: 'starting',
        updatedAt: new Date().toISOString(),
    }));

    try {
        while (!stopRequested) {
            restartState.request = null;

            const latest = readLatestPmRecord(filePath, record);
            if (latest.desiredState === 'stopped') {
                break;
            }

            let command;
            try {
                command = buildPmCommand(latest);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                writePmLog(stderrLog, message);
                persist((current) => ({
                    ...current,
                    status: 'errored',
                    error: message,
                    runnerPid: undefined,
                    childPid: undefined,
                    updatedAt: new Date().toISOString(),
                }));
                return;
            }

            const onlineStdinShutdownEnabled = isPmOnlineWapkRecord(latest);
            const child = spawn(command.command, command.args, {
                cwd: latest.cwd,
                env: {
                    ...process.env,
                    ...latest.env,
                    ...command.env,
                    ELIT_PM_NAME: latest.name,
                    ELIT_PM_ID: latest.id,
                },
                stdio: [onlineStdinShutdownEnabled ? 'pipe' : 'ignore', 'pipe', 'pipe'],
                windowsHide: true,
                shell: command.shell,
            });
            const childStartedAt = Date.now();

            activeChild = child;
            if (child.stdout) {
                child.stdout.pipe(stdoutLog, { end: false });
            }
            if (child.stderr) {
                child.stderr.pipe(stderrLog, { end: false });
            }

            const startedAt = new Date().toISOString();
            const waitingForReady = latest.waitReady;
            persist((current) => ({
                ...current,
                status: waitingForReady ? 'starting' : 'online',
                commandPreview: command.preview,
                runtime: command.runtime ?? current.runtime,
                runnerPid: process.pid,
                childPid: child.pid,
                startedAt,
                stoppedAt: undefined,
                error: undefined,
                updatedAt: startedAt,
            }));
            writePmLog(stdoutLog, `started ${command.preview}${child.pid ? ` (pid ${child.pid})` : ''}`);

            const requestPlannedRestart = (kind: PmRestartRequest['kind'], detail: string): void => {
                if (stopRequested || restartState.request) {
                    return;
                }

                restartState.request = { kind, detail };
                writePmLog(kind === 'watch' || kind === 'cron' ? stdoutLog : stderrLog, `${kind} restart requested: ${detail}`);
                persist((current) => ({
                    ...current,
                    status: 'restarting',
                    updatedAt: new Date().toISOString(),
                }));
                stopActiveChild();
            };

            let healthMonitor = {
                stop() {},
            };
            let memoryMonitor = {
                stop() {},
            };
            let scheduleMonitor = {
                stop() {},
            };

            const startHealthMonitor = (): void => {
                healthMonitor = createPmHealthMonitor(
                    latest,
                    (message) => requestPlannedRestart('health', message),
                    (message) => writePmLog(stdoutLog, message),
                );
            };

            const readinessMonitor = createPmReadinessMonitor(
                latest,
                (message) => {
                    const readyAt = new Date().toISOString();
                    persist((current) => ({
                        ...current,
                        status: 'online',
                        updatedAt: readyAt,
                    }));
                    writePmLog(stdoutLog, message);
                    startHealthMonitor();
                },
                (message) => requestPlannedRestart('startup', message),
            );

            const watchController = await createPmWatchController(
                latest,
                (changedPath) => requestPlannedRestart('watch', changedPath),
                (message) => writePmLog(stderrLog, `watch error: ${message}`),
            );
            memoryMonitor = createPmMemoryMonitor(
                latest,
                child.pid,
                (message) => requestPlannedRestart('memory', message),
            );
            scheduleMonitor = createPmScheduleMonitor(
                latest,
                (message) => requestPlannedRestart('cron', message),
                (message) => writePmLog(stdoutLog, message),
            );
            if (!waitingForReady) {
                startHealthMonitor();
            }

            const desiredStatePoller = setInterval(() => {
                const latestRecord = readLatestPmRecord(filePath, record);
                if (!stopRequested && latestRecord.desiredState === 'stopped') {
                    requestManagedStop('stop requested by PM control state');
                }
            }, DEFAULT_PM_STOP_POLL_MS);
            desiredStatePoller.unref?.();

            const exitResult: any = await waitForManagedChildExit(child);
            clearInterval(desiredStatePoller);
            await watchController.close();
            readinessMonitor.stop();
            healthMonitor.stop();
            memoryMonitor.stop();
            scheduleMonitor.stop();
            clearActiveChildStopTimer();

            activeChild = null;
            const exitCode = waitForExit(exitResult.code, exitResult.signal);
            const current = readLatestPmRecord(filePath, record);
            const plannedRestart = readPlannedRestartRequest(restartState);
            const uptime = Math.max(0, Date.now() - childStartedAt);
            const wasStable = current.minUptime > 0 && uptime >= current.minUptime;

            if (exitResult.error) {
                writePmLog(stderrLog, exitResult.error);
            } else if (!plannedRestart) {
                writePmLog(stdoutLog, `process exited with code ${exitCode}`);
            }

            if (stopRequested || current.desiredState === 'stopped') {
                break;
            }

            const shouldRestartForExit = plannedRestart
                ? true
                : current.restartPolicy === 'always'
                    ? true
                    : current.restartPolicy === 'on-failure'
                        ? exitCode !== 0 || Boolean(exitResult.error)
                        : false;

            if (!shouldRestartForExit) {
                persist((latestRecord) => ({
                    ...latestRecord,
                    status: exitCode === 0 && !exitResult.error ? 'exited' : 'errored',
                    childPid: undefined,
                    runnerPid: undefined,
                    lastExitCode: exitCode,
                    error: exitCode === 0 && !exitResult.error ? undefined : exitResult.error ?? `Process exited with code ${exitCode}.`,
                    stoppedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }));
                return;
            }

            const shouldCountRestart = plannedRestart?.kind !== 'watch';
            const baseRestartCount = wasStable ? 0 : (current.restartCount ?? 0);
            const nextRestartCount = shouldCountRestart ? baseRestartCount + 1 : current.restartCount ?? 0;
            if (nextRestartCount > current.maxRestarts) {
                persist((latestRecord) => ({
                    ...latestRecord,
                    status: 'errored',
                    childPid: undefined,
                    runnerPid: undefined,
                    restartCount: nextRestartCount,
                    lastExitCode: exitCode,
                    error: plannedRestart
                        ? `Reached max restart attempts (${current.maxRestarts}) after ${plannedRestart.kind} restart requests.`
                        : `Reached max restart attempts (${current.maxRestarts}).`,
                    stoppedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }));
                writePmLog(stderrLog, `max restart attempts reached (${current.maxRestarts})`);
                return;
            }

            persist((latestRecord) => ({
                ...latestRecord,
                status: 'restarting',
                childPid: undefined,
                lastExitCode: exitCode,
                restartCount: nextRestartCount,
                error: undefined,
                updatedAt: new Date().toISOString(),
            }));
            const resolvedRestartDelay = resolvePmRestartDelay(current, nextRestartCount, shouldCountRestart && !wasStable);
            if (plannedRestart) {
                writePmLog(
                    plannedRestart.kind === 'health' || plannedRestart.kind === 'memory' || plannedRestart.kind === 'startup' ? stderrLog : stdoutLog,
                    `restarting in ${resolvedRestartDelay}ms after ${plannedRestart.kind}: ${plannedRestart.detail}`,
                );
            } else {
                writePmLog(stdoutLog, `restarting in ${resolvedRestartDelay}ms`);
            }
            await delay(resolvedRestartDelay);
        }
    } finally {
        stopRequested = true;
        stopActiveChild();
        clearActiveChildStopTimer();

        const finalRecord = readLatestPmRecord(filePath, record);
        writePmRecord(filePath, {
            ...finalRecord,
            desiredState: 'stopped',
            status:
                finalRecord.status === 'errored'
                    ? 'errored'
                    : finalRecord.status === 'exited'
                        ? 'exited'
                        : 'stopped',
            runnerPid: undefined,
            childPid: undefined,
            stoppedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        process.off('SIGINT', handleStopSignal);
        process.off('SIGTERM', handleStopSignal);

        await new Promise<void>((resolvePromise) => stdoutLog.end(resolvePromise));
        await new Promise<void>((resolvePromise) => stderrLog.end(resolvePromise));
    }
}

function parseRunnerArgs(args: string[]): ParsedPmRunnerArgs {
    let dataDir: string | undefined;
    let id: string | undefined;

    for (let index = 0; index < args.length; index++) {
        const arg = args[index];
        switch (arg) {
            case '--data-dir':
                dataDir = readRequiredValue(args, ++index, '--data-dir');
                break;
            case '--id':
                id = readRequiredValue(args, ++index, '--id');
                break;
            default:
                throw new Error(`Unknown internal pm runner option: ${arg}`);
        }
    }

    if (!dataDir || !id) {
        throw new Error('Usage: elit pm __run --data-dir <dir> --id <name>');
    }

    return {
        dataDir: resolve(dataDir),
        id,
    };
}

export async function runPmRunner(args: string[]): Promise<void> {
    const options = parseRunnerArgs(args);
    const paths: PmPaths = {
        dataDir: options.dataDir,
        appsDir: join(options.dataDir, 'apps'),
        logsDir: join(options.dataDir, 'logs'),
        dumpFile: join(options.dataDir, DEFAULT_PM_DUMP_FILE),
    };
    const match = findPmRecordMatch(paths, options.id);
    if (!match) {
        throw new Error(`PM record not found: ${options.id}`);
    }

    await runManagedProcessLoop(match.filePath, match.record);
}

export async function stopPmMatches(matches: PmRecordMatch[]): Promise<number> {
    let stopped = 0;

    for (const match of matches) {
        const updated: PmRecord = {
            ...match.record,
            desiredState: 'stopped',
            status: match.record.runnerPid ? 'stopping' : 'stopped',
            updatedAt: new Date().toISOString(),
            stoppedAt: new Date().toISOString(),
        };
        writePmRecord(match.filePath, updated);

        const stopTimeout = resolvePmStopTimeout(match.record);
        const runnerStopped = await waitForProcessTermination(match.record.runnerPid, stopTimeout);
        const childStopped = await waitForProcessTermination(
            match.record.childPid,
            runnerStopped ? DEFAULT_PM_STOP_POLL_MS : stopTimeout,
        );

        if (!runnerStopped && match.record.runnerPid && isProcessAlive(match.record.runnerPid)) {
            terminateProcessTree(match.record.runnerPid, { force: true });
            await waitForProcessTermination(match.record.runnerPid, DEFAULT_PM_STOP_POLL_MS);
        }

        if (!childStopped && match.record.childPid && isProcessAlive(match.record.childPid)) {
            terminateProcessTree(match.record.childPid, { force: true });
            await waitForProcessTermination(match.record.childPid, DEFAULT_PM_STOP_POLL_MS);
        }

        writePmRecord(match.filePath, {
            ...updated,
            runnerPid: undefined,
            childPid: undefined,
            status: 'stopped',
            updatedAt: new Date().toISOString(),
        });
        stopped += 1;
    }

    return stopped;
}