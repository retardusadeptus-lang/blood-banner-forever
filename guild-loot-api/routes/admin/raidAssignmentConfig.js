const express = require('express');

function buildAdminRaidAssignmentConfigRoutes({ db }) {
  const router = express.Router();

  router.get('/raid-assignment-config', (req, res) => {
    try {
      const rows = db.prepare('SELECT boss_name FROM raid_assignment_config_bosses WHERE enabled = 1 ORDER BY sort_order ASC, boss_name ASC').all();
      res.json(rows.map(row => row.boss_name));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/raid-assignment-config', (req, res) => {
    try {
      const enabledBosses = Array.isArray(req.body) ? req.body : [];
      const deleteAll = db.prepare('DELETE FROM raid_assignment_config_bosses');
      const insertBoss = db.prepare('INSERT INTO raid_assignment_config_bosses (boss_name, enabled, sort_order) VALUES (?, 1, ?)');

      const updateAll = db.transaction(() => {
        deleteAll.run();
        enabledBosses.forEach((bossName, index) => insertBoss.run(bossName, index));
      });

      updateAll();
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}

module.exports = buildAdminRaidAssignmentConfigRoutes;
