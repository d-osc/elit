/**
 * Elit - State Management
 */

import type { State, StateOptions, VNode, VirtualListController, Child, Props } from './types';
import { dom } from './dom';

// State management helpers
export const createState = <T>(initial: T, options?: StateOptions): State<T> =>
    dom.createState(initial, options);

export const computed = <T extends any[], R>(
    states: { [K in keyof T]: State<T[K]> },
    fn: (...values: T) => R
): State<R> => dom.computed(states, fn);

export const effect = (fn: () => void): void => dom.effect(fn);

// Performance helpers
export const batchRender = (container: string | HTMLElement, vNodes: VNode[]): HTMLElement =>
    dom.batchRender(container, vNodes);

export const renderChunked = (
    container: string | HTMLElement,
    vNodes: VNode[],
    chunkSize?: number,
    onProgress?: (current: number, total: number) => void
): HTMLElement => dom.renderChunked(container, vNodes, chunkSize, onProgress);

export const createVirtualList = <T>(
    container: HTMLElement,
    items: T[],
    renderItem: (item: T, index: number) => VNode,
    itemHeight?: number,
    bufferSize?: number
): VirtualListController => dom.createVirtualList(container, items, renderItem, itemHeight, bufferSize);

export const lazy = <T extends any[], R>(loadFn: () => Promise<(...args: T) => R>) =>
    dom.lazy(loadFn);

export const cleanupUnused = (root: HTMLElement): number =>
    dom.cleanupUnusedElements(root);

// Throttle helper
export const throttle = <T extends any[]>(fn: (...args: T) => void, delay: number) => {
    let timer: NodeJS.Timeout | null = null;
    return (...args: T) => {
        if (!timer) {
            timer = setTimeout(() => {
                timer = null;
                fn(...args);
            }, delay);
        }
    };
};

// Debounce helper
export const debounce = <T extends any[]>(fn: (...args: T) => void, delay: number) => {
    let timer: NodeJS.Timeout | null = null;
    return (...args: T) => {
        timer && clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
};

// ===== Shared State - syncs with elit-server =====

type StateChangeCallback<T = any> = (value: T, oldValue: T) => void;

interface StateMessage {
    type: 'state:init' | 'state:update' | 'state:subscribe' | 'state:unsubscribe' | 'state:change';
    key: string;
    value?: any;
    timestamp?: number;
}

/**
 * Shared State - syncs with elit-server
 */
export class SharedState<T = any> {
    private localState: State<T>;
    private ws: WebSocket | null = null;
    private pendingUpdates: T[] = [];
    private previousValue: T;

    constructor(
        public readonly key: string,
        defaultValue: T,
        private wsUrl?: string
    ) {
        this.localState = createState(defaultValue);
        this.previousValue = defaultValue;
        this.connect();
    }

    /**
     * Get current value
     */
    get value(): T {
        return this.localState.value;
    }

    /**
     * Set new value and sync to server
     */
    set value(newValue: T) {
        this.previousValue = this.localState.value;
        this.localState.value = newValue;
        this.sendToServer(newValue);
    }

    /**
     * Get the underlying Elit State (for reactive binding)
     */
    get state(): State<T> {
        return this.localState;
    }

    /**
     * Subscribe to changes (returns Elit State for reactive)
     */
    onChange(callback: StateChangeCallback<T>): () => void {
        return this.localState.subscribe((newValue) => {
            const oldValue = this.previousValue;
            this.previousValue = newValue;
            callback(newValue, oldValue);
        });
    }

    /**
     * Update value using a function
     */
    update(updater: (current: T) => T): void {
        this.value = updater(this.value);
    }

    /**
     * Connect to WebSocket
     */
    private connect(): void {
        if (typeof window === 'undefined') return;

        const url = this.wsUrl || `ws://${location.host}`;
        this.ws = new WebSocket(url);

        this.ws.addEventListener('open', () => {
            this.subscribe();

            // Send pending updates
            while (this.pendingUpdates.length > 0) {
                const value = this.pendingUpdates.shift();
                this.sendToServer(value!);
            }
        });

        this.ws.addEventListener('message', (event) => {
            this.handleMessage(event.data);
        });

        this.ws.addEventListener('close', () => {
            // Reconnect after delay
            setTimeout(() => this.connect(), 1000);
        });

        this.ws.addEventListener('error', (error) => {
            console.error('[SharedState] WebSocket error:', error);
        });
    }

    /**
     * Subscribe to server state
     */
    private subscribe(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        this.ws.send(JSON.stringify({
            type: 'state:subscribe',
            key: this.key
        }));
    }

    /**
     * Handle message from server
     */
    private handleMessage(data: string): void {
        try {
            const msg = JSON.parse(data) as StateMessage;

            if (msg.key !== this.key) return;

            if (msg.type === 'state:init' || msg.type === 'state:update') {
                // Update local state without sending back to server
                this.localState.value = msg.value;
            }
        } catch (error) {
            // Ignore parse errors (could be HMR messages)
        }
    }

    /**
     * Send value to server
     */
    private sendToServer(value: T): void {
        if (!this.ws) return;

        if (this.ws.readyState !== WebSocket.OPEN) {
            // Queue update for when connection is ready
            this.pendingUpdates.push(value);
            return;
        }

        this.ws.send(JSON.stringify({
            type: 'state:change',
            key: this.key,
            value
        }));
    }

    /**
     * Disconnect
     */
    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    /**
     * Destroy state and cleanup
     */
    destroy(): void {
        this.disconnect();
        this.localState.destroy();
    }
}

/**
 * Create a shared state that syncs with elit-server
 */
export function createSharedState<T>(
    key: string,
    defaultValue: T,
    wsUrl?: string
): SharedState<T> {
    return new SharedState(key, defaultValue, wsUrl);
}

/**
 * Shared State Manager for managing multiple shared states
 */
class SharedStateManager {
    private states = new Map<string, SharedState<any>>();

    /**
     * Create or get a shared state
     */
    create<T>(key: string, defaultValue: T, wsUrl?: string): SharedState<T> {
        if (this.states.has(key)) {
            return this.states.get(key) as SharedState<T>;
        }

        const state = new SharedState<T>(key, defaultValue, wsUrl);
        this.states.set(key, state);
        return state;
    }

    /**
     * Get existing state
     */
    get<T>(key: string): SharedState<T> | undefined {
        return this.states.get(key) as SharedState<T>;
    }

    /**
     * Delete a state
     */
    delete(key: string): boolean {
        const state = this.states.get(key);
        if (state) {
            state.destroy();
            return this.states.delete(key);
        }
        return false;
    }

    /**
     * Clear all states
     */
    clear(): void {
        this.states.forEach(state => state.destroy());
        this.states.clear();
    }
}

// Export singleton instance
export const sharedStateManager = new SharedStateManager();

// ===== Reactive Rendering Helpers =====

// Reactive element helpers
export const reactive = <T>(state: State<T>, renderFn: (value: T) => VNode | Child): VNode => {
    let rafId: number | null = null;
    let elementRef: HTMLElement | SVGElement | null = null;
    let placeholder: Comment | null = null;
    let isInDOM = true;

    const initialResult = renderFn(state.value);
    const isVNodeResult = initialResult && typeof initialResult === 'object' && 'tagName' in initialResult;
    const initialIsNull = initialResult == null || initialResult === false;

    const updateElement = () => {
        if (!elementRef && !placeholder) return;

        const newResult = renderFn(state.value);
        const resultIsNull = newResult == null || newResult === false;

        if (resultIsNull) {
            if (isInDOM && elementRef) {
                placeholder = document.createComment('reactive');
                elementRef.parentNode?.replaceChild(placeholder, elementRef);
                isInDOM = false;
            }
        } else {
            if (!isInDOM && placeholder && elementRef) {
                placeholder.parentNode?.replaceChild(elementRef, placeholder);
                placeholder = null;
                isInDOM = true;
            }

            if (elementRef) {
                const fragment = document.createDocumentFragment();

                if (isVNodeResult && newResult && typeof newResult === 'object' && 'tagName' in newResult) {
                    const { props, children } = newResult as VNode;

                    for (const key in props) {
                        const value = props[key];
                        if (key === 'ref') continue;

                        if (key === 'class' || key === 'className') {
                            (elementRef as HTMLElement).className = Array.isArray(value) ? value.join(' ') : (value || '');
                        } else if (key === 'style' && typeof value === 'object') {
                            const s = (elementRef as HTMLElement).style;
                            for (const k in value) (s as any)[k] = value[k];
                        } else if (key.startsWith('on')) {
                            (elementRef as any)[key.toLowerCase()] = value;
                        } else if (value != null && value !== false) {
                            elementRef.setAttribute(key, String(value === true ? '' : value));
                        } else {
                            elementRef.removeAttribute(key);
                        }
                    }

                    for (const child of children) {
                        dom.renderToDOM(child, fragment);
                    }
                } else {
                    dom.renderToDOM(newResult, fragment);
                }

                elementRef.textContent = '';
                elementRef.appendChild(fragment);
                dom.getElementCache().set(elementRef, true);
            }
        }
    };

    state.subscribe(() => {
        rafId && cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            updateElement();
            rafId = null;
        });
    });

    const refCallback = (el: HTMLElement | SVGElement) => {
        elementRef = el;
        if (initialIsNull && el.parentNode) {
            placeholder = document.createComment('reactive');
            el.parentNode.replaceChild(placeholder, el);
            isInDOM = false;
        }
    };

    if (isVNodeResult) {
        const vnode = initialResult as VNode;
        return {
            tagName: vnode.tagName,
            props: { ...vnode.props, ref: refCallback },
            children: vnode.children
        };
    }

    return { tagName: 'span', props: { ref: refCallback }, children: [initialResult] };
};

// Reactive element with custom wrapper tag
export const reactiveAs = <T>(
    tagName: string,
    state: State<T>,
    renderFn: (value: T) => VNode | Child,
    props: Props = {}
): VNode => {
    let rafId: number | null = null;
    let elementRef: HTMLElement | SVGElement | null = null;

    state.subscribe(() => {
        if (rafId) cancelAnimationFrame(rafId);

        rafId = requestAnimationFrame(() => {
            if (elementRef) {
                const fragment = document.createDocumentFragment();
                const newResult = renderFn(state.value);

                if (newResult == null || newResult === false) {
                    (elementRef as HTMLElement).style.display = 'none';
                    elementRef.textContent = '';
                } else {
                    (elementRef as HTMLElement).style.display = '';
                    dom.renderToDOM(newResult, fragment);
                    elementRef.textContent = '';
                    elementRef.appendChild(fragment);
                }
                dom.getElementCache().set(elementRef, true);
            }
            rafId = null;
        });
    });

    const refCallback = (el: HTMLElement | SVGElement) => {
        elementRef = el;
    };

    return { tagName, props: { ...props, ref: refCallback }, children: [renderFn(state.value)] };
};

export const text = (state: State<any> | any): VNode | string =>
    (state && state.value !== undefined)
        ? reactive(state, v => ({ tagName: 'span', props: {}, children: [String(v)] }))
        : String(state);

export const bindValue = <T extends string | number>(state: State<T>): Props => ({
    value: state.value,
    oninput: (e: Event) => { state.value = (e.target as HTMLInputElement).value as T; }
});

export const bindChecked = (state: State<boolean>): Props => ({
    checked: state.value,
    onchange: (e: Event) => { state.value = (e.target as HTMLInputElement).checked; }
});
