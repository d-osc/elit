/**
 * Elit - Types and Interfaces
 */

export interface VNode {
    tagName: string;
    props: Props;
    children: Children;
}

export type Child = VNode | string | number | boolean | null | undefined;
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
export type Router = import('./server').Router;
export type StateManager = import('./server').StateManager;

export interface ClientConfig {
    /** Root directory to serve files from */
    root: string;
    /** Base path for the client application (e.g., '/app1', '/app2') */
    basePath: string;
    /** SSR render function - returns HTML VNode or string */
    ssr?: () => Child | string;
}

export interface DevServerOptions {
    /** Port to run the server on (default: 3000) */
    port?: number;
    /** Host to bind to (default: 'localhost') */
    host?: string;
    /** Root directory to serve files from */
    root?: string;
    /** Base path for the client application (e.g., '/app1', '/app2') */
    basePath?: string;
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
    /** Enable logging (default: true) */
    logging?: boolean;
    /** Custom middleware */
    middleware?: ((req: any, res: any, next: () => void) => void)[];
    /** API router for REST endpoints */
    api?: Router;
    /** SSR render function - returns HTML VNode or string */
    ssr?: () => Child | string;
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
    /** External dependencies (not bundled) */
    external?: string[];
    /** Enable tree shaking */
    treeshake?: boolean;
    /** Enable logging */
    logging?: boolean;
}

export interface BuildResult {
    /** Output file path */
    outputPath: string;
    /** Build time in milliseconds */
    buildTime: number;
    /** Output file size in bytes */
    size: number;
}
