import { createDevServer } from 'elit/server';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const server = await createDevServer({
  port: 3003,
  host: 'localhost',
  open: false,
  logging: true,
  clients: [
    {
      basePath: '/elit',
      root: resolve(__dirname, './'),
      watch: ['src/**/*.ts', 'index.html'],
      ignore: ['node_modules/**', 'dist/**']
    }
  ]
});

console.log(`\n✨ Elit Docs Server running at ${server.url}`);
