const express = require('express');
const { getDiscordClient } = require('../../bot');
const { getEventById, listEntriesForEvent, listGroupsForEvent } = require('../../discord/utils/raidSignupStore');
const { refreshEventMessage } = require('../../discord/interactions/raidSignupInteractions');
const { normalizeScheduledForText, normalizeTimezone, DEFAULT_RAID_TIMEZONE } = require('../../utils/raidSignupTime');

function buildRaidSignupEventRoutes({ db }) {
  const router = express.Router();
  const eventListSelect = `
    SELECT
      e.id,
      e.template_id,
      e.title,
      e.description,
      e.scheduled_for,
      e.recurrence_instance,
      e.public_groups,
      e.status,
      e.discord_channel_id,
      e.discord_message_id,
      e.created_at,
      (
        SELECT COUNT(*)
        FROM raid_signup_entries se
        WHERE se.event_id = e.id AND lower(se.status) = 'signup'
      ) AS signup_count,
      (
        SELECT COUNT(*)
        FROM raid_signup_entries be
        WHERE be.event_id = e.id AND lower(be.status) = 'bench'
      ) AS bench_count,
      (
        SELECT COUNT(*)
        FROM raid_signup_entries ae
        WHERE ae.event_id = e.id AND lower(ae.status) IN ('absent', 'absence')
      ) AS absent_count,
      (
        SELECT COUNT(*)
        FROM raid_signup_entries te
        WHERE te.event_id = e.id AND lower(te.status) = 'tentative'
      ) AS tentative_count,
      (
        SELECT COUNT(*)
        FROM raid_signup_groups g
        WHERE g.event_id = e.id
      ) AS grouped_count
    FROM raid_signup_events e
  `;

  router.get('/raid-signup-events', (req, res) => {
    try {
      const status = String(req.query.status || '').trim().toLowerCase();
      let rows;

      if (status) {
        rows = db.prepare(`${eventListSelect}
          WHERE lower(e.status) = ?
          ORDER BY e.id DESC
        `).all(status);
      } else {
        rows = db.prepare(`${eventListSelect}
          ORDER BY e.id DESC
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

  router.put('/raid-signup-events/:id', async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const event = getEventById(db, eventId);
      if (!event) return res.status(404).json({ error: 'Event not found' });

      const title = req.body?.title;
      const description = req.body?.description;
      const scheduledFor = req.body?.scheduled_for;
      const publicGroups = req.body?.public_groups;

      let normalizedScheduledFor = null;
      if (scheduledFor !== undefined) {
        const templateTzRow = db.prepare(`
          SELECT t.timezone_text AS timezone_text
          FROM raid_signup_events e
          LEFT JOIN raid_signup_templates t ON t.id = e.template_id
          WHERE e.id = ?
          LIMIT 1
        `).get(eventId);
        const rawScheduledFor = String(scheduledFor || '').trim();
        const parts = rawScheduledFor.split(/\s+/).filter(Boolean);
        const requestedTimezone = req.body?.scheduled_timezone || (parts.length >= 3 ? parts[parts.length - 1] : '');
        const timezone = normalizeTimezone(requestedTimezone || templateTzRow?.timezone_text || DEFAULT_RAID_TIMEZONE);
        normalizedScheduledFor = normalizeScheduledForText(String(scheduledFor || '').trim(), timezone);
      }

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
        scheduledFor !== undefined ? normalizedScheduledFor : null,
        publicGroups !== undefined ? (publicGroups ? 1 : 0) : null,
        eventId
      );

      const client = getDiscordClient();
      if (client) {
        await refreshEventMessage(db, client, eventId);
      }

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

      const bodyStatus = String(req.body?.status || '').trim().toLowerCase();
      const hasPlayerTarget = req.body && (req.body.discord_user_id !== undefined || req.body.discord_username !== undefined);

      if (hasPlayerTarget) {
        const allowed = new Set(['signup', 'bench', 'late', 'tentative', 'absence', 'absent']);
        if (!allowed.has(bodyStatus)) {
          return res.status(400).json({ error: 'Invalid signup status. Use signup, late, tentative, bench, absence, or absent.' });
        }

        const discordUserId = req.body?.discord_user_id ? String(req.body.discord_user_id).trim() : '';
        const discordUsername = req.body?.discord_username ? String(req.body.discord_username).trim() : '';

        let entry = null;
        if (discordUserId) {
          entry = db.prepare(`
            SELECT *
            FROM raid_signup_entries
            WHERE event_id = ? AND discord_user_id = ?
            LIMIT 1
          `).get(eventId, discordUserId);
        }
        if (!entry && discordUsername) {
          entry = db.prepare(`
            SELECT *
            FROM raid_signup_entries
            WHERE event_id = ? AND discord_username = ?
            LIMIT 1
          `).get(eventId, discordUsername);
        }
        if (!entry) {
          return res.status(404).json({ error: 'Signup entry not found for this player.' });
        }

        const note = req.body?.note !== undefined ? String(req.body.note || '').trim() : undefined;

        db.prepare(`
          UPDATE raid_signup_entries
          SET status = ?,
              note = COALESCE(?, note),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(bodyStatus, note === undefined ? null : note, entry.id);

        const client = getDiscordClient();
        if (client) {
          await refreshEventMessage(db, client, eventId);
        }

        return res.json({ ok: true, status: bodyStatus, entry: { ...entry, status: bodyStatus } });
      }

      const allowedEventStatus = new Set(['open', 'locked', 'closed', 'archived']);
      if (!allowedEventStatus.has(bodyStatus)) {
        return res.status(400).json({ error: 'Invalid status. Use open, locked, closed, or archived.' });
      }

      db.prepare(`
        UPDATE raid_signup_events
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(bodyStatus, eventId);

      const client = getDiscordClient();
      if (client) {
        await refreshEventMessage(db, client, eventId);
      }

      res.json({ ok: true, status: bodyStatus });
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
