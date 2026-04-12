import type { Router } from 'elit';
import { currentLang, type Lang } from './i18n';
import { blogPostsDetail } from './pages/blogContent';
import { examplesList } from './pages/examples/exampleContent';

type SeoMeta = {
  title: string;
  description: string;
  keywords: string[];
  ogType?: 'website' | 'article';
  noIndex?: boolean;
  publishedTime?: string;
  author?: string;
};

const BRAND = 'Elit';
const SITE_NAME = 'Elit Documentation';
const SITE_BASE_PATH = '';
const DEFAULT_SITE_ORIGIN = 'https://elit.d-osc.com';
const DEFAULT_CANONICAL_URL = `${DEFAULT_SITE_ORIGIN}${SITE_BASE_PATH}/`;
const DEFAULT_OG_IMAGE_URL = `${DEFAULT_SITE_ORIGIN}${SITE_BASE_PATH}/og-image.svg`;

const defaultKeywords = ['Elit', 'TypeScript framework', 'reactive UI', 'SSR', 'REST API', 'documentation'];

const sharedCopy = {
  en: {
    homeTitle: 'Elit Documentation | Full-Stack TypeScript Framework',
    homeDescription: 'Official Elit documentation for the full-stack TypeScript framework with reactive UI, routing, dev server, SSR, REST API, examples, and tutorials.',
    docsTitle: 'Elit Documentation | CLI, Server, Config, WAPK',
    docsDescription: 'Guides for Elit CLI, config, server patterns, desktop mode, mobile/native, styling, routing, testing, and WAPK workflows.',
    apiTitle: 'Elit API Reference | DOM, State, Router, Server APIs',
    apiDescription: 'API reference for Elit DOM rendering, element factories, state, reactive updates, CreateStyle, router, server APIs, middleware, and shared state.',
    examplesTitle: 'Elit Examples | Interactive Apps and Games',
    examplesDescription: 'Interactive Elit examples including games, CRUD apps, search, POS, AI chat, Monaco integration, and 3D scenes.',
    blogTitle: 'Elit Blog | Tutorials and Guides',
    blogDescription: 'Tutorials, release notes, and practical guides for building with Elit.',
    missingTitle: 'Page Not Found | Elit',
    missingDescription: 'The requested Elit page could not be found.'
  },
  th: {
    homeTitle: 'เอกสาร Elit | Full-Stack TypeScript Framework',
    homeDescription: 'เอกสารทางการของ Elit สำหรับ full-stack TypeScript framework ที่มี reactive UI, routing, dev server, SSR, REST API, examples และ tutorials.',
    docsTitle: 'เอกสาร Elit | CLI, Server, Config, WAPK',
    docsDescription: 'คู่มือ Elit สำหรับ CLI, config, server patterns, desktop mode, mobile/native, styling, routing, testing และ WAPK workflows.',
    apiTitle: 'Elit API Reference | DOM, State, Router, Server APIs',
    apiDescription: 'เอกสาร API ของ Elit ครอบคลุม DOM rendering, element factories, state, reactive updates, CreateStyle, router, server APIs, middleware และ shared state.',
    examplesTitle: 'ตัวอย่าง Elit | แอปและเกมแบบอินเทอร์แอคทีฟ',
    examplesDescription: 'รวมตัวอย่าง Elit แบบอินเทอร์แอคทีฟ เช่น เกม, CRUD apps, search, POS, AI chat, Monaco integration และ 3D scenes.',
    blogTitle: 'บล็อก Elit | Tutorials และ Guides',
    blogDescription: 'บทความ, release notes และ practical guides สำหรับการพัฒนาด้วย Elit.',
    missingTitle: 'ไม่พบหน้าที่ต้องการ | Elit',
    missingDescription: 'ไม่พบหน้าที่คุณร้องขอในเอกสาร Elit.'
  }
};

function upsertMeta(attribute: 'name' | 'property', key: string, content?: string) {
  const selector = `meta[${attribute}="${key}"]`;
  const existing = document.head.querySelector(selector);

  if (!content) {
    existing?.remove();
    return;
  }

  const meta = existing instanceof HTMLMetaElement ? existing : document.createElement('meta');
  meta.setAttribute(attribute, key);
  meta.setAttribute('content', content);

  if (!existing) {
    document.head.append(meta);
  }
}

function upsertCanonical(href: string) {
  const existing = document.head.querySelector('link[rel="canonical"]');
  const link = existing instanceof HTMLLinkElement ? existing : document.createElement('link');

  link.setAttribute('rel', 'canonical');
  link.setAttribute('href', href);

  if (!existing) {
    document.head.append(link);
  }
}

function getCurrentUrl(path: string) {
  if (typeof window === 'undefined') {
    return `${DEFAULT_CANONICAL_URL}#${path === '/' ? '/' : path}`;
  }

  return window.location.href;
}

function getExampleMeta(exampleId: string | undefined, lang: Lang): SeoMeta {
  const copy = sharedCopy[lang];
  const example = examplesList.find((item) => item.id === exampleId);

  if (!example) {
    return {
      title: copy.missingTitle,
      description: copy.missingDescription,
      keywords: [...defaultKeywords, '404'],
      noIndex: true
    };
  }

  const title = lang === 'th' ? example.title.th : example.title.en;
  const description = lang === 'th' ? example.description.th : example.description.en;

  return {
    title: `${title} Example | ${BRAND}`,
    description,
    keywords: [...defaultKeywords, ...example.tags]
  };
}

function getBlogMeta(blogId: string | undefined, lang: Lang): SeoMeta {
  const copy = sharedCopy[lang];
  const post = blogPostsDetail.find((item) => item.id === blogId);

  if (!post) {
    return {
      title: copy.missingTitle,
      description: copy.missingDescription,
      keywords: [...defaultKeywords, '404'],
      noIndex: true
    };
  }

  const title = lang === 'th' ? post.title.th : post.title.en;
  const topics = post.tags.slice(0, 3).join(', ');
  const description = lang === 'th'
    ? `บทความเกี่ยวกับ ${title} พร้อมหัวข้อ ${topics}.`
    : `Tutorial and guide about ${title}. Topics: ${topics}.`;

  return {
    title: `${title} | ${BRAND} Blog`,
    description,
    keywords: [...defaultKeywords, ...post.tags],
    ogType: 'article',
    publishedTime: post.date,
    author: post.author
  };
}

function getRouteMeta(path: string, params: Record<string, string>, lang: Lang): SeoMeta {
  const copy = sharedCopy[lang];

  if (path === '/') {
    return {
      title: copy.homeTitle,
      description: copy.homeDescription,
      keywords: [...defaultKeywords, 'examples', 'tutorials', 'docs']
    };
  }

  if (path === '/docs') {
    return {
      title: copy.docsTitle,
      description: copy.docsDescription,
      keywords: [...defaultKeywords, 'CLI', 'WAPK', 'config', 'server']
    };
  }

  if (path === '/api') {
    return {
      title: copy.apiTitle,
      description: copy.apiDescription,
      keywords: [...defaultKeywords, 'API reference', 'DOM', 'state', 'router', 'server']
    };
  }

  if (path === '/examples') {
    return {
      title: copy.examplesTitle,
      description: copy.examplesDescription,
      keywords: [...defaultKeywords, 'interactive examples', 'games', 'CRUD', 'AI chat']
    };
  }

  if (path.startsWith('/examples/')) {
    return getExampleMeta(params.id, lang);
  }

  if (path === '/blog') {
    return {
      title: copy.blogTitle,
      description: copy.blogDescription,
      keywords: [...defaultKeywords, 'blog', 'tutorials', 'guides', 'release notes']
    };
  }

  if (path.startsWith('/blog/')) {
    return getBlogMeta(params.id, lang);
  }

  return {
    title: copy.missingTitle,
    description: copy.missingDescription,
    keywords: [...defaultKeywords, '404'],
    noIndex: true
  };
}

export function setupSeo(router: Router) {
  const syncSeo = () => {
    const route = router.currentRoute.value;
    const meta = getRouteMeta(route.path, route.params || {}, currentLang.value);

    document.documentElement.lang = currentLang.value;
    document.title = meta.title;

    upsertMeta('name', 'description', meta.description);
    upsertMeta('name', 'keywords', meta.keywords.join(', '));
    upsertMeta('name', 'application-name', SITE_NAME);
    upsertMeta('name', 'theme-color', '#6366f1');
    upsertMeta('name', 'color-scheme', 'dark light');
    upsertMeta('name', 'robots', meta.noIndex
      ? 'noindex,follow'
      : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1');

    upsertMeta('property', 'og:type', meta.ogType || 'website');
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:title', meta.title);
    upsertMeta('property', 'og:description', meta.description);
    upsertMeta('property', 'og:url', getCurrentUrl(route.path));
    upsertMeta('property', 'og:image', DEFAULT_OG_IMAGE_URL);
    upsertMeta('property', 'og:image:alt', currentLang.value === 'th'
      ? 'ภาพตัวอย่างเอกสาร Elit'
      : 'Elit documentation social preview');
    upsertMeta('property', 'og:locale', currentLang.value === 'th' ? 'th_TH' : 'en_US');
    upsertMeta('property', 'article:published_time', meta.publishedTime);
    upsertMeta('property', 'article:author', meta.author);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', meta.title);
    upsertMeta('name', 'twitter:description', meta.description);
    upsertMeta('name', 'twitter:image', DEFAULT_OG_IMAGE_URL);
    upsertMeta('name', 'twitter:image:alt', currentLang.value === 'th'
      ? 'ภาพตัวอย่างเอกสาร Elit'
      : 'Elit documentation social preview');

    upsertCanonical(DEFAULT_CANONICAL_URL);
  };

  syncSeo();
  router.currentRoute.subscribe(syncSeo);
  currentLang.subscribe(syncSeo);
}