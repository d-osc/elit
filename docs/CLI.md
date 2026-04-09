# Elit CLI

Reference for the current `elit` command-line interface.

## Main Commands

```bash
elit dev
elit build --entry ./src/main.ts --out-dir dist
elit preview
elit test
elit desktop ./src/main.ts
elit desktop run --mode native
elit desktop build ./src/main.ts --release
elit mobile init
elit mobile run android
elit native generate android ./src/native-screen.ts --name HomeScreen
elit wapk pack .
elit wapk run ./app.wapk
```

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

### `elit wapk`

Archive packaging and runtime commands.

Forms:

- `elit wapk <file.wapk>`
- `elit wapk run <file.wapk>`
- `elit wapk pack [directory]`
- `elit wapk inspect <file.wapk>`
- `elit wapk extract <file.wapk>`

Useful options:

- `--runtime node|bun|deno`
- `--sync-interval <ms>`
- `--watcher`
- `--include-deps` on `pack`

## Config-First Workflow

The CLI gets more useful when you store defaults in `elit.config.*`.

- `dev` and `preview` read `api`, `proxy`, `worker`, `ws`, `ssr`, and `clients[]`.
- `desktop` reads `desktop.mode`, `desktop.entry`, and `desktop.native.entry`.
- `mobile` reads `config.mobile` defaults for cwd, app id, icon, permissions, and native generation.
- `wapk` reads `config.wapk` for runtime, entry, scripts, env, and archive locking.

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
elit wapk pack . --include-deps
elit wapk run ./app.wapk --runtime bun --sync-interval 100 --watcher
```

## Related Docs

- [CONFIG.md](./CONFIG.md)
- [server.md](./server.md)
- [wapk.md](./wapk.md)
- [API.md](./API.md)
