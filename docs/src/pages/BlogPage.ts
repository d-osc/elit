import {
  div, h1, h2, h3, section, p, a, span, article, time, routerLink
} from 'elit';
import { reactive } from 'elit';
import type { Router } from 'elit';
import { t, currentLang } from '../i18n';

// Blog post type
interface BlogPost {
  id: string;
  title: { en: string; th: string };
  excerpt: { en: string; th: string };
  date: string;
  author: string;
  tags: string[];
}

// Sample blog posts
const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: {
      en: 'Introducing Elit: A Lightweight DOM Library',
      th: 'แนะนำ Elit: ไลบรารี DOM ที่เบาและรวดเร็ว'
    },
    excerpt: {
      en: 'We\'re excited to introduce Elit - a modern, lightweight library (~5KB gzipped) for building reactive web applications with zero dependencies. Unlike traditional frameworks with virtual DOM overhead, Elit provides direct DOM manipulation with reactive state management, making it perfect for performance-critical applications. Built with TypeScript, featuring 100+ element factories, SSR support, and a powerful CreateStyle CSS-in-JS system.',
      th: 'เรารู้สึกตื่นเต้นที่จะแนะนำ Elit - ไลบรารีสมัยใหม่ที่มีน้ำหนักเบา (~5KB gzipped) สำหรับสร้างเว็บแอปพลิเคชันแบบ reactive โดยไม่มี dependencies เลย ต่างจาก frameworks แบบดั้งเดิมที่มี virtual DOM overhead, Elit ให้การจัดการ DOM โดยตรงพร้อมระบบจัดการ state แบบ reactive เหมาะสำหรับแอปพลิเคชันที่ต้องการประสิทธิภาพสูง สร้างด้วย TypeScript มี element factories กว่า 100+ ตัว รองรับ SSR และระบบ CreateStyle CSS-in-JS ที่ทรงพลัง'
    },
    date: '2024-01-15',
    author: 'n-devs',
    tags: ['Release', 'Introduction', 'Announcement']
  },
  {
    id: '2',
    title: {
      en: 'Building Reactive UIs with Elit',
      th: 'การสร้าง UI แบบ Reactive ด้วย Elit'
    },
    excerpt: {
      en: 'Learn how to harness Elit\'s powerful reactive state management system to build dynamic user interfaces. This comprehensive guide covers createState for reactive variables, computed values for derived state, the reactive() helper for automatic UI updates, and advanced patterns like throttle/debounce for performance optimization. Discover how Elit\'s direct DOM approach eliminates re-render overhead while maintaining clean, declarative code. Includes real-world examples of forms, lists, and complex state interactions.',
      th: 'เรียนรู้วิธีใช้ระบบจัดการ state แบบ reactive ที่ทรงพลังของ Elit เพื่อสร้างอินเทอร์เฟซผู้ใช้แบบไดนามิก คู่มือฉบับสมบูรณ์นี้ครอบคลุม createState สำหรับตัวแปร reactive, computed values สำหรับ derived state, reactive() helper สำหรับการอัปเดต UI อัตโนมัติ และรูปแบบขั้นสูงอย่าง throttle/debounce เพื่อเพิ่มประสิทธิภาพ ค้นพบว่าแนวทางการจัดการ DOM โดยตรงของ Elit ช่วยขจัด re-render overhead พร้อมรักษาโค้ดที่สะอาดและ declarative รวมตัวอย่างในโลกจริงของ forms, lists และการโต้ตอบ state ที่ซับซ้อน'
    },
    date: '2024-01-20',
    author: 'n-devs',
    tags: ['Tutorial', 'State Management', 'Reactive']
  },
  {
    id: '3',
    title: {
      en: 'Performance Optimization Tips for Elit',
      th: 'เทคนิคการเพิ่มประสิทธิภาพสำหรับ Elit'
    },
    excerpt: {
      en: 'Maximize your Elit application\'s performance with these proven optimization techniques. Learn about batchRender for grouping DOM updates, renderChunked for handling large datasets without blocking the UI, createVirtualList for efficient scrolling through thousands of items, and the lazy() utility for deferred component rendering. We\'ll also cover CreateStyle optimization, tree-shaking strategies to minimize bundle size, and profiling tools to identify bottlenecks. Transform your app from good to blazing fast.',
      th: 'เพิ่มประสิทธิภาพแอปพลิเคชัน Elit ของคุณให้สูงสุดด้วยเทคนิคที่พิสูจน์แล้วเหล่านี้ เรียนรู้เกี่ยวกับ batchRender สำหรับการจัดกลุ่มการอัปเดต DOM, renderChunked สำหรับจัดการชุดข้อมูลขนาดใหญ่โดยไม่บล็อก UI, createVirtualList สำหรับการเลื่อนดูรายการหลายพันรายการอย่างมีประสิทธิภาพ และ lazy() utility สำหรับการ render component แบบเลื่อนเวลา เราจะครอบคลุมการเพิ่มประสิทธิภาพ CreateStyle, กลยุทธ์ tree-shaking เพื่อลดขนาด bundle และเครื่องมือ profiling เพื่อระบุจุดคอขวด เปลี่ยนแอปของคุณจากดีไปเป็นเร็วสุดๆ'
    },
    date: '2024-02-01',
    author: 'n-devs',
    tags: ['Performance', 'Optimization', 'Best Practices']
  },
  {
    id: '4',
    title: {
      en: 'Elit vs React vs Other Frameworks: A Comprehensive Comparison',
      th: 'เปรียบเทียบ Elit กับ React และ Frameworks อื่นๆ อย่างครบถ้วน'
    },
    excerpt: {
      en: 'Choosing the right framework is crucial for your project. This comprehensive comparison analyzes Elit alongside React, Preact, Lit, Vue, Svelte, Solid, Qwik, and vanilla JavaScript. We examine each framework\'s strengths and weaknesses, including bundle sizes, performance characteristics, learning curves, ecosystem maturity, and ideal use cases. Discover when Elit\'s lightweight direct DOM approach shines, and how it compares to React\'s massive ecosystem, Svelte\'s compile-time approach, or Solid\'s fine-grained reactivity.',
      th: 'การเลือก framework ที่เหมาะสมเป็นสิ่งสำคัญสำหรับโปรเจกต์ของคุณ การเปรียบเทียบอย่างครบถ้วนนี้วิเคราะห์ Elit ควบคู่กับ React, Preact, Lit, Vue, Svelte, Solid, Qwik และ vanilla JavaScript เราตรวจสอบจุดแข็งและจุดอ่อนของแต่ละ framework รวมถึงขนาด bundle, ลักษณะประสิทธิภาพ, ความยากง่ายในการเรียนรู้, ความเป็นผู้ใหญ่ของ ecosystem และกรณีการใช้งานที่เหมาะสม ค้นพบว่าเมื่อไหร่ที่แนวทางการจัดการ DOM โดยตรงที่มีน้ำหนักเบาของ Elit โดดเด่น และเปรียบเทียบกับ ecosystem ขนาดใหญ่ของ React, แนวทาง compile-time ของ Svelte หรือ fine-grained reactivity ของ Solid'
    },
    date: '2024-02-10',
    author: 'n-devs',
    tags: ['Comparison', 'Frameworks', 'Performance', 'React', 'Vue', 'Svelte']
  },
  {
    id: '5',
    title: {
      en: 'Security Best Practices with Elit',
      th: 'แนวทางปฏิบัติด้านความปลอดภัยกับ Elit'
    },
    excerpt: {
      en: 'Building secure web applications is critical. Learn how Elit helps you create secure applications through automatic text escaping, no innerHTML usage, and zero dependencies. This comprehensive guide covers XSS prevention, CSRF protection, input validation, secure state management, Content Security Policy, and more. Discover how Elit\'s design philosophy prioritizes security and what best practices you should follow to protect your users and data from common web vulnerabilities.',
      th: 'การสร้างเว็บแอปพลิเคชันที่ปลอดภัยเป็นสิ่งสำคัญ เรียนรู้ว่า Elit ช่วยคุณสร้างแอปพลิเคชันที่ปลอดภัยผ่านการ escape ข้อความอัตโนมัติ ไม่ใช้ innerHTML และไม่มี dependencies คู่มือฉบับสมบูรณ์นี้ครอบคลุมการป้องกัน XSS, การป้องกัน CSRF, การตรวจสอบ input, การจัดการ state อย่างปลอดภัย, Content Security Policy และอื่นๆ ค้นพบว่าปรัชญาการออกแบบของ Elit ให้ความสำคัญกับความปลอดภัยอย่างไร และแนวทางปฏิบัติที่ดีที่คุณควรทำตามเพื่อปกป้องผู้ใช้และข้อมูลของคุณจากช่องโหว่ทั่วไป'
    },
    date: '2024-02-15',
    author: 'n-devs',
    tags: ['Security', 'Best Practices', 'XSS', 'CSRF']
  },
  {
    id: '6',
    title: {
      en: 'Getting Started with Elit and Vite',
      th: 'เริ่มต้นใช้งาน Elit กับ Vite'
    },
    excerpt: {
      en: 'Vite is a modern build tool that provides lightning-fast development experience. Learn how to set up Elit with Vite for an optimal development workflow, including project setup, configuration, HMR, path aliases, environment variables, code splitting, useful plugins, testing with Vitest, and deployment strategies. Discover how the combination of Elit\'s lightweight approach and Vite\'s speed creates an unmatched developer experience.',
      th: 'Vite เป็นเครื่องมือ build ทันสมัยที่ให้ประสบการณ์การพัฒนาที่รวดเร็วเหมือนสายฟ้าแลบ เรียนรู้วิธีตั้งค่า Elit กับ Vite เพื่อเวิร์กโฟลว์การพัฒนาที่เหมาะสม รวมถึงการตั้งค่าโปรเจกต์ การกำหนดค่า HMR, path aliases, environment variables, code splitting, plugins ที่มีประโยชน์ การทดสอบด้วย Vitest และกลยุทธ์การ deploy ค้นพบว่าการผสมผสานระหว่างแนวทางที่เบาของ Elit และความเร็วของ Vite สร้างประสบการณ์นักพัฒนาที่เหนือชั้น'
    },
    date: '2024-02-20',
    author: 'n-devs',
    tags: ['Tutorial', 'Vite', 'Setup', 'Build Tools']
  },
  {
    id: '7',
    title: {
      en: 'Server-Side Rendering with Elit and Express',
      th: 'Server-Side Rendering ด้วย Elit และ Express'
    },
    excerpt: {
      en: 'Learn how to implement Server-Side Rendering (SSR) with Elit and Express for improved SEO, faster initial page loads, and better performance. This comprehensive guide covers everything from basic setup to advanced SSR patterns including hydration, data fetching, SEO metadata, streaming SSR, caching strategies, and deployment. Discover how Elit\'s lightweight architecture makes SSR extremely fast and simple.',
      th: 'เรียนรู้วิธีการทำ Server-Side Rendering (SSR) ด้วย Elit และ Express เพื่อปรับปรุง SEO, โหลดหน้าเว็บเริ่มต้นเร็วขึ้น และประสิทธิภาพที่ดีขึ้น คู่มือฉบับสมบูรณ์นี้ครอบคลุมทุกอย่างตั้งแต่การตั้งค่าพื้นฐานจนถึงรูปแบบ SSR ขั้นสูง รวมถึง hydration, การดึงข้อมูล, SEO metadata, streaming SSR, กลยุทธ์การ caching และการ deploy ค้นพบว่าสถาปัตยกรรมที่เบาของ Elit ทำให้ SSR รวดเร็วและง่ายมาก'
    },
    date: '2024-02-25',
    author: 'n-devs',
    tags: ['Tutorial', 'SSR', 'Express', 'Node.js']
  },
  {
    id: '8',
    title: {
      en: 'Working with renderJson in Elit',
      th: 'การใช้งาน renderJson ใน Elit'
    },
    excerpt: {
      en: 'Learn how to use Elit\'s renderJson utility to serialize VNodes and application state into JSON format. Perfect for SSR hydration, API responses, state persistence, and data transfer. This comprehensive guide covers basic serialization, SSR patterns, component APIs, state persistence, caching strategies, advanced patterns, testing with snapshots, and real-world examples. Master the art of data serialization in Elit.',
      th: 'เรียนรู้วิธีใช้ renderJson utility ของ Elit เพื่อแปลง VNodes และ application state เป็นรูปแบบ JSON เหมาะสำหรับ SSR hydration, API responses, การเก็บ state และการถ่ายโอนข้อมูล คู่มือฉบับสมบูรณ์นี้ครอบคลุม basic serialization, รูปแบบ SSR, component APIs, การเก็บ state, กลยุทธ์การ caching, รูปแบบขั้นสูง, การทดสอบด้วย snapshots และตัวอย่างในโลกจริง เชี่ยวชาญศิลปะของ data serialization ใน Elit'
    },
    date: '2024-03-01',
    author: 'n-devs',
    tags: ['Tutorial', 'API', 'JSON', 'Data Serialization']
  },
  {
    id: '9',
    title: {
      en: 'Working with renderVNode in Elit',
      th: 'การทำงานกับ renderVNode ใน Elit'
    },
    excerpt: {
      en: 'Learn how to use Elit\'s renderVNode utilities to work with VNode JSON structures. Perfect for dynamic UI rendering, component serialization, and bridging between server and client. This comprehensive guide covers VNodeJson vs JsonNode, basic rendering, dynamic component templates, SSR patterns, real-time WebSocket updates, component libraries, caching strategies, and complete dashboard examples. Master VNode JSON serialization in Elit.',
      th: 'เรียนรู้วิธีใช้ renderVNode utilities ของ Elit สำหรับทำงานกับ VNode JSON structures เหมาะสำหรับการ render UI แบบ dynamic, serialization ของ component และเชื่อมต่อระหว่าง server และ client คู่มือฉบับสมบูรณ์นี้ครอบคลุม VNodeJson vs JsonNode, การ render พื้นฐาน, dynamic component templates, รูปแบบ SSR, real-time WebSocket updates, component libraries, กลยุทธ์การ caching และตัวอย่าง dashboard แบบสมบูรณ์ เชี่ยวชาญ VNode JSON serialization ใน Elit'
    },
    date: '2024-03-05',
    author: 'n-devs',
    tags: ['Tutorial', 'API', 'VNode', 'Rendering']
  },
  {
    id: '10',
    title: {
      en: 'Client-Side Routing with Elit Router',
      th: 'การใช้งาน Client-Side Routing ด้วย Elit Router'
    },
    excerpt: {
      en: 'Learn how to implement client-side routing in Elit applications. This comprehensive guide covers basic routing, dynamic parameters (:id), navigation guards (beforeEach, beforeEnter), programmatic navigation, route transitions, query parameters, hash mode vs history mode, and advanced patterns like lazy loading and breadcrumb navigation. Discover how Elit Router provides a powerful yet lightweight solution for building SPAs with zero dependencies.',
      th: 'เรียนรู้วิธีการทำ client-side routing ในแอปพลิเคชัน Elit คู่มือฉบับสมบูรณ์นี้ครอบคลุมการ routing พื้นฐาน, dynamic parameters (:id), navigation guards (beforeEach, beforeEnter), programmatic navigation, route transitions, query parameters, hash mode vs history mode และรูปแบบขั้นสูงอย่าง lazy loading และ breadcrumb navigation ค้นพบว่า Elit Router ให้โซลูชันที่ทรงพลังแต่มีน้ำหนักเบาสำหรับสร้าง SPAs โดยไม่มี dependencies'
    },
    date: '2024-03-10',
    author: 'n-devs',
    tags: ['Tutorial', 'Router', 'SPA', 'Navigation']
  },
  {
    id: '11',
    title: {
      en: 'CSS-in-JS with Elit CreateStyle',
      th: 'CSS-in-JS ด้วย Elit CreateStyle'
    },
    excerpt: {
      en: 'Master Elit\'s powerful CreateStyle CSS-in-JS system. This comprehensive guide covers CSS variables, all selector types, pseudo-classes, media queries, keyframe animations, font-faces, container queries, supports queries, cascade layers, and advanced patterns like theme systems and utility class generation. Discover how CreateStyle makes CSS-in-JS simple, type-safe, and zero-dependency.',
      th: 'เชี่ยวชาญระบบ CSS-in-JS CreateStyle ของ Elit คู่มือฉบับสมบูรณ์นี้ครอบคลุม CSS variables, selector ทุกประเภท, pseudo-classes, media queries, keyframe animations, font-faces, container queries, supports queries, cascade layers และรูปแบบขั้นสูงอย่าง theme systems และการสร้าง utility classes ค้นพบว่า CreateStyle ทำให้ CSS-in-JS เรียบง่าย type-safe และไม่มี dependency'
    },
    date: '2024-03-15',
    author: 'n-devs',
    tags: ['Tutorial', 'CSS', 'Styling', 'CreateStyle']
  },
  {
    id: '12',
    title: {
      en: 'State Management in Elit',
      th: 'การจัดการ State ใน Elit'
    },
    excerpt: {
      en: 'Master Elit\'s powerful state management system. This comprehensive guide covers createState for reactive variables, computed values for derived state, effect for side effects, reactive helper for automatic UI updates, performance optimizations (batchRender, renderChunked, createVirtualList), lazy loading, throttle/debounce, and advanced patterns like global stores, state persistence, and undo/redo. Includes a complete Todo application example demonstrating all concepts.',
      th: 'เชี่ยวชาญระบบจัดการ state ที่ทรงพลังของ Elit คู่มือฉบับสมบูรณ์นี้ครอบคลุม createState สำหรับตัวแปร reactive, computed values สำหรับ derived state, effect สำหรับ side effects, reactive helper สำหรับการอัปเดต UI อัตโนมัติ, การเพิ่มประสิทธิภาพ (batchRender, renderChunked, createVirtualList), lazy loading, throttle/debounce และรูปแบบขั้นสูงอย่าง global stores, การเก็บ state และ undo/redo รวมตัวอย่างแอปพลิเคชัน Todo แบบสมบูรณ์ที่แสดงทุกแนวคิด'
    },
    date: '2024-03-20',
    author: 'n-devs',
    tags: ['Tutorial', 'State Management', 'Reactive', 'Performance']
  },
  {
    id: '13',
    title: {
      en: 'Reactive Rendering with Elit',
      th: 'การ Render แบบ Reactive ด้วย Elit'
    },
    excerpt: {
      en: 'Master Elit\'s reactive rendering helpers for building dynamic UIs. This comprehensive guide covers the reactive() helper for auto-updating components, reactiveAs() for custom wrapper tags, text() for simple text binding, bindValue() and bindChecked() for form inputs, performance optimizations with requestAnimationFrame, handling null/false values with placeholders, and advanced patterns like nested reactive components and live search. Build responsive UIs that update automatically.',
      th: 'เชี่ยวชาญ reactive rendering helpers ของ Elit สำหรับสร้าง dynamic UIs คู่มือฉบับสมบูรณ์นี้ครอบคลุม reactive() helper สำหรับ auto-updating components, reactiveAs() สำหรับ custom wrapper tags, text() สำหรับ text binding แบบง่าย, bindValue() และ bindChecked() สำหรับ form inputs, การเพิ่มประสิทธิภาพด้วย requestAnimationFrame, การจัดการค่า null/false ด้วย placeholders และรูปแบบขั้นสูงอย่าง nested reactive components และ live search สร้าง UIs ที่ตอบสนองและอัปเดตอัตโนมัติ'
    },
    date: '2024-03-25',
    author: 'n-devs',
    tags: ['Tutorial', 'Reactive', 'Rendering', 'UI']
  },
  {
    id: '14',
    title: {
      en: 'Element Factories in Elit',
      th: 'Element Factories ใน Elit'
    },
    excerpt: {
      en: 'Master Elit\'s element factories for creating DOM elements with a functional API. This comprehensive guide covers 100+ HTML elements, SVG elements (prefixed with svg*), MathML elements (prefixed with math*), props and attributes, event handlers, children handling (arrays, conditionals, nested), component functions, props spreading, and advanced patterns like builders. Includes complete examples from simple elements to complex Todo apps. Build type-safe UIs with zero JSX overhead.',
      th: 'เชี่ยวชาญ element factories ของ Elit สำหรับสร้าง DOM elements ด้วย functional API คู่มือฉบับสมบูรณ์นี้ครอบคลุม HTML elements มากกว่า 100+, SVG elements (prefix ด้วย svg*), MathML elements (prefix ด้วย math*), props และ attributes, event handlers, การจัดการ children (arrays, conditionals, nested), component functions, props spreading และรูปแบบขั้นสูงอย่าง builders รวมตัวอย่างที่สมบูรณ์ตั้งแต่ elements แบบง่ายไปจนถึงแอป Todo ที่ซับซ้อน สร้าง type-safe UIs โดยไม่มี JSX overhead'
    },
    date: '2024-03-30',
    author: 'n-devs',
    tags: ['Tutorial', 'Elements', 'API', 'Basics']
  },
  {
    id: '15',
    title: {
      en: 'Working with DomNode in Elit',
      th: 'การทำงานกับ DomNode ใน Elit'
    },
    excerpt: {
      en: 'Master Elit\'s powerful DomNode class for advanced DOM manipulation. This comprehensive guide covers rendering methods (render, batchRender, renderChunked), server-side rendering (renderToString), JSON utilities (jsonToVNode, renderJson, vNodeJsonToVNode), virtual scrolling (createVirtualList) for 100k+ items, lazy loading with code splitting, state management (createState, computed, effect), head management, memory cleanup, and performance optimization techniques. Build high-performance applications with low-level control.',
      th: 'เชี่ยวชาญ DomNode class ที่ทรงพลังของ Elit สำหรับการจัดการ DOM ขั้นสูง คู่มือฉบับสมบูรณ์นี้ครอบคลุมวิธีการ rendering (render, batchRender, renderChunked), server-side rendering (renderToString), JSON utilities (jsonToVNode, renderJson, vNodeJsonToVNode), virtual scrolling (createVirtualList) สำหรับ 100k+ items, lazy loading ด้วย code splitting, state management (createState, computed, effect), head management, memory cleanup และเทคนิคการเพิ่มประสิทธิภาพ สร้างแอปพลิเคชันประสิทธิภาพสูงด้วยการควบคุมระดับต่ำ'
    },
    date: '2024-04-05',
    author: 'n-devs',
    tags: ['Tutorial', 'DomNode', 'API', 'Advanced']
  }
];

// Format date
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Blog post card component
const BlogPostCard = (router: Router, post: BlogPost) =>
  article({ className: 'blog-card' },
    div({ className: 'blog-card-header' },
      reactive(currentLang, () =>
        h2({ className: 'blog-card-title' },
          routerLink(router, { to: `/blog/${post.id}` },
            currentLang.value === 'th' ? post.title.th : post.title.en
          )
        )
      )
    ),
    div({ className: 'blog-card-meta' },
      span({ className: 'blog-card-date' }, formatDate(post.date)),
      span({ className: 'blog-card-separator' }, '•'),
      span({ className: 'blog-card-author' }, post.author)
    ),
    reactive(currentLang, () =>
      p({ className: 'blog-card-excerpt' },
        currentLang.value === 'th' ? post.excerpt.th : post.excerpt.en
      )
    ),
    div({ className: 'blog-card-tags' },
      ...post.tags.map(tag =>
        span({ className: 'blog-tag' }, tag)
      )
    ),
    reactive(currentLang, () =>
      routerLink(router, { to: `/blog/${post.id}`, className: 'blog-card-link' },
        currentLang.value === 'th' ? 'อ่านเพิ่มเติม →' : 'Read more →'
      )
    )
  );

// Main blog page
export const BlogPage = (router: Router) =>
  section({ className: 'container', style: 'padding-top: 6rem;' },
    reactive(currentLang, () =>
      div({ className: 'blog-page' },
        h1({ className: 'section-title' }, currentLang.value === 'th' ? 'บล็อก' : 'Blog'),
        p({ className: 'section-subtitle', style: 'margin-bottom: 3rem;' },
          currentLang.value === 'th'
            ? 'บทความ แนวคิด และอัปเดตเกี่ยวกับ Elit'
            : 'Articles, insights, and updates about Elit'
        ),
        div({ className: 'blog-grid' },
          ...blogPosts.map(post => BlogPostCard(router, post))
        )
      )
    )
  );
