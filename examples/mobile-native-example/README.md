# Elit Mobile Native Example

This example is a real project for validating the native mobile workflow in elit.

## What it validates

- `elit mobile init` creates native scaffold files
- `elit mobile sync` copies web assets into Android/iOS asset folders
- `elit mobile doctor --json` reports environment status for CI
- `mobile.icon` applies launcher icon during sync/run/build on Android
- `mobile.permissions` applies Android permissions into AndroidManifest.xml

## Project layout

- `web/index.html` static web app copied into native assets
- `elit.config.json` mobile defaults (`appId`, `appName`, `webDir`, `icon`, `permissions`)
- `icon.png` launcher icon source used by mobile config
- `test-mobile.ps1` Windows smoke test
- `test-mobile.sh` Linux/macOS smoke test

## Run tests

### Windows

```powershell
./test-mobile.ps1
```

### Linux/macOS

```bash
chmod +x ./test-mobile.sh
./test-mobile.sh
```

## Manual commands

```bash
bun ../../src/cli.ts mobile init . --app-id com.elit.mobileexample --app-name ElitMobileExample --web-dir web
bun ../../src/cli.ts mobile sync --cwd . --web-dir web --icon ./icon.png --permission android.permission.ACCESS_NETWORK_STATE
bun ../../src/cli.ts mobile doctor --cwd . --json
```

## Notes

- `doctor` may fail on machines without Java/Android SDK/adb. This is expected.
- Scaffold + sync should still pass and produce native project files.
