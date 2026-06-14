  import React, { useState, useMemo, useEffect } from 'react';
  import { PHASES, PHASE_JSON_KEYS, SPECS, CLASS_COLORS, LEFT_SLOTS, RIGHT_SLOTS, BOTTOM_SLOTS, P2_BOSSES, CATEGORY_MAP } from './constants';
  import { fetchData, putData } from './services/apiService';
  import OverviewTab from './components/OverviewTab';
  import GuildBankTab from './components/GuildBankTab';
  import BisConfigTab from './components/BisConfigTab';
  import ItemsDatabaseTab from './components/ItemsDatabaseTab';
  import BankRequestsTab from './components/BankRequestsTab';
  import LootCouncilTab from './components/LootCouncilTab';
  import RosterTab from './components/RosterTab';
  import ScoringTab from './components/ScoringTab';

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

    const specsBySlug = useMemo(() => {
      const lookup = {};
      specsFromDb.forEach(spec => {
        lookup[spec.slug] = spec;
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

    // Helper to get display name from slug
    const getDisplayFromSlug = (slug) => {
      const spec = specsBySlug[slug];
      return spec ? spec.spec : null;
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

    // Global phase selector (controls which phase's assignments are shown)
    const [globalPhase, setGlobalPhase] = useState('T5');

    // Default to public overview tab
    const [activeTab, setActiveTab] = useState('overview');
    const [overviewSearch, setOverviewSearch] = useState('');

    const [isDbConnected, setIsDbConnected] = useState(false);
    const [newName, setNewName] = useState('');
    const [newSpec, setNewSpec] = useState(null); // spec_id from database
    const [selectedItemName, setSelectedItemName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBoss, setFilterBoss] = useState('');
    const [filterZone, setFilterZone] = useState('');
    const [filterSlot, setFilterSlot] = useState('');
    const [selectedBisSpec, setSelectedBisSpec] = useState(null); // Will be set to first spec from DB
    const [masterItemsDbPhase, setMasterItemsDbPhase] = useState('T5');
    const [expandedPlayerId, setExpandedPlayerId] = useState(null);
    const [newRaidDate, setNewRaidDate] = useState(new Date().toISOString().split('T')[0]);
    const [newRaidZone, setNewRaidZone] = useState('SSC / TK');

    // Spreadsheet States
    const [dbNewName, setDbNewName] = useState('');
    const [dbNewSlot, setDbNewSlot] = useState(LEFT_SLOTS[0]);
    const [dbNewZone, setDbNewZone] = useState('SSC');
    const [dbNewBoss, setDbNewBoss] = useState(P2_BOSSES[0]);
    const [dbNewItemId, setDbNewItemId] = useState('');
    const [dbSearch, setDbSearch] = useState('');
    const [showMissingWowheadFilter, setShowMissingWowheadFilter] = useState(false);

    // Bank state
    const [bankItems, setBankItems] = useState([]);
    const [bankRequests, setBankRequests] = useState([]);
    const [bankFilter, setBankFilter] = useState('All');
    const [bankSearch, setBankSearch] = useState('');
    const [requestModalItem, setRequestModalItem] = useState(null);
    const [requestQuantity, setRequestQuantity] = useState(1);
    const [requestReason, setRequestReason] = useState('');
    const [requestPlayerId, setRequestPlayerId] = useState('');
    const [denyReason, setDenyReason] = useState('');
    const [approvePrice, setApprovePrice] = useState('');
    const [respondingRequestId, setRespondingRequestId] = useState(null);
    const [bankUploadFile, setBankUploadFile] = useState(null);
    const [bankSubFilter, setBankSubFilter] = useState('');
    const [bankUploadParsed, setBankUploadParsed] = useState(null);
    const [bankUploadStatus, setBankUploadStatus] = useState('');
    const [denyCustomReason, setDenyCustomReason] = useState('');
    const [approveQuantity, setApproveQuantity] = useState('');
    const [approveNote, setApproveNote] = useState('');

    // ==========================================
    // 2. CLOUD SYNCHRONIZATION STATES
    // ==========================================
    const [roster, setRosterLocal] = useState([]);
    const [assignments, setAssignmentsLocal] = useState({});
    const [scoringConfig, setScoringConfigLocal] = useState({});
    const [playerStats, setPlayerStatsLocal] = useState({});
    const [raidLogs, setRaidLogsLocal] = useState([]);
    const [mutableItems, setMutableItemsLocal] = useState([]);
    const [bisPriorities, setBisPrioritiesLocal] = useState({});
    const [dbBisPriorities, setDbBisPrioritiesLocal] = useState({});

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
      const loadAll = async () => {
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

          setRosterLocal(rosterData);
          setAssignmentsLocal(assignmentsData);
          const defaults = Object.keys(bisData).length ? bisData : await initializeDefaultBisPriorities(globalPhase);
          setBisPrioritiesLocal(defaults);
          setScoringConfigLocal(Object.keys(configData).length ? configData : { parseWeight: 1, supportMulti: 1.5, consBonus: 10, enchantBonus: 10, gemBonus: 10, attWeight: 0.5, afkPenalty: 5 });
          setPlayerStatsLocal(statsData);
          setRaidLogsLocal(logsData);
          setMutableItemsLocal(itemsData);
          setIsDbConnected(true);
        } catch (e) {
          console.error('Failed to load data:', e);
        }
      };

      loadAll();
      const interval = setInterval(loadAll, 5000);
      return () => clearInterval(interval);
    }, [globalPhase]);

    // Separate sync for Master Items DB phase selector
    useEffect(() => {
      const loadDbBis = async () => {
        const phaseKey = PHASE_JSON_KEYS[masterItemsDbPhase];
        const data = await fetchData('bis-priorities/' + phaseKey);
        const dbDefaults = Object.keys(data).length ? data : await initializeDefaultBisPriorities(masterItemsDbPhase);
        setDbBisPrioritiesLocal(dbDefaults);
      };
      loadDbBis();
    }, [masterItemsDbPhase]);

    // ==========================================
    // 4. CLOUD WRITERS
    // ==========================================
    const setRoster = (newVal) => {
      const rosterWithoutIds = newVal.map(({ id, ...rest }) => rest);
      putData('roster', rosterWithoutIds).then(updatedRoster => {
        // Create a mapping from old ID to new ID
        const idMap = {};
        updatedRoster.forEach((newPlayer, index) => {
          if (newVal[index]) {
            idMap[newVal[index].id] = newPlayer.id;
          }
        });

        // Update playerStats with new IDs
        const updatedStats = {};
        Object.entries(playerStats).forEach(([oldId, stats]) => {
          const newId = idMap[oldId] || oldId;
          updatedStats[newId] = stats;
        });

        setRosterLocal(updatedRoster);
        setPlayerStatsLocal(updatedStats);
      });
    };
    const setAssignments = (newVal) => {
      setAssignmentsLocal(newVal);
      const phaseKey = PHASE_JSON_KEYS[globalPhase];
      putData('assignments/' + phaseKey, newVal);
    };
    const setBisPriorities = (newVal) => {
      setBisPrioritiesLocal(newVal);
      const phaseKey = PHASE_JSON_KEYS[globalPhase];
      putData('bis-priorities/' + phaseKey, newVal);
    };
    const setDbBisPriorities = (newVal) => {
      setDbBisPrioritiesLocal(newVal);
      const phaseKey = PHASE_JSON_KEYS[masterItemsDbPhase];
      putData('bis-priorities/' + phaseKey, newVal);
    };
    const setScoringConfig = (newVal) => { setScoringConfigLocal(newVal); putData('scoring-config', newVal); };
    const setPlayerStats = (newVal) => { setPlayerStatsLocal(newVal); putData('player-stats', newVal); };
    const setRaidLogs = (newVal) => { setRaidLogsLocal(newVal); putData('raid-logs', newVal); };
    const setMutableItems = (newVal) => { setMutableItemsLocal(newVal); putData('mutable-items', newVal); };
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
    const handleLogin = (e) => {
      if (e) e.preventDefault();
      if (passwordInput === 'TBCOfficer2026!') {
        setIsAuthenticated(true);
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
      setActiveTab('overview');
    };

    const handleAddPlayer = (e) => {
      e.preventDefault();
      if (!newName.trim()) return;
      const newId = Date.now();
      setRoster([...roster, { id: newId, name: newName, spec_id: newSpec, in_raid: true }]);
      setPlayerStats({ ...playerStats, [newId]: { cons: true, enchants: true, gems: true, afks: 0, parses: {} } });
      setNewName('');
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
    };

    const calculateAttendance = (playerId) => {
      if (raidLogs.length === 0) return 100;
      const attendedCount = raidLogs.filter(log => log.attendees.includes(playerId)).length;
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
      const activeRaiderIds = roster.filter(p => p.in_raid).map(p => p.id);
      setRaidLogs([{ id: Date.now(), date: newRaidDate, zone: newRaidZone, attendees: activeRaiderIds }, ...raidLogs]);
      alert(`Saved raid log for ${activeRaiderIds.length} players!`);
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

    const handleAddItemToDb = (e) => {
      e.preventDefault();
      if (!dbNewName.trim()) return;

      if (mutableItems.some(i => i.name.toLowerCase() === dbNewName.trim().toLowerCase())) {
        alert("An item with that name already exists in the database!");
        return;
      }

      const newItem = {
        name: dbNewName.trim(), slot: dbNewSlot, zone: dbNewZone, boss: dbNewBoss,
        source: `${dbNewBoss} (${dbNewZone})`, itemId: dbNewItemId.trim(), eligible: {}
      };

      setMutableItems([newItem, ...mutableItems]);
      setDbNewName('');
      setDbNewItemId('');
      alert(`Successfully added "${newItem.name}" to items table!`);
    };

    const handleUpdateItemEligibility = (itemName, spec, currentStatus, useDbPhase = false) => {
      // Get the key for this item-spec combination
      const itemKey = `${itemName}|${spec}`;

      let nextStatus = '';
      if (currentStatus === '') nextStatus = 'BiS';
      else if (currentStatus === 'BiS') nextStatus = 'Opt';
      else nextStatus = '';

      const currentBis = useDbPhase ? dbBisPriorities : bisPriorities;
      const newBisPriorities = { ...currentBis };
      if (nextStatus) {
        newBisPriorities[itemKey] = nextStatus;
      } else {
        delete newBisPriorities[itemKey];
      }

      if (useDbPhase) {
        setDbBisPriorities(newBisPriorities);
      } else {
        setBisPriorities(newBisPriorities);
      }
    };

    const handleUpdateItemId = (itemName, newId) => {
      setMutableItems(mutableItems.map(item =>
        item.name === itemName ? { ...item, itemId: newId } : item
      ));
    };

    const handleDeleteItemFromDb = (itemName) => {
      if (window.confirm(`Permanently remove "${itemName}" from the master loot tables?`)) {
        setMutableItems(mutableItems.filter(i => i.name !== itemName));
        if (selectedItemName === itemName) setSelectedItemName('');
      }
    };

    const handleSubmitBankRequest = async () => {
      if (!requestPlayerId || !requestModalItem) return;
      try {
        await fetch(`${API}/bank-requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            player_id: parseInt(requestPlayerId),
            item_wowhead_id: requestModalItem.item_wowhead_id,
            item_name: requestModalItem.name,
            quantity: requestQuantity,
            reason: requestReason
          })
        });
        setRequestModalItem(null);
        setRequestQuantity(1);
        setRequestReason('');
        alert('Request submitted!');
      } catch (e) {
        alert('Failed to submit request.');
      }
    };

    const handleResolveBankRequest = async (id, status, price, note, approvedQuantity) => {
      try {
        await fetch(`http://localhost:3001/api/bank-requests/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, price, officer_note: note, approved_quantity: approvedQuantity })
        });
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
        const res = await fetch(`${API}/bank-items`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bankUploadParsed)
        });
        const data = await res.json();
        setBankUploadStatus(`✅ Bank updated with ${data.count} items! Discord notified.`);
        setBankUploadParsed(null);
        const items = await fetchData('bank-items');
        setBankItems(items);
      } catch (e) {
        setBankUploadStatus('❌ Error uploading.');
      }
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
      return matchSearch && matchBoss && matchZone && matchSlot;
    });

    const dbFilteredItems = useMemo(() => {
      let items = mutableItems.filter(item => item && item.name && item.name.toLowerCase().includes(dbSearch.toLowerCase()));
      if (showMissingWowheadFilter) {
        items = items.filter(item => !item.itemId || item.itemId.trim() === '');
      }
      return items.sort((a, b) => a.name.localeCompare(b.name));
    }, [mutableItems, dbSearch, showMissingWowheadFilter]);

    useEffect(() => {
      if (filterZone && filterBoss && !mutableItems.some(i => i.zone === filterZone && i.boss === filterBoss)) setFilterBoss('');
    }, [filterZone, filterBoss, mutableItems]);

    const selectedItem = mutableItems.find(i => i.name === selectedItemName);
    const activeRaiders = roster.filter(p => p.in_raid);

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
      // Get eligible specs: either from bisPriorities or from the item's spec field in aggregated data
      const eligible = activeRaiders.filter(player => {
        const specDisplay = getDisplayFromId(player.spec_id) || '?';
        const specKey = getSlugFromDisplay(specDisplay);
        const itemKey = `${selectedItem.name}|${specDisplay}`;
        const bisStatus = bisPriorities[itemKey];
        // If explicitly set in bisPriorities, check that
        if (bisStatus) return bisStatus !== '';
        // Otherwise, use the aggregated data's spec field
        return selectedItem.spec === specKey;
      });
      return sortPlayersByRank(selectedItem, eligible, assignments);
    }, [selectedItem, activeRaiders, assignments, playerStats, scoringConfig, raidLogs, bisPriorities, specsByName]);

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

      const phaseKey = PHASE_JSON_KEYS[masterItemsDbPhase];
      const specKey = getSlugFromDisplay(spec);

      const itemsInSlot = mutableItems.filter(i =>
        i.slot && i.slot.toLowerCase() === dataSlot
      );

      const bis = itemsInSlot.filter(item => {
        const itemKey = `${item.name}|${spec}`;
        return dbBisPriorities[itemKey] === 'BiS';
      });
      const opt = itemsInSlot.filter(item => {
        const itemKey = `${item.name}|${spec}`;
        const manualOverride = dbBisPriorities[itemKey];
        if (manualOverride === 'Opt') return true;
        if (manualOverride === 'BiS' || manualOverride === '') return false;
        return item.eligible && item.eligible[spec] === 'Opt';
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
                  {renderItemLink(i, "text-sm font-bold text-purple-400 drop-shadow-sm leading-tight")}
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
                      {renderItemLink(i, "text-[10px] text-slate-400 truncate max-w-[150px]")}
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
      const loadBankData = async () => {
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
      const interval = setInterval(loadBankData, 10000);
      return () => clearInterval(interval);
    }, [isAuthenticated]);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">

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

            <div className="flex items-center gap-4">
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
                <button onClick={handleLogout} className="text-xs font-bold text-slate-500 hover:text-red-400 transition uppercase tracking-widest">
                  Lock App (Log Out)
                </button>
              ) : (
                <form onSubmit={handleLogin} className="flex gap-2 items-center bg-slate-900 border border-slate-800 p-1.5 rounded-lg shadow-inner">
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="bg-slate-950 text-white border border-slate-700 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 tracking-widest w-40"
                    placeholder="Officer Password"
                  />
                  <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-1.5 px-3 rounded transition shadow-lg tracking-wider uppercase text-[10px]">
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
            {/* Lock down all editing tabs behind authentication */}
            {isAuthenticated && (
              <>
                <button onClick={() => setActiveTab('bankRequests')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'bankRequests' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>Bank Requests</button>
                <button onClick={() => setActiveTab('loot')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'loot' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>Loot Council</button>
                <button onClick={() => setActiveTab('roster')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'roster' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>Roster & Attendance</button>
                <button onClick={() => setActiveTab('scoring')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'scoring' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>Scoring & Config</button>
                <button onClick={() => setActiveTab('itemsdb')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'itemsdb' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>Master Items DB</button>
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
              handleBankFileUpload={handleBankFileUpload}
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
              getSpecById={getSpecById}
              getRankBadgeStyle={getRankBadgeStyle}
              renderItemLink={renderItemLink}
              handleSetPriority={handleSetPriority}
              PlayerNameWithScore={PlayerNameWithScore}
            />
          )}

          {/* =========================================
              TAB: ROSTER & ATTENDANCE
              ========================================= */}
          {activeTab === 'roster' && isAuthenticated && (
            <RosterTab
              handleSaveRaidLog={handleSaveRaidLog}
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
              specsByName={specsByName}
              PlayerNameWithScore={PlayerNameWithScore}
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
            />
          )}

        </div>
      </div>
    );
  }