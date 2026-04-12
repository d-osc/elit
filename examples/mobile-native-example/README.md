# Elit Mobile Native Example

This example is a real project for validating the native mobile workflow in elit.

## What it validates

- `elit mobile init` creates native scaffold files
- `elit mobile sync` copies web assets into Android/iOS asset folders
- `elit mobile sync` also generates Android Compose / iOS SwiftUI when `mobile.native.entry` is configured
- `mobile.mode` can switch runtime behavior between `native` and `hybrid` without removing the native entry
- generated native output now maps checkbox inputs to native toggle controls and absolute links to native URL-open actions
- `elit mobile doctor --json` reports environment status for CI
- `mobile.icon` applies launcher icon during sync/run/build on Android
- `mobile.permissions` applies Android permissions into AndroidManifest.xml

## Project layout

- `web/index.html` static web app copied into native assets
- `elit.config.json` mobile defaults (`appId`, `appName`, `webDir`, `icon`, `permissions`, `android`, `ios`, `native`)
- `src/native-screen.ts` shared Elit syntax used for native mobile generation
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
npx elit mobile init . --app-id com.elit.mobileexample --app-name ElitMobileExample --web-dir web
npx elit mobile sync --cwd . --web-dir web --icon ./icon.png --permission android.permission.ACCESS_NETWORK_STATE
npx elit mobile doctor --cwd . --json
npx elit mobile devices ios --cwd . --json
npx elit mobile run ios --cwd . --target booted
```

When `mobile.native.entry` is present, sync writes generated files to:

- `android/app/src/main/java/com/elit/mobileexample/ElitGeneratedScreen.kt`
- `android/app/src/main/java/com/elit/mobileexample/ElitRuntimeConfig.kt`
- `ios/ElitMobileApp.xcodeproj`
- `ios/App/ElitGeneratedScreen.swift`
- `ios/App/ElitRuntimeConfig.swift`

## Notes

- `doctor` may fail on machines without Java/Android SDK/adb. This is expected.
- Scaffold + sync should still pass and produce web asset plus native UI files.
- On macOS, `mobile devices ios --json` lists simulators, `mobile build ios` uses `xcodebuild`, and `mobile run ios` picks the booted simulator first or the best available iPhone fallback when no `--target` is passed.
- If you do not want to repeat `--target`, set `mobile.android.target` or `mobile.ios.target` in `elit.config.json`.
- Use `mobile.mode: "hybrid"` or pass `--mode hybrid` when you want to keep the WebView shell active while still generating native files.
