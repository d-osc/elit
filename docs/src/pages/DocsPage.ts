import {
  div, h2, h3, h4, p, a, nav, section, ul, li, pre, code, reactive
} from 'elit';
import { codeBlock } from '../highlight';
import { currentLang } from '../i18n';

const codeExample = (src: string) => pre(code(...codeBlock(src)));

const scrollLink = (id: string, label: string) =>
  a({
    href: 'javascript:void(0)',
    onclick: () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }, label);

const moduleMap = [
  {
    importPath: 'elit',
    use: {
      en: 'Client-side all-in-one entry',
      th: 'entry ฝั่ง client แบบ all-in-one'
    },
    exports: 'DOM helpers, element factories, state, styles, router, HMR'
  },
  {
    importPath: 'elit/dom',
    use: {
      en: 'DOM renderer and SSR string rendering',
      th: 'ตัว render DOM และ SSR string'
    },
    exports: 'dom, render, renderToString, mount'
  },
  {
    importPath: 'elit/el',
    use: {
      en: 'HTML, SVG, and MathML factories',
      th: 'factory สำหรับ HTML, SVG และ MathML'
    },
    exports: 'div, button, html, body, script, and many more'
  },
  {
    importPath: 'elit/state',
    use: {
      en: 'Reactive state and render helpers',
      th: 'state reactive และ helper สำหรับ render'
    },
    exports: 'createState, computed, reactive, text, bindValue, bindChecked, createSharedState'
  },
  {
    importPath: 'elit/style',
    use: {
      en: 'CSS generation and injection',
      th: 'สร้างและ inject CSS'
    },
    exports: 'CreateStyle, styles, renderStyle, injectStyle, addClass, addTag'
  },
  {
    importPath: 'elit/router',
    use: {
      en: 'Client-side routing',
      th: 'routing ฝั่ง client'
    },
    exports: 'createRouter, createRouterView, routerLink'
  },
  {
    importPath: 'elit/server',
    use: {
      en: 'HTTP router, dev server, middleware, and shared server state',
      th: 'HTTP router, dev server, middleware และ shared state ฝั่ง server'
    },
    exports: 'ServerRouter, createDevServer, cors, logger, rateLimit, compress, security, StateManager'
  },
  {
    importPath: 'elit/build',
    use: {
      en: 'Programmatic build API',
      th: 'API สำหรับ build แบบ programmatic'
    },
    exports: 'build'
  },
  {
    importPath: 'elit/desktop',
    use: {
      en: 'Native desktop window APIs',
      th: 'API สำหรับ native desktop window'
    },
    exports: 'createWindow, createWindowServer, onMessage, windowQuit, windowSetTitle, windowEval'
  },
  {
    importPath: 'elit/database',
    use: {
      en: 'VM-backed file database helpers',
      th: 'helper สำหรับฐานข้อมูลแบบไฟล์ที่รันผ่าน VM'
    },
    exports: 'Database, create, read, save, update, rename, remove'
  },
  {
    importPath: 'elit/test',
    use: {
      en: 'Test runner module entry',
      th: 'entry ของ test runner'
    },
    exports: 'test runtime helpers used by the CLI'
  }
];

const installExample = `npm create elit@latest my-app
cd my-app
npm install
npm run dev`;

const browserAppTs = `import { div, h1, button } from 'elit/el';
import { createState, reactive } from 'elit/state';
import { render } from 'elit/dom';

const count = createState(0);

const app = div(
  { className: 'app' },
  h1('Hello Elit'),
  reactive(count, (value) =>
    button({ onclick: () => count.value++ }, \`Count: \${value}\`)
  )
);

render('app', app);`;

const browserAppHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Elit App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`;

const cliCommands = `npx elit dev
npx elit build --entry ./src/main.ts --out-dir dist
npx elit preview
npx elit test
npx elit desktop ./src/main.ts
npx elit desktop build ./src/main.ts --release
npx elit mobile init
npx elit mobile run android
npx elit native generate android ./src/native-screen.ts --name HomeScreen
npx elit wapk pack .
npx elit wapk run ./app.wapk
npx elit desktop wapk run ./app.wapk --runtime bun`;

const mobileCommands = `npx elit mobile init
npx elit mobile doctor --cwd .
npx elit mobile sync --cwd . --web-dir dist
npx elit mobile run android --cwd .
npx elit native generate android ./src/native-screen.ts --name HomeScreen --package com.example.app`;

const wapkCommands = `npx elit wapk pack .
npx elit wapk pack . --include-deps
npx elit wapk inspect ./app.wapk
npx elit wapk extract ./app.wapk
npx elit wapk ./app.wapk
npx elit wapk run ./app.wapk
npx elit wapk run ./app.wapk --runtime node|bun|deno
npx elit wapk run ./app.wapk --sync-interval 100
npx elit wapk run ./app.wapk --watcher
npx elit desktop wapk run ./app.wapk --runtime bun`;

const desktopEntry = `import { createWindow, onMessage, windowQuit, windowSetTitle } from 'elit/desktop';

onMessage((message) => {
  if (message === 'desktop:ready') {
    windowSetTitle('Elit Desktop');
    windowQuit();
  }
});

createWindow({
  title: 'Elit Desktop',
  width: 960,
  height: 640,
  icon: './public/favicon.svg',
  html: \`<!doctype html>
<html lang="en">
  <body>
    <main>Hello from Elit Desktop</main>
    <script>
      window.addEventListener('DOMContentLoaded', () => {
        window.ipc.postMessage('desktop:ready');
      });
    </script>
  </body>
</html>\`,
});`;

const configShape = `{
  dev?: DevServerOptions;
  build?: BuildOptions | BuildOptions[];
  preview?: PreviewOptions;
  test?: TestOptions;
  mobile?: {
    cwd?: string;
    appId?: string;
    appName?: string;
    webDir?: string;
    mode?: 'native' | 'hybrid';
    icon?: string;
    permissions?: string[];
    android?: {
      target?: string;
    };
    ios?: {
      target?: string;
    };
    native?: {
      entry?: string;
      exportName?: string;
      android?: {
        packageName?: string;
        functionName?: string;
      };
      ios?: {
        enabled?: boolean;
        output?: string;
        structName?: string;
      };
    };
  };
  desktop?: {
    entry?: string;
    runtime?: 'quickjs' | 'node' | 'bun' | 'deno';
    compiler?: 'auto' | 'none' | 'esbuild' | 'tsx' | 'tsup';
    release?: boolean;
    outDir?: string;
    platform?: 'windows' | 'linux' | 'macos';
    wapk?: {
      runtime?: 'node' | 'bun' | 'deno';
      syncInterval?: number;
      useWatcher?: boolean;
      release?: boolean;
    };
  };
  wapk?: {
    name?: string;
    version?: string;
    runtime?: 'node' | 'bun' | 'deno';
    entry?: string;
    scripts?: Record<string, string>;
    port?: number;
    env?: Record<string, string | number | boolean>;
    desktop?: Record<string, unknown>;
  };
}`;

const configExample = `import { api } from './src/server';
import { documentShell } from './src/document';

export default {
  dev: {
    port: 3003,
    host: '0.0.0.0',
    open: false,
    logging: true,
    clients: [
      {
        root: '.',
        basePath: '',
        ssr: () => documentShell,
        api,
      },
    ],
  },
  build: [
    {
      entry: './src/main.ts',
      outDir: './dist',
      outFile: 'main.js',
      format: 'esm',
      sourcemap: true,
      copy: [
        { from: './public/index.html', to: './index.html' },
      ],
    },
  ],
  preview: {
    root: './dist',
    index: './index.html',
    port: 4173,
  },
  test: {
    include: ['testing/unit/**/*.test.ts'],
  },
  mobile: {
    cwd: '.',
    appId: 'com.elit.app',
    appName: 'Elit App',
    webDir: 'dist',
    mode: 'native',
    icon: './icon.png',
    permissions: ['android.permission.INTERNET'],
    native: {
      entry: './src/main.ts',
      ios: {
        enabled: false,
      },
    },
  },
  desktop: {
    entry: './src/main.ts',
    runtime: 'quickjs',
    compiler: 'auto',
    release: false,
    outDir: 'dist',
    platform: 'windows',
  },
  wapk: {
    name: '@acme/sample-app',
    version: '1.0.0',
    runtime: 'bun',
    entry: 'src/server.ts',
    port: 3000,
    env: {
      NODE_ENV: 'production',
    },
  },
};`;

const serverRouterExample = `import { ServerRouter, cors, logger } from 'elit/server';

export const api = new ServerRouter();

api.use(cors());
api.use(logger());

api.get('/api/hello', async (ctx) => {
  ctx.res.json({ message: 'Hello from Elit' });
});

api.post('/api/echo', async (ctx) => {
  ctx.res.json({ body: ctx.body });
});`;

const devServerExample = `import { createDevServer } from 'elit/server';

const server = createDevServer({
  port: 3000,
  root: '.',
  open: false,
  logging: true,
});

console.log(server.url);

await server.close();`;

const styleExample = `import { CreateStyle } from 'elit/style';

const css = new CreateStyle();

css.addClass('app', {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  fontFamily: 'system-ui, sans-serif',
});

css.addClass('button', {
  padding: '12px 18px',
  borderRadius: '12px',
  border: '1px solid #222',
  background: '#111',
  color: '#fff',
  cursor: 'pointer',
});

css.addPseudoClass('hover', {
  opacity: 0.92,
}, '.button');

css.inject('app-styles');`;

const routerExample = `import { div, nav } from 'elit/el';
import { reactive } from 'elit/state';
import { createRouter, createRouterView, routerLink } from 'elit/router';

const routerOptions = {
  mode: 'history' as const,
  routes: [
    { path: '/', component: () => div('Home') },
    { path: '/about', component: () => div('About') },
    { path: '/post/:id', component: (params: Record<string, string>) => div(\`Post \${params.id}\`) },
  ],
  notFound: () => div('404'),
};

const router = createRouter(routerOptions);
const RouterView = createRouterView(router, routerOptions);

const app = div(
  nav(
    routerLink(router, { to: '/' }, 'Home'),
    routerLink(router, { to: '/about' }, 'About')
  ),
  reactive(router.currentRoute, () => RouterView())
);`;

const testExample = `npx elit test
npx elit test --watch
npx elit test --file ./testing/unit/database.test.ts
npx elit test --describe "Database"
npx elit test --it "should save data"
npx elit test --coverage --coverage-reporter text,html`;

const deployExample = `npx elit build --entry ./src/main.ts --out-dir dist
npx elit preview --root dist`;

const Docs = () =>
  section({ className: 'docs-section container' },
    reactive(currentLang, () => {
      const isTh = currentLang.value === 'th';
      const text = (en: string, th: string) => isTh ? th : en;

      return div(
        h2({ className: 'section-title' }, text('Documentation', 'เอกสาร')),
        div({ className: 'docs-grid' },
          nav({ className: 'docs-sidebar' },
            div({ className: 'docs-nav' },
              scrollLink('installation', text('Installation', 'การติดตั้ง')),
              scrollLink('module-map', text('Module Map', 'แผนที่โมดูล')),
              scrollLink('browser-app', text('Browser App', 'แอปเบราว์เซอร์')),
              scrollLink('cli', 'CLI'),
              scrollLink('desktop', text('Desktop Mode', 'Desktop Mode')),
              scrollLink('mobile', text('Mobile & Native', 'Mobile และ Native')),
              scrollLink('wapk', 'WAPK'),
              scrollLink('config', text('Config File', 'Config File')),
              scrollLink('server', text('Server Patterns', 'รูปแบบฝั่ง Server')),
              scrollLink('styling', text('Styling', 'Styling')),
              scrollLink('routing', text('Routing', 'Routing')),
              scrollLink('testing', text('Testing', 'Testing')),
              scrollLink('deployment', text('Build & Preview', 'Build และ Preview'))
            )
          ),
          div({ className: 'docs-content' },
            h2({ id: 'installation' }, text('Installation', 'การติดตั้ง')),
            p(text(
              'Use create-elit when you want a working project quickly. Install Cargo only if you need desktop mode.',
              'ใช้ create-elit เมื่ออยากได้โปรเจ็กต์ที่พร้อมรันทันที และติดตั้ง Cargo เพิ่มเมื่อจะใช้ desktop mode เท่านั้น.'
            )),
            h3(text('Quick Start with create-elit', 'เริ่มต้นเร็วด้วย create-elit')),
            codeExample(installExample),
            h3(text('Manual Install', 'ติดตั้งเอง')),
            codeExample('npm install elit'),
            ul(
              li(text('Supported scaffold command:', 'คำสั่ง scaffold ที่แนะนำ: '), code('npm create elit@latest my-app')),
              li(text('Desktop mode builds a native WebView runtime with Rust.', 'Desktop mode จะ build native WebView runtime ด้วย Rust.')),
              li(text('Use subpath imports in generated code when possible.', 'ในโค้ดที่สร้างใหม่ควรใช้ subpath imports เมื่อทำได้.'))
            ),

            h2({ id: 'module-map' }, text('Module Map', 'แผนที่โมดูล')),
            p(text(
              'This is the import map the current package exposes. Prefer these boundaries instead of importing everything from one place.',
              'นี่คือ import map ที่แพ็กเกจปัจจุบัน export ออกมา ควรยึด boundary นี้แทนการ import ทุกอย่างจากจุดเดียว.'
            )),
            ul(
              ...moduleMap.map((entry) =>
                li(
                  code(entry.importPath),
                  ' - ',
                  text(entry.use.en, entry.use.th),
                  div({ style: 'opacity: 0.8; margin-top: 0.35rem;' },
                    text('Main exports: ', 'Exports หลัก: '),
                    code(entry.exports)
                  )
                )
              )
            ),
            p(text(
              'Advanced subpaths also exist for lower-level adapters and internals: elit/http, elit/https, elit/ws, elit/wss, elit/fs, elit/path, elit/mime-types, elit/chokidar, elit/runtime, elit/test-runtime, elit/test-reporter, and elit/types.',
              'ยังมี advanced subpaths สำหรับ adapter ระดับล่างและ internals เช่น elit/http, elit/https, elit/ws, elit/wss, elit/fs, elit/path, elit/mime-types, elit/chokidar, elit/runtime, elit/test-runtime, elit/test-reporter และ elit/types.'
            )),

            h2({ id: 'browser-app' }, text('Fastest Working Browser App', 'แอปเบราว์เซอร์ที่เล็กและรันได้ทันที')),
            p(text(
              'This is the smallest browser app that matches the current CLI and package exports.',
              'นี่คือตัวอย่าง browser app ที่เล็กที่สุดและตรงกับ CLI กับ exports ปัจจุบัน.'
            )),
            h3('src/main.ts'),
            codeExample(browserAppTs),
            h3('index.html'),
            codeExample(browserAppHtml),
            h4(text('Run it', 'วิธีรัน')),
            codeExample('npx elit dev'),
            ul(
              li(text('render(\'app\', app) and render(\'#app\', app) both work.', 'render(\'app\', app) และ render(\'#app\', app) ใช้ได้ทั้งคู่.')),
              li(text('During development the browser can load /src/main.ts directly.', 'ระหว่างพัฒนา browser สามารถโหลด /src/main.ts ตรงได้.')),
              li(text('When you copy HTML into dist, point it at the built JS path such as /main.js.', 'เมื่อ copy HTML ไปที่ dist ต้องชี้ script ไปยังไฟล์ build เช่น /main.js.'))
            ),

            h2({ id: 'cli' }, 'CLI'),
            p(text(
              'These are the main commands that match the current CLI implementation.',
              'นี่คือคำสั่งหลักที่ตรงกับ CLI implementation ปัจจุบัน.'
            )),
            codeExample(cliCommands),
            h3(text('Useful Flags', 'Flags ที่ใช้บ่อย')),
            ul(
              li(code('elit dev --port 3000 --host 0.0.0.0 --no-open')),
              li(code('elit build --entry ./src/main.ts --out-dir dist --format esm --sourcemap')),
              li(code('elit preview --root dist --base-path /app')),
              li(code('elit test --watch')),
              li(code('elit test --file ./testing/unit/database.test.ts')),
              li(code('elit test --coverage --coverage-reporter text,html')),
              li(code('elit desktop --runtime quickjs|node|bun|deno')),
              li(code('elit desktop build --platform windows|linux|macos --out-dir dist')),
              li(code('elit desktop build --compiler auto|none|esbuild|tsx|tsup')),
              li(code('elit mobile init --app-id com.example.app --app-name "Example App" --web-dir dist --icon ./icon.png --permission android.permission.CAMERA')),
              li(code('elit mobile doctor --cwd . --json')),
              li(code('elit mobile sync --cwd . --web-dir dist --icon ./icon.png --permission android.permission.CAMERA')),
              li(code('elit mobile run android|ios --cwd . --target <device-id> --prod --icon ./icon.png --permission android.permission.CAMERA')),
              li(code('elit native generate android ./src/native-screen.ts --name HomeScreen --package com.example.app')),
              li(code('elit native generate ios ./src/native-screen.ts --out ./ios/HomeScreen.swift --no-preview')),
              li(code('elit wapk pack [directory] --include-deps')),
              li(code('elit wapk run <file.wapk> --runtime node|bun|deno')),
              li(code('elit wapk run <file.wapk> --sync-interval 100 --watcher'))
            ),

            h2({ id: 'desktop' }, text('Desktop Mode', 'Desktop Mode')),
            p(text(
              'Desktop mode runs an Elit entry inside a native WebView shell and exposes the desktop APIs from elit/desktop. The entry can either call createWindow(...) directly or finish with a normal render(...) call from a shared UI entry.',
              'Desktop mode จะรัน entry ของ Elit ภายใน native WebView shell และเปิดใช้ API จาก elit/desktop โดย entry จะเรียก createWindow(...) เองก็ได้ หรือจะจบด้วย render(...) จาก shared UI entry ก็ได้.'
            )),
            codeExample(desktopEntry),
            h4(text('Run and Build', 'สั่งรันและ build')),
            codeExample(`npx elit desktop ./src/main.ts
npx elit desktop build ./src/main.ts --release`),
            ul(
              li(text('Runtime choices: quickjs, node, bun, deno.', 'runtime ที่เลือกได้: quickjs, node, bun, deno.')),
              li(text('Compiler choices: auto, none, esbuild, tsx, tsup.', 'compiler ที่เลือกได้: auto, none, esbuild, tsx, tsup.')),
              li(text('Set desktop.entry in elit.config.* when you want elit desktop and elit desktop build to run without repeating the entry path.', 'ตั้ง desktop.entry ใน elit.config.* เมื่อต้องการให้ elit desktop และ elit desktop build ทำงานได้โดยไม่ต้องใส่ path entry ซ้ำทุกครั้ง.')),
              li(text('When a shared entry only calls render(...), desktop mode captures the rendered VNode and auto-opens a native window from it.', 'ถ้า shared entry เรียกเพียง render(...), desktop mode จะ capture VNode ที่ render แล้วเปิด native window ให้อัตโนมัติจากผลลัพธ์นั้น.')),
              li(text('tsx is a Node loader mode, not a relocatable bundle mode.', 'tsx เป็น Node loader mode ไม่ใช่ bundle mode ที่ย้ายไฟล์ไปที่อื่นได้ง่าย.')),
              li(text('Desktop icon input supports .ico, .png, and .svg.', 'desktop icon รองรับ .ico, .png และ .svg.')),
              li(text('Icon auto-detect checks icon.* and favicon.* in the entry dir, project dir, and sibling public/ folders.', 'ระบบ auto-detect จะหา icon.* และ favicon.* จากโฟลเดอร์ entry, project root และ public/ ที่อยู่ข้างกัน.')),
              li(text('Use createWindowServer(app, opts) when you want to run an HTTP app inside the desktop shell.', 'ใช้ createWindowServer(app, opts) เมื่อต้องการรัน HTTP app ภายใน desktop shell.'))
            ),

            h2({ id: 'mobile' }, text('Mobile & Native', 'Mobile และ Native')),
            p(text(
              'Elit can scaffold native mobile projects and can also generate Android Compose, SwiftUI, or IR from the same Elit UI entry.',
              'Elit สามารถ scaffold โปรเจ็กต์ mobile native และยัง generate Android Compose, SwiftUI หรือ IR จาก Elit UI entry ตัวเดียวกันได้.'
            )),
            codeExample(mobileCommands),
            ul(
              li(text('Set mobile defaults in elit.config.* under mobile for cwd, appId, appName, webDir, mode, icon, and permissions.', 'ตั้งค่า default ของ mobile ใน elit.config.* ใต้ mobile สำหรับ cwd, appId, appName, webDir, mode, icon และ permissions.')),
              li(text('Set mobile.native.entry when sync, run, or build should also generate native UI files from the same entry module.', 'ตั้ง mobile.native.entry เมื่อต้องการให้ sync, run หรือ build generate ไฟล์ native UI จาก entry module เดียวกันด้วย.')),
              li(text('A native entry can export a VNode, export a zero-argument function, or call render(...) so the CLI captures the rendered tree from a shared entry.', 'native entry จะ export VNode, export ฟังก์ชันไม่มีอาร์กิวเมนต์ หรือเรียก render(...) เพื่อให้ CLI capture rendered tree จาก shared entry ก็ได้.')),
              li(text('Use examples/android-native-example for an Android-first flow, or examples/universal-app-example when you want one repo exercising web, desktop, and Android together.', 'ใช้ examples/android-native-example เมื่อต้องการ flow แบบ Android-first หรือใช้ examples/universal-app-example เมื่อต้องการ repo เดียวที่ทดสอบ web, desktop และ Android ร่วมกัน.'))
            ),

            h2({ id: 'wapk' }, 'WAPK'),
            p(text(
              'WAPK packages an app directory into one archive file and supports live sync back to the same archive while running.',
              'WAPK ใช้แพ็กแอปเป็นไฟล์ archive เดียว และรองรับ live sync กลับเข้า archive เดิมระหว่างรัน.'
            )),
            codeExample(wapkCommands),
            ul(
              li(text('Use pack to create archives and include-deps when node_modules is required at runtime.', 'ใช้ pack เพื่อสร้าง archive และใช้ include-deps เมื่อต้องมี node_modules ตอนรัน.')),
              li(text('Use inspect and extract for debugging archive content and metadata.', 'ใช้ inspect และ extract เพื่อดูโครงสร้างไฟล์และ metadata ใน archive.')),
              li(text('Run mode supports runtime override (node, bun, deno) and sync tuning via sync-interval.', 'โหมด run รองรับ runtime override (node, bun, deno) และปรับการ sync ผ่าน sync-interval.')),
              li(text('Use watcher mode for event-driven sync when files change frequently.', 'ใช้ watcher mode เพื่อ sync แบบ event-driven เมื่อไฟล์เปลี่ยนบ่อย.'))
            ),

            h2({ id: 'config' }, text('Config File', 'Config File')),
            p(text(
              'Elit loads one of these files from the project root: elit.config.ts, elit.config.mts, elit.config.js, elit.config.mjs, elit.config.cjs, or elit.config.json.',
              'Elit จะโหลดไฟล์ใดไฟล์หนึ่งจาก project root: elit.config.ts, elit.config.mts, elit.config.js, elit.config.mjs, elit.config.cjs หรือ elit.config.json.'
            )),
            h3(text('Config Shape', 'โครงสร้าง config')),
            codeExample(configShape),
            h3(text('Example', 'ตัวอย่าง')),
            codeExample(configExample),
            ul(
              li(text('build can be a single object or an array. Arrays run sequentially.', 'build อาจเป็น object เดียวหรือ array ก็ได้ และถ้าเป็น array จะรันทีละตัวตามลำดับ.')),
              li(text('Only VITE_ variables are injected into client bundles.', 'มีเพียงตัวแปรที่ขึ้นต้นด้วย VITE_ เท่านั้นที่ถูก inject เข้า client bundle.')),
              li(text('Environment files load in this order: .env.{mode}.local, .env.{mode}, .env.local, .env.', 'ไฟล์ env จะถูกโหลดตามลำดับ: .env.{mode}.local, .env.{mode}, .env.local, .env.')),
              li(text('Use dev.clients when you need SSR, API routes, or multiple apps on one server.', 'ใช้ dev.clients เมื่อต้องการ SSR, API routes หรือหลายแอปบน server เดียว.')),
              li(text('desktop config provides defaults for elit desktop, elit desktop build, and elit desktop wapk. Set desktop.entry when you want to omit the positional desktop entry path.', 'desktop config ให้ค่า default กับ elit desktop, elit desktop build และ elit desktop wapk โดยตั้ง desktop.entry ได้เมื่อต้องการละ path ของ desktop entry ออกจากคำสั่ง.')),
              li(text('mobile config provides defaults for elit mobile init, sync, open, run, and build.', 'mobile config ให้ค่า default กับ elit mobile init, sync, open, run และ build.')),
              li(text('Configure WAPK packaging in config.wapk instead of a legacy wapk.config.json file.', 'ตั้งค่า WAPK ที่ config.wapk แทนไฟล์ legacy wapk.config.json.'))
            ),

            h2({ id: 'server' }, text('Server Patterns', 'รูปแบบฝั่ง Server')),
            p(text(
              'Server features live on elit/server. Do not use the old elit-server package name.',
              'ฟีเจอร์ฝั่ง server อยู่บน elit/server และไม่ควรใช้ชื่อเก่า elit-server แล้ว.'
            )),
            h3('ServerRouter'),
            codeExample(serverRouterExample),
            h3(text('Programmatic Dev Server', 'Programmatic Dev Server')),
            codeExample(devServerExample),
            ul(
              li(text('ServerRouter accepts both ctx-style handlers and Express-style req/res handlers.', 'ServerRouter รองรับทั้ง handler แบบ ctx และแบบ Express-style req/res.')),
              li(text('createSharedState on the client pairs with server.state.create(...) on the server.', 'createSharedState ฝั่ง client ใช้งานคู่กับ server.state.create(...) ฝั่ง server.'))
            ),

            h2({ id: 'styling' }, text('Styling', 'Styling')),
            p(text(
              'Use CreateStyle when you want generated CSS with explicit injection.',
              'ใช้ CreateStyle เมื่อต้องการสร้าง CSS แบบ programmatic และ inject เองอย่างชัดเจน.'
            )),
            codeExample(styleExample),
            p(text(
              'The package also exports a shared singleton as the default export of elit/style.',
              'แพ็กเกจยัง export shared singleton เป็น default export ของ elit/style ด้วย.'
            )),

            h2({ id: 'routing' }, text('Routing', 'Routing')),
            p(text(
              'createRouterView(router, options) returns a function. Render it inside a reactive block tied to router.currentRoute.',
              'createRouterView(router, options) จะคืนค่าเป็นฟังก์ชัน และควร render ภายใน reactive block ที่อิงกับ router.currentRoute.'
            )),
            codeExample(routerExample),

            h2({ id: 'testing' }, text('Testing', 'Testing')),
            p(text(
              'Most users should stay on the CLI test runner. The lower-level test modules are available only for advanced integrations.',
              'ผู้ใช้ส่วนใหญ่ควรใช้ test runner ผ่าน CLI ส่วน test modules ระดับล่างเหมาะกับ integration ขั้นสูงเท่านั้น.'
            )),
            codeExample(testExample),
            ul(
              li(text('Advanced subpaths: elit/test, elit/test-runtime, elit/test-reporter.', 'subpaths ขั้นสูง: elit/test, elit/test-runtime, elit/test-reporter.')),
              li(text('The repository itself keeps tests under testing/.', 'ตัว repo นี้เก็บ tests ไว้ใต้โฟลเดอร์ testing/.'))
            ),

            h2({ id: 'deployment' }, text('Build & Preview', 'Build และ Preview')),
            p(text(
              'A minimal production workflow is build first, then preview the generated output.',
              'workflow แบบ production ที่ง่ายที่สุดคือ build ก่อน แล้วค่อย preview output ที่ได้.'
            )),
            codeExample(deployExample),
            ul(
              li(text('If you copy index.html during build, update the script path to the built asset such as /main.js.', 'ถ้ามีการ copy index.html ระหว่าง build ต้องแก้ script path ให้ชี้ไปยังไฟล์ build เช่น /main.js.')),
              li(text('Use preview when you want to verify the same output directory you plan to deploy.', 'ใช้ preview เมื่อต้องการตรวจ output directory เดียวกับที่เตรียม deploy.')),
              li(text('For deeper API detail, continue to the API page and examples section.', 'ถ้าต้องการรายละเอียด API เพิ่ม ให้ดูต่อที่หน้า API และ examples.'))
            )
          )
        )
      );
    })
  );

export const DocsPage = () =>
  section({ style: 'padding-top: 5rem;' },
    Docs()
  );
