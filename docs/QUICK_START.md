# Elit Quick Start Guide

Get up and running with Elit in 5 minutes! 🚀

## Installation

```bash
npm install elit

# Optional: Development server with HMR
npm install --save-dev @elit/server
```

## Your First Elit App

Create `index.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My Elit App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./app.js"></script>
</body>
</html>
```

Create `app.js`:

```javascript
import { div, h1, p, button, createState, reactive, domNode } from 'elit';

// Create reactive state
const count = createState(0);

// Build your app
const app = div({ className: 'container' },
  h1('Welcome to Elit! 👋'),
  p('A lightweight, reactive DOM library'),

  reactive(count, (value) =>
    div({ className: 'counter' },
      h1({ style: 'font-size: 3rem' }, value),
      div({ style: 'display: flex; gap: 10px' },
        button({ onclick: () => count.value-- }, '−'),
        button({ onclick: () => count.value++ }, '+'),
        button({ onclick: () => count.value = 0 }, 'Reset')
      )
    )
  )
);

// Render to DOM
domNode.render('#app', app);
```

## Start Development Server

```bash
npx elit-dev
```

Your app will open at `http://localhost:3000` with hot module replacement! 🎉

## Next Steps

### 1. Add Some Styling

```javascript
import { CreateStyle } from 'elit';

const styles = new CreateStyle();

const button = styles.class('btn', {
  padding: '10px 20px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '16px',
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: '#0056b3',
    transform: 'translateY(-2px)'
  }
});
```

Use the class:

```javascript
button({ className: button, onclick: () => count.value++ }, '+')
```

### 2. Add More State

```javascript
const name = createState('World');
const greeting = computed([name], (n) => `Hello, ${n}!`);

const nameInput = input({
  type: 'text',
  placeholder: 'Enter your name',
  ...bindValue(name)
});

const display = reactive(greeting, (msg) =>
  h1(msg)
);
```

### 3. Create a Todo App

```javascript
const todos = createState([]);
const newTodo = createState('');

const TodoApp = div({ className: 'todo-app' },
  h1('My Todos'),

  // Input form
  div({ className: 'input-group' },
    input({
      type: 'text',
      placeholder: 'What needs to be done?',
      ...bindValue(newTodo)
    }),
    button({
      onclick: () => {
        if (newTodo.value.trim()) {
          todos.value = [...todos.value, {
            id: Date.now(),
            text: newTodo.value,
            done: false
          }];
          newTodo.value = '';
        }
      }
    }, 'Add')
  ),

  // Todo list
  reactive(todos, (items) =>
    ul({ className: 'todo-list' },
      ...items.map(todo =>
        li({ key: todo.id },
          input({
            type: 'checkbox',
            checked: todo.done,
            onchange: (e) => {
              todos.value = items.map(t =>
                t.id === todo.id ? { ...t, done: e.target.checked } : t
              );
            }
          }),
          span({
            style: todo.done ? 'text-decoration: line-through' : ''
          }, todo.text),
          button({
            onclick: () => {
              todos.value = items.filter(t => t.id !== todo.id);
            }
          }, 'Delete')
        )
      )
    )
  )
);
```

### 4. Add Routing

```javascript
import { createRouter, createRouterView, routerLink } from 'elit';

const router = createRouter({
  mode: 'history',
  routes: [
    {
      path: '/',
      component: () => div(h1('Home Page'), p('Welcome!'))
    },
    {
      path: '/about',
      component: () => div(h1('About'), p('Elit - Lightweight & Reactive'))
    },
    {
      path: '/user/:id',
      component: (params) => div(h1(`User ${params.id}`))
    }
  ],
  notFound: () => div(h1('404'), p('Page not found'))
});

const App = div(
  nav(
    routerLink(router, { to: '/' }, 'Home'),
    routerLink(router, { to: '/about' }, 'About'),
    routerLink(router, { to: '/user/123' }, 'Profile')
  ),
  createRouterView(router)
);
```

### 5. Server-Side State Sync (Real-time)

**Frontend:**

```javascript
import { createSharedState, reactive } from 'elit';

// Create shared state (auto-connects to @elit/server)
const counter = createSharedState('counter', 0);
const messages = createSharedState('messages', []);

const App = div(
  h1('Real-time Counter'),
  reactive(counter.state, value =>
    div(
      h2(`Count: ${value}`),
      button({ onclick: () => counter.value++ }, '+')
    )
  ),

  reactive(messages.state, msgs =>
    ul(...msgs.map(msg => li(msg.text)))
  )
);
```

**Backend (server.js):**

```javascript
const { createDevServer } = require('@elit/server');

const server = createDevServer({ port: 3000 });

// Create matching shared states
const counter = server.state.create('counter', { initial: 0 });
const messages = server.state.create('messages', { initial: [] });

// Listen to changes
counter.onChange((newValue, oldValue) => {
  console.log(`Counter: ${oldValue} → ${newValue}`);
});

// Update from server (syncs to all clients)
setInterval(() => {
  counter.value++;
}, 5000);
```

Start server:

```bash
node server.js
```

Open multiple browser tabs - they all sync in real-time! ✨

## Advanced Features

### Virtual Scrolling for Large Lists

```javascript
import { createVirtualList } from 'elit';

const items = Array.from({ length: 100000 }, (_, i) => ({
  id: i,
  name: `Item ${i}`
}));

const container = document.getElementById('list');
const virtualList = createVirtualList(
  container,
  items,
  (item) => div({ key: item.id }, item.name),
  50  // item height
);
```

### REST API with @elit/server

```javascript
const { createDevServer, Router, cors, logger } = require('@elit/server');

const api = new Router();
api.use(cors());
api.use(logger());

let todos = [];

api.get('/api/todos', () => ({ success: true, todos }));

api.post('/api/todos', (ctx) => {
  const todo = { id: Date.now(), ...ctx.body };
  todos.push(todo);
  return { success: true, todo };
});

const server = createDevServer({
  port: 3000,
  api
});
```

### Server-Side Rendering

```javascript
import { renderToString, div, h1, p } from 'elit';

const html = renderToString(
  div({ className: 'app' },
    h1('Server Rendered'),
    p('This was rendered on the server!')
  ),
  { pretty: true }
);

// Use in Node.js server response
res.send(`
<!DOCTYPE html>
<html>
  <body>${html}</body>
</html>
`);
```

## CDN Usage (No Build Step)

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/elit@latest/dist/index.global.js"></script>
</head>
<body>
  <div id="app"></div>
  <script>
    const { div, h1, button, createState, reactive, domNode } = window;

    const count = createState(0);

    const app = div(
      h1('Counter'),
      reactive(count, value =>
        button({ onclick: () => count.value++ }, `Count: ${value}`)
      )
    );

    domNode.render('#app', app);
  </script>
</body>
</html>
```

## Tips & Best Practices

1. **Use reactive() for dynamic content** - Wrap state-dependent UI in `reactive()`
2. **Computed values are cached** - Use `computed()` for derived state
3. **Unsubscribe from effects** - Call the cleanup function when done
4. **Use keys for lists** - Add `key` prop to list items for better performance
5. **Batch updates** - Multiple state changes trigger one re-render
6. **Throttle frequent updates** - Use `createState(value, { throttle: 100 })`

## Common Patterns

### Form Handling

```javascript
const formData = createState({
  name: '',
  email: '',
  age: 0
});

const form = form({
  onsubmit: (e) => {
    e.preventDefault();
    console.log('Submit:', formData.value);
  }
},
  input({ ...bindValue(createState(formData.value.name)) }),
  input({ type: 'email', ...bindValue(createState(formData.value.email)) }),
  button({ type: 'submit' }, 'Submit')
);
```

### Loading States

```javascript
const loading = createState(false);
const data = createState(null);

async function fetchData() {
  loading.value = true;
  try {
    const response = await fetch('/api/data');
    data.value = await response.json();
  } finally {
    loading.value = false;
  }
}

const display = reactive(loading, isLoading =>
  isLoading
    ? div('Loading...')
    : reactive(data, d => div(JSON.stringify(d)))
);
```

### Conditional Rendering

```javascript
const showDetails = createState(false);

const view = div(
  button({
    onclick: () => showDetails.value = !showDetails.value
  }, 'Toggle Details'),

  reactive(showDetails, show =>
    show ? div({ className: 'details' }, 'Details here...') : span()
  )
);
```

## What's Next?

- 📚 Read the [API Documentation](./API.md)
- 🎯 Check out [Examples](../server/example/)
- 🛠️ Build something awesome!
- 💬 Join the community (coming soon)

**Happy coding with Elit!** 🚀
