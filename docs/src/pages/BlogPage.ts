import {
  div, h1, h2, h3, section, p, a, span, article, time, routerLink
} from 'elit';
import { reactive } from 'elit';
import type { Router } from 'elit';
import { t, currentLang } from '../i18n';
import { blogPostsDetail } from './blogContent';

// Blog post type
interface BlogPost {
  id: string;
  title: { en: string; th: string };
  excerpt: { en: string; th: string };
  date: string;
  author: string;
  tags: string[];
}

// Map blog excerpts from actual blog data
const blogExcerpts: Record<string, { en: string; th: string }> = {
  '1': {
    en: 'Introducing Elit 2.0 - A full-stack TypeScript framework (~10KB gzipped) with built-in dev server, HMR, build tool, and REST API. Zero dependencies, maximum productivity.',
    th: 'แนะนำ Elit 2.0 - Full-stack TypeScript framework (~10KB gzipped) พร้อม dev server, HMR, build tool และ REST API ไม่มี dependencies เพิ่มประสิทธิภาพสูงสุด'
  },
  '16': {
    en: 'Build a full-featured real-time blog application with Elit\'s Shared State. Learn WebSocket-based state synchronization with the built-in dev server for instant updates across all clients.',
    th: 'สร้างแอพ blog แบบ real-time ด้วย Shared State ของ Elit เรียนรู้การซิงค์ state ผ่าน WebSocket พร้อม dev server ในตัวเพื่ออัปเดตแบบทันทีทุกคน'
  },
  '17': {
    en: 'Master Hot Module Replacement with Elit\'s built-in dev server for instant development feedback. Use npx elit dev for automatic HMR, state preservation, and seamless updates.',
    th: 'เชี่ยวชาญ Hot Module Replacement ด้วย dev server ในตัวของ Elit ใช้ npx elit dev สำหรับ HMR อัตโนมัติ state preservation และอัปเดตแบบราบรื่น'
  },
  '18': {
    en: 'Complete guide to Elit 2.0 covering CLI tools, REST API, middleware stack, WebSocket support, build system, and production deployment. Everything you need for full-stack applications.',
    th: 'คู่มือครบวงจร Elit 2.0 ครอบคลุม CLI tools, REST API, middleware, WebSocket, build system และการ deploy production ทุกอย่างที่ต้องการสำหรับแอพ full-stack'
  }
};

// Convert BlogPostDetail to BlogPost for display
const blogPosts: BlogPost[] = blogPostsDetail.map(post => ({
  id: post.id,
  title: post.title,
  excerpt: blogExcerpts[post.id] || {
    en: `Learn about ${post.title.en}`,
    th: `เรียนรู้เกี่ยวกับ ${post.title.th}`
  },
  date: post.date,
  author: post.author,
  tags: post.tags
})).reverse(); // Show newest first

// Format date
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Blog post card component
const BlogPostCard = (router: Router, post: BlogPost) =>
  article({ className: 'blog-card' },
    div({ className: 'blog-card-header' },
      reactive(currentLang, () =>
        h2({ className: 'blog-card-title' },
          routerLink(router, { to: `/blog/${post.id}` },
            currentLang.value === 'th' ? post.title.th : post.title.en
          )
        )
      )
    ),
    div({ className: 'blog-card-meta' },
      span({ className: 'blog-card-date' }, formatDate(post.date)),
      span({ className: 'blog-card-separator' }, '•'),
      span({ className: 'blog-card-author' }, post.author)
    ),
    reactive(currentLang, () =>
      p({ className: 'blog-card-excerpt' },
        currentLang.value === 'th' ? post.excerpt.th : post.excerpt.en
      )
    ),
    div({ className: 'blog-card-tags' },
      ...post.tags.map(tag =>
        span({ className: 'blog-tag' }, tag)
      )
    ),
    reactive(currentLang, () =>
      routerLink(router, { to: `/blog/${post.id}`, className: 'blog-card-link' },
        currentLang.value === 'th' ? 'อ่านเพิ่มเติม →' : 'Read more →'
      )
    )
  );

// Main blog page
export const BlogPage = (router: Router) =>
  section({ className: 'container', style: 'padding-top: 6rem;' },
    reactive(currentLang, () =>
      div({ className: 'blog-page' },
        h1({ className: 'section-title' }, currentLang.value === 'th' ? 'บล็อก' : 'Blog'),
        p({ className: 'section-subtitle', style: 'margin-bottom: 3rem;' },
          currentLang.value === 'th'
            ? 'บทความ แนวคิด และอัปเดตเกี่ยวกับ Elit'
            : 'Articles, insights, and updates about Elit'
        ),
        div({ className: 'blog-grid' },
          ...blogPosts.map(post => BlogPostCard(router, post))
        )
      )
    )
  );
