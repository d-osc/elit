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

interface NativeStyleScope {
    tagName: string;
    classNames: string[];
    attributes: Record<string, string>;
    pseudoStates: string[];
}

interface NativeRenderHints {
    fillWidth?: boolean;
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

function buildGlobalInheritedTextStyles(options: NativeStyleResolveOptions): Record<string, NativePropValue> {
    const htmlScope = createNativeStyleScope('html');
    const bodyScope = createNativeStyleScope('body');
    const htmlStyles = pickInheritedTextStyles(
        styles.resolveNativeStyles(htmlScope, [], options) as Record<string, NativePropValue>
    );
    const bodyStyles = pickInheritedTextStyles(
        styles.resolveNativeStyles(bodyScope, [htmlScope], options) as Record<string, NativePropValue>
    );

    return {
        ...(htmlStyles ?? {}),
        ...(bodyStyles ?? {}),
    };
}

function buildRootResolvedStyleMap(nodes: NativeNode[], options: NativeStyleResolveOptions): NativeResolvedStyleMap {
    return buildResolvedStyleMap(
        nodes,
        options,
        [],
        new WeakMap<NativeElementNode, Record<string, NativePropValue>>(),
        buildGlobalInheritedTextStyles(options),
    );
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

    if (node.component === 'TextInput') {
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
): NativeResolvedStyleMap {
    for (const node of nodes) {
        if (node.kind !== 'element') {
            continue;
        }

        const scope: NativeStyleScope = {
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
            options,
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
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): Record<string, NativePropValue> | undefined {
    const mappedStyle = resolvedStyles?.get(node);
    if (mappedStyle) {
        return mappedStyle;
    }

    const classStyles = styles.resolveNativeStyles({
        tagName: node.sourceTag,
        classNames: getClassList(node),
        attributes: getSelectorAttributes(node),
        pseudoStates: getNativePseudoStates(node),
    }, [], styleResolveOptions) as Record<string, NativePropValue>;
    const globalInheritedTextStyles = buildGlobalInheritedTextStyles(styleResolveOptions);
    const inlineStyle = getInlineStyleObject(node);
    const hasClassStyles = Object.keys(classStyles).length > 0;
    const hasGlobalInheritedTextStyles = Object.keys(globalInheritedTextStyles).length > 0;

    if (inlineStyle) {
        return {
            ...globalInheritedTextStyles,
            ...(hasClassStyles ? classStyles : {}),
            ...inlineStyle,
        };
    }

    if (!hasClassStyles && !hasGlobalInheritedTextStyles) {
        return undefined;
    }

    return {
        ...globalInheritedTextStyles,
        ...(hasClassStyles ? classStyles : {}),
    };
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

    const explicitWidth = toScaledUnitNumber(style?.width ?? style?.minWidth, styleResolveOptions);
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

    const viewportWidth = styleResolveOptions.viewportWidth ?? 390;
    const rowGap = toScaledUnitNumber(style.rowGap ?? style.gap, styleResolveOptions);
    const columnGap = toScaledUnitNumber(style.columnGap ?? style.gap, styleResolveOptions) ?? rowGap ?? 0;
    const display = typeof style.display === 'string' ? style.display.trim().toLowerCase() : undefined;

    if (display === 'grid' || display === 'inline-grid') {
        const weights = resolveGridTrackWeights(style.gridTemplateColumns, styleResolveOptions, columnGap);
        if (weights && weights.length > 1) {
            return {
                kind: 'grid',
                rows: chunkNodesIntoGridRows(node.children, weights),
                rowGap,
                columnGap,
            };
        }
    }

    if (isWrapEnabled(style) && isRowFlexLayout(style)) {
        const availableWidth = Math.max(160, viewportWidth - estimateHorizontalPadding(style, styleResolveOptions));
        const rows = chunkNodesIntoWrappedRows(node.children, availableWidth, columnGap, resolvedStyles, styleResolveOptions);
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
        || parseBorderValue(style.border, (value) => toDpLiteral(value, styleResolveOptions)) !== undefined
        || parseBoxShadow(style.boxShadow) !== undefined;
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
    const background = typeof style.background === 'string' && /^linear-gradient\(/i.test(style.background.trim())
        ? undefined
        : parseCssColor(style.background);
    const resolved = parseCssColor(style.backgroundColor) ?? background;
    const backdropBlur = resolved ? resolveBackdropBlurRadius(style, styleResolveOptions) : undefined;

    if (!resolved || backdropBlur === undefined || resolved.alpha >= 1) {
        return resolved;
    }

    return liftColorAlpha(resolved, Math.min(0.14, backdropBlur / 160));
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
        const width = toDpLiteral(style.width, styleResolveOptions);
        const height = toDpLiteral(style.height, styleResolveOptions);
        const minWidth = toDpLiteral(style.minWidth, styleResolveOptions);
        const maxWidth = toDpLiteral(style.maxWidth, styleResolveOptions);
        const minHeight = toDpLiteral(style.minHeight, styleResolveOptions);
        const maxHeight = toDpLiteral(style.maxHeight, styleResolveOptions);
        const radius = toDpLiteral(style.borderRadius, styleResolveOptions);
        const backgroundGradient = resolveBackgroundGradient(style);
        const backdropBlur = resolveBackdropBlurRadius(style, styleResolveOptions);
        const backgroundColor = resolveBackgroundColor(style, styleResolveOptions);
        const border = parseBorderValue(style.border, (value) => toDpLiteral(value, styleResolveOptions));
        const shadow = parseBoxShadow(style.boxShadow);
        const marginCalls = buildComposeMarginPaddingCalls(style, styleResolveOptions);
        const autoMarginCalls = buildComposeAutoMarginCalls(style);
        const shouldForceAutoMarginFillWidth = shouldCenterConstrainedHorizontalAutoMargins(style);
        const paddingCalls: string[] = [];
        const flexValue = typeof style.flex === 'number'
            ? style.flex
            : typeof style.flex === 'string' && /^-?\d+(?:\.\d+)?$/.test(style.flex.trim())
                ? Number(style.flex)
                : typeof style.flexGrow === 'number'
                    ? style.flexGrow
                    : undefined;

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

        if (isFillValue(style.width)) {
            parts.push('fillMaxWidth()');
        } else if (width) {
            parts.push(`width(${width})`);
        } else if (hints.fillWidth && !shouldForceAutoMarginFillWidth) {
            parts.push('fillMaxWidth()');
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
            if (radius) {
                parts.push(`border(${border.width}, ${toComposeColorLiteral(border.color)}, RoundedCornerShape(${radius}))`);
            } else {
                parts.push(`border(${border.width}, ${toComposeColorLiteral(border.color)})`);
            }
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
): string[] {
    const lines: string[] = [];
    for (const child of nodes) {
        const childHints = parentLayout === 'Column' && shouldDefaultFillWidthHint(child, context.resolvedStyles, context.styleResolveOptions)
            ? { fillWidth: true }
            : {};
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
): string[] {
    const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
    const outerGap = layout.rowGap !== undefined ? `Arrangement.spacedBy(${formatFloat(layout.rowGap)}.dp)` : undefined;

    if (layout.kind === 'grid' && layout.rows.length === 1) {
        const [row] = layout.rows;
        const lines = [`${indent(level)}Row(${buildComposeChunkedRowArguments(style, modifier, layout.columnGap)}) {`];
        row.items.forEach((child, index) => {
            const weight = row.weights?.[index];
            const cellModifier = weight !== undefined
                ? `Modifier.weight(${formatFloat(weight)}f).fillMaxWidth()`
                : 'Modifier';
            lines.push(`${indent(level + 1)}Box(modifier = ${cellModifier}) {`);
            lines.push(...renderComposeNode(child, level + 2, context, { fillWidth: shouldFillChunkedCellChild(child) }));
            lines.push(`${indent(level + 1)}}`);
        });
        lines.push(`${indent(level)}}`);
        return lines;
    }

    const lines = [`${indent(level)}Column(modifier = ${modifier}${outerGap ? `, verticalArrangement = ${outerGap}` : ''}) {`];
    for (const row of layout.rows) {
        lines.push(`${indent(level + 1)}Row(${buildComposeChunkedRowArguments(style, 'Modifier.fillMaxWidth()', layout.columnGap)}) {`);
        row.items.forEach((child, index) => {
            const weight = row.weights?.[index];
            const fillChild = layout.kind === 'grid' && shouldFillChunkedCellChild(child);
            const cellModifier = weight !== undefined
                ? `Modifier.weight(${formatFloat(weight)}f)${fillChild ? '.fillMaxWidth()' : ''}`
                : 'Modifier';
            lines.push(`${indent(level + 2)}Box(modifier = ${cellModifier}) {`);
            lines.push(...renderComposeNode(child, level + 3, context, fillChild ? { fillWidth: true } : {}));
            lines.push(`${indent(level + 2)}}`);
        });
        lines.push(`${indent(level + 1)}}`);
    }
    lines.push(`${indent(level)}}`);
    return lines;
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

    const chunkedLayout = resolveChunkedLayout(node, context.resolvedStyles, context.styleResolveOptions);
    if (chunkedLayout) {
        lines.push(...renderComposeChunkedLayout(node, chunkedLayout, level, context, modifier));
        return lines;
    }

    const layout = resolveComposeLayout(node, context.resolvedStyles);
    lines.push(`${indent(level)}${layout}(${buildComposeLayoutArguments(node, layout, modifier, context.resolvedStyles, context.styleResolveOptions)}) {`);
    lines.push(...renderComposeChildren(node.children, level + 1, context, layout));
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
        const width = toPointLiteral(style.width, styleResolveOptions);
        const height = toPointLiteral(style.height, styleResolveOptions);
        const minWidth = toPointLiteral(style.minWidth, styleResolveOptions);
        const maxWidth = toPointLiteral(style.maxWidth, styleResolveOptions);
        const minHeight = toPointLiteral(style.minHeight, styleResolveOptions);
        const maxHeight = toPointLiteral(style.maxHeight, styleResolveOptions);
        const radius = toPointLiteral(style.borderRadius, styleResolveOptions);
        const backgroundGradient = resolveBackgroundGradient(style);
        const backdropBlur = resolveBackdropBlurRadius(style, styleResolveOptions);
        const backgroundColor = resolveBackgroundColor(style, styleResolveOptions);
        const border = parseBorderValue(style.border, (value) => toPointLiteral(value, styleResolveOptions));
        const shadow = parseBoxShadow(style.boxShadow);
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
        if (isFillValue(style.width)) {
            if (!hasAutoMarginMaxWidth) {
                frameArgs.push('maxWidth: .infinity');
            }
        } else if (width) {
            frameArgs.push(`width: ${width}`);
        } else if (hints.fillWidth && !hasAutoMarginMaxWidth) {
            frameArgs.push('maxWidth: .infinity');
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

        if (border?.width && border.color) {
            const radiusValue = radius ?? '0';
            modifiers.push(`.overlay(RoundedRectangle(cornerRadius: ${radiusValue}).stroke(${toSwiftColorLiteral(border.color)}, lineWidth: ${border.width}))`);
        }

        if (shadow) {
            modifiers.push(`.shadow(color: ${toSwiftColorLiteral(shadow.color)}, radius: ${toSwiftShadowRadius(shadow)}, x: ${formatFloat(shadow.offsetX)}, y: ${formatFloat(shadow.offsetY)})`);
        }

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

function resolveSwiftRowAlignment(style: Record<string, NativePropValue> | undefined): string {
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
        return `HStack(alignment: ${resolveSwiftRowAlignment(style)}, spacing: ${spacing})`;
    }

    return `VStack(alignment: ${resolveSwiftColumnAlignment(style)}, spacing: ${spacing})`;
}

function renderSwiftChunkedLayout(
    node: NativeElementNode,
    layout: NativeChunkedLayout,
    level: number,
    context: SwiftUIContext,
): string[] {
    const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
    const rowSpacing = layout.rowGap !== undefined ? formatFloat(layout.rowGap) : '12';
    const columnSpacing = layout.columnGap !== undefined ? formatFloat(layout.columnGap) : '12';
    const rowAlignment = resolveSwiftRowAlignment(style);
    const columnAlignment = resolveSwiftColumnAlignment(style);

    if (layout.kind === 'grid' && layout.rows.length === 1) {
        const [row] = layout.rows;
        const lines = [`${indent(level)}HStack(alignment: ${rowAlignment}, spacing: ${columnSpacing}) {`];
        row.items.forEach((child, index) => {
            lines.push(`${indent(level + 1)}VStack(alignment: .leading, spacing: 0) {`);
            lines.push(...renderSwiftUINode(child, level + 2, context, { fillWidth: shouldFillChunkedCellChild(child) }));
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
        lines.push(`${indent(level + 1)}HStack(alignment: ${rowAlignment}, spacing: ${columnSpacing}) {`);
        row.items.forEach((child, index) => {
            const fillChild = layout.kind === 'grid' && shouldFillChunkedCellChild(child);
            lines.push(`${indent(level + 2)}VStack(alignment: .leading, spacing: 0) {`);
            lines.push(...renderSwiftUINode(child, level + 3, context, fillChild ? { fillWidth: true } : {}));
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

function renderSwiftUIChildren(
    nodes: NativeNode[],
    level: number,
    context: SwiftUIContext,
    parentLayout?: 'VStack' | 'HStack',
): string[] {
    const lines: string[] = [];
    for (const child of nodes) {
        const childHints = parentLayout === 'VStack' && shouldDefaultFillWidthHint(child, context.resolvedStyles, context.styleResolveOptions)
            ? { fillWidth: true }
            : {};
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
        const layoutKind = resolveSwiftUILayout(node, context.resolvedStyles);
        const layout = buildSwiftUILayout(node, layoutKind, context.resolvedStyles, context.styleResolveOptions);
        const contentLines = [
            `${indent(level + 1)}${layout} {`,
            ...renderSwiftUIChildren(node.children, level + 2, context, layoutKind),
            `${indent(level + 1)}}`,
        ];
        const screenContent = appendSwiftUIModifiers(contentLines, buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions), level + 1);
        return [
            ...baseLines,
            `${indent(level)}ScrollView {`,
            ...screenContent,
            `${indent(level)}}`,
            `${indent(level + 1)}.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)`,
        ];
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

    const chunkedLayout = resolveChunkedLayout(node, context.resolvedStyles, context.styleResolveOptions);
    if (chunkedLayout) {
        return [...baseLines, ...renderSwiftChunkedLayout(node, chunkedLayout, level, context)];
    }

    const layoutKind = resolveSwiftUILayout(node, context.resolvedStyles);
    const layout = buildSwiftUILayout(node, layoutKind, context.resolvedStyles, context.styleResolveOptions);
    const lines = [
        ...baseLines,
        `${indent(level)}${layout} {`,
        ...renderSwiftUIChildren(node.children, level + 1, context, layoutKind),
        `${indent(level)}}`,
    ];
    return appendSwiftUIModifiers(lines, buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions), level);
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
        ? renderComposeNode(tree.roots[0], 1, context)
        : [
            '    Column(modifier = Modifier.fillMaxSize()) {',
            ...renderComposeChildren(tree.roots, 2, context, 'Column'),
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
        lines.push('import androidx.compose.ui.draw.shadow');
        lines.push('import androidx.compose.material3.*');
        lines.push('import androidx.compose.runtime.*');
        lines.push('import androidx.compose.foundation.shape.RoundedCornerShape');
        lines.push('import androidx.compose.ui.Alignment');
        lines.push('import androidx.compose.ui.Modifier');
        lines.push('import androidx.compose.ui.graphics.Brush');
        lines.push('import androidx.compose.ui.graphics.Color');
        lines.push('import androidx.compose.ui.graphics.SolidColor');
        if (context.helperFlags.has('uriHandler')) {
            lines.push('import androidx.compose.ui.platform.LocalUriHandler');
        }
        lines.push('import androidx.compose.ui.text.font.FontFamily');
        lines.push('import androidx.compose.ui.text.font.FontWeight');
        lines.push('import androidx.compose.ui.text.style.TextDecoration');
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
        ? renderSwiftUINode(tree.roots[0], 2, context)
        : [
            `${indent(2)}VStack(alignment: .leading, spacing: 12) {`,
            ...renderSwiftUIChildren(tree.roots, 3, context, 'VStack'),
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
