const express = require('express');
const { getDiscordClient } = require('../../bot');
const { getEventById, listEntriesForEvent, listGroupsForEvent } = require('../../discord/utils/raidSignupStore');
const { refreshEventMessage } = require('../../discord/interactions/raidSignupInteractions');

function buildRaidSignupEventRoutes({ db }) {
  const router = express.Router();

  router.get('/raid-signup-events', (req, res) => {
    try {
      const status = String(req.query.status || '').trim().toLowerCase();
      let rows;

      if (status) {
        rows = db.prepare(`
          SELECT id, template_id, title, description, scheduled_for, recurrence_instance, public_groups, status, discord_channel_id, discord_message_id, created_at
          FROM raid_signup_events
          WHERE lower(status) = ?
          ORDER BY id DESC
        `).all(status);
      } else {
        rows = db.prepare(`
          SELECT id, template_id, title, description, scheduled_for, recurrence_instance, public_groups, status, discord_channel_id, discord_message_id, created_at
          FROM raid_signup_events
          ORDER BY id DESC
        `).all();
      }

      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/raid-signup-events/:id', (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const event = getEventById(db, eventId);
      if (!event) return res.status(404).json({ error: 'Event not found' });

      const entries = listEntriesForEvent(db, eventId);
      const groups = listGroupsForEvent(db, eventId);
      res.json({ ...event, entries, groups });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/raid-signup-events/:id', (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const event = getEventById(db, eventId);
      if (!event) return res.status(404).json({ error: 'Event not found' });

      const title = req.body?.title;
      const description = req.body?.description;
      const scheduledFor = req.body?.scheduled_for;
      const publicGroups = req.body?.public_groups;

      db.prepare(`
        UPDATE raid_signup_events
        SET
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          scheduled_for = COALESCE(?, scheduled_for),
          public_groups = COALESCE(?, public_groups),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        title !== undefined ? String(title || '').trim() : null,
        description !== undefined ? String(description || '').trim() : null,
        scheduledFor !== undefined ? String(scheduledFor || '').trim() : null,
        publicGroups !== undefined ? (publicGroups ? 1 : 0) : null,
        eventId
      );

      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/raid-signup-events/:id/status', async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const event = getEventById(db, eventId);
      if (!event) return res.status(404).json({ error: 'Event not found' });

      const status = String(req.body?.status || '').trim().toLowerCase();
      const allowed = new Set(['open', 'locked', 'closed', 'archived']);
      if (!allowed.has(status)) {
        return res.status(400).json({ error: 'Invalid status. Use open, locked, closed, or archived.' });
      }

      db.prepare(`
        UPDATE raid_signup_events
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, eventId);

      const client = getDiscordClient();
      if (client) {
        await refreshEventMessage(db, client, eventId);
      }

      res.json({ ok: true, status });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.delete('/raid-signup-events/:id', async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const event = getEventById(db, eventId);
      if (!event) return res.status(404).json({ error: 'Event not found' });

      const client = getDiscordClient();
      if (client && event.discord_channel_id && event.discord_message_id) {
        const channel = await client.channels.fetch(event.discord_channel_id).catch(() => null);
        if (channel && typeof channel.messages?.fetch === 'function') {
          const message = await channel.messages.fetch(event.discord_message_id).catch(() => null);
          if (message) {
            await message.delete().catch(() => null);
          }
        }
      }

      db.prepare('DELETE FROM raid_signup_events WHERE id = ?').run(eventId);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}

module.exports = buildRaidSignupEventRoutes;
