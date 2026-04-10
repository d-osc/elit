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
import { dirname, join, normalize, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

import { ELIT_CONFIG_FILES, loadConfig, type MobileConfig, type MobileMode, type MobileNativeConfig } from './config';
import { generateNativeEntryOutput } from './native-cli';

type MobilePlatform = 'android' | 'ios';

const ANDROID_GENERATED_SCREEN_NAME = 'ElitGeneratedScreen';
const ANDROID_RUNTIME_CONFIG_NAME = 'ElitRuntimeConfig';
const IOS_GENERATED_SCREEN_NAME = 'ElitGeneratedScreen';
const IOS_PROJECT_NAME = 'ElitMobileApp';
const IOS_RUNTIME_CONFIG_NAME = 'ElitRuntimeConfig';
const IOS_DERIVED_DATA_DIR = '.elit-xcode-build';
const MANAGED_ANDROID_MAIN_ACTIVITY_MARKER = '// ELIT-MOBILE-MAIN-ACTIVITY';
const MANAGED_ANDROID_MAIN_ACTIVITY_URLS = new Set([
    'file:///android_asset/public/index.html',
    'https://appassets.androidplatform.net/assets/public/index.html',
]);

interface IosSimulatorDevice {
    udid: string;
    name: string;
    state: string;
    isAvailable?: boolean;
}

interface AndroidConnectedDevice {
    id: string;
    state: string;
}

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
    mode: MobileMode;
    appId: string;
    appName: string;
    androidTarget?: string;
    icon?: string;
    iosTarget?: string;
    permissions?: string[];
    native?: MobileResolvedNativeOptions;
    json: boolean;
}

interface MobileResolvedNativeOptions {
    entryPath: string;
    exportName?: string;
    android: {
        enabled: boolean;
        outputPath: string;
        packageName: string;
    };
    ios: {
        enabled: boolean;
        outputPath: string;
    };
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
            await syncMobileAssets(options);
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
            await runMobilePlatform(platform, args.slice(2), options);
            break;
        }
        case 'build': {
            const platform = parsePlatformArg(args[1]);
            const options = await parseCommandOptions(args.slice(2));
            await buildMobilePlatform(platform, args.slice(2), options);
            break;
        }
        case 'devices': {
            const platform = parsePlatformArg(args[1]);
            const options = await parseCommandOptions(args.slice(2));
            runMobileDevices(platform, options);
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
        mode: getDefaultMobileMode(mobileConfig),
        appId: mobileConfig?.appId ?? 'com.elit.app',
        appName: mobileConfig?.appName ?? 'Elit App',
        androidTarget: mobileConfig?.android?.target,
        icon: mobileConfig?.icon,
        iosTarget: mobileConfig?.ios?.target,
        permissions: Array.isArray(mobileConfig?.permissions) ? [...mobileConfig.permissions] : undefined,
        native: undefined,
        json: false,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--cwd') {
            const value = args[++i];
            if (!value) throw new Error('Missing value for --cwd');
            options.cwd = resolve(value);
        } else if (arg === '--mode') {
            const value = args[++i];
            if (!value) throw new Error('Missing value for --mode');
            options.mode = parseMobileMode(value, '--mode');
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

    options.native = resolveMobileNativeOptions(options.cwd, options.appId, mobileConfig?.native);

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

    createIosScaffold(directory, {
        appId: options.appId,
        appName: options.appName,
    });

    console.log('[mobile] Native scaffold ready. Next steps:');
    console.log('  Configure mobile defaults in elit.config.* under { mobile: { ... } }');
    console.log('  elit build --entry ./src/main.ts --out-dir dist');
    console.log('  elit mobile sync --cwd .');
    console.log('  elit mobile build android --cwd .');
    console.log('  elit mobile run android --cwd .');
}

async function syncMobileAssets(options: MobileCommandOptions): Promise<void> {
    if (options.mode === 'native' && !options.native) {
        throw new Error('mobile.mode="native" requires mobile.native.entry. Use mobile.mode="hybrid" for the WebView shell.');
    }

    const webRoot = resolve(options.cwd, options.webDir);
    const hasWebAssets = existsSync(webRoot);
    const requiresWebAssets = options.mode === 'hybrid' || !options.native;
    if (!hasWebAssets && requiresWebAssets) {
        const hint = options.native
            ? ' Build your app first or switch mobile.mode to "native".'
            : ' Build your app first.';
        throw new Error(`Web directory not found: ${webRoot}.${hint}`);
    }

    if (hasWebAssets) {
        const androidPublic = join(options.cwd, 'android', 'app', 'src', 'main', 'assets', 'public');
        copyDirectory(webRoot, androidPublic);
        console.log(`[mobile] Synced web assets to ${androidPublic}`);
    } else {
        console.log(`[mobile] Skipped web asset sync because ${webRoot} was not found and mobile.mode is "native".`);
    }

    applyAndroidPermissions(options.cwd, options.permissions);

    if (options.icon) {
        applyAndroidIcon(options.cwd, options.icon);
    }

    const iosPublic = join(options.cwd, 'ios', 'App', 'www');
    if (hasWebAssets && existsSync(dirname(iosPublic))) {
        copyDirectory(webRoot, iosPublic);
        console.log(`[mobile] Synced web assets to ${iosPublic}`);
    }

    if (options.native) {
        await syncNativeMobileTargets(options);
    }
}

async function buildMobilePlatform(platform: MobilePlatform, args: string[], options: MobileCommandOptions): Promise<void> {
    await syncMobileAssets(options);

    if (platform === 'android') {
        const release = args.includes('--prod') || args.includes('--release');
        runGradle(options.cwd, [release ? 'assembleRelease' : 'assembleDebug']);
        return;
    }

    if (process.platform !== 'darwin') {
        throw new Error(`iOS build automation requires macOS. Open ${getIosProjectPath(options.cwd)} in Xcode on a Mac.`);
    }

    const projectPath = getIosProjectPath(options.cwd);
    if (!existsSync(projectPath)) {
        throw new Error(`iOS project not found at ${projectPath}. Run \"elit mobile init\" first.`);
    }

    const release = args.includes('--prod') || args.includes('--release');
    const requestedTarget = resolveRequestedTarget(readArgValue(args, '--target'), options.iosTarget);
    const destination = release
        ? (requestedTarget && requestedTarget.includes('platform=') ? requestedTarget : 'generic/platform=iOS')
        : resolveIosBuildDestinationArg(options.cwd, requestedTarget);

    runCommand('xcodebuild', buildIosXcodebuildArgs({
        configuration: release ? 'Release' : 'Debug',
        cwd: options.cwd,
        destination,
        projectPath,
        sdk: release ? 'iphoneos' : 'iphonesimulator',
    }), options.cwd);
}

async function runMobilePlatform(platform: MobilePlatform, args: string[], options: MobileCommandOptions): Promise<void> {
    await syncMobileAssets(options);

    if (platform === 'android') {
        const release = args.includes('--prod') || args.includes('--release');
        const target = resolveRequestedTarget(readArgValue(args, '--target'), options.androidTarget);
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

    if (process.platform !== 'darwin') {
        throw new Error(`iOS run automation requires macOS. Open ${getIosProjectPath(options.cwd)} in Xcode on a Mac.`);
    }

    if (args.includes('--prod') || args.includes('--release')) {
        throw new Error('iOS run automation currently supports Debug simulator builds only. Use "elit mobile build ios --prod" for a release build.');
    }

    const projectPath = getIosProjectPath(options.cwd);
    if (!existsSync(projectPath)) {
        throw new Error(`iOS project not found at ${projectPath}. Run "elit mobile init" first.`);
    }

    const simulator = resolveIosSimulatorDevice(options.cwd, resolveRequestedTarget(readArgValue(args, '--target'), options.iosTarget));
    bootIosSimulatorIfNeeded(options.cwd, simulator);

    runCommand('xcodebuild', buildIosXcodebuildArgs({
        configuration: 'Debug',
        cwd: options.cwd,
        destination: `id=${simulator.udid}`,
        projectPath,
        sdk: 'iphonesimulator',
    }), options.cwd);

    const appPath = getIosBuiltAppPath(options.cwd, 'Debug', 'iphonesimulator');
    if (!existsSync(appPath)) {
        throw new Error(`Built iOS app not found at ${appPath}.`);
    }

    runCommand('xcrun', ['simctl', 'install', simulator.udid, appPath], options.cwd);
    runCommand('xcrun', ['simctl', 'launch', simulator.udid, options.appId], options.cwd);
}

function openMobileProject(platform: MobilePlatform, options: MobileCommandOptions): void {
    if (platform === 'android') {
        const projectPath = join(options.cwd, 'android');
        if (!existsSync(projectPath)) {
            throw new Error(`Android project not found at ${projectPath}. Run "elit mobile init" first.`);
        }

        if (process.platform === 'win32') {
            runCommand('explorer.exe', [projectPath], options.cwd);
            return;
        }

        if (process.platform === 'darwin') {
            runCommand('open', [projectPath], options.cwd);
            return;
        }

        runCommand('xdg-open', [projectPath], options.cwd);
        return;
    }

    const iosPath = getIosProjectPath(options.cwd);
    if (!existsSync(iosPath)) {
        throw new Error(`iOS project not found at ${iosPath}. Run "elit mobile init" first.`);
    }

    if (process.platform === 'darwin') {
        runCommand('open', [iosPath], options.cwd);
        return;
    }

    throw new Error('iOS project opening is available only on macOS.');
}

function runMobileDevices(platform: MobilePlatform, options: MobileCommandOptions): void {
    if (platform === 'android') {
        const devices = listAndroidConnectedDevices(options.cwd);

        if (options.json) {
            console.log(JSON.stringify({ platform: 'android', devices }, null, 2));
            return;
        }

        console.log('[mobile devices] Android devices:');
        if (devices.length === 0) {
            console.log('  No connected Android devices found.');
            return;
        }

        for (const device of devices) {
            console.log(`  - ${device.id} (${device.state})`);
        }
        return;
    }

    if (process.platform !== 'darwin') {
        throw new Error('iOS simulator listing requires macOS.');
    }

    const devices = listIosSimulatorDevices(options.cwd);
    const preferred = pickPreferredIosSimulatorDevice(devices);
    const sorted = [...devices].sort((left, right) => scoreIosSimulatorDevice(right) - scoreIosSimulatorDevice(left));

    if (options.json) {
        console.log(JSON.stringify({
            platform: 'ios',
            preferredDeviceId: preferred?.udid,
            devices: sorted,
        }, null, 2));
        return;
    }

    console.log('[mobile devices] iOS simulators:');
    if (sorted.length === 0) {
        console.log('  No available iOS simulators found.');
        return;
    }

    for (const device of sorted) {
        const preferredLabel = preferred?.udid === device.udid ? ' preferred' : '';
        console.log(`  - ${device.name} [${device.state}] ${device.udid}${preferredLabel}`);
    }
}

function runMobileDoctor(options: MobileCommandOptions): void {
    const checks: MobileDoctorCheck[] = [];
    const resolvedConfigPath = ELIT_CONFIG_FILES
        .map((file) => join(options.cwd, file))
        .find((filePath) => existsSync(filePath));
    const androidRoot = join(options.cwd, 'android');
    const androidSdkPath = detectAndroidSdkPath(options.cwd);
    const gradleCommand = resolveGradleCommand(options.cwd);

    checks.push({
        name: 'Project config (elit.config.*)',
        ok: Boolean(resolvedConfigPath),
        details: resolvedConfigPath
            ? resolvedConfigPath
            : 'Create elit.config.ts|mts|js|mjs|cjs|json and set { mobile: { ... } } defaults.',
    });
    checks.push({
        name: 'Mobile runtime mode',
        ok: options.mode !== 'native' || Boolean(options.native),
        details: options.mode === 'native'
            ? options.native
                ? 'native (generated UI is the primary runtime)'
                : 'mobile.mode="native" requires mobile.native.entry'
            : options.native
                ? 'hybrid (WebView runtime with generated native files kept in sync)'
                : 'hybrid (WebView runtime)',
    });

    checks.push({
        name: 'Gradle (gradle or gradlew)',
        ok: Boolean(gradleCommand),
        details: gradleCommand?.details ?? 'Install Gradle or generate gradle wrapper in android/.',
    });
    checks.push({ name: 'Java JDK (java)', ok: commandExists('java', options.cwd) });
    checks.push({
        name: 'Android SDK (ANDROID_HOME or ANDROID_SDK_ROOT)',
        ok: Boolean(androidSdkPath),
        details: androidSdkPath ?? 'Set ANDROID_HOME/ANDROID_SDK_ROOT or install Android SDK.',
    });
    checks.push({ name: 'ADB (adb)', ok: commandExists('adb', options.cwd) });
    if (options.androidTarget) {
        try {
            const devices = listAndroidConnectedDevices(options.cwd);
            const device = devices.find((item) => item.id === options.androidTarget);
            checks.push({
                name: 'Configured Android target',
                ok: Boolean(device),
                details: device
                    ? `${device.id} (${device.state})`
                    : `Configured target not connected: ${options.androidTarget}`,
            });
        } catch (error) {
            checks.push({
                name: 'Configured Android target',
                ok: false,
                details: error instanceof Error ? error.message : String(error),
            });
        }
    }
    if (options.native) {
        checks.push({
            name: 'Native UI entry',
            ok: existsSync(options.native.entryPath),
            details: options.native.entryPath,
        });
    }
    checks.push({
        name: 'Android scaffold (android/)',
        ok: existsSync(androidRoot),
        details: existsSync(androidRoot) ? androidRoot : 'Run "elit mobile init" first.',
    });

    if (process.platform === 'darwin') {
        checks.push({ name: 'Xcode tools (xcodebuild)', ok: commandExists('xcodebuild', options.cwd) });
        checks.push({ name: 'Xcode runtime tools (xcrun)', ok: commandExists('xcrun', options.cwd) });
        checks.push({ name: 'CocoaPods (pod)', ok: commandExists('pod', options.cwd) });
        try {
            const simulators = listIosSimulatorDevices(options.cwd);
            checks.push({
                name: 'iOS simulators',
                ok: simulators.length > 0,
                details: simulators.length > 0
                    ? `${simulators.length} available (${pickPreferredIosSimulatorDevice(simulators)?.name ?? 'no preferred match'})`
                    : 'Open Xcode and install an iOS simulator runtime.',
            });
        } catch (error) {
            checks.push({
                name: 'iOS simulators',
                ok: false,
                details: error instanceof Error ? error.message : String(error),
            });
        }
        if (options.iosTarget) {
            if (options.iosTarget.includes('platform=')) {
                checks.push({
                    name: 'Configured iOS target',
                    ok: true,
                    details: options.iosTarget,
                });
            } else {
                try {
                    const simulator = resolveIosSimulatorDevice(options.cwd, options.iosTarget);
                    checks.push({
                        name: 'Configured iOS target',
                        ok: true,
                        details: `${simulator.name} (${simulator.udid})`,
                    });
                } catch (error) {
                    checks.push({
                        name: 'Configured iOS target',
                        ok: false,
                        details: error instanceof Error ? error.message : String(error),
                    });
                }
            }
        }
        checks.push({
            name: `iOS project (${IOS_PROJECT_NAME}.xcodeproj)`,
            ok: existsSync(getIosProjectPath(options.cwd)),
            details: existsSync(getIosProjectPath(options.cwd)) ? getIosProjectPath(options.cwd) : 'Run "elit mobile init" first.',
        });
        checks.push({
            name: 'iOS app sources (ios/App)',
            ok: existsSync(getIosAppPath(options.cwd)),
            details: existsSync(getIosAppPath(options.cwd)) ? getIosAppPath(options.cwd) : 'Run "elit mobile init" first.',
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

function resolveCommandPath(command: string, cwd: string, env?: NodeJS.ProcessEnv): string | undefined {
    const checker = process.platform === 'win32' ? 'where' : 'which';
    const result = spawnSync(checker, [command], {
        cwd,
        env,
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

    const gradleCommand = resolveGradleCommand(cwd);
    if (!gradleCommand) {
        throw new Error(
            '[mobile] Gradle not found. Install Gradle and add it to PATH, or generate wrapper files in android/ with "gradle wrapper".',
        );
    }

    const env = gradleCommand.prependPath ? prependCommandPath(gradleCommand.prependPath) : undefined;

    if (process.platform === 'win32' && gradleCommand.useWindowsBatchShell) {
        const shellCommand = gradleCommand.batchCommandPath
            ?? resolveCommandPath(gradleCommand.command, androidRoot, env)
            ?? gradleCommand.command;
        runWindowsBatchCommand(shellCommand, args, androidRoot);
        return;
    }

    runCommand(gradleCommand.command, args, androidRoot, env);
}

function resolveGradleCommand(cwd: string): { command: string; details: string; batchCommandPath?: string; prependPath?: string; useWindowsBatchShell?: boolean } | undefined {
    const androidRoot = join(cwd, 'android');
    const wrapper = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
    const wrapperPath = join(androidRoot, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');

    if (existsSync(wrapperPath)) {
        return {
            command: wrapper,
            batchCommandPath: wrapperPath,
            details: 'Using project gradle wrapper.',
            useWindowsBatchShell: process.platform === 'win32',
        };
    }

    if (commandExists('gradle', androidRoot)) {
        return {
            command: 'gradle',
            batchCommandPath: process.platform === 'win32'
                ? resolveCommandPath('gradle', androidRoot) ?? 'gradle'
                : undefined,
            details: 'Using Gradle from PATH.',
            useWindowsBatchShell: process.platform === 'win32',
        };
    }

    const fallbackGradle = resolveFallbackGradleExecutable();
    if (!fallbackGradle) {
        return undefined;
    }

    const prependPath = process.platform === 'win32' ? dirname(fallbackGradle) : undefined;
    const fallbackEnv = prependPath ? prependCommandPath(prependPath) : undefined;

    return {
        command: process.platform === 'win32' ? 'gradle' : fallbackGradle,
        batchCommandPath: process.platform === 'win32'
            ? resolveCommandPath('gradle', androidRoot, fallbackEnv) ?? undefined
            : undefined,
        details: `Using fallback Gradle at ${fallbackGradle}.`,
        prependPath,
        useWindowsBatchShell: process.platform === 'win32',
    };
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

const WIN_CMD_META_CHARS = new Set(['(', ')', '%', '!', '^', '"', '<', '>', '&', '|']);

function escapeWindowsCmdMetacharacters(value: string): string {
    let escaped = '';
    for (const character of value) {
        escaped += WIN_CMD_META_CHARS.has(character) ? `^${character}` : character;
    }

    return escaped;
}

function quoteWindowsCmdToken(value: string): string {
    let quoted = '"';
    let backslashCount = 0;

    for (const character of value) {
        if (character === '\\') {
            backslashCount += 1;
            continue;
        }

        if (character === '"') {
            quoted += '\\'.repeat((backslashCount * 2) + 1);
            quoted += '"';
            backslashCount = 0;
            continue;
        }

        if (backslashCount > 0) {
            quoted += '\\'.repeat(backslashCount);
            backslashCount = 0;
        }

        quoted += character;
    }

    if (backslashCount > 0) {
        quoted += '\\'.repeat(backslashCount * 2);
    }

    quoted += '"';
    return escapeWindowsCmdMetacharacters(quoted);
}

function prependCommandPath(pathEntry: string): NodeJS.ProcessEnv {
    const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === 'path') ?? 'PATH';
    const currentPath = process.env[pathKey];
    const delimiter = process.platform === 'win32' ? ';' : ':';

    return {
        ...process.env,
        [pathKey]: currentPath && currentPath.length > 0
            ? `${pathEntry}${delimiter}${currentPath}`
            : pathEntry,
    };
}

function runWindowsBatchCommand(command: string, args: string[], cwd: string): void {
    const result = spawnSync(normalize(command), args, {
        cwd,
        stdio: 'inherit',
        shell: false,
    });

    if (typeof result.status === 'number' && result.status !== 0) {
        process.exit(result.status);
    }
}

function runCommand(command: string, args: string[], cwd: string, env?: NodeJS.ProcessEnv): void {
    const normalizedCommand = normalize(command);
    const result = spawnSync(normalizedCommand, args, { cwd, env, stdio: 'inherit', shell: false });

    if (typeof result.status === 'number' && result.status !== 0) {
        process.exit(result.status);
    }
}

function runCommandCapture(command: string, args: string[], cwd: string): string {
    const result = spawnSync(command, args, {
        cwd,
        encoding: 'utf8',
        shell: false,
    });

    if (typeof result.status === 'number' && result.status !== 0) {
        const stderr = String(result.stderr ?? '').trim();
        throw new Error(stderr || `${command} ${args.join(' ')} failed with exit code ${result.status}`);
    }

    return String(result.stdout ?? '');
}

function listAndroidConnectedDevices(cwd: string): AndroidConnectedDevice[] {
    const output = runCommandCapture('adb', ['devices'], cwd);
    return output
        .split(/\r?\n/)
        .slice(1)
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !line.startsWith('*'))
        .map((line) => line.split(/\s+/))
        .filter((parts) => parts.length >= 2)
        .map(([id, state]) => ({ id, state }));
}

export function resolveRequestedTarget(cliTarget?: string, configuredTarget?: string): string | undefined {
    return cliTarget ?? configuredTarget;
}

function readArgValue(args: string[], key: string): string | undefined {
    const index = args.indexOf(key);
    if (index === -1) return undefined;
    return args[index + 1];
}

function parseMobileMode(value: string, source: string): MobileMode {
    if (value === 'native' || value === 'hybrid') {
        return value;
    }

    throw new Error(`Invalid ${source}: ${value}. Expected "native" or "hybrid".`);
}

function getDefaultMobileMode(config?: MobileConfig): MobileMode {
    if (config?.mode) {
        return parseMobileMode(config.mode, 'mobile.mode');
    }

    return config?.native?.entry ? 'native' : 'hybrid';
}

function resolvePlatformMobileMode(mode: MobileMode, nativeEnabled: boolean): MobileMode {
    return mode === 'native' && nativeEnabled ? 'native' : 'hybrid';
}

function resolveMobileNativeOptions(projectRoot: string, appId: string, nativeConfig?: MobileNativeConfig): MobileResolvedNativeOptions | undefined {
    if (!nativeConfig?.entry) {
        return undefined;
    }

    const androidPackageName = nativeConfig.android?.packageName ?? appId;
    return {
        entryPath: resolve(projectRoot, nativeConfig.entry),
        exportName: nativeConfig.exportName,
        android: {
            enabled: nativeConfig.android?.enabled ?? true,
            outputPath: resolve(
                projectRoot,
                nativeConfig.android?.output ?? join('android', 'app', 'src', 'main', 'java', toPackagePath(androidPackageName), `${ANDROID_GENERATED_SCREEN_NAME}.kt`),
            ),
            packageName: androidPackageName,
        },
        ios: {
            enabled: nativeConfig.ios?.enabled ?? true,
            outputPath: resolve(projectRoot, nativeConfig.ios?.output ?? join('ios', 'App', `${IOS_GENERATED_SCREEN_NAME}.swift`)),
        },
    };
}

function toPackagePath(packageName: string): string {
    return packageName.replace(/\./g, '/');
}

function getIosRootPath(projectRoot: string): string {
    return join(projectRoot, 'ios');
}

function getIosAppPath(projectRoot: string): string {
    return join(getIosRootPath(projectRoot), 'App');
}

function getIosProjectPath(projectRoot: string): string {
    return join(getIosRootPath(projectRoot), `${IOS_PROJECT_NAME}.xcodeproj`);
}

function getIosDerivedDataPath(projectRoot: string): string {
    return join(getIosRootPath(projectRoot), IOS_DERIVED_DATA_DIR);
}

export function getIosBuiltAppPath(projectRoot: string, configuration: 'Debug' | 'Release', sdk: 'iphoneos' | 'iphonesimulator'): string {
    return join(
        getIosDerivedDataPath(projectRoot),
        'Build',
        'Products',
        `${configuration}-${sdk}`,
        `${IOS_PROJECT_NAME}.app`,
    );
}

export function buildIosXcodebuildArgs(options: {
    configuration: 'Debug' | 'Release';
    cwd: string;
    destination: string;
    projectPath: string;
    sdk: 'iphoneos' | 'iphonesimulator';
}): string[] {
    return [
        '-project',
        options.projectPath,
        '-target',
        IOS_PROJECT_NAME,
        '-configuration',
        options.configuration,
        '-sdk',
        options.sdk,
        '-derivedDataPath',
        getIosDerivedDataPath(options.cwd),
        '-destination',
        options.destination,
        'build',
    ];
}

function resolveIosBuildDestinationArg(cwd: string, target?: string): string {
    if (!target) {
        const preferred = pickPreferredIosSimulatorDevice(listIosSimulatorDevices(cwd));
        return preferred ? `id=${preferred.udid}` : 'generic/platform=iOS Simulator';
    }

    if (target.includes('platform=')) {
        return target;
    }

    const simulator = resolveIosSimulatorDevice(cwd, target);
    return `id=${simulator.udid}`;
}

function resolveIosSimulatorDevice(cwd: string, target?: string): IosSimulatorDevice {
    const simulators = listIosSimulatorDevices(cwd);
    const available = simulators.filter((device) => device.isAvailable !== false);

    if (available.length === 0) {
        throw new Error('No available iOS simulators found. Open Xcode and install a simulator runtime first.');
    }

    if (!target) {
        const preferred = pickPreferredIosSimulatorDevice(available);
        if (preferred) return preferred;
        throw new Error('No available iOS simulator found. Open Xcode and install a simulator runtime first.');
    }

    if (target === 'booted') {
        const booted = available.find((device) => device.state === 'Booted');
        if (booted) return booted;
        throw new Error('No booted iOS simulator found. Boot one in Simulator.app or pass --target <simulator-name|udid>.');
    }

    const normalizedTarget = target.toLowerCase();
    const exact = available.find((device) => device.udid.toLowerCase() === normalizedTarget || device.name.toLowerCase() === normalizedTarget);
    if (exact) return exact;

    const partial = available.find((device) => device.name.toLowerCase().includes(normalizedTarget));
    if (partial) return partial;

    throw new Error(`iOS simulator not found for target "${target}". Pass a simulator name, UDID, or --target booted.`);
}

function listIosSimulatorDevices(cwd: string): IosSimulatorDevice[] {
    const output = runCommandCapture('xcrun', ['simctl', 'list', 'devices', 'available', '--json'], cwd);
    const parsed = JSON.parse(output) as { devices?: Record<string, Array<Record<string, unknown>>> };
    const devices = Object.values(parsed.devices ?? {}).flat();

    return devices
        .map((device) => ({
            isAvailable: typeof device.isAvailable === 'boolean' ? device.isAvailable : true,
            name: String(device.name ?? ''),
            state: String(device.state ?? ''),
            udid: String(device.udid ?? ''),
        }))
        .filter((device) => Boolean(device.name) && Boolean(device.udid));
}

export function pickPreferredIosSimulatorDevice(devices: IosSimulatorDevice[]): IosSimulatorDevice | undefined {
    return [...devices]
        .filter((device) => device.isAvailable !== false)
        .sort((left, right) => scoreIosSimulatorDevice(right) - scoreIosSimulatorDevice(left))[0];
}

function scoreIosSimulatorDevice(device: IosSimulatorDevice): number {
    let score = 0;
    const normalizedName = device.name.toLowerCase();

    if (device.state === 'Booted') score += 10_000;
    if (normalizedName.startsWith('iphone')) score += 1_000;
    if (normalizedName.includes('pro max')) score += 40;
    else if (normalizedName.includes('pro')) score += 30;
    else if (normalizedName.includes('plus')) score += 20;
    else if (normalizedName.includes('mini')) score += 10;
    else if (normalizedName.includes('se')) score += 5;
    else if (normalizedName.startsWith('ipad')) score += 100;

    const generationMatch = normalizedName.match(/iphone\s+(\d+)/);
    if (generationMatch) {
        score += Number(generationMatch[1]) * 2;
    }

    if (normalizedName.includes('(3rd generation)')) score += 2;
    if (normalizedName.includes('(2nd generation)')) score += 1;

    return score;
}

function bootIosSimulatorIfNeeded(cwd: string, simulator: IosSimulatorDevice): void {
    if (simulator.state === 'Booted') {
        return;
    }

    runCommand('xcrun', ['simctl', 'boot', simulator.udid], cwd);
    runCommand('xcrun', ['simctl', 'bootstatus', simulator.udid, '-b'], cwd);
}

export function renderAndroidMainActivitySource(appId: string, nativePackageName: string): string {
    const importLines = nativePackageName === appId
        ? ''
        : `import ${nativePackageName}.ELIT_USE_NATIVE_UI\nimport ${nativePackageName}.${ANDROID_GENERATED_SCREEN_NAME}\n`;

    return [
        `package ${appId}`,
        '',
        MANAGED_ANDROID_MAIN_ACTIVITY_MARKER,
        'import android.annotation.SuppressLint',
        'import android.os.Bundle',
        'import android.webkit.WebResourceRequest',
        'import android.webkit.WebResourceResponse',
        'import android.webkit.WebSettings',
        'import android.webkit.WebView',
        'import androidx.activity.ComponentActivity',
        'import androidx.activity.compose.setContent',
        'import androidx.compose.foundation.layout.fillMaxSize',
        'import androidx.compose.runtime.Composable',
        'import androidx.compose.ui.Modifier',
        'import androidx.compose.ui.viewinterop.AndroidView',
        'import androidx.webkit.WebViewAssetLoader',
        'import androidx.webkit.WebViewClientCompat',
        importLines.trimEnd(),
        'class MainActivity : ComponentActivity() {',
        '  override fun onCreate(savedInstanceState: Bundle?) {',
        '    super.onCreate(savedInstanceState)',
        '    setContent {',
        '      ElitAppRoot()',
        '    }',
        '  }',
        '}',
        '',
        '@Composable',
        'private fun ElitAppRoot() {',
        '  if (ELIT_USE_NATIVE_UI) {',
        `    ${ANDROID_GENERATED_SCREEN_NAME}()`,
        '    return',
        '  }',
        '',
        '  ElitWebView(modifier = Modifier.fillMaxSize())',
        '}',
        '',
        '@SuppressLint("SetJavaScriptEnabled")',
        '@Composable',
        'private fun ElitWebView(modifier: Modifier = Modifier) {',
        '  AndroidView(',
        '    modifier = modifier,',
        '    factory = { context ->',
        '      val assetLoader = WebViewAssetLoader.Builder()',
        '        .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context))',
        '        .build()',
        '',
        '      WebView(context).apply {',
        '        val webSettings: WebSettings = settings',
        '        webSettings.javaScriptEnabled = true',
        '        webSettings.domStorageEnabled = true',
        '        webViewClient = object : WebViewClientCompat() {',
        '          override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {',
        '            return assetLoader.shouldInterceptRequest(request.url)',
        '          }',
        '        }',
        '        loadUrl("https://appassets.androidplatform.net/assets/public/index.html")',
        '      }',
        '    },',
        '  )',
        '}',
        '',
    ].filter(Boolean).join('\n');
}

function parseManagedAndroidActivityUrl(input: string): string | undefined {
    if (input === 'file:///android_asset/public/index.html') {
        return input;
    }

    try {
        const parsed = new URL(input);
        if (
            parsed.protocol === 'https:'
            && parsed.hostname === 'appassets.androidplatform.net'
            && parsed.pathname === '/assets/public/index.html'
            && !parsed.username
            && !parsed.password
            && !parsed.port
            && !parsed.search
            && !parsed.hash
        ) {
            return parsed.toString();
        }
    } catch {
        return undefined;
    }

    return undefined;
}

function extractAndroidLoadUrlStrings(source: string): string[] {
    const urls: string[] = [];
    const matches = source.matchAll(/\bloadUrl\(\s*(["'])(.*?)\1\s*\)/g);

    for (const match of matches) {
        const value = match[2];
        if (value) {
            urls.push(value);
        }
    }

    return urls;
}

export function isManagedAndroidMainActivitySource(source: string): boolean {
    if (source.includes(MANAGED_ANDROID_MAIN_ACTIVITY_MARKER)) {
        return true;
    }

    for (const value of extractAndroidLoadUrlStrings(source)) {
        const managedUrl = parseManagedAndroidActivityUrl(value);
        if (managedUrl && MANAGED_ANDROID_MAIN_ACTIVITY_URLS.has(managedUrl)) {
            return true;
        }
    }

    return false;
}

export function renderAndroidRuntimeConfigSource(packageName: string, nativeEnabled: boolean): string {
    const runtimeMode = nativeEnabled ? 'native' : 'hybrid';
    return [
        `package ${packageName}`,
        '',
        '// ELIT-MOBILE-RUNTIME-CONFIG',
        `const val ELIT_MOBILE_MODE = "${runtimeMode}"`,
        `const val ELIT_USE_NATIVE_UI = ${nativeEnabled ? 'true' : 'false'}`,
        '',
    ].join('\n');
}

export function renderAndroidGeneratedPlaceholderSource(packageName: string): string {
    return [
        `package ${packageName}`,
        '',
        '// ELIT-MOBILE-GENERATED-SCREEN',
        'import androidx.compose.material3.Text',
        'import androidx.compose.runtime.Composable',
        '',
        '@Composable',
        `fun ${ANDROID_GENERATED_SCREEN_NAME}() {`,
        '  Text("Elit native screen is not generated yet.")',
        '}',
        '',
    ].join('\n');
}

function quotePbxString(value: string): string {
    return JSON.stringify(value);
}

export function renderIosAppSource(): string {
    return [
        'import SwiftUI',
        '',
        '@main',
        `struct ${IOS_PROJECT_NAME}: App {`,
        '    var body: some Scene {',
        '        WindowGroup {',
        '            ElitAppRoot()',
        '        }',
        '    }',
        '}',
        '',
    ].join('\n');
}

export function renderIosAppRootSource(): string {
    return [
        'import SwiftUI',
        '',
        'struct ElitAppRoot: View {',
        '    var body: some View {',
        '        Group {',
        '            if ELIT_USE_NATIVE_UI {',
        `                ${IOS_GENERATED_SCREEN_NAME}()`,
        '            } else if let webURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "www") {',
        '                ElitWebView(url: webURL)',
        '                    .ignoresSafeArea()',
        '            } else {',
        '                VStack(alignment: .leading, spacing: 12) {',
        '                    Text("Elit web bundle not found.")',
        '                    Text("Run elit mobile sync after building your web app.")',
        '                        .foregroundStyle(.secondary)',
        '                }',
        '                .padding(24)',
        '            }',
        '        }',
        '    }',
        '}',
        '',
    ].join('\n');
}

export function renderIosWebViewSource(): string {
    return [
        'import SwiftUI',
        'import WebKit',
        '',
        'struct ElitWebView: UIViewRepresentable {',
        '    let url: URL',
        '',
        '    func makeUIView(context: Context) -> WKWebView {',
        '        let webView = WKWebView(frame: .zero)',
        '        webView.scrollView.bounces = false',
        '        webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())',
        '        return webView',
        '    }',
        '',
        '    func updateUIView(_ webView: WKWebView, context: Context) {',
        '        guard webView.url == nil else { return }',
        '        webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())',
        '    }',
        '}',
        '',
    ].join('\n');
}

export function renderIosRuntimeConfigSource(nativeEnabled: boolean): string {
    const runtimeMode = nativeEnabled ? 'native' : 'hybrid';
    return [
        '// ELIT-MOBILE-RUNTIME-CONFIG',
        `let ELIT_MOBILE_MODE = "${runtimeMode}"`,
        `let ELIT_USE_NATIVE_UI = ${nativeEnabled ? 'true' : 'false'}`,
        '',
    ].join('\n');
}

export function renderIosGeneratedPlaceholderSource(): string {
    return [
        'import SwiftUI',
        '',
        '// ELIT-MOBILE-GENERATED-SCREEN',
        `struct ${IOS_GENERATED_SCREEN_NAME}: View {`,
        '    var body: some View {',
        '        Text("Elit native screen is not generated yet.")',
        '            .padding(24)',
        '    }',
        '}',
        '',
    ].join('\n');
}

function renderIosReadmeSource(): string {
    return [
        'Elit iOS scaffold.',
        '',
        `Open ../${IOS_PROJECT_NAME}.xcodeproj in Xcode to build or run the app.`,
        `The app switches between ./${IOS_GENERATED_SCREEN_NAME}.swift and ./www/index.html using ./${IOS_RUNTIME_CONFIG_NAME}.swift.`,
        '',
    ].join('\n');
}

function renderIosAssetCatalogContentsSource(): string {
    return JSON.stringify({
        info: {
            author: 'xcode',
            version: 1,
        },
    }, null, 2) + '\n';
}

function renderIosAccentColorContentsSource(): string {
    return JSON.stringify({
        colors: [
            {
                color: {
                    'color-space': 'srgb',
                    components: {
                        alpha: '1.000',
                        blue: '0.204',
                        green: '0.467',
                        red: '0.024',
                    },
                },
                idiom: 'universal',
            },
        ],
        info: {
            author: 'xcode',
            version: 1,
        },
    }, null, 2) + '\n';
}

function renderIosWorkspaceDataSource(): string {
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<Workspace version = "1.0">',
        '   <FileRef location = "self:">',
        '   </FileRef>',
        '</Workspace>',
        '',
    ].join('\n');
}

export function renderIosProjectFileSource(app: { appId: string; appName: string }): string {
    return [
        '// !$*UTF8*$!',
        '{',
        '    archiveVersion = 1;',
        '    classes = {};',
        '    objectVersion = 56;',
        '    objects = {',
        '',
        '/* Begin PBXBuildFile section */',
        '        A0000000000000000000000C /* ElitMobileApp.swift in Sources */ = {isa = PBXBuildFile; fileRef = A00000000000000000000004 /* ElitMobileApp.swift */; };',
        '        A0000000000000000000000D /* ElitAppRoot.swift in Sources */ = {isa = PBXBuildFile; fileRef = A00000000000000000000005 /* ElitAppRoot.swift */; };',
        '        A0000000000000000000000E /* ElitWebView.swift in Sources */ = {isa = PBXBuildFile; fileRef = A00000000000000000000006 /* ElitWebView.swift */; };',
        '        A0000000000000000000000F /* ElitRuntimeConfig.swift in Sources */ = {isa = PBXBuildFile; fileRef = A00000000000000000000007 /* ElitRuntimeConfig.swift */; };',
        '        A00000000000000000000010 /* ElitGeneratedScreen.swift in Sources */ = {isa = PBXBuildFile; fileRef = A00000000000000000000008 /* ElitGeneratedScreen.swift */; };',
        '        A00000000000000000000011 /* Assets.xcassets in Resources */ = {isa = PBXBuildFile; fileRef = A00000000000000000000009 /* Assets.xcassets */; };',
        '        A00000000000000000000012 /* www in Resources */ = {isa = PBXBuildFile; fileRef = A0000000000000000000000A /* www */; };',
        '/* End PBXBuildFile section */',
        '',
        '/* Begin PBXFileReference section */',
        '        A00000000000000000000004 /* ElitMobileApp.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ElitMobileApp.swift; sourceTree = "<group>"; };',
        '        A00000000000000000000005 /* ElitAppRoot.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ElitAppRoot.swift; sourceTree = "<group>"; };',
        '        A00000000000000000000006 /* ElitWebView.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ElitWebView.swift; sourceTree = "<group>"; };',
        '        A00000000000000000000007 /* ElitRuntimeConfig.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ElitRuntimeConfig.swift; sourceTree = "<group>"; };',
        '        A00000000000000000000008 /* ElitGeneratedScreen.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ElitGeneratedScreen.swift; sourceTree = "<group>"; };',
        '        A00000000000000000000009 /* Assets.xcassets */ = {isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Assets.xcassets; sourceTree = "<group>"; };',
        '        A0000000000000000000000A /* www */ = {isa = PBXFileReference; lastKnownFileType = folder; path = www; sourceTree = "<group>"; };',
        '        A0000000000000000000000B /* ElitMobileApp.app */ = {isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = ElitMobileApp.app; sourceTree = BUILT_PRODUCTS_DIR; };',
        '/* End PBXFileReference section */',
        '',
        '/* Begin PBXFrameworksBuildPhase section */',
        '        A00000000000000000000013 /* Frameworks */ = {',
        '            isa = PBXFrameworksBuildPhase;',
        '            buildActionMask = 2147483647;',
        '            files = ();',
        '            runOnlyForDeploymentPostprocessing = 0;',
        '        };',
        '/* End PBXFrameworksBuildPhase section */',
        '',
        '/* Begin PBXGroup section */',
        '        A00000000000000000000001 = {',
        '            isa = PBXGroup;',
        '            children = (',
        '                A00000000000000000000002 /* App */,',
        '                A00000000000000000000003 /* Products */,',
        '            );',
        '            sourceTree = "<group>";',
        '        };',
        '        A00000000000000000000002 /* App */ = {',
        '            isa = PBXGroup;',
        '            children = (',
        '                A00000000000000000000004 /* ElitMobileApp.swift */,',
        '                A00000000000000000000005 /* ElitAppRoot.swift */,',
        '                A00000000000000000000006 /* ElitWebView.swift */,',
        '                A00000000000000000000007 /* ElitRuntimeConfig.swift */,',
        '                A00000000000000000000008 /* ElitGeneratedScreen.swift */,',
        '                A00000000000000000000009 /* Assets.xcassets */,',
        '                A0000000000000000000000A /* www */,',
        '            );',
        '            path = App;',
        '            sourceTree = "<group>";',
        '        };',
        '        A00000000000000000000003 /* Products */ = {',
        '            isa = PBXGroup;',
        '            children = (',
        '                A0000000000000000000000B /* ElitMobileApp.app */,',
        '            );',
        '            name = Products;',
        '            sourceTree = "<group>";',
        '        };',
        '/* End PBXGroup section */',
        '',
        '/* Begin PBXNativeTarget section */',
        '        A00000000000000000000016 /* ElitMobileApp */ = {',
        '            isa = PBXNativeTarget;',
        '            buildConfigurationList = A00000000000000000000019 /* Build configuration list for PBXNativeTarget "ElitMobileApp" */;',
        '            buildPhases = (',
        '                A00000000000000000000015 /* Sources */,',
        '                A00000000000000000000013 /* Frameworks */,',
        '                A00000000000000000000014 /* Resources */,',
        '            );',
        '            buildRules = ();',
        '            dependencies = ();',
        '            name = ElitMobileApp;',
        '            productName = ElitMobileApp;',
        '            productReference = A0000000000000000000000B /* ElitMobileApp.app */;',
        '            productType = "com.apple.product-type.application";',
        '        };',
        '/* End PBXNativeTarget section */',
        '',
        '/* Begin PBXProject section */',
        '        A00000000000000000000017 /* Project object */ = {',
        '            isa = PBXProject;',
        '            attributes = {',
        '                BuildIndependentTargetsInParallel = 1;',
        '                LastSwiftUpdateCheck = 1600;',
        '                LastUpgradeCheck = 1600;',
        '                TargetAttributes = {',
        '                    A00000000000000000000016 = {',
        '                        CreatedOnToolsVersion = 16.0;',
        '                    };',
        '                };',
        '            };',
        '            buildConfigurationList = A00000000000000000000018 /* Build configuration list for PBXProject "ElitMobileApp" */;',
        '            compatibilityVersion = "Xcode 15.0";',
        '            developmentRegion = en;',
        '            hasScannedForEncodings = 0;',
        '            knownRegions = (',
        '                en,',
        '                Base,',
        '            );',
        '            mainGroup = A00000000000000000000001;',
        '            productRefGroup = A00000000000000000000003 /* Products */;',
        '            projectDirPath = "";',
        '            projectRoot = "";',
        '            targets = (',
        '                A00000000000000000000016 /* ElitMobileApp */,',
        '            );',
        '        };',
        '/* End PBXProject section */',
        '',
        '/* Begin PBXResourcesBuildPhase section */',
        '        A00000000000000000000014 /* Resources */ = {',
        '            isa = PBXResourcesBuildPhase;',
        '            buildActionMask = 2147483647;',
        '            files = (',
        '                A00000000000000000000011 /* Assets.xcassets in Resources */,',
        '                A00000000000000000000012 /* www in Resources */,',
        '            );',
        '            runOnlyForDeploymentPostprocessing = 0;',
        '        };',
        '/* End PBXResourcesBuildPhase section */',
        '',
        '/* Begin PBXSourcesBuildPhase section */',
        '        A00000000000000000000015 /* Sources */ = {',
        '            isa = PBXSourcesBuildPhase;',
        '            buildActionMask = 2147483647;',
        '            files = (',
        '                A0000000000000000000000C /* ElitMobileApp.swift in Sources */,',
        '                A0000000000000000000000D /* ElitAppRoot.swift in Sources */,',
        '                A0000000000000000000000E /* ElitWebView.swift in Sources */,',
        '                A0000000000000000000000F /* ElitRuntimeConfig.swift in Sources */,',
        '                A00000000000000000000010 /* ElitGeneratedScreen.swift in Sources */,',
        '            );',
        '            runOnlyForDeploymentPostprocessing = 0;',
        '        };',
        '/* End PBXSourcesBuildPhase section */',
        '',
        '/* Begin XCBuildConfiguration section */',
        '        A0000000000000000000001A /* Debug */ = {',
        '            isa = XCBuildConfiguration;',
        '            buildSettings = {',
        '                CLANG_ENABLE_MODULES = YES;',
        '                ENABLE_USER_SCRIPT_SANDBOXING = YES;',
        '            };',
        '            name = Debug;',
        '        };',
        '        A0000000000000000000001B /* Release */ = {',
        '            isa = XCBuildConfiguration;',
        '            buildSettings = {',
        '                CLANG_ENABLE_MODULES = YES;',
        '                ENABLE_USER_SCRIPT_SANDBOXING = YES;',
        '            };',
        '            name = Release;',
        '        };',
        '        A0000000000000000000001C /* Debug */ = {',
        '            isa = XCBuildConfiguration;',
        '            buildSettings = {',
        '                ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;',
        '                CODE_SIGN_STYLE = Automatic;',
        '                CURRENT_PROJECT_VERSION = 1;',
        '                DEVELOPMENT_TEAM = "";',
        '                GENERATE_INFOPLIST_FILE = YES;',
        `                INFOPLIST_KEY_CFBundleDisplayName = ${quotePbxString(app.appName)};`,
        '                INFOPLIST_KEY_UIApplicationSceneManifest_Generation = YES;',
        '                INFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents = YES;',
        '                INFOPLIST_KEY_UILaunchScreen_Generation = YES;',
        '                INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad = "UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";',
        '                INFOPLIST_KEY_UISupportedInterfaceOrientations_iPhone = "UIInterfaceOrientationPortrait UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";',
        '                IPHONEOS_DEPLOYMENT_TARGET = 15.0;',
        '                LD_RUNPATH_SEARCH_PATHS = (',
        '                    "$(inherited)",',
        '                    "@executable_path/Frameworks",',
        '                );',
        '                MARKETING_VERSION = 1.0;',
        `                PRODUCT_BUNDLE_IDENTIFIER = ${app.appId};`,
        '                PRODUCT_NAME = "$(TARGET_NAME)";',
        '                SDKROOT = iphoneos;',
        '                SUPPORTED_PLATFORMS = "iphoneos iphonesimulator";',
        '                SWIFT_EMIT_LOC_STRINGS = YES;',
        '                SWIFT_OPTIMIZATION_LEVEL = "-Onone";',
        '                SWIFT_VERSION = 5.0;',
        '                TARGETED_DEVICE_FAMILY = "1,2";',
        '            };',
        '            name = Debug;',
        '        };',
        '        A0000000000000000000001D /* Release */ = {',
        '            isa = XCBuildConfiguration;',
        '            buildSettings = {',
        '                ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;',
        '                CODE_SIGN_STYLE = Automatic;',
        '                CURRENT_PROJECT_VERSION = 1;',
        '                DEVELOPMENT_TEAM = "";',
        '                GENERATE_INFOPLIST_FILE = YES;',
        `                INFOPLIST_KEY_CFBundleDisplayName = ${quotePbxString(app.appName)};`,
        '                INFOPLIST_KEY_UIApplicationSceneManifest_Generation = YES;',
        '                INFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents = YES;',
        '                INFOPLIST_KEY_UILaunchScreen_Generation = YES;',
        '                INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad = "UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";',
        '                INFOPLIST_KEY_UISupportedInterfaceOrientations_iPhone = "UIInterfaceOrientationPortrait UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";',
        '                IPHONEOS_DEPLOYMENT_TARGET = 15.0;',
        '                LD_RUNPATH_SEARCH_PATHS = (',
        '                    "$(inherited)",',
        '                    "@executable_path/Frameworks",',
        '                );',
        '                MARKETING_VERSION = 1.0;',
        `                PRODUCT_BUNDLE_IDENTIFIER = ${app.appId};`,
        '                PRODUCT_NAME = "$(TARGET_NAME)";',
        '                SDKROOT = iphoneos;',
        '                SUPPORTED_PLATFORMS = "iphoneos iphonesimulator";',
        '                SWIFT_EMIT_LOC_STRINGS = YES;',
        '                SWIFT_VERSION = 5.0;',
        '                TARGETED_DEVICE_FAMILY = "1,2";',
        '            };',
        '            name = Release;',
        '        };',
        '/* End XCBuildConfiguration section */',
        '',
        '/* Begin XCConfigurationList section */',
        '        A00000000000000000000018 /* Build configuration list for PBXProject "ElitMobileApp" */ = {',
        '            isa = XCConfigurationList;',
        '            buildConfigurations = (',
        '                A0000000000000000000001A /* Debug */,',
        '                A0000000000000000000001B /* Release */,',
        '            );',
        '            defaultConfigurationIsVisible = 0;',
        '            defaultConfigurationName = Release;',
        '        };',
        '        A00000000000000000000019 /* Build configuration list for PBXNativeTarget "ElitMobileApp" */ = {',
        '            isa = XCConfigurationList;',
        '            buildConfigurations = (',
        '                A0000000000000000000001C /* Debug */,',
        '                A0000000000000000000001D /* Release */,',
        '            );',
        '            defaultConfigurationIsVisible = 0;',
        '            defaultConfigurationName = Release;',
        '        };',
        '/* End XCConfigurationList section */',
        '    };',
        '    rootObject = A00000000000000000000017 /* Project object */;',
        '}',
        '',
    ].join('\n');
}

function ensureAndroidComposeBuildSupport(projectRoot: string): void {
    const buildGradlePath = join(projectRoot, 'android', 'app', 'build.gradle');
    if (!existsSync(buildGradlePath)) {
        return;
    }

    let content = readFileSync(buildGradlePath, 'utf8');
    let changed = false;

    if (!/compose\s+true/.test(content)) {
        const next = content.replace(
            /\n}\n\ndependencies\s*\{/,
            "\n\n  buildFeatures {\n    compose true\n  }\n\n  composeOptions {\n    kotlinCompilerExtensionVersion '1.5.14'\n  }\n}\n\ndependencies {",
        );
        if (next !== content) {
            content = next;
            changed = true;
        }
    }

    const dependencyLines = [
        "implementation 'androidx.activity:activity-compose:1.9.2'",
        "implementation 'androidx.compose.foundation:foundation-layout:1.7.2'",
        "implementation 'androidx.compose.ui:ui:1.7.2'",
        "implementation 'androidx.compose.ui:ui-tooling-preview:1.7.2'",
        "implementation 'androidx.compose.material3:material3:1.3.0'",
        "implementation 'androidx.webkit:webkit:1.11.0'",
        "debugImplementation 'androidx.compose.ui:ui-tooling:1.7.2'",
    ];

    for (const dependencyLine of dependencyLines) {
        if (content.includes(dependencyLine)) {
            continue;
        }

        const next = content.replace(/dependencies\s*\{\n/, (match) => `${match}  ${dependencyLine}\n`);
        if (next !== content) {
            content = next;
            changed = true;
        }
    }

    if (changed) {
        writeFileSync(buildGradlePath, content, 'utf8');
    }
}

function ensureManagedAndroidMainActivity(projectRoot: string, appId: string, nativePackageName: string): boolean {
    const mainActivityPath = join(projectRoot, 'android', 'app', 'src', 'main', 'java', toPackagePath(appId), 'MainActivity.kt');
    const nextContent = renderAndroidMainActivitySource(appId, nativePackageName);

    if (!existsSync(mainActivityPath)) {
        mkdirSync(dirname(mainActivityPath), { recursive: true });
        writeFileSync(mainActivityPath, nextContent, 'utf8');
        return true;
    }

    const current = readFileSync(mainActivityPath, 'utf8');
    if (current === nextContent) {
        return true;
    }

    if (isManagedAndroidMainActivitySource(current)) {
        writeFileSync(mainActivityPath, nextContent, 'utf8');
        return true;
    }

    return false;
}

function writeAndroidRuntimeSupportFiles(runtimeConfigPath: string, generatedScreenPath: string, packageName: string, nativeEnabled: boolean, generatedScreenContent?: string): void {
    mkdirSync(dirname(runtimeConfigPath), { recursive: true });
    mkdirSync(dirname(generatedScreenPath), { recursive: true });
    writeFileSync(runtimeConfigPath, renderAndroidRuntimeConfigSource(packageName, nativeEnabled), 'utf8');
    writeFileSync(generatedScreenPath, generatedScreenContent ?? renderAndroidGeneratedPlaceholderSource(packageName), 'utf8');
}

function writeIosRuntimeSupportFiles(runtimeConfigPath: string, generatedScreenPath: string, nativeEnabled: boolean, generatedScreenContent?: string): void {
    mkdirSync(dirname(runtimeConfigPath), { recursive: true });
    mkdirSync(dirname(generatedScreenPath), { recursive: true });
    writeFileSync(runtimeConfigPath, renderIosRuntimeConfigSource(nativeEnabled), 'utf8');
    writeFileSync(generatedScreenPath, generatedScreenContent ?? renderIosGeneratedPlaceholderSource(), 'utf8');
}

async function syncNativeMobileTargets(options: MobileCommandOptions): Promise<void> {
    if (!options.native) {
        return;
    }

    const androidRoot = join(options.cwd, 'android');
    if (existsSync(androidRoot)) {
        ensureAndroidComposeBuildSupport(options.cwd);
        const androidRuntimeMode = resolvePlatformMobileMode(options.mode, options.native.android.enabled);

        const mainActivityManaged = ensureManagedAndroidMainActivity(
            options.cwd,
            options.appId,
            options.native.android.packageName,
        );

        if (options.native.android.enabled) {
            const composeSource = await generateNativeEntryOutput({
                entryPath: options.native.entryPath,
                exportName: options.native.exportName,
                includePreview: false,
                name: ANDROID_GENERATED_SCREEN_NAME,
                packageName: options.native.android.packageName,
                target: 'android',
            });

            const runtimeConfigPath = join(
                options.cwd,
                'android',
                'app',
                'src',
                'main',
                'java',
                toPackagePath(options.native.android.packageName),
                `${ANDROID_RUNTIME_CONFIG_NAME}.kt`,
            );
            writeAndroidRuntimeSupportFiles(
                runtimeConfigPath,
                options.native.android.outputPath,
                options.native.android.packageName,
                androidRuntimeMode === 'native',
                composeSource,
            );
            console.log(`[mobile] Synced native Android UI to ${options.native.android.outputPath}`);
            if (androidRuntimeMode === 'hybrid') {
                console.log('[mobile] Android runtime mode is hybrid; keeping WebView fallback active.');
            }

            if (!mainActivityManaged) {
                console.warn('[mobile] MainActivity.kt no longer matches the managed scaffold. Import ELIT_USE_NATIVE_UI and ElitGeneratedScreen manually to preserve mode switching in your custom activity.');
            }
        } else {
            const runtimeConfigPath = join(
                options.cwd,
                'android',
                'app',
                'src',
                'main',
                'java',
                toPackagePath(options.native.android.packageName),
                `${ANDROID_RUNTIME_CONFIG_NAME}.kt`,
            );
            writeAndroidRuntimeSupportFiles(
                runtimeConfigPath,
                options.native.android.outputPath,
                options.native.android.packageName,
                false,
            );
            console.log('[mobile] Android native UI disabled in config; keeping WebView fallback active.');
        }
    }

    if (options.native.ios.enabled) {
        const iosRoot = getIosAppPath(options.cwd);
        if (existsSync(iosRoot)) {
            createIosScaffold(options.cwd, {
                appId: options.appId,
                appName: options.appName,
            });
            const iosRuntimeMode = resolvePlatformMobileMode(options.mode, options.native.ios.enabled);

            const swiftSource = await generateNativeEntryOutput({
                entryPath: options.native.entryPath,
                exportName: options.native.exportName,
                includePreview: false,
                name: IOS_GENERATED_SCREEN_NAME,
                target: 'ios',
            });

            const defaultGeneratedScreenPath = join(getIosAppPath(options.cwd), `${IOS_GENERATED_SCREEN_NAME}.swift`);
            const runtimeConfigPath = join(getIosAppPath(options.cwd), `${IOS_RUNTIME_CONFIG_NAME}.swift`);
            writeIosRuntimeSupportFiles(runtimeConfigPath, defaultGeneratedScreenPath, iosRuntimeMode === 'native', swiftSource);
            if (options.native.ios.outputPath !== defaultGeneratedScreenPath) {
                mkdirSync(dirname(options.native.ios.outputPath), { recursive: true });
                writeFileSync(options.native.ios.outputPath, swiftSource, 'utf8');
            }
            console.log(`[mobile] Synced native iOS UI to ${options.native.ios.outputPath}`);
            if (iosRuntimeMode === 'hybrid') {
                console.log('[mobile] iOS runtime mode is hybrid; keeping WebView fallback active.');
            }
        }
    } else {
        const iosRoot = getIosAppPath(options.cwd);
        if (existsSync(iosRoot)) {
            createIosScaffold(options.cwd, {
                appId: options.appId,
                appName: options.appName,
            });
            const defaultGeneratedScreenPath = join(getIosAppPath(options.cwd), `${IOS_GENERATED_SCREEN_NAME}.swift`);
            const runtimeConfigPath = join(getIosAppPath(options.cwd), `${IOS_RUNTIME_CONFIG_NAME}.swift`);
            writeIosRuntimeSupportFiles(runtimeConfigPath, defaultGeneratedScreenPath, false);
        }
    }
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
                "  kotlinOptions { jvmTarget = '17' }\n\n" +
                "  buildFeatures {\n" +
                "    compose true\n" +
                "  }\n\n" +
                "  composeOptions {\n" +
                "    kotlinCompilerExtensionVersion '1.5.14'\n" +
                "  }\n" +
                "}\n\n" +
                "dependencies {\n" +
                "  implementation 'androidx.activity:activity-compose:1.9.2'\n" +
                "  implementation 'androidx.compose.foundation:foundation-layout:1.7.2'\n" +
                "  implementation 'androidx.compose.ui:ui:1.7.2'\n" +
                "  implementation 'androidx.compose.ui:ui-tooling-preview:1.7.2'\n" +
                "  implementation 'androidx.compose.material3:material3:1.3.0'\n" +
                "  implementation 'androidx.webkit:webkit:1.11.0'\n" +
                "  implementation 'androidx.core:core-ktx:1.13.1'\n" +
                "  implementation 'androidx.appcompat:appcompat:1.7.0'\n" +
                "  debugImplementation 'androidx.compose.ui:ui-tooling:1.7.2'\n" +
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
            content: renderAndroidMainActivitySource(app.appId, app.appId),
        },
        {
            path: join(kotlinDir, `${ANDROID_RUNTIME_CONFIG_NAME}.kt`),
            content: renderAndroidRuntimeConfigSource(app.appId, false),
        },
        {
            path: join(kotlinDir, `${ANDROID_GENERATED_SCREEN_NAME}.kt`),
            content: renderAndroidGeneratedPlaceholderSource(app.appId),
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

function createIosScaffold(directory: string, app: { appId: string; appName: string }): void {
    const iosRoot = getIosRootPath(directory);
    const iosAppRoot = getIosAppPath(directory);
    const iosProjectRoot = getIosProjectPath(directory);

    const files: Array<{ path: string; content: string; replacePlaceholder?: boolean }> = [
        {
            path: join(iosAppRoot, 'README.md'),
            content: renderIosReadmeSource(),
            replacePlaceholder: true,
        },
        {
            path: join(iosAppRoot, 'ElitMobileApp.swift'),
            content: renderIosAppSource(),
        },
        {
            path: join(iosAppRoot, 'ElitAppRoot.swift'),
            content: renderIosAppRootSource(),
        },
        {
            path: join(iosAppRoot, 'ElitWebView.swift'),
            content: renderIosWebViewSource(),
        },
        {
            path: join(iosAppRoot, `${IOS_RUNTIME_CONFIG_NAME}.swift`),
            content: renderIosRuntimeConfigSource(false),
        },
        {
            path: join(iosAppRoot, `${IOS_GENERATED_SCREEN_NAME}.swift`),
            content: renderIosGeneratedPlaceholderSource(),
        },
        {
            path: join(iosAppRoot, 'Assets.xcassets', 'Contents.json'),
            content: renderIosAssetCatalogContentsSource(),
        },
        {
            path: join(iosAppRoot, 'Assets.xcassets', 'AccentColor.colorset', 'Contents.json'),
            content: renderIosAccentColorContentsSource(),
        },
        {
            path: join(iosProjectRoot, 'project.pbxproj'),
            content: renderIosProjectFileSource(app),
        },
        {
            path: join(iosProjectRoot, 'project.xcworkspace', 'contents.xcworkspacedata'),
            content: renderIosWorkspaceDataSource(),
        },
    ];

    for (const file of files) {
        if (!existsSync(dirname(file.path))) {
            mkdirSync(dirname(file.path), { recursive: true });
        }

        const shouldReplace = file.replacePlaceholder && existsSync(file.path)
            && readFileSync(file.path, 'utf8').includes('placeholder');

        if (!existsSync(file.path) || shouldReplace) {
            writeFileSync(file.path, file.content, 'utf8');
            console.log(`[mobile] Created ${file.path}`);
        }
    }

    const iosPublic = join(iosAppRoot, 'www');
    if (!existsSync(iosPublic)) {
        mkdirSync(iosPublic, { recursive: true });
        writeFileSync(join(iosPublic, '.gitkeep'), '');
    }

    if (!existsSync(iosRoot)) {
        mkdirSync(iosRoot, { recursive: true });
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
    // First escape backslashes, then escape single quotes
    return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function printMobileHelp(): void {
    console.log(`
Mobile command (native app workflow owned by elit)

Usage:
    elit mobile init [directory] [--app-id id] [--app-name name] [--web-dir dist] [--icon ./icon.png] [--permission android.permission.CAMERA]
    elit mobile doctor [--cwd dir] [--mode native|hybrid] [--json]
    elit mobile devices android|ios [--cwd dir] [--json]
    elit mobile sync [--cwd dir] [--mode native|hybrid] [--web-dir dist] [--icon ./icon.png] [--permission android.permission.CAMERA]
    elit mobile open android|ios
    elit mobile run android|ios [--cwd dir] [--mode native|hybrid] [--web-dir dist] [--icon ./icon.png] [--permission android.permission.CAMERA] [--target <id|name|booted>] [--prod]
    elit mobile build android|ios [--cwd dir] [--mode native|hybrid] [--web-dir dist] [--icon ./icon.png] [--permission android.permission.CAMERA] [--target <id|name|booted>] [--prod]

Notes:
    - No external mobile framework is required.
    - Android scaffold can run either WebView assets or generated Compose UI.
    - Set mobile.native.entry in elit.config.* to auto-generate Android Compose and iOS SwiftUI during sync/build/run.
    - Set mobile.mode to native or hybrid. When omitted, projects with mobile.native.entry default to native; otherwise they default to hybrid.
    - If mobile.mode is native and mobile.native.entry is set, sync can still continue when the web build is missing.
    - iOS scaffold now creates ${IOS_PROJECT_NAME}.xcodeproj and SwiftUI/WebView source files under ios/App.
    - iOS build automation uses xcodebuild on macOS.
    - iOS run automation uses xcrun simctl on macOS and accepts --target booted, a simulator name, or a simulator UDID.
    - Without --target, iOS run prefers a booted simulator and otherwise falls back to the best available iPhone simulator.
    - Use "elit mobile devices ios --json" to inspect available iOS simulators and the preferred fallback choice.
    - Run "elit mobile doctor --json" for CI-friendly machine-readable checks.
    - Set default values in elit.config.* under { mobile: { cwd, appId, appName, webDir, mode, icon, permissions, android, ios, native } }.
     - Use mobile.android.target or mobile.ios.target when you want a default device or simulator without repeating --target.
    - Android permissions can be set by config mobile.permissions or repeated --permission flags.
    - Android icon expects a .png or .webp file path.
`);
}
