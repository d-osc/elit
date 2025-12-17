/**
 * @elit/server - Development server with Hot Module Replacement
 */

export { createDevServer } from './server';
export { startDevServer } from './cli';
export type { DevServerOptions, DevServer } from './types';

// HMR Client
export { default as hmr } from './client';
export type { HMRClient } from './client';

// Router and API
export { Router, json, text, html, status } from './router';
export type { RouteContext, RouteHandler, Middleware, HttpMethod } from './router';

// Middleware
export {
  cors,
  logger,
  errorHandler,
  rateLimit,
  bodyLimit,
  cacheControl,
  compress,
  security
} from './middleware';

// Shared State
export { StateManager, SharedState } from './state';
export type { SharedStateOptions, StateChangeHandler } from './state';
