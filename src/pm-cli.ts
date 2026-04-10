import { spawn, spawnSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { EOL } from 'node:os';
import { basename, dirname, extname, join, resolve } from 'node:path';

import { watch as createWatcher } from './chokidar';
import {
    loadConfig,
    type ElitConfig,
    type PmAppConfig,
    type PmConfig,
    type PmHealthCheckConfig,
    type PmRestartPolicy,
    type PmRuntimeName,
} from './config';

const DEFAULT_PM_DATA_DIR = join('.elit', 'pm');
const DEFAULT_PM_DUMP_FILE = 'dump.json';
const DEFAULT_RESTART_DELAY = 1000;
const DEFAULT_MAX_RESTARTS = 10;
const DEFAULT_WATCH_DEBOUNCE = 250;
const DEFAULT_MIN_UPTIME = 0;
const DEFAULT_HEALTHCHECK_GRACE_PERIOD = 5000;
const DEFAULT_HEALTHCHECK_INTERVAL = 10000;
const DEFAULT_HEALTHCHECK_TIMEOUT = 3000;
const DEFAULT_HEALTHCHECK_MAX_FAILURES = 3;
const DEFAULT_LOG_LINES = 40;
const PM_RECORD_EXTENSION = '.json';
const SUPPORTED_FILE_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts']);
const DEFAULT_WATCH_IGNORE = ['**/.git/**', '**/node_modules/**', '**/.elit/**'];

export type PmTargetType = 'script' | 'file' | 'wapk';
export type PmStatus = 'starting' | 'online' | 'restarting' | 'stopping' | 'stopped' | 'exited' | 'errored';

export interface PmResolvedHealthCheck {
    url: string;
    gracePeriod: number;
    interval: number;
    timeout: number;
    maxFailures: number;
}

export interface PmDumpFile {
    version: 1;
    savedAt: string;
    apps: PmSavedAppDefinition[];
}

export interface PmSavedAppDefinition {
    name: string;
    type: PmTargetType;
    cwd: string;
    runtime?: PmRuntimeName;
    env: Record<string, string>;
    script?: string;
    file?: string;
    wapk?: string;
    password?: string;
    restartPolicy: PmRestartPolicy;
    autorestart: boolean;
    restartDelay: number;
    maxRestarts: number;
    minUptime: number;
    watch: boolean;
    watchPaths: string[];
    watchIgnore: string[];
    watchDebounce: number;
    healthCheck?: PmResolvedHealthCheck;
}

export interface ParsedPmStartArgs {
    targetToken?: string;
    name?: string;
    script?: string;
    file?: string;
    wapk?: string;
    runtime?: PmRuntimeName;
    cwd?: string;
    env: Record<string, string>;
    autorestart?: boolean;
    restartDelay?: number;
    maxRestarts?: number;
    password?: string;
    restartPolicy?: PmRestartPolicy;
    minUptime?: number;
    watch?: boolean;
    watchPaths: string[];
    watchIgnore: string[];
    watchDebounce?: number;
    healthCheckUrl?: string;
    healthCheckGracePeriod?: number;
    healthCheckInterval?: number;
    healthCheckTimeout?: number;
    healthCheckMaxFailures?: number;
}

export interface ResolvedPmAppDefinition {
    name: string;
    type: PmTargetType;
    source: 'cli' | 'config';
    cwd: string;
    runtime?: PmRuntimeName;
    env: Record<string, string>;
    script?: string;
    file?: string;
    wapk?: string;
    autorestart: boolean;
    restartDelay: number;
    maxRestarts: number;
    password?: string;
    restartPolicy: PmRestartPolicy;
    minUptime: number;
    watch: boolean;
    watchPaths: string[];
    watchIgnore: string[];
    watchDebounce: number;
    healthCheck?: PmResolvedHealthCheck;
}

export interface PmRecord {
    id: string;
    name: string;
    type: PmTargetType;
    source: 'cli' | 'config';
    cwd: string;
    runtime?: PmRuntimeName;
    env: Record<string, string>;
    script?: string;
    file?: string;
    wapk?: string;
    autorestart: boolean;
    restartDelay: number;
    maxRestarts: number;
    password?: string;
    restartPolicy: PmRestartPolicy;
    minUptime: number;
    watch: boolean;
    watchPaths: string[];
    watchIgnore: string[];
    watchDebounce: number;
    healthCheck?: PmResolvedHealthCheck;
    desiredState: 'running' | 'stopped';
    status: PmStatus;
    commandPreview: string;
    createdAt: string;
    updatedAt: string;
    startedAt?: string;
    stoppedAt?: string;
    runnerPid?: number;
    childPid?: number;
    restartCount: number;
    lastExitCode?: number;
    error?: string;
    logFiles: {
        out: string;
        err: string;
    };
}

interface PmPaths {
    dataDir: string;
    appsDir: string;
    logsDir: string;
    dumpFile: string;
}

interface BuiltPmCommand {
    command: string;
    args: string[];
    shell?: boolean;
    runtime?: PmRuntimeName;
    preview: string;
}

interface PmRecordMatch {
    filePath: string;
    record: PmRecord;
}

interface ParsedPmRunnerArgs {
    dataDir: string;
    id: string;
}

function normalizePmRuntime(value: unknown, optionName = '--runtime'): PmRuntimeName | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    if (typeof value !== 'string') {
        throw new Error(`${optionName} must be one of: node, bun, deno`);
    }

    const runtime = value.trim().toLowerCase();
    if (runtime === 'node' || runtime === 'bun' || runtime === 'deno') {
        return runtime;
    }

    throw new Error(`${optionName} must be one of: node, bun, deno`);
}

function normalizePmRestartPolicy(value: unknown, optionName = '--restart-policy'): PmRestartPolicy | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    if (typeof value !== 'string') {
        throw new Error(`${optionName} must be one of: always, on-failure, never`);
    }

    const policy = value.trim().toLowerCase();
    if (policy === 'always' || policy === 'on-failure' || policy === 'never') {
        return policy;
    }

    throw new Error(`${optionName} must be one of: always, on-failure, never`);
}

function normalizeIntegerOption(value: string, optionName: string, min = 0): number {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < min) {
        throw new Error(`${optionName} must be a number >= ${min}`);
    }
    return parsed;
}

function sanitizePmProcessName(name: string): string {
    const sanitized = name
        .trim()
        .toLowerCase()
        .replace(/[<>:"/\\|?*\x00-\x1f]+/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    return sanitized.length > 0 ? sanitized : 'process';
}

function isTypescriptFile(filePath: string): boolean {
    const extension = extname(filePath).toLowerCase();
    return extension === '.ts' || extension === '.mts' || extension === '.cts';
}

function normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
}

function toWatchGlob(candidatePath: string): string {
    if (!existsSync(candidatePath)) {
        return candidatePath;
    }

    try {
        return statSync(candidatePath).isDirectory()
            ? join(candidatePath, '**', '*').replace(/\\/g, '/')
            : candidatePath;
    } catch {
        return candidatePath;
    }
}

function normalizeWatchPatterns(paths: string[], cwd: string): string[] {
    return paths
        .map((entry) => resolve(cwd, entry))
        .map(toWatchGlob)
        .map((entry) => entry.replace(/\\/g, '/'));
}

function normalizeWatchIgnorePatterns(paths: string[], cwd: string): string[] {
    return paths
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
        .map((entry) => {
            if (entry.includes('*') || entry.includes('?')) {
                return entry.replace(/\\/g, '/');
            }

            const resolvedPath = resolve(cwd, entry);
            return toWatchGlob(resolvedPath).replace(/\\/g, '/');
        });
}

function matchesGlobPattern(filePath: string, pattern: string): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const normalizedPattern = pattern.replace(/\\/g, '/');
    const regexPattern = normalizedPattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '.');

    return new RegExp(`^${regexPattern}$`).test(normalizedPath);
}

function isIgnoredWatchPath(filePath: string, patterns: string[]): boolean {
    return patterns.some((pattern) => matchesGlobPattern(filePath, pattern));
}

function normalizeHealthCheckConfig(value: unknown): PmResolvedHealthCheck | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }

    const config = value as PmHealthCheckConfig;
    if (typeof config.url !== 'string' || config.url.trim().length === 0) {
        return undefined;
    }

    return {
        url: config.url.trim(),
        gracePeriod: typeof config.gracePeriod === 'number' && Number.isFinite(config.gracePeriod)
            ? Math.max(0, Math.trunc(config.gracePeriod))
            : DEFAULT_HEALTHCHECK_GRACE_PERIOD,
        interval: typeof config.interval === 'number' && Number.isFinite(config.interval)
            ? Math.max(250, Math.trunc(config.interval))
            : DEFAULT_HEALTHCHECK_INTERVAL,
        timeout: typeof config.timeout === 'number' && Number.isFinite(config.timeout)
            ? Math.max(250, Math.trunc(config.timeout))
            : DEFAULT_HEALTHCHECK_TIMEOUT,
        maxFailures: typeof config.maxFailures === 'number' && Number.isFinite(config.maxFailures)
            ? Math.max(1, Math.trunc(config.maxFailures))
            : DEFAULT_HEALTHCHECK_MAX_FAILURES,
    };
}

function looksLikeManagedFile(value: string, cwd: string): boolean {
    const normalized = value.trim();
    if (!normalized) {
        return false;
    }

    if (normalized.toLowerCase().endsWith('.wapk')) {
        return true;
    }

    const extension = extname(normalized).toLowerCase();
    if (SUPPORTED_FILE_EXTENSIONS.has(extension)) {
        return true;
    }

    if (normalized.includes('/') || normalized.includes('\\') || normalized.startsWith('.')) {
        return existsSync(resolve(cwd, normalized));
    }

    return false;
}

function normalizeEnvMap(value: unknown): Record<string, string> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    const normalized: Record<string, string> = {};
    for (const [key, entryValue] of Object.entries(value)) {
        if (typeof entryValue === 'string') {
            normalized[key] = entryValue;
            continue;
        }

        if (typeof entryValue === 'number' || typeof entryValue === 'boolean') {
            normalized[key] = String(entryValue);
        }
    }

    return normalized;
}

function parsePmEnvEntry(input: string): [string, string] {
    const separatorIndex = input.indexOf('=');
    if (separatorIndex <= 0) {
        throw new Error('--env expects KEY=VALUE');
    }

    const key = input.slice(0, separatorIndex).trim();
    const value = input.slice(separatorIndex + 1);
    if (!key) {
        throw new Error('--env expects KEY=VALUE');
    }

    return [key, value];
}

function readRequiredValue(args: string[], index: number, optionName: string): string {
    const value = args[index];
    if (value === undefined) {
        throw new Error(`${optionName} requires a value.`);
    }
    return value;
}

function parsePmTarget(parsed: ParsedPmStartArgs, workspaceRoot: string): { configName?: string; script?: string; file?: string; wapk?: string } {
    if (parsed.script) {
        return { script: parsed.script };
    }

    if (parsed.file) {
        return { file: parsed.file };
    }

    if (parsed.wapk) {
        return { wapk: parsed.wapk };
    }

    if (!parsed.targetToken) {
        return {};
    }

    if (parsed.targetToken.toLowerCase().endsWith('.wapk')) {
        return { wapk: parsed.targetToken };
    }

    if (looksLikeManagedFile(parsed.targetToken, resolve(workspaceRoot, parsed.cwd ?? '.'))) {
        return { file: parsed.targetToken };
    }

    return { configName: parsed.targetToken };
}

function getConfiguredPmApps(config: ElitConfig | null): PmAppConfig[] {
    return Array.isArray(config?.pm?.apps) ? config!.pm!.apps! : [];
}

function defaultProcessName(base: { script?: string; file?: string; wapk?: string }, explicitName?: string): string {
    if (explicitName && explicitName.trim()) {
        return explicitName.trim();
    }

    if (base.file) {
        const fileName = basename(base.file, extname(base.file));
        return fileName || 'process';
    }

    if (base.wapk) {
        const fileName = basename(base.wapk, extname(base.wapk));
        return fileName || 'wapk-app';
    }

    if (base.script) {
        const candidate = base.script
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .join('-');

        return candidate || 'process';
    }

    return 'process';
}

function countDefinedTargets(app: Pick<PmAppConfig, 'script' | 'file' | 'wapk'>): number {
    return [app.script, app.file, app.wapk].filter(Boolean).length;
}

function resolvePmPaths(config: PmConfig | undefined, workspaceRoot: string): PmPaths {
    const dataDir = resolve(workspaceRoot, config?.dataDir ?? DEFAULT_PM_DATA_DIR);
    const dumpFile = config?.dumpFile
        ? resolve(workspaceRoot, config.dumpFile)
        : join(dataDir, DEFAULT_PM_DUMP_FILE);

    return {
        dataDir,
        appsDir: join(dataDir, 'apps'),
        logsDir: join(dataDir, 'logs'),
        dumpFile,
    };
}

function ensurePmDirectories(paths: PmPaths): void {
    mkdirSync(paths.dataDir, { recursive: true });
    mkdirSync(paths.appsDir, { recursive: true });
    mkdirSync(paths.logsDir, { recursive: true });
    mkdirSync(dirname(paths.dumpFile), { recursive: true });
}

function getPmRecordPath(paths: PmPaths, id: string): string {
    return join(paths.appsDir, `${id}${PM_RECORD_EXTENSION}`);
}

function readPmRecord(filePath: string): PmRecord {
    return JSON.parse(readFileSync(filePath, 'utf8')) as PmRecord;
}

function writePmRecord(filePath: string, record: PmRecord): void {
    writeFileSync(filePath, JSON.stringify(record, null, 2));
}

function toSavedAppDefinition(record: PmRecord): PmSavedAppDefinition {
    return {
        name: record.name,
        type: record.type,
        cwd: record.cwd,
        runtime: record.runtime,
        env: record.env,
        script: record.script,
        file: record.file,
        wapk: record.wapk,
        password: record.password,
        restartPolicy: record.restartPolicy,
        autorestart: record.autorestart,
        restartDelay: record.restartDelay,
        maxRestarts: record.maxRestarts,
        minUptime: record.minUptime,
        watch: record.watch,
        watchPaths: record.watchPaths,
        watchIgnore: record.watchIgnore,
        watchDebounce: record.watchDebounce,
        healthCheck: record.healthCheck,
    };
}

function writePmDumpFile(filePath: string, apps: PmSavedAppDefinition[]): void {
    const dump: PmDumpFile = {
        version: 1,
        savedAt: new Date().toISOString(),
        apps,
    };

    writeFileSync(filePath, JSON.stringify(dump, null, 2));
}

function readPmDumpFile(filePath: string): PmDumpFile {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as Partial<PmDumpFile>;
    if (parsed.version !== 1 || !Array.isArray(parsed.apps)) {
        throw new Error(`Invalid PM dump file: ${filePath}`);
    }

    return {
        version: 1,
        savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date(0).toISOString(),
        apps: parsed.apps as PmSavedAppDefinition[],
    };
}

function deriveDefaultWatchPaths(type: PmTargetType, cwd: string, file?: string, wapk?: string): string[] {
    if (type === 'file' && file) {
        return [file];
    }

    if (type === 'wapk' && wapk) {
        return [wapk];
    }

    return [cwd];
}

function normalizeResolvedWatchPaths(paths: string[], cwd: string, type: PmTargetType, file?: string, wapk?: string): string[] {
    const sourcePaths = paths.length > 0 ? paths : deriveDefaultWatchPaths(type, cwd, file, wapk);
    return normalizeWatchPatterns(sourcePaths, cwd);
}

function listPmRecordMatches(paths: PmPaths): PmRecordMatch[] {
    if (!existsSync(paths.appsDir)) {
        return [];
    }

    return readdirSync(paths.appsDir)
        .filter((entry) => entry.endsWith(PM_RECORD_EXTENSION))
        .map((entry) => {
            const filePath = join(paths.appsDir, entry);
            return {
                filePath,
                record: readPmRecord(filePath),
            };
        })
        .sort((left, right) => left.record.name.localeCompare(right.record.name));
}

function findPmRecordMatch(paths: PmPaths, nameOrId: string): PmRecordMatch | undefined {
    const directPath = getPmRecordPath(paths, sanitizePmProcessName(nameOrId));
    if (existsSync(directPath)) {
        return {
            filePath: directPath,
            record: readPmRecord(directPath),
        };
    }

    return listPmRecordMatches(paths).find((match) => match.record.name === nameOrId);
}

function isProcessAlive(pid: number | undefined): boolean {
    if (!pid || pid <= 0) {
        return false;
    }

    try {
        process.kill(pid, 0);
        return true;
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        return code === 'EPERM';
    }
}

function syncPmRecordLiveness(match: PmRecordMatch): PmRecordMatch {
    const { record } = match;
    if (record.desiredState === 'running' && record.runnerPid && !isProcessAlive(record.runnerPid)) {
        const updated: PmRecord = {
            ...record,
            status: record.status === 'stopping' ? 'stopped' : record.status === 'errored' ? 'errored' : 'exited',
            runnerPid: undefined,
            childPid: undefined,
            updatedAt: new Date().toISOString(),
        };

        writePmRecord(match.filePath, updated);
        return { ...match, record: updated };
    }

    if (record.childPid && !isProcessAlive(record.childPid)) {
        const updated: PmRecord = {
            ...record,
            childPid: undefined,
            updatedAt: new Date().toISOString(),
        };

        writePmRecord(match.filePath, updated);
        return { ...match, record: updated };
    }

    return match;
}

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

function quoteCommandSegment(value: string): string {
    return /\s/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value;
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

        if (record.runtime) {
            args.push('--runtime', record.runtime);
        }

        if (record.password) {
            args.push('--password', record.password);
        }

        const previewParts = ['elit', 'wapk', 'run', quoteCommandSegment(record.wapk!)];
        if (record.runtime) {
            previewParts.push('--runtime', record.runtime);
        }
        if (record.password) {
            previewParts.push('--password', '******');
        }

        return {
            command: cliInvocation.command,
            args,
            preview: previewParts.join(' '),
            runtime: record.runtime,
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
            ? `elit wapk run ${quoteCommandSegment(definition.wapk!)}${definition.runtime ? ` --runtime ${definition.runtime}` : ''}`
            : `${definition.runtime ?? 'auto'} ${quoteCommandSegment(definition.file!)}`;

    return {
        id,
        name: definition.name,
        type: definition.type,
        source: definition.source,
        cwd: definition.cwd,
        runtime: definition.runtime,
        env: definition.env,
        script: definition.script,
        file: definition.file,
        wapk: definition.wapk,
        autorestart: definition.autorestart,
        restartDelay: definition.restartDelay,
        maxRestarts: definition.maxRestarts,
        password: definition.password,
        restartPolicy: definition.restartPolicy,
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

function terminateProcessTree(pid: number): void {
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
        process.kill(pid, 'SIGTERM');
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== 'ESRCH') {
            throw error;
        }
    }
}

async function startManagedProcess(definition: ResolvedPmAppDefinition, paths: PmPaths): Promise<PmRecord> {
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

function readLatestPmRecord(filePath: string, fallback: PmRecord): PmRecord {
    return existsSync(filePath) ? readPmRecord(filePath) : fallback;
}

function writePmLog(stream: { write: (value: string) => unknown }, message: string): void {
    stream.write(`[elit pm] ${new Date().toISOString()} ${message}${EOL}`);
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

            if (!response.ok) {
                throw new Error(`health check returned ${response.status}`);
            }

            failureCount = 0;
        } catch (error) {
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

function readPlannedRestartRequest(state: { request: { kind: 'watch' | 'health'; detail: string } | null }) {
    return state.request;
}

async function runManagedProcessLoop(filePath: string, initialRecord: PmRecord): Promise<void> {
    let record = initialRecord;
    let activeChild: ReturnType<typeof spawn> | null = null;
    let stopRequested = false;
    const restartState: { request: { kind: 'watch' | 'health'; detail: string } | null } = { request: null };

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

    const stopActiveChild = (): void => {
        if (activeChild?.pid && isProcessAlive(activeChild.pid)) {
            terminateProcessTree(activeChild.pid);
        }
    };

    const handleStopSignal = (signal: string) => {
        stopRequested = true;
        persist((current) => ({
            ...current,
            desiredState: 'stopped',
            status: 'stopping',
            updatedAt: new Date().toISOString(),
        }));
        writePmLog(stdoutLog, `received ${signal}, stopping managed process`);
        stopActiveChild();
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

            let command: BuiltPmCommand;
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

            const child = spawn(command.command, command.args, {
                cwd: latest.cwd,
                env: {
                    ...process.env,
                    ...latest.env,
                    ELIT_PM_NAME: latest.name,
                    ELIT_PM_ID: latest.id,
                },
                stdio: ['ignore', 'pipe', 'pipe'],
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
            persist((current) => ({
                ...current,
                status: 'online',
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

            const requestPlannedRestart = (kind: 'watch' | 'health', detail: string): void => {
                if (stopRequested || restartState.request) {
                    return;
                }

                restartState.request = { kind, detail };
                writePmLog(kind === 'health' ? stderrLog : stdoutLog, `${kind} restart requested: ${detail}`);
                persist((current) => ({
                    ...current,
                    status: 'restarting',
                    updatedAt: new Date().toISOString(),
                }));
                stopActiveChild();
            };

            const watchController = await createPmWatchController(
                latest,
                (changedPath) => requestPlannedRestart('watch', changedPath),
                (message) => writePmLog(stderrLog, `watch error: ${message}`),
            );
            const healthMonitor = createPmHealthMonitor(
                latest,
                (message) => requestPlannedRestart('health', message),
                (message) => writePmLog(stdoutLog, message),
            );

            const exitResult: any = await waitForManagedChildExit(child);
            await watchController.close();
            healthMonitor.stop();

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
            if (plannedRestart) {
                writePmLog(
                    plannedRestart.kind === 'health' ? stderrLog : stdoutLog,
                    `restarting in ${current.restartDelay}ms after ${plannedRestart.kind}: ${plannedRestart.detail}`,
                );
            } else {
                writePmLog(stdoutLog, `restarting in ${current.restartDelay}ms`);
            }
            await delay(current.restartDelay);
        }
    } finally {
        stopRequested = true;
        stopActiveChild();

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

function resolveStartSelection(configApps: PmAppConfig[], parsed: ParsedPmStartArgs, workspaceRoot: string) {
    const target = parsePmTarget(parsed, workspaceRoot);
    const selectedName = target.configName ?? (!target.script && !target.file && !target.wapk ? parsed.name : undefined);
    const selected = selectedName
        ? configApps.find((app) => app.name === selectedName)
        : undefined;

    return {
        selected,
        startAll: !target.script && !target.file && !target.wapk && !selectedName,
        target,
    };
}

function toPmAppConfig(record: PmRecord): PmAppConfig {
    return {
        name: record.name,
        script: record.script,
        file: record.file,
        wapk: record.wapk,
        runtime: record.runtime,
        cwd: record.cwd,
        env: record.env,
        autorestart: record.autorestart,
        restartDelay: record.restartDelay,
        maxRestarts: record.maxRestarts,
        password: record.password,
        restartPolicy: record.restartPolicy,
        minUptime: record.minUptime,
        watch: record.watch,
        watchPaths: record.watchPaths,
        watchIgnore: record.watchIgnore,
        watchDebounce: record.watchDebounce,
        healthCheck: record.healthCheck,
    };
}

function toSavedPmAppConfig(app: PmSavedAppDefinition): PmAppConfig {
    return {
        name: app.name,
        script: app.script,
        file: app.file,
        wapk: app.wapk,
        runtime: app.runtime,
        cwd: app.cwd,
        env: app.env,
        autorestart: app.autorestart,
        restartDelay: app.restartDelay,
        maxRestarts: app.maxRestarts,
        password: app.password,
        restartPolicy: app.restartPolicy,
        minUptime: app.minUptime,
        watch: app.watch,
        watchPaths: app.watchPaths,
        watchIgnore: app.watchIgnore,
        watchDebounce: app.watchDebounce,
        healthCheck: app.healthCheck,
    };
}

function resolvePmAppDefinition(base: PmAppConfig | undefined, parsed: ParsedPmStartArgs, workspaceRoot: string, source: 'cli' | 'config'): ResolvedPmAppDefinition {
    const target = parsePmTarget(parsed, workspaceRoot);
    const resolvedCwd = resolve(workspaceRoot, parsed.cwd ?? base?.cwd ?? '.');

    const hasExplicitTarget = Boolean(target.script || target.file || target.wapk);
    const script = target.script ?? (hasExplicitTarget ? undefined : base?.script);
    const file = target.file
        ? resolve(resolvedCwd, target.file)
        : hasExplicitTarget
            ? undefined
            : base?.file
                ? resolve(resolvedCwd, base.file)
                : undefined;
    const wapk = target.wapk
        ? resolve(resolvedCwd, target.wapk)
        : hasExplicitTarget
            ? undefined
            : base?.wapk
                ? resolve(resolvedCwd, base.wapk)
                : undefined;

    const targetCount = countDefinedTargets({ script, file, wapk });
    if (targetCount === 0) {
        throw new Error('pm start requires one target: --script, --file, --wapk, or a configured app name.');
    }
    if (targetCount > 1) {
        throw new Error('A pm app must define exactly one of script, file, or wapk.');
    }

    const name = defaultProcessName({ script, file, wapk }, parsed.name ?? base?.name);
    const runtime = normalizePmRuntime(parsed.runtime ?? base?.runtime, '--runtime');

    let restartPolicy = normalizePmRestartPolicy(parsed.restartPolicy ?? base?.restartPolicy, '--restart-policy')
        ?? ((base?.autorestart ?? true) ? 'always' : 'never');

    if (parsed.autorestart === false) {
        restartPolicy = 'never';
    }

    const autorestart = restartPolicy !== 'never';
    const watch = parsed.watch ?? base?.watch ?? false;
    const configuredWatchPaths = parsed.watchPaths.length > 0 ? parsed.watchPaths : normalizeStringArray(base?.watchPaths);
    const configuredWatchIgnore = [
        ...DEFAULT_WATCH_IGNORE,
        ...normalizeStringArray(base?.watchIgnore),
        ...parsed.watchIgnore,
    ];
    const healthCheck = normalizeHealthCheckConfig(parsed.healthCheckUrl
        ? {
            url: parsed.healthCheckUrl,
            gracePeriod: parsed.healthCheckGracePeriod,
            interval: parsed.healthCheckInterval,
            timeout: parsed.healthCheckTimeout,
            maxFailures: parsed.healthCheckMaxFailures,
        }
        : base?.healthCheck);

    if ((parsed.password ?? base?.password) && !wapk) {
        throw new Error('--password is only supported when starting a WAPK app.');
    }

    return {
        name,
        type: script ? 'script' : wapk ? 'wapk' : 'file',
        source,
        cwd: resolvedCwd,
        runtime,
        env: {
            ...normalizeEnvMap(base?.env),
            ...parsed.env,
        },
        script,
        file,
        wapk,
        autorestart,
        restartDelay: parsed.restartDelay ?? base?.restartDelay ?? DEFAULT_RESTART_DELAY,
        maxRestarts: parsed.maxRestarts ?? base?.maxRestarts ?? DEFAULT_MAX_RESTARTS,
        password: parsed.password ?? base?.password,
        restartPolicy,
        minUptime: parsed.minUptime ?? base?.minUptime ?? DEFAULT_MIN_UPTIME,
        watch,
        watchPaths: watch ? normalizeResolvedWatchPaths(configuredWatchPaths, resolvedCwd, script ? 'script' : wapk ? 'wapk' : 'file', file, wapk) : [],
        watchIgnore: watch ? normalizeWatchIgnorePatterns(configuredWatchIgnore, resolvedCwd) : [],
        watchDebounce: parsed.watchDebounce ?? base?.watchDebounce ?? DEFAULT_WATCH_DEBOUNCE,
        healthCheck,
    };
}

export function resolvePmStartDefinitions(parsed: ParsedPmStartArgs, config: ElitConfig | null, workspaceRoot: string): ResolvedPmAppDefinition[] {
    const configApps = getConfiguredPmApps(config);
    const selection = resolveStartSelection(configApps, parsed, workspaceRoot);

    if (selection.startAll) {
        if (configApps.length === 0) {
            throw new Error('No pm apps configured in elit.config.* and no start target was provided.');
        }

        return configApps.map((app) => resolvePmAppDefinition(app, { ...parsed, name: app.name }, workspaceRoot, 'config'));
    }

    if (selection.selected) {
        return [resolvePmAppDefinition(selection.selected, parsed, workspaceRoot, 'config')];
    }

    return [resolvePmAppDefinition(undefined, parsed, workspaceRoot, 'cli')];
}

export function parsePmStartArgs(args: string[]): ParsedPmStartArgs {
    const parsed: ParsedPmStartArgs = {
        env: {},
        watchPaths: [],
        watchIgnore: [],
    };

    for (let index = 0; index < args.length; index++) {
        const arg = args[index];

        switch (arg) {
            case '--script':
                parsed.script = readRequiredValue(args, ++index, '--script');
                break;
            case '--file':
            case '-f':
                parsed.file = readRequiredValue(args, ++index, arg);
                break;
            case '--wapk':
                parsed.wapk = readRequiredValue(args, ++index, '--wapk');
                break;
            case '--runtime':
            case '-r':
                parsed.runtime = normalizePmRuntime(readRequiredValue(args, ++index, arg), arg);
                break;
            case '--name':
            case '-n':
                parsed.name = readRequiredValue(args, ++index, arg);
                break;
            case '--cwd':
                parsed.cwd = readRequiredValue(args, ++index, '--cwd');
                break;
            case '--env': {
                const [key, value] = parsePmEnvEntry(readRequiredValue(args, ++index, '--env'));
                parsed.env[key] = value;
                break;
            }
            case '--password':
                parsed.password = readRequiredValue(args, ++index, '--password');
                break;
            case '--restart-policy':
                parsed.restartPolicy = normalizePmRestartPolicy(readRequiredValue(args, ++index, '--restart-policy'));
                break;
            case '--min-uptime':
                parsed.minUptime = normalizeIntegerOption(readRequiredValue(args, ++index, '--min-uptime'), '--min-uptime');
                break;
            case '--watch':
                parsed.watch = true;
                break;
            case '--watch-path':
                parsed.watch = true;
                parsed.watchPaths.push(readRequiredValue(args, ++index, '--watch-path'));
                break;
            case '--watch-ignore':
                parsed.watch = true;
                parsed.watchIgnore.push(readRequiredValue(args, ++index, '--watch-ignore'));
                break;
            case '--watch-debounce':
                parsed.watch = true;
                parsed.watchDebounce = normalizeIntegerOption(readRequiredValue(args, ++index, '--watch-debounce'), '--watch-debounce');
                break;
            case '--health-url':
                parsed.healthCheckUrl = readRequiredValue(args, ++index, '--health-url');
                break;
            case '--health-grace-period':
                parsed.healthCheckGracePeriod = normalizeIntegerOption(readRequiredValue(args, ++index, '--health-grace-period'), '--health-grace-period');
                break;
            case '--health-interval':
                parsed.healthCheckInterval = normalizeIntegerOption(readRequiredValue(args, ++index, '--health-interval'), '--health-interval', 250);
                break;
            case '--health-timeout':
                parsed.healthCheckTimeout = normalizeIntegerOption(readRequiredValue(args, ++index, '--health-timeout'), '--health-timeout', 250);
                break;
            case '--health-max-failures':
                parsed.healthCheckMaxFailures = normalizeIntegerOption(readRequiredValue(args, ++index, '--health-max-failures'), '--health-max-failures', 1);
                break;
            case '--no-autorestart':
                parsed.autorestart = false;
                break;
            case '--restart-delay':
                parsed.restartDelay = normalizeIntegerOption(readRequiredValue(args, ++index, '--restart-delay'), '--restart-delay');
                break;
            case '--max-restarts':
                parsed.maxRestarts = normalizeIntegerOption(readRequiredValue(args, ++index, '--max-restarts'), '--max-restarts');
                break;
            default:
                if (arg.startsWith('-')) {
                    throw new Error(`Unknown pm option: ${arg}`);
                }

                if (parsed.targetToken) {
                    throw new Error('pm start accepts at most one positional target.');
                }

                parsed.targetToken = arg;
                break;
        }
    }

    const explicitTargets = [parsed.script, parsed.file, parsed.wapk].filter(Boolean);
    if (explicitTargets.length > 1) {
        throw new Error('Use only one target type per pm start: --script, --file, or --wapk.');
    }

    if (parsed.healthCheckUrl && !/^https?:\/\//i.test(parsed.healthCheckUrl)) {
        throw new Error('--health-url must be an absolute http:// or https:// URL');
    }

    return parsed;
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

async function runPmRunner(args: string[]): Promise<void> {
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

function printPmList(paths: PmPaths): void {
    const matches = listPmRecordMatches(paths).map(syncPmRecordLiveness);
    if (matches.length === 0) {
        console.log('No managed processes found.');
        return;
    }

    const headers = [
        padCell('name', 20),
        padCell('status', 12),
        padCell('pid', 8),
        padCell('restarts', 10),
        padCell('type', 8),
        'runtime',
    ];

    console.log(headers.join('  '));
    for (const { record } of matches) {
        console.log([
            padCell(record.name, 20),
            padCell(record.status, 12),
            padCell(record.childPid ? String(record.childPid) : '-', 8),
            padCell(String(record.restartCount ?? 0), 10),
            padCell(record.type, 8),
            record.runtime ?? '-',
        ].join('  '));
    }
}

function stopPmMatches(matches: PmRecordMatch[]): number {
    let stopped = 0;

    for (const match of matches) {
        const current = syncPmRecordLiveness(match);
        const updated: PmRecord = {
            ...current.record,
            desiredState: 'stopped',
            status: current.record.runnerPid ? 'stopping' : 'stopped',
            updatedAt: new Date().toISOString(),
            stoppedAt: new Date().toISOString(),
        };
        writePmRecord(current.filePath, updated);

        if (current.record.runnerPid && isProcessAlive(current.record.runnerPid)) {
            terminateProcessTree(current.record.runnerPid);
        } else if (current.record.childPid && isProcessAlive(current.record.childPid)) {
            terminateProcessTree(current.record.childPid);
        }

        writePmRecord(current.filePath, {
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

    const count = stopPmMatches(matches);
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

    stopPmMatches(matches);

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

    stopPmMatches(matches);

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

function printPmHelp(): void {
    console.log([
        '',
        'Elit PM - lightweight process manager',
        '',
        'Usage:',
        '  elit pm start --script "npm start" --name my-app --runtime node',
        '  elit pm start --wapk ./test.wapk --name my-app',
        '  elit pm start ./app.ts --name my-app',
        '  elit pm start --file ./app.js --name my-app',
        '  elit pm start my-app',
        '  elit pm start',
        '  elit pm list',
        '  elit pm stop <name|all>',
        '  elit pm restart <name|all>',
        '  elit pm delete <name|all>',
        '  elit pm save',
        '  elit pm resurrect',
        '  elit pm logs <name> --lines 100',
        '',
        'Start Options:',
        '  --script <command>          Run a shell command, for example: npm start',
        '  --file, -f <path>           Run a .js/.mjs/.cjs/.ts file',
        '  --wapk <file.wapk>          Run a packaged WAPK app',
        '  --runtime, -r <name>        Runtime override: node, bun, deno',
        '  --name, -n <name>           Process name used by list/stop/restart',
        '  --cwd <dir>                 Working directory for the managed process',
        '  --env KEY=VALUE             Add or override an environment variable',
        '  --password <value>          Password for locked WAPK archives',
        '  --restart-policy <mode>     Restart policy: always, on-failure, never',
        '  --min-uptime <ms>           Reset crash counter after this healthy uptime',
        '  --watch                     Restart when watched files change',
        '  --watch-path <path>         Add a file or directory to watch',
        '  --watch-ignore <pattern>    Ignore watched paths matching this glob-like pattern',
        '  --watch-debounce <ms>       Debounce file-triggered restarts (default 250)',
        '  --health-url <url>          Poll an HTTP endpoint and restart after repeated failures',
        '  --health-grace-period <ms>  Delay before the first health check (default 5000)',
        '  --health-interval <ms>      Health check interval (default 10000)',
        '  --health-timeout <ms>       Per-request health check timeout (default 3000)',
        '  --health-max-failures <n>   Consecutive failures before restart (default 3)',
        '  --no-autorestart            Disable automatic restart',
        '  --restart-delay <ms>        Delay between restart attempts (default 1000)',
        '  --max-restarts <count>      Maximum restart attempts (default 10)',
        '',
        'Config:',
        '  Add pm.apps[] to elit.config.* and run elit pm start to boot all configured apps.',
        '',
        'Example:',
        '  export default {',
        '    pm: {',
        '      apps: [',
        '        { name: "api", script: "npm start", cwd: ".", runtime: "node" },',
        '        { name: "worker", file: "./src/worker.ts", runtime: "bun" },',
        '        { name: "desktop-app", wapk: "./dist/app.wapk", runtime: "node" }',
        '      ]',
        '    }',
        '  }',
        '',
        'Notes:',
        '  - PM state and logs are stored in ./.elit/pm by default.',
        '  - elit pm save persists running apps to pm.dumpFile or ./.elit/pm/dump.json.',
        '  - elit pm resurrect restarts whatever was last saved by elit pm save.',
        '  - elit pm start <name> starts a configured app by name.',
        '  - TypeScript files with runtime node require tsx, otherwise use --runtime bun.',
        '  - WAPK processes are executed through elit wapk run inside the manager.',
    ].join('\n'));
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
        case 'ls': {
            const { paths } = await loadPmContext();
            printPmList(paths);
            return;
        }
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