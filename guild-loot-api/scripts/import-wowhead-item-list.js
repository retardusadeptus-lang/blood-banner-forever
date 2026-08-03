const fs = require('fs');
const path = require('path');
const { db, ensureDatabaseReady } = require('../config/database');

const csvPath = path.join(__dirname, '..', '..', 'src', 'wowheaditemlist.csv');

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function normalizeSlot(slot) {
  if (!slot) return null;

  const normalized = String(slot).trim().toLowerCase();
  const slotMap = {
    head: 'Head',
    neck: 'Neck',
    shoulder: 'Shoulder',
    shoulders: 'Shoulder',
    back: 'Back',
    chest: 'Chest',
    wrist: 'Wrist',
    hands: 'Hands',
    waist: 'Waist',
    legs: 'Legs',
    feet: 'Feet',
    ring: 'Ring',
    trinket: 'Trinket',
    'main hand': 'Main Hand',
    'main-hand': 'Main Hand',
    'off hand': 'Off Hand',
    'off-hand': 'Off Hand',
    shield: 'Shield',
    ranged: 'Ranged',
    wand: 'Wand',
    totem: 'Totem',
    libram: 'Libram',
    idol: 'Idol',
    weapon: 'Main Hand',
    relic: 'Totem',
    'held in off-hand': 'Off Hand',
    'held in offhand': 'Off Hand',
    'one-handed sword': 'Main Hand',
    'one-handed mace': 'Main Hand',
    'one-handed axe': 'Main Hand',
    dagger: 'Main Hand',
    'fist weapon': 'Main Hand',
    'staff': 'Two-Hand',
    'two-handed sword': 'Two-Hand',
    'two-handed mace': 'Two-Hand',
    'two-handed axe': 'Two-Hand',
    polearm: 'Polearm',
    bow: 'Ranged',
    gun: 'Ranged',
    crossbow: 'Ranged',
    'thrown weapon': 'Ranged',
    'one-hand': 'Main Hand',
    'one hand': 'Main Hand',
    'two-hand': 'Two-Hand',
    'off hand frill': 'Off Hand',
    'thrown': 'Ranged',
    'idol': 'Idol',
    'libram': 'Libram',
    'totem': 'Totem',
    'relic': 'Totem',
    'amulet': 'Neck',
    'cloak': 'Back',
    'belt': 'Waist',
    'bracer': 'Wrist',
    'bracers': 'Wrist',
    'boots': 'Feet',
    'gloves': 'Hands',
    'gauntlets': 'Hands',
    'leggings': 'Legs',
    'pants': 'Legs',
    'shoulderpad': 'Shoulder',
    'shoulderpads': 'Shoulder',
    'shoulders': 'Shoulder',
    'mail armor': 'Mail Armor',
    'cloth armor': 'Cloth Armor',
    'leather armor': 'Leather Armor',
    'plate armor': 'Plate Armor'
  };

  return slotMap[normalized] || slot.replace(/\s+/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function readBlocks() {
  const lines = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/);
  const nonEmptyLines = lines.filter(line => line.trim() !== '');
  const blocks = [];

  for (let i = 0; i < nonEmptyLines.length; i += 5) {
    const chunk = nonEmptyLines.slice(i, i + 5);
    if (chunk.length < 5) break;
    blocks.push(chunk);
  }

  return blocks;
}

function importWowheadItemList() {
  ensureDatabaseReady(db);

  const selectItemByName = db.prepare('SELECT id FROM items WHERE lower(name) = lower(?) LIMIT 1');
  const insertItem = db.prepare(`
    INSERT INTO items (name, slot, phase, source, source_type, drop_chance, rarity, wowhead_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updateItem = db.prepare(`
    UPDATE items
    SET slot = ?, phase = ?, source = ?, source_type = ?, drop_chance = ?, rarity = ?, wowhead_id = ?
    WHERE id = ?
  `);

  const blocks = readBlocks();
  let importedCount = 0;

  blocks.forEach((block, blockIndex) => {
    const [idLine, nameLine, slotLine, sourceLine, armorLine] = block;
    const itemIds = parseCsvLine(idLine);
    const itemNames = parseCsvLine(nameLine);
    const itemSlots = parseCsvLine(slotLine);
    const itemSources = parseCsvLine(sourceLine);
    const itemArmorTypes = parseCsvLine(armorLine);

    const length = Math.max(itemIds.length, itemNames.length, itemSlots.length, itemSources.length, itemArmorTypes.length);

    for (let i = 0; i < length; i += 1) {
      const wowheadId = itemIds[i] ? Number.parseInt(String(itemIds[i]).replace(/[^0-9-]/g, ''), 10) : null;
      const name = itemNames[i] ? String(itemNames[i]).trim() : '';
      const slot = normalizeSlot(itemSlots[i]);
      const source = itemSources[i] ? String(itemSources[i]).trim() : null;
      const sourceType = itemArmorTypes[i] ? String(itemArmorTypes[i]).trim() : null;

      if (!name) continue;

      const existing = selectItemByName.get(name);
      if (existing) {
        updateItem.run(
          slot || null,
          null,
          source || null,
          sourceType || null,
          null,
          null,
          wowheadId || null,
          existing.id
        );
      } else {
        insertItem.run(name, slot || null, null, source || null, sourceType || null, null, null, wowheadId || null);
      }

      importedCount += 1;
    }
  });

  console.log(`Imported ${importedCount} item rows from ${blocks.length} data blocks.`);
  console.log(`Database rows now: ${db.prepare('SELECT COUNT(*) AS count FROM items').get().count}`);
}

try {
  importWowheadItemList();
} catch (error) {
  console.error('Import failed:', error);
  process.exitCode = 1;
}
