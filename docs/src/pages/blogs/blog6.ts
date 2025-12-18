import { div, h2, h3, p, ul, li, pre, code } from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog6: BlogPostDetail = {
  id: '6',
  title: {
    en: 'Getting Started with Elit and Vite',
    th: 'เริ่มต้นใช้งาน Elit กับ Vite'
  },
  date: '2024-02-20',
  author: 'n-devs',
  tags: ['Tutorial', 'Vite', 'Setup', 'Build Tools'],
  content: {
    en: div(
      p('Vite is a modern build tool that provides lightning-fast development experience. Learn how to set up Elit with Vite for an optimal development workflow.'),

      h2('Why Vite?'),
      p('Vite offers several advantages for Elit development:'),
      ul(
        li('Lightning-fast hot module replacement (HMR)'),
        li('Instant server start - no bundling in dev mode'),
        li('Optimized production builds with Rollup'),
        li('Built-in TypeScript support'),
        li('Simple configuration'),
        li('Rich plugin ecosystem')
      ),

      h2('Project Setup'),
      h3('1. Create a New Vite Project'),
      p('Start by creating a new Vite project with TypeScript:'),
      pre(code(...codeBlock(`npm create vite@latest my-elit-app -- --template vanilla-ts
cd my-elit-app
npm install`))),

      h3('2. Install Elit'),
      p('Add Elit to your project:'),
      pre(code(...codeBlock(`npm install elit`))),

      h3('3. Project Structure'),
      p('Your project structure should look like this:'),
      pre(code(...codeBlock(`my-elit-app/
├── src/
│   ├── main.ts
│   ├── style.css
│   └── components/
│       └── Counter.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts`))),

      h2('Basic Configuration'),
      h3('vite.config.ts'),
      p('Create a basic Vite configuration:'),
      pre(code(...codeBlock(`import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: true
  }
});`))),

      h3('tsconfig.json'),
      p('Configure TypeScript for optimal Elit usage:'),
      pre(code(...codeBlock(`{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "lib": ["ESNext", "DOM"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"]
}`))),

      h2('Creating Your First Component'),
      h3('src/components/Counter.ts'),
      p('Create a simple counter component using Elit:'),
      pre(code(...codeBlock(`import { div, button, span, createState, reactive } from 'elit';

export const Counter = () => {
  const count = createState(0);

  return div({ className: 'counter' },
    reactive(count, value =>
      div(
        button({
          onclick: () => count.value--,
          className: 'btn'
        }, '-'),
        span({ className: 'count' }, \` \${value} \`),
        button({
          onclick: () => count.value++,
          className: 'btn'
        }, '+')
      )
    )
  );
};`))),

      h2('Main Application'),
      h3('src/main.ts'),
      p('Set up your main application file:'),
      pre(code(...codeBlock(`import { dom, div, h1, p } from 'elit';
import { Counter } from './components/Counter';
import './style.css';

const app = div({ className: 'app' },
  h1('Welcome to Elit + Vite'),
  p('A fast and lightweight development experience'),
  Counter()
);

dom.render('#app', app);`))),

      h3('index.html'),
      p('Update your HTML entry point:'),
      pre(code(...codeBlock(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Elit + Vite</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`))),

      h2('Development Workflow'),
      h3('Start Development Server'),
      pre(code(...codeBlock(`npm run dev`))),
      p('Vite will start a development server with HMR. Changes to your Elit components will update instantly in the browser.'),

      h3('Build for Production'),
      pre(code(...codeBlock(`npm run build`))),
      p('This creates an optimized production build in the dist/ directory.'),

      h3('Preview Production Build'),
      pre(code(...codeBlock(`npm run preview`))),

      h2('Advanced Configuration'),
      h3('Path Aliases'),
      p('Set up path aliases for cleaner imports:'),
      pre(code(...codeBlock(`// vite.config.ts
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  }
});

// tsconfig.json - add to compilerOptions
{
  "baseUrl": ".",
  "paths": {
    "@/*": ["src/*"],
    "@components/*": ["src/components/*"],
    "@utils/*": ["src/utils/*"]
  }
}`))),

      h3('CSS Preprocessing'),
      p('Install and use Sass/SCSS:'),
      pre(code(...codeBlock(`npm install -D sass

// Import in your component
import './Counter.scss';`))),

      h3('Environment Variables'),
      p('Create a .env file for environment variables:'),
      pre(code(...codeBlock(`# .env
VITE_API_URL=https://api.example.com
VITE_APP_TITLE=My Elit App

// Access in your code
const apiUrl = import.meta.env.VITE_API_URL;`))),

      h2('Optimization Tips'),
      ul(
        li('Use dynamic imports for code splitting'),
        li('Enable build compression with vite-plugin-compression'),
        li('Optimize assets with vite-plugin-imagemin'),
        li('Use lazy loading for routes and heavy components'),
        li('Configure chunk splitting in build options')
      ),

      h3('Code Splitting Example'),
      pre(code(...codeBlock(`// Lazy load heavy components
const HeavyComponent = async () => {
  const module = await import('./components/HeavyComponent');
  return module.HeavyComponent();
};

// Use in your app
div(
  button({
    onclick: async () => {
      const component = await HeavyComponent();
      container.appendChild(component.node);
    }
  }, 'Load Heavy Component')
);`))),

      h2('Useful Vite Plugins'),
      p('Enhance your development experience with these plugins:'),

      h3('1. vite-plugin-compression'),
      pre(code(...codeBlock(`npm install -D vite-plugin-compression

// vite.config.ts
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    compression({
      algorithm: 'gzip',
      ext: '.gz'
    })
  ]
});`))),

      h3('2. vite-plugin-pwa'),
      p('Add Progressive Web App support:'),
      pre(code(...codeBlock(`npm install -D vite-plugin-pwa

// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'My Elit App',
        short_name: 'Elit App',
        description: 'Built with Elit and Vite',
        theme_color: '#ffffff'
      }
    })
  ]
});`))),

      h2('Testing with Vitest'),
      p('Vitest is the perfect testing companion for Vite projects:'),
      pre(code(...codeBlock(`npm install -D vitest jsdom @vitest/ui

// vite.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true
  }
});

// Example test
import { describe, it, expect } from 'vitest';
import { createState } from 'elit';

describe('Counter State', () => {
  it('should increment count', () => {
    const count = createState(0);
    count.value++;
    expect(count.value).toBe(1);
  });
});`))),

      h2('Deployment'),
      h3('Static Hosting'),
      p('Deploy to Netlify, Vercel, or GitHub Pages:'),
      pre(code(...codeBlock(`# Build
npm run build

# The dist/ folder is ready for deployment

# For GitHub Pages, add to package.json:
{
  "scripts": {
    "build": "vite build --base=/your-repo-name/"
  }
}`))),

      h2('Conclusion'),
      p('Vite provides an excellent development experience for Elit applications. Its fast HMR, simple configuration, and powerful build optimization make it the perfect companion for building modern web applications with Elit.'),
      p('The combination of Elit\'s lightweight approach and Vite\'s speed creates an unmatched developer experience with minimal bundle sizes and lightning-fast builds.')
    ),
    th: div(
      p('Vite เป็นเครื่องมือ build ทันสมัยที่ให้ประสบการณ์การพัฒนาที่รวดเร็วเหมือนสายฟ้าแลบ เรียนรู้วิธีตั้งค่า Elit กับ Vite เพื่อเวิร์กโฟลว์การพัฒนาที่เหมาะสม'),

      h2('ทำไมต้อง Vite?'),
      p('Vite มีข้อได้เปรียบหลายอย่างสำหรับการพัฒนาด้วย Elit:'),
      ul(
        li('Hot module replacement (HMR) ที่รวดเร็วเหมือนสายฟ้า'),
        li('เริ่มเซิร์ฟเวอร์ทันที - ไม่ต้อง bundle ในโหมด dev'),
        li('Production builds ที่ optimize แล้วด้วย Rollup'),
        li('รองรับ TypeScript ในตัว'),
        li('การตั้งค่าง่าย'),
        li('Ecosystem ของ plugin ที่หลากหลาย')
      ),

      h2('การตั้งค่าโปรเจกต์'),
      h3('1. สร้างโปรเจกต์ Vite ใหม่'),
      p('เริ่มต้นด้วยการสร้างโปรเจกต์ Vite ใหม่พร้อม TypeScript:'),
      pre(code(...codeBlock(`npm create vite@latest my-elit-app -- --template vanilla-ts
cd my-elit-app
npm install`))),

      h3('2. ติดตั้ง Elit'),
      p('เพิ่ม Elit เข้าไปในโปรเจกต์:'),
      pre(code(...codeBlock(`npm install elit`))),

      h3('3. โครงสร้างโปรเจกต์'),
      p('โครงสร้างโปรเจกต์ควรมีลักษณะแบบนี้:'),
      pre(code(...codeBlock(`my-elit-app/
├── src/
│   ├── main.ts
│   ├── style.css
│   └── components/
│       └── Counter.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts`))),

      h2('การตั้งค่าพื้นฐาน'),
      h3('vite.config.ts'),
      p('สร้างการตั้งค่า Vite พื้นฐาน:'),
      pre(code(...codeBlock(`import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: true
  }
});`))),

      h3('tsconfig.json'),
      p('ตั้งค่า TypeScript เพื่อการใช้งาน Elit ที่เหมาะสม:'),
      pre(code(...codeBlock(`{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "lib": ["ESNext", "DOM"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"]
}`))),

      h2('สร้าง Component แรก'),
      h3('src/components/Counter.ts'),
      p('สร้าง counter component ง่ายๆ โดยใช้ Elit:'),
      pre(code(...codeBlock(`import { div, button, span, createState, reactive } from 'elit';

export const Counter = () => {
  const count = createState(0);

  return div({ className: 'counter' },
    reactive(count, value =>
      div(
        button({
          onclick: () => count.value--,
          className: 'btn'
        }, '-'),
        span({ className: 'count' }, \` \${value} \`),
        button({
          onclick: () => count.value++,
          className: 'btn'
        }, '+')
      )
    )
  );
};`))),

      h2('แอปพลิเคชันหลัก'),
      h3('src/main.ts'),
      p('ตั้งค่าไฟล์แอปพลิเคชันหลัก:'),
      pre(code(...codeBlock(`import { dom, div, h1, p } from 'elit';
import { Counter } from './components/Counter';
import './style.css';

const app = div({ className: 'app' },
  h1('ยินดีต้อนรับสู่ Elit + Vite'),
  p('ประสบการณ์การพัฒนาที่รวดเร็วและเบา'),
  Counter()
);

dom.render('#app', app);`))),

      h3('index.html'),
      p('อัปเดต HTML entry point:'),
      pre(code(...codeBlock(`<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Elit + Vite</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`))),

      h2('เวิร์กโฟลว์การพัฒนา'),
      h3('เริ่ม Development Server'),
      pre(code(...codeBlock(`npm run dev`))),
      p('Vite จะเริ่ม development server พร้อม HMR การเปลี่ยนแปลงใน Elit components จะอัปเดตทันทีในเบราว์เซอร์'),

      h3('Build สำหรับ Production'),
      pre(code(...codeBlock(`npm run build`))),
      p('สร้าง production build ที่ optimize แล้วใน directory dist/'),

      h3('ดูตัวอย่าง Production Build'),
      pre(code(...codeBlock(`npm run preview`))),

      h2('การตั้งค่าขั้นสูง'),
      h3('Path Aliases'),
      p('ตั้งค่า path aliases เพื่อการ import ที่สะอาดขึ้น:'),
      pre(code(...codeBlock(`// vite.config.ts
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  }
});

// tsconfig.json - เพิ่มใน compilerOptions
{
  "baseUrl": ".",
  "paths": {
    "@/*": ["src/*"],
    "@components/*": ["src/components/*"],
    "@utils/*": ["src/utils/*"]
  }
}`))),

      h3('CSS Preprocessing'),
      p('ติดตั้งและใช้ Sass/SCSS:'),
      pre(code(...codeBlock(`npm install -D sass

// Import ใน component
import './Counter.scss';`))),

      h3('Environment Variables'),
      p('สร้างไฟล์ .env สำหรับตัวแปร environment:'),
      pre(code(...codeBlock(`# .env
VITE_API_URL=https://api.example.com
VITE_APP_TITLE=My Elit App

// เข้าถึงในโค้ด
const apiUrl = import.meta.env.VITE_API_URL;`))),

      h2('เคล็ดลับการเพิ่มประสิทธิภาพ'),
      ul(
        li('ใช้ dynamic imports สำหรับ code splitting'),
        li('เปิดการบีบอัด build ด้วย vite-plugin-compression'),
        li('เพิ่มประสิทธิภาพ assets ด้วย vite-plugin-imagemin'),
        li('ใช้ lazy loading สำหรับ routes และ components ที่หนัก'),
        li('ตั้งค่า chunk splitting ใน build options')
      ),

      h3('ตัวอย่าง Code Splitting'),
      pre(code(...codeBlock(`// Lazy load components ที่หนัก
const HeavyComponent = async () => {
  const module = await import('./components/HeavyComponent');
  return module.HeavyComponent();
};

// ใช้ในแอป
div(
  button({
    onclick: async () => {
      const component = await HeavyComponent();
      container.appendChild(component.node);
    }
  }, 'โหลด Heavy Component')
);`))),

      h2('Vite Plugins ที่มีประโยชน์'),
      p('ปรับปรุงประสบการณ์การพัฒนาด้วย plugins เหล่านี้:'),

      h3('1. vite-plugin-compression'),
      pre(code(...codeBlock(`npm install -D vite-plugin-compression

// vite.config.ts
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    compression({
      algorithm: 'gzip',
      ext: '.gz'
    })
  ]
});`))),

      h3('2. vite-plugin-pwa'),
      p('เพิ่มการรองรับ Progressive Web App:'),
      pre(code(...codeBlock(`npm install -D vite-plugin-pwa

// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'My Elit App',
        short_name: 'Elit App',
        description: 'สร้างด้วย Elit และ Vite',
        theme_color: '#ffffff'
      }
    })
  ]
});`))),

      h2('การทดสอบด้วย Vitest'),
      p('Vitest เป็นตัวช่วยทดสอบที่เหมาะสมกับโปรเจกต์ Vite:'),
      pre(code(...codeBlock(`npm install -D vitest jsdom @vitest/ui

// vite.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true
  }
});

// ตัวอย่างการทดสอบ
import { describe, it, expect } from 'vitest';
import { createState } from 'elit';

describe('Counter State', () => {
  it('should increment count', () => {
    const count = createState(0);
    count.value++;
    expect(count.value).toBe(1);
  });
});`))),

      h2('การ Deploy'),
      h3('Static Hosting'),
      p('Deploy ไป Netlify, Vercel หรือ GitHub Pages:'),
      pre(code(...codeBlock(`# Build
npm run build

# โฟลเดอร์ dist/ พร้อมสำหรับ deployment

# สำหรับ GitHub Pages เพิ่มใน package.json:
{
  "scripts": {
    "build": "vite build --base=/your-repo-name/"
  }
}`))),

      h2('สรุป'),
      p('Vite ให้ประสบการณ์การพัฒนาที่ยอดเยี่ยมสำหรับแอปพลิเคชัน Elit HMR ที่รวดเร็ว การตั้งค่าง่าย และการเพิ่มประสิทธิภาพ build ที่ทรงพลัง ทำให้เป็นตัวเลือกที่สมบูรณ์แบบสำหรับสร้างเว็บแอปพลิเคชันสมัยใหม่ด้วย Elit'),
      p('การผสมผสานระหว่างแนวทางที่เบาของ Elit และความเร็วของ Vite สร้างประสบการณ์นักพัฒนาที่เหนือชั้นพร้อมขนาด bundle ที่น้อยที่สุดและการ build ที่รวดเร็วเหมือนสายฟ้า')
    )
  }
};
