/**
 * Elit - Types and Interfaces
 */

export interface VNode {
    tagName: string;
    props: Props;
    children: Children;
}

export type Child = VNode | string | number | boolean | null | undefined | Child[];
export type Children = Child[];

export interface Props {
    [key: string]: any;
    className?: string | string[];
    class?: string | string[];
    style?: Partial<CSSStyleDeclaration> | string;
    dangerouslySetInnerHTML?: { __html: string };
    ref?: RefCallback | RefObject;
    onClick?: (event: MouseEvent) => void;
    onChange?: (event: Event) => void;
    onInput?: (event: Event) => void;
    onSubmit?: (event: Event) => void;
    value?: string | number;
    checked?: boolean;
}

export type RefCallback = (element: HTMLElement | SVGElement) => void;

export interface RefObject {
    current: HTMLElement | SVGElement | null;
}

export interface State<T> {
    value: T;
    subscribe(fn: (value: T) => void): () => void;
    destroy(): void;
}

export interface StateOptions {
    throttle?: number;
    deep?: boolean;
}

export interface VirtualListController {
    render: () => void;
    destroy: () => void;
}

// JSON Node structure for renderJson
export interface JsonNode {
    tag: string;
    attributes?: Record<string, any>;
    children?: JsonNode | JsonNode[] | string | number | boolean | null;
}

// VNode JSON structure for renderVNode (serializable VNode format)
export type VNodeJson = {
    tagName: string;
    props?: Record<string, any>;
    children?: (VNodeJson | string | number | boolean | null)[];
} | string | number | boolean | null;

// Element Factory type
export type ElementFactory = {
    (...children: Child[]): VNode;
    (props: Props | null, ...children: Child[]): VNode;
};

// ===== Development Server Types =====

import type { Server } from 'http';
import type { WebSocketServer } from 'ws';

// Forward declarations to avoid circular dependency
export type Router = import('./server').ServerRouter;
export type StateManager = import('./server').StateManager;

export interface ClientConfig {
    /** Root directory to serve files from */
    root: string;
    /** Base path for the client application (e.g., '/app1', '/app2') */
    basePath: string;
    /** Custom index file path (relative to root, e.g., './public/index.html') */
    index?: string;
    /** SSR render function - returns HTML VNode or string */
    ssr?: () => Child | string;
    /** Watch patterns for file changes */
    watch?: string[];
    /** Ignore patterns for file watching */
    ignore?: string[];
    /** Proxy configuration specific to this client */
    proxy?: ProxyConfig[];
    /** Worker scripts specific to this client */
    worker?: WorkerConfig[];
    /** API router for REST endpoints specific to this client */
    api?: Router;
    /** Server mode: 'dev' uses source files, 'preview' uses built files (default: 'dev') */
    mode?: 'dev' | 'preview';
}

export interface ProxyConfig {
    /** Path prefix to match for proxying (e.g., '/api', '/graphql') */
    context: string;
    /** Target URL to proxy to (e.g., 'http://localhost:8080') */
    target: string;
    /** Change the origin of the host header to the target URL */
    changeOrigin?: boolean;
    /** Rewrite path before sending to target */
    pathRewrite?: Record<string, string>;
    /** Additional headers to add to the proxied request */
    headers?: Record<string, string>;
    /** Enable WebSocket proxying */
    ws?: boolean;
}

export interface WorkerConfig {
    /** Worker script path relative to root directory */
    path: string;
    /** Worker name/identifier (optional, defaults to filename) */
    name?: string;
    /** Worker type: 'module' (ESM) or 'classic' (default: 'module') */
    type?: 'module' | 'classic';
}

export interface DevServerOptions {
    /** Port to run the server on (default: 3000) */
    port?: number;
    /** Host to bind to (default: 'localhost') */
    host?: string;
    /** Domain to map (e.g., 'idevcoder.com') - redirects domain traffic to this server's port */
    domain?: string;
    /** Root directory to serve files from */
    root?: string;
    /** Base path for the client application (e.g., '/app1', '/app2') */
    basePath?: string;
    /** Custom index file path (relative to root, e.g., './public/index.html') */
    index?: string;
    /** Array of client configurations - allows multiple clients on same port */
    clients?: ClientConfig[];
    /** Enable HTTPS (default: false) */
    https?: boolean;
    /** Open browser automatically (default: true) */
    open?: boolean;
    /** Watch patterns for file changes */
    watch?: string[];
    /** Ignore patterns for file watcher */
    ignore?: string[];
    /** Global worker scripts (applies to all clients) */
    worker?: WorkerConfig[];
    /** Enable logging (default: true) */
    logging?: boolean;
    /** API router for REST endpoints */
    api?: Router;
    /** SSR render function - returns HTML VNode or string */
    ssr?: () => Child | string;
    /** Proxy configuration for API requests */
    proxy?: ProxyConfig[];
    /** Server mode: 'dev' uses source files, 'preview' uses built files (default: 'dev') */
    mode?: 'dev' | 'preview';
    /** Environment variables to inject (prefix with VITE_ for client access) */
    env?: Record<string, string>;
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

// ===== Build Types =====

export interface BuildOptions {
    /** Entry file to build */
    entry: string;
    /** Output directory */
    outDir?: string;
    /** Output filename */
    outFile?: string;
    /** Enable minification */
    minify?: boolean;
    /** Generate sourcemap */
    sourcemap?: boolean;
    /** Target environment */
    target?: 'es2015' | 'es2016' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'es2021' | 'es2022' | 'esnext';
    /** Output format */
    format?: 'esm' | 'cjs' | 'iife';
    /** Global name for IIFE format */
    globalName?: string;
    /** Target platform */
    platform?: 'browser' | 'node' | 'neutral';
    /** Base path for the application (injected into HTML) */
    basePath?: string;
    /** External dependencies (not bundled) */
    external?: string[];
    /** Module resolution options */
    resolve?: {
        /** Alias imports to other paths or modules */
        alias?: Record<string, string>;
    };
    /** Enable tree shaking */
    treeshake?: boolean;
    /** Enable logging */
    logging?: boolean;
    /** Environment variables to inject (prefix with VITE_ for client access) */
    env?: Record<string, string>;
    /** Copy static files after build */
    copy?: Array<{ from: string; to: string; transform?: (content: string, config: BuildOptions) => string }>;
    /** Post-build hook */
    onBuildEnd?: (result: BuildResult) => void | Promise<void>;
}

export interface BuildResult {
    /** Output file path */
    outputPath: string;
    /** Build time in milliseconds */
    buildTime: number;
    /** Output file size in bytes */
    size: number;
}

// ===== Preview Types =====

export interface PreviewOptions {
    /** Port to run the preview server on (default: 4173) */
    port?: number;
    /** Host to bind to (default: 'localhost') */
    host?: string;
    /** Domain to map (e.g., 'idevcoder.com') - redirects domain traffic to this server's port */
    domain?: string;
    /** Root directory to serve files from (default: dist or build.outDir) */
    root?: string;
    /** Base path for the application (e.g., '/app') */
    basePath?: string;
    /** Custom index file path (relative to root, e.g., './public/index.html') */
    index?: string;
    /** Array of client configurations - allows multiple clients on same port */
    clients?: ClientConfig[];
    /** Enable HTTPS (default: false) */
    https?: boolean;
    /** Open browser automatically (default: true) */
    open?: boolean;
    /** Enable logging (default: true) */
    logging?: boolean;
    /** API router for REST endpoints */
    api?: Router;
    /** SSR render function - returns HTML VNode or string */
    ssr?: () => Child | string;
    /** Proxy configuration for API requests */
    proxy?: ProxyConfig[];
    /** Global worker scripts (applies to all clients) */
    worker?: WorkerConfig[];
    /** Environment variables to inject (prefix with VITE_ for client access) */
    env?: Record<string, string>;
}

// ===== Test Types =====

export type TestEnvironment = 'node' | 'jsdom' | 'happy-dom' | 'edge-runtime';

export type TestCoverageProvider = 'v8' | 'istanbul';

export type TestCoverageReporter = 'text' | 'json' | 'html' | 'lcov' | 'lcovonly';

export interface TestCoverageOptions {
    provider?: TestCoverageProvider;
    reporter?: TestCoverageReporter[];
    dir?: string;
    include?: string[];
    exclude?: string[];
    thresholds?: {
        lines?: number;
        functions?: number;
        branches?: number;
        statements?: number;
    };
    all?: boolean;
}

export interface TestOptions {
    environment?: TestEnvironment;
    globals?: boolean;
    setupFiles?: string[];
    include?: string[];
    exclude?: string[];
    testTimeout?: number;
    isolate?: boolean;
    pool?: string;
    poolOptions?: {
        threads?: {
            singleThread?: boolean;
            minThreads?: number;
            maxThreads?: number;
            isolate?: boolean;
        };
        forks?: {
            singleFork?: boolean;
            minForks?: number;
            maxForks?: number;
            isolate?: boolean;
        };
    };
    coverage?: TestCoverageOptions;
    watch?: boolean;
    ui?: boolean;
    reporter?: 'verbose' | 'dot' | 'json' | 'tap';
    bail?: number | boolean;
    pattern?: string | RegExp;
    colors?: boolean;
    retry?: number;
    includeSrc?: string[];
    excludeSrc?: string[];
    env?: Record<string, string>;
}
