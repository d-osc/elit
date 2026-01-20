import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  minify: false,
  shims: true,
  publicDir: 'templates',
  // Copy templates directory to dist
  async onSuccess() {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { existsSync } = await import('fs');

    const templatesSrc = path.join(process.cwd(), 'src', 'templates');
    const templatesDest = path.join(process.cwd(), 'dist', 'templates');

    if (existsSync(templatesSrc)) {
      await fs.cp(templatesSrc, templatesDest, { recursive: true });
      console.log('Copied templates to dist/templates');
    }
  }
});
