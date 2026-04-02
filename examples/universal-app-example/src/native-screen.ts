import { APP_LINK } from './shared';
import { createStatusCard, createUniversalShell } from './universal-components';

export const screen = () => createUniversalShell({
    iconSrc: './public/favicon.svg',
    heroActions: [
        {
            label: 'Dispatch shared native validation action',
            className: 'btn btn-primary',
            action: 'validation.record',
            route: '/native/coverage',
            payload: {
                surface: 'mobile',
                target: 'android-compose',
            },
        },
        {
            label: 'Open the Elit repository',
            className: 'btn btn-secondary',
            href: APP_LINK,
        },
    ],
    form: {
        title: 'Mobile native coverage',
        questionLabel: 'Search validation target',
        questionValue: 'android compose smoke',
        questionPlaceholder: 'Search validation target',
        onQuestionInput: () => undefined,
        noteLabel: 'Explain what you are testing',
        noteValue: 'This repo keeps web, desktop, and mobile under one roof.',
        notePlaceholder: 'Explain what you are testing',
        onNoteInput: () => undefined,
        toggleLabel: 'Shared repo smoke workflow enabled',
        nativeEnabled: true,
        onToggleInput: () => undefined,
        statusItems: [
            createStatusCard('Native generation now consumes the same shared component tree as web and desktop.'),
            createStatusCard('Shared action and route metadata now compile into Compose and SwiftUI bridge calls.'),
        ],
    },
});
