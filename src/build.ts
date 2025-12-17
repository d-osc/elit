/**
 * Build module for bundling applications
 */

import { build as esbuild } from 'esbuild';
import { statSync, mkdirSync } from 'fs';
import { resolve, join, basename, extname } from 'path';
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

    try {
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
            platform: config.format === 'cjs' ? 'node' : 'browser',
            logLevel: config.logging ? 'info' : 'silent',
            metafile: true
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
            }
            console.log('');
        }

        return {
            outputPath,
            buildTime,
            size
        };
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
