import { div, h2, h3, h4, p, ul, li, pre, code } from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog7: BlogPostDetail = {
  id: '7',
  title: {
    en: 'Server-Side Rendering with Elit and Express',
    th: 'Server-Side Rendering ด้วย Elit และ Express'
  },
  date: '2024-02-25',
  author: 'n-devs',
  tags: ['Tutorial', 'SSR', 'Express', 'Node.js'],
  content: {
    en: div(
      p('Learn how to implement Server-Side Rendering (SSR) with Elit and Express for improved SEO, faster initial page loads, and better performance. This comprehensive guide covers everything from basic setup to advanced SSR patterns.'),

      h2('Why SSR with Elit?'),
      p('Server-Side Rendering offers several advantages:'),
      ul(
        li('Improved SEO - search engines can crawl your content'),
        li('Faster initial page load - content is rendered on the server'),
        li('Better performance on low-powered devices'),
        li('Social media preview cards work properly'),
        li('Progressive enhancement - works without JavaScript'),
        li('Elit\'s lightweight nature makes SSR extremely fast')
      ),

      h2('Project Setup'),
      h3('1. Initialize Project'),
      pre(code(...codeBlock(`mkdir elit-express-ssr
cd elit-express-ssr
npm init -y`))),

      h3('2. Install Dependencies'),
      pre(code(...codeBlock(`npm install express elit
npm install -D @types/express @types/node typescript tsx nodemon`))),

      h3('3. Configure TypeScript'),
      p('Create tsconfig.json:'),
      pre(code(...codeBlock(`{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "lib": ["ES2020"],
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}`))),

      h3('4. Project Structure'),
      pre(code(...codeBlock(`elit-express-ssr/
├── src/
│   ├── server.ts
│   ├── components/
│   │   ├── Layout.ts
│   │   ├── HomePage.ts
│   │   └── BlogPage.ts
│   ├── routes/
│   │   └── index.ts
│   └── utils/
│       └── renderPage.ts
├── public/
│   ├── css/
│   └── js/
├── package.json
└── tsconfig.json`))),

      h2('Basic Server Setup'),
      h3('src/server.ts'),
      p('Create the main Express server:'),
      pre(code(...codeBlock(`import express from 'express';
import path from 'path';
import { routes } from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Use routes
app.use(routes);

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});`))),

      h2('Creating Reusable Components'),
      h3('src/components/Layout.ts'),
      p('Create a layout component that wraps all pages:'),
      pre(code(...codeBlock(`import { html, head, meta, title, link, body, div, header, nav, a, main, footer, p } from 'elit';

export const Layout = (pageTitle: string, content: string) => {
  return html({ lang: 'en' },
    head(
      meta({ charset: 'UTF-8' }),
      meta({ name: 'viewport', content: 'width=device-width, initial-scale=1.0' }),
      title(pageTitle),
      link({ rel: 'stylesheet', href: '/css/styles.css' })
    ),
    body(
      header(
        nav(
          a({ href: '/' }, 'Home'),
          a({ href: '/blog' }, 'Blog'),
          a({ href: '/about' }, 'About')
        )
      ),
      main({ id: 'app' },
        content
      ),
      footer(
        p('© 2024 Built with Elit + Express')
      )
    )
  );
};`))),

      h3('src/components/HomePage.ts'),
      p('Create a home page component:'),
      pre(code(...codeBlock(`import { div, h1, p, section, ul, li, a } from 'elit';

export const HomePage = () => {
  return div({ className: 'home-page' },
    section({ className: 'hero' },
      h1('Welcome to Elit + Express SSR'),
      p('Building fast, SEO-friendly web applications with server-side rendering')
    ),
    section({ className: 'features' },
      h1('Features'),
      ul(
        li('Server-Side Rendering for better SEO'),
        li('Lightning-fast page loads'),
        li('Progressive enhancement'),
        li('Lightweight and efficient')
      )
    ),
    section({ className: 'cta' },
      a({ href: '/blog', className: 'btn btn-primary' }, 'Read Our Blog')
    )
  );
};`))),

      h2('Rendering to HTML'),
      h3('src/utils/renderPage.ts'),
      p('Create a utility to render Elit components to HTML strings:'),
      pre(code(...codeBlock(`import { VNode } from 'elit';
import { Layout } from '../components/Layout';

export const renderPage = (pageTitle: string, component: VNode): string => {
  // Convert VNode to HTML string
  const contentHtml = vnodeToHtml(component);

  // Wrap in layout
  const pageVNode = Layout(pageTitle, contentHtml);

  // Convert full page to HTML
  return '<!DOCTYPE html>' + vnodeToHtml(pageVNode);
};

// Helper function to convert VNode to HTML string
function vnodeToHtml(vnode: VNode): string {
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return escapeHtml(String(vnode));
  }

  if (!vnode || !vnode.tag) {
    return '';
  }

  const { tag, props = {}, children = [] } = vnode;

  // Build attributes string
  const attrs = Object.entries(props)
    .filter(([key]) => !key.startsWith('on')) // Skip event handlers
    .map(([key, value]) => {
      if (key === 'className') {
        return \`class="\${escapeHtml(String(value))}"\`;
      }
      if (typeof value === 'boolean') {
        return value ? key : '';
      }
      return \`\${key}="\${escapeHtml(String(value))}"\`;
    })
    .filter(Boolean)
    .join(' ');

  const openTag = attrs ? \`<\${tag} \${attrs}>\` : \`<\${tag}>\`;

  // Self-closing tags
  const selfClosing = ['img', 'br', 'hr', 'input', 'meta', 'link'];
  if (selfClosing.includes(tag)) {
    return attrs ? \`<\${tag} \${attrs} />\` : \`<\${tag} />\`;
  }

  // Render children
  const childrenHtml = children
    .map(child => vnodeToHtml(child))
    .join('');

  return \`\${openTag}\${childrenHtml}</\${tag}>\`;
}

// Escape HTML special characters
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}`))),

      h2('Setting Up Routes'),
      h3('src/routes/index.ts'),
      p('Create routes that render components server-side:'),
      pre(code(...codeBlock(`import { Router } from 'express';
import { HomePage } from '../components/HomePage';
import { BlogPage } from '../components/BlogPage';
import { renderPage } from '../utils/renderPage';

export const routes = Router();

// Home page
routes.get('/', (req, res) => {
  const html = renderPage('Home - Elit SSR', HomePage());
  res.send(html);
});

// Blog page
routes.get('/blog', (req, res) => {
  const html = renderPage('Blog - Elit SSR', BlogPage());
  res.send(html);
});

// Blog detail page with dynamic routing
routes.get('/blog/:id', (req, res) => {
  const { id } = req.params;

  // Fetch blog data (example)
  const blog = getBlogById(id);

  if (!blog) {
    res.status(404).send(renderPage('404 - Not Found', NotFoundPage()));
    return;
  }

  const html = renderPage(blog.title, BlogDetailPage(blog));
  res.send(html);
});

// Example blog data
function getBlogById(id: string) {
  const blogs = {
    '1': { title: 'First Post', content: 'Hello World!' },
    '2': { title: 'Second Post', content: 'Learning SSR' }
  };
  return blogs[id as keyof typeof blogs];
}`))),

      h2('Client-Side Hydration'),
      h3('Why Hydration?'),
      p('After the server renders HTML, we need to "hydrate" it on the client to make it interactive:'),

      h3('public/js/hydrate.js'),
      pre(code(...codeBlock(`import { dom, createState, reactive } from 'elit';

// Hydrate interactive components
document.addEventListener('DOMContentLoaded', () => {
  // Find interactive elements and attach event handlers
  hydrateForms();
  hydrateCounters();
});

function hydrateForms() {
  const forms = document.querySelectorAll('form[data-hydrate]');
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      // Handle form submission
    });
  });
}

function hydrateCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  counters.forEach(el => {
    const count = createState(parseInt(el.textContent || '0'));

    // Replace with reactive version
    const reactiveCounter = reactive(count, value =>
      div(\`Count: \${value}\`)
    );

    el.replaceWith(reactiveCounter.node);
  });
}`))),

      h2('Advanced Patterns'),
      h3('Data Fetching'),
      p('Fetch data on the server before rendering:'),
      pre(code(...codeBlock(`routes.get('/posts', async (req, res) => {
  try {
    // Fetch data from API or database
    const posts = await fetchPosts();

    // Pass data to component
    const html = renderPage('Posts', PostsPage(posts));
    res.send(html);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).send('Internal Server Error');
  }
});

async function fetchPosts() {
  const response = await fetch('https://api.example.com/posts');
  return response.json();
}`))),

      h3('SEO Metadata'),
      p('Add dynamic meta tags for better SEO:'),
      pre(code(...codeBlock(`import { head, meta, title, script } from 'elit';

export const SEOHead = (data: {
  title: string;
  description: string;
  image?: string;
  url: string;
}) => {
  return head(
    title(data.title),
    meta({ name: 'description', content: data.description }),

    // Open Graph tags
    meta({ property: 'og:title', content: data.title }),
    meta({ property: 'og:description', content: data.description }),
    meta({ property: 'og:url', content: data.url }),
    data.image && meta({ property: 'og:image', content: data.image }),

    // Twitter Card tags
    meta({ name: 'twitter:card', content: 'summary_large_image' }),
    meta({ name: 'twitter:title', content: data.title }),
    meta({ name: 'twitter:description', content: data.description }),

    // JSON-LD structured data
    script({ type: 'application/ld+json' },
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.title,
        description: data.description,
        image: data.image,
        url: data.url
      })
    )
  );
};`))),

      h3('Streaming SSR'),
      p('For large pages, stream HTML as it\'s generated:'),
      pre(code(...codeBlock(`routes.get('/large-page', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.write('<!DOCTYPE html><html><head><title>Large Page</title></head><body>');

  // Stream header
  res.write(vnodeToHtml(Header()));

  // Stream content in chunks
  const content = getLargeContent();
  for (const chunk of content) {
    res.write(vnodeToHtml(ContentChunk(chunk)));
  }

  // Stream footer
  res.write(vnodeToHtml(Footer()));
  res.write('</body></html>');
  res.end();
});`))),

      h2('Caching Strategies'),
      h3('Page-Level Caching'),
      pre(code(...codeBlock(`import { LRUCache } from 'lru-cache';

const cache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 5 // 5 minutes
});

routes.get('/cached-page', (req, res) => {
  const cacheKey = req.url;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached) {
    res.send(cached);
    return;
  }

  // Generate page
  const html = renderPage('Cached Page', CachedPage());

  // Store in cache
  cache.set(cacheKey, html);

  res.send(html);
});`))),

      h2('Development Workflow'),
      h3('package.json Scripts'),
      pre(code(...codeBlock(`{
  "scripts": {
    "dev": "nodemon --exec tsx src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src --ext .ts"
  }
}`))),

      h3('Running the Server'),
      pre(code(...codeBlock(`# Development with hot reload
npm run dev

# Production build
npm run build
npm start`))),

      h2('Performance Optimization'),
      ul(
        li('Enable gzip compression with compression middleware'),
        li('Use HTTP/2 for multiplexing'),
        li('Implement CDN for static assets'),
        li('Add Redis for distributed caching'),
        li('Use PM2 for clustering in production'),
        li('Optimize images and assets'),
        li('Implement lazy loading for heavy components')
      ),

      h3('Adding Compression'),
      pre(code(...codeBlock(`npm install compression

import compression from 'compression';

app.use(compression());`))),

      h2('Deployment'),
      h3('Docker'),
      p('Create a Dockerfile:'),
      pre(code(...codeBlock(`FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]`))),

      h3('Deploy to Render/Railway/Fly.io'),
      pre(code(...codeBlock(`# Build command
npm run build

# Start command
npm start`))),

      h2('Testing SSR'),
      h3('Unit Tests'),
      pre(code(...codeBlock(`import { describe, it, expect } from 'vitest';
import { renderPage } from './utils/renderPage';
import { HomePage } from './components/HomePage';

describe('SSR Rendering', () => {
  it('should render HomePage to HTML', () => {
    const html = renderPage('Home', HomePage());
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Welcome to Elit');
  });

  it('should escape HTML in content', () => {
    const html = renderPage('Test', div('<script>alert("xss")</script>'));
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});`))),

      h2('Conclusion'),
      p('Elit\'s lightweight architecture makes it perfect for SSR. Combined with Express, you can build fast, SEO-friendly applications with minimal overhead. The direct DOM approach eliminates hydration complexity while maintaining excellent performance.'),
      p('Key benefits: Fast server rendering, small bundle sizes, simple hydration, excellent SEO, and progressive enhancement. Start building your next SSR application with Elit and Express today!')
    ),
    th: div(
      p('เรียนรู้วิธีการทำ Server-Side Rendering (SSR) ด้วย Elit และ Express เพื่อปรับปรุง SEO, โหลดหน้าเว็บเริ่มต้นเร็วขึ้น และประสิทธิภาพที่ดีขึ้น คู่มือฉบับสมบูรณ์นี้ครอบคลุมทุกอย่างตั้งแต่การตั้งค่าพื้นฐานจนถึงรูปแบบ SSR ขั้นสูง'),

      h2('ทำไมต้อง SSR กับ Elit?'),
      p('Server-Side Rendering มีข้อได้เปรียบหลายอย่าง:'),
      ul(
        li('ปรับปรุง SEO - เครื่องมือค้นหาสามารถ crawl เนื้อหาได้'),
        li('โหลดหน้าเริ่มต้นเร็วขึ้น - เนื้อหาถูก render บนเซิร์ฟเวอร์'),
        li('ประสิทธิภาพดีขึ้นบนอุปกรณ์ที่มีพลังน้อย'),
        li('การ์ดแสดงตัวอย่างโซเชียลมีเดียทำงานได้อย่างถูกต้อง'),
        li('Progressive enhancement - ทำงานได้โดยไม่มี JavaScript'),
        li('ธรรมชาติที่เบาของ Elit ทำให้ SSR รวดเร็วมาก')
      ),

      h2('การตั้งค่าโปรเจกต์'),
      h3('1. เริ่มต้นโปรเจกต์'),
      pre(code(...codeBlock(`mkdir elit-express-ssr
cd elit-express-ssr
npm init -y`))),

      h3('2. ติดตั้ง Dependencies'),
      pre(code(...codeBlock(`npm install express elit
npm install -D @types/express @types/node typescript tsx nodemon`))),

      h3('3. ตั้งค่า TypeScript'),
      p('สร้าง tsconfig.json:'),
      pre(code(...codeBlock(`{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "lib": ["ES2020"],
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}`))),

      h3('4. โครงสร้างโปรเจกต์'),
      pre(code(...codeBlock(`elit-express-ssr/
├── src/
│   ├── server.ts
│   ├── components/
│   │   ├── Layout.ts
│   │   ├── HomePage.ts
│   │   └── BlogPage.ts
│   ├── routes/
│   │   └── index.ts
│   └── utils/
│       └── renderPage.ts
├── public/
│   ├── css/
│   └── js/
├── package.json
└── tsconfig.json`))),

      h2('การตั้งค่า Server พื้นฐาน'),
      h3('src/server.ts'),
      p('สร้าง Express server หลัก:'),
      pre(code(...codeBlock(`import express from 'express';
import path from 'path';
import { routes } from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// ใช้ routes
app.use(routes);

// เริ่มเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(\`เซิร์ฟเวอร์ทำงานที่ http://localhost:\${PORT}\`);
});`))),

      h2('สร้าง Components ที่ใช้ซ้ำได้'),
      h3('src/components/Layout.ts'),
      p('สร้าง layout component ที่ครอบทุกหน้า:'),
      pre(code(...codeBlock(`import { html, head, meta, title, link, body, div, header, nav, a, main, footer, p } from 'elit';

export const Layout = (pageTitle: string, content: string) => {
  return html({ lang: 'th' },
    head(
      meta({ charset: 'UTF-8' }),
      meta({ name: 'viewport', content: 'width=device-width, initial-scale=1.0' }),
      title(pageTitle),
      link({ rel: 'stylesheet', href: '/css/styles.css' })
    ),
    body(
      header(
        nav(
          a({ href: '/' }, 'หน้าหลัก'),
          a({ href: '/blog' }, 'บล็อก'),
          a({ href: '/about' }, 'เกี่ยวกับ')
        )
      ),
      main({ id: 'app' },
        content
      ),
      footer(
        p('© 2024 สร้างด้วย Elit + Express')
      )
    )
  );
};`))),

      h3('src/components/HomePage.ts'),
      p('สร้าง component หน้าหลัก:'),
      pre(code(...codeBlock(`import { div, h1, p, section, ul, li, a } from 'elit';

export const HomePage = () => {
  return div({ className: 'home-page' },
    section({ className: 'hero' },
      h1('ยินดีต้อนรับสู่ Elit + Express SSR'),
      p('สร้างเว็บแอปพลิเคชันที่รวดเร็วและเป็นมิตรกับ SEO ด้วย server-side rendering')
    ),
    section({ className: 'features' },
      h1('คุณสมบัติ'),
      ul(
        li('Server-Side Rendering สำหรับ SEO ที่ดีขึ้น'),
        li('โหลดหน้าเว็บเร็วเหมือนสายฟ้า'),
        li('Progressive enhancement'),
        li('เบาและมีประสิทธิภาพ')
      )
    ),
    section({ className: 'cta' },
      a({ href: '/blog', className: 'btn btn-primary' }, 'อ่านบล็อกของเรา')
    )
  );
};`))),

      h2('การ Render เป็น HTML'),
      h3('src/utils/renderPage.ts'),
      p('สร้าง utility สำหรับ render Elit components เป็น HTML strings:'),
      pre(code(...codeBlock(`import { VNode } from 'elit';
import { Layout } from '../components/Layout';

export const renderPage = (pageTitle: string, component: VNode): string => {
  // แปลง VNode เป็น HTML string
  const contentHtml = vnodeToHtml(component);

  // ครอบด้วย layout
  const pageVNode = Layout(pageTitle, contentHtml);

  // แปลงหน้าทั้งหมดเป็น HTML
  return '<!DOCTYPE html>' + vnodeToHtml(pageVNode);
};

// Helper function สำหรับแปลง VNode เป็น HTML string
function vnodeToHtml(vnode: VNode): string {
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return escapeHtml(String(vnode));
  }

  if (!vnode || !vnode.tag) {
    return '';
  }

  const { tag, props = {}, children = [] } = vnode;

  // สร้าง attributes string
  const attrs = Object.entries(props)
    .filter(([key]) => !key.startsWith('on')) // ข้าม event handlers
    .map(([key, value]) => {
      if (key === 'className') {
        return \`class="\${escapeHtml(String(value))}"\`;
      }
      if (typeof value === 'boolean') {
        return value ? key : '';
      }
      return \`\${key}="\${escapeHtml(String(value))}"\`;
    })
    .filter(Boolean)
    .join(' ');

  const openTag = attrs ? \`<\${tag} \${attrs}>\` : \`<\${tag}>\`;

  // Self-closing tags
  const selfClosing = ['img', 'br', 'hr', 'input', 'meta', 'link'];
  if (selfClosing.includes(tag)) {
    return attrs ? \`<\${tag} \${attrs} />\` : \`<\${tag} />\`;
  }

  // Render children
  const childrenHtml = children
    .map(child => vnodeToHtml(child))
    .join('');

  return \`\${openTag}\${childrenHtml}</\${tag}>\`;
}

// Escape อักขระพิเศษใน HTML
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}`))),

      h2('การตั้งค่า Routes'),
      h3('src/routes/index.ts'),
      p('สร้าง routes ที่ render components ฝั่ง server:'),
      pre(code(...codeBlock(`import { Router } from 'express';
import { HomePage } from '../components/HomePage';
import { BlogPage } from '../components/BlogPage';
import { renderPage } from '../utils/renderPage';

export const routes = Router();

// หน้าหลัก
routes.get('/', (req, res) => {
  const html = renderPage('หน้าหลัก - Elit SSR', HomePage());
  res.send(html);
});

// หน้าบล็อก
routes.get('/blog', (req, res) => {
  const html = renderPage('บล็อก - Elit SSR', BlogPage());
  res.send(html);
});

// หน้ารายละเอียดบล็อกพร้อม dynamic routing
routes.get('/blog/:id', (req, res) => {
  const { id } = req.params;

  // ดึงข้อมูลบล็อก (ตัวอย่าง)
  const blog = getBlogById(id);

  if (!blog) {
    res.status(404).send(renderPage('404 - ไม่พบหน้า', NotFoundPage()));
    return;
  }

  const html = renderPage(blog.title, BlogDetailPage(blog));
  res.send(html);
});

// ข้อมูลบล็อกตัวอย่าง
function getBlogById(id: string) {
  const blogs = {
    '1': { title: 'โพสต์แรก', content: 'สวัสดีชาวโลก!' },
    '2': { title: 'โพสต์ที่สอง', content: 'เรียนรู้ SSR' }
  };
  return blogs[id as keyof typeof blogs];
}`))),

      h2('Client-Side Hydration'),
      h3('ทำไมต้อง Hydration?'),
      p('หลังจากเซิร์ฟเวอร์ render HTML แล้ว เราต้อง "hydrate" บน client เพื่อให้มีการโต้ตอบ:'),

      h3('public/js/hydrate.js'),
      pre(code(...codeBlock(`import { dom, createState, reactive } from 'elit';

// Hydrate interactive components
document.addEventListener('DOMContentLoaded', () => {
  // ค้นหา elements ที่มีการโต้ตอบและแนบ event handlers
  hydrateForms();
  hydrateCounters();
});

function hydrateForms() {
  const forms = document.querySelectorAll('form[data-hydrate]');
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      // จัดการการส่งฟอร์ม
    });
  });
}

function hydrateCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  counters.forEach(el => {
    const count = createState(parseInt(el.textContent || '0'));

    // แทนที่ด้วย reactive version
    const reactiveCounter = reactive(count, value =>
      div(\`จำนวน: \${value}\`)
    );

    el.replaceWith(reactiveCounter.node);
  });
}`))),

      h2('รูปแบบขั้นสูง'),
      h3('การดึงข้อมูล'),
      p('ดึงข้อมูลบนเซิร์ฟเวอร์ก่อน render:'),
      pre(code(...codeBlock(`routes.get('/posts', async (req, res) => {
  try {
    // ดึงข้อมูลจาก API หรือ database
    const posts = await fetchPosts();

    // ส่งข้อมูลไปยัง component
    const html = renderPage('โพสต์', PostsPage(posts));
    res.send(html);
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงโพสต์:', error);
    res.status(500).send('Internal Server Error');
  }
});

async function fetchPosts() {
  const response = await fetch('https://api.example.com/posts');
  return response.json();
}`))),

      h3('SEO Metadata'),
      p('เพิ่ม meta tags แบบไดนามิกสำหรับ SEO ที่ดีขึ้น:'),
      pre(code(...codeBlock(`import { head, meta, title, script } from 'elit';

export const SEOHead = (data: {
  title: string;
  description: string;
  image?: string;
  url: string;
}) => {
  return head(
    title(data.title),
    meta({ name: 'description', content: data.description }),

    // Open Graph tags
    meta({ property: 'og:title', content: data.title }),
    meta({ property: 'og:description', content: data.description }),
    meta({ property: 'og:url', content: data.url }),
    data.image && meta({ property: 'og:image', content: data.image }),

    // Twitter Card tags
    meta({ name: 'twitter:card', content: 'summary_large_image' }),
    meta({ name: 'twitter:title', content: data.title }),
    meta({ name: 'twitter:description', content: data.description }),

    // JSON-LD structured data
    script({ type: 'application/ld+json' },
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.title,
        description: data.description,
        image: data.image,
        url: data.url
      })
    )
  );
};`))),

      h3('Streaming SSR'),
      p('สำหรับหน้าขนาดใหญ่ ส่ง HTML แบบ stream ขณะที่กำลังสร้าง:'),
      pre(code(...codeBlock(`routes.get('/large-page', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.write('<!DOCTYPE html><html><head><title>หน้าขนาดใหญ่</title></head><body>');

  // Stream header
  res.write(vnodeToHtml(Header()));

  // Stream เนื้อหาเป็นชิ้นๆ
  const content = getLargeContent();
  for (const chunk of content) {
    res.write(vnodeToHtml(ContentChunk(chunk)));
  }

  // Stream footer
  res.write(vnodeToHtml(Footer()));
  res.write('</body></html>');
  res.end();
});`))),

      h2('กลยุทธ์การ Caching'),
      h3('Page-Level Caching'),
      pre(code(...codeBlock(`import { LRUCache } from 'lru-cache';

const cache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 5 // 5 นาที
});

routes.get('/cached-page', (req, res) => {
  const cacheKey = req.url;

  // ตรวจสอบ cache
  const cached = cache.get(cacheKey);
  if (cached) {
    res.send(cached);
    return;
  }

  // สร้างหน้า
  const html = renderPage('หน้า Cached', CachedPage());

  // เก็บใน cache
  cache.set(cacheKey, html);

  res.send(html);
});`))),

      h2('เวิร์กโฟลว์การพัฒนา'),
      h3('package.json Scripts'),
      pre(code(...codeBlock(`{
  "scripts": {
    "dev": "nodemon --exec tsx src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src --ext .ts"
  }
}`))),

      h3('เรียกใช้เซิร์ฟเวอร์'),
      pre(code(...codeBlock(`# Development พร้อม hot reload
npm run dev

# Production build
npm run build
npm start`))),

      h2('การเพิ่มประสิทธิภาพ'),
      ul(
        li('เปิด gzip compression ด้วย compression middleware'),
        li('ใช้ HTTP/2 สำหรับ multiplexing'),
        li('ใช้ CDN สำหรับ static assets'),
        li('เพิ่ม Redis สำหรับ distributed caching'),
        li('ใช้ PM2 สำหรับ clustering ใน production'),
        li('เพิ่มประสิทธิภาพรูปภาพและ assets'),
        li('ใช้ lazy loading สำหรับ components ที่หนัก')
      ),

      h3('เพิ่ม Compression'),
      pre(code(...codeBlock(`npm install compression

import compression from 'compression';

app.use(compression());`))),

      h2('การ Deploy'),
      h3('Docker'),
      p('สร้าง Dockerfile:'),
      pre(code(...codeBlock(`FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]`))),

      h3('Deploy ไป Render/Railway/Fly.io'),
      pre(code(...codeBlock(`# คำสั่ง Build
npm run build

# คำสั่ง Start
npm start`))),

      h2('การทดสอบ SSR'),
      h3('Unit Tests'),
      pre(code(...codeBlock(`import { describe, it, expect } from 'vitest';
import { renderPage } from './utils/renderPage';
import { HomePage } from './components/HomePage';

describe('SSR Rendering', () => {
  it('should render HomePage to HTML', () => {
    const html = renderPage('หน้าหลัก', HomePage());
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('ยินดีต้อนรับ');
  });

  it('should escape HTML in content', () => {
    const html = renderPage('ทดสอบ', div('<script>alert("xss")</script>'));
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});`))),

      h2('สรุป'),
      p('สถาปัตยกรรมที่เบาของ Elit ทำให้เหมาะสำหรับ SSR อย่างยิ่ง เมื่อรวมกับ Express คุณสามารถสร้างแอปพลิเคชันที่รวดเร็วและเป็นมิตรกับ SEO ด้วย overhead น้อยที่สุด แนวทางการจัดการ DOM โดยตรงช่วยลดความซับซ้อนของ hydration ในขณะที่รักษาประสิทธิภาพที่ยอดเยี่ยม'),
      p('ประโยชน์หลัก: การ render บนเซิร์ฟเวอร์ที่รวดเร็ว, ขนาด bundle เล็ก, hydration ง่าย, SEO ยอดเยี่ยม และ progressive enhancement เริ่มสร้างแอปพลิเคชัน SSR ถัดไปของคุณด้วย Elit และ Express วันนี้!')
    )
  }
};
