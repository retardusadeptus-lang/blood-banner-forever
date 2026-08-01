const TIER_TOKEN_SEED_ROWS = [
  { name: 'Helm of the Fallen Champion', phase: 'T4', zone: 'Karazhan', boss: 'Prince Malchezaar', tokenGroup: 'Fallen Champion', tokenSlot: 'head', classes: ['Paladin', 'Rogue', 'Shaman'] },
  { name: 'Gauntlets of the Fallen Champion', phase: 'T4', zone: 'Karazhan', boss: 'The Curator', tokenGroup: 'Fallen Champion', tokenSlot: 'hands', classes: ['Paladin', 'Rogue', 'Shaman'] },
  { name: 'Pauldrons of the Fallen Champion', phase: 'T4', zone: "Gruul's Lair", boss: 'High King Maulgar', tokenGroup: 'Fallen Champion', tokenSlot: 'shoulders', classes: ['Paladin', 'Rogue', 'Shaman'] },
  { name: 'Leggings of the Fallen Champion', phase: 'T4', zone: "Gruul's Lair", boss: 'Gruul the Dragonkiller', tokenGroup: 'Fallen Champion', tokenSlot: 'legs', classes: ['Paladin', 'Rogue', 'Shaman'] },
  { name: 'Chestguard of the Fallen Champion', phase: 'T4', zone: "Magtheridon's Lair", boss: 'Magtheridon', tokenGroup: 'Fallen Champion', tokenSlot: 'chest', classes: ['Paladin', 'Rogue', 'Shaman'] },

  { name: 'Helm of the Fallen Defender', phase: 'T4', zone: 'Karazhan', boss: 'Prince Malchezaar', tokenGroup: 'Fallen Defender', tokenSlot: 'head', classes: ['Druid', 'Priest', 'Warrior'] },
  { name: 'Gauntlets of the Fallen Defender', phase: 'T4', zone: 'Karazhan', boss: 'The Curator', tokenGroup: 'Fallen Defender', tokenSlot: 'hands', classes: ['Druid', 'Priest', 'Warrior'] },
  { name: 'Pauldrons of the Fallen Defender', phase: 'T4', zone: "Gruul's Lair", boss: 'High King Maulgar', tokenGroup: 'Fallen Defender', tokenSlot: 'shoulders', classes: ['Druid', 'Priest', 'Warrior'] },
  { name: 'Leggings of the Fallen Defender', phase: 'T4', zone: "Gruul's Lair", boss: 'Gruul the Dragonkiller', tokenGroup: 'Fallen Defender', tokenSlot: 'legs', classes: ['Druid', 'Priest', 'Warrior'] },
  { name: 'Chestguard of the Fallen Defender', phase: 'T4', zone: "Magtheridon's Lair", boss: 'Magtheridon', tokenGroup: 'Fallen Defender', tokenSlot: 'chest', classes: ['Druid', 'Priest', 'Warrior'] },

  { name: 'Helm of the Fallen Hero', phase: 'T4', zone: 'Karazhan', boss: 'Prince Malchezaar', tokenGroup: 'Fallen Hero', tokenSlot: 'head', classes: ['Hunter', 'Mage', 'Warlock'] },
  { name: 'Gauntlets of the Fallen Hero', phase: 'T4', zone: 'Karazhan', boss: 'The Curator', tokenGroup: 'Fallen Hero', tokenSlot: 'hands', classes: ['Hunter', 'Mage', 'Warlock'] },
  { name: 'Pauldrons of the Fallen Hero', phase: 'T4', zone: "Gruul's Lair", boss: 'High King Maulgar', tokenGroup: 'Fallen Hero', tokenSlot: 'shoulders', classes: ['Hunter', 'Mage', 'Warlock'] },
  { name: 'Leggings of the Fallen Hero', phase: 'T4', zone: "Gruul's Lair", boss: 'Gruul the Dragonkiller', tokenGroup: 'Fallen Hero', tokenSlot: 'legs', classes: ['Hunter', 'Mage', 'Warlock'] },
  { name: 'Chestguard of the Fallen Hero', phase: 'T4', zone: "Magtheridon's Lair", boss: 'Magtheridon', tokenGroup: 'Fallen Hero', tokenSlot: 'chest', classes: ['Hunter', 'Mage', 'Warlock'] },

  { name: 'Helm of the Vanquished Champion', phase: 'T5', zone: 'Serpentshrine Cavern', boss: 'Lady Vashj', tokenGroup: 'Vanquished Champion', tokenSlot: 'head', classes: ['Paladin', 'Rogue', 'Shaman'] },
  { name: 'Gloves of the Vanquished Champion', phase: 'T5', zone: 'Serpentshrine Cavern', boss: 'Leotheras the Blind', tokenGroup: 'Vanquished Champion', tokenSlot: 'hands', classes: ['Paladin', 'Rogue', 'Shaman'] },
  { name: 'Leggings of the Vanquished Champion', phase: 'T5', zone: 'Serpentshrine Cavern', boss: 'Fathom-Lord Karathress', tokenGroup: 'Vanquished Champion', tokenSlot: 'legs', classes: ['Paladin', 'Rogue', 'Shaman'] },
  { name: 'Pauldrons of the Vanquished Champion', phase: 'T5', zone: 'Tempest Keep: The Eye', boss: 'Void Reaver', tokenGroup: 'Vanquished Champion', tokenSlot: 'shoulders', classes: ['Paladin', 'Rogue', 'Shaman'] },
  { name: 'Chestguard of the Vanquished Champion', phase: 'T5', zone: 'Tempest Keep: The Eye', boss: "Kael'thas Sunstrider", tokenGroup: 'Vanquished Champion', tokenSlot: 'chest', classes: ['Paladin', 'Rogue', 'Shaman'] },

  { name: 'Helm of the Vanquished Defender', phase: 'T5', zone: 'Serpentshrine Cavern', boss: 'Lady Vashj', tokenGroup: 'Vanquished Defender', tokenSlot: 'head', classes: ['Druid', 'Priest', 'Warrior'] },
  { name: 'Gloves of the Vanquished Defender', phase: 'T5', zone: 'Serpentshrine Cavern', boss: 'Leotheras the Blind', tokenGroup: 'Vanquished Defender', tokenSlot: 'hands', classes: ['Druid', 'Priest', 'Warrior'] },
  { name: 'Leggings of the Vanquished Defender', phase: 'T5', zone: 'Serpentshrine Cavern', boss: 'Fathom-Lord Karathress', tokenGroup: 'Vanquished Defender', tokenSlot: 'legs', classes: ['Druid', 'Priest', 'Warrior'] },
  { name: 'Pauldrons of the Vanquished Defender', phase: 'T5', zone: 'Tempest Keep: The Eye', boss: 'Void Reaver', tokenGroup: 'Vanquished Defender', tokenSlot: 'shoulders', classes: ['Druid', 'Priest', 'Warrior'] },
  { name: 'Chestguard of the Vanquished Defender', phase: 'T5', zone: 'Tempest Keep: The Eye', boss: "Kael'thas Sunstrider", tokenGroup: 'Vanquished Defender', tokenSlot: 'chest', classes: ['Druid', 'Priest', 'Warrior'] },

  { name: 'Helm of the Vanquished Hero', phase: 'T5', zone: 'Serpentshrine Cavern', boss: 'Lady Vashj', tokenGroup: 'Vanquished Hero', tokenSlot: 'head', classes: ['Hunter', 'Mage', 'Warlock'] },
  { name: 'Gloves of the Vanquished Hero', phase: 'T5', zone: 'Serpentshrine Cavern', boss: 'Leotheras the Blind', tokenGroup: 'Vanquished Hero', tokenSlot: 'hands', classes: ['Hunter', 'Mage', 'Warlock'] },
  { name: 'Leggings of the Vanquished Hero', phase: 'T5', zone: 'Serpentshrine Cavern', boss: 'Fathom-Lord Karathress', tokenGroup: 'Vanquished Hero', tokenSlot: 'legs', classes: ['Hunter', 'Mage', 'Warlock'] },
  { name: 'Pauldrons of the Vanquished Hero', phase: 'T5', zone: 'Tempest Keep: The Eye', boss: 'Void Reaver', tokenGroup: 'Vanquished Hero', tokenSlot: 'shoulders', classes: ['Hunter', 'Mage', 'Warlock'] },
  { name: 'Chestguard of the Vanquished Hero', phase: 'T5', zone: 'Tempest Keep: The Eye', boss: "Kael'thas Sunstrider", tokenGroup: 'Vanquished Hero', tokenSlot: 'chest', classes: ['Hunter', 'Mage', 'Warlock'] },

  { name: 'Gloves of the Forgotten Conqueror', phase: 'T6', zone: 'Hyjal Summit', boss: 'Azgalor', tokenGroup: 'Forgotten Conqueror', tokenSlot: 'hands', classes: ['Paladin', 'Priest', 'Warlock'] },
  { name: 'Helm of the Forgotten Conqueror', phase: 'T6', zone: 'Hyjal Summit', boss: 'Archimonde', tokenGroup: 'Forgotten Conqueror', tokenSlot: 'head', classes: ['Paladin', 'Priest', 'Warlock'] },
  { name: 'Shoulderpads of the Forgotten Conqueror', phase: 'T6', zone: 'Black Temple', boss: 'Mother Shahraz', tokenGroup: 'Forgotten Conqueror', tokenSlot: 'shoulders', classes: ['Paladin', 'Priest', 'Warlock'] },
  { name: 'Leggings of the Forgotten Conqueror', phase: 'T6', zone: 'Black Temple', boss: 'Illidari Council', tokenGroup: 'Forgotten Conqueror', tokenSlot: 'legs', classes: ['Paladin', 'Priest', 'Warlock'] },
  { name: 'Chestguard of the Forgotten Conqueror', phase: 'T6', zone: 'Black Temple', boss: 'Illidan Stormrage', tokenGroup: 'Forgotten Conqueror', tokenSlot: 'chest', classes: ['Paladin', 'Priest', 'Warlock'] },

  { name: 'Gloves of the Forgotten Protector', phase: 'T6', zone: 'Hyjal Summit', boss: 'Azgalor', tokenGroup: 'Forgotten Protector', tokenSlot: 'hands', classes: ['Hunter', 'Shaman', 'Warrior'] },
  { name: 'Helm of the Forgotten Protector', phase: 'T6', zone: 'Hyjal Summit', boss: 'Archimonde', tokenGroup: 'Forgotten Protector', tokenSlot: 'head', classes: ['Hunter', 'Shaman', 'Warrior'] },
  { name: 'Shoulderpads of the Forgotten Protector', phase: 'T6', zone: 'Black Temple', boss: 'Mother Shahraz', tokenGroup: 'Forgotten Protector', tokenSlot: 'shoulders', classes: ['Hunter', 'Shaman', 'Warrior'] },
  { name: 'Leggings of the Forgotten Protector', phase: 'T6', zone: 'Black Temple', boss: 'Illidari Council', tokenGroup: 'Forgotten Protector', tokenSlot: 'legs', classes: ['Hunter', 'Shaman', 'Warrior'] },
  { name: 'Chestguard of the Forgotten Protector', phase: 'T6', zone: 'Black Temple', boss: 'Illidan Stormrage', tokenGroup: 'Forgotten Protector', tokenSlot: 'chest', classes: ['Hunter', 'Shaman', 'Warrior'] },

  { name: 'Gloves of the Forgotten Vanquisher', phase: 'T6', zone: 'Hyjal Summit', boss: 'Azgalor', tokenGroup: 'Forgotten Vanquisher', tokenSlot: 'hands', classes: ['Druid', 'Mage', 'Rogue'] },
  { name: 'Helm of the Forgotten Vanquisher', phase: 'T6', zone: 'Hyjal Summit', boss: 'Archimonde', tokenGroup: 'Forgotten Vanquisher', tokenSlot: 'head', classes: ['Druid', 'Mage', 'Rogue'] },
  { name: 'Shoulderpads of the Forgotten Vanquisher', phase: 'T6', zone: 'Black Temple', boss: 'Mother Shahraz', tokenGroup: 'Forgotten Vanquisher', tokenSlot: 'shoulders', classes: ['Druid', 'Mage', 'Rogue'] },
  { name: 'Leggings of the Forgotten Vanquisher', phase: 'T6', zone: 'Black Temple', boss: 'Illidari Council', tokenGroup: 'Forgotten Vanquisher', tokenSlot: 'legs', classes: ['Druid', 'Mage', 'Rogue'] },
  { name: 'Chestguard of the Forgotten Vanquisher', phase: 'T6', zone: 'Black Temple', boss: 'Illidan Stormrage', tokenGroup: 'Forgotten Vanquisher', tokenSlot: 'chest', classes: ['Druid', 'Mage', 'Rogue'] },

  { name: 'Bracers of the Forgotten Conqueror', phase: 'SWP', zone: 'Sunwell Plateau', boss: 'Kalecgos / Sathrovarr', tokenGroup: 'Forgotten Conqueror', tokenSlot: 'wrist', classes: ['Paladin', 'Priest', 'Warlock'] },
  { name: 'Belt of the Forgotten Conqueror', phase: 'SWP', zone: 'Sunwell Plateau', boss: 'Brutallus', tokenGroup: 'Forgotten Conqueror', tokenSlot: 'waist', classes: ['Paladin', 'Priest', 'Warlock'] },
  { name: 'Boots of the Forgotten Conqueror', phase: 'SWP', zone: 'Sunwell Plateau', boss: 'Felmyst', tokenGroup: 'Forgotten Conqueror', tokenSlot: 'feet', classes: ['Paladin', 'Priest', 'Warlock'] },

  { name: 'Bracers of the Forgotten Protector', phase: 'SWP', zone: 'Sunwell Plateau', boss: 'Kalecgos / Sathrovarr', tokenGroup: 'Forgotten Protector', tokenSlot: 'wrist', classes: ['Hunter', 'Shaman', 'Warrior'] },
  { name: 'Belt of the Forgotten Protector', phase: 'SWP', zone: 'Sunwell Plateau', boss: 'Brutallus', tokenGroup: 'Forgotten Protector', tokenSlot: 'waist', classes: ['Hunter', 'Shaman', 'Warrior'] },
  { name: 'Boots of the Forgotten Protector', phase: 'SWP', zone: 'Sunwell Plateau', boss: 'Felmyst', tokenGroup: 'Forgotten Protector', tokenSlot: 'feet', classes: ['Hunter', 'Shaman', 'Warrior'] },

  { name: 'Bracers of the Forgotten Vanquisher', phase: 'SWP', zone: 'Sunwell Plateau', boss: 'Kalecgos / Sathrovarr', tokenGroup: 'Forgotten Vanquisher', tokenSlot: 'wrist', classes: ['Druid', 'Mage', 'Rogue'] },
  { name: 'Belt of the Forgotten Vanquisher', phase: 'SWP', zone: 'Sunwell Plateau', boss: 'Brutallus', tokenGroup: 'Forgotten Vanquisher', tokenSlot: 'waist', classes: ['Druid', 'Mage', 'Rogue'] },
  { name: 'Boots of the Forgotten Vanquisher', phase: 'SWP', zone: 'Sunwell Plateau', boss: 'Felmyst', tokenGroup: 'Forgotten Vanquisher', tokenSlot: 'feet', classes: ['Druid', 'Mage', 'Rogue'] },

  { name: "Magtheridon's Head", phase: 'T4', zone: "Magtheridon's Lair", boss: 'Magtheridon', tokenGroup: 'Quest Token', tokenSlot: 'quest', classes: ['Druid', 'Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'], isQuest: 1 },
  { name: 'The Verdant Sphere', phase: 'T5', zone: 'Tempest Keep: The Eye', boss: "Kael'thas Sunstrider", tokenGroup: 'Quest Token', tokenSlot: 'quest', classes: ['Druid', 'Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'], isQuest: 1 }
];

const QUEST_TOKEN_REWARDS = {
  "Magtheridon's Head": [
    { name: 'Ring of the Recalcitrant' },
    { name: "A'dal's Signet of Defense" },
    { name: 'Band of the Arcane Alchemist' },
    { name: 'Signet of the Sun King' }
  ],
  'The Verdant Sphere': [
    { name: "Telonicus's Pendant of Mayhem" },
    { name: "The Darkener's Grasp" },
    { name: "The Sun King's Talisman" },
    { name: "Lord Sanguinar's Claim" }
  ]
};

function normalizePhaseForDb(phase) {
  const value = String(phase || '').toLowerCase();
  if (value === 't4') return 't4';
  if (value === 't5') return 't5';
  if (value === 't6') return 't6';
  if (value === 'swp') return 'swp';
  return value;
}

function ensureBattleNetAuthSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      battletag TEXT NOT NULL UNIQUE,
      blizzard_id TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS roster_claim_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      roster_id INTEGER NOT NULL,
      roster_name TEXT NOT NULL,
      user_id INTEGER,
      battletag TEXT,
      actor_type TEXT NOT NULL,
      actor_user_id INTEGER,
      actor_label TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const rosterColumns = db.prepare('PRAGMA table_info(roster)').all();
  const hasUserId = rosterColumns.some(column => column.name === 'user_id');
  if (!hasUserId) {
    db.exec('ALTER TABLE roster ADD COLUMN user_id INTEGER');
  }
}

function ensureTierTokenSupport(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS tier_token_metadata (
      token_item_id INTEGER PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
      token_group TEXT NOT NULL,
      token_slot TEXT NOT NULL,
      phase_key TEXT NOT NULL,
      classes_json TEXT NOT NULL,
      is_quest INTEGER DEFAULT 0
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS tier_token_reward_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      reward_name TEXT NOT NULL,
      reward_wowhead_id INTEGER
    )
  `).run();

  const insertItem = db.prepare(`
    INSERT INTO items (name, slot, phase, source, source_type)
    VALUES (?, ?, ?, ?, ?)
  `);
  const findItemByName = db.prepare('SELECT id FROM items WHERE lower(name) = lower(?) LIMIT 1');

  const upsertTokenMeta = db.prepare(`
    INSERT INTO tier_token_metadata (token_item_id, token_group, token_slot, phase_key, classes_json, is_quest)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(token_item_id)
    DO UPDATE SET
      token_group = excluded.token_group,
      token_slot = excluded.token_slot,
      phase_key = excluded.phase_key,
      classes_json = excluded.classes_json,
      is_quest = excluded.is_quest
  `);

  const deleteRewardsByToken = db.prepare('DELETE FROM tier_token_reward_items WHERE token_item_id = ?');
  const insertReward = db.prepare('INSERT INTO tier_token_reward_items (token_item_id, reward_name, reward_wowhead_id) VALUES (?, ?, ?)');

  const seedAll = db.transaction(() => {
    for (const token of TIER_TOKEN_SEED_ROWS) {
      let item = findItemByName.get(token.name);
      if (!item) {
        const info = insertItem.run(token.name, 'Token', token.phase, token.zone, token.boss);
        item = { id: info.lastInsertRowid };
      }

      upsertTokenMeta.run(
        item.id,
        token.tokenGroup,
        token.tokenSlot,
        normalizePhaseForDb(token.phase),
        JSON.stringify(token.classes || []),
        token.isQuest ? 1 : 0
      );

      const rewards = QUEST_TOKEN_REWARDS[token.name];
      if (rewards && rewards.length) {
        deleteRewardsByToken.run(item.id);
        rewards.forEach(reward => insertReward.run(item.id, reward.name, reward.wowhead_id || null));
      }
    }
  });

  seedAll();
}

function ensureNormalizedOperationalTables(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS bis_priority_entries (
      phase TEXT NOT NULL,
      item_name TEXT NOT NULL,
      spec_name TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (phase, item_name, spec_name)
    )
  `).run();

  db.prepare('CREATE INDEX IF NOT EXISTS idx_bis_priority_entries_phase_item ON bis_priority_entries (phase, item_name)').run();
  db.prepare('CREATE INDEX IF NOT EXISTS idx_bis_priority_entries_phase_spec ON bis_priority_entries (phase, spec_name)').run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS scoring_config_values (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      parse_weight REAL NOT NULL DEFAULT 1,
      support_multi REAL NOT NULL DEFAULT 1.5,
      cons_bonus REAL NOT NULL DEFAULT 10,
      enchant_bonus REAL NOT NULL DEFAULT 10,
      gem_bonus REAL NOT NULL DEFAULT 10,
      att_weight REAL NOT NULL DEFAULT 0.5,
      afk_penalty REAL NOT NULL DEFAULT 5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS raid_assignment_config_bosses (
      boss_name TEXT PRIMARY KEY,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const bisCount = db.prepare('SELECT COUNT(*) as count FROM bis_priority_entries').get().count;
  if (bisCount === 0) {
    const legacyRows = db.prepare('SELECT phase, data FROM bis_priorities').all();
    const insertEntry = db.prepare('INSERT OR REPLACE INTO bis_priority_entries (phase, item_name, spec_name, status) VALUES (?, ?, ?, ?)');
    const migrateBis = db.transaction(() => {
      legacyRows.forEach(row => {
        let parsed = {};
        try {
          parsed = JSON.parse(row.data || '{}');
        } catch (e) {
          parsed = {};
        }

        Object.entries(parsed).forEach(([itemKey, status]) => {
          const splitIndex = itemKey.lastIndexOf('|');
          if (splitIndex === -1) return;
          const itemName = itemKey.slice(0, splitIndex);
          const specName = itemKey.slice(splitIndex + 1);
          insertEntry.run(row.phase, itemName, specName, status);
        });
      });
    });
    migrateBis();
  }

  const scoringCount = db.prepare('SELECT COUNT(*) as count FROM scoring_config_values').get().count;
  if (scoringCount === 0) {
    let legacyConfig = {};
    const legacyRow = db.prepare('SELECT data FROM scoring_config WHERE id = 1').get();
    if (legacyRow) {
      try {
        legacyConfig = JSON.parse(legacyRow.data || '{}');
      } catch (e) {
        legacyConfig = {};
      }
    }

    const defaults = {
      parseWeight: legacyConfig.parseWeight ?? 1,
      supportMulti: legacyConfig.supportMulti ?? 1.5,
      consBonus: legacyConfig.consBonus ?? 10,
      enchantBonus: legacyConfig.enchantBonus ?? 10,
      gemBonus: legacyConfig.gemBonus ?? 10,
      attWeight: legacyConfig.attWeight ?? 0.5,
      afkPenalty: legacyConfig.afkPenalty ?? 5
    };

    db.prepare(`
      INSERT INTO scoring_config_values (id, parse_weight, support_multi, cons_bonus, enchant_bonus, gem_bonus, att_weight, afk_penalty)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      defaults.parseWeight,
      defaults.supportMulti,
      defaults.consBonus,
      defaults.enchantBonus,
      defaults.gemBonus,
      defaults.attWeight,
      defaults.afkPenalty
    );
  }

  const bossCount = db.prepare('SELECT COUNT(*) as count FROM raid_assignment_config_bosses').get().count;
  if (bossCount === 0) {
    const legacyRow = db.prepare('SELECT enabled_bosses FROM raid_assignment_config ORDER BY id LIMIT 1').get();
    let enabledBosses = [];
    if (legacyRow) {
      try {
        enabledBosses = JSON.parse(legacyRow.enabled_bosses || '[]');
      } catch (e) {
        enabledBosses = [];
      }
    }

    const insertBoss = db.prepare('INSERT OR REPLACE INTO raid_assignment_config_bosses (boss_name, enabled) VALUES (?, ?)');
    const migrateBosses = db.transaction(() => {
      enabledBosses.forEach(bossName => insertBoss.run(bossName, 1));
    });
    migrateBosses();
  }
}

function ensureBankRequestSchema(db) {
  const columns = db.prepare("PRAGMA table_info('bank_requests')").all();
  const hasGroupId = columns.some(col => col.name === 'request_group_id');
  if (!hasGroupId) {
    db.prepare('ALTER TABLE bank_requests ADD COLUMN request_group_id TEXT').run();
  }

  const hasRequesterName = columns.some(col => col.name === 'requester_name');
  if (!hasRequesterName) {
    db.prepare('ALTER TABLE bank_requests ADD COLUMN requester_name TEXT').run();
  }

  const hasRequesterDiscordUserId = columns.some(col => col.name === 'requester_discord_user_id');
  if (!hasRequesterDiscordUserId) {
    db.prepare('ALTER TABLE bank_requests ADD COLUMN requester_discord_user_id TEXT').run();
  }

  const hasRequesterDiscordUsername = columns.some(col => col.name === 'requester_discord_username');
  if (!hasRequesterDiscordUsername) {
    db.prepare('ALTER TABLE bank_requests ADD COLUMN requester_discord_username TEXT').run();
  }
}

function ensureOfficerRolesTable(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS officer_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_name TEXT UNIQUE NOT NULL,
      primary_officer_id INTEGER,
      backup_officer_ids_json TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

function ensureDiscordBotConfigTable(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS discord_bot_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      request_roles_json TEXT NOT NULL DEFAULT '[]',
      signup_roles_json TEXT NOT NULL DEFAULT '[]',
      bench_roles_json TEXT NOT NULL DEFAULT '[]',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const row = db.prepare('SELECT id FROM discord_bot_config WHERE id = 1').get();
  if (!row) {
    db.prepare(`
      INSERT INTO discord_bot_config (id, request_roles_json, signup_roles_json, bench_roles_json)
      VALUES (1, '[]', '[]', '[]')
    `).run();
  }
}

function ensureRaidSignupTables(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS raid_signup_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      starts_at_text TEXT DEFAULT '',
      recurrence_rule TEXT DEFAULT '',
      recurrence_days_json TEXT NOT NULL DEFAULT '[]',
      recurrence_delay_hours INTEGER NOT NULL DEFAULT 2,
      recurrence_enabled INTEGER NOT NULL DEFAULT 0,
      allowed_spec_ids_json TEXT NOT NULL DEFAULT '[]',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS raid_signup_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER REFERENCES raid_signup_templates(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      scheduled_for TEXT,
      recurrence_instance TEXT,
      public_groups INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'open',
      discord_channel_id TEXT,
      discord_message_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS raid_signup_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES raid_signup_events(id) ON DELETE CASCADE,
      discord_user_id TEXT NOT NULL,
      discord_username TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'signup',
      spec_id INTEGER REFERENCES specs(id) ON DELETE SET NULL,
      role_bucket TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, discord_user_id)
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS raid_signup_drafts (
      event_id INTEGER NOT NULL REFERENCES raid_signup_events(id) ON DELETE CASCADE,
      discord_user_id TEXT NOT NULL,
      spec_id INTEGER NOT NULL REFERENCES specs(id) ON DELETE CASCADE,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(event_id, discord_user_id)
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS raid_signup_user_prefs (
      discord_user_id TEXT PRIMARY KEY,
      spec_id INTEGER NOT NULL REFERENCES specs(id) ON DELETE CASCADE,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS raid_signup_event_filters (
      event_id INTEGER PRIMARY KEY REFERENCES raid_signup_events(id) ON DELETE CASCADE,
      selected_class TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS raid_signup_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES raid_signup_groups(id) ON DELETE CASCADE,
      group_number INTEGER NOT NULL,
      group_name TEXT DEFAULT '',
      slot_index INTEGER NOT NULL,
      player_name TEXT NOT NULL,
      spec_id INTEGER REFERENCES specs(id) ON DELETE SET NULL,
      note TEXT DEFAULT '',
      UNIQUE(event_id, group_number, slot_index)
    )
  `).run();

  const eventColumns = db.prepare("PRAGMA table_info('raid_signup_events')").all();
  if (!eventColumns.some(col => col.name === 'public_groups')) {
    db.prepare('ALTER TABLE raid_signup_events ADD COLUMN public_groups INTEGER NOT NULL DEFAULT 0').run();
  }

  const groupColumns = db.prepare("PRAGMA table_info('raid_signup_groups')").all();
  if (!groupColumns.some(col => col.name === 'group_name')) {
    db.prepare('ALTER TABLE raid_signup_groups ADD COLUMN group_name TEXT DEFAULT ""').run();
  }

  const templateColumns = db.prepare("PRAGMA table_info('raid_signup_templates')").all();
  if (!templateColumns.some(col => col.name === 'recurrence_days_json')) {
    db.prepare("ALTER TABLE raid_signup_templates ADD COLUMN recurrence_days_json TEXT NOT NULL DEFAULT '[]'").run();
  }
  if (!templateColumns.some(col => col.name === 'recurrence_delay_hours')) {
    db.prepare('ALTER TABLE raid_signup_templates ADD COLUMN recurrence_delay_hours INTEGER NOT NULL DEFAULT 2').run();
  }
  if (!templateColumns.some(col => col.name === 'recurrence_enabled')) {
    db.prepare('ALTER TABLE raid_signup_templates ADD COLUMN recurrence_enabled INTEGER NOT NULL DEFAULT 0').run();
  }
}

function ensureDatabaseIndexes(db) {
  const statements = [
    'CREATE INDEX IF NOT EXISTS idx_assignments_phase_item ON assignments (phase, item_name)',
    'CREATE INDEX IF NOT EXISTS idx_assignments_phase_player ON assignments (phase, player_id)',
    'CREATE INDEX IF NOT EXISTS idx_player_parses_player_boss ON player_parses (player_id, boss_name)',
    'CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON player_stats (player_id)',
    'CREATE INDEX IF NOT EXISTS idx_raid_logs_date ON raid_logs (raid_date)',
    'CREATE INDEX IF NOT EXISTS idx_roster_spec_id ON roster (spec_id)',
    'CREATE INDEX IF NOT EXISTS idx_items_name ON items (name)',
    'CREATE INDEX IF NOT EXISTS idx_items_slot_phase ON items (slot, phase)',
    'CREATE INDEX IF NOT EXISTS idx_items_source ON items (source, source_type)',
    'CREATE INDEX IF NOT EXISTS idx_items_bis_item_spec ON items_bis (item_id, spec_id)',
    'CREATE INDEX IF NOT EXISTS idx_bank_items_category_name ON bank_items (category, name)',
    'CREATE INDEX IF NOT EXISTS idx_bank_requests_status_created ON bank_requests (status, created_at)',
    'CREATE INDEX IF NOT EXISTS idx_bank_requests_group_id ON bank_requests (request_group_id)',
    'CREATE INDEX IF NOT EXISTS idx_raid_assignment_images_boss_created ON raid_assignment_images (boss_name, created_at)'
  ];

  statements.forEach(sql => db.prepare(sql).run());
}

function ensureDatabaseReady(db) {
  ensureBattleNetAuthSchema(db);
  ensureTierTokenSupport(db);
  ensureNormalizedOperationalTables(db);
  ensureBankRequestSchema(db);
  ensureOfficerRolesTable(db);
  ensureDiscordBotConfigTable(db);
  ensureRaidSignupTables(db);
  ensureDatabaseIndexes(db);
}

module.exports = {
  ensureDatabaseReady
};
