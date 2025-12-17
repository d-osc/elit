import {
  div, h1, h2, h3, h4, p, a, span, button, nav, header, footer, section,
  code, pre, routerLink, reactive, img
} from 'elit';
import type { Router } from 'elit';
import { codeBlock } from './highlight';
import { t, switchLang, currentLang } from './i18n';
import { currentTheme, toggleTheme } from './theme';

// Header Component
export const Logo = (router: Router) =>
  routerLink(router, { to: '/', className: 'logo' },
    img({ className: 'logo-icon', src: '/elit/favicon.svg', alt: 'Elit Logo' }),
    span('Elit')
  );

export const Header = (router: Router) =>
  header({ className: 'header' },
    div({ className: 'container header-inner' },
      Logo(router),
      nav({ className: 'nav' },
        reactive(currentLang, () => routerLink(router, { to: '/' }, t('nav.home'))),
        reactive(currentLang, () => routerLink(router, { to: '/examples' }, t('nav.examples'))),
        reactive(currentLang, () => routerLink(router, { to: '/docs' }, t('nav.docs'))),
        reactive(currentLang, () => routerLink(router, { to: '/api' }, t('nav.api'))),
        reactive(currentLang, () => routerLink(router, { to: '/blog' }, t('nav.blog'))),
        a({ href: 'https://github.com/d-osc/elit', target: '_blank' }, 'GitHub'),
        button({
          className: 'btn-theme',
          onclick: toggleTheme,
          title: 'Toggle theme'
        },
          reactive(currentTheme, (theme) => span(theme === 'dark' ? '☀️' : '🌙'))
        ),
        button({ className: 'btn-lang', onclick: switchLang },
          reactive(currentLang, () => span(t('lang.switch')))
        )
      )
    )
  );

// Hero Component
export const Hero = (router: Router) =>
  section({ className: 'hero container' },
    reactive(currentLang, () => h1(t('hero.title'))),
    reactive(currentLang, () => p({ className: 'hero-subtitle' }, t('hero.subtitle'))),
    div({ className: 'hero-buttons' },
      reactive(currentLang, () => routerLink(router, { to: '/docs', className: 'btn btn-primary' }, t('hero.getStarted'))),
      reactive(currentLang, () => a({ href: 'https://github.com/d-osc/elit', className: 'btn btn-secondary', target: '_blank' }, t('hero.viewGithub')))
    ),
    div({ className: 'install-box' },
      code('npm install elit'),
      button({ onclick: () => navigator.clipboard.writeText('npm install elit') }, 'Copy')
    )
  );

// Features Component
const featureKeys = [
  { icon: '🚀', key: 'lightweight' },
  { icon: '⚡', key: 'fast' },
  { icon: '🔄', key: 'reactive' },
  { icon: '🎨', key: 'styling' },
  { icon: '📦', key: 'ssr' },
  { icon: '🛤️', key: 'routing' }
];

export const Features = () =>
  section({ id: 'features', className: 'features container' },
    reactive(currentLang, () => h2({ className: 'section-title' }, t('features.title'))),
    reactive(currentLang, () =>
      div({ className: 'features-grid' },
        ...featureKeys.map(f =>
          div({ className: 'feature-card' },
            div({ className: 'feature-icon' }, f.icon),
            h3(t(`features.${f.key}.title`)),
            p(t(`features.${f.key}.desc`))
          )
        )
      )
    )
  );

// Quick Start Section
const quickStartCode = `import { div, h1, button, span, createState, reactive, domNode } from 'elit';

// Create reactive state
const count = createState(0);

// Build UI with reactive updates
const app = div({ className: 'app' },
  h1('Hello Elit! 👋'),
  reactive(count, value =>
    div({ className: 'counter' },
      button({ onclick: () => count.value-- }, '-'),
      span(\` \${value} \`),
      button({ onclick: () => count.value++ }, '+')
    )
  )
);

// Render to DOM
domNode.render('#app', app);`;

export const QuickStart = (router: Router) =>
  section({ className: 'quick-start container' },
    reactive(currentLang, () => h2({ className: 'section-title' }, t('quickstart.title'))),
    div({ className: 'quick-start-content' },
      reactive(currentLang, () =>
        div({ className: 'quick-start-steps' },
          div({ className: 'step' },
            div({ className: 'step-number' }, '1'),
            div({ className: 'step-content' },
              h3(t('quickstart.install')),
              pre(code(...codeBlock('npm install elit')))
            )
          ),
          div({ className: 'step' },
            div({ className: 'step-number' }, '2'),
            div({ className: 'step-content' },
              h3(t('quickstart.import')),
              pre(code(...codeBlock("import { div, createState, reactive } from 'elit';")))
            )
          ),
          div({ className: 'step' },
            div({ className: 'step-number' }, '3'),
            div({ className: 'step-content' },
              h3(t('quickstart.create')),
              pre(code(...codeBlock('const app = div({ className: "app" }, "Hello World!");')))
            )
          ),
          div({ className: 'step' },
            div({ className: 'step-number' }, '4'),
            div({ className: 'step-content' },
              h3(t('quickstart.render')),
              pre(code(...codeBlock('domNode.render("#app", app);')))
            )
          )
        )
      ),
      reactive(currentLang, () =>
        div({ className: 'quick-start-code' },
          div({ className: 'code-header' }, t('quickstart.fullExample')),
          pre({ className: 'code-block' }, code(...codeBlock(quickStartCode)))
        )
      )
    ),
    div({ style: 'text-align: center; margin-top: 2rem;' },
      reactive(currentLang, () => routerLink(router, { to: '/docs', className: 'btn btn-primary' }, t('quickstart.readDocs')))
    )
  );

// Why Elit Section
const whyElitKeys = [
  { icon: '🎯', key: 'directDom' },
  { icon: '📦', key: 'zeroDeps' },
  { icon: '🔧', key: 'typescript' },
  { icon: '🌳', key: 'treeShake' }
];

export const WhyElit = () =>
  section({ className: 'why-elit container' },
    reactive(currentLang, () => h2({ className: 'section-title' }, t('why.title'))),
    reactive(currentLang, () => p({ className: 'section-subtitle' }, t('why.subtitle'))),
    reactive(currentLang, () =>
      div({ className: 'why-grid' },
        ...whyElitKeys.map(item =>
          div({ className: 'why-card' },
            span({ className: 'why-icon' }, item.icon),
            h3(t(`why.${item.key}.title`)),
            p(t(`why.${item.key}.desc`))
          )
        )
      )
    )
  );

// Code Comparison Section
const elitCode = `// Elit - Clean & Intuitive
import { div, h1, p, button } from 'elit';

const Card = (title, content) =>
  div({ className: 'card' },
    h1(title),
    p(content),
    button({ onclick: handleClick }, 'Click')
  );`;

const vanillaCode = `// Vanilla JS - Verbose
const card = document.createElement('div');
card.className = 'card';

const h1 = document.createElement('h1');
h1.textContent = title;

const p = document.createElement('p');
p.textContent = content;

const btn = document.createElement('button');
btn.textContent = 'Click';
btn.onclick = handleClick;

card.append(h1, p, btn);`;

export const CodeComparison = () =>
  section({ className: 'comparison container' },
    reactive(currentLang, () => h2({ className: 'section-title' }, t('comparison.title'))),
    reactive(currentLang, () => p({ className: 'section-subtitle' }, t('comparison.subtitle'))),
    div({ className: 'comparison-grid' },
      div({ className: 'comparison-card' },
        div({ className: 'comparison-header elit' }, 'Elit'),
        pre({ className: 'comparison-code' }, code(...codeBlock(elitCode)))
      ),
      div({ className: 'comparison-card' },
        div({ className: 'comparison-header vanilla' }, 'Vanilla JS'),
        pre({ className: 'comparison-code' }, code(...codeBlock(vanillaCode)))
      )
    )
  );

// API Overview Section
const apiCategoryKeys = [
  { icon: '🏗️', key: 'elements', count: '100+' },
  { icon: '⚡', key: 'state', count: '5' },
  { icon: '🔄', key: 'reactive', count: '6' },
  { icon: '🎨', key: 'styling', count: '30+' },
  { icon: '🛤️', key: 'router', count: '8' },
  { icon: '🚀', key: 'performance', count: '6' }
];

export const ApiOverview = (router: Router) =>
  section({ className: 'api-overview container' },
    reactive(currentLang, () => h2({ className: 'section-title' }, t('api.title'))),
    reactive(currentLang, () => p({ className: 'section-subtitle' }, t('api.subtitle'))),
    reactive(currentLang, () =>
      div({ className: 'api-grid' },
        ...apiCategoryKeys.map(cat =>
          div({ className: 'api-card' },
            span({ className: 'api-icon' }, cat.icon),
            h4(t(`api.${cat.key}`)),
            p({ className: 'api-desc' }, t(`api.${cat.key}.desc`)),
            span({ className: 'api-count' }, cat.count)
          )
        )
      )
    ),
    div({ style: 'text-align: center; margin-top: 2rem;' },
      reactive(currentLang, () => routerLink(router, { to: '/api', className: 'btn btn-secondary' }, t('api.viewFull')))
    )
  );

// Stats Section
export const Stats = () =>
  section({ className: 'stats' },
    reactive(currentLang, () =>
      div({ className: 'container stats-grid' },
        div({ className: 'stat' },
          span({ className: 'stat-number' }, '~10KB'),
          span({ className: 'stat-label' }, t('stats.size'))
        ),
        div({ className: 'stat' },
          span({ className: 'stat-number' }, '0'),
          span({ className: 'stat-label' }, t('stats.deps'))
        ),
        div({ className: 'stat' },
          span({ className: 'stat-number' }, '100+'),
          span({ className: 'stat-label' }, t('stats.elements'))
        ),
        div({ className: 'stat' },
          span({ className: 'stat-number' }, '18+'),
          span({ className: 'stat-label' }, t('stats.tutorials'))
        ),
        div({ className: 'stat' },
          span({ className: 'stat-number' }, '100%'),
          span({ className: 'stat-label' }, t('stats.typescript'))
        )
      )
    )
  );

// Featured Blogs Component
export const FeaturedBlogs = (router: Router) => {
  // Featured blog posts
  const featuredBlogPosts = [
    {
      id: '18',
      title: { en: 'Complete Guide to @elit/server', th: 'คู่มือครบวงจร @elit/server' },
      description: {
        en: 'Learn everything about @elit/server - REST API, middleware, WebSocket, and production deployment',
        th: 'เรียนรู้ทุกอย่างเกี่ยวกับ @elit/server - REST API, middleware, WebSocket และการ deploy แบบ production'
      },
      tags: ['@elit/server', 'REST API', 'Full Stack'],
      icon: '🚀'
    },
    {
      id: '17',
      title: { en: 'Hot Module Replacement with Elit', th: 'Hot Module Replacement กับ Elit' },
      description: {
        en: 'Master HMR for instant development feedback without page refresh. Boost your productivity!',
        th: 'เชี่ยวชาญ HMR เพื่อรับ feedback แบบทันทีโดยไม่ต้อง refresh หน้า เพิ่มประสิทธิภาพการพัฒนา!'
      },
      tags: ['HMR', 'Development', 'Workflow'],
      icon: '⚡'
    },
    {
      id: '16',
      title: { en: 'Building Real-time Blog with Shared State', th: 'สร้าง Blog แบบ Real-time ด้วย Shared State' },
      description: {
        en: 'Build a real-time blog application with WebSocket-based state synchronization',
        th: 'สร้างแอพ blog แบบ real-time ด้วยการซิงค์ state ผ่าน WebSocket'
      },
      tags: ['Shared State', 'Real-time', 'WebSocket'],
      icon: '🔄'
    }
  ];

  return section({ className: 'featured-blogs container' },
    reactive(currentLang, () => h2({ className: 'section-title' }, t('blogs.title'))),
    reactive(currentLang, () => p({ className: 'section-subtitle' }, t('blogs.subtitle'))),
    reactive(currentLang, () =>
      div({ className: 'blogs-grid' },
        ...featuredBlogPosts.map(blog =>
          div({ className: 'blog-card' },
            div({ className: 'blog-icon' }, blog.icon),
            h3(blog.title[currentLang.value]),
            p({ className: 'blog-description' }, blog.description[currentLang.value]),
            div({ className: 'blog-tags' },
              ...blog.tags.slice(0, 3).map(tag =>
                span({ className: 'blog-tag' }, tag)
              )
            ),
            routerLink(router, {
              to: `/blog/${blog.id}`,
              className: 'blog-link'
            }, t('blogs.readMore') + ' →')
          )
        )
      )
    ),
    div({ style: 'text-align: center; margin-top: 2rem;' },
      reactive(currentLang, () => routerLink(router, { to: '/blog', className: 'btn btn-secondary' }, t('blogs.viewAll')))
    )
  );
};

// Footer Component
export const Footer = () =>
  footer({ className: 'footer' },
    div({ className: 'container' },
      reactive(currentLang, () =>
        p(
          t('footer.license'), ' | ',
          a({ href: 'https://github.com/d-osc/elit' }, 'GitHub'),
          ' | ', t('footer.builtWith'), ' | ',
          'Created by ', a({ href: 'https://github.com/n-devs', target: '_blank' }, 'n-devs')
        )
      )
    )
  );
