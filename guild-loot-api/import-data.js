const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Load the JSON data
const jsonPath = path.join(__dirname, '../src/aggregated_bis_with_ids.json');
const aggregatedBisData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Open the database
const db = new Database(path.join(__dirname, 'mydb.db'));
db.pragma('foreign_keys = ON');

console.log(`Loaded ${aggregatedBisData.length} rows from JSON`);

// ==========================================
// STEP 1: Insert all unique specs
// ==========================================
const specMapping = {
  "prot-warrior":         { class: "Warrior",  spec: "Prot Warrior" },
  "arms-warrior":         { class: "Warrior",  spec: "Arms Warrior" },
  "fury-warrior":         { class: "Warrior",  spec: "Fury Warrior" },
  "prot-paladin":         { class: "Paladin",  spec: "Prot Paladin" },
  "holy-paladin":         { class: "Paladin",  spec: "Holy Paladin" },
  "retribution-paladin":  { class: "Paladin",  spec: "Ret Paladin" },
  "BM-hunter":            { class: "Hunter",   spec: "BM Hunter" },
  "marksmanship-hunter":  { class: "Hunter",   spec: "MM Hunter" },
  "survival-hunter":      { class: "Hunter",   spec: "Survival Hunter" },
  "elemental-shaman":     { class: "Shaman",   spec: "Elemental Shaman" },
  "enhancement-shaman":   { class: "Shaman",   spec: "Enhance Shaman" },
  "restoration-shaman":   { class: "Shaman",   spec: "Resto Shaman" },
  "balance-druid":        { class: "Druid",    spec: "Balance Druid" },
  "feral-tank-druid":     { class: "Druid",    spec: "Feral (Tank)" },
  "feral-dps-druid":      { class: "Druid",    spec: "Feral (DPS)" },
  "restoration-druid":    { class: "Druid",    spec: "Resto Druid" },
  "combat-rogue":         { class: "Rogue",    spec: "Combat Rogue" },
  "holy-priest":          { class: "Priest",   spec: "Holy Priest" },
  "shadow-priest":        { class: "Priest",   spec: "Shadow Priest" },
  "arcane-mage":          { class: "Mage",     spec: "Arcane Mage" },
  "fire-mage":            { class: "Mage",     spec: "Fire Mage" },
  "frost-mage":           { class: "Mage",     spec: "Frost Mage" },
  "destruction-warlock":  { class: "Warlock",  spec: "Destro Warlock" },
  "demonology-warlock":   { class: "Warlock",  spec: "Demo Warlock" },
  "affliction-warlock":   { class: "Warlock",  spec: "Affliction Warlock" },
};

console.log('Inserting specs...');
// Delete in correct order to respect foreign key constraints
db.prepare('DELETE FROM items_bis').run();
db.prepare('DELETE FROM items').run();
db.prepare('DELETE FROM specs').run();
const insertSpec = db.prepare('INSERT INTO specs (class, spec) VALUES (?, ?)');
for (const [key, val] of Object.entries(specMapping)) {
  insertSpec.run(val.class, val.spec);
}

// Build a lookup: hyphenated spec key -> spec id in db
const specRows = db.prepare('SELECT id, spec FROM specs').all();
const specIdLookup = {};
specRows.forEach(row => {
  // find the hyphenated key for this display spec
  for (const [key, val] of Object.entries(specMapping)) {
    if (val.spec === row.spec) {
      specIdLookup[key] = row.id;
    }
  }
});

console.log(`Inserted ${specRows.length} specs`);

// ==========================================
// STEP 2: Insert all unique items
// ==========================================
console.log('Inserting items...');

const insertItem = db.prepare(`
  INSERT INTO items (name, slot, source, source_type, drop_chance, rarity, wowhead_id)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const seenItems = new Set();
const itemIdLookup = {}; // name -> db id

const insertItemsStmt = db.transaction(() => {
  for (const row of aggregatedBisData) {
    if (!row || !row.name || seenItems.has(row.name)) continue;
    seenItems.add(row.name);

    const result = insertItem.run(
      row.name,
      row.slot || null,
      row.source || null,
      row.source_type || null,
      row.drop_chance || null,
      row.rarity || null,
      row.id || null
    );
    itemIdLookup[row.name] = result.lastInsertRowid;
  }
});

insertItemsStmt();
console.log(`Inserted ${seenItems.size} unique items`);

// ==========================================
// STEP 3: Insert items_bis mappings
// ==========================================
console.log('Inserting BiS mappings...');

const insertBis = db.prepare(`
  INSERT INTO items_bis (
    item_id, spec_id,
    preraid_bis, t4_bis, t5_bis, t6_bis, za_bis, swp_bis,
    preraid_opt, t4_opt, t5_opt, t6_opt, za_opt, swp_opt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Group all rows by item name + spec
const bisMap = {}; // key: "itemName|specKey"

for (const row of aggregatedBisData) {
  if (!row || !row.name || !row.spec) continue;
  const key = `${row.name}|${row.spec}`;
  if (!bisMap[key]) {
    bisMap[key] = {
      name: row.name,
      spec: row.spec,
      'pre-bis': { bis: false, opt: false },
      t4: { bis: false, opt: false },
      t5: { bis: false, opt: false },
      t6: { bis: false, opt: false },
      za: { bis: false, opt: false },
      swp: { bis: false, opt: false },
    };
  }
  // Merge phase data
  for (const phase of ['pre-bis', 't4', 't5', 't6', 'za', 'swp']) {
    if (row[phase]) {
      if (row[phase].bis) bisMap[key][phase].bis = true;
      if (row[phase].opt) bisMap[key][phase].opt = true;
    }
  }
}

const insertBisStmt = db.transaction(() => {
  let count = 0;
  for (const [key, val] of Object.entries(bisMap)) {
    const itemId = itemIdLookup[val.name];
    const specId = specIdLookup[val.spec];
    if (!itemId || !specId) continue;

    insertBis.run(
      itemId, specId,
      val['pre-bis'].bis ? 1 : 0,
      val.t4.bis ? 1 : 0,
      val.t5.bis ? 1 : 0,
      val.t6.bis ? 1 : 0,
      val.za.bis ? 1 : 0,
      val.swp.bis ? 1 : 0,
      val['pre-bis'].opt ? 1 : 0,
      val.t4.opt ? 1 : 0,
      val.t5.opt ? 1 : 0,
      val.t6.opt ? 1 : 0,
      val.za.opt ? 1 : 0,
      val.swp.opt ? 1 : 0,
    );
    count++;
  }
  console.log(`Inserted ${count} BiS mappings`);
});

insertBisStmt();

console.log('Done! Database populated successfully.');
db.close();