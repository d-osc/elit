# elit/ws

Cross-runtime WebSocket client and server primitives for Node.js, Bun, and Deno.

## Features

- WebSocket client and server APIs in one module
- Node, Bun, and Deno runtime support
- EventEmitter-based server and client classes
- Exact path matching for upgrade requests
- Compatible enough for app code that would normally reach for `ws`

## Installation

```bash
npm install elit
```

## Basic Client

```typescript
import { WebSocket } from 'elit/ws';

const ws = new WebSocket('ws://localhost:3000/chat');

ws.on('open', () => {
  ws.send('hello');
});

ws.on('message', (data) => {
  console.log(data.toString());
});

ws.on('close', (code, reason) => {
  console.log('closed', code, reason);
});
```

## Basic Server

```typescript
import { createServer } from 'elit/http';
import { WebSocketServer } from 'elit/ws';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});

const wss = new WebSocketServer({
  server,
  path: '/chat',
});

wss.on('connection', (client, request) => {
  client.send(`connected to ${request.url}`);

  client.on('message', (message) => {
    client.send(message.toString());
  });
});

server.listen(8080, () => {
  console.log('ws://localhost:8080/chat');
});
```

You can also create a standalone WebSocket server:

```typescript
import { createWebSocketServer } from 'elit/ws';

const wss = createWebSocketServer({ port: 8080, path: '/chat' });
```

## Path Matching Rules

`WebSocketServer` matches on the request pathname.

- `path: '/chat'` matches `/chat` and `/chat?room=general`
- `path: '/'` matches only `/` and `/?query=value`
- omit `path` entirely to accept upgrades on any pathname

This matters when you combine multiple WebSocket servers on the same HTTP server.

When you use config-driven endpoints through `elit/server`, remember that `/__elit_ws` is reserved for Elit's internal HMR and shared-state traffic.

## API Summary

### WebSocket

Client and accepted-connection class.

- `new WebSocket(url, protocols?)`
- `send(data, options?, callback?)`
- `close(code?, reason?)`
- `terminate()`
- `ping()` and `pong()` are exposed for compatibility
- `readyState`, `url`, `protocol`, `extensions`, `bufferedAmount`

### WebSocketServer

Server-side upgrade handler.

- `new WebSocketServer(options?, callback?)`
- `handleUpgrade(request, socket, head, callback)`
- `shouldHandle(request)`
- `close(callback?)`
- `address()`
- `clients`

### Helpers

- `createWebSocketServer(options?, callback?)`
- `getRuntime()`
- `ReadyState`
- `CLOSE_CODES`

## Server Options

`ServerOptions` supports:

- `host`
- `port`
- `backlog`
- `server` for attaching to an existing HTTP server
- `verifyClient`
- `handleProtocols`
- `path`
- `noServer`
- `clientTracking`
- `perMessageDeflate`
- `maxPayload`

## Runtime Notes

- On Node.js, WebSocket client support expects a global `WebSocket`, which is available on modern Node releases.
- On Bun and Deno, native runtime WebSocket implementations are used.
- If you want routing, middleware, SSR, shared state, or config-driven endpoints, prefer [server.md](./server.md).

## Related Docs

- [wss.md](./wss.md)
- [http.md](./http.md)
- [https.md](./https.md)
- [server.md](./server.md)
