import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { EOL } from 'node:os';

import { loadConfig } from '../../shares/config';
import { printPmHelp, parsePmStartArgs, resolvePmAppDefinition, resolvePmStartDefinitions } from './config';
import {
    DEFAULT_LOG_LINES,
    type PmPaths,
    type PmRecord,
    type PmRecordMatch,
} from './shared';
import { normalizeIntegerOption, readRequiredValue } from './helpers';
import {
    ensurePmDirectories,
    findPmRecordMatch,
    listPmRecordMatches,
    readPmDumpFile,
    resolvePmPaths,
    syncPmRecordLiveness,
    toPmAppConfig,
    toSavedAppDefinition,
    toSavedPmAppConfig,
    writePmDumpFile,
} from './records';
import { startManagedProcess } from './process';
import { runPmRunner, stopPmMatches } from './runner';

async function runPmStart(args: string[]): Promise<void> {
    const parsed = parsePmStartArgs(args);
    const workspaceRoot = process.cwd();
    const config = await loadConfig(workspaceRoot);
    const paths = resolvePmPaths(config?.pm, workspaceRoot);
    const definitions = resolvePmStartDefinitions(parsed, config, workspaceRoot);
    const errors: string[] = [];

    for (const definition of definitions) {
        try {
            const record = await startManagedProcess(definition, paths);
            console.log(`[pm] started ${record.name} (${record.type})`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            errors.push(`[pm] ${definition.name}: ${message}`);
        }
    }

    if (errors.length > 0) {
        throw new Error(errors.join(EOL));
    }
}

async function loadPmContext() {
    const workspaceRoot = process.cwd();
    const config = await loadConfig(workspaceRoot);
    return {
        config,
        paths: resolvePmPaths(config?.pm, workspaceRoot),
    };
}

function resolveNamedMatches(paths: PmPaths, value: string): PmRecordMatch[] {
    if (value === 'all') {
        return listPmRecordMatches(paths).map(syncPmRecordLiveness);
    }

    const match = findPmRecordMatch(paths, value);
    return match ? [syncPmRecordLiveness(match)] : [];
}

function padCell(value: string, width: number): string {
    return value.length >= width ? value : `${value}${' '.repeat(width - value.length)}`;
}

function tailLogFile(filePath: string, lineCount: number): string {
    if (!existsSync(filePath)) {
        return '';
    }

    const lines = readFileSync(filePath, 'utf8').split(/\r?\n/).filter((line) => line.length > 0);
    return lines.slice(-lineCount).join(EOL);
}

function listPmMatches(paths: PmPaths): PmRecordMatch[] {
    return listPmRecordMatches(paths).map(syncPmRecordLiveness);
}

interface PmLiveMetrics {
    cpuPercent?: number;
    memoryRssBytes?: number;
    uptimeMs?: number;
    updatedAt?: string;
}

interface PmDisplayRecord {
    record: PmRecord;
    liveMetrics: PmLiveMetrics;
}

function isPmRecordActive(record: PmRecord): boolean {
    return record.desiredState === 'running' && (
        record.status === 'starting'
        || record.status === 'online'
        || record.status === 'restarting'
    );
}

function resolvePmUptimeMs(record: PmRecord): number | undefined {
    if (!isPmRecordActive(record) || !record.startedAt) {
        return undefined;
    }

    const startedTime = Date.parse(record.startedAt);
    if (Number.isNaN(startedTime)) {
        return undefined;
    }

    return Math.max(0, Date.now() - startedTime);
}

function sampleWindowsPmProcessMetrics(pid: number): Pick<PmLiveMetrics, 'cpuPercent' | 'memoryRssBytes'> {
    const script = [
        '$ErrorActionPreference = "Stop"',
        `$sample = Get-CimInstance -ClassName Win32_PerfFormattedData_PerfProc_Process -Filter "IDProcess = ${pid}" | Select-Object -First 1`,
        'if (-not $sample) { exit 2 }',
        '$cpu = [double]$sample.PercentProcessorTime',
        `$memory = if ($sample.PSObject.Properties.Match('WorkingSetPrivate').Count -gt 0) { [int64]$sample.WorkingSetPrivate } else { [int64](Get-Process -Id ${pid} -ErrorAction Stop).WorkingSet64 }`,
        'Write-Output ($cpu.ToString([System.Globalization.CultureInfo]::InvariantCulture) + "," + $memory)',
    ].join('; ');

    const result = spawnSync(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
        {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
            windowsHide: true,
        },
    );

    if (result.error || result.status !== 0) {
        return {};
    }

    const [cpuText, memoryText] = result.stdout.trim().split(',');
    const cpuPercent = Number.parseFloat((cpuText ?? '').replace(',', '.'));
    const memoryRssBytes = Number.parseInt(memoryText ?? '', 10);

    return {
        cpuPercent: Number.isFinite(cpuPercent) ? cpuPercent : undefined,
        memoryRssBytes: Number.isFinite(memoryRssBytes) ? memoryRssBytes : undefined,
    };
}

function samplePosixPmProcessMetrics(pid: number): Pick<PmLiveMetrics, 'cpuPercent' | 'memoryRssBytes'> {
    const result = spawnSync(
        'ps',
        ['-p', String(pid), '-o', '%cpu=', '-o', 'rss='],
        {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
            windowsHide: true,
        },
    );

    if (result.error || result.status !== 0) {
        return {};
    }

    const [cpuText, memoryText] = result.stdout.trim().split(/\s+/, 2);
    const cpuPercent = Number.parseFloat((cpuText ?? '').replace(',', '.'));
    const rssKilobytes = Number.parseInt(memoryText ?? '', 10);

    return {
        cpuPercent: Number.isFinite(cpuPercent) ? cpuPercent : undefined,
        memoryRssBytes: Number.isFinite(rssKilobytes) ? rssKilobytes * 1024 : undefined,
    };
}

function resolvePmLiveMetrics(record: PmRecord): PmLiveMetrics {
    const uptimeMs = resolvePmUptimeMs(record);
    if (!isPmRecordActive(record) || !record.childPid) {
        return { uptimeMs };
    }

    const sampledMetrics = process.platform === 'win32'
        ? sampleWindowsPmProcessMetrics(record.childPid)
        : samplePosixPmProcessMetrics(record.childPid);

    return {
        ...sampledMetrics,
        uptimeMs,
        updatedAt:
            sampledMetrics.cpuPercent !== undefined || sampledMetrics.memoryRssBytes !== undefined
                ? new Date().toISOString()
                : undefined,
    };
}

function toPmDisplayRecord(record: PmRecord): PmDisplayRecord {
    return {
        record,
        liveMetrics: resolvePmLiveMetrics(record),
    };
}

function serializePmRecord(record: PmRecord) {
    return {
        ...record,
        liveMetrics: resolvePmLiveMetrics(record),
    };
}

function parsePmFormatOption(args: string[], index: number, option: string): { format: 'table' | 'json'; nextIndex: number } {
    let value: string;

    if (option.startsWith('--format=')) {
        value = option.slice('--format='.length);
    } else {
        value = readRequiredValue(args, index + 1, '--format');
        index += 1;
    }

    if (value !== 'table' && value !== 'json') {
        throw new Error(`Unsupported pm output format: ${value}`);
    }

    return {
        format: value,
        nextIndex: index,
    };
}

function parsePmListArgs(args: string[]): { format: 'table' | 'json' } {
    let format: 'table' | 'json' = 'table';

    for (let index = 0; index < args.length; index++) {
        const arg = args[index];

        switch (arg) {
            case '--json':
                format = 'json';
                break;
            case '--format':
            default:
                if (arg === '--format' || arg.startsWith('--format=')) {
                    const parsed = parsePmFormatOption(args, index, arg);
                    format = parsed.format;
                    index = parsed.nextIndex;
                    break;
                }

                throw new Error(`Unknown pm list option: ${arg}`);
        }
    }

    return { format };
}

function parsePmShowArgs(args: string[]): { name: string; format: 'text' | 'json' } {
    let format: 'text' | 'json' = 'text';
    let name: string | undefined;

    for (let index = 0; index < args.length; index++) {
        const arg = args[index];

        switch (arg) {
            case '--json':
                format = 'json';
                break;
            case '--format':
            default:
                if (arg === '--format' || arg.startsWith('--format=')) {
                    const parsed = parsePmFormatOption(args, index, arg);
                    format = parsed.format === 'json' ? 'json' : 'text';
                    index = parsed.nextIndex;
                    break;
                }

                if (arg.startsWith('-')) {
                    throw new Error(`Unknown pm show option: ${arg}`);
                }

                if (name) {
                    throw new Error('pm show accepts exactly one process name.');
                }

                name = arg;
                break;
        }
    }

    if (!name) {
        throw new Error('Usage: elit pm show <name> [--json]');
    }

    return { name, format };
}

function formatPmDuration(durationMs: number): string {
    if (durationMs < 1000) {
        return `${durationMs}ms`;
    }

    const totalSeconds = Math.floor(durationMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts: string[] = [];

    if (days > 0) {
        parts.push(`${days}d`);
    }
    if (hours > 0) {
        parts.push(`${hours}h`);
    }
    if (minutes > 0) {
        parts.push(`${minutes}m`);
    }
    if (seconds > 0 || parts.length === 0) {
        parts.push(`${seconds}s`);
    }

    return parts.slice(0, 2).join(' ');
}

function formatPmCpuPercent(cpuPercent: number | undefined): string {
    if (cpuPercent === undefined || !Number.isFinite(cpuPercent)) {
        return '-';
    }

    return `${cpuPercent >= 100 ? cpuPercent.toFixed(0) : cpuPercent.toFixed(1)}%`;
}

function formatPmMemory(memoryRssBytes: number | undefined): string {
    if (memoryRssBytes === undefined || !Number.isFinite(memoryRssBytes) || memoryRssBytes < 0) {
        return '-';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = memoryRssBytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }

    const formatted = value >= 10 || unitIndex === 0
        ? value.toFixed(0)
        : value.toFixed(1);

    return `${formatted}${units[unitIndex]}`;
}

function formatPmUptime(uptimeMs: number | undefined): string {
    if (uptimeMs === undefined || !Number.isFinite(uptimeMs)) {
        return '-';
    }

    return formatPmDuration(Math.max(0, uptimeMs));
}

function formatPmTarget(record: PmRecordMatch['record']): string {
    if (record.script) {
        return record.script;
    }

    if (record.file) {
        return record.file;
    }

    if (record.wapk) {
        return record.wapk;
    }

    return '-';
}

function pushPmDetail(lines: string[], label: string, value: string): void {
    lines.push(`${padCell(`${label}:`, 18)} ${value}`);
}

function pushPmDetailList(lines: string[], label: string, values: string[]): void {
    if (values.length === 0) {
        pushPmDetail(lines, label, '-');
        return;
    }

    pushPmDetail(lines, label, values[0] ?? '-');
    for (const value of values.slice(1)) {
        lines.push(`${' '.repeat(20)} ${value}`);
    }
}

function formatPmRecordDetails(record: PmRecord, liveMetrics: PmLiveMetrics): string {
    const lines: string[] = [`Process: ${record.name}`];

    pushPmDetail(lines, 'id', record.id);
    pushPmDetail(lines, 'status', record.status);
    pushPmDetail(lines, 'desired state', record.desiredState);
    pushPmDetail(lines, 'cpu', formatPmCpuPercent(liveMetrics.cpuPercent));
    pushPmDetail(lines, 'memory', formatPmMemory(liveMetrics.memoryRssBytes));
    pushPmDetail(lines, 'uptime', formatPmUptime(liveMetrics.uptimeMs));
    pushPmDetail(lines, 'type', record.type);
    pushPmDetail(lines, 'source', record.source);
    pushPmDetail(lines, 'runtime', record.runtime ?? '-');
    pushPmDetail(lines, 'cwd', record.cwd);
    pushPmDetail(lines, 'target', formatPmTarget(record));
    pushPmDetail(lines, 'command', record.commandPreview || '-');
    pushPmDetail(lines, 'runner pid', record.runnerPid ? String(record.runnerPid) : '-');
    pushPmDetail(lines, 'child pid', record.childPid ? String(record.childPid) : '-');
    pushPmDetail(lines, 'restart count', `${record.restartCount}/${record.maxRestarts}`);
    pushPmDetail(lines, 'restart policy', record.restartPolicy);
    pushPmDetail(lines, 'restart delay', formatPmDuration(record.restartDelay));
    pushPmDetail(lines, 'min uptime', formatPmDuration(record.minUptime));
    pushPmDetail(lines, 'autorestart', record.autorestart ? 'enabled' : 'disabled');
    pushPmDetail(lines, 'watch', record.watch ? 'enabled' : 'disabled');
    pushPmDetail(lines, 'watch debounce', record.watch ? formatPmDuration(record.watchDebounce) : '-');
    pushPmDetailList(lines, 'watch paths', record.watchPaths);
    pushPmDetailList(lines, 'watch ignore', record.watchIgnore);

    if (record.healthCheck) {
        pushPmDetail(lines, 'health check', record.healthCheck.url);
        pushPmDetail(lines, 'health grace', formatPmDuration(record.healthCheck.gracePeriod));
        pushPmDetail(lines, 'health interval', formatPmDuration(record.healthCheck.interval));
        pushPmDetail(lines, 'health timeout', formatPmDuration(record.healthCheck.timeout));
        pushPmDetail(lines, 'health failures', String(record.healthCheck.maxFailures));
    } else {
        pushPmDetail(lines, 'health check', '-');
    }

    pushPmDetailList(lines, 'env', Object.entries(record.env).map(([key, value]) => `${key}=${value}`));
    pushPmDetail(lines, 'stdout log', record.logFiles.out);
    pushPmDetail(lines, 'stderr log', record.logFiles.err);
    pushPmDetail(lines, 'created at', record.createdAt);
    pushPmDetail(lines, 'updated at', record.updatedAt);
    pushPmDetail(lines, 'metrics at', liveMetrics.updatedAt ?? '-');
    pushPmDetail(lines, 'started at', record.startedAt ?? '-');
    pushPmDetail(lines, 'stopped at', record.stoppedAt ?? '-');
    pushPmDetail(lines, 'last exit', record.lastExitCode === undefined ? '-' : String(record.lastExitCode));
    pushPmDetail(lines, 'error', record.error ?? '-');

    return lines.join(EOL);
}

function printPmList(paths: PmPaths, format: 'table' | 'json' = 'table'): void {
    const matches = listPmMatches(paths).map((match) => toPmDisplayRecord(match.record));
    if (format === 'json') {
        console.log(JSON.stringify(matches.map((match) => ({ ...match.record, liveMetrics: match.liveMetrics })), null, 2));
        return;
    }

    if (matches.length === 0) {
        console.log('No managed processes found.');
        return;
    }

    const headers = [
        padCell('name', 20),
        padCell('status', 12),
        padCell('pid', 8),
        padCell('cpu', 8),
        padCell('memory', 10),
        padCell('uptime', 10),
        padCell('restarts', 10),
        padCell('type', 8),
        'runtime',
    ];

    console.log(headers.join('  '));
    for (const { record, liveMetrics } of matches) {
        console.log([
            padCell(record.name, 20),
            padCell(record.status, 12),
            padCell(record.childPid ? String(record.childPid) : '-', 8),
            padCell(formatPmCpuPercent(liveMetrics.cpuPercent), 8),
            padCell(formatPmMemory(liveMetrics.memoryRssBytes), 10),
            padCell(formatPmUptime(liveMetrics.uptimeMs), 10),
            padCell(String(record.restartCount ?? 0), 10),
            padCell(record.type, 8),
            record.runtime ?? '-',
        ].join('  '));
    }
}

async function runPmList(args: string[]): Promise<void> {
    const options = parsePmListArgs(args);
    const { paths } = await loadPmContext();
    printPmList(paths, options.format);
}

async function runPmShow(args: string[]): Promise<void> {
    const options = parsePmShowArgs(args);
    const { paths } = await loadPmContext();
    const match = findPmRecordMatch(paths, options.name);

    if (!match) {
        throw new Error(`No managed process found for: ${options.name}`);
    }

    const synced = syncPmRecordLiveness(match);
    if (options.format === 'json') {
        console.log(JSON.stringify(serializePmRecord(synced.record), null, 2));
        return;
    }

    console.log(formatPmRecordDetails(synced.record, resolvePmLiveMetrics(synced.record)));
}

async function runPmStop(args: string[]): Promise<void> {
    const target = args[0];
    if (!target) {
        throw new Error('Usage: elit pm stop <name|all>');
    }

    const { paths } = await loadPmContext();
    const matches = resolveNamedMatches(paths, target);
    if (matches.length === 0) {
        throw new Error(`No managed process found for: ${target}`);
    }

    const count = await stopPmMatches(matches);
    console.log(`[pm] stopped ${count} process${count === 1 ? '' : 'es'}`);
}

async function runPmRestart(args: string[]): Promise<void> {
    const target = args[0];
    if (!target) {
        throw new Error('Usage: elit pm restart <name|all>');
    }

    const { paths } = await loadPmContext();
    const matches = resolveNamedMatches(paths, target);
    if (matches.length === 0) {
        throw new Error(`No managed process found for: ${target}`);
    }

    await stopPmMatches(matches);

    const restarted: string[] = [];
    for (const match of matches) {
        const definition = resolvePmAppDefinition(
            toPmAppConfig(match.record),
            { name: match.record.name, env: {}, watchPaths: [], watchIgnore: [] },
            process.cwd(),
            match.record.source,
        );

        await startManagedProcess(definition, paths);
        restarted.push(match.record.name);
    }

    console.log(`[pm] restarted ${restarted.join(', ')}`);
}

async function runPmSave(): Promise<void> {
    const { paths } = await loadPmContext();
    ensurePmDirectories(paths);

    const runningApps = listPmRecordMatches(paths)
        .map(syncPmRecordLiveness)
        .filter((match) => match.record.desiredState === 'running' && (
            match.record.status === 'starting'
            || match.record.status === 'online'
            || match.record.status === 'restarting'
        ))
        .map((match) => toSavedAppDefinition(match.record));

    writePmDumpFile(paths.dumpFile, runningApps);
    console.log(`[pm] saved ${runningApps.length} process${runningApps.length === 1 ? '' : 'es'} to ${paths.dumpFile}`);
}

async function runPmResurrect(): Promise<void> {
    const { paths } = await loadPmContext();
    if (!existsSync(paths.dumpFile)) {
        throw new Error(`PM dump file not found: ${paths.dumpFile}`);
    }

    const dump = readPmDumpFile(paths.dumpFile);
    if (dump.apps.length === 0) {
        console.log('[pm] dump file is empty, nothing to resurrect');
        return;
    }

    const errors: string[] = [];
    let restored = 0;
    for (const app of dump.apps) {
        try {
            const definition = resolvePmAppDefinition(
                toSavedPmAppConfig(app),
                { name: app.name, env: {}, watchPaths: [], watchIgnore: [] },
                process.cwd(),
                'cli',
            );
            await startManagedProcess(definition, paths);
            restored += 1;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            errors.push(`[pm] ${app.name}: ${message}`);
        }
    }

    if (errors.length > 0) {
        throw new Error([`[pm] resurrected ${restored} process${restored === 1 ? '' : 'es'}`, ...errors].join(EOL));
    }

    console.log(`[pm] resurrected ${restored} process${restored === 1 ? '' : 'es'} from ${paths.dumpFile}`);
}

async function runPmDelete(args: string[]): Promise<void> {
    const target = args[0];
    if (!target) {
        throw new Error('Usage: elit pm delete <name|all>');
    }

    const { paths } = await loadPmContext();
    const matches = resolveNamedMatches(paths, target);
    if (matches.length === 0) {
        throw new Error(`No managed process found for: ${target}`);
    }

    await stopPmMatches(matches);

    for (const match of matches) {
        if (existsSync(match.record.logFiles.out)) {
            rmSync(match.record.logFiles.out, { force: true });
        }
        if (existsSync(match.record.logFiles.err)) {
            rmSync(match.record.logFiles.err, { force: true });
        }
        rmSync(match.filePath, { force: true });
    }

    console.log(`[pm] deleted ${matches.length} process${matches.length === 1 ? '' : 'es'}`);
}

async function runPmLogs(args: string[]): Promise<void> {
    if (args.length === 0) {
        throw new Error('Usage: elit pm logs <name> [--lines <n>] [--stderr]');
    }

    let name: string | undefined;
    let lineCount = DEFAULT_LOG_LINES;
    let stderrOnly = false;

    for (let index = 0; index < args.length; index++) {
        const arg = args[index];
        switch (arg) {
            case '--lines':
                lineCount = normalizeIntegerOption(readRequiredValue(args, ++index, '--lines'), '--lines', 1);
                break;
            case '--stderr':
                stderrOnly = true;
                break;
            default:
                if (arg.startsWith('-')) {
                    throw new Error(`Unknown pm logs option: ${arg}`);
                }
                if (name) {
                    throw new Error('pm logs accepts exactly one process name.');
                }
                name = arg;
                break;
        }
    }

    if (!name) {
        throw new Error('Usage: elit pm logs <name> [--lines <n>] [--stderr]');
    }

    const { paths } = await loadPmContext();
    const match = findPmRecordMatch(paths, name);
    if (!match) {
        throw new Error(`No managed process found for: ${name}`);
    }

    const stdoutContent = stderrOnly ? '' : tailLogFile(match.record.logFiles.out, lineCount);
    const stderrContent = tailLogFile(match.record.logFiles.err, lineCount);

    if (!stderrOnly) {
        console.log(`== stdout: ${match.record.logFiles.out} ==`);
        console.log(stdoutContent || '(empty)');
    }

    console.log(`== stderr: ${match.record.logFiles.err} ==`);
    console.log(stderrContent || '(empty)');
}

export async function runPmCommand(args: string[]): Promise<void> {
    if (args.length === 0 || args[0] === 'help' || args.includes('--help') || args.includes('-h')) {
        printPmHelp();
        return;
    }

    const command = args[0];

    switch (command) {
        case 'start':
            await runPmStart(args.slice(1));
            return;
        case 'list':
        case 'ls':
            await runPmList(args.slice(1));
            return;
        case 'jlist':
            await runPmList(['--json', ...args.slice(1)]);
            return;
        case 'show':
        case 'describe':
            await runPmShow(args.slice(1));
            return;
        case 'stop':
            await runPmStop(args.slice(1));
            return;
        case 'restart':
            await runPmRestart(args.slice(1));
            return;
        case 'delete':
        case 'remove':
        case 'rm':
            await runPmDelete(args.slice(1));
            return;
        case 'save':
            await runPmSave();
            return;
        case 'resurrect':
            await runPmResurrect();
            return;
        case 'logs':
            await runPmLogs(args.slice(1));
            return;
        case '__run':
            await runPmRunner(args.slice(1));
            return;
        default:
            throw new Error(`Unknown pm command: ${command}`);
    }
}