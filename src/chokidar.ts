/**
 * File watcher module with unified API across runtimes
 * Pure implementation without external dependencies
 * Compatible with 'chokidar' package API
 * - Node.js: uses native fs.watch
 * - Bun: uses native fs.watch with enhancements
 * - Deno: uses Deno.watchFs
 */

import { EventEmitter } from 'events';
import { runtime } from './runtime';

/**
 * Helper: Normalize path separators (eliminates duplication in path handling)
 */
function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

/**
 * Helper: Emit event and all event (eliminates duplication in event emitting)
 */
function emitEvent(watcher: FSWatcher, eventType: string, path: string): void {
  watcher.emit(eventType, path);
  watcher.emit('all', eventType, path);
}

/**
 * Helper: Check if path matches any pattern (eliminates duplication in pattern matching)
 */
function matchesAnyPattern(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => matchesPattern(path, pattern));
}

/**
 * Helper: Handle rename event (eliminates duplication in rename handling)
 */
function handleRenameEvent(watcher: FSWatcher, fullPath: string, fs: any): void {
  try {
    fs.statSync(fullPath);
    emitEvent(watcher, 'add', fullPath);
  } catch {
    emitEvent(watcher, 'unlink', fullPath);
  }
}

/**
 * Helper: Setup fs.watch for Node.js/Bun (eliminates duplication in watcher setup)
 */
function setupFsWatch(
  watcher: FSWatcher,
  baseDir: string,
  patterns: string[],
  fs: any
): void {
  try {
    const nativeWatcher = fs.watch(baseDir, { recursive: true }, (eventType: string, filename: string) => {
      if (!filename) return;

      const fullPath = normalizePath(`${baseDir}/${filename}`);

      // Check if the file matches any of the patterns
      if (!matchesAnyPattern(fullPath, patterns)) return;

      if (eventType === 'rename') {
        handleRenameEvent(watcher, fullPath, fs);
      } else if (eventType === 'change') {
        emitEvent(watcher, 'change', fullPath);
      }
    });

    watcher._setWatcher(nativeWatcher);
    // Track watched paths directly
    watcher['_watched'].add(baseDir);

    // Emit ready after a short delay
    queueMicrotask(() => watcher.emit('ready'));
  } catch (error) {
    watcher.emit('error', error as Error);
  }
}

/**
 * Watch options
 */
export interface WatchOptions {
  /**
   * Indicates whether the process should continue to run as long as files are being watched.
   * If set to false, the process will continue running even if the watcher is closed.
   */
  persistent?: boolean;

  /**
   * Indicates whether to watch files that don't have read permissions.
   */
  ignorePermissionErrors?: boolean;

  /**
   * A function that takes one parameter (the path of the file/directory)
   * and returns true to ignore or false to watch.
   */
  ignored?: string | RegExp | ((path: string) => boolean);

  /**
   * If set to false, only the parent directory will be watched for new files.
   */
  ignoreInitial?: boolean;

  /**
   * If set to true, symlinks will be followed.
   */
  followSymlinks?: boolean;

  /**
   * Interval of file system polling (in milliseconds).
   */
  interval?: number;

  /**
   * Interval of file system polling for binary files (in milliseconds).
   */
  binaryInterval?: number;

  /**
   * If set to true, will provide fs.Stats object as second argument
   * in add, addDir, and change events.
   */
  alwaysStat?: boolean;

  /**
   * If set, limits how many levels of subdirectories will be traversed.
   */
  depth?: number;

  /**
   * By default, add event fires when a file first appears on disk.
   * Setting this will wait for the write to finish before firing.
   */
  awaitWriteFinish?: boolean | {
    stabilityThreshold?: number;
    pollInterval?: number;
  };

  /**
   * If set to true, will use fs.watchFile() (polling) instead of fs.watch().
   */
  usePolling?: boolean;

  /**
   * Whether to use fsevents watching on macOS (if available).
   */
  useFsEvents?: boolean;

  /**
   * The base path to watch.
   */
  cwd?: string;

  /**
   * Whether to disable globbing.
   */
  disableGlobbing?: boolean;

  /**
   * Automatically filter out artifacts that occur when using editors.
   */
  atomic?: boolean | number;
}

/**
 * FSWatcher class - Compatible with chokidar
 */
export class FSWatcher extends EventEmitter {
  private _watcher: any;
  private _closed: boolean = false;
  private _watched: Set<string> = new Set();

  constructor(options?: WatchOptions) {
    super();
    this.options = options || {};
  }

  public options: WatchOptions;

  /**
   * Add paths to be watched
   */
  add(paths: string | string[]): FSWatcher {
    if (this._closed) {
      throw new Error('Watcher has been closed');
    }

    const pathArray = Array.isArray(paths) ? paths : [paths];

    if (runtime === 'node') {
      if (this._watcher) {
        this._watcher.add(pathArray);
      }
    } else {
      pathArray.forEach(path => this._watched.add(path));
    }

    return this;
  }

  /**
   * Stop watching paths
   */
  unwatch(paths: string | string[]): FSWatcher {
    if (this._closed) {
      return this;
    }

    const pathArray = Array.isArray(paths) ? paths : [paths];

    if (runtime === 'node') {
      if (this._watcher) {
        this._watcher.unwatch(pathArray);
      }
    } else {
      pathArray.forEach(path => this._watched.delete(path));
    }

    return this;
  }

  /**
   * Close the watcher
   */
  async close(): Promise<void> {
    if (this._closed) {
      return;
    }

    this._closed = true;

    if (runtime === 'node') {
      if (this._watcher) {
        await this._watcher.close();
      }
    }

    this.removeAllListeners();
  }

  /**
   * Get watched paths
   */
  getWatched(): { [directory: string]: string[] } {
    if (runtime === 'node' && this._watcher) {
      return this._watcher.getWatched();
    }

    const result: { [directory: string]: string[] } = {};
    this._watched.forEach(path => {
      const dir = path.substring(0, path.lastIndexOf('/')) || '.';
      const file = path.substring(path.lastIndexOf('/') + 1);
      if (!result[dir]) {
        result[dir] = [];
      }
      result[dir].push(file);
    });

    return result;
  }

  /**
   * Internal method to set native watcher
   * @internal
   */
  _setWatcher(watcher: any): void {
    this._watcher = watcher;
  }
}

/**
 * Extract base directory from glob pattern
 * e.g., 'src/**\/*.ts' -> 'src', '**\/*.ts' -> '.'
 */
function getBaseDirectory(pattern: string): string {
  // Remove glob patterns to get the base directory
  const parts = pattern.split(/[\\\/]/);
  let baseDir = '';

  for (const part of parts) {
    if (part.includes('*') || part.includes('?')) {
      break;
    }
    baseDir = baseDir ? `${baseDir}/${part}` : part;
  }

  return baseDir || '.';
}

/**
 * Check if a path matches a glob pattern
 */
function matchesPattern(filePath: string, pattern: string): boolean {
  // Simple glob matching - convert pattern to regex
  const regexPattern = normalizePath(pattern)
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '.');

  const regex = new RegExp(`^${regexPattern}$`);
  const normalizedPath = normalizePath(filePath);

  return regex.test(normalizedPath);
}

/**
 * Watch files and directories
 */
export function watch(
  paths: string | string[],
  options?: WatchOptions
): FSWatcher {
  const watcher = new FSWatcher(options);
  const pathArray = Array.isArray(paths) ? paths : [paths];

  // Extract patterns and their base directories
  const watchMap = new Map<string, string[]>();

  pathArray.forEach(path => {
    const baseDir = getBaseDirectory(path);
    if (!watchMap.has(baseDir)) {
      watchMap.set(baseDir, []);
    }
    watchMap.get(baseDir)!.push(path);
  });

  if (runtime === 'node') {
    // Node.js - use native fs.watch
    const fs = require('fs');
    watchMap.forEach((patterns, baseDir) => setupFsWatch(watcher, baseDir, patterns, fs));
  } else if (runtime === 'bun') {
    // Bun - use native fs.watch
    const fs = require('fs');
    watchMap.forEach((patterns, baseDir) => setupFsWatch(watcher, baseDir, patterns, fs));
  } else if (runtime === 'deno') {
    // Deno - use Deno.watchFs
    // Extract just the base directories for Deno
    const baseDirs = Array.from(watchMap.keys());
    const allPatterns = Array.from(watchMap.values()).flat();

    (async () => {
      try {
        // @ts-ignore
        const denoWatcher = Deno.watchFs(baseDirs);

        for await (const event of denoWatcher) {
          if (watcher['_closed']) break;

          for (const path of event.paths) {
            const normalizedPath = normalizePath(path);

            // Check if the file matches any of the patterns
            if (!matchesAnyPattern(normalizedPath, allPatterns)) continue;

            switch (event.kind) {
              case 'create':
                emitEvent(watcher, 'add', path);
                break;
              case 'modify':
                emitEvent(watcher, 'change', path);
                break;
              case 'remove':
                emitEvent(watcher, 'unlink', path);
                break;
            }
          }
        }
      } catch (error) {
        if (!watcher['_closed']) {
          watcher.emit('error', error as Error);
        }
      }
    })();

    pathArray.forEach(path => watcher.add(path));
    queueMicrotask(() => watcher.emit('ready'));
  }

  return watcher;
}

/**
 * Get current runtime
 */
export function getRuntime(): 'node' | 'bun' | 'deno' {
  return runtime;
}

/**
 * Default export
 */
export default {
  watch,
  FSWatcher,
  getRuntime,
};
