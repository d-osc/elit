# WAPK Guide

WAPK is an application archive format for packaging and running Elit apps as a single file.

## Supported Commands

```bash
# Package current directory
npx elit wapk pack .

# Package as a locked archive
npx elit wapk pack . --password-env WAPK_PASSWORD

# Package with dependencies included
npx elit wapk pack . --include-deps

# Inspect archive metadata and files
npx elit wapk inspect ./app.wapk

# Inspect a locked archive
npx elit wapk inspect ./app.wapk --password-env WAPK_PASSWORD

# Extract archive contents
npx elit wapk extract ./app.wapk

# Extract a locked archive
npx elit wapk extract ./app.wapk --password-env WAPK_PASSWORD

# Run archive (default behavior)
npx elit wapk ./app.wapk

# Explicit run command
npx elit wapk run ./app.wapk

# Run a locked archive
npx elit wapk run ./app.wapk --password-env WAPK_PASSWORD

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
4. Syncs changed files back into the same `.wapk` archive.
5. Cleans up temporary files when the process exits.

This replaces the old cache-directory workflow.

## Sync Options

```bash
# Polling mode with custom interval (ms)
npx elit wapk run ./app.wapk --sync-interval 100

# Event-driven watcher mode
npx elit wapk run ./app.wapk --watcher
```

## Locked Archives

WAPK can encrypt the archive payload and require a password to open it.

Recommended flow:

```bash
# Set the password once in your shell
export WAPK_PASSWORD="super-secret"

# Create a locked archive
npx elit wapk pack . --password-env WAPK_PASSWORD

# Open the archive later
npx elit wapk inspect ./app.wapk --password-env WAPK_PASSWORD
npx elit wapk extract ./app.wapk --password-env WAPK_PASSWORD
npx elit wapk run ./app.wapk --password-env WAPK_PASSWORD
```

Notes:

- `--password` works, but `--password-env` is safer because it avoids shell history and process-list exposure.
- `inspect` without credentials still shows whether the archive is locked.
- Locked archives stay encrypted when live sync writes changes back into the same `.wapk` file.
- WAPK stays unlocked by default unless you provide `lock.password` or `lock.passwordEnv`.

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
      passwordEnv: 'WAPK_PASSWORD',
    },
  },
};
```

If `wapk` is omitted, Elit falls back to package metadata inference from `package.json`.
