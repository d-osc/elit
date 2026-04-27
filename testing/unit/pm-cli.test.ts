/// <reference path="../../src/test-globals.d.ts" />

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildPmCommand, runPmCommand, parsePmStartArgs, resolvePmStartDefinitions } from '../../src/pm';

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

function createManagedPmRecord(workspaceRoot, overrides = {}) {
    return {
        id: 'api',
        name: 'api',
        type: 'script',
        source: 'config',
        cwd: workspaceRoot,
        runtime: 'node',
        env: {
            NODE_ENV: 'production',
            PORT: '3000',
        },
        script: 'npm run api',
        file: undefined,
        wapk: undefined,
        wapkRun: undefined,
        autorestart: true,
        restartDelay: 1000,
        maxRestarts: 5,
        password: undefined,
        restartPolicy: 'on-failure',
        minUptime: 5000,
        watch: true,
        watchPaths: [join(workspaceRoot, 'src')],
        watchIgnore: ['**/node_modules/**'],
        watchDebounce: 250,
        healthCheck: {
            url: 'http://127.0.0.1:3000/health',
            gracePeriod: 1000,
            interval: 5000,
            timeout: 1000,
            maxFailures: 2,
        },
        desiredState: 'running',
        status: 'online',
        commandPreview: 'node ./src/api.ts',
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
        startedAt: new Date(Date.now() - 65000).toISOString(),
        stoppedAt: undefined,
        runnerPid: undefined,
        childPid: process.pid,
        restartCount: 2,
        lastExitCode: 1,
        error: 'last crash',
        logFiles: {
            out: join(workspaceRoot, '.elit', 'pm', 'logs', 'api.out.log'),
            err: join(workspaceRoot, '.elit', 'pm', 'logs', 'api.err.log'),
        },
        ...overrides,
    };
}

function createPmWorkspace(recordOverrides = {}) {
    const workspaceRoot = mkdtempSync(join(tmpdir(), 'elit-pm-cli-'));
    const appsDir = join(workspaceRoot, '.elit', 'pm', 'apps');
    mkdirSync(appsDir, { recursive: true });
    const record = createManagedPmRecord(workspaceRoot, recordOverrides);
    writeFileSync(join(appsDir, `${record.id}.json`), JSON.stringify(record, null, 2));
    return { workspaceRoot, record };
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

        expect(parsed.wapkRun?.googleDrive?.fileId).toBe('drive-file-id');
        expect(parsed.wapkRun?.googleDrive?.accessTokenEnv).toBe('GOOGLE_DRIVE_ACCESS_TOKEN');
        expect(parsed.wapkRun?.googleDrive?.supportsAllDrives).toBe(true);
        expect(parsed.wapkRun?.online).toBe(true);
        expect(parsed.wapkRun?.onlineUrl).toBe('http://localhost:4179');
        expect(parsed.wapkRun?.syncInterval).toBe(150);
        expect(parsed.wapkRun?.archiveSyncInterval).toBe(200);
        expect(parsed.wapkRun?.useWatcher).toBe(true);
        expect(parsed.wapkRun?.watchArchive).toBe(true);
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
        expect(definitions[0]?.name).toBe('remote-app');
        expect(definitions[0]?.type).toBe('wapk');
        expect(definitions[0]?.wapk).toBe('gdrive://drive-file-id');
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
        expect(definitions[0]?.name).toBe('drive-app');
        expect(definitions[0]?.type).toBe('wapk');
        expect(definitions[0]?.wapk).toBe('gdrive://drive-file-id');
        expect(definitions[0]?.wapkRun?.googleDrive?.accessTokenEnv).toBe('GOOGLE_DRIVE_ACCESS_TOKEN');
        expect(definitions[0]?.wapkRun?.googleDrive?.supportsAllDrives).toBe(true);
        expect(definitions[0]?.wapkRun?.syncInterval).toBe(150);
        expect(definitions[0]?.wapkRun?.useWatcher).toBe(true);
        expect(definitions[0]?.wapkRun?.watchArchive).toBe(true);
    });

    it('builds PM commands that forward WAPK online, Google Drive, and live-sync flags', () => {
        const originalCliEntry = process.argv[1];
        process.argv[1] = join(process.cwd(), 'dist', 'cli.cjs');

        try {
            const command = buildPmCommand(createWapkPmRecord());
            const requiredArgs = [
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
            ];

            for (const requiredArg of requiredArgs) {
                expect(command.args.includes(requiredArg)).toBe(true);
            }
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
        } finally {
            process.argv[1] = originalCliEntry;
        }
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
        expect(definitions[0]?.name).toBe('online-app');
        expect(definitions[0]?.type).toBe('wapk');
        expect(definitions[0]?.wapk).toBe(join(workspaceRoot, 'dist', 'app.wapk'));
        expect(definitions[0]?.wapkRun?.online).toBe(true);
        expect(definitions[0]?.wapkRun?.onlineUrl).toBe('http://localhost:4179');
    });
});

describe('pm cli process inspection', () => {
    it('prints machine-readable JSON for pm list --json', async () => {
        const { workspaceRoot, record } = createPmWorkspace();
        const originalCwd = process.cwd();
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        process.chdir(workspaceRoot);

        try {
            await runPmCommand(['list']);
            await runPmCommand(['list', '--json']);

            expect(logSpy._calls.length).toBe(3);
            const headerOutput = String(logSpy._calls[0]?.[0] ?? '');
            const rowOutput = String(logSpy._calls[1]?.[0] ?? '');
            const output = String(logSpy._calls[2]?.[0] ?? '');
            const parsed = JSON.parse(output);

            expect(headerOutput).toContain('cpu');
            expect(headerOutput).toContain('memory');
            expect(headerOutput).toContain('uptime');
            expect(rowOutput).toContain(record.name);
            expect(parsed).toHaveLength(1);
            expect(parsed[0]?.name).toBe(record.name);
            expect(parsed[0]?.status).toBe(record.status);
            expect(parsed[0]?.commandPreview).toBe(record.commandPreview);
            expect(parsed[0]?.restartPolicy).toBe(record.restartPolicy);
            expect(parsed[0]?.liveMetrics?.uptimeMs).toBeGreaterThan(0);
        } finally {
            process.chdir(originalCwd);
            logSpy.restore();
            rmSync(workspaceRoot, { recursive: true, force: true });
        }
    });

    it('prints detailed process metadata for pm show', async () => {
        const { workspaceRoot, record } = createPmWorkspace();
        const originalCwd = process.cwd();
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        process.chdir(workspaceRoot);

        try {
            await runPmCommand(['show', record.name]);

            expect(logSpy._calls.length).toBe(1);
            const output = String(logSpy._calls[0]?.[0] ?? '');

            expect(output).toContain(`Process: ${record.name}`);
            expect(output).toContain('status:');
            expect(output).toContain(record.status);
            expect(output).toContain('cpu:');
            expect(output).toContain('memory:');
            expect(output).toContain('uptime:');
            expect(output).toContain('command:');
            expect(output).toContain(record.commandPreview);
            expect(output).toContain('watch paths:');
            expect(output).toContain(record.watchPaths[0]);
            expect(output).toContain('health check:');
            expect(output).toContain(record.healthCheck?.url ?? '');
            expect(output).toContain('metrics at:');
            expect(output).toContain('stdout log:');
            expect(output).toContain(record.logFiles.out);
            expect(output).toContain('env:');
            expect(output).toContain('NODE_ENV=production');
        } finally {
            process.chdir(originalCwd);
            logSpy.restore();
            rmSync(workspaceRoot, { recursive: true, force: true });
        }
    });

    it('supports describe as a JSON alias for process inspection', async () => {
        const { workspaceRoot, record } = createPmWorkspace();
        const originalCwd = process.cwd();
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        process.chdir(workspaceRoot);

        try {
            await runPmCommand(['describe', record.name, '--json']);

            expect(logSpy._calls.length).toBe(1);
            const output = String(logSpy._calls[0]?.[0] ?? '');
            const parsed = JSON.parse(output);

            expect(parsed?.name).toBe(record.name);
            expect(parsed?.lastExitCode).toBe(record.lastExitCode);
            expect(parsed?.error).toBe(record.error);
            expect(parsed?.liveMetrics?.uptimeMs).toBeGreaterThan(0);
        } finally {
            process.chdir(originalCwd);
            logSpy.restore();
            rmSync(workspaceRoot, { recursive: true, force: true });
        }
    });
});

