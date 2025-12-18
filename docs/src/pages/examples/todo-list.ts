import { createState, computed, reactive, div, button, span, h2, h3, p, ul, li, strong, pre, code, type VNode } from 'elit';
import { codeBlock } from '../../highlight';

// TODO List Demo Component
export const TodoListDemo = () => {
  interface Todo {
    id: number;
    text: string;
    completed: boolean;
  }

  const todos = createState<Todo[]>([]);
  const inputText = createState('');
  const filter = createState<'all' | 'active' | 'completed'>('all');
  let nextId = 1;
  let inputElement: HTMLElement | null = null;

  // Computed state for filtered todos
  const filteredTodos = computed([todos, filter], (todosList, filterType) => {
    switch (filterType) {
      case 'active':
        return todosList.filter(todo => !todo.completed);
      case 'completed':
        return todosList.filter(todo => todo.completed);
      default:
        return todosList;
    }
  });

  const addTodo = () => {
    if (inputText.value.trim()) {
      todos.value = [...todos.value, {
        id: nextId++,
        text: inputText.value.trim(),
        completed: false
      }];
      inputText.value = '';
      if (inputElement) {
        inputElement.textContent = '';
      }
    }
  };

  const toggleTodo = (id: number) => {
    todos.value = todos.value.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
  };

  const deleteTodo = (id: number) => {
    todos.value = todos.value.filter(todo => todo.id !== id);
  };

  const clearCompleted = () => {
    todos.value = todos.value.filter(todo => !todo.completed);
  };

  const activeCount = () => todos.value.filter(todo => !todo.completed).length;
  const completedCount = () => todos.value.filter(todo => todo.completed).length;

  return div(
    // Input Section
    div({ style: 'margin-bottom: 1.5rem;' },
      div({ style: 'display: flex; gap: 0.5rem;' },
        div({ style: 'flex: 1;' },
          div({ style: 'position: relative;' },
            span({
              style: 'position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 1.25rem; pointer-events: none;'
            }, '📝'),
            div({
              contentEditable: 'true',
              style: `
                width: 100%;
                padding: 0.75rem 0.75rem 0.75rem 2.5rem;
                border: 2px solid var(--border);
                border-radius: 8px;
                background: var(--bg);
                color: var(--text-primary);
                font-size: 1rem;
                outline: none;
                min-height: 42px;
              `,
              ref: (el: HTMLElement | SVGElement) => {
                inputElement = el as HTMLElement;
              },
              oninput: (e: Event) => {
                inputText.value = (e.target as HTMLElement).textContent || '';
              },
              onkeydown: (e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTodo();
                }
              }
            })
          )
        ),
        button({
          onclick: addTodo,
          style: `
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            border: none;
            background: var(--primary);
            color: white;
            cursor: pointer;
            font-weight: 600;
            font-size: 1rem;
            transition: opacity 0.2s;
          `
        }, '➕ Add')
      )
    ),

    // Stats
    reactive(todos, () =>
      div({
        style: 'display: flex; gap: 1rem; margin-bottom: 1rem; padding: 1rem; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border);'
      },
        div({ style: 'flex: 1; text-align: center;' },
          div({ style: 'font-size: 1.5rem; font-weight: bold; color: var(--primary);' }, String(todos.value.length)),
          div({ style: 'font-size: 0.875rem; color: var(--text-muted);' }, 'Total')
        ),
        div({ style: 'flex: 1; text-align: center;' },
          div({ style: 'font-size: 1.5rem; font-weight: bold; color: #3b82f6;' }, String(activeCount())),
          div({ style: 'font-size: 0.875rem; color: var(--text-muted);' }, 'Active')
        ),
        div({ style: 'flex: 1; text-align: center;' },
          div({ style: 'font-size: 1.5rem; font-weight: bold; color: #22c55e;' }, String(completedCount())),
          div({ style: 'font-size: 0.875rem; color: var(--text-muted);' }, 'Completed')
        )
      )
    ),

    // Filter Buttons
    div({ style: 'display: flex; gap: 0.5rem; margin-bottom: 1rem;' },
      reactive(filter, (f: string) =>
        div({ style: 'display: flex; gap: 0.5rem; width: 100%;' },
          button({
            onclick: () => { filter.value = 'all'; },
            style: `
              flex: 1;
              padding: 0.5rem 1rem;
              border-radius: 6px;
              border: 1px solid var(--border);
              background: ${f === 'all' ? 'var(--primary)' : 'var(--bg)'};
              color: ${f === 'all' ? 'white' : 'var(--text-primary)'};
              cursor: pointer;
              font-weight: 600;
            `
          }, 'All'),
          button({
            onclick: () => { filter.value = 'active'; },
            style: `
              flex: 1;
              padding: 0.5rem 1rem;
              border-radius: 6px;
              border: 1px solid var(--border);
              background: ${f === 'active' ? 'var(--primary)' : 'var(--bg)'};
              color: ${f === 'active' ? 'white' : 'var(--text-primary)'};
              cursor: pointer;
              font-weight: 600;
            `
          }, 'Active'),
          button({
            onclick: () => { filter.value = 'completed'; },
            style: `
              flex: 1;
              padding: 0.5rem 1rem;
              border-radius: 6px;
              border: 1px solid var(--border);
              background: ${f === 'completed' ? 'var(--primary)' : 'var(--bg)'};
              color: ${f === 'completed' ? 'white' : 'var(--text-primary)'};
              cursor: pointer;
              font-weight: 600;
            `
          }, 'Completed')
        )
      )
    ),

    // Todo List
    reactive(filteredTodos, (items) => {
      const currentFilter = filter.value;

      return items.length === 0
        ? div({
            style: 'text-align: center; padding: 2rem; color: var(--text-muted); background: var(--bg-card); border-radius: 8px; border: 1px dashed var(--border);'
          },
            div({ style: 'font-size: 3rem; margin-bottom: 0.5rem;' }, '📋'),
            div(currentFilter === 'all' ? 'No todos yet. Add one above!' : `No ${currentFilter} todos`)
          )
        : div({ style: 'display: flex; flex-direction: column; gap: 0.5rem;' },
            ...items.map(todo =>
            div({
              style: `
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
                background: var(--bg-card);
                border: 1px solid var(--border);
                border-radius: 8px;
                transition: all 0.2s;
              `
            },
              // Checkbox
              button({
                onclick: () => toggleTodo(todo.id),
                style: `
                  width: 24px;
                  height: 24px;
                  border-radius: 6px;
                  border: 2px solid ${todo.completed ? '#22c55e' : 'var(--border)'};
                  background: ${todo.completed ? '#22c55e' : 'transparent'};
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                `
              }, todo.completed ? '✓' : ''),

              // Text
              div({
                style: `
                  flex: 1;
                  color: ${todo.completed ? 'var(--text-muted)' : 'var(--text-primary)'};
                  text-decoration: ${todo.completed ? 'line-through' : 'none'};
                `
              }, todo.text),

              // Delete Button
              button({
                onclick: () => deleteTodo(todo.id),
                style: `
                  width: 32px;
                  height: 32px;
                  border-radius: 6px;
                  border: none;
                  background: transparent;
                  color: #ef4444;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 1.25rem;
                  transition: background 0.2s;
                `
              }, '🗑️')
            )
          )
        );
    }),

    // Clear Completed Button
    reactive(todos, () =>
      completedCount() > 0
        ? div({ style: 'margin-top: 1rem;' },
            button({
              onclick: clearCompleted,
              style: `
                width: 100%;
                padding: 0.75rem;
                border-radius: 8px;
                border: 1px solid var(--border);
                background: var(--bg);
                color: var(--text-muted);
                cursor: pointer;
                font-weight: 600;
              `
            }, `🧹 Clear ${completedCount()} Completed`)
          )
        : null
    )
  );
};

// TODO List source code
const todoStateExample = `import { createState, computed, reactive, div, button } from 'elit';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// Reactive state
const todos = createState<Todo[]>([]);
const inputText = createState('');
const filter = createState<'all' | 'active' | 'completed'>('all');
let nextId = 1;

// Add new todo
const addTodo = () => {
  if (inputText.value.trim()) {
    todos.value = [...todos.value, {
      id: nextId++,
      text: inputText.value.trim(),
      completed: false
    }];
    inputText.value = '';
  }
};

// Toggle todo completion
const toggleTodo = (id: number) => {
  todos.value = todos.value.map(todo =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
};

// Delete todo
const deleteTodo = (id: number) => {
  todos.value = todos.value.filter(todo => todo.id !== id);
};`;

const todoFilterExample = `// Computed state for filtered todos
// Automatically tracks both todos and filter states
const filteredTodos = computed([todos, filter], (todosList, filterType) => {
  switch (filterType) {
    case 'active':
      return todosList.filter(todo => !todo.completed);
    case 'completed':
      return todosList.filter(todo => todo.completed);
    default:
      return todosList;
  }
});

// Calculate counts
const activeCount = () =>
  todos.value.filter(todo => !todo.completed).length;

const completedCount = () =>
  todos.value.filter(todo => todo.completed).length;

// Clear completed todos
const clearCompleted = () => {
  todos.value = todos.value.filter(todo => !todo.completed);
};`;

const todoRenderExample = `// Render todo list with reactive updates
// Using computed state ensures automatic re-renders when todos or filter changes
reactive(filteredTodos, (items) => {
  const currentFilter = filter.value;

  return items.length === 0
    ? div({ style: 'text-align: center; padding: 2rem;' },
        div({ style: 'font-size: 3rem;' }, '📋'),
        div(currentFilter === 'all'
          ? 'No todos yet. Add one above!'
          : \`No \${currentFilter} todos\`)
      )
    : div({ style: 'display: flex; flex-direction: column; gap: 0.5rem;' },
        ...items.map(todo =>
          div({ style: 'display: flex; align-items: center; gap: 0.75rem;' },
            // Checkbox
            button({
              onclick: () => toggleTodo(todo.id),
              style: \`
                border: 2px solid \${todo.completed ? '#22c55e' : 'var(--border)'};
                background: \${todo.completed ? '#22c55e' : 'transparent'};
              \`
            }, todo.completed ? '✓' : ''),

            // Text with strikethrough when completed
            div({
              style: \`
                color: \${todo.completed ? 'var(--text-muted)' : 'var(--text-primary)'};
                text-decoration: \${todo.completed ? 'line-through' : 'none'};
              \`
            }, todo.text),

            // Delete button
            button({
              onclick: () => deleteTodo(todo.id),
              style: 'color: #ef4444;'
            }, '🗑️')
          )
        )
      );
});`;

// TODO List Content
export const TodoListContent: VNode = div(
  // Demo
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 2rem 0; font-size: 1.75rem;' }, '📝 Try the TODO List'),
    TodoListDemo()
  ),

  // Technical Overview
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '🔧 Technical Implementation'),
    p({ style: 'color: var(--text-muted); margin-bottom: 2rem; line-height: 1.8;' },
      'This TODO List demonstrates array manipulation, filtering, computed values, and reactive state updates. ',
      'It showcases how Elit handles lists efficiently with minimal re-renders.'
    ),

    // Key Features
    div({ style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;' },
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '📋 Array State'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Manages array of todos with createState, using immutable updates for reactive changes'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '🔍 Filtering'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Dynamic filtering by status (all/active/completed) with reactive UI updates'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '📊 Statistics'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Real-time statistics showing total, active, and completed todo counts'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '✅ CRUD Operations'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Full Create, Read, Update, Delete functionality with instant UI feedback'
        )
      )
    )
  ),

  // Source Code
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '💻 Source Code'),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '1. State & Basic Operations'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(todoStateExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '2. Filtering & Statistics'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(todoFilterExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '3. Reactive Rendering'),
    pre({ style: 'margin: 0;' }, code(...codeBlock(todoRenderExample)))
  ),

  // Key Learnings
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '🎓 Key Learnings'),
    ul({ style: 'margin: 0; padding-left: 1.5rem; line-height: 2; color: var(--text-muted);' },
      li(strong('Immutable updates:'), ' Using spread operator and array methods to create new arrays for reactivity'),
      li(strong('List rendering:'), ' Efficiently mapping arrays to DOM elements with reactive updates'),
      li(strong('Computed state:'), ' Using computed() to derive values from multiple states with automatic dependency tracking'),
      li(strong('Multiple dependencies:'), ' Tracking both todos and filter states simultaneously with computed([todos, filter], ...)'),
      li(strong('Conditional rendering:'), ' Showing different UI based on filter state with dynamic empty messages'),
      li(strong('Array operations:'), ' Using map, filter, and array methods for state updates'),
      li(strong('User input handling:'), ' Managing contentEditable with ref callbacks to avoid re-render issues'),
      li(strong('Clean code structure:'), ' Separating logic functions from UI rendering for maintainability')
    )
  )
);
