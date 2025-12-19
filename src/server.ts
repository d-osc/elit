/**
 * Development server with HMR support
 * Cross-runtime transpilation support
 * - Node.js: uses esbuild
 * - Bun: uses Bun.Transpiler
 * - Deno: uses Deno.emit
 */

import { createServer, IncomingMessage, ServerResponse, request as httpRequest } from './http';
import { request as httpsRequest } from './https';
import { WebSocketServer, WebSocket, ReadyState } from './ws';
import { watch } from './chokidar';
import { readFile, stat, realpath } from './fs';
import { join, extname, relative, resolve, normalize, sep } from './path';
import { lookup } from './mime-types';
import { runtime } from './runtime';
import type { DevServerOptions, DevServer, HMRMessage, Child, VNode, ProxyConfig } from './types';
import { dom } from './dom';

// ===== Router =====

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export interface ServerRouteContext {
  req: IncomingMessage;
  res: ServerResponse;
  params: Record<string, string>;
  query: Record<string, string>;
  body: any;
  headers: Record<string, string | string[] | undefined>;
}

export type ServerRouteHandler = (ctx: ServerRouteContext) => void | Promise<void>;
export type Middleware = (ctx: ServerRouteContext, next: () => Promise<void>) => void | Promise<void>;

interface ServerRoute {
  method: HttpMethod;
  pattern: RegExp;
  paramNames: string[];
  handler: ServerRouteHandler;
}

export class ServerRouter {
  private routes: ServerRoute[] = [];
  private middlewares: Middleware[] = [];

  use(middleware: Middleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  get(path: string, handler: ServerRouteHandler): this {
    return this.addRoute('GET', path, handler);
  }

  post(path: string, handler: ServerRouteHandler): this {
    return this.addRoute('POST', path, handler);
  }

  put(path: string, handler: ServerRouteHandler): this {
    return this.addRoute('PUT', path, handler);
  }

  delete(path: string, handler: ServerRouteHandler): this {
    return this.addRoute('DELETE', path, handler);
  }

  patch(path: string, handler: ServerRouteHandler): this {
    return this.addRoute('PATCH', path, handler);
  }

  options(path: string, handler: ServerRouteHandler): this {
    return this.addRoute('OPTIONS', path, handler);
  }

  private addRoute(method: HttpMethod, path: string, handler: ServerRouteHandler): this {
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

      const ctx: ServerRouteContext = { req, res, params, query, body, headers: req.headers as Record<string, string | string[] | undefined> };

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
    const requestOriginHeader = ctx.req.headers.origin;
    const requestOrigin = Array.isArray(requestOriginHeader) ? requestOriginHeader[0] : (requestOriginHeader || '');
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
    const contentLength = ctx.req.headers['content-length'];
    const contentLengthStr = Array.isArray(contentLength) ? contentLength[0] : (contentLength || '0');
    if (parseInt(contentLengthStr, 10) > limit) {
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
    const acceptEncoding = ctx.req.headers['accept-encoding'] || '';
    if (!acceptEncoding.includes('gzip')) {
      await next();
      return;
    }

    // Store original end method
    const originalEnd = ctx.res.end.bind(ctx.res);
    const chunks: Buffer[] = [];

    // Intercept response data
    ctx.res.write = ((chunk: any) => {
      chunks.push(Buffer.from(chunk));
      return true;
    }) as any;

    ctx.res.end = ((chunk?: any) => {
      if (chunk) chunks.push(Buffer.from(chunk));

      const buffer = Buffer.concat(chunks);
      const { gzipSync } = require('zlib');
      const compressed = gzipSync(buffer);

      ctx.res.setHeader('Content-Encoding', 'gzip');
      ctx.res.setHeader('Content-Length', compressed.length);
      originalEnd(compressed);
      return ctx.res;
    }) as any;

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

// ===== Proxy Handler =====

function rewritePath(path: string, pathRewrite?: Record<string, string>): string {
  if (!pathRewrite) return path;

  for (const [from, to] of Object.entries(pathRewrite)) {
    const regex = new RegExp(from);
    if (regex.test(path)) {
      return path.replace(regex, to);
    }
  }
  return path;
}

export function createProxyHandler(proxyConfigs: ProxyConfig[]) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
    const url = req.url || '/';
    const path = url.split('?')[0];

    // Find matching proxy configuration (first match wins)
    const proxy = proxyConfigs.find(p => path.startsWith(p.context));
    if (!proxy) return false;

    const { target, changeOrigin, pathRewrite, headers } = proxy;

    try {
      const targetUrl = new URL(target);
      const isHttps = targetUrl.protocol === 'https:';
      const requestLib = isHttps ? httpsRequest : httpRequest;

      // Rewrite path if needed
      let proxyPath = rewritePath(url, pathRewrite);

      // Build the full proxy URL
      const proxyUrl = `${isHttps ? 'https' : 'http'}://${targetUrl.hostname}:${targetUrl.port || (isHttps ? 443 : 80)}${proxyPath}`;

      // Build proxy request options
      const proxyReqHeaders: Record<string, string | number | string[]> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (value !== undefined) {
          proxyReqHeaders[key] = value;
        }
      }
      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          if (value !== undefined) {
            proxyReqHeaders[key] = value;
          }
        }
      }

      // Change origin if requested
      if (changeOrigin) {
        proxyReqHeaders.host = targetUrl.host;
      }

      // Remove headers that shouldn't be forwarded
      delete proxyReqHeaders['host'];

      const proxyReqOptions = {
        method: req.method,
        headers: proxyReqHeaders
      };

      // Create proxy request
      const proxyReq = requestLib(proxyUrl, proxyReqOptions, (proxyRes) => {
        // Forward status code and headers - convert incoming headers properly
        const outgoingHeaders: Record<string, string | number | string[]> = {};
        for (const [key, value] of Object.entries(proxyRes.headers)) {
          if (value !== undefined) {
            outgoingHeaders[key] = value;
          }
        }
        res.writeHead(proxyRes.statusCode || 200, outgoingHeaders);

        // Pipe response using read/write instead of pipe
        proxyRes.on('data', (chunk) => res.write(chunk));
        proxyRes.on('end', () => res.end());
      });

      // Handle errors
      proxyReq.on('error', (error) => {
        console.error('[Proxy] Error proxying %s to %s:', url, target, error.message);
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Bad Gateway', message: 'Proxy error' }));
        }
      });

      // Forward request body
      req.on('data', (chunk) => proxyReq.write(chunk));
      req.on('end', () => proxyReq.end());

      return true;
    } catch (error) {
      console.error('[Proxy] Invalid proxy configuration for %s:', path, error);
      return false;
    }
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
    this.listeners.forEach(ws => ws.readyState === ReadyState.OPEN && ws.send(message));
  }

  private sendTo(ws: WebSocket): void {
    if (ws.readyState === ReadyState.OPEN) {
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

const defaultOptions: Omit<Required<DevServerOptions>, 'api' | 'clients' | 'root' | 'basePath' | 'ssr' | 'proxy'> = {
  port: 3000,
  host: 'localhost',
  https: false,
  open: true,
  watch: ['**/*.ts', '**/*.js', '**/*.html', '**/*.css'],
  ignore: ['node_modules/**', 'dist/**', '.git/**', '**/*.d.ts'],
  logging: true,
  middleware: [],
  worker: []
};

interface NormalizedClient {
  root: string;
  basePath: string;
  ssr?: () => Child | string;
  proxyHandler?: (req: IncomingMessage, res: ServerResponse) => Promise<boolean>;
}

export function createDevServer(options: DevServerOptions): DevServer {
  const config = { ...defaultOptions, ...options };
  const wsClients = new Set<WebSocket>();
  const stateManager = new StateManager();

  // Normalize clients configuration - support both new API (clients array) and legacy API (root/basePath)
  const clientsToNormalize = config.clients?.length ? config.clients : config.root ? [{ root: config.root, basePath: config.basePath || '', ssr: config.ssr, proxy: config.proxy }] : null;
  if (!clientsToNormalize) throw new Error('DevServerOptions must include either "clients" array or "root" directory');

  const normalizedClients: NormalizedClient[] = clientsToNormalize.map(client => {
    let basePath = client.basePath || '';
    if (basePath) {
      // Remove leading/trailing slashes safely without ReDoS vulnerability
      while (basePath.startsWith('/')) basePath = basePath.slice(1);
      while (basePath.endsWith('/')) basePath = basePath.slice(0, -1);
      basePath = basePath ? '/' + basePath : '';
    }
    return {
      root: client.root,
      basePath,
      ssr: client.ssr,
      proxyHandler: client.proxy ? createProxyHandler(client.proxy) : undefined
    };
  });

  // Create global proxy handler if proxy config exists
  const globalProxyHandler = config.proxy ? createProxyHandler(config.proxy) : null;

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

    // Try client-specific proxy first
    if (matchedClient.proxyHandler) {
      try {
        const proxied = await matchedClient.proxyHandler(req, res);
        if (proxied) {
          if (config.logging) console.log(`[Proxy] ${req.method} ${originalUrl} -> proxied (client-specific)`);
          return;
        }
      } catch (error) {
        console.error('[Proxy] Error (client-specific):', error);
      }
    }

    // Try global proxy if client-specific didn't match
    if (globalProxyHandler) {
      try {
        const proxied = await globalProxyHandler(req, res);
        if (proxied) {
          if (config.logging) console.log(`[Proxy] ${req.method} ${originalUrl} -> proxied (global)`);
          return;
        }
      } catch (error) {
        console.error('[Proxy] Error (global):', error);
      }
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

    if (config.logging && filePath === '/src/pages') {
      console.log(`[DEBUG] Request for /src/pages received`);
    }

    // Security: Check for null bytes early
    if (filePath.includes('\0')) {
      if (config.logging) console.log(`[403] Rejected path with null byte: ${filePath}`);
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    // Handle /dist/* requests - serve from parent dist folder
    const isDistRequest = filePath.startsWith('/dist/');
    let normalizedPath: string;

    // Normalize and validate the path for both /dist/* and regular requests
    const tempPath = normalize(filePath).replace(/\\/g, '/').replace(/^\/+/, '');
    if (tempPath.includes('..')) {
      if (config.logging) console.log(`[403] Path traversal attempt: ${filePath}`);
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }
    normalizedPath = tempPath;

    // Resolve file path
    const rootDir = await realpath(resolve(matchedClient.root));
    const baseDir = isDistRequest ? await realpath(resolve(matchedClient.root, '..')) : rootDir;
    let fullPath;

    try {
      fullPath = await realpath(resolve(join(baseDir, normalizedPath)));
      // Security: Ensure path is strictly within the allowed root directory
      if (!fullPath.startsWith(baseDir.endsWith(sep) ? baseDir : baseDir + sep)) {
        if (config.logging) console.log(`[403] File access outside of root: ${fullPath}`);
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
      }
      if (config.logging && filePath === '/src/pages') {
        console.log(`[DEBUG] Initial resolve succeeded: ${fullPath}`);
      }
    } catch (firstError) {
      // If file not found, try different extensions
      let resolvedPath: string | undefined;

      if (config.logging && !normalizedPath.includes('.')) {
        console.log(`[DEBUG] File not found: ${normalizedPath}, trying extensions...`);
      }

      // If .js file not found, try .ts file
      if (normalizedPath.endsWith('.js')) {
        const tsPath = normalizedPath.replace(/\.js$/, '.ts');
        try {
          const tsFullPath = await realpath(resolve(join(baseDir, tsPath)));
          // Security: Ensure path is strictly within the allowed root directory
          if (!tsFullPath.startsWith(baseDir.endsWith(sep) ? baseDir : baseDir + sep)) {
            if (config.logging) console.log(`[403] Fallback TS path outside of root: ${tsFullPath}`);
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('403 Forbidden');
            return;
          }
          resolvedPath = tsFullPath;
        } catch {
          // Continue to next attempt
        }
      }

      // If no extension, try adding .ts or .js, or index files
      if (!resolvedPath && !normalizedPath.includes('.')) {
        // Try .ts first
        try {
          resolvedPath = await realpath(resolve(join(baseDir, normalizedPath + '.ts')));
          if (config.logging) console.log(`[DEBUG] Found: ${normalizedPath}.ts`);
        } catch {
          // Try .js
          try {
            resolvedPath = await realpath(resolve(join(baseDir, normalizedPath + '.js')));
            if (config.logging) console.log(`[DEBUG] Found: ${normalizedPath}.js`);
          } catch {
            // Try index.ts in directory
            try {
              resolvedPath = await realpath(resolve(join(baseDir, normalizedPath, 'index.ts')));
              if (config.logging) console.log(`[DEBUG] Found: ${normalizedPath}/index.ts`);
            } catch {
              // Try index.js in directory
              try {
                resolvedPath = await realpath(resolve(join(baseDir, normalizedPath, 'index.js')));
                if (config.logging) console.log(`[DEBUG] Found: ${normalizedPath}/index.js`);
              } catch {
                if (config.logging) console.log(`[DEBUG] Not found: all attempts failed for ${normalizedPath}`);
              }
            }
          }
        }
      }

      if (!resolvedPath) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      fullPath = resolvedPath;
    }

    // Check if resolved path is a directory, try index files
    try {
      const stats = await stat(fullPath);
      if (stats.isDirectory()) {
        if (config.logging) console.log(`[DEBUG] Path is directory: ${fullPath}, trying index files...`);
        let indexPath: string | undefined;

        // Try index.ts first
        try {
          indexPath = await realpath(resolve(join(fullPath, 'index.ts')));
          if (config.logging) console.log(`[DEBUG] Found index.ts in directory`);
        } catch {
          // Try index.js
          try {
            indexPath = await realpath(resolve(join(fullPath, 'index.js')));
            if (config.logging) console.log(`[DEBUG] Found index.js in directory`);
          } catch {
            if (config.logging) console.log(`[DEBUG] No index file found in directory`);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
          }
        }

        fullPath = indexPath;
      }
    } catch (statError) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    // Security: Ensure the resolved path is within allowed directories
    const parentDir = await realpath(resolve(matchedClient.root, '..'));
    const isInRoot = fullPath.startsWith(rootDir + sep) || fullPath === rootDir;
    const isInParent = isDistRequest && (fullPath.startsWith(parentDir + sep) || fullPath === parentDir);

    if (!isInRoot && !isInParent) {
      if (config.logging) console.log(`[403] Path outside allowed directories: ${filePath}`);
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
      const parentDir = await realpath(resolve(client.root, '..'));
      let resolvedPath;
      try {
        resolvedPath = await realpath(resolve(filePath));
      } catch {
        // If index.html not found but SSR function exists, use SSR
        if (filePath.endsWith('index.html') && client.ssr) {
          return serveSSR(res, client);
        }
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      // Allow files in root directory or parent/dist directory
      const isInRoot = resolvedPath.startsWith(rootDir + sep) || resolvedPath === rootDir;
      const isInParentDist = resolvedPath.startsWith(parentDir + sep + 'dist' + sep);

      if (!isInRoot && !isInParentDist) {
        if (config.logging) console.log(`[403] Attempted to serve file outside allowed directories: ${filePath}`);
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
      }

      let content = await readFile(resolvedPath);
      const ext = extname(resolvedPath);
      let mimeType = lookup(resolvedPath) || 'application/octet-stream';

      // Handle TypeScript files - transpile only (no bundling)
      if (ext === '.ts' || ext === '.tsx') {
        try {
          let transpiled: string;

          if (runtime === 'deno') {
            // Deno - use Deno.emit
            // @ts-ignore
            const result = await Deno.emit(resolvedPath, {
              check: false,
              bundle: false,
              compilerOptions: {
                sourceMap: true,
                inlineSourceMap: true,
                target: 'ES2020',
                module: 'esnext'
              },
              sources: {
                [resolvedPath]: content.toString()
              }
            });

            transpiled = result.files[resolvedPath.replace(/\.tsx?$/, '.js')] || '';

          } else if (runtime === 'bun') {
            // Bun - use Bun.Transpiler
            // @ts-ignore
            const transpiler = new Bun.Transpiler({
              loader: ext === '.tsx' ? 'tsx' : 'ts',
              target: 'browser'
            });

            // @ts-ignore
            transpiled = transpiler.transformSync(content.toString());
          } else {
            // Node.js - use esbuild
            const { build } = await import('esbuild');
            const result = await build({
              stdin: {
                contents: content.toString(),
                loader: ext === '.tsx' ? 'tsx' : 'ts',
                resolveDir: resolve(resolvedPath, '..'),
                sourcefile: resolvedPath
              },
              format: 'esm',
              target: 'es2020',
              write: false,
              bundle: false,
              sourcemap: 'inline'
            });

            transpiled = result.outputFiles[0].text;
          }

          content = Buffer.from(transpiled);
          mimeType = 'application/javascript';
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end(`TypeScript compilation error:\n${error}`);
          if (config.logging) console.error('[500] TypeScript compilation error:', error);
          return;
        }
      }

      // Inject HMR client and import map for HTML files
      if (ext === '.html') {
        const elitPath = client.basePath ? `${client.basePath}/dist/client.mjs` : '/dist/client.mjs';
        const importMap = `<script type="importmap">
{
  "imports": {
    "elit": "${elitPath}"
  }
}
</script>`;
        const hmrScript = `<script>(function(){const ws=new WebSocket('ws://${config.host}:${config.port}${client.basePath}');ws.onopen=()=>console.log('[Elit HMR] Connected');ws.onmessage=(e)=>{const d=JSON.parse(e.data);if(d.type==='update'){console.log('[Elit HMR] File updated:',d.path);window.location.reload()}else if(d.type==='reload'){console.log('[Elit HMR] Reloading...');window.location.reload()}else if(d.type==='error')console.error('[Elit HMR] Error:',d.error)};ws.onclose=()=>{console.log('[Elit HMR] Disconnected - Retrying...');setTimeout(()=>window.location.reload(),1000)};ws.onerror=(e)=>console.error('[Elit HMR] WebSocket error:',e)})();</script>`;
        let html = content.toString();

        // Inject base tag if basePath is configured and not '/'
        if (client.basePath && client.basePath !== '/') {
          const baseTag = `<base href="${client.basePath}/">`;
          // Check if base tag already exists
          if (!html.includes('<base')) {
            // Try to inject after viewport meta tag
            if (html.includes('<meta name="viewport"')) {
              html = html.replace(
                /<meta name="viewport"[^>]*>/,
                (match) => `${match}\n  ${baseTag}`
              );
            } else if (html.includes('<head>')) {
              // If no viewport, inject right after <head>
              html = html.replace('<head>', `<head>\n  ${baseTag}`);
            }
          }
        }

        html = html.includes('</head>') ? html.replace('</head>', `${importMap}</head>`) : html;
        html = html.includes('</body>') ? html.replace('</body>', `${hmrScript}</body>`) : html + hmrScript;
        content = Buffer.from(html);
      }

      // Set cache headers based on file type
      const cacheControl = ext === '.html' || ext === '.ts' || ext === '.tsx'
        ? 'no-cache, no-store, must-revalidate'  // Don't cache HTML/TS files in dev
        : 'public, max-age=31536000, immutable'; // Cache static assets for 1 year

      const headers: any = {
        'Content-Type': mimeType,
        'Cache-Control': cacheControl
      };

      // Apply gzip compression for text-based files
      const compressible = /^(text\/|application\/(javascript|json|xml))/.test(mimeType);

      if (compressible && content.length > 1024) {
        const { gzipSync } = require('zlib');
        const compressed = gzipSync(content);
        headers['Content-Encoding'] = 'gzip';
        headers['Content-Length'] = compressed.length;
        res.writeHead(200, headers);
        res.end(compressed);
      } else {
        res.writeHead(200, headers);
        res.end(content);
      }

      if (config.logging) console.log(`[200] ${relative(client.root, filePath)}`);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
      if (config.logging) console.error('[500] Error reading file:', error);
    }
  }

  // SSR helper - Generate HTML from SSR function
  function serveSSR(res: ServerResponse, client: NormalizedClient) {
    try {
      if (!client.ssr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('SSR function not configured');
        return;
      }

      const result = client.ssr();
      let html: string;

      // If result is a string, use it directly
      if (typeof result === 'string') {
        html = result;
      }
      // If result is a VNode, render it to HTML string
      else if (typeof result === 'object' && result !== null && 'tagName' in result) {
        const vnode = result as VNode;
        if (vnode.tagName === 'html') {
          html = dom.renderToString(vnode);
        } else {
          // Wrap in basic HTML structure if not html tag
          html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${dom.renderToString(vnode)}</body></html>`;
        }
      } else {
        html = String(result);
      }

      // Inject HMR script
      const hmrScript = `<script>(function(){const ws=new WebSocket('ws://${config.host}:${config.port}${client.basePath}');ws.onopen=()=>console.log('[Elit HMR] Connected');ws.onmessage=(e)=>{const d=JSON.parse(e.data);if(d.type==='update'){console.log('[Elit HMR] File updated:',d.path);window.location.reload()}else if(d.type==='reload'){console.log('[Elit HMR] Reloading...');window.location.reload()}else if(d.type==='error')console.error('[Elit HMR] Error:',d.error)};ws.onclose=()=>{console.log('[Elit HMR] Disconnected - Retrying...');setTimeout(()=>window.location.reload(),1000)};ws.onerror=(e)=>console.error('[Elit HMR] WebSocket error:',e)})();</script>`;
      html = html.includes('</body>') ? html.replace('</body>', `${hmrScript}</body>`) : html + hmrScript;

      res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache, no-store, must-revalidate' });
      res.end(html);

      if (config.logging) console.log(`[200] SSR rendered`);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 SSR Error');
      if (config.logging) console.error('[500] SSR Error:', error);
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
    ignored: (path: string) => config.ignore.some(pattern => path.includes(pattern.replace('/**', '').replace('**/', ''))),
    ignoreInitial: true,
    persistent: true
  });

  watcher.on('change', (path: string) => {
    if (config.logging) console.log(`[HMR] File changed: ${path}`);
    const message = JSON.stringify({ type: 'update', path, timestamp: Date.now() } as HMRMessage);
    wsClients.forEach(client => client.readyState === ReadyState.OPEN && client.send(message));
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
    server: server as any,
    wss: wss as any,
    url: primaryUrl,
    state: stateManager,
    close
  };
}
