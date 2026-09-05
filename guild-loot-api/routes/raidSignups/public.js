const express = require('express');
const { listPublicActiveEvents, listEntriesForEvent, listGroupsForEvent } = require('../../discord/utils/raidSignupStore');

function buildRaidSignupPublicRoutes({ db }) {
  const router = express.Router();

  router.get('/public-raid-signups', (req, res) => {
    try {
      const activeEvents = listPublicActiveEvents(db);
      const mapped = activeEvents.map(event => {
        const entries = listEntriesForEvent(db, event.id);
        const groups = event.public_groups === 1 ? listGroupsForEvent(db, event.id) : [];
        return { ...event, public_groups: event.public_groups === 1, entries, groups };
      });
      res.json(mapped);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/raid-signup-groups/:eventId', (req, res) => {
    try {
      const eventId = Number(req.params.eventId);
      res.json(listGroupsForEvent(db, eventId));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/raid-signup-groups/:eventId', (req, res) => {
    try {
      const eventId = Number(req.params.eventId);
      const rows = Array.isArray(req.body) ? req.body : [];
      const deleteExisting = db.prepare('DELETE FROM raid_signup_groups WHERE event_id = ?');
      const insert = db.prepare(`
        INSERT INTO raid_signup_groups (event_id, group_number, group_name, slot_index, player_name, spec_id, note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const save = db.transaction(() => {
        deleteExisting.run(eventId);
        rows.forEach(row => {
          const playerName = String(row?.player_name || '').trim();
          if (!playerName) return;
          const groupNumber = Number(row?.group_number);
          const slotIndex = Number(row?.slot_index);
          insert.run(
            eventId,
            Number.isFinite(groupNumber) ? groupNumber : 1,
            String(row.group_name || '').trim(),
            Number.isFinite(slotIndex) ? slotIndex : 1,
            playerName,
            row.spec_id ? Number(row.spec_id) : null,
            String(row.note || '').trim()
          );
        });
      });

      save();
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}

module.exports = buildRaidSignupPublicRoutes;
