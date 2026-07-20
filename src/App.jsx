import React, { useState, useMemo, useEffect } from 'react';
import { PHASES, PHASE_JSON_KEYS, LEFT_SLOTS, RIGHT_SLOTS, BOTTOM_SLOTS, P2_BOSSES, CATEGORY_MAP, RAID_ZONES } from './constants';
import { fetchData, putData, postData, deleteData, login } from './services/apiService';
import { useItemsDatabase } from './hooks/useItemsDatabase';
import OverviewTab from './components/OverviewTab';
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

  // Global phase selector (controls which phase's assignments are shown)
  const [globalPhase, setGlobalPhase] = useState('T5');

  // Default to public overview tab
  const AUTH_ONLY_TABS = ['bankRequests', 'loot', 'roster', 'scoring', 'itemsdb', 'officerRoles', 'discordBotConfig'];
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('active-tab') || 'overview');
  const [overviewSearch, setOverviewSearch] = useState('');

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

  // Persist current tab so refresh restores where the user left off.
  useEffect(() => {
    localStorage.setItem('active-tab', activeTab);
  }, [activeTab]);

  // If a saved tab requires auth and the session is locked, fall back safely.
  useEffect(() => {
    if (!isAuthenticated && AUTH_ONLY_TABS.includes(activeTab)) {
      setActiveTab('overview');
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
  const hasAnyUnsavedChanges = hasLootUnsavedChanges || hasItemsDbUnsavedChanges || hasRosterUnsavedChanges || hasScoringUnsavedChanges || hasRaidAssignmentsUnsavedChanges || officerRolesDirty || discordBotConfigDirty;

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

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('ar-auth');
    sessionStorage.removeItem('ar-auth-token');
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
  const handleSetPriority = (playerId, priority) => {
    setAssignments({ ...assignments, [selectedItemName]: { ...(assignments[selectedItemName] || {}), [playerId]: priority } });
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

  const handleSaveLootCouncilChanges = async () => {
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
      alert('Loot council assignments saved.');
    } catch (e) {
      alert('Failed to save loot council assignments.');
    } finally {
      setIsSavingLootCouncil(false);
    }
  };

  const handleSaveRosterAttendanceChanges = async () => {
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
      alert('Roster and attendance changes saved.');
    } catch (e) {
      alert('Failed to save roster/attendance changes.');
    } finally {
      setIsSavingRosterAttendance(false);
    }
  };

  const handleSaveScoringChanges = async () => {
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
      alert('Scoring configuration saved.');
    } catch (e) {
      alert('Failed to save scoring changes.');
    } finally {
      setIsSavingScoring(false);
    }
  };

  const handleSaveOfficerRoles = async () => {
    if (!officerRolesDirty) return;
    setIsSavingOfficerRoles(true);
    try {
      await putData('officer-roles', officerRoles);
      setOfficerRolesDirty(false);
      alert('Officer roles saved.');
    } catch (e) {
      alert('Failed to save officer roles.');
    } finally {
      setIsSavingOfficerRoles(false);
    }
  };

  const handleSaveDiscordBotConfig = async () => {
    if (!discordBotConfigDirty) return;
    setIsSavingDiscordBotConfig(true);
    try {
      await putData('discord-bot-config', discordBotConfig);
      setDiscordBotConfigDirty(false);
      alert('Discord bot config saved.');
    } catch (e) {
      alert('Failed to save Discord bot config.');
    } finally {
      setIsSavingDiscordBotConfig(false);
    }
  };

  const handleSaveRaidAssignmentsChanges = async () => {
    if (!raidAssignmentDataDirty && !enabledBossesDirty) return;
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
      alert('Raid assignments saved.');
    } catch (e) {
      alert('Failed to save raid assignments.');
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

  const handleSaveBankUpload = async () => {
    if (!bankUploadParsed) return;
    setBankUploadStatus('Uploading...');
    try {
      const data = await putData('bank-items', bankUploadParsed);
      setBankUploadStatus(`✅ Bank updated with ${data.count} items! Discord notified.`);
      setBankUploadParsed(null);
      const items = await fetchData('bank-items');
      setBankItems(items);
    } catch (e) {
      setBankUploadStatus('❌ Error uploading.');
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

  const dbFilteredItems = useMemo(() => {
    let items = mutableItems.filter(item => item && item.name && item.name.toLowerCase().includes(dbSearch.toLowerCase()));
    if (showMissingWowheadFilter) {
      items = items.filter(item => !item.itemId || String(item.itemId).trim() === '');
    }
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [mutableItems, dbSearch, showMissingWowheadFilter]);

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
    const assignedIds = Object.keys(assignedMap).map(id => Number(id));

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

      if (selectedItem.is_token && tokenClasses.length > 0 && !tokenClasses.includes(className)) {
        // still include if player is explicitly assigned
        return assignedIds.includes(Number(player.id));
      }

      const bisStatus = getPlayerItemPriorityStatus(selectedItem, specDisplay);
      return (bisStatus && bisStatus !== '') || assignedIds.includes(Number(player.id));
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
    const dataSlot = slot === "Ring 1" || slot === "Ring 2" ? "ring"
      : slot === "Trinket 1" || slot === "Trinket 2" ? "trinket"
        : slot.toLowerCase();
    const slotIndex = slot === "Ring 2" || slot === "Trinket 2" ? 1 : 0;
    const isDualSlot = slot.endsWith(" 1") || slot.endsWith(" 2");

    const itemsInSlot = mutableItems.filter(i =>
      i.slot && i.slot.toLowerCase() === dataSlot
    );

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

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 tracking-tight font-serif italic drop-shadow-sm">
              &lt;Guild Name TBC&gt;
            </h1>
            <p className="text-slate-400 mt-2 font-medium uppercase tracking-widest text-sm flex items-center gap-2">
              TBC Priority Assignment Dashboard
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30 font-bold shadow-inner">CLOUD SYNC LIVE</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {roster.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-lg min-h-[44px]">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">My Character:</span>
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
                  className="bg-slate-950 text-amber-400 font-bold border border-slate-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="">— Select Character —</option>
                  {roster.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}

            {isAuthenticated && (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Current Phase:</span>
                <select
                  value={globalPhase}
                  onChange={e => setGlobalPhase(e.target.value)}
                  className="bg-slate-950 text-amber-400 font-bold border border-slate-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  {PHASES.map(phase => <option key={phase} value={phase}>{phase}</option>)}
                </select>
              </div>
            )}
            {isAuthenticated ? (
              <button onClick={handleLogout} className="text-xs font-bold text-slate-500 hover:text-red-400 transition uppercase tracking-widest shrink-0">
                Lock App (Log Out)
              </button>
            ) : (
              <form onSubmit={handleLogin} className="flex gap-2 items-center bg-slate-900 border border-slate-800 p-2 rounded-lg shadow-inner min-h-[44px]">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="bg-slate-950 text-white border border-slate-700 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 tracking-widest w-40"
                  placeholder="Officer Password"
                />
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-3 rounded transition shadow-lg tracking-wider uppercase text-[10px]">
                  Unlock
                </button>
              </form>
            )}
          </div>
        </header>

        {/* --- NAVIGATION TABS --- */}
        <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-px custom-scrollbar">
          <button onClick={() => setActiveTab('overview')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'overview' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>Priority Overview</button>
          <button onClick={() => setActiveTab('bis')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'bis' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>BiS Config</button>
          <button onClick={() => setActiveTab('bank')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'bank' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>Guild Bank</button>
          <button onClick={() => setActiveTab('raidAssignments')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'raidAssignments' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>
            <span className="inline-flex items-center gap-2">
              <span>Raid Assignments</span>
              {hasRaidAssignmentsUnsavedChanges && <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded px-1.5 py-0.5 text-[9px] leading-none">Unsaved</span>}
            </span>
          </button>
          <button onClick={() => setActiveTab('raidSignups')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'raidSignups' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>Raid Signups</button>
          {/* Lock down all editing tabs behind authentication */}
          {isAuthenticated && (
            <>
              <button onClick={() => setActiveTab('bankRequests')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'bankRequests' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>Bank Requests</button>
              <button onClick={() => setActiveTab('loot')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'loot' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>
                <span className="inline-flex items-center gap-2">
                  <span>Loot Council</span>
                  {hasLootUnsavedChanges && <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded px-1.5 py-0.5 text-[9px] leading-none">Unsaved</span>}
                </span>
              </button>
              <button onClick={() => setActiveTab('roster')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'roster' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>
                <span className="inline-flex items-center gap-2">
                  <span>Roster & Attendance</span>
                  {hasRosterUnsavedChanges && <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded px-1.5 py-0.5 text-[9px] leading-none">Unsaved</span>}
                </span>
              </button>
              <button onClick={() => setActiveTab('scoring')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'scoring' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>
                <span className="inline-flex items-center gap-2">
                  <span>Scoring & Config</span>
                  {hasScoringUnsavedChanges && <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded px-1.5 py-0.5 text-[9px] leading-none">Unsaved</span>}
                </span>
              </button>
              <button onClick={() => setActiveTab('itemsdb')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'itemsdb' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>
                <span className="inline-flex items-center gap-2">
                  <span>Master Items DB</span>
                  {hasItemsDbUnsavedChanges && <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded px-1.5 py-0.5 text-[9px] leading-none">Unsaved</span>}
                </span>
              </button>
              <button onClick={() => setActiveTab('officerRoles')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'officerRoles' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>
                <span className="inline-flex items-center gap-2">
                  <span>Officer Roles</span>
                  {officerRolesDirty && <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded px-1.5 py-0.5 text-[9px] leading-none">Unsaved</span>}
                </span>
              </button>
              <button onClick={() => setActiveTab('discordBotConfig')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'discordBotConfig' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>
                <span className="inline-flex items-center gap-2">
                  <span>Discord Bot Config</span>
                  {discordBotConfigDirty && <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded px-1.5 py-0.5 text-[9px] leading-none">Unsaved</span>}
                </span>
              </button>
            </>
          )}
        </div>

        {/* =========================================
              TAB: PRIORITY OVERVIEW (MASTER LEDGER - PUBLIC)
              ========================================= */}
        {activeTab === 'overview' && (
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
          <GuildBankTab
            bankItems={bankItems}
            bankSearch={bankSearch}
            setBankSearch={setBankSearch}
            isAuthenticated={isAuthenticated}
            roster={roster}
            myPlayerId={globalMyPlayerId ? parseInt(globalMyPlayerId) : null}
          />
        )}

        {/* =========================================
      TAB: RAID ASSIGNMENTS (PUBLIC, EDIT GATED)
      ========================================= */}
        {activeTab === 'raidAssignments' && (
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
          />
        )}

        {activeTab === 'raidSignups' && (
          <RaidSignupsTab
            fetchData={fetchData}
            putData={putData}
            postData={postData}
            deleteData={deleteData}
            isAuthenticated={isAuthenticated}
            specsFromDb={specsFromDb}
          />
        )}

        {/* =========================================
      TAB: BANK REQUESTS (AUTH-GATED)
      ========================================= */}
        {activeTab === 'bankRequests' && isAuthenticated && (
          <BankRequestsTab
            bankRequests={bankRequests}
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
            handleBankFileUpload={handleBankFileUpload}
            setBankUploadParsed={setBankUploadParsed}
            bankUploadParsed={bankUploadParsed}
            handleSaveBankUpload={handleSaveBankUpload}
            bankUploadStatus={bankUploadStatus}
          />
        )}

        {/* =========================================
              TAB: LOOT COUNCIL ASSIGNMENT
              ========================================= */}
        {activeTab === 'loot' && isAuthenticated && (
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
            isSaving={isSavingLootCouncil}
          />
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

        {activeTab === 'discordBotConfig' && isAuthenticated && (
          <DiscordBotConfigTab
            config={discordBotConfig}
            setConfig={setDiscordBotConfig}
            hasUnsavedChanges={discordBotConfigDirty}
            onSaveChanges={handleSaveDiscordBotConfig}
            isSaving={isSavingDiscordBotConfig}
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