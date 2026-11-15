const assert = require('node:assert/strict');
const test = require('node:test');
const Database = require('better-sqlite3');
const { ensureDatabaseReady } = require('../../../config/database/schema');
const { parseScheduledUnix } = require('../../../utils/raidSignupTime');
const { autocomplete } = require('./autocomplete');
const {
  chaseEvent,
  findMissingSignupTargets,
  runAutomaticChase
} = require('./chase');

const MISSING_DISCORD_ID = '11111111111111111';
const RESPONDED_DISCORD_ID = '22222222222222222';

function createDb() {
  const db = new Database(':memory:');
  ensureDatabaseReady(db);

  const spec = db.prepare(`
    INSERT INTO specs (class, spec, slug)
    VALUES (?, ?, ?)
  `).run('Warrior', 'Protection', 'warrior-protection');

  const event = db.prepare(`
    INSERT INTO raid_signup_events (
      title, scheduled_for, status, discord_channel_id, discord_message_id
    )
    VALUES (?, ?, 'open', ?, ?)
  `).run('Friday Raid', '2099-10-10 20:00 Europe/Paris', 'channel-1', 'message-1');

  db.prepare(`
    INSERT INTO roster (name, spec_id, in_raid, discord_user_id)
    VALUES (?, ?, 1, ?), (?, ?, 1, ?), (?, ?, 1, NULL), (?, ?, 0, ?)
  `).run(
    'Missing Player', spec.lastInsertRowid, MISSING_DISCORD_ID,
    'Responded Player', spec.lastInsertRowid, RESPONDED_DISCORD_ID,
    'Unlinked Player', spec.lastInsertRowid,
    'Inactive Player', spec.lastInsertRowid, '33333333333333333'
  );
  db.prepare(`
    INSERT INTO raid_signup_entries (
      event_id, discord_user_id, discord_username, status, spec_id
    )
    VALUES (?, ?, ?, 'signup', ?)
  `).run(event.lastInsertRowid, RESPONDED_DISCORD_ID, 'Responded Player', spec.lastInsertRowid);

  return { db, eventId: Number(event.lastInsertRowid) };
}

function createInteraction(eventId, delivery) {
  const replies = [];
  return {
    replies,
    deferred: false,
    replied: false,
    options: {
      getString(name) {
        return name === 'event' ? String(eventId) : delivery;
      }
    },
    async deferReply() {
      this.deferred = true;
    },
    async editReply(payload) {
      replies.push(payload);
    },
    async reply(payload) {
      this.replied = true;
      replies.push(payload);
    }
  };
}

test('findMissingSignupTargets excludes responders and inactive roster members', () => {
  const { db, eventId } = createDb();
  try {
    const result = findMissingSignupTargets(db, eventId);

    assert.deepEqual(result.missing, [{
      discordUserId: MISSING_DISCORD_ID,
      names: ['Missing Player'],
      reachable: true
    }]);
    assert.deepEqual(result.unlinkedNames, ['Unlinked Player']);
  } finally {
    db.close();
  }
});

test('chase sends direct and server reminders and reports unlinked members', async () => {
  const { db, eventId } = createDb();
  const directMessages = [];
  const serverMessages = [];
  const interaction = createInteraction(eventId, 'both');
  interaction.client = {
    users: {
      async fetch(userId) {
        return {
          async send(payload) {
            directMessages.push({ userId, payload });
          }
        };
      }
    },
    channels: {
      async fetch(channelId) {
        return {
          id: channelId,
          async send(payload) {
            serverMessages.push(payload);
          }
        };
      }
    }
  };

  try {
    await chaseEvent(interaction, db);

    assert.equal(directMessages.length, 1);
    assert.equal(directMessages[0].userId, MISSING_DISCORD_ID);
    assert.deepEqual(directMessages[0].payload.allowedMentions, { parse: [] });
    assert.equal(serverMessages.length, 1);
    assert.deepEqual(serverMessages[0].allowedMentions, { users: [MISSING_DISCORD_ID] });
    assert.match(interaction.replies[0].content, /Direct messages sent: 1; failed: 0/);
    assert.match(interaction.replies[0].content, /Server reminder messages sent: 1; failed: 0/);
    assert.match(interaction.replies[0].content, /Unlinked Player/);

    const repeatInteraction = createInteraction(eventId, 'direct');
    repeatInteraction.client = interaction.client;
    await chaseEvent(repeatInteraction, db);
    assert.equal(directMessages.length, 1);
    assert.match(repeatInteraction.replies[0].content, /24-hour cooldown/);
  } finally {
    db.close();
  }
});

test('automatic chase sends one reminder in the active time window and skips duplicates', async () => {
  const { db, eventId } = createDb();
  const directMessages = [];
  const client = {
    users: {
      async fetch(userId) {
        return {
          async send(payload) {
            directMessages.push({ userId, payload });
          }
        };
      }
    }
  };

  try {
    const event = db.prepare('SELECT scheduled_for FROM raid_signup_events WHERE id = ?').get(eventId);
    const scheduledUnix = parseScheduledUnix(event.scheduled_for);
    const now = scheduledUnix * 1000 - (12 * 60 * 60 * 1000);

    const first = await runAutomaticChase({ db, client, now });
    const second = await runAutomaticChase({ db, client, now });

    assert.deepEqual(first, { eventsChecked: 1, sent: 1, failed: 0, skipped: 0 });
    assert.deepEqual(second, { eventsChecked: 1, sent: 0, failed: 0, skipped: 1 });
    assert.equal(directMessages.length, 1);

    const stale = await runAutomaticChase({
      db,
      client,
      now: scheduledUnix * 1000 + (60 * 60 * 1000)
    });
    assert.deepEqual(stale, { eventsChecked: 1, sent: 0, failed: 0, skipped: 0 });
    assert.equal(directMessages.length, 1);
  } finally {
    db.close();
  }
});

test('raidsignup autocomplete includes chase event choices', async () => {
  const { db, eventId } = createDb();
  const responses = [];
  const interaction = {
    options: {
      getFocused: () => ({ name: 'event', value: 'Friday' }),
      getSubcommand: () => 'chase'
    },
    async respond(choices) {
      responses.push(choices);
    }
  };

  try {
    await autocomplete(interaction, db);

    assert.deepEqual(responses[0], [{
      name: `#${eventId} [open] Friday Raid`,
      value: String(eventId)
    }]);
  } finally {
    db.close();
  }
});
