import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/elit/',
  resolve: {
    alias: {
      'elit': resolve(__dirname, '../src/index.ts')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
