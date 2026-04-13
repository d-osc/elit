import { existsSync, mkdirSync, readFileSync, writeFileSync } from './fs';
import { basename, dirname, extname, join, relative, resolve } from './path';

import type { BuildOptions, PreviewOptions } from './types';
import { resolveWorkspacePackageImport } from './workspace-package';

interface StandalonePreviewClientPlan {
    basePath: string;
    index?: string;
    rootRelativePath: string;
}

export interface StandalonePreviewBuildPlan {
    clients?: StandalonePreviewClientPlan[];
    index?: string;
    outputPath: string;
    outputRoot: string;
    packageJsonPath: string;
    rootRelativePath?: string;
    usesClientArray: boolean;
}

export interface StandalonePreviewBuildOptions {
    allBuilds: BuildOptions[];
    buildConfig: BuildOptions;
    configPath?: string | null;
    cwd?: string;
    logging?: boolean;
    previewConfig?: PreviewOptions | null;
    outFile?: string;
}

export function createWorkspacePackagePlugin(resolveDir: string, options: { preferBuilt?: boolean; preferredBuiltFormat?: 'cjs' | 'esm' } = {}) {
    return {
        name: 'workspace-package-self-reference',
        setup(build: any) {
            build.onResolve({ filter: /^elit(?:\/.*)?$/ }, (args: { path: string; resolveDir?: string }) => {
                const resolved = resolveWorkspacePackageImport(args.path, args.resolveDir || resolveDir, options);
                return resolved ? { path: resolved } : undefined;
            });
        },
    };
}

export function normalizeRelativePath(filePath: string): string {
    const normalized = filePath.replace(/\\/g, '/');
    return normalized === '' ? '.' : normalized;
}

export function normalizeImportPath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
}

function normalizePackageDependencies(value: unknown): Record<string, string> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    const dependencies: Record<string, string> = {};
    for (const [key, entryValue] of Object.entries(value)) {
        if (typeof entryValue === 'string') {
            dependencies[key] = entryValue;
        }
    }

    return dependencies;
}

export function createInlineConfigSource(config: Record<string, unknown>): string {
    const entries = Object.entries(config).filter(([, value]) => value !== undefined);

    if (entries.length === 0) {
        return '{}';
    }

    return `{ ${entries.map(([key, value]) => `${JSON.stringify(key)}: ${JSON.stringify(value)}`).join(', ')} }`;
}

function resolveBuildOutputFile(buildConfig: BuildOptions): string {
    if (buildConfig.outFile) {
        return buildConfig.outFile;
    }

    const baseName = basename(buildConfig.entry, extname(buildConfig.entry));
    const ext = buildConfig.format === 'cjs' ? '.cjs' : '.js';
    return baseName + ext;
}

function readJsonFile(filePath: string): Record<string, unknown> | undefined {
    try {
        const rawContent = readFileSync(filePath, 'utf-8');
        const content = typeof rawContent === 'string' ? rawContent : rawContent.toString('utf-8');
        return JSON.parse(content) as Record<string, unknown>;
    } catch {
        return undefined;
    }
}

export function writeStandalonePackageJson(
    packageJsonPath: string,
    outputFile: string,
    options: { dependencies?: Record<string, string>; replaceDependencies?: boolean } = {},
): void {
    const currentPackageJson = existsSync(packageJsonPath)
        ? readJsonFile(packageJsonPath)
        : undefined;
    const basePackageJson = options.replaceDependencies && currentPackageJson
        ? Object.fromEntries(Object.entries(currentPackageJson).filter(([key]) => key !== 'dependencies'))
        : (currentPackageJson ?? {});

    const dependencies = options.replaceDependencies
        ? { ...(options.dependencies ?? {}) }
        : {
            ...normalizePackageDependencies(currentPackageJson?.dependencies),
            ...(options.dependencies ?? {}),
        };

    const nextPackageJson = {
        ...basePackageJson,
        ...(Object.keys(dependencies).length > 0 ? { dependencies } : {}),
        private: true,
        type: 'commonjs',
        main: outputFile,
    };

    writeFileSync(packageJsonPath, `${JSON.stringify(nextPackageJson, null, 2)}\n`);
}

export function resolveStandalonePreviewBuildPlan(options: StandalonePreviewBuildOptions): StandalonePreviewBuildPlan {
    const cwd = resolve(options.cwd || process.cwd());
    const previewConfig = options.previewConfig || undefined;
    const allBuilds = options.allBuilds.length > 0 ? options.allBuilds : [options.buildConfig];
    const primaryBuild = options.buildConfig;
    const outputRoot = resolve(cwd, previewConfig?.root || primaryBuild.outDir || allBuilds[0]?.outDir || 'dist');
    const outputFile = options.outFile || previewConfig?.outFile || primaryBuild.standalonePreviewOutFile || 'index.js';
    const outputPath = resolve(join(outputRoot, outputFile));
    const clientOutputPath = resolve(join(resolve(cwd, primaryBuild.outDir || 'dist'), resolveBuildOutputFile(primaryBuild)));

    if (outputPath === clientOutputPath) {
        throw new Error(`Standalone preview output ${outputFile} conflicts with the client bundle. Set preview.outFile or --preview-out-file to a different filename.`);
    }

    const bundleDir = dirname(outputPath);

    if (previewConfig?.clients && previewConfig.clients.length > 0) {
        const clients = previewConfig.clients.map((client, index) => {
            const buildForClient = allBuilds[index] || primaryBuild;
            const clientRoot = resolve(cwd, buildForClient.outDir || primaryBuild.outDir || client.root || 'dist');

            return {
                basePath: client.basePath || '',
                index: client.index,
                rootRelativePath: normalizeRelativePath(relative(bundleDir, clientRoot)),
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

    const rootRelativePath = normalizeRelativePath(relative(bundleDir, outputRoot));

    return {
        index: previewConfig?.index,
        outputPath,
        outputRoot,
        packageJsonPath: join(outputRoot, 'package.json'),
        rootRelativePath,
        usesClientArray: false,
    };
}

export function createStandalonePreviewEntrySource(
    configPath: string | null | undefined,
    plan: StandalonePreviewBuildPlan,
    previewConfig?: PreviewOptions | null,
): string {
    const configImportBlock = configPath
        ? `import userConfigModule from ${JSON.stringify(normalizeImportPath(configPath))};\nconst resolvedConfig = userConfigModule ?? {};`
        : 'const resolvedConfig = {} as Record<string, any>;' ;
    const inlineConfigSource = createInlineConfigSource({
        port: previewConfig?.port,
        host: previewConfig?.host,
        open: previewConfig?.open,
        logging: previewConfig?.logging,
        domain: previewConfig?.domain,
        env: previewConfig?.env,
        basePath: previewConfig?.basePath,
        index: previewConfig?.index,
    });

    const clientArraySource = plan.clients
        ? `const runtimeClients = [
${plan.clients.map((client, index) => `  {
    ...(mergedPreviewConfig.clients?.[${index}] ?? {}),
    basePath: mergedPreviewConfig.clients?.[${index}]?.basePath ?? ${JSON.stringify(client.basePath)},
    index: mergedPreviewConfig.clients?.[${index}]?.index ?? ${client.index ? JSON.stringify(client.index) : 'undefined'},
    root: resolve(__dirname, ${JSON.stringify(client.rootRelativePath)}),
  }`).join(',\n')}
];`
        : '';

    const rootSource = plan.usesClientArray
        ? '    clients: runtimeClients,\n'
        : `    root: resolve(__dirname, ${JSON.stringify(plan.rootRelativePath || '.')}),\n    basePath: mergedPreviewConfig.basePath ?? '',\n    index: mergedPreviewConfig.index ?? ${plan.index ? JSON.stringify(plan.index) : 'undefined'},\n`;

    return `import { createDevServer } from 'elit/server';
import { resolve } from 'node:path';

${configImportBlock}

const inlinePreviewConfig = ${inlineConfigSource};
const previewConfig = (resolvedConfig as any).preview ?? {};
const mergedPreviewConfig = { ...previewConfig, ...inlinePreviewConfig };
${clientArraySource}
const options = {
    port: mergedPreviewConfig.port || 4173,
    host: mergedPreviewConfig.host || 'localhost',
    open: mergedPreviewConfig.open ?? false,
    logging: mergedPreviewConfig.logging ?? true,
    domain: mergedPreviewConfig.domain,
    api: mergedPreviewConfig.api,
    ws: mergedPreviewConfig.ws,
    https: mergedPreviewConfig.https,
    ssr: mergedPreviewConfig.ssr,
    proxy: mergedPreviewConfig.proxy,
    worker: mergedPreviewConfig.worker,
    env: mergedPreviewConfig.env,
${rootSource}    mode: 'preview',
};

const devServer = createDevServer(options);

if (options.logging === false) {
    const previewUrl = \`http://\${options.host}:\${options.port}\`;
    console.log(\`[elit] Preview server running at \${previewUrl}\`);
}

const shutdown = async () => {
    await devServer.close();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
`;
}

export async function buildStandalonePreviewServer(options: StandalonePreviewBuildOptions): Promise<string> {
    const cwd = resolve(options.cwd || process.cwd());
    const plan = resolveStandalonePreviewBuildPlan({
        ...options,
        cwd,
    });
    const outputDir = dirname(plan.outputPath);

    mkdirSync(outputDir, { recursive: true });

    const { build } = await import('esbuild');
    const workspacePackagePlugin = createWorkspacePackagePlugin(cwd, {
        preferBuilt: true,
        preferredBuiltFormat: 'cjs',
    });
    const entrySource = createStandalonePreviewEntrySource(options.configPath, plan, options.previewConfig);

    await build({
        stdin: {
            contents: entrySource,
            loader: 'ts',
            resolveDir: cwd,
            sourcefile: 'elit-standalone-preview-entry.ts',
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

    writeStandalonePackageJson(plan.packageJsonPath, basename(plan.outputPath));

    if (options.logging !== false) {
        console.log(`  ✓ Standalone preview server → ${plan.outputPath}`);
    }

    return plan.outputPath;
}