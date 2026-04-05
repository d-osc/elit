import type { NativeVectorPathCommand, NativeVectorShape, NativeVectorSpec, NativeVectorViewport, NativeCanvasSpec, NativePropValue, NativePropObject, NativeElementNode, NativeNode, NativeColorValue } from './native-types';
import { parseNativeSvgNumber } from './native-units';
import { parseCssColor, cloneNativeColor, normalizeAngle, getDefaultCurrentColor } from './native-color';
export function resolveNativeDefaultFillColor(sourceTag: string): NativeColorValue | undefined {
    return sourceTag === 'circle'
        || sourceTag === 'rect'
        || sourceTag === 'ellipse'
        || sourceTag === 'path'
        || sourceTag === 'polyline'
        || sourceTag === 'polygon'
        ? getDefaultCurrentColor()
        : undefined;
}

export function resolveNativeVectorPaintColor(
    value: NativePropValue | undefined,
    fallback?: NativeColorValue,
): NativeColorValue | undefined {
    if (typeof value === 'string' && value.trim().toLowerCase() === 'none') {
        return undefined;
    }

    if (value === undefined) {
        return cloneNativeColor(fallback);
    }

    return parseCssColor(value, fallback ?? getDefaultCurrentColor()) ?? cloneNativeColor(fallback);
}

export function resolveNativeVectorStrokeWidth(node: NativeElementNode): number | undefined {
    return parseNativeSvgNumber(node.props.strokeWidth) ?? undefined;
}

export function isNativePropObjectValue(value: NativePropValue | undefined): value is NativePropObject {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function buildNativeVectorCubicCurve(
    control1X: number,
    control1Y: number,
    control2X: number,
    control2Y: number,
    x: number,
    y: number,
): NativeVectorPathCommand {
    return { kind: 'cubicTo', control1X, control1Y, control2X, control2Y, x, y };
}

export function buildNativeVectorCubicCurveFromQuadratic(
    startX: number,
    startY: number,
    controlX: number,
    controlY: number,
    endX: number,
    endY: number,
): NativeVectorPathCommand {
    return buildNativeVectorCubicCurve(
        startX + ((controlX - startX) * 2) / 3,
        startY + ((controlY - startY) * 2) / 3,
        endX + ((controlX - endX) * 2) / 3,
        endY + ((controlY - endY) * 2) / 3,
        endX,
        endY,
    );
}

export function approximateNativeSvgArcAsCubicCurves(
    startX: number,
    startY: number,
    radiusX: number,
    radiusY: number,
    rotationDegrees: number,
    largeArcFlag: boolean,
    sweepFlag: boolean,
    endX: number,
    endY: number,
): NativeVectorPathCommand[] | undefined {
    if (![startX, startY, radiusX, radiusY, rotationDegrees, endX, endY].every((value) => Number.isFinite(value))) {
        return undefined;
    }

    if (Math.abs(endX - startX) < Number.EPSILON && Math.abs(endY - startY) < Number.EPSILON) {
        return [];
    }

    let rx = Math.abs(radiusX);
    let ry = Math.abs(radiusY);
    if (rx < Number.EPSILON || ry < Number.EPSILON) {
        return [{ kind: 'lineTo', x: endX, y: endY }];
    }

    const rotation = normalizeAngle(rotationDegrees) * (Math.PI / 180);
    const cosRotation = Math.cos(rotation);
    const sinRotation = Math.sin(rotation);
    const halfDeltaX = (startX - endX) / 2;
    const halfDeltaY = (startY - endY) / 2;
    const transformedStartX = cosRotation * halfDeltaX + sinRotation * halfDeltaY;
    const transformedStartY = -sinRotation * halfDeltaX + cosRotation * halfDeltaY;

    const radiiScale = (transformedStartX * transformedStartX) / (rx * rx) + (transformedStartY * transformedStartY) / (ry * ry);
    if (radiiScale > 1) {
        const scale = Math.sqrt(radiiScale);
        rx *= scale;
        ry *= scale;
    }

    const rxSquared = rx * rx;
    const rySquared = ry * ry;
    const startXSquared = transformedStartX * transformedStartX;
    const startYSquared = transformedStartY * transformedStartY;
    const numerator = rxSquared * rySquared - rxSquared * startYSquared - rySquared * startXSquared;
    const denominator = rxSquared * startYSquared + rySquared * startXSquared;
    const factor = denominator < Number.EPSILON
        ? 0
        : (largeArcFlag === sweepFlag ? -1 : 1) * Math.sqrt(Math.max(0, numerator / denominator));
    const transformedCenterX = factor * ((rx * transformedStartY) / ry);
    const transformedCenterY = factor * (-(ry * transformedStartX) / rx);
    const centerX = cosRotation * transformedCenterX - sinRotation * transformedCenterY + (startX + endX) / 2;
    const centerY = sinRotation * transformedCenterX + cosRotation * transformedCenterY + (startY + endY) / 2;

    const angleBetweenVectors = (ux: number, uy: number, vx: number, vy: number): number => {
        const length = Math.hypot(ux, uy) * Math.hypot(vx, vy);
        if (length < Number.EPSILON) {
            return 0;
        }

        const dot = Math.max(-1, Math.min(1, (ux * vx + uy * vy) / length));
        const angle = Math.acos(dot);
        return ux * vy - uy * vx < 0 ? -angle : angle;
    };

    const startVectorX = (transformedStartX - transformedCenterX) / rx;
    const startVectorY = (transformedStartY - transformedCenterY) / ry;
    const endVectorX = (-transformedStartX - transformedCenterX) / rx;
    const endVectorY = (-transformedStartY - transformedCenterY) / ry;
    const startAngle = angleBetweenVectors(1, 0, startVectorX, startVectorY);
    let sweepAngle = angleBetweenVectors(startVectorX, startVectorY, endVectorX, endVectorY);
    if (!sweepFlag && sweepAngle > 0) {
        sweepAngle -= Math.PI * 2;
    } else if (sweepFlag && sweepAngle < 0) {
        sweepAngle += Math.PI * 2;
    }

    const segmentCount = Math.max(1, Math.ceil(Math.abs(sweepAngle) / (Math.PI / 2)));
    const segmentSweep = sweepAngle / segmentCount;
    const transformPoint = (unitX: number, unitY: number) => ({
        x: centerX + cosRotation * rx * unitX - sinRotation * ry * unitY,
        y: centerY + sinRotation * rx * unitX + cosRotation * ry * unitY,
    });
    const transformDerivative = (unitX: number, unitY: number) => ({
        x: cosRotation * rx * unitX - sinRotation * ry * unitY,
        y: sinRotation * rx * unitX + cosRotation * ry * unitY,
    });

    const commands: NativeVectorPathCommand[] = [];
    for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
        const angle1 = startAngle + segmentIndex * segmentSweep;
        const angle2 = angle1 + segmentSweep;
        const alpha = (4 / 3) * Math.tan((angle2 - angle1) / 4);
        const cosAngle1 = Math.cos(angle1);
        const sinAngle1 = Math.sin(angle1);
        const cosAngle2 = Math.cos(angle2);
        const sinAngle2 = Math.sin(angle2);
        const point1 = transformPoint(cosAngle1, sinAngle1);
        const point2 = transformPoint(cosAngle2, sinAngle2);
        const derivative1 = transformDerivative(-sinAngle1, cosAngle1);
        const derivative2 = transformDerivative(-sinAngle2, cosAngle2);

        commands.push(buildNativeVectorCubicCurve(
            point1.x + alpha * derivative1.x,
            point1.y + alpha * derivative1.y,
            point2.x - alpha * derivative2.x,
            point2.y - alpha * derivative2.y,
            point2.x,
            point2.y,
        ));
    }

    return commands;
}

export function parseNativeSvgPathData(data: string): NativeVectorPathCommand[] | undefined {
    const tokens = data.match(/[a-zA-Z]|[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/gi);
    if (!tokens || tokens.length === 0) {
        return undefined;
    }

    const commands: NativeVectorPathCommand[] = [];
    let index = 0;
    let currentX = 0;
    let currentY = 0;
    let subpathStartX = 0;
    let subpathStartY = 0;
    let command = '';
    let lastCubicControlX: number | undefined;
    let lastCubicControlY: number | undefined;
    let lastQuadraticControlX: number | undefined;
    let lastQuadraticControlY: number | undefined;
    let previousCurveKind: 'cubic' | 'quadratic' | undefined;

    const readNumber = (): number | undefined => {
        const token = tokens[index];
        if (!token || /^[a-zA-Z]$/.test(token)) {
            return undefined;
        }

        index += 1;
        const parsed = Number(token);
        return Number.isFinite(parsed) ? parsed : undefined;
    };

    while (index < tokens.length) {
        const token = tokens[index]!;
        if (/^[a-zA-Z]$/.test(token)) {
            command = token;
            index += 1;
        } else if (!command) {
            return undefined;
        }

        switch (command) {
            case 'M':
            case 'm': {
                const x = readNumber();
                const y = readNumber();
                if (x === undefined || y === undefined) {
                    return undefined;
                }
                currentX = command === 'm' ? currentX + x : x;
                currentY = command === 'm' ? currentY + y : y;
                subpathStartX = currentX;
                subpathStartY = currentY;
                lastCubicControlX = undefined;
                lastCubicControlY = undefined;
                lastQuadraticControlX = undefined;
                lastQuadraticControlY = undefined;
                previousCurveKind = undefined;
                commands.push({ kind: 'moveTo', x: currentX, y: currentY });
                command = command === 'm' ? 'l' : 'L';
                break;
            }
            case 'L':
            case 'l': {
                const x = readNumber();
                const y = readNumber();
                if (x === undefined || y === undefined) {
                    return undefined;
                }
                currentX = command === 'l' ? currentX + x : x;
                currentY = command === 'l' ? currentY + y : y;
                lastCubicControlX = undefined;
                lastCubicControlY = undefined;
                lastQuadraticControlX = undefined;
                lastQuadraticControlY = undefined;
                previousCurveKind = undefined;
                commands.push({ kind: 'lineTo', x: currentX, y: currentY });
                break;
            }
            case 'H':
            case 'h': {
                const x = readNumber();
                if (x === undefined) {
                    return undefined;
                }
                currentX = command === 'h' ? currentX + x : x;
                lastCubicControlX = undefined;
                lastCubicControlY = undefined;
                lastQuadraticControlX = undefined;
                lastQuadraticControlY = undefined;
                previousCurveKind = undefined;
                commands.push({ kind: 'lineTo', x: currentX, y: currentY });
                break;
            }
            case 'V':
            case 'v': {
                const y = readNumber();
                if (y === undefined) {
                    return undefined;
                }
                currentY = command === 'v' ? currentY + y : y;
                lastCubicControlX = undefined;
                lastCubicControlY = undefined;
                lastQuadraticControlX = undefined;
                lastQuadraticControlY = undefined;
                previousCurveKind = undefined;
                commands.push({ kind: 'lineTo', x: currentX, y: currentY });
                break;
            }
            case 'C':
            case 'c': {
                const control1X = readNumber();
                const control1Y = readNumber();
                const control2X = readNumber();
                const control2Y = readNumber();
                const x = readNumber();
                const y = readNumber();
                if (control1X === undefined || control1Y === undefined || control2X === undefined || control2Y === undefined || x === undefined || y === undefined) {
                    return undefined;
                }

                const absoluteControl1X = command === 'c' ? currentX + control1X : control1X;
                const absoluteControl1Y = command === 'c' ? currentY + control1Y : control1Y;
                const absoluteControl2X = command === 'c' ? currentX + control2X : control2X;
                const absoluteControl2Y = command === 'c' ? currentY + control2Y : control2Y;
                currentX = command === 'c' ? currentX + x : x;
                currentY = command === 'c' ? currentY + y : y;
                commands.push(buildNativeVectorCubicCurve(
                    absoluteControl1X,
                    absoluteControl1Y,
                    absoluteControl2X,
                    absoluteControl2Y,
                    currentX,
                    currentY,
                ));
                lastCubicControlX = absoluteControl2X;
                lastCubicControlY = absoluteControl2Y;
                lastQuadraticControlX = undefined;
                lastQuadraticControlY = undefined;
                previousCurveKind = 'cubic';
                break;
            }
            case 'S':
            case 's': {
                const control2X = readNumber();
                const control2Y = readNumber();
                const x = readNumber();
                const y = readNumber();
                if (control2X === undefined || control2Y === undefined || x === undefined || y === undefined) {
                    return undefined;
                }

                const absoluteControl1X = previousCurveKind === 'cubic' && lastCubicControlX !== undefined
                    ? currentX * 2 - lastCubicControlX
                    : currentX;
                const absoluteControl1Y = previousCurveKind === 'cubic' && lastCubicControlY !== undefined
                    ? currentY * 2 - lastCubicControlY
                    : currentY;
                const absoluteControl2X = command === 's' ? currentX + control2X : control2X;
                const absoluteControl2Y = command === 's' ? currentY + control2Y : control2Y;
                currentX = command === 's' ? currentX + x : x;
                currentY = command === 's' ? currentY + y : y;
                commands.push(buildNativeVectorCubicCurve(
                    absoluteControl1X,
                    absoluteControl1Y,
                    absoluteControl2X,
                    absoluteControl2Y,
                    currentX,
                    currentY,
                ));
                lastCubicControlX = absoluteControl2X;
                lastCubicControlY = absoluteControl2Y;
                lastQuadraticControlX = undefined;
                lastQuadraticControlY = undefined;
                previousCurveKind = 'cubic';
                break;
            }
            case 'Q':
            case 'q': {
                const controlX = readNumber();
                const controlY = readNumber();
                const x = readNumber();
                const y = readNumber();
                if (controlX === undefined || controlY === undefined || x === undefined || y === undefined) {
                    return undefined;
                }

                const absoluteControlX = command === 'q' ? currentX + controlX : controlX;
                const absoluteControlY = command === 'q' ? currentY + controlY : controlY;
                const startX = currentX;
                const startY = currentY;
                currentX = command === 'q' ? currentX + x : x;
                currentY = command === 'q' ? currentY + y : y;
                commands.push(buildNativeVectorCubicCurveFromQuadratic(
                    startX,
                    startY,
                    absoluteControlX,
                    absoluteControlY,
                    currentX,
                    currentY,
                ));
                lastQuadraticControlX = absoluteControlX;
                lastQuadraticControlY = absoluteControlY;
                lastCubicControlX = undefined;
                lastCubicControlY = undefined;
                previousCurveKind = 'quadratic';
                break;
            }
            case 'T':
            case 't': {
                const x = readNumber();
                const y = readNumber();
                if (x === undefined || y === undefined) {
                    return undefined;
                }

                const absoluteControlX = previousCurveKind === 'quadratic' && lastQuadraticControlX !== undefined
                    ? currentX * 2 - lastQuadraticControlX
                    : currentX;
                const absoluteControlY = previousCurveKind === 'quadratic' && lastQuadraticControlY !== undefined
                    ? currentY * 2 - lastQuadraticControlY
                    : currentY;
                const startX = currentX;
                const startY = currentY;
                currentX = command === 't' ? currentX + x : x;
                currentY = command === 't' ? currentY + y : y;
                commands.push(buildNativeVectorCubicCurveFromQuadratic(
                    startX,
                    startY,
                    absoluteControlX,
                    absoluteControlY,
                    currentX,
                    currentY,
                ));
                lastQuadraticControlX = absoluteControlX;
                lastQuadraticControlY = absoluteControlY;
                lastCubicControlX = undefined;
                lastCubicControlY = undefined;
                previousCurveKind = 'quadratic';
                break;
            }
            case 'A':
            case 'a': {
                const radiusX = readNumber();
                const radiusY = readNumber();
                const rotation = readNumber();
                const largeArcFlag = readNumber();
                const sweepFlag = readNumber();
                const x = readNumber();
                const y = readNumber();
                if (radiusX === undefined || radiusY === undefined || rotation === undefined || largeArcFlag === undefined || sweepFlag === undefined || x === undefined || y === undefined) {
                    return undefined;
                }

                const targetX = command === 'a' ? currentX + x : x;
                const targetY = command === 'a' ? currentY + y : y;
                const arcCommands = approximateNativeSvgArcAsCubicCurves(
                    currentX,
                    currentY,
                    radiusX,
                    radiusY,
                    rotation,
                    largeArcFlag >= 0.5,
                    sweepFlag >= 0.5,
                    targetX,
                    targetY,
                );
                if (!arcCommands) {
                    return undefined;
                }

                commands.push(...arcCommands);
                currentX = targetX;
                currentY = targetY;
                lastCubicControlX = undefined;
                lastCubicControlY = undefined;
                lastQuadraticControlX = undefined;
                lastQuadraticControlY = undefined;
                previousCurveKind = undefined;
                break;
            }
            case 'Z':
            case 'z': {
                commands.push({ kind: 'close' });
                currentX = subpathStartX;
                currentY = subpathStartY;
                lastCubicControlX = undefined;
                lastCubicControlY = undefined;
                lastQuadraticControlX = undefined;
                lastQuadraticControlY = undefined;
                previousCurveKind = undefined;
                command = '';
                break;
            }
            default:
                return undefined;
        }
    }

    return commands.length > 0 ? commands : undefined;
}

export function parseNativeSvgPointList(value: NativePropValue | undefined): Array<{ x: number; y: number }> | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const tokens = value.match(/-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?/gi);
    if (!tokens || tokens.length < 4 || tokens.length % 2 !== 0) {
        return undefined;
    }

    const points: Array<{ x: number; y: number }> = [];
    for (let index = 0; index < tokens.length; index += 2) {
        const x = Number(tokens[index]);
        const y = Number(tokens[index + 1]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return undefined;
        }
        points.push({ x, y });
    }

    return points;
}

export function buildNativeVectorPathFromPoints(
    points: Array<{ x: number; y: number }>,
    closePath = false,
): NativeVectorPathCommand[] | undefined {
    if (points.length < 2) {
        return undefined;
    }

    const [firstPoint, ...remainingPoints] = points;
    const commands: NativeVectorPathCommand[] = [{ kind: 'moveTo', x: firstPoint.x, y: firstPoint.y }];
    for (const point of remainingPoints) {
        commands.push({ kind: 'lineTo', x: point.x, y: point.y });
    }

    if (closePath) {
        commands.push({ kind: 'close' });
    }

    return commands;
}

export function parseNativeVectorShape(node: NativeElementNode): NativeVectorShape | undefined {
    const fill = resolveNativeVectorPaintColor(node.props.fill, resolveNativeDefaultFillColor(node.sourceTag));
    const stroke = resolveNativeVectorPaintColor(node.props.stroke);
    const strokeWidth = resolveNativeVectorStrokeWidth(node);

    switch (node.sourceTag) {
        case 'circle': {
            const cx = parseNativeSvgNumber(node.props.cx);
            const cy = parseNativeSvgNumber(node.props.cy);
            const r = parseNativeSvgNumber(node.props.r);
            if (cx === undefined || cy === undefined || r === undefined) {
                return undefined;
            }

            return { kind: 'circle', cx, cy, r, fill, stroke, strokeWidth };
        }
        case 'ellipse': {
            const cx = parseNativeSvgNumber(node.props.cx);
            const cy = parseNativeSvgNumber(node.props.cy);
            const rx = parseNativeSvgNumber(node.props.rx);
            const ry = parseNativeSvgNumber(node.props.ry);
            if (cx === undefined || cy === undefined || rx === undefined || ry === undefined) {
                return undefined;
            }

            return { kind: 'ellipse', cx, cy, rx, ry, fill, stroke, strokeWidth };
        }
        case 'rect': {
            const x = parseNativeSvgNumber(node.props.x) ?? 0;
            const y = parseNativeSvgNumber(node.props.y) ?? 0;
            const width = parseNativeSvgNumber(node.props.width);
            const height = parseNativeSvgNumber(node.props.height);
            if (width === undefined || height === undefined) {
                return undefined;
            }

            return {
                kind: 'rect',
                x,
                y,
                width,
                height,
                rx: parseNativeSvgNumber(node.props.rx),
                ry: parseNativeSvgNumber(node.props.ry),
                fill,
                stroke,
                strokeWidth,
            };
        }
        case 'line': {
            const x1 = parseNativeSvgNumber(node.props.x1) ?? 0;
            const y1 = parseNativeSvgNumber(node.props.y1) ?? 0;
            const x2 = parseNativeSvgNumber(node.props.x2) ?? 0;
            const y2 = parseNativeSvgNumber(node.props.y2) ?? 0;
            return {
                kind: 'path',
                commands: [
                    { kind: 'moveTo', x: x1, y: y1 },
                    { kind: 'lineTo', x: x2, y: y2 },
                ],
                fill,
                stroke,
                strokeWidth,
            };
        }
        case 'polyline': {
            const points = parseNativeSvgPointList(node.props.points);
            const commands = points ? buildNativeVectorPathFromPoints(points, false) : undefined;
            if (!commands) {
                return undefined;
            }

            return { kind: 'path', commands, fill, stroke, strokeWidth };
        }
        case 'polygon': {
            const points = parseNativeSvgPointList(node.props.points);
            const commands = points ? buildNativeVectorPathFromPoints(points, true) : undefined;
            if (!commands) {
                return undefined;
            }

            return { kind: 'path', commands, fill, stroke, strokeWidth };
        }
        case 'path': {
            const data = typeof node.props.d === 'string' ? node.props.d.trim() : undefined;
            if (!data) {
                return undefined;
            }

            const commands = parseNativeSvgPathData(data);
            if (!commands) {
                return undefined;
            }

            return { kind: 'path', commands, fill, stroke, strokeWidth };
        }
        default:
            return undefined;
    }
}

export function collectNativeVectorShapes(nodes: NativeNode[]): NativeVectorShape[] | undefined {
    const shapes: NativeVectorShape[] = [];

    const visit = (items: NativeNode[]): boolean => {
        for (const item of items) {
            if (item.kind !== 'element' || item.component !== 'Vector') {
                return false;
            }

            if (item.sourceTag === 'g') {
                if (!visit(item.children)) {
                    return false;
                }
                continue;
            }

            const shape = parseNativeVectorShape(item);
            if (!shape) {
                return false;
            }
            shapes.push(shape);
        }

        return true;
    };

    return visit(nodes) && shapes.length > 0 ? shapes : undefined;
}

export function parseNativeVectorViewBox(value: NativePropValue | undefined): NativeVectorViewport | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const parts = value.trim().split(/[\s,]+/).map((part) => Number(part));
    if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
        return undefined;
    }

    const [minX, minY, width, height] = parts;
    if (width <= 0 || height <= 0) {
        return undefined;
    }

    return { minX, minY, width, height };
}

export function buildNativeVectorSpec(node: NativeElementNode): NativeVectorSpec | undefined {
    if (node.sourceTag !== 'svg') {
        return undefined;
    }

    const shapes = collectNativeVectorShapes(node.children);
    if (!shapes) {
        return undefined;
    }

    const viewBox = parseNativeVectorViewBox(node.props.viewBox);
    const intrinsicWidth = parseNativeSvgNumber(node.props.width) ?? viewBox?.width ?? 24;
    const intrinsicHeight = parseNativeSvgNumber(node.props.height) ?? viewBox?.height ?? 24;
    const viewport = viewBox ?? { minX: 0, minY: 0, width: intrinsicWidth, height: intrinsicHeight };

    return {
        viewport,
        shapes,
        intrinsicWidth: intrinsicWidth > 0 ? intrinsicWidth : viewport.width,
        intrinsicHeight: intrinsicHeight > 0 ? intrinsicHeight : viewport.height,
    };
}

export function buildNativeCanvasSpec(node: NativeElementNode): NativeCanvasSpec {
    const intrinsicWidth = parseNativeSvgNumber(node.props.width) ?? 300;
    const intrinsicHeight = parseNativeSvgNumber(node.props.height) ?? 150;

    return {
        intrinsicWidth: intrinsicWidth > 0 ? intrinsicWidth : 300,
        intrinsicHeight: intrinsicHeight > 0 ? intrinsicHeight : 150,
    };
}

export function resolveNativeCanvasFillFallback(kind: string): NativeColorValue | undefined {
    return kind === 'rect'
        || kind === 'circle'
        || kind === 'ellipse'
        || kind === 'polygon'
        || kind === 'path'
        ? getDefaultCurrentColor()
        : undefined;
}

export function resolveNativeCanvasStrokeFallback(kind: string): NativeColorValue | undefined {
    return kind === 'line' || kind === 'polyline'
        ? getDefaultCurrentColor()
        : undefined;
}

export function parseNativeCanvasStrokeWidth(op: NativePropObject): number | undefined {
    return parseNativeSvgNumber(op.strokeWidth ?? op.lineWidth) ?? undefined;
}

export function parseNativeCanvasPointList(value: NativePropValue | undefined): Array<{ x: number; y: number }> | undefined {
    if (typeof value === 'string') {
        return parseNativeSvgPointList(value);
    }

    if (!Array.isArray(value)) {
        return undefined;
    }

    const points: Array<{ x: number; y: number }> = [];
    for (const item of value) {
        if (Array.isArray(item)) {
            const x = parseNativeSvgNumber(item[0]);
            const y = parseNativeSvgNumber(item[1]);
            if (x === undefined || y === undefined) {
                return undefined;
            }
            points.push({ x, y });
            continue;
        }

        if (!isNativePropObjectValue(item)) {
            return undefined;
        }

        const x = parseNativeSvgNumber(item.x);
        const y = parseNativeSvgNumber(item.y);
        if (x === undefined || y === undefined) {
            return undefined;
        }
        points.push({ x, y });
    }

    return points.length >= 2 ? points : undefined;
}

export function parseNativeCanvasDrawOperation(op: NativePropObject): NativeVectorShape | undefined {
    const kind = typeof op.kind === 'string' ? op.kind.trim() : undefined;
    if (!kind) {
        return undefined;
    }

    const fill = resolveNativeVectorPaintColor(op.fill ?? op.fillStyle, resolveNativeCanvasFillFallback(kind));
    const stroke = resolveNativeVectorPaintColor(op.stroke ?? op.strokeStyle, resolveNativeCanvasStrokeFallback(kind));
    const strokeWidth = parseNativeCanvasStrokeWidth(op);

    switch (kind) {
        case 'rect': {
            const width = parseNativeSvgNumber(op.width);
            const height = parseNativeSvgNumber(op.height);
            if (width === undefined || height === undefined) {
                return undefined;
            }

            return {
                kind: 'rect',
                x: parseNativeSvgNumber(op.x) ?? 0,
                y: parseNativeSvgNumber(op.y) ?? 0,
                width,
                height,
                rx: parseNativeSvgNumber(op.rx),
                ry: parseNativeSvgNumber(op.ry),
                fill,
                stroke,
                strokeWidth,
            };
        }
        case 'circle': {
            const cx = parseNativeSvgNumber(op.cx);
            const cy = parseNativeSvgNumber(op.cy);
            const r = parseNativeSvgNumber(op.r);
            if (cx === undefined || cy === undefined || r === undefined) {
                return undefined;
            }

            return { kind: 'circle', cx, cy, r, fill, stroke, strokeWidth };
        }
        case 'ellipse': {
            const cx = parseNativeSvgNumber(op.cx);
            const cy = parseNativeSvgNumber(op.cy);
            const rx = parseNativeSvgNumber(op.rx);
            const ry = parseNativeSvgNumber(op.ry);
            if (cx === undefined || cy === undefined || rx === undefined || ry === undefined) {
                return undefined;
            }

            return { kind: 'ellipse', cx, cy, rx, ry, fill, stroke, strokeWidth };
        }
        case 'line': {
            const x1 = parseNativeSvgNumber(op.x1);
            const y1 = parseNativeSvgNumber(op.y1);
            const x2 = parseNativeSvgNumber(op.x2);
            const y2 = parseNativeSvgNumber(op.y2);
            if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) {
                return undefined;
            }

            return {
                kind: 'path',
                commands: [
                    { kind: 'moveTo', x: x1, y: y1 },
                    { kind: 'lineTo', x: x2, y: y2 },
                ],
                stroke,
                strokeWidth,
            };
        }
        case 'polyline': {
            const points = parseNativeCanvasPointList(op.points);
            const commands = points ? buildNativeVectorPathFromPoints(points, false) : undefined;
            if (!commands) {
                return undefined;
            }

            return { kind: 'path', commands, fill, stroke, strokeWidth };
        }
        case 'polygon': {
            const points = parseNativeCanvasPointList(op.points);
            const commands = points ? buildNativeVectorPathFromPoints(points, true) : undefined;
            if (!commands) {
                return undefined;
            }

            return { kind: 'path', commands, fill, stroke, strokeWidth };
        }
        case 'path': {
            const data = typeof op.d === 'string' ? op.d.trim() : undefined;
            if (!data) {
                return undefined;
            }

            const commands = parseNativeSvgPathData(data);
            if (!commands) {
                return undefined;
            }

            return { kind: 'path', commands, fill, stroke, strokeWidth };
        }
        default:
            return undefined;
    }
}

export function buildNativeCanvasDrawingSpec(node: NativeElementNode): NativeVectorSpec | undefined {
    const drawOps = node.props.drawOps;
    if (!Array.isArray(drawOps)) {
        return undefined;
    }

    const shapes = drawOps
        .map((op) => isNativePropObjectValue(op) ? parseNativeCanvasDrawOperation(op) : undefined)
        .filter((shape): shape is NativeVectorShape => Boolean(shape));
    if (shapes.length === 0) {
        return undefined;
    }

    const canvasSpec = buildNativeCanvasSpec(node);
    return {
        viewport: {
            minX: 0,
            minY: 0,
            width: canvasSpec.intrinsicWidth,
            height: canvasSpec.intrinsicHeight,
        },
        shapes,
        intrinsicWidth: canvasSpec.intrinsicWidth,
        intrinsicHeight: canvasSpec.intrinsicHeight,
    };
}
