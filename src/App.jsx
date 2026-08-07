import { useState, useMemo, useEffect } from 'react';
import { PHASES, PHASE_JSON_KEYS, LEFT_SLOTS, BOTTOM_SLOTS, P2_BOSSES } from './constants';
import { fetchData, putData, postData, deleteData } from './services/apiService';
import { useItemsDatabase } from './hooks/useItemsDatabase';
import OverviewTab from './components/OverviewTab';
import BnetClaimModal from './components/BnetClaimModal';
import AdminContainer from './containers/AdminContainer';
import useAdminData from './hooks/useAdminData';
import useLootCouncilData from './hooks/useLootCouncilData';
import useRaidAssignmentsData from './hooks/useRaidAssignmentsData';
import useRosterData from './hooks/useRosterData';
import ResourcesTab from './features/resources/ResourcesTab';
// component imports replaced by container wrappers
import RosterContainer from './containers/RosterContainer';
import ScoringContainer from './containers/ScoringContainer';
import ItemsDatabaseContainer from './containers/ItemsDatabaseContainer';
import BankContainer from './containers/BankContainer';
import LootCouncilContainer from './containers/LootCouncilContainer';
import RaidAssignmentsContainer from './containers/RaidAssignmentsContainer';
import RaidAssignmentsHistory from './components/RaidAssignmentsHistory';
import AssignedLootOverview from './components/AssignedLootOverview';
import RaidSignupsContainer from './containers/RaidSignupsContainer';
// replaced inline with RaidSignupsContainer
import ItemIdEditorModal from './components/ItemIdEditorModal';
import * as helpers from './utils/helpers';
import useRaidHelperImport from './hooks/useRaidHelperImport';
import useAuthSession from './hooks/useAuthSession';

const CORE_SYNC_INTERVAL_MS = 15000;

export default function App() {
  // ==========================================
  // SPECS DATA FROM DATABASE
  // ==========================================
  const [specsFromDb, setSpecsFromDb] = useState([]);

  // Create lookup objects for specs
  const specsByName = useMemo(() => {
    const lookup = {};
    specsFromDb.forEach(spec => {
      lookup[spec.spec] = spec;
    });
    return lookup;
  }, [specsFromDb]);

  // Sorted specs by class for Master Items DB
  const specsSortedByClass = useMemo(() => {
    return [...specsFromDb].sort((a, b) => {
      if (a.class !== b.class) {
        return a.class.localeCompare(b.class);
      }
      return a.spec.localeCompare(b.spec);
    });
  }, [specsFromDb]);

  // Helper to get slug from display name
  const getSlugFromDisplay = (displayName) => {
    const spec = specsByName[displayName];
    return spec ? spec.slug : null;
  };

  // Helper to get display name from spec_id
  const getDisplayFromId = (specId) => {
    const spec = specsFromDb.find(s => s.id === specId);
    return spec ? spec.spec : null;
  };

  // Helper to get spec object from spec_id
  const getSpecById = (specId) => {
    return specsFromDb.find(s => s.id === specId);
  };

  // Fetch specs on mount
  useEffect(() => {
    const loadSpecs = async () => {
      try {
        const specs = await fetchData('specs');
        setSpecsFromDb(specs);
        // Set default specs to first one from database
        if (specs.length > 0) {
          setNewSpec(prev => prev ?? specs[0].id);
        }
        if (specs.length > 0) {
          setSelectedBisSpec(prev => prev ?? specs[0].spec);
        }
      } catch (e) {
        console.error('Failed to load specs:', e);
      }
    };
    loadSpecs();
  }, []);

  // ==========================================
  // 1. ALL LOCAL UI AND FILTER STATES
  // ==========================================
  const [passwordInput, setPasswordInput] = useState('');
  const [globalMyPlayerId, setGlobalMyPlayerId] = useState(() => localStorage.getItem('my-player-id') || '');

  // Global phase selector (controls which phase's assignments are shown)
  const [globalPhase, setGlobalPhase] = useState('T5');

  // Default to public overview tab
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('active-tab') || 'loot');
  const [overviewSearch, setOverviewSearch] = useState('');
  const [hoveredNavTab, setHoveredNavTab] = useState(null);
  const [bankSubTab, setBankSubTab] = useState('contents');
  const [raidAssignmentsSubTab, setRaidAssignmentsSubTab] = useState('overview');
  const [raidSignupsSubTab, setRaidSignupsSubTab] = useState('templates');
  const [lootSubTab, setLootSubTab] = useState('overview');
  const [adminSubTab, setAdminSubTab] = useState('officerRoles');
  const [resourcesSubTab, setResourcesSubTab] = useState('bis');

  const [isDbConnected, setIsDbConnected] = useState(false);
  const [newSpec, setNewSpec] = useState(null); // spec_id from database
  const [selectedBisSpec, setSelectedBisSpec] = useState(null); // Will be set to first spec from DB
  const [expandedPlayerId, setExpandedPlayerId] = useState(null);
  const [itemIdEditor, setItemIdEditor] = useState(null);

  const {
    mutableItems,
    setMutableItemsLocal,
    setMutableItemsBaseline,
    bisPriorities,
    setBisPrioritiesLocal,
    dbBisPriorities,
    setDbBisPrioritiesLocal,
    masterItemsDbPhase,
    setMasterItemsDbPhase,
    dbNewName,
    setDbNewName,
    dbNewSlot,
    setDbNewSlot,
    dbNewZone,
    setDbNewZone,
    dbNewBoss,
    setDbNewBoss,
    dbNewItemId,
    setDbNewItemId,
    dbSearch,
    setDbSearch,
    dbPageSize,
    setDbPageSize,
    dbPage,
    setDbPage,
    showMissingWowheadFilter,
    setShowMissingWowheadFilter,
    showWowheadNameMismatchFilter,
    setShowWowheadNameMismatchFilter,
    dbBisPrioritiesDirty,
    mutableItemsDirty,
    isSavingItemsDb,
    handleAddItemToDb,
    handleUpdateItemEligibility,
    handleUpdateItemId,
    handleUpdateItemSource,
    handleDeleteItemFromDb,
    handleSaveItemsDbChanges,
  } = useItemsDatabase({
    fetchData,
    putData,
    postData,
    deleteData,
    phaseJsonKeys: PHASE_JSON_KEYS,
    leftSlots: LEFT_SLOTS,
    p2Bosses: P2_BOSSES,
    globalPhase,
    setSelectedItemName,
  });

  const {
    assignments,
    assignmentsDirty,
    hasLootUnsavedChanges,
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
    normalizeAwardedPlayerIds,
    setAssignmentsData,
  } = useLootCouncilData({
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
  });

  const {
    raidAssignmentArchives,
    selectedRaidAssignmentArchiveId,
    selectedRaidRestoreBosses,
    raidAssignmentData,
    enabledBosses,
    raidAssignmentDataDirty,
    enabledBossesDirty,
    isSavingRaidAssignments,
    setRaidAssignmentData,
    handleSaveRaidAssignmentsChanges,
    handleCopyRaidAssignmentsToArchive,
    handleViewRaidAssignmentArchive,
    handleToggleRaidRestoreBoss,
    handleRestoreRaidAssignmentArchive,
    handleToggleZone,
    handleToggleBoss,
    handleAddCustomRaidBoss,
    handleRemoveCustomRaidBoss,
    customRaidGroups,
    raidZones,
  } = useRaidAssignmentsData({
    fetchData,
    putData,
    activeTab,
    setActiveTab,
    setRaidAssignmentsSubTab,
    isAuthenticated,
  });

  const handleMainNavSelect = (mainTab, subTab = null) => {
    setHoveredNavTab(null);

    if (mainTab === 'overview') {
      setActiveTab('loot');
      setLootSubTab('overview');
      return;
    }

    if (mainTab === 'bank') {
      if (subTab === 'requests') {
        setActiveTab('bankRequests');
      } else {
        setActiveTab('bank');
        setBankSubTab(subTab || 'contents');
      }
    } else if (mainTab === 'raidAssignments') {
      setActiveTab('raidAssignments');
      setRaidAssignmentsSubTab(subTab || 'overview');
    } else if (mainTab === 'raidSignups') {
      setActiveTab('raidSignups');
      setRaidSignupsSubTab(subTab || 'templates');
    } else if (mainTab === 'loot') {
      if (subTab === 'scoring') {
        setActiveTab('scoring');
      } else {
        setActiveTab('loot');
        setLootSubTab(subTab || 'overview');
      }
    } else if (mainTab === 'admin') {
      if (subTab === 'config') {
        setActiveTab('discordBotConfig');
      } else if (subTab === 'itemsdb') {
        setActiveTab('itemsdb');
      } else if (subTab === 'todo') {
        setActiveTab('officerRoles');
        setAdminSubTab('todo');
      } else {
        setActiveTab('officerRoles');
        setAdminSubTab(subTab || 'officerRoles');
      }
    } else if (mainTab === 'resources') {
      setActiveTab('bis');
      setResourcesSubTab(subTab || 'bis');
    } else {
      setActiveTab(mainTab);
    }
  };

  const getDropdownItemActiveState = (groupKey, subTab) => {
    if (groupKey === 'bank') {
      if (subTab === 'requests') return activeTab === 'bankRequests';
      return activeTab === 'bank' && bankSubTab === subTab;
    }

    if (groupKey === 'raidAssignments') {
      return activeTab === 'raidAssignments' && raidAssignmentsSubTab === subTab;
    }

    if (groupKey === 'raidSignups') {
      return activeTab === 'raidSignups' && raidSignupsSubTab === subTab;
    }

    if (groupKey === 'loot') {
      if (subTab === 'scoring') return activeTab === 'scoring';
      return activeTab === 'loot' && lootSubTab === subTab;
    }

    if (groupKey === 'admin') {
      if (subTab === 'officerRoles') return activeTab === 'officerRoles' && adminSubTab === 'officerRoles';
      if (subTab === 'config') return activeTab === 'discordBotConfig';
      if (subTab === 'itemsdb') return activeTab === 'itemsdb';
      if (subTab === 'todo') return activeTab === 'officerRoles' && adminSubTab === 'todo';
      return false;
    }

    if (groupKey === 'resources') {
      return activeTab === 'bis' && resourcesSubTab === subTab;
    }

    return activeTab === groupKey;
  };

  const renderDropdownNavButton = (keyName, label, mainTab, subTabs) => {
    const isActive = keyName === 'bank'
      ? (activeTab === 'bank' || activeTab === 'bankRequests')
      : keyName === 'loot'
        ? (activeTab === 'loot' || activeTab === 'scoring')
        : keyName === 'admin'
          ? (activeTab === 'officerRoles' || activeTab === 'discordBotConfig' || activeTab === 'itemsdb')
          : keyName === 'resources'
            ? activeTab === 'bis'
            : activeTab === mainTab;
    const isHovered = hoveredNavTab === keyName;

    return (
      <div
        key={keyName}
        className="relative inline-flex items-start"
        onMouseEnter={() => setHoveredNavTab(keyName)}
        onMouseLeave={() => setHoveredNavTab(null)}
      >
        <button
          type="button"
          onClick={() => handleMainNavSelect(mainTab, subTabs?.[0]?.value)}
          className={`relative z-20 whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${isActive
            ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800 -mb-px'
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}
        >
          {label}
        </button>
        {isHovered && (
          <div
            className={`absolute top-full z-[60] flex flex-wrap gap-1 border-l border-r border-b border-slate-800 rounded-b-lg bg-slate-950/95 px-2 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.35)] overflow-visible ${keyName === 'bank' ? 'left-0 justify-start' : 'left-1/2 -translate-x-1/2 justify-center'}`}
            style={{ minWidth: '240px', width: 'max-content', maxWidth: 'min(95vw, 760px)' }}
          >
            {subTabs.map(tab => {
              const isLocked = Boolean(tab.authOnly && !isAuthenticated);
              const isSubActive = getDropdownItemActiveState(keyName, tab.value);
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    if (isLocked) return;
                    handleMainNavSelect(mainTab, tab.value);
                  }}
                  disabled={isLocked}
                  className={`flex-none whitespace-nowrap px-3 py-2 font-semibold text-xs uppercase tracking-wider transition-colors rounded-lg text-center ${isLocked ? 'opacity-50 cursor-not-allowed' : ''} ${isSubActive ? 'bg-slate-900 border border-slate-800 text-cyan-400' : 'text-amber-300 hover:text-slate-300 hover:bg-slate-900/50'}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const bankSubTabs = [
    { value: 'contents', label: 'Contents' },
    { value: 'requests', label: 'Requests', authOnly: true },
    { value: 'addon', label: 'Addon' },
    { value: 'update', label: 'Update', authOnly: true },
    { value: 'history', label: 'History' }
  ];

  const raidAssignmentsSubTabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'history', label: 'History' }
  ];

  const raidSignupsSubTabs = [
    { value: 'templates', label: 'Templates' },
    { value: 'events', label: 'Events' },
    { value: 'group-config', label: 'Group Config' },
    { value: 'history', label: 'History' }
  ];

  const lootSubTabs = [
    { value: 'overview', label: 'Priority Overview' },
    { value: 'assignment', label: 'Priority Assignment', authOnly: true },
    { value: 'scoring', label: 'Scoring', authOnly: true },
    { value: 'assigned', label: 'Assigned Loot', authOnly: true },
    { value: 'roster', label: 'Roster', authOnly: true }
  ];

  const adminSubTabs = [
    { value: 'officerRoles', label: 'Officer Roles', authOnly: true },
    { value: 'config', label: 'Config', authOnly: true },
    { value: 'itemsdb', label: 'Master Items DB', authOnly: true },
    { value: 'todo', label: 'To-do List', authOnly: true }
  ];

  const resourcesSubTabs = [
    { value: 'bis', label: 'BiS Lists' },
    { value: 'tactics', label: 'Tactics' },
    { value: 'weakauras', label: 'Weakauras' },
    { value: 'cheatsheets', label: 'Cheat Sheets' },
    { value: 'instructions', label: 'Site Instructions' },
    { value: 'raidlogs', label: 'Raid Logs' },
    { value: 'wowaudit', label: 'WoWAudit' },
    { value: 'wipefest', label: 'Wipefest' }
  ];

  // Persist current tab so refresh restores where the user left off.
  useEffect(() => {
    localStorage.setItem('active-tab', activeTab);
  }, [activeTab]);



  // bankArchivedRequestIds and bankContentsHistory are persisted inside useBankData

  // ==========================================
  // 2. CLOUD SYNCHRONIZATION STATES
  // ==========================================
  const [roster, setRosterLocal] = useState([]);
  const [scoringConfig, setScoringConfigLocal] = useState({});
  const [playerStats, setPlayerStatsLocal] = useState({});
  const [raidLogs, setRaidLogsLocal] = useState([]);

  const [rosterDirty, setRosterDirty] = useState(false);
  const [scoringConfigDirty, setScoringConfigDirty] = useState(false);
  const [playerStatsDirty, setPlayerStatsDirty] = useState(false);
  const [raidLogsDirty, setRaidLogsDirty] = useState(false);

  const [isSavingScoring, setIsSavingScoring] = useState(false);

  const {
    isAuthenticated,
    handleLogin,
    handleLogout,
    bnetAuthState,
    bnetClaimBusy,
    showBnetClaimModal,
    setShowBnetClaimModal,
    handleBattleNetLogin,
    handleBattleNetLogout,
    handleBattleNetClaim,
    handleBattleNetManualClaim,
    rosterClaims,
    refreshRosterClaims,
    handleUnclaimClaim
  } = useAuthSession({ fetchData, setRoster: setRosterLocal, setRosterDirty });

  const setRoster = (newVal) => {
    setRosterLocal(newVal);
    setRosterDirty(true);
  };
  const setScoringConfig = (newVal) => { setScoringConfigLocal(newVal); setScoringConfigDirty(true); };
  const setPlayerStats = (newVal) => { setPlayerStatsLocal(newVal); setPlayerStatsDirty(true); };
  const setRaidLogs = (newVal) => { setRaidLogsLocal(newVal); setRaidLogsDirty(true); };

  const adminData = useAdminData({
    fetchData,
    putData,
    activeTab,
    adminSubTab,
    scoringConfigDirty,
    setScoringConfigDirty,
    scoringConfig,
    setScoringConfig,
    refreshRosterClaims
  });

  // If a saved tab requires auth and the session is locked, fall back safely.
  useEffect(() => {
    const authOnlyTabs = ['bankRequests', 'loot', 'roster', 'scoring', 'itemsdb', 'officerRoles', 'discordBotConfig'];
    if (!isAuthenticated && authOnlyTabs.includes(activeTab)) {
      setActiveTab('loot');
      setLootSubTab('overview');
    }
  }, [isAuthenticated, activeTab]);

  const sortedRosterForSelector = useMemo(() => {
    return [...roster].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }, [roster]);

  const currentUserClaimedRosterIds = useMemo(() => {
    if (!bnetAuthState.authenticated) return new Set();
    return new Set((bnetAuthState.claimedCharacters || []).map(claim => Number(claim.rosterId)).filter(Boolean));
  }, [bnetAuthState.authenticated, bnetAuthState.claimedCharacters]);

  const selectedGlobalPlayer = useMemo(() => {
    return roster.find(player => String(player.id) === String(globalMyPlayerId)) || null;
  }, [globalMyPlayerId, roster]);

  const selectedGlobalPlayerIsClaimed = useMemo(() => {
    if (!selectedGlobalPlayer) return false;
    return Boolean(selectedGlobalPlayer.user_id);
  }, [selectedGlobalPlayer]);

  const selectedMyPlayerName = useMemo(() => {
    if (!globalMyPlayerId) return '';
    const player = roster.find(p => String(p.id) === String(globalMyPlayerId));
    return player?.name || '';
  }, [globalMyPlayerId, roster]);

  const selectedMyPlayerBisSpec = useMemo(() => {
    if (!globalMyPlayerId) return null;
    const player = roster.find(p => p.id === parseInt(globalMyPlayerId, 10));
    if (!player) return null;
    return getDisplayFromId(player.spec_id);
  }, [globalMyPlayerId, roster, specsFromDb]);

  // When opening BiS Config, default the spec selector to the selected character.
  useEffect(() => {
    if (activeTab !== 'bis') return;
    if (!selectedMyPlayerBisSpec) return;
    if (selectedBisSpec !== selectedMyPlayerBisSpec) {
      setSelectedBisSpec(selectedMyPlayerBisSpec);
    }
  }, [activeTab, selectedMyPlayerBisSpec]);

  // RaidHelper import handling (extracted to hook)
  const {
    raidHelperImportSession,
    recentRaidHelperImportedIds,
    recentRaidHelperSpecConflictIds,
    handleImportRaidHelperJson,
    handleUpdateRaidHelperImportEntry,
    handleCancelRaidHelperImport,
    handleApplyRaidHelperImport
  } = useRaidHelperImport({ roster, specsFromDb, playerStats, raidLogs, setRoster, setPlayerStats, setRaidLogs, setNewRaidDate: rosterData.setNewRaidDate, setNewRaidZone: rosterData.setNewRaidZone, fetchData });

  const rosterData = useRosterData({
    fetchData,
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
  });

  const hasItemsDbUnsavedChanges = dbBisPrioritiesDirty || mutableItemsDirty;
  const hasRosterUnsavedChanges = rosterDirty || raidLogsDirty || playerStatsDirty;
  const hasScoringUnsavedChanges = scoringConfigDirty || playerStatsDirty;
  const hasRaidAssignmentsUnsavedChanges = raidAssignmentDataDirty || enabledBossesDirty;
  const hasAnyUnsavedChanges = hasLootUnsavedChanges || hasItemsDbUnsavedChanges || hasRosterUnsavedChanges || hasScoringUnsavedChanges || hasRaidAssignmentsUnsavedChanges || adminData.hasAdminUnsavedChanges;
  const unsavedSections = [
    hasLootUnsavedChanges ? 'Loot Council' : null,
    hasRaidAssignmentsUnsavedChanges ? 'Raid Assignments' : null,
    hasRosterUnsavedChanges ? 'Roster' : null,
    hasScoringUnsavedChanges ? 'Scoring' : null,
    hasItemsDbUnsavedChanges ? 'Items DB' : null,
    adminData.officerRolesDirty ? 'Officer Roles' : null,
    adminData.discordBotConfigDirty ? 'Discord Config' : null,
    adminData.todoDirty ? 'To-do List' : null
  ].filter(Boolean);

  // ==========================================
  // HELPER: Initialize default BiS priorities from aggregated data
  // ==========================================

  const initializeDefaultBisPriorities = async (phase) => {
    const phaseKey = PHASE_JSON_KEYS[phase];
    const data = await fetchData(`bis-defaults/${phaseKey}`);
    return data;
  };

  // ==========================================
  // 3. SQL SYNC ENGINE
  // ==========================================
  useEffect(() => {
    let isSyncInFlight = false;

    const loadAll = async () => {
      if (document.hidden || isSyncInFlight) return;
      isSyncInFlight = true;
      try {
        const phaseKey = PHASE_JSON_KEYS[globalPhase];
        const assignmentsDocName = globalPhase === 'T5' ? 't5' : phaseKey;
        const bisPrioritiesDocName = globalPhase === 'T5' ? 't5' : phaseKey;

        const [rosterData, assignmentsData, bisData, configData, statsData, logsData, itemsData] = await Promise.all([
          fetchData('roster'),
          fetchData('assignments/' + assignmentsDocName),
          fetchData('bis-priorities/' + bisPrioritiesDocName),
          fetchData('scoring-config'),
          fetchData('player-stats'),
          fetchData('raid-logs'),
          fetchData('mutable-items'),
        ]);

        if (!rosterDirty) setRosterLocal(rosterData);
        if (!assignmentsDirty) setAssignmentsData(assignmentsData, { dirty: false });
        const defaults = Object.keys(bisData).length ? bisData : await initializeDefaultBisPriorities(globalPhase);
        setBisPrioritiesLocal(defaults);
        if (!scoringConfigDirty) {
          setScoringConfigLocal(Object.keys(configData).length ? configData : { parseWeight: 1, supportMulti: 1.5, consBonus: 10, enchantBonus: 10, gemBonus: 10, attWeight: 0.5, afkPenalty: 5 });
        }
        if (!playerStatsDirty) setPlayerStatsLocal(statsData);
        if (!raidLogsDirty) setRaidLogsLocal(logsData);
        if (!mutableItemsDirty) {
          setMutableItemsLocal(itemsData);
          setMutableItemsBaseline(itemsData);
        }
        setIsDbConnected(true);
      } catch (e) {
        console.error('Failed to load data:', e);
      } finally {
        isSyncInFlight = false;
      }
    };

    loadAll();
    const interval = setInterval(loadAll, CORE_SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [globalPhase, rosterDirty, assignmentsDirty, scoringConfigDirty, playerStatsDirty, raidLogsDirty, mutableItemsDirty]);

  // Separate sync for Master Items DB phase selector
  useEffect(() => {
    if (activeTab !== 'bis' && activeTab !== 'itemsdb') return;

    const loadDbBis = async () => {
      const phaseKey = PHASE_JSON_KEYS[masterItemsDbPhase];
      const data = await fetchData('bis-priorities/' + phaseKey);
      const dbDefaults = Object.keys(data).length ? data : await initializeDefaultBisPriorities(masterItemsDbPhase);
      setDbBisPrioritiesLocal(dbDefaults);
    };
    loadDbBis();
  }, [masterItemsDbPhase, activeTab]);

  // ==========================================
  // 4. CLOUD WRITERS
  // ==========================================
  // Roster state setters are defined above the hook usage to keep the shared state flow consistent.
  // ==========================================
  // 5. WOWHEAD TOOLTIP ENGINE
  // ==========================================

  useEffect(() => {
    const tooltips = document.querySelectorAll('.wowhead-tooltip');
    tooltips.forEach(t => { t.style.display = 'none'; });
    if (window.$WowheadPower && window.$WowheadPower.hideTooltip) { window.$WowheadPower.hideTooltip(); }
  }, [activeTab, filterBoss, filterZone, filterSlot, searchQuery, dbSearch, overviewSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.$WowheadPower && window.$WowheadPower.refreshLinks) {
        window.$WowheadPower.refreshLinks();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [activeTab, roster, assignments, mutableItems, selectedItemName, searchQuery, filterBoss, filterZone, filterSlot, dbSearch, overviewSearch, selectedBisSpec]);


  const hideWowheadTooltip = () => {
    if (window.$WowheadPower && window.$WowheadPower.hideTooltip) { window.$WowheadPower.hideTooltip(); }
  };

  const renderItemLink = (item, className = "") => {
    const url = item.itemId
      ? `https://www.wowhead.com/tbc/item=${item.itemId}`
      : `https://www.wowhead.com/tbc/search?q=${encodeURIComponent(item.name)}`;

    return (
      <a href={url} target="_blank" rel="noreferrer" className={`hover:underline cursor-help ${className}`} onMouseLeave={hideWowheadTooltip}>
        {item.name}
      </a>
    );
  };

  // Auth/session handlers are provided by `useAuthSession` hook.
  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    const ok = await handleLogin(passwordInput);
    if (ok) {
      setPasswordInput('');
    } else {
      alert('Incorrect password! Access Denied.');
      setPasswordInput('');
    }
  };

  const calculateScore = (playerId) => {
    const stats = playerStats[playerId] || { cons: false, enchants: false, gems: false, afks: 0, parses: {}, manualAdjustment: { value: 0, note: '' } };
    let parseSum = 0; let parseCount = 0;
    Object.values(stats.parses || {}).forEach(p => {
      if (p && p.val) { parseSum += Number(p.val) * (p.support ? Number(scoringConfig.supportMulti) : 1); parseCount++; }
    });
    const avgParse = parseCount > 0 ? parseSum / parseCount : 0;
    const cons = stats.cons ? Number(scoringConfig.consBonus) : 0;
    const ench = stats.enchants ? Number(scoringConfig.enchantBonus) : 0;
    const gem = stats.gems ? Number(scoringConfig.gemBonus) : 0;
    const att = rosterData.calculateAttendance(playerId) * Number(scoringConfig.attWeight);
    const afkPenalty = (stats.afks || 0) * Number(scoringConfig.afkPenalty || 5);
    const manualAdj = stats.manualAdjustment?.value || 0;

    return ((avgParse * Number(scoringConfig.parseWeight)) + cons + ench + gem + att - afkPenalty + manualAdj).toFixed(1);
  };

  const normalizeRaidHelperToken = helpers.normalizeRaidHelperToken;
  const parseRaidSignupDate = helpers.parseRaidSignupDate;

  const handleApplyRaidSignupGroupsToAttendance = async (eventId) => {
    const numericEventId = Number(eventId);
    if (!numericEventId) {
      alert('Select a raid signup event first.');
      return false;
    }

    try {
      const event = await fetchData(`raid-signup-events/${numericEventId}`);
      const groups = Array.isArray(event?.groups) ? event.groups : [];
      const groupedNames = [...new Set(
        groups
          .map(row => String(row?.player_name || '').trim())
          .filter(Boolean)
      )];

      if (groupedNames.length === 0) {
        alert('This signup event has no grouped players assigned yet.');
        return false;
      }

      const rosterByToken = new Map();
      roster.forEach(player => {
        const token = normalizeRaidHelperToken(player.name);
        if (!rosterByToken.has(token)) rosterByToken.set(token, []);
        rosterByToken.get(token).push(player);
      });

      const attendeeIds = [];
      const unmatched = [];
      const ambiguous = [];

      groupedNames.forEach(name => {
        const token = normalizeRaidHelperToken(name);
        const matches = rosterByToken.get(token) || [];

        if (matches.length === 0) {
          unmatched.push(name);
          return;
        }

        if (matches.length > 1) {
          ambiguous.push(name);
        }

        attendeeIds.push(Number(matches[0].id));
      });

      const attendeeSet = new Set(attendeeIds);
      const rosterWithRaidState = roster.map(player => ({
        ...player,
        in_raid: attendeeSet.has(Number(player.id))
      }));

      const raidDate = parseRaidSignupDate(event?.scheduled_for);
      const raidZone = String(event?.title || rosterData.newRaidZone || 'Raid Signup Import').trim();

      setRoster(rosterWithRaidState);
      setRaidLogs([{ id: Date.now(), date: raidDate, zone: raidZone, attendees: [...attendeeSet] }, ...raidLogs]);
      rosterData.setNewRaidDate(raidDate);
      rosterData.setNewRaidZone(raidZone);

      let msg = `Imported ${attendeeSet.size} grouped attendees from signup #${numericEventId}.`;
      if (unmatched.length > 0) {
        msg += `\nUnmatched (${unmatched.length}): ${unmatched.slice(0, 12).join(', ')}${unmatched.length > 12 ? ', ...' : ''}`;
      }
      if (ambiguous.length > 0) {
        msg += `\nAmbiguous name matches (${ambiguous.length}) used first roster match.`;
      }

      alert(msg);
      return true;
    } catch {
      alert('Failed to import attendees from raid signup event.');
      return false;
    }
  };

  // These handlers are provided by useRaidHelperImport.
  // const handleImportRaidHelperJson = (rawJson) => { ... }
  // const handleUpdateRaidHelperImportEntry = (entryId, patch) => { ... }
  // const handleCancelRaidHelperImport = () => { ... }
  // const handleApplyRaidHelperImport = () => { ... }

  const handleOpenItemForLootAssignment = (itemName) => {
    if (!itemName) return;
    setActiveTab('loot');
    setLootSubTab('assignment');
    setSearchQuery(itemName);
    setSelectedItemName(itemName);
  };

  const handleSaveScoringChanges = async ({ silent = false } = {}) => {
    if (!scoringConfigDirty && !playerStatsDirty) return;
    setIsSavingScoring(true);
    try {
      if (scoringConfigDirty) {
        await putData('scoring-config', scoringConfig);
      }
      if (playerStatsDirty) {
        await putData('player-stats', playerStats);
      }
      setScoringConfigDirty(false);
      setPlayerStatsDirty(false);
      if (!silent) alert('Scoring configuration saved.');
    } catch (e) {
      if (!silent) alert('Failed to save scoring changes.');
      throw e;
    } finally {
      setIsSavingScoring(false);
    }
  };


  const handleSaveAllChanges = async () => {
    if (!hasAnyUnsavedChanges) return;
    try {
      if (hasLootUnsavedChanges) await handleSaveLootCouncilChanges({ silent: true });
      if (hasRaidAssignmentsUnsavedChanges) await handleSaveRaidAssignmentsChanges({ silent: true });
      if (hasRosterUnsavedChanges) await rosterData.handleSaveRosterAttendanceChanges({ silent: true });
      if (hasScoringUnsavedChanges) await handleSaveScoringChanges({ silent: true });
      if (hasItemsDbUnsavedChanges) await handleSaveItemsDbChanges();
      if (adminData.hasAdminUnsavedChanges) await adminData.handleSaveAdminChanges({ silent: true });
      alert('All pending changes saved.');
    } catch (error) {
      alert(error?.message || 'Failed to save all changes.');
    }
  };


  const getRankBadgeStyle = (rank) => {
    if (rank === 1) return "bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-950 border border-yellow-200 shadow-[0_0_10px_rgba(253,224,71,0.6)]";
    if (rank === 2) return "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-950 border border-slate-200 shadow-[0_0_8px_rgba(203,213,225,0.5)]";
    if (rank === 3) return "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 border border-amber-500 shadow-[0_0_8px_rgba(217,119,6,0.5)]";
    if (typeof rank === 'number') return "bg-slate-800 text-white border border-slate-600";
    if (rank === 'Pass') return "bg-red-950/50 text-red-400 border border-red-900";
    return "bg-slate-900 text-slate-500 border border-slate-800 border-dashed";
  };

  const normalizeSlotKey = helpers.normalizeSlotKey;
  const isGroupedSlot = helpers.isGroupedSlot;

  const getItemsForSlotAndSpec = (slot, spec) => {
    const normalizedSlot = normalizeSlotKey(slot);
    const isGrouped = isGroupedSlot(slot);
    const slotIndex = slot === "Ring 2" || slot === "Trinket 2" ? 1 : 0;
    const isDualSlot = slot.endsWith(" 1") || slot.endsWith(" 2");

    const itemsInSlot = mutableItems.filter(i => {
      const itemSlot = normalizeSlotKey(i?.slot);
      if (!itemSlot) return false;
      if (isGrouped) return itemSlot === normalizedSlot;
      if (itemSlot === normalizedSlot) return true;
      if (normalizedSlot === 'weapon' && itemSlot === 'weapon') return true;
      return false;
    });

    const bis = itemsInSlot.filter(item => {
      const itemKey = `${item.name}|${spec}`;
      return dbBisPriorities[itemKey] === 'BiS';
    });
    const opt = itemsInSlot.filter(item => {
      const itemKey = `${item.name}|${spec}`;
      return dbBisPriorities[itemKey] === 'Opt';
    });

    if (!isGrouped && isDualSlot) {
      const bisForThisSlot = bis[slotIndex] ? [bis[slotIndex]] : [];
      const optForThisSlot = slotIndex === 0 && bis.length <= 1 ? opt
        : slotIndex === 1 && bis.length >= 2 ? opt
          : slotIndex === 1 && bis.length < 2 ? [...bis.slice(1), ...opt]
            : [];
      return { bis: bisForThisSlot, opt: optForThisSlot };
    }

    return { bis, opt };
  };

  const jumpToMasterItemsDbForItem = (itemName) => {
    const targetName = String(itemName || '').trim().toLowerCase();
    if (!targetName) return;

    const item = mutableItems.find(entry => String(entry.name || '').trim().toLowerCase() === targetName);
    if (!item) {
      alert(`Item not found in Master Items DB: ${itemName}`);
      return;
    }

    setItemIdEditor({
      itemId: item.id,
      itemName: item.name,
      wowheadIdInput: String(item.itemId || '')
    });
  };

  const handleSaveItemIdFromModal = (itemId, wowheadIdInput) => {
    const trimmed = String(wowheadIdInput || '').trim();
    if (trimmed && !/^\d+$/.test(trimmed)) {
      alert('Wowhead ID must be numeric (or blank to clear).');
      return;
    }
    handleUpdateItemId(itemId, trimmed);
    setItemIdEditor(null);
  };

  const renderItemSlot = (slotName) => {
    const { bis, opt } = getItemsForSlotAndSpec(slotName, selectedBisSpec);
    const isBottomSlot = BOTTOM_SLOTS.includes(slotName);
    const isGroupedDisplaySlot = ['Rings', 'Trinkets'].includes(slotName);

    // For dual slots, hide the second slot entirely if there's no second item
    const isDualSecond = slotName === "Ring 2" || slotName === "Trinket 2";
    if (isDualSecond && bis.length === 0 && opt.length === 0) return null;

    if (bis.length === 0 && opt.length === 0 && !BOTTOM_SLOTS.includes(slotName)) {
      return (
        <div key={slotName} className="flex gap-3 bg-slate-900/40 border border-slate-800/50 p-2.5 rounded-lg opacity-50">
          <div className="w-10 h-10 rounded bg-slate-950 border border-slate-800 flex-shrink-0"></div>
          <div className="flex flex-col justify-center">
            <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">{slotName}</span>
            <span className="text-sm text-slate-700 font-medium">No items found</span>
          </div>
        </div>
      );
    }
    if (bis.length === 0 && opt.length === 0) return null;

    const primaryBis = isGroupedDisplaySlot ? bis.slice(0, 2) : bis;
    const extraItems = isGroupedDisplaySlot
      ? [
          ...bis.slice(2).map(item => ({ item, kind: 'bis' })),
          ...opt.map(item => ({ item, kind: 'opt' }))
        ]
      : opt.map(item => ({ item, kind: 'opt' }));
    const iconItems = isGroupedDisplaySlot ? primaryBis : bis.slice(0, 1);

    const renderItemSource = (item) => {
      const bossName = String(item?.boss || '').trim();
      if (bossName) {
        return <span className="text-[10px] text-slate-500 font-medium">Boss: {bossName}</span>;
      }

      const source = String(item?.source || '').trim();
      const sourceType = String(item?.source_type || '').trim();
      const normalizedSource = source.toLowerCase();
      const normalizedSourceType = sourceType.toLowerCase();
      const genericArmorValues = ['armor', 'cloth armor', 'leather armor', 'mail armor', 'plate armor', 'cloak', 'ring', 'trinket'];

      const fallbackValue = source && !genericArmorValues.includes(normalizedSource) ? source : (sourceType && !genericArmorValues.includes(normalizedSourceType) ? sourceType : '');
      if (!fallbackValue) return null;

      return <span className="text-[10px] text-slate-500 font-medium">Source: {fallbackValue}</span>;
    };

    return (
      <div key={slotName} className="flex gap-3 bg-slate-900 border border-slate-700 hover:border-slate-500 p-2.5 rounded-lg transition-colors shadow-sm">
        <div key={`${slotName}-${selectedBisSpec}`} className="flex flex-col gap-2 flex-shrink-0">
          {iconItems.length > 0 ? (
            iconItems.map((item, index) => (
              <div key={`${item.name}-${index}`} className="w-10 h-10 rounded border border-purple-500/50 bg-slate-950 flex items-center justify-center relative shadow-inner overflow-hidden character-slot-icon">
                {item.itemId ? (
                  <a
                    href={`https://tbc.wowhead.com/item=${item.itemId}`}
                    data-wh-rename-link="false"
                    data-wh-icon-size="large"
                    className="item-link"
                    target="_blank"
                    rel="noreferrer"
                    onMouseLeave={hideWowheadTooltip}
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent"></div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase z-10 rotate-45 opacity-30">{slotName}</span>
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="w-10 h-10 rounded border border-purple-500/50 bg-slate-950 flex items-center justify-center relative shadow-inner overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent"></div>
              <span className="text-[9px] font-bold text-slate-500 uppercase z-10 rotate-45 opacity-30">{slotName}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col min-w-0 justify-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">{slotName}</span>
          {primaryBis.length > 0 ? (
            primaryBis.map(i => (
              <div key={i.name} className="flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  {renderItemLink(i, "text-sm font-bold text-purple-400 drop-shadow-sm leading-tight")}
                  {/* Edit pencil disabled for now.
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => jumpToMasterItemsDbForItem(i?.name || '')}
                      className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10px] font-black leading-none shadow"
                      title={i?.itemId ? 'Edit Wowhead ID in Master Items DB' : 'Set Wowhead ID in Master Items DB'}
                    >
                      âœŽ
                    </button>
                  )}
                  */}
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-[10px] text-amber-500/70 font-semibold">{i.boss}</span>
                    {i.drop_chance && <span className="text-[10px] text-cyan-400/70 font-semibold">{(i.drop_chance * 100).toFixed(0)}% Drop</span>}
                  </div>
                  {renderItemSource(i)}
                </div>
              </div>
            ))
          ) : (<span className="text-sm font-bold text-slate-500 italic leading-tight">No primary BiS</span>)}
          {extraItems.length > 0 && (
            <div className="mt-1 flex flex-col gap-y-1 border-t border-slate-800/70 pt-2">
              {extraItems.map(({ item: i, kind }) => (
                <div key={`${i.name}-${kind}`} className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] text-amber-500/70 font-semibold uppercase flex-shrink-0">{kind === 'bis' ? 'More BiS:' : 'Alt:'}</span>
                    <div className="flex items-center justify-between gap-2 w-full min-w-0">
                      {renderItemLink(i, "text-[10px] text-slate-400 truncate max-w-[150px]")}
                      {/* Edit pencil disabled for now.
                      {isAuthenticated && (
                        <button
                          type="button"
                          onClick={() => jumpToMasterItemsDbForItem(i?.name || '')}
                          className="w-4 h-4 flex-shrink-0 flex items-center justify-center rounded-full bg-amber-600 hover:bg-amber-500 text-slate-950 text-[9px] font-black leading-none shadow"
                          title={i?.itemId ? 'Edit Wowhead ID in Master Items DB' : 'Set Wowhead ID in Master Items DB'}
                        >
                          âœŽ
                        </button>
                      )}
                      */}
                    </div>
                    {!isBottomSlot && <span className="text-[10px] text-amber-500/70 font-semibold whitespace-nowrap">{i.boss}</span>}
                  </div>
                  {isBottomSlot && (
                    <div className="flex flex-col gap-0.5 pl-6">
                      <div className="flex gap-2">
                        <span className="text-[10px] text-amber-500/70 font-semibold">{i.boss}</span>
                        {i.drop_chance && <span className="text-[10px] text-cyan-400/70 font-semibold">{(i.drop_chance * 100).toFixed(0)}% Drop</span>}
                      </div>
                      {renderItemSource(i)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const filteredOverviewItems = useMemo(() => {
    let items = mutableItems.filter(item => {
      if (!item || !item.name) return false;  // add this line
      const itemAssignments = assignments[item.name];
      if (!itemAssignments) return false;
      return Object.values(itemAssignments).some(rank => rank !== null && rank !== undefined);
    });

    // 2. Then apply the search filter (item name OR player name)
    if (overviewSearch.trim() !== '') {
      const term = overviewSearch.toLowerCase();
      items = items.filter(item => {
        if (item.name.toLowerCase().includes(term)) return true;

        const assignedPlayerIds = Object.keys(assignments[item.name] || {}).filter(id => assignments[item.name][id] !== null);
        const assignedPlayers = roster.filter(p => assignedPlayerIds.includes(String(p.id)));
        return assignedPlayers.some(p => p.name.toLowerCase().includes(term));
      });
    }

    return items;
  }, [mutableItems, assignments, roster, overviewSearch]);

  useEffect(() => {
    if (activeTab !== 'overview') return;
    const timer = setTimeout(() => {
      if (window.$WowheadPower && window.$WowheadPower.refreshLinks) {
        window.$WowheadPower.refreshLinks();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [filteredOverviewItems]);

  useEffect(() => {
    if (!hasAnyUnsavedChanges) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasAnyUnsavedChanges]);

  const PlayerNameWithScore = ({ player }) => {
    const specDisplay = getDisplayFromId(player.spec_id) || '?';
    return (
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg leading-tight drop-shadow-sm" style={{ color: specsByName[specDisplay]?.color || '#FFFFFF' }}>{player.name}</span>
        <span className="bg-amber-900/60 text-amber-400 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 font-bold shadow-inner flex items-center gap-1">
          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
          {calculateScore(player.id)}
        </span>
      </div>
    );
  };

  const scoringTabProps = {
    scoringConfig,
    setScoringConfig,
    roster,
    playerStats,
    expandedPlayerId,
    setExpandedPlayerId,
    getSpecById,
    getDisplayFromId,
    calculateAttendance: rosterData.calculateAttendance,
    updatePlayerStat: rosterData.updatePlayerStat,
    updatePlayerParse: rosterData.updatePlayerParse,
    updatePlayerManualAdjustment: rosterData.updatePlayerManualAdjustment,
    PlayerNameWithScore,
    hasUnsavedChanges: scoringConfigDirty || playerStatsDirty,
    onSaveChanges: handleSaveScoringChanges,
    isSaving: isSavingScoring
  };

  const itemsDbTabProps = {
    dbNewName,
    setDbNewName,
    dbNewSlot,
    setDbNewSlot,
    dbNewZone,
    setDbNewZone,
    dbNewBoss,
    setDbNewBoss,
    dbNewItemId,
    setDbNewItemId,
    handleAddItemToDb,
    dbSearch,
    setDbSearch,
    dbPageSize,
    setDbPageSize,
    dbPage,
    setDbPage,
    showMissingWowheadFilter,
    setShowMissingWowheadFilter,
    showWowheadNameMismatchFilter,
    setShowWowheadNameMismatchFilter,
    dbFilteredItems: mutableItems.filter(item => {
      const name = String(item?.name || '').toLowerCase();
      const query = (dbSearch || '').toLowerCase();
      if (query && !name.includes(query)) return false;
      if (showMissingWowheadFilter && item?.itemId) return false;
      if (showWowheadNameMismatchFilter && !item?.name) return false;
      return true;
    }),
    specsSortedByClass,
    dbBisPriorities,
    handleUpdateItemEligibility,
    handleUpdateItemId,
    handleUpdateItemSource,
    handleDeleteItemFromDb,
    renderItemLink,
    masterItemsDbPhase,
    setMasterItemsDbPhase,
    hasUnsavedChanges: dbBisPrioritiesDirty || mutableItemsDirty,
    onSaveChanges: handleSaveItemsDbChanges,
    isSaving: isSavingItemsDb
  };

  const rosterTabProps = {
    fetchData,
    handleSaveRaidLog: rosterData.handleSaveRaidLog,
    handleApplyRaidSignupGroupsToAttendance,
    handleImportRaidHelperJson,
    newRaidDate: rosterData.newRaidDate,
    setNewRaidDate: rosterData.setNewRaidDate,
    newRaidZone: rosterData.newRaidZone,
    setNewRaidZone: rosterData.setNewRaidZone,
    raidLogs,
    handleDeleteRaidLog: rosterData.handleDeleteRaidLog,
    handleAddPlayer: rosterData.handleAddPlayer,
    newName: rosterData.newName,
    setNewName: rosterData.setNewName,
    newSpec: rosterData.newSpec,
    setNewSpec: rosterData.setNewSpec,
    specsFromDb,
    setAllRaidStatus: rosterData.setAllRaidStatus,
    roster,
    getSpecById,
    toggleRaidStatus: rosterData.toggleRaidStatus,
    handleUpdatePlayer: rosterData.handleUpdatePlayer,
    handleRemovePlayer: rosterData.handleRemovePlayer,
    importedRaidHelperPlayerIds: recentRaidHelperImportedIds,
    importedRaidHelperSpecConflictIds: recentRaidHelperSpecConflictIds,
    raidHelperImportSession,
    onUpdateRaidHelperImportEntry: handleUpdateRaidHelperImportEntry,
    onApplyRaidHelperImport: handleApplyRaidHelperImport,
    onCancelRaidHelperImport: handleCancelRaidHelperImport,
    specsByName,
    PlayerNameWithScore,
    hasUnsavedChanges: rosterDirty || raidLogsDirty || playerStatsDirty,
    onSaveChanges: rosterData.handleSaveRosterAttendanceChanges,
    isSaving: rosterData.isSavingRosterAttendance
  };

  // ==========================================
  // 7. RENDER SCREENS
  // ==========================================

  // LOADING SCREEN
  if (!isDbConnected || specsFromDb.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-amber-500 space-y-4">
        <svg className="w-12 h-12 animate-spin text-amber-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <h1 className="text-2xl font-serif italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Connecting to Cloud Database...</h1>
      </div>
    );
  }

  // MAIN DASHBOARD
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30">
      {/* Wowhead tooltip icon overrides moved to src/index.css */}
      <div className="max-w-10/12 mx-auto px-4 sm:px-6 lg:px-0 py-10 space-y-6">

<header className="flex flex-col md:flex-row md:items-stretch justify-between gap-4">
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 tracking-tight font-serif italic drop-shadow-sm">
              &lt;Guild Name TBC&gt;
            </h1>
            <p className="text-slate-400 mt-2 font-medium uppercase tracking-widest text-sm">
              Guild management dashboard
            </p>
          </div>

          <div className="flex items-stretch justify-end gap-4 flex-nowrap">
            <div className="w-80 flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-lg p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Unsaved Changes</span>
                <button
                  type="button"
                  onClick={handleSaveAllChanges}
                  disabled={!hasAnyUnsavedChanges}
                  className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${hasAnyUnsavedChanges ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                >
                  Save All
                </button>
              </div>
              <div className="mt-2">
                {unsavedSections.length === 0 ? (
                  <div className="text-[11px] text-slate-500">All tracked sections are saved.</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {unsavedSections.map(section => (
                      <span key={section} className="rounded-full border border-amber-600/40 bg-amber-900/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                        {section}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="w-64 flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-lg p-2">
              <div className="flex justify-center items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Phase:</span>
                <select
                  value={globalPhase}
                  onChange={e => setGlobalPhase(e.target.value)}
                  className="ml-3 bg-slate-950 text-amber-400 font-bold border border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  {PHASES.map(phase => <option key={phase} value={phase}>{phase}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={globalMyPlayerId}
                  onChange={e => {
                    const id = e.target.value;
                    setGlobalMyPlayerId(id);
                    localStorage.setItem('my-player-id', id || '');
                    if (id) {
                      const player = roster.find(p => p.id === parseInt(id));
                      if (player) {
                        const specName = getDisplayFromId(player.spec_id);
                        if (specName) setSelectedBisSpec(specName);
                      }
                    }
                  }}
                  className="flex-1 bg-slate-950 text-amber-400 font-bold border border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="">â€” Select Character â€”</option>
                  {sortedRosterForSelector.map(player => {
                    const isCurrentUserClaim = currentUserClaimedRosterIds.has(Number(player.id));
                    const isClaimedElsewhere = Boolean(player.user_id && !isCurrentUserClaim);
                    const icon = isCurrentUserClaim ? 'âœ“' : isClaimedElsewhere ? 'â—' : 'â—‹';
                    const specDisplay = getDisplayFromId(player.spec_id);
                    const styleColor = isCurrentUserClaim
                      ? '#34d399'
                      : isClaimedElsewhere
                        ? '#64748b'
                        : (specsByName[specDisplay]?.color || '#e2e8f0');
                    return (
                      <option key={player.id} value={player.id} style={{ color: styleColor }}>
                        {icon} {player.name}
                      </option>
                    );
                  })}
                </select>
                <button
                  type="button"
                  onClick={() => setShowBnetClaimModal(true)}
                  disabled={!bnetAuthState.authenticated || selectedGlobalPlayerIsClaimed}
                  className={`text-[10px] font-bold uppercase tracking-wider ${!bnetAuthState.authenticated || selectedGlobalPlayerIsClaimed ? 'text-slate-500 cursor-not-allowed' : 'text-cyan-400 hover:text-cyan-300'}`}
                >
                  Claim
                </button>
              </div>
            </div>

            <div className={`flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-lg w-64 p-2`}>
              <div className="flex justify-end items-center px-3 h-6">
                {bnetAuthState.authenticated ? (
                  <>
                    {bnetAuthState.user?.battletag && (
                      <span className="text-[11px] font-semibold text-cyan-300 whitespace-nowrap">Logged in as {bnetAuthState.user.battletag}</span>
                    )}
                    <button onClick={handleBattleNetLogout} className="ml-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 h-6 flex items-center">Logout</button>
                  </>
                ) : (
                  <button onClick={handleBattleNetLogin} className="bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-1 px-3 rounded text-[11px] uppercase tracking-wider h-6 flex items-center justify-center">Log in with Battle.net</button>
                )}
              </div>

              <div className="flex justify-end items-center px-3 h-6">
                {isAuthenticated ? (
                  <>
                    <span className="text-[11px] font-semibold text-amber-300">Logged in as Officer</span>
                    <button onClick={handleLogout} className="ml-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 h-6 flex items-center">Logout</button>
                  </>
                ) : (
                  <form onSubmit={handleLoginSubmit} className="flex items-center gap-2">
                    <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="bg-slate-950 text-white border border-slate-700 rounded px-2 py-1.5 text-[11px] leading-none focus:outline-none focus:ring-1 focus:ring-amber-500 tracking-widest h-6 w-36" placeholder="Officer Password" />
                    <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-1 px-3 rounded transition shadow-lg tracking-wider uppercase text-[11px] h-6 flex items-center justify-center">Unlock</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* --- NAVIGATION TABS --- */}
        <div className="relative z-30 flex w-full flex-wrap items-start gap-2 overflow-visible pt-0 pb-0 mb-0">
          {renderDropdownNavButton('bank', 'Guild Bank', 'bank', bankSubTabs, bankSubTab)}
          {renderDropdownNavButton('raidAssignments', 'Raid Assignments', 'raidAssignments', raidAssignmentsSubTabs, raidAssignmentsSubTab)}
          {renderDropdownNavButton('raidSignups', 'Raid Signups', 'raidSignups', raidSignupsSubTabs, raidSignupsSubTab)}
          {renderDropdownNavButton('resources', 'Resources', 'resources', resourcesSubTabs, resourcesSubTab)}
          {isAuthenticated && (
            <>
              {renderDropdownNavButton('loot', 'Loot Council', 'loot', lootSubTabs, lootSubTab, true)}
              {renderDropdownNavButton('admin', 'Admin', 'admin', adminSubTabs, adminSubTab, true)}
            </>
          )}
        </div>
        <div className="h-px bg-slate-800 w-screen -ml-[calc(50vw-50%)] -mt0" />

        {/* =========================================
              TAB: PRIORITY OVERVIEW (MASTER LEDGER - PUBLIC)
              ========================================= */}
        {activeTab === 'loot' && lootSubTab === 'overview' && (
          <OverviewTab
            filteredOverviewItems={filteredOverviewItems}
            overviewSearch={overviewSearch}
            setOverviewSearch={setOverviewSearch}
            roster={roster}
            assignments={assignments}
            calculateScore={calculateScore}
            getRankBadgeStyle={getRankBadgeStyle}
            renderItemLink={renderItemLink}
            hideWowheadTooltip={hideWowheadTooltip}
            isAuthenticated={isAuthenticated}
            setActiveTab={setActiveTab}
            setSearchQuery={setSearchQuery}
            setSelectedItemName={setSelectedItemName}
            onOpenItemAssignment={handleOpenItemForLootAssignment}
            specsByName={specsByName}
            getDisplayFromId={getDisplayFromId}
            myPlayerName={selectedMyPlayerName}
            onClearItemPriorities={handleClearOverviewItemPriorities}
            hasLootUnsavedChanges={hasLootUnsavedChanges}
            onSaveAssignments={handleSaveLootCouncilChanges}
            onEditItemId={jumpToMasterItemsDbForItem}
          />
        )}

        {
  /* =========================================
      TAB: GUILD BANK (PUBLIC)
      ========================================= */}
        {activeTab === 'bank' && (
          <BankContainer
            fetchData={fetchData}
            putData={putData}
            isAuthenticated={isAuthenticated}
            roster={roster}
            specsByName={specsByName}
            getDisplayFromId={getDisplayFromId}
            bankSubTab={bankSubTab}
            activeTab={activeTab}
            globalMyPlayerId={globalMyPlayerId}
          />
        )}

        {/* =========================================
      TAB: RAID ASSIGNMENTS (PUBLIC, EDIT GATED)
      ========================================= */}
        {activeTab === 'raidAssignments' && (
          <div className="space-y-4">
            {raidAssignmentsSubTab === 'overview' && (
              <RaidAssignmentsContainer
                {...{
                  isAuthenticated,
                  roster,
                  getSpecById,
                  enabledBosses,
                  raidZones,
                  handleToggleZone,
                  handleToggleBoss,
                  customRaidGroups,
                  handleAddCustomRaidBoss,
                  handleRemoveCustomRaidBoss,
                  raidAssignmentData,
                  setRaidAssignmentData,
                  hasUnsavedChanges: raidAssignmentDataDirty || enabledBossesDirty,
                  onSaveChanges: handleSaveRaidAssignmentsChanges,
                  isSaving: isSavingRaidAssignments,
                  myPlayerName: selectedMyPlayerName,
                  actorBattleTag: bnetAuthState.user?.battletag || '',
                  onCopyToArchive: handleCopyRaidAssignmentsToArchive
                }}
              />
            )}
            {raidAssignmentsSubTab === 'history' && (
              <RaidAssignmentsHistory
                archives={raidAssignmentArchives}
                onViewArchive={handleViewRaidAssignmentArchive}
                onRestoreArchive={handleRestoreRaidAssignmentArchive}
                selectedArchiveId={selectedRaidAssignmentArchiveId}
                selectedRestoreBosses={selectedRaidRestoreBosses}
                setSelectedRestoreBosses={(value) => {
                  if (typeof value === 'function') {
                    const nextValue = value(selectedRaidRestoreBosses);
                    if (Array.isArray(nextValue)) {
                      return nextValue;
                    }
                  }
                  return value;
                }}
                onToggleRestoreBoss={handleToggleRaidRestoreBoss}
              />
            )}
          </div>
        )}

        {activeTab === 'raidSignups' && (
          <RaidSignupsContainer {...{
            fetchData,
            putData,
            postData,
            deleteData,
            isAuthenticated,
            specsFromDb,
            activeSection: raidSignupsSubTab,
            onSectionChange: setRaidSignupsSubTab
          }} />
        )}

        {/* =========================================
      TAB: BANK REQUESTS (AUTH-GATED)
      ========================================= */}
        {activeTab === 'bankRequests' && (
          <BankContainer
            fetchData={fetchData}
            putData={putData}
            isAuthenticated={isAuthenticated}
            roster={roster}
            specsByName={specsByName}
            getDisplayFromId={getDisplayFromId}
            bankSubTab={bankSubTab}
            activeTab={activeTab}
            globalMyPlayerId={globalMyPlayerId}
          />
        )}

        {/* =========================================
              TAB: LOOT COUNCIL ASSIGNMENT
              ========================================= */}
        {activeTab === 'loot' && isAuthenticated && (
          <div className="space-y-4">
            {lootSubTab === 'assignment' && (
              <LootCouncilContainer
                {...{
                  searchQuery,
                  setSearchQuery,
                  filterZone,
                  setFilterZone,
                  uniqueZones,
                  filterBoss,
                  setFilterBoss,
                  uniqueBosses,
                  filterSlot,
                  setFilterSlot,
                  filterCategory,
                  setFilterCategory,
                  uniqueSlots,
                  selectedItemName,
                  setSelectedItemName,
                  filteredItems,
                  selectedItem,
                  sortedEligiblePlayers,
                  getDisplayFromId,
                  getSlugFromDisplay,
                  bisPriorities,
                  globalPhase,
                  assignments,
                  mutableItems,
                  getPlayerItemPriorityStatus,
                  getSpecById,
                  getRankBadgeStyle,
                  renderItemLink,
                  handleSetPriority,
                  PlayerNameWithScore,
                  hasUnsavedChanges: assignmentsDirty,
                  onSaveChanges: handleSaveLootCouncilChanges,
                  onClearItemAssignments: handleClearOverviewItemPriorities,
                  onToggleAwardedPriority: handleToggleAwardedPriority,
                  isSaving: isSavingLootCouncil
                }}
              />
            )}
            {lootSubTab === 'scoring' && (
              <ScoringContainer {...scoringTabProps} />
            )}
            {lootSubTab === 'roster' && (
              <RosterContainer {...rosterTabProps} />
            )}
            {lootSubTab === 'assigned' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-100">Assigned Loot Overview</h3>
                <p className="text-sm text-slate-400">The current loot council priorities are grouped here for a quick review.</p>
                <AssignedLootOverview
                  assignments={assignments}
                  mutableItems={mutableItems}
                  normalizeAwardedPlayerIds={normalizeAwardedPlayerIds}
                  renderItemLink={renderItemLink}
                  roster={roster}
                />
              </div>
            )}
          </div>
        )}

        {/* =========================================
              TAB: ROSTER & ATTENDANCE
              ========================================= */}
        {activeTab === 'roster' && isAuthenticated && (
          <RosterContainer {...rosterTabProps} />
        )}


{(activeTab === 'officerRoles' || activeTab === 'discordBotConfig') && isAuthenticated && (
      <AdminContainer
        activeTab={activeTab}
        adminSubTab={adminSubTab}
        roster={roster}
        getSpecById={getSpecById}
        specsByName={specsByName}
        getDisplayFromId={getDisplayFromId}
        selectedMyPlayerName={selectedMyPlayerName}
        rosterClaims={rosterClaims}
        handleUnclaimClaim={handleUnclaimClaim}
        adminData={adminData}
        setScoringConfig={setScoringConfig}
        scoringConfig={scoringConfig}
        scoringConfigDirty={scoringConfigDirty}
      />
        )}

        {/* =========================================
              TAB: SCORING & CONFIG
              ========================================= */}
        {activeTab === 'scoring' && isAuthenticated && (
          <ScoringContainer {...scoringTabProps} />
        )}

        {/* =========================================
              TAB: BiS & ALTERNATIVES (CHARACTER SHEET)
              ========================================= */}
        {activeTab === 'bis' && (
          <ResourcesTab
            resourcesSubTab={resourcesSubTab}
            selectedBisSpec={selectedBisSpec}
            setSelectedBisSpec={setSelectedBisSpec}
            masterItemsDbPhase={masterItemsDbPhase}
            setMasterItemsDbPhase={setMasterItemsDbPhase}
            specsFromDb={specsFromDb}
            renderItemSlot={renderItemSlot}
            specsByName={specsByName}
          />
        )}

        {/* =========================================
              TAB: MASTER ITEMS DATABASE EDITING TABLE
              ========================================= */}
        {activeTab === 'itemsdb' && isAuthenticated && (
          <ItemsDatabaseContainer {...itemsDbTabProps} />
        )}

        <BnetClaimModal
          open={showBnetClaimModal}
          onClose={() => setShowBnetClaimModal(false)}
          isAuthenticated={bnetAuthState.authenticated}
          showBnetCharacterLookup={bnetAuthState.showBnetCharacterLookup}
          isLoading={bnetAuthState.loading || bnetClaimBusy}
          error={bnetAuthState.error}
          characters={bnetAuthState.characters}
          diagnostics={bnetAuthState.diagnostics}
          roster={roster}
          onClaim={handleBattleNetClaim}
          onManualClaim={handleBattleNetManualClaim}
          onLogin={handleBattleNetLogin}
          onLogout={handleBattleNetLogout}
          claimedRosterNames={new Set((roster || []).filter(player => player.user_id).map(player => String(player.name || '').trim().toLowerCase()))}
        />

        <ItemIdEditorModal
          open={Boolean(itemIdEditor)}
          item={itemIdEditor}
          onClose={() => setItemIdEditor(null)}
          onSave={handleSaveItemIdFromModal}
        />

      </div>
    </div>
  );
}
