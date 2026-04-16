import { page } from './src/page';

export default {
  dev: {
    port: 3099,
    host: '127.0.0.1',
    open: true,
    logging: true,
    ssr: () => page,
  },
  build: [{
    entry: './src/page.ts',
    outDir: './dist',
    outFile: 'page.js',
    format: 'esm',
    minify: false,
    sourcemap: true,
    target: 'es2020',
  }],
  preview: {
    port: 4099,
    host: '127.0.0.1',
    ssr: () => page,
  },
};
