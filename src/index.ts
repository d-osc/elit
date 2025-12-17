/**
 * Elit - Optimized lightweight library for creating DOM elements with reactive state
 */

// Types
export type {
    VNode,
    Child,
    Children,
    Props,
    RefCallback,
    RefObject,
    State,
    StateOptions,
    VirtualListController,
    JsonNode,
    VNodeJson,
    ElementFactory
} from './types';

// DomNode Core
export { DomNode, domNode } from './DomNode';

// State Management
export {
    createState,
    computed,
    effect,
    batchRender,
    renderChunked,
    createVirtualList,
    lazy,
    cleanupUnused,
    throttle,
    debounce
} from './state';

// Shared State (for use with @elit/server)
export {
    createSharedState,
    sharedStateManager,
    SharedState
} from './shared-state';

// Reactive Helpers
export {
    reactive,
    reactiveAs,
    text,
    bindValue,
    bindChecked
} from './reactive';

// CreateStyle CSS Generation
export {
    CreateStyle,
    type CSSVariable,
    type CSSRule,
    type MediaRule,
    type KeyframeStep,
    type Keyframes,
    type FontFace,
    type ContainerRule,
    type SupportsRule,
    type LayerRule
} from './CreateStyle';

// Router
export {
    createRouter,
    createRouterView,
    routerLink,
    type Route,
    type RouteParams,
    type RouteLocation,
    type RouterOptions,
    type Router
} from './router';

// Element Factories
export {
    createElementFactory,
    elements,
    html, head, body, title, base, link, meta, style,
    address, article, aside, footer, header, h1, h2, h3, h4, h5, h6, main, nav, section,
    blockquote, dd, div, dl, dt, figcaption, figure, hr, li, ol, p, pre, ul,
    a, abbr, b, bdi, bdo, br, cite, code, data, dfn, em, i, kbd, mark, q,
    rp, rt, ruby, s, samp, small, span, strong, sub, sup, time, u, wbr,
    area, audio, img, map, track, video,
    embed, iframe, object, param, picture, portal, source,
    canvas, noscript, script,
    del, ins,
    caption, col, colgroup, table, tbody, td, tfoot, th, thead, tr,
    button, datalist, fieldset, form, input, label, legend, meter,
    optgroup, option, output, progress, select, textarea,
    details, dialog, menu, summary,
    slot, template,
    svgSvg, svgCircle, svgRect, svgPath, svgLine, svgPolyline, svgPolygon, svgEllipse, svgG, svgText, svgTspan,
    svgDefs, svgLinearGradient, svgRadialGradient, svgStop, svgPattern, svgMask, svgClipPath, svgUse, svgSymbol,
    svgMarker, svgImage, svgForeignObject, svgAnimate, svgAnimateTransform, svgAnimateMotion, svgSet, svgFilter,
    svgFeBlend, svgFeColorMatrix, svgFeComponentTransfer, svgFeComposite, svgFeConvolveMatrix, svgFeDiffuseLighting,
    svgFeDisplacementMap, svgFeFlood, svgFeGaussianBlur, svgFeMorphology, svgFeOffset, svgFeSpecularLighting,
    svgFeTile, svgFeTurbulence,
    mathMath, mathMi, mathMn, mathMo, mathMs, mathMtext, mathMrow, mathMfrac, mathMsqrt, mathMroot, mathMsub, mathMsup,
    varElement
} from './elements';

// Helper functions (re-exported from domNode)
import { domNode } from './DomNode';
import type { VNode, Child, JsonNode, VNodeJson } from './types';

export const renderToHead = (...vNodes: Array<VNode | VNode[]>): HTMLHeadElement | null =>
    domNode.renderToHead(...vNodes);

export const addStyle = (css: string): HTMLStyleElement => domNode.addStyle(css);

export const addMeta = (attrs: Record<string, string>): HTMLMetaElement => domNode.addMeta(attrs);

export const addLink = (attrs: Record<string, string>): HTMLLinkElement => domNode.addLink(attrs);

export const setTitle = (text: string): string => domNode.setTitle(text);

export const renderToString = (vNode: Child, options?: { pretty?: boolean; indent?: number }): string =>
    domNode.renderToString(vNode, options);

// JSON rendering helpers
export const jsonToVNode = (json: JsonNode): Child =>
    domNode.jsonToVNode(json);

export const renderJson = (container: string | HTMLElement, json: JsonNode): HTMLElement =>
    domNode.renderJson(container, json);

export const renderJsonToString = (json: JsonNode, options?: { pretty?: boolean; indent?: number }): string =>
    domNode.renderJsonToString(json, options);

// VNode JSON rendering helpers
export const vNodeJsonToVNode = (json: VNodeJson): Child =>
    domNode.vNodeJsonToVNode(json);

export const renderVNode = (container: string | HTMLElement, json: VNodeJson): HTMLElement =>
    domNode.renderVNode(container, json);

export const renderVNodeToString = (json: VNodeJson, options?: { pretty?: boolean; indent?: number }): string =>
    domNode.renderVNodeToString(json, options);

// DOM utilities
export * from './dom';

// Browser export
import { elements, createElementFactory } from './elements';
import { createState, computed, effect, batchRender, renderChunked, createVirtualList, lazy, cleanupUnused, throttle, debounce } from './state';
import { createSharedState, sharedStateManager } from './shared-state';
import { reactive, reactiveAs, text, bindValue, bindChecked } from './reactive';
import { CreateStyle } from './CreateStyle';
import { createRouter, createRouterView, routerLink } from './router';
import * as domUtils from './dom';

if (typeof window !== 'undefined') {
    Object.assign(window, {
        domNode,
        createElementFactory,
        renderToHead,
        addStyle,
        addMeta,
        addLink,
        setTitle,
        createState,
        computed,
        effect,
        createSharedState,
        sharedStateManager,
        reactive,
        reactiveAs,
        text,
        bindValue,
        bindChecked,
        batchRender,
        renderChunked,
        createVirtualList,
        lazy,
        cleanupUnused,
        renderToString,
        jsonToVNode,
        renderJson,
        renderJsonToString,
        vNodeJsonToVNode,
        renderVNode,
        renderVNodeToString,
        throttle,
        debounce,
        CreateStyle,
        createRouter,
        createRouterView,
        routerLink,
        ...elements,
        ...domUtils
    });
}