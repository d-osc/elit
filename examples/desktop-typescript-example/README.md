# Elit Desktop TypeScript Example

This example is a small project-style desktop app instead of a single file. It uses one TypeScript entry, Elit element factories for the UI markup, and the desktop runtime bridge for IPC-style window actions.

## What it shows

- `elit/el` and `elit/dom` to build the window markup from TypeScript
- `elit/desktop` to create the window and respond to runtime messages
- `elit.config.ts` as the project-level desktop command entry point

## Project layout

```text
desktop-typescript-example/
  elit.config.ts
  package.json
  public/
    favicon.svg
  src/
    main.ts
```

## Run it

```bash
npm install
npm run desktop:run
```

Build output:

```bash
npm run desktop:build
```

## Notes

- The UI markup is still authored with Elit's TypeScript element helpers instead of handwritten HTML.
- The desktop buttons post messages through `window.ipc`, then `src/main.ts` updates the window title or closes the app.
- You can smoke-test the app without leaving it open by setting `ELIT_DESKTOP_AUTO_CLOSE=1` before `npm run desktop:run`.