/**
 * Shared State Server for Elit
 * Demonstrates shared state with Elit's reactive system
 */

const { createDevServer } = require('../dist/index.js');

// Create dev server
const server = createDevServer({
  port: 3000,
  root: __dirname,
  logging: true
});

// Create shared states
const counter = server.state.create('counter', {
  initial: 0
});

const messages = server.state.create('messages', {
  initial: [],
  validate: (value) => Array.isArray(value)
});

// Listen to counter changes
counter.onChange((newValue, oldValue) => {
  console.log(`[Counter] ${oldValue} → ${newValue}`);
});

// Listen to messages changes
messages.onChange((newMessages, oldMessages) => {
  console.log(`[Messages] Count: ${oldMessages.length} → ${newMessages.length}`);
  if (newMessages.length > oldMessages.length) {
    const latest = newMessages[newMessages.length - 1];
    console.log(`  New message: "${latest.text}" at ${latest.time}`);
  }
});

// Auto-increment counter every 5 seconds (optional - for demo)
setInterval(() => {
  // Uncomment to see server-side updates
  // counter.update(val => val + 1);
}, 5000);

console.log('\n🎨 Elit + Shared State Server');
console.log('\nShared States:');
console.log('  • counter  - Synchronized counter');
console.log('  • messages - Real-time message list');
console.log('\n💡 Open http://localhost:3000/elit-state-demo.html');
console.log('   Open multiple tabs to see Elit reactive updates!\n');

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
