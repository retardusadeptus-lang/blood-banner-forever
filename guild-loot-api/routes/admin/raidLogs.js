const express = require('express');

function buildAdminRaidLogsRoutes({ db }) {
  const router = express.Router();

  router.get('/raid-logs', (req, res) => {
    try {
      const logs = db.prepare('SELECT * FROM raid_logs ORDER BY raid_date DESC').all();
      const attendees = db.prepare('SELECT * FROM raid_attendees').all();
      const result = logs.map(log => ({
        id: log.id,
        date: log.raid_date,
        zone: log.zone,
        attendees: attendees.filter(a => a.raid_id === log.id).map(a => a.player_id)
      }));
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/raid-logs', (req, res) => {
    try {
      const logs = req.body;
      const deleteAttendees = db.prepare('DELETE FROM raid_attendees WHERE raid_id = ?');
      const deleteLogs = db.prepare('DELETE FROM raid_logs WHERE id NOT IN (SELECT value FROM json_each(?))');
      const upsertLog = db.prepare(`
        INSERT INTO raid_logs (id, raid_date, zone)
        VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET raid_date = excluded.raid_date, zone = excluded.zone
      `);
      const insertAttendee = db.prepare('INSERT OR IGNORE INTO raid_attendees (raid_id, player_id) VALUES (?, ?)');

      const updateAll = db.transaction(() => {
        const ids = logs.map(l => l.id);
        deleteLogs.run(JSON.stringify(ids));
        for (const log of logs) {
          upsertLog.run(log.id, log.date, log.zone);
          deleteAttendees.run(log.id);
          (log.attendees || []).forEach(playerId => insertAttendee.run(log.id, playerId));
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

module.exports = buildAdminRaidLogsRoutes;
