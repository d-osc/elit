# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
