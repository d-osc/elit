import { a, div, footer, p } from 'elit/el';

export function AppFooter() {
  return footer({ className: 'app-footer' },
    div({ className: 'app-footer-inner' },
      p({ className: 'footer-copy' },
        'Built with Elit. Persisted with elit/database. Ready for your own workflows, rules, and team-specific polish.'
      ),
      div({ className: 'footer-links' },
        a({ href: 'https://d-osc.github.io/elit/#/docs', target: '_blank', className: 'footer-link' }, 'Documentation'),
        a({ href: 'https://github.com/d-osc/elit', target: '_blank', className: 'footer-link' }, 'GitHub'),
        a({ href: '#', className: 'footer-link' }, 'databases/todo.ts')
      )
    )
  );
}