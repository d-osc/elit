import { div, h1, h2, p, ul, li, pre, code, strong } from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog2: BlogPostDetail = {
  id: '2',
  title: {
    en: 'Building Reactive UIs with Elit',
    th: 'การสร้าง UI แบบ Reactive ด้วย Elit'
  },
  date: '2024-12-18',
  author: 'n-devs',
  tags: ['Tutorial', 'State Management', 'Reactive', 'Full-Stack', 'v2.0'],
  content: {
    en: div(
      p('Elit provides a powerful reactive state management system for building dynamic user interfaces. This tutorial explores both client-side reactivity and full-stack real-time state synchronization between server and clients.'),

      h2('Client-Side Reactive State'),
      p('Elit provides fine-grained reactivity through the ', strong('createState'), ' function. State changes automatically trigger UI updates with minimal re-renders:'),

      pre(code(...codeBlock(`import { createState, reactive, div, p, button } from 'elit';

// Create reactive state
const count = createState(0);

// Reactive UI updates automatically
const counter = reactive(count, value =>
  div(
    p(\`Count: \${value}\`),
    button({ onclick: () => count.value++ }, 'Increment')
  )
);`))),

      h2('Advanced Computed Values'),
      p('Create derived state that automatically updates when any dependency changes. Computed values support multiple dependencies and complex calculations:'),

      pre(code(...codeBlock(`import { createState, computed } from 'elit';

const price = createState(100);
const quantity = createState(2);
const taxRate = createState(0.1);

// Multi-dependency computed value
const subtotal = computed(() => price.value * quantity.value);
const tax = computed(() => subtotal.value * taxRate.value);
const total = computed(() => subtotal.value + tax.value);

console.log(total.value); // 220

price.value = 150;
console.log(total.value); // 330 (all computed values auto-update)`))),

      h2('Two-Way Data Binding'),
      p('Elit provides ', strong('bindValue'), ' and ', strong('bindChecked'), ' for effortless two-way binding with form inputs:'),

      pre(code(...codeBlock(`import { createState, div, input, p, bindValue, bindChecked } from 'elit';

const name = createState('');
const agreed = createState(false);

const form = div(
  input({ type: 'text', ...bindValue(name) }),
  p(\`Hello, \${name.value || 'Guest'}!\`),

  input({ type: 'checkbox', ...bindChecked(agreed) }),
  p(agreed.value ? 'Terms accepted' : 'Please accept terms')
);`))),

      h2('Real-Time Shared State'),
      p('Elit introduces ', strong('SharedState'), ' for real-time state synchronization between server and multiple clients via WebSocket:'),

      pre(code(...codeBlock(`// elit.config.ts (Server)
import { defineConfig, StateManager } from 'elit';

const stateManager = new StateManager();

// Create shared state on server
stateManager.create('liveCount', 0);

export default defineConfig({
  dev: {
    port: 3000,
    stateManager
  }
});`))),

      pre(code(...codeBlock(`// src/main.ts (Client)
import { SharedState, reactive, div, button, h1 } from 'elit';

// Connect to server state
const liveCount = new SharedState('liveCount', 0);

// All clients see real-time updates
const app = div(
  h1('Live Counter (Synced)'),
  reactive(liveCount.state, value =>
    div(
      p(\`Count: \${value}\`),
      button({ onclick: () => liveCount.set(value + 1) }, '+'),
      button({ onclick: () => liveCount.set(value - 1) }, '-')
    )
  )
);

// When any client clicks +/-, all clients update instantly!`))),

      h2('Full-Stack Reactive Example'),
      p('Combine server API with client-side reactivity for powerful full-stack applications:'),

      pre(code(...codeBlock(`// elit.config.ts
import { defineConfig, ServerRouter, json } from 'elit';

const api = new ServerRouter();
let serverCount = 0;

api.get('/api/count', (ctx) => {
  json(ctx.res, { count: serverCount });
});

api.post('/api/count', (ctx) => {
  serverCount++;
  json(ctx.res, { count: serverCount });
});

export default defineConfig({
  dev: { port: 3000, api }
});`))),

      pre(code(...codeBlock(`// src/main.ts
import { createState, reactive, div, button, p, dom } from 'elit';

const count = createState(0);

// Fetch initial value
fetch('/api/count')
  .then(r => r.json())
  .then(data => count.value = data.count);

const app = reactive(count, value =>
  div(
    p(\`Server Count: \${value}\`),
    button({
      onclick: async () => {
        const res = await fetch('/api/count', { method: 'POST' });
        const data = await res.json();
        count.value = data.count;
      }
    }, 'Increment on Server')
  )
);

dom.render('#app', app);`))),

      h2('Performance Optimization'),
      p('Best practices for building high-performance reactive UIs:'),

      ul(
        li(strong('Use computed values'), ' - Derive state automatically instead of manual updates'),
        li(strong('Keep reactive functions pure'), ' - Avoid side effects in reactive callbacks'),
        li(strong('Minimize reactive scope'), ' - Only wrap components that need reactivity'),
        li(strong('Batch state updates'), ' - Update multiple states before reactive re-render'),
        li(strong('Use throttle/debounce'), ' - Limit update frequency for high-frequency events'),
        li(strong('Prefer SharedState'), ' - For multi-client sync, avoid polling with SharedState')
      ),

      h2('Reactive Patterns'),
      p('Common reactive patterns in Elit:'),

      pre(code(...codeBlock(`// Pattern 1: Multiple reactive regions
const userState = createState({ name: 'Alice', age: 30 });

const header = reactive(userState, user => div(h1(\`Welcome, \${user.name}\`)));
const profile = reactive(userState, user => div(p(\`Age: \${user.age}\`)));

// Pattern 2: Conditional rendering
const isLoggedIn = createState(false);

const nav = reactive(isLoggedIn, loggedIn =>
  loggedIn
    ? button({ onclick: logout }, 'Logout')
    : button({ onclick: login }, 'Login')
);

// Pattern 3: List rendering with map
const items = createState(['Apple', 'Banana', 'Cherry']);

const list = reactive(items, arr =>
  ul(...arr.map(item => li(item)))
);

// Pattern 4: Nested computed values
const a = createState(5);
const b = createState(3);
const sum = computed(() => a.value + b.value);
const doubled = computed(() => sum.value * 2);`))),

      h2('Learn More'),
      p('Explore advanced reactive features:'),
      ul(
        li('📖 Check ', strong('API Reference'), ' for complete reactive API'),
        li('🎯 See ', strong('Examples'), ' for real-world reactive patterns'),
        li('🌐 Try ', strong('SharedState'), ' for real-time multi-client apps'),
        li('⚡ Read about ', strong('Performance'), ' optimization techniques')
      ),

      p('Master reactive programming with Elit and build dynamic, responsive applications with ease!')
    ),
    th: div(
      p('Elit มีระบบจัดการ state แบบ reactive ที่ทรงพลังสำหรับสร้างอินเทอร์เฟซผู้ใช้แบบไดนามิก บทความนี้จะสำรวจทั้ง reactivity ฝั่ง client และการ synchronize state แบบ real-time ระหว่าง server กับ clients'),

      h2('Client-Side Reactive State'),
      p('Elit มี fine-grained reactivity ผ่าน ', strong('createState'), ' function การเปลี่ยนแปลง state จะกระตุ้นการอัปเดต UI อัตโนมัติด้วย re-renders น้อยที่สุด:'),

      pre(code(...codeBlock(`import { createState, reactive, div, p, button } from 'elit';

// สร้าง reactive state
const count = createState(0);

// Reactive UI อัปเดตอัตโนมัติ
const counter = reactive(count, value =>
  div(
    p(\`Count: \${value}\`),
    button({ onclick: () => count.value++ }, 'เพิ่ม')
  )
);`))),

      h2('Computed Values ขั้นสูง'),
      p('สร้าง derived state ที่อัปเดตอัตโนมัติเมื่อ dependency ใดๆ เปลี่ยน Computed values รองรับ dependencies หลายตัวและการคำนวณที่ซับซ้อน:'),

      pre(code(...codeBlock(`import { createState, computed } from 'elit';

const price = createState(100);
const quantity = createState(2);
const taxRate = createState(0.1);

// Multi-dependency computed value
const subtotal = computed(() => price.value * quantity.value);
const tax = computed(() => subtotal.value * taxRate.value);
const total = computed(() => subtotal.value + tax.value);

console.log(total.value); // 220

price.value = 150;
console.log(total.value); // 330 (computed values ทั้งหมดอัปเดตอัตโนมัติ)`))),

      h2('Two-Way Data Binding'),
      p('Elit มี ', strong('bindValue'), ' และ ', strong('bindChecked'), ' สำหรับ two-way binding กับ form inputs อย่างง่ายดาย:'),

      pre(code(...codeBlock(`import { createState, div, input, p, bindValue, bindChecked } from 'elit';

const name = createState('');
const agreed = createState(false);

const form = div(
  input({ type: 'text', ...bindValue(name) }),
  p(\`สวัสดี, \${name.value || 'ผู้เยี่ยมชม'}!\`),

  input({ type: 'checkbox', ...bindChecked(agreed) }),
  p(agreed.value ? 'ยอมรับข้อตกลง' : 'กรุณายอมรับข้อตกลง')
);`))),

      h2('Real-Time Shared State'),
      p('Elit แนะนำ ', strong('SharedState'), ' สำหรับการ synchronize state แบบ real-time ระหว่าง server และ clients หลายตัวผ่าน WebSocket:'),

      pre(code(...codeBlock(`// elit.config.ts (Server)
import { defineConfig, StateManager } from 'elit';

const stateManager = new StateManager();

// สร้าง shared state บน server
stateManager.create('liveCount', 0);

export default defineConfig({
  dev: {
    port: 3000,
    stateManager
  }
});`))),

      pre(code(...codeBlock(`// src/main.ts (Client)
import { SharedState, reactive, div, button, h1 } from 'elit';

// เชื่อมต่อกับ server state
const liveCount = new SharedState('liveCount', 0);

// Clients ทั้งหมดเห็นการอัปเดตแบบ real-time
const app = div(
  h1('Live Counter (Synced)'),
  reactive(liveCount.state, value =>
    div(
      p(\`Count: \${value}\`),
      button({ onclick: () => liveCount.set(value + 1) }, '+'),
      button({ onclick: () => liveCount.set(value - 1) }, '-')
    )
  )
);

// เมื่อ client ใดคลิก +/- clients ทั้งหมดจะอัปเดตทันที!`))),

      h2('ตัวอย่าง Full-Stack Reactive'),
      p('ผรวม server API กับ client-side reactivity สำหรับแอปพลิเคชัน full-stack ที่ทรงพลัง:'),

      pre(code(...codeBlock(`// elit.config.ts
import { defineConfig, ServerRouter, json } from 'elit';

const api = new ServerRouter();
let serverCount = 0;

api.get('/api/count', (ctx) => {
  json(ctx.res, { count: serverCount });
});

api.post('/api/count', (ctx) => {
  serverCount++;
  json(ctx.res, { count: serverCount });
});

export default defineConfig({
  dev: { port: 3000, api }
});`))),

      pre(code(...codeBlock(`// src/main.ts
import { createState, reactive, div, button, p, dom } from 'elit';

const count = createState(0);

// ดึงค่าเริ่มต้น
fetch('/api/count')
  .then(r => r.json())
  .then(data => count.value = data.count);

const app = reactive(count, value =>
  div(
    p(\`Server Count: \${value}\`),
    button({
      onclick: async () => {
        const res = await fetch('/api/count', { method: 'POST' });
        const data = await res.json();
        count.value = data.count;
      }
    }, 'เพิ่มบน Server')
  )
);

dom.render('#app', app);`))),

      h2('การปรับแต่งประสิทธิภาพ'),
      p('แนวทางปฏิบัติที่ดีที่สุดสำหรับสร้าง reactive UIs ที่มีประสิทธิภาพสูง:'),

      ul(
        li(strong('ใช้ computed values'), ' - Derive state อัตโนมัติแทนการอัปเดตด้วยตนเอง'),
        li(strong('รักษา reactive functions ให้ pure'), ' - หลีกเลี่ยง side effects ใน reactive callbacks'),
        li(strong('ลด reactive scope ให้น้อยที่สุด'), ' - wrap เฉพาะ components ที่ต้องการ reactivity'),
        li(strong('รวม state updates'), ' - อัปเดต states หลายตัวก่อน reactive re-render'),
        li(strong('ใช้ throttle/debounce'), ' - จำกัดความถี่การอัปเดตสำหรับ high-frequency events'),
        li(strong('ใช้ SharedState'), ' - สำหรับ multi-client sync, หลีกเลี่ยง polling ด้วย SharedState')
      ),

      h2('Reactive Patterns'),
      p('Reactive patterns ทั่วไปใน Elit:'),

      pre(code(...codeBlock(`// Pattern 1: Multiple reactive regions
const userState = createState({ name: 'Alice', age: 30 });

const header = reactive(userState, user => div(h1(\`ยินดีต้อนรับ, \${user.name}\`)));
const profile = reactive(userState, user => div(p(\`อายุ: \${user.age}\`)));

// Pattern 2: Conditional rendering
const isLoggedIn = createState(false);

const nav = reactive(isLoggedIn, loggedIn =>
  loggedIn
    ? button({ onclick: logout }, 'ออกจากระบบ')
    : button({ onclick: login }, 'เข้าสู่ระบบ')
);

// Pattern 3: List rendering with map
const items = createState(['แอปเปิ้ล', 'กล้วย', 'เชอร์รี่']);

const list = reactive(items, arr =>
  ul(...arr.map(item => li(item)))
);

// Pattern 4: Nested computed values
const a = createState(5);
const b = createState(3);
const sum = computed(() => a.value + b.value);
const doubled = computed(() => sum.value * 2);`))),

      h2('เรียนรู้เพิ่มเติม'),
      p('สำรวจฟีเจอร์ reactive ขั้นสูง:'),
      ul(
        li('📖 ดู ', strong('API Reference'), ' สำหรับ reactive API ฉบับสมบูรณ์'),
        li('🎯 ดู ', strong('ตัวอย่าง'), ' สำหรับ reactive patterns ในโลกแห่งความจริง'),
        li('🌐 ลอง ', strong('SharedState'), ' สำหรับแอป multi-client แบบ real-time'),
        li('⚡ อ่านเกี่ยวกับเทคนิคการปรับแต่ง ', strong('ประสิทธิภาพ'))
      ),

      p('เชี่ยวชาญ reactive programming ด้วย Elit และสร้างแอปพลิเคชันที่ dynamic และ responsive ได้อย่างง่ายดาย!')
    )
  }
};
