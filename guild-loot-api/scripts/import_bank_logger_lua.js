const fs = require('fs');
const path = require('path');
const { db, DB_PATH } = require('../config/db');
const { ensureDatabaseReady } = require('../config/database/schema');

const BANK_CATEGORY_MAP = {
  'Trade Goods': 'Materials',
  'Item Enhancement': 'Materials',
  Gem: 'Materials',
  Armor: 'Gear',
  Weapon: 'Gear',
  Consumable: 'Consumable',
  Recipe: 'Recipe'
};

function normalizeBankCategory(category) {
  const value = String(category || '').trim();
  return BANK_CATEGORY_MAP[value] || value || 'Other';
}

function parseField(block, fieldName) {
  const match = block.match(new RegExp(`\\["${fieldName}"\\]\\s*=\\s*"([^"]*)"`));
  return match ? match[1] : '';
}

function parseCount(block) {
  const match = block.match(/\["count"\]\s*=\s*(\d+)/);
  return match ? Number(match[1]) : 0;
}

function parseLuaBankFile(fileText) {
  const tableMatch = fileText.match(/TBCBankDB\s*=\s*\{([\s\S]*)\}\s*$/);
  if (!tableMatch) {
    throw new Error('Could not find TBCBankDB table in Lua file.');
  }

  const body = tableMatch[1];
  const entryRegex = /\[(\d+)\]\s*=\s*\{([\s\S]*?)\n\s*\},/g;
  const items = [];
  let match;

  while ((match = entryRegex.exec(body)) !== null) {
    const itemId = Number(match[1]);
    const block = match[2];
    const name = parseField(block, 'name');
    const category = parseField(block, 'category');
    const subtype = parseField(block, 'subtype');
    const count = parseCount(block);

    if (!itemId || !name) continue;

    items.push({
      item_wowhead_id: itemId,
      name,
      category: normalizeBankCategory(category),
      count,
      sub_type: subtype,
    });
  }

  return items;
}

function importBankLoggerLua(filePath) {
  ensureDatabaseReady(db);

  const resolvedPath = path.resolve(filePath);
  const fileText = fs.readFileSync(resolvedPath, 'utf8');
  const items = parseLuaBankFile(fileText);

  if (items.length === 0) {
    throw new Error('No bank items were parsed from the Lua file.');
  }

  const replaceItems = db.transaction(() => {
    db.prepare('DELETE FROM bank_items').run();

    const insertItem = db.prepare(`
      INSERT INTO bank_items (item_wowhead_id, name, category, count, sub_type)
      VALUES (?, ?, ?, ?, ?)
    `);

    items.forEach(item => {
      insertItem.run(item.item_wowhead_id, item.name, item.category, item.count, item.sub_type || '');
    });

    db.prepare('INSERT INTO bank_uploads (item_count) VALUES (?)').run(items.length);
  });

  replaceItems();
  return items;
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: node scripts/import_bank_logger_lua.js <path-to-TBCBankLogger.lua>');
    process.exit(1);
  }

  try {
    const items = importBankLoggerLua(inputPath);
    console.log(`[bank-import] DB: ${DB_PATH}`);
    console.log(`[bank-import] Source: ${path.resolve(inputPath)}`);
    console.log(`[bank-import] Imported ${items.length} bank items.`);
  } catch (error) {
    console.error('[bank-import] failed:', error.message || error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  parseLuaBankFile,
  importBankLoggerLua,
};