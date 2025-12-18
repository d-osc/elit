import {
  div, h1, h2, section, p, span, article, routerLink
} from 'elit';
import { reactive } from 'elit';
import type { Router } from 'elit';
import { t, currentLang } from '../i18n';
import { examplesList } from './examples/exampleContent';

// Difficulty badge component
const DifficultyBadge = (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
  const colorMap = {
    beginner: 'var(--success)',
    intermediate: 'var(--warning)',
    advanced: 'var(--danger)'
  };

  const labelMap = {
    beginner: { en: 'Beginner', th: 'เริ่มต้น' },
    intermediate: { en: 'Intermediate', th: 'ปานกลาง' },
    advanced: { en: 'Advanced', th: 'ขั้นสูง' }
  };

  return reactive(currentLang, () =>
    span({
      className: 'difficulty-badge',
      style: `
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.875rem;
        font-weight: 600;
        background: ${colorMap[difficulty]}20;
        color: ${colorMap[difficulty]};
      `
    }, currentLang.value === 'th' ? labelMap[difficulty].th : labelMap[difficulty].en)
  );
};

// Example card component
const ExampleCard = (router: Router, example: typeof examplesList[0]) =>
  article({
    className: 'example-card',
    style: `
      background: var(--bg-card);
      border-radius: 12px;
      padding: 2rem;
      border: 1px solid var(--border);
      transition: all 0.3s ease;
      cursor: pointer;
      height: 100%;
      display: flex;
      flex-direction: column;
    `
  },
    div({ className: 'example-card-header', style: 'margin-bottom: 1rem;' },
      reactive(currentLang, () =>
        h2({
          className: 'example-card-title',
          style: 'margin: 0 0 0.5rem 0; color: var(--text-primary);'
        },
          routerLink(router, {
            to: `/examples/${example.id}`,
            style: 'color: inherit; text-decoration: none;'
          },
            currentLang.value === 'th' ? example.title.th : example.title.en
          )
        )
      ),
      DifficultyBadge(example.difficulty)
    ),
    reactive(currentLang, () =>
      p({
        className: 'example-card-description',
        style: 'color: var(--text-muted); margin: 1rem 0; flex-grow: 1; line-height: 1.6;'
      },
        currentLang.value === 'th' ? example.description.th : example.description.en
      )
    ),
    div({
      className: 'example-card-tags',
      style: 'display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: auto;'
    },
      ...example.tags.map(tag =>
        span({
          className: 'example-tag',
          style: `
            display: inline-block;
            padding: 0.25rem 0.75rem;
            background: var(--bg);
            border: 1px solid var(--border);
            border-radius: 8px;
            font-size: 0.875rem;
            color: var(--text-muted);
          `
        }, tag)
      )
    ),
    reactive(currentLang, () =>
      routerLink(router, {
        to: `/examples/${example.id}`,
        className: 'example-card-link',
        style: `
          margin-top: 1.5rem;
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          transition: gap 0.3s ease;
        `
      },
        currentLang.value === 'th' ? 'ดูตัวอย่าง →' : 'View Example →'
      )
    )
  );

// Main examples page
export const ExamplesListPage = (router: Router) =>
  section({ className: 'container', style: 'padding-top: 6rem;' },
    reactive(currentLang, () =>
      div({ className: 'examples-page' },
        h1({
          className: 'section-title',
          style: 'text-align: center; margin-bottom: 1rem;'
        }, currentLang.value === 'th' ? 'ตัวอย่าง' : 'Examples'),
        p({
          className: 'section-subtitle',
          style: 'text-align: center; margin-bottom: 3rem; color: var(--text-muted); max-width: 600px; margin-left: auto; margin-right: auto;'
        },
          currentLang.value === 'th'
            ? 'โปรเจกต์ตัวอย่างและเกมที่สร้างด้วย Elit เพื่อแสดงความสามารถของเฟรมเวิร์ก'
            : 'Example projects and games built with Elit to showcase the framework\'s capabilities'
        ),
        div({
          className: 'examples-grid',
          style: `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 2rem;
          `
        },
          ...examplesList.map(example => ExampleCard(router, example))
        )
      )
    )
  );
