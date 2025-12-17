/**
 * Elit - Element Factories
 */

import type { VNode, Child, Props, ElementFactory } from './types';

export const createElementFactory = (tag: string): ElementFactory => {
    return function(props?: Props | Child | null, ...rest: Child[]): VNode {
        if (!arguments.length) return { tagName: tag, props: {}, children: [] };

        const isState = props && typeof props === 'object' && 'value' in props && 'subscribe' in props;
        const isVNode = props && typeof props === 'object' && 'tagName' in props;
        const isChild = typeof props !== 'object' || Array.isArray(props) || props === null || isState || isVNode;

        const actualProps: Props = isChild ? {} : props as Props;
        const args: Child[] = isChild ? [props as Child, ...rest] : rest;

        if (!args.length) return { tagName: tag, props: actualProps, children: [] };

        const flatChildren: Child[] = [];
        for (let i = 0, len = args.length; i < len; i++) {
            const child = args[i];
            if (child == null || child === false) continue;

            if (Array.isArray(child)) {
                for (let j = 0, cLen = child.length; j < cLen; j++) {
                    const c = child[j];
                    c != null && c !== false && flatChildren.push(c);
                }
            } else {
                flatChildren.push(child);
            }
        }

        return { tagName: tag, props: actualProps, children: flatChildren };
    } as ElementFactory;
};

// HTML Tags
const tags = [
    'html', 'head', 'body', 'title', 'base', 'link', 'meta', 'style',
    'address', 'article', 'aside', 'footer', 'header', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'main', 'nav', 'section',
    'blockquote', 'dd', 'div', 'dl', 'dt', 'figcaption', 'figure', 'hr', 'li', 'ol', 'p', 'pre', 'ul',
    'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data', 'dfn', 'em', 'i', 'kbd', 'mark', 'q',
    'rp', 'rt', 'ruby', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'wbr',
    'area', 'audio', 'img', 'map', 'track', 'video',
    'embed', 'iframe', 'object', 'param', 'picture', 'portal', 'source',
    'canvas', 'noscript', 'script',
    'del', 'ins',
    'caption', 'col', 'colgroup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr',
    'button', 'datalist', 'fieldset', 'form', 'input', 'label', 'legend', 'meter',
    'optgroup', 'option', 'output', 'progress', 'select', 'textarea',
    'details', 'dialog', 'menu', 'summary',
    'slot', 'template'
] as const;

// SVG Tags
const svgTags = [
    'svg', 'circle', 'rect', 'path', 'line', 'polyline', 'polygon', 'ellipse', 'g', 'text', 'tspan',
    'defs', 'linearGradient', 'radialGradient', 'stop', 'pattern', 'mask', 'clipPath', 'use', 'symbol',
    'marker', 'image', 'foreignObject', 'animate', 'animateTransform', 'animateMotion', 'set', 'filter',
    'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting',
    'feDisplacementMap', 'feFlood', 'feGaussianBlur', 'feMorphology', 'feOffset', 'feSpecularLighting',
    'feTile', 'feTurbulence'
] as const;

// MathML Tags
const mathTags = [
    'math', 'mi', 'mn', 'mo', 'ms', 'mtext', 'mrow', 'mfrac', 'msqrt', 'mroot', 'msub', 'msup'
] as const;

type Elements = {
    [K in typeof tags[number]]: ElementFactory;
} & {
    [K in typeof svgTags[number] as `svg${Capitalize<K>}`]: ElementFactory;
} & {
    [K in typeof mathTags[number] as `math${Capitalize<K>}`]: ElementFactory;
} & {
    varElement: ElementFactory;
};

const elements: Partial<Elements> = {};

tags.forEach(tag => {
    (elements as any)[tag] = createElementFactory(tag);
});

svgTags.forEach(tag => {
    const name = 'svg' + tag.charAt(0).toUpperCase() + tag.slice(1);
    (elements as any)[name] = createElementFactory(tag);
});

mathTags.forEach(tag => {
    const name = 'math' + tag.charAt(0).toUpperCase() + tag.slice(1);
    (elements as any)[name] = createElementFactory(tag);
});

(elements as any).varElement = createElementFactory('var');

// Export all element factories
export const {
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
} = elements as Elements;

// Export elements object for dynamic access
export { elements };

// DOM utility functions - Shorthand helpers for common document operations
export const doc = document;
export const el = doc.querySelector.bind(doc);
export const els = doc.querySelectorAll.bind(doc);
export const createEl = doc.createElement.bind(doc);
export const createSvgEl = doc.createElementNS.bind(doc, 'http://www.w3.org/2000/svg');
export const createMathEl = doc.createElementNS.bind(doc, 'http://www.w3.org/1998/Math/MathML');
export const fragment = doc.createDocumentFragment.bind(doc);
export const textNode = doc.createTextNode.bind(doc);
export const commentNode = doc.createComment.bind(doc);
export const elId = doc.getElementById.bind(doc);
export const elClass = doc.getElementsByClassName.bind(doc);
export const elTag = doc.getElementsByTagName.bind(doc);
export const elName = doc.getElementsByName.bind(doc);