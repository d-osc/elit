/// <reference types="node" />

import { readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

interface DesktopInteractionRecord {
    action?: string;
    route?: string;
    payload?: {
        title?: string;
        autoClose?: boolean;
    };
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectDir = resolve(scriptDir, '..');
const repoDir = resolve(projectDir, '..', '..');
const elitCliPath = resolve(projectDir, 'node_modules', 'elit', 'dist', 'cli.cjs');
const interactionFile = resolve(projectDir, 'desktop-dist', 'desktop-smoke-interactions.jsonl');

rmSync(interactionFile, { force: true });

const nativeBuild = spawnSync(
    'cargo',
    [
        'build',
        '--manifest-path',
        resolve(repoDir, 'Cargo.toml'),
        '--bin',
        'elit-desktop-native',
    ],
    {
        cwd: repoDir,
        env: {
            ...process.env,
            CARGO_TARGET_DIR: resolve(repoDir, 'target', 'desktop', 'native'),
        },
        stdio: 'inherit',
    },
);

if (nativeBuild.status !== 0) {
    process.exit(nativeBuild.status ?? 1);
}

const result = spawnSync(
    process.execPath,
    [
        elitCliPath,
        'desktop',
        'run',
        '--mode',
        'native',
        './src/desktop-smoke.ts',
    ],
    {
        cwd: projectDir,
        env: {
            ...process.env,
            ELIT_DESKTOP_SMOKE_INTERACTION_FILE: interactionFile,
        },
        stdio: 'inherit',
    },
);

if (result.status !== 0) {
    process.exit(result.status ?? 1);
}

const lines = readFileSync(interactionFile, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

if (lines.length === 0) {
    throw new Error('Desktop native smoke did not emit any interaction output.');
}

const records = lines.map((line) => JSON.parse(line) as DesktopInteractionRecord);
const readyEvent = records.find((record) => record.action === 'desktop:ready');

if (!readyEvent) {
    throw new Error(`Expected a desktop:ready interaction, found: ${lines.join(', ')}`);
}

if (readyEvent.payload?.autoClose !== true) {
    throw new Error(`Expected desktop:ready payload.autoClose=true, found: ${JSON.stringify(readyEvent)}`);
}

console.log(`Validated ${records.length} native desktop interaction record(s) from ${interactionFile}`);