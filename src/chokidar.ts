/**
 * File watcher module with unified API across runtimes
 * Pure implementation without external dependencies
 * Compatible with 'chokidar' package API
 * - Node.js: uses native fs.watch
 * - Bun: uses native fs.watch with enhancements
 * - Deno: uses Deno.watchFs
 */

import { EventEmitter } from 'events';

/**
 * Runtime detection (cached at module load)
 */
const runtime = (() => {
  // @ts-ignore - Deno global
  if (typeof Deno !== 'undefined') return 'deno';
  // @ts-ignore - Bun global
  if (typeof Bun !== 'undefined') return 'bun';
  return 'node';
})();

// Global declarations for runtime-specific APIs
declare global {
  // @ts-ignore
  const Deno: {
    watchFs(paths: string | string[]): AsyncIterable<{
      kind: string;
      paths: string[];
    }>;
  } | undefined;
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
 * Watch files and directories
 */
export function watch(
  paths: string | string[],
  options?: WatchOptions
): FSWatcher {
  const watcher = new FSWatcher(options);
  const pathArray = Array.isArray(paths) ? paths : [paths];

  if (runtime === 'node') {
    // Node.js - use native fs.watch
    const fs = require('fs');

    pathArray.forEach(path => {
      try {
        const nativeWatcher = fs.watch(path, { recursive: true }, (eventType: string, filename: string) => {
          if (!filename) return;

          const fullPath = `${path}/${filename}`;

          if (eventType === 'rename') {
            try {
              fs.statSync(fullPath);
              watcher.emit('add', fullPath);
              watcher.emit('all', 'add', fullPath);
            } catch {
              watcher.emit('unlink', fullPath);
              watcher.emit('all', 'unlink', fullPath);
            }
          } else if (eventType === 'change') {
            watcher.emit('change', fullPath);
            watcher.emit('all', 'change', fullPath);
          }
        });

        watcher._setWatcher(nativeWatcher);
        watcher.add(path);

        // Emit ready after a short delay
        queueMicrotask(() => watcher.emit('ready'));
      } catch (error) {
        watcher.emit('error', error as Error);
      }
    });
  } else if (runtime === 'bun') {
    // Bun - use native fs.watch
    const fs = require('fs');

    pathArray.forEach(path => {
      try {
        const nativeWatcher = fs.watch(path, { recursive: true }, (eventType: string, filename: string) => {
          if (!filename) return;

          const fullPath = `${path}/${filename}`;

          if (eventType === 'rename') {
            try {
              fs.statSync(fullPath);
              watcher.emit('add', fullPath);
              watcher.emit('all', 'add', fullPath);
            } catch {
              watcher.emit('unlink', fullPath);
              watcher.emit('all', 'unlink', fullPath);
            }
          } else if (eventType === 'change') {
            watcher.emit('change', fullPath);
            watcher.emit('all', 'change', fullPath);
          }
        });

        watcher._setWatcher(nativeWatcher);
        watcher.add(path);

        // Emit ready after a short delay
        queueMicrotask(() => watcher.emit('ready'));
      } catch (error) {
        watcher.emit('error', error as Error);
      }
    });
  } else if (runtime === 'deno') {
    // Deno - use Deno.watchFs
    (async () => {
      try {
        // @ts-ignore
        const denoWatcher = Deno.watchFs(pathArray);

        for await (const event of denoWatcher) {
          if (watcher['_closed']) break;

          for (const path of event.paths) {
            switch (event.kind) {
              case 'create':
                watcher.emit('add', path);
                watcher.emit('all', 'add', path);
                break;
              case 'modify':
                watcher.emit('change', path);
                watcher.emit('all', 'change', path);
                break;
              case 'remove':
                watcher.emit('unlink', path);
                watcher.emit('all', 'unlink', path);
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
