/**
 * REST API Router for elit-server
 */

import type { IncomingMessage, ServerResponse } from 'http';

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

  /**
   * Add middleware
   */
  use(middleware: Middleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * GET route
   */
  get(path: string, handler: RouteHandler): this {
    return this.addRoute('GET', path, handler);
  }

  /**
   * POST route
   */
  post(path: string, handler: RouteHandler): this {
    return this.addRoute('POST', path, handler);
  }

  /**
   * PUT route
   */
  put(path: string, handler: RouteHandler): this {
    return this.addRoute('PUT', path, handler);
  }

  /**
   * DELETE route
   */
  delete(path: string, handler: RouteHandler): this {
    return this.addRoute('DELETE', path, handler);
  }

  /**
   * PATCH route
   */
  patch(path: string, handler: RouteHandler): this {
    return this.addRoute('PATCH', path, handler);
  }

  /**
   * OPTIONS route
   */
  options(path: string, handler: RouteHandler): this {
    return this.addRoute('OPTIONS', path, handler);
  }

  /**
   * Add route for any method
   */
  private addRoute(method: HttpMethod, path: string, handler: RouteHandler): this {
    const { pattern, paramNames } = this.pathToRegex(path);
    this.routes.push({ method, pattern, paramNames, handler });
    return this;
  }

  /**
   * Convert path pattern to regex
   */
  private pathToRegex(path: string): { pattern: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];

    // Convert /users/:id/posts/:postId to regex
    // First escape all regex special characters except colons (for params)
    let pattern = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Then escape forward slashes for regex
    pattern = pattern.replace(/\//g, '\\/');

    // Finally convert parameter placeholders to capture groups
    pattern = pattern.replace(/:(\w+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return '([^\\/]+)';
    });

    return {
      pattern: new RegExp(`^${pattern}$`),
      paramNames
    };
  }

  /**
   * Parse query string
   */
  private parseQuery(url: string): Record<string, string> {
    const query: Record<string, string> = {};
    const queryString = url.split('?')[1];

    if (queryString) {
      const params = new URLSearchParams(queryString);
      params.forEach((value, key) => {
        query[key] = value;
      });
    }

    return query;
  }

  /**
   * Parse JSON body
   */
  private async parseBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';

      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const contentType = req.headers['content-type'] || '';

          if (contentType.includes('application/json')) {
            resolve(body ? JSON.parse(body) : {});
          } else if (contentType.includes('application/x-www-form-urlencoded')) {
            const params = new URLSearchParams(body);
            const data: Record<string, string> = {};
            params.forEach((value, key) => {
              data[key] = value;
            });
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

  /**
   * Handle incoming request
   */
  async handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const method = req.method as HttpMethod;
    const url = req.url || '/';
    const path = url.split('?')[0];

    // Find matching route
    for (const route of this.routes) {
      if (route.method !== method) continue;

      const match = path.match(route.pattern);
      if (!match) continue;

      // Extract params
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, index) => {
        params[name] = match[index + 1];
      });

      // Parse query
      const query = this.parseQuery(url);

      // Parse body for POST, PUT, PATCH
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

      // Create context
      const ctx: RouteContext = {
        req,
        res,
        params,
        query,
        body,
        headers: req.headers as Record<string, string | string[] | undefined>
      };

      // Run middlewares
      let middlewareIndex = 0;
      const next = async (): Promise<void> => {
        if (middlewareIndex < this.middlewares.length) {
          const middleware = this.middlewares[middlewareIndex++];
          await middleware(ctx, next);
        }
      };

      try {
        // Execute middlewares
        await next();

        // Execute route handler
        await route.handler(ctx);
      } catch (error) {
        console.error('Route handler error:', error);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error'
          }));
        }
      }

      return true;
    }

    return false;
  }
}

/**
 * Response helpers
 */
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
