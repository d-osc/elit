import { spawnSync } from 'node:child_process';

type AndroidDevice = {
    id: string;
    state: string;
};

type AndroidDevicesReport = {
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
    throw new Error(devicesResult.stderr.trim() || 'Failed to read Android devices.');
}

const report = JSON.parse(devicesResult.stdout) as AndroidDevicesReport;
const connectedDevices = Array.isArray(report.devices)
    ? report.devices.filter((device) => device.state === 'device')
    : [];

if (connectedDevices.length === 0) {
    throw new Error('No connected Android emulator/device found. Start one first or pass --target manually.');
}

const preferredDevice = connectedDevices.find((device) => device.id.startsWith('emulator-')) ?? connectedDevices[0];
console.log(`[universal-mobile-run] Selected target ${preferredDevice.id}`);

const runResult = runBun(['../../src/cli.ts', 'mobile', 'run', 'android', '--cwd', '.', '--target', preferredDevice.id]);
if (runResult.status && runResult.status !== 0) {
    process.exit(runResult.status);
}
