import { type NativeStyleResolveOptions } from './style';
import type { NativeColorValue, NativeGradientDirection, NativeGradientValue, NativeShadowValue, NativePropValue } from './native-types';
import { splitCssFunctionArguments, toScaledUnitNumber, getNativeStyleResolveOptions, formatFloat } from './native-units';
export const CSS_NAMED_COLORS: Record<string, NativeColorValue> = {
    transparent: { red: 0, green: 0, blue: 0, alpha: 0 },
    black: { red: 0, green: 0, blue: 0, alpha: 1 },
    silver: { red: 192, green: 192, blue: 192, alpha: 1 },
    gray: { red: 128, green: 128, blue: 128, alpha: 1 },
    grey: { red: 128, green: 128, blue: 128, alpha: 1 },
    white: { red: 255, green: 255, blue: 255, alpha: 1 },
    maroon: { red: 128, green: 0, blue: 0, alpha: 1 },
    red: { red: 255, green: 0, blue: 0, alpha: 1 },
    purple: { red: 128, green: 0, blue: 128, alpha: 1 },
    fuchsia: { red: 255, green: 0, blue: 255, alpha: 1 },
    green: { red: 0, green: 128, blue: 0, alpha: 1 },
    lime: { red: 0, green: 255, blue: 0, alpha: 1 },
    olive: { red: 128, green: 128, blue: 0, alpha: 1 },
    yellow: { red: 255, green: 255, blue: 0, alpha: 1 },
    navy: { red: 0, green: 0, blue: 128, alpha: 1 },
    blue: { red: 0, green: 0, blue: 255, alpha: 1 },
    teal: { red: 0, green: 128, blue: 128, alpha: 1 },
    aqua: { red: 0, green: 255, blue: 255, alpha: 1 },
    orange: { red: 255, green: 165, blue: 0, alpha: 1 },
    pink: { red: 255, green: 192, blue: 203, alpha: 1 },
    brown: { red: 165, green: 42, blue: 42, alpha: 1 },
    cyan: { red: 0, green: 255, blue: 255, alpha: 1 },
    magenta: { red: 255, green: 0, blue: 255, alpha: 1 },
    rebeccapurple: { red: 102, green: 51, blue: 153, alpha: 1 },
};

Object.assign(CSS_NAMED_COLORS, createNativeNamedColorMap({
    aliceblue: '#f0f8ff',
    antiquewhite: '#faebd7',
    aqua: '#00ffff',
    aquamarine: '#7fffd4',
    azure: '#f0ffff',
    beige: '#f5f5dc',
    bisque: '#ffe4c4',
    black: '#000000',
    blanchedalmond: '#ffebcd',
    blue: '#0000ff',
    blueviolet: '#8a2be2',
    brown: '#a52a2a',
    burlywood: '#deb887',
    cadetblue: '#5f9ea0',
    chartreuse: '#7fff00',
    chocolate: '#d2691e',
    coral: '#ff7f50',
    cornflowerblue: '#6495ed',
    cornsilk: '#fff8dc',
    crimson: '#dc143c',
    cyan: '#00ffff',
    darkblue: '#00008b',
    darkcyan: '#008b8b',
    darkgoldenrod: '#b8860b',
    darkgray: '#a9a9a9',
    darkgreen: '#006400',
    darkgrey: '#a9a9a9',
    darkkhaki: '#bdb76b',
    darkmagenta: '#8b008b',
    darkolivegreen: '#556b2f',
    darkorange: '#ff8c00',
    darkorchid: '#9932cc',
    darkred: '#8b0000',
    darksalmon: '#e9967a',
    darkseagreen: '#8fbc8f',
    darkslateblue: '#483d8b',
    darkslategray: '#2f4f4f',
    darkslategrey: '#2f4f4f',
    darkturquoise: '#00ced1',
    darkviolet: '#9400d3',
    deeppink: '#ff1493',
    deepskyblue: '#00bfff',
    dimgray: '#696969',
    dimgrey: '#696969',
    dodgerblue: '#1e90ff',
    firebrick: '#b22222',
    floralwhite: '#fffaf0',
    forestgreen: '#228b22',
    fuchsia: '#ff00ff',
    gainsboro: '#dcdcdc',
    ghostwhite: '#f8f8ff',
    gold: '#ffd700',
    goldenrod: '#daa520',
    gray: '#808080',
    green: '#008000',
    greenyellow: '#adff2f',
    grey: '#808080',
    honeydew: '#f0fff0',
    hotpink: '#ff69b4',
    indianred: '#cd5c5c',
    indigo: '#4b0082',
    ivory: '#fffff0',
    khaki: '#f0e68c',
    lavender: '#e6e6fa',
    lavenderblush: '#fff0f5',
    lawngreen: '#7cfc00',
    lemonchiffon: '#fffacd',
    lightblue: '#add8e6',
    lightcoral: '#f08080',
    lightcyan: '#e0ffff',
    lightgoldenrodyellow: '#fafad2',
    lightgray: '#d3d3d3',
    lightgreen: '#90ee90',
    lightgrey: '#d3d3d3',
    lightpink: '#ffb6c1',
    lightsalmon: '#ffa07a',
    lightseagreen: '#20b2aa',
    lightskyblue: '#87cefa',
    lightslategray: '#778899',
    lightslategrey: '#778899',
    lightsteelblue: '#b0c4de',
    lightyellow: '#ffffe0',
    lime: '#00ff00',
    limegreen: '#32cd32',
    linen: '#faf0e6',
    magenta: '#ff00ff',
    maroon: '#800000',
    mediumaquamarine: '#66cdaa',
    mediumblue: '#0000cd',
    mediumorchid: '#ba55d3',
    mediumpurple: '#9370db',
    mediumseagreen: '#3cb371',
    mediumslateblue: '#7b68ee',
    mediumspringgreen: '#00fa9a',
    mediumturquoise: '#48d1cc',
    mediumvioletred: '#c71585',
    midnightblue: '#191970',
    mintcream: '#f5fffa',
    mistyrose: '#ffe4e1',
    moccasin: '#ffe4b5',
    navajowhite: '#ffdead',
    navy: '#000080',
    oldlace: '#fdf5e6',
    olive: '#808000',
    olivedrab: '#6b8e23',
    orange: '#ffa500',
    orangered: '#ff4500',
    orchid: '#da70d6',
    palegoldenrod: '#eee8aa',
    palegreen: '#98fb98',
    paleturquoise: '#afeeee',
    palevioletred: '#db7093',
    papayawhip: '#ffefd5',
    peachpuff: '#ffdab9',
    peru: '#cd853f',
    pink: '#ffc0cb',
    plum: '#dda0dd',
    powderblue: '#b0e0e6',
    purple: '#800080',
    rebeccapurple: '#663399',
    red: '#ff0000',
    rosybrown: '#bc8f8f',
    royalblue: '#4169e1',
    saddlebrown: '#8b4513',
    salmon: '#fa8072',
    sandybrown: '#f4a460',
    seagreen: '#2e8b57',
    seashell: '#fff5ee',
    sienna: '#a0522d',
    silver: '#c0c0c0',
    skyblue: '#87ceeb',
    slateblue: '#6a5acd',
    slategray: '#708090',
    slategrey: '#708090',
    snow: '#fffafa',
    springgreen: '#00ff7f',
    steelblue: '#4682b4',
    tan: '#d2b48c',
    teal: '#008080',
    thistle: '#d8bfd8',
    tomato: '#ff6347',
    transparent: '#00000000',
    turquoise: '#40e0d0',
    violet: '#ee82ee',
    wheat: '#f5deb3',
    white: '#ffffff',
    whitesmoke: '#f5f5f5',
    yellow: '#ffff00',
    yellowgreen: '#9acd32',
}));

export function nativeColorFromHexLiteral(hex: string): NativeColorValue {
    const normalized = hex.trim().replace(/^#/, '');
    const red = Number.parseInt(normalized.slice(0, 2), 16);
    const green = Number.parseInt(normalized.slice(2, 4), 16);
    const blue = Number.parseInt(normalized.slice(4, 6), 16);
    const alpha = normalized.length >= 8 ? Number.parseInt(normalized.slice(6, 8), 16) / 255 : 1;
    return { red, green, blue, alpha };
}

export function createNativeNamedColorMap(colors: Record<string, string>): Record<string, NativeColorValue> {
    return Object.fromEntries(
        Object.entries(colors).map(([name, hex]) => [name, nativeColorFromHexLiteral(hex)])
    );
}

export const CURRENT_COLOR_KEYWORD = 'currentcolor';

export function cloneNativeColor(color: NativeColorValue | undefined): NativeColorValue | undefined {
    return color ? { ...color } : undefined;
}

export function getDefaultCurrentColor(): NativeColorValue {
    return cloneNativeColor(CSS_NAMED_COLORS.black) ?? { red: 0, green: 0, blue: 0, alpha: 1 };
}

export function isCurrentColorKeyword(value: NativePropValue | undefined): value is string {
    return typeof value === 'string' && value.trim().toLowerCase() === CURRENT_COLOR_KEYWORD;
}

export function nativeColorToCssColorLiteral(color: NativeColorValue): string {
    return `rgba(${color.red}, ${color.green}, ${color.blue}, ${Number(color.alpha.toFixed(3))})`;
}

export function resolveStyleCurrentColor(
    style: Record<string, NativePropValue> | undefined,
    inheritedColor?: NativeColorValue,
): NativeColorValue {
    const fallbackColor = cloneNativeColor(inheritedColor) ?? getDefaultCurrentColor();
    const resolvedColor = parseCssColor(style?.color, fallbackColor);
    return resolvedColor ?? fallbackColor;
}

export function normalizeResolvedCurrentTextColor(
    style: Record<string, NativePropValue> | undefined,
    inheritedColor?: NativeColorValue,
): Record<string, NativePropValue> | undefined {
    if (!style || !isCurrentColorKeyword(style.color)) {
        return style;
    }

    return {
        ...style,
        color: nativeColorToCssColorLiteral(resolveStyleCurrentColor(style, inheritedColor)),
    };
}


export function isFillValue(value: NativePropValue | undefined): boolean {
    return typeof value === 'string' && value.trim() === '100%';
}

export function extractColorToken(value: string): string | undefined {
    const trimmed = value.trim();
    const directMatch = trimmed.match(/^((?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\([^()]+\)|#[0-9a-fA-F]{3,8}|currentcolor)$/i);
    if (directMatch) {
        return directMatch[1];
    }

    const normalized = trimmed.toLowerCase();
    if (normalized === CURRENT_COLOR_KEYWORD) {
        return normalized;
    }

    if (CSS_NAMED_COLORS[normalized]) {
        return normalized;
    }

    const embeddedMatch = trimmed.match(/((?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\([^()]+\)|#[0-9a-fA-F]{3,8}|currentcolor)/i);
    if (embeddedMatch) {
        return embeddedMatch[1];
    }

    const firstParenIdx = trimmed.indexOf('(');
    if (firstParenIdx > 0) {
        let nameStart = firstParenIdx;
        while (nameStart > 0 && trimmed[nameStart - 1] !== ' ' && trimmed[nameStart - 1] !== '\t') {
            nameStart--;
        }
        const functionName = trimmed.slice(nameStart, firstParenIdx).toLowerCase();
        if (
            functionName !== 'rgb'
            && functionName !== 'rgba'
            && functionName !== 'hsl'
            && functionName !== 'hsla'
            && functionName !== 'hwb'
            && functionName !== 'lab'
            && functionName !== 'lch'
            && functionName !== 'oklab'
            && functionName !== 'oklch'
        ) {
            return undefined;
        }
    }

    return trimmed
        .toLowerCase()
        .split(/[^a-z-]+/)
        .find((token) => token.length > 0 && (token === CURRENT_COLOR_KEYWORD || Boolean(CSS_NAMED_COLORS[token])));
}

export function parseCssHue(value: string): number | undefined {
    const match = value.trim().toLowerCase().match(/^(-?(?:\d+(?:\.\d*)?|\.\d+))(deg|grad|rad|turn)?$/);
    if (!match) {
        return undefined;
    }

    const numericValue = Number(match[1]);
    if (!Number.isFinite(numericValue)) {
        return undefined;
    }

    switch (match[2] ?? 'deg') {
        case 'turn':
            return numericValue * 360;
        case 'rad':
            return numericValue * (180 / Math.PI);
        case 'grad':
            return numericValue * 0.9;
        default:
            return numericValue;
    }
}

export function parseCssPercentageChannel(value: string): number | undefined {
    const match = value.trim().match(/^(-?(?:\d+(?:\.\d*)?|\.\d+))%$/);
    if (!match) {
        return undefined;
    }

    const numericValue = Number(match[1]);
    return Number.isFinite(numericValue) ? Math.max(0, Math.min(100, numericValue)) / 100 : undefined;
}

export function parseCssAlphaValue(value: string): number | undefined {
    const trimmed = value.trim();
    if (trimmed.endsWith('%')) {
        const percentage = Number(trimmed.slice(0, -1));
        return Number.isFinite(percentage) ? Math.max(0, Math.min(100, percentage)) / 100 : undefined;
    }

    const numericValue = Number(trimmed);
    return Number.isFinite(numericValue) ? Math.max(0, Math.min(1, numericValue)) : undefined;
}

export function parseCssNumericChannel(value: string): number | undefined {
    const numericValue = Number(value.trim());
    return Number.isFinite(numericValue) ? numericValue : undefined;
}

export function parseCssNonNegativeNumericChannel(value: string): number | undefined {
    const numericValue = parseCssNumericChannel(value);
    return numericValue !== undefined ? Math.max(0, numericValue) : undefined;
}

export function parseCssLabLightness(value: string): number | undefined {
    const trimmed = value.trim();
    if (trimmed.endsWith('%')) {
        const percentage = Number(trimmed.slice(0, -1));
        return Number.isFinite(percentage) ? Math.max(0, Math.min(100, percentage)) : undefined;
    }

    const numericValue = Number(trimmed);
    return Number.isFinite(numericValue) ? Math.max(0, Math.min(100, numericValue)) : undefined;
}

export function parseCssOklabLightness(value: string): number | undefined {
    const trimmed = value.trim();
    if (trimmed.endsWith('%')) {
        const percentage = Number(trimmed.slice(0, -1));
        return Number.isFinite(percentage) ? Math.max(0, Math.min(100, percentage)) / 100 : undefined;
    }

    const numericValue = Number(trimmed);
    if (!Number.isFinite(numericValue)) {
        return undefined;
    }

    const normalized = Math.abs(numericValue) > 1 ? numericValue / 100 : numericValue;
    return Math.max(0, Math.min(1, normalized));
}

export function parseCssColorFunctionArguments(value: string): string[] {
    const trimmed = value.trim();
    if (!trimmed) {
        return [];
    }

    if (trimmed.includes(',')) {
        return splitCssFunctionArguments(trimmed).map((part) => part.trim()).filter(Boolean);
    }

    const alphaSplit = trimmed.split('/').map((part) => part.trim()).filter(Boolean);
    if (alphaSplit.length === 0 || alphaSplit.length > 2) {
        return [];
    }

    const channels = alphaSplit[0].split(/\s+/).filter(Boolean);
    return alphaSplit[1] ? [...channels, alphaSplit[1]] : channels;
}

export function parseCssRgbChannel(value: string): number | undefined {
    const trimmed = value.trim();
    if (trimmed.endsWith('%')) {
        const percentage = Number(trimmed.slice(0, -1));
        return Number.isFinite(percentage)
            ? Math.round((Math.max(0, Math.min(100, percentage)) / 100) * 255)
            : undefined;
    }

    const numericValue = Number(trimmed);
    return Number.isFinite(numericValue)
        ? Math.round(Math.max(0, Math.min(255, numericValue)))
        : undefined;
}

export function hslToRgb(hue: number, saturation: number, lightness: number): { red: number; green: number; blue: number } {
    const normalizedHue = ((hue % 360) + 360) % 360;
    const chroma = (1 - Math.abs((2 * lightness) - 1)) * saturation;
    const segment = normalizedHue / 60;
    const x = chroma * (1 - Math.abs((segment % 2) - 1));

    const [redPrime, greenPrime, bluePrime] = segment < 1
        ? [chroma, x, 0]
        : segment < 2
            ? [x, chroma, 0]
            : segment < 3
                ? [0, chroma, x]
                : segment < 4
                    ? [0, x, chroma]
                    : segment < 5
                        ? [x, 0, chroma]
                        : [chroma, 0, x];

    const adjustment = lightness - (chroma / 2);
    return {
        red: Math.round((redPrime + adjustment) * 255),
        green: Math.round((greenPrime + adjustment) * 255),
        blue: Math.round((bluePrime + adjustment) * 255),
    };
}

export function hwbToRgb(hue: number, whiteness: number, blackness: number): { red: number; green: number; blue: number } {
    const sum = whiteness + blackness;
    const normalizedWhiteness = sum > 1 ? whiteness / sum : whiteness;
    const normalizedBlackness = sum > 1 ? blackness / sum : blackness;
    const pureHue = hslToRgb(hue, 1, 0.5);
    const factor = Math.max(0, 1 - normalizedWhiteness - normalizedBlackness);

    return {
        red: Math.round(((pureHue.red / 255) * factor + normalizedWhiteness) * 255),
        green: Math.round(((pureHue.green / 255) * factor + normalizedWhiteness) * 255),
        blue: Math.round(((pureHue.blue / 255) * factor + normalizedWhiteness) * 255),
    };
}

export function linearSrgbChannelToByte(value: number): number {
    const clamped = Math.max(0, Math.min(1, value));
    const gammaCorrected = clamped <= 0.0031308
        ? 12.92 * clamped
        : (1.055 * Math.pow(clamped, 1 / 2.4)) - 0.055;
    return Math.round(Math.max(0, Math.min(1, gammaCorrected)) * 255);
}

export function linearSrgbToNativeColor(red: number, green: number, blue: number, alpha: number): NativeColorValue {
    return {
        red: linearSrgbChannelToByte(red),
        green: linearSrgbChannelToByte(green),
        blue: linearSrgbChannelToByte(blue),
        alpha,
    };
}

export function d50XyzToLinearSrgb(x: number, y: number, z: number): { red: number; green: number; blue: number } {
    const xD65 = (0.9555766 * x) - (0.0230393 * y) + (0.0631636 * z);
    const yD65 = (-0.0282895 * x) + (1.0099416 * y) + (0.0210077 * z);
    const zD65 = (0.0122982 * x) - (0.020483 * y) + (1.3299098 * z);

    return {
        red: (3.2404542 * xD65) - (1.5371385 * yD65) - (0.4985314 * zD65),
        green: (-0.969266 * xD65) + (1.8760108 * yD65) + (0.041556 * zD65),
        blue: (0.0556434 * xD65) - (0.2040259 * yD65) + (1.0572252 * zD65),
    };
}

export function labToXyzComponent(value: number): number {
    const epsilon = 216 / 24389;
    const kappa = 24389 / 27;
    const cube = value * value * value;
    return cube > epsilon ? cube : ((116 * value) - 16) / kappa;
}

export function labToNativeColor(lightness: number, a: number, b: number, alpha: number): NativeColorValue {
    const fy = (lightness + 16) / 116;
    const fx = fy + (a / 500);
    const fz = fy - (b / 200);
    const x = 0.96422 * labToXyzComponent(fx);
    const y = labToXyzComponent(fy);
    const z = 0.82521 * labToXyzComponent(fz);
    const linearColor = d50XyzToLinearSrgb(x, y, z);
    return linearSrgbToNativeColor(linearColor.red, linearColor.green, linearColor.blue, alpha);
}

export function lchToNativeColor(lightness: number, chroma: number, hue: number, alpha: number): NativeColorValue {
    const hueInRadians = (hue * Math.PI) / 180;
    return labToNativeColor(
        lightness,
        chroma * Math.cos(hueInRadians),
        chroma * Math.sin(hueInRadians),
        alpha,
    );
}

export function oklabToNativeColor(lightness: number, a: number, b: number, alpha: number): NativeColorValue {
    const l = Math.pow(lightness + (0.3963377774 * a) + (0.2158037573 * b), 3);
    const m = Math.pow(lightness - (0.1055613458 * a) - (0.0638541728 * b), 3);
    const s = Math.pow(lightness - (0.0894841775 * a) - (1.291485548 * b), 3);

    return linearSrgbToNativeColor(
        (4.0767416621 * l) - (3.3077115913 * m) + (0.2309699292 * s),
        (-1.2684380046 * l) + (2.6097574011 * m) - (0.3413193965 * s),
        (-0.0041960863 * l) - (0.7034186147 * m) + (1.707614701 * s),
        alpha,
    );
}

export function oklchToNativeColor(lightness: number, chroma: number, hue: number, alpha: number): NativeColorValue {
    const hueInRadians = (hue * Math.PI) / 180;
    return oklabToNativeColor(
        lightness,
        chroma * Math.cos(hueInRadians),
        chroma * Math.sin(hueInRadians),
        alpha,
    );
}

export function parseCssColor(value: NativePropValue | undefined, currentColor: NativeColorValue = getDefaultCurrentColor()): NativeColorValue | undefined {
    if (typeof value !== 'string') return undefined;

    const token = extractColorToken(value);
    if (!token) return undefined;

    if (token.toLowerCase() === CURRENT_COLOR_KEYWORD) {
        return cloneNativeColor(currentColor) ?? getDefaultCurrentColor();
    }

    const namedColor = CSS_NAMED_COLORS[token.toLowerCase()];
    if (namedColor) {
        return { ...namedColor };
    }

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

    const hslMatch = token.match(/^hsla?\(([^()]+)\)$/i);
    if (hslMatch) {
        const parts = parseCssColorFunctionArguments(hslMatch[1]);
        if (parts.length < 3) {
            return undefined;
        }

        const hue = parseCssHue(parts[0]);
        const saturation = parseCssPercentageChannel(parts[1]);
        const lightness = parseCssPercentageChannel(parts[2]);
        const alpha = parts[3] !== undefined ? parseCssAlphaValue(parts[3]) : 1;
        if (hue === undefined || saturation === undefined || lightness === undefined || alpha === undefined) {
            return undefined;
        }

        return {
            ...hslToRgb(hue, saturation, lightness),
            alpha,
        };
    }

    const hwbMatch = token.match(/^hwb\(([^()]+)\)$/i);
    if (hwbMatch) {
        const parts = parseCssColorFunctionArguments(hwbMatch[1]);
        if (parts.length < 3) {
            return undefined;
        }

        const hue = parseCssHue(parts[0]);
        const whiteness = parseCssPercentageChannel(parts[1]);
        const blackness = parseCssPercentageChannel(parts[2]);
        const alpha = parts[3] !== undefined ? parseCssAlphaValue(parts[3]) : 1;
        if (hue === undefined || whiteness === undefined || blackness === undefined || alpha === undefined) {
            return undefined;
        }

        return {
            ...hwbToRgb(hue, whiteness, blackness),
            alpha,
        };
    }

    const labMatch = token.match(/^lab\(([^()]+)\)$/i);
    if (labMatch) {
        const parts = parseCssColorFunctionArguments(labMatch[1]);
        if (parts.length < 3) {
            return undefined;
        }

        const lightness = parseCssLabLightness(parts[0]);
        const a = parseCssNumericChannel(parts[1]);
        const b = parseCssNumericChannel(parts[2]);
        const alpha = parts[3] !== undefined ? parseCssAlphaValue(parts[3]) : 1;
        if (lightness === undefined || a === undefined || b === undefined || alpha === undefined) {
            return undefined;
        }

        return labToNativeColor(lightness, a, b, alpha);
    }

    const lchMatch = token.match(/^lch\(([^()]+)\)$/i);
    if (lchMatch) {
        const parts = parseCssColorFunctionArguments(lchMatch[1]);
        if (parts.length < 3) {
            return undefined;
        }

        const lightness = parseCssLabLightness(parts[0]);
        const chroma = parseCssNonNegativeNumericChannel(parts[1]);
        const hue = parseCssHue(parts[2]);
        const alpha = parts[3] !== undefined ? parseCssAlphaValue(parts[3]) : 1;
        if (lightness === undefined || chroma === undefined || hue === undefined || alpha === undefined) {
            return undefined;
        }

        return lchToNativeColor(lightness, chroma, hue, alpha);
    }

    const oklabMatch = token.match(/^oklab\(([^()]+)\)$/i);
    if (oklabMatch) {
        const parts = parseCssColorFunctionArguments(oklabMatch[1]);
        if (parts.length < 3) {
            return undefined;
        }

        const lightness = parseCssOklabLightness(parts[0]);
        const a = parseCssNumericChannel(parts[1]);
        const b = parseCssNumericChannel(parts[2]);
        const alpha = parts[3] !== undefined ? parseCssAlphaValue(parts[3]) : 1;
        if (lightness === undefined || a === undefined || b === undefined || alpha === undefined) {
            return undefined;
        }

        return oklabToNativeColor(lightness, a, b, alpha);
    }

    const oklchMatch = token.match(/^oklch\(([^()]+)\)$/i);
    if (oklchMatch) {
        const parts = parseCssColorFunctionArguments(oklchMatch[1]);
        if (parts.length < 3) {
            return undefined;
        }

        const lightness = parseCssOklabLightness(parts[0]);
        const chroma = parseCssNonNegativeNumericChannel(parts[1]);
        const hue = parseCssHue(parts[2]);
        const alpha = parts[3] !== undefined ? parseCssAlphaValue(parts[3]) : 1;
        if (lightness === undefined || chroma === undefined || hue === undefined || alpha === undefined) {
            return undefined;
        }

        return oklchToNativeColor(lightness, chroma, hue, alpha);
    }

    const rgbMatch = token.match(/^rgba?\(([^()]+)\)$/i);
    if (!rgbMatch) return undefined;

    const parts = parseCssColorFunctionArguments(rgbMatch[1]);
    if (parts.length < 3) return undefined;

    const red = parseCssRgbChannel(parts[0]);
    const green = parseCssRgbChannel(parts[1]);
    const blue = parseCssRgbChannel(parts[2]);
    const alpha = parts[3] !== undefined ? parseCssAlphaValue(parts[3]) : 1;

    if (alpha === undefined || red === undefined || green === undefined || blue === undefined) {
        return undefined;
    }

    return { red, green, blue, alpha };
}

export function toComposeColorLiteral(color: NativeColorValue): string {
    return `Color(red = ${formatFloat(color.red / 255)}f, green = ${formatFloat(color.green / 255)}f, blue = ${formatFloat(color.blue / 255)}f, alpha = ${formatFloat(color.alpha)}f)`;
}

export function toSwiftColorLiteral(color: NativeColorValue): string {
    return `Color(red: ${formatFloat(color.red / 255)}, green: ${formatFloat(color.green / 255)}, blue: ${formatFloat(color.blue / 255)}, opacity: ${formatFloat(color.alpha)})`;
}

export function normalizeAngle(angle: number): number {
    const normalized = angle % 360;
    return normalized < 0 ? normalized + 360 : normalized;
}

export function resolveGradientDirection(angle: number | undefined): NativeGradientDirection {
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

export function parseLinearGradient(value: NativePropValue | undefined, currentColor: NativeColorValue = getDefaultCurrentColor()): NativeGradientValue | undefined {
    if (typeof value !== 'string') return undefined;

    const trimmed = value.trim();
    if (!trimmed.toLowerCase().startsWith('linear-gradient(') || !trimmed.endsWith(')')) {
        return undefined;
    }
    const gradientInner = trimmed.slice('linear-gradient('.length, -1);

    const segments = splitCssFunctionArguments(gradientInner).map((segment) => segment.trim()).filter(Boolean);
    if (segments.length < 2) {
        return undefined;
    }

    const colorSegments = /^(-?\d+(?:\.\d+)?)deg$/i.test(segments[0]) || /^to\s+/i.test(segments[0])
        ? segments.slice(1)
        : segments;

    const colors = colorSegments
        .map((token) => parseCssColor(token, currentColor))
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

export function formatComposeGradientColors(colors: NativeColorValue[], reverse = false): string {
    const orderedColors = reverse ? [...colors].reverse() : colors;
    return orderedColors.map((color) => toComposeColorLiteral(color)).join(', ');
}

export function toComposeBrushLiteral(gradient: NativeGradientValue): string {
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

export function toSwiftGradientLiteral(gradient: NativeGradientValue): string {
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

export function parseSingleBoxShadow(value: string, currentColor: NativeColorValue = getDefaultCurrentColor()): NativeShadowValue | undefined {
    if (/\binset\b/i.test(value)) {
        return undefined;
    }

    if (typeof value !== 'string') return undefined;

    const colorToken = extractColorToken(value);
    const color = parseCssColor(colorToken ?? value, currentColor);
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
    const spread = lengths[3] ? Number.parseFloat(lengths[3]) : 0;

    if ([offsetX, offsetY, blur, spread].some((entry) => Number.isNaN(entry))) {
        return undefined;
    }

    return {
        offsetX,
        offsetY,
        blur: Math.max(0, blur + Math.max(0, spread)),
        color,
    };
}

export function parseBoxShadowList(value: NativePropValue | undefined, currentColor: NativeColorValue = getDefaultCurrentColor()): NativeShadowValue[] {
    if (typeof value !== 'string') {
        return [];
    }

    return splitCssFunctionArguments(value)
        .map((entry) => parseSingleBoxShadow(entry.trim(), currentColor))
        .filter((entry): entry is NativeShadowValue => entry !== undefined);
}

export function toComposeShadowElevation(shadow: NativeShadowValue): string {
    const elevation = Math.max(1, Math.abs(shadow.offsetY), shadow.blur / 4);
    return `${formatFloat(elevation)}.dp`;
}

export function toSwiftShadowRadius(shadow: NativeShadowValue): string {
    const radius = Math.max(1, shadow.blur / 2);
    return formatFloat(radius);
}

export function parseBlurFilterRadius(
    value: NativePropValue | undefined,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): number | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const match = value.match(/blur\(([^()]*)\)/i);
    if (!match) {
        return undefined;
    }

    const radius = toScaledUnitNumber(match[1].trim(), styleResolveOptions);
    return radius !== undefined && radius > 0 ? radius : undefined;
}

export function resolveBackdropBlurRadius(
    style: Record<string, NativePropValue>,
    styleResolveOptions: NativeStyleResolveOptions = getNativeStyleResolveOptions('generic'),
): number | undefined {
    return parseBlurFilterRadius(style.backdropFilter, styleResolveOptions);
}

export function liftColorAlpha(color: NativeColorValue, delta: number): NativeColorValue {
    return {
        ...color,
        alpha: Math.min(0.96, Math.max(color.alpha, 0) + Math.max(0, delta)),
    };
}
