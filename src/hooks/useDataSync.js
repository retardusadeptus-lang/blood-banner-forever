import { useEffect } from 'react';
import { PHASE_JSON_KEYS } from '../constants';

const CORE_SYNC_INTERVAL_MS = 30000;

export default function useDataSync({
  globalPhase,
  fetchData,
  rosterDirty,
  setRosterLocal,
  assignmentsDirty,
  setAssignmentsData,
  initializeDefaultBisPriorities,
  setBisPrioritiesLocal,
  scoringConfigDirty,
  setScoringConfigLocal,
  playerStatsDirty,
  setPlayerStatsLocal,
  raidLogsDirty,
  setRaidLogsLocal,
  setMutableItemsLocal,
  setMutableItemsBaseline,
  setIsDbConnected,
  activeTab,
  masterItemsDbPhase,
  setDbBisPrioritiesLocal,
  setDbBisPrioritiesBaseline,
}) {
  useEffect(() => {
    let cancelled = false;
    let isSyncInFlight = false;
    let retryTimeout;

    const loadAll = async () => {
      if (document.hidden || isSyncInFlight) return;
      isSyncInFlight = true;
      try {
        const phaseKey = PHASE_JSON_KEYS[globalPhase];
        const assignmentsDocName = globalPhase === 'T5' ? 't5' : phaseKey;
        const bisPrioritiesDocName = globalPhase === 'T5' ? 't5' : phaseKey;

        const [rosterData, assignmentsData, bisData, configData, statsData, logsData] = await Promise.all([
          fetchData('roster'),
          fetchData('assignments/' + assignmentsDocName),
          fetchData('bis-priorities/' + bisPrioritiesDocName),
          fetchData('scoring-config'),
          fetchData('player-stats'),
          fetchData('raid-logs'),
        ]);

        if (cancelled) return;
        if (!rosterDirty) setRosterLocal(rosterData);
        if (!assignmentsDirty) setAssignmentsData(assignmentsData, { dirty: false });
        const defaults = Object.keys(bisData).length ? bisData : await initializeDefaultBisPriorities(globalPhase);
        setBisPrioritiesLocal(defaults);
        if (!scoringConfigDirty) {
          setScoringConfigLocal(Object.keys(configData).length ? configData : { parseWeight: 1, supportMulti: 1.5, consBonus: 10, enchantBonus: 10, gemBonus: 10, attWeight: 0.5, afkPenalty: 5, defaultSitePhase: 'T6', defaultSiteTab: 'recruitment.focus', claimGameVersion: 'all', claimFallbackEnabled: false });
        }
        if (!playerStatsDirty) setPlayerStatsLocal(statsData);
        if (!raidLogsDirty) setRaidLogsLocal(logsData);
        setIsDbConnected(true);
      } catch (e) {
        console.error('Failed to load data:', e);
        retryTimeout = setTimeout(loadAll, 1000);
      } finally {
        isSyncInFlight = false;
      }
    };

    loadAll();
    const interval = setInterval(loadAll, CORE_SYNC_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (!document.hidden) loadAll();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(retryTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    globalPhase,
    rosterDirty,
    assignmentsDirty,
    scoringConfigDirty,
    playerStatsDirty,
    raidLogsDirty,
    fetchData,
    initializeDefaultBisPriorities,
    setAssignmentsData,
    setBisPrioritiesLocal,
    setIsDbConnected,
    setPlayerStatsLocal,
    setRaidLogsLocal,
    setRosterLocal,
    setScoringConfigLocal,
  ]);

  // Mutable items are mostly reference data, so load them once on site startup.
  useEffect(() => {
    let mounted = true;

    const loadMutableItemsOnce = async () => {
      if (document.hidden) return;
      try {
        const itemsData = await fetchData('mutable-items');
        if (!mounted) return;
        setMutableItemsLocal(itemsData);
        setMutableItemsBaseline(itemsData);
      } catch (e) {
        console.error('Failed to load mutable items:', e);
      }
    };

    loadMutableItemsOnce();
    return () => {
      mounted = false;
    };
  }, [fetchData, setMutableItemsBaseline, setMutableItemsLocal]);

  // Separate sync for Master Items DB phase selector
  useEffect(() => {
    if (activeTab !== 'bis' && activeTab !== 'itemsdb') return;

    const loadDbBis = async () => {
      const phaseKey = PHASE_JSON_KEYS[masterItemsDbPhase];
      const data = await fetchData('bis-priorities/' + phaseKey);
      const dbDefaults = Object.keys(data).length ? data : await initializeDefaultBisPriorities(masterItemsDbPhase);
      setDbBisPrioritiesLocal(dbDefaults);
      setDbBisPrioritiesBaseline(dbDefaults);
    };
    loadDbBis();
  }, [masterItemsDbPhase, activeTab, fetchData, initializeDefaultBisPriorities, setDbBisPrioritiesBaseline, setDbBisPrioritiesLocal]);
}
