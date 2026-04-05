import { type NativeStyleResolveOptions } from './style';
import type { NativeNode, NativePropValue } from './native-types';
import { isFillValue, parseBoxShadowList, resolveBackdropBlurRadius, resolveStyleCurrentColor } from './native-color';
import { parseCssUnitValue, resolveAxisUnitNumber, toDpLiteral, toScaledUnitNumber, getNativeStyleResolveOptions } from './native-units';
import { flattenTextContent } from './native-strings';
import { estimateHorizontalPadding, estimateVerticalPadding } from './native-spacing';
import { resolveNativeBackgroundLayersFromStyle } from './native-background';
import { resolveNativeBorder } from './native-border';

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

export function shouldFillChunkedCellChild(node: NativeNode): boolean {
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

export function shouldDefaultFillWidthHint(
    node: NativeNode,
    style: Record<string, NativePropValue> | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): boolean {
    if (node.kind !== 'element' || !shouldFillChunkedCellChild(node)) {
        return false;
    }

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

export function estimateNodePreferredWidth(
    node: NativeNode,
    style: Record<string, NativePropValue> | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
): number {
    if (node.kind === 'text') {
        return Math.max(48, node.value.trim().length * 8);
    }

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

export function estimateNodePreferredHeight(
    node: NativeNode,
    style: Record<string, NativePropValue> | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
): number | undefined {
    if (node.kind === 'text') {
        return undefined;
    }

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