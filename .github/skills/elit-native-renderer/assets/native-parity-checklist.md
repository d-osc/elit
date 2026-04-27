# Native Parity Checklist

Use this worksheet when native output differs across IR, Compose, SwiftUI, desktop-native, or the browser example you are using as a reference.

## Fill In First

- Symptom:
- Repro entry or example:
- Affected outputs: IR / Compose / SwiftUI / desktop-native / example-only
- Expected behavior:
- Actual behavior:

## Triage

1. Decide whether the mismatch is a shared native pipeline bug, a desktop-native Rust bug, or only an example stylesheet mismatch.
2. Confirm whether the same issue reproduces in more than one native target.
3. Identify the owner surface: `src/native.ts`, `src/native/`, `desktop/native_renderer.rs`, or the example itself.

## Change Checklist

- Preserve the shared serializable native tree contract.
- Keep native CSS support inside the documented practical subset unless the task explicitly expands support.
- Avoid DOM-only assumptions in selector, layout, media, form, or accessibility logic.
- Keep Rust desktop-native edits inside the matching extracted submodule when possible.
- Add or update a focused regression in `testing/unit/native.test.ts` when shared native behavior changes.
- Re-check whether docs need a support-note update in `docs/native-css-support.md` or `docs/native-element-support.md`.

## Validation

- `npm run typecheck`
- `elit test --run --file ./testing/unit/native.test.ts`
- `cargo check --lib` and `cargo test --lib` when `desktop/native_renderer.rs` or its submodules change

## Close-Out Notes

- Outputs verified:
- Tests added or updated:
- Docs updated: