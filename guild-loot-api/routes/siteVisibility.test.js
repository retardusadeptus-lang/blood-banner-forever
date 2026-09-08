const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const Database = require('better-sqlite3');
const { issueSession } = require('../middleware/auth');
const buildAdminSiteVisibilityRoutes = require('./admin/siteVisibility');

function createApp() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE site_visibility_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      surface_roles_by_tab_json TEXT NOT NULL DEFAULT '{}',
      group_by_tab_json TEXT NOT NULL DEFAULT '{}',
      order_by_tab_json TEXT NOT NULL DEFAULT '{}',
      section_visibility_by_id_json TEXT NOT NULL DEFAULT '{}',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO site_visibility_config (id) VALUES (1);
  `);

  const app = express();
  app.use(express.json());
  app.use('/api', buildAdminSiteVisibilityRoutes({ db, sessionSecret: 'test-secret' }));
  return app;
}

async function withServer(app, callback) {
  const server = app.listen(0);
  try {
    return await callback(server.address().port);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test('GET /api/site-visibility returns the public persisted configuration', async () => {
  const app = createApp();

  await withServer(app, async port => {
    const response = await fetch(`http://127.0.0.1:${port}/api/site-visibility`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      surface_roles_by_tab: {},
      group_by_tab: {},
      order_by_tab: {},
      section_visibility_by_id: {}
    });
  });
});

test('PUT /api/site-visibility requires admin authentication', async () => {
  const app = createApp();

  await withServer(app, async port => {
    const response = await fetch(`http://127.0.0.1:${port}/api/site-visibility`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ surface_roles_by_tab: { 'loot.overview': ['Public'] } })
    });

    assert.equal(response.status, 401);
  });
});

test('admin site-visibility writes are normalized and persist across reads', async () => {
  const app = createApp();

  await withServer(app, async port => {
    const headers = {
      'Content-Type': 'application/json',
      'x-admin-token': issueSession('test-secret')
    };
    const updateResponse = await fetch(`http://127.0.0.1:${port}/api/site-visibility`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        surface_roles_by_tab: {
          'loot.overview': ['Admin', 'Admin', 'Invalid Role', 'Public'],
          'loot.assigned': 'not-an-array'
        },
        group_by_tab: {
          'loot.overview': 'resources',
          'loot.assigned': 'not-a-group'
        },
        order_by_tab: {
          'loot.overview': '2',
          'loot.assigned': 'not-a-number'
        },
        section_visibility_by_id: {
          'raid-signups.history.raid-helper-import': false,
          'invalid': 'true'
        }
      })
    });

    assert.equal(updateResponse.status, 200);
    assert.deepEqual(await updateResponse.json(), {
      ok: true,
      surface_roles_by_tab: {
        'loot.overview': ['Admin', 'Public'],
        'loot.assigned': []
      },
      group_by_tab: {
        'loot.overview': 'resources'
      },
      order_by_tab: {
        'loot.overview': 2
      },
      section_visibility_by_id: {
        'raid-signups.history.raid-helper-import': false,
        invalid: true
      }
    });

    const readResponse = await fetch(`http://127.0.0.1:${port}/api/site-visibility`);
    assert.equal(readResponse.status, 200);
    assert.deepEqual(await readResponse.json(), {
      surface_roles_by_tab: {
        'loot.overview': ['Admin', 'Public'],
        'loot.assigned': []
      },
      group_by_tab: {
        'loot.overview': 'resources'
      },
      order_by_tab: {
        'loot.overview': 2
      },
      section_visibility_by_id: {
        'raid-signups.history.raid-helper-import': false,
        invalid: true
      }
    });
  });
});
