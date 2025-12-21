# Using External Libraries with Elit Dev Server

Elit dev server now supports **bare imports** for external libraries from `node_modules`. This means you can use libraries just like in modern build tools like Vite!

## Features

- ✅ **Auto-detection**: Automatically scans `node_modules` and generates import maps
- ✅ **Package.json exports**: Supports modern `exports` field
- ✅ **Legacy support**: Falls back to `module`, `browser`, and `main` fields
- ✅ **Scoped packages**: Works with `@org/package` packages
- ✅ **Subpath imports**: Supports importing from subpaths like `react/jsx-runtime`
- ✅ **Caching**: Import maps are cached for performance

## How It Works

When you start the dev server, Elit automatically:

1. Scans your `node_modules` directory
2. Reads each package's `package.json`
3. Generates import maps based on the `exports` field (or `module`/`main` as fallback)
4. Injects the import map into your HTML files

## Usage

### 1. Install a library

```bash
npm install your-favorite-library
```

### 2. Import it in your code

```typescript
// Before: Had to use full paths
// import something from '/node_modules/lib/dist/index.js'

// Now: Use bare imports!
import something from 'your-favorite-library'
```

### 3. That's it!

The dev server will automatically resolve the import and serve the correct file.

## Example

### Install a library

```bash
npm install @preact/signals-core
```

### Use it in your code

```typescript
// src/app.ts
import { signal, computed } from '@preact/signals-core'

const count = signal(0)
const doubled = computed(() => count.value * 2)

console.log(doubled.value) // 0
count.value = 5
console.log(doubled.value) // 10
```

### HTML file

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>External Library Example</title>
</head>
<body>
  <h1>Check the console!</h1>
  <script type="module" src="./app.ts"></script>
</body>
</html>
```

The dev server will automatically inject the import map:

```html
<script type="importmap">{
  "imports": {
    "@preact/signals-core": "/node_modules/@preact/signals-core/dist/signals-core.mjs",
    "@preact/signals-core/": "/node_modules/@preact/signals-core/",
    "elit": "/node_modules/elit/src/index.ts",
    "elit/": "/node_modules/elit/src/",
    ...
  }
}</script>
```

## Supported Package Formats

### Modern packages with `exports` field

```json
{
  "name": "modern-lib",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./utils": {
      "import": "./dist/utils.mjs"
    }
  }
}
```

Usage:
```typescript
import lib from 'modern-lib'
import { helper } from 'modern-lib/utils'
```

### Legacy packages

```json
{
  "name": "legacy-lib",
  "main": "index.js",
  "module": "dist/index.esm.js"
}
```

Usage:
```typescript
import lib from 'legacy-lib'
```

## Common Libraries Examples

### Preact Signals

```bash
npm install @preact/signals-core
```

```typescript
import { signal, computed, effect } from '@preact/signals-core'
```

### Day.js

```bash
npm install dayjs
```

```typescript
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
console.log(dayjs().fromNow())
```

### Lodash-es

```bash
npm install lodash-es
```

```typescript
import { debounce, throttle } from 'lodash-es'
```

## Limitations

### Libraries that require bundling

Some libraries might not work out-of-the-box if they:
- Use Node.js-specific APIs (like `fs`, `path`, etc.)
- Require complex build transformations
- Have circular dependencies that break in unbundled scenarios

### TypeScript types

TypeScript will work automatically if the library has:
- `types` or `typings` field in package.json
- `@types/library` package installed

## Debugging

### Check generated import map

Open your browser DevTools and look for the `<script type="importmap">` tag in your HTML to see what imports are available.

### Enable logging

The dev server logs import map generation:

```
[Import Maps] Error scanning node_modules: <error>
```

### Cache issues

If you update a package and imports don't work, the import map cache might be stale. Restart the dev server to regenerate the import map.

## How It Differs from Build Tools

Unlike bundlers like Vite or webpack, Elit dev server:
- **Doesn't bundle**: Each module is served as-is
- **No transformation**: Libraries must already be in browser-compatible ESM format
- **Import maps only**: Uses native browser import maps for resolution

This is faster for development but means some libraries might need adjustment.

## Need More Control?

If you need more control over import resolution, you can:

1. Create a custom import map in your HTML
2. Use a bundler for production builds
3. Fork and modify libraries that don't work

## Future Improvements

Planned features:
- [ ] Manual import map configuration
- [ ] CDN fallback for missing packages
- [ ] Better error messages for incompatible packages
- [ ] Import map preloading for faster startup
