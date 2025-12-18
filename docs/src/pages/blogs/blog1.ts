import { div, h1, h2, p, ul, li, pre, code, strong } from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog1: BlogPostDetail = {
  id: '1',
  title: {
    en: 'Introducing Elit: Full-Stack TypeScript Framework',
    th: 'แนะนำ Elit: Full-Stack TypeScript Framework'
  },
  date: '2024-12-18',
  author: 'n-devs',
  tags: ['Release', 'Introduction', 'Full-Stack', 'v2.0'],
  content: {
    en: div(
      p('We\'re thrilled to announce ', strong('Elit'), ' - a revolutionary full-stack TypeScript framework (~10KB gzipped) for building reactive web applications with zero runtime dependencies. This major release transforms Elit from a lightweight DOM library into a complete full-stack solution.'),

      h2('What\'s New in Elit?'),
      p('Elit is a complete rewrite that brings full-stack capabilities while maintaining the lightweight philosophy:'),

      ul(
        li(strong('🚀 Development Server'), ' - Built-in HMR with WebSocket support'),
        li(strong('🔌 Server API Router'), ' - Express-like REST API routing'),
        li(strong('🔧 Middleware System'), ' - CORS, logging, rate limiting, compression, and more'),
        li(strong('🌐 Shared State'), ' - Real-time state synchronization between server and clients'),
        li(strong('⚙️ Configuration'), ' - Flexible config files with TypeScript support'),
        li(strong('📦 Production Build'), ' - Fast esbuild-powered bundling'),
        li(strong('👁️ Preview Server'), ' - Test production builds with full feature parity'),
        li(strong('🔀 HTTP Proxy'), ' - Forward API requests to backend services'),
        li(strong('👷 Web Workers'), ' - Service Workers and Web Workers configuration'),
        li(strong('🎯 Multi-Client'), ' - Develop multiple apps simultaneously on different paths')
      ),

      h2('Why Elit?'),
      p('Unlike traditional frameworks that separate frontend and backend concerns, Elit provides a unified development experience:'),

      ul(
        li('📝 ', strong('Single Language'), ' - Write both client and server in TypeScript'),
        li('🎯 ', strong('Single Config'), ' - Configure dev server, API, and build in one file'),
        li('⚡ ', strong('Instant HMR'), ' - See changes immediately without full reload'),
        li('🔌 ', strong('Built-in API'), ' - No need for separate Express/Fastify setup'),
        li('📦 ', strong('Zero Config'), ' - Works out of the box, configure only what you need'),
        li('🚀 ', strong('Fast Build'), ' - esbuild provides lightning-fast bundling')
      ),

      h2('Core Features'),
      ul(
        li('Tiny bundle size: ~10KB gzipped (client-side only)'),
        li('Zero runtime dependencies'),
        li('100+ element factories for HTML, SVG, and MathML'),
        li('Built-in reactive state management'),
        li('Server-side rendering (SSR) support'),
        li('Powerful CreateStyle CSS-in-JS system'),
        li('Client-side routing with hash/history modes'),
        li('TypeScript-first with full type safety'),
        li('REST API with middleware chain support'),
        li('WebSocket for real-time communication'),
        li('Environment variable support (.env files)'),
        li('Multiple build configurations')
      ),

      h2('Quick Example: Full-Stack Counter'),
      p('Here\'s a complete full-stack application in Elit:'),

      pre(code(...codeBlock(`// elit.config.ts
import { defineConfig } from 'elit/config';
import { ServerRouter, json } from 'elit/server';

const api = new ServerRouter();

// Server-side API endpoint
api.get('/api/count', (ctx) => {
  json(ctx.res, { count: 42 });
});

export default defineConfig({
  dev: {
    port: 3000,
    root: './src',
    api  // Mount API router
  },
  build: {
    entry: './src/main.ts',
    outDir: './dist',
    minify: true
  }
});`))),

      pre(code(...codeBlock(`// src/main.ts (Client-side)
import { div, h1, button } from 'elit/el';
import { dom } from 'elit/dom';
import { createState, reactive } from 'elit/state';

// Client-side reactive state
const count = createState(0);

// Fetch from server
fetch('/api/count')
  .then(r => r.json())
  .then(data => count.value = data.count);

// Reactive UI
const app = div(
  h1('Full-Stack Counter'),
  reactive(count, value =>
    div(
      button({ onclick: () => count.value-- }, '-'),
      span(\` \${value} \`),
      button({ onclick: () => count.value++ }, '+')
    )
  )
);

dom.render('#app', app);`))),

      h2('Development Workflow'),
      p('Start developing with just three commands:'),

      pre(code(...codeBlock(`# Install
npm install elit

# Start dev server (with HMR and API)
npx elit dev

# Build for production
npx elit build

# Preview production build
npx elit preview`))),

      h2('What Makes Elit Different?'),

      ul(
        li(strong('No React/Vue Required'), ' - Direct DOM manipulation, no virtual DOM overhead'),
        li(strong('No Build Step in Dev'), ' - Native ESM with on-demand transpilation'),
        li(strong('Unified Stack'), ' - Frontend, backend, and build tool in one package'),
        li(strong('Minimal Learning Curve'), ' - If you know TypeScript and DOM, you know Elit'),
        li(strong('Performance First'), ' - Fine-grained reactivity with minimal re-renders'),
        li(strong('Full Control'), ' - No magic, no conventions, just code')
      ),

      h2('Get Started'),
      p('Install Elit and start building:'),
      pre(code('npm install elit')),

      p('Create your first full-stack app:'),
      pre(code(...codeBlock(`mkdir my-app
cd my-app
npm init -y
npm install elit

# Create index.html
echo '<!DOCTYPE html>
<html>
  <head><title>My App</title></head>
  <body><div id="app"></div>
  <script type="module" src="./src/main.ts"></script>
  </body>
</html>' > index.html

# Create src/main.ts (see example above)
mkdir src

# Start dev server
npx elit dev`))),

      h2('What\'s Next?'),
      p('Elit is production-ready and actively maintained. Here\'s what\'s coming:'),
      ul(
        li('📱 Mobile-first components library'),
        li('🧪 Testing utilities and helpers'),
        li('📊 DevTools extension for debugging'),
        li('🎨 UI component marketplace'),
        li('📚 More tutorials and examples')
      ),

      h2('Learn More'),
      p('Check out the comprehensive documentation and examples:'),
      ul(
        li('📖 Read the full ', strong('Documentation')),
        li('🎯 Explore ', strong('Examples')),
        li('🔌 Learn about ', strong('API Reference')),
        li('📝 Follow our ', strong('Blog Tutorials'))
      ),

      p('Join the Elit community and start building amazing full-stack applications today!')
    ),
    th: div(
      p('เรารู้สึกตื่นเต้นที่จะประกาศเปิดตัว ', strong('Elit'), ' - full-stack TypeScript framework ที่ปฏิวัติวงการ (~10KB gzipped) สำหรับสร้างเว็บแอปพลิเคชันแบบ reactive โดยไม่มี runtime dependencies เลย รุ่นเมเจอร์นี้เปลี่ยน Elit จากไลบรารี DOM เบาๆ เป็นโซลูชัน full-stack ที่สมบูรณ์'),

      h2('มีอะไรใหม่ใน Elit?'),
      p('Elit ถูกเขียนใหม่ทั้งหมด นำความสามารถ full-stack มาให้ ขณะเดียวกันก็รักษาปรัชญาความเบาไว้:'),

      ul(
        li(strong('🚀 Development Server'), ' - Built-in HMR พร้อม WebSocket'),
        li(strong('🔌 Server API Router'), ' - REST API routing แบบ Express'),
        li(strong('🔧 Middleware System'), ' - CORS, logging, rate limiting, compression และอื่นๆ'),
        li(strong('🌐 Shared State'), ' - State synchronization แบบ real-time ระหว่าง server และ clients'),
        li(strong('⚙️ Configuration'), ' - Config files แบบยืดหยุ่นพร้อมรองรับ TypeScript'),
        li(strong('📦 Production Build'), ' - Bundling เร็วด้วย esbuild'),
        li(strong('👁️ Preview Server'), ' - ทดสอบ production builds พร้อมฟีเจอร์ครบ'),
        li(strong('🔀 HTTP Proxy'), ' - Forward API requests ไป backend services'),
        li(strong('👷 Web Workers'), ' - กำหนดค่า Service Workers และ Web Workers'),
        li(strong('🎯 Multi-Client'), ' - พัฒนาหลาย apps พร้อมกันบน paths ต่างๆ')
      ),

      h2('ทำไมต้อง Elit?'),
      p('ต่างจาก frameworks แบบดั้งเดิมที่แยก frontend และ backend, Elit ให้ประสบการณ์การพัฒนาแบบรวมศูนย์:'),

      ul(
        li('📝 ', strong('Single Language'), ' - เขียนทั้ง client และ server ด้วย TypeScript'),
        li('🎯 ', strong('Single Config'), ' - ตั้งค่า dev server, API และ build ในไฟล์เดียว'),
        li('⚡ ', strong('Instant HMR'), ' - เห็นการเปลี่ยนแปลงทันทีโดยไม่ reload ทั้งหน้า'),
        li('🔌 ', strong('Built-in API'), ' - ไม่ต้องติดตั้ง Express/Fastify แยก'),
        li('📦 ', strong('Zero Config'), ' - ใช้งานได้ทันที ตั้งค่าเฉพาะที่ต้องการ'),
        li('🚀 ', strong('Fast Build'), ' - esbuild ให้การ bundle ที่เร็วสุดๆ')
      ),

      h2('คุณสมบัติหลัก'),
      ul(
        li('ขนาดเล็ก: ~10KB gzipped (client-side อย่างเดียว)'),
        li('ไม่มี runtime dependencies'),
        li('มี element factories กว่า 100+ ตัวสำหรับ HTML, SVG และ MathML'),
        li('ระบบจัดการ state แบบ reactive ในตัว'),
        li('รองรับ Server-side rendering (SSR)'),
        li('ระบบ CreateStyle CSS-in-JS ที่ทรงพลัง'),
        li('Client-side routing ด้วย hash/history modes'),
        li('สร้างด้วย TypeScript พร้อม type safety เต็มรูปแบบ'),
        li('REST API พร้อม middleware chain'),
        li('WebSocket สำหรับ real-time communication'),
        li('รองรับ Environment variables (.env files)'),
        li('กำหนดค่า build ได้หลายแบบ')
      ),

      h2('ตัวอย่างง่ายๆ: Full-Stack Counter'),
      p('นี่คือแอปพลิเคชัน full-stack สมบูรณ์ใน Elit:'),

      pre(code(...codeBlock(`// elit.config.ts
import { defineConfig } from 'elit/config';
import { ServerRouter, json } from 'elit/server';
const api = new ServerRouter();

// Server-side API endpoint
api.get('/api/count', (ctx) => {
  json(ctx.res, { count: 42 });
});

export default defineConfig({
  dev: {
    port: 3000,
    root: './src',
    api  // Mount API router
  },
  build: {
    entry: './src/main.ts',
    outDir: './dist',
    minify: true
  }
});`))),

      pre(code(...codeBlock(`// src/main.ts (Client-side)
import { dom } from 'elit/dom';
import { createState, reactive } from 'elit/state';
import { div, h1, button } from 'elit/el';
// Client-side reactive state
const count = createState(0);

// Fetch จาก server
fetch('/api/count')
  .then(r => r.json())
  .then(data => count.value = data.count);

// Reactive UI
const app = div(
  h1('Full-Stack Counter'),
  reactive(count, value =>
    div(
      button({ onclick: () => count.value-- }, '-'),
      span(\` \${value} \`),
      button({ onclick: () => count.value++ }, '+')
    )
  )
);

dom.render('#app', app);`))),

      h2('Development Workflow'),
      p('เริ่มพัฒนาด้วยแค่สามคำสั่ง:'),

      pre(code(...codeBlock(`# ติดตั้ง
npm install elit

# เริ่ม dev server (พร้อม HMR และ API)
npx elit dev

# Build สำหรับ production
npx elit build

# Preview production build
npx elit preview`))),

      h2('อะไรที่ทำให้ Elit แตกต่าง?'),

      ul(
        li(strong('ไม่ต้องใช้ React/Vue'), ' - จัดการ DOM โดยตรง ไม่มี virtual DOM overhead'),
        li(strong('ไม่ต้อง Build ตอน Dev'), ' - Native ESM พร้อม on-demand transpilation'),
        li(strong('Unified Stack'), ' - Frontend, backend และ build tool ในแพ็คเกจเดียว'),
        li(strong('เรียนรู้ง่าย'), ' - ถ้ารู้ TypeScript และ DOM ก็รู้จัก Elit แล้ว'),
        li(strong('ประสิทธิภาพสูงสุด'), ' - Fine-grained reactivity พร้อม re-renders น้อยที่สุด'),
        li(strong('ควบคุมเต็มที่'), ' - ไม่มี magic, ไม่มี conventions, แค่โค้ด')
      ),

      h2('เริ่มต้นใช้งาน'),
      p('ติดตั้ง Elit และเริ่มสร้าง:'),
      pre(code('npm install elit')),

      p('สร้างแอป full-stack แรกของคุณ:'),
      pre(code(...codeBlock(`mkdir my-app
cd my-app
npm init -y
npm install elit

# สร้าง index.html
echo '<!DOCTYPE html>
<html>
  <head><title>My App</title></head>
  <body><div id="app"></div>
  <script type="module" src="./src/main.ts"></script>
  </body>
</html>' > index.html

# สร้าง src/main.ts (ดูตัวอย่างด้านบน)
mkdir src

# เริ่ม dev server
npx elit dev`))),

      h2('จะมีอะไรต่อไป?'),
      p('Elit พร้อมใช้งาน production และมีการดูแลอย่างต่อเนื่อง นี่คือสิ่งที่กำลังจะมา:'),
      ul(
        li('📱 Mobile-first components library'),
        li('🧪 Testing utilities และ helpers'),
        li('📊 DevTools extension สำหรับ debugging'),
        li('🎨 UI component marketplace'),
        li('📚 บทความและตัวอย่างเพิ่มเติม')
      ),

      h2('เรียนรู้เพิ่มเติม'),
      p('ดูเอกสารและตัวอย่างที่ครบถ้วน:'),
      ul(
        li('📖 อ่าน ', strong('เอกสารฉบับเต็ม')),
        li('🎯 สำรวจ ', strong('ตัวอย่าง')),
        li('🔌 เรียนรู้ ', strong('API Reference')),
        li('📝 ติดตาม ', strong('บทความสอน'))
      ),

      p('เข้าร่วมชุมชน Elit และเริ่มสร้างแอปพลิเคชัน full-stack ที่ยอดเยี่ยมวันนี้!')
    )
  }
};
