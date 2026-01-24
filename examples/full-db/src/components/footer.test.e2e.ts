/**
 * Footer Component E2E Tests
 *
 * End-to-end automation tests for the Footer component.
 * These tests verify the footer works correctly in a full integration scenario.
 */

import { Footer } from './Footer';
import type { VNode } from 'elit/types';

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

describe('Footer Component E2E', () => {
    describe('server-side rendering', () => {
        it('should render footer to HTML string', () => {
            const footerVNode = Footer();
            const footerHtml = renderToString(footerVNode);

            expect(footerHtml).toBeDefined();
            expect(typeof footerHtml).toBe('string');
            expect(footerHtml.length).toBeGreaterThan(0);
        });

        it('should render footer with correct tag name', () => {
            const footerHtml = renderToString(Footer());

            expect(footerHtml).toContain('<footer');
            expect(footerHtml).toContain('class="footer"');
        });

        it('should render footer with all sections', () => {
            const footerHtml = renderToString(Footer());

            // Should contain the content wrapper
            expect(footerHtml).toContain('footer-content');

            // Should contain three sections
            const sectionMatches = footerHtml.match(/footer-section/g);
            expect(sectionMatches).toBeDefined();
            expect(sectionMatches?.length).toBe(3);
        });

        it('should render all links with correct attributes', () => {
            const footerHtml = renderToString(Footer());

            // GitHub link with external target
            expect(footerHtml).toContain('href="https://github.com"');
            expect(footerHtml).toContain('target="_blank"');

            // Documentation and Support links
            expect(footerHtml).toContain('href="#"');
            expect(footerHtml).toContain('>Documentation<');
            expect(footerHtml).toContain('>Support<');
        });

        it('should render copyright with current year', () => {
            const footerHtml = renderToString(Footer());

            expect(footerHtml).toContain('©');
            expect(footerHtml).toContain('2026');
            expect(footerHtml).toContain('All rights reserved');
        });

        it('should render valid HTML structure', () => {
            const footerHtml = renderToString(Footer());

            // Check for proper opening and closing tags
            expect(footerHtml).toContain('<footer');
            expect(footerHtml).toContain('</footer>');

            // Verify footer open tag appears before close tag
            const openIndex = footerHtml.indexOf('<footer');
            const closeIndex = footerHtml.indexOf('</footer>');
            expect(openIndex).toBeLessThan(closeIndex);
        });
    });

    describe('integration with page layout', () => {
        it('should be compatible with page rendering', () => {
            const footerVNode = Footer();
            const footerHtml = renderToString(footerVNode);

            // Simulate page integration
            const pageHtml = `
                <!DOCTYPE html>
                <html>
                <head><title>Test Page</title></head>
                <body>
                    <main>
                        <h1>Page Content</h1>
                        <p>This is the main content.</p>
                    </main>
                    ${footerHtml}
                </body>
                </html>
            `;

            expect(pageHtml).toContain('<footer');
            expect(pageHtml).toContain('class="footer"');
            expect(pageHtml).toContain('Page Content');
            expect(pageHtml).toContain('</footer>');
            expect(pageHtml).toContain('</body>');
        });

        it('should not interfere with other page elements', () => {
            const header = '<header><nav>Navigation</nav></header>';
            const main = '<main><article>Article Content</article></main>';
            const footerHtml = renderToString(Footer());

            const fullPage = header + main + footerHtml;

            expect(fullPage).toContain('<header');
            expect(fullPage).toContain('<main');
            expect(fullPage).toContain('<footer');
            expect(fullPage).toContain('Navigation');
            expect(fullPage).toContain('Article Content');
            expect(fullPage).toContain('My Elit App');
        });
    });

    describe('accessibility (a11y)', () => {
        it('should have meaningful link text', () => {
            const footerHtml = renderToString(Footer());

            // Check that all links have descriptive text
            expect(footerHtml).toContain('>GitHub<');
            expect(footerHtml).toContain('>Documentation<');
            expect(footerHtml).toContain('>Support<');
        });

        it('should have external link indicator for GitHub', () => {
            const footerHtml = renderToString(Footer());

            // External links should have target="_blank"
            expect(footerHtml).toContain('href="https://github.com"');
            expect(footerHtml).toContain('target="_blank"');
        });

        it('should use semantic HTML elements', () => {
            const footerHtml = renderToString(Footer());

            // Footer should use <footer> tag
            expect(footerHtml).toMatch(/<footer/);

            // Paragraphs should use <p> tags
            const pTagCount = (footerHtml.match(/<p/g) || []).length;
            expect(pTagCount).toBeGreaterThan(0);

            // Links should use <a> tags
            const aTagCount = (footerHtml.match(/<a/g) || []).length;
            expect(aTagCount).toBe(3);
        });
    });

    describe('SEO and metadata', () => {
        it('should contain copyright information for SEO', () => {
            const footerHtml = renderToString(Footer());

            // Copyright info is important for SEO
            expect(footerHtml).toContain('©');
            expect(footerHtml).toContain('My Elit App');
        });

        it('should have descriptive text content', () => {
            const footerHtml = renderToString(Footer());

            // Check for descriptive content
            expect(footerHtml).toContain('Elit Framework');
            expect(footerHtml).toContain('Built with');
        });
    });

    describe('cross-browser compatibility', () => {
        it('should render standard HTML compatible with all browsers', () => {
            const footerHtml = renderToString(Footer());

            // Check for standard HTML5 elements
            expect(footerHtml).toContain('<footer');
            expect(footerHtml).toContain('<div');
            expect(footerHtml).toContain('<p');
            expect(footerHtml).toContain('<a');

            // No browser-specific features
            expect(footerHtml).not.toContain('-webkit-');
            expect(footerHtml).not.toContain('-moz-');
            expect(footerHtml).not.toContain('-ms-');
        });

        it('should use standard attributes', () => {
            const footerHtml = renderToString(Footer());

            // Standard HTML attributes
            expect(footerHtml).toContain('class=');
            expect(footerHtml).toContain('href=');
            expect(footerHtml).toContain('target=');

            // No non-standard attributes
            expect(footerHtml).not.toContain('data-');
        });
    });

    describe('performance', () => {
        it('should render quickly (performance benchmark)', () => {
            const startTime = performance.now();

            // Render multiple times to test performance
            for (let i = 0; i < 100; i++) {
                renderToString(Footer());
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Should complete 100 renders in less than 100ms (1ms per render)
            expect(duration).toBeLessThan(100);
        });

        it('should produce reasonable HTML size', () => {
            const footerHtml = renderToString(Footer());
            const sizeInBytes = new Blob([footerHtml]).size;

            // Footer HTML should be reasonably small (< 2KB)
            expect(sizeInBytes).toBeLessThan(2048);
        });
    });

    describe('content integrity', () => {
        it('should not contain broken or empty content', () => {
            const footerHtml = renderToString(Footer());

            // No empty links or headings
            expect(footerHtml).not.toMatch(/<a[^>]*><\/a>/);
            expect(footerHtml).not.toMatch(/<p[^>]*><\/p>/);

            // All text content should be present
            expect(footerHtml).toContain('My Elit App');
            expect(footerHtml).toContain('GitHub');
            expect(footerHtml).toContain('Documentation');
            expect(footerHtml).toContain('Support');
        });

        it('should have consistent content across renders', () => {
            const render1 = renderToString(Footer());
            const render2 = renderToString(Footer());

            expect(render1).toBe(render2);
        });
    });

    describe('component behavior', () => {
        it('should create consistent VNode structure', () => {
            const footer1 = Footer();
            const footer2 = Footer();

            expect(footer1.tagName).toBe(footer2.tagName);
            expect(footer1.props).toEqual(footer2.props);
            expect(footer1.children?.length).toBe(footer2.children?.length);
        });

        it('should not mutate between calls', () => {
            const footer1 = Footer();
            const footer2 = Footer();
            const footer3 = Footer();

            // All instances should be equal
            expect(JSON.stringify(footer1)).toBe(JSON.stringify(footer2));
            expect(JSON.stringify(footer2)).toBe(JSON.stringify(footer3));
        });

        it('should handle all prop types correctly', () => {
            const footer = Footer();

            expect(footer.props).toBeDefined();
            expect(typeof footer.props).toBe('object');
            expect(footer.props?.className).toBe('footer');
        });
    });

    describe('data flow', () => {
        it('should have complete data from component to rendered output', () => {
            const footer = Footer();
            const footerHtml = renderToString(footer);

            // Title section
            expect(footerHtml).toContain('My Elit App');
            expect(footerHtml).toContain('Built with Elit Framework');

            // Links section
            expect(footerHtml).toContain('GitHub');
            expect(footerHtml).toContain('Documentation');
            expect(footerHtml).toContain('Support');

            // Copyright section
            expect(footerHtml).toContain('© 2026 My Elit App. All rights reserved.');
        });

        it('should preserve all CSS classes through render', () => {
            const footerHtml = renderToString(Footer());

            expect(footerHtml).toContain('class="footer"');
            expect(footerHtml).toContain('footer-content');
            expect(footerHtml).toContain('footer-section');
            expect(footerHtml).toContain('footer-title');
            expect(footerHtml).toContain('footer-text');
            expect(footerHtml).toContain('footer-link');
            expect(footerHtml).toContain('footer-copyright');
        });
    });

    describe('edge cases', () => {
        it('should handle multiple renders without side effects', () => {
            const renders = [];
            for (let i = 0; i < 10; i++) {
                renders.push(renderToString(Footer()));
            }

            // All renders should be identical
            expect(renders.every(r => r === renders[0])).toBe(true);
        });

        it('should maintain referential integrity', () => {
            const footer1 = Footer();
            const footer2 = Footer();

            // Tags and props should be equal by value
            expect(footer1.tagName).toBe(footer2.tagName);
            expect(footer1.props).toEqual(footer2.props);
        });
    });
});
