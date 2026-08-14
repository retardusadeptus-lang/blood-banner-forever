const express = require('express');
const { hasOfficerAccess, getBattleNetSessionFromRequest } = require('../middleware/auth');

function sanitizeWipefestEntry(entry = {}) {
  const raidDate = String(entry?.raidDate || entry?.raid_date || '').trim();
  const title = String(entry?.title || '').trim();
  const logsUrl = String(entry?.logsUrl || entry?.logs_url || '').trim();
  const wipefestUrl = String(entry?.wipefestUrl || entry?.wipefest_url || '').trim();
  const notes = String(entry?.notes || '').trim();

  return {
    raidDate,
    title,
    logsUrl,
    wipefestUrl,
    notes
  };
}

function buildWipefestRoutes({ db, sessionSecret }) {
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

  router.get('/wipefest', (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT id, raid_date, title, logs_url, wipefest_url, notes, created_by, created_at, updated_at
        FROM wipefest
        ORDER BY raid_date DESC, created_at DESC
      `).all();

      return res.json(rows.map((row) => ({
        id: row.id,
        raidDate: row.raid_date,
        title: row.title,
        logsUrl: row.logs_url,
        wipefestUrl: row.wipefest_url,
        notes: row.notes,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })));
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to load wipefest entries.' });
    }
  });

  router.post('/wipefest', requireOfficer, (req, res) => {
    try {
      const sanitized = sanitizeWipefestEntry(req.body || {});
      if (!sanitized.title) {
        return res.status(400).json({ error: 'Title is required.' });
      }

      const createdBy = resolveCreatedBy(req);
      const result = db.prepare(`
        INSERT INTO wipefest (raid_date, title, logs_url, wipefest_url, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        sanitized.raidDate || null,
        sanitized.title,
        sanitized.logsUrl || null,
        sanitized.wipefestUrl || null,
        sanitized.notes || null,
        createdBy
      );

      const row = db.prepare(`
        SELECT id, raid_date, title, logs_url, wipefest_url, notes, created_by, created_at, updated_at
        FROM wipefest
        WHERE id = ?
      `).get(result.lastInsertRowid);

      return res.status(201).json({
        id: row.id,
        raidDate: row.raid_date,
        title: row.title,
        logsUrl: row.logs_url,
        wipefestUrl: row.wipefest_url,
        notes: row.notes,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to create wipefest entry.' });
    }
  });

  router.put('/wipefest/:id', requireOfficer, (req, res) => {
    try {
      const id = Number(req.params?.id || 0);
      if (!id) {
        return res.status(400).json({ error: 'Valid wipefest entry id is required.' });
      }

      const sanitized = sanitizeWipefestEntry(req.body || {});
      if (!sanitized.title) {
        return res.status(400).json({ error: 'Title is required.' });
      }

      const existing = db.prepare('SELECT id FROM wipefest WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ error: 'Wipefest entry not found.' });
      }

      db.prepare(`
        UPDATE wipefest
        SET raid_date = ?, title = ?, logs_url = ?, wipefest_url = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        sanitized.raidDate || null,
        sanitized.title,
        sanitized.logsUrl || null,
        sanitized.wipefestUrl || null,
        sanitized.notes || null,
        id
      );

      const row = db.prepare(`
        SELECT id, raid_date, title, logs_url, wipefest_url, notes, created_by, created_at, updated_at
        FROM wipefest
        WHERE id = ?
      `).get(id);

      return res.json({
        id: row.id,
        raidDate: row.raid_date,
        title: row.title,
        logsUrl: row.logs_url,
        wipefestUrl: row.wipefest_url,
        notes: row.notes,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to update wipefest entry.' });
    }
  });

  router.delete('/wipefest/:id', requireOfficer, (req, res) => {
    try {
      const id = Number(req.params?.id || 0);
      if (!id) {
        return res.status(400).json({ error: 'Valid wipefest entry id is required.' });
      }

      const existing = db.prepare('SELECT id FROM wipefest WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ error: 'Wipefest entry not found.' });
      }

      db.prepare('DELETE FROM wipefest WHERE id = ?').run(id);
      return res.json({ ok: true, deletedId: id });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to delete wipefest entry.' });
    }
  });

  return router;
}

module.exports = buildWipefestRoutes;
