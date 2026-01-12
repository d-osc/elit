import {
  div, h1, h2, h3, h4, p, a, span, button, nav, header, footer, section,
  code, pre, routerLink, reactive, img, computed
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

export const Header = (router: Router) => {
  const isActive = (path: string, currentPath: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  // Computed state that combines currentLang and currentRoute
  const navState = computed([currentLang, router.currentRoute], (lang, route) => ({
    lang,
    currentPath: route.path
  }));

  return header({ className: 'header' },
    div({ className: 'container header-inner' },
      Logo(router),
      nav({ className: 'nav' },
        reactive(navState, (state) =>
          routerLink(router, {
            to: '/',
            className: isActive('/', state.currentPath) ? 'active' : ''
          }, t('nav.home'))
        ),
        reactive(navState, (state) =>
          routerLink(router, {
            to: '/examples',
            className: isActive('/examples', state.currentPath) ? 'active' : ''
          }, t('nav.examples'))
        ),
        reactive(navState, (state) =>
          routerLink(router, {
            to: '/docs',
            className: isActive('/docs', state.currentPath) ? 'active' : ''
          }, t('nav.docs'))
        ),
        reactive(navState, (state) =>
          routerLink(router, {
            to: '/api',
            className: isActive('/api', state.currentPath) ? 'active' : ''
          }, t('nav.api'))
        ),
        reactive(navState, (state) =>
          routerLink(router, {
            to: '/blog',
            className: isActive('/blog', state.currentPath) ? 'active' : ''
          }, t('nav.blog'))
        ),
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
};

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
      code('npm create elit@latest'),
      button({ onclick: () => navigator.clipboard.writeText('npm create elit@latest') }, 'Copy')
    )
  );

// Features Component
const featureKeys = [
  { icon: '🚀', key: 'lightweight' },
  { icon: '⚡', key: 'fast' },
  { icon: '🔄', key: 'reactive' },
  { icon: '🎨', key: 'styling' },
  { icon: '🌐', key: 'server' },
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
const quickStartCode = `// 1. Create a new Elit project
npm create elit@latest my-app
cd my-app

// 2. Start dev server with HMR
npm run dev

// Or install manually:
npm install elit

// 3. Create your app (src/main.ts)
import { div, h1, button, createState, reactive, dom } from 'elit';

const count = createState(0);

const app = div({ className: 'app' },
  h1('Elit 🚀'),
  reactive(count, value =>
    div({ className: 'counter' },
      button({ onclick: () => count.value-- }, '-'),
      span(\` Count: \${value} \`),
      button({ onclick: () => count.value++ }, '+')
    )
  )
);

dom.render('#app', app);

// Hot reload automatically on save!`;

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
              pre(code(...codeBlock('npm create elit@latest my-app')))
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
              pre(code(...codeBlock('dom.render("#app", app);')))
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

// Elit vs Next.js Comparison
const elitFullStackCode = `// Elit - Full-Stack in One File
import { div, h1, button, createState, reactive, dom, router } from 'elit';

// Client-side state
const count = createState(0);

// Client router
const appRouter = router()
  .get('/', () => div(h1('Home'), reactive(count, c => \`Count: \${c}\`)))
  .get('/about', () => div(h1('About')));

// Server API (elit.config.mjs)
export default {
  dev: {
    api: router()
      .get('/api/data', (req, res) => res.json({ count: 42 }))
  },
  build: { entry: 'src/main.ts', outDir: 'dist' }
};

dom.render('#app', appRouter);`;

const nextjsFullStackCode = `// Next.js - Multiple Files & Conventions
// pages/index.tsx
'use client';
import { useState } from 'react';
export default function Home() {
  const [count, setCount] = useState(0);
  return <h1>Count: {count}</h1>;
}

// pages/api/data.ts
export default function handler(req, res) {
  res.status(200).json({ count: 42 });
}

// next.config.js
module.exports = { /* config */ };

// package.json dependencies
// react, react-dom, next (500KB+ runtime)`;

export const ElitVsNextjs = () =>
  section({ className: 'framework-comparison container' },
    reactive(currentLang, () => h2({ className: 'section-title' }, t('vsNextjs.title'))),
    reactive(currentLang, () => p({ className: 'section-subtitle' }, t('vsNextjs.subtitle'))),

    div({ className: 'comparison-grid' },
      div({ className: 'comparison-card' },
        div({ className: 'comparison-header elit' }, 'Elit'),
        pre({ className: 'comparison-code' }, code(...codeBlock(elitFullStackCode)))
      ),
      div({ className: 'comparison-card' },
        div({ className: 'comparison-header nextjs' }, 'Next.js'),
        pre({ className: 'comparison-code' }, code(...codeBlock(nextjsFullStackCode)))
      )
    ),

    reactive(currentLang, () =>
      div({ className: 'comparison-table' },
        h3(t('vsNextjs.tableTitle')),
        div({ className: 'table-responsive' },
          div({ className: 'comparison-row table-header' },
            div({ className: 'comparison-cell' }, t('vsNextjs.feature')),
            div({ className: 'comparison-cell' }, 'Elit'),
            div({ className: 'comparison-cell' }, 'Next.js')
          ),
          div({ className: 'comparison-row' },
            div({ className: 'comparison-cell' }, t('vsNextjs.bundleSize')),
            div({ className: 'comparison-cell success' }, '11-15KB'),
            div({ className: 'comparison-cell' }, '~140KB+')
          ),
          div({ className: 'comparison-row' },
            div({ className: 'comparison-cell' }, t('vsNextjs.dependencies')),
            div({ className: 'comparison-cell success' }, '0 runtime'),
            div({ className: 'comparison-cell' }, 'React + Next')
          ),
          div({ className: 'comparison-row' },
            div({ className: 'comparison-cell' }, t('vsNextjs.devServer')),
            div({ className: 'comparison-cell success' }, t('vsNextjs.devServerElit')),
            div({ className: 'comparison-cell' }, t('vsNextjs.devServerNext'))
          ),
          div({ className: 'comparison-row' },
            div({ className: 'comparison-cell' }, t('vsNextjs.apiRoutes')),
            div({ className: 'comparison-cell success' }, t('vsNextjs.apiRoutesElit')),
            div({ className: 'comparison-cell' }, t('vsNextjs.apiRoutesNext'))
          ),
          div({ className: 'comparison-row' },
            div({ className: 'comparison-cell' }, t('vsNextjs.routing')),
            div({ className: 'comparison-cell success' }, t('vsNextjs.routingElit')),
            div({ className: 'comparison-cell' }, t('vsNextjs.routingNext'))
          ),
          div({ className: 'comparison-row' },
            div({ className: 'comparison-cell' }, t('vsNextjs.state')),
            div({ className: 'comparison-cell success' }, t('vsNextjs.stateElit')),
            div({ className: 'comparison-cell' }, t('vsNextjs.stateNext'))
          ),
          div({ className: 'comparison-row' },
            div({ className: 'comparison-cell' }, t('vsNextjs.ssr')),
            div({ className: 'comparison-cell success' }, t('vsNextjs.ssrElit')),
            div({ className: 'comparison-cell success' }, t('vsNextjs.ssrNext'))
          ),
          div({ className: 'comparison-row' },
            div({ className: 'comparison-cell' }, t('vsNextjs.build')),
            div({ className: 'comparison-cell success' }, t('vsNextjs.buildElit')),
            div({ className: 'comparison-cell' }, t('vsNextjs.buildNext'))
          ),
          div({ className: 'comparison-row' },
            div({ className: 'comparison-cell' }, t('vsNextjs.learning')),
            div({ className: 'comparison-cell success' }, t('vsNextjs.learningElit')),
            div({ className: 'comparison-cell' }, t('vsNextjs.learningNext'))
          ),
          div({ className: 'comparison-row' },
            div({ className: 'comparison-cell' }, t('vsNextjs.typescript')),
            div({ className: 'comparison-cell success' }, t('vsNextjs.typescriptElit')),
            div({ className: 'comparison-cell success' }, t('vsNextjs.typescriptNext'))
          )
        )
      )
    ),

    reactive(currentLang, () =>
      div({ className: 'comparison-summary' },
        h3(t('vsNextjs.summaryTitle')),
        div({ className: 'summary-grid' },
          div({ className: 'summary-card pros' },
            span({ className: 'summary-icon' }, '🎯'),
            h4(t('vsNextjs.useElitTitle')),
            p(t('vsNextjs.useElitDesc'))
          ),
          div({ className: 'summary-card' },
            span({ className: 'summary-icon' }, '⚛️'),
            h4(t('vsNextjs.useNextTitle')),
            p(t('vsNextjs.useNextDesc'))
          )
        ),

        // Pros & Cons
        div({ className: 'pros-cons-grid' },
          div({ className: 'pros-cons-card' },
            h4({ className: 'pros-title' }, t('vsNextjs.elitPros')),
            div({ className: 'pros-cons-list' },
              div({ className: 'pros-cons-item pros' }, '✓ ', t('vsNextjs.proLightweight')),
              div({ className: 'pros-cons-item pros' }, '✓ ', t('vsNextjs.proZeroDeps')),
              div({ className: 'pros-cons-item pros' }, '✓ ', t('vsNextjs.proFastBuild')),
              div({ className: 'pros-cons-item pros' }, '✓ ', t('vsNextjs.proSimple')),
              div({ className: 'pros-cons-item pros' }, '✓ ', t('vsNextjs.proDirectDom')),
              div({ className: 'pros-cons-item pros' }, '✓ ', t('vsNextjs.proFullControl'))
            )
          ),
          div({ className: 'pros-cons-card' },
            h4({ className: 'cons-title' }, t('vsNextjs.elitCons')),
            div({ className: 'pros-cons-list' },
              div({ className: 'pros-cons-item cons' }, '✗ ', t('vsNextjs.conNewFramework')),
              div({ className: 'pros-cons-item cons' }, '✗ ', t('vsNextjs.conSmallCommunity')),
              div({ className: 'pros-cons-item cons' }, '✗ ', t('vsNextjs.conFewerPlugins')),
              div({ className: 'pros-cons-item cons' }, '✗ ', t('vsNextjs.conManualOptimization'))
            )
          )
        )
      )
    )
  );

// Framework Comparison Table (Elit vs All)
export const FrameworkComparison = () =>
  section({ className: 'all-frameworks-comparison container' },
    reactive(currentLang, () => h2({ className: 'section-title' }, t('frameworks.title'))),
    reactive(currentLang, () => p({ className: 'section-subtitle' }, t('frameworks.subtitle'))),

    reactive(currentLang, () =>
      div({ className: 'frameworks-table-wrapper' },
        div({ className: 'frameworks-table' },
          // Header
          div({ className: 'frameworks-row header' },
            div({ className: 'frameworks-cell' }, t('frameworks.feature')),
            div({ className: 'frameworks-cell highlight' }, 'Elit'),
            div({ className: 'frameworks-cell' }, 'React'),
            div({ className: 'frameworks-cell' }, 'Vue'),
            div({ className: 'frameworks-cell' }, 'Svelte'),
            div({ className: 'frameworks-cell' }, 'SolidJS')
          ),

          // Bundle Size
          div({ className: 'frameworks-row' },
            div({ className: 'frameworks-cell label' }, t('frameworks.bundleSize')),
            div({ className: 'frameworks-cell highlight best' }, '~10KB'),
            div({ className: 'frameworks-cell' }, '~140KB'),
            div({ className: 'frameworks-cell' }, '~35KB'),
            div({ className: 'frameworks-cell good' }, '~7KB'),
            div({ className: 'frameworks-cell good' }, '~7KB')
          ),

          // Runtime Deps
          div({ className: 'frameworks-row' },
            div({ className: 'frameworks-cell label' }, t('frameworks.runtimeDeps')),
            div({ className: 'frameworks-cell highlight best' }, '0'),
            div({ className: 'frameworks-cell' }, 'React + ReactDOM'),
            div({ className: 'frameworks-cell' }, 'Vue core'),
            div({ className: 'frameworks-cell good' }, 'Compiled away'),
            div({ className: 'frameworks-cell good' }, 'Minimal runtime')
          ),

          // Performance
          div({ className: 'frameworks-row' },
            div({ className: 'frameworks-cell label' }, t('frameworks.performance')),
            div({ className: 'frameworks-cell highlight best' }, t('frameworks.perfElit')),
            div({ className: 'frameworks-cell' }, t('frameworks.perfReact')),
            div({ className: 'frameworks-cell good' }, t('frameworks.perfVue')),
            div({ className: 'frameworks-cell best' }, t('frameworks.perfSvelte')),
            div({ className: 'frameworks-cell best' }, t('frameworks.perfSolid'))
          ),

          // Reactivity
          div({ className: 'frameworks-row' },
            div({ className: 'frameworks-cell label' }, t('frameworks.reactivity')),
            div({ className: 'frameworks-cell highlight' }, t('frameworks.reactElit')),
            div({ className: 'frameworks-cell' }, t('frameworks.reactReact')),
            div({ className: 'frameworks-cell' }, t('frameworks.reactVue')),
            div({ className: 'frameworks-cell' }, t('frameworks.reactSvelte')),
            div({ className: 'frameworks-cell' }, t('frameworks.reactSolid'))
          ),

          // Server Features
          div({ className: 'frameworks-row' },
            div({ className: 'frameworks-cell label' }, t('frameworks.serverFeatures')),
            div({ className: 'frameworks-cell highlight best' }, t('frameworks.serverElit')),
            div({ className: 'frameworks-cell' }, t('frameworks.serverReact')),
            div({ className: 'frameworks-cell' }, t('frameworks.serverVue')),
            div({ className: 'frameworks-cell' }, t('frameworks.serverSvelte')),
            div({ className: 'frameworks-cell' }, t('frameworks.serverSolid'))
          ),

          // Learning Curve
          div({ className: 'frameworks-row' },
            div({ className: 'frameworks-cell label' }, t('frameworks.learningCurve')),
            div({ className: 'frameworks-cell highlight best' }, t('frameworks.learnElit')),
            div({ className: 'frameworks-cell' }, t('frameworks.learnReact')),
            div({ className: 'frameworks-cell good' }, t('frameworks.learnVue')),
            div({ className: 'frameworks-cell good' }, t('frameworks.learnSvelte')),
            div({ className: 'frameworks-cell' }, t('frameworks.learnSolid'))
          ),

          // Ecosystem
          div({ className: 'frameworks-row' },
            div({ className: 'frameworks-cell label' }, t('frameworks.ecosystem')),
            div({ className: 'frameworks-cell highlight' }, t('frameworks.ecoElit')),
            div({ className: 'frameworks-cell best' }, t('frameworks.ecoReact')),
            div({ className: 'frameworks-cell best' }, t('frameworks.ecoVue')),
            div({ className: 'frameworks-cell good' }, t('frameworks.ecoSvelte')),
            div({ className: 'frameworks-cell' }, t('frameworks.ecoSolid'))
          ),

          // TypeScript
          div({ className: 'frameworks-row' },
            div({ className: 'frameworks-cell label' }, t('frameworks.typescript')),
            div({ className: 'frameworks-cell highlight best' }, t('frameworks.tsElit')),
            div({ className: 'frameworks-cell best' }, t('frameworks.tsReact')),
            div({ className: 'frameworks-cell best' }, t('frameworks.tsVue')),
            div({ className: 'frameworks-cell best' }, t('frameworks.tsSvelte')),
            div({ className: 'frameworks-cell best' }, t('frameworks.tsSolid'))
          ),

          // Build Speed
          div({ className: 'frameworks-row' },
            div({ className: 'frameworks-cell label' }, t('frameworks.buildSpeed')),
            div({ className: 'frameworks-cell highlight best' }, t('frameworks.buildElit')),
            div({ className: 'frameworks-cell' }, t('frameworks.buildReact')),
            div({ className: 'frameworks-cell' }, t('frameworks.buildVue')),
            div({ className: 'frameworks-cell good' }, t('frameworks.buildSvelte')),
            div({ className: 'frameworks-cell good' }, t('frameworks.buildSolid'))
          )
        )
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
  { icon: '🚀', key: 'performance', count: '6' },
  { icon: '🔥', key: 'devServer', count: '10+' },
  { icon: '📦', key: 'build', count: '5' },
  { icon: '🌐', key: 'restApi', count: '12+' }
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
          span({ className: 'stat-number' }, '11KB'),
          span({ className: 'stat-label' }, t('stats.size'))
        ),
        div({ className: 'stat' },
          span({ className: 'stat-number' }, '0'),
          span({ className: 'stat-label' }, t('stats.deps'))
        ),
        div({ className: 'stat' },
          span({ className: 'stat-number' }, 'v3.1.2'),
          span({ className: 'stat-label' }, t('stats.version'))
        ),
        div({ className: 'stat' },
          span({ className: 'stat-number' }, '10K+'),
          span({ className: 'stat-label' }, 'req/s')
        ),
        div({ className: 'stat' },
          span({ className: 'stat-number' }, '<7ms'),
          span({ className: 'stat-label' }, 'latency')
        ),
        div({ className: 'stat' },
          span({ className: 'stat-number' }, '3'),
          span({ className: 'stat-label' }, 'runtimes')
        )
      )
    )
  );

// Performance Benchmark Section
export const PerformanceBenchmark = () =>
  section({ className: 'performance-benchmark container' },
    reactive(currentLang, () => h2({ className: 'section-title' }, t('benchmark.title'))),
    reactive(currentLang, () => p({ className: 'section-subtitle' }, t('benchmark.subtitle'))),

    reactive(currentLang, () =>
      div({ className: 'benchmark-content-multi' },
        // Node.js Benchmark
        div({ className: 'runtime-benchmark' },
          div({ className: 'runtime-header' },
            div({ className: 'runtime-icon' }, '🟢'),
            h3({ className: 'runtime-title' }, 'Node.js v20.19.5'),
            div({ className: 'runtime-badge' }, t('benchmark.production'))
          ),

          div({ className: 'chart-bars' },
            // Elit on Node.js (Actual benchmark results)
            div({ className: 'chart-bar-wrapper' },
              div({ className: 'chart-label' },
                div({ className: 'framework-name elit' }, 'Elit'),
                span({ className: 'chart-value' }, '5,943 req/s')
              ),
              div({ className: 'chart-bar-container' },
                div({ className: 'chart-bar bar-elit', style: 'width: 100%;' })
              ),
              div({ className: 'chart-latency' }, t('benchmark.latency') + ': 16.67ms')
            ),

            // Express on Node.js (Actual benchmark results)
            div({ className: 'chart-bar-wrapper' },
              div({ className: 'chart-label' },
                div({ className: 'framework-name' }, 'Express'),
                span({ className: 'chart-value' }, '3,744 req/s')
              ),
              div({ className: 'chart-bar-container' },
                div({ className: 'chart-bar bar-express', style: 'width: 63%;' })
              ),
              div({ className: 'chart-latency' }, t('benchmark.latency') + ': 26.58ms')
            )
          ),

          div({ className: 'runtime-summary' },
            span({ className: 'summary-icon' }, '🏆'),
            span(t('benchmark.elitFaster') + ' 59% ' + t('benchmark.thanExpress'))
          )
        ),

        // Bun Benchmark
        div({ className: 'runtime-benchmark' },
          div({ className: 'runtime-header' },
            div({ className: 'runtime-icon' }, '🔥'),
            h3({ className: 'runtime-title' }, 'Bun v1.3.2'),
            div({ className: 'runtime-badge badge-fast' }, t('benchmark.fastest'))
          ),

          div({ className: 'chart-bars' },
            // Elit on Bun (Winner!)
            div({ className: 'chart-bar-wrapper' },
              div({ className: 'chart-label' },
                div({ className: 'framework-name elit' }, 'Elit ⚡'),
                span({ className: 'chart-value' }, '14,301 req/s')
              ),
              div({ className: 'chart-bar-container' },
                div({ className: 'chart-bar bar-elit', style: 'width: 100%;' })
              ),
              div({ className: 'chart-latency' }, t('benchmark.latency') + ': 6.96ms')
            ),

            // Express v5 on Bun
            div({ className: 'chart-bar-wrapper' },
              div({ className: 'chart-label' },
                div({ className: 'framework-name' }, 'Express v5'),
                span({ className: 'chart-value' }, '13,025 req/s')
              ),
              div({ className: 'chart-bar-container' },
                div({ className: 'chart-bar bar-express', style: 'width: 91%;' })
              ),
              div({ className: 'chart-latency' }, t('benchmark.latency') + ': 7.65ms')
            ),

            // Elysia on Bun
            div({ className: 'chart-bar-wrapper' },
              div({ className: 'chart-label' },
                div({ className: 'framework-name' }, 'Elysia'),
                span({ className: 'chart-value' }, '11,914 req/s')
              ),
              div({ className: 'chart-bar-container' },
                div({ className: 'chart-bar bar-elysia', style: 'width: 83%;' })
              ),
              div({ className: 'chart-latency' }, t('benchmark.latency') + ': 8.37ms')
            )
          ),

          div({ className: 'runtime-summary' },
            span({ className: 'summary-icon' }, '⚡'),
            span(t('benchmark.elitFaster') + ' 20% ' + t('benchmark.thanElysia'))
          )
        ),

        // Deno Benchmark
        div({ className: 'runtime-benchmark' },
          div({ className: 'runtime-header' },
            div({ className: 'runtime-icon' }, '🦕'),
            h3({ className: 'runtime-title' }, 'Deno v2.5.6'),
            div({ className: 'runtime-badge badge-secure' }, t('benchmark.secure'))
          ),

          div({ className: 'chart-bars' },
            // Elit on Deno (Actual benchmark results)
            div({ className: 'chart-bar-wrapper' },
              div({ className: 'chart-label' },
                div({ className: 'framework-name elit' }, 'Elit'),
                span({ className: 'chart-value' }, '7,223 req/s')
              ),
              div({ className: 'chart-bar-container' },
                div({ className: 'chart-bar bar-elit', style: 'width: 100%;' })
              ),
              div({ className: 'chart-latency' }, t('benchmark.latency') + ': 13.69ms')
            )
          ),

          div({ className: 'runtime-summary' },
            span({ className: 'summary-icon' }, '🛡️'),
            span(t('benchmark.denoNote'))
          )
        )
      )
    ),

    // Config and Why Fast section
    reactive(currentLang, () =>
      div({ className: 'benchmark-footer' },
        div({ className: 'benchmark-config' },
          h4(t('benchmark.configTitle')),
          div({ className: 'config-grid' },
            div({ className: 'config-item' },
              span({ className: 'config-label' }, t('benchmark.warmup')),
              span({ className: 'config-value' }, '1,000')
            ),
            div({ className: 'config-item' },
              span({ className: 'config-label' }, t('benchmark.requests')),
              span({ className: 'config-value' }, '10,000')
            ),
            div({ className: 'config-item' },
              span({ className: 'config-label' }, t('benchmark.concurrent')),
              span({ className: 'config-value' }, '100')
            ),
            div({ className: 'config-item' },
              span({ className: 'config-label' }, t('benchmark.endpoint')),
              span({ className: 'config-value' }, 'GET /')
            )
          ),
          h4({ style: 'margin-top: 1.5rem;' }, t('benchmark.systemSpec')),
          div({ className: 'config-grid' },
            div({ className: 'config-item' },
              span({ className: 'config-label' }, t('benchmark.platform')),
              span({ className: 'config-value' }, 'Windows 11 Pro (26200)')
            ),
            div({ className: 'config-item' },
              span({ className: 'config-label' }, t('benchmark.cpu')),
              span({ className: 'config-value' }, 'Intel 13th/14th Gen @ 2.5GHz')
            ),
            div({ className: 'config-item' },
              span({ className: 'config-label' }, t('benchmark.memory')),
              span({ className: 'config-value' }, '64GB RAM (65,246 MB)')
            ),
            div({ className: 'config-item' },
              span({ className: 'config-label' }, t('benchmark.motherboard')),
              span({ className: 'config-value' }, 'ASRock B760M PG Lightning')
            ),
            div({ className: 'config-item' },
              span({ className: 'config-label' }, t('benchmark.network')),
              span({ className: 'config-value' }, 'Realtek 2.5GbE')
            ),
            div({ className: 'config-item' },
              span({ className: 'config-label' }, t('benchmark.testDate')),
              span({ className: 'config-value' }, '2025-12-21')
            )
          ),
          h4({ style: 'margin-top: 1.5rem;' }, t('benchmark.runtimeVersions')),
          div({ className: 'config-grid' },
            div({ className: 'config-item' },
              span({ className: 'config-label' }, t('benchmark.nodeVersion')),
              span({ className: 'config-value' }, 'v20.19.5 (V8 11.3)')
            ),
            div({ className: 'config-item' },
              span({ className: 'config-label' }, t('benchmark.bunVersion')),
              span({ className: 'config-value' }, 'v1.3.2 (JSC)')
            ),
            div({ className: 'config-item' },
              span({ className: 'config-label' }, t('benchmark.denoVersion')),
              span({ className: 'config-value' }, 'v2.5.6 (V8 14.0)')
            ),
            div({ className: 'config-item' },
              span({ className: 'config-label' }, t('benchmark.architecture')),
              span({ className: 'config-value' }, 'x86_64 Windows')
            )
          )
        ),

        div({ className: 'benchmark-reasons' },
          h4(t('benchmark.whyFast')),
          div({ className: 'reasons-grid' },
            div({ className: 'reason-item' },
              span({ className: 'reason-icon' }, '⚡'),
              div({ className: 'reason-content' },
                div({ className: 'reason-title' }, t('benchmark.reasonTitle1')),
                div({ className: 'reason-desc' }, t('benchmark.reason1'))
              )
            ),
            div({ className: 'reason-item' },
              span({ className: 'reason-icon' }, '🎯'),
              div({ className: 'reason-content' },
                div({ className: 'reason-title' }, t('benchmark.reasonTitle2')),
                div({ className: 'reason-desc' }, t('benchmark.reason2'))
              )
            ),
            div({ className: 'reason-item' },
              span({ className: 'reason-icon' }, '📦'),
              div({ className: 'reason-content' },
                div({ className: 'reason-title' }, t('benchmark.reasonTitle3')),
                div({ className: 'reason-desc' }, t('benchmark.reason3'))
              )
            ),
            div({ className: 'reason-item' },
              span({ className: 'reason-icon' }, '🚀'),
              div({ className: 'reason-content' },
                div({ className: 'reason-title' }, t('benchmark.reasonTitle4')),
                div({ className: 'reason-desc' }, t('benchmark.reason4'))
              )
            ),
            div({ className: 'reason-item' },
              span({ className: 'reason-icon' }, '💎'),
              div({ className: 'reason-content' },
                div({ className: 'reason-title' }, t('benchmark.reasonTitle5')),
                div({ className: 'reason-desc' }, t('benchmark.reason5'))
              )
            ),
            div({ className: 'reason-item' },
              span({ className: 'reason-icon' }, '🔧'),
              div({ className: 'reason-content' },
                div({ className: 'reason-title' }, t('benchmark.reasonTitle6')),
                div({ className: 'reason-desc' }, t('benchmark.reason6'))
              )
            )
          )
        )
      )
    ),

    reactive(currentLang, () =>
      div({ className: 'benchmark-note' },
        p({ style: 'margin: 0; font-size: 0.9rem; color: var(--text-muted); text-align: center;' },
          t('benchmark.note')
        )
      )
    )
  );

// Featured Examples Component
export const FeaturedExamples = (router: Router) => {
  // Top 3 featured examples - showcase most impressive demos
  const featuredExamples = [
    {
      id: '3d-scene',
      title: { en: '3D Scene', th: 'ฉาก 3D' },
      description: {
        en: 'Interactive 3D graphics with camera controls, lighting, and real-time transformations',
        th: 'กราฟิก 3D แบบอินเทอร์แอคทีฟพร้อมการควบคุมกล้อง แสง และการแปลงแบบเรียลไทม์'
      },
      difficulty: 'advanced',
      tags: ['3D', 'Canvas', 'Graphics'],
      icon: '🎨',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#667eea'
    },
    {
      id: 'ai-chat',
      title: { en: 'AI Chat Assistant', th: 'ผู้ช่วย AI Chat' },
      description: {
        en: 'AI-powered chat with streaming responses, multiple conversations, and message history',
        th: 'แชท AI พร้อมการตอบสนองแบบสตรีมมิ่ง การสนทนาหลายเธรด และประวัติข้อความ'
      },
      difficulty: 'advanced',
      tags: ['AI', 'Chat', 'Streaming'],
      icon: '🤖',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      color: '#f5576c'
    },
    {
      id: 'rpg-game',
      title: { en: 'RPG Game', th: 'เกม RPG' },
      description: {
        en: 'Turn-based RPG with combat system, character progression, inventory, and quests',
        th: 'เกม RPG แบบเทิร์นพร้อมระบบการต่อสู้ การพัฒนาตัวละคร ของใช้ และเควส'
      },
      difficulty: 'advanced',
      tags: ['Game', 'Combat', 'Progression'],
      icon: '⚔️',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      color: '#00f2fe'
    }
  ];

  return section({ className: 'featured-examples container' },
    reactive(currentLang, () => h2({ className: 'section-title' }, t('examples.title'))),
    reactive(currentLang, () => p({ className: 'section-subtitle' }, t('examples.subtitle'))),
    reactive(currentLang, () =>
      div({ className: 'examples-grid' },
        ...featuredExamples.map(example =>
          div({ className: 'example-card' },
            div({
              className: 'example-header',
              style: `background: ${example.gradient}; padding: 2rem; border-radius: 12px 12px 0 0; text-align: center;`
            },
              div({ style: 'font-size: 3rem; margin-bottom: 0.5rem;' }, example.icon),
              h3({ style: 'color: white; margin: 0; font-size: 1.5rem;' }, example.title[currentLang.value])
            ),
            div({ className: 'example-body', style: 'padding: 1.5rem;' },
              p({ className: 'example-description', style: 'margin-bottom: 1.5rem; line-height: 1.6;' },
                example.description[currentLang.value]
              ),
              div({ className: 'example-tags', style: 'margin-bottom: 1.5rem;' },
                ...example.tags.map(tag =>
                  span({
                    className: 'example-tag',
                    style: 'background: rgba(0,0,0,0.05); padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem; margin-right: 0.5rem;'
                  }, tag)
                )
              ),
              routerLink(router, {
                to: `/examples/${example.id}`,
                className: 'example-link',
                style: `background: ${example.color}; color: white; display: inline-block; padding: 0.75rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600; transition: transform 0.2s; width: 100%; text-align: center; box-sizing: border-box;`
              }, t('examples.tryIt') + ' →')
            )
          )
        )
      )
    ),
    div({ style: 'text-align: center; margin-top: 3rem;' },
      reactive(currentLang, () =>
        div(
          p({ style: 'margin-bottom: 1rem; color: #666; font-size: 0.95rem;' },
            currentLang.value === 'en' ? '11 interactive examples available' : 'มี 11 ตัวอย่างแบบอินเทอร์แอคทีฟ'
          ),
          routerLink(router, {
            to: '/examples',
            className: 'btn btn-secondary',
            style: 'padding: 0.875rem 2.5rem; font-size: 1.05rem;'
          }, t('examples.viewAll'))
        )
      )
    )
  );
};

// Featured Blogs Component
export const FeaturedBlogs = (router: Router) => {
  // Featured blog posts
  const featuredBlogPosts = [
    {
      id: '18',
      title: { en: 'Complete Guide to elit-server', th: 'คู่มือครบวงจร elit-server' },
      description: {
        en: 'Learn everything about elit-server - REST API, middleware, WebSocket, and production deployment',
        th: 'เรียนรู้ทุกอย่างเกี่ยวกับ elit-server - REST API, middleware, WebSocket และการ deploy แบบ production'
      },
      tags: ['elit-server', 'REST API', 'Full Stack'],
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
          ' | ', t('footer.builtWith'), ' v3.1.2 | ',
          'Created by ', a({ href: 'https://github.com/n-devs', target: '_blank' }, 'n-devs')
        )
      )
    )
  );
