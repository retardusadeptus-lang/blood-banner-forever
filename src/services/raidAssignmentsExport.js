import { BOSS_TARGET_ID } from '../constants.js';

const MARKER_INDEX_BY_ID = {
  star: 1,
  circle: 2,
  diamond: 3,
  triangle: 4,
  moon: 5,
  square: 6,
  cross: 7,
  skull: 8
};

function normalizeMarker(markerId) {
  return typeof markerId === 'string' ? MARKER_INDEX_BY_ID[markerId] ?? null : null;
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function getBossOrder({ bossName, bossOrderMap, fallbackIndex }) {
  const order = bossOrderMap?.[bossName];
  if (typeof order === 'number' && Number.isFinite(order)) {
    return order;
  }
  return fallbackIndex;
}

function buildBossExport({
  bossName,
  bossData,
  zoneName,
  order,
  globalData
}) {
  const normalizedBossData = {
    id: bossName,
    name: bossName,
    zone: zoneName,
    order,
    bloodlustAt: cleanText(bossData?.bloodlustAt) || null,
    targets: (bossData?.targets || [])
      .filter(target => target && (target.name || target.id))
      .map(target => ({
        id: target.id || null,
        name: target.name || null,
        marker: normalizeMarker(target.markerId)
      })),
    hunterMDs: Object.fromEntries(
      Object.entries(bossData?.hunterMDs || {})
        .filter(([, slotId]) => Boolean(slotId))
        .map(([playerName, slotId]) => {
          const slot = (globalData?.tankSlots || []).find(candidate => candidate.id === slotId);
          return [playerName, slot?.playerName || null];
        })
        .filter(([, resolvedName]) => Boolean(resolvedName))
    ),
    phases: (bossData?.phases || [])
      .filter(phase => phase)
      .map((phase, phaseIndex) => {
        const normalizedPhase = {
          id: phase.id || null,
          name: cleanText(phase.name) || `Phase ${phaseIndex + 1}`,
          enabledBlocks: Array.isArray(phase.enabledBlocks) ? phase.enabledBlocks.filter(Boolean) : [],
          tankAssignments: (phase.tankAssignments || [])
            .filter(assignment => assignment && (assignment.tankSlotId || assignment.targetId))
            .map(assignment => {
              const slot = (globalData?.tankSlots || []).find(candidate => candidate.id === assignment.tankSlotId);
              return {
                id: assignment.id || null,
                playerName: slot?.playerName || null,
                targetId: assignment.targetId || null,
                targetName: assignment.targetId === BOSS_TARGET_ID ? bossName : null
              };
            })
            .filter(item => item.playerName),
          healerAssignments: (phase.healerAssignments || [])
            .filter(assignment => assignment && (assignment.healerSlotId || assignment.target))
            .map(assignment => {
              const slot = (globalData?.healerSlots || []).find(candidate => candidate.id === assignment.healerSlotId);
              return {
                id: assignment.id || null,
                playerName: slot?.playerName || null,
                target: cleanText(assignment.target) || null
              };
            })
            .filter(item => item.playerName),
          interrupts: (phase.interrupts || [])
            .filter(item => item && (item.playerName || item.target))
            .map(item => ({
              id: item.id || null,
              playerName: cleanText(item.playerName) || null,
              target: cleanText(item.target) || null
            }))
            .filter(item => item.playerName || item.target),
          stuns: (phase.stuns || [])
            .filter(item => item && (item.playerName || item.target))
            .map(item => ({
              id: item.id || null,
              playerName: cleanText(item.playerName) || null,
              target: cleanText(item.target) || null
            }))
            .filter(item => item.playerName || item.target),
          fears: (phase.fears || [])
            .filter(item => item && (item.playerName || item.target))
            .map(item => ({
              id: item.id || null,
              playerName: cleanText(item.playerName) || null,
              target: cleanText(item.target) || null
            }))
            .filter(item => item.playerName || item.target),
          banishes: (phase.banishes || [])
            .filter(item => item && (item.playerName || item.target))
            .map(item => ({
              id: item.id || null,
              playerName: cleanText(item.playerName) || null,
              target: cleanText(item.target) || null
            }))
            .filter(item => item.playerName || item.target),
          purges: (phase.purges || [])
            .filter(item => item && (item.playerName || item.target))
            .map(item => ({
              id: item.id || null,
              playerName: cleanText(item.playerName) || null,
              target: cleanText(item.target) || null
            }))
            .filter(item => item.playerName || item.target),
          spellsteals: (phase.spellsteals || [])
            .filter(item => item && (item.playerName || item.target))
            .map(item => ({
              id: item.id || null,
              playerName: cleanText(item.playerName) || null,
              target: cleanText(item.target) || null
            }))
            .filter(item => item.playerName || item.target),
          innervates: (phase.innervates || [])
            .filter(item => item && (item.playerName || item.target))
            .map(item => ({
              id: item.id || null,
              playerName: cleanText(item.playerName) || null,
              target: cleanText(item.target) || null
            }))
            .filter(item => item.playerName || item.target),
          dispels: (phase.dispels || [])
            .filter(item => item && (item.playerName || item.target))
            .map(item => ({
              id: item.id || null,
              playerName: cleanText(item.playerName) || null,
              target: cleanText(item.target) || null
            }))
            .filter(item => item.playerName || item.target),
          powerInfusions: (phase.powerInfusions || [])
            .filter(item => item && (item.playerName || item.target))
            .map(item => ({
              id: item.id || null,
              playerName: cleanText(item.playerName) || null,
              target: cleanText(item.target) || null
            }))
            .filter(item => item.playerName || item.target),
          curses: (phase.curses || [])
            .filter(item => item && (item.playerName || item.target))
            .map(item => ({
              id: item.id || null,
              playerName: cleanText(item.playerName) || null,
              target: cleanText(item.target) || null
            }))
            .filter(item => item.playerName || item.target),
          sheep: (phase.sheep || [])
            .filter(item => item && (item.playerName || item.target))
            .map(item => ({
              id: item.id || null,
              playerName: cleanText(item.playerName) || null,
              target: cleanText(item.target) || null
            }))
            .filter(item => item.playerName || item.target),
          bops: (phase.bops || [])
            .filter(item => item && (item.playerName || item.target))
            .map(item => ({
              id: item.id || null,
              playerName: cleanText(item.playerName) || null,
              target: cleanText(item.target) || null
            }))
            .filter(item => item.playerName || item.target),
          fearWards: (phase.fearWards || [])
            .filter(item => item && (item.priestName || item.targetName))
            .map(item => ({
              id: item.id || null,
              priestName: cleanText(item.priestName) || null,
              targetName: cleanText(item.targetName) || null
            }))
            .filter(item => item.priestName || item.targetName),
          phaseNotes: cleanText(phase.phaseNotes) || null
        };

        return normalizedPhase;
      }),
    curses: Object.fromEntries(
      Object.entries(bossData?.curses || {})
        .filter(([playerName]) => Boolean(playerName))
        .map(([playerName, curse]) => [playerName, cleanText(curse) || null])
        .filter(([, value]) => value)
    ),
    judgements: Object.fromEntries(
      Object.entries(bossData?.judgements || {})
        .filter(([playerName]) => Boolean(playerName))
        .map(([playerName, judgement]) => [playerName, cleanText(judgement) || null])
        .filter(([, value]) => value)
    )
  };

  if (bossData?.bossMarkerId) {
    normalizedBossData.bossMarker = normalizeMarker(bossData.bossMarkerId);
  }

  return normalizedBossData;
}

export function buildRaidAssignmentsExport({
  raidAssignmentData = {},
  roster = [],
  enabledBosses = [],
  raidZones = [],
  getSpecById,
  exportTimestamp = new Date().toISOString()
}) {
  const globalData = raidAssignmentData?.global || {};
  const bossOrderMap = Object.fromEntries((enabledBosses || []).map((bossName, index) => [bossName, index]));
  const globalPayload = {
    tankSlots: (globalData.tankSlots || []).map(slot => ({ id: slot.id || null, playerName: cleanText(slot.playerName) || null })).filter(slot => slot.playerName),
    healerSlots: (globalData.healerSlots || []).map(slot => ({ id: slot.id || null, playerName: cleanText(slot.playerName) || null })).filter(slot => slot.playerName),
    judgements: Object.fromEntries(
      Object.entries(globalData.judgements || {})
        .filter(([playerName]) => Boolean(playerName))
        .map(([playerName, judgement]) => [playerName, cleanText(judgement) || null])
        .filter(([, value]) => value)
    ),
    sheep: globalData.sheep || [],
    banish: globalData.banish || [],
    curses: globalData.curses || []
  };

  const zones = (raidZones || [])
    .map(zone => {
      const bosses = (zone?.bosses || [])
        .filter(bossName => enabledBosses.includes(bossName))
        .map((bossName, index) => buildBossExport({
          bossName,
          bossData: raidAssignmentData?.[bossName] || {},
          zoneName: zone?.name || null,
          order: getBossOrder({ bossName, bossOrderMap, fallbackIndex: index }),
          globalData
        }));

      return {
        zone: zone?.name || null,
        bosses: bosses.sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name))
      };
    })
    .filter(zone => zone.bosses.length > 0);

  const rosterPayload = (roster || []).map(player => {
    const spec = getSpecById?.(player.spec_id) || null;
    return {
      id: player.id ?? null,
      name: player.name ?? null,
      spec_id: player.spec_id ?? null,
      spec_name: spec?.spec || null,
      in_raid: !!player.in_raid,
      class: spec?.class || null
    };
  });

  return {
    exported_at: exportTimestamp,
    enabled_bosses: [...enabledBosses],
    global: globalPayload,
    zones,
    roster: rosterPayload
  };
}

export function serializeRaidAssignmentsExport(payload) {
  return JSON.stringify(payload, null, 2);
}

export default serializeRaidAssignmentsExport;
