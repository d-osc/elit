import type { Child } from '../../core/types';
import type {
    NativeElementNode,
    NativeNode,
    NativePropValue,
    NativeRenderHints,
    NativeTextNode,
    NativeTree,
    SwiftUIContext,
    SwiftUIOptions,
} from '../types';
import { getNativeStyleResolveOptions } from '../units';
import {
    resolveNativeObjectFitStyle,
    resolveNativeObjectPositionStyle,
} from '../background';
import {
    toNativeBoolean,
    isNativeMuted,
    shouldNativeShowVideoControls,
    resolveNativeVideoPoster,
    shouldNativePlayInline,
    resolveNativeMediaLabel,
    resolveImageFallbackLabel,
    resolveNativeAccessibilityLabel,
    resolveNativeSurfaceSource,
} from '../interaction';
import { quoteSwiftString, flattenTextContent } from '../strings';
import {
    buildNativeVectorSpec,
    buildNativeCanvasSpec,
    buildNativeCanvasDrawingSpec,
} from '../vector';
import {
    buildSwiftCanvasSurfaceLines,
    buildSwiftVectorCanvasLines,
} from '../canvas';
import {
    appendSwiftUIModifiers,
    appendSwiftUIOverlays,
} from '../render-support';
import {
    createNativeStateDescriptorMap,
    ensureSwiftStateVariable,
    toSwiftTextValueExpression,
    buildSwiftTextExpression,
} from '../state';
import {
    resolveTextTransform,
    applyTextTransform,
} from '../typography';
import {
    hasExplicitNativeWidthStyle,
    hasExplicitNativeHeightStyle,
} from '../layout';
import {
    splitAbsolutePositionedChildren,
    splitFixedPositionedChildren,
} from './chunked-layout';
import { isNativeTree, renderNativeTree } from './tree';
import {
    buildRootResolvedStyleData,
    getStyleObject,
} from './style-resolve';
import { buildSwiftUIModifiers } from './swiftui-style';
import {
    renderSwiftUIChildren,
    renderSwiftUIContainerBody,
} from './swiftui-layout-render';
import { renderSwiftUIControlNode } from './swiftui-control-render';

function indent(level: number): string {
    return '    '.repeat(level);
}

function renderTextView(node: NativeTextNode, level: number, context: SwiftUIContext): string[] {
    if (node.stateId) {
        const { descriptor, variableName } = ensureSwiftStateVariable(context, node.stateId);
        return [`${indent(level)}Text(${toSwiftTextValueExpression(variableName, descriptor)})`];
    }

    return [`${indent(level)}Text(${quoteSwiftString(node.value)})`];
}

function renderSwiftUIContainerNode(
    node: NativeElementNode,
    level: number,
    context: SwiftUIContext,
    hints: NativeRenderHints,
    baseLines: string[],
): string[] {
    const { flowChildren: nonFixedChildren, fixedChildren } = splitFixedPositionedChildren(
        node.children,
        context.resolvedStyles,
        context.styleResolveOptions,
    );
    const { flowChildren, absoluteChildren } = splitAbsolutePositionedChildren(
        nonFixedChildren,
        context.resolvedStyles,
        context.styleResolveOptions,
    );
    const hasOverlays = absoluteChildren.length > 0 || fixedChildren.length > 0;
    const flowNode = hasOverlays ? { ...node, children: flowChildren } : node;
    const contentLines = renderSwiftUIContainerBody(flowNode, level, context, hints, renderSwiftUINode);

    if (!hasOverlays) {
        return [...baseLines, ...contentLines];
    }

    const overlays = [
        ...absoluteChildren.map((child) => renderSwiftUINode(child, level + 2, context, { ...hints, absoluteOverlay: true })),
        ...fixedChildren.map((child) => renderSwiftUINode(child, level + 2, context, {
            ...hints,
            absoluteOverlay: true,
            fillWidth: true,
            fillHeight: true,
        })),
    ];

    return [...baseLines, ...appendSwiftUIOverlays(contentLines, overlays, level)];
}

function renderSwiftUINode(
    node: NativeNode,
    level: number,
    context: SwiftUIContext,
    hints: NativeRenderHints = {},
): string[] {
    if (node.kind === 'text') {
        return renderTextView(node, level, context);
    }

    const modifiers = buildSwiftUIModifiers(node, context.resolvedStyles, hints, context.styleResolveOptions);
    const classComment = Array.isArray(node.props.classList) && node.props.classList.length > 0
        ? `${indent(level)}// classList: ${(node.props.classList as NativePropValue[]).map((item) => String(item)).join(' ')}`
        : undefined;
    const baseLines: string[] = [];
    if (classComment) {
        baseLines.push(classComment);
    }

    if (node.component === 'Text') {
        const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
        const dynamicText = buildSwiftTextExpression(node.children, context, resolveTextTransform(style?.textTransform));
        const staticText = applyTextTransform(flattenTextContent(node.children), resolveTextTransform(style?.textTransform));
        return appendSwiftUIModifiers(
            [...baseLines, `${indent(level)}Text(${dynamicText ?? quoteSwiftString(staticText)})`],
            modifiers,
            level,
        );
    }

    const controlLines = renderSwiftUIControlNode(node, level, context, hints, baseLines);
    if (controlLines) {
        return controlLines;
    }

    if (node.component === 'Image') {
        context.helperFlags.add('imagePlaceholder');
        context.helperFlags.add('backgroundImage');
        const source = resolveNativeSurfaceSource(node) ?? '';
        const alt = typeof node.props.alt === 'string' ? node.props.alt : undefined;
        const fallbackLabel = resolveImageFallbackLabel(source, alt);
        const imageStyle = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
        const objectFit = resolveNativeObjectFitStyle(imageStyle);
        const objectPosition = resolveNativeObjectPositionStyle(imageStyle);
        return appendSwiftUIModifiers(
            [
                ...baseLines,
                `${indent(level)}elitImageSurface(source: ${quoteSwiftString(source)}, label: ${quoteSwiftString(fallbackLabel)}, alt: ${alt ? quoteSwiftString(alt) : 'nil'}, objectFit: ${quoteSwiftString(objectFit)}, objectPosition: ${quoteSwiftString(objectPosition)})`,
            ],
            modifiers,
            level,
        );
    }

    if (node.component === 'Vector') {
        const vectorSpec = buildNativeVectorSpec(node);
        if (vectorSpec) {
            const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
            const canvas = buildSwiftVectorCanvasLines(
                vectorSpec,
                level,
                modifiers,
                hasExplicitNativeWidthStyle(style),
                hasExplicitNativeHeightStyle(style),
            );
            return [...baseLines, ...appendSwiftUIModifiers(canvas.lines, canvas.modifiers, level)];
        }
    }

    if (node.component === 'Canvas') {
        const canvasSpec = buildNativeCanvasSpec(node);
        const drawingSpec = buildNativeCanvasDrawingSpec(node);
        const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
        const canvas = buildSwiftCanvasSurfaceLines(
            canvasSpec,
            drawingSpec,
            level,
            modifiers,
            hasExplicitNativeWidthStyle(style),
            hasExplicitNativeHeightStyle(style),
        );
        return [...baseLines, ...appendSwiftUIModifiers(canvas.lines, canvas.modifiers, level)];
    }

    if (node.component === 'WebView') {
        context.helperFlags.add('webViewSurface');
        const source = resolveNativeSurfaceSource(node) ?? '';
        const label = resolveNativeAccessibilityLabel(node) ?? 'Web content';
        return appendSwiftUIModifiers(
            [
                ...baseLines,
                `${indent(level)}elitWebViewSurface(source: ${quoteSwiftString(source)}, label: ${quoteSwiftString(label)})`,
            ],
            modifiers,
            level,
        );
    }

    if (node.component === 'Media') {
        context.helperFlags.add('mediaSurface');
        const source = resolveNativeSurfaceSource(node) ?? '';
        const label = resolveNativeMediaLabel(node);
        const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
        const objectFit = resolveNativeObjectFitStyle(style);
        const objectPosition = resolveNativeObjectPositionStyle(style);
        const autoPlay = toNativeBoolean(node.props.autoPlay ?? node.props.autoplay);
        const loop = toNativeBoolean(node.props.loop);
        const muted = isNativeMuted(node);

        if (node.sourceTag === 'audio') {
            return appendSwiftUIModifiers(
                [
                    ...baseLines,
                    `${indent(level)}ElitAudioSurface(source: ${quoteSwiftString(source)}, label: ${quoteSwiftString(label)}, autoPlay: ${autoPlay ? 'true' : 'false'}, loop: ${loop ? 'true' : 'false'}, muted: ${muted ? 'true' : 'false'})`,
                ],
                modifiers,
                level,
            );
        }

        const poster = resolveNativeVideoPoster(node);
        const controls = shouldNativeShowVideoControls(node);
        const playsInline = shouldNativePlayInline(node);
        return appendSwiftUIModifiers(
            [
                ...baseLines,
                `${indent(level)}ElitVideoSurface(source: ${quoteSwiftString(source)}, label: ${quoteSwiftString(label)}, autoPlay: ${autoPlay ? 'true' : 'false'}, loop: ${loop ? 'true' : 'false'}, muted: ${muted ? 'true' : 'false'}, controls: ${controls ? 'true' : 'false'}, playsInline: ${playsInline ? 'true' : 'false'}${poster ? `, poster: ${quoteSwiftString(poster)}` : ''}, posterFit: ${quoteSwiftString(objectFit)}, posterPosition: ${quoteSwiftString(objectPosition)})`,
            ],
            modifiers,
            level,
        );
    }

    if (node.component === 'Cell') {
        const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
        const cellHints: NativeRenderHints = {
            ...hints,
            ...(!hasExplicitNativeWidthStyle(style) ? { fillWidth: true } : {}),
            ...(!hasExplicitNativeHeightStyle(style) && hints.fillHeight ? { fillHeight: true } : {}),
        };
        return renderSwiftUIContainerNode(node, level, context, cellHints, baseLines);
    }

    if (node.children.length > 0 || node.component === 'Screen') {
        return renderSwiftUIContainerNode(node, level, context, hints, baseLines);
    }

    context.helperFlags.add('unsupportedPlaceholder');
    const label = flattenTextContent(node.children) || node.component;
    return appendSwiftUIModifiers(
        [...baseLines, `${indent(level)}Text(${quoteSwiftString(label)})`],
        modifiers,
        level,
    );
}

function buildSwiftUIHelpers(context: SwiftUIContext): string[] {
    const helpers: string[] = [];

    if (context.helperFlags.has('bridge')) {
        helpers.push('');
        helpers.push('private enum ElitNativeBridge {');
        helpers.push('    static func dispatch(action: String? = nil, route: String? = nil, payloadJson: String? = nil) {');
        helpers.push('        print("ElitNativeBridge", action ?? "", route ?? "", payloadJson ?? "")');
        helpers.push('    }');
        helpers.push('');
        helpers.push('    static func controlEventPayload(event: String, sourceTag: String, inputType: String? = nil, value: String? = nil, values: [String]? = nil, checked: Bool? = nil, detailJson: String? = nil) -> String {');
        helpers.push('        var parts: [String] = []');
        helpers.push('        parts.append("\"event\":\"\(event)\"")');
        helpers.push('        parts.append("\"sourceTag\":\"\(sourceTag)\"")');
        helpers.push('        if let inputType { parts.append("\"inputType\":\"\(inputType)\"") }');
        helpers.push('        if let value { parts.append("\"value\":\"\(value)\"") }');
        helpers.push('        if let values { parts.append("\"values\":\"\(values.joined(separator: ","))\"") }');
        helpers.push('        if let checked { parts.append("\"checked\":\"\(checked)\"") }');
        helpers.push('        if let detailJson { parts.append("\"detail\":\(detailJson)") }');
        helpers.push('        return "{\(parts.joined(separator: ","))}"');
        helpers.push('    }');
        helpers.push('}');
    }

    if (context.helperFlags.has('downloadHandler')) {
        helpers.push('');
        helpers.push('private func elitDownloadFile(from source: String, suggestedName: String? = nil) {');
        helpers.push('    print("Download", source, suggestedName ?? "")');
        helpers.push('}');
    }

    if (context.helperFlags.has('backgroundImage') || context.helperFlags.has('imagePlaceholder')) {
        helpers.push('');
        helpers.push('@ViewBuilder');
        helpers.push('private func elitBackgroundImageSurface(source: String, objectFit: String = "cover", objectPosition: String = "center") -> some View {');
        helpers.push('    if let url = URL(string: source), !source.isEmpty {');
        helpers.push('        AsyncImage(url: url) { phase in');
        helpers.push('            switch phase {');
        helpers.push('            case .success(let image):');
        helpers.push('                image');
        helpers.push('                    .resizable()');
        helpers.push('                    .scaledToFill()');
        helpers.push('            default:');
        helpers.push('                Color.clear');
        helpers.push('            }');
        helpers.push('        }');
        helpers.push('    } else {');
        helpers.push('        Color.clear');
        helpers.push('    }');
        helpers.push('}');
        helpers.push('');
        helpers.push('@ViewBuilder');
        helpers.push('private func elitImageSurface(source: String, label: String, alt: String? = nil, objectFit: String = "cover", objectPosition: String = "center") -> some View {');
        helpers.push('    if source.isEmpty {');
        helpers.push('        Text(alt ?? label)');
        helpers.push('            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)');
        helpers.push('    } else {');
        helpers.push('        elitBackgroundImageSurface(source: source, objectFit: objectFit, objectPosition: objectPosition)');
        helpers.push('    }');
        helpers.push('}');
    }

    if (context.helperFlags.has('webViewSurface')) {
        helpers.push('');
        helpers.push('@ViewBuilder');
        helpers.push('private func elitWebViewSurface(source: String, label: String) -> some View {');
        helpers.push('    VStack(alignment: .leading, spacing: 8) {');
        helpers.push('        Text(label)');
        helpers.push('        Text(source)');
        helpers.push('            .font(.caption)');
        helpers.push('            .foregroundStyle(.secondary)');
        helpers.push('    }');
        helpers.push('}');
    }

    if (context.helperFlags.has('mediaSurface')) {
        helpers.push('');
        helpers.push('@ViewBuilder');
        helpers.push('private func ElitVideoSurface(source: String, label: String, autoPlay: Bool, loop: Bool, muted: Bool, controls: Bool, playsInline: Bool, poster: String? = nil, posterFit: String = "cover", posterPosition: String = "center") -> some View {');
        helpers.push('    VStack(alignment: .leading, spacing: 8) {');
        helpers.push('        if let poster, !poster.isEmpty {');
        helpers.push('            elitBackgroundImageSurface(source: poster, objectFit: posterFit, objectPosition: posterPosition)');
        helpers.push('        }');
        helpers.push('        Text(label)');
        helpers.push('    }');
        helpers.push('}');
        helpers.push('');
        helpers.push('@ViewBuilder');
        helpers.push('private func ElitAudioSurface(source: String, label: String, autoPlay: Bool, loop: Bool, muted: Bool) -> some View {');
        helpers.push('    Label(label, systemImage: "waveform")');
        helpers.push('}');
    }

    return helpers;
}

export function renderSwiftUI(input: Child | NativeTree, options: SwiftUIOptions = {}): string {
    const tree = isNativeTree(input)
        ? input
        : renderNativeTree(input, { platform: 'ios' });

    const resolvedOptions = {
        structName: options.structName ?? 'ElitScreen',
        includeImports: options.includeImports ?? true,
        includePreview: options.includePreview ?? false,
    };

    const styleResolveOptions = getNativeStyleResolveOptions('ios');
    const styleData = buildRootResolvedStyleData(tree.roots, styleResolveOptions);

    const context: SwiftUIContext = {
        textFieldIndex: 0,
        sliderIndex: 0,
        toggleIndex: 0,
        pickerIndex: 0,
        interactionIndex: 0,
        stateDeclarations: [],
        stateDescriptors: createNativeStateDescriptorMap(tree),
        declaredStateIds: new Set(),
        helperFlags: new Set(),
        styleResolveOptions,
        resolvedStyles: styleData.resolvedStyles,
        styleContexts: styleData.styleContexts,
    };

    const bodyLines = tree.roots.length === 1
        ? renderSwiftUINode(tree.roots[0], 2, context, { availableWidth: styleResolveOptions.viewportWidth, availableHeight: styleResolveOptions.viewportHeight })
        : [
            '        VStack(alignment: .leading, spacing: 0) {',
            ...renderSwiftUIChildren(tree.roots, 3, context, renderSwiftUINode, 'VStack', undefined, { availableWidth: styleResolveOptions.viewportWidth, availableHeight: styleResolveOptions.viewportHeight }),
            '        }',
        ];

    const lines: string[] = [];

    if (resolvedOptions.includeImports) {
        lines.push('import SwiftUI');
        if (context.helperFlags.has('backgroundImage') || context.helperFlags.has('imagePlaceholder') || context.helperFlags.has('openUrlHandler')) {
            lines.push('import Foundation');
        }
        lines.push('');
    }

    lines.push(`struct ${resolvedOptions.structName}: View {`);
    if (context.helperFlags.has('openUrlHandler')) {
        lines.push(`${indent(1)}@Environment(\\.openURL) private var openURL`);
    }
    if (context.stateDeclarations.length > 0) {
        lines.push(...context.stateDeclarations);
    }
    if (context.helperFlags.has('openUrlHandler') || context.stateDeclarations.length > 0) {
        lines.push('');
    }
    lines.push(`${indent(1)}var body: some View {`);
    lines.push(...bodyLines);
    lines.push(`${indent(1)}}`);
    lines.push('}');

    if (resolvedOptions.includePreview) {
        lines.push('');
        lines.push('#Preview {');
        lines.push(`${indent(1)}${resolvedOptions.structName}()`);
        lines.push('}');
    }

    lines.push(...buildSwiftUIHelpers(context));
    lines.push('');
    return lines.join('\n');
}