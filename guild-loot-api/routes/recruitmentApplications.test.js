const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createBattleNetSession } = require('../middleware/auth');
const buildRecruitmentApplicationsRoutes = require('./recruitmentApplications');

function createDb() {
  const configRows = [{ id: 1, blurb: 'Welcome to recruitment.' }];
  const appRows = [];
  let nextId = 1;

  return {
    prepare(query) {
      const normalized = query.trim();

      if (normalized.startsWith('SELECT') && normalized.includes('FROM recruitment_applications_config')) {
        return {
          get() { return configRows[0] || null; },
          all() { return configRows; }
        };
      }

      if (normalized.startsWith('INSERT') && normalized.includes('recruitment_applications_config')) {
        return {
          run(blurb) {
            configRows.length = 0;
            configRows.push({ id: 1, blurb: String(blurb || '') });
            return { changes: 1 };
          }
        };
      }

      if (normalized.startsWith('SELECT') && normalized.includes('FROM recruitment_applications')) {
        return {
          all() { return [...appRows]; },
          get() { return appRows[0] || null; }
        };
      }

      if (normalized.startsWith('INSERT') && normalized.includes('recruitment_applications')) {
        return {
          run(...args) {
            const row = {
              id: nextId++,
              user_id: args[0],
              battletag: args[1],
              class_name: args[2],
              spec: args[3],
              name: args[4],
              about_me: args[5],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            appRows.push(row);
            return { lastInsertRowid: row.id };
          }
        };
      }

      return {
        get() { return null; },
        all() { return []; },
        run() { return { changes: 0 }; }
      };
    }
  };
}

test('POST /api/recruitment-applications stores the applicant and returns the created record', async () => {
  const db = createDb();
  const app = express();
  app.use(express.json());
  app.use('/api', buildRecruitmentApplicationsRoutes({ db, sessionSecret: 'test-secret', webhookUrl: 'https://example.test/hook' }));

  const server = app.listen(0);
  try {
    const port = server.address().port;
    const { token } = createBattleNetSession({ userId: 42, battletag: 'Applicant#1234' });

    const response = await fetch(`http://127.0.0.1:${port}/api/recruitment-applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `wow_loot_bnet_sid=${token}`
      },
      body: JSON.stringify({
        className: 'Mage',
        spec: 'Fire',
        name: 'Applicant',
        aboutMe: 'I have prior raid experience and want a chill environment.'
      })
    });

    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.className, 'Mage');
    assert.equal(payload.name, 'Applicant');
    assert.equal(payload.applicantBattletag, 'Applicant#1234');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
