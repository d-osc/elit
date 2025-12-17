# @elit/server

🔥 Development server with Hot Module Replacement (HMR) for Elit applications.

## Features

- ⚡ **Fast HMR**: Instant hot module replacement via WebSocket
- 📁 **Static File Server**: Serves your application files
- 🔄 **Auto Reload**: Automatically reloads on file changes
- 🎯 **Zero Config**: Works out of the box
- 🛠️ **CLI Tool**: Simple command-line interface
- 📦 **Lightweight**: Minimal dependencies
- 🌐 **REST API**: Built-in routing system for building APIs
- 🔧 **Middleware**: CORS, logging, error handling, and more
- 🔄 **Shared State**: Real-time state synchronization between backend and frontend

## Installation

```bash
npm install --save-dev @elit/server
```

## Quick Start

### CLI Usage

```bash
# Start dev server on default port (3000)
npx elit-dev

# Custom port
npx elit-dev --port 8080

# Custom root directory
npx elit-dev --root ./public

# Disable auto-open browser
npx elit-dev --no-open

# Silent mode
npx elit-dev --silent
```

### Programmatic Usage

```typescript
import { createDevServer } from '@elit/server';

const server = createDevServer({
  port: 3000,
  host: 'localhost',
  root: process.cwd(),
  open: true,
  logging: true
});

// Server is now running
console.log(`Server running at ${server.url}`);

// Close server when done
await server.close();
```

## Configuration

```typescript
interface DevServerOptions {
  /** Port to run the server on (default: 3000) */
  port?: number;

  /** Host to bind to (default: 'localhost') */
  host?: string;

  /** Root directory to serve files from (default: process.cwd()) */
  root?: string;

  /** Enable HTTPS (default: false) */
  https?: boolean;

  /** Open browser automatically (default: true) */
  open?: boolean;

  /** Watch patterns for file changes */
  watch?: string[];

  /** Ignore patterns for file watcher */
  ignore?: string[];

  /** Enable logging (default: true) */
  logging?: boolean;

  /** API router for REST endpoints */
  api?: Router;
}
```

## HMR Client

The HMR client is automatically injected into HTML files. You can also use it programmatically:

```typescript
// Import from main package or /client
import { hmr } from '@elit/server';
// or
import hmr from '@elit/server/client';

// Accept HMR updates
if (hmr.enabled) {
  hmr.accept(() => {
    console.log('Module updated!');
    // Re-render your app here
  });

  // Cleanup before module replacement
  hmr.dispose(() => {
    console.log('Cleaning up...');
    // Cleanup code here
  });
}

// Or decline HMR (forces full reload)
hmr.decline();

// Manual reload
hmr.reload();
```

### With Elit Applications

```typescript
import { div, h1, createState, reactive, domNode } from 'elit';
import { hmr } from '@elit/server';

const count = createState(0);

const app = div({ className: 'app' },
  h1('Hello Elit with HMR!'),
  reactive(count, value =>
    button({ onclick: () => count.value++ }, `Count: ${value}`)
  )
);

domNode.render('#app', app);

// Enable HMR
if (hmr.enabled) {
  hmr.accept(() => {
    // Re-render on update
    domNode.render('#app', app);
  });

  hmr.dispose(() => {
    // Cleanup state if needed
    count.destroy();
  });
}
```

## CLI Options

```
Usage:
  elit-dev [options]

Options:
  -p, --port <number>    Port to run server on (default: 3000)
  -h, --host <string>    Host to bind to (default: localhost)
  -r, --root <path>      Root directory to serve (default: current directory)
  --no-open              Don't open browser automatically
  --silent               Disable logging
  --help                 Show this help message
  --version              Show version number
```

## Example Project Structure

```
my-elit-app/
├── index.html
├── src/
│   └── app.ts
├── package.json
└── tsconfig.json
```

**index.html:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>My Elit App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/app.ts"></script>
</body>
</html>
```

**src/app.ts:**
```typescript
import { div, h1, domNode } from 'elit';
import hmr from '@elit/server/client';

const app = div(h1('Hello Elit!'));
domNode.render('#app', app);

if (hmr.enabled) {
  hmr.accept(() => domNode.render('#app', app));
}
```

Run the dev server:
```bash
npx elit-dev
```

## How It Works

1. **File Watching**: Monitors your source files for changes using chokidar
2. **WebSocket Connection**: Establishes a WebSocket connection between server and client
3. **Hot Updates**: When files change, the server notifies connected clients via WebSocket
4. **Auto Reload**: Clients automatically reload or update modules based on configuration

## Supported File Types

The dev server automatically serves:
- HTML files (`.html`)
- JavaScript/TypeScript (`.js`, `.ts`)
- CSS files (`.css`)
- JSON files (`.json`)
- Images (`.png`, `.jpg`, `.gif`, `.svg`, etc.)
- All other static assets

## REST API

@elit/server includes a built-in REST API router for building backend APIs alongside your frontend application.

### Quick Start

```typescript
import { createDevServer, Router, cors, logger, json } from '@elit/server';

// Create API router
const api = new Router();

// Add middleware
api.use(cors());
api.use(logger());

// Define routes
api.get('/api/users', (ctx) => {
  json(ctx.res, { users: ['Alice', 'Bob', 'Charlie'] });
});

api.get('/api/users/:id', (ctx) => {
  const userId = ctx.params.id;
  json(ctx.res, { id: userId, name: 'Alice' });
});

api.post('/api/users', (ctx) => {
  const newUser = ctx.body;
  json(ctx.res, { success: true, data: newUser }, 201);
});

// Create server with API
const server = createDevServer({
  port: 3000,
  api,  // Pass the router here
  logging: true
});
```

### Router Methods

```typescript
// HTTP Methods
api.get(path, handler);      // GET requests
api.post(path, handler);     // POST requests
api.put(path, handler);      // PUT requests
api.patch(path, handler);    // PATCH requests
api.delete(path, handler);   // DELETE requests
api.options(path, handler);  // OPTIONS requests
```

### Route Parameters

```typescript
// URL parameters
api.get('/api/posts/:postId/comments/:commentId', (ctx) => {
  const { postId, commentId } = ctx.params;
  json(ctx.res, { postId, commentId });
});

// Query parameters
api.get('/api/search', (ctx) => {
  const { q, limit } = ctx.query;  // /api/search?q=hello&limit=10
  json(ctx.res, { query: q, limit });
});

// Request body (automatically parsed for POST/PUT/PATCH)
api.post('/api/users', (ctx) => {
  const { name, email } = ctx.body;
  json(ctx.res, { name, email });
});
```

### Built-in Middleware

```typescript
import {
  cors,           // CORS support
  logger,         // Request logging
  errorHandler,   // Error handling
  rateLimit,      // Rate limiting
  bodyLimit,      // Body size limiting
  cacheControl,   // Cache headers
  security        // Security headers
} from '@elit/server';

const api = new Router();

// CORS with options
api.use(cors({
  origin: '*',  // or ['http://localhost:3000']
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Request logging
api.use(logger({ format: 'detailed' }));  // or 'simple'

// Error handling
api.use(errorHandler());

// Rate limiting
api.use(rateLimit({
  windowMs: 60000,  // 1 minute
  max: 100,         // 100 requests per window
  message: 'Too many requests'
}));

// Body size limit
api.use(bodyLimit({ limit: 1024 * 1024 }));  // 1MB

// Cache control
api.use(cacheControl({ maxAge: 3600, public: true }));

// Security headers
api.use(security());
```

### Response Helpers

```typescript
import { json, text, html, status } from '@elit/server';

// JSON response
api.get('/api/data', (ctx) => {
  json(ctx.res, { message: 'Hello' }, 200);
});

// Plain text
api.get('/api/text', (ctx) => {
  text(ctx.res, 'Hello World', 200);
});

// HTML
api.get('/api/page', (ctx) => {
  html(ctx.res, '<h1>Hello</h1>', 200);
});

// Status code
api.get('/api/error', (ctx) => {
  status(ctx.res, 404, 'Not Found');
});
```

### Custom Middleware

```typescript
// Create custom middleware
function authMiddleware(ctx, next) {
  const token = ctx.headers.authorization;

  if (!token) {
    return json(ctx.res, { error: 'Unauthorized' }, 401);
  }

  // Verify token...
  await next();
}

// Use middleware on router
api.use(authMiddleware);

// Or use on specific routes
api.get('/api/protected', async (ctx) => {
  await authMiddleware(ctx, async () => {
    json(ctx.res, { message: 'Secret data' });
  });
});
```

### Full Example

See [example/api-example.js](example/api-example.js) and [example/api-demo.html](example/api-demo.html) for a complete REST API example with a todo app.

```bash
# Run the API example
node server/example/api-example.js

# Then open http://localhost:3000/api-demo.html
```

## Shared State

@elit/server includes a powerful shared state system that allows real-time synchronization between backend and frontend over WebSocket.

### Quick Start

**Backend (Node.js):**

```typescript
import { createDevServer } from '@elit/server';

const server = createDevServer({
  port: 3000
});

// Create shared state
const counter = server.state.create('counter', {
  initial: 0
});

// Listen to changes
counter.onChange((newValue, oldValue) => {
  console.log(`Counter changed: ${oldValue} -> ${newValue}`);
});

// Update from backend
setInterval(() => {
  counter.value++;
}, 1000);
```

**Frontend (Browser):**

```html
<script type="module">
import { stateManager } from '@elit/server/state';

// Auto-connects to WebSocket
const counter = stateManager.create('counter', 0);

// React to changes
counter.onChange((value) => {
  document.getElementById('counter').textContent = value;
});

// Update from frontend
button.onclick = () => counter.value++;
</script>
```

### Creating States

**Server-side:**

```typescript
const chatMessages = server.state.create('chat', {
  initial: [],
  validate: (value) => Array.isArray(value)
});

const userProfile = server.state.create('profile', {
  initial: { name: '', age: 0 }
});
```

**Client-side:**

```typescript
import { stateManager } from '@elit/server/state';

// Create with default value
const chat = stateManager.create('chat', []);
const profile = stateManager.create('profile', { name: '', age: 0 });
```

### Reading and Writing State

```typescript
// Get current value
const value = counter.value;

// Set new value (syncs to all clients)
counter.value = 42;

// Update using function
counter.update(current => current + 1);
```

### Listening to Changes

```typescript
// Subscribe to changes
const unsubscribe = counter.onChange((newValue, oldValue) => {
  console.log(`${oldValue} -> ${newValue}`);
});

// Unsubscribe
unsubscribe();
```

### State Validation

```typescript
const age = server.state.create('age', {
  initial: 0,
  validate: (value) => typeof value === 'number' && value >= 0 && value <= 120
});

// This will throw an error
age.value = -1;  // Error: Invalid state value for "age"
age.value = 150; // Error: Invalid state value for "age"
```

### Complex State Example

```typescript
// Server-side
const todoList = server.state.create('todos', {
  initial: [],
  validate: (todos) => Array.isArray(todos) &&
    todos.every(t => t.id && t.text)
});

// Add todo from backend
todoList.update(todos => [...todos, {
  id: Date.now(),
  text: 'New task',
  completed: false
}]);

// Client-side
import { stateManager } from '@elit/server/state';

const todos = stateManager.create('todos', []);

// Render on change
todos.onChange((todoList) => {
  renderTodos(todoList);
});

// Add todo from frontend
function addTodo(text) {
  todos.update(list => [...list, {
    id: Date.now(),
    text,
    completed: false
  }]);
}
```

### Full Example

See [example/state-example.js](example/state-example.js) and [example/state-demo.html](example/state-demo.html) for a complete chat application with real-time state synchronization.

```bash
# Run the state example
node server/example/state-example.js

# Then open http://localhost:3000/state-demo.html
# Open multiple tabs to see real-time sync!
```

## Advanced Usage

### Custom Middleware

```typescript
import { createDevServer } from '@elit/server';

const server = createDevServer({
  middleware: [
    (req, res, next) => {
      console.log(`${req.method} ${req.url}`);
      next();
    }
  ]
});
```

### Multiple Watch Patterns

```typescript
const server = createDevServer({
  watch: [
    'src/**/*.ts',
    'styles/**/*.css',
    'public/**/*.html'
  ],
  ignore: [
    'node_modules/**',
    '**/*.test.ts'
  ]
});
```

## License

MIT

---

**Part of the Elit ecosystem** - [elit](https://github.com/d-osc/elit)
