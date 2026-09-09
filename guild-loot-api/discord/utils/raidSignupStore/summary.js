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

function normalizeStatusKey(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'absence') return 'absent';
  return normalized;
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
    absent: [],
    absence: []
  };

  function signupIndexToken(value) {
    const n = Number(value || 0);
    if (!n) return '';
    return `\`${n}\``;
  }

  function entryLabel(entry, prefix = '') {
    const note = String(entry?.note || '').trim().slice(0, 180);
    const webSuffix = String(entry?.signup_source || '').toLowerCase() === 'website' ? ' 🌐' : '';
    const label = `${prefix}${entry.discord_username}${webSuffix}`;
    return note ? `${label} - ${note}` : label;
  }

  const resolveClassIcon = typeof options.classIconResolver === 'function'
    ? options.classIconResolver
    : classIconForEntry;

  entries.forEach(entry => {
    const status = normalizeStatusKey(entry.status);
    if (status === 'signup') {
      const bucket = String(entry.role_bucket || 'ranged').toLowerCase();
      const target = roleBuckets[bucket] || roleBuckets.ranged;
      const classIcon = resolveClassIcon(entry);
      const orderTag = entry.signup_order ? `${signupIndexToken(entry.signup_order)} ` : '';
      target.push(entryLabel(entry, `${orderTag}${classIcon}`));
      return;
    }

    if (status === 'absent') {
      const orderTag = entry.signup_order ? `${signupIndexToken(entry.signup_order)} ` : '';
      const classIcon = resolveClassIcon(entry);
      const absentLabel = entryLabel(entry, `${orderTag}${classIcon}`);
      statuses.absent.push(absentLabel);
      statuses.absence.push(absentLabel);
      return;
    }

    if (statuses[status]) {
      const orderTag = entry.signup_order ? `${signupIndexToken(entry.signup_order)} ` : '';
      const classIcon = resolveClassIcon(entry);
      statuses[status].push(entryLabel(entry, `${orderTag}${classIcon}`));
    }
  });

  return { roleBuckets, statuses };
}

module.exports = {
  classIconForEntry,
  formatSignupSummary
};
