// Client-side only exports (no Node.js dependencies)
export * from './dom';
export * from './state';
export * from './style';
export * from './el';

// Client-side Router
export { createRouter, createRouterView, routerLink } from './router';
export type { Router, Route, RouteParams, RouteLocation, RouterOptions } from './router';

// HMR Client (browser-compatible)
export { default as hmr } from './hmr';
export type { HMRClient } from './hmr';
