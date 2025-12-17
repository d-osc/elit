#!/usr/bin/env node
/**
 * Main CLI for Elit
 */

import { loadConfig, mergeConfig } from './config';
import { createDevServer } from './server';
import { build } from './build';
import type { DevServerOptions, BuildOptions } from './types';

const COMMANDS = ['dev', 'build', 'preview', 'help', 'version'] as const;
type Command = typeof COMMANDS[number];

async function main() {
    const args = process.argv.slice(2);
    const command = (args[0] as Command) || 'help';

    if (!COMMANDS.includes(command)) {
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }

    switch (command) {
        case 'dev':
            await runDev(args.slice(1));
            break;
        case 'build':
            await runBuild(args.slice(1));
            break;
        case 'preview':
            await runPreview(args.slice(1));
            break;
        case 'version':
            printVersion();
            break;
        case 'help':
        default:
            printHelp();
            break;
    }
}

async function runDev(args: string[]) {
    const cliOptions = parseDevArgs(args);
    const config = await loadConfig();

    const options = config?.dev
        ? mergeConfig(config.dev, cliOptions)
        : cliOptions as DevServerOptions;

    // Ensure we have at least root or clients
    if (!options.root && (!options.clients || options.clients.length === 0)) {
        options.root = process.cwd();
    }

    const devServer = createDevServer(options);

    // Handle graceful shutdown
    const shutdown = async () => {
        console.log('\n[Server] Shutting down...');
        await devServer.close();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

async function runBuild(args: string[]) {
    const cliOptions = parseBuildArgs(args);
    const config = await loadConfig();

    const options = config?.build
        ? mergeConfig(config.build, cliOptions)
        : cliOptions as BuildOptions;

    if (!options.entry) {
        console.error('Error: Entry file is required');
        console.error('Specify in config file or use --entry <file>');
        process.exit(1);
    }

    try {
        await build(options);
    } catch (error) {
        process.exit(1);
    }
}

async function runPreview(args: string[]) {
    const cliOptions = parsePreviewArgs(args);
    const config = await loadConfig();

    const previewConfig = config?.preview || {};
    const mergedOptions = {
        ...previewConfig,
        ...Object.fromEntries(
            Object.entries(cliOptions).filter(([_, v]) => v !== undefined)
        )
    };

    const options: DevServerOptions = {
        port: mergedOptions.port || 4173,
        host: mergedOptions.host || 'localhost',
        root: 'dist',
        open: mergedOptions.open ?? true,
        logging: mergedOptions.logging ?? true
    };

    console.log('Starting preview server...');
    const devServer = createDevServer(options);

    const shutdown = async () => {
        console.log('\n[Server] Shutting down...');
        await devServer.close();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

function parseDevArgs(args: string[]): Partial<DevServerOptions> {
    const options: Partial<DevServerOptions> = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const next = args[i + 1];

        switch (arg) {
            case '-p':
            case '--port':
                options.port = parseInt(next, 10);
                i++;
                break;
            case '-h':
            case '--host':
                options.host = next;
                i++;
                break;
            case '-r':
            case '--root':
                options.root = next;
                i++;
                break;
            case '--no-open':
                options.open = false;
                break;
            case '--silent':
                options.logging = false;
                break;
        }
    }

    return options;
}

function parseBuildArgs(args: string[]): Partial<BuildOptions> {
    const options: Partial<BuildOptions> = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const next = args[i + 1];

        switch (arg) {
            case '-e':
            case '--entry':
                options.entry = next;
                i++;
                break;
            case '-o':
            case '--out-dir':
                options.outDir = next;
                i++;
                break;
            case '--no-minify':
                options.minify = false;
                break;
            case '--sourcemap':
                options.sourcemap = true;
                break;
            case '-f':
            case '--format':
                options.format = next as BuildOptions['format'];
                i++;
                break;
            case '--silent':
                options.logging = false;
                break;
        }
    }

    return options;
}

function parsePreviewArgs(args: string[]): Partial<{ port: number; host: string; open: boolean; logging: boolean }> {
    const options: Partial<{ port: number; host: string; open: boolean; logging: boolean }> = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const next = args[i + 1];

        switch (arg) {
            case '-p':
            case '--port':
                options.port = parseInt(next, 10);
                i++;
                break;
            case '-h':
            case '--host':
                options.host = next;
                i++;
                break;
            case '--no-open':
                options.open = false;
                break;
            case '--silent':
                options.logging = false;
                break;
        }
    }

    return options;
}

function printHelp() {
    console.log(`
Elit - Modern Web Development Toolkit

Usage:
  elit <command> [options]

Commands:
  dev       Start development server
  build     Build for production
  preview   Preview production build
  version   Show version number
  help      Show this help message

Dev Options:
  -p, --port <number>    Port to run server on (default: 3000)
  -h, --host <string>    Host to bind to (default: localhost)
  -r, --root <path>      Root directory to serve
  --no-open              Don't open browser automatically
  --silent               Disable logging

Build Options:
  -e, --entry <file>     Entry file to build (required)
  -o, --out-dir <dir>    Output directory (default: dist)
  -f, --format <format>  Output format: esm, cjs, iife (default: esm)
  --no-minify            Disable minification
  --sourcemap            Generate sourcemap
  --silent               Disable logging

Preview Options:
  -p, --port <number>    Port to run server on (default: 4173)
  -h, --host <string>    Host to bind to (default: localhost)
  --no-open              Don't open browser automatically
  --silent               Disable logging

Config File:
  Create elit.config.ts, elit.config.js, or elit.config.json in project root

Examples:
  elit dev
  elit dev --port 8080
  elit build --entry src/app.ts
  elit preview
  elit preview --port 5000

Config file example (elit.config.ts):
  export default {
    dev: {
      port: 3000,
      clients: [
        { root: './public', basePath: '/' }
      ]
    },
    build: {
      entry: 'src/app.ts',
      outDir: 'dist',
      format: 'esm'
    },
    preview: {
      port: 4173
    }
  }
  `);
}

function printVersion() {
    const pkg = require('../package.json');
    console.log(`elit v${pkg.version}`);
}

// Run CLI
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
