/**
 * Config loader for elit.config.{ts,js,json}
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import type { DevServerOptions, BuildOptions } from './types';

export interface ElitConfig {
    /** Development server configuration */
    dev?: DevServerOptions;
    /** Build configuration */
    build?: BuildOptions;
    /** Preview server configuration (subset of dev options) */
    preview?: {
        port?: number;
        host?: string;
        open?: boolean;
        logging?: boolean;
    };
}

const CONFIG_FILES = [
    'elit.config.ts',
    'elit.config.js',
    'elit.config.mjs',
    'elit.config.cjs',
    'elit.config.json'
];

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
        const content = readFileSync(configPath, 'utf-8');
        return JSON.parse(content);
    } else {
        // Load JS/TS config using dynamic import
        // For TypeScript files, we need to use tsx or ts-node in production
        // For now, we'll require the compiled version or use dynamic import

        if (ext === 'ts') {
            // Try to use tsx/ts-node if available, otherwise show error
            try {
                // Check if tsx is available
                const { pathToFileURL } = await import('url');
                const configModule = await import(pathToFileURL(configPath).href);
                return configModule.default || configModule;
            } catch {
                // If tsx not available, show helpful error
                console.error('TypeScript config files require tsx or ts-node to be installed.');
                console.error('Install with: npm install -D tsx');
                console.error('Or use a .js or .json config file instead.');
                throw new Error('Cannot load TypeScript config without tsx/ts-node');
            }
        } else {
            // Load JS config
            const { pathToFileURL } = await import('url');
            const configModule = await import(pathToFileURL(configPath).href);
            return configModule.default || configModule;
        }
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
