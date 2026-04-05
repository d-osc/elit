import { type NativeStyleResolveOptions } from './style';
import type {
    NativeBackgroundImageSpec,
    NativeBackgroundLayerSpec,
    NativeChunkedLayout,
    NativeChunkedRow,
    NativeContentStackAlignment,
    NativeGridColumnTrackSizeSpec,
    NativeGridItemAlignment,
    NativePropValue,
} from './native-types';
import { toComposeBrushLiteral, toComposeColorLiteral, toSwiftColorLiteral, toSwiftGradientLiteral } from './native-color';
import { quoteKotlinString, quoteSwiftString } from './native-strings';
import { formatFloat, getNativeStyleResolveOptions, toPointLiteral } from './native-units';
import { appendComposeModifierCall } from './native-canvas';
import { buildComposeArrangement, buildComposeCrossAlignment } from './native-layout';

function indent(level: number): string {
    return '    '.repeat(level);
}

export function resolveNativeStretchChunkedRows(
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

export function resolveEffectiveChunkedContentAlignment(layout: NativeChunkedLayout): NativeContentStackAlignment | undefined {
    return layout.kind === 'grid' && layout.rows.some((row) => row.trackWeight !== undefined)
        ? undefined
        : layout.contentAlignment;
}

export function buildComposeChunkedRowArguments(
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

export function buildComposeChunkedTrackModifier(baseModifier: string, row: NativeChunkedRow): string {
    let modifier = baseModifier;

    if (row.height !== undefined) {
        modifier = appendComposeModifierCall(modifier, `height(${formatFloat(row.height)}.dp)`);
    } else if (row.minHeight !== undefined || row.maxHeight !== undefined) {
        const heightInArgs: string[] = [];
        if (row.minHeight !== undefined) {
            heightInArgs.push(`min = ${formatFloat(row.minHeight)}.dp`);
        }
        if (row.maxHeight !== undefined) {
            heightInArgs.push(`max = ${formatFloat(row.maxHeight)}.dp`);
        }
        modifier = appendComposeModifierCall(modifier, `heightIn(${heightInArgs.join(', ')})`);
    }

    return row.trackWeight !== undefined
        ? appendComposeModifierCall(modifier, `weight(${formatFloat(row.trackWeight)}f, fill = true)`)
        : modifier;
}

export function hasNativeGridColumnConstraint(spec: NativeGridColumnTrackSizeSpec | undefined): boolean {
    return Boolean(spec && (spec.width !== undefined || spec.minWidth !== undefined || spec.maxWidth !== undefined));
}

export function buildComposeGridCellModifier(
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

export function resolveComposeGridCellContentAlignment(
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

export function buildComposeChunkedColumnArrangement(layout: NativeChunkedLayout): string | undefined {
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

export function buildComposeBackgroundImageInvocation(spec: NativeBackgroundImageSpec, modifier: string): string {
    return `ElitBackgroundImage(source = ${quoteKotlinString(spec.source)}${spec.fit !== 'cover' ? `, backgroundSize = ${quoteKotlinString(spec.fit)}` : ''}${spec.position !== 'center' ? `, backgroundPosition = ${quoteKotlinString(spec.position)}` : ''}${spec.repeat !== 'no-repeat' ? `, backgroundRepeat = ${quoteKotlinString(spec.repeat)}` : ''}, modifier = ${modifier})`;
}

export function shouldRenderNativeBackgroundLayersWithWrapper(layers: NativeBackgroundLayerSpec[]): boolean {
    return layers.length > 1 || layers.some((layer) => layer.kind === 'image');
}

export function buildComposeBackgroundLayerInvocation(layer: NativeBackgroundLayerSpec, modifier: string): string {
    if (layer.kind === 'image') {
        return buildComposeBackgroundImageInvocation(layer, modifier);
    }

    const backgroundCall = layer.kind === 'gradient'
        ? `background(brush = ${toComposeBrushLiteral(layer.gradient)})`
        : `background(${toComposeColorLiteral(layer.color)})`;
    return `Box(modifier = ${appendComposeModifierCall(modifier, backgroundCall)})`;
}

export function buildSwiftBackgroundImageInvocation(spec: NativeBackgroundImageSpec): string {
    return `elitBackgroundImageSurface(source: ${quoteSwiftString(spec.source)}${spec.fit !== 'cover' ? `, backgroundSize: ${quoteSwiftString(spec.fit)}` : ''}${spec.position !== 'center' ? `, backgroundPosition: ${quoteSwiftString(spec.position)}` : ''}${spec.repeat !== 'no-repeat' ? `, backgroundRepeat: ${quoteSwiftString(spec.repeat)}` : ''})`;
}

export function buildSwiftBackgroundLayerInvocation(layer: NativeBackgroundLayerSpec): string {
    if (layer.kind === 'image') {
        return buildSwiftBackgroundImageInvocation(layer);
    }

    const fillLiteral = layer.kind === 'gradient'
        ? toSwiftGradientLiteral(layer.gradient)
        : toSwiftColorLiteral(layer.color);
    return `Rectangle().fill(${fillLiteral}).frame(maxWidth: .infinity, maxHeight: .infinity)`;
}

export function appendSwiftUIBackgroundLayers(
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

export function resolveSwiftGridCellFrameAlignment(
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

export function resolveNativeGridCellFillWidth(defaultFillWidth: boolean, horizontalAlignment: NativeGridItemAlignment | undefined): boolean {
    if (!horizontalAlignment) {
        return defaultFillWidth;
    }

    return horizontalAlignment === 'stretch';
}

export function buildSwiftGridCellFrameModifier(
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

export function buildSwiftChunkedRowModifiers(row: NativeChunkedRow): string[] {
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
}

export function appendSwiftUIModifiers(lines: string[], modifiers: string[], level: number): string[] {
    if (modifiers.length === 0) {
        return lines;
    }

    return [
        ...lines,
        ...modifiers.map((modifier) => `${indent(level + 1)}${modifier}`),
    ];
}

export function appendSwiftUIOverlays(lines: string[], overlays: string[][], level: number): string[] {
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