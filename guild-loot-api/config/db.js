const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const APP_ROOT = path.resolve(__dirname, '..');
const LOCAL_DB_PATH = path.join(APP_ROOT, 'mydb.db');

function resolveDbPath(envPath) {
  if (!envPath) return LOCAL_DB_PATH;

  const candidate = path.isAbsolute(envPath) ? envPath : path.join(APP_ROOT, envPath);
  return candidate;
}

const DB_PATH = resolveDbPath(process.env.GUILD_LOOT_DB_PATH || LOCAL_DB_PATH);
const db = new Database(fs.existsSync(DB_PATH) ? DB_PATH : LOCAL_DB_PATH);
db.pragma('foreign_keys = ON');

module.exports = {
  db,
  DB_PATH
};
