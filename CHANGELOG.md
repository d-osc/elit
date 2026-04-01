# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.4.4] - 2026-04-01

### Added
- **Native desktop mode** - Added a first-class desktop runtime and CLI flow for WebView apps
  - New `elit desktop` command for running entries and building standalone executables
  - New `elit/desktop` subpath with `createWindow`, `createWindowServer`, IPC helpers, and window control APIs
  - Desktop runtime now supports QuickJS plus external Bun, Node.js, and Deno execution
  - Added desktop smoke example and bundled native runtime sources via Cargo

### Changed
- **Desktop build pipeline** - Expanded desktop entry preparation and package distribution for native apps
  - `elit desktop build --compiler` now supports `auto`, `none`, `esbuild`, `tsx`, and `tsup`
  - Desktop build can prebuild the native runtime even without an entry file
  - Published package now includes the `elit/desktop` export and Cargo files needed to build the native runtime
- **Documentation refresh** - Reworked the main README and docs content around current module boundaries and workflows
  - Updated examples to prefer subpath imports such as `elit/el`, `elit/state`, `elit/dom`, and `elit/server`
  - Added desktop mode guidance, compiler notes, config examples, and AI-oriented usage rules

### Fixed
- **Desktop icon handling** - Window icons and Windows executable icons now support SVG assets in addition to PNG and ICO
  - Added shared SVG rasterization for runtime window icons and EXE icon embedding
  - Desktop icon auto-detection now checks `icon.*` and `favicon.*` in entry, project, and sibling `public/` directories

## [3.4.3] - 2026-04-01

### Fixed
- **Database `save()` and `update()` preserve typed exports** - Saving structured data into existing database modules now keeps typed declarations intact
  - `save()` updates existing bindings like `export const users: User[] = ...` in place instead of overwriting the module structure
  - `update()` replaces the declaration body without appending duplicate fallback exports
  - Added unit tests covering typed `save()` and `update()` flows

## [3.4.2] - 2026-03-09

### Fixed
- **HMR WebSocket Error in Preview Mode** - Fixed `WebSocket connection failed` error when app imports `elit/hmr` in preview mode
  - `ElitHMR` constructor now checks `window.__ELIT_MODE__` before attempting to connect
  - Server injects `<script>window.__ELIT_MODE__='preview';</script>` into HTML head in preview mode
  - Applies to both static file responses (`serveFile`) and SSR responses (`serveSSR`)
  - No more `[Elit HMR] WebSocket error:` noise in browser console during preview

## [3.4.1] - 2026-03-09

### Security
- **Preview Mode Hardening** - Significant security improvements when running `elit preview`
  - Security response headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`) are now automatically set on all file and SSR responses
  - HMR WebSocket script is no longer injected into HTML pages in preview mode
  - WebSocket server is not created in preview mode, eliminating an unnecessary open endpoint
  - File watcher is not started in preview mode, reducing attack surface
  - Source maps are disabled in preview mode to avoid exposing source code structure
  - JavaScript files are obfuscated in preview mode using `javascript-obfuscator` (via `esbuild-obfuscator-plugin`)
- **Enhanced `security()` middleware** - Added `Referrer-Policy: strict-origin-when-cross-origin` and `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **Safe `close()` cleanup** - `close()` now guards against null `wss`/`watcher` when called in preview mode

## [3.4.0] - 2026-02-24

### Added
- **Config Hot Reload** - Dev server now automatically restarts when config file changes
  - Watches for changes to `elit.config.ts`, `elit.config.js`, `elit.config.mjs`, and `elit.config.json`
  - Server restarts with reloaded config without needing to manually Ctrl+C
  - 300ms debounce to handle rapid file saves gracefully
  - Restart is guarded against concurrent triggers

### Fixed
- **API Route Handling with basePath** - Fixed client-specific API routes not matching when `basePath` is set
  - `matchedClient.api` now correctly strips `basePath` from the request URL before pattern matching
  - `config.api` (global) correctly matches against the original full URL
  - API routes no longer require a `/api` prefix — any path can be used as an API route
  - 405 Method Not Allowed response now fires when API routes are configured but no route matched (regardless of path prefix)
- **HMR File Add/Remove** - Browser now reloads when files are added or deleted
  - `add` event broadcasts `update` message to all connected HMR clients
  - `unlink` event broadcasts `reload` message to all connected HMR clients
  - Previously only `change` events triggered browser reload

### Fixed
- **Database Custom Directory** - Fixed Database class not saving to custom `dir` option
  - When creating a Database with `dir: 'databases/system'`, it now correctly saves to that directory
  - Previously fell back to default `databases` directory when called from within VM
  - SystemModuleResolver now properly passes customOptions to all database functions
- **Import Map 404 Error** - Fixed import map paths for dev server with basePath
  - Import map now correctly points to compiled `.mjs` files instead of source `.ts` files
  - Added special handling for `/basePath/dist/*` requests to serve from parent package
  - Fixes 404 errors when using `file:..` dependency references in development
- **Mobile Build Support** - Build native Android & iOS apps using Capacitor
  - `elit android init` - Initialize mobile project with auto-install of Capacitor dependencies
  - `elit android sync` - Sync web build to mobile platforms
  - `elit android open --platform <android|ios>` - Open project in Android Studio or Xcode
  - `elit android build --platform <android|ios>` - Build native APK/AAB or IPA
  - New `MobileConfig` interface in `elit/types.ts`
  - Mobile configuration option in `elit.config.ts`
  - Support for both Android and iOS platforms
  - Auto-detection of platform requirements (Java JDK, Android SDK, Xcode, CocoaPods)

### Changed
- **HMR Configuration** - Added `hmr` option to disable Hot Module Replacement
  - Set `hmr: false` in `elit.config.ts` dev section to disable auto-reload
  - When disabled, WebSocket server and file watcher are not created
  - Useful for debugging or when auto-reload is not desired

## [3.3.6] - 2025-01-28

### Added
- **Express-like Request Interface** - Added `query` and `params` properties to `ElitRequest` for better Express compatibility
  - `req.query` now provides direct access to parsed query parameters
  - `req.params` now provides direct access to route parameters (e.g., `/users/:id`)
  - Works alongside `req.body` for complete request data access
  - Compatible with both context-based handlers and direct (req, res) handlers
  - Query and params are automatically parsed and attached to every request

## [3.3.5] - 2025-01-25

### Fixed
- **WebSocket HMR Error Handling** - Fixed ECONNABORTED errors during Hot Module Replacement
  - Added graceful error handling for connection interruptions (ECONNABORTED, ECONNRESET, EPIPE)
  - WebSocket send method now checks if socket is writable before sending
  - HMR broadcast properly handles client disconnections without crashing the server
  - Connection errors are now silently ignored instead of crashing the dev server
  - Fixes issue where closing browser tab or network issues would crash the development server

## [3.3.4] - 2025-01-25

### Added
- **RegisterPage Unit Tests** - Added 59 comprehensive unit tests for RegisterPage component
  - Tests cover authentication redirect, page structure, form elements, validation
  - Social login buttons, error handling, loading states
  - Form validation for name, email, password, and confirm password
- **Client Unit Tests** - Added 24 comprehensive unit tests for client HTML document
  - Tests cover HTML structure, head section, meta tags, body section
  - Validates favicon, title, charset, viewport, and description meta tags
  - Tests DOM rendering and HTML document structure
- **Main Application Unit Tests** - Added 40 comprehensive unit tests for main entry point
  - Tests cover module structure, injectStyles, router integration
  - App component structure, reactive routing, component layout
  - DOM rendering, app initialization, and execution order
- **Test Suite Growth** - Total test suite now has 431 passing tests
  - Footer: 18 tests
  - Header: 18 tests
  - ChatListPage: 24 tests
  - ChatPage: 23 tests
  - ForgotPasswordPage: 46 tests
  - HomePage: 46 tests
  - LoginPage: 50 tests
  - PrivateChatPage: 33 tests
  - ProfilePage: 50 tests
  - RegisterPage: 59 tests
  - Client: 24 tests
  - Main: 40 tests

### Changed
- **Test Pattern Improvements** - Simplified tests for async/reactive components
  - Tests now check structure capability rather than specific async content
  - Avoids waiting for async operations like loadProfile()
  - More reliable and faster test execution

## [3.3.3] - 2025-01-21

### Fixed
- **Build Process Exit** - Build command now properly exits after completion
  - Added `process.exit(0)` after all build paths complete
  - Prevents build process from hanging after successful builds
  - Works for both config-based and CLI-only builds

## [3.3.2] - 2025-01-21

### Changed
- **Router Mode Detection** - Router now automatically exposes mode property
  - `router.mode` now returns `'history'` or `'hash'` for mode detection
  - `routerLink` component automatically uses router mode for href generation
  - No need to manually detect URL format for hash vs history mode

### Fixed
- **URL Path Joining** - Fixed duplicate slash issue when base and path both contain slashes
  - Properly handles `/` + `/login` → `/login` instead of `//login`
  - Prevents `SecurityError` when using history mode with invalid URLs
- **Template Header** - Updated to use `routerLink` from `'elit/router'`
  - Replaced `<a href="#/">` with `routerLink(router, { to: '/', ... })`
  - Ensures proper routing in both hash and history modes

## [3.3.1] - 2025-01-21

### Added
- **Reactive Array Support** - `reactive` function now supports returning arrays of children
  - Can return `VNode[]` directly from reactive callbacks without wrapping
  - Arrays are wrapped in `<span style="display: contents">` for invisible container
  - `Child` type now supports recursive arrays via `Child[]`
  - `reactiveAs` also supports array return values
  - Fragment rendering support in `dom.ts` for empty tagName elements

## [3.3.0] - 2025-01-21

### Added
- **create-elit Template System** - Refactored to use template files with placeholder replacement
  - Templates now stored in `packages/create-elit/src/templates/`
  - Placeholders `ELIT_PROJECT_NAME` and `ELIT_VERSION` replaced during project creation
  - Version dynamically read from `create-elit` package.json
  - Templates automatically copied to `dist/templates` during build
  - Easier to maintain and update templates independently

### Changed
- **create-elit** - Simplified scaffolding logic
  - Removed inline template generation (2500+ lines)
  - Now copies from templates directory with placeholder replacement
  - Templates include: full-stack app with authentication, routing, and chat features
  - Build process copies templates to `dist/templates` for distribution
  - Updated `package.json` files array to only include `dist` folder
  - Template `gitignore` file automatically renamed to `.gitignore` in generated projects

## [3.1.7] - 2025-01-21

### Added
- Domain mapping support for dev and preview servers
- Database VM runner with plugin system
- Environment variable injection with `.env` file support

### Changed
- Improved dev server configuration handling
- Enhanced proxy configuration with better path rewriting

## [3.1.6] - 2025-01-21

### Added
- Multi-client support for dev server
- Client-specific API routes and proxy configuration
- Web Worker support for background processing

## [3.1.5] - 2025-01-21

### Added
- SSR (Server-Side Rendering) support
- REST API with ServerRouter
- HMR (Hot Module Replacement)
- TypeScript transpilation in dev server
