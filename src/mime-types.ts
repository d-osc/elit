/**
 * MIME Types module with unified API across runtimes
 * Pure implementation without external dependencies
 * Compatible with 'mime-types' package API
 * Works on Node.js, Bun, and Deno
 */

import { runtime } from './runtime';

/**
 * Common MIME type mappings (for Bun/Deno)
 * Lightweight version with most common types
 */
const MIME_TYPES: Record<string, string> = {
  // Text
  'txt': 'text/plain',
  'html': 'text/html',
  'htm': 'text/html',
  'css': 'text/css',
  'js': 'text/javascript',
  'mjs': 'text/javascript',
  'json': 'application/json',
  'xml': 'application/xml',
  'csv': 'text/csv',
  'md': 'text/markdown',
  'markdown': 'text/x-markdown',

  // Images
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'gif': 'image/gif',
  'svg': 'image/svg+xml',
  'webp': 'image/webp',
  'ico': 'image/x-icon',
  'bmp': 'image/bmp',
  'tiff': 'image/tiff',
  'tif': 'image/tiff',

  // Audio
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'ogg': 'audio/ogg',
  'aac': 'audio/aac',
  'm4a': 'audio/mp4',
  'flac': 'audio/flac',

  // Video
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  'avi': 'video/x-msvideo',
  'mov': 'video/quicktime',
  'mkv': 'video/x-matroska',
  'flv': 'video/x-flv',

  // Application
  'pdf': 'application/pdf',
  'zip': 'application/zip',
  'gz': 'application/gzip',
  'tar': 'application/x-tar',
  'rar': 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',

  // Documents
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  // Fonts
  'woff': 'font/woff',
  'woff2': 'font/woff2',
  'ttf': 'font/ttf',
  'otf': 'font/otf',
  'eot': 'application/vnd.ms-fontobject',

  // Web
  'wasm': 'application/wasm',
  'manifest': 'application/manifest+json',

  // Binary
  'bin': 'application/octet-stream',
  'exe': 'application/x-msdownload',
  'dll': 'application/x-msdownload',

  // TypeScript/Modern JS
  'ts': 'text/typescript',
  'tsx': 'text/tsx',
  'jsx': 'text/jsx',
};

/**
 * Reverse mapping: MIME type to extensions
 */
const TYPE_TO_EXTENSIONS: Record<string, string[]> = {};
for (const ext in MIME_TYPES) {
  const type = MIME_TYPES[ext];
  if (!TYPE_TO_EXTENSIONS[type]) {
    TYPE_TO_EXTENSIONS[type] = [];
  }
  TYPE_TO_EXTENSIONS[type].push(ext);
}

/**
 * Charset mappings
 */
const CHARSETS: Record<string, string> = {
  'text/plain': 'UTF-8',
  'text/html': 'UTF-8',
  'text/css': 'UTF-8',
  'text/javascript': 'UTF-8',
  'application/json': 'UTF-8',
  'application/xml': 'UTF-8',
  'text/csv': 'UTF-8',
  'text/markdown': 'UTF-8',
  'text/x-markdown': 'UTF-8',
  'text/typescript': 'UTF-8',
  'text/tsx': 'UTF-8',
  'text/jsx': 'UTF-8',
  'application/javascript': 'UTF-8',
};

/**
 * Get the extension from a path
 */
function getExtension(path: string): string {
  const match = /\.([^./\\]+)$/.exec(path);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Normalize MIME type (remove parameters)
 */
function normalizeMimeType(type: string): string {
  const match = /^([^;\s]+)/.exec(type);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Lookup MIME type from file path or extension
 */
export function lookup(path: string): string | false {
  const ext = getExtension(path) || path.toLowerCase();
  return MIME_TYPES[ext] || false;
}

/**
 * Get the default extension for a MIME type
 */
export function extension(type: string): string | false {
  const normalized = normalizeMimeType(type);
  const exts = TYPE_TO_EXTENSIONS[normalized];
  return exts && exts.length > 0 ? exts[0] : false;
}

/**
 * Get all extensions for a MIME type
 */
export function extensions(type: string): string[] | undefined {
  const normalized = normalizeMimeType(type);
  return TYPE_TO_EXTENSIONS[normalized];
}

/**
 * Get the default charset for a MIME type
 */
export function charset(type: string): string | false {
  const normalized = normalizeMimeType(type);
  return CHARSETS[normalized] || false;
}

/**
 * Create a full Content-Type header value
 */
export function contentType(typeOrExt: string): string | false {
  // Check if it's a file extension or path
  let type: string | false;
  if (typeOrExt.includes('/')) {
    // Already a MIME type
    type = typeOrExt;
  } else {
    // Lookup MIME type
    type = lookup(typeOrExt);
    if (!type) return false;
  }

  const normalized = normalizeMimeType(type);
  const charsetValue = CHARSETS[normalized];

  if (charsetValue) {
    return `${normalized}; charset=${charsetValue.toLowerCase()}`;
  }

  return normalized;
}

/**
 * Get all MIME types
 */
export const types = MIME_TYPES;

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
  lookup,
  extension,
  extensions,
  charset,
  contentType,
  types,
  getRuntime,
};
