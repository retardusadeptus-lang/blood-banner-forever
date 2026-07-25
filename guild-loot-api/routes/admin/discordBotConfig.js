const express = require('express');

function buildAdminDiscordBotConfigRoutes({ db, configService }) {
  const router = express.Router();
  const { normalizeRoleList, getDiscordBotConfigRow } = configService;

  router.get('/discord-bot-config', (req, res) => {
    try {
      res.json(getDiscordBotConfigRow());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/discord-bot-config', (req, res) => {
    try {
      const requestRoles = normalizeRoleList(req.body?.request_roles);
      const signupRoles = normalizeRoleList(req.body?.signup_roles);
      const benchRoles = normalizeRoleList(req.body?.bench_roles);

      db.prepare(`
        UPDATE discord_bot_config
        SET request_roles_json = ?, signup_roles_json = ?, bench_roles_json = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `).run(
        JSON.stringify(requestRoles),
        JSON.stringify(signupRoles),
        JSON.stringify(benchRoles)
      );

      res.json({
        ok: true,
        request_roles: requestRoles,
        signup_roles: signupRoles,
        bench_roles: benchRoles
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}

module.exports = buildAdminDiscordBotConfigRoutes;
