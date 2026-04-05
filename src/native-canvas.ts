import type { NativeIntrinsicSizeSpec, NativeVectorSpec } from './native-types';
import { toComposeColorLiteral, toSwiftColorLiteral } from './native-color';
import { formatFloat } from './native-units';

function indent(level: number): string {
    return '    '.repeat(level);
}

export function prependComposeModifierCall(modifier: string, call: string): string {
    return modifier === 'Modifier'
        ? `Modifier.${call}`
        : modifier.replace(/^Modifier/, `Modifier.${call}`);
}

export function appendComposeModifierCall(modifier: string, call: string): string {
    return modifier === 'Modifier'
        ? `Modifier.${call}`
        : `${modifier}.${call}`;
}

function buildComposeIntrinsicSurfaceModifier(
    modifier: string,
    spec: NativeIntrinsicSizeSpec,
    widthDefined: boolean,
    heightDefined: boolean,
): string {
    if (!widthDefined && !heightDefined) {
        return prependComposeModifierCall(modifier, `size(width = ${formatFloat(spec.intrinsicWidth)}.dp, height = ${formatFloat(spec.intrinsicHeight)}.dp)`);
    }

    let resolvedModifier = modifier;
    if (!widthDefined) {
        resolvedModifier = prependComposeModifierCall(resolvedModifier, `width(${formatFloat(spec.intrinsicWidth)}.dp)`);
    }
    if (!heightDefined) {
        resolvedModifier = prependComposeModifierCall(resolvedModifier, `height(${formatFloat(spec.intrinsicHeight)}.dp)`);
    }

    return resolvedModifier;
}

function buildComposeDrawingCanvasLines(
    spec: NativeVectorSpec,
    level: number,
    modifier: string,
): string[] {
    const viewport = spec.viewport;
    const lines = [`${indent(level)}androidx.compose.foundation.Canvas(modifier = ${modifier}) {`];
    lines.push(`${indent(level + 1)}val viewportWidth = ${formatFloat(viewport.width)}f`);
    lines.push(`${indent(level + 1)}val viewportHeight = ${formatFloat(viewport.height)}f`);
    lines.push(`${indent(level + 1)}val scaleX = size.width / viewportWidth`);
    lines.push(`${indent(level + 1)}val scaleY = size.height / viewportHeight`);
    lines.push(`${indent(level + 1)}val strokeScale = (scaleX + scaleY) / 2f`);

    let pathIndex = 0;
    for (const shape of spec.shapes) {
        if (shape.kind === 'circle') {
            const radiusExpression = `${formatFloat(shape.r)}f * kotlin.math.min(scaleX, scaleY)`;
            const centerExpression = `androidx.compose.ui.geometry.Offset(${formatFloat(shape.cx - viewport.minX)}f * scaleX, ${formatFloat(shape.cy - viewport.minY)}f * scaleY)`;
            if (shape.fill) {
                lines.push(`${indent(level + 1)}drawCircle(color = ${toComposeColorLiteral(shape.fill)}, radius = ${radiusExpression}, center = ${centerExpression})`);
            }
            if (shape.stroke) {
                lines.push(`${indent(level + 1)}drawCircle(color = ${toComposeColorLiteral(shape.stroke)}, radius = ${radiusExpression}, center = ${centerExpression}, style = androidx.compose.ui.graphics.drawscope.Stroke(width = ${(shape.strokeWidth ?? 1).toString()}f * strokeScale))`);
            }
            continue;
        }

        if (shape.kind === 'ellipse') {
            const topLeftExpression = `androidx.compose.ui.geometry.Offset(${formatFloat(shape.cx - shape.rx - viewport.minX)}f * scaleX, ${formatFloat(shape.cy - shape.ry - viewport.minY)}f * scaleY)`;
            const sizeExpression = `androidx.compose.ui.geometry.Size(${formatFloat(shape.rx * 2)}f * scaleX, ${formatFloat(shape.ry * 2)}f * scaleY)`;
            if (shape.fill) {
                lines.push(`${indent(level + 1)}drawOval(color = ${toComposeColorLiteral(shape.fill)}, topLeft = ${topLeftExpression}, size = ${sizeExpression})`);
            }
            if (shape.stroke) {
                lines.push(`${indent(level + 1)}drawOval(color = ${toComposeColorLiteral(shape.stroke)}, topLeft = ${topLeftExpression}, size = ${sizeExpression}, style = androidx.compose.ui.graphics.drawscope.Stroke(width = ${(shape.strokeWidth ?? 1).toString()}f * strokeScale))`);
            }
            continue;
        }

        if (shape.kind === 'rect') {
            const topLeftExpression = `androidx.compose.ui.geometry.Offset(${formatFloat(shape.x - viewport.minX)}f * scaleX, ${formatFloat(shape.y - viewport.minY)}f * scaleY)`;
            const sizeExpression = `androidx.compose.ui.geometry.Size(${formatFloat(shape.width)}f * scaleX, ${formatFloat(shape.height)}f * scaleY)`;
            const hasRadius = (shape.rx ?? 0) > 0 || (shape.ry ?? shape.rx ?? 0) > 0;
            const radiusExpression = `androidx.compose.ui.geometry.CornerRadius(${formatFloat(shape.rx ?? 0)}f * scaleX, ${formatFloat(shape.ry ?? shape.rx ?? 0)}f * scaleY)`;
            if (shape.fill) {
                lines.push(`${indent(level + 1)}${hasRadius
                    ? `drawRoundRect(color = ${toComposeColorLiteral(shape.fill)}, topLeft = ${topLeftExpression}, size = ${sizeExpression}, cornerRadius = ${radiusExpression})`
                    : `drawRect(color = ${toComposeColorLiteral(shape.fill)}, topLeft = ${topLeftExpression}, size = ${sizeExpression})`}`);
            }
            if (shape.stroke) {
                lines.push(`${indent(level + 1)}${hasRadius
                    ? `drawRoundRect(color = ${toComposeColorLiteral(shape.stroke)}, topLeft = ${topLeftExpression}, size = ${sizeExpression}, cornerRadius = ${radiusExpression}, style = androidx.compose.ui.graphics.drawscope.Stroke(width = ${(shape.strokeWidth ?? 1).toString()}f * strokeScale))`
                    : `drawRect(color = ${toComposeColorLiteral(shape.stroke)}, topLeft = ${topLeftExpression}, size = ${sizeExpression}, style = androidx.compose.ui.graphics.drawscope.Stroke(width = ${(shape.strokeWidth ?? 1).toString()}f * strokeScale))`}`);
            }
            continue;
        }

        const pathName = `vectorPath${pathIndex++}`;
        lines.push(`${indent(level + 1)}val ${pathName} = androidx.compose.ui.graphics.Path().apply {`);
        for (const command of shape.commands) {
            if (command.kind === 'close') {
                lines.push(`${indent(level + 2)}close()`);
                continue;
            }

            if (command.kind === 'cubicTo') {
                lines.push(`${indent(level + 2)}cubicTo(${formatFloat(command.control1X - viewport.minX)}f * scaleX, ${formatFloat(command.control1Y - viewport.minY)}f * scaleY, ${formatFloat(command.control2X - viewport.minX)}f * scaleX, ${formatFloat(command.control2Y - viewport.minY)}f * scaleY, ${formatFloat(command.x - viewport.minX)}f * scaleX, ${formatFloat(command.y - viewport.minY)}f * scaleY)`);
                continue;
            }

            lines.push(`${indent(level + 2)}${command.kind}(${formatFloat(command.x - viewport.minX)}f * scaleX, ${formatFloat(command.y - viewport.minY)}f * scaleY)`);
        }
        lines.push(`${indent(level + 1)}}`);
        if (shape.fill) {
            lines.push(`${indent(level + 1)}drawPath(path = ${pathName}, color = ${toComposeColorLiteral(shape.fill)})`);
        }
        if (shape.stroke) {
            lines.push(`${indent(level + 1)}drawPath(path = ${pathName}, color = ${toComposeColorLiteral(shape.stroke)}, style = androidx.compose.ui.graphics.drawscope.Stroke(width = ${(shape.strokeWidth ?? 1).toString()}f * strokeScale))`);
        }
    }

    lines.push(`${indent(level)}}`);
    return lines;
}

export function buildComposeCanvasSurfaceLines(
    spec: NativeIntrinsicSizeSpec,
    drawingSpec: NativeVectorSpec | undefined,
    level: number,
    modifier: string,
    widthDefined: boolean,
    heightDefined: boolean,
): string[] {
    const canvasModifier = buildComposeIntrinsicSurfaceModifier(modifier, spec, widthDefined, heightDefined);
    return drawingSpec
        ? buildComposeDrawingCanvasLines(drawingSpec, level, canvasModifier)
        : [
            `${indent(level)}androidx.compose.foundation.Canvas(modifier = ${canvasModifier}) {`,
            `${indent(level)}}`,
        ];
}

export function buildComposeVectorCanvasLines(
    spec: NativeVectorSpec,
    level: number,
    modifier: string,
    widthDefined: boolean,
    heightDefined: boolean,
): string[] {
    const vectorModifier = buildComposeIntrinsicSurfaceModifier(modifier, spec, widthDefined, heightDefined);
    return buildComposeDrawingCanvasLines(spec, level, vectorModifier);
}

function buildSwiftIntrinsicSurfaceModifiers(
    baseModifiers: string[],
    spec: NativeIntrinsicSizeSpec,
    widthDefined: boolean,
    heightDefined: boolean,
): string[] {
    const modifiers = [...baseModifiers];
    const frameArgs: string[] = [];
    if (!widthDefined) {
        frameArgs.push(`width: ${formatFloat(spec.intrinsicWidth)}`);
    }
    if (!heightDefined) {
        frameArgs.push(`height: ${formatFloat(spec.intrinsicHeight)}`);
    }
    if (frameArgs.length > 0) {
        modifiers.push(`.frame(${frameArgs.join(', ')})`);
    }
    return modifiers;
}

function buildSwiftDrawingCanvasLines(
    spec: NativeVectorSpec,
    level: number,
): string[] {
    const viewport = spec.viewport;
    const lines = [`${indent(level)}Canvas { context, size in`];
    lines.push(`${indent(level + 1)}let viewportWidth = CGFloat(${formatFloat(viewport.width)})`);
    lines.push(`${indent(level + 1)}let viewportHeight = CGFloat(${formatFloat(viewport.height)})`);
    lines.push(`${indent(level + 1)}let scaleX = size.width / viewportWidth`);
    lines.push(`${indent(level + 1)}let scaleY = size.height / viewportHeight`);
    lines.push(`${indent(level + 1)}let strokeScale = (scaleX + scaleY) / 2`);

    let pathIndex = 0;
    for (const shape of spec.shapes) {
        const pathName = `vectorPath${pathIndex++}`;
        lines.push(`${indent(level + 1)}var ${pathName} = Path()`);

        if (shape.kind === 'circle') {
            lines.push(`${indent(level + 1)}${pathName}.addEllipse(in: CGRect(x: CGFloat(${formatFloat(shape.cx - shape.r - viewport.minX)}) * scaleX, y: CGFloat(${formatFloat(shape.cy - shape.r - viewport.minY)}) * scaleY, width: CGFloat(${formatFloat(shape.r * 2)}) * scaleX, height: CGFloat(${formatFloat(shape.r * 2)}) * scaleY))`);
        } else if (shape.kind === 'ellipse') {
            lines.push(`${indent(level + 1)}${pathName}.addEllipse(in: CGRect(x: CGFloat(${formatFloat(shape.cx - shape.rx - viewport.minX)}) * scaleX, y: CGFloat(${formatFloat(shape.cy - shape.ry - viewport.minY)}) * scaleY, width: CGFloat(${formatFloat(shape.rx * 2)}) * scaleX, height: CGFloat(${formatFloat(shape.ry * 2)}) * scaleY))`);
        } else if (shape.kind === 'rect') {
            if ((shape.rx ?? 0) > 0 || (shape.ry ?? shape.rx ?? 0) > 0) {
                lines.push(`${indent(level + 1)}${pathName}.addRoundedRect(in: CGRect(x: CGFloat(${formatFloat(shape.x - viewport.minX)}) * scaleX, y: CGFloat(${formatFloat(shape.y - viewport.minY)}) * scaleY, width: CGFloat(${formatFloat(shape.width)}) * scaleX, height: CGFloat(${formatFloat(shape.height)}) * scaleY), cornerSize: CGSize(width: CGFloat(${formatFloat(shape.rx ?? 0)}) * scaleX, height: CGFloat(${formatFloat(shape.ry ?? shape.rx ?? 0)}) * scaleY))`);
            } else {
                lines.push(`${indent(level + 1)}${pathName}.addRect(CGRect(x: CGFloat(${formatFloat(shape.x - viewport.minX)}) * scaleX, y: CGFloat(${formatFloat(shape.y - viewport.minY)}) * scaleY, width: CGFloat(${formatFloat(shape.width)}) * scaleX, height: CGFloat(${formatFloat(shape.height)}) * scaleY))`);
            }
        } else {
            for (const command of shape.commands) {
                if (command.kind === 'close') {
                    lines.push(`${indent(level + 1)}${pathName}.closeSubpath()`);
                    continue;
                }

                if (command.kind === 'cubicTo') {
                    lines.push(`${indent(level + 1)}${pathName}.addCurve(to: CGPoint(x: CGFloat(${formatFloat(command.x - viewport.minX)}) * scaleX, y: CGFloat(${formatFloat(command.y - viewport.minY)}) * scaleY), control1: CGPoint(x: CGFloat(${formatFloat(command.control1X - viewport.minX)}) * scaleX, y: CGFloat(${formatFloat(command.control1Y - viewport.minY)}) * scaleY), control2: CGPoint(x: CGFloat(${formatFloat(command.control2X - viewport.minX)}) * scaleX, y: CGFloat(${formatFloat(command.control2Y - viewport.minY)}) * scaleY))`);
                    continue;
                }

                lines.push(`${indent(level + 1)}${pathName}.${command.kind === 'moveTo' ? 'move' : 'addLine'}(to: CGPoint(x: CGFloat(${formatFloat(command.x - viewport.minX)}) * scaleX, y: CGFloat(${formatFloat(command.y - viewport.minY)}) * scaleY))`);
            }
        }

        if (shape.fill) {
            lines.push(`${indent(level + 1)}context.fill(${pathName}, with: .color(${toSwiftColorLiteral(shape.fill)}))`);
        }
        if (shape.stroke) {
            lines.push(`${indent(level + 1)}context.stroke(${pathName}, with: .color(${toSwiftColorLiteral(shape.stroke)}), style: StrokeStyle(lineWidth: CGFloat(${formatFloat(shape.strokeWidth ?? 1)}) * strokeScale))`);
        }
    }

    lines.push(`${indent(level)}}`);
    return lines;
}

export function buildSwiftCanvasSurfaceLines(
    spec: NativeIntrinsicSizeSpec,
    drawingSpec: NativeVectorSpec | undefined,
    level: number,
    baseModifiers: string[],
    widthDefined: boolean,
    heightDefined: boolean,
): { lines: string[]; modifiers: string[] } {
    return {
        lines: drawingSpec
            ? buildSwiftDrawingCanvasLines(drawingSpec, level)
            : [
                `${indent(level)}Canvas { _, _ in`,
                `${indent(level)}}`,
            ],
        modifiers: buildSwiftIntrinsicSurfaceModifiers(baseModifiers, spec, widthDefined, heightDefined),
    };
}

export function buildSwiftVectorCanvasLines(
    spec: NativeVectorSpec,
    level: number,
    baseModifiers: string[],
    widthDefined: boolean,
    heightDefined: boolean,
): { lines: string[]; modifiers: string[] } {
    return {
        lines: buildSwiftDrawingCanvasLines(spec, level),
        modifiers: buildSwiftIntrinsicSurfaceModifiers(baseModifiers, spec, widthDefined, heightDefined),
    };
}