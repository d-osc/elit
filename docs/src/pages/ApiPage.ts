import { div, h2, h3, h4, p, section, code, span, pre, ul, li, table, thead, tbody, tr, th, td, a } from 'elit';
import { codeBlock } from '../highlight';

// ============================================
// API Data with Detailed Descriptions
// ============================================

type ApiItem = {
  name: string;
  badge: string;
  sig: string;
  desc: string;
  details?: string;
  params?: { name: string; type: string; desc: string }[];
  returns?: string;
  example?: string;
};

const apiData: Record<string, ApiItem[]> = {
  core: [
    {
      name: 'DomNode',
      badge: 'class',
      sig: 'class DomNode',
      desc: 'คลาสหลักสำหรับจัดการ DOM และการ render',
      details: 'DomNode เป็นคลาสหลักที่รับผิดชอบในการแปลง Virtual DOM (VNode) เป็น DOM จริง รองรับทั้ง HTML, SVG และ MathML elements พร้อมระบบ reactive updates',
      example: `import { DomNode } from 'elit';

const dom = new DomNode();
dom.render('#app', div('Hello World'));`
    },
    {
      name: 'domNode',
      badge: 'instance',
      sig: 'const domNode: DomNode',
      desc: 'Instance เริ่มต้นของ DomNode พร้อมใช้งาน',
      details: 'เป็น singleton instance ที่สร้างไว้ให้แล้ว ไม่จำเป็นต้องสร้างใหม่ เหมาะสำหรับการใช้งานทั่วไป',
      example: `import { domNode, div } from 'elit';

domNode.render('#app', div('Hello'));`
    },
    {
      name: 'render',
      badge: 'method',
      sig: 'domNode.render(rootElement: string | HTMLElement, vNode: VNode): HTMLElement',
      desc: 'Render VNode ไปยัง DOM element ที่กำหนด',
      details: 'ฟังก์ชันหลักสำหรับ render application ลงใน DOM รองรับทั้ง CSS selector string และ HTMLElement โดยตรง จะล้างเนื้อหาเดิมและแทนที่ด้วย VNode ใหม่',
      params: [
        { name: 'rootElement', type: 'string | HTMLElement', desc: 'CSS selector หรือ DOM element ที่จะ render ลงไป' },
        { name: 'vNode', type: 'VNode', desc: 'Virtual DOM node ที่จะแสดงผล' }
      ],
      returns: 'HTMLElement ที่ถูก render',
      example: `domNode.render('#app',
  div({ className: 'container' },
    h1('Welcome'),
    p('Hello World')
  )
);`
    },
    {
      name: 'renderToDOM',
      badge: 'method',
      sig: 'domNode.renderToDOM(vNode: Child, parent: HTMLElement | SVGElement | DocumentFragment): void',
      desc: 'Render VNode เข้าไปใน parent element โดยไม่ล้างเนื้อหาเดิม',
      details: 'ใช้สำหรับ append VNode เข้าไปใน element ที่มีอยู่แล้ว ไม่ลบเนื้อหาเดิม เหมาะสำหรับการเพิ่ม element แบบ dynamic',
      params: [
        { name: 'vNode', type: 'Child', desc: 'Virtual DOM node ที่จะเพิ่ม' },
        { name: 'parent', type: 'HTMLElement | SVGElement | DocumentFragment', desc: 'Element ที่จะเพิ่ม VNode เข้าไป' }
      ],
      example: `const container = document.getElementById('list');
domNode.renderToDOM(li('New Item'), container);`
    },
    {
      name: 'renderToString',
      badge: 'function',
      sig: 'renderToString(vNode: Child, options?: { pretty?: boolean }): string',
      desc: 'แปลง VNode เป็น HTML string สำหรับ Server-Side Rendering (SSR)',
      details: 'ใช้สำหรับ render HTML บน server ก่อนส่งไป client รองรับ pretty print สำหรับ debug และอ่านง่าย',
      params: [
        { name: 'vNode', type: 'Child', desc: 'Virtual DOM node ที่จะแปลง' },
        { name: 'options.pretty', type: 'boolean', desc: 'จัด format ให้อ่านง่าย (default: false)' }
      ],
      returns: 'HTML string',
      example: `const html = renderToString(
  div({ className: 'app' },
    h1('Title'),
    p('Content')
  ),
  { pretty: true }
);
// Output:
// <div class="app">
//   <h1>Title</h1>
//   <p>Content</p>
// </div>`
    }
  ],

  elements: [
    {
      name: 'createElementFactory',
      badge: 'function',
      sig: 'createElementFactory(tag: string): ElementFactory',
      desc: 'สร้าง factory function สำหรับ custom element',
      details: 'ใช้สร้าง element factory สำหรับ custom HTML elements หรือ Web Components ที่ไม่มีใน built-in',
      params: [
        { name: 'tag', type: 'string', desc: 'ชื่อ tag ของ element' }
      ],
      returns: 'ElementFactory function',
      example: `const myComponent = createElementFactory('my-component');
const customEl = createElementFactory('custom-element');

const app = div(
  myComponent({ prop: 'value' }, 'Content'),
  customEl({ id: 'custom' })
);`
    },
    {
      name: 'HTML Elements',
      badge: 'function',
      sig: 'div(props?, ...children): VNode',
      desc: 'Factory functions สำหรับ HTML elements ทั้งหมด',
      details: `รองรับ HTML elements มาตรฐานทั้งหมด:
• Layout: div, span, section, article, aside, header, footer, main, nav
• Text: p, h1-h6, a, strong, em, small, mark, del, ins, sub, sup
• Lists: ul, ol, li, dl, dt, dd
• Forms: form, input, textarea, select, option, button, label, fieldset, legend
• Tables: table, thead, tbody, tfoot, tr, th, td, caption, colgroup, col
• Media: img, video, audio, source, picture, figure, figcaption, canvas
• Others: br, hr, pre, code, blockquote, iframe, embed, object`,
      example: `// ใช้ props object เป็น argument แรก
div({ className: 'container', id: 'main' },
  h1('Title'),
  p({ style: 'color: red;' }, 'Styled text')
);

// หรือไม่ใส่ props ก็ได้
div(
  p('Simple paragraph'),
  span('Inline text')
);`
    },
    {
      name: 'SVG Elements',
      badge: 'function',
      sig: 'svgSvg(props?, ...children): VNode',
      desc: 'Factory functions สำหรับ SVG elements',
      details: `รองรับ SVG elements มาตรฐาน:
• Container: svgSvg, svgG, svgDefs, svgSymbol, svgUse
• Shapes: svgRect, svgCircle, svgEllipse, svgLine, svgPolyline, svgPolygon, svgPath
• Text: svgText, svgTspan, svgTextPath
• Gradients: svgLinearGradient, svgRadialGradient, svgStop
• Filters: svgFilter, svgFeGaussianBlur, svgFeOffset, etc.
• Others: svgClipPath, svgMask, svgPattern, svgImage, svgForeignObject`,
      example: `svgSvg({ width: 100, height: 100, viewBox: '0 0 100 100' },
  svgCircle({ cx: 50, cy: 50, r: 40, fill: '#6366f1' }),
  svgRect({ x: 10, y: 10, width: 30, height: 30, fill: '#22c55e' }),
  svgPath({ d: 'M10 80 L50 20 L90 80 Z', fill: '#f59e0b' })
);`
    },
    {
      name: 'MathML Elements',
      badge: 'function',
      sig: 'mathMath(props?, ...children): VNode',
      desc: 'Factory functions สำหรับ MathML elements',
      details: `รองรับ MathML elements สำหรับแสดงสูตรคณิตศาสตร์:
• mathMath: root element
• mathMi: identifier (ตัวแปร)
• mathMn: number
• mathMo: operator
• mathMfrac: fraction
• mathMsqrt, mathMroot: square root, nth root
• mathMsup, mathMsub, mathMsubsup: superscript, subscript
• mathMrow: group elements`,
      example: `// แสดงสูตร: x = (-b ± √(b²-4ac)) / 2a
mathMath(
  mathMfrac(
    mathMrow(
      mathMo('-'), mathMi('b'), mathMo('±'),
      mathMsqrt(
        mathMrow(mathMsup(mathMi('b'), mathMn('2')),
        mathMo('-'), mathMn('4'), mathMi('a'), mathMi('c'))
      )
    ),
    mathMrow(mathMn('2'), mathMi('a'))
  )
);`
    }
  ],

  state: [
    {
      name: 'createState',
      badge: 'function',
      sig: 'createState<T>(initial: T, options?: StateOptions): State<T>',
      desc: 'สร้าง reactive state object',
      details: `createState เป็นหัวใจของระบบ reactivity ใน Elit:
• เมื่อ value เปลี่ยน จะ trigger re-render อัตโนมัติ
• รองรับ primitive types และ objects/arrays
• มี subscription system สำหรับ side effects
• รองรับ throttling เพื่อ optimize performance
• รองรับ deep comparison สำหรับ objects`,
      params: [
        { name: 'initial', type: 'T', desc: 'ค่าเริ่มต้นของ state' },
        { name: 'options.throttle', type: 'number', desc: 'Throttle updates (milliseconds)' },
        { name: 'options.deep', type: 'boolean', desc: 'ใช้ deep comparison สำหรับ objects' }
      ],
      returns: 'State<T> object',
      example: `// Basic usage
const count = createState(0);
count.value++; // trigger update

// With options
const search = createState('', { throttle: 300 });

// Object state
const user = createState({ name: 'John', age: 25 });
user.value = { ...user.value, age: 26 };

// Array state
const items = createState(['a', 'b', 'c']);
items.value = [...items.value, 'd'];`
    },
    {
      name: 'computed',
      badge: 'function',
      sig: 'computed<T[], R>(states: State<T>[], fn: (...values: T) => R): State<R>',
      desc: 'สร้าง computed state จากหลาย states',
      details: `computed สร้าง derived state ที่:
• อัพเดทอัตโนมัติเมื่อ dependencies เปลี่ยน
• Cache ค่าเพื่อ avoid recalculation
• รองรับหลาย dependencies
• เป็น read-only state`,
      params: [
        { name: 'states', type: 'State<T>[]', desc: 'Array ของ states ที่เป็น dependencies' },
        { name: 'fn', type: 'function', desc: 'Function คำนวณค่าใหม่จาก dependencies' }
      ],
      returns: 'State<R> (read-only)',
      example: `const price = createState(100);
const quantity = createState(2);
const taxRate = createState(0.07);

// Computed total
const subtotal = computed([price, quantity],
  (p, q) => p * q
);

const total = computed([subtotal, taxRate],
  (sub, tax) => sub * (1 + tax)
);

// total.value = 214 (100 * 2 * 1.07)`
    },
    {
      name: 'effect',
      badge: 'function',
      sig: 'effect(fn: () => void): void',
      desc: 'รัน side effect function',
      details: 'ใช้สำหรับ side effects ที่ต้องรันเมื่อ component mount เช่น setup event listeners, fetch data, etc.',
      params: [
        { name: 'fn', type: '() => void', desc: 'Function ที่จะรัน' }
      ],
      example: `effect(() => {
  console.log('Component mounted');

  // Setup event listener
  window.addEventListener('resize', handleResize);

  // Cleanup (optional)
  return () => {
    window.removeEventListener('resize', handleResize);
  };
});`
    },
    {
      name: 'State<T>',
      badge: 'interface',
      sig: 'interface State<T>',
      desc: 'Interface ของ reactive state object',
      details: `State object มี properties และ methods:
• value: T - ค่าปัจจุบัน (get/set)
• subscribe(fn): () => void - ลงทะเบียนรับ updates
• destroy(): void - ยกเลิก subscriptions ทั้งหมด`,
      example: `const count = createState(0);

// Get value
console.log(count.value); // 0

// Set value
count.value = 5;

// Subscribe to changes
const unsubscribe = count.subscribe((newValue) => {
  console.log('Count changed:', newValue);
});

// Cleanup
unsubscribe();
// or
count.destroy();`
    }
  ],

  reactive: [
    {
      name: 'reactive',
      badge: 'function',
      sig: 'reactive<T>(state: State<T>, renderFn: (value: T) => VNode | Child): VNode',
      desc: 'สร้าง reactive element ที่อัพเดทเมื่อ state เปลี่ยน',
      details: `reactive เป็นตัวเชื่อมระหว่าง state และ UI:
• รับ state และ render function
• Re-render เฉพาะส่วนที่เปลี่ยน (fine-grained updates)
• ไม่ re-render parent elements
• Cleanup subscriptions อัตโนมัติ`,
      params: [
        { name: 'state', type: 'State<T>', desc: 'State ที่จะ track' },
        { name: 'renderFn', type: '(value: T) => VNode', desc: 'Function render UI จาก state value' }
      ],
      returns: 'VNode ที่จะอัพเดทอัตโนมัติ',
      example: `const count = createState(0);

const Counter = () => div(
  h2('Counter'),
  reactive(count, (value) =>
    div({ className: 'counter-display' },
      span(\`Count: \${value}\`),
      button({ onclick: () => count.value++ }, '+'),
      button({ onclick: () => count.value-- }, '-')
    )
  )
);`
    },
    {
      name: 'reactiveAs',
      badge: 'function',
      sig: 'reactiveAs<T>(tagName: string, state: State<T>, renderFn, props?): VNode',
      desc: 'สร้าง reactive element พร้อมกำหนด wrapper tag',
      details: 'เหมือน reactive() แต่สามารถกำหนด wrapper element tag ได้ เช่น ต้องการให้ wrapper เป็น span แทน div',
      params: [
        { name: 'tagName', type: 'string', desc: 'Tag name ของ wrapper element' },
        { name: 'state', type: 'State<T>', desc: 'State ที่จะ track' },
        { name: 'renderFn', type: 'function', desc: 'Render function' },
        { name: 'props', type: 'Props', desc: 'Props สำหรับ wrapper element (optional)' }
      ],
      example: `const text = createState('Hello');

// Wrapper เป็น span แทน div
const InlineText = reactiveAs('span', text,
  (value) => value.toUpperCase(),
  { className: 'highlight' }
);`
    },
    {
      name: 'text',
      badge: 'function',
      sig: 'text(state: State<any> | any): VNode | string',
      desc: 'สร้าง reactive text node',
      details: 'shorthand สำหรับแสดง text ที่ reactive กับ state เหมาะสำหรับแสดงค่าง่ายๆ โดยไม่ต้องเขียน render function',
      params: [
        { name: 'state', type: 'State<any> | any', desc: 'State หรือค่าคงที่' }
      ],
      example: `const name = createState('World');

const Greeting = () => p(
  'Hello, ',
  text(name),  // reactive text
  '!'
);

// เมื่อ name.value เปลี่ยน จะอัพเดทอัตโนมัติ`
    },
    {
      name: 'bindValue',
      badge: 'function',
      sig: 'bindValue<T>(state: State<T>): Props',
      desc: 'Two-way binding สำหรับ input value',
      details: `สร้าง props สำหรับ two-way binding กับ input:
• ตั้งค่า value จาก state
• อัพเดท state เมื่อ input เปลี่ยน
• รองรับ input, textarea, select`,
      params: [
        { name: 'state', type: 'State<T>', desc: 'State ที่จะ bind' }
      ],
      returns: 'Props object { value, oninput }',
      example: `const email = createState('');
const message = createState('');

const Form = () => form(
  input({
    type: 'email',
    placeholder: 'Email',
    ...bindValue(email)
  }),
  textarea({
    placeholder: 'Message',
    ...bindValue(message)
  }),
  select(
    { ...bindValue(category) },
    option({ value: 'a' }, 'Option A'),
    option({ value: 'b' }, 'Option B')
  )
);`
    },
    {
      name: 'bindChecked',
      badge: 'function',
      sig: 'bindChecked(state: State<boolean>): Props',
      desc: 'Two-way binding สำหรับ checkbox/radio',
      details: 'สร้าง props สำหรับ two-way binding กับ checkbox หรือ radio button',
      params: [
        { name: 'state', type: 'State<boolean>', desc: 'Boolean state ที่จะ bind' }
      ],
      returns: 'Props object { checked, onchange }',
      example: `const agreed = createState(false);
const darkMode = createState(true);

const Settings = () => div(
  label(
    input({ type: 'checkbox', ...bindChecked(agreed) }),
    ' I agree to terms'
  ),
  label(
    input({ type: 'checkbox', ...bindChecked(darkMode) }),
    ' Dark Mode'
  )
);`
    }
  ],

  styling: [
    {
      name: 'CreateStyle',
      badge: 'class',
      sig: 'class CreateStyle',
      desc: 'ระบบสร้าง CSS แบบ programmatic',
      details: `CreateStyle เป็น CSS-in-JS solution ที่:
• สร้าง CSS ด้วย JavaScript/TypeScript
• Type-safe CSS properties
• รองรับ CSS Variables
• รองรับ pseudo-classes/elements
• รองรับ media queries
• รองรับ keyframe animations
• รองรับ @font-face, @container, @supports, @layer`,
      example: `const styles = new CreateStyle();

// Variables
const primary = styles.addVar('primary', '#6366f1');

// Rules
styles.addTag('body', {
  fontFamily: 'system-ui',
  background: styles.var(primary)
});

styles.addClass('container', {
  maxWidth: '1200px',
  margin: '0 auto'
});

// Inject to document
styles.inject('my-styles');`
    },
    {
      name: 'addVar',
      badge: 'method',
      sig: 'styles.addVar(name: string, value: string): CSSVariable',
      desc: 'เพิ่ม CSS Variable',
      details: 'สร้าง CSS custom property (variable) ที่สามารถใช้ซ้ำได้ทั่ว stylesheet',
      params: [
        { name: 'name', type: 'string', desc: 'ชื่อ variable (ไม่ต้องใส่ --)' },
        { name: 'value', type: 'string', desc: 'ค่าของ variable' }
      ],
      returns: 'CSSVariable reference',
      example: `const primary = styles.addVar('primary', '#6366f1');
const secondary = styles.addVar('secondary', '#22c55e');
const spacing = styles.addVar('spacing', '1rem');

// ใช้กับ styles.var()
styles.addClass('btn', {
  background: styles.var(primary),
  padding: styles.var(spacing)
});`
    },
    {
      name: 'Selectors',
      badge: 'method',
      sig: 'addTag, addClass, addId, add',
      desc: 'Methods สำหรับเพิ่ม CSS selectors',
      details: `• addTag(tag, styles) - tag selector (div, p, etc.)
• addClass(name, styles) - class selector (.name)
• addId(name, styles) - ID selector (#name)
• add({ selector: styles }) - custom selector`,
      example: `// Tag selector
styles.addTag('body', { margin: 0 });

// Class selector
styles.addClass('container', { maxWidth: '1200px' });

// ID selector
styles.addId('header', { position: 'fixed' });

// Custom selector
styles.add({
  '.card:first-child': { marginTop: 0 },
  'input[type="text"]': { border: '1px solid gray' }
});`
    },
    {
      name: 'Pseudo Selectors',
      badge: 'method',
      sig: 'addPseudoClass, addPseudoElement',
      desc: 'เพิ่ม pseudo-class และ pseudo-element',
      details: `• addPseudoClass(name, styles, selector?) - :hover, :focus, :nth-child(), etc.
• addPseudoElement(name, styles, selector?) - ::before, ::after, ::placeholder, etc.`,
      example: `// Pseudo-classes
styles.addPseudoClass('hover', {
  background: '#4f46e5'
}, '.btn');

styles.addPseudoClass('focus', {
  outline: '2px solid blue'
}, 'input');

styles.addPseudoClass('nth-child(odd)', {
  background: '#f5f5f5'
}, 'tr');

// Pseudo-elements
styles.addPseudoElement('before', {
  content: '"→ "'
}, '.link');

styles.addPseudoElement('placeholder', {
  color: '#999'
}, 'input');`
    },
    {
      name: 'Combinators',
      badge: 'method',
      sig: 'descendant, child, adjacentSibling, generalSibling, multiple',
      desc: 'CSS combinators สำหรับ complex selectors',
      details: `• descendant(parent, child, styles) - parent child
• child(parent, child, styles) - parent > child
• adjacentSibling(el1, el2, styles) - el1 + el2
• generalSibling(el1, el2, styles) - el1 ~ el2
• multiple(selectors[], styles) - sel1, sel2, sel3`,
      example: `// Descendant: .nav a
styles.descendant('.nav', 'a', { color: 'white' });

// Child: .menu > li
styles.child('.menu', 'li', { display: 'inline-block' });

// Adjacent sibling: h1 + p
styles.adjacentSibling('h1', 'p', { marginTop: '0.5rem' });

// General sibling: h1 ~ p
styles.generalSibling('h1', 'p', { color: 'gray' });

// Multiple: h1, h2, h3
styles.multiple(['h1', 'h2', 'h3'], { fontWeight: 'bold' });`
    },
    {
      name: 'Media Queries',
      badge: 'method',
      sig: 'media, mediaMinWidth, mediaMaxWidth, mediaDark, mediaPrint',
      desc: 'เพิ่ม responsive media queries',
      details: `Shorthand methods สำหรับ common media queries:
• media(type, condition, rules) - custom media query
• mediaMinWidth(width, rules) - @media (min-width)
• mediaMaxWidth(width, rules) - @media (max-width)
• mediaDark(rules) - @media (prefers-color-scheme: dark)
• mediaPrint(rules) - @media print
• mediaReducedMotion(rules) - @media (prefers-reduced-motion)`,
      example: `// Responsive
styles.mediaMaxWidth('768px', {
  '.sidebar': { display: 'none' },
  '.container': { padding: '1rem' }
});

styles.mediaMinWidth('1024px', {
  '.container': { maxWidth: '960px' }
});

// Dark mode
styles.mediaDark({
  ':root': {
    '--bg': '#1a1a1a',
    '--text': '#fafafa'
  }
});

// Print
styles.mediaPrint({
  '.no-print': { display: 'none' }
});`
    },
    {
      name: 'Animations',
      badge: 'method',
      sig: 'keyframe, keyframeFromTo',
      desc: 'สร้าง CSS keyframe animations',
      details: `• keyframe(name, steps) - full keyframe control
• keyframeFromTo(name, from, to) - simple from/to animation`,
      example: `// Full keyframes
styles.keyframe('fadeIn', {
  '0%': { opacity: 0, transform: 'translateY(-10px)' },
  '50%': { opacity: 0.5 },
  '100%': { opacity: 1, transform: 'translateY(0)' }
});

// Simple from/to
styles.keyframeFromTo('slideIn',
  { transform: 'translateX(-100%)' },
  { transform: 'translateX(0)' }
);

// Use animation
styles.addClass('animate-in', {
  animation: 'fadeIn 0.3s ease-out'
});`
    },
    {
      name: 'inject & render',
      badge: 'method',
      sig: 'inject(id?), render()',
      desc: 'นำ CSS ไปใช้งาน',
      details: `• inject(styleId?) - inject <style> tag เข้า document
• render() - return CSS string (สำหรับ SSR)
• clear() - ล้าง rules ทั้งหมด`,
      example: `// Inject to document
styles.inject('my-styles');

// Get CSS string (for SSR)
const css = styles.render();
// "<style>...</style>"

// Clear all rules
styles.clear();`
    }
  ],

  routing: [
    {
      name: 'createRouter',
      badge: 'function',
      sig: 'createRouter(options: RouterOptions): Router',
      desc: 'สร้าง client-side router',
      details: `Router features:
• Hash mode (#/path) และ History mode (/path)
• Dynamic routes (:id params)
• Wildcard routes (*)
• Navigation guards (beforeEach, beforeEnter)
• Programmatic navigation
• Query string parsing`,
      params: [
        { name: 'mode', type: "'history' | 'hash'", desc: 'โหมด routing (default: hash)' },
        { name: 'routes', type: 'Route[]', desc: 'Array ของ route definitions' },
        { name: 'notFound', type: 'function', desc: '404 component (optional)' }
      ],
      returns: 'Router instance',
      example: `const router = createRouter({
  mode: 'hash',
  routes: [
    { path: '/', component: () => HomePage() },
    { path: '/about', component: () => AboutPage() },
    { path: '/user/:id', component: ({ id }) => UserPage(id) },
    { path: '/posts/*', component: () => PostsPage() }
  ],
  notFound: () => div('404 Not Found')
});`
    },
    {
      name: 'Router Methods',
      badge: 'interface',
      sig: 'push, replace, back, forward, go',
      desc: 'Methods สำหรับ navigation',
      details: `• push(path) - navigate และเพิ่ม history
• replace(path) - navigate โดยแทนที่ history ปัจจุบัน
• back() - กลับหน้าก่อน
• forward() - ไปหน้าถัดไป
• go(delta) - ไปหน้าที่ระบุ (relative)`,
      example: `// Navigate
router.push('/about');
router.push('/user/123?tab=profile');

// Replace (no history entry)
router.replace('/login');

// History navigation
router.back();
router.forward();
router.go(-2); // go back 2 pages`
    },
    {
      name: 'createRouterView',
      badge: 'function',
      sig: 'createRouterView(router, options): () => VNode',
      desc: 'สร้าง component แสดง current route',
      details: 'RouterView เป็น component ที่ render content ตาม route ปัจจุบัน ใช้คู่กับ reactive() เพื่อให้อัพเดทเมื่อ route เปลี่ยน',
      example: `const RouterView = createRouterView(router, {
  mode: 'hash',
  routes
});

const App = () => div(
  Header(),
  main(
    reactive(router.currentRoute, () => RouterView())
  ),
  Footer()
);`
    },
    {
      name: 'routerLink',
      badge: 'function',
      sig: 'routerLink(router, props, ...children): VNode',
      desc: 'สร้าง navigation link',
      details: 'สร้าง <a> tag ที่ใช้ router.push() แทนการ navigate ปกติ ป้องกัน full page reload',
      params: [
        { name: 'router', type: 'Router', desc: 'Router instance' },
        { name: 'props.to', type: 'string', desc: 'Target path' },
        { name: 'children', type: 'Child[]', desc: 'Link content' }
      ],
      example: `nav(
  routerLink(router, { to: '/' }, 'Home'),
  routerLink(router, { to: '/about' }, 'About'),
  routerLink(router, {
    to: '/contact',
    className: 'nav-link'
  }, 'Contact')
);`
    },
    {
      name: 'Navigation Guards',
      badge: 'method',
      sig: 'beforeEach, beforeEnter',
      desc: 'Guards สำหรับควบคุม navigation',
      details: `• beforeEach(guard) - global guard ทุก route
• beforeEnter - per-route guard

Guard function รับ (to, from) และ return:
• true - allow navigation
• false - block navigation
• string - redirect to path`,
      example: `// Global guard
router.beforeEach((to, from) => {
  if (to.path.startsWith('/admin') && !isLoggedIn) {
    return '/login'; // redirect
  }
  return true; // allow
});

// Per-route guard
{
  path: '/dashboard',
  component: DashboardPage,
  beforeEnter: (to, from) => {
    return isAuthenticated ? true : '/login';
  }
}`
    }
  ],

  performance: [
    {
      name: 'batchRender',
      badge: 'function',
      sig: 'batchRender(container, vNodes): HTMLElement',
      desc: 'Render หลาย VNodes พร้อมกัน',
      details: 'Batch multiple VNodes เข้าด้วยกันเพื่อ optimize DOM operations ลด reflows และ repaints',
      example: `const items = data.map(item =>
  li({ key: item.id }, item.name)
);

batchRender('#list', items);`
    },
    {
      name: 'renderChunked',
      badge: 'function',
      sig: 'renderChunked(container, vNodes, chunkSize?, onProgress?): HTMLElement',
      desc: 'Render large arrays แบบ chunked',
      details: `Render items เป็น chunks ด้วย requestAnimationFrame:
• ป้องกัน UI blocking
• แสดง progress ได้
• เหมาะสำหรับ 1000+ items`,
      params: [
        { name: 'container', type: 'string | HTMLElement', desc: 'Target container' },
        { name: 'vNodes', type: 'VNode[]', desc: 'Array of VNodes' },
        { name: 'chunkSize', type: 'number', desc: 'Items per chunk (default: 100)' },
        { name: 'onProgress', type: 'function', desc: 'Progress callback (current, total)' }
      ],
      example: `const items = generateLargeList(10000);

renderChunked('#list', items, 500, (current, total) => {
  progressBar.style.width = \`\${(current/total) * 100}%\`;
  statusText.textContent = \`Loading \${current}/\${total}\`;
});`
    },
    {
      name: 'createVirtualList',
      badge: 'function',
      sig: 'createVirtualList<T>(container, items, renderItem, itemHeight?, bufferSize?)',
      desc: 'Virtual scrolling สำหรับ large lists',
      details: `Render เฉพาะ items ที่อยู่ใน viewport:
• รองรับ millions of items
• Fixed หรือ dynamic item height
• Smooth scrolling
• Configurable buffer size`,
      params: [
        { name: 'container', type: 'HTMLElement', desc: 'Scroll container' },
        { name: 'items', type: 'T[]', desc: 'Data array' },
        { name: 'renderItem', type: '(item: T, index: number) => VNode', desc: 'Item render function' },
        { name: 'itemHeight', type: 'number', desc: 'Height per item (default: 40)' },
        { name: 'bufferSize', type: 'number', desc: 'Extra items to render (default: 5)' }
      ],
      returns: 'VirtualListController { updateItems, scrollToIndex, destroy }',
      example: `const list = createVirtualList(
  document.getElementById('list'),
  data, // 100,000 items
  (item, index) => div(
    { className: 'list-item' },
    span(\`#\${index}\`),
    span(item.name)
  ),
  50, // 50px per item
  10  // 10 items buffer
);

// Update data
list.updateItems(newData);

// Scroll to item
list.scrollToIndex(500);

// Cleanup
list.destroy();`
    },
    {
      name: 'lazy',
      badge: 'function',
      sig: 'lazy(loadFn): LazyComponent',
      desc: 'Lazy load components',
      details: 'โหลด component แบบ async เมื่อต้องการใช้งาน ช่วยลด initial bundle size',
      example: `// Lazy load heavy component
const HeavyChart = lazy(() => import('./HeavyChart'));

const Dashboard = () => div(
  h1('Dashboard'),
  HeavyChart({ data: chartData })
);`
    },
    {
      name: 'throttle',
      badge: 'function',
      sig: 'throttle<T>(fn: T, delay: number): T',
      desc: 'Throttle function calls',
      details: 'จำกัดให้ function รันได้สูงสุด 1 ครั้งต่อ delay period เหมาะสำหรับ scroll, resize events',
      example: `const handleScroll = throttle(() => {
  console.log('Scrolled!', window.scrollY);
}, 100); // max 10 times per second

window.addEventListener('scroll', handleScroll);`
    },
    {
      name: 'debounce',
      badge: 'function',
      sig: 'debounce<T>(fn: T, delay: number): T',
      desc: 'Debounce function calls',
      details: 'รอจนกว่าจะหยุดเรียก function ครบ delay period แล้วค่อยรัน เหมาะสำหรับ search input',
      example: `const search = debounce((query) => {
  fetchResults(query);
}, 300); // wait 300ms after typing stops

input.addEventListener('input', (e) => {
  search(e.target.value);
});`
    }
  ],

  head: [
    {
      name: 'setTitle',
      badge: 'function',
      sig: 'setTitle(text: string): string',
      desc: 'ตั้ง document title',
      details: 'เปลี่ยน title ของหน้าเว็บ (แสดงใน browser tab)',
      example: `setTitle('Home | My App');
setTitle(\`\${pageTitle} - My Site\`);`
    },
    {
      name: 'addMeta',
      badge: 'function',
      sig: 'addMeta(attrs: Record<string, string>): HTMLMetaElement',
      desc: 'เพิ่ม meta tag',
      details: 'เพิ่ม <meta> tag ใน <head> สำหรับ SEO, social sharing, viewport, etc.',
      example: `// SEO
addMeta({ name: 'description', content: 'My app description' });
addMeta({ name: 'keywords', content: 'app, web, elit' });

// Open Graph
addMeta({ property: 'og:title', content: 'Page Title' });
addMeta({ property: 'og:image', content: '/og-image.png' });

// Theme color
addMeta({ name: 'theme-color', content: '#6366f1' });

// Viewport
addMeta({
  name: 'viewport',
  content: 'width=device-width, initial-scale=1'
});`
    },
    {
      name: 'addLink',
      badge: 'function',
      sig: 'addLink(attrs: Record<string, string>): HTMLLinkElement',
      desc: 'เพิ่ม link tag',
      details: 'เพิ่ม <link> tag สำหรับ stylesheets, fonts, icons, preload, etc.',
      example: `// Favicon
addLink({ rel: 'icon', href: '/favicon.ico' });
addLink({ rel: 'apple-touch-icon', href: '/icon-192.png' });

// Stylesheet
addLink({ rel: 'stylesheet', href: '/styles.css' });

// Google Fonts
addLink({
  rel: 'preconnect',
  href: 'https://fonts.googleapis.com'
});

// Preload
addLink({
  rel: 'preload',
  href: '/hero.jpg',
  as: 'image'
});`
    },
    {
      name: 'addStyle',
      badge: 'function',
      sig: 'addStyle(css: string): HTMLStyleElement',
      desc: 'เพิ่ม inline CSS',
      details: 'เพิ่ม <style> tag พร้อม CSS content เข้าไปใน <head>',
      example: `addStyle(\`
  .highlight {
    background: yellow;
    padding: 0.2em;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
\`);`
    },
    {
      name: 'renderToHead',
      badge: 'function',
      sig: 'renderToHead(...vNodes): HTMLHeadElement | null',
      desc: 'Render VNodes เข้า head',
      details: 'Render VNode elements เข้าไปใน <head> โดยตรง',
      example: `import { meta, link, script } from 'elit';

renderToHead(
  meta({ name: 'author', content: 'John Doe' }),
  link({ rel: 'canonical', href: 'https://example.com' }),
  script({ src: '/analytics.js', async: true })
);`
    }
  ],

  types: [
    {
      name: 'VNode',
      badge: 'interface',
      sig: 'interface VNode { tagName: string; props: Props; children: Children }',
      desc: 'โครงสร้าง Virtual DOM Node',
      details: `VNode เป็น plain object ที่แทน DOM element:
• tagName: ชื่อ tag (div, span, etc.)
• props: attributes และ event handlers
• children: child elements หรือ text`,
      example: `// VNode structure
const vnode: VNode = {
  tagName: 'div',
  props: { className: 'container', id: 'main' },
  children: [
    { tagName: 'h1', props: {}, children: ['Title'] },
    'Some text',
    { tagName: 'p', props: {}, children: ['Paragraph'] }
  ]
};

// Factory functions สร้าง VNode ให้อัตโนมัติ
const vnode2 = div({ className: 'container' },
  h1('Title'),
  'Some text',
  p('Paragraph')
);`
    },
    {
      name: 'Props',
      badge: 'interface',
      sig: 'interface Props',
      desc: 'Interface สำหรับ element properties',
      details: `Props รองรับ:
• Standard HTML attributes (id, className, style, etc.)
• Event handlers (onclick, onchange, oninput, etc.)
• Data attributes (data-*, aria-*)
• Custom attributes
• ref สำหรับเข้าถึง DOM element`,
      example: `const props: Props = {
  // Attributes
  id: 'my-element',
  className: 'card active',
  style: 'color: red;',
  // or style object
  style: { color: 'red', fontSize: '16px' },

  // Data attributes
  'data-id': '123',
  'aria-label': 'Close',

  // Events
  onclick: (e) => console.log('clicked'),
  onchange: (e) => console.log(e.target.value),

  // Ref
  ref: (el) => console.log('element:', el)
};`
    },
    {
      name: 'Child',
      badge: 'type',
      sig: 'type Child = VNode | string | number | boolean | null | undefined',
      desc: 'ประเภทที่เป็น child ของ element ได้',
      details: `Valid children:
• VNode - element อื่น
• string - text content
• number - จะแปลงเป็น string
• boolean, null, undefined - จะถูกข้าม (ใช้สำหรับ conditional rendering)`,
      example: `div(
  h1('Title'),           // VNode
  'Text content',        // string
  42,                    // number
  isVisible && p('Hi'),  // conditional (boolean)
  null,                  // ignored
  undefined              // ignored
);`
    },
    {
      name: 'Ref',
      badge: 'type',
      sig: 'type Ref = RefCallback | RefObject',
      desc: 'Reference ถึง DOM element',
      details: `2 แบบ:
• RefCallback: function ที่รับ element
• RefObject: object ที่มี current property`,
      example: `// Callback ref
let myInput: HTMLInputElement;
input({
  ref: (el) => myInput = el as HTMLInputElement
});

// Object ref
const inputRef = { current: null as HTMLInputElement | null };
input({ ref: inputRef });

// Later
inputRef.current?.focus();`
    }
  ],

  json: [
    {
      name: 'jsonToVNode',
      badge: 'function',
      sig: 'jsonToVNode(json: JsonNode): Child',
      desc: 'แปลง JSON structure เป็น VNode',
      details: 'ใช้สำหรับ render UI จาก JSON data เช่น CMS content, API response, config files',
      example: `const json = {
  tag: 'article',
  attributes: { class: 'post' },
  children: [
    { tag: 'h1', children: 'Post Title' },
    { tag: 'p', children: 'Post content here...' },
    {
      tag: 'ul',
      children: [
        { tag: 'li', children: 'Item 1' },
        { tag: 'li', children: 'Item 2' }
      ]
    }
  ]
};

const vnode = jsonToVNode(json);
domNode.render('#app', vnode);`
    },
    {
      name: 'renderJson',
      badge: 'function',
      sig: 'renderJson(container, json): HTMLElement',
      desc: 'Render JSON โดยตรงไปยัง DOM',
      details: 'Shorthand สำหรับ jsonToVNode + render',
      example: `const content = await fetch('/api/content').then(r => r.json());
renderJson('#content', content);`
    },
    {
      name: 'renderJsonToString',
      badge: 'function',
      sig: 'renderJsonToString(json, options?): string',
      desc: 'แปลง JSON เป็น HTML string',
      details: 'ใช้สำหรับ SSR จาก JSON data',
      example: `const html = renderJsonToString({
  tag: 'div',
  attributes: { class: 'container' },
  children: { tag: 'p', children: 'Hello' }
}, { pretty: true });`
    },
    {
      name: 'JsonNode',
      badge: 'interface',
      sig: 'interface JsonNode',
      desc: 'รูปแบบ JSON สำหรับสร้าง elements',
      details: `JsonNode structure:
• tag: string - tag name
• attributes?: object - HTML attributes (class, id, style, etc.)
• children?: JsonNode | JsonNode[] | string - child content`,
      example: `interface JsonNode {
  tag: string;
  attributes?: Record<string, string>;
  children?: JsonNode | JsonNode[] | string | number | boolean | null;
}`
    },
    {
      name: 'VNodeJson',
      badge: 'type',
      sig: 'type VNodeJson',
      desc: 'รูปแบบ JSON แบบ VNode-like',
      details: 'Alternative format ที่ใกล้เคียงกับ VNode structure มากกว่า',
      example: `// VNodeJson format
const json: VNodeJson = {
  tagName: 'div',
  props: { className: 'container' },
  children: [
    { tagName: 'h1', props: {}, children: ['Title'] },
    'Text content'
  ]
};

const vnode = vNodeJsonToVNode(json);`
    }
  ]
};

// ============================================
// Component Functions
// ============================================

const ParamsTable = (params: { name: string; type: string; desc: string }[]) =>
  table({ style: 'width: 100%; font-size: 0.875rem; margin: 0.75rem 0;' },
    thead(
      tr(
        th({ style: 'text-align: left; padding: 0.5rem; border-bottom: 1px solid var(--border); color: var(--text-muted);' }, 'Parameter'),
        th({ style: 'text-align: left; padding: 0.5rem; border-bottom: 1px solid var(--border); color: var(--text-muted);' }, 'Type'),
        th({ style: 'text-align: left; padding: 0.5rem; border-bottom: 1px solid var(--border); color: var(--text-muted);' }, 'Description')
      )
    ),
    tbody(
      ...params.map(param =>
        tr(
          td({ style: 'padding: 0.5rem; border-bottom: 1px solid var(--border);' }, code(param.name)),
          td({ style: 'padding: 0.5rem; border-bottom: 1px solid var(--border); color: var(--primary);' }, param.type),
          td({ style: 'padding: 0.5rem; border-bottom: 1px solid var(--border); color: var(--text-muted);' }, param.desc)
        )
      )
    )
  );

const ApiItem = (item: ApiItem) =>
  div({ className: 'api-item', style: 'margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border);' },
    // Header
    div({ style: 'margin-bottom: 0.75rem;' },
      code({ style: 'font-size: 1.1rem; font-weight: 600;' }, item.name),
      span({ className: `api-badge badge-${item.badge}`, style: 'margin-left: 0.5rem;' }, item.badge)
    ),

    // Signature
    div({ className: 'api-signature', style: 'margin-bottom: 0.75rem;' }, item.sig),

    // Short description
    p({ style: 'color: var(--text); margin-bottom: 0.75rem; font-weight: 500;' }, item.desc),

    // Detailed description
    item.details ? div(
      h4({ style: 'font-size: 0.875rem; color: var(--text-muted); margin: 1rem 0 0.5rem;' }, 'รายละเอียด'),
      pre({ style: 'background: var(--bg-code); padding: 1rem; border-radius: 6px; white-space: pre-wrap; font-size: 0.875rem; color: var(--text-muted);' },
        item.details
      )
    ) : null,

    // Parameters
    item.params ? div(
      h4({ style: 'font-size: 0.875rem; color: var(--text-muted); margin: 1rem 0 0.5rem;' }, 'Parameters'),
      ParamsTable(item.params)
    ) : null,

    // Returns
    item.returns ? div(
      h4({ style: 'font-size: 0.875rem; color: var(--text-muted); margin: 1rem 0 0.5rem;' }, 'Returns'),
      p({ style: 'color: var(--primary);' }, item.returns)
    ) : null,

    // Example
    item.example ? div(
      h4({ style: 'font-size: 0.875rem; color: var(--text-muted); margin: 1rem 0 0.5rem;' }, 'ตัวอย่าง'),
      pre({ style: 'background: var(--bg-code); padding: 1rem; border-radius: 6px; overflow-x: auto;' },
        code(...codeBlock(item.example))
      )
    ) : null
  );

const ApiCategory = (title: string, items: ApiItem[]) =>
  div({ className: 'api-category', style: 'margin-bottom: 3rem;' },
    h3({ style: 'font-size: 1.5rem; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 2px solid var(--primary);' }, title),
    ...items.map(item => ApiItem(item))
  );

const ApiReference = () =>
  section({ id: 'api', className: 'api-section container' },
    h2({ className: 'section-title' }, 'API Reference'),

    // Table of Contents
    div({ style: 'background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 3rem;' },
      h3({ style: 'margin-bottom: 1rem;' }, 'สารบัญ'),
      ul({ style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; list-style: none; padding: 0;' },
        li(a({ href: 'javascript:void(0)', onclick: () => document.getElementById('core')?.scrollIntoView({ behavior: 'smooth' }), style: 'color: var(--text-muted); cursor: pointer;' }, '📦 Core')),
        li(a({ href: 'javascript:void(0)', onclick: () => document.getElementById('elements')?.scrollIntoView({ behavior: 'smooth' }), style: 'color: var(--text-muted); cursor: pointer;' }, '🏗️ Element Factories')),
        li(a({ href: 'javascript:void(0)', onclick: () => document.getElementById('state')?.scrollIntoView({ behavior: 'smooth' }), style: 'color: var(--text-muted); cursor: pointer;' }, '⚡ State Management')),
        li(a({ href: 'javascript:void(0)', onclick: () => document.getElementById('reactive')?.scrollIntoView({ behavior: 'smooth' }), style: 'color: var(--text-muted); cursor: pointer;' }, '🔄 Reactive Rendering')),
        li(a({ href: 'javascript:void(0)', onclick: () => document.getElementById('styling')?.scrollIntoView({ behavior: 'smooth' }), style: 'color: var(--text-muted); cursor: pointer;' }, '🎨 CreateStyle (CSS)')),
        li(a({ href: 'javascript:void(0)', onclick: () => document.getElementById('routing')?.scrollIntoView({ behavior: 'smooth' }), style: 'color: var(--text-muted); cursor: pointer;' }, '🛤️ Routing')),
        li(a({ href: 'javascript:void(0)', onclick: () => document.getElementById('performance')?.scrollIntoView({ behavior: 'smooth' }), style: 'color: var(--text-muted); cursor: pointer;' }, '🚀 Performance')),
        li(a({ href: 'javascript:void(0)', onclick: () => document.getElementById('head')?.scrollIntoView({ behavior: 'smooth' }), style: 'color: var(--text-muted); cursor: pointer;' }, '📋 Head Management')),
        li(a({ href: 'javascript:void(0)', onclick: () => document.getElementById('types')?.scrollIntoView({ behavior: 'smooth' }), style: 'color: var(--text-muted); cursor: pointer;' }, '📝 Types & Interfaces')),
        li(a({ href: 'javascript:void(0)', onclick: () => document.getElementById('json')?.scrollIntoView({ behavior: 'smooth' }), style: 'color: var(--text-muted); cursor: pointer;' }, '📄 JSON Rendering'))
      )
    ),

    div({ id: 'core' }, ApiCategory('📦 Core', apiData.core)),
    div({ id: 'elements' }, ApiCategory('🏗️ Element Factories', apiData.elements)),
    div({ id: 'state' }, ApiCategory('⚡ State Management', apiData.state)),
    div({ id: 'reactive' }, ApiCategory('🔄 Reactive Rendering', apiData.reactive)),
    div({ id: 'styling' }, ApiCategory('🎨 CreateStyle (CSS)', apiData.styling)),
    div({ id: 'routing' }, ApiCategory('🛤️ Routing', apiData.routing)),
    div({ id: 'performance' }, ApiCategory('🚀 Performance', apiData.performance)),
    div({ id: 'head' }, ApiCategory('📋 Head Management', apiData.head)),
    div({ id: 'types' }, ApiCategory('📝 Types & Interfaces', apiData.types)),
    div({ id: 'json' }, ApiCategory('📄 JSON Rendering', apiData.json))
  );

export const ApiPage = () =>
  section({ style: 'padding-top: 5rem;' },
    ApiReference()
  );
