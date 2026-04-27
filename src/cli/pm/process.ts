import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';

import type { PmRuntimeName } from '../../shares/config';
import {
    PM_WAPK_ONLINE_STDIN_SHUTDOWN_ENV,
    type BuiltPmCommand,
    type PmPaths,
    type PmRecord,
    type ResolvedPmAppDefinition,
} from './shared';
import {
    appendPmWapkRunArgs,
    buildPmWapkPreview,
    isPmWapkOnlineRunConfig,
    isTypescriptFile,
    quoteCommandSegment,
    sanitizePmProcessName,
} from './helpers';
import {
    ensurePmDirectories,
    getPmRecordPath,
    isProcessAlive,
    readPmRecord,
    syncPmRecordLiveness,
    writePmRecord,
} from './records';

function readCurrentCliInvocation(): { command: string; args: string[] } {
    const cliEntry = process.argv[1];
    if (!cliEntry) {
        throw new Error('Unable to resolve the current Elit CLI entrypoint for pm runner startup.');
    }

    return {
        command: process.execPath,
        args: [...process.execArgv, cliEntry],
    };
}

function preferCurrentExecutable(runtime: PmRuntimeName): string {
    const executableName = basename(process.execPath).toLowerCase();

    if (runtime === 'node' && process.release?.name === 'node' && executableName.startsWith('node')) {
        return process.execPath;
    }

    if (runtime === 'bun' && process.versions?.bun && executableName.startsWith('bun')) {
        return process.execPath;
    }

    return runtime;
}

function commandExists(command: string): boolean {
    if (command.includes('\\') || command.includes('/')) {
        return existsSync(command);
    }

    const result = spawnSync(command, ['--version'], {
        stdio: 'ignore',
        windowsHide: true,
    });

    return !result.error;
}

function ensureCommandAvailable(command: string, displayName: string): void {
    if (commandExists(command)) {
        return;
    }

    throw new Error(`${displayName} was not found in PATH.`);
}

function resolveTsxExecutable(cwd: string): string | undefined {
    const localPath = join(cwd, 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
    if (existsSync(localPath)) {
        return localPath;
    }

    const globalCommand = process.platform === 'win32' ? 'tsx.cmd' : 'tsx';
    return commandExists(globalCommand) ? globalCommand : undefined;
}

function inferRuntimeFromFile(filePath: string): PmRuntimeName {
    if (isTypescriptFile(filePath) && commandExists('bun')) {
        return 'bun';
    }

    return 'node';
}

export function isPmOnlineWapkRecord(record: Pick<PmRecord, 'type' | 'wapkRun'>): boolean {
    return record.type === 'wapk' && isPmWapkOnlineRunConfig(record.wapkRun);
}

export function buildPmCommand(record: PmRecord): BuiltPmCommand {
    if (record.type === 'script') {
        return {
            command: record.script!,
            args: [],
            shell: true,
            runtime: record.runtime,
            preview: record.script!,
        };
    }

    if (record.type === 'wapk') {
        const cliInvocation = readCurrentCliInvocation();
        const args = [
            ...cliInvocation.args,
            'wapk',
            'run',
            record.wapk!,
        ];

        const previewParts = ['elit', 'wapk', 'run', quoteCommandSegment(record.wapk!)];
        const online = isPmOnlineWapkRecord(record);

        if (record.runtime && !online) {
            args.push('--runtime', record.runtime);
            previewParts.push('--runtime', record.runtime);
        }

        if (record.password) {
            args.push('--password', record.password);
            previewParts.push('--password', '******');
        }

        appendPmWapkRunArgs(args, previewParts, record.wapkRun);

        return {
            command: cliInvocation.command,
            args,
            env: online ? { [PM_WAPK_ONLINE_STDIN_SHUTDOWN_ENV]: '1' } : undefined,
            preview: previewParts.join(' '),
            runtime: online ? undefined : record.runtime,
        };
    }

    const runtime = record.runtime ?? inferRuntimeFromFile(record.file!);

    if (runtime === 'bun') {
        const executable = preferCurrentExecutable('bun');
        ensureCommandAvailable(executable, 'Bun runtime');
        return {
            command: executable,
            args: ['run', record.file!],
            runtime,
            preview: `${basename(executable)} run ${quoteCommandSegment(record.file!)}`,
        };
    }

    if (runtime === 'deno') {
        const executable = preferCurrentExecutable('deno');
        ensureCommandAvailable(executable, 'Deno runtime');
        return {
            command: executable,
            args: ['run', '--allow-all', record.file!],
            runtime,
            preview: `${basename(executable)} run --allow-all ${quoteCommandSegment(record.file!)}`,
        };
    }

    if (isTypescriptFile(record.file!)) {
        const tsxExecutable = resolveTsxExecutable(record.cwd);
        if (!tsxExecutable) {
            throw new Error('TypeScript file execution with runtime "node" requires tsx to be installed, or use --runtime bun.');
        }

        return {
            command: tsxExecutable,
            args: [record.file!],
            runtime,
            preview: `${basename(tsxExecutable)} ${quoteCommandSegment(record.file!)}`,
        };
    }

    const executable = preferCurrentExecutable('node');
    ensureCommandAvailable(executable, 'Node.js runtime');
    return {
        command: executable,
        args: [record.file!],
        runtime,
        preview: `${basename(executable)} ${quoteCommandSegment(record.file!)}`,
    };
}

function createRecordFromDefinition(definition: ResolvedPmAppDefinition, paths: PmPaths, existing?: PmRecord): PmRecord {
    const id = sanitizePmProcessName(definition.name);
    const now = new Date().toISOString();

    const preview = definition.type === 'script'
        ? definition.script!
        : definition.type === 'wapk'
            ? buildPmWapkPreview(definition.wapk!, definition.runtime, definition.password, definition.wapkRun)
            : `${definition.runtime ?? 'auto'} ${quoteCommandSegment(definition.file!)}`;

    return {
        id,
        name: definition.name,
        baseName: definition.baseName,
        instanceIndex: definition.instanceIndex,
        instances: definition.instances,
        type: definition.type,
        source: definition.source,
        cwd: definition.cwd,
        runtime: definition.runtime,
        env: definition.env,
        script: definition.script,
        file: definition.file,
        wapk: definition.wapk,
        wapkRun: definition.wapkRun,
        autorestart: definition.autorestart,
        restartDelay: definition.restartDelay,
        killTimeout: definition.killTimeout,
        maxRestarts: definition.maxRestarts,
        password: definition.password,
        restartPolicy: definition.restartPolicy,
        waitReady: definition.waitReady,
        listenTimeout: definition.listenTimeout,
        minUptime: definition.minUptime,
        watch: definition.watch,
        watchPaths: definition.watchPaths,
        watchIgnore: definition.watchIgnore,
        watchDebounce: definition.watchDebounce,
        healthCheck: definition.healthCheck,
        desiredState: 'running',
        status: 'starting',
        commandPreview: preview,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        startedAt: undefined,
        stoppedAt: undefined,
        runnerPid: undefined,
        childPid: undefined,
        restartCount: existing?.restartCount ?? 0,
        lastExitCode: existing?.lastExitCode,
        error: undefined,
        logFiles: existing?.logFiles ?? {
            out: join(paths.logsDir, `${id}.out.log`),
            err: join(paths.logsDir, `${id}.err.log`),
        },
    };
}

export function terminateProcessTree(pid: number, options?: { force?: boolean }): void {
    if (process.platform === 'win32') {
        const result = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
            stdio: 'ignore',
            windowsHide: true,
        });

        if (result.error && (result.error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw result.error;
        }

        return;
    }

    try {
        process.kill(pid, options?.force ? 'SIGKILL' : 'SIGTERM');
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== 'ESRCH') {
            throw error;
        }
    }
}

export function sendPmSignal(pid: number, signal: NodeJS.Signals): void {
    try {
        process.kill(pid, signal);
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== 'ESRCH') {
            throw error;
        }
    }
}

export async function startManagedProcess(definition: ResolvedPmAppDefinition, paths: PmPaths): Promise<PmRecord> {
    ensurePmDirectories(paths);

    const id = sanitizePmProcessName(definition.name);
    const recordPath = getPmRecordPath(paths, id);
    const existingMatch = existsSync(recordPath)
        ? syncPmRecordLiveness({ filePath: recordPath, record: readPmRecord(recordPath) })
        : undefined;

    if (existingMatch?.record.runnerPid && isProcessAlive(existingMatch.record.runnerPid)) {
        throw new Error(`Process "${definition.name}" is already running.`);
    }

    const record = createRecordFromDefinition(definition, paths, existingMatch?.record);
    writePmRecord(recordPath, record);

    const cliInvocation = readCurrentCliInvocation();
    const runner = spawn(cliInvocation.command, [
        ...cliInvocation.args,
        'pm',
        '__run',
        '--data-dir',
        paths.dataDir,
        '--id',
        record.id,
    ], {
        cwd: definition.cwd,
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        env: {
            ...process.env,
            ELIT_PM_INTERNAL: '1',
        },
    });

    if (!runner.pid) {
        throw new Error(`Failed to start process runner for "${definition.name}".`);
    }

    runner.unref();

    const startedRecord: PmRecord = {
        ...record,
        runnerPid: runner.pid,
        updatedAt: new Date().toISOString(),
    };
    writePmRecord(recordPath, startedRecord);
    return startedRecord;
}