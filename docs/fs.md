# elit/fs

Cross-runtime file system helpers with a Node-style API for Node.js, Bun, and Deno.

## Features

- Async and sync file APIs
- `promises` compatibility object
- Shared type surface for `Stats`, `Dirent`, and encoding options
- Runtime-specific implementations behind one import path

## Basic Usage

```typescript
import { mkdir, readFile, writeFile, exists, promises } from 'elit/fs';

await mkdir('./tmp', { recursive: true });
await writeFile('./tmp/message.txt', 'hello from elit');

const text = await readFile('./tmp/message.txt', 'utf-8');
console.log(text);

if (await exists('./tmp/message.txt')) {
  const content = await promises.readFile('./tmp/message.txt', 'utf-8');
  console.log(content);
}
```

## Sync Usage

```typescript
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'elit/fs';

if (!existsSync('./cache')) {
  mkdirSync('./cache', { recursive: true });
}

writeFileSync('./cache/state.json', JSON.stringify({ ok: true }));
const raw = readFileSync('./cache/state.json', 'utf-8');
console.log(raw);
```

## Main Exports

Async:

- `readFile`
- `writeFile`
- `appendFile`
- `exists`
- `stat`
- `mkdir`
- `readdir`
- `unlink`
- `rmdir`
- `rename`
- `copyFile`
- `realpath`

Sync:

- `readFileSync`
- `writeFileSync`
- `appendFileSync`
- `existsSync`
- `statSync`
- `mkdirSync`
- `readdirSync`
- `unlinkSync`
- `rmdirSync`
- `renameSync`
- `copyFileSync`
- `realpathSync`

Helpers:

- `promises`
- `getRuntime()`
- `Stats`
- `Dirent`

## Behavior Notes

- Pass an encoding such as `'utf-8'` to receive a string; omit it to receive a `Buffer`.
- `readdir()` and `readdirSync()` support `withFileTypes` for `Dirent` objects.
- Node.js and Bun use native `fs` and `fs/promises` underneath.
- Deno uses the matching `Deno.*` file system APIs under the same Elit surface.

## Related Docs

- [path.md](./path.md)
- [chokidar.md](./chokidar.md)
