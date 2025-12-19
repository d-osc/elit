# elit/mime-types

Cross-runtime MIME type utilities compatible with the popular [mime-types](https://www.npmjs.com/package/mime-types) package.

## Features

- **Cross-runtime**: Works on Node.js, Bun, and Deno
- **Compatible API**: Drop-in replacement for `mime-types` package
- **Optimized**: Uses native `mime-types` on Node.js, lightweight implementation on Bun/Deno
- **TypeScript**: Full type definitions included
- **Lightweight**: Only ~3KB minified

## Installation

```bash
npm install elit
```

## Usage

```typescript
import * as mime from 'elit/mime-types';

// Lookup MIME type from file extension or path
mime.lookup('json');              // 'application/json'
mime.lookup('file.html');         // 'text/html'
mime.lookup('image.png');         // 'image/png'

// Get extension from MIME type
mime.extension('text/html');      // 'html'
mime.extension('application/json'); // 'json'
mime.extension('image/jpeg');     // 'jpeg'

// Get all extensions for a MIME type
mime.extensions('image/jpeg');    // ['jpeg', 'jpg', 'jpe']

// Get charset for MIME type
mime.charset('text/html');        // 'UTF-8'
mime.charset('application/json'); // 'UTF-8'

// Create full Content-Type header
mime.contentType('html');         // 'text/html; charset=utf-8'
mime.contentType('file.json');    // 'application/json; charset=utf-8'
mime.contentType('text/html');    // 'text/html; charset=utf-8'
```

## API

### lookup(path: string): string | false

Lookup the MIME type from a file path or extension.

```typescript
mime.lookup('json');         // 'application/json'
mime.lookup('file.html');    // 'text/html'
mime.lookup('unknown');      // false
```

### extension(type: string): string | false

Get the default extension for a MIME type.

```typescript
mime.extension('text/html');              // 'html'
mime.extension('application/octet-stream'); // 'bin'
```

### extensions(type: string): string[] | undefined

Get all extensions for a MIME type.

```typescript
mime.extensions('image/jpeg');  // ['jpeg', 'jpg', 'jpe']
mime.extensions('text/html');   // ['html', 'htm', 'shtml']
```

### charset(type: string): string | false

Get the default charset for a MIME type.

```typescript
mime.charset('text/html');        // 'UTF-8'
mime.charset('application/json'); // 'UTF-8'
mime.charset('image/png');        // false
```

### contentType(typeOrExt: string): string | false

Create a full Content-Type header value from a MIME type or file extension.

```typescript
mime.contentType('markdown');    // 'text/markdown; charset=utf-8'
mime.contentType('file.json');   // 'application/json; charset=utf-8'
mime.contentType('text/html');   // 'text/html; charset=utf-8'
mime.contentType('image/png');   // 'image/png'
```

### types: Record<string, string>

Object containing all MIME type mappings.

### getRuntime(): 'node' | 'bun' | 'deno'

Get the current JavaScript runtime.

## Common Use Cases

### Setting Content-Type in HTTP Response

```typescript
import { createServer } from 'elit/http';
import * as mime from 'elit/mime-types';
import { readFile } from 'elit/fs';

const server = createServer(async (req, res) => {
  const filePath = './public' + req.url;
  const content = await readFile(filePath);
  const contentType = mime.contentType(filePath);

  res.writeHead(200, {
    'Content-Type': contentType || 'application/octet-stream'
  });
  res.end(content);
});

server.listen(3000);
```

### Validating File Uploads

```typescript
import * as mime from 'elit/mime-types';

function isImageFile(filename: string): boolean {
  const mimeType = mime.lookup(filename);
  return mimeType ? mimeType.startsWith('image/') : false;
}

console.log(isImageFile('photo.jpg'));  // true
console.log(isImageFile('document.pdf')); // false
```

### Determining File Type from Buffer

```typescript
import * as mime from 'elit/mime-types';

function getFileExtension(contentType: string): string {
  return mime.extension(contentType) || 'bin';
}

const ext = getFileExtension('application/pdf');
console.log(ext); // 'pdf'
```

## Supported MIME Types

elit/mime-types includes mappings for the most common file types:

- **Text**: txt, html, css, js, json, xml, csv, markdown
- **Images**: png, jpg, gif, svg, webp, ico, bmp, tiff
- **Audio**: mp3, wav, ogg, aac, m4a, flac
- **Video**: mp4, webm, avi, mov, mkv, flv
- **Application**: pdf, zip, gz, tar, rar, 7z
- **Documents**: doc, docx, xls, xlsx, ppt, pptx
- **Fonts**: woff, woff2, ttf, otf, eot
- **Modern Web**: wasm, ts, tsx, jsx

For a complete list, see the [source code](../src/mime-types.ts).

## Runtime Behavior

- **Node.js**: Uses the native `mime-types` package for maximum compatibility
- **Bun/Deno**: Uses a lightweight built-in implementation covering the most common MIME types

## Performance

elit/mime-types is optimized for performance:

- Pre-computed MIME type mappings
- Cached runtime detection
- Minimal overhead on all runtimes

## Migration from mime-types

elit/mime-types is designed as a drop-in replacement:

```typescript
// Before
import mime from 'mime-types';

// After
import mime from 'elit/mime-types';

// All existing code works the same!
mime.lookup('json');
mime.contentType('html');
mime.charset('text/html');
```

## License

MIT

## Related Packages

- [elit/http](./http.md) - Cross-runtime HTTP server and client
- [elit/https](./https.md) - Cross-runtime HTTPS server
- [elit/fs](./fs.md) - Cross-runtime file system operations
