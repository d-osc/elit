import { div, h2, h3, p, ul, li, pre, code } from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog9: BlogPostDetail = {
  id: '9',
  title: {
    en: 'Working with renderVNode in Elit',
    th: 'การทำงานกับ renderVNode ใน Elit'
  },
  date: '2024-03-05',
  author: 'n-devs',
  tags: ['Tutorial', 'API', 'VNode', 'Rendering'],
  content: {
    en: div(
      p('Learn how to use Elit\'s renderVNode utilities to work with VNode JSON structures. Perfect for dynamic UI rendering, component serialization, and bridging between server and client.'),

      h2('What is renderVNode?'),
      p('renderVNode is a set of utilities in Elit that works with VNode JSON structures. Unlike JsonNode which represents simple HTML, VNodeJson includes full type information and supports numbers as children.'),
      ul(
        li('renderVNode() - Render VNode JSON structure to DOM container'),
        li('vNodeJsonToVNode() - Convert VNode JSON to VNode object'),
        li('renderVNodeToString() - Convert VNode JSON to HTML string')
      ),

      h2('Understanding VNodeJson'),
      p('VNodeJson is a JSON-serializable representation of a VNode:'),
      pre(code(...codeBlock(`interface VNodeJson {
  tag: string;
  props?: Record<string, any>;
  children?: (string | number | VNodeJson)[];
}

// Example VNodeJson
const vnodeJson: VNodeJson = {
  tag: 'div',
  props: { className: 'counter', id: 'counter-1' },
  children: [
    { tag: 'h2', children: ['Counter'] },
    { tag: 'p', children: ['Count: ', 42] },  // Numbers supported!
    {
      tag: 'button',
      props: { className: 'btn' },
      children: ['Increment']
    }
  ]
};`))),

      h2('VNodeJson vs JsonNode'),
      p('Understanding the difference between VNodeJson and JsonNode:'),
      pre(code(...codeBlock(`// JsonNode - Simple HTML structure
interface JsonNode {
  tag: string;
  props?: Record<string, any>;
  children?: (string | JsonNode)[];  // Only strings and nested JsonNode
}

// VNodeJson - Full VNode structure
interface VNodeJson {
  tag: string;
  props?: Record<string, any>;
  children?: (string | number | VNodeJson)[];  // Includes numbers!
}

// JsonNode example
const jsonData = {
  tag: 'div',
  children: ['Count: ', '42']  // Must be strings
};

// VNodeJson example
const vnodeData = {
  tag: 'div',
  children: ['Count: ', 42]  // Can include numbers
};`))),

      h2('Basic Usage'),
      h3('Rendering VNode JSON to DOM'),
      p('Use renderVNode to render VNodeJson directly to the DOM:'),
      pre(code(...codeBlock(`import { renderVNode } from 'elit';

// VNode JSON structure
const vnodeJson = {
  tag: 'div',
  props: { className: 'card' },
  children: [
    { tag: 'h1', children: ['Welcome'] },
    { tag: 'p', children: ['You have ', 5, ' new messages'] }
  ]
};

// Render to DOM container
const element = renderVNode('#app', vnodeJson);`))),

      h3('Converting VNode JSON to VNode'),
      p('Use vNodeJsonToVNode to convert VNodeJson to a VNode object:'),
      pre(code(...codeBlock(`import { vNodeJsonToVNode } from 'elit';

const vnodeJson = {
  tag: 'article',
  props: { className: 'post' },
  children: [
    { tag: 'h2', children: ['Blog Post'] },
    { tag: 'p', children: ['Published: ', 2024, '-03-05'] }
  ]
};

// Convert to VNode
const vnode = vNodeJsonToVNode(vnodeJson);

// Now you can work with it as a regular VNode
document.body.appendChild(vnode.node);

// Or use it in other components
const wrapper = div(
  h1('Blog'),
  vnode
);`))),

      h3('Converting VNode JSON to HTML String'),
      p('Use renderVNodeToString for server-side rendering:'),
      pre(code(...codeBlock(`import { renderVNodeToString } from 'elit';

const vnodeJson = {
  tag: 'div',
  props: { className: 'widget' },
  children: [
    { tag: 'h3', children: ['Stats'] },
    { tag: 'p', children: ['Users: ', 1234] }
  ]
};

// Convert to HTML string
const html = renderVNodeToString(vnodeJson);
console.log(html);
// Output: <div class="widget"><h3>Stats</h3><p>Users: 1234</p></div>

// With pretty printing
const prettyHtml = renderVNodeToString(vnodeJson, {
  pretty: true,
  indent: 2
});`))),

      h2('Dynamic Component Rendering'),
      h3('Component Templates from API'),
      p('Store component templates as VNodeJson in your database or API:'),
      pre(code(...codeBlock(`// Server: Store templates as VNodeJson
const componentTemplates = {
  'user-card': {
    tag: 'div',
    props: { className: 'user-card' },
    children: [
      { tag: 'img', props: { src: '{{avatar}}', alt: '{{name}}' } },
      { tag: 'h3', children: ['{{name}}'] },
      { tag: 'p', children: ['{{bio}}'] }
    ]
  },
  'stat-widget': {
    tag: 'div',
    props: { className: 'stat-widget' },
    children: [
      { tag: 'div', props: { className: 'value' }, children: ['{{value}}'] },
      { tag: 'div', props: { className: 'label' }, children: ['{{label}}'] }
    ]
  }
};

// API endpoint
app.get('/api/template/:name', (req, res) => {
  const template = componentTemplates[req.params.name];
  res.json({ success: true, template });
});`))),

      h3('Client: Render Dynamic Templates'),
      p('Fetch and render templates with data interpolation:'),
      pre(code(...codeBlock(`import { vNodeJsonToVNode } from 'elit';

// Fetch template from API
async function loadTemplate(name: string, data: Record<string, any>) {
  const response = await fetch(\`/api/template/\${name}\`);
  const result = await response.json();

  if (result.success) {
    // Interpolate data into template
    const interpolated = interpolateTemplate(result.template, data);

    // Convert to VNode
    const vnode = vNodeJsonToVNode(interpolated);

    // Render to container
    const container = document.getElementById('dynamic-content');
    if (container) {
      container.innerHTML = '';
      container.appendChild(vnode.node);
    }
  }
}

// Simple template interpolation
function interpolateTemplate(template: any, data: Record<string, any>): any {
  if (typeof template === 'string') {
    return template.replace(/\\{\\{(\\w+)\\}\\}/g, (_, key) => data[key] || '');
  }

  if (Array.isArray(template)) {
    return template.map(item => interpolateTemplate(item, data));
  }

  if (typeof template === 'object' && template !== null) {
    const result: any = { ...template };
    if (result.props) {
      result.props = interpolateTemplate(result.props, data);
    }
    if (result.children) {
      result.children = interpolateTemplate(result.children, data);
    }
    return result;
  }

  return template;
}

// Usage
loadTemplate('user-card', {
  avatar: '/avatars/john.jpg',
  name: 'John Doe',
  bio: 'Software Developer'
});`))),

      h2('SSR with VNodeJson'),
      h3('Server-Side: Generate VNodeJson'),
      p('Generate VNodeJson on the server for SSR:'),
      pre(code(...codeBlock(`import express from 'express';
import { renderVNodeToString } from 'elit';

const app = express();

app.get('/product/:id', async (req, res) => {
  // Fetch product data
  const product = await db.products.findById(req.params.id);

  // Create VNodeJson structure
  const vnodeJson = {
    tag: 'div',
    props: { className: 'product-page', 'data-product-id': product.id },
    children: [
      {
        tag: 'div',
        props: { className: 'product-header' },
        children: [
          { tag: 'h1', children: [product.name] },
          {
            tag: 'div',
            props: { className: 'price' },
            children: ['$', product.price]
          }
        ]
      },
      {
        tag: 'div',
        props: { className: 'product-details' },
        children: [
          { tag: 'p', children: [product.description] },
          {
            tag: 'button',
            props: {
              id: 'add-to-cart',
              className: 'btn-primary'
            },
            children: ['Add to Cart']
          }
        ]
      }
    ]
  };

  // Convert to HTML string
  const html = renderVNodeToString(vnodeJson);

  // Send full page with embedded VNodeJson for hydration
  res.send(\`
    <!DOCTYPE html>
    <html>
      <head>
        <title>\${product.name}</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        \${html}
        <script>
          window.__VNODE_DATA__ = \${JSON.stringify(vnodeJson)};
          window.__PRODUCT_DATA__ = \${JSON.stringify(product)};
        </script>
        <script src="/bundle.js"></script>
      </body>
    </html>
  \`);
});`))),

      h3('Client-Side: Hydrate from VNodeJson'),
      p('Hydrate the server-rendered content on the client:'),
      pre(code(...codeBlock(`import { vNodeJsonToVNode } from 'elit';

// Get VNode data from server
const vnodeData = window.__VNODE_DATA__;
const productData = window.__PRODUCT_DATA__;

// Find the add-to-cart button and attach handler
const addToCartBtn = document.getElementById('add-to-cart');
if (addToCartBtn) {
  addToCartBtn.addEventListener('click', () => {
    addToCart(productData.id);
  });
}

function addToCart(productId: string) {
  fetch('/api/cart/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId })
  })
  .then(response => response.json())
  .then(data => {
    console.log('Added to cart:', data);
    updateCartUI();
  });
}`))),

      h2('Real-Time UI Updates'),
      h3('WebSocket with VNodeJson'),
      p('Send UI updates over WebSocket as VNodeJson:'),
      pre(code(...codeBlock(`// Server: Send VNodeJson over WebSocket
import { Server } from 'ws';

const wss = new Server({ port: 8080 });

wss.on('connection', (ws) => {
  // Send initial UI
  const welcomeWidget = {
    tag: 'div',
    props: { className: 'welcome-widget' },
    children: [
      { tag: 'h2', children: ['Welcome!'] },
      { tag: 'p', children: ['Connected at: ', Date.now()] }
    ]
  };

  ws.send(JSON.stringify({
    type: 'render',
    vnode: welcomeWidget
  }));

  // Send updates periodically
  const interval = setInterval(() => {
    const statsWidget = {
      tag: 'div',
      props: { className: 'stats-widget' },
      children: [
        { tag: 'h3', children: ['Server Stats'] },
        { tag: 'p', children: ['Active users: ', Math.floor(Math.random() * 100)] },
        { tag: 'p', children: ['Requests/sec: ', Math.floor(Math.random() * 1000)] }
      ]
    };

    ws.send(JSON.stringify({
      type: 'update',
      target: '.stats-container',
      vnode: statsWidget
    }));
  }, 5000);

  ws.on('close', () => clearInterval(interval));
});`))),

      h3('Client: Render WebSocket Updates'),
      p('Receive and render VNodeJson from WebSocket:'),
      pre(code(...codeBlock(`import { renderVNode, vNodeJsonToVNode } from 'elit';

const ws = new WebSocket('ws://localhost:8080');

ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'render':
      // Render new VNode
      renderVNode('#widget-container', message.vnode);
      break;

    case 'update':
      // Update specific container
      const container = document.querySelector(message.target);
      if (container) {
        const vnode = vNodeJsonToVNode(message.vnode);
        container.innerHTML = '';
        container.appendChild(vnode.node);
      }
      break;

    case 'append':
      // Append to container
      const appendContainer = document.querySelector(message.target);
      if (appendContainer) {
        const vnode = vNodeJsonToVNode(message.vnode);
        appendContainer.appendChild(vnode.node);
      }
      break;
  }
});`))),

      h2('Component Library with VNodeJson'),
      h3('Creating Reusable Component Templates'),
      p('Build a library of component templates:'),
      pre(code(...codeBlock(`// Component library stored as VNodeJson
export const componentLibrary = {
  button: (text: string, variant: string = 'primary') => ({
    tag: 'button',
    props: { className: \`btn btn-\${variant}\` },
    children: [text]
  }),

  card: (title: string, content: string) => ({
    tag: 'div',
    props: { className: 'card' },
    children: [
      { tag: 'h3', props: { className: 'card-title' }, children: [title] },
      { tag: 'div', props: { className: 'card-content' }, children: [content] }
    ]
  }),

  alert: (message: string, type: string = 'info') => ({
    tag: 'div',
    props: {
      className: \`alert alert-\${type}\`,
      role: 'alert'
    },
    children: [message]
  }),

  list: (items: string[]) => ({
    tag: 'ul',
    props: { className: 'list' },
    children: items.map(item => ({
      tag: 'li',
      children: [item]
    }))
  })
};

// Usage
import { renderVNode } from 'elit';

// Render components from library
renderVNode('#app', componentLibrary.button('Click Me', 'success'));
renderVNode('#alerts', componentLibrary.alert('Operation successful!', 'success'));
renderVNode('#card-container', componentLibrary.card('Title', 'Card content here'));`))),

      h2('Caching and Performance'),
      h3('Caching VNodeJson Structures'),
      p('Cache frequently used VNodeJson for better performance:'),
      pre(code(...codeBlock(`class VNodeCache {
  private cache = new Map<string, VNodeJson>();

  set(key: string, vnode: VNodeJson): void {
    this.cache.set(key, vnode);
  }

  get(key: string): VNodeJson | undefined {
    return this.cache.get(key);
  }

  getOrCreate(key: string, factory: () => VNodeJson): VNodeJson {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const vnode = factory();
    this.cache.set(key, vnode);
    return vnode;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Usage
const vnodeCache = new VNodeCache();

function renderUserCard(userId: string) {
  const vnode = vnodeCache.getOrCreate(\`user-card-\${userId}\`, () => ({
    tag: 'div',
    props: { className: 'user-card', 'data-user-id': userId },
    children: [
      { tag: 'h3', children: [\`User \${userId}\`] },
      { tag: 'p', children: ['Loading...'] }
    ]
  }));

  return renderVNode('#user-container', vnode);
}`))),

      h2('Best Practices'),
      ul(
        li('Use renderVNode for dynamic UI that comes from external sources (APIs, databases)'),
        li('Use vNodeJsonToVNode when you need to manipulate VNodes before rendering'),
        li('Use renderVNodeToString for SSR scenarios'),
        li('Cache frequently used VNodeJson structures to avoid recreation'),
        li('Validate VNodeJson data from external sources before rendering'),
        li('Use TypeScript types (VNodeJson) for type safety'),
        li('Consider gzip compression when sending VNodeJson over the network'),
        li('For simple HTML structures, prefer JsonNode over VNodeJson')
      ),

      h2('Complete Example: Dynamic Dashboard'),
      p('Here\'s a complete example of a dynamic dashboard using renderVNode:'),
      pre(code(...codeBlock(`import { renderVNode, vNodeJsonToVNode } from 'elit';

// Widget factory
function createWidget(type: string, data: any): VNodeJson {
  const widgets: Record<string, VNodeJson> = {
    'stats': {
      tag: 'div',
      props: { className: 'widget widget-stats' },
      children: [
        { tag: 'h3', children: [data.title] },
        { tag: 'div', props: { className: 'stat-value' }, children: [data.value] },
        { tag: 'div', props: { className: 'stat-change' }, children: [data.change, '%'] }
      ]
    },
    'chart': {
      tag: 'div',
      props: { className: 'widget widget-chart' },
      children: [
        { tag: 'h3', children: [data.title] },
        { tag: 'canvas', props: { id: data.chartId, width: 300, height: 200 } }
      ]
    },
    'list': {
      tag: 'div',
      props: { className: 'widget widget-list' },
      children: [
        { tag: 'h3', children: [data.title] },
        {
          tag: 'ul',
          children: data.items.map((item: string) => ({
            tag: 'li',
            children: [item]
          }))
        }
      ]
    }
  };

  return widgets[type] || { tag: 'div', children: ['Unknown widget'] };
}

// Dashboard manager
class Dashboard {
  private widgets: VNodeJson[] = [];

  addWidget(type: string, data: any): void {
    const widget = createWidget(type, data);
    this.widgets.push(widget);
    this.render();
  }

  render(): void {
    const dashboard: VNodeJson = {
      tag: 'div',
      props: { className: 'dashboard' },
      children: this.widgets
    };

    renderVNode('#dashboard-container', dashboard);
  }

  clear(): void {
    this.widgets = [];
    this.render();
  }
}

// Usage
const dashboard = new Dashboard();

dashboard.addWidget('stats', {
  title: 'Total Users',
  value: 1234,
  change: 12
});

dashboard.addWidget('list', {
  title: 'Recent Activity',
  items: ['User logged in', 'New post created', 'Comment added']
});

dashboard.addWidget('chart', {
  title: 'Revenue',
  chartId: 'revenue-chart'
});`))),

      h2('Conclusion'),
      p('renderVNode and its related utilities provide powerful ways to work with VNode JSON structures in Elit. Whether you\'re building dynamic UIs, implementing SSR, or creating component libraries, these tools make it easy to serialize, transfer, and render component structures.'),
      p('Key takeaways: Use renderVNode for rendering VNodeJson to DOM, vNodeJsonToVNode for converting to VNode objects, and renderVNodeToString for SSR. Always validate external VNodeJson data and consider caching for better performance.')
    ),
    th: div(
      p('เรียนรู้วิธีใช้ renderVNode utilities ของ Elit สำหรับทำงานกับ VNode JSON structures เหมาะสำหรับการ render UI แบบ dynamic, serialization ของ component และเชื่อมต่อระหว่าง server และ client'),

      h2('renderVNode คืออะไร?'),
      p('renderVNode คือชุด utilities ใน Elit ที่ทำงานกับ VNode JSON structures แตกต่างจาก JsonNode ที่แทน HTML แบบธรรมดา VNodeJson มีข้อมูล type เต็มรูปแบบและรองรับตัวเลขใน children'),
      ul(
        li('renderVNode() - Render VNode JSON structure ไปยัง DOM container'),
        li('vNodeJsonToVNode() - แปลง VNode JSON เป็น VNode object'),
        li('renderVNodeToString() - แปลง VNode JSON เป็น HTML string')
      ),

      h2('ทำความเข้าใจ VNodeJson'),
      p('VNodeJson คือการแทนค่า VNode ในรูปแบบที่ serialize เป็น JSON ได้:'),
      pre(code(...codeBlock(`interface VNodeJson {
  tag: string;
  props?: Record<string, any>;
  children?: (string | number | VNodeJson)[];
}

// ตัวอย่าง VNodeJson
const vnodeJson: VNodeJson = {
  tag: 'div',
  props: { className: 'counter', id: 'counter-1' },
  children: [
    { tag: 'h2', children: ['ตัวนับ'] },
    { tag: 'p', children: ['จำนวน: ', 42] },  // รองรับตัวเลข!
    {
      tag: 'button',
      props: { className: 'btn' },
      children: ['เพิ่ม']
    }
  ]
};`))),

      h2('VNodeJson vs JsonNode'),
      p('ความแตกต่างระหว่าง VNodeJson และ JsonNode:'),
      pre(code(...codeBlock(`// JsonNode - โครงสร้าง HTML แบบง่าย
interface JsonNode {
  tag: string;
  props?: Record<string, any>;
  children?: (string | JsonNode)[];  // เฉพาะ strings และ JsonNode
}

// VNodeJson - โครงสร้าง VNode แบบเต็ม
interface VNodeJson {
  tag: string;
  props?: Record<string, any>;
  children?: (string | number | VNodeJson)[];  // รวมตัวเลขด้วย!
}

// ตัวอย่าง JsonNode
const jsonData = {
  tag: 'div',
  children: ['จำนวน: ', '42']  // ต้องเป็น strings
};

// ตัวอย่าง VNodeJson
const vnodeData = {
  tag: 'div',
  children: ['จำนวน: ', 42]  // ใช้ตัวเลขได้
};`))),

      h2('การใช้งานพื้นฐาน'),
      h3('Rendering VNode JSON ไปยัง DOM'),
      p('ใช้ renderVNode เพื่อ render VNodeJson โดยตรงไปยัง DOM:'),
      pre(code(...codeBlock(`import { renderVNode } from 'elit';

// โครงสร้าง VNode JSON
const vnodeJson = {
  tag: 'div',
  props: { className: 'card' },
  children: [
    { tag: 'h1', children: ['ยินดีต้อนรับ'] },
    { tag: 'p', children: ['คุณมีข้อความใหม่ ', 5, ' ข้อความ'] }
  ]
};

// Render ไปยัง DOM container
const element = renderVNode('#app', vnodeJson);`))),

      h3('แปลง VNode JSON เป็น VNode'),
      p('ใช้ vNodeJsonToVNode เพื่อแปลง VNodeJson เป็น VNode object:'),
      pre(code(...codeBlock(`import { vNodeJsonToVNode } from 'elit';

const vnodeJson = {
  tag: 'article',
  props: { className: 'post' },
  children: [
    { tag: 'h2', children: ['บล็อกโพสต์'] },
    { tag: 'p', children: ['เผยแพร่: ', 2024, '-03-05'] }
  ]
};

// แปลงเป็น VNode
const vnode = vNodeJsonToVNode(vnodeJson);

// ตอนนี้สามารถใช้งานเหมือน VNode ปกติ
document.body.appendChild(vnode.node);

// หรือใช้ใน components อื่น
const wrapper = div(
  h1('บล็อก'),
  vnode
);`))),

      h3('แปลง VNode JSON เป็น HTML String'),
      p('ใช้ renderVNodeToString สำหรับ server-side rendering:'),
      pre(code(...codeBlock(`import { renderVNodeToString } from 'elit';

const vnodeJson = {
  tag: 'div',
  props: { className: 'widget' },
  children: [
    { tag: 'h3', children: ['สถิติ'] },
    { tag: 'p', children: ['ผู้ใช้: ', 1234] }
  ]
};

// แปลงเป็น HTML string
const html = renderVNodeToString(vnodeJson);
console.log(html);
// Output: <div class="widget"><h3>สถิติ</h3><p>ผู้ใช้: 1234</p></div>

// พร้อม pretty printing
const prettyHtml = renderVNodeToString(vnodeJson, {
  pretty: true,
  indent: 2
});`))),

      h2('การ Render Component แบบ Dynamic'),
      h3('Component Templates จาก API'),
      p('เก็บ component templates เป็น VNodeJson ใน database หรือ API:'),
      pre(code(...codeBlock(`// Server: เก็บ templates เป็น VNodeJson
const componentTemplates = {
  'user-card': {
    tag: 'div',
    props: { className: 'user-card' },
    children: [
      { tag: 'img', props: { src: '{{avatar}}', alt: '{{name}}' } },
      { tag: 'h3', children: ['{{name}}'] },
      { tag: 'p', children: ['{{bio}}'] }
    ]
  },
  'stat-widget': {
    tag: 'div',
    props: { className: 'stat-widget' },
    children: [
      { tag: 'div', props: { className: 'value' }, children: ['{{value}}'] },
      { tag: 'div', props: { className: 'label' }, children: ['{{label}}'] }
    ]
  }
};

// API endpoint
app.get('/api/template/:name', (req, res) => {
  const template = componentTemplates[req.params.name];
  res.json({ success: true, template });
});`))),

      h3('Client: Render Dynamic Templates'),
      p('ดึงและ render templates พร้อม interpolation ข้อมูล:'),
      pre(code(...codeBlock(`import { vNodeJsonToVNode } from 'elit';

// ดึง template จาก API
async function loadTemplate(name: string, data: Record<string, any>) {
  const response = await fetch(\`/api/template/\${name}\`);
  const result = await response.json();

  if (result.success) {
    // Interpolate ข้อมูลเข้าไปใน template
    const interpolated = interpolateTemplate(result.template, data);

    // แปลงเป็น VNode
    const vnode = vNodeJsonToVNode(interpolated);

    // Render ไปยัง container
    const container = document.getElementById('dynamic-content');
    if (container) {
      container.innerHTML = '';
      container.appendChild(vnode.node);
    }
  }
}

// Template interpolation แบบง่าย
function interpolateTemplate(template: any, data: Record<string, any>): any {
  if (typeof template === 'string') {
    return template.replace(/\\{\\{(\\w+)\\}\\}/g, (_, key) => data[key] || '');
  }

  if (Array.isArray(template)) {
    return template.map(item => interpolateTemplate(item, data));
  }

  if (typeof template === 'object' && template !== null) {
    const result: any = { ...template };
    if (result.props) {
      result.props = interpolateTemplate(result.props, data);
    }
    if (result.children) {
      result.children = interpolateTemplate(result.children, data);
    }
    return result;
  }

  return template;
}

// การใช้งาน
loadTemplate('user-card', {
  avatar: '/avatars/john.jpg',
  name: 'จอห์น โด',
  bio: 'นักพัฒนาซอฟต์แวร์'
});`))),

      h2('SSR ด้วย VNodeJson'),
      h3('Server-Side: สร้าง VNodeJson'),
      p('สร้าง VNodeJson บน server สำหรับ SSR:'),
      pre(code(...codeBlock(`import express from 'express';
import { renderVNodeToString } from 'elit';

const app = express();

app.get('/product/:id', async (req, res) => {
  // ดึงข้อมูลสินค้า
  const product = await db.products.findById(req.params.id);

  // สร้างโครงสร้าง VNodeJson
  const vnodeJson = {
    tag: 'div',
    props: { className: 'product-page', 'data-product-id': product.id },
    children: [
      {
        tag: 'div',
        props: { className: 'product-header' },
        children: [
          { tag: 'h1', children: [product.name] },
          {
            tag: 'div',
            props: { className: 'price' },
            children: ['฿', product.price]
          }
        ]
      },
      {
        tag: 'div',
        props: { className: 'product-details' },
        children: [
          { tag: 'p', children: [product.description] },
          {
            tag: 'button',
            props: {
              id: 'add-to-cart',
              className: 'btn-primary'
            },
            children: ['เพิ่มลงตะกร้า']
          }
        ]
      }
    ]
  };

  // แปลงเป็น HTML string
  const html = renderVNodeToString(vnodeJson);

  // ส่งหน้าเว็บพร้อม VNodeJson ที่ฝังไว้สำหรับ hydration
  res.send(\`
    <!DOCTYPE html>
    <html>
      <head>
        <title>\${product.name}</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        \${html}
        <script>
          window.__VNODE_DATA__ = \${JSON.stringify(vnodeJson)};
          window.__PRODUCT_DATA__ = \${JSON.stringify(product)};
        </script>
        <script src="/bundle.js"></script>
      </body>
    </html>
  \`);
});`))),

      h3('Client-Side: Hydrate จาก VNodeJson'),
      p('Hydrate เนื้อหาที่ render จาก server บน client:'),
      pre(code(...codeBlock(`import { vNodeJsonToVNode } from 'elit';

// รับข้อมูล VNode จาก server
const vnodeData = window.__VNODE_DATA__;
const productData = window.__PRODUCT_DATA__;

// หาปุ่ม add-to-cart และผูก handler
const addToCartBtn = document.getElementById('add-to-cart');
if (addToCartBtn) {
  addToCartBtn.addEventListener('click', () => {
    addToCart(productData.id);
  });
}

function addToCart(productId: string) {
  fetch('/api/cart/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId })
  })
  .then(response => response.json())
  .then(data => {
    console.log('เพิ่มลงตะกร้าแล้ว:', data);
    updateCartUI();
  });
}`))),

      h2('Real-Time UI Updates'),
      h3('WebSocket กับ VNodeJson'),
      p('ส่ง UI updates ผ่าน WebSocket เป็น VNodeJson:'),
      pre(code(...codeBlock(`// Server: ส่ง VNodeJson ผ่าน WebSocket
import { Server } from 'ws';

const wss = new Server({ port: 8080 });

wss.on('connection', (ws) => {
  // ส่ง UI เริ่มต้น
  const welcomeWidget = {
    tag: 'div',
    props: { className: 'welcome-widget' },
    children: [
      { tag: 'h2', children: ['ยินดีต้อนรับ!'] },
      { tag: 'p', children: ['เชื่อมต่อเมื่อ: ', Date.now()] }
    ]
  };

  ws.send(JSON.stringify({
    type: 'render',
    vnode: welcomeWidget
  }));

  // ส่ง updates เป็นระยะ
  const interval = setInterval(() => {
    const statsWidget = {
      tag: 'div',
      props: { className: 'stats-widget' },
      children: [
        { tag: 'h3', children: ['สถิติเซิร์ฟเวอร์'] },
        { tag: 'p', children: ['ผู้ใช้งาน: ', Math.floor(Math.random() * 100)] },
        { tag: 'p', children: ['Requests/วินาที: ', Math.floor(Math.random() * 1000)] }
      ]
    };

    ws.send(JSON.stringify({
      type: 'update',
      target: '.stats-container',
      vnode: statsWidget
    }));
  }, 5000);

  ws.on('close', () => clearInterval(interval));
});`))),

      h3('Client: Render WebSocket Updates'),
      p('รับและ render VNodeJson จาก WebSocket:'),
      pre(code(...codeBlock(`import { renderVNode, vNodeJsonToVNode } from 'elit';

const ws = new WebSocket('ws://localhost:8080');

ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'render':
      // Render VNode ใหม่
      renderVNode('#widget-container', message.vnode);
      break;

    case 'update':
      // Update container เฉพาะ
      const container = document.querySelector(message.target);
      if (container) {
        const vnode = vNodeJsonToVNode(message.vnode);
        container.innerHTML = '';
        container.appendChild(vnode.node);
      }
      break;

    case 'append':
      // เพิ่มเข้าไปใน container
      const appendContainer = document.querySelector(message.target);
      if (appendContainer) {
        const vnode = vNodeJsonToVNode(message.vnode);
        appendContainer.appendChild(vnode.node);
      }
      break;
  }
});`))),

      h2('Component Library ด้วย VNodeJson'),
      h3('สร้าง Component Templates ที่ใช้ซ้ำได้'),
      p('สร้าง library ของ component templates:'),
      pre(code(...codeBlock(`// Component library เก็บเป็น VNodeJson
export const componentLibrary = {
  button: (text: string, variant: string = 'primary') => ({
    tag: 'button',
    props: { className: \`btn btn-\${variant}\` },
    children: [text]
  }),

  card: (title: string, content: string) => ({
    tag: 'div',
    props: { className: 'card' },
    children: [
      { tag: 'h3', props: { className: 'card-title' }, children: [title] },
      { tag: 'div', props: { className: 'card-content' }, children: [content] }
    ]
  }),

  alert: (message: string, type: string = 'info') => ({
    tag: 'div',
    props: {
      className: \`alert alert-\${type}\`,
      role: 'alert'
    },
    children: [message]
  }),

  list: (items: string[]) => ({
    tag: 'ul',
    props: { className: 'list' },
    children: items.map(item => ({
      tag: 'li',
      children: [item]
    }))
  })
};

// การใช้งาน
import { renderVNode } from 'elit';

// Render components จาก library
renderVNode('#app', componentLibrary.button('คลิกฉัน', 'success'));
renderVNode('#alerts', componentLibrary.alert('ดำเนินการสำเร็จ!', 'success'));
renderVNode('#card-container', componentLibrary.card('หัวข้อ', 'เนื้อหาการ์ด'));`))),

      h2('Caching และ Performance'),
      h3('Cache VNodeJson Structures'),
      p('Cache VNodeJson ที่ใช้บ่อยเพื่อประสิทธิภาพที่ดีขึ้น:'),
      pre(code(...codeBlock(`class VNodeCache {
  private cache = new Map<string, VNodeJson>();

  set(key: string, vnode: VNodeJson): void {
    this.cache.set(key, vnode);
  }

  get(key: string): VNodeJson | undefined {
    return this.cache.get(key);
  }

  getOrCreate(key: string, factory: () => VNodeJson): VNodeJson {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const vnode = factory();
    this.cache.set(key, vnode);
    return vnode;
  }

  clear(): void {
    this.cache.clear();
  }
}

// การใช้งาน
const vnodeCache = new VNodeCache();

function renderUserCard(userId: string) {
  const vnode = vnodeCache.getOrCreate(\`user-card-\${userId}\`, () => ({
    tag: 'div',
    props: { className: 'user-card', 'data-user-id': userId },
    children: [
      { tag: 'h3', children: [\`ผู้ใช้ \${userId}\`] },
      { tag: 'p', children: ['กำลังโหลด...'] }
    ]
  }));

  return renderVNode('#user-container', vnode);
}`))),

      h2('Best Practices'),
      ul(
        li('ใช้ renderVNode สำหรับ dynamic UI ที่มาจากแหล่งภายนอก (APIs, databases)'),
        li('ใช้ vNodeJsonToVNode เมื่อต้องการจัดการ VNodes ก่อน rendering'),
        li('ใช้ renderVNodeToString สำหรับ SSR scenarios'),
        li('Cache โครงสร้าง VNodeJson ที่ใช้บ่อยเพื่อหลีกเลี่ยงการสร้างใหม่'),
        li('ตรวจสอบ VNodeJson data จากแหล่งภายนอกก่อน rendering'),
        li('ใช้ TypeScript types (VNodeJson) เพื่อ type safety'),
        li('พิจารณา gzip compression เมื่อส่ง VNodeJson ผ่าน network'),
        li('สำหรับโครงสร้าง HTML แบบง่าย ให้ใช้ JsonNode แทน VNodeJson')
      ),

      h2('ตัวอย่างสมบูรณ์: Dynamic Dashboard'),
      p('ตัวอย่างสมบูรณ์ของ dynamic dashboard โดยใช้ renderVNode:'),
      pre(code(...codeBlock(`import { renderVNode, vNodeJsonToVNode } from 'elit';

// Widget factory
function createWidget(type: string, data: any): VNodeJson {
  const widgets: Record<string, VNodeJson> = {
    'stats': {
      tag: 'div',
      props: { className: 'widget widget-stats' },
      children: [
        { tag: 'h3', children: [data.title] },
        { tag: 'div', props: { className: 'stat-value' }, children: [data.value] },
        { tag: 'div', props: { className: 'stat-change' }, children: [data.change, '%'] }
      ]
    },
    'chart': {
      tag: 'div',
      props: { className: 'widget widget-chart' },
      children: [
        { tag: 'h3', children: [data.title] },
        { tag: 'canvas', props: { id: data.chartId, width: 300, height: 200 } }
      ]
    },
    'list': {
      tag: 'div',
      props: { className: 'widget widget-list' },
      children: [
        { tag: 'h3', children: [data.title] },
        {
          tag: 'ul',
          children: data.items.map((item: string) => ({
            tag: 'li',
            children: [item]
          }))
        }
      ]
    }
  };

  return widgets[type] || { tag: 'div', children: ['Widget ไม่รู้จัก'] };
}

// Dashboard manager
class Dashboard {
  private widgets: VNodeJson[] = [];

  addWidget(type: string, data: any): void {
    const widget = createWidget(type, data);
    this.widgets.push(widget);
    this.render();
  }

  render(): void {
    const dashboard: VNodeJson = {
      tag: 'div',
      props: { className: 'dashboard' },
      children: this.widgets
    };

    renderVNode('#dashboard-container', dashboard);
  }

  clear(): void {
    this.widgets = [];
    this.render();
  }
}

// การใช้งาน
const dashboard = new Dashboard();

dashboard.addWidget('stats', {
  title: 'ผู้ใช้ทั้งหมด',
  value: 1234,
  change: 12
});

dashboard.addWidget('list', {
  title: 'กิจกรรมล่าสุด',
  items: ['ผู้ใช้เข้าสู่ระบบ', 'สร้างโพสต์ใหม่', 'เพิ่มความคิดเห็น']
});

dashboard.addWidget('chart', {
  title: 'รายได้',
  chartId: 'revenue-chart'
});`))),

      h2('สรุป'),
      p('renderVNode และ utilities ที่เกี่ยวข้องให้วิธีที่ทรงพลังในการทำงานกับ VNode JSON structures ใน Elit ไม่ว่าคุณจะสร้าง dynamic UIs, ทำ SSR หรือสร้าง component libraries เครื่องมือเหล่านี้ทำให้ง่ายต่อการ serialize, transfer และ render component structures'),
      p('สรุปสำคัญ: ใช้ renderVNode สำหรับ rendering VNodeJson ไปยัง DOM, vNodeJsonToVNode สำหรับแปลงเป็น VNode objects และ renderVNodeToString สำหรับ SSR ตรวจสอบ VNodeJson data จากภายนอกเสมอและพิจารณา caching เพื่อประสิทธิภาพที่ดีขึ้น')
    )
  }
};
