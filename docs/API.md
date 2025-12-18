# Elit API Reference

Complete API documentation for Elit library.

## Table of Contents

- [DomNode Core](#domnode-core)
- [Elements](#elements)
- [State Management](#state-management)
- [Reactive Rendering](#reactive-rendering)
- [Router](#router)
- [Shared State](#shared-state)
- [CSS-in-JS](#css-in-js)
- [Performance](#performance)
- [SSR & Rendering](#ssr--rendering)
- [JSON Rendering](#json-rendering)
- [DOM Utilities](#dom-utilities)
- [Head Management](#head-management)
- [Browser Global](#browser-global)

---

## DomNode Core

The core rendering engine of Elit.

### dom

Main API for rendering VNodes to the DOM.

```typescript
const dom: {
  render(selector: string | HTMLElement, vnode: VNode): void;
  renderToString(vnode: VNode, options?: RenderOptions): string;
  renderToHead(...vnodes: VNode[]): HTMLHeadElement | null;
  addStyle(css: string): HTMLStyleElement;
  addMeta(attrs: Record<string, string>): HTMLMetaElement;
  addLink(attrs: Record<string, string>): HTMLLinkElement;
  setTitle(text: string): string;
  // JSON rendering methods
  jsonToVNode(json: JsonNode): Child;
  renderJson(container: string | HTMLElement, json: JsonNode): HTMLElement;
  renderJsonToString(json: JsonNode, options?: RenderOptions): string;
  // VNode JSON rendering methods
  vNodeJsonToVNode(json: VNodeJson): Child;
  renderVNode(container: string | HTMLElement, json: VNodeJson): HTMLElement;
  renderVNodeToString(json: VNodeJson, options?: RenderOptions): string;
}
```

**Basic Usage:**

```javascript
import { dom, div, h1 } from 'elit';

// Render to DOM
dom.render('#app', div(h1('Hello World')));

// Render to string (SSR)
const html = dom.renderToString(div(h1('Hello World')));
```

---

## Elements

### Element Factory Functions

Every HTML element has a corresponding factory function:

```typescript
function div(props?: Props, ...children: Children[]): VNode
function span(props?: Props, ...children: Children[]): VNode
function button(props?: Props, ...children: Children[]): VNode
// ... 100+ elements
```

**Parameters:**
- `props` (optional): Element properties (attributes, events, styles)
- `children`: Child elements (strings, numbers, VNodes, or arrays)

**Returns:** VNode object

**Example:**
```typescript
const element = div(
  { className: 'container', id: 'main' },
  h1('Title'),
  p('Content'),
  button({ onclick: () => alert('Clicked') }, 'Click me')
);
```

### Props Interface

```typescript
interface Props {
  // Standard HTML attributes
  className?: string;
  id?: string;
  style?: string | Partial<CSSStyleDeclaration>;

  // Event handlers
  onclick?: (e: MouseEvent) => void;
  oninput?: (e: InputEvent) => void;
  onchange?: (e: Event) => void;
  // ... all DOM events

  // Custom attributes
  [key: string]: any;
}
```

---

## State Management

### createState

Creates a reactive state container.

```typescript
function createState<T>(
  initialValue: T,
  options?: StateOptions
): State<T>
```

**Parameters:**
- `initialValue`: Initial state value
- `options` (optional): State configuration

**Returns:** State object

**StateOptions:**
```typescript
interface StateOptions {
  throttle?: number;    // Throttle updates (ms)
  deep?: boolean;       // Deep reactivity for objects
}
```

**State Interface:**
```typescript
interface State<T> {
  value: T;                                    // Get/set value
  subscribe(callback: (value: T) => void): () => void;  // Subscribe to changes
  destroy(): void;                             // Cleanup
}
```

**Example:**
```typescript
const count = createState(0);
const throttled = createState(0, { throttle: 100 });
const deep = createState({ nested: { value: 1 } }, { deep: true });

// Subscribe to changes
const unsubscribe = count.subscribe((value) => {
  console.log('Count:', value);
});

// Update value
count.value++;

// Cleanup
unsubscribe();
count.destroy();
```

### computed

Creates a computed value from one or more states.

```typescript
function computed<T, D extends State<any>[]>(
  dependencies: D,
  computeFn: (...values: any[]) => T
): State<T>
```

**Example:**
```typescript
const count = createState(10);
const doubled = computed([count], (c) => c * 2);
const sum = computed([count, doubled], (c, d) => c + d);

console.log(doubled.value); // 20
console.log(sum.value);     // 30
```

### effect

Runs a side effect when dependencies change.

```typescript
function effect(
  dependencies: State<any>[],
  effectFn: (...values: any[]) => void | (() => void)
): () => void
```

**Example:**
```typescript
const count = createState(0);

const cleanup = effect([count], (value) => {
  console.log('Count changed:', value);

  // Optional cleanup function
  return () => {
    console.log('Cleaning up');
  };
});

// Stop effect
cleanup();
```

---

## Reactive Rendering

### reactive

Creates a reactive element that re-renders when state changes.

```typescript
function reactive<T>(
  state: State<T>,
  renderFn: (value: T) => VNode | string | number
): VNode
```

**Example:**
```typescript
const count = createState(0);

const counter = reactive(count, (value) =>
  div({ className: 'counter' },
    h1(`Count: ${value}`),
    button({ onclick: () => count.value++ }, '+')
  )
);
```

### reactiveAs

Similar to `reactive`, but renders as a specific element type.

```typescript
function reactiveAs<T>(
  tagName: string,
  state: State<T>,
  renderFn: (value: T) => Children
): VNode
```

**Example:**
```typescript
const message = createState('Hello');

const display = reactiveAs('p', message, (msg) => msg);
```

### text

Creates reactive text node.

```typescript
function text<T>(state: State<T>): VNode
```

**Example:**
```typescript
const name = createState('World');
const greeting = div('Hello, ', text(name), '!');
```

### bindValue

Two-way binding for input elements.

```typescript
function bindValue<T extends string | number>(
  state: State<T>
): { value: T; oninput: (e: InputEvent) => void }
```

**Example:**
```typescript
const name = createState('');
const input = input({ type: 'text', ...bindValue(name) });
```

### bindChecked

Two-way binding for checkboxes.

```typescript
function bindChecked(
  state: State<boolean>
): { checked: boolean; onchange: (e: Event) => void }
```

**Example:**
```typescript
const agreed = createState(false);
const checkbox = input({ type: 'checkbox', ...bindChecked(agreed) });
```

---

## Router

### createRouter

Creates a client-side router.

```typescript
function createRouter(config: RouterConfig): Router
```

**RouterConfig:**
```typescript
interface RouterConfig {
  mode?: 'hash' | 'history';        // Routing mode (default: 'hash')
  routes: Route[];                   // Route definitions
  notFound?: () => VNode;           // 404 handler
  beforeEach?: NavigationGuard;     // Global navigation guard
}

interface Route {
  path: string;                      // Route pattern (/user/:id)
  component: (params: Record<string, string>) => VNode;
}

type NavigationGuard = (
  to: string,
  from: string,
  next: () => void
) => void;
```

**Router Interface:**
```typescript
interface Router {
  navigate(path: string): void;      // Navigate to path
  back(): void;                      // Go back
  forward(): void;                   // Go forward
  getCurrentPath(): string;          // Get current path
  onRouteChange(callback: (path: string) => void): () => void;
}
```

**Example:**
```typescript
const router = createRouter({
  mode: 'history',
  routes: [
    { path: '/', component: () => div('Home') },
    { path: '/about', component: () => div('About') },
    { path: '/user/:id', component: (params) => div(`User ${params.id}`) }
  ],
  notFound: () => div('404 Not Found'),
  beforeEach: (to, from, next) => {
    console.log(`${from} → ${to}`);
    next();
  }
});

router.navigate('/user/123');
```

### createRouterView

Creates a view that renders the current route.

```typescript
function createRouterView(router: Router): VNode
```

### routerLink

Creates a navigation link.

```typescript
function routerLink(
  router: Router,
  props: Props & { to: string },
  ...children: Children[]
): VNode
```

**Example:**
```typescript
const link = routerLink(router, { to: '/about' }, 'About Page');
```

---

## Shared State

**Requires elit-server**

### createSharedState

Creates a state that syncs with the server.

```typescript
function createSharedState<T>(
  key: string,
  initialValue: T,
  wsUrl?: string
): SharedState<T>
```

**SharedState Interface:**
```typescript
interface SharedState<T> {
  value: T;                          // Get/set value
  state: State<T>;                   // Underlying State (for reactive)
  onChange(callback: (newValue: T, oldValue: T) => void): () => void;
  update(updater: (current: T) => T): void;
  disconnect(): void;
  destroy(): void;
}
```

**Example:**
```typescript
const counter = createSharedState('counter', 0);

// Use with reactive
const display = reactive(counter.state, (value) =>
  div(`Counter: ${value}`)
);

// Update value (syncs to server and all clients)
counter.value++;

// Listen to changes
counter.onChange((newVal, oldVal) => {
  console.log(`${oldVal} → ${newVal}`);
});
```

---

## CSS-in-JS

### CreateStyle

Type-safe CSS-in-JS styling system.

```typescript
class CreateStyle {
  class(name: string, styles: CSSProperties): string;
  id(name: string, styles: CSSProperties): string;
  tag(name: string, styles: CSSProperties): void;
  keyframes(name: string, frames: Record<string, CSSProperties>): string;
  media(query: string, styles: Record<string, CSSProperties>): void;
  variable(name: string, value: string): void;
  getCSS(): string;
}
```

**Example:**
```typescript
const styles = new CreateStyle();

const button = styles.class('button', {
  padding: '10px 20px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '#0056b3'
  },
  '&:active': {
    transform: 'scale(0.98)'
  }
});

const fadeIn = styles.keyframes('fadeIn', {
  '0%': { opacity: 0 },
  '100%': { opacity: 1 }
});

const animated = styles.class('animated', {
  animation: `${fadeIn} 0.3s ease-in`
});
```

---

## Performance

### batchRender

Batch render multiple elements at once.

```typescript
function batchRender(
  container: string | HTMLElement,
  elements: VNode[]
): void
```

### renderChunked

Render large arrays in chunks to prevent UI blocking.

```typescript
function renderChunked(
  container: string | HTMLElement,
  elements: VNode[],
  chunkSize: number,
  onProgress?: (current: number, total: number) => void
): Promise<void>
```

**Example:**
```typescript
const items = Array.from({ length: 10000 }, (_, i) =>
  div({ key: i }, `Item ${i}`)
);

await renderChunked('#container', items, 100, (current, total) => {
  console.log(`${current}/${total}`);
});
```

### createVirtualList

Creates a virtual scrolling list for large datasets.

```typescript
function createVirtualList<T>(
  container: HTMLElement,
  items: T[],
  renderItem: (item: T, index: number) => VNode,
  itemHeight: number,
  bufferSize?: number
): VirtualList
```

**Example:**
```typescript
const items = Array.from({ length: 100000 }, (_, i) => ({
  id: i,
  name: `Item ${i}`
}));

const virtualList = createVirtualList(
  document.getElementById('list')!,
  items,
  (item) => div({ key: item.id }, item.name),
  50,  // item height
  5    // buffer size
);
```

### throttle / debounce

```typescript
function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T

function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T
```

### lazy

Lazy load state values.

```typescript
function lazy<T>(
  loadFn: () => Promise<T>,
  placeholder?: T
): State<T>
```

### cleanupUnused

Cleanup unused state subscriptions.

```typescript
function cleanupUnused(): void
```

---

## SSR & Rendering

### renderToString

Renders VNode to HTML string (Server-Side Rendering).

```typescript
function renderToString(
  vnode: VNode,
  options?: { pretty?: boolean; indent?: number }
): string
```

**Example:**
```typescript
import { renderToString, div, h1, p } from 'elit';

const html = renderToString(
  div({ className: 'app' },
    h1('Hello SSR'),
    p('Server-side rendered content')
  ),
  { pretty: true, indent: 2 }
);

// Output:
// <div class="app">
//   <h1>Hello SSR</h1>
//   <p>Server-side rendered content</p>
// </div>
```

---

## JSON Rendering

Elit supports rendering from JSON structures for dynamic content generation.

### jsonToVNode

Convert JSON to VNode.

```typescript
function jsonToVNode(json: JsonNode): Child
```

**JsonNode Structure:**
```typescript
interface JsonNode {
  tag: string;
  attributes?: Record<string, any>;
  children?: (string | JsonNode)[];
}
```

### renderJson

Render JSON structure to DOM.

```typescript
function renderJson(
  container: string | HTMLElement,
  json: JsonNode
): HTMLElement
```

**Example:**
```typescript
import { renderJson } from 'elit';

renderJson('#app', {
  tag: 'div',
  attributes: { class: 'container' },
  children: [
    { tag: 'h1', children: ['Title'] },
    { tag: 'p', children: ['Content'] }
  ]
});
```

### renderJsonToString

Render JSON to HTML string.

```typescript
function renderJsonToString(
  json: JsonNode,
  options?: { pretty?: boolean; indent?: number }
): string
```

### vNodeJsonToVNode

Convert VNode JSON format to VNode.

```typescript
function vNodeJsonToVNode(json: VNodeJson): Child
```

**VNodeJson Structure:**
```typescript
interface VNodeJson {
  tagName: string;
  props?: Record<string, any>;
  children?: (string | number | VNodeJson)[];
}
```

### renderVNode

Render VNode JSON to DOM.

```typescript
function renderVNode(
  container: string | HTMLElement,
  json: VNodeJson
): HTMLElement
```

**Example:**
```typescript
import { renderVNode } from 'elit';

renderVNode('#app', {
  tagName: 'div',
  props: { className: 'container' },
  children: [
    { tagName: 'h1', children: ['Title'] }
  ]
});
```

### renderVNodeToString

Render VNode JSON to HTML string.

```typescript
function renderVNodeToString(
  json: VNodeJson,
  options?: { pretty?: boolean; indent?: number }
): string
```

---

## Head Management

Utilities for managing `<head>` content.

### renderToHead

Render VNodes to document head.

```typescript
function renderToHead(...vnodes: VNode[]): HTMLHeadElement | null
```

### addStyle

Add inline styles to document head.

```typescript
function addStyle(css: string): HTMLStyleElement
```

**Example:**
```typescript
import { addStyle } from 'elit';

addStyle(`
  body { margin: 0; padding: 0; }
  .container { max-width: 1200px; margin: 0 auto; }
`);
```

### addMeta

Add meta tag to document head.

```typescript
function addMeta(attrs: Record<string, string>): HTMLMetaElement
```

**Example:**
```typescript
import { addMeta } from 'elit';

addMeta({ name: 'description', content: 'My awesome app' });
addMeta({ property: 'og:title', content: 'My App' });
```

### addLink

Add link tag to document head.

```typescript
function addLink(attrs: Record<string, string>): HTMLLinkElement
```

**Example:**
```typescript
import { addLink } from 'elit';

addLink({ rel: 'stylesheet', href: '/styles.css' });
addLink({ rel: 'icon', type: 'image/png', href: '/favicon.png' });
```

### setTitle

Set document title.

```typescript
function setTitle(text: string): string
```

**Example:**
```typescript
import { setTitle } from 'elit';

setTitle('My Elit App');
```

---

## DOM Utilities

Helper functions for DOM manipulation exported from `./dom`.

### Query Selectors

```typescript
// Get single element
const el = (selector: string): Element | null;

// Get all elements
const els = (selector: string): NodeListOf<Element>;

// Get by ID
const elId = (id: string): HTMLElement | null;

// Get by class name
const elClass = (className: string): HTMLCollectionOf<Element>;
```

**Example:**
```typescript
import { el, els, elId, elClass } from 'elit';

const container = el('.container');
const buttons = els('button');
const app = elId('app');
const cards = elClass('card');
```

### Element Creation

```typescript
// Create element
const createEl = (tagName: string): HTMLElement;

// Create document fragment
const fragment = (): DocumentFragment;
```

**Example:**
```typescript
import { createEl, fragment } from 'elit';

const div = createEl('div');
const frag = fragment();
```

### Document Access

```typescript
const doc: Document;  // Global document object
```

---

## Browser Global

When loaded via `<script>` tag or CDN, all exports are available on `window`:

```html
<script src="https://unpkg.com/elit@latest/dist/index.global.js"></script>
<script>
  const { div, h1, button, createState, reactive, dom } = window;

  const count = createState(0);

  const app = div(
    reactive(count, value => h1(`Count: ${value}`)),
    button({ onclick: () => count.value++ }, '+')
  );

  dom.render('#app', app);
</script>
```

**Available globals:**
- All element factories: `div`, `span`, `button`, etc.
- State management: `createState`, `computed`, `effect`
- Shared state: `createSharedState`, `sharedStateManager`
- Reactive helpers: `reactive`, `reactiveAs`, `text`, `bindValue`, `bindChecked`
- Performance: `batchRender`, `renderChunked`, `createVirtualList`, `throttle`, `debounce`
- Rendering: `renderToString`, `renderJson`, `renderVNode`
- Router: `createRouter`, `createRouterView`, `routerLink`
- Styling: `CreateStyle`
- DOM utilities: `el`, `els`, `elId`, `elClass`, `createEl`, `fragment`, `doc`
- Core: `dom`, `createElementFactory`

---

## TypeScript Types

Elit provides full TypeScript support with exported types:

```typescript
import type {
  VNode,           // Virtual DOM node
  Child,           // Valid child type
  Children,        // Multiple children
  Props,           // Element properties
  RefCallback,     // Ref callback function
  RefObject,       // Ref object
  State,           // State interface
  StateOptions,    // State configuration
  VirtualListController,  // Virtual list controller
  JsonNode,        // JSON node structure
  VNodeJson,       // VNode JSON structure
  ElementFactory   // Element factory function type
} from 'elit';
```

---

For more examples and guides, see:
- [Quick Start Guide](./QUICK_START.md)
- [Examples Directory](../server/example/)
- [Migration Guide](./MIGRATION.md)
