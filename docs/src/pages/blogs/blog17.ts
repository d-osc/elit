import {
  div, h1, h2, h3, p, ul, li, pre, code, strong, em, a
} from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog17: BlogPostDetail = {
  id: '17',
  title: {
    en: 'Hot Module Replacement with Elit 2.0',
    th: 'Hot Module Replacement กับ Elit 2.0'
  },
  date: '2024-04-12',
  author: 'n-devs',
  tags: ['Tutorial', 'HMR', 'CLI', 'Development', 'Workflow'],
  content: {
    en: div(
      p('Learn how to use ', strong('Hot Module Replacement (HMR)'), ' with Elit 2.0\'s built-in dev server for an instant development experience. See your changes reflected in the browser ', em('without page refresh'), ' - preserving application state and speeding up your development workflow dramatically.'),

      h2('What is HMR?'),
      p('Hot Module Replacement (HMR) is a development feature that updates your application in the browser as you edit files, without requiring a full page refresh. This means:'),
      ul(
        li('✨ ', strong('Instant feedback'), ' - See changes immediately'),
        li('🔄 ', strong('State preservation'), ' - Application state remains intact'),
        li('⚡ ', strong('Faster development'), ' - No waiting for page reload'),
        li('🎯 ', strong('CSS updates'), ' - Styles update without refresh'),
        li('💾 ', strong('Form data preserved'), ' - No loss of input data during development')
      ),

      h2('How HMR Works in Elit 2.0'),
      p('Elit 2.0\'s built-in HMR uses WebSocket to communicate file changes:'),

      pre(code(...codeBlock(`┌──────────────┐         WebSocket         ┌──────────────┐
│   Browser    │◄──────────────────────────►│   Server     │
│              │                            │              │
│  1. Load app │                            │ 2. Watch     │
│              │                            │    files     │
│  4. Receive  │    3. File changed!        │              │
│     update   │◄───────────────────────────┤              │
│              │                            │              │
│  5. Hot      │                            │              │
│     swap     │                            │              │
└──────────────┘                            └──────────────┘`))),

      h2('Quick Start'),
      h3('1. Install Elit 2.0'),
      pre(code(...codeBlock(`npm install elit`))),

      h3('2. Create Your App'),
      p('Create ', code('public/index.html'), ':'),
      pre(code(...codeBlock(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HMR Demo</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/app.js"></script>
</body>
</html>`))),

      p('Create ', code('public/app.js'), ':'),
      pre(code(...codeBlock(`import { div, h1, p, button, createState, reactive, dom } from 'elit';

const count = createState(0);

const App = div({ id: 'app' },
  h1('HMR Demo'),
  p('Click the button and then edit this file - your state will be preserved!'),
  reactive(count, value =>
    p({ style: 'font-size: 2rem; color: #667eea' }, \`Count: \${value}\`)
  ),
  button({
    onclick: () => count.value++,
    style: 'padding: 10px 20px; font-size: 1rem; cursor: pointer;'
  }, 'Increment')
);

dom.render('#app', App);

console.log('✅ App loaded with HMR');`))),

      h3('3. Start Development Server'),
      p('Simply run the Elit CLI dev command - HMR is enabled by default:'),
      pre(code(...codeBlock(`# Start dev server with HMR (port 3000 by default)
npx elit dev

# Or with custom options
npx elit dev --port 8080 --root ./public`))),

      p('Now try editing ', code('app.js'), ' - changes appear instantly without page refresh! 🎉'),

      h2('HMR in Action'),
      h3('Example 1: Updating UI'),
      p('Edit your app while it\'s running:'),

      pre(code(...codeBlock(`// Before: Simple button
button({ onclick: () => count.value++ }, 'Increment')

// After: Styled button with emoji
button({
  onclick: () => count.value++,
  style: 'background: #667eea; color: white; border: none; border-radius: 8px; padding: 12px 24px; cursor: pointer;'
}, '➕ Increment')

// HMR updates the button instantly - count value preserved!`))),

      h3('Example 2: Adding New Features'),
      p('Add a decrement button without losing state:'),

      pre(code(...codeBlock(`const App = div({ id: 'app' },
  h1('HMR Demo'),
  reactive(count, value =>
    p({ style: 'font-size: 2rem; color: #667eea' }, \`Count: \${value}\`)
  ),
  div({ style: 'display: flex; gap: 10px;' },
    button({ onclick: () => count.value++ }, '➕ Increment'),
    button({ onclick: () => count.value-- }, '➖ Decrement'),  // New!
    button({ onclick: () => count.value = 0 }, '🔄 Reset')     // New!
  )
);

// HMR applies changes - existing count value remains!`))),

      h3('Example 3: CSS Updates'),
      p('Update styles instantly:'),

      pre(code(...codeBlock(`// Create styles.js
import { CreateStyle } from 'elit';

const styles = new CreateStyle();

export const button = styles.class('button', {
  padding: '12px 24px',
  fontSize: '1rem',
  backgroundColor: '#667eea',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: '#5568d3',
    transform: 'translateY(-2px)'
  }
});

// Edit colors, sizes, etc. - changes apply instantly!`))),

      h2('Advanced HMR Features'),

      h3('State Persistence'),
      p('HMR preserves application state by default. For complex state, use state management:'),

      pre(code(...codeBlock(`import { createState } from 'elit';

// State persists across HMR updates
const appState = createState({
  user: { name: 'John', email: 'john@example.com' },
  todos: [],
  settings: { theme: 'dark', language: 'en' }
});

// Edit components - state remains intact!`))),

      h3('HMR with Router'),
      p('Router state is preserved during HMR:'),

      pre(code(...codeBlock(`import { createRouter, createRouterView } from 'elit';

const router = createRouter({
  mode: 'hash',
  routes: [
    { path: '/', component: HomePage },
    { path: '/about', component: AboutPage },
    { path: '/contact', component: ContactPage }
  ]
});

// Navigate to /about, then edit AboutPage
// HMR updates component - stays on /about route!`))),

      h3('Module Acceptance'),
      p('For advanced control, handle HMR updates manually:'),

      pre(code(...codeBlock(`// Check if HMR is available
if (import.meta.hot) {
  // Accept updates for this module
  import.meta.hot.accept((newModule) => {
    console.log('🔥 Module updated!', newModule);
    // Custom update logic here
  });

  // Accept updates for dependencies
  import.meta.hot.accept('./components/Button.js', (newButton) => {
    console.log('🔥 Button component updated!');
  });

  // Dispose old module
  import.meta.hot.dispose(() => {
    console.log('🧹 Cleaning up old module');
    // Cleanup logic
  });
}`))),

      h2('HMR Best Practices'),

      h3('1. Keep Components Pure'),
      pre(code(...codeBlock(`// ✅ Good: Pure component
const Button = (text, onClick) =>
  button({ onclick: onClick }, text);

// ❌ Bad: Side effects at module level
const socket = new WebSocket('ws://localhost:3000'); // Creates new connection on HMR!`))),

      h3('2. Use Reactive State'),
      pre(code(...codeBlock(`// ✅ Good: Reactive state
const count = createState(0);
reactive(count, value => p(\`Count: \${value}\`));

// ❌ Bad: Direct DOM manipulation
let count = 0;
document.getElementById('count').textContent = count; // Lost on HMR`))),

      h3('3. Separate State and UI'),
      pre(code(...codeBlock(`// state.js - State definitions
export const userState = createState(null);
export const todosState = createState([]);

// App.js - UI components
import { userState, todosState } from './state.js';

// Edit App.js freely - state in state.js is preserved!`))),

      h3('4. Use CSS-in-JS'),
      pre(code(...codeBlock(`// styles.js
import { CreateStyle } from 'elit';

export const styles = new CreateStyle();

export const button = styles.class('button', {
  padding: '10px 20px',
  backgroundColor: '#667eea'
});

// Changes to styles.js trigger instant style updates!`))),

      h2('HMR Configuration'),

      h3('Using Configuration File'),
      p('Create ', code('elit.config.ts'), ' to customize HMR behavior:'),
      pre(code(...codeBlock(`import { defineConfig } from 'elit';

export default defineConfig({
  dev: {
    port: 3000,
    root: './public',
    logging: true,
    open: true,
    clients: [
      {
        root: './public',
        basePath: '/',
        // Files are automatically watched in the root directory
      }
    ]
  }
});`))),

      h3('CLI Options'),
      p('Configure HMR through CLI arguments:'),
      pre(code(...codeBlock(`# Start dev server with custom configuration
npx elit dev --port 3000 --root ./public --no-open

# Available options:
# --port, -p     Port number (default: 3000)
# --host, -h     Host to bind to (default: localhost)
# --root, -r     Root directory to serve
# --no-open      Don't open browser automatically
# --silent       Disable logging`))),

      h2('Debugging HMR'),

      h3('Check HMR Status'),
      pre(code(...codeBlock(`// In browser console
console.log('HMR enabled:', !!import.meta.hot);

// Listen for HMR events
if (import.meta.hot) {
  import.meta.hot.on('update', () => {
    console.log('🔥 HMR update received');
  });
}`))),

      h3('Server Logs'),
      pre(code(...codeBlock(`// Server shows HMR events
[HMR] File changed: /app.js
[HMR] Broadcasting update to 3 clients
[HMR] ✅ Hot reload successful`))),

      h3('Common Issues'),

      p(strong('Issue 1: Changes not appearing')),
      ul(
        li('Check browser console for errors'),
        li('Verify WebSocket connection (look for ws:// in Network tab)'),
        li('Ensure file is in watched directory'),
        li('Clear browser cache if needed')
      ),

      p(strong('Issue 2: State resets on update')),
      ul(
        li('Move state definitions to separate file'),
        li('Use ', code('createState()'), ' instead of ', code('let'), ' variables'),
        li('Avoid module-level side effects')
      ),

      p(strong('Issue 3: Full page reload instead of HMR')),
      ul(
        li('Check for syntax errors in updated file'),
        li('Some changes (HTML) require full reload'),
        li('Import errors trigger fallback to full reload')
      ),

      h2('Real-World Example: Todo App with HMR'),

      pre(code(...codeBlock(`// todos.js - State management
import { createState } from 'elit';

export const todosState = createState([
  { id: 1, text: 'Learn Elit', done: false },
  { id: 2, text: 'Try HMR', done: false }
]);

export const addTodo = (text) => {
  const newTodo = {
    id: Date.now(),
    text,
    done: false
  };
  todosState.value = [...todosState.value, newTodo];
};

export const toggleTodo = (id) => {
  todosState.value = todosState.value.map(todo =>
    todo.id === id ? { ...todo, done: !todo.done } : todo
  );
};

export const deleteTodo = (id) => {
  todosState.value = todosState.value.filter(todo => todo.id !== id);
};`))),

      pre(code(...codeBlock(`// App.js - UI components
import { div, h1, input, button, ul, li, reactive, createState } from 'elit';
import { todosState, addTodo, toggleTodo, deleteTodo } from './todos.js';
import { styles } from './styles.js';

const inputValue = createState('');

const TodoApp = div({ className: styles.container },
  h1('Todo App with HMR'),

  // Input form
  div({ style: 'display: flex; gap: 10px; margin-bottom: 20px;' },
    input({
      type: 'text',
      placeholder: 'What needs to be done?',
      value: inputValue.value,
      oninput: (e) => inputValue.value = e.target.value,
      onkeydown: (e) => {
        if (e.key === 'Enter' && inputValue.value.trim()) {
          addTodo(inputValue.value);
          inputValue.value = '';
        }
      }
    }),
    button({
      onclick: () => {
        if (inputValue.value.trim()) {
          addTodo(inputValue.value);
          inputValue.value = '';
        }
      }
    }, 'Add')
  ),

  // Todo list
  reactive(todosState, todos =>
    todos.length === 0
      ? p('No todos yet. Add one above!')
      : ul(
          ...todos.map(todo =>
            li({
              key: todo.id,
              style: 'display: flex; gap: 10px; align-items: center; padding: 10px; border-bottom: 1px solid #eee;'
            },
              input({
                type: 'checkbox',
                checked: todo.done,
                onchange: () => toggleTodo(todo.id)
              }),
              span({
                style: todo.done ? 'text-decoration: line-through; color: #999;' : ''
              }, todo.text),
              button({
                onclick: () => deleteTodo(todo.id),
                style: 'margin-left: auto; color: red;'
              }, '×')
            )
          )
        )
  )
);

export default TodoApp;

// Now try editing:
// 1. Add new features (edit button, filter buttons)
// 2. Change styles (colors, spacing)
// 3. Update logic (sort todos, add categories)
// All without losing your todo list! 🎉`))),

      h2('Performance Impact'),
      p('HMR is incredibly efficient:'),
      ul(
        li('⚡ ', strong('Updates in < 100ms'), ' - Faster than manual refresh'),
        li('📦 ', strong('Only changed modules'), ' - Minimal data transfer'),
        li('🎯 ', strong('Surgical updates'), ' - Only affected components re-render'),
        li('💾 ', strong('State preserved'), ' - No data loss or re-initialization')
      ),

      h2('Production Considerations'),
      p(strong('Important:'), ' HMR is a ', em('development-only'), ' feature and is automatically disabled in production builds. Make sure to:'),

      ul(
        li('Set ', code('NODE_ENV=production'), ' for production builds'),
        li('Use a proper bundler (Vite, Rollup, etc.) for production'),
        li('Test production builds without HMR to catch environment-specific issues'),
        li('Remove ', code('import.meta.hot'), ' checks via dead code elimination in production')
      ),

      h2('Comparison with Other Solutions'),

      pre(code(...codeBlock(`┌────────────────┬─────────────┬──────────────┬────────────────┐
│ Feature        │ Elit 2.0    │ Vite         │ Webpack HMR    │
├────────────────┼─────────────┼──────────────┼────────────────┤
│ Setup Time     │ 0 config    │ Minimal      │ Complex        │
│ Update Speed   │ < 100ms     │ < 50ms       │ 200-500ms      │
│ State Preserve │ ✅ Built-in │ ✅ Built-in  │ ⚠️  Manual     │
│ WebSocket      │ ✅ Built-in │ ✅ Built-in  │ ✅ Built-in    │
│ CLI Commands   │ ✅ Built-in │ ✅ Built-in  │ ⚠️  External   │
│ Build Tool     │ ✅ Built-in │ ✅ Built-in  │ ✅ Built-in    │
│ Framework      │ Full-stack  │ Framework    │ Framework      │
│                │ integrated  │ agnostic     │ agnostic       │
└────────────────┴─────────────┴──────────────┴────────────────┘`))),

      h2('Conclusion'),
      p('Hot Module Replacement transforms your development experience by providing instant feedback without page refreshes. With Elit 2.0, HMR is enabled out of the box with zero configuration through the built-in CLI (', code('npx elit dev'), '), allowing you to focus on building your application.'),

      p('Key benefits:'),
      ul(
        li('✨ ', strong('Instant feedback'), ' - See changes immediately as you type'),
        li('🔄 ', strong('State preservation'), ' - Never lose your application state'),
        li('⚡ ', strong('Faster workflow'), ' - Save seconds on every change (adds up!)'),
        li('🎯 ', strong('Zero config'), ' - Works out of the box'),
        li('💪 ', strong('Production-ready'), ' - Automatically disabled in production')
      ),

      p('Start using HMR today and experience the difference! Simply run ', code('npx elit dev'), ' and try editing your components while your app is running - watch the magic happen. 🔥✨'),

      p('For more information, check out the ', a({ href: 'https://github.com/oangsa/elit' }, 'Elit documentation'), '.')
    ),
    th: div(
      p('เรียนรู้วิธีใช้ ', strong('Hot Module Replacement (HMR)'), ' กับ dev server ในตัวของ Elit 2.0 เพื่อประสบการณ์การพัฒนาที่รวดเร็ว ดูการเปลี่ยนแปลงสะท้อนใน browser ', em('โดยไม่ต้อง refresh หน้าเว็บ'), ' - รักษา state ของแอปและเพิ่มความเร็วในการพัฒนาอย่างมาก'),

      h2('HMR คืออะไร?'),
      p('Hot Module Replacement (HMR) คือฟีเจอร์การพัฒนาที่อัปเดตแอปพลิเคชันใน browser ขณะที่คุณแก้ไขไฟล์ โดยไม่ต้อง refresh หน้าเว็บทั้งหมด หมายความว่า:'),
      ul(
        li('✨ ', strong('Feedback ทันที'), ' - เห็นการเปลี่ยนแปลงทันที'),
        li('🔄 ', strong('รักษา State'), ' - State ของแอปพลิเคชันยังคงอยู่'),
        li('⚡ ', strong('พัฒนาเร็วขึ้น'), ' - ไม่ต้องรอ page reload'),
        li('🎯 ', strong('อัปเดต CSS'), ' - Styles อัปเดตโดยไม่ต้อง refresh'),
        li('💾 ', strong('รักษาข้อมูล Form'), ' - ไม่สูญเสียข้อมูลที่กรอกระหว่างพัฒนา')
      ),

      h2('HMR ทำงานอย่างไรใน Elit 2.0'),
      p('HMR ในตัวของ Elit 2.0 ใช้ WebSocket สื่อสารการเปลี่ยนแปลงไฟล์:'),

      pre(code(...codeBlock(`┌──────────────┐         WebSocket         ┌──────────────┐
│   Browser    │◄──────────────────────────►│   Server     │
│              │                            │              │
│  1. โหลดแอป  │                            │ 2. ติดตาม   │
│              │                            │    ไฟล์      │
│  4. รับ      │    3. ไฟล์เปลี่ยน!         │              │
│     update   │◄───────────────────────────┤              │
│              │                            │              │
│  5. Hot      │                            │              │
│     swap     │                            │              │
└──────────────┘                            └──────────────┘`))),

      h2('เริ่มต้นอย่างรวดเร็ว'),
      h3('1. ติดตั้ง Elit 2.0'),
      pre(code(...codeBlock(`npm install elit`))),

      h3('2. สร้างแอป'),
      p('สร้าง ', code('public/index.html'), ':'),
      pre(code(...codeBlock(`<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HMR Demo</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/app.js"></script>
</body>
</html>`))),

      p('สร้าง ', code('public/app.js'), ':'),
      pre(code(...codeBlock(`import { div, h1, p, button, createState, reactive, dom } from 'elit';

const count = createState(0);

const App = div({ id: 'app' },
  h1('HMR Demo'),
  p('คลิกปุ่มแล้วลองแก้ไขไฟล์นี้ - state ของคุณจะถูกรักษาไว้!'),
  reactive(count, value =>
    p({ style: 'font-size: 2rem; color: #667eea' }, \`นับ: \${value}\`)
  ),
  button({
    onclick: () => count.value++,
    style: 'padding: 10px 20px; font-size: 1rem; cursor: pointer;'
  }, 'เพิ่ม')
);

dom.render('#app', App);

console.log('✅ แอปโหลดพร้อม HMR');`))),

      h3('3. เริ่ม Development Server'),
      p('เพียงรัน Elit CLI คำสั่ง dev - HMR เปิดใช้งานโดยอัตโนมัติ:'),
      pre(code(...codeBlock(`# เริ่ม dev server พร้อม HMR (port เริ่มต้น 3000)
npx elit dev

# หรือใช้ตัวเลือกกำหนดเอง
npx elit dev --port 8080 --root ./public`))),

      p('ตอนนี้ลองแก้ไข ', code('app.js'), ' - การเปลี่ยนแปลงจะปรากฏทันทีโดยไม่ต้อง refresh หน้า! 🎉'),

      h2('HMR ในการใช้งานจริง'),
      h3('ตัวอย่าง 1: อัปเดต UI'),
      p('แก้ไขแอปขณะที่กำลังทำงาน:'),

      pre(code(...codeBlock(`// ก่อน: ปุ่มธรรมดา
button({ onclick: () => count.value++ }, 'เพิ่ม')

// หลัง: ปุ่มที่มีสไตล์และ emoji
button({
  onclick: () => count.value++,
  style: 'background: #667eea; color: white; border: none; border-radius: 8px; padding: 12px 24px; cursor: pointer;'
}, '➕ เพิ่ม')

// HMR อัปเดตปุ่มทันที - ค่านับยังคงอยู่!`))),

      h3('ตัวอย่าง 2: เพิ่มฟีเจอร์ใหม่'),
      p('เพิ่มปุ่มลดโดยไม่สูญเสีย state:'),

      pre(code(...codeBlock(`const App = div({ id: 'app' },
  h1('HMR Demo'),
  reactive(count, value =>
    p({ style: 'font-size: 2rem; color: #667eea' }, \`นับ: \${value}\`)
  ),
  div({ style: 'display: flex; gap: 10px;' },
    button({ onclick: () => count.value++ }, '➕ เพิ่ม'),
    button({ onclick: () => count.value-- }, '➖ ลด'),      // ใหม่!
    button({ onclick: () => count.value = 0 }, '🔄 รีเซ็ต')  // ใหม่!
  )
);

// HMR ใช้การเปลี่ยนแปลง - ค่านับที่มีอยู่ยังคงอยู่!`))),

      h2('ฟีเจอร์ HMR ขั้นสูง'),

      h3('การรักษา State'),
      p('HMR รักษา state ของแอปพลิเคชันโดยค่าเริ่มต้น สำหรับ state ที่ซับซ้อน ใช้ state management:'),

      pre(code(...codeBlock(`import { createState } from 'elit';

// State คงอยู่ข้าม HMR updates
const appState = createState({
  user: { name: 'สมชาย', email: 'somchai@example.com' },
  todos: [],
  settings: { theme: 'dark', language: 'th' }
});

// แก้ไข components - state ยังคงอยู่!`))),

      h3('HMR กับ Router'),
      p('State ของ Router ถูกรักษาไว้ระหว่าง HMR:'),

      pre(code(...codeBlock(`import { createRouter, createRouterView } from 'elit';

const router = createRouter({
  mode: 'hash',
  routes: [
    { path: '/', component: HomePage },
    { path: '/about', component: AboutPage },
    { path: '/contact', component: ContactPage }
  ]
});

// นำทางไป /about แล้วแก้ไข AboutPage
// HMR อัปเดต component - ยังคงอยู่ที่ route /about!`))),

      h2('แนวทางปฏิบัติที่ดีของ HMR'),

      h3('1. เก็บ Components ให้ Pure'),
      pre(code(...codeBlock(`// ✅ ดี: Pure component
const Button = (text, onClick) =>
  button({ onclick: onClick }, text);

// ❌ ไม่ดี: Side effects ที่ระดับ module
const socket = new WebSocket('ws://localhost:3000'); // สร้างการเชื่อมต่อใหม่ทุกครั้งที่ HMR!`))),

      h3('2. ใช้ Reactive State'),
      pre(code(...codeBlock(`// ✅ ดี: Reactive state
const count = createState(0);
reactive(count, value => p(\`นับ: \${value}\`));

// ❌ ไม่ดี: จัดการ DOM โดยตรง
let count = 0;
document.getElementById('count').textContent = count; // สูญหายใน HMR`))),

      h3('3. แยก State และ UI'),
      pre(code(...codeBlock(`// state.js - การกำหนด State
export const userState = createState(null);
export const todosState = createState([]);

// App.js - UI components
import { userState, todosState } from './state.js';

// แก้ไข App.js อย่างอิสระ - state ใน state.js ถูกรักษาไว้!`))),

      h2('การกำหนดค่า HMR'),

      h3('ใช้ไฟล์กำหนดค่า'),
      p('สร้าง ', code('elit.config.ts'), ' เพื่อปรับแต่งพฤติกรรม HMR:'),
      pre(code(...codeBlock(`import { defineConfig } from 'elit';

export default defineConfig({
  dev: {
    port: 3000,
    root: './public',
    logging: true,
    open: true,
    clients: [
      {
        root: './public',
        basePath: '/',
        // ไฟล์ถูกติดตามโดยอัตโนมัติใน root directory
      }
    ]
  }
});`))),

      h3('ตัวเลือก CLI'),
      p('กำหนดค่า HMR ผ่าน CLI arguments:'),
      pre(code(...codeBlock(`# เริ่ม dev server ด้วยการกำหนดค่าเอง
npx elit dev --port 3000 --root ./public --no-open

# ตัวเลือกที่มี:
# --port, -p     หมายเลข Port (เริ่มต้น: 3000)
# --host, -h     Host ที่จะ bind (เริ่มต้น: localhost)
# --root, -r     Root directory ที่จะ serve
# --no-open      ไม่เปิด browser อัตโนมัติ
# --silent       ปิด logging`))),

      h2('การ Debug HMR'),

      h3('ตรวจสอบสถานะ HMR'),
      pre(code(...codeBlock(`// ใน browser console
console.log('HMR เปิดใช้งาน:', !!import.meta.hot);

// ฟัง HMR events
if (import.meta.hot) {
  import.meta.hot.on('update', () => {
    console.log('🔥 รับ HMR update แล้ว');
  });
}`))),

      h3('ปัญหาทั่วไป'),

      p(strong('ปัญหา 1: การเปลี่ยนแปลงไม่ปรากฏ')),
      ul(
        li('ตรวจสอบ browser console หา errors'),
        li('ตรวจสอบการเชื่อมต่อ WebSocket (ดูที่ ws:// ใน Network tab)'),
        li('ตรวจสอบว่าไฟล์อยู่ใน directory ที่ติดตาม'),
        li('ลบ browser cache ถ้าจำเป็น')
      ),

      p(strong('ปัญหา 2: State รีเซ็ตเมื่ออัปเดต')),
      ul(
        li('ย้ายการกำหนด state ไปยังไฟล์แยก'),
        li('ใช้ ', code('createState()'), ' แทน ', code('let'), ' variables'),
        li('หลีกเลี่ยง side effects ที่ระดับ module')
      ),

      h2('ตัวอย่างจริง: Todo App พร้อม HMR'),

      pre(code(...codeBlock(`// todos.js - State management
import { createState } from 'elit';

export const todosState = createState([
  { id: 1, text: 'เรียนรู้ Elit', done: false },
  { id: 2, text: 'ลอง HMR', done: false }
]);

export const addTodo = (text) => {
  const newTodo = {
    id: Date.now(),
    text,
    done: false
  };
  todosState.value = [...todosState.value, newTodo];
};

export const toggleTodo = (id) => {
  todosState.value = todosState.value.map(todo =>
    todo.id === id ? { ...todo, done: !todo.done } : todo
  );
};

export const deleteTodo = (id) => {
  todosState.value = todosState.value.filter(todo => todo.id !== id);
};`))),

      h2('ผลกระทบต่อประสิทธิภาพ'),
      p('HMR มีประสิทธิภาพสูงมาก:'),
      ul(
        li('⚡ ', strong('อัปเดตใน < 100ms'), ' - เร็วกว่า manual refresh'),
        li('📦 ', strong('เฉพาะ modules ที่เปลี่ยน'), ' - การถ่ายโอนข้อมูลน้อยที่สุด'),
        li('🎯 ', strong('อัปเดตแบบแม่นยำ'), ' - เฉพาะ components ที่ได้รับผลกระทบ re-render'),
        li('💾 ', strong('รักษา State'), ' - ไม่สูญเสียข้อมูลหรือการเริ่มต้นใหม่')
      ),

      h2('ข้อควรพิจารณาใน Production'),
      p(strong('สำคัญ:'), ' HMR เป็นฟีเจอร์ ', em('สำหรับการพัฒนาเท่านั้น'), ' และถูกปิดการใช้งานโดยอัตโนมัติใน production builds ตรวจสอบให้แน่ใจว่า:'),

      ul(
        li('ตั้งค่า ', code('NODE_ENV=production'), ' สำหรับ production builds'),
        li('ใช้ bundler ที่เหมาะสม (Vite, Rollup, etc.) สำหรับ production'),
        li('ทดสอบ production builds โดยไม่มี HMR เพื่อจับปัญหาเฉพาะสภาพแวดล้อม'),
        li('ลบการตรวจสอบ ', code('import.meta.hot'), ' ผ่าน dead code elimination ใน production')
      ),

      h2('สรุป'),
      p('Hot Module Replacement เปลี่ยนประสบการณ์การพัฒนาของคุณโดยให้ feedback ทันทีโดยไม่ต้อง refresh หน้า ด้วย Elit 2.0, HMR เปิดใช้งานโดยอัตโนมัติโดยไม่ต้องกำหนดค่าผ่าน CLI ในตัว (', code('npx elit dev'), ') ช่วยให้คุณมุ่งเน้นการสร้างแอปพลิเคชัน'),

      p('ประโยชน์หลัก:'),
      ul(
        li('✨ ', strong('Feedback ทันที'), ' - เห็นการเปลี่ยนแปลงทันทีที่คุณพิมพ์'),
        li('🔄 ', strong('รักษา State'), ' - ไม่สูญเสีย state ของแอปพลิเคชัน'),
        li('⚡ ', strong('ทำงานเร็วขึ้น'), ' - ประหยัดเวลาทุกครั้งที่เปลี่ยนแปลง!'),
        li('🎯 ', strong('ไม่ต้องกำหนดค่า'), ' - ทำงานได้ทันที'),
        li('💪 ', strong('พร้อม Production'), ' - ปิดการใช้งานโดยอัตโนมัติใน production')
      ),

      p('เริ่มใช้ HMR วันนี้และสัมผัสความแตกต่าง! เพียงรัน ', code('npx elit dev'), ' และลองแก้ไข components ของคุณขณะที่แอปกำลังทำงาน - ดูความมหัศจรรย์เกิดขึ้น 🔥✨')
    )
  }
};
