import { ELIT_NATIVE_BINDING, type NativeBindingMetadata } from './state';
import styles, { type NativeStyleResolveOptions } from './style';
import type { Child, Props, VNode } from './types';
import type {
    NativePlatform, NativePropObject, NativePropValue,
    NativeTextNode, NativeElementNode, NativeNode, NativeTree,
    NativeTransformOptions, AndroidComposeOptions, SwiftUIOptions,
    NativeResolvedStyleMap, NativeStyleContextMap,
    NativeStyleScope, NativeRenderHints, NativeChunkedRow,
    NativeGridTrackSizeSpec, NativeGridColumnTrackSizeSpec,
    NativeGridTemplateAreaPlacement, NativeChunkedLayout,
    StateLike, NativeStateValueType, NativeStateDescriptor, NativeBindingReference,
    NativeTransformContext,
    AndroidComposeContext, SwiftUIContext,
} from './native-types';
import {
    formatFloat,
    toDpLiteral, toPointLiteral,
    parsePlainNumericValue, resolveFlexStyleValues,
    resolveOpacityValue, resolveAspectRatioValue,
    resolveAxisReferenceLength, resolveAxisUnitNumber, toAxisDpLiteral, toAxisPointLiteral,
    shouldClipNativeOverflow, toScaledUnitNumber,
    getNativeStyleResolveOptions,
} from './native-units';
import {
    getDefaultCurrentColor, resolveStyleCurrentColor, normalizeResolvedCurrentTextColor,
    parseCssColor,
    toComposeColorLiteral, toSwiftColorLiteral, toComposeBrushLiteral, toSwiftGradientLiteral,
    parseBoxShadowList, toComposeShadowElevation, toSwiftShadowRadius,
    resolveBackdropBlurRadius,
    isFillValue,
} from './native-color';
import { resolveNativeDownloadSuggestedName, shouldNativeDownloadLink, isExternalDestination } from './native-link';
import {
    resolveNativeObjectFitStyle, resolveNativeObjectPositionStyle,
    resolveNativeBackgroundLayersFromStyle,
    resolveBackgroundColor, resolveBackgroundGradient,
    stripNativeBackgroundPaintStyles,
} from './native-background';
import { parseNativeTransform } from './native-transform';
import {
    isCheckboxInput, isRangeInput,
    toNativeBoolean,
    buildComposeButtonModifier,
    buildComposeTextInputArgsFromStyle,
    buildSwiftUIButtonModifiersFromStyle,
    isNativeDisabled, isNativeEnabled, isNativeChecked, isNativeSelected, isNativeActive, isNativeRequired, isNativeMultiple,
    isNativeReadOnlyState, isNativePlaceholderShown, isNativeReadWrite, isNativeElementEmpty, isNativeFocusWithin, isNativeInvalid, isNativeValid, isNativeOptional, isNativeReadOnly, isNativePseudoFocused, shouldNativeAutoFocus,
    isNativeMuted, shouldNativeShowVideoControls, resolveNativeVideoPoster, shouldNativePlayInline, resolveNativeMediaLabel,
    resolveImageFallbackLabel,
    buildComposeAccessibilityModifier, buildSwiftAccessibilityModifiers, resolveNativeAccessibilityLabel,
    resolveNativeTextInputType, resolveNativeRangeMin, resolveNativeRangeMax, resolveNativeRangeInitialValue, resolveNativeStepConstraint, resolveComposeSliderSteps, resolveSwiftKeyboardTypeModifier, shouldDisableNativeTextCapitalization,
    serializeNativePayload, resolveNativeAction, resolveNativeRoute, buildComposeBridgeInvocation, buildSwiftBridgeInvocation,
    buildComposeControlEventDispatchInvocation, buildComposeControlEventDispatchStatements, buildSwiftControlEventDispatchInvocation, buildSwiftControlEventDispatchStatements,
    getNativeBindingReference,
    resolveNativePickerOptionLabel, resolveNativePickerOptions, resolveNativePickerInitialSelection, resolveNativePickerInitialSelections,
    resolveNativePickerDisplayLabel, buildComposePickerLabelExpression,
    resolveNativeProgressFraction, resolveNativeSurfaceSource,
} from './native-interaction';
import { escapeKotlinString, quoteKotlinString, escapeSwiftString, quoteSwiftString, flattenTextContent } from './native-strings';
import {
    buildNativeVectorSpec, buildNativeCanvasSpec, buildNativeCanvasDrawingSpec, attachDesktopNativeMetadata,
} from './native-vector';
import {
    estimateNodePreferredWidth as estimateResolvedNodePreferredWidth,
    estimateNodePreferredHeight as estimateResolvedNodePreferredHeight,
    shouldFillChunkedCellChild,
    shouldDefaultFillWidthHint as estimateDefaultFillWidthHint,
} from './native-estimation';
import {
    resolveNativeStretchChunkedRows,
    resolveEffectiveChunkedContentAlignment,
    buildComposeChunkedRowArguments,
    buildComposeChunkedTrackModifier,
    hasNativeGridColumnConstraint,
    buildComposeGridCellModifier,
    resolveComposeGridCellContentAlignment,
    buildComposeChunkedColumnArrangement,
    shouldRenderNativeBackgroundLayersWithWrapper,
    buildComposeBackgroundLayerInvocation,
    appendSwiftUIBackgroundLayers,
    buildSwiftChunkedRowModifiers,
    resolveSwiftGridCellFrameAlignment,
    resolveNativeGridCellFillWidth,
    buildSwiftGridCellFrameModifier,
    appendSwiftUIModifiers,
    appendSwiftUIOverlays,
} from './native-render-support';
import {
    prependComposeModifierCall,
    buildComposeCanvasSurfaceLines,
    buildComposeVectorCanvasLines,
    buildSwiftCanvasSurfaceLines,
    buildSwiftVectorCanvasLines,
} from './native-canvas';
import {
    createNativeStateDescriptorMap,
    ensureComposeStateVariable,
    ensureSwiftStateVariable,
    toComposeTextValueExpression,
    toSwiftTextValueExpression,
    buildComposeStateStringAssignment,
    buildSwiftStateStringAssignment,
    buildComposeStateStringArrayToggleAssignment,
    buildSwiftStringBindingExpression,
    buildSwiftStateStringArrayToggleBinding,
    buildSwiftReadOnlyBindingExpression,
    buildComposeTextExpression,
    buildSwiftTextExpression,
    formatNativeNumberLiteral,
} from './native-state';
import {
    resolveNativeBorder,
    buildComposeSideBorderModifier,
    buildComposeUniformStyledBorderModifier,
    buildSwiftSideBorderOverlay,
    buildSwiftUniformStyledBorderModifier,
} from './native-border';
import {
    resolveDirectionalSpacing,
    buildComposeMarginPaddingCalls,
    buildSwiftMarginPaddingModifiers,
    shouldCenterConstrainedHorizontalAutoMargins,
    buildComposeAutoMarginCalls,
    buildSwiftAutoMarginModifiers,
    estimateHorizontalPadding,
} from './native-spacing';
import {
    parseNativeGridTrackDefinition,
    parseGridTrackSizeSpec,
    parseGridColumnTrackSizeSpec,
    resolveGridTrackSizeSpecs,
    resolveGridColumnTrackSizeSpecs,
    isWrapEnabled,
    isRowFlexLayout,
    resolveGridTrackCount,
    resolveNativeGridTemplateAreaPlacements,
    resolveNativeGridAutoFlow,
    parseNativeGridLineIndexValue,
    parseNativeGridSpanValue,
    resolveNativeGridPlacementValue,
    resolveNativeGridAreaPlacement,
    createNativeGridPlaceholderNode,
} from './native-grid';
import {
    resolveSwiftFontDesign,
    resolveSwiftLineSpacing,
    resolveTextTransform,
    buildComposeTextStyleArgsFromStyle,
    buildComposeLabelTextFromStyle,
    resolveSwiftTextDecoration,
    applyTextTransform,
    resolveSwiftFontWeight,
    resolveSwiftTextAlign,
} from './native-typography';
import {
    resolveNativeAlignContent,
    resolvePositionMode,
    resolveCrossAlignmentKeyword,
    resolveBaselineAlignmentKeyword,
    resolveSelfAlignmentKeyword,
    resolveComposeSelfAlignmentCall,
    resolveSwiftSelfAlignmentModifier,
    resolveSwiftColumnAlignment,
    resolveSwiftRowAlignmentFromStyle,
    resolveRowBaselineAlignmentValues,
    resolveNativeGridCellAlignmentFromStyle,
    resolveComposeLayoutFromStyle,
    resolveSwiftUILayoutFromStyle,
    buildComposeLayoutArgumentsFromStyle,
    buildSwiftUILayoutFromStyle,
    hasExplicitNativeWidthStyle,
    hasExplicitNativeHeightStyle,
    hasNativeTableLayoutSourceTag,
    resolvePositionInsets,
    resolveNativeContainerScope,
} from './native-layout';
export type {
    NativePlatform, NativePropScalar, NativePropObject, NativePropValue,
    NativeTextNode, NativeElementNode, NativeNode, NativeTree,
    NativeTransformOptions, AndroidComposeOptions, SwiftUIOptions,
    NativeCanvasPoint, NativeCanvasDrawOperation,
} from './native-types';

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

function estimateNodePreferredWidth(
    node: NativeNode,
    resolvedStyles: NativeResolvedStyleMap | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
): number {
    const style = node.kind === 'element'
        ? getStyleObject(node, resolvedStyles, styleResolveOptions)
        : undefined;
    return estimateResolvedNodePreferredWidth(node, style, styleResolveOptions);
}

function estimateNodePreferredHeight(
    node: NativeNode,
    resolvedStyles: NativeResolvedStyleMap | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
): number | undefined {
    const style = node.kind === 'element'
        ? getStyleObject(node, resolvedStyles, styleResolveOptions)
        : undefined;
    return estimateResolvedNodePreferredHeight(node, style, styleResolveOptions);
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

function buildComposeLabelText(
    node: NativeElementNode,
    label: string,
    resolvedStyles?: NativeResolvedStyleMap,
    expression?: string,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string {
    return buildComposeLabelTextFromStyle(
        label,
        getStyleObject(node, resolvedStyles, styleResolveOptions),
        expression,
        styleResolveOptions,
    );
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
        const shouldDefaultFillCrossAxis = estimateDefaultFillWidthHint(
            child,
            child.kind === 'element'
                ? getStyleObject(child, context.resolvedStyles, context.styleResolveOptions)
                : undefined,
            context.styleResolveOptions,
        );
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

    if (layout.kind === 'grid' && layout.rows.length === 1 && !usesSingleRowGridStackAlignment) {
        const [row] = layout.rows;
        const lines = [`${indent(level)}Row(${buildComposeChunkedRowArguments(style, buildComposeChunkedTrackModifier(modifier, row), layout.columnGap, context.styleResolveOptions)}) {`];
        const totalWeight = row.weights ? row.weights.reduce<number>((sum, entry) => sum + (entry ?? 0), 0) : undefined;
        row.items.forEach((child, index) => {
            const weight = row.weights?.[index];
            const columnSize = row.columnSizes?.[index];
            const baseFillChild = shouldFillChunkedCellChild(child);
            const cellAlignment = resolveNativeGridCellAlignmentFromStyle(
                child.kind === 'element'
                    ? getStyleObject(child, context.resolvedStyles, context.styleResolveOptions)
                    : undefined,
                style,
            );
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
        lines.push(`${indent(level + 1)}Row(${buildComposeChunkedRowArguments(style, buildComposeChunkedTrackModifier('Modifier.fillMaxWidth()', row), layout.columnGap, context.styleResolveOptions)}) {`);
        row.items.forEach((child, index) => {
            const weight = row.weights?.[index];
            const columnSize = row.columnSizes?.[index];
            const baseFillChild = layout.kind === 'grid' && shouldFillChunkedCellChild(child);
            const cellAlignment = layout.kind === 'grid'
                ? resolveNativeGridCellAlignmentFromStyle(
                    child.kind === 'element'
                        ? getStyleObject(child, context.resolvedStyles, context.styleResolveOptions)
                        : undefined,
                    style,
                )
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

    const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
    const layout = resolveComposeLayoutFromStyle(node.component, style);
    return [
        `${indent(level)}${layout}(${buildComposeLayoutArgumentsFromStyle(layout, modifier, style, context.styleResolveOptions)}) {`,
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
    const backgroundLayers = resolveNativeBackgroundLayersFromStyle(style, context.styleResolveOptions);
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
        args.push(...buildComposeTextStyleArgsFromStyle(style, context.styleResolveOptions));
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
        const textInputStyle = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);

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

        const textInputArgs = buildComposeTextInputArgsFromStyle(
            node,
            textInputStyle,
            submitEventStatement,
            context.styleResolveOptions,
        );
        textInputArgs.forEach((arg) => {
            lines.push(`${indent(level + 1)}${arg},`);
        });

        if (typeof node.props.placeholder === 'string') {
            const placeholderArgs = buildComposeTextStyleArgsFromStyle(textInputStyle, context.styleResolveOptions)
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
        const imageStyle = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
        const objectFit = resolveNativeObjectFitStyle(imageStyle);
        const objectPosition = resolveNativeObjectPositionStyle(imageStyle);
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
        const spec = buildNativeVectorSpec(node);
        if (spec) {
            const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
            return [...lines, ...buildComposeVectorCanvasLines(
                spec,
                level,
                modifier,
                hasExplicitNativeWidthStyle(style),
                hasExplicitNativeHeightStyle(style),
            )];
        }
    }

    if (node.component === 'Canvas') {
        const drawingSpec = buildNativeCanvasDrawingSpec(node);
        const spec = drawingSpec ?? buildNativeCanvasSpec(node);
        const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
        return [...lines, ...buildComposeCanvasSurfaceLines(
            spec,
            drawingSpec,
            level,
            modifier,
            hasExplicitNativeWidthStyle(style),
            hasExplicitNativeHeightStyle(style),
        )];
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
                const mediaStyle = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
                const posterFit = node.sourceTag === 'video' ? resolveNativeObjectFitStyle(mediaStyle) : 'cover';
                const posterPosition = node.sourceTag === 'video' ? resolveNativeObjectPositionStyle(mediaStyle) : 'center';
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

function resolveSwiftRowAlignment(
    style: Record<string, NativePropValue> | undefined,
    children: NativeNode[] = [],
    resolvedStyles?: NativeResolvedStyleMap,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string {
    return resolveSwiftRowAlignmentFromStyle(
        style,
        resolveRowBaselineAlignmentValues(
            children.flatMap((child) => child.kind === 'element' && child.component === 'Text'
                ? [getStyleObject(child, resolvedStyles, styleResolveOptions)?.alignSelf]
                : []),
        ),
    );
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

    if (layout.kind === 'grid' && layout.rows.length === 1 && !usesSingleRowGridStackAlignment) {
        const [row] = layout.rows;
        const lines = [`${indent(level)}HStack(alignment: ${rowAlignment}, spacing: ${columnSpacing}) {`];
        const totalWeight = row.weights ? row.weights.reduce<number>((sum, entry) => sum + (entry ?? 0), 0) : undefined;
        row.items.forEach((child, index) => {
            const weight = row.weights?.[index];
            const columnSize = row.columnSizes?.[index];
            const cellAlignment = resolveNativeGridCellAlignmentFromStyle(
                child.kind === 'element'
                    ? getStyleObject(child, context.resolvedStyles, context.styleResolveOptions)
                    : undefined,
                style,
            );
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
        lines.push(...buildSwiftChunkedRowModifiers(row).map((modifier) => `${indent(level + 1)}${modifier}`));
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
                ? resolveNativeGridCellAlignmentFromStyle(
                    child.kind === 'element'
                        ? getStyleObject(child, context.resolvedStyles, context.styleResolveOptions)
                        : undefined,
                    style,
                )
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
        lines.push(...buildSwiftChunkedRowModifiers(row).map((modifier) => `${indent(level + 2)}${modifier}`));
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

function renderSwiftUIContainerBody(
    node: NativeElementNode,
    level: number,
    context: SwiftUIContext,
    hints: NativeRenderHints,
): string[] {
    const contentLines = renderSwiftUIContainerContent(node, level, context, hints);
    const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
    const backgroundLayers = resolveNativeBackgroundLayersFromStyle(style, context.styleResolveOptions);
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

    const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
    const layoutKind = resolveSwiftUILayoutFromStyle(node.component, style);
    const layout = buildSwiftUILayoutFromStyle(
        layoutKind,
        node.sourceTag,
        style,
        resolveSwiftRowAlignment(style, node.children, context.resolvedStyles, context.styleResolveOptions),
        context.styleResolveOptions,
    );
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
        const shouldDefaultFillCrossAxis = estimateDefaultFillWidthHint(
            child,
            child.kind === 'element'
                ? getStyleObject(child, context.resolvedStyles, context.styleResolveOptions)
                : undefined,
            context.styleResolveOptions,
        );
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

            return appendSwiftUIModifiers(
                lines,
                buildSwiftUIButtonModifiersFromStyle(
                    node,
                    buildSwiftUIModifiers(node, resolvedStyles, {}, context.styleResolveOptions),
                    getStyleObject(node, resolvedStyles, context.styleResolveOptions),
                ),
                level,
            );
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

            return appendSwiftUIModifiers(
                lines,
                buildSwiftUIButtonModifiersFromStyle(
                    node,
                    buildSwiftUIModifiers(node, resolvedStyles, {}, context.styleResolveOptions),
                    getStyleObject(node, resolvedStyles, context.styleResolveOptions),
                ),
                level,
            );
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
        const imageStyle = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
        const objectFit = resolveNativeObjectFitStyle(imageStyle);
        const objectPosition = resolveNativeObjectPositionStyle(imageStyle);
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
        const spec = buildNativeVectorSpec(node);
        if (spec) {
            const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
            const vectorCanvas = buildSwiftVectorCanvasLines(
                spec,
                level,
                buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions),
                hasExplicitNativeWidthStyle(style),
                hasExplicitNativeHeightStyle(style),
            );
            return appendSwiftUIModifiers([...baseLines, ...vectorCanvas.lines], vectorCanvas.modifiers, level);
        }
    }

    if (node.component === 'Canvas') {
        const drawingSpec = buildNativeCanvasDrawingSpec(node);
        const spec = drawingSpec ?? buildNativeCanvasSpec(node);
        const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
        const canvasSurface = buildSwiftCanvasSurfaceLines(
            spec,
            drawingSpec,
            level,
            buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions),
            hasExplicitNativeWidthStyle(style),
            hasExplicitNativeHeightStyle(style),
        );
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
            const mediaStyle = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
            const posterFit = node.sourceTag === 'video' ? resolveNativeObjectFitStyle(mediaStyle) : 'cover';
            const posterPosition = node.sourceTag === 'video' ? resolveNativeObjectPositionStyle(mediaStyle) : 'center';
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
        const flowStyle = getStyleObject(flowNode, context.resolvedStyles, context.styleResolveOptions);
        const layoutKind = resolveSwiftUILayoutFromStyle(flowNode.component, flowStyle);
        const layout = buildSwiftUILayoutFromStyle(
            layoutKind,
            flowNode.sourceTag,
            flowStyle,
            resolveSwiftRowAlignment(flowStyle, flowNode.children, context.resolvedStyles, context.styleResolveOptions),
            context.styleResolveOptions,
        );
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