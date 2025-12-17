/**
 * Type definitions for Elit dev server
 */

import type { Server } from 'http';
import type { WebSocketServer } from 'ws';
import { Router } from './router';
import type { StateManager } from './state';

export interface DevServerOptions {
  /** Port to run the server on (default: 3000) */
  port?: number;
  /** Host to bind to (default: 'localhost') */
  host?: string;
  /** Root directory to serve files from (default: process.cwd()) */
  root?: string;
  /** Enable HTTPS (default: false) */
  https?: boolean;
  /** Open browser automatically (default: true) */
  open?: boolean;
  /** Watch patterns for file changes */
  watch?: string[];
  /** Ignore patterns for file watcher */
  ignore?: string[];
  /** Enable logging (default: true) */
  logging?: boolean;
  /** Custom middleware */
  middleware?: ((req: any, res: any, next: () => void) => void)[];
  /** API router for REST endpoints */
  api?: Router;
}

export interface DevServer {
  /** HTTP server instance */
  server: Server;
  /** WebSocket server for HMR */
  wss: WebSocketServer;
  /** Server URL */
  url: string;
  /** Shared state manager */
  state: StateManager;
  /** Close the server */
  close: () => Promise<void>;
}

export interface HMRMessage {
  type: 'update' | 'reload' | 'error' | 'connected';
  path?: string;
  timestamp?: number;
  error?: string;
}
