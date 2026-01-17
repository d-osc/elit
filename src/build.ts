/**
 * Build module for bundling applications
 * Pure implementation with cross-runtime support
 * Compatible with standard build tools API
 * - Node.js: uses esbuild
 * - Bun: uses Bun.build
 * - Deno: uses Deno.emit
 */

import { statSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, existsSync } from './fs';
import { resolve, join, basename, extname, dirname } from './path';
import { runtime } from './runtime';
import type { BuildOptions, BuildResult } from './types';

/**
 * Helper: Ensure directory exists (eliminates duplication in directory creation)
 */
function ensureDir(dirPath: string): void {
    try {
        mkdirSync(dirPath, { recursive: true });
    } catch (error) {
        // Directory might already exist
    }
}

/**
 * Helper: Calculate build time and size (eliminates duplication in build result)
 */
function calculateBuildMetrics(startTime: number, outputPath: string): { buildTime: number; size: number } {
    const buildTime = Date.now() - startTime;
    const stats = statSync(outputPath);
    return { buildTime, size: stats.size };
}

/**
 * Helper: Read file and ensure string output (eliminates duplication in file reading)
 */
function readFileAsString(filePath: string): string {
    const contentBuffer = readFileSync(filePath, 'utf-8');
    return typeof contentBuffer === 'string' ? contentBuffer : contentBuffer.toString('utf-8');
}

/**
 * Helper: Get esbuild minify options (eliminates duplication in esbuild config)
 */
function getMinifyOptions(minify?: boolean): object {
    return minify ? {
        minifyWhitespace: true,
        minifyIdentifiers: true,
        minifySyntax: true,
        legalComments: 'none',
        mangleProps: /^_/,
        keepNames: false
    } : {};
}

/**
 * Helper: Log build info (eliminates duplication in logging)
 */
function logBuildInfo(config: BuildOptions, outputPath: string): void {
    console.log('\n🔨 Building...');
    console.log(`  Entry:  ${config.entry}`);
    console.log(`  Output: ${outputPath}`);
    console.log(`  Format: ${config.format}`);
    console.log(`  Target: ${config.target}`);
}

/**
 * Helper: Log build success (eliminates duplication in success logging)
 */
function logBuildSuccess(buildTime: number, size: number): void {
    console.log(`\n✅ Build successful!`);
    console.log(`  Time: ${buildTime}ms`);
    console.log(`  Size: ${formatBytes(size)}`);
}

const defaultOptions: Omit<BuildOptions, 'entry'> = {
    outDir: 'dist',
    minify: true,
    sourcemap: false,
    target: 'es2020',
    format: 'esm',
    treeshake: true,
    logging: true,
    external: []
};

export async function build(options: BuildOptions): Promise<BuildResult> {
    const config = { ...defaultOptions, ...options };
    const startTime = Date.now();

    if (!config.entry) {
        throw new Error('Entry file is required');
    }

    const entryPath = resolve(config.entry);
    const outDir = resolve(config.outDir!);

    // Determine output filename
    let outFile = config.outFile;
    if (!outFile) {
        const baseName = basename(config.entry, extname(config.entry));
        const ext = config.format === 'cjs' ? '.cjs' : '.js';
        outFile = baseName + ext;
    }

    const outputPath = join(outDir, outFile);

    // Ensure output directory exists
    ensureDir(outDir);

    if (config.logging) {
        logBuildInfo(config, outputPath);
    }

    // Browser-only plugin for automatic client/server separation
    const browserOnlyPlugin = {
        name: 'browser-only',
        setup(build: any) {
            // External all Node.js built-in modules
            build.onResolve({ filter: /^(node:.*|fs|path|http|https|url|os|child_process|net|tls|crypto|stream|util|events|buffer|zlib|readline|process|assert|constants|dns|domain|punycode|querystring|repl|string_decoder|sys|timers|tty|v8|vm)$/ }, () => {
                return { path: 'node-builtin', external: true, sideEffects: false };
            });

            // External common server-side dependencies
            build.onResolve({ filter: /^(chokidar|esbuild|mime-types|open|ws|fs\/promises)$/ }, () => {
                return { path: 'server-dep', external: true, sideEffects: false };
            });

            // Intercept imports from elit server-side modules
            build.onLoad({ filter: /[\\/](server|config|cli)\.ts$/ }, () => {
                return {
                    contents: 'export {}',
                    loader: 'js',
                };
            });
        },
    };

    try {
        const platform = config.platform || (config.format === 'cjs' ? 'node' : 'browser');
        const plugins = platform === 'browser' ? [browserOnlyPlugin] : [];

        // Prepare environment variables for injection
        const define: Record<string, string> = {};
        if (config.env) {
            Object.entries(config.env).forEach(([key, value]) => {
                // Only inject variables prefixed with VITE_ to client code
                if (key.startsWith('VITE_')) {
                    define[`import.meta.env.${key}`] = JSON.stringify(value);
                }
            });
            // Add MODE
            if (config.env.MODE) {
                define['import.meta.env.MODE'] = JSON.stringify(config.env.MODE);
            }
            // Add DEV/PROD flags
            define['import.meta.env.DEV'] = JSON.stringify(config.env.MODE !== 'production');
            define['import.meta.env.PROD'] = JSON.stringify(config.env.MODE === 'production');
        }

        let result: any;
        let buildTime: number;
        let size: number;

        if (runtime === 'node') {
            // Node.js - use esbuild
            const { build: esbuild } = await import('esbuild');

            const baseOptions = {
                entryPoints: [entryPath],
                bundle: true,
                outfile: outputPath,
                format: config.format,
                target: config.target,
                minify: config.minify,
                sourcemap: config.sourcemap,
                external: config.external,
                treeShaking: config.treeshake,
                globalName: config.globalName,
                platform,
                plugins,
                define,
                logLevel: config.logging ? 'info' : 'silent',
                metafile: true,
                // Prioritize browser field for browser builds
                mainFields: platform === 'browser' ? ['browser', 'module', 'main'] : ['module', 'main'],
            };

            const esbuildOptions: any = {
                ...baseOptions,
                ...getMinifyOptions(config.minify)
            };

            if (config.resolve?.alias) {
                esbuildOptions.resolve = { alias: config.resolve.alias };
            }

            result = await esbuild(esbuildOptions);

            ({ buildTime, size } = calculateBuildMetrics(startTime, outputPath));
        } else if (runtime === 'bun') {
            // Bun - use Bun.build
            // @ts-ignore
            result = await Bun.build({
                entrypoints: [entryPath],
                outdir: outDir,
                target: 'bun',
                format: config.format === 'cjs' ? 'cjs' : 'esm',
                minify: config.minify,
                sourcemap: config.sourcemap ? 'external' : 'none',
                external: config.external,
                naming: outFile,
                define
            });

            if (!result.success) {
                throw new Error('Bun build failed: ' + JSON.stringify(result.logs));
            }

            ({ buildTime, size } = calculateBuildMetrics(startTime, outputPath));
        } else {
            // Deno - use Deno.emit
            // @ts-ignore
            result = await Deno.emit(entryPath, {
                bundle: 'module',
                check: false,
                compilerOptions: {
                    target: config.target,
                    module: config.format === 'cjs' ? 'commonjs' : 'esnext',
                    sourceMap: config.sourcemap
                }
            });

            // Write the bundled output
            const bundledCode = result.files['deno:///bundle.js'];
            if (bundledCode) {
                // @ts-ignore
                await Deno.writeTextFile(outputPath, bundledCode);
            }

            ({ buildTime, size } = calculateBuildMetrics(startTime, outputPath));
        }

        if (config.logging) {
            logBuildSuccess(buildTime, size);

            // Show metafile info (Node.js esbuild only)
            if (runtime === 'node' && result.metafile) {
                const inputs = Object.keys(result.metafile.inputs).length;
                console.log(`  Files: ${inputs} input(s)`);

                // Show largest modules
                const outputKeys = Object.keys(result.metafile.outputs);
                if (outputKeys.length > 0) {
                    const mainOutput = result.metafile.outputs[outputKeys[0]];
                    if (mainOutput && mainOutput.inputs) {
                        const sortedInputs = Object.entries(mainOutput.inputs)
                            .sort(([, a], [, b]) => {
                                const aBytes = (a as any).bytesInOutput || 0;
                                const bBytes = (b as any).bytesInOutput || 0;
                                return bBytes - aBytes;
                            })
                            .slice(0, 5);

                        if (sortedInputs.length > 0) {
                            console.log('\n  📊 Top 5 largest modules:');
                            sortedInputs.forEach(([file, info]) => {
                                const fileName = file.split(/[/\\]/).pop() || file;
                                const infoBytes = (info as any).bytesInOutput || 0;
                                console.log(`     ${fileName.padEnd(30)} ${formatBytes(infoBytes)}`);
                            });
                        }
                    }
                }
            }
        }

        const buildResult: BuildResult = {
            outputPath,
            buildTime,
            size
        };

        // Handle copy files
        if (config.copy && config.copy.length > 0) {
            if (config.logging) {
                console.log('\n📦 Copying files...');
            }

            for (const copyItem of config.copy) {
                const fromPath = resolve(copyItem.from);
                const toPath = resolve(outDir, copyItem.to);

                // Ensure target directory exists
                const targetDir = dirname(toPath);
                if (!existsSync(targetDir)) {
                    ensureDir(targetDir);
                }

                if (existsSync(fromPath)) {
                    if (copyItem.transform) {
                        // Read, transform, and write
                        const content = readFileAsString(fromPath);
                        const transformed = copyItem.transform(content, config);
                        writeFileSync(toPath, transformed);
                    } else {
                        // Direct copy
                        copyFileSync(fromPath, toPath);
                    }

                    if (config.logging) {
                        console.log(`  ✓ ${copyItem.from} → ${copyItem.to}`);
                    }
                } else if (config.logging) {
                    console.warn(`  ⚠ File not found: ${copyItem.from}`);
                }
            }
        }

        // Call post-build hook
        if (config.onBuildEnd) {
            await config.onBuildEnd(buildResult);
        }

        if (config.logging) {
            console.log('');
        }

        return buildResult;
    } catch (error) {
        if (config.logging) {
            console.error('\n❌ Build failed:');
            console.error(error);
        }
        throw error;
    }
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export type { BuildOptions, BuildResult } from './types';
