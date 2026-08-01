const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const LOCAL_DB_PATH = path.join(__dirname, '..', 'mydb.db');
const HARD_CODED_DB_PATH = 'C:/Users/Steve/Projects/wow-loot-dashboard/guild-loot-api/mydb.db';
const DB_PATH_CANDIDATES = [
  process.env.GUILD_LOOT_DB_PATH,
  LOCAL_DB_PATH,
  HARD_CODED_DB_PATH
].filter(Boolean);

const DB_PATH = DB_PATH_CANDIDATES.find(candidate => fs.existsSync(candidate)) || LOCAL_DB_PATH;
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

module.exports = {
  db,
  DB_PATH
};
