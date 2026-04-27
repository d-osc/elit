# Server And CLI Command Cheatsheet

## Core Validation

- `npm run typecheck`
- `npm run build`

## CLI Validation Against Current Workspace Build

- `node ./dist/cli.cjs --help`
- `node ./dist/cli.cjs test --help`
- `node ./dist/cli.cjs desktop --help`

## Broader Regression Checks

- `npm run test:run`
- `elit test --run --file ./testing/unit/<name>.test.ts`

## Useful Reading Before Editing

- `docs/CLI.md`
- `docs/server.md`
- `docs/ws.md`
- `docs/wss.md`