/// <reference path="../../src/test-globals.d.ts" />

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { save } from '../../src/database';
import { update } from '../../src/database';

function createTempDir() {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'elit-database-'));
}

describe('database helpers preserve typed declarations', () => {
    it('save updates an existing typed binding in place', () => {
        const dir = createTempDir();
        const dbPath = path.join(dir, 'users.ts');

        try {
            fs.writeFileSync(
                dbPath,
                [
                    'type User = { id: number; name: string };',
                    '',
                    'export const users: User[] = [',
                    '    { id: 1, name: "Ann" }',
                    '];',
                    '',
                    'export default users;',
                    '',
                ].join('\n'),
                'utf8'
            );

            save('users', [{ id: 2, name: 'Bob' }], { dir });

            const content = fs.readFileSync(dbPath, 'utf8');

            expect(content).toBe([
                'type User = { id: number; name: string };',
                '',
                'export const users: User[] = [',
                '    {',
                '        id: 2,',
                '        name: "Bob"',
                '    }',
                '];',
                '',
                'export default users;',
                '',
            ].join('\n'));
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('update preserves type annotations instead of appending a duplicate export', () => {
        const dir = createTempDir();
        const dbPath = path.join(dir, 'users.ts');

        try {
            fs.writeFileSync(
                dbPath,
                [
                    'type User = { id: number; active: boolean };',
                    '',
                    'export const users: User[] = [];',
                    '',
                    'export default users;',
                    '',
                ].join('\n'),
                'utf8'
            );

            update('users', 'users', [{ id: 3, active: true }], { dir });

            const content = fs.readFileSync(dbPath, 'utf8');

            expect(content).toBe([
                'type User = { id: number; active: boolean };',
                '',
                'export const users: User[] = [',
                '    {',
                '        id: 3,',
                '        active: true',
                '    }',
                '];',
                '',
                'export default users;',
                '',
            ].join('\n'));

            expect((content.match(/export const users: User\[] =/g) || []).length).toBe(1);
            expect(content.includes('export const users: any = users;')).toBe(false);
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });
});
