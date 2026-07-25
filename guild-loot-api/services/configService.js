function createConfigService(db) {
  function normalizeRoleList(value) {
    if (!Array.isArray(value)) return [];
    const unique = new Set();
    const out = [];

    value.forEach(entry => {
      const role = String(entry || '').trim();
      if (!role) return;
      const lowered = role.toLowerCase();
      if (unique.has(lowered)) return;
      unique.add(lowered);
      out.push(role);
    });

    return out.slice(0, 50);
  }

  function getDiscordBotConfigRow() {
    const row = db.prepare(`
      SELECT request_roles_json, signup_roles_json, bench_roles_json
      FROM discord_bot_config
      WHERE id = 1
    `).get();

    if (!row) {
      return { request_roles: [], signup_roles: [], bench_roles: [] };
    }

    const parse = (raw) => {
      try {
        const parsed = JSON.parse(raw || '[]');
        return normalizeRoleList(parsed);
      } catch (e) {
        return [];
      }
    };

    return {
      request_roles: parse(row.request_roles_json),
      signup_roles: parse(row.signup_roles_json),
      bench_roles: parse(row.bench_roles_json)
    };
  }

  return {
    normalizeRoleList,
    getDiscordBotConfigRow
  };
}

module.exports = createConfigService;
