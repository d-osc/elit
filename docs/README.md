# Elit Documentation

Welcome to the Elit documentation! 📚

## Getting Started

- **[Quick Start Guide](./QUICK_START.md)** - Get up and running in 5 minutes
- **[Native CSS Support](./native-css-support.md)** - Current Compose, SwiftUI, and desktop native CSS subset, limits, and priority backlog
- **[WAPK Guide](./wapk.md)** - Package, inspect, run, and sync `.wapk` archives
- **[API Reference](./API.md)** - Complete API documentation
- **[Comparison Guide](./COMPARISON.md)** - Compare Elit with React, Vue, Svelte
- **[Migration Guide](./MIGRATION.md)** - Migrate from other frameworks
- **[Examples](../examples/)** - Real-world examples and demos

## Packages

### elit
The core library for building reactive web applications.

- [Installation & Usage](../README.md#installation)
- [API Reference](./API.md)
- [Bundle: ~10KB gzipped](https://bundlephobia.com/package/elit)

### elit/server
Development server, routing, middleware, and shared real-time state shipped in the main package.

- [API Reference](./API.md)
- [Quick Start Guide](./QUICK_START.md)
- [Examples](../examples/)

## Guides

### Core Concepts

1. **[Elements & VNodes](./guides/elements.md)** *(coming soon)*
   - Creating elements
   - Props and children
   - VNode structure

2. **[Reactive State](./guides/state.md)** *(coming soon)*
   - createState
   - computed values
   - effects and subscriptions

3. **[Reactive Rendering](./guides/reactive.md)** *(coming soon)*
   - reactive()
   - Two-way binding
   - Performance optimization

4. **[Routing](./guides/routing.md)** *(coming soon)*
   - Setting up routes
   - Navigation guards
   - Route parameters

5. **[Shared State](./guides/shared-state.md)** *(coming soon)*
   - Real-time synchronization
   - Backend integration
   - Multi-client sync

### Advanced Topics

6. **[CSS-in-JS](./guides/styling.md)** *(coming soon)*
   - CreateStyle API
   - Pseudo-classes
   - Media queries
   - Animations

7. **[Performance](./guides/performance.md)** *(coming soon)*
   - Virtual scrolling
   - Batch rendering
   - Chunked rendering
   - Throttling & debouncing

8. **[Server-Side Rendering](./guides/ssr.md)** *(coming soon)*
   - renderToString
   - Hydration
   - SEO optimization

9. **[Server Integration](./guides/server.md)** *(coming soon)*
   - HMR setup
   - REST API
   - Middleware
   - WebSocket

## Examples

### Project Examples
- [Correct Config](../examples/correct-config/) - Config-driven web, server, and build defaults
- [Full Database App](../examples/full-db/) - Full-stack example with database helpers and API routes
- [Universal App](../examples/universal-app-example/) - Shared web, desktop, and native entry flow

### Platform Examples
- [Desktop Entry](../examples/desktop-example.ts) - Minimal desktop mode example
- [Android Native Example](../examples/android-native-example/) - Native Android workflow from Elit UI
- [WAPK Example](../examples/wapk-example/) - Archive packaging and runtime flow

### Utility Examples
- [Path Utilities](../examples/path-example.ts) - Path helpers and normalization examples
- [WebSocket Server](../examples/wss-example.ts) - Native WebSocket server usage
- [Chokidar](../examples/chokidar-example.ts) - File watching integration

## API Reference

### Core
- [Elements](./API.md#elements) - Element factory functions
- [State](./API.md#state-management) - Reactive state management
- [Reactive](./API.md#reactive-rendering) - Reactive rendering
- [Router](./API.md#router) - Client-side routing

### Advanced
- [Shared State](./API.md#shared-state) - Real-time state sync
- [CSS-in-JS](./API.md#css-in-js) - Styling system
- [Performance](./API.md#performance) - Performance utilities
- [SSR](./API.md#ssr) - Server-side rendering
- [DOM Utils](./API.md#dom-utilities) - DOM helper functions

## Contributing

Want to contribute? Check out the [Contributing Guide](../CONTRIBUTING.md)!

## Community

- 📦 [npm - elit](https://www.npmjs.com/package/elit)
- 🐙 [GitHub Repository](https://github.com/d-osc/elit)
- 🐛 [Issue Tracker](https://github.com/d-osc/elit/issues)
- 💬 Discord Community *(coming soon)*

## Resources

### Comparison & Motivation
- [Why Elit?](../README.md#why-elit)
- [Comparison with Other Libraries](../README.md#comparison-with-other-libraries)
- [Bundle Size & Performance](../README.md#bundle-size--performance)

### Recipes
- [Common Patterns](./QUICK_START.md#common-patterns) - Reusable code patterns
- [Tips & Best Practices](./QUICK_START.md#tips--best-practices)

## Version History

See [CHANGELOG](../README.md#changelog) for version history and updates.

## License

Elit is [MIT licensed](../LICENSE).

---

**Need help?** Open an [issue](https://github.com/d-osc/elit/issues) or start a [discussion](https://github.com/d-osc/elit/discussions)!
