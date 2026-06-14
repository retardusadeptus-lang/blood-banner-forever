const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database(path.join(__dirname, 'mydb.db'));

const outputs = JSON.parse(fs.readFileSync(path.join(__dirname, 'outputs2.json'), 'utf8'));

const update = db.prepare('UPDATE items SET wowhead_id = ? WHERE id = ?');

let updated = 0;
let skipped = 0;

const updateAll = db.transaction(() => {
  for (const entry of outputs) {
    if (entry.media_id !== null && entry.media_id !== undefined) {
      update.run(entry.media_id, entry.db_id);
      updated++;
    } else {
      skipped++;
    }
  }
});

updateAll();

console.log(`Updated ${updated} items with wowhead_id`);
console.log(`Skipped ${skipped} items with no media_id`);

db.close();