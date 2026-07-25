const express = require('express');

function buildAdminOfficerRolesRoutes({ db }) {
  const router = express.Router();

  router.get('/officer-roles', (req, res) => {
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

  router.put('/officer-roles', (req, res) => {
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

  return router;
}

module.exports = buildAdminOfficerRolesRoutes;
