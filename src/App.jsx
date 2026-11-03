import { useState, useMemo, useEffect, useRef } from 'react';
import { PHASES, PHASE_JSON_KEYS, LEFT_SLOTS, BOTTOM_SLOTS, DEFAULT_GLOBAL_PHASE, CORE_SYNC_INTERVAL_MS, STORAGE_KEYS } from './constants';
import { fetchData, putData, postData, deleteData } from './services/apiService';
import { useItemsDatabase } from './hooks/useItemsDatabase';
import useSpecData from './hooks/useSpecData';
import useAppShellState from './hooks/useAppShellState';
import useAppShellLifecycle from './hooks/useAppShellLifecycle';
import OverviewTab from './components/OverviewTab';
import AdminContainer from './containers/AdminContainer';
import useAdminData from './hooks/useAdminData';
import useLootCouncilData from './hooks/useLootCouncilData';
import useRaidAssignmentsData from './hooks/useRaidAssignmentsData';
import useRosterData from './hooks/useRosterData';
import ResourcesTab from './features/resources/ResourcesTab';
import DashboardHeader from './components/DashboardHeader';
import DashboardNavigationTabs from './components/DashboardNavigationTabs';
import DashboardMainContent from './components/DashboardMainContent';
import DashboardPageLayout from './components/DashboardPageLayout';
import DashboardModals from './components/DashboardModals';
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
import * as helpers from './utils/helpers';
import { calculatePlayerScore, getRankBadgeStyle as getAppShellRankBadgeStyle } from './utils/appShellHelpers';
import useRaidHelperImport from './hooks/useRaidHelperImport';
import useAuthSession from './hooks/useAuthSession';
import useCharacterProfiles from './hooks/useCharacterProfiles';
import useDashboardNavigation from './hooks/useDashboardNavigation';
import useDashboardMainContentViewModel from './hooks/useDashboardMainContentViewModel';
import useDashboardHelpers from './hooks/useDashboardHelpers.jsx';
import useDataSync from './hooks/useDataSync';

export default function App() {
  const previousActiveTabRef = useRef('');
  // ==========================================
  // SPECS DATA FROM DATABASE
  // ==========================================
  const {
    specsFromDb,
    specsByName,
    specsSortedByClass,
    getSlugFromDisplay,
    getDisplayFromId,
    getSpecById,
  } = useSpecData({
    onSpecSelection: ({ specId, specName }) => {
      setNewSpec(prev => prev ?? specId);
      setSelectedBisSpec(prev => prev ?? specName);
    }
  });

  // ==========================================
  // 1. ALL LOCAL UI AND FILTER STATES
  // ==========================================
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [globalMyPlayerId, setGlobalMyPlayerId] = useState(() => localStorage.getItem(STORAGE_KEYS.myPlayerId) || '');

  // Global phase selector (controls which phase's assignments are shown)
  const [globalPhase, setGlobalPhase] = useState(DEFAULT_GLOBAL_PHASE);

  const [overviewSearch, setOverviewSearch] = useState('');
  const [sharedRaidFilter, setSharedRaidFilter] = useState('All Raids');
  const [sharedPhaseFilter, setSharedPhaseFilter] = useState(DEFAULT_GLOBAL_PHASE);

  const [isDbConnected, setIsDbConnected] = useState(false);
  const [newSpec, setNewSpec] = useState(null); // spec_id from database
  const [selectedBisSpec, setSelectedBisSpec] = useState(null); // Will be set to first spec from DB
  const [selectedLootItemName, setSelectedLootItemName] = useState('');
  const [expandedPlayerId, setExpandedPlayerId] = useState(null);
  const [itemIdEditor, setItemIdEditor] = useState(null);

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

  const {
    profiles,
    profilesLoading,
    profilesError,
    createProfile,
    updateProfile,
    deleteProfile
  } = useCharacterProfiles({
    fetchData,
    postData,
    putData,
    deleteData,
    isAuthenticated: bnetAuthState.authenticated
  });

  const hasOfficerAccess = isAuthenticated || bnetAuthState.isOfficer || bnetAuthState.isAdmin;

  const {
    activeTab,
    setActiveTab,
    hoveredNavTab,
    setHoveredNavTab,
    bankSubTab,
    setBankSubTab,
    raidAssignmentsSubTab,
    setRaidAssignmentsSubTab,
    raidSignupsSubTab,
    setRaidSignupsSubTab,
    lootSubTab,
    setLootSubTab,
    recruitmentSubTab,
    adminSubTab,
    setAdminSubTab,
    resourcesSubTab,
    setResourcesSubTab,
    profilesSubTab,
    handleMainNavSelect,
    getDropdownItemActiveState,
    subTabs,
  } = useDashboardNavigation({ isAuthenticated: hasOfficerAccess });

  useEffect(() => {
    const previousTab = previousActiveTabRef.current;
    if (activeTab === 'raidAssignments' && previousTab && previousTab !== 'raidAssignments') {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      });
    }
    previousActiveTabRef.current = activeTab;
  }, [activeTab]);


  // bankArchivedRequestIds and bankContentsHistory are persisted inside useBankData

  // ==========================================
  // 2. CLOUD SYNCHRONIZATION STATES
  // ==========================================
  const setRoster = (newVal) => {
    setRosterLocal(newVal);
    setRosterDirty(true);
  };
  const setScoringConfig = (newVal) => { setScoringConfigLocal(newVal); setScoringConfigDirty(true); };
  const setPlayerStats = (newVal) => { setPlayerStatsLocal(newVal); setPlayerStatsDirty(true); };
  const setRaidLogs = (newVal) => { setRaidLogsLocal(newVal); setRaidLogsDirty(true); };

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

  const {
    mutableItems,
    setMutableItemsLocal,
    setMutableItemsBaseline,
    bisPriorities,
    setBisPrioritiesLocal,
    dbBisPriorities,
    setDbBisPrioritiesLocal,
    dbBisPrioritiesBaseline,
    setDbBisPrioritiesBaseline,
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
    globalPhase,
    setSelectedItemName: setSelectedLootItemName,
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
    selectedItemName: selectedLootItemName,
    setSelectedItemName: setSelectedLootItemName,
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
    handleDeleteRaidAssignmentArchive,
    handleToggleRaidRestoreBoss,
    handleRestoreRaidAssignmentArchive,
    handleToggleZone,
    handleToggleBoss,
    handleMoveEnabledBoss,
    handleReorderEnabledBoss,
    handleAddCustomRaidBoss,
    handleAddTrashBefore,
    handleSetBossVisibility,
    handleRenameCustomRaidBoss,
    handleRemoveCustomRaidBoss,
    customRaidGroups,
    raidZones,
  } = useRaidAssignmentsData({
    fetchData,
    putData,
    activeTab,
    adminSubTab,
    setActiveTab,
    setRaidAssignmentsSubTab,
    isAuthenticated: hasOfficerAccess,
  });

  const adminData = useAdminData({
    fetchData,
    putData,
    deleteData,
    activeTab,
    adminSubTab,
    isAuthenticated: hasOfficerAccess,
    scoringConfigDirty,
    setScoringConfigDirty,
    scoringConfig,
    setScoringConfig,
    refreshRosterClaims
  });

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

  const dashboardHelpers = useDashboardHelpers({
    fetchData,
    putData,
    roster,
    playerStats,
    scoringConfig,
    raidLogs,
    setRoster,
    setRaidLogs,
    setSelectedItemName: setSelectedLootItemName,
    setActiveTab,
    setLootSubTab,
    setSearchQuery,
    setIsSavingScoring,
    setScoringConfigDirty,
    setPlayerStatsDirty,
    setNewRaidDate: rosterData.setNewRaidDate,
    setNewRaidZone: rosterData.setNewRaidZone,
    scoringConfigDirty,
    playerStatsDirty,
    mutableItems,
    dbBisPriorities,
    selectedBisSpec,
    setItemIdEditor,
    handleUpdateItemId: (itemId, value) => {
      const item = mutableItems.find(entry => entry.id === itemId);
      if (item) {
        const nextItems = mutableItems.map(entry => entry.id === itemId ? { ...entry, itemId: value } : entry);
        setMutableItemsLocal(nextItems);
      }
    },
    renderItemLink,
    hideWowheadTooltip,
    getDisplayFromId,
    getSpecById,
  });

  const {
    initializeDefaultBisPriorities,
    handleApplyRaidSignupGroupsToAttendance,
    handleOpenItemForLootAssignment,
    handleSaveScoringChanges,
    renderItemSlot,
    jumpToMasterItemsDbForItem,
    handleSaveItemIdFromModal,
  } = dashboardHelpers;

  const hasItemsDbUnsavedChanges = dbBisPrioritiesDirty || mutableItemsDirty;
  const hasRosterUnsavedChanges = rosterDirty || raidLogsDirty || playerStatsDirty;
  const hasScoringUnsavedChanges = scoringConfigDirty || playerStatsDirty;
  const hasRaidAssignmentsUnsavedChanges = raidAssignmentDataDirty || enabledBossesDirty;

  const shellState = useAppShellState({
    hasLootUnsavedChanges,
    hasItemsDbUnsavedChanges,
    hasRosterUnsavedChanges,
    hasScoringUnsavedChanges,
    hasRaidAssignmentsUnsavedChanges,
    raidAssignmentDataDirty,
    enabledBossesDirty,
    adminData,
    handleSaveLootCouncilChanges,
    handleSaveRaidAssignmentsChanges,
    handleSaveRosterAttendanceChanges: rosterData.handleSaveRosterAttendanceChanges,
    handleSaveScoringChanges,
    handleSaveItemsDbChanges,
    handleSaveAdminChanges: adminData.handleSaveAdminChanges,
  });

  const { hasAnyUnsavedChanges, unsavedSections, handleSaveAllChanges } = shellState;

  useAppShellLifecycle({ activeTab, hasAnyUnsavedChanges });

  // ==========================================
  // 3. SQL SYNC ENGINE
  // ==========================================
  useDataSync({
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
    mutableItemsDirty,
    setMutableItemsLocal,
    setMutableItemsBaseline,
    setIsDbConnected,
    activeTab,
    masterItemsDbPhase,
    setDbBisPrioritiesLocal,
    setDbBisPrioritiesBaseline,
  });

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
    let cancelled = false;
    const refreshWowheadLinks = () => {
      if (cancelled) return;
      if (window.$WowheadPower && window.$WowheadPower.refreshLinks) {
        window.$WowheadPower.refreshLinks();
      }
    };

    // Refresh immediately, then again after render/layout settles.
    refreshWowheadLinks();
    const raf = requestAnimationFrame(() => requestAnimationFrame(refreshWowheadLinks));
    const timer = setTimeout(refreshWowheadLinks, 120);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [activeTab, roster, assignments, mutableItems, selectedItemName, searchQuery, filterBoss, filterZone, filterSlot, dbSearch, overviewSearch, selectedBisSpec]);


  // Auth/session handlers are provided by `useAuthSession` hook.
  const handleLoginSubmit = async (e, password) => {
    if (e) e.preventDefault();
    try {
      const ok = await handleLogin(password || '');
      if (ok) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Officer login submit failed:', error);
      return false;
    }
  };

  const calculateScore = (playerId) => {
    return calculatePlayerScore({
      playerId,
      playerStats,
      scoringConfig,
      attendanceScore: rosterData.calculateAttendance(playerId)
    });
  };

  const getRankBadgeStyle = (rank) => getAppShellRankBadgeStyle(rank);


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

  const mainContentViewModel = useDashboardMainContentViewModel({
    activeTab,
    bankSubTab,
    sharedRaidFilter,
    setSharedRaidFilter,
    sharedPhaseFilter,
    setSharedPhaseFilter,
    raidAssignmentsSubTab,
    raidSignupsSubTab,
    setRaidSignupsSubTab,
    lootSubTab,
    recruitmentSubTab,
    adminSubTab,
    resourcesSubTab,
    profilesSubTab,
    isAuthenticated: hasOfficerAccess,
    globalMyPlayerId,
    selectedBisSpec,
    setSelectedBisSpec,
    selectedMyPlayerName,
    bnetAuthState,
    handleBattleNetLogin,
    profiles,
    profilesLoading,
    profilesError,
    createProfile,
    updateProfile,
    deleteProfile,
    hasLootUnsavedChanges,
    hasRaidAssignmentsUnsavedChanges,
    handleSaveLootCouncilChanges,
    handleOpenItemForLootAssignment,
    handleClearOverviewItemPriorities,
    handleToggleAwardedPriority,
    handleSaveRaidAssignmentsChanges,
    isSavingRaidAssignments,
    handleCopyRaidAssignmentsToArchive,
    handleViewRaidAssignmentArchive,
    handleDeleteRaidAssignmentArchive,
    handleRestoreRaidAssignmentArchive,
    handleToggleRaidRestoreBoss,
    handleToggleZone,
    handleToggleBoss,
    handleMoveEnabledBoss,
    handleReorderEnabledBoss,
    handleAddCustomRaidBoss,
    handleAddTrashBefore,
    handleSetBossVisibility,
    handleRenameCustomRaidBoss,
    handleRemoveCustomRaidBoss,
    fetchData,
    putData,
    postData,
    deleteData,
    roster,
    specsFromDb,
    specsByName,
    getDisplayFromId,
    getSpecById,
    getSlugFromDisplay,
    getRankBadgeStyle,
    renderItemLink,
    hideWowheadTooltip,
    calculateScore,
    overviewSearch,
    setOverviewSearch,
    filteredOverviewItems,
    assignments,
    selectedItemName,
    setSelectedItemName,
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
    uniqueSlots,
    filterCategory,
    setFilterCategory,
    filteredItems,
    selectedItem,
    sortedEligiblePlayers,
    getPlayerItemPriorityStatus,
    handleSetPriority,
    PlayerNameWithScore,
    assignmentsDirty,
    isSavingLootCouncil,
    mutableItems,
    bisPriorities,
    globalPhase,
    raidAssignmentArchives,
    selectedRaidAssignmentArchiveId,
    selectedRaidRestoreBosses,
    setSelectedRaidRestoreBosses: (value) => {
      if (typeof value === 'function') {
        const nextValue = value(selectedRaidRestoreBosses);
        if (Array.isArray(nextValue)) {
          return nextValue;
        }
      }
      return value;
    },
    raidAssignmentData,
    setRaidAssignmentData,
    enabledBosses,
    raidAssignmentDataDirty,
    enabledBossesDirty,
    raidZones,
    customRaidGroups,
    recentRaidHelperImportedIds,
    recentRaidHelperSpecConflictIds,
    raidHelperImportSession,
    handleUpdateRaidHelperImportEntry,
    handleApplyRaidHelperImport,
    handleCancelRaidHelperImport,
    handleSaveScoringChanges,
    scoringConfig,
    setScoringConfig,
    playerStats,
    expandedPlayerId,
    setExpandedPlayerId,
    calculateAttendance: rosterData.calculateAttendance,
    updatePlayerStat: rosterData.updatePlayerStat,
    updatePlayerParse: rosterData.updatePlayerParse,
    updatePlayerManualAdjustment: rosterData.updatePlayerManualAdjustment,
    scoringConfigDirty,
    playerStatsDirty,
    isSavingScoring,
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
    masterItemsDbPhase,
    setMasterItemsDbPhase,
    dbBisPrioritiesDirty,
    mutableItemsDirty,
    isSavingItemsDb,
    handleSaveItemsDbChanges,
    onSaveRosterAttendanceChanges: rosterData.handleSaveRosterAttendanceChanges,
    isSavingRosterAttendance: rosterData.isSavingRosterAttendance,
    setNewRaidDate: rosterData.setNewRaidDate,
    setNewRaidZone: rosterData.setNewRaidZone,
    newRaidDate: rosterData.newRaidDate,
    newRaidZone: rosterData.newRaidZone,
    handleSaveRaidLog: rosterData.handleSaveRaidLog,
    raidLogs,
    handleApplyRaidSignupGroupsToAttendance,
    handleDeleteRaidLog: rosterData.handleDeleteRaidLog,
    handleAddPlayer: rosterData.handleAddPlayer,
    newName: rosterData.newName,
    setNewName: rosterData.setNewName,
    newSpec: rosterData.newSpec,
    setNewSpec: rosterData.setNewSpec,
    setAllRaidStatus: rosterData.setAllRaidStatus,
    toggleRaidStatus: rosterData.toggleRaidStatus,
    handleUpdatePlayer: rosterData.handleUpdatePlayer,
    handleRemovePlayer: rosterData.handleRemovePlayer,
    rosterDirty,
    raidLogsDirty,
    playerStatsDirty,
    rosterClaims,
    handleUnclaimClaim,
    adminData,
    renderItemSlot,
  });

  // ==========================================
  // 7. RENDER SCREENS
  // ==========================================

  return (
    <DashboardPageLayout
      isDbConnected={isDbConnected}
      specsFromDb={specsFromDb}
      header={(
        <DashboardHeader
          hasAnyUnsavedChanges={hasAnyUnsavedChanges}
          unsavedSections={unsavedSections}
          handleSaveAllChanges={handleSaveAllChanges}
          globalPhase={globalPhase}
          setGlobalPhase={setGlobalPhase}
          globalMyPlayerId={globalMyPlayerId}
          onCharacterSelect={(id) => {
            setGlobalMyPlayerId(id);
            localStorage.setItem(STORAGE_KEYS.myPlayerId, id || '');
            if (id) {
              const player = roster.find(p => p.id === parseInt(id));
              if (player) {
                const specName = getDisplayFromId(player.spec_id);
                if (specName) setSelectedBisSpec(specName);
              }
            }
          }}
          sortedRosterForSelector={sortedRosterForSelector}
          currentUserClaimedRosterIds={currentUserClaimedRosterIds}
          selectedGlobalPlayerIsClaimed={selectedGlobalPlayerIsClaimed}
          setShowBnetClaimModal={setShowBnetClaimModal}
          setShowLoginModal={setShowLoginModal}
          bnetAuthState={bnetAuthState}
          isAuthenticated={isAuthenticated}
          roster={roster}
          getDisplayFromId={getDisplayFromId}
          specsByName={specsByName}
        />
      )}
      navigation={(
        <DashboardNavigationTabs
          activeTab={activeTab}
          hoveredNavTab={hoveredNavTab}
          setHoveredNavTab={setHoveredNavTab}
          handleMainNavSelect={handleMainNavSelect}
          getDropdownItemActiveState={getDropdownItemActiveState}
          isAuthenticated={hasOfficerAccess}
          subTabs={subTabs}
        />
      )}
      mainContent={(
        <DashboardMainContent
          viewModel={mainContentViewModel}
        />
      )}
      modalContent={(
        <DashboardModals
          showBnetClaimModal={showBnetClaimModal}
          setShowBnetClaimModal={setShowBnetClaimModal}
          showLoginModal={showLoginModal}
          setShowLoginModal={setShowLoginModal}
          bnetAuthState={bnetAuthState}
          bnetClaimBusy={bnetClaimBusy}
          handleBattleNetClaim={handleBattleNetClaim}
          handleBattleNetManualClaim={handleBattleNetManualClaim}
          handleBattleNetLogin={handleBattleNetLogin}
          handleBattleNetLogout={handleBattleNetLogout}
          handleAdminLogin={handleLoginSubmit}
          handleAdminLogout={handleLogout}
          isAdminAuthenticated={isAuthenticated}
          roster={roster}
          itemIdEditor={itemIdEditor}
          setItemIdEditor={setItemIdEditor}
          handleSaveItemIdFromModal={handleSaveItemIdFromModal}
        />
      )}
    />
  );
}
