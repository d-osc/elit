import { createDevServer } from '../dist/server.mjs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create preview server for built files
const server = await createDevServer({
  port: 3003,
  host: 'localhost',
  open: true,
  logging: true,
  clients: [
    {
      basePath: '/elit',
      root: resolve(__dirname, './dist'),
      // No watch/transpilation needed for preview - serving static built files
      watch: [],
      ignore: []
    }
  ]
});

console.log(`\n🚀 Elit Docs Preview Server running at ${server.url}`);
console.log(`   Serving built files from: dist/`);
