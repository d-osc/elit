/// <reference path="../../src/test-globals.d.ts" />

import { join } from 'node:path';

import { buildPmCommand, parsePmStartArgs, resolvePmStartDefinitions } from '../../src/pm-cli';

function createWapkPmRecord(overrides = {}) {
    return {
        id: 'drive-app',
        name: 'drive-app',
        type: 'wapk',
        source: 'cli',
        cwd: process.cwd(),
        runtime: 'bun',
        env: {},
        script: undefined,
        file: undefined,
        wapk: 'gdrive://drive-file-id',
        wapkRun: {
            online: true,
            onlineUrl: 'http://localhost:4179',
            syncInterval: 150,
            useWatcher: true,
            watchArchive: true,
            archiveSyncInterval: 200,
            googleDrive: {
                accessTokenEnv: 'GOOGLE_DRIVE_ACCESS_TOKEN',
                accessToken: 'secret-token',
                supportsAllDrives: true,
            },
        },
        autorestart: true,
        restartDelay: 1000,
        maxRestarts: 10,
        password: 'secret-123',
        restartPolicy: 'always',
        minUptime: 0,
        watch: false,
        watchPaths: [],
        watchIgnore: [],
        watchDebounce: 250,
        healthCheck: undefined,
        desiredState: 'running',
        status: 'online',
        commandPreview: '',
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
        restartCount: 0,
        logFiles: {
            out: join(process.cwd(), '.elit', 'pm', 'logs', 'drive-app.out.log'),
            err: join(process.cwd(), '.elit', 'pm', 'logs', 'drive-app.err.log'),
        },
        ...overrides,
    };
}

describe('pm cli wapk support', () => {
    it('parses direct Google Drive WAPK flags plus online hosting options', () => {
        const parsed = parsePmStartArgs([
            '--google-drive-file-id', 'drive-file-id',
            '--google-drive-token-env', 'GOOGLE_DRIVE_ACCESS_TOKEN',
            '--google-drive-shared-drive',
            '--online-url', 'http://localhost:4179',
            '--sync-interval', '150',
            '--archive-sync-interval', '200',
            '--watcher',
            '--archive-watch',
        ]);

        expect(parsed.wapkRun).toMatchObject({
            googleDrive: {
                fileId: 'drive-file-id',
                accessTokenEnv: 'GOOGLE_DRIVE_ACCESS_TOKEN',
                supportsAllDrives: true,
            },
            online: true,
            onlineUrl: 'http://localhost:4179',
            syncInterval: 150,
            archiveSyncInterval: 200,
            useWatcher: true,
            watchArchive: true,
        });
    });

    it('treats Google Drive source flags as an explicit WAPK target even when a process name is provided', () => {
        const workspaceRoot = join(process.cwd(), 'pm-drive-workspace');
        const definitions = resolvePmStartDefinitions(
            parsePmStartArgs([
                '--google-drive-file-id', 'drive-file-id',
                '--name', 'remote-app',
            ]),
            {
                pm: {
                    apps: [
                        { name: 'remote-app', script: 'npm start' },
                    ],
                },
            },
            workspaceRoot,
        );

        expect(definitions).toHaveLength(1);
        expect(definitions[0]).toMatchObject({
            name: 'remote-app',
            type: 'wapk',
            wapk: 'gdrive://drive-file-id',
        });
    });

    it('resolves configured PM apps from wapkRun.googleDrive without a local archive path', () => {
        const workspaceRoot = join(process.cwd(), 'pm-drive-config');
        const definitions = resolvePmStartDefinitions(
            {
                name: 'drive-app',
                env: {},
                watchPaths: [],
                watchIgnore: [],
            },
            {
                pm: {
                    apps: [
                        {
                            name: 'drive-app',
                            wapkRun: {
                                googleDrive: {
                                    fileId: 'drive-file-id',
                                    accessTokenEnv: 'GOOGLE_DRIVE_ACCESS_TOKEN',
                                    supportsAllDrives: true,
                                },
                                syncInterval: 150,
                                useWatcher: true,
                                watchArchive: true,
                            },
                        },
                    ],
                },
            },
            workspaceRoot,
        );

        expect(definitions).toHaveLength(1);
        expect(definitions[0]).toMatchObject({
            name: 'drive-app',
            type: 'wapk',
            wapk: 'gdrive://drive-file-id',
            wapkRun: {
                googleDrive: {
                    accessTokenEnv: 'GOOGLE_DRIVE_ACCESS_TOKEN',
                    supportsAllDrives: true,
                },
                syncInterval: 150,
                useWatcher: true,
                watchArchive: true,
            },
        });
    });

    it('builds PM commands that forward WAPK online, Google Drive, and live-sync flags', () => {
        const command = buildPmCommand(createWapkPmRecord());

        expect(command.args).toEqual(expect.arrayContaining([
            'wapk',
            'run',
            'gdrive://drive-file-id',
            '--password',
            'secret-123',
            '--online',
            '--online-url',
            'http://localhost:4179',
            '--sync-interval',
            '150',
            '--watcher',
            '--archive-watch',
            '--archive-sync-interval',
            '200',
            '--google-drive-token-env',
            'GOOGLE_DRIVE_ACCESS_TOKEN',
            '--google-drive-access-token',
            'secret-token',
            '--google-drive-shared-drive',
        ]));
        expect(command.args).not.toContain('--runtime');
        expect(command.env).toEqual({ ELIT_PM_WAPK_ONLINE_STDIN_SHUTDOWN: '1' });
        expect(command.runtime).toBeUndefined();
        expect(command.preview).toContain('elit wapk run gdrive://drive-file-id');
        expect(command.preview).toContain('--online');
        expect(command.preview).toContain('--online-url http://localhost:4179');
        expect(command.preview).toContain('--sync-interval 150');
        expect(command.preview).toContain('--watcher');
        expect(command.preview).toContain('--archive-watch');
        expect(command.preview).toContain('--archive-sync-interval 200');
        expect(command.preview).toContain('--google-drive-token-env GOOGLE_DRIVE_ACCESS_TOKEN');
        expect(command.preview).toContain('--google-drive-access-token ******');
        expect(command.preview).toContain('--password ******');
    });

    it('keeps online WAPK config when resolving a configured PM app', () => {
        const workspaceRoot = join(process.cwd(), 'pm-online-config');
        const definitions = resolvePmStartDefinitions(
            {
                name: 'online-app',
                env: {},
                watchPaths: [],
                watchIgnore: [],
            },
            {
                pm: {
                    apps: [
                        {
                            name: 'online-app',
                            wapk: './dist/app.wapk',
                            wapkRun: {
                                online: true,
                                onlineUrl: 'http://localhost:4179',
                            },
                        },
                    ],
                },
            },
            workspaceRoot,
        );

        expect(definitions).toHaveLength(1);
        expect(definitions[0]).toMatchObject({
            name: 'online-app',
            type: 'wapk',
            wapk: join(workspaceRoot, 'dist', 'app.wapk'),
            wapkRun: {
                online: true,
                onlineUrl: 'http://localhost:4179',
            },
        });
    });
});