#!/usr/bin/env bash
set -euo pipefail

echo "[mobile-test] init"
bun run mobile:init

echo "[mobile-test] sync"
bun run mobile:sync

echo "[mobile-test] doctor --json"
bun run mobile:doctor || true

ASSET_PATH="android/app/src/main/assets/public/index.html"
if [[ ! -f "$ASSET_PATH" ]]; then
  echo "[mobile-test] FAILED: synced web asset missing at $ASSET_PATH"
  exit 1
fi

MANIFEST_PATH="android/app/src/main/AndroidManifest.xml"
if [[ ! -f "$MANIFEST_PATH" ]]; then
  echo "[mobile-test] FAILED: AndroidManifest.xml missing at $MANIFEST_PATH"
  exit 1
fi

echo "[mobile-test] PASS: scaffold + sync completed"
