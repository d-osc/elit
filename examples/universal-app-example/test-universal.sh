#!/usr/bin/env bash
set -euo pipefail

echo "[universal-test] web build"
bun ../../src/cli.ts build

if [[ ! -f dist/index.html ]]; then
  echo "[universal-test] FAILED: missing built index at dist/index.html"
  exit 1
fi
if [[ ! -f dist/main.js ]]; then
  echo "[universal-test] FAILED: missing built script at dist/main.js"
  exit 1
fi
if [[ ! -f dist/favicon.svg ]]; then
  echo "[universal-test] FAILED: missing copied favicon at dist/favicon.svg"
  exit 1
fi

echo "[universal-test] desktop smoke"
bun ../../src/cli.ts desktop ./src/desktop-smoke.ts

echo "[universal-test] mobile init"
bun ../../src/cli.ts mobile init . --app-id com.elit.universalexample --app-name ElitUniversalExample --web-dir dist

echo "[universal-test] mobile sync"
bun ../../src/cli.ts mobile sync --cwd . --web-dir dist

echo "[universal-test] mobile doctor --json (informational)"
bun ../../src/cli.ts mobile doctor --cwd . --json || true

GENERATED_SCREEN_PATH="android/app/src/main/java/com/elit/universalexample/ElitGeneratedScreen.kt"
if [[ ! -f "$GENERATED_SCREEN_PATH" ]]; then
  echo "[universal-test] FAILED: generated mobile screen missing at $GENERATED_SCREEN_PATH"
  exit 1
fi
if ! grep -Fq 'OutlinedTextField(' "$GENERATED_SCREEN_PATH"; then
  echo "[universal-test] FAILED: generated mobile Compose output is missing OutlinedTextField("
  exit 1
fi
if ! grep -Fq 'Checkbox(' "$GENERATED_SCREEN_PATH"; then
  echo "[universal-test] FAILED: generated mobile Compose output is missing Checkbox("
  exit 1
fi
if ! grep -Fq 'ElitImagePlaceholder(' "$GENERATED_SCREEN_PATH"; then
  echo "[universal-test] FAILED: generated mobile Compose output is missing ElitImagePlaceholder("
  exit 1
fi
if ! grep -Fq 'openUri("https://github.com/d-osc/elit")' "$GENERATED_SCREEN_PATH"; then
  echo "[universal-test] FAILED: generated mobile Compose output is missing openUri(...)"
  exit 1
fi

echo "[universal-test] mobile build android"
bun ../../src/cli.ts mobile build android --cwd .

echo "[universal-test] PASS: web, desktop, and mobile smoke flow completed"
