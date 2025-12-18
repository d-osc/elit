/**
 * Build module for bundling applications
 */

import { build as esbuild } from 'esbuild';
import { statSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { resolve, join, basename, extname, dirname } from 'path';
import type { BuildOptions, BuildResult } from './types';

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
    try {
        mkdirSync(outDir, { recursive: true });
    } catch (error) {
        // Directory might already exist
    }

    if (config.logging) {
        console.log('\n🔨 Building...');
        console.log(`  Entry:  ${config.entry}`);
        console.log(`  Output: ${outputPath}`);
        console.log(`  Format: ${config.format}`);
        console.log(`  Target: ${config.target}`);
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

        // Build with esbuild
        const result = await esbuild({
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
            // Additional optimizations
            ...(config.minify && {
                minifyWhitespace: true,
                minifyIdentifiers: true,
                minifySyntax: true,
                legalComments: 'none',
                mangleProps: /^_/,  // Mangle properties starting with _
                keepNames: false
            })
        });

        const buildTime = Date.now() - startTime;
        const stats = statSync(outputPath);
        const size = stats.size;

        if (config.logging) {
            console.log(`\n✅ Build successful!`);
            console.log(`  Time: ${buildTime}ms`);
            console.log(`  Size: ${formatBytes(size)}`);

            if (result.metafile) {
                const inputs = Object.keys(result.metafile.inputs).length;
                console.log(`  Files: ${inputs} input(s)`);

                // Show largest modules
                const outputKeys = Object.keys(result.metafile.outputs);
                if (outputKeys.length > 0) {
                    const mainOutput = result.metafile.outputs[outputKeys[0]];
                    if (mainOutput && mainOutput.inputs) {
                        const sortedInputs = Object.entries(mainOutput.inputs)
                            .sort(([, a], [, b]) => b.bytesInOutput - a.bytesInOutput)
                            .slice(0, 5);

                        if (sortedInputs.length > 0) {
                            console.log('\n  📊 Top 5 largest modules:');
                            sortedInputs.forEach(([file, info]) => {
                                const fileName = file.split(/[/\\]/).pop() || file;
                                console.log(`     ${fileName.padEnd(30)} ${formatBytes(info.bytesInOutput)}`);
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
                    mkdirSync(targetDir, { recursive: true });
                }

                if (existsSync(fromPath)) {
                    if (copyItem.transform) {
                        // Read, transform, and write
                        const content = readFileSync(fromPath, 'utf-8');
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
