export type DesktopRuntimeName = 'quickjs' | 'bun' | 'node' | 'deno';

export interface WindowOptions {
    url?: string;
    html?: string;
    title?: string;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    center?: boolean;
    maximized?: boolean;
    resizable?: boolean;
    decorations?: boolean;
    transparent?: boolean;
    always_on_top?: boolean;
    minimizable?: boolean;
    maximizable?: boolean;
    closable?: boolean;
    skip_taskbar?: boolean;
    icon?: string;
    devtools?: boolean;
    proxy_port?: number;
    proxy_pipe?: string;
    proxy_secret?: string;
}

export interface ServeWindowOptions extends Omit<WindowOptions, 'url'> {
    port?: number;
    exposePort?: boolean;
}

export interface ServeWindowResultExposed {
    port: number;
    host: string;
    url: string;
}

export interface ServeWindowResultPipe {
    pipe: string;
}

export type ServeWindowResult = ServeWindowResultExposed | ServeWindowResultPipe;

type DesktopGlobals = typeof globalThis & {
    createWindow?: (opts: WindowOptions) => void;
    createWindowServer?: (app: (req: any, res: any) => void, opts?: ServeWindowOptions) => Promise<ServeWindowResult>;
    windowEval?: (code: string) => void;
    onMessage?: (handler: (msg: string) => void) => void;
    windowMinimize?: () => void;
    windowMaximize?: () => void;
    windowUnmaximize?: () => void;
    windowSetTitle?: (title: string) => void;
    windowDrag?: () => void;
    windowSetPosition?: (x: number, y: number) => void;
    windowSetSize?: (w: number, h: number) => void;
    windowSetAlwaysOnTop?: (value: boolean) => void;
    windowQuit?: () => void;
};

const desktopGlobals = globalThis as DesktopGlobals;

export const createWindow = desktopGlobals.createWindow as (opts: WindowOptions) => void;
export const createWindowServer = desktopGlobals.createWindowServer as (
    app: (req: any, res: any) => void,
    opts?: ServeWindowOptions,
) => Promise<ServeWindowResult>;
export const windowEval = desktopGlobals.windowEval as (code: string) => void;
export const onMessage = desktopGlobals.onMessage as (handler: (msg: string) => void) => void;
export const windowMinimize = desktopGlobals.windowMinimize as () => void;
export const windowMaximize = desktopGlobals.windowMaximize as () => void;
export const windowUnmaximize = desktopGlobals.windowUnmaximize as () => void;
export const windowSetTitle = desktopGlobals.windowSetTitle as (title: string) => void;
export const windowDrag = desktopGlobals.windowDrag as () => void;
export const windowSetPosition = desktopGlobals.windowSetPosition as (x: number, y: number) => void;
export const windowSetSize = desktopGlobals.windowSetSize as (w: number, h: number) => void;
export const windowSetAlwaysOnTop = desktopGlobals.windowSetAlwaysOnTop as (value: boolean) => void;
export const windowQuit = desktopGlobals.windowQuit as () => void;

declare global {
    function createWindow(opts: WindowOptions): void;
    function windowEval(code: string): void;
    function onMessage(handler: (msg: string) => void): void;
    function windowMinimize(): void;
    function windowMaximize(): void;
    function windowUnmaximize(): void;
    function windowSetTitle(title: string): void;
    function windowDrag(): void;
    function windowSetPosition(x: number, y: number): void;
    function windowSetSize(w: number, h: number): void;
    function windowSetAlwaysOnTop(value: boolean): void;
    function windowQuit(): void;
    function createWindowServer(
        app: (req: any, res: any) => void,
        opts?: ServeWindowOptions,
    ): Promise<ServeWindowResult>;
}

export {};