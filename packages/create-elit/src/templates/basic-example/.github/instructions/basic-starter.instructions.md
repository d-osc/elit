---
description: "Use when editing the basic Elit starter. Covers the single-page app structure, the reactive counter starter, and where to extend the app first."
name: "Basic Starter Guidance"
applyTo:
  - "src/main.ts"
  - "src/styles.ts"
  - "src/mobile.ts"
  - "elit.config.ts"
---

# Basic Starter Guidance

- This starter is intentionally small. Prefer extending `src/main.ts` and `src/styles.ts` before introducing extra layers.
- The counter and hero layout are placeholders. Replace them with the app's first real feature instead of preserving demo UI for its own sake.
- There is no server API in this starter by default. Do not invent `elit/server` code unless the task actually requires backend behavior.
- Keep runtime wiring in `elit.config.ts` simple until the app genuinely needs desktop, mobile, native, or WAPK changes.
- If the task adds a second page, router, or backend, treat that as a structural change and keep the original starter minimal elsewhere.