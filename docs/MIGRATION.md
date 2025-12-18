# Migration Guide

Migrate to Elit from other popular frameworks.

## Table of Contents

- [From React](#from-react)
- [From Vue 3](#from-vue-3)
- [From Svelte](#from-svelte)
- [From Vanilla JavaScript](#from-vanilla-javascript)
- [Common Patterns](#common-patterns)

---

## From React

### State Management

#### useState → createState

```javascript
// React
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}
```

```javascript
// Elit
import { div, h1, button, createState, reactive } from 'elit';

const count = createState(0);

const Counter = div(
  reactive(count, value => h1(value)),
  button({ onclick: () => count.value++ }, '+')
);
```

#### useMemo → computed

```javascript
// React
const doubled = useMemo(() => count * 2, [count]);
```

```javascript
// Elit
const doubled = computed([count], c => c * 2);
```

#### useEffect → effect

```javascript
// React
useEffect(() => {
  console.log('Count changed:', count);
  return () => console.log('Cleanup');
}, [count]);
```

```javascript
// Elit
effect([count], c => {
  console.log('Count changed:', c);
  return () => console.log('Cleanup');
});
```

### Components

```javascript
// React
function TodoItem({ todo, onDelete }) {
  return (
    <li>
      {todo.text}
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </li>
  );
}
```

```javascript
// Elit
const TodoItem = (todo, onDelete) =>
  li(
    todo.text,
    button({ onclick: () => onDelete(todo.id) }, 'Delete')
  );
```

### Props

```javascript
// React
function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
}
```

```javascript
// Elit
const Button = (onClick, ...children) =>
  button({ onclick: onClick }, ...children);
```

### Lists

```javascript
// React
<ul>
  {items.map(item => (
    <li key={item.id}>{item.name}</li>
  ))}
</ul>
```

```javascript
// Elit
ul(
  ...items.map(item =>
    li({ key: item.id }, item.name)
  )
)
```

### Conditional Rendering

```javascript
// React
{isLoggedIn ? <Dashboard /> : <Login />}
```

```javascript
// Elit
reactive(isLoggedIn, loggedIn =>
  loggedIn ? Dashboard() : Login()
)
```

### Forms

```javascript
// React
const [value, setValue] = useState('');

<input
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

```javascript
// Elit
const value = createState('');

input({ type: 'text', ...bindValue(value) })
```

---

## From Vue 3

### Reactivity

#### ref → createState

```vue
<!-- Vue 3 -->
<script setup>
import { ref } from 'vue';
const count = ref(0);
</script>
```

```javascript
// Elit
import { createState } from 'elit';
const count = createState(0);
```

#### computed → computed

```vue
<!-- Vue 3 -->
<script setup>
import { ref, computed } from 'vue';
const count = ref(0);
const doubled = computed(() => count.value * 2);
</script>
```

```javascript
// Elit
const count = createState(0);
const doubled = computed([count], c => c * 2);
```

#### watch → subscribe

```vue
<!-- Vue 3 -->
<script setup>
import { ref, watch } from 'vue';
const count = ref(0);
watch(count, (newVal, oldVal) => {
  console.log(oldVal, '→', newVal);
});
</script>
```

```javascript
// Elit
const count = createState(0);
count.subscribe(newVal => {
  console.log('New value:', newVal);
});
```

### Templates → Functions

```vue
<!-- Vue 3 -->
<template>
  <div class="container">
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
  </div>
</template>
```

```javascript
// Elit
div({ className: 'container' },
  h1(title),
  p(description)
)
```

### v-model → bindValue

```vue
<!-- Vue 3 -->
<input v-model="name" />
```

```javascript
// Elit
input({ ...bindValue(name) })
```

### v-for → map

```vue
<!-- Vue 3 -->
<ul>
  <li v-for="item in items" :key="item.id">
    {{ item.name }}
  </li>
</ul>
```

```javascript
// Elit
ul(
  ...items.map(item =>
    li({ key: item.id }, item.name)
  )
)
```

### v-if → reactive

```vue
<!-- Vue 3 -->
<div v-if="isVisible">Content</div>
```

```javascript
// Elit
reactive(isVisible, visible =>
  visible ? div('Content') : span()
)
```

### Event Handling

```vue
<!-- Vue 3 -->
<button @click="handleClick">Click</button>
```

```javascript
// Elit
button({ onclick: handleClick }, 'Click')
```

---

## From Svelte

### Reactive Declarations

```svelte
<!-- Svelte -->
<script>
  let count = 0;
  $: doubled = count * 2;
  $: console.log(count);
</script>
```

```javascript
// Elit
const count = createState(0);
const doubled = computed([count], c => c * 2);
effect([count], c => console.log(c));
```

### Stores → createState

```svelte
<!-- Svelte -->
<script>
  import { writable } from 'svelte/store';
  const count = writable(0);
</script>

<h1>{$count}</h1>
<button on:click={() => $count++}>+</button>
```

```javascript
// Elit
const count = createState(0);

div(
  reactive(count, value => h1(value)),
  button({ onclick: () => count.value++ }, '+')
)
```

### Each Blocks

```svelte
<!-- Svelte -->
{#each items as item (item.id)}
  <li>{item.name}</li>
{/each}
```

```javascript
// Elit
...items.map(item =>
  li({ key: item.id }, item.name)
)
```

### If Blocks

```svelte
<!-- Svelte -->
{#if condition}
  <p>True</p>
{:else}
  <p>False</p>
{/if}
```

```javascript
// Elit
reactive(condition, cond =>
  cond ? p('True') : p('False')
)
```

### Bind Directive

```svelte
<!-- Svelte -->
<input bind:value={name} />
```

```javascript
// Elit
input({ ...bindValue(name) })
```

---

## From Vanilla JavaScript

### DOM Manipulation

```javascript
// Vanilla JS
const div = document.createElement('div');
div.className = 'container';
div.textContent = 'Hello';
document.body.appendChild(div);
```

```javascript
// Elit
import { div, dom } from 'elit';

dom.render('body',
  div({ className: 'container' }, 'Hello')
);
```

### Event Listeners

```javascript
// Vanilla JS
const button = document.createElement('button');
button.textContent = 'Click';
button.addEventListener('click', () => {
  alert('Clicked');
});
```

```javascript
// Elit
button({
  onclick: () => alert('Clicked')
}, 'Click')
```

### Dynamic Updates

```javascript
// Vanilla JS
let count = 0;
const display = document.getElementById('count');
const btn = document.getElementById('btn');

btn.addEventListener('click', () => {
  count++;
  display.textContent = count;
});
```

```javascript
// Elit
const count = createState(0);

div(
  reactive(count, value => span({ id: 'count' }, value)),
  button({
    id: 'btn',
    onclick: () => count.value++
  }, '+')
)
```

---

## Common Patterns

### Loading States

#### React
```javascript
const [loading, setLoading] = useState(false);
const [data, setData] = useState(null);

useEffect(() => {
  async function fetchData() {
    setLoading(true);
    const result = await fetch('/api/data');
    setData(await result.json());
    setLoading(false);
  }
  fetchData();
}, []);

return loading ? <div>Loading...</div> : <div>{data}</div>;
```

#### Elit
```javascript
const loading = createState(false);
const data = createState(null);

async function fetchData() {
  loading.value = true;
  const result = await fetch('/api/data');
  data.value = await result.json();
  loading.value = false;
}

fetchData();

reactive(loading, isLoading =>
  isLoading
    ? div('Loading...')
    : reactive(data, d => div(JSON.stringify(d)))
)
```

### Form Handling

#### React
```javascript
const [formData, setFormData] = useState({ name: '', email: '' });

function handleChange(e) {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  });
}

function handleSubmit(e) {
  e.preventDefault();
  console.log(formData);
}
```

#### Elit
```javascript
const name = createState('');
const email = createState('');

form({
  onsubmit: (e) => {
    e.preventDefault();
    console.log({ name: name.value, email: email.value });
  }
},
  input({ name: 'name', ...bindValue(name) }),
  input({ name: 'email', type: 'email', ...bindValue(email) }),
  button({ type: 'submit' }, 'Submit')
)
```

### Todo List

#### React
```javascript
function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');

  function addTodo() {
    setTodos([...todos, { id: Date.now(), text: input, done: false }]);
    setInput('');
  }

  function toggleTodo(id) {
    setTodos(todos.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    ));
  }

  return (
    <div>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

#### Elit
```javascript
const todos = createState([]);
const input = createState('');

function addTodo() {
  todos.value = [...todos.value, {
    id: Date.now(),
    text: input.value,
    done: false
  }];
  input.value = '';
}

function toggleTodo(id) {
  todos.value = todos.value.map(t =>
    t.id === id ? { ...t, done: !t.done } : t
  );
}

const TodoApp = div(
  input({ ...bindValue(input) }),
  button({ onclick: addTodo }, 'Add'),
  reactive(todos, items =>
    ul(
      ...items.map(todo =>
        li({ key: todo.id },
          input({
            type: 'checkbox',
            checked: todo.done,
            onchange: () => toggleTodo(todo.id)
          }),
          todo.text
        )
      )
    )
  )
);
```

---

## Tips for Migration

### 1. Start Small
Begin by converting one component/page at a time. Elit can coexist with your existing framework during migration.

### 2. Understand Reactivity
- React: Uses re-renders
- Vue: Uses Proxy-based reactivity
- Elit: Uses fine-grained reactivity with subscriptions

### 3. No JSX/Templates
Elit uses function calls instead of JSX or templates. This takes some getting used to, but provides better type safety.

### 4. Direct State Mutation
```javascript
// React (immutable)
setState(prevState => prevState + 1);

// Elit (mutable)
state.value++;
```

### 5. Use Computed for Derived State
```javascript
// Instead of recalculating
reactive(count, c => {
  const doubled = c * 2; // Recalculates on every render
  return div(doubled);
});

// Use computed
const doubled = computed([count], c => c * 2);
reactive(doubled, d => div(d));
```

### 6. Leverage Built-in Features
- Use `elit-server` for HMR and development
- Use built-in router instead of external routing library
- Use `createSharedState` for real-time features

---

## Migration Checklist

- [ ] Install Elit: `npm install elit`
- [ ] Install dev server: `npm install --save-dev elit-server`
- [ ] Convert components one by one
- [ ] Replace state management (useState/ref → createState)
- [ ] Replace computed values (useMemo/computed → computed)
- [ ] Replace effects (useEffect/watch → effect)
- [ ] Update event handlers (onClick → onclick)
- [ ] Replace JSX/templates with function calls
- [ ] Test thoroughly
- [ ] Remove old framework dependencies

---

## Need Help?

- 📚 [Quick Start Guide](./QUICK_START.md)
- 📖 [API Documentation](./API.md)
- 💬 [GitHub Discussions](https://github.com/oangsa/elit/discussions)
- 🐛 [Issue Tracker](https://github.com/oangsa/elit/issues)

**Happy migrating!** 🚀
