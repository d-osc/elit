import { div, h2, h3, p, ul, li, pre, code } from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog10: BlogPostDetail = {
  id: '10',
  title: {
    en: 'Client-Side Routing with Elit Router',
    th: 'การใช้งาน Client-Side Routing ด้วย Elit Router'
  },
  date: '2024-03-10',
  author: 'n-devs',
  tags: ['Tutorial', 'Router', 'SPA', 'Navigation'],
  content: {
    en: div(
      p('Learn how to implement client-side routing in Elit applications. This comprehensive guide covers basic routing, dynamic parameters, navigation guards, route transitions, and advanced patterns for building Single Page Applications (SPAs).'),

      h2('What is Elit Router?'),
      p('Elit Router is a lightweight, built-in routing solution for creating SPAs. It supports both hash mode and history mode, dynamic route parameters, navigation guards, and programmatic navigation - all with zero dependencies.'),
      ul(
        li('Hash mode (#/path) and History mode (/path)'),
        li('Dynamic route parameters (:id, :slug)'),
        li('Wildcard routes (*)'),
        li('Navigation guards (beforeEach, beforeEnter)'),
        li('Programmatic navigation (push, replace, back, forward)'),
        li('Query parameters and hash fragments'),
        li('TypeScript-first with full type safety')
      ),

      h2('Basic Setup'),
      h3('Creating a Router'),
      p('First, define your routes and create a router instance:'),
      pre(code(...codeBlock(`import { createRouter, createRouterView } from 'elit';
import { HomePage, AboutPage, ContactPage } from './pages';

// Define routes
const routes = [
  { path: '/', component: () => HomePage() },
  { path: '/about', component: () => AboutPage() },
  { path: '/contact', component: () => ContactPage() }
];

// Create router instance
export const router = createRouter({
  mode: 'hash',  // or 'history'
  routes
});

// Create router view component
export const RouterView = createRouterView(router, {
  mode: 'hash',
  routes
});`))),

      h3('Rendering the Router'),
      p('Use the RouterView component to render the current route:'),
      pre(code(...codeBlock(`import { domNode } from 'elit';
import { RouterView } from './router';

// Render the app
domNode.render('#app', RouterView());`))),

      h2('Route Configuration'),
      h3('Route Object Structure'),
      p('Each route is an object with path and component properties:'),
      pre(code(...codeBlock(`interface Route {
  path: string;
  component: (params: RouteParams) => VNode | Child;
  beforeEnter?: (to: RouteLocation, from: RouteLocation | null) => boolean | string | void;
}

// Example routes
const routes = [
  {
    path: '/',
    component: () => HomePage()
  },
  {
    path: '/about',
    component: () => AboutPage(),
    beforeEnter: (to, from) => {
      console.log('Entering about page');
      return true; // allow navigation
    }
  }
];`))),

      h2('Dynamic Route Parameters'),
      h3('Using :param Syntax'),
      p('Define dynamic segments in your routes using colon syntax:'),
      pre(code(...codeBlock(`import { createRouter } from 'elit';
import { UserProfilePage, BlogPostPage, ProductPage } from './pages';

const routes = [
  // Single parameter
  {
    path: '/user/:id',
    component: (params) => UserProfilePage(params.id)
  },

  // Multiple parameters
  {
    path: '/blog/:category/:slug',
    component: (params) => BlogPostPage(params.category, params.slug)
  },

  // Optional parameter with default
  {
    path: '/product/:id',
    component: (params) => ProductPage(params.id || 'default')
  }
];

export const router = createRouter({ mode: 'hash', routes });`))),

      h3('Accessing Route Parameters'),
      p('Parameters are passed to the component function automatically:'),
      pre(code(...codeBlock(`import { div, h1, p } from 'elit';

// User profile component
export const UserProfilePage = (userId: string) => {
  // Fetch user data based on userId
  const user = getUserById(userId);

  return div(
    h1(\`User Profile: \${userId}\`),
    p(\`Name: \${user.name}\`),
    p(\`Email: \${user.email}\`)
  );
};

// Blog post component
export const BlogPostPage = (category: string, slug: string) => {
  return div(
    h1('Blog Post'),
    p(\`Category: \${category}\`),
    p(\`Slug: \${slug}\`)
  );
};`))),

      h2('Navigation'),
      h3('Using routerLink Component'),
      p('Create navigation links using the routerLink helper:'),
      pre(code(...codeBlock(`import { nav, ul, li, routerLink } from 'elit';
import { router } from './router';

export const Navigation = () =>
  nav({ className: 'navbar' },
    ul(
      li(routerLink(router, { to: '/' }, 'Home')),
      li(routerLink(router, { to: '/about' }, 'About')),
      li(routerLink(router, { to: '/contact' }, 'Contact')),
      li(routerLink(router, { to: '/blog/tech/my-post' }, 'Latest Post')),
      li(routerLink(router,
        { to: '/user/123', className: 'nav-link active' },
        'Profile'
      ))
    )
  );`))),

      h3('Programmatic Navigation'),
      p('Navigate programmatically using router methods:'),
      pre(code(...codeBlock(`import { router } from './router';

// Push new route (adds to history)
router.push('/about');

// Replace current route (doesn't add to history)
router.replace('/login');

// Go back
router.back();

// Go forward
router.forward();

// Go to specific history position
router.go(-2); // go back 2 steps
router.go(1);  // go forward 1 step

// Navigate with query parameters
router.push('/search?q=elit&page=1');

// Navigate with hash
router.push('/docs#installation');`))),

      h2('Reactive Current Route'),
      h3('Accessing Current Route'),
      p('The router exposes a reactive currentRoute state:'),
      pre(code(...codeBlock(`import { router } from './router';
import { reactive, div, p } from 'elit';

export const RouteInfo = () =>
  div({ className: 'route-info' },
    reactive(router.currentRoute, (route) =>
      div(
        p(\`Current Path: \${route.path}\`),
        p(\`Params: \${JSON.stringify(route.params)}\`),
        p(\`Query: \${JSON.stringify(route.query)}\`),
        p(\`Hash: \${route.hash}\`)
      )
    )
  );`))),

      h3('Route Location Interface'),
      p('The RouteLocation object contains all route information:'),
      pre(code(...codeBlock(`interface RouteLocation {
  path: string;                    // Current path: '/blog/tech/my-post'
  params: Record<string, string>;  // Dynamic params: { category: 'tech', slug: 'my-post' }
  query: Record<string, string>;   // Query params: { page: '1', sort: 'desc' }
  hash: string;                    // Hash: '#comments'
}

// Example usage
reactive(router.currentRoute, (route) => {
  console.log('Path:', route.path);
  console.log('Params:', route.params);
  console.log('Query:', route.query);
  console.log('Hash:', route.hash);
});`))),

      h2('Navigation Guards'),
      h3('Global Guards with beforeEach'),
      p('Add global navigation guards that run before every route change:'),
      pre(code(...codeBlock(`import { router } from './router';

// Authentication guard
router.beforeEach((to, from) => {
  const isAuthenticated = checkAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated && to.path !== '/login') {
    return '/login';
  }

  // Allow navigation
  return true;
});

// Logging guard
router.beforeEach((to, from) => {
  console.log(\`Navigating from \${from?.path} to \${to.path}\`);
  // Return nothing or true to allow
});

// Cancellation guard
router.beforeEach((to, from) => {
  if (hasUnsavedChanges()) {
    const confirmed = confirm('You have unsaved changes. Leave anyway?');
    return confirmed; // false cancels navigation
  }
  return true;
});`))),

      h3('Per-Route Guards with beforeEnter'),
      p('Add guards to specific routes:'),
      pre(code(...codeBlock(`const routes = [
  {
    path: '/admin',
    component: () => AdminPage(),
    beforeEnter: (to, from) => {
      if (!isAdmin()) {
        alert('Admin access required');
        return '/'; // redirect to home
      }
      return true;
    }
  },
  {
    path: '/checkout',
    component: () => CheckoutPage(),
    beforeEnter: (to, from) => {
      if (cartIsEmpty()) {
        return '/cart'; // redirect to cart
      }
      return true;
    }
  }
];`))),

      h2('Wildcard Routes'),
      h3('404 Not Found Page'),
      p('Use wildcard routes to handle unmatched paths:'),
      pre(code(...codeBlock(`import { NotFoundPage } from './pages';

const routes = [
  { path: '/', component: () => HomePage() },
  { path: '/about', component: () => AboutPage() },
  // ... other routes

  // Catch-all 404 route (must be last!)
  { path: '*', component: () => NotFoundPage() }
];

// Or use the notFound option
const router = createRouter({
  mode: 'hash',
  routes,
  notFound: (params) => NotFoundPage()
});`))),

      h3('Nested Wildcard Routes'),
      p('Match nested paths with wildcards:'),
      pre(code(...codeBlock(`const routes = [
  // Match all docs paths
  {
    path: '/docs/*',
    component: (params) => {
      const subPath = params['*']; // Gets the matched portion
      return DocsPage(subPath);
    }
  },

  // API routes
  {
    path: '/api/*',
    component: (params) => ApiExplorerPage(params['*'])
  }
];`))),

      h2('Query Parameters and Hash'),
      h3('Working with Query Parameters'),
      p('Access and manipulate query parameters:'),
      pre(code(...codeBlock(`import { router } from './router';
import { reactive, div, p } from 'elit';

export const SearchPage = () => {
  return div(
    reactive(router.currentRoute, (route) => {
      const query = route.query.q || '';
      const page = parseInt(route.query.page || '1');
      const sort = route.query.sort || 'relevance';

      return div(
        p(\`Searching for: \${query}\`),
        p(\`Page: \${page}\`),
        p(\`Sort by: \${sort}\`),

        button({
          onclick: () => {
            // Update query parameters
            router.push(\`/search?q=\${query}&page=\${page + 1}&sort=\${sort}\`);
          }
        }, 'Next Page')
      );
    })
  );
};`))),

      h3('Using Hash Fragments'),
      p('Navigate to specific sections using hash fragments:'),
      pre(code(...codeBlock(`import { router } from './router';
import { div, a } from 'elit';

export const TableOfContents = () =>
  div({ className: 'toc' },
    a({
      href: '#introduction',
      onclick: (e: MouseEvent) => {
        e.preventDefault();
        router.push('/docs#introduction');
      }
    }, 'Introduction'),

    a({
      href: '#installation',
      onclick: (e: MouseEvent) => {
        e.preventDefault();
        router.push('/docs#installation');
      }
    }, 'Installation')
  );

// Scroll to hash on route change
router.currentRoute.subscribe((route) => {
  if (route.hash) {
    const element = document.querySelector(route.hash);
    element?.scrollIntoView({ behavior: 'smooth' });
  }
});`))),

      h2('Hash Mode vs History Mode'),
      h3('Hash Mode'),
      p('Hash mode uses URL hash (#) for routing. Works without server configuration:'),
      pre(code(...codeBlock(`const router = createRouter({
  mode: 'hash',
  routes
});

// URLs will look like:
// https://example.com/#/
// https://example.com/#/about
// https://example.com/#/user/123`))),

      h3('History Mode'),
      p('History mode uses HTML5 History API for clean URLs. Requires server configuration:'),
      pre(code(...codeBlock(`const router = createRouter({
  mode: 'history',
  base: '/app', // optional base path
  routes
});

// URLs will look like:
// https://example.com/app/
// https://example.com/app/about
// https://example.com/app/user/123

// Server configuration needed (nginx example):
// location /app {
//   try_files $uri $uri/ /app/index.html;
// }`))),

      h2('Advanced Patterns'),
      h3('Lazy Loading Routes'),
      p('Lazy load route components for better performance:'),
      pre(code(...codeBlock(`const routes = [
  {
    path: '/',
    component: () => HomePage()
  },
  {
    path: '/dashboard',
    component: () => {
      // Lazy load the dashboard component
      return import('./pages/DashboardPage').then(module =>
        module.DashboardPage()
      );
    }
  }
];`))),

      h3('Route Transitions'),
      p('Add transitions between route changes:'),
      pre(code(...codeBlock(`import { router } from './router';
import { reactive, div } from 'elit';

export const AnimatedRouterView = (RouterView: () => VNode) => {
  return div({ className: 'router-view-container' },
    reactive(router.currentRoute, () => {
      const view = RouterView();

      // Add transition class
      setTimeout(() => {
        const container = document.querySelector('.router-view-container');
        container?.classList.add('fade-in');
      }, 0);

      return view;
    })
  );
};

// CSS
// .router-view-container { opacity: 0; transition: opacity 0.3s; }
// .router-view-container.fade-in { opacity: 1; }`))),

      h3('Breadcrumb Navigation'),
      p('Build breadcrumb navigation from current route:'),
      pre(code(...codeBlock(`import { router } from './router';
import { reactive, nav, span, routerLink } from 'elit';

export const Breadcrumbs = () =>
  nav({ className: 'breadcrumbs' },
    reactive(router.currentRoute, (route) => {
      const parts = route.path.split('/').filter(Boolean);

      return div(
        routerLink(router, { to: '/' }, 'Home'),
        ...parts.map((part, index) => {
          const path = '/' + parts.slice(0, index + 1).join('/');
          return span(
            span(' / '),
            routerLink(router, { to: path }, part)
          );
        })
      );
    })
  );`))),

      h3('Route Meta Information'),
      p('Store and access metadata for routes:'),
      pre(code(...codeBlock(`// Extend Route interface with meta
const routes = [
  {
    path: '/admin',
    component: () => AdminPage(),
    meta: { requiresAuth: true, title: 'Admin Panel' }
  },
  {
    path: '/public',
    component: () => PublicPage(),
    meta: { requiresAuth: false, title: 'Public Page' }
  }
];

// Access meta in guards
router.beforeEach((to, from) => {
  const route = routes.find(r => r.path === to.path);

  if (route?.meta?.requiresAuth && !isAuthenticated()) {
    return '/login';
  }

  // Update page title
  if (route?.meta?.title) {
    document.title = route.meta.title;
  }

  return true;
});`))),

      h2('Complete Example'),
      h3('Blog Application with Router'),
      p('Here\'s a complete example of a blog application using Elit Router:'),
      pre(code(...codeBlock(`import {
  createRouter,
  createRouterView,
  routerLink,
  div, nav, ul, li, h1, p, domNode
} from 'elit';

// Pages
const HomePage = () => div(h1('Home'), p('Welcome to the blog!'));

const BlogListPage = () => div(
  h1('Blog Posts'),
  ul(
    li(routerLink(router, { to: '/blog/1' }, 'First Post')),
    li(routerLink(router, { to: '/blog/2' }, 'Second Post'))
  )
);

const BlogPostPage = (id: string) => {
  const post = getBlogPost(id);
  return div(
    h1(post.title),
    p(post.content),
    routerLink(router, { to: '/blog' }, '← Back to list')
  );
};

const AboutPage = () => div(h1('About'), p('About this blog'));

const NotFoundPage = () => div(h1('404'), p('Page not found'));

// Navigation component
const Navigation = () =>
  nav({ className: 'navbar' },
    ul(
      li(routerLink(router, { to: '/' }, 'Home')),
      li(routerLink(router, { to: '/blog' }, 'Blog')),
      li(routerLink(router, { to: '/about' }, 'About'))
    )
  );

// Routes
const routes = [
  { path: '/', component: () => HomePage() },
  { path: '/blog', component: () => BlogListPage() },
  { path: '/blog/:id', component: (params) => BlogPostPage(params.id) },
  { path: '/about', component: () => AboutPage() },
  { path: '*', component: () => NotFoundPage() }
];

// Create router
export const router = createRouter({
  mode: 'hash',
  routes
});

// Create router view
const RouterView = createRouterView(router, { mode: 'hash', routes });

// App component
const App = () =>
  div(
    Navigation(),
    div({ className: 'content' }, RouterView())
  );

// Render app
domNode.render('#app', App());`))),

      h2('Best Practices'),
      ul(
        li('Use hash mode for simple deployments, history mode for clean URLs'),
        li('Put wildcard routes (*) at the end of your routes array'),
        li('Use navigation guards for authentication and authorization'),
        li('Implement proper 404 handling with notFound option'),
        li('Keep route components pure and stateless when possible'),
        li('Use dynamic parameters (:id) instead of query params for resource IDs'),
        li('Clean up subscriptions and event listeners in beforeEach guards'),
        li('Consider lazy loading for large route components'),
        li('Use TypeScript for type-safe route parameters'),
        li('Test navigation flows thoroughly, including edge cases')
      ),

      h2('Router API Reference'),
      h3('Router Methods'),
      pre(code(...codeBlock(`interface Router {
  // Reactive current route state
  currentRoute: State<RouteLocation>;

  // Navigation methods
  push: (path: string) => void;      // Navigate to path (adds to history)
  replace: (path: string) => void;   // Navigate to path (replaces history)
  back: () => void;                   // Go back one step
  forward: () => void;                // Go forward one step
  go: (delta: number) => void;        // Go to specific history position

  // Guards
  beforeEach: (guard: NavigationGuard) => void;

  // Cleanup
  destroy: () => void;                // Remove listeners and cleanup
}`))),

      h2('Conclusion'),
      p('Elit Router provides a powerful yet lightweight solution for client-side routing. With support for dynamic parameters, navigation guards, and both hash and history modes, you can build sophisticated SPAs while maintaining Elit\'s philosophy of simplicity and zero dependencies.'),
      p('Key takeaways: Use dynamic routes with :param syntax for flexible routing, implement navigation guards for access control, leverage the reactive currentRoute for UI updates, and choose the appropriate mode (hash vs history) based on your deployment needs.')
    ),
    th: div(
      p('เรียนรู้วิธีการทำ client-side routing ในแอปพลิเคชัน Elit คู่มือฉบับสมบูรณ์นี้ครอบคลุมการ routing พื้นฐาน, dynamic parameters, navigation guards, route transitions และรูปแบบขั้นสูงสำหรับสร้าง Single Page Applications (SPAs)'),

      h2('Elit Router คืออะไร?'),
      p('Elit Router เป็นโซลูชัน routing ที่มีน้ำหนักเบาและมีมาในตัวสำหรับสร้าง SPAs รองรับทั้ง hash mode และ history mode, dynamic route parameters, navigation guards และ programmatic navigation - ทั้งหมดไม่มี dependencies'),
      ul(
        li('Hash mode (#/path) และ History mode (/path)'),
        li('Dynamic route parameters (:id, :slug)'),
        li('Wildcard routes (*)'),
        li('Navigation guards (beforeEach, beforeEnter)'),
        li('Programmatic navigation (push, replace, back, forward)'),
        li('Query parameters และ hash fragments'),
        li('TypeScript-first พร้อม type safety เต็มรูปแบบ')
      ),

      h2('การตั้งค่าพื้นฐาน'),
      h3('สร้าง Router'),
      p('ขั้นแรก กำหนด routes และสร้าง router instance:'),
      pre(code(...codeBlock(`import { createRouter, createRouterView } from 'elit';
import { HomePage, AboutPage, ContactPage } from './pages';

// กำหนด routes
const routes = [
  { path: '/', component: () => HomePage() },
  { path: '/about', component: () => AboutPage() },
  { path: '/contact', component: () => ContactPage() }
];

// สร้าง router instance
export const router = createRouter({
  mode: 'hash',  // หรือ 'history'
  routes
});

// สร้าง router view component
export const RouterView = createRouterView(router, {
  mode: 'hash',
  routes
});`))),

      h3('Render Router'),
      p('ใช้ RouterView component เพื่อ render route ปัจจุบัน:'),
      pre(code(...codeBlock(`import { domNode } from 'elit';
import { RouterView } from './router';

// Render แอป
domNode.render('#app', RouterView());`))),

      h2('การกำหนดค่า Route'),
      h3('โครงสร้าง Route Object'),
      p('แต่ละ route เป็น object ที่มี properties path และ component:'),
      pre(code(...codeBlock(`interface Route {
  path: string;
  component: (params: RouteParams) => VNode | Child;
  beforeEnter?: (to: RouteLocation, from: RouteLocation | null) => boolean | string | void;
}

// ตัวอย่าง routes
const routes = [
  {
    path: '/',
    component: () => HomePage()
  },
  {
    path: '/about',
    component: () => AboutPage(),
    beforeEnter: (to, from) => {
      console.log('เข้าสู่หน้า about');
      return true; // อนุญาตให้นำทาง
    }
  }
];`))),

      h2('Dynamic Route Parameters'),
      h3('ใช้ไวยากรณ์ :param'),
      p('กำหนด dynamic segments ใน routes ของคุณโดยใช้ไวยากรณ์โคลอน:'),
      pre(code(...codeBlock(`import { createRouter } from 'elit';
import { UserProfilePage, BlogPostPage, ProductPage } from './pages';

const routes = [
  // Parameter เดียว
  {
    path: '/user/:id',
    component: (params) => UserProfilePage(params.id)
  },

  // หลาย parameters
  {
    path: '/blog/:category/:slug',
    component: (params) => BlogPostPage(params.category, params.slug)
  },

  // Optional parameter พร้อม default
  {
    path: '/product/:id',
    component: (params) => ProductPage(params.id || 'default')
  }
];

export const router = createRouter({ mode: 'hash', routes });`))),

      h3('การเข้าถึง Route Parameters'),
      p('Parameters จะถูกส่งไปยังฟังก์ชัน component โดยอัตโนมัติ:'),
      pre(code(...codeBlock(`import { div, h1, p } from 'elit';

// User profile component
export const UserProfilePage = (userId: string) => {
  // ดึงข้อมูล user ตาม userId
  const user = getUserById(userId);

  return div(
    h1(\`โปรไฟล์ผู้ใช้: \${userId}\`),
    p(\`ชื่อ: \${user.name}\`),
    p(\`อีเมล: \${user.email}\`)
  );
};

// Blog post component
export const BlogPostPage = (category: string, slug: string) => {
  return div(
    h1('บล็อกโพสต์'),
    p(\`หมวดหมู่: \${category}\`),
    p(\`Slug: \${slug}\`)
  );
};`))),

      h2('การนำทาง'),
      h3('ใช้ routerLink Component'),
      p('สร้างลิงก์นำทางโดยใช้ routerLink helper:'),
      pre(code(...codeBlock(`import { nav, ul, li, routerLink } from 'elit';
import { router } from './router';

export const Navigation = () =>
  nav({ className: 'navbar' },
    ul(
      li(routerLink(router, { to: '/' }, 'หน้าแรก')),
      li(routerLink(router, { to: '/about' }, 'เกี่ยวกับ')),
      li(routerLink(router, { to: '/contact' }, 'ติดต่อ')),
      li(routerLink(router, { to: '/blog/tech/my-post' }, 'โพสต์ล่าสุด')),
      li(routerLink(router,
        { to: '/user/123', className: 'nav-link active' },
        'โปรไฟล์'
      ))
    )
  );`))),

      h3('Programmatic Navigation'),
      p('นำทางด้วยโปรแกรมโดยใช้ router methods:'),
      pre(code(...codeBlock(`import { router } from './router';

// Push route ใหม่ (เพิ่มไปยัง history)
router.push('/about');

// Replace route ปัจจุบัน (ไม่เพิ่มไปยัง history)
router.replace('/login');

// ย้อนกลับ
router.back();

// ไปข้างหน้า
router.forward();

// ไปยังตำแหน่ง history เฉพาะ
router.go(-2); // ย้อนกลับ 2 ขั้น
router.go(1);  // ไปข้างหน้า 1 ขั้น

// นำทางพร้อม query parameters
router.push('/search?q=elit&page=1');

// นำทางพร้อม hash
router.push('/docs#installation');`))),

      h2('Reactive Current Route'),
      h3('การเข้าถึง Current Route'),
      p('Router เปิดเผย reactive currentRoute state:'),
      pre(code(...codeBlock(`import { router } from './router';
import { reactive, div, p } from 'elit';

export const RouteInfo = () =>
  div({ className: 'route-info' },
    reactive(router.currentRoute, (route) =>
      div(
        p(\`Path ปัจจุบัน: \${route.path}\`),
        p(\`Params: \${JSON.stringify(route.params)}\`),
        p(\`Query: \${JSON.stringify(route.query)}\`),
        p(\`Hash: \${route.hash}\`)
      )
    )
  );`))),

      h3('Route Location Interface'),
      p('RouteLocation object มีข้อมูล route ทั้งหมด:'),
      pre(code(...codeBlock(`interface RouteLocation {
  path: string;                    // Path ปัจจุบัน: '/blog/tech/my-post'
  params: Record<string, string>;  // Dynamic params: { category: 'tech', slug: 'my-post' }
  query: Record<string, string>;   // Query params: { page: '1', sort: 'desc' }
  hash: string;                    // Hash: '#comments'
}

// ตัวอย่างการใช้งาน
reactive(router.currentRoute, (route) => {
  console.log('Path:', route.path);
  console.log('Params:', route.params);
  console.log('Query:', route.query);
  console.log('Hash:', route.hash);
});`))),

      h2('Navigation Guards'),
      h3('Global Guards ด้วย beforeEach'),
      p('เพิ่ม global navigation guards ที่ทำงานก่อนการเปลี่ยน route ทุกครั้ง:'),
      pre(code(...codeBlock(`import { router } from './router';

// Authentication guard
router.beforeEach((to, from) => {
  const isAuthenticated = checkAuth();

  // Redirect ไป login ถ้ายังไม่ได้ authenticate
  if (!isAuthenticated && to.path !== '/login') {
    return '/login';
  }

  // อนุญาตให้นำทาง
  return true;
});

// Logging guard
router.beforeEach((to, from) => {
  console.log(\`กำลังนำทางจาก \${from?.path} ไป \${to.path}\`);
  // Return nothing หรือ true เพื่ออนุญาต
});

// Cancellation guard
router.beforeEach((to, from) => {
  if (hasUnsavedChanges()) {
    const confirmed = confirm('คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ต้องการออกหรือไม่?');
    return confirmed; // false ยกเลิกการนำทาง
  }
  return true;
});`))),

      h3('Per-Route Guards ด้วย beforeEnter'),
      p('เพิ่ม guards ให้กับ routes เฉพาะ:'),
      pre(code(...codeBlock(`const routes = [
  {
    path: '/admin',
    component: () => AdminPage(),
    beforeEnter: (to, from) => {
      if (!isAdmin()) {
        alert('ต้องการสิทธิ์ Admin');
        return '/'; // redirect ไปหน้าแรก
      }
      return true;
    }
  },
  {
    path: '/checkout',
    component: () => CheckoutPage(),
    beforeEnter: (to, from) => {
      if (cartIsEmpty()) {
        return '/cart'; // redirect ไปตะกร้า
      }
      return true;
    }
  }
];`))),

      h2('Wildcard Routes'),
      h3('หน้า 404 Not Found'),
      p('ใช้ wildcard routes เพื่อจัดการ paths ที่ไม่ตรง:'),
      pre(code(...codeBlock(`import { NotFoundPage } from './pages';

const routes = [
  { path: '/', component: () => HomePage() },
  { path: '/about', component: () => AboutPage() },
  // ... routes อื่นๆ

  // Catch-all 404 route (ต้องเป็นตัวสุดท้าย!)
  { path: '*', component: () => NotFoundPage() }
];

// หรือใช้ notFound option
const router = createRouter({
  mode: 'hash',
  routes,
  notFound: (params) => NotFoundPage()
});`))),

      h2('Query Parameters และ Hash'),
      h3('การทำงานกับ Query Parameters'),
      p('เข้าถึงและจัดการ query parameters:'),
      pre(code(...codeBlock(`import { router } from './router';
import { reactive, div, p } from 'elit';

export const SearchPage = () => {
  return div(
    reactive(router.currentRoute, (route) => {
      const query = route.query.q || '';
      const page = parseInt(route.query.page || '1');
      const sort = route.query.sort || 'relevance';

      return div(
        p(\`กำลังค้นหา: \${query}\`),
        p(\`หน้า: \${page}\`),
        p(\`เรียงตาม: \${sort}\`),

        button({
          onclick: () => {
            // อัปเดต query parameters
            router.push(\`/search?q=\${query}&page=\${page + 1}&sort=\${sort}\`);
          }
        }, 'หน้าถัดไป')
      );
    })
  );
};`))),

      h2('Hash Mode vs History Mode'),
      h3('Hash Mode'),
      p('Hash mode ใช้ URL hash (#) สำหรับ routing ทำงานได้โดยไม่ต้องกำหนดค่า server:'),
      pre(code(...codeBlock(`const router = createRouter({
  mode: 'hash',
  routes
});

// URLs จะมีลักษณะเช่น:
// https://example.com/#/
// https://example.com/#/about
// https://example.com/#/user/123`))),

      h3('History Mode'),
      p('History mode ใช้ HTML5 History API สำหรับ URLs ที่สะอาด ต้องการการกำหนดค่า server:'),
      pre(code(...codeBlock(`const router = createRouter({
  mode: 'history',
  base: '/app', // base path เสริม
  routes
});

// URLs จะมีลักษณะเช่น:
// https://example.com/app/
// https://example.com/app/about
// https://example.com/app/user/123

// ต้องการการกำหนดค่า server (ตัวอย่าง nginx):
// location /app {
//   try_files $uri $uri/ /app/index.html;
// }`))),

      h2('Best Practices'),
      ul(
        li('ใช้ hash mode สำหรับการ deploy แบบง่าย, history mode สำหรับ URLs ที่สะอาด'),
        li('ใส่ wildcard routes (*) ไว้ท้ายสุดของ routes array'),
        li('ใช้ navigation guards สำหรับ authentication และ authorization'),
        li('ทำ 404 handling ที่เหมาะสมด้วย notFound option'),
        li('เก็บ route components ให้ pure และ stateless เมื่อเป็นไปได้'),
        li('ใช้ dynamic parameters (:id) แทน query params สำหรับ resource IDs'),
        li('ทำความสะอาด subscriptions และ event listeners ใน beforeEach guards'),
        li('พิจารณา lazy loading สำหรับ route components ขนาดใหญ่'),
        li('ใช้ TypeScript สำหรับ type-safe route parameters'),
        li('ทดสอบ navigation flows อย่างละเอียด รวมถึง edge cases')
      ),

      h2('สรุป'),
      p('Elit Router ให้โซลูชันที่ทรงพลังแต่มีน้ำหนักเบาสำหรับ client-side routing ด้วยการรองรับ dynamic parameters, navigation guards และทั้ง hash และ history modes คุณสามารถสร้าง SPAs ที่ซับซ้อนในขณะที่รักษาปรัชญาของ Elit ในเรื่องความเรียบง่ายและไม่มี dependencies'),
      p('สรุปสำคัญ: ใช้ dynamic routes ด้วยไวยากรณ์ :param สำหรับ routing ที่ยืดหยุ่น, ทำ navigation guards สำหรับ access control, ใช้ประโยชน์จาก reactive currentRoute สำหรับ UI updates และเลือก mode ที่เหมาะสม (hash vs history) ตามความต้องการการ deployment ของคุณ')
    )
  }
};
