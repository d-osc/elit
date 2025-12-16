import { div, h2, h3, h4, p, ul, li, pre, code } from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog8: BlogPostDetail = {
  id: '8',
  title: {
    en: 'Working with renderJson in Elit',
    th: 'การใช้งาน renderJson ใน Elit'
  },
  date: '2024-03-01',
  author: 'n-devs',
  tags: ['Tutorial', 'API', 'JSON', 'Data Serialization'],
  content: {
    en: div(
      p('Learn how to use Elit\'s renderJson utility to serialize VNodes and application state into JSON format. Perfect for SSR hydration, API responses, state persistence, and data transfer between server and client.'),

      h2('What is renderJson?'),
      p('renderJson is a powerful utility in Elit that renders JSON data structures directly to the DOM or converts them to HTML strings. Elit provides several JSON-related utilities:'),
      ul(
        li('renderJson() - Render JSON structure to DOM container'),
        li('renderJsonToString() - Convert JSON to HTML string'),
        li('jsonToVNode() - Convert JSON to VNode object'),
        li('renderVNode() - Render VNode JSON to DOM'),
        li('vNodeJsonToVNode() - Convert VNode JSON to VNode')
      ),

      h2('Understanding JSON Types'),
      p('Elit supports two main JSON structures:'),

      h3('1. JsonNode'),
      p('Simple JSON structure representing HTML:'),
      pre(code(...codeBlock(`interface JsonNode {
  tag: string;
  props?: Record<string, any>;
  children?: (string | JsonNode)[];
}

// Example JsonNode
const jsonData = {
  tag: 'div',
  props: { className: 'card' },
  children: [
    { tag: 'h1', children: ['Hello World'] },
    { tag: 'p', children: ['This is a paragraph'] }
  ]
};`))),

      h3('2. VNodeJson'),
      p('VNode JSON structure with full type information:'),
      pre(code(...codeBlock(`interface VNodeJson {
  tag: string;
  props?: Record<string, any>;
  children?: (string | number | VNodeJson)[];
}`))),

      h2('Basic Usage'),
      h3('Rendering JSON to DOM'),
      p('Use renderJson to render JSON data directly to the DOM:'),
      pre(code(...codeBlock(`import { renderJson } from 'elit';

// JSON data structure
const jsonData = {
  tag: 'div',
  props: { className: 'card' },
  children: [
    { tag: 'h1', children: ['Welcome'] },
    { tag: 'p', children: ['This content is from JSON'] }
  ]
};

// Render to DOM container
const element = renderJson('#app', jsonData);`))),

      h3('Converting JSON to HTML String'),
      p('Use renderJsonToString for server-side rendering:'),
      pre(code(...codeBlock(`import { renderJsonToString } from 'elit';

const jsonData = {
  tag: 'article',
  props: { className: 'post' },
  children: [
    { tag: 'h2', children: ['Blog Post'] },
    { tag: 'p', children: ['Content here'] }
  ]
};

// Convert to HTML string
const html = renderJsonToString(jsonData);
console.log(html);
// Output: <article class="post"><h2>Blog Post</h2><p>Content here</p></article>

// With pretty printing
const prettyHtml = renderJsonToString(jsonData, { pretty: true, indent: 2 });`))),

      h2('Working with jsonToVNode'),
      h3('Converting JSON to VNode'),
      p('Use jsonToVNode to convert JSON data into VNode objects:'),
      pre(code(...codeBlock(`import { jsonToVNode } from 'elit';

const jsonData = {
  tag: 'div',
  props: { className: 'user-card' },
  children: [
    { tag: 'h3', children: ['John Doe'] },
    { tag: 'p', children: ['Software Developer'] }
  ]
};

// Convert JSON to VNode
const vnode = jsonToVNode(jsonData);

// Now you can work with it as a regular VNode
document.body.appendChild(vnode.node);`))),

      h2('SSR Hydration Pattern'),
      h3('Server-Side: Render to HTML String'),
      p('On the server, use renderToString to generate HTML:'),
      pre(code(...codeBlock(`import express from 'express';
import { renderToString, div, h1, span, button } from 'elit';

const app = express();

app.get('/counter', (req, res) => {
  const initialCount = 0;

  // Create component
  const component = div({ id: 'app' },
    h1('Counter App'),
    span({ id: 'count' }, initialCount),
    button({ id: 'increment' }, 'Increment')
  );

  // Convert to HTML string
  const html = renderToString(component);

  // Send HTML with embedded initial state
  res.send(\`
    <!DOCTYPE html>
    <html>
      <head><title>Counter</title></head>
      <body>
        \${html}
        <script>
          window.__INITIAL_STATE__ = \${JSON.stringify({ count: initialCount })};
        </script>
        <script src="/bundle.js"></script>
      </body>
    </html>
  \`);
});`))),

      h3('Client-Side: Hydrate from Initial State'),
      p('On the client, restore state and attach event handlers:'),
      pre(code(...codeBlock(`import { createState, reactive } from 'elit';

// Get initial state from server
const initialState = window.__INITIAL_STATE__;

// Create reactive state
const count = createState(initialState.count);

// Find existing DOM elements and attach handlers
const countSpan = document.getElementById('count');
const incrementBtn = document.getElementById('increment');

// Make count reactive
if (countSpan) {
  count.subscribe(value => {
    countSpan.textContent = String(value);
  });
}

// Attach event handler
if (incrementBtn) {
  incrementBtn.addEventListener('click', () => {
    count.value++;
  });
}`))),

      h2('API Responses with JSON Data'),
      h3('Building a JSON API'),
      p('Create an API that returns JSON structures:'),
      pre(code(...codeBlock(`import { Router } from 'express';

const router = Router();

router.get('/api/widgets/:type', (req, res) => {
  const { type } = req.params;

  let widgetJson;

  switch (type) {
    case 'stats':
      widgetJson = {
        tag: 'div',
        props: { className: 'widget stats' },
        children: [
          { tag: 'h2', children: ['Statistics'] },
          {
            tag: 'ul',
            children: [
              { tag: 'li', children: ['Users: 1,234'] },
              { tag: 'li', children: ['Posts: 5,678'] }
            ]
          }
        ]
      };
      break;

    case 'notification':
      widgetJson = {
        tag: 'div',
        props: { className: 'widget notification' },
        children: [
          { tag: 'h2', children: ['Notifications'] },
          { tag: 'p', children: ['You have 3 new messages'] }
        ]
      };
      break;

    default:
      return res.status(404).json({ error: 'Widget not found' });
  }

  // Return JSON structure
  res.json({
    success: true,
    widget: widgetJson,
    timestamp: Date.now()
  });
});`))),

      h3('Client-Side: Render from API'),
      p('Fetch and render JSON data from API:'),
      pre(code(...codeBlock(`import { jsonToVNode } from 'elit';

async function loadWidget(type: string) {
  const response = await fetch(\`/api/widgets/\${type}\`);
  const data = await response.json();

  if (data.success) {
    // Convert JSON to VNode
    const vnode = jsonToVNode(data.widget);

    // Render to DOM
    const container = document.getElementById('widget-container');
    if (container) {
      container.innerHTML = '';
      container.appendChild(vnode.node);
    }
  }
}

// Load stats widget
loadWidget('stats');`))),

      h2('State Persistence'),
      h3('Save State to LocalStorage'),
      p('Persist application state across sessions:'),
      pre(code(...codeBlock(`import { createState } from 'elit';

// Create state
const todos = createState([
  { id: 1, text: 'Learn Elit', completed: true },
  { id: 2, text: 'Build app', completed: false }
]);

// Save state to localStorage
function saveState() {
  localStorage.setItem('appState', JSON.stringify(todos.value));
}

// Load state from localStorage
function loadState() {
  const saved = localStorage.getItem('appState');
  if (saved) {
    todos.value = JSON.parse(saved);
  }
}

// Auto-save on changes
todos.subscribe(() => saveState());

// Load on startup
loadState();`))),

      h2('Caching HTML Output'),
      h3('Server-Side HTML Cache'),
      p('Cache rendered HTML strings for better performance:'),
      pre(code(...codeBlock(`import { renderJsonToString } from 'elit';

const htmlCache = new Map();

function getWidgetHtml(type: string): string {
  // Check cache
  if (htmlCache.has(type)) {
    return htmlCache.get(type);
  }

  // Create JSON structure
  const widgetJson = {
    tag: 'div',
    props: { className: \`widget \${type}\` },
    children: [
      { tag: 'h2', children: [type.toUpperCase()] },
      { tag: 'p', children: ['Widget content here'] }
    ]
  };

  // Convert to HTML string
  const html = renderJsonToString(widgetJson);

  // Cache it
  htmlCache.set(type, html);

  return html;
}`))),

      h2('Using renderVNode and vNodeJsonToVNode'),
      h3('VNode JSON Format'),
      p('Work with VNode JSON structures:'),
      pre(code(...codeBlock(`import { renderVNode, vNodeJsonToVNode } from 'elit';

// VNode JSON structure
const vnodeJson = {
  tag: 'div',
  props: { className: 'message' },
  children: [
    { tag: 'h3', children: ['Success!'] },
    { tag: 'p', children: ['Operation completed'] }
  ]
};

// Method 1: Render directly to DOM
renderVNode('#container', vnodeJson);

// Method 2: Convert to VNode first
const vnode = vNodeJsonToVNode(vnodeJson);
document.body.appendChild(vnode.node);`))),

      h2('Best Practices'),
      ul(
        li('Use renderJson and renderJsonToString for dynamic content from JSON'),
        li('Cache HTML strings for frequently rendered components'),
        li('Validate JSON structures before rendering'),
        li('Use renderToString for SSR instead of manual HTML generation'),
        li('Keep JSON structures simple and flat when possible'),
        li('Use compression for large JSON payloads over the network')
      ),

      h3('Complete Example'),
      p('Here\'s a complete example combining multiple utilities:'),
      pre(code(...codeBlock(`import {
  jsonToVNode,
  renderJsonToString,
  renderJson
} from 'elit';

// 1. JSON data from API
const widgetData = {
  tag: 'div',
  props: { className: 'widget' },
  children: [
    { tag: 'h2', children: ['Dashboard'] },
    { tag: 'p', children: ['Welcome back!'] }
  ]
};

// 2. Convert to HTML string (for SSR)
const htmlString = renderJsonToString(widgetData, {
  pretty: true,
  indent: 2
});
console.log(htmlString);

// 3. Convert to VNode (for manipulation)
const vnode = jsonToVNode(widgetData);

// 4. Render directly to DOM (for client-side)
const element = renderJson('#widget-container', widgetData);`))),

      h2('Summary of JSON Utilities'),
      p('Elit provides a comprehensive set of JSON utilities for different use cases:'),
      ul(
        li('renderJson(container, json) - Render JSON data to DOM'),
        li('renderJsonToString(json, options?) - Convert JSON to HTML string'),
        li('jsonToVNode(json) - Convert JSON to VNode object'),
        li('renderVNode(container, vnodeJson) - Render VNode JSON to DOM'),
        li('vNodeJsonToVNode(vnodeJson) - Convert VNode JSON to VNode'),
        li('renderToString(vnode, options?) - Convert VNode to HTML string')
      ),

      h2('Conclusion'),
      p('Elit\'s JSON utilities provide a powerful way to work with component data in JSON format. Whether you\'re implementing SSR, building APIs that return UI structures, or caching rendered output, these tools make it easy to serialize and deserialize component structures.'),
      p('Key takeaways: Use renderJson and renderJsonToString for working with JSON data, renderToString for SSR, and jsonToVNode for converting JSON back to VNodes. Always validate JSON structures and consider caching HTML strings for better performance.')
    ),
    th: div(
      p('เรียนรู้วิธีใช้ JSON utilities ของ Elit สำหรับ rendering JSON data เป็น DOM, แปลงเป็น HTML strings และทำงานกับ VNode JSON structures เหมาะสำหรับ SSR, API responses และ data caching'),

      h2('renderJson คืออะไร?'),
      p('renderJson เป็น utility ใน Elit ที่ render โครงสร้าง JSON โดยตรงไปยัง DOM หรือแปลงเป็น HTML strings Elit มี JSON utilities หลายตัว:'),
      ul(
        li('renderJson() - Render โครงสร้าง JSON ไปยัง DOM container'),
        li('renderJsonToString() - แปลง JSON เป็น HTML string'),
        li('jsonToVNode() - แปลง JSON เป็น VNode object'),
        li('renderVNode() - Render VNode JSON ไปยัง DOM'),
        li('vNodeJsonToVNode() - แปลง VNode JSON เป็น VNode')
      ),

      h2('ทำความเข้าใจ JSON Types'),
      p('Elit รองรับโครงสร้าง JSON 2 แบบหลัก:'),

      h3('1. JsonNode'),
      p('โครงสร้าง JSON แบบง่ายที่เป็นตัวแทน HTML:'),
      pre(code(...codeBlock(`interface JsonNode {
  tag: string;
  props?: Record<string, any>;
  children?: (string | JsonNode)[];
}

// ตัวอย่าง JsonNode
const jsonData = {
  tag: 'div',
  props: { className: 'card' },
  children: [
    { tag: 'h1', children: ['สวัสดีชาวโลก'] },
    { tag: 'p', children: ['นี่คือย่อหน้า'] }
  ]
};`))),

      h3('2. VNodeJson'),
      p('โครงสร้าง VNode JSON พร้อมข้อมูล type เต็มรูปแบบ:'),
      pre(code(...codeBlock(`interface VNodeJson {
  tag: string;
  props?: Record<string, any>;
  children?: (string | number | VNodeJson)[];
}`))),

      h2('การใช้งานพื้นฐาน'),
      h3('Rendering JSON ไปยัง DOM'),
      p('ใช้ renderJson เพื่อ render JSON data โดยตรงไปยัง DOM:'),
      pre(code(...codeBlock(`import { renderJson } from 'elit';

// โครงสร้าง JSON data
const jsonData = {
  tag: 'div',
  props: { className: 'card' },
  children: [
    { tag: 'h1', children: ['ยินดีต้อนรับ'] },
    { tag: 'p', children: ['เนื้อหานี้มาจาก JSON'] }
  ]
};

// Render ไปยัง DOM container
const element = renderJson('#app', jsonData);`))),

      h3('แปลง JSON เป็น HTML String'),
      p('ใช้ renderJsonToString สำหรับ server-side rendering:'),
      pre(code(...codeBlock(`import { renderJsonToString } from 'elit';

const jsonData = {
  tag: 'article',
  props: { className: 'post' },
  children: [
    { tag: 'h2', children: ['บล็อกโพสต์'] },
    { tag: 'p', children: ['เนื้อหาที่นี่'] }
  ]
};

// แปลงเป็น HTML string
const html = renderJsonToString(jsonData);
console.log(html);
// Output: <article class="post"><h2>บล็อกโพสต์</h2><p>เนื้อหาที่นี่</p></article>

// พร้อม pretty printing
const prettyHtml = renderJsonToString(jsonData, { pretty: true, indent: 2 });`))),

      h2('การทำงานกับ jsonToVNode'),
      h3('แปลง JSON เป็น VNode'),
      p('ใช้ jsonToVNode เพื่อแปลง JSON data เป็น VNode objects:'),
      pre(code(...codeBlock(`import express from 'express';
import { renderJson, createState, div, h1, span, button } from 'elit';

const app = express();

app.get('/counter', (req, res) => {
  // สร้าง initial state
  const count = createState(0);

  // Render component
  const component = div({ id: 'app' },
    h1('แอปนับเลข'),
    span({ id: 'count' }, count.value),
    button({ id: 'increment' }, 'เพิ่ม')
  );

  // Serialize component และ state
  const componentJson = renderJson(component);
  const initialState = { count: count.value };

  // ส่ง HTML พร้อม embedded JSON
  res.send(\`
    <!DOCTYPE html>
    <html>
      <head><title>ตัวนับ</title></head>
      <body>
        <div id="app">\${vnodeToHtml(component)}</div>
        <script>
          window.__INITIAL_STATE__ = \${JSON.stringify(initialState)};
          window.__COMPONENT_JSON__ = \${JSON.stringify(componentJson)};
        </script>
        <script src="/bundle.js"></script>
      </body>
    </html>
  \`);
});`))),

      h3('ฝั่ง Client: Hydrate จาก JSON'),
      p('บน client กู้คืน state และ hydrate component:'),
      pre(code(...codeBlock(`import { createState, reactive, div, h1, span, button } from 'elit';

// ดึง initial state จากเซิร์ฟเวอร์
const initialState = window.__INITIAL_STATE__;

// สร้าง reactive state ใหม่
const count = createState(initialState.count);

// สร้าง component ใหม่พร้อม event handlers
const component = div({ id: 'app' },
  h1('แอปนับเลข'),
  reactive(count, value => span({ id: 'count' }, value)),
  button({
    id: 'increment',
    onclick: () => count.value++
  }, 'เพิ่ม')
);

// Hydrate DOM ที่มีอยู่
const appElement = document.getElementById('app');
if (appElement) {
  appElement.replaceWith(component.node);
}`))),

      h2('API Responses พร้อม Component Data'),
      h3('สร้าง Component API'),
      p('สร้าง API ที่ส่งคืนโครงสร้าง component:'),
      pre(code(...codeBlock(`import { Router } from 'express';
import { renderJson, div, h2, p, ul, li } from 'elit';

const router = Router();

router.get('/api/widgets/:type', (req, res) => {
  const { type } = req.params;

  let widget;

  switch (type) {
    case 'stats':
      widget = div({ className: 'widget stats' },
        h2('สถิติ'),
        ul(
          li(\`ผู้ใช้: 1,234\`),
          li(\`โพสต์: 5,678\`),
          li(\`ความคิดเห็น: 9,012\`)
        )
      );
      break;

    case 'notification':
      widget = div({ className: 'widget notification' },
        h2('การแจ้งเตือน'),
        p('คุณมีข้อความใหม่ 3 ข้อความ')
      );
      break;

    default:
      return res.status(404).json({ error: 'ไม่พบ Widget' });
  }

  // ส่งคืน serialized component
  res.json({
    success: true,
    widget: renderJson(widget),
    timestamp: Date.now()
  });
});

export default router;`))),

      h3('ฝั่ง Client: Render จาก API'),
      p('ดึงข้อมูลและ render components จาก API:'),
      pre(code(...codeBlock(`async function loadWidget(type: string) {
  const response = await fetch(\`/api/widgets/\${type}\`);
  const data = await response.json();

  if (data.success) {
    // สร้าง VNode ใหม่จาก JSON
    const widget = jsonToVNode(data.widget);

    // Render ไปยัง DOM
    const container = document.getElementById('widget-container');
    if (container) {
      container.innerHTML = '';
      container.appendChild(widget.node);
    }
  }
}

// Helper สำหรับแปลง JSON กลับเป็น VNode
function jsonToVNode(json: any): VNode {
  if (typeof json === 'string' || typeof json === 'number') {
    return json;
  }

  const { tag, props = {}, children = [] } = json;

  // Import element factory แบบ dynamic
  const factory = elementFactories[tag];
  if (!factory) {
    throw new Error(\`Unknown tag: \${tag}\`);
  }

  // แปลง children แบบ recursive
  const vnodeChildren = children.map(child => jsonToVNode(child));

  return factory(props, ...vnodeChildren);
}`))),

      h2('การเก็บ State'),
      h3('บันทึก State ไป LocalStorage'),
      p('เก็บ application state ข้ามเซสชัน:'),
      pre(code(...codeBlock(`import { createState, renderJson } from 'elit';

// สร้าง state
const todos = createState([
  { id: 1, text: 'เรียนรู้ Elit', completed: true },
  { id: 2, text: 'สร้างแอป', completed: false }
]);

const settings = createState({
  theme: 'dark',
  notifications: true
});

// บันทึก state
function saveState() {
  const state = {
    todos: renderJson(todos.value),
    settings: renderJson(settings.value)
  };

  localStorage.setItem('appState', JSON.stringify(state));
}

// โหลด state
function loadState() {
  const saved = localStorage.getItem('appState');

  if (saved) {
    const state = JSON.parse(saved);
    todos.value = state.todos;
    settings.value = state.settings;
  }
}

// บันทึกอัตโนมัติเมื่อมีการเปลี่ยนแปลง
todos.subscribe(() => saveState());
settings.subscribe(() => saveState());

// โหลดเมื่อเริ่มต้น
loadState();`))),

      h2('การ Cache Rendered Components'),
      h3('Server-Side Component Cache'),
      p('Cache serialized components เพื่อประสิทธิภาพที่ดีขึ้น:'),
      pre(code(...codeBlock(`import { LRUCache } from 'lru-cache';
import { renderJson } from 'elit';

const componentCache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 5 // 5 นาที
});

async function getProductCard(productId: string) {
  const cacheKey = \`product-card:\${productId}\`;

  // ตรวจสอบ cache
  const cached = componentCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // ดึงข้อมูลสินค้า
  const product = await fetchProduct(productId);

  // สร้าง component
  const card = div({ className: 'product-card' },
    h2(product.name),
    p(product.description),
    span({ className: 'price' }, \`฿\${product.price}\`)
  );

  // Serialize และ cache
  const serialized = renderJson(card);
  componentCache.set(cacheKey, serialized);

  return serialized;
}`))),

      h2('รูปแบบขั้นสูง'),
      h3('Nested Components พร้อม State'),
      p('Serialize โครงสร้างซ้อนที่ซับซ้อน:'),
      pre(code(...codeBlock(`import { renderJson, div, h2, ul, li, createState } from 'elit';

// โครงสร้างซ้อนที่ซับซ้อน
const appState = {
  user: createState({
    name: 'สมชาย ใจดี',
    email: 'somchai@example.com',
    preferences: {
      theme: 'dark',
      language: 'th'
    }
  }),
  posts: createState([
    { id: 1, title: 'โพสต์แรก', likes: 10 },
    { id: 2, title: 'โพสต์ที่สอง', likes: 25 }
  ]),
  ui: createState({
    sidebarOpen: true,
    modalVisible: false
  })
};

// Serialize application state ทั้งหมด
function serializeAppState() {
  return {
    user: renderJson(appState.user.value),
    posts: renderJson(appState.posts.value),
    ui: renderJson(appState.ui.value),
    timestamp: Date.now()
  };
}

// Export state สำหรับ debugging
console.log(JSON.stringify(serializeAppState(), null, 2));`))),

      h3('Custom Serialization Logic'),
      p('จัดการกรณีพิเศษด้วย custom serialization:'),
      pre(code(...codeBlock(`import { renderJson } from 'elit';

// Custom serializer สำหรับ Date objects
function serializeWithDates(value: any): any {
  if (value instanceof Date) {
    return {
      __type: 'Date',
      value: value.toISOString()
    };
  }

  if (Array.isArray(value)) {
    return value.map(item => serializeWithDates(item));
  }

  if (value && typeof value === 'object') {
    const result: any = {};
    for (const key in value) {
      result[key] = serializeWithDates(value[key]);
    }
    return result;
  }

  return renderJson(value);
}

// Custom deserializer
function deserializeWithDates(value: any): any {
  if (value && typeof value === 'object' && value.__type === 'Date') {
    return new Date(value.value);
  }

  if (Array.isArray(value)) {
    return value.map(item => deserializeWithDates(item));
  }

  if (value && typeof value === 'object') {
    const result: any = {};
    for (const key in value) {
      result[key] = deserializeWithDates(value[key]);
    }
    return result;
  }

  return value;
}

// การใช้งาน
const data = {
  createdAt: new Date(),
  items: [{ date: new Date('2024-01-01') }]
};

const serialized = serializeWithDates(data);
const deserialized = deserializeWithDates(serialized);`))),

      h2('การทดสอบด้วย Snapshots'),
      h3('Component Snapshot Testing'),
      p('ใช้ renderJson สำหรับการทดสอบแบบ snapshot:'),
      pre(code(...codeBlock(`import { describe, it, expect } from 'vitest';
import { renderJson, div, h1, p } from 'elit';
import { UserCard } from './UserCard';

describe('UserCard Component', () => {
  it('should match snapshot', () => {
    const user = {
      name: 'สมชาย ใจดี',
      email: 'somchai@example.com',
      avatar: '/avatar.jpg'
    };

    const card = UserCard(user);
    const snapshot = renderJson(card);

    expect(snapshot).toMatchSnapshot();
  });

  it('should serialize correctly', () => {
    const user = {
      name: 'สมหญิง รักดี',
      email: 'somying@example.com'
    };

    const card = UserCard(user);
    const json = renderJson(card);

    expect(json).toEqual({
      tag: 'div',
      props: { className: 'user-card' },
      children: [
        {
          tag: 'h1',
          children: ['สมหญิง รักดี']
        },
        {
          tag: 'p',
          children: ['somying@example.com']
        }
      ]
    });
  });
});`))),

      h2('ข้อควรพิจารณาด้านประสิทธิภาพ'),
      ul(
        li('renderJson เบาและรวดเร็วสำหรับโครงสร้างขนาดเล็กถึงกลาง'),
        li('ใช้ caching สำหรับ components ที่ serialize บ่อย'),
        li('หลีกเลี่ยงการ serialize โครงสร้างซ้อนขนาดใหญ่ซ้ำๆ'),
        li('พิจารณา streaming สำหรับชุดข้อมูลขนาดใหญ่มาก'),
        li('ลบ event handlers ก่อน serialization (ไม่สามารถ serialize ได้)'),
        li('ใช้การบีบอัด (gzip/brotli) สำหรับ API responses'),
        li('ใช้ incremental serialization สำหรับ trees ขนาดใหญ่')
      ),

      h3('Optimized Serialization'),
      pre(code(...codeBlock(`import { renderJson } from 'elit';

// Serialize เฉพาะสิ่งที่จำเป็น
function optimizedSerialize(component: VNode, options = {
  includeProps: true,
  maxDepth: 10
}) {
  const json = renderJson(component);

  // ลบข้อมูลที่ไม่จำเป็น
  function prune(node: any, depth = 0): any {
    if (depth > options.maxDepth) {
      return '[ถึงความลึกสูงสุดแล้ว]';
    }

    if (typeof node === 'string' || typeof node === 'number') {
      return node;
    }

    const result: any = { tag: node.tag };

    if (options.includeProps && node.props) {
      // รวมเฉพาะ props ที่ serialize ได้
      result.props = {};
      for (const key in node.props) {
        if (!key.startsWith('on')) { // ข้าม event handlers
          result.props[key] = node.props[key];
        }
      }
    }

    if (node.children) {
      result.children = node.children.map(
        (child: any) => prune(child, depth + 1)
      );
    }

    return result;
  }

  return prune(json);
}`))),

      h2('แนวทางปฏิบัติที่ดี'),
      ul(
        li('ตรวจสอบความถูกต้องของข้อมูลที่ deserialize ก่อนใช้งาน'),
        li('ใช้ TypeScript types สำหรับโครงสร้างที่ serialize'),
        li('ใช้ versioning สำหรับข้อมูลที่ serialize'),
        li('จัดการ errors อย่างเหมาะสมระหว่าง deserialization'),
        li('ทำความสะอาดข้อมูลก่อน serialization เพื่อป้องกัน XSS'),
        li('ใช้การบีบอัดสำหรับ payloads ขนาดใหญ่'),
        li('พิจารณาความหมายด้านความปลอดภัยของการเปิดเผย state'),
        li('จัดทำเอกสารรูปแบบ serialization ของคุณ')
      ),

      h3('Type-Safe Serialization'),
      pre(code(...codeBlock(`interface SerializedComponent {
  version: string;
  timestamp: number;
  component: any;
  state?: Record<string, any>;
}

function safeSerialize(
  component: VNode,
  state?: Record<string, any>
): SerializedComponent {
  return {
    version: '1.0.0',
    timestamp: Date.now(),
    component: renderJson(component),
    state: state ? renderJson(state) : undefined
  };
}

function safeDeserialize(
  data: SerializedComponent
): { component: any; state?: any } {
  // ตรวจสอบ version
  if (data.version !== '1.0.0') {
    throw new Error('เวอร์ชันไม่เข้ากัน');
  }

  // ตรวจสอบ timestamp (ถ้าต้องการ)
  const maxAge = 1000 * 60 * 60; // 1 ชั่วโมง
  if (Date.now() - data.timestamp > maxAge) {
    console.warn('ข้อมูลเก่าเกินไป');
  }

  return {
    component: data.component,
    state: data.state
  };
}`))),

      h2('ตัวอย่างในโลกจริง: Blog CMS'),
      p('ตัวอย่างสมบูรณ์ของการใช้ renderJson ใน blog CMS:'),
      pre(code(...codeBlock(`import express from 'express';
import { renderJson, div, h1, h2, p, article } from 'elit';

const app = express();
const db = new Map(); // Database จำลอง

// บันทึกโพสต์พร้อม serialized preview
app.post('/api/posts', async (req, res) => {
  const { title, content, author } = req.body;

  // สร้าง preview component
  const preview = article({ className: 'post-preview' },
    h2(title),
    p(content.substring(0, 200) + '...'),
    p({ className: 'author' }, \`โดย \${author}\`)
  );

  // บันทึกโพสต์พร้อม serialized preview
  const post = {
    id: Date.now().toString(),
    title,
    content,
    author,
    preview: renderJson(preview),
    createdAt: new Date().toISOString()
  };

  db.set(post.id, post);

  res.json({ success: true, post });
});

// ดึงโพสต์พร้อม preview
app.get('/api/posts/:id', (req, res) => {
  const post = db.get(req.params.id);

  if (!post) {
    return res.status(404).json({ error: 'ไม่พบโพสต์' });
  }

  res.json({ success: true, post });
});

// แสดงรายการโพสต์ทั้งหมด (เฉพาะ previews)
app.get('/api/posts', (req, res) => {
  const posts = Array.from(db.values()).map(post => ({
    id: post.id,
    title: post.title,
    author: post.author,
    preview: post.preview,
    createdAt: post.createdAt
  }));

  res.json({ success: true, posts });
});`))),

      h2('สรุป JSON Utilities'),
      p('Elit มี JSON utilities ที่ครบถ้วนสำหรับกรณีการใช้งานต่างๆ:'),
      ul(
        li('renderJson(container, json) - Render JSON data ไปยัง DOM'),
        li('renderJsonToString(json, options?) - แปลง JSON เป็น HTML string'),
        li('jsonToVNode(json) - แปลง JSON เป็น VNode object'),
        li('renderVNode(container, vnodeJson) - Render VNode JSON ไปยัง DOM'),
        li('vNodeJsonToVNode(vnodeJson) - แปลง VNode JSON เป็น VNode'),
        li('renderToString(vnode, options?) - แปลง VNode เป็น HTML string')
      ),

      h2('สรุป'),
      p('JSON utilities ของ Elit ให้วิธีที่ทรงพลังในการทำงานกับข้อมูล component ในรูปแบบ JSON ไม่ว่าคุณจะทำ SSR, สร้าง APIs ที่ return โครงสร้าง UI หรือ cache rendered output เครื่องมือเหล่านี้ทำให้ง่ายต่อการ serialize และ deserialize component structures'),
      p('สรุปสำคัญ: ใช้ renderJson และ renderJsonToString สำหรับทำงานกับ JSON data, renderToString สำหรับ SSR และ jsonToVNode สำหรับแปลง JSON กลับเป็น VNodes ตรวจสอบ JSON structures เสมอและพิจารณา cache HTML strings เพื่อประสิทธิภาพที่ดีขึ้น')
    )
  }
};
