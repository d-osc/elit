---
name: elit-runtime-app
description: 'Work on app runtime configuration for Elit. Use when changing `elit.config.ts`, mobile mode, desktop mode, native entry wiring, build output, preview behavior, or WAPK settings in an Elit application.'
argument-hint: 'Describe the config, runtime, mobile, desktop, native, or WAPK behavior to change.'
user-invocable: true
---

# Elit Runtime App

Use this skill when working on app-level runtime wiring.

## Main Anchors

- `elit.config.ts`
- app entry files such as `src/main.ts`, `src/client.ts`, `src/server.ts`, and `src/mobile.ts`

## Working Rules

- Treat `elit.config.ts` as the source of truth for runtime behavior.
- Keep desktop-only logic in desktop paths.
- Keep native generation on `elit/native`.
- Keep WAPK behavior aligned with the app's build output and entry settings.

## Validation

- Run the app build.
- Run preview or dev validation if relevant.
- Run mobile, desktop, native, or WAPK checks only when that runtime is involved.