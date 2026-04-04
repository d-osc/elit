import { renderToString } from './dom';
import {
    clearCapturedRenderedVNode,
    getCapturedRenderedVNode,
    getDesktopRenderOptions,
    type DesktopRenderOptions,
} from './render-context';
import { styles } from './style';

const DESKTOP_RENDER_TRACKED_KEY = '__ELIT_DESKTOP_RENDER_TRACKED__';
const DESKTOP_WINDOW_CREATED_KEY = '__ELIT_DESKTOP_WINDOW_CREATED__';
const DESKTOP_MESSAGE_HANDLER_KEY = '__ELIT_DESKTOP_MESSAGE_HANDLER__';

type DesktopAutoRenderGlobals = typeof globalThis & {
    [DESKTOP_RENDER_TRACKED_KEY]?: boolean;
    [DESKTOP_WINDOW_CREATED_KEY]?: boolean;
  [DESKTOP_MESSAGE_HANDLER_KEY]?: boolean;
    createWindow?: (options: Record<string, unknown>) => void;
  onMessage?: (handler: (message: string) => void) => void;
  windowQuit?: () => void;
  windowSetTitle?: (title: string) => void;
};

function getDesktopAutoRenderGlobals(): DesktopAutoRenderGlobals {
    return globalThis as DesktopAutoRenderGlobals;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

function escapeStyleText(css: string): string {
    return css.replace(/<\/style/gi, '<\\/style');
}

function buildDesktopAutoHtml(options: { css: string; markup: string; title: string }): string {
    const styleTag = options.css
        ? `  <style>${escapeStyleText(options.css)}</style>`
        : '';

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(options.title)}</title>
${styleTag}
</head>
<body>
  ${options.markup}
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('[data-desktop-message], [data-elit-action], [data-elit-route]').forEach((element) => {
        element.addEventListener('click', (event) => {
          const action = element.getAttribute('data-elit-action');
          const route = element.getAttribute('data-elit-route');
          const payload = element.getAttribute('data-elit-payload');
          const desktopMessage = element.getAttribute('data-desktop-message');

          if (action || route || payload || desktopMessage) {
            event.preventDefault();
          }

          if (action || route || payload) {
            window.ipc?.postMessage(JSON.stringify({ type: 'bridge', action, route, payload }));
            return;
          }

          if (desktopMessage) {
            window.ipc?.postMessage(desktopMessage);
          }
        });
      });

      window.ipc?.postMessage('desktop:ready');
    });
  </script>
</body>
</html>`;
}

export function installDesktopRenderTracking(): void {
    const globalScope = getDesktopAutoRenderGlobals();
    globalScope[DESKTOP_WINDOW_CREATED_KEY] = false;

    if (globalScope[DESKTOP_RENDER_TRACKED_KEY] || typeof globalScope.createWindow !== 'function') {
        return;
    }

    const originalCreateWindow = globalScope.createWindow.bind(globalScope);
    globalScope.createWindow = (options: Record<string, unknown>) => {
        globalScope[DESKTOP_WINDOW_CREATED_KEY] = true;
        return originalCreateWindow(options);
    };
    globalScope[DESKTOP_RENDER_TRACKED_KEY] = true;
}

  function installDesktopMessageHandler(options: { title: string; autoClose?: boolean }): void {
    const globalScope = getDesktopAutoRenderGlobals();

    if (globalScope[DESKTOP_MESSAGE_HANDLER_KEY] || typeof globalScope.onMessage !== 'function') {
      return;
    }

    globalScope.onMessage((message) => {
      try {
        const bridgeMessage = JSON.parse(message) as {
          type?: string;
          action?: string | null;
          route?: string | null;
        };

        if (bridgeMessage.type === 'bridge') {
          if (bridgeMessage.action === 'desktop:ping') {
            globalScope.windowSetTitle?.(`${options.title} - IPC OK`);
            return;
          }

          if (bridgeMessage.action === 'desktop:quit') {
            globalScope.windowQuit?.();
            return;
          }

          if (bridgeMessage.route) {
            globalScope.windowSetTitle?.(`${options.title} - ${bridgeMessage.route}`);
            return;
          }
        }
      } catch {
        // Ignore non-JSON desktop messages.
      }

      if (message === 'desktop:ready') {
        globalScope.windowSetTitle?.(options.title);
        if (options.autoClose) {
          globalScope.windowQuit?.();
        }
        return;
      }

      if (message === 'desktop:ping') {
        globalScope.windowSetTitle?.(`${options.title} - IPC OK`);
        return;
      }

      if (message === 'desktop:quit') {
        globalScope.windowQuit?.();
      }
    });

    globalScope[DESKTOP_MESSAGE_HANDLER_KEY] = true;
  }

export function completeDesktopAutoRender(options: DesktopRenderOptions = {}): void {
    installDesktopRenderTracking();

    const globalScope = getDesktopAutoRenderGlobals();
    const capturedRender = getCapturedRenderedVNode();
    if (!capturedRender || capturedRender.target !== 'desktop') {
        return;
    }

    if (globalScope[DESKTOP_WINDOW_CREATED_KEY] || typeof globalScope.createWindow !== 'function') {
        return;
    }

    const resolvedOptions = {
        title: 'Elit Desktop',
        width: 1080,
        height: 720,
        center: true,
      autoClose: false,
        ...options,
        ...getDesktopRenderOptions(),
    };

    installDesktopMessageHandler({
      title: resolvedOptions.title,
      autoClose: resolvedOptions.autoClose,
    });

    globalScope.createWindow({
        title: resolvedOptions.title,
        width: resolvedOptions.width,
        height: resolvedOptions.height,
        center: resolvedOptions.center,
        icon: resolvedOptions.icon,
        html: buildDesktopAutoHtml({
            css: styles.render(),
            markup: renderToString(capturedRender.vNode),
            title: resolvedOptions.title,
        }),
    });

    clearCapturedRenderedVNode();
}