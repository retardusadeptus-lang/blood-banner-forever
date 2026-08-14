const { db, DB_PATH } = require('../config/db');
const { ensureDatabaseReady } = require('../config/database/schema');
const { getRoleBucketForSpec } = require('../discord/utils/raidSignupStore/db');

const SEED_PREFIX = 'Seed';
const DEMO_PREFIX = 'Demo';

function normalizeToken(value) {
  return String(value || '')
    .replace(/[^a-z0-9]/gi, '')
    .trim();
}

function makeDemoName(spec, index) {
  const classToken = normalizeToken(spec.class);
  const specToken = normalizeToken(spec.spec);
  return `${DEMO_PREFIX}${classToken}${specToken}${index}`;
}

function desiredRosterCountForSpec(spec) {
  const specName = String(spec.spec || '').toLowerCase();
  if (specName.includes('tank') || specName.includes('prot')) return 2;
  if (specName.includes('holy') || specName.includes('resto') || specName.includes('discipline')) return 2;
  return 1;
}

function buildBankSeedRows(playerIds) {
  const sampleItems = [
    { item_wowhead_id: 22522, item_name: 'Super Mana Potion', reason: 'Progression consumables' },
    { item_wowhead_id: 22832, item_name: 'Super Healing Potion', reason: 'Raid prep' },
    { item_wowhead_id: 21884, item_name: 'Primal Fire', reason: 'Crafting mats' },
    { item_wowhead_id: 22445, item_name: 'Arcane Dust', reason: 'Enchanting mats' },
    { item_wowhead_id: 23449, item_name: 'Khorium Bar', reason: 'Engineering project' },
    { item_wowhead_id: 22789, item_name: 'Terocone', reason: 'Flask crafting' },
    { item_wowhead_id: 30183, item_name: 'Nether Vortex', reason: 'Crafted gear' },
    { item_wowhead_id: 32428, item_name: 'Heart of Darkness', reason: 'BT resist gear' }
  ];

  return playerIds.slice(0, 8).map((playerId, index) => {
    const item = sampleItems[index % sampleItems.length];
    const statusCycle = ['pending', 'approved', 'denied', 'pending'];
    const status = statusCycle[index % statusCycle.length];
    return {
      player_id: playerId,
      item_wowhead_id: item.item_wowhead_id,
      item_name: item.item_name,
      quantity: (index % 3) + 1,
      reason: `${item.reason} [seed]`,
      status,
      price: status === 'approved' ? (25 * (index + 1)) : null,
      officer_note: status === 'denied' ? 'Saved for main raiders [seed]' : status === 'approved' ? 'Approved for testing [seed]' : '',
      approved_quantity: status === 'approved' ? Math.max(1, (index % 3) + 1) : null,
      request_group_id: index < 3 ? 'seed-basket-alpha' : (index < 6 ? 'seed-basket-beta' : null)
    };
  });
}

function seedDemoData() {
  ensureDatabaseReady(db);

  const specs = db.prepare('SELECT id, class, spec FROM specs ORDER BY class, spec').all();
  if (!specs.length) {
    throw new Error('No specs found. Seed specs first, then rerun this script.');
  }

  const deleteSeedGroupsByEvent = db.prepare(`
    DELETE FROM raid_signup_groups
    WHERE event_id IN (SELECT id FROM raid_signup_events WHERE title LIKE ?)
  `);
  const deleteSeedEntriesByEvent = db.prepare(`
    DELETE FROM raid_signup_entries
    WHERE event_id IN (SELECT id FROM raid_signup_events WHERE title LIKE ?)
  `);
  const deleteSeedDraftsByEvent = db.prepare(`
    DELETE FROM raid_signup_drafts
    WHERE event_id IN (SELECT id FROM raid_signup_events WHERE title LIKE ?)
  `);
  const deleteSeedEvents = db.prepare('DELETE FROM raid_signup_events WHERE title LIKE ?');
  const deleteSeedTemplates = db.prepare('DELETE FROM raid_signup_templates WHERE name LIKE ?');
  const deleteSeedRequests = db.prepare("DELETE FROM bank_requests WHERE reason LIKE '%[seed]%' OR officer_note LIKE '%[seed]%' OR request_group_id LIKE 'seed-%'");
  const deleteSeedRoster = db.prepare('DELETE FROM roster WHERE name LIKE ?');

  const existingRosterNames = new Set(
    db.prepare('SELECT name FROM roster').all().map((row) => String(row.name || '').toLowerCase())
  );
  const insertRoster = db.prepare('INSERT INTO roster (name, spec_id, in_raid) VALUES (?, ?, 1)');
  const insertTemplate = db.prepare(`
    INSERT INTO raid_signup_templates (name, description, starts_at_text, recurrence_rule, recurrence_days_json, recurrence_delay_hours, recurrence_enabled, allowed_spec_ids_json, is_active, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  const insertEvent = db.prepare(`
    INSERT INTO raid_signup_events (template_id, title, description, scheduled_for, recurrence_instance, public_groups, status, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, 'open', CURRENT_TIMESTAMP)
  `);
  const insertEntry = db.prepare(`
    INSERT INTO raid_signup_entries (event_id, discord_user_id, discord_username, status, spec_id, role_bucket, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  const insertGroup = db.prepare(`
    INSERT INTO raid_signup_groups (event_id, group_number, group_name, slot_index, player_name, spec_id, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertRequest = db.prepare(`
    INSERT INTO bank_requests (player_id, item_wowhead_id, item_name, quantity, reason, status, price, officer_note, approved_quantity, request_group_id, requester_name, requester_discord_user_id, requester_discord_username, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    const seedLike = `${SEED_PREFIX}%`;
    const demoLike = `${DEMO_PREFIX}%`;
    deleteSeedGroupsByEvent.run(seedLike);
    deleteSeedEntriesByEvent.run(seedLike);
    deleteSeedDraftsByEvent.run(seedLike);
    deleteSeedEvents.run(seedLike);
    deleteSeedTemplates.run(seedLike);
    deleteSeedRequests.run();
    deleteSeedRoster.run(demoLike);

    existingRosterNames.clear();
    db.prepare('SELECT name FROM roster').all().forEach((row) => existingRosterNames.add(String(row.name || '').toLowerCase()));

    const seededRoster = [];
    specs.forEach((spec) => {
      const count = desiredRosterCountForSpec(spec);
      for (let index = 1; index <= count; index += 1) {
        let candidate = makeDemoName(spec, index);
        let attempt = index;
        while (existingRosterNames.has(candidate.toLowerCase())) {
          attempt += 1;
          candidate = makeDemoName(spec, attempt);
        }
        const info = insertRoster.run(candidate, spec.id);
        existingRosterNames.add(candidate.toLowerCase());
        seededRoster.push({ id: Number(info.lastInsertRowid), name: candidate, spec_id: spec.id, class: spec.class, spec: spec.spec });
      }
    });

    const allowedSpecIds = specs.map((spec) => spec.id);
    const templateInfo = insertTemplate.run(
      `${SEED_PREFIX} Wed/Thu Progression`,
      'Seeded progression template for testing signups, groups, and echo flow.',
      'Wed 20:00',
      'weekly',
      JSON.stringify([3, 4]),
      2,
      1,
      JSON.stringify(allowedSpecIds),
      1
    );
    const templateId = Number(templateInfo.lastInsertRowid);

    const eventInfo = insertEvent.run(
      templateId,
      `${SEED_PREFIX} SSC/TK Full Clear`,
      'Seeded test event with 25 signups and assigned public groups.',
      '2026-08-13 20:00 CET',
      'seed-instance-001'
    );
    const eventId = Number(eventInfo.lastInsertRowid);
    const secondEventInfo = insertEvent.run(
      templateId,
      `${SEED_PREFIX} SSC/TK Full Clear Redux`,
      'Second seeded test event from the same template for switching between event views.',
      '2028-08-19 20:00 CET',
      'seed-instance-002'
    );
    const secondEventId = Number(secondEventInfo.lastInsertRowid);

    const signupPool = [];
    const preferredSpecs = [
      'Prot Warrior', 'Feral (Tank)', 'Holy Paladin', 'Resto Shaman', 'Resto Druid', 'Discipline Priest',
      'Combat Rogue', 'Assassination Rogue', 'Fury Warrior', 'Ret Paladin', 'Enhance Shaman', 'BM Hunter',
      'MM Hunter', 'Survival Hunter', 'Arcane Mage', 'Fire Mage', 'Frost Mage', 'Affliction Warlock',
      'Demo Warlock', 'Destro Warlock', 'Shadow Priest', 'Elemental Shaman', 'Balance Druid', 'Arms Warrior', 'Holy Priest'
    ];

    preferredSpecs.forEach((specName, index) => {
      const rosterEntry = seededRoster.find((entry) => entry.spec === specName);
      if (!rosterEntry) return;
      signupPool.push({
        discord_user_id: `seed-user-${String(index + 1).padStart(3, '0')}`,
        discord_username: rosterEntry.name,
        spec_id: rosterEntry.spec_id,
        role_bucket: getRoleBucketForSpec(specs.find((spec) => spec.id === rosterEntry.spec_id))
      });
    });

    signupPool.slice(0, 25).forEach((entry) => {
      insertEntry.run(eventId, entry.discord_user_id, entry.discord_username, 'signup', entry.spec_id, entry.role_bucket);
      insertEntry.run(secondEventId, `${entry.discord_user_id}-b`, entry.discord_username, 'signup', entry.spec_id, entry.role_bucket);
    });

    signupPool.slice(0, 25).forEach((entry, index) => {
      const groupNumber = Math.floor(index / 5) + 1;
      const slotIndex = (index % 5) + 1;
      const note = slotIndex === 1 ? 'Tank lead' : slotIndex === 2 ? 'Healer core' : '';
      insertGroup.run(eventId, groupNumber, `Seed Group ${groupNumber}`, slotIndex, entry.discord_username, entry.spec_id, note);
      insertGroup.run(secondEventId, groupNumber, `Seed Group ${groupNumber}`, slotIndex, entry.discord_username, entry.spec_id, note);
    });

    const bankSeedRows = buildBankSeedRows(seededRoster.map((entry) => entry.id));
    bankSeedRows.forEach((row, index) => {
      insertRequest.run(
        row.player_id,
        row.item_wowhead_id,
        row.item_name,
        row.quantity,
        row.reason,
        row.status,
        row.price,
        row.officer_note,
        row.approved_quantity,
        row.request_group_id,
        seededRoster[index]?.name || null,
        `seed-discord-${index + 1}`,
        `${seededRoster[index]?.name || 'DemoUser'}#${String(1000 + index)}`,
        row.status === 'pending' ? null : '2026-08-10 19:30:00'
      );
    });

    return {
      rosterInserted: seededRoster.length,
      templateInserted: 1,
      eventInserted: 2,
      signupsInserted: Math.min(25, signupPool.length) * 2,
      groupsInserted: Math.min(25, signupPool.length) * 2,
      bankRequestsInserted: bankSeedRows.length,
      eventId,
      secondEventId,
      templateId
    };
  });

  return tx();
}

function main() {
  try {
    const result = seedDemoData();
    console.log(`[seed-demo] DB: ${DB_PATH}`);
    console.log(`[seed-demo] roster inserted: ${result.rosterInserted}`);
    console.log(`[seed-demo] template inserted: ${result.templateInserted} (id ${result.templateId})`);
    console.log(`[seed-demo] event inserted: ${result.eventInserted} (id ${result.eventId})`);
    console.log(`[seed-demo] second event inserted: ${result.eventInserted} (id ${result.secondEventId})`);
    console.log(`[seed-demo] signups inserted: ${result.signupsInserted}`);
    console.log(`[seed-demo] groups inserted: ${result.groupsInserted}`);
    console.log(`[seed-demo] bank requests inserted: ${result.bankRequestsInserted}`);
  } catch (error) {
    console.error('[seed-demo] failed:', error.message || error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  seedDemoData
};