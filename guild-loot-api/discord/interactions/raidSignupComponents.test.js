'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const { buildMainSignupComponents } = require('./raidSignupComponents');
const { buildSignupEmbed, refreshEventMessage } = require('./raidSignupEmbed');

test('buildSignupEmbed keeps tank and healer on the first row and pushes ranged/melee to the next row', () => {
  const event = { title: 'Raid Signup', description: 'Test event', scheduled_for: '2026-08-15T19:00:00Z' };
  const entries = [
    { discord_username: 'TankUser', status: 'signup', role_bucket: 'tank', spec_class: 'Warrior', spec_name: 'Protection' },
    { discord_username: 'HealerUser', status: 'signup', role_bucket: 'healer', spec_class: 'Paladin', spec_name: 'Holy' },
    { discord_username: 'RangedUser', status: 'signup', role_bucket: 'ranged', spec_class: 'Mage', spec_name: 'Arcane' },
    { discord_username: 'MeleeUser', status: 'signup', role_bucket: 'melee', spec_class: 'Rogue', spec_name: 'Subtlety' }
  ];

  const embed = buildSignupEmbed(event, entries, null);
  const fields = embed.data.fields;

  assert.ok(fields[3].name.includes('Tank'));
  assert.equal(fields[4].name, '\u200b');
  assert.ok(fields[5].name.includes('Healer'));
  assert.ok(fields[6].name.includes('DPS (Ranged)'));
  assert.equal(fields[7].name, '\u200b');
  assert.ok(fields[8].name.includes('DPS (Melee)'));
});

test('buildMainSignupComponents restores the current user\'s saved spec and character name', () => {
  const specs = [
    { id: 1, class: 'Druid', spec: 'Balance' },
    { id: 2, class: 'Druid', spec: 'Feral' }
  ];

  const rows = buildMainSignupComponents('event-1', ['Druid'], specs, '', false, 'Steve', 2);
  const [characterRow, specRow] = rows;

  assert.equal(characterRow.components[0].data.label, 'Character Name: Steve');

  const selectJson = specRow.components[0].toJSON();
  assert.equal(selectJson.options[0].default, false);
  assert.equal(selectJson.options[1].default, true);
  assert.equal(selectJson.options[1].label, 'Druid - Feral');
});

test('buildMainSignupComponents ignores the stale TestHero placeholder value', () => {
  const specs = [
    { id: 1, class: 'Druid', spec: 'Balance' },
    { id: 2, class: 'Druid', spec: 'Feral' }
  ];

  const rows = buildMainSignupComponents('event-1', ['Druid'], specs, '', false, 'TestHero', 2);
  const [characterRow] = rows;

  assert.equal(characterRow.components[0].data.label, 'Enter Character Name');
});

test('refreshEventMessage keeps the shared event message neutral instead of reusing the last user\'s values', async () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE specs (
      id INTEGER PRIMARY KEY,
      class TEXT,
      spec TEXT,
      slug TEXT,
      icon_small TEXT,
      icon_medium TEXT,
      icon_large TEXT,
      color TEXT
    );

    CREATE TABLE raid_signup_events (
      id INTEGER PRIMARY KEY,
      template_id INTEGER,
      title TEXT,
      description TEXT,
      scheduled_for TEXT,
      recurrence_instance TEXT,
      public_groups INTEGER DEFAULT 0,
      status TEXT,
      discord_channel_id TEXT,
      discord_message_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE raid_signup_user_prefs (
      discord_user_id TEXT PRIMARY KEY,
      class_name TEXT DEFAULT '',
      character_name TEXT DEFAULT '',
      spec_id INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE raid_signup_entries (
      id INTEGER PRIMARY KEY,
      event_id INTEGER,
      discord_user_id TEXT,
      discord_username TEXT,
      status TEXT,
      spec_id INTEGER,
      role_bucket TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.prepare(`INSERT INTO specs (id, class, spec, slug) VALUES (1, 'Druid', 'Balance', 'balance')`).run();
  db.prepare(`INSERT INTO specs (id, class, spec, slug) VALUES (2, 'Druid', 'Feral', 'feral')`).run();
  db.prepare(`INSERT INTO raid_signup_events (id, template_id, title, description, scheduled_for, recurrence_instance, public_groups, status, discord_channel_id, discord_message_id, created_at, updated_at)
    VALUES (7, NULL, 'Raid Signup', 'Test event', '2026-08-15T19:00:00Z', NULL, 0, 'open', 'channel-1', 'message-1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).run();
  db.prepare(`INSERT INTO raid_signup_user_prefs (discord_user_id, class_name, character_name, spec_id)
    VALUES ('other-user', 'Druid', 'Steve', 2)`).run();

  let edited;
  const message = {
    edit: async (payload) => {
      edited = payload;
    }
  };
  const client = {
    channels: {
      fetch: async () => ({
        messages: { fetch: async () => message }
      })
    },
    application: {
      emojis: { fetch: async () => ({}) }
    }
  };

  await refreshEventMessage(db, client, 7, 'other-user');

  assert.ok(edited, 'refreshEventMessage should have edited the shared event message');
  assert.equal(edited.components[0].components[0].data.label, 'Enter Character Name');
  assert.equal(edited.components[1].components[0].toJSON().options[0].default, false);
  assert.equal(edited.components[1].components[0].toJSON().options[1].default, false);
});
