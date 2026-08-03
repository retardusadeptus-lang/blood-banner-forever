const express = require('express');

function buildMutableItemsRoutes({ db }) {
  const router = express.Router();

  const parseSourceDetails = (sourceText, sourceTypeText) => {
    const rawSource = String(sourceText || '').trim();
    const rawSourceType = String(sourceTypeText || '').trim();
    const genericArmorValues = ['armor', 'cloth armor', 'leather armor', 'mail armor', 'plate armor', 'cloak', 'ring', 'trinket'];

    const normalizedSourceType = rawSourceType.toLowerCase();
    if (rawSourceType && !genericArmorValues.includes(normalizedSourceType)) {
      return {
        boss: rawSourceType,
        zone: rawSource || rawSourceType
      };
    }

    if (!rawSource) {
      return {
        boss: rawSourceType || '',
        zone: rawSourceType || ''
      };
    }

    const cleaned = rawSource.replace(/\s+/g, ' ').trim();
    const zoneMarkers = [
      'black temple', 'tempest keep', 'serpentshrine cavern', 'ssc', 'sunwell plateau', 'zul\'aman', 'karazhan', 'hyjal summit', 'gruul\'s lair', 'gruul', 'magtheridons lair', 'magtheridon', 'shadow labyrinth', 'mechanar', 'steamvault', 'arcatraz', 'underbog', 'naxxramas', 'black morass', 'sethekk halls', 'za', 'tk', 'the eye', 'obsidian sanctum'
    ];

    for (const marker of zoneMarkers) {
      const markerIndex = cleaned.toLowerCase().lastIndexOf(marker);
      if (markerIndex === -1) continue;
      const bossCandidate = cleaned.slice(0, markerIndex).trim();
      const normalizedBoss = bossCandidate
        .replace(/^(?:zone drop|vendor|vendors|quest reward|world boss|raid|boss|loot|drop)\s+/i, '')
        .trim();
      if (normalizedBoss) {
        return {
          boss: normalizedBoss,
          zone: cleaned.slice(markerIndex).trim()
        };
      }
    }

    const fallbackBoss = cleaned
      .replace(/^(?:zone drop|vendor|vendors|quest reward|world boss|raid|boss|loot|drop)\s+/i, '')
      .trim();

    return {
      boss: fallbackBoss || rawSourceType || rawSource,
      zone: rawSource
    };
  };

  router.get('/mutable-items', (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT
          i.id,
          i.name,
          i.slot,
          i.phase,
          i.source as zone,
          i.source_type as boss,
          i.drop_chance,
          i.rarity,
          i.wowhead_id as itemId,
          CASE WHEN t.token_item_id IS NULL THEN 0 ELSE 1 END as is_token,
          t.token_group,
          t.token_slot,
          t.classes_json,
          t.is_quest
        FROM items i
        LEFT JOIN tier_token_metadata t ON t.token_item_id = i.id
        ORDER BY i.name
      `).all();

      const mapped = rows.map(row => {
        const sourceDetails = parseSourceDetails(row.zone, row.boss);
        return {
          ...row,
          boss: sourceDetails.boss,
          zone: sourceDetails.zone,
          is_token: row.is_token === 1,
          is_quest: row.is_quest === 1,
          token_classes: row.classes_json ? JSON.parse(row.classes_json) : []
        };
      });

      res.json(mapped);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}

module.exports = buildMutableItemsRoutes;
