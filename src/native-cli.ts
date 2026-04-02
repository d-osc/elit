import { randomUUID } from 'node:crypto';
import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { build as esbuild } from 'esbuild';

import { loadConfig } from './config';
import { renderAndroidCompose, renderNativeJson, renderSwiftUI, type NativePlatform } from './native';
import type { Child } from './types';

type NativeTarget = 'android' | 'ios' | 'ir';

export interface NativeEntryRenderOptions {
    entryPath: string;
    exportName?: string;
    includePreview?: boolean;
    name?: string;
    packageName?: string;
    platform?: NativePlatform;
    target: NativeTarget;
}

interface NativeGenerateOptions {
    cwd: string;
    entryPath: string;
    exportName?: string;
    includePreview: boolean;
    name: string;
    outputPath?: string;
    packageName?: string;
    platform: NativePlatform;
    target: NativeTarget;
}

const DEFAULT_ENTRY_EXPORTS = ['default', 'screen', 'app', 'view', 'root', 'native', 'Screen', 'App', 'View', 'Root'] as const;

export async function runNativeCommand(args: string[]): Promise<void> {
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        printNativeHelp();
        return;
    }

    const command = args[0];

    switch (command) {
        case 'generate':
            if (args.slice(1).length === 0 || args.slice(1).includes('--help') || args.slice(1).includes('-h')) {
                printNativeHelp();
                return;
            }
            await generateNativeFromCli(args.slice(1));
            return;
        default:
            throw new Error(`Unknown native command: ${command}`);
    }
}

async function generateNativeFromCli(args: string[]): Promise<void> {
    const options = await parseNativeGenerateArgs(args);
    const output = await generateNativeEntryOutput({
        entryPath: options.entryPath,
        exportName: options.exportName,
        includePreview: options.includePreview,
        name: options.name,
        packageName: options.packageName,
        platform: options.platform,
        target: options.target,
    });

    if (options.outputPath) {
        mkdirSync(dirname(options.outputPath), { recursive: true });
        writeFileSync(options.outputPath, output);
        console.log(`[native] Generated ${options.target} output at ${options.outputPath}`);
        return;
    }

    process.stdout.write(output);
    if (!output.endsWith('\n')) {
        process.stdout.write('\n');
    }
}

async function parseNativeGenerateArgs(args: string[]): Promise<NativeGenerateOptions> {
    const target = parseNativeTargetArg(args[0]);
    let cwd = process.cwd();

    for (let i = 1; i < args.length; i++) {
        if (args[i] === '--cwd') {
            const value = args[++i];
            if (!value) throw new Error('Missing value for --cwd');
            cwd = resolve(value);
        }
    }

    const config = await loadConfig(cwd);
    const mobileConfig = config?.mobile;

    const options: NativeGenerateOptions = {
        cwd,
        entryPath: '',
        exportName: undefined,
        includePreview: true,
        name: 'GeneratedScreen',
        outputPath: undefined,
        packageName: target === 'android' ? mobileConfig?.appId : undefined,
        platform: target === 'android' ? 'android' : target === 'ios' ? 'ios' : 'generic',
        target,
    };

    let entryValue: string | undefined;

    for (let i = 1; i < args.length; i++) {
        const arg = args[i];

        if (!arg.startsWith('-')) {
            if (entryValue) {
                throw new Error(`Unexpected extra argument: ${arg}`);
            }
            entryValue = arg;
            continue;
        }

        switch (arg) {
            case '--entry': {
                const value = args[++i];
                if (!value) throw new Error('Missing value for --entry');
                entryValue = value;
                break;
            }
            case '--out': {
                const value = args[++i];
                if (!value) throw new Error('Missing value for --out');
                options.outputPath = resolve(cwd, value);
                break;
            }
            case '--name': {
                const value = args[++i];
                if (!value) throw new Error('Missing value for --name');
                options.name = value;
                break;
            }
            case '--package': {
                const value = args[++i];
                if (!value) throw new Error('Missing value for --package');
                options.packageName = value;
                break;
            }
            case '--export': {
                const value = args[++i];
                if (!value) throw new Error('Missing value for --export');
                options.exportName = value;
                break;
            }
            case '--platform': {
                const value = args[++i];
                if (!value) throw new Error('Missing value for --platform');
                options.platform = parseNativePlatformArg(value);
                break;
            }
            case '--cwd': {
                i++;
                break;
            }
            case '--preview': {
                options.includePreview = true;
                break;
            }
            case '--no-preview': {
                options.includePreview = false;
                break;
            }
            default:
                throw new Error(`Unknown native option: ${arg}`);
        }
    }

    if (!entryValue) {
        throw new Error('Native generation requires an entry file. Use: elit native generate android <entry>');
    }

    options.entryPath = resolve(cwd, entryValue);
    return options;
}

export async function generateNativeEntryOutput(options: NativeEntryRenderOptions): Promise<string> {
    const entry = await loadNativeEntryValue(options.entryPath, options.exportName);

    switch (options.target) {
        case 'android':
            return renderAndroidCompose(entry, {
                functionName: options.name ?? 'GeneratedScreen',
                includePreview: options.includePreview ?? true,
                packageName: options.packageName,
            });
        case 'ios':
            return renderSwiftUI(entry, {
                includePreview: options.includePreview ?? true,
                structName: options.name ?? 'GeneratedScreen',
            });
        case 'ir':
        default:
            return renderNativeJson(entry, { platform: options.platform ?? 'generic' });
    }
}

export async function loadNativeEntryValue(entryPath: string, exportName?: string): Promise<Child> {
    const tempFile = await compileNativeEntry(entryPath);

    try {
        const moduleRecord = await import(pathToFileURL(tempFile).href) as Record<string, unknown>;
        return await resolveNativeEntryExport(moduleRecord, exportName);
    } finally {
        safeCleanup(tempFile);
    }
}

async function compileNativeEntry(entryPath: string): Promise<string> {
    const entryDir = dirname(entryPath);
    const tempFile = resolve(
        entryDir,
        `.elit-native-${basename(entryPath, extname(entryPath))}-${randomUUID()}.mjs`,
    );

    const externalPackagesPlugin = {
        name: 'external-packages',
        setup(build: any) {
            build.onResolve({ filter: /.*/ }, (args: { path: string }) => {
                if (isBareSpecifier(args.path)) {
                    return { path: args.path, external: true };
                }
                return undefined;
            });
        },
    };

    await esbuild({
        absWorkingDir: entryDir,
        bundle: true,
        entryPoints: [entryPath],
        external: ['node:*', 'bun', 'bun:*', 'deno', 'deno:*'],
        format: 'esm',
        logLevel: 'silent',
        outfile: tempFile,
        platform: 'node',
        plugins: [externalPackagesPlugin],
        sourcemap: false,
        target: 'es2022',
        write: true,
    });

    return tempFile;
}

function isBareSpecifier(specifier: string): boolean {
    if (specifier.startsWith('./') || specifier.startsWith('../') || specifier.startsWith('/')) {
        return false;
    }

    return !/^[A-Za-z]:[\\/]/.test(specifier);
}

export async function resolveNativeEntryExport(moduleRecord: Record<string, unknown>, exportName?: string): Promise<Child> {
    if (exportName) {
        if (!(exportName in moduleRecord)) {
            throw new Error(`Export "${exportName}" was not found in the native entry module.`);
        }
        return resolveNativeExportValue(moduleRecord[exportName], exportName);
    }

    for (const candidate of DEFAULT_ENTRY_EXPORTS) {
        if (candidate in moduleRecord && moduleRecord[candidate] !== undefined) {
            return resolveNativeExportValue(moduleRecord[candidate], candidate);
        }
    }

    const remainingExports = Object.keys(moduleRecord).filter((key) => key !== '__esModule');
    if (remainingExports.length === 1) {
        const [candidate] = remainingExports;
        return resolveNativeExportValue(moduleRecord[candidate], candidate);
    }

    throw new Error(
        'Native entry must export a value or zero-argument function as default, screen, app, or another named export via --export.',
    );
}

export async function resolveNativeExportValue(value: unknown, exportName: string): Promise<Child> {
    let resolved = value;

    if (typeof resolved === 'function') {
        if (resolved.length > 0) {
            throw new Error(`Export "${exportName}" must be a native tree value or a zero-argument function.`);
        }
        resolved = (resolved as () => unknown)();
    }

    if (isPromiseLike(resolved)) {
        resolved = await resolved;
    }

    if (resolved == null) {
        throw new Error(`Export "${exportName}" returned no value.`);
    }

    return resolved as Child;
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
    return Boolean(
        value &&
        (typeof value === 'object' || typeof value === 'function') &&
        'then' in value,
    );
}

function parseNativeTargetArg(value: string | undefined): NativeTarget {
    if (value === 'android' || value === 'ios' || value === 'ir') {
        return value;
    }

    throw new Error(`Invalid native target: ${value ?? '(missing)'}. Expected android, ios, or ir.`);
}

function parseNativePlatformArg(value: string): NativePlatform {
    if (value === 'generic' || value === 'android' || value === 'ios') {
        return value;
    }

    throw new Error(`Invalid native platform: ${value}. Expected generic, android, or ios.`);
}

function safeCleanup(filePath: string): void {
    try {
        unlinkSync(filePath);
    } catch {
        // Ignore cleanup errors for generated temp files.
    }
}

function printNativeHelp(): void {
    console.log([
        'Elit Native Commands',
        '',
        'Usage:',
        '  elit native generate android <entry> [options]',
        '  elit native generate ios <entry> [options]',
        '  elit native generate ir <entry> [options]',
        '',
        'Options:',
        '  --entry <file>      Entry file to evaluate if not passed positionally',
        '  --out <file>        Write generated output to a file instead of stdout',
        '  --name <name>       Generated Compose function or SwiftUI struct name',
        '  --package <name>    Kotlin package name for android output',
        '  --export <name>     Specific export to read from the entry module',
        '  --platform <name>   IR platform tag: generic, android, ios',
        '  --cwd <dir>         Resolve config and relative paths from this directory',
        '  --preview           Include preview helpers (default)',
        '  --no-preview        Skip preview helpers in generated output',
        '',
        'Entry expectations:',
        '  The entry module should export a VNode/native tree value or a zero-argument',
        '  function that returns one. Auto-detected export names: default, screen, app, view, root.',
        '',
        'Examples:',
        '  elit native generate android ./src/native-screen.ts --name HomeScreen --package com.example.app',
        '  elit native generate ios ./src/native-screen.ts --out ./ios/HomeScreen.swift',
        '  elit native generate ir ./src/native-screen.ts --platform android --export screen',
    ].join('\n'));
}