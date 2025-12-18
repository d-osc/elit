import {
  div, h1, h2, h3, p, ul, li, pre, code, strong, em, a
} from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog18: BlogPostDetail = {
  id: '18',
  title: {
    en: 'Complete Guide to Elit 2.0',
    th: 'คู่มือครบวงจร Elit 2.0'
  },
  date: '2024-04-15',
  author: 'n-devs',
  tags: ['Tutorial', 'Elit 2.0', 'CLI', 'Build System', 'Full Stack'],
  content: {
    en: div(
      p('Learn everything about ', strong('Elit 2.0'), ' - the complete full-stack TypeScript framework. This comprehensive guide covers ', em('CLI tools, development server, build system, HMR, REST API, middleware'), ', and production deployment.'),

      h2('What is Elit 2.0?'),
      p('Elit 2.0 is a complete full-stack TypeScript framework that provides:'),
      ul(
        li('⚡ ', strong('CLI Tools'), ' - npx elit dev/build/preview for complete workflow'),
        li('🏗️ ', strong('Build System'), ' - Integrated esbuild with optimizations'),
        li('🔥 ', strong('Hot Module Replacement'), ' - Instant updates without refresh'),
        li('🌐 ', strong('REST API Router'), ' - Express-like routing with regex parameters'),
        li('🔧 ', strong('Middleware Stack'), ' - Built-in middleware (CORS, logging, rate limiting, etc.)'),
        li('🔄 ', strong('Shared State'), ' - Real-time WebSocket state synchronization'),
        li('📁 ', strong('Static Files'), ' - Automatic MIME type detection with gzip'),
        li('🎯 ', strong('Zero Config'), ' - Works out of the box'),
        li('📦 ', strong('Lightweight'), ' - ~10KB gzipped, minimal dependencies')
      ),

      h2('Installation'),
      pre(code(...codeBlock(`# Install Elit 2.0
npm install elit

# No additional packages needed - everything is integrated!`))),

      h2('Quick Start'),
      h3('1. Development Server'),
      p('Start the dev server with HMR:'),
      pre(code(...codeBlock(`# Start dev server (default port 3000)
npx elit dev

# Custom configuration
npx elit dev --port 8080 --root ./public

# All options
npx elit dev --port 8080 --root ./public --no-open --silent`))),

      p('CLI Options:'),
      ul(
        li(code('--port, -p'), ' - Port number (default: 3000)'),
        li(code('--host, -h'), ' - Host to bind to (default: localhost)'),
        li(code('--root, -r'), ' - Root directory'),
        li(code('--no-open'), ' - Don\'t open browser'),
        li(code('--silent'), ' - Disable logging')
      ),

      h3('2. Build for Production'),
      p('Build your application:'),
      pre(code(...codeBlock(`# Build with config file
npx elit build

# Build with CLI options
npx elit build --entry src/app.ts --out-dir dist

# All build options
npx elit build --entry src/app.ts --out-dir dist --format esm --sourcemap`))),

      p('Build Options:'),
      ul(
        li(code('--entry, -e'), ' - Entry file (required)'),
        li(code('--out-dir, -o'), ' - Output directory (default: dist)'),
        li(code('--format, -f'), ' - Output format: esm, cjs, iife (default: esm)'),
        li(code('--no-minify'), ' - Disable minification'),
        li(code('--sourcemap'), ' - Generate sourcemap'),
        li(code('--silent'), ' - Disable logging')
      ),

      h3('3. Preview Production Build'),
      p('Preview your production build:'),
      pre(code(...codeBlock(`# Preview (default port 4173)
npx elit preview

# Custom configuration
npx elit preview --port 5000 --root dist`))),

      h3('4. Configuration File'),
      p('Create ', code('elit.config.ts'), ' for advanced configuration:'),
      pre(code(...codeBlock(`import { defineConfig } from 'elit';

export default defineConfig({
  dev: {
    port: 3000,
    clients: [
      { root: './public', basePath: '/' }
    ]
  },
  build: {
    entry: 'src/app.ts',
    outDir: 'dist',
    format: 'esm',
    minify: true,
    sourcemap: false
  },
  preview: {
    port: 4173,
    root: 'dist'
  }
});`))),

      h2('REST API Router'),
      h3('Basic Routing'),
      p('Create APIs using the built-in Router:'),
      pre(code(...codeBlock(`import { Router, createDevServer } from 'elit';

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

// Use with dev server
const server = createDevServer({
  port: 3000,
  root: './public',
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

      h2('Environment Variables'),
      p('Elit 2.0 has built-in environment variables support:'),
      h3('Loading .env Files'),
      pre(code(...codeBlock(`# .env
VITE_API_URL=https://api.example.com
VITE_APP_NAME=My App
DATABASE_URL=postgres://localhost/mydb

# .env.production
VITE_API_URL=https://api.production.com
MODE=production`))),

      p('Environment variables are automatically loaded with this priority:'),
      ul(
        li(code('.env.[mode].local'), ' - Mode-specific local (highest priority)'),
        li(code('.env.[mode]'), ' - Mode-specific'),
        li(code('.env.local'), ' - Local'),
        li(code('.env'), ' - Default (lowest priority)')
      ),

      h3('Using in Build'),
      p('Variables prefixed with ', code('VITE_'), ' are injected into client code:'),
      pre(code(...codeBlock(`// Access in your frontend code
console.log(import.meta.env.VITE_API_URL);
console.log(import.meta.env.MODE);
console.log(import.meta.env.DEV);
console.log(import.meta.env.PROD);`))),

      h2('Middleware'),
      h3('Built-in Middleware'),
      p('Elit 2.0 includes these middleware out of the box:'),

      pre(code(...codeBlock(`import {
  cors,         // CORS headers
  logger,       // Request logging
  errorHandler, // Error handling
  rateLimit,    // Rate limiting
  bodyLimit,    // Body size limit
  cacheControl, // Cache headers
  compress,     // Gzip compression
  security      // Security headers
} from 'elit';

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
      h3('Build Workflow'),
      pre(code(...codeBlock(`# 1. Build your application
npx elit build --entry src/app.ts --out-dir dist

# 2. Preview locally before deployment
npx elit preview --port 4173 --root dist

# 3. Deploy the dist folder to your hosting provider`))),

      h3('Deploy to Vercel'),
      pre(code(...codeBlock(`# Install Vercel CLI
npm i -g vercel

# Build
npx elit build

# Deploy
vercel --prod

# Or use vercel.json:
{
  "buildCommand": "npx elit build",
  "outputDirectory": "dist"
}`))),

      h3('Deploy to Netlify'),
      pre(code(...codeBlock(`# Install Netlify CLI
npm i -g netlify-cli

# Build
npx elit build

# Deploy
netlify deploy --prod --dir=dist

# Or use netlify.toml:
[build]
  command = "npx elit build"
  publish = "dist"`))),

      h3('Deploy to GitHub Pages'),
      p('For GitHub Pages, set the ', code('basePath'), ' in your config:'),
      pre(code(...codeBlock(`// elit.config.ts
export default defineConfig({
  build: {
    entry: 'src/app.ts',
    outDir: 'dist'
  },
  preview: {
    basePath: '/your-repo-name'
  }
});

# Build and deploy
npx elit build
# Then commit and push dist folder or use gh-pages`))),

      h3('Docker Deployment'),
      pre(code(...codeBlock(`# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

# Build the application
RUN npx elit build

EXPOSE 4173

# Preview the production build
CMD ["npx", "elit", "preview", "--port", "4173"]`))),

      pre(code(...codeBlock(`# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "4173:4173"
    environment:
      - NODE_ENV=production
    restart: unless-stopped`))),

      h3('Node.js Production Server'),
      p('For a custom Node.js production server:'),
      pre(code(...codeBlock(`// server.js
import { createDevServer } from 'elit';

const server = createDevServer({
  port: process.env.PORT || 3000,
  root: './dist',
  logging: false,
  hmr: false,
  open: false
});

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down...');
  await server.close();
  process.exit(0);
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);`))),

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

      h2('Comparison with Other Frameworks'),
      pre(code(...codeBlock(`┌──────────────────┬─────────────┬──────────────┬────────────────┐
│ Feature          │ Elit 2.0    │ Vite + React │ Next.js        │
├──────────────────┼─────────────┼──────────────┼────────────────┤
│ CLI Tools        │ ✅ Built-in │ ✅ Built-in  │ ✅ Built-in    │
│ Build System     │ ✅ esbuild  │ ✅ esbuild   │ ✅ Turbopack   │
│ HMR Built-in     │ ✅          │ ✅           │ ✅             │
│ REST API         │ ✅ Built-in │ ❌           │ ✅ API Routes  │
│ WebSocket        │ ✅ Built-in │ ❌           │ 🔧 External    │
│ Shared State     │ ✅ Built-in │ 🔧 Redux/etc │ 🔧 External    │
│ Middleware       │ ✅ Built-in │ ❌           │ ✅ Built-in    │
│ Static Files     │ ✅ Built-in │ ✅ Built-in  │ ✅ Built-in    │
│ Size (gzipped)   │ ~10KB       │ ~45KB        │ ~90KB          │
│ Setup Time       │ 0 config    │ npx create   │ npx create     │
│ Learning Curve   │ ⭐⭐        │ ⭐⭐⭐⭐     │ ⭐⭐⭐⭐⭐      │
└──────────────────┴─────────────┴──────────────┴────────────────┘`))),

      h2('Conclusion'),
      p('Elit 2.0 provides everything you need for full-stack TypeScript development:'),
      ul(
        li('⚡ ', strong('Complete CLI'), ' - dev, build, preview in one package'),
        li('🏗️ ', strong('Integrated build'), ' - No separate bundler setup needed'),
        li('🔥 ', strong('Zero configuration'), ' - Works out of the box'),
        li('⚡ ', strong('Fast development'), ' - HMR for instant feedback'),
        li('🌐 ', strong('Full REST API'), ' - Express-like routing'),
        li('🔧 ', strong('Rich middleware'), ' - All essentials included'),
        li('🔄 ', strong('Real-time sync'), ' - WebSocket shared state'),
        li('📦 ', strong('Production ready'), ' - Deploy anywhere'),
        li('🎯 ', strong('Lightweight'), ' - Only ~10KB gzipped')
      ),

      p('Get started today and experience the fastest way to build full-stack TypeScript applications! 🚀'),

      p('For more information, visit the ', a({ href: 'https://github.com/oangsa/elit' }, 'Elit GitHub repository'), '.')
    ),
    th: div(
      p('เรียนรู้ทุกอย่างเกี่ยวกับ ', strong('Elit 2.0'), ' - full-stack TypeScript framework ที่สมบูรณ์ คู่มือครบวงจรนี้ครอบคลุม ', em('CLI tools, development server, build system, HMR, REST API, middleware'), ' และการ deploy แบบ production'),

      h2('Elit 2.0 คืออะไร?'),
      p('Elit 2.0 เป็น full-stack TypeScript framework ที่สมบูรณ์ที่ให้:'),
      ul(
        li('⚡ ', strong('CLI Tools'), ' - npx elit dev/build/preview สำหรับ workflow ที่สมบูรณ์'),
        li('🏗️ ', strong('Build System'), ' - esbuild ที่รวมไว้พร้อมการ optimize'),
        li('🔥 ', strong('Hot Module Replacement'), ' - อัปเดตทันทีโดยไม่ต้อง refresh'),
        li('🌐 ', strong('REST API Router'), ' - Routing แบบ Express พร้อม regex parameters'),
        li('🔧 ', strong('Middleware Stack'), ' - Middleware ในตัว (CORS, logging, rate limiting, etc.)'),
        li('🔄 ', strong('Shared State'), ' - การซิงโครไนซ์ state แบบ real-time ผ่าน WebSocket'),
        li('📁 ', strong('Static Files'), ' - ตรวจจับ MIME type อัตโนมัติพร้อม gzip'),
        li('🎯 ', strong('ไม่ต้องตั้งค่า'), ' - ทำงานได้ทันที'),
        li('📦 ', strong('น้ำหนักเบา'), ' - ~10KB gzipped, dependencies น้อย')
      ),

      h2('การติดตั้ง'),
      pre(code(...codeBlock(`# ติดตั้ง Elit 2.0
npm install elit

# ไม่ต้องติดตั้ง packages เพิ่ม - ทุกอย่างรวมอยู่แล้ว!`))),

      h2('เริ่มต้นอย่างรวดเร็ว'),
      h3('1. Development Server'),
      p('เริ่ม dev server พร้อม HMR:'),
      pre(code(...codeBlock(`# เริ่ม dev server (port เริ่มต้น 3000)
npx elit dev

# กำหนดค่าเอง
npx elit dev --port 8080 --root ./public

# ตัวเลือกทั้งหมด
npx elit dev --port 8080 --root ./public --no-open --silent`))),

      p('ตัวเลือก CLI:'),
      ul(
        li(code('--port, -p'), ' - หมายเลข Port (เริ่มต้น: 3000)'),
        li(code('--host, -h'), ' - Host ที่จะ bind (เริ่มต้น: localhost)'),
        li(code('--root, -r'), ' - ไดเรกทอรีหลัก'),
        li(code('--no-open'), ' - ไม่เปิด browser'),
        li(code('--silent'), ' - ปิด logging')
      ),

      h3('2. Build สำหรับ Production'),
      p('Build แอปพลิเคชันของคุณ:'),
      pre(code(...codeBlock(`# Build ด้วย config file
npx elit build

# Build ด้วย CLI options
npx elit build --entry src/app.ts --out-dir dist

# ตัวเลือก build ทั้งหมด
npx elit build --entry src/app.ts --out-dir dist --format esm --sourcemap`))),

      p('ตัวเลือก Build:'),
      ul(
        li(code('--entry, -e'), ' - ไฟล์ Entry (จำเป็น)'),
        li(code('--out-dir, -o'), ' - ไดเรกทอรี Output (เริ่มต้น: dist)'),
        li(code('--format, -f'), ' - Output format: esm, cjs, iife (เริ่มต้น: esm)'),
        li(code('--no-minify'), ' - ปิด minification'),
        li(code('--sourcemap'), ' - สร้าง sourcemap'),
        li(code('--silent'), ' - ปิด logging')
      ),

      h3('3. Preview Production Build'),
      p('ดูตัวอย่าง production build:'),
      pre(code(...codeBlock(`# Preview (port เริ่มต้น 4173)
npx elit preview

# กำหนดค่าเอง
npx elit preview --port 5000 --root dist`))),

      h3('4. ไฟล์กำหนดค่า'),
      p('สร้าง ', code('elit.config.ts'), ' สำหรับการกำหนดค่าขั้นสูง:'),
      pre(code(...codeBlock(`import { defineConfig } from 'elit';

export default defineConfig({
  dev: {
    port: 3000,
    clients: [
      { root: './public', basePath: '/' }
    ]
  },
  build: {
    entry: 'src/app.ts',
    outDir: 'dist',
    format: 'esm',
    minify: true,
    sourcemap: false
  },
  preview: {
    port: 4173,
    root: 'dist'
  }
});`))),

      h2('Environment Variables'),
      p('Elit 2.0 มีการรองรับ environment variables ในตัว:'),
      h3('โหลดไฟล์ .env'),
      pre(code(...codeBlock(`# .env
VITE_API_URL=https://api.example.com
VITE_APP_NAME=My App
DATABASE_URL=postgres://localhost/mydb

# .env.production
VITE_API_URL=https://api.production.com
MODE=production`))),

      p('Environment variables ถูกโหลดอัตโนมัติตามลำดับความสำคัญ:'),
      ul(
        li(code('.env.[mode].local'), ' - Local เฉพาะ mode (ความสำคัญสูงสุด)'),
        li(code('.env.[mode]'), ' - เฉพาะ mode'),
        li(code('.env.local'), ' - Local'),
        li(code('.env'), ' - ค่าเริ่มต้น (ความสำคัญต่ำสุด)')
      ),

      h3('ใช้ใน Build'),
      p('ตัวแปรที่ขึ้นต้นด้วย ', code('VITE_'), ' จะถูก inject เข้าไปใน client code:'),
      pre(code(...codeBlock(`// เข้าถึงใน frontend code
console.log(import.meta.env.VITE_API_URL);
console.log(import.meta.env.MODE);
console.log(import.meta.env.DEV);
console.log(import.meta.env.PROD);`))),

      h2('REST API Router'),
      h3('Routing พื้นฐาน'),
      p('สร้าง APIs ด้วย Router ในตัว:'),
      pre(code(...codeBlock(`import { Router, createDevServer } from 'elit';

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

// ใช้กับ dev server
const server = createDevServer({
  port: 3000,
  root: './public',
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
      p('Elit 2.0 มี middleware เหล่านี้ในตัว:'),

      pre(code(...codeBlock(`import {
  cors,         // CORS headers
  logger,       // Request logging
  errorHandler, // Error handling
  rateLimit,    // Rate limiting
  bodyLimit,    // ขนาด body จำกัด
  cacheControl, // Cache headers
  compress,     // Gzip compression
  security      // Security headers
} from 'elit';

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
      pre(code(...codeBlock(`import { createDevServer, Router, cors, logger, rateLimit } from 'elit';

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
      h3('Build Workflow'),
      pre(code(...codeBlock(`# 1. Build แอปพลิเคชัน
npx elit build --entry src/app.ts --out-dir dist

# 2. Preview ก่อน deploy
npx elit preview --port 4173 --root dist

# 3. Deploy โฟลเดอร์ dist ไปยัง hosting provider`))),

      h3('Deploy ไปยัง Vercel'),
      pre(code(...codeBlock(`# ติดตั้ง Vercel CLI
npm i -g vercel

# Build
npx elit build

# Deploy
vercel --prod

# หรือใช้ vercel.json:
{
  "buildCommand": "npx elit build",
  "outputDirectory": "dist"
}`))),

      h3('Deploy ไปยัง Netlify'),
      pre(code(...codeBlock(`# ติดตั้ง Netlify CLI
npm i -g netlify-cli

# Build
npx elit build

# Deploy
netlify deploy --prod --dir=dist

# หรือใช้ netlify.toml:
[build]
  command = "npx elit build"
  publish = "dist"`))),

      h3('Deploy ไปยัง GitHub Pages'),
      p('สำหรับ GitHub Pages ตั้งค่า ', code('basePath'), ' ใน config:'),
      pre(code(...codeBlock(`// elit.config.ts
export default defineConfig({
  build: {
    entry: 'src/app.ts',
    outDir: 'dist'
  },
  preview: {
    basePath: '/your-repo-name'
  }
});

# Build และ deploy
npx elit build
# จากนั้น commit และ push โฟลเดอร์ dist หรือใช้ gh-pages`))),

      h3('Docker Deployment'),
      pre(code(...codeBlock(`# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

# Build แอปพลิเคชัน
RUN npx elit build

EXPOSE 4173

# Preview production build
CMD ["npx", "elit", "preview", "--port", "4173"]`))),

      pre(code(...codeBlock(`# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "4173:4173"
    environment:
      - NODE_ENV=production
    restart: unless-stopped`))),

      h3('Node.js Production Server'),
      p('สำหรับ Node.js production server แบบกำหนดเอง:'),
      pre(code(...codeBlock(`// server.js
import { createDevServer } from 'elit';

const server = createDevServer({
  port: process.env.PORT || 3000,
  root: './dist',
  logging: false,
  hmr: false,
  open: false
});

// Graceful shutdown
const shutdown = async () => {
  console.log('กำลังปิด...');
  await server.close();
  process.exit(0);
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);`))),

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

      h2('เปรียบเทียบกับ Frameworks อื่น'),
      pre(code(...codeBlock(`┌──────────────────┬─────────────┬──────────────┬────────────────┐
│ Feature          │ Elit 2.0    │ Vite + React │ Next.js        │
├──────────────────┼─────────────┼──────────────┼────────────────┤
│ CLI Tools        │ ✅ ในตัว    │ ✅ ในตัว     │ ✅ ในตัว       │
│ Build System     │ ✅ esbuild  │ ✅ esbuild   │ ✅ Turbopack   │
│ HMR Built-in     │ ✅          │ ✅           │ ✅             │
│ REST API         │ ✅ ในตัว    │ ❌           │ ✅ API Routes  │
│ WebSocket        │ ✅ ในตัว    │ ❌           │ 🔧 External    │
│ Shared State     │ ✅ ในตัว    │ 🔧 Redux/etc │ 🔧 External    │
│ Middleware       │ ✅ ในตัว    │ ❌           │ ✅ ในตัว       │
│ Static Files     │ ✅ ในตัว    │ ✅ ในตัว     │ ✅ ในตัว       │
│ Size (gzipped)   │ ~10KB       │ ~45KB        │ ~90KB          │
│ Setup Time       │ 0 config    │ npx create   │ npx create     │
│ Learning Curve   │ ⭐⭐        │ ⭐⭐⭐⭐     │ ⭐⭐⭐⭐⭐      │
└──────────────────┴─────────────┴──────────────┴────────────────┘`))),

      h2('สรุป'),
      p('Elit 2.0 ให้ทุกสิ่งที่คุณต้องการสำหรับการพัฒนา full-stack TypeScript:'),
      ul(
        li('⚡ ', strong('CLI สมบูรณ์'), ' - dev, build, preview ในแพ็กเกจเดียว'),
        li('🏗️ ', strong('Build รวมอยู่'), ' - ไม่ต้องตั้งค่า bundler แยก'),
        li('🔥 ', strong('ไม่ต้องตั้งค่า'), ' - ทำงานได้ทันที'),
        li('⚡ ', strong('พัฒนาเร็ว'), ' - HMR สำหรับ feedback ทันที'),
        li('🌐 ', strong('REST API เต็มรูปแบบ'), ' - Routing แบบ Express'),
        li('🔧 ', strong('Middleware หลากหลาย'), ' - มีสิ่งที่จำเป็นทั้งหมด'),
        li('🔄 ', strong('Sync แบบ Real-time'), ' - WebSocket shared state'),
        li('📦 ', strong('พร้อม Production'), ' - Deploy ได้ทุกที่'),
        li('🎯 ', strong('น้ำหนักเบา'), ' - เพียง ~10KB gzipped')
      ),

      p('เริ่มต้นวันนี้และสัมผัสวิธีที่เร็วที่สุดในการสร้าง full-stack TypeScript applications! 🚀'),

      p('สำหรับข้อมูลเพิ่มเติม เยี่ยมชม ', a({ href: 'https://github.com/oangsa/elit' }, 'Elit GitHub repository'), '.')
    )
  }
};
