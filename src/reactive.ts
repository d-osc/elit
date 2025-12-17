/**
 * Elit - Reactive Rendering Helpers
 */

import type { VNode, Child, Props, State } from './types';
import { domNode } from './DomNode';

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
                        domNode.renderToDOM(child, fragment);
                    }
                } else {
                    domNode.renderToDOM(newResult, fragment);
                }

                elementRef.textContent = '';
                elementRef.appendChild(fragment);
                domNode.getElementCache().set(elementRef, true);
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
                    domNode.renderToDOM(newResult, fragment);
                    elementRef.textContent = '';
                    elementRef.appendChild(fragment);
                }
                domNode.getElementCache().set(elementRef, true);
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
