import type {
    NativeBorderStyleKeyword,
    NativeBorderSideValue,
    NativeBorderValue,
    NativeColorValue,
    NativePropValue,
} from './native-types';
import { formatFloat } from './native-units';
import {
    parseCssColor,
    resolveStyleCurrentColor,
    toComposeColorLiteral,
    toSwiftColorLiteral,
} from './native-color';

function parseBorderValue(
    value: NativePropValue | undefined,
    unitParser: (value: NativePropValue | undefined) => string | undefined,
    currentColor: NativeColorValue,
): { width?: string; color?: NativeColorValue; style?: NativeBorderStyleKeyword } | undefined {
    if (typeof value !== 'string') return undefined;

    const widthMatch = value.match(/-?\d+(?:\.\d+)?(?:px|dp|pt)?/i);
    const width = widthMatch ? unitParser(widthMatch[0]) : undefined;
    const color = parseCssColor(value, currentColor);
    const style = parseBorderStyleKeyword(value);

    if (!width && !color && !style) {
        return undefined;
    }

    return { width, color, style };
}

function parseBorderStyleKeyword(value: NativePropValue | undefined): NativeBorderStyleKeyword | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = value.trim().toLowerCase();
    if (!normalized) {
        return undefined;
    }

    if (/(^|\s)(none|hidden)(\s|$)/.test(normalized)) {
        return 'none';
    }

    if (/(^|\s)solid(\s|$)/.test(normalized)) {
        return 'solid';
    }

    if (/(^|\s)dashed(\s|$)/.test(normalized)) {
        return 'dashed';
    }

    if (/(^|\s)dotted(\s|$)/.test(normalized)) {
        return 'dotted';
    }

    if (/(^|\s)(double|groove|ridge|inset|outset)(\s|$)/.test(normalized)) {
        return 'unsupported';
    }

    return undefined;
}

function areNativeColorsEqual(left: NativeColorValue | undefined, right: NativeColorValue | undefined): boolean {
    if (!left || !right) {
        return left === right;
    }

    return left.red === right.red
        && left.green === right.green
        && left.blue === right.blue
        && Math.abs(left.alpha - right.alpha) < 0.0001;
}

function parseNativeBorderNumericWidth(width: string): number {
    const parsedWidth = Number.parseFloat(width);
    return Number.isFinite(parsedWidth) && parsedWidth > 0 ? parsedWidth : 1;
}

function buildComposeBorderLineCap(style: NativeBorderStyleKeyword | undefined): string {
    return style === 'dotted'
        ? 'androidx.compose.ui.graphics.StrokeCap.Round'
        : 'androidx.compose.ui.graphics.StrokeCap.Square';
}

function buildComposeBorderJoinInset(side: NativeBorderSideValue | undefined, strokeVariable: string): string {
    return side ? `${side.width}.toPx() / 2f` : `${strokeVariable} / 2f`;
}

function buildComposeBorderDashPattern(style: NativeBorderStyleKeyword | undefined, strokeVariable: string): string | undefined {
    if (style === 'dotted') {
        return `floatArrayOf(${strokeVariable}, ${strokeVariable} * 1.5f)`;
    }

    if (style === 'dashed') {
        return `floatArrayOf(${strokeVariable} * 3f, ${strokeVariable} * 2f)`;
    }

    return undefined;
}

function buildSwiftBorderDashPattern(style: NativeBorderStyleKeyword | undefined, widthValue: number): string | undefined {
    if (style === 'dotted') {
        return `[${formatFloat(widthValue)}, ${formatFloat(widthValue * 1.5)}]`;
    }

    if (style === 'dashed') {
        return `[${formatFloat(widthValue * 3)}, ${formatFloat(widthValue * 2)}]`;
    }

    return undefined;
}

function buildSwiftBorderLineCap(style: NativeBorderStyleKeyword | undefined): string {
    return style === 'dotted' ? '.round' : '.square';
}

function buildSwiftBorderJoinInset(side: NativeBorderSideValue | undefined, widthValue: number): string {
    return side ? `CGFloat(${side.width}) / 2` : `CGFloat(${formatFloat(widthValue)}) / 2`;
}

export function resolveNativeBorder(
    style: Record<string, NativePropValue>,
    unitParser: (value: NativePropValue | undefined) => string | undefined,
): NativeBorderValue | undefined {
    const currentColor = resolveStyleCurrentColor(style);
    const shorthandBorder = parseBorderValue(style.border, unitParser, currentColor);
    const globalWidth = unitParser(style.borderWidth) ?? shorthandBorder?.width;
    const globalColor = parseCssColor(style.borderColor, currentColor) ?? shorthandBorder?.color;
    const globalStyle = parseBorderStyleKeyword(style.borderStyle) ?? shorthandBorder?.style;
    const sideKeys = [
        { shorthand: 'borderTop', width: 'borderTopWidth', color: 'borderTopColor', style: 'borderTopStyle' },
        { shorthand: 'borderRight', width: 'borderRightWidth', color: 'borderRightColor', style: 'borderRightStyle' },
        { shorthand: 'borderBottom', width: 'borderBottomWidth', color: 'borderBottomColor', style: 'borderBottomStyle' },
        { shorthand: 'borderLeft', width: 'borderLeftWidth', color: 'borderLeftColor', style: 'borderLeftStyle' },
    ] as const;
    const hasSideSpecificBorder = sideKeys.some((keys) => style[keys.shorthand] !== undefined || style[keys.width] !== undefined || style[keys.color] !== undefined || style[keys.style] !== undefined);

    const isRenderableBorder = (
        width: string | undefined,
        color: NativeColorValue | undefined,
        borderStyle: NativeBorderStyleKeyword | undefined,
    ): boolean => Boolean(width && color && borderStyle !== 'none' && borderStyle !== 'unsupported');

    if (!hasSideSpecificBorder) {
        return isRenderableBorder(globalWidth, globalColor, globalStyle)
            ? { width: globalWidth, color: globalColor, style: globalStyle }
            : undefined;
    }

    const resolvedSides = sideKeys.map((keys) => {
        const sideBorder = parseBorderValue(style[keys.shorthand], unitParser, currentColor);
        return {
            width: unitParser(style[keys.width]) ?? sideBorder?.width ?? globalWidth,
            color: parseCssColor(style[keys.color], currentColor) ?? sideBorder?.color ?? globalColor,
            style: parseBorderStyleKeyword(style[keys.style]) ?? sideBorder?.style ?? globalStyle,
        };
    });

    const [firstSide] = resolvedSides;
    if (
        firstSide
        && isRenderableBorder(firstSide.width, firstSide.color, firstSide.style)
        && resolvedSides.every((side) => side.width === firstSide.width && areNativeColorsEqual(side.color, firstSide.color) && side.style === firstSide.style)
    ) {
        return {
            width: firstSide.width,
            color: firstSide.color,
            style: firstSide.style,
        };
    }

    const renderedBorder: NativeBorderValue = {};
    const sideNames = ['top', 'right', 'bottom', 'left'] as const;

    resolvedSides.forEach((side, index) => {
        if (isRenderableBorder(side.width, side.color, side.style)) {
            renderedBorder[sideNames[index]] = {
                width: side.width!,
                color: side.color!,
                style: side.style,
            };
        }
    });

    return renderedBorder.top || renderedBorder.right || renderedBorder.bottom || renderedBorder.left
        ? renderedBorder
        : undefined;
}

function hasNativeSideBorders(border: NativeBorderValue | undefined): boolean {
    return Boolean(border?.top || border?.right || border?.bottom || border?.left);
}

export function buildComposeSideBorderModifier(border: NativeBorderValue): string | undefined {
    if (!hasNativeSideBorders(border)) {
        return undefined;
    }

    const commands: string[] = [];
    if (border.top) {
        commands.push(`val topStroke = ${border.top.width}.toPx()`);
        const topStartX = buildComposeBorderJoinInset(border.left, 'topStroke');
        const topEndX = `size.width - (${buildComposeBorderJoinInset(border.right, 'topStroke')})`;
        const topCap = buildComposeBorderLineCap(border.top.style);
        const topDashPattern = buildComposeBorderDashPattern(border.top.style, 'topStroke');
        const topPathEffect = topDashPattern
            ? `, pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(${topDashPattern})`
            : '';
        commands.push(`drawLine(color = ${toComposeColorLiteral(border.top.color)}, start = androidx.compose.ui.geometry.Offset(${topStartX}, topStroke / 2f), end = androidx.compose.ui.geometry.Offset(${topEndX}, topStroke / 2f), strokeWidth = topStroke, cap = ${topCap}${topPathEffect})`);
    }
    if (border.right) {
        commands.push(`val rightStroke = ${border.right.width}.toPx()`);
        const rightStartY = buildComposeBorderJoinInset(border.top, 'rightStroke');
        const rightEndY = `size.height - (${buildComposeBorderJoinInset(border.bottom, 'rightStroke')})`;
        const rightCap = buildComposeBorderLineCap(border.right.style);
        const rightDashPattern = buildComposeBorderDashPattern(border.right.style, 'rightStroke');
        const rightPathEffect = rightDashPattern
            ? `, pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(${rightDashPattern})`
            : '';
        commands.push(`drawLine(color = ${toComposeColorLiteral(border.right.color)}, start = androidx.compose.ui.geometry.Offset(size.width - (rightStroke / 2f), ${rightStartY}), end = androidx.compose.ui.geometry.Offset(size.width - (rightStroke / 2f), ${rightEndY}), strokeWidth = rightStroke, cap = ${rightCap}${rightPathEffect})`);
    }
    if (border.bottom) {
        commands.push(`val bottomStroke = ${border.bottom.width}.toPx()`);
        const bottomStartX = buildComposeBorderJoinInset(border.left, 'bottomStroke');
        const bottomEndX = `size.width - (${buildComposeBorderJoinInset(border.right, 'bottomStroke')})`;
        const bottomCap = buildComposeBorderLineCap(border.bottom.style);
        const bottomDashPattern = buildComposeBorderDashPattern(border.bottom.style, 'bottomStroke');
        const bottomPathEffect = bottomDashPattern
            ? `, pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(${bottomDashPattern})`
            : '';
        commands.push(`drawLine(color = ${toComposeColorLiteral(border.bottom.color)}, start = androidx.compose.ui.geometry.Offset(${bottomStartX}, size.height - (bottomStroke / 2f)), end = androidx.compose.ui.geometry.Offset(${bottomEndX}, size.height - (bottomStroke / 2f)), strokeWidth = bottomStroke, cap = ${bottomCap}${bottomPathEffect})`);
    }
    if (border.left) {
        commands.push(`val leftStroke = ${border.left.width}.toPx()`);
        const leftStartY = buildComposeBorderJoinInset(border.top, 'leftStroke');
        const leftEndY = `size.height - (${buildComposeBorderJoinInset(border.bottom, 'leftStroke')})`;
        const leftCap = buildComposeBorderLineCap(border.left.style);
        const leftDashPattern = buildComposeBorderDashPattern(border.left.style, 'leftStroke');
        const leftPathEffect = leftDashPattern
            ? `, pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(${leftDashPattern})`
            : '';
        commands.push(`drawLine(color = ${toComposeColorLiteral(border.left.color)}, start = androidx.compose.ui.geometry.Offset(leftStroke / 2f, ${leftStartY}), end = androidx.compose.ui.geometry.Offset(leftStroke / 2f, ${leftEndY}), strokeWidth = leftStroke, cap = ${leftCap}${leftPathEffect})`);
    }

    return commands.length > 0 ? `drawBehind { ${commands.join('; ')} }` : undefined;
}

export function buildComposeUniformStyledBorderModifier(border: NativeBorderValue, radius?: string): string | undefined {
    if (!border.width || !border.color || (border.style !== 'dashed' && border.style !== 'dotted')) {
        return undefined;
    }

    const dashPattern = buildComposeBorderDashPattern(border.style, 'strokeWidth');
    if (!dashPattern) {
        return undefined;
    }

    if (radius) {
        return `drawBehind { val strokeWidth = ${border.width}.toPx(); val dashPattern = ${dashPattern}; val borderRadius = ${radius}.toPx(); drawRoundRect(color = ${toComposeColorLiteral(border.color)}, cornerRadius = androidx.compose.ui.geometry.CornerRadius(borderRadius, borderRadius), style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeWidth, pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(dashPattern))) }`;
    }

    return `drawBehind { val strokeWidth = ${border.width}.toPx(); val dashPattern = ${dashPattern}; drawRect(color = ${toComposeColorLiteral(border.color)}, style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeWidth, pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(dashPattern))) }`;
}

export function buildSwiftSideBorderOverlay(border: NativeBorderValue, radius?: string): string | undefined {
    if (!hasNativeSideBorders(border)) {
        return undefined;
    }

    const sideEntries = [
        ['top', border.top],
        ['right', border.right],
        ['bottom', border.bottom],
        ['left', border.left],
    ].filter((entry): entry is ['top' | 'right' | 'bottom' | 'left', NativeBorderSideValue] => Boolean(entry[1]));

    const hasStyledSides = sideEntries.some(([, side]) => side.style === 'dashed' || side.style === 'dotted');
    if (hasStyledSides) {
        const overlays = sideEntries.map(([sideName, side]) => {
            const widthValue = parseNativeBorderNumericWidth(side.width);
            const dashPattern = buildSwiftBorderDashPattern(side.style, widthValue);
            const lineCap = buildSwiftBorderLineCap(side.style);
            const strokeStyle = dashPattern
                ? `StrokeStyle(lineWidth: ${side.width}, lineCap: ${lineCap}, dash: ${dashPattern})`
                : `StrokeStyle(lineWidth: ${side.width}, lineCap: ${lineCap})`;

            switch (sideName) {
                case 'top':
                    return `Path { path in path.move(to: CGPoint(x: ${buildSwiftBorderJoinInset(border.left, widthValue)}, y: CGFloat(${side.width}) / 2)); path.addLine(to: CGPoint(x: proxy.size.width - (${buildSwiftBorderJoinInset(border.right, widthValue)}), y: CGFloat(${side.width}) / 2)) }.stroke(${toSwiftColorLiteral(side.color)}, style: ${strokeStyle})`;
                case 'right':
                    return `Path { path in path.move(to: CGPoint(x: proxy.size.width - (CGFloat(${side.width}) / 2), y: ${buildSwiftBorderJoinInset(border.top, widthValue)})); path.addLine(to: CGPoint(x: proxy.size.width - (CGFloat(${side.width}) / 2), y: proxy.size.height - (${buildSwiftBorderJoinInset(border.bottom, widthValue)}))) }.stroke(${toSwiftColorLiteral(side.color)}, style: ${strokeStyle})`;
                case 'bottom':
                    return `Path { path in path.move(to: CGPoint(x: ${buildSwiftBorderJoinInset(border.left, widthValue)}, y: proxy.size.height - (CGFloat(${side.width}) / 2))); path.addLine(to: CGPoint(x: proxy.size.width - (${buildSwiftBorderJoinInset(border.right, widthValue)}), y: proxy.size.height - (CGFloat(${side.width}) / 2))) }.stroke(${toSwiftColorLiteral(side.color)}, style: ${strokeStyle})`;
                case 'left':
                default:
                    return `Path { path in path.move(to: CGPoint(x: CGFloat(${side.width}) / 2, y: ${buildSwiftBorderJoinInset(border.top, widthValue)})); path.addLine(to: CGPoint(x: CGFloat(${side.width}) / 2, y: proxy.size.height - (${buildSwiftBorderJoinInset(border.bottom, widthValue)}))) }.stroke(${toSwiftColorLiteral(side.color)}, style: ${strokeStyle})`;
            }
        });

        const clipModifier = radius ? `.clipShape(RoundedRectangle(cornerRadius: ${radius}))` : '';
        return `.overlay { GeometryReader { proxy in ZStack { ${overlays.join('; ')} } }${clipModifier} }`;
    }

    const overlays: string[] = [];
    if (border.top) {
        overlays.push(`Rectangle().fill(${toSwiftColorLiteral(border.top.color)}).frame(height: ${border.top.width}).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)`);
    }
    if (border.right) {
        overlays.push(`Rectangle().fill(${toSwiftColorLiteral(border.right.color)}).frame(width: ${border.right.width}).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .trailing)`);
    }
    if (border.bottom) {
        overlays.push(`Rectangle().fill(${toSwiftColorLiteral(border.bottom.color)}).frame(height: ${border.bottom.width}).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)`);
    }
    if (border.left) {
        overlays.push(`Rectangle().fill(${toSwiftColorLiteral(border.left.color)}).frame(width: ${border.left.width}).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)`);
    }

    if (overlays.length === 0) {
        return undefined;
    }

    const clipModifier = radius ? `.clipShape(RoundedRectangle(cornerRadius: ${radius}))` : '';
    return `.overlay { ZStack { ${overlays.join('; ')} }${clipModifier} }`;
}

export function buildSwiftUniformStyledBorderModifier(border: NativeBorderValue, radius?: string): string | undefined {
    if (!border.width || !border.color || (border.style !== 'dashed' && border.style !== 'dotted')) {
        return undefined;
    }

    const widthValue = parseNativeBorderNumericWidth(border.width);
    const dashPattern = buildSwiftBorderDashPattern(border.style, widthValue);
    if (!dashPattern) {
        return undefined;
    }
    const shape = radius ? `RoundedRectangle(cornerRadius: ${radius})` : 'Rectangle()';
    return `.overlay(${shape}.stroke(${toSwiftColorLiteral(border.color)}, style: StrokeStyle(lineWidth: ${border.width}, dash: ${dashPattern})))`;
}