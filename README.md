# Elit

A lightweight, zero-dependency library for building reactive web applications with direct DOM manipulation.

[![npm version](https://img.shields.io/npm/v/elit.svg)](https://www.npmjs.com/package/elit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why Elit?

- **Tiny Bundle Size**: ~5KB gzipped - no framework bloat
- **Zero Dependencies**: Pure TypeScript, no external dependencies
- **Direct DOM Manipulation**: No virtual DOM overhead
- **TypeScript First**: Full type safety out of the box
- **Reactive State**: Simple but powerful reactive state management
- **Modern Features**: Router, SSR, virtual scrolling, and more

## Installation

```bash
npm install elit
```

## Features

- 🎯 **Lightweight**: Optimized for performance and small bundle size
- ⚡ **Reactive State**: Built-in reactive state management with `createState`
- 🔄 **Computed Values**: Automatic dependency tracking with `computed`
- 🎨 **CSS-in-JS**: Type-safe styling with `CreateStyle`
- 🛣️ **Client-Side Router**: Hash and history mode routing with dynamic parameters
- 📱 **Virtual Scrolling**: Handle 100k+ items efficiently
- 🖥️ **SSR Support**: Server-side rendering capabilities
- 🎭 **SVG & MathML**: Full support for SVG and MathML elements
- 🔧 **Utilities**: Throttle, debounce, and batch rendering
- 📦 **Tree-shakeable**: Import only what you need

## Quick Start

```typescript
import { div, h1, p, button, createState, reactive, domNode } from 'elit';

// Create reactive state
const count = createState(0);

// Create elements
const app = div({ className: 'app' },
  h1('Hello Elit!'),
  p('A lightweight DOM library'),
  reactive(count, (value) =>
    button({ onclick: () => count.value++ }, `Count: ${value}`)
  )
);

// Render to DOM
domNode.render('#app', app);
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

## Browser Usage

When loaded via script tag, all exports are available on the `window` object:

```html
<script src="https://unpkg.com/elit@latest/dist/index.global.js"></script>
<script>
  const { div, span, createState, domNode } = window;
  // or use DomLib global
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

## Documentation

For detailed documentation, examples, and guides, visit the official documentation (coming soon).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
