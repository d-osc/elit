# elit/path

Cross-runtime path utilities compatible with Node.js [path](https://nodejs.org/api/path.html) module.

## Features

- **Cross-runtime**: Works on Node.js, Bun, and Deno
- **Compatible API**: Drop-in replacement for Node.js `path` module
- **Zero dependencies**: Pure implementation without external packages
- **TypeScript**: Full type definitions included
- **Lightweight**: Only ~4KB minified
- **Platform-aware**: Automatic detection of Windows vs POSIX systems
- **POSIX & Win32**: Explicit access to platform-specific implementations

## Installation

```bash
npm install elit
```

## Usage

### Basic Example

```typescript
import { join, resolve, dirname, basename, extname } from 'elit/path';

// Join paths
const fullPath = join('src', 'components', 'Button.tsx');
// => 'src/components/Button.tsx'

// Resolve to absolute path
const absolutePath = resolve('src', 'index.ts');
// => '/Users/username/project/src/index.ts'

// Get directory name
const dir = dirname('/path/to/file.txt');
// => '/path/to'

// Get base name
const base = basename('/path/to/file.txt');
// => 'file.txt'

// Get extension
const ext = extname('file.txt');
// => '.txt'
```

### Platform-Specific Operations

```typescript
import { posix, win32 } from 'elit/path';

// Always use POSIX separators (/)
const posixPath = posix.join('foo', 'bar', 'baz');
// => 'foo/bar/baz'

// Always use Windows separators (\)
const winPath = win32.join('foo', 'bar', 'baz');
// => 'foo\\bar\\baz'
```

## API

### path.join([...paths])

Join path segments using the platform-specific separator.

**Parameters:**
- `paths` (string[]): Path segments to join

**Returns:** string

```typescript
import { join } from 'elit/path';

join('foo', 'bar', 'baz');
// => 'foo/bar/baz' (on POSIX)
// => 'foo\\bar\\baz' (on Windows)

join('/foo', 'bar', '../baz');
// => '/foo/baz'
```

### path.resolve([...paths])

Resolve a sequence of paths to an absolute path.

**Parameters:**
- `paths` (string[]): Path segments to resolve

**Returns:** string

```typescript
import { resolve } from 'elit/path';

resolve('foo', 'bar');
// => '/current/working/directory/foo/bar'

resolve('/foo', 'bar', 'baz');
// => '/foo/bar/baz'
```

### path.normalize(path)

Normalize a path, resolving `..` and `.` segments.

**Parameters:**
- `path` (string): Path to normalize

**Returns:** string

```typescript
import { normalize } from 'elit/path';

normalize('/foo/bar//baz/asdf/quux/..');
// => '/foo/bar/baz/asdf'

normalize('foo/bar/../baz');
// => 'foo/baz'
```

### path.dirname(path)

Get the directory name of a path.

**Parameters:**
- `path` (string): Path to process

**Returns:** string

```typescript
import { dirname } from 'elit/path';

dirname('/foo/bar/baz.txt');
// => '/foo/bar'

dirname('foo/bar.txt');
// => 'foo'
```

### path.basename(path[, ext])

Get the last portion of a path.

**Parameters:**
- `path` (string): Path to process
- `ext` (string, optional): Extension to remove

**Returns:** string

```typescript
import { basename } from 'elit/path';

basename('/foo/bar/baz.txt');
// => 'baz.txt'

basename('/foo/bar/baz.txt', '.txt');
// => 'baz'
```

### path.extname(path)

Get the extension of a path.

**Parameters:**
- `path` (string): Path to process

**Returns:** string

```typescript
import { extname } from 'elit/path';

extname('index.html');
// => '.html'

extname('index.coffee.md');
// => '.md'

extname('index.');
// => '.'
```

### path.isAbsolute(path)

Determine if a path is absolute.

**Parameters:**
- `path` (string): Path to test

**Returns:** boolean

```typescript
import { isAbsolute } from 'elit/path';

isAbsolute('/foo/bar');
// => true

isAbsolute('foo/bar');
// => false

isAbsolute('C:\\foo\\bar'); // Windows
// => true
```

### path.relative(from, to)

Get the relative path from `from` to `to`.

**Parameters:**
- `from` (string): Source path
- `to` (string): Destination path

**Returns:** string

```typescript
import { relative } from 'elit/path';

relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb');
// => '../../impl/bbb'

relative('/foo/bar', '/foo/bar/baz');
// => 'baz'
```

### path.parse(path)

Parse a path into an object.

**Parameters:**
- `path` (string): Path to parse

**Returns:** ParsedPath

```typescript
import { parse } from 'elit/path';

parse('/home/user/dir/file.txt');
// => {
//   root: '/',
//   dir: '/home/user/dir',
//   base: 'file.txt',
//   ext: '.txt',
//   name: 'file'
// }

parse('C:\\path\\dir\\file.txt'); // Windows
// => {
//   root: 'C:\\',
//   dir: 'C:\\path\\dir',
//   base: 'file.txt',
//   ext: '.txt',
//   name: 'file'
// }
```

### path.format(pathObject)

Format a path object into a path string.

**Parameters:**
- `pathObject` (FormatInputPathObject): Object with path components

**Returns:** string

```typescript
import { format } from 'elit/path';

format({
  root: '/',
  dir: '/home/user/dir',
  base: 'file.txt'
});
// => '/home/user/dir/file.txt'

format({
  dir: '/home/user/dir',
  name: 'file',
  ext: '.txt'
});
// => '/home/user/dir/file.txt'
```

### path.toNamespacedPath(path)

Convert a path to a namespaced path (Windows only).

**Parameters:**
- `path` (string): Path to convert

**Returns:** string

```typescript
import { toNamespacedPath } from 'elit/path';

// On Windows
toNamespacedPath('C:\\foo\\bar');
// => '\\\\?\\C:\\foo\\bar'

// On POSIX
toNamespacedPath('/foo/bar');
// => '/foo/bar' (no change)
```

## Properties

### path.sep

Platform-specific path segment separator.
- `\\` on Windows
- `/` on POSIX

```typescript
import { sep } from 'elit/path';

console.log(sep);
// => '/' (on POSIX)
// => '\\' (on Windows)

'foo/bar/baz'.split(sep);
```

### path.delimiter

Platform-specific path delimiter.
- `;` on Windows
- `:` on POSIX

```typescript
import { delimiter } from 'elit/path';

console.log(delimiter);
// => ':' (on POSIX)
// => ';' (on Windows)

process.env.PATH.split(delimiter);
```

### path.posix

POSIX-specific path operations.

```typescript
import { posix } from 'elit/path';

posix.join('foo', 'bar', 'baz');
// => 'foo/bar/baz' (always uses /)

posix.sep;
// => '/'

posix.delimiter;
// => ':'
```

### path.win32

Windows-specific path operations.

```typescript
import { win32 } from 'elit/path';

win32.join('foo', 'bar', 'baz');
// => 'foo\\bar\\baz' (always uses \)

win32.sep;
// => '\\'

win32.delimiter;
// => ';'
```

## Types

### ParsedPath

```typescript
interface ParsedPath {
  root: string;    // Root of the path (e.g., '/' or 'C:\')
  dir: string;     // Directory name
  base: string;    // File name with extension
  ext: string;     // File extension (including '.')
  name: string;    // File name without extension
}
```

### FormatInputPathObject

```typescript
interface FormatInputPathObject {
  root?: string;   // Root of the path
  dir?: string;    // Directory name
  base?: string;   // File name with extension
  ext?: string;    // File extension
  name?: string;   // File name without extension
}
```

## Common Use Cases

### Change File Extension

```typescript
import { join, dirname, basename, extname } from 'elit/path';

const filepath = '/path/to/file.js';
const newPath = join(
  dirname(filepath),
  basename(filepath, extname(filepath)) + '.ts'
);
// => '/path/to/file.ts'
```

### Get Relative Import Path

```typescript
import { relative } from 'elit/path';

const from = '/project/src/components/Button.tsx';
const to = '/project/src/utils/helpers.ts';

const relativePath = relative(dirname(from), to);
// => '../utils/helpers.ts'
```

### Build Output Path

```typescript
import { join, parse } from 'elit/path';

const srcFile = 'src/components/Button.tsx';
const parsed = parse(srcFile);

const outFile = join('dist', parsed.dir, parsed.name + '.js');
// => 'dist/src/components/Button.js'
```

### Normalize User Input

```typescript
import { normalize } from 'elit/path';

const userPath = 'foo//bar/../baz/./file.txt';
const normalized = normalize(userPath);
// => 'foo/baz/file.txt'
```

### Cross-Platform Paths

```typescript
import { posix, win32 } from 'elit/path';

// Always use POSIX separators (for URLs, configs, etc.)
const configPath = posix.join('config', 'settings.json');
// => 'config/settings.json'

// Always use Windows separators (for Windows-specific paths)
const winPath = win32.join('C:', 'Program Files', 'MyApp');
// => 'C:\\Program Files\\MyApp'
```

## Runtime Behavior

The path module automatically detects the platform and runtime:

- **Node.js**: Uses `process.platform` for platform detection
- **Bun**: Uses `process.platform` (compatible with Node.js)
- **Deno**: Uses `Deno.build.os` for platform detection

All path operations work identically across runtimes, with platform-specific behavior determined by the underlying OS.

## Performance

elit/path is optimized for performance:

- Cached runtime and platform detection
- No external dependencies
- Minimal string operations
- Efficient normalization algorithms

## Migration from Node.js path

elit/path is designed as a drop-in replacement:

```typescript
// Before
import path from 'path';
const fullPath = path.join('foo', 'bar');

// After
import path from 'elit/path';
const fullPath = path.join('foo', 'bar');

// Or use named imports
import { join } from 'elit/path';
const fullPath = join('foo', 'bar');
```

All existing code using Node.js `path` module should work without modifications.

## Differences from Node.js path

elit/path aims for full API compatibility with Node.js `path` module. The implementation is pure JavaScript/TypeScript and doesn't depend on Node.js internals, making it work across all JavaScript runtimes.

## License

MIT

## Related Packages

- [elit/fs](./fs.md) - Cross-runtime file system operations
- [elit/http](./http.md) - Cross-runtime HTTP server and client
- [elit/mime-types](./mime-types.md) - MIME type utilities
