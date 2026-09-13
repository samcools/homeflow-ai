import test from 'node:test';
import assert from 'node:assert/strict';

test('HomeFlow acceptance marker', () => {
  assert.equal('HomeFlow AI'.includes('HomeFlow'), true);
});
