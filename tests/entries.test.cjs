const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateEntries } = require('../app.js');
const entry = { id: 'one', mood: 'calm', note: '산책해서 좋았어요.', createdAt: '2026-10-29T10:00:00Z' };
test('valid saved records survive a JSON round trip', () => {
  assert.deepEqual(validateEntries(JSON.parse(JSON.stringify([entry]))), [entry]);
});
test('malformed records are excluded without losing valid records', () => {
  assert.deepEqual(validateEntries([null, entry, { ...entry, mood: '__proto__' }, { ...entry, createdAt: 'invalid' }, { ...entry, note: ' ' }, { ...entry, note: 'a'.repeat(301) }]), [entry]);
});
test('a malformed storage container is rejected', () => {
  assert.throws(() => validateEntries({}), /Invalid/);
});
