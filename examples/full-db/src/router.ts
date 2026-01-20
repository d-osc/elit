import { createRouter, createRouterView, type RouteParams, type Router } from 'elit';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

// Initialize router
export const router = createRouter({
  mode: 'hash',
  base: '/',
  routes: []
});

// Define routes
const routes = [
  { path: '/', component: () => HomePage(router) },
  { path: '/login', component: () => LoginPage(router) },
  { path: '/register', component: () => RegisterPage(router) },
  { path: '/profile', component: () => ProfilePage(router) },
  { path: '/forgot-password', component: () => ForgotPasswordPage(router) }
];

export const RouterView = createRouterView(router, { mode: 'hash', routes });
