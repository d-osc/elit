# elit/server

HTTP routing, middleware, dev and preview server orchestration, shared real-time state, and config-driven WebSocket endpoints.

## When To Use It

- Use `elit/server` when you want REST endpoints, middleware, SSR, shared state, or custom WebSocket upgrade handlers inside the same dev or preview server.
- Use `elit/http` or `elit/ws` directly only when you want the lower-level runtime adapters without Elit's routing or config layer.

## Quick Start

```typescript
import { ServerRouter, cors, logger } from 'elit/server';
import { defineConfig } from 'elit/config';

const api = new ServerRouter();

api.use(cors());
api.use(logger());

api.get('/api/health', (ctx) => {
  ctx.res.json({ ok: true, uptime: process.uptime() });
});

api.post('/api/echo', (ctx) => {
  ctx.res.json({ body: ctx.body });
});

export default defineConfig({
  dev: {
    port: 3000,
    root: '.',
    api,
  },
  preview: {
    root: 'dist',
    api,
  },
});
```

## ServerRouter

`ServerRouter` is the main REST API router.

- Supports `get`, `post`, `put`, `patch`, `delete`, `options`, `head`, and `all`.
- Accepts both Elit-style handlers `(ctx) => {}` and Express-style handlers `(req, res, next?) => {}`.
- Supports global middleware with `use(middleware)` and path-scoped middleware with `use('/prefix', middleware)`.
- Parses route params, query strings, and JSON or URL-encoded request bodies for matching methods.

```typescript
import { ServerRouter, rateLimit, security } from 'elit/server';

const api = new ServerRouter();

api.use(security());
api.use(rateLimit({ windowMs: 60_000, max: 120 }));

api.get('/api/posts/:id', (ctx) => {
  ctx.res.json({
    id: ctx.params.id,
    draft: ctx.query.draft === 'true',
  });
});
```

### Route Context

Each Elit-style route handler receives:

- `ctx.req`: the incoming request
- `ctx.res`: the response with `status()`, `json()`, and `send()` helpers
- `ctx.params`: route params extracted from `:param` segments
- `ctx.query`: parsed query string values
- `ctx.body`: parsed request body for `POST`, `PUT`, and `PATCH`
- `ctx.headers`: request headers

## Built-In Middleware

`elit/server` ships middleware for common server concerns:

- `cors(options)`
- `logger({ format: 'simple' | 'detailed' })`
- `errorHandler()`
- `rateLimit({ windowMs, max, message })`
- `bodyLimit({ limit })`
- `cacheControl({ maxAge, public })`
- `compress()`
- `security()`

```typescript
import { ServerRouter, cors, logger, compress, security } from 'elit/server';

const api = new ServerRouter();

api.use(cors({ origin: ['http://localhost:3000'] }));
api.use(logger({ format: 'detailed' }));
api.use(compress());
api.use(security());
```

## Programmatic Dev Server

Use `createDevServer()` when you want to start and control the server from code.

```typescript
import { createDevServer, ServerRouter } from 'elit/server';

const api = new ServerRouter();

api.get('/api/health', (ctx) => {
  ctx.res.json({ ok: true });
});

const server = createDevServer({
  port: 3000,
  root: '.',
  open: false,
  logging: true,
  api,
});

const counter = server.state.create('counter', { initial: 0 });
counter.onChange((value) => {
  console.log('counter changed to', value);
});

console.log(server.url);

// Later:
await server.close();
```

`createDevServer()` returns:

- `server`: the underlying HTTP server
- `wss`: the internal WebSocket server used for HMR and shared state
- `url`: the resolved base URL
- `state`: a `StateManager` instance
- `close()`: async shutdown helper

## Config-Driven API, Proxy, SSR, And Multiple Clients

`dev` and `preview` can both run a single app or multiple apps on one port.

```typescript
import { ServerRouter } from 'elit/server';

const publicApi = new ServerRouter();
publicApi.get('/api/health', (ctx) => ctx.res.json({ app: 'public' }));

const adminApi = new ServerRouter();
adminApi.get('/api/health', (ctx) => ctx.res.json({ app: 'admin' }));

export default {
  dev: {
    port: 3000,
    clients: [
      {
        root: './apps/public',
        basePath: '',
        api: publicApi,
      },
      {
        root: './apps/admin',
        basePath: '/admin',
        api: adminApi,
        proxy: [
          {
            context: '/api/internal',
            target: 'http://localhost:8081',
            changeOrigin: true,
          },
        ],
      },
    ],
  },
};
```

Key behavior:

- `clients[].api` is isolated per client and matched before global `dev.api` or `preview.api`.
- `clients[].proxy` is checked before global proxy rules.
- `clients[].basePath` prefixes each client's API, worker, and WebSocket routes.
- `preview` supports the same `clients`, `api`, `proxy`, `worker`, `ws`, and `ssr` patterns as `dev`.

## WebSocket Endpoints

You can register custom WebSocket upgrade paths with `dev.ws`, `preview.ws`, or `clients[].ws`.

```typescript
export default {
  dev: {
    port: 3000,
    root: '.',
    ws: [
      {
        path: '/ws',
        handler: ({ ws, path, query, headers }) => {
          ws.send(JSON.stringify({
            type: 'connected',
            path,
            room: query.room || 'general',
            userAgent: headers['user-agent'] || 'unknown',
          }));

          ws.on('message', (message) => {
            ws.send(message.toString());
          });
        },
      },
    ],
    clients: [
      {
        root: './apps/admin',
        basePath: '/admin',
        ws: [
          {
            path: '/events',
            handler: ({ ws }) => {
              ws.send('admin ready');
            },
          },
        ],
      },
    ],
  },
};
```

Important matching rules:

- WebSocket path matching is exact on the pathname.
- Query strings are ignored for matching but exposed in `ctx.query`.
- `clients[].ws` endpoints are automatically prefixed by `basePath`, so `/admin` plus `/events` becomes `/admin/events`.
- The internal path `/__elit_ws` is reserved for Elit HMR and shared-state traffic and must not be reused.

If you need the lower-level adapter directly, see [ws.md](./ws.md).

## Shared State

Server-side shared state lives on the `StateManager` returned by `createDevServer()`.

```typescript
const server = createDevServer({ root: '.', port: 3000, open: false });

const todos = server.state.create('todos', {
  initial: ['ship docs'],
  validate: (value) => Array.isArray(value),
});

todos.update((items) => [...items, 'review release']);
```

On the client, pair it with `createSharedState()` from `elit/state`:

```typescript
import { createSharedState, reactive } from 'elit/state';
import { div, button, ul, li } from 'elit/el';

const todos = createSharedState<string[]>('todos', []);

const view = div(
  button({ onclick: () => todos.update((items) => [...items, 'new item']) }, 'Add'),
  reactive(todos.state, (items) =>
    ul(...items.map((item) => li(item)))
  )
);
```

Notes:

- `createSharedState()` automatically connects to Elit's reserved internal socket when you do not pass a custom URL.
- Shared state reconnects automatically in the browser.
- `SharedState` supports `value`, `state`, `onChange()`, `update()`, `disconnect()`, and `destroy()`.

## Response Helpers

`elit/server` also exports small response helpers for manual handlers:

- `json(res, data, status?)`
- `text(res, data, status?)`
- `html(res, data, status?)`
- `status(res, code, message?)`

## Related Docs

- [CONFIG.md](./CONFIG.md)
- [CLI.md](./CLI.md)
- [API.md](./API.md)
- [ws.md](./ws.md)
