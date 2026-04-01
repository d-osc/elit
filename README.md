# Elit

Elit is a TypeScript toolkit for building browser UIs, dev servers, SSR pages, tests, desktop WebView apps, and small file-backed backends from one package.

The package is split by runtime. Browser-facing APIs live in `elit` and the client subpaths, server APIs live in `elit/server`, desktop APIs live in `elit/desktop`, and the CLI is `elit`.

## AI Quick Context

If you are generating or editing code for Elit, follow these rules first:

- Use `elit` or the client subpaths for browser UI code.
- Use `elit/server` for HTTP routes, middleware, dev server, preview server, and server-side shared state.
- Use `elit/desktop` only inside `elit desktop ...` runtime. Those APIs are injected by the native desktop runtime and are not normal browser globals.
- Use `elit/build` for programmatic bundling.
- Use `elit/database` for the VM-backed file database helpers.
- Do not use `elit-server`. Old docs may mention it, but the current package export is `elit/server`.
- Prefer subpath imports in generated code. They make environment boundaries obvious.
- `createRouterView(router, options)` returns a function. Render it inside `reactive(router.currentRoute, () => RouterView())`.
- Browser-facing code may import local `.ts` files during development. Elit rewrites those imports for browser output.
- Config files can be `elit.config.ts`, `elit.config.js`, `elit.config.mjs`, `elit.config.cjs`, or `elit.config.json`.
- Environment files are loaded in this order: `.env.{mode}.local`, `.env.{mode}`, `.env.local`, `.env`.
- Only `VITE_` variables are injected into client bundles.

## Install

Create a new app with the scaffold:

```bash
npm create elit@latest my-app
cd my-app
npm install
npm run dev
```

Other package managers:

```bash
yarn create elit my-app
pnpm create elit my-app
bun create elit my-app
deno run -A npm:create-elit my-app
```

Manual install:

```bash
npm install elit
```

If you want desktop mode, install Cargo as well. The native desktop runtime is built with Rust.

## Module Map

Use this table as the import map for generated code.

| Import | Use it for | Main exports |
| --- | --- | --- |
| `elit` | Client-side all-in-one entry | DOM helpers, element factories, state, styles, router, HMR |
| `elit/dom` | DOM renderer and SSR string rendering | `dom`, `render`, `renderToString`, `mount` |
| `elit/el` | HTML, SVG, and MathML element factories | `div`, `button`, `html`, `body`, `script`, and many more |
| `elit/state` | Reactive state and render helpers | `createState`, `computed`, `reactive`, `text`, `bindValue`, `bindChecked`, `createSharedState` |
| `elit/style` | CSS generation and injection | `CreateStyle`, `styles`, `renderStyle`, `injectStyle`, `addClass`, `addTag` |
| `elit/router` | Client-side routing | `createRouter`, `createRouterView`, `routerLink` |
| `elit/server` | HTTP router, dev server, middleware, shared server state | `ServerRouter`, `createDevServer`, `cors`, `logger`, `rateLimit`, `compress`, `security`, `StateManager` |
| `elit/build` | Programmatic build API | `build` |
| `elit/desktop` | Native desktop window APIs | `createWindow`, `createWindowServer`, `onMessage`, `windowQuit`, `windowSetTitle`, `windowEval` |
| `elit/database` | VM-backed file database | `Database`, `create`, `read`, `save`, `update`, `rename`, `remove` |
| `elit/test` | Test runner module entry | test runtime helpers used by the CLI |

Advanced subpaths also exist for lower-level adapters and internals: `elit/http`, `elit/https`, `elit/ws`, `elit/wss`, `elit/fs`, `elit/path`, `elit/mime-types`, `elit/chokidar`, `elit/runtime`, `elit/test-runtime`, `elit/test-reporter`, and `elit/types`.

## Fastest Working App

This is the smallest browser app that works with the current CLI.

Project structure:

```text
my-app/
  index.html
  src/
    main.ts
```

`src/main.ts`

```ts
import { div, h1, button } from 'elit/el';
import { createState, reactive } from 'elit/state';
import { render } from 'elit/dom';

const count = createState(0);

const app = div(
  { className: 'app' },
  h1('Hello Elit'),
  reactive(count, (value) =>
    button({ onclick: () => count.value++ }, `Count: ${value}`)
  )
);

render('app', app);
```

`index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Elit App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Run it:

```bash
npx elit dev
```

Notes:

- `render('app', app)` and `render('#app', app)` both work.
- During development you can point the browser to `/src/main.ts` directly.
- For production builds, your copied HTML should point to the built asset path such as `/main.js`.

## CLI

Main commands:

```bash
npx elit dev
npx elit build --entry ./src/main.ts --out-dir dist
npx elit preview
npx elit test
npx elit desktop ./src/main.ts
npx elit desktop build ./src/main.ts --release
```

Useful flags:

- `elit dev --port 3000 --host 0.0.0.0 --no-open`
- `elit build --entry ./src/main.ts --out-dir dist --format esm --sourcemap`
- `elit preview --root dist --base-path /app`
- `elit test --watch`
- `elit test --file ./testing/unit/database.test.ts`
- `elit test --describe "Database"`
- `elit test --it "saves records"`
- `elit test --coverage --coverage-reporter text,html`
- `elit desktop --runtime quickjs|node|bun|deno`
- `elit desktop build --platform windows|linux|macos --out-dir dist`
- `elit desktop build --compiler auto|none|esbuild|tsx|tsup`

Desktop mode notes:

- Cargo is required the first time the native runtime is built.
- TypeScript entries are transpiled automatically when needed.
- Desktop build can prebuild the native runtime even without an entry file.
- `tsx` compiler mode is Node-only and keeps loading the original source tree instead of bundling it.
- `tsx` and `tsup` compiler modes require those packages to be installed in the project.
- Desktop icon support includes `.ico`, `.png`, and `.svg`.
- Desktop build auto-detects `icon.*` and `favicon.*` in the entry directory, project directory, and sibling `public/` folders.

## Config File

Elit loads one of these files from the project root:

- `elit.config.ts`
- `elit.config.js`
- `elit.config.mjs`
- `elit.config.cjs`
- `elit.config.json`

The config shape is:

```ts
{
  dev?: DevServerOptions;
  build?: BuildOptions | BuildOptions[];
  preview?: PreviewOptions;
  test?: TestOptions;
}
```

Example:

```ts
import { api } from './src/server';
import { documentShell } from './src/document';

export default {
  dev: {
    port: 3003,
    host: '0.0.0.0',
    open: false,
    logging: true,
    clients: [
      {
        root: '.',
        basePath: '',
        ssr: () => documentShell,
        api,
      },
    ],
  },
  build: [
    {
      entry: './src/main.ts',
      outDir: './dist',
      outFile: 'main.js',
      format: 'esm',
      sourcemap: true,
      copy: [
        { from: './public/index.html', to: './index.html' },
      ],
    },
  ],
  preview: {
    root: './dist',
    index: './index.html',
    port: 4173,
  },
  test: {
    include: ['testing/unit/**/*.test.ts'],
  },
};
```

Important details:

- `build` may be a single object or an array. If it is an array, all builds run sequentially.
- `dev.clients` is the most flexible setup when you want SSR, API routes, multiple apps, or per-client proxy rules.
- `preview` supports the same concepts as `dev`: multiple clients, API routes, proxy rules, workers, SSR, and HTTPS.
- Only `VITE_` variables are exposed to client code during bundling.

## Browser Patterns

### Elements and State

```ts
import { div, input, button, span } from 'elit/el';
import { createState, computed, reactive, bindValue } from 'elit/state';
import { render } from 'elit/dom';

const name = createState('Elit');
const count = createState(0);
const label = computed([name, count], (currentName, currentCount) => {
  return `${currentName}: ${currentCount}`;
});

const app = div(
  input({ type: 'text', ...bindValue(name) }),
  reactive(label, (value) => span(value)),
  button({ onclick: () => count.value++ }, 'Increment')
);

render('app', app);
```

### Router

```ts
import { div, nav } from 'elit/el';
import { reactive } from 'elit/state';
import { createRouter, createRouterView, routerLink } from 'elit/router';

const routerOptions = {
  mode: 'history' as const,
  routes: [
    { path: '/', component: () => div('Home') },
    { path: '/about', component: () => div('About') },
    { path: '/post/:id', component: (params: Record<string, string>) => div(`Post ${params.id}`) },
  ],
  notFound: () => div('404'),
};

const router = createRouter(routerOptions);
const RouterView = createRouterView(router, routerOptions);

const app = div(
  nav(
    routerLink(router, { to: '/' }, 'Home'),
    routerLink(router, { to: '/about' }, 'About')
  ),
  reactive(router.currentRoute, () => RouterView())
);
```

### Styling

```ts
import { CreateStyle } from 'elit/style';

const css = new CreateStyle();

css.addClass('app', {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  fontFamily: 'system-ui, sans-serif',
});

css.addClass('button', {
  padding: '12px 18px',
  borderRadius: '12px',
  border: '1px solid #222',
  background: '#111',
  color: '#fff',
  cursor: 'pointer',
});

css.addPseudoClass('hover', {
  opacity: 0.92,
}, '.button');

css.inject('app-styles');
```

You can also use the shared singleton export:

```ts
import styles from 'elit/style';
```

## Server Patterns

### Server Router

```ts
import { ServerRouter, cors, logger } from 'elit/server';

export const api = new ServerRouter();

api.use(cors());
api.use(logger());

api.get('/api/hello', async (ctx) => {
  ctx.res.json({ message: 'Hello from Elit' });
});

api.post('/api/echo', async (ctx) => {
  ctx.res.json({ body: ctx.body });
});
```

`ServerRouter` supports both Elit-style handlers and Express-like handlers:

- `async (ctx) => { ... }`
- `async (req, res) => { ... }`
- middleware with `use(middleware)` or `use('/prefix', middleware)`

### Programmatic Dev Server

```ts
import { createDevServer } from 'elit/server';

const server = createDevServer({
  port: 3000,
  root: '.',
  open: false,
  logging: true,
});

console.log(server.url);
```

### Shared State Between Server and Client

Client:

```ts
import { createSharedState } from 'elit/state';

const counter = createSharedState('counter', 0);
counter.value++;
```

Server:

```ts
import { createDevServer } from 'elit/server';

const server = createDevServer({ root: '.', open: false });
const counter = server.state.create('counter', { initial: 0 });

counter.value = 10;
counter.update((value) => value + 1);
```

The client `createSharedState()` connects over WebSocket to the current host unless you pass a custom `wsUrl`.

## SSR Document Shell

For SSR-style setups, export a document shell and return it from `dev.clients[].ssr`.

```ts
import { html, head, body, title, meta, div, script } from 'elit/el';

export const documentShell = html(
  head(
    title('My Elit App'),
    meta({ charset: 'UTF-8' }),
    meta({ name: 'viewport', content: 'width=device-width, initial-scale=1.0' })
  ),
  body(
    div({ id: 'app' }),
    script({ type: 'module', src: '/src/main.ts' })
  )
);
```

For production builds, make sure your built HTML points at the production asset path such as `/main.js`.

## Desktop Mode

Desktop mode runs an Elit entry file inside a native WebView shell.

Example desktop entry:

```ts
import { createWindow, onMessage, windowQuit, windowSetTitle } from 'elit/desktop';

onMessage((message) => {
  if (message === 'desktop:ready') {
    windowSetTitle('Elit Desktop');
    windowQuit();
  }
});

createWindow({
  title: 'Elit Desktop',
  width: 960,
  height: 640,
  icon: './public/favicon.svg',
  html: `<!doctype html>
<html lang="en">
  <body>
    <main>Hello from Elit Desktop</main>
    <script>
      window.addEventListener('DOMContentLoaded', () => {
        window.ipc.postMessage('desktop:ready');
      });
    </script>
  </body>
</html>`,
});
```

Run it:

```bash
npx elit desktop ./src/main.ts
```

Build a standalone executable:

```bash
npx elit desktop build ./src/main.ts --release
```

Desktop notes:

- Runtime choices: `quickjs`, `node`, `bun`, `deno`
- Transpiler choices: `auto`, `none`, `esbuild`, `tsx`, `tsup`
- `tsx` is a Node loader mode, not a bundle mode. Use `esbuild` or `tsup` when you want a relocatable output.
- Icon input supports `.ico`, `.png`, and `.svg`
- EXE icon embedding and runtime window icon loading both support SVG now
- `createWindowServer(app, opts)` is available when you want to run an HTTP app inside the desktop shell

## Database

Elit includes a small VM-backed database helper that stores files under a directory and can execute TypeScript or JavaScript code against them.

```ts
import { Database } from 'elit/database';

const db = new Database({
  dir: './databases',
  language: 'ts',
});

db.create('users', `export const users = [];`);

await db.execute(`
  import { users } from '@db/users';
  console.log(users.length);
`);
```

Useful methods:

- `create(dbName, code)`
- `read(dbName)`
- `save(dbName, code)`
- `update(dbName, fnName, code)`
- `rename(oldName, newName)`
- `remove(dbName, fnName?)`

## Programmatic Build API

If you want to bundle from code instead of the CLI:

```ts
import { build } from 'elit/build';

await build({
  entry: './src/main.ts',
  outDir: './dist',
  outFile: 'main.js',
  format: 'esm',
  sourcemap: true,
  copy: [
    { from: './public/index.html', to: './index.html' },
  ],
});
```

## Testing

CLI test runner examples:

```bash
npx elit test
npx elit test --watch
npx elit test --file ./testing/unit/database.test.ts
npx elit test --describe "Database"
npx elit test --it "should save data"
npx elit test --coverage --coverage-reporter text,html
```

The package also exports `elit/test`, `elit/test-runtime`, and `elit/test-reporter` for advanced use, but most users should stay on the CLI.

## Good Defaults For Generated Code

When writing new Elit code, these defaults are usually correct:

- Prefer `elit/el`, `elit/state`, and `elit/dom` in new examples.
- Keep server code on `elit/server` and browser code on client subpaths.
- Use `ServerRouter` for APIs instead of inventing another HTTP layer first.
- Use `createState` plus `reactive` for UI updates before adding abstractions.
- Use `CreateStyle` or `elit/style` for injected CSS.
- Use `elit.config.ts` when the project needs SSR, APIs, preview customization, workers, or proxy rules.
- Use `examples/correct-config` as the reference for a minimal full-stack setup.

## Repository Guide

If you are working in this repository, these locations matter most:

- `src/index.ts`: root client exports
- `src/dom.ts`: renderer and SSR string rendering
- `src/state.ts`: reactive state, bindings, shared state client
- `src/router.ts`: client router
- `src/style.ts`: CSS generator
- `src/server.ts`: dev server, `ServerRouter`, middleware, shared state server
- `src/build.ts`: bundler API
- `src/desktop.ts`: desktop runtime bindings exposed to TypeScript
- `src/desktop-cli.ts`: `elit desktop` implementation
- `src/database.ts`: database VM and helpers
- `examples/correct-config`: minimal full-stack reference
- `examples/full-db`: larger full-stack example with database usage
- `examples/desktop-example.ts`: desktop smoke test and runtime example
- `packages/create-elit`: scaffold templates used by `npm create elit@latest`
- `docs/`: the documentation site built with Elit itself

## Known Boundaries

- Root `elit` export is client-oriented. Non-client features are on subpaths.
- Desktop APIs only exist inside the desktop runtime.
- Client env injection is limited to `VITE_` variables.
- Production HTML copying is explicit. If you copy `index.html`, make sure it points at the built JS file, not the dev-only `/src/*.ts` path.

## Next Reads

- `examples/correct-config` for the cleanest SSR + API setup
- `examples/desktop-example.ts` for desktop runtime usage
- `USAGE_EXAMPLES.md` for more import combinations
- `docs/API.md` for broader API detail