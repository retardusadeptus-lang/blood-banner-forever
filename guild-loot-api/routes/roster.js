const express = require('express');
const {
  getBattleNetSessionFromRequest,
  requireBattleNetAuth,
  requireOfficerAccess,
  verifySession,
  extractAdminToken
} = require('../middleware/auth');

const router = express.Router();

function getProfileNamespace(value) {
  const href = String(value || '').trim();
  if (!href) return '';

  try {
    return new URL(href).searchParams.get('namespace') || '';
  } catch {
    const match = href.match(/[?&]namespace=([^&]+)/i);
    return match ? decodeURIComponent(match[1]) : '';
  }
}

function findNamedCharacter(value, depth = 0) {
  if (!value || depth > 4) return null;
  if (Array.isArray(value)) {
    return value.map(item => findNamedCharacter(item, depth + 1)).find(Boolean) || null;
  }
  if (typeof value !== 'object') return null;

  if (String(value.name || '').trim() && (value.realm || value.level || value.id || value.key)) {
    return value;
  }

  const preferredKeys = ['character', 'protected_character', 'profile', 'data'];
  for (const key of preferredKeys) {
    const match = findNamedCharacter(value[key], depth + 1);
    if (match) return match;
  }

  return Object.values(value)
    .map(child => findNamedCharacter(child, depth + 1))
    .find(Boolean) || null;
}

function findProfileHref(value, depth = 0) {
  if (!value || depth > 4) return '';
  if (typeof value === 'string' && value.includes('namespace=')) return value;
  if (Array.isArray(value)) {
    return value.map(item => findProfileHref(item, depth + 1)).find(Boolean) || '';
  }
  if (typeof value !== 'object') return '';

  if (typeof value.href === 'string' && value.href.includes('namespace=')) return value.href;
  return Object.values(value)
    .map(child => findProfileHref(child, depth + 1))
    .find(Boolean) || '';
}

function getGameVersion(character, item, account, profileNamespace = '') {
  const explicitVersion = character?.gameVersion
    || character?.game_version
    || item?.gameVersion
    || item?.game_version
    || character?.game?.name
    || item?.game?.name
    || account?.game?.name
    || account?.gameVersion
    || account?.game_version;
  if (explicitVersion) return String(explicitVersion).trim();

  const namespace = [character, item, account]
    .map(findProfileHref)
    .map(getProfileNamespace)
    .find(Boolean)
    ?.toLowerCase() || String(profileNamespace || '').toLowerCase();
  if (namespace.includes('classicann')) return 'Classic Anniversary';
  if (namespace.includes('classic1x')) return 'Classic Era';
  if (namespace.includes('classic2x')) return 'Classic Progression';
  if (namespace.includes('classic')) return 'WoW Classic';
  return 'World of Warcraft';
}

function buildRosterRoutes({ db, sessionSecret, bnetConfig }) {
  const { BNET_API_BASE_URL, BNET_REGION, BNET_LOCALE } = bnetConfig;

  async function fetchBattleNetCharacters(req) {
    const session = getBattleNetSessionFromRequest(req);
    if (!session?.accessToken) {
      throw new Error('No active Battle.net session');
    }

    const profileNamespaces = [
      `profile-${BNET_REGION}`,
      `profile-classicann-${BNET_REGION}`,
      `profile-classic1x-${BNET_REGION}`,
      `profile-classic2x-${BNET_REGION}`
    ];
    const profileResults = await Promise.all(profileNamespaces.map(async profileNamespace => {
      const response = await fetch(`${BNET_API_BASE_URL}/profile/user/wow?namespace=${profileNamespace}&locale=${BNET_LOCALE}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const data = await response.json().catch(() => ({}));
      return { profileNamespace, response, data };
    }));
    const primaryResult = profileResults[0];
    if (!primaryResult.response.ok) {
      throw new Error(`Battle.net character fetch failed (${primaryResult.response.status}): ${primaryResult.data.error || 'unknown error'}`);
    }

    const characters = profileResults.flatMap(({ profileNamespace, response, data }) => {
      if (!response.ok) return [];
      const accountCharacters = Array.isArray(data.wow_accounts)
        ? data.wow_accounts
        : Array.isArray(data.accounts)
          ? data.accounts
          : [];

      return accountCharacters.flatMap(account => {
        const accountEntries = Array.isArray(account?.characters)
          ? account.characters
          : Array.isArray(account?.characterList)
            ? account.characterList
            : [];

        return accountEntries.map(item => {
          const character = findNamedCharacter(item) || item?.character || item || {};
          const realm = character.realm || item?.realm || {};
          const gameVersion = getGameVersion(character, item, account, profileNamespace);
          const name = String(character.name || item?.name || '').trim();
          return {
            name,
            realmName: String(realm.name || '').trim(),
            realmSlug: String(realm.slug || '').trim(),
            gameType: 'wow',
            gameVersion,
            level: character.level || item?.level || null,
            namespace: profileNamespace
          };
        });
      });
    }).filter(character => character.name);

    const uniqueCharacters = Array.from(new Map(
      characters.map(character => [
        `${character.gameVersion}|${character.realmSlug || character.realmName}|${character.name.toLowerCase()}`,
        character
      ])
    ).values());

    return { characters: uniqueCharacters, diagnostics: [] };
  }

  function logRosterClaimAudit(payload) {
    db.prepare(`
      INSERT INTO roster_claim_audit (action, roster_id, roster_name, user_id, battletag, actor_type, actor_user_id, actor_label)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      String(payload.action || ''),
      Number(payload.rosterId || 0),
      String(payload.rosterName || ''),
      payload.userId === null || payload.userId === undefined ? null : Number(payload.userId),
      payload.battletag ? String(payload.battletag) : null,
      String(payload.actorType || 'unknown'),
      payload.actorUserId === null || payload.actorUserId === undefined ? null : Number(payload.actorUserId),
      payload.actorLabel ? String(payload.actorLabel) : null
    );
  }

  router.get('/profile/characters', requireBattleNetAuth, async (req, res) => {
    try {
      const result = await fetchBattleNetCharacters(req);
      return res.json({ characters: result.characters });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to fetch Battle.net characters' });
    }
  });

  router.get('/profile/characters-debug', requireBattleNetAuth, async (req, res) => {
    try {
      const result = await fetchBattleNetCharacters(req);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to fetch Battle.net character diagnostics' });
    }
  });

  router.post('/roster/claim', requireBattleNetAuth, async (req, res) => {
    const characterName = String(req.body?.characterName || '').trim();
    const realmSlug = String(req.body?.realmSlug || '').trim();

    if (!characterName) {
      return res.status(400).json({ error: 'characterName is required' });
    }

    try {
      const characterResult = await fetchBattleNetCharacters(req);
      const matchedCharacter = characterResult.characters.find(character => {
        if (character.name.toLowerCase() !== characterName.toLowerCase()) return false;
        if (!realmSlug) return true;
        return String(character.realmSlug || '').toLowerCase() === realmSlug.toLowerCase();
      });

      if (!matchedCharacter) {
        return res.status(400).json({ error: 'Selected character was not found in your Battle.net profile.' });
      }

      const userId = Number(req.bnetSession.userId);
      const targetRoster = db.prepare(`
        SELECT id, name, spec_id, in_raid, user_id
        FROM roster
        WHERE lower(name) = lower(?) AND user_id IS NULL
        ORDER BY id ASC
        LIMIT 1
      `).get(matchedCharacter.name);

      if (!targetRoster) {
        return res.status(409).json({ error: 'No unclaimed roster slot exists for that character name.' });
      }

      db.prepare(`
        UPDATE roster
        SET user_id = ?
        WHERE id = ? AND (user_id IS NULL OR user_id = ?)
      `).run(userId, targetRoster.id, userId);

      logRosterClaimAudit({
        action: 'claim',
        rosterId: targetRoster.id,
        rosterName: targetRoster.name,
        userId,
        battletag: req.bnetSession?.battletag || null,
        actorType: 'bnet_user',
        actorUserId: userId,
        actorLabel: req.bnetSession?.battletag || null
      });

      return res.json({
        ok: true,
        claimed: {
          rosterId: targetRoster.id,
          rosterName: targetRoster.name,
          specId: targetRoster.spec_id,
          inRaid: targetRoster.in_raid === 1,
          characterName: matchedCharacter.name,
          realmSlug: matchedCharacter.realmSlug,
          gameType: matchedCharacter.gameType
        }
      });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to claim roster character' });
    }
  });

  router.post('/roster/claim-manual', async (req, res) => {
    const rosterId = Number(req.body?.rosterId || 0);
    if (!rosterId) {
      return res.status(400).json({ error: 'rosterId is required' });
    }

    try {
      let userId = Number(req.body?.userId || 0);
      let battletag = String(req.body?.battletag || '').trim();

      if (!userId) {
        const session = getBattleNetSessionFromRequest(req);
        userId = Number(session?.userId || 0);
        battletag = battletag || String(session?.battletag || '');
      }

      if (!userId) {
        const token = extractAdminToken(req);
        if (!verifySession(token, sessionSecret)) {
          return res.status(401).json({ error: 'Battle.net or officer authentication required' });
        }

        battletag = String(req.body?.battletag || '').trim();
        if (!battletag) {
          return res.status(400).json({ error: 'battletag is required when Battle.net session is unavailable' });
        }

        const user = db.prepare('SELECT id, battletag FROM users WHERE lower(battletag) = lower(?) LIMIT 1').get(battletag);
        if (!user) {
          return res.status(404).json({ error: 'No Battle.net user found for that battletag. Log in with Battle.net once, then retry.' });
        }

        userId = Number(user.id);
        battletag = user.battletag;
      }

      const targetRoster = db.prepare('SELECT id, name, spec_id, in_raid, user_id FROM roster WHERE id = ? LIMIT 1').get(rosterId);
      if (!targetRoster) {
        return res.status(404).json({ error: 'Roster character was not found.' });
      }

      if (targetRoster.user_id && Number(targetRoster.user_id) !== userId) {
        return res.status(409).json({ error: 'Roster character is already claimed by another user.' });
      }

      db.prepare(`
        UPDATE roster
        SET user_id = ?
        WHERE id = ? AND (user_id IS NULL OR user_id = ?)
      `).run(userId, targetRoster.id, userId);

      logRosterClaimAudit({
        action: 'claim_manual',
        rosterId: targetRoster.id,
        rosterName: targetRoster.name,
        userId,
        battletag,
        actorType: 'bnet_user',
        actorUserId: userId,
        actorLabel: battletag
      });

      return res.json({
        ok: true,
        claimed: {
          rosterId: targetRoster.id,
          rosterName: targetRoster.name,
          specId: targetRoster.spec_id,
          inRaid: targetRoster.in_raid === 1,
          source: 'manual_roster_fallback'
        }
      });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to claim roster character manually' });
    }
  });

  router.get('/roster/claims', requireOfficerAccess({ sessionSecret, db }), (req, res) => {
    try {
      const claims = db.prepare(`
        SELECT
          r.id as roster_id,
          r.name as roster_name,
          r.spec_id,
          r.in_raid,
          u.id as user_id,
          u.battletag,
          u.blizzard_id,
          u.created_at as linked_at
        FROM roster r
        JOIN users u ON u.id = r.user_id
        ORDER BY r.name COLLATE NOCASE
      `).all();

      return res.json({ claims: claims.map(row => ({
        rosterId: row.roster_id,
        rosterName: row.roster_name,
        specId: row.spec_id,
        inRaid: row.in_raid === 1,
        userId: row.user_id,
        battletag: row.battletag,
        blizzardId: row.blizzard_id,
        linkedAt: row.linked_at
      })) });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to load roster claims.' });
    }
  });

  router.post('/roster/unclaim', requireOfficerAccess({ sessionSecret, db }), (req, res) => {
    const rosterId = Number(req.body?.rosterId || req.body?.id || 0);
    if (!rosterId) {
      return res.status(400).json({ error: 'rosterId is required' });
    }

    try {
      const existing = db.prepare('SELECT id, name, user_id FROM roster WHERE id = ?').get(rosterId);
      if (!existing) {
        return res.status(404).json({ error: 'Roster character not found.' });
      }

      if (!existing.user_id) {
        return res.status(409).json({ error: 'Roster character is already unclaimed.' });
      }

      const linkedUser = db.prepare('SELECT id, battletag FROM users WHERE id = ?').get(existing.user_id);
      db.prepare('UPDATE roster SET user_id = NULL WHERE id = ?').run(rosterId);

      logRosterClaimAudit({
        action: 'unclaim',
        rosterId,
        rosterName: existing.name,
        userId: linkedUser?.id || existing.user_id,
        battletag: linkedUser?.battletag || null,
        actorType: 'officer',
        actorUserId: null,
        actorLabel: 'Officer Session'
      });

      return res.json({ ok: true, rosterId, rosterName: existing.name });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to unclaim roster character.' });
    }
  });

  router.get('/roster/claim-audit', requireOfficerAccess({ sessionSecret, db }), (req, res) => {
    try {
      const limit = Math.min(200, Math.max(10, Number(req.query?.limit || 50)));
      const rows = db.prepare(`
        SELECT id, action, roster_id, roster_name, user_id, battletag, actor_type, actor_user_id, actor_label, created_at
        FROM roster_claim_audit
        ORDER BY id DESC
        LIMIT ?
      `).all(limit);

      return res.json({ entries: rows.map(row => ({
        id: row.id,
        action: row.action,
        rosterId: row.roster_id,
        rosterName: row.roster_name,
        userId: row.user_id,
        battletag: row.battletag,
        actorType: row.actor_type,
        actorUserId: row.actor_user_id,
        actorLabel: row.actor_label,
        createdAt: row.created_at
      })) });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to load claim audit log.' });
    }
  });

  router.get('/roster', (req, res) => {
    try {
      const rows = db.prepare('SELECT id, name, spec_id, in_raid, user_id, guild_rank FROM roster').all();
      const roster = rows.map(r => ({ ...r, in_raid: r.in_raid === 1 }));
      res.json(roster);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/roster', (req, res) => {
    try {
      const players = req.body;
      const deleteAll = db.prepare('DELETE FROM roster');
      const insertWithId = db.prepare('INSERT INTO roster (id, name, spec_id, in_raid, user_id, guild_rank) VALUES (?, ?, ?, ?, ?, ?)');
      const insertNoId = db.prepare('INSERT INTO roster (name, spec_id, in_raid, user_id, guild_rank) VALUES (?, ?, ?, ?, ?)');

      const saveAll = db.transaction(() => {
        deleteAll.run();
        return players.map(p => {
          const nextUserId = p.user_id === undefined || p.user_id === null ? null : Number(p.user_id);
          const guildRank = String(p.guild_rank || '').trim();
          if (p.id !== undefined && p.id !== null && String(p.id).trim() !== '') {
            insertWithId.run(Number(p.id), p.name, p.spec_id, p.in_raid ? 1 : 0, nextUserId, guildRank);
            return { id: Number(p.id), name: p.name, spec_id: p.spec_id, in_raid: !!p.in_raid, user_id: nextUserId, guild_rank: guildRank };
          }

          const info = insertNoId.run(p.name, p.spec_id, p.in_raid ? 1 : 0, nextUserId, guildRank);
          return { id: info.lastInsertRowid, name: p.name, spec_id: p.spec_id, in_raid: !!p.in_raid, user_id: nextUserId, guild_rank: guildRank };
        });
      });

      const updatedRosters = saveAll();
      res.json(updatedRosters);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}

module.exports = buildRosterRoutes;
