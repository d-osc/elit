import {
  div, h1, h2, h3, p, ul, li, pre, code, strong, em, a
} from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog16: BlogPostDetail = {
  id: '16',
  title: {
    en: 'Building a Real-time Blog with Shared State',
    th: 'สร้าง Blog แบบ Real-time ด้วย Shared State'
  },
  date: '2024-04-10',
  author: 'n-devs',
  tags: ['Tutorial', 'Shared State', 'elit/server', 'Real-time', 'WebSocket'],
  content: {
    en: div(
      p('Learn how to build a full-featured blog application with ', strong('real-time synchronization'), ' using Elit\'s Shared State and elit/server. This tutorial demonstrates WebSocket state synchronization, REST API integration, and reactive UI updates across multiple clients.'),

      h2('What We\'ll Build'),
      ul(
        li('📝 Blog post listing and detail pages'),
        li('✍️ Create, edit, and delete posts'),
        li('🔄 ', strong('Real-time updates with Shared State'), ' - Changes sync instantly across all tabs/users'),
        li('🌐 REST API for data management'),
        li('🎨 Beautiful UI with CSS-in-JS'),
        li('🛣️ Client-side routing'),
        li('🔌 WebSocket state synchronization between backend and frontend')
      ),

      h2('Understanding Shared State'),
      p('Before we start, let\'s understand how Shared State works:'),
      ul(
        li(strong('Backend'), ' creates a shared state with ', code('server.state.create(key, options)')),
        li(strong('Frontend'), ' connects to the same state with ', code('createSharedState(key, initialValue)')),
        li(strong('WebSocket'), ' automatically syncs changes bidirectionally'),
        li(strong('All clients'), ' receive updates in real-time')
      ),

      pre(code(...codeBlock(`┌─────────────┐                    ┌─────────────┐
│   Backend   │◄──── WebSocket ───►│  Frontend   │
│             │                    │   Tab 1     │
│ SharedState │                    │             │
│   "posts"   │◄──── WebSocket ───►│  Frontend   │
│             │                    │   Tab 2     │
└─────────────┘                    └─────────────┘`))),

      p('When one client updates the state, all other clients receive the update instantly!'),

      h2('Step 1: Setup Backend Server'),
      p('Create ', code('server.js'), ':'),

      pre(code(...codeBlock(`const { createDevServer, ServerRouter, cors, logger } = require('elit/server');

// Create API router
const api = new ServerRouter();
api.use(cors());
api.use(logger());

// In-memory database (use real DB in production)
let posts = [
  {
    id: 1,
    title: 'Getting Started with Elit',
    content: 'Elit is a lightweight reactive library...',
    author: 'John Doe',
    createdAt: new Date('2024-01-01').toISOString(),
    tags: ['tutorial', 'javascript']
  },
  {
    id: 2,
    title: 'Building Real-time Apps with Shared State',
    content: 'Learn how to use shared state...',
    author: 'Jane Smith',
    createdAt: new Date('2024-01-02').toISOString(),
    tags: ['realtime', 'websocket']
  }
];

let nextId = 3;

// API Routes
api.get('/api/posts', (ctx) => {
  return { success: true, posts };
});

api.post('/api/posts', (ctx) => {
  const { title, content, author, tags } = ctx.body;

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

  posts[index] = { ...posts[index], ...ctx.body, id };

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
  console.log(\`📝 Posts updated: \${oldPosts.length} → \${newPosts.length}\`);

  if (newPosts.length > oldPosts.length) {
    console.log(\`   ➕ New post created: "\${newPosts[0].title}"\`);
  } else if (newPosts.length < oldPosts.length) {
    console.log(\`   ❌ Post deleted\`);
  } else {
    console.log(\`   ✏️  Post updated\`);
  }
});

console.log('\\n📝 Blog Server Running!');
console.log('🌐 Frontend: http://localhost:3000');
console.log('📡 API: http://localhost:3000/api/posts');
console.log('✨ Shared State: "posts" ready for real-time sync\\n');`))),

      h2('Step 2: Create Main App'),
      p('Create ', code('src/app.js'), ' with shared state connection:'),

      pre(code(...codeBlock(`import { createSharedState, createRouter, createRouterView, dom, div } from 'elit';
import { container } from './styles';
import { Header } from './components/Header';
import { PostList } from './components/PostList';
import { PostDetail } from './components/PostDetail';
import { PostForm } from './components/PostForm';

// Connect to shared state - THIS IS THE KEY!
const posts = createSharedState('posts', []);

// Listen to real-time updates
posts.onChange((newValue, oldValue) => {
  console.log('🔄 Posts updated in real-time!', {
    before: oldValue.length,
    after: newValue.length
  });
});

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
  ]
});

// Render app
const App = div({ className: container },
  createRouterView(router)
);

dom.render('#app', App);

console.log('📝 Blog app initialized with real-time sync!');`))),

      h2('Step 3: Post List Component'),
      p('Create ', code('src/components/PostList.js'), ' with reactive rendering:'),

      pre(code(...codeBlock(`import {
  postCard,
  postTitle,
  postMeta,
  postExcerpt,
  tag as tagClass
} from '../styles';
import { div, h2, p, span, reactive } from 'elit';

export const PostList = (posts, router) => {
  // Use reactive() to automatically update UI when posts change
  return reactive(posts.state, items =>
    div(
      items.length === 0
        ? p('No posts yet. Create one!')
        : div(
            ...items.map(post =>
              div({
                className: postCard,
                key: post.id,
                onclick: () => router.navigate(\`/post/\${post.id}\`)
              },
                h2({ className: postTitle }, post.title),
                p({ className: postMeta },
                  \`By \${post.author} • \${new Date(post.createdAt).toLocaleDateString()}\`
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
    )
  );
};`))),

      h2('Step 4: Post Detail Component'),
      p('Create ', code('src/components/PostDetail.js'), ':'),

      pre(code(...codeBlock(`import { postTitle, postMeta, tag as tagClass, button } from '../styles';
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
        await fetch(\`/api/posts/\${post.id}\`, { method: 'DELETE' });
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
        \`By \${post.author} • \${new Date(post.createdAt).toLocaleDateString()}\`
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
          onclick: () => router.navigate(\`/edit/\${post.id}\`)
        }, 'Edit'),
        btn({
          className: button,
          style: 'background-color: #ef4444',
          onclick: handleDelete
        }, 'Delete')
      )
    );
  });
};`))),

      h2('Step 5: Post Form Component'),
      p('Create ', code('src/components/PostForm.js'), ' for creating/editing posts:'),

      pre(code(...codeBlock(`import { form, input, textarea, button } from '../styles';
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

    const url = postId ? \`/api/posts/\${postId}\` : '/api/posts';
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
};`))),

      h2('How Real-time Sync Works'),
      p('The magic happens through these key pieces:'),

      h3('1. Backend Broadcasts Changes'),
      pre(code(...codeBlock(`// When REST API changes data
posts.unshift(newPost);

// Broadcast to all connected clients via WebSocket
postsState.value = [...posts];`))),

      h3('2. Frontend Receives Updates'),
      pre(code(...codeBlock(`// Client connects to shared state
const posts = createSharedState('posts', []);

// WebSocket automatically receives updates from server
posts.onChange((newValue, oldValue) => {
  console.log('Received update!', newValue);
});`))),

      h3('3. Reactive UI Updates'),
      pre(code(...codeBlock(`// reactive() automatically re-renders when state changes
reactive(posts.state, items =>
  div(...items.map(post => PostCard(post)))
)`))),

      h2('Testing Real-time Sync'),
      p('Try this to see real-time synchronization in action:'),

      ul(
        li(strong('Open multiple browser tabs'), ' pointing to http://localhost:3000'),
        li(strong('Create a new post'), ' in one tab'),
        li(strong('Watch all tabs update'), ' instantly without refresh!'),
        li(strong('Edit or delete'), ' a post and see changes sync across tabs'),
        li(strong('Open DevTools Console'), ' to see WebSocket messages')
      ),

      h2('Advanced: Backend-Initiated Updates'),
      p('You can also update state from the backend:'),

      pre(code(...codeBlock(`// In server.js
setInterval(() => {
  // Simulate backend updating post views
  posts.forEach(post => {
    post.views = (post.views || 0) + Math.floor(Math.random() * 10);
  });

  // Broadcast to all clients
  postsState.value = [...posts];
}, 5000);`))),

      h2('Production Considerations'),

      h3('1. Use a Real Database'),
      pre(code(...codeBlock(`const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGODB_URI);
const postsCollection = client.db('blog').collection('posts');

api.post('/api/posts', async (ctx) => {
  const post = { ...ctx.body, createdAt: new Date() };
  const result = await postsCollection.insertOne(post);

  // Fetch latest and broadcast
  const posts = await postsCollection.find().toArray();
  postsState.value = posts;

  return { success: true, post };
});`))),

      h3('2. Add Authentication'),
      pre(code(...codeBlock(`const authMiddleware = async (ctx, next) => {
  const token = ctx.headers['authorization'];
  if (!token) {
    return { success: false, error: 'Unauthorized' };
  }
  await next();
};

api.post('/api/posts', authMiddleware, async (ctx) => {
  // Only authenticated users can create posts
});`))),

      h3('3. Rate Limiting'),
      pre(code(...codeBlock(`const { rateLimit } = require('elit/server');

api.use(rateLimit({
  max: 100,      // Max 100 requests
  window: 60000  // Per minute
}));`))),

      h3('4. Validation'),
      pre(code(...codeBlock(`const validatePost = (post) => {
  if (!post.title || post.title.length < 3) {
    throw new Error('Title must be at least 3 characters');
  }
  if (!post.content || post.content.length < 10) {
    throw new Error('Content must be at least 10 characters');
  }
  return true;
};

api.post('/api/posts', (ctx) => {
  try {
    validatePost(ctx.body);
    // ... create post
  } catch (error) {
    return { success: false, error: error.message };
  }
});`))),

      h2('Performance Tips'),
      ul(
        li(strong('Throttle updates'), ' - Use throttle option in shared state for high-frequency updates'),
        li(strong('Optimize rendering'), ' - Use keys and memoization for large lists'),
        li(strong('Lazy load'), ' - Load post content only when viewing detail page'),
        li(strong('Pagination'), ' - Don\'t sync all posts, only current page'),
        li(strong('Selective updates'), ' - Only sync changed fields, not entire post list')
      ),

      h2('Debugging'),
      pre(code(...codeBlock(`// Client-side debugging
const posts = createSharedState('posts', []);

// Log all WebSocket messages
posts.onChange((newValue, oldValue) => {
  console.log('State changed:', {
    before: oldValue,
    after: newValue,
    diff: newValue.length - oldValue.length
  });
});

// Check WebSocket connection
console.log('WebSocket status:', posts.isConnected());`))),

      h2('Complete Example'),
      p('Find the complete working example in the ', a({ href: 'https://github.com/d-osc/elit/tree/main/docs/tutorials' }, 'Elit tutorials directory'), '.'),

      h2('Conclusion'),
      p('You\'ve built a real-time blog application with Shared State! Key features:'),
      ul(
        li('✅ ', strong('Real-time synchronization'), ' across all clients via WebSocket'),
        li('✅ ', strong('REST API'), ' for CRUD operations'),
        li('✅ ', strong('Reactive UI'), ' with automatic updates'),
        li('✅ ', strong('Client-side routing'), ' for SPA experience'),
        li('✅ ', strong('CSS-in-JS'), ' for beautiful styling')
      ),

      p('The power of Shared State is that changes made by ', em('any client'), ' (or the ', em('server itself'), ') are instantly reflected in ', em('all connected clients'), '. No polling, no manual refresh—just pure real-time magic! 🚀'),

      p('Next steps: Add authentication, persist to database, add comments, implement markdown support, and deploy to production!')
    ),
    th: div(
      p('เรียนรู้วิธีสร้าง blog application แบบเต็มรูปแบบพร้อม ', strong('การซิงโครไนซ์แบบ real-time'), ' โดยใช้ Shared State ของ Elit และ elit/server บทเรียนนี้สาธิตการซิงโครไนซ์ state ผ่าน WebSocket, การผสานรวม REST API และการอัปเดต UI แบบ reactive ข้ามหลาย clients'),

      h2('สิ่งที่เราจะสร้าง'),
      ul(
        li('📝 หน้าแสดงรายการและรายละเอียด blog posts'),
        li('✍️ สร้าง, แก้ไข และลบ posts'),
        li('🔄 ', strong('การอัปเดตแบบ Real-time ด้วย Shared State'), ' - การเปลี่ยนแปลงซิงค์ทันทีข้ามทุก tabs/users'),
        li('🌐 REST API สำหรับจัดการข้อมูล'),
        li('🎨 UI ที่สวยงามด้วย CSS-in-JS'),
        li('🛣️ Client-side routing'),
        li('🔌 การซิงโครไนซ์ state ผ่าน WebSocket ระหว่าง backend และ frontend')
      ),

      h2('ทำความเข้าใจ Shared State'),
      p('ก่อนเริ่ม มาทำความเข้าใจวิธีการทำงานของ Shared State:'),
      ul(
        li(strong('Backend'), ' สร้าง shared state ด้วย ', code('server.state.create(key, options)')),
        li(strong('Frontend'), ' เชื่อมต่อกับ state เดียวกันด้วย ', code('createSharedState(key, initialValue)')),
        li(strong('WebSocket'), ' ซิงค์การเปลี่ยนแปลงแบบสองทางโดยอัตโนมัติ'),
        li(strong('All clients'), ' รับการอัปเดตแบบ real-time')
      ),

      pre(code(...codeBlock(`┌─────────────┐                    ┌─────────────┐
│   Backend   │◄──── WebSocket ───►│  Frontend   │
│             │                    │   Tab 1     │
│ SharedState │                    │             │
│   "posts"   │◄──── WebSocket ───►│  Frontend   │
│             │                    │   Tab 2     │
└─────────────┘                    └─────────────┘`))),

      p('เมื่อ client หนึ่งอัปเดต state clients อื่นๆ ทั้งหมดจะรับการอัปเดตทันที!'),

      h2('ขั้นตอนที่ 1: ตั้งค่า Backend Server'),
      p('สร้าง ', code('server.js'), ':'),

      pre(code(...codeBlock(`const { createDevServer, ServerRouter, cors, logger } = require('elit/server');

// สร้าง API router
const api = new ServerRouter();
api.use(cors());
api.use(logger());

// In-memory database (ใช้ DB จริงใน production)
let posts = [
  {
    id: 1,
    title: 'เริ่มต้นกับ Elit',
    content: 'Elit เป็น reactive library ที่เบา...',
    author: 'สมชาย',
    createdAt: new Date('2024-01-01').toISOString(),
    tags: ['tutorial', 'javascript']
  },
  {
    id: 2,
    title: 'สร้างแอปแบบ Real-time ด้วย Shared State',
    content: 'เรียนรู้วิธีใช้ shared state...',
    author: 'สมหญิง',
    createdAt: new Date('2024-01-02').toISOString(),
    tags: ['realtime', 'websocket']
  }
];

let nextId = 3;

// API Routes
api.post('/api/posts', (ctx) => {
  const { title, content, author, tags } = ctx.body;

  const newPost = {
    id: nextId++,
    title,
    content,
    author,
    tags: tags || [],
    createdAt: new Date().toISOString()
  };

  posts.unshift(newPost);

  // Broadcast update ผ่าน shared state
  postsState.value = [...posts];

  return { success: true, post: newPost };
});

// สร้าง server พร้อม API
const server = createDevServer({
  port: 3000,
  root: './public',
  api,
  logging: true
});

// Shared state สำหรับ real-time updates
const postsState = server.state.create('posts', {
  initial: posts,
  validate: (value) => Array.isArray(value)
});

// รับฟังการเปลี่ยนแปลง state จาก client ใดๆ
postsState.onChange((newPosts, oldPosts) => {
  console.log(\`📝 Posts อัปเดต: \${oldPosts.length} → \${newPosts.length}\`);

  if (newPosts.length > oldPosts.length) {
    console.log(\`   ➕ สร้าง post ใหม่: "\${newPosts[0].title}"\`);
  } else if (newPosts.length < oldPosts.length) {
    console.log(\`   ❌ ลบ post\`);
  } else {
    console.log(\`   ✏️  แก้ไข post\`);
  }
});

console.log('\\n📝 Blog Server กำลังทำงาน!');
console.log('🌐 Frontend: http://localhost:3000');
console.log('✨ Shared State: "posts" พร้อมสำหรับ real-time sync\\n');`))),

      h2('ขั้นตอนที่ 2: สร้าง Main App'),
      p('สร้าง ', code('src/app.js'), ' พร้อมการเชื่อมต่อ shared state:'),

      pre(code(...codeBlock(`import { createSharedState, createRouter, createRouterView, dom, div } from 'elit';
import { container } from './styles';
import { Header } from './components/Header';
import { PostList } from './components/PostList';

// เชื่อมต่อกับ shared state - นี่คือจุดสำคัญ!
const posts = createSharedState('posts', []);

// รับฟังการอัปเดตแบบ real-time
posts.onChange((newValue, oldValue) => {
  console.log('🔄 Posts อัปเดตแบบ real-time!', {
    ก่อน: oldValue.length,
    หลัง: newValue.length
  });
});

// สร้าง router
const router = createRouter({
  mode: 'hash',
  routes: [
    {
      path: '/',
      component: () => div(
        Header(router),
        PostList(posts, router)
      )
    }
  ]
});

const App = div({ className: container },
  createRouterView(router)
);

dom.render('#app', App);

console.log('📝 Blog app เริ่มต้นพร้อม real-time sync!');`))),

      h2('วิธีการทำงานของ Real-time Sync'),
      p('มหัศจรรย์เกิดขึ้นผ่านส่วนประกอบหลักเหล่านี้:'),

      h3('1. Backend ส่งการเปลี่ยนแปลง'),
      pre(code(...codeBlock(`// เมื่อ REST API เปลี่ยนข้อมูล
posts.unshift(newPost);

// Broadcast ไปยังทุก clients ที่เชื่อมต่อผ่าน WebSocket
postsState.value = [...posts];`))),

      h3('2. Frontend รับการอัปเดต'),
      pre(code(...codeBlock(`// Client เชื่อมต่อกับ shared state
const posts = createSharedState('posts', []);

// WebSocket รับการอัปเดตจาก server โดยอัตโนมัติ
posts.onChange((newValue) => {
  console.log('รับการอัปเดต!', newValue);
});`))),

      h3('3. UI อัปเดตแบบ Reactive'),
      pre(code(...codeBlock(`// reactive() re-render อัตโนมัติเมื่อ state เปลี่ยน
reactive(posts.state, items =>
  div(...items.map(post => PostCard(post)))
)`))),

      h2('ทดสอบ Real-time Sync'),
      p('ลองทำตามนี้เพื่อเห็นการซิงโครไนซ์แบบ real-time:'),

      ul(
        li(strong('เปิดหลาย browser tabs'), ' ไปที่ http://localhost:3000'),
        li(strong('สร้าง post ใหม่'), ' ใน tab หนึ่ง'),
        li(strong('ดู tabs ทั้งหมดอัปเดต'), ' ทันทีโดยไม่ต้อง refresh!'),
        li(strong('แก้ไขหรือลบ'), ' post และดูการเปลี่ยนแปลงซิงค์ข้าม tabs'),
        li(strong('เปิด DevTools Console'), ' เพื่อดูข้อความ WebSocket')
      ),

      h2('ข้อควรพิจารณาใน Production'),

      h3('1. ใช้ฐานข้อมูลจริง'),
      pre(code(...codeBlock(`const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGODB_URI);
const postsCollection = client.db('blog').collection('posts');`))),

      h3('2. เพิ่ม Authentication'),
      pre(code(...codeBlock(`const authMiddleware = async (ctx, next) => {
  const token = ctx.headers['authorization'];
  if (!token) {
    return { success: false, error: 'Unauthorized' };
  }
  await next();
};`))),

      h3('3. Rate Limiting'),
      pre(code(...codeBlock(`const { rateLimit } = require('elit/server');

api.use(rateLimit({
  max: 100,      // สูงสุด 100 requests
  window: 60000  // ต่อนาที
}));`))),

      h2('เคล็ดลับด้านประสิทธิภาพ'),
      ul(
        li(strong('Throttle updates'), ' - ใช้ตัวเลือก throttle ใน shared state สำหรับการอัปเดตความถี่สูง'),
        li(strong('เพิ่มประสิทธิภาพ rendering'), ' - ใช้ keys และ memoization สำหรับ lists ขนาดใหญ่'),
        li(strong('Lazy load'), ' - โหลดเนื้อหา post เฉพาะเมื่อดูหน้ารายละเอียด'),
        li(strong('Pagination'), ' - อย่าซิงค์ posts ทั้งหมด เฉพาะหน้าปัจจุบัน'),
        li(strong('Selective updates'), ' - ซิงค์เฉพาะฟิลด์ที่เปลี่ยน ไม่ใช่ทั้งรายการ post')
      ),

      h2('สรุป'),
      p('คุณได้สร้าง blog application แบบ real-time ด้วย Shared State! คุณสมบัติหลัก:'),
      ul(
        li('✅ ', strong('การซิงโครไนซ์แบบ Real-time'), ' ข้ามทุก clients ผ่าน WebSocket'),
        li('✅ ', strong('REST API'), ' สำหรับ CRUD operations'),
        li('✅ ', strong('Reactive UI'), ' พร้อมการอัปเดตอัตโนมัติ'),
        li('✅ ', strong('Client-side routing'), ' สำหรับประสบการณ์ SPA'),
        li('✅ ', strong('CSS-in-JS'), ' สำหรับการจัดรูปแบบที่สวยงาม')
      ),

      p('พลังของ Shared State คือการเปลี่ยนแปลงที่ทำโดย ', em('client ใดๆ'), ' (หรือ ', em('server เอง'), ') จะสะท้อนทันทีใน ', em('ทุก clients ที่เชื่อมต่อ'), ' ไม่ต้อง polling ไม่ต้อง refresh ด้วยตนเอง—แค่ real-time magic ล้วนๆ! 🚀'),

      p('ขั้นตอนถัดไป: เพิ่ม authentication, บันทึกลงฐานข้อมูล, เพิ่มความคิดเห็น, รองรับ markdown และ deploy ไปยัง production!')
    )
  }
};
