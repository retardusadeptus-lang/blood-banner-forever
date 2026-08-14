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
                media_json: row.media_json
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
            rows.set(String(bossName), { boss_name: String(bossName), notes: String(notes), media_json: String(mediaJson) });
            return { lastInsertRowid: 1 };
          }
        };
      }

      if (normalized.startsWith('UPDATE')) {
        return {
          run(...args) {
            const values = args[0] instanceof Array ? args[0] : args;
            const bossName = values[0];
            rows.set(String(bossName), { boss_name: String(bossName), notes: String(values[1] || ''), media_json: String(values[2] || '[]') });
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
    assert.equal(payload.media.length, 2);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
