const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { issueSession } = require('../middleware/auth');
const buildRecruitmentAboutRoutes = require('./recruitmentAbout');

function createDb() {
  const rows = [{ id: 1, data_json: '{}' }];

  return {
    prepare(query) {
      const normalized = query.trim();

      if (normalized.startsWith('SELECT data_json FROM recruitment_about_config')) {
        return {
          get() {
            return rows[0] || null;
          }
        };
      }

      if (normalized.startsWith('INSERT INTO recruitment_about_config')) {
        return {
          run(dataJson) {
            rows[0] = { id: 1, data_json: dataJson };
            return { changes: 1 };
          }
        };
      }

      return {
        get() { return null; },
        run() { return { changes: 0 }; }
      };
    }
  };
}

function createApp(db) {
  const app = express();
  app.use(express.json());
  app.use('/api', buildRecruitmentAboutRoutes({ db, sessionSecret: 'test-secret' }));
  return app;
}

test('GET /api/recruitment-about returns the default editable content', async () => {
  const server = createApp(createDb()).listen(0);

  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/recruitment-about`);
    assert.equal(response.status, 200);
    const content = await response.json();
    assert.equal(content.title, 'About Us');
    assert.equal(content.sections.length, 3);
    assert.equal(content.sections[0].title, 'Our guild');
    assert.equal(content.guildInfo.title, 'Join the guild');
    assert.equal(content.guildInfo.discordLinks.length, 2);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('PUT /api/recruitment-about requires officer access and persists normalized content', async () => {
  const db = createDb();
  const server = createApp(db).listen(0);

  try {
    const url = `http://127.0.0.1:${server.address().port}/api/recruitment-about`;
    const unauthorized = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Not allowed' })
    });
    assert.equal(unauthorized.status, 401);

    const token = issueSession('test-secret');
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token
      },
      body: JSON.stringify({
        eyebrow: '  Community   ',
        title: 'The Guild',
        intro: 'Line one\r\nLine two',
        sections: [{ title: 'People', body: 'A welcoming group.' }],
        guildInfo: {
          title: 'Find us',
          body: 'Join the community.',
          discordLinks: [
            { id: 'main', label: '  Main Discord  ', url: 'https://discord.gg/example' },
            { id: 'bad', label: 'Unsafe', url: 'javascript:alert(1)' }
          ]
        }
      })
    });

    assert.equal(response.status, 200);
    const content = await response.json();
    assert.equal(content.eyebrow, 'Community');
    assert.equal(content.intro, 'Line one\nLine two');
    assert.equal(content.sections[0].title, 'People');
    assert.equal(content.sections[1].title, 'Our raids');
    assert.equal(content.guildInfo.title, 'Find us');
    assert.deepEqual(content.guildInfo.discordLinks, [
      { id: 'main', label: 'Main Discord', url: 'https://discord.gg/example' },
      { id: 'bad', label: 'Unsafe', url: '' }
    ]);

    const persisted = await fetch(url);
    assert.deepEqual(await persisted.json(), content);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
