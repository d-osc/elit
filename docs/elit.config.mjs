import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  dev: {
    port: 3003,
    host: 'localhost',
    root: __dirname,
    basePath: '/elit',
    open: true,
    logging: true
  },
  build: {
    entry: resolve(__dirname, 'src/main.ts'),
    outDir: resolve(__dirname, 'dist'),
    outFile: 'main.js',
    minify: true,
    sourcemap: false,
    format: 'esm',
    target: 'es2020',
    platform: 'browser',
    basePath: '/elit',
    treeshake: true,
    logging: true,
    copy: [
      {
        from: 'index.html',
        to: 'index.html',
        transform: (content, config) => {
          // Replace script src
          let html = content.replace('src="src/main.ts"', 'src="main.js"');

          // Inject base tag if basePath is configured
          if (config.basePath) {
            const baseTag = `<base href="${config.basePath}/">`;
            html = html.replace(
              '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
              `<meta name="viewport" content="width=device-width, initial-scale=1.0">\n  ${baseTag}`
            );
          }

          return html;
        }
      },
      {
        from: 'favicon.svg',
        to: 'favicon.svg'
      }
    ]
  },
  preview: {
    port: 3003,
    host: 'localhost',
    basePath: '/elit',
    open: true,
    logging: true
  }
};
