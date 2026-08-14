const express = require('express');
const {
  getBattleNetSessionFromRequest,
  hasOfficerAccess
} = require('../../middleware/auth');
const { SESSION_SECRET } = require('../../config');

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim());
}

function listClaimedCharactersByUser(db) {
  const rows = db.prepare('SELECT user_id, name FROM roster WHERE user_id IS NOT NULL ORDER BY name COLLATE NOCASE').all();
  const map = new Map();
  rows.forEach(row => {
    const key = Number(row.user_id);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(String(row.name || '').trim());
  });
  return map;
}

function listAbsenceTargets(db) {
  const userRows = db.prepare(`
    SELECT u.id AS user_id, u.battletag, r.name AS roster_name
    FROM users u
    INNER JOIN roster r ON r.user_id = u.id
    ORDER BY u.battletag COLLATE NOCASE, r.name COLLATE NOCASE
  `).all();

  const grouped = new Map();
  userRows.forEach(row => {
    const userId = Number(row.user_id);
    if (!grouped.has(userId)) {
      grouped.set(userId, {
        target_type: 'user',
        user_id: userId,
        roster_id: null,
        battletag: String(row.battletag || '').trim(),
        characters: []
      });
    }

    const target = grouped.get(userId);
    const characterName = String(row.roster_name || '').trim();
    if (characterName && !target.characters.includes(characterName)) {
      target.characters.push(characterName);
    }
  });

  const unclaimedRows = db.prepare(`
    SELECT r.id AS roster_id, r.name AS roster_name
    FROM roster r
    WHERE r.user_id IS NULL
    ORDER BY r.name COLLATE NOCASE
  `).all();

  const unclaimedTargets = unclaimedRows.map(row => ({
    target_type: 'roster',
    user_id: null,
    roster_id: Number(row.roster_id),
    battletag: '',
    characters: [String(row.roster_name || '').trim()]
  }));

  return [...grouped.values(), ...unclaimedTargets];
}

function mapUserAbsenceRows(rows, namesByUserId, currentUserId, officerMode) {
  return rows.map(row => {
    const ownerId = Number(row.user_id || 0);
    return {
      id: `user-${row.id}`,
      absence_type: 'user',
      user_id: ownerId,
      roster_id: null,
      battletag: row.battletag || '',
      target_character_name: '',
      start_date: row.start_date,
      end_date: row.end_date,
      note: row.note || '',
      created_at: row.created_at,
      updated_at: row.updated_at,
      claimed_characters: namesByUserId.get(ownerId) || [],
      can_edit: officerMode || (currentUserId && ownerId === Number(currentUserId))
    };
  });
}

function mapCharacterAbsenceRows(rows, officerMode) {
  return rows.map(row => {
    const rosterName = String(row.roster_name || '').trim();
    const ownerId = Number(row.user_id || 0);
    const hasOwner = ownerId > 0;
    return {
      id: `char-${row.id}`,
      absence_type: 'roster',
      user_id: hasOwner ? ownerId : null,
      roster_id: Number(row.roster_id),
      battletag: row.battletag || '',
      target_character_name: rosterName,
      start_date: row.start_date,
      end_date: row.end_date,
      note: row.note || '',
      created_at: row.created_at,
      updated_at: row.updated_at,
      claimed_characters: rosterName ? [rosterName] : [],
      can_edit: !!officerMode
    };
  });
}

function parseAbsenceKey(rawValue) {
  const raw = String(rawValue || '').trim();
  const prefixed = raw.match(/^(user|char)-(\d+)$/i);
  if (prefixed) {
    return { type: prefixed[1].toLowerCase(), id: Number(prefixed[2]) };
  }

  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 0) {
    return { type: 'user', id: numeric };
  }

  return null;
}

function buildRaidSignupAbsenceRoutes({ db, sessionSecret }) {
  const router = express.Router();
  const effectiveSecret = sessionSecret || SESSION_SECRET || process.env.SESSION_SECRET || '';

  const isOfficerRequest = (req) => hasOfficerAccess(req, { sessionSecret: effectiveSecret, db });

  router.get('/raid-signup-absence-targets', (req, res) => {
    try {
      const officerMode = isOfficerRequest(req);
      if (!officerMode) {
        return res.status(403).json({ error: 'Officer authentication required' });
      }

      return res.json(listAbsenceTargets(db));
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.get('/raid-signup-absences', (req, res) => {
    try {
      const officerMode = isOfficerRequest(req);
      const bnetSession = getBattleNetSessionFromRequest(req);
      const currentUserId = Number(bnetSession?.userId || 0);

      if (!officerMode && !currentUserId) {
        return res.status(401).json({ error: 'Battle.net authentication required' });
      }

      const namesByUserId = listClaimedCharactersByUser(db);
      const userRows = officerMode
        ? db.prepare(`
            SELECT a.id, a.user_id, a.start_date, a.end_date, a.note, a.created_at, a.updated_at, u.battletag
            FROM raid_signup_absences a
            LEFT JOIN users u ON u.id = a.user_id
            ORDER BY a.start_date ASC, a.id ASC
          `).all()
        : db.prepare(`
            SELECT a.id, a.user_id, a.start_date, a.end_date, a.note, a.created_at, a.updated_at, u.battletag
            FROM raid_signup_absences a
            LEFT JOIN users u ON u.id = a.user_id
            WHERE a.user_id = ?
            ORDER BY a.start_date ASC, a.id ASC
          `).all(currentUserId);

      const userAbsences = mapUserAbsenceRows(userRows, namesByUserId, currentUserId, officerMode);
      if (!officerMode) {
        return res.json(userAbsences);
      }

      const charRows = db.prepare(`
        SELECT a.id, a.roster_id, a.start_date, a.end_date, a.note, a.created_at, a.updated_at,
               r.name AS roster_name, r.user_id, u.battletag
        FROM raid_signup_character_absences a
        INNER JOIN roster r ON r.id = a.roster_id
        LEFT JOIN users u ON u.id = r.user_id
        ORDER BY a.start_date ASC, a.id ASC
      `).all();

      const allRows = [...userAbsences, ...mapCharacterAbsenceRows(charRows, officerMode)]
        .sort((a, b) => {
          const dateA = String(a.start_date || '');
          const dateB = String(b.start_date || '');
          if (dateA !== dateB) return dateA.localeCompare(dateB);
          return String(a.id).localeCompare(String(b.id));
        });

      return res.json(allRows);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.post('/raid-signup-absences', (req, res) => {
    try {
      const officerMode = isOfficerRequest(req);
      const bnetSession = getBattleNetSessionFromRequest(req);
      const sessionUserId = Number(bnetSession?.userId || 0);
      const requestedUserId = Number(req.body?.user_id || 0);
      const requestedRosterId = Number(req.body?.roster_id || 0);

      if (officerMode && requestedRosterId > 0) {
        const roster = db.prepare('SELECT id, user_id, name FROM roster WHERE id = ?').get(requestedRosterId);
        if (!roster) {
          return res.status(400).json({ error: 'Selected character does not exist.' });
        }

        const startDate = String(req.body?.start_date || '').trim();
        const endDate = String(req.body?.end_date || '').trim();
        const note = String(req.body?.note || '').trim();

        if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
          return res.status(400).json({ error: 'Dates must use YYYY-MM-DD format.' });
        }
        if (startDate > endDate) {
          return res.status(400).json({ error: 'Start date must be before or equal to end date.' });
        }

        const info = db.prepare(`
          INSERT INTO raid_signup_character_absences (roster_id, created_by_user_id, start_date, end_date, note, updated_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(requestedRosterId, sessionUserId > 0 ? sessionUserId : null, startDate, endDate, note);

        const row = db.prepare(`
          SELECT a.id, a.roster_id, a.start_date, a.end_date, a.note, a.created_at, a.updated_at,
                 r.name AS roster_name, r.user_id, u.battletag
          FROM raid_signup_character_absences a
          INNER JOIN roster r ON r.id = a.roster_id
          LEFT JOIN users u ON u.id = r.user_id
          WHERE a.id = ?
        `).get(info.lastInsertRowid);

        return res.json(mapCharacterAbsenceRows([row], true)[0]);
      }

      const userId = officerMode && requestedUserId > 0 ? requestedUserId : sessionUserId;

      if (!userId) {
        return res.status(401).json({ error: 'Battle.net authentication required' });
      }

      const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
      if (!user) {
        return res.status(400).json({ error: 'Selected user does not exist.' });
      }

      const startDate = String(req.body?.start_date || '').trim();
      const endDate = String(req.body?.end_date || '').trim();
      const note = String(req.body?.note || '').trim();

      if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
        return res.status(400).json({ error: 'Dates must use YYYY-MM-DD format.' });
      }
      if (startDate > endDate) {
        return res.status(400).json({ error: 'Start date must be before or equal to end date.' });
      }

      const info = db.prepare(`
        INSERT INTO raid_signup_absences (user_id, start_date, end_date, note, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(userId, startDate, endDate, note);

      const row = db.prepare(`
        SELECT a.id, a.user_id, a.start_date, a.end_date, a.note, a.created_at, a.updated_at, u.battletag
        FROM raid_signup_absences a
        LEFT JOIN users u ON u.id = a.user_id
        WHERE a.id = ?
      `).get(info.lastInsertRowid);

      const namesByUserId = listClaimedCharactersByUser(db);
      return res.json(mapUserAbsenceRows([row], namesByUserId, sessionUserId, officerMode)[0]);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.put('/raid-signup-absences/:id', (req, res) => {
    try {
      const key = parseAbsenceKey(req.params.id);
      if (!key) {
        return res.status(400).json({ error: 'Invalid absence id.' });
      }

      const officerMode = isOfficerRequest(req);
      const bnetSession = getBattleNetSessionFromRequest(req);
      const sessionUserId = Number(bnetSession?.userId || 0);
      if (!officerMode && !sessionUserId) {
        return res.status(401).json({ error: 'Battle.net authentication required' });
      }

      const startDate = String(req.body?.start_date || '').trim();
      const endDate = String(req.body?.end_date || '').trim();
      const note = String(req.body?.note || '').trim();

      if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
        return res.status(400).json({ error: 'Dates must use YYYY-MM-DD format.' });
      }
      if (startDate > endDate) {
        return res.status(400).json({ error: 'Start date must be before or equal to end date.' });
      }

      if (key.type === 'char') {
        if (!officerMode) {
          return res.status(403).json({ error: 'Only officers can edit character absences.' });
        }

        const existingChar = db.prepare('SELECT * FROM raid_signup_character_absences WHERE id = ?').get(key.id);
        if (!existingChar) {
          return res.status(404).json({ error: 'Absence not found.' });
        }

        const requestedRosterId = Number(req.body?.roster_id || 0);
        const targetRosterId = requestedRosterId > 0 ? requestedRosterId : Number(existingChar.roster_id);
        const roster = db.prepare('SELECT id FROM roster WHERE id = ?').get(targetRosterId);
        if (!roster) {
          return res.status(400).json({ error: 'Selected character does not exist.' });
        }

        db.prepare(`
          UPDATE raid_signup_character_absences
          SET roster_id = ?, start_date = ?, end_date = ?, note = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(targetRosterId, startDate, endDate, note, key.id);

        const row = db.prepare(`
          SELECT a.id, a.roster_id, a.start_date, a.end_date, a.note, a.created_at, a.updated_at,
                 r.name AS roster_name, r.user_id, u.battletag
          FROM raid_signup_character_absences a
          INNER JOIN roster r ON r.id = a.roster_id
          LEFT JOIN users u ON u.id = r.user_id
          WHERE a.id = ?
        `).get(key.id);

        return res.json(mapCharacterAbsenceRows([row], true)[0]);
      }

      const existing = db.prepare('SELECT * FROM raid_signup_absences WHERE id = ?').get(key.id);
      if (!existing) {
        return res.status(404).json({ error: 'Absence not found.' });
      }

      if (!officerMode && Number(existing.user_id) !== sessionUserId) {
        return res.status(403).json({ error: 'You can only edit your own absences.' });
      }

      const requestedUserId = Number(req.body?.user_id || 0);
      const targetUserId = officerMode && requestedUserId > 0 ? requestedUserId : Number(existing.user_id);

      if (officerMode && requestedUserId > 0) {
        const user = db.prepare('SELECT id FROM users WHERE id = ?').get(targetUserId);
        if (!user) {
          return res.status(400).json({ error: 'Selected user does not exist.' });
        }
      }

      db.prepare(`
        UPDATE raid_signup_absences
        SET user_id = ?, start_date = ?, end_date = ?, note = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(targetUserId, startDate, endDate, note, key.id);

      const row = db.prepare(`
        SELECT a.id, a.user_id, a.start_date, a.end_date, a.note, a.created_at, a.updated_at, u.battletag
        FROM raid_signup_absences a
        LEFT JOIN users u ON u.id = a.user_id
        WHERE a.id = ?
      `).get(key.id);
      const namesByUserId = listClaimedCharactersByUser(db);
      return res.json(mapUserAbsenceRows([row], namesByUserId, sessionUserId, officerMode)[0]);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.delete('/raid-signup-absences/:id', (req, res) => {
    try {
      const key = parseAbsenceKey(req.params.id);
      if (!key) {
        return res.status(400).json({ error: 'Invalid absence id.' });
      }

      const officerMode = isOfficerRequest(req);
      const bnetSession = getBattleNetSessionFromRequest(req);
      const userId = Number(bnetSession?.userId || 0);
      if (!officerMode && !userId) {
        return res.status(401).json({ error: 'Battle.net authentication required' });
      }

      if (key.type === 'char') {
        if (!officerMode) {
          return res.status(403).json({ error: 'Only officers can delete character absences.' });
        }

        const existingChar = db.prepare('SELECT id FROM raid_signup_character_absences WHERE id = ?').get(key.id);
        if (!existingChar) {
          return res.status(404).json({ error: 'Absence not found.' });
        }

        db.prepare('DELETE FROM raid_signup_character_absences WHERE id = ?').run(key.id);
        return res.json({ ok: true, id: `char-${key.id}` });
      }

      const existing = db.prepare('SELECT * FROM raid_signup_absences WHERE id = ?').get(key.id);
      if (!existing) {
        return res.status(404).json({ error: 'Absence not found.' });
      }

      if (!officerMode && Number(existing.user_id) !== userId) {
        return res.status(403).json({ error: 'You can only delete your own absences.' });
      }

      db.prepare('DELETE FROM raid_signup_absences WHERE id = ?').run(key.id);
      return res.json({ ok: true, id: `user-${key.id}` });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = buildRaidSignupAbsenceRoutes;
