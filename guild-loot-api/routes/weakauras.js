const express = require('express');
const { hasOfficerAccess, getBattleNetSessionFromRequest } = require('../middleware/auth');

function buildWeakAuraRoutes({ db, sessionSecret }) {
  const router = express.Router();

  const requireOfficer = (req, res, next) => {
    if (!hasOfficerAccess(req, { sessionSecret, db })) {
      return res.status(401).json({ error: 'Officer authentication required' });
    }
    return next();
  };

  const resolveCreatedBy = (req) => {
    const bnetSession = getBattleNetSessionFromRequest(req);
    const userId = Number(bnetSession?.userId || 0);
    if (userId) {
      const row = db.prepare('SELECT battletag FROM users WHERE id = ?').get(userId);
      if (row?.battletag) return String(row.battletag);
    }
    return 'Officer';
  };

  router.get('/weakauras', (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT id, title, import_code, wago_url, access_password, notes, created_by, created_at
        FROM weakauras
        ORDER BY created_at DESC, id DESC
      `).all();
      return res.json(rows);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.post('/weakauras', requireOfficer, (req, res) => {
    try {
      const title = String(req.body?.title || '').trim();
      const importCode = String(req.body?.import_code || '').trim();
      const wagoUrl = String(req.body?.wago_url || '').trim();
      const accessPassword = String(req.body?.access_password || '').trim();
      const notes = String(req.body?.notes || '').trim();

      if (!title) {
        return res.status(400).json({ error: 'Title is required.' });
      }
      if (!importCode && !wagoUrl) {
        return res.status(400).json({ error: 'Provide either import code or a Wago link.' });
      }

      const createdBy = resolveCreatedBy(req);
      const result = db.prepare(`
        INSERT INTO weakauras (title, import_code, wago_url, access_password, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        title,
        importCode || null,
        wagoUrl || null,
        accessPassword || null,
        notes || null,
        createdBy
      );

      const row = db.prepare(`
        SELECT id, title, import_code, wago_url, access_password, notes, created_by, created_at
        FROM weakauras
        WHERE id = ?
      `).get(result.lastInsertRowid);

      return res.status(201).json(row);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = buildWeakAuraRoutes;
