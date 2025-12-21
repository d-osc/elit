import { server } from './src/server';
import { client } from './src/client';

export default {
  dev: {
    port: 3003,
    host: '0.0.0.0',
    open: false,
    logging: true,
    clients: [{
      root: '.',
      basePath: '',
      ssr: () => client,
      api: server
    }]
  },
  build: [{
    entry: './src/main.ts',
    outDir: './dist',
    outFile: 'main.js',
    format: 'esm',
    minify: true,
    sourcemap: true,
    target: 'es2020',
    copy: [
      { from: './public/index.html', to: './index.html' }
    ]
  }],
  preview: {
    port: 3000,
    host: '0.0.0.0',
    open: false,
    logging: true,
    root: './dist',
    basePath: '',
    index: './index.html'
  }
};
