# Webmail Example

This example shows a compact Elit webmail workspace with:

- a browser inbox UI built with `elit/el`, `elit/dom`, and `elit/state`
- an in-memory mail API powered by `elit/server`
- a local SMTP sink powered by `dev.smtp` and `preview.smtp`
- a ready-to-run `elit.config.ts`

## Run It

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3054`.

The example also starts a local SMTP listener on `127.0.0.1:2525`.

## What To Try

1. Open the compose panel and send a message from the UI. It appears in `Sent`.
2. Click `Simulate inbound` to drop a demo message into `Inbox`.
3. Point any local SMTP client at `127.0.0.1:2525` and send mail without auth or TLS.

## Project Structure

```text
webmail-example/
|-- public/
|   `-- index.html
|-- src/
|   |-- client.ts
|   |-- main.ts
|   |-- server.ts
|   |-- shared.ts
|   |-- smtp.ts
|   |-- store.ts
|   `-- styles.ts
|-- elit.config.ts
`-- package.json
```

## Notes

- Mail is stored in memory only; restarting the dev server resets the demo inbox.
- `dev` and `preview` use the same SMTP port in this example, so run one mode at a time.