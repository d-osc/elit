import {
  div, h2, h3, section, pre, code, button, input, span, p, a, ul, li,
  table, thead, tbody, tr, th, td, form, label, select, option, textarea,
  createState, reactive, computed, text, bindValue, bindChecked,
  CreateStyle, setTitle, addMeta,
  svgSvg, svgCircle, svgRect, svgPath,
  jsonToVNode, renderToString
} from 'elit';
import { codeBlock } from '../highlight';
import { t, currentLang } from '../i18n';

// Helper for highlighted code blocks
const codeExample = (src: string) => pre(code(...codeBlock(src)));

// ============================================
// 1. Element Factories Examples
// ============================================

const ElementFactoriesDemo = () => {
  return div({ className: 'demo-section' },
    h3('Basic Elements'),
    div({ className: 'demo-result' },
      div({ className: 'card', style: 'padding: 1rem; background: var(--bg-card); border-radius: 8px;' },
        p('This is a paragraph'),
        a({ href: '#', onclick: (e: Event) => e.preventDefault() }, 'This is a link'),
        ul(
          li('List item 1'),
          li('List item 2'),
          li('List item 3')
        )
      )
    ),

    h3('Form Elements'),
    div({ className: 'demo-result' },
      form({ onsubmit: (e: Event) => e.preventDefault(), style: 'display: flex; flex-direction: column; gap: 0.75rem;' },
        div(
          label({ style: 'display: block; margin-bottom: 0.25rem; color: var(--text-muted);' }, 'Text Input'),
          input({ type: 'text', placeholder: 'Enter text...', style: 'width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-code); color: var(--text);' })
        ),
        div(
          label({ style: 'display: block; margin-bottom: 0.25rem; color: var(--text-muted);' }, 'Select'),
          select({ style: 'width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-code); color: var(--text);' },
            option({ value: '1' }, 'Option 1'),
            option({ value: '2' }, 'Option 2'),
            option({ value: '3' }, 'Option 3')
          )
        ),
        div(
          label({ style: 'display: block; margin-bottom: 0.25rem; color: var(--text-muted);' }, 'Textarea'),
          textarea({ rows: 3, placeholder: 'Enter message...', style: 'width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-code); color: var(--text); resize: vertical;' })
        )
      )
    ),

    h3('Table'),
    div({ className: 'demo-result' },
      table({ style: 'width: 100%; border-collapse: collapse;' },
        thead(
          tr(
            th({ style: 'text-align: left; padding: 0.5rem; border-bottom: 1px solid var(--border);' }, 'Name'),
            th({ style: 'text-align: left; padding: 0.5rem; border-bottom: 1px solid var(--border);' }, 'Role'),
            th({ style: 'text-align: left; padding: 0.5rem; border-bottom: 1px solid var(--border);' }, 'Status')
          )
        ),
        tbody(
          tr(
            td({ style: 'padding: 0.5rem; border-bottom: 1px solid var(--border);' }, 'Alice'),
            td({ style: 'padding: 0.5rem; border-bottom: 1px solid var(--border);' }, 'Developer'),
            td({ style: 'padding: 0.5rem; border-bottom: 1px solid var(--border);' }, '✅ Active')
          ),
          tr(
            td({ style: 'padding: 0.5rem; border-bottom: 1px solid var(--border);' }, 'Bob'),
            td({ style: 'padding: 0.5rem; border-bottom: 1px solid var(--border);' }, 'Designer'),
            td({ style: 'padding: 0.5rem; border-bottom: 1px solid var(--border);' }, '✅ Active')
          ),
          tr(
            td({ style: 'padding: 0.5rem;' }, 'Charlie'),
            td({ style: 'padding: 0.5rem;' }, 'Manager'),
            td({ style: 'padding: 0.5rem;' }, '⏸️ Away')
          )
        )
      )
    ),

    h3('SVG Elements'),
    div({ className: 'demo-result', style: 'display: flex; gap: 1rem; align-items: center;' },
      svgSvg({ width: 100, height: 100, viewBox: '0 0 100 100' },
        svgCircle({ cx: 50, cy: 50, r: 40, fill: '#6366f1' }),
        svgCircle({ cx: 50, cy: 50, r: 25, fill: '#4f46e5' })
      ),
      svgSvg({ width: 100, height: 100, viewBox: '0 0 100 100' },
        svgRect({ x: 10, y: 10, width: 80, height: 80, rx: 10, fill: '#22c55e' }),
        svgRect({ x: 25, y: 25, width: 50, height: 50, rx: 5, fill: '#16a34a' })
      ),
      svgSvg({ width: 100, height: 100, viewBox: '0 0 24 24', fill: 'none', stroke: '#f59e0b', 'stroke-width': 2 },
        svgPath({ d: 'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z' })
      )
    )
  );
};

// ============================================
// 2. State Management Examples
// ============================================

const StateManagementDemo = () => {
  // Basic State
  const count = createState(0);

  // State with options
  const searchQuery = createState('', { throttle: 300 });

  // Computed State
  const doubled = computed([count], (c) => c * 2);
  const tripled = computed([count], (c) => c * 3);

  // Object State
  const user = createState({ name: 'John', age: 25 });

  // Array State
  const items = createState(['Apple', 'Banana', 'Cherry']);

  return div({ className: 'demo-section' },
    h3('Basic Counter'),
    div({ className: 'demo-result' },
      div({ className: 'demo-counter' },
        button({ onclick: () => count.value-- }, '-'),
        reactive(count, (v: number) => span(String(v))),
        button({ onclick: () => count.value++ }, '+')
      )
    ),

    h3('Computed State'),
    div({ className: 'demo-result' },
      p(
        'Count: ', reactive(count, (v: number) => span({ style: 'color: var(--primary);' }, String(v))),
        ' | Doubled: ', reactive(doubled, (v: number) => span({ style: 'color: #22c55e;' }, String(v))),
        ' | Tripled: ', reactive(tripled, (v: number) => span({ style: 'color: #f59e0b;' }, String(v)))
      )
    ),

    h3('Throttled Input'),
    div({ className: 'demo-result' },
      input({
        type: 'text',
        placeholder: 'Type to search (throttled 300ms)...',
        style: 'width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-code); color: var(--text);',
        oninput: (e: Event) => searchQuery.value = (e.target as HTMLInputElement).value
      }),
      reactive(searchQuery, (q: string) =>
        p({ style: 'margin-top: 0.5rem; color: var(--text-muted);' },
          q ? `Searching for: "${q}"` : 'Start typing...'
        )
      )
    ),

    h3('Object State'),
    div({ className: 'demo-result' },
      reactive(user, (u: { name: string; age: number }) =>
        div(
          p(`Name: ${u.name}, Age: ${u.age}`),
          div({ style: 'display: flex; gap: 0.5rem; margin-top: 0.5rem;' },
            button({
              onclick: () => user.value = { ...user.value, age: user.value.age + 1 },
              style: 'padding: 0.25rem 0.75rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-code); color: var(--text); cursor: pointer;'
            }, 'Birthday 🎂'),
            button({
              onclick: () => user.value = { ...user.value, name: user.value.name === 'John' ? 'Jane' : 'John' },
              style: 'padding: 0.25rem 0.75rem; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-code); color: var(--text); cursor: pointer;'
            }, 'Switch Name')
          )
        )
      )
    ),

    h3('Array State'),
    div({ className: 'demo-result' },
      reactive(items, (list: string[]) =>
        div(
          ul({ style: 'margin-bottom: 0.5rem;' },
            ...list.map((item, i) =>
              li({ style: 'display: flex; justify-content: space-between; align-items: center; padding: 0.25rem 0;' },
                span(item),
                button({
                  onclick: () => items.value = items.value.filter((_, idx) => idx !== i),
                  style: 'background: none; border: none; color: #ef4444; cursor: pointer;'
                }, '×')
              )
            )
          ),
          button({
            onclick: () => items.value = [...items.value, `Item ${items.value.length + 1}`],
            style: 'padding: 0.25rem 0.75rem; border-radius: 4px; border: none; background: var(--primary); color: white; cursor: pointer;'
          }, 'Add Item')
        )
      )
    )
  );
};

// ============================================
// 3. Reactive Rendering Examples
// ============================================

const ReactiveRenderingDemo = () => {
  const name = createState('World');
  const isChecked = createState(false);
  const inputValue = createState('');
  const theme = createState<'light' | 'dark'>('dark');

  return div({ className: 'demo-section' },
    h3('Reactive Text'),
    div({ className: 'demo-result' },
      input({
        type: 'text',
        placeholder: 'Enter your name...',
        style: 'padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-code); color: var(--text); margin-right: 0.5rem;',
        oninput: (e: Event) => name.value = (e.target as HTMLInputElement).value || 'World'
      }),
      p({ style: 'margin-top: 0.5rem;' },
        'Hello, ',
        reactive(name, (n: string) => span({ style: 'color: var(--primary); font-weight: bold;' }, n)),
        '!'
      )
    ),

    h3('text() Helper'),
    div({ className: 'demo-result' },
      p('Current name: ', text(name))
    ),

    h3('bindValue() - Two-way Binding'),
    div({ className: 'demo-result' },
      input({
        type: 'text',
        placeholder: 'Two-way bound input...',
        style: 'padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-code); color: var(--text); width: 100%;',
        ...bindValue(inputValue)
      }),
      reactive(inputValue, (v: string) =>
        p({ style: 'margin-top: 0.5rem; color: var(--text-muted);' },
          `Value: "${v}" (${v.length} chars)`
        )
      )
    ),

    h3('bindChecked() - Checkbox Binding'),
    div({ className: 'demo-result' },
      label({ style: 'display: flex; align-items: center; gap: 0.5rem; cursor: pointer;' },
        input({
          type: 'checkbox',
          ...bindChecked(isChecked)
        }),
        'I agree to the terms'
      ),
      reactive(isChecked, (checked: boolean) =>
        p({ style: `margin-top: 0.5rem; color: ${checked ? '#22c55e' : '#ef4444'};` },
          checked ? '✅ Agreed!' : '❌ Please agree to continue'
        )
      )
    ),

    h3('Conditional Rendering'),
    div({ className: 'demo-result' },
      div({ style: 'display: flex; gap: 0.5rem; margin-bottom: 0.5rem;' },
        button({
          onclick: () => theme.value = 'light',
          style: `padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid var(--border); cursor: pointer; ${theme.value === 'light' ? 'background: var(--primary); color: white;' : 'background: var(--bg-code); color: var(--text);'}`
        }, '☀️ Light'),
        button({
          onclick: () => theme.value = 'dark',
          style: `padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid var(--border); cursor: pointer; ${theme.value === 'dark' ? 'background: var(--primary); color: white;' : 'background: var(--bg-code); color: var(--text);'}`
        }, '🌙 Dark')
      ),
      reactive(theme, (t: string) =>
        div({
          style: `padding: 1rem; border-radius: 8px; ${t === 'light' ? 'background: #f5f5f5; color: #1a1a1a;' : 'background: #1a1a1a; color: #fafafa;'}`
        },
          p(`Current theme: ${t}`)
        )
      )
    )
  );
};

// ============================================
// 4. CreateStyle Examples
// ============================================

const CreateStyleDemo = () => {
  const demoStyles = new CreateStyle();

  // Variables
  const accent = demoStyles.addVar('demo-accent', '#8b5cf6');

  // Classes
  demoStyles.addClass('style-demo-box', {
    padding: '1rem',
    background: demoStyles.var(accent),
    borderRadius: '8px',
    color: 'white',
    fontWeight: 'bold'
  });

  demoStyles.addClass('style-demo-hover', {
    padding: '0.5rem 1rem',
    background: '#374151',
    borderRadius: '6px',
    transition: 'all 0.2s',
    cursor: 'pointer'
  });
  demoStyles.addPseudoClass('hover', { background: demoStyles.var(accent), transform: 'scale(1.05)' }, '.style-demo-hover');

  // Animation
  demoStyles.keyframe('demo-pulse', {
    '0%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.1)' },
    '100%': { transform: 'scale(1)' }
  });

  demoStyles.addClass('style-demo-animated', {
    display: 'inline-block',
    padding: '0.5rem 1rem',
    background: '#ef4444',
    borderRadius: '50%',
    animation: 'demo-pulse 1s infinite'
  });

  demoStyles.inject('demo-styles');

  return div({ className: 'demo-section' },
    h3('CSS Variables'),
    div({ className: 'demo-result' },
      div({ className: 'style-demo-box' }, 'Box with CSS Variable')
    ),
    codeExample(`const accent = styles.addVar('accent', '#8b5cf6');
styles.addClass('box', {
  background: styles.var(accent)
});`),

    h3('Hover Effects'),
    div({ className: 'demo-result' },
      span({ className: 'style-demo-hover' }, 'Hover me!')
    ),
    codeExample(`styles.addClass('hover-box', { background: '#374151' });
styles.addPseudoClass('hover', {
  background: '#8b5cf6',
  transform: 'scale(1.05)'
}, '.hover-box');`),

    h3('Keyframe Animations'),
    div({ className: 'demo-result' },
      span({ className: 'style-demo-animated' }, '❤️')
    ),
    codeExample(`styles.keyframe('pulse', {
  '0%': { transform: 'scale(1)' },
  '50%': { transform: 'scale(1.1)' },
  '100%': { transform: 'scale(1)' }
});`)
  );
};

// ============================================
// 5. Counter Demo (Original)
// ============================================

const CounterDemo = () => {
  const count = createState(0);

  return div({ className: 'demo-counter' },
    button({ onclick: () => count.value-- }, '-'),
    reactive(count, (v: number) => span(String(v))),
    button({ onclick: () => count.value++ }, '+')
  );
};

// ============================================
// 6. Todo Demo (Original)
// ============================================

const TodoDemo = () => {
  type Todo = { id: number; text: string; done: boolean };

  const todos = createState<Todo[]>([
    { id: 1, text: 'Learn Elit', done: true },
    { id: 2, text: 'Build something awesome', done: false }
  ]);
  const inputValue = createState('');
  let nextId = 3;

  const addTodo = () => {
    if (inputValue.value.trim()) {
      todos.value = [...todos.value, { id: nextId++, text: inputValue.value, done: false }];
      inputValue.value = '';
    }
  };

  const toggleTodo = (id: number) => {
    todos.value = todos.value.map((t: Todo) => t.id === id ? { ...t, done: !t.done } : t);
  };

  const removeTodo = (id: number) => {
    todos.value = todos.value.filter((t: Todo) => t.id !== id);
  };

  return div({ className: 'demo-todo' },
    div({ className: 'demo-todo-input' },
      input({
        type: 'text',
        placeholder: 'Add a todo...',
        value: inputValue.value,
        oninput: (e: Event) => inputValue.value = (e.target as HTMLInputElement).value,
        onkeydown: (e: KeyboardEvent) => e.key === 'Enter' && addTodo()
      }),
      button({ onclick: addTodo }, 'Add')
    ),
    reactive(todos, (items: Todo[]) =>
      div({ className: 'demo-todo-list' },
        ...items.map((todo: Todo) =>
          div({ className: `demo-todo-item ${todo.done ? 'done' : ''}` },
            input({
              type: 'checkbox',
              checked: todo.done,
              onchange: () => toggleTodo(todo.id)
            }),
            span(todo.text),
            button({ onclick: () => removeTodo(todo.id) }, '×')
          )
        )
      )
    )
  );
};

// ============================================
// 7. Head Management Examples
// ============================================

const HeadManagementDemo = () => {
  const pageTitle = createState('Elit Docs');

  return div({ className: 'demo-section' },
    h3('setTitle()'),
    div({ className: 'demo-result' },
      input({
        type: 'text',
        placeholder: 'Enter page title...',
        style: 'padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-code); color: var(--text); margin-right: 0.5rem;',
        oninput: (e: Event) => pageTitle.value = (e.target as HTMLInputElement).value
      }),
      button({
        onclick: () => setTitle(pageTitle.value || 'Elit Docs'),
        style: 'padding: 0.5rem 1rem; border-radius: 6px; border: none; background: var(--primary); color: white; cursor: pointer;'
      }, 'Set Title'),
      p({ style: 'margin-top: 0.5rem; color: var(--text-muted);' }, 'Check the browser tab!')
    ),

    h3('addMeta()'),
    div({ className: 'demo-result' },
      button({
        onclick: () => addMeta({ name: 'theme-color', content: '#6366f1' }),
        style: 'padding: 0.5rem 1rem; border-radius: 6px; border: none; background: var(--primary); color: white; cursor: pointer;'
      }, 'Add Theme Color Meta')
    ),
    codeExample(`addMeta({ name: 'theme-color', content: '#6366f1' });
addMeta({ name: 'description', content: 'My app description' });`)
  );
};

// ============================================
// 8. JSON Rendering Examples
// ============================================

const JsonRenderingDemo = () => {
  const jsonStructure = {
    tag: 'div',
    attributes: { style: 'padding: 1rem; background: var(--bg-card); border-radius: 8px;' },
    children: [
      { tag: 'h4', children: 'Rendered from JSON' },
      { tag: 'p', attributes: { style: 'color: var(--text-muted);' }, children: 'This content was defined as JSON and converted to VNodes.' },
      {
        tag: 'ul',
        children: [
          { tag: 'li', children: 'Item 1' },
          { tag: 'li', children: 'Item 2' },
          { tag: 'li', children: 'Item 3' }
        ]
      }
    ]
  };

  return div({ className: 'demo-section' },
    h3('jsonToVNode()'),
    div({ className: 'demo-result' },
      jsonToVNode(jsonStructure)
    ),
    codeExample(`const json = {
  tag: 'div',
  attributes: { class: 'container' },
  children: [
    { tag: 'h4', children: 'Title' },
    { tag: 'p', children: 'Content' }
  ]
};

const vnode = jsonToVNode(json);`),

    h3('renderToString() - SSR'),
    div({ className: 'demo-result' },
      pre({ style: 'background: var(--bg-code); padding: 1rem; border-radius: 8px; overflow-x: auto;' },
        code(renderToString(
          div({ className: 'ssr-example' },
            p('This was rendered to string')
          ),
          { pretty: true }
        ))
      )
    ),
    codeExample(`const html = renderToString(
  div({ className: 'app' },
    p('Server rendered')
  ),
  { pretty: true }
);`)
  );
};

// ============================================
// 9. Shopping Cart Demo
// ============================================

const ShoppingCartDemo = () => {
  type CartItem = { id: number; name: string; price: number; qty: number };

  const cart = createState<CartItem[]>([
    { id: 1, name: 'Laptop', price: 999, qty: 1 },
    { id: 2, name: 'Mouse', price: 29, qty: 2 }
  ]);

  const total = computed([cart], (items) =>
    items.reduce((sum, item) => sum + item.price * item.qty, 0)
  );

  const updateQty = (id: number, delta: number) => {
    cart.value = cart.value.map(item =>
      item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item
    ).filter(item => item.qty > 0);
  };

  const addItem = () => {
    const items = ['Keyboard', 'Monitor', 'Headphones', 'Webcam', 'USB Hub'];
    const name = items[Math.floor(Math.random() * items.length)];
    const price = Math.floor(Math.random() * 200) + 20;
    cart.value = [...cart.value, { id: Date.now(), name, price, qty: 1 }];
  };

  return div({ className: 'demo-section' },
    h3('Shopping Cart'),
    div({ className: 'demo-result' },
      reactive(cart, (items: CartItem[]) =>
        div(
          items.length === 0
            ? p({ style: 'color: var(--text-muted);' }, 'Cart is empty')
            : table({ style: 'width: 100%; border-collapse: collapse; margin-bottom: 1rem;' },
                thead(
                  tr(
                    th({ style: 'text-align: left; padding: 0.5rem; border-bottom: 1px solid var(--border);' }, 'Item'),
                    th({ style: 'text-align: right; padding: 0.5rem; border-bottom: 1px solid var(--border);' }, 'Price'),
                    th({ style: 'text-align: center; padding: 0.5rem; border-bottom: 1px solid var(--border);' }, 'Qty'),
                    th({ style: 'text-align: right; padding: 0.5rem; border-bottom: 1px solid var(--border);' }, 'Subtotal')
                  )
                ),
                tbody(
                  ...items.map(item =>
                    tr(
                      td({ style: 'padding: 0.5rem; border-bottom: 1px solid var(--border);' }, item.name),
                      td({ style: 'text-align: right; padding: 0.5rem; border-bottom: 1px solid var(--border);' }, `$${item.price}`),
                      td({ style: 'text-align: center; padding: 0.5rem; border-bottom: 1px solid var(--border);' },
                        div({ style: 'display: flex; align-items: center; justify-content: center; gap: 0.5rem;' },
                          button({ onclick: () => updateQty(item.id, -1), style: 'width: 24px; height: 24px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-code); color: var(--text); cursor: pointer;' }, '-'),
                          span(String(item.qty)),
                          button({ onclick: () => updateQty(item.id, 1), style: 'width: 24px; height: 24px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-code); color: var(--text); cursor: pointer;' }, '+')
                        )
                      ),
                      td({ style: 'text-align: right; padding: 0.5rem; border-bottom: 1px solid var(--border);' }, `$${item.price * item.qty}`)
                    )
                  )
                )
              )
        )
      ),
      div({ style: 'display: flex; justify-content: space-between; align-items: center;' },
        button({ onclick: addItem, style: 'padding: 0.5rem 1rem; border-radius: 6px; border: none; background: var(--primary); color: white; cursor: pointer;' }, 'Add Random Item'),
        reactive(total, (t: number) =>
          span({ style: 'font-size: 1.25rem; font-weight: bold;' }, `Total: $${t}`)
        )
      )
    )
  );
};

// ============================================
// 10. Form Validation Demo
// ============================================

const FormValidationDemo = () => {
  const email = createState('');
  const password = createState('');
  const confirmPassword = createState('');

  const emailError = computed([email], (e) => {
    if (!e) return '';
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) ? '' : 'Invalid email format';
  });

  const passwordError = computed([password], (p) => {
    if (!p) return '';
    if (p.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(p)) return 'Password must contain uppercase letter';
    if (!/[0-9]/.test(p)) return 'Password must contain a number';
    return '';
  });

  const confirmError = computed([password, confirmPassword], (p, c) => {
    if (!c) return '';
    return p === c ? '' : 'Passwords do not match';
  });

  const isValid = computed([emailError, passwordError, confirmError, email, password, confirmPassword],
    (e1, e2, e3, em, pw, cpw) => !e1 && !e2 && !e3 && !!em && !!pw && !!cpw
  );

  const inputStyle = 'width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-code); color: var(--text);';
  const errorStyle = 'color: #ef4444; font-size: 0.875rem; margin-top: 0.25rem;';

  return div({ className: 'demo-section' },
    h3('Form with Validation'),
    div({ className: 'demo-result' },
      form({ onsubmit: (e: Event) => { e.preventDefault(); alert('Form submitted!'); }, style: 'display: flex; flex-direction: column; gap: 1rem;' },
        div(
          label({ style: 'display: block; margin-bottom: 0.25rem; color: var(--text-muted);' }, 'Email'),
          input({ type: 'email', style: inputStyle, placeholder: 'you@example.com', ...bindValue(email) }),
          reactive(emailError, (err: string) => err ? p({ style: errorStyle }, err) : null)
        ),
        div(
          label({ style: 'display: block; margin-bottom: 0.25rem; color: var(--text-muted);' }, 'Password'),
          input({ type: 'password', style: inputStyle, placeholder: '8+ chars, uppercase, number', ...bindValue(password) }),
          reactive(passwordError, (err: string) => err ? p({ style: errorStyle }, err) : null)
        ),
        div(
          label({ style: 'display: block; margin-bottom: 0.25rem; color: var(--text-muted);' }, 'Confirm Password'),
          input({ type: 'password', style: inputStyle, placeholder: 'Repeat password', ...bindValue(confirmPassword) }),
          reactive(confirmError, (err: string) => err ? p({ style: errorStyle }, err) : null)
        ),
        reactive(isValid, (valid: boolean) =>
          button({
            type: 'submit',
            disabled: !valid,
            style: `padding: 0.75rem; border-radius: 6px; border: none; cursor: ${valid ? 'pointer' : 'not-allowed'}; background: ${valid ? 'var(--primary)' : '#374151'}; color: white; font-weight: 600;`
          }, 'Submit')
        )
      )
    )
  );
};

// ============================================
// Code Examples
// ============================================

const counterCodeExample = `import { div, h1, button, createState, reactive, domNode } from 'elit';

// Create reactive state
const count = createState(0);

// Build UI with element factories
const app = div({ className: 'app' },
  h1('Counter Example'),
  reactive(count, value =>
    div({ className: 'counter' },
      button({ onclick: () => count.value-- }, '-'),
      span(String(value)),
      button({ onclick: () => count.value++ }, '+')
    )
  )
);

// Render to DOM
domNode.render('#app', app);`;

// ============================================
// Main Examples Component
// ============================================

const Examples = () =>
  section({ id: 'examples', className: 'example-section' },
    reactive(currentLang, () => h2({ className: 'section-title' }, t('examples.title'))),

    // Quick Start Examples
    div({ className: 'example-container' },
      div({ className: 'example-code' },
        div({ className: 'example-code-header' }, 'Counter Example'),
        codeExample(counterCodeExample)
      ),
      div({ className: 'example-preview' },
        reactive(currentLang, () => div({ className: 'example-preview-header' }, t('examples.livePreview'))),
        CounterDemo()
      )
    ),

    div({ className: 'example-container', style: 'margin-top: 2rem;' },
      div({ className: 'example-code' },
        div({ className: 'example-code-header' }, 'Todo App Example'),
        codeExample(`const todos = createState([]);
const input = createState('');

const addTodo = () => {
  todos.value = [...todos.value, {
    id: Date.now(),
    text: input.value,
    done: false
  }];
  input.value = '';
};`)
      ),
      div({ className: 'example-preview' },
        reactive(currentLang, () => div({ className: 'example-preview-header' }, t('examples.livePreview'))),
        TodoDemo()
      )
    ),

    // API Examples
    reactive(currentLang, () => h2({ className: 'section-title', style: 'margin-top: 4rem;' }, t('examples.apiExamples'))),

    // Element Factories
    div({ style: 'margin-top: 2rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem;' },
      h2({ style: 'font-size: 1.5rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border);' }, '1. Element Factories'),
      ElementFactoriesDemo()
    ),

    // State Management
    div({ style: 'margin-top: 2rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem;' },
      h2({ style: 'font-size: 1.5rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border);' }, '2. State Management'),
      StateManagementDemo()
    ),

    // Reactive Rendering
    div({ style: 'margin-top: 2rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem;' },
      h2({ style: 'font-size: 1.5rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border);' }, '3. Reactive Rendering'),
      ReactiveRenderingDemo()
    ),

    // CreateStyle
    div({ style: 'margin-top: 2rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem;' },
      h2({ style: 'font-size: 1.5rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border);' }, '4. CreateStyle (CSS-in-JS)'),
      CreateStyleDemo()
    ),

    // Head Management
    div({ style: 'margin-top: 2rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem;' },
      h2({ style: 'font-size: 1.5rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border);' }, '5. Head Management'),
      HeadManagementDemo()
    ),

    // JSON Rendering
    div({ style: 'margin-top: 2rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem;' },
      h2({ style: 'font-size: 1.5rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border);' }, '6. JSON Rendering & SSR'),
      JsonRenderingDemo()
    ),

    // Real-world Examples
    reactive(currentLang, () => h2({ className: 'section-title', style: 'margin-top: 4rem;' }, t('examples.realWorld'))),

    // Shopping Cart
    div({ style: 'margin-top: 2rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem;' },
      h2({ style: 'font-size: 1.5rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border);' }, '7. Shopping Cart'),
      ShoppingCartDemo()
    ),

    // Form Validation
    div({ style: 'margin-top: 2rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem;' },
      h2({ style: 'font-size: 1.5rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border);' }, '8. Form Validation'),
      FormValidationDemo()
    )
  );

export const ExamplesPage = () =>
  section({ className: 'container', style: 'padding-top: 6rem;' },
    Examples()
  );
