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
    'hero.subtitle': 'Full-stack TypeScript framework for building reactive web applications. Complete with dev server, HMR, routing, SSR, and REST API - all in one lightweight package.',
    'hero.getStarted': 'Get Started',
    'hero.viewGithub': 'View on GitHub',

    // Stats
    'stats.size': 'Bundle Size',
    'stats.deps': 'Dependencies',
    'stats.version': 'Version',
    'stats.typescript': 'TypeScript',
    'stats.hmr': 'HMR Speed',
    'stats.framework': 'Framework Type',

    // Features
    'features.title': 'Core Features',
    'features.lightweight.title': 'Lightweight & Fast',
    'features.lightweight.desc': '~10KB gzipped with zero dependencies. Direct DOM manipulation for maximum performance.',
    'features.fast.title': 'Dev Server & HMR',
    'features.fast.desc': 'Built-in development server with Hot Module Replacement for instant updates.',
    'features.reactive.title': 'Reactive State',
    'features.reactive.desc': 'Powerful reactive state management with computed values and automatic UI updates.',
    'features.styling.title': 'Full-Stack Ready',
    'features.styling.desc': 'REST API router, middleware stack, WebSocket support, and SSR out of the box.',
    'features.ssr.title': 'Build Tool',
    'features.ssr.desc': 'Integrated build system with esbuild for lightning-fast production builds.',
    'features.routing.title': 'Router & CLI',
    'features.routing.desc': 'Client-side routing, CLI tools, and multi-client dev server support.',

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
    'api.router': 'Client Router',
    'api.router.desc': 'createRouter, routerLink',
    'api.performance': 'Performance',
    'api.performance.desc': 'Virtual list, chunked render',
    'api.devServer': 'Dev Server',
    'api.devServer.desc': 'HMR, multi-client, middleware',
    'api.build': 'Build Tool',
    'api.build.desc': 'esbuild integration, production',
    'api.restApi': 'REST API',
    'api.restApi.desc': 'Server router, middleware stack',

    // Footer
    'footer.license': 'MIT License',
    'footer.builtWith': 'Built with Elit',

    // Docs Page
    'docs.title': 'Documentation',
    'docs.installation': 'Installation',
    'docs.installNpm': 'Install Elit via npm:',
    'docs.installCdn': 'Or use via CDN:',
    'docs.devServer': 'Dev Server',
    'docs.devServer.desc': 'Start the development server with Hot Module Replacement:',
    'docs.devServer.features': 'Dev server features include HMR, multi-client support, middleware, and WebSocket support.',
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

    // Elit vs Next.js Comparison
    'vsNextjs.title': 'Elit vs Next.js',
    'vsNextjs.subtitle': 'Full-stack frameworks comparison - Choose the right tool for your project',
    'vsNextjs.tableTitle': 'Feature Comparison',
    'vsNextjs.feature': 'Feature',
    'vsNextjs.bundleSize': 'Bundle Size',
    'vsNextjs.dependencies': 'Dependencies',
    'vsNextjs.devServer': 'Dev Server',
    'vsNextjs.devServerElit': 'Built-in HMR + Multi-client',
    'vsNextjs.devServerNext': 'Fast Refresh',
    'vsNextjs.apiRoutes': 'API Routes',
    'vsNextjs.apiRoutesElit': 'Config-based router',
    'vsNextjs.apiRoutesNext': 'File-based routing',
    'vsNextjs.routing': 'Client Routing',
    'vsNextjs.routingElit': 'Code-based router',
    'vsNextjs.routingNext': 'File-based routing',
    'vsNextjs.state': 'State Management',
    'vsNextjs.stateElit': 'Built-in reactive state',
    'vsNextjs.stateNext': 'React hooks/context',
    'vsNextjs.ssr': 'SSR Support',
    'vsNextjs.ssrElit': 'Built-in',
    'vsNextjs.ssrNext': 'Built-in',
    'vsNextjs.build': 'Build Tool',
    'vsNextjs.buildElit': 'esbuild (fast)',
    'vsNextjs.buildNext': 'Webpack/Turbopack',
    'vsNextjs.learning': 'Learning Curve',
    'vsNextjs.learningElit': 'Minimal - TypeScript + DOM',
    'vsNextjs.learningNext': 'Moderate - React + Next patterns',
    'vsNextjs.typescript': 'TypeScript',
    'vsNextjs.typescriptElit': 'Native',
    'vsNextjs.typescriptNext': 'Full support',
    'vsNextjs.summaryTitle': 'When to Choose?',
    'vsNextjs.useElitTitle': 'Choose Elit when:',
    'vsNextjs.useElitDesc': 'You need a lightweight solution, want full control, prefer minimal dependencies, or building performance-critical applications with simple architecture.',
    'vsNextjs.useNextTitle': 'Choose Next.js when:',
    'vsNextjs.useNextDesc': 'You need a mature ecosystem, large team collaboration, extensive plugin support, or building complex enterprise applications with React.',

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
    'hero.subtitle': 'Full-stack TypeScript framework สำหรับสร้าง reactive web applications พร้อม dev server, HMR, routing, SSR และ REST API ในแพ็คเกจเดียวที่มีน้ำหนักเบา',
    'hero.getStarted': 'เริ่มต้นใช้งาน',
    'hero.viewGithub': 'ดูบน GitHub',

    // Stats
    'stats.size': 'ขนาดไฟล์',
    'stats.deps': 'Dependencies',
    'stats.version': 'เวอร์ชั่น',
    'stats.typescript': 'TypeScript',
    'stats.hmr': 'ความเร็ว HMR',
    'stats.framework': 'ประเภท Framework',

    // Features
    'features.title': 'ฟีเจอร์หลัก',
    'features.lightweight.title': 'เบาและเร็ว',
    'features.lightweight.desc': '~10KB gzipped ไม่มี dependencies จัดการ DOM โดยตรงเพื่อประสิทธิภาพสูงสุด',
    'features.fast.title': 'Dev Server & HMR',
    'features.fast.desc': 'Dev server ในตัวพร้อม Hot Module Replacement สำหรับอัพเดทแบบทันที',
    'features.reactive.title': 'Reactive State',
    'features.reactive.desc': 'ระบบจัดการ state ที่ทรงพลังพร้อม computed values และอัพเดท UI อัตโนมัติ',
    'features.styling.title': 'Full-Stack พร้อมใช้',
    'features.styling.desc': 'REST API router, middleware stack, WebSocket support และ SSR ในตัว',
    'features.ssr.title': 'Build Tool',
    'features.ssr.desc': 'ระบบ build ที่ผสานรวมกับ esbuild สำหรับ production builds ที่รวดเร็ว',
    'features.routing.title': 'Router & CLI',
    'features.routing.desc': 'Client-side routing, CLI tools และรองรับ multi-client dev server',

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
    'api.router': 'Client Router',
    'api.router.desc': 'createRouter, routerLink',
    'api.performance': 'Performance',
    'api.performance.desc': 'Virtual list, chunked render',
    'api.devServer': 'Dev Server',
    'api.devServer.desc': 'HMR, multi-client, middleware',
    'api.build': 'Build Tool',
    'api.build.desc': 'esbuild integration, production',
    'api.restApi': 'REST API',
    'api.restApi.desc': 'Server router, middleware stack',

    // Footer
    'footer.license': 'MIT License',
    'footer.builtWith': 'สร้างด้วย Elit',

    // Docs Page
    'docs.title': 'เอกสาร',
    'docs.installation': 'การติดตั้ง',
    'docs.installNpm': 'ติดตั้ง Elit ผ่าน npm:',
    'docs.installCdn': 'หรือใช้ผ่าน CDN:',
    'docs.devServer': 'Dev Server',
    'docs.devServer.desc': 'เริ่ม development server พร้อม Hot Module Replacement:',
    'docs.devServer.features': 'Dev server มาพร้อม HMR, multi-client support, middleware และ WebSocket support',
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

    // Elit vs Next.js Comparison
    'vsNextjs.title': 'Elit เทียบกับ Next.js',
    'vsNextjs.subtitle': 'เปรียบเทียบ Full-stack frameworks - เลือก tool ที่เหมาะกับโปรเจ็กต์ของคุณ',
    'vsNextjs.tableTitle': 'เปรียบเทียบฟีเจอร์',
    'vsNextjs.feature': 'ฟีเจอร์',
    'vsNextjs.bundleSize': 'ขนาด Bundle',
    'vsNextjs.dependencies': 'Dependencies',
    'vsNextjs.devServer': 'Dev Server',
    'vsNextjs.devServerElit': 'HMR + Multi-client ในตัว',
    'vsNextjs.devServerNext': 'Fast Refresh',
    'vsNextjs.apiRoutes': 'API Routes',
    'vsNextjs.apiRoutesElit': 'Config-based router',
    'vsNextjs.apiRoutesNext': 'File-based routing',
    'vsNextjs.routing': 'Client Routing',
    'vsNextjs.routingElit': 'Code-based router',
    'vsNextjs.routingNext': 'File-based routing',
    'vsNextjs.state': 'การจัดการ State',
    'vsNextjs.stateElit': 'Reactive state ในตัว',
    'vsNextjs.stateNext': 'React hooks/context',
    'vsNextjs.ssr': 'รองรับ SSR',
    'vsNextjs.ssrElit': 'ในตัว',
    'vsNextjs.ssrNext': 'ในตัว',
    'vsNextjs.build': 'Build Tool',
    'vsNextjs.buildElit': 'esbuild (เร็ว)',
    'vsNextjs.buildNext': 'Webpack/Turbopack',
    'vsNextjs.learning': 'ความยากในการเรียนรู้',
    'vsNextjs.learningElit': 'น้อย - TypeScript + DOM',
    'vsNextjs.learningNext': 'ปานกลาง - React + Next patterns',
    'vsNextjs.typescript': 'TypeScript',
    'vsNextjs.typescriptElit': 'รองรับเต็มรูปแบบ',
    'vsNextjs.typescriptNext': 'รองรับเต็มรูปแบบ',
    'vsNextjs.summaryTitle': 'เลือกตอนไหน?',
    'vsNextjs.useElitTitle': 'เลือก Elit เมื่อ:',
    'vsNextjs.useElitDesc': 'ต้องการโซลูชันที่เบา ต้องการควบคุมเต็มที่ ชอบ dependencies น้อย หรือสร้างแอพที่เน้นประสิทธิภาพด้วยสถาปัตยกรรมที่เรียบง่าย',
    'vsNextjs.useNextTitle': 'เลือก Next.js เมื่อ:',
    'vsNextjs.useNextDesc': 'ต้องการ ecosystem ที่เป็นผู้ใหญ่ ทำงานเป็นทีมใหญ่ ต้องการ plugin มากมาย หรือสร้างแอพ enterprise ที่ซับซ้อนด้วย React',

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
