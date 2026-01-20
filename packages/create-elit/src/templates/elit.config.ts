import { server } from './src/server';
import { client } from './src/client';

export default {
  dev: {
    port: 3003,
    host: 'localhost',
    open: true,
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
      {
        from: './public/index.html', to: './index.html',
        transform: (content: string, config: { basePath: string; projectName: string; }) => {
          // Replace script src
          let html = content.replace('src="../src/main.ts"', 'src="main.js"');

          // Replace project name placeholder
          html = html.replace(/ELIT_PROJECT_NAME/g, config.projectName);

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
      { from: './public/favicon.svg', to: './favicon.svg' }
    ]
  }],
  preview: {
    port: 3000,
    host: 'localhost',
    open: false,
    logging: true,
    root: './dist',
    basePath: '',
    index: './index.html'
  }
};
