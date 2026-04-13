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

    it('uses workspace-local dist JavaScript paths for the elit workspace root in both dev and preview', async () => {
        const workspaceRoot = createTempDir('elit-server-workspace-');

        writeFileSync(join(workspaceRoot, 'package.json'), JSON.stringify({ name: 'elit' }, null, 2));

        expect(await resolveWorkspaceElitImportBasePath(workspaceRoot, '', 'dev')).toBe('/dist');
        expect(await resolveWorkspaceElitImportBasePath(workspaceRoot, '/base', 'preview')).toBe('/base/dist');

        const devImports = parseImportMap(await createElitImportMap(workspaceRoot, '', 'dev'));

        expect(devImports.elit).toBe('/dist/index.js');
        expect(devImports['elit/dom']).toBe('/dist/dom.js');
        expect(JSON.stringify(devImports)).not.toContain('/src/');
        expect(JSON.stringify(devImports)).not.toContain('.ts');
    });

    it('maps installed elit packages through dist exports instead of src paths', async () => {
        const appRoot = createTempDir('elit-server-import-map-');
        const installedElitDir = join(appRoot, 'node_modules', 'elit');

        mkdirSync(join(installedElitDir, 'dist'), { recursive: true });
        writeFileSync(join(appRoot, 'package.json'), JSON.stringify({ name: 'example-app' }, null, 2));
        writeFileSync(join(installedElitDir, 'dist', 'index.mjs'), 'export {};\n');
        writeFileSync(join(installedElitDir, 'dist', 'router.mjs'), 'export {};\n');
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
                    './router': {
                        browser: './dist/router.js',
                        import: './dist/router.mjs',
                        require: './dist/router.cjs',
                    },
                },
            }, null, 2),
        );

        expect(await resolveWorkspaceElitImportBasePath(appRoot, '', 'preview')).toBeUndefined();

        const imports = parseImportMap(await createElitImportMap(appRoot, '/base', 'preview'));

        expect(imports.elit).toBe('/base/node_modules/elit/dist/index.mjs');
        expect(imports['elit/router']).toBe('/base/node_modules/elit/dist/router.mjs');
        expect(imports['elit/']).toBe('/base/node_modules/elit/');
        expect(JSON.stringify(imports)).not.toContain('/node_modules/elit/src/');
    });
});