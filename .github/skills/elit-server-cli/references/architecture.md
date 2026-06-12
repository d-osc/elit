# Server And CLI Architecture

## Scope

- Server behavior is owned by `src/server/` and surfaced through `src/server.ts`, `src/http.ts`, `src/https.ts`, `src/ws.ts`, and `src/wss.ts`.
- CLI behavior is surfaced through `src/cli.ts` and implemented under `src/cli/`.
- Build and export wiring spans `src/build/`, `scripts/`, `tsup*.config.ts`, and `package.json` exports.

## Main Invariants

- Keep `src/cli.ts` as the executable facade even when logic moves deeper into `src/cli/`.
- Keep public backend imports on `elit/server`; do not reintroduce `elit-server`.
- When public entrypoints move, keep exports, build output names, and docs aligned.
- Prefer behavior changes in the owning module rather than broad export-surface edits.

## Validation Notes

- Installed global `elit` binaries can hide workspace changes.
- After build changes, validate with `node ./dist/cli.cjs ...` so execution definitely hits the current workspace output.
- For API changes, update `README.md`, `docs/CLI.md`, or server docs in the same pass.

## Suggested Triage

1. Decide whether the task is server runtime behavior, CLI wiring, or build/export plumbing.
2. Trace from the facade into the owning module before editing.
3. Confirm whether the change needs docs, export-map updates, or a build validation pass.