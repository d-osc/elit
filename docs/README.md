# Elit Documentation

Welcome to the Elit documentation! 📚

## Getting Started

- **[Quick Start Guide](./QUICK_START.md)** - Get up and running in 5 minutes
- **[API Reference](./API.md)** - Complete API documentation
- **[Comparison Guide](./COMPARISON.md)** - Compare Elit with React, Vue, Svelte
- **[Migration Guide](./MIGRATION.md)** - Migrate from other frameworks
- **[Examples](../server/example/)** - Real-world examples and demos

## Packages

### elit
The core library for building reactive web applications.

- [Installation & Usage](../README.md#installation)
- [API Reference](./API.md)
- [Bundle: ~10KB gzipped](https://bundlephobia.com/package/elit)

### elit-server
Development server with HMR, REST API, and real-time features.

- [elit-server Documentation](../server/README.md)
- [Examples](../server/example/README.md)

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

9. **[elit-server Integration](./guides/server.md)** *(coming soon)*
   - HMR setup
   - REST API
   - Middleware
   - WebSocket

## Examples

### Basic Examples
- [Counter](../server/example/hmr-example.html) - Simple reactive counter
- [Todo App](./examples/todo.md) *(coming soon)* - Full CRUD application
- [Form Handling](./examples/forms.md) *(coming soon)* - Input validation and submission

### Advanced Examples
- [Real-time Chat](../server/example/state-demo.html) - WebSocket chat with shared state
- [Virtual Scrolling](./examples/virtual-list.md) *(coming soon)* - 100k+ items
- [Router SPA](./examples/router-spa.md) *(coming soon)* - Single Page Application

### Integration Examples
- [REST API](../server/example/api-example.js) - Full REST API with elit-server
- [SSR](./examples/ssr.md) *(coming soon)* - Server-side rendering
- [TypeScript](./examples/typescript.md) *(coming soon)* - Full type safety

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
- 📦 [npm - elit-server](https://www.npmjs.com/package/elit-server)
- 🐙 [GitHub Repository](https://github.com/oangsa/elit)
- 🐛 [Issue Tracker](https://github.com/oangsa/elit/issues)
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

**Need help?** Open an [issue](https://github.com/oangsa/elit/issues) or start a [discussion](https://github.com/oangsa/elit/discussions)!
