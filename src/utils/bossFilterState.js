import { DEFAULT_GLOBAL_PHASE } from '../constants.js';

export function getVisibleBosses({ availableBosses = [], userSelection = null }) {
  const safeAvailable = Array.isArray(availableBosses) ? availableBosses : [];

  if (userSelection === null || userSelection === undefined) {
    return safeAvailable;
  }

  if (!Array.isArray(userSelection)) {
    return safeAvailable;
  }

  if (userSelection.length === 0) {
    return [];
  }

  const selectedSet = new Set(
    userSelection
      .filter(Boolean)
      .map(String)
      .filter(name => safeAvailable.includes(name))
  );

  if (selectedSet.size === 0) {
    return [];
  }

  return safeAvailable.filter(bossName => selectedSet.has(bossName));
}

export function filterBossesByPhase({ bossNames = [], raidZones = [], phase = DEFAULT_GLOBAL_PHASE }) {
  const safeBossNames = Array.isArray(bossNames) ? bossNames : [];
  const safeRaidZones = Array.isArray(raidZones) ? raidZones : [];
  if (phase === 'All Phases' || !phase) {
    return safeBossNames;
  }

  const phaseByRaid = {};
  safeRaidZones.forEach(zone => {
    const zoneName = zone?.name || '';
    const zonePhase = zone?.phase || zone?.raidPhase || DEFAULT_GLOBAL_PHASE;
    if (zoneName && zonePhase) {
      phaseByRaid[zoneName] = zonePhase;
    }
  });

  return safeBossNames.filter(bossName => {
    const matchingZone = safeRaidZones.find(zone => Array.isArray(zone?.bosses) && zone.bosses.includes(bossName));
    if (!matchingZone) return false;
    return (matchingZone.phase || matchingZone.raidPhase || phaseByRaid[matchingZone.name] || DEFAULT_GLOBAL_PHASE) === phase;
  });
}
