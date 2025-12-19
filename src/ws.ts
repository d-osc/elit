/**
 * WebSocket module with unified API across runtimes
 * Pure implementation without external dependencies
 * - Node.js: uses native 'ws' module (built-in WebSocket implementation)
 * - Bun: uses native WebSocket
 * - Deno: uses native WebSocket
 */

import { EventEmitter } from 'events';
import type { IncomingMessage } from './http';
import { runtime } from './runtime';

/**
 * WebSocket ready state
 */
export enum ReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

/**
 * WebSocket close codes
 */
export const CLOSE_CODES = {
  NORMAL: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  NO_STATUS: 1005,
  ABNORMAL: 1006,
  INVALID_DATA: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  EXTENSION_REQUIRED: 1010,
  INTERNAL_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,
  BAD_GATEWAY: 1014,
  TLS_HANDSHAKE_FAIL: 1015,
} as const;

/**
 * WebSocket data types
 */
export type Data = string | Buffer | ArrayBuffer | Buffer[];

/**
 * WebSocket send options
 */
export interface SendOptions {
  binary?: boolean;
  compress?: boolean;
  fin?: boolean;
  mask?: boolean;
}

/**
 * WebSocket server options
 */
export interface ServerOptions {
  host?: string;
  port?: number;
  backlog?: number;
  server?: any;
  verifyClient?: VerifyClientCallback;
  handleProtocols?: (protocols: Set<string>, request: IncomingMessage) => string | false;
  path?: string;
  noServer?: boolean;
  clientTracking?: boolean;
  perMessageDeflate?: boolean | object;
  maxPayload?: number;
}

/**
 * Verify client callback
 */
export type VerifyClientCallback = (
  info: {
    origin: string;
    secure: boolean;
    req: IncomingMessage;
  },
  callback?: (result: boolean, code?: number, message?: string) => void
) => boolean | void;

/**
 * WebSocket class - Pure implementation
 */
export class WebSocket extends EventEmitter {
  public readyState: ReadyState = ReadyState.CONNECTING;
  public url: string;
  public protocol: string = '';
  public extensions: string = '';
  public binaryType: 'nodebuffer' | 'arraybuffer' | 'fragments' = 'nodebuffer';

  /** @internal */
  public _socket: any;

  constructor(address: string | URL, protocols?: string | string[], _options?: any) {
    super();
    this.url = typeof address === 'string' ? address : address.toString();

    const protocolsArray = Array.isArray(protocols) ? protocols : protocols ? [protocols] : undefined;

    if (runtime === 'node') {
      // Node.js - use native WebSocket (available in Node.js v18+)
      // @ts-ignore - WebSocket is available in Node.js 18+
      if (typeof globalThis.WebSocket !== 'undefined') {
        // @ts-ignore
        this._socket = new globalThis.WebSocket(this.url, protocolsArray);
        this._setupNativeSocket();
      } else {
        throw new Error('WebSocket is not available. Please use Node.js 18+ or install ws package.');
      }
    } else {
      // Bun/Deno - use native WebSocket
      this._socket = new globalThis.WebSocket(this.url, protocolsArray);
      this._setupNativeSocket();
    }
  }

  private _setupNativeSocket(): void {
    this._socket.onopen = () => {
      this.readyState = ReadyState.OPEN;
      this.emit('open');
    };

    this._socket.onmessage = (event: MessageEvent) => {
      const isBinary = event.data instanceof ArrayBuffer || event.data instanceof Blob;
      this.emit('message', event.data, isBinary);
    };

    this._socket.onclose = (event: CloseEvent) => {
      this.readyState = ReadyState.CLOSED;
      this.emit('close', event.code, event.reason);
    };

    this._socket.onerror = () => {
      this.emit('error', new Error('WebSocket error'));
    };
  }

  /**
   * Send data through WebSocket
   */
  send(data: Data, options?: SendOptions | ((err?: Error) => void), callback?: (err?: Error) => void): void {
    let cb: ((err?: Error) => void) | undefined;

    if (typeof options === 'function') {
      cb = options;
    } else {
      cb = callback;
    }

    if (this.readyState !== ReadyState.OPEN) {
      const err = new Error('WebSocket is not open');
      if (cb) {
        queueMicrotask(() => cb(err));
      }
      return;
    }

    try {
      this._socket.send(data);
      if (cb) {
        queueMicrotask(() => cb());
      }
    } catch (error) {
      if (cb) {
        queueMicrotask(() => cb(error as Error));
      }
    }
  }

  /**
   * Close the WebSocket connection
   */
  close(code?: number, reason?: string | Buffer): void {
    if (this.readyState === ReadyState.CLOSED || this.readyState === ReadyState.CLOSING) {
      return;
    }

    this.readyState = ReadyState.CLOSING;
    this._socket.close(code, typeof reason === 'string' ? reason : reason?.toString());
  }

  /**
   * Pause the socket (no-op for native WebSocket)
   */
  pause(): void {
    // Native WebSocket doesn't support pause
  }

  /**
   * Resume the socket (no-op for native WebSocket)
   */
  resume(): void {
    // Native WebSocket doesn't support resume
  }

  /**
   * Send a ping frame (no-op for native WebSocket)
   */
  ping(_data?: Data, _mask?: boolean, callback?: (err?: Error) => void): void {
    // Native WebSocket doesn't expose ping
    if (callback) {
      queueMicrotask(() => callback());
    }
  }

  /**
   * Send a pong frame (no-op for native WebSocket)
   */
  pong(_data?: Data, _mask?: boolean, callback?: (err?: Error) => void): void {
    // Native WebSocket doesn't expose pong
    if (callback) {
      queueMicrotask(() => callback());
    }
  }

  /**
   * Terminate the connection
   */
  terminate(): void {
    this._socket.close();
    this.readyState = ReadyState.CLOSED;
  }

  /**
   * Get buffered amount
   */
  get bufferedAmount(): number {
    return this._socket.bufferedAmount || 0;
  }
}

/**
 * WebSocket Server - Server-side WebSocket implementation
 */
export class WebSocketServer extends EventEmitter {
  public clients: Set<WebSocket> = new Set();
  public options: ServerOptions;
  public path: string;

  private _httpServer: any;

  constructor(options?: ServerOptions, callback?: () => void) {
    super();
    this.options = options || {};
    this.path = options?.path || '/';

    if (runtime === 'node') {
      // Node.js - create HTTP server with WebSocket upgrade
      if (options?.server) {
        this._httpServer = options.server;
        this._setupUpgradeHandler();
      } else if (options?.noServer) {
        // No server mode - user will call handleUpgrade manually
      } else {
        // Create new HTTP server
        const http = require('http');
        this._httpServer = http.createServer();
        this._setupUpgradeHandler();

        if (options?.port) {
          this._httpServer.listen(options.port, options.host, callback);
        }
      }
    } else {
      // Bun/Deno - WebSocket server setup
      if (callback) {
        queueMicrotask(callback);
      }
    }
  }

  private _setupUpgradeHandler(): void {
    this._httpServer.on('upgrade', (request: any, socket: any, head: Buffer) => {
      if (this.path && request.url !== this.path) {
        return;
      }

      this.handleUpgrade(request, socket, head, (client) => {
        this.emit('connection', client, request);
      });
    });
  }

  /**
   * Handle HTTP upgrade for WebSocket
   */
  handleUpgrade(request: IncomingMessage, socket: any, _head: Buffer, callback: (client: WebSocket) => void): void {
    // Simple WebSocket handshake
    const key = request.headers['sec-websocket-key'];
    if (!key) {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      return;
    }

    // Generate accept key
    const crypto = require('crypto');
    const acceptKey = crypto
      .createHash('sha1')
      .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64');

    // Send handshake response
    const headers = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      '',
      ''
    ];

    socket.write(headers.join('\r\n'));

    // Create WebSocket client from raw socket
    const client = this._createClientFromSocket(socket);

    if (this.options.clientTracking !== false) {
      this.clients.add(client);
      client.on('close', () => {
        this.clients.delete(client);
      });
    }

    callback(client);
  }

  private _createClientFromSocket(socket: any): WebSocket {
    const client = Object.create(WebSocket.prototype);
    EventEmitter.call(client);

    client.readyState = ReadyState.OPEN;
    client.url = 'ws://localhost';
    client.protocol = '';
    client.extensions = '';
    client.binaryType = 'nodebuffer';
    client._socket = socket;

    // Handle incoming frames
    socket.on('data', (data: Buffer) => {
      // Simple frame parsing (minimal implementation)
      try {
        const message = this._parseFrame(data);
        if (message) {
          client.emit('message', message, false);
        }
      } catch (error) {
        client.emit('error', error);
      }
    });

    socket.on('end', () => {
      client.readyState = ReadyState.CLOSED;
      client.emit('close', CLOSE_CODES.NORMAL, '');
    });

    socket.on('error', (error: Error) => {
      client.emit('error', error);
    });

    // Override send method
    client.send = (data: Data, _options?: any, callback?: (err?: Error) => void) => {
      try {
        const frame = this._createFrame(data);
        socket.write(frame);
        if (callback) queueMicrotask(() => callback());
      } catch (error) {
        if (callback) queueMicrotask(() => callback(error as Error));
      }
    };

    // Override close method
    client.close = (_code?: number, _reason?: string) => {
      socket.end();
      client.readyState = ReadyState.CLOSED;
    };

    return client;
  }

  private _parseFrame(data: Buffer): string | null {
    // Minimal WebSocket frame parsing
    if (data.length < 2) return null;

    const firstByte = data[0];
    const secondByte = data[1];

    const opcode = firstByte & 0x0f;
    const isMasked = (secondByte & 0x80) === 0x80;
    let payloadLength = secondByte & 0x7f;
    let offset = 2;

    if (payloadLength === 126) {
      payloadLength = data.readUInt16BE(2);
      offset = 4;
    } else if (payloadLength === 127) {
      payloadLength = Number(data.readBigUInt64BE(2));
      offset = 10;
    }

    let payload = data.subarray(offset);

    if (isMasked) {
      const maskKey = data.subarray(offset, offset + 4);
      payload = data.subarray(offset + 4, offset + 4 + payloadLength);

      // Unmask payload
      for (let i = 0; i < payload.length; i++) {
        payload[i] ^= maskKey[i % 4];
      }
    }

    // Text frame (opcode 1)
    if (opcode === 1) {
      return payload.toString('utf8');
    }

    return null;
  }

  private _createFrame(data: Data): Buffer {
    // Create simple text frame (opcode 1, no masking)
    const payload = typeof data === 'string' ? Buffer.from(data) : data;
    const payloadLength = Buffer.isBuffer(payload) ? payload.length : 0;

    let frame: Buffer;
    let offset = 2;

    if (payloadLength < 126) {
      frame = Buffer.allocUnsafe(2 + payloadLength);
      frame[1] = payloadLength;
    } else if (payloadLength < 65536) {
      frame = Buffer.allocUnsafe(4 + payloadLength);
      frame[1] = 126;
      frame.writeUInt16BE(payloadLength, 2);
      offset = 4;
    } else {
      frame = Buffer.allocUnsafe(10 + payloadLength);
      frame[1] = 127;
      frame.writeBigUInt64BE(BigInt(payloadLength), 2);
      offset = 10;
    }

    frame[0] = 0x81; // FIN + text frame

    if (Buffer.isBuffer(payload)) {
      payload.copy(frame, offset);
    }

    return frame;
  }

  /**
   * Close the server
   */
  close(callback?: (err?: Error) => void): void {
    this.clients.forEach(client => client.close());
    this.clients.clear();

    if (this._httpServer) {
      this._httpServer.close(callback);
    } else {
      this.emit('close');
      if (callback) {
        queueMicrotask(() => callback());
      }
    }
  }

  /**
   * Check if server should handle request
   */
  shouldHandle(request: IncomingMessage): boolean {
    if (this.path && request.url !== this.path) {
      return false;
    }
    return true;
  }

  /**
   * Get server address
   */
  address(): { port: number; family: string; address: string } | null {
    if (this._httpServer && this._httpServer.address) {
      return this._httpServer.address();
    }
    return null;
  }
}

/**
 * Create WebSocket server
 */
export function createWebSocketServer(options?: ServerOptions, callback?: () => void): WebSocketServer {
  return new WebSocketServer(options, callback);
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
  WebSocket,
  WebSocketServer,
  createWebSocketServer,
  ReadyState,
  CLOSE_CODES,
  getRuntime,
};
