# Elit Subpath Exports

Elit now supports modular imports using subpath exports. You can import only what you need from specific modules.

## Bundle Sizes (Gzipped)

**Main bundle:** ~9.6 KB (includes everything)

**Individual modules:**
- `elit/dom` - ~3.2 KB (DOM core)
- `elit/el` - ~2.8 KB (Element factories)
- `elit/state` - ~4.5 KB (State management & reactive)
- `elit/style` - ~1.9 KB (CSS-in-JS)
- `elit/router` - ~4.0 KB (Router)

**Optimizations:**
- Terser minification for smaller bundle size
- Tree-shaking with `preset: 'smallest'`
- ES2020 target for modern syntax
- Simplified index.ts (6 lines instead of 211)

## Available Subpaths

- `elit` - Main entry point (all exports)
- `elit/dom` - DOM rendering core
- `elit/el` - Element factories
- `elit/router` - Router functionality
- `elit/state` - State management & reactive helpers
- `elit/style` - CSS-in-JS styling

## Usage Examples

### Import from main entry (everything)
```typescript
import { div, createState, reactive, domNode } from 'elit';
```

### Import only DOM core
```typescript
import { DomNode, domNode } from 'elit/dom';
```

### Import only element factories
```typescript
import { div, span, button, h1, input } from 'elit/el';
```

### Import only router
```typescript
import { createRouter, createRouterView, routerLink } from 'elit/router';
```

### Import only state management
```typescript
import {
  createState,
  computed,
  effect,
  reactive,
  createSharedState
} from 'elit/state';
```

### Import only styling
```typescript
import { CreateStyle } from 'elit/style';
```

## Mix and Match

You can import from multiple subpaths as needed:

```typescript
import { div, button } from 'elit/el';
import { createState, reactive } from 'elit/state';
import { domNode } from 'elit/dom';

const count = createState(0);

const app = div(
  reactive(count, value =>
    button({ onclick: () => count.value++ }, `Clicked ${value} times`)
  )
);

domNode.render('#app', app);
```

## Benefits

1. **Tree-shaking**: Only import what you need
2. **Better organization**: Clear separation of concerns
3. **Smaller bundles**: Reduce bundle size by importing specific modules
4. **Type safety**: Full TypeScript support for all subpaths
