import type { VNode } from './types';

export type RenderRuntimeTarget = 'web' | 'desktop' | 'mobile' | 'unknown';

export interface DesktopInteractionOutputOptions {
    file?: string;
    stdout?: boolean;
    emitReady?: boolean;
}

export interface DesktopRenderOptions {
    title?: string;
    width?: number;
    height?: number;
    center?: boolean;
    icon?: string;
    autoClose?: boolean;
    interactionOutput?: DesktopInteractionOutputOptions;
}

export interface CapturedRenderState {
    rootElement: string | unknown;
    target: RenderRuntimeTarget;
    vNode: VNode;
}

const RUNTIME_TARGET_KEY = '__ELIT_RUNTIME_TARGET__';
const CAPTURED_RENDER_KEY = '__ELIT_CAPTURED_RENDER__';
const DESKTOP_RENDER_OPTIONS_KEY = '__ELIT_DESKTOP_RENDER_OPTIONS__';
const RUNTIME_TARGET_ENV = 'ELIT_RUNTIME_TARGET';

type GlobalRenderScope = typeof globalThis & {
    [RUNTIME_TARGET_KEY]?: RenderRuntimeTarget;
    [CAPTURED_RENDER_KEY]?: CapturedRenderState;
    [DESKTOP_RENDER_OPTIONS_KEY]?: DesktopRenderOptions;
    createWindow?: unknown;
    document?: Document;
    process?: {
        argv?: string[];
        env?: Record<string, string | undefined>;
    };
    window?: Window & typeof globalThis;
};

function getGlobalRenderScope(): GlobalRenderScope {
    return globalThis as GlobalRenderScope;
}

function isRenderRuntimeTarget(value: unknown): value is RenderRuntimeTarget {
    return value === 'web' || value === 'desktop' || value === 'mobile' || value === 'unknown';
}

export function detectRenderRuntimeTarget(): RenderRuntimeTarget {
    const globalScope = getGlobalRenderScope();
    const explicitTarget = globalScope[RUNTIME_TARGET_KEY] ?? globalScope.process?.env?.[RUNTIME_TARGET_ENV];

    if (isRenderRuntimeTarget(explicitTarget)) {
        return explicitTarget;
    }

    if (typeof globalScope.document !== 'undefined' && typeof globalScope.window !== 'undefined') {
        return 'web';
    }

    if (typeof globalScope.createWindow === 'function') {
        return 'desktop';
    }

    const argv = Array.isArray(globalScope.process?.argv)
        ? globalScope.process!.argv!.join(' ')
        : '';

    if (/\bdesktop\b/i.test(argv)) {
        return 'desktop';
    }

    if (/\b(mobile|native)\b/i.test(argv)) {
        return 'mobile';
    }

    return 'unknown';
}

export function setRenderRuntimeTarget(target: RenderRuntimeTarget): RenderRuntimeTarget | undefined {
    const globalScope = getGlobalRenderScope();
    const previousTarget = globalScope[RUNTIME_TARGET_KEY];
    globalScope[RUNTIME_TARGET_KEY] = target;
    return previousTarget;
}

export function restoreRenderRuntimeTarget(target?: RenderRuntimeTarget): void {
    const globalScope = getGlobalRenderScope();

    if (target === undefined) {
        delete globalScope[RUNTIME_TARGET_KEY];
        return;
    }

    globalScope[RUNTIME_TARGET_KEY] = target;
}

export function captureRenderedVNode(
    rootElement: string | unknown,
    vNode: VNode,
    target = detectRenderRuntimeTarget(),
): void {
    const globalScope = getGlobalRenderScope();
    globalScope[RUNTIME_TARGET_KEY] = target;
    globalScope[CAPTURED_RENDER_KEY] = {
        rootElement,
        target,
        vNode,
    };
}

export function getCapturedRenderedVNode(): CapturedRenderState | undefined {
    return getGlobalRenderScope()[CAPTURED_RENDER_KEY];
}

export function clearCapturedRenderedVNode(): void {
    delete getGlobalRenderScope()[CAPTURED_RENDER_KEY];
}

export function setDesktopRenderOptions(options: DesktopRenderOptions): void {
    const globalScope = getGlobalRenderScope();
    globalScope[DESKTOP_RENDER_OPTIONS_KEY] = {
        ...(globalScope[DESKTOP_RENDER_OPTIONS_KEY] ?? {}),
        ...options,
    };
}

export function getDesktopRenderOptions(): DesktopRenderOptions | undefined {
    return getGlobalRenderScope()[DESKTOP_RENDER_OPTIONS_KEY];
}

export function clearDesktopRenderOptions(): void {
    delete getGlobalRenderScope()[DESKTOP_RENDER_OPTIONS_KEY];
}