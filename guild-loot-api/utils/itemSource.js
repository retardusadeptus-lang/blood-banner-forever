function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseSourceDetails(sourceText, sourceTypeText) {
  const rawSource = normalizeText(sourceText);
  const rawSourceType = normalizeText(sourceTypeText);

  if (!rawSource && !rawSourceType) {
    return {
      boss: '',
      zone: '',
      source: '',
      source_type: '',
    };
  }

  if (!rawSource) {
    return {
      boss: rawSourceType,
      zone: rawSourceType,
      source: rawSourceType,
      source_type: rawSourceType,
    };
  }

  if (!rawSourceType) {
    return {
      boss: '',
      zone: rawSource,
      source: rawSource,
      source_type: '',
    };
  }

  const source = rawSource;
  const sourceType = rawSourceType;

  const lowerSource = source.toLowerCase();
  const zoneMarkers = [
    'black temple', 'tempest keep', 'serpentshrine cavern', 'ssc', 'sunwell plateau',
    'zul\'aman', 'karazhan', 'hyjal summit', 'gruul\'s lair', 'gruul', 'magtheridons lair',
    'magtheridon', 'shadow labyrinth', 'mechanar', 'steamvault', 'arcatraz', 'underbog',
    'naxxramas', 'black morass', 'sethekk halls', 'za', 'tk', 'the eye', 'obsidian sanctum'
  ];

  const lastMarker = zoneMarkers
    .filter(marker => lowerSource.lastIndexOf(marker) !== -1)
    .sort((a, b) => lowerSource.lastIndexOf(b) - lowerSource.lastIndexOf(a))[0];

  if (lastMarker) {
    const markerIndex = lowerSource.lastIndexOf(lastMarker);
    const bossCandidate = source.slice(0, markerIndex).trim();
    const cleanedBoss = bossCandidate
      .replace(/^(?:zone drop|vendor|vendors|quest reward|world boss|raid|boss|loot|drop)\s+/i, '')
      .trim();

    if (cleanedBoss) {
      return {
        boss: cleanedBoss,
        zone: source.slice(markerIndex).trim(),
        source,
        source_type: sourceType,
      };
    }
  }

  return {
    boss: sourceType,
    zone: source,
    source,
    source_type: sourceType,
  };
}

module.exports = { parseSourceDetails };
