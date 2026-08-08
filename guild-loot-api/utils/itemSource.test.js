const test = require('node:test');
const assert = require('node:assert/strict');

const { parseSourceDetails } = require('./itemSource');

test('parses a normal zone+boss pair', () => {
  const result = parseSourceDetails('Black Temple', 'Illidan Stormrage');
  assert.equal(result.boss, 'Illidan Stormrage');
  assert.equal(result.zone, 'Black Temple');
  assert.equal(result.source, 'Black Temple');
  assert.equal(result.source_type, 'Illidan Stormrage');
});

test('handles blank source metadata without producing empty parentheses', () => {
  const result = parseSourceDetails('', '');
  assert.equal(result.boss, '');
  assert.equal(result.zone, '');
  assert.equal(result.source, '');
  assert.equal(result.source_type, '');
});

test('keeps a single source label readable when only one side is populated', () => {
  const result = parseSourceDetails('Honor Points', null);
  assert.equal(result.boss, '');
  assert.equal(result.zone, 'Honor Points');
  assert.equal(result.source, 'Honor Points');
  assert.equal(result.source_type, '');
});
