import { defineConfig, type Format, type Options } from 'tsup';

const createBundleFormats = (): Format[] => ['cjs', 'esm', 'iife'];
const createCliFormats = (): Format[] => ['cjs', 'esm'];

const getJsExtension = (format: string) => {
    if (format === 'cjs') {
        return '.cjs';
    }

    if (format === 'iife') {
        return '.js';
    }

    return '.mjs';
};

export const browserCompatibleConfig = {
    entry: {
        index: 'src/index.ts',
        dom: 'src/dom.ts',
        el: 'src/el.ts',
        router: 'src/router.ts',
        state: 'src/state.ts',
        style: 'src/style.ts',
        types: 'src/types.ts',
        hmr: 'src/hmr.ts',
        native: 'src/native.ts',
        universal: 'src/universal.ts'
    },
    format: createBundleFormats(),
    dts: true,
    clean: false,
    minify: false,
    splitting: false,
    treeshake: false,
    sourcemap: false,
    target: 'es2020',
    outExtension({ format }) {
        return {
            js: getJsExtension(format),
            dts: '.d.ts'
        };
    }
} satisfies Options;

export const nodeOnlyConfig = {
    entry: {
        server: 'src/server.ts',
        build: 'src/build.ts',
        http: 'src/http.ts',
        https: 'src/https.ts',
        ws: 'src/ws.ts',
        wss: 'src/wss.ts',
        fs: 'src/fs.ts',
        'mime-types': 'src/mime-types.ts',
        chokidar: 'src/chokidar.ts',
        path: 'src/path.ts',
        database: 'src/database.ts',
        config: 'src/config.ts',
        coverage: 'src/coverage.ts',
        'test-runtime': 'src/test-runtime.ts',
        'test-reporter': 'src/test-reporter.ts',
        test: 'src/test.ts',
        desktop: 'src/desktop.ts',
        'desktop-auto-render': 'src/desktop-auto-render.ts',
        'render-context': 'src/render-context.ts',
        runtime: 'src/runtime.ts'
    },
    format: createBundleFormats(),
    dts: true,
    clean: false,
    minify: false,
    splitting: false,
    treeshake: false,
    sourcemap: false,
    target: 'es2020',
    external: ['http', 'https', 'net', 'tls', 'crypto', 'stream', 'util', 'events', 'buffer', 'querystring', 'url', 'path', 'fs', 'os', 'child_process', 'worker_threads', 'zlib', 'assert', 'dns', 'dgram', 'readline', 'repl', 'tty', 'v8', 'vm', 'perf_hooks', 'async_hooks', 'timers', 'string_decoder', 'process', 'module', 'cluster', 'constants', 'domain', 'punycode', 'bun', 'monocart-coverage-reports', 'esbuild', 'source-map'],
    outExtension({ format }) {
        return {
            js: getJsExtension(format),
            dts: '.d.ts'
        };
    },
    banner({ format }) {
        if (format === 'esm') {
            return {
                js: `import {createRequire as __createRequire} from 'module';const require = __createRequire(import.meta.url);`
            };
        }
    }
} satisfies Options;

export const cliConfig = {
    entry: {
        cli: 'src/cli.ts'
    },
    format: createCliFormats(),
    dts: true,
    clean: false,
    minify: false,
    splitting: false,
    treeshake: false,
    sourcemap: false,
    platform: 'node',
    external: ['bun', 'esbuild', 'source-map', 'v8'],
    target: 'es2020',
    outExtension({ format }) {
        return {
            js: getJsExtension(format),
            dts: '.d.ts'
        };
    }
} satisfies Options;

export default defineConfig(browserCompatibleConfig);
