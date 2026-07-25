const express = require('express');

function buildAdminPlayerStatsRoutes({ db }) {
  const router = express.Router();

  router.get('/player-stats', (req, res) => {
    try {
      const stats = db.prepare('SELECT * FROM player_stats').all();
      const parses = db.prepare('SELECT * FROM player_parses').all();

      const result = {};
      stats.forEach(row => {
        result[row.player_id] = {
          cons: row.consumables === 1,
          enchants: row.enchants === 1,
          gems: row.gems === 1,
          afks: row.afks,
          manualAdjustment: {
            value: row.manual_adjustment || 0,
            note: row.manual_adjustment_note || ''
          },
          parses: {}
        };
      });

      parses.forEach(row => {
        if (!result[row.player_id]) {
          result[row.player_id] = {
            cons: false,
            enchants: false,
            gems: false,
            afks: 0,
            manualAdjustment: { value: 0, note: '' },
            parses: {}
          };
        }
        result[row.player_id].parses[row.boss_name] = {
          val: row.parse_value,
          support: row.is_support === 1
        };
      });

      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/player-stats', (req, res) => {
    try {
      const allStats = req.body;
      const upsertStats = db.prepare(`
        INSERT INTO player_stats (player_id, consumables, enchants, gems, afks, manual_adjustment, manual_adjustment_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(player_id)
        DO UPDATE SET
          consumables = excluded.consumables,
          enchants = excluded.enchants,
          gems = excluded.gems,
          afks = excluded.afks,
          manual_adjustment = excluded.manual_adjustment,
          manual_adjustment_note = excluded.manual_adjustment_note
      `);
      const upsertParse = db.prepare(`
        INSERT INTO player_parses (player_id, boss_name, parse_value, is_support)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(player_id, boss_name)
        DO UPDATE SET parse_value = excluded.parse_value, is_support = excluded.is_support
      `);

      const updateAll = db.transaction(() => {
        for (const [playerId, stats] of Object.entries(allStats)) {
          upsertStats.run(
            parseInt(playerId, 10),
            stats.cons ? 1 : 0,
            stats.enchants ? 1 : 0,
            stats.gems ? 1 : 0,
            stats.afks || 0,
            stats.manualAdjustment?.value || 0,
            stats.manualAdjustment?.note || ''
          );

          if (stats.parses) {
            for (const [bossName, parseData] of Object.entries(stats.parses)) {
              if (parseData && parseData.val !== undefined && parseData.val !== '') {
                upsertParse.run(
                  parseInt(playerId, 10),
                  bossName,
                  parseData.val,
                  parseData.support ? 1 : 0
                );
              }
            }
          }
        }
      });

      updateAll();
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}

module.exports = buildAdminPlayerStatsRoutes;
