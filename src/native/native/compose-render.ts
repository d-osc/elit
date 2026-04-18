import type { Child } from '../../core/types';
import type {
    AndroidComposeContext,
    AndroidComposeOptions,
    NativeElementNode,
    NativeNode,
    NativePropValue,
    NativeRenderHints,
    NativeTextNode,
    NativeTree,
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
import { quoteKotlinString, flattenTextContent } from '../strings';
import {
    buildNativeVectorSpec,
    buildNativeCanvasSpec,
    buildNativeCanvasDrawingSpec,
} from '../vector';
import {
    buildComposeCanvasSurfaceLines,
    buildComposeVectorCanvasLines,
} from '../canvas';
import {
    createNativeStateDescriptorMap,
    ensureComposeStateVariable,
    toComposeTextValueExpression,
    buildComposeTextExpression,
} from '../state';
import {
    resolveTextTransform,
    buildComposeTextStyleArgsFromStyle,
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
import { buildComposeModifier } from './compose-style';
import {
    renderComposeChildren,
    renderComposeContainerBody,
} from './compose-layout-render';
import { renderComposeControlNode } from './compose-control-render';

function indent(level: number): string {
    return '    '.repeat(level);
}

function renderTextComposable(node: NativeTextNode, level: number, context: AndroidComposeContext): string[] {
    if (node.stateId) {
        const { descriptor, variableName } = ensureComposeStateVariable(context, node.stateId);
        return [`${indent(level)}Text(text = ${toComposeTextValueExpression(variableName, descriptor)})`];
    }

    return [`${indent(level)}Text(text = ${quoteKotlinString(node.value)})`];
}

function renderComposeContainerNode(
    node: NativeElementNode,
    level: number,
    context: AndroidComposeContext,
    hints: NativeRenderHints,
    modifier: string,
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

    if (!hasOverlays) {
        return [
            ...baseLines,
            ...renderComposeContainerBody(flowNode, level, context, modifier, hints, renderComposeNode),
        ];
    }

    const lines = [
        ...baseLines,
        `${indent(level)}Box {`,
        ...renderComposeContainerBody(flowNode, level + 1, context, modifier, hints, renderComposeNode),
    ];

    absoluteChildren.forEach((child) => {
        lines.push(...renderComposeNode(child, level + 1, context, { ...hints, absoluteOverlay: true }));
    });
    fixedChildren.forEach((child) => {
        lines.push(...renderComposeNode(child, level + 1, context, {
            ...hints,
            absoluteOverlay: true,
            fillWidth: true,
            fillHeight: true,
        }));
    });

    lines.push(`${indent(level)}}`);
    return lines;
}

function renderComposeNode(
    node: NativeNode,
    level: number,
    context: AndroidComposeContext,
    hints: NativeRenderHints = {},
): string[] {
    if (node.kind === 'text') {
        return renderTextComposable(node, level, context);
    }

    const modifier = buildComposeModifier(node, context.resolvedStyles, hints, context.styleResolveOptions);
    const classComment = Array.isArray(node.props.classList) && node.props.classList.length > 0
        ? `${indent(level)}// classList: ${(node.props.classList as NativePropValue[]).map((item) => String(item)).join(' ')}`
        : undefined;
    const baseLines: string[] = [];
    if (classComment) {
        baseLines.push(classComment);
    }

    if (node.component === 'Text') {
        const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
        const dynamicText = buildComposeTextExpression(node.children, context, resolveTextTransform(style?.textTransform));
        const staticText = applyTextTransform(flattenTextContent(node.children), resolveTextTransform(style?.textTransform));
        const args = [`text = ${dynamicText ?? quoteKotlinString(staticText)}`];
        if (modifier !== 'Modifier') {
            args.push(`modifier = ${modifier}`);
        }
        args.push(...buildComposeTextStyleArgsFromStyle(style, context.styleResolveOptions));
        return [...baseLines, `${indent(level)}Text(${args.join(', ')})`];
    }

    const controlLines = renderComposeControlNode(node, level, context, hints, modifier, baseLines);
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
        return [
            ...baseLines,
            `${indent(level)}ElitImageSurface(source = ${quoteKotlinString(source)}, label = ${quoteKotlinString(fallbackLabel)}, alt = ${alt ? quoteKotlinString(alt) : 'null'}, modifier = ${modifier}${objectFit !== 'cover' ? `, objectFit = ${quoteKotlinString(objectFit)}` : ''}${objectPosition !== 'center' ? `, objectPosition = ${quoteKotlinString(objectPosition)}` : ''})`,
        ];
    }

    if (node.component === 'Vector') {
        const vectorSpec = buildNativeVectorSpec(node);
        if (vectorSpec) {
            const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
            return [
                ...baseLines,
                ...buildComposeVectorCanvasLines(
                    vectorSpec,
                    level,
                    modifier,
                    hasExplicitNativeWidthStyle(style),
                    hasExplicitNativeHeightStyle(style),
                ),
            ];
        }
    }

    if (node.component === 'Canvas') {
        const canvasSpec = buildNativeCanvasSpec(node);
        const drawingSpec = buildNativeCanvasDrawingSpec(node);
        const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
        return [
            ...baseLines,
            ...buildComposeCanvasSurfaceLines(
                canvasSpec,
                drawingSpec,
                level,
                modifier,
                hasExplicitNativeWidthStyle(style),
                hasExplicitNativeHeightStyle(style),
            ),
        ];
    }

    if (node.component === 'WebView') {
        context.helperFlags.add('webViewSurface');
        const source = resolveNativeSurfaceSource(node) ?? '';
        const label = resolveNativeAccessibilityLabel(node) ?? 'Web content';
        return [
            ...baseLines,
            `${indent(level)}ElitWebViewSurface(source = ${quoteKotlinString(source)}, label = ${quoteKotlinString(label)}, modifier = ${modifier})`,
        ];
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
            return [
                ...baseLines,
                `${indent(level)}ElitAudioSurface(source = ${quoteKotlinString(source)}, label = ${quoteKotlinString(label)}, autoPlay = ${autoPlay ? 'true' : 'false'}, loop = ${loop ? 'true' : 'false'}, muted = ${muted ? 'true' : 'false'}, modifier = ${modifier})`,
            ];
        }

        const poster = resolveNativeVideoPoster(node);
        const controls = shouldNativeShowVideoControls(node);
        const playsInline = shouldNativePlayInline(node);
        return [
            ...baseLines,
            `${indent(level)}ElitVideoSurface(source = ${quoteKotlinString(source)}, label = ${quoteKotlinString(label)}, autoPlay = ${autoPlay ? 'true' : 'false'}, loop = ${loop ? 'true' : 'false'}, muted = ${muted ? 'true' : 'false'}, controls = ${controls ? 'true' : 'false'}, playsInline = ${playsInline ? 'true' : 'false'}${poster ? `, poster = ${quoteKotlinString(poster)}` : ''}${objectFit !== 'cover' ? `, posterFit = ${quoteKotlinString(objectFit)}` : ''}${objectPosition !== 'center' ? `, posterPosition = ${quoteKotlinString(objectPosition)}` : ''}, modifier = ${modifier})`,
        ];
    }

    if (node.component === 'Cell') {
        const style = getStyleObject(node, context.resolvedStyles, context.styleResolveOptions);
        const cellHints: NativeRenderHints = {
            ...hints,
            ...(!hasExplicitNativeWidthStyle(style) ? { fillWidth: true } : {}),
            ...(!hasExplicitNativeHeightStyle(style) && hints.fillHeight ? { fillHeight: true } : {}),
        };
        return renderComposeContainerNode(node, level, context, cellHints, modifier, baseLines);
    }

    if (node.children.length > 0 || node.component === 'Screen') {
        return renderComposeContainerNode(node, level, context, hints, modifier, baseLines);
    }

    context.helperFlags.add('unsupportedPlaceholder');
    const label = flattenTextContent(node.children) || node.component;
    return [
        ...baseLines,
        `${indent(level)}Text(text = ${quoteKotlinString(label)}${modifier !== 'Modifier' ? `, modifier = ${modifier}` : ''})`,
    ];
}

function buildAndroidComposeHelpers(context: AndroidComposeContext): string[] {
    const helpers: string[] = [];

    if (context.helperFlags.has('bridge')) {
        helpers.push('');
        helpers.push('private object ElitNativeBridge {');
        helpers.push('    fun dispatch(action: String? = null, route: String? = null, payloadJson: String? = null) {');
        helpers.push('        android.util.Log.d("ElitNativeBridge", listOfNotNull(action, route, payloadJson).joinToString(" | "))');
        helpers.push('    }');
        helpers.push('');
        helpers.push('    fun controlEventPayload(event: String, sourceTag: String, inputType: String? = null, value: String? = null, values: List<String>? = null, checked: Boolean? = null, detailJson: String? = null): String {');
        helpers.push('        val parts = mutableListOf<String>()');
        helpers.push('        parts += "\"event\":\"$event\""');
        helpers.push('        parts += "\"sourceTag\":\"$sourceTag\""');
        helpers.push('        if (inputType != null) parts += "\"inputType\":\"$inputType\""');
        helpers.push('        if (value != null) parts += "\"value\":\"$value\""');
        helpers.push('        if (values != null) parts += "\"values\":\"${values.joinToString(",")}\""');
        helpers.push('        if (checked != null) parts += "\"checked\":\"$checked\""');
        helpers.push('        if (detailJson != null) parts += "\"detail\":$detailJson"');
        helpers.push('        return "{${parts.joinToString(",")}}"');
        helpers.push('    }');
        helpers.push('}');
    }

    if (context.helperFlags.has('downloadHandler')) {
        helpers.push('');
        helpers.push('private object ElitDownloadHandler {');
        helpers.push('    fun download(context: android.content.Context, source: String, suggestedName: String? = null) {');
        helpers.push('        val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(source))');
        helpers.push('        intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)');
        helpers.push('        kotlin.runCatching { context.startActivity(intent) }');
        helpers.push('    }');
        helpers.push('}');
    }

    if (context.helperFlags.has('backgroundImage') || context.helperFlags.has('imagePlaceholder')) {
        helpers.push('');
        helpers.push('@Composable');
        helpers.push('private fun ElitBackgroundImage(source: String, backgroundSize: String = "cover", backgroundPosition: String = "center", backgroundRepeat: String = "no-repeat", modifier: Modifier = Modifier) {');
        helpers.push('    androidx.compose.ui.viewinterop.AndroidView(');
        helpers.push('        factory = { context -> android.widget.ImageView(context).apply {');
        helpers.push('            scaleType = android.widget.ImageView.ScaleType.CENTER_CROP');
        helpers.push('            if (source.isNotBlank()) setImageURI(android.net.Uri.parse(source))');
        helpers.push('        } },');
        helpers.push('        modifier = modifier,');
        helpers.push('    )');
        helpers.push('}');
        helpers.push('');
        helpers.push('@Composable');
        helpers.push('private fun ElitImageSurface(source: String, label: String, alt: String? = null, modifier: Modifier = Modifier, objectFit: String = "cover", objectPosition: String = "center") {');
        helpers.push('    if (source.isBlank()) {');
        helpers.push('        Box(modifier = modifier, contentAlignment = Alignment.Center) {');
        helpers.push('            Text(text = alt ?: label)');
        helpers.push('        }');
        helpers.push('        return');
        helpers.push('    }');
        helpers.push('    ElitBackgroundImage(source = source, backgroundSize = objectFit, backgroundPosition = objectPosition, modifier = modifier)');
        helpers.push('}');
    }

    if (context.helperFlags.has('webViewSurface')) {
        helpers.push('');
        helpers.push('@Composable');
        helpers.push('private fun ElitWebViewSurface(source: String, label: String, modifier: Modifier = Modifier) {');
        helpers.push('    androidx.compose.ui.viewinterop.AndroidView(');
        helpers.push('        factory = { context -> android.webkit.WebView(context).apply {');
        helpers.push('            contentDescription = label');
        helpers.push('            settings.javaScriptEnabled = true');
        helpers.push('            if (source.isNotBlank()) loadUrl(source)');
        helpers.push('        } },');
        helpers.push('        modifier = modifier,');
        helpers.push('    )');
        helpers.push('}');
    }

    if (context.helperFlags.has('mediaSurface')) {
        helpers.push('');
        helpers.push('@Composable');
        helpers.push('private fun ElitVideoSurface(source: String, label: String, autoPlay: Boolean, loop: Boolean, muted: Boolean, controls: Boolean, playsInline: Boolean, poster: String? = null, posterFit: String = "cover", posterPosition: String = "center", modifier: Modifier = Modifier) {');
        helpers.push('    Box(modifier = modifier, contentAlignment = Alignment.Center) {');
        helpers.push('        Text(text = if (autoPlay) "Playing $label" else label)');
        helpers.push('    }');
        helpers.push('}');
        helpers.push('');
        helpers.push('@Composable');
        helpers.push('private fun ElitAudioSurface(source: String, label: String, autoPlay: Boolean, loop: Boolean, muted: Boolean, modifier: Modifier = Modifier) {');
        helpers.push('    Button(onClick = {}, modifier = modifier) {');
        helpers.push('        Text(text = label)');
        helpers.push('    }');
        helpers.push('}');
    }

    return helpers;
}

export function renderAndroidCompose(input: Child | NativeTree, options: AndroidComposeOptions = {}): string {
    const tree = isNativeTree(input)
        ? input
        : renderNativeTree(input, { platform: 'android' });

    const resolvedOptions = {
        packageName: options.packageName ?? 'com.elit.generated',
        functionName: options.functionName ?? 'ElitScreen',
        includePackage: options.includePackage ?? true,
        includeImports: options.includeImports ?? true,
        includePreview: options.includePreview ?? false,
    };

    const styleResolveOptions = getNativeStyleResolveOptions('android');
    const styleData = buildRootResolvedStyleData(tree.roots, styleResolveOptions);

    const context: AndroidComposeContext = {
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
        ? renderComposeNode(tree.roots[0], 1, context, { availableWidth: styleResolveOptions.viewportWidth, availableHeight: styleResolveOptions.viewportHeight })
        : [
            '    Column(modifier = Modifier.fillMaxSize()) {',
            ...renderComposeChildren(tree.roots, 2, context, renderComposeNode, 'Column', undefined, { availableWidth: styleResolveOptions.viewportWidth, availableHeight: styleResolveOptions.viewportHeight }),
            '    }',
        ];

    const lines: string[] = [];

    if (resolvedOptions.includePackage) {
        lines.push(`package ${resolvedOptions.packageName}`);
        lines.push('');
    }

    if (resolvedOptions.includeImports) {
        lines.push('import androidx.compose.foundation.layout.*');
        lines.push('import androidx.compose.foundation.background');
        lines.push('import androidx.compose.foundation.border');
        lines.push('import androidx.compose.foundation.clickable');
        if (context.helperFlags.has('interactivePressState')) {
            lines.push('import androidx.compose.foundation.LocalIndication');
            lines.push('import androidx.compose.foundation.interaction.MutableInteractionSource');
            lines.push('import androidx.compose.foundation.interaction.collectIsPressedAsState');
        }
        lines.push('import androidx.compose.foundation.rememberScrollState');
        lines.push('import androidx.compose.foundation.text.BasicTextField');
        lines.push('import androidx.compose.foundation.verticalScroll');
        lines.push('import androidx.compose.ui.focus.focusRequester');
        lines.push('import androidx.compose.ui.draw.alpha');
        lines.push('import androidx.compose.ui.draw.clip');
        lines.push('import androidx.compose.ui.draw.drawBehind');
        lines.push('import androidx.compose.ui.draw.shadow');
        lines.push('import androidx.compose.ui.graphics.graphicsLayer');
        lines.push('import androidx.compose.material3.*');
        lines.push('import androidx.compose.runtime.*');
        lines.push('import androidx.compose.foundation.shape.RoundedCornerShape');
        lines.push('import androidx.compose.ui.Alignment');
        lines.push('import androidx.compose.ui.Modifier');
        lines.push('import androidx.compose.ui.graphics.Brush');
        lines.push('import androidx.compose.ui.graphics.Color');
        lines.push('import androidx.compose.ui.graphics.RectangleShape');
        lines.push('import androidx.compose.ui.graphics.SolidColor');
        lines.push('import androidx.compose.ui.semantics.Role');
        lines.push('import androidx.compose.ui.semantics.contentDescription');
        lines.push('import androidx.compose.ui.semantics.disabled');
        lines.push('import androidx.compose.ui.semantics.heading');
        lines.push('import androidx.compose.ui.semantics.role');
        lines.push('import androidx.compose.ui.semantics.selected');
        lines.push('import androidx.compose.ui.semantics.semantics');
        lines.push('import androidx.compose.ui.semantics.stateDescription');
        if (context.helperFlags.has('downloadHandler')) {
            lines.push('import androidx.compose.ui.platform.LocalContext');
        }
        if (context.helperFlags.has('uriHandler')) {
            lines.push('import androidx.compose.ui.platform.LocalUriHandler');
        }
        lines.push('import androidx.compose.ui.text.font.FontFamily');
        lines.push('import androidx.compose.ui.text.font.FontWeight');
        lines.push('import androidx.compose.ui.text.style.TextDecoration');
        lines.push('import androidx.compose.ui.text.style.TextAlign');
        lines.push('import androidx.compose.ui.tooling.preview.Preview');
        lines.push('import androidx.compose.ui.zIndex');
        lines.push('import androidx.compose.ui.unit.dp');
        lines.push('import androidx.compose.ui.unit.sp');
        lines.push('');
    }

    lines.push('@Composable');
    lines.push(`fun ${resolvedOptions.functionName}() {`);
    if (context.helperFlags.has('uriHandler')) {
        lines.push(`${indent(1)}val uriHandler = LocalUriHandler.current`);
    }
    if (context.helperFlags.has('downloadHandler')) {
        lines.push(`${indent(1)}val localContext = LocalContext.current`);
    }
    if ((context.helperFlags.has('uriHandler') || context.helperFlags.has('downloadHandler')) && context.stateDeclarations.length > 0) {
        lines.push('');
    }
    if (context.stateDeclarations.length > 0) {
        lines.push(...context.stateDeclarations);
        lines.push('');
    }
    lines.push(...bodyLines);
    lines.push('}');

    if (resolvedOptions.includePreview) {
        lines.push('');
        lines.push('@Preview(showBackground = true)');
        lines.push('@Composable');
        lines.push(`private fun ${resolvedOptions.functionName}Preview() {`);
        lines.push(`    ${resolvedOptions.functionName}()`);
        lines.push('}');
    }

    lines.push(...buildAndroidComposeHelpers(context));
    lines.push('');
    return lines.join('\n');
}