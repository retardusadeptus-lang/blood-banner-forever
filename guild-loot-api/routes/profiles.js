const express = require('express');
const {
  getBattleNetSessionFromRequest,
  requireBattleNetAuth
} = require('../middleware/auth');

const PROFILE_LIMITS = {
  characterName: 80,
  realm: 80,
  race: 80,
  className: 80,
  spec: 100,
  subclass: 100,
  role: 40,
  professions: 200,
  personality: 1200,
  rpHooks: 1200,
  backstory: 4000
};
const MAX_AVATAR_DATA_LENGTH = 900000;

function sanitizeText(value, maxLength) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function sanitizeMultilineText(value, maxLength) {
  return String(value ?? '').replace(/\r/g, '').trim().slice(0, maxLength);
}

function sanitizeAvatarData(value) {
  const avatarData = String(value || '').trim();
  if (!avatarData) return '';
  if (avatarData.length > MAX_AVATAR_DATA_LENGTH) {
    throw new Error('Character image is too large. Please choose a smaller image.');
  }
  if (!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(avatarData)) {
    throw new Error('Character image must be a PNG, JPEG, or WebP image.');
  }
  return avatarData;
}

function readProfilePayload(body = {}) {
  return {
    characterName: sanitizeText(body.characterName, PROFILE_LIMITS.characterName),
    realm: sanitizeText(body.realm, PROFILE_LIMITS.realm),
    race: sanitizeText(body.race, PROFILE_LIMITS.race),
    className: sanitizeText(body.className, PROFILE_LIMITS.className),
    spec: sanitizeText(body.spec, PROFILE_LIMITS.spec),
    subclass: sanitizeText(body.subclass, PROFILE_LIMITS.subclass),
    role: sanitizeText(body.role, PROFILE_LIMITS.role),
    professions: sanitizeText(body.professions, PROFILE_LIMITS.professions),
    personality: sanitizeMultilineText(body.personality, PROFILE_LIMITS.personality),
    rpHooks: sanitizeMultilineText(body.rpHooks, PROFILE_LIMITS.rpHooks),
    backstory: sanitizeMultilineText(body.backstory, PROFILE_LIMITS.backstory),
    avatarData: sanitizeAvatarData(body.avatarData)
  };
}

function serializeProfile(row, session) {
  return {
    id: row.id,
    ownerBattletag: row.battletag,
    isOwner: Number(row.user_id) === Number(session?.userId || 0),
    characterName: row.character_name,
    realm: row.realm || '',
    race: row.race || '',
    className: row.class_name || '',
    spec: row.spec || '',
    subclass: row.subclass || '',
    role: row.role || '',
    professions: row.professions || '',
    personality: row.personality || '',
    rpHooks: row.rp_hooks || '',
    backstory: row.backstory || '',
    avatarData: row.avatar_data || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function buildProfilesRoutes({ db }) {
  const router = express.Router();
  const selectProfile = `
    SELECT profiles.*, users.battletag
    FROM character_profiles profiles
    INNER JOIN users ON users.id = profiles.user_id
  `;

  router.get('/profiles', (req, res) => {
    try {
      const session = getBattleNetSessionFromRequest(req);
      const rows = db.prepare(`${selectProfile} ORDER BY profiles.updated_at DESC, profiles.id DESC`).all();
      return res.json(rows.map(row => serializeProfile(row, session)));
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to load character profiles.' });
    }
  });

  router.post('/profiles', requireBattleNetAuth, (req, res) => {
    try {
      const profile = readProfilePayload(req.body);
      if (!profile.characterName) {
        return res.status(400).json({ error: 'Character name is required.' });
      }

      const duplicate = db.prepare(`
        SELECT id FROM character_profiles
        WHERE user_id = ? AND lower(character_name) = lower(?)
      `).get(req.bnetSession.userId, profile.characterName);
      if (duplicate) {
        return res.status(409).json({ error: 'You already have a profile for that character.' });
      }

      const result = db.prepare(`
        INSERT INTO character_profiles (
          user_id, character_name, realm, race, class_name, spec, subclass, role,
          professions, personality, rp_hooks, backstory, avatar_data, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        req.bnetSession.userId,
        profile.characterName,
        profile.realm,
        profile.race,
        profile.className,
        profile.spec,
        profile.subclass,
        profile.role,
        profile.professions,
        profile.personality,
        profile.rpHooks,
        profile.backstory,
        profile.avatarData
      );

      const created = db.prepare(`${selectProfile} WHERE profiles.id = ?`).get(result.lastInsertRowid);
      return res.status(201).json(serializeProfile(created, req.bnetSession));
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Failed to create character profile.' });
    }
  });

  router.put('/profiles/:id', requireBattleNetAuth, (req, res) => {
    try {
      const profileId = Number(req.params.id);
      const profile = readProfilePayload(req.body);
      if (!profileId || !profile.characterName) {
        return res.status(400).json({ error: 'Character name is required.' });
      }

      const owned = db.prepare('SELECT id FROM character_profiles WHERE id = ? AND user_id = ?').get(profileId, req.bnetSession.userId);
      if (!owned) return res.status(404).json({ error: 'Character profile not found.' });

      const duplicate = db.prepare(`
        SELECT id FROM character_profiles
        WHERE user_id = ? AND lower(character_name) = lower(?) AND id <> ?
      `).get(req.bnetSession.userId, profile.characterName, profileId);
      if (duplicate) {
        return res.status(409).json({ error: 'You already have a profile for that character.' });
      }

      db.prepare(`
        UPDATE character_profiles
        SET character_name = ?, realm = ?, race = ?, class_name = ?, spec = ?, subclass = ?, role = ?,
          professions = ?, personality = ?, rp_hooks = ?, backstory = ?, avatar_data = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `).run(
        profile.characterName,
        profile.realm,
        profile.race,
        profile.className,
        profile.spec,
        profile.subclass,
        profile.role,
        profile.professions,
        profile.personality,
        profile.rpHooks,
        profile.backstory,
        profile.avatarData,
        profileId,
        req.bnetSession.userId
      );

      const updated = db.prepare(`${selectProfile} WHERE profiles.id = ?`).get(profileId);
      return res.json(serializeProfile(updated, req.bnetSession));
    } catch (error) {
      return res.status(400).json({ error: error.message || 'Failed to update character profile.' });
    }
  });

  router.delete('/profiles/:id', requireBattleNetAuth, (req, res) => {
    try {
      const result = db.prepare('DELETE FROM character_profiles WHERE id = ? AND user_id = ?').run(Number(req.params.id), req.bnetSession.userId);
      if (!result.changes) return res.status(404).json({ error: 'Character profile not found.' });
      return res.json({ ok: true });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to delete character profile.' });
    }
  });

  return router;
}

module.exports = buildProfilesRoutes;
