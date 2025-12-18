import {
  div, h1, h2, h3, p, ul, li, pre, code, strong, em, a
} from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog21: BlogPostDetail = {
  id: '21',
  title: {
    en: 'Complete Guide to Elit Build Configuration',
    th: 'คู่มือครบวงจรการตั้งค่า Elit Build'
  },
  date: '2024-04-21',
  author: 'n-devs',
  tags: ['Build', 'Configuration', 'Production', 'Optimization'],
  content: {
    en: div(
      p('Master the ', strong('Elit build system'), ' with this comprehensive guide. Learn how to configure single and multiple builds, optimize for production, manage environment variables, and deploy your applications.'),

      h2('Build System Overview'),
      p('The Elit build system is powered by esbuild and provides:'),
      ul(
        li('⚡ ', strong('Lightning Fast Builds'), ' - Leverages esbuild\'s native Go implementation'),
        li('📦 ', strong('Tree Shaking'), ' - Eliminates unused code automatically'),
        li('🗜️ ', strong('Minification'), ' - Reduces bundle size for production'),
        li('🗺️ ', strong('Source Maps'), ' - Debug production builds easily'),
        li('🎯 ', strong('Multiple Formats'), ' - ESM, CommonJS, or IIFE output'),
        li('🔄 ', strong('Multiple Entries'), ' - Build multiple apps simultaneously'),
        li('📋 ', strong('File Copying'), ' - Copy and transform static assets'),
        li('🌍 ', strong('Environment Variables'), ' - Inject runtime configuration'),
        li('🎨 ', strong('Custom Transforms'), ' - Modify files during build')
      ),

      h2('Basic Build Configuration'),
      h3('1. Simple Single Build'),
      p('Start with a basic configuration for single-page applications:'),
      pre(code(...codeBlock(`// elit.config.ts
import { resolve } from 'path';

export default {
  build: {
    entry: resolve(__dirname, 'src/main.ts'),    // Entry point
    outDir: resolve(__dirname, 'dist'),          // Output directory
    outFile: 'main.js',                          // Output filename
    minify: true,                                // Enable minification
    sourcemap: false,                            // Disable sourcemaps
    format: 'esm',                               // Output format
    target: 'es2020',                            // Target ECMAScript version
    platform: 'browser',                         // Target platform
    treeshake: true,                             // Enable tree shaking
    logging: true                                // Enable build logs
  }
}`))),

      h3('2. Run the Build'),
      pre(code(...codeBlock(`# Using config file
npx elit build

# Or with CLI options (overrides config)
npx elit build --entry src/app.ts --out-dir build --no-minify`))),

      h2('Build Options Reference'),

      h3('Entry and Output'),
      pre(code(...codeBlock(`build: {
  // Required: Entry file path
  entry: 'src/main.ts',

  // Output directory (default: dist)
  outDir: 'dist',

  // Output filename (default: based on entry name)
  outFile: 'bundle.js',

  // Base path for the application (injected into HTML)
  basePath: '/my-app'
}`))),

      h3('Format and Target'),
      pre(code(...codeBlock(`build: {
  // Output format
  format: 'esm',        // ES modules (recommended for modern browsers)
  // format: 'cjs',     // CommonJS (for Node.js)
  // format: 'iife',    // Immediately Invoked Function Expression

  // Global name for IIFE format
  globalName: 'MyApp',  // Required when format is 'iife'

  // Target ECMAScript version
  target: 'es2020',     // es2015, es2016, ..., es2022, esnext

  // Target platform
  platform: 'browser',  // browser, node, neutral
}`))),

      h3('Optimization'),
      pre(code(...codeBlock(`build: {
  // Enable minification (default: true)
  minify: true,

  // Generate source maps (default: false)
  sourcemap: true,      // or 'inline', 'external'

  // Enable tree shaking (default: true)
  treeshake: true,

  // External dependencies (not bundled)
  external: ['react', 'react-dom'],

  // Enable build logging (default: true)
  logging: true
}`))),

      h2('Environment Variables'),
      p('Inject environment variables into your build for runtime configuration:'),

      h3('1. Define Environment Variables'),
      pre(code(...codeBlock(`// .env.production
API_URL=https://api.example.com
APP_VERSION=2.0.0
FEATURE_ANALYTICS=true
DEBUG_MODE=false`))),

      h3('2. Configure Build to Inject Variables'),
      pre(code(...codeBlock(`// elit.config.ts
import { loadEnv } from 'elit/config';

const mode = process.env.MODE || 'production';
const env = loadEnv(mode);

export default {
  build: {
    entry: 'src/main.ts',
    outDir: 'dist',

    // Inject environment variables (prefix with VITE_ for client access)
    env: {
      VITE_API_URL: env.API_URL || 'http://localhost:3000',
      VITE_APP_VERSION: env.APP_VERSION || '1.0.0',
      VITE_FEATURE_ANALYTICS: env.FEATURE_ANALYTICS || 'false',
      VITE_DEBUG: env.DEBUG_MODE || 'false'
    }
  }
}`))),

      h3('3. Access Variables in Your Code'),
      pre(code(...codeBlock(`// src/config.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  version: import.meta.env.VITE_APP_VERSION,
  analytics: import.meta.env.VITE_FEATURE_ANALYTICS === 'true',
  debug: import.meta.env.VITE_DEBUG === 'true'
};

// src/main.ts
import { config } from './config';

console.log('API URL:', config.apiUrl);
console.log('Version:', config.version);

if (config.analytics) {
  // Initialize analytics
}`))),

      h3('4. Different Environments'),
      pre(code(...codeBlock(`# Development build
MODE=development npx elit build

# Staging build
MODE=staging npx elit build

# Production build
MODE=production npx elit build

# Each mode loads corresponding .env file:
# .env.development, .env.staging, .env.production`))),

      h2('Copying and Transforming Files'),
      p('Copy static assets and transform files during the build process:'),

      h3('1. Simple File Copying'),
      pre(code(...codeBlock(`build: {
  entry: 'src/main.ts',
  outDir: 'dist',

  copy: [
    {
      from: 'index.html',
      to: 'index.html'
    },
    {
      from: 'favicon.ico',
      to: 'favicon.ico'
    },
    {
      from: 'assets',      // Copy entire directory
      to: 'assets'
    }
  ]
}`))),

      h3('2. Transform Files During Copy'),
      pre(code(...codeBlock(`build: {
  entry: 'src/main.ts',
  outDir: 'dist',
  basePath: '/my-app',

  copy: [
    {
      from: 'index.html',
      to: 'index.html',
      transform: (content, config) => {
        // Replace script src with built file
        let html = content.replace(
          'src="src/main.ts"',
          'src="main.js"'
        );

        // Inject base tag if basePath is configured
        if (config.basePath) {
          const baseTag = \`<base href="\${config.basePath}/">\`;
          html = html.replace(
            '<head>',
            \`<head>\\n  \${baseTag}\`
          );
        }

        // Inject environment variables
        html = html.replace(
          '</head>',
          \`<script>window.ENV = \${JSON.stringify(config.env)}</script>\\n</head>\`
        );

        return html;
      }
    }
  ]
}`))),

      h3('3. Advanced File Transformations'),
      pre(code(...codeBlock(`copy: [
  {
    from: 'manifest.json',
    to: 'manifest.json',
    transform: (content, config) => {
      const manifest = JSON.parse(content);

      // Update manifest with build info
      manifest.version = config.env?.VITE_APP_VERSION || '1.0.0';
      manifest.start_url = config.basePath || '/';

      return JSON.stringify(manifest, null, 2);
    }
  },
  {
    from: 'robots.txt',
    to: 'robots.txt',
    transform: (content, config) => {
      // Update sitemap URL
      return content.replace(
        'Sitemap: https://example.com/sitemap.xml',
        \`Sitemap: \${config.env?.VITE_API_URL}/sitemap.xml\`
      );
    }
  }
]`))),

      h2('Multiple Builds'),
      p('Build multiple entry points simultaneously for complex applications:'),

      h3('1. Basic Multiple Builds'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  build: [
    {
      entry: 'src/app.ts',
      outDir: 'dist',
      outFile: 'app.js',
      format: 'esm',
      minify: true
    },
    {
      entry: 'src/admin.ts',
      outDir: 'dist',
      outFile: 'admin.js',
      format: 'esm',
      minify: true
    },
    {
      entry: 'src/worker.ts',
      outDir: 'dist/workers',
      outFile: 'worker.js',
      format: 'esm',
      platform: 'browser'
    }
  ]
}`))),

      h3('2. Run Multiple Builds'),
      pre(code(...codeBlock(`# Build all entries sequentially
npx elit build

# Output:
# Building 3 entries...
#
# [1/3] Building src/app.ts...
# ✅ Build successful!
#
# [2/3] Building src/admin.ts...
# ✅ Build successful!
#
# [3/3] Building src/worker.ts...
# ✅ Build successful!
#
# ✓ All 3 builds completed successfully`))),

      h3('3. Micro-Frontend Architecture'),
      pre(code(...codeBlock(`// elit.config.ts
import { resolve } from 'path';

export default {
  build: [
    // Main shell application
    {
      entry: resolve(__dirname, 'src/shell/main.ts'),
      outDir: resolve(__dirname, 'dist/shell'),
      outFile: 'shell.js',
      format: 'esm',
      minify: true,
      copy: [
        {
          from: 'src/shell/index.html',
          to: 'index.html'
        }
      ]
    },
    // Feature module 1
    {
      entry: resolve(__dirname, 'src/features/dashboard/main.ts'),
      outDir: resolve(__dirname, 'dist/features/dashboard'),
      outFile: 'dashboard.js',
      format: 'esm',
      minify: true,
      external: ['@shell/core']  // Provided by shell
    },
    // Feature module 2
    {
      entry: resolve(__dirname, 'src/features/settings/main.ts'),
      outDir: resolve(__dirname, 'dist/features/settings'),
      outFile: 'settings.js',
      format: 'esm',
      minify: true,
      external: ['@shell/core']
    },
    // Shared Web Worker
    {
      entry: resolve(__dirname, 'src/workers/sync.ts'),
      outDir: resolve(__dirname, 'dist/workers'),
      outFile: 'sync-worker.js',
      format: 'esm',
      platform: 'browser'
    }
  ]
}`))),

      h2('Post-Build Hooks'),
      p('Execute custom logic after the build completes:'),

      pre(code(...codeBlock(`import { writeFileSync } from 'fs';

export default {
  build: {
    entry: 'src/main.ts',
    outDir: 'dist',

    onBuildEnd: async (result) => {
      // Log build information
      console.log('Build completed!');
      console.log('Output:', result.outputPath);
      console.log('Size:', (result.size / 1024).toFixed(2), 'KB');
      console.log('Time:', result.buildTime, 'ms');

      // Generate build manifest
      const manifest = {
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version,
        size: result.size,
        buildTime: result.buildTime
      };

      writeFileSync(
        'dist/build-manifest.json',
        JSON.stringify(manifest, null, 2)
      );

      // Upload to CDN
      // await uploadToCDN('dist');

      // Notify deployment service
      // await notifyDeployment(manifest);
    }
  }
}`))),

      h2('Advanced Build Patterns'),

      h3('1. Conditional Builds'),
      pre(code(...codeBlock(`// elit.config.ts
const isDev = process.env.MODE !== 'production';
const isPreview = process.env.PREVIEW === 'true';

export default {
  build: {
    entry: 'src/main.ts',
    outDir: isDev ? 'build' : 'dist',
    minify: !isDev,
    sourcemap: isDev || isPreview,
    target: isDev ? 'esnext' : 'es2020',

    env: {
      VITE_DEV_MODE: String(isDev),
      VITE_API_URL: isDev
        ? 'http://localhost:3000'
        : process.env.API_URL
    }
  }
}`))),

      h3('2. Library Build'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  build: [
    // ESM build
    {
      entry: 'src/index.ts',
      outDir: 'dist',
      outFile: 'index.mjs',
      format: 'esm',
      platform: 'neutral',
      minify: true,
      external: ['react', 'react-dom']
    },
    // CommonJS build
    {
      entry: 'src/index.ts',
      outDir: 'dist',
      outFile: 'index.cjs',
      format: 'cjs',
      platform: 'neutral',
      minify: true,
      external: ['react', 'react-dom']
    },
    // UMD build for CDN
    {
      entry: 'src/index.ts',
      outDir: 'dist',
      outFile: 'index.umd.js',
      format: 'iife',
      globalName: 'MyLibrary',
      platform: 'browser',
      minify: true
    }
  ]
}`))),

      h3('3. Monorepo Builds'),
      pre(code(...codeBlock(`// packages/app/elit.config.ts
import { resolve } from 'path';

export default {
  build: {
    entry: resolve(__dirname, 'src/main.ts'),
    outDir: resolve(__dirname, 'dist'),
    outFile: 'app.js',
    format: 'esm',

    // External workspace packages
    external: [
      '@myorg/ui-components',
      '@myorg/utils',
      '@myorg/api-client'
    ],

    copy: [
      {
        from: 'public',
        to: '.'
      }
    ]
  }
}

// packages/ui-components/elit.config.ts
export default {
  build: [
    {
      entry: 'src/index.ts',
      outDir: 'dist',
      outFile: 'index.js',
      format: 'esm',
      external: ['elit'],
      minify: true
    }
  ]
}`))),

      h2('Production Optimization'),

      h3('1. Optimize Bundle Size'),
      pre(code(...codeBlock(`build: {
  entry: 'src/main.ts',
  outDir: 'dist',

  // Enable all optimizations
  minify: true,
  treeshake: true,

  // Split large dependencies
  external: [
    'lodash',        // Load from CDN
    'moment',        // Load from CDN
    'chart.js'       // Load from CDN
  ],

  // Target modern browsers only
  target: 'es2020',

  onBuildEnd: (result) => {
    const sizeInKB = (result.size / 1024).toFixed(2);
    console.log(\`Bundle size: \${sizeInKB} KB\`);

    // Warn if bundle is too large
    if (result.size > 500 * 1024) {
      console.warn('⚠️  Bundle size exceeds 500 KB!');
      console.warn('Consider code splitting or lazy loading');
    }
  }
}`))),

      h3('2. Enable Source Maps for Production'),
      pre(code(...codeBlock(`build: {
  entry: 'src/main.ts',
  outDir: 'dist',
  minify: true,

  // Generate external source maps
  sourcemap: 'external',  // Creates separate .map files

  // Or inline for easier deployment
  // sourcemap: 'inline',  // Embeds in the bundle

  onBuildEnd: (result) => {
    // Upload source maps to error tracking service
    // await uploadSourceMaps('dist', {
    //   service: 'sentry',
    //   release: process.env.VERSION
    // });
  }
}`))),

      h3('3. Cache Busting'),
      pre(code(...codeBlock(`import { randomBytes } from 'crypto';

const hash = randomBytes(8).toString('hex');

export default {
  build: {
    entry: 'src/main.ts',
    outDir: 'dist',
    outFile: \`main.\${hash}.js\`,  // e.g., main.a1b2c3d4.js

    copy: [
      {
        from: 'index.html',
        to: 'index.html',
        transform: (content) => {
          // Update script src with hashed filename
          return content.replace(
            'src="main.js"',
            \`src="main.\${hash}.js"\`
          );
        }
      }
    ]
  }
}`))),

      h2('Build Troubleshooting'),

      h3('Build Fails with Module Not Found'),
      pre(code(...codeBlock(`# Make sure all dependencies are installed
npm install

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check if module path is correct
# Use absolute paths in config
import { resolve } from 'path';

export default {
  build: {
    entry: resolve(__dirname, 'src/main.ts')  // ✅ Correct
    // entry: 'src/main.ts'                    // ❌ May fail
  }
}`))),

      h3('Bundle Size Too Large'),
      pre(code(...codeBlock(`# Analyze what's in your bundle
npx esbuild src/main.ts --bundle --metafile=meta.json

# View bundle analysis
npx esbuild-visualizer meta.json

# Solutions:
# 1. Use tree shaking
build: { treeshake: true }

# 2. Mark large deps as external
build: { external: ['lodash', 'moment'] }

# 3. Use dynamic imports for code splitting
const module = await import('./large-module.js');

# 4. Remove unused dependencies
npm uninstall unused-package`))),

      h3('TypeScript Errors During Build'),
      pre(code(...codeBlock(`# Make sure TypeScript is installed
npm install -D typescript

# Check tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true
  }
}

# Type check before building
npx tsc --noEmit
npx elit build`))),

      h2('Complete Production Example'),
      pre(code(...codeBlock(`// elit.config.ts
import { resolve } from 'path';
import { writeFileSync } from 'fs';

const isDev = process.env.MODE !== 'production';
const version = process.env.npm_package_version || '1.0.0';

export default {
  build: {
    entry: resolve(__dirname, 'src/main.ts'),
    outDir: resolve(__dirname, 'dist'),
    outFile: 'main.js',
    format: 'esm',
    target: 'es2020',
    platform: 'browser',

    // Production optimizations
    minify: !isDev,
    sourcemap: isDev ? true : 'external',
    treeshake: true,

    // Environment variables
    env: {
      VITE_APP_VERSION: version,
      VITE_API_URL: process.env.API_URL || 'https://api.example.com',
      VITE_ANALYTICS_ID: process.env.ANALYTICS_ID || '',
      VITE_SENTRY_DSN: process.env.SENTRY_DSN || '',
      VITE_BUILD_TIME: new Date().toISOString()
    },

    // External dependencies (load from CDN)
    external: isDev ? [] : ['chart.js', 'lodash-es'],

    // Copy and transform files
    copy: [
      {
        from: 'index.html',
        to: 'index.html',
        transform: (content, config) => {
          let html = content;

          // Update script src
          html = html.replace('src="src/main.ts"', 'src="main.js"');

          // Inject base tag
          if (config.basePath) {
            html = html.replace(
              '<head>',
              \`<head>\\n  <base href="\${config.basePath}/">\`
            );
          }

          // Inject CDN scripts for externals
          if (!isDev) {
            const cdnScripts = \`
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
  <script src="https://cdn.jsdelivr.net/npm/lodash-es@4"></script>\`;
            html = html.replace('</head>', \`\${cdnScripts}\\n</head>\`);
          }

          return html;
        }
      },
      {
        from: 'public',
        to: '.'
      }
    ],

    // Post-build hook
    onBuildEnd: async (result) => {
      const sizeInKB = (result.size / 1024).toFixed(2);

      console.log('\\n✅ Build completed successfully!');
      console.log(\`   Version: \${version}\`);
      console.log(\`   Size: \${sizeInKB} KB\`);
      console.log(\`   Time: \${result.buildTime}ms\`);

      // Generate build manifest
      const manifest = {
        version,
        timestamp: new Date().toISOString(),
        size: result.size,
        buildTime: result.buildTime,
        env: process.env.MODE || 'production'
      };

      writeFileSync(
        resolve(__dirname, 'dist/build-info.json'),
        JSON.stringify(manifest, null, 2)
      );

      // Warn if bundle is too large
      if (result.size > 500 * 1024) {
        console.warn('\\n⚠️  Warning: Bundle size exceeds 500 KB');
        console.warn('   Consider code splitting or lazy loading');
      }
    }
  }
}`))),

      h2('Deployment Strategies'),

      h3('1. Static Hosting (Vercel, Netlify)'),
      pre(code(...codeBlock(`# Build for production
npm run build

# Deploy dist/ folder
# vercel --prod
# netlify deploy --prod --dir=dist

# Add build command to package.json
{
  "scripts": {
    "build": "npx elit build",
    "deploy": "npm run build && vercel --prod"
  }
}`))),

      h3('2. CDN Deployment (AWS S3 + CloudFront)'),
      pre(code(...codeBlock(`# Build with production settings
MODE=production npm run build

# Sync to S3
aws s3 sync dist/ s3://my-bucket/ \\
  --delete \\
  --cache-control "public,max-age=31536000,immutable"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \\
  --distribution-id DISTRIBUTION_ID \\
  --paths "/*"`))),

      h3('3. Docker Container'),
      pre(code(...codeBlock(`# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Build and run
docker build -t my-app .
docker run -p 80:80 my-app`))),

      h2('Summary'),
      p('The Elit build system provides a powerful and flexible way to build your applications:'),
      ul(
        li('⚡ Lightning-fast builds powered by esbuild'),
        li('📦 Tree shaking and minification for optimal bundle size'),
        li('🔄 Support for single and multiple entry points'),
        li('🌍 Environment variable injection'),
        li('📋 File copying with transformation support'),
        li('🎯 Multiple output formats (ESM, CJS, IIFE)'),
        li('🗺️ Source map generation for debugging'),
        li('🎨 Post-build hooks for custom workflows'),
        li('⚙️ Full TypeScript support'),
        li('🚀 Production-ready optimizations')
      ),

      p('With these features, you can build everything from simple single-page apps to complex micro-frontend architectures.'),

      h2('Next Steps'),
      ul(
        li(a({ href: '/blog/20' }, 'Learn About Dev and Preview Servers')),
        li(a({ href: '/blog/19' }, 'Read the Complete Configuration Guide')),
        li(a({ href: '/blog/18' }, 'Explore Elit Features')),
        li(a({ href: '/docs' }, 'Browse Full Documentation')),
        li(a({ href: '/examples' }, 'See Code Examples'))
      )
    ),

    th: div(
      p('เชี่ยวชาญ ', strong('Elit build system'), ' ด้วยคู่มือฉบับสมบูรณ์นี้ เรียนรู้วิธีตั้งค่า single และ multiple builds, ปรับแต่งสำหรับ production, จัดการ environment variables และ deploy แอปพลิเคชันของคุณ'),

      h2('ภาพรวม Build System'),
      p('Elit build system ขับเคลื่อนด้วย esbuild และมอบ:'),
      ul(
        li('⚡ ', strong('Lightning Fast Builds'), ' - ใช้ประโยชน์จาก esbuild ที่เขียนด้วย Go'),
        li('📦 ', strong('Tree Shaking'), ' - กำจัดโค้ดที่ไม่ใช้โดยอัตโนมัติ'),
        li('🗜️ ', strong('Minification'), ' - ลดขนาด bundle สำหรับ production'),
        li('🗺️ ', strong('Source Maps'), ' - debug production builds ได้ง่าย'),
        li('🎯 ', strong('Multiple Formats'), ' - output เป็น ESM, CommonJS หรือ IIFE'),
        li('🔄 ', strong('Multiple Entries'), ' - build หลายแอพพร้อมกัน'),
        li('📋 ', strong('File Copying'), ' - คัดลอกและแปลง static assets'),
        li('🌍 ', strong('Environment Variables'), ' - inject การตั้งค่า runtime'),
        li('🎨 ', strong('Custom Transforms'), ' - แก้ไขไฟล์ระหว่าง build')
      ),

      h2('การตั้งค่า Build พื้นฐาน'),
      h3('1. Simple Single Build'),
      p('เริ่มต้นด้วยการตั้งค่าพื้นฐานสำหรับ single-page applications:'),
      pre(code(...codeBlock(`// elit.config.ts
import { resolve } from 'path';

export default {
  build: {
    entry: resolve(__dirname, 'src/main.ts'),    // จุดเริ่มต้น
    outDir: resolve(__dirname, 'dist'),          // โฟลเดอร์ output
    outFile: 'main.js',                          // ชื่อไฟล์ output
    minify: true,                                // เปิด minification
    sourcemap: false,                            // ปิด sourcemaps
    format: 'esm',                               // รูปแบบ output
    target: 'es2020',                            // ECMAScript version เป้าหมาย
    platform: 'browser',                         // แพลตฟอร์มเป้าหมาย
    treeshake: true,                             // เปิด tree shaking
    logging: true                                // เปิด build logs
  }
}`))),

      h3('2. รัน Build'),
      pre(code(...codeBlock(`# ใช้ไฟล์ config
npx elit build

# หรือใช้ตัวเลือก CLI (จะ override config)
npx elit build --entry src/app.ts --out-dir build --no-minify`))),

      h2('Build Options อ้างอิง'),

      h3('Entry และ Output'),
      pre(code(...codeBlock(`build: {
  // Required: เส้นทางไฟล์ entry
  entry: 'src/main.ts',

  // โฟลเดอร์ output (default: dist)
  outDir: 'dist',

  // ชื่อไฟล์ output (default: ตามชื่อ entry)
  outFile: 'bundle.js',

  // Base path สำหรับแอปพลิเคชัน (inject เข้า HTML)
  basePath: '/my-app'
}`))),

      h3('Format และ Target'),
      pre(code(...codeBlock(`build: {
  // รูปแบบ output
  format: 'esm',        // ES modules (แนะนำสำหรับ modern browsers)
  // format: 'cjs',     // CommonJS (สำหรับ Node.js)
  // format: 'iife',    // Immediately Invoked Function Expression

  // ชื่อ Global สำหรับ IIFE format
  globalName: 'MyApp',  // Required เมื่อ format เป็น 'iife'

  // ECMAScript version เป้าหมาย
  target: 'es2020',     // es2015, es2016, ..., es2022, esnext

  // แพลตฟอร์มเป้าหมาย
  platform: 'browser',  // browser, node, neutral
}`))),

      h3('Optimization'),
      pre(code(...codeBlock(`build: {
  // เปิด minification (default: true)
  minify: true,

  // สร้าง source maps (default: false)
  sourcemap: true,      // or 'inline', 'external'

  // เปิด tree shaking (default: true)
  treeshake: true,

  // External dependencies (ไม่ bundle)
  external: ['react', 'react-dom'],

  // เปิด build logging (default: true)
  logging: true
}`))),

      h2('Environment Variables'),
      p('Inject environment variables เข้า build สำหรับการตั้งค่า runtime:'),

      h3('1. กำหนด Environment Variables'),
      pre(code(...codeBlock(`// .env.production
API_URL=https://api.example.com
APP_VERSION=2.0.0
FEATURE_ANALYTICS=true
DEBUG_MODE=false`))),

      h3('2. ตั้งค่า Build ให้ Inject Variables'),
      pre(code(...codeBlock(`// elit.config.ts
import { loadEnv } from 'elit/config';

const mode = process.env.MODE || 'production';
const env = loadEnv(mode);

export default {
  build: {
    entry: 'src/main.ts',
    outDir: 'dist',

    // Inject environment variables (ขึ้นต้นด้วย VITE_ สำหรับ client)
    env: {
      VITE_API_URL: env.API_URL || 'http://localhost:3000',
      VITE_APP_VERSION: env.APP_VERSION || '1.0.0',
      VITE_FEATURE_ANALYTICS: env.FEATURE_ANALYTICS || 'false',
      VITE_DEBUG: env.DEBUG_MODE || 'false'
    }
  }
}`))),

      h3('3. เข้าถึง Variables ในโค้ดของคุณ'),
      pre(code(...codeBlock(`// src/config.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  version: import.meta.env.VITE_APP_VERSION,
  analytics: import.meta.env.VITE_FEATURE_ANALYTICS === 'true',
  debug: import.meta.env.VITE_DEBUG === 'true'
};

// src/main.ts
import { config } from './config';

console.log('API URL:', config.apiUrl);
console.log('Version:', config.version);

if (config.analytics) {
  // Initialize analytics
}`))),

      h3('4. Environments ต่างๆ'),
      pre(code(...codeBlock(`# Development build
MODE=development npx elit build

# Staging build
MODE=staging npx elit build

# Production build
MODE=production npx elit build

# แต่ละ mode โหลดไฟล์ .env ที่ตรงกัน:
# .env.development, .env.staging, .env.production`))),

      h2('การคัดลอกและแปลงไฟล์'),
      p('คัดลอก static assets และแปลงไฟล์ระหว่างกระบวนการ build:'),

      h3('1. การคัดลอกไฟล์แบบง่าย'),
      pre(code(...codeBlock(`build: {
  entry: 'src/main.ts',
  outDir: 'dist',

  copy: [
    {
      from: 'index.html',
      to: 'index.html'
    },
    {
      from: 'favicon.ico',
      to: 'favicon.ico'
    },
    {
      from: 'assets',      // คัดลอกทั้งโฟลเดอร์
      to: 'assets'
    }
  ]
}`))),

      h3('2. แปลงไฟล์ระหว่างการคัดลอก'),
      pre(code(...codeBlock(`build: {
  entry: 'src/main.ts',
  outDir: 'dist',
  basePath: '/my-app',

  copy: [
    {
      from: 'index.html',
      to: 'index.html',
      transform: (content, config) => {
        // เปลี่ยน script src เป็นไฟล์ที่ build แล้ว
        let html = content.replace(
          'src="src/main.ts"',
          'src="main.js"'
        );

        // Inject base tag ถ้า basePath ถูกตั้งค่า
        if (config.basePath) {
          const baseTag = \`<base href="\${config.basePath}/">\`;
          html = html.replace(
            '<head>',
            \`<head>\\n  \${baseTag}\`
          );
        }

        // Inject environment variables
        html = html.replace(
          '</head>',
          \`<script>window.ENV = \${JSON.stringify(config.env)}</script>\\n</head>\`
        );

        return html;
      }
    }
  ]
}`))),

      h3('3. การแปลงไฟล์ขั้นสูง'),
      pre(code(...codeBlock(`copy: [
  {
    from: 'manifest.json',
    to: 'manifest.json',
    transform: (content, config) => {
      const manifest = JSON.parse(content);

      // อัพเดท manifest ด้วยข้อมูล build
      manifest.version = config.env?.VITE_APP_VERSION || '1.0.0';
      manifest.start_url = config.basePath || '/';

      return JSON.stringify(manifest, null, 2);
    }
  },
  {
    from: 'robots.txt',
    to: 'robots.txt',
    transform: (content, config) => {
      // อัพเดท sitemap URL
      return content.replace(
        'Sitemap: https://example.com/sitemap.xml',
        \`Sitemap: \${config.env?.VITE_API_URL}/sitemap.xml\`
      );
    }
  }
]`))),

      h2('Multiple Builds'),
      p('Build หลาย entry points พร้อมกันสำหรับแอปพลิเคชันที่ซับซ้อน:'),

      h3('1. Multiple Builds พื้นฐาน'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  build: [
    {
      entry: 'src/app.ts',
      outDir: 'dist',
      outFile: 'app.js',
      format: 'esm',
      minify: true
    },
    {
      entry: 'src/admin.ts',
      outDir: 'dist',
      outFile: 'admin.js',
      format: 'esm',
      minify: true
    },
    {
      entry: 'src/worker.ts',
      outDir: 'dist/workers',
      outFile: 'worker.js',
      format: 'esm',
      platform: 'browser'
    }
  ]
}`))),

      h3('2. รัน Multiple Builds'),
      pre(code(...codeBlock(`# Build entries ทั้งหมดตามลำดับ
npx elit build

# Output:
# Building 3 entries...
#
# [1/3] Building src/app.ts...
# ✅ Build successful!
#
# [2/3] Building src/admin.ts...
# ✅ Build successful!
#
# [3/3] Building src/worker.ts...
# ✅ Build successful!
#
# ✓ All 3 builds completed successfully`))),

      h3('3. สถาปัตยกรรม Micro-Frontend'),
      pre(code(...codeBlock(`// elit.config.ts
import { resolve } from 'path';

export default {
  build: [
    // แอปพลิเคชัน shell หลัก
    {
      entry: resolve(__dirname, 'src/shell/main.ts'),
      outDir: resolve(__dirname, 'dist/shell'),
      outFile: 'shell.js',
      format: 'esm',
      minify: true,
      copy: [
        {
          from: 'src/shell/index.html',
          to: 'index.html'
        }
      ]
    },
    // Feature module 1
    {
      entry: resolve(__dirname, 'src/features/dashboard/main.ts'),
      outDir: resolve(__dirname, 'dist/features/dashboard'),
      outFile: 'dashboard.js',
      format: 'esm',
      minify: true,
      external: ['@shell/core']  // มาจาก shell
    },
    // Feature module 2
    {
      entry: resolve(__dirname, 'src/features/settings/main.ts'),
      outDir: resolve(__dirname, 'dist/features/settings'),
      outFile: 'settings.js',
      format: 'esm',
      minify: true,
      external: ['@shell/core']
    },
    // Shared Web Worker
    {
      entry: resolve(__dirname, 'src/workers/sync.ts'),
      outDir: resolve(__dirname, 'dist/workers'),
      outFile: 'sync-worker.js',
      format: 'esm',
      platform: 'browser'
    }
  ]
}`))),

      h2('Post-Build Hooks'),
      p('รันคำสั่งที่กำหนดเองหลัง build เสร็จ:'),

      pre(code(...codeBlock(`import { writeFileSync } from 'fs';

export default {
  build: {
    entry: 'src/main.ts',
    outDir: 'dist',

    onBuildEnd: async (result) => {
      // Log ข้อมูล build
      console.log('Build completed!');
      console.log('Output:', result.outputPath);
      console.log('Size:', (result.size / 1024).toFixed(2), 'KB');
      console.log('Time:', result.buildTime, 'ms');

      // สร้าง build manifest
      const manifest = {
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version,
        size: result.size,
        buildTime: result.buildTime
      };

      writeFileSync(
        'dist/build-manifest.json',
        JSON.stringify(manifest, null, 2)
      );

      // Upload ไปยัง CDN
      // await uploadToCDN('dist');

      // แจ้งเตือน deployment service
      // await notifyDeployment(manifest);
    }
  }
}`))),

      h2('Build Patterns ขั้นสูง'),

      h3('1. Conditional Builds'),
      pre(code(...codeBlock(`// elit.config.ts
const isDev = process.env.MODE !== 'production';
const isPreview = process.env.PREVIEW === 'true';

export default {
  build: {
    entry: 'src/main.ts',
    outDir: isDev ? 'build' : 'dist',
    minify: !isDev,
    sourcemap: isDev || isPreview,
    target: isDev ? 'esnext' : 'es2020',

    env: {
      VITE_DEV_MODE: String(isDev),
      VITE_API_URL: isDev
        ? 'http://localhost:3000'
        : process.env.API_URL
    }
  }
}`))),

      h3('2. Library Build'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  build: [
    // ESM build
    {
      entry: 'src/index.ts',
      outDir: 'dist',
      outFile: 'index.mjs',
      format: 'esm',
      platform: 'neutral',
      minify: true,
      external: ['react', 'react-dom']
    },
    // CommonJS build
    {
      entry: 'src/index.ts',
      outDir: 'dist',
      outFile: 'index.cjs',
      format: 'cjs',
      platform: 'neutral',
      minify: true,
      external: ['react', 'react-dom']
    },
    // UMD build สำหรับ CDN
    {
      entry: 'src/index.ts',
      outDir: 'dist',
      outFile: 'index.umd.js',
      format: 'iife',
      globalName: 'MyLibrary',
      platform: 'browser',
      minify: true
    }
  ]
}`))),

      h3('3. Monorepo Builds'),
      pre(code(...codeBlock(`// packages/app/elit.config.ts
import { resolve } from 'path';

export default {
  build: {
    entry: resolve(__dirname, 'src/main.ts'),
    outDir: resolve(__dirname, 'dist'),
    outFile: 'app.js',
    format: 'esm',

    // External workspace packages
    external: [
      '@myorg/ui-components',
      '@myorg/utils',
      '@myorg/api-client'
    ],

    copy: [
      {
        from: 'public',
        to: '.'
      }
    ]
  }
}

// packages/ui-components/elit.config.ts
export default {
  build: [
    {
      entry: 'src/index.ts',
      outDir: 'dist',
      outFile: 'index.js',
      format: 'esm',
      external: ['elit'],
      minify: true
    }
  ]
}`))),

      h2('Production Optimization'),

      h3('1. ปรับขนาด Bundle ให้เหมาะสม'),
      pre(code(...codeBlock(`build: {
  entry: 'src/main.ts',
  outDir: 'dist',

  // เปิด optimizations ทั้งหมด
  minify: true,
  treeshake: true,

  // แยก dependencies ขนาดใหญ่
  external: [
    'lodash',        // โหลดจาก CDN
    'moment',        // โหลดจาก CDN
    'chart.js'       // โหลดจาก CDN
  ],

  // เป้าหมาย modern browsers เท่านั้น
  target: 'es2020',

  onBuildEnd: (result) => {
    const sizeInKB = (result.size / 1024).toFixed(2);
    console.log(\`Bundle size: \${sizeInKB} KB\`);

    // เตือนถ้า bundle ใหญ่เกินไป
    if (result.size > 500 * 1024) {
      console.warn('⚠️  Bundle size exceeds 500 KB!');
      console.warn('Consider code splitting or lazy loading');
    }
  }
}`))),

      h3('2. เปิด Source Maps สำหรับ Production'),
      pre(code(...codeBlock(`build: {
  entry: 'src/main.ts',
  outDir: 'dist',
  minify: true,

  // สร้าง external source maps
  sourcemap: 'external',  // สร้างไฟล์ .map แยก

  // หรือ inline สำหรับ deploy ง่ายกว่า
  // sourcemap: 'inline',  // ฝังใน bundle

  onBuildEnd: (result) => {
    // Upload source maps ไปยัง error tracking service
    // await uploadSourceMaps('dist', {
    //   service: 'sentry',
    //   release: process.env.VERSION
    // });
  }
}`))),

      h3('3. Cache Busting'),
      pre(code(...codeBlock(`import { randomBytes } from 'crypto';

const hash = randomBytes(8).toString('hex');

export default {
  build: {
    entry: 'src/main.ts',
    outDir: 'dist',
    outFile: \`main.\${hash}.js\`,  // e.g., main.a1b2c3d4.js

    copy: [
      {
        from: 'index.html',
        to: 'index.html',
        transform: (content) => {
          // อัพเดท script src ด้วยชื่อไฟล์ที่มี hash
          return content.replace(
            'src="main.js"',
            \`src="main.\${hash}.js"\`
          );
        }
      }
    ]
  }
}`))),

      h2('แก้ไขปัญหา Build'),

      h3('Build ล้มเหลวกับ Module Not Found'),
      pre(code(...codeBlock(`# ตรวจสอบว่า dependencies ทั้งหมดถูกติดตั้ง
npm install

# ล้าง node_modules และติดตั้งใหม่
rm -rf node_modules package-lock.json
npm install

# ตรวจสอบว่า module path ถูกต้อง
# ใช้ absolute paths ใน config
import { resolve } from 'path';

export default {
  build: {
    entry: resolve(__dirname, 'src/main.ts')  // ✅ ถูกต้อง
    // entry: 'src/main.ts'                    // ❌ อาจล้มเหลว
  }
}`))),

      h3('ขนาด Bundle ใหญ่เกินไป'),
      pre(code(...codeBlock(`# วิเคราะห์ว่ามีอะไรใน bundle
npx esbuild src/main.ts --bundle --metafile=meta.json

# ดู bundle analysis
npx esbuild-visualizer meta.json

# วิธีแก้:
# 1. ใช้ tree shaking
build: { treeshake: true }

# 2. ทำ deps ขนาดใหญ่เป็น external
build: { external: ['lodash', 'moment'] }

# 3. ใช้ dynamic imports สำหรับ code splitting
const module = await import('./large-module.js');

# 4. ลบ dependencies ที่ไม่ใช้
npm uninstall unused-package`))),

      h3('TypeScript Errors ระหว่าง Build'),
      pre(code(...codeBlock(`# ตรวจสอบว่า TypeScript ถูกติดตั้ง
npm install -D typescript

# ตรวจสอบ tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true
  }
}

# Type check ก่อน build
npx tsc --noEmit
npx elit build`))),

      h2('ตัวอย่าง Production แบบสมบูรณ์'),
      pre(code(...codeBlock(`// elit.config.ts
import { resolve } from 'path';
import { writeFileSync } from 'fs';

const isDev = process.env.MODE !== 'production';
const version = process.env.npm_package_version || '1.0.0';

export default {
  build: {
    entry: resolve(__dirname, 'src/main.ts'),
    outDir: resolve(__dirname, 'dist'),
    outFile: 'main.js',
    format: 'esm',
    target: 'es2020',
    platform: 'browser',

    // Production optimizations
    minify: !isDev,
    sourcemap: isDev ? true : 'external',
    treeshake: true,

    // Environment variables
    env: {
      VITE_APP_VERSION: version,
      VITE_API_URL: process.env.API_URL || 'https://api.example.com',
      VITE_ANALYTICS_ID: process.env.ANALYTICS_ID || '',
      VITE_SENTRY_DSN: process.env.SENTRY_DSN || '',
      VITE_BUILD_TIME: new Date().toISOString()
    },

    // External dependencies (โหลดจาก CDN)
    external: isDev ? [] : ['chart.js', 'lodash-es'],

    // คัดลอกและแปลงไฟล์
    copy: [
      {
        from: 'index.html',
        to: 'index.html',
        transform: (content, config) => {
          let html = content;

          // อัพเดท script src
          html = html.replace('src="src/main.ts"', 'src="main.js"');

          // Inject base tag
          if (config.basePath) {
            html = html.replace(
              '<head>',
              \`<head>\\n  <base href="\${config.basePath}/">\`
            );
          }

          // Inject CDN scripts สำหรับ externals
          if (!isDev) {
            const cdnScripts = \`
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
  <script src="https://cdn.jsdelivr.net/npm/lodash-es@4"></script>\`;
            html = html.replace('</head>', \`\${cdnScripts}\\n</head>\`);
          }

          return html;
        }
      },
      {
        from: 'public',
        to: '.'
      }
    ],

    // Post-build hook
    onBuildEnd: async (result) => {
      const sizeInKB = (result.size / 1024).toFixed(2);

      console.log('\\n✅ Build completed successfully!');
      console.log(\`   Version: \${version}\`);
      console.log(\`   Size: \${sizeInKB} KB\`);
      console.log(\`   Time: \${result.buildTime}ms\`);

      // สร้าง build manifest
      const manifest = {
        version,
        timestamp: new Date().toISOString(),
        size: result.size,
        buildTime: result.buildTime,
        env: process.env.MODE || 'production'
      };

      writeFileSync(
        resolve(__dirname, 'dist/build-info.json'),
        JSON.stringify(manifest, null, 2)
      );

      // เตือนถ้า bundle ใหญ่เกินไป
      if (result.size > 500 * 1024) {
        console.warn('\\n⚠️  Warning: Bundle size exceeds 500 KB');
        console.warn('   Consider code splitting or lazy loading');
      }
    }
  }
}`))),

      h2('กลยุทธ์การ Deployment'),

      h3('1. Static Hosting (Vercel, Netlify)'),
      pre(code(...codeBlock(`# Build สำหรับ production
npm run build

# Deploy โฟลเดอร์ dist/
# vercel --prod
# netlify deploy --prod --dir=dist

# เพิ่ม build command ใน package.json
{
  "scripts": {
    "build": "npx elit build",
    "deploy": "npm run build && vercel --prod"
  }
}`))),

      h3('2. CDN Deployment (AWS S3 + CloudFront)'),
      pre(code(...codeBlock(`# Build ด้วยการตั้งค่า production
MODE=production npm run build

# Sync ไปยัง S3
aws s3 sync dist/ s3://my-bucket/ \\
  --delete \\
  --cache-control "public,max-age=31536000,immutable"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \\
  --distribution-id DISTRIBUTION_ID \\
  --paths "/*"`))),

      h3('3. Docker Container'),
      pre(code(...codeBlock(`# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Build และรัน
docker build -t my-app .
docker run -p 80:80 my-app`))),

      h2('สรุป'),
      p('Elit build system มอบวิธีที่ทรงพลังและยืดหยุ่นในการ build แอปพลิเคชันของคุณ:'),
      ul(
        li('⚡ Builds เร็วปานสายฟ้าด้วย esbuild'),
        li('📦 Tree shaking และ minification สำหรับ bundle ที่เหมาะสม'),
        li('🔄 รองรับ single และ multiple entry points'),
        li('🌍 Injection ของ environment variables'),
        li('📋 การคัดลอกไฟล์พร้อม transformation'),
        li('🎯 หลายรูปแบบ output (ESM, CJS, IIFE)'),
        li('🗺️ สร้าง source maps สำหรับ debugging'),
        li('🎨 Post-build hooks สำหรับ workflows กำหนดเอง'),
        li('⚙️ รองรับ TypeScript แบบเต็มรูปแบบ'),
        li('🚀 Optimizations พร้อมสำหรับ production')
      ),

      p('ด้วยฟีเจอร์เหล่านี้ คุณสามารถ build ทุกอย่างตั้งแต่ single-page apps แบบง่ายไปจนถึงสถาปัตยกรรม micro-frontend ที่ซับซ้อน'),

      h2('ขั้นตอนต่อไป'),
      ul(
        li(a({ href: '/blog/20' }, 'เรียนรู้เกี่ยวกับ Dev และ Preview Servers')),
        li(a({ href: '/blog/19' }, 'อ่านคู่มือการตั้งค่าฉบับสมบูรณ์')),
        li(a({ href: '/blog/18' }, 'สำรวจฟีเจอร์ของ Elit')),
        li(a({ href: '/docs' }, 'เรียกดูเอกสารฉบับเต็ม')),
        li(a({ href: '/examples' }, 'ดูตัวอย่างโค้ด'))
      )
    )
  }
};
