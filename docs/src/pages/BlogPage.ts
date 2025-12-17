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
    en: 'We\'re excited to introduce Elit - a modern, lightweight library (~5KB gzipped) for building reactive web applications with zero dependencies.',
    th: 'เรารู้สึกตื่นเต้นที่จะแนะนำ Elit - ไลบรารีสมัยใหม่ที่มีน้ำหนักเบา (~5KB gzipped) สำหรับสร้างเว็บแอปพลิเคชันแบบ reactive'
  },
  '16': {
    en: 'Build a full-featured real-time blog application with Elit\'s Shared State and elit-server. Learn WebSocket-based state synchronization for instant updates across all clients.',
    th: 'สร้างแอพ blog แบบ real-time ด้วย Shared State ของ Elit และ elit-server เรียนรู้การซิงค์ state ผ่าน WebSocket เพื่ออัปเดตแบบทันทีทุกคน'
  },
  '17': {
    en: 'Master Hot Module Replacement with elit-server for instant development feedback without page refresh. Boost your productivity with state preservation and seamless updates.',
    th: 'เชี่ยวชาญ Hot Module Replacement ด้วย elit-server เพื่อรับ feedback แบบทันทีโดยไม่ต้อง refresh หน้า เพิ่มประสิทธิภาพด้วย state preservation'
  },
  '18': {
    en: 'Complete guide to elit-server covering REST API, middleware stack, WebSocket support, Shared State, and production deployment. Everything you need to build full-stack applications.',
    th: 'คู่มือครบวงจร elit-server ครอบคลุม REST API, middleware, WebSocket, Shared State และการ deploy แบบ production ทุกอย่างที่ต้องการสำหรับสร้างแอพ full-stack'
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
