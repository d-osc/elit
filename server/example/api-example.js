/**
 * REST API Example with elit-server
 */

const { createDevServer, Router, cors, logger, errorHandler, json } = require('../dist/index.js');

// Create API router
const api = new Router();

// Add middleware
api.use(cors());
api.use(logger({ format: 'detailed' }));
api.use(errorHandler());

// In-memory data store
const todos = [
  { id: 1, title: 'Learn Elit', completed: false },
  { id: 2, title: 'Build REST API', completed: true },
  { id: 3, title: 'Deploy to production', completed: false }
];

let nextId = 4;

// API Routes
api.get('/api/todos', (ctx) => {
  json(ctx.res, { success: true, data: todos });
});

api.get('/api/todos/:id', (ctx) => {
  const todo = todos.find(t => t.id === parseInt(ctx.params.id));
  if (!todo) {
    return json(ctx.res, { success: false, error: 'Todo not found' }, 404);
  }
  json(ctx.res, { success: true, data: todo });
});

api.post('/api/todos', (ctx) => {
  const { title } = ctx.body;
  if (!title) {
    return json(ctx.res, { success: false, error: 'Title is required' }, 400);
  }

  const newTodo = {
    id: nextId++,
    title,
    completed: false
  };

  todos.push(newTodo);
  json(ctx.res, { success: true, data: newTodo }, 201);
});

api.put('/api/todos/:id', (ctx) => {
  const todo = todos.find(t => t.id === parseInt(ctx.params.id));
  if (!todo) {
    return json(ctx.res, { success: false, error: 'Todo not found' }, 404);
  }

  if (ctx.body.title !== undefined) {
    todo.title = ctx.body.title;
  }
  if (ctx.body.completed !== undefined) {
    todo.completed = ctx.body.completed;
  }

  json(ctx.res, { success: true, data: todo });
});

api.patch('/api/todos/:id/toggle', (ctx) => {
  const todo = todos.find(t => t.id === parseInt(ctx.params.id));
  if (!todo) {
    return json(ctx.res, { success: false, error: 'Todo not found' }, 404);
  }

  todo.completed = !todo.completed;
  json(ctx.res, { success: true, data: todo });
});

api.delete('/api/todos/:id', (ctx) => {
  const index = todos.findIndex(t => t.id === parseInt(ctx.params.id));
  if (index === -1) {
    return json(ctx.res, { success: false, error: 'Todo not found' }, 404);
  }

  const deleted = todos.splice(index, 1)[0];
  json(ctx.res, { success: true, data: deleted });
});

// Health check
api.get('/api/health', (ctx) => {
  json(ctx.res, { status: 'ok', timestamp: Date.now() });
});

// Create dev server with API
const server = createDevServer({
  port: 3000,
  root: __dirname,
  api,
  logging: true
});

console.log('\n📡 REST API Endpoints:');
console.log('  GET    /api/health           - Health check');
console.log('  GET    /api/todos            - Get all todos');
console.log('  GET    /api/todos/:id        - Get single todo');
console.log('  POST   /api/todos            - Create new todo');
console.log('  PUT    /api/todos/:id        - Update todo');
console.log('  PATCH  /api/todos/:id/toggle - Toggle todo completion');
console.log('  DELETE /api/todos/:id        - Delete todo');
console.log('\n💡 Try these commands:');
console.log('  curl http://localhost:3000/api/todos');
console.log('  curl http://localhost:3000/api/todos/1');
console.log('  curl -X POST http://localhost:3000/api/todos -H "Content-Type: application/json" -d \'{"title":"New Task"}\'');
console.log('  curl -X PATCH http://localhost:3000/api/todos/1/toggle');
console.log('');

// Graceful shutdown (prevent multiple handler registrations)
let isShuttingDown = false;
const shutdown = async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('\n\nShutting down...');

  try {
    await Promise.race([
      server.close(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
    ]);
  } catch (error) {
    console.log('Force closing...');
  }

  process.exit(0);
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
