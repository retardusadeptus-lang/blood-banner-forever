const assert = require('node:assert/strict');
const test = require('node:test');
const Database = require('better-sqlite3');
const { ensureDatabaseReady } = require('./schema');

test('initializes a fresh database before applying dependent migrations', () => {
  const db = new Database(':memory:');

  assert.doesNotThrow(() => ensureDatabaseReady(db));

  for (const tableName of ['specs', 'items', 'items_bis', 'roster', 'users', 'character_profiles']) {
    const table = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(tableName);
    assert.ok(table, `expected ${tableName} to be created`);
  }

  db.close();
});
