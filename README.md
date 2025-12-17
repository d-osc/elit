# Elit

⚡ A lightweight, zero-dependency library for building reactive web applications with direct DOM manipulation.

[![npm version](https://img.shields.io/npm/v/elit.svg)](https://www.npmjs.com/package/elit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bundle Size](https://img.shields.io/badge/bundle%20size-~10KB%20gzipped-success)](https://bundlephobia.com/package/elit)

> **Quick Links:** [Installation](#installation) | [Features](#features) | [Quick Start](#quick-start) | [API](#api) | [Examples](#examples) | [elit-server](./server/README.md)

## Why Elit?

- **🎯 Tiny Bundle Size**: Only ~10KB gzipped (30KB minified) - no framework bloat
- **📦 Zero Dependencies**: Pure TypeScript, no external dependencies
- **⚡ Lightning Fast**: Direct DOM manipulation - no virtual DOM overhead
- **🔷 TypeScript First**: Full type safety and IntelliSense out of the box
- **🔄 Reactive State**: Simple but powerful reactive state management
- **🌲 Tree-Shakeable**: Import only what you need for optimal bundle size
- **🚀 Modern Features**: Router, SSR, virtual scrolling, CSS-in-JS, and more
- **🎨 Developer Experience**: Clean, intuitive API with excellent tooling support

## Installation

```bash
npm install elit

# Optional: Install dev server with HMR
npm install --save-dev elit-server
```

## Features

### Core Library (elit)

- 🎯 **Ultra Lightweight**: Just 30KB minified, ~10KB gzipped - optimized for performance
- ⚡ **Reactive State**: Built-in reactive state management with `createState`
- 🔄 **Computed Values**: Automatic dependency tracking with `computed`
- 🌐 **Shared State**: Real-time state sync with `elit-server` (optional)
- 🎨 **CSS-in-JS**: Type-safe styling with `CreateStyle` - full CSS features support
- 🛣️ **Client-Side Router**: Hash and history mode routing with dynamic parameters
- 📱 **Virtual Scrolling**: Handle 100k+ items efficiently with built-in virtual list
- 🖥️ **SSR Support**: Full server-side rendering capabilities
- 🎭 **SVG & MathML**: Complete support for SVG and MathML elements (100+ elements)
- 🔧 **Performance Utilities**: Throttle, debounce, batch rendering, and chunked rendering
- 📦 **Tree-Shakeable**: Import only what you need - excellent for bundle optimization
- 🎮 **DOM Utilities**: Convenient helper functions for common DOM operations
- 🔌 **No Build Required**: Works directly in browsers via CDN

### Development Server (elit-server)

- ⚡ **Hot Module Replacement (HMR)**: Instant updates without page refresh
- 🌐 **REST API Router**: Built-in routing system with regex parameters
- 🔧 **Middleware Stack**: CORS, logging, error handling, rate limiting, compression, security headers
- 🔄 **Shared State Sync**: Real-time WebSocket state synchronization
- 📊 **WebSocket Support**: Built-in WebSocket server for real-time features
- 📁 **Static File Server**: Serves your application files with MIME type detection
- 🎯 **Zero Config**: Works out of the box with sensible defaults
- 🛠️ **CLI Tool**: Simple command-line interface (`elit-dev`)
- 📦 **Lightweight**: Minimal dependencies (chokidar, ws, mime-types)

## Quick Start

### Development Server with HMR

Get started instantly with hot module replacement:

```bash
# Install Elit and dev server
npm install elit
npm install --save-dev elit-server

# Start dev server
npx elit-dev
```

Your app will automatically reload when you make changes!

### NPM Installation

```bash
npm install elit
```

```typescript
import { div, h1, p, button, createState, reactive, domNode } from 'elit';

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
domNode.render('#app', app);
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
    const { div, h1, button, createState, reactive, domNode } = window;

    const count = createState(0);
    const app = div(
      h1('Hello from CDN!'),
      reactive(count, value =>
        button({ onclick: () => count.value++ }, `Count: ${value}`)
      )
    );

    domNode.render('#app', app);
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
import { reactive, text, bindValue } from 'elit';

const message = createState('Hello');

// Reactive element - re-renders when state changes
const display = reactive(message, (value) =>
  div({ className: 'message' }, value)
);

// Reactive text
const label = text(message);

// Two-way binding for inputs
const inputEl = input({ type: 'text', ...bindValue(message) });
```

### Shared State (Real-time Sync)

**Requires `elit-server`** - Shared state syncs automatically between backend and frontend via WebSocket:

```typescript
import { createSharedState, reactive } from 'elit';

// Create shared state (auto-connects to elit-server)
const counter = createSharedState('counter', 0);
const todos = createSharedState('todos', []);

// Use with reactive rendering
const app = div(
  reactive(counter.state, value =>
    div(`Counter: ${value}`)
  ),
  button({ onclick: () => counter.value++ }, 'Increment')
);

// Listen to changes
counter.onChange((newValue, oldValue) => {
  console.log(`${oldValue} → ${newValue}`);
});

// Update from any client - syncs to all
counter.value++;
```

**Backend (Node.js with elit-server):**

```javascript
const { createDevServer } = require('elit-server');

const server = createDevServer({ port: 3000 });

// Create matching shared states
const counter = server.state.create('counter', { initial: 0 });
const todos = server.state.create('todos', { initial: [] });

// Listen to changes
counter.onChange((newValue, oldValue) => {
  console.log(`Counter: ${oldValue} → ${newValue}`);
});

// Update from backend - syncs to all clients
counter.value++;
```

### elit-server - Development Server

Full-featured development server with HMR, REST API, and real-time features:

```javascript
const { createDevServer, Router, cors, logger } = require('elit-server');

// Create REST API router
const api = new Router();

// Add middleware
api.use(cors());
api.use(logger());

// Define routes
api.get('/api/users', (ctx) => {
  return { success: true, users: [...] };
});

api.post('/api/users', (ctx) => {
  const user = ctx.body;
  return { success: true, user };
});

// Create server with API
const server = createDevServer({
  port: 3000,
  root: __dirname,
  api,
  logging: true
});

// Access shared state
const counter = server.state.create('counter', {
  initial: 0,
  validate: (value) => typeof value === 'number'
});
```

**CLI Usage:**

```bash
# Start dev server
npx elit-dev

# Custom port
npx elit-dev --port 8080

# Custom root directory
npx elit-dev --root ./public

# Disable auto-open browser
npx elit-dev --no-open

# Silent mode
npx elit-dev --silent
```

**Middleware:**

```javascript
const {
  cors,           // CORS headers
  logger,         // Request logging
  errorHandler,   // Error handling
  rateLimit,      // Rate limiting
  bodyLimit,      // Request body size limit
  cacheControl,   // Cache headers
  compress,       // Gzip compression
  security        // Security headers
} = require('elit-server');

api.use(cors({ origin: '*' }));
api.use(logger());
api.use(rateLimit({ max: 100, window: 60000 }));
api.use(bodyLimit(1024 * 1024)); // 1MB
api.use(compress());
api.use(security());
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
import { batchRender, renderChunked, createVirtualList, throttle, debounce } from 'elit';

// Batch render multiple elements
batchRender('#container', elements);

// Chunked rendering for very large lists
renderChunked('#container', largeArray, 5000, (current, total) => {
  console.log(`Rendered ${current}/${total}`);
});

// Virtual scrolling
const virtualList = createVirtualList(
  container,
  items,
  (item, index) => div(item.name),
  50, // item height
  5   // buffer size
);

// Throttle and debounce
const throttledFn = throttle(handleScroll, 100);
const debouncedFn = debounce(handleInput, 300);
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
import { setTitle, addMeta, addLink, addStyle, renderToHead } from 'elit';

setTitle('My App');
addMeta({ name: 'description', content: 'My awesome app' });
addLink({ rel: 'stylesheet', href: '/styles.css' });
addStyle('body { margin: 0; }');
```

### DOM Utilities

Elit provides convenient DOM utility functions for common operations:

```typescript
import { doc, el, els, createEl, elId, elClass, fragment } from 'elit';

// Query selectors (bound to document)
const element = el('.my-class');           // querySelector
const elements = els('.my-class');         // querySelectorAll
const byId = elId('my-id');               // getElementById
const byClass = elClass('my-class');      // getElementsByClassName

// Create elements
const div = createEl('div');              // createElement
const frag = fragment();                  // createDocumentFragment

// Access document object
doc.title = 'New Title';
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

Elit is designed to be extremely lightweight while providing powerful features:

| Format | Size (Minified) | Size (Gzipped) |
|--------|----------------|----------------|
| ESM    | 29KB          | ~10KB          |
| CJS    | 30KB          | ~10KB          |
| IIFE   | 30KB          | ~10KB          |

**Tree-shaking**: When using ES modules, only the features you import will be included in your bundle.

**Performance Optimizations**:
- Direct DOM manipulation (no virtual DOM diffing)
- Optimized rendering with RAF batching
- Smart children rendering with automatic fragment usage
- Efficient attribute updates using charCode checks
- Minimal function closures and memory allocation

## Browser Usage

When loaded via script tag, all exports are available on the `window` object:

```html
<script src="https://unpkg.com/elit@latest/dist/index.global.js"></script>
<script>
  const { div, span, createState, domNode } = window;
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

## Comparison with Other Libraries

| Feature | Elit | React | Vue | Svelte |
|---------|------|-------|-----|--------|
| Bundle Size (min) | 30KB | ~140KB | ~90KB | ~15KB* |
| Zero Dependencies | ✅ | ❌ | ❌ | ✅ |
| Virtual DOM | ❌ | ✅ | ✅ | ❌ |
| TypeScript First | ✅ | ✅ | ✅ | ✅ |
| Built-in Router | ✅ | ❌ | ❌ | ❌ |
| Built-in State | ✅ | ❌ | ✅ | ✅ |
| SSR Support | ✅ | ✅ | ✅ | ✅ |
| Learning Curve | Easy | Medium | Medium | Easy |

*Svelte requires compilation

## Packages

This monorepo contains two packages:

### elit
[![npm version](https://img.shields.io/npm/v/elit.svg)](https://www.npmjs.com/package/elit)

The core library for building reactive web applications.

```bash
npm install elit
```

### elit-server
[![npm version](https://img.shields.io/npm/v/elit-server.svg)](https://www.npmjs.com/package/elit-server)

Development server with HMR, REST API, and real-time state synchronization.

```bash
npm install --save-dev elit-server
```

[View elit-server documentation →](./server/README.md)

## Documentation

- 📚 [Documentation Hub](./docs/README.md)
- ⚡ [Quick Start Guide](./docs/QUICK_START.md) - Get started in 5 minutes
- 📖 [API Reference](./docs/API.md) - Complete API documentation
- ⚖️ [Comparison Guide](./docs/COMPARISON.md) - Compare with React, Vue, Svelte
- 🔄 [Migration Guide](./docs/MIGRATION.md) - Migrate from other frameworks
- 🤝 [Contributing Guide](./CONTRIBUTING.md) - Contribute to Elit

## Changelog

### elit v0.1.0

**Core Library:**
- 🎉 Initial release
- ⚡ Optimized bundle size (50% reduction from initial builds - 30KB minified)
- 🚀 Full TypeScript support with complete type definitions
- 🎨 Complete CSS-in-JS with CreateStyle
- 🛣️ Client-side router with navigation guards
- 📦 Tree-shakeable ES modules
- 🎭 100+ HTML, SVG, and MathML elements
- 🔧 Performance utilities (throttle, debounce, virtual scrolling)
- 🖥️ SSR capabilities with renderToString
- 🎮 DOM utility functions
- 🌐 Shared state integration with elit-server

**New Package - elit-server v0.1.0:**
- ⚡ Hot Module Replacement (HMR) with WebSocket
- 🌐 REST API router with regex-based parameters
- 🔧 Middleware stack (CORS, logging, error handling, rate limiting, compression, security)
- 🔄 Real-time shared state synchronization
- 📊 Built-in WebSocket server
- 📁 Static file server with MIME type detection
- 🛠️ CLI tool (`elit-dev`)
- 🎯 Zero-config with sensible defaults

## Examples

Check out the example applications in the repository:

- **[HMR Example](./server/example/hmr-example.html)** - Hot Module Replacement demo
- **[REST API Example](./server/example/api-example.js)** - Full REST API with todos
- **[Shared State (Vanilla)](./server/example/state-demo.html)** - Real-time state sync without Elit
- **[Shared State (Elit)](./server/example/elit-state-demo.html)** - Real-time state with Elit reactive system
- **[Todo App](./examples)** - Complete todo application (coming soon)

[View all examples →](./server/example/README.md)

## Links

- 📦 [npm - elit](https://www.npmjs.com/package/elit)
- 📦 [npm - elit-server](https://www.npmjs.com/package/elit-server)
- 🐙 [GitHub Repository](https://github.com/oangsa/elit)
- 📚 Documentation (coming soon)
- 💬 Discord Community (coming soon)

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
