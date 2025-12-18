import { div, h1, h2, h3, p, ul, li, pre, code, strong } from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog8: BlogPostDetail = {
  id: '8',
  title: {
    en: 'Server-Side Rendering (SSR) with Elit',
    th: 'Server-Side Rendering (SSR) ด้วย Elit'
  },
  date: '2024-12-18',
  author: 'n-devs',
  tags: ['Tutorial', 'SSR', 'Full-Stack', 'Performance', 'v2.0'],
  content: {
    en: div(
      p('Server-Side Rendering (SSR) in Elit enables you to render your application on the server and send fully-formed HTML to the client. This improves initial load performance, SEO, and provides a better user experience.'),

      h2('Why Server-Side Rendering?'),
      p('SSR provides several key benefits:'),
      ul(
        li(strong('Faster Initial Load'), ' - Users see content immediately without waiting for JavaScript'),
        li(strong('Better SEO'), ' - Search engines can crawl fully-rendered HTML'),
        li(strong('Social Media Previews'), ' - OG tags and meta descriptions work correctly'),
        li(strong('Improved Performance'), ' - Reduced time-to-interactive on slow connections'),
        li(strong('Progressive Enhancement'), ' - Content works even if JavaScript fails'),
        li(strong('Better Core Web Vitals'), ' - Improved FCP, LCP, and CLS scores')
      ),

      h2('Basic SSR Setup'),
      h3('1. Server-Side: Render HTML'),
      p('Use Elit components on the server to generate HTML:'),

      pre(code(...codeBlock(`// server.ts
import { defineConfig } from 'elit/config';
import { div, h1, p, button, html } from 'elit/el';
import { ServerRouter } from 'elit';

const api = new ServerRouter();

api.get('/', (ctx) => {
  // Create your app component
  const app = div({ id: 'app' },
    h1('Welcome to Elit SSR'),
    p('This content is rendered on the server!'),
    button({ className: 'cta' }, 'Get Started')
  );

  // Render to HTML string
  const appHtml = app.node.outerHTML;

  // Send complete HTML document
  html(ctx.res, \`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Elit SSR App</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        \${appHtml}
        <script type="module" src="/client.js"></script>
      </body>
    </html>
  \`);
});

export default defineConfig({
  dev: { port: 3000, api }
});`))),

      h3('2. Client-Side: Hydration'),
      p('On the client, attach event handlers to server-rendered HTML:'),

      pre(code(...codeBlock(`// client.ts
import { dom } from 'elit/dom';

// Find server-rendered elements
const button = document.querySelector('.cta');

// Attach client-side behavior
if (button) {
  button.addEventListener('click', () => {
    window.location.href = '/getting-started';
  });
}

console.log('Client hydrated!');`))),

      h2('SSR with State Management'),
      h3('Server: Generate HTML with Initial State'),
      p('Pass initial state from server to client:'),

      pre(code(...codeBlock(`// server.ts
import { html } from 'elit';
import { div, h1, span, button, script } from 'elit/el';
import { ServerRouter } from 'elit/server';

const api = new ServerRouter();

api.get('/counter', (ctx) => {
  const initialCount = 0;

  // Create component with initial state
  const app = div({ id: 'app' },
    h1('Server-Rendered Counter'),
    div({ className: 'counter' },
      span({ id: 'count', className: 'count' }, String(initialCount)),
      div({ className: 'buttons' },
        button({ id: 'decrement', className: 'btn' }, '-'),
        button({ id: 'increment', className: 'btn' }, '+')
      )
    )
  );

  const appHtml = app.node.outerHTML;

  html(ctx.res, \`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SSR Counter</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        \${appHtml}
        <script>
          // Embed initial state in HTML
          window.__INITIAL_STATE__ = { count: \${initialCount} };
        </script>
        <script type="module" src="/counter-client.js"></script>
      </body>
    </html>
  \`);
});`))),

      h3('Client: Hydrate with Reactive State'),
      p('Restore state and make it reactive on the client:'),

      pre(code(...codeBlock(`// counter-client.ts
import { createState } from 'elit/state';

// Get initial state from server
const initialState = (window as any).__INITIAL_STATE__;

// Create reactive state
const count = createState(initialState.count);

// Find DOM elements
const countEl = document.getElementById('count');
const decrementBtn = document.getElementById('decrement');
const incrementBtn = document.getElementById('increment');

// Subscribe to state changes
if (countEl) {
  count.subscribe(value => {
    countEl.textContent = String(value);
  });
}

// Attach event handlers
if (decrementBtn) {
  decrementBtn.addEventListener('click', () => {
    count.value--;
  });
}

if (incrementBtn) {
  incrementBtn.addEventListener('click', () => {
    count.value++;
  });
}`))),

      h2('SSR with Data Fetching'),
      h3('Fetch Data on Server'),
      p('Load data server-side before rendering:'),

      pre(code(...codeBlock(`// server.ts
import { html, json } from 'elit';
import { div, h1, ul, li, p } from 'elit/el';
import { ServerRouter } from 'elit/server';

const api = new ServerRouter();

// Mock database
async function fetchUsers() {
  return [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com' }
  ];
}

api.get('/users', async (ctx) => {
  // Fetch data on server
  const users = await fetchUsers();

  // Render with data
  const app = div({ id: 'app' },
    h1('Users (SSR)'),
    ul({ className: 'user-list' },
      ...users.map(user =>
        li({ key: user.id, className: 'user-item' },
          p(strong(user.name)),
          p(user.email)
        )
      )
    )
  );

  const appHtml = app.node.outerHTML;

  html(ctx.res, \`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Users List</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        \${appHtml}
        <script>
          window.__INITIAL_DATA__ = \${JSON.stringify({ users })};
        </script>
        <script type="module" src="/users-client.js"></script>
      </body>
    </html>
  \`);
});`))),

      h2('SEO Optimization'),
      h3('Dynamic Meta Tags'),
      p('Generate SEO-friendly meta tags based on content:'),

      pre(code(...codeBlock(`// server.ts
import { html } from 'elit/el';
import { ServerRouter } from 'elit/server';

interface PageMeta {
  title: string;
  description: string;
  image?: string;
  url: string;
}

function generateMetaTags(meta: PageMeta): string {
  return \`
    <title>\${meta.title}</title>
    <meta name="description" content="\${meta.description}">

    <!-- Open Graph -->
    <meta property="og:title" content="\${meta.title}">
    <meta property="og:description" content="\${meta.description}">
    <meta property="og:url" content="\${meta.url}">
    \${meta.image ? \`<meta property="og:image" content="\${meta.image}">\` : ''}

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="\${meta.title}">
    <meta name="twitter:description" content="\${meta.description}">
    \${meta.image ? \`<meta name="twitter:image" content="\${meta.image}">\` : ''}
  \`;
}

const api = new ServerRouter();

api.get('/blog/:slug', async (ctx) => {
  const { slug } = ctx.params;

  // Fetch blog post
  const post = await fetchBlogPost(slug);

  if (!post) {
    return html(ctx.res, '<h1>404 - Not Found</h1>', 404);
  }

  const meta: PageMeta = {
    title: \`\${post.title} | My Blog\`,
    description: post.excerpt,
    image: post.coverImage,
    url: \`https://myblog.com/blog/\${slug}\`
  };

  const metaTags = generateMetaTags(meta);

  // Render blog post component
  const app = div({ id: 'app' },
    article({ className: 'blog-post' },
      h1(post.title),
      p({ className: 'meta' }, \`By \${post.author} on \${post.date}\`),
      div({ className: 'content' }, post.content)
    )
  );

  const appHtml = app.node.outerHTML;

  html(ctx.res, \`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        \${metaTags}
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        \${appHtml}
        <script type="module" src="/blog-client.js"></script>
      </body>
    </html>
  \`);
});`))),

      h2('SSR with Routing'),
      h3('Multi-Page SSR Application'),
      p('Handle multiple routes with SSR:'),

      pre(code(...codeBlock(`// server.ts
import { defineConfig } from 'elit/config';
import { div, h1, p, nav, a, html } from 'elit/dom';
import { ServerRouter } from 'elit/server';

const api = new ServerRouter();

// Layout component
function Layout(content: any, currentPath: string) {
  return div({ id: 'app' },
    nav({ className: 'nav' },
      a({
        href: '/',
        className: currentPath === '/' ? 'active' : ''
      }, 'Home'),
      a({
        href: '/about',
        className: currentPath === '/about' ? 'active' : ''
      }, 'About'),
      a({
        href: '/contact',
        className: currentPath === '/contact' ? 'active' : ''
      }, 'Contact')
    ),
    div({ className: 'content' }, content)
  );
}

// Home page
api.get('/', (ctx) => {
  const content = div(
    h1('Welcome Home'),
    p('This is the home page rendered on the server.')
  );

  const app = Layout(content, '/');
  const appHtml = app.node.outerHTML;

  html(ctx.res, \`<!DOCTYPE html>
    <html>
      <head><title>Home</title><link rel="stylesheet" href="/styles.css"></head>
      <body>\${appHtml}<script type="module" src="/client.js"></script></body>
    </html>\`);
});

// About page
api.get('/about', (ctx) => {
  const content = div(
    h1('About Us'),
    p('Learn more about our company.')
  );

  const app = Layout(content, '/about');
  const appHtml = app.node.outerHTML;

  html(ctx.res, \`<!DOCTYPE html>
    <html>
      <head><title>About</title><link rel="stylesheet" href="/styles.css"></head>
      <body>\${appHtml}<script type="module" src="/client.js"></script></body>
    </html>\`);
});

export default defineConfig({
  dev: { port: 3000, api }
});`))),

      h2('Performance Optimization'),
      h3('1. Streaming SSR'),
      p('Stream HTML as it\'s generated for faster Time to First Byte:'),

      pre(code(...codeBlock(`// server.ts
api.get('/stream', (ctx) => {
  ctx.res.writeHead(200, {
    'Content-Type': 'text/html',
    'Transfer-Encoding': 'chunked'
  });

  // Send initial HTML
  ctx.res.write('<!DOCTYPE html><html><head><title>Streaming</title></head><body>');
  ctx.res.write('<div id="app">');

  // Stream header
  const header = h1('Streaming SSR Demo');
  ctx.res.write(header.node.outerHTML);

  // Simulate async data loading
  setTimeout(() => {
    const content = p('This content loaded asynchronously!');
    ctx.res.write(content.node.outerHTML);

    // Close and send scripts
    ctx.res.write('</div>');
    ctx.res.write('<script type="module" src="/client.js"></script>');
    ctx.res.write('</body></html>');
    ctx.res.end();
  }, 1000);
});`))),

      h3('2. HTML Caching'),
      p('Cache rendered HTML for better performance:'),

      pre(code(...codeBlock(`import { html } from 'elit/el';
import { ServerRouter } from 'elit/server';

const htmlCache = new Map<string, { html: string; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

function getCachedHTML(key: string, generator: () => string): string {
  const cached = htmlCache.get(key);
  const now = Date.now();

  // Check if cached and not expired
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.html;
  }

  // Generate new HTML
  const generatedHtml = generator();

  // Cache it
  htmlCache.set(key, {
    html: generatedHtml,
    timestamp: now
  });

  return generatedHtml;
}

api.get('/cached-page', (ctx) => {
  const pageHtml = getCachedHTML('home-page', () => {
    const app = div({ id: 'app' },
      h1('Cached Page'),
      p('This page is cached for 1 minute')
    );

    return \`<!DOCTYPE html>
      <html>
        <head><title>Cached</title></head>
        <body>\${app.node.outerHTML}</body>
      </html>\`;
  });

  html(ctx.res, pageHtml);
});`))),

      h2('Common SSR Patterns'),

      h3('Conditional Client-Side Hydration'),
      p('Only hydrate parts of the page that need interactivity:'),

      pre(code(...codeBlock(`// client.ts
import { createState } from 'elit/state';

// Check if element needs hydration
const interactiveElements = document.querySelectorAll('[data-hydrate]');

interactiveElements.forEach(el => {
  const type = el.getAttribute('data-hydrate');

  switch (type) {
    case 'counter':
      hydrateCounter(el);
      break;
    case 'form':
      hydrateForm(el);
      break;
    default:
      console.warn(\`Unknown hydration type: \${type}\`);
  }
});

function hydrateCounter(el: Element) {
  const countEl = el.querySelector('.count');
  const incrementBtn = el.querySelector('.increment');
  const decrementBtn = el.querySelector('.decrement');

  if (!countEl || !incrementBtn || !decrementBtn) return;

  const count = createState(parseInt(countEl.textContent || '0'));

  count.subscribe(value => {
    countEl.textContent = String(value);
  });

  incrementBtn.addEventListener('click', () => count.value++);
  decrementBtn.addEventListener('click', () => count.value--);
}`))),

      h2('SSR Best Practices'),
      ul(
        li(strong('Keep components pure'), ' - Avoid side effects in render functions'),
        li(strong('Minimize client bundle'), ' - Only send JavaScript needed for interactivity'),
        li(strong('Use caching wisely'), ' - Cache static pages, invalidate on content changes'),
        li(strong('Handle errors gracefully'), ' - Provide fallback HTML for failed renders'),
        li(strong('Optimize Time to Interactive'), ' - Hydrate critical components first'),
        li(strong('Avoid heavy computations'), ' - Move expensive operations to build time'),
        li(strong('Use compression'), ' - Enable gzip/brotli for HTML responses'),
        li(strong('Implement proper SEO'), ' - Include meta tags, structured data, sitemaps'),
        li(strong('Monitor performance'), ' - Track TTFB, FCP, LCP metrics'),
        li(strong('Progressive enhancement'), ' - Ensure basic functionality without JavaScript')
      ),

      h2('Complete SSR Example'),
      p('Here\'s a complete example combining all concepts:'),

      pre(code(...codeBlock(`// server.ts
import { defineConfig } from 'elit/config';
import { div, h1, h2, p, article, nav, a, button, html } from 'elit/el';
import { ServerRouter, compress } from 'elit/server';

const api = new ServerRouter();

// Use compression middleware
api.use(compress());

// Blog post data fetching
async function fetchBlogPost(slug: string) {
  // Simulate database fetch
  return {
    slug,
    title: 'Getting Started with Elit SSR',
    content: 'SSR in Elit is straightforward and powerful...',
    author: 'Jane Doe',
    date: '2024-12-18',
    excerpt: 'Learn how to implement SSR in Elit applications'
  };
}

// SSR blog post route
api.get('/blog/:slug', async (ctx) => {
  const { slug } = ctx.params;
  const post = await fetchBlogPost(slug);

  // Create SEO meta tags
  const metaTags = \`
    <title>\${post.title} | Blog</title>
    <meta name="description" content="\${post.excerpt}">
    <meta property="og:title" content="\${post.title}">
    <meta property="og:description" content="\${post.excerpt}">
  \`;

  // Render blog post
  const app = div({ id: 'app' },
    nav({ className: 'nav' },
      a({ href: '/' }, 'Home'),
      a({ href: '/blog' }, 'Blog')
    ),
    article({ className: 'post' },
      h1(post.title),
      p({ className: 'meta' }, \`By \${post.author} • \${post.date}\`),
      div({ className: 'content' }, post.content),
      button({
        'data-hydrate': 'like-button',
        className: 'like-btn'
      }, '👍 Like')
    )
  );

  const appHtml = app.node.outerHTML;

  html(ctx.res, \`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        \${metaTags}
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        \${appHtml}
        <script>
          window.__INITIAL_DATA__ = \${JSON.stringify({ post })};
        </script>
        <script type="module" src="/blog-client.js"></script>
      </body>
    </html>
  \`);
});

export default defineConfig({
  dev: { port: 3000, api }
});`))),

      pre(code(...codeBlock(`// blog-client.ts
import { createState } from 'elit/state';

const likeButton = document.querySelector('[data-hydrate="like-button"]');

if (likeButton) {
  const likes = createState(0);

  const likeCount = document.createElement('span');
  likeCount.className = 'like-count';
  likeButton.appendChild(likeCount);

  likes.subscribe(count => {
    likeCount.textContent = count > 0 ? \` (\${count})\` : '';
  });

  likeButton.addEventListener('click', () => {
    likes.value++;
  });
}`))),

      h2('Conclusion'),
      p('Server-Side Rendering in Elit provides a powerful way to build fast, SEO-friendly applications. By rendering HTML on the server and selectively hydrating on the client, you get the best of both worlds: fast initial loads and rich interactivity.'),

      p('Key takeaways: Use SSR for content-heavy pages, implement proper hydration for interactive components, optimize with caching and compression, and always prioritize user experience and performance metrics.')
    ),

    th: div(
      p('Server-Side Rendering (SSR) ใน Elit ช่วยให้คุณ render แอปพลิเคชันบนเซิร์ฟเวอร์และส่ง HTML ที่สมบูรณ์ไปยัง client ซึ่งช่วยปรับปรุงประสิทธิภาพการโหลดครั้งแรก SEO และประสบการณ์ผู้ใช้'),

      h2('ทำไมต้อง Server-Side Rendering?'),
      p('SSR ให้ประโยชน์หลักหลายอย่าง:'),
      ul(
        li(strong('โหลดเร็วขึ้น'), ' - ผู้ใช้เห็นเนื้อหาทันทีโดยไม่ต้องรอ JavaScript'),
        li(strong('SEO ดีขึ้น'), ' - Search engines สามารถ crawl HTML ที่ render เต็มรูปแบบ'),
        li(strong('Social Media Previews'), ' - OG tags และ meta descriptions ทำงานถูกต้อง'),
        li(strong('ประสิทธิภาพดีขึ้น'), ' - ลด time-to-interactive บนการเชื่อมต่อที่ช้า'),
        li(strong('Progressive Enhancement'), ' - เนื้อหาทำงานได้แม้ว่า JavaScript จะล้มเหลว'),
        li(strong('Core Web Vitals ดีขึ้น'), ' - ปรับปรุง FCP, LCP และ CLS scores')
      ),

      h2('การตั้งค่า SSR พื้นฐาน'),
      h3('1. ฝั่ง Server: Render HTML'),
      p('ใช้ Elit components บน server เพื่อสร้าง HTML:'),

      pre(code(...codeBlock(`// server.ts
import { defineConfig } from 'elit/config';
import { div, h1, p, button, html } from 'elit/dom';
import { ServerRouter } from 'elit/server';

const api = new ServerRouter();

api.get('/', (ctx) => {
  // สร้าง app component
  const app = div({ id: 'app' },
    h1('ยินดีต้อนรับสู่ Elit SSR'),
    p('เนื้อหานี้ถูก render บน server!'),
    button({ className: 'cta' }, 'เริ่มต้นใช้งาน')
  );

  // Render เป็น HTML string
  const appHtml = app.node.outerHTML;

  // ส่ง HTML document ที่สมบูรณ์
  html(ctx.res, \`
    <!DOCTYPE html>
    <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Elit SSR App</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        \${appHtml}
        <script type="module" src="/client.js"></script>
      </body>
    </html>
  \`);
});

export default defineConfig({
  dev: { port: 3000, api }
});`))),

      h3('2. ฝั่ง Client: Hydration'),
      p('บน client ติด event handlers ให้กับ HTML ที่ render จาก server:'),

      pre(code(...codeBlock(`// client.ts
import { dom } from 'elit/dom';

// หา elements ที่ render จาก server
const button = document.querySelector('.cta');

// ติด client-side behavior
if (button) {
  button.addEventListener('click', () => {
    window.location.href = '/getting-started';
  });
}

console.log('Client hydrated!');`))),

      h2('SSR พร้อม State Management'),
      h3('Server: สร้าง HTML พร้อม Initial State'),
      p('ส่ง initial state จาก server ไป client:'),

      pre(code(...codeBlock(`// server.ts
import { ServerRouter } from 'elit/server';
import { div, h1, span, button, html } from 'elit/dom';

const api = new ServerRouter();

api.get('/counter', (ctx) => {
  const initialCount = 0;

  // สร้าง component พร้อม initial state
  const app = div({ id: 'app' },
    h1('Counter ที่ Render จาก Server'),
    div({ className: 'counter' },
      span({ id: 'count', className: 'count' }, String(initialCount)),
      div({ className: 'buttons' },
        button({ id: 'decrement', className: 'btn' }, '-'),
        button({ id: 'increment', className: 'btn' }, '+')
      )
    )
  );

  const appHtml = app.node.outerHTML;

  html(ctx.res, \`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SSR Counter</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        \${appHtml}
        <script>
          // ฝัง initial state ใน HTML
          window.__INITIAL_STATE__ = { count: \${initialCount} };
        </script>
        <script type="module" src="/counter-client.js"></script>
      </body>
    </html>
  \`);
});`))),

      h3('Client: Hydrate ด้วย Reactive State'),
      p('กู้คืน state และทำให้เป็น reactive บน client:'),

      pre(code(...codeBlock(`// counter-client.ts
import { createState } from 'elit/state';

// รับ initial state จาก server
const initialState = (window as any).__INITIAL_STATE__;

// สร้าง reactive state
const count = createState(initialState.count);

// หา DOM elements
const countEl = document.getElementById('count');
const decrementBtn = document.getElementById('decrement');
const incrementBtn = document.getElementById('increment');

// Subscribe การเปลี่ยนแปลง state
if (countEl) {
  count.subscribe(value => {
    countEl.textContent = String(value);
  });
}

// ติด event handlers
if (decrementBtn) {
  decrementBtn.addEventListener('click', () => {
    count.value--;
  });
}

if (incrementBtn) {
  incrementBtn.addEventListener('click', () => {
    count.value++;
  });
}`))),

      h2('การเพิ่มประสิทธิภาพ'),
      h3('1. HTML Caching'),
      p('Cache HTML ที่ render แล้วเพื่อประสิทธิภาพที่ดีขึ้น:'),

      pre(code(...codeBlock(`import { ServerRouter } from 'elit/server';
import { html } from 'elit/el';
const htmlCache = new Map<string, { html: string; timestamp: number }>();
const CACHE_TTL = 60000; // 1 นาที

function getCachedHTML(key: string, generator: () => string): string {
  const cached = htmlCache.get(key);
  const now = Date.now();

  // ตรวจสอบว่ามี cache และยังไม่หมดอายุ
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.html;
  }

  // สร้าง HTML ใหม่
  const generatedHtml = generator();

  // Cache มัน
  htmlCache.set(key, {
    html: generatedHtml,
    timestamp: now
  });

  return generatedHtml;
}`))),

      h3('2. การบีบอัด'),
      p('ใช้ compression middleware สำหรับ responses:'),

      pre(code(...codeBlock(`import { ServerRouter, compress } from 'elit/server';

const api = new ServerRouter();

// ใช้ compression
api.use(compress());

api.get('/', (ctx) => {
  // HTML จะถูกบีบอัดโดยอัตโนมัติ
  html(ctx.res, largeHtmlContent);
});`))),

      h2('SEO Optimization'),
      h3('Dynamic Meta Tags'),
      p('สร้าง meta tags ที่เหมาะกับ SEO:'),

      pre(code(...codeBlock(`function generateMetaTags(meta: {
  title: string;
  description: string;
  image?: string;
  url: string;
}): string {
  return \`
    <title>\${meta.title}</title>
    <meta name="description" content="\${meta.description}">

    <!-- Open Graph -->
    <meta property="og:title" content="\${meta.title}">
    <meta property="og:description" content="\${meta.description}">
    <meta property="og:url" content="\${meta.url}">
    \${meta.image ? \`<meta property="og:image" content="\${meta.image}">\` : ''}

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="\${meta.title}">
    <meta name="twitter:description" content="\${meta.description}">
  \`;
}`))),

      h2('แนวทางปฏิบัติที่ดี'),
      ul(
        li(strong('เก็บ components ให้ pure'), ' - หลีกเลี่ยง side effects ใน render functions'),
        li(strong('ลด client bundle'), ' - ส่งเฉพาะ JavaScript ที่จำเป็นสำหรับ interactivity'),
        li(strong('ใช้ caching อย่างชาญฉลาด'), ' - Cache หน้าแบบ static, invalidate เมื่อเนื้อหาเปลี่ยน'),
        li(strong('จัดการ errors อย่างเหมาะสม'), ' - ให้ fallback HTML สำหรับ renders ที่ล้มเหลว'),
        li(strong('เพิ่มประสิทธิภาพ Time to Interactive'), ' - Hydrate components สำคัญก่อน'),
        li(strong('หลีกเลี่ยงการคำนวณหนัก'), ' - ย้ายการดำเนินการที่ใช้เวลามากไปยัง build time'),
        li(strong('ใช้การบีบอัด'), ' - เปิด gzip/brotli สำหรับ HTML responses'),
        li(strong('ทำ SEO ให้ถูกต้อง'), ' - รวม meta tags, structured data, sitemaps'),
        li(strong('ติดตามประสิทธิภาพ'), ' - ติดตาม TTFB, FCP, LCP metrics'),
        li(strong('Progressive enhancement'), ' - ให้แน่ใจว่าฟังก์ชันพื้นฐานทำงานได้โดยไม่ต้องใช้ JavaScript')
      ),

      h2('สรุป'),
      p('Server-Side Rendering ใน Elit ให้วิธีที่ทรงพลังในการสร้างแอปพลิเคชันที่เร็วและเหมาะกับ SEO ด้วยการ render HTML บน server และ hydrate แบบเลือกสรรบน client คุณจะได้ทั้งสองอย่าง: การโหลดเริ่มต้นที่เร็วและ interactivity ที่หลากหลาย'),

      p('สรุปสำคัญ: ใช้ SSR สำหรับหน้าที่เน้นเนื้อหา ใช้ hydration ที่เหมาะสมสำหรับ interactive components เพิ่มประสิทธิภาพด้วย caching และ compression และให้ความสำคัญกับประสบการณ์ผู้ใช้และ performance metrics เสมอ')
    )
  }
};
