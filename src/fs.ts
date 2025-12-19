/**
 * File System module with unified API across runtimes
 * Compatible with Node.js 'fs' module API
 * - Node.js: uses 'fs' module
 * - Bun: uses Bun.file() and native APIs
 * - Deno: uses Deno.readFile(), etc.
 */

import { runtime } from './runtime';

// Pre-load fs module for Node.js
let fs: any, fsPromises: any;
if (runtime === 'node') {
  fs = require('fs');
  fsPromises = require('fs/promises');
}

/**
 * File encoding types
 */
export type BufferEncoding =
  | 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2'
  | 'base64' | 'base64url' | 'latin1' | 'binary' | 'hex';

/**
 * Read file options
 */
export interface ReadFileOptions {
  encoding?: BufferEncoding | null;
  flag?: string;
  signal?: AbortSignal;
}

/**
 * Write file options
 */
export interface WriteFileOptions {
  encoding?: BufferEncoding | null;
  mode?: number;
  flag?: string;
  signal?: AbortSignal;
}

/**
 * Mkdir options
 */
export interface MkdirOptions {
  recursive?: boolean;
  mode?: number;
}

/**
 * Readdir options
 */
export interface ReaddirOptions {
  encoding?: BufferEncoding | null;
  withFileTypes?: boolean;
  recursive?: boolean;
}

/**
 * File stats
 */
export interface Stats {
  isFile(): boolean;
  isDirectory(): boolean;
  isBlockDevice(): boolean;
  isCharacterDevice(): boolean;
  isSymbolicLink(): boolean;
  isFIFO(): boolean;
  isSocket(): boolean;
  dev: number;
  ino: number;
  mode: number;
  nlink: number;
  uid: number;
  gid: number;
  rdev: number;
  size: number;
  blksize: number;
  blocks: number;
  atimeMs: number;
  mtimeMs: number;
  ctimeMs: number;
  birthtimeMs: number;
  atime: Date;
  mtime: Date;
  ctime: Date;
  birthtime: Date;
}

/**
 * Directory entry
 */
export interface Dirent {
  name: string;
  isFile(): boolean;
  isDirectory(): boolean;
  isBlockDevice(): boolean;
  isCharacterDevice(): boolean;
  isSymbolicLink(): boolean;
  isFIFO(): boolean;
  isSocket(): boolean;
}

/**
 * Read file (async)
 */
export async function readFile(path: string, options?: ReadFileOptions | BufferEncoding): Promise<string | Buffer> {
  const opts = typeof options === 'string' ? { encoding: options } : options || {};

  if (runtime === 'node') {
    return fsPromises.readFile(path, opts);
  } else if (runtime === 'bun') {
    // @ts-ignore
    const file = Bun.file(path);
    const content = await file.arrayBuffer();
    if (opts.encoding) {
      return new TextDecoder(opts.encoding).decode(content);
    }
    return Buffer.from(content);
  } else if (runtime === 'deno') {
    // @ts-ignore
    const content = await Deno.readFile(path);
    if (opts.encoding) {
      return new TextDecoder(opts.encoding).decode(content);
    }
    return Buffer.from(content);
  }

  throw new Error('Unsupported runtime');
}

/**
 * Read file (sync)
 */
export function readFileSync(path: string, options?: ReadFileOptions | BufferEncoding): string | Buffer {
  const opts = typeof options === 'string' ? { encoding: options } : options || {};

  if (runtime === 'node') {
    return fs.readFileSync(path, opts);
  } else if (runtime === 'bun') {
    // @ts-ignore
    const file = Bun.file(path);
    const content = file.arrayBuffer();
    if (opts.encoding) {
      return new TextDecoder(opts.encoding).decode(content as ArrayBuffer);
    }
    return Buffer.from(content as ArrayBuffer);
  } else if (runtime === 'deno') {
    // @ts-ignore
    const content = Deno.readFileSync(path);
    if (opts.encoding) {
      return new TextDecoder(opts.encoding).decode(content);
    }
    return Buffer.from(content);
  }

  throw new Error('Unsupported runtime');
}

/**
 * Write file (async)
 */
export async function writeFile(path: string, data: string | Buffer | Uint8Array, options?: WriteFileOptions | BufferEncoding): Promise<void> {
  const opts = typeof options === 'string' ? { encoding: options } : options || {};

  if (runtime === 'node') {
    return fsPromises.writeFile(path, data, opts);
  } else if (runtime === 'bun') {
    // @ts-ignore
    await Bun.write(path, data);
  } else if (runtime === 'deno') {
    const content = typeof data === 'string'
      ? new TextEncoder().encode(data)
      : data instanceof Buffer
        ? new Uint8Array(data)
        : data;
    // @ts-ignore
    await Deno.writeFile(path, content);
  }
}

/**
 * Write file (sync)
 */
export function writeFileSync(path: string, data: string | Buffer | Uint8Array, options?: WriteFileOptions | BufferEncoding): void {
  const opts = typeof options === 'string' ? { encoding: options } : options || {};

  if (runtime === 'node') {
    fs.writeFileSync(path, data, opts);
  } else if (runtime === 'bun') {
    // @ts-ignore
    Bun.write(path, data);
  } else if (runtime === 'deno') {
    const content = typeof data === 'string'
      ? new TextEncoder().encode(data)
      : data instanceof Buffer
        ? new Uint8Array(data)
        : data;
    // @ts-ignore
    Deno.writeFileSync(path, content);
  }
}

/**
 * Append file (async)
 */
export async function appendFile(path: string, data: string | Buffer, options?: WriteFileOptions | BufferEncoding): Promise<void> {
  const opts = typeof options === 'string' ? { encoding: options } : options || {};

  if (runtime === 'node') {
    return fsPromises.appendFile(path, data, opts);
  } else {
    if (await exists(path)) {
      const existing = await readFile(path);
      const combined = Buffer.isBuffer(existing)
        ? Buffer.concat([existing, Buffer.isBuffer(data) ? data : Buffer.from(data)])
        : existing + (Buffer.isBuffer(data) ? data.toString() : data);
      await writeFile(path, combined, opts);
    } else {
      await writeFile(path, data, opts);
    }
  }
}

/**
 * Append file (sync)
 */
export function appendFileSync(path: string, data: string | Buffer, options?: WriteFileOptions | BufferEncoding): void {
  const opts = typeof options === 'string' ? { encoding: options } : options || {};

  if (runtime === 'node') {
    fs.appendFileSync(path, data, opts);
  } else {
    if (existsSync(path)) {
      const existing = readFileSync(path);
      const combined = Buffer.isBuffer(existing)
        ? Buffer.concat([existing, Buffer.isBuffer(data) ? data : Buffer.from(data)])
        : existing + (Buffer.isBuffer(data) ? data.toString() : data);
      writeFileSync(path, combined, opts);
    } else {
      writeFileSync(path, data, opts);
    }
  }
}

/**
 * Check if file/directory exists (async)
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if file/directory exists (sync)
 */
export function existsSync(path: string): boolean {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file stats (async)
 */
export async function stat(path: string): Promise<Stats> {
  if (runtime === 'node') {
    return fsPromises.stat(path);
  } else if (runtime === 'bun') {
    // @ts-ignore
    const file = Bun.file(path);
    const size = file.size;
    const exists = await file.exists();

    if (!exists) {
      throw new Error(`ENOENT: no such file or directory, stat '${path}'`);
    }

    // Create a Stats-like object
    return createStatsObject(path, size, false);
  } else if (runtime === 'deno') {
    // @ts-ignore
    const info = await Deno.stat(path);
    return createStatsFromDenoFileInfo(info);
  }

  throw new Error('Unsupported runtime');
}

/**
 * Get file stats (sync)
 */
export function statSync(path: string): Stats {
  if (runtime === 'node') {
    return fs.statSync(path);
  } else if (runtime === 'bun') {
    // @ts-ignore
    const file = Bun.file(path);
    const size = file.size;

    // Bun doesn't have sync exists check, so we try to read
    try {
      file.arrayBuffer();
    } catch {
      throw new Error(`ENOENT: no such file or directory, stat '${path}'`);
    }

    return createStatsObject(path, size, false);
  } else if (runtime === 'deno') {
    // @ts-ignore
    const info = Deno.statSync(path);
    return createStatsFromDenoFileInfo(info);
  }

  throw new Error('Unsupported runtime');
}

/**
 * Create directory (async)
 */
export async function mkdir(path: string, options?: MkdirOptions | number): Promise<void> {
  const opts = typeof options === 'number' ? { mode: options } : options || {};

  if (runtime === 'node') {
    await fsPromises.mkdir(path, opts);
  } else if (runtime === 'bun') {
    // @ts-ignore
    await Deno.mkdir(path, { recursive: opts.recursive });
  } else if (runtime === 'deno') {
    // @ts-ignore
    await Deno.mkdir(path, { recursive: opts.recursive });
  }
}

/**
 * Create directory (sync)
 */
export function mkdirSync(path: string, options?: MkdirOptions | number): void {
  const opts = typeof options === 'number' ? { mode: options } : options || {};

  if (runtime === 'node') {
    fs.mkdirSync(path, opts);
  } else if (runtime === 'bun') {
    // @ts-ignore
    Deno.mkdirSync(path, { recursive: opts.recursive });
  } else if (runtime === 'deno') {
    // @ts-ignore
    Deno.mkdirSync(path, { recursive: opts.recursive });
  }
}

/**
 * Read directory (async)
 */
export async function readdir(path: string, options?: ReaddirOptions | BufferEncoding): Promise<string[] | Dirent[]> {
  const opts = typeof options === 'string' ? { encoding: options } : options || {};

  if (runtime === 'node') {
    return fsPromises.readdir(path, opts);
  } else if (runtime === 'bun') {
    // @ts-ignore
    const entries = [];
    // @ts-ignore
    for await (const entry of Deno.readDir(path)) {
      if (opts.withFileTypes) {
        entries.push(createDirentFromDenoEntry(entry));
      } else {
        entries.push(entry.name);
      }
    }
    return entries;
  } else if (runtime === 'deno') {
    // @ts-ignore
    const entries = [];
    // @ts-ignore
    for await (const entry of Deno.readDir(path)) {
      if (opts.withFileTypes) {
        entries.push(createDirentFromDenoEntry(entry));
      } else {
        entries.push(entry.name);
      }
    }
    return entries;
  }

  throw new Error('Unsupported runtime');
}

/**
 * Read directory (sync)
 */
export function readdirSync(path: string, options?: ReaddirOptions | BufferEncoding): string[] | Dirent[] {
  const opts = typeof options === 'string' ? { encoding: options } : options || {};

  if (runtime === 'node') {
    return fs.readdirSync(path, opts);
  } else if (runtime === 'bun') {
    // @ts-ignore
    const entries = [];
    // @ts-ignore
    for (const entry of Deno.readDirSync(path)) {
      if (opts.withFileTypes) {
        entries.push(createDirentFromDenoEntry(entry));
      } else {
        entries.push(entry.name);
      }
    }
    return entries;
  } else if (runtime === 'deno') {
    // @ts-ignore
    const entries = [];
    // @ts-ignore
    for (const entry of Deno.readDirSync(path)) {
      if (opts.withFileTypes) {
        entries.push(createDirentFromDenoEntry(entry));
      } else {
        entries.push(entry.name);
      }
    }
    return entries;
  }

  throw new Error('Unsupported runtime');
}

/**
 * Remove file (async)
 */
export async function unlink(path: string): Promise<void> {
  if (runtime === 'node') {
    return fsPromises.unlink(path);
  } else if (runtime === 'bun') {
    // @ts-ignore
    await Deno.remove(path);
  } else if (runtime === 'deno') {
    // @ts-ignore
    await Deno.remove(path);
  }
}

/**
 * Remove file (sync)
 */
export function unlinkSync(path: string): void {
  if (runtime === 'node') {
    fs.unlinkSync(path);
  } else if (runtime === 'bun') {
    // @ts-ignore
    Deno.removeSync(path);
  } else if (runtime === 'deno') {
    // @ts-ignore
    Deno.removeSync(path);
  }
}

/**
 * Remove directory (async)
 */
export async function rmdir(path: string, options?: { recursive?: boolean }): Promise<void> {
  if (runtime === 'node') {
    return fsPromises.rmdir(path, options);
  } else if (runtime === 'bun') {
    // @ts-ignore
    await Deno.remove(path, { recursive: options?.recursive });
  } else if (runtime === 'deno') {
    // @ts-ignore
    await Deno.remove(path, { recursive: options?.recursive });
  }
}

/**
 * Remove directory (sync)
 */
export function rmdirSync(path: string, options?: { recursive?: boolean }): void {
  if (runtime === 'node') {
    fs.rmdirSync(path, options);
  } else if (runtime === 'bun') {
    // @ts-ignore
    Deno.removeSync(path, { recursive: options?.recursive });
  } else if (runtime === 'deno') {
    // @ts-ignore
    Deno.removeSync(path, { recursive: options?.recursive });
  }
}

/**
 * Rename/move file (async)
 */
export async function rename(oldPath: string, newPath: string): Promise<void> {
  if (runtime === 'node') {
    return fsPromises.rename(oldPath, newPath);
  } else if (runtime === 'bun') {
    // @ts-ignore
    await Deno.rename(oldPath, newPath);
  } else if (runtime === 'deno') {
    // @ts-ignore
    await Deno.rename(oldPath, newPath);
  }
}

/**
 * Rename/move file (sync)
 */
export function renameSync(oldPath: string, newPath: string): void {
  if (runtime === 'node') {
    fs.renameSync(oldPath, newPath);
  } else if (runtime === 'bun') {
    // @ts-ignore
    Deno.renameSync(oldPath, newPath);
  } else if (runtime === 'deno') {
    // @ts-ignore
    Deno.renameSync(oldPath, newPath);
  }
}

/**
 * Copy file (async)
 */
export async function copyFile(src: string, dest: string, flags?: number): Promise<void> {
  if (runtime === 'node') {
    return fsPromises.copyFile(src, dest, flags);
  } else if (runtime === 'bun') {
    // @ts-ignore
    await Deno.copyFile(src, dest);
  } else if (runtime === 'deno') {
    // @ts-ignore
    await Deno.copyFile(src, dest);
  }
}

/**
 * Copy file (sync)
 */
export function copyFileSync(src: string, dest: string, flags?: number): void {
  if (runtime === 'node') {
    fs.copyFileSync(src, dest, flags);
  } else if (runtime === 'bun') {
    // @ts-ignore
    Deno.copyFileSync(src, dest);
  } else if (runtime === 'deno') {
    // @ts-ignore
    Deno.copyFileSync(src, dest);
  }
}

/**
 * Resolve pathname to absolute path (async)
 */
export async function realpath(path: string, options?: { encoding?: BufferEncoding }): Promise<string> {
  if (runtime === 'node') {
    return fsPromises.realpath(path, options);
  } else if (runtime === 'bun') {
    // Bun supports fs.promises.realpath
    const fs = require('fs/promises');
    return fs.realpath(path, options);
  } else if (runtime === 'deno') {
    // @ts-ignore
    return await Deno.realPath(path);
  }
  return path;
}

/**
 * Resolve pathname to absolute path (sync)
 */
export function realpathSync(path: string, options?: { encoding?: BufferEncoding }): string {
  if (runtime === 'node') {
    return fs.realpathSync(path, options);
  } else if (runtime === 'bun') {
    // Bun supports fs.realpathSync
    const fs = require('fs');
    return fs.realpathSync(path, options);
  } else if (runtime === 'deno') {
    // @ts-ignore
    return Deno.realPathSync(path);
  }
  return path;
}

/**
 * Helper: Create Stats object
 */
function createStatsObject(_path: string, size: number, isDir: boolean): Stats {
  const now = Date.now();
  return {
    isFile: () => !isDir,
    isDirectory: () => isDir,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    dev: 0,
    ino: 0,
    mode: isDir ? 16877 : 33188,
    nlink: 1,
    uid: 0,
    gid: 0,
    rdev: 0,
    size,
    blksize: 4096,
    blocks: Math.ceil(size / 512),
    atimeMs: now,
    mtimeMs: now,
    ctimeMs: now,
    birthtimeMs: now,
    atime: new Date(now),
    mtime: new Date(now),
    ctime: new Date(now),
    birthtime: new Date(now),
  };
}

/**
 * Helper: Create Stats from Deno FileInfo
 */
function createStatsFromDenoFileInfo(info: any): Stats {
  return {
    isFile: () => info.isFile,
    isDirectory: () => info.isDirectory,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => info.isSymlink || false,
    isFIFO: () => false,
    isSocket: () => false,
    dev: info.dev || 0,
    ino: info.ino || 0,
    mode: info.mode || 0,
    nlink: info.nlink || 1,
    uid: info.uid || 0,
    gid: info.gid || 0,
    rdev: 0,
    size: info.size,
    blksize: info.blksize || 4096,
    blocks: info.blocks || Math.ceil(info.size / 512),
    atimeMs: info.atime?.getTime() || Date.now(),
    mtimeMs: info.mtime?.getTime() || Date.now(),
    ctimeMs: info.birthtime?.getTime() || Date.now(),
    birthtimeMs: info.birthtime?.getTime() || Date.now(),
    atime: info.atime || new Date(),
    mtime: info.mtime || new Date(),
    ctime: info.birthtime || new Date(),
    birthtime: info.birthtime || new Date(),
  };
}

/**
 * Helper: Create Dirent from Deno DirEntry
 */
function createDirentFromDenoEntry(entry: any): Dirent {
  return {
    name: entry.name,
    isFile: () => entry.isFile,
    isDirectory: () => entry.isDirectory,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => entry.isSymlink || false,
    isFIFO: () => false,
    isSocket: () => false,
  };
}

/**
 * Get current runtime
 */
export function getRuntime(): 'node' | 'bun' | 'deno' {
  return runtime;
}

/**
 * Promises API (re-export for compatibility)
 */
export const promises = {
  readFile,
  writeFile,
  appendFile,
  stat,
  mkdir,
  readdir,
  unlink,
  rmdir,
  rename,
  copyFile,
  realpath,
};

/**
 * Default export
 */
export default {
  readFile,
  readFileSync,
  writeFile,
  writeFileSync,
  appendFile,
  appendFileSync,
  exists,
  existsSync,
  stat,
  statSync,
  mkdir,
  mkdirSync,
  readdir,
  readdirSync,
  unlink,
  unlinkSync,
  rmdir,
  rmdirSync,
  rename,
  renameSync,
  copyFile,
  copyFileSync,
  realpath,
  realpathSync,
  promises,
  getRuntime,
};
