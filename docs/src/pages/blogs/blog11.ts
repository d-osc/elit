import { div, h2, h3, p, ul, li, pre, code } from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog11: BlogPostDetail = {
  id: '11',
  title: {
    en: 'CSS-in-JS with Elit CreateStyle',
    th: 'CSS-in-JS ด้วย Elit CreateStyle'
  },
  date: '2024-03-15',
  author: 'n-devs',
  tags: ['Tutorial', 'CSS', 'Styling', 'CreateStyle'],
  content: {
    en: div(
      p('Master Elit\'s powerful CreateStyle CSS-in-JS system. This comprehensive guide covers CSS variables, selectors, pseudo-classes, media queries, animations, container queries, cascade layers, and advanced patterns for building maintainable, type-safe stylesheets programmatically.'),

      h2('What is CreateStyle?'),
      p('CreateStyle is Elit\'s built-in CSS-in-JS solution that provides a programmatic, type-safe way to generate CSS. It supports modern CSS features including custom properties, cascade layers, container queries, and supports queries - all with zero dependencies.'),
      ul(
        li('Type-safe CSS generation with TypeScript'),
        li('CSS Variables (Custom Properties)'),
        li('All selector types (tag, class, ID, pseudo, attribute, combinators)'),
        li('Media queries with helper methods'),
        li('Keyframe animations'),
        li('Font-face declarations'),
        li('Container queries'),
        li('Supports queries'),
        li('Cascade layers'),
        li('Nesting support (BEM-style)'),
        li('Programmatic CSS generation')
      ),

      h2('Basic Setup'),
      h3('Creating a Stylesheet'),
      p('Start by creating a new CreateStyle instance:'),
      pre(code(...codeBlock(`import { CreateStyle } from 'elit';

// Create a new stylesheet
const css = new CreateStyle();

// Add some styles
css.addClass('container', {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '20px'
});

css.addClass('button', {
  padding: '10px 20px',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer'
});

// Inject into document
css.inject('my-styles');

// Or get CSS string
const cssString = css.render();
console.log(cssString);`))),

      h2('CSS Variables'),
      h3('Defining and Using Variables'),
      p('Create reusable CSS custom properties:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Define CSS variables
const primaryColor = css.addVar('primary-color', '#3b82f6');
const secondaryColor = css.addVar('secondary-color', '#10b981');
const spacing = css.addVar('spacing', '1rem');
const borderRadius = css.addVar('border-radius', '8px');

// Use variables in styles
css.addClass('button', {
  backgroundColor: primaryColor,  // Uses var(--primary-color)
  padding: css.var(spacing),      // Uses var(--spacing)
  borderRadius: css.var(borderRadius)
});

// Use with fallback
css.addClass('card', {
  backgroundColor: css.var(primaryColor, '#ffffff')
});

// Generates:
// :root {
//   --primary-color: #3b82f6;
//   --secondary-color: #10b981;
//   --spacing: 1rem;
//   --border-radius: 8px;
// }`))),

      h2('Selectors'),
      h3('Basic Selectors'),
      p('CreateStyle supports all CSS selector types:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Tag selector
css.addTag('body', {
  margin: 0,
  fontFamily: 'system-ui, sans-serif',
  lineHeight: 1.6
});

// Class selector
css.addClass('container', {
  maxWidth: '1200px',
  margin: '0 auto'
});

// ID selector
css.addId('header', {
  position: 'sticky',
  top: 0,
  zIndex: 100
});

// Multiple selectors
css.multiple(['.button', '.link'], {
  cursor: 'pointer',
  transition: 'all 0.3s ease'
});`))),

      h3('Pseudo-Classes and Pseudo-Elements'),
      p('Add hover effects, focus states, and pseudo-elements:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Pseudo-class with base selector
css.addPseudoClass('hover', {
  backgroundColor: '#2563eb',
  transform: 'scale(1.05)'
}, '.button');

css.addPseudoClass('focus', {
  outline: '2px solid #3b82f6',
  outlineOffset: '2px'
}, '.button');

// Pseudo-elements
css.addPseudoElement('before', {
  content: '""',
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
  opacity: 0,
  transition: 'opacity 0.3s ease'
}, '.card');

css.addPseudoElement('after', {
  content: '"→"',
  marginLeft: '0.5rem'
}, '.link');

// Generates:
// .button:hover { ... }
// .button:focus { ... }
// .card::before { ... }
// .link::after { ... }`))),

      h3('Attribute Selectors'),
      p('Select elements by attributes:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Basic attribute selector
css.addAttribute('disabled', {
  opacity: 0.5,
  cursor: 'not-allowed'
}, 'button');

// Attribute equals
css.attrEquals('type', 'submit', {
  backgroundColor: '#10b981'
}, 'button');

// Attribute starts with
css.attrStartsWith('class', 'icon-', {
  width: '24px',
  height: '24px'
});

// Attribute ends with
css.attrEndsWith('href', '.pdf', {
  textDecoration: 'none'
}, 'a');

// Attribute contains
css.attrContains('class', 'btn', {
  padding: '8px 16px',
  borderRadius: '4px'
});

// Generates:
// button[disabled] { ... }
// button[type="submit"] { ... }
// [class^="icon-"] { ... }
// a[href$=".pdf"] { ... }
// [class*="btn"] { ... }`))),

      h3('Combinator Selectors'),
      p('Combine selectors with relationships:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Descendant selector
css.descendant('.nav', 'a', {
  color: '#374151',
  textDecoration: 'none',
  padding: '8px 12px'
});

// Direct child selector
css.child('.menu', 'li', {
  display: 'inline-block',
  margin: '0 8px'
});

// Adjacent sibling selector
css.adjacentSibling('h2', 'p', {
  marginTop: '1rem',
  fontSize: '1.125rem'
});

// General sibling selector
css.generalSibling('.active', '.item', {
  opacity: 0.6
});

// Generates:
// .nav a { ... }
// .menu > li { ... }
// h2 + p { ... }
// .active ~ .item { ... }`))),

      h2('Media Queries'),
      h3('Responsive Design'),
      p('Create responsive styles with media queries:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Min-width breakpoint
css.mediaMinWidth('768px', {
  '.container': {
    padding: '40px'
  },
  '.grid': {
    gridTemplateColumns: 'repeat(2, 1fr)'
  }
});

// Max-width breakpoint
css.mediaMaxWidth('640px', {
  '.sidebar': {
    display: 'none'
  },
  '.mobile-menu': {
    display: 'block'
  }
});

// Custom media query
css.mediaScreen('min-width: 1024px', {
  '.container': {
    maxWidth: '1280px'
  },
  '.grid': {
    gridTemplateColumns: 'repeat(3, 1fr)'
  }
});`))),

      h3('Dark Mode'),
      p('Support dark mode with prefers-color-scheme:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Light mode (default)
css.addClass('card', {
  backgroundColor: '#ffffff',
  color: '#111827',
  border: '1px solid #e5e7eb'
});

// Dark mode
css.mediaDark({
  '.card': {
    backgroundColor: '#1f2937',
    color: '#f9fafb',
    border: '1px solid #374151'
  },
  'body': {
    backgroundColor: '#111827',
    color: '#f9fafb'
  }
});

// Light mode explicit
css.mediaLight({
  '.card': {
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  }
});`))),

      h3('Print and Reduced Motion'),
      p('Optimize for print and accessibility:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Print styles
css.mediaPrint({
  '.no-print': {
    display: 'none'
  },
  'body': {
    fontSize: '12pt',
    color: '#000000'
  }
});

// Reduced motion for accessibility
css.mediaReducedMotion({
  '*': {
    animationDuration: '0.01ms !important',
    animationIterationCount: '1 !important',
    transitionDuration: '0.01ms !important'
  }
});`))),

      h2('Animations'),
      h3('Keyframe Animations'),
      p('Create smooth animations with @keyframes:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Define keyframes
css.keyframe('fadeIn', {
  from: { opacity: 0 },
  to: { opacity: 1 }
});

css.keyframe('slideUp', {
  0: { transform: 'translateY(20px)', opacity: 0 },
  100: { transform: 'translateY(0)', opacity: 1 }
});

css.keyframe('spin', {
  0: { transform: 'rotate(0deg)' },
  100: { transform: 'rotate(360deg)' }
});

// Use animations
css.addClass('fade-in', {
  animation: 'fadeIn 0.3s ease-in'
});

css.addClass('slide-up', {
  animation: 'slideUp 0.5s ease-out'
});

css.addClass('spinner', {
  animation: 'spin 1s linear infinite'
});`))),

      h3('From-To Animations'),
      p('Simple two-step animations:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Simple fade in
css.keyframeFromTo('fadeIn',
  { opacity: 0 },
  { opacity: 1 }
);

// Scale up
css.keyframeFromTo('scaleUp',
  { transform: 'scale(0.8)', opacity: 0 },
  { transform: 'scale(1)', opacity: 1 }
);

css.addClass('modal', {
  animation: 'scaleUp 0.3s ease-out'
});`))),

      h2('Font Faces'),
      h3('Custom Fonts'),
      p('Load custom web fonts with @font-face:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Add custom font
css.fontFace({
  fontFamily: 'Inter',
  src: 'url("/fonts/inter-regular.woff2") format("woff2")',
  fontWeight: 400,
  fontStyle: 'normal',
  fontDisplay: 'swap'
});

css.fontFace({
  fontFamily: 'Inter',
  src: 'url("/fonts/inter-bold.woff2") format("woff2")',
  fontWeight: 700,
  fontStyle: 'normal',
  fontDisplay: 'swap'
});

// Use custom font
css.addTag('body', {
  fontFamily: 'Inter, system-ui, sans-serif'
});`))),

      h2('Container Queries'),
      h3('Component-Based Responsive Design'),
      p('Use container queries for intrinsic responsive components:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Define a container
css.addContainer('card-container', {
  containerType: 'inline-size'
});

// Container query
css.container('min-width: 400px', {
  '.card-title': {
    fontSize: '1.5rem'
  },
  '.card-image': {
    float: 'left',
    width: '200px',
    marginRight: '1rem'
  }
}, 'card-container');

css.container('min-width: 600px', {
  '.card-title': {
    fontSize: '2rem'
  },
  '.card-content': {
    columns: 2
  }
}, 'card-container');`))),

      h2('Supports Queries'),
      h3('Feature Detection'),
      p('Use @supports for progressive enhancement:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Check for grid support
css.supports('display: grid', {
  '.layout': {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem'
  }
});

// Check for backdrop-filter support
css.supports('backdrop-filter: blur(10px)', {
  '.glass': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)'
  }
});

// Fallback without support
css.addClass('glass', {
  backgroundColor: 'rgba(255, 255, 255, 0.9)'
});`))),

      h2('Cascade Layers'),
      h3('Layer Management'),
      p('Control CSS specificity with @layer:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Define layer order
css.layerOrder('reset', 'base', 'components', 'utilities');

// Reset layer
css.layer('reset', {
  '*': {
    margin: 0,
    padding: 0,
    boxSizing: 'border-box'
  }
});

// Base layer
css.layer('base', {
  'body': {
    fontFamily: 'system-ui, sans-serif',
    lineHeight: 1.6
  }
});

// Components layer
css.layer('components', {
  '.button': {
    padding: '8px 16px',
    borderRadius: '4px'
  }
});

// Utilities layer (highest priority)
css.layer('utilities', {
  '.hidden': {
    display: 'none'
  },
  '.flex': {
    display: 'flex'
  }
});`))),

      h2('Nesting'),
      h3('BEM-Style Nesting'),
      p('Create nested styles with BEM methodology:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Define base component
const card = css.addClass('card', {
  padding: '1.5rem',
  borderRadius: '8px',
  backgroundColor: '#ffffff'
});

// Add modifiers and elements
css.nesting(card,
  css.addName('large', {
    padding: '2rem',
    fontSize: '1.125rem'
  }),
  css.addName('primary', {
    backgroundColor: '#3b82f6',
    color: '#ffffff'
  })
);

// Generates:
// .card { ... }
// .card--large { ... }
// .card--primary { ... }`))),

      h2('Import Stylesheets'),
      h3('External CSS'),
      p('Import external stylesheets:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Import external stylesheet
css.import('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');

// Import with media query
css.import('/print-styles.css', 'print');

// Import local file
css.import('/normalize.css');`))),

      h2('Advanced Patterns'),
      h3('Theme System'),
      p('Build a complete theme system with CSS variables:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Define theme variables
const theme = {
  colors: {
    primary: css.addVar('color-primary', '#3b82f6'),
    secondary: css.addVar('color-secondary', '#10b981'),
    accent: css.addVar('color-accent', '#f59e0b'),
    text: css.addVar('color-text', '#111827'),
    background: css.addVar('color-background', '#ffffff')
  },
  spacing: {
    xs: css.addVar('spacing-xs', '0.25rem'),
    sm: css.addVar('spacing-sm', '0.5rem'),
    md: css.addVar('spacing-md', '1rem'),
    lg: css.addVar('spacing-lg', '1.5rem'),
    xl: css.addVar('spacing-xl', '2rem')
  },
  typography: {
    fontFamily: css.addVar('font-family', 'Inter, system-ui, sans-serif'),
    fontSize: css.addVar('font-size-base', '16px'),
    lineHeight: css.addVar('line-height', '1.6')
  }
};

// Use theme
css.addTag('body', {
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSize,
  lineHeight: theme.typography.lineHeight,
  color: theme.colors.text,
  backgroundColor: theme.colors.background
});

css.addClass('button-primary', {
  backgroundColor: theme.colors.primary,
  padding: \`\${css.var(theme.spacing.sm)} \${css.var(theme.spacing.md)}\`
});`))),

      h3('Dark Theme Toggle'),
      p('Implement theme switching:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Light theme (default)
const lightPrimary = css.addVar('primary', '#3b82f6');
const lightBackground = css.addVar('background', '#ffffff');
const lightText = css.addVar('text', '#111827');

// Dark theme override
css.addAttribute('data-theme="dark"', {
  '--primary': '#60a5fa',
  '--background': '#111827',
  '--text': '#f9fafb'
}, 'body');

// Use variables
css.addClass('card', {
  backgroundColor: lightBackground,
  color: lightText
});

// Toggle theme in JavaScript
function toggleTheme() {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
}`))),

      h3('Utility Classes'),
      p('Generate utility classes programmatically:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Spacing utilities
const spacingValues = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24];
const spacingUnit = 0.25; // rem

for (const value of spacingValues) {
  const size = value * spacingUnit;

  // Margin utilities
  css.addClass(\`m-\${value}\`, { margin: \`\${size}rem\` });
  css.addClass(\`mt-\${value}\`, { marginTop: \`\${size}rem\` });
  css.addClass(\`mr-\${value}\`, { marginRight: \`\${size}rem\` });
  css.addClass(\`mb-\${value}\`, { marginBottom: \`\${size}rem\` });
  css.addClass(\`ml-\${value}\`, { marginLeft: \`\${size}rem\` });

  // Padding utilities
  css.addClass(\`p-\${value}\`, { padding: \`\${size}rem\` });
  css.addClass(\`pt-\${value}\`, { paddingTop: \`\${size}rem\` });
  css.addClass(\`pr-\${value}\`, { paddingRight: \`\${size}rem\` });
  css.addClass(\`pb-\${value}\`, { paddingBottom: \`\${size}rem\` });
  css.addClass(\`pl-\${value}\`, { paddingLeft: \`\${size}rem\` });
}

// Display utilities
css.addClass('hidden', { display: 'none' });
css.addClass('block', { display: 'block' });
css.addClass('flex', { display: 'flex' });
css.addClass('grid', { display: 'grid' });
css.addClass('inline', { display: 'inline' });`))),

      h2('Best Practices'),
      ul(
        li('Use CSS variables for theme values and reusable values'),
        li('Organize styles with cascade layers for predictable specificity'),
        li('Leverage container queries for component-based responsive design'),
        li('Use @supports for progressive enhancement'),
        li('Keep selectors simple and avoid deep nesting'),
        li('Generate utility classes programmatically for consistency'),
        li('Use media queries for layout, container queries for components'),
        li('Implement dark mode with CSS variables for easy toggling'),
        li('Use TypeScript for type-safe style generation'),
        li('Clear unused styles with css.clear() when rebuilding')
      ),

      h2('Complete Example'),
      h3('Component Library'),
      p('Here\'s a complete example of a styled component library:'),
      pre(code(...codeBlock(`import { CreateStyle } from 'elit';

// Create stylesheet
const css = new CreateStyle();

// Theme variables
const primary = css.addVar('primary', '#3b82f6');
const spacing = css.addVar('spacing', '1rem');
const radius = css.addVar('radius', '8px');

// Reset
css.layer('reset', {
  '*': { margin: 0, padding: 0, boxSizing: 'border-box' }
});

// Base styles
css.layer('base', {
  'body': {
    fontFamily: 'system-ui, sans-serif',
    lineHeight: 1.6
  }
});

// Components
css.layer('components', {
  '.button': {
    padding: spacing,
    backgroundColor: primary,
    color: '#ffffff',
    border: 'none',
    borderRadius: radius,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  '.card': {
    padding: spacing,
    borderRadius: radius,
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  }
});

// Hover effects
css.addPseudoClass('hover', {
  backgroundColor: '#2563eb',
  transform: 'translateY(-2px)'
}, '.button');

// Animations
css.keyframeFromTo('fadeIn',
  { opacity: 0, transform: 'translateY(10px)' },
  { opacity: 1, transform: 'translateY(0)' }
);

css.addClass('fade-in', {
  animation: 'fadeIn 0.3s ease-out'
});

// Responsive
css.mediaMinWidth('768px', {
  '.container': { maxWidth: '768px' },
  '.grid': { gridTemplateColumns: 'repeat(2, 1fr)' }
});

// Dark mode
css.mediaDark({
  '.card': {
    backgroundColor: '#1f2937',
    color: '#f9fafb'
  }
});

// Inject into document
css.inject('component-library');`))),

      h2('API Reference'),
      h3('Main Methods'),
      pre(code(...codeBlock(`// Variables
addVar(name: string, value: string): CSSVariable
var(variable: CSSVariable | string, fallback?: string): string

// Selectors
addTag(tag: string, styles: Record<string, string | number>): CSSRule
addClass(name: string, styles: Record<string, string | number>): CSSRule
addId(name: string, styles: Record<string, string | number>): CSSRule
addPseudoClass(pseudo: string, styles, baseSelector?: string): CSSRule
addPseudoElement(pseudo: string, styles, baseSelector?: string): CSSRule
addAttribute(attr: string, styles, baseSelector?: string): CSSRule

// Combinators
descendant(ancestor: string, descendant: string, styles): CSSRule
child(parent: string, child: string, styles): CSSRule
adjacentSibling(element: string, sibling: string, styles): CSSRule
generalSibling(element: string, sibling: string, styles): CSSRule

// Media Queries
mediaMinWidth(minWidth: string, rules): MediaRule
mediaMaxWidth(maxWidth: string, rules): MediaRule
mediaDark(rules): MediaRule
mediaLight(rules): MediaRule
mediaReducedMotion(rules): MediaRule

// Animations
keyframe(name: string, steps): Keyframes
keyframeFromTo(name: string, from, to): Keyframes

// Modern CSS
container(condition: string, rules, name?: string): ContainerRule
supports(condition: string, rules): SupportsRule
layer(name: string, rules): LayerRule
layerOrder(...layers: string[]): void

// Output
render(): string
inject(styleId?: string): HTMLStyleElement
clear(): void`))),

      h2('Conclusion'),
      p('CreateStyle provides a powerful, type-safe way to generate CSS in Elit applications. With support for modern CSS features like container queries, cascade layers, and CSS variables, you can build maintainable, scalable stylesheets programmatically while leveraging TypeScript\'s type system for safety.'),
      p('Key takeaways: Use CSS variables for theming, cascade layers for specificity control, container queries for component responsiveness, and programmatic generation for utility classes. CreateStyle makes CSS-in-JS simple, powerful, and zero-dependency.')
    ),
    th: div(
      p('เชี่ยวชาญระบบ CSS-in-JS CreateStyle ของ Elit คู่มือฉบับสมบูรณ์นี้ครอบคลุม CSS variables, selectors, pseudo-classes, media queries, animations, container queries, cascade layers และรูปแบบขั้นสูงสำหรับสร้าง stylesheets ที่ maintainable และ type-safe แบบ programmatic'),

      h2('CreateStyle คืออะไร?'),
      p('CreateStyle เป็นโซลูชัน CSS-in-JS ที่มีมาในตัวของ Elit ที่ให้วิธีการสร้าง CSS แบบ programmatic และ type-safe รองรับฟีเจอร์ CSS ทันสมัยรวมถึง custom properties, cascade layers, container queries และ supports queries - ทั้งหมดไม่มี dependencies'),
      ul(
        li('การสร้าง CSS แบบ type-safe ด้วย TypeScript'),
        li('CSS Variables (Custom Properties)'),
        li('Selector ทุกประเภท (tag, class, ID, pseudo, attribute, combinators)'),
        li('Media queries พร้อม helper methods'),
        li('Keyframe animations'),
        li('Font-face declarations'),
        li('Container queries'),
        li('Supports queries'),
        li('Cascade layers'),
        li('Nesting support (BEM-style)'),
        li('Programmatic CSS generation')
      ),

      h2('การตั้งค่าพื้นฐาน'),
      h3('สร้าง Stylesheet'),
      p('เริ่มต้นด้วยการสร้าง CreateStyle instance:'),
      pre(code(...codeBlock(`import { CreateStyle } from 'elit';

// สร้าง stylesheet ใหม่
const css = new CreateStyle();

// เพิ่ม styles
css.addClass('container', {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '20px'
});

css.addClass('button', {
  padding: '10px 20px',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer'
});

// Inject เข้าไปใน document
css.inject('my-styles');

// หรือรับ CSS string
const cssString = css.render();
console.log(cssString);`))),

      h2('CSS Variables'),
      h3('การกำหนดและใช้ Variables'),
      p('สร้าง CSS custom properties ที่ใช้ซ้ำได้:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// กำหนด CSS variables
const primaryColor = css.addVar('primary-color', '#3b82f6');
const secondaryColor = css.addVar('secondary-color', '#10b981');
const spacing = css.addVar('spacing', '1rem');
const borderRadius = css.addVar('border-radius', '8px');

// ใช้ variables ใน styles
css.addClass('button', {
  backgroundColor: primaryColor,  // ใช้ var(--primary-color)
  padding: css.var(spacing),      // ใช้ var(--spacing)
  borderRadius: css.var(borderRadius)
});

// ใช้พร้อม fallback
css.addClass('card', {
  backgroundColor: css.var(primaryColor, '#ffffff')
});`))),

      h2('Selectors'),
      h3('Basic Selectors'),
      p('CreateStyle รองรับ CSS selector ทุกประเภท:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Tag selector
css.addTag('body', {
  margin: 0,
  fontFamily: 'system-ui, sans-serif',
  lineHeight: 1.6
});

// Class selector
css.addClass('container', {
  maxWidth: '1200px',
  margin: '0 auto'
});

// ID selector
css.addId('header', {
  position: 'sticky',
  top: 0,
  zIndex: 100
});

// Multiple selectors
css.multiple(['.button', '.link'], {
  cursor: 'pointer',
  transition: 'all 0.3s ease'
});`))),

      h3('Pseudo-Classes และ Pseudo-Elements'),
      p('เพิ่ม hover effects, focus states และ pseudo-elements:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Pseudo-class พร้อม base selector
css.addPseudoClass('hover', {
  backgroundColor: '#2563eb',
  transform: 'scale(1.05)'
}, '.button');

css.addPseudoClass('focus', {
  outline: '2px solid #3b82f6',
  outlineOffset: '2px'
}, '.button');

// Pseudo-elements
css.addPseudoElement('before', {
  content: '""',
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
  opacity: 0,
  transition: 'opacity 0.3s ease'
}, '.card');`))),

      h2('Media Queries'),
      h3('Responsive Design'),
      p('สร้าง responsive styles ด้วย media queries:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Min-width breakpoint
css.mediaMinWidth('768px', {
  '.container': {
    padding: '40px'
  },
  '.grid': {
    gridTemplateColumns: 'repeat(2, 1fr)'
  }
});

// Max-width breakpoint
css.mediaMaxWidth('640px', {
  '.sidebar': {
    display: 'none'
  },
  '.mobile-menu': {
    display: 'block'
  }
});`))),

      h3('Dark Mode'),
      p('รองรับ dark mode ด้วย prefers-color-scheme:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// Light mode (default)
css.addClass('card', {
  backgroundColor: '#ffffff',
  color: '#111827',
  border: '1px solid #e5e7eb'
});

// Dark mode
css.mediaDark({
  '.card': {
    backgroundColor: '#1f2937',
    color: '#f9fafb',
    border: '1px solid #374151'
  },
  'body': {
    backgroundColor: '#111827',
    color: '#f9fafb'
  }
});`))),

      h2('Animations'),
      h3('Keyframe Animations'),
      p('สร้าง animations ที่ลื่นไหลด้วย @keyframes:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// กำหนด keyframes
css.keyframe('fadeIn', {
  from: { opacity: 0 },
  to: { opacity: 1 }
});

css.keyframe('slideUp', {
  0: { transform: 'translateY(20px)', opacity: 0 },
  100: { transform: 'translateY(0)', opacity: 1 }
});

// ใช้ animations
css.addClass('fade-in', {
  animation: 'fadeIn 0.3s ease-in'
});

css.addClass('slide-up', {
  animation: 'slideUp 0.5s ease-out'
});`))),

      h2('Container Queries'),
      h3('Component-Based Responsive Design'),
      p('ใช้ container queries สำหรับ responsive components:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// กำหนด container
css.addContainer('card-container', {
  containerType: 'inline-size'
});

// Container query
css.container('min-width: 400px', {
  '.card-title': {
    fontSize: '1.5rem'
  },
  '.card-image': {
    float: 'left',
    width: '200px',
    marginRight: '1rem'
  }
}, 'card-container');`))),

      h2('Cascade Layers'),
      h3('Layer Management'),
      p('ควบคุม CSS specificity ด้วย @layer:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// กำหนดลำดับ layer
css.layerOrder('reset', 'base', 'components', 'utilities');

// Reset layer
css.layer('reset', {
  '*': {
    margin: 0,
    padding: 0,
    boxSizing: 'border-box'
  }
});

// Components layer
css.layer('components', {
  '.button': {
    padding: '8px 16px',
    borderRadius: '4px'
  }
});

// Utilities layer (ลำดับสูงสุด)
css.layer('utilities', {
  '.hidden': {
    display: 'none'
  }
});`))),

      h2('รูปแบบขั้นสูง'),
      h3('Theme System'),
      p('สร้าง theme system แบบสมบูรณ์ด้วย CSS variables:'),
      pre(code(...codeBlock(`const css = new CreateStyle();

// กำหนด theme variables
const theme = {
  colors: {
    primary: css.addVar('color-primary', '#3b82f6'),
    secondary: css.addVar('color-secondary', '#10b981'),
    text: css.addVar('color-text', '#111827'),
    background: css.addVar('color-background', '#ffffff')
  },
  spacing: {
    sm: css.addVar('spacing-sm', '0.5rem'),
    md: css.addVar('spacing-md', '1rem'),
    lg: css.addVar('spacing-lg', '1.5rem')
  }
};

// ใช้ theme
css.addTag('body', {
  color: theme.colors.text,
  backgroundColor: theme.colors.background
});`))),

      h2('Best Practices'),
      ul(
        li('ใช้ CSS variables สำหรับ theme values และค่าที่ใช้ซ้ำ'),
        li('จัดระเบียบ styles ด้วย cascade layers เพื่อ specificity ที่คาดเดาได้'),
        li('ใช้ container queries สำหรับ component-based responsive design'),
        li('ใช้ @supports สำหรับ progressive enhancement'),
        li('เก็บ selectors ให้เรียบง่ายและหลีกเลี่ยง deep nesting'),
        li('สร้าง utility classes แบบ programmatic เพื่อความสอดคล้อง'),
        li('ใช้ media queries สำหรับ layout, container queries สำหรับ components'),
        li('ทำ dark mode ด้วย CSS variables เพื่อ toggle ง่าย'),
        li('ใช้ TypeScript สำหรับ type-safe style generation'),
        li('Clear styles ที่ไม่ใช้ด้วย css.clear() เมื่อ rebuild')
      ),

      h2('สรุป'),
      p('CreateStyle ให้วิธีการที่ทรงพลังและ type-safe ในการสร้าง CSS ในแอปพลิเคชัน Elit ด้วยการรองรับฟีเจอร์ CSS ทันสมัยอย่าง container queries, cascade layers และ CSS variables คุณสามารถสร้าง stylesheets ที่ maintainable และ scalable แบบ programmatic พร้อมใช้ประโยชน์จาก type system ของ TypeScript เพื่อความปลอดภัย'),
      p('สรุปสำคัญ: ใช้ CSS variables สำหรับ theming, cascade layers สำหรับควบคุม specificity, container queries สำหรับ component responsiveness และ programmatic generation สำหรับ utility classes CreateStyle ทำให้ CSS-in-JS เรียบง่าย ทรงพลัง และไม่มี dependency')
    )
  }
};
