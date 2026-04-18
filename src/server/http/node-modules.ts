import { isNode } from '../../shares/runtime';

// Lazy-load native modules for Node.js
let http: any;
let https: any;

// Initialize immediately for Node.js (synchronous require)
if (isNode && typeof process !== 'undefined') {
  try {
    http = require('node:http');
    https = require('node:https');
  } catch {
    // Fallback for older Node versions
    http = require('http');
    https = require('https');
  }
}

export { http, https };