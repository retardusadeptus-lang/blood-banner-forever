const express = require('express');

function buildAdminRaidAssignmentDataRoutes({ db }) {
  const router = express.Router();

  router.get('/raid-assignment-data', (req, res) => {
    try {
      const row = db.prepare('SELECT data FROM raid_assignment_data ORDER BY id LIMIT 1').get();
      res.json(row ? JSON.parse(row.data) : {});
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/raid-assignment-data', (req, res) => {
    try {
      const existing = db.prepare('SELECT id FROM raid_assignment_data ORDER BY id LIMIT 1').get();
      if (existing) {
        db.prepare('UPDATE raid_assignment_data SET data = ? WHERE id = ?').run(JSON.stringify(req.body), existing.id);
      } else {
        db.prepare('INSERT INTO raid_assignment_data (data) VALUES (?)').run(JSON.stringify(req.body));
      }
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}

module.exports = buildAdminRaidAssignmentDataRoutes;
