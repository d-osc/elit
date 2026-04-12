import { existsSync, mkdirSync, readdirSync } from './fs';
import { basename, dirname, extname, join, relative, resolve } from './path';

import type { DevServerOptions } from './types';
import {
    createInlineConfigSource,
    createWorkspacePackagePlugin,
    normalizeImportPath,
    normalizeRelativePath,
    writeStandalonePackageJson,
} from './preview-build';

interface StandaloneDevClientPlan {
    basePath: string;
    fallbackRootRelativePath: string;
    index?: string;
    rootRelativePath: string;
}

export interface StandaloneDevBuildPlan {
    clients?: StandaloneDevClientPlan[];
    fallbackRootRelativePath?: string;
    index?: string;
    outputPath: string;
    outputRoot: string;
    packageJsonPath: string;
    rootRelativePath?: string;
    usesClientArray: boolean;
}

export interface StandaloneDevBuildOptions {
    allBuilds?: Array<{ outDir?: string }>;
    buildConfig?: { outDir?: string } | null;
    configPath?: string | null;
    cwd?: string;
    devConfig?: DevServerOptions | null;
    logging?: boolean;
    outDir?: string;
    outFile?: string;
}

const defaultStandaloneDevRuntimeIgnorePatterns = ['node_modules/**', 'dist/**', 'dev-dist/**', '.git/**', 'coverage/**', '**/*.d.ts'];

function normalizeStandaloneDevRuntimeIgnorePatterns(devConfig?: DevServerOptions | null): string[] {
    const merged = new Set<string>(defaultStandaloneDevRuntimeIgnorePatterns);

    if (devConfig?.outDir) {
        merged.add(`${normalizeRelativePath(devConfig.outDir).replace(/^\.\//, '')}/**`);
    }

    for (const pattern of devConfig?.ignore || []) {
        merged.add(pattern);
    }

    return [...merged];
}

function shouldIgnoreStandaloneDevRuntimePath(relativePath: string, isDirectory: boolean, ignorePatterns: string[]): boolean {
    const normalizedPath = relativePath.replace(/\\/g, '/').replace(/^\.\//, '');

    if (!normalizedPath) {
        return false;
    }

    for (const pattern of ignorePatterns) {
        const normalizedPattern = pattern.replace(/\\/g, '/').replace(/^\.\//, '');

        if (normalizedPattern === '**/*.d.ts') {
            if (!isDirectory && normalizedPath.endsWith('.d.ts')) {
                return true;
            }
            continue;
        }

        const directoryToken = normalizedPattern
            .replace(/^\*\*\//, '')
            .replace(/\/\*\*$/, '')
            .replace(/\*.*$/, '')
            .replace(/\/+$/, '');

        if (!directoryToken) {
            continue;
        }

        if (normalizedPath === directoryToken || normalizedPath.startsWith(`${directoryToken}/`) || normalizedPath.includes(`/${directoryToken}/`)) {
            return true;
        }
    }

    return false;
}

function rootContainsEsbuildDependentSources(rootDir: string, ignorePatterns: string[]): boolean {
    if (!existsSync(rootDir)) {
        return false;
    }

    const pendingDirectories = [rootDir];

    while (pendingDirectories.length > 0) {
        const currentDirectory = pendingDirectories.pop()!;
        const entries = readdirSync(currentDirectory, { withFileTypes: true }) as Array<{ name: string; isDirectory(): boolean; isFile(): boolean }>;

        for (const entry of entries) {
            const absolutePath = join(currentDirectory, entry.name);
            const relativePath = normalizeRelativePath(relative(rootDir, absolutePath));
            const isDirectory = entry.isDirectory();

            if (shouldIgnoreStandaloneDevRuntimePath(relativePath, isDirectory, ignorePatterns)) {
                continue;
            }

            if (isDirectory) {
                pendingDirectories.push(absolutePath);
                continue;
            }

            if (!entry.isFile()) {
                continue;
            }

            const extension = extname(entry.name).toLowerCase();
            if (extension === '.tsx' || extension === '.jsx') {
                return true;
            }
        }
    }

    return false;
}

export function standaloneDevNeedsEsbuildRuntime(cwd: string, devConfig?: DevServerOptions | null): boolean {
    const resolvedCwd = resolve(cwd || process.cwd());
    const clientRoots = devConfig?.clients && devConfig.clients.length > 0
        ? devConfig.clients.map((client) => resolve(resolvedCwd, client.root || '.'))
        : [resolve(resolvedCwd, devConfig?.root || '.')];
    const ignorePatterns = normalizeStandaloneDevRuntimeIgnorePatterns(devConfig);

    return clientRoots.some((clientRoot) => rootContainsEsbuildDependentSources(clientRoot, ignorePatterns));
}

export function resolveStandaloneDevBuildPlan(options: StandaloneDevBuildOptions): StandaloneDevBuildPlan {
    const cwd = resolve(options.cwd || process.cwd());
    const devConfig = options.devConfig || undefined;
    const allBuilds = options.allBuilds && options.allBuilds.length > 0
        ? options.allBuilds
        : [options.buildConfig || {}];
    const primaryBuild = options.buildConfig || allBuilds[0] || {};
    const outputRoot = resolve(cwd, options.outDir || devConfig?.outDir || 'dev-dist');
    const outputFile = options.outFile || devConfig?.outFile || 'index.js';
    const outputPath = resolve(join(outputRoot, outputFile));
    const bundleDir = dirname(outputPath);

    if (devConfig?.clients && devConfig.clients.length > 0) {
        const clients = devConfig.clients.map((client, index) => {
            const buildForClient = allBuilds[index] || primaryBuild;

            return {
            basePath: client.basePath || '',
            fallbackRootRelativePath: normalizeRelativePath(relative(bundleDir, resolve(cwd, buildForClient.outDir || 'dist'))),
            index: client.index,
            rootRelativePath: normalizeRelativePath(relative(bundleDir, resolve(cwd, client.root || '.'))),
        };
        });

        return {
            clients,
            outputPath,
            outputRoot,
            packageJsonPath: join(outputRoot, 'package.json'),
            usesClientArray: true,
        };
    }

    const rootRelativePath = normalizeRelativePath(relative(bundleDir, resolve(cwd, devConfig?.root || '.')));
    const fallbackRootRelativePath = normalizeRelativePath(relative(bundleDir, resolve(cwd, primaryBuild.outDir || 'dist')));

    return {
        fallbackRootRelativePath,
        index: devConfig?.index,
        outputPath,
        outputRoot,
        packageJsonPath: join(outputRoot, 'package.json'),
        clients: undefined,
        rootRelativePath,
        usesClientArray: false,
    };
}

function resolveStandaloneDevFallbackRootRelativePath(plan: StandaloneDevBuildPlan, options: StandaloneDevBuildOptions): string {
    if (plan.fallbackRootRelativePath) {
        return plan.fallbackRootRelativePath;
    }

    const cwd = resolve(options.cwd || process.cwd());
    const primaryBuild = options.buildConfig || options.allBuilds?.[0] || {};
    return normalizeRelativePath(relative(dirname(plan.outputPath), resolve(cwd, primaryBuild.outDir || 'dist')));
}

export function createStandaloneDevFallbackRootRelativePath(options: StandaloneDevBuildOptions): string {
    const plan = resolveStandaloneDevBuildPlan(options);
    return resolveStandaloneDevFallbackRootRelativePath(plan, options);
}

export function createStandaloneDevEntrySource(
    configPath: string | null | undefined,
    plan: StandaloneDevBuildPlan,
    devConfig?: DevServerOptions | null,
    buildOptions?: Pick<StandaloneDevBuildOptions, 'cwd' | 'buildConfig' | 'allBuilds'>,
): string {
    const fallbackRootRelativePath = resolveStandaloneDevFallbackRootRelativePath(plan, {
        cwd: buildOptions?.cwd,
        buildConfig: buildOptions?.buildConfig,
        allBuilds: buildOptions?.allBuilds,
    });
    const configImportBlock = configPath
        ? `import userConfigModule from ${JSON.stringify(normalizeImportPath(configPath))};\nconst resolvedConfig = userConfigModule ?? {};`
        : 'const resolvedConfig = {} as Record<string, any>;' ;
    const inlineConfigSource = createInlineConfigSource({
        port: devConfig?.port,
        host: devConfig?.host,
        open: devConfig?.open,
        logging: devConfig?.logging,
        domain: devConfig?.domain,
        env: devConfig?.env,
        basePath: devConfig?.basePath,
        index: devConfig?.index,
        watch: devConfig?.watch,
        ignore: devConfig?.ignore,
    });

    const clientArraySource = plan.clients
        ? `const runtimeClients = [
${plan.clients.map((client, index) => `  {
    ...(mergedConfig.clients?.[${index}] ?? {}),
    basePath: mergedConfig.clients?.[${index}]?.basePath ?? ${JSON.stringify(client.basePath)},
    fallbackRoot: resolve(__dirname, ${JSON.stringify(client.fallbackRootRelativePath)}),
    index: mergedConfig.clients?.[${index}]?.index ?? ${client.index ? JSON.stringify(client.index) : 'undefined'},
    root: resolve(__dirname, ${JSON.stringify(client.rootRelativePath)}),
    mode: 'dev',
  }`).join(',\n')}
];`
        : '';

    const rootSource = plan.usesClientArray
        ? '    clients: runtimeClients,\n'
        : `    root: resolve(__dirname, ${JSON.stringify(plan.rootRelativePath || '.')}),\n    fallbackRoot: resolve(__dirname, ${JSON.stringify(fallbackRootRelativePath)}),\n    basePath: mergedConfig.basePath ?? '',\n    index: mergedConfig.index ?? ${plan.index ? JSON.stringify(plan.index) : 'undefined'},\n`;

    return `import { createDevServer } from 'elit/server';
import { resolve } from 'node:path';

${configImportBlock}

const inlineDevConfig = ${inlineConfigSource};
const runtimeConfig = (resolvedConfig as any).dev ?? {};
const mergedConfig = { ...runtimeConfig, ...inlineDevConfig };
${clientArraySource}
const options = {
    port: mergedConfig.port || 3000,
    host: mergedConfig.host || 'localhost',
    open: mergedConfig.open ?? false,
    logging: mergedConfig.logging ?? true,
    domain: mergedConfig.domain,
    api: mergedConfig.api,
    ws: mergedConfig.ws,
    https: mergedConfig.https,
    ssr: mergedConfig.ssr,
    proxy: mergedConfig.proxy,
    worker: mergedConfig.worker ?? [],
    watch: mergedConfig.watch ?? ['**/*.ts', '**/*.js', '**/*.html', '**/*.css'],
    ignore: mergedConfig.ignore ?? ['node_modules/**', 'dist/**', '.git/**', '**/*.d.ts'],
    env: mergedConfig.env,
${rootSource}    mode: 'dev',
};

const devServer = createDevServer(options);

const shutdown = async () => {
    await devServer.close();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
`;
}

export async function buildStandaloneDevServer(options: StandaloneDevBuildOptions): Promise<string> {
    const cwd = resolve(options.cwd || process.cwd());
    const plan = resolveStandaloneDevBuildPlan({
        ...options,
        cwd,
    });
    const outputDir = dirname(plan.outputPath);

    mkdirSync(outputDir, { recursive: true });

    const { build, version } = await import('esbuild');
    const workspacePackagePlugin = createWorkspacePackagePlugin(cwd);
    const entrySource = createStandaloneDevEntrySource(options.configPath, plan, options.devConfig, {
        cwd,
        buildConfig: options.buildConfig,
        allBuilds: options.allBuilds,
    });
    const needsEsbuildRuntime = standaloneDevNeedsEsbuildRuntime(cwd, options.devConfig);

    await build({
        stdin: {
            contents: entrySource,
            loader: 'ts',
            resolveDir: cwd,
            sourcefile: 'elit-standalone-dev-entry.ts',
        },
        bundle: true,
        outfile: plan.outputPath,
        format: 'cjs',
        mainFields: ['module', 'main'],
        platform: 'node',
        plugins: [workspacePackagePlugin],
        external: ['esbuild', 'javascript-obfuscator', 'open'],
        sourcemap: false,
        target: 'es2020',
        logLevel: options.logging === false ? 'silent' : 'info',
    });

    writeStandalonePackageJson(plan.packageJsonPath, basename(plan.outputPath), {
        dependencies: needsEsbuildRuntime
            ? {
                esbuild: typeof version === 'string' && version.length > 0 ? `^${version}` : '*',
            }
            : {},
        replaceDependencies: true,
    });

    if (options.logging !== false) {
        console.log(`  ✓ Standalone dev server → ${plan.outputPath}`);
    }

    return plan.outputPath;
}