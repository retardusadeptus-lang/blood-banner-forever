const express = require('express');
const { hasOfficerAccess } = require('../middleware/auth');

function safeParseMedia(rawValue) {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) return parsed;
  } catch (error) {
    // ignore malformed JSON and fall back to empty list
  }

  return [];
}

function normalizeMediaEntries(media = []) {
  return Array.isArray(media)
    ? media
        .filter(item => item && (String(item.url || '').trim() || String(item.label || '').trim()))
        .map((item, index) => ({
          id: item.id || `media-${Date.now()}-${index}`,
          type: ['image', 'video', 'link'].includes(item.type) ? item.type : 'link',
          url: String(item.url || '').trim(),
          label: String(item.label || '').trim(),
        }))
        .filter(item => item.url)
    : [];
}

function normalizeTacticEntry(rawEntry = {}) {
  const bossName = String(rawEntry.bossName || rawEntry.boss_name || '').trim();
  const notes = String(rawEntry.notes || '');
  const media = normalizeMediaEntries(rawEntry.media || safeParseMedia(rawEntry.media_json));

  return {
    bossName,
    notes,
    media,
  };
}

function buildTacticsRoutes({ db, sessionSecret }) {
  const router = express.Router();

  const requireOfficer = (req, res, next) => {
    if (!hasOfficerAccess(req, { sessionSecret, db })) {
      return res.status(401).json({ error: 'Officer authentication required' });
    }
    return next();
  };

  router.get('/tactics', (req, res) => {
    try {
      const orderedBosses = db.prepare(`
        SELECT boss_name
        FROM raid_assignment_config_bosses
        WHERE enabled = 1
        ORDER BY rowid ASC
      `).all().map(row => String(row.boss_name || '').trim()).filter(Boolean);

      const rows = db.prepare(`
        SELECT boss_name, notes, media_json
        FROM raid_tactics
        ORDER BY rowid ASC
      `).all();

      const entriesByBoss = new Map();
      rows.forEach((row) => {
        const bossName = String(row.boss_name || '').trim();
        if (!bossName) return;
        entriesByBoss.set(bossName, {
          bossName,
          notes: String(row.notes || ''),
          media: normalizeMediaEntries(safeParseMedia(row.media_json)),
        });
      });

      const entries = orderedBosses.map((bossName) => entriesByBoss.get(bossName) || {
        bossName,
        notes: '',
        media: [],
      });

      const extraBosses = rows
        .map(row => String(row.boss_name || '').trim())
        .filter(Boolean)
        .filter(bossName => !orderedBosses.includes(bossName));

      extraBosses.forEach((bossName) => {
        entries.push(entriesByBoss.get(bossName) || {
          bossName,
          notes: '',
          media: [],
        });
      });

      return res.json({
        bossOrder: orderedBosses,
        entries,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to load raid tactics.' });
    }
  });

  router.put('/tactics/:bossName', requireOfficer, (req, res) => {
    try {
      const routeBossName = decodeURIComponent(String(req.params.bossName || '')).trim();
      const payload = normalizeTacticEntry(req.body || {});
      const bossName = payload.bossName || routeBossName;

      if (!bossName) {
        return res.status(400).json({ error: 'Boss name is required.' });
      }

      const mediaJson = JSON.stringify(normalizeMediaEntries(payload.media));
      db.prepare(`
        INSERT INTO raid_tactics (boss_name, notes, media_json, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(boss_name)
        DO UPDATE SET notes = excluded.notes, media_json = excluded.media_json, updated_at = CURRENT_TIMESTAMP
      `).run(bossName, payload.notes, mediaJson);

      return res.json({
        bossName,
        notes: payload.notes,
        media: normalizeMediaEntries(payload.media),
      });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to save raid tactics.' });
    }
  });

  return router;
}

module.exports = buildTacticsRoutes;
