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

type NativeHelperFlag = 'imagePlaceholder' | 'unsupportedPlaceholder' | 'uriHandler' | 'openUrlHandler' | 'bridge';
type NativeResolvedStyleMap = WeakMap<NativeElementNode, Record<string, NativePropValue>>;

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
    weights?: number[];
}

interface NativeChunkedLayout {
    kind: 'grid' | 'wrap';
    rows: NativeChunkedRow[];
    rowGap?: number;
    columnGap?: number;
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

type NativeStateValueType = 'string' | 'number' | 'boolean';

interface NativeStateDescriptor {
    id: string;
    type: NativeStateValueType;
    initialValue: string | number | boolean;
}

interface NativeBindingReference extends NativePropObject {
    id: string;
    kind: 'value' | 'checked';
    valueType: NativeStateValueType;
}

interface NativeTransformContext {
    nextStateIndex: number;
    stateIds: WeakMap<object, string>;
    stateDescriptors: Map<string, NativeStateDescriptor>;
}

interface AndroidComposeContext {
    textFieldIndex: number;
    toggleIndex: number;
    stateDeclarations: string[];
    declaredStateIds: Set<string>;
    helperFlags: Set<NativeHelperFlag>;
    resolvedStyles: NativeResolvedStyleMap;
    styleResolveOptions: NativeStyleResolveOptions;
    stateDescriptors: Map<string, NativeStateDescriptor>;
}

interface SwiftUIContext {
    textFieldIndex: number;
    toggleIndex: number;
    stateDeclarations: string[];
    declaredStateIds: Set<string>;
    helperFlags: Set<NativeHelperFlag>;
    resolvedStyles: NativeResolvedStyleMap;
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
    style?: NativeBorderStyleKeyword;
    top?: NativeBorderSideValue;
    right?: NativeBorderSideValue;
    bottom?: NativeBorderSideValue;
    left?: NativeBorderSideValue;
    style?: NativeBorderStyleKeyword;
}

const DEFAULT_COMPONENT_MAP: Record<string, string> = {
    html: 'Screen',
    body: 'Screen',
    main: 'Screen',
    header: 'View',
    footer: 'View',
    nav: 'View',
    article: 'View',
    aside: 'View',
    div: 'View',
    figure: 'View',
    figcaption: 'Text',
    details: 'View',
    dialog: 'View',
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
    strong: 'Text',
    em: 'Text',
    b: 'Text',
    i: 'Text',
    small: 'Text',
    code: 'Text',
    mark: 'Text',
    q: 'Text',
    cite: 'Text',
    time: 'Text',
    sub: 'Text',
    sup: 'Text',
    abbr: 'Text',
    dfn: 'Text',
    kbd: 'Text',
    samp: 'Text',
    blockquote: 'Text',
    pre: 'Text',
    button: 'Button',
    a: 'Link',
    input: 'TextInput',
    textarea: 'TextInput',
    select: 'Picker',
    option: 'Option',
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
const FILL_WIDTH_EXCLUDED_COMPONENTS = new Set(['Text', 'Button', 'Link', 'Toggle', 'TextInput', 'Image', 'Media', 'WebView', 'Canvas', 'Vector']);

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
    if (typeof value === 'boolean') {
        return 'boolean';
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return 'number';
    }

    return 'string';
}

function coerceNativeStateInitialValue(value: unknown, type: NativeStateValueType): string | number | boolean {
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
    if (tagName.startsWith('svg')) return 'Vector';
    return options.preserveUnknownTags ? tagName : 'View';
}

function isCheckboxInput(sourceTag: string, props: Record<string, NativePropValue>): boolean {
    return sourceTag === 'input' && props.type === 'checkbox';
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

    const component = resolveComponent(child.tagName, options);
    const childNodes: NativeNode[] = [];
    for (const item of child.children) {
        childNodes.push(...toNativeNodes(item, options, component, stateContext));
    }

    const { props, events } = normalizeProps(component, child.props, stateContext);
    const resolvedComponent = isCheckboxInput(child.tagName, props) ? 'Toggle' : component;

    if (resolvedComponent === 'Toggle') {
        delete props.type;
    }

    return [{
        kind: 'element',
        component: resolvedComponent,
        sourceTag: child.tagName,
        props,
        events,
        children: childNodes,
    }];
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
    if (!/^-?(?:\d+|\d*\.\d+)$/.test(trimmed)) {
        return undefined;
    }

    const parsed = Number(trimmed);
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

    const ratioMatch = value.trim().match(/^(-?(?:\d+|\d*\.\d+))\s*\/\s*(-?(?:\d+|\d*\.\d+))$/);
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

    const match = value.trim().match(/^(-?(?:\d+|\d*\.\d+))%$/);
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
    const functionMatch = trimmed.match(/^([a-z]+)\((.*)\)$/i);
    if (!functionMatch) {
        return undefined;
    }

    const functionName = functionMatch[1].toLowerCase();
    const innerValue = functionMatch[2].trim();

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

function buildRootResolvedStyleMap(nodes: NativeNode[], options: NativeStyleResolveOptions): NativeResolvedStyleMap {
    const scopeSnapshots = buildNativeStyleScopeSnapshots(nodes);
    return buildResolvedStyleMap(
        nodes,
        options,
        [],
        new WeakMap<NativeElementNode, Record<string, NativePropValue>>(),
        buildGlobalInheritedTextStyles(options),
        scopeSnapshots,
    );
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

    if (toNativeBoolean(node.props.checked)) {
        pseudoStates.add('checked');
    }

    if (toNativeBoolean(node.props.disabled)) {
        pseudoStates.add('disabled');
    }

    if (toNativeBoolean(node.props.selected) || typeof node.props['aria-current'] === 'string') {
        pseudoStates.add('selected');
    }

    if (
        node.component === 'TextInput' && (
            toNativeBoolean(node.props.autoFocus)
            || toNativeBoolean(node.props.autofocus)
            || toNativeBoolean(node.props.focused)
            || toNativeBoolean(node.props['aria-focused'])
        )
    ) {
        pseudoStates.add('focus');
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
    const valueType = binding.valueType === 'boolean' || binding.valueType === 'number' || binding.valueType === 'string'
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

function formatComposeStateInitialValue(descriptor: NativeStateDescriptor): string {
    if (descriptor.type === 'string') {
        return quoteKotlinString(String(descriptor.initialValue));
    }

    return String(descriptor.initialValue);
}

function formatSwiftStateInitialValue(descriptor: NativeStateDescriptor): string {
    if (descriptor.type === 'string') {
        return quoteSwiftString(String(descriptor.initialValue));
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
        context.stateDeclarations.push(`${indent(1)}@State private var ${variableName} = ${formatSwiftStateInitialValue(descriptor)}`);
    }

    return { descriptor, variableName };
}

function toComposeTextValueExpression(variableName: string, descriptor: NativeStateDescriptor): string {
    return descriptor.type === 'string' ? variableName : `${variableName}.toString()`;
}

function toSwiftTextValueExpression(variableName: string, descriptor: NativeStateDescriptor): string {
    return descriptor.type === 'string' ? variableName : `String(${variableName})`;
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

function splitCssTrackList(value: string): string[] {
    const tracks: string[] = [];
    let token = '';
    let depth = 0;

    for (const char of value.trim()) {
        if (char === '(') {
            depth += 1;
        } else if (char === ')' && depth > 0) {
            depth -= 1;
        }

        if (/\s/.test(char) && depth === 0) {
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

function expandRepeatTrackList(value: string): string[] | undefined {
    const repeatMatch = value.trim().match(/^repeat\(\s*(\d+)\s*,\s*(.+)\)$/i);
    if (!repeatMatch) {
        return undefined;
    }

    const count = Number(repeatMatch[1]);
    if (!Number.isFinite(count) || count <= 0) {
        return undefined;
    }

    const innerTracks = splitCssTrackList(repeatMatch[2]);
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

    const minmaxMatch = track.trim().match(/^minmax\(\s*[^,]+\s*,\s*(-?\d+(?:\.\d+)?)fr\s*\)$/i);
    return minmaxMatch ? Number(minmaxMatch[1]) : undefined;
}

function resolveGridTrackWeights(
    value: NativePropValue | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
    columnGap: number,
): number[] | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    const viewportWidth = styleResolveOptions.viewportWidth ?? 390;
    const autoRepeatMatch = trimmed.match(/^repeat\(\s*auto-(?:fit|fill)\s*,\s*minmax\(\s*([^,]+)\s*,\s*([^)]+)\)\s*\)$/i);
    if (autoRepeatMatch) {
        const minWidth = toScaledUnitNumber(autoRepeatMatch[1].trim(), styleResolveOptions);
        if (minWidth === undefined || minWidth <= 0) {
            return undefined;
        }

        const columnCount = Math.max(1, Math.floor((viewportWidth + columnGap) / (minWidth + columnGap)));
        return Array.from({ length: columnCount }, () => 1);
    }

    const tracks = expandRepeatTrackList(trimmed) ?? splitCssTrackList(trimmed);
    if (tracks.length === 0) {
        return undefined;
    }

    return tracks.map((track) => parseFractionTrackWeight(track) ?? 1);
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

function chunkNodesIntoGridRows(nodes: NativeNode[], weights: number[]): NativeChunkedRow[] {
    const columnCount = Math.max(1, weights.length);
    const rows: NativeChunkedRow[] = [];

    for (let index = 0; index < nodes.length; index += columnCount) {
        const items = nodes.slice(index, index + columnCount);
        rows.push({
            items,
            weights: weights.slice(0, items.length),
        });
    }

    return rows;
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
    if (node.children.length < 2) {
        return undefined;
    }

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
        const weights = resolveGridTrackWeights(style.gridTemplateColumns, styleResolveOptions, columnGap);
        if (weights && weights.length > 1) {
            return {
                kind: 'grid',
                rows: chunkNodesIntoGridRows(orderedChildren, weights),
                rowGap,
                columnGap,
            };
        }
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
    return resolveBackgroundGradient(style) !== undefined
        || resolveBackgroundColor(style, styleResolveOptions) !== undefined
        || resolveBackdropBlurRadius(style, styleResolveOptions) !== undefined
        || resolveNativeBorder(style, (value) => toDpLiteral(value, styleResolveOptions)) !== undefined
        || parseBoxShadow(style.boxShadow, resolveStyleCurrentColor(style)) !== undefined;
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
    const directMatch = trimmed.match(/^((?:rgba?|hsla?|hwb)\([^\)]+\)|#[0-9a-fA-F]{3,8}|currentcolor)$/i);
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

    const embeddedMatch = trimmed.match(/((?:rgba?|hsla?|hwb)\([^\)]+\)|#[0-9a-fA-F]{3,8}|currentcolor)/i);
    if (embeddedMatch) {
        return embeddedMatch[1];
    }

    const functionNameMatch = trimmed.match(/([a-z-]+)\(/i);
    if (functionNameMatch) {
        const functionName = functionNameMatch[1].toLowerCase();
        if (functionName !== 'rgb' && functionName !== 'rgba' && functionName !== 'hsl' && functionName !== 'hsla' && functionName !== 'hwb') {
            return undefined;
        }
    }

    return trimmed
        .toLowerCase()
        .split(/[^a-z-]+/)
        .find((token) => token.length > 0 && (token === CURRENT_COLOR_KEYWORD || Boolean(CSS_NAMED_COLORS[token])));
}

function parseCssHue(value: string): number | undefined {
    const match = value.trim().toLowerCase().match(/^(-?(?:\d+|\d*\.\d+))(deg|grad|rad|turn)?$/);
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
    const match = value.trim().match(/^(-?(?:\d+|\d*\.\d+))%$/);
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

    const hslMatch = token.match(/^hsla?\(([^\)]+)\)$/i);
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

    const hwbMatch = token.match(/^hwb\(([^\)]+)\)$/i);
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

    const rgbMatch = token.match(/^rgba?\(([^\)]+)\)$/i);
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
    const gradientMatch = trimmed.match(/^linear-gradient\((.*)\)$/i);
    if (!gradientMatch) {
        return undefined;
    }

    const segments = splitCssFunctionArguments(gradientMatch[1]).map((segment) => segment.trim()).filter(Boolean);
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

function parseBoxShadow(value: NativePropValue | undefined, currentColor: NativeColorValue = getDefaultCurrentColor()): NativeShadowValue | undefined {
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

    if ([offsetX, offsetY, blur].some((entry) => Number.isNaN(entry))) {
        return undefined;
    }

    return { offsetX, offsetY, blur, color };
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

    const match = value.match(/blur\(\s*([^()]+?)\s*\)/i);
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

    const match = trimmed.match(/^(-?(?:\d+|\d*\.\d+))deg$/);
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
    const pattern = /([a-z-]+)\(([^()]*)\)/gi;
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
    const background = typeof style.background === 'string' && /^linear-gradient\(/i.test(style.background.trim())
        ? undefined
        : parseCssColor(style.background, currentColor);
    const resolved = parseCssColor(style.backgroundColor, currentColor) ?? background;
    const backdropBlur = resolved ? resolveBackdropBlurRadius(style, styleResolveOptions) : undefined;

    if (!resolved || backdropBlur === undefined || resolved.alpha >= 1) {
        return resolved;
    }

    return liftColorAlpha(resolved, Math.min(0.14, backdropBlur / 160));
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
): string | undefined {
    if (!style) return undefined;

    const justify = typeof style.justifyContent === 'string' ? style.justifyContent.trim().toLowerCase() : undefined;
    const gap = toDpLiteral(style.gap ?? (layout === 'Row' ? style.columnGap : style.rowGap) ?? style.gap, styleResolveOptions);

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

function prependComposeModifierCall(modifier: string, call: string): string {
    return modifier === 'Modifier'
        ? `Modifier.${call}`
        : modifier.replace(/^Modifier/, `Modifier.${call}`);
}

function buildComposeButtonModifier(
    modifier: string,
    onClickExpression?: string,
): string {
    if (!onClickExpression) {
        return modifier;
    }

    return prependComposeModifierCall(modifier, `clickable { ${onClickExpression} }`);
}

function buildComposeTextInputArgs(
    node: NativeElementNode,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string[] {
    const args: string[] = [];
    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
    if (!style) {
        return args;
    }

    const textStyle = buildComposeTextStyleLiteral(node, resolvedStyles, styleResolveOptions);
    if (textStyle) {
        args.push(`textStyle = ${textStyle}`);
    }

    const color = parseCssColor(style.color);
    if (color) {
        args.push(`cursorBrush = SolidColor(${toComposeColorLiteral(color)})`);
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
): string {
    const parts = ['Modifier'];
    if (node.component === 'Screen') {
        parts.push('fillMaxSize()');
        parts.push('verticalScroll(rememberScrollState())');
    }

    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
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
        const shadow = parseBoxShadow(style.boxShadow, resolveStyleCurrentColor(style));
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

        if (shadow) {
            parts.push(`shadow(elevation = ${toComposeShadowElevation(shadow)}, shape = RoundedCornerShape(${radius ?? '0.dp'}))`);
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
    const parentRowBaselineAlignment = parentFlexLayout === 'Row'
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
            ...(parentFlexLayout ? { parentFlexLayout } : {}),
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
): string {
    const args = [`modifier = ${modifier}`];
    if (columnGap !== undefined) {
        args.push(`horizontalArrangement = Arrangement.spacedBy(${formatFloat(columnGap)}.dp)`);
    }

    const alignment = buildComposeCrossAlignment('Row', style);
    if (alignment) {
        args.push(`verticalAlignment = ${alignment}`);
    }

    return args.join(', ');
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
    const outerGap = layout.rowGap !== undefined ? `Arrangement.spacedBy(${formatFloat(layout.rowGap)}.dp)` : undefined;

    if (layout.kind === 'grid' && layout.rows.length === 1) {
        const [row] = layout.rows;
        const lines = [`${indent(level)}Row(${buildComposeChunkedRowArguments(style, modifier, layout.columnGap)}) {`];
        const totalWeight = row.weights ? row.weights.reduce((sum, entry) => sum + entry, 0) : undefined;
        row.items.forEach((child, index) => {
            const weight = row.weights?.[index];
            const cellModifier = weight !== undefined
                ? `Modifier.weight(${formatFloat(weight)}f).fillMaxWidth()`
                : 'Modifier';
            const cellAvailableWidth = weight !== undefined && totalWeight && hints.availableWidth !== undefined
                ? Math.max(0, (hints.availableWidth - ((layout.columnGap ?? 0) * Math.max(0, row.items.length - 1))) * (weight / totalWeight))
                : hints.availableWidth;
            lines.push(`${indent(level + 1)}Box(modifier = ${cellModifier}) {`);
            lines.push(...renderComposeNode(child, level + 2, context, { fillWidth: shouldFillChunkedCellChild(child), availableWidth: cellAvailableWidth, availableHeight: hints.availableHeight }));
            lines.push(`${indent(level + 1)}}`);
        });
        lines.push(`${indent(level)}}`);
        return lines;
    }

    const lines = [`${indent(level)}Column(modifier = ${modifier}${outerGap ? `, verticalArrangement = ${outerGap}` : ''}) {`];
    for (const row of layout.rows) {
        const totalWeight = row.weights ? row.weights.reduce((sum, entry) => sum + entry, 0) : undefined;
        lines.push(`${indent(level + 1)}Row(${buildComposeChunkedRowArguments(style, 'Modifier.fillMaxWidth()', layout.columnGap)}) {`);
        row.items.forEach((child, index) => {
            const weight = row.weights?.[index];
            const fillChild = layout.kind === 'grid' && shouldFillChunkedCellChild(child);
            const cellModifier = weight !== undefined
                ? `Modifier.weight(${formatFloat(weight)}f)${fillChild ? '.fillMaxWidth()' : ''}`
                : 'Modifier';
            const cellAvailableWidth = weight !== undefined && totalWeight && hints.availableWidth !== undefined
                ? Math.max(0, (hints.availableWidth - ((layout.columnGap ?? 0) * Math.max(0, row.items.length - 1))) * (weight / totalWeight))
                : hints.availableWidth;
            lines.push(`${indent(level + 2)}Box(modifier = ${cellModifier}) {`);
            lines.push(...renderComposeNode(child, level + 3, context, fillChild ? { fillWidth: true, availableWidth: cellAvailableWidth, availableHeight: hints.availableHeight } : { availableWidth: cellAvailableWidth, availableHeight: hints.availableHeight }));
            lines.push(`${indent(level + 2)}}`);
        });
        lines.push(`${indent(level + 1)}}`);
    }
    lines.push(`${indent(level)}}`);
    return lines;
}

function renderComposeContainerBody(
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

        if (!binding || binding.kind !== 'checked') {
            context.stateDeclarations.push(`${indent(1)}var ${stateName} by remember { mutableStateOf(${toNativeBoolean(node.props.checked) ? 'true' : 'false'}) }`);
        }

        lines.push(`${indent(level)}Checkbox(`);
        lines.push(`${indent(level + 1)}checked = ${stateName},`);
        lines.push(`${indent(level + 1)}onCheckedChange = { ${stateName} = it },`);
        lines.push(`${indent(level + 1)}modifier = ${modifier}`);
        lines.push(`${indent(level)})`);
        return lines;
    }

    if (node.component === 'TextInput') {
        const binding = getNativeBindingReference(node);
        let stateName = `textFieldValue${context.textFieldIndex++}`;
        let valueExpression = stateName;
        let onValueChange = `${stateName} = it`;

        if (binding?.kind === 'value') {
            const { descriptor, variableName } = ensureComposeStateVariable(context, binding.id);
            stateName = variableName;
            valueExpression = toComposeTextValueExpression(variableName, descriptor);
            if (descriptor.type === 'string') {
                onValueChange = `${variableName} = it`;
            } else if (descriptor.type === 'number') {
                onValueChange = `${variableName} = it.toDoubleOrNull() ?: ${variableName}`;
            } else {
                onValueChange = `${variableName} = it.equals(\"true\", ignoreCase = true)`;
            }
        } else {
            const initialValue = typeof node.props.value === 'string' || typeof node.props.value === 'number'
                ? String(node.props.value)
                : '';
            context.stateDeclarations.push(`${indent(1)}var ${stateName} by remember { mutableStateOf(${quoteKotlinString(initialValue)}) }`);
        }

        lines.push(`${indent(level)}BasicTextField(`);
        lines.push(`${indent(level + 1)}value = ${valueExpression},`);
        lines.push(`${indent(level + 1)}onValueChange = { ${onValueChange} },`);
        lines.push(`${indent(level + 1)}modifier = ${modifier},`);

        const textInputArgs = buildComposeTextInputArgs(node, context.resolvedStyles, context.styleResolveOptions);
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

    if (node.component === 'Button') {
        const label = flattenTextContent(node.children) || 'Button';
        const onClickExpression = buildComposeBridgeInvocation(
            resolveNativeAction(node),
            resolveNativeRoute(node),
            serializeNativePayload(node.props.nativePayload),
        );
        const buttonModifier = buildComposeButtonModifier(modifier, onClickExpression);

        if (onClickExpression) {
            context.helperFlags.add('bridge');
        } else {
            if (node.events.length > 0) {
                lines.push(`${indent(level)}// TODO: wire elit event(s): ${node.events.join(', ')}`);
            }
        }
        lines.push(`${indent(level)}Box(modifier = ${buttonModifier}, contentAlignment = Alignment.Center) {`);
        lines.push(`${indent(level + 1)}${buildComposeLabelText(node, label, context.resolvedStyles, buildComposeTextExpression(node.children, context), context.styleResolveOptions)}`);
        lines.push(`${indent(level)}}`);
        return lines;
    }

    if (node.component === 'Link') {
        const label = flattenTextContent(node.children) || String(node.props.destination ?? 'Link');
        const destination = typeof node.props.destination === 'string' ? node.props.destination : undefined;
        let onClickExpression: string | undefined;
        if (destination && isExternalDestination(destination)) {
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
        lines.push(`${indent(level)}Box(modifier = ${buildComposeButtonModifier(modifier, onClickExpression)}, contentAlignment = Alignment.Center) {`);
        lines.push(`${indent(level + 1)}${buildComposeLabelText(node, label, context.resolvedStyles, buildComposeTextExpression(node.children, context), context.styleResolveOptions)}`);
        lines.push(`${indent(level)}}`);
        return lines;
    }

    if (node.component === 'Image') {
        context.helperFlags.add('imagePlaceholder');
        const source = typeof node.props.source === 'string' ? node.props.source : '';
        const alt = typeof node.props.alt === 'string' ? node.props.alt : undefined;
        const fallbackLabel = resolveImageFallbackLabel(source, alt);
        lines.push(`${indent(level)}ElitImagePlaceholder(`);
        lines.push(`${indent(level + 1)}label = ${quoteKotlinString(fallbackLabel)},`);
        lines.push(`${indent(level + 1)}source = ${quoteKotlinString(source)},`);
        lines.push(`${indent(level + 1)}contentDescription = ${alt ? quoteKotlinString(alt) : 'null'},`);
        lines.push(`${indent(level + 1)}modifier = ${modifier}`);
        lines.push(`${indent(level)})`);
        return lines;
    }

    if (node.component === 'Media' || node.component === 'WebView' || node.component === 'Canvas' || node.component === 'Vector') {
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
    }

    if (context.helperFlags.has('unsupportedPlaceholder')) {
        helpers.push('');
        helpers.push('@Composable');
        helpers.push('private fun ElitUnsupported(label: String, sourceTag: String, modifier: Modifier = Modifier) {');
        helpers.push('    Text(text = "${label} placeholder for <${sourceTag}>", modifier = modifier)');
        helpers.push('}');
    }

    return helpers;
}

function buildSwiftUIModifiers(
    node: NativeElementNode,
    resolvedStyles?: NativeResolvedStyleMap,
    hints: NativeRenderHints = {},
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string[] {
    const modifiers: string[] = [];

    if (node.component === 'Screen') {
        modifiers.push('.frame(maxWidth: .infinity, alignment: .topLeading)');
    }

    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
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
        const shadow = parseBoxShadow(style.boxShadow, resolveStyleCurrentColor(style));
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

        if (shadow) {
            modifiers.push(`.shadow(color: ${toSwiftColorLiteral(shadow.color)}, radius: ${toSwiftShadowRadius(shadow)}, x: ${formatFloat(shadow.offsetX)}, y: ${formatFloat(shadow.offsetY)})`);
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

    return modifiers;
}

function buildSwiftUIButtonModifiers(
    node: NativeElementNode,
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string[] {
    const style = getStyleObject(node, resolvedStyles, styleResolveOptions);
    const modifiers = buildSwiftUIModifiers(node, resolvedStyles, {}, styleResolveOptions);
    return style ? ['.buttonStyle(.plain)', ...modifiers] : modifiers;
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
    const spacing = toPointLiteral(style?.gap ?? (layout === 'HStack' ? style?.columnGap : style?.rowGap) ?? style?.gap, styleResolveOptions) ?? '12';

    if (layout === 'HStack') {
        return `HStack(alignment: ${resolveSwiftRowAlignment(style, node.children, resolvedStyles, styleResolveOptions)}, spacing: ${spacing})`;
    }

    return `VStack(alignment: ${resolveSwiftColumnAlignment(style)}, spacing: ${spacing})`;
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

    if (layout.kind === 'grid' && layout.rows.length === 1) {
        const [row] = layout.rows;
        const lines = [`${indent(level)}HStack(alignment: ${rowAlignment}, spacing: ${columnSpacing}) {`];
        const totalWeight = row.weights ? row.weights.reduce((sum, entry) => sum + entry, 0) : undefined;
        row.items.forEach((child, index) => {
            const weight = row.weights?.[index];
            const cellAvailableWidth = weight !== undefined && totalWeight && hints.availableWidth !== undefined
                ? Math.max(0, (hints.availableWidth - ((layout.columnGap ?? 0) * Math.max(0, row.items.length - 1))) * (weight / totalWeight))
                : hints.availableWidth;
            lines.push(`${indent(level + 1)}VStack(alignment: .leading, spacing: 0) {`);
            lines.push(...renderSwiftUINode(child, level + 2, context, { fillWidth: shouldFillChunkedCellChild(child), availableWidth: cellAvailableWidth, availableHeight: hints.availableHeight }));
            lines.push(`${indent(level + 1)}}`);
            lines.push(`${indent(level + 2)}.frame(maxWidth: .infinity, alignment: .leading)`);
            if (row.weights?.[index] !== undefined) {
                lines.push(`${indent(level + 2)}.layoutPriority(${formatFloat(row.weights[index])})`);
            }
        });
        lines.push(`${indent(level)}}`);
        return appendSwiftUIModifiers(lines, buildSwiftUIModifiers(node, context.resolvedStyles, {}, context.styleResolveOptions), level);
    }

    const lines = [`${indent(level)}VStack(alignment: ${columnAlignment}, spacing: ${rowSpacing}) {`];
    for (const row of layout.rows) {
        const totalWeight = row.weights ? row.weights.reduce((sum, entry) => sum + entry, 0) : undefined;
        lines.push(`${indent(level + 1)}HStack(alignment: ${rowAlignment}, spacing: ${columnSpacing}) {`);
        row.items.forEach((child, index) => {
            const fillChild = layout.kind === 'grid' && shouldFillChunkedCellChild(child);
            const weight = row.weights?.[index];
            const cellAvailableWidth = weight !== undefined && totalWeight && hints.availableWidth !== undefined
                ? Math.max(0, (hints.availableWidth - ((layout.columnGap ?? 0) * Math.max(0, row.items.length - 1))) * (weight / totalWeight))
                : hints.availableWidth;
            lines.push(`${indent(level + 2)}VStack(alignment: .leading, spacing: 0) {`);
            lines.push(...renderSwiftUINode(child, level + 3, context, fillChild ? { fillWidth: true, availableWidth: cellAvailableWidth, availableHeight: hints.availableHeight } : { availableWidth: cellAvailableWidth, availableHeight: hints.availableHeight }));
            lines.push(`${indent(level + 2)}}`);
            if (fillChild || row.weights?.[index] !== undefined) {
                lines.push(`${indent(level + 3)}.frame(maxWidth: .infinity, alignment: .leading)`);
            }
            if (row.weights?.[index] !== undefined) {
                lines.push(`${indent(level + 3)}.layoutPriority(${formatFloat(row.weights[index])})`);
            }
        });
        lines.push(`${indent(level + 1)}}`);
    }
    lines.push(`${indent(level)}}`);

    return appendSwiftUIModifiers(lines, buildSwiftUIModifiers(node, context.resolvedStyles, {}, context.styleResolveOptions), level);
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

    return appendSwiftUIModifiers(lines, buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions), level);
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
    const parentRowBaselineAlignment = parentFlexLayout === 'Row'
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
            ...(parentFlexLayout ? { parentFlexLayout } : {}),
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

        if (!binding || binding.kind !== 'checked') {
            context.stateDeclarations.push(`${indent(1)}@State private var ${stateName} = ${toNativeBoolean(node.props.checked) ? 'true' : 'false'}`);
        }

        return appendSwiftUIModifiers(
            [
                ...baseLines,
                `${indent(level)}Toggle("", isOn: $${stateName})`,
            ],
            ['.labelsHidden()', ...buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions)],
            level
        );
    }

    if (node.component === 'TextInput') {
        const binding = getNativeBindingReference(node);
        let textFieldBinding = `$textFieldValue${context.textFieldIndex++}`;

        if (binding?.kind === 'value') {
            const { descriptor, variableName } = ensureSwiftStateVariable(context, binding.id);
            if (descriptor.type === 'string') {
                textFieldBinding = `$${variableName}`;
            } else if (descriptor.type === 'number') {
                textFieldBinding = `Binding(get: { String(${variableName}) }, set: { if let parsed = Double($0) { ${variableName} = parsed } })`;
            } else {
                textFieldBinding = `Binding(get: { ${variableName} ? \"true\" : \"false\" }, set: { ${variableName} = $0.compare(\"true\", options: .caseInsensitive) == .orderedSame })`;
            }
        } else {
            const stateName = textFieldBinding.slice(1);
            const initialValue = typeof node.props.value === 'string' || typeof node.props.value === 'number'
                ? String(node.props.value)
                : '';
            context.stateDeclarations.push(`${indent(1)}@State private var ${stateName} = ${quoteSwiftString(initialValue)}`);
        }

        const placeholder = typeof node.props.placeholder === 'string' ? node.props.placeholder : '';
        const isTextarea = node.sourceTag === 'textarea';
        return appendSwiftUIModifiers(
            [
                ...baseLines,
                isTextarea
                    ? `${indent(level)}TextField(${quoteSwiftString(placeholder)}, text: ${textFieldBinding}, axis: .vertical)`
                    : `${indent(level)}TextField(${quoteSwiftString(placeholder)}, text: ${textFieldBinding})`,
            ],
            [
                '.textFieldStyle(.plain)',
                ...(isTextarea ? ['.lineLimit(4, reservesSpace: true)'] : []),
                ...buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions),
            ],
            level
        );
    }

    if (node.component === 'Button') {
        const label = flattenTextContent(node.children) || 'Button';
        const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
        const transformedLabel = buildSwiftTextExpression(node.children, context, resolveTextTransform(style?.textTransform));
        const bridgeInvocation = buildSwiftBridgeInvocation(
            resolveNativeAction(node),
            resolveNativeRoute(node),
            serializeNativePayload(node.props.nativePayload),
        );
        const lines = bridgeInvocation
            ? [
                ...baseLines,
                `${indent(level)}Button(action: {`,
                `${indent(level + 1)}${bridgeInvocation}`,
                `${indent(level)}}) {`,
                `${indent(level + 1)}Text(${transformedLabel || quoteSwiftString(label)})`,
                `${indent(level)}}`,
            ]
            : [
                ...baseLines,
                `${indent(level)}Button(action: {`,
                `${indent(level + 1)}// TODO: wire elit event(s): ${node.events.join(', ') || 'press'}`,
                `${indent(level)}}) {`,
                `${indent(level + 1)}Text(${transformedLabel || quoteSwiftString(label)})`,
                `${indent(level)}}`,
            ];
        if (bridgeInvocation) {
            context.helperFlags.add('bridge');
        }
        return appendSwiftUIModifiers(lines, buildSwiftUIButtonModifiers(node, context.resolvedStyles, context.styleResolveOptions), level);
    }

    if (node.component === 'Link') {
        const label = flattenTextContent(node.children) || String(node.props.destination ?? 'Link');
        const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
        const transformedLabel = buildSwiftTextExpression(node.children, context, resolveTextTransform(style?.textTransform));
        const destination = typeof node.props.destination === 'string' ? node.props.destination : 'destination';
        const bridgeInvocation = buildSwiftBridgeInvocation(
            resolveNativeAction(node),
            resolveNativeRoute(node),
            serializeNativePayload(node.props.nativePayload),
        );
        const lines = isExternalDestination(destination)
            ? [
                ...baseLines,
                `${indent(level)}Button(action: {`,
                `${indent(level + 1)}if let destination = URL(string: ${quoteSwiftString(destination)}) {`,
                `${indent(level + 2)}openURL(destination)`,
                `${indent(level + 1)}}`,
                `${indent(level)}}) {`,
                `${indent(level + 1)}Text(${transformedLabel || quoteSwiftString(label)})`,
                `${indent(level)}}`,
            ]
            : bridgeInvocation
                ? [
                    ...baseLines,
                    `${indent(level)}Button(action: {`,
                    `${indent(level + 1)}${bridgeInvocation}`,
                    `${indent(level)}}) {`,
                    `${indent(level + 1)}Text(${transformedLabel || quoteSwiftString(label)})`,
                    `${indent(level)}}`,
                ]
            : [
                ...baseLines,
                `${indent(level)}Button(action: {`,
                `${indent(level + 1)}// TODO: navigate to ${escapeSwiftString(destination)}`,
                `${indent(level)}}) {`,
                `${indent(level + 1)}Text(${transformedLabel || quoteSwiftString(label)})`,
                `${indent(level)}}`,
            ];
        if (isExternalDestination(destination)) {
            context.helperFlags.add('openUrlHandler');
        } else if (bridgeInvocation) {
            context.helperFlags.add('bridge');
        }
        return appendSwiftUIModifiers(lines, buildSwiftUIButtonModifiers(node, context.resolvedStyles, context.styleResolveOptions), level);
    }

    if (node.component === 'Image') {
        context.helperFlags.add('imagePlaceholder');
        const source = typeof node.props.source === 'string' ? node.props.source : '';
        const alt = typeof node.props.alt === 'string' ? node.props.alt : undefined;
        const fallbackLabel = resolveImageFallbackLabel(source, alt);
        return appendSwiftUIModifiers(
            [
                ...baseLines,
                `${indent(level)}elitImagePlaceholder(label: ${quoteSwiftString(fallbackLabel)}, source: ${quoteSwiftString(source)}, alt: ${alt ? quoteSwiftString(alt) : 'nil'})`,
            ],
            buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions),
            level
        );
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

    if (node.component === 'Media' || node.component === 'WebView' || node.component === 'Canvas' || node.component === 'Vector') {
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
    }

    if (context.helperFlags.has('unsupportedPlaceholder')) {
        helpers.push('');
        helpers.push('@ViewBuilder');
        helpers.push('private func elitUnsupportedPlaceholder(label: String, sourceTag: String) -> some View {');
        helpers.push('    Text("\\(label) placeholder for <\\(sourceTag)>")');
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

    const context: AndroidComposeContext = {
        textFieldIndex: 0,
        toggleIndex: 0,
        stateDeclarations: [],
        stateDescriptors: createNativeStateDescriptorMap(tree),
        declaredStateIds: new Set(),
        helperFlags: new Set(),
        styleResolveOptions,
        resolvedStyles: buildRootResolvedStyleMap(tree.roots, styleResolveOptions),
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
        lines.push('import androidx.compose.foundation.rememberScrollState');
        lines.push('import androidx.compose.foundation.text.BasicTextField');
        lines.push('import androidx.compose.foundation.verticalScroll');
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
        if (context.stateDeclarations.length > 0) {
            lines.push('');
        }
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

    const context: SwiftUIContext = {
        textFieldIndex: 0,
        toggleIndex: 0,
        stateDeclarations: [],
        stateDescriptors: createNativeStateDescriptorMap(tree),
        declaredStateIds: new Set(),
        helperFlags: new Set(),
        styleResolveOptions,
        resolvedStyles: buildRootResolvedStyleMap(tree.roots, styleResolveOptions),
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
        if (context.helperFlags.has('openUrlHandler')) {
            lines.push('import Foundation');
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
