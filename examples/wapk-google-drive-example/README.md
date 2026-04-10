# WAPK Google Drive Example

This example shows both Google Drive WAPK workflows for PM and plain WAPK runtime with `elit.config.ts`.

Required environment variables:

- `GOOGLE_DRIVE_ACCESS_TOKEN`
- `ELIT_WAPK_GOOGLE_DRIVE_FILE_ID`

Optional environment variables:

- `ELIT_WAPK_GOOGLE_DRIVE_SHARED_DRIVE=true`
- `ELIT_WAPK_PASSWORD`

Typical flow:

```powershell
npx elit wapk pack .
npx elit wapk
```

With the provided `elit.config.ts`, `npx elit wapk` reads and writes the archive directly through the Google Drive API.

## 1. Direct PM Start

This matches the direct CLI workflow:

```powershell
npm run pm:start:direct
```

The helper script resolves the repo `dist/cli.js` and runs the equivalent of:

```powershell
elit pm start --wapk gdrive://<fileId> --google-drive-token-env GOOGLE_DRIVE_ACCESS_TOKEN --name drive-app-direct --runtime bun --watcher --archive-watch --sync-interval 150 --archive-sync-interval 150
```

Use these after startup:

```powershell
npm run pm:list
node ./scripts/pm-runner.mjs logs drive-app-direct
```

## 2. Config-Driven PM Start

This uses `pm.apps[].wapkRun.googleDrive` from `elit.config.ts`:

```powershell
npm run pm:start:config
```

That starts the configured `drive-app` entry from the `pm` block in `elit.config.ts`.

Use these after startup:

```powershell
npm run pm:list
npm run pm:logs
```

## Notes

- Build the repo once before using the PM helper scripts so `../../dist/cli.js` exists.
- `pm:start:direct` is useful when you want one explicit command without touching config.
- `pm:start:config` is useful when you want the archive source and sync policy checked into `elit.config.ts`.