/// <reference path="../../src/test-globals.d.ts" />

import { unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { div, h1 } from '../../src/el';
import { renderNativeJson } from '../../src/native';
import { loadNativeEntryValue, resolveNativeEntryExport, resolveNativeExportValue } from '../../src/native-cli';
import { renderAndroidCompose } from '../../src/native';
import styles from '../../src/style';

describe('native cli helpers', () => {
    afterEach(() => {
        styles.clear();
    });

    it('auto-detects default exports and resolves zero-argument factories', async () => {
        const entry = await resolveNativeEntryExport({
            default: () => div(h1('Hello from CLI')),
        });

        expect(renderNativeJson(entry)).toContain('Hello from CLI');
    });

    it('supports explicit named export selection with async factories', async () => {
        const entry = await resolveNativeEntryExport({
            screen: div('Fallback'),
            custom: async () => div('Named export'),
        }, 'custom');

        expect(renderNativeJson(entry)).toContain('Named export');
    });

    it('rejects exported factories that require arguments', async () => {
        await expect(
            resolveNativeExportValue((name: string) => div(name), 'default')
        ).rejects.toThrow('zero-argument function');
    });

    it('shares registered class styles across bundled native entry loading', async () => {
        const entryPath = resolve(__dirname, '.tmp-native-cli-style-entry.ts');
        writeFileSync(entryPath, `
import styles from '../../src/style';
import { div } from '../../src/el';

styles.addClass('card', {
  padding: '16px',
  background: '#fff8ef',
  borderRadius: '20px',
});

export const screen = () => div({ className: 'card' }, 'Bundled style');
`.trim(), 'utf8');

        try {
            const entry = await loadNativeEntryValue(entryPath, 'screen');
            const compose = renderAndroidCompose(entry, { functionName: 'BundledStyleScreen' });

            expect(compose).toContain('Column(modifier = Modifier.padding(16.dp).background(color = Color(');
            expect(compose).toContain('RoundedCornerShape(20.dp)');
        } finally {
            unlinkSync(entryPath);
        }
    });
});