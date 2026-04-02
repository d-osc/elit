import styles from './style';
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

interface NativeStyleScope {
    tagName: string;
    classNames: string[];
    attributes: Record<string, string>;
}

interface StateLike<T = unknown> {
    value: T;
    subscribe: (listener: (value: T) => void) => () => void;
}

interface AndroidComposeContext {
    textFieldIndex: number;
    toggleIndex: number;
    stateDeclarations: string[];
    helperFlags: Set<NativeHelperFlag>;
    resolvedStyles: NativeResolvedStyleMap;
}

interface SwiftUIContext {
    textFieldIndex: number;
    toggleIndex: number;
    stateDeclarations: string[];
    helperFlags: Set<NativeHelperFlag>;
    resolvedStyles: NativeResolvedStyleMap;
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

interface NativeShadowValue {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: NativeColorValue;
}

const DEFAULT_COMPONENT_MAP: Record<string, string> = {
    html: 'Screen',
    body: 'Screen',
    main: 'Screen',
    header: 'View',
    footer: 'View',
    nav: 'View',
    section: 'View',
    article: 'View',
    aside: 'View',
    div: 'View',
    form: 'Form',
    fieldset: 'View',
    figure: 'View',
    figcaption: 'Text',
    details: 'View',
    dialog: 'View',
    menu: 'View',
    summary: 'Text',
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

const TEXT_CONTAINER_COMPONENTS = new Set(['Text']);

const EVENT_NAME_MAP: Record<string, string> = {
    onClick: 'press',
    onChange: 'change',
    onInput: 'input',
    onSubmit: 'submit',
};

const INHERITED_TEXT_STYLE_KEYS = [
    'color',
    'fontSize',
    'fontWeight',
    'letterSpacing',
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

function normalizeProps(component: string, props: Props): { props: Record<string, NativePropValue>; events: string[] } {
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
    parentComponent: string
): NativeNode[] {
    if (child == null || child === false) return [];

    if (isStateLike(child)) {
        return toNativeNodes(child.value as Child, options, parentComponent);
    }

    if (Array.isArray(child)) {
        const nodes: NativeNode[] = [];
        for (const item of child) {
            const converted = toNativeNodes(item, options, parentComponent);
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
            const converted = toNativeNodes(item, options, parentComponent);
            for (const node of converted) {
                fragmentChildren.push(wrapTextNodeIfNeeded(node, parentComponent, options));
            }
        }
        return fragmentChildren;
    }

    const component = resolveComponent(child.tagName, options);
    const childNodes: NativeNode[] = [];
    for (const item of child.children) {
        childNodes.push(...toNativeNodes(item, options, component));
    }

    const { props, events } = normalizeProps(component, child.props);
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

    const roots = toNativeNodes(input, resolvedOptions, '__root__');
    return {
        platform: resolvedOptions.platform,
        roots,
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

function toDpLiteral(value: NativePropValue | undefined): string | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return `${value}.dp`;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        const match = trimmed.match(/^(-?\d+(?:\.\d+)?)(px|dp)?$/i);
        if (match) {
            return `${match[1]}.dp`;
        }
    }

    return undefined;
}

function toPointLiteral(value: NativePropValue | undefined): string | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return `${value}`;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        const match = trimmed.match(/^(-?\d+(?:\.\d+)?)(px|dp|pt)?$/i);
        if (match) {
            return match[1];
        }
    }

    return undefined;
}

function toSpLiteral(value: NativePropValue | undefined): string | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return `${value}.sp`;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        const match = trimmed.match(/^(-?\d+(?:\.\d+)?)(px|dp|pt|sp)?$/i);
        if (match) {
            return `${match[1]}.sp`;
        }
    }

    return undefined;
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

function buildResolvedStyleMap(
    nodes: NativeNode[],
    ancestors: NativeStyleScope[] = [],
    resolvedStyles: NativeResolvedStyleMap = new WeakMap(),
    inheritedTextStyles: Record<string, NativePropValue> = {},
): NativeResolvedStyleMap {
    for (const node of nodes) {
        if (node.kind !== 'element') {
            continue;
        }

        const scope: NativeStyleScope = {
            tagName: node.sourceTag,
            classNames: getClassList(node),
            attributes: getSelectorAttributes(node),
        };
        const classStyles = styles.resolveNativeStyles(scope, ancestors) as Record<string, NativePropValue>;
        const inlineStyle = getInlineStyleObject(node);
        const hasClassStyles = Object.keys(classStyles).length > 0;

        const ownStyle = inlineStyle
            ? hasClassStyles
                ? { ...classStyles, ...inlineStyle }
                : inlineStyle
            : hasClassStyles
                ? classStyles
                : undefined;
        const resolvedStyle = ownStyle
            ? { ...inheritedTextStyles, ...ownStyle }
            : Object.keys(inheritedTextStyles).length > 0
                ? { ...inheritedTextStyles }
                : undefined;

        if (resolvedStyle) {
            resolvedStyles.set(node, resolvedStyle);
        }

        buildResolvedStyleMap(
            node.children,
            [...ancestors, scope],
            resolvedStyles,
            pickInheritedTextStyles(resolvedStyle) ?? inheritedTextStyles,
        );
    }

    return resolvedStyles;
}

function getStyleObject(
    node: NativeElementNode,
    resolvedStyles?: NativeResolvedStyleMap,
): Record<string, NativePropValue> | undefined {
    const mappedStyle = resolvedStyles?.get(node);
    if (mappedStyle) {
        return mappedStyle;
    }

    const classStyles = styles.resolveNativeStyles({
        tagName: node.sourceTag,
        classNames: getClassList(node),
        attributes: getSelectorAttributes(node),
    }) as Record<string, NativePropValue>;
    const inlineStyle = getInlineStyleObject(node);
    const hasClassStyles = Object.keys(classStyles).length > 0;

    if (inlineStyle) {
        return hasClassStyles
            ? { ...classStyles, ...inlineStyle }
            : inlineStyle;
    }

    return hasClassStyles ? classStyles : undefined;
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

function isFillValue(value: NativePropValue | undefined): boolean {
    return typeof value === 'string' && value.trim() === '100%';
}

function extractColorToken(value: string): string | undefined {
    const trimmed = value.trim();
    const directMatch = trimmed.match(/^(rgba?\([^\)]+\)|#[0-9a-fA-F]{3,8})$/);
    if (directMatch) {
        return directMatch[1];
    }

    const embeddedMatch = trimmed.match(/(rgba?\([^\)]+\)|#[0-9a-fA-F]{3,8})/);
    return embeddedMatch?.[1];
}

function parseCssColor(value: NativePropValue | undefined): NativeColorValue | undefined {
    if (typeof value !== 'string') return undefined;

    const token = extractColorToken(value);
    if (!token) return undefined;

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

    const rgbMatch = token.match(/^rgba?\(([^\)]+)\)$/i);
    if (!rgbMatch) return undefined;

    const parts = rgbMatch[1].split(',').map((part) => part.trim());
    if (parts.length < 3) return undefined;

    const red = Number(parts[0]);
    const green = Number(parts[1]);
    const blue = Number(parts[2]);
    const alpha = parts[3] !== undefined ? Number(parts[3]) : 1;

    if ([red, green, blue, alpha].some((item) => Number.isNaN(item))) {
        return undefined;
    }

    return { red, green, blue, alpha };
}

function formatFloat(value: number): string {
    return Number(value.toFixed(3)).toString();
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

function parseLinearGradient(value: NativePropValue | undefined): NativeGradientValue | undefined {
    if (typeof value !== 'string') return undefined;

    const trimmed = value.trim();
    if (!/^linear-gradient\(/i.test(trimmed)) {
        return undefined;
    }

    const colorTokens = trimmed.match(/rgba?\([^\)]+\)|#[0-9a-fA-F]{3,8}/g);
    if (!colorTokens || colorTokens.length < 2) {
        return undefined;
    }

    const colors = colorTokens
        .map((token) => parseCssColor(token))
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

function parseBoxShadow(value: NativePropValue | undefined): NativeShadowValue | undefined {
    if (typeof value !== 'string') return undefined;

    const colorToken = extractColorToken(value);
    const color = parseCssColor(colorToken ?? value);
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

function resolveBackgroundColor(style: Record<string, NativePropValue>): NativeColorValue | undefined {
    const background = typeof style.background === 'string' && /^linear-gradient\(/i.test(style.background.trim())
        ? undefined
        : parseCssColor(style.background);
    return parseCssColor(style.backgroundColor) ?? background;
}

function resolveBackgroundGradient(style: Record<string, NativePropValue>): NativeGradientValue | undefined {
    return parseLinearGradient(style.background);
}

function parseBorderValue(
    value: NativePropValue | undefined,
    unitParser: (value: NativePropValue | undefined) => string | undefined,
): { width?: string; color?: NativeColorValue } | undefined {
    if (typeof value !== 'string') return undefined;

    const widthMatch = value.match(/-?\d+(?:\.\d+)?(?:px|dp|pt)?/i);
    const width = widthMatch ? unitParser(widthMatch[0]) : undefined;
    const color = parseCssColor(value);

    if (!width && !color) {
        return undefined;
    }

    return { width, color };
}

function resolveTextTransform(value: NativePropValue | undefined): 'uppercase' | 'lowercase' | 'capitalize' | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'uppercase' || normalized === 'lowercase' || normalized === 'capitalize') {
        return normalized;
    }

    return undefined;
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

function buildComposeArrangement(layout: 'Row' | 'Column', style: Record<string, NativePropValue> | undefined): string | undefined {
    if (!style) return undefined;

    const justify = typeof style.justifyContent === 'string' ? style.justifyContent.trim().toLowerCase() : undefined;
    const gap = toDpLiteral(style.gap ?? (layout === 'Row' ? style.columnGap : style.rowGap) ?? style.gap);

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

function buildComposeTextStyleArgs(node: NativeElementNode, resolvedStyles?: NativeResolvedStyleMap): string[] {
    const style = getStyleObject(node, resolvedStyles);
    if (!style) return [];

    const args: string[] = [];
    const color = parseCssColor(style.color);
    const fontSize = toSpLiteral(style.fontSize);
    const fontWeight = resolveComposeFontWeight(style.fontWeight);
    const letterSpacing = toSpLiteral(style.letterSpacing);
    const textAlign = resolveComposeTextAlign(style.textAlign);

    if (color) args.push(`color = ${toComposeColorLiteral(color)}`);
    if (fontSize) args.push(`fontSize = ${fontSize}`);
    if (fontWeight) args.push(`fontWeight = ${fontWeight}`);
    if (letterSpacing) args.push(`letterSpacing = ${letterSpacing}`);
    if (textAlign) args.push(`textAlign = ${textAlign}`);

    return args;
}

function buildComposeLabelText(node: NativeElementNode, label: string, resolvedStyles?: NativeResolvedStyleMap): string {
    const style = getStyleObject(node, resolvedStyles);
    const transformedLabel = applyTextTransform(label, resolveTextTransform(style?.textTransform));
    const args = [`text = ${quoteKotlinString(transformedLabel)}`, ...buildComposeTextStyleArgs(node, resolvedStyles)];
    return `Text(${args.join(', ')})`;
}

function buildComposeButtonArgs(
    node: NativeElementNode,
    modifier: string,
    variant: 'filled' | 'text',
    resolvedStyles?: NativeResolvedStyleMap,
): string[] {
    const args = [`modifier = ${modifier}`];
    const style = getStyleObject(node, resolvedStyles);
    if (!style) {
        return args;
    }

    const radius = toDpLiteral(style.borderRadius);
    const backgroundColor = resolveBackgroundColor(style);
    const backgroundGradient = resolveBackgroundGradient(style);
    const border = parseBorderValue(style.border, toDpLiteral);
    const contentColor = parseCssColor(style.color);
    const hasCustomContainer = Boolean(backgroundColor || backgroundGradient || border?.color || border?.width);

    if (radius) {
        args.push(`shape = RoundedCornerShape(${radius})`);
    }

    const colorArgs: string[] = [];
    if (hasCustomContainer) {
        colorArgs.push('containerColor = Color.Transparent');
    }
    if (contentColor) {
        colorArgs.push(`contentColor = ${toComposeColorLiteral(contentColor)}`);
    }
    if (colorArgs.length > 0) {
        const builder = variant === 'filled' ? 'ButtonDefaults.buttonColors' : 'ButtonDefaults.textButtonColors';
        args.push(`colors = ${builder}(${colorArgs.join(', ')})`);
    }

    return args;
}

function buildComposeModifier(node: NativeElementNode, resolvedStyles?: NativeResolvedStyleMap): string {
    const parts = ['Modifier'];
    if (node.component === 'Screen') {
        parts.push('fillMaxSize()');
    }

    const style = getStyleObject(node, resolvedStyles);
    if (style) {
        const padding = toDpLiteral(style.padding);
        const paddingHorizontal = toDpLiteral(style.paddingHorizontal);
        const paddingVertical = toDpLiteral(style.paddingVertical);
        const width = toDpLiteral(style.width);
        const height = toDpLiteral(style.height);
        const minWidth = toDpLiteral(style.minWidth);
        const maxWidth = toDpLiteral(style.maxWidth);
        const minHeight = toDpLiteral(style.minHeight);
        const maxHeight = toDpLiteral(style.maxHeight);
        const radius = toDpLiteral(style.borderRadius);
        const backgroundGradient = resolveBackgroundGradient(style);
        const backgroundColor = resolveBackgroundColor(style);
        const border = parseBorderValue(style.border, toDpLiteral);
        const shadow = parseBoxShadow(style.boxShadow);
        const flexValue = typeof style.flex === 'number'
            ? style.flex
            : typeof style.flex === 'string' && /^-?\d+(?:\.\d+)?$/.test(style.flex.trim())
                ? Number(style.flex)
                : typeof style.flexGrow === 'number'
                    ? style.flexGrow
                    : undefined;

        if (padding) {
            parts.push(`padding(${padding})`);
        } else {
            const paddingArgs: string[] = [];
            const spacing = resolveDirectionalSpacing(style, 'padding', toDpLiteral);
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
                parts.push(`padding(${paddingArgs.join(', ')})`);
            }
        }

        if (isFillValue(style.width)) {
            parts.push('fillMaxWidth()');
        } else if (width) {
            parts.push(`width(${width})`);
        }

        if (isFillValue(style.height)) {
            parts.push('fillMaxHeight()');
        } else if (height) {
            parts.push(`height(${height})`);
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

        if (border?.width && border.color) {
            if (radius) {
                parts.push(`border(${border.width}, ${toComposeColorLiteral(border.color)}, RoundedCornerShape(${radius}))`);
            } else {
                parts.push(`border(${border.width}, ${toComposeColorLiteral(border.color)})`);
            }
        }

        if (flexValue !== undefined && Number.isFinite(flexValue) && flexValue > 0) {
            parts.push(`weight(${flexValue}f)`);
        }
    }

    return parts.join('.');
}

function renderComposeChildren(nodes: NativeNode[], level: number, context: AndroidComposeContext): string[] {
    const lines: string[] = [];
    for (const child of nodes) {
        lines.push(...renderComposeNode(child, level, context));
    }
    return lines;
}

function resolveComposeLayout(node: NativeElementNode, resolvedStyles?: NativeResolvedStyleMap): 'Row' | 'Column' {
    const style = getStyleObject(node, resolvedStyles);
    const styleLayout = resolveLayoutDirection(style);
    if (styleLayout) return styleLayout;
    return node.component === 'Row' || node.component === 'ListItem' ? 'Row' : 'Column';
}

function buildComposeLayoutArguments(
    node: NativeElementNode,
    layout: 'Row' | 'Column',
    modifier: string,
    resolvedStyles?: NativeResolvedStyleMap,
): string {
    const args = [`modifier = ${modifier}`];
    const style = getStyleObject(node, resolvedStyles);
    const arrangement = buildComposeArrangement(layout, style);
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

function renderTextComposable(text: string, level: number): string[] {
    return [`${indent(level)}Text(text = ${quoteKotlinString(text)})`];
}

function renderComposeNode(node: NativeNode, level: number, context: AndroidComposeContext): string[] {
    if (node.kind === 'text') {
        return renderTextComposable(node.value, level);
    }

    const modifier = buildComposeModifier(node, context.resolvedStyles);
    const classComment = Array.isArray(node.props.classList) && node.props.classList.length > 0
        ? `${indent(level)}// classList: ${(node.props.classList as NativePropValue[]).map((item) => String(item)).join(' ')}`
        : undefined;
    const lines: string[] = [];
    if (classComment) lines.push(classComment);

    if (node.component === 'Text') {
        const style = getStyleObject(node, context.resolvedStyles);
        const text = applyTextTransform(flattenTextContent(node.children), resolveTextTransform(style?.textTransform));
        const args = [`text = ${quoteKotlinString(text)}`];
        if (modifier !== 'Modifier') args.push(`modifier = ${modifier}`);
        args.push(...buildComposeTextStyleArgs(node, context.resolvedStyles));
        return [...lines, `${indent(level)}Text(${args.join(', ')})`];
    }

    if (node.component === 'Toggle') {
        const stateName = `toggleValue${context.toggleIndex++}`;
        context.stateDeclarations.push(`${indent(1)}var ${stateName} by remember { mutableStateOf(${toNativeBoolean(node.props.checked) ? 'true' : 'false'}) }`);

        lines.push(`${indent(level)}Checkbox(`);
        lines.push(`${indent(level + 1)}checked = ${stateName},`);
        lines.push(`${indent(level + 1)}onCheckedChange = { ${stateName} = it },`);
        lines.push(`${indent(level + 1)}modifier = ${modifier}`);
        lines.push(`${indent(level)})`);
        return lines;
    }

    if (node.component === 'TextInput') {
        const stateName = `textFieldValue${context.textFieldIndex++}`;
        const initialValue = typeof node.props.value === 'string' || typeof node.props.value === 'number'
            ? String(node.props.value)
            : '';
        context.stateDeclarations.push(`${indent(1)}var ${stateName} by remember { mutableStateOf(${quoteKotlinString(initialValue)}) }`);

        lines.push(`${indent(level)}OutlinedTextField(`);
        lines.push(`${indent(level + 1)}value = ${stateName},`);
        lines.push(`${indent(level + 1)}onValueChange = { ${stateName} = it },`);
        lines.push(`${indent(level + 1)}modifier = ${modifier},`);

        if (typeof node.props.placeholder === 'string') {
            lines.push(`${indent(level + 1)}placeholder = { Text(text = ${quoteKotlinString(node.props.placeholder)}) },`);
        }

        lines.push(`${indent(level)})`);
        return lines;
    }

    if (node.component === 'Button') {
        const label = flattenTextContent(node.children) || 'Button';
        const bridgeInvocation = buildComposeBridgeInvocation(
            resolveNativeAction(node),
            resolveNativeRoute(node),
            serializeNativePayload(node.props.nativePayload),
        );
        const args = buildComposeButtonArgs(node, modifier, 'filled', context.resolvedStyles);

        if (bridgeInvocation) {
            context.helperFlags.add('bridge');
            lines.push(`${indent(level)}Button(onClick = { ${bridgeInvocation} }, ${args.join(', ')}) {`);
        } else {
            const actionComment = node.events.length > 0
                ? ` /* TODO: wire elit event(s): ${node.events.join(', ')} */ `
                : ' ';
            lines.push(`${indent(level)}Button(onClick = {${actionComment}}, ${args.join(', ')}) {`);
        }
        lines.push(`${indent(level + 1)}${buildComposeLabelText(node, label, context.resolvedStyles)}`);
        lines.push(`${indent(level)}}`);
        return lines;
    }

    if (node.component === 'Link') {
        const label = flattenTextContent(node.children) || String(node.props.destination ?? 'Link');
        const destination = typeof node.props.destination === 'string' ? node.props.destination : undefined;
        const args = buildComposeButtonArgs(node, modifier, 'text', context.resolvedStyles);
        if (destination && isExternalDestination(destination)) {
            context.helperFlags.add('uriHandler');
            lines.push(`${indent(level)}TextButton(onClick = { uriHandler.openUri(${quoteKotlinString(destination)}) }, ${args.join(', ')}) {`);
        } else {
            const bridgeInvocation = buildComposeBridgeInvocation(
                resolveNativeAction(node),
                resolveNativeRoute(node),
                serializeNativePayload(node.props.nativePayload),
            );

            if (bridgeInvocation) {
                context.helperFlags.add('bridge');
                lines.push(`${indent(level)}TextButton(onClick = { ${bridgeInvocation} }, ${args.join(', ')}) {`);
            } else {
                const actionComment = destination ? ` /* TODO: navigate to ${escapeKotlinString(destination)} */ ` : ' ';
                lines.push(`${indent(level)}TextButton(onClick = {${actionComment}}, ${args.join(', ')}) {`);
            }
        }
        lines.push(`${indent(level + 1)}${buildComposeLabelText(node, label, context.resolvedStyles)}`);
        lines.push(`${indent(level)}}`);
        return lines;
    }

    if (node.component === 'Image') {
        context.helperFlags.add('imagePlaceholder');
        const source = typeof node.props.source === 'string' ? node.props.source : '';
        const alt = typeof node.props.alt === 'string' ? node.props.alt : undefined;
        lines.push(`${indent(level)}ElitImagePlaceholder(`);
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

    const layout = resolveComposeLayout(node, context.resolvedStyles);
    lines.push(`${indent(level)}${layout}(${buildComposeLayoutArguments(node, layout, modifier, context.resolvedStyles)}) {`);
    lines.push(...renderComposeChildren(node.children, level + 1, context));
    lines.push(`${indent(level)}}`);
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
        helpers.push('private fun ElitImagePlaceholder(source: String, contentDescription: String?, modifier: Modifier = Modifier) {');
        helpers.push('    val label = contentDescription?.takeIf { it.isNotBlank() }?.let { "Image: ${source} (${it})" } ?: "Image: ${source}"');
        helpers.push('    Text(text = label, modifier = modifier)');
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

function buildSwiftUIModifiers(node: NativeElementNode, resolvedStyles?: NativeResolvedStyleMap): string[] {
    const modifiers: string[] = [];

    if (node.component === 'Screen') {
        modifiers.push('.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)');
    }

    const style = getStyleObject(node, resolvedStyles);
    if (style) {
        const padding = toPointLiteral(style.padding);
        const paddingHorizontal = toPointLiteral(style.paddingHorizontal);
        const paddingVertical = toPointLiteral(style.paddingVertical);
        const width = toPointLiteral(style.width);
        const height = toPointLiteral(style.height);
        const minWidth = toPointLiteral(style.minWidth);
        const maxWidth = toPointLiteral(style.maxWidth);
        const minHeight = toPointLiteral(style.minHeight);
        const maxHeight = toPointLiteral(style.maxHeight);
        const radius = toPointLiteral(style.borderRadius);
        const backgroundGradient = resolveBackgroundGradient(style);
        const backgroundColor = resolveBackgroundColor(style);
        const border = parseBorderValue(style.border, toPointLiteral);
        const shadow = parseBoxShadow(style.boxShadow);
        const color = parseCssColor(style.color);
        const fontSize = toPointLiteral(style.fontSize);
        const fontWeight = resolveSwiftFontWeight(style.fontWeight);
        const letterSpacing = toPointLiteral(style.letterSpacing);
        const textAlign = resolveSwiftTextAlign(style.textAlign);
        const flexValue = typeof style.flex === 'number'
            ? style.flex
            : typeof style.flex === 'string' && /^-?\d+(?:\.\d+)?$/.test(style.flex.trim())
                ? Number(style.flex)
                : typeof style.flexGrow === 'number'
                    ? style.flexGrow
                    : undefined;

        if (padding) {
            modifiers.push(`.padding(${padding})`);
        } else {
            const spacing = resolveDirectionalSpacing(style, 'padding', toPointLiteral);
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
        if (isFillValue(style.width)) {
            frameArgs.push('maxWidth: .infinity');
        } else if (width) {
            frameArgs.push(`width: ${width}`);
        }
        if (isFillValue(style.height)) {
            frameArgs.push('maxHeight: .infinity');
        } else if (height) {
            frameArgs.push(`height: ${height}`);
        }
        if (minWidth) frameArgs.push(`minWidth: ${minWidth}`);
        if (maxWidth) frameArgs.push(`maxWidth: ${maxWidth}`);
        if (minHeight) frameArgs.push(`minHeight: ${minHeight}`);
        if (maxHeight) frameArgs.push(`maxHeight: ${maxHeight}`);
        if (frameArgs.length > 0) {
            modifiers.push(`.frame(${frameArgs.join(', ')})`);
        }

        if (backgroundGradient) {
            modifiers.push(`.background(${toSwiftGradientLiteral(backgroundGradient)})`);
        } else if (backgroundColor) {
            modifiers.push(`.background(${toSwiftColorLiteral(backgroundColor)})`);
        }

        if (radius) {
            modifiers.push(`.clipShape(RoundedRectangle(cornerRadius: ${radius}))`);
        }

        if (border?.width && border.color) {
            const radiusValue = radius ?? '0';
            modifiers.push(`.overlay(RoundedRectangle(cornerRadius: ${radiusValue}).stroke(${toSwiftColorLiteral(border.color)}, lineWidth: ${border.width}))`);
        }

        if (shadow) {
            modifiers.push(`.shadow(color: ${toSwiftColorLiteral(shadow.color)}, radius: ${toSwiftShadowRadius(shadow)}, x: ${formatFloat(shadow.offsetX)}, y: ${formatFloat(shadow.offsetY)})`);
        }

        if (color) modifiers.push(`.foregroundStyle(${toSwiftColorLiteral(color)})`);
        if (fontSize || fontWeight) {
            const args = [`size: ${fontSize ?? '17'}`];
            if (fontWeight) args.push(`weight: ${fontWeight}`);
            modifiers.push(`.font(.system(${args.join(', ')}))`);
        }
        if (letterSpacing) modifiers.push(`.kerning(${letterSpacing})`);
        if (textAlign) modifiers.push(`.multilineTextAlignment(${textAlign})`);
        if (flexValue !== undefined && Number.isFinite(flexValue) && flexValue > 0) {
            modifiers.push('.frame(maxWidth: .infinity, alignment: .leading)');
        }
    }

    return modifiers;
}

function buildSwiftUIButtonModifiers(node: NativeElementNode, resolvedStyles?: NativeResolvedStyleMap): string[] {
    const style = getStyleObject(node, resolvedStyles);
    const modifiers = buildSwiftUIModifiers(node, resolvedStyles);
    return style ? ['.buttonStyle(.plain)', ...modifiers] : modifiers;
}

function resolveSwiftUILayout(node: NativeElementNode, resolvedStyles?: NativeResolvedStyleMap): 'HStack' | 'VStack' {
    const style = getStyleObject(node, resolvedStyles);
    const styleLayout = resolveLayoutDirection(style);
    if (styleLayout === 'Row') return 'HStack';
    return node.component === 'Row' || node.component === 'ListItem' ? 'HStack' : 'VStack';
}

function buildSwiftUILayout(node: NativeElementNode, layout: 'HStack' | 'VStack', resolvedStyles?: NativeResolvedStyleMap): string {
    const style = getStyleObject(node, resolvedStyles);
    const spacing = toPointLiteral(style?.gap ?? (layout === 'HStack' ? style?.columnGap : style?.rowGap) ?? style?.gap) ?? '12';
    const align = typeof style?.alignItems === 'string' ? style.alignItems.trim().toLowerCase() : undefined;

    if (layout === 'HStack') {
        const alignment = align === 'center'
            ? '.center'
            : align === 'flex-end' || align === 'end' || align === 'bottom'
                ? '.bottom'
                : '.top';
        return `HStack(alignment: ${alignment}, spacing: ${spacing})`;
    }

    const alignment = align === 'center'
        ? '.center'
        : align === 'flex-end' || align === 'end' || align === 'right'
            ? '.trailing'
            : '.leading';
    return `VStack(alignment: ${alignment}, spacing: ${spacing})`;
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

function renderSwiftUIChildren(nodes: NativeNode[], level: number, context: SwiftUIContext): string[] {
    const lines: string[] = [];
    for (const child of nodes) {
        lines.push(...renderSwiftUINode(child, level, context));
    }
    return lines;
}

function renderSwiftUINode(node: NativeNode, level: number, context: SwiftUIContext): string[] {
    if (node.kind === 'text') {
        return [`${indent(level)}Text(${quoteSwiftString(node.value)})`];
    }

    const classComment = Array.isArray(node.props.classList) && node.props.classList.length > 0
        ? `${indent(level)}// classList: ${(node.props.classList as NativePropValue[]).map((item) => String(item)).join(' ')}`
        : undefined;
    const baseLines: string[] = [];
    if (classComment) baseLines.push(classComment);

    if (node.component === 'Text') {
        const style = getStyleObject(node, context.resolvedStyles);
        const text = applyTextTransform(flattenTextContent(node.children), resolveTextTransform(style?.textTransform));
        return appendSwiftUIModifiers(
            [...baseLines, `${indent(level)}Text(${quoteSwiftString(text)})`],
            buildSwiftUIModifiers(node, context.resolvedStyles),
            level
        );
    }

    if (node.component === 'Toggle') {
        const stateName = `toggleValue${context.toggleIndex++}`;
        context.stateDeclarations.push(`${indent(1)}@State private var ${stateName} = ${toNativeBoolean(node.props.checked) ? 'true' : 'false'}`);

        return appendSwiftUIModifiers(
            [
                ...baseLines,
                `${indent(level)}Toggle("", isOn: $${stateName})`,
            ],
            ['.labelsHidden()', ...buildSwiftUIModifiers(node, context.resolvedStyles)],
            level
        );
    }

    if (node.component === 'TextInput') {
        const stateName = `textFieldValue${context.textFieldIndex++}`;
        const initialValue = typeof node.props.value === 'string' || typeof node.props.value === 'number'
            ? String(node.props.value)
            : '';
        context.stateDeclarations.push(`${indent(1)}@State private var ${stateName} = ${quoteSwiftString(initialValue)}`);

        const placeholder = typeof node.props.placeholder === 'string' ? node.props.placeholder : '';
        return appendSwiftUIModifiers(
            [
                ...baseLines,
                `${indent(level)}TextField(${quoteSwiftString(placeholder)}, text: $${stateName})`,
            ],
            ['.textFieldStyle(.roundedBorder)', ...buildSwiftUIModifiers(node, context.resolvedStyles)],
            level
        );
    }

    if (node.component === 'Button') {
        const label = flattenTextContent(node.children) || 'Button';
        const transformedLabel = applyTextTransform(label, resolveTextTransform(getStyleObject(node, context.resolvedStyles)?.textTransform));
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
                `${indent(level + 1)}Text(${quoteSwiftString(transformedLabel)})`,
                `${indent(level)}}`,
            ]
            : [
                ...baseLines,
                `${indent(level)}Button(action: {`,
                `${indent(level + 1)}// TODO: wire elit event(s): ${node.events.join(', ') || 'press'}`,
                `${indent(level)}}) {`,
                `${indent(level + 1)}Text(${quoteSwiftString(transformedLabel)})`,
                `${indent(level)}}`,
            ];
        if (bridgeInvocation) {
            context.helperFlags.add('bridge');
        }
        return appendSwiftUIModifiers(lines, buildSwiftUIButtonModifiers(node, context.resolvedStyles), level);
    }

    if (node.component === 'Link') {
        const label = flattenTextContent(node.children) || String(node.props.destination ?? 'Link');
        const transformedLabel = applyTextTransform(label, resolveTextTransform(getStyleObject(node, context.resolvedStyles)?.textTransform));
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
                `${indent(level + 1)}Text(${quoteSwiftString(transformedLabel)})`,
                `${indent(level)}}`,
            ]
            : bridgeInvocation
                ? [
                    ...baseLines,
                    `${indent(level)}Button(action: {`,
                    `${indent(level + 1)}${bridgeInvocation}`,
                    `${indent(level)}}) {`,
                    `${indent(level + 1)}Text(${quoteSwiftString(transformedLabel)})`,
                    `${indent(level)}}`,
                ]
            : [
                ...baseLines,
                `${indent(level)}Button(action: {`,
                `${indent(level + 1)}// TODO: navigate to ${escapeSwiftString(destination)}`,
                `${indent(level)}}) {`,
                `${indent(level + 1)}Text(${quoteSwiftString(transformedLabel)})`,
                `${indent(level)}}`,
            ];
        if (isExternalDestination(destination)) {
            context.helperFlags.add('openUrlHandler');
        } else if (bridgeInvocation) {
            context.helperFlags.add('bridge');
        }
        return appendSwiftUIModifiers(lines, buildSwiftUIButtonModifiers(node, context.resolvedStyles), level);
    }

    if (node.component === 'Image') {
        context.helperFlags.add('imagePlaceholder');
        const source = typeof node.props.source === 'string' ? node.props.source : '';
        const alt = typeof node.props.alt === 'string' ? node.props.alt : undefined;
        return appendSwiftUIModifiers(
            [
                ...baseLines,
                `${indent(level)}elitImagePlaceholder(source: ${quoteSwiftString(source)}, alt: ${alt ? quoteSwiftString(alt) : 'nil'})`,
            ],
            buildSwiftUIModifiers(node, context.resolvedStyles),
            level
        );
    }

    if (node.component === 'Media' || node.component === 'WebView' || node.component === 'Canvas' || node.component === 'Vector') {
        context.helperFlags.add('unsupportedPlaceholder');
        return appendSwiftUIModifiers(
            [
                ...baseLines,
                `${indent(level)}elitUnsupportedPlaceholder(label: ${quoteSwiftString(node.component)}, sourceTag: ${quoteSwiftString(node.sourceTag)})`,
            ],
            buildSwiftUIModifiers(node),
            level
        );
    }

    const layout = buildSwiftUILayout(node, resolveSwiftUILayout(node, context.resolvedStyles), context.resolvedStyles);
    const lines = [
        ...baseLines,
        `${indent(level)}${layout} {`,
        ...renderSwiftUIChildren(node.children, level + 1, context),
        `${indent(level)}}`,
    ];
    return appendSwiftUIModifiers(lines, buildSwiftUIModifiers(node, context.resolvedStyles), level);
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
        helpers.push('private func elitImagePlaceholder(source: String, alt: String?) -> some View {');
        helpers.push('    let _ = alt');
        helpers.push('    Text("Image: \\(source)")');
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

    const context: AndroidComposeContext = {
        textFieldIndex: 0,
        toggleIndex: 0,
        stateDeclarations: [],
        helperFlags: new Set(),
        resolvedStyles: buildResolvedStyleMap(tree.roots),
    };

    const bodyLines = tree.roots.length === 1
        ? renderComposeNode(tree.roots[0], 1, context)
        : [
            '    Column(modifier = Modifier.fillMaxSize()) {',
            ...renderComposeChildren(tree.roots, 2, context),
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
        lines.push('import androidx.compose.ui.draw.shadow');
        lines.push('import androidx.compose.material3.*');
        lines.push('import androidx.compose.runtime.*');
        lines.push('import androidx.compose.foundation.shape.RoundedCornerShape');
        lines.push('import androidx.compose.ui.Alignment');
        lines.push('import androidx.compose.ui.Modifier');
        lines.push('import androidx.compose.ui.graphics.Brush');
        lines.push('import androidx.compose.ui.graphics.Color');
        if (context.helperFlags.has('uriHandler')) {
            lines.push('import androidx.compose.ui.platform.LocalUriHandler');
        }
        lines.push('import androidx.compose.ui.text.font.FontWeight');
        lines.push('import androidx.compose.ui.text.style.TextAlign');
        lines.push('import androidx.compose.ui.tooling.preview.Preview');
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

    const context: SwiftUIContext = {
        textFieldIndex: 0,
        toggleIndex: 0,
        stateDeclarations: [],
        helperFlags: new Set(),
        resolvedStyles: buildResolvedStyleMap(tree.roots),
    };

    const bodyLines = tree.roots.length === 1
        ? renderSwiftUINode(tree.roots[0], 2, context)
        : [
            `${indent(2)}VStack(alignment: .leading, spacing: 12) {`,
            ...renderSwiftUIChildren(tree.roots, 3, context),
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
