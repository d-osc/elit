# Mobile And WAPK Command Cheatsheet

## Core Validation

- `npm run typecheck`
- `npm run build`

## Mobile CLI Checks

- `node ./dist/cli.cjs mobile --help`
- `node ./dist/cli.cjs mobile doctor --json`

## WAPK CLI Checks

- `node ./dist/cli.cjs wapk --help`
- `node ./dist/cli.cjs desktop wapk --help`

## Broader Regression Checks

- `npm run test:run`
- `elit test --run --file ./testing/unit/<name>.test.ts`

## Useful Reading Before Editing

- `docs/wapk.md`
- `docs/CLI.md`
- `README.md`