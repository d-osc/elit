import {
  div, h1, h2, h3, p, ul, li, pre, code
} from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog15: BlogPostDetail = {
  id: '15',
  title: {
    en: 'Working with DomNode in Elit',
    th: 'การทำงานกับ DomNode ใน Elit'
  },
  date: '2024-04-05',
  author: 'n-devs',
  tags: ['Tutorial', 'DomNode', 'API', 'Advanced'],
  content: {
    en: div(
      p('Learn how to use Elit\'s DomNode class for advanced DOM manipulation and rendering. This comprehensive guide covers rendering methods (render, batchRender, renderChunked), server-side rendering (renderToString), JSON utilities (jsonToVNode, renderJson), virtual scrolling (createVirtualList), lazy loading, state management (createState, computed, effect), and performance optimization techniques.'),

      h2('What is DomNode?'),
      p('DomNode is the core class in Elit that handles all DOM operations. It provides low-level APIs for rendering VNodes to the DOM, converting VNodes to HTML strings, working with JSON structures, and managing reactive state. Most users work with higher-level APIs, but understanding DomNode unlocks advanced capabilities.'),
      ul(
        li('Direct DOM rendering with optimizations'),
        li('Server-side rendering (SSR) support'),
        li('JSON to VNode conversion'),
        li('Virtual scrolling for large lists'),
        li('Lazy component loading'),
        li('State management primitives'),
        li('Memory management utilities')
      ),

      h2('Rendering Methods'),
      h3('render() - Basic Rendering'),
      p('The render() method converts a VNode to DOM and appends it to a container:'),
      pre(code(...codeBlock(`import { dom } from 'elit';
import { div, h1, p } from 'elit';

// Create a VNode
const vnode = div(
  h1('Hello World'),
  p('This is rendered by DomNode')
);

// Render to element by ID
dom.render('app', vnode);

// Or render to element reference
const container = document.getElementById('app');
dom.render(container, vnode);`))),

      h3('batchRender() - Batch Multiple VNodes'),
      p('Use batchRender() to efficiently render multiple VNodes at once:'),
      pre(code(...codeBlock(`import { dom } from 'elit';
import { div, h2, p } from 'elit';

// Create array of VNodes
const items = [
  div(h2('Item 1'), p('Content 1')),
  div(h2('Item 2'), p('Content 2')),
  div(h2('Item 3'), p('Content 3')),
  // ... thousands more
];

// Batch render with automatic chunking for large arrays
dom.batchRender('container', items);

// For 3000+ items, automatically uses RAF chunking
// For smaller arrays, renders immediately with DocumentFragment`))),

      h3('renderChunked() - Progressive Rendering'),
      p('Use renderChunked() for progressive rendering with progress tracking:'),
      pre(code(...codeBlock(`import { dom } from 'elit';
import { div, p } from 'elit';

// Generate large array of VNodes
const items = Array.from({ length: 50000 }, (_, i) =>
  div({ className: 'item' }, p(\`Item \${i + 1}\`))
);

// Render in chunks with progress callback
dom.renderChunked(
  'container',
  items,
  5000, // Chunk size
  (current, total) => {
    console.log(\`Progress: \${current}/\${total}\`);
    // Update progress bar
    const percent = (current / total) * 100;
    updateProgressBar(percent);
  }
);`))),

      h3('renderToDOM() - Low-Level Rendering'),
      p('Use renderToDOM() for direct rendering to any DOM element:'),
      pre(code(...codeBlock(`import { dom } from 'elit';
import { div, span } from 'elit';

// Create a DocumentFragment
const fragment = document.createDocumentFragment();

// Render multiple VNodes to fragment
dom.renderToDOM(div('Item 1'), fragment);
dom.renderToDOM(div('Item 2'), fragment);
dom.renderToDOM(span('Item 3'), fragment);

// Append fragment to DOM in one operation
document.body.appendChild(fragment);`))),

      h2('Server-Side Rendering'),
      h3('renderToString() - VNode to HTML'),
      p('Convert VNodes to HTML strings for SSR:'),
      pre(code(...codeBlock(`import { dom } from 'elit';
import { div, h1, p, a } from 'elit';

const vnode = div({ className: 'page' },
  h1('Welcome'),
  p('This is server-rendered content'),
  a({ href: '/about' }, 'About Us')
);

// Convert to HTML string
const html = dom.renderToString(vnode);
console.log(html);
// Output: <div class="page"><h1>Welcome</h1><p>This is server-rendered content</p><a href="/about">About Us</a></div>

// With pretty printing
const prettyHtml = dom.renderToString(vnode, {
  pretty: true,
  indent: 0
});
console.log(prettyHtml);
// Output (formatted):
// <div class="page">
//   <h1>Welcome</h1>
//   <p>This is server-rendered content</p>
//   <a href="/about">About Us</a>
// </div>`))),

      h3('SSR with Express'),
      p('Integrate with Express for server-side rendering:'),
      pre(code(...codeBlock(`import express from 'express';
import { dom } from 'elit';
import { div, h1, p } from 'elit';

const app = express();

app.get('/', (req, res) => {
  const vnode = div({ id: 'app' },
    h1('Server-Rendered Page'),
    p('This HTML was generated on the server')
  );

  const html = dom.renderToString(vnode);

  res.send(\`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SSR with Elit</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        \${html}
        <script src="/bundle.js"></script>
      </body>
    </html>
  \`);
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});`))),

      h2('JSON Utilities'),
      h3('jsonToVNode() - JSON to VNode'),
      p('Convert JSON structures to VNodes:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

// JSON structure
const jsonData = {
  tag: 'div',
  attributes: {
    class: 'card',
    'data-id': '123'
  },
  children: [
    {
      tag: 'h2',
      children: ['Card Title']
    },
    {
      tag: 'p',
      children: ['Card content here']
    }
  ]
};

// Convert to VNode
const vnode = dom.jsonToVNode(jsonData);

// Render to DOM
dom.render('app', vnode);`))),

      h3('renderJson() - Render JSON Directly'),
      p('Render JSON structures directly to DOM:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

const jsonData = {
  tag: 'article',
  attributes: {
    class: 'post'
  },
  children: [
    { tag: 'h1', children: ['Article Title'] },
    { tag: 'p', children: ['Article content...'] }
  ]
};

// Render JSON to DOM directly
dom.renderJson('container', jsonData);`))),

      h3('renderJsonToString() - JSON to HTML'),
      p('Convert JSON structures to HTML strings:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

const jsonData = {
  tag: 'div',
  attributes: { class: 'widget' },
  children: [
    { tag: 'h3', children: ['Widget'] },
    { tag: 'p', children: ['Content'] }
  ]
};

const html = dom.renderJsonToString(jsonData, {
  pretty: true,
  indent: 2
});

console.log(html);`))),

      h3('vNodeJsonToVNode() - VNode JSON Format'),
      p('Work with VNode JSON structures:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

const vnodeJson = {
  tagName: 'div',
  props: {
    className: 'container',
    id: 'main'
  },
  children: [
    {
      tagName: 'h1',
      props: {},
      children: ['Title']
    },
    'Plain text child'
  ]
};

const vnode = dom.vNodeJsonToVNode(vnodeJson);
dom.render('app', vnode);`))),

      h2('Virtual Scrolling'),
      h3('createVirtualList() - Large Lists'),
      p('Efficiently render large lists with virtual scrolling:'),
      pre(code(...codeBlock(`import { dom } from 'elit';
import { div, span, strong } from 'elit';

// Generate large dataset
const items = Array.from({ length: 100000 }, (_, i) => ({
  id: i + 1,
  name: \`Item \${i + 1}\`,
  description: \`Description for item \${i + 1}\`
}));

// Container element
const container = document.getElementById('list-container');

// Create virtual list
const virtualList = dom.createVirtualList(
  container,
  items,
  (item, index) => div({ className: 'list-item' },
    strong(\`\${item.id}. \${item.name}\`),
    span(\`- \${item.description}\`)
  ),
  50,  // Item height in pixels
  5    // Buffer size (items above/below viewport)
);

// Later, destroy when done
// virtualList.destroy();`))),

      h3('Custom Virtual List Configuration'),
      p('Customize virtual list behavior:'),
      pre(code(...codeBlock(`import { dom } from 'elit';
import { div, img, h3, p } from 'elit';

const products = [/* large product array */];

const virtualList = dom.createVirtualList(
  document.getElementById('products'),
  products,
  (product) => div({ className: 'product-card' },
    img({ src: product.image, alt: product.name }),
    h3(product.name),
    p(product.description),
    p({ className: 'price' }, \`$\${product.price}\`)
  ),
  120,  // Taller items
  10    // Larger buffer for smooth scrolling
);`))),

      h2('Lazy Loading'),
      h3('lazy() - Lazy Load Components'),
      p('Lazy load components for code splitting:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

// Define lazy-loaded component
const LazyDashboard = dom.lazy(async () => {
  // Simulate dynamic import
  const module = await import('./Dashboard');
  return module.Dashboard;
});

// Use lazy component
async function renderApp() {
  const dashboard = await LazyDashboard();
  dom.render('app', dashboard);
}

renderApp();`))),

      h3('Lazy Loading with Loading State'),
      p('Show loading indicator while component loads:'),
      pre(code(...codeBlock(`import { dom } from 'elit';
import { div, p } from 'elit';

const LazyChart = dom.lazy(async () => {
  const module = await import('./Chart');
  return module.Chart;
});

async function renderChart() {
  // Shows "Loading..." while loading
  const chart = await LazyChart({ data: chartData });

  if (typeof chart === 'object' && 'tagName' in chart) {
    // Still loading
    dom.render('chart-container', chart);
  } else {
    // Loaded
    dom.render('chart-container', chart);
  }
}`))),

      h2('State Management'),
      h3('createState() - Reactive State'),
      p('Create reactive state with DomNode:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

// Create state
const count = dom.createState(0);

// Read value
console.log(count.value); // 0

// Update value
count.value++;
console.log(count.value); // 1

// Subscribe to changes
const unsubscribe = count.subscribe((newValue) => {
  console.log('Count changed:', newValue);
});

// Update triggers subscriber
count.value = 5; // Logs: "Count changed: 5"

// Unsubscribe
unsubscribe();

// Destroy state
count.destroy();`))),

      h3('State with Options'),
      p('Configure state behavior with options:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

// Throttled updates
const throttledState = dom.createState(0, {
  throttle: 100 // Update at most every 100ms
});

// Deep comparison for objects
const user = dom.createState(
  { name: 'John', age: 30 },
  { deep: true }
);

// Only triggers if object actually changed
user.value = { name: 'John', age: 30 }; // No trigger (same values)
user.value = { name: 'John', age: 31 }; // Triggers (age changed)`))),

      h3('computed() - Derived State'),
      p('Create computed values from multiple states:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

const firstName = dom.createState('John');
const lastName = dom.createState('Doe');

// Computed full name
const fullName = dom.computed(
  [firstName, lastName],
  (first, last) => \`\${first} \${last}\`
);

console.log(fullName.value); // "John Doe"

// Updates automatically
firstName.value = 'Jane';
console.log(fullName.value); // "Jane Doe"`))),

      h3('effect() - Side Effects'),
      p('Run side effects with the effect() helper:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

const count = dom.createState(0);

// Run effect immediately
dom.effect(() => {
  console.log('Current count:', count.value);
});

// Manual subscription for ongoing effects
count.subscribe((value) => {
  console.log('Count changed to:', value);
  // Perform side effects like API calls
  saveToLocalStorage('count', value);
});`))),

      h2('Head Management'),
      h3('renderToHead() - Modify Document Head'),
      p('Add elements to document head:'),
      pre(code(...codeBlock(`import { dom } from 'elit';
import { meta, link, style, title } from 'elit';

// Add multiple head elements
dom.renderToHead(
  title('My App'),
  meta({ name: 'description', content: 'App description' }),
  meta({ property: 'og:title', content: 'My App' }),
  link({ rel: 'stylesheet', href: '/styles.css' }),
  style('body { margin: 0; }')
);`))),

      h3('Helper Methods for Head'),
      p('Use convenience methods for common head operations:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

// Set page title
dom.setTitle('My Application');

// Add stylesheet
dom.addLink({
  rel: 'stylesheet',
  href: '/styles.css'
});

// Add meta tags
dom.addMeta({
  name: 'viewport',
  content: 'width=device-width, initial-scale=1'
});

dom.addMeta({
  name: 'description',
  content: 'My application description'
});

// Add inline styles
dom.addStyle(\`
  body {
    font-family: system-ui, sans-serif;
    margin: 0;
  }
\`);`))),

      h2('Memory Management'),
      h3('cleanupUnusedElements()'),
      p('Clean up unused elements to free memory:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

// Render some content
const container = document.getElementById('app');
dom.render(container, someVNode);

// Later, clean up unused elements
const removed = dom.cleanupUnusedElements(container);
console.log(\`Removed \${removed} unused elements\`);`))),

      h3('Element Cache'),
      p('Access the element cache for advanced use cases:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

// Get element cache
const cache = dom.getElementCache();

// Check if element is tracked
const element = document.getElementById('my-element');
const isTracked = cache.has(element);

console.log('Element tracked:', isTracked);`))),

      h2('Advanced Patterns'),
      h3('Custom Rendering Pipeline'),
      p('Build custom rendering pipelines:'),
      pre(code(...codeBlock(`import { dom } from 'elit';
import { div, h1, p } from 'elit';

class CustomRenderer {
  private container: HTMLElement;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)!;
  }

  // Pre-process VNode before rendering
  preprocess(vnode: any) {
    // Add tracking attributes, modify props, etc.
    return vnode;
  }

  // Render with custom logic
  render(vnode: any) {
    const processed = this.preprocess(vnode);

    // Use DomNode for actual rendering
    dom.render(this.container, processed);
  }

  // Render with animation
  renderWithFade(vnode: any) {
    this.container.style.opacity = '0';
    this.render(vnode);

    requestAnimationFrame(() => {
      this.container.style.transition = 'opacity 300ms';
      this.container.style.opacity = '1';
    });
  }
}

const renderer = new CustomRenderer('app');
renderer.renderWithFade(div(h1('Title'), p('Content')));`))),

      h3('Progressive Hydration'),
      p('Implement progressive hydration for SSR:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

// Server-rendered HTML is already in DOM
// Progressively hydrate interactive components

class HydrationManager {
  private hydratedComponents = new Set<string>();

  async hydrateComponent(id: string, factory: () => Promise<any>) {
    if (this.hydratedComponents.has(id)) return;

    const element = document.getElementById(id);
    if (!element) return;

    // Load component
    const Component = await factory();

    // Create VNode
    const vnode = Component();

    // Replace server HTML with interactive component
    element.innerHTML = '';
    dom.render(element, vnode);

    this.hydratedComponents.add(id);
  }

  async hydrateAll(components: Array<{ id: string; factory: () => Promise<any> }>) {
    // Hydrate visible components first
    const visible = components.filter(c => {
      const el = document.getElementById(c.id);
      return el && this.isInViewport(el);
    });

    await Promise.all(visible.map(c => this.hydrateComponent(c.id, c.factory)));

    // Then hydrate rest
    const rest = components.filter(c => !this.hydratedComponents.has(c.id));
    for (const component of rest) {
      await this.hydrateComponent(component.id, component.factory);
    }
  }

  private isInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }
}`))),

      h2('Best Practices'),
      ul(
        li('Use batchRender() for multiple VNodes instead of individual render() calls'),
        li('Use renderChunked() with progress callbacks for very large datasets'),
        li('Use createVirtualList() for lists with 1000+ items'),
        li('Use lazy() for code splitting large components'),
        li('Use createState() with throttle option for high-frequency updates'),
        li('Use computed() to derive state instead of manual calculations'),
        li('Clean up subscriptions with unsubscribe() to prevent memory leaks'),
        li('Use renderToString() for SSR with pretty printing in development'),
        li('Use DocumentFragment with renderToDOM() for batch DOM operations'),
        li('Call destroy() on states and virtual lists when unmounting')
      ),

      h2('Performance Tips'),
      ul(
        li('batchRender() automatically uses RAF chunking for 3000+ items'),
        li('renderChunked() prevents UI blocking with large datasets'),
        li('createVirtualList() only renders visible items plus buffer'),
        li('lazy() reduces initial bundle size with code splitting'),
        li('Throttled state prevents excessive re-renders'),
        li('DocumentFragment reduces reflows during batch operations'),
        li('cleanupUnusedElements() frees memory from abandoned DOM'),
        li('Element cache tracks elements for efficient updates')
      ),

      h2('Conclusion'),
      p('DomNode is Elit\'s powerful core class that provides low-level APIs for DOM manipulation, rendering, and state management. While most developers use higher-level abstractions, understanding DomNode enables advanced use cases like custom rendering pipelines, progressive hydration, virtual scrolling, and sophisticated performance optimizations. The API is designed to be both powerful for advanced users and efficient for the framework internals.'),
      p('Key takeaways: Use batchRender/renderChunked for large datasets, createVirtualList for huge lists, lazy() for code splitting, createState/computed/effect for reactivity, renderToString for SSR, and JSON utilities for data-driven rendering. Remember to clean up resources with destroy() and unsubscribe() methods.')
    ),
    th: div(
      p('เรียนรู้วิธีใช้ DomNode class ของ Elit สำหรับการจัดการและ rendering DOM ขั้นสูง คู่มือฉบับสมบูรณ์นี้ครอบคลุมวิธีการ rendering (render, batchRender, renderChunked), server-side rendering (renderToString), JSON utilities (jsonToVNode, renderJson), virtual scrolling (createVirtualList), lazy loading, state management (createState, computed, effect) และเทคนิคการเพิ่มประสิทธิภาพ'),

      h2('DomNode คืออะไร?'),
      p('DomNode เป็น class หลักใน Elit ที่จัดการทุกการทำงานกับ DOM มันให้ APIs ระดับต่ำสำหรับ rendering VNodes ไปยัง DOM, แปลง VNodes เป็น HTML strings, ทำงานกับ JSON structures และจัดการ reactive state ผู้ใช้ส่วนใหญ่ทำงานกับ APIs ระดับสูง แต่การเข้าใจ DomNode จะปลดล็อกความสามารถขั้นสูง'),
      ul(
        li('Direct DOM rendering พร้อมการเพิ่มประสิทธิภาพ'),
        li('รองรับ Server-side rendering (SSR)'),
        li('แปลง JSON เป็น VNode'),
        li('Virtual scrolling สำหรับ lists ขนาดใหญ่'),
        li('Lazy component loading'),
        li('State management primitives'),
        li('Memory management utilities')
      ),

      h2('วิธีการ Rendering'),
      h3('render() - Rendering พื้นฐาน'),
      p('เมธอด render() แปลง VNode เป็น DOM และแนบไปยัง container:'),
      pre(code(...codeBlock(`import { dom } from 'elit';
import { div, h1, p } from 'elit';

// สร้าง VNode
const vnode = div(
  h1('สวัสดีชาวโลก'),
  p('นี่ถูก render โดย DomNode')
);

// Render ไปยัง element ด้วย ID
dom.render('app', vnode);

// หรือ render ไปยัง element reference
const container = document.getElementById('app');
dom.render(container, vnode);`))),

      h3('batchRender() - Batch VNodes หลายตัว'),
      p('ใช้ batchRender() เพื่อ render VNodes หลายตัวอย่างมีประสิทธิภาพ:'),
      pre(code(...codeBlock(`import { dom } from 'elit';
import { div, h2, p } from 'elit';

// สร้าง array ของ VNodes
const items = [
  div(h2('รายการ 1'), p('เนื้อหา 1')),
  div(h2('รายการ 2'), p('เนื้อหา 2')),
  div(h2('รายการ 3'), p('เนื้อหา 3')),
  // ... อีกหลายพันรายการ
];

// Batch render พร้อม automatic chunking สำหรับ arrays ขนาดใหญ่
dom.batchRender('container', items);

// สำหรับ 3000+ items ใช้ RAF chunking โดยอัตโนมัติ
// สำหรับ arrays เล็กกว่า render ทันทีด้วย DocumentFragment`))),

      h3('renderChunked() - Progressive Rendering'),
      p('ใช้ renderChunked() สำหรับ progressive rendering พร้อมติดตามความคืบหน้า:'),
      pre(code(...codeBlock(`import { dom } from 'elit';
import { div, p } from 'elit';

// สร้าง array ขนาดใหญ่ของ VNodes
const items = Array.from({ length: 50000 }, (_, i) =>
  div({ className: 'item' }, p(\`รายการ \${i + 1}\`))
);

// Render เป็น chunks พร้อม progress callback
dom.renderChunked(
  'container',
  items,
  5000, // ขนาด Chunk
  (current, total) => {
    console.log(\`ความคืบหน้า: \${current}/\${total}\`);
    // อัปเดต progress bar
    const percent = (current / total) * 100;
    updateProgressBar(percent);
  }
);`))),

      h3('renderToDOM() - Low-Level Rendering'),
      p('ใช้ renderToDOM() สำหรับ rendering โดยตรงไปยัง DOM element ใดๆ:'),
      pre(code(...codeBlock(`import { dom } from 'elit';
import { div, span } from 'elit';

// สร้าง DocumentFragment
const fragment = document.createDocumentFragment();

// Render VNodes หลายตัวไปยัง fragment
dom.renderToDOM(div('รายการ 1'), fragment);
dom.renderToDOM(div('รายการ 2'), fragment);
dom.renderToDOM(span('รายการ 3'), fragment);

// แนบ fragment ไปยัง DOM ในการทำงานครั้งเดียว
document.body.appendChild(fragment);`))),

      h2('Server-Side Rendering'),
      h3('renderToString() - VNode เป็น HTML'),
      p('แปลง VNodes เป็น HTML strings สำหรับ SSR:'),
      pre(code(...codeBlock(`import { dom } from 'elit';
import { div, h1, p, a } from 'elit';

const vnode = div({ className: 'page' },
  h1('ยินดีต้อนรับ'),
  p('นี่คือเนื้อหาที่ render จาก server'),
  a({ href: '/about' }, 'เกี่ยวกับเรา')
);

// แปลงเป็น HTML string
const html = dom.renderToString(vnode);
console.log(html);
// Output: <div class="page"><h1>ยินดีต้อนรับ</h1><p>นี่คือเนื้อหาที่ render จาก server</p><a href="/about">เกี่ยวกับเรา</a></div>

// พร้อม pretty printing
const prettyHtml = dom.renderToString(vnode, {
  pretty: true,
  indent: 0
});
console.log(prettyHtml);`))),

      h3('SSR กับ Express'),
      p('ผสานกับ Express สำหรับ server-side rendering:'),
      pre(code(...codeBlock(`import express from 'express';
import { dom } from 'elit';
import { div, h1, p } from 'elit';

const app = express();

app.get('/', (req, res) => {
  const vnode = div({ id: 'app' },
    h1('หน้าเว็บที่ Render จาก Server'),
    p('HTML นี้ถูกสร้างบน server')
  );

  const html = dom.renderToString(vnode);

  res.send(\`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SSR กับ Elit</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        \${html}
        <script src="/bundle.js"></script>
      </body>
    </html>
  \`);
});

app.listen(3000, () => {
  console.log('Server ทำงานที่ http://localhost:3000');
});`))),

      h2('JSON Utilities'),
      h3('jsonToVNode() - JSON เป็น VNode'),
      p('แปลง JSON structures เป็น VNodes:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

// JSON structure
const jsonData = {
  tag: 'div',
  attributes: {
    class: 'card',
    'data-id': '123'
  },
  children: [
    {
      tag: 'h2',
      children: ['หัวเรื่องการ์ด']
    },
    {
      tag: 'p',
      children: ['เนื้อหาการ์ดที่นี่']
    }
  ]
};

// แปลงเป็น VNode
const vnode = dom.jsonToVNode(jsonData);

// Render ไปยัง DOM
dom.render('app', vnode);`))),

      h3('renderJson() - Render JSON โดยตรง'),
      p('Render JSON structures โดยตรงไปยัง DOM:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

const jsonData = {
  tag: 'article',
  attributes: {
    class: 'post'
  },
  children: [
    { tag: 'h1', children: ['หัวเรื่องบทความ'] },
    { tag: 'p', children: ['เนื้อหาบทความ...'] }
  ]
};

// Render JSON ไปยัง DOM โดยตรง
dom.renderJson('container', jsonData);`))),

      h3('renderJsonToString() - JSON เป็น HTML'),
      p('แปลง JSON structures เป็น HTML strings:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

const jsonData = {
  tag: 'div',
  attributes: { class: 'widget' },
  children: [
    { tag: 'h3', children: ['Widget'] },
    { tag: 'p', children: ['เนื้อหา'] }
  ]
};

const html = dom.renderJsonToString(jsonData, {
  pretty: true,
  indent: 2
});

console.log(html);`))),

      h2('Virtual Scrolling'),
      h3('createVirtualList() - Lists ขนาดใหญ่'),
      p('Render lists ขนาดใหญ่อย่างมีประสิทธิภาพด้วย virtual scrolling:'),
      pre(code(...codeBlock(`import { dom } from 'elit';
import { div, span, strong } from 'elit';

// สร้าง dataset ขนาดใหญ่
const items = Array.from({ length: 100000 }, (_, i) => ({
  id: i + 1,
  name: \`รายการ \${i + 1}\`,
  description: \`คำอธิบายสำหรับรายการ \${i + 1}\`
}));

// Container element
const container = document.getElementById('list-container');

// สร้าง virtual list
const virtualList = dom.createVirtualList(
  container,
  items,
  (item, index) => div({ className: 'list-item' },
    strong(\`\${item.id}. \${item.name}\`),
    span(\`- \${item.description}\`)
  ),
  50,  // ความสูงของ item เป็น pixels
  5    // ขนาด Buffer (items ด้านบน/ล่าง viewport)
);

// ภายหลัง destroy เมื่อเสร็จ
// virtualList.destroy();`))),

      h2('Lazy Loading'),
      h3('lazy() - Lazy Load Components'),
      p('Lazy load components สำหรับ code splitting:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

// กำหนด lazy-loaded component
const LazyDashboard = dom.lazy(async () => {
  // จำลอง dynamic import
  const module = await import('./Dashboard');
  return module.Dashboard;
});

// ใช้ lazy component
async function renderApp() {
  const dashboard = await LazyDashboard();
  dom.render('app', dashboard);
}

renderApp();`))),

      h2('State Management'),
      h3('createState() - Reactive State'),
      p('สร้าง reactive state ด้วย DomNode:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

// สร้าง state
const count = dom.createState(0);

// อ่านค่า
console.log(count.value); // 0

// อัปเดตค่า
count.value++;
console.log(count.value); // 1

// Subscribe ไปยังการเปลี่ยนแปลง
const unsubscribe = count.subscribe((newValue) => {
  console.log('Count เปลี่ยน:', newValue);
});

// การอัปเดตจะ trigger subscriber
count.value = 5; // Logs: "Count เปลี่ยน: 5"

// Unsubscribe
unsubscribe();

// Destroy state
count.destroy();`))),

      h3('State พร้อม Options'),
      p('กำหนดค่าพฤติกรรม state ด้วย options:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

// Throttled updates
const throttledState = dom.createState(0, {
  throttle: 100 // อัปเดตมากที่สุดทุก 100ms
});

// Deep comparison สำหรับ objects
const user = dom.createState(
  { name: 'สมชาย', age: 30 },
  { deep: true }
);

// Triggers เฉพาะเมื่อ object เปลี่ยนจริงๆ
user.value = { name: 'สมชาย', age: 30 }; // ไม่ trigger (ค่าเดียวกัน)
user.value = { name: 'สมชาย', age: 31 }; // Triggers (อายุเปลี่ยน)`))),

      h3('computed() - Derived State'),
      p('สร้างค่า computed จาก states หลายตัว:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

const firstName = dom.createState('สมชาย');
const lastName = dom.createState('ใจดี');

// Computed ชื่อเต็ม
const fullName = dom.computed(
  [firstName, lastName],
  (first, last) => \`\${first} \${last}\`
);

console.log(fullName.value); // "สมชาย ใจดี"

// อัปเดตอัตโนมัติ
firstName.value = 'สมหญิง';
console.log(fullName.value); // "สมหญิง ใจดี"`))),

      h3('effect() - Side Effects'),
      p('รัน side effects ด้วย effect() helper:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

const count = dom.createState(0);

// รัน effect ทันที
dom.effect(() => {
  console.log('นับปัจจุบัน:', count.value);
});

// Manual subscription สำหรับ ongoing effects
count.subscribe((value) => {
  console.log('นับเปลี่ยนเป็น:', value);
  // ทำ side effects อย่าง API calls
  saveToLocalStorage('count', value);
});`))),

      h2('Head Management'),
      h3('renderToHead() - แก้ไข Document Head'),
      p('เพิ่ม elements ไปยัง document head:'),
      pre(code(...codeBlock(`import { dom } from 'elit';
import { meta, link, style, title } from 'elit';

// เพิ่ม head elements หลายตัว
dom.renderToHead(
  title('แอปของฉัน'),
  meta({ name: 'description', content: 'คำอธิบายแอป' }),
  meta({ property: 'og:title', content: 'แอปของฉัน' }),
  link({ rel: 'stylesheet', href: '/styles.css' }),
  style('body { margin: 0; }')
);`))),

      h3('Helper Methods สำหรับ Head'),
      p('ใช้เมธอดที่สะดวกสำหรับการทำงาน head ทั่วไป:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

// ตั้งค่า page title
dom.setTitle('แอปพลิเคชันของฉัน');

// เพิ่ม stylesheet
dom.addLink({
  rel: 'stylesheet',
  href: '/styles.css'
});

// เพิ่ม meta tags
dom.addMeta({
  name: 'viewport',
  content: 'width=device-width, initial-scale=1'
});

dom.addMeta({
  name: 'description',
  content: 'คำอธิบายแอปพลิเคชันของฉัน'
});

// เพิ่ม inline styles
dom.addStyle(\`
  body {
    font-family: system-ui, sans-serif;
    margin: 0;
  }
\`);`))),

      h2('Memory Management'),
      h3('cleanupUnusedElements()'),
      p('ทำความสะอาด elements ที่ไม่ใช้เพื่อปลดปล่อย memory:'),
      pre(code(...codeBlock(`import { dom } from 'elit';

// Render เนื้อหาบางส่วน
const container = document.getElementById('app');
dom.render(container, someVNode);

// ภายหลัง ทำความสะอาด elements ที่ไม่ใช้
const removed = dom.cleanupUnusedElements(container);
console.log(\`ลบ \${removed} elements ที่ไม่ใช้\`);`))),

      h2('แนวทางปฏิบัติที่ดี'),
      ul(
        li('ใช้ batchRender() สำหรับ VNodes หลายตัวแทนที่จะเรียก render() แต่ละตัว'),
        li('ใช้ renderChunked() พร้อม progress callbacks สำหรับ datasets ขนาดใหญ่มาก'),
        li('ใช้ createVirtualList() สำหรับ lists ที่มี 1000+ items'),
        li('ใช้ lazy() สำหรับ code splitting components ขนาดใหญ่'),
        li('ใช้ createState() พร้อม throttle option สำหรับ high-frequency updates'),
        li('ใช้ computed() เพื่อ derive state แทนการคำนวณด้วยตัวเอง'),
        li('ทำความสะอาด subscriptions ด้วย unsubscribe() เพื่อป้องกัน memory leaks'),
        li('ใช้ renderToString() สำหรับ SSR พร้อม pretty printing ในการพัฒนา'),
        li('ใช้ DocumentFragment กับ renderToDOM() สำหรับ batch DOM operations'),
        li('เรียก destroy() บน states และ virtual lists เมื่อ unmounting')
      ),

      h2('เคล็ดลับด้านประสิทธิภาพ'),
      ul(
        li('batchRender() ใช้ RAF chunking โดยอัตโนมัติสำหรับ 3000+ items'),
        li('renderChunked() ป้องกัน UI blocking กับ datasets ขนาดใหญ่'),
        li('createVirtualList() render เฉพาะ items ที่มองเห็นบวก buffer'),
        li('lazy() ลดขนาด initial bundle ด้วย code splitting'),
        li('Throttled state ป้องกัน excessive re-renders'),
        li('DocumentFragment ลด reflows ระหว่าง batch operations'),
        li('cleanupUnusedElements() ปลดปล่อย memory จาก abandoned DOM'),
        li('Element cache ติดตาม elements สำหรับ efficient updates')
      ),

      h2('สรุป'),
      p('DomNode เป็น core class ที่ทรงพลังของ Elit ที่ให้ APIs ระดับต่ำสำหรับการจัดการ DOM, rendering และ state management ในขณะที่นักพัฒนาส่วนใหญ่ใช้ abstractions ระดับสูง การเข้าใจ DomNode จะเปิดใช้งานกรณีการใช้งานขั้นสูงอย่าง custom rendering pipelines, progressive hydration, virtual scrolling และการเพิ่มประสิทธิภาพที่ซับซ้อน API ถูกออกแบบให้ทรงพลังสำหรับผู้ใช้ขั้นสูงและมีประสิทธิภาพสำหรับ framework internals'),
      p('สรุปสำคัญ: ใช้ batchRender/renderChunked สำหรับ datasets ขนาดใหญ่, createVirtualList สำหรับ lists ใหญ่มาก, lazy() สำหรับ code splitting, createState/computed/effect สำหรับ reactivity, renderToString สำหรับ SSR และ JSON utilities สำหรับ data-driven rendering อย่าลืมทำความสะอาด resources ด้วยเมธอด destroy() และ unsubscribe()')
    )
  }
};
