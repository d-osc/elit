const wapkPassword = process.env.ELIT_WAPK_PASSWORD;
const googleDriveFileId = process.env.ELIT_WAPK_GOOGLE_DRIVE_FILE_ID;
const supportsAllDrives = process.env.ELIT_WAPK_GOOGLE_DRIVE_SHARED_DRIVE === 'true';

const googleDriveRunConfig = {
    googleDrive: {
        fileId: googleDriveFileId,
        accessTokenEnv: 'GOOGLE_DRIVE_ACCESS_TOKEN',
        supportsAllDrives,
    },
    runtime: 'bun',
    password: wapkPassword,
    useWatcher: true,
    watchArchive: true,
    syncInterval: 150,
    archiveSyncInterval: 150,
};

export default {
    pm: {
        apps: [
            {
                name: 'drive-app',
                env: {
                    GOOGLE_DRIVE_ACCESS_TOKEN: process.env.GOOGLE_DRIVE_ACCESS_TOKEN ?? '',
                },
                wapkRun: googleDriveRunConfig,
            },
        ],
    },
    wapk: {
        name: '@elit/wapk-google-drive-example',
        version: '1.0.0',
        runtime: 'bun',
        entry: 'src/index.ts',
        port: 3333,
        env: {
            APP_NAME: 'Elit Google Drive WAPK Example',
        },
        lock: wapkPassword
            ? {
                password: wapkPassword,
            }
            : undefined,
        run: googleDriveRunConfig,
    },
};