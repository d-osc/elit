import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const fileId = process.env.ELIT_WAPK_GOOGLE_DRIVE_FILE_ID?.trim();

if (!fileId) {
    throw new Error('ELIT_WAPK_GOOGLE_DRIVE_FILE_ID is required for pm:start:direct.');
}

const currentDir = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(currentDir, '..');
const repoRoot = resolve(exampleRoot, '..', '..');
const cliEntry = resolve(repoRoot, 'dist', 'cli.js');
const args = [
    cliEntry,
    'pm',
    'start',
    '--wapk',
    `gdrive://${fileId}`,
    '--google-drive-token-env',
    'GOOGLE_DRIVE_ACCESS_TOKEN',
    '--name',
    'drive-app-direct',
    '--runtime',
    'bun',
    '--watcher',
    '--archive-watch',
    '--sync-interval',
    '150',
    '--archive-sync-interval',
    '150',
];

if (process.env.ELIT_WAPK_GOOGLE_DRIVE_SHARED_DRIVE === 'true') {
    args.push('--google-drive-shared-drive');
}

if (process.env.ELIT_WAPK_PASSWORD?.trim()) {
    args.push('--password', process.env.ELIT_WAPK_PASSWORD.trim());
}

const result = spawnSync(process.execPath, args, {
    cwd: exampleRoot,
    stdio: 'inherit',
    windowsHide: true,
    env: process.env,
});

if (result.error) {
    throw result.error;
}

process.exit(result.status ?? 0);