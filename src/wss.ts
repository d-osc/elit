/**
 * WebSocket Secure (WSS) module with unified API across runtimes
 * Pure implementation without external dependencies
 * Compatible with 'ws' package WSS API
 * - Node.js: uses native WebSocket with HTTPS
 * - Bun: uses native WebSocket with TLS
 * - Deno: uses native WebSocket with TLS
 */

import { EventEmitter } from 'events';
import type { IncomingMessage } from './http';
import { createServer as createHttpsServer } from './https';
import { WebSocket, WebSocketServer, ServerOptions, Data, ReadyState, CLOSE_CODES } from './ws';

/**
 * Runtime detection (cached at module load)
 */
const runtime = (() => {
  // @ts-ignore - Deno global
  if (typeof Deno !== 'undefined') return 'deno';
  // @ts-ignore - Bun global
  if (typeof Bun !== 'undefined') return 'bun';
  return 'node';
})();

/**
 * WSS Server options (extends WebSocket ServerOptions with TLS)
 */
export interface WSSServerOptions extends ServerOptions {
  // TLS/SSL options
  key?: string | Buffer;
  cert?: string | Buffer;
  ca?: string | Buffer;
  passphrase?: string;
  rejectUnauthorized?: boolean;
  requestCert?: boolean;

  // HTTPS server
  httpsServer?: any;
}

/**
 * WebSocket Secure client class
 */
export class WSSClient extends WebSocket {
  constructor(address: string | URL, protocols?: string | string[], options?: any) {
    // Convert ws:// to wss://
    const urlString = typeof address === 'string' ? address : address.toString();
    const secureUrl = urlString.replace(/^ws:\/\//i, 'wss://');

    super(secureUrl, protocols, options);
  }
}

/**
 * WebSocket Secure Server class
 */
export class WSSServer extends EventEmitter {
  public clients: Set<WebSocket> = new Set();
  public options: WSSServerOptions;
  public path: string;

  private _httpsServer: any;
  private _wsServer!: WebSocketServer;

  constructor(options?: WSSServerOptions, callback?: () => void) {
    super();
    this.options = options || {};
    this.path = options?.path || '/';

    if (runtime === 'node') {
      // Node.js - create HTTPS server with WebSocket upgrade
      if (options?.httpsServer) {
        this._httpsServer = options.httpsServer;
        this._setupServer(callback);
      } else if (options?.noServer) {
        // No server mode - user will call handleUpgrade manually
        this._wsServer = new WebSocketServer({ noServer: true });
        if (callback) queueMicrotask(callback);
      } else {
        // Create new HTTPS server
        const httpsOptions: any = {};
        if (options?.key) httpsOptions.key = options.key;
        if (options?.cert) httpsOptions.cert = options.cert;
        if (options?.ca) httpsOptions.ca = options.ca;
        if (options?.passphrase) httpsOptions.passphrase = options.passphrase;
        if (options?.rejectUnauthorized !== undefined) {
          httpsOptions.rejectUnauthorized = options.rejectUnauthorized;
        }
        if (options?.requestCert !== undefined) {
          httpsOptions.requestCert = options.requestCert;
        }

        this._httpsServer = createHttpsServer(httpsOptions);
        this._setupServer(callback);

        if (options?.port) {
          this._httpsServer.listen(options.port, options.host, () => {
            if (callback) callback();
          });
        }
      }
    } else if (runtime === 'bun') {
      // Bun - WebSocket server with TLS
      this._wsServer = new WebSocketServer(options);
      if (callback) queueMicrotask(callback);
    } else if (runtime === 'deno') {
      // Deno - WebSocket server with TLS
      this._wsServer = new WebSocketServer(options);
      if (callback) queueMicrotask(callback);
    }
  }

  private _setupServer(callback?: () => void): void {
    // Create WebSocket server attached to HTTPS server
    this._wsServer = new WebSocketServer({
      ...this.options,
      server: this._httpsServer,
      noServer: false
    });

    // Forward events from underlying WebSocket server
    this._wsServer.on('connection', (client: WebSocket, request: IncomingMessage) => {
      if (this.options.clientTracking !== false) {
        this.clients.add(client);
        client.on('close', () => {
          this.clients.delete(client);
        });
      }
      this.emit('connection', client, request);
    });

    this._wsServer.on('error', (error: Error) => {
      this.emit('error', error);
    });

    if (callback && !this.options?.port) {
      queueMicrotask(callback);
    }
  }

  /**
   * Handle HTTP upgrade for WebSocket
   */
  handleUpgrade(request: IncomingMessage, socket: any, head: Buffer, callback: (client: WebSocket) => void): void {
    if (this._wsServer) {
      this._wsServer.handleUpgrade(request, socket, head, callback);
    }
  }

  /**
   * Check if server should handle request
   */
  shouldHandle(request: IncomingMessage): boolean {
    if (this._wsServer) {
      return this._wsServer.shouldHandle(request);
    }
    if (this.path && request.url !== this.path) {
      return false;
    }
    return true;
  }

  /**
   * Close the server
   */
  close(callback?: (err?: Error) => void): void {
    this.clients.forEach(client => client.close());
    this.clients.clear();

    if (this._wsServer) {
      this._wsServer.close(() => {
        if (this._httpsServer) {
          this._httpsServer.close(callback);
        } else {
          this.emit('close');
          if (callback) queueMicrotask(() => callback());
        }
      });
    } else if (this._httpsServer) {
      this._httpsServer.close(callback);
    } else {
      this.emit('close');
      if (callback) queueMicrotask(() => callback());
    }
  }

  /**
   * Get server address
   */
  address(): { port: number; family: string; address: string } | null {
    if (this._httpsServer && this._httpsServer.address) {
      return this._httpsServer.address();
    }
    if (this._wsServer) {
      return this._wsServer.address();
    }
    return null;
  }
}

/**
 * Create WebSocket Secure client
 */
export function createWSSClient(address: string | URL, protocols?: string | string[], options?: any): WSSClient {
  return new WSSClient(address, protocols, options);
}

/**
 * Create WebSocket Secure server
 */
export function createWSSServer(options?: WSSServerOptions, callback?: () => void): WSSServer {
  return new WSSServer(options, callback);
}

/**
 * Get current runtime
 */
export function getRuntime(): 'node' | 'bun' | 'deno' {
  return runtime;
}

/**
 * Re-export types and constants from ws module
 */
export type { ServerOptions, Data };
export { ReadyState, CLOSE_CODES };

/**
 * Default export
 */
export default {
  WSSClient,
  WSSServer,
  createWSSClient,
  createWSSServer,
  ReadyState,
  CLOSE_CODES,
  getRuntime,
};
