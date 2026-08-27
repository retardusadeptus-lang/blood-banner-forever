'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const { buildMainSignupComponents } = require('./raidSignupComponents');
const { buildSignupEmbed, refreshEventMessage } = require('./raidSignupEmbed');
const { handleClassFilterSelect, handleCharacterNameSubmit } = require('./raidSignupHandlers');
const {
  getUserPreferredCharacter,
  getUserPreferredSpec,
  upsertUserPreferredCharacter,
  upsertUserPreferredSpec
} = require('../utils/raidSignupStore');

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

test('buildMainSignupComponents restores the current user\'s saved class/spec and character name', () => {
  const specs = [
    { id: 1, class: 'Druid', spec: 'Balance' },
    { id: 2, class: 'Druid', spec: 'Feral' }
  ];

  const rows = buildMainSignupComponents('event-1', ['Druid'], specs, 'Druid', false, 'Steve', 2);
  const [characterRow, classRow, specRow] = rows;

  assert.equal(characterRow.components[0].data.label, 'Character Name: Steve');

  const classJson = classRow.components[0].toJSON();
  assert.equal(classJson.options[0].default, true);
  assert.equal(classJson.options[0].label, 'Druid');

  const specJson = specRow.components[0].toJSON();
  assert.equal(specJson.options[0].default, true);
  assert.equal(specJson.options[1].default, false);
  assert.equal(specJson.options[0].label, 'Druid - Feral');
});

test('buildMainSignupComponents ignores the stale TestHero placeholder value', () => {
  const specs = [
    { id: 1, class: 'Druid', spec: 'Balance' },
    { id: 2, class: 'Druid', spec: 'Feral' }
  ];

  const rows = buildMainSignupComponents('event-1', ['Druid'], specs, 'Druid', false, 'TestHero', 2);
  const [characterRow] = rows;

  assert.equal(characterRow.components[0].data.label, 'Enter Character Name');
});

test('buildMainSignupComponents shows class icons in the class selector', () => {
  const specs = [
    { id: 1, class: 'Druid', spec: 'Balance' },
    { id: 2, class: 'Druid', spec: 'Feral' },
    { id: 3, class: 'Mage', spec: 'Fire' }
  ];
  const guild = {
    emojis: {
      cache: [
        { id: '11', name: 'druid', animated: false },
        { id: '12', name: 'mage', animated: false }
      ]
    }
  };

  const rows = buildMainSignupComponents('event-1', ['Druid', 'Mage'], specs, 'Druid', false, 'Steve', 2, guild);
  const classOptions = rows[1].components[0].toJSON().options;

  assert.equal(classOptions.find(option => option.label === 'Druid').emoji.name, 'druid');
  assert.equal(classOptions.find(option => option.label === 'Mage').emoji.name, 'mage');
});

test('handleClassFilterSelect acknowledges the interaction before refreshing the event message', async () => {
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
      spec_id INTEGER NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE raid_signup_drafts (
      event_id INTEGER,
      discord_user_id TEXT,
      spec_id INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(event_id, discord_user_id)
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
  db.prepare(`INSERT INTO specs (id, class, spec, slug) VALUES (3, 'Mage', 'Fire', 'fire')`).run();
  db.prepare(`INSERT INTO raid_signup_events (id, template_id, title, description, scheduled_for, recurrence_instance, public_groups, status, discord_channel_id, discord_message_id)
    VALUES (7, NULL, 'Test event', 'Test', '2026-08-15T19:00:00Z', NULL, 0, 'open', 'channel-1', 'message-1')`).run();

  let acknowledged = false;
  const interaction = {
    user: { id: 'u1' },
    values: ['Druid'],
    client: {
      channels: {
        fetch: async () => {
          if (!acknowledged) throw new Error('refreshEventMessage called before interaction.deferUpdate()');
          return {
            messages: {
              fetch: async () => ({
                edit: async () => {}
              })
            }
          };
        }
      },
      application: {
        emojis: { fetch: async () => ({}) }
      }
    },
    deferUpdate: async () => { acknowledged = true; },
    reply: async () => {}
  };

  await handleClassFilterSelect(interaction, db, 7);
  assert.equal(acknowledged, true);
});

test('handleClassFilterSelect does not send a user-facing error after deferring the interaction', async () => {
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

    CREATE TABLE raid_signup_drafts (
      event_id INTEGER,
      discord_user_id TEXT,
      spec_id INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(event_id, discord_user_id)
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
  db.prepare(`INSERT INTO raid_signup_events (id, template_id, title, description, scheduled_for, recurrence_instance, public_groups, status, discord_channel_id, discord_message_id)
    VALUES (7, NULL, 'Test event', 'Test', '2026-08-15T19:00:00Z', NULL, 0, 'open', 'channel-1', 'message-1')`).run();

  let replied = false;
  const interaction = {
    user: { id: 'u1' },
    values: ['Druid'],
    client: {
      channels: {
        fetch: async () => {
          throw new Error('refresh failed');
        }
      },
      application: {
        emojis: { fetch: async () => ({}) }
      }
    },
    deferUpdate: async () => {
      interaction.deferred = true;
    },
    reply: async () => {
      replied = true;
    }
  };

  await handleClassFilterSelect(interaction, db, 7);
  assert.equal(replied, false);
  assert.equal(interaction.deferred, true);
});

test('handleCharacterNameSubmit saves a name before class or spec selection', async () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE specs (
      id INTEGER PRIMARY KEY,
      class TEXT,
      spec TEXT
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE raid_signup_user_prefs (
      discord_user_id TEXT PRIMARY KEY,
      class_name TEXT NOT NULL DEFAULT '',
      character_name TEXT NOT NULL DEFAULT '',
      spec_id INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  db.prepare("INSERT INTO raid_signup_events (id, status) VALUES (7, 'open')").run();

  let replyContent = '';
  const interaction = {
    user: { id: 'u1' },
    fields: {
      getTextInputValue: () => 'Testname'
    },
    reply: async ({ content }) => {
      replyContent = content;
    }
  };

  await handleCharacterNameSubmit(interaction, db, 7);

  const preference = db.prepare('SELECT character_name, spec_id FROM raid_signup_user_prefs WHERE discord_user_id = ?').get('u1');
  assert.equal(preference.character_name, 'Testname');
  assert.equal(preference.spec_id, null);
  assert.equal(replyContent, 'Saved character name as Testname.');
});

test('signup preferences remain isolated by Discord user ID', () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE specs (id INTEGER PRIMARY KEY);
    INSERT INTO specs (id) VALUES (1), (2);

    CREATE TABLE raid_signup_user_prefs (
      discord_user_id TEXT PRIMARY KEY,
      class_name TEXT NOT NULL DEFAULT '',
      character_name TEXT NOT NULL DEFAULT '',
      spec_id INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  upsertUserPreferredSpec(db, 'user-1', 1);
  upsertUserPreferredCharacter(db, 'user-1', 'CharacterOne');
  upsertUserPreferredSpec(db, 'user-2', 2);
  upsertUserPreferredCharacter(db, 'user-2', 'CharacterTwo');

  assert.equal(getUserPreferredSpec(db, 'user-1').spec_id, 1);
  assert.equal(getUserPreferredCharacter(db, 'user-1').character_name, 'CharacterOne');
  assert.equal(getUserPreferredSpec(db, 'user-2').spec_id, 2);
  assert.equal(getUserPreferredCharacter(db, 'user-2').character_name, 'CharacterTwo');
});

test('buildMainSignupComponents uses the class dropdown first and then narrows the relevant specs', () => {
  const specs = [
    { id: 1, class: 'Warrior', spec: 'Protection' },
    { id: 2, class: 'Mage', spec: 'Fire' },
    { id: 3, class: 'Warrior', spec: 'Arms' }
  ];

  const rows = buildMainSignupComponents('event-1', ['Mage', 'Warrior'], specs, 'Warrior', false, 'Steve', 1);
  assert.equal(rows.length, 4, 'expected character, class, spec, and status rows');

  const classRow = rows[1];
  const classOptions = classRow.components[0].toJSON().options.map(option => option.label);
  assert.ok(classOptions.includes('Warrior'));
  assert.ok(classOptions.includes('Mage'));
  assert.ok(classRow.components[0].toJSON().options.some(option => option.label === 'Warrior' && option.default === true));

  const specRow = rows[2];
  const specOptions = specRow.components[0].toJSON().options.map(option => option.label);
  assert.deepEqual(specOptions, ['Warrior - Protection', 'Warrior - Arms']);
  assert.ok(specRow.components[0].toJSON().options.some(option => option.label === 'Warrior - Protection' && option.default === true));
});

test('buildMainSignupComponents keeps the class and spec lists under the Discord 25-option cap', () => {
  const specs = [
    ...Array.from({ length: 20 }, (_, index) => ({ id: index + 1, class: 'Mage', spec: `Spec ${index + 1}` })),
    ...Array.from({ length: 10 }, (_, index) => ({ id: index + 21, class: 'Warrior', spec: `Warrior Spec ${index + 1}` }))
  ];

  const rows = buildMainSignupComponents('event-1', ['Mage', 'Warrior'], specs, 'Warrior', false, 'Steve', 25);
  const classOptions = rows[1].components[0].toJSON().options.map(option => option.label);
  const specOptions = rows[2].components[0].toJSON().options.map(option => option.label);

  assert.equal(classOptions.length, 2);
  assert.ok(specOptions.includes('Warrior - Warrior Spec 10'));
  assert.ok(specOptions.every(option => option.startsWith('Warrior - ')));
  assert.ok(specOptions.length <= 25);
});

test('refreshEventMessage restores the last saved class and character to the shared event message', async () => {
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

    CREATE TABLE raid_signup_event_filters (
      event_id INTEGER PRIMARY KEY,
      selected_class TEXT NOT NULL,
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
  db.prepare(`INSERT INTO raid_signup_user_prefs (discord_user_id, class_name, character_name, spec_id, updated_at)
    VALUES ('other-user', 'Druid', 'Steve', 2, CURRENT_TIMESTAMP)`).run();
  db.prepare(`INSERT INTO raid_signup_event_filters (event_id, selected_class, updated_at)
    VALUES (7, 'Druid', CURRENT_TIMESTAMP)`).run();

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
  assert.equal(edited.components[0].components[0].data.label, 'Character Name: Steve');
  const classOptions = edited.components[1].components[0].toJSON().options;
  assert.equal(classOptions[0].default, true);
  const specOptions = edited.components[2].components[0].toJSON().options;
  assert.equal(specOptions[0].default, true);
  assert.equal(specOptions[0].label, 'Druid - Feral');
});

test('refreshEventMessage uses the last saved values when no user id is supplied', async () => {
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

    CREATE TABLE raid_signup_event_filters (
      event_id INTEGER PRIMARY KEY,
      selected_class TEXT NOT NULL,
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
  db.prepare(`INSERT INTO raid_signup_user_prefs (discord_user_id, class_name, character_name, spec_id, updated_at)
    VALUES ('other-user', 'Druid', 'Steve', 2, CURRENT_TIMESTAMP)`).run();
  db.prepare(`INSERT INTO raid_signup_event_filters (event_id, selected_class, updated_at)
    VALUES (7, 'Druid', CURRENT_TIMESTAMP)`).run();

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

  await refreshEventMessage(db, client, 7);

  assert.ok(edited, 'refreshEventMessage should have edited the shared event message');
  assert.equal(edited.components[0].components[0].data.label, 'Character Name: Steve');
  const specOptions = edited.components[2].components[0].toJSON().options;
  assert.ok(specOptions.some(option => option.default === true && option.label === 'Druid - Feral'));
});
