import {
  div, h1, h2, h3, p, ul, li, pre, code, strong, em, a
} from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog19: BlogPostDetail = {
  id: '19',
  title: {
    en: 'Complete Guide to Elit Configuration',
    th: 'คู่มือการตั้งค่า Elit อย่างครบถ้วน'
  },
  date: '2024-04-20',
  author: 'n-devs',
  tags: ['Configuration', 'elit.config', 'Setup', 'Advanced'],
  content: {
    en: div(
      p('Master ', strong('Elit configuration'), ' to unlock the full power of your development workflow. This comprehensive guide covers ', em('dev server, multi-client setup, build configurations, proxy, workers, API, middleware'), ', and advanced features.'),

      h2('Configuration File'),
      p('Elit supports multiple configuration file formats:'),
      ul(
        li(strong('elit.config.ts'), ' - TypeScript (recommended, with type safety)'),
        li(strong('elit.config.js'), ' or ', strong('elit.config.mjs'), ' - JavaScript ES modules'),
        li(strong('elit.config.cjs'), ' - CommonJS'),
        li(strong('elit.config.json'), ' - JSON format')
      ),

      h2('Basic Configuration'),
      h3('Simple Setup'),
      pre(code(...codeBlock(`// elit.config.ts
import { resolve } from 'path';

export default {
  dev: {
    port: 3000,
    host: 'localhost',
    root: './src',
    basePath: '/app',
    open: true,
    logging: true
  },
  build: {
    entry: 'src/main.ts',
    outDir: 'dist',
    outFile: 'bundle.js',
    format: 'esm',
    minify: true,
    sourcemap: false
  },
  preview: {
    port: 4173,
    root: 'dist',
    basePath: '/app'
  }
}`))),

      h2('Development Server Configuration'),
      h3('Single Client Setup'),
      pre(code(...codeBlock(`export default {
  dev: {
    port: 3000,
    host: 'localhost',
    root: './src',
    basePath: '/app',
    open: true,
    logging: true,
    https: false,

    // Watch patterns
    watch: ['src/**/*.ts', 'public/**/*'],
    ignore: ['node_modules/**', '**/*.test.ts']
  }
}`))),

      h3('Multi-Client Setup'),
      p('Run multiple applications on the same port with different base paths:'),
      pre(code(...codeBlock(`export default {
  dev: {
    port: 3000,
    clients: [
      {
        root: './app1',
        basePath: '/app1',
        watch: ['app1/**/*.ts'],
        ssr: () => '<h1>App 1</h1>'
      },
      {
        root: './app2',
        basePath: '/app2',
        watch: ['app2/**/*.ts'],
        ssr: () => '<h1>App 2</h1>'
      }
    ]
  }
}`))),

      h2('Build Configuration'),
      h3('Single Build'),
      pre(code(...codeBlock(`export default {
  build: {
    entry: 'src/main.ts',
    outDir: 'dist',
    outFile: 'bundle.js',
    format: 'esm',      // 'esm', 'cjs', 'iife'
    target: 'es2020',   // es2015-es2022, esnext
    platform: 'browser', // 'browser', 'node', 'neutral'
    minify: true,
    sourcemap: false,
    treeshake: true,
    basePath: '/app',

    // External dependencies (not bundled)
    external: ['react', 'react-dom'],

    // Environment variables
    env: {
      API_URL: 'https://api.example.com',
      VERSION: '1.0.0'
    },

    // Copy static files
    copy: [
      { from: 'index.html', to: 'index.html' },
      { from: 'public/**/*', to: 'public' }
    ]
  }
}`))),

      h3('Multiple Builds'),
      p('Build multiple entries in a single command:'),
      pre(code(...codeBlock(`export default {
  build: [
    // Main application
    {
      entry: 'src/app.ts',
      outDir: 'dist',
      outFile: 'app.js',
      format: 'esm',
      minify: true
    },
    // Admin panel
    {
      entry: 'src/admin.ts',
      outDir: 'dist',
      outFile: 'admin.js',
      format: 'esm',
      minify: true
    },
    // Web Worker
    {
      entry: 'src/worker.ts',
      outDir: 'dist/workers',
      outFile: 'worker.js',
      format: 'esm',
      platform: 'browser'
    }
  ]
}

// Run all builds sequentially:
// npx elit build`))),

      h2('Proxy Configuration'),
      p('Forward API requests to backend servers during development:'),

      h3('Global Proxy'),
      pre(code(...codeBlock(`export default {
  dev: {
    port: 3000,
    proxy: [
      {
        context: '/api',
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      {
        context: '/graphql',
        target: 'http://localhost:4000',
        changeOrigin: true,
        pathRewrite: { '^/graphql': '/api/graphql' },
        headers: {
          'X-Custom-Header': 'value'
        },
        ws: true  // Enable WebSocket proxying
      }
    ]
  }
}`))),

      h3('Client-Specific Proxy'),
      pre(code(...codeBlock(`export default {
  dev: {
    clients: [
      {
        root: './app1',
        basePath: '/app1',
        proxy: [
          {
            context: '/api',
            target: 'http://localhost:8080',
            changeOrigin: true
          }
        ]
      },
      {
        root: './app2',
        basePath: '/app2',
        proxy: [
          {
            context: '/graphql',
            target: 'http://localhost:4000',
            changeOrigin: true
          }
        ]
      }
    ]
  }
}

// Proxy Priority:
// 1. Client-specific proxy (clients[].proxy)
// 2. Global proxy (dev.proxy)`))),

      h2('Web Workers Configuration'),
      p('Configure Web Workers for background processing:'),

      h3('Global Workers'),
      pre(code(...codeBlock(`export default {
  dev: {
    worker: [
      {
        path: 'workers/shared-worker.js',
        name: 'sharedWorker',
        type: 'module'  // 'module' or 'classic'
      }
    ]
  }
}`))),

      h3('Client-Specific Workers'),
      pre(code(...codeBlock(`export default {
  dev: {
    clients: [
      {
        root: './app1',
        basePath: '/app1',
        worker: [
          {
            path: 'workers/data-processor.js',
            name: 'dataProcessor',
            type: 'module'
          }
        ]
      }
    ]
  }
}

// Both global and client-specific workers will be loaded`))),

      h2('REST API Configuration'),
      p('Define REST API endpoints using the built-in router:'),

      h3('Global API'),
      pre(code(...codeBlock(`import { router } from 'elit/server';

export default {
  dev: {
    api: router()
      .get('/api/users', (req, res) => {
        res.json({ users: [] });
      })
      .post('/api/users', (req, res) => {
        res.json({ message: 'User created' });
      })
      .get('/api/users/:id', (req, res) => {
        res.json({ id: req.params.id });
      })
  }
}`))),

      h3('Client-Specific API'),
      p('Each client can have its own API endpoints. API paths are automatically prefixed with the client\'s basePath:'),
      pre(code(...codeBlock(`import { router } from 'elit/server';

export default {
  dev: {
    clients: [
      {
        root: './app1',
        basePath: '/app1',
        // API routes are prefixed with basePath
        // This route becomes: /app1/api/health
        api: router()
          .get('/api/health', (req, res) => {
            res.json({ status: 'ok', app: 'app1' });
          })
      },
      {
        root: './app2',
        basePath: '/app2',
        // This route becomes: /app2/api/status
        api: router()
          .get('/api/status', (req, res) => {
            res.json({ status: 'running', app: 'app2' });
          })
      }
    ]
  }
}`))),

      h2('Middleware Configuration'),
      p('Add custom middleware for request processing:'),

      h3('Global Middleware'),
      pre(code(...codeBlock(`export default {
  dev: {
    middleware: [
      // Logging middleware
      (req, res, next) => {
        console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`);
        next();
      },
      // Custom headers
      (req, res, next) => {
        res.setHeader('X-Powered-By', 'Elit');
        next();
      },
      // Authentication check
      (req, res, next) => {
        if (req.url.startsWith('/admin') && !req.headers.authorization) {
          res.writeHead(401);
          res.end('Unauthorized');
          return;
        }
        next();
      }
    ]
  }
}`))),

      h3('Client-Specific Middleware'),
      pre(code(...codeBlock(`export default {
  dev: {
    clients: [
      {
        root: './app1',
        basePath: '/app1',
        middleware: [
          (req, res, next) => {
            console.log('App1 middleware:', req.url);
            next();
          }
        ]
      }
    ]
  }
}

// Middleware Priority:
// 1. Client-specific middleware (runs first)
// 2. Global middleware (runs second)`))),

      h2('Server-Side Rendering (SSR)'),
      p('Configure SSR for initial page load:'),
      pre(code(...codeBlock(`import { div, h1 } from 'elit';

export default {
  dev: {
    ssr: () => {
      // Return VNode or HTML string
      return div({ className: 'app' },
        h1('Server-Rendered Content')
      );
    }
  },

  // Client-specific SSR
  // clients: [
  //   {
  //     root: './app1',
  //     basePath: '/app1',
  //     ssr: () => '<h1>App 1 SSR</h1>'
  //   }
  // ]
}`))),

      h2('Preview Configuration'),
      p('Preview mode supports all dev features for production builds:'),
      pre(code(...codeBlock(`import { router } from 'elit/server';

export default {
  preview: {
    port: 4173,
    host: 'localhost',
    root: 'dist',
    basePath: '/app',
    https: false,
    open: true,
    logging: true,

    // API endpoints
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

    // SSR
    ssr: () => '<h1>Preview SSR</h1>',

    // Proxy
    proxy: [
      {
        context: '/api',
        target: 'http://localhost:8080'
      }
    ],

    // Workers
    worker: [
      {
        path: 'workers/cache-worker.js',
        type: 'module'
      }
    ],

    // Multi-client preview
    // clients: [...]
  }
}`))),

      h2('Complete Example'),
      p('A production-ready configuration:'),
      pre(code(...codeBlock(`import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { router } from 'elit/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  // Development server
  dev: {
    port: 3000,
    host: 'localhost',
    open: true,
    logging: true,

    // Multi-client setup
    clients: [
      {
        root: resolve(__dirname, 'apps/web'),
        basePath: '/web',
        watch: ['apps/web/**/*.ts'],
        proxy: [
          {
            context: '/api',
            target: 'http://localhost:8080',
            changeOrigin: true
          }
        ],
        worker: [
          {
            path: 'workers/web-worker.js',
            type: 'module'
          }
        ],
        api: router()
          .get('/api/health', (req, res) => {
            res.json({ status: 'ok' });
          }),
        middleware: [
          (req, res, next) => {
            console.log('Web app:', req.url);
            next();
          }
        ],
        ssr: () => '<h1>Web App</h1>'
      },
      {
        root: resolve(__dirname, 'apps/admin'),
        basePath: '/admin',
        watch: ['apps/admin/**/*.ts'],
        api: router()
          .get('/api/stats', (req, res) => {
            res.json({ stats: {} });
          })
      }
    ],

    // Global configuration
    proxy: [
      {
        context: '/shared-api',
        target: 'http://localhost:9000',
        changeOrigin: true
      }
    ],
    worker: [
      {
        path: 'workers/shared-worker.js',
        name: 'sharedWorker',
        type: 'module'
      }
    ]
  },

  // Build configuration (multiple builds)
  build: [
    {
      entry: resolve(__dirname, 'apps/web/main.ts'),
      outDir: resolve(__dirname, 'dist/web'),
      outFile: 'bundle.js',
      format: 'esm',
      target: 'es2020',
      minify: true,
      sourcemap: false,
      basePath: '/web',
      copy: [
        {
          from: 'apps/web/index.html',
          to: 'index.html',
          transform: (content, config) => {
            return content.replace(
              '<head>',
              \`<head>\\n  <base href="\${config.basePath}/">\`
            );
          }
        }
      ]
    },
    {
      entry: resolve(__dirname, 'apps/admin/main.ts'),
      outDir: resolve(__dirname, 'dist/admin'),
      outFile: 'bundle.js',
      format: 'esm',
      target: 'es2020',
      minify: true,
      basePath: '/admin'
    }
  ],

  // Preview server
  preview: {
    port: 4173,
    host: 'localhost',
    open: true,
    logging: true,

    clients: [
      {
        root: resolve(__dirname, 'dist/web'),
        basePath: '/web'
      },
      {
        root: resolve(__dirname, 'dist/admin'),
        basePath: '/admin'
      }
    ]
  }
}`))),

      h2('Environment Variables'),
      p('Elit automatically loads environment variables from .env files:'),
      pre(code(...codeBlock(`# .env.development
MODE=development
VITE_API_URL=http://localhost:8080
VITE_DEBUG=true

# .env.production
MODE=production
VITE_API_URL=https://api.production.com
VITE_DEBUG=false`))),

      p('Access in your code:'),
      pre(code(...codeBlock(`// Only variables prefixed with VITE_ are exposed to client
console.log(import.meta.env.VITE_API_URL);
console.log(import.meta.env.VITE_DEBUG);`))),

      h2('CLI Commands'),
      p('Use Elit CLI with your configuration:'),
      pre(code(...codeBlock(`# Development
npx elit dev                    # Uses config file
npx elit dev --port 8080        # Override config

# Build
npx elit build                  # Runs all builds from config
npx elit build --entry src/app.ts  # Single build (ignores config)

# Preview
npx elit preview                # Uses config file
npx elit preview --port 5000    # Override config`))),

      h2('Best Practices'),
      ul(
        li(strong('Use TypeScript config'), ' for better type safety and autocompletion'),
        li(strong('Separate concerns'), ' - Use multi-client setup for different apps'),
        li(strong('Environment-specific configs'), ' - Create separate configs for dev/prod'),
        li(strong('Organize builds'), ' - Use multiple builds for different entry points'),
        li(strong('Leverage middleware'), ' - Add logging, auth, and custom processing'),
        li(strong('Configure proxy carefully'), ' - Use client-specific proxy when needed'),
        li(strong('Use SSR wisely'), ' - Only for initial load optimization'),
        li(strong('Test preview mode'), ' - Always test production builds before deploying')
      ),

      h2('Next Steps'),
      ul(
        li(a({ href: '/elit/blog/18' }, 'Complete Guide to Elit')),
        li(a({ href: '/elit/blog/17' }, 'Hot Module Replacement with Elit')),
        li(a({ href: '/elit/docs' }, 'Full Documentation')),
        li(a({ href: '/elit/api' }, 'API Reference'))
      ),

      p('Ready to build amazing applications with Elit! 🚀')
    ),
    th: div(
      p('เชี่ยวชาญ ', strong('การตั้งค่า Elit'), ' เพื่อปลดล็อกพลังเต็มรูปแบบของ workflow การพัฒนา คู่มือฉบับสมบูรณ์นี้ครอบคลุม ', em('dev server, multi-client setup, build configurations, proxy, workers, API, middleware'), ' และฟีเจอร์ขั้นสูง'),

      h2('ไฟล์ Configuration'),
      p('Elit รองรับหลายรูปแบบของไฟล์ config:'),
      ul(
        li(strong('elit.config.ts'), ' - TypeScript (แนะนำ มี type safety)'),
        li(strong('elit.config.js'), ' หรือ ', strong('elit.config.mjs'), ' - JavaScript ES modules'),
        li(strong('elit.config.cjs'), ' - CommonJS'),
        li(strong('elit.config.json'), ' - JSON format')
      ),

      h2('การตั้งค่าพื้นฐาน'),
      h3('Setup แบบง่าย'),
      pre(code(...codeBlock(`// elit.config.ts
import { resolve } from 'path';

export default {
  dev: {
    port: 3000,
    host: 'localhost',
    root: './src',
    basePath: '/app',
    open: true,
    logging: true
  },
  build: {
    entry: 'src/main.ts',
    outDir: 'dist',
    outFile: 'bundle.js',
    format: 'esm',
    minify: true,
    sourcemap: false
  },
  preview: {
    port: 4173,
    root: 'dist',
    basePath: '/app'
  }
}`))),

      h2('การตั้งค่า Development Server'),
      h3('Single Client Setup'),
      pre(code(...codeBlock(`export default {
  dev: {
    port: 3000,
    host: 'localhost',
    root: './src',
    basePath: '/app',
    open: true,
    logging: true,
    https: false,

    // Watch patterns
    watch: ['src/**/*.ts', 'public/**/*'],
    ignore: ['node_modules/**', '**/*.test.ts']
  }
}`))),

      h3('Multi-Client Setup'),
      p('รันหลายแอพพลิเคชันบน port เดียวกันด้วย base path ที่ต่างกัน:'),
      pre(code(...codeBlock(`export default {
  dev: {
    port: 3000,
    clients: [
      {
        root: './app1',
        basePath: '/app1',
        watch: ['app1/**/*.ts'],
        ssr: () => '<h1>App 1</h1>'
      },
      {
        root: './app2',
        basePath: '/app2',
        watch: ['app2/**/*.ts'],
        ssr: () => '<h1>App 2</h1>'
      }
    ]
  }
}`))),

      h2('การตั้งค่า Build'),
      h3('Single Build'),
      pre(code(...codeBlock(`export default {
  build: {
    entry: 'src/main.ts',
    outDir: 'dist',
    outFile: 'bundle.js',
    format: 'esm',      // 'esm', 'cjs', 'iife'
    target: 'es2020',   // es2015-es2022, esnext
    platform: 'browser', // 'browser', 'node', 'neutral'
    minify: true,
    sourcemap: false,
    treeshake: true,
    basePath: '/app',

    // External dependencies (ไม่ bundle)
    external: ['react', 'react-dom'],

    // Environment variables
    env: {
      API_URL: 'https://api.example.com',
      VERSION: '1.0.0'
    },

    // Copy static files
    copy: [
      { from: 'index.html', to: 'index.html' },
      { from: 'public/**/*', to: 'public' }
    ]
  }
}`))),

      h3('Multiple Builds'),
      p('Build หลาย entries ในคำสั่งเดียว:'),
      pre(code(...codeBlock(`export default {
  build: [
    // Main application
    {
      entry: 'src/app.ts',
      outDir: 'dist',
      outFile: 'app.js',
      format: 'esm',
      minify: true
    },
    // Admin panel
    {
      entry: 'src/admin.ts',
      outDir: 'dist',
      outFile: 'admin.js',
      format: 'esm',
      minify: true
    },
    // Web Worker
    {
      entry: 'src/worker.ts',
      outDir: 'dist/workers',
      outFile: 'worker.js',
      format: 'esm',
      platform: 'browser'
    }
  ]
}

// รัน build ทั้งหมดตามลำดับ:
// npx elit build`))),

      h2('Proxy Configuration'),
      p('ส่งต่อ API requests ไปยัง backend servers ระหว่างพัฒนา:'),

      h3('Global Proxy'),
      pre(code(...codeBlock(`export default {
  dev: {
    port: 3000,
    proxy: [
      {
        context: '/api',
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      {
        context: '/graphql',
        target: 'http://localhost:4000',
        changeOrigin: true,
        pathRewrite: { '^/graphql': '/api/graphql' },
        headers: {
          'X-Custom-Header': 'value'
        },
        ws: true  // เปิด WebSocket proxying
      }
    ]
  }
}`))),

      h3('Client-Specific Proxy'),
      pre(code(...codeBlock(`export default {
  dev: {
    clients: [
      {
        root: './app1',
        basePath: '/app1',
        proxy: [
          {
            context: '/api',
            target: 'http://localhost:8080',
            changeOrigin: true
          }
        ]
      },
      {
        root: './app2',
        basePath: '/app2',
        proxy: [
          {
            context: '/graphql',
            target: 'http://localhost:4000',
            changeOrigin: true
          }
        ]
      }
    ]
  }
}

// ลำดับความสำคัญของ Proxy:
// 1. Client-specific proxy (clients[].proxy)
// 2. Global proxy (dev.proxy)`))),

      h2('Web Workers Configuration'),
      p('ตั้งค่า Web Workers สำหรับ background processing:'),

      h3('Global Workers'),
      pre(code(...codeBlock(`export default {
  dev: {
    worker: [
      {
        path: 'workers/shared-worker.js',
        name: 'sharedWorker',
        type: 'module'  // 'module' หรือ 'classic'
      }
    ]
  }
}`))),

      h3('Client-Specific Workers'),
      pre(code(...codeBlock(`export default {
  dev: {
    clients: [
      {
        root: './app1',
        basePath: '/app1',
        worker: [
          {
            path: 'workers/data-processor.js',
            name: 'dataProcessor',
            type: 'module'
          }
        ]
      }
    ]
  }
}

// Global และ client-specific workers จะโหลดทั้งคู่`))),

      h2('REST API Configuration'),
      p('กำหนด REST API endpoints ด้วย router ที่มีให้:'),

      h3('Global API'),
      pre(code(...codeBlock(`import { router } from 'elit/server';

export default {
  dev: {
    api: router()
      .get('/api/users', (req, res) => {
        res.json({ users: [] });
      })
      .post('/api/users', (req, res) => {
        res.json({ message: 'User created' });
      })
      .get('/api/users/:id', (req, res) => {
        res.json({ id: req.params.id });
      })
  }
}`))),

      h3('Client-Specific API'),
      p('แต่ละ client สามารถมี API endpoints ของตัวเองได้ API paths จะถูก prefix ด้วย basePath ของ client อัตโนมัติ:'),
      pre(code(...codeBlock(`import { router } from 'elit/server';

export default {
  dev: {
    clients: [
      {
        root: './app1',
        basePath: '/app1',
        // API routes จะ prefix ด้วย basePath
        // route นี้จะกลายเป็น: /app1/api/health
        api: router()
          .get('/api/health', (req, res) => {
            res.json({ status: 'ok', app: 'app1' });
          })
      },
      {
        root: './app2',
        basePath: '/app2',
        // route นี้จะกลายเป็น: /app2/api/status
        api: router()
          .get('/api/status', (req, res) => {
            res.json({ status: 'running', app: 'app2' });
          })
      }
    ]
  }
}`))),

      h2('Middleware Configuration'),
      p('เพิ่ม middleware สำหรับ request processing:'),

      h3('Global Middleware'),
      pre(code(...codeBlock(`export default {
  dev: {
    middleware: [
      // Logging middleware
      (req, res, next) => {
        console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`);
        next();
      },
      // Custom headers
      (req, res, next) => {
        res.setHeader('X-Powered-By', 'Elit');
        next();
      },
      // Authentication check
      (req, res, next) => {
        if (req.url.startsWith('/admin') && !req.headers.authorization) {
          res.writeHead(401);
          res.end('Unauthorized');
          return;
        }
        next();
      }
    ]
  }
}`))),

      h3('Client-Specific Middleware'),
      pre(code(...codeBlock(`export default {
  dev: {
    clients: [
      {
        root: './app1',
        basePath: '/app1',
        middleware: [
          (req, res, next) => {
            console.log('App1 middleware:', req.url);
            next();
          }
        ]
      }
    ]
  }
}

// ลำดับความสำคัญของ Middleware:
// 1. Client-specific middleware (ทำงานก่อน)
// 2. Global middleware (ทำงานถัดมา)`))),

      h2('Server-Side Rendering (SSR)'),
      p('ตั้งค่า SSR สำหรับการโหลดหน้าแรก:'),
      pre(code(...codeBlock(`import { div, h1 } from 'elit';

export default {
  dev: {
    ssr: () => {
      // return VNode หรือ HTML string
      return div({ className: 'app' },
        h1('Server-Rendered Content')
      );
    }
  },

  // Client-specific SSR
  // clients: [
  //   {
  //     root: './app1',
  //     basePath: '/app1',
  //     ssr: () => '<h1>App 1 SSR</h1>'
  //   }
  // ]
}`))),

      h2('Preview Configuration'),
      p('Preview mode รองรับฟีเจอร์ของ dev mode ทั้งหมดสำหรับ production builds:'),
      pre(code(...codeBlock(`import { router } from 'elit/server';

export default {
  preview: {
    port: 4173,
    host: 'localhost',
    root: 'dist',
    basePath: '/app',
    https: false,
    open: true,
    logging: true,

    // API endpoints
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

    // SSR
    ssr: () => '<h1>Preview SSR</h1>',

    // Proxy
    proxy: [
      {
        context: '/api',
        target: 'http://localhost:8080'
      }
    ],

    // Workers
    worker: [
      {
        path: 'workers/cache-worker.js',
        type: 'module'
      }
    ],

    // Multi-client preview
    // clients: [...]
  }
}`))),

      h2('ตัวอย่างที่สมบูรณ์'),
      p('Configuration ที่พร้อม production:'),
      pre(code(...codeBlock(`import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { router } from 'elit/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  // Development server
  dev: {
    port: 3000,
    host: 'localhost',
    open: true,
    logging: true,

    // Multi-client setup
    clients: [
      {
        root: resolve(__dirname, 'apps/web'),
        basePath: '/web',
        watch: ['apps/web/**/*.ts'],
        proxy: [
          {
            context: '/api',
            target: 'http://localhost:8080',
            changeOrigin: true
          }
        ],
        worker: [
          {
            path: 'workers/web-worker.js',
            type: 'module'
          }
        ],
        api: router()
          .get('/api/health', (req, res) => {
            res.json({ status: 'ok' });
          }),
        middleware: [
          (req, res, next) => {
            console.log('Web app:', req.url);
            next();
          }
        ],
        ssr: () => '<h1>Web App</h1>'
      },
      {
        root: resolve(__dirname, 'apps/admin'),
        basePath: '/admin',
        watch: ['apps/admin/**/*.ts'],
        api: router()
          .get('/api/stats', (req, res) => {
            res.json({ stats: {} });
          })
      }
    ],

    // Global configuration
    proxy: [
      {
        context: '/shared-api',
        target: 'http://localhost:9000',
        changeOrigin: true
      }
    ],
    worker: [
      {
        path: 'workers/shared-worker.js',
        name: 'sharedWorker',
        type: 'module'
      }
    ]
  },

  // Build configuration (multiple builds)
  build: [
    {
      entry: resolve(__dirname, 'apps/web/main.ts'),
      outDir: resolve(__dirname, 'dist/web'),
      outFile: 'bundle.js',
      format: 'esm',
      target: 'es2020',
      minify: true,
      sourcemap: false,
      basePath: '/web',
      copy: [
        {
          from: 'apps/web/index.html',
          to: 'index.html',
          transform: (content, config) => {
            return content.replace(
              '<head>',
              \`<head>\\n  <base href="\${config.basePath}/">\`
            );
          }
        }
      ]
    },
    {
      entry: resolve(__dirname, 'apps/admin/main.ts'),
      outDir: resolve(__dirname, 'dist/admin'),
      outFile: 'bundle.js',
      format: 'esm',
      target: 'es2020',
      minify: true,
      basePath: '/admin'
    }
  ],

  // Preview server
  preview: {
    port: 4173,
    host: 'localhost',
    open: true,
    logging: true,

    clients: [
      {
        root: resolve(__dirname, 'dist/web'),
        basePath: '/web'
      },
      {
        root: resolve(__dirname, 'dist/admin'),
        basePath: '/admin'
      }
    ]
  }
}`))),

      h2('Environment Variables'),
      p('Elit โหลด environment variables จากไฟล์ .env อัตโนมัติ:'),
      pre(code(...codeBlock(`# .env.development
MODE=development
VITE_API_URL=http://localhost:8080
VITE_DEBUG=true

# .env.production
MODE=production
VITE_API_URL=https://api.production.com
VITE_DEBUG=false`))),

      p('เข้าถึงในโค้ด:'),
      pre(code(...codeBlock(`// เฉพาะตัวแปรที่มี prefix VITE_ จะถูกเปิดเผยให้ client
console.log(import.meta.env.VITE_API_URL);
console.log(import.meta.env.VITE_DEBUG);`))),

      h2('CLI Commands'),
      p('ใช้ Elit CLI กับ configuration:'),
      pre(code(...codeBlock(`# Development
npx elit dev                    # ใช้ config file
npx elit dev --port 8080        # Override config

# Build
npx elit build                  # รัน builds ทั้งหมดจาก config
npx elit build --entry src/app.ts  # Single build (ไม่ใช้ config)

# Preview
npx elit preview                # ใช้ config file
npx elit preview --port 5000    # Override config`))),

      h2('Best Practices'),
      ul(
        li(strong('ใช้ TypeScript config'), ' เพื่อ type safety และ autocompletion ที่ดีขึ้น'),
        li(strong('แยก concerns'), ' - ใช้ multi-client setup สำหรับแอพต่างๆ'),
        li(strong('Config แยกตาม environment'), ' - สร้าง configs แยกสำหรับ dev/prod'),
        li(strong('จัดระเบียบ builds'), ' - ใช้ multiple builds สำหรับ entry points ต่างๆ'),
        li(strong('ใช้ประโยชน์จาก middleware'), ' - เพิ่ม logging, auth และ custom processing'),
        li(strong('ตั้งค่า proxy อย่างระมัดระวัง'), ' - ใช้ client-specific proxy เมื่อจำเป็น'),
        li(strong('ใช้ SSR อย่างชาญฉลาด'), ' - เฉพาะเพื่อ optimize การโหลดครั้งแรก'),
        li(strong('ทดสอบ preview mode'), ' - ทดสอบ production builds เสมอก่อน deploy')
      ),

      h2('ขั้นตอนถัดไป'),
      ul(
        li(a({ href: '/elit/blog/18' }, 'คู่มือครบวงจร Elit')),
        li(a({ href: '/elit/blog/17' }, 'Hot Module Replacement กับ Elit')),
        li(a({ href: '/elit/docs' }, 'เอกสารฉบับเต็ม')),
        li(a({ href: '/elit/api' }, 'API Reference'))
      ),

      p('พร้อมสร้างแอพพลิเคชันที่ยอดเยี่ยมกับ Elit! 🚀')
    )
  }
};
