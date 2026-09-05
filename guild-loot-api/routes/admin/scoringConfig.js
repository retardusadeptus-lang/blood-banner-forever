const express = require('express');

function parseGuildRoleRanks(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function buildAdminScoringConfigRoutes({ db }) {
  const router = express.Router();

  router.get('/scoring-config', (req, res) => {
    try {
      const row = db.prepare('SELECT * FROM scoring_config_values WHERE id = 1').get();
      res.json(row ? {
        parseWeight: row.parse_weight,
        supportMulti: row.support_multi,
        consBonus: row.cons_bonus,
        enchantBonus: row.enchant_bonus,
        gemBonus: row.gem_bonus,
        attWeight: row.att_weight,
        afkPenalty: row.afk_penalty,
        guildRoleRanks: parseGuildRoleRanks(row.guild_role_ranks)
      } : {
        parseWeight: 1,
        supportMulti: 1.5,
        consBonus: 10,
        enchantBonus: 10,
        gemBonus: 10,
        attWeight: 0.5,
        afkPenalty: 5,
        guildRoleRanks: []
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.put('/scoring-config', (req, res) => {
    try {
      const payload = req.body || {};
      db.prepare(`
        INSERT INTO scoring_config_values (id, parse_weight, support_multi, cons_bonus, enchant_bonus, gem_bonus, att_weight, afk_penalty, guild_role_ranks)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          parse_weight = excluded.parse_weight,
          support_multi = excluded.support_multi,
          cons_bonus = excluded.cons_bonus,
          enchant_bonus = excluded.enchant_bonus,
          gem_bonus = excluded.gem_bonus,
          att_weight = excluded.att_weight,
          afk_penalty = excluded.afk_penalty,
          guild_role_ranks = excluded.guild_role_ranks
      `).run(
        payload.parseWeight ?? 1,
        payload.supportMulti ?? 1.5,
        payload.consBonus ?? 10,
        payload.enchantBonus ?? 10,
        payload.gemBonus ?? 10,
        payload.attWeight ?? 0.5,
        payload.afkPenalty ?? 5,
        JSON.stringify(Array.isArray(payload.guildRoleRanks) ? payload.guildRoleRanks : [])
      );
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}

module.exports = buildAdminScoringConfigRoutes;
