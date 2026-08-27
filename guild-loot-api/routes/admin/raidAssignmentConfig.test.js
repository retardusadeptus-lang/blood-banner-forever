const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const buildAdminRaidAssignmentConfigRoutes = require('./raidAssignmentConfig');

function createDb() {
  const rows = [
    { boss_name: 'Kael\'thas Sunstrider' },
    { boss_name: 'Illidan Stormrage' },
    { boss_name: 'Abyssal Council' }
  ];

  return {
    prepare(query) {
      const normalized = query.trim();

      if (normalized.startsWith('SELECT')) {
        return {
          all() {
            if (normalized.includes('ORDER BY rowid')) {
              return [...rows];
            }
            return [...rows];
          }
        };
      }

      if (normalized.startsWith('DELETE')) {
        return { run() {} };
      }

      if (normalized.startsWith('INSERT')) {
        return { run() {} };
      }

      return { run() {} };
    }
  };
}

test('GET /raid-assignment-config preserves the chosen boss order from the selector', async () => {
  const app = express();
  app.use(express.json());
  app.use('/', buildAdminRaidAssignmentConfigRoutes({ db: createDb() }));

  const server = app.listen(0);

  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/raid-assignment-config`);
    assert.equal(response.status, 200);

    const payload = await response.json();
    assert.deepEqual(payload, [
      'Kael\'thas Sunstrider',
      'Illidan Stormrage',
      'Abyssal Council'
    ]);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
