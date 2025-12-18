import { build } from '../dist/build.mjs';
import { resolve } from 'path';

async function buildDocs() {
  try {
    const result = await build({
      entry: resolve('src/main.ts'),
      outDir: resolve('dist'),
      minify: true,
      sourcemap: false,
      format: 'esm',
      logging: true
    });

    console.log('\n✅ Build completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Build failed:', error);
    process.exit(1);
  }
}

buildDocs();
