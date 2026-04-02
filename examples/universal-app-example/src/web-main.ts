import { a, article, button, div, h1, h2, input, label, li, p, section, span, textarea, ul } from '../../../src/el';
import { render } from '../../../src/dom';
import { createState, reactive } from '../../../src/state';

import { APP_LINK } from './shared';
import { createStatusCard, createUniversalShell } from './universal-components';
import './web-styles';

const launchCount = createState(3);
const validationTarget = createState('web + desktop + mobile');
const notes = createState('Desktop and mobile are driven from the same repo.');
const nativeEnabled = createState(true);

const app = createUniversalShell(
    {
        iconSrc: '/examples/universal-app-example/public/favicon.svg',
        heroActions: [
            {
                label: 'Record another validation pass',
                className: 'btn btn-primary',
                action: 'validation.record',
                payload: { surface: 'web' },
                onClick: () => {
                    launchCount.value++;
                },
            },
            {
                label: 'Open the Elit repository',
                className: 'btn btn-secondary',
                href: APP_LINK,
                target: '_blank',
                rel: 'noreferrer',
            },
        ],
        form: {
            title: 'Web state and shared content',
            questionLabel: 'What are you validating?',
            questionValue: validationTarget.value,
            questionPlaceholder: 'web + desktop + mobile',
            onQuestionInput: (event: Event) => {
                validationTarget.value = String((event.target as HTMLInputElement).value);
            },
            noteLabel: 'Repo note',
            noteValue: notes.value,
            notePlaceholder: 'Explain what changed in the shared component tree',
            onNoteInput: (event: Event) => {
                notes.value = String((event.target as HTMLTextAreaElement).value);
            },
            toggleLabel: 'Keep native mobile generation enabled for Android checks',
            nativeEnabled: nativeEnabled.value,
            onToggleInput: (event: Event) => {
                nativeEnabled.value = Boolean((event.target as HTMLInputElement).checked);
            },
            statusItems: [
                createStatusCard(reactive(launchCount, (value) => `Validation counter: ${value}`)),
                createStatusCard(reactive(validationTarget, (value) => `Current validation target: ${value}`)),
                createStatusCard(reactive(notes, (value) => `Latest note: ${value}`)),
                createStatusCard(reactive(nativeEnabled, (value) => `Native mobile generation: ${value ? 'enabled' : 'disabled'}`)),
                createStatusCard('The primary CTA now carries shared bridge metadata through elit/universal while the web handler still updates local state.'),
            ],
        },
    },
);

render('root', app);
