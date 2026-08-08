import { useEffect, useMemo, useState } from 'react';
import { PHASE_JSON_KEYS } from '../constants';

export default function useLootCouncilData({
  fetchData,
  putData,
  globalPhase,
  roster,
  mutableItems,
  playerStats,
  scoringConfig,
  raidLogs,
  getDisplayFromId,
  getSpecById,
  bisPriorities,
  selectedItemName,
  setSelectedItemName
}) {
  const [assignments, setAssignmentsLocal] = useState({});
  const [assignmentsDirty, setAssignmentsDirty] = useState(false);
  const [isSavingLootCouncil, setIsSavingLootCouncil] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterBoss, setFilterBoss] = useState('');
  const [filterSlot, setFilterSlot] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [tokenRedemptionsByItemId, setTokenRedemptionsByItemId] = useState({});

  const setAssignmentsData = (newValOrUpdater, { dirty = true } = {}) => {
    setAssignmentsLocal(prev => {
      const next = typeof newValOrUpdater === 'function' ? newValOrUpdater(prev) : newValOrUpdater;
      return next;
    });
    if (dirty) {
      setAssignmentsDirty(true);
    }
  };

  const normalizeAwardedPlayerIds = (assignmentData = {}) => {
    if (Array.isArray(assignmentData.awardedPlayerIds)) {
      return assignmentData.awardedPlayerIds.map(id => String(id)).filter(Boolean);
    }
    if (assignmentData.awardedPlayerId !== undefined && assignmentData.awardedPlayerId !== null && assignmentData.awardedPlayerId !== '') {
      return [String(assignmentData.awardedPlayerId)];
    }
    return [];
  };

  const handleSetPriority = (playerId, priority) => {
    setAssignmentsData(prev => {
      const currentItemAssignments = { ...(prev[selectedItemName] || {}) };
      if (priority === null || priority === undefined) {
        delete currentItemAssignments[playerId];
      } else {
        currentItemAssignments[playerId] = priority;
        const awardedPlayerIds = normalizeAwardedPlayerIds(currentItemAssignments);
        if (awardedPlayerIds.includes(String(playerId))) {
          currentItemAssignments.awardedPlayerIds = awardedPlayerIds.filter(id => String(id) !== String(playerId));
        }
      }
      currentItemAssignments.assignedAt = new Date().toISOString();
      return { ...prev, [selectedItemName]: currentItemAssignments };
    }, { dirty: true });
  };

  const handleToggleAwardedPriority = (itemName, playerId) => {
    setAssignmentsData(prev => {
      const currentItemAssignments = { ...(prev[itemName] || {}) };
      const normalizedPlayerId = String(playerId);
      const currentAwardedPlayerIds = normalizeAwardedPlayerIds(currentItemAssignments);
      const isCurrentlyAwarded = currentAwardedPlayerIds.includes(normalizedPlayerId);

      if (isCurrentlyAwarded) {
        currentItemAssignments.awardedPlayerIds = currentAwardedPlayerIds.filter(id => id !== normalizedPlayerId);
      } else {
        delete currentItemAssignments[playerId];
        currentItemAssignments.awardedPlayerIds = [...currentAwardedPlayerIds, normalizedPlayerId];
      }
      currentItemAssignments.assignedAt = new Date().toISOString();
      return { ...prev, [itemName]: currentItemAssignments };
    }, { dirty: true });
  };

  const getPlayerItemPriorityStatus = (itemObj, specDisplay) => {
    if (!itemObj) return '';

    if (!itemObj.is_token) {
      const itemKey = `${itemObj.name}|${specDisplay}`;
      return bisPriorities[itemKey] || '';
    }

    const redemption = tokenRedemptionsByItemId[itemObj.id];
    const rewards = redemption?.redeemableItems || [];
    if (rewards.length === 0) return '';

    let hasOpt = false;
    for (const reward of rewards) {
      const rewardKey = `${reward.name}|${specDisplay}`;
      const rewardStatus = bisPriorities[rewardKey];
      if (rewardStatus === 'BiS') return 'BiS';
      if (rewardStatus === 'Opt') hasOpt = true;
    }
    return hasOpt ? 'Opt' : '';
  };

  const calculateScore = (playerId) => {
    const stats = playerStats[playerId] || { cons: false, enchants: false, gems: false, afks: 0, parses: {}, manualAdjustment: { value: 0, note: '' } };
    let parseSum = 0; let parseCount = 0;
    Object.values(stats.parses || {}).forEach(p => {
      if (p && p.val) {
        parseSum += Number(p.val) * (p.support ? Number(scoringConfig.supportMulti) : 1);
        parseCount++;
      }
    });
    const avgParse = parseCount > 0 ? parseSum / parseCount : 0;
    const cons = stats.cons ? Number(scoringConfig.consBonus) : 0;
    const ench = stats.enchants ? Number(scoringConfig.enchantBonus) : 0;
    const gem = stats.gems ? Number(scoringConfig.gemBonus) : 0;
    const att = (raidLogs.length === 0 ? 100 : Math.round((raidLogs.filter(log => (log.attendees || []).map(Number).includes(Number(playerId))).length / raidLogs.length) * 100)) * Number(scoringConfig.attWeight);
    const afkPenalty = (stats.afks || 0) * Number(scoringConfig.afkPenalty || 5);
    const manualAdj = stats.manualAdjustment?.value || 0;

    return ((avgParse * Number(scoringConfig.parseWeight)) + cons + ench + gem + att - afkPenalty + manualAdj).toFixed(1);
  };

  const sortPlayersByRank = (itemObj, playerList, assignmentData) => {
    return [...playerList].sort((a, b) => {
      const rankA = assignmentData[itemObj.name]?.[a.id];
      const rankB = assignmentData[itemObj.name]?.[b.id];
      if (rankA === 'Pass' && rankB !== 'Pass') return 1;
      if (rankB === 'Pass' && rankA !== 'Pass') return -1;
      if (!rankA && rankB && rankB !== 'Pass') return 1;
      if (rankA && rankA !== 'Pass' && !rankB) return -1;
      if (typeof rankA === 'number' && typeof rankB === 'number') return rankA - rankB;
      const scoreA = Number(calculateScore(a.id));
      const scoreB = Number(calculateScore(b.id));
      if (scoreA !== scoreB) return scoreB - scoreA;
      return a.name.localeCompare(b.name);
    });
  };

  const getItemSourceDetails = (item) => {
    const zone = String(item?.zone || item?.source || '').trim();
    const boss = String(item?.boss || item?.source_type || '').trim();
    return { zone, boss };
  };

  const uniqueZones = useMemo(() => {
    return [...new Set(mutableItems.map(item => getItemSourceDetails(item).zone).filter(Boolean))].sort();
  }, [mutableItems]);

  const uniqueBosses = useMemo(() => {
    let filtered = mutableItems;
    if (filterZone) filtered = filtered.filter(item => getItemSourceDetails(item).zone === filterZone);
    return [...new Set(filtered.map(item => getItemSourceDetails(item).boss).filter(Boolean))].sort();
  }, [mutableItems, filterZone]);

  const uniqueSlots = useMemo(() => [...new Set(mutableItems.map(i => i.slot))].sort(), [mutableItems]);

  const filteredItems = useMemo(() => {
    return mutableItems.filter(item => {
      if (!item || !item.name) return false;
      const sourceDetails = getItemSourceDetails(item);
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchBoss = filterBoss === '' || sourceDetails.boss === filterBoss;
      const matchZone = filterZone === '' || sourceDetails.zone === filterZone;
      const matchSlot = filterSlot === '' || item.slot === filterSlot;
      const isTokenItem = !!item.is_token;
      const matchCategory =
        filterCategory === '' ||
        (filterCategory === 'token' && isTokenItem) ||
        (filterCategory === 'item' && !isTokenItem);
      return matchSearch && matchBoss && matchZone && matchSlot && matchCategory;
    });
  }, [mutableItems, searchQuery, filterBoss, filterZone, filterSlot, filterCategory]);

  const selectedItem = useMemo(() => {
    return mutableItems.find(i => i.name === selectedItemName);
  }, [mutableItems, selectedItemName]);

  useEffect(() => {
    const loadRedemption = async () => {
      if (!selectedItem || !selectedItem.is_token) return;
      if (tokenRedemptionsByItemId[selectedItem.id]) return;
      try {
        const data = await fetchData('token-redemptions/' + selectedItem.id);
        setTokenRedemptionsByItemId(prev => ({ ...prev, [selectedItem.id]: data }));
      } catch (e) {
        console.error('Failed to load token redemption mapping:', e);
      }
    };

    loadRedemption();
  }, [selectedItem, tokenRedemptionsByItemId, fetchData]);

  const sortedEligiblePlayers = useMemo(() => {
    if (!selectedItem) return [];
    const tokenClasses = Array.isArray(selectedItem.token_classes)
      ? selectedItem.token_classes.map(c => String(c).toLowerCase())
      : [];

    const rosterPlayers = roster.slice();
    const assignedMap = assignments[selectedItem.name] || {};
    const awardedPlayerIds = normalizeAwardedPlayerIds(assignedMap);
    const assignedIds = Object.keys(assignedMap)
      .filter(id => !['awardedPlayerIds', 'awardedPlayerId', 'assignedAt'].includes(id))
      .map(id => Number(id))
      .filter(id => !Number.isNaN(id));

    const rosterIds = new Set(rosterPlayers.map(p => Number(p.id)));
    for (const pid of assignedIds) {
      if (!rosterIds.has(pid)) {
        rosterPlayers.push({ id: pid, name: `Player ${pid}`, spec_id: null, in_raid: false });
      }
    }

    const eligible = rosterPlayers.filter(player => {
      const specDisplay = getDisplayFromId(player.spec_id) || '?';
      const specObj = getSpecById(player.spec_id);
      const className = String(specObj?.class || '').toLowerCase();
      const playerId = String(player.id);

      if (selectedItem.is_token && tokenClasses.length > 0 && !tokenClasses.includes(className)) {
        return assignedIds.includes(Number(player.id)) || awardedPlayerIds.includes(playerId);
      }

      const bisStatus = getPlayerItemPriorityStatus(selectedItem, specDisplay);
      return (bisStatus && bisStatus !== '') || assignedIds.includes(Number(player.id)) || awardedPlayerIds.includes(playerId);
    });

    return sortPlayersByRank(selectedItem, eligible, assignments);
  }, [selectedItem, roster, assignments, playerStats, scoringConfig, raidLogs, bisPriorities, getSpecById, tokenRedemptionsByItemId]);

  const handleClearOverviewItemPriorities = (itemName) => {
    if (!itemName) return;
    if (!window.confirm(`Clear all assigned priorities for ${itemName}? This will remove it from Priority Overview until reassigned.`)) return;

    const next = { ...assignments };
    delete next[itemName];
    setAssignmentsData(next, { dirty: true });
  };

  const handleSaveLootCouncilChanges = async ({ silent = false } = {}) => {
    if (!assignmentsDirty) return;
    setIsSavingLootCouncil(true);
    try {
      const phaseKey = PHASE_JSON_KEYS[globalPhase];
      await putData('assignments/' + phaseKey, assignments);
      try {
        const latest = await fetchData('assignments/' + phaseKey);
        setAssignmentsData(latest, { dirty: false });
      } catch (e) {
        console.warn('Failed to re-fetch assignments after save:', e);
      }
      setAssignmentsDirty(false);
      if (!silent) alert('Loot council assignments saved.');
    } catch (e) {
      if (e?.status === 401 || /unauthorized|officer authentication required/i.test(String(e?.message || ''))) {
        if (!silent) alert('Officer session expired. Please log in again to save loot council assignments.');
      } else if (!silent) {
        alert(`Failed to save loot council assignments.\n${e?.message || ''}`.trim());
      }
      throw e;
    } finally {
      setIsSavingLootCouncil(false);
    }
  };

  return {
    assignments,
    setAssignmentsData,
    assignmentsDirty,
    hasLootUnsavedChanges: assignmentsDirty,
    isSavingLootCouncil,
    searchQuery,
    setSearchQuery,
    filterZone,
    setFilterZone,
    filterBoss,
    setFilterBoss,
    filterSlot,
    setFilterSlot,
    filterCategory,
    setFilterCategory,
    selectedItemName,
    setSelectedItemName,
    uniqueZones,
    uniqueBosses,
    uniqueSlots,
    filteredItems,
    selectedItem,
    sortedEligiblePlayers,
    getPlayerItemPriorityStatus,
    handleSetPriority,
    handleToggleAwardedPriority,
    handleSaveLootCouncilChanges,
    handleClearOverviewItemPriorities,
    normalizeAwardedPlayerIds
  };
}
