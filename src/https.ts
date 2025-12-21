/**
 * HTTPS module with unified API across runtimes
 * Optimized for maximum performance across Node.js, Bun, and Deno
 */

import { EventEmitter } from 'events';
import type {
  IncomingMessage,
  ServerResponse,
  RequestListener,
  RequestOptions,
} from './http';
import { runtime, isNode, isBun, isDeno } from './runtime';

/**
 * Helper: Queue callback (eliminates duplication in callback handling)
 */
function queueCallback(callback?: () => void): void {
  if (callback) queueMicrotask(callback);
}

/**
 * Helper: Create error Response (eliminates duplication in error handling)
 */
function createErrorResponse(): Response {
  return new Response('Internal Server Error', { status: 500 });
}

/**
 * Helper: Create address object (eliminates duplication in address() method)
 */
function createAddress(port: number, address: string, family = 'IPv4'): { port: number; family: string; address: string } {
  return { port, family, address };
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

/**
 * Helper: Lazy-load http module classes (eliminates duplication in require('./http'))
 */
function loadHttpClasses(): { IncomingMessage: any; ServerResponse: any } {
  const httpModule = require('./http');
  return {
    IncomingMessage: httpModule.IncomingMessage,
    ServerResponse: httpModule.ServerResponse
  };
}

// Lazy-load native https module for Node.js
let https: any;

/**
 * HTTPS Server options
 */
export interface ServerOptions {
  IncomingMessage?: typeof IncomingMessage;
  ServerResponse?: typeof ServerResponse;
  // TLS/SSL options
  key?: string | Buffer | Array<string | Buffer>;
  cert?: string | Buffer | Array<string | Buffer>;
  ca?: string | Buffer | Array<string | Buffer>;
  passphrase?: string;
  pfx?: string | Buffer | Array<string | Buffer>;
  dhparam?: string | Buffer;
  ecdhCurve?: string;
  honorCipherOrder?: boolean;
  requestCert?: boolean;
  rejectUnauthorized?: boolean;
  NPNProtocols?: string[] | Buffer[] | Uint8Array[] | Buffer | Uint8Array;
  ALPNProtocols?: string[] | Buffer[] | Uint8Array[] | Buffer | Uint8Array;
  SNICallback?: (servername: string, cb: (err: Error | null, ctx?: any) => void) => void;
  sessionTimeout?: number;
  ticketKeys?: Buffer;
  // Bun-specific
  tls?: {
    key?: string | Buffer;
    cert?: string | Buffer;
    ca?: string | Buffer;
    passphrase?: string;
    dhParamsFile?: string;
  };
}

/**
 * HTTPS Server - Optimized for each runtime
 */
export class Server extends EventEmitter {
  private nativeServer?: any;
  private requestListener?: RequestListener;
  public _listening: boolean = false;
  private options: ServerOptions;

  constructor(options: ServerOptions, requestListener?: RequestListener) {
    super();
    this.options = options;
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
      // Node.js - use native https module
      const { IncomingMessage, ServerResponse } = loadHttpClasses();
      if (!https) https = require('https');

      this.nativeServer = https.createServer(this.options, (req: any, res: any) => {
        const incomingMessage = new IncomingMessage(req);
        const serverResponse = new ServerResponse(incomingMessage, res);

        if (self.requestListener) {
          self.requestListener(incomingMessage, serverResponse);
        } else {
          self.emit('request', incomingMessage, serverResponse);
        }
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
      // Bun - use Bun.serve() with TLS
      const { IncomingMessage, ServerResponse } = loadHttpClasses();

      const tlsOptions: any = {
        port,
        hostname,
        fetch: (req: Request) => {
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
        error: (error: Error) => {
          this.emit('error', error);
          return createErrorResponse();
        },
      };

      // Add TLS configuration
      if (this.options.key || this.options.cert) {
        tlsOptions.tls = {
          key: this.options.key,
          cert: this.options.cert,
          ca: this.options.ca,
          passphrase: this.options.passphrase,
        };
      } else if (this.options.tls) {
        tlsOptions.tls = this.options.tls;
      }

      // @ts-ignore
      this.nativeServer = Bun.serve(tlsOptions);

      emitListeningWithCallback(this, callback);
    } else if (isDeno) {
      // Deno - use Deno.serve() with TLS
      const { IncomingMessage, ServerResponse } = loadHttpClasses();

      const serveOptions: any = {
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
      };

      // Add TLS configuration for Deno
      if (this.options.key && this.options.cert) {
        // @ts-ignore
        serveOptions.cert = this.options.cert;
        // @ts-ignore
        serveOptions.key = this.options.key;
      }

      // @ts-ignore
      this.nativeServer = Deno.serve(serveOptions);

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
 * Client request
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
 * HTTPS Agent
 */
export class Agent {
  constructor(public options?: any) {}
}

/**
 * Create HTTPS server
 */
export function createServer(options: ServerOptions, requestListener?: RequestListener): Server {
  return new Server(options, requestListener);
}

/**
 * Make HTTPS request - optimized per runtime
 */
export function request(url: string | URL, options?: RequestOptions, callback?: (res: IncomingMessage) => void): ClientRequest {
  const urlString = typeof url === 'string' ? url : url.toString();
  const req = new ClientRequest(urlString, options);

  if (isNode) {
    const { IncomingMessage } = loadHttpClasses();
    if (!https) https = require('https');

    const nodeReq = https.request(urlString, {
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
    // Bun/Deno - use fetch (automatically handles HTTPS)
    const { IncomingMessage } = loadHttpClasses();

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
 * Make HTTPS GET request
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
  Agent,
  ClientRequest,
  getRuntime,
};
