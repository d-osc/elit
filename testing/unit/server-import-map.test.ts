/// <reference path="../../src/test-globals.d.ts" />

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { clearImportMapCache, createElitImportMap, resolveWorkspaceElitImportBasePath } from '../../src/server';

function parseImportMap(html: string): Record<string, string> {
    const match = html.match(/^<script type="importmap">([\s\S]+)<\/script>$/);

    if (!match) {
        throw new Error(`Expected import map script tag, received: ${html}`);
    }

    return (JSON.parse(match[1]) as { imports: Record<string, string> }).imports;
}

describe('server import map generation', () => {
    const tempDirs: string[] = [];

    function createTempDir(prefix: string): string {
        const tempDir = mkdtempSync(join(tmpdir(), prefix));
        tempDirs.push(tempDir);
        return tempDir;
    }

    afterEach(() => {
        clearImportMapCache();

        while (tempDirs.length > 0) {
            rmSync(tempDirs.pop()!, { recursive: true, force: true });
        }
    });

    it('uses workspace-local dist ESM paths for the elit workspace root in both dev and preview', async () => {
        const workspaceRoot = createTempDir('elit-server-workspace-');

        writeFileSync(join(workspaceRoot, 'package.json'), JSON.stringify({ name: 'elit' }, null, 2));

        expect(await resolveWorkspaceElitImportBasePath(workspaceRoot, '', 'dev')).toBe('/dist');
        expect(await resolveWorkspaceElitImportBasePath(workspaceRoot, '/base', 'preview')).toBe('/base/dist');

        const devImports = parseImportMap(await createElitImportMap(workspaceRoot, '', 'dev'));

        expect(devImports.elit).toBe('/dist/index.mjs');
        expect(devImports['elit/dom']).toBe('/dist/dom.mjs');
        expect(devImports['elit/el']).toBe('/dist/el.mjs');
        expect(devImports['elit/native']).toBe('/dist/native.mjs');
        expect(devImports['elit/universal']).toBe('/dist/universal.mjs');
        expect(devImports['elit/router']).toBe('/dist/router.mjs');
        expect(devImports['elit/state']).toBe('/dist/state.mjs');
        expect(devImports['elit/style']).toBe('/dist/style.mjs');
        expect(devImports['elit/hmr']).toBe('/dist/hmr.mjs');
        expect(devImports['elit/types']).toBe('/dist/types.mjs');
        expect(devImports['elit/']).toBeUndefined();
        expect(devImports['elit/server']).toBeUndefined();
        expect(devImports['elit/build']).toBeUndefined();
        expect(JSON.stringify(devImports)).not.toContain('/src/');
        expect(JSON.stringify(devImports)).not.toContain('.ts');
    });

    it('maps only browser-safe installed elit exports through dist outputs', async () => {
        const appRoot = createTempDir('elit-server-import-map-');
        const installedElitDir = join(appRoot, 'node_modules', 'elit');

        mkdirSync(join(installedElitDir, 'dist'), { recursive: true });
        writeFileSync(join(appRoot, 'package.json'), JSON.stringify({ name: 'example-app' }, null, 2));
        writeFileSync(join(installedElitDir, 'dist', 'index.mjs'), 'export {};\n');
        writeFileSync(join(installedElitDir, 'dist', 'dom.mjs'), 'export {};\n');
        writeFileSync(join(installedElitDir, 'dist', 'el.mjs'), 'export {};\n');
        writeFileSync(join(installedElitDir, 'dist', 'native.mjs'), 'export {};\n');
        writeFileSync(join(installedElitDir, 'dist', 'universal.mjs'), 'export {};\n');
        writeFileSync(join(installedElitDir, 'dist', 'router.mjs'), 'export {};\n');
        writeFileSync(join(installedElitDir, 'dist', 'state.mjs'), 'export {};\n');
        writeFileSync(join(installedElitDir, 'dist', 'style.mjs'), 'export {};\n');
        writeFileSync(join(installedElitDir, 'dist', 'hmr.mjs'), 'export {};\n');
        writeFileSync(join(installedElitDir, 'dist', 'types.mjs'), 'export {};\n');
        writeFileSync(join(installedElitDir, 'dist', 'server.mjs'), 'export {};\n');
        writeFileSync(join(installedElitDir, 'dist', 'build.mjs'), 'export {};\n');
        writeFileSync(
            join(installedElitDir, 'package.json'),
            JSON.stringify({
                name: 'elit',
                exports: {
                    '.': {
                        browser: './dist/index.js',
                        import: './dist/index.mjs',
                        require: './dist/index.cjs',
                    },
                    './dom': {
                        import: './dist/dom.mjs',
                    },
                    './el': {
                        import: './dist/el.mjs',
                    },
                    './native': {
                        import: './dist/native.mjs',
                    },
                    './universal': {
                        import: './dist/universal.mjs',
                    },
                    './router': {
                        browser: './dist/router.js',
                        import: './dist/router.mjs',
                        require: './dist/router.cjs',
                    },
                    './state': {
                        import: './dist/state.mjs',
                    },
                    './style': {
                        import: './dist/style.mjs',
                    },
                    './hmr': {
                        import: './dist/hmr.mjs',
                    },
                    './types': {
                        import: './dist/types.mjs',
                    },
                    './server': {
                        import: './dist/server.mjs',
                    },
                    './build': {
                        import: './dist/build.mjs',
                    },
                },
            }, null, 2),
        );

        expect(await resolveWorkspaceElitImportBasePath(appRoot, '', 'preview')).toBeUndefined();

        const imports = parseImportMap(await createElitImportMap(appRoot, '/base', 'preview'));

        expect(imports.elit).toBe('/base/node_modules/elit/dist/index.mjs');
        expect(imports['elit/dom']).toBe('/base/node_modules/elit/dist/dom.mjs');
        expect(imports['elit/el']).toBe('/base/node_modules/elit/dist/el.mjs');
        expect(imports['elit/native']).toBe('/base/node_modules/elit/dist/native.mjs');
        expect(imports['elit/universal']).toBe('/base/node_modules/elit/dist/universal.mjs');
        expect(imports['elit/router']).toBe('/base/node_modules/elit/dist/router.mjs');
        expect(imports['elit/state']).toBe('/base/node_modules/elit/dist/state.mjs');
        expect(imports['elit/style']).toBe('/base/node_modules/elit/dist/style.mjs');
        expect(imports['elit/hmr']).toBe('/base/node_modules/elit/dist/hmr.mjs');
        expect(imports['elit/types']).toBe('/base/node_modules/elit/dist/types.mjs');
        expect(imports['elit/']).toBeUndefined();
        expect(imports['elit/server']).toBeUndefined();
        expect(imports['elit/build']).toBeUndefined();
        expect(JSON.stringify(imports)).not.toContain('/node_modules/elit/src/');
    });
});