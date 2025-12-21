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
            a({ href: 'javascript:void(0)', onclick: () => document.getElementById('devserver')?.scrollIntoView({ behavior: 'smooth' }) }, 'Dev Server & Build'),
            a({ href: 'javascript:void(0)', onclick: () => document.getElementById('elements')?.scrollIntoView({ behavior: 'smooth' }) }, t('docs.elements')),
            a({ href: 'javascript:void(0)', onclick: () => document.getElementById('state')?.scrollIntoView({ behavior: 'smooth' }) }, t('docs.state')),
            a({ href: 'javascript:void(0)', onclick: () => document.getElementById('reactive')?.scrollIntoView({ behavior: 'smooth' }) }, t('docs.reactive')),
            a({ href: 'javascript:void(0)', onclick: () => document.getElementById('createstyle')?.scrollIntoView({ behavior: 'smooth' }) }, t('docs.createstyle')),
            a({ href: 'javascript:void(0)', onclick: () => document.getElementById('ssr')?.scrollIntoView({ behavior: 'smooth' }) }, t('docs.ssr')),
            a({ href: 'javascript:void(0)', onclick: () => document.getElementById('routing')?.scrollIntoView({ behavior: 'smooth' }) }, t('docs.routing')),
            a({ href: 'javascript:void(0)', onclick: () => document.getElementById('performance')?.scrollIntoView({ behavior: 'smooth' }) }, t('docs.performance')),
            a({ href: 'javascript:void(0)', onclick: () => document.getElementById('deployment')?.scrollIntoView({ behavior: 'smooth' }) }, 'Deployment')
          )
        )
      ),
      reactive(currentLang, () =>
        div({ className: 'docs-content' },
          h2({ id: 'installation' }, t('docs.installation')),

          h3('Quick Start with create-elit'),
          p('The fastest way to get started is using create-elit to scaffold a new project:'),
          codeExample(`# Create a new project
npm create elit my-app

# With specific template
npm create elit my-app -- --template=basic
npm create elit my-app -- --template=full
npm create elit my-app -- --template=minimal

# Start development
cd my-app
npm install
npm run dev`),

          p('Available templates:'),
          ul(
            li(code('basic'), ' - Basic Elit app with counter example and SSR (default)'),
            li(code('full'), ' - Full-stack app with dev server, API routes, and HMR'),
            li(code('minimal'), ' - Minimal setup with just DOM rendering')
          ),

          h3('Manual Installation'),
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

          h3('CDN Installation'),
          p(t('docs.installCdn')),
          codeExample(`<script src="https://unpkg.com/elit@latest/dist/index.global.js"></script>`),

          h2({ id: 'devserver' }, t('docs.devServer')),
          p(t('docs.devServer.desc')),

          h3('CLI Commands'),
          p('Elit provides a powerful CLI for development and production:'),
          codeExample(`# Development server with HMR
npx elit dev

# Production build
npx elit build

# Preview production build
npx elit preview`),

          h3('Configuration File'),
          p('Create elit.config.mjs (or .ts, .js, .json) in your project root:'),
          codeExample(`import { router } from 'elit';
import { resolve } from 'path';

export default {
  dev: {
    port: 3000,
    host: 'localhost',
    root: './src',
    basePath: '/',
    open: true,
    https: false,

    // Proxy API requests to backend
    proxy: [
      {
        context: '/api',
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: { '^/api': '' }
      }
    ],

    // Web Workers configuration
    worker: [
      {
        path: 'workers/service-worker.js',
        name: 'serviceWorker',
        type: 'module'
      }
    ],

    // REST API endpoints
    api: router()
      .get('/api/data', (req, res) => {
        res.json({ message: 'Hello from API' });
      })
      .post('/api/data', (req, res) => {
        res.json({ success: true });
      }),

    // Custom middleware
    middleware: [
      (req, res, next) => {
        console.log('Request:', req.method, req.url);
        next();
      }
    ]
  },

  // Build configuration (single or array)
  build: {
    entry: './src/main.ts',
    outDir: './dist',
    outFile: 'main.js',
    format: 'esm',
    minify: true,
    sourcemap: false,
    platform: 'browser',
    basePath: '/app',
    copy: [
      {
        from: 'index.html',
        to: 'index.html',
        transform: (content, config) => {
          return content.replace(
            '<head>',
            \`<head><base href="\${config.basePath}/">\`
          );
        }
      },
      { from: 'assets', to: 'assets' }
    ],
    onBuildEnd: (result) => {
      console.log(\`✅ Build completed in \${result.buildTime}ms\`);
    }
  },

  preview: {
    port: 4173,
    root: './dist',
    basePath: '/app',
    open: true,
    https: false,

    // Preview supports same features as dev
    proxy: [...],
    worker: [...],
    api: router(),
    middleware: [...]
  }
};`),

          h3('Multi-Client Development'),
          p('Develop multiple applications simultaneously on different paths:'),
          codeExample(`export default {
  dev: {
    port: 3000,
    // Multi-client configuration
    clients: [
      {
        root: './app1',
        basePath: '/app1',
        watch: ['app1/**/*.ts'],
        proxy: [
          {
            context: '/api',
            target: 'http://localhost:8080'
          }
        ],
        worker: [
          {
            path: 'workers/app1-worker.js',
            type: 'module'
          }
        ],
        // API routes prefixed with basePath: /app1/api/...
        api: router()
          .get('/api/health', (req, res) => {
            res.json({ status: 'ok', app: 'app1' });
          }),
        middleware: [
          (req, res, next) => {
            console.log('App1:', req.url);
            next();
          }
        ]
      },
      {
        root: './app2',
        basePath: '/app2',
        watch: ['app2/**/*.ts'],
        // Each client can have its own config
        api: router()
          .get('/api/status', (req, res) => {
            res.json({ status: 'running', app: 'app2' });
          })
      }
    ]
  }
};

// Access:
// http://localhost:3000/app1  -> serves app1
// http://localhost:3000/app2  -> serves app2`),

          h3('Dev Server API'),
          p('Programmatic server control:'),
          codeExample(`import { createDevServer } from 'elit';

const server = await createDevServer({
  port: 3000,
  open: true,
  logging: true
});

// Stop server
await server.stop();

// Restart
await server.restart();`),

          h3('Build Tool'),
          p('Automatic client/server code separation with esbuild:'),
          codeExample(`import { build } from 'elit';

await build({
  entry: './src/main.ts',
  outDir: './dist',
  minify: true,
  platform: 'browser', // auto-externals Node.js modules
  basePath: '/app',
  copy: [
    { from: 'index.html', to: 'index.html' },
    { from: 'assets', to: 'assets' }
  ],
  onBuildEnd: (result) => {
    console.log(\`✅ Built in \${result.buildTime}ms\`);
  }
});`),

          h3('Multiple Builds'),
          p('Build multiple entry points in a single command using array configuration:'),
          codeExample(`// elit.config.mjs
export default {
  // Array of build configurations
  build: [
    {
      entry: './src/main.ts',
      outDir: './dist',
      outFile: 'main.js',
      format: 'esm',
      minify: true,
      basePath: '/app',
      copy: [
        { from: 'index.html', to: 'index.html' }
      ]
    },
    {
      entry: './src/admin.ts',
      outDir: './dist',
      outFile: 'admin.js',
      format: 'esm',
      minify: true,
      basePath: '/admin'
    },
    {
      entry: './src/worker.ts',
      outDir: './dist/workers',
      outFile: 'worker.js',
      format: 'iife',
      platform: 'browser'
    }
  ]
};

// Builds sequentially: [1/3], [2/3], [3/3]
// npx elit build`),

          p('CLI options override only the first build configuration:'),
          codeExample(`# Override first build's minify option
npx elit build --no-minify

# Use config array for all builds
npx elit build`),

          h3('REST API Router'),
          p('Built-in server-side routing with middleware:'),
          codeExample(`import { ServerRouter, json, cors, logger } from 'elit';

const api = new ServerRouter();

// Middleware
api.use(cors());
api.use(logger());

// Routes
api.get('/users/:id', async (ctx) => {
  const user = await db.getUser(ctx.params.id);
  return json({ user });
});

api.post('/users', async (ctx) => {
  const data = await ctx.json();
  return json({ user: data }, 201);
});

// Use with dev server
createDevServer({ api });`),

          h3('Shared State'),
          p('Real-time state synchronization via WebSocket:'),
          codeExample(`import { StateManager, SharedState } from 'elit';

// Server-side
const stateManager = new StateManager();
const counter = stateManager.create('counter', 0);

// Client-side
const counter = new SharedState('counter', 0);
counter.value++; // syncs to all clients`),

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
          ),

          h2({ id: 'deployment' }, 'Deployment'),
          p('Deploy your Elit application to production with these popular platforms:'),

          h3('Vercel'),
          p('Deploy to Vercel with zero configuration:'),
          codeExample(`# Install Vercel CLI
npm i -g vercel

# Build your app
npm run build

# Deploy
vercel --prod

# Or use vercel.json for configuration:
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "trailingSlash": false
}`),

          h3('Netlify'),
          p('Deploy to Netlify using their CLI or Git integration:'),
          codeExample(`# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist

# Or use netlify.toml:
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200`),

          h3('GitHub Pages'),
          p('Deploy to GitHub Pages with GitHub Actions:'),
          codeExample(`# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist`),

          h3('Docker'),
          p('Containerize your Elit application:'),
          codeExample(`# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# nginx.conf
server {
  listen 80;
  location / {
    root /usr/share/nginx/html;
    index index.html;
    try_files $uri $uri/ /index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Cache static assets
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
    }
  }
}`),

          h3('Node.js Production Server'),
          p('Serve your production build with Node.js:'),
          codeExample(`// server.js
import { createServer } from 'http';
import { readFileSync, statSync } from 'fs';
import { resolve, extname } from 'path';
import { lookup } from 'mime-types';
import { gzipSync } from 'zlib';

const port = process.env.PORT || 3000;
const dist = resolve('./dist');

createServer((req, res) => {
  let path = req.url === '/' ? '/index.html' : req.url;
  const filePath = resolve(dist, path.slice(1));

  try {
    const content = readFileSync(filePath);
    const mimeType = lookup(filePath) || 'text/html';
    const ext = extname(filePath);

    // Cache headers
    const cacheControl = ext === '.html'
      ? 'no-cache'
      : 'public, max-age=31536000, immutable';

    // Gzip compression
    const compressible = /^(text|application\\/(javascript|json))/.test(mimeType);
    const compressed = compressible ? gzipSync(content) : content;

    res.writeHead(200, {
      'Content-Type': mimeType,
      'Cache-Control': cacheControl,
      ...(compressible && { 'Content-Encoding': 'gzip' })
    });
    res.end(compressed);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
}).listen(port, () => console.log(\`Server running on port \${port}\`));`),

          h3('Environment Variables'),
          p('Use environment variables for different deployment environments:'),
          codeExample(`// .env.production
VITE_API_URL=https://api.example.com
VITE_ENV=production

// Access in your code
const apiUrl = import.meta.env.VITE_API_URL;
const isProd = import.meta.env.VITE_ENV === 'production';

// Build with environment
npm run build --mode production`)
        )
      )
    )
  );

export const DocsPage = () =>
  section({ style: 'padding-top: 5rem;' },
    Docs()
  );
