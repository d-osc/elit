#!/usr/bin/env node

import { mkdir, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getProjectName(): string {
  const args = process.argv.slice(2);
  return args[0] || 'my-elit-app';
}

async function createProject(projectName: string) {
  const projectPath = resolve(process.cwd(), projectName);

  // Check if directory exists
  if (existsSync(projectPath)) {
    log(`Error: Directory "${projectName}" already exists!`, 'red');
    process.exit(1);
  }

  log(`Creating a new Elit app in ${projectPath}...`, 'cyan');

  // Create project directory
  await mkdir(projectPath, { recursive: true });

  // Generate files
  await generateTemplate(projectPath, projectName);

  log('\nSuccess! Created ' + projectName, 'green');
  log('\nInside that directory, you can run several commands:', 'dim');
  log('\n  npm run dev', 'cyan');
  log('    Starts the development server with HMR\n', 'dim');
  log('  npm run build', 'cyan');
  log('    Builds the app for production\n', 'dim');
  log('  npm run preview', 'cyan');
  log('    Preview the production build\n', 'dim');
  log('\nWe suggest that you begin by typing:\n', 'dim');
  log(`  cd ${projectName}`, 'cyan');
  log('  npm install', 'cyan');
  log('  npm run dev\n', 'cyan');
  log('Happy coding! 🚀', 'green');
}

async function generateTemplate(projectPath: string, projectName: string) {
  // Create package.json
  const packageJson = {
    name: projectName,
    version: '0.0.0',
    type: 'module',
    scripts: {
      dev: 'elit dev',
      build: 'elit build',
      preview: 'elit preview'
    },
    dependencies: {
      elit: '^3.2.1'
    }
  };

  await writeFile(
    join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      moduleResolution: 'bundler',
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      resolveJsonModule: true,
      isolatedModules: true,
      types: ['node']
    },
    include: ['src']
  };

  await writeFile(
    join(projectPath, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  );

  // Create .gitignore
  const gitignore = `node_modules
dist
.env
.env.local
*.log
.DS_Store
`;

  await writeFile(join(projectPath, '.gitignore'), gitignore);

  // Create README.md
  const readme = `# ${projectName}

A new Elit project created with create-elit.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Visit http://localhost:3000 to view your app.

## Available Scripts

- \`npm run dev\` - Start development server with HMR
- \`npm run build\` - Build for production
- \`npm run preview\` - Preview production build

## Learn More

- [Elit Documentation](https://d-osc.github.io/elit)
- [GitHub Repository](https://github.com/d-osc/elit)
`;

  await writeFile(join(projectPath, 'README.md'), readme);

  // Create elit.config.ts
  const elitConfig = `import { server } from './src/server';
import { client } from './src/client';

export default {
  dev: {
    port: 3000,
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
      { from: './public/index.html', to: './index.html' }
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
`;

  await writeFile(join(projectPath, 'elit.config.ts'), elitConfig);

  // Create public directory and index.html
  await mkdir(join(projectPath, 'public'), { recursive: true });

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <meta name="description" content="Built with Elit - Full-stack TypeScript framework">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/main.js"></script>
</body>
</html>
`;

  await writeFile(join(projectPath, 'public', 'index.html'), indexHtml);

  // Create src directory
  await mkdir(join(projectPath, 'src'), { recursive: true });

  // src/main.ts - Client-side application
  const mainTs = `import { div, h1, h2, button, p } from 'elit/el';
import { createState, reactive } from 'elit/state';
import { render } from 'elit/dom';
import './styles.ts';

// Create reactive state
export const count = createState(0);

// Create app
export const app = div({ className: 'container' },
  div({ className: 'card' },
    h1('Welcome to Elit! 🚀'),
    p('A lightweight TypeScript framework with reactive state management'),

    div({ className: 'counter' },
      h2('Counter Example'),
      reactive(count, (value) =>
        div({ className: 'count-display' }, \`Count: \${value}\`)
      ),
      div({ className: 'button-group' },
        button({
          onclick: () => count.value--,
          className: 'btn btn-secondary'
        }, '- Decrement'),
        button({
          onclick: () => count.value = 0,
          className: 'btn btn-secondary'
        }, 'Reset'),
        button({
          onclick: () => count.value++,
          className: 'btn btn-primary'
        }, '+ Increment')
      )
    )
  )
);

render('root', app);
console.log('[Main] App rendered');
`;

  await writeFile(join(projectPath, 'src', 'main.ts'), mainTs);

  // src/styles.ts
  const stylesTs = `import styles from 'elit/style';

// Global styles
styles.addTag('*', {
  margin: 0,
  padding: 0,
  boxSizing: 'border-box'
});

styles.addTag('body', {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem'
});

// Container
styles.addClass('container', {
  width: '100%',
  maxWidth: '600px'
});

// Card
styles.addClass('card', {
  background: 'white',
  borderRadius: '16px',
  padding: '3rem',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
});

// Typography
styles.addTag('h1', {
  fontSize: '2.5rem',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  marginBottom: '1rem'
});

styles.addTag('h2', {
  fontSize: '1.5rem',
  color: '#333',
  marginBottom: '1rem'
});

styles.addTag('p', {
  color: '#666',
  marginBottom: '2rem',
  lineHeight: 1.6
});

// Counter section
styles.addClass('counter', {
  marginTop: '2rem',
  paddingTop: '2rem',
  borderTop: '2px solid #f0f0f0'
});

styles.addClass('count-display', {
  fontSize: '3rem',
  fontWeight: 'bold',
  color: '#667eea',
  textAlign: 'center',
  margin: '2rem 0'
});

// Button group
styles.addClass('button-group', {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center'
});

// Buttons
styles.addClass('btn', {
  padding: '0.75rem 1.5rem',
  border: 'none',
  borderRadius: '8px',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s'
});

styles.addClass('btn-primary', {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white'
});

styles.addPseudoClass('hover', {
  transform: 'translateY(-2px)',
  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
}, '.btn-primary');

styles.addClass('btn-secondary', {
  background: '#f0f0f0',
  color: '#333'
});

styles.addPseudoClass('hover', {
  background: '#e0e0e0',
  transform: 'translateY(-2px)'
}, '.btn-secondary');

styles.addPseudoClass('active', {
  transform: 'translateY(0)'
}, '.btn');

styles.inject('global-styles');
export default styles;
`;

  await writeFile(join(projectPath, 'src', 'styles.ts'), stylesTs);

  // src/client.ts - SSR template
  const clientTs = `import { div, html, head, body, title, link, script, meta } from 'elit/el';

export const client = html(
  head(
    title('${projectName} - Elit App'),
    link({ rel: 'icon', type: 'image/svg+xml', href: 'favicon.svg' }),
    meta({ charset: 'UTF-8' }),
    meta({ name: 'viewport', content: 'width=device-width, initial-scale=1.0' }),
    meta({ name: 'description', content: 'Elit - Full-stack TypeScript framework with dev server, HMR, routing, SSR, and REST API.' })
  ),
  body(
    div({ id: 'root' }),
    script({ type: 'module', src: '/src/main.js' })
  )
);
`;

  await writeFile(join(projectPath, 'src', 'client.ts'), clientTs);

  // src/server.ts - API routes
  const serverTs = `import { ServerRouter } from 'elit/server';

export const router = new ServerRouter();

router.get('/api/hello', async (ctx) => {
  ctx.res.setHeader('Content-Type', 'application/json');
  ctx.res.end(JSON.stringify({ message: 'Hello from Elit ServerRouter!' }));
});

export const server = router;
`;

  await writeFile(join(projectPath, 'src', 'server.ts'), serverTs);
}

// Main execution
const projectName = getProjectName();

log('\n🚀 Create Elit App\n', 'cyan');

createProject(projectName).catch((err) => {
  log(`Error: ${err.message}`, 'red');
  process.exit(1);
});
