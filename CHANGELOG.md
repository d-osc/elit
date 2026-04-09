# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.5.2] - 2026-04-10

### Changed
- **WAPK lock credential simplification** - WAPK locking now uses password-only credentials across config, CLI, and helper APIs
  - `wapk.lock` accepts only `password` in `elit.config.*`
  - `elit wapk` and `elit desktop wapk` now accept only `--password` for locked archives
  - `WapkCredentialsOptions` now accepts only `password`

### Documentation
- **README WAPK credential refresh** - Updated command examples, config notes, and release summary to match the password-only WAPK lock flow

### Tests
- **WAPK lock coverage refresh** - Updated config-driven unit coverage to lock archives with `wapk.lock.password`

## [3.5.1] - 2026-04-09

### Added
- **Configurable WebSocket endpoints for dev and preview** - `dev.ws`, `preview.ws`, and `clients[].ws` can now register custom WebSocket upgrade handlers
  - Endpoint handlers receive `{ ws, req, path, query, headers }`
  - Client-specific endpoints are automatically prefixed with that client's `basePath`
  - Works alongside the existing REST router, proxy, SSR, and shared-state flows

### Changed
- **Internal WebSocket routing split** - Elit now keeps HMR and built-in shared state traffic on a reserved internal path
  - Internal HMR and shared-state traffic now uses `/__elit_ws`
  - `createSharedState()` defaults to that internal path and rewrites bare host-only WebSocket URLs to it
  - Prevents custom WebSocket endpoints from colliding with HMR connections
- **Cross-runtime WebSocket path matching** - Upgrade matching now uses exact pathnames instead of treating `/` as a wildcard
  - Query strings are ignored for route matching while remaining available in endpoint context
  - Bun upgrade routing now matches the request pathname cleanly before handing the socket to the selected server

### Documentation
- **README WebSocket refresh** - Added config examples, server usage patterns, changelog summary, and reserved-path guidance for custom WebSocket endpoints

### Tests
- **WebSocket endpoint coverage** - Added unit coverage for query-aware path matching and shared-state internal WebSocket URL resolution

## [3.5.0] - 2026-04-08

### Added
- **Locked WAPK archives** - WAPK packaging can now encrypt archive payloads and require credentials to open them
  - Added `--password` and `--password-env` support to `elit wapk pack`
  - Added `wapk.lock.password` and `wapk.lock.passwordEnv` support in `elit.config.*`
  - Added locked archive support to `elit wapk inspect`, `elit wapk extract`, `elit wapk run`, and `elit desktop wapk run`

### Changed
- **WAPK archive handling** - Archive inspection and live-sync flows now understand password-protected WAPK files
  - `inspect` reports whether an archive is locked even when credentials are not provided
  - Live sync keeps locked archives encrypted when runtime changes are written back into the same `.wapk` file
  - Desktop WAPK commands now forward password credentials to the packaged runtime flow

### Documentation
- **README and WAPK guide refresh** - Documented password-protected WAPK packaging, unlock flags, and config-driven lock defaults

### Tests
- **WAPK lock coverage** - Added unit coverage for password-protected archives, config-driven `passwordEnv` locks, and encrypted live-sync updates

## [3.4.9] - 2026-04-06

### Changed
- **Desktop native renderer modularization** - Reorganized the Rust desktop-native renderer into focused modules without changing the native desktop payload, CLI surface, or shared `elit/native` foundation
  - Split widget rendering, content/media surfaces, form controls, interaction dispatch, container rendering, vector drawing, runtime support, and app runtime orchestration into dedicated modules
  - Keeps desktop-native parity fixes localized while preserving the existing `native_renderer::run(...)` entry flow and shared native tree contract

### Documentation
- **README native desktop foundation refresh** - Clarified that native desktop mode still runs on the same shared native tree and style/layout model as IR, Compose, and SwiftUI output while its desktop renderer internals are now modularized by concern

## [3.4.8] - 2026-04-06

### Changed
- **Native renderer modularization** - Split the shared native rendering pipeline into focused modules while keeping the public `elit/native` API unchanged
  - Compose, SwiftUI, IR generation, and native desktop mode still share the same native tree and resolved-style foundation
  - Native layout, typography, interaction, background, estimation, and render-support logic now live in smaller helper modules, making parity fixes safer to land across outputs

### Documentation
- **Native foundation README refresh** - Updated the main README to clarify that `elit/native` and native desktop mode build on the same shared native rendering foundation

## [3.4.7] - 2026-04-05

### Added
- **Desktop mode split** - Desktop config and CLI now support `hybrid` and `native` modes similar to mobile
  - Added `desktop.mode` plus `desktop.native.entry` config support
  - Added `elit desktop run` as an explicit run alias beside the shorthand `elit desktop`
- **True native desktop backend** - Native desktop mode now builds and runs a dedicated desktop renderer instead of only resolving a different entry
  - Added a separate `elit-desktop-native` Rust binary for native desktop run/build
  - Native desktop mode now materializes Elit native IR and renders it through the dedicated native desktop runtime

### Changed
- **Desktop native entry resolution** - Desktop run/build now resolve entries from the active mode
  - Projects with `desktop.native.entry` default to native desktop mode
  - `--mode native|hybrid` now works for `elit desktop run` and `elit desktop build`
  - Native desktop mode falls back to legacy `desktop.entry` when needed for backward compatibility

### Fixed
- **Strict TypeScript typecheck compatibility** - The desktop/native toolchain now passes `tsc --noEmit` cleanly on the current TypeScript toolchain
  - Updated TypeScript module resolution config for modern ESM/bundler behavior
  - Cleaned up stale native desktop helper typings left behind by the renderer refactor
  - Aligned desktop auto-render `createWindow()` typing with the shared desktop `WindowOptions` contract

## [3.4.6] - 2026-04-04

### Added
- **Desktop entry config default** - Added `desktop.entry` support in `elit.config.*` for desktop run/build commands
  - `elit desktop` and `elit desktop build` can now omit the positional entry when `desktop.entry` is configured
  - CLI help and config docs now describe the optional entry behavior

### Changed
- **Shared render-based desktop/mobile entry flow** - Desktop mode and native generation can now reuse a normal `render(...)` entry instead of requiring separate platform-specific mains
  - `render()` now captures the rendered VNode when running in Elit desktop/mobile runtimes without a DOM
  - Native generation falls back to that captured `render(...)` output when the module does not export `default`, `screen`, `app`, `view`, or `root`
  - Desktop run/build auto-wrap shared entries and open a native window from the captured render output when the entry does not call `createWindow()` directly
- **Universal example consolidation** - `examples/universal-app-example` now runs web, desktop, and native mobile flows from the same `src/web-main.ts` entry
  - `desktop.entry` and `mobile.native.entry` both point at the shared entry file
  - Removed the example's legacy `desktop.ts`, `desktop-app.ts`, `desktop-html.ts`, and `native-screen.ts` split entry files

### Fixed
- **QuickJS shared-entry desktop startup** - Shared desktop entries now open correctly on the QuickJS runtime
  - Desktop bootstrap no longer depends on Promise microtasks before `createWindow()` runs
  - Fixes the no-window path for projects using `desktop.runtime: 'quickjs'`
- **Desktop config fallback with no CLI args** - `elit desktop` no longer prints help when `desktop.entry` is configured and no explicit entry path is passed

### Documentation
- **Desktop/shared-entry docs refresh** - Updated README and example docs to describe `desktop.entry`, shared `render(...)` desktop entries, and native generation from the same entry module

### Tests
- Validated the shared-entry flow with:
  - `bun ../../src/cli.ts build`
  - `bun src/cli.ts native generate android examples/universal-app-example/src/web-main.ts`
  - `bun run desktop:smoke`
  - `bun run desktop:build`

## [3.4.5] - 2026-04-02

### Added
- **Mobile mode (native shell workflow)** - Added first-class `elit mobile` command group for Android and iOS workflows
  - Added `elit mobile init [directory]` to scaffold native project structure, with mobile defaults sourced from `elit.config.*`
  - Added `elit mobile sync`, `elit mobile open android|ios`, `elit mobile run android|ios`, and `elit mobile build android|ios`
  - Added `elit mobile doctor` to verify native mobile toolchain readiness and project prerequisites
  - Added `elit mobile doctor --json` for machine-readable CI diagnostics
  - Added `mobile` config support in `elit.config.*` (`cwd`, `appId`, `appName`, `webDir`)
- **WAPK CLI workflows** - Added first-class WAPK command flows for package lifecycle and runtime execution
  - Added `elit wapk <file.wapk>` and `elit wapk run <file.wapk>` execution paths
  - Added `elit wapk pack [directory]`, `elit wapk inspect <file.wapk>`, and `elit wapk extract <file.wapk>`
  - Added runtime override support via `--runtime node|bun|deno` for WAPK run commands
  - Added desktop integration commands: `elit desktop wapk <file.wapk>` and `elit desktop wapk run <file.wapk>`
- **WAPK sync controls** - Added runtime sync tuning options for edit-heavy workflows
  - Added `--sync-interval <ms>` to configure archive sync frequency
  - Added `--watcher` / `--use-watcher` mode for event-driven file sync
- **Desktop config defaults** - Added `desktop` config support in `elit.config.*` for `elit desktop` commands
  - `elit desktop` and `elit desktop build` now read defaults from `desktop` config
  - `elit desktop wapk` now reads defaults from `desktop.wapk` config

### Changed
- **WAPK config source** - WAPK packaging now reads `wapk` options from `elit.config.*`
  - Supports `elit.config.ts`, `elit.config.mts`, `elit.config.js`, `elit.config.mjs`, `elit.config.cjs`, and `elit.config.json`
  - Removed metadata fallback behavior from legacy `wapk.config.json`
- **WAPK run architecture** - Reworked run flow from cache-based extraction to live archive sync
  - `.wapk` is loaded and prepared in a temporary working directory for runtime execution
  - File changes are synced back into the source `.wapk` archive directly during runtime
  - Desktop WAPK run now uses the same live sync model and lifecycle cleanup

### Fixed
- **Archive ignore behavior** - Packaging now excludes legacy and temporary config artifacts from WAPK contents
  - Prevents accidental inclusion of `.elit-config-*` temporary files
  - Prevents accidental inclusion of `wapk.config.json` in generated archives
- **Desktop/WAPK compatibility after run refactor** - Updated desktop command paths to use `workDir` after cache removal

### Tests
- Added and expanded WAPK unit/smoke coverage for:
  - `elit.config.json` and `elit.config.mts` metadata loading
  - Ignoring legacy `wapk.config.json` metadata and file inclusion
  - Configurable sync interval and watcher-enabled live sync behavior
  - Real-world example flow (`pack -> inspect -> run -> extract`) in `examples/wapk-example`

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
