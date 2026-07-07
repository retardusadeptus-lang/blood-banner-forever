const ROLE_EMOJI_NAME = {
  tank: 'Tank',
  healer: 'Healer',
  melee: 'Melee',
  ranged: 'Ranged'
};

const ROLE_FALLBACK = {
  tank: '🛡️',
  healer: '💚',
  melee: '⚔️',
  ranged: '🏹'
};

const CLASS_EMOJI_NAME = {
  warrior: 'Warrior',
  paladin: 'Paladin',
  hunter: 'Hunter',
  rogue: 'Rogue',
  priest: 'Priest',
  shaman: 'Shaman',
  mage: 'Mage',
  warlock: 'Warlock',
  druid: 'Druid'
};

const CLASS_FALLBACK = {
  warrior: '🛡️',
  paladin: '🔨',
  hunter: '🏹',
  rogue: '🗡️',
  priest: '✨',
  shaman: '⚡',
  mage: '❄️',
  warlock: '🔥',
  druid: '🌙'
};

function toEmojiToken(emoji) {
  if (!emoji || !emoji.id || !emoji.name) return '';
  return `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`;
}

function resolveNamedEmoji(guild, desiredName, fallback = '') {
  if (!guild || !guild.emojis || !guild.emojis.cache || !desiredName) {
    return fallback;
  }

  const wanted = String(desiredName).toLowerCase();
  const exact = guild.emojis.cache.find(emoji => String(emoji.name || '').toLowerCase() === wanted);
  if (exact) return toEmojiToken(exact);

  const relaxed = guild.emojis.cache.find(emoji => String(emoji.name || '').toLowerCase().includes(wanted));
  if (relaxed) return toEmojiToken(relaxed);

  return fallback;
}

function resolveRoleEmojiToken(guild, roleBucket) {
  const key = String(roleBucket || '').toLowerCase();
  return resolveNamedEmoji(guild, ROLE_EMOJI_NAME[key], ROLE_FALLBACK[key] || '');
}

function resolveClassEmojiToken(guild, className) {
  const key = String(className || '').toLowerCase();
  return resolveNamedEmoji(guild, CLASS_EMOJI_NAME[key], CLASS_FALLBACK[key] || '');
}

module.exports = {
  resolveNamedEmoji,
  resolveRoleEmojiToken,
  resolveClassEmojiToken
};
