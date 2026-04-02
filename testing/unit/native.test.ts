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
                input({ className: 'field', value: 'abc', placeholder: 'Search' }),
            ),
            { functionName: 'ResponsiveNativeScreen' },
        );

        const swiftui = renderSwiftUI(
            div(
                { className: 'card' },
                input({ className: 'field', value: 'abc', placeholder: 'Search' }),
            ),
            { structName: 'ResponsiveNativeScreen' },
        );

        expect(compose).toContain('Column(modifier = Modifier.widthIn(max = 280.dp).padding(12.dp))');
        expect(compose).toContain('modifier = Modifier.border(2.dp, Color(');

        expect(swiftui).toContain('.padding(12)');
        expect(swiftui).toContain('.frame(maxWidth: 280)');
        expect(swiftui).toContain('.overlay(RoundedRectangle(cornerRadius: 0).stroke(Color(');
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