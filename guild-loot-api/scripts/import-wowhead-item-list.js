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

function normalizeSourceText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*\((?:10|25|40)[NnHh]?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanSourceLabel(value) {
  const cleaned = normalizeSourceText(value);
  if (!cleaned) return null;

  return cleaned
    .replace(/^(?:boss drop|zone drop|drop|loot|raid|world boss|quest reward|quests?|vendors?|vendor)\s+/i, '')
    .replace(/^(?:the|a)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSourceMetadata(rawSourceText, rawArmorType) {
  const cleanedSource = normalizeSourceText(rawSourceText);
  const armorType = String(rawArmorType || '').trim();

  if (!cleanedSource) {
    return {
      source: null,
      sourceType: armorType && !['armor', 'cloth armor', 'leather armor', 'mail armor', 'plate armor'].includes(armorType.toLowerCase()) ? armorType : null
    };
  }

  const lowerSource = cleanedSource.toLowerCase();

  const craftMatch = lowerSource.match(/\b(tailoring|leatherworking|blacksmithing|engineering|jewelcrafting)\b/);
  if (craftMatch) {
    return {
      source: 'Crafting',
      sourceType: craftMatch[1].charAt(0).toUpperCase() + craftMatch[1].slice(1)
    };
  }

  const pvpMatch = lowerSource.match(/\b(pvp|battleground|arena)\b/);
  if (pvpMatch) {
    const remainder = cleanSourceLabel(cleanedSource.replace(/\b(?:pvp|battleground|arena)\b/i, '').trim());
    return {
      source: 'PvP',
      sourceType: remainder || 'Battleground'
    };
  }

  const questMatch = cleanedSource.match(/^(?:quest reward|quests?)\s*(.*)$/i);
  if (questMatch) {
    const remainder = cleanSourceLabel(questMatch[1] || '');
    return {
      source: 'Quest',
      sourceType: remainder || 'Quest'
    };
  }

  const zoneDefinitions = [
    { canonical: 'Molten Core', aliases: ['molten core'] },
    { canonical: "Onyxia's Lair", aliases: ["onyxia's lair", 'onyxia'] },
    { canonical: 'Blackwing Lair', aliases: ['blackwing lair'] },
    { canonical: 'Zul\'Gurub', aliases: ['zul\'gurub', 'zulgurub'] },
    { canonical: 'Ruins of Ahn\'Qiraj', aliases: ['ruins of ahn\'qiraj', 'ruins of ahnqiraj', 'aq20'] },
    { canonical: 'Temple of Ahn\'Qiraj', aliases: ['temple of ahn\'qiraj', 'temple of ahnqiraj', 'aq40'] },
    { canonical: 'Naxxramas', aliases: ['naxxramas'] },
    { canonical: 'Karazhan', aliases: ['karazhan'] },
    { canonical: 'Gruul\'s Lair', aliases: ["gruul's lair", 'gruul'] },
    { canonical: "Magtheridon's Lair", aliases: ["magtheridon's lair", 'magtheridon'] },
    { canonical: 'Serpentshrine Cavern', aliases: ['serpentshrine cavern', 'ssc'] },
    { canonical: 'Tempest Keep: The Eye', aliases: ['tempest keep: the eye', 'the eye', 'tempest keep', 'tk'] },
    { canonical: 'Black Temple', aliases: ['black temple'] },
    { canonical: 'Hyjal Summit', aliases: ['hyjal summit'] },
    { canonical: 'Sunwell Plateau', aliases: ['sunwell plateau', 'sunwell'] },
    { canonical: 'Zul\'Aman', aliases: ['zul\'aman', 'za'] },
    { canonical: 'The Shattered Halls', aliases: ['the shattered halls', 'shattered halls'] },
    { canonical: 'The Steamvault', aliases: ['the steamvault', 'steamvault'] },
    { canonical: 'The Mechanar', aliases: ['the mechanar', 'mechanar'] },
    { canonical: 'The Arcatraz', aliases: ['the arcatraz', 'arcatraz'] },
    { canonical: 'The Underbog', aliases: ['the underbog', 'underbog'] },
    { canonical: 'The Black Morass', aliases: ['the black morass', 'black morass'] },
    { canonical: 'Sethekk Halls', aliases: ['sethekk halls'] },
    { canonical: 'Shadow Labyrinth', aliases: ['shadow labyrinth'] },
    { canonical: 'The Botanica', aliases: ['the botanica', 'botanica'] },
    { canonical: 'The Slave Pens', aliases: ['the slave pens', 'slave pens'] },
    { canonical: 'The Blood Furnace', aliases: ['the blood furnace', 'blood furnace'] },
    { canonical: 'Mana-Tombs', aliases: ['mana-tombs'] },
    { canonical: 'Hellfire Ramparts', aliases: ['hellfire ramparts'] },
    { canonical: 'Auchindoun', aliases: ['auchindoun'] },
    { canonical: 'Caverns of Time', aliases: ['caverns of time'] },
    { canonical: 'Netherstorm', aliases: ['netherstorm'] },
    { canonical: 'Shadowmoon Valley', aliases: ['shadowmoon valley'] },
    { canonical: 'Terokkar Forest', aliases: ['terokkar forest'] },
    { canonical: 'Nagrand', aliases: ['nagrand'] },
    { canonical: 'Zangarmarsh', aliases: ['zangarmarsh'] },
    { canonical: 'Hellfire Peninsula', aliases: ['hellfire peninsula'] },
    { canonical: 'Blade\'s Edge Mountains', aliases: ["blade's edge mountains", 'blades edge mountains'] }
  ];

  const matchedZone = zoneDefinitions.find(zone => zone.aliases.some(alias => lowerSource.includes(alias)));
  if (matchedZone) {
    const zoneName = matchedZone.canonical;
    let sourceTextWithoutZone = cleanedSource;

    for (const alias of matchedZone.aliases) {
      const aliasPattern = new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      sourceTextWithoutZone = sourceTextWithoutZone.replace(aliasPattern, '').trim();
    }

    const bossCandidate = cleanSourceLabel(sourceTextWithoutZone);
    const sourceType = bossCandidate || 'Zone Drop';

    return {
      source: zoneName,
      sourceType
    };
  }

  return {
    source: cleanedSource,
    sourceType: null
  };
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
      const sourceText = itemSources[i] ? String(itemSources[i]).trim() : null;
      const armorTypeText = itemArmorTypes[i] ? String(itemArmorTypes[i]).trim() : null;
      const { source, sourceType } = parseSourceMetadata(sourceText, armorTypeText);

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
