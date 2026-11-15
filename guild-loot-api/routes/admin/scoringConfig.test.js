const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const Database = require('better-sqlite3');
const { ensureDatabaseReady } = require('../../config/database/schema');
const buildAdminScoringConfigRoutes = require('./scoringConfig');

function createApp(db) {
  const app = express();
  app.use(express.json());
  app.use('/', buildAdminScoringConfigRoutes({ db }));
  return app;
}

test('scoring config persists validated default appearance settings', async () => {
  const db = new Database(':memory:');
  ensureDatabaseReady(db);
  const server = createApp(db).listen(0);

  try {
    const port = server.address().port;
    const initialResponse = await fetch(`http://127.0.0.1:${port}/scoring-config`);
    assert.equal(initialResponse.status, 200);
    assert.deepEqual((await initialResponse.json()).defaultThemePalette, 'azure');

    const saveResponse = await fetch(`http://127.0.0.1:${port}/scoring-config`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ defaultThemePalette: 'shadow', defaultThemeFont: 'scribe' })
    });
    assert.equal(saveResponse.status, 200);

    const savedResponse = await fetch(`http://127.0.0.1:${port}/scoring-config`);
    const savedConfig = await savedResponse.json();
    assert.equal(savedConfig.defaultThemePalette, 'shadow');
    assert.equal(savedConfig.defaultThemeFont, 'scribe');

    const legacySaveResponse = await fetch(`http://127.0.0.1:${port}/scoring-config`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ parseWeight: 2 })
    });
    assert.equal(legacySaveResponse.status, 200);

    const preservedResponse = await fetch(`http://127.0.0.1:${port}/scoring-config`);
    const preservedConfig = await preservedResponse.json();
    assert.equal(preservedConfig.defaultThemePalette, 'shadow');
    assert.equal(preservedConfig.defaultThemeFont, 'scribe');

    const invalidSaveResponse = await fetch(`http://127.0.0.1:${port}/scoring-config`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ defaultThemePalette: 'not-a-palette', defaultThemeFont: 'not-a-font' })
    });
    assert.equal(invalidSaveResponse.status, 200);

    const normalizedResponse = await fetch(`http://127.0.0.1:${port}/scoring-config`);
    const normalizedConfig = await normalizedResponse.json();
    assert.equal(normalizedConfig.defaultThemePalette, 'azure');
    assert.equal(normalizedConfig.defaultThemeFont, 'system');
  } finally {
    await new Promise(resolve => server.close(resolve));
    db.close();
  }
});
