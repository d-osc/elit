/**
 * Elit - State Management
 */

import type { State, StateOptions, VNode, VirtualListController } from './types';
import { domNode } from './DomNode';

// State management helpers
export const createState = <T>(initial: T, options?: StateOptions): State<T> =>
    domNode.createState(initial, options);

export const computed = <T extends any[], R>(
    states: { [K in keyof T]: State<T[K]> },
    fn: (...values: T) => R
): State<R> => domNode.computed(states, fn);

export const effect = (fn: () => void): void => domNode.effect(fn);

// Performance helpers
export const batchRender = (container: string | HTMLElement, vNodes: VNode[]): HTMLElement =>
    domNode.batchRender(container, vNodes);

export const renderChunked = (
    container: string | HTMLElement,
    vNodes: VNode[],
    chunkSize?: number,
    onProgress?: (current: number, total: number) => void
): HTMLElement => domNode.renderChunked(container, vNodes, chunkSize, onProgress);

export const createVirtualList = <T>(
    container: HTMLElement,
    items: T[],
    renderItem: (item: T, index: number) => VNode,
    itemHeight?: number,
    bufferSize?: number
): VirtualListController => domNode.createVirtualList(container, items, renderItem, itemHeight, bufferSize);

export const lazy = <T extends any[], R>(loadFn: () => Promise<(...args: T) => R>) =>
    domNode.lazy(loadFn);

export const cleanupUnused = (root: HTMLElement): number =>
    domNode.cleanupUnusedElements(root);

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
