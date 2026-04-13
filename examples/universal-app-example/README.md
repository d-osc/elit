# Elit Universal App Example

This example keeps web, desktop, and mobile flows in one project so you can test whether Elit works as a practical multi-surface repo instead of only isolated features.

## What it validates

- `bun run web:build` produces a browser build under `dist/`
- `bun run desktop:run` and `bun run desktop:build` now exercise true desktop native mode from `elit.config.ts`; `desktop.mode` is set to `native` and `desktop.native.entry` points at `src/web-main.ts`
- `bun run desktop:smoke` wraps the same `src/web-main.ts` entry, then auto-closes from the native desktop runtime for automated verification
- `bun run desktop:smoke:assert` runs the native smoke entry, captures native desktop interaction JSONL output, and verifies the ready lifecycle event end-to-end
- `bun run mobile:build:android` scaffolds, syncs built web assets, generates Android Compose from the same `src/web-main.ts` entry, and builds the Android app
- `bun run mobile:run:android:auto` picks an emulator first, otherwise the first connected Android device, then installs and launches the app

## Project layout

- `src/web-main.ts` is the shared entry for web, desktop, and native mobile generation
- `elit.config.ts` points both `desktop.native.entry` and `mobile.native.entry` at `src/web-main.ts`
- `src/desktop-smoke.ts` is a tiny auto-close wrapper around `src/web-main.ts` used by tests
- `src/shared.ts` contains text and data reused across web, desktop, and mobile
- `src/universal-components.ts` keeps the shared component tree surface-agnostic while `elit/universal` attaches serializable action and route metadata
- `test-universal.ps1` and `test-universal.sh` run the end-to-end smoke flow

## Run the whole smoke test

### Windows

```powershell
bun run test:win
```

### Linux/macOS

```bash
bun run test:sh
```

## Run each surface separately

```bash
bun run web:build
bun run web:preview
bun run desktop:run
bun run desktop:smoke
bun run desktop:build
bun run mobile:init
bun run mobile:build:android
bun run mobile:run:android:auto
```

## Notes

- The old `src/desktop.ts`, `src/desktop-app.ts`, `src/desktop-html.ts`, and `src/native-screen.ts` files were removed because the shared `src/web-main.ts` entry now covers the main web, desktop, and mobile paths.
- The shared desktop entry now validates both the hybrid WebView flow and the true native desktop flow from the same source tree.
- `desktop:run` and `desktop:build` intentionally omit a positional entry now; they fall back to the mode-aware desktop config in `elit.config.ts` and still allow an explicit CLI path to override it.
- The desktop smoke entry auto-closes only for automated validation. Use `bun run desktop:run` for a manual desktop window.
- The smoke entry only enables `interactionOutput` when `ELIT_DESKTOP_SMOKE_INTERACTION_FILE` is set, so normal manual runs are still quiet.
- Mobile validation in this repo is Android-focused on Windows. `mobile init` still creates iOS scaffold files because that is how the current CLI behaves.
- The universal smoke test treats `mobile doctor --json` as informational so machines without a full Android toolchain still get a clear report before build fails.
- `src/web-main.ts` uses runtime detection to branch its actions and copy, then still finishes with the same `render(...)` call, while desktop and native mobile flows read that render call instead of requiring separate main entries.

## Locked-Down Windows workflow

If Windows Application Control blocks Cargo build scripts on your machine, this example can reuse a prebuilt desktop runtime binary instead of compiling Rust locally.

Build the runtime on another Windows machine that can run Cargo, using the same `v3.6.3` source:

```powershell
cargo build --manifest-path .\Cargo.toml --bin elit-desktop --no-default-features --features runtime-quickjs --release
cargo build --manifest-path .\Cargo.toml --bin elit-desktop-native --release
```

Copy the resulting binaries to a policy-approved path, then set the env vars before running the example:

```powershell
$env:ELIT_DESKTOP_BINARY_PATH = 'C:\approved\elit-desktop.exe'
$env:ELIT_DESKTOP_NATIVE_BINARY_PATH = 'C:\approved\elit-desktop-native.exe'
$env:ELIT_DESKTOP_CARGO_TARGET_DIR = 'C:\approved\elit-cargo-cache'
npm run desktop:run
npm run desktop:smoke
```

`elit.config.ts` already forwards those env vars into the example desktop config, so you do not need to hard-code machine-specific paths into the repo.
