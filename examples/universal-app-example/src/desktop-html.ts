import { dom } from '../../../src/dom';

import { APP_LINK, APP_NAME } from './shared';
import { createHeroBadge, createStatusCard, createUniversalShell } from './universal-components';
import { universalAppCss } from './web-styles';

export function renderDesktopHtml(options: { autoClose?: boolean } = {}): string {
    const appMarkup = dom.renderToString(createUniversalShell({
    iconChild: createHeroBadge(),
        heroActions: [
            {
                label: 'Ping native shell',
                className: 'btn btn-primary',
            action: 'desktop:ping',
            payload: { surface: 'desktop' },
            },
            {
                label: 'Close window',
                className: 'btn btn-secondary',
            action: 'desktop:quit',
            },
            {
                label: 'Open the Elit repository',
                className: 'btn btn-secondary',
                href: APP_LINK,
            },
        ],
        form: {
            title: 'Desktop shell and shared content',
            questionLabel: 'What is this desktop shell validating?',
            questionValue: 'shared component tree across web, desktop, and mobile',
            noteLabel: 'Desktop adapter note',
            noteValue: 'The desktop runtime renders the same VNode tree, then wires IPC through data attributes.',
            toggleLabel: 'Desktop shell is attached to the shared component layout',
            nativeEnabled: true,
            statusItems: [
                createStatusCard('Desktop markup now comes from the same shared component module as web and mobile.'),
                createStatusCard('IPC actions are attached by a tiny desktop-only script instead of a separate HTML layout.'),
            ],
        },
    }));

    const autoCloseScript = options.autoClose ? 'window.ipc?.postMessage("desktop:ready");' : '';

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${APP_NAME} Desktop</title>
  <style>${universalAppCss}</style>
</head>
<body>
  ${appMarkup}
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('[data-desktop-message], [data-elit-action], [data-elit-route]').forEach((element) => {
        element.addEventListener('click', (event) => {
          event.preventDefault();
          const action = element.getAttribute('data-elit-action');
          const route = element.getAttribute('data-elit-route');
          const payload = element.getAttribute('data-elit-payload');
          if (action || route || payload) {
            window.ipc?.postMessage(JSON.stringify({ type: 'bridge', action, route, payload }));
            return;
          }
          const message = element.getAttribute('data-desktop-message');
          if (message) {
            window.ipc?.postMessage(message);
          }
        });
      });
      ${autoCloseScript}
    });
  </script>
</body>
</html>`;
}
