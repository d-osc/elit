/// <reference path="../../src/test-globals.d.ts" />

import { getDefaultDesktopMode, parseDesktopMode, resolveConfiguredDesktopEntry } from '../../src/desktop-cli';

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