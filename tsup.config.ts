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
        index: 'src/client/index.ts',
        dom: 'src/client/dom/index.ts',
        el: 'src/client/el/index.ts',
        router: 'src/client/router/index.ts',
        state: 'src/client/state/index.ts',
        style: 'src/client/style/index.ts',
        types: 'src/shares/types.ts',
        hmr: 'src/client/hmr/index.ts',
        native: 'src/native/native/index.ts',
        universal: 'src/shares/universal.ts'
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
        server: 'src/server/server/index.ts',
        'smtp-server': 'src/server/smtp-server/index.ts',
        build: 'src/tools/build/index.ts',
        http: 'src/server/http/index.ts',
        https: 'src/server/https/index.ts',
        ws: 'src/server/ws/index.ts',
        wss: 'src/server/wss/index.ts',
        fs: 'src/server/fs/index.ts',
        'mime-types': 'src/shares/mime-types/index.ts',
        chokidar: 'src/server/chokidar/index.ts',
        path: 'src/server/path/index.ts',
        database: 'src/server/database/index.ts',
        config: 'src/shares/config/index.ts',
        coverage: 'src/test/coverage/index.ts',
        'test-runtime': 'src/test/runtime/index.ts',
        'test-reporter': 'src/test/reporter/index.ts',
        test: 'src/test/test/index.ts',
        desktop: 'src/tools/desktop/index.ts',
        'desktop-auto-render': 'src/shares/desktop-auto-render/index.ts',
        'render-context': 'src/shares/render-context/index.ts',
        runtime: 'src/shares/runtime.ts',
        'preview-build': 'src/tools/preview-build/index.ts',
        'dev-build': 'src/tools/dev-build/index.ts'
    },
    format: createBundleFormats(),
    dts: true,
    clean: false,
    minify: false,
    splitting: false,
    treeshake: false,
    sourcemap: false,
    target: 'es2020',
    external: ['http', 'https', 'net', 'tls', 'crypto', 'stream', 'util', 'events', 'buffer', 'querystring', 'url', 'path', 'fs', 'os', 'child_process', 'worker_threads', 'zlib', 'assert', 'dns', 'dgram', 'readline', 'repl', 'tty', 'v8', 'vm', 'perf_hooks', 'async_hooks', 'timers', 'string_decoder', 'process', 'module', 'cluster', 'constants', 'domain', 'punycode', 'bun', 'monocart-coverage-reports', 'esbuild', 'smtp-server', 'source-map'],
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
        cli: 'src/cli/index.ts'
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
