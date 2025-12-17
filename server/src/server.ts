/**
 * Development server with HMR support
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { watch } from 'chokidar';
import { readFile, stat } from 'fs/promises';
import { join, extname, relative } from 'path';
import { lookup } from 'mime-types';
import type { DevServerOptions, DevServer, HMRMessage } from './types';
import { Router } from './router';
import { StateManager } from './state';

const defaultOptions: Omit<Required<DevServerOptions>, 'api'> = {
  port: 3000,
  host: 'localhost',
  root: process.cwd(),
  https: false,
  open: true,
  watch: ['**/*.ts', '**/*.js', '**/*.html', '**/*.css'],
  ignore: ['node_modules/**', 'dist/**', '.git/**', '**/*.d.ts'],
  logging: true,
  middleware: []
};

export function createDevServer(options: DevServerOptions = {}): DevServer {
  const config = { ...defaultOptions, ...options };
  const clients = new Set<WebSocket>();
  const apiRouter = config.api;
  const stateManager = new StateManager();

  // HTTP Server
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // Try API routes first
    if (apiRouter && req.url?.startsWith('/api')) {
      const handled = await apiRouter.handle(req, res);
      if (handled) return;
    }

    const url = req.url || '/';
    let filePath = url === '/' ? '/index.html' : url;

    // Remove query string
    filePath = filePath.split('?')[0];

    // Resolve file path
    const fullPath = join(config.root, filePath);

    try {
      // Check if file exists
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        // Try index.html in directory
        const indexPath = join(fullPath, 'index.html');
        try {
          await stat(indexPath);
          return serveFile(indexPath, res);
        } catch {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
      }

      await serveFile(fullPath, res);
    } catch (error) {
      // File not found
      if (config.logging) {
        console.log(`[404] ${filePath}`);
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  });

  // Serve file helper
  async function serveFile(filePath: string, res: ServerResponse) {
    try {
      let content = await readFile(filePath);
      const ext = extname(filePath);
      const mimeType = lookup(filePath) || 'application/octet-stream';

      // Inject HMR client for HTML files
      if (ext === '.html') {
        let html = content.toString();
        const hmrScript = `
<script>
  // Elit HMR Client
  (function() {
    const ws = new WebSocket('ws://${config.host}:${config.port}');

    ws.onopen = () => {
      console.log('[Elit HMR] Connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'update') {
        console.log('[Elit HMR] File updated:', data.path);
        window.location.reload();
      } else if (data.type === 'reload') {
        console.log('[Elit HMR] Reloading...');
        window.location.reload();
      } else if (data.type === 'error') {
        console.error('[Elit HMR] Error:', data.error);
      }
    };

    ws.onclose = () => {
      console.log('[Elit HMR] Disconnected - Retrying...');
      setTimeout(() => window.location.reload(), 1000);
    };

    ws.onerror = (error) => {
      console.error('[Elit HMR] WebSocket error:', error);
    };
  })();
</script>
`;

        // Inject before closing body tag or at the end
        if (html.includes('</body>')) {
          html = html.replace('</body>', `${hmrScript}</body>`);
        } else {
          html += hmrScript;
        }

        content = Buffer.from(html);
      }

      res.writeHead(200, {
        'Content-Type': mimeType,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(content);

      if (config.logging) {
        const relativePath = relative(config.root, filePath);
        console.log(`[200] ${relativePath}`);
      }
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      if (config.logging) {
        console.error('[500] Error reading file:', error);
      }
    }
  }

  // WebSocket Server for HMR
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    clients.add(ws);

    const message: HMRMessage = { type: 'connected', timestamp: Date.now() };
    ws.send(JSON.stringify(message));

    if (config.logging) {
      console.log('[HMR] Client connected');
    }

    // Handle incoming messages
    ws.on('message', (data: string) => {
      try {
        const msg = JSON.parse(data.toString());

        // Handle state subscription
        if (msg.type === 'state:subscribe') {
          stateManager.subscribe(msg.key, ws);
          if (config.logging) {
            console.log(`[State] Client subscribed to "${msg.key}"`);
          }
        }

        // Handle state unsubscribe
        else if (msg.type === 'state:unsubscribe') {
          stateManager.unsubscribe(msg.key, ws);
          if (config.logging) {
            console.log(`[State] Client unsubscribed from "${msg.key}"`);
          }
        }

        // Handle state change from client
        else if (msg.type === 'state:change') {
          stateManager.handleStateChange(msg.key, msg.value);
          if (config.logging) {
            console.log(`[State] Client updated "${msg.key}"`);
          }
        }
      } catch (error) {
        if (config.logging) {
          console.error('[WebSocket] Message parse error:', error);
        }
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      stateManager.unsubscribeAll(ws);
      if (config.logging) {
        console.log('[HMR] Client disconnected');
      }
    });
  });

  // File watcher
  const watcher = watch(config.watch, {
    ignored: config.ignore,
    cwd: config.root,
    ignoreInitial: true,
    persistent: true
  });

  watcher.on('change', (path: string) => {
    if (config.logging) {
      console.log(`[HMR] File changed: ${path}`);
    }

    const message: HMRMessage = {
      type: 'update',
      path,
      timestamp: Date.now()
    };

    // Broadcast to all connected clients
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  });

  watcher.on('add', (path: string) => {
    if (config.logging) {
      console.log(`[HMR] File added: ${path}`);
    }
  });

  watcher.on('unlink', (path: string) => {
    if (config.logging) {
      console.log(`[HMR] File removed: ${path}`);
    }
  });

  // Increase max listeners to prevent warnings
  server.setMaxListeners(20);

  // Start server
  server.listen(config.port, config.host, () => {
    const url = `http://${config.host}:${config.port}`;

    if (config.logging) {
      console.log('\n🚀 Elit Dev Server');
      console.log(`\n  ➜ Local:   ${url}`);
      console.log(`  ➜ Root:    ${config.root}`);
      console.log(`\n[HMR] Watching for file changes...\n`);
    }

    // Open browser
    if (config.open) {
      const open = async () => {
        const { default: openBrowser } = await import('open');
        await openBrowser(url);
      };
      open().catch(() => {
        // Fail silently if open package is not available
      });
    }
  });

  // Cleanup function
  let isClosing = false;
  const close = async () => {
    if (isClosing) return;
    isClosing = true;

    if (config.logging) {
      console.log('\n[Server] Shutting down...');
    }

    // Close watcher
    await watcher.close();

    // Close WebSocket server
    wss.close();

    // Close all WebSocket connections
    clients.forEach(client => {
      client.close();
    });
    clients.clear();

    // Close HTTP server
    return new Promise<void>((resolve) => {
      server.close(() => {
        if (config.logging) {
          console.log('[Server] Closed');
        }
        resolve();
      });
    });
  };

  return {
    server,
    wss,
    url: `http://${config.host}:${config.port}`,
    state: stateManager,
    close
  };
}
