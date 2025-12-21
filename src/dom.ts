/**
 * Elit - DomNode Core Class
 */

import type { VNode, Child, Children, Props, State, StateOptions, VirtualListController, JsonNode, VNodeJson } from './types';

/**
 * Helper: Resolve element from string ID or HTMLElement (eliminates duplication in render methods)
 */
function resolveElement(rootElement: string | HTMLElement): HTMLElement | null {
    return typeof rootElement === 'string'
        ? document.getElementById(rootElement.replace('#', ''))
        : rootElement;
}

/**
 * Helper: Ensure element exists or throw error (eliminates duplication in validation)
 */
function ensureElement(el: HTMLElement | null, rootElement: string | HTMLElement): HTMLElement {
    if (!el) {
        throw new Error(`Element not found: ${rootElement}`);
    }
    return el;
}

/**
 * Helper: Check if child should be skipped (eliminates duplication in child rendering)
 */
function shouldSkipChild(child: any): boolean {
    return child == null || child === false;
}

/**
 * Helper: Check if value is primitive JSON type (eliminates duplication in JSON conversion)
 */
function isPrimitiveJson(json: any): json is string | number | boolean | null | undefined {
    return json == null || typeof json === 'boolean' || typeof json === 'string' || typeof json === 'number';
}

export class DomNode {
    private elementCache = new WeakMap<Element, boolean>();

    createElement(tagName: string, props: Props = {}, children: Children = []): VNode {
        return { tagName, props, children };
    }

    renderToDOM(vNode: Child, parent: HTMLElement | SVGElement | DocumentFragment): void {
        if (vNode == null || vNode === false) return;

        if (typeof vNode !== 'object') {
            parent.appendChild(document.createTextNode(String(vNode)));
            return;
        }

        const { tagName, props, children } = vNode;
        const isSVG = tagName === 'svg' || (tagName[0] === 's' && tagName[1] === 'v' && tagName[2] === 'g') ||
            (parent as any).namespaceURI === 'http://www.w3.org/2000/svg';

        const el = isSVG
            ? document.createElementNS('http://www.w3.org/2000/svg', tagName.replace('svg', '').toLowerCase() || tagName)
            : document.createElement(tagName);

        for (const key in props) {
            const value = props[key];
            if (value == null || value === false) continue;

            const c = key.charCodeAt(0);
            // class or className (c=99)
            if (c === 99 && (key.length < 6 || key[5] === 'N')) {
                const classValue = Array.isArray(value) ? value.join(' ') : value;
                isSVG ? (el as SVGElement).setAttribute('class', classValue) : (el as HTMLElement).className = classValue;
            }
            // style (s=115)
            else if (c === 115 && key.length === 5) {
                if (typeof value === 'string') {
                    (el as HTMLElement).style.cssText = value;
                } else {
                    const s = (el as HTMLElement).style;
                    for (const k in value) (s as any)[k] = value[k];
                }
            }
            // on* events (o=111, n=110)
            else if (c === 111 && key.charCodeAt(1) === 110) {
                (el as any)[key.toLowerCase()] = value;
            }
            // dangerouslySetInnerHTML (d=100)
            else if (c === 100 && key.length > 20) {
                (el as HTMLElement).innerHTML = value.__html;
            }
            // ref (r=114)
            else if (c === 114 && key.length === 3) {
                setTimeout(() => {
                    typeof value === 'function' ? value(el as HTMLElement) : (value.current = el as HTMLElement);
                }, 0);
            }
            else {
                el.setAttribute(key, value === true ? '' : String(value));
            }
        }

        const len = children.length;
        if (!len) {
            parent.appendChild(el);
            return;
        }

        const renderChildren = (target: HTMLElement | SVGElement | DocumentFragment) => {
            for (let i = 0; i < len; i++) {
                const child = children[i];
                if (shouldSkipChild(child)) continue;

                if (Array.isArray(child)) {
                    for (let j = 0, cLen = child.length; j < cLen; j++) {
                        const c = child[j];
                        !shouldSkipChild(c) && this.renderToDOM(c, target);
                    }
                } else {
                    this.renderToDOM(child, target);
                }
            }
        };

        if (len > 30) {
            const fragment = document.createDocumentFragment();
            renderChildren(fragment);
            el.appendChild(fragment);
        } else {
            renderChildren(el);
        }

        parent.appendChild(el);
    }

    render(rootElement: string | HTMLElement, vNode: VNode): HTMLElement {
        const el = ensureElement(resolveElement(rootElement), rootElement);

        // Clear existing content before rendering
        el.innerHTML = '';

        if (vNode.children && vNode.children.length > 500) {
            const fragment = document.createDocumentFragment();
            this.renderToDOM(vNode, fragment);
            el.appendChild(fragment);
        } else {
            this.renderToDOM(vNode, el);
        }
        return el;
    }

    batchRender(rootElement: string | HTMLElement, vNodes: VNode[]): HTMLElement {
        const el = ensureElement(resolveElement(rootElement), rootElement);

        const len = vNodes.length;

        if (len > 3000) {
            const fragment = document.createDocumentFragment();
            let processed = 0;
            const chunkSize = 1500;

            const processChunk = (): void => {
                const end = Math.min(processed + chunkSize, len);
                for (let i = processed; i < end; i++) {
                    this.renderToDOM(vNodes[i], fragment);
                }
                processed = end;

                if (processed >= len) {
                    el.appendChild(fragment);
                } else {
                    requestAnimationFrame(processChunk);
                }
            };

            processChunk();
        } else {
            const fragment = document.createDocumentFragment();
            for (let i = 0; i < len; i++) {
                this.renderToDOM(vNodes[i], fragment);
            }
            el.appendChild(fragment);
        }
        return el;
    }

    renderChunked(
        rootElement: string | HTMLElement,
        vNodes: VNode[],
        chunkSize = 5000,
        onProgress?: (current: number, total: number) => void
    ): HTMLElement {
        const el = ensureElement(resolveElement(rootElement), rootElement);

        const len = vNodes.length;
        let index = 0;

        const renderChunk = (): void => {
            const end = Math.min(index + chunkSize, len);
            const fragment = document.createDocumentFragment();

            for (let i = index; i < end; i++) {
                this.renderToDOM(vNodes[i], fragment);
            }

            el.appendChild(fragment);
            index = end;

            if (onProgress) onProgress(index, len);

            if (index < len) {
                requestAnimationFrame(renderChunk);
            }
        };

        requestAnimationFrame(renderChunk);
        return el;
    }

    renderToHead(...vNodes: Array<VNode | VNode[]>): HTMLHeadElement | null {
        const head = document.head;
        if (head) {
            for (const vNode of vNodes.flat()) {
                vNode && this.renderToDOM(vNode, head);
            }
        }
        return head;
    }

    addStyle(cssText: string): HTMLStyleElement {
        const el = document.createElement('style');
        el.textContent = cssText;
        return document.head.appendChild(el);
    }

    addMeta(attrs: Record<string, string>): HTMLMetaElement {
        const el = document.createElement('meta');
        for (const k in attrs) el.setAttribute(k, attrs[k]);
        return document.head.appendChild(el);
    }

    addLink(attrs: Record<string, string>): HTMLLinkElement {
        const el = document.createElement('link');
        for (const k in attrs) el.setAttribute(k, attrs[k]);
        return document.head.appendChild(el);
    }

    setTitle(text: string): string {
        return document.title = text;
    }

    // Reactive State Management
    createState<T>(initialValue: T, options: StateOptions = {}): State<T> {
        let value = initialValue;
        const listeners = new Set<(value: T) => void>();
        let updateTimer: NodeJS.Timeout | null = null;
        const { throttle = 0, deep = false } = options;

        const notify = () => listeners.forEach(fn => fn(value));

        const scheduleUpdate = () => {
            if (throttle > 0) {
                if (!updateTimer) {
                    updateTimer = setTimeout(() => {
                        updateTimer = null;
                        notify();
                    }, throttle);
                }
            } else {
                notify();
            }
        };

        return {
            get value() { return value; },
            set value(newValue: T) {
                const changed = deep ? JSON.stringify(value) !== JSON.stringify(newValue) : value !== newValue;
                if (changed) {
                    value = newValue;
                    scheduleUpdate();
                }
            },
            subscribe(fn: (value: T) => void) {
                listeners.add(fn);
                return () => listeners.delete(fn);
            },
            destroy() {
                listeners.clear();
                updateTimer && clearTimeout(updateTimer);
            }
        };
    }

    computed<T extends any[], R>(states: { [K in keyof T]: State<T[K]> }, computeFn: (...values: T) => R): State<R> {
        const values = states.map(s => s.value) as unknown as T;
        const result = this.createState(computeFn(...values));

        states.forEach((state, index) => {
            state.subscribe((newValue: any) => {
                values[index] = newValue;
                result.value = computeFn(...values);
            });
        });

        return result;
    }

    effect(stateFn: () => void): void {
        stateFn();
    }

    // Virtual scrolling helper for large lists
    createVirtualList<T>(
        container: HTMLElement,
        items: T[],
        renderItem: (item: T, index: number) => VNode,
        itemHeight = 50,
        bufferSize = 5
    ): VirtualListController {
        const viewportHeight = container.clientHeight;
        const totalHeight = items.length * itemHeight;
        let scrollTop = 0;

        const getVisibleRange = (): { start: number; end: number } => {
            const start = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
            const end = Math.min(items.length, Math.ceil((scrollTop + viewportHeight) / itemHeight) + bufferSize);
            return { start, end };
        };

        const render = (): void => {
            const { start, end } = getVisibleRange();
            const wrapper = document.createElement('div');
            wrapper.style.cssText = `height:${totalHeight}px;position:relative`;

            for (let i = start; i < end; i++) {
                const itemEl = document.createElement('div');
                itemEl.style.cssText = `position:absolute;top:${i * itemHeight}px;height:${itemHeight}px;width:100%`;
                this.renderToDOM(renderItem(items[i], i), itemEl);
                wrapper.appendChild(itemEl);
            }

            container.innerHTML = '';
            container.appendChild(wrapper);
        };

        const scrollHandler = (): void => {
            scrollTop = container.scrollTop;
            requestAnimationFrame(render);
        };

        container.addEventListener('scroll', scrollHandler);

        render();
        return {
            render,
            destroy: () => {
                container.removeEventListener('scroll', scrollHandler);
                container.innerHTML = '';
            }
        };
    }

    // Lazy load components
    lazy<T extends any[], R>(loadFn: () => Promise<(...args: T) => R>): (...args: T) => Promise<R | VNode> {
        let component: ((...args: T) => R) | null = null;
        let loading = false;

        return async (...args: T): Promise<R | VNode> => {
            if (!component && !loading) {
                loading = true;
                component = await loadFn();
                loading = false;
            }
            return component ? component(...args) : { tagName: 'div', props: { class: 'loading' }, children: ['Loading...'] };
        };
    }

    // Memory management - cleanup unused elements
    cleanupUnusedElements(root: HTMLElement): number {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
        const toRemove: Element[] = [];

        while (walker.nextNode()) {
            const node = walker.currentNode as Element;
            if (node.id && node.id.startsWith('r') && !this.elementCache.has(node)) {
                toRemove.push(node);
            }
        }

        toRemove.forEach(el => el.remove());
        return toRemove.length;
    }

    // Server-Side Rendering - convert VNode to HTML string
    renderToString(vNode: Child, options: { pretty?: boolean; indent?: number } = {}): string {
        const { pretty = false, indent = 0 } = options;
        const indentStr = pretty ? '  '.repeat(indent) : '';
        const newLine = pretty ? '\n' : '';

        let resolvedVNode = this.resolveStateValue(vNode);
        resolvedVNode = this.unwrapReactive(resolvedVNode);

        if (Array.isArray(resolvedVNode)) {
            return resolvedVNode.map(child => this.renderToString(child, options)).join('');
        }

        if (typeof resolvedVNode !== 'object' || resolvedVNode === null) {
            if (resolvedVNode === null || resolvedVNode === undefined || resolvedVNode === false) {
                return '';
            }
            return this.escapeHtml(String(resolvedVNode));
        }

        const { tagName, props, children } = resolvedVNode;
        const isSelfClosing = this.isSelfClosingTag(tagName);

        let html = `${indentStr}<${tagName}`;

        const attrs = this.propsToAttributes(props);
        if (attrs) {
            html += ` ${attrs}`;
        }

        if (isSelfClosing) {
            html += ` />${newLine}`;
            return html;
        }

        html += '>';

        if (props.dangerouslySetInnerHTML) {
            html += props.dangerouslySetInnerHTML.__html;
            html += `</${tagName}>${newLine}`;
            return html;
        }

        if (children && children.length > 0) {
            const resolvedChildren = children.map((c: Child) => {
                const resolved = this.resolveStateValue(c);
                return this.unwrapReactive(resolved);
            });

            const hasComplexChildren = resolvedChildren.some(
                (c: any) => typeof c === 'object' && c !== null && !Array.isArray(c) && 'tagName' in c
            );

            if (pretty && hasComplexChildren) {
                html += newLine;
                for (const child of resolvedChildren) {
                    if (shouldSkipChild(child)) continue;

                    if (Array.isArray(child)) {
                        for (const c of child) {
                            if (!shouldSkipChild(c)) {
                                html += this.renderToString(c, { pretty, indent: indent + 1 });
                            }
                        }
                    } else {
                        html += this.renderToString(child, { pretty, indent: indent + 1 });
                    }
                }
                html += indentStr;
            } else {
                for (const child of resolvedChildren) {
                    if (shouldSkipChild(child)) continue;

                    if (Array.isArray(child)) {
                        for (const c of child) {
                            if (!shouldSkipChild(c)) {
                                html += this.renderToString(c, { pretty: false, indent: 0 });
                            }
                        }
                    } else {
                        html += this.renderToString(child, { pretty: false, indent: 0 });
                    }
                }
            }
        }

        html += `</${tagName}>${newLine}`;
        return html;
    }

    private resolveStateValue(value: any): any {
        if (value && typeof value === 'object' && 'value' in value && 'subscribe' in value) {
            return value.value;
        }
        return value;
    }

    private isReactiveWrapper(vNode: any): boolean {
        if (!vNode || typeof vNode !== 'object' || !vNode.tagName) {
            return false;
        }
        return vNode.tagName === 'span' &&
            vNode.props?.id &&
            typeof vNode.props.id === 'string' &&
            vNode.props.id.match(/^r[a-z0-9]{9}$/);
    }

    private unwrapReactive(vNode: any): Child {
        if (!this.isReactiveWrapper(vNode)) {
            return vNode;
        }

        const children = vNode.children;
        if (!children || children.length === 0) {
            return '';
        }

        if (children.length === 1) {
            const child = children[0];

            if (child && typeof child === 'object' && child.tagName === 'span') {
                const props = child.props;
                const hasNoProps = !props || Object.keys(props).length === 0;
                const hasSingleStringChild = child.children &&
                    child.children.length === 1 &&
                    typeof child.children[0] === 'string';

                if (hasNoProps && hasSingleStringChild) {
                    return child.children[0];
                }
            }

            return this.unwrapReactive(child);
        }

        return children.map((c: Child) => this.unwrapReactive(c));
    }

    private escapeHtml(text: string): string {
        const htmlEscapes: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;'
        };
        return text.replace(/[&<>"']/g, char => htmlEscapes[char]);
    }

    private isSelfClosingTag(tagName: string): boolean {
        const selfClosingTags = new Set([
            'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
            'link', 'meta', 'param', 'source', 'track', 'wbr'
        ]);
        return selfClosingTags.has(tagName.toLowerCase());
    }

    private propsToAttributes(props: Props): string {
        const attrs: string[] = [];

        for (const key in props) {
            if (key === 'children' || key === 'dangerouslySetInnerHTML' || key === 'ref') {
                continue;
            }

            let value = props[key];
            value = this.resolveStateValue(value);

            if (value == null || value === false) continue;

            if (key.startsWith('on') && typeof value === 'function') {
                continue;
            }

            if (key === 'className' || key === 'class') {
                const className = Array.isArray(value) ? value.join(' ') : value;
                if (className) {
                    attrs.push(`class="${this.escapeHtml(String(className))}"`);
                }
                continue;
            }

            if (key === 'style') {
                const styleStr = this.styleToString(value);
                if (styleStr) {
                    attrs.push(`style="${this.escapeHtml(styleStr)}"`);
                }
                continue;
            }

            if (value === true) {
                attrs.push(key);
                continue;
            }

            attrs.push(`${key}="${this.escapeHtml(String(value))}"`);
        }

        return attrs.join(' ');
    }

    private styleToString(style: any): string {
        if (typeof style === 'string') {
            return style;
        }

        if (typeof style === 'object' && style !== null) {
            const styles: string[] = [];
            for (const key in style) {
                const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                styles.push(`${cssKey}:${style[key]}`);
            }
            return styles.join(';');
        }

        return '';
    }

    private isState(value: any): value is State<any> {
        return value && typeof value === 'object' && 'value' in value && 'subscribe' in value && typeof value.subscribe === 'function';
    }

    private reactiveNodes = new Map<State<any>, { node: Text | null, renderFn: (v: any) => Child }>();

    private createReactiveChild(state: State<any>, renderFn: (value: any) => Child): Child {
        const currentValue = renderFn(state.value);

        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            const entry = { node: null as Text | null, renderFn };
            this.reactiveNodes.set(state, entry);

            state.subscribe(() => {
                if (entry.node && entry.node.parentNode) {
                    const newValue = renderFn(state.value);
                    entry.node.textContent = String(newValue ?? '');
                }
            });
        }

        return currentValue;
    }

    jsonToVNode(json: JsonNode | string | number | boolean | null | undefined | State<any>): Child {
        if (this.isState(json)) {
            return this.createReactiveChild(json, (v: any) => v);
        }

        if (isPrimitiveJson(json)) {
            return json as Child;
        }

        const { tag, attributes = {}, children } = json;

        const props: Props = {};
        for (const key in attributes) {
            const value = attributes[key];
            if (key === 'class') {
                props.className = this.isState(value) ? value.value : value;
            } else {
                props[key] = this.isState(value) ? value.value : value;
            }
        }

        const childrenArray: Children = [];
        if (children != null) {
            if (Array.isArray(children)) {
                for (const child of children) {
                    if (this.isState(child)) {
                        childrenArray.push(this.createReactiveChild(child, (v: any) => v));
                    } else {
                        const converted = this.jsonToVNode(child);
                        if (converted != null && converted !== false) {
                            childrenArray.push(converted);
                        }
                    }
                }
            } else if (this.isState(children)) {
                childrenArray.push(this.createReactiveChild(children, (v: any) => v));
            } else if (typeof children === 'object' && 'tag' in children) {
                const converted = this.jsonToVNode(children);
                if (converted != null && converted !== false) {
                    childrenArray.push(converted);
                }
            } else {
                childrenArray.push(children as Child);
            }
        }

        return { tagName: tag, props, children: childrenArray };
    }

    vNodeJsonToVNode(json: VNodeJson | State<any>): Child {
        if (this.isState(json)) {
            return this.createReactiveChild(json, (v: any) => v);
        }

        if (isPrimitiveJson(json)) {
            return json as Child;
        }

        const { tagName, props = {}, children = [] } = json;

        const resolvedProps: Props = {};
        for (const key in props) {
            const value = props[key];
            resolvedProps[key] = this.isState(value) ? value.value : value;
        }

        const childrenArray: Children = [];
        for (const child of children) {
            if (this.isState(child)) {
                childrenArray.push(this.createReactiveChild(child, (v: any) => v));
            } else {
                const converted = this.vNodeJsonToVNode(child);
                if (converted != null && converted !== false) {
                    childrenArray.push(converted);
                }
            }
        }

        return { tagName, props: resolvedProps, children: childrenArray };
    }

    renderJson(rootElement: string | HTMLElement, json: JsonNode): HTMLElement {
        const vNode = this.jsonToVNode(json);
        if (!vNode || typeof vNode !== 'object' || !('tagName' in vNode)) {
            throw new Error('Invalid JSON structure');
        }
        return this.render(rootElement, vNode as VNode);
    }

    renderVNode(rootElement: string | HTMLElement, json: VNodeJson): HTMLElement {
        const vNode = this.vNodeJsonToVNode(json);
        if (!vNode || typeof vNode !== 'object' || !('tagName' in vNode)) {
            throw new Error('Invalid VNode JSON structure');
        }
        return this.render(rootElement, vNode as VNode);
    }

    renderJsonToString(json: JsonNode, options: { pretty?: boolean; indent?: number } = {}): string {
        const vNode = this.jsonToVNode(json);
        return this.renderToString(vNode, options);
    }

    renderVNodeToString(json: VNodeJson, options: { pretty?: boolean; indent?: number } = {}): string {
        const vNode = this.vNodeJsonToVNode(json);
        return this.renderToString(vNode, options);
    }


    // Generate complete HTML document as string (for SSR)
    renderToHTMLDocument(vNode: Child, options: {
        title?: string;
        meta?: Array<Record<string, string>>;
        links?: Array<Record<string, string>>;
        scripts?: Array<{ src?: string; content?: string; async?: boolean; defer?: boolean; type?: string }>;
        styles?: Array<{ href?: string; content?: string }>;
        lang?: string;
        head?: string;
        bodyAttrs?: Record<string, string>;
        pretty?: boolean;
    } = {}): string {
        const { title = '', meta = [], links = [], scripts = [], styles = [], lang = 'en', head = '', bodyAttrs = {}, pretty = false } = options;
        const nl = pretty ? '\n' : '';
        const indent = pretty ? '  ' : '';
        const indent2 = pretty ? '    ' : '';

        let html = `<!DOCTYPE html>${nl}<html lang="${lang}">${nl}${indent}<head>${nl}${indent2}<meta charset="UTF-8">${nl}${indent2}<meta name="viewport" content="width=device-width, initial-scale=1.0">${nl}`;
        if (title) html += `${indent2}<title>${this.escapeHtml(title)}</title>${nl}`;

        for (const m of meta) {
            html += `${indent2}<meta`;
            for (const k in m) html += ` ${k}="${this.escapeHtml(m[k])}"`;
            html += `>${nl}`;
        }

        for (const l of links) {
            html += `${indent2}<link`;
            for (const k in l) html += ` ${k}="${this.escapeHtml(l[k])}"`;
            html += `>${nl}`;
        }

        for (const s of styles) {
            if (s.href) {
                html += `${indent2}<link rel="stylesheet" href="${this.escapeHtml(s.href)}">${nl}`;
            } else if (s.content) {
                html += `${indent2}<style>${s.content}</style>${nl}`;
            }
        }

        if (head) html += head + nl;
        html += `${indent}</head>${nl}${indent}<body`;
        for (const k in bodyAttrs) html += ` ${k}="${this.escapeHtml(bodyAttrs[k])}"`;
        html += `>${nl}`;
        html += this.renderToString(vNode, { pretty, indent: 2 });

        for (const script of scripts) {
            html += `${indent2}<script`;
            if (script.type) html += ` type="${this.escapeHtml(script.type)}"`;
            if (script.async) html += ` async`;
            if (script.defer) html += ` defer`;
            if (script.src) {
                html += ` src="${this.escapeHtml(script.src)}"></script>${nl}`;
            } else if (script.content) {
                html += `>${script.content}</script>${nl}`;
            } else {
                html += `></script>${nl}`;
            }
        }

        html += `${indent}</body>${nl}</html>`;
        return html;
    }

    // Expose elementCache for reactive updates
    getElementCache(): WeakMap<Element, boolean> {
        return this.elementCache;
    }
}

export const dom = new DomNode();

// Export helper functions for convenience
export const render = dom.render.bind(dom);
export const renderToString = dom.renderToString.bind(dom);
export const mount = render; // alias for render
