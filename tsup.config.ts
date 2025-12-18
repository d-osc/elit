import { defineConfig } from 'tsup';

export default defineConfig([
    // Main library bundle
    {
        entry: {
            index: 'src/index.ts',
            client: 'src/client.ts',
            dom: 'src/dom.ts',
            el: 'src/el.ts',
            router: 'src/router.ts',
            state: 'src/state.ts',
            style: 'src/style.ts',
            types: 'src/types.ts',
            server: 'src/server.ts',
            hmr: 'src/hmr.ts',
            build: 'src/build.ts'
        },
        format: ['cjs', 'esm'],
        dts: true,
        clean: true,
        minify: 'terser',
        minifyWhitespace: true,
        minifyIdentifiers: true,
        minifySyntax: true,
        splitting: false,
        treeshake: {
            preset: 'smallest',
            moduleSideEffects: false
        },
        sourcemap: false,
        target: 'es2020',
        outExtension({ format }) {
            return {
                js: format === 'cjs' ? '.js' : '.mjs'
            };
        }
    },
    // CLI bundle (CJS only for Node.js)
    {
        entry: {
            cli: 'src/cli.ts'
        },
        format: ['cjs'],
        dts: false,
        clean: false,
        splitting: false,
        banner: {
            js: '#!/usr/bin/env node'
        }
    }
]);
