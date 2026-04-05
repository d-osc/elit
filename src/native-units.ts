import { type NativeStyleResolveOptions } from './style';
import type { NativePlatform, NativePropValue, NativeFlexStyleValues, NativeRenderHints } from './native-types';
export function formatFloat(value: number): string {
    return Number(value.toFixed(3)).toString();
}


export function splitCssFunctionArguments(value: string): string[] {
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

export function evaluateCssLengthExpression(value: string, styleResolveOptions: NativeStyleResolveOptions): number | undefined {
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

export function toDpLiteral(
    value: NativePropValue | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string | undefined {
    const resolved = toScaledUnitNumber(value, styleResolveOptions);
    return resolved !== undefined ? `${formatFloat(resolved)}.dp` : undefined;
}

export function toPointLiteral(
    value: NativePropValue | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string | undefined {
    const resolved = toScaledUnitNumber(value, styleResolveOptions);
    return resolved !== undefined ? formatFloat(resolved) : undefined;
}

export function toSpLiteral(
    value: NativePropValue | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string | undefined {
    const resolved = toScaledUnitNumber(value, styleResolveOptions);
    return resolved !== undefined ? `${formatFloat(resolved)}.sp` : undefined;
}

export function parsePlainNumericValue(value: NativePropValue | undefined): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmed)) {
        return undefined;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseNativeSvgNumber(value: NativePropValue | undefined): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    const match = trimmed.match(/^(-?(?:\d+(?:\.\d*)?|\.\d+))(?:px)?$/i);
    if (!match) {
        return undefined;
    }

    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseFlexShorthand(value: NativePropValue | undefined): NativeFlexStyleValues | undefined {
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

export function resolveFlexStyleValues(style: Record<string, NativePropValue> | undefined): NativeFlexStyleValues {
    const shorthand = parseFlexShorthand(style?.flex);
    return {
        grow: parsePlainNumericValue(style?.flexGrow) ?? shorthand?.grow,
        shrink: parsePlainNumericValue(style?.flexShrink) ?? shorthand?.shrink,
        basis: style?.flexBasis ?? shorthand?.basis,
    };
}

export function resolveOpacityValue(value: NativePropValue | undefined): number | undefined {
    const opacity = parsePlainNumericValue(value);
    if (opacity === undefined) {
        return undefined;
    }

    return Math.min(1, Math.max(0, opacity));
}

export function resolveAspectRatioValue(value: NativePropValue | undefined): number | undefined {
    const direct = parsePlainNumericValue(value);
    if (direct !== undefined) {
        return direct > 0 ? direct : undefined;
    }

    if (typeof value !== 'string') {
        return undefined;
    }

    const ratioMatch = value.trim().match(/^(-?(?:\d+(?:\.\d*)?|\.\d+))\s*\/\s*(-?(?:\d+(?:\.\d*)?|\.\d+))$/);
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

export function parsePercentageValue(value: NativePropValue | undefined): number | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const match = value.trim().match(/^(-?(?:\d+(?:\.\d*)?|\.\d+))%$/);
    if (!match) {
        return undefined;
    }

    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export function resolveAxisReferenceLength(
    axis: 'horizontal' | 'vertical',
    hints: NativeRenderHints | undefined,
    styleResolveOptions: NativeStyleResolveOptions,
): number {
    if (axis === 'horizontal') {
        return hints?.availableWidth ?? styleResolveOptions.viewportWidth ?? 390;
    }

    return hints?.availableHeight ?? styleResolveOptions.viewportHeight ?? 844;
}

export function resolveAxisUnitNumber(
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

export function toAxisDpLiteral(
    value: NativePropValue | undefined,
    axis: 'horizontal' | 'vertical',
    hints: NativeRenderHints | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string | undefined {
    const resolved = resolveAxisUnitNumber(value, axis, hints, styleResolveOptions);
    return resolved !== undefined ? `${formatFloat(resolved)}.dp` : undefined;
}

export function toAxisPointLiteral(
    value: NativePropValue | undefined,
    axis: 'horizontal' | 'vertical',
    hints: NativeRenderHints | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string | undefined {
    const resolved = resolveAxisUnitNumber(value, axis, hints, styleResolveOptions);
    return resolved !== undefined ? formatFloat(resolved) : undefined;
}

export function isHiddenOverflowValue(value: NativePropValue | undefined): boolean {
    if (typeof value !== 'string') {
        return false;
    }

    const normalized = value.trim().toLowerCase();
    return normalized === 'hidden' || normalized === 'clip';
}

export function shouldClipNativeOverflow(style: Record<string, NativePropValue> | undefined): boolean {
    if (!style) {
        return false;
    }

    return isHiddenOverflowValue(style.overflow)
        || isHiddenOverflowValue(style.overflowX)
        || isHiddenOverflowValue(style.overflowY);
}

export function parseCssUnitValue(value: NativePropValue | undefined): { value: number; unit: string } | undefined {
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

export function toScaledUnitNumber(
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


export function getNativeStyleResolveOptions(platform: NativePlatform): NativeStyleResolveOptions {
    return {
        viewportWidth: platform === 'generic' ? 1024 : 390,
        viewportHeight: platform === 'generic' ? 768 : 844,
        colorScheme: 'light',
        mediaType: 'screen',
    };
}
