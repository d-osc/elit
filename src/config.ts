/**
 * Config loader for elit.config.{ts,js,json}
 */

import { existsSync, readFileSync } from './fs';
import { resolve } from './path';
import type { DevServerOptions, BuildOptions, PreviewOptions } from './types';

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
}

/**
 * Helper function for type-safe config definition
 */
export function defineConfig(config: ElitConfig): ElitConfig {
    return config;
}

const CONFIG_FILES = [
    'elit.config.ts',
    'elit.config.js',
    'elit.config.mjs',
    'elit.config.cjs',
    'elit.config.json'
];

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
    for (const configFile of CONFIG_FILES) {
        const configPath = resolve(cwd, configFile);

        if (existsSync(configPath)) {
            try {
                return await loadConfigFile(configPath);
            } catch (error) {
                console.error(`Error loading config file: ${configFile}`);
                console.error(error);
                throw error;
            }
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
    } else if (ext === 'ts') {
        // Load TypeScript config by transpiling it with esbuild
        try {
            const { build } = await import('esbuild');
            const { tmpdir } = await import('os');
            const { join, dirname } = await import('./path');

            // Create temporary output file
            const tempFile = join(tmpdir(), `elit-config-${Date.now()}.mjs`);

            // Bundle the TypeScript config with proper path resolution
            const configDir = dirname(configPath);
            await build({
                entryPoints: [configPath],
                bundle: true,
                format: 'esm',
                platform: 'node',
                outfile: tempFile,
                write: true,
                target: 'es2020',
                // Bundle everything including elit/* so config can use elit modules
                // Only mark Node.js built-ins and runtime-specific packages as external
                external: [
                    'node:*',
                    'bun',
                    'bun:*',
                    'deno',
                    'deno:*'
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
