# Elit

Elit is a TypeScript toolkit for building browser UIs, dev servers, SSR pages, tests, desktop WebView apps, and small file-backed backends from one package.

The package is split by runtime. Browser-facing APIs live in `elit` and the client subpaths, server APIs live in `elit/server`, desktop APIs live in `elit/desktop`, and the CLI is `elit`.

## AI Quick Context

If you are generating or editing code for Elit, follow these rules first:

- Use `elit` or the client subpaths for browser UI code.
- Use `elit/server` for HTTP routes, WebSocket endpoints, middleware, dev server, preview server, and server-side shared state.
- Use `elit/desktop` only inside `elit desktop ...` runtime. Those APIs are injected by the native desktop runtime and are not normal browser globals.
- Use `elit/build` for programmatic bundling.
- Use `elit/database` for the VM-backed file database helpers.
- Do not use `elit-server`. Old docs may mention it, but the current package export is `elit/server`.
- Prefer subpath imports in generated code. They make environment boundaries obvious.
- `createRouterView(router, options)` returns a function. Render it inside `reactive(router.currentRoute, () => RouterView())`.
- Browser-facing code may import local `.ts` files during development. Elit rewrites those imports for browser output.
- Config files can be `elit.config.ts`, `elit.config.mts`, `elit.config.js`, `elit.config.mjs`, `elit.config.cjs`, or `elit.config.json`.
- Environment files are loaded in this order: `.env.{mode}.local`, `.env.{mode}`, `.env.local`, `.env`.
- Only `VITE_` variables are injected into client bundles.

## Install

Create a new app with the scaffold:

```bash
npm create elit@latest my-app
cd my-app
npm install
npm run dev
```

Other package managers:

```bash
yarn create elit my-app
pnpm create elit my-app
bun create elit my-app
deno run -A npm:create-elit my-app
```

Manual install:

```bash
npm install elit
```

If you want desktop mode, install Cargo as well. The native desktop runtime is built with Rust.

## Module Map

Use this table as the import map for generated code.

| Import | Use it for | Main exports |
| --- | --- | --- |
| `elit` | Client-side all-in-one entry | DOM helpers, element factories, state, styles, router, HMR |
| `elit/dom` | DOM renderer and SSR string rendering | `dom`, `render`, `renderToString`, `mount` |
| `elit/el` | HTML, SVG, and MathML element factories | `div`, `button`, `html`, `body`, `script`, and many more |
| `elit/native` | Shared native generation foundation using the same Elit syntax | `renderNativeTree`, `renderNativeJson`, `renderAndroidCompose`, `renderSwiftUI` |
| `elit/state` | Reactive state and render helpers | `createState`, `computed`, `reactive`, `text`, `bindValue`, `bindChecked`, `createSharedState` |
| `elit/style` | CSS generation and injection | `CreateStyle`, `styles`, `renderStyle`, `injectStyle`, `addClass`, `addTag` |
| `elit/router` | Client-side routing | `createRouter`, `createRouterView`, `routerLink` |
| `elit/server` | HTTP router, dev server, middleware, WebSocket endpoints, shared server state | `ServerRouter`, `createDevServer`, `cors`, `logger`, `rateLimit`, `compress`, `security`, `StateManager` |
| `elit/build` | Programmatic build API | `build` |
| `elit/desktop` | Native desktop window APIs | `createWindow`, `createWindowServer`, `onMessage`, `windowQuit`, `windowSetTitle`, `windowEval` |
| `elit/database` | VM-backed file database | `Database`, `create`, `read`, `save`, `update`, `rename`, `remove` |
| `elit/test` | Test runner module entry | test runtime helpers used by the CLI |

Advanced subpaths also exist for lower-level adapters and internals: `elit/http`, `elit/https`, `elit/ws`, `elit/wss`, `elit/fs`, `elit/path`, `elit/mime-types`, `elit/chokidar`, `elit/runtime`, `elit/test-runtime`, `elit/test-reporter`, and `elit/types`.

## Native Target Foundation

Elit now includes a practical native-generation foundation that keeps the existing element syntax and can emit a serializable native tree, Jetpack Compose, and SwiftUI from the same source tree. It is still a CSS-subset renderer rather than a browser-complete Android/iOS engine, but it is already useful for shared mobile UI scaffolds, parity checks, and generated native screens.

That same foundation also feeds native desktop mode: Elit resolves one shared native tree and style/layout model, then emits IR, Compose, SwiftUI, or native desktop output from it. Public `elit/native` APIs stay the same while parity fixes and native CSS-subset improvements can land across outputs together.

On the desktop-native backend, renderer responsibilities are now split internally by concern too: widget rendering, content and media surfaces, form controls, container layout, vector drawing, interaction dispatch, runtime support, and app orchestration no longer live in one monolithic renderer file. That does not change the public API, but it makes parity fixes for buttons, inputs, media surfaces, layout, and vector output safer to land across desktop native, IR, Compose, and SwiftUI outputs without forking the shared native tree contract.

```ts
import { a, button, div, h1, img, input } from 'elit/el';
import { renderNativeTree } from 'elit/native';

const screen = div(
  { className: 'screen' },
  h1('Hello Native'),
  input({ value: 'search', placeholder: 'Search' }),
  input({ type: 'checkbox', checked: true }),
  a({ href: 'https://elit.dev/docs' }, 'Open docs'),
  button({ onClick: () => {} }, 'Tap'),
  img({ src: './logo.png', alt: 'Logo' })
);

const nativeTree = renderNativeTree(screen, { platform: 'android' });
```

You can also emit Jetpack Compose code from the same syntax:

```ts
import { renderAndroidCompose } from 'elit/native';

const composeFile = renderAndroidCompose(screen, {
  packageName: 'com.example.generated',
  functionName: 'HomeScreen',
  includePreview: true,
});
```

And the same source tree can emit SwiftUI code too:

```ts
import { renderSwiftUI } from 'elit/native';

const swiftFile = renderSwiftUI(screen, {
  structName: 'HomeScreen',
  includePreview: true,
});
```

You can generate these files directly from the CLI too:

```bash
npx elit native generate android ./src/native-screen.ts --name HomeScreen --package com.example.app
npx elit native generate ios ./src/native-screen.ts --out ./ios/HomeScreen.swift
npx elit native generate ir ./src/native-screen.ts --platform android --export screen
```

The entry module can either export a VNode tree, export a zero-argument function that returns one, or call `render(...)` so the CLI can capture the rendered VNode from a shared entry. By default the CLI auto-detects `default`, `screen`, `app`, `view`, and `root` exports before falling back to that captured render path.

For the current native CSS subset, supported style mapping, and parity backlog, see [docs/native-css-support.md](docs/native-css-support.md). For element and factory coverage across `elit/el`, see [docs/native-element-support.md](docs/native-element-support.md).

Current scope:

- Reuses existing Elit element syntax and VNode output.
- Maps common tags into generic native components such as `View`, `Text`, `Button`, `Image`, and `TextInput`.
- Maps checkbox inputs into native toggle controls and turns absolute `href` links into native URL-opening or download actions.
- Maps a practical control-attribute subset too: disabled button/input/select states, read-only text inputs, initial text-input focus, native keyboard or secure-entry handling for common text input types such as `password`, `email`, `number`, `tel`, and `url`, practical text-input constraint validation (`min` / `max` / `step` / `minLength` / `maxLength` / `pattern`), link target/rel/download hints, required single-select empty placeholders, and both static and bound-array native `select[multiple]` checklist flows.
- Produces serializable IR suitable for future Android/iOS code generators.
- Can generate Jetpack Compose code for a practical subset of shared mobile UI.
- Can generate SwiftUI code for the same practical subset.
- Can render a practical SVG vector subset in native output, including `circle`, `rect`, `path`, `line`, `polyline`, `polygon`, and `ellipse` under supported `svg` roots.
- Can parse practical SVG path data beyond straight segments, including `C`, `Q`, `S`, `T`, and `A` commands, and approximate them into native curve output.
- Can render first-pass native WebView and audio/video surfaces when `iframe`/`object`/`embed`/`portal` or `audio`/`video` nodes provide a usable source, including practical accessibility labels, media `muted` handling, and a platform-approximated `controls` / `poster` / `playsinline` video subset, while source-less or unsupported cases stay explicit placeholders.
- Can map a practical accessibility subset too: explicit `role`, `aria-label`, `aria-description`, and selected/checked/disabled/required/expanded/value-text states now feed generated Compose and SwiftUI accessibility output.
- Can render a first-pass native `canvas` surface with browser-like intrinsic sizing (`300x150` by default, or explicit `width`/`height` attrs when provided), and it now accepts serializable declarative `drawOps` for shape and path drawing. Browser Canvas 2D and WebGL imperative APIs remain outside the translated surface.
- Resolves a practical native CSS subset for typography, spacing, gradients, shadows, flex and simple grid layouts, `currentColor`, named colors, and per-side solid, dashed, and dotted borders.
- Supports native selector matching for tag, class, id, and attribute selectors; sibling combinators; child and type position pseudo-classes; and practical `:not(...)` and `:has(...)` subsets.
- Can be wired into `elit mobile sync|build|run` through `mobile.native.entry` so generated files land in the mobile scaffold automatically.
- Keeps source tag information so platform backends can apply custom rules later.

## Fastest Working App

This is the smallest browser app that works with the current CLI.

Project structure:

```text
my-app/
  index.html
  src/
    main.ts
```

`src/main.ts`

```ts
import { div, h1, button } from 'elit/el';
import { createState, reactive } from 'elit/state';
import { render } from 'elit/dom';

const count = createState(0);

const app = div(
  { className: 'app' },
  h1('Hello Elit'),
  reactive(count, (value) =>
    button({ onclick: () => count.value++ }, `Count: ${value}`)
  )
);

render('app', app);
```

`index.html`

```html
<!doctype html>
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
</html>
```

Run it:

```bash
npx elit dev
```

Notes:

- `render('app', app)` and `render('#app', app)` both work.
- During development you can point the browser to `/src/main.ts` directly.
- For production builds, your copied HTML should point to the built asset path such as `/main.js`.

## CLI

Main commands:

```bash
npx elit dev
npx elit build --entry ./src/main.ts --out-dir dist
npx elit --version
npx elit preview
npx elit test
npx elit desktop ./src/main.ts
npx elit desktop run --mode native
npx elit desktop build ./src/main.ts --release
npx elit mobile init
npx elit mobile run android
npx elit native generate android ./src/native-screen.ts --name HomeScreen
npx elit pm start --script "npm start" --name my-app
npx elit wapk pack .
npx elit wapk run ./app.wapk
npx elit wapk run ./app.wapk --online
npx elit desktop wapk run ./app.wapk
```

Useful flags:

- `elit --version`
- `elit -v`
- `elit dev --port 3000 --host 0.0.0.0 --no-open`
- `elit build --entry ./src/main.ts --out-dir dist --format esm --sourcemap`
- `elit preview --root dist --base-path /app`
- `elit test --watch`
- `elit test --file ./testing/unit/database.test.ts`
- `elit test --describe "Database"`
- `elit test --it "saves records"`
- `elit test --coverage --coverage-reporter text,html`
- `elit desktop --runtime quickjs|node|bun|deno`
- `elit desktop run --mode native`
- `elit desktop build --platform windows|linux|macos --out-dir dist`
- `elit desktop build --compiler auto|none|esbuild|tsx|tsup`
- `elit mobile init --app-id com.example.app --app-name "Example App" --web-dir dist --icon ./icon.png --permission android.permission.CAMERA`
- `elit mobile doctor --cwd .`
- `elit mobile doctor --cwd . --json`
- `elit mobile sync --cwd . --web-dir dist --icon ./icon.png --permission android.permission.CAMERA`
- `elit mobile open android|ios`
- `elit mobile run android|ios --cwd . --target <device-id> --prod --icon ./icon.png --permission android.permission.CAMERA`
- `elit mobile build android|ios --cwd . --prod --icon ./icon.png --permission android.permission.CAMERA`
- `elit native generate android ./src/native-screen.ts --name HomeScreen --package com.example.app`
- `elit native generate ios ./src/native-screen.ts --out ./ios/HomeScreen.swift --no-preview`
- `elit native generate ir ./src/native-screen.ts --platform android --export screen`
- `elit pm start --script "npm start" --name my-app --runtime node`
- `elit pm start --script "npm start" --name my-app --watch --watch-path src --restart-policy on-failure`
- `elit pm start ./src/worker.ts --name worker --runtime bun`
- `elit pm start --wapk ./app.wapk --name packaged-app`
- `elit pm start --wapk ./app.wapk --name packaged-app --online --online-url http://localhost:4179`
- `elit pm start --wapk gdrive://<fileId> --name packaged-app`
- `elit pm start --google-drive-file-id <fileId> --google-drive-token-env GOOGLE_DRIVE_ACCESS_TOKEN --name packaged-app`
- `elit pm save`
- `elit pm resurrect`
- `elit pm logs my-app --lines 100`
- `elit wapk pack . --password secret-123`
- `elit wapk ./app.wapk --runtime node|bun|deno`
- `elit wapk run ./app.wapk --password secret-123 --sync-interval 100 --watcher`
- `elit wapk run ./app.wapk --online` (stays active until `Ctrl+C`, then closes the shared session)
- `elit wapk gdrive://<fileId> --google-drive-token-env GOOGLE_DRIVE_ACCESS_TOKEN --online`
- `elit wapk run ./app.wapk --online --online-url http://localhost:4177`
- `elit wapk pack .`
- `elit wapk patch ./app.wapk --from ./patch.wapk`
- `elit wapk inspect ./app.wapk --password secret-123`
- `elit wapk extract ./app.wapk`
- `elit desktop wapk ./app.wapk --runtime node|bun|deno --watcher`
- `elit desktop wapk run ./app.wapk --runtime bun --password secret-123`

Desktop mode notes:

- Cargo is required the first time the native runtime is built.
- TypeScript entries are transpiled automatically when needed.
- Set `desktop.mode` to `hybrid` or `native`. Projects with `desktop.native.entry` default to `native`; projects without it default to `hybrid`.
- Set `desktop.entry` when you want hybrid desktop commands to omit the positional entry, and set `desktop.native.entry` when you want native desktop commands to do the same.
- Hybrid desktop mode uses the WebView runtime. Native desktop mode renders Elit native IR in the dedicated native desktop runtime.
- `elit desktop run` is an explicit alias for the run path; `elit desktop` still works as the shorthand form.
- Desktop build can prebuild the native runtime even without an entry file.
- `tsx` compiler mode is Node-only and keeps loading the original source tree instead of bundling it.
- `tsx` and `tsup` compiler modes require those packages to be installed in the project.
- Desktop icon support includes `.ico`, `.png`, and `.svg`.
- Desktop build auto-detects `icon.*` and `favicon.*` in the entry directory, project directory, and sibling `public/` folders.

Mobile mode notes:

- Mobile mode is implemented by elit directly with native project scaffolding.
- Run `elit mobile init` once in your project to create native scaffold folders.
- Set mobile defaults in `elit.config.*` under `mobile` (for example: `cwd`, `appId`, `appName`, `webDir`, `mode`, `icon`, `permissions`).
- Android workflow is fully scaffolded: assets are synced to `android/app/src/main/assets/public` and loaded in WebView.
- Set `mobile.native.entry` to also generate `ElitGeneratedScreen.kt` and `ElitGeneratedScreen.swift` from the same Elit UI source during `sync`, `run`, and `build`.
- Set `mobile.mode` to `native` or `hybrid`. Projects with `mobile.native.entry` default to `native`; projects without it default to `hybrid`.
- Android scaffold now includes a Compose host that switches between generated native UI and the WebView fallback via generated runtime config and `mobile.mode`.
- Android icon can be set from config or CLI with `.png` / `.webp` and will be applied to launcher resources.
- Android permissions can be set from config (`mobile.permissions`) or CLI (`--permission`) and are written into `AndroidManifest.xml`.
- Set `mobile.android.target` or `mobile.ios.target` when you want a default device/simulator without repeating `--target` on every command.
- Use `examples/android-native-example` when you want an Android-first native mobile smoke test that scaffolds, generates Compose, and builds through Gradle.
- Use `examples/universal-app-example` when you want one repo that validates web, desktop, and Android mobile workflows together.
- Build your web app first, then run `elit mobile sync` before `open`, `run`, or `build`.
- If `mobile.mode` is `native` and `mobile.native.entry` is configured, sync can still proceed even when the web build output is missing.
- Android commands require native tools in your machine (`gradle` or `gradlew`, plus `adb` for `run`).
- Use `elit mobile devices android|ios --json` to inspect connected Android devices or available iOS simulators.
- Run `elit mobile doctor` to validate local toolchain and project prerequisites before build or run.
- Use `elit mobile doctor --json` when you need machine-readable output for CI checks.
- iOS scaffold now creates `ios/ElitMobileApp.xcodeproj` plus SwiftUI/WebView fallback sources under `ios/App`.
- iOS build automation uses `xcodebuild` on macOS.
- iOS run automation uses `xcrun simctl` on macOS and accepts `--target booted`, a simulator name, or a simulator UDID. Without `--target`, it prefers a booted simulator and otherwise falls back to the best available iPhone simulator.

WAPK mode notes:

- `elit wapk <file.wapk>` and `elit wapk run <file.wapk>` run packaged apps.
- `elit desktop wapk <file.wapk>` and `elit desktop wapk run <file.wapk>` run packaged apps in desktop mode.
- During run, the archive is expanded into a temporary work directory and changes are synced back to the same `.wapk` file.
- `elit wapk patch <target.wapk> --from <patch.wapk>` reads `.wapkpatch` from the patch archive and overlays only the matching archive-relative files into the target archive.
- Use `--sync-interval <ms>` for polling mode, or `--watcher` / `--use-watcher` for event-driven sync.
- Use `--password` when packing, inspecting, extracting, or running a locked archive.
- Use `--from-password` when the patch archive is locked with a different password than the target archive.
- `inspect` without credentials still reports whether the archive is locked, but it does not print the archive contents.
- Locked archives stay encrypted when live sync writes changes back into the same `.wapk` file.
- Configure package metadata in `elit.config.*` under `wapk`, and use `wapk.lock` when you want password-protected archives by default.
- WAPK stays unlocked by default unless `wapk.lock.password` or `--password` is provided.
- See [docs/wapk.md](docs/wapk.md) for the full archive guide and `examples/wapk-example` for an end-to-end sample.

PM mode notes:

- `elit pm start --script "npm start"`, `elit pm start --file ./app.ts`, and `elit pm start --wapk ./app.wapk` all run through the same detached process manager.
- WAPK PM targets can also point at `gdrive://<fileId>` or use `pm.apps[].wapkRun.googleDrive` plus forwarded WAPK run flags like `online`, `onlineUrl`, `syncInterval`, `watcher`, and `watchArchive`.
- `elit pm start` boots every app from `pm.apps[]`, and `elit pm start <name>` starts one configured app by name.
- Use `elit pm list`, `elit pm stop`, `elit pm restart`, `elit pm delete`, `elit pm save`, `elit pm resurrect`, and `elit pm logs` to manage long-running processes.
- PM-managed WAPK online hosts close their Elit Run shared session when you use `elit pm stop`, `elit pm restart`, or `elit pm delete`.
- Use `--restart-policy always|on-failure|never` plus `--min-uptime <ms>` when you want tighter restart-loop control.
- Use `--watch`, `--watch-path`, `--watch-ignore`, and `--watch-debounce` when the process should restart after source changes.
- PM `--watch` and WAPK `--watcher` are different: the first restarts the managed process, the second changes how the inner WAPK runtime syncs files.
- Use `--health-url`, `--health-grace-period`, `--health-interval`, `--health-timeout`, and `--health-max-failures` when the process exposes an HTTP health endpoint.
- PM state and logs are stored in `./.elit/pm` by default, or in `pm.dataDir` when configured. `elit pm save` writes to `pm.dumpFile` or `./.elit/pm/dump.json`.
- TypeScript file targets with runtime `node` require `tsx`; use `--runtime bun` when you want zero-config TypeScript execution.

## Config File

Elit loads one of these files from the project root:

- `elit.config.ts`
- `elit.config.mts`
- `elit.config.js`
- `elit.config.mjs`
- `elit.config.cjs`
- `elit.config.json`

The config shape is:

```ts
{
  dev?: DevServerOptions;
  build?: BuildOptions | BuildOptions[];
  preview?: PreviewOptions;
  test?: TestOptions;
  pm?: {
    dataDir?: string;
    apps?: Array<{
      name: string;
      script?: string;
      file?: string;
      wapk?: string;
      wapkRun?: {
        file?: string;
        googleDrive?: {
          fileId?: string;
          accessToken?: string;
          accessTokenEnv?: string;
          supportsAllDrives?: boolean;
        };
        runtime?: 'node' | 'bun' | 'deno';
        password?: string;
        syncInterval?: number;
        useWatcher?: boolean;
        watchArchive?: boolean;
        archiveSyncInterval?: number;
      };
      runtime?: 'node' | 'bun' | 'deno';
      cwd?: string;
      env?: Record<string, string | number | boolean>;
      autorestart?: boolean;
      restartDelay?: number;
      maxRestarts?: number;
      password?: string;
    }>;
  };
  mobile?: {
    cwd?: string;
    appId?: string;
    appName?: string;
    webDir?: string;
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
        structName?: string;
      };
    };
  };
  desktop?: {
    mode?: 'hybrid' | 'native';
    entry?: string;
    native?: {
      entry?: string;
    };
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
    lock?: {
      password?: string;
    };
  };
}
```

Example:

```ts
import { api } from './src/server';
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
        ws: [
          {
            path: '/ws',
            handler: ({ ws, query }) => {
              ws.send(JSON.stringify({ type: 'connected', room: query.room || 'general' }));
              ws.on('message', (message) => {
                ws.send(message.toString());
              });
            },
          },
        ],
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
    ws: [
      {
        path: '/ws',
        handler: ({ ws }) => {
          ws.on('message', (message) => ws.send(message.toString()));
        },
      },
    ],
  },
  test: {
    include: ['testing/unit/**/*.test.ts'],
  },
  mobile: {
    cwd: '.',
    appId: 'com.elit.app',
    appName: 'Elit App',
    webDir: 'dist',
    mode: 'hybrid',
    icon: './icon.png',
    permissions: ['android.permission.INTERNET'],
  },
  desktop: {
    mode: 'native',
    native: {
      entry: './src/main.ts',
    },
    runtime: 'quickjs',
    compiler: 'auto',
    release: false,
    outDir: 'dist',
    platform: 'windows',
    wapk: {
      runtime: 'bun',
      syncInterval: 150,
      useWatcher: true,
      release: true,
    },
  },
  pm: {
    apps: [
      {
        name: 'api',
        script: 'npm start',
        runtime: 'node',
      },
      {
        name: 'worker',
        file: './src/worker.ts',
        runtime: 'bun',
      },
      {
        name: 'archive-app',
        wapk: './dist/app.wapk',
        runtime: 'node',
      },
    ],
  },
  wapk: {
    name: 'my-app',
    version: '1.0.0',
    runtime: 'bun',
    entry: './src/server.ts',
    port: 3000,
    env: {
      NODE_ENV: 'production',
    },
    lock: {
      password: 'secret-123',
    },
  },
};
```

Notes:

- `dev.ws` and `preview.ws` register global WebSocket endpoints.
- `clients[].ws` registers client-specific endpoints and prefixes each path with that client's `basePath`.
- The internal Elit HMR and shared-state socket uses `/__elit_ws`, so do not reuse that path for custom endpoints.

Important details:

- `build` may be a single object or an array. If it is an array, all builds run sequentially.
- `dev.clients` is the most flexible setup when you want SSR, API routes, multiple apps, or per-client proxy rules.
- `preview` supports the same concepts as `dev`: multiple clients, API routes, proxy rules, workers, SSR, and HTTPS.
- Only `VITE_` variables are exposed to client code during bundling.
- `desktop` config provides defaults for `elit desktop`, `elit desktop run`, `elit desktop build`, and `elit desktop wapk`. Use `desktop.entry` for hybrid defaults, `desktop.native.entry` for native defaults, and `desktop.mode` to choose which one runs by default.
- `mobile` config provides defaults for `elit mobile init|sync|open|run|build`.
- `pm` config provides defaults for `elit pm`. Use `pm.apps[]` for named processes, `pm.dataDir` for metadata/log storage, `pm.dumpFile` for `save`/`resurrect`, and per-app restart/watch/health settings.
- `wapk` config is loaded from `elit.config.*`, then package metadata is used as fallback.
- `wapk.lock.password` is the config-level default for locked archives. Use `--password` when you want to supply unlock credentials at command time instead of writing them into config.
- `wapk run` and `desktop wapk run` sync runtime file changes back into the same `.wapk` archive.

## Browser Patterns

### Elements and State

```ts
import { div, input, button, span } from 'elit/el';
import { createState, computed, reactive, bindValue } from 'elit/state';
import { render } from 'elit/dom';

const name = createState('Elit');
const count = createState(0);
const label = computed([name, count], (currentName, currentCount) => {
  return `${currentName}: ${currentCount}`;
});

const app = div(
  input({ type: 'text', ...bindValue(name) }),
  reactive(label, (value) => span(value)),
  button({ onclick: () => count.value++ }, 'Increment')
);

render('app', app);
```

### Router

```ts
import { div, nav } from 'elit/el';
import { reactive } from 'elit/state';
import { createRouter, createRouterView, routerLink } from 'elit/router';

const routerOptions = {
  mode: 'history' as const,
  routes: [
    { path: '/', component: () => div('Home') },
    { path: '/about', component: () => div('About') },
    { path: '/post/:id', component: (params: Record<string, string>) => div(`Post ${params.id}`) },
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
);
```

### Styling

```ts
import { CreateStyle } from 'elit/style';

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

css.inject('app-styles');
```

You can also use the shared singleton export:

```ts
import styles from 'elit/style';
```

## Server Patterns

### Server Router

```ts
import { ServerRouter, cors, logger } from 'elit/server';

export const api = new ServerRouter();

api.use(cors());
api.use(logger());

api.get('/api/hello', async (ctx) => {
  ctx.res.json({ message: 'Hello from Elit' });
});

api.post('/api/echo', async (ctx) => {
  ctx.res.json({ body: ctx.body });
});
```

`ServerRouter` supports both Elit-style handlers and Express-like handlers:

- `async (ctx) => { ... }`
- `async (req, res) => { ... }`
- middleware with `use(middleware)` or `use('/prefix', middleware)`

### Programmatic Dev Server

```ts
import { createDevServer } from 'elit/server';

const server = createDevServer({
  port: 3000,
  root: '.',
  open: false,
  logging: true,
});

console.log(server.url);
```

### Custom WebSocket Endpoints

Server:

```ts
import { createDevServer } from 'elit/server';

const server = createDevServer({
  root: '.',
  open: false,
  ws: [
    {
      path: '/ws',
      handler: ({ ws, query }) => {
        ws.send(JSON.stringify({ type: 'connected', room: query.room || 'general' }));

        ws.on('message', (message) => {
          ws.send(message.toString());
        });
      },
    },
  ],
});
```

Client:

```ts
const socket = new WebSocket(`ws://${location.host}/ws?room=general`);

socket.addEventListener('message', (event) => {
  console.log(event.data);
});

socket.send('hello');
```

Notes:

- Use `dev.ws` or `preview.ws` for global endpoints.
- Use `clients[].ws` when each client should expose its own endpoint under its `basePath`.
- Do not use `/__elit_ws`; Elit reserves that path for internal HMR and shared-state traffic.

### Shared State Between Server and Client

Client:

```ts
import { createSharedState } from 'elit/state';

const counter = createSharedState('counter', 0);
counter.value++;
```

Server:

```ts
import { createDevServer } from 'elit/server';

const server = createDevServer({ root: '.', open: false });
const counter = server.state.create('counter', { initial: 0 });

counter.value = 10;
counter.update((value) => value + 1);
```

The client `createSharedState()` connects over WebSocket to the current host unless you pass a custom `wsUrl`.

## SSR Document Shell

For SSR-style setups, export a document shell and return it from `dev.clients[].ssr`.

```ts
import { html, head, body, title, meta, div, script } from 'elit/el';

export const documentShell = html(
  head(
    title('My Elit App'),
    meta({ charset: 'UTF-8' }),
    meta({ name: 'viewport', content: 'width=device-width, initial-scale=1.0' })
  ),
  body(
    div({ id: 'app' }),
    script({ type: 'module', src: '/src/main.ts' })
  )
);
```

For production builds, make sure your built HTML points at the production asset path such as `/main.js`.

## Desktop Mode

Desktop mode now has two backends.

- Hybrid mode runs an Elit entry file inside the existing native WebView shell.
- Native mode loads a native entry, materializes Elit native IR, and renders it with the dedicated native desktop runtime.

Hybrid entries can call `createWindow(...)` directly or finish with a normal `render(...)` call from a shared UI entry. When Elit desktop hybrid mode sees a shared render-only entry, it captures the rendered VNode and auto-opens a native window from it.

Desktop now follows the same `hybrid | native` split as mobile:

- `desktop.mode: 'hybrid'` uses `desktop.entry`
- `desktop.mode: 'native'` uses `desktop.native.entry` and falls back to `desktop.entry` for older configs

Use hybrid mode when you want the desktop shell APIs and a browser-style surface. Use native mode when you want the shared Elit tree to render as a real native desktop UI.

If the resolved desktop entry is configured in `elit.config.*`, you can run `npx elit desktop`, `npx elit desktop run`, or `npx elit desktop build` without passing the entry path again.

Example desktop entry:

```ts
import { createWindow, onMessage, windowQuit, windowSetTitle } from 'elit/desktop';

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
  html: `<!doctype html>
<html lang="en">
  <body>
    <main>Hello from Elit Desktop</main>
    <script>
      window.addEventListener('DOMContentLoaded', () => {
        window.ipc.postMessage('desktop:ready');
      });
    </script>
  </body>
</html>`,
});
```

For a runnable minimal file in this repo, see `examples/desktop-simple-example.ts`.
For a runnable project-style repo, see `examples/desktop-typescript-example/`.

Run it:

```bash
npx elit desktop run --mode native ./src/main.ts
```

Build a standalone executable:

```bash
npx elit desktop build --mode native ./src/main.ts --release
```

Desktop notes:

- Runtime choices: `quickjs`, `node`, `bun`, `deno`
- Transpiler choices: `auto`, `none`, `esbuild`, `tsx`, `tsup`
- Mode choices: `hybrid`, `native`
- `tsx` is a Node loader mode, not a bundle mode. Use `esbuild` or `tsup` when you want a relocatable output.
- Icon input supports `.ico`, `.png`, and `.svg`
- EXE icon embedding and runtime window icon loading both support SVG now
- `createWindowServer(app, opts)` is available when you want to run an HTTP app inside the desktop shell

## Database

Elit includes a small VM-backed database helper that stores files under a directory and can execute TypeScript or JavaScript code against them.

```ts
import { Database } from 'elit/database';

const db = new Database({
  dir: './databases',
  language: 'ts',
});

db.create('users', `export const users = [];`);

await db.execute(`
  import { users } from '@db/users';
  console.log(users.length);
`);
```

Useful methods:

- `create(dbName, code)`
- `read(dbName)`
- `save(dbName, code)`
- `update(dbName, fnName, code)`
- `rename(oldName, newName)`
- `remove(dbName, fnName?)`

## Programmatic Build API

If you want to bundle from code instead of the CLI:

```ts
import { build } from 'elit/build';

await build({
  entry: './src/main.ts',
  outDir: './dist',
  outFile: 'main.js',
  format: 'esm',
  sourcemap: true,
  copy: [
    { from: './public/index.html', to: './index.html' },
  ],
});
```

## Testing

CLI test runner examples:

```bash
npx elit test
npx elit test --watch
npx elit test --file ./testing/unit/database.test.ts
npx elit test --describe "Database"
npx elit test --it "should save data"
npx elit test --coverage --coverage-reporter text,html
```

The package also exports `elit/test`, `elit/test-runtime`, and `elit/test-reporter` for advanced use, but most users should stay on the CLI.

## Changelog

Latest release notes live in [CHANGELOG.md](CHANGELOG.md).

Highlights in `v3.6.5`:

- Added `elit pm` for detached background process management of shell commands, file targets, and WAPK apps.
- Added `pm.apps[]` and `pm.dataDir` in `elit.config.*` for config-first process manager workflows.
- Added `elit pm save` / `elit pm resurrect`, `pm.dumpFile`, watch mode, health checks, and restart-policy controls for the process manager.
- Added lifecycle commands for managed apps: `list`, `stop`, `restart`, `delete`, and `logs`.

## Good Defaults For Generated Code

When writing new Elit code, these defaults are usually correct:

- Prefer `elit/el`, `elit/state`, and `elit/dom` in new examples.
- Keep server code on `elit/server` and browser code on client subpaths.
- Use `ServerRouter` for APIs instead of inventing another HTTP layer first.
- Use `createState` plus `reactive` for UI updates before adding abstractions.
- Use `CreateStyle` or `elit/style` for injected CSS.
- Use `elit.config.ts` when the project needs SSR, APIs, preview customization, workers, or proxy rules.
- Use `examples/correct-config` as the reference for a minimal full-stack setup.

## Repository Guide

If you are working in this repository, these locations matter most:

- `src/index.ts`: root client exports
- `src/dom.ts`: renderer and SSR string rendering
- `src/state.ts`: reactive state, bindings, shared state client
- `src/router.ts`: client router
- `src/style.ts`: CSS generator
- `src/server.ts`: dev server, `ServerRouter`, middleware, shared state server
- `src/build.ts`: bundler API
- `src/desktop.ts`: desktop runtime bindings exposed to TypeScript
- `src/desktop-cli.ts`: `elit desktop` implementation
- `src/database.ts`: database VM and helpers
- `examples/correct-config`: minimal full-stack reference
- `examples/full-db`: larger full-stack example with database usage
- `examples/universal-app-example`: one repo covering web, desktop, and Android mobile smoke flows
- `examples/android-native-example`: Android-first native mobile validation flow
- `examples/desktop-typescript-example`: project-style desktop app with `package.json`, `elit.config.ts`, and a TypeScript desktop entry
- `examples/desktop-simple-example.ts`: minimal desktop window example with inline HTML + IPC buttons
- `examples/desktop-example.ts`: desktop smoke test and runtime example
- `packages/create-elit`: scaffold templates used by `npm create elit@latest`
- `docs/`: the documentation site built with Elit itself

## Known Boundaries

- Root `elit` export is client-oriented. Non-client features are on subpaths.
- Desktop APIs only exist inside the desktop runtime.
- Client env injection is limited to `VITE_` variables.
- Production HTML copying is explicit. If you copy `index.html`, make sure it points at the built JS file, not the dev-only `/src/*.ts` path.

## Next Reads

- `examples/correct-config` for the cleanest SSR + API setup
- `examples/universal-app-example` for a single repo exercising web, desktop, and Android mobile together
- `examples/android-native-example` for Android-native mobile validation
- `examples/desktop-typescript-example` for a small desktop project you can install and run directly
- `examples/desktop-simple-example.ts` for the smallest desktop window example
- `examples/desktop-example.ts` for desktop runtime usage
- `USAGE_EXAMPLES.md` for more import combinations
- `docs/API.md` for broader API detail