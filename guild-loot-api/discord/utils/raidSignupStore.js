function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function normalizeNameToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[0-9]+$/g, '');
}

function ensureRosterPlayerForSignup(db, playerName, specId) {
  const normalized = normalizeNameToken(playerName);
  const roster = db.prepare('SELECT id, name, spec_id, in_raid FROM roster').all();

  const existing = roster.find(row => normalizeNameToken(row.name) === normalized);
  if (existing) {
    db.prepare(`
      UPDATE roster
      SET in_raid = 1,
          spec_id = COALESCE(?, spec_id)
      WHERE id = ?
    `).run(specId || null, existing.id);
    return existing.id;
  }

  const info = db.prepare(`
    INSERT INTO roster (name, spec_id, in_raid)
    VALUES (?, ?, 1)
  `).run(String(playerName || '').trim(), specId || null);

  return Number(info.lastInsertRowid);
}

function getRoleBucketForSpec(spec) {
  const slug = String(spec?.slug || '').toLowerCase();
  const specName = String(spec?.spec || '').toLowerCase();
  const className = String(spec?.class || '').toLowerCase();

  if (
    slug.includes('prot-') ||
    specName.includes('prot') ||
    specName.includes('(tank)')
  ) {
    return 'tank';
  }

  if (
    specName.includes('holy') ||
    specName.includes('resto') ||
    specName.includes('restoration') ||
    specName.includes('discipline')
  ) {
    return 'healer';
  }

  if (
    className === 'warrior' ||
    className === 'rogue' ||
    (className === 'paladin' && specName.includes('ret')) ||
    (className === 'shaman' && specName.includes('enhance')) ||
    (className === 'druid' && specName.includes('feral'))
  ) {
    return 'melee';
  }

  return 'ranged';
}

function listTemplates(db) {
  const rows = db.prepare(`
    SELECT id, name, description, starts_at_text, recurrence_rule, recurrence_days_json, recurrence_delay_hours, recurrence_enabled, allowed_spec_ids_json, is_active
    FROM raid_signup_templates
    ORDER BY name
  `).all();

  return rows.map(row => ({
    ...row,
    recurrence_days: parseJsonArray(row.recurrence_days_json).map(v => Number(v)).filter(v => Number.isInteger(v) && v >= 0 && v <= 6),
    recurrence_delay_hours: Number.isFinite(Number(row.recurrence_delay_hours)) ? Number(row.recurrence_delay_hours) : 2,
    recurrence_enabled: row.recurrence_enabled === 1,
    allowed_spec_ids: parseJsonArray(row.allowed_spec_ids_json).map(v => Number(v)).filter(Boolean),
    is_active: row.is_active === 1
  }));
}

function getTemplateById(db, id) {
  const row = db.prepare(`
    SELECT id, name, description, starts_at_text, recurrence_rule, recurrence_days_json, recurrence_delay_hours, recurrence_enabled, allowed_spec_ids_json, is_active
    FROM raid_signup_templates
    WHERE id = ?
  `).get(id);

  if (!row) return null;
  return {
    ...row,
    recurrence_days: parseJsonArray(row.recurrence_days_json).map(v => Number(v)).filter(v => Number.isInteger(v) && v >= 0 && v <= 6),
    recurrence_delay_hours: Number.isFinite(Number(row.recurrence_delay_hours)) ? Number(row.recurrence_delay_hours) : 2,
    recurrence_enabled: row.recurrence_enabled === 1,
    allowed_spec_ids: parseJsonArray(row.allowed_spec_ids_json).map(v => Number(v)).filter(Boolean),
    is_active: row.is_active === 1
  };
}

function listOpenEvents(db) {
  return db.prepare(`
    SELECT id, template_id, title, description, scheduled_for, recurrence_instance, public_groups, status, discord_channel_id, discord_message_id, created_at
    FROM raid_signup_events
    WHERE status = 'open'
    ORDER BY id DESC
  `).all();
}

function listManageableEvents(db) {
  return db.prepare(`
    SELECT id, template_id, title, description, scheduled_for, recurrence_instance, public_groups, status, discord_channel_id, discord_message_id, created_at
    FROM raid_signup_events
    WHERE status <> 'archived'
    ORDER BY id DESC
  `).all();
}

function listArchivedEvents(db) {
  return db.prepare(`
    SELECT id, template_id, title, description, scheduled_for, recurrence_instance, public_groups, status, discord_channel_id, discord_message_id, created_at
    FROM raid_signup_events
    WHERE status = 'archived'
    ORDER BY id DESC
  `).all();
}

function listPublicActiveEvents(db) {
  return db.prepare(`
    SELECT id, template_id, title, description, scheduled_for, recurrence_instance, public_groups, status, discord_channel_id, discord_message_id, created_at
    FROM raid_signup_events
    WHERE status IN ('open', 'locked')
    ORDER BY id DESC
  `).all();
}

function getEventById(db, eventId) {
  return db.prepare(`
    SELECT id, template_id, title, description, scheduled_for, recurrence_instance, public_groups, status, discord_channel_id, discord_message_id, created_at
    FROM raid_signup_events
    WHERE id = ?
    LIMIT 1
  `).get(eventId);
}

function createEventFromTemplate(db, templateId, options = {}) {
  const template = getTemplateById(db, templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  const scheduledFor = String(options.scheduledFor || '').trim() || null;
  const recurrenceInstance = String(options.recurrenceInstance || '').trim() || null;
  const title = String(options.title || template.name || 'Raid Signup').trim();
  const description = String(options.description || template.description || '').trim();

  const info = db.prepare(`
    INSERT INTO raid_signup_events (template_id, title, description, scheduled_for, recurrence_instance, status)
    VALUES (?, ?, ?, ?, ?, 'open')
  `).run(template.id, title, description, scheduledFor, recurrenceInstance);

  return getEventById(db, Number(info.lastInsertRowid));
}

function getAllowedSpecsForEvent(db, eventId) {
  return db.prepare('SELECT id, class, spec, slug, icon_small, icon_medium, icon_large, color FROM specs ORDER BY class, spec').all();
}

function getAvailableClassesForEvent(db, eventId) {
  const specs = getAllowedSpecsForEvent(db, eventId);
  return [...new Set(specs.map(spec => spec.class).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function getAllowedSpecsByClass(db, eventId, className) {
  const specs = getAllowedSpecsForEvent(db, eventId);
  return specs.filter(spec => String(spec.class).toLowerCase() === String(className || '').toLowerCase());
}

function getEventClassFilter(db, eventId) {
  return db.prepare(`
    SELECT selected_class
    FROM raid_signup_event_filters
    WHERE event_id = ?
    LIMIT 1
  `).get(eventId);
}

function setEventClassFilter(db, eventId, selectedClass) {
  db.prepare(`
    INSERT INTO raid_signup_event_filters (event_id, selected_class, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(event_id)
    DO UPDATE SET selected_class = excluded.selected_class, updated_at = CURRENT_TIMESTAMP
  `).run(eventId, String(selectedClass || '').trim());
}

function upsertDraft(db, eventId, discordUserId, specId) {
  db.prepare(`
    INSERT INTO raid_signup_drafts (event_id, discord_user_id, spec_id, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(event_id, discord_user_id)
    DO UPDATE SET spec_id = excluded.spec_id, updated_at = CURRENT_TIMESTAMP
  `).run(eventId, discordUserId, specId);
}

function upsertUserPreferredSpec(db, discordUserId, specId) {
  if (!specId) return;
  db.prepare(`
    INSERT INTO raid_signup_user_prefs (discord_user_id, spec_id, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(discord_user_id)
    DO UPDATE SET spec_id = excluded.spec_id, updated_at = CURRENT_TIMESTAMP
  `).run(discordUserId, specId);
}

function getUserPreferredSpec(db, discordUserId) {
  return db.prepare(`
    SELECT spec_id
    FROM raid_signup_user_prefs
    WHERE discord_user_id = ?
    LIMIT 1
  `).get(discordUserId);
}

function getDraft(db, eventId, discordUserId) {
  return db.prepare(`
    SELECT event_id, discord_user_id, spec_id
    FROM raid_signup_drafts
    WHERE event_id = ? AND discord_user_id = ?
    LIMIT 1
  `).get(eventId, discordUserId);
}

function upsertSignupEntry(db, eventId, discordUserId, discordUsername, status, specId) {
  let spec = null;
  let roleBucket = null;

  if (specId) {
    spec = db.prepare('SELECT id, class, spec, slug, icon_small, icon_medium, icon_large FROM specs WHERE id = ? LIMIT 1').get(specId);
    if (spec) {
      roleBucket = getRoleBucketForSpec(spec);
    }
  }

  if (String(status || '').toLowerCase() === 'signup') {
    ensureRosterPlayerForSignup(db, discordUsername, spec ? spec.id : null);
  }

  db.prepare(`
    INSERT INTO raid_signup_entries (event_id, discord_user_id, discord_username, status, spec_id, role_bucket, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(event_id, discord_user_id)
    DO UPDATE SET
      discord_username = excluded.discord_username,
      status = excluded.status,
      spec_id = excluded.spec_id,
      role_bucket = excluded.role_bucket,
      updated_at = CURRENT_TIMESTAMP
  `).run(eventId, discordUserId, discordUsername, status, spec ? spec.id : null, roleBucket);
}

function listEntriesForEvent(db, eventId) {
  const rows = db.prepare(`
    SELECT
      e.id,
      e.event_id,
      e.discord_user_id,
      e.discord_username,
      e.status,
      e.spec_id,
      e.role_bucket,
      e.updated_at,
      s.class AS spec_class,
      s.spec AS spec_name,
      s.slug AS spec_slug,
      s.icon_small,
      s.icon_medium,
      s.icon_large
    FROM raid_signup_entries e
    LEFT JOIN specs s ON s.id = e.spec_id
    WHERE e.event_id = ?
    ORDER BY e.updated_at DESC
  `).all(eventId);

  const byOrder = [...rows].sort((a, b) => {
    const aTime = Date.parse(a.updated_at || '') || 0;
    const bTime = Date.parse(b.updated_at || '') || 0;
    if (aTime !== bTime) return aTime - bTime;
    return Number(a.id) - Number(b.id);
  });

  const orderMap = new Map();
  byOrder.forEach((row, idx) => {
    orderMap.set(row.id, idx + 1);
  });

  return rows.map(row => ({ ...row, signup_order: orderMap.get(row.id) || null }));
}

function listGroupsForEvent(db, eventId) {
  return db.prepare(`
    SELECT g.id, g.event_id, g.group_number, g.group_name, g.slot_index, g.player_name, g.spec_id, g.note,
           s.class AS spec_class, s.spec AS spec_name, s.slug AS spec_slug, s.icon_small, s.icon_medium, s.icon_large
    FROM raid_signup_groups g
    LEFT JOIN specs s ON s.id = g.spec_id
    WHERE g.event_id = ?
    ORDER BY g.group_number, g.slot_index
  `).all(eventId);
}

function classIconForEntry(entry) {
  const className = String(entry?.spec_class || '').toLowerCase();
  if (className === 'warrior') return '🛡️ ';
  if (className === 'paladin') return '🔨 ';
  if (className === 'hunter') return '🏹 ';
  if (className === 'rogue') return '🗡️ ';
  if (className === 'priest') return '✨ ';
  if (className === 'shaman') return '⚡ ';
  if (className === 'mage') return '❄️ ';
  if (className === 'warlock') return '🔥 ';
  if (className === 'druid') return '🌙 ';
  return '';
}

function formatSignupSummary(entries, options = {}) {
  const roleBuckets = {
    tank: [],
    healer: [],
    melee: [],
    ranged: []
  };

  const statuses = {
    bench: [],
    late: [],
    tentative: [],
    absence: []
  };

  function signupIndexToken(value) {
    const n = Number(value || 0);
    if (!n) return '';
    return `\`${n}\``;
  }

  const resolveClassIcon = typeof options.classIconResolver === 'function'
    ? options.classIconResolver
    : classIconForEntry;

  entries.forEach(entry => {
    const status = String(entry.status || '').toLowerCase();
    if (status === 'signup') {
      const bucket = String(entry.role_bucket || 'ranged').toLowerCase();
      const target = roleBuckets[bucket] || roleBuckets.ranged;
      const classIcon = resolveClassIcon(entry);
      const orderTag = entry.signup_order ? `${signupIndexToken(entry.signup_order)} ` : '';
      target.push(`${orderTag}${classIcon}${entry.discord_username}`);
      return;
    }

    if (statuses[status]) {
      const orderTag = entry.signup_order ? `${signupIndexToken(entry.signup_order)} ` : '';
      const classIcon = resolveClassIcon(entry);
      statuses[status].push(`${orderTag}${classIcon}${entry.discord_username}`);
    }
  });

  return { roleBuckets, statuses };
}

module.exports = {
  getRoleBucketForSpec,
  listTemplates,
  getTemplateById,
  listOpenEvents,
  listManageableEvents,
  listPublicActiveEvents,
  getEventById,
  createEventFromTemplate,
  getAllowedSpecsForEvent,
  getAvailableClassesForEvent,
  getAllowedSpecsByClass,
  getEventClassFilter,
  setEventClassFilter,
  upsertDraft,
  upsertUserPreferredSpec,
  getUserPreferredSpec,
  getDraft,
  upsertSignupEntry,
  listEntriesForEvent,
  listGroupsForEvent,
  formatSignupSummary,
  ensureRosterPlayerForSignup
};
