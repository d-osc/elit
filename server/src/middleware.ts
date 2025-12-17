/**
 * Built-in middleware for @elit/server
 */

import type { Middleware, RouteContext } from './router';

/**
 * CORS middleware
 */
export function cors(options: {
  origin?: string | string[];
  methods?: string[];
  credentials?: boolean;
  maxAge?: number;
} = {}): Middleware {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials = true,
    maxAge = 86400
  } = options;

  return async (ctx, next) => {
    const requestOrigin = ctx.req.headers.origin || '';

    // Set CORS headers
    if (Array.isArray(origin)) {
      if (origin.includes(requestOrigin)) {
        ctx.res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      }
    } else {
      ctx.res.setHeader('Access-Control-Allow-Origin', origin);
    }

    ctx.res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
    ctx.res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (credentials) {
      ctx.res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    ctx.res.setHeader('Access-Control-Max-Age', String(maxAge));

    // Handle preflight
    if (ctx.req.method === 'OPTIONS') {
      ctx.res.writeHead(204);
      ctx.res.end();
      return;
    }

    await next();
  };
}

/**
 * Logging middleware
 */
export function logger(options: {
  format?: 'simple' | 'detailed';
} = {}): Middleware {
  const { format = 'simple' } = options;

  return async (ctx, next) => {
    const start = Date.now();
    const { method, url } = ctx.req;

    await next();

    const duration = Date.now() - start;
    const status = ctx.res.statusCode;

    if (format === 'detailed') {
      console.log(`[${new Date().toISOString()}] ${method} ${url} ${status} - ${duration}ms`);
    } else {
      console.log(`${method} ${url} - ${status} (${duration}ms)`);
    }
  };
}

/**
 * Error handling middleware
 */
export function errorHandler(): Middleware {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      console.error('Error:', error);

      if (!ctx.res.headersSent) {
        ctx.res.writeHead(500, { 'Content-Type': 'application/json' });
        ctx.res.end(JSON.stringify({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    }
  };
}

/**
 * Rate limiting middleware
 */
export function rateLimit(options: {
  windowMs?: number;
  max?: number;
  message?: string;
} = {}): Middleware {
  const {
    windowMs = 60000, // 1 minute
    max = 100,
    message = 'Too many requests'
  } = options;

  const clients = new Map<string, { count: number; resetTime: number }>();

  return async (ctx, next) => {
    const ip = ctx.req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let clientData = clients.get(ip);

    if (!clientData || now > clientData.resetTime) {
      clientData = { count: 0, resetTime: now + windowMs };
      clients.set(ip, clientData);
    }

    clientData.count++;

    if (clientData.count > max) {
      ctx.res.writeHead(429, { 'Content-Type': 'application/json' });
      ctx.res.end(JSON.stringify({ error: message }));
      return;
    }

    await next();
  };
}

/**
 * Body size limit middleware
 */
export function bodyLimit(options: {
  limit?: number; // in bytes
} = {}): Middleware {
  const { limit = 1024 * 1024 } = options; // 1MB default

  return async (ctx, next) => {
    const contentLength = parseInt(ctx.req.headers['content-length'] || '0', 10);

    if (contentLength > limit) {
      ctx.res.writeHead(413, { 'Content-Type': 'application/json' });
      ctx.res.end(JSON.stringify({ error: 'Request body too large' }));
      return;
    }

    await next();
  };
}

/**
 * Cache control middleware
 */
export function cacheControl(options: {
  maxAge?: number;
  public?: boolean;
} = {}): Middleware {
  const { maxAge = 3600, public: isPublic = true } = options;

  return async (ctx, next) => {
    const directive = isPublic ? 'public' : 'private';
    ctx.res.setHeader('Cache-Control', `${directive}, max-age=${maxAge}`);
    await next();
  };
}

/**
 * Compression middleware (simple gzip)
 */
export function compress(): Middleware {
  return async (ctx, next) => {
    const acceptEncoding = ctx.req.headers['accept-encoding'] || '';

    if (acceptEncoding.includes('gzip')) {
      ctx.res.setHeader('Content-Encoding', 'gzip');
    }

    await next();
  };
}

/**
 * Security headers middleware
 */
export function security(): Middleware {
  return async (ctx, next) => {
    ctx.res.setHeader('X-Content-Type-Options', 'nosniff');
    ctx.res.setHeader('X-Frame-Options', 'DENY');
    ctx.res.setHeader('X-XSS-Protection', '1; mode=block');
    ctx.res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    await next();
  };
}
