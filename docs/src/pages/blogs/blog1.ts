import { div, h2, p, ul, li, pre, code } from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog1: BlogPostDetail = {
  id: '1',
  title: {
    en: 'Introducing Elit: A Lightweight DOM Library',
    th: 'แนะนำ Elit: ไลบรารี DOM ที่เบาและรวดเร็ว'
  },
  date: '2024-01-15',
  author: 'n-devs',
  tags: ['Release', 'Introduction', 'Announcement'],
  content: {
    en: div(
      p('We\'re excited to introduce Elit - a modern, lightweight library (~5KB gzipped) for building reactive web applications with zero dependencies.'),

      h2('Why Elit?'),
      p('Unlike traditional frameworks with virtual DOM overhead, Elit provides direct DOM manipulation with reactive state management, making it perfect for performance-critical applications.'),

      h2('Key Features'),
      ul(
        li('Tiny bundle size: ~5KB gzipped'),
        li('Zero dependencies'),
        li('100+ element factories for HTML, SVG, and MathML'),
        li('Built-in reactive state management'),
        li('SSR support out of the box'),
        li('Powerful CreateStyle CSS-in-JS system'),
        li('TypeScript-first with full type safety')
      ),

      h2('Quick Example'),
      pre(code(...codeBlock(`import { div, button, createState, reactive, dom } from 'elit';

const count = createState(0);

const app = div(
  reactive(count, value =>
    div(
      button({ onclick: () => count.value-- }, '-'),
      span(\` \${value} \`),
      button({ onclick: () => count.value++ }, '+')
    )
  )
);

dom.render('#app', app);`))),

      h2('Get Started'),
      p('Install Elit via npm:'),
      pre(code('npm install elit')),
      p('Check out the documentation to learn more about building reactive applications with Elit.')
    ),
    th: div(
      p('เรารู้สึกตื่นเต้นที่จะแนะนำ Elit - ไลบรารีสมัยใหม่ที่มีน้ำหนักเบา (~5KB gzipped) สำหรับสร้างเว็บแอปพลิเคชันแบบ reactive โดยไม่มี dependencies เลย'),

      h2('ทำไมต้อง Elit?'),
      p('ต่างจาก frameworks แบบดั้งเดิมที่มี virtual DOM overhead, Elit ให้การจัดการ DOM โดยตรงพร้อมระบบจัดการ state แบบ reactive เหมาะสำหรับแอปพลิเคชันที่ต้องการประสิทธิภาพสูง'),

      h2('คุณสมบัติหลัก'),
      ul(
        li('ขนาดเล็ก: ~5KB gzipped'),
        li('ไม่มี dependencies'),
        li('มี element factories กว่า 100+ ตัวสำหรับ HTML, SVG และ MathML'),
        li('ระบบจัดการ state แบบ reactive ในตัว'),
        li('รองรับ SSR'),
        li('ระบบ CreateStyle CSS-in-JS ที่ทรงพลัง'),
        li('สร้างด้วย TypeScript พร้อม type safety เต็มรูปแบบ')
      ),

      h2('ตัวอย่างง่ายๆ'),
      pre(code(...codeBlock(`import { div, button, createState, reactive, dom } from 'elit';

const count = createState(0);

const app = div(
  reactive(count, value =>
    div(
      button({ onclick: () => count.value-- }, '-'),
      span(\` \${value} \`),
      button({ onclick: () => count.value++ }, '+')
    )
  )
);

dom.render('#app', app);`))),

      h2('เริ่มต้นใช้งาน'),
      p('ติดตั้ง Elit ผ่าน npm:'),
      pre(code('npm install elit')),
      p('ดูเอกสารเพื่อเรียนรู้เพิ่มเติมเกี่ยวกับการสร้างแอปพลิเคชันแบบ reactive ด้วย Elit')
    )
  }
};
