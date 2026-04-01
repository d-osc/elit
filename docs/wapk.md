# WAPK Guide

WAPK is an application archive format for packaging and running Elit apps as a single file.

## Supported Commands

```bash
# Package current directory
npx elit wapk pack .

# Package with dependencies included
npx elit wapk pack . --include-deps

# Inspect archive metadata and files
npx elit wapk inspect ./app.wapk

# Extract archive contents
npx elit wapk extract ./app.wapk

# Run archive (default behavior)
npx elit wapk ./app.wapk

# Explicit run command
npx elit wapk run ./app.wapk

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
    include: ['public/**'],
    exclude: ['**/*.log'],
  },
};
```

If `wapk` is omitted, Elit falls back to package metadata inference from `package.json`.
