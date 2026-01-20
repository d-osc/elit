import { header, nav, div, a, h1, button } from 'elit/el';
import { createState, reactive } from 'elit/state';
import type { Router } from 'elit';

export function Header(router: Router) {
  const isLoggedIn = createState(false);

  return header({ className: 'header' },
    nav({ className: 'nav' },
      div({ className: 'nav-brand' },
        a({ href: '#/', className: 'brand-link' },
          h1({ className: 'brand-title' }, 'My Elit App')
        )
      ),

      reactive(isLoggedIn, (loggedIn) => {
        if (loggedIn) {
          return div({ className: 'nav-menu' },
            a({ href: '#/profile', className: 'nav-link' }, 'Profile'),
            button({
              className: 'btn btn-secondary btn-sm',
              onclick: () => {
                isLoggedIn.value = false;
                router.push('/');
              }
            }, 'Logout')
          );
        }

        return div({ className: 'nav-menu' },
          a({ href: '#/login', className: 'nav-link' }, 'Login'),
          button({
            className: 'btn btn-primary btn-sm',
            onclick: () => router.push('/register')
          }, 'Sign Up')
        );
      })
    )
  );
}
