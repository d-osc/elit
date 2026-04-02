# Elit Universal App Example

This example keeps web, desktop, and mobile flows in one project so you can test whether Elit works as a practical multi-surface repo instead of only isolated features.

## What it validates

- `bun run web:build` produces a browser build under `dist/`
- `bun run desktop:smoke` launches a native desktop window and closes it automatically after IPC succeeds
- `bun run desktop:build` can package the desktop entry into `desktop-dist/`
- `bun run mobile:build:android` scaffolds, syncs built web assets, generates Android Compose from the same repo, and builds the Android app
- `bun run mobile:run:android:auto` picks an emulator first, otherwise the first connected Android device, then installs and launches the app

## Project layout

- `src/web-main.ts` is the browser entry rendered into `public/index.html`
- `src/desktop.ts` is the manual desktop entry
- `src/desktop-smoke.ts` is the auto-close desktop smoke entry used by tests
- `src/native-screen.ts` is the mobile native UI source used for Compose generation
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

- The desktop smoke entry auto-closes only for automated validation. Use `bun run desktop:run` for a manual desktop window.
- Mobile validation in this repo is Android-focused on Windows. `mobile init` still creates iOS scaffold files because that is how the current CLI behaves.
- The universal smoke test treats `mobile doctor --json` as informational so machines without a full Android toolchain still get a clear report before build fails.
- Shared CTA metadata now flows through `elit/universal`, so the same component tree can describe desktop IPC actions and native mobile bridge actions without splitting the UI layout by platform.
