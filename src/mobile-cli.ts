import {
    copyFileSync,
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    rmSync,
    statSync,
    writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

import { loadConfig, type MobileConfig } from './config';

type MobilePlatform = 'android' | 'ios';

interface MobileInitOptions {
    directory: string;
    appId: string;
    appName: string;
    webDir: string;
}

interface MobileCommandOptions {
    cwd: string;
    webDir: string;
}

export async function runMobileCommand(args: string[]): Promise<void> {
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        printMobileHelp();
        return;
    }

    const config = await loadConfig();
    const mobileConfig = config?.mobile;
    const command = args[0];

    switch (command) {
        case 'init':
            initMobileProject(parseInitArgs(args.slice(1), mobileConfig));
            break;
        case 'sync':
            syncMobileAssets(parseCommandOptions(args.slice(1), mobileConfig));
            break;
        case 'open': {
            const platform = parsePlatformArg(args[1]);
            openMobileProject(platform, parseCommandOptions(args.slice(2), mobileConfig));
            break;
        }
        case 'run': {
            const platform = parsePlatformArg(args[1]);
            runMobilePlatform(platform, args.slice(2), parseCommandOptions(args.slice(2), mobileConfig));
            break;
        }
        case 'build': {
            const platform = parsePlatformArg(args[1]);
            buildMobilePlatform(platform, args.slice(2), parseCommandOptions(args.slice(2), mobileConfig));
            break;
        }
        default:
            throw new Error(`Unknown mobile command: ${command}`);
    }
}

function parseInitArgs(args: string[], config?: MobileConfig): MobileInitOptions {
    const options: MobileInitOptions = {
        directory: config?.cwd ?? process.cwd(),
        appId: config?.appId ?? 'com.elit.app',
        appName: config?.appName ?? 'Elit App',
        webDir: config?.webDir ?? 'dist',
    };

    if (args.length > 0 && !args[0].startsWith('-')) {
        options.directory = resolve(args[0]);
    }

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--app-id': {
                const value = args[++i];
                if (!value) throw new Error('Missing value for --app-id');
                options.appId = value;
                break;
            }
            case '--app-name': {
                const value = args[++i];
                if (!value) throw new Error('Missing value for --app-name');
                options.appName = value;
                break;
            }
            case '--web-dir': {
                const value = args[++i];
                if (!value) throw new Error('Missing value for --web-dir');
                options.webDir = value;
                break;
            }
        }
    }

    return options;
}

function parseCommandOptions(args: string[], config?: MobileConfig): MobileCommandOptions {
    const options: MobileCommandOptions = {
        cwd: config?.cwd ? resolve(config.cwd) : process.cwd(),
        webDir: config?.webDir ?? 'dist',
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--cwd') {
            const value = args[++i];
            if (!value) throw new Error('Missing value for --cwd');
            options.cwd = resolve(value);
        } else if (arg === '--web-dir') {
            const value = args[++i];
            if (!value) throw new Error('Missing value for --web-dir');
            options.webDir = value;
        }
    }

    return options;
}

function parsePlatformArg(value: string | undefined): MobilePlatform {
    if (value === 'android' || value === 'ios') {
        return value;
    }

    throw new Error('Mobile command requires a platform: android or ios');
}

function initMobileProject(options: MobileInitOptions): void {
    const directory = resolve(options.directory);
    const mobileConfigPath = join(directory, 'elit.mobile.json');

    if (!existsSync(directory)) {
        mkdirSync(directory, { recursive: true });
    }

    if (!existsSync(mobileConfigPath)) {
        const configContent = JSON.stringify(
            {
                appId: options.appId,
                appName: options.appName,
                webDir: options.webDir,
            },
            null,
            2,
        );
        writeFileSync(mobileConfigPath, `${configContent}\n`);
        console.log(`[mobile] Created ${mobileConfigPath}`);
    } else {
        console.log(`[mobile] Reusing existing ${mobileConfigPath}`);
    }

    createAndroidScaffold(directory, {
        appId: options.appId,
        appName: options.appName,
    });

    createIosScaffold(directory);

    console.log('[mobile] Native scaffold ready. Next steps:');
    console.log('  elit build --entry ./src/main.ts --out-dir dist');
    console.log('  elit mobile sync --cwd .');
    console.log('  elit mobile build android --cwd .');
    console.log('  elit mobile run android --cwd .');
}

function readElitMobileConfig(cwd: string): { appId: string; appName: string; webDir: string } {
    const configPath = join(cwd, 'elit.mobile.json');
    if (!existsSync(configPath)) {
        throw new Error(`Missing ${configPath}. Run "elit mobile init" first.`);
    }

    const parsed = JSON.parse(readFileSync(configPath, 'utf8')) as Record<string, unknown>;
    const appId = typeof parsed.appId === 'string' ? parsed.appId : 'com.elit.app';
    const appName = typeof parsed.appName === 'string' ? parsed.appName : 'Elit App';
    const webDir = typeof parsed.webDir === 'string' ? parsed.webDir : 'dist';

    return { appId, appName, webDir };
}

function syncMobileAssets(options: MobileCommandOptions): void {
    const mobileConfig = readElitMobileConfig(options.cwd);
    const webRoot = resolve(options.cwd, options.webDir || mobileConfig.webDir);
    if (!existsSync(webRoot)) {
        throw new Error(`Web directory not found: ${webRoot}. Build your app first.`);
    }

    const androidPublic = join(options.cwd, 'android', 'app', 'src', 'main', 'assets', 'public');
    copyDirectory(webRoot, androidPublic);
    console.log(`[mobile] Synced web assets to ${androidPublic}`);

    const iosPublic = join(options.cwd, 'ios', 'App', 'www');
    if (existsSync(dirname(iosPublic))) {
        copyDirectory(webRoot, iosPublic);
        console.log(`[mobile] Synced web assets to ${iosPublic}`);
    }
}

function buildMobilePlatform(platform: MobilePlatform, args: string[], options: MobileCommandOptions): void {
    syncMobileAssets(options);

    if (platform === 'android') {
        const release = args.includes('--prod') || args.includes('--release');
        runGradle(options.cwd, [release ? 'assembleRelease' : 'assembleDebug']);
        return;
    }

    throw new Error('iOS build automation is not ready yet. Open ios/App in Xcode and build there.');
}

function runMobilePlatform(platform: MobilePlatform, args: string[], options: MobileCommandOptions): void {
    syncMobileAssets(options);

    if (platform === 'android') {
        const release = args.includes('--prod') || args.includes('--release');
        const target = readArgValue(args, '--target');
        runGradle(options.cwd, [release ? 'installRelease' : 'installDebug']);

        const mobileConfig = readElitMobileConfig(options.cwd);
        const adbArgs = [
            ...(target ? ['-s', target] : []),
            'shell',
            'am',
            'start',
            '-n',
            `${mobileConfig.appId}/.MainActivity`,
        ];
        runCommand('adb', adbArgs, options.cwd);
        return;
    }

    throw new Error('iOS run automation is not ready yet. Open ios/App in Xcode and run from there.');
}

function openMobileProject(platform: MobilePlatform, options: MobileCommandOptions): void {
    if (platform === 'android') {
        const projectPath = join(options.cwd, 'android');
        if (!existsSync(projectPath)) {
            throw new Error(`Android project not found at ${projectPath}. Run "elit mobile init" first.`);
        }

        if (process.platform === 'win32') {
            runCommand('cmd', ['/c', 'start', '', projectPath], options.cwd);
            return;
        }

        if (process.platform === 'darwin') {
            runCommand('open', [projectPath], options.cwd);
            return;
        }

        runCommand('xdg-open', [projectPath], options.cwd);
        return;
    }

    const iosPath = join(options.cwd, 'ios', 'App');
    if (!existsSync(iosPath)) {
        throw new Error(`iOS project not found at ${iosPath}. Run "elit mobile init" first.`);
    }

    if (process.platform === 'darwin') {
        runCommand('open', [iosPath], options.cwd);
        return;
    }

    throw new Error('iOS project opening is available only on macOS.');
}

function runGradle(cwd: string, args: string[]): void {
    const androidRoot = join(cwd, 'android');
    if (!existsSync(androidRoot)) {
        throw new Error(`Android project not found at ${androidRoot}. Run "elit mobile init" first.`);
    }

    const wrapper = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
    const wrapperPath = join(androidRoot, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');

    if (existsSync(wrapperPath)) {
        runCommand(wrapper, args, androidRoot);
        return;
    }

    runCommand('gradle', args, androidRoot);
}

function runCommand(command: string, args: string[], cwd: string): void {
    const result = spawnSync(command, args, {
        cwd,
        stdio: 'inherit',
        shell: process.platform === 'win32' && command !== 'gradlew.bat',
    });

    if (typeof result.status === 'number' && result.status !== 0) {
        process.exit(result.status);
    }
}

function readArgValue(args: string[], key: string): string | undefined {
    const index = args.indexOf(key);
    if (index === -1) return undefined;
    return args[index + 1];
}

function createAndroidScaffold(directory: string, app: { appId: string; appName: string }): void {
    const packagePath = app.appId.replace(/\./g, '/');
    const kotlinDir = join(directory, 'android', 'app', 'src', 'main', 'java', packagePath);
    mkdirSync(kotlinDir, { recursive: true });

    const files: Array<{ path: string; content: string }> = [
        {
            path: join(directory, 'android', 'settings.gradle'),
            content: "rootProject.name = 'elit-mobile'\ninclude ':app'\n",
        },
        {
            path: join(directory, 'android', 'build.gradle'),
            content:
                "buildscript {\n" +
                "  repositories { google(); mavenCentral() }\n" +
                "  dependencies {\n" +
                "    classpath 'com.android.tools.build:gradle:8.4.2'\n" +
                "    classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.24'\n" +
                "  }\n" +
                "}\n" +
                "allprojects { repositories { google(); mavenCentral() } }\n",
        },
        {
            path: join(directory, 'android', 'gradle.properties'),
            content: 'org.gradle.jvmargs=-Xmx2g -Dkotlin.daemon.jvm.options=-Xmx1g\n',
        },
        {
            path: join(directory, 'android', 'app', 'build.gradle'),
            content:
                "plugins {\n" +
                "  id 'com.android.application'\n" +
                "  id 'org.jetbrains.kotlin.android'\n" +
                "}\n\n" +
                "android {\n" +
                `  namespace '${escapeSingleQuote(app.appId)}'\n` +
                "  compileSdk 34\n\n" +
                "  defaultConfig {\n" +
                `    applicationId '${escapeSingleQuote(app.appId)}'\n` +
                "    minSdk 24\n" +
                "    targetSdk 34\n" +
                "    versionCode 1\n" +
                "    versionName '1.0.0'\n" +
                "  }\n\n" +
                "  buildTypes {\n" +
                "    release {\n" +
                "      minifyEnabled false\n" +
                "      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'\n" +
                "    }\n" +
                "  }\n\n" +
                "  compileOptions {\n" +
                "    sourceCompatibility JavaVersion.VERSION_17\n" +
                "    targetCompatibility JavaVersion.VERSION_17\n" +
                "  }\n" +
                "  kotlinOptions { jvmTarget = '17' }\n" +
                "}\n\n" +
                "dependencies {\n" +
                "  implementation 'androidx.core:core-ktx:1.13.1'\n" +
                "  implementation 'androidx.appcompat:appcompat:1.7.0'\n" +
                "}\n",
        },
        {
            path: join(directory, 'android', 'app', 'proguard-rules.pro'),
            content: '\n',
        },
        {
            path: join(directory, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
            content:
                "<manifest xmlns:android='http://schemas.android.com/apk/res/android'>\n" +
                "  <uses-permission android:name='android.permission.INTERNET' />\n" +
                `  <application android:label='${escapeSingleQuote(app.appName)}' android:theme='@style/Theme.AppCompat.Light.NoActionBar'>\n` +
                "    <activity android:name='.MainActivity' android:exported='true'>\n" +
                "      <intent-filter>\n" +
                "        <action android:name='android.intent.action.MAIN' />\n" +
                "        <category android:name='android.intent.category.LAUNCHER' />\n" +
                "      </intent-filter>\n" +
                "    </activity>\n" +
                "  </application>\n" +
                "</manifest>\n",
        },
        {
            path: join(directory, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml'),
            content:
                "<?xml version='1.0' encoding='utf-8'?>\n" +
                "<resources>\n" +
                `  <string name='app_name'>${escapeSingleQuote(app.appName)}</string>\n` +
                "</resources>\n",
        },
        {
            path: join(kotlinDir, 'MainActivity.kt'),
            content:
                `package ${app.appId}\n\n` +
                "import android.annotation.SuppressLint\n" +
                "import android.os.Bundle\n" +
                "import android.webkit.WebSettings\n" +
                "import android.webkit.WebView\n" +
                "import androidx.appcompat.app.AppCompatActivity\n\n" +
                "class MainActivity : AppCompatActivity() {\n" +
                "  @SuppressLint(\"SetJavaScriptEnabled\")\\n" +
                "  override fun onCreate(savedInstanceState: Bundle?) {\n" +
                "    super.onCreate(savedInstanceState)\n" +
                "    val webView = WebView(this)\n" +
                "    val settings: WebSettings = webView.settings\n" +
                "    settings.javaScriptEnabled = true\n" +
                "    settings.domStorageEnabled = true\n" +
                "    webView.loadUrl(\"file:///android_asset/public/index.html\")\\n" +
                "    setContentView(webView)\n" +
                "  }\n" +
                "}\n",
        },
    ];

    for (const file of files) {
        if (!existsSync(dirname(file.path))) {
            mkdirSync(dirname(file.path), { recursive: true });
        }
        if (!existsSync(file.path)) {
            writeFileSync(file.path, file.content);
            console.log(`[mobile] Created ${file.path}`);
        }
    }

    const androidAssets = join(directory, 'android', 'app', 'src', 'main', 'assets', 'public');
    if (!existsSync(androidAssets)) {
        mkdirSync(androidAssets, { recursive: true });
        writeFileSync(join(androidAssets, '.gitkeep'), '');
    }
}

function createIosScaffold(directory: string): void {
    const iosRoot = join(directory, 'ios', 'App');
    if (!existsSync(iosRoot)) {
        mkdirSync(iosRoot, { recursive: true });
        writeFileSync(
            join(iosRoot, 'README.md'),
            'Elit iOS scaffold placeholder. Open this folder in Xcode and create a WebView app that loads ./www/index.html.\n',
        );
        console.log(`[mobile] Created ${join(iosRoot, 'README.md')}`);
    }

    const iosPublic = join(iosRoot, 'www');
    if (!existsSync(iosPublic)) {
        mkdirSync(iosPublic, { recursive: true });
        writeFileSync(join(iosPublic, '.gitkeep'), '');
    }
}

function copyDirectory(sourceDir: string, targetDir: string): void {
    if (existsSync(targetDir)) {
        rmSync(targetDir, { recursive: true, force: true });
    }
    mkdirSync(targetDir, { recursive: true });

    const stack: Array<{ from: string; to: string }> = [{ from: sourceDir, to: targetDir }];
    while (stack.length > 0) {
        const current = stack.pop();
        if (!current) continue;

        const entries = readdirSync(current.from);
        for (const entry of entries) {
            const fromPath = join(current.from, entry);
            const toPath = join(current.to, entry);
            const stats = statSync(fromPath);
            if (stats.isDirectory()) {
                mkdirSync(toPath, { recursive: true });
                stack.push({ from: fromPath, to: toPath });
            } else if (stats.isFile()) {
                copyFileSync(fromPath, toPath);
            }
        }
    }
}

function escapeSingleQuote(value: string): string {
    return value.replace(/'/g, "\\'");
}

function printMobileHelp(): void {
    console.log(`
Mobile command (native app workflow owned by elit)

Usage:
  elit mobile init [directory] [--app-id id] [--app-name name] [--web-dir dist]
    elit mobile sync [--cwd dir] [--web-dir dist]
  elit mobile open android|ios
    elit mobile run android|ios [--cwd dir] [--web-dir dist] [--target <id>] [--prod]
    elit mobile build android|ios [--cwd dir] [--web-dir dist] [--prod]

Notes:
    - No external mobile framework is required.
    - Android is fully scaffolded by elit and uses WebView + bundled web assets.
    - iOS scaffold is a placeholder folder for Xcode integration.
    - Default values can be set in elit.config.* under mobile.
`);
}
