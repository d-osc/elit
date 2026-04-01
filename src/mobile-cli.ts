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

import { ELIT_CONFIG_FILES, loadConfig, type MobileConfig } from './config';

type MobilePlatform = 'android' | 'ios';

interface MobileInitOptions {
    directory: string;
    appId: string;
    appName: string;
    webDir: string;
    icon?: string;
    permissions?: string[];
}

interface MobileCommandOptions {
    cwd: string;
    webDir: string;
    appId: string;
    appName: string;
    icon?: string;
    permissions?: string[];
    json: boolean;
}

interface MobileDoctorCheck {
    name: string;
    ok: boolean;
    details?: string;
}

interface MobileDoctorReport {
    ok: boolean;
    failed: number;
    checks: MobileDoctorCheck[];
}

export async function runMobileCommand(args: string[]): Promise<void> {
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        printMobileHelp();
        return;
    }

    const command = args[0];

    switch (command) {
        case 'init': {
            const config = await loadConfig();
            initMobileProject(parseInitArgs(args.slice(1), config?.mobile));
            break;
        }
        case 'doctor': {
            const options = await parseCommandOptions(args.slice(1));
            runMobileDoctor(options);
            break;
        }
        case 'sync': {
            const options = await parseCommandOptions(args.slice(1));
            syncMobileAssets(options);
            break;
        }
        case 'open': {
            const platform = parsePlatformArg(args[1]);
            const options = await parseCommandOptions(args.slice(2));
            openMobileProject(platform, options);
            break;
        }
        case 'run': {
            const platform = parsePlatformArg(args[1]);
            const options = await parseCommandOptions(args.slice(2));
            runMobilePlatform(platform, args.slice(2), options);
            break;
        }
        case 'build': {
            const platform = parsePlatformArg(args[1]);
            const options = await parseCommandOptions(args.slice(2));
            buildMobilePlatform(platform, args.slice(2), options);
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
        icon: config?.icon,
        permissions: Array.isArray(config?.permissions) ? [...config.permissions] : undefined,
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
            case '--icon': {
                const value = args[++i];
                if (!value) throw new Error('Missing value for --icon');
                options.icon = value;
                break;
            }
            case '--permission': {
                const value = args[++i];
                if (!value) throw new Error('Missing value for --permission');
                if (!options.permissions) options.permissions = [];
                options.permissions.push(value);
                break;
            }
            case '--permissions': {
                const value = args[++i];
                if (!value) throw new Error('Missing value for --permissions');
                options.permissions = value
                    .split(',')
                    .map((permission) => permission.trim())
                    .filter(Boolean);
                break;
            }
        }
    }

    return options;
}

async function parseCommandOptions(args: string[]): Promise<MobileCommandOptions> {
    const cwdArg = readArgValue(args, '--cwd');
    const cwd = cwdArg ? resolve(cwdArg) : process.cwd();
    const config = await loadConfig(cwd);
    const mobileConfig = config?.mobile;

    const options: MobileCommandOptions = {
        cwd: mobileConfig?.cwd ? resolve(cwd, mobileConfig.cwd) : cwd,
        webDir: mobileConfig?.webDir ?? 'dist',
        appId: mobileConfig?.appId ?? 'com.elit.app',
        appName: mobileConfig?.appName ?? 'Elit App',
        icon: mobileConfig?.icon,
        permissions: Array.isArray(mobileConfig?.permissions) ? [...mobileConfig.permissions] : undefined,
        json: false,
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
        } else if (arg === '--icon') {
            const value = args[++i];
            if (!value) throw new Error('Missing value for --icon');
            options.icon = value;
        } else if (arg === '--permission') {
            const value = args[++i];
            if (!value) throw new Error('Missing value for --permission');
            if (!options.permissions) options.permissions = [];
            options.permissions.push(value);
        } else if (arg === '--permissions') {
            const value = args[++i];
            if (!value) throw new Error('Missing value for --permissions');
            options.permissions = value
                .split(',')
                .map((permission) => permission.trim())
                .filter(Boolean);
        } else if (arg === '--json') {
            options.json = true;
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

    if (!existsSync(directory)) {
        mkdirSync(directory, { recursive: true });
    }

    createAndroidScaffold(directory, {
        appId: options.appId,
        appName: options.appName,
    });

    applyAndroidPermissions(directory, options.permissions);

    if (options.icon) {
        applyAndroidIcon(directory, options.icon);
    }

    createIosScaffold(directory);

    console.log('[mobile] Native scaffold ready. Next steps:');
    console.log('  Configure mobile defaults in elit.config.* under { mobile: { ... } }');
    console.log('  elit build --entry ./src/main.ts --out-dir dist');
    console.log('  elit mobile sync --cwd .');
    console.log('  elit mobile build android --cwd .');
    console.log('  elit mobile run android --cwd .');
}

function syncMobileAssets(options: MobileCommandOptions): void {
    const webRoot = resolve(options.cwd, options.webDir);
    if (!existsSync(webRoot)) {
        throw new Error(`Web directory not found: ${webRoot}. Build your app first.`);
    }

    const androidPublic = join(options.cwd, 'android', 'app', 'src', 'main', 'assets', 'public');
    copyDirectory(webRoot, androidPublic);
    console.log(`[mobile] Synced web assets to ${androidPublic}`);

    applyAndroidPermissions(options.cwd, options.permissions);

    if (options.icon) {
        applyAndroidIcon(options.cwd, options.icon);
    }

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

        const adbArgs = [
            ...(target ? ['-s', target] : []),
            'shell',
            'am',
            'start',
            '-n',
            `${options.appId}/.MainActivity`,
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

function runMobileDoctor(options: MobileCommandOptions): void {
    const checks: MobileDoctorCheck[] = [];
    const resolvedConfigPath = ELIT_CONFIG_FILES
        .map((file) => join(options.cwd, file))
        .find((filePath) => existsSync(filePath));
    const androidRoot = join(options.cwd, 'android');
    const iosRoot = join(options.cwd, 'ios');
    const androidSdkPath = detectAndroidSdkPath(options.cwd);

    checks.push({
        name: 'Project config (elit.config.*)',
        ok: Boolean(resolvedConfigPath),
        details: resolvedConfigPath
            ? resolvedConfigPath
            : 'Create elit.config.ts|mts|js|mjs|cjs|json and set { mobile: { ... } } defaults.',
    });

    const hasGradleWrapper = existsSync(join(androidRoot, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew'));
    checks.push({
        name: 'Gradle (gradle or gradlew)',
        ok: hasGradleWrapper || commandExists('gradle', options.cwd),
        details: hasGradleWrapper ? 'Using project gradle wrapper.' : 'Install Gradle or generate gradle wrapper in android/.',
    });
    checks.push({ name: 'Java JDK (java)', ok: commandExists('java', options.cwd) });
    checks.push({
        name: 'Android SDK (ANDROID_HOME or ANDROID_SDK_ROOT)',
        ok: Boolean(androidSdkPath),
        details: androidSdkPath ?? 'Set ANDROID_HOME/ANDROID_SDK_ROOT or install Android SDK.',
    });
    checks.push({ name: 'ADB (adb)', ok: commandExists('adb', options.cwd) });
    checks.push({
        name: 'Android scaffold (android/)',
        ok: existsSync(androidRoot),
        details: existsSync(androidRoot) ? androidRoot : 'Run "elit mobile init" first.',
    });

    if (process.platform === 'darwin') {
        checks.push({ name: 'Xcode tools (xcodebuild)', ok: commandExists('xcodebuild', options.cwd) });
        checks.push({ name: 'CocoaPods (pod)', ok: commandExists('pod', options.cwd) });
        checks.push({
            name: 'iOS scaffold (ios/)',
            ok: existsSync(iosRoot),
            details: existsSync(iosRoot) ? iosRoot : 'Run "elit mobile init" first.',
        });
    }

    const failed = checks.filter((check) => !check.ok).length;
    const report: MobileDoctorReport = {
        ok: failed === 0,
        failed,
        checks,
    };

    if (options.json) {
        console.log(JSON.stringify(report, null, 2));
        if (!report.ok) {
            process.exitCode = 1;
        }
        return;
    }

    console.log('[mobile doctor] Environment checks:');
    for (const check of checks) {
        const status = check.ok ? 'OK' : 'MISSING';
        console.log(`  [${status}] ${check.name}`);
        if (!check.ok && check.details) {
            console.log(`    -> ${check.details}`);
        }
    }

    if (!report.ok) {
        throw new Error(`[mobile doctor] ${failed} check(s) failed.`);
    }

    console.log('[mobile doctor] All checks passed.');
}

function commandExists(command: string, cwd: string): boolean {
    const checker = process.platform === 'win32' ? 'where' : 'which';
    const result = spawnSync(checker, [command], {
        cwd,
        stdio: 'ignore',
        shell: false,
    });
    return result.status === 0;
}

function resolveCommandPath(command: string, cwd: string): string | undefined {
    const checker = process.platform === 'win32' ? 'where' : 'which';
    const result = spawnSync(checker, [command], {
        cwd,
        encoding: 'utf8',
        shell: false,
    });

    if (result.status !== 0) return undefined;
    const output = String(result.stdout ?? '').trim();
    if (!output) return undefined;

    const firstLine = output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find(Boolean);
    return firstLine || undefined;
}

function parseAndroidSdkFromLocalProperties(androidRoot: string): string | undefined {
    const localPropertiesPath = join(androidRoot, 'local.properties');
    if (!existsSync(localPropertiesPath)) return undefined;

    try {
        const content = readFileSync(localPropertiesPath, 'utf8');
        const sdkLine = content
            .split(/\r?\n/)
            .map((line) => line.trim())
            .find((line) => line.startsWith('sdk.dir='));

        if (!sdkLine) return undefined;

        const value = sdkLine.slice('sdk.dir='.length).trim();
        if (!value) return undefined;

        const sdkPath = value.replace(/\\:/g, ':').replace(/\\\\/g, '\\');
        return existsSync(sdkPath) ? sdkPath : undefined;
    } catch {
        return undefined;
    }
}

function detectAndroidSdkPath(cwd: string): string | undefined {
    const envPath = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
    if (envPath && existsSync(envPath)) return envPath;

    const androidRoot = join(cwd, 'android');
    const localPropertiesPath = parseAndroidSdkFromLocalProperties(androidRoot);
    if (localPropertiesPath) return localPropertiesPath;

    const adbPath = resolveCommandPath('adb', cwd);
    if (adbPath) {
        const platformToolsDir = dirname(adbPath);
        const sdkPath = dirname(platformToolsDir);
        if (existsSync(join(sdkPath, 'platform-tools'))) {
            return sdkPath;
        }
    }

    const home = process.env.HOME || process.env.USERPROFILE;
    const candidates = [
        process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Android', 'Sdk') : undefined,
        process.env.USERPROFILE ? join(process.env.USERPROFILE, 'AppData', 'Local', 'Android', 'Sdk') : undefined,
        home ? join(home, 'Library', 'Android', 'sdk') : undefined,
        home ? join(home, 'Android', 'Sdk') : undefined,
    ].filter((value): value is string => Boolean(value));

    return candidates.find((candidate) => existsSync(candidate));
}

function runGradle(cwd: string, args: string[]): void {
    const androidRoot = join(cwd, 'android');
    if (!existsSync(androidRoot)) {
        throw new Error(`Android project not found at ${androidRoot}. Run "elit mobile init" first.`);
    }

    ensureAndroidLocalProperties(cwd);
    ensureAndroidGradleProperties(cwd);

    const wrapper = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
    const wrapperPath = join(androidRoot, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');

    if (existsSync(wrapperPath)) {
        runCommand(wrapper, args, androidRoot);
        return;
    }

    if (commandExists('gradle', androidRoot)) {
        runCommand('gradle', args, androidRoot);
        return;
    }

    const fallbackGradle = resolveFallbackGradleExecutable();
    if (!fallbackGradle) {
        throw new Error(
            '[mobile] Gradle not found. Install Gradle and add it to PATH, or generate wrapper files in android/ with "gradle wrapper".',
        );
    }

    runCommand(fallbackGradle, args, androidRoot);
}

function resolveFallbackGradleExecutable(): string | undefined {
    const executable = process.platform === 'win32' ? 'gradle.bat' : 'gradle';

    const gradleHome = process.env.GRADLE_HOME;
    if (gradleHome) {
        const gradleFromHome = join(gradleHome, 'bin', executable);
        if (existsSync(gradleFromHome)) return gradleFromHome;
    }

    const candidates: string[] = [
        process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'Programs', 'Android Studio', 'gradle') : '',
        process.env.ProgramFiles ? join(process.env.ProgramFiles, 'Android', 'Android Studio', 'gradle') : '',
        process.env['ProgramFiles(x86)'] ? join(process.env['ProgramFiles(x86)'], 'Android', 'Android Studio', 'gradle') : '',
        process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, 'elit-tools') : '',
        process.env.USERPROFILE ? join(process.env.USERPROFILE, 'scoop', 'apps', 'gradle', 'current', 'bin') : '',
        process.platform === 'win32' ? 'C:\\Gradle\\bin' : '',
    ].filter(Boolean);

    for (const candidate of candidates) {
        const direct = join(candidate, executable);
        if (existsSync(direct)) return direct;

        if (!existsSync(candidate)) continue;

        try {
            const versionDirs = readdirSync(candidate)
                .map((name) => join(candidate, name, 'bin', executable))
                .filter((path) => existsSync(path))
                .sort()
                .reverse();

            if (versionDirs.length > 0) {
                return versionDirs[0];
            }
        } catch {
            // Ignore unreadable directories while probing for Gradle.
        }
    }

    return undefined;
}

function ensureAndroidLocalProperties(cwd: string): void {
    const androidRoot = join(cwd, 'android');
    const sdkPath = detectAndroidSdkPath(cwd);
    if (!sdkPath) return;

    const localPropertiesPath = join(androidRoot, 'local.properties');
    const escapedSdkPath = sdkPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:');

    if (!existsSync(localPropertiesPath)) {
        writeFileSync(localPropertiesPath, `sdk.dir=${escapedSdkPath}\n`, 'utf8');
        return;
    }

    const content = readFileSync(localPropertiesPath, 'utf8');
    const hasSdkLine = /^sdk\.dir=/m.test(content);
    if (hasSdkLine) {
        const updated = content.replace(/^sdk\.dir=.*$/m, `sdk.dir=${escapedSdkPath}`);
        if (updated !== content) {
            writeFileSync(localPropertiesPath, updated, 'utf8');
        }
        return;
    }

    const separator = content.endsWith('\n') || content.length === 0 ? '' : '\n';
    writeFileSync(localPropertiesPath, `${content}${separator}sdk.dir=${escapedSdkPath}\n`, 'utf8');
}

function ensureAndroidGradleProperties(cwd: string): void {
    const gradlePropertiesPath = join(cwd, 'android', 'gradle.properties');
    const requiredEntries = [
        ['android.useAndroidX', 'true'],
        ['android.enableJetifier', 'true'],
    ] as const;

    if (!existsSync(gradlePropertiesPath)) {
        const defaults = [
            'org.gradle.jvmargs=-Xmx2g -Dkotlin.daemon.jvm.options=-Xmx1g',
            ...requiredEntries.map(([key, value]) => `${key}=${value}`),
        ].join('\n');
        writeFileSync(gradlePropertiesPath, `${defaults}\n`, 'utf8');
        return;
    }

    let content = readFileSync(gradlePropertiesPath, 'utf8');
    let changed = false;

    for (const [key, value] of requiredEntries) {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(content)) {
            const updated = content.replace(regex, `${key}=${value}`);
            if (updated !== content) {
                content = updated;
                changed = true;
            }
            continue;
        }

        const separator = content.endsWith('\n') || content.length === 0 ? '' : '\n';
        content = `${content}${separator}${key}=${value}\n`;
        changed = true;
    }

    if (changed) {
        writeFileSync(gradlePropertiesPath, content, 'utf8');
    }
}

function applyAndroidIcon(projectRoot: string, iconOption: string): void {
    const iconPath = resolve(projectRoot, iconOption);
    if (!existsSync(iconPath)) {
        throw new Error(`[mobile] Icon file not found: ${iconPath}`);
    }

    const extension = iconPath.split('.').pop()?.toLowerCase();
    if (extension !== 'png' && extension !== 'webp') {
        throw new Error('[mobile] Icon format must be .png or .webp for Android resources.');
    }

    const resRoot = join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'mipmap');
    if (!existsSync(resRoot)) {
        mkdirSync(resRoot, { recursive: true });
    }

    const launcherIcon = join(resRoot, `ic_launcher.${extension}`);
    const roundIcon = join(resRoot, `ic_launcher_round.${extension}`);
    copyFileSync(iconPath, launcherIcon);
    copyFileSync(iconPath, roundIcon);

    const manifestPath = join(projectRoot, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
    if (!existsSync(manifestPath)) {
        return;
    }

    const content = readFileSync(manifestPath, 'utf8');
    const updated = content.replace(/<application\b[^>]*>/, (tag) => {
        let next = upsertXmlAttribute(tag, 'android:icon', '@mipmap/ic_launcher');
        next = upsertXmlAttribute(next, 'android:roundIcon', '@mipmap/ic_launcher_round');
        return next;
    });

    if (updated !== content) {
        writeFileSync(manifestPath, updated, 'utf8');
    }
}

function normalizeAndroidPermissions(input?: string[]): string[] {
    const defaults = ['android.permission.INTERNET'];
    if (!input || input.length === 0) return defaults;

    const merged = [...input, ...defaults]
        .map((permission) => permission.trim())
        .filter(Boolean);

    return Array.from(new Set(merged));
}

function applyAndroidPermissions(projectRoot: string, permissionsOption?: string[]): void {
    const manifestPath = join(projectRoot, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
    if (!existsSync(manifestPath)) {
        return;
    }

    const permissions = normalizeAndroidPermissions(permissionsOption);
    const permissionLines = permissions.map((permission) => {
        return `  <uses-permission android:name='${escapeSingleQuote(permission)}' />`;
    });

    const content = readFileSync(manifestPath, 'utf8');
    const withoutPermissionLines = content.replace(/\s*<uses-permission\s+android:name=(?:"[^"]*"|'[^']*')\s*\/\>\s*\r?\n?/g, '\n');
    const updated = withoutPermissionLines.replace(/<manifest\b[^>]*>\s*/, (tag) => `${tag}${permissionLines.join('\n')}\n`);

    if (updated !== content) {
        writeFileSync(manifestPath, updated, 'utf8');
    }
}

function upsertXmlAttribute(tag: string, name: string, value: string): string {
    const regex = new RegExp(`${name}=("[^"]*"|'[^']*')`);
    if (regex.test(tag)) {
        return tag.replace(regex, `${name}='${value}'`);
    }

    if (tag.endsWith('/>')) {
        return `${tag.slice(0, -2)} ${name}='${value}'/>`;
    }

    return `${tag.slice(0, -1)} ${name}='${value}'>`;
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
                "  @SuppressLint(\"SetJavaScriptEnabled\")\n" +
                "  override fun onCreate(savedInstanceState: Bundle?) {\n" +
                "    super.onCreate(savedInstanceState)\n" +
                "    val webView = WebView(this)\n" +
                "    val settings: WebSettings = webView.settings\n" +
                "    settings.javaScriptEnabled = true\n" +
                "    settings.domStorageEnabled = true\n" +
                "    webView.loadUrl(\"file:///android_asset/public/index.html\")\n" +
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
    elit mobile init [directory] [--app-id id] [--app-name name] [--web-dir dist] [--icon ./icon.png] [--permission android.permission.CAMERA]
    elit mobile doctor [--cwd dir] [--json]
        elit mobile sync [--cwd dir] [--web-dir dist] [--icon ./icon.png] [--permission android.permission.CAMERA]
  elit mobile open android|ios
        elit mobile run android|ios [--cwd dir] [--web-dir dist] [--icon ./icon.png] [--permission android.permission.CAMERA] [--target <id>] [--prod]
        elit mobile build android|ios [--cwd dir] [--web-dir dist] [--icon ./icon.png] [--permission android.permission.CAMERA] [--prod]

Notes:
    - No external mobile framework is required.
    - Android is fully scaffolded by elit and uses WebView + bundled web assets.
    - iOS scaffold is a placeholder folder for Xcode integration.
    - Run "elit mobile doctor --json" for CI-friendly machine-readable checks.
    - Set default values in elit.config.* under { mobile: { cwd, appId, appName, webDir, icon, permissions } }.
    - Android permissions can be set by config mobile.permissions or repeated --permission flags.
    - Android icon expects a .png or .webp file path.
`);
}
