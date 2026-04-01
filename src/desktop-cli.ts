import { randomUUID } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';

import { build as esbuild } from 'esbuild';

type DesktopRuntimeName = 'quickjs' | 'bun' | 'node' | 'deno';
type DesktopCompilerName = 'auto' | 'none' | 'esbuild';
type DesktopFormat = 'iife' | 'cjs' | 'esm';
type DesktopPlatform = keyof typeof PLATFORMS;

interface DesktopRunOptions {
    runtime: DesktopRuntimeName;
    compiler: DesktopCompilerName;
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

interface PreparedEntry {
    appName: string;
    entryPath: string;
    cleanupPath?: string;
}

const PACKAGE_ROOT = resolve(__dirname, '..');
const DESKTOP_RUNTIMES: DesktopRuntimeName[] = ['quickjs', 'bun', 'node', 'deno'];
const DESKTOP_COMPILERS: DesktopCompilerName[] = ['auto', 'none', 'esbuild'];
const BUILD_FEATURES: Record<DesktopRuntimeName, string[]> = {
    quickjs: ['runtime-quickjs'],
    bun: ['runtime-external'],
    node: ['runtime-external'],
    deno: ['runtime-external'],
};
const EMBED_MAGIC_V2 = Buffer.from([0x57, 0x41, 0x50, 0x4b, 0x52, 0x54, 0x00, 0x02]);
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

export async function runDesktopCommand(args: string[]): Promise<void> {
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        printDesktopHelp();
        return;
    }

    if (args[0] === 'build') {
        await buildDesktopBundle(parseDesktopBuildArgs(args.slice(1)));
        return;
    }

    await runDesktopRuntime(parseDesktopRunArgs(args));
}

function parseDesktopRunArgs(args: string[]): DesktopRunOptions {
    const options: DesktopRunOptions = {
        runtime: 'quickjs',
        compiler: 'auto',
        release: false,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
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

    if (!options.entry) {
        throw new Error('Desktop mode requires an entry file.');
    }

    return options;
}

function parseDesktopBuildArgs(args: string[]): DesktopBuildOptions {
    const options: DesktopBuildOptions = {
        runtime: 'quickjs',
        compiler: 'auto',
        release: false,
        outDir: 'dist',
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
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

    return options;
}

function printDesktopHelp(): void {
    console.log(`
Desktop mode for Elit

Usage:
  elit desktop [options] <entry>
  elit desktop build [options] <entry>
  elit desktop build [options]

Run options:
  -r, --runtime <name>     Desktop runtime: quickjs, bun, node, deno
  -c, --compiler <name>    Entry transpiler: auto, none, esbuild (default: auto)
  --release                Use the release desktop runtime binary

Build options:
  -r, --runtime <name>     Runtime to embed in the app binary
  -c, --compiler <name>    Entry transpiler: auto, none, esbuild (default: auto)
  -p, --platform <name>    Target platform (${Object.keys(PLATFORMS).join(', ')})
  -o, --out-dir <dir>      Output directory (default: dist)
  --release                Build the desktop runtime in release mode

Examples:
  elit desktop src/main.ts
  elit desktop --runtime node app.ts
  elit desktop build src/main.ts
  elit desktop build --runtime bun --release src/main.ts

Notes:
  - Cargo is required to build the native WebView runtime.
  - TypeScript and module-style QuickJS entries are transpiled automatically.
  - The build subcommand can be used without an entry to prebuild the native runtime.
`);
}

async function runDesktopRuntime(options: DesktopRunOptions): Promise<void> {
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

async function buildDesktopBundle(options: DesktopBuildOptions): Promise<void> {
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

function ensureDesktopBinary(options: EnsureBinaryOptions): string {
    let binary = findDesktopBinary(options.runtime, options.release, options.triple);

    if (!binary) {
        buildDesktopRuntime(options);
        binary = findDesktopBinary(options.runtime, options.release, options.triple);
    }

    if (!binary) {
        throw new Error('Desktop runtime binary was not found after cargo build completed.');
    }

    return binary;
}

function buildDesktopRuntime(options: EnsureBinaryOptions): void {
    const args = [
        'build',
        '--manifest-path',
        resolve(PACKAGE_ROOT, 'Cargo.toml'),
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

function desktopCargoTargetDir(runtime: DesktopRuntimeName): string {
    return resolve(PACKAGE_ROOT, 'target', 'desktop', runtime);
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
    if (!shouldCompileEntry(entryPath, runtime, compiler, mode)) {
        return { appName, entryPath };
    }

    const output = compileTarget(runtime);
    const compiledPath = join(dirname(entryPath), `.elit-desktop-${appName}-${randomUUID()}${output.extension}`);

    try {
        await esbuild({
            absWorkingDir: dirname(entryPath),
            bundle: true,
            entryPoints: [entryPath],
            format: output.format,
            logLevel: 'silent',
            mainFields: output.platform === 'node' ? ['module', 'main'] : ['browser', 'module', 'main'],
            outfile: compiledPath,
            platform: output.platform,
            sourcemap: false,
            target: runtime === 'quickjs' ? ['es2020'] : ['es2022'],
        });
    } catch (error) {
        cleanupPreparedEntry({ appName, entryPath: compiledPath, cleanupPath: compiledPath });
        throw error;
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

    if (compiler === 'esbuild') {
        return true;
    }

    return mode === 'build' || runtime === 'quickjs' || TS_LIKE_EXTENSIONS.has(extname(entryPath).toLowerCase());
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