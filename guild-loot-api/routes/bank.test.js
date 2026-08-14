const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const buildBankRoutes = require('./bank');

function createDb() {
  const rows = [
    {
      id: 1,
      player_id: 2,
      item_wowhead_id: 123,
      item_name: 'Test Item',
      quantity: 2,
      reason: 'Need for raid',
      status: 'archived',
      requester_name: 'Test Player',
      created_at: '2026-08-12T00:00:00.000Z'
    }
  ];

  return {
    prepare(query) {
      const normalized = query.trim();

      if (normalized.startsWith('SELECT')) {
        return {
          all() {
            return [...rows];
          },
          get(id) {
            return rows.find(row => row.id === Number(id)) || null;
          }
        };
      }

      if (normalized.startsWith('DELETE')) {
        return {
          run(id) {
            const index = rows.findIndex(row => row.id === Number(id));
            if (index >= 0) rows.splice(index, 1);
            return { changes: index >= 0 ? 1 : 0 };
          }
        };
      }

      if (normalized.startsWith('UPDATE')) {
        return {
          run() {
            return { changes: 1 };
          }
        };
      }

      return {
        run() {
          return { lastInsertRowid: 1 };
        }
      };
    }
  };
}

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', buildBankRoutes({
    db: createDb(),
    discordService: {
      sendBankInventoryWebhook: async () => {},
      sendBankBulkResolutionWebhook: async () => {},
      sendBankResolutionWebhook: async () => {}
    }
  }));
  return app;
}

test('DELETE /api/bank-requests/:id removes an archived request', async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/bank-requests/1`, {
      method: 'DELETE'
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.ok, true);
    assert.equal(payload.deletedId, 1);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
