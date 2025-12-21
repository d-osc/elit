/**
 * Path module with unified API across runtimes
 * Pure implementation without external dependencies
 * Compatible with Node.js 'path' module API
 * Works on Node.js, Bun, and Deno
 */

import { isBun, isDeno, isNode, runtime } from './runtime';

/**
 * Helper: Get path separator for platform (eliminates duplication in separator logic)
 */
function getSeparator(isWin: boolean): string {
  return isWin ? '\\' : '/';
}

/**
 * Helper: Get current working directory (eliminates duplication in resolvePaths)
 */
function getCwd(): string {
  if (isNode || isBun) {
    return process.cwd();
  } else if (isDeno) {
    // @ts-ignore
    return Deno.cwd();
  }
  return '/';
}

/**
 * Helper: Find last separator index (eliminates duplication in getExtname and getBasename)
 */
function findLastSeparator(path: string): number {
  return Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
}

/**
 * Helper: Create path operation object (eliminates duplication in posix and win32)
 */
function createPathOps(isWin: boolean) {
  return {
    sep: getSeparator(isWin),
    delimiter: isWin ? ';' : ':',
    normalize: (path: string) => normalizePath(path, isWin),
    join: (...paths: string[]) => joinPaths(paths, isWin),
    resolve: (...paths: string[]) => resolvePaths(paths, isWin),
    isAbsolute: (path: string) => isWin ? isAbsoluteWin(path) : isAbsolutePosix(path),
    relative: (from: string, to: string) => relativePath(from, to, isWin),
    dirname: (path: string) => getDirname(path, isWin),
    basename: (path: string, ext?: string) => getBasename(path, ext, isWin),
    extname: (path: string) => getExtname(path),
    parse: (path: string) => parsePath(path, isWin),
    format: (pathObject: FormatInputPathObject) => formatPath(pathObject, isWin)
  };
}

/**
 * Helper: Check if path is absolute (POSIX)
 */
function isAbsolutePosix(path: string): boolean {
  return path.length > 0 && path[0] === '/';
}

/**
 * Helper: Check if path is absolute (Windows)
 */
function isAbsoluteWin(path: string): boolean {
  const len = path.length;
  if (len === 0) return false;

  const code = path.charCodeAt(0);
  if (code === 47 /* / */ || code === 92 /* \ */) {
    return true;
  }

  // Check for drive letter
  if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
    if (len > 2 && path.charCodeAt(1) === 58 /* : */) {
      const code2 = path.charCodeAt(2);
      if (code2 === 47 /* / */ || code2 === 92 /* \ */) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Platform detection
 */
const isWindows = (() => {
  if (isNode) {
    return process.platform === 'win32';
  } else if (isDeno) {
    // @ts-ignore
    return Deno.build.os === 'windows';
  }
  // Bun uses process.platform like Node
  return typeof process !== 'undefined' && process.platform === 'win32';
})();

/**
 * Path separator
 */
export const sep = isWindows ? '\\' : '/';

/**
 * Path delimiter
 */
export const delimiter = isWindows ? ';' : ':';

/**
 * POSIX path operations
 */
const posix = createPathOps(false);

/**
 * Windows path operations
 */
const win32 = createPathOps(true);

/**
 * Path object interface
 */
export interface ParsedPath {
  root: string;
  dir: string;
  base: string;
  ext: string;
  name: string;
}

export interface FormatInputPathObject {
  root?: string;
  dir?: string;
  base?: string;
  ext?: string;
  name?: string;
}

/**
 * Normalize a path
 */
function normalizePath(path: string, isWin: boolean): string {
  if (path.length === 0) return '.';

  const separator = getSeparator(isWin);
  const isAbsolute = isWin ? isAbsoluteWin(path) : isAbsolutePosix(path);
  const trailingSeparator = path[path.length - 1] === separator || (isWin && path[path.length - 1] === '/');

  // Normalize slashes
  let normalized = path.replace(isWin ? /[\/\\]+/g : /\/+/g, separator);

  // Split path
  const parts = normalized.split(separator);
  const result: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part === '' || part === '.') {
      if (i === 0 && isAbsolute) result.push('');
      continue;
    }

    if (part === '..') {
      if (result.length > 0 && result[result.length - 1] !== '..') {
        if (!(result.length === 1 && result[0] === '')) {
          result.pop();
        }
      } else if (!isAbsolute) {
        result.push('..');
      }
    } else {
      result.push(part);
    }
  }

  let final = result.join(separator);

  if (final.length === 0) {
    return isAbsolute ? separator : '.';
  }

  if (trailingSeparator && final[final.length - 1] !== separator) {
    final += separator;
  }

  return final;
}

/**
 * Join paths
 */
function joinPaths(paths: string[], isWin: boolean): string {
  if (paths.length === 0) return '.';

  const separator = getSeparator(isWin);
  let joined = '';
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    if (path && path.length > 0) {
      if (joined.length === 0) {
        joined = path;
      } else {
        joined += separator + path;
      }
    }
  }

  if (joined.length === 0) return '.';

  return normalizePath(joined, isWin);
}

/**
 * Resolve paths to absolute path
 */
function resolvePaths(paths: string[], isWin: boolean): string {
  const separator = getSeparator(isWin);
  let resolved = '';
  let isAbsolute = false;

  for (let i = paths.length - 1; i >= 0 && !isAbsolute; i--) {
    const path = paths[i];
    if (path && path.length > 0) {
      resolved = path + (resolved.length > 0 ? separator + resolved : '');
      isAbsolute = isWin ? isAbsoluteWin(resolved) : isAbsolutePosix(resolved);
    }
  }

  if (!isAbsolute) {
    const cwd = getCwd();
    resolved = cwd + (resolved.length > 0 ? separator + resolved : '');
  }

  return normalizePath(resolved, isWin);
}

/**
 * Get relative path
 */
function relativePath(from: string, to: string, isWin: boolean): string {
  from = resolvePaths([from], isWin);
  to = resolvePaths([to], isWin);

  if (from === to) return '';

  const separator = getSeparator(isWin);
  const fromParts = from.split(separator).filter(p => p.length > 0);
  const toParts = to.split(separator).filter(p => p.length > 0);

  let commonLength = 0;
  const minLength = Math.min(fromParts.length, toParts.length);

  for (let i = 0; i < minLength; i++) {
    if (fromParts[i] === toParts[i]) {
      commonLength++;
    } else {
      break;
    }
  }

  const upCount = fromParts.length - commonLength;
  const result: string[] = [];

  for (let i = 0; i < upCount; i++) {
    result.push('..');
  }

  for (let i = commonLength; i < toParts.length; i++) {
    result.push(toParts[i]);
  }

  return result.join(separator) || '.';
}

/**
 * Get directory name
 */
function getDirname(path: string, isWin: boolean): string {
  if (path.length === 0) return '.';

  const separator = getSeparator(isWin);
  const normalized = normalizePath(path, isWin);
  const lastSepIndex = normalized.lastIndexOf(separator);

  if (lastSepIndex === -1) return '.';
  if (lastSepIndex === 0) return separator;

  return normalized.slice(0, lastSepIndex);
}

/**
 * Get base name
 */
function getBasename(path: string, ext?: string, isWin?: boolean): string {
  if (path.length === 0) return '';

  const lastSepIndex = isWin ? findLastSeparator(path) : path.lastIndexOf('/');
  let base = lastSepIndex === -1 ? path : path.slice(lastSepIndex + 1);

  if (ext && base.endsWith(ext)) {
    base = base.slice(0, base.length - ext.length);
  }

  return base;
}

/**
 * Get extension name
 */
function getExtname(path: string): string {
  const lastDotIndex = path.lastIndexOf('.');
  const lastSepIndex = findLastSeparator(path);

  if (lastDotIndex === -1 || lastDotIndex < lastSepIndex || lastDotIndex === path.length - 1) {
    return '';
  }

  return path.slice(lastDotIndex);
}

/**
 * Parse path into components
 */
function parsePath(path: string, isWin: boolean): ParsedPath {
  let root = '';
  if (isWin) {
    // Check for Windows drive letter
    if (path.length >= 2 && path[1] === ':') {
      root = path.slice(0, 2);
      if (path.length > 2 && (path[2] === '\\' || path[2] === '/')) {
        root += '\\';
      }
    } else if (path[0] === '\\' || path[0] === '/') {
      root = '\\';
    }
  } else {
    if (path[0] === '/') {
      root = '/';
    }
  }

  const dir = getDirname(path, isWin);
  const base = getBasename(path, undefined, isWin);
  const ext = getExtname(path);
  const name = ext ? base.slice(0, base.length - ext.length) : base;

  return { root, dir, base, ext, name };
}

/**
 * Format path from components
 */
function formatPath(pathObject: FormatInputPathObject, isWin: boolean): string {
  const separator = getSeparator(isWin);
  const dir = pathObject.dir || pathObject.root || '';
  const base = pathObject.base || ((pathObject.name || '') + (pathObject.ext || ''));

  if (!dir) return base;
  if (dir === pathObject.root) return dir + base;

  return dir + separator + base;
}

/**
 * Normalize a path (platform-specific)
 */
export function normalize(path: string): string {
  return normalizePath(path, isWindows);
}

/**
 * Join paths (platform-specific)
 */
export function join(...paths: string[]): string {
  return joinPaths(paths, isWindows);
}

/**
 * Resolve paths to absolute path (platform-specific)
 */
export function resolve(...paths: string[]): string {
  return resolvePaths(paths, isWindows);
}

/**
 * Check if path is absolute (platform-specific)
 */
export function isAbsolute(path: string): boolean {
  return isWindows ? win32.isAbsolute(path) : posix.isAbsolute(path);
}

/**
 * Get relative path (platform-specific)
 */
export function relative(from: string, to: string): string {
  return relativePath(from, to, isWindows);
}

/**
 * Get directory name (platform-specific)
 */
export function dirname(path: string): string {
  return getDirname(path, isWindows);
}

/**
 * Get base name (platform-specific)
 */
export function basename(path: string, ext?: string): string {
  return getBasename(path, ext, isWindows);
}

/**
 * Get extension name
 */
export function extname(path: string): string {
  return getExtname(path);
}

/**
 * Parse path into components (platform-specific)
 */
export function parse(path: string): ParsedPath {
  return parsePath(path, isWindows);
}

/**
 * Format path from components (platform-specific)
 */
export function format(pathObject: FormatInputPathObject): string {
  return formatPath(pathObject, isWindows);
}

/**
 * Convert to namespaced path (Windows only)
 */
export function toNamespacedPath(path: string): string {
  if (!isWindows || path.length === 0) return path;

  const resolved = resolve(path);

  if (resolved.length >= 3) {
    if (resolved[0] === '\\') {
      // UNC path
      if (resolved[1] === '\\' && resolved[2] !== '?') {
        return '\\\\?\\UNC\\' + resolved.slice(2);
      }
    } else if (resolved[1] === ':' && resolved[2] === '\\') {
      // Drive letter
      return '\\\\?\\' + resolved;
    }
  }

  return path;
}

/**
 * Get current runtime
 */
export function getRuntime(): 'node' | 'bun' | 'deno' {
  return runtime;
}

/**
 * Export POSIX and Win32 implementations
 */
export { posix, win32 };

/**
 * Default export
 */
export default {
  sep,
  delimiter,
  normalize,
  join,
  resolve,
  isAbsolute,
  relative,
  dirname,
  basename,
  extname,
  parse,
  format,
  toNamespacedPath,
  posix,
  win32,
  getRuntime,
};
