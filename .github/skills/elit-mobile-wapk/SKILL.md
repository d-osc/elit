---
name: elit-mobile-wapk
description: 'Work on Elit mobile commands, Android or iOS project sync, mobile doctor checks, WAPK packaging and runtime, desktop WAPK mode, locked archives, or online WAPK hosting. Use when editing `src/mobile.ts`, `src/wapk.ts`, desktop WAPK flow, or mobile and packaging CLI behavior.'
argument-hint: 'Describe the mobile command, WAPK flow, or packaging behavior to change.'
user-invocable: true
---

# Elit Mobile And WAPK

Use this skill for mobile tooling and packaged-app workflows rather than the core browser or server runtime.

## Route The Task First

1. Mobile CLI flow: `src/mobile.ts` and implementation under `src/cli/mobile/`
2. WAPK packaging and runtime: `src/wapk.ts` and the WAPK CLI implementation it surfaces
3. Desktop packaged-app flow: `src/cli/desktop/wapk.ts`

## Working Rules

- Keep public facades such as `src/mobile.ts` and `src/wapk.ts` stable while tracing into the actual CLI implementation.
- Android SDK and Gradle detection must use fallback resolution, not environment variables alone.
- WAPK pack includes `node_modules` by default; exclusions belong in `.wapkignore`.
- Locked archives are password-only and live sync must preserve re-encryption on writeback.
- Node runtime support for packaged TypeScript relies on `tsx`; do not regress that path.
- Browser-style archives may intentionally start from configured start scripts rather than executing the raw entry directly.
- Preserve dependency snapshots and Windows local-bin resolution behavior during live sync and start-script execution.

## High-Risk Areas

- `mobile doctor` environment detection
- `wapk pack`, `run`, `inspect`, and `extract`
- Desktop WAPK temporary wrapper generation and cleanup
- Archive locking, password flow, and online hosting flags
- Runtime selection across node, bun, and deno

## Validation

- Run `npm run typecheck`.
- Run `npm run build` when changing CLI wiring, packaging, or runtime helpers.
- Validate built commands through `node ./dist/cli.cjs ...`, for example `node ./dist/cli.cjs wapk --help` or `node ./dist/cli.cjs mobile doctor --json`.
- Run a focused WAPK or mobile test when one exists, otherwise use `npm run test:run` for wider regression coverage.

## Useful Anchors

- `src/mobile.ts`
- `src/wapk.ts`
- `src/cli/desktop/wapk.ts`
- `docs/wapk.md` and `docs/CLI.md`
- `README.md` WAPK and mobile command sections

## References

- Architecture and invariants: [mobile and wapk architecture](./references/architecture.md)
- Validation and common commands: [mobile and wapk command cheatsheet](./references/commands.md)

## Assets

- Guided worksheet: [mobile and wapk debugging flow](./assets/mobile-wapk-debugging-flow.md)