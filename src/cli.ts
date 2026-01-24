#!/usr/bin/env node
/**
 * Main CLI for Elit
 */

import { loadConfig, mergeConfig, loadEnv } from './config';
import { createDevServer } from './server';
import { build } from './build';
import type { DevServerOptions, BuildOptions, PreviewOptions } from './types';

const COMMANDS = ['dev', 'build', 'preview', 'test', 'help', 'version'] as const;
type Command = typeof COMMANDS[number];

/**
 * Helper: Setup graceful shutdown handlers (eliminates duplication in runDev and runPreview)
 */
function setupShutdownHandlers(closeFunc: () => Promise<void>): void {
    const shutdown = async () => {
        console.log('\n[Server] Shutting down...');
        await closeFunc();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

/**
 * Helper: Execute build with error handling (eliminates duplication in runBuild)
 */
async function executeBuild(options: BuildOptions): Promise<void> {
    try {
        await build(options);
    } catch (error) {
        process.exit(1);
    }
}

/**
 * Helper: Validate entry file (eliminates duplication in runBuild)
 */
function validateEntry(entry: string | undefined, buildIndex?: number): void {
    if (!entry) {
        if (buildIndex !== undefined) {
            console.error(`Error: Entry file is required for build #${buildIndex + 1}`);
        } else {
            console.error('Error: Entry file is required');
            console.error('Specify in config file or use --entry <file>');
        }
        process.exit(1);
    }
}

/**
 * Helper: Ensure env is set (eliminates duplication in runBuild)
 * Merges .env files with config.env, with .env files taking precedence
 */
function ensureEnv(options: BuildOptions, env: Record<string, string>): void {
    options.env = { ...options.env, ...env };
}

/**
 * Helper: Generic argument parser (eliminates duplication in parseDevArgs, parseBuildArgs, parsePreviewArgs)
 */
type ArgHandler<T> = (options: T, value: string, index: { current: number }) => void;

function parseArgs<T>(args: string[], handlers: Record<string, ArgHandler<T>>, options: T): T {
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const handler = handlers[arg];
        if (handler) {
            const index = { current: i };
            handler(options, args[i + 1], index);
            i = index.current;
        }
    }
    return options;
}

async function main() {
    const args = process.argv.slice(2);
    const command = (args[0] as Command) || 'help';

    if (!COMMANDS.includes(command)) {
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }

    switch (command) {
        case 'dev':
            await runDev(args.slice(1));
            break;
        case 'build':
            await runBuild(args.slice(1));
            break;
        case 'preview':
            await runPreview(args.slice(1));
            break;
        case 'test':
            await runTest(args.slice(1));
            break;
        case 'version':
            printVersion();
            break;
        case 'help':
        default:
            printHelp();
            break;
    }
}

async function runDev(args: string[]) {
    const cliOptions = parseDevArgs(args);
    const config = await loadConfig();

    const options = config?.dev
        ? mergeConfig(config.dev, cliOptions)
        : cliOptions as DevServerOptions;

    // Load environment variables
    const mode = process.env.MODE || 'development';
    const env = loadEnv(mode);

    // Merge env from config and .env files
    options.env = { ...options.env, ...env };

    // Ensure we have at least root or clients
    if (!options.root && (!options.clients || options.clients.length === 0)) {
        options.root = process.cwd();
    }

    // Set mode to 'dev' for dev command
    options.mode = 'dev';

    const devServer = createDevServer(options);

    // Handle graceful shutdown
    setupShutdownHandlers(() => devServer.close());
}

async function runBuild(args: string[]) {
    const cliOptions = parseBuildArgs(args);
    const config = await loadConfig();

    // Load environment variables
    const mode = process.env.MODE || 'production';
    const env = loadEnv(mode);

    // Check if config has build array or single build
    if (config?.build) {
        const builds = Array.isArray(config.build) ? config.build : [config.build];

        // If CLI options provided, merge with first build or use as standalone
        if (Object.keys(cliOptions).length > 0) {
            const options = mergeConfig(builds[0] || {}, cliOptions) as BuildOptions;

            ensureEnv(options, env);
            validateEntry(options.entry);

            await executeBuild(options);
            process.exit(0);
        } else {
            // Run all builds from config
            console.log(`Building ${builds.length} ${builds.length === 1 ? 'entry' : 'entries'}...\n`);

            for (let i = 0; i < builds.length; i++) {
                const buildConfig = builds[i];

                ensureEnv(buildConfig, env);
                validateEntry(buildConfig.entry, i);

                console.log(`[${i + 1}/${builds.length}] Building ${buildConfig.entry}...`);

                try {
                    await build(buildConfig);
                } catch (error) {
                    console.error(`Build #${i + 1} failed`);
                    process.exit(1);
                }

                if (i < builds.length - 1) {
                    console.log(''); // Empty line between builds
                }
            }

            console.log(`\n✓ All ${builds.length} builds completed successfully`);
            process.exit(0);
        }
    } else {
        // No config, use CLI options only
        const options = cliOptions as BuildOptions;

        ensureEnv(options, env);
        validateEntry(options.entry);

        await executeBuild(options);
        console.log('\n✓ Build completed successfully');
        process.exit(0);
    }
}

async function runPreview(args: string[]) {
    const cliOptions = parsePreviewArgs(args);
    const config = await loadConfig();

    const previewConfig = config?.preview || {};
    const mergedOptions: PreviewOptions = {
        ...previewConfig,
        ...Object.fromEntries(
            Object.entries(cliOptions).filter(([_, v]) => v !== undefined)
        )
    };

    // Build DevServerOptions from PreviewOptions
    const options: DevServerOptions = {
        port: mergedOptions.port || 4173,
        host: mergedOptions.host || 'localhost',
        open: mergedOptions.open ?? true,
        logging: mergedOptions.logging ?? true,
        domain: mergedOptions.domain
    };

    // Support both single root and clients array
    if (mergedOptions.clients && mergedOptions.clients.length > 0) {
        options.clients = mergedOptions.clients;
        console.log('Starting preview server with multiple clients...');
        console.log(`  Clients: ${mergedOptions.clients.length}`);
        mergedOptions.clients.forEach((client, i) => {
            console.log(`    ${i + 1}. ${client.basePath} -> ${client.root}`);
        });
    } else {
        // Get outDir from build config (use first build if array)
        const buildConfig = config?.build;
        const defaultOutDir = Array.isArray(buildConfig) ? buildConfig[0]?.outDir : buildConfig?.outDir;

        options.root = mergedOptions.root || defaultOutDir || 'dist';
        options.basePath = mergedOptions.basePath;
        options.index = mergedOptions.index;
        console.log('Starting preview server...');
        console.log(`  Root:  ${options.root}`);
    }

    // Add global proxy if configured
    if (mergedOptions.proxy && mergedOptions.proxy.length > 0) {
        options.proxy = mergedOptions.proxy;
    }

    // Add global worker if configured
    if (mergedOptions.worker && mergedOptions.worker.length > 0) {
        options.worker = mergedOptions.worker;
    }

    // Add API router if configured
    if (mergedOptions.api) {
        options.api = mergedOptions.api;
    }

    // Add HTTPS if configured
    if (mergedOptions.https) {
        options.https = mergedOptions.https;
    }

    // Add SSR if configured
    if (mergedOptions.ssr) {
        options.ssr = mergedOptions.ssr;
    }

    // Load environment variables
    const mode = process.env.MODE || 'production';
    const env = loadEnv(mode);

    // Merge env from config and .env files
    options.env = { ...mergedOptions.env, ...env };

    // Set mode to 'preview' for preview command
    options.mode = 'preview';

    const devServer = createDevServer(options);

    setupShutdownHandlers(() => devServer.close());
}

async function runTest(args: string[]) {
    const options = parseTestArgs(args);

    // Import test runner dynamically
    const { runJestTests, runWatchMode } = await import('./test');

    // Determine run mode based on flags
    // Default behavior: run once, use --watch/-w for watch mode
    const isWatch = options.watch;

    if (isWatch) {
        // Watch mode (explicit --watch or -w flag)
        await runWatchMode({
            files: options.files,
            include: options.include,
            exclude: options.exclude,
            reporter: options.reporter,
            timeout: options.timeout,
            bail: options.bail,
            coverage: options.coverage,
            describePattern: options.describe,
            testPattern: options.testName,
        });
    } else {
        // Run once mode (default behavior)
        await runJestTests({
            files: options.files,
            include: options.include,
            exclude: options.exclude,
            reporter: options.reporter,
            timeout: options.timeout,
            bail: options.bail,
            coverage: options.coverage,
            describePattern: options.describe,
            testPattern: options.testName,
        });

        // Exit with appropriate code
        process.exit(0);
    }
}

interface TestOptions {
    files?: string[];
    include?: string[];
    exclude?: string[];
    reporter?: 'default' | 'dot' | 'json' | 'verbose';
    timeout?: number;
    bail?: boolean;
    run?: boolean;
    watch?: boolean;
    describe?: string;
    testName?: string;
    coverage?: {
        enabled: boolean;
        provider: 'v8' | 'istanbul';
        reporter?: ('text' | 'html' | 'lcov' | 'json')[];
        include?: string[];
        exclude?: string[];
    };
}

function parseTestArgs(args: string[]): TestOptions {
    const options: TestOptions = {};

    // Parse flags first to determine mode
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--run':
            case '-r':
                options.run = true;
                break;
            case '--watch':
            case '-w':
                options.watch = true;
                break;
            case '--coverage':
            case '-c':
                options.coverage = {
                    enabled: true,
                    provider: 'v8',
                    reporter: ['text', 'html'],
                };
                break;
            case '--file':
            case '-f':
                // Parse comma-separated file list
                const filesValue = args[++i];
                if (filesValue) {
                    // Split by comma and trim whitespace
                    options.files = filesValue.split(',').map(f => f.trim());
                }
                break;
            case '--describe':
            case '-d':
                // Parse describe name filter
                const describeValue = args[++i];
                if (describeValue) {
                    options.describe = describeValue;
                }
                break;
            case '--it':
            case '-t':
                // Parse test name filter
                const testValue = args[++i];
                if (testValue) {
                    options.testName = testValue;
                }
                break;
        }
    }

    return options;
}

function parseDevArgs(args: string[]): Partial<DevServerOptions> {
    const options: Partial<DevServerOptions> = {};

    const handlers: Record<string, ArgHandler<Partial<DevServerOptions>>> = {
        '-p': (opts, value, index) => { opts.port = parseInt(value, 10); index.current++; },
        '--port': (opts, value, index) => { opts.port = parseInt(value, 10); index.current++; },
        '-h': (opts, value, index) => { opts.host = value; index.current++; },
        '--host': (opts, value, index) => { opts.host = value; index.current++; },
        '-r': (opts, value, index) => { opts.root = value; index.current++; },
        '--root': (opts, value, index) => { opts.root = value; index.current++; },
        '--no-open': (opts) => { opts.open = false; },
        '--silent': (opts) => { opts.logging = false; },
    };

    return parseArgs(args, handlers, options);
}

function parseBuildArgs(args: string[]): Partial<BuildOptions> {
    const options: Partial<BuildOptions> = {};

    const handlers: Record<string, ArgHandler<Partial<BuildOptions>>> = {
        '-e': (opts, value, index) => { opts.entry = value; index.current++; },
        '--entry': (opts, value, index) => { opts.entry = value; index.current++; },
        '-o': (opts, value, index) => { opts.outDir = value; index.current++; },
        '--out-dir': (opts, value, index) => { opts.outDir = value; index.current++; },
        '--no-minify': (opts) => { opts.minify = false; },
        '--sourcemap': (opts) => { opts.sourcemap = true; },
        '-f': (opts, value, index) => { opts.format = value as BuildOptions['format']; index.current++; },
        '--format': (opts, value, index) => { opts.format = value as BuildOptions['format']; index.current++; },
        '--silent': (opts) => { opts.logging = false; },
    };

    return parseArgs(args, handlers, options);
}

function parsePreviewArgs(args: string[]): Partial<{ port: number; host: string; root: string; basePath: string; open: boolean; logging: boolean }> {
    const options: Partial<{ port: number; host: string; root: string; basePath: string; open: boolean; logging: boolean }> = {};

    type PreviewOptions = { port: number; host: string; root: string; basePath: string; open: boolean; logging: boolean };

    const handlers: Record<string, ArgHandler<Partial<PreviewOptions>>> = {
        '-p': (opts, value, index) => { opts.port = parseInt(value, 10); index.current++; },
        '--port': (opts, value, index) => { opts.port = parseInt(value, 10); index.current++; },
        '-h': (opts, value, index) => { opts.host = value; index.current++; },
        '--host': (opts, value, index) => { opts.host = value; index.current++; },
        '-r': (opts, value, index) => { opts.root = value; index.current++; },
        '--root': (opts, value, index) => { opts.root = value; index.current++; },
        '-b': (opts, value, index) => { opts.basePath = value; index.current++; },
        '--base-path': (opts, value, index) => { opts.basePath = value; index.current++; },
        '--no-open': (opts) => { opts.open = false; },
        '--silent': (opts) => { opts.logging = false; },
    };

    return parseArgs(args, handlers, options);
}

function printHelp() {
    console.log(`
Elit - Modern Web Development Toolkit

Usage:
  elit <command> [options]

Commands:
  dev       Start development server
  build     Build for production
  preview   Preview production build
  test      Run tests
  version   Show version number
  help      Show this help message

Dev Options:
  -p, --port <number>    Port to run server on (default: 3000)
  -h, --host <string>    Host to bind to (default: localhost)
  -r, --root <path>      Root directory to serve
  --no-open              Don't open browser automatically
  --silent               Disable logging

Build Options:
  -e, --entry <file>     Entry file to build (required)
  -o, --out-dir <dir>    Output directory (default: dist)
  -f, --format <format>  Output format: esm, cjs, iife (default: esm)
  --no-minify            Disable minification
  --sourcemap            Generate sourcemap
  --silent               Disable logging

Note: Build configuration supports both single and multiple builds:
      - Single build: build: { entry: 'src/app.ts', outDir: 'dist' }
      - Multiple builds: build: [{ entry: 'src/app1.ts' }, { entry: 'src/app2.ts' }]
      When using array, all builds run sequentially.

Preview Options:
  -p, --port <number>      Port to run server on (default: 4173)
  -h, --host <string>      Host to bind to (default: localhost)
  -r, --root <dir>         Root directory to serve (default: dist or build.outDir)
  -b, --base-path <path>   Base path for the application
  --no-open                Don't open browser automatically
  --silent                 Disable logging

Note: Preview mode has full feature parity with dev mode:
      - Single root and multi-client configurations (use clients[] in config)
      - REST API endpoints (use api option in config)
      - Proxy forwarding and Web Workers
      - HTTPS support, custom middleware, and SSR

Test Options:
  -r, --run               Run all tests once (default, same as no flags)
  -w, --watch             Run in watch mode
  -f, --file <files>      Run specific files (comma-separated), e.g.: --file ./test1.test.ts,./test2.spec.ts
  -d, --describe <name>   Run only tests matching describe name, e.g.: --describe "Footer Component"
  -t, --it <name>         Run only tests matching test name, e.g.: --it "should create"
  -c, --coverage          Generate coverage report

Note: Test command behaviors:
      - elit test                     Run all tests once (default)
      - elit test --run               Run all tests once (same as default)
      - elit test -f ./test.ts        Run specific file(s) once
      - elit test -d "Footer"         Run only tests in describe blocks matching "Footer"
      - elit test -t "should create"  Run only tests matching "should create"
      - elit test --watch             Run in watch mode
      - elit test --coverage          Run with coverage report

Config File:
  Create elit.config.ts, elit.config.js, or elit.config.json in project root

Proxy Configuration:
  Configure proxy in the config file to forward requests to backend servers.
  Supports both global proxy (applies to all clients) and client-specific proxy.

  Options:
    - context: Path prefix to match (required, e.g., '/api', '/graphql')
    - target: Backend server URL (required, e.g., 'http://localhost:8080')
    - changeOrigin: Change the origin header to match target (default: false)
    - pathRewrite: Rewrite request paths (e.g., { '^/api': '/v1/api' })
    - headers: Add custom headers to proxied requests
    - ws: Enable WebSocket proxying (default: false)

  Proxy Priority:
    1. Client-specific proxy (defined in clients[].proxy)
    2. Global proxy (defined in dev.proxy)
    The first matching proxy configuration will be used.

Worker Configuration:
  Configure Web Workers in the config file for background processing.
  Supports both global workers (applies to all clients) and client-specific workers.

  Options:
    - path: Worker script path relative to root directory (required)
    - name: Worker name/identifier (optional, defaults to filename)
    - type: Worker type - 'module' (ESM) or 'classic' (default: 'module')

  Worker Priority:
    1. Client-specific workers (defined in clients[].worker)
    2. Global workers (defined in dev.worker or preview.worker)
    Both global and client-specific workers will be loaded.

API Configuration:
  Configure REST API endpoints per client or globally.
  Supports both global configuration and client-specific configuration.

  Client-specific API:
    - Each client can have its own API router (clients[].api)
    - Client-specific configuration is isolated to that client's routes
    - API paths are automatically prefixed with the client's basePath
      Example: If basePath is '/app1' and route is '/api/health',
               the full path will be '/app1/api/health'

  Priority:
    1. Client-specific API routes are matched first (defined in clients[].api)
    2. Global API routes are matched second (defined in dev.api or preview.api)

Examples:
  elit dev
  elit dev --port 8080
  elit build --entry src/app.ts
  elit preview
  elit preview --port 5000

Config file example (elit.config.ts):
  export default {
    dev: {
      port: 3000,
      clients: [
        {
          root: './app1',
          basePath: '/app1',
          proxy: [
            {
              context: '/api',
              target: 'http://localhost:8080',
              changeOrigin: true
            }
          ],
          worker: [
            {
              path: 'workers/data-processor.js',
              name: 'dataProcessor',
              type: 'module'
            }
          ],
          // API routes are prefixed with basePath
          // This route becomes: /app1/api/health
          api: router()
            .get('/api/health', (req, res) => {
              res.json({ status: 'ok', app: 'app1' });
            }),
          middleware: [
            (req, res, next) => {
              console.log('App1 middleware:', req.url);
              next();
            }
          ]
        },
        {
          root: './app2',
          basePath: '/app2',
          proxy: [
            {
              context: '/graphql',
              target: 'http://localhost:4000',
              changeOrigin: true
            }
          ],
          worker: [
            {
              path: 'workers/image-worker.js',
              type: 'module'
            }
          ],
          // API routes are prefixed with basePath
          // This route becomes: /app2/api/status
          api: router()
            .get('/api/status', (req, res) => {
              res.json({ status: 'running', app: 'app2' });
            }),
          middleware: [
            (req, res, next) => {
              console.log('App2 middleware:', req.url);
              next();
            }
          ]
        }
      ],
      // Global proxy (applies to all clients)
      proxy: [
        {
          context: '/shared-api',
          target: 'http://localhost:9000',
          changeOrigin: true
        }
      ],
      // Global workers (applies to all clients)
      worker: [
        {
          path: 'workers/shared-worker.js',
          name: 'sharedWorker',
          type: 'module'
        }
      ]
    },
    // Single build configuration
    build: {
      entry: 'src/app.ts',
      outDir: 'dist',
      format: 'esm'
    },
    // Alternative: Multiple builds
    // build: [
    //   {
    //     entry: 'src/app1.ts',
    //     outDir: 'dist/app1',
    //     outFile: 'app1.js',
    //     format: 'esm',
    //     minify: true
    //   },
    //   {
    //     entry: 'src/app2.ts',
    //     outDir: 'dist/app2',
    //     outFile: 'app2.js',
    //     format: 'esm',
    //     minify: true
    //   },
    //   {
    //     entry: 'src/worker.ts',
    //     outDir: 'dist/workers',
    //     outFile: 'worker.js',
    //     format: 'esm',
    //     platform: 'browser'
    //   }
    // ],
    preview: {
      port: 4173,
      // Single client preview
      root: 'dist',
      basePath: '/app',
      https: false,
      // API router (import from elit/server)
      api: router()
        .get('/api/data', (req, res) => {
          res.json({ message: 'Hello from preview API' });
        }),
      // Custom middleware
      middleware: [
        (req, res, next) => {
          console.log('Preview request:', req.url);
          next();
        }
      ],
      // SSR render function
      ssr: () => '<h1>Server-rendered content</h1>',
      proxy: [
        {
          context: '/api',
          target: 'http://localhost:8080'
        }
      ],
      worker: [
        {
          path: 'workers/cache-worker.js',
          type: 'module'
        }
      ]
      // Multi-client preview (alternative)
      // clients: [
      //   {
      //     root: './dist/app1',
      //     basePath: '/app1',
      //     proxy: [
      //       {
      //         context: '/api',
      //         target: 'http://localhost:8080'
      //       }
      //     ],
      //     worker: [
      //       {
      //         path: 'workers/app1-worker.js',
      //         type: 'module'
      //       }
      //     ],
      //     api: router()
      //       .get('/api/health', (req, res) => {
      //         res.json({ status: 'ok', app: 'app1' });
      //       }),
      //     middleware: [
      //       (req, res, next) => {
      //         console.log('App1 request:', req.url);
      //         next();
      //       }
      //     ]
      //   },
      //   {
      //     root: './dist/app2',
      //     basePath: '/app2',
      //     worker: [
      //       {
      //         path: 'workers/app2-worker.js',
      //         type: 'module'
      //       }
      //     ],
      //     api: router()
      //       .get('/api/status', (req, res) => {
      //         res.json({ status: 'running', app: 'app2' });
      //       }),
      //     middleware: [
      //       (req, res, next) => {
      //         console.log('App2 request:', req.url);
      //         next();
      //       }
      //     ]
      //   }
      // ]
    }
  }
  `);
}

function printVersion() {
    const pkg = require('../package.json');
    console.log(`elit v${pkg.version}`);
}

// Run CLI
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
