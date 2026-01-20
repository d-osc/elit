# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Domain Mapping** - Add `domain` option to `DevServerOptions` and `PreviewOptions` for redirecting localhost to custom domain
  - Configure domain in `elit.config.ts`: `dev: { port: 3000, domain: 'idevcoder.com' }`
  - Automatically redirects `localhost:3000` to configured domain
  - Works for both `dev` and `preview` servers
- **Module Resolution** - Add `resolve.alias` option to `BuildOptions` for path aliasing
  - Configure in `elit.config.ts`: `build: { resolve: { alias: { '@foo': './path/to/foo' } } }`
  - Uses esbuild's alias resolution for Node.js runtime
- **Environment Variables** - Add `env` option to `DevServerOptions`, `BuildOptions`, and `PreviewOptions`
  - Configure in `elit.config.ts`: `dev: { env: { API_URL: 'https://api.example.com' } }`
  - Merges with `.env` files (`.env` takes precedence)
  - Works for all commands: `dev`, `build`, and `preview`
- **Express-like Request/Response** - Enhanced request handling with Express.js compatibility
  - `req.body` - Auto-parsed request body (JSON, URL-encoded, text)
  - `res.json(data, statusCode?)` - Send JSON response
  - `res.send(data)` - Send response (auto-detects JSON)
  - `res.status(code)` - Set status code (chainable)
  - New types: `ElitRequest` and `ElitResponse`
- **HMR file:// Protocol Support** - HMR disabled for `file://` protocol to prevent infinite reload loop

### Changed
- **HMR Behavior** - Disabled automatic page reload on file changes
  - HMR now logs updates but doesn't auto-reload
  - Users must manually refresh (F5 or Ctrl+R) to see changes
  - Can still use `hmr.accept()` for custom HMR behavior
  - WebSocket disconnect no longer triggers auto-reconnect and reload
- **Environment Variable Loading** - Changed from override to merge behavior
  - Config env values are preserved
  - `.env` file values take precedence (override config values)

### Fixed
- Remove `targetPort` option, use `port` directly for domain mapping

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
