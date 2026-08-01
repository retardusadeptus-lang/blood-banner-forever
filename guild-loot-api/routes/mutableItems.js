const express = require('express');

function buildMutableItemsRoutes({ db }) {
  const router = express.Router();

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

      const mapped = rows.map(row => ({
        ...row,
        is_token: row.is_token === 1,
        is_quest: row.is_quest === 1,
        token_classes: row.classes_json ? JSON.parse(row.classes_json) : []
      }));

      res.json(mapped);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}

module.exports = buildMutableItemsRoutes;
