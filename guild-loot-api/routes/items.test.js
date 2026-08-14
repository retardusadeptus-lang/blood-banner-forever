const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const Database = require('better-sqlite3');
const buildItemRoutes = require('./items');

function createApp() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL,
      slot VARCHAR(100),
      phase VARCHAR(100),
      source VARCHAR(255),
      source_type VARCHAR(100),
      drop_chance REAL,
      rarity VARCHAR(100),
      wowhead_id INTEGER
    );
  `);

  const app = express();
  app.use(express.json());
  app.use('/api', buildItemRoutes({ db, tokenRedemptionService: { getTokenRedemptionByItemId: () => null } }));
  return app;
}

test('POST /api/items inserts the new item and returns it', async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Item', slot: 'Head', source: 'SSC', source_type: 'Kaelthas', itemId: 1234 })
    });

    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.name, 'Test Item');
    assert.equal(payload.wowhead_id, 1234);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /api/items allows same-name items when the IDs differ', async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    const port = server.address().port;
    await fetch(`http://127.0.0.1:${port}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Shared Name', slot: 'Neck', itemId: 111 })
    });

    const response = await fetch(`http://127.0.0.1:${port}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'shared name', slot: 'Head', itemId: 222 })
    });

    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.name, 'shared name');
    assert.equal(payload.wowhead_id, 222);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /api/items rejects true duplicates for the same underlying item', async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    const port = server.address().port;
    await fetch(`http://127.0.0.1:${port}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Duplicate Item', slot: 'Neck', itemId: 555 })
    });

    const response = await fetch(`http://127.0.0.1:${port}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'duplicate item', slot: 'Head', itemId: 555 })
    });

    assert.equal(response.status, 409);
    const payload = await response.json();
    assert.match(payload.error, /already exists/i);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
