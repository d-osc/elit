import { bindChecked, bindValue } from '../../../src/state';

import {
    APP_LINK,
    createUniversalExampleState,
    createUniversalStatusMessages,
    UNIVERSAL_FORM_COPY,
    UNIVERSAL_PRIMARY_ACTION_LABEL,
} from './shared';
import { createHeroBadge, createStatusCard, createUniversalShell } from './universal-components';

export const screen = () => {
    const state = createUniversalExampleState();

    return createUniversalShell({
        iconChild: createHeroBadge(),
        pageClassName: 'page-native',
        heroClassName: 'hero-native',
        heroLayoutProps: {
            className: 'hero-layout-native',
        },
        panelGridClassName: 'panel-grid-native',
        heroActions: [
            {
                label: UNIVERSAL_PRIMARY_ACTION_LABEL,
                className: 'btn btn-primary',
                action: 'validation.record',
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
    });
};
