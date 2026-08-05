import { useState } from 'react';
import * as helpers from '../utils/helpers';

const RAIDHELPER_ALIAS_MAP_KEY = 'raidhelper-name-map-v1';

export default function useRaidHelperImport({ roster = [], specsFromDb = [], playerStats = {}, raidLogs = [], setRoster, setPlayerStats, setRaidLogs, setNewRaidDate, setNewRaidZone, fetchData }) {
  const [raidHelperImportSession, setRaidHelperImportSession] = useState(null);
  const [recentRaidHelperImportedIds, setRecentRaidHelperImportedIds] = useState([]);
  const [recentRaidHelperSpecConflictIds, setRecentRaidHelperSpecConflictIds] = useState([]);

  const resolveSpecIdFromRaidHelper = (signup, preferredClass) => {
    const classCandidates = [signup?.className, signup?.cClassName]
      .map(v => String(v || '').trim())
      .filter(Boolean)
      .filter(v => !['Absence', 'Tentative', 'Bench', 'Late', 'Tank'].includes(v));

    const preferredClassToken = helpers.normalizeRaidHelperToken(preferredClass);
    const classTokens = [...new Set(classCandidates.map(helpers.normalizeRaidHelperToken))];
    const specTokens = [...new Set([signup?.specName, signup?.cSpecName].map(helpers.normalizeRaidHelperToken).filter(Boolean))];
    if (specTokens.length === 0) return null;

    const specMatches = specsFromDb.filter(spec => specTokens.includes(helpers.normalizeRaidHelperToken(spec.spec)));
    if (specMatches.length === 0) return null;

    if (preferredClassToken) {
      const preferred = specMatches.find(spec => helpers.normalizeRaidHelperToken(spec.class) === preferredClassToken);
      if (preferred) return preferred.id;
    }

    if (classTokens.length > 0) {
      const classFiltered = specMatches.filter(spec => classTokens.includes(helpers.normalizeRaidHelperToken(spec.class)));
      if (classFiltered.length === 1) return classFiltered[0].id;
      if (classFiltered.length > 1) return classFiltered[0].id;
    }

    if (specMatches.length === 1) return specMatches[0].id;
    return specMatches[0].id;
  };

  const handleImportRaidHelperJson = (rawJson) => {
    const raw = String(rawJson || '').trim();
    if (!raw) {
      alert('Paste RaidHelper JSON first.');
      return false;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      alert('Invalid JSON. Please paste the full RaidHelper payload.');
      return false;
    }

    const signUps = Array.isArray(parsed?.signUps) ? parsed.signUps : [];
    if (signUps.length === 0) {
      alert('No signUps found in this payload.');
      return false;
    }

    const skipClasses = new Set(['absence', 'tentative', 'bench', 'late']);
    const raidSignUps = signUps.filter(signup => {
      const classToken = helpers.normalizeRaidHelperToken(signup?.className || signup?.cClassName);
      const statusToken = helpers.normalizeRaidHelperToken(signup?.status || 'primary');
      if (!signup?.name) return false;
      if (skipClasses.has(classToken)) return false;
      return statusToken === 'primary' || statusToken === '';
    });

    if (raidSignUps.length === 0) {
      alert('No eligible primary raid signups found after filtering Absence/Tentative/Bench/Late.');
      return false;
    }

    let aliasMap = {};
    try {
      aliasMap = JSON.parse(localStorage.getItem(RAIDHELPER_ALIAS_MAP_KEY) || '{}') || {};
    } catch (e) {
      aliasMap = {};
    }

    const nextRoster = [...roster];
    const pending = [];
    const autoActions = [];

    const findRosterByName = (name) => {
      const target = helpers.normalizeRaidHelperToken(name);
      return nextRoster.find(player => helpers.normalizeRaidHelperToken(player.name) === target);
    };

    raidSignUps.forEach(signup => {
      const importedName = String(signup.name || '').trim();
      if (!importedName) return;

      let matchedPlayer = findRosterByName(importedName);
      const importedNameToken = helpers.normalizeRaidHelperToken(importedName);

      if (!matchedPlayer && aliasMap[importedNameToken]) {
        matchedPlayer = findRosterByName(aliasMap[importedNameToken]);
      }

      const matchedSpec = matchedPlayer ? specsFromDb.find(s => s.id === matchedPlayer.spec_id) : null;
      const resolvedSpecId = resolveSpecIdFromRaidHelper(signup, matchedSpec?.class);
      const resolvedSpec = resolvedSpecId ? specsFromDb.find(s => s.id === resolvedSpecId) : null;
      const classFromJson = [signup?.className, signup?.cClassName]
        .map(v => String(v || '').trim())
        .find(v => v && !['Absence', 'Tentative', 'Bench', 'Late', 'Tank'].includes(v));
      const selectedClass = resolvedSpec?.class || classFromJson || '';

      if (!matchedPlayer) {
        pending.push({
          id: `${importedNameToken}-${signup.id || Date.now()}-${pending.length}`,
          source: 'unmatched',
          imported_name: importedName,
          imported_token: importedNameToken,
          incoming_spec_name: signup?.specName || signup?.cSpecName || '',
          resolution: 'add',
          mapped_player_id: '',
          selected_class: selectedClass,
          selected_spec_id: resolvedSpecId || ''
        });
        return;
      }

      if (resolvedSpecId && Number(matchedPlayer.spec_id) !== Number(resolvedSpecId)) {
        pending.push({
          id: `${importedNameToken}-${signup.id || Date.now()}-${pending.length}`,
          source: 'specMismatch',
          imported_name: importedName,
          imported_token: importedNameToken,
          incoming_spec_name: signup?.specName || signup?.cSpecName || '',
          resolution: 'leave',
          mapped_player_id: matchedPlayer.id,
          selected_class: selectedClass,
          selected_spec_id: resolvedSpecId || ''
        });
        return;
      }

      autoActions.push({
        imported_name: importedName,
        imported_token: importedNameToken,
        mapped_player_id: matchedPlayer.id
      });
    });

    const raidDate = helpers.parseRaidHelperDate(parsed?.date);
    const raidZone = String(parsed?.displayTitle || parsed?.title || parsed?.channelName || 'Imported Raid').trim();

    if (pending.length > 0) {
      setRaidHelperImportSession({
        raidDate,
        raidZone,
        aliasMap,
        autoActions,
        pending
      });
      return true;
    }

    const attendeeIds = autoActions.map(action => Number(action.mapped_player_id)).filter(Boolean);
    if (attendeeIds.length === 0) {
      alert('No attendees could be mapped from this import.');
      return false;
    }

    localStorage.setItem(RAIDHELPER_ALIAS_MAP_KEY, JSON.stringify(aliasMap));

    const attendeeSet = new Set(attendeeIds.map(Number));
    const rosterWithRaidState = roster.map(player => ({
      ...player,
      in_raid: attendeeSet.has(Number(player.id))
    }));

    setRoster(rosterWithRaidState);
    setPlayerStats(playerStats);
    setRaidLogs([{ id: Date.now(), date: raidDate, zone: raidZone, attendees: attendeeIds }, ...raidLogs]);
    setNewRaidDate(raidDate);
    setNewRaidZone(raidZone);
    setRecentRaidHelperImportedIds(attendeeIds);
    setRecentRaidHelperSpecConflictIds([]);

    alert(`RaidHelper import complete: ${attendeeIds.length} attendees imported.`);
    return true;
  };

  const handleUpdateRaidHelperImportEntry = (entryId, patch) => {
    setRaidHelperImportSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        pending: prev.pending.map(entry => {
          if (entry.id !== entryId) return entry;
          const merged = { ...entry, ...patch };

          if (Object.prototype.hasOwnProperty.call(patch, 'selected_class')) {
            const selectedClass = String(patch.selected_class || '').trim();
            const classSpecs = specsFromDb.filter(spec => spec.class === selectedClass);
            if (classSpecs.length > 0 && !classSpecs.some(spec => Number(spec.id) === Number(merged.selected_spec_id))) {
              merged.selected_spec_id = classSpecs[0].id;
            }
          }

          return merged;
        })
      };
    });
  };

  const handleCancelRaidHelperImport = () => {
    setRaidHelperImportSession(null);
  };

  const handleApplyRaidHelperImport = () => {
    const session = raidHelperImportSession;
    if (!session) return;

    const invalidEntries = (session.pending || []).filter(entry => {
      const resolution = String(entry.resolution || '').toLowerCase();
      if (resolution === 'add') {
        return !entry.selected_spec_id;
      }
      return !entry.mapped_player_id;
    });

    if (invalidEntries.length > 0) {
      alert('Please complete all required dropdown selections before applying import.');
      return;
    }

    let nextRoster = [...roster];
    const nextPlayerStats = { ...playerStats };
    const attendeeIds = new Set();
    const conflictIds = new Set();
    const aliasMap = { ...(session.aliasMap || {}) };
    let createdCount = 0;
    let mappedCount = 0;
    let amendedCount = 0;
    let nextIdSeed = Date.now();

    const ensurePlayerStats = (id) => {
      if (!nextPlayerStats[id]) {
        nextPlayerStats[id] = { cons: true, enchants: true, gems: true, afks: 0, parses: {}, manualAdjustment: { value: 0, note: '' } };
      }
    };

    (session.autoActions || []).forEach(action => {
      if (action?.mapped_player_id) attendeeIds.add(Number(action.mapped_player_id));
    });

    (session.pending || []).forEach(entry => {
      const resolution = String(entry.resolution || '').toLowerCase();
      const selectedSpecId = Number(entry.selected_spec_id || 0) || null;

      if (resolution === 'add') {
        const fallbackSpecId = selectedSpecId || (specsFromDb[0]?.id || null);
        if (!fallbackSpecId) return;
        const newPlayer = {
          id: ++nextIdSeed,
          name: entry.imported_name,
          spec_id: fallbackSpecId,
          in_raid: true
        };
        nextRoster.push(newPlayer);
        ensurePlayerStats(newPlayer.id);
        attendeeIds.add(Number(newPlayer.id));
        createdCount++;
        return;
      }

      const mappedPlayerId = Number(entry.mapped_player_id || 0);
      if (!mappedPlayerId) return;
      const mappedPlayer = nextRoster.find(player => Number(player.id) === mappedPlayerId);
      if (!mappedPlayer) return;

      attendeeIds.add(Number(mappedPlayer.id));

      if (entry.source === 'unmatched') {
        aliasMap[entry.imported_token] = mappedPlayer.name;
        mappedCount++;
      }

      if (resolution === 'amend' && selectedSpecId && Number(mappedPlayer.spec_id) !== selectedSpecId) {
        nextRoster = nextRoster.map(player => Number(player.id) === Number(mappedPlayer.id) ? { ...player, spec_id: selectedSpecId } : player);
        amendedCount++;
        conflictIds.add(Number(mappedPlayer.id));
      }

      if (resolution === 'leave') {
        conflictIds.add(Number(mappedPlayer.id));
      }
    });

    const finalAttendeeIds = [...attendeeIds];
    if (finalAttendeeIds.length === 0) {
      alert('No attendees could be resolved from this import.');
      return;
    }

    localStorage.setItem(RAIDHELPER_ALIAS_MAP_KEY, JSON.stringify(aliasMap));

    const attendeeSet = new Set(finalAttendeeIds.map(Number));
    const rosterWithRaidState = nextRoster.map(player => ({
      ...player,
      in_raid: attendeeSet.has(Number(player.id))
    }));

    setRoster(rosterWithRaidState);
    setPlayerStats(nextPlayerStats);
    setRaidLogs([{ id: Date.now(), date: session.raidDate, zone: session.raidZone, attendees: finalAttendeeIds }, ...raidLogs]);
    setNewRaidDate(session.raidDate);
    setNewRaidZone(session.raidZone);
    setRecentRaidHelperImportedIds(finalAttendeeIds);
    setRecentRaidHelperSpecConflictIds([...conflictIds]);
    setRaidHelperImportSession(null);

    alert(`RaidHelper import complete: ${finalAttendeeIds.length} attendees, ${createdCount} new players, ${mappedCount} alias mappings, ${amendedCount} specs amended.`);
  };

  return {
    raidHelperImportSession,
    recentRaidHelperImportedIds,
    recentRaidHelperSpecConflictIds,
    handleImportRaidHelperJson,
    handleUpdateRaidHelperImportEntry,
    handleCancelRaidHelperImport,
    handleApplyRaidHelperImport,
    setRaidHelperImportSession
  };
}
