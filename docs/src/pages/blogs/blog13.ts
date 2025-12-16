import {
  div, h1, h2, h3, p, ul, li, pre, code, strong
} from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog13: BlogPostDetail = {
  id: '13',
  title: {
    en: 'Reactive Rendering with Elit',
    th: 'การ Render แบบ Reactive ด้วย Elit'
  },
  date: '2024-03-25',
  author: 'n-devs',
  tags: ['Tutorial', 'Reactive', 'Rendering', 'UI'],
  content: {
    en: div(
      p('Learn how to use Elit\'s reactive rendering helpers to build dynamic user interfaces that automatically update when state changes. This comprehensive guide covers the reactive() helper, reactiveAs() for custom wrapper tags, text binding, form input binding (bindValue, bindChecked), and advanced patterns for building real-time UIs.'),

      h2('What is Reactive Rendering?'),
      p('Reactive rendering is a pattern where UI components automatically update when the underlying state changes. Elit provides powerful reactive rendering helpers that:'),
      ul(
        li('Automatically re-render when state changes'),
        li('Use requestAnimationFrame for optimized rendering'),
        li('Handle null/false values gracefully with DOM placeholders'),
        li('Support both VNode and primitive value rendering'),
        li('Provide efficient DOM updates without full re-renders')
      ),

      h2('The reactive() Helper'),
      h3('Basic Usage'),
      p('The reactive() helper creates a reactive component that automatically updates when state changes:'),
      pre(code(...codeBlock(`import { createState, reactive, div, span, button } from 'elit';

// Create reactive state
const count = createState(0);

// Create reactive component
const Counter = reactive(count, (value) =>
  span(\`Count: \${value}\`)
);

// Create UI
const app = div(
  Counter,
  button({
    onclick: () => count.value++
  }, 'Increment')
);

document.body.appendChild(app.node);`))),

      h3('Rendering VNodes'),
      p('You can return full VNode structures from reactive render functions:'),
      pre(code(...codeBlock(`import { createState, reactive, div, h1, p, span } from 'elit';

const user = createState({
  name: 'John Doe',
  age: 30,
  online: true
});

const UserCard = reactive(user, (userData) =>
  div({ className: 'user-card' },
    h1(userData.name),
    p(\`Age: \${userData.age}\`),
    span({
      className: userData.online ? 'status-online' : 'status-offline'
    }, userData.online ? 'Online' : 'Offline')
  )
);

document.body.appendChild(UserCard.node);

// Update state - UI automatically updates
user.value = { ...user.value, online: false };`))),

      h3('Handling Null/False Values'),
      p('Reactive components gracefully handle null or false values by using DOM comment placeholders:'),
      pre(code(...codeBlock(`import { createState, reactive, div, p } from 'elit';

const message = createState<string | null>('Hello World');

const MessageDisplay = reactive(message, (msg) =>
  msg ? div({ className: 'message' }, p(msg)) : null
);

document.body.appendChild(MessageDisplay.node);

// Hide message - replaced with comment placeholder in DOM
message.value = null;

// Show message again - comment replaced with element
setTimeout(() => {
  message.value = 'Welcome back!';
}, 2000);`))),

      h2('The reactiveAs() Helper'),
      h3('Custom Wrapper Tags'),
      p('Use reactiveAs() when you need a specific wrapper element with custom props:'),
      pre(code(...codeBlock(`import { createState, reactiveAs, span, strong } from 'elit';

const count = createState(0);

// Reactive div with custom class
const Counter = reactiveAs('div', count, (value) =>
  span('Count: ', strong(String(value))),
  { className: 'counter-display', id: 'main-counter' }
);

document.body.appendChild(Counter.node);`))),

      h3('Conditional Visibility'),
      p('reactiveAs() handles null/false by hiding the wrapper element with display: none:'),
      pre(code(...codeBlock(`import { createState, reactiveAs, p, button, div } from 'elit';

const showNotification = createState(true);

const Notification = reactiveAs('div', showNotification, (show) =>
  show ? p('You have new messages!') : null,
  { className: 'notification' }
);

const app = div(
  Notification,
  button({
    onclick: () => showNotification.value = !showNotification.value
  }, 'Toggle Notification')
);

document.body.appendChild(app.node);`))),

      h2('Text Binding with text()'),
      h3('Simple Text Display'),
      p('The text() helper creates reactive text nodes:'),
      pre(code(...codeBlock(`import { createState, text, div, button } from 'elit';

const username = createState('Anonymous');

const app = div(
  'Welcome, ',
  text(username),
  '!',
  button({
    onclick: () => username.value = 'John Doe'
  }, 'Set Name')
);

document.body.appendChild(app.node);`))),

      h3('Dynamic Text Content'),
      p('Use text() for any value that can be converted to string:'),
      pre(code(...codeBlock(`import { createState, text, div, button } from 'elit';

const temperature = createState(20);

const app = div(
  'Temperature: ',
  text(temperature),
  '°C',
  button({
    onclick: () => temperature.value += 5
  }, '+5°C'),
  button({
    onclick: () => temperature.value -= 5
  }, '-5°C')
);

document.body.appendChild(app.node);`))),

      h2('Form Input Binding'),
      h3('bindValue() for Text Inputs'),
      p('The bindValue() helper creates two-way binding for input elements:'),
      pre(code(...codeBlock(`import { createState, bindValue, reactive, div, input, p } from 'elit';

const name = createState('');

const NameInput = div(
  input({
    type: 'text',
    placeholder: 'Enter your name',
    ...bindValue(name)
  }),
  reactive(name, (value) =>
    p(\`Hello, \${value || 'stranger'}!\`)
  )
);

document.body.appendChild(NameInput.node);`))),

      h3('bindChecked() for Checkboxes'),
      p('The bindChecked() helper creates two-way binding for checkbox elements:'),
      pre(code(...codeBlock(`import { createState, bindChecked, reactive, div, input, label, p } from 'elit';

const agreed = createState(false);

const Agreement = div(
  label(
    input({
      type: 'checkbox',
      ...bindChecked(agreed)
    }),
    ' I agree to the terms and conditions'
  ),
  reactive(agreed, (value) =>
    value
      ? p({ style: 'color: green' }, '✓ Thank you for agreeing')
      : p({ style: 'color: red' }, '✗ Please agree to continue')
  )
);

document.body.appendChild(Agreement.node);`))),

      h2('Advanced Patterns'),
      h3('Complex Form Example'),
      p('Building a complete form with multiple reactive inputs:'),
      pre(code(...codeBlock(`import {
  createState, bindValue, bindChecked, reactive,
  div, h2, input, label, button, p, ul, li
} from 'elit';

// Form state
const formData = createState({
  username: '',
  email: '',
  age: '',
  subscribe: false
});

// Update helpers
const updateField = (field: string) => (e: Event) => {
  formData.value = {
    ...formData.value,
    [field]: (e.target as HTMLInputElement).value
  };
};

const updateCheckbox = (field: string) => (e: Event) => {
  formData.value = {
    ...formData.value,
    [field]: (e.target as HTMLInputElement).checked
  };
};

// Form component
const RegistrationForm = div(
  h2('User Registration'),

  div(
    label('Username: '),
    input({
      type: 'text',
      oninput: updateField('username')
    })
  ),

  div(
    label('Email: '),
    input({
      type: 'email',
      oninput: updateField('email')
    })
  ),

  div(
    label('Age: '),
    input({
      type: 'number',
      oninput: updateField('age')
    })
  ),

  div(
    label(
      input({
        type: 'checkbox',
        onchange: updateCheckbox('subscribe')
      }),
      ' Subscribe to newsletter'
    )
  ),

  button({
    onclick: () => console.log('Submit:', formData.value)
  }, 'Submit'),

  // Reactive preview
  reactive(formData, (data) =>
    div({ style: 'margin-top: 20px; padding: 10px; background: #f5f5f5' },
      h2('Form Preview'),
      ul(
        li(\`Username: \${data.username || '(empty)'}\`),
        li(\`Email: \${data.email || '(empty)'}\`),
        li(\`Age: \${data.age || '(empty)'}\`),
        li(\`Newsletter: \${data.subscribe ? 'Yes' : 'No'}\`)
      )
    )
  )
);

document.body.appendChild(RegistrationForm.node);`))),

      h3('Reactive List Rendering'),
      p('Rendering lists that update automatically:'),
      pre(code(...codeBlock(`import { createState, reactive, div, button, ul, li, input } from 'elit';

const todos = createState<string[]>([]);
const newTodo = createState('');

const TodoApp = div(
  div(
    input({
      type: 'text',
      placeholder: 'New todo',
      value: newTodo.value,
      oninput: (e: Event) => {
        newTodo.value = (e.target as HTMLInputElement).value;
      }
    }),
    button({
      onclick: () => {
        if (newTodo.value.trim()) {
          todos.value = [...todos.value, newTodo.value];
          newTodo.value = '';
        }
      }
    }, 'Add')
  ),

  reactive(todos, (items) =>
    items.length > 0
      ? ul(
          ...items.map((item, index) =>
            li(
              item,
              button({
                onclick: () => {
                  todos.value = todos.value.filter((_, i) => i !== index);
                },
                style: 'margin-left: 10px'
              }, 'Delete')
            )
          )
        )
      : div('No todos yet')
  )
);

document.body.appendChild(TodoApp.node);`))),

      h3('Nested Reactive Components'),
      p('Building complex UIs with nested reactive components:'),
      pre(code(...codeBlock(`import {
  createState, reactive, div, h3, p, span, button
} from 'elit';

const appState = createState({
  user: { name: 'John', status: 'online' },
  notifications: 3,
  theme: 'light'
});

// Nested reactive component
const UserWidget = reactive(appState, (state) =>
  div({
    className: \`user-widget theme-\${state.theme}\`
  },
    // Nested reactive for user status
    reactive(
      createState(state.user),
      (user) =>
        div(
          h3(user.name),
          span({
            className: \`status-\${user.status}\`
          }, user.status)
        )
    ),

    // Nested reactive for notifications
    reactive(
      createState(state.notifications),
      (count) =>
        count > 0
          ? p(\`You have \${count} notifications\`)
          : p('No notifications')
    )
  )
);

const app = div(
  UserWidget,
  button({
    onclick: () => {
      appState.value = {
        ...appState.value,
        notifications: appState.value.notifications + 1
      };
    }
  }, 'Add Notification'),
  button({
    onclick: () => {
      appState.value = {
        ...appState.value,
        theme: appState.value.theme === 'light' ? 'dark' : 'light'
      };
    }
  }, 'Toggle Theme')
);

document.body.appendChild(app.node);`))),

      h2('Performance Considerations'),
      h3('requestAnimationFrame Optimization'),
      p('Elit\'s reactive helpers use requestAnimationFrame to batch updates:'),
      pre(code(...codeBlock(`import { createState, reactive, div } from 'elit';

const counter = createState(0);

// Multiple rapid updates are batched
const RapidUpdater = div(
  reactive(counter, (value) => div(\`Count: \${value}\`)),
  button({
    onclick: () => {
      // These updates are batched into a single render
      counter.value++;
      counter.value++;
      counter.value++;
    }
  }, 'Add 3')
);`))),

      h3('Efficient DOM Updates'),
      p('Reactive components only update their own DOM subtree:'),
      pre(code(...codeBlock(`import { createState, reactive, div, h1 } from 'elit';

const title = createState('Page Title');
const content = createState('Content here');

// Only the reactive component that depends on changed state re-renders
const Page = div(
  h1('Static header - never re-renders'),
  reactive(title, (t) => div(\`Title: \${t}\`)),  // Re-renders when title changes
  reactive(content, (c) => div(\`Content: \${c}\`)),  // Re-renders when content changes
  div('Static footer - never re-renders')
);

// Only title reactive component updates
title.value = 'New Title';

// Only content reactive component updates
content.value = 'New Content';`))),

      h2('Best Practices'),
      ul(
        li('Use reactive() for components that need to update when state changes'),
        li('Use reactiveAs() when you need a specific wrapper element'),
        li('Use text() for simple text bindings'),
        li('Use bindValue() and bindChecked() for form inputs'),
        li('Keep render functions pure - they should only depend on the state parameter'),
        li('Avoid expensive operations in render functions'),
        li('Use computed state for derived values instead of computing in render function'),
        li('Handle null/false values explicitly for better UX')
      ),

      h2('Complete Real-World Example'),
      h3('Live Search Component'),
      p('Here\'s a complete example of a live search component with reactive rendering:'),
      pre(code(...codeBlock(`import {
  createState, reactive, bindValue, div, h2, input, ul, li, p
} from 'elit';

// Mock data
const allUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
  { id: 4, name: 'Alice Williams', email: 'alice@example.com' }
];

// Search state
const searchQuery = createState('');
const filteredUsers = createState(allUsers);

// Update filtered results when search changes
searchQuery.subscribe((query) => {
  const q = query.toLowerCase();
  filteredUsers.value = allUsers.filter(user =>
    user.name.toLowerCase().includes(q) ||
    user.email.toLowerCase().includes(q)
  );
});

// Search component
const UserSearch = div(
  h2('User Search'),

  input({
    type: 'text',
    placeholder: 'Search users...',
    style: 'width: 100%; padding: 8px; margin-bottom: 16px',
    ...bindValue(searchQuery)
  }),

  reactive(filteredUsers, (users) =>
    users.length > 0
      ? ul(
          ...users.map(user =>
            li({ style: 'margin: 8px 0' },
              div(
                strong(user.name),
                br(),
                span({ style: 'color: #666' }, user.email)
              )
            )
          )
        )
      : p({ style: 'color: #999' }, 'No users found')
  )
);

document.body.appendChild(UserSearch.node);`))),

      h2('Summary'),
      p('Elit\'s reactive rendering helpers provide a powerful and efficient way to build dynamic UIs:'),
      ul(
        li('reactive() - Create reactive components that auto-update'),
        li('reactiveAs() - Reactive components with custom wrapper elements'),
        li('text() - Simple reactive text binding'),
        li('bindValue() - Two-way binding for text inputs'),
        li('bindChecked() - Two-way binding for checkboxes')
      ),

      h2('Conclusion'),
      p('Reactive rendering in Elit provides an intuitive and efficient way to build dynamic user interfaces. The reactive helpers automatically handle DOM updates using requestAnimationFrame for optimal performance, gracefully handle null/false values with placeholders, and support both VNode and primitive value rendering. Whether you\'re building simple counters or complex forms with live validation, Elit\'s reactive system keeps your code clean and your UI responsive.'),
      p('Key takeaways: Use reactive() for automatic UI updates, bindValue()/bindChecked() for forms, text() for simple text display, and keep render functions pure. The requestAnimationFrame batching ensures optimal performance even with rapid state changes.')
    ),
    th: div(
      p('เรียนรู้วิธีใช้ reactive rendering helpers ของ Elit เพื่อสร้าง user interfaces แบบไดนามิกที่อัปเดตอัตโนมัติเมื่อ state เปลี่ยนแปลง คู่มือฉบับสมบูรณ์นี้ครอบคลุม reactive() helper, reactiveAs() สำหรับ custom wrapper tags, text binding, form input binding (bindValue, bindChecked) และรูปแบบขั้นสูงสำหรับสร้าง real-time UIs'),

      h2('Reactive Rendering คืออะไร?'),
      p('Reactive rendering เป็นรูปแบบที่ UI components อัปเดตอัตโนมัติเมื่อ state เปลี่ยนแปลง Elit มี reactive rendering helpers ที่ทรงพลัง:'),
      ul(
        li('อัปเดตอัตโนมัติเมื่อ state เปลี่ยนแปลง'),
        li('ใช้ requestAnimationFrame สำหรับ rendering ที่เหมาะสม'),
        li('จัดการค่า null/false อย่างเหมาะสมด้วย DOM placeholders'),
        li('รองรับทั้ง VNode และ primitive value rendering'),
        li('อัปเดต DOM อย่างมีประสิทธิภาพโดยไม่ต้อง re-render ทั้งหมด')
      ),

      h2('reactive() Helper'),
      h3('การใช้งานพื้นฐาน'),
      p('reactive() helper สร้าง reactive component ที่อัปเดตอัตโนมัติเมื่อ state เปลี่ยนแปลง:'),
      pre(code(...codeBlock(`import { createState, reactive, div, span, button } from 'elit';

// สร้าง reactive state
const count = createState(0);

// สร้าง reactive component
const Counter = reactive(count, (value) =>
  span(\`นับ: \${value}\`)
);

// สร้าง UI
const app = div(
  Counter,
  button({
    onclick: () => count.value++
  }, 'เพิ่ม')
);

document.body.appendChild(app.node);`))),

      h3('Rendering VNodes'),
      p('คุณสามารถ return โครงสร้าง VNode เต็มรูปแบบจาก reactive render functions:'),
      pre(code(...codeBlock(`import { createState, reactive, div, h1, p, span } from 'elit';

const user = createState({
  name: 'สมชาย ใจดี',
  age: 30,
  online: true
});

const UserCard = reactive(user, (userData) =>
  div({ className: 'user-card' },
    h1(userData.name),
    p(\`อายุ: \${userData.age}\`),
    span({
      className: userData.online ? 'status-online' : 'status-offline'
    }, userData.online ? 'ออนไลน์' : 'ออฟไลน์')
  )
);

document.body.appendChild(UserCard.node);

// อัปเดต state - UI อัปเดตอัตโนมัติ
user.value = { ...user.value, online: false };`))),

      h3('จัดการค่า Null/False'),
      p('Reactive components จัดการค่า null หรือ false อย่างเหมาะสมโดยใช้ DOM comment placeholders:'),
      pre(code(...codeBlock(`import { createState, reactive, div, p } from 'elit';

const message = createState<string | null>('สวัสดีชาวโลก');

const MessageDisplay = reactive(message, (msg) =>
  msg ? div({ className: 'message' }, p(msg)) : null
);

document.body.appendChild(MessageDisplay.node);

// ซ่อนข้อความ - แทนที่ด้วย comment placeholder ใน DOM
message.value = null;

// แสดงข้อความอีกครั้ง - comment แทนที่ด้วย element
setTimeout(() => {
  message.value = 'ยินดีต้อนรับกลับมา!';
}, 2000);`))),

      h2('reactiveAs() Helper'),
      h3('Custom Wrapper Tags'),
      p('ใช้ reactiveAs() เมื่อคุณต้องการ wrapper element เฉพาะพร้อม custom props:'),
      pre(code(...codeBlock(`import { createState, reactiveAs, span, strong } from 'elit';

const count = createState(0);

// Reactive div พร้อม custom class
const Counter = reactiveAs('div', count, (value) =>
  span('นับ: ', strong(String(value))),
  { className: 'counter-display', id: 'main-counter' }
);

document.body.appendChild(Counter.node);`))),

      h3('Conditional Visibility'),
      p('reactiveAs() จัดการ null/false โดยซ่อน wrapper element ด้วย display: none:'),
      pre(code(...codeBlock(`import { createState, reactiveAs, p, button, div } from 'elit';

const showNotification = createState(true);

const Notification = reactiveAs('div', showNotification, (show) =>
  show ? p('คุณมีข้อความใหม่!') : null,
  { className: 'notification' }
);

const app = div(
  Notification,
  button({
    onclick: () => showNotification.value = !showNotification.value
  }, 'สลับการแจ้งเตือน')
);

document.body.appendChild(app.node);`))),

      h2('Text Binding ด้วย text()'),
      h3('การแสดงข้อความแบบง่าย'),
      p('text() helper สร้าง reactive text nodes:'),
      pre(code(...codeBlock(`import { createState, text, div, button } from 'elit';

const username = createState('ไม่ระบุชื่อ');

const app = div(
  'ยินดีต้อนรับ, ',
  text(username),
  '!',
  button({
    onclick: () => username.value = 'สมชาย ใจดี'
  }, 'ตั้งชื่อ')
);

document.body.appendChild(app.node);`))),

      h3('เนื้อหาข้อความแบบไดนามิก'),
      p('ใช้ text() สำหรับค่าใดๆ ที่สามารถแปลงเป็น string ได้:'),
      pre(code(...codeBlock(`import { createState, text, div, button } from 'elit';

const temperature = createState(20);

const app = div(
  'อุณหภูมิ: ',
  text(temperature),
  '°C',
  button({
    onclick: () => temperature.value += 5
  }, '+5°C'),
  button({
    onclick: () => temperature.value -= 5
  }, '-5°C')
);

document.body.appendChild(app.node);`))),

      h2('Form Input Binding'),
      h3('bindValue() สำหรับ Text Inputs'),
      p('bindValue() helper สร้าง two-way binding สำหรับ input elements:'),
      pre(code(...codeBlock(`import { createState, bindValue, reactive, div, input, p } from 'elit';

const name = createState('');

const NameInput = div(
  input({
    type: 'text',
    placeholder: 'กรอกชื่อของคุณ',
    ...bindValue(name)
  }),
  reactive(name, (value) =>
    p(\`สวัสดี, \${value || 'คนแปลกหน้า'}!\`)
  )
);

document.body.appendChild(NameInput.node);`))),

      h3('bindChecked() สำหรับ Checkboxes'),
      p('bindChecked() helper สร้าง two-way binding สำหรับ checkbox elements:'),
      pre(code(...codeBlock(`import { createState, bindChecked, reactive, div, input, label, p } from 'elit';

const agreed = createState(false);

const Agreement = div(
  label(
    input({
      type: 'checkbox',
      ...bindChecked(agreed)
    }),
    ' ฉันยอมรับข้อกำหนดและเงื่อนไข'
  ),
  reactive(agreed, (value) =>
    value
      ? p({ style: 'color: green' }, '✓ ขอบคุณที่ยอมรับ')
      : p({ style: 'color: red' }, '✗ กรุณายอมรับเพื่อดำเนินการต่อ')
  )
);

document.body.appendChild(Agreement.node);`))),

      h2('รูปแบบขั้นสูง'),
      h3('ตัวอย่าง Form ที่ซับซ้อน'),
      p('สร้าง form เต็มรูปแบบด้วย reactive inputs หลายตัว:'),
      pre(code(...codeBlock(`import {
  createState, bindValue, bindChecked, reactive,
  div, h2, input, label, button, p, ul, li
} from 'elit';

// Form state
const formData = createState({
  username: '',
  email: '',
  age: '',
  subscribe: false
});

// Update helpers
const updateField = (field: string) => (e: Event) => {
  formData.value = {
    ...formData.value,
    [field]: (e.target as HTMLInputElement).value
  };
};

const updateCheckbox = (field: string) => (e: Event) => {
  formData.value = {
    ...formData.value,
    [field]: (e.target as HTMLInputElement).checked
  };
};

// Form component
const RegistrationForm = div(
  h2('ลงทะเบียนผู้ใช้'),

  div(
    label('ชื่อผู้ใช้: '),
    input({
      type: 'text',
      oninput: updateField('username')
    })
  ),

  div(
    label('อีเมล: '),
    input({
      type: 'email',
      oninput: updateField('email')
    })
  ),

  div(
    label('อายุ: '),
    input({
      type: 'number',
      oninput: updateField('age')
    })
  ),

  div(
    label(
      input({
        type: 'checkbox',
        onchange: updateCheckbox('subscribe')
      }),
      ' สมัครรับจดหมายข่าว'
    )
  ),

  button({
    onclick: () => console.log('ส่ง:', formData.value)
  }, 'ส่ง'),

  // Reactive preview
  reactive(formData, (data) =>
    div({ style: 'margin-top: 20px; padding: 10px; background: #f5f5f5' },
      h2('ตัวอย่าง Form'),
      ul(
        li(\`ชื่อผู้ใช้: \${data.username || '(ว่าง)'}\`),
        li(\`อีเมล: \${data.email || '(ว่าง)'}\`),
        li(\`อายุ: \${data.age || '(ว่าง)'}\`),
        li(\`จดหมายข่าว: \${data.subscribe ? 'ใช่' : 'ไม่'}\`)
      )
    )
  )
);

document.body.appendChild(RegistrationForm.node);`))),

      h3('Reactive List Rendering'),
      p('Rendering lists ที่อัปเดตอัตโนมัติ:'),
      pre(code(...codeBlock(`import { createState, reactive, div, button, ul, li, input } from 'elit';

const todos = createState<string[]>([]);
const newTodo = createState('');

const TodoApp = div(
  div(
    input({
      type: 'text',
      placeholder: 'สิ่งที่ต้องทำใหม่',
      value: newTodo.value,
      oninput: (e: Event) => {
        newTodo.value = (e.target as HTMLInputElement).value;
      }
    }),
    button({
      onclick: () => {
        if (newTodo.value.trim()) {
          todos.value = [...todos.value, newTodo.value];
          newTodo.value = '';
        }
      }
    }, 'เพิ่ม')
  ),

  reactive(todos, (items) =>
    items.length > 0
      ? ul(
          ...items.map((item, index) =>
            li(
              item,
              button({
                onclick: () => {
                  todos.value = todos.value.filter((_, i) => i !== index);
                },
                style: 'margin-left: 10px'
              }, 'ลบ')
            )
          )
        )
      : div('ยังไม่มีสิ่งที่ต้องทำ')
  )
);

document.body.appendChild(TodoApp.node);`))),

      h3('Nested Reactive Components'),
      p('สร้าง UIs ที่ซับซ้อนด้วย nested reactive components:'),
      pre(code(...codeBlock(`import {
  createState, reactive, div, h3, p, span, button
} from 'elit';

const appState = createState({
  user: { name: 'สมชาย', status: 'online' },
  notifications: 3,
  theme: 'light'
});

// Nested reactive component
const UserWidget = reactive(appState, (state) =>
  div({
    className: \`user-widget theme-\${state.theme}\`
  },
    // Nested reactive for user status
    reactive(
      createState(state.user),
      (user) =>
        div(
          h3(user.name),
          span({
            className: \`status-\${user.status}\`
          }, user.status === 'online' ? 'ออนไลน์' : 'ออฟไลน์')
        )
    ),

    // Nested reactive for notifications
    reactive(
      createState(state.notifications),
      (count) =>
        count > 0
          ? p(\`คุณมี \${count} การแจ้งเตือน\`)
          : p('ไม่มีการแจ้งเตือน')
    )
  )
);

const app = div(
  UserWidget,
  button({
    onclick: () => {
      appState.value = {
        ...appState.value,
        notifications: appState.value.notifications + 1
      };
    }
  }, 'เพิ่มการแจ้งเตือน'),
  button({
    onclick: () => {
      appState.value = {
        ...appState.value,
        theme: appState.value.theme === 'light' ? 'dark' : 'light'
      };
    }
  }, 'สลับธีม')
);

document.body.appendChild(app.node);`))),

      h2('ข้อควรพิจารณาด้านประสิทธิภาพ'),
      h3('การเพิ่มประสิทธิภาพด้วย requestAnimationFrame'),
      p('Reactive helpers ของ Elit ใช้ requestAnimationFrame เพื่อ batch updates:'),
      pre(code(...codeBlock(`import { createState, reactive, div } from 'elit';

const counter = createState(0);

// การอัปเดตหลายครั้งอย่างรวดเร็วจะถูก batch
const RapidUpdater = div(
  reactive(counter, (value) => div(\`นับ: \${value}\`)),
  button({
    onclick: () => {
      // การอัปเดตเหล่านี้จะถูก batch เป็นการ render เดียว
      counter.value++;
      counter.value++;
      counter.value++;
    }
  }, 'เพิ่ม 3')
);`))),

      h3('การอัปเดต DOM อย่างมีประสิทธิภาพ'),
      p('Reactive components อัปเดตเฉพาะ DOM subtree ของตัวเอง:'),
      pre(code(...codeBlock(`import { createState, reactive, div, h1 } from 'elit';

const title = createState('หัวเรื่องหน้า');
const content = createState('เนื้อหาที่นี่');

// เฉพาะ reactive component ที่ขึ้นกับ state ที่เปลี่ยนแปลงจะ re-render
const Page = div(
  h1('หัวข้อคงที่ - ไม่เคย re-render'),
  reactive(title, (t) => div(\`หัวเรื่อง: \${t}\`)),  // Re-render เมื่อ title เปลี่ยน
  reactive(content, (c) => div(\`เนื้อหา: \${c}\`)),  // Re-render เมื่อ content เปลี่ยน
  div('ส่วนท้ายคงที่ - ไม่เคย re-render')
);

// เฉพาะ title reactive component อัปเดต
title.value = 'หัวเรื่องใหม่';

// เฉพาะ content reactive component อัปเดต
content.value = 'เนื้อหาใหม่';`))),

      h2('แนวทางปฏิบัติที่ดี'),
      ul(
        li('ใช้ reactive() สำหรับ components ที่ต้องอัปเดตเมื่อ state เปลี่ยนแปลง'),
        li('ใช้ reactiveAs() เมื่อต้องการ wrapper element เฉพาะ'),
        li('ใช้ text() สำหรับ text bindings แบบง่าย'),
        li('ใช้ bindValue() และ bindChecked() สำหรับ form inputs'),
        li('รักษา render functions ให้ pure - ควรขึ้นกับ state parameter เท่านั้น'),
        li('หลีกเลี่ยงการทำงานที่มีค่าใช้จ่ายสูงใน render functions'),
        li('ใช้ computed state สำหรับ derived values แทนการคำนวณใน render function'),
        li('จัดการค่า null/false อย่างชัดเจนเพื่อ UX ที่ดีขึ้น')
      ),

      h2('ตัวอย่างในโลกจริงที่สมบูรณ์'),
      h3('Live Search Component'),
      p('นี่คือตัวอย่างที่สมบูรณ์ของ live search component พร้อม reactive rendering:'),
      pre(code(...codeBlock(`import {
  createState, reactive, bindValue, div, h2, input, ul, li, p
} from 'elit';

// ข้อมูล Mock
const allUsers = [
  { id: 1, name: 'สมชาย ใจดี', email: 'somchai@example.com' },
  { id: 2, name: 'สมหญิง รักสนุก', email: 'somying@example.com' },
  { id: 3, name: 'บัวผัน สวยงาม', email: 'buapan@example.com' },
  { id: 4, name: 'แสงดาว ใสสว่าง', email: 'sangdao@example.com' }
];

// Search state
const searchQuery = createState('');
const filteredUsers = createState(allUsers);

// อัปเดตผลลัพธ์ที่กรองเมื่อการค้นหาเปลี่ยน
searchQuery.subscribe((query) => {
  const q = query.toLowerCase();
  filteredUsers.value = allUsers.filter(user =>
    user.name.toLowerCase().includes(q) ||
    user.email.toLowerCase().includes(q)
  );
});

// Search component
const UserSearch = div(
  h2('ค้นหาผู้ใช้'),

  input({
    type: 'text',
    placeholder: 'ค้นหาผู้ใช้...',
    style: 'width: 100%; padding: 8px; margin-bottom: 16px',
    ...bindValue(searchQuery)
  }),

  reactive(filteredUsers, (users) =>
    users.length > 0
      ? ul(
          ...users.map(user =>
            li({ style: 'margin: 8px 0' },
              div(
                strong(user.name),
                br(),
                span({ style: 'color: #666' }, user.email)
              )
            )
          )
        )
      : p({ style: 'color: #999' }, 'ไม่พบผู้ใช้')
  )
);

document.body.appendChild(UserSearch.node);`))),

      h2('สรุป'),
      p('Reactive rendering helpers ของ Elit ให้วิธีที่ทรงพลังและมีประสิทธิภาพในการสร้าง dynamic UIs:'),
      ul(
        li('reactive() - สร้าง reactive components ที่อัปเดตอัตโนมัติ'),
        li('reactiveAs() - Reactive components พร้อม custom wrapper elements'),
        li('text() - Reactive text binding แบบง่าย'),
        li('bindValue() - Two-way binding สำหรับ text inputs'),
        li('bindChecked() - Two-way binding สำหรับ checkboxes')
      ),

      h2('สรุป'),
      p('Reactive rendering ใน Elit ให้วิธีที่ใช้งานง่ายและมีประสิทธิภาพในการสร้าง user interfaces แบบไดนามิก Reactive helpers จัดการการอัปเดต DOM อัตโนมัติโดยใช้ requestAnimationFrame เพื่อประสิทธิภาพที่เหมาะสม จัดการค่า null/false อย่างเหมาะสมด้วย placeholders และรองรับทั้ง VNode และ primitive value rendering ไม่ว่าคุณจะสร้าง counters แบบง่ายหรือ forms ที่ซับซ้อนพร้อม live validation ระบบ reactive ของ Elit ทำให้โค้ดของคุณสะอาดและ UI ตอบสนอง'),
      p('สรุปสำคัญ: ใช้ reactive() สำหรับการอัปเดต UI อัตโนมัติ, bindValue()/bindChecked() สำหรับ forms, text() สำหรับการแสดงข้อความแบบง่าย และรักษา render functions ให้ pure การ batch ด้วย requestAnimationFrame ช่วยให้ประสิทธิภาพเหมาะสมแม้จะมีการเปลี่ยนแปลง state อย่างรวดเร็ว')
    )
  }
};
