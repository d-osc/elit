/// <reference path="../../src/test-globals.d.ts" />

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
    getDefaultDesktopMode,
    parseDesktopMode,
    resolveConfiguredDesktopEntry,
    resolveDesktopBootstrapSupportModulePath,
} from '../../src/desktop-cli';

describe('desktop cli mode helpers', () => {
    it('defaults to hybrid when no native desktop entry is configured', () => {
        expect(getDefaultDesktopMode()).toBe('hybrid');
        expect(getDefaultDesktopMode({ entry: './src/main.ts' })).toBe('hybrid');
    });

    it('defaults to native when desktop.native.entry is configured', () => {
        expect(getDefaultDesktopMode({ native: { entry: './src/native-main.ts' } })).toBe('native');
    });

    it('prefers desktop.native.entry in native mode and falls back to desktop.entry for compatibility', () => {
        expect(resolveConfiguredDesktopEntry('native', {
            entry: './src/legacy.ts',
            native: { entry: './src/native.ts' },
        })).toBe('./src/native.ts');

        expect(resolveConfiguredDesktopEntry('native', {
            entry: './src/legacy.ts',
        })).toBe('./src/legacy.ts');
    });

    it('uses desktop.entry in hybrid mode', () => {
        expect(resolveConfiguredDesktopEntry('hybrid', {
            entry: './src/hybrid.ts',
            native: { entry: './src/native.ts' },
        })).toBe('./src/hybrid.ts');
    });

    it('rejects invalid desktop mode values', () => {
        expect(() => parseDesktopMode('web', '--mode')).toThrow('Expected "native" or "hybrid"');
    });
});

describe('desktop bootstrap support module resolution', () => {
    it('prefers source helpers when they are available', () => {
        const packageRoot = mkdtempSync(join(tmpdir(), 'elit-desktop-cli-'));

        try {
            mkdirSync(join(packageRoot, 'src'), { recursive: true });
            mkdirSync(join(packageRoot, 'dist'), { recursive: true });

            const sourcePath = join(packageRoot, 'src', 'render-context.ts');
            const distPath = join(packageRoot, 'dist', 'render-context.mjs');

            writeFileSync(sourcePath, 'export {}\n');
            writeFileSync(distPath, 'export {}\n');

            expect(resolveDesktopBootstrapSupportModulePath('render-context', packageRoot)).toBe(sourcePath);
        } finally {
            rmSync(packageRoot, { force: true, recursive: true });
        }
    });

    it('falls back to packaged dist helpers when source files are not shipped', () => {
        const packageRoot = mkdtempSync(join(tmpdir(), 'elit-desktop-cli-'));

        try {
            mkdirSync(join(packageRoot, 'dist'), { recursive: true });

            const distPath = join(packageRoot, 'dist', 'desktop-auto-render.mjs');
            writeFileSync(distPath, 'export function installDesktopRenderTracking() {}\n');

            expect(resolveDesktopBootstrapSupportModulePath('desktop-auto-render', packageRoot)).toBe(distPath);
        } finally {
            rmSync(packageRoot, { force: true, recursive: true });
        }
    });
});