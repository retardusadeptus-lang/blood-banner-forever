function normalizeRoles(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  value.forEach(entry => {
    const role = String(entry || '').trim();
    if (!role) return;
    const key = role.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(role);
  });
  return out;
}

function getConfigForPermission(db, permissionKey) {
  const row = db.prepare(`
    SELECT request_roles_json, signup_roles_json, bench_roles_json
    FROM discord_bot_config
    WHERE id = 1
  `).get();

  if (!row) return [];

  let key = 'request_roles_json';
  if (permissionKey === 'signup') key = 'signup_roles_json';
  if (permissionKey === 'bench') key = 'bench_roles_json';

  try {
    return normalizeRoles(JSON.parse(row[key] || '[]'));
  } catch {
    return [];
  }
}

function getMemberRoles(interaction) {
  if (!interaction.inGuild()) return [];
  const member = interaction.member;
  if (!member || !member.roles) return [];

  if (member.roles.cache && typeof member.roles.cache.map === 'function') {
    return member.roles.cache.map(role => ({
      id: String(role.id || ''),
      name: String(role.name || '')
    }));
  }

  if (Array.isArray(member.roles)) {
    return member.roles.map(roleId => ({ id: String(roleId), name: '' }));
  }

  return [];
}

function hasConfiguredRole(interaction, roleToken) {
  if (!roleToken) return false;
  if (!interaction.inGuild()) return false;
  const token = String(roleToken).trim().toLowerCase();
  if (!token) return false;

  return getMemberRoles(interaction).some(role => {
    const idMatch = String(role.id || '').toLowerCase() === token;
    const nameMatch = String(role.name || '').toLowerCase() === token;
    return idMatch || nameMatch;
  });
}

async function enforceRoleAccess(interaction, db, permissionKey) {
  const configuredRoles = getConfigForPermission(db, permissionKey);
  // Empty role list means unrestricted for that command.
  if (configuredRoles.length === 0) return true;

  const allowed = configuredRoles.some(roleToken => hasConfiguredRole(interaction, roleToken));
  if (allowed) return true;

  await interaction.reply({
    content: 'You do not have permission to use this command. Contact an officer to update Discord Bot Config.',
    ephemeral: true
  });
  return false;
}

function escapeLike(value) {
  return value.replace(/([\\%_])/g, '\\$1');
}

async function respondRosterAutocomplete(interaction, db) {
  const focused = interaction.options.getFocused() || '';
  const likeInput = `%${escapeLike(String(focused).trim())}%`;

  const rows = db
    .prepare(`
      SELECT id, name
      FROM roster
      WHERE name LIKE ? ESCAPE '\\'
      ORDER BY name ASC
      LIMIT 25
    `)
    .all(likeInput);

  await interaction.respond(rows.map(row => ({ name: row.name, value: row.id })));
}

module.exports = {
  enforceRoleAccess,
  respondRosterAutocomplete,
  escapeLike
};
