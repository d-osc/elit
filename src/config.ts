/**
 * Config loader for elit.config.{ts,mts,js,mjs,cjs,json}
 */

import { existsSync, readFileSync } from './fs';
import { relative, resolve } from './path';
import type { DevServerOptions, BuildOptions, PreviewOptions, TestOptions } from './types';
import { resolveWorkspacePackageImport } from './workspace-package';

/**
 * Helper: Read file and ensure string output (eliminates duplication in file reading)
 */
function readFileAsString(filePath: string): string {
    const contentBuffer = readFileSync(filePath, 'utf-8');
    return typeof contentBuffer === 'string' ? contentBuffer : contentBuffer.toString('utf-8');
}

/**
 * Helper: Remove surrounding quotes from string (eliminates duplication in env parsing)
 */
function removeQuotes(value: string): string {
    const trimmed = value.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}

function normalizeRelativeImportPath(fromDirectory: string, targetPath: string): string {
    const relativePath = relative(fromDirectory, targetPath).replace(/\\/g, '/');
    return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

/**
 * Helper: Import config module and return default or module (eliminates duplication in config loading)
 */
async function importConfigModule(configPath: string): Promise<ElitConfig> {
    const { pathToFileURL } = await import('url');
    const configModule = await import(pathToFileURL(configPath).href);
    return configModule.default || configModule;
}

/**
 * Helper: Safe file cleanup (eliminates duplication in temp file cleanup)
 */
async function safeCleanup(filePath: string): Promise<void> {
    try {
        const { unlinkSync } = await import('./fs');
        unlinkSync(filePath);
    } catch {
        // Ignore cleanup errors
    }
}

export interface ElitConfig {
    /** Development server configuration */
    dev?: DevServerOptions;
    /** Build configuration - supports single build or multiple builds */
    build?: BuildOptions | BuildOptions[];
    /** Preview server configuration */
    preview?: PreviewOptions;
    /** Test configuration */
    test?: TestOptions;
    /** Desktop command configuration */
    desktop?: DesktopConfig;
    /** Mobile command configuration */
    mobile?: MobileConfig;
    /** Process manager configuration */
    pm?: PmConfig;
    /** WAPK packaging configuration */
    wapk?: WapkConfig;
}

export type MobileMode = 'native' | 'hybrid';
export type DesktopMode = 'native' | 'hybrid';
export type PmRuntimeName = 'node' | 'bun' | 'deno';
export type PmRestartPolicy = 'always' | 'on-failure' | 'never';

export interface PmHealthCheckConfig {
    /** HTTP endpoint polled while the process is online */
    url?: string;
    /** Delay before the first health check in milliseconds */
    gracePeriod?: number;
    /** Interval between health checks in milliseconds */
    interval?: number;
    /** Per-request timeout in milliseconds */
    timeout?: number;
    /** Consecutive failed checks before the process is restarted */
    maxFailures?: number;
}

export interface PmAppConfig {
    /** Unique process name used by elit pm list/stop/restart */
    name: string;
    /** Shell command to execute, for example: npm start */
    script?: string;
    /** JavaScript or TypeScript entry file executed by the selected runtime */
    file?: string;
    /** Packaged .wapk file or remote archive source executed through elit wapk run */
    wapk?: string;
    /** Runtime used for file or wapk targets */
    runtime?: PmRuntimeName;
    /** Working directory for the managed process */
    cwd?: string;
    /** Extra environment variables injected into the process */
    env?: Record<string, string | number | boolean>;
    /** Disable automatic restart when the process exits */
    autorestart?: boolean;
    /** Delay between restart attempts in milliseconds */
    restartDelay?: number;
    /** Maximum restart attempts before marking the process as errored */
    maxRestarts?: number;
    /** Password forwarded to elit wapk run for locked archives */
    password?: string;
    /** Extra WAPK run settings, including direct Google Drive access and live-sync options */
    wapkRun?: WapkRunConfig;
    /** Restart strategy used after the child process exits */
    restartPolicy?: PmRestartPolicy;
    /** Minimum healthy uptime before restart attempt counters reset */
    minUptime?: number;
    /** Restart the process when watched files change */
    watch?: boolean;
    /** Files or directories watched when watch mode is enabled */
    watchPaths?: string[];
    /** Glob-like patterns ignored by watch mode */
    watchIgnore?: string[];
    /** Debounce delay before restarting after a file change */
    watchDebounce?: number;
    /** Optional HTTP health checks for long-running services */
    healthCheck?: PmHealthCheckConfig;
}

export interface PmConfig {
    /** Directory used to store pm metadata and log files (default: ./.elit/pm) */
    dataDir?: string;
    /** File used by pm save/resurrect (default: <dataDir>/dump.json) */
    dumpFile?: string;
    /** Managed applications available to elit pm start */
    apps?: PmAppConfig[];
}

export interface MobileConfig {
    /** Project directory for native mobile artifacts */
    cwd?: string;
    /** Native app bundle identifier */
    appId?: string;
    /** Native app display name */
    appName?: string;
    /** Built web assets directory synced into native projects */
    webDir?: string;
    /** Mobile runtime mode: native uses generated UI, hybrid keeps the WebView shell active */
    mode?: MobileMode;
    /** Mobile app icon image path (recommended: .png or .webp) */
    icon?: string;
    /** Android permissions written to AndroidManifest uses-permission tags */
    permissions?: string[];
    /** Platform-specific Android CLI defaults */
    android?: MobileAndroidConfig;
    /** Platform-specific iOS CLI defaults */
    ios?: MobileIosConfig;
    /** Optional native UI generation targets using the same Elit syntax */
    native?: MobileNativeConfig;
}

export interface MobileAndroidConfig {
    /** Default Android device/emulator id used when --target is omitted */
    target?: string;
}

export interface MobileIosConfig {
    /** Default iOS simulator name, UDID, booted alias, or full xcodebuild destination */
    target?: string;
}

export interface MobileNativeConfig {
    /** Elit entry file that exports a VNode tree or zero-argument factory */
    entry?: string;
    /** Explicit export name to read from the native entry module */
    exportName?: string;
    /** Android-specific native generation options */
    android?: MobileNativeAndroidConfig;
    /** iOS-specific native generation options */
    ios?: MobileNativeIosConfig;
}

export interface MobileNativeAndroidConfig {
    /** Disable Android native code generation while keeping iOS enabled */
    enabled?: boolean;
    /** Kotlin package name for generated native screen files */
    packageName?: string;
    /** Output file path for generated Compose screen, relative to mobile.cwd */
    output?: string;
}

export interface MobileNativeIosConfig {
    /** Disable iOS native code generation while keeping Android enabled */
    enabled?: boolean;
    /** Output file path for generated SwiftUI file, relative to mobile.cwd */
    output?: string;
}

export interface DesktopConfig {
    /** Desktop runtime mode: native prefers desktop.native.entry and hybrid prefers desktop.entry */
    mode?: DesktopMode;
    /** Desktop entry file used when the CLI command omits <entry> in hybrid mode */
    entry?: string;
    /** Optional native desktop entry defaults */
    native?: DesktopNativeConfig;
    /** Native desktop runtime: quickjs, bun, node, deno */
    runtime?: 'quickjs' | 'bun' | 'node' | 'deno';
    /** Desktop entry compiler: auto, none, esbuild, tsx, tsup */
    compiler?: 'auto' | 'none' | 'esbuild' | 'tsx' | 'tsup';
    /** Build or run with release desktop runtime */
    release?: boolean;
    /** Desktop build output directory */
    outDir?: string;
    /** Desktop build target platform */
    platform?:
        | 'windows'
        | 'win'
        | 'windows-arm'
        | 'win-arm'
        | 'linux'
        | 'linux-musl'
        | 'linux-arm'
        | 'macos'
        | 'mac'
        | 'darwin'
        | 'macos-arm'
        | 'mac-arm';
    /** Desktop WAPK mode defaults */
    wapk?: {
        /** Packaged runtime to execute inside desktop mode */
        runtime?: 'node' | 'bun' | 'deno';
        /** Polling interval for WAPK live sync */
        syncInterval?: number;
        /** Use event-driven file watcher for WAPK live sync */
        useWatcher?: boolean;
        /** Use release desktop runtime binary */
        release?: boolean;
    };
}

export interface DesktopNativeConfig {
    /** Elit entry file used when desktop.mode is native or --mode native is passed */
    entry?: string;
    /** Explicit export name to read from the desktop native entry module */
    exportName?: string;
}

export interface WapkLockConfig {
    /** Plain-text password used to encrypt the archive */
    password?: string;
}

export interface WapkLiveSyncConfig {
    /** Polling interval for live sync writes back into the archive */
    syncInterval?: number;
    /** Use event-driven file watching for local workdir changes */
    useWatcher?: boolean;
    /** Pull archive changes back into the temp workdir */
    watchArchive?: boolean;
    /** Polling interval for reading external archive changes */
    archiveSyncInterval?: number;
}

export interface WapkGoogleDriveConfig {
    /** Google Drive file id for the remote .wapk archive */
    fileId?: string;
    /** OAuth access token used for Google Drive API calls */
    accessToken?: string;
    /** Environment variable name that contains the OAuth access token */
    accessTokenEnv?: string;
    /** Include supportsAllDrives=true when accessing shared drive files */
    supportsAllDrives?: boolean;
}

export interface WapkRunConfig extends WapkLiveSyncConfig {
    /** Default archive file used by elit wapk run when no file argument is provided */
    file?: string;
    /** Remote Google Drive archive used by elit wapk run */
    googleDrive?: WapkGoogleDriveConfig;
    /** Create an online Elit Run shared session instead of starting the local runtime */
    online?: boolean;
    /** Elit Run base URL used when online hosting targets a non-default origin */
    onlineUrl?: string;
    /** Default runtime override used by elit wapk run */
    runtime?: 'node' | 'bun' | 'deno';
    /** Default password used to unlock a locked archive at runtime */
    password?: string;
}

export interface WapkConfig {
    name?: string;
    version?: string;
    runtime?: string;
    engine?: string;
    entry?: string;
    scripts?: Record<string, string>;
    port?: number;
    env?: Record<string, string | number | boolean>;
    desktop?: Record<string, unknown>;
    lock?: WapkLockConfig;
    run?: WapkRunConfig;
}

/**
 * Helper function for type-safe config definition
 */
export function defineConfig(config: ElitConfig): ElitConfig {
    return config;
}

export const ELIT_CONFIG_FILES = [
    'elit.config.ts',
    'elit.config.mts',
    'elit.config.js',
    'elit.config.mjs',
    'elit.config.cjs',
    'elit.config.json'
] as const;

export function resolveConfigPath(cwd: string = process.cwd()): string | null {
    for (const configFile of ELIT_CONFIG_FILES) {
        const configPath = resolve(cwd, configFile);

        if (existsSync(configPath)) {
            return configPath;
        }
    }

    return null;
}

/**
 * Load environment variables from .env files
 */
export function loadEnv(mode: string = 'development', cwd: string = process.cwd()): Record<string, string> {
    const env: Record<string, string> = { MODE: mode };

    // Load .env files in priority order
    const envFiles = [
        `.env.${mode}.local`,
        `.env.${mode}`,
        `.env.local`,
        `.env`
    ];

    for (const file of envFiles) {
        const filePath = resolve(cwd, file);
        if (existsSync(filePath)) {
            const content = readFileAsString(filePath);
            const lines = content.split('\n');

            for (const line of lines) {
                const trimmed = line.trim();
                // Skip empty lines and comments
                if (!trimmed || trimmed.startsWith('#')) continue;

                const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
                if (match) {
                    const [, key, value] = match;
                    const cleanValue = removeQuotes(value);
                    // Only set if not already set (priority order)
                    if (!(key in env)) {
                        env[key] = cleanValue;
                    }
                }
            }
        }
    }

    return env;
}

/**
 * Load elit config from current directory
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<ElitConfig | null> {
    const configPath = resolveConfigPath(cwd);

    if (configPath) {
        try {
            return await loadConfigFile(configPath);
        } catch (error) {
            console.error(`Error loading config file: ${configPath.split(/[/\\]/).pop()}`);
            console.error(error);
            throw error;
        }
    }

    return null;
}

async function loadConfigFile(configPath: string): Promise<ElitConfig> {
    const ext = configPath.split('.').pop();

    if (ext === 'json') {
        // Load JSON config
        const content = readFileAsString(configPath);
        return JSON.parse(content);
    } else if (ext === 'ts' || ext === 'mts') {
        // Load TypeScript config by transpiling it with esbuild
        try {
            const { build } = await import('esbuild');
            const { join, dirname } = await import('./path');

            // Create temporary output file in the same directory as the config
            // This ensures that imports like 'elit/server' can be resolved correctly
            const configDir = dirname(configPath);
            const tempFile = join(configDir, `.elit-config-${Date.now()}.mjs`);

            // Custom plugin to external all dependencies
            const externalAllPlugin = {
                name: 'external-all',
                setup(build: any) {
                    build.onResolve({ filter: /.*/ }, (args: any) => {
                        const workspacePackageImport = resolveWorkspacePackageImport(args.path, args.resolveDir || configDir, {
                            preferBuilt: true,
                        });
                        if (workspacePackageImport) {
                            return {
                                path: normalizeRelativeImportPath(configDir, workspacePackageImport),
                                external: true,
                            };
                        }

                        // Skip relative imports (local files)
                        if (args.path.startsWith('./') || args.path.startsWith('../')) {
                            return undefined;
                        }

                        // External everything in node_modules
                        if (args.path.includes('node_modules') || args.resolveDir?.includes('node_modules')) {
                            return { path: args.path, external: true };
                        }

                        // External known packages by exact match or prefix
                        const knownPackages = ['esbuild', 'elit', 'fs', 'path', 'os', 'vm', 'crypto', 'http', 'https', 'url', 'bun'];
                        if (knownPackages.some(pkg => args.path === pkg || args.path.startsWith(pkg + '/'))) {
                            return { path: args.path, external: true };
                        }

                        // External any imports from dist directory (elit package)
                        if (args.resolveDir?.includes('elit/dist') || args.path.includes('elit/dist')) {
                            return { path: args.path, external: true };
                        }

                        return undefined;
                    });
                }
            };

            await build({
                entryPoints: [configPath],
                bundle: true,
                format: 'esm',
                platform: 'node',
                outfile: tempFile,
                write: true,
                target: 'es2020',
                plugins: [externalAllPlugin],
                // External Node.js built-ins and runtime-specific packages
                external: [
                    'node:*',
                    'fs', 'path', 'os', 'vm', 'crypto', 'http', 'https',
                    'bun', 'bun:*', 'deno', 'deno:*'
                ],
                // Use the config directory as the working directory for resolution
                absWorkingDir: configDir,
            });

            // Import the compiled config
            const config = await importConfigModule(tempFile);

            // Clean up temp file
            await safeCleanup(tempFile);

            return config;
        } catch (error) {
            console.error('Failed to load TypeScript config file.');
            console.error('You can use a .js, .mjs, or .json config file instead.');
            throw error;
        }
    } else {
        // Load JS config
        return await importConfigModule(configPath);
    }
}

/**
 * Merge CLI args with config file
 */
export function mergeConfig<T extends Record<string, any>>(
    config: T | undefined,
    cliArgs: Partial<T>
): T {
    if (!config) {
        return cliArgs as T;
    }

    return {
        ...config,
        ...Object.fromEntries(
            Object.entries(cliArgs).filter(([_, v]) => v !== undefined)
        )
    } as T;
}
