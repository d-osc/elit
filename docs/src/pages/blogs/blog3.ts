import { div, h1, h2, p, ul, li, pre, code, strong } from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog3: BlogPostDetail = {
  id: '3',
  title: {
    en: 'Performance Optimization in Elit',
    th: 'การเพิ่มประสิทธิภาพใน Elit'
  },
  date: '2024-12-18',
  author: 'n-devs',
  tags: ['Performance', 'Optimization', 'Best Practices', 'Full-Stack', 'v2.0'],
  content: {
    en: div(
      p('Elit is designed for performance from the ground up. This guide covers optimization techniques for both client-side and full-stack applications, helping you build blazing-fast web apps.'),

      h2('Client-Side Performance'),

      h2('1. Fine-Grained Reactivity'),
      p('Elit uses fine-grained reactivity that only updates what changed, unlike frameworks with virtual DOM overhead:'),

      pre(code(...codeBlock(`import { createState, reactive, div, p } from 'elit';

const name = createState('Alice');
const age = createState(30);

// Only name paragraph re-renders when name changes
const app = div(
  reactive(name, n => p(\`Name: \${n}\`)),
  reactive(age, a => p(\`Age: \${a}\`))
);

name.value = 'Bob'; // Only first <p> updates, not entire app`))),

      h2('2. Minimize Reactive Scope'),
      p('Wrap only the parts that need reactivity to reduce re-render overhead:'),

      pre(code(...codeBlock(`// ❌ Bad - entire component re-renders
const app = reactive(count, value =>
  div(
    header(...), // re-renders on every count change
    p(\`Count: \${value}\`),
    footer(...) // re-renders on every count change
  )
);

// ✅ Good - only count display re-renders
const app = div(
  header(...), // static, never re-renders
  reactive(count, value => p(\`Count: \${value}\`)),
  footer(...) // static, never re-renders
);`))),

      h2('3. Use Computed for Derived State'),
      p('Computed values cache results and only recalculate when dependencies change:'),

      pre(code(...codeBlock(`import { createState, computed } from 'elit';

const items = createState([1, 2, 3, 4, 5]);

// ✅ Cached - only recalculates when items changes
const sum = computed(() =>
  items.value.reduce((a, b) => a + b, 0)
);

// ❌ Avoid - recalculates every access
const getSum = () => items.value.reduce((a, b) => a + b, 0);`))),

      h2('4. Batch State Updates'),
      p('When updating multiple states, batch them to trigger only one reactive update:'),

      pre(code(...codeBlock(`import { createState } from 'elit';

const user = createState({ name: '', age: 0, email: '' });

// ✅ Good - single state update triggers one re-render
user.value = { name: 'Alice', age: 30, email: 'alice@example.com' };

// ❌ Bad - triggers 3 separate re-renders
user.value = { ...user.value, name: 'Alice' };
user.value = { ...user.value, age: 30 };
user.value = { ...user.value, email: 'alice@example.com' };`))),

      h2('5. Optimize CreateStyle'),
      p('Reuse styles and use CSS variables for dynamic values:'),

      pre(code(...codeBlock(`import { createStyle } from 'elit';

const styles = createStyle();

// ✅ Define once, reuse everywhere
const buttonClass = styles.add({
  padding: '10px 20px',
  background: styles.var('primary'),
  color: 'white'
});

// Use CSS variables for dynamic values
styles.setVar('primary', '#007bff');

// ❌ Avoid creating new styles repeatedly
function Button() {
  return button({
    className: styles.add({ /* same styles */ })
  });
}`))),

      h2('6. Tree Shaking'),
      p('Import only what you need to minimize bundle size:'),

      pre(code(...codeBlock(`// ✅ Good - tree-shakeable
import { div, span, button } from 'elit';

// ❌ Bad - imports everything
import * as elit from 'elit';`))),

      h2('Full-Stack Performance'),

      h2('7. Efficient Server API'),
      p('Use middleware strategically and avoid unnecessary processing:'),

      pre(code(...codeBlock(`import { ServerRouter, json, compress, cacheControl } from 'elit';

const api = new ServerRouter();

// ✅ Compress responses
api.use(compress());

// ✅ Cache static data
api.use(cacheControl({ maxAge: 3600, public: true }));

// ✅ Return only needed data
api.get('/users/:id', (ctx) => {
  const user = db.getUser(ctx.params.id);
  // Don't send password, internal fields, etc.
  json(ctx.res, { id: user.id, name: user.name, email: user.email });
});`))),

      h2('8. Use SharedState Wisely'),
      p('SharedState is powerful but use it only when you need real-time sync:'),

      pre(code(...codeBlock(`// ✅ Good use cases for SharedState:
// - Live counters, chat messages, collaborative editing
// - Real-time dashboards, notifications
const liveUsers = new SharedState('activeUsers', 0);

// ❌ Don't use SharedState for:
// - Static data that doesn't change
// - Data that updates infrequently
// - Large datasets (use pagination + API instead)`))),

      h2('9. HTTP Proxy for Backend APIs'),
      p('Use proxy to avoid CORS and reduce latency:'),

      pre(code(...codeBlock(`// elit.config.ts
export default {
  dev: {
    // Proxy /api requests to backend
    proxy: [{
      context: '/api',
      target: 'http://localhost:8080',
      changeOrigin: true
    }]
  }
};

// Client code - same origin, no CORS
fetch('/api/data').then(r => r.json());`))),

      h2('10. Build Optimization'),
      p('Configure esbuild for optimal production builds:'),

      pre(code(...codeBlock(`export default {
  build: {
    entry: './src/main.ts',
    outDir: './dist',
    minify: true,        // ✅ Minify code
    sourcemap: false,    // ✅ Disable sourcemaps in production
    platform: 'browser',

    // Copy only necessary files
    copy: [
      { from: 'index.html', to: 'index.html' },
      { from: 'assets', to: 'assets' }
    ]
  }
};`))),

      h2('11. Code Splitting'),
      p('Split large applications into multiple bundles:'),

      pre(code(...codeBlock(`// Multiple builds for different entry points
export default {
  build: [
    {
      entry: './src/main.ts',
      outDir: './dist',
      outFile: 'main.js'
    },
    {
      entry: './src/admin.ts',
      outDir: './dist',
      outFile: 'admin.js'
    }
  ]
};

// Load admin bundle only when needed
if (isAdmin) {
  const script = document.createElement('script');
  script.src = '/admin.js';
  document.head.appendChild(script);
}`))),

      h2('Performance Checklist'),
      p('Follow these best practices for optimal performance:'),

      ul(
        li(strong('Minimize reactive scope'), ' - Wrap only what needs reactivity'),
        li(strong('Use computed values'), ' - Cache expensive calculations'),
        li(strong('Batch state updates'), ' - Update multiple states together'),
        li(strong('Optimize CreateStyle'), ' - Reuse styles and use CSS variables'),
        li(strong('Tree shake imports'), ' - Import only what you need'),
        li(strong('Compress responses'), ' - Use compress() middleware'),
        li(strong('Cache static data'), ' - Use cacheControl() for unchanging data'),
        li(strong('Use SharedState wisely'), ' - Only for real-time sync needs'),
        li(strong('Proxy backend APIs'), ' - Avoid CORS and reduce latency'),
        li(strong('Minify production builds'), ' - Enable minify in build config'),
        li(strong('Code split large apps'), ' - Use multiple builds for big applications'),
        li(strong('Monitor bundle size'), ' - Keep client bundle under 100KB if possible')
      ),

      h2('Measuring Performance'),
      p('Use browser DevTools to measure and optimize:'),

      pre(code(...codeBlock(`// Measure component render time
console.time('render');
dom.render('#app', myApp);
console.timeEnd('render');

// Measure state update performance
console.time('update');
myState.value = newValue;
console.timeEnd('update');

// Check bundle size after build
// dist/main.js should be under 100KB for most apps`))),

      p('By following these optimization techniques, you can build Elit applications that are fast, efficient, and scale well with growing complexity!')
    ),
    th: div(
      p('Elit ถูกออกแบบมาเพื่อประสิทธิภาพตั้งแต่เริ่มต้น คู่มือนี้ครอบคลุมเทคนิคการเพิ่มประสิทธิภาพทั้งฝั่ง client-side และ full-stack ช่วยให้คุณสร้างเว็บแอพที่เร็วสุดๆ'),

      h2('ประสิทธิภาพฝั่ง Client'),

      h2('1. Fine-Grained Reactivity'),
      p('Elit ใช้ fine-grained reactivity ที่อัปเดตเฉพาะส่วนที่เปลี่ยน ไม่เหมือน frameworks ที่มี virtual DOM overhead:'),

      pre(code(...codeBlock(`import { createState, reactive, div, p } from 'elit';

const name = createState('Alice');
const age = createState(30);

// เฉพาะ paragraph ชื่อที่ re-render เมื่อชื่อเปลี่ยน
const app = div(
  reactive(name, n => p(\`ชื่อ: \${n}\`)),
  reactive(age, a => p(\`อายุ: \${a}\`))
);

name.value = 'Bob'; // เฉพาะ <p> แรกที่อัปเดต ไม่ใช่ทั้ง app`))),

      h2('2. ลด Reactive Scope ให้น้อยที่สุด'),
      p('Wrap เฉพาะส่วนที่ต้องการ reactivity เพื่อลด re-render overhead:'),

      pre(code(...codeBlock(`// ❌ ไม่ดี - component ทั้งหมด re-render
const app = reactive(count, value =>
  div(
    header(...), // re-render ทุกครั้งที่ count เปลี่ยน
    p(\`Count: \${value}\`),
    footer(...) // re-render ทุกครั้งที่ count เปลี่ยน
  )
);

// ✅ ดี - เฉพาะส่วนแสดง count ที่ re-render
const app = div(
  header(...), // static, ไม่เคย re-render
  reactive(count, value => p(\`Count: \${value}\`)),
  footer(...) // static, ไม่เคย re-render
);`))),

      h2('3. ใช้ Computed สำหรับ Derived State'),
      p('Computed values cache ผลลัพธ์และคำนวณใหม่เฉพาะเมื่อ dependencies เปลี่ยน:'),

      pre(code(...codeBlock(`import { createState, computed } from 'elit';

const items = createState([1, 2, 3, 4, 5]);

// ✅ มี Cache - คำนวณใหม่เฉพาะเมื่อ items เปลี่ยน
const sum = computed(() =>
  items.value.reduce((a, b) => a + b, 0)
);

// ❌ หลีกเลี่ยง - คำนวณทุกครั้งที่เข้าถึง
const getSum = () => items.value.reduce((a, b) => a + b, 0);`))),

      h2('4. รวม State Updates'),
      p('เมื่ออัปเดตหลาย states ให้รวมเข้าด้วยกันเพื่อกระตุ้น reactive update เพียงครั้งเดียว:'),

      pre(code(...codeBlock(`import { createState } from 'elit';

const user = createState({ name: '', age: 0, email: '' });

// ✅ ดี - state update เดียวกระตุ้น re-render เดียว
user.value = { name: 'Alice', age: 30, email: 'alice@example.com' };

// ❌ ไม่ดี - กระตุ้น re-render แยก 3 ครั้ง
user.value = { ...user.value, name: 'Alice' };
user.value = { ...user.value, age: 30 };
user.value = { ...user.value, email: 'alice@example.com' };`))),

      h2('5. เพิ่มประสิทธิภาพ CreateStyle'),
      p('นำ styles กลับมาใช้และใช้ CSS variables สำหรับค่าแบบ dynamic:'),

      pre(code(...codeBlock(`import { createStyle } from 'elit';

const styles = createStyle();

// ✅ กำหนดครั้งเดียว ใช้ซ้ำได้ทุกที่
const buttonClass = styles.add({
  padding: '10px 20px',
  background: styles.var('primary'),
  color: 'white'
});

// ใช้ CSS variables สำหรับค่า dynamic
styles.setVar('primary', '#007bff');

// ❌ หลีกเลี่ยงการสร้าง styles ใหม่ซ้ำๆ
function Button() {
  return button({
    className: styles.add({ /* same styles */ })
  });
}`))),

      h2('6. Tree Shaking'),
      p('Import เฉพาะที่ต้องการเพื่อลดขนาด bundle:'),

      pre(code(...codeBlock(`// ✅ ดี - tree-shakeable
import { div, span, button } from 'elit';

// ❌ ไม่ดี - import ทุกอย่าง
import * as elit from 'elit';`))),

      h2('ประสิทธิภาพ Full-Stack'),

      h2('7. Server API ที่มีประสิทธิภาพ'),
      p('ใช้ middleware อย่างมีกลยุทธ์และหลีกเลี่ยงการประมวลผลที่ไม่จำเป็น:'),

      pre(code(...codeBlock(`import { ServerRouter, json, compress, cacheControl } from 'elit';

const api = new ServerRouter();

// ✅ อัดบีบ responses
api.use(compress());

// ✅ Cache ข้อมูล static
api.use(cacheControl({ maxAge: 3600, public: true }));

// ✅ ส่งเฉพาะข้อมูลที่จำเป็น
api.get('/users/:id', (ctx) => {
  const user = db.getUser(ctx.params.id);
  // ไม่ส่ง password, internal fields, etc.
  json(ctx.res, { id: user.id, name: user.name, email: user.email });
});`))),

      h2('8. ใช้ SharedState อย่างชาญฉลาด'),
      p('SharedState ทรงพลังแต่ใช้เฉพาะเมื่อต้องการ real-time sync:'),

      pre(code(...codeBlock(`// ✅ กรณีที่ดีสำหรับ SharedState:
// - Live counters, chat messages, collaborative editing
// - Real-time dashboards, notifications
const liveUsers = new SharedState('activeUsers', 0);

// ❌ อย่าใช้ SharedState สำหรับ:
// - ข้อมูล static ที่ไม่เปลี่ยน
// - ข้อมูลที่อัปเดตไม่บ่อย
// - ข้อมูลขนาดใหญ่ (ใช้ pagination + API แทน)`))),

      h2('9. HTTP Proxy สำหรับ Backend APIs'),
      p('ใช้ proxy เพื่อหลีกเลี่ยง CORS และลด latency:'),

      pre(code(...codeBlock(`// elit.config.ts
export default {
  dev: {
    // Proxy /api requests ไป backend
    proxy: [{
      context: '/api',
      target: 'http://localhost:8080',
      changeOrigin: true
    }]
  }
};

// Client code - same origin, ไม่มี CORS
fetch('/api/data').then(r => r.json());`))),

      h2('10. การเพิ่มประสิทธิภาพ Build'),
      p('ตั้งค่า esbuild สำหรับ production builds ที่ดีที่สุด:'),

      pre(code(...codeBlock(`export default {
  build: {
    entry: './src/main.ts',
    outDir: './dist',
    minify: true,        // ✅ Minify code
    sourcemap: false,    // ✅ ปิด sourcemaps ใน production
    platform: 'browser',

    // Copy เฉพาะไฟล์ที่จำเป็น
    copy: [
      { from: 'index.html', to: 'index.html' },
      { from: 'assets', to: 'assets' }
    ]
  }
};`))),

      h2('11. Code Splitting'),
      p('แบ่งแอปพลิเคชันขนาดใหญ่เป็น bundles หลายตัว:'),

      pre(code(...codeBlock(`// Multiple builds สำหรับ entry points ต่างๆ
export default {
  build: [
    {
      entry: './src/main.ts',
      outDir: './dist',
      outFile: 'main.js'
    },
    {
      entry: './src/admin.ts',
      outDir: './dist',
      outFile: 'admin.js'
    }
  ]
};

// โหลด admin bundle เฉพาะเมื่อต้องการ
if (isAdmin) {
  const script = document.createElement('script');
  script.src = '/admin.js';
  document.head.appendChild(script);
}`))),

      h2('Performance Checklist'),
      p('ปฏิบัติตามแนวทางเหล่านี้เพื่อประสิทธิภาพที่ดีที่สุด:'),

      ul(
        li(strong('ลด reactive scope'), ' - Wrap เฉพาะส่วนที่ต้องการ reactivity'),
        li(strong('ใช้ computed values'), ' - Cache การคำนวณที่ซับซ้อน'),
        li(strong('รวม state updates'), ' - อัปเดตหลาย states พร้อมกัน'),
        li(strong('เพิ่มประสิทธิภาพ CreateStyle'), ' - นำ styles กลับมาใช้และใช้ CSS variables'),
        li(strong('Tree shake imports'), ' - Import เฉพาะที่ต้องการ'),
        li(strong('อัดบีบ responses'), ' - ใช้ compress() middleware'),
        li(strong('Cache ข้อมูล static'), ' - ใช้ cacheControl() สำหรับข้อมูลที่ไม่เปลี่ยน'),
        li(strong('ใช้ SharedState อย่างชาญฉลาด'), ' - เฉพาะสำหรับ real-time sync'),
        li(strong('Proxy backend APIs'), ' - หลีกเลี่ยง CORS และลด latency'),
        li(strong('Minify production builds'), ' - เปิด minify ใน build config'),
        li(strong('Code split แอพใหญ่'), ' - ใช้ multiple builds สำหรับแอปพลิเคชันขนาดใหญ่'),
        li(strong('ติดตามขนาด bundle'), ' - รักษา client bundle ให้ต่ำกว่า 100KB ถ้าทำได้')
      ),

      h2('การวัดประสิทธิภาพ'),
      p('ใช้ browser DevTools เพื่อวัดและเพิ่มประสิทธิภาพ:'),

      pre(code(...codeBlock(`// วัดเวลา component render
console.time('render');
dom.render('#app', myApp);
console.timeEnd('render');

// วัดประสิทธิภาพการอัปเดต state
console.time('update');
myState.value = newValue;
console.timeEnd('update');

// ตรวจสอบขนาด bundle หลัง build
// dist/main.js ควรต่ำกว่า 100KB สำหรับแอพส่วนใหญ่`))),

      p('ด้วยการปฏิบัติตามเทคนิคการเพิ่มประสิทธิภาพเหล่านี้ คุณสามารถสร้างแอปพลิเคชัน Elit ที่เร็ว มีประสิทธิภาพ และขยายตัวได้ดีตามความซับซ้อนที่เพิ่มขึ้น!')
    )
  }
};
