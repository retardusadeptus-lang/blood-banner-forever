const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const Database = require('better-sqlite3');
const buildAssignmentsRoutes = require('./assignments');

async function startServer() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE assignments (
      phase TEXT NOT NULL,
      item_name TEXT NOT NULL,
      player_id INTEGER NOT NULL,
      rank INTEGER,
      is_pass INTEGER DEFAULT 0,
      UNIQUE(phase, item_name, player_id)
    );
  `);

  const app = express();
  app.use(express.json());
  app.use(buildAssignmentsRoutes({ db }));

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });

  const { port } = server.address();
  return { server, db, baseUrl: `http://127.0.0.1:${port}` };
}

test('PUT /assignments/:phase ignores metadata keys and stores player entries', async () => {
  const { server, db, baseUrl } = await startServer();

  try {
    const res = await fetch(`${baseUrl}/assignments/t5`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'Abyssal Crest': {
          101: 1,
          102: 'Pass',
          awardedPlayerIds: ['101'],
          assignedAt: '2024-01-01T00:00:00.000Z'
        }
      })
    });

    assert.equal(res.status, 200);

    const rows = db.prepare('SELECT player_id, rank, is_pass FROM assignments WHERE phase = ? ORDER BY player_id').all('t5');
    assert.deepEqual(rows, [
      { player_id: 101, rank: 1, is_pass: 0 },
      { player_id: 102, rank: null, is_pass: 1 }
    ]);

    const getRes = await fetch(`${baseUrl}/assignments/t5`);
    assert.equal(getRes.status, 200);
    const payload = await getRes.json();
    assert.deepEqual(payload, {
      'Abyssal Crest': {
        '101': 1,
        '102': 'Pass',
        awardedPlayerIds: ['101']
      }
    });
  } finally {
    server.close();
  }
});

test('PUT /assignments/:phase preserves awarded player ids across round-trips', async () => {
  const { server, baseUrl } = await startServer();

  try {
    const res = await fetch(`${baseUrl}/assignments/t5`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'Vestments of the Sea-Witch': {
          201: 2,
          awardedPlayerIds: ['101', '102'],
          assignedAt: '2024-01-01T00:00:00.000Z'
        }
      })
    });

    assert.equal(res.status, 200);

    const getRes = await fetch(`${baseUrl}/assignments/t5`);
    assert.equal(getRes.status, 200);
    const payload = await getRes.json();
    assert.deepEqual(payload['Vestments of the Sea-Witch'].awardedPlayerIds, ['101', '102']);
  } finally {
    server.close();
  }
});
