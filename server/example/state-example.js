/**
 * Shared State Example with elit-server
 * Demonstrates real-time state sync between backend and frontend
 */

const { createDevServer, Router, json } = require('../dist/index.js');

// Create API router
const api = new Router();

// Create dev server
const server = createDevServer({
  port: 3000,
  root: __dirname,
  api,
  logging: true
});

// Create shared states
const chatMessages = server.state.create('chat', {
  initial: [],
  validate: (value) => Array.isArray(value)
});

const onlineUsers = server.state.create('online-users', {
  initial: new Set(),
  validate: (value) => value instanceof Set || Array.isArray(value)
});

const serverStats = server.state.create('server-stats', {
  initial: {
    uptime: 0,
    connections: 0,
    messagesCount: 0
  }
});

// Listen to chat messages changes
chatMessages.onChange((newMessages, oldMessages) => {
  console.log(`[Chat] Messages updated: ${oldMessages.length} -> ${newMessages.length}`);

  // Update stats
  serverStats.update(stats => ({
    ...stats,
    messagesCount: newMessages.length
  }));
});

// Listen to online users changes
onlineUsers.onChange((newUsers) => {
  const userArray = newUsers instanceof Set ? Array.from(newUsers) : newUsers;
  console.log(`[Users] Online: ${userArray.length} users`);

  // Update stats
  serverStats.update(stats => ({
    ...stats,
    connections: userArray.length
  }));
});

// Update uptime every second
const startTime = Date.now();
setInterval(() => {
  serverStats.update(stats => ({
    ...stats,
    uptime: Math.floor((Date.now() - startTime) / 1000)
  }));
}, 1000);

// API Routes for traditional REST access
api.get('/api/messages', (ctx) => {
  json(ctx.res, {
    success: true,
    data: chatMessages.value
  });
});

api.post('/api/messages', (ctx) => {
  const { text, user } = ctx.body;

  if (!text || !user) {
    return json(ctx.res, {
      success: false,
      error: 'Text and user are required'
    }, 400);
  }

  const message = {
    id: Date.now(),
    text,
    user,
    timestamp: new Date().toISOString()
  };

  // Update shared state (will auto-broadcast to all clients)
  chatMessages.value = [...chatMessages.value, message];

  json(ctx.res, {
    success: true,
    data: message
  }, 201);
});

api.get('/api/stats', (ctx) => {
  json(ctx.res, {
    success: true,
    data: serverStats.value
  });
});

console.log('\n📡 Shared State Server');
console.log('\nShared States:');
console.log('  • chat             - Chat messages');
console.log('  • online-users     - Online users');
console.log('  • server-stats     - Server statistics');
console.log('\n💡 Open http://localhost:3000/state-demo.html');
console.log('   Open multiple tabs to see real-time sync!\n');

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
