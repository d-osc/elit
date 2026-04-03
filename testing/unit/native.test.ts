/// <reference path="../../src/test-globals.d.ts" />

import { a, button, div, frag, h1, h2, img, input, li, main, p, span, textarea, ul } from '../../src/el';
import { renderAndroidCompose, renderNativeJson, renderNativeTree, renderSwiftUI } from '../../src/native';
import { bindChecked, bindValue, createState } from '../../src/state';
import styles from '../../src/style';
import { createUniversalBridgeProps, createUniversalLinkProps, mergeUniversalProps } from '../../src/universal';

describe('native target foundation', () => {
    beforeEach(() => {
        styles.clear();
    });

    afterEach(() => {
        styles.clear();
    });

    it('converts existing Elit syntax into serializable native IR', () => {
        const tree = renderNativeTree(
            div(
                { className: ['screen', 'stack'], style: { padding: '16px' } },
                h1('Hello Elit Native'),
                span('Shared syntax'),
                button({ onClick: () => undefined }, 'Tap me'),
                input({ value: 'abc', placeholder: 'Search' }),
                input({ type: 'checkbox', checked: true }),
                img({ src: './logo.png', alt: 'Logo' }),
                ul(li('One'), li('Two')),
                frag('Tail')
            ),
            { platform: 'android' }
        );

        expect(tree.platform).toBe('android');
        expect(tree.roots).toHaveLength(1);

        const [screen] = tree.roots;
        expect(screen.kind).toBe('element');
        if (screen.kind !== 'element') {
            throw new Error('Expected root element node');
        }

        expect(screen.component).toBe('View');
        expect(screen.props.classList).toEqual(['screen', 'stack']);
        expect(screen.children[0]).toEqual({
            kind: 'element',
            component: 'Text',
            sourceTag: 'h1',
            props: {},
            events: [],
            children: [{ kind: 'text', value: 'Hello Elit Native' }],
        });

        const buttonNode = screen.children[2];
        expect(buttonNode).toEqual({
            kind: 'element',
            component: 'Button',
            sourceTag: 'button',
            props: {},
            events: ['press'],
            children: [
                {
                    kind: 'element',
                    component: 'Text',
                    sourceTag: '#text',
                    props: {},
                    events: [],
                    children: [{ kind: 'text', value: 'Tap me' }],
                },
            ],
        });

        const inputNode = screen.children[3];
        expect(inputNode).toEqual({
            kind: 'element',
            component: 'TextInput',
            sourceTag: 'input',
            props: { value: 'abc', placeholder: 'Search' },
            events: [],
            children: [],
        });

        const toggleNode = screen.children[4];
        expect(toggleNode).toEqual({
            kind: 'element',
            component: 'Toggle',
            sourceTag: 'input',
            props: { checked: true },
            events: [],
            children: [],
        });

        const imageNode = screen.children[5];
        expect(imageNode).toEqual({
            kind: 'element',
            component: 'Image',
            sourceTag: 'img',
            props: { source: './logo.png', alt: 'Logo' },
            events: [],
            children: [],
        });
    });

    it('renders native IR as stable JSON output', () => {
        const json = renderNativeJson(div('Hello'));
        expect(json).toContain('"component": "View"');
        expect(json).toContain('"component": "Text"');
        expect(json).toContain('"value": "Hello"');
    });

    it('renders Jetpack Compose code from the same Elit syntax', () => {
        const compose = renderAndroidCompose(
            div(
                { style: { padding: '16px' } },
                h1('Hello Native'),
                input({ value: 'abc', placeholder: 'Search' }),
                input({ type: 'checkbox', checked: true }),
                a({ href: 'https://elit.dev/docs' }, 'Docs'),
                button({ onClick: () => undefined }, 'Tap me'),
                img({ src: './logo.png', alt: 'Logo' })
            ),
            { functionName: 'GeneratedScreen', includePreview: true }
        );

        expect(compose).toContain('fun GeneratedScreen()');
        expect(compose).toContain('val uriHandler = LocalUriHandler.current');
        expect(compose).toContain('Column(modifier = Modifier.padding(16.dp))');
        expect(compose).toContain('Text(text = "Hello Native")');
        expect(compose).toContain('BasicTextField(');
        expect(compose).toContain('Checkbox(');
        expect(compose).toContain('uriHandler.openUri("https://elit.dev/docs")');
        expect(compose).toContain('Box(modifier = Modifier.clickable { uriHandler.openUri("https://elit.dev/docs") }, contentAlignment = Alignment.Center)');
        expect(compose).toContain('// TODO: wire elit event(s): press');
        expect(compose).toContain('Box(modifier = Modifier, contentAlignment = Alignment.Center)');
        expect(compose).toContain('ElitImagePlaceholder(');
        expect(compose).toContain('@Preview(showBackground = true)');
    });

    it('renders SwiftUI code from the same Elit syntax', () => {
        const swiftui = renderSwiftUI(
            div(
                { style: { padding: '16px' } },
                h1('Hello Native'),
                input({ value: 'abc', placeholder: 'Search' }),
                input({ type: 'checkbox', checked: true }),
                a({ href: 'https://elit.dev/docs' }, 'Docs'),
                button({ onClick: () => undefined }, 'Tap me'),
                img({ src: './logo.png', alt: 'Logo' })
            ),
            { structName: 'GeneratedScreen', includePreview: true }
        );

        expect(swiftui).toContain('import Foundation');
        expect(swiftui).toContain('struct GeneratedScreen: View');
        expect(swiftui).toContain('@Environment(\\.openURL) private var openURL');
        expect(swiftui).toContain('@State private var textFieldValue0 = "abc"');
        expect(swiftui).toContain('@State private var toggleValue0 = true');
        expect(swiftui).toContain('VStack(alignment: .leading, spacing: 12) {');
        expect(swiftui).toContain('Text("Hello Native")');
        expect(swiftui).toContain('TextField("Search", text: $textFieldValue0)');
        expect(swiftui).toContain('Toggle("", isOn: $toggleValue0)');
        expect(swiftui).toContain('if let destination = URL(string: "https://elit.dev/docs") {');
        expect(swiftui).toContain('Button(action: {');
        expect(swiftui).toContain('elitImagePlaceholder(label: "LO", source: "./logo.png", alt: "Logo")');
        expect(swiftui).toContain('#Preview {');
    });

    it('renders screen roots as scrollable containers and uses refined image fallback labels', () => {
        const compose = renderAndroidCompose(
            main(img({ src: './public/favicon.svg', alt: 'Elit Universal Example icon' })),
            { functionName: 'ScrollableScreen' },
        );

        const swiftui = renderSwiftUI(
            main(img({ src: './public/favicon.svg', alt: 'Elit Universal Example icon' })),
            { structName: 'ScrollableScreen' },
        );

        expect(compose).toContain('Modifier.fillMaxSize().verticalScroll(rememberScrollState())');
        expect(compose).toContain('label = "EU"');

        expect(swiftui).toContain('ScrollView {');
        expect(swiftui).toContain('elitImagePlaceholder(label: "EU", source: "./public/favicon.svg", alt: "Elit Universal Example icon")');
    });

    it('renders Compose bridge helpers for universal action metadata', () => {
        const compose = renderAndroidCompose(
            div(
                button(
                    createUniversalBridgeProps({
                        action: 'validation.record',
                        route: '/native/coverage',
                        payload: { surface: 'android' },
                    }),
                    'Dispatch validation',
                ),
                a(
                    mergeUniversalProps(
                        createUniversalLinkProps('/native/checklist', {
                            payload: { source: 'compose-link' },
                        }),
                        { className: 'cta-link' },
                    ),
                    'Open checklist',
                ),
            ),
            { functionName: 'BridgeScreen' },
        );

        expect(compose).toContain('object ElitNativeBridge {');
        expect(compose).toContain('var onAction: ((String, String?, String?) -> Unit)? = null');
        expect(compose).toContain('var onNavigate: ((String) -> Unit)? = null');
        expect(compose).toContain('ElitNativeBridge.dispatch(action = "validation.record", route = "/native/coverage", payloadJson = "{\\"surface\\":\\"android\\"}")');
        expect(compose).toContain('ElitNativeBridge.dispatch(route = "/native/checklist", payloadJson = "{\\"source\\":\\"compose-link\\"}")');
    });

    it('renders SwiftUI bridge helpers for universal action metadata', () => {
        const swiftui = renderSwiftUI(
            div(
                button(
                    createUniversalBridgeProps({
                        action: 'validation.record',
                        route: '/native/coverage',
                        payload: { surface: 'ios' },
                    }),
                    'Dispatch validation',
                ),
                a(
                    createUniversalLinkProps('/native/checklist', {
                        payload: { source: 'swift-link' },
                    }),
                    'Open checklist',
                ),
            ),
            { structName: 'BridgeScreen' },
        );

        expect(swiftui).toContain('enum ElitNativeBridge {');
        expect(swiftui).toContain('static var onAction: ((String, String?, String?) -> Void)?');
        expect(swiftui).toContain('static var onNavigate: ((String) -> Void)?');
        expect(swiftui).toContain('ElitNativeBridge.dispatch(action: "validation.record", route: "/native/coverage", payloadJson: "{\\"surface\\":\\"ios\\"}")');
        expect(swiftui).toContain('ElitNativeBridge.dispatch(route: "/native/checklist", payloadJson: "{\\"source\\":\\"swift-link\\"}")');
    });

    it('maps richer shared style props into Compose output', () => {
        const compose = renderAndroidCompose(
            div(
                {
                    style: {
                        background: 'rgba(255, 249, 241, 0.92)',
                        border: '1px solid rgba(38, 25, 20, 0.12)',
                        borderRadius: '24px',
                        maxWidth: '320px',
                        padding: '24px',
                        gap: '12px',
                    },
                },
                div(
                    { style: { flexDirection: 'row', alignItems: 'center', gap: '20px' } },
                    span({ style: { color: '#d56e43', fontSize: '12px', fontWeight: '700', letterSpacing: '1.2px', textTransform: 'uppercase' } }, 'mobile'),
                    span({ style: { color: '#261914' } }, 'Styled card'),
                ),
            ),
            { functionName: 'StyledScreen' },
        );

        expect(compose).toContain('widthIn(max = 320.dp)');
        expect(compose).toContain('background(color = Color(');
        expect(compose).toContain('RoundedCornerShape(24.dp)');
        expect(compose).toContain('border(1.dp, Color(');
        expect(compose).toContain('verticalArrangement = Arrangement.spacedBy(12.dp)');
        expect(compose).toContain('Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(20.dp), verticalAlignment = Alignment.CenterVertically)');
        expect(compose).toContain('Text(text = "MOBILE", color = Color(');
        expect(compose).toContain('fontSize = 12.sp');
        expect(compose).toContain('fontWeight = FontWeight.W700');
        expect(compose).toContain('letterSpacing = 1.2.sp');
    });

    it('maps richer shared style props into SwiftUI output', () => {
        const swiftui = renderSwiftUI(
            div(
                {
                    style: {
                        background: 'rgba(255, 249, 241, 0.92)',
                        border: '1px solid rgba(38, 25, 20, 0.12)',
                        borderRadius: '24px',
                        maxWidth: '320px',
                        padding: '24px',
                        gap: '12px',
                    },
                },
                div(
                    { style: { flexDirection: 'row', alignItems: 'center', gap: '20px' } },
                    span({ style: { color: '#d56e43', fontSize: '12px', fontWeight: '700', letterSpacing: '1.2px', textTransform: 'uppercase' } }, 'mobile'),
                    span({ style: { color: '#261914' } }, 'Styled card'),
                ),
            ),
            { structName: 'StyledScreen' },
        );

        expect(swiftui).toContain('VStack(alignment: .leading, spacing: 12) {');
        expect(swiftui).toContain('HStack(alignment: .center, spacing: 20) {');
        expect(swiftui).toContain('Text("MOBILE")');
        expect(swiftui).toContain('.font(.system(size: 12, weight: .bold))');
        expect(swiftui).toContain('.kerning(1.2)');
        expect(swiftui).toContain('.background(Color(');
        expect(swiftui).toContain('.clipShape(RoundedRectangle(cornerRadius: 24))');
        expect(swiftui).toContain('.overlay(RoundedRectangle(cornerRadius: 24).stroke(Color(');
        expect(swiftui).toContain('.frame(maxWidth: 320)');
    });

    it('parses hsl alpha and named CSS colors into native output', () => {
        const compose = renderAndroidCompose(
            div(
                {
                    style: {
                        backgroundColor: 'hsla(120, 100%, 25%, 0.5)',
                        border: '1px solid transparent',
                        padding: '16px',
                    },
                },
                span({ style: { color: 'rebeccapurple' } }, 'Tone'),
            ),
            { functionName: 'CssColorParsingScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                {
                    style: {
                        backgroundColor: 'hsla(120, 100%, 25%, 0.5)',
                        border: '1px solid transparent',
                        padding: '16px',
                    },
                },
                span({ style: { color: 'rebeccapurple' } }, 'Tone'),
            ),
            { structName: 'CssColorParsingScreen' },
        );

        expect(compose).toContain('background(Color(red = 0f, green = 0.502f, blue = 0f, alpha = 0.5f))');
        expect(compose).toContain('border(1.dp, Color(red = 0f, green = 0f, blue = 0f, alpha = 0f))');
        expect(compose).toContain('Text(text = "Tone", color = Color(red = 0.4f, green = 0.2f, blue = 0.6f, alpha = 1f))');

        expect(swiftui).toContain('.background(Color(red: 0, green: 0.502, blue: 0, opacity: 0.5))');
        expect(swiftui).toContain('.overlay(RoundedRectangle(cornerRadius: 0).stroke(Color(red: 0, green: 0, blue: 0, opacity: 0), lineWidth: 1))');
        expect(swiftui).toContain('.foregroundStyle(Color(red: 0.4, green: 0.2, blue: 0.6, opacity: 1))');
    });

    it('parses hwb and modern rgb css color syntax into native output', () => {
        const compose = renderAndroidCompose(
            div(
                {
                    style: {
                        backgroundColor: 'hwb(0 20% 10% / 60%)',
                        border: '1px solid rgb(255 200 100 / 50%)',
                        padding: '16px',
                    },
                },
                span({ style: { color: 'rgb(10% 20% 30% / 40%)' } }, 'Tone'),
            ),
            { functionName: 'CssColorLevel4Screen' },
        );

        const swiftui = renderSwiftUI(
            div(
                {
                    style: {
                        backgroundColor: 'hwb(0 20% 10% / 60%)',
                        border: '1px solid rgb(255 200 100 / 50%)',
                        padding: '16px',
                    },
                },
                span({ style: { color: 'rgb(10% 20% 30% / 40%)' } }, 'Tone'),
            ),
            { structName: 'CssColorLevel4Screen' },
        );

        expect(compose).toContain('background(Color(red = 0.902f, green = 0.2f, blue = 0.2f, alpha = 0.6f))');
        expect(compose).toContain('border(1.dp, Color(red = 1f, green = 0.784f, blue = 0.392f, alpha = 0.5f))');
        expect(compose).toContain('Text(text = "Tone", color = Color(red = 0.102f, green = 0.2f, blue = 0.302f, alpha = 0.4f))');

        expect(swiftui).toContain('.background(Color(red: 0.902, green: 0.2, blue: 0.2, opacity: 0.6))');
        expect(swiftui).toContain('.overlay(RoundedRectangle(cornerRadius: 0).stroke(Color(red: 1, green: 0.784, blue: 0.392, opacity: 0.5), lineWidth: 1))');
        expect(swiftui).toContain('.foregroundStyle(Color(red: 0.102, green: 0.2, blue: 0.302, opacity: 0.4))');
    });

    it('parses extended named css colors into native output', () => {
        const compose = renderAndroidCompose(
            div(
                {
                    style: {
                        backgroundColor: 'aliceblue',
                        border: '1px solid goldenrod',
                        padding: '16px',
                    },
                },
                span({ style: { color: 'slateblue' } }, 'Tone'),
                span({ style: { color: 'darkslategrey' } }, 'Alias'),
            ),
            { functionName: 'ExtendedNamedColorScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                {
                    style: {
                        backgroundColor: 'aliceblue',
                        border: '1px solid goldenrod',
                        padding: '16px',
                    },
                },
                span({ style: { color: 'slateblue' } }, 'Tone'),
                span({ style: { color: 'darkslategrey' } }, 'Alias'),
            ),
            { structName: 'ExtendedNamedColorScreen' },
        );

        expect(compose).toContain('background(Color(red = 0.941f, green = 0.973f, blue = 1f, alpha = 1f))');
        expect(compose).toContain('border(1.dp, Color(red = 0.855f, green = 0.647f, blue = 0.125f, alpha = 1f))');
        expect(compose).toContain('Text(text = "Tone", color = Color(red = 0.416f, green = 0.353f, blue = 0.804f, alpha = 1f))');
        expect(compose).toContain('Text(text = "Alias", color = Color(red = 0.184f, green = 0.31f, blue = 0.31f, alpha = 1f))');

        expect(swiftui).toContain('.background(Color(red: 0.941, green: 0.973, blue: 1, opacity: 1))');
        expect(swiftui).toContain('.overlay(RoundedRectangle(cornerRadius: 0).stroke(Color(red: 0.855, green: 0.647, blue: 0.125, opacity: 1), lineWidth: 1))');
        expect(swiftui).toContain('.foregroundStyle(Color(red: 0.416, green: 0.353, blue: 0.804, opacity: 1))');
        expect(swiftui).toContain('.foregroundStyle(Color(red: 0.184, green: 0.31, blue: 0.31, opacity: 1))');
    });

    it('resolves currentColor through inherited text color across native surfaces', () => {
        const compose = renderAndroidCompose(
            div(
                { style: { color: 'slateblue', gap: '12px' } },
                div(
                    {
                        style: {
                            backgroundColor: 'currentColor',
                            border: '2px solid currentColor',
                            boxShadow: '0 8px 18px currentColor',
                            padding: '16px',
                        },
                    },
                    span({ style: { color: 'currentColor' } }, 'Tone'),
                ),
                div(
                    {
                        style: {
                            color: '#261914',
                            background: 'linear-gradient(currentColor, transparent)',
                            padding: '12px',
                        },
                    },
                    span('Gradient'),
                ),
            ),
            { functionName: 'CurrentColorScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { style: { color: 'slateblue', gap: '12px' } },
                div(
                    {
                        style: {
                            backgroundColor: 'currentColor',
                            border: '2px solid currentColor',
                            boxShadow: '0 8px 18px currentColor',
                            padding: '16px',
                        },
                    },
                    span({ style: { color: 'currentColor' } }, 'Tone'),
                ),
                div(
                    {
                        style: {
                            color: '#261914',
                            background: 'linear-gradient(currentColor, transparent)',
                            padding: '12px',
                        },
                    },
                    span('Gradient'),
                ),
            ),
            { structName: 'CurrentColorScreen' },
        );

        expect(compose).toContain('background(Color(red = 0.416f, green = 0.353f, blue = 0.804f, alpha = 1f))');
        expect(compose).toContain('border(2.dp, Color(red = 0.416f, green = 0.353f, blue = 0.804f, alpha = 1f))');
        expect(compose).toContain('Text(text = "Tone", color = Color(red = 0.416f, green = 0.353f, blue = 0.804f, alpha = 1f))');
        expect(compose).toContain('background(brush = Brush.linearGradient(colors = listOf(Color(red = 0.149f, green = 0.098f, blue = 0.078f, alpha = 1f), Color(red = 0f, green = 0f, blue = 0f, alpha = 0f))))');

        expect(swiftui).toContain('.background(Color(red: 0.416, green: 0.353, blue: 0.804, opacity: 1))');
        expect(swiftui).toContain('.overlay(RoundedRectangle(cornerRadius: 0).stroke(Color(red: 0.416, green: 0.353, blue: 0.804, opacity: 1), lineWidth: 2))');
        expect(swiftui).toContain('.shadow(color: Color(red: 0.416, green: 0.353, blue: 0.804, opacity: 1), radius: 9, x: 0, y: 8)');
        expect(swiftui).toContain('.foregroundStyle(Color(red: 0.416, green: 0.353, blue: 0.804, opacity: 1))');
        expect(swiftui).toContain('.background(LinearGradient(colors: [Color(red: 0.149, green: 0.098, blue: 0.078, opacity: 1), Color(red: 0, green: 0, blue: 0, opacity: 0)], startPoint: .topLeading, endPoint: .bottomTrailing))');
    });

    it('maps uniform border longhands into native output', () => {
        styles.addClass('longhand-card', {
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: '#d56e43',
            borderRadius: '12px',
            padding: '16px',
        });
        styles.addClass('uniform-side-card', {
            borderTopWidth: '1px',
            borderRightWidth: '1px',
            borderBottomWidth: '1px',
            borderLeftWidth: '1px',
            borderTopStyle: 'solid',
            borderRightStyle: 'solid',
            borderBottomStyle: 'solid',
            borderLeftStyle: 'solid',
            borderTopColor: '#261914',
            borderRightColor: '#261914',
            borderBottomColor: '#261914',
            borderLeftColor: '#261914',
            padding: '12px',
        });

        const compose = renderAndroidCompose(
            div(
                div({ className: 'longhand-card' }, span('Longhand border')),
                div({ className: 'uniform-side-card' }, span('Uniform side border')),
            ),
            { functionName: 'BorderLonghandScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                div({ className: 'longhand-card' }, span('Longhand border')),
                div({ className: 'uniform-side-card' }, span('Uniform side border')),
            ),
            { structName: 'BorderLonghandScreen' },
        );

        expect(compose).toContain('border(2.dp, Color(red = 0.835f, green = 0.431f, blue = 0.263f, alpha = 1f), RoundedCornerShape(12.dp))');
        expect(compose).toContain('border(1.dp, Color(red = 0.149f, green = 0.098f, blue = 0.078f, alpha = 1f))');

        expect(swiftui).toContain('.overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(red: 0.835, green: 0.431, blue: 0.263, opacity: 1), lineWidth: 2))');
        expect(swiftui).toContain('.overlay(RoundedRectangle(cornerRadius: 0).stroke(Color(red: 0.149, green: 0.098, blue: 0.078, opacity: 1), lineWidth: 1))');
    });

    it('maps non-uniform per-side borders into native output', () => {
        styles.addClass('side-border-card', {
            borderTopWidth: '1px',
            borderTopStyle: 'solid',
            borderTopColor: '#d56e43',
            borderRightWidth: '2px',
            borderRightStyle: 'solid',
            borderRightColor: 'rgb(12 44 88 / 80%)',
            borderBottomWidth: '3px',
            borderBottomStyle: 'solid',
            borderBottomColor: 'hwb(120 10% 20%)',
            borderLeftWidth: '4px',
            borderLeftStyle: 'solid',
            borderLeftColor: '#261914',
            padding: '16px',
        });

        const compose = renderAndroidCompose(
            div({ className: 'side-border-card' }, span('Side borders')),
            { functionName: 'SideBorderScreen' },
        );

        const swiftui = renderSwiftUI(
            div({ className: 'side-border-card' }, span('Side borders')),
            { structName: 'SideBorderScreen' },
        );

        expect(compose).toContain('drawBehind {');
        expect(compose).toContain('val topStroke = 1.dp.toPx()');
    expect(compose).toContain('drawLine(color = Color(red = 0.835f, green = 0.431f, blue = 0.263f, alpha = 1f), start = androidx.compose.ui.geometry.Offset(4.dp.toPx() / 2f, topStroke / 2f)');
    expect(compose).toContain('cap = androidx.compose.ui.graphics.StrokeCap.Square');
        expect(compose).toContain('val rightStroke = 2.dp.toPx()');
    expect(compose).toContain('drawLine(color = Color(red = 0.047f, green = 0.173f, blue = 0.345f, alpha = 0.8f), start = androidx.compose.ui.geometry.Offset(size.width - (rightStroke / 2f), 1.dp.toPx() / 2f)');
        expect(compose).toContain('val bottomStroke = 3.dp.toPx()');
    expect(compose).toContain('drawLine(color = Color(red = 0.102f, green = 0.8f, blue = 0.102f, alpha = 1f), start = androidx.compose.ui.geometry.Offset(4.dp.toPx() / 2f, size.height - (bottomStroke / 2f))');
        expect(compose).toContain('val leftStroke = 4.dp.toPx()');
    expect(compose).toContain('drawLine(color = Color(red = 0.149f, green = 0.098f, blue = 0.078f, alpha = 1f), start = androidx.compose.ui.geometry.Offset(leftStroke / 2f, 1.dp.toPx() / 2f)');

        expect(swiftui).toContain('.overlay { ZStack {');
        expect(swiftui).toContain('Rectangle().fill(Color(red: 0.835, green: 0.431, blue: 0.263, opacity: 1)).frame(height: 1).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)');
        expect(swiftui).toContain('Rectangle().fill(Color(red: 0.047, green: 0.173, blue: 0.345, opacity: 0.8)).frame(width: 2).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .trailing)');
        expect(swiftui).toContain('Rectangle().fill(Color(red: 0.102, green: 0.8, blue: 0.102, opacity: 1)).frame(height: 3).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)');
        expect(swiftui).toContain('Rectangle().fill(Color(red: 0.149, green: 0.098, blue: 0.078, opacity: 1)).frame(width: 4).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)');
    });

    it('maps dashed and dotted borders into native output', () => {
        styles.addClass('dashed-card', {
            border: '2px dashed #d56e43',
            borderRadius: '12px',
            padding: '16px',
        });
        styles.addClass('dotted-card', {
            borderWidth: '3px',
            borderStyle: 'dotted',
            borderColor: 'rgb(12 44 88 / 80%)',
            padding: '12px',
        });

        const compose = renderAndroidCompose(
            div(
                div({ className: 'dashed-card' }, span('Dashed border')),
                div({ className: 'dotted-card' }, span('Dotted border')),
            ),
            { functionName: 'StyledBorderScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                div({ className: 'dashed-card' }, span('Dashed border')),
                div({ className: 'dotted-card' }, span('Dotted border')),
            ),
            { structName: 'StyledBorderScreen' },
        );

        expect(compose).toContain('val strokeWidth = 2.dp.toPx()');
        expect(compose).toContain('val dashPattern = floatArrayOf(strokeWidth * 3f, strokeWidth * 2f)');
        expect(compose).toContain('drawRoundRect(color = Color(red = 0.835f, green = 0.431f, blue = 0.263f, alpha = 1f), cornerRadius = androidx.compose.ui.geometry.CornerRadius(borderRadius, borderRadius), style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeWidth, pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(dashPattern)))');
        expect(compose).toContain('val strokeWidth = 3.dp.toPx()');
        expect(compose).toContain('val dashPattern = floatArrayOf(strokeWidth, strokeWidth * 1.5f)');
        expect(compose).toContain('drawRect(color = Color(red = 0.047f, green = 0.173f, blue = 0.345f, alpha = 0.8f), style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeWidth, pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(dashPattern)))');

        expect(swiftui).toContain('.overlay(RoundedRectangle(cornerRadius: 12).stroke(Color(red: 0.835, green: 0.431, blue: 0.263, opacity: 1), style: StrokeStyle(lineWidth: 2, dash: [6, 4])))');
        expect(swiftui).toContain('.overlay(Rectangle().stroke(Color(red: 0.047, green: 0.173, blue: 0.345, opacity: 0.8), style: StrokeStyle(lineWidth: 3, dash: [3, 4.5])))');
    });

    it('maps non-uniform dashed and dotted side borders into native output', () => {
        styles.addClass('styled-side-border-card', {
            borderTopWidth: '1px',
            borderTopStyle: 'dashed',
            borderTopColor: '#d56e43',
            borderRightWidth: '2px',
            borderRightStyle: 'dotted',
            borderRightColor: 'rgb(12 44 88 / 80%)',
            borderBottomWidth: '3px',
            borderBottomStyle: 'solid',
            borderBottomColor: 'hwb(120 10% 20%)',
            borderLeftWidth: '4px',
            borderLeftStyle: 'dashed',
            borderLeftColor: 'goldenrod',
            padding: '16px',
        });

        const compose = renderAndroidCompose(
            div({ className: 'styled-side-border-card' }, span('Styled side borders')),
            { functionName: 'StyledSideBorderScreen' },
        );

        const swiftui = renderSwiftUI(
            div({ className: 'styled-side-border-card' }, span('Styled side borders')),
            { structName: 'StyledSideBorderScreen' },
        );

        expect(compose).toContain('val topStroke = 1.dp.toPx()');
        expect(compose).toContain('pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(topStroke * 3f, topStroke * 2f))');
        expect(compose).toContain('start = androidx.compose.ui.geometry.Offset(4.dp.toPx() / 2f, topStroke / 2f)');
        expect(compose).toContain('val rightStroke = 2.dp.toPx()');
        expect(compose).toContain('pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(rightStroke, rightStroke * 1.5f))');
        expect(compose).toContain('cap = androidx.compose.ui.graphics.StrokeCap.Round');
        expect(compose).toContain('val bottomStroke = 3.dp.toPx()');
        expect(compose).toContain('drawLine(color = Color(red = 0.102f, green = 0.8f, blue = 0.102f, alpha = 1f), start = androidx.compose.ui.geometry.Offset(4.dp.toPx() / 2f, size.height - (bottomStroke / 2f)), end = androidx.compose.ui.geometry.Offset(size.width - (2.dp.toPx() / 2f), size.height - (bottomStroke / 2f)), strokeWidth = bottomStroke, cap = androidx.compose.ui.graphics.StrokeCap.Square)');
        expect(compose).toContain('val leftStroke = 4.dp.toPx()');
        expect(compose).toContain('pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(leftStroke * 3f, leftStroke * 2f))');

        expect(swiftui).toContain('.overlay { GeometryReader { proxy in ZStack {');
        expect(swiftui).toContain('Path { path in path.move(to: CGPoint(x: CGFloat(4) / 2, y: CGFloat(1) / 2)); path.addLine(to: CGPoint(x: proxy.size.width - (CGFloat(2) / 2), y: CGFloat(1) / 2)) }.stroke(Color(red: 0.835, green: 0.431, blue: 0.263, opacity: 1), style: StrokeStyle(lineWidth: 1, lineCap: .square, dash: [3, 2]))');
        expect(swiftui).toContain('Path { path in path.move(to: CGPoint(x: proxy.size.width - (CGFloat(2) / 2), y: CGFloat(1) / 2)); path.addLine(to: CGPoint(x: proxy.size.width - (CGFloat(2) / 2), y: proxy.size.height - (CGFloat(3) / 2))) }.stroke(Color(red: 0.047, green: 0.173, blue: 0.345, opacity: 0.8), style: StrokeStyle(lineWidth: 2, lineCap: .round, dash: [2, 3]))');
        expect(swiftui).toContain('Path { path in path.move(to: CGPoint(x: CGFloat(4) / 2, y: proxy.size.height - (CGFloat(3) / 2))); path.addLine(to: CGPoint(x: proxy.size.width - (CGFloat(2) / 2), y: proxy.size.height - (CGFloat(3) / 2))) }.stroke(Color(red: 0.102, green: 0.8, blue: 0.102, opacity: 1), style: StrokeStyle(lineWidth: 3, lineCap: .square))');
        expect(swiftui).toContain('Path { path in path.move(to: CGPoint(x: CGFloat(4) / 2, y: CGFloat(1) / 2)); path.addLine(to: CGPoint(x: CGFloat(4) / 2, y: proxy.size.height - (CGFloat(3) / 2))) }.stroke(Color(red: 0.855, green: 0.647, blue: 0.125, opacity: 1), style: StrokeStyle(lineWidth: 4, lineCap: .square, dash: [12, 8]))');
    });

    it('maps registered className CSS into native output automatically', () => {
        const line = styles.addVar('line', 'rgba(38, 25, 20, 0.12)');
        const ember = styles.addVar('ember', '#d56e43');
        const clay = styles.addVar('clay', '#b75a36');

        styles.addClass('panel', {
            background: 'rgba(255, 249, 241, 0.92)',
            border: `1px solid ${line.toString()}`,
            borderRadius: '24px',
            padding: '24px',
            gap: '14px',
        });
        styles.addClass('button-row', {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
        });
        styles.addClass('btn', {
            padding: '12px 18px',
            borderRadius: '999px',
            fontWeight: 700,
        });
        styles.addClass('btn-primary', {
            background: `linear-gradient(135deg, ${styles.var(ember)} 0%, ${styles.var(clay)} 100%)`,
            color: '#fff6ee',
            boxShadow: '0 10px 28px rgba(102, 61, 35, 0.15)',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'panel' },
                div(
                    { className: 'button-row' },
                    button({ className: 'btn btn-primary' }, 'Launch now'),
                ),
            ),
            { functionName: 'ClassNameScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'panel' },
                div(
                    { className: 'button-row' },
                    button({ className: 'btn btn-primary' }, 'Launch now'),
                ),
            ),
            { structName: 'ClassNameScreen' },
        );

        expect(compose).toContain('background(color = Color(');
        expect(compose).toContain('border(1.dp, Color(');
        expect(compose).toContain('verticalArrangement = Arrangement.spacedBy(14.dp)');
        expect(compose).toContain('Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically)');
        expect(compose).toContain('Box(modifier = Modifier.shadow(elevation = 10.dp, shape = RoundedCornerShape(999.dp)).background(brush = Brush.linearGradient(colors = listOf(');
        expect(compose).toContain('.padding(top = 12.dp, end = 18.dp, bottom = 12.dp, start = 18.dp), contentAlignment = Alignment.Center)');
        expect(compose).toContain('Text(text = "Launch now", color = Color(');

        expect(swiftui).toContain('.background(Color(');
        expect(swiftui).toContain('.overlay(RoundedRectangle(cornerRadius: 24).stroke(Color(');
        expect(swiftui).toContain('HStack(alignment: .center, spacing: 12) {');
        expect(swiftui).toContain('.background(LinearGradient(colors: [Color(');
        expect(swiftui).toContain('.font(.system(size: 17, weight: .bold))');
    });

    it('maps descendant selectors with class ancestry into native output automatically', () => {
        styles.addClass('panel', {
            gap: '16px',
        });
        styles.descendant('.panel', 'h2', {
            color: '#261914',
            fontSize: '23px',
            fontWeight: 700,
        });
        styles.addClass('field-label', {
            gap: '6px',
        });
        styles.descendant('.field-label', 'span', {
            color: '#261914',
            fontWeight: 700,
            textTransform: 'uppercase',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'panel' },
                h2('Panel title'),
                div(
                    { className: 'field-label' },
                    span('question label'),
                ),
            ),
            { functionName: 'DescendantScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'panel' },
                h2('Panel title'),
                div(
                    { className: 'field-label' },
                    span('question label'),
                ),
            ),
            { structName: 'DescendantScreen' },
        );

        expect(compose).toContain('verticalArrangement = Arrangement.spacedBy(16.dp)');
        expect(compose).toContain('Text(text = "Panel title", color = Color(');
        expect(compose).toContain('fontSize = 23.sp');
        expect(compose).toContain('fontWeight = FontWeight.W700');
        expect(compose).toContain('Text(text = "QUESTION LABEL", color = Color(');

        expect(swiftui).toContain('VStack(alignment: .leading, spacing: 16) {');
        expect(swiftui).toContain('Text("Panel title")');
        expect(swiftui).toContain('.font(.system(size: 23, weight: .bold))');
        expect(swiftui).toContain('Text("QUESTION LABEL")');
    });

    it('maps child combinators, attribute selectors, and inherited text styles into native output automatically', () => {
        styles.addClass('theme', {
            color: '#261914',
            fontWeight: 700,
            textTransform: 'uppercase',
        });
        styles.addClass('toggle-row', {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
        });
        styles.child('.toggle-row', 'input[type="checkbox"]', {
            width: '20px',
            minWidth: '20px',
            height: '20px',
        });
        styles.child('.toggle-row', 'span', {
            letterSpacing: '1.2px',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'theme' },
                div(
                    { className: 'toggle-row' },
                    input({ type: 'checkbox', checked: true }),
                    span('native toggle'),
                ),
            ),
            { functionName: 'InheritedToggleScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'theme' },
                div(
                    { className: 'toggle-row' },
                    input({ type: 'checkbox', checked: true }),
                    span('native toggle'),
                ),
            ),
            { structName: 'InheritedToggleScreen' },
        );

        expect(compose).toContain('Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically)');
        expect(compose).toContain('modifier = Modifier.width(20.dp).height(20.dp).widthIn(min = 20.dp)');
        expect(compose).toContain('Text(text = "NATIVE TOGGLE", color = Color(');
        expect(compose).toContain('fontWeight = FontWeight.W700');
        expect(compose).toContain('letterSpacing = 1.2.sp');

        expect(swiftui).toContain('HStack(alignment: .center, spacing: 10) {');
        expect(swiftui).toContain('Toggle("", isOn: $toggleValue0)');
        expect(swiftui).toContain('.frame(width: 20, height: 20, minWidth: 20)');
        expect(swiftui).toContain('Text("NATIVE TOGGLE")');
        expect(swiftui).toContain('.foregroundStyle(Color(');
        expect(swiftui).toContain('.font(.system(size: 17, weight: .bold))');
    });

    it('maps sibling combinators and ancestor-sibling descendant selectors into native output automatically', () => {
        styles.addClass('form-stack', {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        });
        styles.addClass('title', {
            fontSize: '17px',
        });
        styles.adjacentSibling('.label', '.hint', {
            color: '#ff6600',
        });
        styles.generalSibling('.label', '.note', {
            letterSpacing: '1.4px',
            textTransform: 'uppercase',
        });
        styles.descendant('.section + .section', '.title', {
            color: '#3366cc',
            fontWeight: 700,
        });
        styles.descendant('.section ~ .section', '.title', {
            textDecoration: 'underline',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'form-stack' },
                span({ className: 'label' }, 'Email'),
                span({ className: 'hint' }, 'Required'),
                span({ className: 'note' }, 'Native sibling'),
                div(
                    { className: 'section' },
                    span({ className: 'title' }, 'Primary'),
                ),
                div(
                    { className: 'section' },
                    span({ className: 'title' }, 'Secondary'),
                ),
            ),
            { functionName: 'SiblingCombinatorScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'form-stack' },
                span({ className: 'label' }, 'Email'),
                span({ className: 'hint' }, 'Required'),
                span({ className: 'note' }, 'Native sibling'),
                div(
                    { className: 'section' },
                    span({ className: 'title' }, 'Primary'),
                ),
                div(
                    { className: 'section' },
                    span({ className: 'title' }, 'Secondary'),
                ),
            ),
            { structName: 'SiblingCombinatorScreen' },
        );

        expect(compose).toContain('Text(text = "Required", color = Color(red = 1f, green = 0.4f, blue = 0f, alpha = 1f))');
        expect(compose).toContain('Text(text = "NATIVE SIBLING", letterSpacing = 1.4.sp)');
        expect(compose).toContain('Text(text = "Primary", fontSize = 17.sp)');
        expect(compose).toContain('Text(text = "Secondary", color = Color(red = 0.2f, green = 0.4f, blue = 0.8f, alpha = 1f), fontSize = 17.sp, fontWeight = FontWeight.W700, textDecoration = TextDecoration.Underline)');

        expect(swiftui).toContain('Text("Required")');
        expect(swiftui).toContain('.foregroundStyle(Color(red: 1, green: 0.4, blue: 0, opacity: 1))');
        expect(swiftui).toContain('Text("NATIVE SIBLING")');
        expect(swiftui).toContain('.kerning(1.4)');
        expect(swiftui).toContain('Text("Primary")');
        expect(swiftui).toContain('Text("Secondary")');
        expect(swiftui).toContain('.foregroundStyle(Color(red: 0.2, green: 0.4, blue: 0.8, opacity: 1))');
        expect(swiftui).toContain('.font(.system(size: 17, weight: .bold))');
        expect(swiftui).toContain('.underline()');
    });

    it('maps child-position pseudo-class selectors into native output automatically', () => {
        styles.addClass('pseudo-stack', {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        });
        styles.child('.pseudo-stack', ':first-child', {
            color: '#ff6600',
        });
        styles.child('.pseudo-stack', ':nth-child(2)', {
            letterSpacing: '1.2px',
            textDecoration: 'underline',
        });
        styles.child('.pseudo-stack', ':nth-child(odd)', {
            textTransform: 'uppercase',
        });
        styles.child('.pseudo-stack', ':last-child', {
            fontWeight: 700,
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'pseudo-stack' },
                span('Alpha'),
                span('Beta'),
                span('Gamma'),
            ),
            { functionName: 'ChildPseudoSelectorScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'pseudo-stack' },
                span('Alpha'),
                span('Beta'),
                span('Gamma'),
            ),
            { structName: 'ChildPseudoSelectorScreen' },
        );

        expect(compose).toContain('Text(text = "ALPHA", color = Color(red = 1f, green = 0.4f, blue = 0f, alpha = 1f))');
        expect(compose).toContain('Text(text = "Beta", letterSpacing = 1.2.sp, textDecoration = TextDecoration.Underline)');
        expect(compose).toContain('Text(text = "GAMMA", fontWeight = FontWeight.W700)');

        expect(swiftui).toContain('Text("ALPHA")');
        expect(swiftui).toContain('.foregroundStyle(Color(red: 1, green: 0.4, blue: 0, opacity: 1))');
        expect(swiftui).toContain('Text("Beta")');
        expect(swiftui).toContain('.kerning(1.2)');
        expect(swiftui).toContain('.underline()');
        expect(swiftui).toContain('Text("GAMMA")');
        expect(swiftui).toContain('.font(.system(size: 17, weight: .bold))');
    });

    it('maps type-position and simple not pseudo-class selectors into native output automatically', () => {
        styles.addClass('type-stack', {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        });
        styles.child('.type-stack', 'span:first-of-type', {
            color: '#ff6600',
        });
        styles.child('.type-stack', 'span:nth-of-type(2)', {
            letterSpacing: '1.1px',
            textDecoration: 'underline',
        });
        styles.child('.type-stack', 'span:last-of-type', {
            fontWeight: 700,
        });
        styles.child('.type-stack', 'span:not(.muted)', {
            textTransform: 'uppercase',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'type-stack' },
                span('Alpha'),
                h2('Heading'),
                span({ className: 'muted' }, 'Beta'),
                span('Gamma'),
            ),
            { functionName: 'TypePseudoSelectorScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'type-stack' },
                span('Alpha'),
                h2('Heading'),
                span({ className: 'muted' }, 'Beta'),
                span('Gamma'),
            ),
            { structName: 'TypePseudoSelectorScreen' },
        );

        expect(compose).toContain('Text(text = "ALPHA", color = Color(red = 1f, green = 0.4f, blue = 0f, alpha = 1f))');
        expect(compose).toContain('Text(text = "Heading")');
        expect(compose).toContain('Text(text = "Beta", letterSpacing = 1.1.sp, textDecoration = TextDecoration.Underline)');
        expect(compose).toContain('Text(text = "GAMMA", fontWeight = FontWeight.W700)');

        expect(swiftui).toContain('Text("ALPHA")');
        expect(swiftui).toContain('.foregroundStyle(Color(red: 1, green: 0.4, blue: 0, opacity: 1))');
        expect(swiftui).toContain('Text("Heading")');
        expect(swiftui).toContain('Text("Beta")');
        expect(swiftui).toContain('.kerning(1.1)');
        expect(swiftui).toContain('.underline()');
        expect(swiftui).toContain('Text("GAMMA")');
        expect(swiftui).toContain('.font(.system(size: 17, weight: .bold))');
    });

    it('maps reverse-order and only-child pseudo-class selectors into native output automatically', () => {
        styles.addClass('reverse-stack', {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        });
        styles.child('.reverse-stack', 'span:nth-last-child(2)', {
            textDecoration: 'underline',
        });
        styles.child('.reverse-stack', 'span:nth-last-of-type(2)', {
            letterSpacing: '1.3px',
        });
        styles.child('.reverse-stack', 'h2:only-of-type', {
            color: '#ff6600',
        });

        styles.addClass('singleton-stack', {
            display: 'flex',
            flexDirection: 'column',
        });
        styles.child('.singleton-stack', 'p:only-child', {
            textTransform: 'uppercase',
        });
        styles.child('.singleton-stack', 'p:only-of-type', {
            fontWeight: 700,
        });

        const compose = renderAndroidCompose(
            div(
                div(
                    { className: 'reverse-stack' },
                    span('Alpha'),
                    h2('Heading'),
                    span('Beta'),
                    p('Tail'),
                ),
                div(
                    { className: 'singleton-stack' },
                    p('Solo'),
                ),
            ),
            { functionName: 'ReversePseudoSelectorScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                div(
                    { className: 'reverse-stack' },
                    span('Alpha'),
                    h2('Heading'),
                    span('Beta'),
                    p('Tail'),
                ),
                div(
                    { className: 'singleton-stack' },
                    p('Solo'),
                ),
            ),
            { structName: 'ReversePseudoSelectorScreen' },
        );

        expect(compose).toContain('Text(text = "Alpha", letterSpacing = 1.3.sp)');
        expect(compose).toContain('Text(text = "Heading", color = Color(red = 1f, green = 0.4f, blue = 0f, alpha = 1f))');
        expect(compose).toContain('Text(text = "Beta", textDecoration = TextDecoration.Underline)');
        expect(compose).toContain('Text(text = "SOLO", fontWeight = FontWeight.W700)');

        expect(swiftui).toContain('Text("Alpha")');
        expect(swiftui).toContain('.kerning(1.3)');
        expect(swiftui).toContain('Text("Heading")');
        expect(swiftui).toContain('.foregroundStyle(Color(red: 1, green: 0.4, blue: 0, opacity: 1))');
        expect(swiftui).toContain('Text("Beta")');
        expect(swiftui).toContain('.underline()');
        expect(swiftui).toContain('Text("SOLO")');
        expect(swiftui).toContain('.font(.system(size: 17, weight: .bold))');
    });

    it('maps selector-list and nested not pseudo-class selectors into native output automatically', () => {
        styles.addClass('not-stack', {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        });
        styles.child('.not-stack', 'span:not(.muted, :nth-child(2), [data-tone="soft"])', {
            textTransform: 'uppercase',
        });
        styles.child('.not-stack', 'span:not(:not(.accent))', {
            color: '#ff6600',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'not-stack' },
                span({ className: 'accent' }, 'Alpha'),
                span('Beta'),
                span({ className: 'muted' }, 'Gamma'),
                span({ 'data-tone': 'soft' }, 'Delta'),
            ),
            { functionName: 'NestedNotPseudoSelectorScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'not-stack' },
                span({ className: 'accent' }, 'Alpha'),
                span('Beta'),
                span({ className: 'muted' }, 'Gamma'),
                span({ 'data-tone': 'soft' }, 'Delta'),
            ),
            { structName: 'NestedNotPseudoSelectorScreen' },
        );

        expect(compose).toContain('Text(text = "ALPHA", color = Color(red = 1f, green = 0.4f, blue = 0f, alpha = 1f))');
        expect(compose).toContain('Text(text = "Beta")');
        expect(compose).toContain('Text(text = "Gamma")');
        expect(compose).toContain('Text(text = "Delta")');
        expect(compose).not.toContain('Text(text = "BETA"');
        expect(compose).not.toContain('Text(text = "GAMMA"');
        expect(compose).not.toContain('Text(text = "DELTA"');

        expect(swiftui).toContain('Text("ALPHA")');
        expect(swiftui).toContain('.foregroundStyle(Color(red: 1, green: 0.4, blue: 0, opacity: 1))');
        expect(swiftui).toContain('Text("Beta")');
        expect(swiftui).toContain('Text("Gamma")');
        expect(swiftui).toContain('Text("Delta")');
        expect(swiftui).not.toContain('Text("BETA")');
        expect(swiftui).not.toContain('Text("GAMMA")');
        expect(swiftui).not.toContain('Text("DELTA")');
    });

    it('maps practical has pseudo-class selectors into native output automatically', () => {
        styles.addClass('has-stack', {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        });
        styles.child('.has-stack', '.card:has(.accent)', {
            letterSpacing: '1.2px',
        });
        styles.child('.has-stack', '.card:has(> h2)', {
            color: '#ff6600',
        });
        styles.child('.has-stack', '.card:has(> div .accent)', {
            textTransform: 'uppercase',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'has-stack' },
                div(
                    { className: 'card' },
                    h2('Hero'),
                    span({ className: 'accent' }, 'Alpha'),
                ),
                div(
                    { className: 'card' },
                    div(span({ className: 'accent' }, 'Nested')),
                ),
                div(
                    { className: 'card' },
                    p('Plain'),
                ),
            ),
            { functionName: 'HasPseudoSelectorScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'has-stack' },
                div(
                    { className: 'card' },
                    h2('Hero'),
                    span({ className: 'accent' }, 'Alpha'),
                ),
                div(
                    { className: 'card' },
                    div(span({ className: 'accent' }, 'Nested')),
                ),
                div(
                    { className: 'card' },
                    p('Plain'),
                ),
            ),
            { structName: 'HasPseudoSelectorScreen' },
        );

        expect(compose).toContain('Text(text = "Hero", color = Color(red = 1f, green = 0.4f, blue = 0f, alpha = 1f), letterSpacing = 1.2.sp)');
        expect(compose).toContain('Text(text = "Alpha", color = Color(red = 1f, green = 0.4f, blue = 0f, alpha = 1f), letterSpacing = 1.2.sp)');
        expect(compose).toContain('Text(text = "NESTED", letterSpacing = 1.2.sp)');
        expect(compose).toContain('Text(text = "Plain")');
        expect(compose).not.toContain('Text(text = "PLAIN"');
        expect(compose).not.toContain('Text(text = "NESTED", color = Color(');

        expect(swiftui).toContain('Text("Hero")');
        expect(swiftui).toContain('.foregroundStyle(Color(red: 1, green: 0.4, blue: 0, opacity: 1))');
        expect(swiftui).toContain('.kerning(1.2)');
        expect(swiftui).toContain('Text("Alpha")');
        expect(swiftui).toContain('Text("NESTED")');
        expect(swiftui).toContain('Text("Plain")');
        expect(swiftui).not.toContain('Text("PLAIN")');
    });

    it('maps sibling-relative has pseudo-class selectors into native output automatically', () => {
        styles.addClass('has-sibling-stack', {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        });
        styles.child('.has-sibling-stack', '.card:has(+ .badge span)', {
            color: '#ff6600',
        });
        styles.child('.has-sibling-stack', '.card:has(~ .note .accent)', {
            textTransform: 'uppercase',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'has-sibling-stack' },
                div({ className: 'card' }, p('Alpha')),
                div({ className: 'badge' }, span('Marker')),
                div({ className: 'card' }, p('Beta')),
                div({ className: 'note' }, div(span({ className: 'accent' }, 'Gamma'))),
                div({ className: 'card' }, p('Plain')),
            ),
            { functionName: 'HasSiblingPseudoSelectorScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'has-sibling-stack' },
                div({ className: 'card' }, p('Alpha')),
                div({ className: 'badge' }, span('Marker')),
                div({ className: 'card' }, p('Beta')),
                div({ className: 'note' }, div(span({ className: 'accent' }, 'Gamma'))),
                div({ className: 'card' }, p('Plain')),
            ),
            { structName: 'HasSiblingPseudoSelectorScreen' },
        );

        expect(compose).toContain('Text(text = "ALPHA", color = Color(red = 1f, green = 0.4f, blue = 0f, alpha = 1f))');
        expect(compose).toContain('Text(text = "BETA")');
        expect(compose).toContain('Text(text = "Plain")');
        expect(compose).not.toContain('Text(text = "PLAIN"');
        expect(compose).not.toContain('Text(text = "Beta", color = Color(');

        expect(swiftui).toContain('Text("ALPHA")');
        expect(swiftui).toContain('.foregroundStyle(Color(red: 1, green: 0.4, blue: 0, opacity: 1))');
        expect(swiftui).toContain('Text("BETA")');
        expect(swiftui).toContain('Text("Plain")');
        expect(swiftui).not.toContain('Text("PLAIN")');
    });

    it('maps chained relative has pseudo-class selectors into native output automatically', () => {
        styles.addClass('has-chain-stack', {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        });
        styles.child('.has-chain-stack', '.lead:has(+ .badge + .note .accent)', {
            color: '#ff6600',
        });
        styles.child('.has-chain-stack', '.follow:has(~ .mid + .note .accent)', {
            textTransform: 'uppercase',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'has-chain-stack' },
                div({ className: 'card lead' }, p('Alpha')),
                div({ className: 'badge' }, span('Marker')),
                div({ className: 'note' }, div(span({ className: 'accent' }, 'Gamma'))),
                div({ className: 'card follow' }, p('Beta')),
                div({ className: 'mid' }, span('Spacer')),
                div({ className: 'note' }, span({ className: 'accent' }, 'Delta')),
                div({ className: 'card plain' }, p('Plain')),
            ),
            { functionName: 'HasChainPseudoSelectorScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'has-chain-stack' },
                div({ className: 'card lead' }, p('Alpha')),
                div({ className: 'badge' }, span('Marker')),
                div({ className: 'note' }, div(span({ className: 'accent' }, 'Gamma'))),
                div({ className: 'card follow' }, p('Beta')),
                div({ className: 'mid' }, span('Spacer')),
                div({ className: 'note' }, span({ className: 'accent' }, 'Delta')),
                div({ className: 'card plain' }, p('Plain')),
            ),
            { structName: 'HasChainPseudoSelectorScreen' },
        );

        expect(compose).toContain('Text(text = "Alpha", color = Color(red = 1f, green = 0.4f, blue = 0f, alpha = 1f))');
        expect(compose).toContain('Text(text = "BETA")');
        expect(compose).toContain('Text(text = "Plain")');
        expect(compose).not.toContain('Text(text = "PLAIN"');
        expect(compose).not.toContain('Text(text = "Beta", color = Color(');

        expect(swiftui).toContain('Text("Alpha")');
        expect(swiftui).toContain('.foregroundStyle(Color(red: 1, green: 0.4, blue: 0, opacity: 1))');
        expect(swiftui).toContain('Text("BETA")');
        expect(swiftui).toContain('Text("Plain")');
        expect(swiftui).not.toContain('Text("PLAIN")');
    });

    it('reuses shared state bindings across native text, inputs, and toggles', () => {
        const query = createState('Search term');
        const enabled = createState(true);

        const compose = renderAndroidCompose(
            div(
                span(query),
                input({ ...bindValue(query), placeholder: 'Search' }),
                input({ type: 'checkbox', ...bindChecked(enabled) }),
                span(enabled),
            ),
            { functionName: 'BoundStateScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                span(query),
                input({ ...bindValue(query), placeholder: 'Search' }),
                input({ type: 'checkbox', ...bindChecked(enabled) }),
                span(enabled),
            ),
            { structName: 'BoundStateScreen' },
        );

        expect(compose).toContain('var nativeState0 by remember { mutableStateOf("Search term") }');
        expect(compose).toContain('var nativeState1 by remember { mutableStateOf(true) }');
        expect(compose).toContain('Text(text = nativeState0)');
        expect(compose).toContain('value = nativeState0');
        expect(compose).toContain('checked = nativeState1');
        expect(compose).not.toContain('textFieldValue0');
        expect(compose).not.toContain('toggleValue0');

        expect(swiftui).toContain('@State private var nativeState0 = "Search term"');
        expect(swiftui).toContain('@State private var nativeState1 = true');
        expect(swiftui).toContain('Text(nativeState0)');
        expect(swiftui).toContain('TextField("Search", text: $nativeState0)');
        expect(swiftui).toContain('Toggle("", isOn: $nativeState1)');
    });

    it('applies media queries and supported pseudo-class selectors in native style resolution', () => {
        styles.addClass('card', {
            padding: '32px',
            maxWidth: '420px',
        });
        styles.addClass('field', {
            border: '1px solid rgba(38, 25, 20, 0.12)',
        });
        styles.addClass('field:focus', {
            border: '2px solid #d56e43',
        });
        styles.mediaMaxWidth('800px', {
            '.card': {
                padding: '12px',
                maxWidth: '280px',
            },
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'card' },
                input({ className: 'field', value: 'abc', placeholder: 'Search', autoFocus: true }),
            ),
            { functionName: 'ResponsiveNativeScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'card' },
                input({ className: 'field', value: 'abc', placeholder: 'Search', autoFocus: true }),
            ),
            { structName: 'ResponsiveNativeScreen' },
        );

        expect(compose).toContain('Column(modifier = Modifier.widthIn(max = 280.dp).padding(12.dp))');
        expect(compose).toContain('modifier = Modifier.border(2.dp, Color(');

        expect(swiftui).toContain('.padding(12)');
        expect(swiftui).toContain('.frame(maxWidth: 280)');
        expect(swiftui).toContain('.overlay(RoundedRectangle(cornerRadius: 0).stroke(Color(');
    });

    it('only applies native focus selector styles when explicit focus state is present', () => {
        styles.addClass('field', {
            border: '1px solid rgba(38, 25, 20, 0.12)',
        });
        styles.addClass('field:focus', {
            border: '2px solid #d56e43',
        });

        const unfocusedCompose = renderAndroidCompose(
            input({ className: 'field', value: 'abc', placeholder: 'Search' }),
            { functionName: 'UnfocusedFieldScreen' },
        );

        const focusedCompose = renderAndroidCompose(
            input({ className: 'field', value: 'abc', placeholder: 'Search', autoFocus: true }),
            { functionName: 'FocusedFieldScreen' },
        );

        const unfocusedSwiftui = renderSwiftUI(
            input({ className: 'field', value: 'abc', placeholder: 'Search' }),
            { structName: 'UnfocusedFieldScreen' },
        );

        const focusedSwiftui = renderSwiftUI(
            input({ className: 'field', value: 'abc', placeholder: 'Search', autoFocus: true }),
            { structName: 'FocusedFieldScreen' },
        );

        expect(unfocusedCompose).toContain('border(1.dp, Color(');
        expect(unfocusedCompose).not.toContain('border(2.dp, Color(');
        expect(focusedCompose).toContain('border(2.dp, Color(');

        expect(unfocusedSwiftui).toContain('lineWidth: 1');
        expect(unfocusedSwiftui).not.toContain('lineWidth: 2');
        expect(focusedSwiftui).toContain('lineWidth: 2');
    });

    it('applies id selectors and cascade layers in native style resolution', () => {
        styles.layerOrder('base', 'components');
        styles.layer('base', {
            '.card': {
                color: '#5d4335',
                padding: '8px',
            },
        });
        styles.layer('components', {
            '#hero-card': {
                padding: '20px',
            },
        });
        styles.addClass('card', {
            maxWidth: '320px',
        });

        const compose = renderAndroidCompose(
            div(
                { id: 'hero-card', className: 'card' },
                span('Layered card'),
            ),
            { functionName: 'LayeredCardScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { id: 'hero-card', className: 'card' },
                span('Layered card'),
            ),
            { structName: 'LayeredCardScreen' },
        );

        expect(compose).toContain('Column(modifier = Modifier.widthIn(max = 320.dp).padding(20.dp))');
        expect(compose).toContain('Text(text = "Layered card", color = Color(');

        expect(swiftui).toContain('.frame(maxWidth: 320)');
        expect(swiftui).toContain('.padding(20)');
        expect(swiftui).toContain('Text("Layered card")');
        expect(swiftui).toContain('.foregroundStyle(Color(');
    });

    it('applies supports queries in native style resolution', () => {
        styles.addClass('layout', {
            display: 'flex',
            gap: '12px',
        });
        styles.supports('display: grid', {
            '.layout': {
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
            },
        });
        styles.addClass('glass', {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '24px',
            padding: '16px',
        });
        styles.supports('backdrop-filter: blur(10px)', {
            '.glass': {
                backgroundColor: 'rgba(255, 255, 255, 0.82)',
                backdropFilter: 'blur(10px)',
            },
        });

        const compose = renderAndroidCompose(
            div(
                div(
                    { className: 'layout' },
                    div(span('Alpha')),
                    div(span('Beta')),
                ),
                div({ className: 'glass' }, span('Glass surface')),
            ),
            { functionName: 'SupportsNativeScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                div(
                    { className: 'layout' },
                    div(span('Alpha')),
                    div(span('Beta')),
                ),
                div({ className: 'glass' }, span('Glass surface')),
            ),
            { structName: 'SupportsNativeScreen' },
        );

        expect(compose).toContain('Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(20.dp))');
        expect(compose).toContain('Box(modifier = Modifier.weight(1f).fillMaxWidth())');
        expect(compose).toContain('shadow(elevation = 12.dp, shape = RoundedCornerShape(24.dp))');

        expect(swiftui).toContain('HStack(alignment: .top, spacing: 20) {');
        expect(swiftui).toContain('.background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 24))');
    });

    it('applies named container queries in native style resolution', () => {
        styles.addContainer('card-container', {
            containerType: 'inline-size',
            width: '420px',
        });
        styles.addClass('card-title', {
            fontSize: '16px',
            color: '#261914',
        });
        styles.container('min-width: 400px', {
            '.card-title': {
                fontSize: '24px',
            },
        }, 'card-container');
        styles.container('min-width: 500px', {
            '.card-title': {
                fontSize: '32px',
            },
        }, 'card-container');

        const compose = renderAndroidCompose(
            div(
                { className: 'card-container' },
                span({ className: 'card-title' }, 'Responsive title'),
            ),
            { functionName: 'ContainerNativeScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'card-container' },
                span({ className: 'card-title' }, 'Responsive title'),
            ),
            { structName: 'ContainerNativeScreen' },
        );

        expect(compose).toContain('Column(modifier = Modifier.width(420.dp))');
        expect(compose).toContain('Text(text = "Responsive title", color = Color(');
        expect(compose).toContain('fontSize = 24.sp');
        expect(compose).not.toContain('fontSize = 32.sp');

        expect(swiftui).toContain('.frame(width: 420)');
        expect(swiftui).toContain('Text("Responsive title")');
        expect(swiftui).toContain('.font(.system(size: 24))');
    });

    it('maps order, aspect-ratio, opacity, and z-index into native layout output', () => {
        styles.addClass('deck', {
            display: 'flex',
            flexDirection: 'row',
            gap: '12px',
        });
        styles.addClass('card-primary', {
            width: '160px',
            aspectRatio: '16 / 9',
            background: '#fff',
            opacity: 0.45,
            zIndex: 3,
            order: 2,
        });
        styles.addClass('card-secondary', {
            width: '120px',
            order: -1,
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'deck' },
                div({ className: 'card-primary' }, span('Primary')),
                div({ className: 'card-secondary' }, span('Secondary')),
            ),
            { functionName: 'OrderedDeckScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'deck' },
                div({ className: 'card-primary' }, span('Primary')),
                div({ className: 'card-secondary' }, span('Secondary')),
            ),
            { structName: 'OrderedDeckScreen' },
        );

        expect(compose.indexOf('Text(text = "Secondary")')).toBeLessThan(compose.indexOf('Text(text = "Primary")'));
        expect(compose).toContain('aspectRatio(1.778f)');
        expect(compose).toContain('.alpha(0.45f)');
        expect(compose).toContain('.zIndex(3f)');

        expect(swiftui.indexOf('Text("Secondary")')).toBeLessThan(swiftui.indexOf('Text("Primary")'));
        expect(swiftui).toContain('.aspectRatio(1.778, contentMode: .fit)');
        expect(swiftui).toContain('.opacity(0.45)');
        expect(swiftui).toContain('.zIndex(3)');
    });

    it('clips overflow-hidden containers in native output', () => {
        styles.addClass('crop-frame', {
            width: '160px',
            height: '90px',
            background: '#fff',
            overflow: 'hidden',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'crop-frame' },
                div({ style: { width: '220px', height: '120px', background: '#d56e43' } }, span('Oversized media')),
            ),
            { functionName: 'OverflowClipScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'crop-frame' },
                div({ style: { width: '220px', height: '120px', background: '#d56e43' } }, span('Oversized media')),
            ),
            { structName: 'OverflowClipScreen' },
        );

        expect(compose).toContain('clip(RectangleShape)');
        expect(swiftui).toContain('.clipped()');
    });

    it('resolves percentage sizing against parent available space in native output', () => {
        styles.addClass('shell', {
            width: '320px',
            height: '200px',
        });
        styles.addClass('panel', {
            width: '50%',
            height: '50%',
            maxWidth: '80%',
            minHeight: '25%',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'shell' },
                div({ className: 'panel' }, span('Percent panel')),
            ),
            { functionName: 'PercentSizingScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'shell' },
                div({ className: 'panel' }, span('Percent panel')),
            ),
            { structName: 'PercentSizingScreen' },
        );

        expect(compose).toContain('Column(modifier = Modifier.width(320.dp).height(200.dp))');
        expect(compose).toContain('Column(modifier = Modifier.width(160.dp).height(100.dp).widthIn(max = 256.dp).heightIn(min = 50.dp))');

        expect(swiftui).toContain('.frame(width: 320, height: 200)');
        expect(swiftui).toContain('.frame(width: 160, height: 100, maxWidth: 256, minHeight: 50)');
    });

    it('maps flex-basis and non-shrinking flex items into native output', () => {
        styles.addClass('toolbar', {
            width: '320px',
            display: 'flex',
            flexDirection: 'row',
            gap: '12px',
        });
        styles.addClass('badge', {
            display: 'flex',
            flexDirection: 'row',
            flexBasis: '30%',
            flexShrink: 0,
        });
        styles.addClass('content', {
            flex: 1,
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'toolbar' },
                div({ className: 'badge' }, span('Badge')),
                div({ className: 'content' }, span('Content')),
            ),
            { functionName: 'FlexBasisScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'toolbar' },
                div({ className: 'badge' }, span('Badge')),
                div({ className: 'content' }, span('Content')),
            ),
            { structName: 'FlexBasisScreen' },
        );

        expect(compose).toContain('Row(modifier = Modifier.width(320.dp), horizontalArrangement = Arrangement.spacedBy(12.dp))');
        expect(compose).toContain('Row(modifier = Modifier.width(96.dp).widthIn(min = 96.dp))');
        expect(compose).toContain('Column(modifier = Modifier.weight(1f))');

        expect(swiftui).toContain('HStack(alignment: .top, spacing: 12) {');
        expect(swiftui).toContain('.frame(width: 96, minWidth: 96)');
        expect(swiftui).toContain('.frame(maxWidth: .infinity, alignment: .leading)');
    });

    it('treats shrinkable flex-basis as a max-size hint in native output', () => {
        styles.addClass('toolbar', {
            width: '320px',
            display: 'flex',
            flexDirection: 'row',
            gap: '12px',
        });
        styles.addClass('badge', {
            display: 'flex',
            flexDirection: 'row',
            flexBasis: '40%',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'toolbar' },
                div({ className: 'badge' }, span('Badge')),
            ),
            { functionName: 'ShrinkableFlexBasisScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'toolbar' },
                div({ className: 'badge' }, span('Badge')),
            ),
            { structName: 'ShrinkableFlexBasisScreen' },
        );

        expect(compose).toContain('Row(modifier = Modifier.width(320.dp), horizontalArrangement = Arrangement.spacedBy(12.dp))');
        expect(compose).toContain('Row(modifier = Modifier.widthIn(max = 128.dp))');
        expect(compose).not.toContain('Row(modifier = Modifier.width(128.dp)');

        expect(swiftui).toContain('HStack(alignment: .top, spacing: 12) {');
        expect(swiftui).toContain('.frame(maxWidth: 128)');
        expect(swiftui).not.toContain('.frame(width: 128');
    });

    it('negotiates shrinkable flex-basis across sibling flex items', () => {
        styles.addClass('toolbar', {
            width: '320px',
            display: 'flex',
            flexDirection: 'row',
            gap: '12px',
        });
        styles.addClass('item', {
            display: 'flex',
            flexDirection: 'row',
            flexBasis: '60%',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'toolbar' },
                div({ className: 'item' }, span('One')),
                div({ className: 'item' }, span('Two')),
            ),
            { functionName: 'FlexShrinkNegotiationScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'toolbar' },
                div({ className: 'item' }, span('One')),
                div({ className: 'item' }, span('Two')),
            ),
            { structName: 'FlexShrinkNegotiationScreen' },
        );

        expect((compose.match(/Row\(modifier = Modifier\.widthIn\(max = 154\.dp\)\)/g) ?? []).length).toBe(2);
        expect((swiftui.match(/\.frame\(maxWidth: 154\)/g) ?? []).length).toBe(2);
    });

    it('weights sibling flex shrink negotiation by flex-shrink values', () => {
        styles.addClass('toolbar', {
            width: '320px',
            display: 'flex',
            flexDirection: 'row',
            gap: '12px',
        });
        styles.addClass('primary', {
            display: 'flex',
            flexDirection: 'row',
            flexBasis: '180px',
            flexShrink: 1,
        });
        styles.addClass('secondary', {
            display: 'flex',
            flexDirection: 'row',
            flexBasis: '180px',
            flexShrink: 2,
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'toolbar' },
                div({ className: 'primary' }, span('Primary')),
                div({ className: 'secondary' }, span('Secondary')),
            ),
            { functionName: 'WeightedFlexShrinkScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'toolbar' },
                div({ className: 'primary' }, span('Primary')),
                div({ className: 'secondary' }, span('Secondary')),
            ),
            { structName: 'WeightedFlexShrinkScreen' },
        );

        expect(compose).toContain('Row(modifier = Modifier.widthIn(max = 162.667.dp))');
        expect(compose).toContain('Row(modifier = Modifier.widthIn(max = 145.333.dp))');

        expect(swiftui).toContain('.frame(maxWidth: 162.667)');
        expect(swiftui).toContain('.frame(maxWidth: 145.333)');
    });

    it('negotiates shrinkable explicit widths across sibling flex items', () => {
        styles.addClass('toolbar', {
            width: '320px',
            display: 'flex',
            flexDirection: 'row',
            gap: '12px',
        });
        styles.addClass('item', {
            width: '180px',
            flexShrink: 1,
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'toolbar' },
                div({ className: 'item' }, span('One')),
                div({ className: 'item' }, span('Two')),
            ),
            { functionName: 'ExplicitWidthFlexShrinkScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'toolbar' },
                div({ className: 'item' }, span('One')),
                div({ className: 'item' }, span('Two')),
            ),
            { structName: 'ExplicitWidthFlexShrinkScreen' },
        );

        expect((compose.match(/Column\(modifier = Modifier\.widthIn\(max = 154\.dp\)\)/g) ?? []).length).toBe(2);
        expect(compose).not.toContain('Column(modifier = Modifier.width(180.dp))');

        expect((swiftui.match(/\.frame\(maxWidth: 154\)/g) ?? []).length).toBe(2);
        expect(swiftui).not.toContain('.frame(width: 180');
    });

    it('keeps explicit min-width clamps while shrinking flex items', () => {
        styles.addClass('toolbar', {
            width: '300px',
            display: 'flex',
            flexDirection: 'row',
            gap: '12px',
        });
        styles.addClass('primary', {
            width: '180px',
            minWidth: '170px',
            flexShrink: 1,
        });
        styles.addClass('secondary', {
            width: '180px',
            flexShrink: 1,
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'toolbar' },
                div({ className: 'primary' }, span('Primary')),
                div({ className: 'secondary' }, span('Secondary')),
            ),
            { functionName: 'ExplicitWidthMinClampScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'toolbar' },
                div({ className: 'primary' }, span('Primary')),
                div({ className: 'secondary' }, span('Secondary')),
            ),
            { structName: 'ExplicitWidthMinClampScreen' },
        );

        expect(compose).toContain('Column(modifier = Modifier.widthIn(min = 170.dp, max = 170.dp))');
        expect(compose).toContain('Column(modifier = Modifier.widthIn(max = 118.dp))');

        expect(swiftui).toContain('.frame(minWidth: 170, maxWidth: 170)');
        expect(swiftui).toContain('.frame(maxWidth: 118)');
    });

    it('negotiates shrinkable explicit heights across column flex items', () => {
        styles.addClass('stack', {
            height: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
        });
        styles.addClass('item', {
            height: '180px',
            flexShrink: 1,
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'stack' },
                div({ className: 'item' }, span('One')),
                div({ className: 'item' }, span('Two')),
            ),
            { functionName: 'ExplicitHeightFlexShrinkScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'stack' },
                div({ className: 'item' }, span('One')),
                div({ className: 'item' }, span('Two')),
            ),
            { structName: 'ExplicitHeightFlexShrinkScreen' },
        );

        expect((compose.match(/Column\(modifier = Modifier\.fillMaxWidth\(\)\.heightIn\(max = 154\.dp\)\)/g) ?? []).length).toBe(2);
        expect(compose).not.toContain('Column(modifier = Modifier.fillMaxWidth().height(180.dp))');

        expect((swiftui.match(/\.frame\(maxWidth: \.infinity, maxHeight: 154\)/g) ?? []).length).toBe(2);
        expect(swiftui).not.toContain('.frame(maxWidth: .infinity, height: 180');
    });

    it('maps common css flex shorthand tuples into native output', () => {
        styles.addClass('toolbar', {
            width: '320px',
            display: 'flex',
            flexDirection: 'row',
            gap: '12px',
        });
        styles.addClass('badge', {
            display: 'flex',
            flexDirection: 'row',
            flex: '0 0 30%',
        });
        styles.addClass('content', {
            flex: '1 1 0%',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'toolbar' },
                div({ className: 'badge' }, span('Badge')),
                div({ className: 'content' }, span('Content')),
            ),
            { functionName: 'FlexShorthandScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'toolbar' },
                div({ className: 'badge' }, span('Badge')),
                div({ className: 'content' }, span('Content')),
            ),
            { structName: 'FlexShorthandScreen' },
        );

        expect(compose).toContain('Row(modifier = Modifier.width(320.dp), horizontalArrangement = Arrangement.spacedBy(12.dp))');
        expect(compose).toContain('Row(modifier = Modifier.width(96.dp).widthIn(min = 96.dp))');
        expect(compose).toContain('Column(modifier = Modifier.weight(1f))');
        expect(compose).not.toContain('widthIn(max = 0.dp)');

        expect(swiftui).toContain('HStack(alignment: .top, spacing: 12) {');
        expect(swiftui).toContain('.frame(width: 96, minWidth: 96)');
        expect(swiftui).toContain('.frame(maxWidth: .infinity, alignment: .leading)');
        expect(swiftui).toContain('.layoutPriority(1)');
        expect(swiftui).not.toContain('.frame(maxWidth: 0)');
    });

    it('does not turn single-number flex shorthand into a zero-size constraint', () => {
        styles.addClass('toolbar', {
            width: '320px',
            display: 'flex',
            flexDirection: 'row',
            gap: '12px',
        });
        styles.addClass('primary', {
            flex: '1',
        });
        styles.addClass('secondary', {
            flex: '2',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'toolbar' },
                div({ className: 'primary' }, span('Primary')),
                div({ className: 'secondary' }, span('Secondary')),
            ),
            { functionName: 'NumericFlexShorthandScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'toolbar' },
                div({ className: 'primary' }, span('Primary')),
                div({ className: 'secondary' }, span('Secondary')),
            ),
            { structName: 'NumericFlexShorthandScreen' },
        );

        expect(compose).toContain('Column(modifier = Modifier.weight(1f))');
        expect(compose).toContain('Column(modifier = Modifier.weight(2f))');
        expect(compose).not.toContain('widthIn(max = 0.dp)');

        expect(swiftui).toContain('HStack(alignment: .top, spacing: 12) {');
        expect((swiftui.match(/\.frame\(maxWidth: \.infinity, alignment: \.leading\)/g) ?? []).length).toBeGreaterThanOrEqual(2);
        expect(swiftui).toContain('.layoutPriority(1)');
        expect(swiftui).toContain('.layoutPriority(2)');
        expect(swiftui).not.toContain('.frame(maxWidth: 0)');
    });

    it('maps translate scale and rotate transforms into native output', () => {
        styles.addClass('motion-card', {
            width: '180px',
            height: '120px',
            background: '#fff',
            transform: 'translate(12px, -6px) scale(1.08, 0.96) rotate(12deg)',
        });

        const compose = renderAndroidCompose(
            div(
                div({ className: 'motion-card' }, span('Transform card')),
            ),
            { functionName: 'TransformScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                div({ className: 'motion-card' }, span('Transform card')),
            ),
            { structName: 'TransformScreen' },
        );

        expect(compose).toContain('Modifier.width(180.dp).height(120.dp).background(Color(red = 1f, green = 1f, blue = 1f, alpha = 1f)).offset(x = 12.dp, y = -6.dp).graphicsLayer(scaleX = 1.08f, scaleY = 0.96f, rotationZ = 12f)');
        expect(swiftui).toContain('.offset(x: 12, y: -6)');
        expect(swiftui).toContain('.scaleEffect(x: 1.08, y: 0.96, anchor: .center)');
        expect(swiftui).toContain('.rotationEffect(.degrees(12))');
    });

    it('maps align-self overrides for flex children into native output', () => {
        styles.addClass('row-shell', {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            height: '120px',
            gap: '12px',
        });
        styles.addClass('column-shell', {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            width: '220px',
            gap: '12px',
        });
        styles.addClass('self-center', {
            width: '60px',
            height: '32px',
            alignSelf: 'center',
        });
        styles.addClass('self-end', {
            width: '60px',
            height: '32px',
            alignSelf: 'flex-end',
        });

        const compose = renderAndroidCompose(
            div(
                div(
                    { className: 'row-shell' },
                    div({ className: 'self-center' }, span('Center row')),
                    div({ className: 'self-end' }, span('End row')),
                ),
                div(
                    { className: 'column-shell' },
                    div({ className: 'self-center' }, span('Center column')),
                    div({ className: 'self-end' }, span('End column')),
                ),
            ),
            { functionName: 'AlignSelfScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                div(
                    { className: 'row-shell' },
                    div({ className: 'self-center' }, span('Center row')),
                    div({ className: 'self-end' }, span('End row')),
                ),
                div(
                    { className: 'column-shell' },
                    div({ className: 'self-center' }, span('Center column')),
                    div({ className: 'self-end' }, span('End column')),
                ),
            ),
            { structName: 'AlignSelfScreen' },
        );

        expect(compose).toContain('Modifier.width(60.dp).height(32.dp).align(Alignment.CenterVertically)');
        expect(compose).toContain('Modifier.width(60.dp).height(32.dp).align(Alignment.Bottom)');
        expect(compose).toContain('Modifier.width(60.dp).height(32.dp).align(Alignment.CenterHorizontally)');
        expect(compose).toContain('Modifier.width(60.dp).height(32.dp).align(Alignment.End)');

        expect(swiftui).toContain('.frame(maxHeight: .infinity, alignment: .center)');
        expect(swiftui).toContain('.frame(maxHeight: .infinity, alignment: .bottomLeading)');
        expect(swiftui).toContain('.frame(maxWidth: .infinity, alignment: .center)');
        expect(swiftui).toContain('.frame(maxWidth: .infinity, alignment: .trailing)');
    });

    it('maps align-self stretch for flex children into native output', () => {
        styles.addClass('row-shell', {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            height: '120px',
            gap: '12px',
        });
        styles.addClass('stretch-child', {
            width: '60px',
            alignSelf: 'stretch',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'row-shell' },
                div({ className: 'stretch-child' }, span('Stretch')),
            ),
            { functionName: 'StretchAlignSelfScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'row-shell' },
                div({ className: 'stretch-child' }, span('Stretch')),
            ),
            { structName: 'StretchAlignSelfScreen' },
        );

        expect(compose).toContain('Modifier.width(60.dp).fillMaxHeight()');
        expect(swiftui).toContain('.frame(maxHeight: .infinity, alignment: .topLeading)');
    });

    it('does not stretch baseline-aligned flex children when row align-items stretches', () => {
        styles.addClass('stretch-row', {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            width: '240px',
            height: '120px',
            gap: '12px',
        });
        styles.addClass('baseline-card', {
            width: '80px',
            padding: '12px',
            background: '#fff',
            alignSelf: 'baseline',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'stretch-row' },
                div({ className: 'baseline-card' }, span('Baseline card')),
            ),
            { functionName: 'BaselineAlignSelfStretchScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'stretch-row' },
                div({ className: 'baseline-card' }, span('Baseline card')),
            ),
            { structName: 'BaselineAlignSelfStretchScreen' },
        );

        expect(compose).toContain('Row(modifier = Modifier.width(240.dp).height(120.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top)');
        expect(compose).toContain('Column(modifier = Modifier.width(80.dp).background(Color(red = 1f, green = 1f, blue = 1f, alpha = 1f)).padding(12.dp))');
        expect(compose).not.toContain('Column(modifier = Modifier.width(80.dp).fillMaxHeight().background(Color(red = 1f, green = 1f, blue = 1f, alpha = 1f)).padding(12.dp))');

        expect(swiftui).toContain('HStack(alignment: .top, spacing: 12) {' );
        expect(swiftui).toContain('.frame(width: 80)');
        expect(swiftui).not.toContain('.frame(width: 80, maxHeight: .infinity)');
    });

    it('maps align-items stretch for auto-sized flex children into native output', () => {
        styles.addClass('stretch-row', {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            width: '240px',
            height: '120px',
            gap: '12px',
        });
        styles.addClass('stretch-card', {
            width: '80px',
            padding: '12px',
            background: '#fff',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'stretch-row' },
                div({ className: 'stretch-card' }, span('Stretch card')),
            ),
            { functionName: 'AlignItemsStretchScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'stretch-row' },
                div({ className: 'stretch-card' }, span('Stretch card')),
            ),
            { structName: 'AlignItemsStretchScreen' },
        );

        expect(compose).toContain('Row(modifier = Modifier.width(240.dp).height(120.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top)');
        expect(compose).toContain('Column(modifier = Modifier.width(80.dp).fillMaxHeight().background(Color(red = 1f, green = 1f, blue = 1f, alpha = 1f)).padding(12.dp))');

        expect(swiftui).toContain('HStack(alignment: .top, spacing: 12) {');
        expect(swiftui).toContain('.frame(width: 80, maxHeight: .infinity)');
    });

    it('implicitly stretches row flex children when the container has an explicit cross size', () => {
        styles.addClass('implicit-stretch-row', {
            display: 'flex',
            flexDirection: 'row',
            width: '240px',
            height: '120px',
            gap: '12px',
        });
        styles.addClass('implicit-stretch-card', {
            width: '80px',
            padding: '12px',
            background: '#fff',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'implicit-stretch-row' },
                div({ className: 'implicit-stretch-card' }, span('Implicit stretch card')),
            ),
            { functionName: 'ImplicitAlignItemsStretchScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'implicit-stretch-row' },
                div({ className: 'implicit-stretch-card' }, span('Implicit stretch card')),
            ),
            { structName: 'ImplicitAlignItemsStretchScreen' },
        );

        expect(compose).toContain('Row(modifier = Modifier.width(240.dp).height(120.dp), horizontalArrangement = Arrangement.spacedBy(12.dp))');
        expect(compose).toContain('Column(modifier = Modifier.width(80.dp).fillMaxHeight().background(Color(red = 1f, green = 1f, blue = 1f, alpha = 1f)).padding(12.dp))');

        expect(swiftui).toContain('HStack(alignment: .top, spacing: 12) {');
        expect(swiftui).toContain('.frame(width: 80, maxHeight: .infinity)');
    });

    it('does not implicitly stretch row flex children without an explicit cross size', () => {
        styles.addClass('auto-row', {
            display: 'flex',
            flexDirection: 'row',
            width: '240px',
            gap: '12px',
        });
        styles.addClass('auto-row-card', {
            width: '80px',
            padding: '12px',
            background: '#fff',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'auto-row' },
                div({ className: 'auto-row-card' }, span('Auto row card')),
            ),
            { functionName: 'AutoHeightFlexRowScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'auto-row' },
                div({ className: 'auto-row-card' }, span('Auto row card')),
            ),
            { structName: 'AutoHeightFlexRowScreen' },
        );

        expect(compose).toContain('Row(modifier = Modifier.width(240.dp), horizontalArrangement = Arrangement.spacedBy(12.dp))');
        expect(compose).toContain('Column(modifier = Modifier.width(80.dp).background(Color(red = 1f, green = 1f, blue = 1f, alpha = 1f)).padding(12.dp))');
        expect(compose).not.toContain('fillMaxHeight()');

        expect(swiftui).toContain('HStack(alignment: .top, spacing: 12) {');
        expect(swiftui).toContain('.frame(width: 80)');
        expect(swiftui).not.toContain('.frame(width: 80, maxHeight: .infinity)');
    });

    it('does not force column flex children to stretch when align-items centers them', () => {
        styles.addClass('center-column', {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '220px',
            gap: '12px',
        });
        styles.addClass('center-badge', {
            padding: '12px',
            background: '#ff0000',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'center-column' },
                div({ className: 'center-badge' }, span('Centered badge')),
            ),
            { functionName: 'CenteredFlexColumnScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'center-column' },
                div({ className: 'center-badge' }, span('Centered badge')),
            ),
            { structName: 'CenteredFlexColumnScreen' },
        );

        expect(compose).toContain('Column(modifier = Modifier.width(220.dp), verticalArrangement = Arrangement.spacedBy(12.dp), horizontalAlignment = Alignment.CenterHorizontally)');
        expect(compose).toContain('Column(modifier = Modifier.background(Color(red = 1f, green = 0f, blue = 0f, alpha = 1f)).padding(12.dp))');
        expect((compose.match(/fillMaxWidth\(\)/g) ?? []).length).toBe(0);

        expect(swiftui).toContain('VStack(alignment: .center, spacing: 12) {');
        expect((swiftui.match(/\.frame\(maxWidth: \.infinity, alignment: \.leading\)/g) ?? []).length).toBe(0);
    });

    it('maps row baseline alignment for text-heavy flex children into native output', () => {
        styles.addClass('baseline-row', {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: '12px',
        });
        styles.addClass('caption', {
            fontSize: '12px',
        });
        styles.addClass('headline', {
            fontSize: '28px',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'baseline-row' },
                span({ className: 'caption' }, 'Caption'),
                span({ className: 'headline' }, 'Headline'),
            ),
            { functionName: 'BaselineFlexRowScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'baseline-row' },
                span({ className: 'caption' }, 'Caption'),
                span({ className: 'headline' }, 'Headline'),
            ),
            { structName: 'BaselineFlexRowScreen' },
        );

        expect(compose).toContain('Row(modifier = Modifier, horizontalArrangement = Arrangement.spacedBy(12.dp))');
        expect(compose).toContain('Text(text = "Caption", modifier = Modifier.alignByBaseline(), fontSize = 12.sp)');
        expect(compose).toContain('Text(text = "Headline", modifier = Modifier.alignByBaseline(), fontSize = 28.sp)');

        expect(swiftui).toContain('HStack(alignment: .firstTextBaseline, spacing: 12) {');
        expect(swiftui).toContain('Text("Caption")');
        expect(swiftui).toContain('Text("Headline")');
    });

    it('maps last-baseline row alignment into native output', () => {
        styles.addClass('last-baseline-row', {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'last baseline',
            gap: '10px',
        });
        styles.addClass('meta', {
            fontSize: '14px',
        });
        styles.addClass('price', {
            fontSize: '32px',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'last-baseline-row' },
                span({ className: 'meta' }, 'USD'),
                span({ className: 'price' }, '129'),
            ),
            { functionName: 'LastBaselineFlexRowScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'last-baseline-row' },
                span({ className: 'meta' }, 'USD'),
                span({ className: 'price' }, '129'),
            ),
            { structName: 'LastBaselineFlexRowScreen' },
        );

        expect(compose).toContain('Text(text = "USD", modifier = Modifier.alignByBaseline(), fontSize = 14.sp)');
        expect(compose).toContain('Text(text = "129", modifier = Modifier.alignByBaseline(), fontSize = 32.sp)');
        expect(swiftui).toContain('HStack(alignment: .lastTextBaseline, spacing: 10) {');
    });

    it('maps text align-self baseline overrides for flex rows into native output', () => {
        styles.addClass('self-baseline-row', {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '12px',
        });
        styles.addClass('self-baseline-caption', {
            fontSize: '12px',
            alignSelf: 'baseline',
        });
        styles.addClass('self-baseline-headline', {
            fontSize: '28px',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'self-baseline-row' },
                span({ className: 'self-baseline-caption' }, 'Caption'),
                span({ className: 'self-baseline-headline' }, 'Headline'),
            ),
            { functionName: 'SelfBaselineFlexRowScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'self-baseline-row' },
                span({ className: 'self-baseline-caption' }, 'Caption'),
                span({ className: 'self-baseline-headline' }, 'Headline'),
            ),
            { structName: 'SelfBaselineFlexRowScreen' },
        );

        expect(compose).toContain('Row(modifier = Modifier, horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically)');
        expect(compose).toContain('Text(text = "Caption", modifier = Modifier.alignByBaseline(), fontSize = 12.sp)');
        expect(compose).toContain('Text(text = "Headline", fontSize = 28.sp)');

        expect(swiftui).toContain('HStack(alignment: .firstTextBaseline, spacing: 12) {');
        expect(swiftui).toContain('Text("Caption")');
        expect(swiftui).toContain('Text("Headline")');
    });

    it('maps text align-self last-baseline overrides for flex rows into native output', () => {
        styles.addClass('self-last-baseline-row', {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '10px',
        });
        styles.addClass('self-last-baseline-meta', {
            fontSize: '14px',
            alignSelf: 'last baseline',
        });
        styles.addClass('self-last-baseline-price', {
            fontSize: '32px',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'self-last-baseline-row' },
                span({ className: 'self-last-baseline-meta' }, 'USD'),
                span({ className: 'self-last-baseline-price' }, '129'),
            ),
            { functionName: 'SelfLastBaselineFlexRowScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'self-last-baseline-row' },
                span({ className: 'self-last-baseline-meta' }, 'USD'),
                span({ className: 'self-last-baseline-price' }, '129'),
            ),
            { structName: 'SelfLastBaselineFlexRowScreen' },
        );

        expect(compose).toContain('Row(modifier = Modifier, horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically)');
        expect(compose).toContain('Text(text = "USD", modifier = Modifier.alignByBaseline(), fontSize = 14.sp)');
        expect(compose).toContain('Text(text = "129", fontSize = 32.sp)');

        expect(swiftui).toContain('HStack(alignment: .lastTextBaseline, spacing: 10) {');
        expect(swiftui).toContain('Text("USD")');
        expect(swiftui).toContain('Text("129")');
    });

    it('maps relative directional offsets into native output', () => {
        styles.addClass('nudge', {
            position: 'relative',
            left: '10px',
            bottom: '6px',
            width: '80px',
            height: '24px',
            background: '#fff',
        });

        const compose = renderAndroidCompose(
            div(div({ className: 'nudge' }, span('Relative chip'))),
            { functionName: 'RelativePositionScreen' },
        );

        const swiftui = renderSwiftUI(
            div(div({ className: 'nudge' }, span('Relative chip'))),
            { structName: 'RelativePositionScreen' },
        );

        expect(compose).toContain('Modifier.width(80.dp).height(24.dp).background(Color(red = 1f, green = 1f, blue = 1f, alpha = 1f)).offset(x = 10.dp, y = -6.dp)');
        expect(swiftui).toContain('.offset(x: 10, y: -6)');
    });

    it('maps absolute positioned children as overlays in native output', () => {
        styles.addClass('badge-shell', {
            width: '240px',
            height: '140px',
            position: 'relative',
            background: '#fff',
        });
        styles.addClass('badge', {
            position: 'absolute',
            top: '8px',
            right: '12px',
            width: '64px',
            height: '28px',
            background: '#d56e43',
            zIndex: 4,
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'badge-shell' },
                span('Body copy'),
                div({ className: 'badge' }, span('Badge')),
            ),
            { functionName: 'AbsoluteOverlayScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'badge-shell' },
                span('Body copy'),
                div({ className: 'badge' }, span('Badge')),
            ),
            { structName: 'AbsoluteOverlayScreen' },
        );

        expect(compose).toContain('Box(modifier = Modifier.matchParentSize())');
        expect(compose).toContain('align(Alignment.TopEnd).offset(x = -12.dp, y = 8.dp).zIndex(4f)');

        expect(swiftui).toContain('.overlay(alignment: .topLeading) {');
        expect(swiftui).toContain('.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)');
        expect(swiftui).toContain('.offset(x: -12, y: 8)');
    });

    it('maps fixed positioned screen children as viewport overlays in native output', () => {
        styles.addClass('floating-cta', {
            position: 'fixed',
            right: '16px',
            bottom: '20px',
            width: '84px',
            height: '36px',
            background: '#d56e43',
            zIndex: 9,
        });

        const compose = renderAndroidCompose(
            main(
                span('Body copy'),
                div({ className: 'floating-cta' }, span('CTA')),
            ),
            { functionName: 'FixedOverlayScreen' },
        );

        const swiftui = renderSwiftUI(
            main(
                span('Body copy'),
                div({ className: 'floating-cta' }, span('CTA')),
            ),
            { structName: 'FixedOverlayScreen' },
        );

        expect(compose).toContain('Box(modifier = Modifier.matchParentSize())');
        expect(compose).toContain('align(Alignment.BottomEnd).offset(x = -16.dp, y = -20.dp).zIndex(9f)');

        expect(swiftui).toContain('.overlay(alignment: .topLeading) {');
        expect(swiftui).toContain('.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)');
        expect(swiftui).toContain('.offset(x: -16, y: -20)');
    });

    it('keeps native parity overrides aligned with hybrid-style mobile layouts', () => {
        styles.addClass('page', {
            padding: '40px 24px 80px',
        });
        styles.addClass('hero', {
            width: '100%',
            padding: '32px',
        });
        styles.addClass('hero-layout', {
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
        });
        styles.addClass('hero-badge', {
            width: '84px',
            height: '84px',
        });
        styles.addClass('hero-badge-mark', {
            fontSize: '28px',
        });
        styles.addClass('hero-layout-native', {
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
        });
        styles.addClass('panel-grid', {
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '20px',
        });
        styles.mediaMaxWidth('800px', {
            '.page': {
                padding: '20px 16px 48px',
            },
            '.hero': {
                padding: '24px',
            },
            '.hero-badge': {
                width: '72px',
                height: '72px',
            },
            '.hero-badge-mark': {
                fontSize: '24px',
            },
            '.panel-grid': {
                gridTemplateColumns: '1fr',
            },
            '.hero-layout-native .hero-badge': {
                width: '84px',
                height: '84px',
            },
            '.hero-layout-native .hero-badge-mark': {
                fontSize: '28px',
            },
            '.page-native': {
                padding: '40px 24px 80px',
            },
            '.hero-native': {
                padding: '32px',
            },
            '.panel-grid-native': {
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
            },
        });

        const compose = renderAndroidCompose(
            main(
                { className: 'page page-native' },
                div(
                    { className: 'hero hero-native' },
                    div(
                        { className: 'hero-layout hero-layout-native' },
                        div(
                            { className: 'hero-badge' },
                            span({ className: 'hero-badge-mark' }, 'EU'),
                        ),
                        div('Hero copy'),
                    ),
                ),
                div(
                    { className: 'panel-grid panel-grid-native' },
                    div('Left panel'),
                    div('Right panel'),
                ),
            ),
            { functionName: 'NativeParityScreen' },
        );

        const swiftui = renderSwiftUI(
            main(
                { className: 'page page-native' },
                div(
                    { className: 'hero hero-native' },
                    div(
                        { className: 'hero-layout hero-layout-native' },
                        div(
                            { className: 'hero-badge' },
                            span({ className: 'hero-badge-mark' }, 'EU'),
                        ),
                        div('Hero copy'),
                    ),
                ),
                div(
                    { className: 'panel-grid panel-grid-native' },
                    div('Left panel'),
                    div('Right panel'),
                ),
            ),
            { structName: 'NativeParityScreen' },
        );

        expect(compose).toContain('Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(top = 40.dp, end = 24.dp, bottom = 80.dp, start = 24.dp)');
        expect(compose).toContain('// classList: hero hero-native');
        expect(compose).toContain('Column(modifier = Modifier.fillMaxWidth().padding(32.dp))');
        expect(compose).toContain('Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(20.dp), verticalAlignment = Alignment.CenterVertically)');
        expect(compose).toContain('// classList: hero-badge');
        expect(compose).toContain('Column(modifier = Modifier.width(84.dp).height(84.dp))');
        expect(compose).toContain('fontSize = 28.sp');
        expect(compose).toContain('// classList: panel-grid panel-grid-native');
        expect(compose).toContain('Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp))');
        expect(compose).toContain('Box(modifier = Modifier.weight(1f).fillMaxWidth())');
        expect(compose).toContain('Box(modifier = Modifier.weight(1f).fillMaxWidth())');

        expect(swiftui).toContain('.padding(.top, 40)');
        expect(swiftui).toContain('.padding(.trailing, 24)');
        expect(swiftui).toContain('.padding(.bottom, 80)');
        expect(swiftui).toContain('.padding(.leading, 24)');
        expect(swiftui).toContain('.frame(width: 84, height: 84)');
        expect(swiftui).toContain('.font(.system(size: 28))');
        expect(swiftui).toContain('HStack(alignment: .top, spacing: 16) {');
        expect(swiftui).toContain('.layoutPriority(1)');
        expect(swiftui).toContain('.layoutPriority(1)');
    });

    it('fills decorated child containers across native block layouts without explicit width', () => {
        styles.addClass('stack', {
            gap: '12px',
        });
        styles.addClass('card', {
            padding: '20px',
            borderRadius: '16px',
            background: '#fff',
            border: '1px solid rgba(38, 25, 20, 0.12)',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'stack' },
                div({ className: 'card' }, span('Card content')),
                div('Body copy'),
            ),
            { functionName: 'AutoFillCardScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'stack' },
                div({ className: 'card' }, span('Card content')),
                div('Body copy'),
            ),
            { structName: 'AutoFillCardScreen' },
        );

        expect(compose).toContain('// classList: card');
        expect(compose).toContain('Column(modifier = Modifier.fillMaxWidth().background(color = Color(red = 1f, green = 1f, blue = 1f, alpha = 1f), shape = RoundedCornerShape(16.dp)).border(1.dp, Color(red = 0.149f, green = 0.098f, blue = 0.078f, alpha = 0.12f), RoundedCornerShape(16.dp)).padding(20.dp))');

        expect(swiftui).toContain('// classList: card');
        expect(swiftui).toContain('.padding(20)');
        expect(swiftui).toContain('.frame(maxWidth: .infinity, alignment: .leading)');
    });

    it('maps rem and em text units, font families, and line-height into native text output', () => {
        styles.addClass('eyebrow', {
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '0.78rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
        });
        styles.addClass('lede', {
            fontSize: '1.05rem',
            lineHeight: 1.7,
            color: '#5d4335',
        });

        const compose = renderAndroidCompose(
            div(
                span({ className: 'eyebrow' }, 'mobile'),
                span({ className: 'lede' }, 'One repo validating browser, desktop, and Android mobile workflows.'),
            ),
            { functionName: 'TypographyScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                span({ className: 'eyebrow' }, 'mobile'),
                span({ className: 'lede' }, 'One repo validating browser, desktop, and Android mobile workflows.'),
            ),
            { structName: 'TypographyScreen' },
        );

        expect(compose).toContain('Text(text = "MOBILE", fontSize = 12.48.sp');
        expect(compose).toContain('fontFamily = FontFamily.Serif');
        expect(compose).toContain('letterSpacing = 1.28.sp');
        expect(compose).toContain('lineHeight = 28.56.sp');

        expect(swiftui).toContain('Text("MOBILE")');
        expect(swiftui).toContain('.font(.system(size: 12.48, design: .serif))');
        expect(swiftui).toContain('.kerning(1.28)');
        expect(swiftui).toContain('.lineSpacing(11.76)');
    });

    it('inherits body typography and clamps viewport-based font sizes in native output', () => {
        styles.addTag('body', {
            color: '#5d4335',
            fontFamily: 'Georgia, "Times New Roman", serif',
        });
        styles.addTag('h1', {
            fontSize: 'clamp(2.4rem, 5vw, 4.4rem)',
        });

        const compose = renderAndroidCompose(
            div(h1('Hybrid parity headline')),
            { functionName: 'ViewportTypographyScreen' },
        );

        const swiftui = renderSwiftUI(
            div(h1('Hybrid parity headline')),
            { structName: 'ViewportTypographyScreen' },
        );

        expect(compose).toContain('Text(text = "Hybrid parity headline", color = Color(');
        expect(compose).toContain('fontSize = 38.4.sp');
        expect(compose).toContain('fontFamily = FontFamily.Serif');

        expect(swiftui).toContain('Text("Hybrid parity headline")');
        expect(swiftui).toContain('.foregroundStyle(Color(');
        expect(swiftui).toContain('.font(.system(size: 38.4, design: .serif))');
    });

    it('keeps sans-serif body inheritance distinct from serif font families', () => {
        styles.addTag('body', {
            color: '#261914',
            fontFamily: '"Avenir Next", "Trebuchet MS", sans-serif',
        });
        styles.addTag('p', {
            lineHeight: 1.7,
        });
        styles.addClass('btn', {
            color: '#fff6ee',
            fontWeight: 700,
            lineHeight: 1.2,
        });

        const compose = renderAndroidCompose(
            div(
                p('Body copy'),
                button({ className: 'btn' }, 'CTA'),
                span('Plain span'),
            ),
            { functionName: 'SansTypographyScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                p('Body copy'),
                button({ className: 'btn' }, 'CTA'),
                span('Plain span'),
            ),
            { structName: 'SansTypographyScreen' },
        );

        expect(compose).toContain('Text(text = "Body copy", color = Color(');
        expect(compose).toContain('fontFamily = FontFamily.SansSerif, lineHeight = 27.2.sp');
        expect(compose).toContain('Text(text = "CTA", color = Color(');
        expect(compose).toContain('fontWeight = FontWeight.W700, fontFamily = FontFamily.SansSerif, lineHeight = 19.2.sp');

        expect(swiftui).toContain('Text("Body copy")');
        expect(swiftui).not.toContain('design: .serif');
    });

    it('approximates frosted backdrop surfaces in native output', () => {
        styles.addClass('glass', {
            padding: '24px',
            borderRadius: '28px',
            background: 'rgba(255, 252, 247, 0.82)',
            backdropFilter: 'blur(18px)',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'glass' },
                span('Glass surface'),
            ),
            { functionName: 'GlassScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'glass' },
                span('Glass surface'),
            ),
            { structName: 'GlassScreen' },
        );

        expect(compose).toContain('Modifier.background(color = Color(red = 1f, green = 0.988f, blue = 0.969f, alpha = 0.932f), shape = RoundedCornerShape(28.dp)).shadow(elevation = 12.dp, shape = RoundedCornerShape(28.dp)).padding(24.dp)');
        expect(swiftui).toContain('.background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 28))');
        expect(swiftui).toContain('.background(Color(red: 1, green: 0.988, blue: 0.969, opacity: 0.932))');
    });

    it('maps viewport units and numeric CSS functions into native layout sizing', () => {
        styles.addClass('hero-shell', {
            minHeight: '100vh',
            maxWidth: 'min(92vw, 640px)',
            padding: 'calc(1vw + 4px)',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'hero-shell' },
                span('Viewport shell'),
            ),
            { functionName: 'ViewportSizingScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'hero-shell' },
                span('Viewport shell'),
            ),
            { structName: 'ViewportSizingScreen' },
        );

        expect(compose).toContain('Modifier.widthIn(max = 358.8.dp).heightIn(min = 844.dp).padding(7.9.dp)');
        expect(swiftui).toContain('.padding(7.9)');
        expect(swiftui).toContain('.frame(maxWidth: 358.8, minHeight: 844)');
    });

    it('maps explicit grid columns into weighted native rows', () => {
        styles.addClass('grid', {
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '20px',
        });
        styles.addClass('cell', {
            padding: '12px',
            borderRadius: '16px',
            background: '#fff',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'grid' },
                div({ className: 'cell' }, span('Alpha panel')),
                div({ className: 'cell' }, span('Beta panel')),
            ),
            { functionName: 'GridScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'grid' },
                div({ className: 'cell' }, span('Alpha panel')),
                div({ className: 'cell' }, span('Beta panel')),
            ),
            { structName: 'GridScreen' },
        );

        expect(compose).toContain('Row(modifier = Modifier, horizontalArrangement = Arrangement.spacedBy(20.dp))');
        expect(compose).toContain('Box(modifier = Modifier.weight(1.2f).fillMaxWidth())');
        expect(compose).toContain('Box(modifier = Modifier.weight(0.8f).fillMaxWidth())');
        expect(compose).toContain('modifier = Modifier.fillMaxWidth().background(color = Color(red = 1f, green = 1f, blue = 1f, alpha = 1f), shape = RoundedCornerShape(16.dp)).padding(12.dp)');

        expect(swiftui).toContain('HStack(alignment: .top, spacing: 20) {');
        expect(swiftui).toContain('.frame(maxWidth: .infinity, alignment: .leading)');
        expect(swiftui).toContain('.layoutPriority(1.2)');
        expect(swiftui).toContain('.layoutPriority(0.8)');
    });

    it('wraps flex rows into stacked native rows when content exceeds the mobile viewport', () => {
        styles.addClass('button-row', {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'button-row' },
                button('Record another validation pass'),
                button('Open the Elit repository'),
            ),
            { functionName: 'WrappedButtonsScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'button-row' },
                button('Record another validation pass'),
                button('Open the Elit repository'),
            ),
            { structName: 'WrappedButtonsScreen' },
        );

        expect(compose).toContain('Column(modifier = Modifier, verticalArrangement = Arrangement.spacedBy(12.dp))');
        expect(compose).toContain('Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp))');

        expect(swiftui).toContain('VStack(alignment: .leading, spacing: 12) {');
        expect(swiftui).toContain('HStack(alignment: .top, spacing: 12) {');
    });

    it('translates safe text margins into native spacing', () => {
        styles.addTag('h2', {
            marginBottom: '14px',
            color: '#261914',
        });

        const compose = renderAndroidCompose(
            div(
                h2('Section title'),
                span('Body copy'),
            ),
            { functionName: 'MarginScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                h2('Section title'),
                span('Body copy'),
            ),
            { structName: 'MarginScreen' },
        );

        expect(compose).toContain('Text(text = "Section title", modifier = Modifier.padding(bottom = 14.dp), color = Color(');
        expect(swiftui).toContain('Text("Section title")');
        expect(swiftui).toContain('.padding(.bottom, 14)');
    });

    it('centers max-width containers with horizontal auto margins', () => {
        styles.addClass('shell', {
            maxWidth: '480px',
            margin: '0 auto',
            gap: '16px',
        });

        const compose = renderAndroidCompose(
            div(
                { className: 'shell' },
                span('Centered shell'),
            ),
            { functionName: 'CenteredShellScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'shell' },
                span('Centered shell'),
            ),
            { structName: 'CenteredShellScreen' },
        );

        expect(compose).toContain('Modifier.fillMaxWidth().widthIn(max = 480.dp).wrapContentWidth(Alignment.CenterHorizontally)');
        expect(swiftui).toContain('.frame(maxWidth: 480)');
        expect(swiftui).toContain('.frame(maxWidth: .infinity, alignment: .center)');
    });

    it('keeps decorated element margins as outer native spacing', () => {
        styles.addClass('pill', {
            display: 'inline-block',
            padding: '6px 10px',
            borderRadius: '999px',
            background: 'rgba(213, 110, 67, 0.12)',
            color: '#d56e43',
            marginBottom: '10px',
        });

        const compose = renderAndroidCompose(
            div(
                span({ className: 'pill' }, 'Web'),
                span('Body copy'),
            ),
            { functionName: 'DecoratedMarginScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                span({ className: 'pill' }, 'Web'),
                span('Body copy'),
            ),
            { structName: 'DecoratedMarginScreen' },
        );

        expect(compose).toContain('Modifier.padding(bottom = 10.dp).background(color = Color(');
        expect(compose).toContain('RoundedCornerShape(999.dp)).padding(top = 6.dp, end = 10.dp, bottom = 6.dp, start = 10.dp)');
        expect(swiftui).toContain('.background(Color(');
        expect(swiftui).toContain('.padding(.bottom, 10)');
    });

    it('neutralizes native text field chrome and adds multiline textarea hints', () => {
        styles.addClass('field', {
            padding: '14px 16px',
            borderRadius: '16px',
            border: '1px solid rgba(38, 25, 20, 0.12)',
            background: '#fff',
            color: '#261914',
            fontWeight: 700,
        });

        const compose = renderAndroidCompose(
            div(
                input({ className: 'field', value: 'abc', placeholder: 'Search' }),
                textarea({ className: 'field', value: 'Notes', placeholder: 'Repo note' }),
            ),
            { functionName: 'FieldChromeScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                input({ className: 'field', value: 'abc', placeholder: 'Search' }),
                textarea({ className: 'field', value: 'Notes', placeholder: 'Repo note' }),
            ),
            { structName: 'FieldChromeScreen' },
        );

        expect(compose).toContain('BasicTextField(');
        expect(compose).toContain('textStyle = androidx.compose.ui.text.TextStyle(');
        expect(compose).toContain('cursorBrush = SolidColor(Color(');
        expect(compose).toContain('modifier = Modifier.background(color = Color(red = 1f, green = 1f, blue = 1f, alpha = 1f), shape = RoundedCornerShape(16.dp)).border(1.dp, Color(red = 0.149f, green = 0.098f, blue = 0.078f, alpha = 0.12f), RoundedCornerShape(16.dp)).padding(top = 14.dp, end = 16.dp, bottom = 14.dp, start = 16.dp)');
        expect(compose).toContain('singleLine = true,');
        expect(compose).toContain('decorationBox = { innerTextField ->');
        expect(compose).toContain('minLines = 4,');
        expect(compose).toContain('contentAlignment = Alignment.TopStart');

        expect(swiftui).toContain('.textFieldStyle(.plain)');
        expect(swiftui).toContain('TextField("Repo note", text: $textFieldValue1, axis: .vertical)');
        expect(swiftui).toContain('.lineLimit(4, reservesSpace: true)');
    });

    it('maps gradients, shadows, and button theme into Compose output', () => {
        const compose = renderAndroidCompose(
            div(
                {
                    style: {
                        background: 'linear-gradient(180deg, #f7e7d2 0%, #f0d7ba 100%)',
                        borderRadius: '28px',
                        boxShadow: '0 24px 80px rgba(102, 61, 35, 0.12)',
                        padding: '24px',
                    },
                },
                button(
                    {
                        style: {
                            background: 'linear-gradient(135deg, #d56e43 0%, #b75a36 100%)',
                            color: '#fff6ee',
                            borderRadius: '999px',
                            boxShadow: '0 10px 28px rgba(102, 61, 35, 0.15)',
                            fontWeight: '700',
                        },
                    },
                    'Launch now',
                ),
            ),
            { functionName: 'ThemedScreen' },
        );

        expect(compose).toContain('background(brush = Brush.verticalGradient(colors = listOf(');
        expect(compose).toContain('shadow(elevation = 24.dp, shape = RoundedCornerShape(28.dp))');
        expect(compose).toContain('Box(modifier = Modifier.shadow(elevation = 10.dp, shape = RoundedCornerShape(999.dp)).background(brush = Brush.linearGradient(colors = listOf(');
        expect(compose).toContain('contentAlignment = Alignment.Center');
        expect(compose).toContain('Text(text = "Launch now", color = Color(');
        expect(compose).toContain('fontWeight = FontWeight.W700');
    });

    it('maps gradients, shadows, and button theme into SwiftUI output', () => {
        const swiftui = renderSwiftUI(
            div(
                {
                    style: {
                        background: 'linear-gradient(180deg, #f7e7d2 0%, #f0d7ba 100%)',
                        borderRadius: '28px',
                        boxShadow: '0 24px 80px rgba(102, 61, 35, 0.12)',
                        padding: '24px',
                    },
                },
                button(
                    {
                        style: {
                            background: 'linear-gradient(135deg, #d56e43 0%, #b75a36 100%)',
                            color: '#fff6ee',
                            borderRadius: '999px',
                            boxShadow: '0 10px 28px rgba(102, 61, 35, 0.15)',
                            fontWeight: '700',
                        },
                    },
                    'Launch now',
                ),
            ),
            { structName: 'ThemedScreen' },
        );

        expect(swiftui).toContain('.background(LinearGradient(colors: [Color(');
        expect(swiftui).toContain('.clipShape(RoundedRectangle(cornerRadius: 28))');
        expect(swiftui).toContain('.shadow(color: Color(');
        expect(swiftui).toContain('Text("Launch now")');
        expect(swiftui).toContain('.buttonStyle(.plain)');
        expect(swiftui).toContain('.clipShape(RoundedRectangle(cornerRadius: 999))');
        expect(swiftui).toContain('.font(.system(size: 17, weight: .bold))');
        expect(swiftui).toContain('.foregroundStyle(Color(');
    });
});