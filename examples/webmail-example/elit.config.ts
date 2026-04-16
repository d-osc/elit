import { client } from './src/client';
import { createWebmailSmtpConfig } from './src/smtp';
import { server } from './src/server';

export default {
  dev: {
    port: 3054,
    host: '127.0.0.1',
    open: false,
    logging: true,
    root: '.',
    ssr: () => client,
    api: server,
    smtp: createWebmailSmtpConfig(),
  },
  build: [{
    entry: './src/main.ts',
    outDir: './dist',
    outFile: 'main.js',
    format: 'esm',
    minify: false,
    sourcemap: true,
    target: 'es2020',
    copy: [
      { from: './public/index.html', to: './index.html' }
    ]
  }],
  preview: {
    port: 4154,
    host: '127.0.0.1',
    open: false,
    logging: true,
    root: './dist',
    index: './index.html',
    api: server,
    smtp: createWebmailSmtpConfig(),
  }
};