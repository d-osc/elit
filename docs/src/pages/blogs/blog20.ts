import {
  div, h1, h2, h3, p, ul, li, pre, code, strong, em, a
} from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog20: BlogPostDetail = {
  id: '20',
  title: {
    en: 'Mastering Elit Dev and Preview Servers',
    th: 'เชี่ยวชาญ Elit Dev และ Preview Servers'
  },
  date: '2024-04-20',
  author: 'n-devs',
  tags: ['Development', 'Configuration', 'Dev Server', 'Preview'],
  content: {
    en: div(
      p('Master the ', strong('Elit development and preview servers'), ' with this comprehensive guide. Learn how to configure single and multi-client setups, proxy forwarding, API endpoints, middleware, and production-ready deployments.'),

      h2('Development Server Overview'),
      p('The Elit dev server provides a powerful development environment with:'),
      ul(
        li('🔥 ', strong('Hot Module Replacement (HMR)'), ' - Instant updates without page refresh'),
        li('🌐 ', strong('HTTP/HTTPS Support'), ' - Secure development with SSL'),
        li('🔄 ', strong('Proxy Forwarding'), ' - Connect to backend APIs seamlessly'),
        li('👷 ', strong('Web Workers'), ' - Background processing support'),
        li('🛤️ ', strong('REST API'), ' - Build full-stack apps with integrated backend'),
        li('🔧 ', strong('Custom Middleware'), ' - Add logging, CORS, authentication, etc.'),
        li('🎨 ', strong('Server-Side Rendering'), ' - SSR support for initial page load'),
        li('🏗️ ', strong('Multi-Client Setup'), ' - Run multiple apps on one server')
      ),

      h2('Basic Dev Server Setup'),
      h3('1. Simple Configuration'),
      p('Start with a basic configuration for single-page applications:'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  dev: {
    port: 3000,
    host: 'localhost',
    root: './src',           // Serve files from src directory
    basePath: '/',           // Base URL path
    open: true,              // Auto-open browser
    logging: true            // Enable request logging
  }
}`))),

      h3('2. Start Development Server'),
      pre(code(...codeBlock(`# Using config file
npx elit dev

# Or with CLI options (overrides config)
npx elit dev --port 8080 --root ./public --no-open`))),

      h2('Advanced Dev Server Features'),

      h3('1. Proxy Configuration'),
      p('Forward API requests to backend servers during development:'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  dev: {
    port: 3000,
    root: './src',

    // Global proxy - applies to all requests
    proxy: [
      {
        context: '/api',                    // Match URLs starting with /api
        target: 'http://localhost:8080',    // Backend server
        changeOrigin: true,                 // Change host header
        pathRewrite: { '^/api': '/v1' }    // Rewrite /api to /v1
      },
      {
        context: '/graphql',
        target: 'http://localhost:4000',
        changeOrigin: true,
        ws: true                            // Enable WebSocket proxying
      }
    ]
  }
}`))),

      p('Now your frontend can make requests like:'),
      pre(code(...codeBlock(`// Frontend code
fetch('/api/users')           // → http://localhost:8080/v1/users
fetch('/graphql', { ... })    // → http://localhost:4000/graphql`))),

      h3('2. Web Workers'),
      p('Configure Web Workers for background processing:'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  dev: {
    port: 3000,

    // Global workers - loaded for all pages
    worker: [
      {
        path: 'workers/data-processor.js',
        name: 'dataProcessor',
        type: 'module'          // 'module' for ESM, 'classic' for traditional
      },
      {
        path: 'workers/cache-worker.js',
        name: 'cacheWorker',
        type: 'module'
      }
    ]
  }
}`))),

      p('Workers are automatically injected into your HTML:'),
      pre(code(...codeBlock(`// In your app code, workers are already available:
const worker = new Worker('/workers/data-processor.js', { type: 'module' });
worker.postMessage({ action: 'process', data: [...] });`))),

      h3('3. REST API Integration'),
      p('Build full-stack applications with integrated REST API:'),
      pre(code(...codeBlock(`// elit.config.ts
import { router } from 'elit/server';

export default {
  dev: {
    port: 3000,

    // REST API endpoints
    api: router()
      .get('/api/users', (req, res) => {
        res.json({ users: ['Alice', 'Bob'] });
      })
      .post('/api/users', (req, res) => {
        const user = req.body;
        res.status(201).json({ id: Date.now(), ...user });
      })
      .get('/api/users/:id', (req, res) => {
        const userId = req.params.id;
        res.json({ id: userId, name: 'Alice' });
      })
      .delete('/api/users/:id', (req, res) => {
        res.status(204).end();
      })
  }
}`))),

      h3('4. Custom Middleware'),
      p('Add middleware for logging, CORS, authentication, and more:'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  dev: {
    port: 3000,

    middleware: [
      // CORS middleware
      (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        next();
      },

      // Request logging
      (req, res, next) => {
        console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`);
        next();
      },

      // Authentication check
      (req, res, next) => {
        if (req.url.startsWith('/api/protected')) {
          const token = req.headers.authorization;
          if (!token) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
          }
        }
        next();
      }
    ]
  }
}`))),

      h3('5. Server-Side Rendering (SSR)'),
      p('Add SSR for initial page load with SEO benefits:'),
      pre(code(...codeBlock(`// elit.config.ts
import { div, h1, p } from 'elit';

export default {
  dev: {
    port: 3000,

    // SSR render function
    ssr: () => {
      // Return VNode or HTML string
      return div(
        h1('Welcome to My App'),
        p('This content is server-rendered!')
      );

      // Or return HTML string
      // return '<div><h1>Welcome</h1></div>';
    }
  }
}`))),

      h2('Multi-Client Development'),
      p('Run multiple applications on a single dev server with isolated configurations:'),

      h3('Complete Multi-Client Setup'),
      pre(code(...codeBlock(`// elit.config.ts
import { router } from 'elit/server';
import { resolve } from 'path';

export default {
  dev: {
    port: 3000,
    logging: true,

    // Multi-client configuration
    clients: [
      {
        root: resolve(__dirname, 'app1'),
        basePath: '/app1',              // Access at http://localhost:3000/app1

        // Client-specific proxy
        proxy: [
          {
            context: '/api',
            target: 'http://localhost:8081',
            changeOrigin: true
          }
        ],

        // Client-specific workers
        worker: [
          {
            path: 'workers/app1-worker.js',
            type: 'module'
          }
        ],

        // Client-specific API
        // Routes are auto-prefixed with basePath: /app1/api/health
        api: router()
          .get('/api/health', (req, res) => {
            res.json({ status: 'ok', app: 'app1' });
          })
          .get('/api/data', (req, res) => {
            res.json({ data: 'App1 data' });
          }),

        // Client-specific middleware
        middleware: [
          (req, res, next) => {
            console.log('App1 middleware:', req.url);
            next();
          }
        ]
      },
      {
        root: resolve(__dirname, 'app2'),
        basePath: '/app2',              // Access at http://localhost:3000/app2

        proxy: [
          {
            context: '/graphql',
            target: 'http://localhost:4000',
            ws: true
          }
        ],

        worker: [
          {
            path: 'workers/app2-worker.js',
            type: 'module'
          }
        ],

        // Routes auto-prefixed: /app2/api/status
        api: router()
          .get('/api/status', (req, res) => {
            res.json({ status: 'running', app: 'app2' });
          }),

        middleware: [
          (req, res, next) => {
            res.setHeader('X-App', 'app2');
            next();
          }
        ]
      }
    ],

    // Global configuration (applies to all clients)
    proxy: [
      {
        context: '/shared-api',
        target: 'http://localhost:9000'
      }
    ],

    worker: [
      {
        path: 'workers/shared-worker.js',
        name: 'sharedWorker',
        type: 'module'
      }
    ]
  }
}`))),

      h3('Priority Order in Multi-Client Setup'),
      ul(
        li(strong('Middleware:'), ' Client-specific → Global'),
        li(strong('API Routes:'), ' Client-specific → Global'),
        li(strong('Proxy:'), ' Client-specific (first match) → Global'),
        li(strong('Workers:'), ' Both client-specific and global are loaded')
      ),

      h2('Preview Server'),
      p('The preview server lets you test production builds locally before deployment. It has ', strong('full feature parity'), ' with the dev server.'),

      h3('1. Basic Preview Setup'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  // Build configuration
  build: {
    entry: 'src/main.ts',
    outDir: 'dist',
    minify: true
  },

  // Preview configuration
  preview: {
    port: 4173,
    host: 'localhost',
    root: 'dist',                // Serve from dist directory
    basePath: '/app',            // Base URL path
    open: true,
    logging: true
  }
}`))),

      h3('2. Build and Preview'),
      pre(code(...codeBlock(`# Build for production
npx elit build

# Preview the build
npx elit preview

# Or with custom options
npx elit preview --port 5000 --root ./dist`))),

      h3('3. Preview with All Features'),
      p('Preview mode supports all dev server features:'),
      pre(code(...codeBlock(`// elit.config.ts
import { router } from 'elit/server';

export default {
  build: {
    entry: 'src/main.ts',
    outDir: 'dist'
  },

  preview: {
    port: 4173,
    root: 'dist',
    basePath: '/app',
    https: false,               // Enable HTTPS if needed

    // REST API for preview
    api: router()
      .get('/api/health', (req, res) => {
        res.json({ status: 'ok' });
      }),

    // Custom middleware
    middleware: [
      (req, res, next) => {
        console.log('Preview request:', req.url);
        next();
      }
    ],

    // SSR support
    ssr: () => '<h1>Preview SSR</h1>',

    // Proxy configuration
    proxy: [
      {
        context: '/api',
        target: 'http://localhost:8080'
      }
    ],

    // Web Workers
    worker: [
      {
        path: 'workers/cache-worker.js',
        type: 'module'
      }
    ]
  }
}`))),

      h3('4. Multi-Client Preview'),
      p('Preview multiple apps just like in development:'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  // Multi-build configuration
  build: [
    {
      entry: 'src/app1/main.ts',
      outDir: 'dist/app1',
      outFile: 'app1.js'
    },
    {
      entry: 'src/app2/main.ts',
      outDir: 'dist/app2',
      outFile: 'app2.js'
    }
  ],

  // Multi-client preview
  preview: {
    port: 4173,

    clients: [
      {
        root: 'dist/app1',
        basePath: '/app1',
        api: router()
          .get('/api/health', (req, res) => {
            res.json({ status: 'ok', app: 'app1' });
          }),
        proxy: [
          {
            context: '/api',
            target: 'http://localhost:8081'
          }
        ]
      },
      {
        root: 'dist/app2',
        basePath: '/app2',
        api: router()
          .get('/api/status', (req, res) => {
            res.json({ status: 'running', app: 'app2' });
          })
      }
    ]
  }
}`))),

      h2('HTTPS Support'),
      p('Enable HTTPS for both dev and preview servers:'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  dev: {
    port: 3000,
    https: true              // Enables HTTPS with self-signed certificate
  },

  preview: {
    port: 4173,
    https: true
  }
}

// Access at: https://localhost:3000`))),

      h2('Environment Variables'),
      p('Use environment variables for configuration:'),
      pre(code(...codeBlock(`// .env.development
API_URL=http://localhost:8080
FEATURE_FLAG=true

// .env.production
API_URL=https://api.example.com
FEATURE_FLAG=false`))),

      p('Access in your configuration:'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  dev: {
    proxy: [
      {
        context: '/api',
        target: process.env.API_URL || 'http://localhost:8080'
      }
    ]
  },

  build: {
    entry: 'src/main.ts',
    env: {
      VITE_API_URL: process.env.API_URL,
      VITE_FEATURE_FLAG: process.env.FEATURE_FLAG
    }
  }
}

// In your app code (must prefix with VITE_)
console.log(import.meta.env.VITE_API_URL);`))),

      h2('Production Deployment'),

      h3('1. Build for Production'),
      pre(code(...codeBlock(`# Build with production optimizations
MODE=production npx elit build

# Output to dist/ directory with minification and tree-shaking`))),

      h3('2. Production Server Options'),

      p(strong('Option A: Static Hosting')),
      p('For static sites (no API/SSR):'),
      pre(code(...codeBlock(`# Deploy dist/ folder to:
# - Vercel, Netlify, GitHub Pages
# - AWS S3 + CloudFront
# - Any static hosting service`))),

      p(strong('Option B: Node.js Server')),
      p('For full-stack apps with API:'),
      pre(code(...codeBlock(`// server.js
import { createDevServer } from 'elit/server';

const server = createDevServer({
  port: process.env.PORT || 3000,
  root: './dist',
  basePath: '/app',

  api: router()
    .get('/api/health', (req, res) => {
      res.json({ status: 'ok' });
    }),

  proxy: [
    {
      context: '/api',
      target: process.env.API_URL
    }
  ]
});

console.log(\`Server running at \${server.url}\`);`))),

      p(strong('Option C: Docker Container')),
      pre(code(...codeBlock(`# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
COPY server.js ./
EXPOSE 3000
CMD ["node", "server.js"]

# Build and run
docker build -t my-app .
docker run -p 3000:3000 my-app`))),

      h2('Complete Production Example'),
      pre(code(...codeBlock(`// elit.config.ts
import { router } from 'elit/server';
import { resolve } from 'path';

const isDev = process.env.MODE !== 'production';

export default {
  // Development configuration
  dev: {
    port: 3000,
    root: './src',
    basePath: '/',
    logging: true,

    proxy: [
      {
        context: '/api',
        target: process.env.API_URL || 'http://localhost:8080',
        changeOrigin: true
      }
    ],

    worker: [
      {
        path: 'workers/dev-worker.js',
        type: 'module'
      }
    ],

    api: router()
      .get('/api/health', (req, res) => {
        res.json({ status: 'ok', env: 'development' });
      }),

    middleware: [
      (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        next();
      }
    ]
  },

  // Build configuration
  build: {
    entry: resolve(__dirname, 'src/main.ts'),
    outDir: resolve(__dirname, 'dist'),
    outFile: 'main.js',
    minify: true,
    sourcemap: !isDev,
    format: 'esm',
    target: 'es2020',
    platform: 'browser',
    treeshake: true,

    env: {
      VITE_API_URL: process.env.API_URL,
      VITE_APP_VERSION: process.env.npm_package_version
    },

    copy: [
      {
        from: 'index.html',
        to: 'index.html',
        transform: (content, config) => {
          return content.replace('src="src/main.ts"', 'src="main.js"');
        }
      },
      {
        from: 'public',
        to: '.'
      }
    ]
  },

  // Preview configuration
  preview: {
    port: 4173,
    root: 'dist',
    basePath: '/',
    logging: true,

    api: router()
      .get('/api/health', (req, res) => {
        res.json({ status: 'ok', env: 'preview' });
      }),

    proxy: [
      {
        context: '/api',
        target: process.env.API_URL || 'http://localhost:8080',
        changeOrigin: true
      }
    ]
  }
};`))),

      h2('Tips and Best Practices'),
      ul(
        li(strong('Use basePath consistently'), ' - Set the same basePath in dev, build, and preview'),
        li(strong('Test with preview'), ' - Always test production builds with preview before deploying'),
        li(strong('Environment variables'), ' - Use .env files for different environments (dev, staging, production)'),
        li(strong('Proxy during development'), ' - Avoid CORS issues by proxying API requests'),
        li(strong('Multi-client for microservices'), ' - Use clients[] for micro-frontend architectures'),
        li(strong('Worker for heavy tasks'), ' - Offload CPU-intensive operations to Web Workers'),
        li(strong('Middleware for cross-cutting concerns'), ' - Add logging, authentication, CORS in middleware'),
        li(strong('SSR for SEO'), ' - Use SSR for landing pages and marketing sites')
      ),

      h2('Troubleshooting'),

      h3('Port Already in Use'),
      pre(code(...codeBlock(`# Change the port
npx elit dev --port 8080

# Or kill the process using the port (Windows)
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Or kill the process (Unix/Mac)
lsof -ti:3000 | xargs kill`))),

      h3('Proxy Not Working'),
      pre(code(...codeBlock(`# Make sure changeOrigin is set
proxy: [
  {
    context: '/api',
    target: 'http://localhost:8080',
    changeOrigin: true    // Important for virtual hosted sites
  }
]

# Check the backend server is running
curl http://localhost:8080/api/health`))),

      h3('Workers Not Loading'),
      pre(code(...codeBlock(`# Ensure worker path is relative to root directory
worker: [
  {
    path: 'workers/my-worker.js',    // Relative to root, not absolute
    type: 'module'                    // Use 'module' for ESM
  }
]

# Check worker file exists
ls -la workers/my-worker.js`))),

      h2('Summary'),
      p('Elit dev and preview servers provide a complete development and testing environment:'),
      ul(
        li('🔥 Dev server with HMR for rapid development'),
        li('🌐 Proxy forwarding for seamless backend integration'),
        li('👷 Web Workers for background processing'),
        li('🛤️ REST API for full-stack development'),
        li('🔧 Custom middleware for cross-cutting concerns'),
        li('🎨 SSR support for SEO and initial page load'),
        li('🏗️ Multi-client setup for micro-frontends'),
        li('📦 Preview server for testing production builds'),
        li('⚙️ Full feature parity between dev and preview')
      ),

      p('With these powerful features, you can build and test everything from simple static sites to complex full-stack applications.'),

      h2('Next Steps'),
      ul(
        li(a({ href: '/blog/19' }, 'Read the Complete Configuration Guide')),
        li(a({ href: '/blog/18' }, 'Learn About Elit Features')),
        li(a({ href: '/blog/17' }, 'Master Hot Module Replacement')),
        li(a({ href: '/docs' }, 'Explore Full Documentation')),
        li(a({ href: '/examples' }, 'See Code Examples'))
      )
    ),

    th: div(
      p('เชี่ยวชาญ ', strong('Elit development และ preview servers'), ' ด้วยคู่มือฉบับสมบูรณ์นี้ เรียนรู้วิธีตั้งค่าแบบ single และ multi-client, proxy forwarding, API endpoints, middleware และการ deploy แบบ production'),

      h2('ภาพรวม Development Server'),
      p('Elit dev server มอบสภาพแวดล้อมการพัฒนาที่ทรงพลังด้วย:'),
      ul(
        li('🔥 ', strong('Hot Module Replacement (HMR)'), ' - อัพเดททันทีโดยไม่ต้อง refresh หน้า'),
        li('🌐 ', strong('HTTP/HTTPS Support'), ' - พัฒนาอย่างปลอดภัยด้วย SSL'),
        li('🔄 ', strong('Proxy Forwarding'), ' - เชื่อมต่อ backend APIs ได้อย่างราบรื่น'),
        li('👷 ', strong('Web Workers'), ' - รองรับการประมวลผลเบื้องหลัง'),
        li('🛤️ ', strong('REST API'), ' - สร้างแอพ full-stack ด้วย backend ที่รวมอยู่'),
        li('🔧 ', strong('Custom Middleware'), ' - เพิ่ม logging, CORS, authentication ฯลฯ'),
        li('🎨 ', strong('Server-Side Rendering'), ' - รองรับ SSR สำหรับการโหลดหน้าแรก'),
        li('🏗️ ', strong('Multi-Client Setup'), ' - รันหลายแอพบน server เดียว')
      ),

      h2('การตั้งค่า Dev Server พื้นฐาน'),
      h3('1. การตั้งค่าแบบง่าย'),
      p('เริ่มต้นด้วยการตั้งค่าพื้นฐานสำหรับ single-page applications:'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  dev: {
    port: 3000,
    host: 'localhost',
    root: './src',           // เสิร์ฟไฟล์จากโฟลเดอร์ src
    basePath: '/',           // เส้นทาง URL หลัก
    open: true,              // เปิด browser อotัติ
    logging: true            // เปิดการ log requests
  }
}`))),

      h3('2. เริ่ม Development Server'),
      pre(code(...codeBlock(`# ใช้ไฟล์ config
npx elit dev

# หรือใช้ตัวเลือก CLI (จะ override config)
npx elit dev --port 8080 --root ./public --no-open`))),

      h2('ฟีเจอร์ขั้นสูงของ Dev Server'),

      h3('1. การตั้งค่า Proxy'),
      p('ส่งต่อ API requests ไปยัง backend servers ระหว่างการพัฒนา:'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  dev: {
    port: 3000,
    root: './src',

    // Global proxy - ใช้กับทุก requests
    proxy: [
      {
        context: '/api',                    // จับคู่ URLs ที่ขึ้นต้นด้วย /api
        target: 'http://localhost:8080',    // Backend server
        changeOrigin: true,                 // เปลี่ยน host header
        pathRewrite: { '^/api': '/v1' }    // เขียน /api ใหม่เป็น /v1
      },
      {
        context: '/graphql',
        target: 'http://localhost:4000',
        changeOrigin: true,
        ws: true                            // เปิด WebSocket proxying
      }
    ]
  }
}`))),

      p('ตอนนี้ frontend สามารถเรียก requests แบบนี้:'),
      pre(code(...codeBlock(`// Frontend code
fetch('/api/users')           // → http://localhost:8080/v1/users
fetch('/graphql', { ... })    // → http://localhost:4000/graphql`))),

      h3('2. Web Workers'),
      p('ตั้งค่า Web Workers สำหรับการประมวลผลเบื้องหลัง:'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  dev: {
    port: 3000,

    // Global workers - โหลดสำหรับทุกหน้า
    worker: [
      {
        path: 'workers/data-processor.js',
        name: 'dataProcessor',
        type: 'module'          // 'module' สำหรับ ESM, 'classic' สำหรับแบบดั้งเดิม
      },
      {
        path: 'workers/cache-worker.js',
        name: 'cacheWorker',
        type: 'module'
      }
    ]
  }
}`))),

      p('Workers จะถูก inject เข้า HTML อัตโนมัติ:'),
      pre(code(...codeBlock(`// ในโค้ดแอพของคุณ workers พร้อมใช้งานแล้ว:
const worker = new Worker('/workers/data-processor.js', { type: 'module' });
worker.postMessage({ action: 'process', data: [...] });`))),

      h3('3. REST API Integration'),
      p('สร้างแอปพลิเคชัน full-stack ด้วย REST API ที่รวมอยู่:'),
      pre(code(...codeBlock(`// elit.config.ts
import { router } from 'elit/server';

export default {
  dev: {
    port: 3000,

    // REST API endpoints
    api: router()
      .get('/api/users', (req, res) => {
        res.json({ users: ['Alice', 'Bob'] });
      })
      .post('/api/users', (req, res) => {
        const user = req.body;
        res.status(201).json({ id: Date.now(), ...user });
      })
      .get('/api/users/:id', (req, res) => {
        const userId = req.params.id;
        res.json({ id: userId, name: 'Alice' });
      })
      .delete('/api/users/:id', (req, res) => {
        res.status(204).end();
      })
  }
}`))),

      h3('4. Custom Middleware'),
      p('เพิ่ม middleware สำหรับ logging, CORS, authentication และอื่นๆ:'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  dev: {
    port: 3000,

    middleware: [
      // CORS middleware
      (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        next();
      },

      // Request logging
      (req, res, next) => {
        console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`);
        next();
      },

      // Authentication check
      (req, res, next) => {
        if (req.url.startsWith('/api/protected')) {
          const token = req.headers.authorization;
          if (!token) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
          }
        }
        next();
      }
    ]
  }
}`))),

      h3('5. Server-Side Rendering (SSR)'),
      p('เพิ่ม SSR สำหรับการโหลดหน้าแรกพร้อม SEO benefits:'),
      pre(code(...codeBlock(`// elit.config.ts
import { div, h1, p } from 'elit';

export default {
  dev: {
    port: 3000,

    // SSR render function
    ssr: () => {
      // Return VNode หรือ HTML string
      return div(
        h1('ยินดีต้อนรับสู่แอพของฉัน'),
        p('เนื้อหานี้ถูก render ที่ server!')
      );

      // หรือ return HTML string
      // return '<div><h1>ยินดีต้อนรับ</h1></div>';
    }
  }
}`))),

      h2('Multi-Client Development'),
      p('รันหลายแอปพลิเคชันบน dev server เดียวพร้อมการตั้งค่าแยกกัน:'),

      h3('การตั้งค่า Multi-Client แบบสมบูรณ์'),
      pre(code(...codeBlock(`// elit.config.ts
import { router } from 'elit/server';
import { resolve } from 'path';

export default {
  dev: {
    port: 3000,
    logging: true,

    // การตั้งค่าแบบ multi-client
    clients: [
      {
        root: resolve(__dirname, 'app1'),
        basePath: '/app1',              // เข้าถึงที่ http://localhost:3000/app1

        // Proxy เฉพาะ client
        proxy: [
          {
            context: '/api',
            target: 'http://localhost:8081',
            changeOrigin: true
          }
        ],

        // Workers เฉพาะ client
        worker: [
          {
            path: 'workers/app1-worker.js',
            type: 'module'
          }
        ],

        // API เฉพาะ client
        // Routes จะถูกเติม prefix ด้วย basePath อัตโนมัติ: /app1/api/health
        api: router()
          .get('/api/health', (req, res) => {
            res.json({ status: 'ok', app: 'app1' });
          })
          .get('/api/data', (req, res) => {
            res.json({ data: 'App1 data' });
          }),

        // Middleware เฉพาะ client
        middleware: [
          (req, res, next) => {
            console.log('App1 middleware:', req.url);
            next();
          }
        ]
      },
      {
        root: resolve(__dirname, 'app2'),
        basePath: '/app2',              // เข้าถึงที่ http://localhost:3000/app2

        proxy: [
          {
            context: '/graphql',
            target: 'http://localhost:4000',
            ws: true
          }
        ],

        worker: [
          {
            path: 'workers/app2-worker.js',
            type: 'module'
          }
        ],

        // Routes ถูกเติม prefix อัตโนมัติ: /app2/api/status
        api: router()
          .get('/api/status', (req, res) => {
            res.json({ status: 'running', app: 'app2' });
          }),

        middleware: [
          (req, res, next) => {
            res.setHeader('X-App', 'app2');
            next();
          }
        ]
      }
    ],

    // การตั้งค่า Global (ใช้กับทุก clients)
    proxy: [
      {
        context: '/shared-api',
        target: 'http://localhost:9000'
      }
    ],

    worker: [
      {
        path: 'workers/shared-worker.js',
        name: 'sharedWorker',
        type: 'module'
      }
    ]
  }
}`))),

      h3('ลำดับความสำคัญใน Multi-Client Setup'),
      ul(
        li(strong('Middleware:'), ' Client-specific → Global'),
        li(strong('API Routes:'), ' Client-specific → Global'),
        li(strong('Proxy:'), ' Client-specific (จับคู่แรก) → Global'),
        li(strong('Workers:'), ' ทั้ง client-specific และ global จะถูกโหลด')
      ),

      h2('Preview Server'),
      p('Preview server ให้คุณทดสอบ production builds ในเครื่องก่อน deploy มี ', strong('ฟีเจอร์ครบเหมือนกัน'), ' กับ dev server'),

      h3('1. การตั้งค่า Preview พื้นฐาน'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  // การตั้งค่า Build
  build: {
    entry: 'src/main.ts',
    outDir: 'dist',
    minify: true
  },

  // การตั้งค่า Preview
  preview: {
    port: 4173,
    host: 'localhost',
    root: 'dist',                // เสิร์ฟจากโฟลเดอร์ dist
    basePath: '/app',            // เส้นทาง URL หลัก
    open: true,
    logging: true
  }
}`))),

      h3('2. Build และ Preview'),
      pre(code(...codeBlock(`# Build สำหรับ production
npx elit build

# Preview การ build
npx elit preview

# หรือด้วยตัวเลือกกำหนดเอง
npx elit preview --port 5000 --root ./dist`))),

      h3('3. Preview พร้อมฟีเจอร์ทั้งหมด'),
      p('Preview mode รองรับฟีเจอร์ทั้งหมดของ dev server:'),
      pre(code(...codeBlock(`// elit.config.ts
import { router } from 'elit/server';

export default {
  build: {
    entry: 'src/main.ts',
    outDir: 'dist'
  },

  preview: {
    port: 4173,
    root: 'dist',
    basePath: '/app',
    https: false,               // เปิด HTTPS ถ้าต้องการ

    // REST API สำหรับ preview
    api: router()
      .get('/api/health', (req, res) => {
        res.json({ status: 'ok' });
      }),

    // Custom middleware
    middleware: [
      (req, res, next) => {
        console.log('Preview request:', req.url);
        next();
      }
    ],

    // รองรับ SSR
    ssr: () => '<h1>Preview SSR</h1>',

    // การตั้งค่า Proxy
    proxy: [
      {
        context: '/api',
        target: 'http://localhost:8080'
      }
    ],

    // Web Workers
    worker: [
      {
        path: 'workers/cache-worker.js',
        type: 'module'
      }
    ]
  }
}`))),

      h3('4. Multi-Client Preview'),
      p('Preview หลายแอพเหมือนกับในโหมดพัฒนา:'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  // การตั้งค่า Multi-build
  build: [
    {
      entry: 'src/app1/main.ts',
      outDir: 'dist/app1',
      outFile: 'app1.js'
    },
    {
      entry: 'src/app2/main.ts',
      outDir: 'dist/app2',
      outFile: 'app2.js'
    }
  ],

  // Multi-client preview
  preview: {
    port: 4173,

    clients: [
      {
        root: 'dist/app1',
        basePath: '/app1',
        api: router()
          .get('/api/health', (req, res) => {
            res.json({ status: 'ok', app: 'app1' });
          }),
        proxy: [
          {
            context: '/api',
            target: 'http://localhost:8081'
          }
        ]
      },
      {
        root: 'dist/app2',
        basePath: '/app2',
        api: router()
          .get('/api/status', (req, res) => {
            res.json({ status: 'running', app: 'app2' });
          })
      }
    ]
  }
}`))),

      h2('การรองรับ HTTPS'),
      p('เปิด HTTPS สำหรับทั้ง dev และ preview servers:'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  dev: {
    port: 3000,
    https: true              // เปิด HTTPS ด้วย self-signed certificate
  },

  preview: {
    port: 4173,
    https: true
  }
}

// เข้าถึงที่: https://localhost:3000`))),

      h2('Environment Variables'),
      p('ใช้ environment variables สำหรับการตั้งค่า:'),
      pre(code(...codeBlock(`// .env.development
API_URL=http://localhost:8080
FEATURE_FLAG=true

// .env.production
API_URL=https://api.example.com
FEATURE_FLAG=false`))),

      p('เข้าถึงในการตั้งค่าของคุณ:'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  dev: {
    proxy: [
      {
        context: '/api',
        target: process.env.API_URL || 'http://localhost:8080'
      }
    ]
  },

  build: {
    entry: 'src/main.ts',
    env: {
      VITE_API_URL: process.env.API_URL,
      VITE_FEATURE_FLAG: process.env.FEATURE_FLAG
    }
  }
}

// ในโค้ดแอพของคุณ (ต้องขึ้นต้นด้วย VITE_)
console.log(import.meta.env.VITE_API_URL);`))),

      h2('Production Deployment'),

      h3('1. Build สำหรับ Production'),
      pre(code(...codeBlock(`# Build พร้อม production optimizations
MODE=production npx elit build

# Output ไปยังโฟลเดอร์ dist/ พร้อม minification และ tree-shaking`))),

      h3('2. ตัวเลือก Production Server'),

      p(strong('ตัวเลือก A: Static Hosting')),
      p('สำหรับเว็บไซต์แบบ static (ไม่มี API/SSR):'),
      pre(code(...codeBlock(`# Deploy โฟลเดอร์ dist/ ไปที่:
# - Vercel, Netlify, GitHub Pages
# - AWS S3 + CloudFront
# - บริการ static hosting ใดๆ`))),

      p(strong('ตัวเลือก B: Node.js Server')),
      p('สำหรับแอพ full-stack ที่มี API:'),
      pre(code(...codeBlock(`// server.js
import { createDevServer } from 'elit/server';

const server = createDevServer({
  port: process.env.PORT || 3000,
  root: './dist',
  basePath: '/app',

  api: router()
    .get('/api/health', (req, res) => {
      res.json({ status: 'ok' });
    }),

  proxy: [
    {
      context: '/api',
      target: process.env.API_URL
    }
  ]
});

console.log(\`Server running at \${server.url}\`);`))),

      p(strong('ตัวเลือก C: Docker Container')),
      pre(code(...codeBlock(`# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
COPY server.js ./
EXPOSE 3000
CMD ["node", "server.js"]

# Build และรัน
docker build -t my-app .
docker run -p 3000:3000 my-app`))),

      h2('ตัวอย่าง Production แบบสมบูรณ์'),
      pre(code(...codeBlock(`// elit.config.ts
import { router } from 'elit/server';
import { resolve } from 'path';

const isDev = process.env.MODE !== 'production';

export default {
  // การตั้งค่า Development
  dev: {
    port: 3000,
    root: './src',
    basePath: '/',
    logging: true,

    proxy: [
      {
        context: '/api',
        target: process.env.API_URL || 'http://localhost:8080',
        changeOrigin: true
      }
    ],

    worker: [
      {
        path: 'workers/dev-worker.js',
        type: 'module'
      }
    ],

    api: router()
      .get('/api/health', (req, res) => {
        res.json({ status: 'ok', env: 'development' });
      }),

    middleware: [
      (req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        next();
      }
    ]
  },

  // การตั้งค่า Build
  build: {
    entry: resolve(__dirname, 'src/main.ts'),
    outDir: resolve(__dirname, 'dist'),
    outFile: 'main.js',
    minify: true,
    sourcemap: !isDev,
    format: 'esm',
    target: 'es2020',
    platform: 'browser',
    treeshake: true,

    env: {
      VITE_API_URL: process.env.API_URL,
      VITE_APP_VERSION: process.env.npm_package_version
    },

    copy: [
      {
        from: 'index.html',
        to: 'index.html',
        transform: (content, config) => {
          return content.replace('src="src/main.ts"', 'src="main.js"');
        }
      },
      {
        from: 'public',
        to: '.'
      }
    ]
  },

  // การตั้งค่า Preview
  preview: {
    port: 4173,
    root: 'dist',
    basePath: '/',
    logging: true,

    api: router()
      .get('/api/health', (req, res) => {
        res.json({ status: 'ok', env: 'preview' });
      }),

    proxy: [
      {
        context: '/api',
        target: process.env.API_URL || 'http://localhost:8080',
        changeOrigin: true
      }
    ]
  }
};`))),

      h2('เคล็ดลับและแนวปฏิบัติที่ดี'),
      ul(
        li(strong('ใช้ basePath อย่างสม่ำเสมอ'), ' - ตั้ง basePath เหมือนกันใน dev, build และ preview'),
        li(strong('ทดสอบด้วย preview'), ' - ทดสอบ production builds ด้วย preview เสมอก่อน deploy'),
        li(strong('Environment variables'), ' - ใช้ไฟล์ .env สำหรับ environments ต่างๆ (dev, staging, production)'),
        li(strong('Proxy ระหว่างการพัฒนา'), ' - หลีกเลี่ยงปัญหา CORS ด้วยการ proxy API requests'),
        li(strong('Multi-client สำหรับ microservices'), ' - ใช้ clients[] สำหรับสถาปัตยกรรม micro-frontend'),
        li(strong('Worker สำหรับงานหนัก'), ' - ถ่ายโอนงานที่ใช้ CPU มากไปยัง Web Workers'),
        li(strong('Middleware สำหรับ cross-cutting concerns'), ' - เพิ่ม logging, authentication, CORS ใน middleware'),
        li(strong('SSR สำหรับ SEO'), ' - ใช้ SSR สำหรับหน้า landing pages และเว็บไซต์การตลาด')
      ),

      h2('การแก้ไขปัญหา'),

      h3('Port ถูกใช้งานแล้ว'),
      pre(code(...codeBlock(`# เปลี่ยน port
npx elit dev --port 8080

# หรือปิด process ที่ใช้ port นั้น (Windows)
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# หรือปิด process (Unix/Mac)
lsof -ti:3000 | xargs kill`))),

      h3('Proxy ไม่ทำงาน'),
      pre(code(...codeBlock(`# ตรวจสอบว่า changeOrigin ถูกตั้งค่า
proxy: [
  {
    context: '/api',
    target: 'http://localhost:8080',
    changeOrigin: true    // สำคัญสำหรับ virtual hosted sites
  }
]

# ตรวจสอบว่า backend server กำลังรันอยู่
curl http://localhost:8080/api/health`))),

      h3('Workers ไม่โหลด'),
      pre(code(...codeBlock(`# ตรวจสอบว่า worker path เป็น relative ต่อ root directory
worker: [
  {
    path: 'workers/my-worker.js',    // Relative ต่อ root ไม่ใช่ absolute
    type: 'module'                    // ใช้ 'module' สำหรับ ESM
  }
]

# ตรวจสอบว่าไฟล์ worker มีอยู่
ls -la workers/my-worker.js`))),

      h2('สรุป'),
      p('Elit dev และ preview servers มอบสภาพแวดล้อมการพัฒนาและทดสอบที่สมบูรณ์:'),
      ul(
        li('🔥 Dev server พร้อม HMR สำหรับการพัฒนาอย่างรวดเร็ว'),
        li('🌐 Proxy forwarding สำหรับการรวม backend อย่างราบรื่น'),
        li('👷 Web Workers สำหรับการประมวลผลเบื้องหลัง'),
        li('🛤️ REST API สำหรับการพัฒนา full-stack'),
        li('🔧 Custom middleware สำหรับ cross-cutting concerns'),
        li('🎨 รองรับ SSR สำหรับ SEO และการโหลดหน้าแรก'),
        li('🏗️ การตั้งค่า Multi-client สำหรับ micro-frontends'),
        li('📦 Preview server สำหรับทดสอบ production builds'),
        li('⚙️ ฟีเจอร์ครบเท่ากันระหว่าง dev และ preview')
      ),

      p('ด้วยฟีเจอร์ที่ทรงพลังเหล่านี้ คุณสามารถสร้างและทดสอบทุกอย่างตั้งแต่เว็บไซต์แบบ static อย่างง่ายไปจนถึงแอปพลิเคชัน full-stack ที่ซับซ้อน'),

      h2('ขั้นตอนต่อไป'),
      ul(
        li(a({ href: '/blog/19' }, 'อ่านคู่มือการตั้งค่าฉบับสมบูรณ์')),
        li(a({ href: '/blog/18' }, 'เรียนรู้เกี่ยวกับฟีเจอร์ของ Elit')),
        li(a({ href: '/blog/17' }, 'เชี่ยวชาญ Hot Module Replacement')),
        li(a({ href: '/docs' }, 'สำรวจเอกสารฉบับเต็ม')),
        li(a({ href: '/examples' }, 'ดูตัวอย่างโค้ด'))
      )
    )
  }
};
