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
import { isBun, isDeno } from './runtime';
import type { DevServerOptions, DevServer, HMRMessage, Child, VNode, ProxyConfig } from './types';
import { dom } from './dom';

// ===== Router =====

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'ALL';

export interface ElitRequest extends IncomingMessage {
  body?: any;
  query?: Record<string, string>;
  params?: Record<string, string>;
}

export interface ElitResponse extends ServerResponse {
  json(data: any, statusCode?: number): this;
  send(data: any): this;
  status(code: number): this;
}

export interface ServerRouteContext {
  req: ElitRequest;
  res: ElitResponse;
  params: Record<string, string>;
  query: Record<string, string>;
  body: any;
  headers: Record<string, string | string[] | undefined>;
  user?: any;
}

export type ServerRouteHandler = (ctx: ServerRouteContext, next?: () => Promise<void>) => void | Promise<void>;
export type Middleware = (ctx: ServerRouteContext, next: () => Promise<void>) => void | Promise<void>;

interface ServerRoute {
  method: HttpMethod;
  pattern: RegExp;
  paramNames: string[];
  handler: ServerRouteHandler;
  middlewares: Middleware[];
}


export class ServerRouter {
  private routes: ServerRoute[] = [];
  private middlewares: Middleware[] = [];

  // Accept both internal Middleware and Express-style `(req, res, next?)` functions
  // Also support path-based middleware like Express: use(path, middleware)
  use(...args: Array<any>): this {
    if (typeof args[0] === 'string') {
      // Path-based middleware: use(path, ...middlewares)
      const path = args[0];
      const middlewares = args.slice(1);
      return this.addRoute('ALL', path, middlewares);
    }
    // Global middleware
    const mw = args[0];
    this.middlewares.push(this.toMiddleware(mw));
    return this;
  }

  // Express-like .all() method - matches all HTTP methods
  all = (path: string, ...handlers: Array<Middleware | ServerRouteHandler | ((req: ElitRequest, res: ServerResponse, next?: () => void) => any)>): this => this.addRoute('ALL', path, handlers as any);

  // Support per-route middleware: accept middleware(s) before the final handler
  get = (path: string, ...handlers: Array<Middleware | ServerRouteHandler | ((req: ElitRequest, res: ServerResponse, next?: () => void) => any)>): this => this.addRoute('GET', path, handlers as any);
  post = (path: string, ...handlers: Array<Middleware | ServerRouteHandler | ((req: ElitRequest, res: ServerResponse, next?: () => void) => any)>): this => this.addRoute('POST', path, handlers as any);
  put = (path: string, ...handlers: Array<Middleware | ServerRouteHandler | ((req: ElitRequest, res: ServerResponse, next?: () => void) => any)>): this => this.addRoute('PUT', path, handlers as any);
  delete = (path: string, ...handlers: Array<Middleware | ServerRouteHandler | ((req: ElitRequest, res: ServerResponse, next?: () => void) => any)>): this => this.addRoute('DELETE', path, handlers as any);
  patch = (path: string, ...handlers: Array<Middleware | ServerRouteHandler | ((req: ElitRequest, res: ServerResponse, next?: () => void) => any)>): this => this.addRoute('PATCH', path, handlers as any);
  options = (path: string, ...handlers: Array<Middleware | ServerRouteHandler | ((req: ElitRequest, res: ServerResponse, next?: () => void) => any)>): this => this.addRoute('OPTIONS', path, handlers as any);
  head = (path: string, ...handlers: Array<Middleware | ServerRouteHandler | ((req: ElitRequest, res: ServerResponse, next?: () => void) => any)>): this => this.addRoute('HEAD', path, handlers as any);

  // Convert Express-like handler/middleware to internal Middleware
  private toMiddleware(fn: Middleware | ServerRouteHandler | ((req: ElitRequest, res: ServerResponse, next?: () => void) => any)): Middleware {
    // If it's already our Middleware, return as-is
    if ((fn as Middleware).length === 2 && (fn as any).name !== 'bound ') {
      // Cannot reliably detect, so always wrap to normalize behavior
    }

    return async (ctx: ServerRouteContext, next: () => Promise<void>) => {
      const f: any = fn;

      // Express-style with (req, res, next)
      if (f.length >= 3) {
        // Provide a next that triggers our next
        const expressNext = () => {
          // call our next but don't await here
          void next();
        };

        const res = f(ctx.req, ctx.res, expressNext);
        if (res && typeof res.then === 'function') await res;
        // If express middleware didn't call next(), we simply return and stop the chain
        return;
      }

      // Express-style with (req, res) - treat as middleware that continues after completion
      if (f.length === 2) {
        const res = f(ctx.req, ctx.res);
        if (res && typeof res.then === 'function') await res;
        await next();
        return;
      }

      // Our internal handler style (ctx) => ... - call it and continue
      const out = (fn as ServerRouteHandler)(ctx);
      if (out && typeof out.then === 'function') await out;
      await next();
    };
  }

  private addRoute(method: HttpMethod, path: string, handlers: Array<Middleware | ServerRouteHandler | ((req: ElitRequest, res: ServerResponse, next?: () => void) => any)>): this {
    const { pattern, paramNames } = this.pathToRegex(path);
    // Last item is the actual route handler, preceding items are middlewares
    if (!handlers || handlers.length === 0) throw new Error('Route must include a handler');
    const rawMiddlewares = handlers.slice(0, handlers.length - 1);
    const rawLast = handlers[handlers.length - 1];

    const middlewares = rawMiddlewares.map(h => this.toMiddleware(h as any));

    // Normalize last handler: if it's express-like, wrap into ServerRouteHandler
    const last = ((): ServerRouteHandler => {
      const f: any = rawLast;
      if (typeof f !== 'function') throw new Error('Route handler must be a function');

      if (f.length >= 2) {
        // Express-style final handler
        return async (ctx: ServerRouteContext) => {
          if (f.length >= 3) {
            // expects next
            await new Promise<void>((resolve) => {
              try {
                f(ctx.req, ctx.res, () => resolve());
              } catch (e) { resolve(); }
            });
          } else {
            const res = f(ctx.req, ctx.res);
            if (res && typeof res.then === 'function') await res;
          }
        };
      }

      // Already a ServerRouteHandler (ctx)
      return f as ServerRouteHandler;
    })();

    this.routes.push({ method, pattern, paramNames, handler: last, middlewares });
    return this;
  }

  private pathToRegex(path: string): { pattern: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];
    const pattern = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\//g, '\\/').replace(/:(\w+)/g, (_, name) => (paramNames.push(name), '([^\\/]+)'));
    return { pattern: new RegExp(`^${pattern}$`), paramNames };
  }

  private parseQuery(url: string): Record<string, string> {
    const query: Record<string, string> = {};
    const queryString = url.split('?')[1];
    if (!queryString) return query;

    queryString.split('&').forEach(p => {
      const [k, v] = p.split('=');
      if (k) {
        query[k] = v !== undefined ? v : '';
      }
    });
    return query;
  }

  /**
   * List all registered routes for debugging
   */
  listRoutes(): Array<{ method: string; pattern: string; paramNames: string[]; handler: string }> {
    return this.routes.map(route => ({
      method: route.method,
      pattern: route.pattern.source,
      paramNames: route.paramNames,
      handler: route.handler.name || '(anonymous)'
    }));
  }

  private async parseBody(req: IncomingMessage): Promise<any> {
    // Bun compatibility: Check if req has text() method (Bun Request)
    if (typeof (req as any).text === 'function') {
      try {
        const text = await (req as any).text();
        if (!text) return {};

        const contentType = req.headers['content-type'];
        const ct = (Array.isArray(contentType) ? contentType[0] : (contentType || '')).toLowerCase();

        // Parse JSON (either by content-type or if it looks like JSON)
        if (ct.includes('application/json') || ct.includes('json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
          try {
            return JSON.parse(text);
          } catch {
            return text;
          }
        }

        // Parse URL-encoded
        if (ct.includes('application/x-www-form-urlencoded') || ct.includes('urlencoded')) {
          return Object.fromEntries(new URLSearchParams(text));
        }

        // Return raw text
        return text;
      } catch (e) {
        console.log('[ServerRouter] Bun body parse error:', e);
        return {};
      }
    }

    // Node.js stream-based parsing
    return new Promise((resolve, reject) => {
      const contentLengthHeader = req.headers['content-length'];
      const contentLength = parseInt(Array.isArray(contentLengthHeader) ? contentLengthHeader[0] : (contentLengthHeader || '0'), 10);

      if (contentLength === 0) {
        resolve({});
        return;
      }

      const chunks: Buffer[] = [];

      req.on('data', chunk => {
        chunks.push(Buffer.from(chunk));
      });

      req.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        try {
          const ct = req.headers['content-type'] || '';
          resolve(ct.includes('json') ? (body ? JSON.parse(body) : {}) : ct.includes('urlencoded') ? Object.fromEntries(new URLSearchParams(body)) : body);
        } catch (e) {
          reject(e);
        }
      });

      req.on('error', reject);
    });
  }

  async handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const method = req.method as HttpMethod, url = req.url || '/', path = url.split('?')[0];

    for (const route of this.routes) {
      if (route.method !== 'ALL' && route.method !== method) continue;
      if (!route.pattern.test(path)) continue;
      const match = path.match(route.pattern)!;
      const params = Object.fromEntries(route.paramNames.map((name, i) => [name, match[i + 1]]));

      let body: any = {};
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
          body = await this.parseBody(req);
          // Attach body to req for Express-like compatibility
          (req as ElitRequest).body = body;
        }
        catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end('{"error":"Invalid request body"}');
          return true;
        }
      }

      // Parse query string and attach to req for Express-like compatibility
      const query = this.parseQuery(url);
      (req as ElitRequest).query = query;

      // Attach params to req for Express-like compatibility
      (req as ElitRequest).params = params;

      // Add Express-like response helpers to res object
      let _statusCode = 200;
      const elitRes = res as ElitResponse;

      // Implement status() method
      elitRes.status = function(code: number): ElitResponse {
        _statusCode = code;
        return this;
      };

      // Implement json() method
      elitRes.json = function(data: any, statusCode?: number): ElitResponse {
        const code = statusCode !== undefined ? statusCode : _statusCode;
        this.writeHead(code, { 'Content-Type': 'application/json' });
        this.end(JSON.stringify(data));
        return this;
      };

      // Implement send() method
      elitRes.send = function(data: any): ElitResponse {
        if (typeof data === 'string') {
          this.writeHead(_statusCode, { 'Content-Type': 'text/html' });
          this.end(data);
        } else {
          this.writeHead(_statusCode, { 'Content-Type': 'application/json' });
          this.end(JSON.stringify(data));
        }
        return this;
      };

      // Add Express-like response helpers to context
      const ctx: ServerRouteContext = {
        req: req as ElitRequest,
        res: elitRes,
        params,
        query,
        body,
        headers: req.headers as any
      };

      // Build middleware chain: global middlewares -> route middlewares -> final handler
      // Pass `next` to the final handler so it can optionally call await next()
      const routeMiddlewares = route.middlewares || [];
      const chain: Middleware[] = [
        ...this.middlewares,
        ...routeMiddlewares,
        async (c, n) => { await route.handler(c, n); }
      ];

      let i = 0;
      const next = async () => {
        if (i >= chain.length) return;
        const mw = chain[i++];
        await mw(ctx, next);
      };

      try {
        await next();
      }
      catch (e) {
        console.error('[ServerRouter] Route error:', e);
        !res.headersSent && (res.writeHead(500, { 'Content-Type': 'application/json' }), res.end(JSON.stringify({ error: 'Internal Server Error', message: e instanceof Error ? e.message : 'Unknown' })));
      }
      return true;
    }

    // No route matched
    return false;
  }
}

export const json = (res: ServerResponse, data: any, status = 200) => (res.writeHead(status, { 'Content-Type': 'application/json' }), res.end(JSON.stringify(data)));
export const text = (res: ServerResponse, data: string, status = 200) => (res.writeHead(status, { 'Content-Type': 'text/plain' }), res.end(data));
export const html = (res: ServerResponse, data: string, status = 200) => (res.writeHead(status, { 'Content-Type': 'text/html' }), res.end(data));
export const status = (res: ServerResponse, code: number, message = '') => (res.writeHead(code, { 'Content-Type': 'application/json' }), res.end(JSON.stringify({ status: code, message })));

// Helper functions for common responses
const sendError = (res: ServerResponse, code: number, msg: string): void => { res.writeHead(code, { 'Content-Type': 'text/plain' }); res.end(msg); };
const send404 = (res: ServerResponse, msg = 'Not Found'): void => sendError(res, 404, msg);
const send403 = (res: ServerResponse, msg = 'Forbidden'): void => sendError(res, 403, msg);
const send500 = (res: ServerResponse, msg = 'Internal Server Error'): void => sendError(res, 500, msg);

// Import map for all Elit client-side modules (reused in serveFile and serveSSR)
const createElitImportMap = async (rootDir: string, basePath: string = '', mode: 'dev' | 'preview' = 'dev'): Promise<string> => {
  // In dev mode, use built files from node_modules/elit/dist
  // In preview mode, use built files from dist
  const srcPath = mode === 'dev'
    ? (basePath ? `${basePath}/node_modules/elit/src` : '/node_modules/elit/src')
    : (basePath ? `${basePath}/node_modules/elit/dist` : '/node_modules/elit/dist');

  const fileExt = mode === 'dev' ? '.ts' : '.mjs';

  // Base Elit imports
  const elitImports: ImportMapEntry = {
    "elit": `${srcPath}/index${fileExt}`,
    "elit/": `${srcPath}/`,
    "elit/dom": `${srcPath}/dom${fileExt}`,
    "elit/state": `${srcPath}/state${fileExt}`,
    "elit/style": `${srcPath}/style${fileExt}`,
    "elit/el": `${srcPath}/el${fileExt}`,
    "elit/router": `${srcPath}/router${fileExt}`,
    "elit/hmr": `${srcPath}/hmr${fileExt}`,
    "elit/types": `${srcPath}/types${fileExt}`
  };

  // Generate external library imports
  const externalImports = await generateExternalImportMaps(rootDir, basePath);

  // Merge imports (Elit imports take precedence)
  const allImports = { ...externalImports, ...elitImports };

  return `<script type="importmap">${JSON.stringify({ imports: allImports }, null, 2)}</script>`;
};

// Helper function to generate HMR script (reused in serveFile and serveSSR)
const createHMRScript = (port: number, wsPath: string): string =>
  `<script>(function(){let ws;let retries=0;let maxRetries=5;function connect(){ws=new WebSocket('ws://'+window.location.hostname+':${port}${wsPath}');ws.onopen=()=>{console.log('[Elit HMR] Connected');retries=0};ws.onmessage=(e)=>{const d=JSON.parse(e.data);if(d.type==='update'){console.log('[Elit HMR] File updated:',d.path);window.location.reload()}else if(d.type==='reload'){console.log('[Elit HMR] Reloading...');window.location.reload()}else if(d.type==='error')console.error('[Elit HMR] Error:',d.error)};ws.onclose=()=>{if(retries<maxRetries){retries++;setTimeout(connect,1000*retries)}else if(retries===maxRetries){console.log('[Elit HMR] Connection closed. Start dev server to reconnect.')}};ws.onerror=()=>{ws.close()}}connect()})();</script>`;

// Helper function to rewrite relative paths with basePath (reused in serveFile and serveSSR)
const rewriteRelativePaths = (html: string, basePath: string): string => {
  if (!basePath) return html;
  // Rewrite paths starting with ./ or just relative paths (not starting with /, http://, https://)
  html = html.replace(/(<script[^>]+src=["'])(?!https?:\/\/|\/)(\.\/)?([^"']+)(["'])/g, `$1${basePath}/$3$4`);
  html = html.replace(/(<link[^>]+href=["'])(?!https?:\/\/|\/)(\.\/)?([^"']+)(["'])/g, `$1${basePath}/$3$4`);
  return html;
};

// Helper function to normalize basePath (reused in serveFile and serveSSR)
const normalizeBasePath = (basePath?: string): string => basePath && basePath !== '/' ? basePath : '';

// Helper function to find dist or node_modules directory by walking up the directory tree
async function findSpecialDir(startDir: string, targetDir: string): Promise<string | null> {
  let currentDir = startDir;
  const maxLevels = 5; // Prevent infinite loop

  for (let i = 0; i < maxLevels; i++) {
    const targetPath = resolve(currentDir, targetDir);
    try {
      const stats = await stat(targetPath);
      if (stats.isDirectory()) {
        return currentDir; // Return the parent directory containing the target
      }
    } catch {
      // Directory doesn't exist, try parent
    }

    const parentDir = resolve(currentDir, '..');
    if (parentDir === currentDir) break; // Reached filesystem root
    currentDir = parentDir;
  }

  return null;
}

// ===== External Library Import Maps =====

interface PackageExports {
  [key: string]: string | PackageExports;
}

interface PackageJson {
  name?: string;
  main?: string;
  module?: string;
  browser?: string | Record<string, string | false>;
  exports?: string | PackageExports | { [key: string]: any };
  type?: 'module' | 'commonjs';
  sideEffects?: boolean | string[];
}

interface ImportMapEntry {
  [importName: string]: string;
}

// Cache for generated import maps to avoid re-scanning
const importMapCache = new Map<string, ImportMapEntry>();

/**
 * Clear import map cache (useful when packages are added/removed)
 */
export function clearImportMapCache(): void {
  importMapCache.clear();
}

/**
 * Scan node_modules and generate import maps for external libraries
 */
async function generateExternalImportMaps(rootDir: string, basePath: string = ''): Promise<ImportMapEntry> {
  const cacheKey = `${rootDir}:${basePath}`;
  if (importMapCache.has(cacheKey)) {
    return importMapCache.get(cacheKey)!;
  }

  const importMap: ImportMapEntry = {};
  const nodeModulesPath = await findNodeModules(rootDir);

  if (!nodeModulesPath) {
    importMapCache.set(cacheKey, importMap);
    return importMap;
  }

  try {
    const { readdir } = await import('./fs');
    const packages = await readdir(nodeModulesPath);

    for (const pkgEntry of packages) {
      // Convert Dirent to string
      const pkg = typeof pkgEntry === 'string' ? pkgEntry : pkgEntry.name;

      // Skip special directories
      if (pkg.startsWith('.')) continue;

      // Handle scoped packages (@org/package)
      if (pkg.startsWith('@')) {
        try {
          const scopedPackages = await readdir(join(nodeModulesPath, pkg));
          for (const scopedEntry of scopedPackages) {
            const scopedPkg = typeof scopedEntry === 'string' ? scopedEntry : scopedEntry.name;
            const fullPkgName = `${pkg}/${scopedPkg}`;
            await processPackage(nodeModulesPath, fullPkgName, importMap, basePath);
          }
        } catch {
          // Skip if can't read scoped directory
        }
      } else {
        await processPackage(nodeModulesPath, pkg, importMap, basePath);
      }
    }
  } catch (error) {
    console.error('[Import Maps] Error scanning node_modules:', error);
  }

  importMapCache.set(cacheKey, importMap);
  return importMap;
}

/**
 * Find node_modules directory by walking up the directory tree
 */
async function findNodeModules(startDir: string): Promise<string | null> {
  const foundDir = await findSpecialDir(startDir, 'node_modules');
  return foundDir ? join(foundDir, 'node_modules') : null;
}

/**
 * Check if a package is browser-compatible
 */
function isBrowserCompatible(pkgName: string, pkgJson: PackageJson): boolean {
  // Skip build tools, compilers, and Node.js-only packages
  const buildTools = [
    'typescript', 'esbuild', '@esbuild/',
    'tsx', 'tsup', 'rollup', 'vite', 'webpack', 'parcel',
    'terser', 'uglify', 'babel', '@babel/',
    'postcss', 'autoprefixer', 'cssnano',
    'sass', 'less', 'stylus'
  ];

  const nodeOnly = [
    'node-', '@node-', 'fsevents', 'chokidar',
    'express', 'koa', 'fastify', 'nest',
    'commander', 'yargs', 'inquirer', 'chalk', 'ora',
    'nodemon', 'pm2', 'dotenv'
  ];

  const testingTools = [
    'jest', 'vitest', 'mocha', 'chai', 'jasmine',
    '@jest/', '@testing-library/', '@vitest/',
    'playwright', 'puppeteer', 'cypress'
  ];

  const linters = [
    'eslint', '@eslint/', 'prettier', 'tslint',
    'stylelint', 'commitlint'
  ];

  const typeDefinitions = [
    '@types/', '@typescript-eslint/'
  ];

  const utilities = [
    'get-tsconfig', 'resolve-pkg-maps', 'pkg-types',
    'fast-glob', 'globby', 'micromatch',
    'execa', 'cross-spawn', 'shelljs'
  ];

  // Combine all skip lists
  const skipPatterns = [
    ...buildTools,
    ...nodeOnly,
    ...testingTools,
    ...linters,
    ...typeDefinitions,
    ...utilities
  ];

  // Check if package name matches skip patterns
  if (skipPatterns.some(pattern => pkgName.startsWith(pattern))) {
    return false;
  }

  // Skip CommonJS-only lodash (prefer lodash-es)
  if (pkgName === 'lodash') {
    return false;
  }

  // Prefer packages with explicit browser field or module field (ESM)
  if (pkgJson.browser || pkgJson.module) {
    return true;
  }

  // Prefer packages with exports field that includes "import" or "browser"
  if (pkgJson.exports) {
    const exportsStr = JSON.stringify(pkgJson.exports);
    if (exportsStr.includes('"import"') || exportsStr.includes('"browser"')) {
      return true;
    }
  }

  // Skip packages that are explicitly marked as type: "commonjs" without module/browser fields
  if (pkgJson.type === 'commonjs' && !pkgJson.module && !pkgJson.browser) {
    return false;
  }

  // Default: allow if it has exports or is type: "module"
  return !!(pkgJson.exports || pkgJson.type === 'module' || pkgJson.module);
}

/**
 * Process a single package and add its exports to the import map
 */
async function processPackage(
  nodeModulesPath: string,
  pkgName: string,
  importMap: ImportMapEntry,
  basePath: string
): Promise<void> {
  const pkgPath = join(nodeModulesPath, pkgName);
  const pkgJsonPath = join(pkgPath, 'package.json');

  try {
    const pkgJsonContent = await readFile(pkgJsonPath);
    const pkgJson: PackageJson = JSON.parse(pkgJsonContent.toString());

    // Check if package is browser-compatible
    if (!isBrowserCompatible(pkgName, pkgJson)) {
      return;
    }

    const baseUrl = basePath ? `${basePath}/node_modules/${pkgName}` : `/node_modules/${pkgName}`;

    // Handle exports field (modern)
    if (pkgJson.exports) {
      processExportsField(pkgName, pkgJson.exports, baseUrl, importMap);
    }
    // Fallback to main/module/browser fields (legacy)
    else {
      const entryPoint = pkgJson.browser || pkgJson.module || pkgJson.main || 'index.js';
      importMap[pkgName] = `${baseUrl}/${entryPoint}`;

      // Add trailing slash for subpath imports
      importMap[`${pkgName}/`] = `${baseUrl}/`;
    }
  } catch {
    // Skip packages without package.json or invalid JSON
  }
}

/**
 * Process package.json exports field and add to import map
 */
function processExportsField(
  pkgName: string,
  exports: string | PackageExports | { [key: string]: any },
  baseUrl: string,
  importMap: ImportMapEntry
): void {
  // Simple string export
  if (typeof exports === 'string') {
    importMap[pkgName] = `${baseUrl}/${exports}`;
    importMap[`${pkgName}/`] = `${baseUrl}/`;
    return;
  }

  // Object exports
  if (typeof exports === 'object' && exports !== null) {
    // Handle "." export (main entry)
    if ('.' in exports) {
      const dotExport = exports['.'];
      const resolved = resolveExport(dotExport);
      if (resolved) {
        importMap[pkgName] = `${baseUrl}/${resolved}`;
      }
    } else if ('import' in exports) {
      // Root-level import/require
      const resolved = resolveExport(exports);
      if (resolved) {
        importMap[pkgName] = `${baseUrl}/${resolved}`;
      }
    }

    // Handle subpath exports
    for (const [key, value] of Object.entries(exports)) {
      if (key === '.' || key === 'import' || key === 'require' || key === 'types' || key === 'default') {
        continue;
      }

      const resolved = resolveExport(value);
      if (resolved) {
        // Remove leading ./ from key
        const cleanKey = key.startsWith('./') ? key.slice(2) : key;
        const importName = cleanKey ? `${pkgName}/${cleanKey}` : pkgName;
        importMap[importName] = `${baseUrl}/${resolved}`;
      }
    }

    // Always add trailing slash for subpath imports
    importMap[`${pkgName}/`] = `${baseUrl}/`;
  }
}

/**
 * Resolve export value to actual file path
 * Handles conditional exports (import/require/default)
 */
function resolveExport(exportValue: any): string | null {
  if (typeof exportValue === 'string') {
    // Remove leading ./
    return exportValue.startsWith('./') ? exportValue.slice(2) : exportValue;
  }

  if (typeof exportValue === 'object' && exportValue !== null) {
    // Prefer import over require over default
    const resolved = exportValue.import || exportValue.browser || exportValue.default || exportValue.require;

    // Handle nested objects recursively (e.g., TypeScript's complex exports)
    if (typeof resolved === 'object' && resolved !== null) {
      return resolveExport(resolved);
    }

    if (typeof resolved === 'string') {
      return resolved.startsWith('./') ? resolved.slice(2) : resolved;
    }
  }

  return null;
}

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

      // Change origin if requested (or remove host header if not)
      if (changeOrigin) {
        proxyReqHeaders.host = targetUrl.host;
      } else {
        delete proxyReqHeaders['host'];
      }

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
          json(res, { error: 'Bad Gateway', message: 'Proxy error' }, 502);
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

const defaultOptions: Omit<Required<DevServerOptions>, 'api' | 'clients' | 'root' | 'basePath' | 'ssr' | 'proxy' | 'index' | 'env' | 'domain'> = {
  port: 3000,
  host: 'localhost',
  https: false,
  open: true,
  watch: ['**/*.ts', '**/*.js', '**/*.html', '**/*.css'],
  ignore: ['node_modules/**', 'dist/**', '.git/**', '**/*.d.ts'],
  logging: true,
  worker: [],
  mode: 'dev'
};

interface NormalizedClient {
  root: string;
  basePath: string;
  index?: string;
  ssr?: () => Child | string;
  api?: ServerRouter;
  proxyHandler?: (req: IncomingMessage, res: ServerResponse) => Promise<boolean>;
  mode: 'dev' | 'preview';
}

export function createDevServer(options: DevServerOptions): DevServer {
  const config = { ...defaultOptions, ...options };
  const wsClients = new Set<WebSocket>();
  const stateManager = new StateManager();

  // Clear import map cache in dev mode to ensure fresh scans
  if (config.mode === 'dev') {
    clearImportMapCache();
  }

  // Normalize clients configuration - support both new API (clients array) and legacy API (root/basePath)
  const clientsToNormalize = config.clients?.length ? config.clients : config.root ? [{ root: config.root, basePath: config.basePath || '', index: config.index, ssr: config.ssr, api: config.api, proxy: config.proxy, mode: config.mode }] : null;
  if (!clientsToNormalize) throw new Error('DevServerOptions must include either "clients" array or "root" directory');

  const normalizedClients: NormalizedClient[] = clientsToNormalize.map(client => {
    let basePath = client.basePath || '';
    if (basePath) {
      // Remove leading/trailing slashes safely without ReDoS vulnerability
      while (basePath.startsWith('/')) basePath = basePath.slice(1);
      while (basePath.endsWith('/')) basePath = basePath.slice(0, -1);
      basePath = basePath ? '/' + basePath : '';
    }

    // Normalize index path - convert ./path to /path
    let indexPath = client.index;
    if (indexPath) {
      // Remove leading ./ and ensure it starts with /
      indexPath = indexPath.replace(/^\.\//, '/');
      if (!indexPath.startsWith('/')) {
        indexPath = '/' + indexPath;
      }
    }

    return {
      root: client.root,
      basePath,
      index: indexPath,
      ssr: client.ssr,
      api: client.api,
      proxyHandler: client.proxy ? createProxyHandler(client.proxy) : undefined,
      mode: client.mode || 'dev'
    };
  });

  // Create global proxy handler if proxy config exists
  const globalProxyHandler = config.proxy ? createProxyHandler(config.proxy) : null;

  // HTTP Server
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const originalUrl = req.url || '/';
    const hostHeader = req.headers.host;
    const hostName = hostHeader ? (Array.isArray(hostHeader) ? hostHeader[0] : hostHeader).split(':')[0] : '';

    // Handle domain mapping: redirect localhost:port to configured domain
    if (config.domain && hostName === (config.host || 'localhost')) {
      const redirectUrl = `http://${config.domain}${originalUrl}`;
      if (config.logging) {
        console.log(`[Domain Map] ${hostName}:${config.port}${originalUrl} -> ${redirectUrl}`);
      }
      res.writeHead(302, { Location: redirectUrl });
      res.end();
      return;
    }

    // Find matching client based on basePath
    const matchedClient = normalizedClients.find(c => c.basePath && originalUrl.startsWith(c.basePath)) || normalizedClients.find(c => !c.basePath);
    if (!matchedClient) return send404(res, '404 Not Found');

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

    // Try client-specific API routes first
    // Strip basePath from req.url so route patterns match correctly
    if (matchedClient.api) {
      if (matchedClient.basePath) req.url = url;
      const handled = await matchedClient.api.handle(req, res);
      if (matchedClient.basePath) req.url = originalUrl;
      if (handled) return;
    }

    // Try global API routes (fallback) - matches against originalUrl
    if (config.api) {
      const handled = await config.api.handle(req, res);
      if (handled) return;
    }

    // If API routes are configured but none matched, return 405 for mutating methods
    if ((matchedClient.api || config.api) && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || '')) {
      if (!res.headersSent) {
        if (config.logging) console.log(`[405] ${req.method} ${url} - Method not allowed`);
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method Not Allowed', message: 'No API route found for this request' }));
      }
      return;
    }

    // For root path requests, prioritize SSR over index files if SSR is configured
    let filePath: string;
    if (url === '/' && matchedClient.ssr && !matchedClient.index) {
      // Use SSR directly when configured and no custom index specified
      return await serveSSR(res, matchedClient);
    } else {
      // Use custom index file if specified, otherwise default to /index.html
      filePath = url === '/' ? (matchedClient.index || '/index.html') : url;
    }

    // Remove query string
    filePath = filePath.split('?')[0];

    if (config.logging && filePath === '/src/pages') {
      console.log(`[DEBUG] Request for /src/pages received`);
    }

    // Security: Check for null bytes early
    if (filePath.includes('\0')) {
      if (config.logging) console.log(`[403] Rejected path with null byte: ${filePath}`);
      return send403(res, '403 Forbidden');
    }

    // Handle /dist/* and /node_modules/* requests - serve from parent folder
    const isDistRequest = filePath.startsWith('/dist/');
    const isNodeModulesRequest = filePath.startsWith('/node_modules/');
    let normalizedPath: string;

    // Normalize and validate the path for both /dist/* and regular requests
    const tempPath = normalize(filePath).replace(/\\/g, '/').replace(/^\/+/, '');
    if (tempPath.includes('..')) {
      if (config.logging) console.log(`[403] Path traversal attempt: ${filePath}`);
      return send403(res, '403 Forbidden');
    }
    normalizedPath = tempPath;

    // Resolve file path
    const rootDir = await realpath(resolve(matchedClient.root));
    let baseDir = rootDir;

    // Auto-detect base directory for /dist/* and /node_modules/* requests
    if (isDistRequest || isNodeModulesRequest) {
      const targetDir = isDistRequest ? 'dist' : 'node_modules';
      const foundDir = await findSpecialDir(matchedClient.root, targetDir);
      baseDir = foundDir ? await realpath(foundDir) : rootDir;
    }

    let fullPath;

    try {
      // First check path without resolving symlinks for security
      const unresolvedPath = resolve(join(baseDir, normalizedPath));
      if (!unresolvedPath.startsWith(baseDir.endsWith(sep) ? baseDir : baseDir + sep)) {
        if (config.logging) console.log(`[403] File access outside of root (before symlink): ${unresolvedPath}`);
        return send403(res, '403 Forbidden');
      }

      // Then resolve symlinks to get actual file
      fullPath = await realpath(unresolvedPath);
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
            return send403(res, '403 Forbidden');
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
        if (!res.headersSent) {
          // If index.html not found but SSR function exists, use SSR
          if (filePath === '/index.html' && matchedClient.ssr) {
            return await serveSSR(res, matchedClient);
          }
          if (config.logging) console.log(`[404] ${filePath}`);
          return send404(res, '404 Not Found');
        }
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
            // If index.html not found in directory but SSR function exists, use SSR
            if (matchedClient.ssr) {
              return await serveSSR(res, matchedClient);
            }
            return send404(res, '404 Not Found');
          }
        }

        fullPath = indexPath;
      }
    } catch (statError) {
      if (config.logging) console.log(`[404] ${filePath}`);
      return send404(res, '404 Not Found');
    }

    // Security check already done before resolving symlinks (line 733)
    // No need to check again after symlink resolution as that would block legitimate symlinks

    try {
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        try {
          const indexPath = await realpath(resolve(join(fullPath, 'index.html')));
          if (!indexPath.startsWith(rootDir + sep) && indexPath !== rootDir) {
            return send403(res, '403 Forbidden');
          }
          await stat(indexPath);
          return serveFile(indexPath, req, res, matchedClient, isDistRequest || isNodeModulesRequest);
        } catch {
          return send404(res, '404 Not Found');
        }
      }

      await serveFile(fullPath, req, res, matchedClient, isDistRequest || isNodeModulesRequest);
    } catch (error) {
      // Only send 404 if response hasn't been sent yet
      if (!res.headersSent) {
        if (config.logging) console.log(`[404] ${filePath}`);
        send404(res, '404 Not Found');
      }
    }
  });

  // Serve file helper
  async function serveFile(filePath: string, req: IncomingMessage, res: ServerResponse, client: NormalizedClient, isNodeModulesOrDist: boolean = false) {
    // Escape arbitrary text for safe embedding inside a JavaScript template literal.
    // This ensures that backslashes, backticks and `${` sequences are correctly escaped.
    function escapeForTemplateLiteral(input: string): string {
      return input
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${');
    }

    try {
      const rootDir = await realpath(resolve(client.root));

      // Security: Check path before resolving symlinks
      const unresolvedPath = resolve(filePath);

      // Skip security check for node_modules and dist (these may be symlinks)
      if (!isNodeModulesOrDist) {
        // Check if path is within project root
        if (!unresolvedPath.startsWith(rootDir + sep) && unresolvedPath !== rootDir) {
          if (config.logging) console.log(`[403] Attempted to serve file outside allowed directories: ${filePath}`);
          return send403(res, '403 Forbidden');
        }
      }

      // Resolve symlinks to get actual file path
      let resolvedPath;
      try {
        resolvedPath = await realpath(unresolvedPath);

        // For symlinked packages (like node_modules/elit), allow serving from outside rootDir
        if (isNodeModulesOrDist && resolvedPath) {
          // Allow it - this is a symlinked package
          if (config.logging && !resolvedPath.startsWith(rootDir + sep)) {
            console.log(`[DEBUG] Serving symlinked file: ${resolvedPath}`);
          }
        }
      } catch {
        // If index.html not found but SSR function exists, use SSR
        if (filePath.endsWith('index.html') && client.ssr) {
          return await serveSSR(res, client);
        }
        return send404(res, '404 Not Found');
      }

      let content = await readFile(resolvedPath);
      const ext = extname(resolvedPath);
      let mimeType = lookup(resolvedPath) || 'application/octet-stream';

      // Handle CSS imports as JavaScript modules (like Vite)
      // When CSS is imported in JS/TS with ?inline query, transform it to a JS module that injects styles
      const urlQuery = req.url?.split('?')[1] || '';
      const isInlineCSS = urlQuery.includes('inline');

      if (ext === '.css' && isInlineCSS) {
        // Transform CSS to JavaScript module that injects styles
        const cssContent = escapeForTemplateLiteral(content.toString());
        const jsModule = `
const css = \`${cssContent}\`;
const style = document.createElement('style');
style.setAttribute('data-file', '${filePath}');
style.textContent = css;
document.head.appendChild(style);
export default css;
`;
        content = Buffer.from(jsModule);
        mimeType = 'application/javascript';
      }

      // Handle TypeScript files - transpile only (no bundling)
      if (ext === '.ts' || ext === '.tsx') {
        try {
          let transpiled: string;

          if (isDeno) {
            // Deno - use Deno.emit
            // @ts-ignore
            const result = await Deno.emit(resolvedPath, {
              check: false,
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

          } else if (isBun) {
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
            const { transformSync } = await import('esbuild');
            const loader = ext === '.tsx' ? 'tsx' : 'ts';
            const result = transformSync(content.toString(), {
              loader: loader as any,
              format: 'esm',
              target: 'es2020',
              sourcemap: 'inline'
            });

            transpiled = result.code;
          }

          // Rewrite .ts imports to .js for browser compatibility
          // This allows developers to write import './file.ts' in their source code
          // and the dev server will automatically rewrite it to import './file.js'
          transpiled = transpiled.replace(
            /from\s+["']([^"']+)\.ts(x?)["']/g,
            (_, path, tsx) => `from "${path}.js${tsx}"`
          );
          transpiled = transpiled.replace(
            /import\s+["']([^"']+)\.ts(x?)["']/g,
            (_, path, tsx) => `import "${path}.js${tsx}"`
          );

          // Rewrite CSS imports to add ?inline query parameter
          // This tells the server to return CSS as a JavaScript module
          transpiled = transpiled.replace(
            /import\s+["']([^"']+\.css)["']/g,
            (_, path) => `import "${path}?inline"`
          );
          transpiled = transpiled.replace(
            /from\s+["']([^"']+\.css)["']/g,
            (_, path) => `from "${path}?inline"`
          );

          content = Buffer.from(transpiled);
          mimeType = 'application/javascript';
        } catch (error) {
          if (config.logging) console.error('[500] TypeScript compilation error:', error);
          return send500(res, `TypeScript compilation error:\n${error}`);
        }
      }

      // Inject HMR client and import map for HTML files
      if (ext === '.html') {
        const wsPath = normalizeBasePath(client.basePath);
        const hmrScript = createHMRScript(config.port, wsPath);
        let html = content.toString();

        // If SSR is configured, extract and inject styles from SSR
        let ssrStyles = '';
        if (client.ssr) {
          try {
            const result = client.ssr();
            let ssrHtml: string;

            // Convert SSR result to string
            if (typeof result === 'string') {
              ssrHtml = result;
            } else if (typeof result === 'object' && result !== null && 'tagName' in result) {
              ssrHtml = dom.renderToString(result as VNode);
            } else {
              ssrHtml = String(result);
            }

            // Extract <style> tags from SSR output
            const styleMatches = ssrHtml.match(/<style[^>]*>[\s\S]*?<\/style>/g);
            if (styleMatches) {
              ssrStyles = styleMatches.join('\n');
            }
          } catch (error) {
            if (config.logging) console.error('[Warning] Failed to extract styles from SSR:', error);
          }
        }

        // Fix relative paths to use basePath
        const basePath = normalizeBasePath(client.basePath);
        html = rewriteRelativePaths(html, basePath);

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

        // Inject import map and SSR styles into <head>
        const elitImportMap = await createElitImportMap(client.root, basePath, client.mode);
        const headInjection = ssrStyles ? `${ssrStyles}\n${elitImportMap}` : elitImportMap;
        html = html.includes('</head>') ? html.replace('</head>', `${headInjection}</head>`) : html;
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
      if (config.logging) console.error('[500] Error reading file:', error);
      send500(res, '500 Internal Server Error');
    }
  }

  // SSR helper - Generate HTML from SSR function
  async function serveSSR(res: ServerResponse, client: NormalizedClient) {
    try {
      if (!client.ssr) {
        return send500(res, 'SSR function not configured');
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

      // Fix relative paths to use basePath
      const basePath = normalizeBasePath(client.basePath);
      html = rewriteRelativePaths(html, basePath);

      // Inject HMR script
      const hmrScript = createHMRScript(config.port, basePath);

      // Inject import map in head, HMR script in body
      const elitImportMap = await createElitImportMap(client.root, basePath, client.mode);
      html = html.includes('</head>') ? html.replace('</head>', `${elitImportMap}</head>`) : html;
      html = html.includes('</body>') ? html.replace('</body>', `${hmrScript}</body>`) : html + hmrScript;

      res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache, no-store, must-revalidate' });
      res.end(html);

      if (config.logging) console.log(`[200] SSR rendered`);
    } catch (error) {
      if (config.logging) console.error('[500] SSR Error:', error);
      send500(res, '500 SSR Error');
    }
  }

  // WebSocket Server for HMR
  const wss = new WebSocketServer({ server });

  if (config.logging) {
    console.log('[HMR] WebSocket server initialized');
  }

  wss.on('connection', (ws: WebSocket, req) => {
    wsClients.add(ws);

    const message: HMRMessage = { type: 'connected', timestamp: Date.now() };
    ws.send(JSON.stringify(message));

    if (config.logging) {
      console.log('[HMR] Client connected from', req.socket.remoteAddress);
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
    // Broadcast to all open clients with error handling
    wsClients.forEach(client => {
      if (client.readyState === ReadyState.OPEN) {
        client.send(message, {}, (err?: Error) => {
          // Silently ignore connection errors during HMR
          const code = (err as any)?.code;
          if (code === 'ECONNABORTED' || code === 'ECONNRESET' || code === 'EPIPE' || code === 'WS_NOT_OPEN') {
            // Client disconnected - will be removed from clients set by close event
            return;
          }
        });
      }
    });
  });

  watcher.on('add', (path: string) => {
    if (config.logging) console.log(`[HMR] File added: ${path}`);
    const message = JSON.stringify({ type: 'update', path, timestamp: Date.now() } as HMRMessage);
    wsClients.forEach(client => {
      if (client.readyState === ReadyState.OPEN) client.send(message, {});
    });
  });

  watcher.on('unlink', (path: string) => {
    if (config.logging) console.log(`[HMR] File removed: ${path}`);
    const message = JSON.stringify({ type: 'reload', path, timestamp: Date.now() } as HMRMessage);
    wsClients.forEach(client => {
      if (client.readyState === ReadyState.OPEN) client.send(message, {});
    });
  });

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
