const express = require('express');
console.log('[DEBUG] assignments route module loaded from', __filename);

function normalizeAwardedPlayerIds(assignmentPayload = {}) {
  const directIds = assignmentPayload.awardedPlayerIds;
  if (Array.isArray(directIds)) {
    return directIds.map(id => String(id)).filter(Boolean);
  }

  const singleId = assignmentPayload.awardedPlayerId;
  if (singleId !== undefined && singleId !== null && singleId !== '') {
    return [String(singleId)];
  }

  return [];
}

function buildAssignmentsRoutes({ db }) {
  const router = express.Router();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS assignment_awards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phase TEXT NOT NULL,
      item_name TEXT NOT NULL,
      player_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(phase, item_name, player_id)
    )
  `).run();

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

  const deleteItemRows = db.prepare(`
    DELETE FROM assignments
    WHERE phase = ? AND item_name = ?
  `);

  const deleteAwardsForItem = db.prepare(`
    DELETE FROM assignment_awards
    WHERE phase = ? AND item_name = ?
  `);

  const upsertAward = db.prepare(`
    INSERT INTO assignment_awards (phase, item_name, player_id)
    VALUES (?, ?, ?)
    ON CONFLICT(phase, item_name, player_id)
    DO NOTHING
  `);

  router.get('/assignments/:phase', (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT item_name, player_id, rank, is_pass
        FROM assignments
        WHERE phase = ?
      `).all(req.params.phase);

      const awardRows = db.prepare(`
        SELECT item_name, player_id
        FROM assignment_awards
        WHERE phase = ?
      `).all(req.params.phase);

      const result = {};
      rows.forEach(row => {
        if (!result[row.item_name]) result[row.item_name] = {};
        result[row.item_name][row.player_id] = row.is_pass ? 'Pass' : row.rank;
      });

      awardRows.forEach(row => {
        if (!result[row.item_name]) result[row.item_name] = {};
        if (!Array.isArray(result[row.item_name].awardedPlayerIds)) {
          result[row.item_name].awardedPlayerIds = [];
        }
        result[row.item_name].awardedPlayerIds.push(String(row.player_id));
      });

      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/assignments/:phase', (req, res) => {
    try {
      const phase = req.params.phase;
      const assignments = req.body || {};
      console.log('[DEBUG] PUT /assignments keys', Object.keys(assignments));

      const updateAll = db.transaction(() => {
        const submittedItems = Object.keys(assignments);

        if (submittedItems.length === 0) {
          db.prepare(`DELETE FROM assignments WHERE phase = ?`).run(phase);
          db.prepare(`DELETE FROM assignment_awards WHERE phase = ?`).run(phase);
          return;
        }

        const placeholders = submittedItems.map(() => '?').join(',');
        const deleteStmt = db.prepare(`DELETE FROM assignments WHERE phase = ? AND item_name NOT IN (${placeholders})`);
        const deleteAwardStmt = db.prepare(`DELETE FROM assignment_awards WHERE phase = ? AND item_name NOT IN (${placeholders})`);
        deleteStmt.run(phase, ...submittedItems);
        deleteAwardStmt.run(phase, ...submittedItems);

        for (const [itemName, players] of Object.entries(assignments)) {
          console.log('[DEBUG] processing item', itemName, 'player keys', Object.keys(players || {}));
          const normalizedPlayerEntries = Object.entries(players || {}).filter(([playerId]) => {
            const candidate = String(playerId).trim();
            return /^\d+$/.test(candidate);
          });
          console.log('[DEBUG] normalized entries', itemName, normalizedPlayerEntries.map(([playerId]) => playerId));

          const normalizedAwards = normalizeAwardedPlayerIds(players || {});
          deleteAwardsForItem.run(phase, itemName);
          normalizedAwards.forEach(playerId => {
            const numericPlayerId = Number.parseInt(playerId, 10);
            if (Number.isInteger(numericPlayerId) && numericPlayerId > 0) {
              upsertAward.run(phase, itemName, numericPlayerId);
            }
          });

          if (normalizedPlayerEntries.length === 0) {
            deleteItemRows.run(phase, itemName);
            continue;
          }

          for (const [playerId, value] of normalizedPlayerEntries) {
            const numericPlayerId = Number.parseInt(playerId, 10);
            if (!Number.isInteger(numericPlayerId)) {
              continue;
            }
            if (numericPlayerId <= 0) {
              continue;
            }

            if (value === null || value === undefined) {
              remove.run(phase, itemName, numericPlayerId);
            } else {
              const normalizedValue = String(value).trim();
              if (normalizedValue.toLowerCase() === 'pass') {
                upsert.run(phase, itemName, numericPlayerId, null, 1);
              } else {
                const numericRank = Number(value);
                if (Number.isFinite(numericRank)) {
                  if (!Number.isInteger(numericRank)) {
                    continue;
                  }
                  upsert.run(phase, itemName, numericPlayerId, numericRank, 0);
                }
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

module.exports = buildAssignmentsRoutes;
