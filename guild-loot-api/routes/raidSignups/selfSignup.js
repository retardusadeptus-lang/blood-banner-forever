const express = require('express');
const { requireBattleNetAuth, getBattleNetSessionFromRequest } = require('../../middleware/auth');
const { getDiscordClient } = require('../../bot');
const { getEventById, listEntriesForEvent, upsertSignupEntry, ensureRosterPlayerForSignup } = require('../../discord/utils/raidSignupStore');
const { refreshEventMessage } = require('../../discord/interactions/raidSignupInteractions');

const ALLOWED_STATUSES = new Set(['signup', 'bench', 'late', 'tentative', 'absence']);
const MAX_NOTE_LENGTH = 500;

function buildRaidSignupSelfRoutes({ db }) {
  const router = express.Router();

  router.post('/raid-signup-events/:id/signup', requireBattleNetAuth, async (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const event = getEventById(db, eventId);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      if (event.status !== 'open') return res.status(409).json({ error: 'This signup event is closed.' });

      const userId = Number(getBattleNetSessionFromRequest(req)?.userId || 0);
      const rosterId = Number(req.body?.roster_id || 0);
      const roster = db.prepare(`
        SELECT id, name, spec_id, discord_user_id
        FROM roster
        WHERE id = ? AND user_id = ?
        LIMIT 1
      `).get(rosterId, userId);
      if (!roster) return res.status(403).json({ error: 'Select one of your claimed characters.' });

      const status = String(req.body?.status || '').trim().toLowerCase();
      if (!ALLOWED_STATUSES.has(status)) {
        return res.status(400).json({ error: 'Invalid signup status.' });
      }

      const requestedSpecId = Number(req.body?.spec_id || 0);
      const specId = requestedSpecId || Number(roster.spec_id || 0);
      if (!specId && status !== 'absence') {
        return res.status(400).json({ error: 'Select a spec before signing up.' });
      }

      const spec = specId
        ? db.prepare('SELECT id FROM specs WHERE id = ? LIMIT 1').get(specId)
        : null;
      if (specId && !spec) return res.status(400).json({ error: 'Selected spec was not found.' });

      const note = String(req.body?.note || '').trim().slice(0, MAX_NOTE_LENGTH);
      const ownedRoster = db.prepare(`
        SELECT name, discord_user_id
        FROM roster
        WHERE user_id = ?
      `).all(userId);
      const ownedNames = new Set(ownedRoster.map(player => String(player.name || '').trim().toLowerCase()).filter(Boolean));
      const ownedDiscordIds = new Set(ownedRoster.map(player => String(player.discord_user_id || '').trim()).filter(Boolean));
      const existingUserEntry = listEntriesForEvent(db, eventId).find(entry => (
        String(entry.discord_user_id || '').trim() === `web:${userId}`
        || ownedDiscordIds.has(String(entry.discord_user_id || '').trim())
        || ownedNames.has(String(entry.discord_username || '').trim().toLowerCase())
      ));
      const signupUserId = String(existingUserEntry?.discord_user_id || '').trim()
        || String(roster.discord_user_id || '').trim()
        || `web:${userId}`;
      upsertSignupEntry(db, eventId, signupUserId, String(roster.name || '').trim(), status, specId || null, note, 'website');
      if (specId && status !== 'absence') ensureRosterPlayerForSignup(db, roster.name, specId);

      const client = getDiscordClient();
      if (client) await refreshEventMessage(db, client, eventId, signupUserId);

      return res.json({ ok: true, status, character: roster.name, spec_id: specId || null, note });
    } catch (error) {
      console.error('[RaidSignup] Website signup failed:', error);
      return res.status(500).json({ error: error.message || 'Failed to save raid signup.' });
    }
  });

  return router;
}

module.exports = buildRaidSignupSelfRoutes;