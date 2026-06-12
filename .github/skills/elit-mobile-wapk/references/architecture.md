# Mobile And WAPK Architecture

## Scope

- Mobile command facade is `src/mobile.ts`; follow it into `src/cli/mobile/`.
- WAPK public facade is `src/wapk.ts`; follow it into the WAPK CLI implementation it re-exports.
- Desktop packaged-app execution flows through `src/cli/desktop/wapk.ts`.

## Main Invariants

- Keep facade files stable while changing implementation beneath them.
- `mobile doctor` should detect SDK and Gradle through fallback discovery, not only environment variables.
- WAPK pack includes `node_modules` by default; `.wapkignore` is the exclusion mechanism.
- Locked archives are password-only and live sync must preserve re-encryption on writeback.
- Packaged TypeScript on Node relies on `tsx` resolution.
- Browser-style archives may intentionally launch configured start scripts instead of executing the raw browser entry.

## Desktop WAPK Notes

- Desktop WAPK mode builds a temporary wrapper script that launches the packaged app, waits for the local server, and opens a desktop window.
- Cleanup of temp files and prepared work directories is part of the runtime contract.

## Suggested Triage

1. Decide whether the change belongs to mobile tooling, WAPK archive prep/runtime, or desktop WAPK launch flow.
2. Check config inference, runtime selection, and dependency snapshot behavior before changing packaging logic.
3. Validate built CLI paths instead of relying on globally installed tools.