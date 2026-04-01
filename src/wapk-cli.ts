import { spawn, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';

import { loadConfig } from './config';

export type WapkRuntimeName = 'node' | 'bun' | 'deno';

export interface WapkHeader {
    name: string;
    version: string;
    runtime: WapkRuntimeName;
    entry: string;
    scripts: Record<string, string>;
    port?: number;
    env?: Record<string, string>;
    desktop?: Record<string, unknown>;
    createdAt: string;
}

interface WapkFileEntry {
    path: string;
    content: Buffer;
    mode: number;
}

interface DecodedWapk {
    version: number;
    header: WapkHeader;
    files: WapkFileEntry[];
}

export interface WapkLiveSyncController {
    flush: () => void;
    stop: () => void;
}

export interface PreparedWapkApp {
    archivePath: string;
    workDir: string;
    entryPath: string;
    header: WapkHeader;
    runtime: WapkRuntimeName;
}

interface WapkProjectConfig {
    name: string;
    version: string;
    runtime: WapkRuntimeName;
    entry: string;
    scripts: Record<string, string>;
    port?: number;
    env?: Record<string, string>;
    desktop?: Record<string, unknown>;
}

const WAPK_MAGIC = Buffer.from('WAPK');
const WAPK_VERSION = 1;
const DEFAULT_WAPK_PORT = 3000;
const DEFAULT_IGNORE = [
    'node_modules',
    '.git',
    '.elit-config-*',
    '.DS_Store',
    'Thumbs.db',
    '.env',
    '.env.local',
    'dist',
    'build',
    '.wapk',
] as const;

export const WAPK_RUNTIMES: WapkRuntimeName[] = ['node', 'bun', 'deno'];
const RUNTIME_SYNC_IGNORE = new Set(['node_modules', '.git']);

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeRuntime(value: unknown): WapkRuntimeName | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const runtime = value.toLowerCase();
    if (runtime === 'nodejs') {
        return 'node';
    }

    return WAPK_RUNTIMES.includes(runtime as WapkRuntimeName)
        ? runtime as WapkRuntimeName
        : undefined;
}

function normalizePort(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    const port = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(port) || port <= 0) {
        return undefined;
    }

    return Math.trunc(port);
}

function normalizeStringMap(value: unknown): Record<string, string> | undefined {
    if (!isRecord(value)) {
        return undefined;
    }

    const normalized: Record<string, string> = {};
    for (const [key, entryValue] of Object.entries(value)) {
        if (typeof entryValue === 'string') {
            normalized[key] = entryValue;
        } else if (typeof entryValue === 'number' || typeof entryValue === 'boolean') {
            normalized[key] = String(entryValue);
        }
    }

    return Object.keys(normalized).length > 0 ? normalized : {};
}

function normalizeDesktopConfig(value: unknown): Record<string, unknown> | undefined {
    return isRecord(value) ? { ...value } : undefined;
}

function normalizeWapkConfig(value: unknown): Partial<WapkProjectConfig> {
    if (!isRecord(value)) {
        return {};
    }

    return {
        name: typeof value.name === 'string' ? value.name : undefined,
        version: typeof value.version === 'string' ? value.version : undefined,
        runtime: normalizeRuntime(value.runtime ?? value.engine),
        entry: typeof value.entry === 'string' ? value.entry : undefined,
        scripts: normalizeStringMap(value.scripts),
        port: normalizePort(value.port),
        env: normalizeStringMap(value.env),
        desktop: normalizeDesktopConfig(value.desktop),
    };
}

function sanitizePackageName(name: string): string {
    const sanitized = name
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]+/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    return sanitized.length > 0 ? sanitized : 'app';
}

function ensureBufferRange(buffer: Buffer, start: number, length: number, field: string): void {
    if (start < 0 || start + length > buffer.length) {
        throw new Error(`Invalid WAPK file: truncated ${field}.`);
    }
}

function normalizeArchivePath(baseDir: string, value: string): string {
    const resolvedPath = resolve(baseDir, value);
    const relativePath = relative(baseDir, resolvedPath);

    if (!relativePath || relativePath.startsWith('..') || isAbsolute(relativePath)) {
        throw new Error(`WAPK entry must stay inside the package directory: ${value}`);
    }

    return relativePath.split('\\').join('/');
}

function stripQuotes(value: string): string {
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
        return value.slice(1, -1);
    }
    return value;
}

function tokenizeCommand(command: string): string[] {
    return (command.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map(stripQuotes);
}

function findScriptEntry(tokens: string[], startIndex: number): string | undefined {
    const candidates = tokens.slice(startIndex).filter((token) => !token.startsWith('-'));
    return candidates.length > 0 ? candidates[candidates.length - 1] : undefined;
}

function inferRuntimeAndEntryFromScript(script: string | undefined): { runtime?: WapkRuntimeName; entry?: string } {
    if (!script) {
        return {};
    }

    const tokens = tokenizeCommand(script);
    if (tokens.length === 0) {
        return {};
    }

    const command = tokens[0];
    if (command === 'bun') {
        if (tokens[1] === 'run') {
            return { runtime: 'bun', entry: findScriptEntry(tokens, 2) };
        }
        return { runtime: 'bun', entry: findScriptEntry(tokens, 1) };
    }

    if (command === 'deno' && tokens[1] === 'run') {
        return { runtime: 'deno', entry: findScriptEntry(tokens, 2) };
    }

    if (command === 'node' || command === 'nodejs') {
        return { runtime: 'node', entry: findScriptEntry(tokens, 1) };
    }

    if (command === 'tsx' || command === 'ts-node') {
        return { runtime: 'node', entry: findScriptEntry(tokens, 1) };
    }

    return {};
}

function readJsonFile(filePath: string): Record<string, unknown> | undefined {
    if (!existsSync(filePath)) {
        return undefined;
    }

    const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
    if (!isRecord(parsed)) {
        throw new Error(`Expected a JSON object in ${filePath}`);
    }

    return parsed;
}

async function readWapkProjectConfig(directory: string): Promise<WapkProjectConfig> {
    const packageJsonPath = join(directory, 'package.json');
    const elitConfig = await loadConfig(directory);
    const elitWapkConfig = normalizeWapkConfig(elitConfig?.wapk);
    const packageJson = readJsonFile(packageJsonPath);

    const packageScripts = normalizeStringMap(packageJson?.scripts) ?? {};
    const selectedScripts = elitWapkConfig.scripts ?? packageScripts;
    const inferred = inferRuntimeAndEntryFromScript(selectedScripts.start ?? packageScripts.start);
    const name = typeof elitWapkConfig.name === 'string'
        ? elitWapkConfig.name
        : typeof packageJson?.name === 'string'
            ? packageJson.name
            : basename(directory);
    const version = typeof elitWapkConfig.version === 'string'
        ? elitWapkConfig.version
        : typeof packageJson?.version === 'string'
            ? packageJson.version
            : '1.0.0';
    const runtime = elitWapkConfig.runtime
        ?? inferred.runtime
        ?? 'node';
    const entryValue = typeof elitWapkConfig.entry === 'string'
        ? elitWapkConfig.entry
        : typeof packageJson?.main === 'string'
            ? packageJson.main
            : inferred.entry
                ?? 'index.js';
    const entry = normalizeArchivePath(directory, entryValue);
    const entryPath = resolve(directory, entry);

    if (!existsSync(entryPath) || !statSync(entryPath).isFile()) {
        throw new Error(`WAPK entry not found: ${entryPath}`);
    }

    return {
        name,
        version,
        runtime,
        entry,
        scripts: selectedScripts,
        port: elitWapkConfig.port,
        env: elitWapkConfig.env,
        desktop: elitWapkConfig.desktop,
    };
}

function readIgnorePatterns(directory: string): string[] {
    const ignorePath = join(directory, '.wapkignore');
    if (!existsSync(ignorePath)) {
        return [];
    }

    return readFileSync(ignorePath, 'utf8')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#'));
}

function shouldIgnore(relativePath: string, ignorePatterns: readonly string[]): boolean {
    const pathParts = relativePath.split('/');
    for (const pattern of ignorePatterns) {
        if (relativePath === pattern || pathParts.includes(pattern)) {
            return true;
        }

        if (pattern.endsWith('*')) {
            const prefix = pattern.slice(0, -1);
            if (relativePath.startsWith(prefix) || pathParts.some((part) => part.startsWith(prefix))) {
                return true;
            }
        }

        if (pattern.startsWith('*.') && relativePath.endsWith(pattern.slice(1))) {
            return true;
        }
    }

    return false;
}

function collectFiles(directory: string, baseDirectory: string, ignorePatterns: readonly string[]): WapkFileEntry[] {
    const files: WapkFileEntry[] = [];
    const entries = readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = join(directory, entry.name);
        const relativePath = relative(baseDirectory, fullPath).split('\\').join('/');
        if (shouldIgnore(relativePath, ignorePatterns)) {
            continue;
        }

        if (entry.isDirectory()) {
            files.push(...collectFiles(fullPath, baseDirectory, ignorePatterns));
            continue;
        }

        if (!entry.isFile()) {
            continue;
        }

        const stat = statSync(fullPath);
        files.push({
            path: relativePath,
            content: readFileSync(fullPath),
            mode: stat.mode,
        });
    }

    return files;
}

function encodeWapk(header: WapkHeader, files: readonly WapkFileEntry[]): Buffer {
    const headerBuffer = Buffer.from(JSON.stringify(header, null, 2), 'utf8');
    let totalSize = 4 + 2 + 4 + headerBuffer.length + 4;

    for (const file of files) {
        const pathBuffer = Buffer.from(file.path, 'utf8');
        totalSize += 2 + pathBuffer.length + 4 + 4 + file.content.length;
    }

    const buffer = Buffer.allocUnsafe(totalSize);
    let offset = 0;

    WAPK_MAGIC.copy(buffer, offset);
    offset += WAPK_MAGIC.length;

    buffer.writeUInt16LE(WAPK_VERSION, offset);
    offset += 2;

    buffer.writeUInt32LE(headerBuffer.length, offset);
    offset += 4;
    headerBuffer.copy(buffer, offset);
    offset += headerBuffer.length;

    buffer.writeUInt32LE(files.length, offset);
    offset += 4;

    for (const file of files) {
        const pathBuffer = Buffer.from(file.path, 'utf8');
        buffer.writeUInt16LE(pathBuffer.length, offset);
        offset += 2;
        pathBuffer.copy(buffer, offset);
        offset += pathBuffer.length;
        buffer.writeUInt32LE(file.mode ?? 0o644, offset);
        offset += 4;
        buffer.writeUInt32LE(file.content.length, offset);
        offset += 4;
        file.content.copy(buffer, offset);
        offset += file.content.length;
    }

    return buffer;
}

function decodeWapk(buffer: Buffer): DecodedWapk {
    let offset = 0;

    ensureBufferRange(buffer, offset, 4, 'magic');
    if (!buffer.slice(offset, offset + 4).equals(WAPK_MAGIC)) {
        throw new Error('Invalid WAPK file: bad magic bytes.');
    }
    offset += 4;

    ensureBufferRange(buffer, offset, 2, 'version');
    const version = buffer.readUInt16LE(offset);
    offset += 2;
    if (version > WAPK_VERSION) {
        throw new Error(`Unsupported WAPK version: ${version}`);
    }

    ensureBufferRange(buffer, offset, 4, 'header length');
    const headerLength = buffer.readUInt32LE(offset);
    offset += 4;

    ensureBufferRange(buffer, offset, headerLength, 'header');
    const rawHeader = JSON.parse(buffer.slice(offset, offset + headerLength).toString('utf8'));
    offset += headerLength;
    if (!isRecord(rawHeader)) {
        throw new Error('Invalid WAPK file: header must be an object.');
    }

    ensureBufferRange(buffer, offset, 4, 'file count');
    const fileCount = buffer.readUInt32LE(offset);
    offset += 4;

    const header: WapkHeader = {
        name: typeof rawHeader.name === 'string' ? rawHeader.name : 'app',
        version: typeof rawHeader.version === 'string' ? rawHeader.version : '1.0.0',
        runtime: normalizeRuntime(rawHeader.runtime ?? rawHeader.engine) ?? 'node',
        entry: typeof rawHeader.entry === 'string' ? rawHeader.entry : 'index.js',
        scripts: normalizeStringMap(rawHeader.scripts) ?? {},
        port: normalizePort(rawHeader.port),
        env: normalizeStringMap(rawHeader.env),
        desktop: normalizeDesktopConfig(rawHeader.desktop),
        createdAt: typeof rawHeader.createdAt === 'string' ? rawHeader.createdAt : new Date(0).toISOString(),
    };

    const files: WapkFileEntry[] = [];
    for (let index = 0; index < fileCount; index++) {
        ensureBufferRange(buffer, offset, 2, `file ${index + 1} path length`);
        const pathLength = buffer.readUInt16LE(offset);
        offset += 2;

        ensureBufferRange(buffer, offset, pathLength, `file ${index + 1} path`);
        const pathValue = buffer.slice(offset, offset + pathLength).toString('utf8');
        offset += pathLength;

        ensureBufferRange(buffer, offset, 4, `file ${index + 1} mode`);
        const mode = buffer.readUInt32LE(offset);
        offset += 4;

        ensureBufferRange(buffer, offset, 4, `file ${index + 1} size`);
        const contentLength = buffer.readUInt32LE(offset);
        offset += 4;

        ensureBufferRange(buffer, offset, contentLength, `file ${index + 1} content`);
        const content = Buffer.allocUnsafe(contentLength);
        buffer.copy(content, 0, offset, offset + contentLength);
        offset += contentLength;

        files.push({ path: pathValue, content, mode });
    }

    return { version, header, files };
}

function formatSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function filesEqual(left: readonly WapkFileEntry[], right: readonly WapkFileEntry[]): boolean {
    if (left.length !== right.length) {
        return false;
    }

    for (let index = 0; index < left.length; index++) {
        const leftEntry = left[index];
        const rightEntry = right[index];
        if (leftEntry.path !== rightEntry.path || leftEntry.mode !== rightEntry.mode) {
            return false;
        }

        if (!leftEntry.content.equals(rightEntry.content)) {
            return false;
        }
    }

    return true;
}

function extractFiles(files: readonly WapkFileEntry[], destination: string): void {
    for (const file of files) {
        const filePath = join(destination, file.path);
        mkdirSync(dirname(filePath), { recursive: true });
        writeFileSync(filePath, file.content);
        if (process.platform !== 'win32') {
            try {
                chmodSync(filePath, file.mode);
            } catch {
                continue;
            }
        }
    }
}

function collectRuntimeSyncFiles(directory: string): WapkFileEntry[] {
    const files = collectFiles(directory, directory, []);
    return files
        .filter((file) => {
            const firstPart = file.path.split('/')[0] ?? '';
            return !RUNTIME_SYNC_IGNORE.has(firstPart);
        })
        .sort((left, right) => left.path.localeCompare(right.path));
}

function writeWapkArchiveFromMemory(archivePath: string, header: WapkHeader, files: readonly WapkFileEntry[]): void {
    const updatedHeader: WapkHeader = {
        ...header,
        createdAt: new Date().toISOString(),
    };
    writeFileSync(archivePath, encodeWapk(updatedHeader, files));
}

export function createWapkLiveSync(prepared: PreparedWapkApp): WapkLiveSyncController {
    let memoryFiles = collectRuntimeSyncFiles(prepared.workDir);

    const flush = (): void => {
        const nextFiles = collectRuntimeSyncFiles(prepared.workDir);
        if (filesEqual(memoryFiles, nextFiles)) {
            return;
        }

        memoryFiles = nextFiles;
        writeWapkArchiveFromMemory(prepared.archivePath, prepared.header, memoryFiles);
    };

    const timer = setInterval(flush, 300);
    timer.unref?.();

    const stop = (): void => {
        clearInterval(timer);
        flush();
    };

    return { flush, stop };
}

function resolveRuntimeExecutable(runtime: WapkRuntimeName): string {
    const executableName = basename(process.execPath).toLowerCase();

    if (runtime === 'node' && process.release?.name === 'node' && executableName.startsWith('node')) {
        return process.execPath;
    }

    if (runtime === 'bun' && process.versions?.bun && executableName.startsWith('bun')) {
        return process.execPath;
    }

    return runtime;
}

function ensureRuntimeAvailable(runtime: WapkRuntimeName, executable: string): void {
    const result = spawnSync(executable, ['--version'], {
        stdio: 'ignore',
        windowsHide: true,
    });

    if (result.error) {
        if ((result.error as NodeJS.ErrnoException).code === 'ENOENT') {
            throw new Error(`WAPK runtime "${runtime}" was not found in PATH.`);
        }

        throw result.error;
    }
}

function resolveNpmExecutable(nodeExecutable: string): string {
    const candidate = process.platform === 'win32'
        ? join(dirname(nodeExecutable), 'npm.cmd')
        : join(dirname(nodeExecutable), 'npm');

    if (existsSync(candidate)) {
        return candidate;
    }

    return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function installDependenciesIfNeeded(directory: string, runtime: WapkRuntimeName): void {
    if (runtime === 'deno') {
        return;
    }

    const packageJsonPath = join(directory, 'package.json');
    if (!existsSync(packageJsonPath) || existsSync(join(directory, 'node_modules'))) {
        return;
    }

    const packageJson = readJsonFile(packageJsonPath);
    const dependencyGroups = [packageJson?.dependencies, packageJson?.devDependencies];
    const hasDependencies = dependencyGroups.some(
        (value) => isRecord(value) && Object.keys(value).length > 0,
    );

    if (!hasDependencies) {
        return;
    }

    const runtimeExecutable = resolveRuntimeExecutable(runtime);
    let command = runtimeExecutable;
    let args: string[] = [];

    if (runtime === 'bun') {
        args = ['install'];
    } else {
        command = resolveNpmExecutable(runtimeExecutable);
        args = ['install'];
    }

    console.log(`[wapk] Installing dependencies with ${basename(command)}...`);
    const result = spawnSync(command, args, {
        cwd: directory,
        stdio: 'inherit',
        windowsHide: true,
    });

    if (result.error) {
        if ((result.error as NodeJS.ErrnoException).code === 'ENOENT') {
            throw new Error(`Dependency installer was not found for runtime "${runtime}".`);
        }

        throw result.error;
    }

    if (result.status !== 0) {
        throw new Error(`Dependency installation failed with exit code ${result.status ?? 1}.`);
    }
}

export function getWapkRuntimeArgs(runtime: WapkRuntimeName, entryPath: string): string[] {
    switch (runtime) {
        case 'bun':
            return ['run', entryPath];
        case 'deno':
            return ['run', '--allow-all', entryPath];
        default:
            return [entryPath];
    }
}

export function resolveWapkRuntimeExecutable(runtime: WapkRuntimeName): string {
    const executable = resolveRuntimeExecutable(runtime);
    ensureRuntimeAvailable(runtime, executable);
    return executable;
}

export function readWapkArchive(wapkPath: string): DecodedWapk {
    const archivePath = resolve(wapkPath);
    if (!existsSync(archivePath)) {
        throw new Error(`WAPK file not found: ${archivePath}`);
    }

    return decodeWapk(readFileSync(archivePath));
}

export async function packWapkDirectory(
    directory: string,
    options: { includeDeps?: boolean; outputPath?: string } = {},
): Promise<string> {
    const sourceDirectory = resolve(directory);
    if (!existsSync(sourceDirectory) || !statSync(sourceDirectory).isDirectory()) {
        throw new Error(`WAPK source directory not found: ${sourceDirectory}`);
    }

    const config = await readWapkProjectConfig(sourceDirectory);
    const userIgnore = readIgnorePatterns(sourceDirectory);
    const ignorePatterns = options.includeDeps
        ? [...DEFAULT_IGNORE.filter((pattern) => pattern !== 'node_modules'), ...userIgnore]
        : [...DEFAULT_IGNORE, ...userIgnore];
    const files = collectFiles(sourceDirectory, sourceDirectory, ignorePatterns);
    const outputPath = resolve(options.outputPath ?? join(process.cwd(), `${sanitizePackageName(config.name)}.wapk`));
    const header: WapkHeader = {
        name: config.name,
        version: config.version,
        runtime: config.runtime,
        entry: config.entry,
        scripts: config.scripts,
        port: config.port,
        env: config.env,
        desktop: config.desktop,
        createdAt: new Date().toISOString(),
    };

    console.log(`Packing: ${config.name}@${config.version}`);
    console.log(`Runtime: ${config.runtime}`);
    console.log(`Entry:   ${config.entry}`);
    if (options.includeDeps) {
        console.log('Deps:    included');
    }
    console.log(`Files:   ${files.length}`);

    writeFileSync(outputPath, encodeWapk(header, files));
    console.log(`Output:  ${outputPath}`);
    return outputPath;
}

export function extractWapkArchive(wapkPath: string, outputDir = '.'): string {
    const archive = readWapkArchive(wapkPath);
    const destinationRoot = resolve(outputDir);
    const extractDirectory = join(destinationRoot, sanitizePackageName(archive.header.name));

    mkdirSync(extractDirectory, { recursive: true });
    extractFiles(archive.files, extractDirectory);
    console.log(`Extracted ${archive.files.length} files to: ${extractDirectory}`);
    return extractDirectory;
}

export function prepareWapkApp(wapkPath: string, options: { runtime?: WapkRuntimeName } = {}): PreparedWapkApp {
    const archivePath = resolve(wapkPath);
    if (!existsSync(archivePath)) {
        throw new Error(`WAPK file not found: ${archivePath}`);
    }

    const decoded = decodeWapk(readFileSync(archivePath));
    const runtime = options.runtime ?? decoded.header.runtime;
    const workDir = mkdtempSync(join(tmpdir(), 'elit-wapk-'));
    extractFiles(decoded.files, workDir);
    installDependenciesIfNeeded(workDir, runtime);

    const entryPath = resolve(workDir, decoded.header.entry);

    if (!existsSync(entryPath) || !statSync(entryPath).isFile()) {
        rmSync(workDir, { recursive: true, force: true });
        throw new Error(`WAPK entry not found after extraction: ${entryPath}`);
    }

    return {
        archivePath,
        workDir,
        entryPath,
        header: decoded.header,
        runtime,
    };
}

export async function runPreparedWapkApp(prepared: PreparedWapkApp): Promise<number> {
    const executable = resolveWapkRuntimeExecutable(prepared.runtime);
    const port = prepared.header.port ?? DEFAULT_WAPK_PORT;
    const env = {
        ...process.env,
        ...prepared.header.env,
        PORT: String(port),
    };

    console.log(`[wapk] ${prepared.header.name}@${prepared.header.version}`);
    console.log(`[wapk] Runtime: ${prepared.runtime}`);
    console.log(`[wapk] Entry:   ${prepared.header.entry}`);
    console.log(`[wapk] Workdir: ${prepared.workDir}`);

    const sync = createWapkLiveSync(prepared);

    const child = spawn(executable, getWapkRuntimeArgs(prepared.runtime, prepared.entryPath), {
        cwd: prepared.workDir,
        env,
        stdio: 'inherit',
        windowsHide: true,
    });

    const onSigInt = (): void => {
        child.kill('SIGINT');
    };
    const onSigTerm = (): void => {
        child.kill('SIGTERM');
    };

    process.on('SIGINT', onSigInt);
    process.on('SIGTERM', onSigTerm);

    try {
        return await new Promise<number>((resolvePromise, rejectPromise) => {
            child.once('error', rejectPromise);
            child.once('close', (code) => resolvePromise(code ?? 1));
        });
    } finally {
        process.off('SIGINT', onSigInt);
        process.off('SIGTERM', onSigTerm);
        sync.stop();
        rmSync(prepared.workDir, { recursive: true, force: true });
    }
}

function inspectWapkArchive(wapkPath: string): void {
    const archivePath = resolve(wapkPath);
    const buffer = readFileSync(archivePath);
    const decoded = decodeWapk(buffer);
    const totalContentSize = decoded.files.reduce((total, file) => total + file.content.length, 0);

    console.log(`WAPK:     ${basename(archivePath)}`);
    console.log(`Size:     ${formatSize(buffer.length)}`);
    console.log(`Version:  ${decoded.version}`);
    console.log(`Name:     ${decoded.header.name}`);
    console.log(`App:      ${decoded.header.version}`);
    console.log(`Runtime:  ${decoded.header.runtime}`);
    console.log(`Entry:    ${decoded.header.entry}`);
    console.log(`Port:     ${decoded.header.port ?? 'default'}`);
    console.log(`Created:  ${decoded.header.createdAt}`);

    if (decoded.header.env && Object.keys(decoded.header.env).length > 0) {
        console.log('Env:');
        for (const [key, value] of Object.entries(decoded.header.env)) {
            console.log(`  ${key}=${value}`);
        }
    }

    console.log(`Files:    ${decoded.files.length}`);
    for (const file of [...decoded.files].sort((left, right) => left.path.localeCompare(right.path))) {
        console.log(`  ${formatSize(file.content.length).padStart(10)}  ${file.path}`);
    }

    console.log(`Content:  ${formatSize(totalContentSize)}`);
}

function printWapkHelp(): void {
    console.log([
        '',
        'WAPK packaging for Elit',
        '',
        'Usage:',
        '  elit wapk <file.wapk>',
        '  elit wapk run <file.wapk>',
        '  elit wapk run <file.wapk> --runtime node|bun|deno',
        '  elit wapk pack [directory]',
        '  elit wapk pack [directory] --include-deps',
        '  elit wapk inspect <file.wapk>',
        '  elit wapk extract <file.wapk>',
        '',
        'Options:',
        '  -r, --runtime <name>    Runtime override: node, bun, deno',
        '  --include-deps          Include node_modules in the archive',
        '  -h, --help              Show this help',
        '',
        'Notes:',
        '  - Pack reads wapk from elit.config.* and falls back to package.json.',
        '  - Run mode keeps files in memory and syncs changes back to the .wapk file.',
        '  - Runtime commands use node, bun, or deno from PATH.',
    ].join('\n'));
}

function expectSinglePositional(args: string[], usage: string): string {
    const positional = args.filter((arg) => !arg.startsWith('-'));
    if (positional.length !== 1) {
        throw new Error(usage);
    }
    return positional[0];
}

function parseRunArgs(args: string[]): { file: string; runtime?: WapkRuntimeName } {
    let file: string | undefined;
    let runtime: WapkRuntimeName | undefined;

    for (let index = 0; index < args.length; index++) {
        const arg = args[index];
        switch (arg) {
            case '--runtime':
            case '-r': {
                const value = normalizeRuntime(args[++index]);
                if (!value) {
                    throw new Error(`Unknown WAPK runtime: ${args[index]}`);
                }
                runtime = value;
                break;
            }
            default:
                if (arg.startsWith('-')) {
                    throw new Error(`Unknown WAPK option: ${arg}`);
                }
                if (file) {
                    throw new Error('WAPK run accepts exactly one package file.');
                }
                file = arg;
                break;
        }
    }

    if (!file) {
        throw new Error('Usage: elit wapk run <file.wapk>');
    }

    return { file, runtime };
}

function parsePackArgs(args: string[]): { directory: string; includeDeps: boolean } {
    let directory = '.';
    let includeDeps = false;

    for (const arg of args) {
        if (arg === '--include-deps') {
            includeDeps = true;
            continue;
        }

        if (arg.startsWith('-')) {
            throw new Error(`Unknown WAPK option: ${arg}`);
        }

        if (directory !== '.') {
            throw new Error('WAPK pack accepts at most one directory argument.');
        }

        directory = arg;
    }

    return { directory, includeDeps };
}

export async function runWapkCommand(args: string[]): Promise<void> {
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        printWapkHelp();
        return;
    }

    if (args[0] === 'pack') {
        const options = parsePackArgs(args.slice(1));
        await packWapkDirectory(options.directory, { includeDeps: options.includeDeps });
        return;
    }

    if (args[0] === 'inspect') {
        inspectWapkArchive(expectSinglePositional(args.slice(1), 'Usage: elit wapk inspect <file.wapk>'));
        return;
    }

    if (args[0] === 'extract') {
        extractWapkArchive(expectSinglePositional(args.slice(1), 'Usage: elit wapk extract <file.wapk>'));
        return;
    }

    const runOptions = args[0] === 'run' ? parseRunArgs(args.slice(1)) : parseRunArgs(args);
    const prepared = prepareWapkApp(runOptions.file, { runtime: runOptions.runtime });
    const exitCode = await runPreparedWapkApp(prepared);
    if (exitCode !== 0) {
        process.exit(exitCode);
    }
}