/**
 * Development server with HMR support
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { watch } from 'chokidar';
import { readFile, stat, realpath } from 'fs/promises';
import { join, extname, relative, resolve, normalize, sep } from 'path';
import { lookup } from 'mime-types';
import type { DevServerOptions, DevServer, HMRMessage } from './types';

// ===== Router =====

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export interface RouteContext {
  req: IncomingMessage;
  res: ServerResponse;
  params: Record<string, string>;
  query: Record<string, string>;
  body: any;
  headers: Record<string, string | string[] | undefined>;
}

export type RouteHandler = (ctx: RouteContext) => void | Promise<void>;
export type Middleware = (ctx: RouteContext, next: () => Promise<void>) => void | Promise<void>;

interface Route {
  method: HttpMethod;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

export class Router {
  private routes: Route[] = [];
  private middlewares: Middleware[] = [];

  use(middleware: Middleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  get(path: string, handler: RouteHandler): this {
    return this.addRoute('GET', path, handler);
  }

  post(path: string, handler: RouteHandler): this {
    return this.addRoute('POST', path, handler);
  }

  put(path: string, handler: RouteHandler): this {
    return this.addRoute('PUT', path, handler);
  }

  delete(path: string, handler: RouteHandler): this {
    return this.addRoute('DELETE', path, handler);
  }

  patch(path: string, handler: RouteHandler): this {
    return this.addRoute('PATCH', path, handler);
  }

  options(path: string, handler: RouteHandler): this {
    return this.addRoute('OPTIONS', path, handler);
  }

  private addRoute(method: HttpMethod, path: string, handler: RouteHandler): this {
    const { pattern, paramNames } = this.pathToRegex(path);
    this.routes.push({ method, pattern, paramNames, handler });
    return this;
  }

  private pathToRegex(path: string): { pattern: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];
    const pattern = path
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\//g, '\\/')
      .replace(/:(\w+)/g, (_, name) => (paramNames.push(name), '([^\\/]+)'));
    return { pattern: new RegExp(`^${pattern}$`), paramNames };
  }

  private parseQuery(url: string): Record<string, string> {
    const query: Record<string, string> = {};
    const queryString = url.split('?')[1];
    if (queryString) new URLSearchParams(queryString).forEach((v, k) => query[k] = v);
    return query;
  }

  private async parseBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const contentType = req.headers['content-type'] || '';
          if (contentType.includes('application/json')) {
            resolve(body ? JSON.parse(body) : {});
          } else if (contentType.includes('application/x-www-form-urlencoded')) {
            const data: Record<string, string> = {};
            new URLSearchParams(body).forEach((v, k) => data[k] = v);
            resolve(data);
          } else {
            resolve(body);
          }
        } catch (error) {
          reject(error);
        }
      });
      req.on('error', reject);
    });
  }

  async handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const method = req.method as HttpMethod;
    const url = req.url || '/';
    const path = url.split('?')[0];

    for (const route of this.routes) {
      if (route.method !== method) continue;
      const match = path.match(route.pattern);
      if (!match) continue;

      const params: Record<string, string> = {};
      route.paramNames.forEach((name, index) => { params[name] = match[index + 1]; });

      const query = this.parseQuery(url);
      let body: any = {};
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
          body = await this.parseBody(req);
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid request body' }));
          return true;
        }
      }

      const ctx: RouteContext = { req, res, params, query, body, headers: req.headers as Record<string, string | string[] | undefined> };

      let middlewareIndex = 0;
      const next = async (): Promise<void> => {
        if (middlewareIndex < this.middlewares.length) {
          const middleware = this.middlewares[middlewareIndex++];
          await middleware(ctx, next);
        }
      };

      try {
        await next();
        await route.handler(ctx);
      } catch (error) {
        console.error('Route handler error:', error);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' }));
        }
      }
      return true;
    }
    return false;
  }
}

export const json = (res: ServerResponse, data: any, status = 200) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

export const text = (res: ServerResponse, data: string, status = 200) => {
  res.writeHead(status, { 'Content-Type': 'text/plain' });
  res.end(data);
};

export const html = (res: ServerResponse, data: string, status = 200) => {
  res.writeHead(status, { 'Content-Type': 'text/html' });
  res.end(data);
};

export const status = (res: ServerResponse, code: number, message?: string) => {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: code, message: message || '' }));
};

// ===== Middleware =====

export function cors(options: {
  origin?: string | string[];
  methods?: string[];
  credentials?: boolean;
  maxAge?: number;
} = {}): Middleware {
  const { origin = '*', methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], credentials = true, maxAge = 86400 } = options;

  return async (ctx, next) => {
    const requestOrigin = ctx.req.headers.origin || '';
    const allowOrigin = Array.isArray(origin) && origin.includes(requestOrigin) ? requestOrigin : (Array.isArray(origin) ? '' : origin);

    if (allowOrigin) ctx.res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    ctx.res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
    ctx.res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (credentials) ctx.res.setHeader('Access-Control-Allow-Credentials', 'true');
    ctx.res.setHeader('Access-Control-Max-Age', String(maxAge));

    if (ctx.req.method === 'OPTIONS') {
      ctx.res.writeHead(204);
      ctx.res.end();
      return;
    }
    await next();
  };
}

export function logger(options: { format?: 'simple' | 'detailed' } = {}): Middleware {
  const { format = 'simple' } = options;
  return async (ctx, next) => {
    const start = Date.now();
    const { method, url } = ctx.req;
    await next();
    const duration = Date.now() - start;
    const status = ctx.res.statusCode;
    console.log(format === 'detailed' ? `[${new Date().toISOString()}] ${method} ${url} ${status} - ${duration}ms` : `${method} ${url} - ${status} (${duration}ms)`);
  };
}

export function errorHandler(): Middleware {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      console.error('Error:', error);
      if (!ctx.res.headersSent) {
        ctx.res.writeHead(500, { 'Content-Type': 'application/json' });
        ctx.res.end(JSON.stringify({ error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Unknown error' }));
      }
    }
  };
}

export function rateLimit(options: { windowMs?: number; max?: number; message?: string } = {}): Middleware {
  const { windowMs = 60000, max = 100, message = 'Too many requests' } = options;
  const clients = new Map<string, { count: number; resetTime: number }>();

  return async (ctx, next) => {
    const ip = ctx.req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let clientData = clients.get(ip);

    if (!clientData || now > clientData.resetTime) {
      clientData = { count: 0, resetTime: now + windowMs };
      clients.set(ip, clientData);
    }

    if (++clientData.count > max) {
      ctx.res.writeHead(429, { 'Content-Type': 'application/json' });
      ctx.res.end(JSON.stringify({ error: message }));
      return;
    }
    await next();
  };
}

export function bodyLimit(options: { limit?: number } = {}): Middleware {
  const { limit = 1024 * 1024 } = options;
  return async (ctx, next) => {
    if (parseInt(ctx.req.headers['content-length'] || '0', 10) > limit) {
      ctx.res.writeHead(413, { 'Content-Type': 'application/json' });
      ctx.res.end(JSON.stringify({ error: 'Request body too large' }));
      return;
    }
    await next();
  };
}

export function cacheControl(options: { maxAge?: number; public?: boolean } = {}): Middleware {
  const { maxAge = 3600, public: isPublic = true } = options;
  return async (ctx, next) => {
    ctx.res.setHeader('Cache-Control', `${isPublic ? 'public' : 'private'}, max-age=${maxAge}`);
    await next();
  };
}

export function compress(): Middleware {
  return async (ctx, next) => {
    if ((ctx.req.headers['accept-encoding'] || '').includes('gzip')) {
      ctx.res.setHeader('Content-Encoding', 'gzip');
    }
    await next();
  };
}

export function security(): Middleware {
  return async (ctx, next) => {
    ctx.res.setHeader('X-Content-Type-Options', 'nosniff');
    ctx.res.setHeader('X-Frame-Options', 'DENY');
    ctx.res.setHeader('X-XSS-Protection', '1; mode=block');
    ctx.res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    await next();
  };
}

// ===== State Management =====

export type StateChangeHandler<T = any> = (value: T, oldValue: T) => void;

export interface SharedStateOptions<T = any> {
  initial: T;
  persist?: boolean;
  validate?: (value: T) => boolean;
}

export class SharedState<T = any> {
  private _value: T;
  private listeners = new Set<WebSocket>();
  private changeHandlers = new Set<StateChangeHandler<T>>();
  private options: SharedStateOptions<T>;

  constructor(
    public readonly key: string,
    options: SharedStateOptions<T>
  ) {
    this.options = options;
    this._value = options.initial;
  }

  get value(): T {
    return this._value;
  }

  set value(newValue: T) {
    if (this.options.validate && !this.options.validate(newValue)) {
      throw new Error(`Invalid state value for "${this.key}"`);
    }

    const oldValue = this._value;
    this._value = newValue;

    this.changeHandlers.forEach(handler => {
      handler(newValue, oldValue);
    });

    this.broadcast();
  }

  update(updater: (current: T) => T): void {
    this.value = updater(this._value);
  }

  subscribe(ws: WebSocket): void {
    this.listeners.add(ws);
    this.sendTo(ws);
  }

  unsubscribe(ws: WebSocket): void {
    this.listeners.delete(ws);
  }

  onChange(handler: StateChangeHandler<T>): () => void {
    this.changeHandlers.add(handler);
    return () => this.changeHandlers.delete(handler);
  }

  private broadcast(): void {
    const message = JSON.stringify({ type: 'state:update', key: this.key, value: this._value, timestamp: Date.now() });
    this.listeners.forEach(ws => ws.readyState === WebSocket.OPEN && ws.send(message));
  }

  private sendTo(ws: WebSocket): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'state:init', key: this.key, value: this._value, timestamp: Date.now() }));
    }
  }

  get subscriberCount(): number {
    return this.listeners.size;
  }

  clear(): void {
    this.listeners.clear();
    this.changeHandlers.clear();
  }
}

export class StateManager {
  private states = new Map<string, SharedState<any>>();

  create<T>(key: string, options: SharedStateOptions<T>): SharedState<T> {
    if (this.states.has(key)) return this.states.get(key) as SharedState<T>;
    const state = new SharedState<T>(key, options);
    this.states.set(key, state);
    return state;
  }

  get<T>(key: string): SharedState<T> | undefined {
    return this.states.get(key) as SharedState<T>;
  }

  has(key: string): boolean {
    return this.states.has(key);
  }

  delete(key: string): boolean {
    const state = this.states.get(key);
    if (state) {
      state.clear();
      return this.states.delete(key);
    }
    return false;
  }

  subscribe(key: string, ws: WebSocket): void {
    this.states.get(key)?.subscribe(ws);
  }

  unsubscribe(key: string, ws: WebSocket): void {
    this.states.get(key)?.unsubscribe(ws);
  }

  unsubscribeAll(ws: WebSocket): void {
    this.states.forEach(state => state.unsubscribe(ws));
  }

  handleStateChange(key: string, value: any): void {
    const state = this.states.get(key);
    if (state) state.value = value;
  }

  keys(): string[] {
    return Array.from(this.states.keys());
  }

  clear(): void {
    this.states.forEach(state => state.clear());
    this.states.clear();
  }
}

// ===== Development Server =====

const defaultOptions: Omit<Required<DevServerOptions>, 'api' | 'clients' | 'root' | 'basePath'> = {
  port: 3000,
  host: 'localhost',
  https: false,
  open: true,
  watch: ['**/*.ts', '**/*.js', '**/*.html', '**/*.css'],
  ignore: ['node_modules/**', 'dist/**', '.git/**', '**/*.d.ts'],
  logging: true,
  middleware: []
};

interface NormalizedClient {
  root: string;
  basePath: string;
}

export function createDevServer(options: DevServerOptions): DevServer {
  const config = { ...defaultOptions, ...options };
  const wsClients = new Set<WebSocket>();
  const stateManager = new StateManager();

  // Normalize clients configuration - support both new API (clients array) and legacy API (root/basePath)
  const clientsToNormalize = config.clients?.length ? config.clients : config.root ? [{ root: config.root, basePath: config.basePath || '' }] : null;
  if (!clientsToNormalize) throw new Error('DevServerOptions must include either "clients" array or "root" directory');

  const normalizedClients: NormalizedClient[] = clientsToNormalize.map(client => ({
    root: client.root,
    basePath: client.basePath ? '/' + client.basePath.replace(/^\/+|\/+$/g, '') : ''
  }));

  // HTTP Server
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const originalUrl = req.url || '/';

    // Find matching client based on basePath
    const matchedClient = normalizedClients.find(c => c.basePath && originalUrl.startsWith(c.basePath)) || normalizedClients.find(c => !c.basePath);
    if (!matchedClient) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const url = matchedClient.basePath ? (originalUrl.slice(matchedClient.basePath.length) || '/') : originalUrl;

    // Try API routes first (global API router)
    if (config.api && url.startsWith('/api')) {
      const handled = await config.api.handle(req, res);
      if (handled) return;
    }

    let filePath = url === '/' ? '/index.html' : url;

    // Remove query string
    filePath = filePath.split('?')[0];

    // Security: Prevent path traversal and absolute path access
    const normalizedPath = normalize(filePath).replace(/\\/g, '/');
    if (normalizedPath.includes('..') || normalizedPath.startsWith('/') || normalizedPath.includes('\0')) {
      if (config.logging) console.log(`[403] Rejected suspicious path: ${filePath}`);
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    // Resolve file path and validate it's within root directory
    const rootDir = await realpath(resolve(matchedClient.root));
    let fullPath;
    try {
      fullPath = await realpath(resolve(join(matchedClient.root, normalizedPath)));
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    // Security: Ensure the resolved path is within the root directory
    if (!fullPath.startsWith(rootDir + sep) && fullPath !== rootDir) {
      if (config.logging) console.log(`[403] Path traversal attempt: ${filePath}`);
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    try {
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        try {
          const indexPath = await realpath(resolve(join(fullPath, 'index.html')));
          if (!indexPath.startsWith(rootDir + sep) && indexPath !== rootDir) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('403 Forbidden');
            return;
          }
          await stat(indexPath);
          return serveFile(indexPath, res, matchedClient);
        } catch {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
      }

      await serveFile(fullPath, res, matchedClient);
    } catch (error) {
      if (config.logging) console.log(`[404] ${filePath}`);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  });

  // Serve file helper
  async function serveFile(filePath: string, res: ServerResponse, client: NormalizedClient) {
    try {
      const rootDir = await realpath(resolve(client.root));
      let resolvedPath;
      try {
        resolvedPath = await realpath(resolve(filePath));
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      if (!resolvedPath.startsWith(rootDir + sep) && resolvedPath !== rootDir) {
        if (config.logging) console.log(`[403] Attempted to serve file outside root: ${filePath}`);
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
      }

      let content = await readFile(resolvedPath);
      const ext = extname(resolvedPath);
      const mimeType = lookup(resolvedPath) || 'application/octet-stream';

      // Inject HMR client for HTML files
      if (ext === '.html') {
        const hmrScript = `<script>(function(){const ws=new WebSocket('ws://${config.host}:${config.port}${client.basePath}');ws.onopen=()=>console.log('[Elit HMR] Connected');ws.onmessage=(e)=>{const d=JSON.parse(e.data);if(d.type==='update'){console.log('[Elit HMR] File updated:',d.path);window.location.reload()}else if(d.type==='reload'){console.log('[Elit HMR] Reloading...');window.location.reload()}else if(d.type==='error')console.error('[Elit HMR] Error:',d.error)};ws.onclose=()=>{console.log('[Elit HMR] Disconnected - Retrying...');setTimeout(()=>window.location.reload(),1000)};ws.onerror=(e)=>console.error('[Elit HMR] WebSocket error:',e)})();</script>`;
        let html = content.toString();
        html = html.includes('</body>') ? html.replace('</body>', `${hmrScript}</body>`) : html + hmrScript;
        content = Buffer.from(html);
      }

      res.writeHead(200, { 'Content-Type': mimeType, 'Cache-Control': 'no-cache, no-store, must-revalidate' });
      res.end(content);

      if (config.logging) console.log(`[200] ${relative(client.root, filePath)}`);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      if (config.logging) console.error('[500] Error reading file:', error);
    }
  }

  // WebSocket Server for HMR
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    wsClients.add(ws);

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
      wsClients.delete(ws);
      stateManager.unsubscribeAll(ws);
      if (config.logging) {
        console.log('[HMR] Client disconnected');
      }
    });
  });

  // File watcher - watch all client roots
  const watchPaths = normalizedClients.flatMap(client =>
    config.watch.map(pattern => join(client.root, pattern))
  );

  const watcher = watch(watchPaths, {
    ignored: config.ignore,
    ignoreInitial: true,
    persistent: true
  });

  watcher.on('change', (path: string) => {
    if (config.logging) console.log(`[HMR] File changed: ${path}`);
    const message = JSON.stringify({ type: 'update', path, timestamp: Date.now() } as HMRMessage);
    wsClients.forEach(client => client.readyState === WebSocket.OPEN && client.send(message));
  });

  watcher.on('add', (path: string) => config.logging && console.log(`[HMR] File added: ${path}`));
  watcher.on('unlink', (path: string) => config.logging && console.log(`[HMR] File removed: ${path}`));

  // Increase max listeners to prevent warnings
  server.setMaxListeners(20);

  // Start server
  server.listen(config.port, config.host, () => {
    if (config.logging) {
      console.log('\n🚀 Elit Dev Server');
      console.log(`\n  ➜ Local:   http://${config.host}:${config.port}`);

      if (normalizedClients.length > 1) {
        console.log(`  ➜ Clients:`);
        normalizedClients.forEach(client => {
          const clientUrl = `http://${config.host}:${config.port}${client.basePath}`;
          console.log(`     - ${clientUrl} → ${client.root}`);
        });
      } else {
        const client = normalizedClients[0];
        console.log(`  ➜ Root:    ${client.root}`);
        if (client.basePath) {
          console.log(`  ➜ Base:    ${client.basePath}`);
        }
      }

      console.log(`\n[HMR] Watching for file changes...\n`);
    }

    // Open browser to first client
    if (config.open && normalizedClients.length > 0) {
      const firstClient = normalizedClients[0];
      const url = `http://${config.host}:${config.port}${firstClient.basePath}`;

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
    if (config.logging) console.log('\n[Server] Shutting down...');
    await watcher.close();
    wss.close();
    wsClients.forEach(client => client.close());
    wsClients.clear();
    return new Promise<void>((resolve) => {
      server.close(() => {
        if (config.logging) console.log('[Server] Closed');
        resolve();
      });
    });
  };

  // Get the primary URL (first client's basePath)
  const primaryClient = normalizedClients[0];
  const primaryUrl = `http://${config.host}:${config.port}${primaryClient.basePath}`;

  return {
    server,
    wss,
    url: primaryUrl,
    state: stateManager,
    close
  };
}
