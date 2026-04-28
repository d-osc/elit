# elit/http

Cross-runtime HTTP server and client primitives with a Node-like API surface.

## When To Use It

- Use `elit/http` when you want a lightweight HTTP adapter that works across Node.js, Bun, and Deno.
- Use `elit/server` when you want routing, middleware, shared state, SSR helpers, or config-driven dev and preview behavior.

## Server Example

```typescript
import { createServer } from 'elit/http';

const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(3000, '0.0.0.0', () => {
  console.log('http://localhost:3000');
});
```

## Client Example

```typescript
import { get, request } from 'elit/http';

get('http://localhost:3000/health', {}, (res) => {
  console.log(res.statusCode, res.statusMessage);
});

const req = request('http://localhost:3000/api/echo', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
});

req.on('response', (res) => {
  console.log('response', res.statusCode);
});

req.on('error', (error) => {
  console.error(error);
});

req.write(JSON.stringify({ hello: 'world' }));
req.end();
```

## Main Exports

- `createServer(options?, requestListener?)`
- `request(url, options?, callback?)`
- `get(url, options?, callback?)`
- `Server`
- `IncomingMessage`
- `ServerResponse`
- `ClientRequest`
- `Agent`
- `METHODS`
- `STATUS_CODES`
- `getRuntime()`

## Server API

`createServer()` returns a `Server` instance with the familiar `listen()`, `close()`, and `address()` flow.

On Node.js, `listen({ fd })` is also supported for inherited listener handoff. When `ELIT_PM_LISTEN_FD` plus `ELIT_PM_PUBLIC_PORT` are present, `listen(port)` or `listen({ port })` that targets that public port will reuse the inherited listener automatically instead of binding a new socket.

The request listener receives:

- `IncomingMessage`
- `ServerResponse`

That makes it a good base for `elit/ws` attachment, raw adapters, or runtime experiments.

## Runtime Notes

- Node.js uses the native `http` and `https` clients underneath.
- Bun and Deno use their native server and fetch primitives behind the same API surface.
- The response/request surface is intentionally small and focused on the pieces Elit itself uses.

## Related Docs

- [https.md](./https.md)
- [ws.md](./ws.md)
- [server.md](./server.md)
