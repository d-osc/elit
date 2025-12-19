# elit/chokidar

Cross-runtime file watching library compatible with the popular [chokidar](https://www.npmjs.com/package/chokidar) package.

## Features

- **Cross-runtime**: Works on Node.js, Bun, and Deno
- **Compatible API**: Drop-in replacement for `chokidar` package
- **Optimized**: Uses native `chokidar` on Node.js, fs.watch on Bun, Deno.watchFs on Deno
- **TypeScript**: Full type definitions included
- **Lightweight**: Only ~3KB minified
- **Event-driven**: EventEmitter-based API for monitoring file changes

## Installation

```bash
npm install elit
```

## Usage

### Basic Example

```typescript
import { watch } from 'elit/chokidar';

// Watch a file or directory
const watcher = watch('./src', {
  ignoreInitial: false,
  persistent: true
});

// Listen to events
watcher
  .on('add', path => console.log(`File added: ${path}`))
  .on('change', path => console.log(`File changed: ${path}`))
  .on('unlink', path => console.log(`File deleted: ${path}`))
  .on('addDir', path => console.log(`Directory added: ${path}`))
  .on('unlinkDir', path => console.log(`Directory deleted: ${path}`))
  .on('error', error => console.error(`Error: ${error}`))
  .on('ready', () => console.log('Ready to watch'))
  .on('all', (event, path) => {
    console.log(`Event: ${event}, Path: ${path}`);
  });
```

### Watch Multiple Paths

```typescript
import { watch } from 'elit/chokidar';

const watcher = watch(['./src', './dist', './public']);

watcher.on('change', path => {
  console.log(`Changed: ${path}`);
});
```

### With Options

```typescript
import { watch } from 'elit/chokidar';

const watcher = watch('./src', {
  ignoreInitial: true,
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  depth: 2, // limit subdirectory depth
  persistent: true,
  alwaysStat: true // provide fs.Stats in events
});

watcher.on('change', (path, stats) => {
  if (stats) {
    console.log(`File ${path} changed, size: ${stats.size} bytes`);
  }
});
```

## API

### watch(paths, options?): FSWatcher

Watch files and directories for changes.

**Parameters:**
- `paths` (string | string[]): File or directory paths to watch
- `options` (WatchOptions): Optional configuration

**Returns:** FSWatcher instance

### FSWatcher

EventEmitter that watches for file system changes.

#### Methods

##### add(paths: string | string[]): FSWatcher

Add paths to be watched.

```typescript
watcher.add('./new-directory');
watcher.add(['./file1.ts', './file2.ts']);
```

##### unwatch(paths: string | string[]): FSWatcher

Stop watching paths.

```typescript
watcher.unwatch('./old-directory');
```

##### close(): Promise<void>

Close the watcher and stop watching all files.

```typescript
await watcher.close();
```

##### getWatched(): { [directory: string]: string[] }

Get an object representing all the paths being watched.

```typescript
const watched = watcher.getWatched();
// { './src': ['file1.ts', 'file2.ts'], './dist': ['bundle.js'] }
```

#### Events

##### 'add'

Emitted when a file is added.

```typescript
watcher.on('add', (path: string, stats?: Stats) => {
  console.log(`File added: ${path}`);
});
```

##### 'addDir'

Emitted when a directory is added.

```typescript
watcher.on('addDir', (path: string, stats?: Stats) => {
  console.log(`Directory added: ${path}`);
});
```

##### 'change'

Emitted when a file is changed.

```typescript
watcher.on('change', (path: string, stats?: Stats) => {
  console.log(`File changed: ${path}`);
});
```

##### 'unlink'

Emitted when a file is deleted.

```typescript
watcher.on('unlink', (path: string) => {
  console.log(`File deleted: ${path}`);
});
```

##### 'unlinkDir'

Emitted when a directory is deleted.

```typescript
watcher.on('unlinkDir', (path: string) => {
  console.log(`Directory deleted: ${path}`);
});
```

##### 'ready'

Emitted when the watcher is ready and watching.

```typescript
watcher.on('ready', () => {
  console.log('Watcher ready');
});
```

##### 'error'

Emitted when an error occurs.

```typescript
watcher.on('error', (error: Error) => {
  console.error('Watcher error:', error);
});
```

##### 'all'

Emitted for every event except 'ready', 'raw', and 'error'.

```typescript
watcher.on('all', (event: string, path: string, stats?: Stats) => {
  console.log(`Event: ${event}, Path: ${path}`);
});
```

## Watch Options

### WatchOptions Interface

```typescript
interface WatchOptions {
  persistent?: boolean;           // Continue running (default: true)
  ignorePermissionErrors?: boolean; // Ignore permission errors
  ignored?: string | RegExp | ((path: string) => boolean);
  ignoreInitial?: boolean;        // Don't emit 'add' for existing files
  followSymlinks?: boolean;       // Follow symbolic links
  interval?: number;              // Polling interval (ms)
  binaryInterval?: number;        // Polling interval for binary files (ms)
  alwaysStat?: boolean;          // Always provide fs.Stats
  depth?: number;                 // Subdirectory depth limit
  awaitWriteFinish?: boolean | { // Wait for writes to finish
    stabilityThreshold?: number;
    pollInterval?: number;
  };
  usePolling?: boolean;          // Use polling instead of events
  useFsEvents?: boolean;         // Use fsevents on macOS
  cwd?: string;                  // Base directory
  disableGlobbing?: boolean;     // Disable glob patterns
  atomic?: boolean | number;     // Filter editor artifacts
}
```

### Key Options Explained

#### `ignoreInitial`

By default, the watcher will emit 'add' events for all existing files when it starts. Set to `true` to skip these initial events.

```typescript
const watcher = watch('./src', { ignoreInitial: true });
```

#### `ignored`

Specify files or directories to ignore. Can be a glob pattern, regex, or function.

```typescript
// Ignore dotfiles
watch('./src', { ignored: /(^|[\/\\])\../ });

// Ignore node_modules
watch('./src', { ignored: '**/node_modules/**' });

// Custom function
watch('./src', { ignored: path => path.includes('temp') });
```

#### `depth`

Limit how many levels of subdirectories to traverse.

```typescript
// Only watch 2 levels deep
const watcher = watch('./src', { depth: 2 });
```

#### `alwaysStat`

Ensure fs.Stats object is provided in events.

```typescript
const watcher = watch('./src', { alwaysStat: true });

watcher.on('change', (path, stats) => {
  console.log(`File size: ${stats.size}`);
});
```

## Common Use Cases

### Hot Module Replacement (HMR)

```typescript
import { watch } from 'elit/chokidar';

const watcher = watch('./src', {
  ignoreInitial: true
});

watcher.on('change', async (path) => {
  console.log(`Reloading ${path}...`);
  // Trigger hot reload
  await reloadModule(path);
});
```

### Build System

```typescript
import { watch } from 'elit/chokidar';

const watcher = watch('./src/**/*.ts', {
  ignoreInitial: true
});

watcher.on('change', async (path) => {
  console.log(`Building ${path}...`);
  await build(path);
});
```

### File Synchronization

```typescript
import { watch } from 'elit/chokidar';
import { copyFile, unlink } from 'elit/fs';

const watcher = watch('./src');

watcher
  .on('add', async path => {
    const dest = path.replace('./src', './dist');
    await copyFile(path, dest);
  })
  .on('change', async path => {
    const dest = path.replace('./src', './dist');
    await copyFile(path, dest);
  })
  .on('unlink', async path => {
    const dest = path.replace('./src', './dist');
    await unlink(dest);
  });
```

### Live Reload Server

```typescript
import { watch } from 'elit/chokidar';
import { createServer } from 'elit/http';
import { WebSocketServer } from 'elit/ws';

const watcher = watch('./public');
const wss = new WebSocketServer({ port: 8080 });

watcher.on('change', (path) => {
  // Notify all connected clients to reload
  wss.clients.forEach(client => {
    client.send(JSON.stringify({ type: 'reload', path }));
  });
});
```

## Runtime Behavior

- **Node.js**: Uses the native `chokidar` package for maximum compatibility and features
- **Bun**: Uses native `fs.watch` with recursive support
- **Deno**: Uses `Deno.watchFs` API

## Performance

elit/chokidar is optimized for performance:

- Cached runtime detection at module load
- Minimal event overhead
- Direct delegation to native watching APIs
- Efficient event forwarding

## Migration from chokidar

elit/chokidar is designed as a drop-in replacement:

```typescript
// Before
import chokidar from 'chokidar';
const watcher = chokidar.watch('./src');

// After
import { watch } from 'elit/chokidar';
const watcher = watch('./src');

// All existing code works the same!
```

## Differences from chokidar

While elit/chokidar aims for API compatibility, there are some differences:

1. **Bun/Deno**: Some advanced options (like `usePolling`, `useFsEvents`) only work on Node.js
2. **Stats**: `alwaysStat` option may not work on all runtimes
3. **Raw events**: The 'raw' event is only available on Node.js

For maximum compatibility and features, use Node.js runtime.

## License

MIT

## Related Packages

- [elit/fs](./fs.md) - Cross-runtime file system operations
- [elit/http](./http.md) - Cross-runtime HTTP server and client
- [elit/ws](./ws.md) - Cross-runtime WebSocket implementation
