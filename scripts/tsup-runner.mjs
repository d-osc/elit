import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const useShell = process.platform === 'win32';
const tsupCommand = 'npx';
const configFiles = ['tsup.config.ts', 'tsup.node.config.ts', 'tsup.cli.config.ts'];

function spawnTsup(configFile, extraArgs = []) {
    return spawn(
        tsupCommand,
        ['tsup', '--config', resolve(repoRoot, configFile), ...extraArgs],
        {
            cwd: repoRoot,
            stdio: 'inherit',
            shell: useShell,
        },
    );
}

function runTsup(configFile, extraArgs = []) {
    return new Promise((resolvePromise, rejectPromise) => {
        const child = spawnTsup(configFile, extraArgs);

        child.once('error', rejectPromise);
        child.once('exit', (code, signal) => {
            if (code === 0) {
                resolvePromise();
                return;
            }

            if (signal) {
                rejectPromise(new Error(`tsup failed for ${configFile} with signal ${signal}`));
                return;
            }

            rejectPromise(new Error(`tsup failed for ${configFile} with exit code ${code ?? 1}`));
        });
    });
}

function cleanDist() {
    rmSync(resolve(repoRoot, 'dist'), { recursive: true, force: true });
}

function writeCliCompatWrapper() {
    mkdirSync(resolve(repoRoot, 'dist'), { recursive: true });

    const cliWrapperPath = resolve(repoRoot, 'dist', 'cli.js');
    const cliWrapperSource = `#!/usr/bin/env node
const { spawn } = require('node:child_process');
const { join } = require('node:path');

const child = spawn(process.execPath, [join(__dirname, 'cli.cjs'), ...process.argv.slice(2)], {
    stdio: 'inherit',
});

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));

child.on('error', (error) => {
    console.error(error);
    process.exit(1);
});

child.on('exit', (code, signal) => {
    if (signal) {
        process.kill(process.pid, signal);
        return;
    }

    process.exit(code ?? 0);
});
`;

    writeFileSync(cliWrapperPath, cliWrapperSource, { mode: 0o755 });
}

async function runBuild() {
    cleanDist();

    for (const configFile of configFiles) {
        await runTsup(configFile);
    }

    writeCliCompatWrapper();
}

function runWatch() {
    cleanDist();
    writeCliCompatWrapper();

    const children = configFiles.map((configFile) => ({
        configFile,
        child: spawnTsup(configFile, ['--watch']),
    }));
    let shuttingDown = false;
    let exitCode = 0;
    let remainingChildren = children.length;

    const stopChildren = () => {
        for (const { child } of children) {
            if (child.exitCode === null && child.signalCode === null) {
                child.kill('SIGTERM');
            }
        }
    };

    const requestShutdown = (nextExitCode = 0) => {
        if (shuttingDown) {
            return;
        }

        shuttingDown = true;
        exitCode = nextExitCode;
        stopChildren();
    };

    process.on('SIGINT', () => requestShutdown(0));
    process.on('SIGTERM', () => requestShutdown(0));

    for (const { configFile, child } of children) {
        child.once('error', (error) => {
            console.error(`Failed to start tsup watch for ${configFile}: ${error.message}`);
            requestShutdown(1);
        });

        child.once('exit', (code, signal) => {
            remainingChildren -= 1;

            if (!shuttingDown) {
                if (signal) {
                    console.error(`tsup watch exited for ${configFile} with signal ${signal}`);
                    requestShutdown(1);
                } else if ((code ?? 0) !== 0) {
                    console.error(`tsup watch exited for ${configFile} with code ${code ?? 1}`);
                    requestShutdown(code ?? 1);
                }
            }

            if (remainingChildren === 0) {
                process.exit(exitCode);
            }
        });
    }
}

const mode = process.argv[2] ?? 'build';

if (mode === 'watch') {
    runWatch();
} else {
    runBuild().catch((error) => {
        console.error(error.message);
        process.exit(1);
    });
}