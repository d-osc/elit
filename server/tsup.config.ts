import { defineConfig } from 'tsup';

export default defineConfig([
  // Main server bundle
  {
    entry: {
      index: 'src/index.ts',
      server: 'src/server.ts',
      client: 'src/client.ts',
      'client-state': 'src/client-state.ts'
    },
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    splitting: false,
    treeshake: true,
    sourcemap: false,
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
