# elit/https

Cross-runtime HTTPS primitives for secure HTTP servers and requests.

## When To Use It

- Use `elit/https` when you need TLS directly and want the same API across Node.js, Bun, and Deno.
- Use `elit/wss` when you need secure WebSocket connections.
- Use `elit/server` when you want routing and app features on top of secure transport.

## Secure Server Example

```typescript
import { readFileSync } from 'node:fs';
import { createServer } from 'elit/https';

const server = createServer(
  {
    key: readFileSync('./certs/dev.key'),
    cert: readFileSync('./certs/dev.crt'),
  },
  (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ secure: true, path: req.url }));
  }
);

server.listen(8443, '0.0.0.0', () => {
  console.log('https://localhost:8443');
});
```

## Secure Request Example

```typescript
import { get } from 'elit/https';

get('https://example.com', {}, (res) => {
  console.log(res.statusCode, res.statusMessage);
});
```

## Main Exports

- `createServer(options, requestListener?)`
- `request(url, options?, callback?)`
- `get(url, options?, callback?)`

On Node.js, `listen({ fd })` is also supported for inherited listener handoff. When `ELIT_PM_LISTEN_FD` plus `ELIT_PM_PUBLIC_PORT` are present, `listen(port)` or `listen({ port })` that targets that public port will reuse the inherited listener automatically instead of binding a new socket.
- `Server`
- `ClientRequest`
- `Agent`
- `getRuntime()`

## TLS Options

`ServerOptions` supports common TLS fields such as:

- `key`
- `cert`
- `ca`
- `passphrase`
- `pfx`
- `requestCert`
- `rejectUnauthorized`
- `ALPNProtocols`
- `SNICallback`

There is also a `tls` object for Bun-specific TLS wiring when that matches your deployment layout better.

## Runtime Notes

- Node.js uses the native `https` module.
- Bun and Deno route secure requests through their native runtime server implementations.
- For secure WebSocket upgrades, see [wss.md](./wss.md).

## Related Docs

- [http.md](./http.md)
- [wss.md](./wss.md)
- [server.md](./server.md)
