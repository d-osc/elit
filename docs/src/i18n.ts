import { createState } from 'elit';

// Supported languages
export type Lang = 'en' | 'th';

// Current language state
export const currentLang = createState<Lang>('en');

// Translations
const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Header
    'nav.home': 'Home',
    'nav.examples': 'Examples',
    'nav.docs': 'Docs',
    'nav.api': 'API',
    'nav.blog': 'Blog',

    // Hero
    'hero.title': 'Elit',
    'hero.subtitle': 'Optimized lightweight library for creating DOM elements with reactive state. No virtual DOM diffing, just fast direct DOM manipulation.',
    'hero.getStarted': 'Get Started',
    'hero.viewGithub': 'View on GitHub',

    // Stats
    'stats.size': 'Gzipped Size',
    'stats.deps': 'Dependencies',
    'stats.elements': 'Element Factories',
    'stats.tutorials': 'Tutorials',
    'stats.typescript': 'TypeScript',

    // Features
    'features.title': 'Features',
    'features.lightweight.title': 'Lightweight',
    'features.lightweight.desc': 'Tiny bundle size with zero dependencies. Perfect for performance-critical applications.',
    'features.fast.title': 'Fast',
    'features.fast.desc': 'Direct DOM manipulation without virtual DOM overhead. Optimized for speed.',
    'features.reactive.title': 'Reactive',
    'features.reactive.desc': 'Built-in reactive state management with automatic UI updates.',
    'features.styling.title': 'CreateStyle',
    'features.styling.desc': 'Programmatic CSS generation with variables, media queries, and more.',
    'features.ssr.title': 'SSR Support',
    'features.ssr.desc': 'Server-side rendering out of the box with renderToString.',
    'features.routing.title': 'Routing',
    'features.routing.desc': 'Client-side router with history and hash mode support.',

    // Quick Start
    'quickstart.title': 'Quick Start',
    'quickstart.install': 'Install',
    'quickstart.import': 'Import',
    'quickstart.create': 'Create',
    'quickstart.render': 'Render',
    'quickstart.fullExample': 'Full Example',
    'quickstart.readDocs': 'Read Full Documentation',

    // Why Elit
    'why.title': 'Why Elit?',
    'why.subtitle': 'A modern approach to building user interfaces',
    'why.directDom.title': 'Direct DOM Updates',
    'why.directDom.desc': 'No virtual DOM diffing overhead. Changes go straight to the DOM for maximum performance.',
    'why.zeroDeps.title': 'Zero Dependencies',
    'why.zeroDeps.desc': 'Self-contained library with no external dependencies. What you see is what you get.',
    'why.typescript.title': 'TypeScript First',
    'why.typescript.desc': 'Written in TypeScript with full type definitions. Enjoy autocomplete and type safety.',
    'why.treeShake.title': 'Tree-Shakeable',
    'why.treeShake.desc': 'Import only what you need. Unused code is automatically removed during bundling.',

    // Code Comparison
    'comparison.title': 'Clean Syntax',
    'comparison.subtitle': 'Write less code, achieve more',

    // API Overview
    'api.title': 'Comprehensive API',
    'api.subtitle': 'Everything you need to build modern web apps',
    'api.viewFull': 'View Full API Reference',
    'api.elements': 'Elements',
    'api.elements.desc': 'HTML, SVG, MathML factories',
    'api.state': 'State',
    'api.state.desc': 'createState, computed, effect',
    'api.reactive': 'Reactive',
    'api.reactive.desc': 'reactive, text, bindValue',
    'api.styling': 'Styling',
    'api.styling.desc': 'CreateStyle CSS-in-JS',
    'api.router': 'Router',
    'api.router.desc': 'createRouter, routerLink',
    'api.performance': 'Performance',
    'api.performance.desc': 'Virtual list, chunked render',

    // Footer
    'footer.license': 'MIT License',
    'footer.builtWith': 'Built with Elit',

    // Docs Page
    'docs.title': 'Documentation',
    'docs.installation': 'Installation',
    'docs.installNpm': 'Install Elit via npm:',
    'docs.installCdn': 'Or use via CDN:',
    'docs.elements': 'Element Factories',
    'docs.elements.desc': 'Create virtual DOM nodes using element factory functions:',
    'docs.elements.available': 'All standard HTML, SVG, and MathML elements are available.',
    'docs.state': 'State Management',
    'docs.state.desc': 'Create reactive state with createState:',
    'docs.stateOptions': 'State Options',
    'docs.reactive': 'Reactive Rendering',
    'docs.reactive.desc': 'Use reactive() to create elements that update automatically:',
    'docs.createstyle': 'CreateStyle - CSS Generation',
    'docs.createstyle.desc': 'Programmatic CSS generation with full TypeScript support:',
    'docs.ssr': 'Server-Side Rendering',
    'docs.ssr.desc': 'Render to HTML string for server-side rendering:',
    'docs.routing': 'Routing',
    'docs.routing.desc': 'Built-in client-side router:',
    'docs.performance': 'Performance Utilities',
    'docs.performance.desc': 'Utilities for handling large datasets:',

    // Examples Page
    'examples.title': 'Examples',
    'examples.livePreview': 'Live Preview',
    'examples.apiExamples': 'API Examples',
    'examples.realWorld': 'Real-world Examples',

    // API Page
    'apiPage.title': 'API Reference',
    'apiPage.toc': 'Table of Contents',
    'apiPage.details': 'Details',
    'apiPage.parameters': 'Parameters',
    'apiPage.returns': 'Returns',
    'apiPage.example': 'Example',

    // Featured Blogs
    'blogs.title': 'Latest Tutorials',
    'blogs.subtitle': 'Learn Elit with step-by-step guides and real-world examples',
    'blogs.viewAll': 'View All Tutorials',
    'blogs.readMore': 'Read More',

    // Language
    'lang.switch': 'ไทย'
  },

  th: {
    // Header
    'nav.home': 'หน้าแรก',
    'nav.examples': 'ตัวอย่าง',
    'nav.docs': 'เอกสาร',
    'nav.api': 'API',
    'nav.blog': 'บล็อก',

    // Hero
    'hero.title': 'Elit',
    'hero.subtitle': 'ไลบรารีน้ำหนักเบาที่ปรับแต่งมาสำหรับสร้าง DOM elements พร้อม reactive state ไม่มี virtual DOM diffing แค่จัดการ DOM โดยตรงที่รวดเร็ว',
    'hero.getStarted': 'เริ่มต้นใช้งาน',
    'hero.viewGithub': 'ดูบน GitHub',

    // Stats
    'stats.size': 'ขนาด Gzipped',
    'stats.deps': 'Dependencies',
    'stats.elements': 'Element Factories',
    'stats.tutorials': 'บทความสอน',
    'stats.typescript': 'TypeScript',

    // Features
    'features.title': 'คุณสมบัติ',
    'features.lightweight.title': 'น้ำหนักเบา',
    'features.lightweight.desc': 'ขนาด bundle เล็กมากโดยไม่มี dependencies เหมาะสำหรับแอปที่ต้องการประสิทธิภาพสูง',
    'features.fast.title': 'เร็ว',
    'features.fast.desc': 'จัดการ DOM โดยตรงโดยไม่มี overhead ของ virtual DOM ปรับแต่งเพื่อความเร็ว',
    'features.reactive.title': 'Reactive',
    'features.reactive.desc': 'ระบบจัดการ state แบบ reactive ในตัว พร้อมอัพเดท UI อัตโนมัติ',
    'features.styling.title': 'CreateStyle',
    'features.styling.desc': 'สร้าง CSS แบบ programmatic พร้อม variables, media queries และอื่นๆ',
    'features.ssr.title': 'รองรับ SSR',
    'features.ssr.desc': 'Server-side rendering พร้อมใช้งานด้วย renderToString',
    'features.routing.title': 'Routing',
    'features.routing.desc': 'Client-side router รองรับทั้ง history และ hash mode',

    // Quick Start
    'quickstart.title': 'เริ่มต้นอย่างรวดเร็ว',
    'quickstart.install': 'ติดตั้ง',
    'quickstart.import': 'นำเข้า',
    'quickstart.create': 'สร้าง',
    'quickstart.render': 'แสดงผล',
    'quickstart.fullExample': 'ตัวอย่างเต็ม',
    'quickstart.readDocs': 'อ่านเอกสารฉบับเต็ม',

    // Why Elit
    'why.title': 'ทำไมต้อง Elit?',
    'why.subtitle': 'แนวทางสมัยใหม่ในการสร้าง user interfaces',
    'why.directDom.title': 'อัพเดท DOM โดยตรง',
    'why.directDom.desc': 'ไม่มี overhead จาก virtual DOM diffing การเปลี่ยนแปลงไปที่ DOM โดยตรงเพื่อประสิทธิภาพสูงสุด',
    'why.zeroDeps.title': 'ไม่มี Dependencies',
    'why.zeroDeps.desc': 'ไลบรารีที่สมบูรณ์ในตัวเองโดยไม่พึ่งพา dependencies ภายนอก สิ่งที่เห็นคือสิ่งที่ได้',
    'why.typescript.title': 'TypeScript First',
    'why.typescript.desc': 'เขียนด้วย TypeScript พร้อม type definitions ครบถ้วน เพลิดเพลินกับ autocomplete และ type safety',
    'why.treeShake.title': 'Tree-Shakeable',
    'why.treeShake.desc': 'นำเข้าเฉพาะสิ่งที่ต้องการ โค้ดที่ไม่ใช้จะถูกลบออกอัตโนมัติเมื่อ bundle',

    // Code Comparison
    'comparison.title': 'Syntax ที่สะอาด',
    'comparison.subtitle': 'เขียนโค้ดน้อยลง ทำได้มากขึ้น',

    // API Overview
    'api.title': 'API ที่ครอบคลุม',
    'api.subtitle': 'ทุกสิ่งที่ต้องการสำหรับสร้าง web apps สมัยใหม่',
    'api.viewFull': 'ดู API Reference ฉบับเต็ม',
    'api.elements': 'Elements',
    'api.elements.desc': 'HTML, SVG, MathML factories',
    'api.state': 'State',
    'api.state.desc': 'createState, computed, effect',
    'api.reactive': 'Reactive',
    'api.reactive.desc': 'reactive, text, bindValue',
    'api.styling': 'Styling',
    'api.styling.desc': 'CreateStyle CSS-in-JS',
    'api.router': 'Router',
    'api.router.desc': 'createRouter, routerLink',
    'api.performance': 'Performance',
    'api.performance.desc': 'Virtual list, chunked render',

    // Footer
    'footer.license': 'MIT License',
    'footer.builtWith': 'สร้างด้วย Elit',

    // Docs Page
    'docs.title': 'เอกสาร',
    'docs.installation': 'การติดตั้ง',
    'docs.installNpm': 'ติดตั้ง Elit ผ่าน npm:',
    'docs.installCdn': 'หรือใช้ผ่าน CDN:',
    'docs.elements': 'Element Factories',
    'docs.elements.desc': 'สร้าง virtual DOM nodes ด้วย element factory functions:',
    'docs.elements.available': 'รองรับ HTML, SVG และ MathML elements มาตรฐานทั้งหมด',
    'docs.state': 'การจัดการ State',
    'docs.state.desc': 'สร้าง reactive state ด้วย createState:',
    'docs.stateOptions': 'State Options',
    'docs.reactive': 'Reactive Rendering',
    'docs.reactive.desc': 'ใช้ reactive() เพื่อสร้าง elements ที่อัพเดทอัตโนมัติ:',
    'docs.createstyle': 'CreateStyle - สร้าง CSS',
    'docs.createstyle.desc': 'สร้าง CSS แบบ programmatic พร้อม TypeScript support เต็มรูปแบบ:',
    'docs.ssr': 'Server-Side Rendering',
    'docs.ssr.desc': 'Render เป็น HTML string สำหรับ server-side rendering:',
    'docs.routing': 'Routing',
    'docs.routing.desc': 'Client-side router ในตัว:',
    'docs.performance': 'Performance Utilities',
    'docs.performance.desc': 'เครื่องมือสำหรับจัดการ datasets ขนาดใหญ่:',

    // Examples Page
    'examples.title': 'ตัวอย่าง',
    'examples.livePreview': 'แสดงผลจริง',
    'examples.apiExamples': 'ตัวอย่าง API',
    'examples.realWorld': 'ตัวอย่างการใช้งานจริง',

    // API Page
    'apiPage.title': 'API Reference',
    'apiPage.toc': 'สารบัญ',
    'apiPage.details': 'รายละเอียด',
    'apiPage.parameters': 'พารามิเตอร์',
    'apiPage.returns': 'ค่าที่ return',
    'apiPage.example': 'ตัวอย่าง',

    // Featured Blogs
    'blogs.title': 'บทความล่าสุด',
    'blogs.subtitle': 'เรียนรู้ Elit ด้วยคู่มือทีละขั้นตอนและตัวอย่างการใช้งานจริง',
    'blogs.viewAll': 'ดูบทความทั้งหมด',
    'blogs.readMore': 'อ่านเพิ่มเติม',

    // Language
    'lang.switch': 'EN'
  }
};

// Get translation
export function t(key: string): string {
  const lang = currentLang.value;
  return translations[lang][key] || translations['en'][key] || key;
}

// Switch language
export function switchLang() {
  currentLang.value = currentLang.value === 'en' ? 'th' : 'en';
}

// Set specific language
export function setLang(lang: Lang) {
  currentLang.value = lang;
}
