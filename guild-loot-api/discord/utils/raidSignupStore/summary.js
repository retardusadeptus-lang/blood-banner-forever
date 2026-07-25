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
  classIconForEntry,
  formatSignupSummary
};
