# Elit CLI

Reference for the current `elit` command-line interface.

## Main Commands

```bash
elit dev
elit build --entry ./src/main.ts --out-dir dist
elit --version
elit preview
elit test
elit desktop ./src/main.ts
elit desktop run --mode native
elit desktop build ./src/main.ts --release
elit mobile init
elit mobile run android
elit native generate android ./src/native-screen.ts --name HomeScreen
elit pm start --script "npm start" --name my-app
elit wapk pack .
elit wapk run ./app.wapk
```

## Global Flags

- `--version`, `-v`: show the installed Elit CLI version

## Core Commands

### `elit dev`

Starts the development server.

Common flags:

- `--port`, `-p`
- `--host`, `-h`
- `--root`, `-r`
- `--no-open`
- `--silent`

`dev` can load:

- single-root apps
- `clients[]` multi-app setups
- `api`, `proxy`, `worker`, `ws`, and `ssr`

### `elit build`

Builds one entry or a config-driven build matrix.

Common flags:

- `--entry`, `-e`
- `--out-dir`, `-o`
- `--format`, `-f`
- `--no-minify`
- `--sourcemap`
- `--silent`

### `elit preview`

Runs the built output through the same server model as `dev`.

Common flags:

- `--port`, `-p`
- `--host`, `-h`
- `--root`, `-r`
- `--base-path`, `-b`
- `--no-open`
- `--silent`

Unlike many preview servers, Elit preview supports:

- `clients[]`
- `api`
- `ws`
- `proxy`
- `worker`
- `ssr`

### `elit test`

Runs the built-in test runner.

Common flags:

- `--run`, `-r`
- `--watch`, `-w`
- `--file`, `-f`
- `--describe`, `-d`
- `--it`, `-t`
- `--coverage`, `-c`
- `--coverage-reporter`, `-cr`

### `elit desktop`

Desktop runtime and build workflow.

Forms:

- `elit desktop [entry]`
- `elit desktop run [entry]`
- `elit desktop build [entry]`
- `elit desktop wapk <file.wapk>`

Important options and behavior:

- `--mode native` uses `desktop.native.entry` unless an explicit entry is passed
- `--runtime quickjs|node|bun|deno`
- `--compiler auto|none|esbuild|tsx|tsup`
- `--release`
- omitted entry resolution follows `desktop.mode`, `desktop.entry`, and `desktop.native.entry`

### `elit mobile`

Native mobile project management.

Forms:

- `elit mobile init [dir]`
- `elit mobile doctor [--json]`
- `elit mobile sync`
- `elit mobile open android|ios`
- `elit mobile run android|ios`
- `elit mobile build android|ios`

Mobile config defaults come from `config.mobile`.

### `elit native generate`

Generates native outputs from an Elit entry.

Forms:

- `elit native generate android <entry>`
- `elit native generate ios <entry>`
- `elit native generate ir <entry>`

Useful options:

- `--out <file>`
- `--name <name>`
- `--package <name>` for Android
- `--export <name>` to read a specific module export

### `elit pm`

Detached process manager for shell commands, file targets, and WAPK apps.

Forms:

- `elit pm start --script "npm start" --name my-app`
- `elit pm start ./src/app.ts --name my-app`
- `elit pm start --file ./src/app.js --name my-app`
- `elit pm start --wapk ./app.wapk --name my-app`
- `elit pm start --wapk ./app.wapk --name my-app --online`
- `elit pm start --wapk gdrive://<fileId> --name my-app`
- `elit pm start --google-drive-file-id <fileId> --name my-app`
- `elit pm start`
- `elit pm start my-app`
- `elit pm list`
- `elit pm stop <name|all>`
- `elit pm restart <name|all>`
- `elit pm delete <name|all>`
- `elit pm save`
- `elit pm resurrect`
- `elit pm logs <name>`

Useful options:

- `--runtime node|bun|deno`
- `--cwd <dir>`
- `--env KEY=VALUE`
- `--password <value>` for locked WAPK apps
- `--online` for PM-managed Elit Run WAPK hosting
- `--online-url <url>` for a custom Elit Run origin
- `--google-drive-file-id <id>` for remote WAPK apps
- `--google-drive-token-env <env>` for remote WAPK apps
- `--google-drive-access-token <token>` for remote WAPK apps
- `--google-drive-shared-drive` for shared-drive WAPK files
- `--sync-interval <ms>` for WAPK run live sync
- `--watcher` for WAPK run event-driven sync
- `--archive-watch` and `--no-archive-watch` for WAPK archive pull sync
- `--archive-sync-interval <ms>` for WAPK archive polling
- `--restart-policy always|on-failure|never`
- `--min-uptime <ms>`
- `--watch`
- `--watch-path <path>`
- `--watch-ignore <pattern>`
- `--watch-debounce <ms>`
- `--health-url <url>`
- `--health-grace-period <ms>`
- `--health-interval <ms>`
- `--health-timeout <ms>`
- `--health-max-failures <count>`
- `--no-autorestart`
- `--restart-delay <ms>`
- `--max-restarts <count>`

Notes:

- `pm start` without a target starts every app from `pm.apps[]` in `elit.config.*`.
- `pm start <name>` resolves one configured app by name.
- WAPK apps can use local `.wapk` files, `gdrive://<fileId>`, or `pm.apps[].wapkRun.googleDrive`.
- PM-managed WAPK online hosts can also forward `--online` and `--online-url <url>` into `elit wapk run`.
- PM `--watch` restarts the managed process; WAPK `--watcher` only changes the inner WAPK live-sync mode.
- `pm stop`, `pm restart`, and `pm delete` close PM-managed online WAPK share sessions before the process exits.
- Watch restarts are explicit supervisor restarts; health-check failures can also trigger managed restarts.
- `pm save` stores the current running app list in `pm.dumpFile` or `./.elit/pm/dump.json`, and `pm resurrect` replays that dump.
- State and logs are stored in `./.elit/pm` by default, or `pm.dataDir` when configured.
- TypeScript file targets with `runtime: 'node'` require `tsx`; `runtime: 'bun'` works without extra setup.

### `elit wapk`

Archive packaging and runtime commands.

Forms:

- `elit wapk <file.wapk>`
- `elit wapk gdrive://<fileId>`
- `elit wapk gdrive://<fileId> --online`
- `elit wapk run <file.wapk>`
- `elit wapk run --google-drive-file-id <fileId> --google-drive-token-env GOOGLE_DRIVE_ACCESS_TOKEN`
- `elit wapk run <file.wapk> --online`
- `elit wapk`
- `elit wapk run`
- `elit wapk pack [directory]`
- `elit wapk inspect <file.wapk>`
- `elit wapk extract <file.wapk>`

Useful options:

- `--runtime node|bun|deno`
- `--sync-interval <ms>`
- `--archive-sync-interval <ms>`
- `--watcher`
- `--archive-watch`
- `--no-archive-watch`
- `--online`
- `--online-url <url>`
- `--google-drive-file-id <id>`
- `--google-drive-token-env <env>`
- `--google-drive-access-token <token>`
- `--include-deps` on `pack` as a legacy compatibility flag

Notes:

- `elit wapk pack` includes `node_modules` by default; use `.wapkignore` if you want to exclude dependencies.
- `--online` creates a shared session on the Elit Run server directly, keeps the CLI alive, and closes the session when you press `Ctrl+C`.
- Google Drive archives can use the same online handoff with `elit wapk gdrive://<fileId> --online` or `elit wapk run --google-drive-file-id <fileId> ... --online`.
- By default it looks for Elit Run at `http://localhost:4177`, then `http://localhost:4179`.
- Use `--online-url <url>` or `ELIT_WAPK_ONLINE_URL` if your Elit Run instance is running elsewhere.
- Locked archives in `--online` mode must provide `--password` because the CLI builds the shared snapshot itself.

## Config-First Workflow

The CLI gets more useful when you store defaults in `elit.config.*`.

- `dev` and `preview` read `api`, `proxy`, `worker`, `ws`, `ssr`, and `clients[]`.
- `desktop` reads `desktop.mode`, `desktop.entry`, and `desktop.native.entry`.
- `mobile` reads `config.mobile` defaults for cwd, app id, icon, permissions, and native generation.
- `pm` reads `config.pm.dataDir`, `config.pm.dumpFile`, and `config.pm.apps[]` for process manager defaults.
- `wapk` reads `config.wapk` for runtime, entry, scripts, env, and archive locking.
- `wapk` also reads `config.wapk.run` for a default archive source plus live-sync behavior, including direct Google Drive API access without a local archive file.

## Practical Examples

```bash
elit dev --port 8080 --host 0.0.0.0 --no-open
elit build --entry ./src/main.ts --out-dir dist --format esm --sourcemap
elit preview --root dist --base-path /app
elit test --coverage --coverage-reporter text,html
elit desktop run --mode native
elit desktop build ./src/main.ts --release
elit mobile doctor --cwd . --json
elit mobile run android --cwd . --target emulator-5554
elit native generate ios ./src/native-screen.ts --out ./ios/HomeScreen.swift --name HomeScreen
elit pm start --script "npm start" --name my-app --runtime node
elit pm start --script "npm start" --name my-app --watch --watch-path src --restart-policy on-failure
elit pm start ./src/worker.ts --name worker --runtime bun
elit pm start --wapk ./app.wapk --name packaged-app
elit pm save
elit pm resurrect
elit pm logs my-app --lines 100
elit wapk pack .
elit wapk run ./app.wapk --runtime bun --sync-interval 100 --watcher
elit wapk run ./app.wapk --online
```

## Related Docs

- [CONFIG.md](./CONFIG.md)
- [server.md](./server.md)
- [wapk.md](./wapk.md)
- [API.md](./API.md)
