# Elit Documentation

Welcome to the Elit documentation.

## Start Here

- [QUICK_START.md](./QUICK_START.md) - Fastest path to a working Elit app
- [API.md](./API.md) - Core API reference for DOM, state, router, server, and config APIs
- [CONFIG.md](./CONFIG.md) - Config file reference for dev, preview, build, desktop, mobile, pm, and WAPK
- [CLI.md](./CLI.md) - Current CLI command reference
- [server.md](./server.md) - Routing, middleware, shared state, and config-driven WebSocket endpoints
- [native-css-support.md](./native-css-support.md) - Native CSS support matrix and current gaps
- [wapk.md](./wapk.md) - WAPK packaging, locking, inspection, and runtime sync
- [COMPARISON.md](./COMPARISON.md) - Compare Elit with React, Vue, and Svelte
- [MIGRATION.md](./MIGRATION.md) - Migration notes and compatibility guidance

## Package Docs

### App And Server Packages

- [API.md](./API.md) - Core Elit runtime API reference
- [server.md](./server.md) - `elit/server` guide
- [ws.md](./ws.md) - `elit/ws` low-level WebSocket client and server docs
- [wss.md](./wss.md) - `elit/wss` secure WebSocket docs

### Cross-Runtime Utility Packages

- [http.md](./http.md) - `elit/http` server and client primitives
- [https.md](./https.md) - `elit/https` TLS server and client primitives
- [fs.md](./fs.md) - `elit/fs` file system helpers
- [path.md](./path.md) - `elit/path` utilities
- [mime-types.md](./mime-types.md) - MIME lookup helpers
- [chokidar.md](./chokidar.md) - File watching adapter

## Workflow Guides

- [server.md](./server.md) - REST routes, middleware, proxying, SSR, shared state, and WebSocket endpoints
- [CONFIG.md](./CONFIG.md) - Full config shape and environment loading rules
- [CLI.md](./CLI.md) - Command-line workflows and config-first usage
- [wapk.md](./wapk.md) - Packaging and locked archive workflows
- [native-css-support.md](./native-css-support.md) - Native styling constraints for Compose, SwiftUI, and desktop native renderers

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
- [WebSocket Secure Server](../examples/wss-example.ts) - Native WebSocket server usage
- [Chokidar](../examples/chokidar-example.ts) - File watching integration

## Key Topics

### Core Runtime

- [Elements](./API.md#elements)
- [State Management](./API.md#state-management)
- [Reactive Rendering](./API.md#reactive-rendering)
- [Router](./API.md#router)
- [SSR & Rendering](./API.md#ssr--rendering)

### Server And Tooling

- [server.md](./server.md) - `ServerRouter`, middleware, shared state, and WebSocket endpoints
- [CONFIG.md](./CONFIG.md) - `defineConfig`, config loading, env loading, and option branches
- [CLI.md](./CLI.md) - `dev`, `build`, `preview`, `test`, `desktop`, `mobile`, `native`, `pm`, and `wapk`

## Resources

- [README Installation](../README.md#installation)
- [README Examples](../README.md#examples)
- [CHANGELOG](../CHANGELOG.md)
- [CONTRIBUTING](../CONTRIBUTING.md)
- [LICENSE](../LICENSE)

## Community

- [npm - elit](https://www.npmjs.com/package/elit)
- [GitHub Repository](https://github.com/d-osc/elit)
- [Issue Tracker](https://github.com/d-osc/elit/issues)

