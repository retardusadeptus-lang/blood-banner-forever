import { useState, useMemo, useEffect } from 'react';
import { PHASES, PHASE_JSON_KEYS, LEFT_SLOTS, RIGHT_SLOTS, BOTTOM_SLOTS, P2_BOSSES, CATEGORY_MAP, RAID_ZONES } from './constants';
import { fetchData, putData, postData, deleteData, login, getBattleNetAuthMe, startBattleNetLogin, logoutBattleNet, claimRosterCharacter, claimRosterCharacterManual, getRosterClaimsAdmin, unclaimRosterCharacterAdmin } from './services/apiService';
import { useItemsDatabase } from './hooks/useItemsDatabase';
import OverviewTab from './components/OverviewTab';
import BnetClaimModal from './components/BnetClaimModal';
import GuildBankTab from './components/GuildBankTab';
import BisConfigTab from './components/BisConfigTab';
import ItemsDatabaseTab from './components/ItemsDatabaseTab';
import BankRequestsTab from './components/BankRequestsTab';
import LootCouncilTab from './components/LootCouncilTab';
import RosterTab from './components/RosterTab';
import ScoringTab from './components/ScoringTab';
import RaidAssignmentsTab from './components/RaidAssignmentsTab';
import OfficerRolesTab from './components/OfficerRolesTab';
import DiscordBotConfigTab from './components/DiscordBotConfigTab';
import RaidSignupsTab from './components/RaidSignupsTab';

const CORE_SYNC_INTERVAL_MS = 15000;
const BANK_SYNC_INTERVAL_MS = 20000;
const RAID_ASSIGNMENTS_SYNC_INTERVAL_MS = 15000;
const RAIDHELPER_ALIAS_MAP_KEY = 'raidhelper-name-map-v1';

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
        if (specs.length > 0 && newSpec === null) {
          setNewSpec(specs[0].id);
        }
        if (specs.length > 0 && selectedBisSpec === null) {
          setSelectedBisSpec(specs[0].spec);
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
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('ar-auth') === 'true');
  const [passwordInput, setPasswordInput] = useState('');
  const [globalMyPlayerId, setGlobalMyPlayerId] = useState(() => localStorage.getItem('my-player-id') || '');
  const [showBnetClaimModal, setShowBnetClaimModal] = useState(false);
  const [bnetAuthState, setBnetAuthState] = useState({ loading: true, authenticated: false, user: null, claimedCharacters: [], error: '', characters: [], diagnostics: [], showBnetCharacterLookup: false });
  const [wowheadNameCache, setWowheadNameCache] = useState({});
  const [bnetClaimBusy, setBnetClaimBusy] = useState(false);
  const [rosterClaims, setRosterClaims] = useState([]);

  // Global phase selector (controls which phase's assignments are shown)
  const [globalPhase, setGlobalPhase] = useState('T5');

  // Default to public overview tab
  const AUTH_ONLY_TABS = ['bankRequests', 'loot', 'roster', 'scoring', 'itemsdb', 'officerRoles', 'discordBotConfig'];
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('active-tab') || 'loot');
  const [overviewSearch, setOverviewSearch] = useState('');
  const [hoveredNavTab, setHoveredNavTab] = useState(null);
  const [bankSubTab, setBankSubTab] = useState('contents');
  const [raidAssignmentsSubTab, setRaidAssignmentsSubTab] = useState('overview');
  const [raidSignupsSubTab, setRaidSignupsSubTab] = useState('templates');
  const [lootSubTab, setLootSubTab] = useState('overview');
  const [adminSubTab, setAdminSubTab] = useState('officerRoles');
  const [resourcesSubTab, setResourcesSubTab] = useState('bis');
  const [bankArchivedRequestIds, setBankArchivedRequestIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bank-archived-request-ids') || '[]');
    } catch {
      return [];
    }
  });
  const [selectedArchivedRequestIds, setSelectedArchivedRequestIds] = useState([]);
  const [adminTodoItems, setAdminTodoItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('admin-todo-items') || '[]');
    } catch {
      return [];
    }
  });
  const [todoDraftItems, setTodoDraftItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('admin-todo-items') || '[]');
    } catch {
      return [];
    }
  });
  const [todoFilterMine, setTodoFilterMine] = useState(false);
  const [todoDirty, setTodoDirty] = useState(false);
  const [bankUpdateJsonText, setBankUpdateJsonText] = useState('');
  const [bankUploadMeta, setBankUploadMeta] = useState({ gold: null });
  const [raidAssignmentArchives, setRaidAssignmentArchives] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('raid-assignment-archives') || '[]');
    } catch {
      return [];
    }
  });
  const [bankContentsHistory, setBankContentsHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bank-contents-history') || '[]');
    } catch {
      return [];
    }
  });
  const [selectedRaidAssignmentArchiveId, setSelectedRaidAssignmentArchiveId] = useState(null);
  const [selectedRaidRestoreBosses, setSelectedRaidRestoreBosses] = useState([]);

  const [isDbConnected, setIsDbConnected] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSpec, setNewSpec] = useState(null); // spec_id from database
  const [selectedItemName, setSelectedItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBoss, setFilterBoss] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterSlot, setFilterSlot] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedBisSpec, setSelectedBisSpec] = useState(null); // Will be set to first spec from DB
  const [expandedPlayerId, setExpandedPlayerId] = useState(null);
  const [newRaidDate, setNewRaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [newRaidZone, setNewRaidZone] = useState('SSC / TK');
  const [recentRaidHelperImportedIds, setRecentRaidHelperImportedIds] = useState([]);
  const [recentRaidHelperSpecConflictIds, setRecentRaidHelperSpecConflictIds] = useState([]);
  const [raidHelperImportSession, setRaidHelperImportSession] = useState(null);
  const [itemIdEditor, setItemIdEditor] = useState(null);

  const {
    mutableItems,
    setMutableItemsLocal,
    mutableItemsBaseline,
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
    showMissingWowheadFilter,
    setShowMissingWowheadFilter,
    showWowheadNameMismatchFilter,
    setShowWowheadNameMismatchFilter,
    dbBisPrioritiesDirty,
    setDbBisPrioritiesDirty,
    mutableItemsDirty,
    setMutableItemsDirty,
    isSavingItemsDb,
    handleAddItemToDb,
    handleUpdateItemEligibility,
    handleUpdateItemId,
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

  // Bank state
  const [bankItems, setBankItems] = useState([]);
  const [bankRequests, setBankRequests] = useState([]);
  const [bankSearch, setBankSearch] = useState('');
  const [denyReason, setDenyReason] = useState('');
  const [approvePrice, setApprovePrice] = useState('');
  const [respondingRequestId, setRespondingRequestId] = useState(null);
  const [bankUploadParsed, setBankUploadParsed] = useState(null);
  const [bankUploadStatus, setBankUploadStatus] = useState('');
  const [denyCustomReason, setDenyCustomReason] = useState('');
  const [approveQuantity, setApproveQuantity] = useState('');
  const [approveNote, setApproveNote] = useState('');
  const [officerRoles, setOfficerRoles] = useState([]);
  const [discordBotConfig, setDiscordBotConfigLocal] = useState({
    request_roles: [],
    signup_roles: [],
    bench_roles: []
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

  const renderDropdownNavButton = (keyName, label, mainTab, subTabs, activeSubTab, isAuthOnly = false) => {
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
    { value: 'assigned', label: 'Assigned Loot', authOnly: true }
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

  useEffect(() => {
    localStorage.setItem('bank-archived-request-ids', JSON.stringify(bankArchivedRequestIds));
  }, [bankArchivedRequestIds]);

  useEffect(() => {
    localStorage.setItem('admin-todo-items', JSON.stringify(adminTodoItems));
  }, [adminTodoItems]);

  useEffect(() => {
    localStorage.setItem('raid-assignment-archives', JSON.stringify(raidAssignmentArchives));
  }, [raidAssignmentArchives]);

  useEffect(() => {
    localStorage.setItem('bank-contents-history', JSON.stringify(bankContentsHistory));
  }, [bankContentsHistory]);

  // If a saved tab requires auth and the session is locked, fall back safely.
  useEffect(() => {
    if (!isAuthenticated && AUTH_ONLY_TABS.includes(activeTab)) {
      setActiveTab('loot');
      setLootSubTab('overview');
    }
  }, [isAuthenticated, activeTab]);

  // ==========================================
  // 2. CLOUD SYNCHRONIZATION STATES
  // ==========================================
  const [roster, setRosterLocal] = useState([]);
  const [assignments, setAssignmentsLocal] = useState({});
  const [scoringConfig, setScoringConfigLocal] = useState({});
  const [playerStats, setPlayerStatsLocal] = useState({});
  const [raidLogs, setRaidLogsLocal] = useState([]);
  const [tokenRedemptionsByItemId, setTokenRedemptionsByItemId] = useState({});
  const [raidAssignmentData, setRaidAssignmentDataLocal] = useState({});
  const [enabledBosses, setEnabledBossesLocal] = useState([]);

  const [assignmentsDirty, setAssignmentsDirty] = useState(false);
  const [rosterDirty, setRosterDirty] = useState(false);
  const [scoringConfigDirty, setScoringConfigDirty] = useState(false);
  const [playerStatsDirty, setPlayerStatsDirty] = useState(false);
  const [raidLogsDirty, setRaidLogsDirty] = useState(false);
  const [raidAssignmentDataDirty, setRaidAssignmentDataDirty] = useState(false);
  const [enabledBossesDirty, setEnabledBossesDirty] = useState(false);
  const [officerRolesDirty, setOfficerRolesDirty] = useState(false);
  const [discordBotConfigDirty, setDiscordBotConfigDirty] = useState(false);

  const [isSavingLootCouncil, setIsSavingLootCouncil] = useState(false);
  const [isSavingRosterAttendance, setIsSavingRosterAttendance] = useState(false);
  const [isSavingScoring, setIsSavingScoring] = useState(false);
  const [isSavingRaidAssignments, setIsSavingRaidAssignments] = useState(false);
  const [isSavingOfficerRoles, setIsSavingOfficerRoles] = useState(false);
  const [isSavingDiscordBotConfig, setIsSavingDiscordBotConfig] = useState(false);

  const selectedMyPlayerName = useMemo(() => {
    if (!globalMyPlayerId) return null;
    return roster.find(p => p.id === parseInt(globalMyPlayerId))?.name || null;
  }, [globalMyPlayerId, roster]);

  const visibleBankRequests = useMemo(() => {
    return (Array.isArray(bankRequests) ? bankRequests : []).filter(request => !bankArchivedRequestIds.includes(request.id));
  }, [bankRequests, bankArchivedRequestIds]);

  const archivedBankRequests = useMemo(() => {
    return (Array.isArray(bankRequests) ? bankRequests : []).filter(request => bankArchivedRequestIds.includes(request.id));
  }, [bankRequests, bankArchivedRequestIds]);
  const archivedRequestIds = useMemo(() => archivedBankRequests.map(request => request.id), [archivedBankRequests]);

  const isArchivedRequestSelected = (requestId) => selectedArchivedRequestIds.some(id => String(id) === String(requestId));

  const toggleArchivedRequestSelection = (requestId) => {
    const normalizedId = String(requestId);
    setSelectedArchivedRequestIds(prev => prev.some(id => String(id) === normalizedId)
      ? prev.filter(id => String(id) !== normalizedId)
      : [...prev, requestId]);
  };

  const toggleAllArchivedRequestsSelection = () => {
    const allSelected = archivedRequestIds.length > 0 && archivedRequestIds.every(id => isArchivedRequestSelected(id));

    if (allSelected) {
      setSelectedArchivedRequestIds(prev => prev.filter(id => !archivedRequestIds.some(archivedId => String(archivedId) === String(id))));
      return;
    }

    setSelectedArchivedRequestIds(prev => {
      const next = [...prev];
      archivedRequestIds.forEach(id => {
        const normalizedId = String(id);
        if (!next.some(existingId => String(existingId) === normalizedId)) {
          next.push(id);
        }
      });
      return next;
    });
  };

  const handleArchiveBankRequests = (requestIds = []) => {
    const normalized = [...new Set([...bankArchivedRequestIds, ...requestIds.filter(Boolean)])];
    setBankArchivedRequestIds(normalized);
  };

  const handleRestoreArchivedBankRequests = (requestIds = []) => {
    const normalized = new Set(requestIds.filter(Boolean));
    setBankArchivedRequestIds(prev => prev.filter(id => !normalized.has(id)));
  };

  const restoreSelectedArchivedRequests = () => {
    if (selectedArchivedRequestIds.length === 0) return;
    const requestIds = selectedArchivedRequestIds.filter(id => archivedRequestIds.some(archivedId => String(archivedId) === String(id)));
    if (requestIds.length === 0) return;
    handleRestoreArchivedBankRequests(requestIds);
    setSelectedArchivedRequestIds([]);
  };

  const handleAddTodoItem = () => {
    setTodoDraftItems(prev => [...prev, { id: Date.now(), item: '', owner: selectedMyPlayerName || '', comments: '', status: 'Open' }]);
    setTodoDirty(true);
  };

  const handleUpdateTodoItem = (id, field, value) => {
    setTodoDraftItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    setTodoDirty(true);
  };

  const handleRemoveTodoItem = (id) => {
    setTodoDraftItems(prev => prev.filter(item => item.id !== id));
    setTodoDirty(true);
  };

  const handleSaveTodoItems = () => {
    setAdminTodoItems(todoDraftItems);
    setTodoDirty(false);
  };

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

  const customRaidGroups = useMemo(() => {
    const grouped = raidAssignmentData?.__customBossGroups;
    if (Array.isArray(grouped)) return grouped;

    // Backward compatibility for older single-list custom boss storage.
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

  const hasLootUnsavedChanges = assignmentsDirty;
  const hasItemsDbUnsavedChanges = dbBisPrioritiesDirty || mutableItemsDirty;
  const hasRosterUnsavedChanges = rosterDirty || raidLogsDirty || playerStatsDirty;
  const hasScoringUnsavedChanges = scoringConfigDirty || playerStatsDirty;
  const hasRaidAssignmentsUnsavedChanges = raidAssignmentDataDirty || enabledBossesDirty;
  const hasAnyUnsavedChanges = hasLootUnsavedChanges || hasItemsDbUnsavedChanges || hasRosterUnsavedChanges || hasScoringUnsavedChanges || hasRaidAssignmentsUnsavedChanges || officerRolesDirty || discordBotConfigDirty || todoDirty;
  const unsavedSections = [
    hasLootUnsavedChanges ? 'Loot Council' : null,
    hasRaidAssignmentsUnsavedChanges ? 'Raid Assignments' : null,
    hasRosterUnsavedChanges ? 'Roster' : null,
    hasScoringUnsavedChanges ? 'Scoring' : null,
    hasItemsDbUnsavedChanges ? 'Items DB' : null,
    officerRolesDirty ? 'Officer Roles' : null,
    discordBotConfigDirty ? 'Discord Config' : null,
    todoDirty ? 'To-do List' : null
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
        if (!assignmentsDirty) setAssignmentsLocal(assignmentsData);
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
  const setRoster = (newVal) => {
    setRosterLocal(newVal);
    setRosterDirty(true);
  };
  const setAssignments = (newVal) => {
    setAssignmentsLocal(newVal);
    setAssignmentsDirty(true);
  };
  const setBisPriorities = (newVal) => {
    setBisPrioritiesLocal(newVal);
    const phaseKey = PHASE_JSON_KEYS[globalPhase];
    putData('bis-priorities/' + phaseKey, newVal);
  };
  const setDbBisPriorities = (newVal) => {
    setDbBisPrioritiesLocal(newVal);
    setDbBisPrioritiesDirty(true);
  };
  const setScoringConfig = (newVal) => { setScoringConfigLocal(newVal); setScoringConfigDirty(true); };
  const setPlayerStats = (newVal) => { setPlayerStatsLocal(newVal); setPlayerStatsDirty(true); };
  const setRaidLogs = (newVal) => { setRaidLogsLocal(newVal); setRaidLogsDirty(true); };
  const setRaidAssignmentData = (newValOrUpdater) => {
    setRaidAssignmentDataLocal(prev => (typeof newValOrUpdater === 'function' ? newValOrUpdater(prev) : newValOrUpdater));
    setRaidAssignmentDataDirty(true);
  };
  const setEnabledBosses = (newValOrUpdater) => {
    setEnabledBossesLocal(prev => (typeof newValOrUpdater === 'function' ? newValOrUpdater(prev) : newValOrUpdater));
    setEnabledBossesDirty(true);
  };
  const setOfficerRolesData = (newValOrUpdater) => {
    setOfficerRoles(prev => (typeof newValOrUpdater === 'function' ? newValOrUpdater(prev) : newValOrUpdater));
    setOfficerRolesDirty(true);
  };
  const setDiscordBotConfig = (newValOrUpdater) => {
    setDiscordBotConfigLocal(prev => (typeof newValOrUpdater === 'function' ? newValOrUpdater(prev) : newValOrUpdater));
    setDiscordBotConfigDirty(true);
  };
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

  // ==========================================
  // 6. ACTIONS & LOGIC
  // ==========================================
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    const token = await login(passwordInput);
    if (token) {
      setIsAuthenticated(true);
      sessionStorage.setItem('ar-auth-token', token); // session token, not the password
      sessionStorage.setItem('ar-auth', 'true');
      setPasswordInput('');
    } else {
      alert("Incorrect password! Access Denied.");
      setPasswordInput('');
    }
  };

  const refreshBattleNetAuth = async () => {
    setBnetAuthState(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const me = await getBattleNetAuthMe();
      const authenticated = Boolean(me?.authenticated);
      setBnetAuthState({
        loading: false,
        authenticated,
        user: me?.user || null,
        claimedCharacters: me?.claimedCharacters || [],
        error: '',
        characters: [],
        diagnostics: [],
        showBnetCharacterLookup: authenticated
      });
    } catch (error) {
      setBnetAuthState({
        loading: false,
        authenticated: false,
        user: null,
        claimedCharacters: [],
        error: error.message || 'Battle.net session unavailable.',
        characters: [],
        diagnostics: [],
        showBnetCharacterLookup: false
      });
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authState = params.get('auth');
    if (authState === 'success' || authState === 'failed') {
      const nextUrl = `${window.location.pathname}${window.location.hash}`;
      window.history.replaceState({}, '', nextUrl);
    }
    refreshBattleNetAuth();
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('ar-auth');
    sessionStorage.removeItem('ar-auth-token');
  };

  const handleBattleNetLogin = () => {
    startBattleNetLogin();
  };

  const handleBattleNetLogout = async () => {
    try {
      await logoutBattleNet();
    } catch (error) {
      console.error('Failed to log out from Battle.net:', error);
    } finally {
      await refreshBattleNetAuth();
    }
  };

  const handleBattleNetClaim = async (character) => {
    setBnetClaimBusy(true);
    setBnetAuthState(prev => ({ ...prev, error: '' }));
    try {
      await claimRosterCharacter({ characterName: character.name, realmSlug: character.realmSlug });
      const rosterData = await fetchData('roster');
      setRosterLocal(rosterData);
      setRosterDirty(false);
      await refreshBattleNetAuth();
      setShowBnetClaimModal(false);
    } catch (error) {
      setBnetAuthState(prev => ({ ...prev, error: error.message || 'Failed to claim roster character.' }));
    } finally {
      setBnetClaimBusy(false);
    }
  };

  const refreshRosterClaims = async () => {
    if (!isAuthenticated) {
      setRosterClaims([]);
      return;
    }
    try {
      const data = await getRosterClaimsAdmin();
      setRosterClaims(data.claims || []);
    } catch (error) {
      setRosterClaims([]);
    }
  };

  const handleUnclaimClaim = async (claim) => {
    try {
      await unclaimRosterCharacterAdmin({ rosterId: claim.rosterId });
      const rosterData = await fetchData('roster');
      setRosterLocal(rosterData);
      setRosterDirty(false);
      await refreshBattleNetAuth();
      await refreshRosterClaims();
    } catch (error) {
      setBnetAuthState(prev => ({ ...prev, error: error.message || 'Failed to clear the claim.' }));
    }
  };

  const handleBattleNetManualClaim = async (player) => {
    setBnetClaimBusy(true);
    setBnetAuthState(prev => ({ ...prev, error: '' }));
    try {
      await claimRosterCharacterManual({ rosterId: player.id, battletag: bnetAuthState.user?.battletag || '' });
      const rosterData = await fetchData('roster');
      setRosterLocal(rosterData);
      setRosterDirty(false);
      await refreshBattleNetAuth();
      setShowBnetClaimModal(false);
    } catch (error) {
      setBnetAuthState(prev => ({ ...prev, error: error.message || 'Failed to claim roster character.' }));
    } finally {
      setBnetClaimBusy(false);
    }
  };

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
    if (window.confirm("Are you sure you want to permanently delete this player?")) {
      setRoster(roster.filter(p => p.id !== id));
    }
  };

  const toggleRaidStatus = (id) => setRoster(roster.map(p => p.id === id ? { ...p, in_raid: !p.in_raid } : p));
  const setAllRaidStatus = (status) => setRoster(roster.map(p => ({ ...p, in_raid: status })));
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
    setAssignments(prev => {
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
    });
    setAssignmentsDirty(true);
  };

  const handleToggleAwardedPriority = (itemName, playerId) => {
    setAssignments(prev => {
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
    });
    setAssignmentsDirty(true);
  };

  const calculateAttendance = (playerId) => {
    if (raidLogs.length === 0) return 100;
    const attendedCount = raidLogs.filter(log => (log.attendees || []).map(Number).includes(Number(playerId))).length;
    return Math.round((attendedCount / raidLogs.length) * 100);
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
    const att = calculateAttendance(playerId) * Number(scoringConfig.attWeight);
    const afkPenalty = (stats.afks || 0) * Number(scoringConfig.afkPenalty || 5);
    const manualAdj = stats.manualAdjustment?.value || 0;

    return ((avgParse * Number(scoringConfig.parseWeight)) + cons + ench + gem + att - afkPenalty + manualAdj).toFixed(1);
  };

  const handleSaveRaidLog = (e) => {
    e.preventDefault();
    const activeRaiderIds = roster.filter(p => p.in_raid).map(p => Number(p.id));
    setRaidLogs([{ id: Date.now(), date: newRaidDate, zone: newRaidZone, attendees: activeRaiderIds }, ...raidLogs]);
    alert(`Saved raid log for ${activeRaiderIds.length} players!`);
  };

  const normalizeRaidHelperToken = (value) => {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[0-9]+$/g, '');
  };

  const parseRaidHelperDate = (value) => {
    const raw = String(value || '').trim();
    const match = raw.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if (!match) return new Date().toISOString().split('T')[0];
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  };

  const parseRaidSignupDate = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return new Date().toISOString().split('T')[0];

    const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymd) {
      return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
    }

    const dmy = raw.match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (dmy) {
      return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
    }

    return new Date().toISOString().split('T')[0];
  };

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
      const raidZone = String(event?.title || newRaidZone || 'Raid Signup Import').trim();

      setRoster(rosterWithRaidState);
      setRaidLogs([{ id: Date.now(), date: raidDate, zone: raidZone, attendees: [...attendeeSet] }, ...raidLogs]);
      setNewRaidDate(raidDate);
      setNewRaidZone(raidZone);

      let msg = `Imported ${attendeeSet.size} grouped attendees from signup #${numericEventId}.`;
      if (unmatched.length > 0) {
        msg += `\nUnmatched (${unmatched.length}): ${unmatched.slice(0, 12).join(', ')}${unmatched.length > 12 ? ', ...' : ''}`;
      }
      if (ambiguous.length > 0) {
        msg += `\nAmbiguous name matches (${ambiguous.length}) used first roster match.`;
      }

      alert(msg);
      return true;
    } catch (e) {
      alert('Failed to import attendees from raid signup event.');
      return false;
    }
  };

  const resolveSpecIdFromRaidHelper = (signup, preferredClass) => {
    const classCandidates = [signup?.className, signup?.cClassName]
      .map(v => String(v || '').trim())
      .filter(Boolean)
      .filter(v => !['Absence', 'Tentative', 'Bench', 'Late', 'Tank'].includes(v));

    const preferredClassToken = normalizeRaidHelperToken(preferredClass);
    const classTokens = [...new Set(classCandidates.map(normalizeRaidHelperToken))];
    const specTokens = [...new Set([signup?.specName, signup?.cSpecName].map(normalizeRaidHelperToken).filter(Boolean))];
    if (specTokens.length === 0) return null;

    const specMatches = specsFromDb.filter(spec => specTokens.includes(normalizeRaidHelperToken(spec.spec)));
    if (specMatches.length === 0) return null;

    if (preferredClassToken) {
      const preferred = specMatches.find(spec => normalizeRaidHelperToken(spec.class) === preferredClassToken);
      if (preferred) return preferred.id;
    }

    if (classTokens.length > 0) {
      const classFiltered = specMatches.filter(spec => classTokens.includes(normalizeRaidHelperToken(spec.class)));
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
      const classToken = normalizeRaidHelperToken(signup?.className || signup?.cClassName);
      const statusToken = normalizeRaidHelperToken(signup?.status || 'primary');
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
      const target = normalizeRaidHelperToken(name);
      return nextRoster.find(player => normalizeRaidHelperToken(player.name) === target);
    };

    raidSignUps.forEach(signup => {
      const importedName = String(signup.name || '').trim();
      if (!importedName) return;

      let matchedPlayer = findRosterByName(importedName);
      const importedNameToken = normalizeRaidHelperToken(importedName);

      if (!matchedPlayer && aliasMap[importedNameToken]) {
        matchedPlayer = findRosterByName(aliasMap[importedNameToken]);
      }

      const matchedSpec = matchedPlayer ? getSpecById(matchedPlayer.spec_id) : null;
      const resolvedSpecId = resolveSpecIdFromRaidHelper(signup, matchedSpec?.class);
      const resolvedSpec = resolvedSpecId ? getSpecById(resolvedSpecId) : null;
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

    const raidDate = parseRaidHelperDate(parsed?.date);
    const raidZone = String(parsed?.displayTitle || parsed?.title || parsed?.channelName || newRaidZone || 'Imported Raid').trim();

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

  const handleClearOverviewItemPriorities = (itemName) => {
    if (!itemName) return;
    if (!window.confirm(`Clear all assigned priorities for ${itemName}? This will remove it from Priority Overview until reassigned.`)) return;

    const next = { ...assignments };
    delete next[itemName];
    setAssignments(next);
    setAssignmentsDirty(true);
  };

  const handleOpenItemForLootAssignment = (itemName) => {
    if (!itemName) return;
    setActiveTab('loot');
    setLootSubTab('assignment');
    setSearchQuery(itemName);
    setSelectedItemName(itemName);
  };

  const handleDeleteRaidLog = (logId) => {
    if (window.confirm("Delete this raid log?")) setRaidLogs(raidLogs.filter(log => log.id !== logId));
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

  const handleSaveLootCouncilChanges = async ({ silent = false } = {}) => {
    if (!assignmentsDirty) return;
    setIsSavingLootCouncil(true);
    try {
      const phaseKey = PHASE_JSON_KEYS[globalPhase];
      await putData('assignments/' + phaseKey, assignments);
      try {
        const latest = await fetchData('assignments/' + phaseKey);
        setAssignments(latest);
      } catch (e) {
        console.warn('Failed to re-fetch assignments after save:', e);
      }
      setAssignmentsDirty(false);
      if (!silent) alert('Loot council assignments saved.');
    } catch (e) {
      if (e?.status === 401 || /unauthorized|officer authentication required/i.test(String(e?.message || ''))) {
        handleLogout();
        if (!silent) alert('Officer session expired. Please log in again to save loot council assignments.');
      } else if (!silent) {
        alert(`Failed to save loot council assignments.\n${e?.message || ''}`.trim());
      }
      throw e;
    } finally {
      setIsSavingLootCouncil(false);
    }
  };

  const handleSaveRosterAttendanceChanges = async ({ silent = false } = {}) => {
    if (!rosterDirty && !playerStatsDirty && !raidLogsDirty) return;
    setIsSavingRosterAttendance(true);
    try {
      let updatedRoster = roster;
      let updatedStats = playerStats;
      let updatedRaidLogs = raidLogs;
      let idMap = {};

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

  const handleSaveOfficerRoles = async ({ silent = false } = {}) => {
    if (!officerRolesDirty) return;
    setIsSavingOfficerRoles(true);
    try {
      await putData('officer-roles', officerRoles);
      setOfficerRolesDirty(false);
      if (!silent) alert('Officer roles saved.');
    } catch (e) {
      if (!silent) alert('Failed to save officer roles.');
      throw e;
    } finally {
      setIsSavingOfficerRoles(false);
    }
  };

  const handleSaveDiscordBotConfig = async ({ silent = false } = {}) => {
    if (!discordBotConfigDirty && !scoringConfigDirty) return;
    setIsSavingDiscordBotConfig(true);
    try {
      if (discordBotConfigDirty) {
        await putData('discord-bot-config', discordBotConfig);
      }
      if (scoringConfigDirty) {
        await putData('scoring-config', scoringConfig);
      }
      setDiscordBotConfigDirty(false);
      setScoringConfigDirty(false);
      if (!silent) alert('Config changes saved.');
    } catch (e) {
      if (!silent) alert('Failed to save config changes.');
      throw e;
    } finally {
      setIsSavingDiscordBotConfig(false);
    }
  };

  const handleSaveRaidAssignmentsChanges = async ({ silent = false } = {}) => {
    if (!raidAssignmentDataDirty && !enabledBossesDirty) return;
    if (!isAuthenticated) {
      if (!silent) alert('Officer login required to save raid assignments.');
      throw new Error('Officer login required to save raid assignments.');
      return;
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

  const handleResolveBankRequest = async (id, status, price, note, approvedQuantity) => {
    try {
      await putData(`bank-requests/${id}`, { status, price, officer_note: note, approved_quantity: approvedQuantity });
      const requests = await fetchData('bank-requests');
      setBankRequests(requests);
      setRespondingRequestId(null);
      setApprovePrice('');
      setApproveQuantity('');
      setApproveNote('');
      setDenyReason('');
      setDenyCustomReason('');
    } catch (e) {
      alert('Failed to resolve request.');
    }
  };

  const handleBulkResolveBankRequests = async (resolutions) => {
    try {
      await putData('bank-requests/bulk-resolve', { resolutions });
      const requests = await fetchData('bank-requests');
      setBankRequests(requests);
      setRespondingRequestId(null);
      setApprovePrice('');
      setApproveQuantity('');
      setApproveNote('');
      setDenyReason('');
      setDenyCustomReason('');
    } catch (e) {
      alert('Failed to resolve basket requests.');
    }
  };

  const handleBankFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const parsed = [];

      const idRegex = /\[(\d+)\]\s*=\s*\{/g;
      let match;

      while ((match = idRegex.exec(text)) !== null) {
        const id = match[1];
        const restOfFile = text.substring(match.index);
        const closingBracket = restOfFile.indexOf('},');
        const itemDataStr = restOfFile.substring(0, closingBracket);

        const countMatch = itemDataStr.match(/\["count"\]\s*=\s*(\d+)/);
        const count = countMatch ? parseInt(countMatch[1]) : 1;

        const nameMatch = itemDataStr.match(/\["name"\]\s*=\s*"([^"]+)"/);
        const name = nameMatch ? nameMatch[1] : 'Unknown Item';

        const catMatch = itemDataStr.match(/\["category"\]\s*=\s*"([^"]+)"/);
        const rawCat = catMatch ? catMatch[1] : 'Misc';
        const cleanCat = CATEGORY_MAP[rawCat] || 'Misc';

        const subTypeMatch = itemDataStr.match(/\["subtype"\]\s*=\s*"([^"]+)"/);
        const subType = subTypeMatch ? subTypeMatch[1] : '';

        parsed.push({
          item_wowhead_id: parseInt(id),
          count,
          name,
          category: cleanCat,
          sub_type: subType
        });
      }

      const goldMatch = text.match(/\["(?:gold|guildGold|bankGold)"\]\s*=\s*(\d+)/);
      const parsedGold = goldMatch ? parseInt(goldMatch[1], 10) : null;
      setBankUploadMeta({ gold: parsedGold });

      if (parsed.length === 0) {
        setBankUploadStatus('⚠️ Found 0 items. Check your Lua file.');
        setBankUploadParsed(null);
      } else {
        setBankUploadStatus(`✅ Loaded ${parsed.length} items. Click Save to update the bank.`);
        setBankUploadParsed(parsed);
      }
    };
    reader.readAsText(file);
  };

  const handleParseBankUpdateJson = () => {
    try {
      const parsedData = JSON.parse(bankUpdateJsonText || '{}');
      const items = Array.isArray(parsedData.bankItems)
        ? parsedData.bankItems
        : Array.isArray(parsedData.items)
          ? parsedData.items
          : Array.isArray(parsedData.data)
            ? parsedData.data
            : [];

      const normalized = items.map(item => ({
        item_wowhead_id: Number(item.item_wowhead_id ?? item.id ?? item.itemId) || 0,
        count: Number(item.count ?? item.quantity ?? 0) || 0,
        name: item.name || item.item_name || '',
        category: item.category || item.cat || '',
        sub_type: item.sub_type || item.subtype || item.subType || ''
      })).filter(item => item.item_wowhead_id > 0);

      if (normalized.length === 0) {
        setBankUploadStatus('⚠️ No valid bank items found in JSON.');
        setBankUploadParsed(null);
        return;
      }

      const parsedGold = Number(parsedData.gold ?? parsedData.guildGold ?? parsedData.bankGold ?? parsedData.guild_gold ?? parsedData.guildGoldCopper ?? 0);
      setBankUploadMeta({ gold: Number.isFinite(parsedGold) ? parsedGold : null });
      setBankUploadParsed(normalized);
      setBankUploadStatus(`✅ Loaded ${normalized.length} items from JSON. Click Save to update the bank.`);
    } catch (error) {
      setBankUploadStatus('❌ Invalid JSON. Please paste the exported blob from the addon.');
      setBankUploadParsed(null);
    }
  };

  const handleSaveBankUpload = async () => {
    if (!bankUploadParsed) return;
    setBankUploadStatus('Uploading...');
    try {
      const payload = Array.isArray(bankUploadParsed) ? bankUploadParsed : (bankUploadParsed.items || []);
      const data = await putData('bank-items', payload);
      const snapshot = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        itemCount: Array.isArray(payload) ? payload.length : 0,
        gold: bankUploadMeta?.gold ?? null,
        items: payload
      };
      setBankContentsHistory(prev => [snapshot, ...prev].slice(0, 12));
      setBankUploadStatus(`✅ Bank updated with ${data.count} items! Discord notified.`);
      setBankUploadParsed(null);
      setBankUploadMeta({ gold: null });
      const items = await fetchData('bank-items');
      setBankItems(items);
    } catch (e) {
      setBankUploadStatus('❌ Error uploading.');
    }
  };

  const handleCopyRaidAssignmentsToArchive = (archiveEntry) => {
    setRaidAssignmentArchives(prev => {
      const next = [archiveEntry, ...prev].slice(0, 12);
      setSelectedRaidAssignmentArchiveId(archiveEntry.id);
      setSelectedRaidRestoreBosses(Array.isArray(archiveEntry.selectedBosses) ? archiveEntry.selectedBosses : []);
      return next;
    });
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
        requestedBosses.forEach(bossName => {
          if (Object.prototype.hasOwnProperty.call(snapshot.__bossOrder, bossName)) {
            next.__bossOrder[bossName] = snapshot.__bossOrder[bossName];
          }
        });
      }

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

  const exportArchivedRequestsCsv = () => {
    const header = ['id', 'created_at', 'status', 'item_name', 'quantity', 'approved_quantity', 'price', 'requester_name', 'reason', 'officer_note'];
    const escapeCsv = (value) => {
      const raw = String(value ?? '');
      return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
    };
    const rows = archivedBankRequests.map(request => {
      const rosterPlayer = roster.find(player => Number(player.id) === Number(request.player_id));
      return [
        request.id,
        request.created_at,
        request.status,
        request.item_name,
        request.quantity,
        request.approved_quantity,
        request.price,
        rosterPlayer?.name || request.player_name || request.requester_name || '',
        request.reason,
        request.officer_note
      ].map(escapeCsv).join(',');
    });
    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bank-request-history-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportBankContentsHistoryCsv = () => {
    const header = ['snapshot_id', 'timestamp', 'gold', 'item_wowhead_id', 'name', 'count', 'category', 'sub_type'];
    const escapeCsv = (value) => {
      const raw = String(value ?? '');
      return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
    };
    const rows = bankContentsHistory.flatMap(snapshot => (
      Array.isArray(snapshot.items) && snapshot.items.length > 0
        ? snapshot.items.map(item => [
            snapshot.id,
            snapshot.timestamp,
            snapshot.gold,
            item.item_wowhead_id,
            item.name,
            item.count ?? item.quantity,
            item.category,
            item.sub_type
          ].map(escapeCsv).join(','))
        : [[snapshot.id, snapshot.timestamp, snapshot.gold, '', '', '', '', ''].map(escapeCsv).join(',')]
    ));
    const blob = new Blob([[header.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bank-contents-history-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveAllChanges = async () => {
    if (!hasAnyUnsavedChanges) return;
    try {
      if (todoDirty) handleSaveTodoItems();
      if (hasLootUnsavedChanges) await handleSaveLootCouncilChanges({ silent: true });
      if (hasRaidAssignmentsUnsavedChanges) await handleSaveRaidAssignmentsChanges({ silent: true });
      if (hasRosterUnsavedChanges) await handleSaveRosterAttendanceChanges({ silent: true });
      if (hasScoringUnsavedChanges) await handleSaveScoringChanges({ silent: true });
      if (hasItemsDbUnsavedChanges) await handleSaveItemsDbChanges();
      if (officerRolesDirty) await handleSaveOfficerRoles({ silent: true });
      if (discordBotConfigDirty) await handleSaveDiscordBotConfig({ silent: true });
      alert('All pending changes saved.');
    } catch (error) {
      alert(error?.message || 'Failed to save all changes.');
    }
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

  // --- FILTERS ---
  const uniqueZones = useMemo(() => [...new Set(mutableItems.map(i => i.zone))].sort(), [mutableItems]);
  const uniqueBosses = useMemo(() => {
    let filtered = mutableItems;
    if (filterZone) filtered = filtered.filter(i => i.zone === filterZone);
    return [...new Set(filtered.map(i => i.boss))].sort();
  }, [mutableItems, filterZone]);
  const uniqueSlots = useMemo(() => [...new Set(mutableItems.map(i => i.slot))].sort(), [mutableItems]);

  const filteredItems = mutableItems.filter(item => {
    if (!item || !item.name) return false;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchBoss = filterBoss === '' || item.boss === filterBoss;
    const matchZone = filterZone === '' || item.zone === filterZone;
    const matchSlot = filterSlot === '' || item.slot === filterSlot;
    const isTokenItem = !!item.is_token;
    const matchCategory =
      filterCategory === '' ||
      (filterCategory === 'token' && isTokenItem) ||
      (filterCategory === 'item' && !isTokenItem);
    return matchSearch && matchBoss && matchZone && matchSlot && matchCategory;
  });

  const normalizeWowheadName = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();

  const getWowheadTitleFromHtml = (html) => {
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    if (!titleMatch?.[1]) return null;

    return titleMatch[1]
      .replace(/\s*-\s*Item\s*-\s*TBC(?: Classic)?$/i, '')
      .replace(/\s*-\s*Item$/i, '')
      .trim();
  };

  const dbFilteredItems = useMemo(() => {
    let items = mutableItems.filter(item => item && item.name && item.name.toLowerCase().includes(dbSearch.toLowerCase()));
    if (showMissingWowheadFilter) {
      items = items.filter(item => !item.itemId || String(item.itemId).trim() === '');
    }
    if (showWowheadNameMismatchFilter) {
      items = items.filter(item => {
        const itemId = String(item.itemId || '').trim();
        if (!itemId) return false;
        const wowheadName = wowheadNameCache[itemId];
        if (!wowheadName) return false;
        return normalizeWowheadName(wowheadName) !== normalizeWowheadName(item.name);
      });
    }
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [mutableItems, dbSearch, showMissingWowheadFilter, showWowheadNameMismatchFilter, wowheadNameCache]);

  useEffect(() => {
    if (!showWowheadNameMismatchFilter) return;

    const pendingItems = mutableItems
      .filter(item => item?.itemId && String(item.itemId).trim() && item?.name && !wowheadNameCache[String(item.itemId).trim()])
      .slice(0, 80);

    if (pendingItems.length === 0) return;

    let isCancelled = false;
    const loadWowheadNames = async () => {
      const results = await Promise.allSettled(pendingItems.map(async item => {
        const itemId = String(item.itemId).trim();
        const response = await fetch(`https://www.wowhead.com/tbc/item=${encodeURIComponent(itemId)}`);
        if (!response.ok) throw new Error(`Failed to load wowhead item ${itemId}`);
        const html = await response.text();
        const title = getWowheadTitleFromHtml(html);
        return { itemId, title };
      }));

      if (isCancelled) return;

      setWowheadNameCache(prev => {
        const next = { ...prev };
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value?.title) {
            next[result.value.itemId] = result.value.title;
          }
        });
        return next;
      });
    };

    loadWowheadNames();
    return () => { isCancelled = true; };
  }, [mutableItems, showWowheadNameMismatchFilter, wowheadNameCache]);

  useEffect(() => {
    if (filterZone && filterBoss && !mutableItems.some(i => i.zone === filterZone && i.boss === filterBoss)) setFilterBoss('');
  }, [filterZone, filterBoss, mutableItems]);

  const selectedItem = mutableItems.find(i => i.name === selectedItemName);
  const activeRaiders = roster.filter(p => p.in_raid);

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
  }, [selectedItem, tokenRedemptionsByItemId]);

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

  const sortedEligiblePlayers = useMemo(() => {
    if (!selectedItem) return [];
    const tokenClasses = Array.isArray(selectedItem.token_classes)
      ? selectedItem.token_classes.map(c => String(c).toLowerCase())
      : [];

    // Build a list of players to show:
    // - all roster players
    // - plus any player ids explicitly assigned to this item even if not in roster
    const rosterPlayers = roster.slice();

    // gather assigned player IDs from DB state
    const assignedMap = assignments[selectedItem.name] || {};
    const awardedPlayerIds = normalizeAwardedPlayerIds(assignedMap);
    const assignedIds = Object.keys(assignedMap)
      .filter(id => !['awardedPlayerIds', 'awardedPlayerId', 'assignedAt'].includes(id))
      .map(id => Number(id))
      .filter(id => !Number.isNaN(id));

    // create placeholder player objects for assigned players not in roster
    const rosterIds = new Set(rosterPlayers.map(p => Number(p.id)));
    for (const pid of assignedIds) {
      if (!rosterIds.has(pid)) {
        rosterPlayers.push({ id: pid, name: `Player ${pid}`, spec_id: null, in_raid: false });
      }
    }

    // Filter rosterPlayers to those that are eligible by BiS/Opt OR are assigned to this item
    const eligible = rosterPlayers.filter(player => {
      const specDisplay = getDisplayFromId(player.spec_id) || '?';
      const specObj = getSpecById(player.spec_id);
      const className = String(specObj?.class || '').toLowerCase();
      const playerId = String(player.id);

      if (selectedItem.is_token && tokenClasses.length > 0 && !tokenClasses.includes(className)) {
        // still include if player is explicitly assigned or already awarded
        return assignedIds.includes(Number(player.id)) || awardedPlayerIds.includes(playerId);
      }

      const bisStatus = getPlayerItemPriorityStatus(selectedItem, specDisplay);
      return (bisStatus && bisStatus !== '') || assignedIds.includes(Number(player.id)) || awardedPlayerIds.includes(playerId);
    });

    return sortPlayersByRank(selectedItem, eligible, assignments);
  }, [selectedItem, activeRaiders, assignments, playerStats, scoringConfig, raidLogs, bisPriorities, specsByName, getSpecById, tokenRedemptionsByItemId]);

  const getRankBadgeStyle = (rank) => {
    if (rank === 1) return "bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-950 border border-yellow-200 shadow-[0_0_10px_rgba(253,224,71,0.6)]";
    if (rank === 2) return "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-950 border border-slate-200 shadow-[0_0_8px_rgba(203,213,225,0.5)]";
    if (rank === 3) return "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 border border-amber-500 shadow-[0_0_8px_rgba(217,119,6,0.5)]";
    if (typeof rank === 'number') return "bg-slate-800 text-white border border-slate-600";
    if (rank === 'Pass') return "bg-red-950/50 text-red-400 border border-red-900";
    return "bg-slate-900 text-slate-500 border border-slate-800 border-dashed";
  };

  const getItemsForSlotAndSpec = (slot, spec) => {
    const normalizedSlot = String(slot || '').toLowerCase();
    const dataSlot = slot === "Ring 1" || slot === "Ring 2" ? "ring"
      : slot === "Trinket 1" || slot === "Trinket 2" ? "trinket"
        : normalizedSlot;
    const slotIndex = slot === "Ring 2" || slot === "Trinket 2" ? 1 : 0;
    const isDualSlot = slot.endsWith(" 1") || slot.endsWith(" 2");

    const itemsInSlot = mutableItems.filter(i => {
      const itemSlot = String(i?.slot || '').toLowerCase();
      if (!itemSlot) return false;
      if (itemSlot === dataSlot) return true;
      if (slot === 'Weapon' && itemSlot === 'weapon') return true;
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

    if (isDualSlot) {
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

  const handleSaveItemIdFromModal = () => {
    if (!itemIdEditor) return;
    const trimmed = String(itemIdEditor.wowheadIdInput || '').trim();
    if (trimmed && !/^\d+$/.test(trimmed)) {
      alert('Wowhead ID must be numeric (or blank to clear).');
      return;
    }

    handleUpdateItemId(itemIdEditor.itemId, trimmed);
    setItemIdEditor(null);
  };

  const renderItemSlot = (slotName) => {
    const { bis, opt } = getItemsForSlotAndSpec(slotName, selectedBisSpec);
    const isBottomSlot = BOTTOM_SLOTS.includes(slotName);

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

    return (
      <div key={slotName} className="flex gap-3 bg-slate-900 border border-slate-700 hover:border-slate-500 p-2.5 rounded-lg transition-colors shadow-sm">
        <div key={`${slotName}-${selectedBisSpec}`} className="w-10 h-10 rounded border border-purple-500/50 bg-slate-950 flex-shrink-0 flex items-center justify-center relative shadow-inner overflow-hidden character-slot-icon">
          {bis.length > 0 && bis[0].itemId ? (
            <a
              href={`https://tbc.wowhead.com/item=${bis[0].itemId}`}
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

        <div className="flex flex-col min-w-0 justify-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">{slotName}</span>
          {bis.length > 0 ? (
            bis.map(i => (
              <div key={i.name} className="flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  {renderItemLink(i, "text-sm font-bold text-purple-400 drop-shadow-sm leading-tight")}
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => jumpToMasterItemsDbForItem(i?.name || '')}
                      className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10px] font-black leading-none shadow"
                      title={i?.itemId ? 'Edit Wowhead ID in Master Items DB' : 'Set Wowhead ID in Master Items DB'}
                    >
                      ✎
                    </button>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-[10px] text-amber-500/70 font-semibold">{i.boss}</span>
                  {i.drop_chance && <span className="text-[10px] text-cyan-400/70 font-semibold">{(i.drop_chance * 100).toFixed(0)}% Drop</span>}
                </div>
              </div>
            ))
          ) : (<span className="text-sm font-bold text-slate-500 italic leading-tight">No primary BiS</span>)}
          {opt.length > 0 && (
            <div className="mt-1 flex flex-col gap-y-1">
              {opt.map(i => (
                <div key={i.name} className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] text-amber-500/70 font-semibold uppercase flex-shrink-0">Alt:</span>
                    <div className="flex items-center justify-between gap-2 w-full min-w-0">
                      {renderItemLink(i, "text-[10px] text-slate-400 truncate max-w-[150px]")}
                      {isAuthenticated && (
                        <button
                          type="button"
                          onClick={() => jumpToMasterItemsDbForItem(i?.name || '')}
                          className="w-4 h-4 flex-shrink-0 flex items-center justify-center rounded-full bg-amber-600 hover:bg-amber-500 text-slate-950 text-[9px] font-black leading-none shadow"
                          title={i?.itemId ? 'Edit Wowhead ID in Master Items DB' : 'Set Wowhead ID in Master Items DB'}
                        >
                          ✎
                        </button>
                      )}
                    </div>
                    {!isBottomSlot && <span className="text-[10px] text-amber-500/70 font-semibold whitespace-nowrap">{i.boss}</span>}
                  </div>
                  {isBottomSlot && (
                    <div className="flex gap-2 pl-6">
                      <span className="text-[10px] text-amber-500/70 font-semibold">{i.boss}</span>
                      {i.drop_chance && <span className="text-[10px] text-cyan-400/70 font-semibold">{(i.drop_chance * 100).toFixed(0)}% Drop</span>}
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
    const isBankTabActive = activeTab === 'bank' || activeTab === 'bankRequests';
    if (!isBankTabActive) return;

    const loadBankData = async () => {
      if (document.hidden) return;
      try {
        const items = await fetchData('bank-items');
        setBankItems(items);
        if (isAuthenticated) {
          const requests = await fetchData('bank-requests');
          setBankRequests(requests);
        }
      } catch (e) {
        console.error('Failed to load bank data:', e);
      }
    };
    loadBankData();
    const interval = setInterval(loadBankData, BANK_SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [activeTab, isAuthenticated]);

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
  }, [activeTab, raidAssignmentDataDirty, enabledBossesDirty]);

  useEffect(() => {
    if (activeTab !== 'officerRoles') return;

    const loadOfficerRoles = async () => {
      if (document.hidden) return;
      try {
        const data = await fetchData('officer-roles');
        if (!officerRolesDirty) setOfficerRoles(data);
      } catch (e) {
        console.error('Failed to load officer roles:', e);
      }
    };

    loadOfficerRoles();
  }, [activeTab, officerRolesDirty]);

  useEffect(() => {
    if (activeTab !== 'discordBotConfig') return;

    const loadDiscordBotConfig = async () => {
      if (document.hidden) return;
      try {
        const data = await fetchData('discord-bot-config');
        if (!discordBotConfigDirty) {
          setDiscordBotConfigLocal({
            request_roles: Array.isArray(data?.request_roles) ? data.request_roles : [],
            signup_roles: Array.isArray(data?.signup_roles) ? data.signup_roles : [],
            bench_roles: Array.isArray(data?.bench_roles) ? data.bench_roles : []
          });
        }
      } catch (e) {
        console.error('Failed to load Discord bot config:', e);
      }
    };

    loadDiscordBotConfig();
    refreshRosterClaims();
  }, [activeTab, discordBotConfigDirty]);

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

  const selectedRaidAssignmentArchive = raidAssignmentArchives.find(entry => entry.id === selectedRaidAssignmentArchiveId) || null;

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
      <style>{`
          .character-slot-icon .iconlarge {
            width: 30px !important;
            height: 30px !important;
            display: block !important;
          }
          .character-slot-icon .iconlarge ins {
            width: 32px !important;
            height: 32px !important;
          }
          .overview-tab .character-slot-icon .iconlarge {
            margin-top: -4px !important;
            margin-left: -4px !important;
          }
        `}</style>
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
                  <option value="">— Select Character —</option>
                  {sortedRosterForSelector.map(player => {
                    const isCurrentUserClaim = currentUserClaimedRosterIds.has(Number(player.id));
                    const isClaimedElsewhere = Boolean(player.user_id && !isCurrentUserClaim);
                    const icon = isCurrentUserClaim ? '✓' : isClaimedElsewhere ? '●' : '○';
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
                  <form onSubmit={handleLogin} className="flex items-center gap-2">
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
          <div className="space-y-4">
            {bankSubTab === 'contents' && (
              <GuildBankTab
                bankItems={bankItems}
                bankSearch={bankSearch}
                setBankSearch={setBankSearch}
                isAuthenticated={isAuthenticated}
                roster={roster}
                myPlayerId={globalMyPlayerId ? parseInt(globalMyPlayerId) : null}
              />
            )}
            {bankSubTab === 'requests' && (
              isAuthenticated ? (
                <BankRequestsTab
                  bankRequests={visibleBankRequests}
                  roster={roster}
                  specsByName={specsByName}
                  getDisplayFromId={getDisplayFromId}
                  respondingRequestId={respondingRequestId}
                  setRespondingRequestId={setRespondingRequestId}
                  approveQuantity={approveQuantity}
                  setApproveQuantity={setApproveQuantity}
                  approvePrice={approvePrice}
                  setApprovePrice={setApprovePrice}
                  approveNote={approveNote}
                  setApproveNote={setApproveNote}
                  denyReason={denyReason}
                  setDenyReason={setDenyReason}
                  denyCustomReason={denyCustomReason}
                  setDenyCustomReason={setDenyCustomReason}
                  handleResolveBankRequest={handleResolveBankRequest}
                  handleBulkResolveBankRequests={handleBulkResolveBankRequests}
                  archivedBankRequests={archivedBankRequests}
                  onArchiveBankRequests={handleArchiveBankRequests}
                  onRestoreArchivedBankRequests={handleRestoreArchivedBankRequests}
                />
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
                  <h3 className="text-lg font-bold text-slate-200 mb-2">Officer login required</h3>
                  <p className="text-sm">Use the officer unlock bar above to manage bank requests and inventory updates.</p>
                </div>
              )
            )}
            {bankSubTab === 'addon' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-amber-400">Guild Bank Addon</h3>
                <p className="text-sm text-slate-400">Install the TBC Bank Logger addon to stream live bank snapshots into the dashboard.</p>
                <a href="/addon/TBCBankLogger.zip" className="inline-flex items-center rounded-lg border border-amber-600/40 bg-amber-600/10 px-4 py-2 text-sm font-bold text-amber-400 transition hover:bg-amber-600/20">Download Addon (.zip)</a>
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300 space-y-2">
                  <p>1. Extract the addon into your WoW Interface folder.</p>
                  <p>2. Reload the UI and log in with your guild character.</p>
                  <p>3. Use the Update sub-tab to sync new bank snapshots when the vault changes.</p>
                </div>
              </div>
            )}
            {bankSubTab === 'update' && (
              isAuthenticated ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-bold text-slate-100">Bank Inventory Update</h3>
                  <p className="text-sm text-slate-400">Upload the latest bank export or parsed snapshot to refresh the vault list.</p>
                  <input type="file" onChange={handleBankFileUpload} className="block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300" />
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Paste Bank JSON</label>
                      <textarea
                        value={bankUpdateJsonText}
                        onChange={e => setBankUpdateJsonText(e.target.value)}
                        placeholder="Paste the addon-exported JSON here..."
                        rows={6}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={handleParseBankUpdateJson} className="rounded-lg bg-cyan-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-cyan-600">Import JSON</button>
                      <button
                        type="button"
                        onClick={() => {
                          setBankUpdateJsonText('');
                          setBankUploadParsed(null);
                          setBankUploadMeta({ gold: null });
                          setBankUploadStatus('');
                        }}
                        className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 transition hover:bg-slate-900"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={handleSaveBankUpload} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-500">Save Upload</button>
                    <span className="text-xs text-slate-500">{bankUploadStatus}</span>
                  </div>
                  {bankUploadMeta?.gold !== null && bankUploadMeta?.gold !== undefined && (
                    <div className="text-xs font-semibold text-amber-400">Detected guild gold: {bankUploadMeta.gold}</div>
                  )}
                  {bankUploadParsed && (
                    <pre className="max-h-64 overflow-auto rounded-lg border border-slate-800 bg-slate-900 p-4 text-[11px] leading-5 text-slate-300 whitespace-pre-wrap">
                      {JSON.stringify(bankUploadParsed, null, 2)}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
                  <h3 className="text-lg font-bold text-slate-200 mb-2">Officer login required</h3>
                  <p className="text-sm">This section is reserved for officer inventory updates.</p>
                </div>
              )
            )}
            {bankSubTab === 'history' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">Request History</h3>
                      <p className="text-sm text-slate-400">Archived requests stay here until an officer restores them for review or follow-up.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {archivedBankRequests.length > 0 && (
                        <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          <input
                            type="checkbox"
                            checked={archivedRequestIds.length > 0 && archivedRequestIds.every(id => isArchivedRequestSelected(id))}
                            onChange={toggleAllArchivedRequestsSelection}
                            className="rounded border-slate-700 bg-slate-950"
                          />
                          Select all
                        </label>
                      )}
                      <button
                        type="button"
                        onClick={restoreSelectedArchivedRequests}
                        disabled={selectedArchivedRequestIds.length === 0}
                        className="rounded-lg border border-emerald-700/40 bg-emerald-900/20 px-3 py-2 text-xs font-bold uppercase tracking-wider text-emerald-400 transition hover:bg-emerald-900/40 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Restore Selected{selectedArchivedRequestIds.length > 0 ? ` (${selectedArchivedRequestIds.length})` : ''}
                      </button>
                      <button type="button" onClick={exportArchivedRequestsCsv} className="rounded-lg border border-cyan-700/40 bg-cyan-900/20 px-3 py-2 text-xs font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-900/40">Export Requests CSV</button>
                    </div>
                  </div>
                  {archivedBankRequests.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-500">No archived requests yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {archivedBankRequests.map(request => (
                        <div key={request.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isArchivedRequestSelected(request.id)}
                              onChange={() => toggleArchivedRequestSelection(request.id)}
                              className="rounded border-slate-700 bg-slate-950 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-200">{request.item_name || 'Bank request'}</div>
                              <div className="text-xs text-slate-500">{request.player_name || 'Unknown player'} • {request.status || 'unknown'}</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRestoreArchivedBankRequests([request.id])}
                            className="rounded-lg border border-emerald-700/40 bg-emerald-900/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400 transition hover:bg-emerald-900/40"
                          >
                            Restore
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">Contents History</h3>
                      <p className="text-sm text-slate-400">Recent bank inventory snapshots are kept here so the guild can compare previous vault states.</p>
                    </div>
                    <button type="button" onClick={exportBankContentsHistoryCsv} className="rounded-lg border border-cyan-700/40 bg-cyan-900/20 px-3 py-2 text-xs font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-900/40">Export Contents CSV</button>
                  </div>
                  {bankContentsHistory.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-500">No saved contents snapshots yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {bankContentsHistory.map(snapshot => (
                        <div key={snapshot.id} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-semibold text-slate-200">{snapshot.itemCount || 0} items</div>
                            <div className="text-[11px] text-slate-500">{new Date(snapshot.timestamp).toLocaleString()}</div>
                          </div>
                          {snapshot.gold !== null && snapshot.gold !== undefined && (
                            <div className="mt-1 text-xs text-amber-400">Gold: {snapshot.gold}g</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================
      TAB: RAID ASSIGNMENTS (PUBLIC, EDIT GATED)
      ========================================= */}
        {activeTab === 'raidAssignments' && (
          <div className="space-y-4">
            {raidAssignmentsSubTab === 'overview' && (
              <RaidAssignmentsTab
                isAuthenticated={isAuthenticated}
                roster={roster}
                getSpecById={getSpecById}
                enabledBosses={enabledBosses}
                raidZones={raidZones}
                handleToggleZone={handleToggleZone}
                handleToggleBoss={handleToggleBoss}
                customRaidGroups={customRaidGroups}
                handleAddCustomRaidBoss={handleAddCustomRaidBoss}
                handleRemoveCustomRaidBoss={handleRemoveCustomRaidBoss}
                raidAssignmentData={raidAssignmentData}
                setRaidAssignmentData={setRaidAssignmentData}
                hasUnsavedChanges={raidAssignmentDataDirty || enabledBossesDirty}
                onSaveChanges={handleSaveRaidAssignmentsChanges}
                isSaving={isSavingRaidAssignments}
                myPlayerName={selectedMyPlayerName}
                actorBattleTag={bnetAuthState.user?.battletag || ''}
                onCopyToArchive={handleCopyRaidAssignmentsToArchive}
              />
            )}
            {raidAssignmentsSubTab === 'history' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-100">Raid Assignment History</h3>
                <p className="text-sm text-slate-400">Saved assignment snapshots remain visible here so officers can review the latest raid planning state.</p>
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
                  {Object.keys(raidAssignmentData || {}).length === 0 ? 'No saved assignment data yet.' : `The current assignment data contains ${Object.keys(raidAssignmentData).length} tracked section${Object.keys(raidAssignmentData).length === 1 ? '' : 's'}.`}
                </div>
                {raidAssignmentArchives.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-500">No archived assignment snapshots yet.</div>
                ) : (
                  <div className="space-y-2">
                    {raidAssignmentArchives.map(entry => (
                      <div key={entry.id} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-slate-200">{entry.boss || 'Active bosses'}</div>
                            <div className="text-[11px] text-slate-500">{entry.bossCount || entry.selectedBosses?.length || 0} boss snapshot</div>
                          </div>
                          <div className="text-[11px] text-slate-500">{new Date(entry.timestamp).toLocaleString()}</div>
                        </div>
                        {entry.actorBattleTag && <div className="mt-1 text-xs text-amber-400">By {entry.actorBattleTag}</div>}
                        {Array.isArray(entry.selectedBosses) && entry.selectedBosses.length > 0 && (
                          <div className="mt-2 text-xs text-slate-400 break-words">{entry.selectedBosses.join(', ')}</div>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={() => handleViewRaidAssignmentArchive(entry)} className="rounded-lg border border-cyan-700/40 bg-cyan-900/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-900/40">View</button>
                          <button type="button" onClick={() => handleRestoreRaidAssignmentArchive(entry)} className="rounded-lg border border-emerald-700/40 bg-emerald-900/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-900/40">Restore to Live</button>
                        </div>
                        {selectedRaidAssignmentArchiveId === entry.id && (
                          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">Archive Preview</h4>
                              <span className="text-[11px] text-slate-500">{entry.boss || 'All selected bosses'}</span>
                            </div>
                            {Array.isArray(entry.selectedBosses) && entry.selectedBosses.length > 1 && (
                              <div className="space-y-2">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Restore Bosses</div>
                                <div className="flex flex-wrap gap-2">
                                  {entry.selectedBosses.map(bossName => {
                                    const isSelected = selectedRaidRestoreBosses.includes(bossName);
                                    return (
                                      <label key={`${entry.id}-${bossName}`} className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${isSelected ? 'border-emerald-600/40 bg-emerald-900/20 text-emerald-300' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>
                                        <input type="checkbox" checked={isSelected} onChange={() => handleToggleRaidRestoreBoss(bossName)} className="rounded border-slate-600 bg-slate-950" />
                                        {bossName}
                                      </label>
                                    );
                                  })}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button type="button" onClick={() => setSelectedRaidRestoreBosses(entry.selectedBosses)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">Select All</button>
                                  <button type="button" onClick={() => setSelectedRaidRestoreBosses([])} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">Clear</button>
                                  <button type="button" onClick={() => handleRestoreRaidAssignmentArchive(entry, selectedRaidRestoreBosses)} className="rounded-lg border border-emerald-700/40 bg-emerald-900/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-900/40">Restore Selected</button>
                                </div>
                              </div>
                            )}
                            <pre className="max-h-80 overflow-auto rounded-lg border border-slate-800 bg-slate-900 p-3 text-[11px] leading-5 text-slate-300 whitespace-pre-wrap">
                              {JSON.stringify(entry.payload, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'raidSignups' && (
          <RaidSignupsTab
            fetchData={fetchData}
            putData={putData}
            postData={postData}
            deleteData={deleteData}
            isAuthenticated={isAuthenticated}
            specsFromDb={specsFromDb}
            activeSection={raidSignupsSubTab}
            onSectionChange={setRaidSignupsSubTab}
          />
        )}

        {/* =========================================
      TAB: BANK REQUESTS (AUTH-GATED)
      ========================================= */}
        {activeTab === 'bankRequests' && isAuthenticated && (
          <BankRequestsTab
            bankRequests={visibleBankRequests}
            roster={roster}
            specsByName={specsByName}
            getDisplayFromId={getDisplayFromId}
            respondingRequestId={respondingRequestId}
            setRespondingRequestId={setRespondingRequestId}
            approveQuantity={approveQuantity}
            setApproveQuantity={setApproveQuantity}
            approvePrice={approvePrice}
            setApprovePrice={setApprovePrice}
            approveNote={approveNote}
            setApproveNote={setApproveNote}
            denyReason={denyReason}
            setDenyReason={setDenyReason}
            denyCustomReason={denyCustomReason}
            setDenyCustomReason={setDenyCustomReason}
            handleResolveBankRequest={handleResolveBankRequest}
            handleBulkResolveBankRequests={handleBulkResolveBankRequests}
            archivedBankRequests={archivedBankRequests}
            onArchiveBankRequests={handleArchiveBankRequests}
            onRestoreArchivedBankRequests={handleRestoreArchivedBankRequests}
          />
        )}

        {/* =========================================
              TAB: LOOT COUNCIL ASSIGNMENT
              ========================================= */}
        {activeTab === 'loot' && isAuthenticated && (
          <div className="space-y-4">
            {lootSubTab === 'assignment' && (
              <LootCouncilTab
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterZone={filterZone}
                setFilterZone={setFilterZone}
                uniqueZones={uniqueZones}
                filterBoss={filterBoss}
                setFilterBoss={setFilterBoss}
                uniqueBosses={uniqueBosses}
                filterSlot={filterSlot}
                setFilterSlot={setFilterSlot}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                uniqueSlots={uniqueSlots}
                selectedItemName={selectedItemName}
                setSelectedItemName={setSelectedItemName}
                filteredItems={filteredItems}
                selectedItem={selectedItem}
                sortedEligiblePlayers={sortedEligiblePlayers}
                getDisplayFromId={getDisplayFromId}
                getSlugFromDisplay={getSlugFromDisplay}
                bisPriorities={bisPriorities}
                globalPhase={globalPhase}
                assignments={assignments}
                mutableItems={mutableItems}
                getPlayerItemPriorityStatus={getPlayerItemPriorityStatus}
                getSpecById={getSpecById}
                getRankBadgeStyle={getRankBadgeStyle}
                renderItemLink={renderItemLink}
                handleSetPriority={handleSetPriority}
                PlayerNameWithScore={PlayerNameWithScore}
                hasUnsavedChanges={assignmentsDirty}
                onSaveChanges={handleSaveLootCouncilChanges}
                onClearItemAssignments={handleClearOverviewItemPriorities}
                onToggleAwardedPriority={handleToggleAwardedPriority}
                isSaving={isSavingLootCouncil}
              />
            )}
            {lootSubTab === 'scoring' && (
              <ScoringTab
                scoringConfig={scoringConfig}
                setScoringConfig={setScoringConfig}
                roster={roster}
                playerStats={playerStats}
                expandedPlayerId={expandedPlayerId}
                setExpandedPlayerId={setExpandedPlayerId}
                getSpecById={getSpecById}
                getDisplayFromId={getDisplayFromId}
                calculateAttendance={calculateAttendance}
                updatePlayerStat={updatePlayerStat}
                updatePlayerParse={updatePlayerParse}
                updatePlayerManualAdjustment={updatePlayerManualAdjustment}
                PlayerNameWithScore={PlayerNameWithScore}
                hasUnsavedChanges={scoringConfigDirty || playerStatsDirty}
                onSaveChanges={handleSaveScoringChanges}
                isSaving={isSavingScoring}
              />
            )}
            {lootSubTab === 'assigned' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-100">Assigned Loot Overview</h3>
                <p className="text-sm text-slate-400">The current loot council priorities are grouped here for a quick review.</p>
                {Object.entries(assignments || {}).filter(([itemName, playerMap]) => {
                  const rankedEntries = Object.entries(playerMap || {}).filter(([key]) => !['awardedPlayerIds', 'awardedPlayerId', 'assignedAt'].includes(key));
                  return rankedEntries.length > 0 || normalizeAwardedPlayerIds(playerMap).length > 0;
                }).length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-500">No gear assignments yet.</div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(assignments).filter(([itemName, playerMap]) => {
                      const rankedEntries = Object.entries(playerMap || {}).filter(([key]) => !['awardedPlayerIds', 'awardedPlayerId', 'assignedAt'].includes(key));
                      return rankedEntries.length > 0 || normalizeAwardedPlayerIds(playerMap).length > 0;
                    }).slice(0, 12).map(([itemName, playerMap]) => {
                      const rankedEntries = Object.entries(playerMap || {}).filter(([key]) => !['awardedPlayerIds', 'awardedPlayerId', 'assignedAt'].includes(key));
                      const awardedPlayerIds = normalizeAwardedPlayerIds(playerMap);
                      const assignedAt = playerMap?.assignedAt;
                      const itemRecord = mutableItems.find(item => item.name === itemName) || { name: itemName };
                      return (
                        <div key={itemName} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                          <div className="text-sm font-semibold text-slate-200">{renderItemLink(itemRecord)}</div>
                          {assignedAt && (
                            <div className="mt-1 text-[11px] text-slate-500">Updated {new Date(assignedAt).toLocaleString()}</div>
                          )}
                          {awardedPlayerIds.length > 0 && (
                            <div className="mt-1 text-xs text-amber-400">Awarded to {awardedPlayerIds.map(id => roster.find(p => String(p.id) === String(id))?.name || id).join(', ')}</div>
                          )}
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                            {rankedEntries.map(([playerId, rank]) => (
                              <span key={`${itemName}-${playerId}`} className="rounded-full border border-slate-700 px-2 py-1">{roster.find(p => String(p.id) === String(playerId))?.name || playerId}: {rank}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================================
              TAB: ROSTER & ATTENDANCE
              ========================================= */}
        {activeTab === 'roster' && isAuthenticated && (
          <RosterTab
            fetchData={fetchData}
            handleSaveRaidLog={handleSaveRaidLog}
            handleApplyRaidSignupGroupsToAttendance={handleApplyRaidSignupGroupsToAttendance}
            handleImportRaidHelperJson={handleImportRaidHelperJson}
            newRaidDate={newRaidDate}
            setNewRaidDate={setNewRaidDate}
            newRaidZone={newRaidZone}
            setNewRaidZone={setNewRaidZone}
            raidLogs={raidLogs}
            handleDeleteRaidLog={handleDeleteRaidLog}
            handleAddPlayer={handleAddPlayer}
            newName={newName}
            setNewName={setNewName}
            newSpec={newSpec}
            setNewSpec={setNewSpec}
            specsFromDb={specsFromDb}
            setAllRaidStatus={setAllRaidStatus}
            roster={roster}
            getSpecById={getSpecById}
            toggleRaidStatus={toggleRaidStatus}
            handleUpdatePlayer={handleUpdatePlayer}
            handleRemovePlayer={handleRemovePlayer}
            importedRaidHelperPlayerIds={recentRaidHelperImportedIds}
            importedRaidHelperSpecConflictIds={recentRaidHelperSpecConflictIds}
            raidHelperImportSession={raidHelperImportSession}
            onUpdateRaidHelperImportEntry={handleUpdateRaidHelperImportEntry}
            onApplyRaidHelperImport={handleApplyRaidHelperImport}
            onCancelRaidHelperImport={handleCancelRaidHelperImport}
            specsByName={specsByName}
            PlayerNameWithScore={PlayerNameWithScore}
            hasUnsavedChanges={rosterDirty || raidLogsDirty || playerStatsDirty}
            onSaveChanges={handleSaveRosterAttendanceChanges}
            isSaving={isSavingRosterAttendance}
          />
        )}

        {activeTab === 'officerRoles' && isAuthenticated && (
          <div className="space-y-4">
            {adminSubTab === 'officerRoles' && (
              <OfficerRolesTab
                roster={roster}
                getSpecById={getSpecById}
                officerRoles={officerRoles}
                setOfficerRoles={setOfficerRolesData}
                myPlayerId={globalMyPlayerId}
                hasUnsavedChanges={officerRolesDirty}
                onSaveChanges={handleSaveOfficerRoles}
                isSaving={isSavingOfficerRoles}
              />
            )}
            {adminSubTab === 'config' && (
              <DiscordBotConfigTab
                config={discordBotConfig}
                setConfig={setDiscordBotConfig}
                hasUnsavedChanges={discordBotConfigDirty || scoringConfigDirty}
                onSaveChanges={handleSaveDiscordBotConfig}
                isSaving={isSavingDiscordBotConfig}
                claims={rosterClaims}
                onUnclaimClaim={handleUnclaimClaim}
                roster={roster}
                specsByName={specsByName}
                getDisplayFromId={getDisplayFromId}
                scoringConfig={scoringConfig}
                setScoringConfig={setScoringConfig}
              />
            )}
            {adminSubTab === 'itemsdb' && (
              <ItemsDatabaseTab
                dbNewName={dbNewName}
                setDbNewName={setDbNewName}
                dbNewSlot={dbNewSlot}
                setDbNewSlot={setDbNewSlot}
                dbNewZone={dbNewZone}
                setDbNewZone={setDbNewZone}
                dbNewBoss={dbNewBoss}
                setDbNewBoss={setDbNewBoss}
                dbNewItemId={dbNewItemId}
                setDbNewItemId={setDbNewItemId}
                handleAddItemToDb={handleAddItemToDb}
                dbSearch={dbSearch}
                setDbSearch={setDbSearch}
                showMissingWowheadFilter={showMissingWowheadFilter}
                setShowMissingWowheadFilter={setShowMissingWowheadFilter}
                showWowheadNameMismatchFilter={showWowheadNameMismatchFilter}
                setShowWowheadNameMismatchFilter={setShowWowheadNameMismatchFilter}
                dbFilteredItems={dbFilteredItems}
                specsSortedByClass={specsSortedByClass}
                dbBisPriorities={dbBisPriorities}
                handleUpdateItemEligibility={handleUpdateItemEligibility}
                handleUpdateItemId={handleUpdateItemId}
                handleDeleteItemFromDb={handleDeleteItemFromDb}
                renderItemLink={renderItemLink}
                masterItemsDbPhase={masterItemsDbPhase}
                setMasterItemsDbPhase={setMasterItemsDbPhase}
                hasUnsavedChanges={dbBisPrioritiesDirty || mutableItemsDirty}
                onSaveChanges={handleSaveItemsDbChanges}
                isSaving={isSavingItemsDb}
              />
            )}
            {adminSubTab === 'todo' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">Officer To-do List</h3>
                    <p className="text-sm text-slate-400">A lightweight planning area for the next raid week and guild upkeep.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => setTodoFilterMine(prev => !prev)} className={`rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-wider transition ${todoFilterMine ? 'border-amber-600 bg-amber-900/30 text-amber-400' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>
                      {todoFilterMine ? 'Showing Mine' : 'Filter to Mine'}
                    </button>
                    <button type="button" onClick={handleAddTodoItem} className="rounded-lg border border-amber-700/40 bg-amber-900/20 px-3 py-2 text-xs font-bold uppercase tracking-wider text-amber-400 transition hover:bg-amber-900/40">Add Item</button>
                    <button type="button" onClick={handleSaveTodoItems} disabled={!todoDirty} className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition ${todoDirty ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>Save Changes</button>
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
                  <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_180px_160px_96px] gap-3 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    <span>Task</span>
                    <span>Owner</span>
                    <span>Status</span>
                    <span>Action</span>
                  </div>
                  {todoDraftItems.filter(item => !todoFilterMine || String(item.owner || '').trim() === String(selectedMyPlayerName || '')).length === 0 ? (
                    <div className="rounded border border-dashed border-slate-800 px-3 py-4 text-center text-slate-500">No to-do items yet.</div>
                  ) : (
                    todoDraftItems.filter(item => !todoFilterMine || String(item.owner || '').trim() === String(selectedMyPlayerName || '')).map(item => (
                      <div key={item.id} className="rounded border border-slate-800 bg-slate-950/80 p-3 space-y-2">
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_160px_96px] md:items-start">
                          <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1 md:hidden">Task</label>
                            <input type="text" value={item.item} onChange={e => handleUpdateTodoItem(item.id, 'item', e.target.value)} placeholder="Task" className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1 md:hidden">Owner</label>
                            <select value={item.owner || ''} onChange={e => handleUpdateTodoItem(item.id, 'owner', e.target.value)} className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white">
                            <option value="">Unassigned</option>
                            {[...new Set([selectedMyPlayerName, ...roster.map(player => player.name)].filter(Boolean))].filter(Boolean).sort().map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1 md:hidden">Status</label>
                            <select value={item.status || 'Open'} onChange={e => handleUpdateTodoItem(item.id, 'status', e.target.value)} className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white">
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Done">Done</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1 md:hidden">Action</label>
                            <button type="button" onClick={() => handleRemoveTodoItem(item.id)} className="w-full rounded border border-red-800/40 px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-red-400">Remove</button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Comments</label>
                          <textarea value={item.comments || ''} onChange={e => handleUpdateTodoItem(item.id, 'comments', e.target.value)} placeholder="Comments" rows={3} className="w-full min-h-[88px] rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'discordBotConfig' && isAuthenticated && (
          <DiscordBotConfigTab
            config={discordBotConfig}
            setConfig={setDiscordBotConfig}
            hasUnsavedChanges={discordBotConfigDirty || scoringConfigDirty}
            onSaveChanges={handleSaveDiscordBotConfig}
            isSaving={isSavingDiscordBotConfig}
            claims={rosterClaims}
            onUnclaimClaim={handleUnclaimClaim}
            roster={roster}
            specsByName={specsByName}
            getDisplayFromId={getDisplayFromId}
            scoringConfig={scoringConfig}
            setScoringConfig={setScoringConfig}
          />
        )}

        {/* =========================================
              TAB: SCORING & CONFIG
              ========================================= */}
        {activeTab === 'scoring' && isAuthenticated && (
          <ScoringTab
            scoringConfig={scoringConfig}
            setScoringConfig={setScoringConfig}
            roster={roster}
            playerStats={playerStats}
            expandedPlayerId={expandedPlayerId}
            setExpandedPlayerId={setExpandedPlayerId}
            getSpecById={getSpecById}
            getDisplayFromId={getDisplayFromId}
            calculateAttendance={calculateAttendance}
            updatePlayerStat={updatePlayerStat}
            updatePlayerParse={updatePlayerParse}
            updatePlayerManualAdjustment={updatePlayerManualAdjustment}
            PlayerNameWithScore={PlayerNameWithScore}
            hasUnsavedChanges={scoringConfigDirty || playerStatsDirty}
            onSaveChanges={handleSaveScoringChanges}
            isSaving={isSavingScoring}
          />
        )}

        {/* =========================================
              TAB: BiS & ALTERNATIVES (CHARACTER SHEET)
              ========================================= */}
        {activeTab === 'bis' && (
          <div className="space-y-4">
            {resourcesSubTab === 'bis' && (
              <BisConfigTab
                selectedBisSpec={selectedBisSpec}
                setSelectedBisSpec={setSelectedBisSpec}
                masterItemsDbPhase={masterItemsDbPhase}
                setMasterItemsDbPhase={setMasterItemsDbPhase}
                specsFromDb={specsFromDb}
                renderItemSlot={renderItemSlot}
                specsByName={specsByName}
              />
            )}
            {resourcesSubTab === 'tactics' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-100">Raid Tactics</h3>
                <p className="text-sm text-slate-400">Quick reminders for the upcoming raid plan, boss mechanics, and role-specific priorities.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-800 bg-slate-900 p-4"><div className="text-sm font-semibold text-amber-400">Tank/healer calls</div><div className="mt-2 text-sm text-slate-400">Use the raid assignment view to confirm who is covering each role and where to position them.</div></div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900 p-4"><div className="text-sm font-semibold text-amber-400">Encounter prep</div><div className="mt-2 text-sm text-slate-400">Review the latest signup events and group config before the pull so everyone knows their lane.</div></div>
                </div>
              </div>
            )}
            {resourcesSubTab === 'weakauras' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-100">Weakauras</h3>
                <p className="text-sm text-slate-400">A place to keep the relevant aura packs, alert setups, and role-specific reminders handy.</p>
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">Add links and notes here when your raid team wants a shared aura library for each encounter.</div>
              </div>
            )}
            {resourcesSubTab === 'cheatsheets' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-100">Cheat Sheets</h3>
                <p className="text-sm text-slate-400">These quick-reference cards are kept alongside the BiS planner for fast raid prep.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-800 bg-slate-900 p-4"><div className="text-sm font-semibold text-amber-400">Raid prep</div><div className="mt-2 text-sm text-slate-400">Check open signup events, verify roster attendance, and use the active phase planner before each raid.</div></div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900 p-4"><div className="text-sm font-semibold text-amber-400">Bank workflow</div><div className="mt-2 text-sm text-slate-400">Use the main bank tab for browsing the vault, then switch to Requests or Update to manage officer workflows.</div></div>
                </div>
              </div>
            )}
            {resourcesSubTab === 'instructions' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-100">Site Instructions</h3>
                <p className="text-sm text-slate-400">A quick guide for how to use the dashboard sections, from bank uploads to raid signup publishing.</p>
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400 break-words">Start in the bank contents page, move to requests when you are reviewing approvals, then use raid signups and assignments for operation prep.</div>
              </div>
            )}
            {resourcesSubTab === 'raidlogs' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-100">Raid Logs</h3>
                <p className="text-sm text-slate-400">Links and notes for the most recent raid logs, parses, and attendance reviews.</p>
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">Use the roster and scoring pages to review attendance and compare recent raid performance.</div>
              </div>
            )}
            {resourcesSubTab === 'wowaudit' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-100">WoWAudit</h3>
                <p className="text-sm text-slate-400">Keep a short list of important WoWAudit links, profiles, or notes for known raid goals and progress.</p>
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">Add the relevant audit links here whenever you want them close at hand during planning.</div>
              </div>
            )}
            {resourcesSubTab === 'wipefest' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-100">Wipefest</h3>
                <p className="text-sm text-slate-400">Store the latest wipefest links or notes for encounter discussion and post-raid review.</p>
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">Link the relevant threads or summaries so they are available during the next planning session.</div>
              </div>
            )}
          </div>
        )}

        {/* =========================================
              TAB: MASTER ITEMS DATABASE EDITING TABLE
              ========================================= */}
        {activeTab === 'itemsdb' && isAuthenticated && (
          <ItemsDatabaseTab
            dbNewName={dbNewName}
            setDbNewName={setDbNewName}
            dbNewSlot={dbNewSlot}
            setDbNewSlot={setDbNewSlot}
            dbNewZone={dbNewZone}
            setDbNewZone={setDbNewZone}
            dbNewBoss={dbNewBoss}
            setDbNewBoss={setDbNewBoss}
            dbNewItemId={dbNewItemId}
            setDbNewItemId={setDbNewItemId}
            handleAddItemToDb={handleAddItemToDb}
            dbSearch={dbSearch}
            setDbSearch={setDbSearch}
            showMissingWowheadFilter={showMissingWowheadFilter}
            setShowMissingWowheadFilter={setShowMissingWowheadFilter}
            showWowheadNameMismatchFilter={showWowheadNameMismatchFilter}
            setShowWowheadNameMismatchFilter={setShowWowheadNameMismatchFilter}
            dbFilteredItems={dbFilteredItems}
            specsSortedByClass={specsSortedByClass}
            dbBisPriorities={dbBisPriorities}
            handleUpdateItemEligibility={handleUpdateItemEligibility}
            handleUpdateItemId={handleUpdateItemId}
            handleDeleteItemFromDb={handleDeleteItemFromDb}
            renderItemLink={renderItemLink}
            masterItemsDbPhase={masterItemsDbPhase}
            setMasterItemsDbPhase={setMasterItemsDbPhase}
            hasUnsavedChanges={dbBisPrioritiesDirty || mutableItemsDirty}
            onSaveChanges={handleSaveItemsDbChanges}
            isSaving={isSavingItemsDb}
          />
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

        {itemIdEditor && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-slate-100 mb-2">Edit Wowhead ID</h3>
              <p className="text-xs text-slate-500 mb-4">{itemIdEditor.itemName}</p>

              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Wowhead Item ID</label>
              <input
                type="text"
                value={itemIdEditor.wowheadIdInput}
                onChange={e => setItemIdEditor(prev => ({ ...prev, wowheadIdInput: e.target.value }))}
                placeholder="e.g. 32505"
                className="w-full bg-slate-950 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
              />

              <div className="flex gap-2 mt-5 justify-end">
                <button
                  type="button"
                  onClick={() => setItemIdEditor(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveItemIdFromModal}
                  className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2 px-4 rounded"
                >
                  Save ID
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}