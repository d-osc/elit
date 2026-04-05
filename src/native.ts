import { ELIT_NATIVE_BINDING, type NativeBindingMetadata } from './state';
import styles, { type NativeStyleResolveOptions } from './style';
import type { Child, Props, VNode } from './types';

export type NativePlatform = 'generic' | 'android' | 'ios';

export type NativePropScalar = string | number | boolean | null;
export interface NativePropObject {
    [key: string]: NativePropValue;
}
export type NativePropValue = NativePropScalar | NativePropObject | NativePropValue[];

export interface NativeTextNode {
    kind: 'text';
    value: string;
    stateId?: string;
}

export interface NativeElementNode {
    kind: 'element';
    component: string;
    sourceTag: string;
    props: Record<string, NativePropValue>;
    events: string[];
    children: NativeNode[];
}

export type NativeNode = NativeTextNode | NativeElementNode;

export interface NativeTree {
    platform: NativePlatform;
    roots: NativeNode[];
    stateDescriptors?: NativeStateDescriptor[];
}

export interface NativeTransformOptions {
    platform?: NativePlatform;
    tagMap?: Record<string, string>;
    wrapTextNodes?: boolean;
    preserveUnknownTags?: boolean;
}

export interface AndroidComposeOptions {
    packageName?: string;
    functionName?: string;
    includePackage?: boolean;
    includeImports?: boolean;
    includePreview?: boolean;
}

export interface SwiftUIOptions {
    structName?: string;
    includeImports?: boolean;
    includePreview?: boolean;
}

type NativeHelperFlag = 'imagePlaceholder' | 'unsupportedPlaceholder' | 'uriHandler' | 'openUrlHandler' | 'downloadHandler' | 'bridge' | 'webViewSurface' | 'mediaSurface' | 'interactivePressState' | 'backgroundImage';
type NativeResolvedStyleMap = WeakMap<NativeElementNode, Record<string, NativePropValue>>;
interface NativeStyleContextEntry {
    scope: NativeStyleScope;
    ancestors: NativeStyleScope[];
    inheritedTextStyles: Record<string, NativePropValue>;
}
type NativeStyleContextMap = WeakMap<NativeElementNode, NativeStyleContextEntry>;

const IMAGE_FALLBACK_STOP_WORDS = new Set([
    'image',
    'icon',
    'public',
    'assets',
    'asset',
    'favicon',
    'svg',
    'png',
    'jpg',
    'jpeg',
    'webp',
]);

const CSS_NAMED_COLORS: Record<string, NativeColorValue> = {
    transparent: { red: 0, green: 0, blue: 0, alpha: 0 },
    black: { red: 0, green: 0, blue: 0, alpha: 1 },
    silver: { red: 192, green: 192, blue: 192, alpha: 1 },
    gray: { red: 128, green: 128, blue: 128, alpha: 1 },
    grey: { red: 128, green: 128, blue: 128, alpha: 1 },
    white: { red: 255, green: 255, blue: 255, alpha: 1 },
    maroon: { red: 128, green: 0, blue: 0, alpha: 1 },
    red: { red: 255, green: 0, blue: 0, alpha: 1 },
    purple: { red: 128, green: 0, blue: 128, alpha: 1 },
    fuchsia: { red: 255, green: 0, blue: 255, alpha: 1 },
    green: { red: 0, green: 128, blue: 0, alpha: 1 },
    lime: { red: 0, green: 255, blue: 0, alpha: 1 },
    olive: { red: 128, green: 128, blue: 0, alpha: 1 },
    yellow: { red: 255, green: 255, blue: 0, alpha: 1 },
    navy: { red: 0, green: 0, blue: 128, alpha: 1 },
    blue: { red: 0, green: 0, blue: 255, alpha: 1 },
    teal: { red: 0, green: 128, blue: 128, alpha: 1 },
    aqua: { red: 0, green: 255, blue: 255, alpha: 1 },
    orange: { red: 255, green: 165, blue: 0, alpha: 1 },
    pink: { red: 255, green: 192, blue: 203, alpha: 1 },
    brown: { red: 165, green: 42, blue: 42, alpha: 1 },
    cyan: { red: 0, green: 255, blue: 255, alpha: 1 },
    magenta: { red: 255, green: 0, blue: 255, alpha: 1 },
    rebeccapurple: { red: 102, green: 51, blue: 153, alpha: 1 },
};

Object.assign(CSS_NAMED_COLORS, createNativeNamedColorMap({
    aliceblue: '#f0f8ff',
    antiquewhite: '#faebd7',
    aqua: '#00ffff',
    aquamarine: '#7fffd4',
    azure: '#f0ffff',
    beige: '#f5f5dc',
    bisque: '#ffe4c4',
    black: '#000000',
    blanchedalmond: '#ffebcd',
    blue: '#0000ff',
    blueviolet: '#8a2be2',
    brown: '#a52a2a',
    burlywood: '#deb887',
    cadetblue: '#5f9ea0',
    chartreuse: '#7fff00',
    chocolate: '#d2691e',
    coral: '#ff7f50',
    cornflowerblue: '#6495ed',
    cornsilk: '#fff8dc',
    crimson: '#dc143c',
    cyan: '#00ffff',
    darkblue: '#00008b',
    darkcyan: '#008b8b',
    darkgoldenrod: '#b8860b',
    darkgray: '#a9a9a9',
    darkgreen: '#006400',
    darkgrey: '#a9a9a9',
    darkkhaki: '#bdb76b',
    darkmagenta: '#8b008b',
    darkolivegreen: '#556b2f',
    darkorange: '#ff8c00',
    darkorchid: '#9932cc',
    darkred: '#8b0000',
    darksalmon: '#e9967a',
    darkseagreen: '#8fbc8f',
    darkslateblue: '#483d8b',
    darkslategray: '#2f4f4f',
    darkslategrey: '#2f4f4f',
    darkturquoise: '#00ced1',
    darkviolet: '#9400d3',
    deeppink: '#ff1493',
    deepskyblue: '#00bfff',
    dimgray: '#696969',
    dimgrey: '#696969',
    dodgerblue: '#1e90ff',
    firebrick: '#b22222',
    floralwhite: '#fffaf0',
    forestgreen: '#228b22',
    fuchsia: '#ff00ff',
    gainsboro: '#dcdcdc',
    ghostwhite: '#f8f8ff',
    gold: '#ffd700',
    goldenrod: '#daa520',
    gray: '#808080',
    green: '#008000',
    greenyellow: '#adff2f',
    grey: '#808080',
    honeydew: '#f0fff0',
    hotpink: '#ff69b4',
    indianred: '#cd5c5c',
    indigo: '#4b0082',
    ivory: '#fffff0',
    khaki: '#f0e68c',
    lavender: '#e6e6fa',
    lavenderblush: '#fff0f5',
    lawngreen: '#7cfc00',
    lemonchiffon: '#fffacd',
    lightblue: '#add8e6',
    lightcoral: '#f08080',
    lightcyan: '#e0ffff',
    lightgoldenrodyellow: '#fafad2',
    lightgray: '#d3d3d3',
    lightgreen: '#90ee90',
    lightgrey: '#d3d3d3',
    lightpink: '#ffb6c1',
    lightsalmon: '#ffa07a',
    lightseagreen: '#20b2aa',
    lightskyblue: '#87cefa',
    lightslategray: '#778899',
    lightslategrey: '#778899',
    lightsteelblue: '#b0c4de',
    lightyellow: '#ffffe0',
    lime: '#00ff00',
    limegreen: '#32cd32',
    linen: '#faf0e6',
    magenta: '#ff00ff',
    maroon: '#800000',
    mediumaquamarine: '#66cdaa',
    mediumblue: '#0000cd',
    mediumorchid: '#ba55d3',
    mediumpurple: '#9370db',
    mediumseagreen: '#3cb371',
    mediumslateblue: '#7b68ee',
    mediumspringgreen: '#00fa9a',
    mediumturquoise: '#48d1cc',
    mediumvioletred: '#c71585',
    midnightblue: '#191970',
    mintcream: '#f5fffa',
    mistyrose: '#ffe4e1',
    moccasin: '#ffe4b5',
    navajowhite: '#ffdead',
    navy: '#000080',
    oldlace: '#fdf5e6',
    olive: '#808000',
    olivedrab: '#6b8e23',
    orange: '#ffa500',
    orangered: '#ff4500',
    orchid: '#da70d6',
    palegoldenrod: '#eee8aa',
    palegreen: '#98fb98',
    paleturquoise: '#afeeee',
    palevioletred: '#db7093',
    papayawhip: '#ffefd5',
    peachpuff: '#ffdab9',
    peru: '#cd853f',
    pink: '#ffc0cb',
    plum: '#dda0dd',
    powderblue: '#b0e0e6',
    purple: '#800080',
    rebeccapurple: '#663399',
    red: '#ff0000',
    rosybrown: '#bc8f8f',
    royalblue: '#4169e1',
    saddlebrown: '#8b4513',
    salmon: '#fa8072',
    sandybrown: '#f4a460',
    seagreen: '#2e8b57',
    seashell: '#fff5ee',
    sienna: '#a0522d',
    silver: '#c0c0c0',
    skyblue: '#87ceeb',
    slateblue: '#6a5acd',
    slategray: '#708090',
    slategrey: '#708090',
    snow: '#fffafa',
    springgreen: '#00ff7f',
    steelblue: '#4682b4',
    tan: '#d2b48c',
    teal: '#008080',
    thistle: '#d8bfd8',
    tomato: '#ff6347',
    transparent: '#00000000',
    turquoise: '#40e0d0',
    violet: '#ee82ee',
    wheat: '#f5deb3',
    white: '#ffffff',
    whitesmoke: '#f5f5f5',
    yellow: '#ffff00',
    yellowgreen: '#9acd32',
}));

function nativeColorFromHexLiteral(hex: string): NativeColorValue {
    const normalized = hex.trim().replace(/^#/, '');
    const red = Number.parseInt(normalized.slice(0, 2), 16);
    const green = Number.parseInt(normalized.slice(2, 4), 16);
    const blue = Number.parseInt(normalized.slice(4, 6), 16);
    const alpha = normalized.length >= 8 ? Number.parseInt(normalized.slice(6, 8), 16) / 255 : 1;
    return { red, green, blue, alpha };
}

function createNativeNamedColorMap(colors: Record<string, string>): Record<string, NativeColorValue> {
    return Object.fromEntries(
        Object.entries(colors).map(([name, hex]) => [name, nativeColorFromHexLiteral(hex)])
    );
}

const CURRENT_COLOR_KEYWORD = 'currentcolor';

// Maximum allowed length for a TextInput pattern prop, and a structural guard
// that rejects patterns with nested quantifiers — the primary source of
// catastrophic (polynomial / exponential) backtracking in NFA-based engines.
const NATIVE_PATTERN_MAX_LENGTH = 500;
// Matches a group that contains a + or * quantifier and is itself quantified
// with + or * — e.g. (a+)+, (a|b*)+. Such patterns are the canonical
// cause of ReDoS when applied to adversarial input.
const REDOS_NESTED_QUANTIFIER = /\([^()]*[+*][^()]*\)[+*]/;

function cloneNativeColor(color: NativeColorValue | undefined): NativeColorValue | undefined {
    return color ? { ...color } : undefined;
}

function getDefaultCurrentColor(): NativeColorValue {
    return cloneNativeColor(CSS_NAMED_COLORS.black) ?? { red: 0, green: 0, blue: 0, alpha: 1 };
}

function isCurrentColorKeyword(value: NativePropValue | undefined): value is string {
    return typeof value === 'string' && value.trim().toLowerCase() === CURRENT_COLOR_KEYWORD;
}

function nativeColorToCssColorLiteral(color: NativeColorValue): string {
    return `rgba(${color.red}, ${color.green}, ${color.blue}, ${Number(color.alpha.toFixed(3))})`;
}

function resolveStyleCurrentColor(
    style: Record<string, NativePropValue> | undefined,
    inheritedColor?: NativeColorValue,
): NativeColorValue {
    const fallbackColor = cloneNativeColor(inheritedColor) ?? getDefaultCurrentColor();
    const resolvedColor = parseCssColor(style?.color, fallbackColor);
    return resolvedColor ?? fallbackColor;
}

function normalizeResolvedCurrentTextColor(
    style: Record<string, NativePropValue> | undefined,
    inheritedColor?: NativeColorValue,
): Record<string, NativePropValue> | undefined {
    if (!style || !isCurrentColorKeyword(style.color)) {
        return style;
    }

    return {
        ...style,
        color: nativeColorToCssColorLiteral(resolveStyleCurrentColor(style, inheritedColor)),
    };
}

interface NativeStyleScope {
    tagName: string;
    classNames: string[];
    attributes: Record<string, string>;
    pseudoStates: string[];
    previousSiblings?: NativeStyleScope[];
    nextSiblings?: NativeStyleScope[];
    children?: NativeStyleScope[];
    childIndex?: number;
    siblingCount?: number;
    sameTypeIndex?: number;
    sameTypeCount?: number;
    containerNames?: string[];
    containerWidth?: number;
    isContainer?: boolean;
}

interface NativeRenderHints {
    fillWidth?: boolean;
    fillHeight?: boolean;
    availableWidth?: number;
    availableHeight?: number;
    negotiatedMaxWidth?: number;
    negotiatedMaxHeight?: number;
    parentFlexLayout?: 'Row' | 'Column';
    parentRowBaselineAlignment?: 'first' | 'last';
    absoluteOverlay?: boolean;
}

interface NativeChunkedRow {
    items: NativeNode[];
    weights?: Array<number | undefined>;
    columnSizes?: Array<NativeGridColumnTrackSizeSpec | undefined>;
    minHeight?: number;
    height?: number;
    maxHeight?: number;
    trackWeight?: number;
    stretchEligible?: boolean;
}

interface NativeGridTrackSizeSpec {
    minHeight?: number;
    height?: number;
    maxHeight?: number;
    trackWeight?: number;
    stretchEligible?: boolean;
    intrinsicHeight?: boolean;
    intrinsicMinHeight?: boolean;
    intrinsicMaxHeight?: boolean;
}

interface NativeGridColumnTrackSizeSpec {
    minWidth?: number;
    width?: number;
    maxWidth?: number;
    trackWeight?: number;
    intrinsicWidth?: boolean;
    intrinsicMinWidth?: boolean;
    intrinsicMaxWidth?: boolean;
}

type NativeVideoPosterFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
type NativeVideoPosterPosition = 'center' | 'top' | 'bottom' | 'leading' | 'trailing' | 'top-leading' | 'top-trailing' | 'bottom-leading' | 'bottom-trailing';
type NativeBackgroundRepeat = 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
type NativeContentStackAlignment = 'start' | 'center' | 'end' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly';
type NativeGridItemAlignment = 'start' | 'center' | 'end' | 'stretch';

interface NativeBackgroundLayerMetadata {
    source?: string;
    gradient?: NativeGradientValue;
    color?: NativeColorValue;
    repeat?: NativeBackgroundRepeat;
    size?: string;
    position?: string;
}

interface NativeBackgroundImageSpec {
    kind: 'image';
    source: string;
    fit: NativeVideoPosterFit;
    position: NativeVideoPosterPosition;
    repeat: NativeBackgroundRepeat;
}

type NativeBackgroundLayerSpec =
    | NativeBackgroundImageSpec
    | { kind: 'gradient'; gradient: NativeGradientValue }
    | { kind: 'color'; color: NativeColorValue };

interface NativeGridTemplateAreaPlacement {
    rowPlacement: { start?: number; span: number };
    columnPlacement: { start?: number; span: number };
}

interface NativeGridTrackDefinition {
    tracks: string[];
    lineNames: Map<string, number[]>;
    lineCount: number;
}

interface NativeChunkedLayout {
    kind: 'grid' | 'wrap';
    rows: NativeChunkedRow[];
    rowGap?: number;
    columnGap?: number;
    contentAlignment?: NativeContentStackAlignment;
}

interface NativeAutoMarginFlags {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
}

interface StateLike<T = unknown> {
    value: T;
    subscribe: (listener: (value: T) => void) => () => void;
}

type NativeStateValueType = 'string' | 'number' | 'boolean' | 'string-array';

interface NativeStateDescriptor {
    id: string;
    type: NativeStateValueType;
    initialValue: string | number | boolean | string[];
}

interface NativeBindingReference extends NativePropObject {
    id: string;
    kind: 'value' | 'checked';
    valueType: NativeStateValueType;
}

interface NativePickerOption {
    label: string;
    value: string;
    selected?: boolean;
    disabled?: boolean;
}

interface NativeControlEventExpressionOptions {
    valueExpression?: string;
    valuesExpression?: string;
    checkedExpression?: string;
}

interface NativeTransformContext {
    nextStateIndex: number;
    stateIds: WeakMap<object, string>;
    stateDescriptors: Map<string, NativeStateDescriptor>;
}

interface AndroidComposeContext {
    textFieldIndex: number;
    sliderIndex: number;
    toggleIndex: number;
    pickerIndex: number;
    interactionIndex: number;
    stateDeclarations: string[];
    declaredStateIds: Set<string>;
    helperFlags: Set<NativeHelperFlag>;
    resolvedStyles: NativeResolvedStyleMap;
    styleContexts: NativeStyleContextMap;
    styleResolveOptions: NativeStyleResolveOptions;
    stateDescriptors: Map<string, NativeStateDescriptor>;
}

interface SwiftUIContext {
    textFieldIndex: number;
    sliderIndex: number;
    toggleIndex: number;
    pickerIndex: number;
    interactionIndex: number;
    stateDeclarations: string[];
    declaredStateIds: Set<string>;
    helperFlags: Set<NativeHelperFlag>;
    resolvedStyles: NativeResolvedStyleMap;
    styleContexts: NativeStyleContextMap;
    styleResolveOptions: NativeStyleResolveOptions;
    stateDescriptors: Map<string, NativeStateDescriptor>;
}

interface NativeColorValue {
    red: number;
    green: number;
    blue: number;
    alpha: number;
}

type NativeGradientDirection =
    | 'topToBottom'
    | 'bottomToTop'
    | 'leadingToTrailing'
    | 'trailingToLeading'
    | 'topLeadingToBottomTrailing'
    | 'bottomTrailingToTopLeading';

interface NativeGradientValue {
    colors: NativeColorValue[];
    direction: NativeGradientDirection;
}

type NativeVectorPathCommand =
    | { kind: 'moveTo' | 'lineTo'; x: number; y: number }
    | { kind: 'cubicTo'; control1X: number; control1Y: number; control2X: number; control2Y: number; x: number; y: number }
    | { kind: 'close' };

interface NativeIntrinsicSizeSpec {
    intrinsicWidth: number;
    intrinsicHeight: number;
}

export interface NativeCanvasPoint {
    x: number;
    y: number;
}

export type NativeCanvasDrawOperation =
    | {
        kind: 'rect';
        x?: number;
        y?: number;
        width: number;
        height: number;
        rx?: number;
        ry?: number;
        fill?: string;
        fillStyle?: string;
        stroke?: string;
        strokeStyle?: string;
        strokeWidth?: number;
        lineWidth?: number;
    }
    | {
        kind: 'circle';
        cx: number;
        cy: number;
        r: number;
        fill?: string;
        fillStyle?: string;
        stroke?: string;
        strokeStyle?: string;
        strokeWidth?: number;
        lineWidth?: number;
    }
    | {
        kind: 'ellipse';
        cx: number;
        cy: number;
        rx: number;
        ry: number;
        fill?: string;
        fillStyle?: string;
        stroke?: string;
        strokeStyle?: string;
        strokeWidth?: number;
        lineWidth?: number;
    }
    | {
        kind: 'line';
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        stroke?: string;
        strokeStyle?: string;
        strokeWidth?: number;
        lineWidth?: number;
    }
    | {
        kind: 'polyline' | 'polygon';
        points: string | NativeCanvasPoint[];
        fill?: string;
        fillStyle?: string;
        stroke?: string;
        strokeStyle?: string;
        strokeWidth?: number;
        lineWidth?: number;
    }
    | {
        kind: 'path';
        d: string;
        fill?: string;
        fillStyle?: string;
        stroke?: string;
        strokeStyle?: string;
        strokeWidth?: number;
        lineWidth?: number;
    };

type NativeVectorShape =
    | {
        kind: 'circle';
        cx: number;
        cy: number;
        r: number;
        fill?: NativeColorValue;
        stroke?: NativeColorValue;
        strokeWidth?: number;
    }
    | {
        kind: 'rect';
        x: number;
        y: number;
        width: number;
        height: number;
        rx?: number;
        ry?: number;
        fill?: NativeColorValue;
        stroke?: NativeColorValue;
        strokeWidth?: number;
    }
    | {
        kind: 'ellipse';
        cx: number;
        cy: number;
        rx: number;
        ry: number;
        fill?: NativeColorValue;
        stroke?: NativeColorValue;
        strokeWidth?: number;
    }
    | {
        kind: 'path';
        commands: NativeVectorPathCommand[];
        fill?: NativeColorValue;
        stroke?: NativeColorValue;
        strokeWidth?: number;
    };

interface NativeVectorViewport {
    minX: number;
    minY: number;
    width: number;
    height: number;
}

interface NativeVectorSpec extends NativeIntrinsicSizeSpec {
    viewport: NativeVectorViewport;
    shapes: NativeVectorShape[];
}

interface NativeCanvasSpec extends NativeIntrinsicSizeSpec {
}

interface NativeFlexStyleValues {
    grow?: number;
    shrink?: number;
    basis?: NativePropValue;
}

interface NativeShadowValue {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: NativeColorValue;
}

type NativeBorderStyleKeyword = 'solid' | 'dashed' | 'dotted' | 'none' | 'unsupported';

interface NativeBorderSideValue {
    width: string;
    color: NativeColorValue;
    style?: NativeBorderStyleKeyword;
}

interface NativeBorderValue {
    width?: string;
    color?: NativeColorValue;
    style?: NativeBorderStyleKeyword;
    top?: NativeBorderSideValue;
    right?: NativeBorderSideValue;
    bottom?: NativeBorderSideValue;
    left?: NativeBorderSideValue;
}

const DEFAULT_COMPONENT_MAP: Record<string, string> = {
    html: 'Screen',
    body: 'Screen',
    main: 'Screen',
    section: 'View',
    address: 'View',
    header: 'View',
    footer: 'View',
    nav: 'View',
    article: 'View',
    aside: 'View',
    div: 'View',
    dl: 'View',
    dt: 'View',
    dd: 'View',
    map: 'View',
    figure: 'View',
    figcaption: 'Text',
    details: 'View',
    dialog: 'View',
    form: 'View',
    fieldset: 'View',
    datalist: 'View',
    optgroup: 'View',
    menu: 'View',
    ul: 'List',
    ol: 'List',
    li: 'ListItem',
    table: 'Table',
    tbody: 'View',
    thead: 'View',
    tfoot: 'View',
    tr: 'Row',
    td: 'Cell',
    th: 'Cell',
    caption: 'Text',
    h1: 'Text',
    h2: 'Text',
    h3: 'Text',
    h4: 'Text',
    h5: 'Text',
    h6: 'Text',
    p: 'Text',
    span: 'Text',
    label: 'Text',
    legend: 'Text',
    summary: 'Text',
    strong: 'Text',
    em: 'Text',
    b: 'Text',
    bdi: 'Text',
    bdo: 'Text',
    i: 'Text',
    small: 'Text',
    code: 'Text',
    data: 'Text',
    mark: 'Text',
    q: 'Text',
    cite: 'Text',
    ruby: 'Text',
    rp: 'Text',
    rt: 'Text',
    s: 'Text',
    time: 'Text',
    sub: 'Text',
    sup: 'Text',
    u: 'Text',
    del: 'Text',
    ins: 'Text',
    output: 'Text',
    abbr: 'Text',
    dfn: 'Text',
    kbd: 'Text',
    samp: 'Text',
    blockquote: 'Text',
    pre: 'Text',
    hr: 'Divider',
    button: 'Button',
    a: 'Link',
    input: 'TextInput',
    textarea: 'TextInput',
    select: 'Picker',
    option: 'Option',
    progress: 'Progress',
    meter: 'Progress',
    img: 'Image',
    picture: 'Image',
    audio: 'Media',
    video: 'Media',
    canvas: 'Canvas',
    iframe: 'WebView',
    object: 'WebView',
    embed: 'WebView',
    portal: 'WebView',
    svg: 'Vector',
};

const DEFAULT_OPTIONS: Required<Omit<NativeTransformOptions, 'tagMap'>> = {
    platform: 'generic',
    wrapTextNodes: true,
    preserveUnknownTags: false,
};

const NON_RENDERING_NATIVE_TAGS = new Set([
    'head',
    'title',
    'base',
    'link',
    'meta',
    'style',
    'script',
    'noscript',
    'template',
    'source',
    'track',
    'param',
    'area',
    'col',
    'colgroup',
    'wbr',
]);

const TRANSPARENT_NATIVE_TAGS = new Set(['slot']);

const SVG_SOURCE_TAGS = new Set([
    'svg',
    'circle',
    'rect',
    'path',
    'line',
    'polyline',
    'polygon',
    'ellipse',
    'g',
    'text',
    'tspan',
    'defs',
    'linearGradient',
    'radialGradient',
    'stop',
    'pattern',
    'mask',
    'clipPath',
    'use',
    'symbol',
    'marker',
    'image',
    'foreignObject',
    'animate',
    'animateTransform',
    'animateMotion',
    'set',
    'filter',
    'feBlend',
    'feColorMatrix',
    'feComponentTransfer',
    'feComposite',
    'feConvolveMatrix',
    'feDiffuseLighting',
    'feDisplacementMap',
    'feFlood',
    'feGaussianBlur',
    'feMorphology',
    'feOffset',
    'feSpecularLighting',
    'feTile',
    'feTurbulence',
]);

const MATH_SOURCE_TAGS = new Set([
    'math',
    'mi',
    'mn',
    'mo',
    'ms',
    'mtext',
    'mrow',
    'mfrac',
    'msqrt',
    'mroot',
    'msub',
    'msup',
]);

const INLINE_DISPLAY_VALUES = new Set(['inline', 'inline-block', 'inline-flex', 'inline-grid']);
const DEFAULT_BLOCK_FILL_SOURCE_TAGS = new Set([
    'html',
    'body',
    'main',
    'header',
    'footer',
    'nav',
    'section',
    'article',
    'aside',
    'div',
    'form',
    'fieldset',
    'figure',
    'details',
    'dialog',
    'menu',
    'ul',
    'ol',
    'li',
    'table',
    'tbody',
    'thead',
    'tfoot',
    'tr',
]);
const FILL_WIDTH_EXCLUDED_COMPONENTS = new Set(['Text', 'Button', 'Link', 'Toggle', 'TextInput', 'Image', 'Media', 'WebView', 'Canvas', 'Vector', 'Math']);

const TEXT_CONTAINER_COMPONENTS = new Set(['Text']);

const EVENT_NAME_MAP: Record<string, string> = {
    onClick: 'press',
    onChange: 'change',
    onInput: 'input',
    onSubmit: 'submit',
};

const INHERITED_TEXT_STYLE_KEYS = [
    'color',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'letterSpacing',
    'lineHeight',
    'textAlign',
    'textTransform',
] as const;

function isStateLike(value: unknown): value is StateLike {
    return Boolean(
        value &&
        typeof value === 'object' &&
        'value' in value &&
        'subscribe' in value &&
        typeof (value as { subscribe?: unknown }).subscribe === 'function'
    );
}

function createNativeTransformContext(): NativeTransformContext {
    return {
        nextStateIndex: 0,
        stateIds: new WeakMap(),
        stateDescriptors: new Map(),
    };
}

function inferNativeStateValueType(value: unknown): NativeStateValueType {
    if (Array.isArray(value)) {
        return 'string-array';
    }

    if (typeof value === 'boolean') {
        return 'boolean';
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return 'number';
    }

    return 'string';
}

function coerceNativeStateInitialValue(value: unknown, type: NativeStateValueType): string | number | boolean | string[] {
    if (type === 'string-array') {
        if (!Array.isArray(value)) {
            return [];
        }

        return value
            .filter((entry): entry is string | number | boolean => typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean')
            .map((entry) => String(entry));
    }

    if (type === 'boolean') {
        return Boolean(value);
    }

    if (type === 'number') {
        return typeof value === 'number' && Number.isFinite(value) ? value : 0;
    }

    return value == null ? '' : String(value);
}

function ensureNativeStateDescriptor(stateContext: NativeTransformContext, stateLike: StateLike): NativeStateDescriptor {
    const existingId = stateContext.stateIds.get(stateLike as object);
    if (existingId) {
        const existing = stateContext.stateDescriptors.get(existingId);
        if (!existing) {
            throw new Error(`Missing native state descriptor for ${existingId}`);
        }
        return existing;
    }

    const id = `state${stateContext.nextStateIndex++}`;
    const type = inferNativeStateValueType(stateLike.value);
    const descriptor: NativeStateDescriptor = {
        id,
        type,
        initialValue: coerceNativeStateInitialValue(stateLike.value, type),
    };

    stateContext.stateIds.set(stateLike as object, id);
    stateContext.stateDescriptors.set(id, descriptor);
    return descriptor;
}

function isPrimitiveNativeStateValue(value: unknown): value is string | number | boolean | null | undefined {
    return value == null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function readNativeBindingMetadata(props: Props): NativeBindingMetadata | undefined {
    const metadata = (props as Props & { [ELIT_NATIVE_BINDING]?: NativeBindingMetadata })[ELIT_NATIVE_BINDING];
    if (!metadata || typeof metadata !== 'object' || !('kind' in metadata) || !('state' in metadata)) {
        return undefined;
    }

    return metadata;
}

function isVNode(value: unknown): value is VNode {
    return Boolean(
        value &&
        typeof value === 'object' &&
        'tagName' in value &&
        'props' in value &&
        'children' in value
    );
}

function isNativeTree(value: unknown): value is NativeTree {
    return Boolean(
        value &&
        typeof value === 'object' &&
        'platform' in value &&
        'roots' in value
    );
}

function isEventProp(key: string, value: unknown): boolean {
    return /^on[A-Z]/.test(key) && typeof value === 'function';
}

function serializeValue(value: unknown): NativePropValue | undefined {
    if (value == null || value === false) return undefined;
    if (isStateLike(value)) return serializeValue(value.value);

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }

    if (Array.isArray(value)) {
        const serialized = value
            .map((item) => serializeValue(item))
            .filter((item): item is NativePropValue => item !== undefined);
        return serialized;
    }

    if (typeof value === 'function') {
        return '[function]';
    }

    if (typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>);
        const serialized: NativePropObject = {};
        for (const [key, item] of entries) {
            const result = serializeValue(item);
            if (result !== undefined) {
                serialized[key] = result;
            }
        }
        return serialized;
    }

    return String(value);
}

function normalizeProps(
    component: string,
    props: Props,
    stateContext?: NativeTransformContext,
): { props: Record<string, NativePropValue>; events: string[] } {
    const normalized: Record<string, NativePropValue> = {};
    const events: string[] = [];

    for (const [key, rawValue] of Object.entries(props)) {
        if ((key === 'aria-invalid' || key === 'aria-pressed') && rawValue === false) {
            normalized[key] = false;
            continue;
        }

        if (rawValue == null || rawValue === false || key === 'ref') continue;

        if (isEventProp(key, rawValue)) {
            events.push(EVENT_NAME_MAP[key] ?? key.slice(2).toLowerCase());
            continue;
        }

        if (key === 'class' || key === 'className') {
            const classList = Array.isArray(rawValue)
                ? rawValue.map((item) => String(item))
                : String(rawValue).split(/\s+/).filter(Boolean);
            if (classList.length > 0) {
                normalized.classList = classList;
            }
            continue;
        }

        if (key === 'dangerouslySetInnerHTML' && typeof rawValue === 'object' && rawValue && '__html' in rawValue) {
            normalized.innerHTML = String((rawValue as { __html: unknown }).__html ?? '');
            continue;
        }

        const serialized = serializeValue(rawValue);
        if (serialized !== undefined) {
            normalized[key] = serialized;
        }
    }

    if (component === 'Image' && normalized.src !== undefined) {
        normalized.source = normalized.src;
        delete normalized.src;
    }

    if (component === 'Media') {
        if (normalized.src !== undefined) {
            normalized.source = normalized.src;
            delete normalized.src;
        }
    }

    if (component === 'WebView') {
        if (normalized.src !== undefined) {
            normalized.source = normalized.src;
            delete normalized.src;
        } else if (normalized.data !== undefined) {
            normalized.source = normalized.data;
        }
    }

    if (component === 'Link' && normalized.href !== undefined) {
        normalized.destination = normalized.href;
        delete normalized.href;
    }

    const nativeBinding = readNativeBindingMetadata(props);
    if (nativeBinding && stateContext) {
        const descriptor = ensureNativeStateDescriptor(stateContext, nativeBinding.state);
        const reference: NativeBindingReference = {
            id: descriptor.id,
            kind: nativeBinding.kind,
            valueType: descriptor.type,
        };

        normalized.nativeBinding = reference;
    }

    return { props: normalized, events };
}

function resolveComponent(tagName: string, options: Required<Omit<NativeTransformOptions, 'tagMap'>> & { tagMap: Record<string, string> }): string {
    if (options.tagMap[tagName]) return options.tagMap[tagName];
    if (DEFAULT_COMPONENT_MAP[tagName]) return DEFAULT_COMPONENT_MAP[tagName];
    if (SVG_SOURCE_TAGS.has(tagName)) return 'Vector';
    if (MATH_SOURCE_TAGS.has(tagName)) return 'Math';
    return options.preserveUnknownTags ? tagName : 'View';
}

function resolveNativeInputTypeValue(sourceTag: string, props: Record<string, NativePropValue>): string | undefined {
    if (sourceTag === 'textarea') {
        return 'textarea';
    }

    if (sourceTag !== 'input') {
        return undefined;
    }

    return typeof props.type === 'string' && props.type.trim()
        ? props.type.trim().toLowerCase()
        : 'text';
}

function isCheckboxInput(sourceTag: string, props: Record<string, NativePropValue>): boolean {
    return resolveNativeInputTypeValue(sourceTag, props) === 'checkbox';
}

function isRangeInput(sourceTag: string, props: Record<string, NativePropValue>): boolean {
    return resolveNativeInputTypeValue(sourceTag, props) === 'range';
}

function isExternalDestination(value: NativePropValue | undefined): value is string {
    return typeof value === 'string' && /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value);
}

function toNativeBoolean(value: NativePropValue | undefined): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === 'true' || normalized === '1' || normalized === 'on' || normalized === 'yes';
    }
    return false;
}

function isNativeDisabled(node: NativeElementNode): boolean {
    return toNativeBoolean(node.props.disabled) || toNativeBoolean(node.props['aria-disabled']);
}

function isNativeEnabled(node: NativeElementNode): boolean {
    return (node.component === 'Button' || isNativeFormControl(node)) && !isNativeDisabled(node);
}

function isNativeChecked(node: NativeElementNode): boolean {
    return toNativeBoolean(node.props.checked) || toNativeBoolean(node.props['aria-checked']);
}

function isNativeSelected(node: NativeElementNode): boolean {
    return toNativeBoolean(node.props.selected)
        || toNativeBoolean(node.props['aria-selected'])
        || typeof node.props['aria-current'] === 'string';
}

function hasNativePressedAccessibilityState(node: NativeElementNode): boolean {
    return node.props['aria-pressed'] !== undefined;
}

function isNativePressed(node: NativeElementNode): boolean {
    return toNativeBoolean(node.props['aria-pressed'])
        || toNativeBoolean(node.props.pressed)
        || toNativeBoolean(node.props.active);
}

function isNativeActive(node: NativeElementNode): boolean {
    return !isNativeDisabled(node) && isNativePressed(node);
}

function isNativeRequired(node: NativeElementNode): boolean {
    return toNativeBoolean(node.props.required) || toNativeBoolean(node.props['aria-required']);
}

function isNativeMultiple(node: NativeElementNode): boolean {
    return node.component === 'Picker' && toNativeBoolean(node.props.multiple);
}

function resolveNativeLinkTarget(node: NativeElementNode): string | undefined {
    return node.component === 'Link' && typeof node.props.target === 'string' && node.props.target.trim()
        ? node.props.target.trim().toLowerCase()
        : undefined;
}

function resolveNativeLinkRelTokens(node: NativeElementNode): string[] {
    if (node.component !== 'Link' || typeof node.props.rel !== 'string') {
        return [];
    }

    return node.props.rel
        .split(/\s+/)
        .map((token) => token.trim().toLowerCase())
        .filter(Boolean);
}

function canNativeDownloadDestination(destination: string): boolean {
    return /^https?:/i.test(destination);
}

function shouldNativeDownloadLink(node: NativeElementNode): boolean {
    if (node.component !== 'Link' || node.props.download === undefined) {
        return false;
    }

    const destination = typeof node.props.destination === 'string' ? node.props.destination : undefined;
    return Boolean(destination && canNativeDownloadDestination(destination));
}

function resolveNativeDownloadSuggestedName(node: NativeElementNode): string | undefined {
    if (!shouldNativeDownloadLink(node)) {
        return undefined;
    }

    if (typeof node.props.download === 'string' && node.props.download.trim()) {
        return node.props.download.trim();
    }

    const destination = typeof node.props.destination === 'string' ? node.props.destination : undefined;
    if (!destination) {
        return undefined;
    }

    const normalized = destination.split(/[?#]/, 1)[0];
    const segments = normalized.split('/').filter(Boolean);
    const tail = segments[segments.length - 1];
    return tail && !tail.includes(':') ? tail : undefined;
}

function resolveNativeLinkHint(node: NativeElementNode): string | undefined {
    if (node.component !== 'Link') {
        return undefined;
    }

    const parts: string[] = [];
    const destination = typeof node.props.destination === 'string' ? node.props.destination : undefined;
    const target = resolveNativeLinkTarget(node);
    const relTokens = resolveNativeLinkRelTokens(node);

    if (shouldNativeDownloadLink(node)) {
        parts.push('Downloads file');
    }

    if (destination && (isExternalDestination(destination) || target === '_blank' || target === '_system' || relTokens.includes('external'))) {
        parts.push('Opens externally');
    }

    return parts.length > 0 ? parts.join(', ') : undefined;
}

function isNativeFormControl(node: NativeElementNode): boolean {
    return node.component === 'TextInput' || node.component === 'Toggle' || node.component === 'Picker' || node.component === 'Slider';
}

function canNativeParticipateInValidation(node: NativeElementNode): boolean {
    return isNativeFormControl(node) && !isNativeDisabled(node);
}

function resolveNativeTextInputValue(node: NativeElementNode): string {
    return typeof node.props.value === 'string' || typeof node.props.value === 'number'
        ? String(node.props.value)
        : '';
}

function parseNativeNonNegativeIntegerConstraint(value: NativePropValue | undefined): number | undefined {
    const parsed = parsePlainNumericValue(value);
    return parsed !== undefined && Number.isInteger(parsed) && parsed >= 0
        ? parsed
        : undefined;
}

function resolveNativeTextInputMinLength(node: NativeElementNode): number | undefined {
    return parseNativeNonNegativeIntegerConstraint(node.props.minLength ?? node.props.minlength);
}

function resolveNativeTextInputMaxLength(node: NativeElementNode): number | undefined {
    return parseNativeNonNegativeIntegerConstraint(node.props.maxLength ?? node.props.maxlength);
}

function resolveNativePatternExpression(node: NativeElementNode): RegExp | undefined {
    if (node.component !== 'TextInput' || typeof node.props.pattern !== 'string' || !node.props.pattern.trim()) {
        return undefined;
    }

    const pattern = node.props.pattern.trim();
    if (pattern.length > NATIVE_PATTERN_MAX_LENGTH || REDOS_NESTED_QUANTIFIER.test(pattern)) {
        return undefined;
    }

    try {
        return new RegExp(`^(?:${pattern})$`);
    } catch {
        return undefined;
    }
}

function resolveNativeNumericConstraint(value: NativePropValue | undefined): number | undefined {
    return parsePlainNumericValue(value);
}

function resolveNativeStepConstraint(node: NativeElementNode): number | undefined {
    if (node.props.step === undefined) {
        return undefined;
    }

    if (typeof node.props.step === 'string' && node.props.step.trim().toLowerCase() === 'any') {
        return undefined;
    }

    const parsed = resolveNativeNumericConstraint(node.props.step);
    return parsed !== undefined && parsed > 0 ? parsed : undefined;
}

function supportsNativePatternValidation(node: NativeElementNode): boolean {
    switch (resolveNativeTextInputType(node)) {
        case 'text':
        case 'password':
        case 'email':
        case 'tel':
        case 'url':
        case 'search':
            return true;
        default:
            return false;
    }
}

function isNativeEmailValue(value: string): boolean {
    return /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value);
}

function isNativeUrlValue(value: string): boolean {
    try {
        const parsed = new URL(value);
        return Boolean(parsed.protocol && parsed.hostname);
    } catch {
        return false;
    }
}

function hasNativeValidationConstraint(node: NativeElementNode): boolean {
    if (node.props['aria-invalid'] !== undefined) {
        return true;
    }

    if (node.component === 'TextInput') {
        return isNativeRequired(node)
            || resolveNativeTextInputMinLength(node) !== undefined
            || resolveNativeTextInputMaxLength(node) !== undefined
            || resolveNativePatternExpression(node) !== undefined
            || resolveNativeNumericConstraint(node.props.min) !== undefined
            || resolveNativeNumericConstraint(node.props.max) !== undefined
            || resolveNativeStepConstraint(node) !== undefined
            || resolveNativeTextInputType(node) === 'email'
            || resolveNativeTextInputType(node) === 'url'
            || resolveNativeTextInputType(node) === 'number';
    }

    return isNativeRequired(node);
}

function isNativeTextInputConstraintInvalid(node: NativeElementNode): boolean {
    const value = resolveNativeTextInputValue(node);
    const trimmedValue = value.trim();

    if (isNativeRequired(node) && trimmedValue.length === 0) {
        return true;
    }

    if (trimmedValue.length === 0) {
        return false;
    }

    const inputType = resolveNativeTextInputType(node);
    if (inputType === 'email' && !isNativeEmailValue(trimmedValue)) {
        return true;
    }

    if (inputType === 'url' && !isNativeUrlValue(trimmedValue)) {
        return true;
    }

    const minLength = resolveNativeTextInputMinLength(node);
    if (minLength !== undefined && value.length < minLength) {
        return true;
    }

    const maxLength = resolveNativeTextInputMaxLength(node);
    if (maxLength !== undefined && value.length > maxLength) {
        return true;
    }

    const patternExpression = supportsNativePatternValidation(node)
        ? resolveNativePatternExpression(node)
        : undefined;
    if (patternExpression && !patternExpression.test(value)) {
        return true;
    }

    if (inputType === 'number') {
        const numericValue = Number(trimmedValue);
        if (!Number.isFinite(numericValue)) {
            return true;
        }

        const min = resolveNativeNumericConstraint(node.props.min);
        if (min !== undefined && numericValue < min) {
            return true;
        }

        const max = resolveNativeNumericConstraint(node.props.max);
        if (max !== undefined && numericValue > max) {
            return true;
        }

        const step = resolveNativeStepConstraint(node);
        if (step !== undefined) {
            const stepBase = resolveNativeNumericConstraint(node.props.min) ?? 0;
            const steps = (numericValue - stepBase) / step;
            if (Math.abs(steps - Math.round(steps)) > 1e-7) {
                return true;
            }
        }
    }

    return false;
}

function isNativePlaceholderShown(node: NativeElementNode): boolean {
    return node.component === 'TextInput'
        && typeof node.props.placeholder === 'string'
        && node.props.placeholder.length > 0
        && resolveNativeTextInputValue(node).length === 0;
}

function isNativeReadOnlyState(node: NativeElementNode): boolean {
    return node.component === 'TextInput' && (isNativeReadOnly(node) || isNativeDisabled(node));
}

function isNativeReadWrite(node: NativeElementNode): boolean {
    return node.component === 'TextInput' && !isNativeReadOnlyState(node);
}

function isNativeElementEmpty(node: NativeElementNode): boolean {
    return node.children.every((child) => child.kind === 'text' && child.value.length === 0);
}

function isNativeFocusWithin(node: NativeElementNode): boolean {
    if (isNativePseudoFocused(node)) {
        return true;
    }

    return node.children.some((child) => child.kind === 'element' && isNativeFocusWithin(child));
}

function isNativeAriaInvalid(node: NativeElementNode): boolean {
    const value = node.props['aria-invalid'];
    if (value === undefined || value === null || value === false) {
        return false;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized.length > 0 && normalized !== 'false';
    }

    return toNativeBoolean(value);
}

function isNativeInvalid(node: NativeElementNode): boolean {
    if (isNativeAriaInvalid(node)) {
        return true;
    }

    if (!isNativeFormControl(node)) {
        return false;
    }

    if (!canNativeParticipateInValidation(node)) {
        return false;
    }

    if (node.component === 'TextInput') {
        return isNativeTextInputConstraintInvalid(node);
    }

    if (!isNativeRequired(node)) {
        return false;
    }

    if (node.component === 'Toggle') {
        return !isNativeChecked(node);
    }

    if (node.component === 'Picker') {
        const options = resolveNativePickerOptions(node);
        return isNativeMultiple(node)
            ? resolveNativePickerInitialSelections(node, options).length === 0
            : resolveNativePickerInitialSelection(node, options).trim().length === 0;
    }

    return false;
}

function isNativeValid(node: NativeElementNode): boolean {
    return canNativeParticipateInValidation(node) && !isNativeInvalid(node);
}

function isNativeOptional(node: NativeElementNode): boolean {
    return isNativeFormControl(node) && !isNativeRequired(node);
}

function isNativeReadOnly(node: NativeElementNode): boolean {
    return toNativeBoolean(node.props.readOnly) || toNativeBoolean(node.props.readonly);
}

function parseNativeTabIndex(node: NativeElementNode): number | undefined {
    const rawValue = node.props.tabIndex ?? node.props.tabindex;
    if (typeof rawValue === 'number' && Number.isInteger(rawValue)) {
        return rawValue;
    }

    if (typeof rawValue === 'string' && /^-?\d+$/.test(rawValue.trim())) {
        return Number(rawValue.trim());
    }

    return undefined;
}

function hasNativeExplicitFocusSignal(node: NativeElementNode): boolean {
    return toNativeBoolean(node.props.autoFocus)
        || toNativeBoolean(node.props.autofocus)
        || toNativeBoolean(node.props.focused)
        || toNativeBoolean(node.props['aria-focused']);
}

function isNativeFocusableRole(node: NativeElementNode): boolean {
    const role = typeof node.props.role === 'string'
        ? node.props.role.trim().toLowerCase()
        : undefined;

    return role === 'button'
        || role === 'link'
        || role === 'checkbox'
        || role === 'switch'
        || role === 'tab'
        || role === 'textbox'
        || role === 'combobox';
}

function isNativeFocusableElement(node: NativeElementNode): boolean {
    if (isNativeDisabled(node)) {
        return false;
    }

    const tabIndex = parseNativeTabIndex(node);
    if (tabIndex !== undefined) {
        return tabIndex >= 0;
    }

    if (toNativeBoolean(node.props.contentEditable) || toNativeBoolean(node.props.contenteditable)) {
        return true;
    }

    if (node.component === 'TextInput' || node.component === 'Button' || node.component === 'Link' || node.component === 'Toggle' || node.component === 'Picker' || node.component === 'Slider') {
        return true;
    }

    return isNativeFocusableRole(node);
}

function isNativePseudoFocused(node: NativeElementNode): boolean {
    return hasNativeExplicitFocusSignal(node) && isNativeFocusableElement(node);
}

function shouldNativeAutoFocus(node: NativeElementNode): boolean {
    return node.component === 'TextInput' && hasNativeExplicitFocusSignal(node) && !isNativeDisabled(node);
}

function isNativeMuted(node: NativeElementNode): boolean {
    return toNativeBoolean(node.props.muted);
}

function shouldNativeShowVideoControls(node: NativeElementNode): boolean {
    return node.sourceTag === 'video' && toNativeBoolean(node.props.controls);
}

function resolveNativeVideoPoster(node: NativeElementNode): string | undefined {
    return node.sourceTag === 'video' && typeof node.props.poster === 'string' && node.props.poster.trim()
        ? node.props.poster.trim()
        : undefined;
}

function resolveNativeObjectFitStyle(style: Record<string, NativePropValue> | undefined): NativeVideoPosterFit {
    const rawValue = typeof style?.objectFit === 'string' ? style.objectFit.trim().toLowerCase() : '';

    switch (rawValue) {
        case 'contain':
        case 'fill':
        case 'none':
        case 'scale-down':
            return rawValue;
        default:
            return 'cover';
    }
}

function resolveNativeVideoPosterFit(
    node: NativeElementNode,
    resolvedStyles: NativeResolvedStyleMap | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
): NativeVideoPosterFit {
    if (node.sourceTag !== 'video') {
        return 'cover';
    }

    return resolveNativeObjectFitStyle(getStyleObject(node, resolvedStyles, styleResolveOptions));
}

function resolveNativeImageFit(
    node: NativeElementNode,
    resolvedStyles: NativeResolvedStyleMap | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
): NativeVideoPosterFit {
    return resolveNativeObjectFitStyle(getStyleObject(node, resolvedStyles, styleResolveOptions));
}

function normalizeNativePositionToken(value: string): 'leading' | 'center' | 'trailing' | 'top' | 'bottom' | undefined {
    const normalized = value.trim().toLowerCase();

    switch (normalized) {
        case 'left':
        case '0%':
            return 'leading';
        case 'right':
        case '100%':
            return 'trailing';
        case 'top':
            return 'top';
        case 'bottom':
            return 'bottom';
        case 'center':
        case '50%':
            return 'center';
        default:
            return undefined;
    }
}

function resolveNativeObjectPositionStyle(style: Record<string, NativePropValue> | undefined): NativeVideoPosterPosition {
    if (typeof style?.objectPosition !== 'string' || !style.objectPosition.trim()) {
        return 'center';
    }

    const tokens = style.objectPosition.trim().split(/\s+/).map(normalizeNativePositionToken).filter((value): value is 'leading' | 'center' | 'trailing' | 'top' | 'bottom' => Boolean(value));
    if (tokens.length === 0) {
        return 'center';
    }

    let horizontal: 'leading' | 'center' | 'trailing' = 'center';
    let vertical: 'top' | 'center' | 'bottom' = 'center';

    for (const token of tokens) {
        if (token === 'leading' || token === 'trailing') {
            horizontal = token;
        } else if (token === 'top' || token === 'bottom') {
            vertical = token;
        } else if (tokens.length === 1) {
            horizontal = 'center';
            vertical = 'center';
        }
    }

    if (horizontal === 'center' && vertical === 'center') {
        return 'center';
    }

    if (horizontal === 'center') {
        return vertical;
    }

    if (vertical === 'center') {
        return horizontal;
    }

    return `${vertical}-${horizontal}` as NativeVideoPosterPosition;
}

function resolveNativeVideoPosterPosition(
    node: NativeElementNode,
    resolvedStyles: NativeResolvedStyleMap | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
): NativeVideoPosterPosition {
    if (node.sourceTag !== 'video') {
        return 'center';
    }

    return resolveNativeObjectPositionStyle(getStyleObject(node, resolvedStyles, styleResolveOptions));
}

function resolveNativeImagePosition(
    node: NativeElementNode,
    resolvedStyles: NativeResolvedStyleMap | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
): NativeVideoPosterPosition {
    return resolveNativeObjectPositionStyle(getStyleObject(node, resolvedStyles, styleResolveOptions));
}

function resolveNativeContentStackAlignmentKeyword(value: NativePropValue | undefined): NativeContentStackAlignment | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    switch (value.trim().toLowerCase()) {
        case 'flex-start':
        case 'start':
        case 'top':
            return 'start';
        case 'center':
            return 'center';
        case 'flex-end':
        case 'end':
        case 'bottom':
            return 'end';
        case 'normal':
        case 'stretch':
            return 'stretch';
        case 'space-between':
            return 'space-between';
        case 'space-around':
            return 'space-around';
        case 'space-evenly':
            return 'space-evenly';
        default:
            return undefined;
    }
}

function resolveNativePlaceContent(
    value: NativePropValue | undefined,
): { align?: NativeContentStackAlignment; justify?: string } | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const tokens = value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
        return undefined;
    }

    const align = resolveNativeContentStackAlignmentKeyword(tokens[0]);
    const justify = tokens[1] ?? tokens[0];

    return align || justify
        ? {
            ...(align ? { align } : {}),
            ...(justify ? { justify } : {}),
        }
        : undefined;
}

function resolveNativeAlignContent(style: Record<string, NativePropValue> | undefined): NativeContentStackAlignment | undefined {
    const direct = resolveNativeContentStackAlignmentKeyword(style?.alignContent);
    if (direct) {
        return direct;
    }

    return resolveNativePlaceContent(style?.placeContent)?.align;
}

function resolveNativeJustifyContent(style: Record<string, NativePropValue> | undefined): string | undefined {
    if (!style) {
        return undefined;
    }

    if (typeof style.justifyContent === 'string' && style.justifyContent.trim()) {
        return style.justifyContent.trim().toLowerCase();
    }

    return resolveNativePlaceContent(style.placeContent)?.justify;
}

function extractCssUrlValue(value: string): string | undefined {
    const match = value.match(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s"'()]+))\s*\)/i);
    const resolved = match?.[1] ?? match?.[2] ?? match?.[3];
    return resolved?.trim() || undefined;
}

function extractCssFunctionValue(value: string, functionName: string): string | undefined {
    const lowerValue = value.toLowerCase();
    const lowerFunctionName = functionName.toLowerCase();
    const needle = `${lowerFunctionName}(`;
    let searchIndex = 0;

    while (searchIndex < value.length) {
        const matchIndex = lowerValue.indexOf(needle, searchIndex);
        if (matchIndex < 0) {
            return undefined;
        }

        const previousChar = matchIndex > 0 ? lowerValue[matchIndex - 1] : undefined;
        if (previousChar && /[a-z0-9-]/.test(previousChar)) {
            searchIndex = matchIndex + lowerFunctionName.length;
            continue;
        }

        let depth = 0;
        for (let index = matchIndex + lowerFunctionName.length; index < value.length; index += 1) {
            const char = value[index];
            if (char === '(') {
                depth += 1;
            } else if (char === ')' && depth > 0) {
                depth -= 1;
                if (depth === 0) {
                    return value.slice(matchIndex, index + 1);
                }
            }
        }

        return undefined;
    }

    return undefined;
}

function stripCssFunctionValue(value: string, functionName: string): string {
    const functionValue = extractCssFunctionValue(value, functionName);
    return functionValue ? value.replace(functionValue, ' ') : value;
}

function splitNativeBackgroundLayers(value: NativePropValue | undefined): string[] {
    if (typeof value !== 'string' || !value.trim()) {
        return [];
    }

    return splitCssFunctionArguments(value)
        .map((entry) => entry.trim())
        .filter(Boolean);
}

function normalizeNativeBackgroundRepeat(value: string | undefined): NativeBackgroundRepeat | undefined {
    switch (value?.trim().toLowerCase()) {
        case 'repeat':
        case 'repeat-x':
        case 'repeat-y':
        case 'no-repeat':
            return value.trim().toLowerCase() as NativeBackgroundRepeat;
        default:
            return undefined;
    }
}

function normalizeNativeBackgroundPositionValue(rawPosition: string | undefined): string | undefined {
    if (!rawPosition) {
        return undefined;
    }

    const positionTokens = rawPosition
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => normalizeNativePositionToken(token) !== undefined);
    return positionTokens.length > 0 ? positionTokens.join(' ') : undefined;
}

function normalizeNativeBackgroundSizeValue(rawSize: string | undefined): string | undefined {
    const sizeCandidate = rawSize?.trim().toLowerCase();
    return sizeCandidate?.startsWith('100% 100%')
        ? '100% 100%'
        : sizeCandidate?.startsWith('auto auto')
            ? 'auto auto'
            : sizeCandidate?.startsWith('scale-down')
                ? 'scale-down'
                : sizeCandidate?.match(/^(contain|cover|fill|none|auto)\b/i)?.[1]?.toLowerCase();
}

function resolveNativeBackgroundColorLayer(
    color: NativeColorValue | undefined,
    style: Record<string, NativePropValue>,
    styleResolveOptions: NativeStyleResolveOptions,
): NativeColorValue | undefined {
    const backdropBlur = color ? resolveBackdropBlurRadius(style, styleResolveOptions) : undefined;

    if (!color || backdropBlur === undefined || color.alpha >= 1) {
        return color;
    }

    return liftColorAlpha(color, Math.min(0.14, backdropBlur / 160));
}

function parseNativeBackgroundLayerMetadata(
    layer: string,
    currentColor: NativeColorValue,
): NativeBackgroundLayerMetadata | undefined {
    const sourceToken = extractCssFunctionValue(layer, 'url');
    const gradientToken = extractCssFunctionValue(layer, 'linear-gradient');
    const source = sourceToken ? extractCssUrlValue(sourceToken) : undefined;
    const gradient = gradientToken ? parseLinearGradient(gradientToken, currentColor) : undefined;

    let remainder = stripCssFunctionValue(stripCssFunctionValue(layer, 'url'), 'linear-gradient');

    const repeatMatch = remainder.match(/\b(no-repeat|repeat-[xy]|repeat)\b/i);
    const repeat = normalizeNativeBackgroundRepeat(repeatMatch?.[1]);
    if (repeatMatch) {
        remainder = `${remainder.slice(0, repeatMatch.index)} ${remainder.slice((repeatMatch.index ?? 0) + repeatMatch[0].length)}`.trim();
    }

    const [rawPosition, rawSize] = remainder.split(/\s*\/\s*/, 2);
    const position = normalizeNativeBackgroundPositionValue(rawPosition);
    const size = normalizeNativeBackgroundSizeValue(rawSize);
    const color = parseCssColor(remainder, currentColor);

    if (!source && !gradient && !color) {
        return undefined;
    }

    return {
        ...(source ? { source } : {}),
        ...(gradient ? { gradient } : {}),
        ...(color ? { color } : {}),
        ...(repeat ? { repeat } : {}),
        ...(size ? { size } : {}),
        ...(position ? { position } : {}),
    };
}

function resolveNativeBackgroundShorthandColor(
    value: NativePropValue | undefined,
    currentColor: NativeColorValue,
): NativeColorValue | undefined {
    if (typeof value !== 'string' || !value.trim()) {
        return undefined;
    }

    let color: NativeColorValue | undefined;
    for (const layer of splitNativeBackgroundLayers(value)) {
        color = parseNativeBackgroundLayerMetadata(layer, currentColor)?.color ?? color;
    }

    return color;
}

function resolveNativeBackgroundShorthandLayers(
    value: NativePropValue | undefined,
    currentColor: NativeColorValue,
): NativeBackgroundLayerMetadata[] {
    if (typeof value !== 'string' || !value.trim()) {
        return [];
    }

    return splitNativeBackgroundLayers(value)
        .map((layer) => parseNativeBackgroundLayerMetadata(layer, currentColor))
        .filter((layer): layer is NativeBackgroundLayerMetadata => Boolean(layer));
}

function pickNativeBackgroundLayerValue(layers: string[], index: number): string | undefined {
    if (layers.length === 0) {
        return undefined;
    }

    return layers[index % layers.length];
}

function resolveNativeBackgroundRepeatValue(value: string | undefined): NativeBackgroundRepeat {
    return normalizeNativeBackgroundRepeat(value) ?? 'no-repeat';
}

function resolveNativeBackgroundImageFitValue(rawSize: string | undefined, repeat: NativeBackgroundRepeat): NativeVideoPosterFit {
    const normalizedSize = normalizeNativeBackgroundSizeValue(rawSize) ?? '';

    switch (normalizedSize) {
        case 'contain':
        case 'cover':
        case 'fill':
        case 'none':
        case 'scale-down':
            return normalizedSize;
        case '100% 100%':
            return 'fill';
        case 'auto':
        case 'auto auto':
            return repeat !== 'no-repeat' ? 'none' : 'cover';
        default:
            return repeat !== 'no-repeat' ? 'none' : 'cover';
    }
}

function resolveNativeBackgroundImagePositionValue(rawPosition: string | undefined): NativeVideoPosterPosition {
    const normalizedPosition = normalizeNativeBackgroundPositionValue(rawPosition);
    if (!normalizedPosition) {
        return 'center';
    }

    const tokens = normalizedPosition.split(/\s+/)
        .map(normalizeNativePositionToken)
        .filter((value): value is 'leading' | 'center' | 'trailing' | 'top' | 'bottom' => Boolean(value));
    if (tokens.length === 0) {
        return 'center';
    }

    let horizontal: 'leading' | 'center' | 'trailing' = 'center';
    let vertical: 'top' | 'center' | 'bottom' = 'center';

    for (const token of tokens) {
        if (token === 'leading' || token === 'trailing') {
            horizontal = token;
        } else if (token === 'top' || token === 'bottom') {
            vertical = token;
        } else if (tokens.length === 1) {
            horizontal = 'center';
            vertical = 'center';
        }
    }

    if (horizontal === 'center' && vertical === 'center') {
        return 'center';
    }

    if (horizontal === 'center') {
        return vertical;
    }

    if (vertical === 'center') {
        return horizontal;
    }

    return `${vertical}-${horizontal}` as NativeVideoPosterPosition;
}

function resolveNativeBackgroundLayersFromStyle(
    style: Record<string, NativePropValue> | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): NativeBackgroundLayerSpec[] {
    if (!style) {
        return [];
    }

    const currentColor = resolveStyleCurrentColor(style);
    const layers: NativeBackgroundLayerSpec[] = [];

    if (typeof style.backgroundImage === 'string' && style.backgroundImage.trim()) {
        const repeatLayers = splitNativeBackgroundLayers(style.backgroundRepeat);
        const sizeLayers = splitNativeBackgroundLayers(style.backgroundSize);
        const positionLayers = splitNativeBackgroundLayers(style.backgroundPosition);

        splitNativeBackgroundLayers(style.backgroundImage).forEach((entry, index) => {
            const source = extractCssUrlValue(entry);
            if (!source) {
                const gradient = parseLinearGradient(entry, currentColor);
                if (gradient) {
                    layers.push({ kind: 'gradient', gradient });
                }
                return;
            }

            const repeat = resolveNativeBackgroundRepeatValue(pickNativeBackgroundLayerValue(repeatLayers, index));
            const size = pickNativeBackgroundLayerValue(sizeLayers, index);
            const position = pickNativeBackgroundLayerValue(positionLayers, index);

            layers.push({
                kind: 'image',
                source,
                fit: resolveNativeBackgroundImageFitValue(size, repeat),
                position: resolveNativeBackgroundImagePositionValue(position),
                repeat,
            });
        });
    } else {
        for (const layer of resolveNativeBackgroundShorthandLayers(style.background, currentColor)) {
            if (layer.source) {
                const repeat = resolveNativeBackgroundRepeatValue(layer.repeat);
                layers.push({
                    kind: 'image',
                    source: layer.source,
                    fit: resolveNativeBackgroundImageFitValue(layer.size, repeat),
                    position: resolveNativeBackgroundImagePositionValue(layer.position),
                    repeat,
                });
                continue;
            }

            if (layer.gradient) {
                layers.push({ kind: 'gradient', gradient: layer.gradient });
            }
        }
    }

    let explicitBackgroundColor: NativeColorValue | undefined;
    if (style.backgroundColor !== undefined) {
        const styleWithoutBackground = { ...style };
        delete styleWithoutBackground.background;
        explicitBackgroundColor = resolveBackgroundColor(styleWithoutBackground, styleResolveOptions);
    }
    const shouldReadBackgroundColorFallback = typeof style.background === 'string'
        && (!style.backgroundImage
            || (!/url\(/i.test(style.background) && !/linear-gradient\(/i.test(style.background) && !style.background.includes(',')));
    const shorthandBackgroundColor = shouldReadBackgroundColorFallback
        ? resolveNativeBackgroundColorLayer(resolveNativeBackgroundShorthandColor(style.background, currentColor), style, styleResolveOptions)
        : undefined;
    const backgroundColor = explicitBackgroundColor ?? shorthandBackgroundColor;

    if (backgroundColor) {
        layers.push({ kind: 'color', color: backgroundColor });
    }

    return layers;
}

function resolveNativeBackgroundLayers(
    node: NativeElementNode,
    resolvedStyles: NativeResolvedStyleMap | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
): NativeBackgroundLayerSpec[] {
    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
    return resolveNativeBackgroundLayersFromStyle(style, styleResolveOptions);
}

function stripNativeBackgroundPaintStyles(style: Record<string, NativePropValue> | undefined): Record<string, NativePropValue> | undefined {
    if (!style) {
        return undefined;
    }

    const nextStyle = { ...style };
    delete nextStyle.background;
    delete nextStyle.backgroundColor;
    delete nextStyle.backgroundImage;
    delete nextStyle.backgroundRepeat;
    delete nextStyle.backgroundPosition;
    delete nextStyle.backgroundSize;
    return nextStyle;
}

function shouldNativePlayInline(node: NativeElementNode): boolean {
    return node.sourceTag === 'video' && (
        toNativeBoolean(node.props.playsInline)
        || toNativeBoolean(node.props.playsinline)
    );
}

function resolveNativeExplicitAccessibilityLabel(node: NativeElementNode): string | undefined {
    const explicitLabel = typeof node.props['aria-label'] === 'string' && node.props['aria-label'].trim()
        ? node.props['aria-label'].trim()
        : typeof node.props.title === 'string' && node.props.title.trim()
            ? node.props.title.trim()
            : undefined;

    if (explicitLabel) {
        return explicitLabel;
    }

    if (typeof node.props.alt === 'string' && node.props.alt.trim()) {
        return node.props.alt.trim();
    }

    return undefined;
}

function resolveNativeAccessibilityLabel(node: NativeElementNode): string | undefined {
    const explicitLabel = resolveNativeExplicitAccessibilityLabel(node);

    if (explicitLabel) {
        return explicitLabel;
    }

    if (node.component === 'Picker') {
        if (typeof node.props.placeholder === 'string' && node.props.placeholder.trim()) {
            return node.props.placeholder.trim();
        }

        return isNativeMultiple(node) ? 'Selection list' : 'Select';
    }

    const textContent = flattenTextContent(node.children).trim();
    if (textContent) {
        return textContent;
    }

    if (typeof node.props.placeholder === 'string' && node.props.placeholder.trim()) {
        return node.props.placeholder.trim();
    }

    if (node.component === 'Media') {
        return resolveNativeMediaLabel(node);
    }

    if (node.component === 'WebView') {
        return 'Web content';
    }

    return undefined;
}

function resolveNativeAccessibilityHint(node: NativeElementNode): string | undefined {
    const parts: string[] = [];

    if (typeof node.props['aria-description'] === 'string' && node.props['aria-description'].trim()) {
        parts.push(node.props['aria-description'].trim());
    }

    const linkHint = resolveNativeLinkHint(node);
    if (linkHint) {
        parts.push(linkHint);
    }

    return parts.length > 0 ? parts.join(', ') : undefined;
}

function resolveNativeAccessibilityRole(node: NativeElementNode): 'button' | 'link' | 'checkbox' | 'switch' | 'tab' | 'image' | 'heading' | undefined {
    const explicitRole = typeof node.props.role === 'string'
        ? node.props.role.trim().toLowerCase()
        : undefined;

    switch (explicitRole) {
        case 'button':
        case 'link':
        case 'checkbox':
        case 'switch':
        case 'tab':
        case 'image':
        case 'heading':
            return explicitRole;
        case 'img':
            return 'image';
        default:
            break;
    }

    return undefined;
}

function hasExplicitNativeAccessibilitySignal(node: NativeElementNode): boolean {
    return Boolean(
        resolveNativeExplicitAccessibilityLabel(node)
        || resolveNativeAccessibilityHint(node)
        || resolveNativeLinkHint(node)
        || (typeof node.props.role === 'string' && node.props.role.trim())
        || node.props['aria-selected'] !== undefined
        || node.props['aria-checked'] !== undefined
        || node.props['aria-pressed'] !== undefined
        || node.props['aria-disabled'] !== undefined
        || node.props['aria-expanded'] !== undefined
        || node.props['aria-invalid'] !== undefined
        || node.props['aria-current'] !== undefined
        || node.props['aria-valuetext'] !== undefined
        || node.props['aria-required'] !== undefined
        || toNativeBoolean(node.props.required)
        || isNativeMultiple(node)
    );
}

function shouldEmitNativeAccessibilityLabel(node: NativeElementNode): boolean {
    return hasExplicitNativeAccessibilitySignal(node);
}

function resolveNativeAccessibilityStateParts(node: NativeElementNode): string[] {
    const parts: string[] = [];
    const role = resolveNativeAccessibilityRole(node);
    const hasSelectedState = node.props['aria-selected'] !== undefined || typeof node.props['aria-current'] === 'string' || role === 'tab';
    const hasCheckedState = node.component === 'Toggle' || node.props['aria-checked'] !== undefined || role === 'checkbox' || role === 'switch';
    const hasPressedState = hasNativePressedAccessibilityState(node);

    if (isNativeRequired(node)) {
        parts.push('Required');
    }

    if (isNativeInvalid(node)) {
        parts.push('Invalid');
    }

    if (!isNativeInvalid(node) && hasNativeValidationConstraint(node) && isNativeValid(node)) {
        parts.push('Valid');
    }

    if (isNativeDisabled(node)) {
        parts.push('Disabled');
    }

    if (hasSelectedState) {
        parts.push(isNativeSelected(node) ? 'Selected' : 'Not selected');
    }

    if (hasCheckedState) {
        parts.push(isNativeChecked(node) ? 'Checked' : 'Unchecked');
    }

    if (hasPressedState) {
        parts.push(isNativePressed(node) ? 'Pressed' : 'Not pressed');
    }

    if (node.props['aria-expanded'] !== undefined) {
        parts.push(toNativeBoolean(node.props['aria-expanded']) ? 'Expanded' : 'Collapsed');
    }

    if (typeof node.props['aria-valuetext'] === 'string' && node.props['aria-valuetext'].trim()) {
        parts.push(node.props['aria-valuetext'].trim());
    }

    return [...new Set(parts)];
}

function resolveComposeAccessibilityRoleExpression(node: NativeElementNode): string | undefined {
    switch (resolveNativeAccessibilityRole(node)) {
        case 'button':
        case 'link':
            return 'Role.Button';
        case 'checkbox':
            return 'Role.Checkbox';
        case 'switch':
            return 'Role.Switch';
        case 'tab':
            return 'Role.Tab';
        case 'image':
            return 'Role.Image';
        default:
            return undefined;
    }
}

function buildComposeAccessibilityModifier(node: NativeElementNode): string | undefined {
    if (!hasExplicitNativeAccessibilitySignal(node)) {
        return undefined;
    }

    const statements: string[] = [];
    const label = shouldEmitNativeAccessibilityLabel(node) ? resolveNativeAccessibilityLabel(node) : undefined;
    const hint = resolveNativeAccessibilityHint(node);
    const stateParts = resolveNativeAccessibilityStateParts(node);
    const stateDescription = [hint, ...stateParts].filter((value): value is string => Boolean(value)).join(', ');
    const roleExpression = resolveComposeAccessibilityRoleExpression(node);
    const role = resolveNativeAccessibilityRole(node);

    if (label) {
        statements.push(`contentDescription = ${quoteKotlinString(label)}`);
    }

    if (roleExpression) {
        statements.push(`role = ${roleExpression}`);
    }

    if ((node.props['aria-selected'] !== undefined || typeof node.props['aria-current'] === 'string' || role === 'tab') && isNativeSelected(node)) {
        statements.push('selected = true');
    }

    if (stateDescription) {
        statements.push(`stateDescription = ${quoteKotlinString(stateDescription)}`);
    }

    if (role === 'heading') {
        statements.push('heading()');
    }

    if (node.props['aria-disabled'] !== undefined) {
        statements.push('disabled()');
    }

    return statements.length > 0
        ? `semantics(mergeDescendants = true) { ${statements.join('; ')} }`
        : undefined;
}

function buildSwiftAccessibilityModifiers(node: NativeElementNode): string[] {
    if (!hasExplicitNativeAccessibilitySignal(node)) {
        return [];
    }

    const modifiers: string[] = [];
    const label = shouldEmitNativeAccessibilityLabel(node) ? resolveNativeAccessibilityLabel(node) : undefined;
    const hint = resolveNativeAccessibilityHint(node);
    const value = resolveNativeAccessibilityStateParts(node).join(', ');
    const role = resolveNativeAccessibilityRole(node);

    if (label) {
        modifiers.push(`.accessibilityLabel(${quoteSwiftString(label)})`);
    }

    if (hint) {
        modifiers.push(`.accessibilityHint(${quoteSwiftString(hint)})`);
    }

    if (value) {
        modifiers.push(`.accessibilityValue(${quoteSwiftString(value)})`);
    }

    if (role === 'button') {
        modifiers.push('.accessibilityAddTraits(.isButton)');
    } else if (role === 'link') {
        modifiers.push('.accessibilityAddTraits(.isLink)');
    } else if (role === 'image') {
        modifiers.push('.accessibilityAddTraits(.isImage)');
    } else if (role === 'heading') {
        modifiers.push('.accessibilityAddTraits(.isHeader)');
    }

    if ((node.props['aria-selected'] !== undefined || typeof node.props['aria-current'] === 'string' || role === 'tab') && isNativeSelected(node)) {
        modifiers.push('.accessibilityAddTraits(.isSelected)');
    }

    return modifiers;
}

function resolveNativeTextInputType(node: NativeElementNode): 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search' | 'textarea' {
    const inputType = resolveNativeInputTypeValue(node.sourceTag, node.props);

    switch (inputType) {
        case 'password':
        case 'email':
        case 'number':
        case 'tel':
        case 'url':
        case 'search':
            return inputType;
        default:
            return 'text';
    }
}

function resolveNativeRangeMin(node: NativeElementNode): number {
    return resolveNativeNumericConstraint(node.props.min) ?? 0;
}

function resolveNativeRangeMax(node: NativeElementNode): number {
    const min = resolveNativeRangeMin(node);
    const max = resolveNativeNumericConstraint(node.props.max);
    return max !== undefined && max > min ? max : min + 100;
}

function resolveNativeRangeInitialValue(node: NativeElementNode): number {
    const min = resolveNativeRangeMin(node);
    const max = resolveNativeRangeMax(node);
    const value = resolveNativeNumericConstraint(node.props.value);
    const candidate = value !== undefined ? value : min;
    return Math.min(max, Math.max(min, candidate));
}

function resolveComposeSliderSteps(node: NativeElementNode): number | undefined {
    const step = resolveNativeStepConstraint(node);
    if (step === undefined) {
        return undefined;
    }

    const intervals = (resolveNativeRangeMax(node) - resolveNativeRangeMin(node)) / step;
    if (!Number.isFinite(intervals)) {
        return undefined;
    }

    const roundedIntervals = Math.round(intervals);
    if (roundedIntervals < 1 || Math.abs(intervals - roundedIntervals) > 1e-7) {
        return undefined;
    }

    return Math.max(0, roundedIntervals - 1);
}

function resolveComposeKeyboardType(node: NativeElementNode): string | undefined {
    switch (resolveNativeTextInputType(node)) {
        case 'email':
            return 'androidx.compose.ui.text.input.KeyboardType.Email';
        case 'number':
            return 'androidx.compose.ui.text.input.KeyboardType.Decimal';
        case 'password':
            return 'androidx.compose.ui.text.input.KeyboardType.Password';
        case 'tel':
            return 'androidx.compose.ui.text.input.KeyboardType.Phone';
        case 'url':
            return 'androidx.compose.ui.text.input.KeyboardType.Uri';
        case 'search':
            return 'androidx.compose.ui.text.input.KeyboardType.Text';
        default:
            return undefined;
    }
}

function resolveSwiftKeyboardTypeModifier(node: NativeElementNode): string | undefined {
    switch (resolveNativeTextInputType(node)) {
        case 'email':
            return '.keyboardType(.emailAddress)';
        case 'number':
            return '.keyboardType(.decimalPad)';
        case 'tel':
            return '.keyboardType(.phonePad)';
        case 'url':
            return '.keyboardType(.URL)';
        case 'search':
            return '.keyboardType(.webSearch)';
        default:
            return undefined;
    }
}

function shouldDisableNativeTextCapitalization(node: NativeElementNode): boolean {
    const inputType = resolveNativeTextInputType(node);
    return inputType === 'email' || inputType === 'password' || inputType === 'url';
}

function serializeNativePayload(value: NativePropValue | undefined): string | undefined {
    if (value === undefined) return undefined;
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
}

function resolveNativeAction(node: NativeElementNode): string | undefined {
    return typeof node.props.nativeAction === 'string' && node.props.nativeAction.trim()
        ? node.props.nativeAction
        : undefined;
}

function resolveNativeRoute(node: NativeElementNode): string | undefined {
    if (typeof node.props.nativeRoute === 'string' && node.props.nativeRoute.trim()) {
        return node.props.nativeRoute;
    }

    const destination = typeof node.props.destination === 'string' ? node.props.destination : undefined;
    if (destination && !isExternalDestination(destination)) {
        return destination;
    }

    return undefined;
}

function buildComposeBridgeInvocation(action?: string, route?: string, payloadJson?: string): string | undefined {
    const args: string[] = [];

    if (action) args.push(`action = ${quoteKotlinString(action)}`);
    if (route) args.push(`route = ${quoteKotlinString(route)}`);
    if (payloadJson) args.push(`payloadJson = ${quoteKotlinString(payloadJson)}`);

    return args.length > 0 ? `ElitNativeBridge.dispatch(${args.join(', ')})` : undefined;
}

function buildSwiftBridgeInvocation(action?: string, route?: string, payloadJson?: string): string | undefined {
    const args: string[] = [];

    if (action) args.push(`action: ${quoteSwiftString(action)}`);
    if (route) args.push(`route: ${quoteSwiftString(route)}`);
    if (payloadJson) args.push(`payloadJson: ${quoteSwiftString(payloadJson)}`);

    return args.length > 0 ? `ElitNativeBridge.dispatch(${args.join(', ')})` : undefined;
}

function resolveNativeControlEventInputType(node: NativeElementNode): string | undefined {
    if (node.component === 'Picker') {
        return isNativeMultiple(node) ? 'select-multiple' : 'select-one';
    }

    if (node.component === 'Toggle') {
        return typeof node.props.type === 'string' && node.props.type.trim()
            ? node.props.type.trim().toLowerCase()
            : 'checkbox';
    }

    if (node.component === 'Slider') {
        return 'range';
    }

    return resolveNativeInputTypeValue(node.sourceTag, node.props);
}

function shouldDispatchNativeControlEvent(node: NativeElementNode, eventName: 'input' | 'change' | 'submit'): boolean {
    if (!node.events.includes(eventName)) {
        return false;
    }

    return !(eventName === 'input' && getNativeBindingReference(node) && node.events.every((candidate) => candidate === 'input'));
}

function resolveNativeControlEventAction(node: NativeElementNode, eventName: 'input' | 'change' | 'submit'): string {
    return resolveNativeAction(node) ?? `elit.event.${eventName}`;
}

function buildComposeControlEventPayloadInvocation(
    node: NativeElementNode,
    eventName: 'input' | 'change' | 'submit',
    options: NativeControlEventExpressionOptions = {},
): string {
    const args = [
        `event = ${quoteKotlinString(eventName)}`,
        `sourceTag = ${quoteKotlinString(node.sourceTag)}`,
    ];
    const inputType = resolveNativeControlEventInputType(node);
    const detailJson = serializeNativePayload(node.props.nativePayload);

    if (inputType) {
        args.push(`inputType = ${quoteKotlinString(inputType)}`);
    }
    if (options.valueExpression) {
        args.push(`value = ${options.valueExpression}`);
    }
    if (options.valuesExpression) {
        args.push(`values = ${options.valuesExpression}`);
    }
    if (options.checkedExpression) {
        args.push(`checked = ${options.checkedExpression}`);
    }
    if (detailJson) {
        args.push(`detailJson = ${quoteKotlinString(detailJson)}`);
    }

    return `ElitNativeBridge.controlEventPayload(${args.join(', ')})`;
}

function buildComposeControlEventDispatchInvocation(
    node: NativeElementNode,
    eventName: 'input' | 'change' | 'submit',
    options: NativeControlEventExpressionOptions = {},
): string {
    return `ElitNativeBridge.dispatch(action = ${quoteKotlinString(resolveNativeControlEventAction(node, eventName))}, payloadJson = ${buildComposeControlEventPayloadInvocation(node, eventName, options)})`;
}

function buildComposeControlEventDispatchStatements(
    node: NativeElementNode,
    options: NativeControlEventExpressionOptions = {},
): string[] {
    const statements: string[] = [];
    if (shouldDispatchNativeControlEvent(node, 'input')) {
        statements.push(buildComposeControlEventDispatchInvocation(node, 'input', options));
    }
    if (shouldDispatchNativeControlEvent(node, 'change')) {
        statements.push(buildComposeControlEventDispatchInvocation(node, 'change', options));
    }
    return statements;
}

function buildSwiftControlEventPayloadInvocation(
    node: NativeElementNode,
    eventName: 'input' | 'change' | 'submit',
    options: NativeControlEventExpressionOptions = {},
): string {
    const args = [
        `event: ${quoteSwiftString(eventName)}`,
        `sourceTag: ${quoteSwiftString(node.sourceTag)}`,
    ];
    const inputType = resolveNativeControlEventInputType(node);
    const detailJson = serializeNativePayload(node.props.nativePayload);

    if (inputType) {
        args.push(`inputType: ${quoteSwiftString(inputType)}`);
    }
    if (options.valueExpression) {
        args.push(`value: ${options.valueExpression}`);
    }
    if (options.valuesExpression) {
        args.push(`values: ${options.valuesExpression}`);
    }
    if (options.checkedExpression) {
        args.push(`checked: ${options.checkedExpression}`);
    }
    if (detailJson) {
        args.push(`detailJson: ${quoteSwiftString(detailJson)}`);
    }

    return `ElitNativeBridge.controlEventPayload(${args.join(', ')})`;
}

function buildSwiftControlEventDispatchInvocation(
    node: NativeElementNode,
    eventName: 'input' | 'change' | 'submit',
    options: NativeControlEventExpressionOptions = {},
): string {
    return `ElitNativeBridge.dispatch(action: ${quoteSwiftString(resolveNativeControlEventAction(node, eventName))}, payloadJson: ${buildSwiftControlEventPayloadInvocation(node, eventName, options)})`;
}

function buildSwiftControlEventDispatchStatements(
    node: NativeElementNode,
    options: NativeControlEventExpressionOptions = {},
): string[] {
    const statements: string[] = [];
    if (shouldDispatchNativeControlEvent(node, 'input')) {
        statements.push(buildSwiftControlEventDispatchInvocation(node, 'input', options));
    }
    if (shouldDispatchNativeControlEvent(node, 'change')) {
        statements.push(buildSwiftControlEventDispatchInvocation(node, 'change', options));
    }
    return statements;
}

function wrapTextNodeIfNeeded(node: NativeNode, parentComponent: string, options: Required<Omit<NativeTransformOptions, 'tagMap'>>): NativeNode {
    if (!options.wrapTextNodes || node.kind !== 'text') {
        return node;
    }

    if (TEXT_CONTAINER_COMPONENTS.has(parentComponent)) {
        return node;
    }

    return {
        kind: 'element',
        component: 'Text',
        sourceTag: '#text',
        props: {},
        events: [],
        children: [node],
    };
}

function toNativeNodes(
    child: Child,
    options: Required<Omit<NativeTransformOptions, 'tagMap'>> & { tagMap: Record<string, string> },
    parentComponent: string,
    stateContext: NativeTransformContext,
): NativeNode[] {
    if (child == null || child === false) return [];

    if (isStateLike(child)) {
        const descriptor = ensureNativeStateDescriptor(stateContext, child);
        if (isPrimitiveNativeStateValue(child.value)) {
            const textNode: NativeTextNode = {
                kind: 'text',
                value: String(child.value ?? ''),
                stateId: descriptor.id,
            };
            return [wrapTextNodeIfNeeded(textNode, parentComponent, options)];
        }

        return toNativeNodes(child.value as Child, options, parentComponent, stateContext);
    }

    if (Array.isArray(child)) {
        const nodes: NativeNode[] = [];
        for (const item of child) {
            const converted = toNativeNodes(item, options, parentComponent, stateContext);
            for (const node of converted) {
                nodes.push(wrapTextNodeIfNeeded(node, parentComponent, options));
            }
        }
        return nodes;
    }

    if (!isVNode(child)) {
        const textNode: NativeTextNode = { kind: 'text', value: String(child) };
        return [wrapTextNodeIfNeeded(textNode, parentComponent, options)];
    }

    if (!child.tagName) {
        const fragmentChildren: NativeNode[] = [];
        for (const item of child.children) {
            const converted = toNativeNodes(item, options, parentComponent, stateContext);
            for (const node of converted) {
                fragmentChildren.push(wrapTextNodeIfNeeded(node, parentComponent, options));
            }
        }
        return fragmentChildren;
    }

    if (TRANSPARENT_NATIVE_TAGS.has(child.tagName)) {
        const transparentChildren: NativeNode[] = [];
        for (const item of child.children) {
            const converted = toNativeNodes(item, options, parentComponent, stateContext);
            for (const node of converted) {
                transparentChildren.push(wrapTextNodeIfNeeded(node, parentComponent, options));
            }
        }
        return transparentChildren;
    }

    if (child.tagName === 'br') {
        return [wrapTextNodeIfNeeded({ kind: 'text', value: '\n' }, parentComponent, options)];
    }

    if (NON_RENDERING_NATIVE_TAGS.has(child.tagName)) {
        return [];
    }

    const component = resolveComponent(child.tagName, options);
    const childNodes: NativeNode[] = [];
    for (const item of child.children) {
        childNodes.push(...toNativeNodes(item, options, component, stateContext));
    }

    const { props, events } = normalizeProps(component, child.props, stateContext);
    const resolvedComponent = isCheckboxInput(child.tagName, props)
        ? 'Toggle'
        : isRangeInput(child.tagName, props)
            ? 'Slider'
            : component;

    if (resolvedComponent === 'Toggle' && isCheckboxInput(child.tagName, props)) {
        delete props.type;
    }

        const nativeNode: NativeElementNode = {
        kind: 'element',
        component: resolvedComponent,
        sourceTag: child.tagName,
        props,
        events,
        children: childNodes,
        };

        if (options.platform === 'generic') {
            attachDesktopNativeMetadata(nativeNode);
        }

        return [nativeNode];
}

export function renderNativeTree(input: Child, options: NativeTransformOptions = {}): NativeTree {
    const resolvedOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
        tagMap: options.tagMap ?? {},
    };

    const stateContext = createNativeTransformContext();
    const roots = toNativeNodes(input, resolvedOptions, '__root__', stateContext);
    return {
        platform: resolvedOptions.platform,
        roots,
        stateDescriptors: [...stateContext.stateDescriptors.values()],
    };
}

export function renderNativeJson(input: Child, options: NativeTransformOptions = {}): string {
    return JSON.stringify(renderNativeTree(input, options), null, 2);
}

const DESKTOP_RUNTIME_PSEUDO_VARIANTS: ReadonlyArray<readonly [string, string[]]> = [
    ['enabled', ['enabled']],
    ['readWrite', ['read-write']],
    ['readOnly', ['read-only']],
    ['placeholderShown', ['placeholder-shown']],
    ['valid', ['valid']],
    ['invalid', ['invalid']],
    ['checked', ['checked']],
    ['selected', ['selected']],
    ['hover', ['hover']],
    ['focusWithin', ['focus-within']],
    ['focus', ['focus', 'focus-visible']],
    ['active', ['active']],
    ['disabled', ['disabled']],
];

function isNativePropObject(value: NativePropValue | undefined): value is NativePropObject {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function nativePropValuesEqual(left: NativePropValue | undefined, right: NativePropValue | undefined): boolean {
    if (left === right) {
        return true;
    }

    if (Array.isArray(left) || Array.isArray(right)) {
        if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
            return false;
        }

        return left.every((value, index) => nativePropValuesEqual(value, right[index]));
    }

    if (isNativePropObject(left) && isNativePropObject(right)) {
        const leftKeys = Object.keys(left);
        const rightKeys = Object.keys(right);
        if (leftKeys.length !== rightKeys.length) {
            return false;
        }

        return leftKeys.every((key) => nativePropValuesEqual(left[key], right[key]));
    }

    return false;
}

function diffNativeStyleVariant(
    baseStyle: Record<string, NativePropValue> | undefined,
    variantStyle: Record<string, NativePropValue> | undefined,
): NativePropObject | undefined {
    if (!variantStyle) {
        return undefined;
    }

    const diff: NativePropObject = {};
    for (const [key, value] of Object.entries(variantStyle)) {
        if (!nativePropValuesEqual(baseStyle?.[key], value)) {
            diff[key] = value;
        }
    }

    return Object.keys(diff).length > 0 ? diff : undefined;
}

function buildDesktopNativeStyleVariants(
    node: NativeElementNode,
    baseStyle: Record<string, NativePropValue> | undefined,
    styleContexts: NativeStyleContextMap,
    styleResolveOptions: NativeStyleResolveOptions,
): NativePropObject | undefined {
    const variants: NativePropObject = {};

    for (const [variantName, pseudoStates] of DESKTOP_RUNTIME_PSEUDO_VARIANTS) {
        const resolvedVariant = resolveNativePseudoStateVariantStyle(node, styleContexts, styleResolveOptions, [...pseudoStates]);
        const diff = diffNativeStyleVariant(baseStyle, resolvedVariant);
        if (diff) {
            variants[variantName] = diff;
        }
    }

    return Object.keys(variants).length > 0 ? variants : undefined;
}

function cloneNativeNodeWithMaterializedStyle(
    node: NativeNode,
    resolvedStyles: NativeResolvedStyleMap,
    styleContexts: NativeStyleContextMap,
    styleResolveOptions: NativeStyleResolveOptions,
    platform: NativePlatform,
): NativeNode {
    if (node.kind === 'text') {
        return { ...node };
    }

    const resolvedStyle = resolvedStyles.get(node);
    const desktopStyleVariants = platform === 'generic'
        ? buildDesktopNativeStyleVariants(node, resolvedStyle, styleContexts, styleResolveOptions)
        : undefined;
    return {
        ...node,
        props: {
            ...node.props,
            ...(resolvedStyle ? { style: resolvedStyle } : {}),
            ...(desktopStyleVariants ? { desktopStyleVariants } : {}),
        },
        children: node.children.map((child) => cloneNativeNodeWithMaterializedStyle(child, resolvedStyles, styleContexts, styleResolveOptions, platform)),
    };
}

export function materializeNativeTree(tree: NativeTree, styleResolveOptions = getNativeStyleResolveOptions(tree.platform)): NativeTree {
    const { resolvedStyles, styleContexts } = buildRootResolvedStyleData(tree.roots, styleResolveOptions);

    return {
        ...tree,
        roots: tree.roots.map((node) => cloneNativeNodeWithMaterializedStyle(node, resolvedStyles, styleContexts, styleResolveOptions, tree.platform)),
    };
}

export function renderMaterializedNativeTree(input: Child, options: NativeTransformOptions = {}): NativeTree {
    return materializeNativeTree(renderNativeTree(input, options));
}

export function renderMaterializedNativeJson(input: Child, options: NativeTransformOptions = {}): string {
    return JSON.stringify(renderMaterializedNativeTree(input, options), null, 2);
}

function indent(level: number): string {
    return '    '.repeat(level);
}

function escapeKotlinString(value: string): string {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\$/g, '\\$')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}

function quoteKotlinString(value: string): string {
    return `"${escapeKotlinString(value)}"`;
}

function escapeSwiftString(value: string): string {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}

function quoteSwiftString(value: string): string {
    return `"${escapeSwiftString(value)}"`;
}

function flattenTextContent(nodes: NativeNode[]): string {
    const parts: string[] = [];

    const walk = (items: NativeNode[]): void => {
        for (const item of items) {
            if (item.kind === 'text') {
                parts.push(item.value);
                continue;
            }

            walk(item.children);
        }
    };

    walk(nodes);
    return parts.join('').trim();
}

function splitCssFunctionArguments(value: string): string[] {
    const args: string[] = [];
    let token = '';
    let depth = 0;

    for (const char of value.trim()) {
        if (char === '(') {
            depth += 1;
        } else if (char === ')' && depth > 0) {
            depth -= 1;
        }

        if (char === ',' && depth === 0) {
            const trimmed = token.trim();
            if (trimmed) {
                args.push(trimmed);
            }
            token = '';
            continue;
        }

        token += char;
    }

    const trailing = token.trim();
    if (trailing) {
        args.push(trailing);
    }

    return args;
}

function evaluateCssLengthExpression(value: string, styleResolveOptions: NativeStyleResolveOptions): number | undefined {
    let total = 0;
    let token = '';
    let depth = 0;
    let operator: 1 | -1 = 1;
    let hasValue = false;
    let invalid = false;

    const flushToken = (): void => {
        const trimmed = token.trim();
        token = '';

        if (!trimmed) {
            return;
        }

        const resolved = toScaledUnitNumber(trimmed, styleResolveOptions);
        if (resolved === undefined) {
            invalid = true;
            return;
        }

        total += operator * resolved;
        hasValue = true;
    };

    for (const char of value.trim()) {
        if (char === '(') {
            depth += 1;
        } else if (char === ')' && depth > 0) {
            depth -= 1;
        }

        if (depth === 0 && (char === '+' || char === '-')) {
            if (token.trim().length === 0) {
                token += char;
                continue;
            }

            flushToken();
            operator = char === '+' ? 1 : -1;
            continue;
        }

        token += char;
    }

    flushToken();
    return invalid || !hasValue ? undefined : total;
}

function toDpLiteral(
    value: NativePropValue | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string | undefined {
    const resolved = toScaledUnitNumber(value, styleResolveOptions);
    return resolved !== undefined ? `${formatFloat(resolved)}.dp` : undefined;
}

function toPointLiteral(
    value: NativePropValue | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string | undefined {
    const resolved = toScaledUnitNumber(value, styleResolveOptions);
    return resolved !== undefined ? formatFloat(resolved) : undefined;
}

function toSpLiteral(
    value: NativePropValue | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string | undefined {
    const resolved = toScaledUnitNumber(value, styleResolveOptions);
    return resolved !== undefined ? `${formatFloat(resolved)}.sp` : undefined;
}

function parsePlainNumericValue(value: NativePropValue | undefined): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) {
        return undefined;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function parseNativeSvgNumber(value: NativePropValue | undefined): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    const match = trimmed.match(/^(-?(?:\d+\.?\d*|\.\d+))(?:px)?$/i);
    if (!match) {
        return undefined;
    }

    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function parseFlexShorthand(value: NativePropValue | undefined): NativeFlexStyleValues | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return { grow: value, shrink: 1, basis: 0 };
    }

    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return undefined;
    }

    const normalized = trimmed.toLowerCase();
    if (normalized === 'none') {
        return { grow: 0, shrink: 0, basis: 'auto' };
    }

    if (normalized === 'auto') {
        return { grow: 1, shrink: 1, basis: 'auto' };
    }

    if (normalized === 'initial') {
        return { grow: 0, shrink: 1, basis: 'auto' };
    }

    const numericValue = parsePlainNumericValue(trimmed);
    if (numericValue !== undefined) {
        return { grow: numericValue, shrink: 1, basis: 0 };
    }

    const tokens = trimmed.split(/\s+/).filter(Boolean);
    if (tokens.length === 1) {
        return { grow: 1, shrink: 1, basis: tokens[0] };
    }

    if (tokens.length === 2) {
        const grow = parsePlainNumericValue(tokens[0]);
        if (grow === undefined) {
            return undefined;
        }

        const shrink = parsePlainNumericValue(tokens[1]);
        return shrink !== undefined
            ? { grow, shrink, basis: 0 }
            : { grow, shrink: 1, basis: tokens[1] };
    }

    if (tokens.length === 3) {
        const grow = parsePlainNumericValue(tokens[0]);
        const shrink = parsePlainNumericValue(tokens[1]);
        if (grow === undefined || shrink === undefined) {
            return undefined;
        }

        return { grow, shrink, basis: tokens[2] };
    }

    return undefined;
}

function resolveFlexStyleValues(style: Record<string, NativePropValue> | undefined): NativeFlexStyleValues {
    const shorthand = parseFlexShorthand(style?.flex);
    return {
        grow: parsePlainNumericValue(style?.flexGrow) ?? shorthand?.grow,
        shrink: parsePlainNumericValue(style?.flexShrink) ?? shorthand?.shrink,
        basis: style?.flexBasis ?? shorthand?.basis,
    };
}

function resolveOpacityValue(value: NativePropValue | undefined): number | undefined {
    const opacity = parsePlainNumericValue(value);
    if (opacity === undefined) {
        return undefined;
    }

    return Math.min(1, Math.max(0, opacity));
}

function resolveAspectRatioValue(value: NativePropValue | undefined): number | undefined {
    const direct = parsePlainNumericValue(value);
    if (direct !== undefined) {
        return direct > 0 ? direct : undefined;
    }

    if (typeof value !== 'string') {
        return undefined;
    }

    const ratioMatch = value.trim().match(/^(-?(?:\d+\.?\d*|\.\d+))\s*\/\s*(-?(?:\d+\.?\d*|\.\d+))$/);
    if (!ratioMatch) {
        return undefined;
    }

    const numerator = Number(ratioMatch[1]);
    const denominator = Number(ratioMatch[2]);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
        return undefined;
    }

    const ratio = numerator / denominator;
    return ratio > 0 ? ratio : undefined;
}

function parsePercentageValue(value: NativePropValue | undefined): number | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const match = value.trim().match(/^(-?(?:\d+\.?\d*|\.\d+))%$/);
    if (!match) {
        return undefined;
    }

    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function resolveAxisReferenceLength(
    axis: 'horizontal' | 'vertical',
    hints: NativeRenderHints | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
): number {
    if (axis === 'horizontal') {
        return hints?.availableWidth ?? styleResolveOptions.viewportWidth ?? 390;
    }

    return hints?.availableHeight ?? styleResolveOptions.viewportHeight ?? 844;
}

function resolveAxisUnitNumber(
    value: NativePropValue | undefined,
    axis: 'horizontal' | 'vertical',
    hints: NativeRenderHints | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): number | undefined {
    const percentage = parsePercentageValue(value);
    if (percentage !== undefined) {
        return resolveAxisReferenceLength(axis, hints, styleResolveOptions) * (percentage / 100);
    }

    return toScaledUnitNumber(value, styleResolveOptions);
}

function toAxisDpLiteral(
    value: NativePropValue | undefined,
    axis: 'horizontal' | 'vertical',
    hints: NativeRenderHints | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string | undefined {
    const resolved = resolveAxisUnitNumber(value, axis, hints, styleResolveOptions);
    return resolved !== undefined ? `${formatFloat(resolved)}.dp` : undefined;
}

function toAxisPointLiteral(
    value: NativePropValue | undefined,
    axis: 'horizontal' | 'vertical',
    hints: NativeRenderHints | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string | undefined {
    const resolved = resolveAxisUnitNumber(value, axis, hints, styleResolveOptions);
    return resolved !== undefined ? formatFloat(resolved) : undefined;
}

function isHiddenOverflowValue(value: NativePropValue | undefined): boolean {
    if (typeof value !== 'string') {
        return false;
    }

    const normalized = value.trim().toLowerCase();
    return normalized === 'hidden' || normalized === 'clip';
}

function shouldClipNativeOverflow(style: Record<string, NativePropValue> | undefined): boolean {
    if (!style) {
        return false;
    }

    return isHiddenOverflowValue(style.overflow)
        || isHiddenOverflowValue(style.overflowX)
        || isHiddenOverflowValue(style.overflowY);
}

function parseCssUnitValue(value: NativePropValue | undefined): { value: number; unit: string } | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return { value, unit: '' };
    }

    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    const match = trimmed.match(/^(-?\d+(?:\.\d+)?)(px|dp|pt|sp|rem|em|vh|vw|vmin|vmax)?$/i);
    if (!match) {
        return undefined;
    }

    return {
        value: Number(match[1]),
        unit: (match[2] ?? '').toLowerCase(),
    };
}

function toScaledUnitNumber(
    value: NativePropValue | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): number | undefined {
    const parsed = parseCssUnitValue(value);
    if (parsed) {
        if (parsed.unit === 'rem' || parsed.unit === 'em') {
            return parsed.value * 16;
        }

        if (parsed.unit === 'vw') {
            return (styleResolveOptions.viewportWidth ?? 1024) * (parsed.value / 100);
        }

        if (parsed.unit === 'vh') {
            return (styleResolveOptions.viewportHeight ?? 768) * (parsed.value / 100);
        }

        if (parsed.unit === 'vmin') {
            const viewportWidth = styleResolveOptions.viewportWidth ?? 1024;
            const viewportHeight = styleResolveOptions.viewportHeight ?? 768;
            return Math.min(viewportWidth, viewportHeight) * (parsed.value / 100);
        }

        if (parsed.unit === 'vmax') {
            const viewportWidth = styleResolveOptions.viewportWidth ?? 1024;
            const viewportHeight = styleResolveOptions.viewportHeight ?? 768;
            return Math.max(viewportWidth, viewportHeight) * (parsed.value / 100);
        }

        return parsed.value;
    }

    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    const openParen = trimmed.indexOf('(');
    if (openParen <= 0 || !trimmed.endsWith(')')) {
        return undefined;
    }
    const functionName = trimmed.slice(0, openParen).toLowerCase();
    if (!/^[a-z]+$/.test(functionName)) {
        return undefined;
    }
    const innerValue = trimmed.slice(openParen + 1, -1).trim();

    if (functionName === 'calc') {
        return evaluateCssLengthExpression(innerValue, styleResolveOptions);
    }

    if (functionName !== 'clamp' && functionName !== 'min' && functionName !== 'max') {
        return undefined;
    }

    const resolvedArguments = splitCssFunctionArguments(innerValue)
        .map((entry) => toScaledUnitNumber(entry, styleResolveOptions));
    if (resolvedArguments.length === 0 || resolvedArguments.some((entry) => entry === undefined)) {
        return undefined;
    }

    const numericArguments = resolvedArguments as number[];
    if (functionName === 'clamp') {
        if (numericArguments.length !== 3) {
            return undefined;
        }

        return Math.min(numericArguments[2], Math.max(numericArguments[0], numericArguments[1]));
    }

    return functionName === 'min'
        ? Math.min(...numericArguments)
        : Math.max(...numericArguments);
}

function resolveComposeFontFamily(value: NativePropValue | undefined): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = value.toLowerCase();
    if (normalized.includes('sans-serif') || normalized.includes('sans') || normalized.includes('avenir') || normalized.includes('trebuchet') || normalized.includes('arial')) {
        return 'FontFamily.SansSerif';
    }
    if (normalized.includes('serif') || normalized.includes('georgia') || normalized.includes('times new roman')) {
        return 'FontFamily.Serif';
    }
    if (normalized.includes('monospace') || normalized.includes('courier') || normalized.includes('mono')) {
        return 'FontFamily.Monospace';
    }
    if (normalized.includes('cursive')) {
        return 'FontFamily.Cursive';
    }

    return undefined;
}

function resolveSwiftFontDesign(value: NativePropValue | undefined): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = value.toLowerCase();
    if (normalized.includes('sans-serif') || normalized.includes('sans') || normalized.includes('avenir') || normalized.includes('trebuchet') || normalized.includes('arial')) {
        return undefined;
    }
    if (normalized.includes('serif') || normalized.includes('georgia') || normalized.includes('times new roman')) {
        return '.serif';
    }
    if (normalized.includes('monospace') || normalized.includes('courier') || normalized.includes('mono')) {
        return '.monospaced';
    }
    if (normalized.includes('rounded')) {
        return '.rounded';
    }

    return undefined;
}

function resolveComposeLineHeight(
    value: NativePropValue | undefined,
    fontSize: NativePropValue | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string | undefined {
    const parsed = parseCssUnitValue(value);
    const baseFontSize = toScaledUnitNumber(fontSize, styleResolveOptions) ?? 16;
    const lineHeight = parsed?.unit === '' && parsed.value > 0 && parsed.value <= 4
        ? baseFontSize * parsed.value
        : toScaledUnitNumber(value, styleResolveOptions);

    return lineHeight !== undefined ? `${formatFloat(lineHeight)}.sp` : undefined;
}

function resolveSwiftLineSpacing(
    value: NativePropValue | undefined,
    fontSize: NativePropValue | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string | undefined {
    const parsed = parseCssUnitValue(value);
    const baseFontSize = toScaledUnitNumber(fontSize, styleResolveOptions) ?? 17;
    const lineHeight = parsed?.unit === '' && parsed.value > 0 && parsed.value <= 4
        ? baseFontSize * parsed.value
        : toScaledUnitNumber(value, styleResolveOptions);
    if (lineHeight === undefined) {
        return undefined;
    }

    const spacing = lineHeight - baseFontSize;
    return spacing > 0 ? formatFloat(spacing) : undefined;
}

function getClassList(node: NativeElementNode): string[] {
    const classList = node.props.classList;
    if (!Array.isArray(classList)) {
        return [];
    }

    return classList
        .map((item) => String(item).trim())
        .filter(Boolean);
}

function getSelectorAttributes(node: NativeElementNode): Record<string, string> {
    const attributes: Record<string, string> = {};

    for (const [key, value] of Object.entries(node.props)) {
        if (
            value == null ||
            value === false ||
            key === 'classList' ||
            key === 'style' ||
            key === 'innerHTML' ||
            key === 'nativeAction' ||
            key === 'nativeRoute' ||
            key === 'nativePayload'
        ) {
            continue;
        }

        if (key === 'source') {
            attributes.src = String(value);
            continue;
        }

        if (key === 'destination') {
            attributes.href = String(value);
            continue;
        }

        if (typeof value === 'boolean') {
            if (value) {
                attributes[key] = 'true';
            }
            continue;
        }

        if (typeof value === 'string' || typeof value === 'number') {
            attributes[key] = String(value);
        }
    }

    if (node.sourceTag === 'input' && node.component === 'Toggle' && !attributes.type) {
        attributes.type = 'checkbox';
    }

    return attributes;
}

function pickInheritedTextStyles(style: Record<string, NativePropValue> | undefined): Record<string, NativePropValue> | undefined {
    if (!style) {
        return undefined;
    }

    const inheritedEntries = INHERITED_TEXT_STYLE_KEYS
        .map((key) => [key, style[key]] as const)
        .filter(([, value]) => value !== undefined);

    return inheritedEntries.length > 0
        ? Object.fromEntries(inheritedEntries) as Record<string, NativePropValue>
        : undefined;
}

function getInlineStyleObject(node: NativeElementNode): Record<string, NativePropValue> | undefined {
    const inlineStyle = node.props.style;
    if (inlineStyle && typeof inlineStyle === 'object' && !Array.isArray(inlineStyle)) {
        return inlineStyle as Record<string, NativePropValue>;
    }

    return undefined;
}

function getNativeStyleResolveOptions(platform: NativePlatform): NativeStyleResolveOptions {
    return {
        viewportWidth: platform === 'generic' ? 1024 : 390,
        viewportHeight: platform === 'generic' ? 768 : 844,
        colorScheme: 'light',
        mediaType: 'screen',
    };
}

function createNativeStyleScope(tagName: string): NativeStyleScope {
    return {
        tagName,
        classNames: [],
        attributes: {},
        pseudoStates: [],
    };
}

function resolveNativeContainerNames(style: Record<string, NativePropValue> | undefined): string[] {
    if (!style || typeof style.containerName !== 'string') {
        return [];
    }

    return style.containerName
        .split(/\s+/)
        .map((containerName) => containerName.trim().toLowerCase())
        .filter((containerName) => containerName.length > 0 && containerName !== 'none');
}

function resolveNativeContainerWidth(
    style: Record<string, NativePropValue> | undefined,
    options: NativeStyleResolveOptions,
): number | undefined {
    if (!style) {
        return undefined;
    }

    if (isFillValue(style.width)) {
        return options.viewportWidth ?? 390;
    }

    return resolveAxisUnitNumber(style.width, 'horizontal', undefined, options)
        ?? resolveAxisUnitNumber(style.maxWidth, 'horizontal', undefined, options)
        ?? resolveAxisUnitNumber(style.minWidth, 'horizontal', undefined, options)
        ?? (options.viewportWidth ?? 390);
}

function resolveNativeContainerScope(
    style: Record<string, NativePropValue> | undefined,
    options: NativeStyleResolveOptions,
): Pick<NativeStyleScope, 'containerNames' | 'containerWidth' | 'isContainer'> {
    const containerNames = resolveNativeContainerNames(style);
    const containerType = typeof style?.containerType === 'string'
        ? style.containerType.trim().toLowerCase()
        : undefined;
    const isContainer = Boolean(containerType && containerType !== 'normal') || containerNames.length > 0;

    return isContainer
        ? {
            containerNames,
            containerWidth: resolveNativeContainerWidth(style, options),
            isContainer: true,
        }
        : {};
}

function buildGlobalInheritedTextStyles(options: NativeStyleResolveOptions): Record<string, NativePropValue> {
    const htmlScope = createNativeStyleScope('html');
    const bodyScope = createNativeStyleScope('body');
    const htmlStyles = pickInheritedTextStyles(
        styles.resolveNativeStyles(htmlScope, [], options) as Record<string, NativePropValue>
    );
    const bodyStyles = pickInheritedTextStyles(
        styles.resolveNativeStyles(bodyScope, [htmlScope], options) as Record<string, NativePropValue>
    );

    const mergedInheritedStyles = {
        ...(htmlStyles ?? {}),
        ...(bodyStyles ?? {}),
    };

    return normalizeResolvedCurrentTextColor(mergedInheritedStyles) ?? mergedInheritedStyles;
}

function buildRootResolvedStyleData(nodes: NativeNode[], options: NativeStyleResolveOptions): { resolvedStyles: NativeResolvedStyleMap; styleContexts: NativeStyleContextMap } {
    const scopeSnapshots = buildNativeStyleScopeSnapshots(nodes);
    const styleContexts: NativeStyleContextMap = new WeakMap();
    const resolvedStyles = buildResolvedStyleMap(
        nodes,
        options,
        [],
        new WeakMap<NativeElementNode, Record<string, NativePropValue>>(),
        buildGlobalInheritedTextStyles(options),
        scopeSnapshots,
        styleContexts,
    );

    return {
        resolvedStyles,
        styleContexts,
    };
}

function buildNativeStyleScopeSnapshots(nodes: NativeNode[]): NativeStyleScope[] {
    const elementNodes = nodes.filter((node): node is NativeElementNode => node.kind === 'element');
    const sameTypeCounts = new Map<string, number>();
    for (const node of elementNodes) {
        sameTypeCounts.set(node.sourceTag, (sameTypeCounts.get(node.sourceTag) ?? 0) + 1);
    }

    const previousTypeCounts = new Map<string, number>();
    const baseScopes: NativeStyleScope[] = [];

    for (const node of elementNodes) {
        const sameTypeIndex = (previousTypeCounts.get(node.sourceTag) ?? 0) + 1;
        const children = buildNativeStyleScopeSnapshots(node.children);
        baseScopes.push({
            tagName: node.sourceTag,
            classNames: getClassList(node),
            attributes: getSelectorAttributes(node),
            pseudoStates: getNativePseudoStates(node),
            childIndex: baseScopes.length + 1,
            siblingCount: elementNodes.length,
            sameTypeIndex,
            sameTypeCount: sameTypeCounts.get(node.sourceTag),
            ...(children.length > 0 ? { children } : {}),
        });
        previousTypeCounts.set(node.sourceTag, sameTypeIndex);
    }

    const cloneRelativeSiblingSequence = (scopes: NativeStyleScope[]): NativeStyleScope[] => {
        const clones: NativeStyleScope[] = [];

        for (const scope of scopes) {
            const clonedChildren = scope.children && scope.children.length > 0
                ? cloneRelativeSiblingSequence(scope.children)
                : undefined;

            clones.push({
                tagName: scope.tagName,
                classNames: [...scope.classNames],
                attributes: { ...scope.attributes },
                pseudoStates: [...scope.pseudoStates],
                ...(scope.childIndex !== undefined ? { childIndex: scope.childIndex } : {}),
                ...(scope.siblingCount !== undefined ? { siblingCount: scope.siblingCount } : {}),
                ...(scope.sameTypeIndex !== undefined ? { sameTypeIndex: scope.sameTypeIndex } : {}),
                ...(scope.sameTypeCount !== undefined ? { sameTypeCount: scope.sameTypeCount } : {}),
                ...(scope.containerNames ? { containerNames: [...scope.containerNames] } : {}),
                ...(scope.containerWidth !== undefined ? { containerWidth: scope.containerWidth } : {}),
                ...(scope.isContainer ? { isContainer: true } : {}),
                ...(clonedChildren ? { children: clonedChildren } : {}),
                ...(clones.length > 0 ? { previousSiblings: [...clones] } : {}),
            });
        }

        return clones;
    };

    const snapshots: NativeStyleScope[] = [];
    for (let index = 0; index < baseScopes.length; index++) {
        const baseScope = baseScopes[index];
        snapshots.push({
            ...baseScope,
            previousSiblings: [...snapshots],
            nextSiblings: cloneRelativeSiblingSequence(baseScopes.slice(index + 1)),
        });
    }

    return snapshots;
}

function getNativePseudoStates(node: NativeElementNode): string[] {
    const pseudoStates = new Set<string>();

    if (isNativeElementEmpty(node)) {
        pseudoStates.add('empty');
    }

    if (isNativeChecked(node)) {
        pseudoStates.add('checked');
    }

    if (isNativeDisabled(node)) {
        pseudoStates.add('disabled');
    }

    if (isNativeEnabled(node)) {
        pseudoStates.add('enabled');
    }

    if (isNativeSelected(node)) {
        pseudoStates.add('selected');
    }

    if (isNativeReadOnlyState(node)) {
        pseudoStates.add('read-only');
    }

    if (isNativeReadWrite(node)) {
        pseudoStates.add('read-write');
    }

    if (isNativePlaceholderShown(node)) {
        pseudoStates.add('placeholder-shown');
    }

    if (isNativeFocusWithin(node)) {
        pseudoStates.add('focus-within');
    }

    if (isNativeRequired(node)) {
        pseudoStates.add('required');
    }

    if (isNativeOptional(node)) {
        pseudoStates.add('optional');
    }

    if (isNativeInvalid(node)) {
        pseudoStates.add('invalid');
    } else if (isNativeValid(node)) {
        pseudoStates.add('valid');
    }

    if (isNativePseudoFocused(node)) {
        pseudoStates.add('focus');
        pseudoStates.add('focus-visible');
    }

    if (isNativeActive(node)) {
        pseudoStates.add('active');
    }

    return [...pseudoStates];
}

function buildResolvedStyleMap(
    nodes: NativeNode[],
    options: NativeStyleResolveOptions,
    ancestors: NativeStyleScope[] = [],
    resolvedStyles: NativeResolvedStyleMap = new WeakMap(),
    inheritedTextStyles: Record<string, NativePropValue> = {},
    scopeSnapshots: NativeStyleScope[] = buildNativeStyleScopeSnapshots(nodes),
    styleContexts?: NativeStyleContextMap,
): NativeResolvedStyleMap {
    const elementNodes = nodes.filter((node): node is NativeElementNode => node.kind === 'element');
    for (const [index, node] of elementNodes.entries()) {
        const scope = scopeSnapshots[index] ?? {
            tagName: node.sourceTag,
            classNames: getClassList(node),
            attributes: getSelectorAttributes(node),
            pseudoStates: getNativePseudoStates(node),
        };
        const classStyles = styles.resolveNativeStyles(scope, ancestors, options) as Record<string, NativePropValue>;
        const inlineStyle = getInlineStyleObject(node);
        const hasClassStyles = Object.keys(classStyles).length > 0;

        if (styleContexts) {
            styleContexts.set(node, {
                scope,
                ancestors: [...ancestors],
                inheritedTextStyles: { ...inheritedTextStyles },
            });
        }

        const ownStyle = inlineStyle
            ? hasClassStyles
                ? { ...classStyles, ...inlineStyle }
                : inlineStyle
            : hasClassStyles
                ? classStyles
                : undefined;
        const inheritedCurrentColor = parseCssColor(inheritedTextStyles.color, getDefaultCurrentColor()) ?? getDefaultCurrentColor();
        const mergedStyle = ownStyle
            ? { ...inheritedTextStyles, ...ownStyle }
            : Object.keys(inheritedTextStyles).length > 0
                ? { ...inheritedTextStyles }
                : undefined;
        const resolvedStyle = normalizeResolvedCurrentTextColor(mergedStyle, inheritedCurrentColor);

        if (resolvedStyle) {
            resolvedStyles.set(node, resolvedStyle);
        }

        const nextScope: NativeStyleScope = {
            ...scope,
            ...resolveNativeContainerScope(resolvedStyle, options),
        };

        buildResolvedStyleMap(
            node.children,
            options,
            [...ancestors, nextScope],
            resolvedStyles,
            pickInheritedTextStyles(resolvedStyle) ?? inheritedTextStyles,
            scope.children ?? [],
            styleContexts,
        );
    }

    return resolvedStyles;
}

function getStyleObject(
    node: NativeElementNode,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): Record<string, NativePropValue> | undefined {
    const mappedStyle = resolvedStyles?.get(node);
    if (mappedStyle) {
        return mappedStyle;
    }

    const fallbackScope = buildNativeStyleScopeSnapshots([node])[0] ?? {
        tagName: node.sourceTag,
        classNames: getClassList(node),
        attributes: getSelectorAttributes(node),
        pseudoStates: getNativePseudoStates(node),
    };
    const classStyles = styles.resolveNativeStyles(fallbackScope, [], styleResolveOptions) as Record<string, NativePropValue>;
    const globalInheritedTextStyles = buildGlobalInheritedTextStyles(styleResolveOptions);
    const inlineStyle = getInlineStyleObject(node);
    const hasClassStyles = Object.keys(classStyles).length > 0;
    const hasGlobalInheritedTextStyles = Object.keys(globalInheritedTextStyles).length > 0;
    const globalCurrentColor = parseCssColor(globalInheritedTextStyles.color, getDefaultCurrentColor()) ?? getDefaultCurrentColor();

    if (inlineStyle) {
        const mergedStyle = {
            ...globalInheritedTextStyles,
            ...(hasClassStyles ? classStyles : {}),
            ...inlineStyle,
        };

        return normalizeResolvedCurrentTextColor(mergedStyle, globalCurrentColor);
    }

    if (!hasClassStyles && !hasGlobalInheritedTextStyles) {
        return undefined;
    }

    const mergedStyle = {
        ...globalInheritedTextStyles,
        ...(hasClassStyles ? classStyles : {}),
    };

    return normalizeResolvedCurrentTextColor(mergedStyle, globalCurrentColor);
}

function createSingleNodeResolvedStyleMap(
    node: NativeElementNode,
    style: Record<string, NativePropValue>,
): NativeResolvedStyleMap {
    const resolvedStyles: NativeResolvedStyleMap = new WeakMap();
    resolvedStyles.set(node, style);
    return resolvedStyles;
}

function resolveNativePseudoStateVariantStyle(
    node: NativeElementNode,
    styleContexts: NativeStyleContextMap | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
    additionalPseudoStates: string[],
): Record<string, NativePropValue> | undefined {
    const context = styleContexts?.get(node);
    if (!context) {
        return undefined;
    }

    const pseudoStates = [...new Set([...context.scope.pseudoStates, ...additionalPseudoStates])];
    const scopedNode: NativeStyleScope = {
        ...context.scope,
        pseudoStates,
    };
    const classStyles = styles.resolveNativeStyles(scopedNode, context.ancestors, styleResolveOptions) as Record<string, NativePropValue>;
    const inlineStyle = getInlineStyleObject(node);
    const hasClassStyles = Object.keys(classStyles).length > 0;
    const hasInheritedTextStyles = Object.keys(context.inheritedTextStyles).length > 0;
    const inheritedCurrentColor = parseCssColor(context.inheritedTextStyles.color, getDefaultCurrentColor()) ?? getDefaultCurrentColor();

    if (inlineStyle) {
        const mergedStyle = {
            ...context.inheritedTextStyles,
            ...(hasClassStyles ? classStyles : {}),
            ...inlineStyle,
        };

        return normalizeResolvedCurrentTextColor(mergedStyle, inheritedCurrentColor);
    }

    if (!hasClassStyles && !hasInheritedTextStyles) {
        return undefined;
    }

    const mergedStyle = {
        ...context.inheritedTextStyles,
        ...(hasClassStyles ? classStyles : {}),
    };

    return normalizeResolvedCurrentTextColor(mergedStyle, inheritedCurrentColor);
}

function resolveNativeItemOrder(
    node: NativeNode,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): number {
    if (node.kind !== 'element') {
        return 0;
    }

    return parsePlainNumericValue(getStyleObject(node, resolvedStyles, styleResolveOptions)?.order) ?? 0;
}

function resolveNativeAvailableAxisSize(
    node: NativeElementNode,
    axis: 'horizontal' | 'vertical',
    resolvedStyles: NativeResolvedStyleMap | undefined,
    hints: NativeRenderHints | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): number {
    if (node.component === 'Screen') {
        return resolveAxisReferenceLength(axis, hints, styleResolveOptions);
    }

    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
    const sizeKey = axis === 'horizontal' ? 'width' : 'height';
    const minKey = axis === 'horizontal' ? 'minWidth' : 'minHeight';
    const maxKey = axis === 'horizontal' ? 'maxWidth' : 'maxHeight';

    if (style && isFillValue(style[sizeKey])) {
        return resolveAxisReferenceLength(axis, hints, styleResolveOptions);
    }

    return resolveAxisUnitNumber(style?.[sizeKey], axis, hints, styleResolveOptions)
        ?? resolveAxisUnitNumber(style?.[maxKey], axis, hints, styleResolveOptions)
        ?? resolveAxisUnitNumber(style?.[minKey], axis, hints, styleResolveOptions)
        ?? resolveAxisReferenceLength(axis, hints, styleResolveOptions);
}

function resolveNativeFlexContainerLayout(
    node: NativeElementNode | undefined,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): 'Row' | 'Column' | undefined {
    if (!node) {
        return undefined;
    }

    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
    if (!style) {
        return undefined;
    }

    if (typeof style.flexDirection === 'string') {
        return style.flexDirection.trim().toLowerCase() === 'row' ? 'Row' : 'Column';
    }

    const display = typeof style.display === 'string' ? style.display.trim().toLowerCase() : undefined;
    if (display === 'flex' || display === 'inline-flex') {
        return 'Row';
    }

    return undefined;
}

function hasExplicitNativeAxisSize(
    node: NativeElementNode,
    axis: 'horizontal' | 'vertical',
    resolvedStyles?: NativeResolvedStyleMap,
    hints?: NativeRenderHints,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): boolean {
    if (node.component === 'Screen') {
        return true;
    }

    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
    if (!style) {
        return false;
    }

    const sizeKey = axis === 'horizontal' ? 'width' : 'height';
    const minKey = axis === 'horizontal' ? 'minWidth' : 'minHeight';
    const maxKey = axis === 'horizontal' ? 'maxWidth' : 'maxHeight';

    if (isFillValue(style[sizeKey])) {
        return true;
    }

    return resolveAxisUnitNumber(style[sizeKey], axis, hints, styleResolveOptions) !== undefined
        || resolveAxisUnitNumber(style[minKey], axis, hints, styleResolveOptions) !== undefined
        || resolveAxisUnitNumber(style[maxKey], axis, hints, styleResolveOptions) !== undefined;
}

function shouldStretchFlexChildCrossAxis(
    child: NativeNode,
    parentFlexLayout: 'Row' | 'Column' | undefined,
    parentNode: NativeElementNode | undefined,
    parentHints: NativeRenderHints | undefined,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): boolean {
    if (!parentFlexLayout || child.kind !== 'element' || !parentNode) {
        return false;
    }

    const childStyle = getStyleObject(child, resolvedStyles, styleResolveOptions);
    const childAlignSelf = resolveSelfAlignmentKeyword(childStyle?.alignSelf);
    const childBaselineAlignSelf = resolveBaselineAlignmentKeyword(childStyle?.alignSelf);
    if (childAlignSelf === 'stretch') {
        return true;
    }

    if (childAlignSelf || childBaselineAlignSelf) {
        return false;
    }

    const parentStyle = getStyleObject(parentNode, resolvedStyles, styleResolveOptions);
    const parentAlignItems = resolveCrossAlignmentKeyword(parentStyle?.alignItems);
    if (parentAlignItems !== undefined) {
        return parentAlignItems === 'stretch';
    }

    return parentFlexLayout === 'Column'
        || (parentFlexLayout === 'Row' && hasExplicitNativeAxisSize(parentNode, 'vertical', resolvedStyles, parentHints, styleResolveOptions));
}

function resolveNativeFlexMainAxisGap(
    node: NativeElementNode,
    layout: 'Row' | 'Column',
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): number {
    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
    if (!style) {
        return 0;
    }

    return toScaledUnitNumber(
        style.gap ?? (layout === 'Row' ? style.columnGap : style.rowGap) ?? style.gap,
        styleResolveOptions,
    ) ?? 0;
}

function resolveNativeFlexShrinkTargets(
    parentNode: NativeElementNode | undefined,
    orderedNodes: NativeNode[],
    parentFlexLayout: 'Row' | 'Column' | undefined,
    availableWidth: number | undefined,
    availableHeight: number | undefined,
    parentHints: NativeRenderHints | undefined,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): WeakMap<NativeElementNode, number> {
    const targets = new WeakMap<NativeElementNode, number>();

    if (!parentNode || !parentFlexLayout || !orderedNodes.every((child) => child.kind === 'element')) {
        return targets;
    }

    const mainAxis = parentFlexLayout === 'Row' ? 'horizontal' : 'vertical';
    const availableMainSize = parentFlexLayout === 'Row' ? availableWidth : availableHeight;
    if (availableMainSize === undefined) {
        return targets;
    }

    if (!hasExplicitNativeAxisSize(parentNode, mainAxis, resolvedStyles, parentHints, styleResolveOptions)) {
        return targets;
    }

    const availableItemsSize = Math.max(
        0,
        availableMainSize - (resolveNativeFlexMainAxisGap(parentNode, parentFlexLayout, resolvedStyles, styleResolveOptions) * Math.max(0, orderedNodes.length - 1)),
    );
    const childHints: NativeRenderHints = {
        availableWidth,
        availableHeight,
    };
    const sizeKey = mainAxis === 'horizontal' ? 'width' : 'height';
    const minSizeKey = mainAxis === 'horizontal' ? 'minWidth' : 'minHeight';
    const maxSizeKey = mainAxis === 'horizontal' ? 'maxWidth' : 'maxHeight';
    const shrinkableItems: Array<{
        node: NativeElementNode;
        baseSize: number;
        remainingSize: number;
        shrinkWeight: number;
        minSize: number;
    }> = [];
    let occupiedSize = 0;

    for (const child of orderedNodes) {
        const elementChild = child as NativeElementNode;
        const childStyle = getStyleObject(elementChild, resolvedStyles, styleResolveOptions);
        if (!childStyle) {
            continue;
        }

        const flexStyle = resolveFlexStyleValues(childStyle);
        const minSize = resolveAxisUnitNumber(childStyle[minSizeKey], mainAxis, childHints, styleResolveOptions) ?? 0;
        const maxSize = resolveAxisUnitNumber(childStyle[maxSizeKey], mainAxis, childHints, styleResolveOptions);
        let baseSize = resolveAxisUnitNumber(flexStyle.basis, mainAxis, childHints, styleResolveOptions)
            ?? resolveAxisUnitNumber(childStyle[sizeKey], mainAxis, childHints, styleResolveOptions);
        if (baseSize === undefined || baseSize <= 0.0001) {
            continue;
        }

        if (maxSize !== undefined) {
            baseSize = Math.min(baseSize, maxSize);
        }
        baseSize = Math.max(baseSize, minSize);

        const shrink = flexStyle.shrink ?? 1;
        if (shrink === 0) {
            occupiedSize += baseSize;
            continue;
        }

        shrinkableItems.push({
            node: elementChild,
            baseSize,
            remainingSize: baseSize,
            shrinkWeight: baseSize * Math.max(shrink, 0),
            minSize,
        });
        occupiedSize += baseSize;
    }

    const overflow = occupiedSize - availableItemsSize;
    if (overflow <= 0.0001 || shrinkableItems.length === 0) {
        return targets;
    }

    let remainingOverflow = overflow;
    let activeItems = [...shrinkableItems];
    while (remainingOverflow > 0.0001 && activeItems.length > 0) {
        const totalShrinkWeight = activeItems.reduce((total, item) => total + item.shrinkWeight, 0);
        if (totalShrinkWeight <= 0.0001) {
            break;
        }

        let clampedThisPass = false;
        for (const item of activeItems) {
            const proportionalReduction = remainingOverflow * (item.shrinkWeight / totalShrinkWeight);
            const nextSize = item.remainingSize - proportionalReduction;
            if (nextSize > item.minSize + 0.0001) {
                continue;
            }

            remainingOverflow -= Math.max(0, item.remainingSize - item.minSize);
            item.remainingSize = item.minSize;
            clampedThisPass = true;
        }

        if (clampedThisPass) {
            activeItems = activeItems.filter((item) => item.remainingSize > item.minSize + 0.0001);
            continue;
        }

        for (const item of activeItems) {
            const proportionalReduction = remainingOverflow * (item.shrinkWeight / totalShrinkWeight);
            item.remainingSize = Math.max(item.minSize, item.remainingSize - proportionalReduction);
        }
        remainingOverflow = 0;
    }

    for (const item of shrinkableItems) {
        if (item.remainingSize < item.baseSize - 0.0001) {
            targets.set(item.node, item.remainingSize);
        }
    }

    return targets;
}

function resolvePositionMode(value: NativePropValue | undefined): 'relative' | 'absolute' | 'fixed' | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = value.trim().toLowerCase();
    return normalized === 'relative' || normalized === 'absolute' || normalized === 'fixed'
        ? normalized
        : undefined;
}

function isAbsolutelyPositionedNode(
    node: NativeNode,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): boolean {
    if (node.kind !== 'element') {
        return false;
    }

    return resolvePositionMode(getStyleObject(node, resolvedStyles, styleResolveOptions)?.position) === 'absolute';
}

function isFixedPositionedNode(
    node: NativeNode,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): boolean {
    if (node.kind !== 'element') {
        return false;
    }

    return resolvePositionMode(getStyleObject(node, resolvedStyles, styleResolveOptions)?.position) === 'fixed';
}

function splitAbsolutePositionedChildren(
    nodes: NativeNode[],
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): { flowChildren: NativeNode[]; absoluteChildren: NativeElementNode[] } {
    const flowChildren: NativeNode[] = [];
    const absoluteChildren: NativeElementNode[] = [];

    for (const node of nodes) {
        if (isAbsolutelyPositionedNode(node, resolvedStyles, styleResolveOptions)) {
            absoluteChildren.push(node as NativeElementNode);
            continue;
        }

        flowChildren.push(node);
    }

    return { flowChildren, absoluteChildren };
}

function splitFixedPositionedChildren(
    nodes: NativeNode[],
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): { flowChildren: NativeNode[]; fixedChildren: NativeElementNode[] } {
    const flowChildren: NativeNode[] = [];
    const fixedChildren: NativeElementNode[] = [];

    for (const node of nodes) {
        if (isFixedPositionedNode(node, resolvedStyles, styleResolveOptions)) {
            fixedChildren.push(node as NativeElementNode);
            continue;
        }

        flowChildren.push(node);
    }

    return { flowChildren, fixedChildren };
}

function shouldApplyNativeItemOrdering(
    parentNode: NativeElementNode,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): boolean {
    const style = getStyleObject(parentNode, resolvedStyles, styleResolveOptions);
    const display = typeof style?.display === 'string'
        ? style.display.trim().toLowerCase()
        : undefined;

    return display === 'flex'
        || display === 'inline-flex'
        || display === 'grid'
        || display === 'inline-grid'
        || typeof style?.flexDirection === 'string';
}

function getOrderedNativeChildren(
    parentNode: NativeElementNode,
    nodes: NativeNode[],
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): NativeNode[] {
    if (!shouldApplyNativeItemOrdering(parentNode, resolvedStyles, styleResolveOptions)) {
        return nodes;
    }

    const orderedEntries = nodes.map((node, index) => ({
        node,
        index,
        order: resolveNativeItemOrder(node, resolvedStyles, styleResolveOptions),
    }));

    if (!orderedEntries.some((entry) => entry.order !== 0)) {
        return nodes;
    }

    return [...orderedEntries]
        .sort((left, right) => left.order - right.order || left.index - right.index)
        .map((entry) => entry.node);
}

function getNativeBindingReference(node: NativeElementNode): NativeBindingReference | undefined {
    const binding = node.props.nativeBinding;
    if (!binding || typeof binding !== 'object' || Array.isArray(binding)) {
        return undefined;
    }

    const id = typeof binding.id === 'string' ? binding.id : undefined;
    const kind = binding.kind === 'value' || binding.kind === 'checked' ? binding.kind : undefined;
    const valueType = binding.valueType === 'boolean' || binding.valueType === 'number' || binding.valueType === 'string' || binding.valueType === 'string-array'
        ? binding.valueType
        : undefined;

    if (!id || !kind || !valueType) {
        return undefined;
    }

    return { id, kind, valueType };
}

function createNativeStateDescriptorMap(tree: NativeTree): Map<string, NativeStateDescriptor> {
    return new Map((tree.stateDescriptors ?? []).map((descriptor) => [descriptor.id, descriptor]));
}

function toNativeStateVariableName(id: string): string {
    const suffix = id.replace(/[^a-zA-Z0-9_]/g, '_');
    return suffix ? `native${suffix.charAt(0).toUpperCase()}${suffix.slice(1)}` : 'nativeState';
}

function formatKotlinStringList(values: readonly string[]): string {
    return values.length > 0
        ? `listOf(${values.map((value) => quoteKotlinString(String(value))).join(', ')})`
        : 'emptyList<String>()';
}

function formatSwiftStringList(values: readonly string[]): string {
    return `[${values.map((value) => quoteSwiftString(String(value))).join(', ')}]`;
}

function formatNativeNumberLiteral(value: number): string {
    const formatted = formatFloat(value);
    return formatted.includes('.') ? formatted : `${formatted}.0`;
}

function formatComposeStateInitialValue(descriptor: NativeStateDescriptor): string {
    if (descriptor.type === 'string-array') {
        const values = Array.isArray(descriptor.initialValue) ? descriptor.initialValue : [];
        return formatKotlinStringList(values);
    }

    if (descriptor.type === 'string') {
        return quoteKotlinString(String(descriptor.initialValue));
    }

    if (descriptor.type === 'number') {
        return formatNativeNumberLiteral(Number(descriptor.initialValue));
    }

    return String(descriptor.initialValue);
}

function formatSwiftStateInitialValue(descriptor: NativeStateDescriptor): string {
    if (descriptor.type === 'string-array') {
        const values = Array.isArray(descriptor.initialValue) ? descriptor.initialValue : [];
        return formatSwiftStringList(values);
    }

    if (descriptor.type === 'string') {
        return quoteSwiftString(String(descriptor.initialValue));
    }

    if (descriptor.type === 'number') {
        return formatNativeNumberLiteral(Number(descriptor.initialValue));
    }

    return String(descriptor.initialValue);
}

function ensureComposeStateVariable(context: AndroidComposeContext, stateId: string): { descriptor: NativeStateDescriptor; variableName: string } {
    const descriptor = context.stateDescriptors.get(stateId);
    if (!descriptor) {
        throw new Error(`Unknown native state descriptor: ${stateId}`);
    }

    const variableName = toNativeStateVariableName(stateId);
    if (!context.declaredStateIds.has(stateId)) {
        context.declaredStateIds.add(stateId);
        context.stateDeclarations.push(`${indent(1)}var ${variableName} by remember { mutableStateOf(${formatComposeStateInitialValue(descriptor)}) }`);
    }

    return { descriptor, variableName };
}

function ensureSwiftStateVariable(context: SwiftUIContext, stateId: string): { descriptor: NativeStateDescriptor; variableName: string } {
    const descriptor = context.stateDescriptors.get(stateId);
    if (!descriptor) {
        throw new Error(`Unknown native state descriptor: ${stateId}`);
    }

    const variableName = toNativeStateVariableName(stateId);
    if (!context.declaredStateIds.has(stateId)) {
        context.declaredStateIds.add(stateId);
        const annotation = descriptor.type === 'string-array'
            ? ': [String]'
            : descriptor.type === 'number'
                ? ': Double'
                : '';
        context.stateDeclarations.push(`${indent(1)}@State private var ${variableName}${annotation} = ${formatSwiftStateInitialValue(descriptor)}`);
    }

    return { descriptor, variableName };
}

function toComposeTextValueExpression(variableName: string, descriptor: NativeStateDescriptor): string {
    if (descriptor.type === 'string') {
        return variableName;
    }

    if (descriptor.type === 'string-array') {
        return `${variableName}.joinToString(", ")`;
    }

    return `${variableName}.toString()`;
}

function toSwiftTextValueExpression(variableName: string, descriptor: NativeStateDescriptor): string {
    if (descriptor.type === 'string') {
        return variableName;
    }

    if (descriptor.type === 'string-array') {
        return `${variableName}.joined(separator: ", ")`;
    }

    return `String(${variableName})`;
}

function buildComposeStateStringAssignment(variableName: string, descriptor: NativeStateDescriptor, value: string): string {
    const literal = quoteKotlinString(value);

    if (descriptor.type === 'string-array') {
        return `${variableName} = listOf(${literal})`;
    }

    if (descriptor.type === 'number') {
        return `${variableName} = ${literal}.toDoubleOrNull() ?: ${variableName}`;
    }

    if (descriptor.type === 'boolean') {
        return `${variableName} = ${literal}.equals("true", ignoreCase = true)`;
    }

    return `${variableName} = ${literal}`;
}

function buildSwiftStateStringAssignment(variableName: string, descriptor: NativeStateDescriptor, valueExpression: string): string {
    if (descriptor.type === 'string-array') {
        return `${variableName} = ${valueExpression}.split(separator: ",").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }`;
    }

    if (descriptor.type === 'number') {
        return `if let parsed = Double(${valueExpression}) { ${variableName} = parsed }`;
    }

    if (descriptor.type === 'boolean') {
        return `${variableName} = ${valueExpression}.compare("true", options: .caseInsensitive) == .orderedSame`;
    }

    return `${variableName} = ${valueExpression}`;
}

function buildComposeStateStringArrayToggleAssignment(variableName: string, value: string, optionValues: readonly string[]): string {
    const orderedValues = formatKotlinStringList(optionValues);
    const literal = quoteKotlinString(value);
    return `${variableName} = ${orderedValues}.filter { candidate -> if (candidate == ${literal}) checked else ${variableName}.contains(candidate) }`;
}

function buildSwiftStringBindingExpression(
    variableName: string,
    descriptor: NativeStateDescriptor,
    additionalSetterStatements: string[] = [],
): string {
    const setterSuffix = additionalSetterStatements.length > 0
        ? `; ${additionalSetterStatements.join('; ')}`
        : '';

    if (descriptor.type === 'string') {
        return additionalSetterStatements.length > 0
            ? `Binding(get: { ${variableName} }, set: { nextValue in ${variableName} = nextValue${setterSuffix} })`
            : `$${variableName}`;
    }

    if (descriptor.type === 'string-array') {
        return `Binding(get: { ${variableName}.joined(separator: ", ") }, set: { nextValue in ${variableName} = nextValue.split(separator: ",").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }${setterSuffix} })`;
    }

    if (descriptor.type === 'number') {
        return `Binding(get: { String(${variableName}) }, set: { nextValue in if let parsed = Double(nextValue) { ${variableName} = parsed }${setterSuffix} })`;
    }

    return `Binding(get: { ${variableName} ? "true" : "false" }, set: { nextValue in ${variableName} = nextValue.compare("true", options: .caseInsensitive) == .orderedSame${setterSuffix} })`;
}

function buildSwiftStateStringArrayToggleBinding(
    variableName: string,
    value: string,
    optionValues: readonly string[],
    additionalSetterStatements: string[] = [],
): string {
    const literal = quoteSwiftString(value);
    const orderedValues = formatSwiftStringList(optionValues);
    const setterSuffix = additionalSetterStatements.length > 0
        ? `; ${additionalSetterStatements.join('; ')}`
        : '';
    return `Binding(get: { ${variableName}.contains(${literal}) }, set: { isOn in ${variableName} = ${orderedValues}.filter { option in option == ${literal} ? isOn : ${variableName}.contains(option) }${setterSuffix} })`;
}

function buildSwiftReadOnlyBindingExpression(valueExpression: string): string {
    return `Binding(get: { ${valueExpression} }, set: { _ in })`;
}

function collectNativePickerOptionNodes(nodes: NativeNode[]): NativeElementNode[] {
    const options: NativeElementNode[] = [];

    for (const node of nodes) {
        if (node.kind !== 'element') {
            continue;
        }

        if (node.component === 'Option') {
            options.push(node);
            continue;
        }

        if (node.sourceTag === 'optgroup') {
            options.push(...collectNativePickerOptionNodes(node.children));
        }
    }

    return options;
}

function resolveNativePickerOptionLabel(node: NativeElementNode): string {
    if (typeof node.props.label === 'string' && node.props.label.trim()) {
        return node.props.label;
    }

    const textContent = flattenTextContent(node.children).trim();
    if (textContent) {
        return textContent;
    }

    if (typeof node.props.value === 'string' || typeof node.props.value === 'number' || typeof node.props.value === 'boolean') {
        return String(node.props.value);
    }

    return 'Option';
}

function resolveNativePickerOptionValue(node: NativeElementNode): string {
    if (typeof node.props.value === 'string' || typeof node.props.value === 'number' || typeof node.props.value === 'boolean') {
        return String(node.props.value);
    }

    return resolveNativePickerOptionLabel(node);
}

function resolveNativePickerOptions(node: NativeElementNode): NativePickerOption[] {
    return collectNativePickerOptionNodes(node.children).map((optionNode) => ({
        label: resolveNativePickerOptionLabel(optionNode),
        value: resolveNativePickerOptionValue(optionNode),
        selected: isNativeSelected(optionNode),
        disabled: isNativeDisabled(optionNode),
    }));
}

function resolveNativePickerInitialSelection(node: NativeElementNode, options: NativePickerOption[]): string {
    if (isNativeMultiple(node)) {
        return resolveNativePickerInitialSelections(node, options)[0] ?? '';
    }

    const explicitValue = typeof node.props.value === 'string' || typeof node.props.value === 'number' || typeof node.props.value === 'boolean'
        ? String(node.props.value)
        : undefined;

    if (explicitValue && options.some((option) => option.value === explicitValue)) {
        return explicitValue;
    }

    const selectedOption = options.find((option) => option.selected);

    if (selectedOption) {
        return selectedOption.value;
    }

    if (isNativeRequired(node)) {
        return '';
    }

    return options[0]?.value ?? '';
}

function resolveNativePickerInitialSelections(node: NativeElementNode, options: NativePickerOption[]): string[] {
    if (Array.isArray(node.props.value)) {
        const explicitValues = node.props.value
            .filter((value): value is string | number | boolean => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
            .map((value) => String(value));

        return explicitValues.filter((value, index) => explicitValues.indexOf(value) === index && options.some((option) => option.value === value));
    }

    const explicitValue = typeof node.props.value === 'string' || typeof node.props.value === 'number' || typeof node.props.value === 'boolean'
        ? String(node.props.value)
        : undefined;

    if (explicitValue && options.some((option) => option.value === explicitValue)) {
        return [explicitValue];
    }

    return options
        .filter((option) => option.selected)
        .map((option) => option.value);
}

function resolveNativeProgressFraction(props: Record<string, NativePropValue>): number | undefined {
    const value = parsePlainNumericValue(props.value);
    if (value === undefined) {
        return undefined;
    }

    const max = parsePlainNumericValue(props.max);
    const denominator = max !== undefined && max > 0 ? max : 1;
    return Math.max(0, Math.min(1, value / denominator));
}

function hasExplicitNativeWidthStyle(style: Record<string, NativePropValue> | undefined): boolean {
    return Boolean(style && (style.width !== undefined || style.minWidth !== undefined || style.maxWidth !== undefined));
}

function hasExplicitNativeHeightStyle(style: Record<string, NativePropValue> | undefined): boolean {
    return Boolean(style && (style.height !== undefined || style.minHeight !== undefined || style.maxHeight !== undefined));
}

function hasNativeTableLayoutSourceTag(sourceTag: string | undefined): boolean {
    return sourceTag === 'table'
        || sourceTag === 'thead'
        || sourceTag === 'tbody'
        || sourceTag === 'tfoot'
        || sourceTag === 'tr'
        || sourceTag === 'td'
        || sourceTag === 'th';
}

function resolveNativeSurfaceSource(node: NativeElementNode): string | undefined {
    const source = typeof node.props.source === 'string' && node.props.source.trim()
        ? node.props.source.trim()
        : typeof node.props.src === 'string' && node.props.src.trim()
            ? node.props.src.trim()
            : typeof node.props.data === 'string' && node.props.data.trim()
                ? node.props.data.trim()
                : typeof node.props.destination === 'string' && node.props.destination.trim()
                    ? node.props.destination.trim()
                    : undefined;

    return source && source.length > 0 ? source : undefined;
}

function resolveNativeMediaLabel(node: NativeElementNode): string {
    const explicitLabel = typeof node.props['aria-label'] === 'string' && node.props['aria-label'].trim()
        ? node.props['aria-label'].trim()
        : typeof node.props.title === 'string' && node.props.title.trim()
            ? node.props.title.trim()
            : undefined;

    if (explicitLabel) {
        return explicitLabel;
    }

    const textContent = flattenTextContent(node.children).trim();
    if (textContent) {
        return textContent;
    }

    return node.sourceTag === 'audio' ? 'Audio' : 'Video';
}

function resolveNativeDefaultFillColor(sourceTag: string): NativeColorValue | undefined {
    return sourceTag === 'circle'
        || sourceTag === 'rect'
        || sourceTag === 'ellipse'
        || sourceTag === 'path'
        || sourceTag === 'polyline'
        || sourceTag === 'polygon'
        ? getDefaultCurrentColor()
        : undefined;
}

function resolveNativeVectorPaintColor(
    value: NativePropValue | undefined,
    fallback?: NativeColorValue,
): NativeColorValue | undefined {
    if (typeof value === 'string' && value.trim().toLowerCase() === 'none') {
        return undefined;
    }

    if (value === undefined) {
        return cloneNativeColor(fallback);
    }

    return parseCssColor(value, fallback ?? getDefaultCurrentColor()) ?? cloneNativeColor(fallback);
}

function resolveNativeVectorStrokeWidth(node: NativeElementNode): number | undefined {
    return parseNativeSvgNumber(node.props.strokeWidth) ?? undefined;
}

function isNativePropObjectValue(value: NativePropValue | undefined): value is NativePropObject {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function buildNativeVectorCubicCurve(
    control1X: number,
    control1Y: number,
    control2X: number,
    control2Y: number,
    x: number,
    y: number,
): NativeVectorPathCommand {
    return { kind: 'cubicTo', control1X, control1Y, control2X, control2Y, x, y };
}

function buildNativeVectorCubicCurveFromQuadratic(
    startX: number,
    startY: number,
    controlX: number,
    controlY: number,
    endX: number,
    endY: number,
): NativeVectorPathCommand {
    return buildNativeVectorCubicCurve(
        startX + ((controlX - startX) * 2) / 3,
        startY + ((controlY - startY) * 2) / 3,
        endX + ((controlX - endX) * 2) / 3,
        endY + ((controlY - endY) * 2) / 3,
        endX,
        endY,
    );
}

function approximateNativeSvgArcAsCubicCurves(
    startX: number,
    startY: number,
    radiusX: number,
    radiusY: number,
    rotationDegrees: number,
    largeArcFlag: boolean,
    sweepFlag: boolean,
    endX: number,
    endY: number,
): NativeVectorPathCommand[] | undefined {
    if (![startX, startY, radiusX, radiusY, rotationDegrees, endX, endY].every((value) => Number.isFinite(value))) {
        return undefined;
    }

    if (Math.abs(endX - startX) < Number.EPSILON && Math.abs(endY - startY) < Number.EPSILON) {
        return [];
    }

    let rx = Math.abs(radiusX);
    let ry = Math.abs(radiusY);
    if (rx < Number.EPSILON || ry < Number.EPSILON) {
        return [{ kind: 'lineTo', x: endX, y: endY }];
    }

    const rotation = normalizeAngle(rotationDegrees) * (Math.PI / 180);
    const cosRotation = Math.cos(rotation);
    const sinRotation = Math.sin(rotation);
    const halfDeltaX = (startX - endX) / 2;
    const halfDeltaY = (startY - endY) / 2;
    const transformedStartX = cosRotation * halfDeltaX + sinRotation * halfDeltaY;
    const transformedStartY = -sinRotation * halfDeltaX + cosRotation * halfDeltaY;

    const radiiScale = (transformedStartX * transformedStartX) / (rx * rx) + (transformedStartY * transformedStartY) / (ry * ry);
    if (radiiScale > 1) {
        const scale = Math.sqrt(radiiScale);
        rx *= scale;
        ry *= scale;
    }

    const rxSquared = rx * rx;
    const rySquared = ry * ry;
    const startXSquared = transformedStartX * transformedStartX;
    const startYSquared = transformedStartY * transformedStartY;
    const numerator = rxSquared * rySquared - rxSquared * startYSquared - rySquared * startXSquared;
    const denominator = rxSquared * startYSquared + rySquared * startXSquared;
    const factor = denominator < Number.EPSILON
        ? 0
        : (largeArcFlag === sweepFlag ? -1 : 1) * Math.sqrt(Math.max(0, numerator / denominator));
    const transformedCenterX = factor * ((rx * transformedStartY) / ry);
    const transformedCenterY = factor * (-(ry * transformedStartX) / rx);
    const centerX = cosRotation * transformedCenterX - sinRotation * transformedCenterY + (startX + endX) / 2;
    const centerY = sinRotation * transformedCenterX + cosRotation * transformedCenterY + (startY + endY) / 2;

    const angleBetweenVectors = (ux: number, uy: number, vx: number, vy: number): number => {
        const length = Math.hypot(ux, uy) * Math.hypot(vx, vy);
        if (length < Number.EPSILON) {
            return 0;
        }

        const dot = Math.max(-1, Math.min(1, (ux * vx + uy * vy) / length));
        const angle = Math.acos(dot);
        return ux * vy - uy * vx < 0 ? -angle : angle;
    };

    const startVectorX = (transformedStartX - transformedCenterX) / rx;
    const startVectorY = (transformedStartY - transformedCenterY) / ry;
    const endVectorX = (-transformedStartX - transformedCenterX) / rx;
    const endVectorY = (-transformedStartY - transformedCenterY) / ry;
    const startAngle = angleBetweenVectors(1, 0, startVectorX, startVectorY);
    let sweepAngle = angleBetweenVectors(startVectorX, startVectorY, endVectorX, endVectorY);
    if (!sweepFlag && sweepAngle > 0) {
        sweepAngle -= Math.PI * 2;
    } else if (sweepFlag && sweepAngle < 0) {
        sweepAngle += Math.PI * 2;
    }

    const segmentCount = Math.max(1, Math.ceil(Math.abs(sweepAngle) / (Math.PI / 2)));
    const segmentSweep = sweepAngle / segmentCount;
    const transformPoint = (unitX: number, unitY: number) => ({
        x: centerX + cosRotation * rx * unitX - sinRotation * ry * unitY,
        y: centerY + sinRotation * rx * unitX + cosRotation * ry * unitY,
    });
    const transformDerivative = (unitX: number, unitY: number) => ({
        x: cosRotation * rx * unitX - sinRotation * ry * unitY,
        y: sinRotation * rx * unitX + cosRotation * ry * unitY,
    });

    const commands: NativeVectorPathCommand[] = [];
    for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
        const angle1 = startAngle + segmentIndex * segmentSweep;
        const angle2 = angle1 + segmentSweep;
        const alpha = (4 / 3) * Math.tan((angle2 - angle1) / 4);
        const cosAngle1 = Math.cos(angle1);
        const sinAngle1 = Math.sin(angle1);
        const cosAngle2 = Math.cos(angle2);
        const sinAngle2 = Math.sin(angle2);
        const point1 = transformPoint(cosAngle1, sinAngle1);
        const point2 = transformPoint(cosAngle2, sinAngle2);
        const derivative1 = transformDerivative(-sinAngle1, cosAngle1);
        const derivative2 = transformDerivative(-sinAngle2, cosAngle2);

        commands.push(buildNativeVectorCubicCurve(
            point1.x + alpha * derivative1.x,
            point1.y + alpha * derivative1.y,
            point2.x - alpha * derivative2.x,
            point2.y - alpha * derivative2.y,
            point2.x,
            point2.y,
        ));
    }

    return commands;
}

function parseNativeSvgPathData(data: string): NativeVectorPathCommand[] | undefined {
    const tokens = data.match(/[a-zA-Z]|[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi);
    if (!tokens || tokens.length === 0) {
        return undefined;
    }

    const commands: NativeVectorPathCommand[] = [];
    let index = 0;
    let currentX = 0;
    let currentY = 0;
    let subpathStartX = 0;
    let subpathStartY = 0;
    let command = '';
    let lastCubicControlX: number | undefined;
    let lastCubicControlY: number | undefined;
    let lastQuadraticControlX: number | undefined;
    let lastQuadraticControlY: number | undefined;
    let previousCurveKind: 'cubic' | 'quadratic' | undefined;

    const readNumber = (): number | undefined => {
        const token = tokens[index];
        if (!token || /^[a-zA-Z]$/.test(token)) {
            return undefined;
        }

        index += 1;
        const parsed = Number(token);
        return Number.isFinite(parsed) ? parsed : undefined;
    };

    while (index < tokens.length) {
        const token = tokens[index]!;
        if (/^[a-zA-Z]$/.test(token)) {
            command = token;
            index += 1;
        } else if (!command) {
            return undefined;
        }

        switch (command) {
            case 'M':
            case 'm': {
                const x = readNumber();
                const y = readNumber();
                if (x === undefined || y === undefined) {
                    return undefined;
                }
                currentX = command === 'm' ? currentX + x : x;
                currentY = command === 'm' ? currentY + y : y;
                subpathStartX = currentX;
                subpathStartY = currentY;
                lastCubicControlX = undefined;
                lastCubicControlY = undefined;
                lastQuadraticControlX = undefined;
                lastQuadraticControlY = undefined;
                previousCurveKind = undefined;
                commands.push({ kind: 'moveTo', x: currentX, y: currentY });
                command = command === 'm' ? 'l' : 'L';
                break;
            }
            case 'L':
            case 'l': {
                const x = readNumber();
                const y = readNumber();
                if (x === undefined || y === undefined) {
                    return undefined;
                }
                currentX = command === 'l' ? currentX + x : x;
                currentY = command === 'l' ? currentY + y : y;
                lastCubicControlX = undefined;
                lastCubicControlY = undefined;
                lastQuadraticControlX = undefined;
                lastQuadraticControlY = undefined;
                previousCurveKind = undefined;
                commands.push({ kind: 'lineTo', x: currentX, y: currentY });
                break;
            }
            case 'H':
            case 'h': {
                const x = readNumber();
                if (x === undefined) {
                    return undefined;
                }
                currentX = command === 'h' ? currentX + x : x;
                lastCubicControlX = undefined;
                lastCubicControlY = undefined;
                lastQuadraticControlX = undefined;
                lastQuadraticControlY = undefined;
                previousCurveKind = undefined;
                commands.push({ kind: 'lineTo', x: currentX, y: currentY });
                break;
            }
            case 'V':
            case 'v': {
                const y = readNumber();
                if (y === undefined) {
                    return undefined;
                }
                currentY = command === 'v' ? currentY + y : y;
                lastCubicControlX = undefined;
                lastCubicControlY = undefined;
                lastQuadraticControlX = undefined;
                lastQuadraticControlY = undefined;
                previousCurveKind = undefined;
                commands.push({ kind: 'lineTo', x: currentX, y: currentY });
                break;
            }
            case 'C':
            case 'c': {
                const control1X = readNumber();
                const control1Y = readNumber();
                const control2X = readNumber();
                const control2Y = readNumber();
                const x = readNumber();
                const y = readNumber();
                if (control1X === undefined || control1Y === undefined || control2X === undefined || control2Y === undefined || x === undefined || y === undefined) {
                    return undefined;
                }

                const absoluteControl1X = command === 'c' ? currentX + control1X : control1X;
                const absoluteControl1Y = command === 'c' ? currentY + control1Y : control1Y;
                const absoluteControl2X = command === 'c' ? currentX + control2X : control2X;
                const absoluteControl2Y = command === 'c' ? currentY + control2Y : control2Y;
                currentX = command === 'c' ? currentX + x : x;
                currentY = command === 'c' ? currentY + y : y;
                commands.push(buildNativeVectorCubicCurve(
                    absoluteControl1X,
                    absoluteControl1Y,
                    absoluteControl2X,
                    absoluteControl2Y,
                    currentX,
                    currentY,
                ));
                lastCubicControlX = absoluteControl2X;
                lastCubicControlY = absoluteControl2Y;
                lastQuadraticControlX = undefined;
                lastQuadraticControlY = undefined;
                previousCurveKind = 'cubic';
                break;
            }
            case 'S':
            case 's': {
                const control2X = readNumber();
                const control2Y = readNumber();
                const x = readNumber();
                const y = readNumber();
                if (control2X === undefined || control2Y === undefined || x === undefined || y === undefined) {
                    return undefined;
                }

                const absoluteControl1X = previousCurveKind === 'cubic' && lastCubicControlX !== undefined
                    ? currentX * 2 - lastCubicControlX
                    : currentX;
                const absoluteControl1Y = previousCurveKind === 'cubic' && lastCubicControlY !== undefined
                    ? currentY * 2 - lastCubicControlY
                    : currentY;
                const absoluteControl2X = command === 's' ? currentX + control2X : control2X;
                const absoluteControl2Y = command === 's' ? currentY + control2Y : control2Y;
                currentX = command === 's' ? currentX + x : x;
                currentY = command === 's' ? currentY + y : y;
                commands.push(buildNativeVectorCubicCurve(
                    absoluteControl1X,
                    absoluteControl1Y,
                    absoluteControl2X,
                    absoluteControl2Y,
                    currentX,
                    currentY,
                ));
                lastCubicControlX = absoluteControl2X;
                lastCubicControlY = absoluteControl2Y;
                lastQuadraticControlX = undefined;
                lastQuadraticControlY = undefined;
                previousCurveKind = 'cubic';
                break;
            }
            case 'Q':
            case 'q': {
                const controlX = readNumber();
                const controlY = readNumber();
                const x = readNumber();
                const y = readNumber();
                if (controlX === undefined || controlY === undefined || x === undefined || y === undefined) {
                    return undefined;
                }

                const absoluteControlX = command === 'q' ? currentX + controlX : controlX;
                const absoluteControlY = command === 'q' ? currentY + controlY : controlY;
                const startX = currentX;
                const startY = currentY;
                currentX = command === 'q' ? currentX + x : x;
                currentY = command === 'q' ? currentY + y : y;
                commands.push(buildNativeVectorCubicCurveFromQuadratic(
                    startX,
                    startY,
                    absoluteControlX,
                    absoluteControlY,
                    currentX,
                    currentY,
                ));
                lastQuadraticControlX = absoluteControlX;
                lastQuadraticControlY = absoluteControlY;
                lastCubicControlX = undefined;
                lastCubicControlY = undefined;
                previousCurveKind = 'quadratic';
                break;
            }
            case 'T':
            case 't': {
                const x = readNumber();
                const y = readNumber();
                if (x === undefined || y === undefined) {
                    return undefined;
                }

                const absoluteControlX = previousCurveKind === 'quadratic' && lastQuadraticControlX !== undefined
                    ? currentX * 2 - lastQuadraticControlX
                    : currentX;
                const absoluteControlY = previousCurveKind === 'quadratic' && lastQuadraticControlY !== undefined
                    ? currentY * 2 - lastQuadraticControlY
                    : currentY;
                const startX = currentX;
                const startY = currentY;
                currentX = command === 't' ? currentX + x : x;
                currentY = command === 't' ? currentY + y : y;
                commands.push(buildNativeVectorCubicCurveFromQuadratic(
                    startX,
                    startY,
                    absoluteControlX,
                    absoluteControlY,
                    currentX,
                    currentY,
                ));
                lastQuadraticControlX = absoluteControlX;
                lastQuadraticControlY = absoluteControlY;
                lastCubicControlX = undefined;
                lastCubicControlY = undefined;
                previousCurveKind = 'quadratic';
                break;
            }
            case 'A':
            case 'a': {
                const radiusX = readNumber();
                const radiusY = readNumber();
                const rotation = readNumber();
                const largeArcFlag = readNumber();
                const sweepFlag = readNumber();
                const x = readNumber();
                const y = readNumber();
                if (radiusX === undefined || radiusY === undefined || rotation === undefined || largeArcFlag === undefined || sweepFlag === undefined || x === undefined || y === undefined) {
                    return undefined;
                }

                const targetX = command === 'a' ? currentX + x : x;
                const targetY = command === 'a' ? currentY + y : y;
                const arcCommands = approximateNativeSvgArcAsCubicCurves(
                    currentX,
                    currentY,
                    radiusX,
                    radiusY,
                    rotation,
                    largeArcFlag >= 0.5,
                    sweepFlag >= 0.5,
                    targetX,
                    targetY,
                );
                if (!arcCommands) {
                    return undefined;
                }

                commands.push(...arcCommands);
                currentX = targetX;
                currentY = targetY;
                lastCubicControlX = undefined;
                lastCubicControlY = undefined;
                lastQuadraticControlX = undefined;
                lastQuadraticControlY = undefined;
                previousCurveKind = undefined;
                break;
            }
            case 'Z':
            case 'z': {
                commands.push({ kind: 'close' });
                currentX = subpathStartX;
                currentY = subpathStartY;
                lastCubicControlX = undefined;
                lastCubicControlY = undefined;
                lastQuadraticControlX = undefined;
                lastQuadraticControlY = undefined;
                previousCurveKind = undefined;
                command = '';
                break;
            }
            default:
                return undefined;
        }
    }

    return commands.length > 0 ? commands : undefined;
}

function parseNativeSvgPointList(value: NativePropValue | undefined): Array<{ x: number; y: number }> | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const tokens = value.match(/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi);
    if (!tokens || tokens.length < 4 || tokens.length % 2 !== 0) {
        return undefined;
    }

    const points: Array<{ x: number; y: number }> = [];
    for (let index = 0; index < tokens.length; index += 2) {
        const x = Number(tokens[index]);
        const y = Number(tokens[index + 1]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return undefined;
        }
        points.push({ x, y });
    }

    return points;
}

function buildNativeVectorPathFromPoints(
    points: Array<{ x: number; y: number }>,
    closePath = false,
): NativeVectorPathCommand[] | undefined {
    if (points.length < 2) {
        return undefined;
    }

    const [firstPoint, ...remainingPoints] = points;
    const commands: NativeVectorPathCommand[] = [{ kind: 'moveTo', x: firstPoint.x, y: firstPoint.y }];
    for (const point of remainingPoints) {
        commands.push({ kind: 'lineTo', x: point.x, y: point.y });
    }

    if (closePath) {
        commands.push({ kind: 'close' });
    }

    return commands;
}

function parseNativeVectorShape(node: NativeElementNode): NativeVectorShape | undefined {
    const fill = resolveNativeVectorPaintColor(node.props.fill, resolveNativeDefaultFillColor(node.sourceTag));
    const stroke = resolveNativeVectorPaintColor(node.props.stroke);
    const strokeWidth = resolveNativeVectorStrokeWidth(node);

    switch (node.sourceTag) {
        case 'circle': {
            const cx = parseNativeSvgNumber(node.props.cx);
            const cy = parseNativeSvgNumber(node.props.cy);
            const r = parseNativeSvgNumber(node.props.r);
            if (cx === undefined || cy === undefined || r === undefined) {
                return undefined;
            }

            return { kind: 'circle', cx, cy, r, fill, stroke, strokeWidth };
        }
        case 'ellipse': {
            const cx = parseNativeSvgNumber(node.props.cx);
            const cy = parseNativeSvgNumber(node.props.cy);
            const rx = parseNativeSvgNumber(node.props.rx);
            const ry = parseNativeSvgNumber(node.props.ry);
            if (cx === undefined || cy === undefined || rx === undefined || ry === undefined) {
                return undefined;
            }

            return { kind: 'ellipse', cx, cy, rx, ry, fill, stroke, strokeWidth };
        }
        case 'rect': {
            const x = parseNativeSvgNumber(node.props.x) ?? 0;
            const y = parseNativeSvgNumber(node.props.y) ?? 0;
            const width = parseNativeSvgNumber(node.props.width);
            const height = parseNativeSvgNumber(node.props.height);
            if (width === undefined || height === undefined) {
                return undefined;
            }

            return {
                kind: 'rect',
                x,
                y,
                width,
                height,
                rx: parseNativeSvgNumber(node.props.rx),
                ry: parseNativeSvgNumber(node.props.ry),
                fill,
                stroke,
                strokeWidth,
            };
        }
        case 'line': {
            const x1 = parseNativeSvgNumber(node.props.x1) ?? 0;
            const y1 = parseNativeSvgNumber(node.props.y1) ?? 0;
            const x2 = parseNativeSvgNumber(node.props.x2) ?? 0;
            const y2 = parseNativeSvgNumber(node.props.y2) ?? 0;
            return {
                kind: 'path',
                commands: [
                    { kind: 'moveTo', x: x1, y: y1 },
                    { kind: 'lineTo', x: x2, y: y2 },
                ],
                fill,
                stroke,
                strokeWidth,
            };
        }
        case 'polyline': {
            const points = parseNativeSvgPointList(node.props.points);
            const commands = points ? buildNativeVectorPathFromPoints(points, false) : undefined;
            if (!commands) {
                return undefined;
            }

            return { kind: 'path', commands, fill, stroke, strokeWidth };
        }
        case 'polygon': {
            const points = parseNativeSvgPointList(node.props.points);
            const commands = points ? buildNativeVectorPathFromPoints(points, true) : undefined;
            if (!commands) {
                return undefined;
            }

            return { kind: 'path', commands, fill, stroke, strokeWidth };
        }
        case 'path': {
            const data = typeof node.props.d === 'string' ? node.props.d.trim() : undefined;
            if (!data) {
                return undefined;
            }

            const commands = parseNativeSvgPathData(data);
            if (!commands) {
                return undefined;
            }

            return { kind: 'path', commands, fill, stroke, strokeWidth };
        }
        default:
            return undefined;
    }
}

function collectNativeVectorShapes(nodes: NativeNode[]): NativeVectorShape[] | undefined {
    const shapes: NativeVectorShape[] = [];

    const visit = (items: NativeNode[]): boolean => {
        for (const item of items) {
            if (item.kind !== 'element' || item.component !== 'Vector') {
                return false;
            }

            if (item.sourceTag === 'g') {
                if (!visit(item.children)) {
                    return false;
                }
                continue;
            }

            const shape = parseNativeVectorShape(item);
            if (!shape) {
                return false;
            }
            shapes.push(shape);
        }

        return true;
    };

    return visit(nodes) && shapes.length > 0 ? shapes : undefined;
}

function parseNativeVectorViewBox(value: NativePropValue | undefined): NativeVectorViewport | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const parts = value.trim().split(/[\s,]+/).map((part) => Number(part));
    if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
        return undefined;
    }

    const [minX, minY, width, height] = parts;
    if (width <= 0 || height <= 0) {
        return undefined;
    }

    return { minX, minY, width, height };
}

function buildNativeVectorSpec(node: NativeElementNode): NativeVectorSpec | undefined {
    if (node.sourceTag !== 'svg') {
        return undefined;
    }

    const shapes = collectNativeVectorShapes(node.children);
    if (!shapes) {
        return undefined;
    }

    const viewBox = parseNativeVectorViewBox(node.props.viewBox);
    const intrinsicWidth = parseNativeSvgNumber(node.props.width) ?? viewBox?.width ?? 24;
    const intrinsicHeight = parseNativeSvgNumber(node.props.height) ?? viewBox?.height ?? 24;
    const viewport = viewBox ?? { minX: 0, minY: 0, width: intrinsicWidth, height: intrinsicHeight };

    return {
        viewport,
        shapes,
        intrinsicWidth: intrinsicWidth > 0 ? intrinsicWidth : viewport.width,
        intrinsicHeight: intrinsicHeight > 0 ? intrinsicHeight : viewport.height,
    };
}

function buildNativeCanvasSpec(node: NativeElementNode): NativeCanvasSpec {
    const intrinsicWidth = parseNativeSvgNumber(node.props.width) ?? 300;
    const intrinsicHeight = parseNativeSvgNumber(node.props.height) ?? 150;

    return {
        intrinsicWidth: intrinsicWidth > 0 ? intrinsicWidth : 300,
        intrinsicHeight: intrinsicHeight > 0 ? intrinsicHeight : 150,
    };
}

function resolveNativeCanvasFillFallback(kind: string): NativeColorValue | undefined {
    return kind === 'rect'
        || kind === 'circle'
        || kind === 'ellipse'
        || kind === 'polygon'
        || kind === 'path'
        ? getDefaultCurrentColor()
        : undefined;
}

function resolveNativeCanvasStrokeFallback(kind: string): NativeColorValue | undefined {
    return kind === 'line' || kind === 'polyline'
        ? getDefaultCurrentColor()
        : undefined;
}

function parseNativeCanvasStrokeWidth(op: NativePropObject): number | undefined {
    return parseNativeSvgNumber(op.strokeWidth ?? op.lineWidth) ?? undefined;
}

function parseNativeCanvasPointList(value: NativePropValue | undefined): Array<{ x: number; y: number }> | undefined {
    if (typeof value === 'string') {
        return parseNativeSvgPointList(value);
    }

    if (!Array.isArray(value)) {
        return undefined;
    }

    const points: Array<{ x: number; y: number }> = [];
    for (const item of value) {
        if (Array.isArray(item)) {
            const x = parseNativeSvgNumber(item[0]);
            const y = parseNativeSvgNumber(item[1]);
            if (x === undefined || y === undefined) {
                return undefined;
            }
            points.push({ x, y });
            continue;
        }

        if (!isNativePropObjectValue(item)) {
            return undefined;
        }

        const x = parseNativeSvgNumber(item.x);
        const y = parseNativeSvgNumber(item.y);
        if (x === undefined || y === undefined) {
            return undefined;
        }
        points.push({ x, y });
    }

    return points.length >= 2 ? points : undefined;
}

function parseNativeCanvasDrawOperation(op: NativePropObject): NativeVectorShape | undefined {
    const kind = typeof op.kind === 'string' ? op.kind.trim() : undefined;
    if (!kind) {
        return undefined;
    }

    const fill = resolveNativeVectorPaintColor(op.fill ?? op.fillStyle, resolveNativeCanvasFillFallback(kind));
    const stroke = resolveNativeVectorPaintColor(op.stroke ?? op.strokeStyle, resolveNativeCanvasStrokeFallback(kind));
    const strokeWidth = parseNativeCanvasStrokeWidth(op);

    switch (kind) {
        case 'rect': {
            const width = parseNativeSvgNumber(op.width);
            const height = parseNativeSvgNumber(op.height);
            if (width === undefined || height === undefined) {
                return undefined;
            }

            return {
                kind: 'rect',
                x: parseNativeSvgNumber(op.x) ?? 0,
                y: parseNativeSvgNumber(op.y) ?? 0,
                width,
                height,
                rx: parseNativeSvgNumber(op.rx),
                ry: parseNativeSvgNumber(op.ry),
                fill,
                stroke,
                strokeWidth,
            };
        }
        case 'circle': {
            const cx = parseNativeSvgNumber(op.cx);
            const cy = parseNativeSvgNumber(op.cy);
            const r = parseNativeSvgNumber(op.r);
            if (cx === undefined || cy === undefined || r === undefined) {
                return undefined;
            }

            return { kind: 'circle', cx, cy, r, fill, stroke, strokeWidth };
        }
        case 'ellipse': {
            const cx = parseNativeSvgNumber(op.cx);
            const cy = parseNativeSvgNumber(op.cy);
            const rx = parseNativeSvgNumber(op.rx);
            const ry = parseNativeSvgNumber(op.ry);
            if (cx === undefined || cy === undefined || rx === undefined || ry === undefined) {
                return undefined;
            }

            return { kind: 'ellipse', cx, cy, rx, ry, fill, stroke, strokeWidth };
        }
        case 'line': {
            const x1 = parseNativeSvgNumber(op.x1);
            const y1 = parseNativeSvgNumber(op.y1);
            const x2 = parseNativeSvgNumber(op.x2);
            const y2 = parseNativeSvgNumber(op.y2);
            if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) {
                return undefined;
            }

            return {
                kind: 'path',
                commands: [
                    { kind: 'moveTo', x: x1, y: y1 },
                    { kind: 'lineTo', x: x2, y: y2 },
                ],
                stroke,
                strokeWidth,
            };
        }
        case 'polyline': {
            const points = parseNativeCanvasPointList(op.points);
            const commands = points ? buildNativeVectorPathFromPoints(points, false) : undefined;
            if (!commands) {
                return undefined;
            }

            return { kind: 'path', commands, fill, stroke, strokeWidth };
        }
        case 'polygon': {
            const points = parseNativeCanvasPointList(op.points);
            const commands = points ? buildNativeVectorPathFromPoints(points, true) : undefined;
            if (!commands) {
                return undefined;
            }

            return { kind: 'path', commands, fill, stroke, strokeWidth };
        }
        case 'path': {
            const data = typeof op.d === 'string' ? op.d.trim() : undefined;
            if (!data) {
                return undefined;
            }

            const commands = parseNativeSvgPathData(data);
            if (!commands) {
                return undefined;
            }

            return { kind: 'path', commands, fill, stroke, strokeWidth };
        }
        default:
            return undefined;
    }
}

function buildNativeCanvasDrawingSpec(node: NativeElementNode): NativeVectorSpec | undefined {
    const drawOps = node.props.drawOps;
    if (!Array.isArray(drawOps)) {
        return undefined;
    }

    const shapes = drawOps
        .map((op) => isNativePropObjectValue(op) ? parseNativeCanvasDrawOperation(op) : undefined)
        .filter((shape): shape is NativeVectorShape => Boolean(shape));
    if (shapes.length === 0) {
        return undefined;
    }

    const canvasSpec = buildNativeCanvasSpec(node);
    return {
        viewport: {
            minX: 0,
            minY: 0,
            width: canvasSpec.intrinsicWidth,
            height: canvasSpec.intrinsicHeight,
        },
        shapes,
        intrinsicWidth: canvasSpec.intrinsicWidth,
        intrinsicHeight: canvasSpec.intrinsicHeight,
    };
}

function attachDesktopNativeMetadata(node: NativeElementNode): void {
    if (node.component === 'Vector' && node.sourceTag === 'svg') {
        const vectorSpec = buildNativeVectorSpec(node);
        if (vectorSpec) {
            node.props.desktopVectorSpec = vectorSpec as unknown as NativePropObject;
        }
        return;
    }

    if (node.component === 'Canvas') {
        const canvasSpec = buildNativeCanvasDrawingSpec(node) ?? buildNativeCanvasSpec(node);
        node.props.desktopCanvasSpec = canvasSpec as unknown as NativePropObject;
    }
}

function applyComposeTextTransformExpression(expression: string, transform: 'uppercase' | 'lowercase' | 'capitalize' | undefined): string {
    if (!transform) {
        return expression;
    }

    if (transform === 'uppercase') {
        return `${expression}.uppercase()`;
    }

    if (transform === 'lowercase') {
        return `${expression}.lowercase()`;
    }

    return `${expression}.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }`;
}

function applySwiftTextTransformExpression(expression: string, transform: 'uppercase' | 'lowercase' | 'capitalize' | undefined): string {
    if (!transform) {
        return expression;
    }

    if (transform === 'uppercase') {
        return `${expression}.uppercased()`;
    }

    if (transform === 'lowercase') {
        return `${expression}.lowercased()`;
    }

    return `${expression}.capitalized`;
}

function buildComposeTextExpression(
    nodes: NativeNode[],
    context: AndroidComposeContext,
    transform?: 'uppercase' | 'lowercase' | 'capitalize',
): string | undefined {
    const parts: string[] = [];
    let hasDynamicPart = false;

    const visit = (items: NativeNode[]): void => {
        for (const item of items) {
            if (item.kind === 'text') {
                if (item.stateId) {
                    const { descriptor, variableName } = ensureComposeStateVariable(context, item.stateId);
                    parts.push(toComposeTextValueExpression(variableName, descriptor));
                    hasDynamicPart = true;
                } else {
                    parts.push(quoteKotlinString(item.value));
                }
                continue;
            }

            visit(item.children);
        }
    };

    visit(nodes);

    if (parts.length === 0 || !hasDynamicPart) {
        return undefined;
    }

    const expression = parts.join(' + ');
    return applyComposeTextTransformExpression(expression, transform);
}

function buildSwiftTextExpression(
    nodes: NativeNode[],
    context: SwiftUIContext,
    transform?: 'uppercase' | 'lowercase' | 'capitalize',
): string | undefined {
    const parts: string[] = [];
    let hasDynamicPart = false;

    const visit = (items: NativeNode[]): void => {
        for (const item of items) {
            if (item.kind === 'text') {
                if (item.stateId) {
                    const { descriptor, variableName } = ensureSwiftStateVariable(context, item.stateId);
                    parts.push(toSwiftTextValueExpression(variableName, descriptor));
                    hasDynamicPart = true;
                } else {
                    parts.push(quoteSwiftString(item.value));
                }
                continue;
            }

            visit(item.children);
        }
    };

    visit(nodes);

    if (parts.length === 0 || !hasDynamicPart) {
        return undefined;
    }

    const expression = parts.join(' + ');
    return applySwiftTextTransformExpression(expression, transform);
}

function parseSpacingShorthand(
    value: NativePropValue | undefined,
    unitParser: (value: NativePropValue | undefined) => string | undefined,
): { top?: string; right?: string; bottom?: string; left?: string } | undefined {
    if (value === undefined) return undefined;

    const rawValues = typeof value === 'string'
        ? value.trim().split(/\s+/).filter(Boolean)
        : [value];

    if (rawValues.length === 0 || rawValues.length > 4) {
        return undefined;
    }

    const parsed = rawValues.map((item) => unitParser(item));
    if (parsed.some((item) => !item)) {
        return undefined;
    }

    const [first, second = first, third = first, fourth = second] = parsed as string[];

    switch (parsed.length) {
        case 1:
            return { top: first, right: first, bottom: first, left: first };
        case 2:
            return { top: first, right: second, bottom: first, left: second };
        case 3:
            return { top: first, right: second, bottom: third, left: second };
        case 4:
            return { top: first, right: second, bottom: third, left: fourth };
        default:
            return undefined;
    }
}

function resolveDirectionalSpacing(
    style: Record<string, NativePropValue>,
    prefix: 'padding' | 'margin',
    unitParser: (value: NativePropValue | undefined) => string | undefined,
): { top?: string; right?: string; bottom?: string; left?: string } {
    const shorthand = parseSpacingShorthand(style[prefix], unitParser);

    return {
        top: shorthand?.top ?? unitParser(style[`${prefix}Top`]),
        right: shorthand?.right ?? unitParser(style[`${prefix}Right`] ?? style[`${prefix}End`]),
        bottom: shorthand?.bottom ?? unitParser(style[`${prefix}Bottom`]),
        left: shorthand?.left ?? unitParser(style[`${prefix}Left`] ?? style[`${prefix}Start`]),
    };
}

function toNumericSpacingValue(value: string | undefined): number | undefined {
    if (value === undefined) {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function resolveNumericDirectionalSpacing(
    style: Record<string, NativePropValue>,
    prefix: 'padding' | 'margin',
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): { top?: number; right?: number; bottom?: number; left?: number } {
    const shorthand = parseSpacingShorthand(style[prefix], (spacingValue) => {
        const resolved = toScaledUnitNumber(spacingValue, styleResolveOptions);
        return resolved !== undefined ? String(resolved) : undefined;
    });

    return {
        top: toNumericSpacingValue(shorthand?.top) ?? toScaledUnitNumber(style[`${prefix}Top`], styleResolveOptions),
        right: toNumericSpacingValue(shorthand?.right) ?? toScaledUnitNumber(style[`${prefix}Right`] ?? style[`${prefix}End`], styleResolveOptions),
        bottom: toNumericSpacingValue(shorthand?.bottom) ?? toScaledUnitNumber(style[`${prefix}Bottom`], styleResolveOptions),
        left: toNumericSpacingValue(shorthand?.left) ?? toScaledUnitNumber(style[`${prefix}Left`] ?? style[`${prefix}Start`], styleResolveOptions),
    };
}

function buildComposeMarginPaddingCalls(
    style: Record<string, NativePropValue> | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string[] {
    if (!style) {
        return [];
    }

    const spacing = resolveNumericDirectionalSpacing(style, 'margin', styleResolveOptions);
    const args: string[] = [];
    if (spacing.top) args.push(`top = ${formatFloat(spacing.top)}.dp`);
    if (spacing.right) args.push(`end = ${formatFloat(spacing.right)}.dp`);
    if (spacing.bottom) args.push(`bottom = ${formatFloat(spacing.bottom)}.dp`);
    if (spacing.left) args.push(`start = ${formatFloat(spacing.left)}.dp`);

    return args.length > 0 ? [`padding(${args.join(', ')})`] : [];
}

function buildSwiftMarginPaddingModifiers(
    style: Record<string, NativePropValue> | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string[] {
    if (!style) {
        return [];
    }

    const spacing = resolveNumericDirectionalSpacing(style, 'margin', styleResolveOptions);
    const modifiers: string[] = [];
    if (spacing.top) modifiers.push(`.padding(.top, ${formatFloat(spacing.top)})`);
    if (spacing.right) modifiers.push(`.padding(.trailing, ${formatFloat(spacing.right)})`);
    if (spacing.bottom) modifiers.push(`.padding(.bottom, ${formatFloat(spacing.bottom)})`);
    if (spacing.left) modifiers.push(`.padding(.leading, ${formatFloat(spacing.left)})`);

    return modifiers;
}

function parseAutoMarginFlags(style: Record<string, NativePropValue> | undefined): NativeAutoMarginFlags {
    const flags: NativeAutoMarginFlags = {
        top: false,
        right: false,
        bottom: false,
        left: false,
    };

    if (!style) {
        return flags;
    }

    const markValue = (value: NativePropValue | undefined, sides: Array<keyof NativeAutoMarginFlags>): void => {
        if (typeof value === 'string' && value.trim().toLowerCase() === 'auto') {
            sides.forEach((side) => {
                flags[side] = true;
            });
        }
    };

    markValue(style.marginTop, ['top']);
    markValue(style.marginRight ?? style.marginEnd, ['right']);
    markValue(style.marginBottom, ['bottom']);
    markValue(style.marginLeft ?? style.marginStart, ['left']);

    if (typeof style.margin === 'string') {
        const values = style.margin.trim().split(/\s+/).filter(Boolean);
        const resolved = [values[0], values[1] ?? values[0], values[2] ?? values[0], values[3] ?? values[1] ?? values[0]];
        markValue(resolved[0], ['top']);
        markValue(resolved[1], ['right']);
        markValue(resolved[2], ['bottom']);
        markValue(resolved[3], ['left']);
    }

    return flags;
}

function hasHorizontalAutoMargins(style: Record<string, NativePropValue> | undefined): boolean {
    const flags = parseAutoMarginFlags(style);
    return flags.left && flags.right;
}

function shouldCenterConstrainedHorizontalAutoMargins(style: Record<string, NativePropValue> | undefined): boolean {
    if (!style || !hasHorizontalAutoMargins(style)) {
        return false;
    }

    if (isFillValue(style.width)) {
        return false;
    }

    return style.width !== undefined || style.minWidth !== undefined || style.maxWidth !== undefined;
}

function buildComposeAutoMarginCalls(style: Record<string, NativePropValue> | undefined): string[] {
    if (!shouldCenterConstrainedHorizontalAutoMargins(style)) {
        return [];
    }

    return ['wrapContentWidth(Alignment.CenterHorizontally)'];
}

function buildSwiftAutoMarginModifiers(style: Record<string, NativePropValue> | undefined): string[] {
    if (!hasHorizontalAutoMargins(style)) {
        return [];
    }

    return ['.frame(maxWidth: .infinity, alignment: .center)'];
}

function estimateHorizontalPadding(
    style: Record<string, NativePropValue> | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): number {
    if (!style) {
        return 0;
    }

    const spacing = resolveNumericDirectionalSpacing(style, 'padding', styleResolveOptions);
    if (spacing.left !== undefined || spacing.right !== undefined) {
        return (spacing.left ?? 0) + (spacing.right ?? 0);
    }

    const horizontal = toScaledUnitNumber(style.paddingHorizontal, styleResolveOptions);
    if (horizontal !== undefined) {
        return horizontal * 2;
    }

    const padding = toScaledUnitNumber(style.padding, styleResolveOptions);
    return padding !== undefined ? padding * 2 : 0;
}

function estimateVerticalPadding(
    style: Record<string, NativePropValue> | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): number {
    if (!style) {
        return 0;
    }

    const spacing = resolveNumericDirectionalSpacing(style, 'padding', styleResolveOptions);
    if (spacing.top !== undefined || spacing.bottom !== undefined) {
        return (spacing.top ?? 0) + (spacing.bottom ?? 0);
    }

    const vertical = toScaledUnitNumber(style.paddingVertical, styleResolveOptions);
    if (vertical !== undefined) {
        return vertical * 2;
    }

    const padding = toScaledUnitNumber(style.padding, styleResolveOptions);
    return padding !== undefined ? padding * 2 : 0;
}

function splitCssTrackList(value: string): string[] {
    const tracks: string[] = [];
    let token = '';
    let functionDepth = 0;
    let bracketDepth = 0;

    for (const char of value.trim()) {
        if (char === '(') {
            functionDepth += 1;
        } else if (char === ')' && functionDepth > 0) {
            functionDepth -= 1;
        } else if (char === '[') {
            bracketDepth += 1;
        } else if (char === ']' && bracketDepth > 0) {
            bracketDepth -= 1;
        }

        if (/\s/.test(char) && functionDepth === 0 && bracketDepth === 0) {
            const trimmed = token.trim();
            if (trimmed) {
                tracks.push(trimmed);
                token = '';
            }
            continue;
        }

        token += char;
    }

    const trailing = token.trim();
    if (trailing) {
        tracks.push(trailing);
    }

    return tracks;
}

function extractNativeGridLineNames(token: string): string[] | undefined {
    const trimmed = token.trim();
    if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
        return undefined;
    }

    const names = trimmed.slice(1, -1).trim().split(/\s+/).filter(Boolean);
    return names.length > 0 ? names : undefined;
}

function parseNativeGridTrackDefinition(value: string): NativeGridTrackDefinition | undefined {
    const tokens = expandRepeatTrackList(value.trim()) ?? splitCssTrackList(value.trim());
    if (tokens.length === 0) {
        return undefined;
    }

    const tracks: string[] = [];
    const lineNames = new Map<string, number[]>();
    let lineIndex = 1;

    for (const token of tokens) {
        const names = extractNativeGridLineNames(token);
        if (names) {
            for (const name of names) {
                const normalizedName = name.toLowerCase();
                const existing = lineNames.get(normalizedName) ?? [];
                existing.push(lineIndex);
                lineNames.set(normalizedName, existing);
            }
            continue;
        }

        tracks.push(token);
        lineIndex += 1;
    }

    return tracks.length > 0 ? { tracks, lineNames, lineCount: lineIndex } : undefined;
}

function expandRepeatTrackList(value: string): string[] | undefined {
    const trimmed = value.trim();
    if (!trimmed.endsWith(')') || !trimmed.toLowerCase().startsWith('repeat(')) {
        return undefined;
    }

    const commaIdx = trimmed.indexOf(',', 'repeat('.length);
    if (commaIdx < 0) {
        return undefined;
    }

    const countStr = trimmed.slice('repeat('.length, commaIdx).trim();
    if (!/^\d+$/.test(countStr)) {
        return undefined;
    }

    const count = Number(countStr);
    if (!Number.isFinite(count) || count <= 0) {
        return undefined;
    }

    const inner = trimmed.slice(commaIdx + 1, -1).trim();
    if (!inner) {
        return undefined;
    }

    const innerTracks = splitCssTrackList(inner);
    if (innerTracks.length === 0) {
        return undefined;
    }

    return Array.from({ length: count }, () => innerTracks).flat();
}

function parseFractionTrackWeight(track: string): number | undefined {
    const directMatch = track.trim().match(/^(-?\d+(?:\.\d+)?)fr$/i);
    if (directMatch) {
        return Number(directMatch[1]);
    }

    const minmaxMatch = track.trim().match(/^minmax\([^,()]*,\s*(-?\d+(?:\.\d+)?)fr\s*\)$/i);
    return minmaxMatch ? Number(minmaxMatch[1]) : undefined;
}

function parseGridTrackSizeSpec(
    track: string,
    styleResolveOptions: NativeStyleResolveOptions,
): NativeGridTrackSizeSpec | undefined {
    const trimmed = track.trim();
    if (!trimmed) {
        return undefined;
    }

    const direct = toScaledUnitNumber(trimmed, styleResolveOptions);
    if (direct !== undefined && direct >= 0) {
        return { minHeight: direct, height: direct };
    }

    const normalized = trimmed.toLowerCase();
    if (normalized === 'auto') {
        return { stretchEligible: true };
    }

    if (normalized === 'min-content' || normalized === 'max-content') {
        return { intrinsicHeight: true };
    }

    const fitContentMatch = trimmed.match(/^fit-content\(([^()]+)\)$/i);
    if (fitContentMatch) {
        const fitContent = toScaledUnitNumber(fitContentMatch[1].trim(), styleResolveOptions);
        return fitContent !== undefined && fitContent >= 0 ? { maxHeight: fitContent } : undefined;
    }

    const minmaxMatch = trimmed.match(/^minmax\(([^,()]+),\s*([^,()]+)\)$/i);
    if (minmaxMatch) {
        const minToken = minmaxMatch[1].trim();
        const maxToken = minmaxMatch[2].trim();
        const normalizedMinToken = minToken.toLowerCase();
        const normalizedMaxToken = maxToken.toLowerCase();
        const minTrack = toScaledUnitNumber(minToken, styleResolveOptions);
        const maxTrack = toScaledUnitNumber(maxToken, styleResolveOptions);
        const trackWeight = parseFractionTrackWeight(trimmed);
        const hasFixedTrack = minTrack !== undefined && maxTrack !== undefined && Math.abs(minTrack - maxTrack) < 0.001;

        return {
            ...(minTrack !== undefined && minTrack >= 0 ? { minHeight: minTrack } : {}),
            ...((normalizedMinToken === 'min-content' || normalizedMinToken === 'max-content') ? { intrinsicMinHeight: true } : {}),
            ...(hasFixedTrack && maxTrack !== undefined ? { height: maxTrack } : {}),
            ...(!hasFixedTrack && maxTrack !== undefined && maxTrack >= 0 ? { maxHeight: maxTrack } : {}),
            ...((normalizedMaxToken === 'min-content' || normalizedMaxToken === 'max-content') ? { intrinsicMaxHeight: true } : {}),
            ...(minTrack === undefined && maxTrack === undefined && minToken.toLowerCase() === 'auto' && maxToken.toLowerCase() === 'auto' && trackWeight === undefined ? { stretchEligible: true } : {}),
            ...(trackWeight !== undefined && Number.isFinite(trackWeight) && trackWeight > 0 ? { trackWeight } : {}),
        };
    }

    const directWeight = parseFractionTrackWeight(trimmed);
    if (directWeight !== undefined && Number.isFinite(directWeight) && directWeight > 0) {
        return { trackWeight: directWeight };
    }

    return undefined;
}

function parseGridColumnTrackSizeSpec(
    track: string,
    styleResolveOptions: NativeStyleResolveOptions,
): NativeGridColumnTrackSizeSpec | undefined {
    const trimmed = track.trim();
    if (!trimmed) {
        return undefined;
    }

    const direct = toScaledUnitNumber(trimmed, styleResolveOptions);
    if (direct !== undefined && direct >= 0) {
        return { minWidth: direct, width: direct };
    }

    const normalized = trimmed.toLowerCase();
    if (normalized === 'auto') {
        return { trackWeight: 1 };
    }

    if (normalized === 'min-content' || normalized === 'max-content') {
        return { intrinsicWidth: true };
    }

    const fitContentMatch = trimmed.match(/^fit-content\(([^()]+)\)$/i);
    if (fitContentMatch) {
        const fitContent = toScaledUnitNumber(fitContentMatch[1].trim(), styleResolveOptions);
        return fitContent !== undefined && fitContent >= 0 ? { maxWidth: fitContent } : undefined;
    }

    const minmaxMatch = trimmed.match(/^minmax\(([^,()]+),\s*([^,()]+)\)$/i);
    if (minmaxMatch) {
        const minToken = minmaxMatch[1].trim();
        const maxToken = minmaxMatch[2].trim();
        const normalizedMinToken = minToken.toLowerCase();
        const normalizedMaxToken = maxToken.toLowerCase();
        const minTrack = toScaledUnitNumber(minToken, styleResolveOptions);
        const maxTrack = toScaledUnitNumber(maxToken, styleResolveOptions);
        const trackWeight = parseFractionTrackWeight(trimmed);
        const hasFixedTrack = minTrack !== undefined && maxTrack !== undefined && Math.abs(minTrack - maxTrack) < 0.001;

        return {
            ...(minTrack !== undefined && minTrack >= 0 ? { minWidth: minTrack } : {}),
            ...((normalizedMinToken === 'min-content' || normalizedMinToken === 'max-content') ? { intrinsicMinWidth: true } : {}),
            ...(hasFixedTrack && maxTrack !== undefined ? { width: maxTrack } : {}),
            ...(!hasFixedTrack && maxTrack !== undefined && maxTrack >= 0 ? { maxWidth: maxTrack } : {}),
            ...((normalizedMaxToken === 'min-content' || normalizedMaxToken === 'max-content') ? { intrinsicMaxWidth: true } : {}),
            ...(minTrack === undefined && maxTrack === undefined && normalizedMinToken === 'auto' && normalizedMaxToken === 'auto' && trackWeight === undefined ? { trackWeight: 1 } : {}),
            ...(trackWeight !== undefined && Number.isFinite(trackWeight) && trackWeight > 0 ? { trackWeight } : {}),
        };
    }

    const directWeight = parseFractionTrackWeight(trimmed);
    if (directWeight !== undefined && Number.isFinite(directWeight) && directWeight > 0) {
        return { trackWeight: directWeight };
    }

    return { trackWeight: 1 };
}

function resolveGridTrackSizeSpecs(
    value: NativePropValue | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
): Array<NativeGridTrackSizeSpec | undefined> | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const tracks = parseNativeGridTrackDefinition(value.trim())?.tracks ?? [];
    if (tracks.length === 0) {
        return undefined;
    }

    return tracks.map((track) => parseGridTrackSizeSpec(track, styleResolveOptions));
}

function resolveGridColumnTrackSizeSpecs(
    value: NativePropValue | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
    columnGap: number,
): Array<NativeGridColumnTrackSizeSpec | undefined> | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    const viewportWidth = styleResolveOptions.viewportWidth ?? 390;
    const autoRepeatMatch = trimmed.match(/^repeat\(\s*auto-(?:fit|fill)\s*,\s*(minmax\([^,()]+,[^,()]+\))\s*\)$/i);
    if (autoRepeatMatch) {
        const repeatedSpec = parseGridColumnTrackSizeSpec(autoRepeatMatch[1].trim(), styleResolveOptions);
        const minWidth = repeatedSpec?.width ?? repeatedSpec?.minWidth;
        if (minWidth === undefined || minWidth <= 0) {
            return undefined;
        }

        const columnCount = Math.max(1, Math.floor((viewportWidth + columnGap) / (minWidth + columnGap)));
        return Array.from({ length: columnCount }, () => repeatedSpec ? { ...repeatedSpec } : { trackWeight: 1 });
    }

    const tracks = parseNativeGridTrackDefinition(trimmed)?.tracks ?? [];
    if (tracks.length === 0) {
        return undefined;
    }

    return tracks.map((track) => parseGridColumnTrackSizeSpec(track, styleResolveOptions));
}

function isWrapEnabled(style: Record<string, NativePropValue> | undefined): boolean {
    if (!style || typeof style.flexWrap !== 'string') {
        return false;
    }

    const flexWrap = style.flexWrap.trim().toLowerCase();
    return flexWrap === 'wrap' || flexWrap === 'wrap-reverse';
}

function isRowFlexLayout(style: Record<string, NativePropValue> | undefined): boolean {
    if (!style) {
        return false;
    }

    if (typeof style.flexDirection === 'string') {
        return style.flexDirection.trim().toLowerCase() === 'row';
    }

    if (typeof style.display !== 'string') {
        return false;
    }

    const display = style.display.trim().toLowerCase();
    return display === 'flex' || display === 'inline-flex';
}

function estimateNodePreferredWidth(
    node: NativeNode,
    resolvedStyles: NativeResolvedStyleMap | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
): number {
    if (node.kind === 'text') {
        return Math.max(48, node.value.trim().length * 8);
    }

    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
    if (style?.width && isFillValue(style.width)) {
        return styleResolveOptions.viewportWidth ?? 390;
    }

    const explicitWidth = resolveAxisUnitNumber(style?.width ?? style?.minWidth, 'horizontal', undefined, styleResolveOptions);
    if (explicitWidth !== undefined && explicitWidth > 0) {
        return explicitWidth;
    }

    const fontSize = toScaledUnitNumber(style?.fontSize, styleResolveOptions) ?? 16;
    const text = flattenTextContent(node.children)
        || (typeof node.props.placeholder === 'string' ? node.props.placeholder : '');
    let baseWidth = text
        ? Math.max(56, text.length * fontSize * (node.component === 'Button' || node.component === 'Link' ? 0.58 : 0.52))
        : 0;

    switch (node.component) {
        case 'Button':
        case 'Link':
            baseWidth = Math.max(baseWidth, 120);
            break;
        case 'TextInput':
            baseWidth = Math.max(baseWidth, 220);
            break;
        case 'Toggle':
            baseWidth = Math.max(baseWidth, 56);
            break;
        default:
            baseWidth = Math.max(baseWidth, 160);
            break;
    }

    return baseWidth + estimateHorizontalPadding(style, styleResolveOptions);
}

function estimateNodePreferredHeight(
    node: NativeNode,
    resolvedStyles: NativeResolvedStyleMap | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
): number | undefined {
    if (node.kind === 'text') {
        return undefined;
    }

    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
    if (style?.height && isFillValue(style.height)) {
        return undefined;
    }

    const explicitHeight = resolveAxisUnitNumber(style?.height ?? style?.minHeight, 'vertical', undefined, styleResolveOptions);
    if (explicitHeight !== undefined && explicitHeight > 0) {
        return explicitHeight;
    }

    const fontSize = toScaledUnitNumber(style?.fontSize, styleResolveOptions) ?? 16;
    const lineHeightValue = parseCssUnitValue(style?.lineHeight);
    const lineHeight = lineHeightValue?.unit === '' && lineHeightValue.value > 0 && lineHeightValue.value <= 4
        ? fontSize * lineHeightValue.value
        : toScaledUnitNumber(style?.lineHeight, styleResolveOptions) ?? (fontSize * 1.2);
    const text = flattenTextContent(node.children)
        || (typeof node.props.placeholder === 'string' ? node.props.placeholder : '');
    const lineCount = text ? text.split(/\r?\n/).length : 0;
    let baseHeight = lineCount > 0 ? lineHeight * lineCount : 0;

    switch (node.component) {
        case 'Button':
        case 'Link':
            baseHeight = Math.max(baseHeight, 40);
            break;
        case 'TextInput':
            baseHeight = Math.max(baseHeight, 44);
            break;
        case 'Toggle':
            baseHeight = Math.max(baseHeight, 32);
            break;
        default:
            baseHeight = Math.max(baseHeight, 24);
            break;
    }

    return baseHeight + estimateVerticalPadding(style, styleResolveOptions);
}

function createNativeGridPlaceholderNode(): NativeElementNode {
    return {
        kind: 'element',
        component: 'View',
        sourceTag: 'div',
        props: {},
        events: [],
        children: [],
    };
}

function resolveGridTrackCount(value: NativePropValue | undefined): number | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const tracks = parseNativeGridTrackDefinition(value.trim())?.tracks ?? [];
    return tracks.length > 0 ? tracks.length : undefined;
}

function parseNativeGridTemplateAreas(value: NativePropValue | undefined): string[][] | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const rows = Array.from(value.matchAll(/"([^"]*)"/g))
        .map((match) => match[1].trim().split(/\s+/).filter(Boolean))
        .filter((row) => row.length > 0);
    if (rows.length === 0) {
        return undefined;
    }

    const columnCount = rows[0]?.length ?? 0;
    if (columnCount === 0 || rows.some((row) => row.length !== columnCount)) {
        return undefined;
    }

    return rows;
}

function resolveNativeGridTemplateAreaPlacements(
    value: NativePropValue | undefined,
): Map<string, NativeGridTemplateAreaPlacement> | undefined {
    const rows = parseNativeGridTemplateAreas(value);
    if (!rows) {
        return undefined;
    }

    const bounds = new Map<string, { minRow: number; maxRow: number; minColumn: number; maxColumn: number }>();
    for (const [rowIndex, row] of rows.entries()) {
        for (const [columnIndex, areaName] of row.entries()) {
            if (areaName === '.') {
                continue;
            }

            const existing = bounds.get(areaName);
            if (existing) {
                existing.minRow = Math.min(existing.minRow, rowIndex);
                existing.maxRow = Math.max(existing.maxRow, rowIndex);
                existing.minColumn = Math.min(existing.minColumn, columnIndex);
                existing.maxColumn = Math.max(existing.maxColumn, columnIndex);
            } else {
                bounds.set(areaName, {
                    minRow: rowIndex,
                    maxRow: rowIndex,
                    minColumn: columnIndex,
                    maxColumn: columnIndex,
                });
            }
        }
    }

    const placements = new Map<string, NativeGridTemplateAreaPlacement>();
    for (const [areaName, bound] of bounds.entries()) {
        let isRectangular = true;
        for (let rowIndex = bound.minRow; rowIndex <= bound.maxRow && isRectangular; rowIndex += 1) {
            for (let columnIndex = bound.minColumn; columnIndex <= bound.maxColumn; columnIndex += 1) {
                if (rows[rowIndex]?.[columnIndex] !== areaName) {
                    isRectangular = false;
                    break;
                }
            }
        }

        if (!isRectangular) {
            continue;
        }

        placements.set(areaName, {
            rowPlacement: { start: bound.minRow + 1, span: (bound.maxRow - bound.minRow) + 1 },
            columnPlacement: { start: bound.minColumn + 1, span: (bound.maxColumn - bound.minColumn) + 1 },
        });
    }

    return placements.size > 0 ? placements : undefined;
}

function resolveNativeGridAutoFlow(value: NativePropValue | undefined): { axis: 'row' | 'column'; dense: boolean } {
    if (typeof value !== 'string') {
        return { axis: 'row', dense: false };
    }

    const tokens = value
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

    return {
        axis: tokens.includes('column') ? 'column' : 'row',
        dense: tokens.includes('dense'),
    };
}

function parseNativeGridLineIndexValue(
    value: NativePropValue | undefined,
    lineNames?: Map<string, number[]>,
    explicitLineCount?: number,
): number | undefined {
    const resolveNumericLine = (lineIndex: number): number | undefined => {
        if (!Number.isInteger(lineIndex) || lineIndex === 0) {
            return undefined;
        }

        if (lineIndex > 0) {
            return lineIndex;
        }

        if (explicitLineCount === undefined || explicitLineCount <= 0) {
            return undefined;
        }

        const resolvedIndex = explicitLineCount + lineIndex + 1;
        return resolvedIndex >= 1 && resolvedIndex <= explicitLineCount ? resolvedIndex : undefined;
    };

    if (typeof value === 'number') {
        return resolveNumericLine(value);
    }

    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim().toLowerCase();
    if (!trimmed || trimmed === 'auto') {
        return undefined;
    }

    const match = trimmed.match(/^(-?\d+)$/);
    if (match) {
        return resolveNumericLine(Number(match[1]));
    }

    const namedLineMatch = trimmed.match(/^([_a-z][-_a-z0-9]*)(?:\s+(-?\d+))?$|^(-?\d+)\s+([_a-z][-_a-z0-9]*)$/i);
    if (!namedLineMatch) {
        return undefined;
    }

    const lineName = (namedLineMatch[1] ?? namedLineMatch[4])?.toLowerCase();
    const occurrence = Number(namedLineMatch[2] ?? namedLineMatch[3] ?? '1');
    if (!lineName || !Number.isFinite(occurrence) || occurrence === 0) {
        return undefined;
    }

    const namedLines = lineNames?.get(lineName);
    if (!namedLines || namedLines.length === 0) {
        return undefined;
    }

    if (occurrence > 0) {
        return namedLines.length >= occurrence ? namedLines[occurrence - 1] : undefined;
    }

    const reverseIndex = namedLines.length + occurrence;
    return reverseIndex >= 0 ? namedLines[reverseIndex] : undefined;
}

function parseNativeGridSpanValue(value: NativePropValue | undefined): number | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const match = value.trim().toLowerCase().match(/^span\s+(\d+)$/);
    return match ? Math.max(1, Number(match[1])) : undefined;
}

function resolveNativeGridPlacementValue(
    value: NativePropValue | undefined,
    lineNames?: Map<string, number[]>,
    explicitLineCount?: number,
): { start?: number; span: number } | undefined {
    const directStart = parseNativeGridLineIndexValue(value, lineNames, explicitLineCount);
    if (directStart !== undefined) {
        return { start: directStart, span: 1 };
    }

    const directSpan = parseNativeGridSpanValue(value);
    if (directSpan !== undefined) {
        return { span: directSpan };
    }

    if (typeof value !== 'string') {
        return undefined;
    }

    const tokens = value.split('/').map((entry) => entry.trim()).filter(Boolean);
    if (tokens.length === 0) {
        return undefined;
    }

    const firstStart = parseNativeGridLineIndexValue(tokens[0], lineNames, explicitLineCount);
    const firstSpan = parseNativeGridSpanValue(tokens[0]);
    const secondStart = tokens[1] ? parseNativeGridLineIndexValue(tokens[1], lineNames, explicitLineCount) : undefined;
    const secondSpan = tokens[1] ? parseNativeGridSpanValue(tokens[1]) : undefined;
    const start = firstStart ?? secondStart;
    const span = secondSpan
        ?? firstSpan
        ?? (firstStart !== undefined && secondStart !== undefined ? Math.max(1, secondStart - firstStart) : 1);

    return start !== undefined || span !== 1
        ? { ...(start !== undefined ? { start } : {}), span }
        : undefined;
}

function resolveNativeGridAreaPlacement(
    value: NativePropValue | undefined,
    rowLineNames?: Map<string, number[]>,
    columnLineNames?: Map<string, number[]>,
    rowExplicitLineCount?: number,
    columnExplicitLineCount?: number,
): { rowPlacement?: { start?: number; span: number }; columnPlacement?: { start?: number; span: number } } | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const tokens = value.split('/').map((entry) => entry.trim()).filter(Boolean);
    if (tokens.length < 2) {
        return undefined;
    }

    const rowStart = parseNativeGridLineIndexValue(tokens[0], rowLineNames, rowExplicitLineCount);
    const columnStart = parseNativeGridLineIndexValue(tokens[1], columnLineNames, columnExplicitLineCount);
    const rowEnd = tokens[2] ? parseNativeGridLineIndexValue(tokens[2], rowLineNames, rowExplicitLineCount) : undefined;
    const rowSpan = tokens[2] ? parseNativeGridSpanValue(tokens[2]) : undefined;
    const columnEnd = tokens[3] ? parseNativeGridLineIndexValue(tokens[3], columnLineNames, columnExplicitLineCount) : undefined;
    const columnSpan = tokens[3] ? parseNativeGridSpanValue(tokens[3]) : undefined;

    const rowPlacement = rowStart !== undefined || rowEnd !== undefined || rowSpan !== undefined
        ? {
            ...(rowStart !== undefined ? { start: rowStart } : {}),
            span: rowSpan ?? (rowStart !== undefined && rowEnd !== undefined ? Math.max(1, rowEnd - rowStart) : 1),
        }
        : undefined;
    const columnPlacement = columnStart !== undefined || columnEnd !== undefined || columnSpan !== undefined
        ? {
            ...(columnStart !== undefined ? { start: columnStart } : {}),
            span: columnSpan ?? (columnStart !== undefined && columnEnd !== undefined ? Math.max(1, columnEnd - columnStart) : 1),
        }
        : undefined;

    return rowPlacement || columnPlacement
        ? {
            ...(rowPlacement ? { rowPlacement } : {}),
            ...(columnPlacement ? { columnPlacement } : {}),
        }
        : undefined;
}

function resolveNativeGridChildPlacement(
    node: NativeNode,
    resolvedStyles: NativeResolvedStyleMap | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
    templateAreaPlacements?: Map<string, NativeGridTemplateAreaPlacement>,
    columnLineNames?: Map<string, number[]>,
    rowLineNames?: Map<string, number[]>,
    columnExplicitLineCount?: number,
    rowExplicitLineCount?: number,
): { columnStart?: number; columnSpan: number; rowStart?: number; rowSpan: number } {
    if (node.kind !== 'element') {
        return { columnSpan: 1, rowSpan: 1 };
    }

    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
    const areaPlacement = resolveNativeGridAreaPlacement(style?.gridArea, rowLineNames, columnLineNames, rowExplicitLineCount, columnExplicitLineCount)
        ?? (() => {
            if (typeof style?.gridArea !== 'string' || !templateAreaPlacements) {
                return undefined;
            }

            return templateAreaPlacements.get(style.gridArea.trim());
        })();
    const columnPlacement = resolveNativeGridPlacementValue(style?.gridColumn, columnLineNames, columnExplicitLineCount)
        ?? areaPlacement?.columnPlacement
        ?? (() => {
            const start = parseNativeGridLineIndexValue(style?.gridColumnStart, columnLineNames, columnExplicitLineCount);
            const end = parseNativeGridLineIndexValue(style?.gridColumnEnd, columnLineNames, columnExplicitLineCount);
            const span = parseNativeGridSpanValue(style?.gridColumnEnd);
            if (start !== undefined || end !== undefined || span !== undefined) {
                return { ...(start !== undefined ? { start } : {}), span: span ?? (start !== undefined && end !== undefined ? Math.max(1, end - start) : 1) };
            }
            return undefined;
        })();
    const rowPlacement = resolveNativeGridPlacementValue(style?.gridRow, rowLineNames, rowExplicitLineCount)
        ?? areaPlacement?.rowPlacement
        ?? (() => {
            const start = parseNativeGridLineIndexValue(style?.gridRowStart, rowLineNames, rowExplicitLineCount);
            const end = parseNativeGridLineIndexValue(style?.gridRowEnd, rowLineNames, rowExplicitLineCount);
            const span = parseNativeGridSpanValue(style?.gridRowEnd);
            if (start !== undefined || end !== undefined || span !== undefined) {
                return { ...(start !== undefined ? { start } : {}), span: span ?? (start !== undefined && end !== undefined ? Math.max(1, end - start) : 1) };
            }
            return undefined;
        })();

    return {
        ...(columnPlacement?.start !== undefined ? { columnStart: columnPlacement.start } : {}),
        columnSpan: Math.max(1, columnPlacement?.span ?? 1),
        ...(rowPlacement?.start !== undefined ? { rowStart: rowPlacement.start } : {}),
        rowSpan: Math.max(1, rowPlacement?.span ?? 1),
    };
}

interface NativeGridPlacementCell {
    node?: NativeNode;
    columnSpan?: number;
    coveredInline?: boolean;
    occupiedByRowSpan?: boolean;
}

function chunkNodesIntoGridRows(
    nodes: NativeNode[],
    explicitColumnSizing: Array<NativeGridColumnTrackSizeSpec | undefined>,
    minimumRowCount: number,
    autoFlow: { axis: 'row' | 'column'; dense: boolean },
    rowGap: number,
    columnGap: number,
    explicitRowSizing: Array<NativeGridTrackSizeSpec | undefined>,
    autoRowSizing: NativeGridTrackSizeSpec | undefined,
    autoColumnSizing: NativeGridColumnTrackSizeSpec | undefined,
    resolvedStyles: NativeResolvedStyleMap | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
    templateAreaPlacements?: Map<string, NativeGridTemplateAreaPlacement>,
    columnLineNames?: Map<string, number[]>,
    rowLineNames?: Map<string, number[]>,
    columnExplicitLineCount?: number,
    rowExplicitLineCount?: number,
): NativeChunkedRow[] {
    const defaultAutoColumnSizing = autoColumnSizing ? { ...autoColumnSizing } : { trackWeight: 1 };
    const placementColumnSizing = explicitColumnSizing.length > 0
        ? explicitColumnSizing.map((spec) => spec ? { ...spec } : { trackWeight: 1 })
        : [{ ...defaultAutoColumnSizing }];
    const placementRows: NativeGridPlacementCell[][] = [];
    const placements: Array<{ node: NativeNode; rowIndex: number; rowSpan: number; columnIndex: number; columnSpan: number }> = [];
    const canUseColumnAutoFlow = autoFlow.axis === 'column' && minimumRowCount > 0;

    const getColumnCount = (): number => Math.max(1, placementColumnSizing.length);

    const ensurePlacementColumns = (count: number): void => {
        while (placementColumnSizing.length < count) {
            placementColumnSizing.push({ ...defaultAutoColumnSizing });
        }

        for (const placementRow of placementRows) {
            while (placementRow.length < getColumnCount()) {
                placementRow.push({});
            }
        }
    };

    const ensurePlacementRows = (count: number): void => {
        while (placementRows.length < count) {
            placementRows.push(Array.from({ length: getColumnCount() }, () => ({})));
        }
    };

    const isPlacementCellOccupied = (cell: NativeGridPlacementCell | undefined): boolean => {
        return Boolean(cell && (cell.node || cell.coveredInline || cell.occupiedByRowSpan));
    };

    const canPlaceNodeAt = (rowIndex: number, columnIndex: number, columnSpan: number, rowSpan: number): boolean => {
        if (columnIndex < 0 || columnIndex + columnSpan > getColumnCount()) {
            return false;
        }

        ensurePlacementRows(rowIndex + rowSpan);
        for (let targetRow = rowIndex; targetRow < rowIndex + rowSpan; targetRow += 1) {
            for (let targetColumn = columnIndex; targetColumn < columnIndex + columnSpan; targetColumn += 1) {
                if (isPlacementCellOccupied(placementRows[targetRow]?.[targetColumn])) {
                    return false;
                }
            }
        }

        return true;
    };

    const markNodePlacement = (node: NativeNode, rowIndex: number, columnIndex: number, columnSpan: number, rowSpan: number): void => {
        ensurePlacementRows(rowIndex + rowSpan);
        placementRows[rowIndex]![columnIndex] = { node, columnSpan };

        for (let coveredColumn = columnIndex + 1; coveredColumn < columnIndex + columnSpan; coveredColumn += 1) {
            placementRows[rowIndex]![coveredColumn] = { coveredInline: true };
        }

        for (let coveredRow = rowIndex + 1; coveredRow < rowIndex + rowSpan; coveredRow += 1) {
            for (let coveredColumn = columnIndex; coveredColumn < columnIndex + columnSpan; coveredColumn += 1) {
                placementRows[coveredRow]![coveredColumn] = { occupiedByRowSpan: true };
            }
        }
    };

    ensurePlacementRows(Math.max(1, minimumRowCount));
    let autoRowIndex = 0;
    let autoColumnIndex = 0;

    const findLegacyPlacement = (
        placement: { columnStart?: number; columnSpan: number; rowStart?: number; rowSpan: number },
    ): { rowIndex: number; columnIndex: number } => {
        const preferredRowIndex = placement.rowStart !== undefined ? Math.max(0, placement.rowStart - 1) : undefined;
        const preferredColumnIndex = placement.columnStart !== undefined ? Math.max(0, placement.columnStart - 1) : undefined;
        let resolvedRowIndex = preferredRowIndex ?? autoRowIndex;
        let resolvedColumnIndex: number | undefined;

        while (resolvedColumnIndex === undefined) {
            ensurePlacementRows(resolvedRowIndex + placement.rowSpan);

            if (preferredColumnIndex !== undefined) {
                ensurePlacementColumns(preferredColumnIndex + placement.columnSpan);
                resolvedColumnIndex = canPlaceNodeAt(resolvedRowIndex, preferredColumnIndex, placement.columnSpan, placement.rowSpan)
                    ? preferredColumnIndex
                    : undefined;
            } else {
                const searchStart = preferredRowIndex === undefined && resolvedRowIndex === autoRowIndex ? autoColumnIndex : undefined;
                for (let columnIndex = searchStart ?? 0; columnIndex <= getColumnCount() - placement.columnSpan; columnIndex += 1) {
                    if (canPlaceNodeAt(resolvedRowIndex, columnIndex, placement.columnSpan, placement.rowSpan)) {
                        resolvedColumnIndex = columnIndex;
                        break;
                    }
                }
            }

            if (resolvedColumnIndex === undefined) {
                resolvedRowIndex += 1;
            }
        }

        return {
            rowIndex: resolvedRowIndex,
            columnIndex: resolvedColumnIndex,
        };
    };

    const findAutoPlacement = (columnSpan: number, rowSpan: number): { rowIndex: number; columnIndex: number } => {
        if (canUseColumnAutoFlow) {
            const rowLimit = Math.max(1, minimumRowCount);
            let searchColumnIndex = autoFlow.dense ? 0 : autoColumnIndex;
            const initialRowIndex = autoFlow.dense ? 0 : autoRowIndex;

            while (true) {
                const maxRowIndex = Math.max(0, Math.max(rowLimit, rowSpan) - rowSpan);
                const rowStart = searchColumnIndex === (autoFlow.dense ? 0 : autoColumnIndex)
                    ? Math.min(initialRowIndex, maxRowIndex)
                    : 0;
                ensurePlacementColumns(searchColumnIndex + columnSpan);

                for (let rowIndex = rowStart; rowIndex <= maxRowIndex; rowIndex += 1) {
                    if (canPlaceNodeAt(rowIndex, searchColumnIndex, columnSpan, rowSpan)) {
                        return { rowIndex, columnIndex: searchColumnIndex };
                    }
                }

                searchColumnIndex += 1;
            }
        }

        let searchRowIndex = autoFlow.dense ? 0 : autoRowIndex;
        const initialColumnIndex = autoFlow.dense ? 0 : autoColumnIndex;

        while (true) {
            ensurePlacementRows(searchRowIndex + rowSpan);

            const columnStart = searchRowIndex === (autoFlow.dense ? 0 : autoRowIndex)
                ? initialColumnIndex
                : 0;
            for (let columnIndex = columnStart; columnIndex <= getColumnCount() - columnSpan; columnIndex += 1) {
                if (canPlaceNodeAt(searchRowIndex, columnIndex, columnSpan, rowSpan)) {
                    return { rowIndex: searchRowIndex, columnIndex };
                }
            }

            searchRowIndex += 1;
        }
    };

    for (const node of nodes) {
        const placement = resolveNativeGridChildPlacement(
            node,
            resolvedStyles,
            styleResolveOptions,
            templateAreaPlacements,
            columnLineNames,
            rowLineNames,
            columnExplicitLineCount,
            rowExplicitLineCount,
        );
        if (placement.columnStart !== undefined) {
            ensurePlacementColumns(placement.columnStart + Math.max(0, placement.columnSpan - 1));
        }

        const columnSpan = Math.min(getColumnCount(), placement.columnSpan);
        const rowSpan = Math.max(1, placement.rowSpan);
        const hasExplicitPlacement = placement.rowStart !== undefined || placement.columnStart !== undefined;
        const { rowIndex: resolvedRowIndex, columnIndex: resolvedColumnIndex } = hasExplicitPlacement
            ? findLegacyPlacement(placement)
            : findAutoPlacement(columnSpan, rowSpan);

        markNodePlacement(node, resolvedRowIndex, resolvedColumnIndex, columnSpan, rowSpan);
        placements.push({ node, rowIndex: resolvedRowIndex, rowSpan, columnIndex: resolvedColumnIndex, columnSpan });

        if (!hasExplicitPlacement) {
            if (canUseColumnAutoFlow) {
                const rowLimit = Math.max(1, minimumRowCount);
                autoColumnIndex = resolvedColumnIndex;
                autoRowIndex = resolvedRowIndex + rowSpan;
                if (autoRowIndex >= rowLimit) {
                    autoColumnIndex += 1;
                    ensurePlacementColumns(autoColumnIndex + 1);
                    autoRowIndex = 0;
                }
            } else {
                autoRowIndex = resolvedRowIndex;
                autoColumnIndex = resolvedColumnIndex + columnSpan;
                while (autoColumnIndex >= getColumnCount()) {
                    autoRowIndex += 1;
                    autoColumnIndex -= getColumnCount();
                }
            }
        }
    }

    const resolveRowSizing = (rowIndex: number): NativeGridTrackSizeSpec | undefined => {
        return explicitRowSizing[rowIndex] ?? autoRowSizing;
    };

    const resolvedRowSizing = placementRows.map((_, rowIndex) => ({ ...(resolveRowSizing(rowIndex) ?? {}) }));
    const resolvedColumnSizing = placementColumnSizing.map((spec) => ({ ...(spec ?? {}) }));

    const resolveIntrinsicRowHeight = (rowIndex: number): number | undefined => {
        let preferredHeight: number | undefined;

        for (const placement of placements) {
            if (placement.rowIndex !== rowIndex || placement.rowSpan !== 1) {
                continue;
            }

            const nextHeight = estimateNodePreferredHeight(placement.node, resolvedStyles, styleResolveOptions);
            if (nextHeight === undefined || nextHeight <= 0) {
                continue;
            }

            preferredHeight = preferredHeight === undefined
                ? nextHeight
                : Math.max(preferredHeight, nextHeight);
        }

        return preferredHeight;
    };

    for (const [rowIndex, rowSizing] of resolvedRowSizing.entries()) {
        const preferredHeight = resolveIntrinsicRowHeight(rowIndex);
        if (preferredHeight === undefined || preferredHeight <= 0) {
            continue;
        }

        if (rowSizing.intrinsicHeight) {
            rowSizing.height = preferredHeight;
            rowSizing.minHeight = preferredHeight;
        }

        if (rowSizing.intrinsicMinHeight) {
            rowSizing.minHeight = Math.max(rowSizing.minHeight ?? 0, preferredHeight);
        }

        if (rowSizing.intrinsicMaxHeight) {
            rowSizing.maxHeight = rowSizing.maxHeight !== undefined
                ? Math.min(rowSizing.maxHeight, preferredHeight)
                : preferredHeight;
        }
    }

    const resolveIntrinsicColumnWidth = (columnIndex: number): number | undefined => {
        let preferredWidth: number | undefined;

        for (const placement of placements) {
            if (placement.columnIndex !== columnIndex || placement.columnSpan !== 1) {
                continue;
            }

            const nextWidth = estimateNodePreferredWidth(placement.node, resolvedStyles, styleResolveOptions);
            if (nextWidth <= 0) {
                continue;
            }

            preferredWidth = preferredWidth === undefined
                ? nextWidth
                : Math.max(preferredWidth, nextWidth);
        }

        return preferredWidth;
    };

    for (const [columnIndex, columnSizing] of resolvedColumnSizing.entries()) {
        const preferredWidth = resolveIntrinsicColumnWidth(columnIndex);
        if (preferredWidth === undefined || preferredWidth <= 0) {
            continue;
        }

        if (columnSizing.intrinsicWidth) {
            columnSizing.width = preferredWidth;
            columnSizing.minWidth = preferredWidth;
        }

        if (columnSizing.intrinsicMinWidth) {
            columnSizing.minWidth = Math.max(columnSizing.minWidth ?? 0, preferredWidth);
        }

        if (columnSizing.intrinsicMaxWidth) {
            columnSizing.maxWidth = columnSizing.maxWidth !== undefined
                ? Math.min(columnSizing.maxWidth, preferredWidth)
                : preferredWidth;
        }
    }

    for (const placement of placements) {
        if (placement.rowSpan <= 1) {
            continue;
        }

        const preferredHeight = estimateNodePreferredHeight(placement.node, resolvedStyles, styleResolveOptions);
        if (preferredHeight === undefined || preferredHeight <= 0) {
            continue;
        }

        const spanRowIndexes = Array.from({ length: placement.rowSpan }, (_, offset) => placement.rowIndex + offset);
        const baseHeight = spanRowIndexes.reduce((sum, rowIndex) => {
            const rowSizing = resolvedRowSizing[rowIndex] ?? {};
            return sum + (rowSizing.height ?? rowSizing.minHeight ?? 0);
        }, 0);
        let remainingHeight = preferredHeight - (Math.max(0, placement.rowSpan - 1) * rowGap) - baseHeight;
        if (remainingHeight <= 0) {
            continue;
        }

        const adjustableRowIndexes = spanRowIndexes.filter((rowIndex) => {
            const rowSizing = resolvedRowSizing[rowIndex] ?? {};
            return rowSizing.height === undefined && rowSizing.trackWeight === undefined;
        });
        if (adjustableRowIndexes.length === 0) {
            continue;
        }

        const additionalHeightPerRow = remainingHeight / adjustableRowIndexes.length;
        for (const rowIndex of adjustableRowIndexes) {
            const rowSizing = resolvedRowSizing[rowIndex] ?? {};
            const currentMinHeight = rowSizing.minHeight ?? 0;
            const targetMinHeight = currentMinHeight + additionalHeightPerRow;
            const nextMinHeight = rowSizing.maxHeight !== undefined
                ? Math.min(rowSizing.maxHeight, targetMinHeight)
                : targetMinHeight;
            if (nextMinHeight > currentMinHeight) {
                rowSizing.minHeight = nextMinHeight;
                resolvedRowSizing[rowIndex] = rowSizing;
                remainingHeight -= (nextMinHeight - currentMinHeight);
            }
        }
    }

    for (const placement of placements) {
        if (placement.columnSpan <= 1) {
            continue;
        }

        const preferredWidth = estimateNodePreferredWidth(placement.node, resolvedStyles, styleResolveOptions);
        if (preferredWidth <= 0) {
            continue;
        }

        const spanColumnIndexes = Array.from({ length: placement.columnSpan }, (_, offset) => placement.columnIndex + offset);
        const baseWidth = spanColumnIndexes.reduce((sum, columnIndex) => {
            const columnSizing = resolvedColumnSizing[columnIndex] ?? {};
            return sum + (columnSizing.width ?? columnSizing.minWidth ?? 0);
        }, 0);
        let remainingWidth = preferredWidth - (Math.max(0, placement.columnSpan - 1) * columnGap) - baseWidth;
        if (remainingWidth <= 0) {
            continue;
        }

        const adjustableColumnIndexes = spanColumnIndexes.filter((columnIndex) => {
            const columnSizing = resolvedColumnSizing[columnIndex] ?? {};
            return columnSizing.width === undefined;
        });
        if (adjustableColumnIndexes.length === 0) {
            continue;
        }

        const additionalWidthPerColumn = remainingWidth / adjustableColumnIndexes.length;
        for (const columnIndex of adjustableColumnIndexes) {
            const columnSizing = resolvedColumnSizing[columnIndex] ?? {};
            const currentMinWidth = columnSizing.minWidth ?? 0;
            const targetMinWidth = currentMinWidth + additionalWidthPerColumn;
            const nextMinWidth = columnSizing.maxWidth !== undefined
                ? Math.min(columnSizing.maxWidth, targetMinWidth)
                : targetMinWidth;
            if (nextMinWidth > currentMinWidth) {
                columnSizing.minWidth = nextMinWidth;
                resolvedColumnSizing[columnIndex] = columnSizing;
                remainingWidth -= (nextMinWidth - currentMinWidth);
            }
        }
    }

    const rows: NativeChunkedRow[] = [];

    const aggregateColumnSizing = (
        specs: Array<NativeGridColumnTrackSizeSpec | undefined>,
    ): NativeGridColumnTrackSizeSpec | undefined => {
        let exactWidth = 0;
        let canUseExactWidth = specs.length > 0;
        let minWidth = 0;
        let hasMinWidth = false;
        let maxWidth = 0;
        let canUseMaxWidth = specs.length > 0;
        let hasMaxWidth = false;
        let trackWeight: number | undefined;

        for (const spec of specs) {
            if (!spec) {
                canUseExactWidth = false;
                canUseMaxWidth = false;
                continue;
            }

            if (spec.width !== undefined) {
                exactWidth += spec.width;
                minWidth += spec.width;
                maxWidth += spec.width;
                hasMinWidth = true;
                hasMaxWidth = true;
            } else {
                canUseExactWidth = false;

                if (spec.minWidth !== undefined) {
                    minWidth += spec.minWidth;
                    hasMinWidth = true;
                }

                if (spec.maxWidth !== undefined) {
                    maxWidth += spec.maxWidth;
                    hasMaxWidth = true;
                } else {
                    canUseMaxWidth = false;
                }
            }

            if (spec.trackWeight !== undefined && spec.trackWeight > 0) {
                trackWeight = (trackWeight ?? 0) + spec.trackWeight;
            }
        }

        const internalGap = specs.length > 1 ? columnGap * (specs.length - 1) : 0;
        const aggregated: NativeGridColumnTrackSizeSpec = {};
        if (canUseExactWidth && exactWidth > 0) {
            aggregated.width = exactWidth + internalGap;
        } else {
            if (hasMinWidth) {
                aggregated.minWidth = minWidth + internalGap;
            } else if (internalGap > 0 && trackWeight === undefined) {
                aggregated.minWidth = internalGap;
            }
            if (canUseMaxWidth && hasMaxWidth) {
                aggregated.maxWidth = maxWidth + internalGap;
            }
        }

        if (trackWeight !== undefined) {
            aggregated.trackWeight = trackWeight;
        }

        return Object.keys(aggregated).length > 0 ? aggregated : undefined;
    };

    for (const [rowIndex, placementRow] of placementRows.entries()) {
        const items: NativeNode[] = [];
        const rowWeights: Array<number | undefined> = [];
        const rowColumnSizes: Array<NativeGridColumnTrackSizeSpec | undefined> = [];

        for (let columnIndex = 0; columnIndex < getColumnCount(); columnIndex += 1) {
            const cell = placementRow[columnIndex];
            if (cell?.coveredInline) {
                continue;
            }

            if (cell?.node) {
                const span = Math.max(1, cell.columnSpan ?? 1);
                const aggregatedColumnSizing = aggregateColumnSizing(resolvedColumnSizing.slice(columnIndex, columnIndex + span));
                items.push(cell.node);
                rowColumnSizes.push(aggregatedColumnSizing);
                rowWeights.push(aggregatedColumnSizing?.trackWeight);
                continue;
            }

            const aggregatedColumnSizing = aggregateColumnSizing(resolvedColumnSizing.slice(columnIndex, columnIndex + 1));
            items.push(createNativeGridPlaceholderNode());
            rowColumnSizes.push(aggregatedColumnSizing);
            rowWeights.push(aggregatedColumnSizing?.trackWeight);
        }

        const rowSizing = resolvedRowSizing[rowIndex];
        rows.push({
            items,
            weights: rowWeights,
            columnSizes: rowColumnSizes,
            ...(rowSizing?.minHeight !== undefined ? { minHeight: rowSizing.minHeight } : {}),
            ...(rowSizing?.height !== undefined ? { height: rowSizing.height } : {}),
            ...(rowSizing?.maxHeight !== undefined && rowSizing.height === undefined ? { maxHeight: rowSizing.maxHeight } : {}),
            ...(rowSizing?.trackWeight !== undefined ? { trackWeight: rowSizing.trackWeight } : {}),
            ...(rowSizing?.stretchEligible ? { stretchEligible: true } : {}),
        });
    }

    return rows;
}

function resolveNativeStretchChunkedRows(
    rows: NativeChunkedRow[],
    contentAlignment: NativeContentStackAlignment | undefined,
): NativeChunkedRow[] {
    if (contentAlignment !== 'stretch') {
        return rows;
    }

    return rows.map((row) => row.trackWeight === undefined && row.stretchEligible && row.height === undefined
        ? { ...row, trackWeight: 1 }
        : row);
}

function resolveEffectiveChunkedContentAlignment(layout: NativeChunkedLayout): NativeContentStackAlignment | undefined {
    return layout.kind === 'grid' && layout.rows.some((row) => row.trackWeight !== undefined)
        ? undefined
        : layout.contentAlignment;
}

function chunkNodesIntoWrappedRows(
    nodes: NativeNode[],
    availableWidth: number,
    columnGap: number,
    resolvedStyles: NativeResolvedStyleMap | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
): NativeNode[][] {
    const rows: NativeNode[][] = [];
    let currentRow: NativeNode[] = [];
    let currentWidth = 0;

    for (const node of nodes) {
        const preferredWidth = estimateNodePreferredWidth(node, resolvedStyles, styleResolveOptions);
        const nextWidth = currentRow.length === 0
            ? preferredWidth
            : currentWidth + columnGap + preferredWidth;

        if (currentRow.length > 0 && nextWidth > availableWidth) {
            rows.push(currentRow);
            currentRow = [node];
            currentWidth = preferredWidth;
            continue;
        }

        currentRow.push(node);
        currentWidth = nextWidth;
    }

    if (currentRow.length > 0) {
        rows.push(currentRow);
    }

    return rows;
}

function resolveChunkedLayout(
    node: NativeElementNode,
    resolvedStyles: NativeResolvedStyleMap | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
): NativeChunkedLayout | undefined {
    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
    if (!style) {
        return undefined;
    }

    const orderedChildren = getOrderedNativeChildren(node, node.children, resolvedStyles, styleResolveOptions);
    const viewportWidth = styleResolveOptions.viewportWidth ?? 390;
    const rowGap = toScaledUnitNumber(style.rowGap ?? style.gap, styleResolveOptions);
    const columnGap = toScaledUnitNumber(style.columnGap ?? style.gap, styleResolveOptions) ?? rowGap ?? 0;
    const display = typeof style.display === 'string' ? style.display.trim().toLowerCase() : undefined;

    if (display === 'grid' || display === 'inline-grid') {
        const columnSizing = resolveGridColumnTrackSizeSpecs(style.gridTemplateColumns, styleResolveOptions, columnGap);
        if (columnSizing && columnSizing.length > 0) {
            const columnTracks = typeof style.gridTemplateColumns === 'string'
                ? parseNativeGridTrackDefinition(style.gridTemplateColumns)
                : undefined;
            const rowTracks = typeof style.gridTemplateRows === 'string'
                ? parseNativeGridTrackDefinition(style.gridTemplateRows)
                : undefined;
            const columnExplicitLineCount = columnTracks?.lineCount ?? (columnSizing.length > 0 ? columnSizing.length + 1 : undefined);
            const explicitRowCount = resolveGridTrackCount(style.gridTemplateRows);
            const rowExplicitLineCount = rowTracks?.lineCount ?? (explicitRowCount !== undefined && explicitRowCount > 0 ? explicitRowCount + 1 : undefined);
            const contentAlignment = resolveNativeAlignContent(style);
            return {
                kind: 'grid',
                rows: resolveNativeStretchChunkedRows(
                    chunkNodesIntoGridRows(
                        orderedChildren,
                        columnSizing,
                        explicitRowCount ?? 0,
                        resolveNativeGridAutoFlow(style.gridAutoFlow),
                        rowGap ?? 0,
                        columnGap,
                        resolveGridTrackSizeSpecs(style.gridTemplateRows, styleResolveOptions) ?? [],
                        parseGridTrackSizeSpec(String(style.gridAutoRows ?? '').trim(), styleResolveOptions),
                        parseGridColumnTrackSizeSpec(String(style.gridAutoColumns ?? '').trim(), styleResolveOptions),
                        resolvedStyles,
                        styleResolveOptions,
                        resolveNativeGridTemplateAreaPlacements(style.gridTemplateAreas),
                        columnTracks?.lineNames,
                        rowTracks?.lineNames,
                        columnExplicitLineCount,
                        rowExplicitLineCount,
                    ),
                    contentAlignment,
                ),
                rowGap,
                columnGap,
                contentAlignment,
            };
        }
    }

    if (node.children.length < 2) {
        return undefined;
    }

    if (isWrapEnabled(style) && isRowFlexLayout(style)) {
        const availableWidth = Math.max(160, viewportWidth - estimateHorizontalPadding(style, styleResolveOptions));
        const rows = chunkNodesIntoWrappedRows(orderedChildren, availableWidth, columnGap, resolvedStyles, styleResolveOptions);
        if (rows.length > 1) {
            return {
                kind: 'wrap',
                rows: rows.map((items) => ({ items })),
                rowGap: rowGap ?? columnGap,
                columnGap,
                contentAlignment: resolveNativeAlignContent(style),
            };
        }
    }

    return undefined;
}

function shouldFillChunkedCellChild(node: NativeNode): boolean {
    if (node.kind !== 'element') {
        return false;
    }

    return !FILL_WIDTH_EXCLUDED_COMPONENTS.has(node.component);
}

function hasNativeContainerSpacing(
    style: Record<string, NativePropValue>,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): boolean {
    return [
        style.padding,
        style.paddingHorizontal,
        style.paddingVertical,
        style.paddingTop,
        style.paddingRight,
        style.paddingBottom,
        style.paddingLeft,
        style.paddingStart,
        style.paddingEnd,
        style.gap,
        style.rowGap,
        style.columnGap,
    ].some((value) => toScaledUnitNumber(value, styleResolveOptions) !== undefined);
}

function hasNativeContainerDecoration(
    style: Record<string, NativePropValue>,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): boolean {
    return resolveNativeBackgroundLayersFromStyle(style, styleResolveOptions).length > 0
        || resolveBackdropBlurRadius(style, styleResolveOptions) !== undefined
        || resolveNativeBorder(style, (value) => toDpLiteral(value, styleResolveOptions)) !== undefined
        || parseBoxShadowList(style.boxShadow, resolveStyleCurrentColor(style)).length > 0;
}

function shouldDefaultFillWidthHint(
    node: NativeNode,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): boolean {
    if (node.kind !== 'element' || !shouldFillChunkedCellChild(node)) {
        return false;
    }

    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
    const display = typeof style?.display === 'string'
        ? style.display.trim().toLowerCase()
        : undefined;

    if (display && INLINE_DISPLAY_VALUES.has(display)) {
        return false;
    }

    if (display === 'flex' || display === 'grid' || typeof style?.flexDirection === 'string') {
        return true;
    }

    if (style && (hasNativeContainerSpacing(style, styleResolveOptions) || hasNativeContainerDecoration(style, styleResolveOptions))) {
        return true;
    }

    return DEFAULT_BLOCK_FILL_SOURCE_TAGS.has(node.sourceTag);
}

function isFillValue(value: NativePropValue | undefined): boolean {
    return typeof value === 'string' && value.trim() === '100%';
}

function extractColorToken(value: string): string | undefined {
    const trimmed = value.trim();
    const directMatch = trimmed.match(/^((?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\([^()]+\)|#[0-9a-fA-F]{3,8}|currentcolor)$/i);
    if (directMatch) {
        return directMatch[1];
    }

    const normalized = trimmed.toLowerCase();
    if (normalized === CURRENT_COLOR_KEYWORD) {
        return normalized;
    }

    if (CSS_NAMED_COLORS[normalized]) {
        return normalized;
    }

    const embeddedMatch = trimmed.match(/((?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\([^()]+\)|#[0-9a-fA-F]{3,8}|currentcolor)/i);
    if (embeddedMatch) {
        return embeddedMatch[1];
    }

    const firstParenIdx = trimmed.indexOf('(');
    if (firstParenIdx > 0) {
        let nameStart = firstParenIdx;
        while (nameStart > 0 && trimmed[nameStart - 1] !== ' ' && trimmed[nameStart - 1] !== '\t') {
            nameStart--;
        }
        const functionName = trimmed.slice(nameStart, firstParenIdx).toLowerCase();
        if (
            functionName !== 'rgb'
            && functionName !== 'rgba'
            && functionName !== 'hsl'
            && functionName !== 'hsla'
            && functionName !== 'hwb'
            && functionName !== 'lab'
            && functionName !== 'lch'
            && functionName !== 'oklab'
            && functionName !== 'oklch'
        ) {
            return undefined;
        }
    }

    return trimmed
        .toLowerCase()
        .split(/[^a-z-]+/)
        .find((token) => token.length > 0 && (token === CURRENT_COLOR_KEYWORD || Boolean(CSS_NAMED_COLORS[token])));
}

function parseCssHue(value: string): number | undefined {
    const match = value.trim().toLowerCase().match(/^(-?(?:\d+\.?\d*|\.\d+))(deg|grad|rad|turn)?$/);
    if (!match) {
        return undefined;
    }

    const numericValue = Number(match[1]);
    if (!Number.isFinite(numericValue)) {
        return undefined;
    }

    switch (match[2] ?? 'deg') {
        case 'turn':
            return numericValue * 360;
        case 'rad':
            return numericValue * (180 / Math.PI);
        case 'grad':
            return numericValue * 0.9;
        default:
            return numericValue;
    }
}

function parseCssPercentageChannel(value: string): number | undefined {
    const match = value.trim().match(/^(-?(?:\d+\.?\d*|\.\d+))%$/);
    if (!match) {
        return undefined;
    }

    const numericValue = Number(match[1]);
    return Number.isFinite(numericValue) ? Math.max(0, Math.min(100, numericValue)) / 100 : undefined;
}

function parseCssAlphaValue(value: string): number | undefined {
    const trimmed = value.trim();
    if (trimmed.endsWith('%')) {
        const percentage = Number(trimmed.slice(0, -1));
        return Number.isFinite(percentage) ? Math.max(0, Math.min(100, percentage)) / 100 : undefined;
    }

    const numericValue = Number(trimmed);
    return Number.isFinite(numericValue) ? Math.max(0, Math.min(1, numericValue)) : undefined;
}

function parseCssNumericChannel(value: string): number | undefined {
    const numericValue = Number(value.trim());
    return Number.isFinite(numericValue) ? numericValue : undefined;
}

function parseCssNonNegativeNumericChannel(value: string): number | undefined {
    const numericValue = parseCssNumericChannel(value);
    return numericValue !== undefined ? Math.max(0, numericValue) : undefined;
}

function parseCssLabLightness(value: string): number | undefined {
    const trimmed = value.trim();
    if (trimmed.endsWith('%')) {
        const percentage = Number(trimmed.slice(0, -1));
        return Number.isFinite(percentage) ? Math.max(0, Math.min(100, percentage)) : undefined;
    }

    const numericValue = Number(trimmed);
    return Number.isFinite(numericValue) ? Math.max(0, Math.min(100, numericValue)) : undefined;
}

function parseCssOklabLightness(value: string): number | undefined {
    const trimmed = value.trim();
    if (trimmed.endsWith('%')) {
        const percentage = Number(trimmed.slice(0, -1));
        return Number.isFinite(percentage) ? Math.max(0, Math.min(100, percentage)) / 100 : undefined;
    }

    const numericValue = Number(trimmed);
    if (!Number.isFinite(numericValue)) {
        return undefined;
    }

    const normalized = Math.abs(numericValue) > 1 ? numericValue / 100 : numericValue;
    return Math.max(0, Math.min(1, normalized));
}

function parseCssColorFunctionArguments(value: string): string[] {
    const trimmed = value.trim();
    if (!trimmed) {
        return [];
    }

    if (trimmed.includes(',')) {
        return splitCssFunctionArguments(trimmed).map((part) => part.trim()).filter(Boolean);
    }

    const alphaSplit = trimmed.split(/\s*\/\s*/).map((part) => part.trim()).filter(Boolean);
    if (alphaSplit.length === 0 || alphaSplit.length > 2) {
        return [];
    }

    const channels = alphaSplit[0].split(/\s+/).filter(Boolean);
    return alphaSplit[1] ? [...channels, alphaSplit[1]] : channels;
}

function parseCssRgbChannel(value: string): number | undefined {
    const trimmed = value.trim();
    if (trimmed.endsWith('%')) {
        const percentage = Number(trimmed.slice(0, -1));
        return Number.isFinite(percentage)
            ? Math.round((Math.max(0, Math.min(100, percentage)) / 100) * 255)
            : undefined;
    }

    const numericValue = Number(trimmed);
    return Number.isFinite(numericValue)
        ? Math.round(Math.max(0, Math.min(255, numericValue)))
        : undefined;
}

function hslToRgb(hue: number, saturation: number, lightness: number): { red: number; green: number; blue: number } {
    const normalizedHue = ((hue % 360) + 360) % 360;
    const chroma = (1 - Math.abs((2 * lightness) - 1)) * saturation;
    const segment = normalizedHue / 60;
    const x = chroma * (1 - Math.abs((segment % 2) - 1));

    const [redPrime, greenPrime, bluePrime] = segment < 1
        ? [chroma, x, 0]
        : segment < 2
            ? [x, chroma, 0]
            : segment < 3
                ? [0, chroma, x]
                : segment < 4
                    ? [0, x, chroma]
                    : segment < 5
                        ? [x, 0, chroma]
                        : [chroma, 0, x];

    const adjustment = lightness - (chroma / 2);
    return {
        red: Math.round((redPrime + adjustment) * 255),
        green: Math.round((greenPrime + adjustment) * 255),
        blue: Math.round((bluePrime + adjustment) * 255),
    };
}

function hwbToRgb(hue: number, whiteness: number, blackness: number): { red: number; green: number; blue: number } {
    const sum = whiteness + blackness;
    const normalizedWhiteness = sum > 1 ? whiteness / sum : whiteness;
    const normalizedBlackness = sum > 1 ? blackness / sum : blackness;
    const pureHue = hslToRgb(hue, 1, 0.5);
    const factor = Math.max(0, 1 - normalizedWhiteness - normalizedBlackness);

    return {
        red: Math.round(((pureHue.red / 255) * factor + normalizedWhiteness) * 255),
        green: Math.round(((pureHue.green / 255) * factor + normalizedWhiteness) * 255),
        blue: Math.round(((pureHue.blue / 255) * factor + normalizedWhiteness) * 255),
    };
}

function linearSrgbChannelToByte(value: number): number {
    const clamped = Math.max(0, Math.min(1, value));
    const gammaCorrected = clamped <= 0.0031308
        ? 12.92 * clamped
        : (1.055 * Math.pow(clamped, 1 / 2.4)) - 0.055;
    return Math.round(Math.max(0, Math.min(1, gammaCorrected)) * 255);
}

function linearSrgbToNativeColor(red: number, green: number, blue: number, alpha: number): NativeColorValue {
    return {
        red: linearSrgbChannelToByte(red),
        green: linearSrgbChannelToByte(green),
        blue: linearSrgbChannelToByte(blue),
        alpha,
    };
}

function d50XyzToLinearSrgb(x: number, y: number, z: number): { red: number; green: number; blue: number } {
    const xD65 = (0.9555766 * x) - (0.0230393 * y) + (0.0631636 * z);
    const yD65 = (-0.0282895 * x) + (1.0099416 * y) + (0.0210077 * z);
    const zD65 = (0.0122982 * x) - (0.020483 * y) + (1.3299098 * z);

    return {
        red: (3.2404542 * xD65) - (1.5371385 * yD65) - (0.4985314 * zD65),
        green: (-0.969266 * xD65) + (1.8760108 * yD65) + (0.041556 * zD65),
        blue: (0.0556434 * xD65) - (0.2040259 * yD65) + (1.0572252 * zD65),
    };
}

function labToXyzComponent(value: number): number {
    const epsilon = 216 / 24389;
    const kappa = 24389 / 27;
    const cube = value * value * value;
    return cube > epsilon ? cube : ((116 * value) - 16) / kappa;
}

function labToNativeColor(lightness: number, a: number, b: number, alpha: number): NativeColorValue {
    const fy = (lightness + 16) / 116;
    const fx = fy + (a / 500);
    const fz = fy - (b / 200);
    const x = 0.96422 * labToXyzComponent(fx);
    const y = labToXyzComponent(fy);
    const z = 0.82521 * labToXyzComponent(fz);
    const linearColor = d50XyzToLinearSrgb(x, y, z);
    return linearSrgbToNativeColor(linearColor.red, linearColor.green, linearColor.blue, alpha);
}

function lchToNativeColor(lightness: number, chroma: number, hue: number, alpha: number): NativeColorValue {
    const hueInRadians = (hue * Math.PI) / 180;
    return labToNativeColor(
        lightness,
        chroma * Math.cos(hueInRadians),
        chroma * Math.sin(hueInRadians),
        alpha,
    );
}

function oklabToNativeColor(lightness: number, a: number, b: number, alpha: number): NativeColorValue {
    const l = Math.pow(lightness + (0.3963377774 * a) + (0.2158037573 * b), 3);
    const m = Math.pow(lightness - (0.1055613458 * a) - (0.0638541728 * b), 3);
    const s = Math.pow(lightness - (0.0894841775 * a) - (1.291485548 * b), 3);

    return linearSrgbToNativeColor(
        (4.0767416621 * l) - (3.3077115913 * m) + (0.2309699292 * s),
        (-1.2684380046 * l) + (2.6097574011 * m) - (0.3413193965 * s),
        (-0.0041960863 * l) - (0.7034186147 * m) + (1.707614701 * s),
        alpha,
    );
}

function oklchToNativeColor(lightness: number, chroma: number, hue: number, alpha: number): NativeColorValue {
    const hueInRadians = (hue * Math.PI) / 180;
    return oklabToNativeColor(
        lightness,
        chroma * Math.cos(hueInRadians),
        chroma * Math.sin(hueInRadians),
        alpha,
    );
}

function parseCssColor(value: NativePropValue | undefined, currentColor: NativeColorValue = getDefaultCurrentColor()): NativeColorValue | undefined {
    if (typeof value !== 'string') return undefined;

    const token = extractColorToken(value);
    if (!token) return undefined;

    if (token.toLowerCase() === CURRENT_COLOR_KEYWORD) {
        return cloneNativeColor(currentColor) ?? getDefaultCurrentColor();
    }

    const namedColor = CSS_NAMED_COLORS[token.toLowerCase()];
    if (namedColor) {
        return { ...namedColor };
    }

    const hexMatch = token.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
    if (hexMatch) {
        const hex = hexMatch[1];
        if (hex.length === 3 || hex.length === 4) {
            const [r, g, b, a = 'f'] = hex.split('');
            return {
                red: parseInt(`${r}${r}`, 16),
                green: parseInt(`${g}${g}`, 16),
                blue: parseInt(`${b}${b}`, 16),
                alpha: parseInt(`${a}${a}`, 16) / 255,
            };
        }

        const red = parseInt(hex.slice(0, 2), 16);
        const green = parseInt(hex.slice(2, 4), 16);
        const blue = parseInt(hex.slice(4, 6), 16);
        const alpha = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
        return { red, green, blue, alpha };
    }

    const hslMatch = token.match(/^hsla?\(([^()]+)\)$/i);
    if (hslMatch) {
        const parts = parseCssColorFunctionArguments(hslMatch[1]);
        if (parts.length < 3) {
            return undefined;
        }

        const hue = parseCssHue(parts[0]);
        const saturation = parseCssPercentageChannel(parts[1]);
        const lightness = parseCssPercentageChannel(parts[2]);
        const alpha = parts[3] !== undefined ? parseCssAlphaValue(parts[3]) : 1;
        if (hue === undefined || saturation === undefined || lightness === undefined || alpha === undefined) {
            return undefined;
        }

        return {
            ...hslToRgb(hue, saturation, lightness),
            alpha,
        };
    }

    const hwbMatch = token.match(/^hwb\(([^()]+)\)$/i);
    if (hwbMatch) {
        const parts = parseCssColorFunctionArguments(hwbMatch[1]);
        if (parts.length < 3) {
            return undefined;
        }

        const hue = parseCssHue(parts[0]);
        const whiteness = parseCssPercentageChannel(parts[1]);
        const blackness = parseCssPercentageChannel(parts[2]);
        const alpha = parts[3] !== undefined ? parseCssAlphaValue(parts[3]) : 1;
        if (hue === undefined || whiteness === undefined || blackness === undefined || alpha === undefined) {
            return undefined;
        }

        return {
            ...hwbToRgb(hue, whiteness, blackness),
            alpha,
        };
    }

    const labMatch = token.match(/^lab\(([^()]+)\)$/i);
    if (labMatch) {
        const parts = parseCssColorFunctionArguments(labMatch[1]);
        if (parts.length < 3) {
            return undefined;
        }

        const lightness = parseCssLabLightness(parts[0]);
        const a = parseCssNumericChannel(parts[1]);
        const b = parseCssNumericChannel(parts[2]);
        const alpha = parts[3] !== undefined ? parseCssAlphaValue(parts[3]) : 1;
        if (lightness === undefined || a === undefined || b === undefined || alpha === undefined) {
            return undefined;
        }

        return labToNativeColor(lightness, a, b, alpha);
    }

    const lchMatch = token.match(/^lch\(([^()]+)\)$/i);
    if (lchMatch) {
        const parts = parseCssColorFunctionArguments(lchMatch[1]);
        if (parts.length < 3) {
            return undefined;
        }

        const lightness = parseCssLabLightness(parts[0]);
        const chroma = parseCssNonNegativeNumericChannel(parts[1]);
        const hue = parseCssHue(parts[2]);
        const alpha = parts[3] !== undefined ? parseCssAlphaValue(parts[3]) : 1;
        if (lightness === undefined || chroma === undefined || hue === undefined || alpha === undefined) {
            return undefined;
        }

        return lchToNativeColor(lightness, chroma, hue, alpha);
    }

    const oklabMatch = token.match(/^oklab\(([^()]+)\)$/i);
    if (oklabMatch) {
        const parts = parseCssColorFunctionArguments(oklabMatch[1]);
        if (parts.length < 3) {
            return undefined;
        }

        const lightness = parseCssOklabLightness(parts[0]);
        const a = parseCssNumericChannel(parts[1]);
        const b = parseCssNumericChannel(parts[2]);
        const alpha = parts[3] !== undefined ? parseCssAlphaValue(parts[3]) : 1;
        if (lightness === undefined || a === undefined || b === undefined || alpha === undefined) {
            return undefined;
        }

        return oklabToNativeColor(lightness, a, b, alpha);
    }

    const oklchMatch = token.match(/^oklch\(([^()]+)\)$/i);
    if (oklchMatch) {
        const parts = parseCssColorFunctionArguments(oklchMatch[1]);
        if (parts.length < 3) {
            return undefined;
        }

        const lightness = parseCssOklabLightness(parts[0]);
        const chroma = parseCssNonNegativeNumericChannel(parts[1]);
        const hue = parseCssHue(parts[2]);
        const alpha = parts[3] !== undefined ? parseCssAlphaValue(parts[3]) : 1;
        if (lightness === undefined || chroma === undefined || hue === undefined || alpha === undefined) {
            return undefined;
        }

        return oklchToNativeColor(lightness, chroma, hue, alpha);
    }

    const rgbMatch = token.match(/^rgba?\(([^()]+)\)$/i);
    if (!rgbMatch) return undefined;

    const parts = parseCssColorFunctionArguments(rgbMatch[1]);
    if (parts.length < 3) return undefined;

    const red = parseCssRgbChannel(parts[0]);
    const green = parseCssRgbChannel(parts[1]);
    const blue = parseCssRgbChannel(parts[2]);
    const alpha = parts[3] !== undefined ? parseCssAlphaValue(parts[3]) : 1;

    if (alpha === undefined || red === undefined || green === undefined || blue === undefined) {
        return undefined;
    }

    return { red, green, blue, alpha };
}

function formatFloat(value: number): string {
    return Number(value.toFixed(3)).toString();
}

function tokenizeImageFallbackWords(value: string): string[] {
    return value
        .split(/[^a-zA-Z0-9]+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 0)
        .filter((token) => !/^\d+$/.test(token))
        .filter((token) => !IMAGE_FALLBACK_STOP_WORDS.has(token.toLowerCase()));
}

function resolveImageFallbackLabel(source: string, alt?: string): string {
    const altTokens = alt ? tokenizeImageFallbackWords(alt) : [];
    const sourceTokens = tokenizeImageFallbackWords(source.replace(/\.[a-z0-9]+$/i, ''));
    const tokens = altTokens.length > 0 ? altTokens : sourceTokens;

    if (tokens.length === 0) {
        return 'IMG';
    }

    if (tokens.length === 1) {
        return tokens[0]!.slice(0, 2).toUpperCase();
    }

    const initials = tokens
        .slice(0, 2)
        .map((token) => token[0]!.toUpperCase())
        .join('');

    return initials || 'IMG';
}

function toComposeColorLiteral(color: NativeColorValue): string {
    return `Color(red = ${formatFloat(color.red / 255)}f, green = ${formatFloat(color.green / 255)}f, blue = ${formatFloat(color.blue / 255)}f, alpha = ${formatFloat(color.alpha)}f)`;
}

function toSwiftColorLiteral(color: NativeColorValue): string {
    return `Color(red: ${formatFloat(color.red / 255)}, green: ${formatFloat(color.green / 255)}, blue: ${formatFloat(color.blue / 255)}, opacity: ${formatFloat(color.alpha)})`;
}

function normalizeAngle(angle: number): number {
    const normalized = angle % 360;
    return normalized < 0 ? normalized + 360 : normalized;
}

function resolveGradientDirection(angle: number | undefined): NativeGradientDirection {
    if (angle === undefined || Number.isNaN(angle)) {
        return 'topLeadingToBottomTrailing';
    }

    const normalized = normalizeAngle(angle);
    if (normalized >= 67.5 && normalized < 112.5) {
        return 'leadingToTrailing';
    }

    if (normalized >= 157.5 && normalized < 202.5) {
        return 'topToBottom';
    }

    if (normalized >= 247.5 && normalized < 292.5) {
        return 'trailingToLeading';
    }

    if (normalized >= 337.5 || normalized < 22.5) {
        return 'bottomToTop';
    }

    return normalized >= 112.5 && normalized < 247.5
        ? 'topLeadingToBottomTrailing'
        : 'bottomTrailingToTopLeading';
}

function parseLinearGradient(value: NativePropValue | undefined, currentColor: NativeColorValue = getDefaultCurrentColor()): NativeGradientValue | undefined {
    if (typeof value !== 'string') return undefined;

    const trimmed = value.trim();
    if (!trimmed.toLowerCase().startsWith('linear-gradient(') || !trimmed.endsWith(')')) {
        return undefined;
    }
    const gradientInner = trimmed.slice('linear-gradient('.length, -1);

    const segments = splitCssFunctionArguments(gradientInner).map((segment) => segment.trim()).filter(Boolean);
    if (segments.length < 2) {
        return undefined;
    }

    const colorSegments = /^(-?\d+(?:\.\d+)?)deg$/i.test(segments[0]) || /^to\s+/i.test(segments[0])
        ? segments.slice(1)
        : segments;

    const colors = colorSegments
        .map((token) => parseCssColor(token, currentColor))
        .filter((color): color is NativeColorValue => Boolean(color));
    if (colors.length < 2) {
        return undefined;
    }

    const angleMatch = trimmed.match(/linear-gradient\(\s*(-?\d+(?:\.\d+)?)deg/i);
    const angle = angleMatch ? Number(angleMatch[1]) : undefined;

    return {
        colors,
        direction: resolveGradientDirection(angle),
    };
}

function formatComposeGradientColors(colors: NativeColorValue[], reverse = false): string {
    const orderedColors = reverse ? [...colors].reverse() : colors;
    return orderedColors.map((color) => toComposeColorLiteral(color)).join(', ');
}

function toComposeBrushLiteral(gradient: NativeGradientValue): string {
    switch (gradient.direction) {
        case 'topToBottom':
            return `Brush.verticalGradient(colors = listOf(${formatComposeGradientColors(gradient.colors)}))`;
        case 'bottomToTop':
            return `Brush.verticalGradient(colors = listOf(${formatComposeGradientColors(gradient.colors, true)}))`;
        case 'leadingToTrailing':
            return `Brush.horizontalGradient(colors = listOf(${formatComposeGradientColors(gradient.colors)}))`;
        case 'trailingToLeading':
            return `Brush.horizontalGradient(colors = listOf(${formatComposeGradientColors(gradient.colors, true)}))`;
        case 'bottomTrailingToTopLeading':
            return `Brush.linearGradient(colors = listOf(${formatComposeGradientColors(gradient.colors, true)}))`;
        default:
            return `Brush.linearGradient(colors = listOf(${formatComposeGradientColors(gradient.colors)}))`;
    }
}

function toSwiftGradientLiteral(gradient: NativeGradientValue): string {
    const colors = gradient.colors.map((color) => toSwiftColorLiteral(color)).join(', ');
    const startPoint = gradient.direction === 'topToBottom'
        ? '.top'
        : gradient.direction === 'bottomToTop'
            ? '.bottom'
            : gradient.direction === 'leadingToTrailing'
                ? '.leading'
                : gradient.direction === 'trailingToLeading'
                    ? '.trailing'
                    : gradient.direction === 'bottomTrailingToTopLeading'
                        ? '.bottomTrailing'
                        : '.topLeading';
    const endPoint = gradient.direction === 'topToBottom'
        ? '.bottom'
        : gradient.direction === 'bottomToTop'
            ? '.top'
            : gradient.direction === 'leadingToTrailing'
                ? '.trailing'
                : gradient.direction === 'trailingToLeading'
                    ? '.leading'
                    : gradient.direction === 'bottomTrailingToTopLeading'
                        ? '.topLeading'
                        : '.bottomTrailing';

    return `LinearGradient(colors: [${colors}], startPoint: ${startPoint}, endPoint: ${endPoint})`;
}

function parseSingleBoxShadow(value: string, currentColor: NativeColorValue = getDefaultCurrentColor()): NativeShadowValue | undefined {
    if (/\binset\b/i.test(value)) {
        return undefined;
    }

    if (typeof value !== 'string') return undefined;

    const colorToken = extractColorToken(value);
    const color = parseCssColor(colorToken ?? value, currentColor);
    if (!color) {
        return undefined;
    }

    const dimensionSource = colorToken ? value.replace(colorToken, ' ').trim() : value.trim();
    const lengths = dimensionSource.match(/-?\d+(?:\.\d+)?(?:px|dp|pt)?/g) ?? [];
    if (lengths.length < 2) {
        return undefined;
    }

    const offsetX = Number.parseFloat(lengths[0]!);
    const offsetY = Number.parseFloat(lengths[1]!);
    const blur = lengths[2] ? Number.parseFloat(lengths[2]) : Math.max(Math.abs(offsetX), Math.abs(offsetY));
    const spread = lengths[3] ? Number.parseFloat(lengths[3]) : 0;

    if ([offsetX, offsetY, blur, spread].some((entry) => Number.isNaN(entry))) {
        return undefined;
    }

    return {
        offsetX,
        offsetY,
        blur: Math.max(0, blur + Math.max(0, spread)),
        color,
    };
}

function parseBoxShadowList(value: NativePropValue | undefined, currentColor: NativeColorValue = getDefaultCurrentColor()): NativeShadowValue[] {
    if (typeof value !== 'string') {
        return [];
    }

    return splitCssFunctionArguments(value)
        .map((entry) => parseSingleBoxShadow(entry.trim(), currentColor))
        .filter((entry): entry is NativeShadowValue => entry !== undefined);
}

function toComposeShadowElevation(shadow: NativeShadowValue): string {
    const elevation = Math.max(1, Math.abs(shadow.offsetY), shadow.blur / 4);
    return `${formatFloat(elevation)}.dp`;
}

function toSwiftShadowRadius(shadow: NativeShadowValue): string {
    const radius = Math.max(1, shadow.blur / 2);
    return formatFloat(radius);
}

function parseBlurFilterRadius(
    value: NativePropValue | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): number | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const match = value.match(/blur\(([^()]*)\)/i);
    if (!match) {
        return undefined;
    }

    const radius = toScaledUnitNumber(match[1].trim(), styleResolveOptions);
    return radius !== undefined && radius > 0 ? radius : undefined;
}

function resolveBackdropBlurRadius(
    style: Record<string, NativePropValue>,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): number | undefined {
    return parseBlurFilterRadius(style.backdropFilter, styleResolveOptions);
}

interface NativeTransformValue {
    translateX?: number;
    translateY?: number;
    scaleX?: number;
    scaleY?: number;
    rotationDegrees?: number;
}

function parseCssAngleDegrees(value: string): number | undefined {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === '0') {
        return 0;
    }

    const match = trimmed.match(/^(-?(?:\d+\.?\d*|\.\d+))deg$/);
    if (!match) {
        return undefined;
    }

    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function parseNativeTransform(
    value: NativePropValue | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): NativeTransformValue | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === 'none') {
        return undefined;
    }

    const transform: NativeTransformValue = {};
    const pattern = /(translate[xy]?|scale[xy]?|rotate)\(([^()]*)\)/gi;
    let matched = false;

    for (const match of trimmed.matchAll(pattern)) {
        matched = true;
        const functionName = match[1].toLowerCase();
        const args = splitCssFunctionArguments(match[2]);

        if (functionName === 'translate') {
            const x = toScaledUnitNumber(args[0], styleResolveOptions);
            const y = args[1] ? toScaledUnitNumber(args[1], styleResolveOptions) : 0;
            if (x !== undefined) {
                transform.translateX = (transform.translateX ?? 0) + x;
            }
            if (y !== undefined) {
                transform.translateY = (transform.translateY ?? 0) + y;
            }
            continue;
        }

        if (functionName === 'translatex') {
            const x = toScaledUnitNumber(args[0], styleResolveOptions);
            if (x !== undefined) {
                transform.translateX = (transform.translateX ?? 0) + x;
            }
            continue;
        }

        if (functionName === 'translatey') {
            const y = toScaledUnitNumber(args[0], styleResolveOptions);
            if (y !== undefined) {
                transform.translateY = (transform.translateY ?? 0) + y;
            }
            continue;
        }

        if (functionName === 'scale') {
            const x = parsePlainNumericValue(args[0]);
            const y = args[1] ? parsePlainNumericValue(args[1]) : x;
            if (x !== undefined) {
                transform.scaleX = (transform.scaleX ?? 1) * x;
            }
            if (y !== undefined) {
                transform.scaleY = (transform.scaleY ?? 1) * y;
            }
            continue;
        }

        if (functionName === 'scalex') {
            const x = parsePlainNumericValue(args[0]);
            if (x !== undefined) {
                transform.scaleX = (transform.scaleX ?? 1) * x;
            }
            continue;
        }

        if (functionName === 'scaley') {
            const y = parsePlainNumericValue(args[0]);
            if (y !== undefined) {
                transform.scaleY = (transform.scaleY ?? 1) * y;
            }
            continue;
        }

        if (functionName === 'rotate') {
            const rotation = parseCssAngleDegrees(args[0] ?? '');
            if (rotation !== undefined) {
                transform.rotationDegrees = (transform.rotationDegrees ?? 0) + rotation;
            }
        }
    }

    return matched && Object.keys(transform).length > 0 ? transform : undefined;
}

function resolveCrossAlignmentKeyword(
    value: NativePropValue | undefined,
): 'start' | 'center' | 'end' | 'stretch' | 'baseline' | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = value.trim().toLowerCase();
    switch (normalized) {
        case 'flex-start':
        case 'start':
        case 'left':
        case 'top':
        case 'self-start':
            return 'start';
        case 'center':
            return 'center';
        case 'flex-end':
        case 'end':
        case 'right':
        case 'bottom':
        case 'self-end':
            return 'end';
        case 'normal':
        case 'stretch':
            return 'stretch';
        case 'baseline':
        case 'first baseline':
        case 'last baseline':
            return 'baseline';
        default:
            return undefined;
    }
}

function resolveBaselineAlignmentKeyword(value: NativePropValue | undefined): 'first' | 'last' | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === 'last baseline') {
        return 'last';
    }

    if (normalized === 'baseline' || normalized === 'first baseline') {
        return 'first';
    }

    return undefined;
}

function resolveRowBaselineSelfAlignment(
    nodes: NativeNode[],
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): 'first' | 'last' | undefined {
    let hasFirstBaseline = false;

    for (const node of nodes) {
        if (node.kind !== 'element' || node.component !== 'Text') {
            continue;
        }

        const baselineAlignment = resolveBaselineAlignmentKeyword(getStyleObject(node, resolvedStyles, styleResolveOptions)?.alignSelf);
        if (baselineAlignment === 'last') {
            return 'last';
        }

        if (baselineAlignment === 'first') {
            hasFirstBaseline = true;
        }
    }

    return hasFirstBaseline ? 'first' : undefined;
}

function resolveSelfAlignmentKeyword(value: NativePropValue | undefined): 'start' | 'center' | 'end' | 'stretch' | undefined {
    const alignment = resolveCrossAlignmentKeyword(value);
    return alignment === 'baseline' ? undefined : alignment;
}

function resolveComposeSelfAlignmentCall(
    parentFlexLayout: 'Row' | 'Column' | undefined,
    style: Record<string, NativePropValue> | undefined,
): string | undefined {
    const alignSelf = resolveSelfAlignmentKeyword(style?.alignSelf);
    if (!alignSelf || !parentFlexLayout) {
        return undefined;
    }

    if (alignSelf === 'stretch') {
        if (parentFlexLayout === 'Row') {
            return style?.height === undefined && style?.minHeight === undefined && style?.maxHeight === undefined
                ? 'fillMaxHeight()'
                : undefined;
        }

        return style?.width === undefined && style?.minWidth === undefined && style?.maxWidth === undefined
            ? 'fillMaxWidth()'
            : undefined;
    }

    if (parentFlexLayout === 'Row') {
        switch (alignSelf) {
            case 'center':
                return 'align(Alignment.CenterVertically)';
            case 'end':
                return 'align(Alignment.Bottom)';
            default:
                return 'align(Alignment.Top)';
        }
    }

    switch (alignSelf) {
        case 'center':
            return 'align(Alignment.CenterHorizontally)';
        case 'end':
            return 'align(Alignment.End)';
        default:
            return 'align(Alignment.Start)';
    }
}

function resolveSwiftSelfAlignmentModifier(
    parentFlexLayout: 'Row' | 'Column' | undefined,
    style: Record<string, NativePropValue> | undefined,
): string | undefined {
    const alignSelf = resolveSelfAlignmentKeyword(style?.alignSelf);
    if (!alignSelf || !parentFlexLayout) {
        return undefined;
    }

    if (alignSelf === 'stretch') {
        if (parentFlexLayout === 'Row') {
            return style?.height === undefined && style?.minHeight === undefined && style?.maxHeight === undefined
                ? '.frame(maxHeight: .infinity, alignment: .topLeading)'
                : undefined;
        }

        return style?.width === undefined && style?.minWidth === undefined && style?.maxWidth === undefined
            ? '.frame(maxWidth: .infinity, alignment: .leading)'
            : undefined;
    }

    if (parentFlexLayout === 'Row') {
        switch (alignSelf) {
            case 'center':
                return '.frame(maxHeight: .infinity, alignment: .center)';
            case 'end':
                return '.frame(maxHeight: .infinity, alignment: .bottomLeading)';
            default:
                return '.frame(maxHeight: .infinity, alignment: .topLeading)';
        }
    }

    switch (alignSelf) {
        case 'center':
            return '.frame(maxWidth: .infinity, alignment: .center)';
        case 'end':
            return '.frame(maxWidth: .infinity, alignment: .trailing)';
        default:
            return '.frame(maxWidth: .infinity, alignment: .leading)';
    }
}

function resolveNativeGridItemAlignmentKeyword(value: NativePropValue | undefined): NativeGridItemAlignment | undefined {
    const alignment = resolveCrossAlignmentKeyword(value);
    return alignment === 'baseline' ? undefined : alignment;
}

function resolveNativePlaceAlignment(value: NativePropValue | undefined): { align?: NativeGridItemAlignment; justify?: NativeGridItemAlignment } | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const tokens = value.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
        return undefined;
    }

    const align = resolveNativeGridItemAlignmentKeyword(tokens[0]);
    const justify = resolveNativeGridItemAlignmentKeyword(tokens[1] ?? tokens[0]);
    return align || justify
        ? {
            ...(align ? { align } : {}),
            ...(justify ? { justify } : {}),
        }
        : undefined;
}

function resolveNativeGridItemHorizontalAlignment(
    style: Record<string, NativePropValue> | undefined,
    containerStyle: Record<string, NativePropValue> | undefined,
): NativeGridItemAlignment | undefined {
    const selfPlaceAlignment = resolveNativePlaceAlignment(style?.placeSelf);
    const containerPlaceAlignment = resolveNativePlaceAlignment(containerStyle?.placeItems);

    return resolveNativeGridItemAlignmentKeyword(style?.justifySelf)
        ?? selfPlaceAlignment?.justify
        ?? resolveNativeGridItemAlignmentKeyword(containerStyle?.justifyItems)
        ?? containerPlaceAlignment?.justify;
}

function resolveNativeGridItemVerticalAlignment(
    style: Record<string, NativePropValue> | undefined,
    containerStyle: Record<string, NativePropValue> | undefined,
): NativeGridItemAlignment | undefined {
    const selfPlaceAlignment = resolveNativePlaceAlignment(style?.placeSelf);
    const containerPlaceAlignment = resolveNativePlaceAlignment(containerStyle?.placeItems);

    return resolveSelfAlignmentKeyword(style?.alignSelf)
        ?? selfPlaceAlignment?.align
        ?? resolveSelfAlignmentKeyword(containerStyle?.alignItems)
        ?? containerPlaceAlignment?.align;
}

function resolveNativeGridCellAlignment(
    node: NativeNode,
    containerStyle: Record<string, NativePropValue> | undefined,
    resolvedStyles: NativeResolvedStyleMap | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
): { horizontal?: NativeGridItemAlignment; vertical?: NativeGridItemAlignment } {
    if (node.kind !== 'element') {
        return {};
    }

    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
    const horizontal = resolveNativeGridItemHorizontalAlignment(style, containerStyle);
    const vertical = resolveNativeGridItemVerticalAlignment(style, containerStyle);

    return {
        ...(horizontal ? { horizontal } : {}),
        ...(vertical ? { vertical } : {}),
    };
}

function resolvePositionInsets(
    style: Record<string, NativePropValue> | undefined,
    hints: NativeRenderHints | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): { top?: number; right?: number; bottom?: number; left?: number } {
    return {
        top: resolveAxisUnitNumber(style?.top, 'vertical', hints, styleResolveOptions),
        right: resolveAxisUnitNumber(style?.right, 'horizontal', hints, styleResolveOptions),
        bottom: resolveAxisUnitNumber(style?.bottom, 'vertical', hints, styleResolveOptions),
        left: resolveAxisUnitNumber(style?.left, 'horizontal', hints, styleResolveOptions),
    };
}

function liftColorAlpha(color: NativeColorValue, delta: number): NativeColorValue {
    return {
        ...color,
        alpha: Math.min(0.96, Math.max(color.alpha, 0) + Math.max(0, delta)),
    };
}

function resolveBackgroundColor(
    style: Record<string, NativePropValue>,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): NativeColorValue | undefined {
    const currentColor = resolveStyleCurrentColor(style);
    const explicitBackgroundColor = parseCssColor(style.backgroundColor, currentColor);
    const shorthandBackgroundColor = explicitBackgroundColor ? undefined : resolveNativeBackgroundShorthandColor(style.background, currentColor);
    return resolveNativeBackgroundColorLayer(explicitBackgroundColor ?? shorthandBackgroundColor, style, styleResolveOptions);
}

function resolveBackgroundGradient(style: Record<string, NativePropValue>): NativeGradientValue | undefined {
    return parseLinearGradient(style.background, resolveStyleCurrentColor(style));
}

function parseBorderValue(
    value: NativePropValue | undefined,
    unitParser: (value: NativePropValue | undefined) => string | undefined,
    currentColor: NativeColorValue,
): { width?: string; color?: NativeColorValue; style?: NativeBorderStyleKeyword } | undefined {
    if (typeof value !== 'string') return undefined;

    const widthMatch = value.match(/-?\d+(?:\.\d+)?(?:px|dp|pt)?/i);
    const width = widthMatch ? unitParser(widthMatch[0]) : undefined;
    const color = parseCssColor(value, currentColor);
    const style = parseBorderStyleKeyword(value);

    if (!width && !color && !style) {
        return undefined;
    }

    return { width, color, style };
}

function parseBorderStyleKeyword(value: NativePropValue | undefined): NativeBorderStyleKeyword | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = value.trim().toLowerCase();
    if (!normalized) {
        return undefined;
    }

    if (/(^|\s)(none|hidden)(\s|$)/.test(normalized)) {
        return 'none';
    }

    if (/(^|\s)solid(\s|$)/.test(normalized)) {
        return 'solid';
    }

    if (/(^|\s)dashed(\s|$)/.test(normalized)) {
        return 'dashed';
    }

    if (/(^|\s)dotted(\s|$)/.test(normalized)) {
        return 'dotted';
    }

    if (/(^|\s)(double|groove|ridge|inset|outset)(\s|$)/.test(normalized)) {
        return 'unsupported';
    }

    return undefined;
}

function areNativeColorsEqual(left: NativeColorValue | undefined, right: NativeColorValue | undefined): boolean {
    if (!left || !right) {
        return left === right;
    }

    return left.red === right.red
        && left.green === right.green
        && left.blue === right.blue
        && Math.abs(left.alpha - right.alpha) < 0.0001;
}

function parseNativeBorderNumericWidth(width: string): number {
    const parsedWidth = Number.parseFloat(width);
    return Number.isFinite(parsedWidth) && parsedWidth > 0 ? parsedWidth : 1;
}

function buildComposeBorderLineCap(style: NativeBorderStyleKeyword | undefined): string {
    return style === 'dotted'
        ? 'androidx.compose.ui.graphics.StrokeCap.Round'
        : 'androidx.compose.ui.graphics.StrokeCap.Square';
}

function buildComposeBorderJoinInset(side: NativeBorderSideValue | undefined, strokeVariable: string): string {
    return side ? `${side.width}.toPx() / 2f` : `${strokeVariable} / 2f`;
}

function buildComposeBorderDashPattern(style: NativeBorderStyleKeyword | undefined, strokeVariable: string): string | undefined {
    if (style === 'dotted') {
        return `floatArrayOf(${strokeVariable}, ${strokeVariable} * 1.5f)`;
    }

    if (style === 'dashed') {
        return `floatArrayOf(${strokeVariable} * 3f, ${strokeVariable} * 2f)`;
    }

    return undefined;
}

function buildSwiftBorderDashPattern(style: NativeBorderStyleKeyword | undefined, widthValue: number): string | undefined {
    if (style === 'dotted') {
        return `[${formatFloat(widthValue)}, ${formatFloat(widthValue * 1.5)}]`;
    }

    if (style === 'dashed') {
        return `[${formatFloat(widthValue * 3)}, ${formatFloat(widthValue * 2)}]`;
    }

    return undefined;
}

function buildSwiftBorderLineCap(style: NativeBorderStyleKeyword | undefined): string {
    return style === 'dotted' ? '.round' : '.square';
}

function buildSwiftBorderJoinInset(side: NativeBorderSideValue | undefined, widthValue: number): string {
    return side ? `CGFloat(${side.width}) / 2` : `CGFloat(${formatFloat(widthValue)}) / 2`;
}

function resolveNativeBorder(
    style: Record<string, NativePropValue>,
    unitParser: (value: NativePropValue | undefined) => string | undefined,
): NativeBorderValue | undefined {
    const currentColor = resolveStyleCurrentColor(style);
    const shorthandBorder = parseBorderValue(style.border, unitParser, currentColor);
    const globalWidth = unitParser(style.borderWidth) ?? shorthandBorder?.width;
    const globalColor = parseCssColor(style.borderColor, currentColor) ?? shorthandBorder?.color;
    const globalStyle = parseBorderStyleKeyword(style.borderStyle) ?? shorthandBorder?.style;
    const sideKeys = [
        { shorthand: 'borderTop', width: 'borderTopWidth', color: 'borderTopColor', style: 'borderTopStyle' },
        { shorthand: 'borderRight', width: 'borderRightWidth', color: 'borderRightColor', style: 'borderRightStyle' },
        { shorthand: 'borderBottom', width: 'borderBottomWidth', color: 'borderBottomColor', style: 'borderBottomStyle' },
        { shorthand: 'borderLeft', width: 'borderLeftWidth', color: 'borderLeftColor', style: 'borderLeftStyle' },
    ] as const;
    const hasSideSpecificBorder = sideKeys.some((keys) => style[keys.shorthand] !== undefined || style[keys.width] !== undefined || style[keys.color] !== undefined || style[keys.style] !== undefined);

    const isRenderableBorder = (
        width: string | undefined,
        color: NativeColorValue | undefined,
        borderStyle: NativeBorderStyleKeyword | undefined,
    ): boolean => Boolean(width && color && borderStyle !== 'none' && borderStyle !== 'unsupported');

    if (!hasSideSpecificBorder) {
        return isRenderableBorder(globalWidth, globalColor, globalStyle)
            ? { width: globalWidth, color: globalColor, style: globalStyle }
            : undefined;
    }

    const resolvedSides = sideKeys.map((keys) => {
        const sideBorder = parseBorderValue(style[keys.shorthand], unitParser, currentColor);
        return {
            width: unitParser(style[keys.width]) ?? sideBorder?.width ?? globalWidth,
            color: parseCssColor(style[keys.color], currentColor) ?? sideBorder?.color ?? globalColor,
            style: parseBorderStyleKeyword(style[keys.style]) ?? sideBorder?.style ?? globalStyle,
        };
    });

    const [firstSide] = resolvedSides;
    if (
        firstSide
        && isRenderableBorder(firstSide.width, firstSide.color, firstSide.style)
        && resolvedSides.every((side) => side.width === firstSide.width && areNativeColorsEqual(side.color, firstSide.color) && side.style === firstSide.style)
    ) {
        return {
            width: firstSide.width,
            color: firstSide.color,
            style: firstSide.style,
        };
    }

    const renderedBorder: NativeBorderValue = {};
    const sideNames = ['top', 'right', 'bottom', 'left'] as const;

    resolvedSides.forEach((side, index) => {
        if (isRenderableBorder(side.width, side.color, side.style)) {
            renderedBorder[sideNames[index]] = {
                width: side.width!,
                color: side.color!,
                style: side.style,
            };
        }
    });

    return renderedBorder.top || renderedBorder.right || renderedBorder.bottom || renderedBorder.left
        ? renderedBorder
        : undefined;
}

function hasNativeSideBorders(border: NativeBorderValue | undefined): boolean {
    return Boolean(border?.top || border?.right || border?.bottom || border?.left);
}

function buildComposeSideBorderModifier(border: NativeBorderValue): string | undefined {
    if (!hasNativeSideBorders(border)) {
        return undefined;
    }

    const commands: string[] = [];
    if (border.top) {
        commands.push(`val topStroke = ${border.top.width}.toPx()`);
        const topStartX = buildComposeBorderJoinInset(border.left, 'topStroke');
        const topEndX = `size.width - (${buildComposeBorderJoinInset(border.right, 'topStroke')})`;
        const topCap = buildComposeBorderLineCap(border.top.style);
        const topDashPattern = buildComposeBorderDashPattern(border.top.style, 'topStroke');
        const topPathEffect = topDashPattern
            ? `, pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(${topDashPattern})`
            : '';
        commands.push(`drawLine(color = ${toComposeColorLiteral(border.top.color)}, start = androidx.compose.ui.geometry.Offset(${topStartX}, topStroke / 2f), end = androidx.compose.ui.geometry.Offset(${topEndX}, topStroke / 2f), strokeWidth = topStroke, cap = ${topCap}${topPathEffect})`);
    }
    if (border.right) {
        commands.push(`val rightStroke = ${border.right.width}.toPx()`);
        const rightStartY = buildComposeBorderJoinInset(border.top, 'rightStroke');
        const rightEndY = `size.height - (${buildComposeBorderJoinInset(border.bottom, 'rightStroke')})`;
        const rightCap = buildComposeBorderLineCap(border.right.style);
        const rightDashPattern = buildComposeBorderDashPattern(border.right.style, 'rightStroke');
        const rightPathEffect = rightDashPattern
            ? `, pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(${rightDashPattern})`
            : '';
        commands.push(`drawLine(color = ${toComposeColorLiteral(border.right.color)}, start = androidx.compose.ui.geometry.Offset(size.width - (rightStroke / 2f), ${rightStartY}), end = androidx.compose.ui.geometry.Offset(size.width - (rightStroke / 2f), ${rightEndY}), strokeWidth = rightStroke, cap = ${rightCap}${rightPathEffect})`);
    }
    if (border.bottom) {
        commands.push(`val bottomStroke = ${border.bottom.width}.toPx()`);
        const bottomStartX = buildComposeBorderJoinInset(border.left, 'bottomStroke');
        const bottomEndX = `size.width - (${buildComposeBorderJoinInset(border.right, 'bottomStroke')})`;
        const bottomCap = buildComposeBorderLineCap(border.bottom.style);
        const bottomDashPattern = buildComposeBorderDashPattern(border.bottom.style, 'bottomStroke');
        const bottomPathEffect = bottomDashPattern
            ? `, pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(${bottomDashPattern})`
            : '';
        commands.push(`drawLine(color = ${toComposeColorLiteral(border.bottom.color)}, start = androidx.compose.ui.geometry.Offset(${bottomStartX}, size.height - (bottomStroke / 2f)), end = androidx.compose.ui.geometry.Offset(${bottomEndX}, size.height - (bottomStroke / 2f)), strokeWidth = bottomStroke, cap = ${bottomCap}${bottomPathEffect})`);
    }
    if (border.left) {
        commands.push(`val leftStroke = ${border.left.width}.toPx()`);
        const leftStartY = buildComposeBorderJoinInset(border.top, 'leftStroke');
        const leftEndY = `size.height - (${buildComposeBorderJoinInset(border.bottom, 'leftStroke')})`;
        const leftCap = buildComposeBorderLineCap(border.left.style);
        const leftDashPattern = buildComposeBorderDashPattern(border.left.style, 'leftStroke');
        const leftPathEffect = leftDashPattern
            ? `, pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(${leftDashPattern})`
            : '';
        commands.push(`drawLine(color = ${toComposeColorLiteral(border.left.color)}, start = androidx.compose.ui.geometry.Offset(leftStroke / 2f, ${leftStartY}), end = androidx.compose.ui.geometry.Offset(leftStroke / 2f, ${leftEndY}), strokeWidth = leftStroke, cap = ${leftCap}${leftPathEffect})`);
    }

    return commands.length > 0 ? `drawBehind { ${commands.join('; ')} }` : undefined;
}

function buildComposeUniformStyledBorderModifier(border: NativeBorderValue, radius?: string): string | undefined {
    if (!border.width || !border.color || (border.style !== 'dashed' && border.style !== 'dotted')) {
        return undefined;
    }

    const dashPattern = buildComposeBorderDashPattern(border.style, 'strokeWidth');
    if (!dashPattern) {
        return undefined;
    }

    if (radius) {
        return `drawBehind { val strokeWidth = ${border.width}.toPx(); val dashPattern = ${dashPattern}; val borderRadius = ${radius}.toPx(); drawRoundRect(color = ${toComposeColorLiteral(border.color)}, cornerRadius = androidx.compose.ui.geometry.CornerRadius(borderRadius, borderRadius), style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeWidth, pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(dashPattern))) }`;
    }

    return `drawBehind { val strokeWidth = ${border.width}.toPx(); val dashPattern = ${dashPattern}; drawRect(color = ${toComposeColorLiteral(border.color)}, style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeWidth, pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(dashPattern))) }`;
}

function buildSwiftSideBorderOverlay(border: NativeBorderValue, radius?: string): string | undefined {
    if (!hasNativeSideBorders(border)) {
        return undefined;
    }

    const sideEntries = [
        ['top', border.top],
        ['right', border.right],
        ['bottom', border.bottom],
        ['left', border.left],
    ].filter((entry): entry is ['top' | 'right' | 'bottom' | 'left', NativeBorderSideValue] => Boolean(entry[1]));

    const hasStyledSides = sideEntries.some(([, side]) => side.style === 'dashed' || side.style === 'dotted');
    if (hasStyledSides) {
        const overlays = sideEntries.map(([sideName, side]) => {
            const widthValue = parseNativeBorderNumericWidth(side.width);
            const dashPattern = buildSwiftBorderDashPattern(side.style, widthValue);
            const lineCap = buildSwiftBorderLineCap(side.style);
            const strokeStyle = dashPattern
                ? `StrokeStyle(lineWidth: ${side.width}, lineCap: ${lineCap}, dash: ${dashPattern})`
                : `StrokeStyle(lineWidth: ${side.width}, lineCap: ${lineCap})`;

            switch (sideName) {
                case 'top':
                    return `Path { path in path.move(to: CGPoint(x: ${buildSwiftBorderJoinInset(border.left, widthValue)}, y: CGFloat(${side.width}) / 2)); path.addLine(to: CGPoint(x: proxy.size.width - (${buildSwiftBorderJoinInset(border.right, widthValue)}), y: CGFloat(${side.width}) / 2)) }.stroke(${toSwiftColorLiteral(side.color)}, style: ${strokeStyle})`;
                case 'right':
                    return `Path { path in path.move(to: CGPoint(x: proxy.size.width - (CGFloat(${side.width}) / 2), y: ${buildSwiftBorderJoinInset(border.top, widthValue)})); path.addLine(to: CGPoint(x: proxy.size.width - (CGFloat(${side.width}) / 2), y: proxy.size.height - (${buildSwiftBorderJoinInset(border.bottom, widthValue)}))) }.stroke(${toSwiftColorLiteral(side.color)}, style: ${strokeStyle})`;
                case 'bottom':
                    return `Path { path in path.move(to: CGPoint(x: ${buildSwiftBorderJoinInset(border.left, widthValue)}, y: proxy.size.height - (CGFloat(${side.width}) / 2))); path.addLine(to: CGPoint(x: proxy.size.width - (${buildSwiftBorderJoinInset(border.right, widthValue)}), y: proxy.size.height - (CGFloat(${side.width}) / 2))) }.stroke(${toSwiftColorLiteral(side.color)}, style: ${strokeStyle})`;
                case 'left':
                default:
                    return `Path { path in path.move(to: CGPoint(x: CGFloat(${side.width}) / 2, y: ${buildSwiftBorderJoinInset(border.top, widthValue)})); path.addLine(to: CGPoint(x: CGFloat(${side.width}) / 2, y: proxy.size.height - (${buildSwiftBorderJoinInset(border.bottom, widthValue)}))) }.stroke(${toSwiftColorLiteral(side.color)}, style: ${strokeStyle})`;
            }
        });

        const clipModifier = radius ? `.clipShape(RoundedRectangle(cornerRadius: ${radius}))` : '';
        return `.overlay { GeometryReader { proxy in ZStack { ${overlays.join('; ')} } }${clipModifier} }`;
    }

    const overlays: string[] = [];
    if (border.top) {
        overlays.push(`Rectangle().fill(${toSwiftColorLiteral(border.top.color)}).frame(height: ${border.top.width}).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)`);
    }
    if (border.right) {
        overlays.push(`Rectangle().fill(${toSwiftColorLiteral(border.right.color)}).frame(width: ${border.right.width}).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .trailing)`);
    }
    if (border.bottom) {
        overlays.push(`Rectangle().fill(${toSwiftColorLiteral(border.bottom.color)}).frame(height: ${border.bottom.width}).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)`);
    }
    if (border.left) {
        overlays.push(`Rectangle().fill(${toSwiftColorLiteral(border.left.color)}).frame(width: ${border.left.width}).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)`);
    }

    if (overlays.length === 0) {
        return undefined;
    }

    const clipModifier = radius ? `.clipShape(RoundedRectangle(cornerRadius: ${radius}))` : '';
    return `.overlay { ZStack { ${overlays.join('; ')} }${clipModifier} }`;
}

function buildSwiftUniformStyledBorderModifier(border: NativeBorderValue, radius?: string): string | undefined {
    if (!border.width || !border.color || (border.style !== 'dashed' && border.style !== 'dotted')) {
        return undefined;
    }

    const widthValue = parseNativeBorderNumericWidth(border.width);
    const dashPattern = buildSwiftBorderDashPattern(border.style, widthValue);
    if (!dashPattern) {
        return undefined;
    }
    const shape = radius ? `RoundedRectangle(cornerRadius: ${radius})` : 'Rectangle()';
    return `.overlay(${shape}.stroke(${toSwiftColorLiteral(border.color)}, style: StrokeStyle(lineWidth: ${border.width}, dash: ${dashPattern})))`;
}

function resolveTextTransform(value: NativePropValue | undefined): 'uppercase' | 'lowercase' | 'capitalize' | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'uppercase' || normalized === 'lowercase' || normalized === 'capitalize') {
        return normalized;
    }

    return undefined;
}

function resolveComposeTextDecoration(value: NativePropValue | undefined): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized.includes('underline') && normalized.includes('line-through')) {
        return 'TextDecoration.combine(listOf(TextDecoration.Underline, TextDecoration.LineThrough))';
    }
    if (normalized.includes('underline')) {
        return 'TextDecoration.Underline';
    }
    if (normalized.includes('line-through')) {
        return 'TextDecoration.LineThrough';
    }

    return undefined;
}

function resolveSwiftTextDecoration(value: NativePropValue | undefined): { underline: boolean; strikethrough: boolean } | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = value.trim().toLowerCase();
    const underline = normalized.includes('underline');
    const strikethrough = normalized.includes('line-through');
    return underline || strikethrough ? { underline, strikethrough } : undefined;
}

function applyTextTransform(text: string, transform: 'uppercase' | 'lowercase' | 'capitalize' | undefined): string {
    if (!transform) return text;
    if (transform === 'uppercase') return text.toUpperCase();
    if (transform === 'lowercase') return text.toLowerCase();
    return text.replace(/\b\p{L}/gu, (char) => char.toUpperCase());
}

function resolveComposeFontWeight(value: NativePropValue | undefined): string | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return `FontWeight.W${Math.min(900, Math.max(100, Math.round(value / 100) * 100))}`;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim().toLowerCase();
        if (/^\d+$/.test(trimmed)) {
            return `FontWeight.W${Math.min(900, Math.max(100, Math.round(Number(trimmed) / 100) * 100))}`;
        }
        if (trimmed === 'bold') return 'FontWeight.Bold';
        if (trimmed === 'semibold') return 'FontWeight.SemiBold';
        if (trimmed === 'medium') return 'FontWeight.Medium';
        if (trimmed === 'normal') return 'FontWeight.Normal';
    }

    return undefined;
}

function resolveSwiftFontWeight(value: NativePropValue | undefined): string | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        if (value >= 700) return '.bold';
        if (value >= 600) return '.semibold';
        if (value >= 500) return '.medium';
        return '.regular';
    }

    if (typeof value === 'string') {
        const trimmed = value.trim().toLowerCase();
        if (/^\d+$/.test(trimmed)) {
            return resolveSwiftFontWeight(Number(trimmed));
        }
        if (trimmed === 'bold') return '.bold';
        if (trimmed === 'semibold') return '.semibold';
        if (trimmed === 'medium') return '.medium';
        if (trimmed === 'normal') return '.regular';
    }

    return undefined;
}

function resolveComposeTextAlign(value: NativePropValue | undefined): string | undefined {
    if (typeof value !== 'string') return undefined;
    switch (value.trim().toLowerCase()) {
        case 'center':
            return 'TextAlign.Center';
        case 'right':
        case 'end':
            return 'TextAlign.End';
        case 'left':
        case 'start':
            return 'TextAlign.Start';
        default:
            return undefined;
    }
}

function resolveSwiftTextAlign(value: NativePropValue | undefined): string | undefined {
    if (typeof value !== 'string') return undefined;
    switch (value.trim().toLowerCase()) {
        case 'center':
            return '.center';
        case 'right':
        case 'end':
            return '.trailing';
        case 'left':
        case 'start':
            return '.leading';
        default:
            return undefined;
    }
}

function resolveLayoutDirection(style: Record<string, NativePropValue> | undefined): 'Row' | 'Column' | undefined {
    if (!style) return undefined;

    if (typeof style.flexDirection === 'string') {
        return style.flexDirection.trim().toLowerCase() === 'row' ? 'Row' : 'Column';
    }

    if (typeof style.display === 'string') {
        const display = style.display.trim().toLowerCase();
        if (display === 'flex' || display === 'inline-flex') {
            return 'Row';
        }
        if (display === 'grid' || display === 'inline-grid') {
            return 'Column';
        }
    }

    return undefined;
}

function buildComposeArrangement(
    layout: 'Row' | 'Column',
    style: Record<string, NativePropValue> | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
    gapOverride?: string,
): string | undefined {
    if (!style) return undefined;

    const justify = resolveNativeJustifyContent(style);
    const gap = gapOverride ?? toDpLiteral(style.gap ?? (layout === 'Row' ? style.columnGap : style.rowGap) ?? style.gap, styleResolveOptions);

    if (layout === 'Row') {
        switch (justify) {
            case 'center': return 'Arrangement.Center';
            case 'flex-end':
            case 'end':
            case 'right':
                return 'Arrangement.End';
            case 'space-between': return 'Arrangement.SpaceBetween';
            case 'space-around': return 'Arrangement.SpaceAround';
            case 'space-evenly': return 'Arrangement.SpaceEvenly';
            default:
                return gap ? `Arrangement.spacedBy(${gap})` : undefined;
        }
    }

    switch (justify) {
        case 'center': return 'Arrangement.Center';
        case 'flex-end':
        case 'end':
        case 'bottom':
            return 'Arrangement.Bottom';
        case 'space-between': return 'Arrangement.SpaceBetween';
        case 'space-around': return 'Arrangement.SpaceAround';
        case 'space-evenly': return 'Arrangement.SpaceEvenly';
        default:
            return gap ? `Arrangement.spacedBy(${gap})` : undefined;
    }
}

function buildComposeCrossAlignment(layout: 'Row' | 'Column', style: Record<string, NativePropValue> | undefined): string | undefined {
    if (!style || typeof style.alignItems !== 'string') return undefined;

    if (layout === 'Row' && resolveBaselineAlignmentKeyword(style.alignItems)) {
        return undefined;
    }

    const align = style.alignItems.trim().toLowerCase();
    if (layout === 'Row') {
        switch (align) {
            case 'center': return 'Alignment.CenterVertically';
            case 'flex-end':
            case 'end':
            case 'bottom':
                return 'Alignment.Bottom';
            default:
                return 'Alignment.Top';
        }
    }

    switch (align) {
        case 'center': return 'Alignment.CenterHorizontally';
        case 'flex-end':
        case 'end':
        case 'right':
            return 'Alignment.End';
        default:
            return 'Alignment.Start';
    }
}

function buildComposeTextStyleArgs(
    node: NativeElementNode,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string[] {
    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
    if (!style) return [];

    const args: string[] = [];
    const color = parseCssColor(style.color);
    const fontSize = toSpLiteral(style.fontSize, styleResolveOptions);
    const fontWeight = resolveComposeFontWeight(style.fontWeight);
    const fontFamily = resolveComposeFontFamily(style.fontFamily);
    const letterSpacing = toSpLiteral(style.letterSpacing, styleResolveOptions);
    const lineHeight = resolveComposeLineHeight(style.lineHeight, style.fontSize, styleResolveOptions);
    const textAlign = resolveComposeTextAlign(style.textAlign);
    const textDecoration = resolveComposeTextDecoration(style.textDecoration);

    if (color) args.push(`color = ${toComposeColorLiteral(color)}`);
    if (fontSize) args.push(`fontSize = ${fontSize}`);
    if (fontWeight) args.push(`fontWeight = ${fontWeight}`);
    if (fontFamily) args.push(`fontFamily = ${fontFamily}`);
    if (letterSpacing) args.push(`letterSpacing = ${letterSpacing}`);
    if (lineHeight) args.push(`lineHeight = ${lineHeight}`);
    if (textAlign) args.push(`textAlign = ${textAlign}`);
    if (textDecoration) args.push(`textDecoration = ${textDecoration}`);

    return args;
}

function buildComposeLabelText(
    node: NativeElementNode,
    label: string,
    resolvedStyles?: NativeResolvedStyleMap,
    expression?: string,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string {
    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
    const transform = resolveTextTransform(style?.textTransform);
    const textValue = expression
        ? applyComposeTextTransformExpression(expression, transform)
        : quoteKotlinString(applyTextTransform(label, transform));
    const args = [`text = ${textValue}`, ...buildComposeTextStyleArgs(node, resolvedStyles, styleResolveOptions)];
    return `Text(${args.join(', ')})`;
}

function buildComposeTextStyleLiteral(
    node: NativeElementNode,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string | undefined {
    const args = buildComposeTextStyleArgs(node, resolvedStyles, styleResolveOptions);
    return args.length > 0 ? `androidx.compose.ui.text.TextStyle(${args.join(', ')})` : undefined;
}

function resolveNativePickerDisplayLabel(value: string, options: NativePickerOption[]): string {
    return options.find((option) => option.value === value)?.label ?? value;
}

function buildComposePickerLabelExpression(selectionExpression: string, options: NativePickerOption[], placeholder?: string): string {
    const fallbackLabel = placeholder ? quoteKotlinString(placeholder) : undefined;

    if (options.length === 0 || options.every((option) => option.value === option.label)) {
        return fallbackLabel
            ? `if (${selectionExpression}.isEmpty()) ${fallbackLabel} else ${selectionExpression}`
            : selectionExpression;
    }

    const branches = options.map((option) => `${quoteKotlinString(option.value)} -> ${quoteKotlinString(option.label)}`).join('; ');
    return fallbackLabel
        ? `when (${selectionExpression}) { "" -> ${fallbackLabel}; ${branches}; else -> ${selectionExpression} }`
        : `when (${selectionExpression}) { ${branches}; else -> ${selectionExpression} }`;
}

function buildComposeIntrinsicSurfaceModifier(
    node: NativeElementNode,
    modifier: string,
    spec: NativeIntrinsicSizeSpec,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string {
    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
    const widthDefined = hasExplicitNativeWidthStyle(style);
    const heightDefined = hasExplicitNativeHeightStyle(style);

    if (!widthDefined && !heightDefined) {
        return prependComposeModifierCall(modifier, `size(width = ${formatFloat(spec.intrinsicWidth)}.dp, height = ${formatFloat(spec.intrinsicHeight)}.dp)`);
    }

    let resolvedModifier = modifier;
    if (!widthDefined) {
        resolvedModifier = prependComposeModifierCall(resolvedModifier, `width(${formatFloat(spec.intrinsicWidth)}.dp)`);
    }
    if (!heightDefined) {
        resolvedModifier = prependComposeModifierCall(resolvedModifier, `height(${formatFloat(spec.intrinsicHeight)}.dp)`);
    }

    return resolvedModifier;
}

function buildComposeVectorModifier(
    node: NativeElementNode,
    modifier: string,
    spec: NativeVectorSpec,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string {
    return buildComposeIntrinsicSurfaceModifier(node, modifier, spec, resolvedStyles, styleResolveOptions);
}

function buildComposeDrawingCanvasLines(
    spec: NativeVectorSpec,
    level: number,
    modifier: string,
): string[] {
    const viewport = spec.viewport;
    const lines = [`${indent(level)}androidx.compose.foundation.Canvas(modifier = ${modifier}) {`];
    lines.push(`${indent(level + 1)}val viewportWidth = ${formatFloat(viewport.width)}f`);
    lines.push(`${indent(level + 1)}val viewportHeight = ${formatFloat(viewport.height)}f`);
    lines.push(`${indent(level + 1)}val scaleX = size.width / viewportWidth`);
    lines.push(`${indent(level + 1)}val scaleY = size.height / viewportHeight`);
    lines.push(`${indent(level + 1)}val strokeScale = (scaleX + scaleY) / 2f`);

    let pathIndex = 0;
    for (const shape of spec.shapes) {
        if (shape.kind === 'circle') {
            const radiusExpression = `${formatFloat(shape.r)}f * kotlin.math.min(scaleX, scaleY)`;
            const centerExpression = `androidx.compose.ui.geometry.Offset(${formatFloat(shape.cx - viewport.minX)}f * scaleX, ${formatFloat(shape.cy - viewport.minY)}f * scaleY)`;
            if (shape.fill) {
                lines.push(`${indent(level + 1)}drawCircle(color = ${toComposeColorLiteral(shape.fill)}, radius = ${radiusExpression}, center = ${centerExpression})`);
            }
            if (shape.stroke) {
                lines.push(`${indent(level + 1)}drawCircle(color = ${toComposeColorLiteral(shape.stroke)}, radius = ${radiusExpression}, center = ${centerExpression}, style = androidx.compose.ui.graphics.drawscope.Stroke(width = ${(shape.strokeWidth ?? 1).toString()}f * strokeScale))`);
            }
            continue;
        }

        if (shape.kind === 'ellipse') {
            const topLeftExpression = `androidx.compose.ui.geometry.Offset(${formatFloat(shape.cx - shape.rx - viewport.minX)}f * scaleX, ${formatFloat(shape.cy - shape.ry - viewport.minY)}f * scaleY)`;
            const sizeExpression = `androidx.compose.ui.geometry.Size(${formatFloat(shape.rx * 2)}f * scaleX, ${formatFloat(shape.ry * 2)}f * scaleY)`;
            if (shape.fill) {
                lines.push(`${indent(level + 1)}drawOval(color = ${toComposeColorLiteral(shape.fill)}, topLeft = ${topLeftExpression}, size = ${sizeExpression})`);
            }
            if (shape.stroke) {
                lines.push(`${indent(level + 1)}drawOval(color = ${toComposeColorLiteral(shape.stroke)}, topLeft = ${topLeftExpression}, size = ${sizeExpression}, style = androidx.compose.ui.graphics.drawscope.Stroke(width = ${(shape.strokeWidth ?? 1).toString()}f * strokeScale))`);
            }
            continue;
        }

        if (shape.kind === 'rect') {
            const topLeftExpression = `androidx.compose.ui.geometry.Offset(${formatFloat(shape.x - viewport.minX)}f * scaleX, ${formatFloat(shape.y - viewport.minY)}f * scaleY)`;
            const sizeExpression = `androidx.compose.ui.geometry.Size(${formatFloat(shape.width)}f * scaleX, ${formatFloat(shape.height)}f * scaleY)`;
            const hasRadius = (shape.rx ?? 0) > 0 || (shape.ry ?? shape.rx ?? 0) > 0;
            const radiusExpression = `androidx.compose.ui.geometry.CornerRadius(${formatFloat(shape.rx ?? 0)}f * scaleX, ${formatFloat(shape.ry ?? shape.rx ?? 0)}f * scaleY)`;
            if (shape.fill) {
                lines.push(`${indent(level + 1)}${hasRadius
                    ? `drawRoundRect(color = ${toComposeColorLiteral(shape.fill)}, topLeft = ${topLeftExpression}, size = ${sizeExpression}, cornerRadius = ${radiusExpression})`
                    : `drawRect(color = ${toComposeColorLiteral(shape.fill)}, topLeft = ${topLeftExpression}, size = ${sizeExpression})`}`);
            }
            if (shape.stroke) {
                lines.push(`${indent(level + 1)}${hasRadius
                    ? `drawRoundRect(color = ${toComposeColorLiteral(shape.stroke)}, topLeft = ${topLeftExpression}, size = ${sizeExpression}, cornerRadius = ${radiusExpression}, style = androidx.compose.ui.graphics.drawscope.Stroke(width = ${(shape.strokeWidth ?? 1).toString()}f * strokeScale))`
                    : `drawRect(color = ${toComposeColorLiteral(shape.stroke)}, topLeft = ${topLeftExpression}, size = ${sizeExpression}, style = androidx.compose.ui.graphics.drawscope.Stroke(width = ${(shape.strokeWidth ?? 1).toString()}f * strokeScale))`}`);
            }
            continue;
        }

        const pathName = `vectorPath${pathIndex++}`;
        lines.push(`${indent(level + 1)}val ${pathName} = androidx.compose.ui.graphics.Path().apply {`);
        for (const command of shape.commands) {
            if (command.kind === 'close') {
                lines.push(`${indent(level + 2)}close()`);
                continue;
            }

            if (command.kind === 'cubicTo') {
                lines.push(`${indent(level + 2)}cubicTo(${formatFloat(command.control1X - viewport.minX)}f * scaleX, ${formatFloat(command.control1Y - viewport.minY)}f * scaleY, ${formatFloat(command.control2X - viewport.minX)}f * scaleX, ${formatFloat(command.control2Y - viewport.minY)}f * scaleY, ${formatFloat(command.x - viewport.minX)}f * scaleX, ${formatFloat(command.y - viewport.minY)}f * scaleY)`);
                continue;
            }

            lines.push(`${indent(level + 2)}${command.kind}(${formatFloat(command.x - viewport.minX)}f * scaleX, ${formatFloat(command.y - viewport.minY)}f * scaleY)`);
        }
        lines.push(`${indent(level + 1)}}`);
        if (shape.fill) {
            lines.push(`${indent(level + 1)}drawPath(path = ${pathName}, color = ${toComposeColorLiteral(shape.fill)})`);
        }
        if (shape.stroke) {
            lines.push(`${indent(level + 1)}drawPath(path = ${pathName}, color = ${toComposeColorLiteral(shape.stroke)}, style = androidx.compose.ui.graphics.drawscope.Stroke(width = ${(shape.strokeWidth ?? 1).toString()}f * strokeScale))`);
        }
    }

    lines.push(`${indent(level)}}`);
    return lines;
}

function buildComposeCanvasSurfaceLines(
    node: NativeElementNode,
    level: number,
    modifier: string,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string[] {
    const drawingSpec = buildNativeCanvasDrawingSpec(node);
    const spec = drawingSpec ?? buildNativeCanvasSpec(node);
    const canvasModifier = buildComposeIntrinsicSurfaceModifier(node, modifier, spec, resolvedStyles, styleResolveOptions);
    return drawingSpec
        ? buildComposeDrawingCanvasLines(drawingSpec, level, canvasModifier)
        : [
            `${indent(level)}androidx.compose.foundation.Canvas(modifier = ${canvasModifier}) {`,
            `${indent(level)}}`,
        ];
}

function buildComposeVectorCanvasLines(
    node: NativeElementNode,
    level: number,
    modifier: string,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string[] | undefined {
    const spec = buildNativeVectorSpec(node);
    if (!spec) {
        return undefined;
    }

    const vectorModifier = buildComposeVectorModifier(node, modifier, spec, resolvedStyles, styleResolveOptions);
    return buildComposeDrawingCanvasLines(spec, level, vectorModifier);
}

function buildSwiftIntrinsicSurfaceModifiers(
    node: NativeElementNode,
    spec: NativeIntrinsicSizeSpec,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string[] {
    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
    const modifiers = buildSwiftUIModifiers(node, resolvedStyles, {}, styleResolveOptions);
    const frameArgs: string[] = [];
    if (!hasExplicitNativeWidthStyle(style)) {
        frameArgs.push(`width: ${formatFloat(spec.intrinsicWidth)}`);
    }
    if (!hasExplicitNativeHeightStyle(style)) {
        frameArgs.push(`height: ${formatFloat(spec.intrinsicHeight)}`);
    }
    if (frameArgs.length > 0) {
        modifiers.push(`.frame(${frameArgs.join(', ')})`);
    }
    return modifiers;
}

function buildSwiftVectorCanvasModifiers(
    node: NativeElementNode,
    spec: NativeVectorSpec,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string[] {
    return buildSwiftIntrinsicSurfaceModifiers(node, spec, resolvedStyles, styleResolveOptions);
}

function buildSwiftDrawingCanvasLines(
    spec: NativeVectorSpec,
    level: number,
): string[] {
    const viewport = spec.viewport;
    const lines = [`${indent(level)}Canvas { context, size in`];
    lines.push(`${indent(level + 1)}let viewportWidth = CGFloat(${formatFloat(viewport.width)})`);
    lines.push(`${indent(level + 1)}let viewportHeight = CGFloat(${formatFloat(viewport.height)})`);
    lines.push(`${indent(level + 1)}let scaleX = size.width / viewportWidth`);
    lines.push(`${indent(level + 1)}let scaleY = size.height / viewportHeight`);
    lines.push(`${indent(level + 1)}let strokeScale = (scaleX + scaleY) / 2`);

    let pathIndex = 0;
    for (const shape of spec.shapes) {
        const pathName = `vectorPath${pathIndex++}`;
        lines.push(`${indent(level + 1)}var ${pathName} = Path()`);

        if (shape.kind === 'circle') {
            lines.push(`${indent(level + 1)}${pathName}.addEllipse(in: CGRect(x: CGFloat(${formatFloat(shape.cx - shape.r - viewport.minX)}) * scaleX, y: CGFloat(${formatFloat(shape.cy - shape.r - viewport.minY)}) * scaleY, width: CGFloat(${formatFloat(shape.r * 2)}) * scaleX, height: CGFloat(${formatFloat(shape.r * 2)}) * scaleY))`);
        } else if (shape.kind === 'ellipse') {
            lines.push(`${indent(level + 1)}${pathName}.addEllipse(in: CGRect(x: CGFloat(${formatFloat(shape.cx - shape.rx - viewport.minX)}) * scaleX, y: CGFloat(${formatFloat(shape.cy - shape.ry - viewport.minY)}) * scaleY, width: CGFloat(${formatFloat(shape.rx * 2)}) * scaleX, height: CGFloat(${formatFloat(shape.ry * 2)}) * scaleY))`);
        } else if (shape.kind === 'rect') {
            if ((shape.rx ?? 0) > 0 || (shape.ry ?? shape.rx ?? 0) > 0) {
                lines.push(`${indent(level + 1)}${pathName}.addRoundedRect(in: CGRect(x: CGFloat(${formatFloat(shape.x - viewport.minX)}) * scaleX, y: CGFloat(${formatFloat(shape.y - viewport.minY)}) * scaleY, width: CGFloat(${formatFloat(shape.width)}) * scaleX, height: CGFloat(${formatFloat(shape.height)}) * scaleY), cornerSize: CGSize(width: CGFloat(${formatFloat(shape.rx ?? 0)}) * scaleX, height: CGFloat(${formatFloat(shape.ry ?? shape.rx ?? 0)}) * scaleY))`);
            } else {
                lines.push(`${indent(level + 1)}${pathName}.addRect(CGRect(x: CGFloat(${formatFloat(shape.x - viewport.minX)}) * scaleX, y: CGFloat(${formatFloat(shape.y - viewport.minY)}) * scaleY, width: CGFloat(${formatFloat(shape.width)}) * scaleX, height: CGFloat(${formatFloat(shape.height)}) * scaleY))`);
            }
        } else {
            for (const command of shape.commands) {
                if (command.kind === 'close') {
                    lines.push(`${indent(level + 1)}${pathName}.closeSubpath()`);
                    continue;
                }

                if (command.kind === 'cubicTo') {
                    lines.push(`${indent(level + 1)}${pathName}.addCurve(to: CGPoint(x: CGFloat(${formatFloat(command.x - viewport.minX)}) * scaleX, y: CGFloat(${formatFloat(command.y - viewport.minY)}) * scaleY), control1: CGPoint(x: CGFloat(${formatFloat(command.control1X - viewport.minX)}) * scaleX, y: CGFloat(${formatFloat(command.control1Y - viewport.minY)}) * scaleY), control2: CGPoint(x: CGFloat(${formatFloat(command.control2X - viewport.minX)}) * scaleX, y: CGFloat(${formatFloat(command.control2Y - viewport.minY)}) * scaleY))`);
                    continue;
                }

                lines.push(`${indent(level + 1)}${pathName}.${command.kind === 'moveTo' ? 'move' : 'addLine'}(to: CGPoint(x: CGFloat(${formatFloat(command.x - viewport.minX)}) * scaleX, y: CGFloat(${formatFloat(command.y - viewport.minY)}) * scaleY))`);
            }
        }

        if (shape.fill) {
            lines.push(`${indent(level + 1)}context.fill(${pathName}, with: .color(${toSwiftColorLiteral(shape.fill)}))`);
        }
        if (shape.stroke) {
            lines.push(`${indent(level + 1)}context.stroke(${pathName}, with: .color(${toSwiftColorLiteral(shape.stroke)}), style: StrokeStyle(lineWidth: CGFloat(${formatFloat(shape.strokeWidth ?? 1)}) * strokeScale))`);
        }
    }

    lines.push(`${indent(level)}}`);
    return lines;
}

function buildSwiftCanvasSurfaceLines(
    node: NativeElementNode,
    level: number,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): { lines: string[]; modifiers: string[] } {
    const drawingSpec = buildNativeCanvasDrawingSpec(node);
    const spec = drawingSpec ?? buildNativeCanvasSpec(node);
    return {
        lines: drawingSpec
            ? buildSwiftDrawingCanvasLines(drawingSpec, level)
            : [
                `${indent(level)}Canvas { _, _ in`,
                `${indent(level)}}`,
            ],
        modifiers: buildSwiftIntrinsicSurfaceModifiers(node, spec, resolvedStyles, styleResolveOptions),
    };
}

function buildSwiftVectorCanvasLines(
    node: NativeElementNode,
    level: number,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): { lines: string[]; modifiers: string[] } | undefined {
    const spec = buildNativeVectorSpec(node);
    if (!spec) {
        return undefined;
    }

    return { lines: buildSwiftDrawingCanvasLines(spec, level), modifiers: buildSwiftVectorCanvasModifiers(node, spec, resolvedStyles, styleResolveOptions) };
}

function prependComposeModifierCall(modifier: string, call: string): string {
    return modifier === 'Modifier'
        ? `Modifier.${call}`
        : modifier.replace(/^Modifier/, `Modifier.${call}`);
}

function appendComposeModifierCall(modifier: string, call: string): string {
    return modifier === 'Modifier'
        ? `Modifier.${call}`
        : `${modifier}.${call}`;
}

function buildComposeButtonModifier(
    modifier: string,
    onClickExpression?: string,
    enabled = true,
    interactionSourceName?: string,
): string {
    if (!onClickExpression || !enabled) {
        return modifier;
    }

    return prependComposeModifierCall(
        modifier,
        interactionSourceName
            ? `clickable(interactionSource = ${interactionSourceName}, indication = LocalIndication.current) { ${onClickExpression} }`
            : `clickable { ${onClickExpression} }`,
    );
}

function buildComposeTextInputArgs(
    node: NativeElementNode,
    resolvedStyles?: NativeResolvedStyleMap,
    submitActionExpression?: string,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string[] {
    const args: string[] = [];
    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
    if (style) {
        const textStyle = buildComposeTextStyleLiteral(node, resolvedStyles, styleResolveOptions);
        if (textStyle) {
            args.push(`textStyle = ${textStyle}`);
        }

        const color = parseCssColor(style.color);
        if (color) {
            args.push(`cursorBrush = SolidColor(${toComposeColorLiteral(color)})`);
        }
    }

    if (isNativeDisabled(node)) {
        args.push('enabled = false');
    }

    if (isNativeReadOnly(node)) {
        args.push('readOnly = true');
    }

    const keyboardType = resolveComposeKeyboardType(node);
    if (keyboardType || submitActionExpression) {
        const keyboardArgs: string[] = [];
        if (keyboardType) {
            keyboardArgs.push(`keyboardType = ${keyboardType}`);
        }
        if (submitActionExpression) {
            keyboardArgs.push('imeAction = androidx.compose.ui.text.input.ImeAction.Done');
        }
        args.push(`keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(${keyboardArgs.join(', ')})`);
    }

    if (submitActionExpression) {
        args.push(`keyboardActions = androidx.compose.foundation.text.KeyboardActions(onDone = { ${submitActionExpression} })`);
    }

    if (resolveNativeTextInputType(node) === 'password') {
        args.push('visualTransformation = androidx.compose.ui.text.input.PasswordVisualTransformation()');
    }

    args.push(`singleLine = ${node.sourceTag === 'textarea' ? 'false' : 'true'}`);
    if (node.sourceTag === 'textarea') {
        args.push('minLines = 4');
    }

    return args;
}

function buildComposeModifier(
    node: NativeElementNode,
    resolvedStyles?: NativeResolvedStyleMap,
    hints: NativeRenderHints = {},
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
    styleOverride?: Record<string, NativePropValue>,
): string {
    const parts = ['Modifier'];
    if (node.component === 'Screen') {
        parts.push('fillMaxSize()');
        parts.push('verticalScroll(rememberScrollState())');
    }

    const style = styleOverride ?? getStyleObject(node, resolvedStyles, styleResolveOptions);
    if (style) {
        const padding = toDpLiteral(style.padding, styleResolveOptions);
        const paddingHorizontal = toDpLiteral(style.paddingHorizontal, styleResolveOptions);
        const paddingVertical = toDpLiteral(style.paddingVertical, styleResolveOptions);
        const parentFlexLayout = hints.parentFlexLayout;
        const flexStyle = resolveFlexStyleValues(style);
        const flexBasisValue = parentFlexLayout === 'Row'
            ? resolveAxisUnitNumber(flexStyle.basis, 'horizontal', hints, styleResolveOptions)
            : parentFlexLayout === 'Column'
                ? resolveAxisUnitNumber(flexStyle.basis, 'vertical', hints, styleResolveOptions)
                : undefined;
        const flexBasis = flexBasisValue !== undefined ? `${formatFloat(flexBasisValue)}.dp` : undefined;
        const hasFlexBasisSizeHint = flexBasisValue !== undefined && Math.abs(flexBasisValue) > 0.0001;
        const flexShrink = flexStyle.shrink;
        const shrinkableMainAxisBasis = hasFlexBasisSizeHint && flexShrink !== 0;
        const suppressExactWidth = parentFlexLayout === 'Row' && hints.negotiatedMaxWidth !== undefined && flexShrink !== 0;
        const suppressExactHeight = parentFlexLayout === 'Column' && hints.negotiatedMaxHeight !== undefined && flexShrink !== 0;
        const width = (!suppressExactWidth ? toAxisDpLiteral(style.width, 'horizontal', hints, styleResolveOptions) : undefined)
            ?? (parentFlexLayout === 'Row' && hasFlexBasisSizeHint && !shrinkableMainAxisBasis ? flexBasis : undefined);
        const height = (!suppressExactHeight ? toAxisDpLiteral(style.height, 'vertical', hints, styleResolveOptions) : undefined)
            ?? (parentFlexLayout === 'Column' && hasFlexBasisSizeHint && !shrinkableMainAxisBasis ? flexBasis : undefined);
        const minWidth = toAxisDpLiteral(style.minWidth, 'horizontal', hints, styleResolveOptions)
            ?? (parentFlexLayout === 'Row' && hasFlexBasisSizeHint && flexShrink === 0 ? flexBasis : undefined);
        const negotiatedMaxWidth = hints.negotiatedMaxWidth !== undefined
            ? `${formatFloat(hints.negotiatedMaxWidth)}.dp`
            : undefined;
        const maxWidth = negotiatedMaxWidth
            ?? toAxisDpLiteral(style.maxWidth, 'horizontal', hints, styleResolveOptions)
            ?? (parentFlexLayout === 'Row' && shrinkableMainAxisBasis ? flexBasis : undefined);
        const minHeight = toAxisDpLiteral(style.minHeight, 'vertical', hints, styleResolveOptions)
            ?? (parentFlexLayout === 'Column' && hasFlexBasisSizeHint && flexShrink === 0 ? flexBasis : undefined);
        const negotiatedMaxHeight = hints.negotiatedMaxHeight !== undefined
            ? `${formatFloat(hints.negotiatedMaxHeight)}.dp`
            : undefined;
        const maxHeight = negotiatedMaxHeight
            ?? toAxisDpLiteral(style.maxHeight, 'vertical', hints, styleResolveOptions)
            ?? (parentFlexLayout === 'Column' && shrinkableMainAxisBasis ? flexBasis : undefined);
        const radius = toDpLiteral(style.borderRadius, styleResolveOptions);
        const backgroundGradient = resolveBackgroundGradient(style);
        const backdropBlur = resolveBackdropBlurRadius(style, styleResolveOptions);
        const backgroundColor = resolveBackgroundColor(style, styleResolveOptions);
        const border = resolveNativeBorder(style, (value) => toDpLiteral(value, styleResolveOptions));
        const shadows = parseBoxShadowList(style.boxShadow, resolveStyleCurrentColor(style));
        const shadow = shadows[0];
        const aspectRatio = resolveAspectRatioValue(style.aspectRatio);
        const opacity = resolveOpacityValue(style.opacity);
        const zIndex = parsePlainNumericValue(style.zIndex);
        const shouldClipOverflow = shouldClipNativeOverflow(style);
        const transform = parseNativeTransform(style.transform, styleResolveOptions);
        const positionMode = resolvePositionMode(style.position);
        const positionInsets = resolvePositionInsets(style, hints, styleResolveOptions);
        const selfAlignment = resolveComposeSelfAlignmentCall(hints.parentFlexLayout, style);
        const childBaselineAlignment = resolveBaselineAlignmentKeyword(style.alignSelf);
        const shouldAlignByBaseline = node.component === 'Text'
            && hints.parentFlexLayout === 'Row'
            && (childBaselineAlignment !== undefined
                || (hints.parentRowBaselineAlignment !== undefined && resolveSelfAlignmentKeyword(style.alignSelf) === undefined));
        const selfAlignmentFillsWidth = selfAlignment === 'fillMaxWidth()';
        const selfAlignmentFillsHeight = selfAlignment === 'fillMaxHeight()';
        const marginCalls = buildComposeMarginPaddingCalls(style, styleResolveOptions);
        const autoMarginCalls = buildComposeAutoMarginCalls(style);
        const shouldForceAutoMarginFillWidth = shouldCenterConstrainedHorizontalAutoMargins(style);
        const paddingCalls: string[] = [];
        const flexValue = flexStyle.grow;

        if (padding) {
            paddingCalls.push(`padding(${padding})`);
        } else {
            const paddingArgs: string[] = [];
            const spacing = resolveDirectionalSpacing(style, 'padding', (value) => toDpLiteral(value, styleResolveOptions));
            const top = spacing.top;
            const right = spacing.right;
            const bottom = spacing.bottom;
            const left = spacing.left;

            if (paddingHorizontal) paddingArgs.push(`horizontal = ${paddingHorizontal}`);
            if (paddingVertical) paddingArgs.push(`vertical = ${paddingVertical}`);
            if (top) paddingArgs.push(`top = ${top}`);
            if (right) paddingArgs.push(`end = ${right}`);
            if (bottom) paddingArgs.push(`bottom = ${bottom}`);
            if (left) paddingArgs.push(`start = ${left}`);

            if (paddingArgs.length > 0) {
                paddingCalls.push(`padding(${paddingArgs.join(', ')})`);
            }
        }

        parts.push(...marginCalls);

        if (shouldForceAutoMarginFillWidth) {
            parts.push('fillMaxWidth()');
        }

        if (isFillValue(style.width) && !suppressExactWidth) {
            parts.push('fillMaxWidth()');
        } else if (width) {
            parts.push(`width(${width})`);
        } else if (hints.fillWidth && !shouldForceAutoMarginFillWidth && !selfAlignmentFillsWidth) {
            parts.push('fillMaxWidth()');
        }

        if (isFillValue(style.height) && !suppressExactHeight) {
            parts.push('fillMaxHeight()');
        } else if (height) {
            parts.push(`height(${height})`);
        } else if (hints.fillHeight && !selfAlignmentFillsHeight) {
            parts.push('fillMaxHeight()');
        }

        const widthInArgs: string[] = [];
        if (minWidth) widthInArgs.push(`min = ${minWidth}`);
        if (maxWidth) widthInArgs.push(`max = ${maxWidth}`);
        if (widthInArgs.length > 0) {
            parts.push(`widthIn(${widthInArgs.join(', ')})`);
        }

        const heightInArgs: string[] = [];
        if (minHeight) heightInArgs.push(`min = ${minHeight}`);
        if (maxHeight) heightInArgs.push(`max = ${maxHeight}`);
        if (heightInArgs.length > 0) {
            parts.push(`heightIn(${heightInArgs.join(', ')})`);
        }

        if (aspectRatio !== undefined) {
            parts.push(`aspectRatio(${formatFloat(aspectRatio)}f)`);
        }

        parts.push(...autoMarginCalls);

        if (shadows.length > 0) {
            for (const entry of shadows) {
                parts.push(`shadow(elevation = ${toComposeShadowElevation(entry)}, shape = RoundedCornerShape(${radius ?? '0.dp'}))`);
            }
        }

        if (backgroundGradient) {
            if (radius) {
                parts.push(`background(brush = ${toComposeBrushLiteral(backgroundGradient)}, shape = RoundedCornerShape(${radius}))`);
            } else {
                parts.push(`background(brush = ${toComposeBrushLiteral(backgroundGradient)})`);
            }
        } else if (backgroundColor) {
            if (radius) {
                parts.push(`background(color = ${toComposeColorLiteral(backgroundColor)}, shape = RoundedCornerShape(${radius}))`);
            } else {
                parts.push(`background(${toComposeColorLiteral(backgroundColor)})`);
            }
        }

        if (backdropBlur !== undefined && !shadow && radius) {
            parts.push(`shadow(elevation = ${formatFloat(Math.max(12, backdropBlur / 1.5))}.dp, shape = RoundedCornerShape(${radius}))`);
        }

        if (border?.width && border.color) {
            const styledBorderModifier = buildComposeUniformStyledBorderModifier(border, radius);
            if (styledBorderModifier) {
                parts.push(styledBorderModifier);
            } else if (radius) {
                parts.push(`border(${border.width}, ${toComposeColorLiteral(border.color)}, RoundedCornerShape(${radius}))`);
            } else {
                parts.push(`border(${border.width}, ${toComposeColorLiteral(border.color)})`);
            }
        } else {
            const sideBorderModifier = buildComposeSideBorderModifier(border ?? {});
            if (sideBorderModifier) {
                parts.push(sideBorderModifier);
            }
        }

        const positionUsesEndX = positionInsets.left === undefined && positionInsets.right !== undefined;
        const positionUsesEndY = positionInsets.top === undefined && positionInsets.bottom !== undefined;
        const combinedOffsetX = (positionInsets.left ?? (positionInsets.right !== undefined ? -positionInsets.right : 0)) + (transform?.translateX ?? 0);
        const combinedOffsetY = (positionInsets.top ?? (positionInsets.bottom !== undefined ? -positionInsets.bottom : 0)) + (transform?.translateY ?? 0);
        if ((positionMode === 'absolute' || positionMode === 'fixed') && hints.absoluteOverlay && (positionUsesEndX || positionUsesEndY)) {
            parts.push(`align(Alignment.${positionUsesEndY ? 'Bottom' : 'Top'}${positionUsesEndX ? 'End' : 'Start'})`);
        }

        const offsetArgs: string[] = [];
        if (combinedOffsetX !== 0) offsetArgs.push(`x = ${formatFloat(combinedOffsetX)}.dp`);
        if (combinedOffsetY !== 0) offsetArgs.push(`y = ${formatFloat(combinedOffsetY)}.dp`);
        if (offsetArgs.length > 0) {
            parts.push(`offset(${offsetArgs.join(', ')})`);
        }

        const graphicsLayerArgs: string[] = [];
        if (transform?.scaleX !== undefined) graphicsLayerArgs.push(`scaleX = ${formatFloat(transform.scaleX)}f`);
        if (transform?.scaleY !== undefined) graphicsLayerArgs.push(`scaleY = ${formatFloat(transform.scaleY)}f`);
        if (transform?.rotationDegrees !== undefined) graphicsLayerArgs.push(`rotationZ = ${formatFloat(transform.rotationDegrees)}f`);
        if (graphicsLayerArgs.length > 0) {
            parts.push(`graphicsLayer(${graphicsLayerArgs.join(', ')})`);
        }

        if (selfAlignment) {
            parts.push(selfAlignment);
        }

        if (shouldAlignByBaseline) {
            parts.push('alignByBaseline()');
        }

        if (shouldClipOverflow) {
            parts.push(`clip(${radius ? `RoundedCornerShape(${radius})` : 'RectangleShape'})`);
        }

        if (opacity !== undefined && opacity < 1) {
            parts.push(`alpha(${formatFloat(opacity)}f)`);
        }

        if (zIndex !== undefined && zIndex !== 0) {
            parts.push(`zIndex(${formatFloat(zIndex)}f)`);
        }

        if (flexValue !== undefined && Number.isFinite(flexValue) && flexValue > 0) {
            parts.push(`weight(${flexValue}f)`);
        }

        parts.push(...paddingCalls);
    }

    if (!style && hints.fillWidth) {
        parts.push('fillMaxWidth()');
    }

    const accessibilityModifier = buildComposeAccessibilityModifier(node);
    if (accessibilityModifier) {
        parts.push(accessibilityModifier);
    }

    return parts.join('.');
}

function renderComposeChildren(
    nodes: NativeNode[],
    level: number,
    context: AndroidComposeContext,
    parentLayout?: 'Column' | 'Row',
    parentNode?: NativeElementNode,
    parentHints?: NativeRenderHints,
): string[] {
    const lines: string[] = [];
    const orderedNodes = parentNode
        ? getOrderedNativeChildren(parentNode, nodes, context.resolvedStyles, context.styleResolveOptions)
        : nodes;
    const availableWidth = parentNode
        ? resolveNativeAvailableAxisSize(parentNode, 'horizontal', context.resolvedStyles, parentHints, context.styleResolveOptions)
        : resolveAxisReferenceLength('horizontal', parentHints, context.styleResolveOptions);
    const availableHeight = parentNode
        ? resolveNativeAvailableAxisSize(parentNode, 'vertical', context.resolvedStyles, parentHints, context.styleResolveOptions)
        : resolveAxisReferenceLength('vertical', parentHints, context.styleResolveOptions);
    const parentFlexLayout = resolveNativeFlexContainerLayout(parentNode, context.resolvedStyles, context.styleResolveOptions);
    const inheritedParentFlexLayout = parentFlexLayout ?? parentLayout;
    const flexShrinkTargets = resolveNativeFlexShrinkTargets(
        parentNode,
        orderedNodes,
        parentFlexLayout,
        availableWidth,
        availableHeight,
        parentHints,
        context.resolvedStyles,
        context.styleResolveOptions,
    );
    const parentRowBaselineAlignment = parentFlexLayout === 'Row' && parentNode
        ? resolveBaselineAlignmentKeyword(getStyleObject(parentNode, context.resolvedStyles, context.styleResolveOptions)?.alignItems)
        : undefined;
    for (const child of orderedNodes) {
        const shouldDefaultFillCrossAxis = shouldDefaultFillWidthHint(child, context.resolvedStyles, context.styleResolveOptions);
        const shouldStretchCrossAxis = shouldStretchFlexChildCrossAxis(
            child,
            parentFlexLayout,
            parentNode,
            parentHints,
            context.resolvedStyles,
            context.styleResolveOptions,
        );
        const childHints: NativeRenderHints = {
            availableWidth,
            availableHeight,
            ...(parentLayout === 'Column' && shouldDefaultFillCrossAxis
                && (!parentFlexLayout || (parentFlexLayout === 'Column' && shouldStretchCrossAxis))
                ? { fillWidth: true }
                : {}),
            ...(parentLayout === 'Row' && parentFlexLayout === 'Row' && shouldDefaultFillCrossAxis && shouldStretchCrossAxis
                ? { fillHeight: true }
                : {}),
            ...(child.kind === 'element' && parentFlexLayout === 'Row' && flexShrinkTargets.has(child)
                ? { negotiatedMaxWidth: flexShrinkTargets.get(child) }
                : {}),
            ...(child.kind === 'element' && parentFlexLayout === 'Column' && flexShrinkTargets.has(child)
                ? { negotiatedMaxHeight: flexShrinkTargets.get(child) }
                : {}),
            ...(inheritedParentFlexLayout ? { parentFlexLayout: inheritedParentFlexLayout } : {}),
            ...(parentRowBaselineAlignment ? { parentRowBaselineAlignment } : {}),
        };
        lines.push(...renderComposeNode(child, level, context, childHints));
    }
    return lines;
}

function resolveComposeLayout(node: NativeElementNode, resolvedStyles?: NativeResolvedStyleMap): 'Row' | 'Column' {
    const style = getStyleObject(node, resolvedStyles);
    const styleLayout = resolveLayoutDirection(style);
    if (styleLayout) return styleLayout;
    return node.component === 'Row' || node.component === 'ListItem' ? 'Row' : 'Column';
}

function buildComposeChunkedRowArguments(
    style: Record<string, NativePropValue> | undefined,
    modifier: string,
    columnGap?: number,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string {
    const args = [`modifier = ${modifier}`];
    const arrangement = buildComposeArrangement(
        'Row',
        style,
        styleResolveOptions,
        columnGap !== undefined ? `${formatFloat(columnGap)}.dp` : undefined,
    );
    if (arrangement) {
        args.push(`horizontalArrangement = ${arrangement}`);
    }

    const alignment = buildComposeCrossAlignment('Row', style);
    if (alignment) {
        args.push(`verticalAlignment = ${alignment}`);
    }

    return args.join(', ');
}

function hasNativeGridColumnConstraint(spec: NativeGridColumnTrackSizeSpec | undefined): boolean {
    return Boolean(spec && (spec.width !== undefined || spec.minWidth !== undefined || spec.maxWidth !== undefined));
}

function buildComposeGridCellModifier(
    weight: number | undefined,
    shouldExpandWidth: boolean,
    shouldExpandHeight: boolean,
    columnSize: NativeGridColumnTrackSizeSpec | undefined,
): string {
    let modifier = 'Modifier';

    if (weight !== undefined) {
        modifier = appendComposeModifierCall(modifier, `weight(${formatFloat(weight)}f)`);
    }

    if (shouldExpandWidth) {
        modifier = appendComposeModifierCall(modifier, 'fillMaxWidth()');
    }
    if (shouldExpandHeight) {
        modifier = appendComposeModifierCall(modifier, 'fillMaxHeight()');
    }

    if (columnSize?.width !== undefined) {
        modifier = appendComposeModifierCall(modifier, `width(${formatFloat(columnSize.width)}.dp)`);
    } else if (columnSize?.minWidth !== undefined || columnSize?.maxWidth !== undefined) {
        const widthInArgs: string[] = [];
        if (columnSize.minWidth !== undefined) {
            widthInArgs.push(`min = ${formatFloat(columnSize.minWidth)}.dp`);
        }
        if (columnSize.maxWidth !== undefined) {
            widthInArgs.push(`max = ${formatFloat(columnSize.maxWidth)}.dp`);
        }
        modifier = appendComposeModifierCall(modifier, `widthIn(${widthInArgs.join(', ')})`);
    }

    return modifier;
}

function resolveComposeGridCellContentAlignment(
    horizontal: NativeGridItemAlignment | undefined,
    vertical: NativeGridItemAlignment | undefined,
): string | undefined {
    const resolvedHorizontal = horizontal && horizontal !== 'stretch' ? horizontal : undefined;
    const resolvedVertical = vertical && vertical !== 'stretch' ? vertical : undefined;
    if (!resolvedHorizontal && !resolvedVertical) {
        return undefined;
    }

    const horizontalToken = resolvedHorizontal === 'center'
        ? 'Center'
        : resolvedHorizontal === 'end'
            ? 'End'
            : 'Start';
    const verticalToken = resolvedVertical === 'center'
        ? 'Center'
        : resolvedVertical === 'end'
            ? 'Bottom'
            : 'Top';

    return verticalToken === 'Center' && horizontalToken === 'Center'
        ? 'Alignment.Center'
        : `Alignment.${verticalToken}${horizontalToken}`;
}

function buildComposeChunkedColumnArrangement(layout: NativeChunkedLayout): string | undefined {
    const contentAlignment = resolveEffectiveChunkedContentAlignment(layout);
    const gap = layout.rowGap !== undefined ? `${formatFloat(layout.rowGap)}.dp` : undefined;

    switch (contentAlignment) {
        case 'center':
            return gap ? `Arrangement.spacedBy(${gap}, Alignment.CenterVertically)` : 'Arrangement.Center';
        case 'end':
            return gap ? `Arrangement.spacedBy(${gap}, Alignment.Bottom)` : 'Arrangement.Bottom';
        case 'space-between':
            return 'Arrangement.SpaceBetween';
        case 'space-around':
            return 'Arrangement.SpaceAround';
        case 'space-evenly':
            return 'Arrangement.SpaceEvenly';
        default:
            return gap ? `Arrangement.spacedBy(${gap})` : undefined;
    }
}

function buildComposeBackgroundImageInvocation(spec: NativeBackgroundImageSpec, modifier: string): string {
    return `ElitBackgroundImage(source = ${quoteKotlinString(spec.source)}${spec.fit !== 'cover' ? `, backgroundSize = ${quoteKotlinString(spec.fit)}` : ''}${spec.position !== 'center' ? `, backgroundPosition = ${quoteKotlinString(spec.position)}` : ''}${spec.repeat !== 'no-repeat' ? `, backgroundRepeat = ${quoteKotlinString(spec.repeat)}` : ''}, modifier = ${modifier})`;
}

function shouldRenderNativeBackgroundLayersWithWrapper(layers: NativeBackgroundLayerSpec[]): boolean {
    return layers.length > 1 || layers.some((layer) => layer.kind === 'image');
}

function buildComposeBackgroundLayerInvocation(layer: NativeBackgroundLayerSpec, modifier: string): string {
    if (layer.kind === 'image') {
        return buildComposeBackgroundImageInvocation(layer, modifier);
    }

    const backgroundCall = layer.kind === 'gradient'
        ? `background(brush = ${toComposeBrushLiteral(layer.gradient)})`
        : `background(${toComposeColorLiteral(layer.color)})`;
    return `Box(modifier = ${appendComposeModifierCall(modifier, backgroundCall)})`;
}

function resolveSwiftGridCellFrameAlignment(
    horizontal: NativeGridItemAlignment | undefined,
    vertical: NativeGridItemAlignment | undefined,
): string | undefined {
    const resolvedHorizontal = horizontal && horizontal !== 'stretch' ? horizontal : undefined;
    const resolvedVertical = vertical && vertical !== 'stretch' ? vertical : undefined;
    if (!resolvedHorizontal && !resolvedVertical) {
        return undefined;
    }

    const horizontalToken = resolvedHorizontal === 'center'
        ? 'center'
        : resolvedHorizontal === 'end'
            ? 'trailing'
            : 'leading';
    const verticalToken = resolvedVertical === 'center'
        ? 'center'
        : resolvedVertical === 'end'
            ? 'bottom'
            : 'top';

    if (verticalToken === 'center') {
        if (horizontalToken === 'center') {
            return '.center';
        }

        return horizontalToken === 'trailing' ? '.trailing' : '.leading';
    }

    if (horizontalToken === 'center') {
        return verticalToken === 'bottom' ? '.bottom' : '.top';
    }

    return `.${verticalToken}${horizontalToken === 'trailing' ? 'Trailing' : 'Leading'}`;
}

function resolveNativeGridCellFillWidth(defaultFillWidth: boolean, horizontalAlignment: NativeGridItemAlignment | undefined): boolean {
    if (!horizontalAlignment) {
        return defaultFillWidth;
    }

    return horizontalAlignment === 'stretch';
}

function buildSwiftGridCellFrameModifier(
    shouldExpandWidth: boolean,
    shouldExpandHeight: boolean,
    alignment: string | undefined,
    columnSize?: NativeGridColumnTrackSizeSpec,
): string | undefined {
    const frameArgs: string[] = [];
    if (columnSize?.width !== undefined) {
        frameArgs.push(`width: ${formatFloat(columnSize.width)}`);
    } else {
        if (columnSize?.minWidth !== undefined) {
            frameArgs.push(`minWidth: ${formatFloat(columnSize.minWidth)}`);
        }
        if (columnSize?.maxWidth !== undefined) {
            frameArgs.push(`maxWidth: ${formatFloat(columnSize.maxWidth)}`);
        }
    }
    if (shouldExpandWidth) {
        frameArgs.push('maxWidth: .infinity');
    }
    if (shouldExpandHeight) {
        frameArgs.push('maxHeight: .infinity');
    }
    if (alignment) {
        frameArgs.push(`alignment: ${alignment}`);
    } else if (frameArgs.length > 0) {
        frameArgs.push(`alignment: ${shouldExpandHeight ? '.topLeading' : '.leading'}`);
    }

    return frameArgs.length > 0 ? `.frame(${frameArgs.join(', ')})` : undefined;
}

function renderComposeChunkedLayout(
    node: NativeElementNode,
    layout: NativeChunkedLayout,
    level: number,
    context: AndroidComposeContext,
    modifier: string,
    hints: NativeRenderHints,
): string[] {
    const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
    const outerGap = buildComposeChunkedColumnArrangement(layout);
    const effectiveContentAlignment = resolveEffectiveChunkedContentAlignment(layout);
    const usesSingleRowGridStackAlignment = layout.kind === 'grid'
        && layout.rows.length === 1
        && effectiveContentAlignment !== undefined
        && effectiveContentAlignment !== 'start';
    const buildRowModifier = (baseModifier: string, row: NativeChunkedRow): string => {
        let modifierWithTrackSizing = baseModifier;
        if (row.height !== undefined) {
            modifierWithTrackSizing = prependComposeModifierCall(modifierWithTrackSizing, `height(${formatFloat(row.height)}.dp)`);
        } else if (row.minHeight !== undefined || row.maxHeight !== undefined) {
            const heightInArgs: string[] = [];
            if (row.minHeight !== undefined) {
                heightInArgs.push(`min = ${formatFloat(row.minHeight)}.dp`);
            }
            if (row.maxHeight !== undefined) {
                heightInArgs.push(`max = ${formatFloat(row.maxHeight)}.dp`);
            }
            modifierWithTrackSizing = prependComposeModifierCall(modifierWithTrackSizing, `heightIn(${heightInArgs.join(', ')})`);
        }

        return row.trackWeight !== undefined
            ? prependComposeModifierCall(modifierWithTrackSizing, `weight(${formatFloat(row.trackWeight)}f, fill = true)`)
            : modifierWithTrackSizing;
    };

    if (layout.kind === 'grid' && layout.rows.length === 1 && !usesSingleRowGridStackAlignment) {
        const [row] = layout.rows;
        const lines = [`${indent(level)}Row(${buildComposeChunkedRowArguments(style, buildRowModifier(modifier, row), layout.columnGap, context.styleResolveOptions)}) {`];
        const totalWeight = row.weights ? row.weights.reduce<number>((sum, entry) => sum + (entry ?? 0), 0) : undefined;
        row.items.forEach((child, index) => {
            const weight = row.weights?.[index];
            const columnSize = row.columnSizes?.[index];
            const baseFillChild = shouldFillChunkedCellChild(child);
            const cellAlignment = resolveNativeGridCellAlignment(child, style, context.resolvedStyles, context.styleResolveOptions);
            const fillChild = resolveNativeGridCellFillWidth(baseFillChild, cellAlignment.horizontal);
            const fillHeight = cellAlignment.vertical === 'stretch';
            const shouldExpandCellHeight = cellAlignment.vertical !== undefined;
            const shouldExpandCellWidth = weight !== undefined
                ? fillChild
                : !hasNativeGridColumnConstraint(columnSize) && fillChild;
            const cellModifier = buildComposeGridCellModifier(weight, shouldExpandCellWidth, shouldExpandCellHeight, columnSize);
            const contentAlignment = resolveComposeGridCellContentAlignment(cellAlignment.horizontal, cellAlignment.vertical);
            const cellAvailableWidth = weight !== undefined && totalWeight && hints.availableWidth !== undefined
                ? Math.max(0, (hints.availableWidth - ((layout.columnGap ?? 0) * Math.max(0, row.items.length - 1))) * (weight / totalWeight))
                : columnSize?.width ?? columnSize?.maxWidth ?? hints.availableWidth;
            lines.push(`${indent(level + 1)}Box(modifier = ${cellModifier}${contentAlignment ? `, contentAlignment = ${contentAlignment}` : ''}) {`);
            lines.push(...renderComposeNode(child, level + 2, context, {
                ...(fillChild ? { fillWidth: true } : {}),
                ...(fillHeight ? { fillHeight: true } : {}),
                availableWidth: cellAvailableWidth,
                availableHeight: hints.availableHeight,
            }));
            lines.push(`${indent(level + 1)}}`);
        });
        lines.push(`${indent(level)}}`);
        return lines;
    }

    const lines = [`${indent(level)}Column(modifier = ${modifier}${outerGap ? `, verticalArrangement = ${outerGap}` : ''}) {`];
    for (const row of layout.rows) {
        const totalWeight = row.weights ? row.weights.reduce<number>((sum, entry) => sum + (entry ?? 0), 0) : undefined;
        lines.push(`${indent(level + 1)}Row(${buildComposeChunkedRowArguments(style, buildRowModifier('Modifier.fillMaxWidth()', row), layout.columnGap, context.styleResolveOptions)}) {`);
        row.items.forEach((child, index) => {
            const weight = row.weights?.[index];
            const columnSize = row.columnSizes?.[index];
            const baseFillChild = layout.kind === 'grid' && shouldFillChunkedCellChild(child);
            const cellAlignment = layout.kind === 'grid'
                ? resolveNativeGridCellAlignment(child, style, context.resolvedStyles, context.styleResolveOptions)
                : {};
            const fillChild = layout.kind === 'grid'
                ? resolveNativeGridCellFillWidth(baseFillChild, cellAlignment.horizontal)
                : baseFillChild;
            const fillHeight = layout.kind === 'grid' && cellAlignment.vertical === 'stretch';
            const shouldExpandCellHeight = layout.kind === 'grid' && cellAlignment.vertical !== undefined;
            const shouldExpandCellWidth = weight !== undefined
                ? fillChild
                : !hasNativeGridColumnConstraint(columnSize) && fillChild;
            const cellModifier = buildComposeGridCellModifier(weight, shouldExpandCellWidth, shouldExpandCellHeight, columnSize);
            const contentAlignment = layout.kind === 'grid'
                ? resolveComposeGridCellContentAlignment(cellAlignment.horizontal, cellAlignment.vertical)
                : undefined;
            const cellAvailableWidth = weight !== undefined && totalWeight && hints.availableWidth !== undefined
                ? Math.max(0, (hints.availableWidth - ((layout.columnGap ?? 0) * Math.max(0, row.items.length - 1))) * (weight / totalWeight))
                : columnSize?.width ?? columnSize?.maxWidth ?? hints.availableWidth;
            lines.push(`${indent(level + 2)}Box(modifier = ${cellModifier}${contentAlignment ? `, contentAlignment = ${contentAlignment}` : ''}) {`);
            lines.push(...renderComposeNode(child, level + 3, context, {
                ...(fillChild ? { fillWidth: true } : {}),
                ...(fillHeight ? { fillHeight: true } : {}),
                availableWidth: cellAvailableWidth,
                availableHeight: hints.availableHeight,
            }));
            lines.push(`${indent(level + 2)}}`);
        });
        lines.push(`${indent(level + 1)}}`);
    }
    lines.push(`${indent(level)}}`);
    return lines;
}

function renderComposeContainerContent(
    node: NativeElementNode,
    level: number,
    context: AndroidComposeContext,
    modifier: string,
    hints: NativeRenderHints,
): string[] {
    const chunkedLayout = resolveChunkedLayout(node, context.resolvedStyles, context.styleResolveOptions);
    if (chunkedLayout) {
        return renderComposeChunkedLayout(node, chunkedLayout, level, context, modifier, hints);
    }

    const layout = resolveComposeLayout(node, context.resolvedStyles);
    return [
        `${indent(level)}${layout}(${buildComposeLayoutArguments(node, layout, modifier, context.resolvedStyles, context.styleResolveOptions)}) {`,
        ...renderComposeChildren(node.children, level + 1, context, layout, node, hints),
        `${indent(level)}}`,
    ];
}

function renderComposeContainerBody(
    node: NativeElementNode,
    level: number,
    context: AndroidComposeContext,
    modifier: string,
    hints: NativeRenderHints,
): string[] {
    const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
    const backgroundLayers = resolveNativeBackgroundLayers(node, context.resolvedStyles, context.styleResolveOptions);
    if (!shouldRenderNativeBackgroundLayersWithWrapper(backgroundLayers)) {
        return renderComposeContainerContent(node, level, context, modifier, hints);
    }

    if (backgroundLayers.some((layer) => layer.kind === 'image')) {
        context.helperFlags.add('backgroundImage');
    }

    const contentStyle = stripNativeBackgroundPaintStyles(style);
    const contentModifier = contentStyle
        ? buildComposeModifier(node, context.resolvedStyles, hints, context.styleResolveOptions, contentStyle)
        : modifier;
    const radius = toDpLiteral(style?.borderRadius, context.styleResolveOptions);
    const backgroundModifier = `Modifier.matchParentSize()${radius ? `.clip(RoundedCornerShape(${radius}))` : ''}`;
    const renderedBackgroundLayers = [...backgroundLayers].reverse();

    return [
        `${indent(level)}Box {`,
        ...renderedBackgroundLayers.map((backgroundLayer) => `${indent(level + 1)}${buildComposeBackgroundLayerInvocation(backgroundLayer, backgroundModifier)}`),
        ...renderComposeContainerContent(node, level + 1, context, contentModifier, hints),
        `${indent(level)}}`,
    ];
}

function buildComposeLayoutArguments(
    node: NativeElementNode,
    layout: 'Row' | 'Column',
    modifier: string,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string {
    const args = [`modifier = ${modifier}`];
    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
    const arrangement = buildComposeArrangement(layout, style, styleResolveOptions);
    const alignment = buildComposeCrossAlignment(layout, style);

    if (layout === 'Row') {
        if (arrangement) args.push(`horizontalArrangement = ${arrangement}`);
        if (alignment) args.push(`verticalAlignment = ${alignment}`);
    } else {
        if (arrangement) args.push(`verticalArrangement = ${arrangement}`);
        if (alignment) args.push(`horizontalAlignment = ${alignment}`);
    }

    return args.join(', ');
}

function renderTextComposable(node: NativeTextNode, level: number, context: AndroidComposeContext): string[] {
    if (node.stateId) {
        const { descriptor, variableName } = ensureComposeStateVariable(context, node.stateId);
        return [`${indent(level)}Text(text = ${toComposeTextValueExpression(variableName, descriptor)})`];
    }

    return [`${indent(level)}Text(text = ${quoteKotlinString(node.value)})`];
}

function renderComposeNode(
    node: NativeNode,
    level: number,
    context: AndroidComposeContext,
    hints: NativeRenderHints = {},
): string[] {
    if (node.kind === 'text') {
        return renderTextComposable(node, level, context);
    }

    const modifier = buildComposeModifier(node, context.resolvedStyles, hints, context.styleResolveOptions);
    const classComment = Array.isArray(node.props.classList) && node.props.classList.length > 0
        ? `${indent(level)}// classList: ${(node.props.classList as NativePropValue[]).map((item) => String(item)).join(' ')}`
        : undefined;
    const lines: string[] = [];
    if (classComment) lines.push(classComment);

    if (node.component === 'Text') {
        const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
        const dynamicText = buildComposeTextExpression(node.children, context, resolveTextTransform(style?.textTransform));
        const staticText = applyTextTransform(flattenTextContent(node.children), resolveTextTransform(style?.textTransform));
        const args = [`text = ${dynamicText ?? quoteKotlinString(staticText)}`];
        if (modifier !== 'Modifier') args.push(`modifier = ${modifier}`);
        args.push(...buildComposeTextStyleArgs(node, context.resolvedStyles, context.styleResolveOptions));
        return [...lines, `${indent(level)}Text(${args.join(', ')})`];
    }

    if (node.component === 'Toggle') {
        const binding = getNativeBindingReference(node);
        const stateName = binding?.kind === 'checked'
            ? ensureComposeStateVariable(context, binding.id).variableName
            : `toggleValue${context.toggleIndex++}`;
        const disabled = isNativeDisabled(node);
        const toggleEventStatements = disabled
            ? []
            : buildComposeControlEventDispatchStatements(node, { checkedExpression: 'checked' });

        if (!binding || binding.kind !== 'checked') {
            context.stateDeclarations.push(`${indent(1)}var ${stateName} by remember { mutableStateOf(${toNativeBoolean(node.props.checked) ? 'true' : 'false'}) }`);
        }

        if (toggleEventStatements.length > 0) {
            context.helperFlags.add('bridge');
        }

        lines.push(`${indent(level)}Checkbox(`);
        lines.push(`${indent(level + 1)}checked = ${stateName},`);
        lines.push(`${indent(level + 1)}onCheckedChange = { checked -> ${stateName} = checked${toggleEventStatements.length > 0 ? `; ${toggleEventStatements.join('; ')}` : ''} },`);
        if (disabled) {
            lines.push(`${indent(level + 1)}enabled = false,`);
        }
        lines.push(`${indent(level + 1)}modifier = ${modifier}`);
        lines.push(`${indent(level)})`);
        return lines;
    }

    if (node.component === 'TextInput') {
        const binding = getNativeBindingReference(node);
        const textFieldId = context.textFieldIndex++;
        let stateName = `textFieldValue${textFieldId}`;
        let valueExpression = stateName;
        let onValueChange = `${stateName} = nextValue`;
        const disabled = isNativeDisabled(node);
        const readOnly = isNativeReadOnly(node);
        const autoFocus = !disabled && shouldNativeAutoFocus(node);
        const focusRequesterName = `textFieldFocusRequester${textFieldId}`;

        if (binding?.kind === 'value') {
            const { descriptor, variableName } = ensureComposeStateVariable(context, binding.id);
            stateName = variableName;
            valueExpression = toComposeTextValueExpression(variableName, descriptor);
            if (descriptor.type === 'string') {
                onValueChange = `${variableName} = nextValue`;
            } else if (descriptor.type === 'number') {
                onValueChange = `${variableName} = nextValue.toDoubleOrNull() ?: ${variableName}`;
            } else {
                onValueChange = `${variableName} = nextValue.equals("true", ignoreCase = true)`;
            }
        } else {
            const initialValue = typeof node.props.value === 'string' || typeof node.props.value === 'number'
                ? String(node.props.value)
                : '';
            context.stateDeclarations.push(`${indent(1)}var ${stateName} by remember { mutableStateOf(${quoteKotlinString(initialValue)}) }`);
        }

        const textInputEventStatements = !disabled && !readOnly
            ? buildComposeControlEventDispatchStatements(node, { valueExpression: 'nextValue' })
            : [];
        const submitEventStatement = !disabled && !readOnly && node.sourceTag !== 'textarea' && node.events.includes('submit')
            ? buildComposeControlEventDispatchInvocation(node, 'submit', { valueExpression: valueExpression })
            : undefined;

        if (textInputEventStatements.length > 0 || submitEventStatement) {
            context.helperFlags.add('bridge');
        }

        if (autoFocus) {
            context.stateDeclarations.push(`${indent(1)}val ${focusRequesterName} = remember { androidx.compose.ui.focus.FocusRequester() }`);
            lines.push(`${indent(level)}LaunchedEffect(Unit) {`);
            lines.push(`${indent(level + 1)}${focusRequesterName}.requestFocus()`);
            lines.push(`${indent(level)}}`);
        }

        lines.push(`${indent(level)}BasicTextField(`);
        lines.push(`${indent(level + 1)}value = ${valueExpression},`);
        lines.push(`${indent(level + 1)}onValueChange = { nextValue -> ${onValueChange}${textInputEventStatements.length > 0 ? `; ${textInputEventStatements.join('; ')}` : ''} },`);
        lines.push(`${indent(level + 1)}modifier = ${autoFocus ? prependComposeModifierCall(modifier, `focusRequester(${focusRequesterName})`) : modifier},`);

        const textInputArgs = buildComposeTextInputArgs(node, context.resolvedStyles, submitEventStatement, context.styleResolveOptions);
        textInputArgs.forEach((arg) => {
            lines.push(`${indent(level + 1)}${arg},`);
        });

        if (typeof node.props.placeholder === 'string') {
            const placeholderArgs = buildComposeTextStyleArgs(node, context.resolvedStyles, context.styleResolveOptions)
                .filter((arg) => !arg.startsWith('textDecoration = '));
            const placeholder = placeholderArgs.length > 0
                ? `Text(text = ${quoteKotlinString(node.props.placeholder)}, ${placeholderArgs.join(', ')})`
                : `Text(text = ${quoteKotlinString(node.props.placeholder)})`;
            const contentAlignment = node.sourceTag === 'textarea' ? 'Alignment.TopStart' : 'Alignment.CenterStart';

            lines.push(`${indent(level + 1)}decorationBox = { innerTextField ->`);
            lines.push(`${indent(level + 2)}Box(modifier = Modifier.fillMaxWidth(), contentAlignment = ${contentAlignment}) {`);
            lines.push(`${indent(level + 3)}if (${valueExpression}.isEmpty()) {`);
            lines.push(`${indent(level + 4)}${placeholder}`);
            lines.push(`${indent(level + 3)}}`);
            lines.push(`${indent(level + 3)}innerTextField()`);
            lines.push(`${indent(level + 2)}}`);
            lines.push(`${indent(level + 1)}},`);
        }

        lines.push(`${indent(level)})`);
        return lines;
    }

    if (node.component === 'Slider') {
        const binding = getNativeBindingReference(node);
        const sliderId = context.sliderIndex++;
        const disabled = isNativeDisabled(node);
        const min = resolveNativeRangeMin(node);
        const max = resolveNativeRangeMax(node);
        const initialValue = resolveNativeRangeInitialValue(node);
        const steps = resolveComposeSliderSteps(node);
        let stateName = `sliderValue${sliderId}`;
        let valueExpression = stateName;
        let onValueChange = `${stateName} = nextValue`;

        if (binding?.kind === 'value') {
            const { descriptor, variableName } = ensureComposeStateVariable(context, binding.id);
            stateName = variableName;
            if (descriptor.type === 'number') {
                valueExpression = `${variableName}.toFloat()`;
                onValueChange = `${variableName} = nextValue.toDouble()`;
            } else {
                valueExpression = `${variableName}.toFloatOrNull() ?: ${formatFloat(initialValue)}f`;
                onValueChange = `${variableName} = nextValue.toString()`;
            }
        } else {
            context.stateDeclarations.push(`${indent(1)}var ${stateName} by remember { mutableStateOf(${formatFloat(initialValue)}f) }`);
        }

        const sliderEventStatements = disabled
            ? []
            : buildComposeControlEventDispatchStatements(node, { valueExpression: 'nextValue.toString()' });
        if (sliderEventStatements.length > 0) {
            context.helperFlags.add('bridge');
        }

        lines.push(`${indent(level)}Slider(`);
        lines.push(`${indent(level + 1)}value = ${valueExpression},`);
        lines.push(`${indent(level + 1)}onValueChange = { nextValue -> ${onValueChange}${sliderEventStatements.length > 0 ? `; ${sliderEventStatements.join('; ')}` : ''} },`);
        lines.push(`${indent(level + 1)}valueRange = ${formatFloat(min)}f..${formatFloat(max)}f,`);
        if (steps !== undefined) {
            lines.push(`${indent(level + 1)}steps = ${steps},`);
        }
        if (disabled) {
            lines.push(`${indent(level + 1)}enabled = false,`);
        }
        lines.push(`${indent(level + 1)}modifier = ${modifier}`);
        lines.push(`${indent(level)})`);
        return lines;
    }

    if (node.component === 'Picker') {
        const binding = getNativeBindingReference(node);
        const pickerId = context.pickerIndex++;
        const pickerOptions = resolveNativePickerOptions(node);
        const initialSelection = resolveNativePickerInitialSelection(node, pickerOptions);
        const initialSelections = resolveNativePickerInitialSelections(node, pickerOptions);
        const expandedName = `pickerExpanded${pickerId}`;
        const disabled = isNativeDisabled(node);
        const isMultiple = isNativeMultiple(node);

        if (isMultiple) {
            const optionValues = pickerOptions.map((option) => option.value);
            let selectionName = `pickerValues${pickerId}`;
            let usesBoundArrayState = false;

            if (binding?.kind === 'value') {
                const { descriptor, variableName } = ensureComposeStateVariable(context, binding.id);
                if (descriptor.type === 'string-array') {
                    selectionName = variableName;
                    usesBoundArrayState = true;
                }
            }

            if (!usesBoundArrayState) {
                const initialSet = initialSelections.length > 0
                    ? `setOf(${initialSelections.map((value) => quoteKotlinString(value)).join(', ')})`
                    : 'emptySet<String>()';

                context.stateDeclarations.push(`${indent(1)}var ${selectionName} by remember { mutableStateOf(${initialSet}) }`);
            }

            lines.push(`${indent(level)}Column(modifier = ${modifier}) {`);
            pickerOptions.forEach((option) => {
                const optionDisabled = disabled || option.disabled;
                const selectionUpdate = optionDisabled
                    ? undefined
                    : usesBoundArrayState
                        ? buildComposeStateStringArrayToggleAssignment(selectionName, option.value, optionValues)
                        : `${selectionName} = if (checked) ${selectionName} + ${quoteKotlinString(option.value)} else ${selectionName} - ${quoteKotlinString(option.value)}`;
                const pickerValuesExpression = usesBoundArrayState ? selectionName : `${selectionName}.toList().sorted()`;
                const pickerEventStatements = optionDisabled
                    ? []
                    : buildComposeControlEventDispatchStatements(node, { valuesExpression: pickerValuesExpression });

                if (pickerEventStatements.length > 0) {
                    context.helperFlags.add('bridge');
                }

                lines.push(`${indent(level + 1)}Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {`);
                lines.push(`${indent(level + 2)}Checkbox(`);
                lines.push(`${indent(level + 3)}checked = ${selectionName}.contains(${quoteKotlinString(option.value)}),`);
                lines.push(`${indent(level + 3)}onCheckedChange = ${selectionUpdate ? `{ checked -> ${selectionUpdate}${pickerEventStatements.length > 0 ? `; ${pickerEventStatements.join('; ')}` : ''} }` : 'null'},`);
                if (optionDisabled) {
                    lines.push(`${indent(level + 3)}enabled = false,`);
                }
                lines.push(`${indent(level + 2)})`);
                lines.push(`${indent(level + 2)}Text(text = ${quoteKotlinString(option.label)})`);
                lines.push(`${indent(level + 1)}}`);
            });
            lines.push(`${indent(level)}}`);
            return lines;
        }

        let selectionExpression = `pickerValue${pickerId}`;
        let optionAssignments = pickerOptions.map((option) => `${selectionExpression} = ${quoteKotlinString(option.value)}`);
        let labelExpression = quoteKotlinString(resolveNativePickerDisplayLabel(initialSelection || 'Select', pickerOptions));

        if (binding?.kind === 'value') {
            const { descriptor, variableName } = ensureComposeStateVariable(context, binding.id);
            selectionExpression = toComposeTextValueExpression(variableName, descriptor);
            optionAssignments = pickerOptions.map((option) => buildComposeStateStringAssignment(variableName, descriptor, option.value));
            labelExpression = buildComposePickerLabelExpression(selectionExpression, pickerOptions, initialSelection === '' ? 'Select' : undefined);
        } else {
            context.stateDeclarations.push(`${indent(1)}var ${selectionExpression} by remember { mutableStateOf(${quoteKotlinString(initialSelection)}) }`);
        }

        context.stateDeclarations.push(`${indent(1)}var ${expandedName} by remember { mutableStateOf(false) }`);
        const pickerEventStatements = disabled
            ? []
            : buildComposeControlEventDispatchStatements(node, { valueExpression: selectionExpression });
        if (pickerEventStatements.length > 0) {
            context.helperFlags.add('bridge');
        }

        lines.push(`${indent(level)}Box(modifier = ${buildComposeButtonModifier(modifier, `${expandedName} = true`, !disabled)}) {`);
        lines.push(`${indent(level + 1)}${buildComposeLabelText(node, resolveNativePickerDisplayLabel(initialSelection || 'Select', pickerOptions), context.resolvedStyles, labelExpression, context.styleResolveOptions)}`);
        lines.push(`${indent(level + 1)}DropdownMenu(expanded = ${expandedName}, onDismissRequest = { ${expandedName} = false }) {`);

        pickerOptions.forEach((option, index) => {
            lines.push(`${indent(level + 2)}DropdownMenuItem(text = { Text(text = ${quoteKotlinString(option.label)}) }, onClick = { ${optionAssignments[index]}${pickerEventStatements.length > 0 ? `; ${pickerEventStatements.join('; ')}` : ''}; ${expandedName} = false })`);
        });

        lines.push(`${indent(level + 1)}}`);
        lines.push(`${indent(level)}}`);
        return lines;
    }

    if (node.component === 'Option') {
        const label = resolveNativePickerOptionLabel(node);
        return [...lines, `${indent(level)}${buildComposeLabelText(node, label, context.resolvedStyles, buildComposeTextExpression(node.children, context), context.styleResolveOptions)}`];
    }

    if (node.component === 'Divider') {
        return [...lines, `${indent(level)}HorizontalDivider(modifier = ${modifier})`];
    }

    if (node.component === 'Progress') {
        const progress = resolveNativeProgressFraction(node.props);
        return [...lines, progress !== undefined
            ? `${indent(level)}LinearProgressIndicator(progress = ${formatFloat(progress)}f, modifier = ${modifier})`
            : `${indent(level)}LinearProgressIndicator(modifier = ${modifier})`];
    }

    if (node.component === 'Button') {
        const label = flattenTextContent(node.children) || 'Button';
        const disabled = isNativeDisabled(node);
        const onClickExpression = disabled
            ? undefined
            : buildComposeBridgeInvocation(
                resolveNativeAction(node),
                resolveNativeRoute(node),
                serializeNativePayload(node.props.nativePayload),
            );
        const activeStyle = !disabled
            ? resolveNativePseudoStateVariantStyle(node, context.styleContexts, context.styleResolveOptions, ['active'])
            : undefined;
        const activeResolvedStyles = activeStyle ? createSingleNodeResolvedStyleMap(node, activeStyle) : undefined;
        const baseLabel = buildComposeLabelText(node, label, context.resolvedStyles, buildComposeTextExpression(node.children, context), context.styleResolveOptions);
        const activeLabel = activeResolvedStyles
            ? buildComposeLabelText(node, label, activeResolvedStyles, buildComposeTextExpression(node.children, context), context.styleResolveOptions)
            : baseLabel;
        const activeModifier = activeResolvedStyles
            ? buildComposeModifier(node, activeResolvedStyles, hints, context.styleResolveOptions)
            : modifier;
        const shouldUseRuntimeActiveVariant = !disabled && (activeModifier !== modifier || activeLabel !== baseLabel);
        const clickBody = onClickExpression
            ?? (node.events.length > 0
                ? `/* TODO: wire elit event(s): ${node.events.join(', ')} */`
                : shouldUseRuntimeActiveVariant
                    ? '/* active-state preview no-op */'
                    : undefined);
        const buttonModifier = buildComposeButtonModifier(modifier, clickBody, !disabled);

        if (onClickExpression) {
            context.helperFlags.add('bridge');
        } else if (!disabled) {
            if (node.events.length > 0) {
                lines.push(`${indent(level)}// TODO: wire elit event(s): ${node.events.join(', ')}`);
            }
        }

        if (shouldUseRuntimeActiveVariant && clickBody) {
            context.helperFlags.add('interactivePressState');
            const interactionId = context.interactionIndex++;
            const interactionSourceName = `interactionSource${interactionId}`;
            const pressedName = `pressedState${interactionId}`;
            const pressedModifier = buildComposeButtonModifier(activeModifier, clickBody, !disabled, interactionSourceName);
            const idleModifier = buildComposeButtonModifier(modifier, clickBody, !disabled, interactionSourceName);

            lines.push(`${indent(level)}val ${interactionSourceName} = remember { MutableInteractionSource() }`);
            lines.push(`${indent(level)}val ${pressedName} by ${interactionSourceName}.collectIsPressedAsState()`);
            lines.push(`${indent(level)}Box(modifier = if (${pressedName}) ${pressedModifier} else ${idleModifier}, contentAlignment = Alignment.Center) {`);
            if (activeLabel !== baseLabel) {
                lines.push(`${indent(level + 1)}if (${pressedName}) {`);
                lines.push(`${indent(level + 2)}${activeLabel}`);
                lines.push(`${indent(level + 1)}} else {`);
                lines.push(`${indent(level + 2)}${baseLabel}`);
                lines.push(`${indent(level + 1)}}`);
            } else {
                lines.push(`${indent(level + 1)}${baseLabel}`);
            }
            lines.push(`${indent(level)}}`);
        } else {
            lines.push(`${indent(level)}Box(modifier = ${buttonModifier}, contentAlignment = Alignment.Center) {`);
            lines.push(`${indent(level + 1)}${baseLabel}`);
            lines.push(`${indent(level)}}`);
        }
        return lines;
    }

    if (node.component === 'Link') {
        const label = flattenTextContent(node.children) || String(node.props.destination ?? 'Link');
        const destination = typeof node.props.destination === 'string' ? node.props.destination : undefined;
        const suggestedName = resolveNativeDownloadSuggestedName(node);
        let onClickExpression: string | undefined;
        if (destination && shouldNativeDownloadLink(node)) {
            context.helperFlags.add('downloadHandler');
            onClickExpression = `ElitDownloadHandler.download(localContext, ${quoteKotlinString(destination)}, ${suggestedName ? quoteKotlinString(suggestedName) : 'null'})`;
        } else if (destination && isExternalDestination(destination)) {
            context.helperFlags.add('uriHandler');
            onClickExpression = `uriHandler.openUri(${quoteKotlinString(destination)})`;
        } else {
            onClickExpression = buildComposeBridgeInvocation(
                resolveNativeAction(node),
                resolveNativeRoute(node),
                serializeNativePayload(node.props.nativePayload),
            );

            if (onClickExpression) {
                context.helperFlags.add('bridge');
            } else {
                if (destination) {
                    lines.push(`${indent(level)}// TODO: navigate to ${escapeKotlinString(destination)}`);
                }
            }
        }
        const activeStyle = resolveNativePseudoStateVariantStyle(node, context.styleContexts, context.styleResolveOptions, ['active']);
        const activeResolvedStyles = activeStyle ? createSingleNodeResolvedStyleMap(node, activeStyle) : undefined;
        const baseLabel = buildComposeLabelText(node, label, context.resolvedStyles, buildComposeTextExpression(node.children, context), context.styleResolveOptions);
        const activeLabel = activeResolvedStyles
            ? buildComposeLabelText(node, label, activeResolvedStyles, buildComposeTextExpression(node.children, context), context.styleResolveOptions)
            : baseLabel;
        const activeModifier = activeResolvedStyles
            ? buildComposeModifier(node, activeResolvedStyles, hints, context.styleResolveOptions)
            : modifier;
        const shouldUseRuntimeActiveVariant = activeResolvedStyles !== undefined && (activeModifier !== modifier || activeLabel !== baseLabel);
        const clickBody = onClickExpression
            ?? (destination
                ? `/* TODO: navigate to ${escapeKotlinString(destination)} */`
                : shouldUseRuntimeActiveVariant
                    ? '/* active-state preview no-op */'
                    : undefined);

        if (shouldUseRuntimeActiveVariant && clickBody) {
            context.helperFlags.add('interactivePressState');
            const interactionId = context.interactionIndex++;
            const interactionSourceName = `interactionSource${interactionId}`;
            const pressedName = `pressedState${interactionId}`;
            const pressedModifier = buildComposeButtonModifier(activeModifier, clickBody, true, interactionSourceName);
            const idleModifier = buildComposeButtonModifier(modifier, clickBody, true, interactionSourceName);

            lines.push(`${indent(level)}val ${interactionSourceName} = remember { MutableInteractionSource() }`);
            lines.push(`${indent(level)}val ${pressedName} by ${interactionSourceName}.collectIsPressedAsState()`);
            lines.push(`${indent(level)}Box(modifier = if (${pressedName}) ${pressedModifier} else ${idleModifier}, contentAlignment = Alignment.Center) {`);
            if (activeLabel !== baseLabel) {
                lines.push(`${indent(level + 1)}if (${pressedName}) {`);
                lines.push(`${indent(level + 2)}${activeLabel}`);
                lines.push(`${indent(level + 1)}} else {`);
                lines.push(`${indent(level + 2)}${baseLabel}`);
                lines.push(`${indent(level + 1)}}`);
            } else {
                lines.push(`${indent(level + 1)}${baseLabel}`);
            }
            lines.push(`${indent(level)}}`);
        } else {
            lines.push(`${indent(level)}Box(modifier = ${buildComposeButtonModifier(modifier, clickBody)}, contentAlignment = Alignment.Center) {`);
            lines.push(`${indent(level + 1)}${baseLabel}`);
            lines.push(`${indent(level)}}`);
        }
        return lines;
    }

    if (node.component === 'Image') {
        context.helperFlags.add('imagePlaceholder');
        context.helperFlags.add('backgroundImage');
        const source = resolveNativeSurfaceSource(node) ?? '';
        const alt = typeof node.props.alt === 'string' ? node.props.alt : undefined;
        const fallbackLabel = resolveImageFallbackLabel(source, alt);
        const objectFit = resolveNativeImageFit(node, context.resolvedStyles, context.styleResolveOptions);
        const objectPosition = resolveNativeImagePosition(node, context.resolvedStyles, context.styleResolveOptions);
        lines.push(`${indent(level)}ElitImageSurface(`);
        lines.push(`${indent(level + 1)}source = ${quoteKotlinString(source)},`);
        lines.push(`${indent(level + 1)}label = ${quoteKotlinString(fallbackLabel)},`);
        lines.push(`${indent(level + 1)}contentDescription = ${alt ? quoteKotlinString(alt) : 'null'},`);
        if (objectFit !== 'cover') {
            lines.push(`${indent(level + 1)}objectFit = ${quoteKotlinString(objectFit)},`);
        }
        if (objectPosition !== 'center') {
            lines.push(`${indent(level + 1)}objectPosition = ${quoteKotlinString(objectPosition)},`);
        }
        lines.push(`${indent(level + 1)}modifier = ${modifier}`);
        lines.push(`${indent(level)})`);
        return lines;
    }

    if (node.component === 'Vector' && node.sourceTag === 'svg') {
        const vectorLines = buildComposeVectorCanvasLines(node, level, modifier, context.resolvedStyles, context.styleResolveOptions);
        if (vectorLines) {
            return [...lines, ...vectorLines];
        }
    }

    if (node.component === 'Canvas') {
        return [...lines, ...buildComposeCanvasSurfaceLines(node, level, modifier, context.resolvedStyles, context.styleResolveOptions)];
    }

    if (node.component === 'WebView') {
        const source = resolveNativeSurfaceSource(node);
        if (source) {
            context.helperFlags.add('webViewSurface');
            return [...lines, `${indent(level)}ElitWebViewSurface(source = ${quoteKotlinString(source)}, label = ${resolveNativeAccessibilityLabel(node) ? quoteKotlinString(resolveNativeAccessibilityLabel(node)!) : 'null'}, modifier = ${modifier})`];
        }
    }

    if (node.component === 'Media') {
        const source = resolveNativeSurfaceSource(node);
        if (source) {
            context.helperFlags.add('mediaSurface');
            const mediaLabel = resolveNativeMediaLabel(node);
            const muted = isNativeMuted(node) ? 'true' : 'false';
            if (node.sourceTag === 'video') {
                const controls = shouldNativeShowVideoControls(node) ? 'true' : 'false';
                const poster = resolveNativeVideoPoster(node);
                const playsInline = shouldNativePlayInline(node) ? 'true' : 'false';
                const posterFit = resolveNativeVideoPosterFit(node, context.resolvedStyles, context.styleResolveOptions);
                const posterPosition = resolveNativeVideoPosterPosition(node, context.resolvedStyles, context.styleResolveOptions);
                return [...lines, `${indent(level)}ElitVideoSurface(source = ${quoteKotlinString(source)}, label = ${quoteKotlinString(mediaLabel)}, autoPlay = ${toNativeBoolean(node.props.autoplay) ? 'true' : 'false'}, loop = ${toNativeBoolean(node.props.loop) ? 'true' : 'false'}, muted = ${muted}, controls = ${controls}, poster = ${poster ? quoteKotlinString(poster) : 'null'}, playsInline = ${playsInline}${posterFit !== 'cover' ? `, posterFit = ${quoteKotlinString(posterFit)}` : ''}${posterPosition !== 'center' ? `, posterPosition = ${quoteKotlinString(posterPosition)}` : ''}, modifier = ${modifier})`];
            }

            return [...lines, `${indent(level)}ElitAudioSurface(source = ${quoteKotlinString(source)}, label = ${quoteKotlinString(mediaLabel)}, autoPlay = ${toNativeBoolean(node.props.autoplay) ? 'true' : 'false'}, loop = ${toNativeBoolean(node.props.loop) ? 'true' : 'false'}, muted = ${muted}, modifier = ${modifier})`];
        }
    }

    if (node.component === 'Cell') {
        const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
        const cellModifier = hints.parentFlexLayout === 'Row' && !hasExplicitNativeWidthStyle(style)
            ? prependComposeModifierCall(modifier, 'weight(1f, fill = true)')
            : modifier;
        lines.push(`${indent(level)}Column(modifier = ${cellModifier}) {`);
        lines.push(...renderComposeChildren(node.children, level + 1, context, 'Column', node, hints));
        lines.push(`${indent(level)}}`);
        return lines;
    }

    if (node.component === 'Media' || node.component === 'WebView' || node.component === 'Canvas' || node.component === 'Vector' || node.component === 'Math') {
        context.helperFlags.add('unsupportedPlaceholder');
        lines.push(`${indent(level)}ElitUnsupported(`);
        lines.push(`${indent(level + 1)}label = ${quoteKotlinString(node.component)},`);
        lines.push(`${indent(level + 1)}sourceTag = ${quoteKotlinString(node.sourceTag)},`);
        lines.push(`${indent(level + 1)}modifier = ${modifier}`);
        lines.push(`${indent(level)})`);
        return lines;
    }

    if (node.component === 'Screen') {
        const { flowChildren, fixedChildren } = splitFixedPositionedChildren(node.children, context.resolvedStyles, context.styleResolveOptions);
        if (fixedChildren.length > 0) {
            const flowNode: NativeElementNode = flowChildren.length === node.children.length
                ? node
                : { ...node, children: flowChildren };
            lines.push(`${indent(level)}Box {`);
            lines.push(...renderComposeContainerBody(flowNode, level + 1, context, modifier, hints));
            lines.push(`${indent(level + 1)}Box(modifier = Modifier.matchParentSize()) {`);
            for (const child of fixedChildren) {
                lines.push(...renderComposeNode(child, level + 2, context, { availableWidth: hints.availableWidth, availableHeight: hints.availableHeight, absoluteOverlay: true }));
            }
            lines.push(`${indent(level + 1)}}`);
            lines.push(`${indent(level)}}`);
            return lines;
        }
    }

    const { flowChildren, absoluteChildren } = splitAbsolutePositionedChildren(node.children, context.resolvedStyles, context.styleResolveOptions);
    if (absoluteChildren.length > 0 && node.component !== 'Screen') {
        const flowNode: NativeElementNode = flowChildren.length === node.children.length
            ? node
            : { ...node, children: flowChildren };
        lines.push(`${indent(level)}Box {`);
        lines.push(...renderComposeContainerBody(flowNode, level + 1, context, modifier, hints));
        lines.push(`${indent(level + 1)}Box(modifier = Modifier.matchParentSize()) {`);
        for (const child of absoluteChildren) {
            lines.push(...renderComposeNode(child, level + 2, context, { availableWidth: hints.availableWidth, availableHeight: hints.availableHeight, absoluteOverlay: true }));
        }
        lines.push(`${indent(level + 1)}}`);
        lines.push(`${indent(level)}}`);
        return lines;
    }

    lines.push(...renderComposeContainerBody(node, level, context, modifier, hints));
    return lines;
}

function buildAndroidComposeHelpers(context: AndroidComposeContext): string[] {
    const helpers: string[] = [];

    if (context.helperFlags.has('bridge')) {
        helpers.push('');
        helpers.push('object ElitNativeBridge {');
        helpers.push('    var onAction: ((String, String?, String?) -> Unit)? = null');
        helpers.push('    var onNavigate: ((String) -> Unit)? = null');
        helpers.push('');
        helpers.push('    fun dispatch(action: String? = null, route: String? = null, payloadJson: String? = null) {');
        helpers.push('        if (route != null) {');
        helpers.push('            onNavigate?.invoke(route)');
        helpers.push('        }');
        helpers.push('        if (action != null) {');
        helpers.push('            onAction?.invoke(action, route, payloadJson)');
        helpers.push('        }');
        helpers.push('    }');
        helpers.push('');
        helpers.push('    fun controlEventPayload(event: String, sourceTag: String, inputType: String? = null, value: String? = null, values: Iterable<String>? = null, checked: Boolean? = null, detailJson: String? = null): String {');
        helpers.push('        val payload = org.json.JSONObject()');
        helpers.push('        payload.put("event", event)');
        helpers.push('        payload.put("sourceTag", sourceTag)');
        helpers.push('        if (inputType != null) payload.put("inputType", inputType)');
        helpers.push('        if (value != null) payload.put("value", value)');
        helpers.push('        if (values != null) payload.put("values", org.json.JSONArray(values.toList()))');
        helpers.push('        if (checked != null) payload.put("checked", checked)');
        helpers.push('        if (detailJson != null && detailJson.isNotBlank()) {');
        helpers.push('            try {');
        helpers.push('                payload.put("detail", org.json.JSONTokener(detailJson).nextValue())');
        helpers.push('            } catch (_: Exception) {');
        helpers.push('                payload.put("detail", detailJson)');
        helpers.push('            }');
        helpers.push('        }');
        helpers.push('        return payload.toString()');
        helpers.push('    }');
        helpers.push('}');
    }

    if (context.helperFlags.has('downloadHandler')) {
        helpers.push('');
        helpers.push('object ElitDownloadHandler {');
        helpers.push('    fun download(context: android.content.Context, source: String, suggestedName: String?) {');
        helpers.push('        val uri = android.net.Uri.parse(source)');
        helpers.push('        val fileName = suggestedName?.takeIf { it.isNotBlank() } ?: android.webkit.URLUtil.guessFileName(source, null, null)');
        helpers.push('        val request = android.app.DownloadManager.Request(uri).apply {');
        helpers.push('            setTitle(fileName)');
        helpers.push('            setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)');
        helpers.push('            setDestinationInExternalPublicDir(android.os.Environment.DIRECTORY_DOWNLOADS, fileName)');
        helpers.push('            setAllowedOverMetered(true)');
        helpers.push('            setAllowedOverRoaming(true)');
        helpers.push('        }');
        helpers.push('        val manager = context.getSystemService(android.content.Context.DOWNLOAD_SERVICE) as? android.app.DownloadManager');
        helpers.push('        if (manager != null) {');
        helpers.push('            manager.enqueue(request)');
        helpers.push('        } else {');
        helpers.push('            context.startActivity(');
        helpers.push('                android.content.Intent(android.content.Intent.ACTION_VIEW, uri)');
        helpers.push('                    .addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK),');
        helpers.push('            )');
        helpers.push('        }');
        helpers.push('    }');
        helpers.push('}');
    }

    if (context.helperFlags.has('imagePlaceholder')) {
        helpers.push('');
        helpers.push('@Composable');
        helpers.push('private fun ElitImagePlaceholder(label: String, source: String, contentDescription: String?, modifier: Modifier = Modifier) {');
        helpers.push('    Box(');
        helpers.push('        modifier = modifier');
        helpers.push('            .background(');
        helpers.push('                brush = Brush.linearGradient(colors = listOf(Color(red = 0.09f, green = 0.075f, blue = 0.071f, alpha = 1f), Color(red = 0.157f, green = 0.122f, blue = 0.102f, alpha = 1f))),');
        helpers.push('                shape = RoundedCornerShape(22.dp),');
        helpers.push('            )');
        helpers.push('            .border(1.dp, Color(red = 0.149f, green = 0.098f, blue = 0.078f, alpha = 0.12f), RoundedCornerShape(22.dp)),');
        helpers.push('        contentAlignment = Alignment.Center,');
        helpers.push('    ) {');
        helpers.push('        Text(');
        helpers.push('            text = label,');
        helpers.push('            color = Color(red = 0.945f, green = 0.761f, blue = 0.49f, alpha = 1f),');
        helpers.push('            fontSize = 26.sp,');
        helpers.push('            fontWeight = FontWeight.W700,');
        helpers.push('            textAlign = TextAlign.Center,');
        helpers.push('        )');
        helpers.push('    }');
        helpers.push('}');
        if (context.helperFlags.has('backgroundImage')) {
            helpers.push('');
            helpers.push('@Composable');
            helpers.push('private fun ElitImageSurface(source: String, label: String, contentDescription: String?, objectFit: String = "cover", objectPosition: String = "center", modifier: Modifier = Modifier) {');
            helpers.push('    Box(modifier = modifier) {');
            helpers.push('        ElitImagePlaceholder(label = label, source = source, contentDescription = contentDescription, modifier = Modifier.matchParentSize())');
            helpers.push('        androidx.compose.ui.viewinterop.AndroidView(');
            helpers.push('            factory = { context ->');
            helpers.push('                android.widget.ImageView(context).apply {');
            helpers.push('                    adjustViewBounds = true');
            helpers.push('                    this.contentDescription = contentDescription');
            helpers.push('                    scaleType = elitBackgroundImageScaleType(objectFit, objectPosition)');
            helpers.push('                    elitLoadBackgroundBitmap(this, source, "no-repeat", objectFit, objectPosition)');
            helpers.push('                }');
            helpers.push('            },');
            helpers.push('            update = { imageView ->');
            helpers.push('                imageView.contentDescription = contentDescription');
            helpers.push('                imageView.scaleType = elitBackgroundImageScaleType(objectFit, objectPosition)');
            helpers.push('                elitLoadBackgroundBitmap(imageView, source, "no-repeat", objectFit, objectPosition)');
            helpers.push('            },');
            helpers.push('            modifier = Modifier.matchParentSize(),');
            helpers.push('        )');
            helpers.push('    }');
            helpers.push('}');
        }
    }

    if (context.helperFlags.has('backgroundImage')) {
        helpers.push('');
        helpers.push('private fun elitBackgroundImageScaleType(backgroundSize: String, backgroundPosition: String): android.widget.ImageView.ScaleType = when (backgroundSize.trim().lowercase()) {');
        helpers.push('    "contain" -> when (backgroundPosition.trim().lowercase()) {');
        helpers.push('        "top", "leading", "top-leading", "bottom-leading" -> android.widget.ImageView.ScaleType.FIT_START');
        helpers.push('        "bottom", "trailing", "top-trailing", "bottom-trailing" -> android.widget.ImageView.ScaleType.FIT_END');
        helpers.push('        else -> android.widget.ImageView.ScaleType.FIT_CENTER');
        helpers.push('    }');
        helpers.push('    "fill" -> android.widget.ImageView.ScaleType.FIT_XY');
        helpers.push('    "none", "scale-down" -> when (backgroundPosition.trim().lowercase()) {');
        helpers.push('        "top", "leading", "top-leading", "bottom-leading" -> android.widget.ImageView.ScaleType.FIT_START');
        helpers.push('        "bottom", "trailing", "top-trailing", "bottom-trailing" -> android.widget.ImageView.ScaleType.FIT_END');
        helpers.push('        else -> android.widget.ImageView.ScaleType.CENTER_INSIDE');
        helpers.push('    }');
        helpers.push('    else -> android.widget.ImageView.ScaleType.CENTER_CROP');
        helpers.push('}');
        helpers.push('');
        helpers.push('private fun elitDecodeBackgroundBitmap(context: android.content.Context, source: String): android.graphics.Bitmap? {');
        helpers.push('    val normalizedSource = source.trim()');
        helpers.push('    if (normalizedSource.isEmpty()) return null');
        helpers.push('    return if (normalizedSource.startsWith("content:") || normalizedSource.startsWith("file:") || normalizedSource.startsWith("android.resource:")) {');
        helpers.push('        runCatching {');
        helpers.push('            context.contentResolver.openInputStream(android.net.Uri.parse(normalizedSource))?.use { input -> android.graphics.BitmapFactory.decodeStream(input) }');
        helpers.push('        }.getOrNull()');
        helpers.push('    } else {');
        helpers.push('        runCatching { android.graphics.BitmapFactory.decodeFile(normalizedSource) }.getOrNull()');
        helpers.push('    }');
        helpers.push('}');
        helpers.push('');
        helpers.push('private fun elitApplyBackgroundBitmap(imageView: android.widget.ImageView, bitmap: android.graphics.Bitmap?, backgroundRepeat: String, backgroundSize: String, backgroundPosition: String, expectedSource: String) {');
        helpers.push('    if (imageView.tag != expectedSource) return');
        helpers.push('    if (bitmap == null) {');
        helpers.push('        imageView.background = null');
        helpers.push('        imageView.setImageDrawable(null)');
        helpers.push('        return');
        helpers.push('    }');
        helpers.push('    val repeatMode = backgroundRepeat.trim().lowercase()');
        helpers.push('    if (repeatMode == "repeat" || repeatMode == "repeat-x" || repeatMode == "repeat-y") {');
        helpers.push('        imageView.background = android.graphics.drawable.BitmapDrawable(imageView.resources, bitmap).apply {');
        helpers.push('            setTileModeXY(');
        helpers.push('                if (repeatMode == "repeat-y") android.graphics.Shader.TileMode.CLAMP else android.graphics.Shader.TileMode.REPEAT,');
        helpers.push('                if (repeatMode == "repeat-x") android.graphics.Shader.TileMode.CLAMP else android.graphics.Shader.TileMode.REPEAT,');
        helpers.push('            )');
        helpers.push('        }');
        helpers.push('        imageView.setImageDrawable(null)');
        helpers.push('        imageView.scaleType = android.widget.ImageView.ScaleType.FIT_XY');
        helpers.push('    } else {');
        helpers.push('        imageView.background = null');
        helpers.push('        imageView.setImageBitmap(bitmap)');
        helpers.push('        imageView.scaleType = elitBackgroundImageScaleType(backgroundSize, backgroundPosition)');
        helpers.push('    }');
        helpers.push('}');
        helpers.push('');
        helpers.push('private fun elitLoadBackgroundBitmap(imageView: android.widget.ImageView, source: String, backgroundRepeat: String, backgroundSize: String, backgroundPosition: String) {');
        helpers.push('    val normalizedSource = source.trim()');
        helpers.push('    imageView.tag = normalizedSource');
        helpers.push('    if (normalizedSource.isEmpty()) {');
        helpers.push('        imageView.background = null');
        helpers.push('        imageView.setImageDrawable(null)');
        helpers.push('        return');
        helpers.push('    }');
        helpers.push('    if (normalizedSource.startsWith("http://") || normalizedSource.startsWith("https://")) {');
        helpers.push('        Thread {');
        helpers.push('            val bitmap = runCatching { java.net.URL(normalizedSource).openStream().use { input -> android.graphics.BitmapFactory.decodeStream(input) } }.getOrNull()');
        helpers.push('            imageView.post { elitApplyBackgroundBitmap(imageView, bitmap, backgroundRepeat, backgroundSize, backgroundPosition, normalizedSource) }');
        helpers.push('        }.start()');
        helpers.push('    } else {');
        helpers.push('        val bitmap = elitDecodeBackgroundBitmap(imageView.context, normalizedSource)');
        helpers.push('        elitApplyBackgroundBitmap(imageView, bitmap, backgroundRepeat, backgroundSize, backgroundPosition, normalizedSource)');
        helpers.push('    }');
        helpers.push('}');
        helpers.push('');
        helpers.push('@Composable');
        helpers.push('private fun ElitBackgroundImage(source: String, backgroundSize: String = "cover", backgroundPosition: String = "center", backgroundRepeat: String = "no-repeat", modifier: Modifier = Modifier) {');
        helpers.push('    androidx.compose.ui.viewinterop.AndroidView(');
        helpers.push('        factory = { context ->');
        helpers.push('            android.widget.ImageView(context).apply {');
        helpers.push('                adjustViewBounds = false');
        helpers.push('                scaleType = elitBackgroundImageScaleType(backgroundSize, backgroundPosition)');
        helpers.push('            }');
        helpers.push('        },');
        helpers.push('        modifier = modifier,');
        helpers.push('        update = { imageView ->');
        helpers.push('            imageView.scaleType = elitBackgroundImageScaleType(backgroundSize, backgroundPosition)');
        helpers.push('            elitLoadBackgroundBitmap(imageView, source, backgroundRepeat, backgroundSize, backgroundPosition)');
        helpers.push('        },');
        helpers.push('    )');
        helpers.push('}');
    }

    if (context.helperFlags.has('unsupportedPlaceholder')) {
        helpers.push('');
        helpers.push('@Composable');
        helpers.push('private fun ElitUnsupported(label: String, sourceTag: String, modifier: Modifier = Modifier) {');
        helpers.push('    Text(text = "${label} placeholder for <${sourceTag}>", modifier = modifier)');
        helpers.push('}');
    }

    if (context.helperFlags.has('webViewSurface')) {
        helpers.push('');
        helpers.push('@Composable');
        helpers.push('private fun ElitWebViewSurface(source: String, label: String?, modifier: Modifier = Modifier) {');
        helpers.push('    androidx.compose.ui.viewinterop.AndroidView(');
        helpers.push('        factory = { context ->');
        helpers.push('            android.webkit.WebView(context).apply {');
        helpers.push('                contentDescription = label');
        helpers.push('                webViewClient = android.webkit.WebViewClient()');
        helpers.push('                settings.javaScriptEnabled = true');
        helpers.push('                if (source.contains("://") || source.startsWith("file:")) {');
        helpers.push('                    loadUrl(source)');
        helpers.push('                } else {');
        helpers.push('                    loadDataWithBaseURL(null, source, "text/html", "utf-8", null)');
        helpers.push('                }');
        helpers.push('            }');
        helpers.push('        },');
        helpers.push('        modifier = modifier,');
        helpers.push('        update = { webView ->');
        helpers.push('            webView.contentDescription = label');
        helpers.push('            if (source.contains("://") || source.startsWith("file:")) {');
        helpers.push('                webView.loadUrl(source)');
        helpers.push('            } else {');
        helpers.push('                webView.loadDataWithBaseURL(null, source, "text/html", "utf-8", null)');
        helpers.push('            }');
        helpers.push('        },');
        helpers.push('    )');
        helpers.push('}');
    }

    if (context.helperFlags.has('mediaSurface')) {
        helpers.push('');
        helpers.push('private fun elitVideoPosterScaleType(posterFit: String, posterPosition: String): android.widget.ImageView.ScaleType = when (posterFit.trim().lowercase()) {');
        helpers.push('    "contain" -> when (posterPosition.trim().lowercase()) {');
        helpers.push('        "top", "leading", "top-leading", "bottom-leading" -> android.widget.ImageView.ScaleType.FIT_START');
        helpers.push('        "bottom", "trailing", "top-trailing", "bottom-trailing" -> android.widget.ImageView.ScaleType.FIT_END');
        helpers.push('        else -> android.widget.ImageView.ScaleType.FIT_CENTER');
        helpers.push('    }');
        helpers.push('    "fill" -> android.widget.ImageView.ScaleType.FIT_XY');
        helpers.push('    "none", "scale-down" -> when (posterPosition.trim().lowercase()) {');
        helpers.push('        "top", "leading", "top-leading", "bottom-leading" -> android.widget.ImageView.ScaleType.FIT_START');
        helpers.push('        "bottom", "trailing", "top-trailing", "bottom-trailing" -> android.widget.ImageView.ScaleType.FIT_END');
        helpers.push('        else -> android.widget.ImageView.ScaleType.CENTER_INSIDE');
        helpers.push('    }');
        helpers.push('    else -> android.widget.ImageView.ScaleType.CENTER_CROP');
        helpers.push('}');
        helpers.push('');
        helpers.push('@Composable');
        helpers.push('private fun ElitVideoSurface(source: String, label: String, autoPlay: Boolean, loop: Boolean, muted: Boolean, controls: Boolean, poster: String?, playsInline: Boolean, posterFit: String = "cover", posterPosition: String = "center", modifier: Modifier = Modifier) {');
        helpers.push('    androidx.compose.ui.viewinterop.AndroidView(');
        helpers.push('        factory = { context ->');
        helpers.push('            android.widget.FrameLayout(context).apply {');
        helpers.push('                // Android VideoView already renders inline; playsInline is retained for parity with iOS generation.');
        helpers.push('                val layoutParams = android.widget.FrameLayout.LayoutParams(');
        helpers.push('                    android.view.ViewGroup.LayoutParams.MATCH_PARENT,');
        helpers.push('                    android.view.ViewGroup.LayoutParams.MATCH_PARENT,');
        helpers.push('                )');
        helpers.push('                val videoView = android.widget.VideoView(context).apply {');
        helpers.push('                    contentDescription = label');
        helpers.push('                    setVideoPath(source)');
        helpers.push('                }');
        helpers.push('                addView(videoView, layoutParams)');
        helpers.push('                val posterView = if (!poster.isNullOrBlank()) {');
        helpers.push('                    android.widget.ImageView(context).apply {');
        helpers.push('                        scaleType = elitVideoPosterScaleType(posterFit, posterPosition)');
        helpers.push('                        setImageURI(android.net.Uri.parse(poster))');
        helpers.push('                        contentDescription = label');
        helpers.push('                    }.also { addView(it, layoutParams) }');
        helpers.push('                } else {');
        helpers.push('                    null');
        helpers.push('                }');
        helpers.push('                if (controls) {');
        helpers.push('                    videoView.setMediaController(android.widget.MediaController(context))');
        helpers.push('                } else if (!autoPlay) {');
        helpers.push('                    setOnClickListener {');
        helpers.push('                        posterView?.visibility = android.view.View.GONE');
        helpers.push('                        if (!videoView.isPlaying) {');
        helpers.push('                            videoView.start()');
        helpers.push('                        }');
        helpers.push('                    }');
        helpers.push('                }');
        helpers.push('                videoView.setOnPreparedListener { mediaPlayer ->');
        helpers.push('                    mediaPlayer.isLooping = loop');
        helpers.push('                    mediaPlayer.setVolume(if (muted) 0f else 1f, if (muted) 0f else 1f)');
        helpers.push('                    mediaPlayer.setOnInfoListener { _, what, _ ->');
        helpers.push('                        if (what == android.media.MediaPlayer.MEDIA_INFO_VIDEO_RENDERING_START) {');
        helpers.push('                            posterView?.visibility = android.view.View.GONE');
        helpers.push('                        }');
        helpers.push('                        false');
        helpers.push('                    }');
        helpers.push('                    if (autoPlay) {');
        helpers.push('                        posterView?.visibility = android.view.View.GONE');
        helpers.push('                        videoView.start()');
        helpers.push('                    }');
        helpers.push('                }');
        helpers.push('            }');
        helpers.push('        },');
        helpers.push('        modifier = modifier,');
        helpers.push('        update = { container ->');
        helpers.push('            val videoView = container.getChildAt(0) as? android.widget.VideoView');
        helpers.push('            val posterView = container.getChildAt(1) as? android.widget.ImageView');
        helpers.push('            videoView?.contentDescription = label');
        helpers.push('            if (controls) {');
        helpers.push('                videoView?.setMediaController(android.widget.MediaController(container.context))');
        helpers.push('            } else {');
        helpers.push('                videoView?.setMediaController(null)');
        helpers.push('            }');
        helpers.push('            if (posterView != null) {');
        helpers.push('                posterView.contentDescription = label');
        helpers.push('                posterView.scaleType = elitVideoPosterScaleType(posterFit, posterPosition)');
        helpers.push('                if (!poster.isNullOrBlank()) {');
        helpers.push('                    posterView.setImageURI(android.net.Uri.parse(poster))');
        helpers.push('                    posterView.visibility = if (autoPlay) android.view.View.GONE else android.view.View.VISIBLE');
        helpers.push('                } else {');
        helpers.push('                    posterView.setImageDrawable(null)');
        helpers.push('                    posterView.visibility = android.view.View.GONE');
        helpers.push('                }');
        helpers.push('            }');
        helpers.push('        },');
        helpers.push('    )');
        helpers.push('}');
        helpers.push('');
        helpers.push('@Composable');
        helpers.push('private fun ElitAudioSurface(source: String, label: String, autoPlay: Boolean, loop: Boolean, muted: Boolean, modifier: Modifier = Modifier) {');
        helpers.push('    var isReady by remember(source) { mutableStateOf(false) }');
        helpers.push('    var isPlaying by remember(source) { mutableStateOf(false) }');
        helpers.push('    val mediaPlayer = remember(source, autoPlay, loop, muted) {');
        helpers.push('        android.media.MediaPlayer().apply {');
        helpers.push('            setDataSource(source)');
        helpers.push('            isLooping = loop');
        helpers.push('            setVolume(if (muted) 0f else 1f, if (muted) 0f else 1f)');
        helpers.push('            setOnPreparedListener { player ->');
        helpers.push('                isReady = true');
        helpers.push('                if (autoPlay) {');
        helpers.push('                    player.start()');
        helpers.push('                    isPlaying = true');
        helpers.push('                }');
        helpers.push('            }');
        helpers.push('            setOnCompletionListener { isPlaying = false }');
        helpers.push('            prepareAsync()');
        helpers.push('        }');
        helpers.push('    }');
        helpers.push('    DisposableEffect(mediaPlayer) {');
        helpers.push('        onDispose {');
        helpers.push('            mediaPlayer.release()');
        helpers.push('        }');
        helpers.push('    }');
        helpers.push('    Button(onClick = {');
        helpers.push('        if (isReady) {');
        helpers.push('            if (mediaPlayer.isPlaying) {');
        helpers.push('                mediaPlayer.pause()');
        helpers.push('                isPlaying = false');
        helpers.push('            } else {');
        helpers.push('                mediaPlayer.start()');
        helpers.push('                isPlaying = true');
        helpers.push('            }');
        helpers.push('        }');
        helpers.push('    }, modifier = modifier) {');
        helpers.push('        Text(text = if (!isReady) "Loading $label" else if (isPlaying) "Pause $label" else "Play $label")');
        helpers.push('    }');
        helpers.push('}');
    }

    return helpers;
}

function buildSwiftUIModifiers(
    node: NativeElementNode,
    resolvedStyles?: NativeResolvedStyleMap,
    hints: NativeRenderHints = {},
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
    styleOverride?: Record<string, NativePropValue>,
): string[] {
    const modifiers: string[] = [];

    if (node.component === 'Screen') {
        modifiers.push('.frame(maxWidth: .infinity, alignment: .topLeading)');
    }

    const style = styleOverride ?? getStyleObject(node, resolvedStyles, styleResolveOptions);
    if (style) {
        const padding = toPointLiteral(style.padding, styleResolveOptions);
        const paddingHorizontal = toPointLiteral(style.paddingHorizontal, styleResolveOptions);
        const paddingVertical = toPointLiteral(style.paddingVertical, styleResolveOptions);
        const parentFlexLayout = hints.parentFlexLayout;
        const flexStyle = resolveFlexStyleValues(style);
        const flexBasisValue = parentFlexLayout === 'Row'
            ? resolveAxisUnitNumber(flexStyle.basis, 'horizontal', hints, styleResolveOptions)
            : parentFlexLayout === 'Column'
                ? resolveAxisUnitNumber(flexStyle.basis, 'vertical', hints, styleResolveOptions)
                : undefined;
        const flexBasis = flexBasisValue !== undefined ? formatFloat(flexBasisValue) : undefined;
        const hasFlexBasisSizeHint = flexBasisValue !== undefined && Math.abs(flexBasisValue) > 0.0001;
        const flexShrink = flexStyle.shrink;
        const shrinkableMainAxisBasis = hasFlexBasisSizeHint && flexShrink !== 0;
        const suppressExactWidth = parentFlexLayout === 'Row' && hints.negotiatedMaxWidth !== undefined && flexShrink !== 0;
        const suppressExactHeight = parentFlexLayout === 'Column' && hints.negotiatedMaxHeight !== undefined && flexShrink !== 0;
        const width = (!suppressExactWidth ? toAxisPointLiteral(style.width, 'horizontal', hints, styleResolveOptions) : undefined)
            ?? (parentFlexLayout === 'Row' && hasFlexBasisSizeHint && !shrinkableMainAxisBasis ? flexBasis : undefined);
        const height = (!suppressExactHeight ? toAxisPointLiteral(style.height, 'vertical', hints, styleResolveOptions) : undefined)
            ?? (parentFlexLayout === 'Column' && hasFlexBasisSizeHint && !shrinkableMainAxisBasis ? flexBasis : undefined);
        const minWidth = toAxisPointLiteral(style.minWidth, 'horizontal', hints, styleResolveOptions)
            ?? (parentFlexLayout === 'Row' && hasFlexBasisSizeHint && flexShrink === 0 ? flexBasis : undefined);
        const negotiatedMaxWidth = hints.negotiatedMaxWidth !== undefined
            ? formatFloat(hints.negotiatedMaxWidth)
            : undefined;
        const maxWidth = negotiatedMaxWidth
            ?? toAxisPointLiteral(style.maxWidth, 'horizontal', hints, styleResolveOptions)
            ?? (parentFlexLayout === 'Row' && shrinkableMainAxisBasis ? flexBasis : undefined);
        const minHeight = toAxisPointLiteral(style.minHeight, 'vertical', hints, styleResolveOptions)
            ?? (parentFlexLayout === 'Column' && hasFlexBasisSizeHint && flexShrink === 0 ? flexBasis : undefined);
        const negotiatedMaxHeight = hints.negotiatedMaxHeight !== undefined
            ? formatFloat(hints.negotiatedMaxHeight)
            : undefined;
        const maxHeight = negotiatedMaxHeight
            ?? toAxisPointLiteral(style.maxHeight, 'vertical', hints, styleResolveOptions)
            ?? (parentFlexLayout === 'Column' && shrinkableMainAxisBasis ? flexBasis : undefined);
        const radius = toPointLiteral(style.borderRadius, styleResolveOptions);
        const backgroundGradient = resolveBackgroundGradient(style);
        const backdropBlur = resolveBackdropBlurRadius(style, styleResolveOptions);
        const backgroundColor = resolveBackgroundColor(style, styleResolveOptions);
        const border = resolveNativeBorder(style, (value) => toPointLiteral(value, styleResolveOptions));
        const shadows = parseBoxShadowList(style.boxShadow, resolveStyleCurrentColor(style));
        const aspectRatio = resolveAspectRatioValue(style.aspectRatio);
        const opacity = resolveOpacityValue(style.opacity);
        const zIndex = parsePlainNumericValue(style.zIndex);
        const shouldClipOverflow = shouldClipNativeOverflow(style);
        const transform = parseNativeTransform(style.transform, styleResolveOptions);
        const positionMode = resolvePositionMode(style.position);
        const positionInsets = resolvePositionInsets(style, hints, styleResolveOptions);
        const selfAlignment = resolveSwiftSelfAlignmentModifier(hints.parentFlexLayout, style);
        const selfAlignmentFillsWidth = selfAlignment?.startsWith('.frame(maxWidth: .infinity') ?? false;
        const selfAlignmentFillsHeight = selfAlignment?.startsWith('.frame(maxHeight: .infinity') ?? false;
        const color = parseCssColor(style.color);
        const fontSize = toPointLiteral(style.fontSize, styleResolveOptions);
        const fontWeight = resolveSwiftFontWeight(style.fontWeight);
        const fontDesign = resolveSwiftFontDesign(style.fontFamily);
        const letterSpacing = toPointLiteral(style.letterSpacing, styleResolveOptions);
        const lineSpacing = resolveSwiftLineSpacing(style.lineHeight, style.fontSize, styleResolveOptions);
        const textAlign = resolveSwiftTextAlign(style.textAlign);
        const textDecoration = resolveSwiftTextDecoration(style.textDecoration);
        const marginModifiers = buildSwiftMarginPaddingModifiers(style, styleResolveOptions);
        const autoMarginModifiers = buildSwiftAutoMarginModifiers(style);
        const hasAutoMarginMaxWidth = autoMarginModifiers.some((modifier) => modifier.startsWith('.frame(maxWidth: .infinity'));
        const flexValue = flexStyle.grow;

        if (padding) {
            modifiers.push(`.padding(${padding})`);
        } else {
            const spacing = resolveDirectionalSpacing(style, 'padding', (value) => toPointLiteral(value, styleResolveOptions));
            const top = spacing.top;
            const right = spacing.right;
            const bottom = spacing.bottom;
            const left = spacing.left;

            if (paddingHorizontal) modifiers.push(`.padding(.horizontal, ${paddingHorizontal})`);
            if (paddingVertical) modifiers.push(`.padding(.vertical, ${paddingVertical})`);
            if (top) modifiers.push(`.padding(.top, ${top})`);
            if (right) modifiers.push(`.padding(.trailing, ${right})`);
            if (bottom) modifiers.push(`.padding(.bottom, ${bottom})`);
            if (left) modifiers.push(`.padding(.leading, ${left})`);
        }

        const frameArgs: string[] = [];
        if (isFillValue(style.width) && !suppressExactWidth) {
            if (!hasAutoMarginMaxWidth) {
                frameArgs.push('maxWidth: .infinity');
            }
        } else if (width) {
            frameArgs.push(`width: ${width}`);
        } else if (hints.fillWidth && !hasAutoMarginMaxWidth && !selfAlignmentFillsWidth) {
            frameArgs.push('maxWidth: .infinity');
        }
        if (isFillValue(style.height) && !suppressExactHeight) {
            frameArgs.push('maxHeight: .infinity');
        } else if (height) {
            frameArgs.push(`height: ${height}`);
        } else if (hints.fillHeight && !selfAlignmentFillsHeight) {
            frameArgs.push('maxHeight: .infinity');
        }
        if (minWidth) frameArgs.push(`minWidth: ${minWidth}`);
        if (maxWidth) frameArgs.push(`maxWidth: ${maxWidth}`);
        if (minHeight) frameArgs.push(`minHeight: ${minHeight}`);
        if (maxHeight) frameArgs.push(`maxHeight: ${maxHeight}`);
        if (frameArgs.length > 0) {
            modifiers.push(`.frame(${frameArgs.join(', ')})`);
        }

        if (aspectRatio !== undefined) {
            modifiers.push(`.aspectRatio(${formatFloat(aspectRatio)}, contentMode: .fit)`);
        }

        if (backdropBlur !== undefined) {
            const backdropShape = radius ? `RoundedRectangle(cornerRadius: ${radius})` : 'Rectangle()';
            modifiers.push(`.background(.ultraThinMaterial, in: ${backdropShape})`);
        }

        if (backgroundGradient) {
            modifiers.push(`.background(${toSwiftGradientLiteral(backgroundGradient)})`);
        } else if (backgroundColor) {
            modifiers.push(`.background(${toSwiftColorLiteral(backgroundColor)})`);
        }

        if (radius) {
            modifiers.push(`.clipShape(RoundedRectangle(cornerRadius: ${radius}))`);
        }

        if (shouldClipOverflow && !radius) {
            modifiers.push('.clipped()');
        }

        if (border?.width && border.color) {
            const styledBorderModifier = buildSwiftUniformStyledBorderModifier(border, radius);
            if (styledBorderModifier) {
                modifiers.push(styledBorderModifier);
            } else {
                const radiusValue = radius ?? '0';
                modifiers.push(`.overlay(RoundedRectangle(cornerRadius: ${radiusValue}).stroke(${toSwiftColorLiteral(border.color)}, lineWidth: ${border.width}))`);
            }
        } else {
            const sideBorderOverlay = buildSwiftSideBorderOverlay(border ?? {}, radius);
            if (sideBorderOverlay) {
                modifiers.push(sideBorderOverlay);
            }
        }

        if (shadows.length > 0) {
            for (const entry of shadows) {
                modifiers.push(`.shadow(color: ${toSwiftColorLiteral(entry.color)}, radius: ${toSwiftShadowRadius(entry)}, x: ${formatFloat(entry.offsetX)}, y: ${formatFloat(entry.offsetY)})`);
            }
        }

        const positionUsesEndX = positionInsets.left === undefined && positionInsets.right !== undefined;
        const positionUsesEndY = positionInsets.top === undefined && positionInsets.bottom !== undefined;
        const combinedOffsetX = (positionInsets.left ?? (positionInsets.right !== undefined ? -positionInsets.right : 0)) + (transform?.translateX ?? 0);
        const combinedOffsetY = (positionInsets.top ?? (positionInsets.bottom !== undefined ? -positionInsets.bottom : 0)) + (transform?.translateY ?? 0);
        if ((positionMode === 'absolute' || positionMode === 'fixed') && hints.absoluteOverlay) {
            modifiers.push(`.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: ${positionUsesEndY ? '.bottom' : '.top'}${positionUsesEndX ? 'Trailing' : 'Leading'})`);
        }
        if (combinedOffsetX !== 0 || combinedOffsetY !== 0) {
            modifiers.push(`.offset(x: ${formatFloat(combinedOffsetX)}, y: ${formatFloat(combinedOffsetY)})`);
        }
        if (transform?.scaleX !== undefined || transform?.scaleY !== undefined) {
            modifiers.push(`.scaleEffect(x: ${formatFloat(transform.scaleX ?? 1)}, y: ${formatFloat(transform.scaleY ?? 1)}, anchor: .center)`);
        }
        if (transform?.rotationDegrees !== undefined) {
            modifiers.push(`.rotationEffect(.degrees(${formatFloat(transform.rotationDegrees)}))`);
        }

        if (selfAlignment) {
            modifiers.push(selfAlignment);
        }

        if (opacity !== undefined && opacity < 1) modifiers.push(`.opacity(${formatFloat(opacity)})`);
        if (zIndex !== undefined && zIndex !== 0) modifiers.push(`.zIndex(${formatFloat(zIndex)})`);

        if (color) modifiers.push(`.foregroundStyle(${toSwiftColorLiteral(color)})`);
        if (fontSize || fontWeight || fontDesign) {
            const args = [`size: ${fontSize ?? '17'}`];
            if (fontWeight) args.push(`weight: ${fontWeight}`);
            if (fontDesign) args.push(`design: ${fontDesign}`);
            modifiers.push(`.font(.system(${args.join(', ')}))`);
        }
        if (letterSpacing) modifiers.push(`.kerning(${letterSpacing})`);
        if (lineSpacing) modifiers.push(`.lineSpacing(${lineSpacing})`);
        if (textAlign) modifiers.push(`.multilineTextAlignment(${textAlign})`);
        if (textDecoration?.underline) modifiers.push('.underline()');
        if (textDecoration?.strikethrough) modifiers.push('.strikethrough()');
        if (flexValue !== undefined && Number.isFinite(flexValue) && flexValue > 0) {
            modifiers.push('.frame(maxWidth: .infinity, alignment: .leading)');
            modifiers.push(`.layoutPriority(${formatFloat(flexValue)})`);
        }

        modifiers.push(...marginModifiers);
        modifiers.push(...autoMarginModifiers);
    }

    if (!style && hints.fillWidth) {
        modifiers.push('.frame(maxWidth: .infinity, alignment: .leading)');
    }

    modifiers.push(...buildSwiftAccessibilityModifiers(node));

    return modifiers;
}

function buildSwiftUIButtonModifiers(
    node: NativeElementNode,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string[] {
    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
    const modifiers = buildSwiftUIModifiers(node, resolvedStyles, {}, styleResolveOptions);
    const interactiveModifiers = [
        ...(node.sourceTag === 'button' && isNativeDisabled(node) ? ['.disabled(true)'] : []),
        ...modifiers,
    ];
    return style ? ['.buttonStyle(.plain)', ...interactiveModifiers] : interactiveModifiers;
}

function resolveSwiftRowAlignment(
    style: Record<string, NativePropValue> | undefined,
    children: NativeNode[] = [],
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string {
    const baselineAlignment = resolveBaselineAlignmentKeyword(style?.alignItems);
    if (baselineAlignment === 'last') {
        return '.lastTextBaseline';
    }

    if (baselineAlignment === 'first') {
        return '.firstTextBaseline';
    }

    const selfBaselineAlignment = resolveRowBaselineSelfAlignment(children, resolvedStyles, styleResolveOptions);
    if (selfBaselineAlignment === 'last') {
        return '.lastTextBaseline';
    }

    if (selfBaselineAlignment === 'first') {
        return '.firstTextBaseline';
    }

    const align = typeof style?.alignItems === 'string' ? style.alignItems.trim().toLowerCase() : undefined;
    return align === 'center'
        ? '.center'
        : align === 'flex-end' || align === 'end' || align === 'bottom'
            ? '.bottom'
            : '.top';
}

function resolveSwiftColumnAlignment(style: Record<string, NativePropValue> | undefined): string {
    const align = typeof style?.alignItems === 'string' ? style.alignItems.trim().toLowerCase() : undefined;
    return align === 'center'
        ? '.center'
        : align === 'flex-end' || align === 'end' || align === 'right'
            ? '.trailing'
            : '.leading';
}

function resolveSwiftUILayout(node: NativeElementNode, resolvedStyles?: NativeResolvedStyleMap): 'HStack' | 'VStack' {
    const style = getStyleObject(node, resolvedStyles);
    const styleLayout = resolveLayoutDirection(style);
    if (styleLayout === 'Row') return 'HStack';
    return node.component === 'Row' || node.component === 'ListItem' ? 'HStack' : 'VStack';
}

function buildSwiftUILayout(
    node: NativeElementNode,
    layout: 'HStack' | 'VStack',
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string {
    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
    const spacing = toPointLiteral(style?.gap ?? (layout === 'HStack' ? style?.columnGap : style?.rowGap) ?? style?.gap, styleResolveOptions)
        ?? (hasNativeTableLayoutSourceTag(node.sourceTag) ? '0' : '12');

    if (layout === 'HStack') {
        return `HStack(alignment: ${resolveSwiftRowAlignment(style, node.children, resolvedStyles, styleResolveOptions)}, spacing: ${spacing})`;
    }

    return `VStack(alignment: ${resolveSwiftColumnAlignment(style)}, spacing: ${spacing})`;
}

function buildSwiftBackgroundImageInvocation(spec: NativeBackgroundImageSpec): string {
    return `elitBackgroundImageSurface(source: ${quoteSwiftString(spec.source)}${spec.fit !== 'cover' ? `, backgroundSize: ${quoteSwiftString(spec.fit)}` : ''}${spec.position !== 'center' ? `, backgroundPosition: ${quoteSwiftString(spec.position)}` : ''}${spec.repeat !== 'no-repeat' ? `, backgroundRepeat: ${quoteSwiftString(spec.repeat)}` : ''})`;
}

function buildSwiftBackgroundLayerInvocation(layer: NativeBackgroundLayerSpec): string {
    if (layer.kind === 'image') {
        return buildSwiftBackgroundImageInvocation(layer);
    }

    const fillLiteral = layer.kind === 'gradient'
        ? toSwiftGradientLiteral(layer.gradient)
        : toSwiftColorLiteral(layer.color);
    return `Rectangle().fill(${fillLiteral}).frame(maxWidth: .infinity, maxHeight: .infinity)`;
}

function appendSwiftUIBackgroundLayers(
    lines: string[],
    layers: NativeBackgroundLayerSpec[],
    level: number,
    style: Record<string, NativePropValue> | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
): string[] {
    const radius = toPointLiteral(style?.borderRadius, styleResolveOptions);
    const result = [...lines];
    result.push(`${indent(level + 1)}.background(alignment: .topLeading) {`);
    if (layers.length > 1) {
        result.push(`${indent(level + 2)}ZStack {`);
        for (const layer of [...layers].reverse()) {
            result.push(`${indent(level + 3)}${buildSwiftBackgroundLayerInvocation(layer)}`);
        }
        result.push(`${indent(level + 2)}}`);
    } else if (layers[0]) {
        result.push(`${indent(level + 2)}${buildSwiftBackgroundLayerInvocation(layers[0])}`);
    }
    if (radius) {
        result.push(`${indent(level + 3)}.clipShape(RoundedRectangle(cornerRadius: ${radius}))`);
    }
    result.push(`${indent(level + 1)}}`);
    return result;
}

function renderSwiftChunkedLayout(
    node: NativeElementNode,
    layout: NativeChunkedLayout,
    level: number,
    context: SwiftUIContext,
    hints: NativeRenderHints,
): string[] {
    const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
    const rowSpacing = layout.rowGap !== undefined ? formatFloat(layout.rowGap) : '12';
    const columnSpacing = layout.columnGap !== undefined ? formatFloat(layout.columnGap) : '12';
    const rowAlignment = resolveSwiftRowAlignment(style, node.children, context.resolvedStyles, context.styleResolveOptions);
    const columnAlignment = resolveSwiftColumnAlignment(style);
    const effectiveContentAlignment = resolveEffectiveChunkedContentAlignment(layout);
    const usesSingleRowGridStackAlignment = layout.kind === 'grid'
        && layout.rows.length === 1
        && effectiveContentAlignment !== undefined
        && effectiveContentAlignment !== 'start';
    const buildRowModifiers = (row: NativeChunkedRow): string[] => {
        if (row.height === undefined && row.minHeight === undefined && row.maxHeight === undefined && row.trackWeight === undefined) {
            return [];
        }

        const frameArgs = ['maxWidth: .infinity'];
        if (row.height !== undefined) {
            frameArgs.push(`height: ${formatFloat(row.height)}`);
        } else {
            if (row.minHeight !== undefined) {
                frameArgs.push(`minHeight: ${formatFloat(row.minHeight)}`);
            }
            if (row.maxHeight !== undefined) {
                frameArgs.push(`maxHeight: ${formatFloat(row.maxHeight)}`);
            }
        }

        if (row.trackWeight !== undefined && !frameArgs.includes('maxHeight: .infinity')) {
            frameArgs.push('maxHeight: .infinity');
        }

        frameArgs.push('alignment: .topLeading');

        return [
            `.frame(${frameArgs.join(', ')})`,
            ...(row.trackWeight !== undefined ? [`.layoutPriority(${formatFloat(row.trackWeight)})`] : []),
        ];
    };

    if (layout.kind === 'grid' && layout.rows.length === 1 && !usesSingleRowGridStackAlignment) {
        const [row] = layout.rows;
        const lines = [`${indent(level)}HStack(alignment: ${rowAlignment}, spacing: ${columnSpacing}) {`];
        const totalWeight = row.weights ? row.weights.reduce<number>((sum, entry) => sum + (entry ?? 0), 0) : undefined;
        row.items.forEach((child, index) => {
            const weight = row.weights?.[index];
            const columnSize = row.columnSizes?.[index];
            const cellAlignment = resolveNativeGridCellAlignment(child, style, context.resolvedStyles, context.styleResolveOptions);
            const fillChild = resolveNativeGridCellFillWidth(shouldFillChunkedCellChild(child), cellAlignment.horizontal);
            const fillHeight = cellAlignment.vertical === 'stretch';
            const shouldExpandCellHeight = cellAlignment.vertical !== undefined;
            const frameAlignment = resolveSwiftGridCellFrameAlignment(cellAlignment.horizontal, cellAlignment.vertical);
            const cellAvailableWidth = weight !== undefined && totalWeight && hints.availableWidth !== undefined
                ? Math.max(0, (hints.availableWidth - ((layout.columnGap ?? 0) * Math.max(0, row.items.length - 1))) * (weight / totalWeight))
                : columnSize?.width ?? columnSize?.maxWidth ?? hints.availableWidth;
            lines.push(`${indent(level + 1)}VStack(alignment: .leading, spacing: 0) {`);
            lines.push(...renderSwiftUINode(child, level + 2, context, {
                ...(fillChild ? { fillWidth: true } : {}),
                ...(fillHeight ? { fillHeight: true } : {}),
                availableWidth: cellAvailableWidth,
                availableHeight: hints.availableHeight,
            }));
            lines.push(`${indent(level + 1)}}`);
            const shouldExpandCellWidth = weight !== undefined
                ? fillChild || cellAlignment.horizontal !== undefined
                : !hasNativeGridColumnConstraint(columnSize) && (fillChild || cellAlignment.horizontal !== undefined);
            const cellFrameModifier = buildSwiftGridCellFrameModifier(shouldExpandCellWidth, shouldExpandCellHeight, frameAlignment, columnSize);
            if (cellFrameModifier) {
                lines.push(`${indent(level + 2)}${cellFrameModifier}`);
            }
            if (row.weights?.[index] !== undefined) {
                lines.push(`${indent(level + 2)}.layoutPriority(${formatFloat(row.weights[index])})`);
            }
        });
        lines.push(`${indent(level)}}`);
        lines.push(...buildRowModifiers(row).map((modifier) => `${indent(level + 1)}${modifier}`));
        return lines;
    }

    const halfRowSpacing = layout.rowGap !== undefined ? formatFloat(layout.rowGap / 2) : '6';
    const usesFlexibleOuterAlignment = effectiveContentAlignment === 'center'
        || effectiveContentAlignment === 'end'
        || effectiveContentAlignment === 'space-between'
        || effectiveContentAlignment === 'space-around'
        || effectiveContentAlignment === 'space-evenly';
    const lines = [`${indent(level)}VStack(alignment: ${columnAlignment}, spacing: ${usesFlexibleOuterAlignment ? '0' : rowSpacing}) {`];
    if (effectiveContentAlignment === 'center' || effectiveContentAlignment === 'end') {
        lines.push(`${indent(level + 1)}Spacer(minLength: 0)`);
    } else if (effectiveContentAlignment === 'space-around') {
        lines.push(`${indent(level + 1)}Spacer(minLength: ${halfRowSpacing})`);
    } else if (effectiveContentAlignment === 'space-evenly') {
        lines.push(`${indent(level + 1)}Spacer(minLength: ${rowSpacing})`);
    }

    for (const [rowIndex, row] of layout.rows.entries()) {
        const totalWeight = row.weights ? row.weights.reduce<number>((sum, entry) => sum + (entry ?? 0), 0) : undefined;
        lines.push(`${indent(level + 1)}HStack(alignment: ${rowAlignment}, spacing: ${columnSpacing}) {`);
        row.items.forEach((child, index) => {
            const cellAlignment = layout.kind === 'grid'
                ? resolveNativeGridCellAlignment(child, style, context.resolvedStyles, context.styleResolveOptions)
                : {};
            const columnSize = row.columnSizes?.[index];
            const fillChild = layout.kind === 'grid'
                ? resolveNativeGridCellFillWidth(shouldFillChunkedCellChild(child), cellAlignment.horizontal)
                : false;
            const fillHeight = layout.kind === 'grid' && cellAlignment.vertical === 'stretch';
            const shouldExpandCellHeight = layout.kind === 'grid' && cellAlignment.vertical !== undefined;
            const frameAlignment = layout.kind === 'grid'
                ? resolveSwiftGridCellFrameAlignment(cellAlignment.horizontal, cellAlignment.vertical)
                : undefined;
            const weight = row.weights?.[index];
            const cellAvailableWidth = weight !== undefined && totalWeight && hints.availableWidth !== undefined
                ? Math.max(0, (hints.availableWidth - ((layout.columnGap ?? 0) * Math.max(0, row.items.length - 1))) * (weight / totalWeight))
                : columnSize?.width ?? columnSize?.maxWidth ?? hints.availableWidth;
            lines.push(`${indent(level + 2)}VStack(alignment: .leading, spacing: 0) {`);
            lines.push(...renderSwiftUINode(child, level + 3, context, {
                ...(fillChild ? { fillWidth: true } : {}),
                ...(fillHeight ? { fillHeight: true } : {}),
                availableWidth: cellAvailableWidth,
                availableHeight: hints.availableHeight,
            }));
            lines.push(`${indent(level + 2)}}`);
            const shouldExpandCellWidth = weight !== undefined
                ? fillChild || cellAlignment.horizontal !== undefined
                : !hasNativeGridColumnConstraint(columnSize) && (fillChild || cellAlignment.horizontal !== undefined);
            const cellFrameModifier = buildSwiftGridCellFrameModifier(shouldExpandCellWidth, shouldExpandCellHeight, frameAlignment, columnSize);
            if (cellFrameModifier) {
                lines.push(`${indent(level + 3)}${cellFrameModifier}`);
            }
            if (row.weights?.[index] !== undefined) {
                lines.push(`${indent(level + 3)}.layoutPriority(${formatFloat(row.weights[index])})`);
            }
        });
        lines.push(`${indent(level + 1)}}`);
        lines.push(...buildRowModifiers(row).map((modifier) => `${indent(level + 2)}${modifier}`));
        if (usesFlexibleOuterAlignment && rowIndex < layout.rows.length - 1) {
            if (effectiveContentAlignment === 'space-around') {
                lines.push(`${indent(level + 1)}Spacer(minLength: ${halfRowSpacing})`);
                lines.push(`${indent(level + 1)}Spacer(minLength: ${halfRowSpacing})`);
            } else {
                lines.push(`${indent(level + 1)}Spacer(minLength: ${rowSpacing})`);
            }
        }
    }
    if (effectiveContentAlignment === 'center') {
        lines.push(`${indent(level + 1)}Spacer(minLength: 0)`);
    } else if (effectiveContentAlignment === 'space-around') {
        lines.push(`${indent(level + 1)}Spacer(minLength: ${halfRowSpacing})`);
    } else if (effectiveContentAlignment === 'space-evenly') {
        lines.push(`${indent(level + 1)}Spacer(minLength: ${rowSpacing})`);
    }
    lines.push(`${indent(level)}}`);

    return lines;
}

function appendSwiftUIModifiers(lines: string[], modifiers: string[], level: number): string[] {
    if (modifiers.length === 0) {
        return lines;
    }

    return [
        ...lines,
        ...modifiers.map((modifier) => `${indent(level + 1)}${modifier}`),
    ];
}

function appendSwiftUIOverlays(lines: string[], overlays: string[][], level: number): string[] {
    if (overlays.length === 0) {
        return lines;
    }

    const result = [...lines];
    for (const overlayLines of overlays) {
        result.push(`${indent(level + 1)}.overlay(alignment: .topLeading) {`);
        result.push(...overlayLines);
        result.push(`${indent(level + 1)}}`);
    }

    return result;
}

function renderSwiftUIContainerBody(
    node: NativeElementNode,
    level: number,
    context: SwiftUIContext,
    hints: NativeRenderHints,
): string[] {
    const contentLines = renderSwiftUIContainerContent(node, level, context, hints);
    const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
    const backgroundLayers = resolveNativeBackgroundLayers(node, context.resolvedStyles, context.styleResolveOptions);
    const usesBackgroundWrapper = shouldRenderNativeBackgroundLayersWithWrapper(backgroundLayers);
    const lines = usesBackgroundWrapper
        ? appendSwiftUIBackgroundLayers(contentLines, backgroundLayers, level, style, context.styleResolveOptions)
        : contentLines;

    if (backgroundLayers.some((layer) => layer.kind === 'image')) {
        context.helperFlags.add('backgroundImage');
    }

    return appendSwiftUIModifiers(
        lines,
        buildSwiftUIModifiers(
            node,
            context.resolvedStyles,
            hints,
            context.styleResolveOptions,
            usesBackgroundWrapper ? stripNativeBackgroundPaintStyles(style) : undefined,
        ),
        level,
    );
}

function renderSwiftUIContainerContent(
    node: NativeElementNode,
    level: number,
    context: SwiftUIContext,
    hints: NativeRenderHints,
): string[] {
    const chunkedLayout = resolveChunkedLayout(node, context.resolvedStyles, context.styleResolveOptions);
    if (chunkedLayout) {
        return renderSwiftChunkedLayout(node, chunkedLayout, level, context, hints);
    }

    const layoutKind = resolveSwiftUILayout(node, context.resolvedStyles);
    const layout = buildSwiftUILayout(node, layoutKind, context.resolvedStyles, context.styleResolveOptions);
    const lines = [
        `${indent(level)}${layout} {`,
        ...renderSwiftUIChildren(node.children, level + 1, context, layoutKind, node, hints),
        `${indent(level)}}`,
    ];

    return lines;
}

function renderSwiftUIChildren(
    nodes: NativeNode[],
    level: number,
    context: SwiftUIContext,
    parentLayout?: 'VStack' | 'HStack',
    parentNode?: NativeElementNode,
    parentHints?: NativeRenderHints,
): string[] {
    const lines: string[] = [];
    const orderedNodes = parentNode
        ? getOrderedNativeChildren(parentNode, nodes, context.resolvedStyles, context.styleResolveOptions)
        : nodes;
    const availableWidth = parentNode
        ? resolveNativeAvailableAxisSize(parentNode, 'horizontal', context.resolvedStyles, parentHints, context.styleResolveOptions)
        : resolveAxisReferenceLength('horizontal', parentHints, context.styleResolveOptions);
    const availableHeight = parentNode
        ? resolveNativeAvailableAxisSize(parentNode, 'vertical', context.resolvedStyles, parentHints, context.styleResolveOptions)
        : resolveAxisReferenceLength('vertical', parentHints, context.styleResolveOptions);
    const parentFlexLayout = resolveNativeFlexContainerLayout(parentNode, context.resolvedStyles, context.styleResolveOptions);
    const inheritedParentFlexLayout = parentFlexLayout ?? (parentLayout === 'HStack' ? 'Row' : parentLayout === 'VStack' ? 'Column' : undefined);
    const flexShrinkTargets = resolveNativeFlexShrinkTargets(
        parentNode,
        orderedNodes,
        parentFlexLayout,
        availableWidth,
        availableHeight,
        parentHints,
        context.resolvedStyles,
        context.styleResolveOptions,
    );
    const parentRowBaselineAlignment = parentFlexLayout === 'Row' && parentNode
        ? resolveBaselineAlignmentKeyword(getStyleObject(parentNode, context.resolvedStyles, context.styleResolveOptions)?.alignItems)
        : undefined;
    for (const child of orderedNodes) {
        const shouldDefaultFillCrossAxis = shouldDefaultFillWidthHint(child, context.resolvedStyles, context.styleResolveOptions);
        const shouldStretchCrossAxis = shouldStretchFlexChildCrossAxis(
            child,
            parentFlexLayout,
            parentNode,
            parentHints,
            context.resolvedStyles,
            context.styleResolveOptions,
        );
        const childHints: NativeRenderHints = {
            availableWidth,
            availableHeight,
            ...(parentLayout === 'VStack' && shouldDefaultFillCrossAxis
                && (!parentFlexLayout || (parentFlexLayout === 'Column' && shouldStretchCrossAxis))
                ? { fillWidth: true }
                : {}),
            ...(parentLayout === 'HStack' && parentFlexLayout === 'Row' && shouldDefaultFillCrossAxis && shouldStretchCrossAxis
                ? { fillHeight: true }
                : {}),
            ...(child.kind === 'element' && parentFlexLayout === 'Row' && flexShrinkTargets.has(child)
                ? { negotiatedMaxWidth: flexShrinkTargets.get(child) }
                : {}),
            ...(child.kind === 'element' && parentFlexLayout === 'Column' && flexShrinkTargets.has(child)
                ? { negotiatedMaxHeight: flexShrinkTargets.get(child) }
                : {}),
            ...(inheritedParentFlexLayout ? { parentFlexLayout: inheritedParentFlexLayout } : {}),
            ...(parentRowBaselineAlignment ? { parentRowBaselineAlignment } : {}),
        };
        lines.push(...renderSwiftUINode(child, level, context, childHints));
    }
    return lines;
}

function renderSwiftUINode(
    node: NativeNode,
    level: number,
    context: SwiftUIContext,
    hints: NativeRenderHints = {},
): string[] {
    if (node.kind === 'text') {
        if (node.stateId) {
            const { descriptor, variableName } = ensureSwiftStateVariable(context, node.stateId);
            return [`${indent(level)}Text(${toSwiftTextValueExpression(variableName, descriptor)})`];
        }

        return [`${indent(level)}Text(${quoteSwiftString(node.value)})`];
    }

    const classComment = Array.isArray(node.props.classList) && node.props.classList.length > 0
        ? `${indent(level)}// classList: ${(node.props.classList as NativePropValue[]).map((item) => String(item)).join(' ')}`
        : undefined;
    const baseLines: string[] = [];
    if (classComment) baseLines.push(classComment);

    if (node.component === 'Text') {
        const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
        const dynamicText = buildSwiftTextExpression(node.children, context, resolveTextTransform(style?.textTransform));
        const staticText = applyTextTransform(flattenTextContent(node.children), resolveTextTransform(style?.textTransform));
        return appendSwiftUIModifiers(
            [...baseLines, `${indent(level)}Text(${dynamicText ?? quoteSwiftString(staticText)})`],
            buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions),
            level
        );
    }

    if (node.component === 'Toggle') {
        const binding = getNativeBindingReference(node);
        const stateName = binding?.kind === 'checked'
            ? ensureSwiftStateVariable(context, binding.id).variableName
            : `toggleValue${context.toggleIndex++}`;
        const disabled = isNativeDisabled(node);
        const toggleEventStatements = disabled
            ? []
            : buildSwiftControlEventDispatchStatements(node, { checkedExpression: 'nextChecked' });
        const toggleBinding = toggleEventStatements.length > 0
            ? `Binding(get: { ${stateName} }, set: { nextChecked in ${stateName} = nextChecked; ${toggleEventStatements.join('; ')} })`
            : `$${stateName}`;

        if (!binding || binding.kind !== 'checked') {
            context.stateDeclarations.push(`${indent(1)}@State private var ${stateName} = ${toNativeBoolean(node.props.checked) ? 'true' : 'false'}`);
        }

        if (toggleEventStatements.length > 0) {
            context.helperFlags.add('bridge');
        }

        return appendSwiftUIModifiers(
            [
                ...baseLines,
                `${indent(level)}Toggle("", isOn: ${toggleBinding})`,
            ],
            ['.labelsHidden()', ...(disabled ? ['.disabled(true)'] : []), ...buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions)],
            level
        );
    }

    if (node.component === 'TextInput') {
        const binding = getNativeBindingReference(node);
        const textFieldId = context.textFieldIndex++;
        let textFieldBinding = `$textFieldValue${textFieldId}`;
        let textValueExpression = textFieldBinding.slice(1);
        const disabled = isNativeDisabled(node);
        const readOnly = isNativeReadOnly(node);
        const autoFocus = !disabled && shouldNativeAutoFocus(node);
        const focusStateName = `textFieldFocus${textFieldId}`;
        let textFieldSetter = `${textValueExpression} = nextValue`;

        if (binding?.kind === 'value') {
            const { descriptor, variableName } = ensureSwiftStateVariable(context, binding.id);
            textValueExpression = toSwiftTextValueExpression(variableName, descriptor);
            textFieldSetter = buildSwiftStateStringAssignment(variableName, descriptor, 'nextValue');
            textFieldBinding = buildSwiftStringBindingExpression(variableName, descriptor);
        } else {
            const stateName = textFieldBinding.slice(1);
            const initialValue = typeof node.props.value === 'string' || typeof node.props.value === 'number'
                ? String(node.props.value)
                : '';
            context.stateDeclarations.push(`${indent(1)}@State private var ${stateName} = ${quoteSwiftString(initialValue)}`);
            textValueExpression = stateName;
            textFieldSetter = `${stateName} = nextValue`;
        }

        const textInputEventStatements = !disabled && !readOnly
            ? buildSwiftControlEventDispatchStatements(node, { valueExpression: 'nextValue' })
            : [];
        const submitEventStatement = !disabled && !readOnly && node.sourceTag !== 'textarea' && node.events.includes('submit')
            ? buildSwiftControlEventDispatchInvocation(node, 'submit', { valueExpression: textValueExpression })
            : undefined;

        if (textInputEventStatements.length > 0 || submitEventStatement) {
            context.helperFlags.add('bridge');
        }

        if (!readOnly && textInputEventStatements.length > 0) {
            textFieldBinding = `Binding(get: { ${textValueExpression} }, set: { nextValue in ${textFieldSetter}; ${textInputEventStatements.join('; ')} })`;
        }

        if (readOnly) {
            textFieldBinding = buildSwiftReadOnlyBindingExpression(textValueExpression);
        }

        if (autoFocus) {
            context.stateDeclarations.push(`${indent(1)}@FocusState private var ${focusStateName}: Bool`);
        }

        const placeholder = typeof node.props.placeholder === 'string' ? node.props.placeholder : '';
        const isTextarea = node.sourceTag === 'textarea';
        const inputType = resolveNativeTextInputType(node);
        const keyboardTypeModifier = resolveSwiftKeyboardTypeModifier(node);
        const textInputLine = inputType === 'password' && !isTextarea
            ? `${indent(level)}SecureField(${quoteSwiftString(placeholder)}, text: ${textFieldBinding})`
            : isTextarea
                ? `${indent(level)}TextField(${quoteSwiftString(placeholder)}, text: ${textFieldBinding}, axis: .vertical)`
                : `${indent(level)}TextField(${quoteSwiftString(placeholder)}, text: ${textFieldBinding})`;
        return appendSwiftUIModifiers(
            [
                ...baseLines,
                textInputLine,
            ],
            [
                '.textFieldStyle(.plain)',
                ...(isTextarea ? ['.lineLimit(4, reservesSpace: true)'] : []),
                ...(keyboardTypeModifier ? [keyboardTypeModifier] : []),
                ...(submitEventStatement ? ['.submitLabel(.done)', `.onSubmit { ${submitEventStatement} }`] : []),
                ...(shouldDisableNativeTextCapitalization(node) ? ['.textInputAutocapitalization(.never)'] : []),
                ...(autoFocus ? [`.focused($${focusStateName})`, `.onAppear { ${focusStateName} = true }`] : []),
                ...(disabled ? ['.disabled(true)'] : []),
                ...buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions),
            ],
            level
        );
    }

    if (node.component === 'Slider') {
        const binding = getNativeBindingReference(node);
        const sliderId = context.sliderIndex++;
        const min = resolveNativeRangeMin(node);
        const max = resolveNativeRangeMax(node);
        const initialValue = resolveNativeRangeInitialValue(node);
        const step = resolveNativeStepConstraint(node);
        const disabled = isNativeDisabled(node);
        let stateName = `sliderValue${sliderId}`;
        let sliderBinding = `$${stateName}`;

        if (binding?.kind === 'value') {
            const { descriptor, variableName } = ensureSwiftStateVariable(context, binding.id);
            stateName = variableName;
            if (descriptor.type === 'number') {
                sliderBinding = `$${variableName}`;
            } else {
                sliderBinding = `Binding(get: { Double(${variableName}) ?? ${formatNativeNumberLiteral(initialValue)} }, set: { nextValue in ${variableName} = String(nextValue) })`;
            }
        } else {
            context.stateDeclarations.push(`${indent(1)}@State private var ${stateName}: Double = ${formatNativeNumberLiteral(initialValue)}`);
        }

        const sliderEventStatements = disabled
            ? []
            : buildSwiftControlEventDispatchStatements(node, { valueExpression: 'String(nextValue)' });
        if (sliderEventStatements.length > 0) {
            context.helperFlags.add('bridge');
            if (binding?.kind === 'value') {
                const { descriptor, variableName } = ensureSwiftStateVariable(context, binding.id);
                if (descriptor.type === 'number') {
                    sliderBinding = `Binding(get: { ${variableName} }, set: { nextValue in ${variableName} = nextValue; ${sliderEventStatements.join('; ')} })`;
                } else {
                    sliderBinding = `Binding(get: { Double(${variableName}) ?? ${formatNativeNumberLiteral(initialValue)} }, set: { nextValue in ${variableName} = String(nextValue); ${sliderEventStatements.join('; ')} })`;
                }
            } else {
                sliderBinding = `Binding(get: { ${stateName} }, set: { nextValue in ${stateName} = nextValue; ${sliderEventStatements.join('; ')} })`;
            }
        }

        return appendSwiftUIModifiers(
            [
                ...baseLines,
                `${indent(level)}Slider(value: ${sliderBinding}, in: ${formatFloat(min)}...${formatFloat(max)}${step !== undefined ? `, step: ${formatFloat(step)}` : ''})`,
            ],
            [...(disabled ? ['.disabled(true)'] : []), ...buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions)],
            level
        );
    }

    if (node.component === 'Picker') {
        const binding = getNativeBindingReference(node);
        const pickerId = context.pickerIndex++;
        const pickerOptions = resolveNativePickerOptions(node);
        const initialSelection = resolveNativePickerInitialSelection(node, pickerOptions);
        const initialSelections = resolveNativePickerInitialSelections(node, pickerOptions);
        const disabled = isNativeDisabled(node);
        const isMultiple = isNativeMultiple(node);

        if (isMultiple) {
            const optionValues = pickerOptions.map((option) => option.value);
            let selectionName = `pickerValues${pickerId}`;
            let usesBoundArrayState = false;

            if (binding?.kind === 'value') {
                const { descriptor, variableName } = ensureSwiftStateVariable(context, binding.id);
                if (descriptor.type === 'string-array') {
                    selectionName = variableName;
                    usesBoundArrayState = true;
                }
            }

            if (!usesBoundArrayState) {
                context.stateDeclarations.push(`${indent(1)}@State private var ${selectionName}: Set<String> = [${initialSelections.map((value) => quoteSwiftString(value)).join(', ')}]`);
            }

            const lines = [
                ...baseLines,
                `${indent(level)}VStack(alignment: .leading, spacing: 8) {`,
                ...pickerOptions.flatMap((option) => {
                    const optionDisabled = disabled || option.disabled;
                    const pickerEventStatements = optionDisabled
                        ? []
                        : buildSwiftControlEventDispatchStatements(node, { valuesExpression: usesBoundArrayState ? selectionName : `Array(${selectionName}).sorted()` });
                    const toggleBinding = usesBoundArrayState
                        ? buildSwiftStateStringArrayToggleBinding(selectionName, option.value, optionValues, pickerEventStatements)
                        : `Binding(get: { ${selectionName}.contains(${quoteSwiftString(option.value)}) }, set: { isOn in if isOn { ${selectionName}.insert(${quoteSwiftString(option.value)}) } else { ${selectionName}.remove(${quoteSwiftString(option.value)}) }${pickerEventStatements.length > 0 ? `; ${pickerEventStatements.join('; ')}` : ''} })`;
                    if (pickerEventStatements.length > 0) {
                        context.helperFlags.add('bridge');
                    }
                    return [
                        `${indent(level + 1)}Toggle(isOn: ${toggleBinding}) {`,
                        `${indent(level + 2)}Text(${quoteSwiftString(option.label)})`,
                        `${indent(level + 1)}}`,
                        ...(optionDisabled ? [`${indent(level + 1)}.disabled(true)`] : []),
                    ];
                }),
                `${indent(level)}}`,
            ];

            return appendSwiftUIModifiers(lines, buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions), level);
        }

        let selectionBinding = `$pickerValue${pickerId}`;
        let selectionValueExpression = `pickerValue${pickerId}`;

        if (binding?.kind === 'value') {
            const { descriptor, variableName } = ensureSwiftStateVariable(context, binding.id);
            selectionValueExpression = toSwiftTextValueExpression(variableName, descriptor);
            selectionBinding = buildSwiftStringBindingExpression(variableName, descriptor);
        } else {
            context.stateDeclarations.push(`${indent(1)}@State private var pickerValue${pickerId} = ${quoteSwiftString(initialSelection)}`);
        }

        const pickerEventStatements = disabled
            ? []
            : buildSwiftControlEventDispatchStatements(node, { valueExpression: 'nextValue' });
        if (pickerEventStatements.length > 0) {
            context.helperFlags.add('bridge');
            if (binding?.kind === 'value') {
                const { descriptor, variableName } = ensureSwiftStateVariable(context, binding.id);
                selectionBinding = buildSwiftStringBindingExpression(variableName, descriptor, pickerEventStatements);
            } else {
                selectionBinding = `Binding(get: { ${selectionValueExpression} }, set: { nextValue in ${selectionValueExpression} = nextValue; ${pickerEventStatements.join('; ')} })`;
            }
        }

        const lines = [
            ...baseLines,
            `${indent(level)}Picker("", selection: ${selectionBinding}) {`,
            ...(initialSelection === '' ? [`${indent(level + 1)}Text("Select").tag("")`] : []),
            ...pickerOptions.map((option) => `${indent(level + 1)}Text(${quoteSwiftString(option.label)}).tag(${quoteSwiftString(option.value)})`),
            `${indent(level)}}`,
        ];

        return appendSwiftUIModifiers(lines, ['.labelsHidden()', ...(disabled ? ['.disabled(true)'] : []), ...buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions)], level);
    }

    if (node.component === 'Option') {
        const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
        const dynamicText = buildSwiftTextExpression(node.children, context, resolveTextTransform(style?.textTransform));
        const staticText = applyTextTransform(resolveNativePickerOptionLabel(node), resolveTextTransform(style?.textTransform));
        return appendSwiftUIModifiers(
            [...baseLines, `${indent(level)}Text(${dynamicText ?? quoteSwiftString(staticText)})`],
            buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions),
            level
        );
    }

    if (node.component === 'Divider') {
        return appendSwiftUIModifiers(
            [...baseLines, `${indent(level)}Divider()`],
            buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions),
            level
        );
    }

    if (node.component === 'Progress') {
        const progress = resolveNativeProgressFraction(node.props);
        return appendSwiftUIModifiers(
            [...baseLines, `${indent(level)}${progress !== undefined ? `ProgressView(value: ${formatFloat(progress)})` : 'ProgressView()'}`],
            buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions),
            level
        );
    }

    if (node.component === 'Button') {
        const label = flattenTextContent(node.children) || 'Button';
        const disabled = node.sourceTag === 'button' && isNativeDisabled(node);
        const bridgeInvocation = disabled
            ? undefined
            : buildSwiftBridgeInvocation(
                resolveNativeAction(node),
                resolveNativeRoute(node),
                serializeNativePayload(node.props.nativePayload),
            );
        const activeStyle = !disabled
            ? resolveNativePseudoStateVariantStyle(node, context.styleContexts, context.styleResolveOptions, ['active'])
            : undefined;
        const activeResolvedStyles = activeStyle ? createSingleNodeResolvedStyleMap(node, activeStyle) : undefined;
        const buildButtonLines = (resolvedStyles: NativeResolvedStyleMap): string[] => {
            const style = getStyleObject(node, resolvedStyles, context.styleResolveOptions);
            const transformedLabel = buildSwiftTextExpression(node.children, context, resolveTextTransform(style?.textTransform));
            const lines = bridgeInvocation
                ? [
                    `${indent(level)}Button(action: {`,
                    `${indent(level + 1)}${bridgeInvocation}`,
                    `${indent(level)}}) {`,
                    `${indent(level + 1)}Text(${transformedLabel || quoteSwiftString(label)})`,
                    `${indent(level)}}`,
                ]
                : disabled
                    ? [
                        `${indent(level)}Button(action: {}) {`,
                        `${indent(level + 1)}Text(${transformedLabel || quoteSwiftString(label)})`,
                        `${indent(level)}}`,
                    ]
                    : [
                        `${indent(level)}Button(action: {`,
                        `${indent(level + 1)}// TODO: wire elit event(s): ${node.events.join(', ') || 'press'}`,
                        `${indent(level)}}) {`,
                        `${indent(level + 1)}Text(${transformedLabel || quoteSwiftString(label)})`,
                        `${indent(level)}}`,
                    ];

            return appendSwiftUIModifiers(lines, buildSwiftUIButtonModifiers(node, resolvedStyles, context.styleResolveOptions), level);
        };
        const baseVariantLines = buildButtonLines(context.resolvedStyles);
        const activeVariantLines = activeResolvedStyles ? buildButtonLines(activeResolvedStyles) : baseVariantLines;
        const shouldUseRuntimeActiveVariant = !disabled && activeResolvedStyles !== undefined && activeVariantLines.join('\n') !== baseVariantLines.join('\n');

        if (bridgeInvocation) {
            context.helperFlags.add('bridge');
        }

        if (shouldUseRuntimeActiveVariant) {
            const pressedName = `interactionPressed${context.interactionIndex++}`;
            context.stateDeclarations.push(`${indent(1)}@GestureState private var ${pressedName} = false`);
            return [
                ...baseLines,
                `${indent(level)}Group {`,
                `${indent(level + 1)}if ${pressedName} {`,
                ...activeVariantLines.map((line) => `${indent(2)}${line}`),
                `${indent(level + 1)}} else {`,
                ...baseVariantLines.map((line) => `${indent(2)}${line}`),
                `${indent(level + 1)}}`,
                `${indent(level)}}`,
                `${indent(level + 1)}.simultaneousGesture(DragGesture(minimumDistance: 0).updating($${pressedName}) { _, state, _ in`,
                `${indent(level + 2)}state = true`,
                `${indent(level + 1)}})`,
            ];
        }

        return [...baseLines, ...baseVariantLines];
    }

    if (node.component === 'Link') {
        const label = flattenTextContent(node.children) || String(node.props.destination ?? 'Link');
        const destination = typeof node.props.destination === 'string' ? node.props.destination : 'destination';
        const suggestedName = resolveNativeDownloadSuggestedName(node);
        const bridgeInvocation = buildSwiftBridgeInvocation(
            resolveNativeAction(node),
            resolveNativeRoute(node),
            serializeNativePayload(node.props.nativePayload),
        );
        const activeStyle = resolveNativePseudoStateVariantStyle(node, context.styleContexts, context.styleResolveOptions, ['active']);
        const activeResolvedStyles = activeStyle ? createSingleNodeResolvedStyleMap(node, activeStyle) : undefined;
        const buildLinkLines = (resolvedStyles: NativeResolvedStyleMap): string[] => {
            const style = getStyleObject(node, resolvedStyles, context.styleResolveOptions);
            const transformedLabel = buildSwiftTextExpression(node.children, context, resolveTextTransform(style?.textTransform));
            const lines = shouldNativeDownloadLink(node) && typeof node.props.destination === 'string'
                ? [
                    `${indent(level)}Button(action: {`,
                    `${indent(level + 1)}elitDownloadFile(from: ${quoteSwiftString(node.props.destination)}, suggestedName: ${suggestedName ? quoteSwiftString(suggestedName) : 'nil'})`,
                    `${indent(level)}}) {`,
                    `${indent(level + 1)}Text(${transformedLabel || quoteSwiftString(label)})`,
                    `${indent(level)}}`,
                ]
                : isExternalDestination(destination)
                    ? [
                        `${indent(level)}Button(action: {`,
                        `${indent(level + 1)}if let destination = URL(string: ${quoteSwiftString(destination)}) {`,
                        `${indent(level + 2)}openURL(destination)` ,
                        `${indent(level + 1)}}`,
                        `${indent(level)}}) {`,
                        `${indent(level + 1)}Text(${transformedLabel || quoteSwiftString(label)})`,
                        `${indent(level)}}`,
                    ]
                    : bridgeInvocation
                        ? [
                            `${indent(level)}Button(action: {`,
                            `${indent(level + 1)}${bridgeInvocation}`,
                            `${indent(level)}}) {`,
                            `${indent(level + 1)}Text(${transformedLabel || quoteSwiftString(label)})`,
                            `${indent(level)}}`,
                        ]
                        : [
                            `${indent(level)}Button(action: {`,
                            `${indent(level + 1)}// TODO: navigate to ${escapeSwiftString(destination)}`,
                            `${indent(level)}}) {`,
                            `${indent(level + 1)}Text(${transformedLabel || quoteSwiftString(label)})`,
                            `${indent(level)}}`,
                        ];

            return appendSwiftUIModifiers(lines, buildSwiftUIButtonModifiers(node, resolvedStyles, context.styleResolveOptions), level);
        };
        const baseVariantLines = buildLinkLines(context.resolvedStyles);
        const activeVariantLines = activeResolvedStyles ? buildLinkLines(activeResolvedStyles) : baseVariantLines;
        const shouldUseRuntimeActiveVariant = activeResolvedStyles !== undefined && activeVariantLines.join('\n') !== baseVariantLines.join('\n');
        if (shouldNativeDownloadLink(node) && typeof node.props.destination === 'string') {
            context.helperFlags.add('downloadHandler');
        } else if (isExternalDestination(destination)) {
            context.helperFlags.add('openUrlHandler');
        } else if (bridgeInvocation) {
            context.helperFlags.add('bridge');
        }

        if (shouldUseRuntimeActiveVariant) {
            const pressedName = `interactionPressed${context.interactionIndex++}`;
            context.stateDeclarations.push(`${indent(1)}@GestureState private var ${pressedName} = false`);
            return [
                ...baseLines,
                `${indent(level)}Group {`,
                `${indent(level + 1)}if ${pressedName} {`,
                ...activeVariantLines.map((line) => `${indent(2)}${line}`),
                `${indent(level + 1)}} else {`,
                ...baseVariantLines.map((line) => `${indent(2)}${line}`),
                `${indent(level + 1)}}`,
                `${indent(level)}}`,
                `${indent(level + 1)}.simultaneousGesture(DragGesture(minimumDistance: 0).updating($${pressedName}) { _, state, _ in`,
                `${indent(level + 2)}state = true`,
                `${indent(level + 1)}})`,
            ];
        }

        return [...baseLines, ...baseVariantLines];
    }

    if (node.component === 'Image') {
        context.helperFlags.add('imagePlaceholder');
        context.helperFlags.add('backgroundImage');
        const source = resolveNativeSurfaceSource(node) ?? '';
        const alt = typeof node.props.alt === 'string' ? node.props.alt : undefined;
        const fallbackLabel = resolveImageFallbackLabel(source, alt);
        const objectFit = resolveNativeImageFit(node, context.resolvedStyles, context.styleResolveOptions);
        const objectPosition = resolveNativeImagePosition(node, context.resolvedStyles, context.styleResolveOptions);
        return appendSwiftUIModifiers(
            [
                ...baseLines,
                `${indent(level)}elitImageSurface(source: ${quoteSwiftString(source)}, label: ${quoteSwiftString(fallbackLabel)}, alt: ${alt ? quoteSwiftString(alt) : 'nil'}${objectFit !== 'cover' ? `, objectFit: ${quoteSwiftString(objectFit)}` : ''}${objectPosition !== 'center' ? `, objectPosition: ${quoteSwiftString(objectPosition)}` : ''})`,
            ],
            buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions),
            level
        );
    }

    if (node.component === 'Vector' && node.sourceTag === 'svg') {
        const vectorCanvas = buildSwiftVectorCanvasLines(node, level, context.resolvedStyles, context.styleResolveOptions);
        if (vectorCanvas) {
            return appendSwiftUIModifiers([...baseLines, ...vectorCanvas.lines], vectorCanvas.modifiers, level);
        }
    }

    if (node.component === 'Canvas') {
        const canvasSurface = buildSwiftCanvasSurfaceLines(node, level, context.resolvedStyles, context.styleResolveOptions);
        return appendSwiftUIModifiers([...baseLines, ...canvasSurface.lines], canvasSurface.modifiers, level);
    }

    if (node.component === 'WebView') {
        const source = resolveNativeSurfaceSource(node);
        if (source) {
            context.helperFlags.add('webViewSurface');
            const accessibilityLabel = resolveNativeAccessibilityLabel(node) ?? 'Web content';
            return appendSwiftUIModifiers(
                [...baseLines, `${indent(level)}ElitWebViewSurface(source: ${quoteSwiftString(source)}, label: ${quoteSwiftString(accessibilityLabel)})`],
                buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions),
                level
            );
        }
    }

    if (node.component === 'Media') {
        const source = resolveNativeSurfaceSource(node);
        if (source) {
            context.helperFlags.add('mediaSurface');
            const mediaLabel = resolveNativeMediaLabel(node);
            const muted = isNativeMuted(node) ? 'true' : 'false';
            const controls = shouldNativeShowVideoControls(node) ? 'true' : 'false';
            const poster = resolveNativeVideoPoster(node);
            const playsInline = shouldNativePlayInline(node) ? 'true' : 'false';
            const posterFit = resolveNativeVideoPosterFit(node, context.resolvedStyles, context.styleResolveOptions);
            const posterPosition = resolveNativeVideoPosterPosition(node, context.resolvedStyles, context.styleResolveOptions);
            const mediaView = node.sourceTag === 'video'
                ? `ElitVideoSurface(source: ${quoteSwiftString(source)}, label: ${quoteSwiftString(mediaLabel)}, autoPlay: ${toNativeBoolean(node.props.autoplay) ? 'true' : 'false'}, muted: ${muted}, controls: ${controls}, poster: ${poster ? quoteSwiftString(poster) : 'nil'}, playsInline: ${playsInline}${posterFit !== 'cover' ? `, posterFit: ${quoteSwiftString(posterFit)}` : ''}${posterPosition !== 'center' ? `, posterPosition: ${quoteSwiftString(posterPosition)}` : ''})`
                : `ElitAudioSurface(source: ${quoteSwiftString(source)}, label: ${quoteSwiftString(mediaLabel)}, autoPlay: ${toNativeBoolean(node.props.autoplay) ? 'true' : 'false'}, muted: ${muted})`;

            return appendSwiftUIModifiers(
                [...baseLines, `${indent(level)}${mediaView}`],
                buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions),
                level
            );
        }
    }

    if (node.component === 'Cell') {
        const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
        const cellSpacing = hasNativeTableLayoutSourceTag(node.sourceTag) ? '0' : '12';
        const lines = [
            ...baseLines,
            `${indent(level)}VStack(alignment: .leading, spacing: ${cellSpacing}) {`,
            ...renderSwiftUIChildren(node.children, level + 1, context, 'VStack', node, hints),
            `${indent(level)}}`,
        ];
        const modifiers = buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions);
        if (hints.parentFlexLayout === 'Row' && !hasExplicitNativeWidthStyle(style)) {
            modifiers.push('.frame(maxWidth: .infinity, alignment: .leading)');
        }

        return appendSwiftUIModifiers(lines, modifiers, level);
    }

    if (node.component === 'Screen') {
        const { flowChildren, fixedChildren } = splitFixedPositionedChildren(node.children, context.resolvedStyles, context.styleResolveOptions);
        const flowNode: NativeElementNode = flowChildren.length === node.children.length
            ? node
            : { ...node, children: flowChildren };
        const layoutKind = resolveSwiftUILayout(flowNode, context.resolvedStyles);
        const layout = buildSwiftUILayout(flowNode, layoutKind, context.resolvedStyles, context.styleResolveOptions);
        const contentLines = [
            `${indent(level + 1)}${layout} {`,
            ...renderSwiftUIChildren(flowNode.children, level + 2, context, layoutKind, flowNode, hints),
            `${indent(level + 1)}}`,
        ];
        const screenContent = appendSwiftUIModifiers(contentLines, buildSwiftUIModifiers(flowNode, context.resolvedStyles, hints, context.styleResolveOptions), level + 1);
        const screenLines = [
            ...baseLines,
            `${indent(level)}ScrollView {`,
            ...screenContent,
            `${indent(level)}}`,
            `${indent(level + 1)}.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)`,
        ];
        if (fixedChildren.length === 0) {
            return screenLines;
        }

        const overlays = fixedChildren.map((child) => renderSwiftUINode(child, level + 2, context, { availableWidth: hints.availableWidth, availableHeight: hints.availableHeight, absoluteOverlay: true }));
        return appendSwiftUIOverlays(screenLines, overlays, level);
    }

    if (node.component === 'Media' || node.component === 'WebView' || node.component === 'Canvas' || node.component === 'Vector' || node.component === 'Math') {
        context.helperFlags.add('unsupportedPlaceholder');
        return appendSwiftUIModifiers(
            [
                ...baseLines,
                `${indent(level)}elitUnsupportedPlaceholder(label: ${quoteSwiftString(node.component)}, sourceTag: ${quoteSwiftString(node.sourceTag)})`,
            ],
            buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions),
            level
        );
    }

    const { flowChildren, absoluteChildren } = splitAbsolutePositionedChildren(node.children, context.resolvedStyles, context.styleResolveOptions);
    if (absoluteChildren.length > 0 && node.component !== 'Screen') {
        const flowNode: NativeElementNode = flowChildren.length === node.children.length
            ? node
            : { ...node, children: flowChildren };
        const base = [...baseLines, ...renderSwiftUIContainerBody(flowNode, level, context, hints)];
        const overlays = absoluteChildren.map((child) => renderSwiftUINode(child, level + 2, context, { availableWidth: hints.availableWidth, availableHeight: hints.availableHeight, absoluteOverlay: true }));
        return appendSwiftUIOverlays(base, overlays, level);
    }

    return [...baseLines, ...renderSwiftUIContainerBody(node, level, context, hints)];
}

function buildSwiftUIHelpers(context: SwiftUIContext): string[] {
    const helpers: string[] = [];

    if (context.helperFlags.has('bridge')) {
        helpers.push('');
        helpers.push('enum ElitNativeBridge {');
        helpers.push('    static var onAction: ((String, String?, String?) -> Void)?');
        helpers.push('    static var onNavigate: ((String) -> Void)?');
        helpers.push('');
        helpers.push('    static func dispatch(action: String? = nil, route: String? = nil, payloadJson: String? = nil) {');
        helpers.push('        if let route {');
        helpers.push('            onNavigate?(route)');
        helpers.push('        }');
        helpers.push('        if let action {');
        helpers.push('            onAction?(action, route, payloadJson)');
        helpers.push('        }');
        helpers.push('    }');
        helpers.push('');
        helpers.push('    static func controlEventPayload(event: String, sourceTag: String, inputType: String? = nil, value: String? = nil, values: [String]? = nil, checked: Bool? = nil, detailJson: String? = nil) -> String {');
        helpers.push('        var payload: [String: Any] = ["event": event, "sourceTag": sourceTag]');
        helpers.push('        if let inputType { payload["inputType"] = inputType }');
        helpers.push('        if let value { payload["value"] = value }');
        helpers.push('        if let values { payload["values"] = values }');
        helpers.push('        if let checked { payload["checked"] = checked }');
        helpers.push('        if let detailJson, let detailData = detailJson.data(using: .utf8), let detail = try? JSONSerialization.jsonObject(with: detailData) {');
        helpers.push('            payload["detail"] = detail');
        helpers.push('        } else if let detailJson {');
        helpers.push('            payload["detail"] = detailJson');
        helpers.push('        }');
        helpers.push('        guard JSONSerialization.isValidJSONObject(payload), let data = try? JSONSerialization.data(withJSONObject: payload), let json = String(data: data, encoding: .utf8) else {');
        helpers.push('            return "{}"');
        helpers.push('        }');
        helpers.push('        return json');
        helpers.push('    }');
        helpers.push('}');
    }

    if (context.helperFlags.has('downloadHandler')) {
        helpers.push('');
        helpers.push('private func elitDownloadFile(from source: String, suggestedName: String? = nil) {');
        helpers.push('    guard let url = URL(string: source) else { return }');
        helpers.push('    let fileName: String');
        helpers.push('    if let suggestedName = suggestedName?.trimmingCharacters(in: .whitespacesAndNewlines), !suggestedName.isEmpty {');
        helpers.push('        fileName = suggestedName');
        helpers.push('    } else {');
        helpers.push('        fileName = url.lastPathComponent.isEmpty ? "download" : url.lastPathComponent');
        helpers.push('    }');
        helpers.push('    let destinationDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first ?? URL(fileURLWithPath: NSTemporaryDirectory(), isDirectory: true)');
        helpers.push('    URLSession.shared.downloadTask(with: url) { temporaryURL, _, _ in');
        helpers.push('        guard let temporaryURL else { return }');
        helpers.push('        let destinationURL = destinationDirectory.appendingPathComponent(fileName)');
        helpers.push('        try? FileManager.default.removeItem(at: destinationURL)');
        helpers.push('        do {');
        helpers.push('            try FileManager.default.moveItem(at: temporaryURL, to: destinationURL)');
        helpers.push('        } catch {');
        helpers.push('            try? FileManager.default.copyItem(at: temporaryURL, to: destinationURL)');
        helpers.push('        }');
        helpers.push('    }.resume()');
        helpers.push('}');
    }

    if (context.helperFlags.has('imagePlaceholder')) {
        helpers.push('');
        helpers.push('@ViewBuilder');
        helpers.push('private func elitImagePlaceholder(label: String, source: String, alt: String?) -> some View {');
        helpers.push('    let _ = source');
        helpers.push('    let _ = alt');
        helpers.push('    ZStack {');
        helpers.push('        RoundedRectangle(cornerRadius: 22)');
        helpers.push('            .fill(LinearGradient(colors: [Color(red: 0.09, green: 0.075, blue: 0.071, opacity: 1), Color(red: 0.157, green: 0.122, blue: 0.102, opacity: 1)], startPoint: .topLeading, endPoint: .bottomTrailing))');
        helpers.push('        RoundedRectangle(cornerRadius: 22)');
        helpers.push('            .stroke(Color(red: 0.149, green: 0.098, blue: 0.078, opacity: 0.12), lineWidth: 1)');
        helpers.push('        Text(label)');
        helpers.push('            .foregroundStyle(Color(red: 0.945, green: 0.761, blue: 0.49, opacity: 1))');
        helpers.push('            .font(.system(size: 26, weight: .bold, design: .serif))');
        helpers.push('    }');
        helpers.push('}');
        if (context.helperFlags.has('backgroundImage')) {
            helpers.push('');
            helpers.push('@ViewBuilder');
            helpers.push('private func elitImageSurface(source: String, label: String, alt: String?, objectFit: String = "cover", objectPosition: String = "center") -> some View {');
            helpers.push('    ZStack {');
            helpers.push('        elitImagePlaceholder(label: label, source: source, alt: alt)');
            helpers.push('        if let imageURL = elitResolvedMediaURL(source) {');
            helpers.push('            AsyncImage(url: imageURL) { phase in');
            helpers.push('                switch phase {');
            helpers.push('                case .success(let image):');
            helpers.push('                    elitBackgroundImage(image, backgroundSize: objectFit, backgroundPosition: objectPosition, backgroundRepeat: "no-repeat")');
            helpers.push('                default:');
            helpers.push('                    Color.clear');
            helpers.push('                }');
            helpers.push('            }');
            helpers.push('            .clipped()');
            helpers.push('        }');
            helpers.push('    }');
            helpers.push('}');
        }
    }

    if (context.helperFlags.has('backgroundImage')) {
        helpers.push('');
        helpers.push('private func elitBackgroundAlignment(_ backgroundPosition: String) -> Alignment {');
        helpers.push('    switch backgroundPosition.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {');
        helpers.push('    case "top":');
        helpers.push('        return .top');
        helpers.push('    case "bottom":');
        helpers.push('        return .bottom');
        helpers.push('    case "leading":');
        helpers.push('        return .leading');
        helpers.push('    case "trailing":');
        helpers.push('        return .trailing');
        helpers.push('    case "top-leading":');
        helpers.push('        return .topLeading');
        helpers.push('    case "top-trailing":');
        helpers.push('        return .topTrailing');
        helpers.push('    case "bottom-leading":');
        helpers.push('        return .bottomLeading');
        helpers.push('    case "bottom-trailing":');
        helpers.push('        return .bottomTrailing');
        helpers.push('    default:');
        helpers.push('        return .center');
        helpers.push('    }');
        helpers.push('}');
        helpers.push('');
        helpers.push('@ViewBuilder');
        helpers.push('private func elitBackgroundImage(_ image: Image, backgroundSize: String, backgroundPosition: String, backgroundRepeat: String) -> some View {');
        helpers.push('    if backgroundRepeat.trimmingCharacters(in: .whitespacesAndNewlines).lowercased().starts(with: "repeat") {');
        helpers.push('        image');
        helpers.push('            .resizable(resizingMode: .tile)');
        helpers.push('            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: elitBackgroundAlignment(backgroundPosition))');
        helpers.push('    } else {');
        helpers.push('        switch backgroundSize.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {');
        helpers.push('        case "contain":');
        helpers.push('            image');
        helpers.push('                .resizable()');
        helpers.push('                .scaledToFit()');
        helpers.push('                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: elitBackgroundAlignment(backgroundPosition))');
        helpers.push('        case "fill":');
        helpers.push('            image');
        helpers.push('                .resizable()');
        helpers.push('                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: elitBackgroundAlignment(backgroundPosition))');
        helpers.push('        case "none", "scale-down":');
        helpers.push('            image');
        helpers.push('                .resizable()');
        helpers.push('                .scaledToFit()');
        helpers.push('                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: elitBackgroundAlignment(backgroundPosition))');
        helpers.push('        default:');
        helpers.push('            image');
        helpers.push('                .resizable()');
        helpers.push('                .scaledToFill()');
        helpers.push('                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: elitBackgroundAlignment(backgroundPosition))');
        helpers.push('        }');
        helpers.push('    }');
        helpers.push('}');
        helpers.push('');
        helpers.push('@ViewBuilder');
        helpers.push('private func elitBackgroundImageSurface(source: String, backgroundSize: String = "cover", backgroundPosition: String = "center", backgroundRepeat: String = "no-repeat") -> some View {');
        helpers.push('    if let backgroundURL = elitResolvedMediaURL(source) {');
        helpers.push('        AsyncImage(url: backgroundURL) { phase in');
        helpers.push('            switch phase {');
        helpers.push('            case .success(let image):');
        helpers.push('                elitBackgroundImage(image, backgroundSize: backgroundSize, backgroundPosition: backgroundPosition, backgroundRepeat: backgroundRepeat)');
        helpers.push('            default:');
        helpers.push('                Color.clear');
        helpers.push('            }');
        helpers.push('        }');
        helpers.push('        .clipped()');
        helpers.push('    } else {');
        helpers.push('        Color.clear');
        helpers.push('    }');
        helpers.push('}');
    }

    if (context.helperFlags.has('unsupportedPlaceholder')) {
        helpers.push('');
        helpers.push('@ViewBuilder');
        helpers.push('private func elitUnsupportedPlaceholder(label: String, sourceTag: String) -> some View {');
        helpers.push('    Text("\\(label) placeholder for <\\(sourceTag)>")');
        helpers.push('}');
    }

    if (context.helperFlags.has('webViewSurface') || context.helperFlags.has('mediaSurface') || context.helperFlags.has('backgroundImage')) {
        helpers.push('');
        helpers.push('private func elitResolvedMediaURL(_ source: String) -> URL? {');
        helpers.push('    if let url = URL(string: source), let scheme = url.scheme, !scheme.isEmpty {');
        helpers.push('        return url');
        helpers.push('    }');
        helpers.push('    return URL(fileURLWithPath: source)');
        helpers.push('}');
    }

    if (context.helperFlags.has('webViewSurface')) {
        helpers.push('');
        helpers.push('struct ElitWebViewSurface: UIViewRepresentable {');
        helpers.push('    let source: String');
        helpers.push('    let label: String');
        helpers.push('');
        helpers.push('    func makeUIView(context: Context) -> WKWebView {');
        helpers.push('        let webView = WKWebView(frame: .zero)');
        helpers.push('        webView.accessibilityLabel = label');
        helpers.push('        updateUIView(webView, context: context)');
        helpers.push('        return webView');
        helpers.push('    }');
        helpers.push('');
        helpers.push('    func updateUIView(_ webView: WKWebView, context: Context) {');
        helpers.push('        webView.accessibilityLabel = label');
        helpers.push('        if let url = URL(string: source), let scheme = url.scheme, !scheme.isEmpty {');
        helpers.push('            webView.load(URLRequest(url: url))');
        helpers.push('        } else {');
        helpers.push('            webView.loadHTMLString(source, baseURL: nil)');
        helpers.push('        }');
        helpers.push('    }');
        helpers.push('}');
    }

    if (context.helperFlags.has('mediaSurface')) {
        helpers.push('');
        helpers.push('private func elitPosterAlignment(_ posterPosition: String) -> Alignment {');
        helpers.push('    switch posterPosition.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {');
        helpers.push('    case "top":');
        helpers.push('        return .top');
        helpers.push('    case "bottom":');
        helpers.push('        return .bottom');
        helpers.push('    case "leading":');
        helpers.push('        return .leading');
        helpers.push('    case "trailing":');
        helpers.push('        return .trailing');
        helpers.push('    case "top-leading":');
        helpers.push('        return .topLeading');
        helpers.push('    case "top-trailing":');
        helpers.push('        return .topTrailing');
        helpers.push('    case "bottom-leading":');
        helpers.push('        return .bottomLeading');
        helpers.push('    case "bottom-trailing":');
        helpers.push('        return .bottomTrailing');
        helpers.push('    default:');
        helpers.push('        return .center');
        helpers.push('    }');
        helpers.push('}');
        helpers.push('');
        helpers.push('@ViewBuilder');
        helpers.push('private func elitPosterImage(_ image: Image, posterFit: String, posterPosition: String) -> some View {');
        helpers.push('    switch posterFit.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {');
        helpers.push('    case "contain":');
        helpers.push('        image');
        helpers.push('            .resizable()');
        helpers.push('            .scaledToFit()');
        helpers.push('            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: elitPosterAlignment(posterPosition))');
        helpers.push('    case "fill":');
        helpers.push('        image');
        helpers.push('            .resizable()');
        helpers.push('            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: elitPosterAlignment(posterPosition))');
        helpers.push('    case "none", "scale-down":');
        helpers.push('        image');
        helpers.push('            .resizable()');
        helpers.push('            .scaledToFit()');
        helpers.push('            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: elitPosterAlignment(posterPosition))');
        helpers.push('    default:');
        helpers.push('        image');
        helpers.push('            .resizable()');
        helpers.push('            .scaledToFill()');
        helpers.push('            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: elitPosterAlignment(posterPosition))');
        helpers.push('    }');
        helpers.push('}');
        helpers.push('');
        helpers.push('struct ElitVideoSurface: View {');
        helpers.push('    let source: String');
        helpers.push('    let label: String');
        helpers.push('    let autoPlay: Bool');
        helpers.push('    let muted: Bool');
        helpers.push('    let controls: Bool');
        helpers.push('    let poster: String?');
        helpers.push('    let playsInline: Bool');
        helpers.push('    let posterFit: String = "cover"');
        helpers.push('    let posterPosition: String = "center"');
        helpers.push('');
        helpers.push('    @State private var player: AVPlayer?');
        helpers.push('    @State private var isPosterVisible = true');
        helpers.push('');
        helpers.push('    var body: some View {');
        helpers.push('        ZStack {');
        helpers.push('            ElitVideoPlayerController(player: player, label: label, controls: controls, playsInline: playsInline)');
        helpers.push('            if isPosterVisible, let poster, let posterURL = elitResolvedMediaURL(poster) {');
        helpers.push('                AsyncImage(url: posterURL) { phase in');
        helpers.push('                    switch phase {');
        helpers.push('                    case .success(let image):');
        helpers.push('                        elitPosterImage(image, posterFit: posterFit, posterPosition: posterPosition)');
        helpers.push('                    default:');
        helpers.push('                        Color.clear');
        helpers.push('                    }');
        helpers.push('                }');
        helpers.push('                .allowsHitTesting(false)');
        helpers.push('                .clipped()');
        helpers.push('            }');
        helpers.push('        }');
        helpers.push('            .accessibilityLabel(label)');
        helpers.push('            .onAppear {');
        helpers.push('                if player == nil, let url = elitResolvedMediaURL(source) {');
        helpers.push('                    let resolvedPlayer = AVPlayer(url: url)');
        helpers.push('                    resolvedPlayer.isMuted = muted');
        helpers.push('                    player = resolvedPlayer');
        helpers.push('                    isPosterVisible = !autoPlay');
        helpers.push('                    if autoPlay {');
        helpers.push('                        resolvedPlayer.play()');
        helpers.push('                        isPosterVisible = false');
        helpers.push('                    }');
        helpers.push('                }');
        helpers.push('            }');
        helpers.push('            .onTapGesture {');
        helpers.push('                guard !controls, let player else { return }');
        helpers.push('                player.play()');
        helpers.push('                isPosterVisible = false');
        helpers.push('            }');
        helpers.push('            .onDisappear {');
        helpers.push('                player?.pause()');
        helpers.push('            }');
        helpers.push('    }');
        helpers.push('}');
        helpers.push('');
        helpers.push('struct ElitVideoPlayerController: UIViewControllerRepresentable {');
        helpers.push('    let player: AVPlayer?');
        helpers.push('    let label: String');
        helpers.push('    let controls: Bool');
        helpers.push('    let playsInline: Bool');
        helpers.push('');
        helpers.push('    func makeUIViewController(context: Context) -> AVPlayerViewController {');
        helpers.push('        let controller = AVPlayerViewController()');
        helpers.push('        controller.player = player');
        helpers.push('        controller.showsPlaybackControls = controls');
        helpers.push('        controller.entersFullScreenWhenPlaybackBegins = !playsInline');
        helpers.push('        controller.exitsFullScreenWhenPlaybackEnds = !playsInline');
        helpers.push('        controller.view.accessibilityLabel = label');
        helpers.push('        return controller');
        helpers.push('    }');
        helpers.push('');
        helpers.push('    func updateUIViewController(_ controller: AVPlayerViewController, context: Context) {');
        helpers.push('        controller.player = player');
        helpers.push('        controller.showsPlaybackControls = controls');
        helpers.push('        controller.entersFullScreenWhenPlaybackBegins = !playsInline');
        helpers.push('        controller.exitsFullScreenWhenPlaybackEnds = !playsInline');
        helpers.push('        controller.view.accessibilityLabel = label');
        helpers.push('    }');
        helpers.push('}');
        helpers.push('');
        helpers.push('struct ElitAudioSurface: View {');
        helpers.push('    let source: String');
        helpers.push('    let label: String');
        helpers.push('    let autoPlay: Bool');
        helpers.push('    let muted: Bool');
        helpers.push('');
        helpers.push('    @State private var player: AVPlayer?');
        helpers.push('    @State private var isPlaying = false');
        helpers.push('');
        helpers.push('    var body: some View {');
        helpers.push('        Button(action: {');
        helpers.push('            guard let player else { return }');
        helpers.push('            if isPlaying {');
        helpers.push('                player.pause()');
        helpers.push('                isPlaying = false');
        helpers.push('            } else {');
        helpers.push('                player.play()');
        helpers.push('                isPlaying = true');
        helpers.push('            }');
        helpers.push('        }) {');
        helpers.push('            Text(isPlaying ? "Pause \(label)" : "Play \(label)")');
        helpers.push('        }');
        helpers.push('        .accessibilityLabel(label)');
        helpers.push('        .onAppear {');
        helpers.push('            if player == nil, let url = elitResolvedMediaURL(source) {');
        helpers.push('                let resolvedPlayer = AVPlayer(url: url)');
        helpers.push('                resolvedPlayer.isMuted = muted');
        helpers.push('                player = resolvedPlayer');
        helpers.push('                if autoPlay {');
        helpers.push('                    resolvedPlayer.play()');
        helpers.push('                    isPlaying = true');
        helpers.push('                }');
        helpers.push('            }');
        helpers.push('        }');
        helpers.push('        .onDisappear {');
        helpers.push('            player?.pause()');
        helpers.push('            isPlaying = false');
        helpers.push('        }');
        helpers.push('    }');
        helpers.push('}');
    }

    return helpers;
}

export function renderAndroidCompose(input: Child | NativeTree, options: AndroidComposeOptions = {}): string {
    const tree = isNativeTree(input)
        ? input
        : renderNativeTree(input, { platform: 'android' });

    const resolvedOptions = {
        packageName: options.packageName ?? 'com.elit.generated',
        functionName: options.functionName ?? 'ElitScreen',
        includePackage: options.includePackage ?? true,
        includeImports: options.includeImports ?? true,
        includePreview: options.includePreview ?? false,
    };

    const styleResolveOptions = getNativeStyleResolveOptions('android');
    const styleData = buildRootResolvedStyleData(tree.roots, styleResolveOptions);

    const context: AndroidComposeContext = {
        textFieldIndex: 0,
        sliderIndex: 0,
        toggleIndex: 0,
        pickerIndex: 0,
        interactionIndex: 0,
        stateDeclarations: [],
        stateDescriptors: createNativeStateDescriptorMap(tree),
        declaredStateIds: new Set(),
        helperFlags: new Set(),
        styleResolveOptions,
        resolvedStyles: styleData.resolvedStyles,
        styleContexts: styleData.styleContexts,
    };

    const bodyLines = tree.roots.length === 1
        ? renderComposeNode(tree.roots[0], 1, context, { availableWidth: styleResolveOptions.viewportWidth, availableHeight: styleResolveOptions.viewportHeight })
        : [
            '    Column(modifier = Modifier.fillMaxSize()) {',
            ...renderComposeChildren(tree.roots, 2, context, 'Column', undefined, { availableWidth: styleResolveOptions.viewportWidth, availableHeight: styleResolveOptions.viewportHeight }),
            '    }',
        ];

    const lines: string[] = [];

    if (resolvedOptions.includePackage) {
        lines.push(`package ${resolvedOptions.packageName}`);
        lines.push('');
    }

    if (resolvedOptions.includeImports) {
        lines.push('import androidx.compose.foundation.layout.*');
        lines.push('import androidx.compose.foundation.background');
        lines.push('import androidx.compose.foundation.border');
        lines.push('import androidx.compose.foundation.clickable');
        if (context.helperFlags.has('interactivePressState')) {
            lines.push('import androidx.compose.foundation.LocalIndication');
            lines.push('import androidx.compose.foundation.interaction.MutableInteractionSource');
            lines.push('import androidx.compose.foundation.interaction.collectIsPressedAsState');
        }
        lines.push('import androidx.compose.foundation.rememberScrollState');
        lines.push('import androidx.compose.foundation.text.BasicTextField');
        lines.push('import androidx.compose.foundation.verticalScroll');
        lines.push('import androidx.compose.ui.focus.focusRequester');
        lines.push('import androidx.compose.ui.draw.alpha');
        lines.push('import androidx.compose.ui.draw.clip');
        lines.push('import androidx.compose.ui.draw.drawBehind');
        lines.push('import androidx.compose.ui.draw.shadow');
        lines.push('import androidx.compose.ui.graphics.graphicsLayer');
        lines.push('import androidx.compose.material3.*');
        lines.push('import androidx.compose.runtime.*');
        lines.push('import androidx.compose.foundation.shape.RoundedCornerShape');
        lines.push('import androidx.compose.ui.Alignment');
        lines.push('import androidx.compose.ui.Modifier');
        lines.push('import androidx.compose.ui.graphics.Brush');
        lines.push('import androidx.compose.ui.graphics.Color');
        lines.push('import androidx.compose.ui.graphics.RectangleShape');
        lines.push('import androidx.compose.ui.graphics.SolidColor');
        lines.push('import androidx.compose.ui.semantics.Role');
        lines.push('import androidx.compose.ui.semantics.contentDescription');
        lines.push('import androidx.compose.ui.semantics.disabled');
        lines.push('import androidx.compose.ui.semantics.heading');
        lines.push('import androidx.compose.ui.semantics.role');
        lines.push('import androidx.compose.ui.semantics.selected');
        lines.push('import androidx.compose.ui.semantics.semantics');
        lines.push('import androidx.compose.ui.semantics.stateDescription');
        if (context.helperFlags.has('downloadHandler')) {
            lines.push('import androidx.compose.ui.platform.LocalContext');
        }
        if (context.helperFlags.has('uriHandler')) {
            lines.push('import androidx.compose.ui.platform.LocalUriHandler');
        }
        lines.push('import androidx.compose.ui.text.font.FontFamily');
        lines.push('import androidx.compose.ui.text.font.FontWeight');
        lines.push('import androidx.compose.ui.text.style.TextDecoration');
        lines.push('import androidx.compose.ui.text.style.TextAlign');
        lines.push('import androidx.compose.ui.tooling.preview.Preview');
        lines.push('import androidx.compose.ui.zIndex');
        lines.push('import androidx.compose.ui.unit.dp');
        lines.push('import androidx.compose.ui.unit.sp');
        lines.push('');
    }

    lines.push('@Composable');
    lines.push(`fun ${resolvedOptions.functionName}() {`);
    if (context.helperFlags.has('uriHandler')) {
        lines.push(`${indent(1)}val uriHandler = LocalUriHandler.current`);
    }
    if (context.helperFlags.has('downloadHandler')) {
        lines.push(`${indent(1)}val localContext = LocalContext.current`);
    }
    if ((context.helperFlags.has('uriHandler') || context.helperFlags.has('downloadHandler')) && context.stateDeclarations.length > 0) {
        lines.push('');
    }
    if (context.stateDeclarations.length > 0) {
        lines.push(...context.stateDeclarations);
        lines.push('');
    }
    lines.push(...bodyLines);
    lines.push('}');

    if (resolvedOptions.includePreview) {
        lines.push('');
        lines.push('@Preview(showBackground = true)');
        lines.push('@Composable');
        lines.push(`private fun ${resolvedOptions.functionName}Preview() {`);
        lines.push(`    ${resolvedOptions.functionName}()`);
        lines.push('}');
    }

    lines.push(...buildAndroidComposeHelpers(context));
    lines.push('');

    return lines.join('\n');
}

export function renderSwiftUI(input: Child | NativeTree, options: SwiftUIOptions = {}): string {
    const tree = isNativeTree(input)
        ? input
        : renderNativeTree(input, { platform: 'ios' });

    const resolvedOptions = {
        structName: options.structName ?? 'ElitScreen',
        includeImports: options.includeImports ?? true,
        includePreview: options.includePreview ?? false,
    };

    const styleResolveOptions = getNativeStyleResolveOptions('ios');
    const styleData = buildRootResolvedStyleData(tree.roots, styleResolveOptions);

    const context: SwiftUIContext = {
        textFieldIndex: 0,
        sliderIndex: 0,
        toggleIndex: 0,
        pickerIndex: 0,
        interactionIndex: 0,
        stateDeclarations: [],
        stateDescriptors: createNativeStateDescriptorMap(tree),
        declaredStateIds: new Set(),
        helperFlags: new Set(),
        styleResolveOptions,
        resolvedStyles: styleData.resolvedStyles,
        styleContexts: styleData.styleContexts,
    };

    const bodyLines = tree.roots.length === 1
        ? renderSwiftUINode(tree.roots[0], 2, context, { availableWidth: styleResolveOptions.viewportWidth, availableHeight: styleResolveOptions.viewportHeight })
        : [
            `${indent(2)}VStack(alignment: .leading, spacing: 12) {`,
            ...renderSwiftUIChildren(tree.roots, 3, context, 'VStack', undefined, { availableWidth: styleResolveOptions.viewportWidth, availableHeight: styleResolveOptions.viewportHeight }),
            `${indent(2)}}`,
        ];

    const lines: string[] = [];
    if (resolvedOptions.includeImports) {
        if (context.helperFlags.has('openUrlHandler') || context.helperFlags.has('downloadHandler') || context.helperFlags.has('webViewSurface') || context.helperFlags.has('mediaSurface') || context.helperFlags.has('backgroundImage')) {
            lines.push('import Foundation');
        }
        if (context.helperFlags.has('webViewSurface')) {
            lines.push('import WebKit');
        }
        if (context.helperFlags.has('mediaSurface')) {
            lines.push('import AVKit');
        }
        lines.push('import SwiftUI');
        lines.push('');
    }

    lines.push(`struct ${resolvedOptions.structName}: View {`);
    if (context.helperFlags.has('openUrlHandler')) {
        lines.push(`${indent(1)}@Environment(\\.openURL) private var openURL`);
        if (context.stateDeclarations.length > 0) {
            lines.push('');
        }
    }
    if (context.stateDeclarations.length > 0) {
        lines.push(...context.stateDeclarations);
        lines.push('');
    }
    lines.push(`${indent(1)}var body: some View {`);
    lines.push(...bodyLines);
    lines.push(`${indent(1)}}`);
    lines.push('}');

    if (resolvedOptions.includePreview) {
        lines.push('');
        lines.push('#Preview {');
        lines.push(`${indent(1)}${resolvedOptions.structName}()`);
        lines.push('}');
    }

    lines.push(...buildSwiftUIHelpers(context));
    lines.push('');
    return lines.join('\n');
}
