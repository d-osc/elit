import { randomUUID } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { build as esbuild } from 'esbuild';
import { loadConfig, type DesktopConfig, type DesktopMode } from './config';
import { renderMaterializedNativeTree, type NativeTree } from './native';
import { loadNativeEntryResult } from './native-cli';
import type { DesktopRenderOptions } from './render-context';
import { resolveWorkspacePackageImport } from './workspace-package';

import {
    WAPK_RUNTIMES,
    createWapkLiveSync,
    getWapkRuntimeArgs,
    prepareWapkApp,
    resolveWapkRuntimeExecutable,
    type PreparedWapkApp,
    type WapkRuntimeName,
} from './wapk-cli';

type DesktopRuntimeName = 'quickjs' | 'bun' | 'node' | 'deno';
type DesktopCompilerName = 'auto' | 'none' | 'esbuild' | 'tsx' | 'tsup';
type DesktopFormat = 'iife' | 'cjs' | 'esm';
type DesktopPlatform = keyof typeof PLATFORMS;

type TsupModule = typeof import('tsup');

interface DesktopRunOptions {
    mode: DesktopMode;
    runtime: DesktopRuntimeName;
    compiler: DesktopCompilerName;
    exportName?: string;
    release: boolean;
    entry?: string;
}

interface DesktopBuildOptions extends DesktopRunOptions {
    outDir: string;
    platform?: DesktopPlatform;
}

interface EnsureBinaryOptions {
    runtime: DesktopRuntimeName;
    release: boolean;
    triple?: string;
    entryPath?: string;
}

interface EnsureNativeBinaryOptions {
    release: boolean;
    triple?: string;
    entryPath?: string;
}

interface PreparedEntry {
    appName: string;
    entryPath: string;
    cleanupPath?: string;
}

interface PreparedDesktopNativePayload {
    appName: string;
    payloadPath: string;
    cleanupPath?: string;
}

interface DesktopNativeWindowOptions {
    title: string;
    width: number;
    height: number;
    center: boolean;
    icon?: string;
    autoClose?: boolean;
}

interface DesktopNativeInteractionOutput {
    file?: string;
    stdout?: boolean;
    emitReady?: boolean;
}

interface DesktopNativePayload {
    window: DesktopNativeWindowOptions;
    resourceBaseDir?: string;
    interactionOutput?: DesktopNativeInteractionOutput;
    tree: NativeTree;
}

interface DesktopBootstrapEntry {
    bootstrapPath: string;
    cleanupPaths: string[];
}

interface DesktopWapkRunOptions {
    runtime?: WapkRuntimeName;
    release: boolean;
    file: string;
    syncInterval?: number;
    useWatcher?: boolean;
    password?: string;
}

const PACKAGE_ROOT = resolve(__dirname, '..');
const DESKTOP_RUNTIMES: DesktopRuntimeName[] = ['quickjs', 'bun', 'node', 'deno'];
const DESKTOP_COMPILERS: DesktopCompilerName[] = ['auto', 'none', 'esbuild', 'tsx', 'tsup'];
const BUILD_FEATURES: Record<DesktopRuntimeName, string[]> = {
    quickjs: ['runtime-quickjs'],
    bun: ['runtime-external'],
    node: ['runtime-external'],
    deno: ['runtime-external'],
};
const EMBED_MAGIC_V2 = Buffer.from([0x57, 0x41, 0x50, 0x4b, 0x52, 0x54, 0x00, 0x02]);
const EMBED_NATIVE_MAGIC_V1 = Buffer.from([0x45, 0x4c, 0x49, 0x54, 0x4e, 0x55, 0x49, 0x31]);
const EMBED_RUNTIME_CODE: Record<DesktopRuntimeName, number> = {
    quickjs: 1,
    bun: 2,
    node: 3,
    deno: 4,
};
const PLATFORMS = {
    windows: 'x86_64-pc-windows-msvc',
    win: 'x86_64-pc-windows-msvc',
    'windows-arm': 'aarch64-pc-windows-msvc',
    'win-arm': 'aarch64-pc-windows-msvc',
    linux: 'x86_64-unknown-linux-gnu',
    'linux-musl': 'x86_64-unknown-linux-musl',
    'linux-arm': 'aarch64-unknown-linux-gnu',
    macos: 'x86_64-apple-darwin',
    mac: 'x86_64-apple-darwin',
    darwin: 'x86_64-apple-darwin',
    'macos-arm': 'aarch64-apple-darwin',
    'mac-arm': 'aarch64-apple-darwin',
} as const;
const TS_LIKE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.jsx']);
type DesktopBootstrapSupportModuleName = 'desktop-auto-render' | 'render-context';

function toDesktopBootstrapImportPath(fromPath: string, toPath: string): string {
    const importPath = relative(dirname(fromPath), toPath).replace(/\\/g, '/');
    return importPath.startsWith('./') || importPath.startsWith('../') ? importPath : `./${importPath}`;
}

function formatDesktopDisplayName(value: string): string {
    if (!value) {
        return 'Elit';
    }

    return value
        .split(/[._-]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');
}

function resolveDesktopEntryDisplayName(entryPath: string, fallbackName: string): string {
    let currentDir = dirname(resolve(entryPath));

    while (true) {
        const packageJsonPath = join(currentDir, 'package.json');
        if (existsSync(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
                    appName?: string;
                    name?: string;
                    productName?: string;
                };
                const configuredName = packageJson.productName ?? packageJson.appName ?? packageJson.name;
                if (configuredName) {
                    return formatDesktopDisplayName(configuredName);
                }
            } catch {
                // Ignore invalid package metadata while walking upward.
            }
        }

        const parentDir = dirname(currentDir);
        if (parentDir === currentDir) {
            break;
        }
        currentDir = parentDir;
    }

    return formatDesktopDisplayName(fallbackName);
}

export function resolveDesktopBootstrapSupportModulePath(
    moduleName: DesktopBootstrapSupportModuleName,
    packageRoot = PACKAGE_ROOT,
): string {
    const candidates = [
        resolve(packageRoot, 'src', `${moduleName}.ts`),
        resolve(packageRoot, 'dist', `${moduleName}.mjs`),
    ];

    for (const candidate of candidates) {
        if (existsSync(candidate)) {
            return candidate;
        }
    }

    throw new Error(
        `Desktop support module "${moduleName}" was not found in ${packageRoot}. Expected one of: ${candidates.join(', ')}`,
    );
}

function createDesktopBootstrapEntry(entryPath: string, appName: string): DesktopBootstrapEntry {
    const bootstrapId = randomUUID();
    const bootstrapPath = join(dirname(entryPath), `.elit-desktop-bootstrap-${appName}-${bootstrapId}.ts`);
    const preludePath = join(dirname(entryPath), `.elit-desktop-prelude-${appName}-${bootstrapId}.ts`);
    const desktopAutoRenderPath = resolveDesktopBootstrapSupportModulePath('desktop-auto-render');
    const renderContextPath = resolveDesktopBootstrapSupportModulePath('render-context');
    const defaultTitle = `${resolveDesktopEntryDisplayName(entryPath, appName)} Desktop`;

    writeFileSync(
        preludePath,
        [
            `import { installDesktopRenderTracking } from ${JSON.stringify(toDesktopBootstrapImportPath(preludePath, desktopAutoRenderPath))};`,
            `import { clearCapturedRenderedVNode, clearDesktopRenderOptions, setRenderRuntimeTarget } from ${JSON.stringify(toDesktopBootstrapImportPath(preludePath, renderContextPath))};`,
            '',
            `setRenderRuntimeTarget(${JSON.stringify('desktop')});`,
            'clearCapturedRenderedVNode();',
            'clearDesktopRenderOptions();',
            'installDesktopRenderTracking();',
            '',
        ].join('\n'),
        'utf8',
    );

    writeFileSync(
        bootstrapPath,
        [
            `import { completeDesktopAutoRender } from ${JSON.stringify(toDesktopBootstrapImportPath(bootstrapPath, desktopAutoRenderPath))};`,
            `import ${JSON.stringify(toDesktopBootstrapImportPath(bootstrapPath, preludePath))};`,
            `import ${JSON.stringify(toDesktopBootstrapImportPath(bootstrapPath, entryPath))};`,
            '',
            `const desktopAutoRenderOptions = ${JSON.stringify({
                center: true,
                height: 720,
                title: defaultTitle,
                width: 1080,
            })};`,
            '',
            'try {',
            '    completeDesktopAutoRender(desktopAutoRenderOptions);',
            '} catch (error) {',
            '    console.error(error);',
            '    if (typeof process !== "undefined" && typeof process.exit === "function") {',
            '        process.exit(1);',
            '    }',
            '    throw error;',
            '}',
            '',
        ].join('\n'),
        'utf8',
    );

    return {
        bootstrapPath,
        cleanupPaths: [bootstrapPath, preludePath],
    };
}

function createWorkspacePackagePlugin(entryDir: string) {
    return {
        name: 'workspace-package-self-reference',
        setup(build: any) {
            build.onResolve({ filter: /^elit(?:\/.*)?$/ }, (args: { path: string; resolveDir?: string }) => {
                const resolved = resolveWorkspacePackageImport(args.path, args.resolveDir || entryDir);
                return resolved ? { path: resolved } : undefined;
            });
        },
    };
}

export async function runDesktopCommand(args: string[]): Promise<void> {
    if (args.includes('--help') || args.includes('-h')) {
        printDesktopHelp();
        return;
    }

    const config = await loadConfig();
    const desktopConfig = config?.desktop;

    if (args.length === 0 && !resolveConfiguredDesktopEntry(getDefaultDesktopMode(desktopConfig), desktopConfig)) {
        printDesktopHelp();
        return;
    }

    if (args[0] === 'wapk') {
        await runDesktopWapkCommand(args.slice(1), desktopConfig);
        return;
    }

    if (args[0] === 'run') {
        await runDesktopRuntime(parseDesktopRunArgs(args.slice(1), desktopConfig));
        return;
    }

    if (args[0] === 'build') {
        await buildDesktopBundle(parseDesktopBuildArgs(args.slice(1), desktopConfig));
        return;
    }

    await runDesktopRuntime(parseDesktopRunArgs(args, desktopConfig));
}

function parseDesktopRunArgs(args: string[], config?: DesktopConfig): DesktopRunOptions {
    const options: DesktopRunOptions = {
        mode: getDefaultDesktopMode(config),
        entry: undefined,
        exportName: config?.native?.exportName,
        runtime: config?.runtime ?? 'quickjs',
        compiler: config?.compiler ?? 'auto',
        release: config?.release ?? false,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--mode':
            case '-m': {
                const mode = args[++i];
                if (!mode) {
                    throw new Error('Missing value for --mode');
                }
                options.mode = parseDesktopMode(mode, '--mode');
                break;
            }
            case '--runtime':
            case '-r': {
                const runtime = args[++i] as DesktopRuntimeName | undefined;
                if (!runtime || !DESKTOP_RUNTIMES.includes(runtime)) {
                    throw new Error(`Unknown desktop runtime: ${runtime}`);
                }
                options.runtime = runtime;
                break;
            }
            case '--compiler':
            case '-c': {
                const compiler = args[++i] as DesktopCompilerName | undefined;
                if (!compiler || !DESKTOP_COMPILERS.includes(compiler)) {
                    throw new Error(`Unknown desktop compiler: ${compiler}`);
                }
                options.compiler = compiler;
                break;
            }
            case '--export': {
                const exportName = args[++i];
                if (!exportName) {
                    throw new Error('Missing value for --export');
                }
                options.exportName = exportName;
                break;
            }
            case '--release':
                options.release = true;
                break;
            default:
                if (!arg.startsWith('-')) {
                    options.entry = arg;
                }
                break;
        }
    }

    options.entry = options.entry ?? resolveConfiguredDesktopEntry(options.mode, config);

    if (!options.entry) {
        throw new Error(
            `Desktop ${options.mode} mode requires an entry file, either from the command line or ${desktopEntrySourceLabel(options.mode)} in elit.config.ts.`,
        );
    }

    return options;
}

function parseDesktopBuildArgs(args: string[], config?: DesktopConfig): DesktopBuildOptions {
    const options: DesktopBuildOptions = {
        mode: getDefaultDesktopMode(config),
        entry: undefined,
        exportName: config?.native?.exportName,
        runtime: config?.runtime ?? 'quickjs',
        compiler: config?.compiler ?? 'auto',
        release: config?.release ?? false,
        outDir: config?.outDir ?? 'dist',
        platform: config?.platform as DesktopPlatform | undefined,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--mode':
            case '-m': {
                const mode = args[++i];
                if (!mode) {
                    throw new Error('Missing value for --mode');
                }
                options.mode = parseDesktopMode(mode, '--mode');
                break;
            }
            case '--runtime':
            case '-r': {
                const runtime = args[++i] as DesktopRuntimeName | undefined;
                if (!runtime || !DESKTOP_RUNTIMES.includes(runtime)) {
                    throw new Error(`Unknown desktop runtime: ${runtime}`);
                }
                options.runtime = runtime;
                break;
            }
            case '--compiler':
            case '-c': {
                const compiler = args[++i] as DesktopCompilerName | undefined;
                if (!compiler || !DESKTOP_COMPILERS.includes(compiler)) {
                    throw new Error(`Unknown desktop compiler: ${compiler}`);
                }
                options.compiler = compiler;
                break;
            }
            case '--export': {
                const exportName = args[++i];
                if (!exportName) {
                    throw new Error('Missing value for --export');
                }
                options.exportName = exportName;
                break;
            }
            case '--platform':
            case '-p': {
                const platform = args[++i] as DesktopPlatform | undefined;
                if (!platform || !(platform in PLATFORMS)) {
                    throw new Error(`Unknown desktop platform: ${platform}`);
                }
                options.platform = platform;
                break;
            }
            case '--out-dir':
            case '-o': {
                const outDir = args[++i];
                if (!outDir) {
                    throw new Error('Desktop build requires an output directory value.');
                }
                options.outDir = outDir;
                break;
            }
            case '--release':
                options.release = true;
                break;
            default:
                if (!arg.startsWith('-')) {
                    options.entry = arg;
                }
                break;
        }
    }

    options.entry = options.entry ?? resolveConfiguredDesktopEntry(options.mode, config);

    return options;
}

export function parseDesktopMode(value: string, source: string): DesktopMode {
    if (value === 'native' || value === 'hybrid') {
        return value;
    }

    throw new Error(`Invalid ${source}: ${value}. Expected "native" or "hybrid".`);
}

export function getDefaultDesktopMode(config?: DesktopConfig): DesktopMode {
    if (config?.mode) {
        return parseDesktopMode(config.mode, 'desktop.mode');
    }

    return config?.native?.entry ? 'native' : 'hybrid';
}

export function resolveConfiguredDesktopEntry(mode: DesktopMode, config?: DesktopConfig): string | undefined {
    if (mode === 'native') {
        return config?.native?.entry ?? config?.entry;
    }

    return config?.entry;
}

function desktopEntrySourceLabel(mode: DesktopMode): string {
    return mode === 'native' ? 'desktop.native.entry' : 'desktop.entry';
}

function printDesktopHelp(): void {
    console.log([
        '',
        'Desktop mode for Elit',
        '',
        'Usage:',
        '  elit desktop [options] [entry]',
        '  elit desktop run [options] [entry]',
        '  elit desktop wapk [options] <file.wapk>',
        '  elit desktop wapk run [options] <file.wapk>',
        '  elit desktop build [options] [entry]',
        '  elit desktop build [options]',
        '',
        'Run options:',
        '  -m, --mode <name>        Desktop mode: hybrid, native',
        '  -r, --runtime <name>     Desktop runtime: quickjs, bun, node, deno',
        '  -c, --compiler <name>    Entry transpiler: auto, none, esbuild, tsx, tsup (default: auto)',
        '  --release                Use the release desktop runtime binary',
        '',
        'Build options:',
        '  -m, --mode <name>        Desktop mode: hybrid, native',
        '  -r, --runtime <name>     Runtime to embed in the app binary',
        '  -c, --compiler <name>    Entry transpiler: auto, none, esbuild, tsx, tsup (default: auto)',
        `  -p, --platform <name>    Target platform (${Object.keys(PLATFORMS).join(', ')})`,
        '  -o, --out-dir <dir>      Output directory (default: dist)',
        '  --release                Build the desktop runtime in release mode',
        '',
        'Desktop WAPK options:',
        '  -r, --runtime <name>     Packaged app runtime: node, bun, deno',
        '  --sync-interval <ms>     Polling interval for live sync (ms, default 300)',
        '  --watcher, --use-watcher Use event-driven file watcher instead of polling',
        '  --password <value>       Password used to unlock a protected archive',
        '  --release                Use the release desktop runtime binary',
        '',
        'Examples:',
        '  elit desktop src/main.ts',
        '  elit desktop run --mode native',
        '  elit desktop --runtime node app.ts',
        '  elit desktop wapk app.wapk',
        '  elit desktop wapk run app.wapk --runtime bun',
        '  elit desktop wapk app.wapk --watcher',
        '  elit desktop build src/main.ts',
        '  elit desktop build --mode native --release',
        '  elit desktop build --runtime bun --release src/main.ts',
        '',
        'Notes:',
        '  - Cargo is required to build the native WebView runtime.',
        '  - TypeScript and module-style QuickJS entries are transpiled automatically.',
        '  - The tsx compiler is Node-only and keeps loading the original source tree.',
        '  - The tsx and tsup compilers require those packages to be installed.',
        '  - desktop.mode defaults to "native" when desktop.native.entry exists, otherwise "hybrid".',
        '  - desktop.entry is used for hybrid mode. desktop.native.entry is used for native mode.',
        '  - Native mode falls back to desktop.entry when only the legacy desktop.entry is configured.',
        '  - Hybrid mode uses the WebView desktop runtime. Native mode renders the native IR in the dedicated native desktop runtime.',
        '  - When [entry] is omitted, Elit falls back to the configured entry for the resolved desktop mode.',
        '  - The build subcommand can be used without an entry to prebuild the native runtime.',
        '  - Desktop WAPK mode expects the packaged entry to start an HTTP app.',
        '  - Use --watcher for faster file change detection (less CPU usage).',
    ].join('\n'));
}

async function runDesktopWapkCommand(args: string[], config?: DesktopConfig): Promise<void> {
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        printDesktopHelp();
        return;
    }

    const options = parseDesktopWapkRunArgs(args, config?.wapk);
    const preparedApp = await prepareWapkApp(options.file, {
        runtime: options.runtime,
        syncInterval: options.syncInterval,
        useWatcher: options.useWatcher,
        password: options.password,
    });
    const preparedEntry = await createDesktopWapkEntry(preparedApp);
    const liveSync = createWapkLiveSync(preparedApp);

    try {
        const binary = ensureDesktopBinary({
            runtime: preparedApp.runtime,
            release: options.release,
            entryPath: preparedApp.entryPath,
        });

        const exitCode = await spawnDesktopProcess(binary, ['--runtime', preparedApp.runtime, preparedEntry.entryPath]);
        if (exitCode !== 0) {
            process.exit(exitCode);
        }
    } finally {
        await liveSync.stop();
        rmSync(preparedApp.workDir, { recursive: true, force: true });
        cleanupPreparedEntry(preparedEntry);
    }
}

function parseDesktopWapkRunArgs(args: string[], config?: DesktopConfig['wapk']): DesktopWapkRunOptions {
    const normalizedArgs = args[0] === 'run' ? args.slice(1) : args;
    const options: DesktopWapkRunOptions = {
        runtime: config?.runtime,
        release: config?.release ?? false,
        file: '',
        syncInterval: config?.syncInterval,
        useWatcher: config?.useWatcher,
    };

    for (let i = 0; i < normalizedArgs.length; i++) {
        const arg = normalizedArgs[i];

        switch (arg) {
            case '--runtime':
            case '-r': {
                const runtime = normalizedArgs[++i] as WapkRuntimeName | undefined;
                if (!runtime || !WAPK_RUNTIMES.includes(runtime)) {
                    throw new Error(`Unknown desktop WAPK runtime: ${runtime}`);
                }
                options.runtime = runtime;
                break;
            }
            case '--release':
                options.release = true;
                break;
            case '--sync-interval': {
                const value = parseInt(normalizedArgs[++i] ?? '', 10);
                if (Number.isNaN(value) || value < 50) {
                    throw new Error('--sync-interval must be a number >= 50 (milliseconds)');
                }
                options.syncInterval = value;
                break;
            }
            case '--use-watcher':
            case '--watcher': {
                options.useWatcher = true;
                break;
            }
            case '--password':
                options.password = normalizedArgs[++i];
                if (!options.password) {
                    throw new Error('--password requires a value.');
                }
                break;
            default:
                if (arg.startsWith('-')) {
                    throw new Error(`Unknown desktop WAPK option: ${arg}`);
                }
                if (options.file) {
                    throw new Error('Desktop WAPK mode accepts exactly one package file.');
                }
                options.file = arg;
                break;
        }
    }

    if (!options.file) {
        throw new Error('Usage: elit desktop wapk <file.wapk>');
    }

    return options;
}

async function createDesktopWapkEntry(preparedApp: PreparedWapkApp): Promise<PreparedEntry> {
    const port = await resolveDesktopWapkPort(preparedApp.header.port);
    const appName = sanitizeDesktopWapkName(preparedApp.header.name);
    const entryPath = join(preparedApp.workDir, `.elit-desktop-wapk-${appName}-${randomUUID()}.mjs`);
    const desktopOptions = buildDesktopWapkWindowOptions(preparedApp);
    const runtimeExecutable = resolveWapkRuntimeExecutable(preparedApp.runtime);
    const runtimeArgs = getWapkRuntimeArgs(preparedApp.runtime, preparedApp.entryPath);
    const env = {
        ...process.env,
        ...preparedApp.header.env,
        PORT: String(port),
    };

    writeFileSync(
        entryPath,
        [
            `import { spawn } from 'node:child_process';`,
            `import http from 'node:http';`,
            '',
            `const runtimeExecutable = ${JSON.stringify(runtimeExecutable)};`,
            `const runtimeArgs = ${JSON.stringify(runtimeArgs)};`,
            `const workDir = ${JSON.stringify(preparedApp.workDir)};`,
            `const runtimeEnv = ${JSON.stringify(env)};`,
            `const windowOptions = ${JSON.stringify(desktopOptions)};`,
            `const appUrl = ${JSON.stringify(`http://127.0.0.1:${port}`)};`,
            '',
            'function waitForServer(url, timeoutMs = 15000) {',
            '    return new Promise((resolvePromise, rejectPromise) => {',
            '        const startTime = Date.now();',
            '        const poll = () => {',
            '            const request = http.get(url, (response) => {',
            '                response.resume();',
            '                resolvePromise();',
            '            });',
            '            request.on(\'error\', () => {',
            '                if (Date.now() - startTime > timeoutMs) {',
            '                    rejectPromise(new Error(`Server did not start in ${timeoutMs}ms.`));',
            '                } else {',
            '                    setTimeout(poll, 200);',
            '                }',
            '            });',
            '            request.setTimeout(1000, () => {',
            '                request.destroy();',
            '            });',
            '        };',
            '        poll();',
            '    });',
            '}',
            '',
            'const child = spawn(runtimeExecutable, runtimeArgs, {',
            '    cwd: workDir,',
            '    env: runtimeEnv,',
            '    stdio: \"inherit\",',
            '    windowsHide: true,',
            '});',
            '',
            'const stopChild = () => {',
            '    try {',
            '        if (!child.killed) child.kill();',
            '    } catch {}',
            '};',
            '',
            'process.on(\'exit\', stopChild);',
            'process.on(\'SIGINT\', () => { stopChild(); process.exit(130); });',
            'process.on(\'SIGTERM\', () => { stopChild(); process.exit(143); });',
            '',
            'child.once(\'error\', (error) => {',
            '    console.error(error);',
            '    process.exit(1);',
            '});',
            '',
            'child.once(\'exit\', (code) => {',
            '    if (code && code !== 0) {',
            '        process.exit(code);',
            '        return;',
            '    }',
            '    if (typeof globalThis.windowQuit === \"function\") {',
            '        globalThis.windowQuit();',
            '    }',
            '});',
            '',
            '(async () => {',
            '    await waitForServer(appUrl);',
            '    if (typeof globalThis.createWindow !== \"function\") {',
            '        throw new Error(\'Desktop runtime did not expose createWindow().\');',
            '    }',
            '    globalThis.createWindow({ ...windowOptions, url: appUrl });',
            '})().catch((error) => {',
            '    console.error(error);',
            '    stopChild();',
            '    process.exit(1);',
            '});',
            '',
        ].join('\n'),
        'utf8',
    );

    return {
        appName,
        entryPath,
        cleanupPath: entryPath,
    };
}

function sanitizeDesktopWapkName(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]+/g, '-');
}

function buildDesktopWapkWindowOptions(preparedApp: PreparedWapkApp): Record<string, unknown> {
    const desktopOptions = preparedApp.header.desktop ? { ...preparedApp.header.desktop } : {};
    const icon = typeof desktopOptions.icon === 'string' ? desktopOptions.icon : undefined;

    if (icon && !/^(?:[a-z]+:)?[/\\]/i.test(icon)) {
        desktopOptions.icon = join(preparedApp.workDir, icon);
    }

    if (desktopOptions.title === undefined) {
        desktopOptions.title = preparedApp.header.name;
    }

    if (desktopOptions.width === undefined) {
        desktopOptions.width = 1280;
    }

    if (desktopOptions.height === undefined) {
        desktopOptions.height = 800;
    }

    if (desktopOptions.center === undefined) {
        desktopOptions.center = true;
    }

    delete desktopOptions.url;
    delete desktopOptions.proxy_port;
    delete desktopOptions.proxy_pipe;
    delete desktopOptions.proxy_secret;

    return desktopOptions;
}

async function resolveDesktopWapkPort(preferredPort?: number): Promise<number> {
    if (preferredPort) {
        return preferredPort;
    }

    const { createServer } = await import('node:net');
    return await new Promise<number>((resolvePromise, rejectPromise) => {
        const server = createServer();
        server.once('error', rejectPromise);
        server.listen(0, '127.0.0.1', () => {
            const address = server.address();
            server.close((closeError) => {
                if (closeError) {
                    rejectPromise(closeError);
                    return;
                }

                if (!address || typeof address === 'string') {
                    rejectPromise(new Error('Failed to allocate a desktop WAPK port.'));
                    return;
                }

                resolvePromise(address.port);
            });
        });
    });
}

async function runDesktopRuntime(options: DesktopRunOptions): Promise<void> {
    if (options.mode === 'native') {
        await runDesktopNativeRuntime(options);
        return;
    }

    const preparedEntry = await prepareEntry(options.entry!, options.runtime, options.compiler, 'run');

    try {
        const binary = ensureDesktopBinary({
            runtime: options.runtime,
            release: options.release,
            entryPath: options.entry,
        });

        const exitCode = await spawnDesktopProcess(binary, ['--runtime', options.runtime, preparedEntry.entryPath]);
        if (exitCode !== 0) {
            process.exit(exitCode);
        }
    } finally {
        cleanupPreparedEntry(preparedEntry);
    }
}

async function runDesktopNativeRuntime(options: DesktopRunOptions): Promise<void> {
    const preparedPayload = await prepareDesktopNativePayload(options);

    try {
        const binary = ensureDesktopNativeBinary({
            release: options.release,
            entryPath: options.entry,
        });

        const exitCode = await spawnDesktopProcess(binary, [preparedPayload.payloadPath]);
        if (exitCode !== 0) {
            process.exit(exitCode);
        }
    } finally {
        cleanupPreparedDesktopNativePayload(preparedPayload);
    }
}

async function buildDesktopBundle(options: DesktopBuildOptions): Promise<void> {
    if (options.mode === 'native') {
        await buildDesktopNativeBundle(options);
        return;
    }

    const triple = options.platform ? PLATFORMS[options.platform] : undefined;
    buildDesktopRuntime({
        runtime: options.runtime,
        release: options.release,
        triple,
        entryPath: options.entry,
    });
    const binary = findDesktopBinary(options.runtime, options.release, triple);

    if (!binary) {
        throw new Error('Desktop runtime binary was not found after cargo build completed.');
    }

    if (!options.entry) {
        console.log(`Desktop runtime ready: ${binary}`);
        return;
    }

    const preparedEntry = await prepareEntry(options.entry, options.runtime, options.compiler, 'build');

    try {
        const outDir = resolve(options.outDir);
        const binIsWindows = isWindowsTarget(triple);
        const outFile = join(outDir, `${preparedEntry.appName}${binIsWindows ? '.exe' : ''}`);
        const runtimeBytes = readFileSync(binary);
        const scriptBytes = readFileSync(preparedEntry.entryPath);
        const sizeBuffer = Buffer.allocUnsafe(8);
        sizeBuffer.writeBigUInt64LE(BigInt(scriptBytes.length));
        const runtimeCode = Buffer.from([EMBED_RUNTIME_CODE[options.runtime]]);

        mkdirSync(outDir, { recursive: true });
        writeFileSync(outFile, Buffer.concat([runtimeBytes, scriptBytes, sizeBuffer, runtimeCode, EMBED_MAGIC_V2]));

        if (!binIsWindows) {
            chmodSync(outFile, 0o755);
        }

        console.log(`Desktop app built: ${outFile}`);
    } finally {
        cleanupPreparedEntry(preparedEntry);
    }
}

async function buildDesktopNativeBundle(options: DesktopBuildOptions): Promise<void> {
    const triple = options.platform ? PLATFORMS[options.platform] : undefined;
    buildDesktopNativeRuntime({
        release: options.release,
        triple,
        entryPath: options.entry,
    });
    const binary = findDesktopNativeBinary(options.release, triple);

    if (!binary) {
        throw new Error('Desktop native runtime binary was not found after cargo build completed.');
    }

    if (!options.entry) {
        console.log(`Desktop native runtime ready: ${binary}`);
        return;
    }

    const preparedPayload = await prepareDesktopNativePayload(options);

    try {
        const outDir = resolve(options.outDir);
        const binIsWindows = isWindowsTarget(triple);
        const outFile = join(outDir, `${preparedPayload.appName}${binIsWindows ? '.exe' : ''}`);
        const runtimeBytes = readFileSync(binary);
        const payloadBytes = readFileSync(preparedPayload.payloadPath);
        const sizeBuffer = Buffer.allocUnsafe(8);
        sizeBuffer.writeBigUInt64LE(BigInt(payloadBytes.length));

        mkdirSync(outDir, { recursive: true });
        writeFileSync(outFile, Buffer.concat([runtimeBytes, payloadBytes, sizeBuffer, EMBED_NATIVE_MAGIC_V1]));

        if (!binIsWindows) {
            chmodSync(outFile, 0o755);
        }

        console.log(`Desktop native app built: ${outFile}`);
    } finally {
        cleanupPreparedDesktopNativePayload(preparedPayload);
    }
}

function ensureDesktopBinary(options: EnsureBinaryOptions): string {
    let binary = findDesktopBinary(options.runtime, options.release, options.triple);

    if (!binary || isDesktopRustBuildStale(binary)) {
        buildDesktopRuntime(options);
        binary = findDesktopBinary(options.runtime, options.release, options.triple);
    }

    if (!binary) {
        throw new Error('Desktop runtime binary was not found after cargo build completed.');
    }

    return binary;
}

function ensureDesktopNativeBinary(options: EnsureNativeBinaryOptions): string {
    let binary = findDesktopNativeBinary(options.release, options.triple);

    if (!binary || isDesktopRustBuildStale(binary)) {
        buildDesktopNativeRuntime(options);
        binary = findDesktopNativeBinary(options.release, options.triple);
    }

    if (!binary) {
        throw new Error('Desktop native runtime binary was not found after cargo build completed.');
    }

    return binary;
}

function buildDesktopRuntime(options: EnsureBinaryOptions): void {
    const args = [
        'build',
        '--manifest-path',
        resolve(PACKAGE_ROOT, 'Cargo.toml'),
        '--bin',
        'elit-desktop',
        '--no-default-features',
        '--features',
        BUILD_FEATURES[options.runtime].join(','),
    ];

    if (options.release) {
        args.push('--release');
    }

    if (options.triple) {
        args.push('--target', options.triple);
    }

    const env: NodeJS.ProcessEnv = {
        ...process.env,
        CARGO_TARGET_DIR: desktopCargoTargetDir(options.runtime),
    };

    const iconPath = resolveDesktopIcon(options.entryPath);
    if (iconPath) {
        env.ELIT_DESKTOP_EXE_ICON = iconPath;
        env.WAPK_EXE_ICON = iconPath;
    }

    const result = spawnSync('cargo', args, {
        cwd: PACKAGE_ROOT,
        env,
        stdio: 'inherit',
        windowsHide: true,
    });

    if (result.error) {
        if ((result.error as NodeJS.ErrnoException).code === 'ENOENT') {
            throw new Error('Cargo is required for desktop mode but was not found in PATH.');
        }

        throw result.error;
    }

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function buildDesktopNativeRuntime(options: EnsureNativeBinaryOptions): void {
    const args = [
        'build',
        '--manifest-path',
        resolve(PACKAGE_ROOT, 'Cargo.toml'),
        '--bin',
        'elit-desktop-native',
    ];

    if (options.release) {
        args.push('--release');
    }

    if (options.triple) {
        args.push('--target', options.triple);
    }

    const env: NodeJS.ProcessEnv = {
        ...process.env,
        CARGO_TARGET_DIR: desktopNativeCargoTargetDir(),
    };

    const iconPath = resolveDesktopIcon(options.entryPath);
    if (iconPath) {
        env.ELIT_DESKTOP_EXE_ICON = iconPath;
        env.WAPK_EXE_ICON = iconPath;
    }

    const result = spawnSync('cargo', args, {
        cwd: PACKAGE_ROOT,
        env,
        stdio: 'inherit',
        windowsHide: true,
    });

    if (result.error) {
        if ((result.error as NodeJS.ErrnoException).code === 'ENOENT') {
            throw new Error('Cargo is required for desktop native mode but was not found in PATH.');
        }

        throw result.error;
    }

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function findDesktopBinary(runtime: DesktopRuntimeName, release: boolean, triple?: string): string | null {
    const targetDir = desktopCargoTargetDir(runtime);
    const profile = release ? 'release' : 'debug';
    const binaryName = isWindowsTarget(triple) ? 'elit-desktop.exe' : 'elit-desktop';
    const candidates = triple
        ? [join(targetDir, triple, profile, binaryName)]
        : [join(targetDir, profile, binaryName)];

    for (const candidate of candidates) {
        if (existsSync(candidate)) {
            return candidate;
        }
    }

    return null;
}

function findDesktopNativeBinary(release: boolean, triple?: string): string | null {
    const targetDir = desktopNativeCargoTargetDir();
    const profile = release ? 'release' : 'debug';
    const binaryName = isWindowsTarget(triple) ? 'elit-desktop-native.exe' : 'elit-desktop-native';
    const candidates = triple
        ? [join(targetDir, triple, profile, binaryName)]
        : [join(targetDir, profile, binaryName)];

    for (const candidate of candidates) {
        if (existsSync(candidate)) {
            return candidate;
        }
    }

    return null;
}

function desktopCargoTargetDir(runtime: DesktopRuntimeName): string {
    return resolve(PACKAGE_ROOT, 'target', 'desktop', runtime);
}

function desktopNativeCargoTargetDir(): string {
    return resolve(PACKAGE_ROOT, 'target', 'desktop', 'native');
}

function isDesktopRustBuildStale(binaryPath: string): boolean {
    if (!existsSync(binaryPath)) {
        return true;
    }

    return statSync(binaryPath).mtimeMs < getLatestDesktopRustInputMtime();
}

let latestDesktopRustInputMtime: number | undefined;

function getLatestDesktopRustInputMtime(): number {
    if (latestDesktopRustInputMtime !== undefined) {
        return latestDesktopRustInputMtime;
    }

    latestDesktopRustInputMtime = Math.max(
        getPathModifiedTime(resolve(PACKAGE_ROOT, 'Cargo.toml')),
        getPathModifiedTime(resolve(PACKAGE_ROOT, 'src', 'desktop')),
    );
    return latestDesktopRustInputMtime;
}

function getPathModifiedTime(path: string): number {
    if (!existsSync(path)) {
        return 0;
    }

    const stats = statSync(path);
    if (!stats.isDirectory()) {
        return stats.mtimeMs;
    }

    let latest = stats.mtimeMs;
    for (const entry of readdirSync(path, { withFileTypes: true })) {
        latest = Math.max(latest, getPathModifiedTime(join(path, entry.name)));
    }

    return latest;
}

function resolveDesktopIcon(entryPath?: string): string | undefined {
    if (!entryPath) {
        return undefined;
    }

    const entryDir = dirname(resolve(entryPath));
    const projectDir = dirname(entryDir);
    const searchDirs = [
        entryDir,
        join(entryDir, 'public'),
        projectDir,
        join(projectDir, 'public'),
    ];
    const candidates = [
        'icon.ico',
        'icon.png',
        'icon.svg',
        'favicon.ico',
        'favicon.png',
        'favicon.svg',
    ];

    for (const searchDir of searchDirs) {
        for (const candidate of candidates) {
            const iconPath = join(searchDir, candidate);
            if (existsSync(iconPath)) {
                return iconPath;
            }
        }
    }

    return undefined;
}

function resolveDesktopNativeWindowIcon(entryPath: string, desktopRenderOptions?: DesktopRenderOptions): string | undefined {
    const configuredIcon = desktopRenderOptions?.icon;
    if (configuredIcon) {
        const candidate = /^(?:[a-z]+:)?[/\\]/i.test(configuredIcon)
            ? configuredIcon
            : resolve(dirname(resolve(entryPath)), configuredIcon);

        if (existsSync(candidate)) {
            return candidate;
        }
    }

    return resolveDesktopIcon(entryPath);
}

function resolveDesktopNativeWindowOptions(
    entryPath: string,
    appName: string,
    desktopRenderOptions?: DesktopRenderOptions,
): DesktopNativeWindowOptions {
    return {
        title: desktopRenderOptions?.title ?? `${resolveDesktopEntryDisplayName(entryPath, appName)} Desktop`,
        width: desktopRenderOptions?.width ?? 1080,
        height: desktopRenderOptions?.height ?? 720,
        center: desktopRenderOptions?.center ?? true,
        autoClose: desktopRenderOptions?.autoClose ?? false,
        ...(resolveDesktopNativeWindowIcon(entryPath, desktopRenderOptions)
            ? { icon: resolveDesktopNativeWindowIcon(entryPath, desktopRenderOptions) }
            : {}),
    };
}

function resolveDesktopNativeInteractionOutput(
    entryPath: string,
    desktopRenderOptions?: DesktopRenderOptions,
): DesktopNativeInteractionOutput | undefined {
    const output = desktopRenderOptions?.interactionOutput;
    if (!output || (!output.file && output.stdout !== true)) {
        return undefined;
    }

    const resolvedFile = output.file
        ? (/^(?:[a-z]+:)?[/\\]/i.test(output.file)
            ? output.file
            : resolve(dirname(resolve(entryPath)), output.file))
        : undefined;

    return {
        ...(resolvedFile ? { file: resolvedFile } : {}),
        ...(output.stdout ? { stdout: true } : {}),
        ...(output.emitReady ? { emitReady: true } : {}),
    };
}

async function prepareDesktopNativePayload(options: Pick<DesktopRunOptions, 'entry' | 'exportName'>): Promise<PreparedDesktopNativePayload> {
    const entryPath = resolve(options.entry!);

    if (!existsSync(entryPath)) {
        throw new Error(`Desktop native entry not found: ${entryPath}`);
    }

    const appName = basename(entryPath, extname(entryPath));
    const loadedEntry = await loadNativeEntryResult(entryPath, options.exportName, 'desktop');
    const payloadPath = join(dirname(entryPath), `.elit-desktop-native-${appName}-${randomUUID()}.json`);
    const interactionOutput = resolveDesktopNativeInteractionOutput(entryPath, loadedEntry.desktopRenderOptions);
    const payload: DesktopNativePayload = {
        window: resolveDesktopNativeWindowOptions(entryPath, appName, loadedEntry.desktopRenderOptions),
        resourceBaseDir: dirname(entryPath),
        ...(interactionOutput ? { interactionOutput } : {}),
        tree: renderMaterializedNativeTree(loadedEntry.entry, { platform: 'generic' }),
    };

    writeFileSync(payloadPath, JSON.stringify(payload, null, 2), 'utf8');

    return {
        appName,
        payloadPath,
        cleanupPath: payloadPath,
    };
}

async function prepareEntry(
    entry: string,
    runtime: DesktopRuntimeName,
    compiler: DesktopCompilerName,
    mode: 'run' | 'build',
): Promise<PreparedEntry> {
    const entryPath = resolve(entry);

    if (!existsSync(entryPath)) {
        throw new Error(`Desktop entry not found: ${entryPath}`);
    }

    const appName = basename(entryPath, extname(entryPath));
    const shouldCompile = shouldCompileEntry(entryPath, runtime, compiler, mode);
    if (!shouldCompile) {
        return { appName, entryPath };
    }

    const bootstrapEntry = createDesktopBootstrapEntry(entryPath, appName);

    const output = compileTarget(runtime);
    const compiledPath = join(dirname(entryPath), `.elit-desktop-${appName}-${randomUUID()}${output.extension}`);

    try {
        await compileDesktopEntry({
            appName,
            compiledPath,
            compiler,
            entryPath: bootstrapEntry.bootstrapPath,
            mode,
            output,
            runtime,
        });
    } catch (error) {
        cleanupPreparedEntry({ appName, entryPath: compiledPath, cleanupPath: compiledPath });
        throw error;
    } finally {
        for (const cleanupPath of bootstrapEntry.cleanupPaths) {
            if (existsSync(cleanupPath)) {
                rmSync(cleanupPath, { force: true });
            }
        }
    }

    return {
        appName,
        entryPath: compiledPath,
        cleanupPath: compiledPath,
    };
}

function shouldCompileEntry(
    entryPath: string,
    runtime: DesktopRuntimeName,
    compiler: DesktopCompilerName,
    mode: 'run' | 'build',
): boolean {
    if (compiler === 'none') {
        return false;
    }

    if (compiler === 'esbuild' || compiler === 'tsx' || compiler === 'tsup') {
        return true;
    }

    return mode === 'build' || runtime === 'quickjs' || TS_LIKE_EXTENSIONS.has(extname(entryPath).toLowerCase());
}

async function compileDesktopEntry(options: {
    appName: string;
    compiledPath: string;
    compiler: DesktopCompilerName;
    entryPath: string;
    mode: 'run' | 'build';
    output: { extension: string; format: DesktopFormat; platform: 'neutral' | 'node' };
    runtime: DesktopRuntimeName;
}): Promise<void> {
    switch (options.compiler) {
        case 'tsup':
            await compileDesktopEntryWithTsup(options);
            return;
        case 'tsx':
            await compileDesktopEntryWithTsx(options);
            return;
        case 'auto':
        case 'esbuild':
        default:
            await compileDesktopEntryWithEsbuild(options);
            return;
    }
}

async function compileDesktopEntryWithEsbuild(options: {
    compiledPath: string;
    entryPath: string;
    output: { extension: string; format: DesktopFormat; platform: 'neutral' | 'node' };
    runtime: DesktopRuntimeName;
}): Promise<void> {
    const workspacePackagePlugin = createWorkspacePackagePlugin(dirname(options.entryPath));

    await esbuild({
        absWorkingDir: dirname(options.entryPath),
        bundle: true,
        entryPoints: [options.entryPath],
        format: options.output.format,
        logLevel: 'silent',
        mainFields: options.output.platform === 'node' ? ['module', 'main'] : ['browser', 'module', 'main'],
        outfile: options.compiledPath,
        platform: options.output.platform,
        plugins: [workspacePackagePlugin],
        sourcemap: false,
        target: options.runtime === 'quickjs' ? ['es2020'] : ['es2022'],
    });
}

async function compileDesktopEntryWithTsup(options: {
    compiledPath: string;
    entryPath: string;
    output: { extension: string; format: DesktopFormat; platform: 'neutral' | 'node' };
    runtime: DesktopRuntimeName;
}): Promise<void> {
    const tsup = await loadOptionalDesktopCompiler<TsupModule>('tsup', options.entryPath, 'tsup');
    const outputBaseName = basename(options.compiledPath, extname(options.compiledPath));
    const workspacePackagePlugin = createWorkspacePackagePlugin(dirname(options.entryPath));

    await tsup.build({
        bundle: true,
        clean: false,
        config: false,
        dts: false,
        entry: { [outputBaseName]: options.entryPath },
        format: [options.output.format],
        noExternal: [/^elit(?:\/|$)/],
        outDir: dirname(options.compiledPath),
        outExtension: () => ({ js: options.output.extension }),
        platform: options.output.platform,
        silent: true,
        skipNodeModulesBundle: false,
        sourcemap: false,
        splitting: false,
        target: options.runtime === 'quickjs' ? 'es2020' : 'es2022',
        esbuildOptions(esbuildOptions) {
            esbuildOptions.logLevel = 'silent';
            esbuildOptions.mainFields = options.output.platform === 'node'
                ? ['module', 'main']
                : ['browser', 'module', 'main'];
            esbuildOptions.plugins = [...(esbuildOptions.plugins ?? []), workspacePackagePlugin];
        },
    });

    const actualOutputPath = findTsupOutputPath(options.compiledPath, options.output.extension);
    if (!actualOutputPath) {
        throw new Error(`Desktop compiler "tsup" did not produce the expected output: ${options.compiledPath}`);
    }

    if (actualOutputPath !== options.compiledPath) {
        renameSync(actualOutputPath, options.compiledPath);
    }
}

async function compileDesktopEntryWithTsx(options: {
    compiledPath: string;
    entryPath: string;
    mode: 'run' | 'build';
    runtime: DesktopRuntimeName;
}): Promise<void> {
    if (options.runtime !== 'node') {
        throw new Error('Desktop compiler "tsx" is only supported with --runtime node.');
    }

    if (options.mode === 'build') {
        console.warn('[desktop] compiler "tsx" generates a Node loader stub that keeps reading the original source tree at runtime.');
    }

    const tsxApiPath = resolveOptionalDesktopCompilerPath('tsx/esm/api', options.entryPath, 'tsx');
    const entryUrl = pathToFileURL(options.entryPath).href;
    const bootstrap = [
        `'use strict';`,
        `const { register } = require(${JSON.stringify(tsxApiPath)});`,
        `register();`,
        `import(${JSON.stringify(entryUrl)}).catch((error) => {`,
        `    console.error(error);`,
        `    process.exit(1);`,
        `});`,
        '',
    ].join('\n');

    writeFileSync(options.compiledPath, bootstrap);
}

async function loadOptionalDesktopCompiler<T>(
    specifier: string,
    entryPath: string,
    compiler: Extract<DesktopCompilerName, 'tsx' | 'tsup'>,
): Promise<T> {
    const resolvedPath = resolveOptionalDesktopCompilerPath(specifier, entryPath, compiler);
    return import(pathToFileURL(resolvedPath).href) as Promise<T>;
}

function resolveOptionalDesktopCompilerPath(
    specifier: string,
    entryPath: string,
    compiler: Extract<DesktopCompilerName, 'tsx' | 'tsup'>,
): string {
    const searchRoots = Array.from(new Set([
        dirname(resolve(entryPath)),
        resolve(process.cwd()),
        PACKAGE_ROOT,
    ]));

    for (const searchRoot of searchRoots) {
        try {
            return createRequire(join(searchRoot, '__elit-desktop__.cjs')).resolve(specifier);
        } catch {
            continue;
        }
    }

    throw new Error(
        `Desktop compiler "${compiler}" requires the ${compiler} package to be installed. Try: npm install -D ${compiler}`,
    );
}

function findTsupOutputPath(expectedPath: string, expectedExtension: string): string | undefined {
    const basePath = expectedPath.slice(0, -expectedExtension.length);
    const candidates = [
        expectedPath,
        `${basePath}.js`,
        `${basePath}.cjs`,
        `${basePath}.mjs`,
    ];

    return candidates.find((candidate, index) => candidates.indexOf(candidate) === index && existsSync(candidate));
}

function compileTarget(runtime: DesktopRuntimeName): { extension: string; format: DesktopFormat; platform: 'neutral' | 'node' } {
    switch (runtime) {
        case 'quickjs':
            return { extension: '.js', format: 'iife', platform: 'neutral' };
        case 'deno':
            return { extension: '.mjs', format: 'esm', platform: 'neutral' };
        default:
            return { extension: '.cjs', format: 'cjs', platform: 'node' };
    }
}

function cleanupPreparedEntry(entry: PreparedEntry): void {
    if (entry.cleanupPath && existsSync(entry.cleanupPath)) {
        rmSync(entry.cleanupPath, { force: true });
    }
}

function cleanupPreparedDesktopNativePayload(payload: PreparedDesktopNativePayload): void {
    if (payload.cleanupPath && existsSync(payload.cleanupPath)) {
        rmSync(payload.cleanupPath, { force: true });
    }
}

function isWindowsTarget(triple?: string): boolean {
    return triple ? triple.includes('windows') : process.platform === 'win32';
}

function spawnDesktopProcess(binary: string, args: string[]): Promise<number> {
    return new Promise((resolvePromise, rejectPromise) => {
        const child = spawn(binary, args, {
            stdio: 'inherit',
            windowsHide: true,
        });

        child.once('error', rejectPromise);
        child.once('close', (code) => {
            resolvePromise(code ?? 1);
        });
    });
}