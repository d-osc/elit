import { EventEmitter } from 'node:events';

import { isBun, isDeno, isNode } from '../../shares/runtime';

import {
  closeAndEmit,
  createAddress,
  createErrorResponse,
  emitListeningWithCallback,
  queueCallback,
} from '../http/utils';

import { loadHttpClasses } from './http-classes';
import { https } from './node-modules';
import type { RequestListener, ServerOptions } from './types';

/**
 * HTTPS Server - Optimized for each runtime
 */
export class Server extends EventEmitter {
  private nativeServer?: any;
  private requestListener?: RequestListener;
  public _listening: boolean = false;
  private options: ServerOptions;

  constructor(options: ServerOptions = {}, requestListener?: RequestListener) {
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
      const { IncomingMessage, ServerResponse } = loadHttpClasses();

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
      if (callback) queueCallback(() => callback());
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
    }

    if (isBun) {
      return createAddress(this.nativeServer.port, this.nativeServer.hostname);
    }

    if (isDeno) {
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
 * Create HTTPS server
 */
export function createServer(options: ServerOptions = {}, requestListener?: RequestListener): Server {
  return new Server(options, requestListener);
}