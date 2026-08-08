import { useState } from 'react';

export default function useRosterData({
  putData,
  roster,
  setRoster,
  playerStats,
  setPlayerStats,
  raidLogs,
  setRaidLogs,
  setRosterLocal,
  setPlayerStatsLocal,
  setRaidLogsLocal,
  rosterDirty,
  playerStatsDirty,
  raidLogsDirty,
  setRosterDirty,
  setPlayerStatsDirty,
  setRaidLogsDirty,
  newSpec,
  setNewSpec,
}) {
  const [newName, setNewName] = useState('');
  const [newRaidDate, setNewRaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [newRaidZone, setNewRaidZone] = useState('SSC / TK');
  const [isSavingRosterAttendance, setIsSavingRosterAttendance] = useState(false);

  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newId = Date.now();
    setRoster([...roster, { id: newId, name: newName, spec_id: newSpec, in_raid: true }]);
    setPlayerStats({ ...playerStats, [newId]: { cons: true, enchants: true, gems: true, afks: 0, parses: {} } });
    setNewName('');
  };

  const handleUpdatePlayer = (id, updates) => {
    setRoster(roster.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleRemovePlayer = (id) => {
    if (window.confirm('Are you sure you want to permanently delete this player?')) {
      setRoster(roster.filter(p => p.id !== id));
    }
  };

  const toggleRaidStatus = (id) => setRoster(roster.map(p => p.id === id ? { ...p, in_raid: !p.in_raid } : p));
  const setAllRaidStatus = (status) => setRoster(roster.map(p => ({ ...p, in_raid: status })));

  const calculateAttendance = (playerId) => {
    if (raidLogs.length === 0) return 100;
    const attendedCount = raidLogs.filter(log => (log.attendees || []).map(Number).includes(Number(playerId))).length;
    return Math.round((attendedCount / raidLogs.length) * 100);
  };

  const handleSaveRaidLog = (e) => {
    e.preventDefault();
    const activeRaiderIds = roster.filter(p => p.in_raid).map(p => Number(p.id));
    setRaidLogs([{ id: Date.now(), date: newRaidDate, zone: newRaidZone, attendees: activeRaiderIds }, ...raidLogs]);
    alert(`Saved raid log for ${activeRaiderIds.length} players!`);
  };

  const handleDeleteRaidLog = (logId) => {
    if (window.confirm('Delete this raid log?')) {
      setRaidLogs(raidLogs.filter(log => log.id !== logId));
    }
  };

  const updatePlayerStat = (playerId, field, value) => {
    const currentStats = playerStats[playerId] || { cons: false, enchants: false, gems: false, afks: 0, parses: {} };
    setPlayerStats({ ...playerStats, [playerId]: { ...currentStats, [field]: value } });
  };

  const updatePlayerParse = (playerId, bossName, field, value) => {
    const currentStats = playerStats[playerId] || { cons: false, enchants: false, gems: false, afks: 0, parses: {}, manualAdjustment: { value: 0, note: '' } };
    const currentParses = currentStats.parses || {};
    const specificParse = currentParses[bossName] || { val: '', support: false };
    setPlayerStats({ ...playerStats, [playerId]: { ...currentStats, parses: { ...currentParses, [bossName]: { ...specificParse, [field]: value } } } });
  };

  const updatePlayerManualAdjustment = (playerId, field, value) => {
    const currentStats = playerStats[playerId] || { cons: false, enchants: false, gems: false, afks: 0, parses: {}, manualAdjustment: { value: 0, note: '' } };
    setPlayerStats({ ...playerStats, [playerId]: { ...currentStats, manualAdjustment: { ...currentStats.manualAdjustment, [field]: value } } });
  };

  const handleSaveRosterAttendanceChanges = async ({ silent = false } = {}) => {
    if (!rosterDirty && !playerStatsDirty && !raidLogsDirty) return;
    setIsSavingRosterAttendance(true);
    try {
      let updatedRoster = roster;
      let updatedStats = playerStats;
      let updatedRaidLogs = raidLogs;
      const idMap = {};

      if (rosterDirty) {
        updatedRoster = await putData('roster', roster);

        updatedRoster.forEach(newPlayer => {
          const oldPlayer = roster.find(p => p.name === newPlayer.name);
          if (oldPlayer) {
            idMap[oldPlayer.id] = newPlayer.id;
          }
        });

        updatedStats = {};
        Object.entries(playerStats).forEach(([oldId, stats]) => {
          const newId = idMap[oldId] || Number(oldId);
          updatedStats[newId] = stats;
        });

        updatedRaidLogs = raidLogs.map(log => ({
          ...log,
          attendees: (log.attendees || []).map(attendeeId => idMap[attendeeId] || Number(attendeeId))
        }));

        setRosterLocal(updatedRoster);
        setPlayerStatsLocal(updatedStats);
        setRaidLogsLocal(updatedRaidLogs);
      }

      if (playerStatsDirty || rosterDirty) {
        await putData('player-stats', updatedStats);
      }

      if (raidLogsDirty || rosterDirty) {
        await putData('raid-logs', updatedRaidLogs);
      }

      setRosterDirty(false);
      setPlayerStatsDirty(false);
      setRaidLogsDirty(false);

      if (!silent) alert('Roster and attendance changes saved.');
    } catch (e) {
      if (!silent) alert('Failed to save roster/attendance changes.');
      throw e;
    } finally {
      setIsSavingRosterAttendance(false);
    }
  };

  return {
    newName,
    setNewName,
    newSpec,
    setNewSpec,
    newRaidDate,
    setNewRaidDate,
    newRaidZone,
    setNewRaidZone,
    isSavingRosterAttendance,
    handleAddPlayer,
    handleUpdatePlayer,
    handleRemovePlayer,
    toggleRaidStatus,
    setAllRaidStatus,
    calculateAttendance,
    handleSaveRaidLog,
    handleDeleteRaidLog,
    updatePlayerStat,
    updatePlayerParse,
    updatePlayerManualAdjustment,
    handleSaveRosterAttendanceChanges,
  };
}
