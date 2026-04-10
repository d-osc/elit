import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(currentDir, '..');
const repoRoot = resolve(exampleRoot, '..', '..');
const cliEntry = resolve(repoRoot, 'dist', 'cli.js');

const result = spawnSync(process.execPath, [cliEntry, 'pm', 'start', 'drive-app'], {
    cwd: exampleRoot,
    stdio: 'inherit',
    windowsHide: true,
    env: process.env,
});

if (result.error) {
    throw result.error;
}

process.exit(result.status ?? 0);