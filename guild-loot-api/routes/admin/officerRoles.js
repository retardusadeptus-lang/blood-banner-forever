const express = require('express');
const {
  hasAdminAccess,
  hasOfficerAccess,
  getBattleNetSessionFromRequest,
  getBattleNetRoleForUser,
  isPrimaryAdminUserId,
  isPrimaryAdminBattletag
} = require('../../middleware/auth');

function buildAdminOfficerRolesRoutes({ db, sessionSecret }) {
  const router = express.Router();

  const requireAdmin = (req, res, next) => {
    if (!hasAdminAccess(req, { sessionSecret, db })) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }
    return next();
  };

  const requireOfficer = (req, res, next) => {
    if (!hasOfficerAccess(req, { sessionSecret, db })) {
      return res.status(401).json({ error: 'Officer authentication required' });
    }
    return next();
  };

  const resolveRoleActor = (req, res) => {
    const bnetSession = getBattleNetSessionFromRequest(req);
    const actorUserId = Number(bnetSession?.userId || 0);
    if (!actorUserId) {
      res.status(401).json({ error: 'Battle.net admin login is required for role management.' });
      return null;
    }

    const actorRole = getBattleNetRoleForUser(db, actorUserId);
    if (actorRole !== 'admin') {
      res.status(401).json({ error: 'Admin role required.' });
      return null;
    }

    return {
      actorUserId,
      isPrimaryAdmin: isPrimaryAdminUserId(db, actorUserId)
    };
  };

  router.get('/officer-roles', requireOfficer, (req, res) => {
    try {
      const rows = db.prepare('SELECT id, role_name, primary_officer_id, backup_officer_ids_json FROM officer_roles ORDER BY role_name').all();
      const mapped = rows.map(row => ({
        id: row.id,
        role_name: row.role_name,
        primary_officer_id: row.primary_officer_id,
        backup_officer_ids: JSON.parse(row.backup_officer_ids_json || '[]')
      }));
      res.json(mapped);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/officer-roles', requireOfficer, (req, res) => {
    try {
      const roles = Array.isArray(req.body) ? req.body : [];
      const deleteAll = db.prepare('DELETE FROM officer_roles');
      const insertRole = db.prepare(`
        INSERT INTO officer_roles (role_name, primary_officer_id, backup_officer_ids_json)
        VALUES (?, ?, ?)
      `);

      const saveAll = db.transaction(() => {
        deleteAll.run();
        roles.forEach(role => {
          if (!role?.role_name) return;
          insertRole.run(
            String(role.role_name).trim(),
            role.primary_officer_id || null,
            JSON.stringify(Array.isArray(role.backup_officer_ids) ? role.backup_officer_ids : [])
          );
        });
      });

      saveAll();
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/bnet-access-roles', requireAdmin, (req, res) => {
    try {
      const users = db.prepare('SELECT id, battletag, blizzard_id FROM users ORDER BY battletag COLLATE NOCASE').all();
      const explicitRoles = new Map(
        db.prepare('SELECT user_id, role, updated_at FROM bnet_user_roles').all().map(row => [
          Number(row.user_id),
          {
            role: String(row.role || '').toLowerCase(),
            updated_at: row.updated_at
          }
        ])
      );

      const rows = users
        .map(user => {
          const userId = Number(user.id);
          const explicit = explicitRoles.get(userId);
          const computedRole = isPrimaryAdminBattletag(user.battletag)
            ? 'admin'
            : (explicit?.role || null);
          if (computedRole !== 'admin' && computedRole !== 'officer' && computedRole !== 'guild_member') return null;

          return {
            user_id: userId,
            battletag: String(user.battletag || ''),
            blizzard_id: String(user.blizzard_id || ''),
            role: computedRole,
            updated_at: explicit?.updated_at || null
          };
        })
        .filter(Boolean)
        .sort((a, b) => {
          const rankA = a.role === 'admin' ? 0 : a.role === 'officer' ? 1 : 2;
          const rankB = b.role === 'admin' ? 0 : b.role === 'officer' ? 1 : 2;
          if (rankA !== rankB) return rankA - rankB;
          return String(a.battletag || '').localeCompare(String(b.battletag || ''));
        });

      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get('/bnet-access-role-candidates', requireAdmin, (req, res) => {
    try {
      const users = db.prepare(`
        SELECT id, battletag, blizzard_id, created_at
        FROM users
        ORDER BY battletag COLLATE NOCASE
      `).all();

      const byUserId = new Map(
        db.prepare('SELECT user_id, role FROM bnet_user_roles').all().map(row => [Number(row.user_id), String(row.role || '').toLowerCase()])
      );

      res.json(users.map(user => ({
        user_id: Number(user.id),
        battletag: String(user.battletag || ''),
        blizzard_id: String(user.blizzard_id || ''),
        created_at: user.created_at,
        role: isPrimaryAdminBattletag(user.battletag) ? 'admin' : (byUserId.get(Number(user.id)) || null)
      })));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/bnet-access-roles/:userId', requireAdmin, (req, res) => {
    try {
      const actor = resolveRoleActor(req, res);
      if (!actor) return;

      const userId = Number(req.params.userId || 0);
      const requestedRole = String(req.body?.role || '').trim().toLowerCase();
      if (!userId) {
        return res.status(400).json({ error: 'Valid userId is required.' });
      }
      if (requestedRole !== 'guild_member' && requestedRole !== 'officer' && requestedRole !== 'admin') {
        return res.status(400).json({ error: "Role must be 'guild_member', 'officer', or 'admin'." });
      }

      const user = db.prepare('SELECT id, battletag, blizzard_id FROM users WHERE id = ?').get(userId);
      if (!user) {
        return res.status(404).json({ error: 'Battle.net user not found.' });
      }

      const existingRole = isPrimaryAdminBattletag(user.battletag)
        ? 'admin'
        : String(db.prepare('SELECT role FROM bnet_user_roles WHERE user_id = ?').get(userId)?.role || '').toLowerCase();

      const isAdminRoleChange = requestedRole === 'admin' || existingRole === 'admin';
      if (isAdminRoleChange && !actor.isPrimaryAdmin) {
        return res.status(403).json({ error: 'Only the primary admin can promote or demote admins.' });
      }

      if (isPrimaryAdminBattletag(user.battletag) && requestedRole !== 'admin') {
        return res.status(403).json({ error: 'The primary admin role cannot be changed.' });
      }

      const grantedByUserId = actor.actorUserId || null;

      db.prepare(`
        INSERT INTO bnet_user_roles (user_id, role, granted_by_user_id, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
          role = excluded.role,
          granted_by_user_id = excluded.granted_by_user_id,
          updated_at = CURRENT_TIMESTAMP
      `).run(userId, requestedRole, grantedByUserId);

      return res.json({
        ok: true,
        assignment: {
          user_id: Number(user.id),
          battletag: String(user.battletag || ''),
          blizzard_id: String(user.blizzard_id || ''),
          role: requestedRole
        }
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });

  router.delete('/bnet-access-roles/:userId', requireAdmin, (req, res) => {
    try {
      const actor = resolveRoleActor(req, res);
      if (!actor) return;

      const userId = Number(req.params.userId || 0);
      if (!userId) {
        return res.status(400).json({ error: 'Valid userId is required.' });
      }

      const targetUser = db.prepare('SELECT id, battletag FROM users WHERE id = ?').get(userId);
      if (!targetUser) {
        return res.status(404).json({ error: 'Battle.net user not found.' });
      }

      if (isPrimaryAdminBattletag(targetUser.battletag)) {
        return res.status(403).json({ error: 'Primary admin role cannot be removed.' });
      }

      const existing = db.prepare('SELECT user_id, role FROM bnet_user_roles WHERE user_id = ?').get(userId);
      if (!existing) {
        return res.status(404).json({ error: 'Role assignment not found.' });
      }

      const existingRole = String(existing.role || '').toLowerCase();
      if (existingRole === 'admin' && !actor.isPrimaryAdmin) {
        return res.status(403).json({ error: 'Only the primary admin can promote or demote admins.' });
      }

      db.prepare('DELETE FROM bnet_user_roles WHERE user_id = ?').run(userId);
      return res.json({ ok: true, user_id: userId });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });

  return router;
}

module.exports = buildAdminOfficerRolesRoutes;
