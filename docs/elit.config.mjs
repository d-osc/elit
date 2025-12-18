import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  dev: {
    port: 3003,
    host: 'localhost',
    root: __dirname,
    basePath: '/elit',
    open: true,
    logging: true,
    // Global proxy configuration - uncomment to use
    // proxy: [
    //   {
    //     context: '/api',
    //     target: 'http://localhost:8080',
    //     changeOrigin: true
    //   },
    //   {
    //     context: '/graphql',
    //     target: 'http://localhost:4000',
    //     changeOrigin: true,
    //     pathRewrite: { '^/graphql': '/api/graphql' }
    //   }
    // ],

    // Global worker configuration - uncomment to use
    // worker: [
    //   {
    //     path: 'workers/shared-worker.js',
    //     name: 'sharedWorker',
    //     type: 'module'
    //   }
    // ]

    // Alternative: Multi-client setup with client-specific proxy, workers, api, and middleware
    // clients: [
    //   {
    //     root: resolve(__dirname, 'app1'),
    //     basePath: '/app1',
    //     proxy: [
    //       {
    //         context: '/api',
    //         target: 'http://localhost:8080',
    //         changeOrigin: true
    //       }
    //     ],
    //     worker: [
    //       {
    //         path: 'workers/app1-worker.js',
    //         type: 'module'
    //       }
    //     ],
    //     // API routes are prefixed with basePath
    //     // This route becomes: /app1/api/health
    //     api: router()
    //       .get('/api/health', (req, res) => {
    //         res.json({ status: 'ok', app: 'app1' });
    //       }),
    //     middleware: [
    //       (req, res, next) => {
    //         console.log('App1 request:', req.url);
    //         next();
    //       }
    //     ]
    //   },
    //   {
    //     root: resolve(__dirname, 'app2'),
    //     basePath: '/app2',
    //     proxy: [
    //       {
    //         context: '/graphql',
    //         target: 'http://localhost:4000',
    //         changeOrigin: true
    //       }
    //     ],
    //     worker: [
    //       {
    //         path: 'workers/app2-worker.js',
    //         type: 'module'
    //       }
    //     ],
    //     // API routes are prefixed with basePath
    //     // This route becomes: /app2/api/status
    //     api: router()
    //       .get('/api/status', (req, res) => {
    //         res.json({ status: 'running', app: 'app2' });
    //       }),
    //     middleware: [
    //       (req, res, next) => {
    //         console.log('App2 request:', req.url);
    //         next();
    //       }
    //     ]
    //   }
    // ]
  },
  // Single build configuration
  build: {
    entry: resolve(__dirname, 'src/main.ts'),
    outDir: resolve(__dirname, 'dist'),
    outFile: 'main.js',
    minify: true,
    sourcemap: false,
    format: 'esm',
    target: 'es2020',
    platform: 'browser',
    basePath: '/elit',
    treeshake: true,
    logging: true,
    copy: [
      {
        from: 'index.html',
        to: 'index.html',
        transform: (content, config) => {
          // Replace script src
          let html = content.replace('src="src/main.ts"', 'src="main.js"');

          // Inject base tag if basePath is configured
          if (config.basePath) {
            const baseTag = `<base href="${config.basePath}/">`;
            html = html.replace(
              '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
              `<meta name="viewport" content="width=device-width, initial-scale=1.0">\n  ${baseTag}`
            );
          }

          return html;
        }
      },
      {
        from: 'favicon.svg',
        to: 'favicon.svg'
      }
    ]
  },

  // Alternative: Multiple builds - uncomment to build multiple entries
  // build: [
  //   {
  //     entry: resolve(__dirname, 'src/main.ts'),
  //     outDir: resolve(__dirname, 'dist'),
  //     outFile: 'main.js',
  //     format: 'esm',
  //     minify: true,
  //     basePath: '/elit'
  //   },
  //   {
  //     entry: resolve(__dirname, 'src/admin.ts'),
  //     outDir: resolve(__dirname, 'dist'),
  //     outFile: 'admin.js',
  //     format: 'esm',
  //     minify: true
  //   }
  // ],
  preview: {
    port: 3003,
    host: 'localhost',
    basePath: '/elit',
    open: true,
    logging: true,

    // HTTPS support - uncomment to use
    // https: true,

    // API router for REST endpoints - uncomment to use
    // api: router()
    //   .get('/api/health', (req, res) => {
    //     res.json({ status: 'ok' });
    //   })
    //   .get('/api/data', (req, res) => {
    //     res.json({ message: 'Preview API response' });
    //   }),

    // Custom middleware - uncomment to use
    // middleware: [
    //   (req, res, next) => {
    //     console.log('Preview request:', req.url);
    //     next();
    //   }
    // ],

    // SSR render function - uncomment to use
    // ssr: () => '<h1>Server-rendered content</h1>',

    // Proxy configuration for preview - uncomment to use
    // proxy: [
    //   {
    //     context: '/api',
    //     target: 'http://localhost:8080'
    //   }
    // ],

    // Worker configuration for preview - uncomment to use
    // worker: [
    //   {
    //     path: 'workers/cache-worker.js',
    //     type: 'module'
    //   }
    // ]

    // Alternative: Multi-client preview setup (similar to dev mode)
    // clients: [
    //   {
    //     root: resolve(__dirname, 'dist/app1'),
    //     basePath: '/app1',
    //     proxy: [
    //       {
    //         context: '/api',
    //         target: 'http://localhost:8080',
    //         changeOrigin: true
    //       }
    //     ],
    //     worker: [
    //       {
    //         path: 'workers/app1-worker.js',
    //         type: 'module'
    //       }
    //     ],
    //     // API routes are prefixed with basePath
    //     // This route becomes: /app1/api/health
    //     api: router()
    //       .get('/api/health', (req, res) => {
    //         res.json({ status: 'ok', app: 'app1' });
    //       }),
    //     middleware: [
    //       (req, res, next) => {
    //         console.log('App1 preview:', req.url);
    //         next();
    //       }
    //     ]
    //   },
    //   {
    //     root: resolve(__dirname, 'dist/app2'),
    //     basePath: '/app2',
    //     worker: [
    //       {
    //         path: 'workers/app2-worker.js',
    //         type: 'module'
    //       }
    //     ],
    //     // API routes are prefixed with basePath
    //     // This route becomes: /app2/api/status
    //     api: router()
    //       .get('/api/status', (req, res) => {
    //         res.json({ status: 'running', app: 'app2' });
    //       }),
    //     middleware: [
    //       (req, res, next) => {
    //         console.log('App2 preview:', req.url);
    //         next();
    //       }
    //     ]
    //   }
    // ]
  }
};
