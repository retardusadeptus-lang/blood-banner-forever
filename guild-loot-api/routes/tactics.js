const express = require('express');
const { hasOfficerAccess } = require('../middleware/auth');

function safeParseMedia(rawValue) {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) return parsed;
  } catch {
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

function safeParseTags(rawValue) {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // ignore malformed JSON and fall back to empty list
  }

  return [];
}

function normalizeTagsEntries(tags = []) {
  const source = Array.isArray(tags) ? tags : safeParseTags(tags);
  const normalized = source
    .map(tag => String(tag || '').trim())
    .filter(Boolean)
    .map(tag => tag.replace(/\s+/g, ' '));

  return [...new Set(normalized)];
}

function normalizeTacticSectionItem(item = {}, index = 0) {
  const text = String(item?.text || item?.content || '').trim();
  const tags = normalizeTagsEntries(item?.tags || item?.tag || []);

  return {
    id: item?.id || `section-item-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    tags,
  };
}

function normalizeTacticSection(section = {}, index = 0) {
  const items = Array.isArray(section?.items) ? section.items.map(normalizeTacticSectionItem) : [];
  return {
    id: section?.id || `section-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: String(section?.title || `Section ${index + 1}`).trim(),
    items,
  };
}

function normalizeTacticSections(rawSections = []) {
  if (typeof rawSections === 'string') {
    try {
      const parsed = JSON.parse(rawSections);
      return Array.isArray(parsed) ? parsed.map(normalizeTacticSection) : [];
    } catch {
      return [];
    }
  }

  if (!Array.isArray(rawSections)) return [];
  return rawSections.map(normalizeTacticSection);
}

function normalizeTacticEntry(rawEntry = {}) {
  const bossName = String(rawEntry.bossName || rawEntry.boss_name || '').trim();
  const notes = String(rawEntry.notes || '');
  const media = normalizeMediaEntries(rawEntry.media || safeParseMedia(rawEntry.media_json));
  const tags = normalizeTagsEntries(rawEntry.tags || safeParseTags(rawEntry.tags_json));
  const sections = normalizeTacticSections(rawEntry.sections || safeParseTags(rawEntry.sections_json));

  return {
    bossName,
    notes,
    media,
    tags,
    sections,
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
        SELECT boss_name, notes, media_json, tags_json, sections_json
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
          tags: normalizeTagsEntries(safeParseTags(row.tags_json)),
          sections: normalizeTacticSections(row.sections_json),
        });
      });

      const entries = orderedBosses.map((bossName) => entriesByBoss.get(bossName) || {
        bossName,
        notes: '',
        media: [],
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
      const tagsJson = JSON.stringify(normalizeTagsEntries(payload.tags));
      const sectionsJson = JSON.stringify(normalizeTacticSections(payload.sections));
      db.prepare(`
        INSERT INTO raid_tactics (boss_name, notes, media_json, tags_json, sections_json, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(boss_name)
        DO UPDATE SET notes = excluded.notes, media_json = excluded.media_json, tags_json = excluded.tags_json, sections_json = excluded.sections_json, updated_at = CURRENT_TIMESTAMP
      `).run(bossName, payload.notes, mediaJson, tagsJson, sectionsJson);

      return res.json({
        bossName,
        notes: payload.notes,
        media: normalizeMediaEntries(payload.media),
        tags: normalizeTagsEntries(payload.tags),
        sections: normalizeTacticSections(payload.sections),
      });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to save raid tactics.' });
    }
  });

  return router;
}

module.exports = buildTacticsRoutes;
