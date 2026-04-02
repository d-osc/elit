/// <reference path="../../src/test-globals.d.ts" />

import { a, button, div, frag, h1, h2, img, input, li, span, ul } from '../../src/el';
import { renderAndroidCompose, renderNativeJson, renderNativeTree, renderSwiftUI } from '../../src/native';
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
        expect(compose).toContain('OutlinedTextField(');
        expect(compose).toContain('Checkbox(');
        expect(compose).toContain('uriHandler.openUri("https://elit.dev/docs")');
        expect(compose).toContain('Button(onClick = { /* TODO: wire elit event(s): press */ }, modifier = Modifier)');
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
        expect(swiftui).toContain('elitImagePlaceholder(source: "./logo.png", alt: "Logo")');
        expect(swiftui).toContain('#Preview {');
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
        expect(compose).toContain('Row(modifier = Modifier, horizontalArrangement = Arrangement.spacedBy(20.dp), verticalAlignment = Alignment.CenterVertically)');
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
        expect(compose).toContain('Row(modifier = Modifier, horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically)');
        expect(compose).toContain('background(brush = Brush.linearGradient(colors = listOf(');
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

        expect(compose).toContain('Row(modifier = Modifier, horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically)');
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
        expect(compose).toContain('Button(onClick = { }, modifier = Modifier.shadow(elevation = 10.dp, shape = RoundedCornerShape(999.dp)).background(brush = Brush.linearGradient(colors = listOf(');
        expect(compose).toContain('shape = RoundedCornerShape(999.dp)');
        expect(compose).toContain('colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent, contentColor = Color(');
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