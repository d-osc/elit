# Server And Export Change Checklist

Use this worksheet when changing server runtime behavior, CLI commands, package entrypoints, or export-map wiring.

## Fill In First

- Change type: server API / CLI command / export map / build wiring / docs
- Owning module:
- Public facade touched: `src/server.ts`, `src/cli.ts`, `package.json`, `tsup*.config.ts`, other
- User-visible behavior change:

## Triage

1. Confirm whether the task belongs in server runtime code, CLI implementation, or build/export plumbing.
2. Trace from the facade to the owning module before editing behavior.
3. Decide whether the change is public and therefore needs docs, export-map, or bundle-output updates.

## Change Checklist

- Keep `src/cli.ts` as the executable facade even if logic moves deeper into `src/cli/`.
- Keep public backend imports on `elit/server`; do not reintroduce `elit-server`.
- Align `package.json` exports, declarations, and tsup outputs when public entrypoints move.
- Update `README.md` or `docs/CLI.md` when CLI flags or visible behavior change.
- Add or update a focused test when the behavior is covered by `testing/unit/`.

## Validation

- `npm run typecheck`
- `npm run build`
- Validate through `node ./dist/cli.cjs ...` so the current workspace build is actually exercised
- Run `npm run test:run` or a focused `elit test --run --file ./testing/unit/<name>.test.ts`

## Close-Out Notes

- Public docs updated:
- Export map updated:
- Built CLI command verified: