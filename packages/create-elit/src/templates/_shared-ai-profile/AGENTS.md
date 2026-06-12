# Elit App Guide

## Project Type

This repository uses Elit to build an application. It is not the Elit framework source code.

## Use Public Elit APIs

- Use only public package imports such as `elit`, `elit/dom`, `elit/el`, `elit/state`, `elit/style`, `elit/router`, `elit/server`, `elit/database`, `elit/native`, and `elit/desktop`.
- Do not import from Elit framework source paths such as `src/...` from the Elit repository.

## Route By Runtime

- Browser UI belongs on `elit`, `elit/dom`, `elit/el`, `elit/state`, `elit/style`, and `elit/router`.
- Server routes, middleware, and API logic belong on `elit/server`.
- Persistence belongs on `elit/database`.
- Desktop-only code belongs on `elit/desktop`.
- Native generation belongs on `elit/native`.

## App Rules

- Treat the app's `elit.config.ts` as the source of truth for dev, build, preview, mobile, desktop, and WAPK behavior.
- Keep browser code and server code in separate modules.
- Prefer the app's existing folder structure before introducing new modules.
- Use `elit/server`, not `elit-server`.

## Important Elit Details

- `createRouterView(router, options)` returns a function and should be rendered from `reactive(router.currentRoute, () => RouterView())`.
- `elit/desktop` APIs are runtime-injected and are not normal browser globals.
- Only `VITE_` variables are injected into client bundles.

## Generated Outputs

- Treat `dist`, `coverage`, generated mobile/native files, and other build artifacts as generated outputs.
- Do not fix behavior by editing generated files directly.
- Change the owner source first, then rebuild or regenerate.

## Validation

- Prefer the app's own `package.json` scripts first.
- Use the smallest useful validation for the changed surface: typecheck, focused tests, build, then broader checks.

## Skills

- `elit-client-app` for browser UI, state, styles, routing, and SSR string rendering.
- `elit-server-app` for APIs, middleware, and database-backed handlers.
- `elit-runtime-app` for `elit.config.ts`, desktop, mobile, native, and WAPK wiring.