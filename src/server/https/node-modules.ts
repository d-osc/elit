import { isNode } from '../../shares/runtime';

let https: any;

if (isNode && typeof process !== 'undefined') {
  try {
    https = require('node:https');
  } catch {
    https = require('https');
  }
}

export { https };