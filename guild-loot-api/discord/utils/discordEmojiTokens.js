const path = require('path');
const DISCORD_ICON_TAGS = (() => {
  try {
    return require(path.resolve(__dirname, '..', '..', '..', 'discord_icons.json'));
  } catch (error) {
    return [];
  }
})();

const ROLE_EMOJI_NAME = {
  tank: 'role_tank',
  healer: 'role_healer',
  melee: 'role_melee',
  ranged: 'role_ranged'
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

const SPEC_EMOJI_NAME = {
  affliction: 'Affliction',
  demonology: 'Demonology',
  destruction: 'Destruction',
  balance: 'Balance',
  feral: 'Feral',
  guardian: 'Guardian',
  restoration: 'Restoration',
  resto: 'Restoration',
  beastmastery: 'Beast Mastery',
  beast: 'Beast Mastery',
  marksmanship: 'Marksmanship',
  marksman: 'Marksmanship',
  survival: 'Survival',
  arcane: 'Arcane',
  fire: 'Fire',
  frost: 'Frost',
  holy: 'Holy',
  protection: 'Protection',
  prot: 'Protection',
  retribution: 'Retribution',
  ret: 'Retribution',
  shadow: 'Shadow',
  elemental: 'Elemental',
  enhancement: 'Enhancement',
  enhance: 'Enhancement',
  assassination: 'Assassination',
  combat: 'Combat',
  sublety: 'Subtlety',
  subtlety: 'Subtlety'
};

const SPEC_FALLBACK = {
  affliction: '☠️',
  demonology: '🔮',
  destruction: '🔥',
  balance: '🌙',
  feral: '🐾',
  guardian: '🦡',
  restoration: '🌿',
  beastmastery: '🐺',
  marksmanship: '🎯',
  survival: '🧭',
  arcane: '✨',
  fire: '🔥',
  frost: '❄️',
  holy: '✨',
  protection: '🛡️',
  retribution: '⚔️',
  shadow: '🌑',
  elemental: '⚡',
  enhancement: '⚡',
  assassination: '🗡️',
  combat: '⚔️',
  sublety: '🕶️'
};

function toEmojiToken(emoji) {
  if (!emoji || !emoji.id || !emoji.name) return '';
  return `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`;
}

function resolveNamedEmoji(guildOrClient, desiredName, fallback = '') {
  if (!guildOrClient || !desiredName) {
    return fallback;
  }

  const emojiCaches = [];

  const addCache = (value) => {
    if (value && value.cache) emojiCaches.push(value.cache);
  };

  addCache(guildOrClient.application?.emojis);
  addCache(guildOrClient.client?.application?.emojis);
  addCache(guildOrClient.emojis);
  addCache(guildOrClient.client?.emojis);

  if (!emojiCaches.length) {
    return fallback;
  }

  const wanted = String(desiredName).toLowerCase();

  for (const cache of emojiCaches) {
    const exact = cache.find(emoji => String(emoji.name || '').toLowerCase() === wanted);
    if (exact) return toEmojiToken(exact);

    const relaxed = cache.find(emoji => String(emoji.name || '').toLowerCase().includes(wanted));
    if (relaxed) return toEmojiToken(relaxed);
  }

  return fallback;
}

function lookupDiscordIconEntryByName(name) {
  const raw = String(name || '').trim();
  if (!raw) return null;

  const normalized = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .replace(/^guild_/, '');

  return DISCORD_ICON_TAGS.find(icon => {
    const candidate = String(icon?.name || '').trim();
    if (!candidate) return false;
    const candidateNormalized = candidate.toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/^guild_/, '');
    return candidateNormalized === normalized || candidateNormalized.includes(normalized) || normalized.includes(candidateNormalized);
  }) || null;
}

function lookupDiscordIconTagByName(name) {
  return lookupDiscordIconEntryByName(name)?.discord_tag || '';
}

function resolveRoleEmojiToken(guild, roleBucket) {
  const key = String(roleBucket || '').toLowerCase();
  const exactTag = lookupDiscordIconTagByName(ROLE_EMOJI_NAME[key]) || lookupDiscordIconTagByName(key);
  if (exactTag) return exactTag;
  return resolveNamedEmoji(guild, ROLE_EMOJI_NAME[key], ROLE_FALLBACK[key] || '');
}

function resolveClassEmojiToken(guild, className) {
  const key = String(className || '').toLowerCase();
  const exactTag = lookupDiscordIconTagByName(CLASS_EMOJI_NAME[key]) || lookupDiscordIconTagByName(key);
  if (exactTag) return exactTag;
  return resolveNamedEmoji(guild, CLASS_EMOJI_NAME[key], CLASS_FALLBACK[key] || '');
}

function resolveClassEmojiData(guild, className) {
  const key = String(className || '').toLowerCase();
  const iconEntry = lookupDiscordIconEntryByName(CLASS_EMOJI_NAME[key]) || lookupDiscordIconEntryByName(key);
  if (iconEntry) {
    return { id: String(iconEntry.id), name: String(iconEntry.name), animated: false };
  }

  const resolved = resolveNamedEmoji(guild, CLASS_EMOJI_NAME[key], '');
  if (!resolved) return null;

  const match = /<a?:([^:]+):([0-9]+)>/.exec(resolved);
  if (!match) return null;
  return { id: match[2], name: match[1], animated: match[0].startsWith('<a:') };
}

function normalizeEmojiNameCandidates(value) {
  const raw = String(value || '').trim();
  if (!raw) return [];

  const normalized = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .replace(/^guild_/, '');

  const names = new Set();
  const base = String(value || '').trim();
  names.add(base);
  names.add(base.toLowerCase());
  names.add(base.replace(/\s+/g, ''));
  names.add(base.toLowerCase().replace(/\s+/g, ''));
  names.add(normalized);
  return [...names].filter(Boolean);
}

function normalizedSpecKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function getSpecIconNames(specName, className = '') {
  const specKey = normalizedSpecKey(specName);
  const classKey = normalizedSpecKey(className);
  const classSpecific = {
    druid: {
      balance: 'balance',
      balancedruid: 'balance',
      feral: 'feral',
      feraldps: 'feral',
      feraltank: 'guardian',
      guardian: 'guardian',
      resto: 'restoration_druid',
      restoration: 'restoration_druid',
      restodruid: 'restoration_druid',
      restorationdruid: 'restoration_druid'
    },
    mage: {
      arcane: 'arcane',
      arcanemage: 'arcane',
      fire: 'fire',
      firemage: 'fire',
      frost: 'frost',
      frostmage: 'frost'
    },
    warlock: {
      affliction: 'affliction',
      afflictionwarlock: 'affliction',
      aff: 'affliction',
      affwarlock: 'affliction',
      demonology: 'demonology',
      demonologywarlock: 'demonology',
      destruction: 'destruction',
      destructionwarlock: 'destruction',
      demo: 'demonology',
      demo_warlock: 'demonology',
      demowarlock: 'demonology',
      destro: 'destruction',
      destro_warlock: 'destruction',
      destrowarlock: 'destruction'
    },
    rogue: {
      assassination: 'assassination',
      assassinationrogue: 'assassination',
      combat: 'combat',
      combatrogue: 'combat',
      subtlety: 'subtlety',
      subtletyrogue: 'subtlety'
    },
    hunter: {
      bm: 'beastmastery',
      bmhunter: 'beastmastery',
      beastmastery: 'beastmastery',
      beastmasteryhunter: 'beastmastery',
      mm: 'marksman',
      mmhunter: 'marksman',
      marksmanship: 'marksman',
      marksmanshiphunter: 'marksman',
      survival: 'survival',
      survivalhunter: 'survival'
    },
    paladin: {
      holy: 'holy_paladin',
      holypaladin: 'holy_paladin',
      prot: 'ProtPaladin',
      protection: 'ProtPaladin',
      protpaladin: 'ProtPaladin',
      protectionpaladin: 'ProtPaladin',
      ret: 'retribution',
      retpaladin: 'retribution',
      retribution: 'retribution',
      retributionpaladin: 'retribution'
    },
    priest: {
      discipline: 'discipline',
      disciplinepriest: 'discipline',
      disc: 'discipline',
      discpriest: 'discipline',
      shadow: 'shadow',
      shadowpriest: 'shadow',
      holy: 'holy_priest',
      holypriest: 'holy_priest'
    },
    shaman: {
      elemental: 'elemental',
      elementalshaman: 'elemental',
      enhance: 'enhancement',
      enhanceshaman: 'enhancement',
      enhancement: 'enhancement',
      enhancementshaman: 'enhancement',
      resto: 'resto_shaman',
      restoration: 'resto_shaman',
      restoshaman: 'resto_shaman',
      restorationshaman: 'resto_shaman'
    },
    warrior: {
      arms: 'arms',
      armswarrior: 'arms',
      fury: 'fury',
      furywarrior: 'fury',
      prot: 'protection_warrior',
      protection: 'protection_warrior',
      protwarrior: 'protection_warrior',
      protectionwarrior: 'protection_warrior'
    }
  };

  const exact = classSpecific[classKey]?.[specKey];
  if (exact) return [exact];

  return [];
}

function resolveSpecEmojiData(guild, specName, className = '') {
  const candidateNames = getSpecIconNames(specName, className);

  for (const candidate of candidateNames) {
    const emoji = resolveNamedEmoji(guild, candidate, '');
    if (emoji) {
      const match = /<a?:([^:]+):([0-9]+)>/.exec(emoji);
      if (match) return { id: match[2], name: match[1], animated: match[0].startsWith('<a:') };
    }
  }

  for (const candidate of candidateNames) {
    const entry = DISCORD_ICON_TAGS.find(icon => String(icon?.name || '').toLowerCase() === String(candidate).toLowerCase());
    if (entry) return { id: String(entry.id), name: String(entry.name), animated: false };
  }

  return null;
}

function resolveSpecEmojiToken(guild, specName, className = '') {
  const specKey = String(specName || '').toLowerCase();
  const classKey = String(className || '').toLowerCase();
  const fallback = SPEC_FALLBACK[specKey] || SPEC_FALLBACK[classKey] || (classKey ? CLASS_FALLBACK[classKey] || '' : '');

  const resolved = resolveSpecEmojiData(guild, specName, className);
  if (resolved) {
    return `<${resolved.animated ? 'a' : ''}:${resolved.name}:${resolved.id}>`;
  }

  return fallback || '';
}

module.exports = {
  resolveNamedEmoji,
  resolveRoleEmojiToken,
  resolveClassEmojiToken,
  getSpecIconNames,
  resolveSpecEmojiData,
  resolveSpecEmojiToken
};
