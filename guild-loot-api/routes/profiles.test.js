const test = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const express = require('express');
const { createBattleNetSession } = require('../middleware/auth');
const { ensureDatabaseReady } = require('../config/database/schema');
const buildProfilesRoutes = require('./profiles');

function createDb() {
  const db = new Database(':memory:');
  ensureDatabaseReady(db);
  db.prepare('INSERT INTO users (id, battletag, blizzard_id) VALUES (?, ?, ?)').run(42, 'Owner#1234', 'owner');
  db.prepare('INSERT INTO users (id, battletag, blizzard_id) VALUES (?, ?, ?)').run(99, 'Other#5678', 'other');
  return db;
}

function profilePayload(characterName, visibility) {
  return {
    characterName,
    realm: 'Azeroth',
    className: 'Mage',
    spec: 'Fire',
    visibility
  };
}

test('profiles return public entries to everyone and private entries only to their owner', async () => {
  const db = createDb();
  const app = express();
  app.use(express.json());
  app.use('/api', buildProfilesRoutes({ db }));
  const server = app.listen(0);

  try {
    const port = server.address().port;
    const { token: ownerToken } = createBattleNetSession({ userId: 42, battletag: 'Owner#1234' });
    const { token: otherToken } = createBattleNetSession({ userId: 99, battletag: 'Other#5678' });
    const url = `http://127.0.0.1:${port}/api/profiles`;

    const privateProfile = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `wow_loot_bnet_sid=${ownerToken}`
      },
      body: JSON.stringify(profilePayload('Private Mage', 'private'))
    });
    assert.equal(privateProfile.status, 201);
    assert.equal((await privateProfile.json()).visibility, 'private');

    const publicProfile = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `wow_loot_bnet_sid=${ownerToken}`
      },
      body: JSON.stringify(profilePayload('Public Mage', 'public'))
    });
    assert.equal(publicProfile.status, 201);

    const anonymousProfiles = await (await fetch(url)).json();
    assert.deepEqual(anonymousProfiles.map(profile => profile.characterName), ['Public Mage']);

    const otherProfiles = await (await fetch(url, {
      headers: { Cookie: `wow_loot_bnet_sid=${otherToken}` }
    })).json();
    assert.deepEqual(otherProfiles.map(profile => profile.characterName), ['Public Mage']);

    const ownerProfiles = await (await fetch(url, {
      headers: { Cookie: `wow_loot_bnet_sid=${ownerToken}` }
    })).json();
    assert.deepEqual(ownerProfiles.map(profile => profile.characterName), ['Public Mage', 'Private Mage']);
    assert.equal(ownerProfiles.find(profile => profile.characterName === 'Private Mage').isOwner, true);
  } finally {
    await new Promise(resolve => server.close(resolve));
    db.close();
  }
});

test('profile updates preserve visibility when older clients omit the field', async () => {
  const db = createDb();
  const app = express();
  app.use(express.json());
  app.use('/api', buildProfilesRoutes({ db }));
  const server = app.listen(0);

  try {
    const port = server.address().port;
    const { token } = createBattleNetSession({ userId: 42, battletag: 'Owner#1234' });
    const url = `http://127.0.0.1:${port}/api/profiles`;
    const created = await (await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `wow_loot_bnet_sid=${token}`
      },
      body: JSON.stringify(profilePayload('Private Mage', 'private'))
    })).json();

    const updated = await fetch(`${url}/${created.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `wow_loot_bnet_sid=${token}`
      },
      body: JSON.stringify({ ...profilePayload('Renamed Mage'), characterName: 'Renamed Mage' })
    });

    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).visibility, 'private');
  } finally {
    await new Promise(resolve => server.close(resolve));
    db.close();
  }
});
