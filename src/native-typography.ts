import { type NativeStyleResolveOptions } from './style';
import type { NativePropValue } from './native-types';
import { formatFloat, getNativeStyleResolveOptions, parseCssUnitValue, toScaledUnitNumber } from './native-units';
import { parseCssColor, toComposeColorLiteral } from './native-color';
import { quoteKotlinString } from './native-strings';
import { applyComposeTextTransformExpression } from './native-state';

export function resolveComposeFontFamily(value: NativePropValue | undefined): string | undefined {
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

export function resolveSwiftFontDesign(value: NativePropValue | undefined): string | undefined {
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

export function resolveComposeLineHeight(
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

export function resolveSwiftLineSpacing(
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

export function resolveTextTransform(value: NativePropValue | undefined): 'uppercase' | 'lowercase' | 'capitalize' | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'uppercase' || normalized === 'lowercase' || normalized === 'capitalize') {
        return normalized;
    }

    return undefined;
}

export function resolveComposeTextDecoration(value: NativePropValue | undefined): string | undefined {
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

export function resolveSwiftTextDecoration(value: NativePropValue | undefined): { underline: boolean; strikethrough: boolean } | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = value.trim().toLowerCase();
    const underline = normalized.includes('underline');
    const strikethrough = normalized.includes('line-through');
    return underline || strikethrough ? { underline, strikethrough } : undefined;
}

export function applyTextTransform(text: string, transform: 'uppercase' | 'lowercase' | 'capitalize' | undefined): string {
    if (!transform) return text;
    if (transform === 'uppercase') return text.toUpperCase();
    if (transform === 'lowercase') return text.toLowerCase();
    return text.replace(/\b\p{L}/gu, (char) => char.toUpperCase());
}

export function resolveComposeFontWeight(value: NativePropValue | undefined): string | undefined {
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

export function resolveSwiftFontWeight(value: NativePropValue | undefined): string | undefined {
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

export function resolveComposeTextAlign(value: NativePropValue | undefined): string | undefined {
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

export function resolveSwiftTextAlign(value: NativePropValue | undefined): string | undefined {
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

export function buildComposeTextStyleArgsFromStyle(
    style: Record<string, NativePropValue> | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string[] {
    if (!style) {
        return [];
    }

    const args: string[] = [];
    const color = parseCssColor(style.color);
    const fontSize = toScaledUnitNumber(style.fontSize, styleResolveOptions);
    const fontWeight = resolveComposeFontWeight(style.fontWeight);
    const fontFamily = resolveComposeFontFamily(style.fontFamily);
    const letterSpacing = toScaledUnitNumber(style.letterSpacing, styleResolveOptions);
    const lineHeight = resolveComposeLineHeight(style.lineHeight, style.fontSize, styleResolveOptions);
    const textAlign = resolveComposeTextAlign(style.textAlign);
    const textDecoration = resolveComposeTextDecoration(style.textDecoration);

    if (color) args.push(`color = ${toComposeColorLiteral(color)}`);
    if (fontSize !== undefined) args.push(`fontSize = ${formatFloat(fontSize)}.sp`);
    if (fontWeight) args.push(`fontWeight = ${fontWeight}`);
    if (fontFamily) args.push(`fontFamily = ${fontFamily}`);
    if (letterSpacing !== undefined) args.push(`letterSpacing = ${formatFloat(letterSpacing)}.sp`);
    if (lineHeight) args.push(`lineHeight = ${lineHeight}`);
    if (textAlign) args.push(`textAlign = ${textAlign}`);
    if (textDecoration) args.push(`textDecoration = ${textDecoration}`);

    return args;
}

export function buildComposeLabelTextFromStyle(
    label: string,
    style: Record<string, NativePropValue> | undefined,
    expression?: string,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string {
    const transform = resolveTextTransform(style?.textTransform);
    const textValue = expression
        ? applyComposeTextTransformExpression(expression, transform)
        : quoteKotlinString(applyTextTransform(label, transform));
    const args = [`text = ${textValue}`, ...buildComposeTextStyleArgsFromStyle(style, styleResolveOptions)];
    return `Text(${args.join(', ')})`;
}

export function buildComposeTextStyleLiteralFromStyle(
    style: Record<string, NativePropValue> | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): string | undefined {
    const args = buildComposeTextStyleArgsFromStyle(style, styleResolveOptions);
    return args.length > 0 ? `androidx.compose.ui.text.TextStyle(${args.join(', ')})` : undefined;
}