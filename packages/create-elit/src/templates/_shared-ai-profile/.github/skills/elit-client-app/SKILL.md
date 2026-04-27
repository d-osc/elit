---
name: elit-client-app
description: 'Build or refactor browser UI in an app that uses Elit. Use when working on `elit/el`, `elit/dom`, `elit/state`, `elit/style`, `elit/router`, reactive UI, SSR string rendering, or app pages and components.'
argument-hint: 'Describe the page, component, route, or client behavior to change.'
user-invocable: true
---

# Elit Client App

Use this skill when working on browser-facing application code built with Elit.

## Use Public Elit APIs

- `elit/el` for element factories
- `elit/dom` for rendering
- `elit/state` for reactive state
- `elit/style` for styles
- `elit/router` for routing

## Working Rules

- Follow the app's existing page and component structure before creating new folders.
- Keep client code separate from `elit/server` code.
- Prefer current state and style patterns already used in the app.
- Remember that `createRouterView(router, options)` returns a function.

## Validation

- Run the app's typecheck script if available.
- Run focused client tests if available.
- Run the app build or dev validation for client changes.