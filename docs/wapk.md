# WAPK Guide

WAPK is an application archive format for packaging and running Elit apps as a single file.

`node_modules` are included by default when packing. If you need to exclude dependencies for a smaller archive, add them to `.wapkignore`.

## Supported Commands

```bash
# Package current directory
npx elit wapk pack .

# Package as a locked archive
npx elit wapk pack . --password secret-123

# Package current directory with dependencies
npx elit wapk pack .

# Inspect archive metadata and files
npx elit wapk inspect ./app.wapk

# Inspect a locked archive
npx elit wapk inspect ./app.wapk --password secret-123

# Extract archive contents
npx elit wapk extract ./app.wapk

# Extract a locked archive
npx elit wapk extract ./app.wapk --password secret-123

# Run archive (default behavior)
npx elit wapk ./app.wapk

# Explicit run command
npx elit wapk run ./app.wapk

# Host the archive in Elit Run until Ctrl+C
npx elit wapk run ./app.wapk --online

# Run a locked archive
npx elit wapk run ./app.wapk --password secret-123

# Runtime override
npx elit wapk ./app.wapk --runtime node
npx elit wapk run ./app.wapk --runtime bun
npx elit wapk run ./app.wapk --runtime deno

# Desktop mode from archive
npx elit desktop wapk ./app.wapk
npx elit desktop wapk run ./app.wapk
npx elit desktop wapk run ./app.wapk --runtime bun
```

## Live Sync Behavior

When you run a WAPK archive, Elit now uses a live-sync workflow:

1. Reads `.wapk` into memory.
2. Extracts to a temporary working directory.
3. Runs your entry file from that working directory.
4. Syncs changed files back into the same archive source.
5. Pulls external archive updates back into the temp working directory.
6. Cleans up temporary files when the process exits.

This replaces the old cache-directory workflow.

This two-way sync can talk to Google Drive directly. When the remote `.wapk` changes in Drive, Elit reloads the archive contents into the temp workdir on the next sync pass, and local workdir changes are uploaded back to Drive without needing a local archive file.

## Sync Options

```bash
# Polling mode with custom interval (ms)
npx elit wapk run ./app.wapk --sync-interval 100

# Use a separate interval for archive-source reads
npx elit wapk run ./app.wapk --sync-interval 100 --archive-sync-interval 250

# Event-driven watcher mode
npx elit wapk run ./app.wapk --watcher

# Disable archive read-sync if the archive is strictly local
npx elit wapk run ./app.wapk --no-archive-watch

# Run a WAPK archive directly from Google Drive
npx elit wapk run --google-drive-file-id 1AbCdEfGhIjKlMnOp --google-drive-token-env GOOGLE_DRIVE_ACCESS_TOKEN

# Send a local or remote archive into Elit Run instead of the local runtime
npx elit wapk run ./app.wapk --online
npx elit wapk gdrive://1AbCdEfGhIjKlMnOp --google-drive-token-env GOOGLE_DRIVE_ACCESS_TOKEN --online
npx elit wapk run --google-drive-file-id 1AbCdEfGhIjKlMnOp --google-drive-token-env GOOGLE_DRIVE_ACCESS_TOKEN --online

# Point at a custom Elit Run URL
npx elit wapk run ./app.wapk --online --online-url http://localhost:4177
```

Note: runtime file sync does not force your app process to hot-reload already-imported modules. It keeps the extracted files and the archive aligned on disk; restart or app-level reload logic is still needed when the runtime should pick up already-loaded code.

Google Drive mode requires an OAuth access token that can read and update the target file. The recommended setup is to store that token in an environment variable and point `accessTokenEnv` or `--google-drive-token-env` at it.

The same WAPK run flags can also be forwarded through `elit pm start --wapk ...`, which means PM-managed WAPK apps can target Google Drive directly and can also host Elit Run online shares through PM.

A complete TypeScript config example is available in `examples/wapk-google-drive-example/elit.config.ts`.

## Online Elit Run Handoff

`--online` creates a shared session on the Elit Run server instead of starting the local Node/Bun/Deno runtime.

Flow:

1. Elit reads the `.wapk` archive from the local file or remote source.
2. Elit decodes the archive into a shared-session snapshot.
3. Elit sends that snapshot to the Elit Run server through its shared-session create API.
4. Elit Run stores the session in memory and returns a join key.
5. The CLI prints the returned share key and join URL, stays alive while the share is active, and closes it when you press `Ctrl+C`.

Notes:

- Elit Run must already be running, usually from the `elit-run` repo on `http://localhost:4177` or `http://localhost:4179`.
- Google Drive-backed archives can be hosted online with either `elit wapk gdrive://<fileId> --online` or `elit wapk run --google-drive-file-id <fileId> ... --online`.
- Use `--online-url <url>` or `ELIT_WAPK_ONLINE_URL` if your Elit Run instance uses a different origin.
- `--runtime`, `--sync-interval`, `--watcher`, `--archive-watch`, and `--archive-sync-interval` do not apply in `--online` mode because Elit Run receives a prebuilt shared snapshot instead of a live runtime process.
- If the archive is locked, provide `--password` so the CLI can decode it before creating the online share session.
- `--online` does not open a browser window. Guests join later by visiting Elit Run and entering the returned key while the CLI host remains active.
- Press `Ctrl+C` in the CLI to close the shared session. Connected guests receive the normal host-closed event.
- When the same archive is hosted through `elit pm start --wapk ... --online`, use `elit pm stop`, `elit pm restart`, or `elit pm delete` to close the shared session gracefully.

## Real Google Drive Integration Test

Use a disposable Google Drive file id for this test. The test uploads a seed archive, verifies remote pull and push sync, and then restores the original file contents in `finally`.

```bash
GOOGLE_DRIVE_ACCESS_TOKEN=ya29.example-token
ELIT_TEST_GOOGLE_DRIVE_FILE_ID=1AbCdEfGhIjKlMnOp
npm run test:wapk:google-drive
```

Optional env:

- `ELIT_TEST_GOOGLE_DRIVE_SHARED_DRIVE=true`

If you want a full app-level config for direct Drive usage, see `examples/wapk-google-drive-example/`.

## Locked Archives

WAPK can encrypt the archive payload and require a password to open it.

Recommended flow:

```bash
# Create a locked archive
npx elit wapk pack . --password super-secret

# Open the archive later
npx elit wapk inspect ./app.wapk --password super-secret
npx elit wapk extract ./app.wapk --password super-secret
npx elit wapk run ./app.wapk --password super-secret
```

Notes:

- `inspect` without credentials still shows whether the archive is locked.
- Locked archives stay encrypted when live sync writes changes back into the same `.wapk` file.
- WAPK stays unlocked by default unless you provide `lock.password` or `--password`.

## Config via elit.config.*

WAPK package metadata is read from `wapk` in `elit.config.*`.

Supported config filenames:

- `elit.config.ts`
- `elit.config.mts`
- `elit.config.js`
- `elit.config.mjs`
- `elit.config.cjs`
- `elit.config.json`

Example:

```ts
export default {
  wapk: {
    name: '@acme/my-app',
    version: '1.0.0',
    runtime: 'bun',
    entry: 'src/server.ts',
    lock: {
      password: 'secret-123',
    },
    run: {
      googleDrive: {
        fileId: '1AbCdEfGhIjKlMnOp',
        accessTokenEnv: 'GOOGLE_DRIVE_ACCESS_TOKEN',
        supportsAllDrives: true,
      },
      runtime: 'bun',
      syncInterval: 150,
      useWatcher: true,
      watchArchive: true,
      archiveSyncInterval: 150,
    },
  },
};
```

If `wapk` is omitted, Elit falls back to package metadata inference from `package.json`.

With `wapk.run.file` configured, you can start the archive directly:

```bash
npx elit wapk
npx elit wapk run
```

This is useful when the archive lives in Google Drive and should be read and written directly through the Drive API instead of a synced local file.
