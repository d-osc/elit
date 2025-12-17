import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        dom: 'src/dom.ts',
        el: 'src/el.ts',
        router: 'src/router.ts',
        state: 'src/state.ts',
        style: 'src/style.ts',
        types: 'src/types.ts'
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
});
