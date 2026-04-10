const wapkPassword = process.env.ELIT_WAPK_PASSWORD;

export default {
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
        run: {
            googleDrive: {
                fileId: process.env.ELIT_WAPK_GOOGLE_DRIVE_FILE_ID,
                accessTokenEnv: 'GOOGLE_DRIVE_ACCESS_TOKEN',
                supportsAllDrives: process.env.ELIT_WAPK_GOOGLE_DRIVE_SHARED_DRIVE === 'true',
            },
            runtime: 'bun',
            password: wapkPassword,
            useWatcher: true,
            watchArchive: true,
            syncInterval: 150,
            archiveSyncInterval: 150,
        },
    },
};