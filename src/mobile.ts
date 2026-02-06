/**
 * Mobile build module for Capacitor-based native apps (Android & iOS)
 * Pure implementation with cross-runtime support
 * - Uses Capacitor CLI for native project management
 * - Auto-installs dependencies during init
 * - Supports both Android and iOS platforms
 */

import { existsSync, writeFileSync, readFileSync } from './fs';
import { resolve } from './path';
import type { MobileConfig, MobilePlatform } from './types';

/**
 * Helper: Execute command and capture output
 */
async function execCommand(command: string, args: string[], cwd: string): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
    const { spawn } = await import('child_process');

    return new Promise((resolveExec) => {
        let stdout = '';
        let stderr = '';

        const proc = spawn(command, args, {
            cwd,
            env: { ...process.env }
        });

        proc.stdout?.on('data', (data: Buffer) => {
            stdout += data.toString();
        });

        proc.stderr?.on('data', (data: Buffer) => {
            stderr += data.toString();
        });

        proc.on('close', (code: number | null) => {
            resolveExec({ stdout, stderr, exitCode: code });
        });

        proc.on('error', (error: Error) => {
            stderr += error.message;
            resolveExec({ stdout, stderr, exitCode: -1 });
        });
    });
}

/**
 * Helper: Check if a package is installed
 */
async function isPackageInstalled(packageName: string, cwd: string): Promise<boolean> {
    const packageJsonPath = resolve(cwd, 'package.json');
    if (!existsSync(packageJsonPath)) {
        return false;
    }

    try {
        const content = readFileSync(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(typeof content === 'string' ? content : content.toString('utf-8'));
        return !!(
            packageJson.dependencies?.[packageName] ||
            packageJson.devDependencies?.[packageName] ||
            packageJson.optionalDependencies?.[packageName]
        );
    } catch {
        return false;
    }
}

/**
 * Helper: Install npm packages
 */
async function installPackages(packages: string[], cwd: string, logging?: boolean): Promise<boolean> {
    const packageManager = await detectPackageManager(cwd);
    const command = packageManager === 'yarn' ? 'yarn' : packageManager === 'pnpm' ? 'pnpm' : 'npm';
    const args = packageManager === 'yarn'
        ? ['add', '-D', ...packages]
        : packageManager === 'pnpm'
        ? ['add', '-D', ...packages]
        : ['install', '--save-dev', ...packages];

    if (logging) {
        console.log(`\n📦 Installing Capacitor packages...`);
        console.log(`  Command: ${command} ${args.join(' ')}`);
    }

    const result = await execCommand(command, args, cwd);

    if (result.exitCode !== 0) {
        if (logging) {
            console.error(`  ✗ Failed to install packages`);
            console.error(`  ${result.stderr}`);
        }
        return false;
    }

    if (logging) {
        console.log(`  ✓ Packages installed successfully`);
    }

    return true;
}

/**
 * Helper: Detect package manager
 */
async function detectPackageManager(cwd: string): Promise<'npm' | 'yarn' | 'pnpm'> {
    // Check for yarn.lock
    if (existsSync(resolve(cwd, 'yarn.lock'))) {
        return 'yarn';
    }
    // Check for pnpm-lock.yaml
    if (existsSync(resolve(cwd, 'pnpm-lock.yaml'))) {
        return 'pnpm';
    }
    // Default to npm
    return 'npm';
}

/**
 * Helper: Check if Capacitor CLI is available
 */
async function checkCapacitorCLI(cwd: string): Promise<boolean> {
    try {
        // Check if @capacitor/cli is installed
        const installed = await isPackageInstalled('@capacitor/cli', cwd);
        if (!installed) {
            return false;
        }

        // Try to run npx cap --version
        const result = await execCommand('npx', ['cap', '--version'], cwd);
        return result.exitCode === 0;
    } catch {
        return false;
    }
}

/**
 * Helper: Generate Capacitor config
 */
function generateCapacitorConfig(config: MobileConfig): string {
    const appId = config.appId || 'com.elit.app';
    const appName = config.appName || 'Elit App';
    const webDir = config.webDir || 'dist';

    return `import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: '${appId}',
  appName: '${appName}',
  webDir: '${webDir}',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: true
  }
};

export default config;
`;
}

/**
 * Helper: Check platform requirements
 */
async function checkPlatformRequirements(platform: MobilePlatform): Promise<{
    valid: boolean;
    message?: string;
}> {
    if (platform === 'android') {
        // Check for Java
        const javaResult = await execCommand('java', ['-version'], process.cwd());
        if (javaResult.exitCode !== 0) {
            return {
                valid: false,
                message: 'Java JDK is not installed. Please install JDK 17 or higher.'
            };
        }

        // Check for Android SDK via ANDROID_HOME
        const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
        if (!androidHome || !existsSync(androidHome)) {
            return {
                valid: false,
                message: 'Android SDK is not found. Please install Android Studio or set ANDROID_HOME environment variable.'
            };
        }

        return { valid: true };
    }

    if (platform === 'ios') {
        // Check if running on macOS
        if (process.platform !== 'darwin') {
            return {
                valid: false,
                message: 'iOS development requires macOS. Please use a Mac to build iOS apps.'
            };
        }

        // Check for Xcode
        const xcodeResult = await execCommand('xcodebuild', ['-version'], process.cwd());
        if (xcodeResult.exitCode !== 0) {
            return {
                valid: false,
                message: 'Xcode is not installed. Please install Xcode from the App Store.'
            };
        }

        // Check for CocoaPods
        const podsResult = await execCommand('pod', ['--version'], process.cwd());
        if (podsResult.exitCode !== 0) {
            return {
                valid: false,
                message: 'CocoaPods is not installed. Run: sudo gem install cocoapods'
            };
        }

        return { valid: true };
    }

    return { valid: true };
}

/**
 * Mobile init options
 */
export interface MobileInitOptions {
    cwd: string;
    config: MobileConfig;
    platforms?: MobilePlatform[];
    logging?: boolean;
}

/**
 * Mobile sync options
 */
export interface MobileSyncOptions {
    cwd: string;
    config: MobileConfig;
    platforms?: MobilePlatform[];
    logging?: boolean;
}

/**
 * Mobile build options
 */
export interface MobileBuildOptions {
    cwd: string;
    config: MobileConfig;
    platform: MobilePlatform;
    target?: 'debug' | 'release';
    outputType?: 'apk' | 'aab' | 'ipa';
    logging?: boolean;
}

/**
 * Initialize mobile project with Capacitor
 * - Installs Capacitor dependencies
 * - Creates capacitor.config.ts
 * - Adds platforms
 */
export async function initMobile(options: MobileInitOptions): Promise<void> {
    const { cwd, config, platforms = ['android'], logging = true } = options;

    if (logging) {
        console.log('\n📱 Initializing mobile project...');
    }

    // Check if Capacitor CLI is installed
    const hasCapacitor = await checkCapacitorCLI(cwd);
    if (!hasCapacitor) {
        if (logging) {
            console.log('  Capacitor not found. Installing...');
        }

        // Install Capacitor packages
        const packages = [
            '@capacitor/cli',
            '@capacitor/core',
        ];

        // Add platform packages
        if (platforms.includes('android')) {
            packages.push('@capacitor/android');
        }
        if (platforms.includes('ios')) {
            packages.push('@capacitor/ios');
        }

        const installed = await installPackages(packages, cwd, logging);
        if (!installed) {
            throw new Error('Failed to install Capacitor packages');
        }
    }

    // Generate capacitor.config.ts
    const configPath = resolve(cwd, config.capacitorConfigPath || 'capacitor.config.ts');
    if (!existsSync(configPath)) {
        const configContent = generateCapacitorConfig(config);
        writeFileSync(configPath, configContent);
        if (logging) {
            console.log(`  ✓ Created ${configPath}`);
        }
    }

    // Check platform requirements
    for (const platform of platforms) {
        const requirements = await checkPlatformRequirements(platform);
        if (!requirements.valid) {
            console.warn(`  ⚠ ${platform}: ${requirements.message}`);
        }
    }

    // Initialize Capacitor project
    const npxArgs = ['cap', 'init', config.appId || 'com.elit.app', config.appName || 'Elit App'];
    const initResult = await execCommand('npx', npxArgs, cwd);

    if (initResult.exitCode !== 0 && logging) {
        console.warn(`  ⚠ Capacitor init warning: ${initResult.stderr}`);
    }

    // Add platforms
    for (const platform of platforms) {
        if (logging) {
            console.log(`  📲 Adding ${platform} platform...`);
        }

        const addArgs = ['cap', 'add', platform];
        const addResult = await execCommand('npx', addArgs, cwd);

        if (addResult.exitCode === 0 && logging) {
            console.log(`  ✓ ${platform} platform added`);
        } else if (logging) {
            console.warn(`  ⚠ Failed to add ${platform} platform`);
        }
    }

    if (logging) {
        console.log('\n✅ Mobile project initialized!');
        console.log(`\nNext steps:`);
        console.log(`  1. Build your web app: elit build`);
        console.log(`  2. Sync to mobile: elit android sync`);
        if (platforms.includes('android')) {
            console.log(`  3. Open Android Studio: elit android open --platform android`);
        }
        if (platforms.includes('ios')) {
            console.log(`  3. Open Xcode: elit android open --platform ios`);
        }
    }
}

/**
 * Sync web build to mobile project
 */
export async function syncMobile(options: MobileSyncOptions): Promise<void> {
    const { cwd, config, platforms = ['android', 'ios'], logging = true } = options;

    if (logging) {
        console.log('\n🔄 Syncing web build to mobile platforms...');
    }

    // Check if webDir exists
    const webDir = resolve(cwd, config.webDir || 'dist');
    if (!existsSync(webDir)) {
        throw new Error(`Web directory not found: ${webDir}. Please run 'elit build' first.`);
    }

    if (logging) {
        console.log(`  Web dir: ${webDir}`);
    }

    // Check if Capacitor is installed
    const hasCapacitor = await checkCapacitorCLI(cwd);
    if (!hasCapacitor) {
        throw new Error('Capacitor CLI is not installed. Run "elit android init" first.');
    }

    // Sync each platform
    for (const platform of platforms) {
        if (logging) {
            console.log(`  Syncing to ${platform}...`);
        }

        const syncArgs = ['cap', 'sync', platform];
        const syncResult = await execCommand('npx', syncArgs, cwd);

        if (syncResult.exitCode === 0 && logging) {
            console.log(`  ✓ ${platform} synced successfully`);
        } else if (logging) {
            console.error(`  ✗ ${platform} sync failed`);
            console.error(`  ${syncResult.stderr}`);
            throw new Error(`Failed to sync to ${platform}`);
        }
    }

    if (logging) {
        console.log('\n✅ Sync complete!');
    }
}

/**
 * Build mobile app (APK/AAB for Android, IPA for iOS)
 */
export async function buildMobile(options: MobileBuildOptions): Promise<void> {
    const { cwd, config, platform, target = 'release', outputType, logging = true } = options;

    if (logging) {
        console.log(`\n🔨 Building ${platform} app (${target})...`);
    }

    // Check platform requirements
    const requirements = await checkPlatformRequirements(platform);
    if (!requirements.valid) {
        throw new Error(requirements.message);
    }

    // Check if platform directory exists
    const platformDir = resolve(cwd, platform === 'android' ? (config.androidDir || 'android') : (config.iosDir || 'ios'));
    if (!existsSync(platformDir)) {
        throw new Error(`Platform directory not found: ${platformDir}. Run "elit android init" first.`);
    }

    if (platform === 'android') {
        // Build Android APK/AAB
        const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
        const gradlePath = resolve(platformDir, gradlew);

        if (!existsSync(gradlePath)) {
            throw new Error('Gradle wrapper not found. Make sure Android platform is properly initialized.');
        }

        let assembleTask = 'assemble';
        if (target === 'release') {
            assembleTask += 'Release';
        } else {
            assembleTask += 'Debug';
        }

        if (outputType === 'aab') {
            assembleTask = 'bundle' + assembleTask.slice(7);
        }

        if (logging) {
            console.log(`  Running: ${gradlew} ${assembleTask}`);
        }

        const buildResult = await execCommand(gradlew, [assembleTask], platformDir);

        if (buildResult.exitCode !== 0) {
            if (logging) {
                console.error(`  ✗ Build failed`);
                console.error(`  ${buildResult.stderr}`);
            }
            throw new Error('Android build failed');
        }

        if (logging) {
            const outputPath = outputType === 'aab'
                ? `${platformDir}/app/build/outputs/bundle/${target}/app-${target}.aab`
                : `${platformDir}/app/build/outputs/apk/${target}/app-${target}.apk`;
            console.log(`  ✓ Build successful!`);
            console.log(`  Output: ${outputPath}`);
        }
    } else if (platform === 'ios') {
        // Build iOS IPA
        if (logging) {
            console.log(`  Building iOS app...`);
            console.log(`  Note: iOS builds are typically done through Xcode.`);
        }

        // Run xcodebuild
        const schemeArgs = [
            '-workspace', 'App.xcworkspace',
            '-scheme', 'App',
            '-configuration', target === 'release' ? 'Release' : 'Debug',
            'build'
        ];

        const buildResult = await execCommand('xcodebuild', schemeArgs, platformDir);

        if (buildResult.exitCode !== 0) {
            if (logging) {
                console.error(`  ✗ Build failed`);
                console.error(`  ${buildResult.stderr}`);
            }
            throw new Error('iOS build failed');
        }

        if (logging) {
            console.log(`  ✓ Build successful!`);
            console.log(`  Note: To create an IPA, use Xcode's Archive and Export functionality.`);
        }
    }

    if (logging) {
        console.log('\n✅ Build complete!');
    }
}

/**
 * Open project in native IDE
 */
export async function openMobile(cwd: string, platform: MobilePlatform, logging?: boolean): Promise<void> {
    if (logging) {
        console.log(`\n🚪 Opening ${platform} project in IDE...`);
    }

    // Check if platform directory exists
    const platformDir = resolve(cwd, platform === 'android' ? 'android' : 'ios');
    if (!existsSync(platformDir)) {
        throw new Error(`Platform directory not found: ${platformDir}. Run "elit android init" first.`);
    }

    if (platform === 'android') {
        // Open Android Studio
        const result = await execCommand('npx', ['cap', 'open', 'android'], cwd);

        if (result.exitCode === 0 && logging) {
            console.log(`  ✓ Opening Android Studio...`);
        } else if (logging) {
            console.error(`  ✗ Failed to open Android Studio`);
            console.error(`  ${result.stderr}`);
        }
    } else if (platform === 'ios') {
        // Check if on macOS
        if (process.platform !== 'darwin') {
            throw new Error('iOS development requires macOS');
        }

        // Open Xcode
        const result = await execCommand('npx', ['cap', 'open', 'ios'], cwd);

        if (result.exitCode === 0 && logging) {
            console.log(`  ✓ Opening Xcode...`);
        } else if (logging) {
            console.error(`  ✗ Failed to open Xcode`);
            console.error(`  ${result.stderr}`);
        }
    }
}

export type { MobileConfig, MobilePlatform };
