import { type NativeStyleResolveOptions } from './style';
import type { NativeAutoMarginFlags, NativePropValue } from './native-types';
import { formatFloat, getNativeStyleResolveOptions, toScaledUnitNumber } from './native-units';
import { isFillValue } from './native-color';

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

export function resolveDirectionalSpacing(
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

export function buildComposeMarginPaddingCalls(
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

export function buildSwiftMarginPaddingModifiers(
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

export function shouldCenterConstrainedHorizontalAutoMargins(style: Record<string, NativePropValue> | undefined): boolean {
    if (!style || !hasHorizontalAutoMargins(style)) {
        return false;
    }

    if (isFillValue(style.width)) {
        return false;
    }

    return style.width !== undefined || style.minWidth !== undefined || style.maxWidth !== undefined;
}

export function buildComposeAutoMarginCalls(style: Record<string, NativePropValue> | undefined): string[] {
    if (!shouldCenterConstrainedHorizontalAutoMargins(style)) {
        return [];
    }

    return ['wrapContentWidth(Alignment.CenterHorizontally)'];
}

export function buildSwiftAutoMarginModifiers(style: Record<string, NativePropValue> | undefined): string[] {
    if (!hasHorizontalAutoMargins(style)) {
        return [];
    }

    return ['.frame(maxWidth: .infinity, alignment: .center)'];
}

export function estimateHorizontalPadding(
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

export function estimateVerticalPadding(
    style: Record<string, NativePropValue> | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): number {
    if (!style) {
        return 0;
    }

    const spacing = resolveNumericDirectionalSpacing(style, 'padding', styleResolveOptions);
    if (spacing.top !== undefined || spacing.bottom !== undefined) {
        return (spacing.top ?? 0) + (spacing.bottom ?? 0);
    }

    const vertical = toScaledUnitNumber(style.paddingVertical, styleResolveOptions);
    if (vertical !== undefined) {
        return vertical * 2;
    }

    const padding = toScaledUnitNumber(style.padding, styleResolveOptions);
    return padding !== undefined ? padding * 2 : 0;
}