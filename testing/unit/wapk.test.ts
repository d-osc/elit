/// <reference path="../../src/test-globals.d.ts" />

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createWapkLiveSync, extractWapkArchive, packWapkDirectory, prepareWapkApp, readWapkArchive } from '../../src/wapk-cli';

function createTempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'elit-wapk-'));
}

function createTempWapkProject(): string {
    const dir = createTempDir();
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
        name: 'test-wapk-app',
        version: '1.0.0',
        main: 'src/index.js',
    }, null, 2));
    fs.writeFileSync(path.join(dir, 'src', 'index.js'), 'console.log("hello");\n');
    return dir;
}

describe('wapk helpers', () => {
    it('packs a directory and infers runtime and entry from package.json scripts', async () => {
        const dir = createTempDir();

        try {
            fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
            fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
                name: '@scope/demo-app',
                version: '2.1.0',
                scripts: {
                    start: 'bun run src/server.ts',
                },
            }, null, 2));
            fs.writeFileSync(path.join(dir, 'src', 'server.ts'), 'console.log("hello");\n');
            fs.writeFileSync(path.join(dir, 'README.md'), '# demo\n');

            const archivePath = await packWapkDirectory(dir, {
                outputPath: path.join(dir, 'demo.wapk'),
            });
            const archive = readWapkArchive(archivePath);

            expect(archive.header.name).toBe('@scope/demo-app');
            expect(archive.header.version).toBe('2.1.0');
            expect(archive.header.runtime).toBe('bun');
            expect(archive.header.entry).toBe('src/server.ts');
            expect(archive.files.some((file) => file.path === 'src/server.ts')).toBe(true);
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('skips node_modules by default and includes them when requested', async () => {
        const dir = createTempDir();

        try {
            fs.mkdirSync(path.join(dir, 'node_modules', 'example'), { recursive: true });
            fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
                name: 'deps-app',
                version: '1.0.0',
                main: 'index.js',
                dependencies: {
                    example: '1.0.0',
                },
            }, null, 2));
            fs.writeFileSync(path.join(dir, 'index.js'), 'console.log("deps");\n');
            fs.writeFileSync(path.join(dir, 'node_modules', 'example', 'index.js'), 'module.exports = 1;\n');

            const withoutDeps = readWapkArchive(await packWapkDirectory(dir, {
                outputPath: path.join(dir, 'without-deps.wapk'),
            }));
            const withDeps = readWapkArchive(await packWapkDirectory(dir, {
                includeDeps: true,
                outputPath: path.join(dir, 'with-deps.wapk'),
            }));

            expect(withoutDeps.files.some((file) => file.path.startsWith('node_modules/'))).toBe(false);
            expect(withDeps.files.some((file) => file.path === 'node_modules/example/index.js')).toBe(true);
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('reads wapk config from elit.config.json and extracts archive contents into a named directory', async () => {
        const dir = createTempDir();

        try {
            fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
            fs.writeFileSync(path.join(dir, 'elit.config.json'), JSON.stringify({
                wapk: {
                    name: 'extract-app',
                    version: '1.0.0',
                    runtime: 'node',
                    entry: 'src/main.js',
                    port: 4321,
                    desktop: {
                        width: 900,
                    },
                },
            }, null, 2));
            fs.writeFileSync(path.join(dir, 'src', 'main.js'), 'console.log("extract");\n');

            const archivePath = await packWapkDirectory(dir, {
                outputPath: path.join(dir, 'extract-app.wapk'),
            });
            const archive = readWapkArchive(archivePath);
            const outputDir = path.join(dir, 'out');
            const extractedDir = extractWapkArchive(archivePath, outputDir);

            expect(archive.header.port).toBe(4321);
            expect(archive.header.desktop).toMatchObject({ width: 900 });
            expect(extractedDir).toBe(path.join(outputDir, 'extract-app'));
            expect(fs.readFileSync(path.join(extractedDir, 'src', 'main.js'), 'utf8')).toBe('console.log("extract");\n');
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('reads wapk config from elit.config.mts', async () => {
        const dir = createTempDir();

        try {
            fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
            fs.writeFileSync(path.join(dir, 'elit.config.mts'), [
                'export default {',
                '    wapk: {',
                '        name: "mts-app",',
                '        version: "3.0.0",',
                '        runtime: "deno",',
                '        entry: "src/main.ts",',
                '    },',
                '};',
                '',
            ].join('\n'));
            fs.writeFileSync(path.join(dir, 'src', 'main.ts'), 'console.log("mts");\n');

            const archivePath = await packWapkDirectory(dir, {
                outputPath: path.join(dir, 'mts-app.wapk'),
            });
            const archive = readWapkArchive(archivePath);

            expect(archive.header.name).toBe('mts-app');
            expect(archive.header.version).toBe('3.0.0');
            expect(archive.header.runtime).toBe('deno');
            expect(archive.header.entry).toBe('src/main.ts');
            expect(archive.files.some((file) => file.path.startsWith('.elit-config-'))).toBe(false);
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('ignores legacy wapk.config.json when resolving package metadata', async () => {
        const dir = createTempDir();

        try {
            fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
            fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
                name: 'package-json-app',
                version: '1.0.0',
                main: 'src/index.js',
            }, null, 2));
            fs.writeFileSync(path.join(dir, 'wapk.config.json'), JSON.stringify({
                name: 'legacy-config-app',
                version: '9.9.9',
                runtime: 'bun',
                entry: 'legacy.js',
            }, null, 2));
            fs.writeFileSync(path.join(dir, 'src', 'index.js'), 'console.log("package-json");\n');

            const archivePath = await packWapkDirectory(dir, {
                outputPath: path.join(dir, 'package-json-app.wapk'),
            });
            const archive = readWapkArchive(archivePath);

            expect(archive.header.name).toBe('package-json-app');
            expect(archive.header.version).toBe('1.0.0');
            expect(archive.header.runtime).toBe('node');
            expect(archive.header.entry).toBe('src/index.js');
            expect(archive.files.some((file) => file.path === 'wapk.config.json')).toBe(false);
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('locks archives with password and requires the matching password to read them', async () => {
        const dir = createTempWapkProject();

        try {
            const archivePath = await packWapkDirectory(dir, {
                outputPath: path.join(dir, 'locked.wapk'),
                password: 'secret-123',
            });

            expect(() => readWapkArchive(archivePath)).toThrow('password-protected');
            expect(() => readWapkArchive(archivePath, { password: 'wrong-password' })).toThrow('Invalid WAPK credentials.');

            const archive = readWapkArchive(archivePath, { password: 'secret-123' });
            expect(archive.version).toBe(2);
            expect(archive.lock).toMatchObject({ password: true });
            expect(archive.files.some((file) => file.path === 'src/index.js')).toBe(true);

            const extractedDir = extractWapkArchive(
                archivePath,
                path.join(dir, 'out'),
                { password: 'secret-123' },
            );
            expect(fs.readFileSync(path.join(extractedDir, 'src', 'index.js'), 'utf8')).toBe('console.log("hello");\n');
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('reads lock settings from elit.config.json via passwordEnv', async () => {
        const dir = createTempDir();
        const previousPassword = process.env.TEST_WAPK_PASSWORD;

        try {
            process.env.TEST_WAPK_PASSWORD = 'env-secret';
            fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
            fs.writeFileSync(path.join(dir, 'elit.config.json'), JSON.stringify({
                wapk: {
                    name: 'config-lock-app',
                    version: '1.0.0',
                    runtime: 'node',
                    entry: 'src/main.js',
                    lock: {
                        passwordEnv: 'TEST_WAPK_PASSWORD',
                    },
                },
            }, null, 2));
            fs.writeFileSync(path.join(dir, 'src', 'main.js'), 'console.log("locked-from-config");\n');

            const archivePath = await packWapkDirectory(dir, {
                outputPath: path.join(dir, 'config-locked.wapk'),
            });
            const archive = readWapkArchive(archivePath, {
                passwordEnv: 'TEST_WAPK_PASSWORD',
            });

            expect(archive.version).toBe(2);
            expect(archive.header.name).toBe('config-lock-app');
            expect(archive.lock).toMatchObject({ password: true });
        } finally {
            if (previousPassword === undefined) {
                delete process.env.TEST_WAPK_PASSWORD;
            } else {
                process.env.TEST_WAPK_PASSWORD = previousPassword;
            }
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    test('configurable sync interval', async () => {
        const dir = createTempWapkProject();
        try {
            await packWapkDirectory(dir, { outputPath: path.join(dir, 'test.wapk') });
            
            // Prepare with custom sync interval
            const prepared = prepareWapkApp(path.join(dir, 'test.wapk'), { syncInterval: 100 });
            expect(prepared.syncInterval).toBe(100);
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    test('event-driven watcher mode', async () => {
        const dir = createTempWapkProject();
        try {
            const archivePath = await packWapkDirectory(dir, {
                outputPath: path.join(dir, 'test.wapk'),
                password: 'watcher-password',
            });
            
            // Prepare with watcher enabled
            const prepared = prepareWapkApp(archivePath, {
                useWatcher: true,
                password: 'watcher-password',
            });
            expect(prepared.useWatcher).toBe(true);
            expect(prepared.lock).toMatchObject({ password: 'watcher-password' });

            // Create live sync controller
            const liveSync = createWapkLiveSync(prepared);
            
            // Write a test file
            fs.writeFileSync(path.join(prepared.workDir, 'test-file.txt'), 'hello');

            // Force an archive flush so the encrypted archive is updated deterministically.
            liveSync.flush();
            liveSync.stop();

            // Verify archive was updated
            const finalArchive = readWapkArchive(archivePath, {
                password: 'watcher-password',
            });
            expect(finalArchive.files.some((file) => file.path === 'test-file.txt')).toBe(true);
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });
});