import { createRouter, createRouterView, type RouteParams } from 'elit';
import { HomePage, ExamplesPage, DocsPage, ApiPage, BlogPage, BlogDetailPage } from './pages/index.ts';

// Define routes
const routes = [
  { path: '/', component: () => HomePage(router) },
  { path: '/examples', component: () => ExamplesPage() },
  { path: '/docs', component: () => DocsPage() },
  { path: '/api', component: () => ApiPage() },
  { path: '/blog', component: () => BlogPage(router) },
  { path: '/blog/:id', component: (params: RouteParams) => BlogDetailPage(router, params.id) }
];

// Initialize router
export const router = createRouter({
  mode: 'hash',
  base: '/elit',
  routes
});

export const RouterView = createRouterView(router, { mode: 'hash', routes });
