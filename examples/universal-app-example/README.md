# Elit Universal App Example

This example keeps web, desktop, and mobile flows in one project so you can test whether Elit works as a practical multi-surface repo instead of only isolated features.

## What it validates

- `bun run web:build` produces a browser build under `dist/`
- `bun run desktop:run` and `bun run desktop:build` now rely on `desktop.entry` in `elit.config.ts`, which points at `src/web-main.ts`; the desktop runtime auto-wraps that captured `render(...)` call into a native window
- `bun run desktop:smoke` wraps the same `src/web-main.ts` entry, then auto-closes after the desktop ready signal for automated verification
- `bun run mobile:build:android` scaffolds, syncs built web assets, generates Android Compose from the same `src/web-main.ts` entry, and builds the Android app
- `bun run mobile:run:android:auto` picks an emulator first, otherwise the first connected Android device, then installs and launches the app

## Project layout

- `src/web-main.ts` is the shared entry for web, desktop, and native mobile generation
- `elit.config.ts` points both `desktop.entry` and `mobile.native.entry` at `src/web-main.ts`
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
- The shared desktop entry is now validated again on the example's current QuickJS desktop runtime as well as the external runtimes.
- `desktop:run` and `desktop:build` intentionally omit a positional entry now; they fall back to `desktop.entry` from `elit.config.ts` and still allow an explicit CLI path to override it.
- The desktop smoke entry auto-closes only for automated validation. Use `bun run desktop:run` for a manual desktop window.
- Mobile validation in this repo is Android-focused on Windows. `mobile init` still creates iOS scaffold files because that is how the current CLI behaves.
- The universal smoke test treats `mobile doctor --json` as informational so machines without a full Android toolchain still get a clear report before build fails.
- `src/web-main.ts` uses runtime detection to branch its actions and copy, then still finishes with the same `render(...)` call, while desktop and native mobile flows read that render call instead of requiring separate main entries.
