import {
  div, h1, h2, h3, p, ul, li, pre, code, strong, em, a
} from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog18: BlogPostDetail = {
  id: '18',
  title: {
    en: 'Complete Guide to elit-server',
    th: 'คู่มือครบวงจร elit-server'
  },
  date: '2024-04-15',
  author: 'n-devs',
  tags: ['Tutorial', 'elit-server', 'REST API', 'Middleware', 'Full Stack'],
  content: {
    en: div(
      p('Learn everything about ', strong('elit-server'), ' - the zero-configuration development server built for Elit. This comprehensive guide covers ', em('HMR, REST API, middleware, shared state, WebSocket'), ', and production deployment.'),

      h2('What is elit-server?'),
      p('elit-server is a full-featured development server that provides:'),
      ul(
        li('🔥 ', strong('Hot Module Replacement'), ' - Instant updates without refresh'),
        li('🌐 ', strong('REST API Router'), ' - Express-like routing with regex parameters'),
        li('🔧 ', strong('Middleware Stack'), ' - Built-in middleware (CORS, logging, rate limiting, etc.)'),
        li('🔄 ', strong('Shared State'), ' - Real-time WebSocket state synchronization'),
        li('📁 ', strong('Static Files'), ' - Automatic MIME type detection'),
        li('🎯 ', strong('Zero Config'), ' - Works out of the box'),
        li('📦 ', strong('Lightweight'), ' - Minimal dependencies (chokidar, ws, mime-types)')
      ),

      h2('Installation'),
      pre(code(...codeBlock(`# Install as dev dependency
npm install --save-dev elit-server

# Or with yarn
yarn add -D elit-server

# Or with pnpm
pnpm add -D elit-server`))),

      h2('Quick Start'),
      h3('1. Basic Server'),
      p('Create ', code('server.js'), ':'),
      pre(code(...codeBlock(`const { createDevServer } = require('elit-server');

// Create server with defaults
const server = createDevServer({
  port: 3000,
  root: './public'
});

console.log('Server running at http://localhost:3000');`))),

      h3('2. Using CLI'),
      pre(code(...codeBlock(`# Start server (default port 3000)
npx elit-dev

# Custom configuration
npx elit-dev --port 8080 --root ./dist

# All options
npx elit-dev --port 8080 --root ./public --no-open --silent`))),

      p('CLI Options:'),
      ul(
        li(code('--port'), ' - Port number (default: 3000)'),
        li(code('--root'), ' - Root directory (default: ./public)'),
        li(code('--open'), ' - Open browser (default: true)'),
        li(code('--silent'), ' - Disable logging (default: false)')
      ),

      h2('REST API Router'),
      h3('Basic Routing'),
      pre(code(...codeBlock(`const { Router } = require('elit-server');

const api = new Router();

// GET request
api.get('/api/users', (ctx) => {
  return { success: true, users: [...] };
});

// POST request
api.post('/api/users', (ctx) => {
  const user = ctx.body;
  return { success: true, user };
});

// PUT request
api.put('/api/users/:id', (ctx) => {
  const id = ctx.params.id;
  const updates = ctx.body;
  return { success: true, user: { id, ...updates } };
});

// DELETE request
api.delete('/api/users/:id', (ctx) => {
  const id = ctx.params.id;
  return { success: true, deleted: id };
});

// Pass router to server
const server = createDevServer({
  port: 3000,
  api
});`))),

      h3('Route Parameters'),
      pre(code(...codeBlock(`// Dynamic segments with :param
api.get('/api/users/:id', (ctx) => {
  const userId = ctx.params.id;
  return { user: findUser(userId) };
});

// Multiple parameters
api.get('/api/posts/:postId/comments/:commentId', (ctx) => {
  const { postId, commentId } = ctx.params;
  return { post: postId, comment: commentId };
});

// Regex patterns
api.get('/api/users/:id([0-9]+)', (ctx) => {
  // Only matches numeric IDs
  const id = parseInt(ctx.params.id);
  return { user: findUser(id) };
});`))),

      h3('Request Context'),
      p('The context object (', code('ctx'), ') contains:'),
      pre(code(...codeBlock(`api.post('/api/data', (ctx) => {
  // Request body (JSON parsed automatically)
  const data = ctx.body;

  // URL parameters
  const id = ctx.params.id;

  // Query parameters
  const page = ctx.query.page;

  // Headers
  const auth = ctx.headers['authorization'];

  // HTTP method
  const method = ctx.method;

  // Request URL
  const url = ctx.url;

  // Path
  const path = ctx.path;

  return { success: true, data };
});`))),

      h2('Middleware'),
      h3('Built-in Middleware'),
      p('elit-server includes these middleware out of the box:'),

      pre(code(...codeBlock(`const {
  cors,         // CORS headers
  logger,       // Request logging
  errorHandler, // Error handling
  rateLimit,    // Rate limiting
  bodyLimit,    // Body size limit
  cacheControl, // Cache headers
  compress,     // Gzip compression
  security      // Security headers
} = require('elit-server');

api.use(cors());
api.use(logger());
api.use(errorHandler());
api.use(rateLimit({ max: 100, window: 60000 }));`))),

      h3('CORS Middleware'),
      pre(code(...codeBlock(`// Allow all origins
api.use(cors());

// Specific origin
api.use(cors({ origin: 'https://example.com' }));

// Multiple origins
api.use(cors({
  origin: ['https://example.com', 'https://app.example.com']
}));

// Dynamic origin
api.use(cors({
  origin: (origin) => {
    return origin.endsWith('.example.com');
  }
}));

// Full configuration
api.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  credentials: true,
  maxAge: 86400
}));`))),

      h3('Logger Middleware'),
      pre(code(...codeBlock(`// Basic logging
api.use(logger());

// Output:
// [GET] /api/users - 200 (15ms)
// [POST] /api/posts - 201 (42ms)
// [DELETE] /api/posts/123 - 204 (8ms)`))),

      h3('Rate Limiting'),
      pre(code(...codeBlock(`// Limit requests per window
api.use(rateLimit({
  max: 100,      // Max 100 requests
  window: 60000  // Per minute (60000ms)
}));

// Per-route rate limiting
api.get('/api/public', (ctx) => {
  return { data: 'Public endpoint' };
});

api.post('/api/expensive',
  rateLimit({ max: 10, window: 60000 }),
  (ctx) => {
    // Expensive operation
    return { result: expensiveOperation() };
  }
);`))),

      h3('Body Size Limit'),
      pre(code(...codeBlock(`// Limit request body size
api.use(bodyLimit(1024 * 1024)); // 1MB limit

// Returns 413 Payload Too Large if exceeded`))),

      h3('Compression'),
      pre(code(...codeBlock(`// Gzip compression for responses
api.use(compress());

// Automatically compresses responses > 1KB`))),

      h3('Security Headers'),
      pre(code(...codeBlock(`// Add security headers
api.use(security());

// Adds these headers:
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY
// X-XSS-Protection: 1; mode=block
// Strict-Transport-Security: max-age=31536000`))),

      h3('Error Handler'),
      pre(code(...codeBlock(`// Catch and format errors
api.use(errorHandler());

// Handles errors gracefully:
api.get('/api/error', (ctx) => {
  throw new Error('Something went wrong!');
  // Returns: { success: false, error: 'Something went wrong!' }
});`))),

      h3('Custom Middleware'),
      pre(code(...codeBlock(`// Create custom middleware
const timing = () => async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(\`Request took \${duration}ms\`);
};

// Authentication middleware
const auth = () => async (ctx, next) => {
  const token = ctx.headers['authorization'];
  if (!token) {
    return { success: false, error: 'Unauthorized' };
  }

  // Verify token
  const user = verifyToken(token);
  if (!user) {
    return { success: false, error: 'Invalid token' };
  }

  // Add user to context
  ctx.user = user;
  await next();
};

// Use custom middleware
api.use(timing());
api.use(auth());

// Protected route
api.get('/api/profile', (ctx) => {
  return { user: ctx.user };
});`))),

      h2('Shared State'),
      h3('Server-Side State'),
      pre(code(...codeBlock(`const server = createDevServer({ port: 3000 });

// Create shared state
const counter = server.state.create('counter', {
  initial: 0,
  validate: (value) => typeof value === 'number'
});

// Listen to changes
counter.onChange((newValue, oldValue) => {
  console.log(\`Counter: \${oldValue} → \${newValue}\`);
});

// Update from server
counter.value++;

// Changes broadcast to all connected clients via WebSocket`))),

      h3('Client-Side Connection'),
      pre(code(...codeBlock(`// In your frontend app
import { createSharedState } from 'elit';

// Connect to server state
const counter = createSharedState('counter', 0);

// Listen to changes
counter.onChange((newValue, oldValue) => {
  console.log('Counter updated!', newValue);
});

// Update from client (syncs to server and other clients)
counter.value++;`))),

      h3('State Validation'),
      pre(code(...codeBlock(`// Validate state updates
const todos = server.state.create('todos', {
  initial: [],
  validate: (value) => {
    if (!Array.isArray(value)) return false;
    return value.every(todo =>
      todo.id &&
      typeof todo.text === 'string' &&
      typeof todo.done === 'boolean'
    );
  }
});

// Invalid updates are rejected
todos.value = 'invalid'; // Rejected!
todos.value = [{ invalid: 'object' }]; // Rejected!
todos.value = [{ id: 1, text: 'Valid', done: false }]; // ✅`))),

      h2('WebSocket Support'),
      p('WebSocket server is automatically created and handles:'),
      ul(
        li('🔥 HMR updates'),
        li('🔄 Shared state synchronization'),
        li('💬 Custom WebSocket messages')
      ),

      pre(code(...codeBlock(`const server = createDevServer({ port: 3000 });

// Access WebSocket server
server.wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send custom message
  ws.send(JSON.stringify({
    type: 'custom:message',
    data: 'Hello from server!'
  }));

  // Handle custom messages
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    if (message.type === 'custom:request') {
      // Handle custom message
    }
  });
});`))),

      h2('Static Files'),
      p('Static files are served automatically from the root directory:'),
      pre(code(...codeBlock(`// File structure:
public/
├── index.html
├── app.js
├── styles.css
└── images/
    └── logo.png

// All accessible at:
http://localhost:3000/
http://localhost:3000/app.js
http://localhost:3000/styles.css
http://localhost:3000/images/logo.png`))),

      p('MIME types are automatically detected:'),
      ul(
        li(code('.html'), ' → ', code('text/html')),
        li(code('.js'), ' → ', code('application/javascript')),
        li(code('.css'), ' → ', code('text/css')),
        li(code('.json'), ' → ', code('application/json')),
        li(code('.png'), ' → ', code('image/png')),
        li(code('.svg'), ' → ', code('image/svg+xml'))
      ),

      h2('Configuration'),
      h3('Full Configuration Options'),
      pre(code(...codeBlock(`const server = createDevServer({
  // Port number
  port: 3000,

  // Root directory for static files
  root: './public',

  // API router
  api: apiRouter,

  // Enable/disable logging
  logging: true,

  // Enable/disable HMR
  hmr: true,

  // Open browser on start
  open: true,

  // Watch additional directories
  watchDirs: ['./src', './components'],

  // Ignore patterns
  ignore: ['node_modules', '*.test.js', 'dist']
});`))),

      h2('Complete Example: Todo API'),
      pre(code(...codeBlock(`const { createDevServer, Router, cors, logger, rateLimit } = require('elit-server');

// In-memory database
let todos = [
  { id: 1, text: 'Learn Elit', done: false },
  { id: 2, text: 'Build app', done: false }
];
let nextId = 3;

// Create router
const api = new Router();

// Add middleware
api.use(cors());
api.use(logger());
api.use(rateLimit({ max: 100, window: 60000 }));

// Routes
api.get('/api/todos', (ctx) => {
  return { success: true, todos };
});

api.get('/api/todos/:id', (ctx) => {
  const todo = todos.find(t => t.id === parseInt(ctx.params.id));
  if (!todo) {
    return { success: false, error: 'Todo not found' };
  }
  return { success: true, todo };
});

api.post('/api/todos', (ctx) => {
  const { text } = ctx.body;
  if (!text) {
    return { success: false, error: 'Text required' };
  }

  const todo = {
    id: nextId++,
    text,
    done: false
  };
  todos.push(todo);

  // Broadcast via shared state
  todosState.value = [...todos];

  return { success: true, todo };
});

api.put('/api/todos/:id', (ctx) => {
  const id = parseInt(ctx.params.id);
  const index = todos.findIndex(t => t.id === id);

  if (index === -1) {
    return { success: false, error: 'Todo not found' };
  }

  todos[index] = { ...todos[index], ...ctx.body, id };
  todosState.value = [...todos];

  return { success: true, todo: todos[index] };
});

api.delete('/api/todos/:id', (ctx) => {
  const id = parseInt(ctx.params.id);
  const index = todos.findIndex(t => t.id === id);

  if (index === -1) {
    return { success: false, error: 'Todo not found' };
  }

  const deleted = todos.splice(index, 1)[0];
  todosState.value = [...todos];

  return { success: true, todo: deleted };
});

// Create server
const server = createDevServer({
  port: 3000,
  root: './public',
  api,
  logging: true
});

// Shared state
const todosState = server.state.create('todos', {
  initial: todos,
  validate: (value) => Array.isArray(value)
});

console.log('Todo API running at http://localhost:3000');`))),

      h2('Production Deployment'),
      h3('Environment Variables'),
      pre(code(...codeBlock(`// Use environment variables
const server = createDevServer({
  port: process.env.PORT || 3000,
  root: process.env.ROOT || './dist',
  logging: process.env.NODE_ENV !== 'production',
  hmr: process.env.NODE_ENV === 'development'
});`))),

      h3('Process Management'),
      pre(code(...codeBlock(`// Graceful shutdown
let isShuttingDown = false;

const shutdown = async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('Shutting down...');

  try {
    await Promise.race([
      server.close(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
    ]);
    console.log('Server closed');
  } catch (error) {
    console.log('Force closing...');
  }

  process.exit(0);
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);`))),

      h3('Docker Deployment'),
      pre(code(...codeBlock(`# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]`))),

      pre(code(...codeBlock(`# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped`))),

      h2('Best Practices'),
      ul(
        li(strong('Separate routes'), ' - Use multiple routers for different API versions'),
        li(strong('Validate input'), ' - Always validate request body and parameters'),
        li(strong('Error handling'), ' - Use errorHandler middleware'),
        li(strong('Rate limiting'), ' - Protect against abuse'),
        li(strong('CORS'), ' - Configure appropriately for your domain'),
        li(strong('Logging'), ' - Use logger middleware in development'),
        li(strong('State validation'), ' - Validate shared state updates'),
        li(strong('Graceful shutdown'), ' - Handle SIGINT/SIGTERM properly')
      ),

      h2('Performance Tips'),
      ul(
        li('⚡ Use ', code('compress()'), ' middleware for large responses'),
        li('📦 Implement ', code('cacheControl()'), ' for static assets'),
        li('🎯 Add ', code('bodyLimit()'), ' to prevent large payloads'),
        li('🔒 Use ', code('rateLimit()'), ' per-route for expensive operations'),
        li('💾 Cache frequently accessed data in memory'),
        li('🗜️ Enable gzip compression for API responses')
      ),

      h2('Debugging'),
      pre(code(...codeBlock(`// Enable detailed logging
const server = createDevServer({
  port: 3000,
  logging: true // Shows all requests and WebSocket events
});

// Check server status
console.log('Server:', server.server.listening);
console.log('WebSocket clients:', server.wss.clients.size);

// Monitor shared state
const state = server.state.create('debug', {
  initial: {},
  validate: () => true
});

state.onChange((newValue, oldValue) => {
  console.log('State changed:', { oldValue, newValue });
});`))),

      h2('Comparison with Other Servers'),
      pre(code(...codeBlock(`┌──────────────────┬─────────────┬──────────────┬────────────────┐
│ Feature          │ elit-server│ Express      │ Fastify        │
├──────────────────┼─────────────┼──────────────┼────────────────┤
│ HMR Built-in     │ ✅          │ ❌           │ ❌             │
│ WebSocket        │ ✅ Built-in │ 🔧 ws package│ 🔧 Plugin      │
│ Shared State     │ ✅ Built-in │ ❌           │ ❌             │
│ Middleware       │ ✅ Built-in │ ✅ Extensive │ ✅ Extensive   │
│ Router           │ ✅ Built-in │ ✅ Built-in  │ ✅ Built-in    │
│ Static Files     │ ✅ Built-in │ 🔧 Middleware│ 🔧 Plugin      │
│ Setup Time       │ 0 config    │ Manual       │ Manual         │
│ Dev Experience   │ ⭐⭐⭐⭐⭐   │ ⭐⭐⭐       │ ⭐⭐⭐⭐       │
└──────────────────┴─────────────┴──────────────┴────────────────┘`))),

      h2('Conclusion'),
      p('elit-server provides everything you need for full-stack development with Elit:'),
      ul(
        li('🔥 ', strong('Zero configuration'), ' - Works out of the box'),
        li('⚡ ', strong('Fast development'), ' - HMR for instant feedback'),
        li('🌐 ', strong('Full REST API'), ' - Express-like routing'),
        li('🔧 ', strong('Rich middleware'), ' - All essentials included'),
        li('🔄 ', strong('Real-time sync'), ' - WebSocket shared state'),
        li('📦 ', strong('Production ready'), ' - Deploy with confidence')
      ),

      p('Get started today and experience the fastest way to build full-stack applications with Elit! 🚀'),

      p('For more examples, check out the ', a({ href: 'https://github.com/oangsa/elit/tree/main/server/example' }, 'elit-server examples'), '.')
    ),
    th: div(
      p('เรียนรู้ทุกอย่างเกี่ยวกับ ', strong('elit-server'), ' - development server แบบไม่ต้องตั้งค่าที่สร้างมาสำหรับ Elit คู่มือครบวงจรนี้ครอบคลุม ', em('HMR, REST API, middleware, shared state, WebSocket'), ' และการ deploy แบบ production'),

      h2('elit-server คืออะไร?'),
      p('elit-server เป็น development server ที่มีฟีเจอร์ครบครันที่ให้:'),
      ul(
        li('🔥 ', strong('Hot Module Replacement'), ' - อัปเดตทันทีโดยไม่ต้อง refresh'),
        li('🌐 ', strong('REST API Router'), ' - Routing แบบ Express พร้อม regex parameters'),
        li('🔧 ', strong('Middleware Stack'), ' - Middleware ในตัว (CORS, logging, rate limiting, etc.)'),
        li('🔄 ', strong('Shared State'), ' - การซิงโครไนซ์ state แบบ real-time ผ่าน WebSocket'),
        li('📁 ', strong('Static Files'), ' - ตรวจจับ MIME type อัตโนมัติ'),
        li('🎯 ', strong('ไม่ต้องตั้งค่า'), ' - ทำงานได้ทันที'),
        li('📦 ', strong('น้ำหนักเบา'), ' - Dependencies น้อย (chokidar, ws, mime-types)')
      ),

      h2('การติดตั้ง'),
      pre(code(...codeBlock(`# ติดตั้งเป็น dev dependency
npm install --save-dev elit-server

# หรือด้วย yarn
yarn add -D elit-server

# หรือด้วย pnpm
pnpm add -D elit-server`))),

      h2('เริ่มต้นอย่างรวดเร็ว'),
      h3('1. Server พื้นฐาน'),
      p('สร้าง ', code('server.js'), ':'),
      pre(code(...codeBlock(`const { createDevServer } = require('elit-server');

// สร้าง server ด้วยค่าเริ่มต้น
const server = createDevServer({
  port: 3000,
  root: './public'
});

console.log('Server ทำงานที่ http://localhost:3000');`))),

      h3('2. ใช้ CLI'),
      pre(code(...codeBlock(`# เริ่ม server (port เริ่มต้น 3000)
npx elit-dev

# กำหนดค่าเอง
npx elit-dev --port 8080 --root ./dist

# ตัวเลือกทั้งหมด
npx elit-dev --port 8080 --root ./public --no-open --silent`))),

      p('ตัวเลือก CLI:'),
      ul(
        li(code('--port'), ' - หมายเลข Port (เริ่มต้น: 3000)'),
        li(code('--root'), ' - ไดเรกทอรีหลัก (เริ่มต้น: ./public)'),
        li(code('--open'), ' - เปิด browser (เริ่มต้น: true)'),
        li(code('--silent'), ' - ปิด logging (เริ่มต้น: false)')
      ),

      h2('REST API Router'),
      h3('Routing พื้นฐาน'),
      pre(code(...codeBlock(`const { Router } = require('elit-server');

const api = new Router();

// GET request
api.get('/api/users', (ctx) => {
  return { success: true, users: [...] };
});

// POST request
api.post('/api/users', (ctx) => {
  const user = ctx.body;
  return { success: true, user };
});

// PUT request
api.put('/api/users/:id', (ctx) => {
  const id = ctx.params.id;
  const updates = ctx.body;
  return { success: true, user: { id, ...updates } };
});

// DELETE request
api.delete('/api/users/:id', (ctx) => {
  const id = ctx.params.id;
  return { success: true, deleted: id };
});

// ส่ง router ไปยัง server
const server = createDevServer({
  port: 3000,
  api
});`))),

      h3('Route Parameters'),
      pre(code(...codeBlock(`// Dynamic segments ด้วย :param
api.get('/api/users/:id', (ctx) => {
  const userId = ctx.params.id;
  return { user: findUser(userId) };
});

// Parameters หลายตัว
api.get('/api/posts/:postId/comments/:commentId', (ctx) => {
  const { postId, commentId } = ctx.params;
  return { post: postId, comment: commentId };
});

// Regex patterns
api.get('/api/users/:id([0-9]+)', (ctx) => {
  // ตรงกับเฉพาะ numeric IDs
  const id = parseInt(ctx.params.id);
  return { user: findUser(id) };
});`))),

      h2('Middleware'),
      h3('Middleware ในตัว'),
      p('elit-server มี middleware เหล่านี้ในตัว:'),

      pre(code(...codeBlock(`const {
  cors,         // CORS headers
  logger,       // Request logging
  errorHandler, // Error handling
  rateLimit,    // Rate limiting
  bodyLimit,    // ขนาด body จำกัด
  cacheControl, // Cache headers
  compress,     // Gzip compression
  security      // Security headers
} = require('elit-server');

api.use(cors());
api.use(logger());
api.use(errorHandler());
api.use(rateLimit({ max: 100, window: 60000 }));`))),

      h3('CORS Middleware'),
      pre(code(...codeBlock(`// อนุญาตทุก origins
api.use(cors());

// Origin เฉพาะ
api.use(cors({ origin: 'https://example.com' }));

// หลาย origins
api.use(cors({
  origin: ['https://example.com', 'https://app.example.com']
}));

// Dynamic origin
api.use(cors({
  origin: (origin) => {
    return origin.endsWith('.example.com');
  }
}));

// กำหนดค่าแบบเต็ม
api.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  credentials: true,
  maxAge: 86400
}));`))),

      h3('Rate Limiting'),
      pre(code(...codeBlock(`// จำกัด requests ต่อช่วงเวลา
api.use(rateLimit({
  max: 100,      // สูงสุด 100 requests
  window: 60000  // ต่อนาที (60000ms)
}));

// Rate limiting ต่อ route
api.get('/api/public', (ctx) => {
  return { data: 'Public endpoint' };
});

api.post('/api/expensive',
  rateLimit({ max: 10, window: 60000 }),
  (ctx) => {
    // การดำเนินการที่ใช้ทรัพยากรมาก
    return { result: expensiveOperation() };
  }
);`))),

      h3('Custom Middleware'),
      pre(code(...codeBlock(`// สร้าง custom middleware
const timing = () => async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(\`Request ใช้เวลา \${duration}ms\`);
};

// Authentication middleware
const auth = () => async (ctx, next) => {
  const token = ctx.headers['authorization'];
  if (!token) {
    return { success: false, error: 'Unauthorized' };
  }

  // ตรวจสอบ token
  const user = verifyToken(token);
  if (!user) {
    return { success: false, error: 'Invalid token' };
  }

  // เพิ่ม user ไปยัง context
  ctx.user = user;
  await next();
};

// ใช้ custom middleware
api.use(timing());
api.use(auth());

// Protected route
api.get('/api/profile', (ctx) => {
  return { user: ctx.user };
});`))),

      h2('Shared State'),
      h3('State ฝั่ง Server'),
      pre(code(...codeBlock(`const server = createDevServer({ port: 3000 });

// สร้าง shared state
const counter = server.state.create('counter', {
  initial: 0,
  validate: (value) => typeof value === 'number'
});

// รับฟังการเปลี่ยนแปลง
counter.onChange((newValue, oldValue) => {
  console.log(\`Counter: \${oldValue} → \${newValue}\`);
});

// อัปเดตจาก server
counter.value++;

// การเปลี่ยนแปลง broadcast ไปทุก clients ผ่าน WebSocket`))),

      h3('การเชื่อมต่อฝั่ง Client'),
      pre(code(...codeBlock(`// ใน frontend app
import { createSharedState } from 'elit';

// เชื่อมต่อกับ server state
const counter = createSharedState('counter', 0);

// รับฟังการเปลี่ยนแปลง
counter.onChange((newValue, oldValue) => {
  console.log('Counter อัปเดต!', newValue);
});

// อัปเดตจาก client (syncs ไปยัง server และ clients อื่น)
counter.value++;`))),

      h2('ตัวอย่างครบถ้วน: Todo API'),
      pre(code(...codeBlock(`const { createDevServer, Router, cors, logger, rateLimit } = require('elit-server');

// ฐานข้อมูลใน memory
let todos = [
  { id: 1, text: 'เรียน Elit', done: false },
  { id: 2, text: 'สร้างแอป', done: false }
];
let nextId = 3;

// สร้าง router
const api = new Router();

// เพิ่ม middleware
api.use(cors());
api.use(logger());
api.use(rateLimit({ max: 100, window: 60000 }));

// Routes
api.get('/api/todos', (ctx) => {
  return { success: true, todos };
});

api.post('/api/todos', (ctx) => {
  const { text } = ctx.body;
  if (!text) {
    return { success: false, error: 'Text required' };
  }

  const todo = {
    id: nextId++,
    text,
    done: false
  };
  todos.push(todo);

  // Broadcast ผ่าน shared state
  todosState.value = [...todos];

  return { success: true, todo };
});

// สร้าง server
const server = createDevServer({
  port: 3000,
  root: './public',
  api,
  logging: true
});

// Shared state
const todosState = server.state.create('todos', {
  initial: todos,
  validate: (value) => Array.isArray(value)
});

console.log('Todo API ทำงานที่ http://localhost:3000');`))),

      h2('การ Deploy แบบ Production'),
      h3('Environment Variables'),
      pre(code(...codeBlock(`// ใช้ environment variables
const server = createDevServer({
  port: process.env.PORT || 3000,
  root: process.env.ROOT || './dist',
  logging: process.env.NODE_ENV !== 'production',
  hmr: process.env.NODE_ENV === 'development'
});`))),

      h3('Docker Deployment'),
      pre(code(...codeBlock(`# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]`))),

      h2('แนวทางปฏิบัติที่ดี'),
      ul(
        li(strong('แยก routes'), ' - ใช้ routers หลายตัวสำหรับ API versions ต่างๆ'),
        li(strong('Validate input'), ' - ตรวจสอบ request body และ parameters เสมอ'),
        li(strong('Error handling'), ' - ใช้ errorHandler middleware'),
        li(strong('Rate limiting'), ' - ป้องกันการใช้งานมากเกินไป'),
        li(strong('CORS'), ' - กำหนดค่าอย่างเหมาะสมสำหรับโดเมนของคุณ'),
        li(strong('Logging'), ' - ใช้ logger middleware ในการพัฒนา'),
        li(strong('State validation'), ' - ตรวจสอบการอัปเดต shared state'),
        li(strong('Graceful shutdown'), ' - จัดการ SIGINT/SIGTERM อย่างถูกต้อง')
      ),

      h2('เคล็ดลับด้านประสิทธิภาพ'),
      ul(
        li('⚡ ใช้ ', code('compress()'), ' middleware สำหรับ responses ขนาดใหญ่'),
        li('📦 ใช้ ', code('cacheControl()'), ' สำหรับ static assets'),
        li('🎯 เพิ่ม ', code('bodyLimit()'), ' เพื่อป้องกัน payloads ขนาดใหญ่'),
        li('🔒 ใช้ ', code('rateLimit()'), ' ต่อ route สำหรับ operations ที่ใช้ทรัพยากรมาก'),
        li('💾 Cache ข้อมูลที่เข้าถึงบ่อยใน memory'),
        li('🗜️ เปิดใช้งาน gzip compression สำหรับ API responses')
      ),

      h2('สรุป'),
      p('elit-server ให้ทุกสิ่งที่คุณต้องการสำหรับการพัฒนา full-stack ด้วย Elit:'),
      ul(
        li('🔥 ', strong('ไม่ต้องตั้งค่า'), ' - ทำงานได้ทันที'),
        li('⚡ ', strong('พัฒนาเร็ว'), ' - HMR สำหรับ feedback ทันที'),
        li('🌐 ', strong('REST API เต็มรูปแบบ'), ' - Routing แบบ Express'),
        li('🔧 ', strong('Middleware หลากหลาย'), ' - มีสิ่งที่จำเป็นทั้งหมด'),
        li('🔄 ', strong('Sync แบบ Real-time'), ' - WebSocket shared state'),
        li('📦 ', strong('พร้อม Production'), ' - Deploy ได้อย่างมั่นใจ')
      ),

      p('เริ่มต้นวันนี้และสัมผัสวิธีที่เร็วที่สุดในการสร้าง full-stack applications ด้วย Elit! 🚀')
    )
  }
};
