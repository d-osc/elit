# Elit Agent Guide

## Project Shape

Elit is a cross-runtime TypeScript toolkit. The same repository serves browser UI, server APIs, native generation, desktop runtimes, build tooling, and a CLI.

Always classify the task by runtime before editing code.

## Runtime Boundaries

- Browser and client UI live behind `elit`, `elit/dom`, `elit/el`, `elit/state`, `elit/style`, `elit/router`, and `elit/hmr`. Source is mostly under `src/client/`.
- Server and backend features live behind `elit/server`, `elit/http`, `elit/https`, `elit/ws`, `elit/wss`, `elit/smtp-server`, and `elit/database`. Source is mostly under `src/server/`.
- Native generation lives behind `elit/native`. Shared native implementation is under `src/native/`.
- Desktop runtime glue lives behind `elit/desktop` and `elit/desktop-auto-render`. TypeScript glue is under `src/desktop/`; the native host is in `desktop/` Rust sources.
- CLI and build logic live behind `elit/cli` and `elit/build`, with implementation under `src/cli/`, `src/build/`, and `scripts/`.
- Do not use the old `elit-server` import. The current server entry is `elit/server`.

## Editing Rules

- Top-level files such as `src/dom.ts`, `src/server.ts`, `src/native.ts`, and `src/render-context.ts` are public facades. Trace through them to the owning module before changing behavior.
- Keep subpath imports aligned with the runtime boundary. Do not pull desktop APIs into browser code or DOM-only helpers into server or native modules.
- Preserve the shared VNode and reactive state model when changing cross-runtime behavior.
- Follow existing style: TypeScript, 2-space indentation, single quotes, semicolons, and explicit public types.
- Prefer README and `package.json` exports over older docs that mention a standalone `server/` package.
- If a public API, CLI flag, or config behavior changes, update the nearest docs and examples in the same pass.

## Quick Map

- `src/client/`: DOM rendering, element factories, state, styles, router, HMR.
- `src/server/`: routers, middleware, HTTP and WebSocket adapters, database, SMTP server.
- `src/native/`: shared native tree, Compose, SwiftUI, and native layout/style translation.
- `src/desktop/`: desktop runtime bridge and auto-render integration.
- `src/cli/`: `elit` command implementation for build, desktop, mobile, native, pm, and wapk.
- `testing/unit/`: primary automated tests.
- `examples/`: working runtime-specific examples.
- `docs/`: user-facing docs and CLI/config references.

## Validation

- Run a focused test when behavior changes: `elit test --run --file ./testing/unit/<name>.test.ts`.
- Run `npm run test:run` when touching shared behavior that affects multiple surfaces.
- Run `npm run typecheck` for TypeScript changes.
- Run `npm run build` when export maps, build pipeline, CLI output, or generated bundles may change.
- Run `npm run docs:build` after substantial docs changes.
- For desktop or native boundary changes, inspect a nearby example and the matching runtime host before widening scope.

## High-Risk Details

- `createRouterView(router, options)` returns a function. Render it from `reactive(router.currentRoute, () => RouterView())`.
- Desktop APIs are injected by the desktop runtime and are not normal browser globals.
- Native rendering does not go through the DOM renderer. Use `elit/native` and keep output serializable.
- Only `VITE_` environment variables are injected into client bundles.

## Useful References

- `README.md` for the module map, AI quick context, and CLI flags.
- `docs/CONFIG.md` for config semantics.
- `docs/server.md`, `docs/ws.md`, and `docs/wss.md` for backend surfaces.
- `docs/native-css-support.md` and `docs/native-element-support.md` for native rendering limits.
- `examples/` and `testing/unit/` for the closest working patterns.

## Specialized Skills

- `elit-native-renderer` for `src/native/`, `src/native.ts`, and `desktop/native_renderer.rs` work.
- `elit-server-cli` for `src/server/`, `src/cli.ts`, build wiring, and exported server/CLI surfaces.
- `elit-mobile-wapk` for `src/mobile.ts`, `src/wapk.ts`, desktop WAPK flow, and mobile or packaging commands.