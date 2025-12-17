import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm', 'iife'],
    dts: true,
    clean: true,
    globalName: 'DomLib',
    minify: true,
    splitting: false,
    treeshake: true,
    sourcemap: false,
});
