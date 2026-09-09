const express = require('express');
const { hasAdminAccess, hasOfficerAccess, getBattleNetSessionFromRequest } = require('../middleware/auth');

function normalizeTags(value) {
  const source = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(source
    .map(tag => String(tag || '').trim().replace(/\s+/g, ' ').slice(0, 40))
    .filter(Boolean))].slice(0, 20);
}

function parseTags(value) {
  try {
    return normalizeTags(JSON.parse(value || '[]'));
  } catch {
    return normalizeTags(value);
  }
}

function buildWeakAuraRoutes({ db, sessionSecret }) {
  const router = express.Router();

  const requireOfficer = (req, res, next) => {
    if (!hasOfficerAccess(req, { sessionSecret, db })) {
      return res.status(401).json({ error: 'Officer authentication required' });
    }
    return next();
  };

  const requireAdmin = (req, res, next) => {
    if (!hasAdminAccess(req, { sessionSecret, db })) {
      return res.status(401).json({ error: 'Admin authentication required' });
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

  router.get('/weakauras/sections', (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT id, title, created_by, created_at
        FROM weakaura_sections
        ORDER BY title COLLATE NOCASE ASC, id ASC
      `).all();
      return res.json(rows);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.post('/weakauras/sections', requireAdmin, (req, res) => {
    try {
      const title = String(req.body?.title || '').trim();
      if (!title) return res.status(400).json({ error: 'Section title is required.' });
      if (title.length > 120) return res.status(400).json({ error: 'Section title is too long.' });

      const createdBy = resolveCreatedBy(req);
      const result = db.prepare(`
        INSERT INTO weakaura_sections (title, created_by)
        VALUES (?, ?)
      `).run(title, createdBy);
      const row = db.prepare(`
        SELECT id, title, created_by, created_at
        FROM weakaura_sections
        WHERE id = ?
      `).get(result.lastInsertRowid);
      return res.status(201).json(row);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.get('/weakauras', (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT id, section_id, title, import_code, wago_url, access_password, notes, tags_json, created_by, created_at
        FROM weakauras
        ORDER BY section_id IS NULL ASC, section_id ASC, created_at DESC, id DESC
      `).all();
      return res.json(rows.map(row => ({ ...row, tags: parseTags(row.tags_json) })));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.post('/weakauras', requireOfficer, (req, res) => {
    try {
      const title = String(req.body?.title || '').trim();
      const sectionId = req.body?.section_id === null || req.body?.section_id === undefined || req.body?.section_id === ''
        ? null
        : Number(req.body.section_id);
      const importCode = String(req.body?.import_code || '').trim();
      const wagoUrl = String(req.body?.wago_url || '').trim();
      const accessPassword = String(req.body?.access_password || '').trim();
      const notes = String(req.body?.notes || '').trim();
      const tags = normalizeTags(req.body?.tags);

      if (!title) {
        return res.status(400).json({ error: 'Title is required.' });
      }
      if (!importCode && !wagoUrl) {
        return res.status(400).json({ error: 'Provide either import code or a Wago link.' });
      }
      if (sectionId !== null && (!Number.isInteger(sectionId) || !db.prepare('SELECT id FROM weakaura_sections WHERE id = ?').get(sectionId))) {
        return res.status(400).json({ error: 'Selected section was not found.' });
      }

      const createdBy = resolveCreatedBy(req);
      const result = db.prepare(`
        INSERT INTO weakauras (section_id, title, import_code, wago_url, access_password, notes, tags_json, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        sectionId,
        title,
        importCode || null,
        wagoUrl || null,
        accessPassword || null,
        notes || null,
        JSON.stringify(tags),
        createdBy
      );

      const row = db.prepare(`
        SELECT id, section_id, title, import_code, wago_url, access_password, notes, tags_json, created_by, created_at
        FROM weakauras
        WHERE id = ?
      `).get(result.lastInsertRowid);

      return res.status(201).json({ ...row, tags: parseTags(row.tags_json) });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = buildWeakAuraRoutes;
