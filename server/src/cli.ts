/**
 * CLI for Elit dev server
 */

import { createDevServer } from './server';
import type { DevServerOptions } from './types';

function parseArgs(): DevServerOptions {
  const args = process.argv.slice(2);
  const options: DevServerOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '-p':
      case '--port':
        options.port = parseInt(next, 10);
        i++;
        break;

      case '-h':
      case '--host':
        options.host = next;
        i++;
        break;

      case '-r':
      case '--root':
        options.root = next;
        i++;
        break;

      case '--no-open':
        options.open = false;
        break;

      case '--silent':
        options.logging = false;
        break;

      case '--help':
        printHelp();
        process.exit(0);
        break;

      case '--version':
        printVersion();
        process.exit(0);
        break;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Elit Development Server

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

Examples:
  elit-dev
  elit-dev --port 8080
  elit-dev --root ./public --no-open
  `);
}

function printVersion() {
  const pkg = require('../package.json');
  console.log(`v${pkg.version}`);
}

export function startDevServer(options?: DevServerOptions) {
  const opts = options || parseArgs();

  const devServer = createDevServer(opts);

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('\n[Server] Shutting down...');
    await devServer.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return devServer;
}

// Run if executed directly
if (require.main === module) {
  startDevServer();
}
