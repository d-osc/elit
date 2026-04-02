import { defineConfig } from '../../src/config';

export default defineConfig({
    build: [{
        entry: './src/web-main.ts',
        outDir: './dist',
        outFile: 'main.js',
        format: 'esm',
        minify: false,
        sourcemap: true,
        target: 'es2020',
        copy: [
            {
                from: './public/index.html',
                to: './index.html',
                transform: (content) => content
                    .replace('/examples/universal-app-example/src/web-main.ts', './main.js')
                    .replace('/examples/universal-app-example/public/favicon.svg', './favicon.svg'),
            },
            {
                from: './public/favicon.svg',
                to: './favicon.svg',
            },
        ],
    }],
    desktop: {
        compiler: 'auto',
        outDir: './desktop-dist',
        runtime: 'quickjs',
    },
    dev: {
        port: 3070,
        host: 'localhost',
        open: false,
        logging: true,
        root: '../..',
        basePath: '',
        index: './examples/universal-app-example/public/index.html',
    },
    mobile: {
        cwd: '.',
        appId: 'com.elit.universalexample',
        appName: 'ElitUniversalExample',
        webDir: 'dist',
        mode: 'native',
        permissions: [
            'android.permission.INTERNET',
            'android.permission.ACCESS_NETWORK_STATE',
        ],
        native: {
            entry: './src/native-screen.ts',
            exportName: 'screen',
            ios: {
                enabled: false,
            },
        },
    },
    preview: {
        port: 4170,
        host: 'localhost',
        open: false,
        logging: true,
        root: './dist',
        basePath: '',
        index: './index.html',
    },
});
