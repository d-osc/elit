/// <reference path="../../src/test-globals.d.ts" />

import { a, button, div, frag, h1, img, input, li, span, ul } from '../../src/el';
import { renderAndroidCompose, renderNativeJson, renderNativeTree, renderSwiftUI } from '../../src/native';

describe('native target foundation', () => {
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
});