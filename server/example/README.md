# @elit/server Examples

This directory contains examples demonstrating the features of @elit/server.

## Examples

### 1. HMR Example (`index.html`)

A simple counter application demonstrating Hot Module Replacement.

**Run:**
```bash
cd server
npx elit-dev --root example
```

Then open http://localhost:3000 and try editing `index.html` to see HMR in action.

---

### 2. REST API Example (`api-example.js` + `api-demo.html`)

A complete REST API example with a todo application demonstrating:
- Router with HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Route parameters (`:id`)
- Middleware (CORS, logger, error handling)
- JSON body parsing
- Response helpers

**Run:**
```bash
cd server
node example/api-example.js
```

Then:
- Open http://localhost:3000/api-demo.html for the interactive UI
- Or test with curl:

```bash
# Get all todos
curl http://localhost:3000/api/todos

# Get single todo
curl http://localhost:3000/api/todos/1

# Create new todo
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"New Task"}'

# Update todo
curl -X PUT http://localhost:3000/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Task","completed":true}'

# Toggle completion
curl -X PATCH http://localhost:3000/api/todos/1/toggle

# Delete todo
curl -X DELETE http://localhost:3000/api/todos/1
```

---

### 3. Shared State Example (`state-example.js` + `state-demo.html`)

Real-time state synchronization between backend and frontend demonstrating:
- Shared state creation and management
- Bidirectional state sync (backend ↔ frontend)
- Real-time updates via WebSocket
- State validation
- Multiple clients synchronization

**Run:**
```bash
cd server
node example/state-example.js
```

Then:
- Open http://localhost:3000/state-demo.html
- **Open multiple tabs** to see real-time synchronization
- State changes in one tab instantly appear in all other tabs
- Chat messages, online users, and server stats sync in real-time

## Features Demonstrated

- ⚡ Hot Module Replacement (HMR)
- 🌐 REST API routing
- 📦 Route parameters and query strings
- 🔧 Middleware (CORS, logging, error handling)
- 📨 JSON body parsing
- 🎯 Response helpers (json, text, html, status)
- 🔒 Security headers
- ⏱️ Rate limiting
- 📊 Real-time WebSocket updates
- 🔄 Shared state synchronization between backend and frontend
