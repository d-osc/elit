#!/usr/bin/env node

import { mkdir, writeFile, copyFile, readFile, readdir } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the version from create-elit's package.json
async function getElitVersion(): Promise<string> {
  const packageJsonPath = resolve(__dirname, '../package.json');
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
  return packageJson.version;
}

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

// Recursively copy directory
async function copyDirectory(
  src: string,
  dest: string,
  replacements: Record<string, string>
): Promise<void> {
  await mkdir(dest, { recursive: true });

  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath, replacements);
    } else {
      await copyAndReplaceFile(srcPath, destPath, replacements);
    }
  }
}

// Copy file and replace placeholders
async function copyAndReplaceFile(
  src: string,
  dest: string,
  replacements: Record<string, string>
): Promise<void> {
  let content = await readFile(src, 'utf-8');

  // Replace all placeholders
  for (const [placeholder, value] of Object.entries(replacements)) {
    content = content.split(placeholder).join(value);
  }

  // If the file is 'gitignore', save it as '.gitignore'
  const finalDest = dest.endsWith('gitignore') && !dest.endsWith('.gitignore')
    ? join(dirname(dest), '.gitignore')
    : dest;

  await writeFile(finalDest, content, 'utf-8');
}

async function createProject(projectName: string) {
  const projectPath = resolve(process.cwd(), projectName);
  const templatesPath = resolve(__dirname, 'templates');

  // Check if directory exists
  if (existsSync(projectPath)) {
    log(`Error: Directory "${projectName}" already exists!`, 'red');
    process.exit(1);
  }

  log(`Creating a new Elit app in ${projectPath}...`, 'cyan');

  // Get the version of elit (same as create-elit version)
  const elitVersion = await getElitVersion();

  // Define replacements
  const replacements: Record<string, string> = {
    'ELIT_PROJECT_NAME': projectName,
    'ELIT_VERSION': elitVersion
  };

  // Copy templates directory and replace placeholders
  await copyDirectory(templatesPath, projectPath, replacements);

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

// Main execution
const projectName = getProjectName();

log('\n🚀 Create Elit App\n', 'cyan');

createProject(projectName).catch((err) => {
  log(`Error: ${err.message}`, 'red');
  process.exit(1);
});
