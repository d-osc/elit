# Building a Real-time Blog with Elit and elit-server

Learn how to build a full-featured blog application with **real-time synchronization** using Elit's Shared State and elit-server in under 30 minutes!

## What We'll Build

- 📝 Blog post listing and detail pages
- ✍️ Create, edit, and delete posts
- 🔄 **Real-time updates with Shared State** - Changes sync instantly across all tabs/users
- 🌐 REST API for data management
- 🎨 Beautiful UI with CSS-in-JS
- 🛣️ Client-side routing
- 🔌 WebSocket state synchronization between backend and frontend

## Prerequisites

```bash
npm install elit
npm install --save-dev elit-server
```

## Project Structure

```
blog/
├── server.js          # Backend server
├── public/
│   └── index.html     # Main HTML file
└── src/
    ├── app.js         # Main app
    ├── components/
    │   ├── Header.js
    │   ├── PostList.js
    │   ├── PostDetail.js
    │   └── PostForm.js
    └── styles.js      # CSS-in-JS styles
```

## Understanding Shared State

Before we start, let's understand how Shared State works:

1. **Backend** creates a shared state with `server.state.create(key, options)`
2. **Frontend** connects to the same state with `createSharedState(key, initialValue)`
3. **WebSocket** automatically syncs changes bidirectionally
4. **All clients** receive updates in real-time

```
┌─────────────┐                    ┌─────────────┐
│   Backend   │◄──── WebSocket ───►│  Frontend   │
│             │                    │   Tab 1     │
│ SharedState │                    │             │
│   "posts"   │◄──── WebSocket ───►│  Frontend   │
│             │                    │   Tab 2     │
└─────────────┘                    └─────────────┘
```

When one client updates the state, all other clients receive the update instantly!

## Step 1: Setup Backend Server

Create `server.js`:

```javascript
const { createDevServer, Router, cors, logger } = require('elit-server');

// Create API router
const api = new Router();
api.use(cors());
api.use(logger());

// In-memory database (use real DB in production)
let posts = [
  {
    id: 1,
    title: 'Getting Started with Elit',
    content: 'Elit is a lightweight reactive library for building modern web applications. It combines the simplicity of vanilla JavaScript with powerful reactive features.',
    author: 'John Doe',
    createdAt: new Date('2024-01-01').toISOString(),
    tags: ['tutorial', 'javascript', 'getting-started']
  },
  {
    id: 2,
    title: 'Building Real-time Apps with Shared State',
    content: 'Learn how to use shared state to build real-time applications. Shared state automatically syncs data between backend and frontend using WebSocket.',
    author: 'Jane Smith',
    createdAt: new Date('2024-01-02').toISOString(),
    tags: ['realtime', 'websocket', 'shared-state']
  },
  {
    id: 3,
    title: 'CSS-in-JS with CreateStyle',
    content: 'Elit includes a powerful CSS-in-JS solution called CreateStyle. Write type-safe styles with full CSS features including pseudo-classes and media queries.',
    author: 'Bob Wilson',
    createdAt: new Date('2024-01-03').toISOString(),
    tags: ['css', 'styling', 'createstyle']
  }
];

let nextId = 4;

// API Routes
api.get('/api/posts', (ctx) => {
  return { success: true, posts };
});

api.get('/api/posts/:id', (ctx) => {
  const post = posts.find(p => p.id === parseInt(ctx.params.id));
  if (!post) {
    return { success: false, error: 'Post not found' };
  }
  return { success: true, post };
});

api.post('/api/posts', (ctx) => {
  const { title, content, author, tags } = ctx.body;

  if (!title || !content || !author) {
    return { success: false, error: 'Missing required fields' };
  }

  const newPost = {
    id: nextId++,
    title,
    content,
    author,
    tags: tags || [],
    createdAt: new Date().toISOString()
  };

  posts.unshift(newPost);

  // Broadcast update via shared state
  postsState.value = [...posts];

  return { success: true, post: newPost };
});

api.put('/api/posts/:id', (ctx) => {
  const id = parseInt(ctx.params.id);
  const index = posts.findIndex(p => p.id === id);

  if (index === -1) {
    return { success: false, error: 'Post not found' };
  }

  posts[index] = {
    ...posts[index],
    ...ctx.body,
    id // Prevent ID change
  };

  // Broadcast update
  postsState.value = [...posts];

  return { success: true, post: posts[index] };
});

api.delete('/api/posts/:id', (ctx) => {
  const id = parseInt(ctx.params.id);
  const index = posts.findIndex(p => p.id === id);

  if (index === -1) {
    return { success: false, error: 'Post not found' };
  }

  const deleted = posts.splice(index, 1)[0];

  // Broadcast update
  postsState.value = [...posts];

  return { success: true, post: deleted };
});

// Create server with API
const server = createDevServer({
  port: 3000,
  root: './public',
  api,
  logging: true
});

// Shared state for real-time updates
const postsState = server.state.create('posts', {
  initial: posts,
  validate: (value) => Array.isArray(value)
});

// Listen to state changes from any client
postsState.onChange((newPosts, oldPosts) => {
  console.log(`📝 Posts updated: ${oldPosts.length} → ${newPosts.length} posts`);

  // Log which operation happened
  if (newPosts.length > oldPosts.length) {
    const newPost = newPosts[0];
    console.log(`   ➕ New post created: "${newPost.title}"`);
  } else if (newPosts.length < oldPosts.length) {
    console.log(`   ❌ Post deleted`);
  } else {
    console.log(`   ✏️  Post updated`);
  }
});

// Graceful shutdown
let isShuttingDown = false;
const shutdown = async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('\n\n👋 Shutting down server...');

  try {
    await Promise.race([
      server.close(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
    ]);
    console.log('✅ Server closed successfully');
  } catch (error) {
    console.log('⚠️  Force closing...');
  }

  process.exit(0);
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

console.log('\n📝 Blog Server Running!');
console.log('🌐 Frontend: http://localhost:3000');
console.log('📡 API: http://localhost:3000/api/posts');
console.log('🔌 WebSocket: ws://localhost:3000');
console.log('✨ Shared State: "posts" ready for real-time sync\n');
console.log('💡 Try opening multiple browser tabs to see real-time updates!\n');
```

## Step 2: Create Styles

Create `src/styles.js`:

```javascript
import { CreateStyle } from 'elit';

const styles = new CreateStyle();

export const container = styles.class('container', {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '20px'
});

export const header = styles.class('header', {
  borderBottom: '2px solid #667eea',
  paddingBottom: '20px',
  marginBottom: '30px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
});

export const title = styles.class('title', {
  fontSize: '2.5rem',
  color: '#333',
  margin: 0
});

export const button = styles.class('button', {
  padding: '10px 20px',
  backgroundColor: '#667eea',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '1rem',
  transition: 'all 0.2s',
  '&:hover': {
    backgroundColor: '#5568d3',
    transform: 'translateY(-2px)'
  },
  '&:active': {
    transform: 'translateY(0)'
  }
});

export const postCard = styles.class('post-card', {
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '20px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  transition: 'box-shadow 0.2s',
  cursor: 'pointer',
  '&:hover': {
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
  }
});

export const postTitle = styles.class('post-title', {
  fontSize: '1.5rem',
  color: '#333',
  marginBottom: '10px'
});

export const postMeta = styles.class('post-meta', {
  color: '#666',
  fontSize: '0.9rem',
  marginBottom: '10px'
});

export const postExcerpt = styles.class('post-excerpt', {
  color: '#555',
  lineHeight: '1.6'
});

export const tag = styles.class('tag', {
  display: 'inline-block',
  padding: '4px 8px',
  backgroundColor: '#e0e7ff',
  color: '#667eea',
  borderRadius: '4px',
  fontSize: '0.8rem',
  marginRight: '5px',
  marginTop: '10px'
});

export const form = styles.class('form', {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
});

export const input = styles.class('input', {
  width: '100%',
  padding: '10px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '1rem',
  marginBottom: '15px',
  '&:focus': {
    outline: 'none',
    borderColor: '#667eea'
  }
});

export const textarea = styles.class('textarea', {
  width: '100%',
  padding: '10px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '1rem',
  marginBottom: '15px',
  minHeight: '200px',
  fontFamily: 'inherit',
  '&:focus': {
    outline: 'none',
    borderColor: '#667eea'
  }
});

// Add global styles
styles.tag('body', {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  backgroundColor: '#f5f7fa',
  margin: 0,
  padding: 0
});
```

## Step 3: Create Components

### Header Component

Create `src/components/Header.js`:

```javascript
import { header as headerClass, title, button } from '../styles';
import { div, h1, button as btn } from 'elit';

export const Header = (router) => {
  return div({ className: headerClass },
    h1({ className: title }, '📝 Elit Blog'),
    btn({
      className: button,
      onclick: () => router.navigate('/create')
    }, '+ New Post')
  );
};
```

### Post List Component

Create `src/components/PostList.js`:

```javascript
import {
  postCard,
  postTitle,
  postMeta,
  postExcerpt,
  tag as tagClass
} from '../styles';
import { div, h2, p, span, reactive } from 'elit';

export const PostList = (posts, router) => {
  return reactive(posts.state, items =>
    div(
      ...items.map(post =>
        div({
          className: postCard,
          key: post.id,
          onclick: () => router.navigate(`/post/${post.id}`)
        },
          h2({ className: postTitle }, post.title),
          p({ className: postMeta },
            `By ${post.author} • ${new Date(post.createdAt).toLocaleDateString()}`
          ),
          p({ className: postExcerpt },
            post.content.substring(0, 150) + '...'
          ),
          div(
            ...post.tags.map(tag =>
              span({ className: tagClass, key: tag }, tag)
            )
          )
        )
      )
    )
  );
};
```

### Post Detail Component

Create `src/components/PostDetail.js`:

```javascript
import { postTitle, postMeta, tag as tagClass, button } from '../styles';
import { div, h1, p, span, button as btn, reactive } from 'elit';

export const PostDetail = (postId, posts, router) => {
  return reactive(posts.state, items => {
    const post = items.find(p => p.id === parseInt(postId));

    if (!post) {
      return div(
        h1('Post not found'),
        btn({
          className: button,
          onclick: () => router.navigate('/')
        }, '← Back')
      );
    }

    const handleDelete = async () => {
      if (confirm('Delete this post?')) {
        await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
        router.navigate('/');
      }
    };

    return div(
      btn({
        className: button,
        onclick: () => router.navigate('/'),
        style: 'margin-bottom: 20px'
      }, '← Back'),

      h1({ className: postTitle }, post.title),

      p({ className: postMeta },
        `By ${post.author} • ${new Date(post.createdAt).toLocaleDateString()}`
      ),

      div(
        ...post.tags.map(tag =>
          span({ className: tagClass, key: tag }, tag)
        )
      ),

      p({ style: 'white-space: pre-wrap; line-height: 1.6; margin-top: 20px' },
        post.content
      ),

      div({ style: 'margin-top: 30px; display: flex; gap: 10px' },
        btn({
          className: button,
          onclick: () => router.navigate(`/edit/${post.id}`)
        }, 'Edit'),
        btn({
          className: button,
          style: 'background-color: #ef4444',
          onclick: handleDelete
        }, 'Delete')
      )
    );
  });
};
```

### Post Form Component

Create `src/components/PostForm.js`:

```javascript
import { form, input, textarea, button } from '../styles';
import { div, h1, input as inp, textarea as ta, button as btn, createState } from 'elit';

export const PostForm = (postId, posts, router) => {
  const existingPost = postId
    ? posts.state.value.find(p => p.id === parseInt(postId))
    : null;

  const title = createState(existingPost?.title || '');
  const content = createState(existingPost?.content || '');
  const author = createState(existingPost?.author || '');
  const tags = createState(existingPost?.tags?.join(', ') || '');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const postData = {
      title: title.value,
      content: content.value,
      author: author.value,
      tags: tags.value.split(',').map(t => t.trim()).filter(Boolean)
    };

    const url = postId ? `/api/posts/${postId}` : '/api/posts';
    const method = postId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });

    if (response.ok) {
      router.navigate('/');
    }
  };

  return div({ className: form },
    h1(postId ? 'Edit Post' : 'Create New Post'),

    inp({
      className: input,
      type: 'text',
      placeholder: 'Title',
      value: title.value,
      oninput: (e) => title.value = e.target.value
    }),

    inp({
      className: input,
      type: 'text',
      placeholder: 'Author',
      value: author.value,
      oninput: (e) => author.value = e.target.value
    }),

    ta({
      className: textarea,
      placeholder: 'Content',
      value: content.value,
      oninput: (e) => content.value = e.target.value
    }),

    inp({
      className: input,
      type: 'text',
      placeholder: 'Tags (comma separated)',
      value: tags.value,
      oninput: (e) => tags.value = e.target.value
    }),

    div({ style: 'display: flex; gap: 10px' },
      btn({
        className: button,
        onclick: handleSubmit
      }, postId ? 'Update' : 'Publish'),

      btn({
        className: button,
        style: 'background-color: #6b7280',
        onclick: () => router.navigate('/')
      }, 'Cancel')
    )
  );
};
```

## Step 4: Create Main App

Create `src/app.js`:

```javascript
import { createSharedState, createRouter, createRouterView, dom, div } from 'elit';
import { container } from './styles';
import { Header } from './components/Header';
import { PostList } from './components/PostList';
import { PostDetail } from './components/PostDetail';
import { PostForm } from './components/PostForm';

// Connect to shared state
const posts = createSharedState('posts', []);

// Create router
const router = createRouter({
  mode: 'hash',
  routes: [
    {
      path: '/',
      component: () => div(
        Header(router),
        PostList(posts, router)
      )
    },
    {
      path: '/post/:id',
      component: (params) => div(
        Header(router),
        PostDetail(params.id, posts, router)
      )
    },
    {
      path: '/create',
      component: () => div(
        Header(router),
        PostForm(null, posts, router)
      )
    },
    {
      path: '/edit/:id',
      component: (params) => div(
        Header(router),
        PostForm(params.id, posts, router)
      )
    }
  ],
  notFound: () => div(
    Header(router),
    div('404 - Page not found')
  )
});

// Render app
const App = div({ className: container },
  createRouterView(router)
);

dom.render('#app', App);

console.log('📝 Blog app initialized!');
```

## Step 5: Create HTML

Create `public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elit Blog</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="../src/app.js"></script>
</body>
</html>
```

## Step 6: Run the App

```bash
node server.js
```

Visit `http://localhost:3000` 🎉

## Features Demonstrated

✅ **Real-time Updates** - Multiple tabs sync automatically
✅ **Client-side Routing** - Navigate without page refresh
✅ **REST API** - Full CRUD operations
✅ **Shared State** - WebSocket state synchronization
✅ **CSS-in-JS** - Type-safe styling with CreateStyle
✅ **Reactive UI** - Automatic updates on state changes

## Next Steps

1. **Add Authentication** - User login/signup
2. **Add Comments** - Nested comments on posts
3. **Add Search** - Full-text search with highlighting
4. **Add Pagination** - Load posts on scroll
5. **Add Markdown** - Rich text formatting
6. **Persist Data** - Use MongoDB or PostgreSQL
7. **Add Images** - File upload support
8. **Deploy** - Deploy to Vercel or Netlify

## Production Tips

### 1. Use a Real Database

Replace in-memory array with MongoDB:

```javascript
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGODB_URI);
const posts = client.db('blog').collection('posts');
```

### 2. Add Validation

```javascript
const validatePost = (post) => {
  if (!post.title || post.title.length < 3) {
    throw new Error('Title must be at least 3 characters');
  }
  if (!post.content || post.content.length < 10) {
    throw new Error('Content must be at least 10 characters');
  }
  return true;
};
```

### 3. Add Rate Limiting

```javascript
const { rateLimit } = require('elit-server');
api.use(rateLimit({ max: 100, window: 60000 }));
```

### 4. Add Error Handling

```javascript
api.use(errorHandler());

api.post('/api/posts', async (ctx) => {
  try {
    validatePost(ctx.body);
    // ... create post
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

## Complete Example

Find the complete working example in:
- [GitHub Repository](https://github.com/oangsa/elit/tree/main/examples/blog)

## Learn More

- [Quick Start Guide](../QUICK_START.md)
- [API Reference](../API.md)
- [elit-server Documentation](../../server/README.md)

---

**Happy blogging with Elit!** 📝✨
