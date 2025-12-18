import {
  div, h1, h2, h3, p, ul, li, pre, code, strong, em, a
} from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog22: BlogPostDetail = {
  id: '22',
  title: {
    en: 'Mastering Elit CLI Commands',
    th: 'เชี่ยวชาญคำสั่ง Elit CLI'
  },
  date: '2024-04-22',
  author: 'n-devs',
  tags: ['CLI', 'Development', 'Commands', 'Workflow'],
  content: {
    en: div(
      p('Master the ', strong('Elit command-line interface'), ' with this comprehensive guide. Learn all available commands, options, and workflows for efficient development.'),

      h2('CLI Overview'),
      p('The Elit CLI provides a simple yet powerful interface for:'),
      ul(
        li('🚀 ', strong('Development Server'), ' - Start dev server with HMR'),
        li('📦 ', strong('Production Build'), ' - Build optimized bundles'),
        li('👁️ ', strong('Preview Server'), ' - Test production builds locally'),
        li('⚙️ ', strong('Configuration'), ' - Flexible config file support'),
        li('🔧 ', strong('CLI Options'), ' - Override config via command line')
      ),

      h2('Installation'),
      p('Install Elit as a project dependency:'),
      pre(code(...codeBlock(`# Using npm
npm install elit

# Using yarn
yarn add elit

# Using pnpm
pnpm add elit`))),

      p('Or install globally for system-wide access:'),
      pre(code(...codeBlock(`# Using npm
npm install -g elit

# Using yarn
yarn global add elit

# Using pnpm
pnpm add -g elit`))),

      h2('Available Commands'),

      h3('elit dev - Development Server'),
      p('Start the development server with hot module replacement:'),
      pre(code(...codeBlock(`# Basic usage
npx elit dev

# Custom port
npx elit dev --port 8080

# Custom host
npx elit dev --host 0.0.0.0

# Custom root directory
npx elit dev --root ./public

# Custom base path
npx elit dev --base-path /my-app

# Don't open browser
npx elit dev --no-open

# Disable logging
npx elit dev --silent

# Combine multiple options
npx elit dev --port 8080 --root ./src --no-open`))),

      h3('Dev Command Options'),
      pre(code(...codeBlock(`-p, --port <number>        Port to run server on (default: 3000)
-h, --host <string>        Host to bind to (default: localhost)
-r, --root <dir>           Root directory to serve
-b, --base-path <path>     Base path for the application
--no-open                  Don't open browser automatically
--silent                   Disable logging`))),

      h3('elit build - Production Build'),
      p('Build your application for production:'),
      pre(code(...codeBlock(`# Basic usage (uses config file)
npx elit build

# Specify entry file
npx elit build --entry src/app.ts

# Custom output directory
npx elit build --out-dir build

# Specify output format
npx elit build --format esm
npx elit build --format cjs
npx elit build --format iife

# Disable minification (for debugging)
npx elit build --no-minify

# Generate source maps
npx elit build --sourcemap

# Disable logging
npx elit build --silent

# Combine options
npx elit build --entry src/main.ts --out-dir dist --sourcemap`))),

      h3('Build Command Options'),
      pre(code(...codeBlock(`-e, --entry <file>         Entry file to build (required)
-o, --out-dir <dir>        Output directory (default: dist)
-f, --format <format>      Output format: esm, cjs, iife (default: esm)
--no-minify                Disable minification
--sourcemap                Generate sourcemap
--silent                   Disable logging`))),

      h3('elit preview - Preview Server'),
      p('Preview your production build locally:'),
      pre(code(...codeBlock(`# Basic usage
npx elit preview

# Custom port
npx elit preview --port 5000

# Custom root directory
npx elit preview --root build

# Custom base path
npx elit preview --base-path /app

# Don't open browser
npx elit preview --no-open

# Disable logging
npx elit preview --silent

# Combine options
npx elit preview --port 8080 --root dist --no-open`))),

      h3('Preview Command Options'),
      pre(code(...codeBlock(`-p, --port <number>        Port to run server on (default: 4173)
-h, --host <string>        Host to bind to (default: localhost)
-r, --root <dir>           Root directory to serve (default: dist)
-b, --base-path <path>     Base path for the application
--no-open                  Don't open browser automatically
--silent                   Disable logging`))),

      h3('elit help - Show Help'),
      p('Display help information:'),
      pre(code(...codeBlock(`# Show general help
npx elit help
npx elit --help
npx elit -h

# Show help for specific command
npx elit dev --help
npx elit build --help
npx elit preview --help`))),

      h3('elit version - Show Version'),
      p('Display the installed Elit version:'),
      pre(code(...codeBlock(`npx elit version
npx elit --version
npx elit -v`))),

      h2('Configuration File'),
      p('Create a configuration file for persistent settings:'),

      h3('1. TypeScript Config (Recommended)'),
      pre(code(...codeBlock(`// elit.config.ts
import { resolve } from 'path';

export default {
  dev: {
    port: 3000,
    host: 'localhost',
    root: resolve(__dirname, 'src'),
    basePath: '/',
    open: true,
    logging: true
  },

  build: {
    entry: resolve(__dirname, 'src/main.ts'),
    outDir: resolve(__dirname, 'dist'),
    outFile: 'main.js',
    format: 'esm',
    minify: true,
    sourcemap: false
  },

  preview: {
    port: 4173,
    root: 'dist',
    basePath: '/',
    open: true,
    logging: true
  }
}`))),

      h3('2. JavaScript Config'),
      pre(code(...codeBlock(`// elit.config.js or elit.config.mjs
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default {
  dev: {
    port: 3000,
    root: resolve(__dirname, 'src')
  },

  build: {
    entry: resolve(__dirname, 'src/main.ts'),
    outDir: resolve(__dirname, 'dist')
  }
}`))),

      h3('3. JSON Config'),
      pre(code(...codeBlock(`// elit.config.json
{
  "dev": {
    "port": 3000,
    "root": "./src",
    "open": true
  },

  "build": {
    "entry": "./src/main.ts",
    "outDir": "./dist",
    "minify": true
  },

  "preview": {
    "port": 4173,
    "root": "./dist"
  }
}`))),

      h2('Common Workflows'),

      h3('1. Development Workflow'),
      pre(code(...codeBlock(`# Start development server
npx elit dev

# Server starts at http://localhost:3000
# Changes are automatically reloaded with HMR
# Edit your files and see instant updates!`))),

      h3('2. Build and Preview Workflow'),
      pre(code(...codeBlock(`# Build for production
npx elit build

# Preview the build locally
npx elit preview

# Test everything works before deploying`))),

      h3('3. Quick Prototype Workflow'),
      pre(code(...codeBlock(`# No config needed! Just start dev server
npx elit dev --root . --port 3000

# Create index.html and main.ts
# Start coding immediately`))),

      h3('4. Multi-Environment Workflow'),
      pre(code(...codeBlock(`# Development
MODE=development npx elit dev

# Staging build
MODE=staging npx elit build

# Production build
MODE=production npx elit build

# Each mode loads corresponding .env file`))),

      h3('5. CI/CD Pipeline'),
      pre(code(...codeBlock(`# Install dependencies
npm ci

# Run tests
npm test

# Build for production
npx elit build

# Deploy dist/ folder
# (to Vercel, Netlify, S3, etc.)`))),

      h2('Package.json Scripts'),
      p('Add convenient npm scripts for common tasks:'),

      h3('Basic Scripts'),
      pre(code(...codeBlock(`{
  "scripts": {
    "dev": "elit dev",
    "build": "elit build",
    "preview": "elit preview"
  }
}

# Usage
npm run dev
npm run build
npm run preview`))),

      h3('Advanced Scripts'),
      pre(code(...codeBlock(`{
  "scripts": {
    "dev": "elit dev",
    "dev:8080": "elit dev --port 8080",
    "dev:host": "elit dev --host 0.0.0.0",

    "build": "MODE=production elit build",
    "build:dev": "MODE=development elit build --no-minify --sourcemap",
    "build:staging": "MODE=staging elit build",

    "preview": "elit preview",
    "preview:8080": "elit preview --port 8080",

    "deploy": "npm run build && vercel --prod",
    "deploy:staging": "npm run build:staging && vercel",

    "clean": "rm -rf dist",
    "clean:build": "npm run clean && npm run build"
  }
}`))),

      h2('CLI Configuration Priority'),
      p('Understanding how CLI options, config files, and defaults interact:'),

      h3('Priority Order (Highest to Lowest)'),
      ul(
        li(strong('1. CLI Options'), ' - Command-line flags always win'),
        li(strong('2. Config File'), ' - Settings from elit.config.{ts,js,json}'),
        li(strong('3. Defaults'), ' - Built-in default values')
      ),

      h3('Example'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  dev: {
    port: 3000,
    host: 'localhost',
    open: true
  }
}

# CLI overrides config
npx elit dev --port 8080 --no-open

# Result:
# - port: 8080 (from CLI)
# - host: 'localhost' (from config)
# - open: false (from CLI --no-open)`))),

      h2('Environment Variables'),
      p('Use environment variables for dynamic configuration:'),

      h3('1. Using .env Files'),
      pre(code(...codeBlock(`# .env.development
MODE=development
PORT=3000
API_URL=http://localhost:8080

# .env.production
MODE=production
PORT=4173
API_URL=https://api.example.com`))),

      h3('2. Access in Config'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  dev: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost'
  },

  build: {
    entry: 'src/main.ts',
    env: {
      VITE_API_URL: process.env.API_URL,
      VITE_MODE: process.env.MODE
    }
  }
}`))),

      h3('3. Access in Application'),
      pre(code(...codeBlock(`// src/config.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  mode: import.meta.env.VITE_MODE
};

// src/main.ts
import { config } from './config';
console.log('API URL:', config.apiUrl);
console.log('Mode:', config.mode);`))),

      h2('Advanced CLI Usage'),

      h3('1. Development with HTTPS'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  dev: {
    port: 3000,
    https: true  // Enable HTTPS with self-signed cert
  }
}

# Start dev server
npx elit dev

# Access at https://localhost:3000`))),

      h3('2. Custom Build Output'),
      pre(code(...codeBlock(`# Build with custom output name
npx elit build --entry src/app.ts --out-dir build --format esm

# Build multiple formats
npx elit build --format esm
npx elit build --format cjs
npx elit build --format iife`))),

      h3('3. Debug Build Issues'),
      pre(code(...codeBlock(`# Build without minification
npx elit build --no-minify

# Build with source maps
npx elit build --sourcemap

# Combine for full debugging
npx elit build --no-minify --sourcemap`))),

      h3('4. Preview on Network'),
      pre(code(...codeBlock(`# Bind to all network interfaces
npx elit preview --host 0.0.0.0 --port 8080

# Access from other devices:
# http://192.168.1.xxx:8080`))),

      h2('Troubleshooting'),

      h3('Command Not Found'),
      pre(code(...codeBlock(`# Error: elit: command not found

# Solution 1: Use npx
npx elit dev

# Solution 2: Install globally
npm install -g elit
elit dev

# Solution 3: Use npm scripts
# Add to package.json:
{
  "scripts": {
    "dev": "elit dev"
  }
}
npm run dev`))),

      h3('Port Already in Use'),
      pre(code(...codeBlock(`# Error: EADDRINUSE: address already in use :::3000

# Solution 1: Use different port
npx elit dev --port 8080

# Solution 2: Kill process using the port
# On Unix/Mac:
lsof -ti:3000 | xargs kill

# On Windows:
netstat -ano | findstr :3000
taskkill /PID <process_id> /F`))),

      h3('Module Not Found'),
      pre(code(...codeBlock(`# Error: Cannot find module 'elit'

# Solution: Install dependencies
npm install

# Or clean install
rm -rf node_modules package-lock.json
npm install`))),

      h3('Permission Denied'),
      pre(code(...codeBlock(`# Error: EACCES: permission denied

# Solution 1: Don't use sudo (security risk)
# Fix npm permissions instead:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Solution 2: Use npx (doesn't require global install)
npx elit dev`))),

      h3('Config File Not Found'),
      pre(code(...codeBlock(`# Error: Config file not found

# Solution 1: Create config file
# elit.config.ts or elit.config.js or elit.config.json

# Solution 2: Use CLI options
npx elit dev --port 3000 --root ./src

# Solution 3: Check file location
# Config must be in project root (where package.json is)`))),

      h2('Best Practices'),

      h3('1. Use Config File for Project Settings'),
      pre(code(...codeBlock(`// elit.config.ts - Commit to version control
export default {
  dev: {
    port: 3000,
    basePath: '/my-app'
  },
  build: {
    entry: 'src/main.ts',
    outDir: 'dist'
  }
}`))),

      h3('2. Use .env for Environment-Specific Values'),
      pre(code(...codeBlock(`# .env.local - Don't commit (add to .gitignore)
API_KEY=secret-key-here
DB_PASSWORD=password-here

# .env.production - Commit (no secrets)
API_URL=https://api.example.com
APP_NAME=MyApp`))),

      h3('3. Use npm Scripts for Common Tasks'),
      pre(code(...codeBlock(`{
  "scripts": {
    "dev": "elit dev",
    "build": "elit build",
    "preview": "elit preview",
    "deploy": "npm run build && vercel --prod"
  }
}`))),

      h3('4. Document Custom Commands'),
      pre(code(...codeBlock(`// README.md
## Development

\`\`\`bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview build
npm run preview
\`\`\``))),

      h2('Quick Reference'),

      h3('Common Commands'),
      pre(code(...codeBlock(`# Development
npx elit dev
npx elit dev --port 8080

# Build
npx elit build
npx elit build --no-minify --sourcemap

# Preview
npx elit preview
npx elit preview --port 5000

# Help
npx elit help
npx elit version`))),

      h3('Config File Locations'),
      pre(code(...codeBlock(`elit.config.ts    (TypeScript - recommended)
elit.config.js    (ES modules)
elit.config.mjs   (ES modules explicit)
elit.config.cjs   (CommonJS)
elit.config.json  (JSON)`))),

      h3('Environment Files'),
      pre(code(...codeBlock(`.env                 (All environments)
.env.local           (Local overrides - don't commit)
.env.development     (Development mode)
.env.production      (Production mode)
.env.staging         (Staging mode)`))),

      h2('Summary'),
      p('The Elit CLI provides a simple yet powerful interface for development:'),
      ul(
        li('🚀 Three main commands: dev, build, preview'),
        li('⚙️ Flexible configuration via files or CLI options'),
        li('🌍 Environment variable support'),
        li('📋 npm scripts integration'),
        li('🔧 Extensive customization options'),
        li('⚡ Fast and intuitive workflow'),
        li('📖 Comprehensive help system')
      ),

      p('Master these commands and you\'ll have a smooth, efficient development workflow!'),

      h2('Next Steps'),
      ul(
        li(a({ href: '/blog/21' }, 'Learn About Build Configuration')),
        li(a({ href: '/blog/20' }, 'Master Dev and Preview Servers')),
        li(a({ href: '/blog/19' }, 'Read the Complete Configuration Guide')),
        li(a({ href: '/docs' }, 'Browse Full Documentation')),
        li(a({ href: '/examples' }, 'See Code Examples'))
      )
    ),

    th: div(
      p('เชี่ยวชาญ ', strong('Elit command-line interface'), ' ด้วยคู่มือฉบับสมบูรณ์นี้ เรียนรู้คำสั่งทั้งหมด ตัวเลือก และ workflows สำหรับการพัฒนาที่มีประสิทธิภาพ'),

      h2('ภาพรวม CLI'),
      p('Elit CLI มอบ interface ที่เรียบง่ายแต่ทรงพลังสำหรับ:'),
      ul(
        li('🚀 ', strong('Development Server'), ' - เริ่ม dev server ด้วย HMR'),
        li('📦 ', strong('Production Build'), ' - Build bundles ที่ optimize แล้ว'),
        li('👁️ ', strong('Preview Server'), ' - ทดสอบ production builds ในเครื่อง'),
        li('⚙️ ', strong('Configuration'), ' - รองรับ config file แบบยืดหยุ่น'),
        li('🔧 ', strong('CLI Options'), ' - Override config ผ่าน command line')
      ),

      h2('การติดตั้ง'),
      p('ติดตั้ง Elit เป็น project dependency:'),
      pre(code(...codeBlock(`# ใช้ npm
npm install elit

# ใช้ yarn
yarn add elit

# ใช้ pnpm
pnpm add elit`))),

      p('หรือติดตั้งแบบ global สำหรับใช้งานทั่วทั้งระบบ:'),
      pre(code(...codeBlock(`# ใช้ npm
npm install -g elit

# ใช้ yarn
yarn global add elit

# ใช้ pnpm
pnpm add -g elit`))),

      h2('คำสั่งที่มีให้ใช้'),

      h3('elit dev - Development Server'),
      p('เริ่ม development server ด้วย hot module replacement:'),
      pre(code(...codeBlock(`# การใช้งานพื้นฐาน
npx elit dev

# กำหนด port เอง
npx elit dev --port 8080

# กำหนด host เอง
npx elit dev --host 0.0.0.0

# กำหนด root directory เอง
npx elit dev --root ./public

# กำหนด base path เอง
npx elit dev --base-path /my-app

# ไม่เปิด browser
npx elit dev --no-open

# ปิด logging
npx elit dev --silent

# รวมหลายตัวเลือก
npx elit dev --port 8080 --root ./src --no-open`))),

      h3('ตัวเลือกของคำสั่ง Dev'),
      pre(code(...codeBlock(`-p, --port <number>        Port ที่จะรัน server (default: 3000)
-h, --host <string>        Host ที่จะ bind (default: localhost)
-r, --root <dir>           Root directory ที่จะเสิร์ฟ
-b, --base-path <path>     Base path สำหรับแอปพลิเคชัน
--no-open                  ไม่เปิด browser อัตโนมัติ
--silent                   ปิด logging`))),

      h3('elit build - Production Build'),
      p('Build แอปพลิเคชันของคุณสำหรับ production:'),
      pre(code(...codeBlock(`# การใช้งานพื้นฐาน (ใช้ config file)
npx elit build

# ระบุ entry file
npx elit build --entry src/app.ts

# กำหนด output directory เอง
npx elit build --out-dir build

# ระบุ output format
npx elit build --format esm
npx elit build --format cjs
npx elit build --format iife

# ปิด minification (สำหรับ debug)
npx elit build --no-minify

# สร้าง source maps
npx elit build --sourcemap

# ปิด logging
npx elit build --silent

# รวมตัวเลือก
npx elit build --entry src/main.ts --out-dir dist --sourcemap`))),

      h3('ตัวเลือกของคำสั่ง Build'),
      pre(code(...codeBlock(`-e, --entry <file>         Entry file ที่จะ build (required)
-o, --out-dir <dir>        Output directory (default: dist)
-f, --format <format>      Output format: esm, cjs, iife (default: esm)
--no-minify                ปิด minification
--sourcemap                สร้าง sourcemap
--silent                   ปิด logging`))),

      h3('elit preview - Preview Server'),
      p('Preview production build ของคุณในเครื่อง:'),
      pre(code(...codeBlock(`# การใช้งานพื้นฐาน
npx elit preview

# กำหนด port เอง
npx elit preview --port 5000

# กำหนด root directory เอง
npx elit preview --root build

# กำหนด base path เอง
npx elit preview --base-path /app

# ไม่เปิด browser
npx elit preview --no-open

# ปิด logging
npx elit preview --silent

# รวมตัวเลือก
npx elit preview --port 8080 --root dist --no-open`))),

      h3('ตัวเลือกของคำสั่ง Preview'),
      pre(code(...codeBlock(`-p, --port <number>        Port ที่จะรัน server (default: 4173)
-h, --host <string>        Host ที่จะ bind (default: localhost)
-r, --root <dir>           Root directory ที่จะเสิร์ฟ (default: dist)
-b, --base-path <path>     Base path สำหรับแอปพลิเคชัน
--no-open                  ไม่เปิด browser อัตโนมัติ
--silent                   ปิด logging`))),

      h3('elit help - แสดง Help'),
      p('แสดงข้อมูลความช่วยเหลือ:'),
      pre(code(...codeBlock(`# แสดง help ทั่วไป
npx elit help
npx elit --help
npx elit -h

# แสดง help สำหรับคำสั่งเฉพาะ
npx elit dev --help
npx elit build --help
npx elit preview --help`))),

      h3('elit version - แสดง Version'),
      p('แสดง Elit version ที่ติดตั้งอยู่:'),
      pre(code(...codeBlock(`npx elit version
npx elit --version
npx elit -v`))),

      h2('Configuration File'),
      p('สร้างไฟล์ configuration สำหรับการตั้งค่าถาวร:'),

      h3('1. TypeScript Config (แนะนำ)'),
      pre(code(...codeBlock(`// elit.config.ts
import { resolve } from 'path';

export default {
  dev: {
    port: 3000,
    host: 'localhost',
    root: resolve(__dirname, 'src'),
    basePath: '/',
    open: true,
    logging: true
  },

  build: {
    entry: resolve(__dirname, 'src/main.ts'),
    outDir: resolve(__dirname, 'dist'),
    outFile: 'main.js',
    format: 'esm',
    minify: true,
    sourcemap: false
  },

  preview: {
    port: 4173,
    root: 'dist',
    basePath: '/',
    open: true,
    logging: true
  }
}`))),

      h3('2. JavaScript Config'),
      pre(code(...codeBlock(`// elit.config.js or elit.config.mjs
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default {
  dev: {
    port: 3000,
    root: resolve(__dirname, 'src')
  },

  build: {
    entry: resolve(__dirname, 'src/main.ts'),
    outDir: resolve(__dirname, 'dist')
  }
}`))),

      h3('3. JSON Config'),
      pre(code(...codeBlock(`// elit.config.json
{
  "dev": {
    "port": 3000,
    "root": "./src",
    "open": true
  },

  "build": {
    "entry": "./src/main.ts",
    "outDir": "./dist",
    "minify": true
  },

  "preview": {
    "port": 4173,
    "root": "./dist"
  }
}`))),

      h2('Workflows ที่ใช้บ่อย'),

      h3('1. Development Workflow'),
      pre(code(...codeBlock(`# เริ่ม development server
npx elit dev

# Server เริ่มที่ http://localhost:3000
# การเปลี่ยนแปลงจะ reload อัตโนมัติด้วย HMR
# แก้ไขไฟล์และเห็นการอัพเดททันที!`))),

      h3('2. Build และ Preview Workflow'),
      pre(code(...codeBlock(`# Build สำหรับ production
npx elit build

# Preview build ในเครื่อง
npx elit preview

# ทดสอบว่าทุกอย่างทำงานก่อน deploy`))),

      h3('3. Quick Prototype Workflow'),
      pre(code(...codeBlock(`# ไม่ต้อง config! แค่เริ่ม dev server
npx elit dev --root . --port 3000

# สร้าง index.html และ main.ts
# เริ่ม coding ได้ทันที`))),

      h3('4. Multi-Environment Workflow'),
      pre(code(...codeBlock(`# Development
MODE=development npx elit dev

# Staging build
MODE=staging npx elit build

# Production build
MODE=production npx elit build

# แต่ละ mode โหลดไฟล์ .env ที่ตรงกัน`))),

      h3('5. CI/CD Pipeline'),
      pre(code(...codeBlock(`# ติดตั้ง dependencies
npm ci

# รัน tests
npm test

# Build สำหรับ production
npx elit build

# Deploy โฟลเดอร์ dist/
# (ไปยัง Vercel, Netlify, S3, ฯลฯ)`))),

      h2('Package.json Scripts'),
      p('เพิ่ม npm scripts ที่สะดวกสำหรับงานทั่วไป:'),

      h3('Scripts พื้นฐาน'),
      pre(code(...codeBlock(`{
  "scripts": {
    "dev": "elit dev",
    "build": "elit build",
    "preview": "elit preview"
  }
}

# การใช้งาน
npm run dev
npm run build
npm run preview`))),

      h3('Scripts ขั้นสูง'),
      pre(code(...codeBlock(`{
  "scripts": {
    "dev": "elit dev",
    "dev:8080": "elit dev --port 8080",
    "dev:host": "elit dev --host 0.0.0.0",

    "build": "MODE=production elit build",
    "build:dev": "MODE=development elit build --no-minify --sourcemap",
    "build:staging": "MODE=staging elit build",

    "preview": "elit preview",
    "preview:8080": "elit preview --port 8080",

    "deploy": "npm run build && vercel --prod",
    "deploy:staging": "npm run build:staging && vercel",

    "clean": "rm -rf dist",
    "clean:build": "npm run clean && npm run build"
  }
}`))),

      h2('ลำดับความสำคัญของการตั้งค่า CLI'),
      p('เข้าใจว่า CLI options, config files และ defaults ทำงานร่วมกันอย่างไร:'),

      h3('ลำดับความสำคัญ (สูงสุดไปต่ำสุด)'),
      ul(
        li(strong('1. CLI Options'), ' - ตัวเลือก command-line ชนะเสมอ'),
        li(strong('2. Config File'), ' - การตั้งค่าจาก elit.config.{ts,js,json}'),
        li(strong('3. Defaults'), ' - ค่า default ที่มีอยู่แล้ว')
      ),

      h3('ตัวอย่าง'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  dev: {
    port: 3000,
    host: 'localhost',
    open: true
  }
}

# CLI override config
npx elit dev --port 8080 --no-open

# ผลลัพธ์:
# - port: 8080 (จาก CLI)
# - host: 'localhost' (จาก config)
# - open: false (จาก CLI --no-open)`))),

      h2('Environment Variables'),
      p('ใช้ environment variables สำหรับการตั้งค่าแบบ dynamic:'),

      h3('1. ใช้ไฟล์ .env'),
      pre(code(...codeBlock(`# .env.development
MODE=development
PORT=3000
API_URL=http://localhost:8080

# .env.production
MODE=production
PORT=4173
API_URL=https://api.example.com`))),

      h3('2. เข้าถึงใน Config'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  dev: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost'
  },

  build: {
    entry: 'src/main.ts',
    env: {
      VITE_API_URL: process.env.API_URL,
      VITE_MODE: process.env.MODE
    }
  }
}`))),

      h3('3. เข้าถึงในแอปพลิเคชัน'),
      pre(code(...codeBlock(`// src/config.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  mode: import.meta.env.VITE_MODE
};

// src/main.ts
import { config } from './config';
console.log('API URL:', config.apiUrl);
console.log('Mode:', config.mode);`))),

      h2('การใช้ CLI ขั้นสูง'),

      h3('1. Development ด้วย HTTPS'),
      pre(code(...codeBlock(`// elit.config.ts
export default {
  dev: {
    port: 3000,
    https: true  // เปิด HTTPS ด้วย self-signed cert
  }
}

# เริ่ม dev server
npx elit dev

# เข้าถึงที่ https://localhost:3000`))),

      h3('2. กำหนด Build Output เอง'),
      pre(code(...codeBlock(`# Build ด้วยชื่อ output กำหนดเอง
npx elit build --entry src/app.ts --out-dir build --format esm

# Build หลาย formats
npx elit build --format esm
npx elit build --format cjs
npx elit build --format iife`))),

      h3('3. Debug ปัญหา Build'),
      pre(code(...codeBlock(`# Build โดยไม่ minify
npx elit build --no-minify

# Build พร้อม source maps
npx elit build --sourcemap

# รวมกันเพื่อ debug แบบเต็มรูปแบบ
npx elit build --no-minify --sourcemap`))),

      h3('4. Preview บน Network'),
      pre(code(...codeBlock(`# Bind กับ network interfaces ทั้งหมด
npx elit preview --host 0.0.0.0 --port 8080

# เข้าถึงจากอุปกรณ์อื่น:
# http://192.168.1.xxx:8080`))),

      h2('แก้ไขปัญหา'),

      h3('ไม่พบคำสั่ง'),
      pre(code(...codeBlock(`# Error: elit: command not found

# วิธีแก้ 1: ใช้ npx
npx elit dev

# วิธีแก้ 2: ติดตั้งแบบ global
npm install -g elit
elit dev

# วิธีแก้ 3: ใช้ npm scripts
# เพิ่มใน package.json:
{
  "scripts": {
    "dev": "elit dev"
  }
}
npm run dev`))),

      h3('Port ถูกใช้งานแล้ว'),
      pre(code(...codeBlock(`# Error: EADDRINUSE: address already in use :::3000

# วิธีแก้ 1: ใช้ port อื่น
npx elit dev --port 8080

# วิธีแก้ 2: ปิด process ที่ใช้ port นั้น
# บน Unix/Mac:
lsof -ti:3000 | xargs kill

# บน Windows:
netstat -ano | findstr :3000
taskkill /PID <process_id> /F`))),

      h3('ไม่พบ Module'),
      pre(code(...codeBlock(`# Error: Cannot find module 'elit'

# วิธีแก้: ติดตั้ง dependencies
npm install

# หรือ clean install
rm -rf node_modules package-lock.json
npm install`))),

      h3('ไม่มีสิทธิ์'),
      pre(code(...codeBlock(`# Error: EACCES: permission denied

# วิธีแก้ 1: ไม่ใช้ sudo (เสี่ยงด้านความปลอดภัย)
# แก้ไข npm permissions แทน:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# วิธีแก้ 2: ใช้ npx (ไม่ต้องติดตั้งแบบ global)
npx elit dev`))),

      h3('ไม่พบไฟล์ Config'),
      pre(code(...codeBlock(`# Error: Config file not found

# วิธีแก้ 1: สร้างไฟล์ config
# elit.config.ts หรือ elit.config.js หรือ elit.config.json

# วิธีแก้ 2: ใช้ CLI options
npx elit dev --port 3000 --root ./src

# วิธีแก้ 3: ตรวจสอบตำแหน่งไฟล์
# Config ต้องอยู่ใน project root (ที่มี package.json)`))),

      h2('Best Practices'),

      h3('1. ใช้ Config File สำหรับการตั้งค่าโปรเจค'),
      pre(code(...codeBlock(`// elit.config.ts - Commit เข้า version control
export default {
  dev: {
    port: 3000,
    basePath: '/my-app'
  },
  build: {
    entry: 'src/main.ts',
    outDir: 'dist'
  }
}`))),

      h3('2. ใช้ .env สำหรับค่าเฉพาะ Environment'),
      pre(code(...codeBlock(`# .env.local - ไม่ commit (เพิ่มเข้า .gitignore)
API_KEY=secret-key-here
DB_PASSWORD=password-here

# .env.production - Commit (ไม่มี secrets)
API_URL=https://api.example.com
APP_NAME=MyApp`))),

      h3('3. ใช้ npm Scripts สำหรับงานทั่วไป'),
      pre(code(...codeBlock(`{
  "scripts": {
    "dev": "elit dev",
    "build": "elit build",
    "preview": "elit preview",
    "deploy": "npm run build && vercel --prod"
  }
}`))),

      h3('4. จัดทำเอกสารคำสั่งที่กำหนดเอง'),
      pre(code(...codeBlock(`// README.md
## Development

\`\`\`bash
# เริ่ม dev server
npm run dev

# Build สำหรับ production
npm run build

# Preview build
npm run preview
\`\`\``))),

      h2('Quick Reference'),

      h3('คำสั่งที่ใช้บ่อย'),
      pre(code(...codeBlock(`# Development
npx elit dev
npx elit dev --port 8080

# Build
npx elit build
npx elit build --no-minify --sourcemap

# Preview
npx elit preview
npx elit preview --port 5000

# Help
npx elit help
npx elit version`))),

      h3('ตำแหน่งไฟล์ Config'),
      pre(code(...codeBlock(`elit.config.ts    (TypeScript - แนะนำ)
elit.config.js    (ES modules)
elit.config.mjs   (ES modules ชัดเจน)
elit.config.cjs   (CommonJS)
elit.config.json  (JSON)`))),

      h3('ไฟล์ Environment'),
      pre(code(...codeBlock(`.env                 (ทุก environments)
.env.local           (Local overrides - ไม่ commit)
.env.development     (Development mode)
.env.production      (Production mode)
.env.staging         (Staging mode)`))),

      h2('สรุป'),
      p('Elit CLI มอบ interface ที่เรียบง่ายแต่ทรงพลังสำหรับการพัฒนา:'),
      ul(
        li('🚀 สามคำสั่งหลัก: dev, build, preview'),
        li('⚙️ การตั้งค่าแบบยืดหยุ่นผ่านไฟล์หรือ CLI options'),
        li('🌍 รองรับ environment variables'),
        li('📋 ผสานกับ npm scripts'),
        li('🔧 ตัวเลือกการปรับแต่งมากมาย'),
        li('⚡ Workflow ที่รวดเร็วและใช้งานง่าย'),
        li('📖 ระบบ help ที่ครบถ้วน')
      ),

      p('เชี่ยวชาญคำสั่งเหล่านี้แล้วคุณจะมี development workflow ที่ราบรื่นและมีประสิทธิภาพ!'),

      h2('ขั้นตอนต่อไป'),
      ul(
        li(a({ href: '/blog/21' }, 'เรียนรู้เกี่ยวกับการตั้งค่า Build')),
        li(a({ href: '/blog/20' }, 'เชี่ยวชาญ Dev และ Preview Servers')),
        li(a({ href: '/blog/19' }, 'อ่านคู่มือการตั้งค่าฉบับสมบูรณ์')),
        li(a({ href: '/docs' }, 'เรียกดูเอกสารฉบับเต็ม')),
        li(a({ href: '/examples' }, 'ดูตัวอย่างโค้ด'))
      )
    )
  }
};
