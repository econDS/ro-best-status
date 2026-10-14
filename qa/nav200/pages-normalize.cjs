'use strict';
const assert = require('node:assert/strict');
module.exports = bytes => {
  const text = bytes.toString();
  const after = '      - uses: actions/checkout@v4\n        with:\n          fetch-depth: 0\n';
  const before = '      - uses: actions/checkout@v4\n';
  assert.equal(text.split(after).length - 1, 1, 'exact approved Pages full-history checkout');
  return Buffer.from(text.replace(after, before));
};
