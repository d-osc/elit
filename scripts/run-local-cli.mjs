#!/usr/bin/env node

import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');

async function loadCliFromSource() {
    const result = await build({
        entryPoints: [resolve(repoRoot, 'src/cli.ts')],
        absWorkingDir: repoRoot,
        bundle: true,
        write: false,
        format: 'cjs',
        platform: 'node',
        target: 'es2020',
        sourcemap: 'inline',
        external: ['bun', 'esbuild', 'source-map', 'v8', 'monocart-coverage-reports', 'smtp-server'],
        tsconfigRaw: {
            compilerOptions: {
                jsx: 'react',
                jsxFactory: 'h',
                jsxFragmentFactory: 'Fragment',
            },
        },
    });

    const output = result.outputFiles[0];
    if (!output) {
        throw new Error('Unable to bundle the Elit CLI from source.');
    }

    const moduleObject = { exports: {} };
    const bundledCli = new Function('module', 'exports', 'require', '__filename', '__dirname', output.text);
    bundledCli(moduleObject, moduleObject.exports, require, resolve(repoRoot, 'src/cli.ts'), resolve(repoRoot, 'src'));

    return moduleObject.exports;
}

async function run() {
    const cliModule = await loadCliFromSource();
    if (!cliModule || typeof cliModule.main !== 'function') {
        throw new Error('Unable to load Elit CLI main() from source.');
    }

    await cliModule.main();
}

run().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});