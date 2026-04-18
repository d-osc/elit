import { join } from 'node:path';

import type { PmRestartPolicy, PmRuntimeName, WapkRunConfig } from '../../shares/config';

export const DEFAULT_PM_DATA_DIR = join('.elit', 'pm');
export const DEFAULT_PM_DUMP_FILE = 'dump.json';
export const DEFAULT_RESTART_DELAY = 1000;
export const DEFAULT_MAX_RESTARTS = 10;
export const DEFAULT_WATCH_DEBOUNCE = 250;
export const DEFAULT_MIN_UPTIME = 0;
export const DEFAULT_HEALTHCHECK_GRACE_PERIOD = 5000;
export const DEFAULT_HEALTHCHECK_INTERVAL = 10000;
export const DEFAULT_HEALTHCHECK_TIMEOUT = 3000;
export const DEFAULT_HEALTHCHECK_MAX_FAILURES = 3;
export const DEFAULT_LOG_LINES = 40;
export const DEFAULT_PM_STOP_POLL_MS = 100;
export const DEFAULT_PM_STOP_GRACE_PERIOD_MS = 5000;
export const PM_WAPK_ONLINE_STDIN_SHUTDOWN_ENV = 'ELIT_PM_WAPK_ONLINE_STDIN_SHUTDOWN';
export const PM_WAPK_ONLINE_SHUTDOWN_COMMAND = '__ELIT_PM_WAPK_ONLINE_SHUTDOWN__';
export const PM_WAPK_ONLINE_SHUTDOWN_TIMEOUT_MS = 8000;
export const PM_RECORD_EXTENSION = '.json';
export const SUPPORTED_FILE_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts']);
export const DEFAULT_WATCH_IGNORE = ['**/.git/**', '**/node_modules/**', '**/.elit/**'];
export const SIMPLE_PREVIEW_SEGMENT = /^[A-Za-z0-9_./:=+-]+$/;

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
    wapkRun?: WapkRunConfig;
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
    wapkRun?: WapkRunConfig;
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
    wapkRun?: WapkRunConfig;
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
    wapkRun?: WapkRunConfig;
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

export interface PmPaths {
    dataDir: string;
    appsDir: string;
    logsDir: string;
    dumpFile: string;
}

export interface BuiltPmCommand {
    command: string;
    args: string[];
    env?: Record<string, string>;
    shell?: boolean;
    runtime?: PmRuntimeName;
    preview: string;
}

export interface PmRecordMatch {
    filePath: string;
    record: PmRecord;
}

export interface ParsedPmRunnerArgs {
    dataDir: string;
    id: string;
}

export interface PmRestartRequest {
    kind: 'watch' | 'health';
    detail: string;
}