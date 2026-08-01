const { db, DB_PATH } = require('./db');
const { ensureDatabaseReady } = require('./schema');

module.exports = {
  db,
  DB_PATH,
  ensureDatabaseReady: () => ensureDatabaseReady(db)
};
