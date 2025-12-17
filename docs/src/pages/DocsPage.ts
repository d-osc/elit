import {
  div, h2, h3, h4, p, a, nav, section, ul, li, pre, code, reactive
} from 'elit';
import { codeBlock } from '../highlight';
import { t, currentLang } from '../i18n';

// Helper for highlighted code blocks
const codeExample = (src: string) => pre(code(...codeBlock(src)));

const Docs = () =>
  section({ className: 'docs-section container' },
    reactive(currentLang, () => h2({ className: 'section-title' }, t('docs.title'))),
    div({ className: 'docs-grid' },
      reactive(currentLang, () =>
        nav({ className: 'docs-sidebar' },
          div({ className: 'docs-nav' },
            a({ href: 'javascript:void(0)', onclick: () => document.getElementById('installation')?.scrollIntoView({ behavior: 'smooth' }) }, t('docs.installation')),
            a({ href: 'javascript:void(0)', onclick: () => document.getElementById('elements')?.scrollIntoView({ behavior: 'smooth' }) }, t('docs.elements')),
            a({ href: 'javascript:void(0)', onclick: () => document.getElementById('state')?.scrollIntoView({ behavior: 'smooth' }) }, t('docs.state')),
            a({ href: 'javascript:void(0)', onclick: () => document.getElementById('reactive')?.scrollIntoView({ behavior: 'smooth' }) }, t('docs.reactive')),
            a({ href: 'javascript:void(0)', onclick: () => document.getElementById('createstyle')?.scrollIntoView({ behavior: 'smooth' }) }, t('docs.createstyle')),
            a({ href: 'javascript:void(0)', onclick: () => document.getElementById('ssr')?.scrollIntoView({ behavior: 'smooth' }) }, t('docs.ssr')),
            a({ href: 'javascript:void(0)', onclick: () => document.getElementById('routing')?.scrollIntoView({ behavior: 'smooth' }) }, t('docs.routing')),
            a({ href: 'javascript:void(0)', onclick: () => document.getElementById('performance')?.scrollIntoView({ behavior: 'smooth' }) }, t('docs.performance'))
          )
        )
      ),
      reactive(currentLang, () =>
        div({ className: 'docs-content' },
          h2({ id: 'installation' }, t('docs.installation')),
          p(t('docs.installNpm')),
          codeExample('npm install elit'),

          h3('Bundle Size'),
          p('Elit is extremely lightweight - only 30KB minified (~10KB gzipped)'),
          ul(
            li('ESM: 29KB minified'),
            li('CJS: 30KB minified'),
            li('IIFE: 30KB minified'),
            li('Tree-shakeable: Import only what you need')
          ),

          p(t('docs.installCdn')),
          codeExample(`<script src="https://unpkg.com/elit@latest/dist/index.global.js"></script>`),

          h2({ id: 'elements' }, t('docs.elements')),
          p(t('docs.elements.desc')),
          codeExample(`import { div, span, a, button, h1 } from 'elit';

const element = div({ className: 'container' },
  h1('Hello World'),
  span('Welcome to Elit'),
  a({ href: '/about' }, 'Learn more')
);`),
          p(t('docs.elements.available')),

          h2({ id: 'state' }, t('docs.state')),
          p(t('docs.state.desc')),
          codeExample(`import { createState, computed } from 'elit';

const count = createState(0);
const doubled = computed([count], (c) => c * 2);

// Update state
count.value++;

// Subscribe to changes
count.subscribe((value) => console.log('Count:', value));`),

          h3(t('docs.stateOptions')),
          ul(
            li(code('throttle'), ' - Throttle updates (ms)'),
            li(code('deep'), ' - Deep comparison for objects')
          ),

          h2({ id: 'reactive' }, t('docs.reactive')),
          p(t('docs.reactive.desc')),
          codeExample(`import { reactive, text } from 'elit';

const name = createState('World');

// Full element reactive
const greeting = reactive(name, (value) =>
  div({ className: 'greeting' }, \`Hello, \${value}!\`)
);

// Text-only reactive
const label = text(name);`),

          h2({ id: 'createstyle' }, t('docs.createstyle')),
          p(t('docs.createstyle.desc')),

          h3('Basic Usage'),
          codeExample(`import { CreateStyle } from 'elit';

const styles = new CreateStyle();

// CSS Variables
const primary = styles.addVar('primary', '#6366f1');

// Tag selectors
styles.addTag('body', {
  fontFamily: 'system-ui',
  background: styles.var(primary)
});

// Class selectors
styles.addClass('container', {
  maxWidth: '1200px',
  margin: '0 auto'
});

// ID selectors
styles.addId('header', { position: 'fixed' });

// Inject into document
styles.inject();`),

          h3('Pseudo Selectors'),
          codeExample(`// Pseudo-classes
styles.addPseudoClass('hover', { color: 'blue' }, '.btn');
styles.addPseudoClass('nth-child(2)', { background: 'gray' }, 'li');

// Pseudo-elements
styles.addPseudoElement('before', { content: '"→"' }, '.link');
styles.addPseudoElement('placeholder', { color: 'gray' }, 'input');`),

          h3('Attribute Selectors'),
          codeExample(`// Basic attribute
styles.addAttribute('disabled', { opacity: 0.5 }, 'button');

// Attribute equals
styles.attrEquals('type', 'text', { border: '1px solid gray' }, 'input');

// Attribute contains, starts/ends with
styles.attrContains('href', 'example', { color: 'green' }, 'a');
styles.attrStartsWith('href', 'https', { fontWeight: 'bold' }, 'a');`),

          h3('Combinators'),
          codeExample(`// Descendant: .parent .child
styles.descendant('.parent', '.child', { color: 'red' });

// Child: .parent > .child
styles.child('.parent', '.child', { margin: 0 });

// Adjacent sibling: h1 + p
styles.adjacentSibling('h1', 'p', { marginTop: '0.5rem' });

// General sibling: h1 ~ p
styles.generalSibling('h1', 'p', { color: 'gray' });

// Multiple selectors: h1, h2, h3
styles.multiple(['h1', 'h2', 'h3'], { fontWeight: 'bold' });`),

          h3('Media Queries'),
          codeExample(`// Basic media query
styles.media('screen', 'min-width: 768px', {
  '.container': { maxWidth: '720px' }
});

// Shorthand methods
styles.mediaMinWidth('1024px', { '.sidebar': { display: 'block' } });
styles.mediaMaxWidth('768px', { '.nav': { display: 'none' } });
styles.mediaPrint({ '.no-print': { display: 'none' } });
styles.mediaDark({ ':root': { background: '#000' } });
styles.mediaReducedMotion({ '*': { animation: 'none' } });`),

          h3('Keyframes & Animations'),
          codeExample(`// Full keyframes
styles.keyframe('fadeIn', {
  from: { opacity: 0 },
  50: { opacity: 0.5 },
  to: { opacity: 1 }
});

// Simple from/to
styles.keyframeFromTo('slideIn',
  { transform: 'translateX(-100%)' },
  { transform: 'translateX(0)' }
);`),

          h3('Advanced Features'),
          h4('@font-face'),
          codeExample(`styles.fontFace({
  fontFamily: 'MyFont',
  src: "url('/fonts/myfont.woff2') format('woff2')",
  fontWeight: 400,
  fontDisplay: 'swap'
});`),

          h4('@container queries'),
          codeExample(`styles.addContainer('card', { containerType: 'inline-size' });
styles.container('min-width: 400px', {
  '.card-content': { display: 'grid' }
}, 'card');`),

          h4('@supports'),
          codeExample(`styles.supports('display: grid', {
  '.layout': { display: 'grid' }
});`),

          h4('@layer'),
          codeExample(`styles.layerOrder('reset', 'base', 'components');
styles.layer('base', {
  'body': { margin: 0 }
});`),

          h4('@import'),
          codeExample(`styles.import('https://fonts.googleapis.com/css2?family=Inter');
styles.import('/print.css', 'print');`),

          h3('Render & Inject'),
          codeExample(`// Get CSS string
const cssString = styles.render();

// Inject into document with optional ID
styles.inject('my-styles');

// Clear all rules
styles.clear();`),

          h2({ id: 'ssr' }, t('docs.ssr')),
          p(t('docs.ssr.desc')),
          codeExample(`import { div, p, renderToString } from 'elit';

const html = renderToString(
  div({ className: 'app' },
    p('Server rendered content')
  ),
  { pretty: true }
);`),

          h2({ id: 'routing' }, t('docs.routing')),
          p(t('docs.routing.desc')),
          codeExample(`import { createRouter, routerLink } from 'elit';

const router = createRouter({
  mode: 'history',
  routes: [
    { path: '/', component: () => div('Home') },
    { path: '/about', component: () => div('About') },
    { path: '/user/:id', component: ({ id }) => div(\`User \${id}\`) }
  ]
});

// Navigate
router.push('/about');

// Create links
routerLink(router, { to: '/about' }, 'About');`),

          h2({ id: 'performance' }, t('docs.performance')),
          p(t('docs.performance.desc')),
          codeExample(`import { batchRender, renderChunked, createVirtualList, throttle, debounce } from 'elit';

// Batch render
batchRender('#container', largeArray);

// Chunked rendering for 1M+ items
renderChunked('#container', items, 5000, (current, total) => {
  console.log(\`\${current}/\${total}\`);
});

// Virtual scrolling
const list = createVirtualList(container, items, renderItem, 50);

// Throttle/debounce
const throttled = throttle(fn, 100);
const debounced = debounce(fn, 300);`),

          h3('DOM Utilities'),
          p('Elit provides convenient helper functions for common DOM operations:'),
          codeExample(`import { doc, el, els, createEl, elId, elClass, fragment } from 'elit';

// Query selectors (bound to document)
const element = el('.my-class');        // querySelector
const elements = els('.my-class');      // querySelectorAll
const byId = elId('my-id');            // getElementById
const byClass = elClass('my-class');   // getElementsByClassName

// Create elements
const div = createEl('div');           // createElement
const frag = fragment();               // createDocumentFragment

// Access document
doc.title = 'New Title';`),

          h3('Performance Optimizations'),
          p('Elit is built with performance in mind:'),
          ul(
            li('Direct DOM manipulation - no virtual DOM overhead'),
            li('Optimized rendering with RAF batching'),
            li('Smart children rendering with automatic fragment usage'),
            li('Efficient attribute updates using charCode checks'),
            li('Minimal function closures and memory allocation'),
            li('Tree-shakeable ES modules for optimal bundle size')
          )
        )
      )
    )
  );

export const DocsPage = () =>
  section({ style: 'padding-top: 5rem;' },
    Docs()
  );
