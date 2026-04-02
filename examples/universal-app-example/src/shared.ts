export const APP_NAME = 'Elit Universal Example';
export const APP_TAGLINE = 'One repo validating browser, desktop, and Android mobile workflows.';
export const APP_LINK = 'https://github.com/d-osc/elit';

export const PLATFORM_SURFACES = [
    {
        id: 'web',
        title: 'Web',
        description: 'Build and preview the browser app from the same project root.',
    },
    {
        id: 'desktop',
        title: 'Desktop',
        description: 'Run the same repo inside the native WebView desktop runtime.',
    },
    {
        id: 'mobile',
        title: 'Mobile',
        description: 'Sync built web assets and generate Android Compose from a native entry.',
    },
] as const;

export const VALIDATION_STEPS = [
    'Browser build output under dist/',
    'Desktop IPC smoke run',
    'Android scaffold + Compose generation',
    'Shared repo-level scripts for all three surfaces',
];

export const SHARED_CHECKLIST = [
    'Reactive state on the web app',
    'Desktop shell with native IPC',
    'Compose toggle and text input generation',
    'External link handling for native mobile',
];
