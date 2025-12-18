export type * from './types';
export * from './dom';
export * from './state';
export * from './style';
export * from './el';

// Client-side Router
export { createRouter, createRouterView, routerLink } from './router';
export type { Router, Route, RouteParams, RouteLocation, RouterOptions } from './router';

// Development Server
export { createDevServer } from './server';

// HMR Client
export { default as hmr } from './hmr';
export type { HMRClient } from './hmr';

// API Router (Server-side)
export { ServerRouter, ServerRouter as ApiRouter, json, text as sendText, html, status } from './server';
export type { ServerRouteContext, ServerRouteHandler, Middleware, HttpMethod } from './server';

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
} from './server';

// Shared State
export { StateManager, SharedState } from './server';
export type { SharedStateOptions, StateChangeHandler } from './server';

// Build
export { build } from './build';
export type { BuildOptions, BuildResult } from './types';

// Config
export { loadConfig, mergeConfig, defineConfig, loadEnv } from './config';
export type { ElitConfig } from './config';