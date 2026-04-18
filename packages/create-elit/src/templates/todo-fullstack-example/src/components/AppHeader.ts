import { div, h1, header, p, span } from 'elit/el';
import { routerLink } from 'elit/router';
import type { Router } from 'elit';

export function AppHeader(router: Router) {
  return header({ className: 'app-header' },
    div({ className: 'app-header-inner' },
      div({ className: 'brand-block' },
        routerLink(router, { to: '/', className: 'brand-link' },
          span({ className: 'brand-mark' }, 'EL'),
          div({ className: 'brand-title-group' },
            h1({ className: 'brand-title' }, 'ELIT_PROJECT_NAME'),
            p({ className: 'brand-subtitle' }, 'A fullstack todo starter that writes directly to databases/todo.ts.')
          )
        )
      ),
      div({ className: 'header-pill' },
        span({ className: 'header-pill-label' }, 'Storage'),
        span({ className: 'header-pill-value' }, 'elit/database')
      )
    )
  );
}