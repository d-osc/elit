# Elit

⚡ A lightweight TypeScript framework with built-in dev server, HMR, routing, and reactive state management. **Zero production dependencies**, maximum developer experience.

[![npm version](https://img.shields.io/npm/v/elit.svg)](https://www.npmjs.com/package/elit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bundle Size](https://img.shields.io/badge/bundle%20size-lightweight-success)](https://bundlephobia.com/package/elit)

> **Quick Links:** [Installation](#installation) | [Features](#features) | [Quick Start](#quick-start) | [CLI Tools](#cli-tools) | [API](#api) | [Deployment](#deployment)

## Why Elit?

### Frontend Excellence
- **🎯 Ultra Lightweight**: Modular design - import only what you need (DOM: 11KB, State: 15KB)
- **⚡ Lightning Fast**: Direct DOM manipulation - no virtual DOM overhead
- **🔄 Reactive State**: Simple but powerful reactive state management with `createState` and `computed`
- **🎨 CSS-in-JS**: Type-safe styling with `CreateStyle`
- **🛣️ Client Router**: Hash and history mode routing with dynamic parameters and guards
- **📱 Virtual Scrolling**: Handle 100k+ items efficiently
- **🌲 Tree-Shakeable**: Smart ES modules - only bundle what you use

### Backend Performance
- **🚀 High Performance**: 10,000+ req/s on Node.js with sub-7ms latency
- **🌐 ServerRouter**: Full-featured routing with only 2.7% overhead vs raw HTTP
- **🔌 WebSocket**: Built-in real-time communication support
- **⚡ Cross-Runtime**: Works on Node.js, Bun, and Deno with runtime-specific optimizations
- **🔧 Middleware Stack**: CORS, logging, rate limiting, compression, and more
- **🔐 Zero Dependencies**: No production dependencies for maximum security

### Developer Experience
- **🔷 TypeScript First**: Full type safety and IntelliSense out of the box
- **🔥 Hot Module Replacement**: Instant development feedback with automatic HMR
- **🏗️ Build System**: Integrated esbuild for fast production builds
- **🎯 Zero Config**: Works out of the box with optional `elit.config.mjs`
- **📦 CLI Tools**: `npx elit dev`, `npx elit build`, `npx elit preview`
- **🌍 Environment Support**: .env files with VITE_ prefix

## Installation

```bash
npm install elit
```

## CLI Tools

Elit includes a powerful CLI for development and production:

```bash
# Development server with HMR
npx elit dev

# Production build
npx elit build

# Preview production build
npx elit preview
```

### Configuration

Create `elit.config.mjs` (or .ts, .js, .json) in your project root:

```javascript
import { defineConfig } from 'elit';
import { resolve } from 'path';

export default defineConfig({
  dev: {
    port: 3000,
    host: 'localhost',
    root: './src',
    basePath: '/',
    open: true
  },
  build: {
    entry: './src/main.ts',
    outDir: './dist',
    format: 'esm',
    minify: true,
    platform: 'browser',
    basePath: '/app',
    copy: [
      {
        from: 'index.html',
        to: 'index.html',
        transform: (content, config) => {
          // Inject base tag from basePath
          return content;
        }
      }
    ]
  },
  preview: {
    port: 4173,
    root: './dist',
    basePath: '/app'
  }
});
```

## Features

### Frontend Framework

- 🎯 **Modular & Lightweight**: DOM (11KB), State (15KB), Router (13KB) - use only what you need
- ⚡ **Reactive State**: Built-in reactive state management with `createState` and automatic dependency tracking
- 🔄 **Computed Values**: Automatic dependency tracking with `computed` for derived state
- 🎨 **CSS-in-JS**: Type-safe styling with `CreateStyle` and support for pseudo-selectors
- 🛣️ **Client-Side Router**: Hash and history mode routing with dynamic parameters and navigation guards
- 📱 **Virtual Scrolling**: Handle 100k+ items efficiently with `createVirtualList`
- 🖥️ **SSR Support**: Full server-side rendering with `renderToString`
- 🎭 **100+ Elements**: Complete HTML, SVG, and MathML element support
- 🔧 **Performance Utilities**: Throttle, debounce, batch rendering, chunked rendering
- 📦 **Tree-Shakeable**: ES modules with excellent tree-shaking support
- 🎮 **DOM Utilities**: Query selectors, element creation, fragment support

### Backend & Development

- 🔥 **Hot Module Replacement**: Instant development feedback with automatic state preservation
- 🏗️ **Build System**: Integrated esbuild with runtime-specific optimizations (Node.js, Bun, Deno)
- 🌐 **ServerRouter**: High-performance routing (10,128 req/s) with minimal overhead (2.7%)
- 🔧 **Rich Middleware**: CORS, logging, rate limiting, compression, security headers, and more
- 🔌 **WebSocket Server**: Built-in WebSocket with automatic state synchronization
- 📁 **Static File Server**: Efficient serving with proper MIME types and caching
- 🎯 **Smart Defaults**: Zero-config development with optional `elit.config.mjs`
- 📦 **Auto TypeScript**: Automatic TypeScript compilation on all runtimes
- 🌍 **Environment Variables**: .env file support with VITE_ prefix
- ⚡ **Cross-Runtime**: Optimized for Node.js, Bun, and Deno with specific adaptations

## Quick Start

### 1. Create Your Project

```bash
# Create a new directory
mkdir my-elit-app
cd my-elit-app

# Initialize package.json
npm init -y

# Install Elit
npm install elit
```

### 2. Create Your App

Create `src/main.ts`:

```typescript
import { div, h1, button, createState, reactive, dom } from 'elit';

const count = createState(0);

const app = div({ className: 'app' },
  h1('Hello Elit! 🚀'),
  reactive(count, (value) =>
    button({
      onclick: () => count.value++,
      className: 'btn'
    }, `Count: ${value}`)
  )
);

// Render to DOM
dom.render('#app', app);
```

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elit App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="src/main.ts"></script>
</body>
</html>
```

### 3. Start Development Server

```bash
npx elit dev
```

Your app will automatically reload when you make changes with HMR!

### NPM Installation

```bash
npm install elit
```

```typescript
import { div, h1, p, button, createState, reactive, dom } from 'elit';

// Create reactive state
const count = createState(0);

// Create elements with reactive updates
const app = div({ className: 'app' },
  h1('Hello Elit! 👋'),
  p('A lightweight, reactive DOM library'),
  reactive(count, (value) =>
    button({
      onclick: () => count.value++,
      className: 'btn-primary'
    }, `Count: ${value}`)
  )
);

// Render to DOM
dom.render('#app', app);
```

### CDN Usage

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/elit@latest/dist/index.global.js"></script>
</head>
<body>
  <div id="app"></div>
  <script>
    const { div, h1, button, createState, reactive, dom } = window;

    const count = createState(0);
    const app = div(
      h1('Hello from CDN!'),
      reactive(count, value =>
        button({ onclick: () => count.value++ }, `Count: ${value}`)
      )
    );

    dom.render('#app', app);
  </script>
</body>
</html>
```

## API

### Element Factories

Create virtual DOM nodes using element factory functions:

```typescript
import { div, span, a, button, input, form } from 'elit';

const element = div({ className: 'container' },
  span('Hello'),
  a({ href: '/about' }, 'About')
);
```

### State Management

```typescript
import { createState, computed, effect } from 'elit';

// Create state
const name = createState('World');
const count = createState(0);

// Computed values
const greeting = computed([name], (n) => `Hello, ${n}!`);

// State with options
const throttledState = createState(0, { throttle: 100 });
const deepState = createState({ nested: { value: 1 } }, { deep: true });
```

### Reactive Rendering

```typescript
import { reactive, text, bindValue, bindChecked } from 'elit';

const message = createState('Hello');
const isEnabled = createState(false);

// Reactive element - re-renders when state changes
const display = reactive(message, (value) =>
  div({ className: 'message' }, value)
);

// Reactive text node
const label = text(message);

// Two-way binding for inputs
const inputEl = input({ type: 'text', ...bindValue(message) });
const checkbox = input({ type: 'checkbox', ...bindChecked(isEnabled) });
```

### Shared State (Real-time Sync)

Shared state automatically syncs between server and client via WebSocket:

**Client-side:**

```typescript
import { createSharedState, reactive } from 'elit';

// Create shared state (auto-connects to WebSocket server)
const counter = createSharedState('counter', 0);
const users = createSharedState('users', []);

// Use with reactive rendering
const app = div(
  reactive(counter.state, value =>
    div(`Counter: ${value}`)
  ),
  button({ onclick: () => counter.set(counter.state.value + 1) }, 'Increment')
);

// Listen to changes
counter.onChange((newValue) => {
  console.log('Counter changed to:', newValue);
});

// Update from any client - automatically syncs to all connected clients
counter.set(10);
```

**Server-side:**

```typescript
import { createDevServer, StateManager } from 'elit';

const server = createDevServer({ port: 3000 });

// StateManager is built-in and handles WebSocket connections
// All clients with matching shared state keys will sync automatically
```

### Development Server with REST API

Elit includes a built-in development server with HMR, WebSocket support, and REST API routing:

**Server Configuration (server.ts):**

```typescript
import { createDevServer, ServerRouter, cors, logger, json } from 'elit';

// Create REST API router
const api = new ServerRouter();

// Add middleware
api.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
api.use(logger());

// Define API routes with helper functions
api.get('/api/users', (ctx) => {
  json(ctx, { success: true, users: [] });
});

api.post('/api/users', async (ctx) => {
  const user = ctx.body;
  json(ctx, { success: true, user });
});

// Create development server
const server = createDevServer({
  port: 3000,
  root: './src',
  open: true,
  router: api
});
```

**Available Middleware:**

```typescript
import {
  cors,          // CORS headers
  logger,        // Request logging
  errorHandler,  // Error handling
  rateLimit,     // Rate limiting
  bodyLimit,     // Request body size limit
  cacheControl,  // Cache headers
  compress,      // Gzip compression
  security       // Security headers
} from 'elit';

// Example usage
api.use(cors({ origin: '*' }));
api.use(logger({ format: 'detailed' }));
api.use(rateLimit({ max: 100, windowMs: 60000 }));
api.use(bodyLimit({ limit: 1024 * 1024 })); // 1MB
api.use(compress());
api.use(security());
```

**Helper Functions:**

```typescript
import { json, sendText, html, status } from 'elit';

api.get('/api/data', (ctx) => {
  json(ctx, { message: 'Hello' }); // JSON response
});

api.get('/text', (ctx) => {
  sendText(ctx, 'Hello World'); // Text response
});

api.get('/page', (ctx) => {
  html(ctx, '<h1>Hello</h1>'); // HTML response
});

api.get('/error', (ctx) => {
  status(ctx, 404, 'Not Found'); // Custom status
});
```

**CLI Usage:**

```bash
# Start dev server
npx elit dev

# Custom port
npx elit dev --port 8080

# Custom root directory
npx elit dev --root ./public

# Disable auto-open browser
npx elit dev --no-open
```

### Server-Side Rendering

```typescript
import { div, p, renderToString } from 'elit';

const html = renderToString(
  div({ className: 'app' },
    p('Server rendered content')
  ),
  { pretty: true }
);
```

### Routing

```typescript
import { createRouter, createRouterView, routerLink } from 'elit';

const router = createRouter({
  mode: 'history', // or 'hash'
  routes: [
    { path: '/', component: () => div('Home') },
    { path: '/about', component: () => div('About') },
    { path: '/user/:id', component: (params) => div(`User ${params.id}`) }
  ],
  notFound: () => div('404 Not Found'),
  beforeEach: (to, from, next) => {
    // Navigation guard
    console.log(`Navigating from ${from} to ${to}`);
    next();
  }
});

// Create navigation links
const nav = routerLink(router, { to: '/about' }, 'Go to About');

// Programmatic navigation
router.navigate('/user/123');
```

### CSS-in-JS with CreateStyle

```typescript
import { CreateStyle } from 'elit';

const styles = new CreateStyle();

// Define styles
const buttonClass = styles.class('button', {
  padding: '10px 20px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '#0056b3'
  }
});

// Use in elements
const btn = button({ className: buttonClass }, 'Click me');
```

### Performance Utilities

```typescript
import {
  batchRender,
  renderChunked,
  createVirtualList,
  throttle,
  debounce,
  lazy,
  cleanupUnused
} from 'elit';

// Batch render multiple elements
batchRender('#container', elements);

// Chunked rendering for very large lists
renderChunked('#container', largeArray, 5000, (current, total) => {
  console.log(`Rendered ${current}/${total}`);
});

// Virtual scrolling for 100k+ items
const virtualList = createVirtualList(
  container,
  items,
  (item, index) => div(item.name),
  50, // item height
  5   // buffer size
);

// Lazy loading components
const LazyComponent = lazy(() => import('./HeavyComponent'));

// Throttle and debounce
const throttledFn = throttle(handleScroll, 100);
const debouncedFn = debounce(handleInput, 300);

// Cleanup unused DOM elements
const cleaned = cleanupUnused(rootElement);
console.log(`Cleaned ${cleaned} elements`);
```

### Additional Features

**DOM Utilities:**

```typescript
import { doc, el, els, createEl, elId, elClass, fragment } from 'elit';

// Query selectors
const element = el('.my-class');      // querySelector
const elements = els('.my-class');    // querySelectorAll
const byId = elId('my-id');          // getElementById
const byClass = elClass('my-class'); // getElementsByClassName

// Create elements
const div = createEl('div');         // createElement
const frag = fragment();             // createDocumentFragment

// Access document
doc.title = 'New Title';
```

**Effect System:**

```typescript
import { createState, effect } from 'elit';

const count = createState(0);

// Run side effects when state changes
effect(() => {
  console.log('Count is now:', count.value);
});
```

**Reactive As (Advanced):**

```typescript
import { reactiveAs } from 'elit';

// Use different reactive context
const display = reactiveAs(customState, customContext, (value) =>
  div(value)
);
```

### JSON Rendering

```typescript
import { renderJson, renderVNode, renderJsonToString } from 'elit';

// Render from JSON structure (tag, attributes, children)
renderJson('#app', {
  tag: 'div',
  attributes: { class: 'container' },
  children: [
    { tag: 'h1', children: 'Title' },
    { tag: 'p', children: 'Content' }
  ]
});

// Render from VNode JSON structure (tagName, props, children)
renderVNode('#app', {
  tagName: 'div',
  props: { className: 'container' },
  children: [
    { tagName: 'h1', children: ['Title'] }
  ]
});
```

### Head Management

```typescript
import { setTitle, addMeta, addLink, addStyle } from 'elit';

setTitle('My App');
addMeta({ name: 'description', content: 'My awesome app' });
addLink({ rel: 'stylesheet', href: '/styles.css' });
addStyle('body { margin: 0; }');
```

## Available Elements

### HTML Elements (100+)
All standard HTML elements are available as factory functions:

**Layout**: `div`, `span`, `section`, `article`, `header`, `footer`, `nav`, `main`, `aside`

**Text**: `p`, `h1`-`h6`, `strong`, `em`, `code`, `pre`, `blockquote`, `hr`, `br`

**Forms**: `form`, `input`, `button`, `textarea`, `select`, `option`, `label`, `fieldset`, `legend`

**Lists**: `ul`, `ol`, `li`, `dl`, `dt`, `dd`

**Tables**: `table`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`, `caption`, `colgroup`, `col`

**Media**: `img`, `video`, `audio`, `source`, `track`, `picture`, `canvas`, `svg`

**Links**: `a`, `link`, `meta`, `base`

**Semantic**: `time`, `progress`, `meter`, `details`, `summary`, `dialog`, `mark`, `abbr`

And many more...

### SVG Elements
All SVG elements are prefixed with `svg`:

`svgSvg`, `svgCircle`, `svgRect`, `svgPath`, `svgLine`, `svgPolyline`, `svgPolygon`, `svgEllipse`, `svgG`, `svgText`, `svgDefs`, `svgLinearGradient`, `svgRadialGradient`, `svgStop`, `svgUse`, `svgSymbol`, and more.

### MathML Elements
All MathML elements are prefixed with `math`:

`mathMath`, `mathMi`, `mathMn`, `mathMo`, `mathMfrac`, `mathMsqrt`, `mathMroot`, `mathMsup`, `mathMsub`, `mathMsubsup`, `mathMover`, `mathMunder`, `mathMunderover`, and more.

## Bundle Size & Performance

Elit is designed to be modular and lightweight with excellent tree-shaking support:

### Bundle Sizes (Minified)

| Component | ESM | CJS | Description |
|-----------|-----|-----|-------------|
| **Full Framework** | 79.52 KB | 80.48 KB | All features included |
| **DOM Only** | 11.06 KB | 11.07 KB | Just DOM utilities |
| **State** | 15.34 KB | 15.38 KB | Reactive state management |
| **Router** | 13.22 KB | 13.22 KB | Client-side routing |
| **Server** | 51.07 KB | 51.18 KB | Server features + Router |
| **HTTP** | 7.70 KB | 7.85 KB | HTTP utilities |
| **CLI** | 127.63 KB | - | Full development toolchain |

**Tree-shaking**: Import only what you need! Using modular imports (`elit/dom`, `elit/state`) keeps your bundle minimal.

### Server Performance (Node.js v24.12.0)

| Component | Throughput | Latency (P50) | Latency (Avg) | Description |
|-----------|-----------|---------------|---------------|-------------|
| **HTTP Server** | 10,410 req/s | 5.91ms | 6.69ms | Raw HTTP optimized |
| **ServerRouter** | 10,128 req/s | 6.09ms | 6.94ms | Full routing + middleware |

**Router Overhead**: Only 2.7% slower than raw HTTP while providing:
- Route matching with dynamic params
- Query string parsing
- Request context
- Middleware chain support
- Body parsing

### Cross-Runtime Support

Elit works seamlessly on **Node.js, Bun, and Deno** with runtime-specific optimizations:

- **Node.js**: Uses native `http` module
- **Bun**: Ultra-fast `Bun.serve()` with synchronous response detection
- **Deno**: `Deno.serve()` integration

### Performance Optimizations

**Frontend**:
- Direct DOM manipulation (no virtual DOM diffing)
- Optimized rendering with RAF batching
- Smart children rendering with automatic fragment usage
- Efficient attribute updates using charCode checks
- Minimal function closures and memory allocation

**Backend**:
- **Zero-copy headers** for Bun/Deno runtimes
- **Synchronous response detection** eliminates Promise overhead
- **String-based body buffering** reduces allocations
- **Inline Response creation** minimizes object overhead
- **Pre-compiled route patterns** for fast matching

[View detailed benchmarks →](./benchmark)

## Browser Usage

When loaded via script tag, all exports are available on the `window` object:

```html
<script src="https://unpkg.com/elit@latest/dist/index.global.js"></script>
<script>
  const { div, span, createState, dom } = window;
  // or use DomLib global namespace
  const app = DomLib.div('Hello');
</script>
```

## Examples

### Todo App

```typescript
import { div, input, button, ul, li, createState, reactive, bindValue } from 'elit';

const todos = createState<string[]>([]);
const newTodo = createState('');

const TodoApp = div({ className: 'todo-app' },
  div({ className: 'input-group' },
    input({ type: 'text', placeholder: 'Add a todo...', ...bindValue(newTodo) }),
    button({
      onclick: () => {
        if (newTodo.value.trim()) {
          todos.value = [...todos.value, newTodo.value];
          newTodo.value = '';
        }
      }
    }, 'Add')
  ),
  reactive(todos, (items) =>
    ul(
      ...items.map((todo, index) =>
        li(
          todo,
          button({
            onclick: () => {
              todos.value = todos.value.filter((_, i) => i !== index);
            }
          }, 'Delete')
        )
      )
    )
  )
);
```

### Counter with Computed Values

```typescript
import { div, button, createState, computed, reactive } from 'elit';

const count = createState(0);
const doubled = computed([count], (c) => c * 2);
const isEven = computed([count], (c) => c % 2 === 0);

const Counter = div(
  reactive(count, (c) => div(`Count: ${c}`)),
  reactive(doubled, (d) => div(`Doubled: ${d}`)),
  reactive(isEven, (even) => div(`Is even: ${even}`)),
  button({ onclick: () => count.value++ }, 'Increment'),
  button({ onclick: () => count.value-- }, 'Decrement')
);
```

## TypeScript Support

Elit is written in TypeScript and provides excellent type safety:

```typescript
import { VNode, State, Props } from 'elit';

// Type-safe element creation
const props: Props = {
  className: 'container',
  onclick: (e: MouseEvent) => console.log(e)
};

// Type-safe state
const count: State<number> = createState(0);
const users: State<User[]> = createState([]);

// Full IntelliSense support for all 100+ HTML elements
```

## Deployment

Deploy your Elit application to production:

### Build for Production

```bash
# Build your app
npx elit build

# Preview production build
npx elit preview
```

### Deploy to Vercel

```bash
npm i -g vercel
npm run build
vercel --prod
```

### Deploy to Netlify

```bash
npm i -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

### Deploy to GitHub Pages

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Docker Deployment

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment Variables

Create `.env.production`:

```env
VITE_API_URL=https://api.example.com
VITE_ENV=production
```

Access in your code:

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
const isProd = import.meta.env.PROD;
```

## Comparison with Other Frameworks

| Feature | Elit | Vite + React | Next.js | SvelteKit | Express.js |
|---------|----------|--------------|---------|-----------|------------|
| **Frontend Size** | 11-15KB (modular) | ~140KB+ | ~200KB+ | ~15KB* | N/A |
| **Backend Size** | 51KB (Server) | N/A | N/A | N/A | ~200KB+ |
| **Prod Dependencies** | **0** (Zero!) | Many | Many | Many | Many |
| **Dev Server** | ✅ Built-in | ✅ Vite | ✅ Built-in | ✅ Built-in | ❌ |
| **HMR** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Build Tool** | ✅ esbuild | ✅ Vite | ✅ Turbopack | ✅ Vite | ❌ |
| **REST API** | ✅ 10K+ req/s | ❌ | ✅ | ✅ | ✅ 8K+ req/s |
| **Middleware** | ✅ Built-in | ❌ | ✅ | ✅ | ✅ |
| **WebSocket** | ✅ Built-in | ❌ | ❌ | ❌ | ➕ Via package |
| **Shared State** | ✅ Auto-sync | ❌ | ❌ | ❌ | ❌ |
| **Cross-Runtime** | ✅ Node/Bun/Deno | ❌ | ❌ | ❌ | ✅ Node only |
| **TypeScript** | ✅ Native | ✅ | ✅ | ✅ | ➕ Via setup |
| **SSR** | ✅ | ❌ | ✅ | ✅ | ➕ Manual |
| **Tree-Shaking** | ✅ Excellent | ✅ | ✅ | ✅ | ❌ |
| **Learning Curve** | Easy | Medium | Medium | Easy | Easy |

*Svelte requires compilation step

### Performance Comparison

**Backend (10K requests, 100 concurrent)**:
- **Elit ServerRouter**: 10,128 req/s (6.94ms avg) on Node.js
- **Express.js**: ~8,000 req/s (12ms avg) on Node.js
- **Fastify**: ~12,000 req/s (8ms avg) on Node.js
- **Elysia (Bun)**: ~100,000 req/s (<1ms avg) on Bun

**Frontend Bundle**:
- **Elit (modular)**: 11KB (DOM) + 15KB (State) = 26KB for typical app
- **React + React-DOM**: 140KB+ (45KB gzipped)
- **Vue 3**: 95KB+ (32KB gzipped)
- **Svelte**: 15KB+ (6KB gzipped) *after compilation*

## Documentation

- 📚 [Full Documentation](https://d-osc.github.io/elit)
- ⚡ [Quick Start](https://d-osc.github.io/elit#/docs)
- 📖 [API Reference](https://d-osc.github.io/elit#/api)
- 🎮 [Interactive Examples](https://d-osc.github.io/elit#/examples)

## Changelog

### v2.0.0 - Full-Stack Framework with Performance Optimizations

**🚀 Backend Performance Enhancements:**
- ⚡ **Ultra-Fast HTTP**: 10,410 req/s with sub-7ms latency on Node.js
- 🎯 **Optimized ServerRouter**: 10,128 req/s with only 2.7% overhead vs raw HTTP
- 🔄 **Synchronous Response Detection**: Eliminates Promise overhead for Bun runtime
- 🆓 **Zero-Copy Headers**: Direct headers reference for Bun/Deno runtimes
- 📦 **String-Based Body Buffering**: Reduced allocations and faster responses
- ⚡ **Cross-Runtime Optimizations**: Runtime-specific code paths for Node.js, Bun, and Deno
- 🔧 **Pre-Compiled Routes**: Route patterns compiled once during registration

**🏗️ Build System & CLI:**
- 🚀 **Integrated Build System**: Built-in esbuild with runtime-specific transpilation
- 🔥 **CLI Tools**: `npx elit dev`, `npx elit build`, `npx elit preview`
- 🏗️ **Zero Config**: Works out of the box with optional `elit.config.mjs`
- 🎯 **basePath Support**: Configure base paths for subdirectory deployments
- 🔐 **Environment Variables**: .env file support with VITE_ prefix
- 📦 **Smart Bundling**: Automatic code splitting and tree-shaking
- ⚡ **Hot Module Replacement**: Instant development feedback

**🌐 Server Features:**
- 🌐 **ServerRouter**: High-performance routing with regex pattern matching
- 🔧 **Rich Middleware**: CORS, logger, rate limit, compression, security headers
- 🔌 **WebSocket Server**: Built-in WebSocket with state synchronization
- 🔄 **Shared State**: Real-time auto-sync between server and all clients
- 📁 **Static File Server**: Efficient serving with proper MIME types
- 💾 **Cache Headers**: Smart caching for static assets
- 📦 **Gzip Compression**: Automatic compression for production

**🎨 Frontend Library:**
- 🎯 **Modular Design**: DOM (11KB), State (15KB), Router (13KB) - use only what you need
- ⚡ **Reactive State**: Automatic dependency tracking with `createState` and `computed`
- 🎨 **CSS-in-JS**: Type-safe styling with `CreateStyle`
- 🛣️ **Client Router**: Hash and history mode with navigation guards
- 📱 **Virtual Scrolling**: Handle 100k+ items with `createVirtualList`
- 🖥️ **SSR Support**: `renderToString` for server-side rendering
- 🎭 **100+ Elements**: Complete HTML, SVG, and MathML support
- 🔧 **Performance Utilities**: Throttle, debounce, batch rendering
- 📦 **Tree-Shakeable**: Excellent ES module tree-shaking

**📊 Benchmarks:**
- HTTP Server: 10,410 req/s (Node.js v24.12.0)
- ServerRouter: 10,128 req/s with full routing + middleware
- Router Overhead: Only 2.7% vs raw HTTP
- [View detailed benchmarks →](./benchmark)

## Examples

Example applications demonstrating Elit features:

- 📖 **[Documentation Site](./docs)** - Full-featured docs site with i18n and blog
- 🎯 **[Counter App](./examples/counter)** - Simple reactive counter
- ✅ **[Todo App](./examples/todo)** - Todo list with state management
- 🎨 **[Styled Components](./examples/styled)** - CSS-in-JS examples

[View all examples →](./examples)

## Links

- 📦 [npm Package](https://www.npmjs.com/package/elit)
- 🐙 [GitHub Repository](https://github.com/d-osc/elit)
- 📚 [Documentation](https://d-osc.github.io/elit)
- 💬 Community & Issues: [GitHub Discussions](https://github.com/d-osc/elit/discussions)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](./LICENSE) for details

---

**Built with ❤️ for modern web development**

*Elit - Lightweight, Reactive, Powerful* 🚀
