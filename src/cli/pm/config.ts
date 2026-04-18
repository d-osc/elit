import { resolve } from 'node:path';

import type { ElitConfig, PmAppConfig } from '../../shares/config';
import {
    DEFAULT_MAX_RESTARTS,
    DEFAULT_MIN_UPTIME,
    DEFAULT_RESTART_DELAY,
    DEFAULT_WATCH_DEBOUNCE,
    DEFAULT_WATCH_IGNORE,
    type ParsedPmStartArgs,
    type ResolvedPmAppDefinition,
} from './shared';
import {
    countDefinedPmWapkSources,
    looksLikeManagedFile,
    mergePmWapkRunConfig,
    normalizeEnvMap,
    normalizeHealthCheckConfig,
    normalizeIntegerOption,
    normalizePmRestartPolicy,
    normalizePmRuntime,
    normalizeStringArray,
    parsePmEnvEntry,
    readRequiredValue,
    resolvePmWapkSource,
    resolvePmWapkSourceToken,
    stripPmWapkSourceFromRunConfig,
    isWapkArchiveSpecifier,
} from './helpers';
import { normalizeResolvedWatchIgnorePaths, normalizeResolvedWatchPaths } from './records';

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

    if (isWapkArchiveSpecifier(parsed.targetToken)) {
        return { wapk: parsed.targetToken };
    }

    if (looksLikeManagedFile(parsed.targetToken, resolve(workspaceRoot, parsed.cwd ?? '.'))) {
        return { file: parsed.targetToken };
    }

    return { configName: parsed.targetToken };
}

function getConfiguredPmApps(config: ElitConfig | null): PmAppConfig[] {
    return Array.isArray(config?.pm?.apps) ? config.pm.apps : [];
}

function defaultProcessName(base: { script?: string; file?: string; wapk?: string }, explicitName?: string): string {
    if (explicitName && explicitName.trim()) {
        return explicitName.trim();
    }

    if (base.file) {
        const fileName = base.file.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, '');
        return fileName || 'process';
    }

    if (base.wapk) {
        const fileName = base.wapk.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, '');
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

function resolveStartSelection(configApps: PmAppConfig[], parsed: ParsedPmStartArgs, workspaceRoot: string) {
    const target = parsePmTarget(parsed, workspaceRoot);
    const hasExplicitWapkSource = Boolean(resolvePmWapkSourceToken(parsed.wapk, parsed.wapkRun));
    const selectedName = target.configName ?? (!target.script && !target.file && !target.wapk && !hasExplicitWapkSource ? parsed.name : undefined);
    const selected = selectedName
        ? configApps.find((app) => app.name === selectedName)
        : undefined;

    return {
        selected,
        startAll: !target.script && !target.file && !target.wapk && !hasExplicitWapkSource && !selectedName,
        target,
    };
}

export function resolvePmAppDefinition(base: PmAppConfig | undefined, parsed: ParsedPmStartArgs, workspaceRoot: string, source: 'cli' | 'config'): ResolvedPmAppDefinition {
    const target = parsePmTarget(parsed, workspaceRoot);
    const resolvedCwd = resolve(workspaceRoot, parsed.cwd ?? base?.cwd ?? '.');

    if (countDefinedPmWapkSources(parsed.wapk, parsed.wapkRun) > 1) {
        throw new Error('Use only one WAPK archive source per pm start: --wapk or --google-drive-file-id.');
    }

    if (countDefinedPmWapkSources(base?.wapk, base?.wapkRun) > 1) {
        throw new Error(`Configured pm app "${base?.name ?? parsed.name ?? 'app'}" must define only one WAPK archive source.`);
    }

    const explicitWapk = resolvePmWapkSource(resolvePmWapkSourceToken(target.wapk, parsed.wapkRun), resolvedCwd);
    const baseWapk = resolvePmWapkSource(resolvePmWapkSourceToken(base?.wapk, base?.wapkRun), resolvedCwd);
    const hasExplicitTarget = Boolean(target.script || target.file || explicitWapk);
    const script = target.script ?? (hasExplicitTarget ? undefined : base?.script);
    const file = target.file
        ? resolve(resolvedCwd, target.file)
        : hasExplicitTarget
            ? undefined
            : base?.file
                ? resolve(resolvedCwd, base.file)
                : undefined;
    const wapk = explicitWapk ?? (hasExplicitTarget ? undefined : baseWapk);

    const targetCount = countDefinedTargets({ script, file, wapk });
    if (targetCount === 0) {
        throw new Error('pm start requires one target: --script, --file, --wapk, or a configured app name.');
    }
    if (targetCount > 1) {
        throw new Error('A pm app must define exactly one of script, file, or wapk.');
    }

    const name = defaultProcessName({ script, file, wapk }, parsed.name ?? base?.name);
    const mergedWapkRun = mergePmWapkRunConfig(base?.wapkRun, parsed.wapkRun);
    const runtime = normalizePmRuntime(parsed.runtime ?? mergedWapkRun?.runtime ?? base?.runtime, '--runtime');

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

    const password = parsed.password ?? mergedWapkRun?.password ?? base?.password;
    const wapkRun = stripPmWapkSourceFromRunConfig(mergedWapkRun);

    if (password && !wapk) {
        throw new Error('--password is only supported when starting a WAPK app.');
    }

    if (wapkRun && !wapk) {
        throw new Error('WAPK run options are only supported when starting a WAPK app.');
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
        wapkRun,
        autorestart,
        restartDelay: parsed.restartDelay ?? base?.restartDelay ?? DEFAULT_RESTART_DELAY,
        maxRestarts: parsed.maxRestarts ?? base?.maxRestarts ?? DEFAULT_MAX_RESTARTS,
        password,
        restartPolicy,
        minUptime: parsed.minUptime ?? base?.minUptime ?? DEFAULT_MIN_UPTIME,
        watch,
        watchPaths: watch ? normalizeResolvedWatchPaths(configuredWatchPaths, resolvedCwd, script ? 'script' : wapk ? 'wapk' : 'file', file, wapk) : [],
        watchIgnore: watch ? normalizeResolvedWatchIgnorePaths(configuredWatchIgnore, resolvedCwd) : [],
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
            case '--google-drive-file-id':
                parsed.wapkRun = {
                    ...parsed.wapkRun,
                    googleDrive: {
                        ...parsed.wapkRun?.googleDrive,
                        fileId: readRequiredValue(args, ++index, '--google-drive-file-id'),
                    },
                };
                break;
            case '--google-drive-token-env':
                parsed.wapkRun = {
                    ...parsed.wapkRun,
                    googleDrive: {
                        ...parsed.wapkRun?.googleDrive,
                        accessTokenEnv: readRequiredValue(args, ++index, '--google-drive-token-env'),
                    },
                };
                break;
            case '--google-drive-access-token':
                parsed.wapkRun = {
                    ...parsed.wapkRun,
                    googleDrive: {
                        ...parsed.wapkRun?.googleDrive,
                        accessToken: readRequiredValue(args, ++index, '--google-drive-access-token'),
                    },
                };
                break;
            case '--google-drive-shared-drive':
                parsed.wapkRun = {
                    ...parsed.wapkRun,
                    googleDrive: {
                        ...parsed.wapkRun?.googleDrive,
                        supportsAllDrives: true,
                    },
                };
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
            case '--online':
                parsed.wapkRun = {
                    ...parsed.wapkRun,
                    online: true,
                };
                break;
            case '--online-url':
                parsed.wapkRun = {
                    ...parsed.wapkRun,
                    online: true,
                    onlineUrl: readRequiredValue(args, ++index, '--online-url'),
                };
                break;
            case '--sync-interval':
                parsed.wapkRun = {
                    ...parsed.wapkRun,
                    syncInterval: normalizeIntegerOption(readRequiredValue(args, ++index, '--sync-interval'), '--sync-interval', 50),
                };
                break;
            case '--watcher':
            case '--use-watcher':
                parsed.wapkRun = {
                    ...parsed.wapkRun,
                    useWatcher: true,
                };
                break;
            case '--archive-watch':
                parsed.wapkRun = {
                    ...parsed.wapkRun,
                    watchArchive: true,
                };
                break;
            case '--no-archive-watch':
                parsed.wapkRun = {
                    ...parsed.wapkRun,
                    watchArchive: false,
                };
                break;
            case '--archive-sync-interval':
                parsed.wapkRun = {
                    ...parsed.wapkRun,
                    archiveSyncInterval: normalizeIntegerOption(readRequiredValue(args, ++index, '--archive-sync-interval'), '--archive-sync-interval', 50),
                };
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

    if (countDefinedPmWapkSources(parsed.wapk, parsed.wapkRun) > 1) {
        throw new Error('Use only one WAPK archive source per pm start: --wapk or --google-drive-file-id.');
    }

    const explicitTargets = [parsed.script, parsed.file, resolvePmWapkSourceToken(parsed.wapk, parsed.wapkRun)].filter(Boolean);
    if (explicitTargets.length > 1) {
        throw new Error('Use only one target type per pm start: --script, --file, or --wapk.');
    }

    if (parsed.healthCheckUrl && !/^https?:\/\//i.test(parsed.healthCheckUrl)) {
        throw new Error('--health-url must be an absolute http:// or https:// URL');
    }

    return parsed;
}

export function printPmHelp(): void {
    console.log([
        '',
        'Elit PM - lightweight process manager',
        '',
        'Usage:',
        '  elit pm start --script "npm start" --name my-app --runtime node',
        '  elit pm start --wapk ./test.wapk --name my-app',
        '  elit pm start --wapk gdrive://<fileId> --name my-app',
        '  elit pm start --google-drive-file-id <fileId> --name my-app',
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
        '  --wapk <source>             Run a local .wapk file or a remote source like gdrive://<fileId>',
        '  --google-drive-file-id <id> Run a WAPK archive directly from Google Drive',
        '  --google-drive-token-env <name>  Env var containing the Google Drive OAuth token',
        '  --google-drive-access-token <value>  OAuth token forwarded to elit wapk run',
        '  --google-drive-shared-drive Forward supportsAllDrives=true for shared drives',
        '  --runtime, -r <name>        Runtime override: node, bun, deno',
        '  --name, -n <name>           Process name used by list/stop/restart',
        '  --cwd <dir>                 Working directory for the managed process',
        '  --env KEY=VALUE             Add or override an environment variable',
        '  --password <value>          Password for locked WAPK archives',
        '  --online                    Host the WAPK on Elit Run through PM instead of a local runtime',
        '  --online-url <url>          Elit Run URL used for PM-managed online WAPK hosting',
        '  --sync-interval <ms>        Forward WAPK live-sync write interval (>= 50ms)',
        '  --watcher, --use-watcher    Forward event-driven WAPK file watching',
        '  --archive-watch             Pull archive source changes back into the temp WAPK workdir',
        '  --no-archive-watch          Disable archive-source read sync for WAPK apps',
        '  --archive-sync-interval <ms>  Forward WAPK archive read-sync interval (>= 50ms)',
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
        '        { name: "desktop-app", wapk: "./dist/app.wapk", runtime: "node" },',
        '        { name: "drive-app", wapkRun: { googleDrive: { fileId: "1AbCdEfGhIjKlMnOp", accessTokenEnv: "GOOGLE_DRIVE_ACCESS_TOKEN" }, useWatcher: true, watchArchive: true } }',
        '        { name: "online-app", wapk: "./dist/app.wapk", wapkRun: { online: true, onlineUrl: "http://localhost:4179" } }',
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
        '  - WAPK PM apps can use local archives, gdrive://<fileId>, or pm.apps[].wapkRun.googleDrive.',
        '  - PM-managed WAPK online hosts close their Elit Run share session when you use elit pm stop, restart, or delete.',
    ].join('\n'));
}