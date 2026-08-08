// populate_phases.js
// Run once with: node populate_phases.js
// Then delete this file.

const Database = require('better-sqlite3');
const path = require('path');
const aggregatedBisData = require('./aggregated_bis_with_ids.json');

const dbPath = path.join(__dirname, '..', 'mydb.db');
const db = new Database(dbPath);

// Phase order — earliest phase wins
const PHASE_ORDER = ['Pre-BiS', 'T4', 'T5', 'T6', 'ZA', 'SWP'];

// Build a map of item name -> earliest phase from the JSON
const phaseMap = {};

aggregatedBisData.forEach(item => {
  if (!item.name || !item.phase) return;

  const phases = Array.isArray(item.phase) ? item.phase : [item.phase];

  // Find the earliest phase this item appears in
  const earliest = phases.reduce((best, p) => {
    const bestIndex = PHASE_ORDER.indexOf(best);
    const thisIndex = PHASE_ORDER.indexOf(p);
    if (thisIndex === -1) return best;
    if (bestIndex === -1) return p;
    return thisIndex < bestIndex ? p : best;
  }, null);

  if (!earliest) return;

  // If we've seen this item before, keep the earlier phase
  if (phaseMap[item.name]) {
    const existingIndex = PHASE_ORDER.indexOf(phaseMap[item.name]);
    const newIndex = PHASE_ORDER.indexOf(earliest);
    if (newIndex < existingIndex) {
      phaseMap[item.name] = earliest;
    }
  } else {
    phaseMap[item.name] = earliest;
  }
});

console.log(`Built phase map for ${Object.keys(phaseMap).length} unique items`);

// Update the database
const update = db.prepare('UPDATE items SET phase = ? WHERE name = ? AND (phase IS NULL OR phase = \'\')');

const updateAll = db.transaction(() => {
  let updated = 0;
  let skipped = 0;

  for (const [name, phase] of Object.entries(phaseMap)) {
    const result = update.run(phase, name);
    if (result.changes > 0) {
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`Updated: ${updated} rows`);
  console.log(`Skipped (already had phase or name not found): ${skipped}`);
});

updateAll();

// Show remaining NULLs
const nullCount = db.prepare('SELECT COUNT(*) as count FROM items WHERE phase IS NULL').get();
console.log(`Items still with NULL phase: ${nullCount.count}`);

if (nullCount.count > 0) {
  const nullItems = db.prepare('SELECT name, source, source_type FROM items WHERE phase IS NULL LIMIT 20').all();
  console.log('Sample of remaining NULL phase items:');
  nullItems.forEach(i => console.log(`  - ${i.name} | ${i.source} | ${i.source_type}`));
}

db.close();