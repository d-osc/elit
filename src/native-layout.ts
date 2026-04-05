import { type NativeStyleResolveOptions } from './style';
import type { NativeContentStackAlignment, NativeGridItemAlignment, NativePropValue, NativeRenderHints, NativeStyleScope } from './native-types';
import { isFillValue } from './native-color';
import { getNativeStyleResolveOptions, resolveAxisUnitNumber, toDpLiteral, toPointLiteral } from './native-units';

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

export function resolveNativeAlignContent(style: Record<string, NativePropValue> | undefined): NativeContentStackAlignment | undefined {
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

export function resolvePositionMode(value: NativePropValue | undefined): 'relative' | 'absolute' | 'fixed' | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = value.trim().toLowerCase();
    return normalized === 'relative' || normalized === 'absolute' || normalized === 'fixed'
        ? normalized
        : undefined;
}

export function hasExplicitNativeWidthStyle(style: Record<string, NativePropValue> | undefined): boolean {
    return Boolean(style && (style.width !== undefined || style.minWidth !== undefined || style.maxWidth !== undefined));
}

export function hasExplicitNativeHeightStyle(style: Record<string, NativePropValue> | undefined): boolean {
    return Boolean(style && (style.height !== undefined || style.minHeight !== undefined || style.maxHeight !== undefined));
}

export function hasNativeTableLayoutSourceTag(sourceTag: string | undefined): boolean {
    return sourceTag === 'table'
        || sourceTag === 'thead'
        || sourceTag === 'tbody'
        || sourceTag === 'tfoot'
        || sourceTag === 'tr'
        || sourceTag === 'td'
        || sourceTag === 'th';
}

export function resolvePositionInsets(
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

export function resolveNativeContainerScope(
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

export function resolveCrossAlignmentKeyword(
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

export function resolveBaselineAlignmentKeyword(value: NativePropValue | undefined): 'first' | 'last' | undefined {
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

export function resolveSelfAlignmentKeyword(value: NativePropValue | undefined): 'start' | 'center' | 'end' | 'stretch' | undefined {
    const alignment = resolveCrossAlignmentKeyword(value);
    return alignment === 'baseline' ? undefined : alignment;
}

export function resolveComposeSelfAlignmentCall(
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

export function resolveSwiftSelfAlignmentModifier(
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

export function resolveSwiftColumnAlignment(style: Record<string, NativePropValue> | undefined): string {
    const align = typeof style?.alignItems === 'string' ? style.alignItems.trim().toLowerCase() : undefined;
    return align === 'center'
        ? '.center'
        : align === 'flex-end' || align === 'end' || align === 'right'
            ? '.trailing'
            : '.leading';
}

export function resolveSwiftRowAlignmentFromStyle(
    style: Record<string, NativePropValue> | undefined,
    selfBaselineAlignment?: 'first' | 'last',
): string {
    const baselineAlignment = resolveBaselineAlignmentKeyword(style?.alignItems);
    if (baselineAlignment === 'last' || selfBaselineAlignment === 'last') {
        return '.lastTextBaseline';
    }

    if (baselineAlignment === 'first' || selfBaselineAlignment === 'first') {
        return '.firstTextBaseline';
    }

    const align = typeof style?.alignItems === 'string' ? style.alignItems.trim().toLowerCase() : undefined;
    return align === 'center'
        ? '.center'
        : align === 'flex-end' || align === 'end' || align === 'bottom'
            ? '.bottom'
            : '.top';
}

export function resolveRowBaselineAlignmentValues(values: Array<NativePropValue | undefined>): 'first' | 'last' | undefined {
    let hasFirstBaseline = false;

    for (const value of values) {
        const baselineAlignment = resolveBaselineAlignmentKeyword(value);
        if (baselineAlignment === 'last') {
            return 'last';
        }

        if (baselineAlignment === 'first') {
            hasFirstBaseline = true;
        }
    }

    return hasFirstBaseline ? 'first' : undefined;
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

export function resolveNativeGridItemHorizontalAlignment(
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

export function resolveNativeGridItemVerticalAlignment(
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

export function resolveNativeGridCellAlignmentFromStyle(
    style: Record<string, NativePropValue> | undefined,
    containerStyle: Record<string, NativePropValue> | undefined,
): { horizontal?: NativeGridItemAlignment; vertical?: NativeGridItemAlignment } {
    const horizontal = resolveNativeGridItemHorizontalAlignment(style, containerStyle);
    const vertical = resolveNativeGridItemVerticalAlignment(style, containerStyle);

    return {
        ...(horizontal ? { horizontal } : {}),
        ...(vertical ? { vertical } : {}),
    };
}

export function resolveLayoutDirection(style: Record<string, NativePropValue> | undefined): 'Row' | 'Column' | undefined {
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

export function resolveComposeLayoutFromStyle(
    component: string,
    style: Record<string, NativePropValue> | undefined,
): 'Row' | 'Column' {
    const styleLayout = resolveLayoutDirection(style);
    if (styleLayout) {
        return styleLayout;
    }

    return component === 'Row' || component === 'ListItem' ? 'Row' : 'Column';
}

export function resolveSwiftUILayoutFromStyle(
    component: string,
    style: Record<string, NativePropValue> | undefined,
): 'HStack' | 'VStack' {
    return resolveComposeLayoutFromStyle(component, style) === 'Row' ? 'HStack' : 'VStack';
}

export function buildComposeLayoutArgumentsFromStyle(
    layout: 'Row' | 'Column',
    modifier: string,
    style: Record<string, NativePropValue> | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string {
    const args = [`modifier = ${modifier}`];
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

export function buildSwiftUILayoutFromStyle(
    layout: 'HStack' | 'VStack',
    sourceTag: string,
    style: Record<string, NativePropValue> | undefined,
    rowAlignment: string,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string {
    const spacing = toPointLiteral(style?.gap ?? (layout === 'HStack' ? style?.columnGap : style?.rowGap) ?? style?.gap, styleResolveOptions)
        ?? (hasNativeTableLayoutSourceTag(sourceTag) ? '0' : '12');

    if (layout === 'HStack') {
        return `HStack(alignment: ${rowAlignment}, spacing: ${spacing})`;
    }

    return `VStack(alignment: ${resolveSwiftColumnAlignment(style)}, spacing: ${spacing})`;
}

export function buildComposeArrangement(
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

export function buildComposeCrossAlignment(layout: 'Row' | 'Column', style: Record<string, NativePropValue> | undefined): string | undefined {
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