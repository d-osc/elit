import { defineConfig } from 'tsup';

export default defineConfig([
    // Browser-compatible modules (no require shim needed)
    {
        entry: {
            index: 'src/index.ts',
            dom: 'src/dom.ts',
            el: 'src/el.ts',
            router: 'src/router.ts',
            state: 'src/state.ts',
            style: 'src/style.ts',
            types: 'src/types.ts',
            hmr: 'src/hmr.ts',
            runtime: 'src/runtime.ts'
        },
        format: ['cjs', 'esm'],
        dts: true,
        clean: true,
        minify: false,
        splitting: false,
        treeshake: false,
        sourcemap: true,
        target: 'es2020',
        outExtension({ format }) {
            return {
                js: format === 'cjs' ? '.js' : '.mjs',
                dts: '.d.ts'
            };
        }
    },
    // Node.js-only modules (with require shim for ESM)
    {
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
            mobile: 'src/mobile.ts'
        },
        format: ['cjs', 'esm'],
        dts: true,
        clean: false,
        minify: false,
        splitting: false,
        treeshake: false,
        sourcemap: true,
        target: 'es2020',
        external: ['http', 'https', 'net', 'tls', 'crypto', 'stream', 'util', 'events', 'buffer', 'querystring', 'url', 'path', 'fs', 'os', 'child_process', 'worker_threads', 'zlib', 'assert', 'dns', 'dgram', 'readline', 'repl', 'tty', 'v8', 'vm', 'perf_hooks', 'async_hooks', 'timers', 'string_decoder', 'process', 'module', 'cluster', 'constants', 'domain', 'punycode', 'bun', 'monocart-coverage-reports', 'esbuild', 'source-map', '@capacitor/cli', '@capacitor/core', '@capacitor/android', '@capacitor/ios'],
        outExtension({ format }) {
            return {
                js: format === 'cjs' ? '.js' : '.mjs',
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
    },
    // CLI bundle (CJS only for Node.js)
    {
        entry: {
            cli: 'src/cli.ts'
        },
        format: ['cjs'],
        dts: true,
        clean: false,
        splitting: false,
        external: ['bun', 'esbuild', 'source-map', 'v8'],
        target: 'es2020',
        outExtension() {
            return {
                js: '.js',
                dts: '.d.ts'
            };
        }
    }
]);
