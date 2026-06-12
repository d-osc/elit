---
name: elit-native-renderer
description: 'Work on Elit native rendering, native CSS resolution, Compose or SwiftUI generation, desktop-native renderer parity, or `src/native` and `desktop/native_renderer.rs` changes. Use when fixing native layout, styling, selector matching, media, vector, canvas, or parity bugs.'
argument-hint: 'Describe the native renderer output or parity issue to change.'
user-invocable: true
---

# Elit Native Renderer

Use this skill for changes that affect Elit's native rendering stack rather than browser DOM output.

## Route The Task First

1. Shared TypeScript native pipeline: `src/native.ts` and `src/native/`
2. Desktop-native Rust host: `desktop/native_renderer.rs` and its extracted submodules
3. Example-only parity or viewport mismatch: usually `examples/` or app-specific styles, not a core renderer bug

## Working Rules

- Preserve the shared serializable native tree and style-resolution pipeline across IR, Compose, SwiftUI, and desktop-native output.
- Prefer a shared TypeScript fix when the same behavior is wrong in multiple native targets.
- Prefer an example-local fix when the mismatch is viewport-specific or isolated to one example.
- `desktop/native_renderer.rs` is intentionally split by concern. Keep new logic in the matching submodule instead of collapsing code back into one file.
- Native CSS support is intentionally practical rather than browser-complete. Match the documented subset before widening behavior.
- Avoid DOM-only assumptions when editing native selector, layout, form, media, or accessibility behavior.

## High-Risk Areas

- Selector and style resolution in `src/native.ts`
- Layout translation for flex, grid, spacing, and alignment
- Native media, vector, canvas, and placeholder fallbacks
- Compose or SwiftUI parity regressions that might also affect desktop-native output
- `desktop/native_renderer.rs` submodules such as content widgets, container rendering, form controls, vector drawing, and runtime support

## Validation

- Run `npm run typecheck` for TypeScript changes.
- Run `elit test --run --file ./testing/unit/native.test.ts` for native behavior changes.
- If Rust native desktop code changes, run `cargo check --lib` and `cargo test --lib`.
- Check the closest docs before broadening support: `docs/native-css-support.md` and `docs/native-element-support.md`.

## Useful Anchors

- `src/native.ts`
- `src/native/`
- `desktop/native_renderer.rs`
- `testing/unit/native.test.ts`
- `examples/universal-app-example/`

## References

- Architecture and invariants: [native architecture](./references/architecture.md)
- Validation and common commands: [native command cheatsheet](./references/commands.md)

## Assets

- Guided worksheet: [native parity checklist](./assets/native-parity-checklist.md)