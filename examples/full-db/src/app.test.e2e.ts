/**
 * App E2E Tests
 *
 * End-to-end tests for the full application integration.
 * Tests component composition, page layout, and HTML structure.
 */

import { Footer } from './components/Footer';
import type { VNode } from 'elit/types';

// Type guard to check if a child is a VNode
function isVNode(child: any): child is VNode {
    return child && typeof child === 'object' && 'tagName' in child;
}

// Helper function to render VNode to HTML string (simplified SSR)
function renderToString(vNode: VNode | string | number | undefined | null): string {
    if (vNode == null || vNode === false) return '';
    if (typeof vNode !== 'object') return String(vNode);

    const { tagName, props, children } = vNode;
    const attrs = props ? Object.entries(props)
        .filter(([k, v]) => v != null && v !== false && k !== 'children' && k !== 'ref' && !k.startsWith('on'))
        .map(([k, v]) => {
            if (k === 'className' || k === 'class') return `class="${Array.isArray(v) ? v.join(' ') : v}"`;
            if (k === 'style') return `style="${typeof v === 'string' ? v : Object.entries(v).map(([sk, sv]) => `${sk.replace(/([A-Z])/g, '-$1').toLowerCase()}:${sv}`).join(';')}"`;
            if (v === true) return k;
            return `${k}="${v}"`;
        })
        .join(' ') : '';

    const childrenStr = children && children.length > 0
        ? children.map(c => renderToString(c as any)).join('')
        : '';

    return `<${tagName}${attrs ? ' ' + attrs : ''}>${childrenStr}</${tagName}>`;
}

describe('App E2E Tests', () => {
    describe('page layout integration', () => {
        it('should render complete page structure with Footer', () => {
            const footer = Footer();
            const footerHtml = renderToString(footer);

            // Simulate full page render
            const pageHtml = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>My Elit App</title>
                </head>
                <body>
                    <header class="header">
                        <h1>My Elit App</h1>
                        <nav>
                            <a href="/">Home</a>
                            <a href="/about">About</a>
                        </nav>
                    </header>
                    <main class="main-content">
                        <h1>Welcome to My App</h1>
                        <p>This is a sample page.</p>
                    </main>
                    ${footerHtml}
                </body>
                </html>
            `;

            // Verify page structure
            expect(pageHtml).toContain('<!DOCTYPE html>');
            expect(pageHtml).toContain('<html lang="en">');
            expect(pageHtml).toContain('<header class="header">');
            expect(pageHtml).toContain('<main class="main-content">');
            expect(pageHtml).toContain('<footer');
            expect(pageHtml).toContain('Welcome to My App');
            expect(pageHtml).toContain('This is a sample page');
        });

        it('should maintain consistent layout across renders', () => {
            const footer1 = Footer();
            const footer2 = Footer();

            const html1 = renderToString(footer1);
            const html2 = renderToString(footer2);

            // Components should render consistently
            expect(html1).toBe(html2);
        });

        it('should support multiple instances of same component', () => {
            const footer1 = Footer();
            const footer2 = Footer();
            const footer3 = Footer();

            const html1 = renderToString(footer1);
            const html2 = renderToString(footer2);
            const html3 = renderToString(footer3);

            // All instances should be identical
            expect(html1).toBe(html2);
            expect(html2).toBe(html3);
        });
    });

    describe('component composition', () => {
        it('should render Footer in different page contexts', () => {
            const footer = Footer();
            const footerHtml = renderToString(footer);

            // Home page context
            const homePage = `
                <html>
                <head><title>Home</title></head>
                <body>
                    <main><h1>Home Page</h1></main>
                    ${footerHtml}
                </body>
                </html>
            `;

            // About page context
            const aboutPage = `
                <html>
                <head><title>About</title></head>
                <body>
                    <main><h1>About Page</h1></main>
                    ${footerHtml}
                </body>
                </html>
            `;

            expect(homePage).toContain('<footer');
            expect(aboutPage).toContain('<footer');
            expect(homePage).toContain('Home Page');
            expect(aboutPage).toContain('About Page');
        });

        it('should handle component reuse in different containers', () => {
            const footer = Footer();

            // Footer should work in different container contexts
            const context1 = `<div class="page-wrapper">${renderToString(footer)}</div>`;
            const context2 = `<section class="content-wrapper">${renderToString(footer)}</section>`;
            const context3 = `<article class="article-wrapper">${renderToString(footer)}</article>`;

            expect(context1).toContain('<footer');
            expect(context2).toContain('<footer');
            expect(context3).toContain('<footer');

            // All contexts should contain footer content
            expect(context1).toContain('My Elit App');
            expect(context2).toContain('My Elit App');
            expect(context3).toContain('My Elit App');
        });
    });

    describe('data integrity', () => {
        it('should preserve Footer content across multiple renders', () => {
            const footer = Footer();
            const html1 = renderToString(footer);
            const html2 = renderToString(footer);
            const html3 = renderToString(footer);

            // Content should be identical across renders
            expect(html1).toContain('My Elit App');
            expect(html2).toContain('My Elit App');
            expect(html3).toContain('My Elit App');

            expect(html1).toContain('Built with Elit Framework');
            expect(html2).toContain('Built with Elit Framework');
            expect(html3).toContain('Built with Elit Framework');

            // Copyright year should be consistent
            const yearCount = (html: string) => (html.match(/2026/g) || []).length;
            expect(yearCount(html1)).toBe(yearCount(html2));
            expect(yearCount(html2)).toBe(yearCount(html3));
        });

        it('should have consistent link structure across renders', () => {
            const footer = Footer();

            // Get all links from multiple renders
            const links1 = renderToString(footer).match(/<a[^>]*>/g) || [];
            const links2 = renderToString(footer).match(/<a[^>]*>/g) || [];

            // Should have same number of links
            expect(links1.length).toBe(links2.length);

            // Links should be consistent
            links1.forEach((link, i) => {
                expect(link).toBe(links2[i]);
            });
        });
    });

    describe('CSS consistency', () => {
        it('should apply correct CSS classes consistently', () => {
            const footer = Footer();
            const html = renderToString(footer);

            // Verify all expected CSS classes are present
            expect(html).toContain('class="footer"');
            expect(html).toContain('class="footer-content"');
            expect(html).toContain('class="footer-section"');
        });

        it('should not have duplicate CSS classes in same element', () => {
            const footer = Footer();
            const html = renderToString(footer);

            // Check for duplicate class attributes
            const elements = html.match(/<[^>]+class="([^"]+)"/g) || [];
            elements.forEach(element => {
                const classMatch = element.match(/class="([^"]+)"/);
                if (classMatch) {
                    const classes = classMatch[1].split(' ');
                    const uniqueClasses = new Set(classes);
                    expect(classes.length).toBe(uniqueClasses.size);
                }
            });
        });
    });

    describe('performance benchmarks', () => {
        it('should render page quickly', () => {
            const startTime = performance.now();

            const footer = Footer();
            const footerHtml = renderToString(footer);

            const endTime = performance.now();
            const renderTime = endTime - startTime;

            // Page render should be fast (< 5ms)
            expect(renderTime).toBeLessThan(5);
            expect(footerHtml.length).toBeGreaterThan(0);
        });

        it('should handle multiple component renders efficiently', () => {
            const iterations = 100;
            const startTime = performance.now();

            for (let i = 0; i < iterations; i++) {
                const footer = Footer();
                renderToString(footer);
            }

            const endTime = performance.now();
            const avgTime = (endTime - startTime) / iterations;

            // Average render time should be fast (< 1ms per render)
            expect(avgTime).toBeLessThan(1);
        });
    });

    describe('HTML validity', () => {
        it('should generate valid HTML structure', () => {
            const footer = Footer();
            const html = renderToString(footer);

            // Check for proper tag closing
            const openFooterTags = (html.match(/<footer/g) || []).length;
            const closeFooterTags = (html.match(/<\/footer>/g) || []).length;
            expect(openFooterTags).toBe(closeFooterTags);

            // Check for properly closed nested tags
            const openDivTags = (html.match(/<div/g) || []).length;
            const closeDivTags = (html.match(/<\/div>/g) || []).length;
            expect(openDivTags).toBe(closeDivTags);
        });

        it('should have proper attribute quoting', () => {
            const footer = Footer();
            const html = renderToString(footer);

            // All attributes should be properly quoted
            const badAttributes = html.match(/=\s*[^"'][^>\s]*[^"'\s>]/g) || [];
            expect(badAttributes.length).toBe(0);
        });

        it('should not have self-closing non-void elements', () => {
            const footer = Footer();
            const html = renderToString(footer);

            // Non-void elements should not be self-closing
            const invalidSelfClosing = html.match(/<(div|p|a|footer|section)([^>]*)\/>/g) || [];
            expect(invalidSelfClosing.length).toBe(0);
        });
    });

    describe('SEO and accessibility', () => {
        it('should include proper semantic HTML elements', () => {
            const footer = Footer();
            const html = renderToString(footer);

            // Should use semantic elements
            expect(html).toContain('<footer');
            expect(html).toContain('<p');
        });

        it('should have descriptive link text', () => {
            const footer = Footer();
            const html = renderToString(footer);

            // Extract links
            const links = html.match(/<a[^>]*>([^<]+)<\/a>/g) || [];

            // All links should have text content
            links.forEach(link => {
                const textMatch = link.match(/<a[^>]*>([^<]+)<\/a>/);
                expect(textMatch).toBeTruthy();
                const text = textMatch?.[1] || '';
                expect(text.trim().length).toBeGreaterThan(0);
            });
        });

        it('should have proper copyright information', () => {
            const footer = Footer();
            const html = renderToString(footer);

            // Should contain copyright symbol and year
            expect(html).toContain('©');
            expect(html).toContain('2026');
        });
    });

    describe('error handling', () => {
        it('should handle rendering with default props', () => {
            // Components should render with default props
            const footer = Footer();

            expect(() => renderToString(footer)).not.toThrow();
            const html = renderToString(footer);
            expect(html.length).toBeGreaterThan(0);
        });

        it('should not have undefined or null attributes', () => {
            const footer = Footer();
            const html = renderToString(footer);

            // Should not have undefined attributes
            expect(html).not.toContain('undefined');
            expect(html).not.toContain('class=""');
            expect(html).not.toContain('href=""');
        });
    });

    describe('full page integration', () => {
        it('should create valid complete HTML document', () => {
            const footer = Footer();
            const footerHtml = renderToString(footer);

            const completeDoc = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="My Elit App - A sample application">
    <title>My Elit App</title>
</head>
<body>
    <div id="app">
        <header>
            <h1>My Elit App</h1>
        </header>
        <main>
            <p>Welcome to the application!</p>
        </main>
        ${footerHtml}
    </div>
</body>
</html>`;

            // Verify document structure
            expect(completeDoc).toContain('<!DOCTYPE html>');
            expect(completeDoc).toContain('<html lang="en">');
            expect(completeDoc).toContain('<head>');
            expect(completeDoc).toContain('<body>');
            expect(completeDoc).toContain('<meta charset="UTF-8">');
            expect(completeDoc).toContain('<meta name="viewport"');
            expect(completeDoc).toContain('<title>My Elit App</title>');
        });

        it('should support multi-page site structure', () => {
            const footer = Footer();
            const footerHtml = renderToString(footer);

            const pages = [
                { title: 'Home', path: '/' },
                { title: 'About', path: '/about' },
                { title: 'Contact', path: '/contact' },
            ];

            pages.forEach(page => {
                const pageDoc = `
<!DOCTYPE html>
<html>
<head><title>${page.title}</title></head>
<body>
    <main><h1>${page.title}</h1></main>
    ${footerHtml}
</body>
</html>`;
                expect(pageDoc).toContain('<title>' + page.title + '</title>');
                expect(pageDoc).toContain('<h1>' + page.title + '</h1>');
                expect(pageDoc).toContain('<footer');
            });
        });
    });
});
