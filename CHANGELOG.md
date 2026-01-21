# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
