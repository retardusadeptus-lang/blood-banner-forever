const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { issueSession } = require('../middleware/auth');
const buildTacticsRoutes = require('./tactics');

function createDb() {
  const rows = new Map();
  return {
    prepare(query) {
      const normalized = query.trim();

      if (normalized.startsWith('SELECT')) {
        return {
          all() {
            if (normalized.includes('FROM raid_tactics')) {
              return Array.from(rows.values()).map(row => ({
                boss_name: row.boss_name,
                notes: row.notes,
                media_json: row.media_json,
                tags_json: row.tags_json
              }));
            }
            if (normalized.includes('FROM raid_assignment_config_bosses')) {
              return Array.from(rows.values())
                .filter(row => row.boss_name)
                .map(row => ({ boss_name: row.boss_name }));
            }
            return [];
          },
          get() {
            return null;
          }
        };
      }

      if (normalized.startsWith('INSERT')) {
        return {
          run(...args) {
            const values = args[0] instanceof Array ? args[0] : args;
            const bossName = values[0];
            const notes = values[1] || '';
            const mediaJson = values[2] || '[]';
            const tagsJson = values[3] || '[]';
            rows.set(String(bossName), { boss_name: String(bossName), notes: String(notes), media_json: String(mediaJson), tags_json: String(tagsJson) });
            return { lastInsertRowid: 1 };
          }
        };
      }

      if (normalized.startsWith('UPDATE')) {
        return {
          run(...args) {
            const values = args[0] instanceof Array ? args[0] : args;
            const bossName = values[0];
            rows.set(String(bossName), { boss_name: String(bossName), notes: String(values[1] || ''), media_json: String(values[2] || '[]'), tags_json: String(values[3] || '[]') });
            return { changes: 1 };
          }
        };
      }

      return {
        all() { return []; },
        get() { return null; },
        run() { return { changes: 0 }; }
      };
    }
  };
}

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', buildTacticsRoutes({ db: createDb(), sessionSecret: 'test-secret' }));
  return app;
}

test('GET /api/tactics returns boss order and empty defaults', async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/tactics`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.ok(Array.isArray(payload.bossOrder));
    assert.ok(Array.isArray(payload.entries));
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('PUT /api/tactics/:bossName saves a single boss tactic with media', async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/tactics/Kael%27thas%20Sunstrider`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': issueSession('test-secret')
      },
      body: JSON.stringify({
        bossName: "Kael'thas Sunstrider",
        notes: 'Spread during phase 2.',
        tags: ['General', 'Ranged DPS', 'Mage'],
        media: [
          { type: 'image', url: 'https://example.com/kael.jpg', label: 'Boss image' },
          { type: 'video', url: 'https://www.youtube.com/watch?v=abc123', label: 'Video reference' }
        ]
      })
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.bossName, "Kael'thas Sunstrider");
    assert.equal(payload.notes, 'Spread during phase 2.');
    assert.deepEqual(payload.tags, ['General', 'Ranged DPS', 'Mage']);
    assert.equal(payload.media.length, 2);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('PUT /api/tactics/:bossName saves boss sections and tagged line items', async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/tactics/Illidan`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': issueSession('test-secret')
      },
      body: JSON.stringify({
        bossName: 'Illidan',
        notes: 'Use the assigned roles to peel away adds.',
        tags: ['General'],
        sections: [
          {
            id: 'phase-one',
            title: 'Phase 1',
            items: [
              { id: 'tank-safe', text: 'Tank the boss on the left side.', tags: ['Tank'] },
              { id: 'mage-burn', text: 'Mage and warlock burn the adds.', tags: ['Mage', 'Warlock'] },
              { id: 'healer-focus', text: 'Healer focus on the tank during storm.', tags: ['Healer'] }
            ]
          }
        ]
      })
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.bossName, 'Illidan');
    assert.equal(payload.sections.length, 1);
    assert.equal(payload.sections[0].items.length, 3);
    assert.deepEqual(payload.sections[0].items[0].tags, ['Tank']);
    assert.deepEqual(payload.sections[0].items[1].tags, ['Mage', 'Warlock']);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
