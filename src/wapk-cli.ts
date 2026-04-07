import { spawn, spawnSync } from 'node:child_process';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, watch, writeFileSync } from 'node:fs';
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
    lock?: {
        password: true;
    };
}

export interface WapkCredentialsOptions {
    password?: string;
    passwordEnv?: string;
}

interface ResolvedWapkCredentials {
    password: string;
}

interface WapkLockMetadata {
    cipher: 'aes-256-gcm';
    kdf: 'scrypt';
    salt: string;
    iv: string;
    tag: string;
    user?: string;
}

type ParsedWapkEnvelope =
    | { version: 1; payload: Buffer }
    | { version: 2; payload: Buffer; lock: WapkLockMetadata };

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
    syncInterval?: number;
    useWatcher?: boolean;
    lock?: ResolvedWapkCredentials;
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
    lock?: WapkCredentialsOptions;
}

const WAPK_MAGIC = Buffer.from('WAPK');
const WAPK_UNLOCKED_VERSION = 1;
const WAPK_LOCKED_VERSION = 2;
const WAPK_VERSION = WAPK_LOCKED_VERSION;
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
const WAPK_CIPHER = 'aes-256-gcm';
const WAPK_KDF = 'scrypt';
const WAPK_KEY_LENGTH = 32;
const WAPK_SALT_LENGTH = 16;
const WAPK_IV_LENGTH = 12;
const WAPK_AUTH_TAG_LENGTH = 16;
const WAPK_SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 } as const;

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

function normalizeNonEmptyString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
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

function normalizeWapkLockConfig(value: unknown): WapkCredentialsOptions | undefined {
    if (!isRecord(value)) {
        return undefined;
    }

    const password = typeof value.password === 'string' && value.password.length > 0
        ? value.password
        : undefined;
    const passwordEnv = normalizeNonEmptyString(value.passwordEnv);

    if (!password && !passwordEnv) {
        return undefined;
    }

    return {
        password,
        passwordEnv,
    };
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
        lock: normalizeWapkLockConfig(value.lock),
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

function hasCredentialInput(value: WapkCredentialsOptions | undefined): boolean {
    return Boolean(
        (typeof value?.password === 'string' && value.password.length > 0)
        || normalizeNonEmptyString(value?.passwordEnv),
    );
}

function resolvePasswordFromInput(
    value: WapkCredentialsOptions | undefined,
    context: string,
): string | undefined {
    if (!value) {
        return undefined;
    }

    if (typeof value.password === 'string' && value.password.length > 0) {
        return value.password;
    }

    const passwordEnv = normalizeNonEmptyString(value.passwordEnv);
    if (!passwordEnv) {
        return undefined;
    }

    const password = process.env[passwordEnv];
    if (typeof password !== 'string' || password.length === 0) {
        throw new Error(`${context} requires environment variable "${passwordEnv}" to be set.`);
    }

    return password;
}

function resolvePackLockCredentials(
    configLock: WapkCredentialsOptions | undefined,
    overrideLock: WapkCredentialsOptions | undefined,
): ResolvedWapkCredentials | undefined {
    const password = resolvePasswordFromInput(overrideLock, 'WAPK lock')
        ?? resolvePasswordFromInput(configLock, 'WAPK lock');
    const shouldLock = hasCredentialInput(configLock) || hasCredentialInput(overrideLock);

    if (!shouldLock) {
        return undefined;
    }

    if (!password) {
        throw new Error('WAPK lock requires a password. Provide --password, --password-env, or config.wapk.lock.password/passwordEnv.');
    }

    return { password };
}

function resolveArchiveCredentials(
    value: WapkCredentialsOptions | undefined,
): ResolvedWapkCredentials | undefined {
    if (!hasCredentialInput(value)) {
        return undefined;
    }

    const password = resolvePasswordFromInput(value, 'WAPK archive');
    if (!password) {
        throw new Error('WAPK archive is password-protected. Provide --password or --password-env to unlock it.');
    }

    return { password };
}

function buildWapkAuthData(legacyUser?: string): Buffer {
    return Buffer.from(legacyUser ? `WAPK:${legacyUser}` : 'WAPK', 'utf8');
}

function encryptWapkPayload(payload: Buffer, lock: ResolvedWapkCredentials): { metadata: WapkLockMetadata; payload: Buffer } {
    const salt = randomBytes(WAPK_SALT_LENGTH);
    const iv = randomBytes(WAPK_IV_LENGTH);
    const key = scryptSync(lock.password, salt, WAPK_KEY_LENGTH, WAPK_SCRYPT_OPTIONS);
    const cipher = createCipheriv(WAPK_CIPHER, key, iv);
    cipher.setAAD(buildWapkAuthData());

    const encryptedPayload = Buffer.concat([cipher.update(payload), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
        metadata: {
            cipher: WAPK_CIPHER,
            kdf: WAPK_KDF,
            salt: salt.toString('base64'),
            iv: iv.toString('base64'),
            tag: tag.toString('base64'),
        },
        payload: encryptedPayload,
    };
}

function decodeLockBuffer(value: string, expectedLength: number, field: string): Buffer {
    const buffer = Buffer.from(value, 'base64');
    if (buffer.length !== expectedLength) {
        throw new Error(`Invalid WAPK file: bad ${field}.`);
    }
    return buffer;
}

function decryptWapkPayload(payload: Buffer, lock: WapkLockMetadata, credentials: ResolvedWapkCredentials): Buffer {
    const salt = decodeLockBuffer(lock.salt, WAPK_SALT_LENGTH, 'lock salt');
    const iv = decodeLockBuffer(lock.iv, WAPK_IV_LENGTH, 'lock iv');
    const tag = decodeLockBuffer(lock.tag, WAPK_AUTH_TAG_LENGTH, 'lock auth tag');
    const key = scryptSync(credentials.password, salt, WAPK_KEY_LENGTH, WAPK_SCRYPT_OPTIONS);
    const decipher = createDecipheriv(WAPK_CIPHER, key, iv);
    decipher.setAAD(buildWapkAuthData(lock.user));
    decipher.setAuthTag(tag);

    try {
        return Buffer.concat([decipher.update(payload), decipher.final()]);
    } catch {
        throw new Error('Invalid WAPK credentials.');
    }
}

function parseWapkLockMetadata(rawMetadata: unknown): WapkLockMetadata {
    if (!isRecord(rawMetadata)) {
        throw new Error('Invalid WAPK file: lock metadata must be an object.');
    }

    if (rawMetadata.cipher !== WAPK_CIPHER) {
        throw new Error(`Unsupported WAPK cipher: ${String(rawMetadata.cipher)}`);
    }

    if (rawMetadata.kdf !== WAPK_KDF) {
        throw new Error(`Unsupported WAPK KDF: ${String(rawMetadata.kdf)}`);
    }

    if (typeof rawMetadata.salt !== 'string' || typeof rawMetadata.iv !== 'string' || typeof rawMetadata.tag !== 'string') {
        throw new Error('Invalid WAPK file: lock metadata is incomplete.');
    }

    return {
        cipher: WAPK_CIPHER,
        kdf: WAPK_KDF,
        salt: rawMetadata.salt,
        iv: rawMetadata.iv,
        tag: rawMetadata.tag,
        user: normalizeNonEmptyString(rawMetadata.user),
    };
}

function parseWapkEnvelope(buffer: Buffer): ParsedWapkEnvelope {
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

    if (version === WAPK_UNLOCKED_VERSION) {
        return {
            version: WAPK_UNLOCKED_VERSION,
            payload: buffer.subarray(offset),
        };
    }

    ensureBufferRange(buffer, offset, 4, 'lock metadata length');
    const metadataLength = buffer.readUInt32LE(offset);
    offset += 4;

    ensureBufferRange(buffer, offset, metadataLength, 'lock metadata');
    const metadata = JSON.parse(buffer.slice(offset, offset + metadataLength).toString('utf8'));
    offset += metadataLength;

    ensureBufferRange(buffer, offset, 4, 'encrypted payload length');
    const payloadLength = buffer.readUInt32LE(offset);
    offset += 4;

    ensureBufferRange(buffer, offset, payloadLength, 'encrypted payload');
    const payload = buffer.slice(offset, offset + payloadLength);

    return {
        version: WAPK_LOCKED_VERSION,
        payload,
        lock: parseWapkLockMetadata(metadata),
    };
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
        lock: elitWapkConfig.lock,
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

function encodeWapkPayload(header: WapkHeader, files: readonly WapkFileEntry[]): Buffer {
    const headerBuffer = Buffer.from(JSON.stringify(header, null, 2), 'utf8');
    let totalSize = 4 + headerBuffer.length + 4;

    for (const file of files) {
        const pathBuffer = Buffer.from(file.path, 'utf8');
        totalSize += 2 + pathBuffer.length + 4 + 4 + file.content.length;
    }

    const buffer = Buffer.allocUnsafe(totalSize);
    let offset = 0;

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

function encodeWapk(header: WapkHeader, files: readonly WapkFileEntry[], lock?: ResolvedWapkCredentials): Buffer {
    const payload = encodeWapkPayload(header, files);

    if (!lock) {
        const buffer = Buffer.allocUnsafe(WAPK_MAGIC.length + 2 + payload.length);
        let offset = 0;

        WAPK_MAGIC.copy(buffer, offset);
        offset += WAPK_MAGIC.length;
        buffer.writeUInt16LE(WAPK_UNLOCKED_VERSION, offset);
        offset += 2;
        payload.copy(buffer, offset);

        return buffer;
    }

    const encrypted = encryptWapkPayload(payload, lock);
    const metadataBuffer = Buffer.from(JSON.stringify(encrypted.metadata), 'utf8');
    const buffer = Buffer.allocUnsafe(
        WAPK_MAGIC.length + 2 + 4 + metadataBuffer.length + 4 + encrypted.payload.length,
    );
    let offset = 0;

    WAPK_MAGIC.copy(buffer, offset);
    offset += WAPK_MAGIC.length;
    buffer.writeUInt16LE(WAPK_LOCKED_VERSION, offset);
    offset += 2;
    buffer.writeUInt32LE(metadataBuffer.length, offset);
    offset += 4;
    metadataBuffer.copy(buffer, offset);
    offset += metadataBuffer.length;
    buffer.writeUInt32LE(encrypted.payload.length, offset);
    offset += 4;
    encrypted.payload.copy(buffer, offset);

    return buffer;
}

function decodeWapkPayload(buffer: Buffer): Omit<DecodedWapk, 'version' | 'lock'> {
    let offset = 0;

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

    return { header, files };
}

function decodeWapk(buffer: Buffer, options: WapkCredentialsOptions = {}): DecodedWapk {
    const envelope = parseWapkEnvelope(buffer);

    if (envelope.version === WAPK_UNLOCKED_VERSION) {
        return {
            version: envelope.version,
            ...decodeWapkPayload(envelope.payload),
        };
    }

    const credentials = resolveArchiveCredentials(options);
    if (!credentials) {
        throw new Error('WAPK archive is password-protected. Provide --password or --password-env to unlock it.');
    }

    return {
        version: envelope.version,
        ...decodeWapkPayload(decryptWapkPayload(envelope.payload, envelope.lock, credentials)),
        lock: { password: true },
    };
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

function writeWapkArchiveFromMemory(
    archivePath: string,
    header: WapkHeader,
    files: readonly WapkFileEntry[],
    lock?: ResolvedWapkCredentials,
): void {
    const updatedHeader: WapkHeader = {
        ...header,
        createdAt: new Date().toISOString(),
    };
    writeFileSync(archivePath, encodeWapk(updatedHeader, files, lock));
}

export function createWapkLiveSync(prepared: PreparedWapkApp): WapkLiveSyncController {
    let memoryFiles = collectRuntimeSyncFiles(prepared.workDir);
    const syncInterval = prepared.syncInterval ?? 300;
    let stopped = false;

    const flush = (): void => {
        if (stopped) return;

        const nextFiles = collectRuntimeSyncFiles(prepared.workDir);
        if (filesEqual(memoryFiles, nextFiles)) {
            return;
        }

        memoryFiles = nextFiles;
        writeWapkArchiveFromMemory(prepared.archivePath, prepared.header, memoryFiles, prepared.lock);
    };

    if (prepared.useWatcher) {
        // Event-driven file watcher mode
        const watcher = watch(prepared.workDir, { recursive: true }, () => {
            flush();
        });

        const stop = (): void => {
            flush();
            stopped = true;
            watcher.close();
        };

        return { flush, stop };
    }

    // Polling mode (default)
    const timer = setInterval(flush, syncInterval);
    timer.unref?.();

    const stop = (): void => {
        flush();
        stopped = true;
        clearInterval(timer);
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

export function readWapkArchive(wapkPath: string, options: WapkCredentialsOptions = {}): DecodedWapk {
    const archivePath = resolve(wapkPath);
    if (!existsSync(archivePath)) {
        throw new Error(`WAPK file not found: ${archivePath}`);
    }

    return decodeWapk(readFileSync(archivePath), options);
}

export async function packWapkDirectory(
    directory: string,
    options: WapkCredentialsOptions & { includeDeps?: boolean; outputPath?: string } = {},
): Promise<string> {
    const sourceDirectory = resolve(directory);
    if (!existsSync(sourceDirectory) || !statSync(sourceDirectory).isDirectory()) {
        throw new Error(`WAPK source directory not found: ${sourceDirectory}`);
    }

    const config = await readWapkProjectConfig(sourceDirectory);
    const lock = resolvePackLockCredentials(config.lock, options);
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
    if (lock) {
        console.log('Lock:    enabled');
    }
    if (options.includeDeps) {
        console.log('Deps:    included');
    }
    console.log(`Files:   ${files.length}`);

    writeFileSync(outputPath, encodeWapk(header, files, lock));
    console.log(`Output:  ${outputPath}`);
    return outputPath;
}

export function extractWapkArchive(
    wapkPath: string,
    outputDir = '.',
    options: WapkCredentialsOptions = {},
): string {
    const archive = readWapkArchive(wapkPath, options);
    const destinationRoot = resolve(outputDir);
    const extractDirectory = join(destinationRoot, sanitizePackageName(archive.header.name));

    mkdirSync(extractDirectory, { recursive: true });
    extractFiles(archive.files, extractDirectory);
    console.log(`Extracted ${archive.files.length} files to: ${extractDirectory}`);
    return extractDirectory;
}

export function prepareWapkApp(
    wapkPath: string,
    options: WapkCredentialsOptions & { runtime?: WapkRuntimeName; syncInterval?: number; useWatcher?: boolean } = {},
): PreparedWapkApp {
    const archivePath = resolve(wapkPath);
    if (!existsSync(archivePath)) {
        throw new Error(`WAPK file not found: ${archivePath}`);
    }

    const buffer = readFileSync(archivePath);
    const envelope = parseWapkEnvelope(buffer);
    const lock = envelope.version === WAPK_LOCKED_VERSION
        ? resolveArchiveCredentials(options)
        : undefined;
    const decoded = decodeWapk(buffer, options);
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
        syncInterval: options.syncInterval,
        useWatcher: options.useWatcher,
        lock,
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

function inspectWapkArchive(wapkPath: string, options: WapkCredentialsOptions = {}): void {
    const archivePath = resolve(wapkPath);
    const buffer = readFileSync(archivePath);
    const envelope = parseWapkEnvelope(buffer);

    console.log(`WAPK:     ${basename(archivePath)}`);
    console.log(`Size:     ${formatSize(buffer.length)}`);
    console.log(`Version:  ${envelope.version}`);
    console.log(`Locked:   ${envelope.version === WAPK_LOCKED_VERSION ? 'yes' : 'no'}`);

    if (envelope.version === WAPK_LOCKED_VERSION) {
        if (!hasCredentialInput(options)) {
            console.log('Status:   credentials required to inspect contents');
            return;
        }
    }

    const decoded = decodeWapk(buffer, options);
    const totalContentSize = decoded.files.reduce((total, file) => total + file.content.length, 0);

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
        '  elit wapk run <file.wapk> --sync-interval 100',
        '  elit wapk run <file.wapk> --watcher',
        '  elit wapk pack [directory]',
        '  elit wapk pack [directory] --password-env WAPK_PASSWORD',
        '  elit wapk pack [directory] --include-deps',
        '  elit wapk inspect <file.wapk>',
        '  elit wapk extract <file.wapk>',
        '',
        'Options:',
        '  -r, --runtime <name>         Runtime override: node, bun, deno',
        '  --sync-interval <ms>         Polling interval for live sync (ms, default 300)',
        '  --watcher, --use-watcher     Use event-driven file watcher instead of polling',
        '  --include-deps               Include node_modules in the archive',
        '  --password <value>           Password for locking or unlocking the archive',
        '  --password-env <name>        Read the password from an environment variable',
        '  -h, --help                   Show this help',
        '',
        'Notes:',
        '  - Pack reads wapk from elit.config.* and falls back to package.json.',
        '  - Run mode keeps files in RAM and syncs changes back to the .wapk file.',
        '  - Locked archives require the same password for run/extract/inspect.',
        '  - Archives stay unlocked by default unless a password is provided.',
        '  - Use --watcher for faster file change detection (less CPU usage).',
        '  - Runtime commands use node, bun, or deno from PATH.',
    ].join('\n'));
}

function readRequiredOptionValue(args: string[], index: number, option: string): string {
    const value = args[index];
    if (value === undefined) {
        throw new Error(`${option} requires a value.`);
    }
    return value;
}

function parseArchiveAccessArgs(args: string[], usage: string): { file: string } & WapkCredentialsOptions {
    let file: string | undefined;
    let password: string | undefined;
    let passwordEnv: string | undefined;

    for (let index = 0; index < args.length; index++) {
        const arg = args[index];

        switch (arg) {
            case '--password':
                password = readRequiredOptionValue(args, ++index, '--password');
                break;
            case '--password-env':
                passwordEnv = readRequiredOptionValue(args, ++index, '--password-env');
                break;
            default:
                if (arg.startsWith('-')) {
                    throw new Error(`Unknown WAPK option: ${arg}`);
                }
                if (file) {
                    throw new Error(usage);
                }
                file = arg;
                break;
        }
    }

    if (!file) {
        throw new Error(usage);
    }

    return { file, password, passwordEnv };
}

function parseRunArgs(args: string[]): { file: string; runtime?: WapkRuntimeName; syncInterval?: number; useWatcher?: boolean } & WapkCredentialsOptions {
    let file: string | undefined;
    let runtime: WapkRuntimeName | undefined;
    let syncInterval: number | undefined;
    let useWatcher = false;
    let password: string | undefined;
    let passwordEnv: string | undefined;

    for (let index = 0; index < args.length; index++) {
        const arg = args[index];
        switch (arg) {
            case '--runtime':
            case '-r': {
                const value = normalizeRuntime(readRequiredOptionValue(args, ++index, arg));
                if (!value) {
                    throw new Error(`Unknown WAPK runtime: ${args[index]}`);
                }
                runtime = value;
                break;
            }
            case '--sync-interval': {
                const value = parseInt(readRequiredOptionValue(args, ++index, '--sync-interval'), 10);
                if (Number.isNaN(value) || value < 50) {
                    throw new Error('--sync-interval must be a number >= 50 (milliseconds)');
                }
                syncInterval = value;
                break;
            }
            case '--use-watcher':
            case '--watcher': {
                useWatcher = true;
                break;
            }
            case '--password':
                password = readRequiredOptionValue(args, ++index, '--password');
                break;
            case '--password-env':
                passwordEnv = readRequiredOptionValue(args, ++index, '--password-env');
                break;
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

    return { file, runtime, syncInterval, useWatcher, password, passwordEnv };
}

function parsePackArgs(args: string[]): { directory: string; includeDeps: boolean } & WapkCredentialsOptions {
    let directory = '.';
    let includeDeps = false;
    let password: string | undefined;
    let passwordEnv: string | undefined;

    for (let index = 0; index < args.length; index++) {
        const arg = args[index];

        if (arg === '--include-deps') {
            includeDeps = true;
            continue;
        }

        if (arg === '--password') {
            password = readRequiredOptionValue(args, ++index, '--password');
            continue;
        }

        if (arg === '--password-env') {
            passwordEnv = readRequiredOptionValue(args, ++index, '--password-env');
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

    return { directory, includeDeps, password, passwordEnv };
}

export async function runWapkCommand(args: string[]): Promise<void> {
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        printWapkHelp();
        return;
    }

    if (args[0] === 'pack') {
        const options = parsePackArgs(args.slice(1));
        await packWapkDirectory(options.directory, {
            includeDeps: options.includeDeps,
            password: options.password,
            passwordEnv: options.passwordEnv,
        });
        return;
    }

    if (args[0] === 'inspect') {
        const options = parseArchiveAccessArgs(args.slice(1), 'Usage: elit wapk inspect <file.wapk>');
        inspectWapkArchive(options.file, options);
        return;
    }

    if (args[0] === 'extract') {
        const options = parseArchiveAccessArgs(args.slice(1), 'Usage: elit wapk extract <file.wapk>');
        extractWapkArchive(options.file, '.', options);
        return;
    }

    const runOptions = args[0] === 'run' ? parseRunArgs(args.slice(1)) : parseRunArgs(args);
    const prepared = prepareWapkApp(runOptions.file, {
        runtime: runOptions.runtime,
        syncInterval: runOptions.syncInterval,
        useWatcher: runOptions.useWatcher,
        password: runOptions.password,
        passwordEnv: runOptions.passwordEnv,
    });
    const exitCode = await runPreparedWapkApp(prepared);
    if (exitCode !== 0) {
        process.exit(exitCode);
    }
}