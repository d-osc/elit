---
name: elit-server-app
description: 'Build or refactor server code in an app that uses Elit. Use when working on `elit/server`, `elit/database`, API handlers, middleware, route modules, or fullstack Elit app backends.'
argument-hint: 'Describe the API route, middleware, or server behavior to change.'
user-invocable: true
---

# Elit Server App

Use this skill when working on server-side application code built with Elit.

## Use Public Elit APIs

- `elit/server` for routes and middleware
- `elit/database` for simple file-backed persistence

## Working Rules

- Keep server handlers on `elit/server`.
- Keep browser code and server code in separate modules.
- Reuse the app's existing route and payload conventions.
- Update app docs or examples when public API behavior changes.

## Validation

- Run the app's typecheck script if available.
- Run focused server tests if available.
- Run build or preview validation if the change affects runtime wiring.