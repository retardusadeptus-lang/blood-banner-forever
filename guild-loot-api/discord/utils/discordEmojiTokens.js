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

const LIVE_EMOJI_IDS = {
  role_tank: '1545556146646159542',
  role_melee: '1545556145513439253',
  role_healer: '1545556144230113321',
  role_ranged: '1545556132620275772',
  priest: '1538305997565722695',
  paladin: '1538305996403773610',
  mage: '1538305992297807972',
  hunter: '1538305990934397019',
  druid: '1538305989885952140',
  warrior: '1538305988879454318',
  warlock: '1538305987692335154',
  shaman: '1538305986639433798',
  rogue: '1538305985448517672',
  restoration_druid: '1537969982506278962',
  holy_paladin: '1537969976668069898',
  holy_priest: '1537969972356186193',
  resto_shaman: '1537969966043762689',
  protection_warrior: '1537969960733646858',
  balance: '1528191600201568406',
  feral: '1528191599216033953',
  guardian: '1528191598238765206',
  beastmastery: '1528191595969777874',
  marksman: '1528191594996564018',
  survival: '1528191593956511906',
  arcane: '1528191592094240798',
  fire: '1528191590991003731',
  frost: '1528191590043226202',
  discipline: '1528191583017631904',
  shadow: '1528191580882866267',
  assassination: '1528191579716849756',
  combat: '1528191578961875015',
  subtlety: '1528191577946722464',
  elemental: '1528191576281710672',
  enhancement: '1528191575031808165',
  affliction: '1528191572498186281',
  demonology: '1528191571214995639',
  destruction: '1528191570053042306',
  arms: '1528191569088483408',
  fury: '1528191567859548272',
  retribution: '1528191490726170684',
  protpaladin: '1528191489564344491',
  restorationshaman: '1537969966043762689'
};

const LIVE_EMOJI_NAMES = {
  protpaladin: 'ProtPaladin',
  resto_shaman: 'restorationShaman',
  restorationshaman: 'restorationShaman'
};

let legacyEmojiByName = new Map();
try {
  legacyEmojiByName = new Map(require('../../../discord_icons.json').map(emoji => [String(emoji.name || '').toLowerCase(), emoji]));
} catch {
  // The legacy catalog is optional in packaged bot deployments.
}

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

  const liveId = LIVE_EMOJI_IDS[wanted];
  if (liveId) return `<:${LIVE_EMOJI_NAMES[wanted] || wanted}:${liveId}>`;

  const legacyEmoji = legacyEmojiByName.get(wanted);
  if (legacyEmoji?.id && legacyEmoji?.name) return toEmojiToken(legacyEmoji);

  for (const cache of emojiCaches) {
    const exact = cache.find(emoji => String(emoji.name || '').toLowerCase() === wanted);
    if (exact) return toEmojiToken(exact);

    const relaxed = cache.find(emoji => String(emoji.name || '').toLowerCase().includes(wanted));
    if (relaxed) return toEmojiToken(relaxed);
  }

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

function resolveClassEmojiData(guild, className) {
  const key = String(className || '').toLowerCase();
  const resolved = resolveNamedEmoji(guild, CLASS_EMOJI_NAME[key], '');
  if (!resolved) return null;

  const match = /<a?:([^:]+):([0-9]+)>/.exec(resolved);
  if (!match) return null;
  return { id: match[2], name: match[1], animated: match[0].startsWith('<a:') };
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
  resolveClassEmojiData,
  getSpecIconNames,
  resolveSpecEmojiData,
  resolveSpecEmojiToken
};
