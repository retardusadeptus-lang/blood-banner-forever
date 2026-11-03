const SPEC_SEED_ROWS = [
  [1, 'Druid', 'Balance Druid', 'balance-druid', '#FF7D0A', 'spell_nature_starfall'],
  [2, 'Druid', 'Feral (DPS)', 'feral-dps-druid', '#FF7D0A', 'ability_druid_catform'],
  [3, 'Druid', 'Feral (Tank)', 'feral-tank-druid', '#FF7D0A', 'ability_racial_bearform'],
  [4, 'Druid', 'Resto Druid', 'restoration-druid', '#FF7D0A', 'spell_nature_healingtouch'],
  [5, 'Hunter', 'BM Hunter', 'BM-hunter', '#ABD473', 'ability_hunter_beasttaming'],
  [6, 'Hunter', 'MM Hunter', 'marksmanship-hunter', '#ABD473', 'ability_marksmanship'],
  [7, 'Hunter', 'Survival Hunter', 'survival-hunter', '#ABD473', 'ability_hunter_swiftstrike'],
  [8, 'Mage', 'Arcane Mage', 'arcane-mage', '#69CCF0', 'spell_holy_magicalsentry'],
  [9, 'Mage', 'Fire Mage', 'fire-mage', '#69CCF0', 'spell_fire_firebolt02'],
  [10, 'Mage', 'Frost Mage', 'frost-mage', '#69CCF0', 'spell_frost_frostbolt02'],
  [11, 'Paladin', 'Holy Paladin', 'holy-paladin', '#F58CBA', 'spell_holy_holybolt'],
  [12, 'Paladin', 'Prot Paladin', 'prot-paladin', '#F58CBA', 'spell_holy_devotionaura'],
  [13, 'Paladin', 'Ret Paladin', 'retribution-paladin', '#F58CBA', 'spell_holy_auraoflight'],
  [14, 'Priest', 'Discipline Priest', 'discipline-priest', '#FFFFFF', 'spell_holy_wordfortitude'],
  [15, 'Priest', 'Holy Priest', 'holy-priest', '#FFFFFF', 'spell_holy_guardianspirit'],
  [16, 'Priest', 'Shadow Priest', 'shadow-priest', '#FFFFFF', 'spell_shadow_shadowwordpain'],
  [17, 'Rogue', 'Combat Rogue', 'combat-rogue', '#FFF569', 'ability_backstab'],
  [18, 'Rogue', 'Assassination Rogue', 'assassination-rogue', '#FFF569', 'ability_rogue_eviscerate'],
  [19, 'Rogue', 'Subtlety Rogue', 'subtlety-rogue', '#FFF569', 'ability_stealth'],
  [20, 'Shaman', 'Elemental Shaman', 'elemental-shaman', '#0070DE', 'spell_nature_lightning'],
  [21, 'Shaman', 'Enhance Shaman', 'enhancement-shaman', '#0070DE', 'spell_nature_lightningshield'],
  [22, 'Shaman', 'Resto Shaman', 'restoration-shaman', '#0070DE', 'spell_nature_magicimmunity'],
  [23, 'Warlock', 'Affliction Warlock', 'affliction-warlock', '#8788EE', 'spell_shadow_deathcoil'],
  [24, 'Warlock', 'Demo Warlock', 'demonology-warlock', '#8788EE', 'spell_shadow_metamorphosis'],
  [25, 'Warlock', 'Destro Warlock', 'destruction-warlock', '#8788EE', 'spell_shadow_rainoffire'],
  [26, 'Warrior', 'Arms Warrior', 'arms-warrior', '#C79C6E', 'ability_warrior_savageblow'],
  [27, 'Warrior', 'Fury Warrior', 'fury-warrior', '#C79C6E', 'ability_warrior_innerrage'],
  [28, 'Warrior', 'Prot Warrior', 'prot-warrior', '#C79C6E', 'inv_shield_06']
];

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

function waitForBusyRetry(delayMs) {
  if (delayMs <= 0) return;
  const buffer = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(buffer, 0, 0, delayMs);
}

function runWithBusyRetries(operation, { retries = 5, initialDelayMs = 250 } = {}) {
  let lastError;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return operation();
    } catch (error) {
      const isBusy = error?.code === 'SQLITE_BUSY' || error?.code === 'SQLITE_LOCKED';
      if (!isBusy || attempt === retries - 1) {
        throw error;
      }

      lastError = error;
      const delayMs = initialDelayMs * (attempt + 1);
      console.warn(`[DB] SQLite busy, retrying schema init in ${delayMs}ms (attempt ${attempt + 1}/${retries})`);
      waitForBusyRetry(delayMs);
    }
  }

  throw lastError;
}

function ensureCoreSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS specs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class VARCHAR(100) NOT NULL,
      spec VARCHAR(100) NOT NULL,
      slug TEXT DEFAULT '',
      color TEXT DEFAULT '#e2e8f0',
      icon_small TEXT DEFAULT '',
      icon_medium TEXT DEFAULT '',
      icon_large TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS items (
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

    CREATE TABLE IF NOT EXISTS items_bis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL REFERENCES items(id),
      spec_id INTEGER NOT NULL REFERENCES specs(id),
      preraid_bis INTEGER DEFAULT 0,
      t4_bis INTEGER DEFAULT 0,
      t5_bis INTEGER DEFAULT 0,
      t6_bis INTEGER DEFAULT 0,
      za_bis INTEGER DEFAULT 0,
      swp_bis INTEGER DEFAULT 0,
      preraid_opt INTEGER DEFAULT 0,
      t4_opt INTEGER DEFAULT 0,
      t5_opt INTEGER DEFAULT 0,
      t6_opt INTEGER DEFAULT 0,
      za_opt INTEGER DEFAULT 0,
      swp_opt INTEGER DEFAULT 0,
      ongoing_bis INTEGER DEFAULT 0,
      ongoing_opt INTEGER DEFAULT 0
    );
  `);

  const itemsBisColumns = db.prepare("PRAGMA table_info('items_bis')").all().map(column => column.name);
  if (!itemsBisColumns.includes('ongoing_bis')) {
    db.exec('ALTER TABLE items_bis ADD COLUMN ongoing_bis INTEGER DEFAULT 0');
  }
  if (!itemsBisColumns.includes('ongoing_opt')) {
    db.exec('ALTER TABLE items_bis ADD COLUMN ongoing_opt INTEGER DEFAULT 0');
  }
}

function ensureSpecsSeeded(db) {
  const upsertSpec = db.prepare(`
    INSERT INTO specs (id, class, spec, slug, color, icon_small, icon_medium, icon_large)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      class = excluded.class,
      spec = excluded.spec,
      slug = excluded.slug,
      color = excluded.color,
      icon_small = excluded.icon_small,
      icon_medium = excluded.icon_medium,
      icon_large = excluded.icon_large
  `);

  const seedSpecs = db.transaction(() => {
    SPEC_SEED_ROWS.forEach(([id, className, specName, slug, color, icon]) => {
      upsertSpec.run(
        id,
        className,
        specName,
        slug,
        color,
        `https://wow.zamimg.com/images/wow/icons/small/${icon}.jpg`,
        `https://wow.zamimg.com/images/wow/icons/medium/${icon}.jpg`,
        `https://wow.zamimg.com/images/wow/icons/large/${icon}.jpg`
      );
    });
  });

  seedSpecs();
}

function ensureBattleNetAuthSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      battletag TEXT NOT NULL UNIQUE,
      blizzard_id TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS character_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      character_name TEXT NOT NULL,
      realm TEXT DEFAULT '',
      race TEXT DEFAULT '',
      class_name TEXT DEFAULT '',
      spec TEXT DEFAULT '',
      subclass TEXT DEFAULT '',
      level INTEGER,
      role TEXT DEFAULT '',
      professions TEXT DEFAULT '',
      pronouns TEXT DEFAULT '',
      personality TEXT DEFAULT '',
      rp_hooks TEXT DEFAULT '',
      backstory TEXT DEFAULT '',
      avatar_data TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
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

  const profileColumns = db.prepare("PRAGMA table_info('character_profiles')").all().map(column => column.name);
  if (!profileColumns.includes('pronouns')) {
    db.exec("ALTER TABLE character_profiles ADD COLUMN pronouns TEXT DEFAULT ''");
  }
  if (!profileColumns.includes('rp_hooks')) {
    db.exec("ALTER TABLE character_profiles ADD COLUMN rp_hooks TEXT DEFAULT ''");
  }
  if (!profileColumns.includes('subclass')) {
    db.exec("ALTER TABLE character_profiles ADD COLUMN subclass TEXT DEFAULT ''");
  }

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
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const bossConfigColumns = db.prepare("PRAGMA table_info('raid_assignment_config_bosses')").all();
  let addedBossSortOrder = false;
  if (!bossConfigColumns.some(column => column.name === 'sort_order')) {
    db.prepare('ALTER TABLE raid_assignment_config_bosses ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0').run();
    addedBossSortOrder = true;
  }
  const bossSortOrderState = db.prepare('SELECT COUNT(*) as count, MAX(sort_order) as max_order FROM raid_assignment_config_bosses').get();
  if (addedBossSortOrder || (bossSortOrderState.count > 1 && bossSortOrderState.max_order === 0)) {
    db.prepare(`
      UPDATE raid_assignment_config_bosses
      SET sort_order = (
        SELECT COUNT(*)
        FROM raid_assignment_config_bosses AS earlier
        WHERE earlier.rowid < raid_assignment_config_bosses.rowid
      )
    `).run();
  }

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

    const insertBoss = db.prepare('INSERT OR REPLACE INTO raid_assignment_config_bosses (boss_name, enabled, sort_order) VALUES (?, ?, ?)');
    const migrateBosses = db.transaction(() => {
      enabledBosses.forEach((bossName, index) => insertBoss.run(bossName, 1, index));
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

function ensureBattleNetUserRolesTable(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS bnet_user_roles (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('officer', 'admin')),
      granted_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

function ensureWeakAurasTable(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS weakauras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      import_code TEXT,
      wago_url TEXT,
      access_password TEXT,
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

function ensureTacticsTable(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS raid_tactics (
      boss_name TEXT PRIMARY KEY,
      notes TEXT NOT NULL DEFAULT '',
      media_json TEXT NOT NULL DEFAULT '[]',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

function ensureWipefestTable(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS wipefest (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      raid_date TEXT,
      title TEXT NOT NULL,
      logs_url TEXT,
      wipefest_url TEXT,
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare('CREATE INDEX IF NOT EXISTS idx_wipefest_raid_date ON wipefest (raid_date DESC)').run();
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

function ensureRecruitmentPlanningTable(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS recruitment_planning (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data_json TEXT NOT NULL DEFAULT '{}',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const row = db.prepare('SELECT id FROM recruitment_planning WHERE id = 1').get();
  if (!row) {
    db.prepare(`
      INSERT INTO recruitment_planning (id, data_json)
      VALUES (1, '{"groups":[]}')
    `).run();
  }
}

function ensureRecruitmentApplicationsTables(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS recruitment_applications_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      blurb TEXT NOT NULL DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const configRow = db.prepare('SELECT id FROM recruitment_applications_config WHERE id = 1').get();
  if (!configRow) {
    db.prepare(`
      INSERT INTO recruitment_applications_config (id, blurb)
      VALUES (1, 'We are looking for players who are engaged, reliable, and ready to bring a good attitude to the raid. Tell us about your experience, your goals, and the kind of raid environment you are looking for.')
    `).run();
  }

  db.prepare(`
    CREATE TABLE IF NOT EXISTS recruitment_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      battletag TEXT NOT NULL,
      class_name TEXT NOT NULL,
      spec TEXT NOT NULL,
      name TEXT NOT NULL,
      about_me TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

function ensureRaidSignupTables(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS raid_signup_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      group_size INTEGER NOT NULL DEFAULT 25,
      timezone_text TEXT NOT NULL DEFAULT 'Europe/Paris',
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
      class_name TEXT NOT NULL DEFAULT '',
      character_name TEXT NOT NULL DEFAULT '',
      spec_id INTEGER REFERENCES specs(id) ON DELETE CASCADE,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  let userPrefColumns = db.prepare("PRAGMA table_info('raid_signup_user_prefs')").all();
  if (!userPrefColumns.some(col => col.name === 'class_name')) {
    db.exec("ALTER TABLE raid_signup_user_prefs ADD COLUMN class_name TEXT DEFAULT ''");
  }
  if (!userPrefColumns.some(col => col.name === 'character_name')) {
    db.exec("ALTER TABLE raid_signup_user_prefs ADD COLUMN character_name TEXT DEFAULT ''");
  }

  userPrefColumns = db.prepare("PRAGMA table_info('raid_signup_user_prefs')").all();
  const specIdColumn = userPrefColumns.find(col => col.name === 'spec_id');
  if (specIdColumn?.notnull) {
    db.transaction(() => {
      db.exec(`
        CREATE TABLE raid_signup_user_prefs_new (
          discord_user_id TEXT PRIMARY KEY,
          class_name TEXT NOT NULL DEFAULT '',
          character_name TEXT NOT NULL DEFAULT '',
          spec_id INTEGER REFERENCES specs(id) ON DELETE CASCADE,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        INSERT INTO raid_signup_user_prefs_new (
          discord_user_id, class_name, character_name, spec_id, updated_at
        )
        SELECT
          discord_user_id,
          COALESCE(class_name, ''),
          COALESCE(character_name, ''),
          spec_id,
          updated_at
        FROM raid_signup_user_prefs;

        DROP TABLE raid_signup_user_prefs;
        ALTER TABLE raid_signup_user_prefs_new RENAME TO raid_signup_user_prefs;
      `);
    })();
  }

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

  const groupForeignKeys = db.prepare("PRAGMA foreign_key_list('raid_signup_groups')").all();
  const hasLegacySelfReference = groupForeignKeys.some(fk =>
    String(fk.from || '').toLowerCase() === 'event_id' && String(fk.table || '').toLowerCase() === 'raid_signup_groups'
  );

  if (hasLegacySelfReference) {
    db.pragma('foreign_keys = OFF');
    try {
      const rebuildGroups = db.transaction(() => {
      db.prepare(`
        CREATE TABLE IF NOT EXISTS raid_signup_groups_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_id INTEGER NOT NULL REFERENCES raid_signup_events(id) ON DELETE CASCADE,
          group_number INTEGER NOT NULL,
          group_name TEXT DEFAULT '',
          slot_index INTEGER NOT NULL,
          player_name TEXT NOT NULL,
          spec_id INTEGER REFERENCES specs(id) ON DELETE SET NULL,
          note TEXT DEFAULT '',
          UNIQUE(event_id, group_number, slot_index)
        )
      `).run();

      db.prepare(`
        INSERT INTO raid_signup_groups_new (id, event_id, group_number, group_name, slot_index, player_name, spec_id, note)
        SELECT id, event_id, group_number, COALESCE(group_name, ''), slot_index, player_name, spec_id, COALESCE(note, '')
        FROM raid_signup_groups
      `).run();

      db.prepare('DROP TABLE raid_signup_groups').run();
      db.prepare('ALTER TABLE raid_signup_groups_new RENAME TO raid_signup_groups').run();
      });

      rebuildGroups();
    } finally {
      db.pragma('foreign_keys = ON');
    }
  }

  const eventColumns = db.prepare("PRAGMA table_info('raid_signup_events')").all();
  if (!eventColumns.some(col => col.name === 'public_groups')) {
    db.prepare('ALTER TABLE raid_signup_events ADD COLUMN public_groups INTEGER NOT NULL DEFAULT 0').run();
  }

  const groupColumns = db.prepare("PRAGMA table_info('raid_signup_groups')").all();
  if (!groupColumns.some(col => col.name === 'group_name')) {
    db.prepare('ALTER TABLE raid_signup_groups ADD COLUMN group_name TEXT DEFAULT ""').run();
  }

  const templateColumns = db.prepare("PRAGMA table_info('raid_signup_templates')").all();
  if (!templateColumns.some(col => col.name === 'group_size')) {
    db.prepare('ALTER TABLE raid_signup_templates ADD COLUMN group_size INTEGER NOT NULL DEFAULT 25').run();
  }
  if (!templateColumns.some(col => col.name === 'timezone_text')) {
    db.prepare("ALTER TABLE raid_signup_templates ADD COLUMN timezone_text TEXT NOT NULL DEFAULT 'Europe/Paris'").run();
  }
  if (!templateColumns.some(col => col.name === 'recurrence_days_json')) {
    db.prepare("ALTER TABLE raid_signup_templates ADD COLUMN recurrence_days_json TEXT NOT NULL DEFAULT '[]'").run();
  }
  if (!templateColumns.some(col => col.name === 'recurrence_delay_hours')) {
    db.prepare('ALTER TABLE raid_signup_templates ADD COLUMN recurrence_delay_hours INTEGER NOT NULL DEFAULT 2').run();
  }
  if (!templateColumns.some(col => col.name === 'recurrence_enabled')) {
    db.prepare('ALTER TABLE raid_signup_templates ADD COLUMN recurrence_enabled INTEGER NOT NULL DEFAULT 0').run();
  }

  db.prepare(`
    CREATE TABLE IF NOT EXISTS raid_signup_absences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS raid_signup_character_absences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      roster_id INTEGER NOT NULL REFERENCES roster(id) ON DELETE CASCADE,
      created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

function ensureWarcraftLogsTables(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS warcraftlogs_reports (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      zone TEXT DEFAULT '',
      start_time TEXT,
      end_time TEXT,
      duration_ms INTEGER,
      total_fights INTEGER NOT NULL DEFAULT 0,
      boss_kills INTEGER NOT NULL DEFAULT 0,
      fights_json TEXT NOT NULL DEFAULT '[]',
      url TEXT,
      synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare('CREATE INDEX IF NOT EXISTS idx_warcraftlogs_reports_synced_at ON warcraftlogs_reports (synced_at DESC)').run();
}

function ensureOperationalTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phase VARCHAR(20) NOT NULL,
      item_name VARCHAR(255) NOT NULL,
      player_id INTEGER NOT NULL,
      rank INTEGER,
      is_pass INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(phase, item_name, player_id)
    );

    CREATE TABLE IF NOT EXISTS player_stats (
      player_id INTEGER PRIMARY KEY,
      consumables INTEGER DEFAULT 0,
      enchants INTEGER DEFAULT 0,
      gems INTEGER DEFAULT 0,
      afks INTEGER DEFAULT 0,
      manual_adjustment REAL DEFAULT 0,
      manual_adjustment_note VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS player_parses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      boss_name VARCHAR(255) NOT NULL,
      parse_value REAL,
      is_support INTEGER DEFAULT 0,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      source VARCHAR(50) DEFAULT 'manual',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(player_id, boss_name)
    );

    CREATE TABLE IF NOT EXISTS raid_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      raid_date VARCHAR(20) NOT NULL,
      zone VARCHAR(100),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS raid_attendees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      raid_id INTEGER NOT NULL REFERENCES raid_logs(id) ON DELETE CASCADE,
      player_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(raid_id, player_id)
    );

    CREATE TABLE IF NOT EXISTS roster (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      spec_id INTEGER NOT NULL REFERENCES specs(id) ON DELETE CASCADE,
      in_raid INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bis_priorities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phase VARCHAR(20) NOT NULL UNIQUE,
      data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scoring_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bank_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_wowhead_id INTEGER NOT NULL,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      count INTEGER NOT NULL DEFAULT 1,
      sub_type VARCHAR(100) DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bank_uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_count INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bank_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      item_wowhead_id INTEGER NOT NULL,
      item_name VARCHAR(255) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      reason TEXT DEFAULT '',
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      price INTEGER,
      officer_note TEXT DEFAULT '',
      approved_quantity INTEGER,
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS raid_assignment_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS raid_assignment_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enabled_bosses TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS raid_assignment_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      boss_name VARCHAR(255) NOT NULL,
      caption TEXT DEFAULT '',
      image_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const specColumns = db.prepare("PRAGMA table_info('specs')").all();
  const hasSpecTable = specColumns.length > 0;
  if (hasSpecTable && !specColumns.some(col => col.name === 'slug')) {
    db.exec("ALTER TABLE specs ADD COLUMN slug TEXT DEFAULT ''");
  }
  if (hasSpecTable && !specColumns.some(col => col.name === 'color')) {
    db.exec("ALTER TABLE specs ADD COLUMN color TEXT DEFAULT '#e2e8f0'");
  }
  if (hasSpecTable && !specColumns.some(col => col.name === 'icon_small')) {
    db.exec("ALTER TABLE specs ADD COLUMN icon_small TEXT DEFAULT ''");
  }
  if (hasSpecTable && !specColumns.some(col => col.name === 'icon_medium')) {
    db.exec("ALTER TABLE specs ADD COLUMN icon_medium TEXT DEFAULT ''");
  }
  if (hasSpecTable && !specColumns.some(col => col.name === 'icon_large')) {
    db.exec("ALTER TABLE specs ADD COLUMN icon_large TEXT DEFAULT ''");
  }

  const rosterColumns = db.prepare('PRAGMA table_info(roster)').all();
  if (!rosterColumns.some(col => col.name === 'user_id')) {
    db.exec('ALTER TABLE roster ADD COLUMN user_id INTEGER');
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
    'CREATE INDEX IF NOT EXISTS idx_raid_assignment_images_boss_created ON raid_assignment_images (boss_name, created_at)',
    'CREATE INDEX IF NOT EXISTS idx_raid_signup_absences_user_dates ON raid_signup_absences (user_id, start_date, end_date)',
    'CREATE INDEX IF NOT EXISTS idx_raid_signup_character_absences_roster_dates ON raid_signup_character_absences (roster_id, start_date, end_date)',
    'CREATE INDEX IF NOT EXISTS idx_bnet_user_roles_role ON bnet_user_roles (role)',
    'CREATE INDEX IF NOT EXISTS idx_character_profiles_user_updated ON character_profiles (user_id, updated_at DESC)',
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_character_profiles_user_name ON character_profiles (user_id, character_name COLLATE NOCASE)',
    'CREATE INDEX IF NOT EXISTS idx_weakauras_created_at ON weakauras (created_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_raid_tactics_updated_at ON raid_tactics (updated_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_wipefest_created_at ON wipefest (created_at DESC)'
  ];

  statements.forEach(sql => db.prepare(sql).run());
}

function ensureDatabaseReady(db) {
  runWithBusyRetries(() => {
    ensureCoreSchema(db);
    ensureSpecsSeeded(db);
    ensureOperationalTables(db);
    ensureBattleNetAuthSchema(db);
    ensureTierTokenSupport(db);
    ensureWarcraftLogsTables(db);
    ensureNormalizedOperationalTables(db);
    ensureBankRequestSchema(db);
    ensureOfficerRolesTable(db);
    ensureBattleNetUserRolesTable(db);
    ensureWeakAurasTable(db);
    ensureTacticsTable(db);
    ensureWipefestTable(db);
    ensureDiscordBotConfigTable(db);
    ensureRecruitmentPlanningTable(db);
    ensureRecruitmentApplicationsTables(db);
    ensureRaidSignupTables(db);
    ensureDatabaseIndexes(db);
  });
}

module.exports = {
  ensureDatabaseReady
};
