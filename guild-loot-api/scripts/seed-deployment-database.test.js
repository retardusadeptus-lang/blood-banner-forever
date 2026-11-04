const assert = require('node:assert/strict');
const test = require('node:test');
const Database = require('better-sqlite3');
const { ensureDatabaseReady } = require('../config/database/schema');
const { SPEC_DEFINITIONS, seedDeploymentDatabase } = require('./seed-deployment-database');

test('seeds only the canonical specs into an empty database', () => {
  const db = new Database(':memory:');
  ensureDatabaseReady(db);

  const result = seedDeploymentDatabase(db);

  assert.deepEqual(result, { inserted: SPEC_DEFINITIONS.length, updated: 0 });
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM specs').get().count, SPEC_DEFINITIONS.length);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM items').get().count, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM roster').get().count, 0);

  const protWarrior = db
    .prepare('SELECT class, spec, slug, color FROM specs WHERE slug = ?')
    .get('prot-warrior');
  assert.deepEqual(protWarrior, {
    class: 'Warrior',
    spec: 'Prot Warrior',
    slug: 'prot-warrior',
    color: '#C79C6E'
  });

  db.close();
});

test('is safe to run again and preserves existing spec values', () => {
  const db = new Database(':memory:');
  ensureDatabaseReady(db);
  seedDeploymentDatabase(db);

  db.prepare(`
    UPDATE specs
    SET color = ?, icon_medium = ?
    WHERE slug = ?
  `).run('#custom', 'custom-icon', 'prot-warrior');

  const result = seedDeploymentDatabase(db);

  assert.deepEqual(result, { inserted: 0, updated: 0 });
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM specs').get().count, SPEC_DEFINITIONS.length);
  assert.deepEqual(
    db.prepare('SELECT color, icon_medium FROM specs WHERE slug = ?').get('prot-warrior'),
    { color: '#custom', icon_medium: 'custom-icon' }
  );

  db.close();
});

test('fills missing metadata without overwriting populated fields', () => {
  const db = new Database(':memory:');
  ensureDatabaseReady(db);
  db.prepare(`
    INSERT INTO specs (class, spec, slug, color, icon_medium)
    VALUES (?, ?, ?, ?, ?)
  `).run('Warrior', 'Prot Warrior', '', '', 'existing-icon');

  const result = seedDeploymentDatabase(db);

  assert.deepEqual(result, { inserted: SPEC_DEFINITIONS.length - 1, updated: 1 });
  assert.deepEqual(
    db.prepare('SELECT slug, color, icon_medium FROM specs WHERE spec = ?').get('Prot Warrior'),
    { slug: 'prot-warrior', color: '#C79C6E', icon_medium: 'existing-icon' }
  );

  db.close();
});
