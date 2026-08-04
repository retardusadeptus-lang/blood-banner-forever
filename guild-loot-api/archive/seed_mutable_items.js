// seed_mutable_items.js
// Run once with: node seed_mutable_items.js
// Then delete this file.

const path = require('path');
const Database = require('better-sqlite3');
const aggregatedBisData = require('./aggregated_bis_with_ids.json');

const db = new Database(path.join(__dirname, '..', 'mydb.db'));

// Normalize slot names (same logic as the old frontend normalizeSlot function)
const normalizeSlot = (slot) => {
  if (!slot) return slot;
  const slotMap = {
    "head": "Head",
    "neck": "Neck",
    "shoulder": "Shoulder",
    "back": "Back",
    "chest": "Chest",
    "wrist": "Wrist",
    "hands": "Hands",
    "waist": "Waist",
    "legs": "Legs",
    "feet": "Feet",
    "ring": "Ring",
    "trinket": "Trinket",
    "main hand": "Main Hand",
    "off hand": "Off Hand",
    "shield": "Shield",
    "ranged": "Ranged",
    "wand": "Wand",
    "totem": "Totem",
    "libram": "Libram",
    "idol": "Idol",
    "weapon": "Main Hand",
    "relic": "Totem",
    "18 slot ammo pouch": "Ranged",
    "18 slot quiver": "Ranged"
  };
  return slotMap[slot.toLowerCase().trim()] || slot;
};

const seen = new Set();
const mutableItems = aggregatedBisData
  .filter(item => item && item.name && item.slot)
  .filter(item => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  })
  .map(item => ({
    name: item.name,
    slot: normalizeSlot(item.slot),
    itemId: item.id || '',
    boss: item.source_type,
    zone: item.source,
    drop_chance: item.drop_chance || null,
    spec: item.spec,
    id: item.id,
    rarity: item.rarity,
    source: item.source,
    source_type: item.source_type,
    phase: item.phase
  }));

console.log(`Built ${mutableItems.length} unique items`);

const exists = db.prepare('SELECT id FROM mutable_items WHERE id = 1').get();
if (exists) {
  db.prepare('UPDATE mutable_items SET data = ? WHERE id = 1').run(JSON.stringify(mutableItems));
  console.log('Updated existing mutable_items row.');
} else {
  db.prepare('INSERT INTO mutable_items (id, data) VALUES (1, ?)').run(JSON.stringify(mutableItems));
  console.log('Inserted new mutable_items row.');
}

db.close();