const express = require('express');
const { getDiscordClient } = require('../../bot');

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

  router.get('/discord-bot-roles', async (req, res) => {
    try {
      const guildId = String(process.env.DISCORD_GUILD_ID || '').trim();
      const client = getDiscordClient();
      if (!guildId || !client) {
        res.json([]);
        return;
      }

      const guild = await client.guilds.fetch(guildId);
      const roles = await guild.roles.fetch();
      res.json(
        Array.from(roles.values())
          .filter(role => !role.managed)
          .sort((left, right) => right.position - left.position)
          .map(role => ({ id: String(role.id), name: String(role.name), position: role.position }))
      );
    } catch (e) {
      res.status(502).json({ error: `Unable to load Discord roles: ${e.message}` });
    }
  });

  router.put('/discord-bot-config', (req, res) => {
    try {
      const requestRoles = normalizeRoleList(req.body?.request_roles);
      const signupRoles = normalizeRoleList(req.body?.signup_roles);

      db.prepare(`
        UPDATE discord_bot_config
        SET request_roles_json = ?, signup_roles_json = ?, bench_roles_json = '[]', updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `).run(
        JSON.stringify(requestRoles),
        JSON.stringify(signupRoles)
      );

      res.json({
        ok: true,
        request_roles: requestRoles,
        signup_roles: signupRoles
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}

module.exports = buildAdminDiscordBotConfigRoutes;
