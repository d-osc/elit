# Mobile And WAPK Debugging Flow

Use this worksheet when debugging mobile tooling, WAPK packaging, archive execution, desktop WAPK launch, or online hosting behavior.

## Fill In First

- Command or flow: mobile doctor / mobile sync / mobile build / wapk pack / wapk run / desktop wapk / online hosting
- Runtime: node / bun / deno
- Archive locked: yes / no
- Archive type: browser-style / script-style / unknown
- Repro command:

## Triage

1. Decide whether the issue is mobile environment detection, packaging, runtime launch, live sync, lock/password flow, or desktop WAPK wrapping.
2. Confirm the owner surface: `src/mobile.ts`, `src/wapk.ts`, the underlying CLI implementation, or `src/cli/desktop/wapk.ts`.
3. Check whether the issue is config inference, runtime resolution, dependency snapshotting, or temporary wrapper cleanup.

## Change Checklist

- Keep facade files stable while tracing into the implementation beneath them.
- Preserve fallback Android SDK and Gradle detection; do not rely only on environment variables.
- Preserve `node_modules` inclusion by default and `.wapkignore`-based exclusions.
- Preserve password-only lock flow and re-encryption during live sync writeback.
- Preserve `tsx` resolution for Node plus TypeScript packaged entries.
- Preserve browser-style start-script behavior when config intentionally launches a script instead of the raw entry.
- Preserve Windows local-bin resolution and desktop temporary-wrapper cleanup.

## Validation

- `npm run typecheck`
- `npm run build`
- `node ./dist/cli.cjs mobile --help`
- `node ./dist/cli.cjs mobile doctor --json`
- `node ./dist/cli.cjs wapk --help`
- `node ./dist/cli.cjs desktop wapk --help`

## Close-Out Notes

- Config path verified:
- Runtime path verified:
- Lock or online flow verified:
- Cleanup path verified: