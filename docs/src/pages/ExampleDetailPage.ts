import { div, h1, section, p, span } from 'elit';
import { reactive, routerLink } from 'elit';
import type { Router } from 'elit';
import { currentLang } from '../i18n';
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
        padding: 0.5rem 1rem;
        border-radius: 12px;
        font-size: 0.875rem;
        font-weight: 600;
        background: ${colorMap[difficulty]}20;
        color: ${colorMap[difficulty]};
      `
    }, currentLang.value === 'th' ? labelMap[difficulty].th : labelMap[difficulty].en)
  );
};

// Example detail page component
export const ExampleDetailPage = (router: Router, exampleId: string) => {
  const example = examplesList.find(e => e.id === exampleId);

  if (!example) {
    return section({ className: 'container', style: 'padding-top: 6rem;' },
      reactive(currentLang, () =>
        div({ className: 'example-detail' },
          h1('404 - Example Not Found'),
          p(currentLang.value === 'th'
            ? 'ไม่พบตัวอย่างที่คุณกำลังมองหา'
            : 'The example you\'re looking for doesn\'t exist.'
          ),
          routerLink(router, {
            to: '/examples',
            className: 'btn btn-primary',
            style: 'margin-top: 2rem;'
          }, currentLang.value === 'th' ? '← กลับไปตัวอย่าง' : '← Back to Examples')
        )
      )
    );
  }

  return section({ className: 'container', style: 'padding-top: 6rem;' },
    reactive(currentLang, () =>
      div({ className: 'example-detail' },
        routerLink(router, {
          to: '/examples',
          className: 'example-back-link',
          style: `
            display: inline-block;
            margin-bottom: 2rem;
            color: var(--text-muted);
            text-decoration: none;
            font-weight: 600;
            transition: color 0.3s ease;
          `
        },
          currentLang.value === 'th' ? '← กลับไปตัวอย่าง' : '← Back to Examples'
        ),

        h1({
          className: 'example-detail-title',
          style: 'margin: 0 0 1rem 0; color: var(--text-primary);'
        },
          currentLang.value === 'th' ? example.title.th : example.title.en
        ),

        div({
          className: 'example-detail-meta',
          style: 'display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;'
        },
          DifficultyBadge(example.difficulty)
        ),

        div({
          className: 'example-detail-tags',
          style: 'display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 2rem;'
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

        p({
          className: 'example-detail-description',
          style: 'color: var(--text-muted); margin-bottom: 2rem; line-height: 1.6; font-size: 1.125rem;'
        },
          currentLang.value === 'th' ? example.description.th : example.description.en
        ),

        // Render the example content if it exists
        example.content
          ? div({ className: 'example-detail-content' }, example.content)
          : div({ className: 'example-detail-content' },
              p({ style: 'color: var(--text-muted);' },
                currentLang.value === 'th'
                  ? 'เนื้อหาตัวอย่างกำลังพัฒนา...'
                  : 'Example content is under development...'
              )
            )
      )
    )
  );
};
