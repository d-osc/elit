import { div, h2, h3, p, ul, li, pre, code } from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog4: BlogPostDetail = {
  id: '4',
  title: {
    en: 'Elit 2.0 vs React vs Other Frameworks: A Comprehensive Comparison',
    th: 'เปรียบเทียบ Elit 2.0 กับ React และ Frameworks อื่นๆ อย่างครบถ้วน'
  },
  date: '2024-02-10',
  author: 'n-devs',
  tags: ['Comparison', 'Frameworks', 'Performance', 'React', 'Vue', 'Svelte', 'Full Stack'],
  content: {
    en: div(
      p('Choosing the right framework is crucial for your project. Let\'s compare Elit with popular alternatives to help you make an informed decision.'),

      h2('Elit 2.0'),
      h3('Strengths:'),
      ul(
        li('Full-stack framework (~10KB gzipped) - complete solution'),
        li('Zero dependencies - no npm bloat'),
        li('Complete CLI tooling (npx elit dev/build/preview)'),
        li('Built-in dev server with HMR'),
        li('Integrated build system powered by esbuild'),
        li('REST API router with middleware support'),
        li('WebSocket support with Shared State'),
        li('Direct DOM manipulation - no virtual DOM overhead'),
        li('Simple learning curve - plain JavaScript/TypeScript'),
        li('Built-in reactive state management'),
        li('Environment variables support (.env files)'),
        li('Gzip compression and smart caching'),
        li('SSR support out of the box'),
        li('Tree-shakeable - import only what you need')
      ),
      h3('Weaknesses:'),
      ul(
        li('Smaller community compared to React/Vue'),
        li('Fewer third-party libraries and plugins'),
        li('No virtual DOM (can be less efficient for complex UIs with frequent updates)'),
        li('Manual DOM updates require careful state management')
      ),

      h2('React'),
      h3('Strengths:'),
      ul(
        li('Massive ecosystem and community'),
        li('Virtual DOM for efficient updates'),
        li('Rich tooling and developer experience'),
        li('Huge job market demand'),
        li('React Native for mobile development'),
        li('Extensive third-party libraries')
      ),
      h3('Weaknesses:'),
      ul(
        li('Large bundle size (~45KB gzipped for React + ReactDOM)'),
        li('Requires additional libraries for routing, state management'),
        li('JSX requires build step'),
        li('Complex concepts (hooks, effects, memoization)'),
        li('Virtual DOM overhead for simple applications')
      ),

      h2('Preact'),
      h3('Strengths:'),
      ul(
        li('Lightweight React alternative (~4KB)'),
        li('Compatible with React ecosystem'),
        li('Virtual DOM with smaller footprint'),
        li('Good performance')
      ),
      h3('Weaknesses:'),
      ul(
        li('Some React features missing or behave differently'),
        li('Still requires build tooling'),
        li('Smaller community than React')
      ),

      h2('Lit'),
      h3('Strengths:'),
      ul(
        li('Web Components standard'),
        li('Small size (~5KB)'),
        li('Framework-agnostic components'),
        li('Reactive properties'),
        li('Shadow DOM encapsulation')
      ),
      h3('Weaknesses:'),
      ul(
        li('Learning curve for Web Components API'),
        li('Shadow DOM can complicate styling'),
        li('Limited ecosystem compared to React/Vue'),
        li('Browser compatibility concerns for older browsers')
      ),

      h2('Vue'),
      h3('Strengths:'),
      ul(
        li('Progressive framework - easy to adopt incrementally'),
        li('Excellent documentation'),
        li('Template syntax feels familiar (HTML-like)'),
        li('Built-in routing and state management (Vue Router, Pinia)'),
        li('Good balance of features and simplicity')
      ),
      h3('Weaknesses:'),
      ul(
        li('Larger bundle size (~34KB)'),
        li('Virtual DOM overhead'),
        li('Smaller community than React'),
        li('Less corporate backing')
      ),

      h2('Svelte'),
      h3('Strengths:'),
      ul(
        li('Compile-time framework - no runtime overhead'),
        li('Very small bundle sizes'),
        li('Reactive by default - no virtual DOM'),
        li('Simple, intuitive syntax'),
        li('Excellent performance'),
        li('Built-in animations and transitions')
      ),
      h3('Weaknesses:'),
      ul(
        li('Smaller ecosystem and community'),
        li('Requires compilation step'),
        li('Less mature tooling'),
        li('Component-scoped reactivity can be limiting'),
        li('Fewer job opportunities')
      ),

      h2('Solid'),
      h3('Strengths:'),
      ul(
        li('Fine-grained reactivity - extremely fast'),
        li('No virtual DOM'),
        li('Small bundle size (~7KB)'),
        li('JSX syntax similar to React'),
        li('Better performance than React in benchmarks')
      ),
      h3('Weaknesses:'),
      ul(
        li('Small, growing community'),
        li('Limited ecosystem'),
        li('Different mental model from React despite JSX similarity'),
        li('Fewer learning resources')
      ),

      h2('Qwik'),
      h3('Strengths:'),
      ul(
        li('Resumability - instant page loads'),
        li('Lazy loads everything by default'),
        li('Excellent for large applications'),
        li('Zero hydration overhead'),
        li('Server-first architecture')
      ),
      h3('Weaknesses:'),
      ul(
        li('Very new - limited ecosystem'),
        li('Requires special bundler (Qwik City)'),
        li('Different mental model - steeper learning curve'),
        li('Not ideal for simple applications')
      ),

      h2('Vanilla JavaScript'),
      h3('Strengths:'),
      ul(
        li('No dependencies - ultimate control'),
        li('No build step needed'),
        li('Works everywhere'),
        li('Maximum performance potential')
      ),
      h3('Weaknesses:'),
      ul(
        li('Verbose and repetitive code'),
        li('No reactivity system'),
        li('Manual DOM manipulation is error-prone'),
        li('Hard to maintain large applications'),
        li('No component abstraction')
      ),

      h2('When to Choose Elit 2.0?'),
      p('Elit 2.0 is ideal when you need:'),
      ul(
        li('Full-stack framework with minimal bundle size'),
        li('Complete CLI tools for development workflow'),
        li('Built-in REST API and WebSocket support'),
        li('Direct DOM control without framework overhead'),
        li('Simple reactive state management'),
        li('SSR support without complexity'),
        li('Fast build times with integrated esbuild'),
        li('A lightweight alternative with better DX than vanilla JS'),
        li('Performance-critical applications (games, real-time apps)'),
        li('Progressive enhancement of existing sites'),
        li('Projects where you want frontend + backend in one framework')
      ),

      h2('Conclusion'),
      p('Each framework has its place. React excels in large applications with big teams. Vue offers great balance and DX. Svelte and Solid provide excellent performance with modern approaches. Qwik optimizes for initial load. Elit 2.0 shines as a full-stack solution when you need complete CLI tools, built-in API/WebSocket support, minimal overhead, direct control, and reactive features without the baggage of larger frameworks.'),
      p('Choose based on your project needs, team expertise, and performance requirements.')
    ),
    th: div(
      p('การเลือก framework ที่เหมาะสมเป็นสิ่งสำคัญสำหรับโปรเจกต์ของคุณ มาเปรียบเทียบ Elit กับทางเลือกยอดนิยมเพื่อช่วยให้คุณตัดสินใจได้อย่างรอบคอบ'),

      h2('Elit 2.0'),
      h3('จุดแข็ง:'),
      ul(
        li('Full-stack framework (~10KB gzipped) - โซลูชันครบวงจร'),
        li('ไม่มี dependencies - ไม่มี npm bloat'),
        li('เครื่องมือ CLI ครบชุด (npx elit dev/build/preview)'),
        li('Dev server พร้อม HMR ในตัว'),
        li('ระบบ build แบบบูรณาการด้วย esbuild'),
        li('REST API router พร้อม middleware'),
        li('รองรับ WebSocket พร้อม Shared State'),
        li('จัดการ DOM โดยตรง - ไม่มี virtual DOM overhead'),
        li('เรียนรู้ง่าย - JavaScript/TypeScript ธรรมดา'),
        li('มีระบบจัดการ state แบบ reactive ในตัว'),
        li('รองรับ environment variables (ไฟล์ .env)'),
        li('Gzip compression และ smart caching'),
        li('รองรับ SSR ในตัว'),
        li('Tree-shakeable - import เฉพาะที่ต้องการ')
      ),
      h3('จุดอ่อน:'),
      ul(
        li('ชุมชนเล็กกว่า React/Vue'),
        li('มี third-party libraries น้อยกว่า'),
        li('ไม่มี virtual DOM (อาจไม่มีประสิทธิภาพสำหรับ UI ที่ซับซ้อนและอัปเดตบ่อย)'),
        li('การอัปเดต DOM ด้วยตนเองต้องจัดการ state อย่างระมัดระวัง')
      ),

      h2('React'),
      h3('จุดแข็ง:'),
      ul(
        li('Ecosystem และชุมชนขนาดใหญ่'),
        li('Virtual DOM สำหรับการอัปเดตที่มีประสิทธิภาพ'),
        li('เครื่องมือและประสบการณ์นักพัฒนาที่ดี'),
        li('ตลาดงานมีความต้องการสูง'),
        li('React Native สำหรับพัฒนา mobile'),
        li('มี third-party libraries มากมาย')
      ),
      h3('จุดอ่อน:'),
      ul(
        li('ขนาด bundle ใหญ่ (~45KB gzipped สำหรับ React + ReactDOM)'),
        li('ต้องใช้ libraries เพิ่มเติมสำหรับ routing, state management'),
        li('JSX ต้องใช้ build step'),
        li('แนวคิดที่ซับซ้อน (hooks, effects, memoization)'),
        li('Virtual DOM overhead สำหรับแอปพลิเคชันง่ายๆ')
      ),

      h2('Preact'),
      h3('จุดแข็ง:'),
      ul(
        li('ทางเลือก React ที่เบา (~4KB)'),
        li('เข้ากันได้กับ ecosystem ของ React'),
        li('Virtual DOM ที่มีขนาดเล็กกว่า'),
        li('ประสิทธิภาพดี')
      ),
      h3('จุดอ่อน:'),
      ul(
        li('ขาดฟีเจอร์บางอย่างของ React หรือทำงานต่างกัน'),
        li('ยังต้องใช้ build tooling'),
        li('ชุมชนเล็กกว่า React')
      ),

      h2('Lit'),
      h3('จุดแข็ง:'),
      ul(
        li('มาตรฐาน Web Components'),
        li('ขนาดเล็ก (~5KB)'),
        li('Components ที่ไม่ขึ้นกับ framework'),
        li('Reactive properties'),
        li('Shadow DOM encapsulation')
      ),
      h3('จุดอ่อน:'),
      ul(
        li('ต้องเรียนรู้ Web Components API'),
        li('Shadow DOM ทำให้การจัดการ styling ซับซ้อน'),
        li('Ecosystem จำกัดเมื่อเทียบกับ React/Vue'),
        li('ปัญหาความเข้ากันได้กับ browser เก่า')
      ),

      h2('Vue'),
      h3('จุดแข็ง:'),
      ul(
        li('Progressive framework - นำไปใช้ทีละน้อยได้'),
        li('เอกสารยอดเยี่ยม'),
        li('Template syntax คุ้นเคย (เหมือน HTML)'),
        li('มี routing และ state management ในตัว (Vue Router, Pinia)'),
        li('สมดุลระหว่างฟีเจอร์และความเรียบง่าย')
      ),
      h3('จุดอ่อน:'),
      ul(
        li('ขนาด bundle ใหญ่ (~34KB)'),
        li('Virtual DOM overhead'),
        li('ชุมชนเล็กกว่า React'),
        li('การสนับสนุนจากองค์กรน้อยกว่า')
      ),

      h2('Svelte'),
      h3('จุดแข็ง:'),
      ul(
        li('Compile-time framework - ไม่มี runtime overhead'),
        li('ขนาด bundle เล็กมาก'),
        li('Reactive โดยปริยาย - ไม่มี virtual DOM'),
        li('Syntax เรียบง่ายและเข้าใจง่าย'),
        li('ประสิทธิภาพยอดเยี่ยม'),
        li('มี animations และ transitions ในตัว')
      ),
      h3('จุดอ่อน:'),
      ul(
        li('Ecosystem และชุมชนเล็กกว่า'),
        li('ต้องใช้ compilation step'),
        li('เครื่องมือยังไม่ค่อยเป็นผู้ใหญ่'),
        li('Reactivity ที่จำกัดอยู่ใน component'),
        li('โอกาสหางานน้อยกว่า')
      ),

      h2('Solid'),
      h3('จุดแข็ง:'),
      ul(
        li('Fine-grained reactivity - รวดเร็วมาก'),
        li('ไม่มี virtual DOM'),
        li('ขนาด bundle เล็ก (~7KB)'),
        li('JSX syntax คล้าย React'),
        li('ประสิทธิภาพดีกว่า React ใน benchmarks')
      ),
      h3('จุดอ่อน:'),
      ul(
        li('ชุมชนเล็กแต่กำลังเติบโต'),
        li('Ecosystem จำกัด'),
        li('Mental model ต่างจาก React แม้จะใช้ JSX'),
        li('แหล่งเรียนรู้น้อยกว่า')
      ),

      h2('Qwik'),
      h3('จุดแข็ง:'),
      ul(
        li('Resumability - โหลดหน้าเร็วมาก'),
        li('Lazy load ทุกอย่างโดยปริยาย'),
        li('เหมาะสำหรับแอปพลิเคชันขนาดใหญ่'),
        li('ไม่มี hydration overhead'),
        li('สถาปัตยกรรมที่ server-first')
      ),
      h3('จุดอ่อน:'),
      ul(
        li('ใหม่มาก - ecosystem จำกัด'),
        li('ต้องใช้ bundler พิเศษ (Qwik City)'),
        li('Mental model ต่าง - เรียนรู้ยากกว่า'),
        li('ไม่เหมาะสำหรับแอปพลิเคชันง่ายๆ')
      ),

      h2('Vanilla JavaScript'),
      h3('จุดแข็ง:'),
      ul(
        li('ไม่มี dependencies - ควบคุมได้เต็มที่'),
        li('ไม่ต้อง build step'),
        li('ใช้ได้ทุกที่'),
        li('ศักยภาพประสิทธิภาพสูงสุด')
      ),
      h3('จุดอ่อน:'),
      ul(
        li('โค้ดยาวและซ้ำซาก'),
        li('ไม่มีระบบ reactivity'),
        li('จัดการ DOM ด้วยตนเองเสี่ยงต่อข้อผิดพลาด'),
        li('ยากต่อการดูแลรักษาแอปพลิเคชันใหญ่'),
        li('ไม่มี component abstraction')
      ),

      h2('เมื่อไหร่ควรเลือก Elit 2.0?'),
      p('Elit 2.0 เหมาะเมื่อคุณต้องการ:'),
      ul(
        li('Full-stack framework ที่มีขนาด bundle น้อย'),
        li('เครื่องมือ CLI ครบครันสำหรับ workflow การพัฒนา'),
        li('รองรับ REST API และ WebSocket ในตัว'),
        li('ควบคุม DOM โดยตรงโดยไม่มี framework overhead'),
        li('ระบบจัดการ state แบบ reactive ที่เรียบง่าย'),
        li('รองรับ SSR โดยไม่ซับซ้อน'),
        li('Build ได้เร็วด้วย esbuild ที่บูรณาการ'),
        li('ทางเลือกเบาที่มี DX ดีกว่า vanilla JS'),
        li('แอปพลิเคชันที่ต้องการประสิทธิภาพสูง (เกม, แอปเรียลไทม์)'),
        li('Progressive enhancement ของเว็บไซต์ที่มีอยู่'),
        li('โปรเจกต์ที่ต้องการ frontend + backend ใน framework เดียว')
      ),

      h2('สรุป'),
      p('แต่ละ framework มีที่ของตัวเอง React เหมาะกับแอปพลิเคชันขนาดใหญ่และทีมใหญ่ Vue ให้ความสมดุลและ DX ที่ดี Svelte และ Solid ให้ประสิทธิภาพยอดเยี่ยมด้วยแนวทางสมัยใหม่ Qwik เพิ่มประสิทธิภาพการโหลดครั้งแรก Elit 2.0 โดดเด่นเป็นโซลูชันแบบ full-stack เมื่อคุณต้องการเครื่องมือ CLI ครบครัน รองรับ API/WebSocket ในตัว overhead น้อยที่สุด ควบคุมโดยตรง และฟีเจอร์ reactive โดยไม่มีภาระของ frameworks ใหญ่'),
      p('เลือกตามความต้องการของโปรเจกต์ ความเชี่ยวชาญของทีม และความต้องการด้านประสิทธิภาพ')
    )
  }
};
