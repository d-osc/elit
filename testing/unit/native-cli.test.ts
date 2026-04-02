/// <reference path="../../src/test-globals.d.ts" />

import { div, h1 } from '../../src/el';
import { renderNativeJson } from '../../src/native';
import { resolveNativeEntryExport, resolveNativeExportValue } from '../../src/native-cli';

describe('native cli helpers', () => {
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
});