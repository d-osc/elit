import { type NativeStyleResolveOptions } from './style';
import type {
    NativeBackgroundLayerSpec,
    NativeBackgroundLayerMetadata,
    NativeBackgroundRepeat,
    NativeColorValue,
    NativeGradientValue,
    NativePropValue,
    NativeVideoPosterFit,
    NativeVideoPosterPosition,
} from './native-types';
import { splitCssFunctionArguments } from './native-units';
import { liftColorAlpha, parseCssColor, parseLinearGradient, resolveBackdropBlurRadius, resolveStyleCurrentColor } from './native-color';

type NativePositionToken = 'leading' | 'center' | 'trailing' | 'top' | 'bottom';

export function resolveNativeObjectFitStyle(style: Record<string, NativePropValue> | undefined): NativeVideoPosterFit {
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

function normalizeNativePositionToken(value: string): NativePositionToken | undefined {
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

export function resolveNativeObjectPositionStyle(style: Record<string, NativePropValue> | undefined): NativeVideoPosterPosition {
    if (typeof style?.objectPosition !== 'string' || !style.objectPosition.trim()) {
        return 'center';
    }

    const tokens = style.objectPosition.trim().split(/\s+/).map(normalizeNativePositionToken).filter((value): value is NativePositionToken => Boolean(value));
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

export function extractCssUrlValue(value: string): string | undefined {
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

export function splitNativeBackgroundLayers(value: NativePropValue | undefined): string[] {
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

export function resolveNativeBackgroundColorLayer(
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

    const [rawPosition, rawSize] = remainder.split('/', 2).map((entry) => entry.trim()) as [string, string | undefined];
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

export function resolveNativeBackgroundShorthandColor(
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

export function resolveNativeBackgroundShorthandLayers(
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

export function resolveBackgroundColor(
    style: Record<string, NativePropValue>,
    styleResolveOptions: NativeStyleResolveOptions,
): NativeColorValue | undefined {
    const currentColor = resolveStyleCurrentColor(style);
    const explicitBackgroundColor = parseCssColor(style.backgroundColor, currentColor);
    const shorthandBackgroundColor = explicitBackgroundColor ? undefined : resolveNativeBackgroundShorthandColor(style.background, currentColor);
    return resolveNativeBackgroundColorLayer(explicitBackgroundColor ?? shorthandBackgroundColor, style, styleResolveOptions);
}

export function resolveBackgroundGradient(style: Record<string, NativePropValue>): NativeGradientValue | undefined {
    return parseLinearGradient(style.background, resolveStyleCurrentColor(style));
}

export function resolveNativeBackgroundLayersFromStyle(
    style: Record<string, NativePropValue> | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
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

export function pickNativeBackgroundLayerValue(layers: string[], index: number): string | undefined {
    if (layers.length === 0) {
        return undefined;
    }

    return layers[index % layers.length];
}

export function resolveNativeBackgroundRepeatValue(value: string | undefined): NativeBackgroundRepeat {
    return normalizeNativeBackgroundRepeat(value) ?? 'no-repeat';
}

export function resolveNativeBackgroundImageFitValue(rawSize: string | undefined, repeat: NativeBackgroundRepeat): NativeVideoPosterFit {
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

export function resolveNativeBackgroundImagePositionValue(rawPosition: string | undefined): NativeVideoPosterPosition {
    const normalizedPosition = normalizeNativeBackgroundPositionValue(rawPosition);
    if (!normalizedPosition) {
        return 'center';
    }

    const tokens = normalizedPosition.split(/\s+/)
        .map(normalizeNativePositionToken)
        .filter((value): value is NativePositionToken => Boolean(value));
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

export function stripNativeBackgroundPaintStyles(style: Record<string, NativePropValue> | undefined): Record<string, NativePropValue> | undefined {
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