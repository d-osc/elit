import type { BuildOptions } from '../../shares/types';

export const defaultOptions: Omit<BuildOptions, 'entry'> = {
    outDir: 'dist',
    minify: true,
    sourcemap: false,
    target: 'es2020',
    format: 'esm',
    treeshake: true,
    logging: true,
    external: [],
};