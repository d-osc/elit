import { spawnSync } from 'node:child_process';

type AndroidDevice = {
    id: string;
    state: string;
};

type AndroidDevicesReport = {
    platform?: string;
    devices?: AndroidDevice[];
};

function runBun(args: string[], captureOutput = false): { status: number | null; stdout: string; stderr: string } {
    const result = spawnSync('bun', args, {
        encoding: 'utf8',
        stdio: captureOutput ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    });

    return {
        status: result.status,
        stdout: typeof result.stdout === 'string' ? result.stdout : '',
        stderr: typeof result.stderr === 'string' ? result.stderr : '',
    };
}

const devicesResult = runBun(['../../src/cli.ts', 'mobile', 'devices', 'android', '--cwd', '.', '--json'], true);
if (devicesResult.status !== 0) {
    const errorText = devicesResult.stderr.trim() || 'Failed to read Android devices.';
    throw new Error(errorText);
}

const report = JSON.parse(devicesResult.stdout) as AndroidDevicesReport;
const availableDevices = Array.isArray(report.devices)
    ? report.devices.filter((device) => device.state === 'device')
    : [];

if (availableDevices.length === 0) {
    throw new Error('No connected Android emulator/device found. Start one first or set mobile.android.target explicitly.');
}

const preferredDevice = availableDevices.find((device) => device.id.startsWith('emulator-')) ?? availableDevices[0];
console.log(`[android-native-run] Selected target ${preferredDevice.id}`);

const runResult = runBun(['../../src/cli.ts', 'mobile', 'run', 'android', '--cwd', '.', '--target', preferredDevice.id]);
if (runResult.status && runResult.status !== 0) {
    process.exit(runResult.status);
}