# Native Architecture

## Scope

- Shared native generation lives in `src/native.ts` and `src/native/`.
- Desktop-native host rendering lives in `desktop/native_renderer.rs` and its sibling submodules.
- The same authored tree should stay compatible with IR, Compose, SwiftUI, and desktop-native output.

## Main Invariants

- Prefer shared TypeScript fixes when multiple native targets are wrong in the same way.
- Do not assume browser DOM behavior. Native selector and layout matching is a practical subset.
- Keep output serializable and compatible with the shared VNode and style-resolution pipeline.
- Treat example-specific parity mismatches as local unless the same defect reproduces across multiple targets.

## Desktop Native Renderer Notes

- `desktop/native_renderer.rs` is split by concern: action widgets, container rendering, content widgets, form controls, vector drawing, runtime support, and app runtime.
- Keep low-risk helpers in the matching submodule instead of re-expanding the main file.
- Changes in widget, layout, selector, or rendering helpers can affect screenshot parity even when public APIs stay unchanged.

## Suggested Triage

1. Confirm whether the bug is in shared native style or tree generation, desktop-native Rust rendering, or only an example stylesheet.
2. Check `docs/native-css-support.md` and `docs/native-element-support.md` before widening support.
3. Check `testing/unit/native.test.ts` for the nearest existing regression pattern.