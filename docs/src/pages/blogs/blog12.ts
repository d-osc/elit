import { div, h2, h3, p, ul, li, pre, code } from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog12: BlogPostDetail = {
  id: '12',
  title: {
    en: 'State Management in Elit',
    th: 'การจัดการ State ใน Elit'
  },
  date: '2024-03-20',
  author: 'n-devs',
  tags: ['Tutorial', 'State', 'Reactive', 'Performance'],
  content: {
    en: div(
      p('Master Elit\'s powerful reactive state management system. This comprehensive guide covers createState, computed values, effects, reactive helpers, performance optimizations with batchRender and renderChunked, virtual lists, lazy loading, and advanced patterns for building reactive applications.'),

      h2('What is State Management in Elit?'),
      p('Elit provides a lightweight, reactive state management system built directly into the framework. It offers fine-grained reactivity without virtual DOM overhead, making it perfect for building performant, reactive applications.'),
      ul(
        li('createState - Reactive state variables'),
        li('computed - Derived state from multiple sources'),
        li('effect - Side effects that respond to state changes'),
        li('reactive - Automatic UI updates'),
        li('batchRender - Batch multiple DOM updates'),
        li('renderChunked - Progressive rendering for large lists'),
        li('createVirtualList - Virtual scrolling for thousands of items'),
        li('lazy - Lazy component loading'),
        li('throttle/debounce - Performance helpers')
      ),

      h2('Basic State'),
      h3('Creating State'),
      p('Create reactive state with createState:'),
      pre(code(...codeBlock(`import { createState, div, button, span } from 'elit';

// Create a reactive counter
const count = createState(0);

// Create component
const Counter = div(
  span(\`Count: \${count.value}\`),
  button({
    onclick: () => {
      count.value++; // Update state
    }
  }, 'Increment')
);

// Subscribe to changes
count.subscribe((value) => {
  console.log('Count changed to:', value);
});

// Get current value
console.log(count.value); // 0

// Set new value
count.value = 5;`))),

      h3('State with Options'),
      p('Configure state behavior with options:'),
      pre(code(...codeBlock(`import { createState } from 'elit';

// State with comparison function
const user = createState(
  { name: 'John', age: 30 },
  {
    equals: (a, b) => a.name === b.name && a.age === b.age
  }
);

// Only triggers update if deeply different
user.value = { name: 'John', age: 30 }; // No update
user.value = { name: 'Jane', age: 25 }; // Triggers update`))),

      h2('Reactive UI Updates'),
      h3('Using reactive()'),
      p('Create reactive UI that automatically updates:'),
      pre(code(...codeBlock(`import { createState, reactive, div, input, p } from 'elit';

const name = createState('');

const Greeting = div(
  input({
    type: 'text',
    oninput: (e: Event) => {
      name.value = (e.target as HTMLInputElement).value;
    },
    placeholder: 'Enter your name'
  }),

  // Reactive paragraph that updates automatically
  reactive(name, (value) =>
    p(\`Hello, \${value || 'stranger'}!\`)
  )
);`))),

      h3('Multiple State Dependencies'),
      p('React to multiple state changes:'),
      pre(code(...codeBlock(`import { createState, reactive, div, p } from 'elit';

const firstName = createState('John');
const lastName = createState('Doe');

const Profile = div(
  reactive(firstName, (first) =>
    p(\`First name: \${first}\`)
  ),
  reactive(lastName, (last) =>
    p(\`Last name: \${last}\`)
  )
);`))),

      h2('Computed Values'),
      h3('Derived State'),
      p('Create computed values that derive from other state:'),
      pre(code(...codeBlock(`import { createState, computed, reactive, div, p } from 'elit';

const firstName = createState('John');
const lastName = createState('Doe');

// Computed full name
const fullName = computed([firstName, lastName], (first, last) => {
  return \`\${first} \${last}\`;
});

const Profile = div(
  reactive(fullName, (name) =>
    p(\`Full name: \${name}\`)
  )
);

// Update source states
firstName.value = 'Jane'; // fullName automatically updates`))),

      h3('Complex Computations'),
      p('Chain computed values for complex derivations:'),
      pre(code(...codeBlock(`import { createState, computed } from 'elit';

const price = createState(100);
const quantity = createState(2);
const taxRate = createState(0.1);

// Computed subtotal
const subtotal = computed([price, quantity], (p, q) => p * q);

// Computed tax
const tax = computed([subtotal, taxRate], (sub, rate) => sub * rate);

// Computed total
const total = computed([subtotal, tax], (sub, t) => sub + t);

console.log(total.value); // 220

// Update price
price.value = 150;
console.log(total.value); // 330 (automatically recalculated)`))),

      h2('Effects'),
      h3('Side Effects'),
      p('Run side effects when state changes:'),
      pre(code(...codeBlock(`import { createState, effect } from 'elit';

const theme = createState('light');

// Effect runs when theme changes
effect(() => {
  document.body.className = theme.value;
  console.log('Theme changed to:', theme.value);
});

// Change theme
theme.value = 'dark'; // Effect runs, updates body class`))),

      h3('Cleanup Effects'),
      p('Effects can return cleanup functions:'),
      pre(code(...codeBlock(`import { createState, effect } from 'elit';

const isOnline = createState(true);

effect(() => {
  const handler = () => {
    isOnline.value = navigator.onLine;
  };

  window.addEventListener('online', handler);
  window.addEventListener('offline', handler);

  // Cleanup function
  return () => {
    window.removeEventListener('online', handler);
    window.removeEventListener('offline', handler);
  };
});`))),

      h2('Forms and Input Binding'),
      h3('Text Input'),
      p('Bind state to form inputs:'),
      pre(code(...codeBlock(`import { createState, reactive, div, input, p } from 'elit';

const username = createState('');
const email = createState('');

const Form = div(
  input({
    type: 'text',
    value: username.value,
    oninput: (e: Event) => {
      username.value = (e.target as HTMLInputElement).value;
    },
    placeholder: 'Username'
  }),

  input({
    type: 'email',
    value: email.value,
    oninput: (e: Event) => {
      email.value = (e.target as HTMLInputElement).value;
    },
    placeholder: 'Email'
  }),

  reactive(username, (user) => p(\`Username: \${user}\`)),
  reactive(email, (e) => p(\`Email: \${e}\`))
);`))),

      h3('Checkbox and Radio'),
      p('Bind checkboxes and radio buttons:'),
      pre(code(...codeBlock(`import { createState, reactive, div, input, label, p } from 'elit';

const agreed = createState(false);
const selectedColor = createState('red');

const Preferences = div(
  // Checkbox
  label(
    input({
      type: 'checkbox',
      checked: agreed.value,
      onchange: (e: Event) => {
        agreed.value = (e.target as HTMLInputElement).checked;
      }
    }),
    'I agree to terms'
  ),

  reactive(agreed, (val) =>
    p(\`Agreed: \${val}\`)
  ),

  // Radio buttons
  ['red', 'blue', 'green'].map(color =>
    label(
      input({
        type: 'radio',
        name: 'color',
        value: color,
        checked: selectedColor.value === color,
        onchange: () => {
          selectedColor.value = color;
        }
      }),
      color
    )
  ),

  reactive(selectedColor, (color) =>
    p(\`Selected color: \${color}\`)
  )
);`))),

      h2('Lists and Arrays'),
      h3('Dynamic Lists'),
      p('Manage lists with reactive state:'),
      pre(code(...codeBlock(`import { createState, reactive, div, input, button, ul, li } from 'elit';

const todos = createState<string[]>([]);
const newTodo = createState('');

const TodoApp = div(
  input({
    type: 'text',
    value: newTodo.value,
    oninput: (e: Event) => {
      newTodo.value = (e.target as HTMLInputElement).value;
    },
    placeholder: 'New todo'
  }),

  button({
    onclick: () => {
      if (newTodo.value.trim()) {
        todos.value = [...todos.value, newTodo.value];
        newTodo.value = '';
      }
    }
  }, 'Add'),

  reactive(todos, (items) =>
    ul(
      ...items.map((todo, index) =>
        li(
          todo,
          button({
            onclick: () => {
              todos.value = todos.value.filter((_, i) => i !== index);
            }
          }, 'Delete')
        )
      )
    )
  )
);`))),

      h2('Performance Optimization'),
      h3('Batch Rendering'),
      p('Batch multiple elements for efficient rendering:'),
      pre(code(...codeBlock(`import { batchRender, div, p } from 'elit';

// Create large list of elements
const items = Array.from({ length: 1000 }, (_, i) =>
  div({ className: 'item' },
    p(\`Item \${i}\`)
  )
);

// Render all at once efficiently
const container = batchRender('#app', items);`))),

      h3('Chunked Rendering'),
      p('Render large lists progressively to avoid blocking:'),
      pre(code(...codeBlock(`import { renderChunked, div, p } from 'elit';

// Create very large list
const items = Array.from({ length: 10000 }, (_, i) =>
  div({ className: 'item' },
    p(\`Item \${i}\`)
  )
);

// Render in chunks with progress callback
renderChunked(
  '#app',
  items,
  100, // Chunk size
  (current, total) => {
    console.log(\`Rendered \${current} of \${total}\`);
  }
);`))),

      h3('Virtual Lists'),
      p('Handle thousands of items with virtual scrolling:'),
      pre(code(...codeBlock(`import { createVirtualList, div, p } from 'elit';

// Large dataset
const data = Array.from({ length: 100000 }, (_, i) => ({
  id: i,
  name: \`Item \${i}\`,
  description: \`Description for item \${i}\`
}));

// Container element
const container = document.getElementById('list-container') as HTMLElement;

// Create virtual list
const virtualList = createVirtualList(
  container,
  data,
  (item, index) =>
    div({ className: 'list-item' },
      p(\`\${item.name}\`),
      p({ className: 'description' }, item.description)
    ),
  60, // Item height in pixels
  5   // Buffer size (items to render outside viewport)
);

// Update data
virtualList.updateItems(data.slice(0, 50000));

// Scroll to specific item
virtualList.scrollToItem(1000);

// Cleanup when done
virtualList.destroy();`))),

      h2('Lazy Loading'),
      h3('Lazy Components'),
      p('Load components on demand:'),
      pre(code(...codeBlock(`import { lazy, div, button, createState } from 'elit';

// Lazy load heavy component
const HeavyChart = lazy(() =>
  import('./HeavyChart').then(m => m.HeavyChart)
);

const showChart = createState(false);

const Dashboard = div(
  button({
    onclick: () => {
      showChart.value = true;
    }
  }, 'Show Chart'),

  reactive(showChart, (show) =>
    show ? HeavyChart() : div('Click to load chart')
  )
);`))),

      h2('Throttle and Debounce'),
      h3('Throttle'),
      p('Limit function execution rate:'),
      pre(code(...codeBlock(`import { throttle, createState } from 'elit';

const scrollPosition = createState(0);

// Throttled scroll handler (max once per 100ms)
const handleScroll = throttle(() => {
  scrollPosition.value = window.scrollY;
}, 100);

window.addEventListener('scroll', handleScroll);`))),

      h3('Debounce'),
      p('Delay execution until activity stops:'),
      pre(code(...codeBlock(`import { debounce, createState } from 'elit';

const searchQuery = createState('');

// Debounced search (waits 300ms after typing stops)
const performSearch = debounce((query: string) => {
  console.log('Searching for:', query);
  // Perform API call
  fetch(\`/api/search?q=\${query}\`)
    .then(res => res.json())
    .then(results => {
      // Handle results
    });
}, 300);

const SearchBox = input({
  type: 'text',
  oninput: (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    searchQuery.value = value;
    performSearch(value);
  }
});`))),

      h2('Advanced Patterns'),
      h3('Global Store'),
      p('Create a centralized state store:'),
      pre(code(...codeBlock(`import { createState, computed } from 'elit';

// Create global store
export const store = {
  // User state
  user: createState<{ name: string; email: string } | null>(null),
  isAuthenticated: computed([createState(null)], () => store.user.value !== null),

  // UI state
  theme: createState<'light' | 'dark'>('light'),
  sidebarOpen: createState(false),

  // Data state
  todos: createState<Array<{ id: number; text: string; done: boolean }>>([]),
  filter: createState<'all' | 'active' | 'completed'>('all'),

  // Computed
  filteredTodos: computed([store.todos, store.filter], (todos, filter) => {
    switch (filter) {
      case 'active':
        return todos.filter(t => !t.done);
      case 'completed':
        return todos.filter(t => t.done);
      default:
        return todos;
    }
  }),

  // Actions
  login: (name: string, email: string) => {
    store.user.value = { name, email };
  },

  logout: () => {
    store.user.value = null;
  },

  addTodo: (text: string) => {
    const newTodo = {
      id: Date.now(),
      text,
      done: false
    };
    store.todos.value = [...store.todos.value, newTodo];
  },

  toggleTodo: (id: number) => {
    store.todos.value = store.todos.value.map(todo =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    );
  }
};`))),

      h3('Persistence'),
      p('Persist state to localStorage:'),
      pre(code(...codeBlock(`import { createState, effect } from 'elit';

// Create state with localStorage persistence
function createPersistedState<T>(key: string, initial: T) {
  // Load from localStorage
  const stored = localStorage.getItem(key);
  const state = createState<T>(stored ? JSON.parse(stored) : initial);

  // Save to localStorage on change
  effect(() => {
    localStorage.setItem(key, JSON.stringify(state.value));
  });

  return state;
}

// Usage
const preferences = createPersistedState('user-preferences', {
  theme: 'light',
  language: 'en',
  notifications: true
});

// Changes automatically persist
preferences.value = {
  ...preferences.value,
  theme: 'dark'
};`))),

      h3('Undo/Redo'),
      p('Implement undo/redo functionality:'),
      pre(code(...codeBlock(`import { createState } from 'elit';

function createUndoableState<T>(initial: T) {
  const history = createState<T[]>([initial]);
  const currentIndex = createState(0);

  const current = computed([history, currentIndex], (hist, idx) => hist[idx]);

  return {
    value: current,

    set: (newValue: T) => {
      const newHistory = history.value.slice(0, currentIndex.value + 1);
      newHistory.push(newValue);
      history.value = newHistory;
      currentIndex.value = newHistory.length - 1;
    },

    undo: () => {
      if (currentIndex.value > 0) {
        currentIndex.value--;
      }
    },

    redo: () => {
      if (currentIndex.value < history.value.length - 1) {
        currentIndex.value++;
      }
    },

    canUndo: computed([currentIndex], (idx) => idx > 0),
    canRedo: computed([currentIndex, history], (idx, hist) => idx < hist.length - 1)
  };
}

// Usage
const text = createUndoableState('');

text.set('Hello');
text.set('Hello World');
text.undo(); // Back to 'Hello'
text.redo(); // Forward to 'Hello World'`))),

      h2('Best Practices'),
      ul(
        li('Keep state granular - create separate states instead of large objects'),
        li('Use computed for derived values instead of manual calculations'),
        li('Clean up effects and subscriptions when components unmount'),
        li('Use throttle for high-frequency events (scroll, resize, mousemove)'),
        li('Use debounce for user input (search, autocomplete)'),
        li('Use batchRender for rendering multiple elements at once'),
        li('Use renderChunked for very large lists (thousands of items)'),
        li('Use createVirtualList for infinite scrolling scenarios'),
        li('Use lazy() for code splitting and on-demand loading'),
        li('Avoid setting state in tight loops - batch updates instead'),
        li('Use equals option in createState for custom comparison logic')
      ),

      h2('Complete Example'),
      h3('Todo Application'),
      p('Here\'s a complete todo application with all features:'),
      pre(code(...codeBlock(`import {
  createState,
  computed,
  reactive,
  div,
  input,
  button,
  ul,
  li,
  label,
  span
} from 'elit';

// State
interface Todo {
  id: number;
  text: string;
  done: boolean;
}

const todos = createState<Todo[]>([]);
const newTodoText = createState('');
const filter = createState<'all' | 'active' | 'completed'>('all');

// Computed
const filteredTodos = computed([todos, filter], (items, f) => {
  switch (f) {
    case 'active':
      return items.filter(t => !t.done);
    case 'completed':
      return items.filter(t => t.done);
    default:
      return items;
  }
});

const activeCount = computed([todos], (items) =>
  items.filter(t => !t.done).length
);

const completedCount = computed([todos], (items) =>
  items.filter(t => t.done).length
);

// Actions
const addTodo = () => {
  const text = newTodoText.value.trim();
  if (text) {
    todos.value = [
      ...todos.value,
      { id: Date.now(), text, done: false }
    ];
    newTodoText.value = '';
  }
};

const toggleTodo = (id: number) => {
  todos.value = todos.value.map(todo =>
    todo.id === id ? { ...todo, done: !todo.done } : todo
  );
};

const deleteTodo = (id: number) => {
  todos.value = todos.value.filter(t => t.id !== id);
};

const clearCompleted = () => {
  todos.value = todos.value.filter(t => !t.done);
};

// UI
const TodoApp = div({ className: 'todo-app' },
  // Header
  div({ className: 'header' },
    input({
      type: 'text',
      className: 'new-todo',
      placeholder: 'What needs to be done?',
      value: newTodoText.value,
      oninput: (e: Event) => {
        newTodoText.value = (e.target as HTMLInputElement).value;
      },
      onkeypress: (e: KeyboardEvent) => {
        if (e.key === 'Enter') addTodo();
      }
    })
  ),

  // Todo list
  reactive(filteredTodos, (items) =>
    ul({ className: 'todo-list' },
      ...items.map(todo =>
        li({ className: todo.done ? 'done' : '' },
          label(
            input({
              type: 'checkbox',
              checked: todo.done,
              onchange: () => toggleTodo(todo.id)
            }),
            span(todo.text)
          ),
          button({
            className: 'delete',
            onclick: () => deleteTodo(todo.id)
          }, '×')
        )
      )
    )
  ),

  // Footer
  div({ className: 'footer' },
    reactive(activeCount, (count) =>
      span({ className: 'count' }, \`\${count} items left\`)
    ),

    div({ className: 'filters' },
      ['all', 'active', 'completed'].map(f =>
        button({
          className: filter.value === f ? 'selected' : '',
          onclick: () => {
            filter.value = f as any;
          }
        }, f.charAt(0).toUpperCase() + f.slice(1))
      )
    ),

    reactive(completedCount, (count) =>
      count > 0
        ? button({
            className: 'clear-completed',
            onclick: clearCompleted
          }, 'Clear completed')
        : null
    )
  )
);

// Render
domNode.render('#app', TodoApp);`))),

      h2('Conclusion'),
      p('Elit\'s state management system provides a powerful, lightweight solution for building reactive applications. With createState, computed, effects, and performance helpers like batchRender and createVirtualList, you can build complex, performant applications with minimal overhead.'),
      p('Key takeaways: Use createState for reactive variables, computed for derived values, effects for side effects, and leverage performance helpers for large datasets. Keep state granular, use appropriate debouncing/throttling, and implement proper cleanup for production-ready applications.')
    ),
    th: div(
      p('เชี่ยวชาญระบบจัดการ state แบบ reactive ของ Elit คู่มือฉบับสมบูรณ์นี้ครอบคลุม createState, computed values, effects, reactive helpers, การเพิ่มประสิทธิภาพด้วย batchRender และ renderChunked, virtual lists, lazy loading และรูปแบบขั้นสูงสำหรับสร้างแอปพลิเคชัน reactive'),

      h2('State Management ใน Elit คืออะไร?'),
      p('Elit ให้ระบบจัดการ state แบบ reactive ที่มีน้ำหนักเบาและมีมาในตัวของ framework มี fine-grained reactivity โดยไม่มี virtual DOM overhead ทำให้เหมาะสำหรับสร้างแอปพลิเคชัน reactive ที่มีประสิทธิภาพ'),
      ul(
        li('createState - ตัวแปร state แบบ reactive'),
        li('computed - State ที่ derive จากหลายแหล่ง'),
        li('effect - Side effects ที่ตอบสนองต่อการเปลี่ยนแปลง state'),
        li('reactive - การอัปเดต UI อัตโนมัติ'),
        li('batchRender - Batch การอัปเดต DOM หลายรายการ'),
        li('renderChunked - Progressive rendering สำหรับ lists ขนาดใหญ่'),
        li('createVirtualList - Virtual scrolling สำหรับหลายพันรายการ'),
        li('lazy - Lazy component loading'),
        li('throttle/debounce - Performance helpers')
      ),

      h2('Basic State'),
      h3('การสร้าง State'),
      p('สร้าง reactive state ด้วย createState:'),
      pre(code(...codeBlock(`import { createState, div, button, span } from 'elit';

// สร้าง reactive counter
const count = createState(0);

// สร้าง component
const Counter = div(
  span(\`จำนวน: \${count.value}\`),
  button({
    onclick: () => {
      count.value++; // อัปเดต state
    }
  }, 'เพิ่ม')
);

// Subscribe การเปลี่ยนแปลง
count.subscribe((value) => {
  console.log('จำนวนเปลี่ยนเป็น:', value);
});

// รับค่าปัจจุบัน
console.log(count.value); // 0

// ตั้งค่าใหม่
count.value = 5;`))),

      h2('การอัปเดต UI แบบ Reactive'),
      h3('ใช้ reactive()'),
      p('สร้าง reactive UI ที่อัปเดตอัตโนมัติ:'),
      pre(code(...codeBlock(`import { createState, reactive, div, input, p } from 'elit';

const name = createState('');

const Greeting = div(
  input({
    type: 'text',
    oninput: (e: Event) => {
      name.value = (e.target as HTMLInputElement).value;
    },
    placeholder: 'ใส่ชื่อของคุณ'
  }),

  // Reactive paragraph ที่อัปเดตอัตโนมัติ
  reactive(name, (value) =>
    p(\`สวัสดี, \${value || 'คนแปลกหน้า'}!\`)
  )
);`))),

      h2('Computed Values'),
      h3('Derived State'),
      p('สร้าง computed values ที่ derive จาก state อื่น:'),
      pre(code(...codeBlock(`import { createState, computed, reactive, div, p } from 'elit';

const firstName = createState('สมชาย');
const lastName = createState('ใจดี');

// Computed ชื่อเต็ม
const fullName = computed([firstName, lastName], (first, last) => {
  return \`\${first} \${last}\`;
});

const Profile = div(
  reactive(fullName, (name) =>
    p(\`ชื่อเต็ม: \${name}\`)
  )
);

// อัปเดต source states
firstName.value = 'สมหญิง'; // fullName อัปเดตอัตโนมัติ`))),

      h2('Effects'),
      h3('Side Effects'),
      p('รัน side effects เมื่อ state เปลี่ยน:'),
      pre(code(...codeBlock(`import { createState, effect } from 'elit';

const theme = createState('light');

// Effect รันเมื่อ theme เปลี่ยน
effect(() => {
  document.body.className = theme.value;
  console.log('ธีมเปลี่ยนเป็น:', theme.value);
});

// เปลี่ยนธีม
theme.value = 'dark'; // Effect รัน, อัปเดต body class`))),

      h2('Forms และ Input Binding'),
      h3('Text Input'),
      p('Bind state กับ form inputs:'),
      pre(code(...codeBlock(`import { createState, reactive, div, input, p } from 'elit';

const username = createState('');
const email = createState('');

const Form = div(
  input({
    type: 'text',
    value: username.value,
    oninput: (e: Event) => {
      username.value = (e.target as HTMLInputElement).value;
    },
    placeholder: 'ชื่อผู้ใช้'
  }),

  input({
    type: 'email',
    value: email.value,
    oninput: (e: Event) => {
      email.value = (e.target as HTMLInputElement).value;
    },
    placeholder: 'อีเมล'
  }),

  reactive(username, (user) => p(\`ชื่อผู้ใช้: \${user}\`)),
  reactive(email, (e) => p(\`อีเมล: \${e}\`))
);`))),

      h2('การเพิ่มประสิทธิภาพ'),
      h3('Batch Rendering'),
      p('Batch elements หลายรายการเพื่อการ render ที่มีประสิทธิภาพ:'),
      pre(code(...codeBlock(`import { batchRender, div, p } from 'elit';

// สร้าง list ขนาดใหญ่ของ elements
const items = Array.from({ length: 1000 }, (_, i) =>
  div({ className: 'item' },
    p(\`รายการ \${i}\`)
  )
);

// Render ทั้งหมดพร้อมกันอย่างมีประสิทธิภาพ
const container = batchRender('#app', items);`))),

      h3('Chunked Rendering'),
      p('Render lists ขนาดใหญ่แบบ progressive เพื่อหลีกเลี่ยงการบล็อก:'),
      pre(code(...codeBlock(`import { renderChunked, div, p } from 'elit';

// สร้าง list ขนาดใหญ่มาก
const items = Array.from({ length: 10000 }, (_, i) =>
  div({ className: 'item' },
    p(\`รายการ \${i}\`)
  )
);

// Render เป็น chunks พร้อม progress callback
renderChunked(
  '#app',
  items,
  100, // ขนาด chunk
  (current, total) => {
    console.log(\`Render แล้ว \${current} จาก \${total}\`);
  }
);`))),

      h3('Virtual Lists'),
      p('จัดการหลายพันรายการด้วย virtual scrolling:'),
      pre(code(...codeBlock(`import { createVirtualList, div, p } from 'elit';

// Dataset ขนาดใหญ่
const data = Array.from({ length: 100000 }, (_, i) => ({
  id: i,
  name: \`รายการ \${i}\`,
  description: \`คำอธิบายสำหรับรายการ \${i}\`
}));

// Container element
const container = document.getElementById('list-container') as HTMLElement;

// สร้าง virtual list
const virtualList = createVirtualList(
  container,
  data,
  (item, index) =>
    div({ className: 'list-item' },
      p(\`\${item.name}\`),
      p({ className: 'description' }, item.description)
    ),
  60, // ความสูงรายการเป็น pixels
  5   // ขนาด buffer (รายการที่ render นอก viewport)
);`))),

      h2('Throttle และ Debounce'),
      h3('Throttle'),
      p('จำกัดอัตราการทำงานของฟังก์ชัน:'),
      pre(code(...codeBlock(`import { throttle, createState } from 'elit';

const scrollPosition = createState(0);

// Throttled scroll handler (สูงสุดครั้งละ 100ms)
const handleScroll = throttle(() => {
  scrollPosition.value = window.scrollY;
}, 100);

window.addEventListener('scroll', handleScroll);`))),

      h3('Debounce'),
      p('เลื่อนการทำงานจนกว่ากิจกรรมจะหยุด:'),
      pre(code(...codeBlock(`import { debounce, createState } from 'elit';

const searchQuery = createState('');

// Debounced search (รอ 300ms หลังจากหยุดพิมพ์)
const performSearch = debounce((query: string) => {
  console.log('กำลังค้นหา:', query);
  // ทำ API call
  fetch(\`/api/search?q=\${query}\`)
    .then(res => res.json())
    .then(results => {
      // จัดการผลลัพธ์
    });
}, 300);`))),

      h2('รูปแบบขั้นสูง'),
      h3('Global Store'),
      p('สร้าง centralized state store:'),
      pre(code(...codeBlock(`import { createState, computed } from 'elit';

// สร้าง global store
export const store = {
  // User state
  user: createState<{ name: string; email: string } | null>(null),

  // UI state
  theme: createState<'light' | 'dark'>('light'),
  sidebarOpen: createState(false),

  // Data state
  todos: createState<Array<{ id: number; text: string; done: boolean }>>([]),
  filter: createState<'all' | 'active' | 'completed'>('all'),

  // Actions
  login: (name: string, email: string) => {
    store.user.value = { name, email };
  },

  logout: () => {
    store.user.value = null;
  }
};`))),

      h2('Best Practices'),
      ul(
        li('เก็บ state ให้ละเอียด - สร้าง states แยกแทนที่จะเป็น objects ขนาดใหญ่'),
        li('ใช้ computed สำหรับ derived values แทนการคำนวณด้วยตัวเอง'),
        li('Clean up effects และ subscriptions เมื่อ components unmount'),
        li('ใช้ throttle สำหรับ high-frequency events (scroll, resize, mousemove)'),
        li('ใช้ debounce สำหรับ user input (search, autocomplete)'),
        li('ใช้ batchRender สำหรับ rendering หลาย elements พร้อมกัน'),
        li('ใช้ renderChunked สำหรับ lists ขนาดใหญ่มาก (หลายพันรายการ)'),
        li('ใช้ createVirtualList สำหรับ infinite scrolling scenarios'),
        li('ใช้ lazy() สำหรับ code splitting และ on-demand loading'),
        li('หลีกเลี่ยงการตั้ง state ใน tight loops - batch updates แทน')
      ),

      h2('สรุป'),
      p('ระบบจัดการ state ของ Elit ให้โซลูชันที่ทรงพลังและมีน้ำหนักเบาสำหรับสร้างแอปพลิเคชัน reactive ด้วย createState, computed, effects และ performance helpers อย่าง batchRender และ createVirtualList คุณสามารถสร้างแอปพลิเคชันที่ซับซ้อนและมีประสิทธิภาพด้วย overhead น้อยที่สุด'),
      p('สรุปสำคัญ: ใช้ createState สำหรับตัวแปร reactive, computed สำหรับ derived values, effects สำหรับ side effects และใช้ performance helpers สำหรับ datasets ขนาดใหญ่ เก็บ state ให้ละเอียด ใช้ debouncing/throttling ที่เหมาะสม และทำ cleanup อย่างเหมาะสมสำหรับแอปพลิเคชัน production')
    )
  }
};
