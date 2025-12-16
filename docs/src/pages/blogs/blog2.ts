import { div, h2, p, ul, li, pre, code } from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog2: BlogPostDetail = {
  id: '2',
  title: {
    en: 'Building Reactive UIs with Elit',
    th: 'การสร้าง UI แบบ Reactive ด้วย Elit'
  },
  date: '2024-01-20',
  author: 'n-devs',
  tags: ['Tutorial', 'State Management', 'Reactive'],
  content: {
    en: div(
      p('Learn how to harness Elit\'s powerful reactive state management system to build dynamic user interfaces.'),

      h2('Understanding Reactive State'),
      p('Elit\'s reactive system is based on the createState function, which creates observable values that automatically update the UI when changed:'),
      pre(code(...codeBlock(`const name = createState('John');
const age = createState(25);

// UI updates automatically when state changes
name.value = 'Jane';`))),

      h2('Computed Values'),
      p('Derive values from other reactive states using the computed function:'),
      pre(code(...codeBlock(`const firstName = createState('John');
const lastName = createState('Doe');

const fullName = computed(() => \`\${firstName.value} \${lastName.value}\`);`))),

      h2('Reactive Rendering'),
      p('Use the reactive() helper to create UI elements that automatically update:'),
      pre(code(...codeBlock(`const count = createState(0);

const app = div(
  reactive(count, value => div(\`Count: \${value}\`)),
  button({ onclick: () => count.value++ }, 'Increment')
);`))),

      h2('Performance Tips'),
      ul(
        li('Use throttle/debounce for frequent updates'),
        li('Batch multiple state changes with batchRender'),
        li('Use computed for derived state instead of manual updates')
      )
    ),
    th: div(
      p('เรียนรู้วิธีใช้ระบบจัดการ state แบบ reactive ที่ทรงพลังของ Elit เพื่อสร้างอินเทอร์เฟซผู้ใช้แบบไดนามิก'),

      h2('ทำความเข้าใจ Reactive State'),
      p('ระบบ reactive ของ Elit อิงตาม createState function ซึ่งสร้างค่าที่สามารถสังเกตได้และอัปเดต UI อัตโนมัติเมื่อมีการเปลี่ยนแปลง:'),
      pre(code(...codeBlock(`const name = createState('John');
const age = createState(25);

// UI อัปเดตอัตโนมัติเมื่อ state เปลี่ยน
name.value = 'Jane';`))),

      h2('Computed Values'),
      p('สร้างค่าที่ได้จาก reactive states อื่นๆ โดยใช้ computed function:'),
      pre(code(...codeBlock(`const firstName = createState('John');
const lastName = createState('Doe');

const fullName = computed(() => \`\${firstName.value} \${lastName.value}\`);`))),

      h2('Reactive Rendering'),
      p('ใช้ reactive() helper เพื่อสร้าง UI elements ที่อัปเดตอัตโนมัติ:'),
      pre(code(...codeBlock(`const count = createState(0);

const app = div(
  reactive(count, value => div(\`Count: \${value}\`)),
  button({ onclick: () => count.value++ }, 'เพิ่ม')
);`))),

      h2('เคล็ดลับประสิทธิภาพ'),
      ul(
        li('ใช้ throttle/debounce สำหรับการอัปเดตบ่อยๆ'),
        li('รวมการเปลี่ยนแปลง state หลายครั้งด้วย batchRender'),
        li('ใช้ computed สำหรับ derived state แทนการอัปเดตด้วยตนเอง')
      )
    )
  }
};
