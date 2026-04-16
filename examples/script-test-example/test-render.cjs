'use strict';
const { renderToString } = require('C:/Users/ondev/Projects/elit/dist/dom.cjs');
const { script, style, div } = require('C:/Users/ondev/Projects/elit/dist/el.cjs');
const dom = { renderToString };

const QUOTE = "'";
const AMP = '&';
const LT = '<';
const GT = '>';

// Test 1: single quotes and ampersand in script body
const t1 = dom.renderToString(
  script(`var a = 'hello'; var b = 'world'; if (a && b) { alert(a + ' & ' + b); }`)
);

// Test 2: comparison operators in script body
const t2 = dom.renderToString(
  script(`if (x < y && y > 0) { console.log('ok'); }`)
);

// Test 3: style with > combinator
const t3 = dom.renderToString(
  style(`.foo > .bar { color: red; } .baz:before { content: 'hi'; }`)
);

// Test 4: verify-email URL (original bug)
const t4 = dom.renderToString(
  script(`var url = 'http://localhost:4177/api/auth/verify-email?token=3D3e2ede5eb7194f50b256813ab8c793354120c3578a187c88ee7aa86d594c37d2';`)
);

let pass = true;

function check(label, html) {
  const escaped = html.includes('&#x27;') || html.includes('&amp;') || html.includes('&lt;') || html.includes('&gt;');
  if (escaped) {
    console.error('[FAIL] ' + label);
    console.error('       Output: ' + html);
    pass = false;
  } else {
    console.log('[PASS] ' + label);
  }
}

check('single quotes + ampersand', t1);
check('comparison operators < >', t2);
check('style > combinator + single quotes', t3);
check('verify-email URL with = token', t4);

console.log('');
if (pass) {
  console.log('All tests passed.');
} else {
  console.error('Some tests FAILED.');
  process.exit(1);
}
