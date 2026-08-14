const test = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const {
  resolveClassEmojiToken,
  getSpecIconNames,
  resolveSpecEmojiToken
} = require('./discordEmojiTokens');
const { listEntriesForEvent } = require('./raidSignupStore/db');

const createGuild = () => ({
  emojis: {
    cache: [
      { id: '101', name: 'warlock' },
      { id: '202', name: 'fire' }
    ]
  }
});

test('resolveClassEmojiToken returns the guild class emoji token for class names', () => {
  const guild = createGuild();
  assert.equal(resolveClassEmojiToken(guild, 'warlock'), '<:warlock:101>');
});

test('resolveSpecEmojiToken resolves the class-specific spec icon for a spec name', () => {
  const guild = createGuild();
  assert.equal(resolveSpecEmojiToken(guild, 'Fire', 'Mage'), '<:fire:202>');
});

test('resolveSpecEmojiToken prefers the uploaded class-specific icon over a generic guild class emoji', () => {
  const guild = {
    emojis: {
      cache: [
        { id: '777', name: 'priest' }
      ]
    }
  };
  assert.equal(resolveSpecEmojiToken(guild, 'Holy', 'Priest'), '<:holy_priest:1537934646149382184>');
});

test('resolveSpecEmojiToken uses the uploaded bot icon tag from discord_icons.json when no live cache entry exists', () => {
  assert.equal(resolveSpecEmojiToken(null, 'Holy', 'Paladin'), '<:holy_paladin:1537934650150883358>');
});

test('getSpecIconNames keeps Druid and Shaman restoration mappings separate', () => {
  assert.deepEqual(getSpecIconNames('Feral (DPS)', 'Druid'), ['feral']);
  assert.deepEqual(getSpecIconNames('Resto Druid', 'Druid'), ['restoration_druid']);
  assert.deepEqual(getSpecIconNames('Resto Shaman', 'Shaman'), ['resto_shaman']);
});

test('listEntriesForEvent keeps active signups ranked above absences and re-orders when someone drops to absence', () => {
  const db = new Database(':memory:');

  db.prepare(`
    CREATE TABLE specs (
      id INTEGER PRIMARY KEY,
      class TEXT,
      spec TEXT,
      slug TEXT,
      icon_small TEXT,
      icon_medium TEXT,
      icon_large TEXT
    )
  `).run();

  db.prepare(`
    CREATE TABLE raid_signup_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER,
      discord_user_id TEXT,
      discord_username TEXT,
      status TEXT,
      spec_id INTEGER,
      role_bucket TEXT,
      updated_at DATETIME
    )
  `).run();

  db.prepare('INSERT INTO specs (id, class, spec, slug) VALUES (?, ?, ?, ?)').run(1, 'Mage', 'Fire', 'fire');
  db.prepare('INSERT INTO specs (id, class, spec, slug) VALUES (?, ?, ?, ?)').run(2, 'Paladin', 'Holy', 'holy');

  db.prepare('INSERT INTO raid_signup_entries (event_id, discord_user_id, discord_username, status, spec_id, role_bucket, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(10, 'alice', 'AliceMage', 'signup', 1, 'ranged', '2026-08-14T19:00:00Z');
  db.prepare('INSERT INTO raid_signup_entries (event_id, discord_user_id, discord_username, status, spec_id, role_bucket, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(10, 'bob', 'BobPaladin', 'signup', 2, 'healer', '2026-08-14T19:10:00Z');

  db.prepare('UPDATE raid_signup_entries SET status = ?, updated_at = ? WHERE discord_user_id = ?')
    .run('absence', '2026-08-14T19:20:00Z', 'alice');

  const rows = listEntriesForEvent(db, 10);
  const ordered = rows.map(row => ({ username: row.discord_username, status: row.status, signup_order: row.signup_order }));

  assert.deepEqual(ordered, [
    { username: 'BobPaladin', status: 'signup', signup_order: 1 },
    { username: 'AliceMage', status: 'absence', signup_order: 2 }
  ]);
});
