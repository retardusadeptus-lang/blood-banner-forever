const assert = require('node:assert/strict');
const test = require('node:test');
const Database = require('better-sqlite3');
const { ensureDatabaseReady } = require('../../config/database/schema');
const absenceCommand = require('./absence');

function createDb() {
  const db = new Database(':memory:');
  ensureDatabaseReady(db);

  const userResult = db.prepare(`
    INSERT INTO users (battletag, blizzard_id)
    VALUES (?, ?)
  `).run('Player#1234', 'blizzard-1234');
  const specResult = db.prepare(`
    INSERT INTO specs (class, spec, slug)
    VALUES (?, ?, ?)
  `).run('Warrior', 'Protection', 'warrior-protection');
  db.prepare(`
    INSERT INTO roster (name, spec_id, in_raid, user_id, discord_user_id)
    VALUES (?, ?, 1, ?, ?)
  `).run('Player', specResult.lastInsertRowid, userResult.lastInsertRowid, 'discord-1234');

  return db;
}

function createInteraction(subcommand, dates, userId = 'discord-1234') {
  const replies = [];
  return {
    user: { id: userId },
    replies,
    replied: false,
    deferred: false,
    inGuild: () => true,
    options: {
      getSubcommand: () => subcommand,
      getString: () => dates
    },
    async reply(payload) {
      this.replied = true;
      replies.push(payload);
    },
    async editReply(payload) {
      replies.push(payload);
    }
  };
}

function createAutocompleteInteraction(focused, userId = 'discord-1234') {
  const responses = [];
  return {
    user: { id: userId },
    responses,
    options: {
      getSubcommand: () => 'remove',
      getFocused: () => focused
    },
    async respond(choices) {
      responses.push(choices);
    }
  };
}

test('absence command adds, lists, and removes linked user dates', async () => {
  const db = createDb();
  try {
    const addInteraction = createInteraction('add', '2099-10-10 to 2099-10-11');
    await absenceCommand.execute(addInteraction, { db });

    assert.match(addInteraction.replies[0].content, /Added 2 absence dates/);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM raid_signup_absences').get().count, 2);

    const listInteraction = createInteraction('list');
    await absenceCommand.execute(listInteraction, { db });
    assert.match(listInteraction.replies[0].content, /2099-10-10/);
    assert.match(listInteraction.replies[0].content, /2099-10-11/);

    const removeInteraction = createInteraction('remove', '2099-10-10, 2099-10-11');
    await absenceCommand.execute(removeInteraction, { db });
    assert.match(removeInteraction.replies[0].content, /Removed 2 absence dates/);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM raid_signup_absences').get().count, 0);
  } finally {
    db.close();
  }
});

test('absence command removes a date from the middle of an existing range', async () => {
  const db = createDb();
  try {
    const userId = db.prepare('SELECT id FROM users WHERE blizzard_id = ?').get('blizzard-1234').id;
    db.prepare(`
      INSERT INTO raid_signup_absences (user_id, start_date, end_date, note)
      VALUES (?, ?, ?, ?)
    `).run(userId, '2099-10-10', '2099-10-12', 'Website range');

    const removeInteraction = createInteraction('remove', '2099-10-11');
    await absenceCommand.execute(removeInteraction, { db });

    const rows = db.prepare(`
      SELECT start_date, end_date, note
      FROM raid_signup_absences
      ORDER BY start_date
    `).all();
    assert.deepEqual(rows, [
      { start_date: '2099-10-10', end_date: '2099-10-10', note: 'Website range' },
      { start_date: '2099-10-12', end_date: '2099-10-12', note: 'Website range' }
    ]);
  } finally {
    db.close();
  }
});

test('absence command explains when the Discord account is not linked', async () => {
  const db = createDb();
  try {
    const interaction = createInteraction('list', '', 'unlinked-discord-user');
    await absenceCommand.execute(interaction, { db });

    assert.match(interaction.replies[0].content, /not linked to a claimed roster character/);
  } finally {
    db.close();
  }
});

test('absence command offers linked upcoming dates for removal autocomplete', async () => {
  const db = createDb();
  try {
    const userId = db.prepare('SELECT id FROM users WHERE blizzard_id = ?').get('blizzard-1234').id;
    db.prepare(`
      INSERT INTO raid_signup_absences (user_id, start_date, end_date, note)
      VALUES (?, ?, ?, ?)
    `).run(userId, '2099-10-10', '2099-10-12', 'Website range');

    const interaction = createAutocompleteInteraction('2099-10');
    await absenceCommand.autocomplete(interaction, { db });

    assert.deepEqual(interaction.responses[0], [
      { name: '2099-10-10 to 2099-10-12', value: '2099-10-10 to 2099-10-12' }
    ]);
  } finally {
    db.close();
  }
});

test('absence command rejects invalid calendar dates without writing', async () => {
  const db = createDb();
  try {
    const interaction = createInteraction('add', '2099-02-30');
    await absenceCommand.execute(interaction, { db });

    assert.match(interaction.replies[0].content, /valid calendar dates/);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM raid_signup_absences').get().count, 0);
  } finally {
    db.close();
  }
});
