import { existsSync, readFileSync, rmSync } from 'node:fs';
import { EOL } from 'node:os';

import { loadConfig } from '../../shares/config';
import { printPmHelp, parsePmStartArgs, resolvePmAppDefinition, resolvePmStartDefinitions } from './config';
import {
    DEFAULT_LOG_LINES,
    type PmPaths,
    type PmRecordMatch,
} from './shared';
import { normalizeIntegerOption, readRequiredValue } from './helpers';
import {
    ensurePmDirectories,
    findPmRecordMatch,
    listPmRecordMatches,
    readPmDumpFile,
    resolvePmPaths,
    syncPmRecordLiveness,
    toPmAppConfig,
    toSavedAppDefinition,
    toSavedPmAppConfig,
    writePmDumpFile,
} from './records';
import { startManagedProcess } from './process';
import { runPmRunner, stopPmMatches } from './runner';

async function runPmStart(args: string[]): Promise<void> {
    const parsed = parsePmStartArgs(args);
    const workspaceRoot = process.cwd();
    const config = await loadConfig(workspaceRoot);
    const paths = resolvePmPaths(config?.pm, workspaceRoot);
    const definitions = resolvePmStartDefinitions(parsed, config, workspaceRoot);
    const errors: string[] = [];

    for (const definition of definitions) {
        try {
            const record = await startManagedProcess(definition, paths);
            console.log(`[pm] started ${record.name} (${record.type})`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            errors.push(`[pm] ${definition.name}: ${message}`);
        }
    }

    if (errors.length > 0) {
        throw new Error(errors.join(EOL));
    }
}

async function loadPmContext() {
    const workspaceRoot = process.cwd();
    const config = await loadConfig(workspaceRoot);
    return {
        config,
        paths: resolvePmPaths(config?.pm, workspaceRoot),
    };
}

function resolveNamedMatches(paths: PmPaths, value: string): PmRecordMatch[] {
    if (value === 'all') {
        return listPmRecordMatches(paths).map(syncPmRecordLiveness);
    }

    const match = findPmRecordMatch(paths, value);
    return match ? [syncPmRecordLiveness(match)] : [];
}

function padCell(value: string, width: number): string {
    return value.length >= width ? value : `${value}${' '.repeat(width - value.length)}`;
}

function tailLogFile(filePath: string, lineCount: number): string {
    if (!existsSync(filePath)) {
        return '';
    }

    const lines = readFileSync(filePath, 'utf8').split(/\r?\n/).filter((line) => line.length > 0);
    return lines.slice(-lineCount).join(EOL);
}

function printPmList(paths: PmPaths): void {
    const matches = listPmRecordMatches(paths).map(syncPmRecordLiveness);
    if (matches.length === 0) {
        console.log('No managed processes found.');
        return;
    }

    const headers = [
        padCell('name', 20),
        padCell('status', 12),
        padCell('pid', 8),
        padCell('restarts', 10),
        padCell('type', 8),
        'runtime',
    ];

    console.log(headers.join('  '));
    for (const { record } of matches) {
        console.log([
            padCell(record.name, 20),
            padCell(record.status, 12),
            padCell(record.childPid ? String(record.childPid) : '-', 8),
            padCell(String(record.restartCount ?? 0), 10),
            padCell(record.type, 8),
            record.runtime ?? '-',
        ].join('  '));
    }
}

async function runPmStop(args: string[]): Promise<void> {
    const target = args[0];
    if (!target) {
        throw new Error('Usage: elit pm stop <name|all>');
    }

    const { paths } = await loadPmContext();
    const matches = resolveNamedMatches(paths, target);
    if (matches.length === 0) {
        throw new Error(`No managed process found for: ${target}`);
    }

    const count = await stopPmMatches(matches);
    console.log(`[pm] stopped ${count} process${count === 1 ? '' : 'es'}`);
}

async function runPmRestart(args: string[]): Promise<void> {
    const target = args[0];
    if (!target) {
        throw new Error('Usage: elit pm restart <name|all>');
    }

    const { paths } = await loadPmContext();
    const matches = resolveNamedMatches(paths, target);
    if (matches.length === 0) {
        throw new Error(`No managed process found for: ${target}`);
    }

    await stopPmMatches(matches);

    const restarted: string[] = [];
    for (const match of matches) {
        const definition = resolvePmAppDefinition(
            toPmAppConfig(match.record),
            { name: match.record.name, env: {}, watchPaths: [], watchIgnore: [] },
            process.cwd(),
            match.record.source,
        );

        await startManagedProcess(definition, paths);
        restarted.push(match.record.name);
    }

    console.log(`[pm] restarted ${restarted.join(', ')}`);
}

async function runPmSave(): Promise<void> {
    const { paths } = await loadPmContext();
    ensurePmDirectories(paths);

    const runningApps = listPmRecordMatches(paths)
        .map(syncPmRecordLiveness)
        .filter((match) => match.record.desiredState === 'running' && (
            match.record.status === 'starting'
            || match.record.status === 'online'
            || match.record.status === 'restarting'
        ))
        .map((match) => toSavedAppDefinition(match.record));

    writePmDumpFile(paths.dumpFile, runningApps);
    console.log(`[pm] saved ${runningApps.length} process${runningApps.length === 1 ? '' : 'es'} to ${paths.dumpFile}`);
}

async function runPmResurrect(): Promise<void> {
    const { paths } = await loadPmContext();
    if (!existsSync(paths.dumpFile)) {
        throw new Error(`PM dump file not found: ${paths.dumpFile}`);
    }

    const dump = readPmDumpFile(paths.dumpFile);
    if (dump.apps.length === 0) {
        console.log('[pm] dump file is empty, nothing to resurrect');
        return;
    }

    const errors: string[] = [];
    let restored = 0;
    for (const app of dump.apps) {
        try {
            const definition = resolvePmAppDefinition(
                toSavedPmAppConfig(app),
                { name: app.name, env: {}, watchPaths: [], watchIgnore: [] },
                process.cwd(),
                'cli',
            );
            await startManagedProcess(definition, paths);
            restored += 1;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            errors.push(`[pm] ${app.name}: ${message}`);
        }
    }

    if (errors.length > 0) {
        throw new Error([`[pm] resurrected ${restored} process${restored === 1 ? '' : 'es'}`, ...errors].join(EOL));
    }

    console.log(`[pm] resurrected ${restored} process${restored === 1 ? '' : 'es'} from ${paths.dumpFile}`);
}

async function runPmDelete(args: string[]): Promise<void> {
    const target = args[0];
    if (!target) {
        throw new Error('Usage: elit pm delete <name|all>');
    }

    const { paths } = await loadPmContext();
    const matches = resolveNamedMatches(paths, target);
    if (matches.length === 0) {
        throw new Error(`No managed process found for: ${target}`);
    }

    await stopPmMatches(matches);

    for (const match of matches) {
        if (existsSync(match.record.logFiles.out)) {
            rmSync(match.record.logFiles.out, { force: true });
        }
        if (existsSync(match.record.logFiles.err)) {
            rmSync(match.record.logFiles.err, { force: true });
        }
        rmSync(match.filePath, { force: true });
    }

    console.log(`[pm] deleted ${matches.length} process${matches.length === 1 ? '' : 'es'}`);
}

async function runPmLogs(args: string[]): Promise<void> {
    if (args.length === 0) {
        throw new Error('Usage: elit pm logs <name> [--lines <n>] [--stderr]');
    }

    let name: string | undefined;
    let lineCount = DEFAULT_LOG_LINES;
    let stderrOnly = false;

    for (let index = 0; index < args.length; index++) {
        const arg = args[index];
        switch (arg) {
            case '--lines':
                lineCount = normalizeIntegerOption(readRequiredValue(args, ++index, '--lines'), '--lines', 1);
                break;
            case '--stderr':
                stderrOnly = true;
                break;
            default:
                if (arg.startsWith('-')) {
                    throw new Error(`Unknown pm logs option: ${arg}`);
                }
                if (name) {
                    throw new Error('pm logs accepts exactly one process name.');
                }
                name = arg;
                break;
        }
    }

    if (!name) {
        throw new Error('Usage: elit pm logs <name> [--lines <n>] [--stderr]');
    }

    const { paths } = await loadPmContext();
    const match = findPmRecordMatch(paths, name);
    if (!match) {
        throw new Error(`No managed process found for: ${name}`);
    }

    const stdoutContent = stderrOnly ? '' : tailLogFile(match.record.logFiles.out, lineCount);
    const stderrContent = tailLogFile(match.record.logFiles.err, lineCount);

    if (!stderrOnly) {
        console.log(`== stdout: ${match.record.logFiles.out} ==`);
        console.log(stdoutContent || '(empty)');
    }

    console.log(`== stderr: ${match.record.logFiles.err} ==`);
    console.log(stderrContent || '(empty)');
}

export async function runPmCommand(args: string[]): Promise<void> {
    if (args.length === 0 || args[0] === 'help' || args.includes('--help') || args.includes('-h')) {
        printPmHelp();
        return;
    }

    const command = args[0];

    switch (command) {
        case 'start':
            await runPmStart(args.slice(1));
            return;
        case 'list':
        case 'ls': {
            const { paths } = await loadPmContext();
            printPmList(paths);
            return;
        }
        case 'stop':
            await runPmStop(args.slice(1));
            return;
        case 'restart':
            await runPmRestart(args.slice(1));
            return;
        case 'delete':
        case 'remove':
        case 'rm':
            await runPmDelete(args.slice(1));
            return;
        case 'save':
            await runPmSave();
            return;
        case 'resurrect':
            await runPmResurrect();
            return;
        case 'logs':
            await runPmLogs(args.slice(1));
            return;
        case '__run':
            await runPmRunner(args.slice(1));
            return;
        default:
            throw new Error(`Unknown pm command: ${command}`);
    }
}