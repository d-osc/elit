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

type NativeHelperFlag = 'imagePlaceholder' | 'unsupportedPlaceholder' | 'uriHandler' | 'openUrlHandler';

interface StateLike<T = unknown> {
    value: T;
    subscribe: (listener: (value: T) => void) => () => void;
}

interface AndroidComposeContext {
    textFieldIndex: number;
    toggleIndex: number;
    stateDeclarations: string[];
    helperFlags: Set<NativeHelperFlag>;
}

interface SwiftUIContext {
    textFieldIndex: number;
    toggleIndex: number;
    stateDeclarations: string[];
    helperFlags: Set<NativeHelperFlag>;
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

function buildComposeModifier(node: NativeElementNode): string {
    const parts = ['Modifier'];
    if (node.component === 'Screen') {
        parts.push('fillMaxSize()');
    }

    const style = node.props.style;
    if (style && typeof style === 'object' && !Array.isArray(style)) {
        const padding = toDpLiteral(style.padding);
        const paddingHorizontal = toDpLiteral(style.paddingHorizontal);
        const paddingVertical = toDpLiteral(style.paddingVertical);
        const width = toDpLiteral(style.width);
        const height = toDpLiteral(style.height);

        if (padding) {
            parts.push(`padding(${padding})`);
        } else {
            const paddingArgs: string[] = [];
            const top = toDpLiteral(style.paddingTop);
            const right = toDpLiteral(style.paddingRight ?? style.paddingEnd);
            const bottom = toDpLiteral(style.paddingBottom);
            const left = toDpLiteral(style.paddingLeft ?? style.paddingStart);

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

        if (width) parts.push(`width(${width})`);
        if (height) parts.push(`height(${height})`);
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

function renderTextComposable(text: string, level: number): string[] {
    return [`${indent(level)}Text(text = ${quoteKotlinString(text)})`];
}

function renderComposeNode(node: NativeNode, level: number, context: AndroidComposeContext): string[] {
    if (node.kind === 'text') {
        return renderTextComposable(node.value, level);
    }

    const modifier = buildComposeModifier(node);
    const classComment = Array.isArray(node.props.classList) && node.props.classList.length > 0
        ? `${indent(level)}// classList: ${(node.props.classList as NativePropValue[]).map((item) => String(item)).join(' ')}`
        : undefined;
    const lines: string[] = [];
    if (classComment) lines.push(classComment);

    if (node.component === 'Text') {
        const text = flattenTextContent(node.children);
        return [...lines, `${indent(level)}Text(text = ${quoteKotlinString(text)})`];
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
        const actionComment = node.events.length > 0
            ? ` /* TODO: wire elit event(s): ${node.events.join(', ')} */ `
            : ' ';
        lines.push(`${indent(level)}Button(onClick = {${actionComment}}, modifier = ${modifier}) {`);
        lines.push(`${indent(level + 1)}Text(text = ${quoteKotlinString(label)})`);
        lines.push(`${indent(level)}}`);
        return lines;
    }

    if (node.component === 'Link') {
        const label = flattenTextContent(node.children) || String(node.props.destination ?? 'Link');
        const destination = typeof node.props.destination === 'string' ? node.props.destination : undefined;
        if (destination && isExternalDestination(destination)) {
            context.helperFlags.add('uriHandler');
            lines.push(`${indent(level)}TextButton(onClick = { uriHandler.openUri(${quoteKotlinString(destination)}) }, modifier = ${modifier}) {`);
        } else {
            const actionComment = destination ? ` /* TODO: navigate to ${escapeKotlinString(destination)} */ ` : ' ';
            lines.push(`${indent(level)}TextButton(onClick = {${actionComment}}, modifier = ${modifier}) {`);
        }
        lines.push(`${indent(level + 1)}Text(text = ${quoteKotlinString(label)})`);
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

    const layout = node.component === 'Row' || node.component === 'ListItem' ? 'Row' : 'Column';
    lines.push(`${indent(level)}${layout}(modifier = ${modifier}) {`);
    lines.push(...renderComposeChildren(node.children, level + 1, context));
    lines.push(`${indent(level)}}`);
    return lines;
}

function buildAndroidComposeHelpers(context: AndroidComposeContext): string[] {
    const helpers: string[] = [];

    if (context.helperFlags.has('imagePlaceholder')) {
        helpers.push('');
        helpers.push('@Composable');
        helpers.push('private fun ElitImagePlaceholder(source: String, contentDescription: String?, modifier: Modifier = Modifier) {');
        helpers.push('    Text(text = "Image: ${source}", modifier = modifier)');
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

function buildSwiftUIModifiers(node: NativeElementNode): string[] {
    const modifiers: string[] = [];

    if (node.component === 'Screen') {
        modifiers.push('.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)');
    }

    const style = node.props.style;
    if (style && typeof style === 'object' && !Array.isArray(style)) {
        const padding = toPointLiteral(style.padding);
        const paddingHorizontal = toPointLiteral(style.paddingHorizontal);
        const paddingVertical = toPointLiteral(style.paddingVertical);
        const width = toPointLiteral(style.width);
        const height = toPointLiteral(style.height);

        if (padding) {
            modifiers.push(`.padding(${padding})`);
        } else {
            const top = toPointLiteral(style.paddingTop);
            const right = toPointLiteral(style.paddingRight ?? style.paddingEnd);
            const bottom = toPointLiteral(style.paddingBottom);
            const left = toPointLiteral(style.paddingLeft ?? style.paddingStart);

            if (paddingHorizontal) modifiers.push(`.padding(.horizontal, ${paddingHorizontal})`);
            if (paddingVertical) modifiers.push(`.padding(.vertical, ${paddingVertical})`);
            if (top) modifiers.push(`.padding(.top, ${top})`);
            if (right) modifiers.push(`.padding(.trailing, ${right})`);
            if (bottom) modifiers.push(`.padding(.bottom, ${bottom})`);
            if (left) modifiers.push(`.padding(.leading, ${left})`);
        }

        const frameArgs: string[] = [];
        if (width) frameArgs.push(`width: ${width}`);
        if (height) frameArgs.push(`height: ${height}`);
        if (frameArgs.length > 0) {
            modifiers.push(`.frame(${frameArgs.join(', ')})`);
        }
    }

    return modifiers;
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
        const text = flattenTextContent(node.children);
        return appendSwiftUIModifiers(
            [...baseLines, `${indent(level)}Text(${quoteSwiftString(text)})`],
            buildSwiftUIModifiers(node),
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
            ['.labelsHidden()', ...buildSwiftUIModifiers(node)],
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
            ['.textFieldStyle(.roundedBorder)', ...buildSwiftUIModifiers(node)],
            level
        );
    }

    if (node.component === 'Button') {
        const label = flattenTextContent(node.children) || 'Button';
        const lines = [
            ...baseLines,
            `${indent(level)}Button(action: {`,
            `${indent(level + 1)}// TODO: wire elit event(s): ${node.events.join(', ') || 'press'}`,
            `${indent(level)}}) {`,
            `${indent(level + 1)}Text(${quoteSwiftString(label)})`,
            `${indent(level)}}`,
        ];
        return appendSwiftUIModifiers(lines, buildSwiftUIModifiers(node), level);
    }

    if (node.component === 'Link') {
        const label = flattenTextContent(node.children) || String(node.props.destination ?? 'Link');
        const destination = typeof node.props.destination === 'string' ? node.props.destination : 'destination';
        const lines = isExternalDestination(destination)
            ? [
                ...baseLines,
                `${indent(level)}Button(action: {`,
                `${indent(level + 1)}if let destination = URL(string: ${quoteSwiftString(destination)}) {`,
                `${indent(level + 2)}openURL(destination)`,
                `${indent(level + 1)}}`,
                `${indent(level)}}) {`,
                `${indent(level + 1)}Text(${quoteSwiftString(label)})`,
                `${indent(level)}}`,
            ]
            : [
                ...baseLines,
                `${indent(level)}Button(action: {`,
                `${indent(level + 1)}// TODO: navigate to ${escapeSwiftString(destination)}`,
                `${indent(level)}}) {`,
                `${indent(level + 1)}Text(${quoteSwiftString(label)})`,
                `${indent(level)}}`,
            ];
        if (isExternalDestination(destination)) {
            context.helperFlags.add('openUrlHandler');
        }
        return appendSwiftUIModifiers(lines, buildSwiftUIModifiers(node), level);
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
            buildSwiftUIModifiers(node),
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

    const layout = node.component === 'Row' || node.component === 'ListItem'
        ? 'HStack(alignment: .top, spacing: 12)'
        : 'VStack(alignment: .leading, spacing: 12)';
    const lines = [
        ...baseLines,
        `${indent(level)}${layout} {`,
        ...renderSwiftUIChildren(node.children, level + 1, context),
        `${indent(level)}}`,
    ];
    return appendSwiftUIModifiers(lines, buildSwiftUIModifiers(node), level);
}

function buildSwiftUIHelpers(context: SwiftUIContext): string[] {
    const helpers: string[] = [];

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
        lines.push('import androidx.compose.material3.*');
        lines.push('import androidx.compose.runtime.*');
        lines.push('import androidx.compose.ui.Modifier');
        if (context.helperFlags.has('uriHandler')) {
            lines.push('import androidx.compose.ui.platform.LocalUriHandler');
        }
        lines.push('import androidx.compose.ui.tooling.preview.Preview');
        lines.push('import androidx.compose.ui.unit.dp');
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
