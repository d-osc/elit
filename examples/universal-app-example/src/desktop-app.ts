import { createWindow, onMessage, windowQuit, windowSetTitle } from '../../../src/desktop';

import { APP_NAME } from './shared';
import { renderDesktopHtml } from './desktop-html';

function resolveAppDirectory(): string {
    let appDir = '.';

    try {
        if (typeof __dirname !== 'undefined') {
            appDir = __dirname;
        }
    } catch {
        // Ignore missing __dirname in runtimes that do not expose it.
    }

    try {
        if (appDir === '.' && typeof process !== 'undefined' && Array.isArray(process.argv) && process.argv[1]) {
            const scriptPath = String(process.argv[1]);
            const scriptDir = scriptPath.replace(/[/\\][^/\\]+$/, '');
            if (scriptDir !== scriptPath) appDir = scriptDir;
        }
    } catch {
        // Ignore missing process metadata.
    }

    return appDir;
}

export function launchDesktopExample(options: { autoClose?: boolean } = {}): void {
    const appDir = resolveAppDirectory();

    onMessage((message) => {
        try {
            const bridgeMessage = JSON.parse(message) as {
                type?: string;
                action?: string | null;
                route?: string | null;
                payload?: string | null;
            };

            if (bridgeMessage.type === 'bridge') {
                if (bridgeMessage.action === 'desktop:ping') {
                    windowSetTitle(`${APP_NAME} Desktop - IPC OK`);
                    return;
                }

                if (bridgeMessage.action === 'desktop:quit') {
                    windowQuit();
                    return;
                }

                if (bridgeMessage.route) {
                    windowSetTitle(`${APP_NAME} Desktop - ${bridgeMessage.route}`);
                    return;
                }
            }
        } catch {
            // Ignore non-JSON desktop messages.
        }

        if (message === 'desktop:ready') {
            windowSetTitle(`${APP_NAME} Desktop`);
            if (options.autoClose) {
                windowQuit();
            }
            return;
        }

        if (message === 'desktop:ping') {
            windowSetTitle(`${APP_NAME} Desktop - IPC OK`);
            return;
        }

        if (message === 'desktop:quit') {
            windowQuit();
        }
    });

    createWindow({
        title: `${APP_NAME} Desktop`,
        width: 1080,
        height: 720,
        center: true,
        icon: `${appDir}/../public/favicon.svg`,
        html: renderDesktopHtml({ autoClose: options.autoClose }),
    });
}
