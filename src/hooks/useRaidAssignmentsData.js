import { useEffect, useMemo, useState } from 'react';
import { RAID_ZONES } from '../constants';

const RAID_ASSIGNMENTS_SYNC_INTERVAL_MS = 15000;

export default function useRaidAssignmentsData({
  fetchData,
  putData,
  activeTab,
  setActiveTab,
  setRaidAssignmentsSubTab,
  isAuthenticated,
}) {
  const [raidAssignmentArchives, setRaidAssignmentArchives] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('raid-assignment-archives') || '[]');
    } catch {
      return [];
    }
  });
  const [selectedRaidAssignmentArchiveId, setSelectedRaidAssignmentArchiveId] = useState(null);
  const [selectedRaidRestoreBosses, setSelectedRaidRestoreBosses] = useState([]);
  const [raidAssignmentData, setRaidAssignmentDataLocal] = useState({});
  const [enabledBosses, setEnabledBossesLocal] = useState([]);
  const [raidAssignmentDataDirty, setRaidAssignmentDataDirty] = useState(false);
  const [enabledBossesDirty, setEnabledBossesDirty] = useState(false);
  const [isSavingRaidAssignments, setIsSavingRaidAssignments] = useState(false);

  const customRaidGroups = useMemo(() => {
    const grouped = raidAssignmentData?.__customBossGroups;
    if (Array.isArray(grouped)) return grouped;

    const legacy = Array.isArray(raidAssignmentData?.__customBosses) ? raidAssignmentData.__customBosses : [];
    if (legacy.length === 0) return [];
    return [{ zone: 'Custom', bosses: legacy }];
  }, [raidAssignmentData]);

  const raidZones = useMemo(() => {
    const mergedByZone = new Map();

    RAID_ZONES.forEach(zone => {
      mergedByZone.set(zone.name.toLowerCase(), {
        name: zone.name,
        bosses: [...zone.bosses]
      });
    });

    customRaidGroups
      .filter(group => group && group.zone)
      .forEach(group => {
        const key = String(group.zone).toLowerCase();
        const incomingBosses = Array.isArray(group.bosses) ? group.bosses : [];
        if (!incomingBosses.length) return;

        const existing = mergedByZone.get(key);
        if (existing) {
          existing.bosses = [...new Set([...existing.bosses, ...incomingBosses])];
        } else {
          mergedByZone.set(key, {
            name: group.zone,
            bosses: [...new Set(incomingBosses)]
          });
        }
      });

    return Array.from(mergedByZone.values());
  }, [customRaidGroups]);

  const setRaidAssignmentData = (newValOrUpdater) => {
    setRaidAssignmentDataLocal(prev => (typeof newValOrUpdater === 'function' ? newValOrUpdater(prev) : newValOrUpdater));
    setRaidAssignmentDataDirty(true);
  };

  const setEnabledBosses = (newValOrUpdater) => {
    setEnabledBossesLocal(prev => (typeof newValOrUpdater === 'function' ? newValOrUpdater(prev) : newValOrUpdater));
    setEnabledBossesDirty(true);
  };

  useEffect(() => {
    localStorage.setItem('raid-assignment-archives', JSON.stringify(raidAssignmentArchives));
  }, [raidAssignmentArchives]);

  useEffect(() => {
    if (activeTab !== 'raidAssignments') return;

    const loadRaidAssignments = async () => {
      if (document.hidden) return;
      try {
        const [data, config] = await Promise.all([
          fetchData('raid-assignment-data'),
          fetchData('raid-assignment-config')
        ]);
        if (!raidAssignmentDataDirty) setRaidAssignmentDataLocal(data);
        if (!enabledBossesDirty) setEnabledBossesLocal(config);
      } catch (e) {
        console.error('Failed to load raid assignments:', e);
      }
    };

    loadRaidAssignments();
    const interval = setInterval(loadRaidAssignments, RAID_ASSIGNMENTS_SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [activeTab, fetchData, raidAssignmentDataDirty, enabledBossesDirty]);

  const handleSaveRaidAssignmentsChanges = async ({ silent = false } = {}) => {
    if (!raidAssignmentDataDirty && !enabledBossesDirty) return;
    if (!isAuthenticated) {
      if (!silent) alert('Officer login required to save raid assignments.');
      throw new Error('Officer login required to save raid assignments.');
    }

    setIsSavingRaidAssignments(true);
    try {
      if (raidAssignmentDataDirty) {
        await putData('raid-assignment-data', raidAssignmentData);
      }
      if (enabledBossesDirty) {
        await putData('raid-assignment-config', enabledBosses);
      }
      setRaidAssignmentDataDirty(false);
      setEnabledBossesDirty(false);
      if (!silent) alert('Raid assignments saved.');
    } catch (e) {
      if (!silent) alert('Failed to save raid assignments.');
      throw e;
    } finally {
      setIsSavingRaidAssignments(false);
    }
  };

  const handleCopyRaidAssignmentsToArchive = (archiveEntry) => {
    setRaidAssignmentArchives(prev => {
      const next = [archiveEntry, ...prev].slice(0, 12);
      return next;
    });
    setSelectedRaidAssignmentArchiveId(archiveEntry.id);
    setSelectedRaidRestoreBosses(Array.isArray(archiveEntry.selectedBosses) ? archiveEntry.selectedBosses : []);
  };

  const handleViewRaidAssignmentArchive = (archiveEntry) => {
    setSelectedRaidAssignmentArchiveId(archiveEntry.id);
    setSelectedRaidRestoreBosses(Array.isArray(archiveEntry.selectedBosses) ? archiveEntry.selectedBosses : []);
  };

  const handleToggleRaidRestoreBoss = (bossName) => {
    setSelectedRaidRestoreBosses(prev => (
      prev.includes(bossName)
        ? prev.filter(name => name !== bossName)
        : [...prev, bossName]
    ));
  };

  const handleRestoreRaidAssignmentArchive = (archiveEntry, bossesToRestore = null) => {
    const snapshot = archiveEntry?.liveSnapshot;
    if (!snapshot || typeof snapshot !== 'object') {
      alert('This archived snapshot was saved before restore support was added. Copy it again to create a restorable version.');
      return;
    }

    const availableBosses = Array.isArray(archiveEntry.selectedBosses) && archiveEntry.selectedBosses.length > 0
      ? archiveEntry.selectedBosses
      : (archiveEntry.payload?.enabled_bosses || []);
    const requestedBosses = Array.isArray(bossesToRestore) && bossesToRestore.length > 0
      ? bossesToRestore.filter(boss => availableBosses.includes(boss))
      : availableBosses;

    if (requestedBosses.length === 0) {
      alert('Select at least one boss to restore.');
      return;
    }

    setRaidAssignmentData(prev => {
      const next = JSON.parse(JSON.stringify(prev || {}));

      if (requestedBosses.length === availableBosses.length) {
        if (snapshot.global) next.global = JSON.parse(JSON.stringify(snapshot.global));
        if (snapshot.__customBossGroups) next.__customBossGroups = JSON.parse(JSON.stringify(snapshot.__customBossGroups));
      }

      if (snapshot.__bossOrder) {
        next.__bossOrder = { ...(next.__bossOrder || {}) };
      }

      requestedBosses.forEach(bossName => {
        if (Object.prototype.hasOwnProperty.call(snapshot.__bossOrder || {}, bossName)) {
          next.__bossOrder = next.__bossOrder || {};
          next.__bossOrder[bossName] = JSON.parse(JSON.stringify(snapshot.__bossOrder[bossName]));
        }
      });

      requestedBosses.forEach(bossName => {
        if (snapshot[bossName]) {
          next[bossName] = JSON.parse(JSON.stringify(snapshot[bossName]));
        }
      });

      return next;
    });

    setEnabledBosses(prev => [...new Set([...(Array.isArray(prev) ? prev : []), ...requestedBosses])]);
    setSelectedRaidAssignmentArchiveId(archiveEntry.id);
    setSelectedRaidRestoreBosses(requestedBosses);
    setRaidAssignmentsSubTab('overview');
    setActiveTab('raidAssignments');
  };

  const handleToggleZone = (zoneName, checked) => {
    const zone = raidZones.find(z => z.name === zoneName);
    if (!zone) return;
    const set = new Set(enabledBosses);
    zone.bosses.forEach(b => checked ? set.add(b) : set.delete(b));
    setEnabledBosses([...set]);
  };

  const handleToggleBoss = (bossName, checked) => {
    const set = new Set(enabledBosses);
    if (checked) set.add(bossName); else set.delete(bossName);
    setEnabledBosses([...set]);
  };

  const handleAddCustomRaidBoss = (zoneName, bossName) => {
    const zone = String(zoneName || '').trim();
    const boss = String(bossName || '').trim();
    if (!zone || !boss) return;

    const allKnownBosses = new Set(raidZones.flatMap(z => z.bosses.map(b => b.toLowerCase())));
    if (allKnownBosses.has(boss.toLowerCase())) {
      alert('Boss already exists in the selector.');
      return;
    }

    setRaidAssignmentData(prev => {
      const next = { ...(prev || {}) };
      const existingGroups = Array.isArray(next.__customBossGroups) ? next.__customBossGroups : [];
      const clone = existingGroups.map(group => ({ zone: group.zone, bosses: [...(group.bosses || [])] }));
      const found = clone.find(group => String(group.zone).toLowerCase() === zone.toLowerCase());

      if (found) {
        found.bosses = [...new Set([...(found.bosses || []), boss])].sort((a, b) => a.localeCompare(b));
      } else {
        clone.push({ zone, bosses: [boss] });
      }

      next.__customBossGroups = clone.sort((a, b) => String(a.zone).localeCompare(String(b.zone)));
      delete next.__customBosses;
      return next;
    });

    setEnabledBosses(prev => [...new Set([...(prev || []), boss])]);
  };

  const handleRemoveCustomRaidBoss = (zoneName, bossName) => {
    const zone = String(zoneName || '').trim();
    const boss = String(bossName || '').trim();
    if (!zone || !boss) return;

    setRaidAssignmentData(prev => {
      const next = { ...(prev || {}) };
      const existingGroups = Array.isArray(next.__customBossGroups) ? next.__customBossGroups : [];
      const updatedGroups = existingGroups
        .map(group => {
          if (String(group.zone).toLowerCase() !== zone.toLowerCase()) return { zone: group.zone, bosses: [...(group.bosses || [])] };
          return { zone: group.zone, bosses: (group.bosses || []).filter(b => b !== boss) };
        })
        .filter(group => (group.bosses || []).length > 0);

      next.__customBossGroups = updatedGroups;
      delete next[boss];
      delete next.__customBosses;
      return next;
    });

    setEnabledBosses(prev => (prev || []).filter(b => b !== boss));
  };

  return {
    raidAssignmentArchives,
    selectedRaidAssignmentArchiveId,
    selectedRaidRestoreBosses,
    raidAssignmentData,
    enabledBosses,
    raidAssignmentDataDirty,
    enabledBossesDirty,
    isSavingRaidAssignments,
    setRaidAssignmentData,
    setEnabledBosses,
    handleSaveRaidAssignmentsChanges,
    handleCopyRaidAssignmentsToArchive,
    handleViewRaidAssignmentArchive,
    handleToggleRaidRestoreBoss,
    handleRestoreRaidAssignmentArchive,
    handleToggleZone,
    handleToggleBoss,
    handleAddCustomRaidBoss,
    handleRemoveCustomRaidBoss,
  };
}
