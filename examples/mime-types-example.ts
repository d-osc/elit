/**
 * Example usage of elit/mime-types
 * Cross-runtime MIME type utilities
 */

import * as mime from '../src/mime-types';

console.log('🎯 elit/mime-types Examples\n');

// Lookup MIME type from file extension
console.log('📄 lookup()');
console.log('  lookup("json"):', mime.lookup('json'));
console.log('  lookup("file.html"):', mime.lookup('file.html'));
console.log('  lookup("image.png"):', mime.lookup('image.png'));
console.log('  lookup("video.mp4"):', mime.lookup('video.mp4'));
console.log('  lookup("unknown"):', mime.lookup('unknown'));
console.log();

// Get extension from MIME type
console.log('📝 extension()');
console.log('  extension("text/html"):', mime.extension('text/html'));
console.log('  extension("application/json"):', mime.extension('application/json'));
console.log('  extension("image/jpeg"):', mime.extension('image/jpeg'));
console.log('  extension("application/octet-stream"):', mime.extension('application/octet-stream'));
console.log();

// Get all extensions for a MIME type
console.log('📋 extensions()');
console.log('  extensions("image/jpeg"):', mime.extensions('image/jpeg'));
console.log('  extensions("text/html"):', mime.extensions('text/html'));
console.log();

// Get charset for MIME type
console.log('🔤 charset()');
console.log('  charset("text/html"):', mime.charset('text/html'));
console.log('  charset("application/json"):', mime.charset('application/json'));
console.log('  charset("text/plain"):', mime.charset('text/plain'));
console.log('  charset("image/png"):', mime.charset('image/png'));
console.log();

// Create full Content-Type header
console.log('📮 contentType()');
console.log('  contentType("markdown"):', mime.contentType('markdown'));
console.log('  contentType("file.json"):', mime.contentType('file.json'));
console.log('  contentType("text/html"):', mime.contentType('text/html'));
console.log('  contentType("html"):', mime.contentType('html'));
console.log('  contentType("image/png"):', mime.contentType('image/png'));
console.log();

// Get runtime
console.log('⚙️  getRuntime():', mime.getRuntime());
console.log();

// Common use cases
console.log('💡 Common Use Cases:');
console.log();

// 1. Setting Content-Type header in HTTP response
const filename = 'document.pdf';
const contentType = mime.contentType(filename);
console.log(`  Setting header for "${filename}":`, contentType);
console.log();

// 2. Determining file type from path
const paths = ['index.html', 'script.js', 'data.json', 'logo.svg'];
console.log('  File types:');
paths.forEach(path => {
  console.log(`    ${path}: ${mime.lookup(path)}`);
});
console.log();

// 3. Getting file extension from Content-Type
const types = ['text/html', 'application/javascript', 'image/svg+xml'];
console.log('  Extensions:');
types.forEach(type => {
  console.log(`    ${type}: .${mime.extension(type)}`);
});
