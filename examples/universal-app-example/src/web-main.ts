import { a, article, button, div, h1, h2, input, label, li, p, section, span, textarea, ul } from '../../../src/el';
import { render } from '../../../src/dom';
import { bindChecked, bindValue } from '../../../src/state';

import {
    APP_LINK,
    createUniversalExampleState,
    createUniversalStatusMessages,
    UNIVERSAL_FORM_COPY,
    UNIVERSAL_PRIMARY_ACTION_LABEL,
} from './shared';
import { createHeroBadge, createStatusCard, createUniversalShell } from './universal-components';
import './web-styles';

const state = createUniversalExampleState();

const app = createUniversalShell(
    {
        iconChild: createHeroBadge(),
        heroActions: [
            {
                label: UNIVERSAL_PRIMARY_ACTION_LABEL,
                className: 'btn btn-primary',
                action: 'validation.record',
                payload: { surface: 'web' },
                onClick: () => {
                    state.launchCount.value++;
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
            title: UNIVERSAL_FORM_COPY.title,
            questionLabel: UNIVERSAL_FORM_COPY.questionLabel,
            questionPlaceholder: UNIVERSAL_FORM_COPY.questionPlaceholder,
            questionInputProps: bindValue(state.validationTarget),
            noteLabel: UNIVERSAL_FORM_COPY.noteLabel,
            notePlaceholder: UNIVERSAL_FORM_COPY.notePlaceholder,
            noteInputProps: bindValue(state.notes),
            toggleLabel: UNIVERSAL_FORM_COPY.toggleLabel,
            toggleInputProps: bindChecked(state.nativeEnabled),
            statusItems: createUniversalStatusMessages(state).map((message) => createStatusCard(message)),
        },
    },
);

render('root', app);
