const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { issueSession } = require('../middleware/auth');
const buildWipefestRoutes = require('./wipefest');

function createDb() {
  const rows = [];
  let nextId = 1;

  return {
    prepare(query) {
      const normalized = query.trim();

      if (normalized.startsWith('SELECT')) {
        return {
          all() {
            return [...rows].sort((a, b) => (a.raid_date || '').localeCompare(b.raid_date || '')).reverse();
          },
          get(id) {
            if (typeof id !== 'undefined') {
              return rows.find(row => row.id === Number(id)) || null;
            }
            return rows.find(row => row.id === 1) || null;
          }
        };
      }

      if (normalized.startsWith('INSERT')) {
        return {
          run(...args) {
            const payload = args;
            const row = {
              id: nextId++,
              raid_date: payload[0] || '',
              title: payload[1] || '',
              logs_url: payload[2] || '',
              wipefest_url: payload[3] || '',
              notes: payload[4] || '',
              created_by: payload[5] || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            rows.push(row);
            return { lastInsertRowid: row.id };
          }
        };
      }

      if (normalized.startsWith('UPDATE')) {
        return {
          run(...args) {
            const payload = args;
            const id = Number(payload[payload.length - 1]);
            const row = rows.find(entry => entry.id === id);
            if (!row) return { changes: 0 };
            row.raid_date = payload[0] || row.raid_date;
            row.title = payload[1] || row.title;
            row.logs_url = payload[2] || row.logs_url;
            row.wipefest_url = payload[3] || row.wipefest_url;
            row.notes = payload[4] || row.notes;
            row.updated_at = new Date().toISOString();
            return { changes: 1 };
          }
        };
      }

      if (normalized.startsWith('DELETE')) {
        return {
          run(id) {
            const index = rows.findIndex(entry => entry.id === Number(id));
            if (index >= 0) rows.splice(index, 1);
            return { changes: index >= 0 ? 1 : 0 };
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
  app.use('/api', buildWipefestRoutes({ db: createDb(), sessionSecret: 'test-secret' }));
  return app;
}

test('GET /api/wipefest returns empty list by default', async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/wipefest`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.deepEqual(payload, []);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /api/wipefest creates a stored entry', async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/wipefest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': issueSession('test-secret')
      },
      body: JSON.stringify({
        raidDate: '2026-08-14',
        title: 'Hyjal cleanup',
        logsUrl: 'https://classic.warcraftlogs.com/reports/abc',
        wipefestUrl: 'https://wipefest.example/raid-1',
        notes: 'Need to fix the phase 2 pull.'
      })
    });

    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.title, 'Hyjal cleanup');
    assert.equal(payload.logsUrl, 'https://classic.warcraftlogs.com/reports/abc');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
