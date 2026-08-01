const express = require('express');

function buildAssignmentsRoutes({ db }) {
  const router = express.Router();

  router.get('/assignments/:phase', (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT item_name, player_id, rank, is_pass
        FROM assignments
        WHERE phase = ?
      `).all(req.params.phase);

      const result = {};
      rows.forEach(row => {
        if (!result[row.item_name]) result[row.item_name] = {};
        result[row.item_name][row.player_id] = row.is_pass ? 'Pass' : row.rank;
      });

      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/assignments/:phase', (req, res) => {
    try {
      const phase = req.params.phase;
      const assignments = req.body;

      const upsert = db.prepare(`
        INSERT INTO assignments (phase, item_name, player_id, rank, is_pass)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(phase, item_name, player_id)
        DO UPDATE SET rank = excluded.rank, is_pass = excluded.is_pass
      `);

      const remove = db.prepare(`
        DELETE FROM assignments
        WHERE phase = ? AND item_name = ? AND player_id = ?
      `);

      const updateAll = db.transaction(() => {
        const submittedItems = Object.keys(assignments || {});

        if (submittedItems.length === 0) {
          db.prepare(`DELETE FROM assignments WHERE phase = ?`).run(phase);
          return;
        }

        const placeholders = submittedItems.map(() => '?').join(',');
        const deleteStmt = db.prepare(`DELETE FROM assignments WHERE phase = ? AND item_name NOT IN (${placeholders})`);
        deleteStmt.run(phase, ...submittedItems);

        for (const [itemName, players] of Object.entries(assignments)) {
          for (const [playerId, value] of Object.entries(players)) {
            if (value === null || value === undefined) {
              remove.run(phase, itemName, playerId);
            } else if (value === 'Pass') {
              upsert.run(phase, itemName, parseInt(playerId, 10), null, 1);
            } else {
              upsert.run(phase, itemName, parseInt(playerId, 10), value, 0);
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

module.exports = buildAssignmentsRoutes;
