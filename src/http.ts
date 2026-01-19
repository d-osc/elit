/**
 * HTTP module with unified API across runtimes
 * Ultra-optimized for maximum performance across Node.js, Bun, and Deno
 *
 * Performance optimizations:
 * - Bun fast path: Zero class instantiation (object literals only)
 * - Eliminated EventEmitter overhead for Bun/Deno
 * - Zero-copy headers conversion
 * - Inline response creation
 * - Reduced object allocations
 * - Direct closure capture (no resolver indirection)
 */

import { EventEmitter } from 'node:events';
import { runtime, isBun, isDeno, isNode } from './runtime';

/**
 * Helper: Check if running on Node.js (eliminates duplication in runtime checks)
 */


/**
 * Helper: Queue callback (eliminates duplication in callback handling)
 */
function queueCallback(callback?: () => void): void {
  if (callback) queueMicrotask(callback);
}

/**
 * Helper: Convert headers to HeadersInit (eliminates duplication in Response creation)
 */
function headersToInit(headers: OutgoingHttpHeaders): HeadersInit {
  const result: HeadersInit = {};
  for (const key in headers) {
    const value = headers[key];
    result[key] = Array.isArray(value) ? value.join(', ') : String(value);
  }
  return result;
}

/**
 * Helper: Create address object (eliminates duplication in address() method)
 */
function createAddress(port: number, address: string, family = 'IPv4'): { port: number; family: string; address: string } {
  return { port, family, address };
}

/**
 * Helper: Create error Response (eliminates duplication in error handling)
 */
function createErrorResponse(): Response {
  return new Response('Internal Server Error', { status: 500 });
}

/**
 * Helper: Emit listening and queue callback (eliminates duplication in Bun/Deno listen)
 */
function emitListeningWithCallback(server: Server, callback?: () => void): void {
  server._listening = true;
  server.emit('listening');
  queueCallback(callback);
}

/**
 * Helper: Close server and emit events (eliminates duplication in Bun/Deno close)
 */
function closeAndEmit(server: Server, callback?: (err?: Error) => void): void {
  server._listening = false;
  server.emit('close');
  if (callback) queueMicrotask(() => callback());
}

// Lazy-load native modules for Node.js
let http: any, https: any;

// Initialize immediately for Node.js (synchronous require)
if (isNode && typeof process !== 'undefined') {
  try {
    http = require('node:http');
    https = require('node:https');
  } catch (e) {
    // Fallback for older Node versions
    http = require('http');
    https = require('https');
  }
}

/**
 * HTTP Methods
 */
export const METHODS = [
  'GET', 'POST', 'PUT', 'DELETE', 'PATCH',
  'HEAD', 'OPTIONS', 'CONNECT', 'TRACE'
] as const;

/**
 * HTTP Status Codes (compact object)
 */
export const STATUS_CODES: Record<number, string> = {
  100: 'Continue', 101: 'Switching Protocols', 102: 'Processing',
  200: 'OK', 201: 'Created', 202: 'Accepted', 203: 'Non-Authoritative Information',
  204: 'No Content', 205: 'Reset Content', 206: 'Partial Content',
  300: 'Multiple Choices', 301: 'Moved Permanently', 302: 'Found',
  303: 'See Other', 304: 'Not Modified', 307: 'Temporary Redirect', 308: 'Permanent Redirect',
  400: 'Bad Request', 401: 'Unauthorized', 402: 'Payment Required', 403: 'Forbidden',
  404: 'Not Found', 405: 'Method Not Allowed', 406: 'Not Acceptable',
  407: 'Proxy Authentication Required', 408: 'Request Timeout', 409: 'Conflict',
  410: 'Gone', 411: 'Length Required', 412: 'Precondition Failed',
  413: 'Payload Too Large', 414: 'URI Too Long', 415: 'Unsupported Media Type',
  416: 'Range Not Satisfiable', 417: 'Expectation Failed', 418: "I'm a teapot",
  422: 'Unprocessable Entity', 425: 'Too Early', 426: 'Upgrade Required',
  428: 'Precondition Required', 429: 'Too Many Requests',
  431: 'Request Header Fields Too Large', 451: 'Unavailable For Legal Reasons',
  500: 'Internal Server Error', 501: 'Not Implemented', 502: 'Bad Gateway',
  503: 'Service Unavailable', 504: 'Gateway Timeout', 505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates', 507: 'Insufficient Storage', 508: 'Loop Detected',
  510: 'Not Extended', 511: 'Network Authentication Required',
};

/**
 * HTTP Headers type
 */
export type IncomingHttpHeaders = Record<string, string | string[] | undefined>;
export type OutgoingHttpHeaders = Record<string, string | string[] | number>;

/**
 * IncomingMessage - Ultra-optimized for zero-copy operations
 */
export class IncomingMessage extends EventEmitter {
  public method: string;
  public url: string;
  public headers: IncomingHttpHeaders;
  public statusCode?: number;
  public statusMessage?: string;
  public httpVersion: string = '1.1';
  public rawHeaders: string[] = [];
  public socket: any;

  private _req: any;

  constructor(req: any) {
    super();
    this._req = req;

    if (isNode) {
      // Direct property access (fastest)
      this.method = req.method;
      this.url = req.url;
      this.headers = req.headers;
      this.statusCode = req.statusCode;
      this.statusMessage = req.statusMessage;
      this.httpVersion = req.httpVersion;
      this.rawHeaders = req.rawHeaders;
      this.socket = req.socket;
    } else {
      // Bun/Deno Request object - zero-copy parsing
      this.method = req.method;
      const urlObj = new URL(req.url);
      this.url = urlObj.pathname + urlObj.search;

      // Direct headers reference (zero-copy)
      this.headers = req.headers;
      this.rawHeaders = [];
    }
  }

  async text(): Promise<string> {
    if (isNode) {
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        this._req.on('data', (chunk: Buffer) => chunks.push(chunk));
        this._req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        this._req.on('error', reject);
      });
    }
    // Bun/Deno - direct text() call
    return this._req.text();
  }

  async json(): Promise<any> {
    if (isNode) {
      const text = await this.text();
      return JSON.parse(text);
    }
    // Bun/Deno - optimized json() method
    return this._req.json();
  }
}

/**
 * ServerResponse - Ultra-optimized write operations
 */
export class ServerResponse extends EventEmitter {
  public statusCode: number = 200;
  public statusMessage: string = 'OK';
  public headersSent: boolean = false;

  private _headers: OutgoingHttpHeaders;
  private _body: string = '';
  private _resolve?: (response: Response) => void;
  private _finished: boolean = false;
  private _nodeRes?: any;

  constructor(_req?: IncomingMessage, nodeRes?: any) {
    super();
    this._nodeRes = nodeRes;
    // Use Object.create(null) for faster property access
    this._headers = Object.create(null);
  }

  setHeader(name: string, value: string | string[] | number): this {
    if (this.headersSent) {
      throw new Error('Cannot set headers after they are sent');
    }

    if (isNode && this._nodeRes) {
      this._nodeRes.setHeader(name, value);
    }

    this._headers[name.toLowerCase()] = value;
    return this;
  }

  getHeader(name: string): string | string[] | number | undefined {
    if (isNode && this._nodeRes) {
      return this._nodeRes.getHeader(name);
    }
    return this._headers[name.toLowerCase()];
  }

  getHeaders(): OutgoingHttpHeaders {
    if (isNode && this._nodeRes) {
      return this._nodeRes.getHeaders();
    }
    return { ...this._headers };
  }

  getHeaderNames(): string[] {
    if (isNode && this._nodeRes) {
      return this._nodeRes.getHeaderNames();
    }
    return Object.keys(this._headers);
  }

  hasHeader(name: string): boolean {
    if (isNode && this._nodeRes) {
      return this._nodeRes.hasHeader(name);
    }
    return name.toLowerCase() in this._headers;
  }

  removeHeader(name: string): void {
    if (this.headersSent) {
      throw new Error('Cannot remove headers after they are sent');
    }

    if (isNode && this._nodeRes) {
      this._nodeRes.removeHeader(name);
    }

    delete this._headers[name.toLowerCase()];
  }

  writeHead(statusCode: number, statusMessage?: string | OutgoingHttpHeaders, headers?: OutgoingHttpHeaders): this {
    if (this.headersSent) {
      throw new Error('Cannot write headers after they are sent');
    }

    this.statusCode = statusCode;

    if (typeof statusMessage === 'string') {
      this.statusMessage = statusMessage;
      if (headers) {
        for (const key in headers) {
          this.setHeader(key, headers[key]!);
        }
      }
    } else if (statusMessage) {
      for (const key in statusMessage) {
        this.setHeader(key, statusMessage[key]!);
      }
    }

    if (isNode && this._nodeRes) {
      if (typeof statusMessage === 'string') {
        this._nodeRes.writeHead(statusCode, statusMessage, headers);
      } else {
        this._nodeRes.writeHead(statusCode, statusMessage);
      }
    }

    this.headersSent = true;
    return this;
  }

  write(chunk: any, encoding?: BufferEncoding | (() => void), callback?: () => void): boolean {
    if (typeof encoding === 'function') {
      callback = encoding;
      encoding = 'utf8';
    }

    if (!this.headersSent) {
      this.writeHead(this.statusCode);
    }

    if (isNode && this._nodeRes) {
      return this._nodeRes.write(chunk, encoding, callback);
    }

    this._body += chunk;
    queueCallback(callback);

    return true;
  }

  end(chunk?: any, encoding?: BufferEncoding | (() => void), callback?: () => void): this {
    if (this._finished) {
      return this;
    }

    if (typeof chunk === 'function') {
      callback = chunk;
      chunk = undefined;
    } else if (typeof encoding === 'function') {
      callback = encoding;
      encoding = 'utf8';
    }

    if (chunk !== undefined) {
      this.write(chunk, encoding as BufferEncoding);
    }

    if (!this.headersSent) {
      this.writeHead(this.statusCode);
    }

    this._finished = true;

    if (isNode && this._nodeRes) {
      // Don't pass chunk to end() since we already wrote it via this.write() above
      this._nodeRes.end(callback);
      this.emit('finish');
    } else {
      // Bun/Deno - ultra-optimized inline Response creation
      const response = new Response(this._body, {
        status: this.statusCode,
        statusText: this.statusMessage,
        headers: headersToInit(this._headers),
      });

      if (this._resolve) {
        this._resolve(response);
      }

      queueCallback(callback);
    }

    return this;
  }

  _setResolver(resolve: (response: Response) => void): void {
    this._resolve = resolve;
  }

  // Express.js-like methods
  json(data: any, statusCode = 200): this {
    if (!this.headersSent) {
      this.setHeader('Content-Type', 'application/json');
    }
    this.statusCode = statusCode;
    this.end(JSON.stringify(data));
    return this;
  }

  send(data: any): this {
    if (typeof data === 'object') {
      return this.json(data);
    }
    if (!this.headersSent) {
      this.setHeader('Content-Type', 'text/plain');
    }
    this.end(String(data));
    return this;
  }

  status(code: number): this {
    this.statusCode = code;
    return this;
  }
}

/**
 * Server - Optimized for each runtime
 */
export class Server extends EventEmitter {
  private nativeServer?: any;
  private requestListener?: RequestListener;
  public _listening: boolean = false;

  constructor(requestListener?: RequestListener) {
    super();
    this.requestListener = requestListener;
  }

  listen(port?: number, hostname?: string, backlog?: number, listeningListener?: () => void): this;
  listen(port?: number, hostname?: string, listeningListener?: () => void): this;
  listen(port?: number, listeningListener?: () => void): this;
  listen(options?: { port?: number; hostname?: string; backlog?: number }, listeningListener?: () => void): this;
  listen(...args: any[]): this {
    let port = 3000;
    let hostname = '0.0.0.0';
    let callback: (() => void) | undefined;

    // Optimized argument parsing
    const firstArg = args[0];
    if (typeof firstArg === 'number') {
      port = firstArg;
      const secondArg = args[1];
      if (typeof secondArg === 'string') {
        hostname = secondArg;
        callback = args[2] || args[3];
      } else if (typeof secondArg === 'function') {
        callback = secondArg;
      }
    } else if (firstArg && typeof firstArg === 'object') {
      port = firstArg.port || 3000;
      hostname = firstArg.hostname || '0.0.0.0';
      callback = args[1];
    }

    const self = this;

    if (isNode) {
      // Node.js - delegate directly to native http
      this.nativeServer = http.createServer((req: any, res: any) => {
        const incomingMessage = new IncomingMessage(req);
        const serverResponse = new ServerResponse(incomingMessage, res);

        if (self.requestListener) {
          self.requestListener(incomingMessage, serverResponse);
        } else {
          self.emit('request', incomingMessage, serverResponse);
        }
      });

      // Forward upgrade event for WebSocket support
      this.nativeServer.on('upgrade', (req: any, socket: any, head: any) => {
        self.emit('upgrade', req, socket, head);
      });

      this.nativeServer.listen(port, hostname, () => {
        this._listening = true;
        this.emit('listening');
        if (callback) callback();
      });

      this.nativeServer.on('error', (err: Error) => this.emit('error', err));
      this.nativeServer.on('close', () => {
        this._listening = false;
        this.emit('close');
      });
    } else if (isBun) {
      // Bun - ULTRA-OPTIMIZED direct fast path (zero wrapper overhead)
      // @ts-ignore
      this.nativeServer = Bun.serve({
        port,
        hostname,
        fetch: (req: Request) => {
          // Fast path: Create minimal context object to avoid wrapper classes
          const urlObj = new URL(req.url);
          const pathname = urlObj.pathname + urlObj.search;

          // Ultra-lightweight response builder (no class instantiation)
          let statusCode = 200;
          let statusMessage = 'OK';
          let body = '';
          const headers: Record<string, string> = Object.create(null);
          let responseReady = false;

          // Minimal IncomingMessage-compatible object (object literal is faster than class)
          const incomingMessage: any = {
            method: req.method,
            url: pathname,
            headers: req.headers,
            httpVersion: '1.1',
            rawHeaders: [],
            _req: req,
            text: () => req.text(),
            json: () => req.json(),
          };

          // Minimal ServerResponse-compatible object (inline methods, no inheritance)
          const serverResponse: any = {
            statusCode: 200,
            statusMessage: 'OK',
            headersSent: false,
            _headers: headers,

            setHeader(name: string, value: string | string[] | number) {
              headers[name.toLowerCase()] = Array.isArray(value) ? value.join(', ') : String(value);
              return this;
            },

            getHeader(name: string) {
              return headers[name.toLowerCase()];
            },

            getHeaders() {
              return { ...headers };
            },

            writeHead(status: number, arg2?: any, arg3?: any) {
              statusCode = status;
              this.statusCode = status;
              this.headersSent = true;

              if (typeof arg2 === 'string') {
                statusMessage = arg2;
                this.statusMessage = arg2;
                if (arg3) {
                  for (const key in arg3) {
                    headers[key.toLowerCase()] = arg3[key];
                  }
                }
              } else if (arg2) {
                for (const key in arg2) {
                  headers[key.toLowerCase()] = arg2[key];
                }
              }
              return this;
            },

            write(chunk: any) {
              if (!this.headersSent) {
                this.writeHead(statusCode);
              }
              body += chunk;
              return true;
            },

            end(chunk?: any) {
              if (chunk !== undefined) {
                this.write(chunk);
              }
              if (!this.headersSent) {
                this.writeHead(statusCode);
              }
              responseReady = true;
              return this;
            },
          };

          // Execute handler
          if (self.requestListener) {
            self.requestListener(incomingMessage, serverResponse);
          }

          // Inline Response creation (fastest path - no function calls)
          if (responseReady) {
            return new Response(body, {
              status: statusCode,
              statusText: statusMessage,
              headers: headers as HeadersInit,
            });
          }

          // Fallback for async (rare case)
          return new Promise<Response>((resolve) => {
            serverResponse.end = (chunk?: any) => {
              if (chunk !== undefined) {
                body += chunk;
              }
              resolve(new Response(body, {
                status: statusCode,
                statusText: statusMessage,
                headers: headers as HeadersInit,
              }));
            };
          });
        },
        error: createErrorResponse,
      });

      emitListeningWithCallback(this, callback);
    } else if (isDeno) {
      // Deno - use Deno.serve()
      // @ts-ignore
      this.nativeServer = Deno.serve({
        port,
        hostname,
        handler: (req: Request) => {
          return new Promise<Response>((resolve) => {
            const incomingMessage = new IncomingMessage(req);
            const serverResponse = new ServerResponse();

            serverResponse._setResolver(resolve);

            if (self.requestListener) {
              self.requestListener(incomingMessage, serverResponse);
            } else {
              self.emit('request', incomingMessage, serverResponse);
            }
          });
        },
        onError: (error: Error) => {
          this.emit('error', error);
          return createErrorResponse();
        },
      });

      emitListeningWithCallback(this, callback);
    }

    return this;
  }

  close(callback?: (err?: Error) => void): this {
    if (!this.nativeServer) {
      if (callback) queueMicrotask(() => callback());
      return this;
    }

    if (isNode) {
      this.nativeServer.close(callback);
    } else if (isBun) {
      this.nativeServer.stop();
      closeAndEmit(this, callback);
    } else if (isDeno) {
      // @ts-ignore
      this.nativeServer.shutdown();
      closeAndEmit(this, callback);
    }

    return this;
  }

  address(): { port: number; family: string; address: string } | null {
    if (!this.nativeServer) return null;

    if (isNode) {
      const addr = this.nativeServer.address();
      if (!addr) return null;
      if (typeof addr === 'string') {
        return createAddress(0, addr, 'unix');
      }
      return addr;
    } else if (isBun) {
      return createAddress(this.nativeServer.port, this.nativeServer.hostname);
    } else if (isDeno) {
      // @ts-ignore
      const addr = this.nativeServer.addr;
      return createAddress(addr.port, addr.hostname);
    }

    return null;
  }

  get listening(): boolean {
    return this._listening;
  }
}

/**
 * Request listener type
 */
export type RequestListener = (req: IncomingMessage, res: ServerResponse) => void;

/**
 * Request options
 */
export interface RequestOptions {
  method?: string;
  headers?: OutgoingHttpHeaders;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * Server options
 */
export interface ServerOptions {
  IncomingMessage?: typeof IncomingMessage;
  ServerResponse?: typeof ServerResponse;
}

/**
 * Client request - lightweight wrapper
 */
export class ClientRequest extends EventEmitter {
  constructor(_url: string | URL, _options: RequestOptions = {}) {
    super();
  }

  write(_chunk: any): boolean {
    return true;
  }

  end(callback?: () => void): void {
    queueCallback(callback);
  }
}

/**
 * HTTP Agent
 */
export class Agent {
  constructor(public options?: any) { }
}

/**
 * Create HTTP server
 */
export function createServer(requestListener?: RequestListener): Server;
export function createServer(options: ServerOptions, requestListener?: RequestListener): Server;
export function createServer(
  optionsOrListener?: ServerOptions | RequestListener,
  requestListener?: RequestListener
): Server {
  return new Server(typeof optionsOrListener === 'function' ? optionsOrListener : requestListener);
}

/**
 * Make HTTP request - optimized per runtime
 */
export function request(url: string | URL, options?: RequestOptions, callback?: (res: IncomingMessage) => void): ClientRequest {
  const urlString = typeof url === 'string' ? url : url.toString();
  const req = new ClientRequest(urlString, options);

  if (isNode) {
    const urlObj = new URL(urlString);
    const client = urlObj.protocol === 'https:' ? https : http;

    const nodeReq = client.request(urlString, {
      method: options?.method || 'GET',
      headers: options?.headers,
      timeout: options?.timeout,
      signal: options?.signal,
    }, (res: any) => {
      const incomingMessage = new IncomingMessage(res);
      if (callback) callback(incomingMessage);
      req.emit('response', incomingMessage);
    });

    nodeReq.on('error', (error: Error) => req.emit('error', error));
    nodeReq.end();
  } else {
    // Bun/Deno - use optimized fetch
    queueMicrotask(async () => {
      try {
        const response = await fetch(urlString, {
          method: options?.method || 'GET',
          headers: options?.headers as HeadersInit,
          signal: options?.signal,
        });

        const fetchRequest = new Request(urlString);
        const incomingMessage = new IncomingMessage(fetchRequest);
        incomingMessage.statusCode = response.status;
        incomingMessage.statusMessage = response.statusText;

        if (callback) callback(incomingMessage);
        req.emit('response', incomingMessage);
      } catch (error) {
        req.emit('error', error);
      }
    });
  }

  return req;
}

/**
 * Make HTTP GET request
 */
export function get(url: string | URL, options?: RequestOptions, callback?: (res: IncomingMessage) => void): ClientRequest {
  return request(url, { ...options, method: 'GET' }, callback);
}

/**
 * Get current runtime
 */
export function getRuntime(): 'node' | 'bun' | 'deno' {
  return runtime;
}

/**
 * Default export
 */
export default {
  createServer,
  request,
  get,
  Server,
  IncomingMessage,
  ServerResponse,
  Agent,
  ClientRequest,
  METHODS,
  STATUS_CODES,
  getRuntime,
};
