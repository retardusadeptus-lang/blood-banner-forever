const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const APP_ROOT = path.resolve(__dirname, '..');
const LOCAL_DB_PATH = path.join(APP_ROOT, 'mydb.db');

function normalizeCandidate(rawPath) {
  if (!rawPath) return null;
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(APP_ROOT, rawPath);
}

function resolveDbPath() {
  const candidates = [
    process.env.GUILD_LOOT_DB_PATH,
    process.env.LOCAL_GUILD_LOOT_DB_PATH,
    process.env.WOW_LOOT_DB_PATH,
    process.env.USERPROFILE && path.join(process.env.USERPROFILE, 'Projects', 'wow-loot-dashboard-addon-json-export', 'guild-loot-api', 'mydb.db'),
    process.env.HOME && path.join(process.env.HOME, 'Projects', 'wow-loot-dashboard-addon-json-export', 'guild-loot-api', 'mydb.db'),
    LOCAL_DB_PATH
  ].map(normalizeCandidate).filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return LOCAL_DB_PATH;
}

const DB_PATH = resolveDbPath();
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 10000');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

module.exports = {
  db,
  DB_PATH
};
