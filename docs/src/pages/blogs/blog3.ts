import { div, h2, p, ul, li, pre, code } from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog3: BlogPostDetail = {
  id: '3',
  title: {
    en: 'Performance Optimization Tips for Elit',
    th: 'เทคนิคการเพิ่มประสิทธิภาพสำหรับ Elit'
  },
  date: '2024-02-01',
  author: 'n-devs',
  tags: ['Performance', 'Optimization', 'Best Practices'],
  content: {
    en: div(
      p('Maximize your Elit application\'s performance with these proven optimization techniques.'),

      h2('1. Batch DOM Updates'),
      p('Use batchRender to group multiple DOM updates into a single operation:'),
      pre(code(...codeBlock(`import { batchRender } from 'elit';

batchRender(() => {
  state1.value = 'new value';
  state2.value = 42;
  state3.value = true;
}); // Only one DOM update cycle`))),

      h2('2. Handle Large Datasets'),
      p('Use renderChunked for rendering large lists without blocking the UI:'),
      pre(code(...codeBlock(`import { renderChunked } from 'elit';

const items = Array.from({ length: 10000 }, (_, i) => \`Item \${i}\`);
const container = div();

renderChunked(container, items, (item) => div(item), {
  chunkSize: 50,
  delay: 10
});`))),

      h2('3. Virtual Scrolling'),
      p('For very long lists, use createVirtualList for efficient scrolling:'),
      pre(code(...codeBlock(`import { createVirtualList } from 'elit';

const list = createVirtualList({
  items: myItems,
  itemHeight: 50,
  containerHeight: 500,
  renderItem: (item) => div(item.name)
});`))),

      h2('4. Lazy Loading'),
      p('Defer component rendering with the lazy utility:'),
      pre(code(...codeBlock(`import { lazy } from 'elit';

const HeavyComponent = lazy(() => import('./HeavyComponent'));`))),

      h2('5. Optimize CreateStyle'),
      ul(
        li('Reuse style objects instead of creating new ones'),
        li('Use CSS variables for dynamic values'),
        li('Minimize specificity conflicts')
      ),

      h2('6. Tree Shaking'),
      p('Import only what you need to minimize bundle size:'),
      pre(code(...codeBlock(`// Good - imports only what's needed
import { div, span } from 'elit';

// Avoid - imports everything
import * as elit from 'elit';`)))
    ),
    th: div(
      p('เพิ่มประสิทธิภาพแอปพลิเคชัน Elit ของคุณให้สูงสุดด้วยเทคนิคที่พิสูจน์แล้วเหล่านี้'),

      h2('1. รวมการอัปเดต DOM'),
      p('ใช้ batchRender เพื่อจัดกลุ่มการอัปเดต DOM หลายครั้งเป็นการทำงานเดียว:'),
      pre(code(...codeBlock(`import { batchRender } from 'elit';

batchRender(() => {
  state1.value = 'new value';
  state2.value = 42;
  state3.value = true;
}); // อัปเดต DOM แค่ครั้งเดียว`))),

      h2('2. จัดการชุดข้อมูลขนาดใหญ่'),
      p('ใช้ renderChunked สำหรับ render รายการขนาดใหญ่โดยไม่บล็อก UI:'),
      pre(code(...codeBlock(`import { renderChunked } from 'elit';

const items = Array.from({ length: 10000 }, (_, i) => \`รายการ \${i}\`);
const container = div();

renderChunked(container, items, (item) => div(item), {
  chunkSize: 50,
  delay: 10
});`))),

      h2('3. Virtual Scrolling'),
      p('สำหรับรายการยาวมาก ใช้ createVirtualList เพื่อการเลื่อนที่มีประสิทธิภาพ:'),
      pre(code(...codeBlock(`import { createVirtualList } from 'elit';

const list = createVirtualList({
  items: myItems,
  itemHeight: 50,
  containerHeight: 500,
  renderItem: (item) => div(item.name)
});`))),

      h2('4. Lazy Loading'),
      p('เลื่อนการ render component ด้วย lazy utility:'),
      pre(code(...codeBlock(`import { lazy } from 'elit';

const HeavyComponent = lazy(() => import('./HeavyComponent'));`))),

      h2('5. เพิ่มประสิทธิภาพ CreateStyle'),
      ul(
        li('นำ style objects กลับมาใช้แทนการสร้างใหม่'),
        li('ใช้ CSS variables สำหรับค่าแบบไดนามิก'),
        li('ลดความซับซ้อนของ specificity')
      ),

      h2('6. Tree Shaking'),
      p('Import เฉพาะสิ่งที่ต้องการเพื่อลดขนาด bundle:'),
      pre(code(...codeBlock(`// ดี - import เฉพาะที่ต้องการ
import { div, span } from 'elit';

// หลีกเลี่ยง - import ทุกอย่าง
import * as elit from 'elit';`)))
    )
  }
};
