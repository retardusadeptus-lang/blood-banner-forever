import React, { useState, useMemo, useEffect } from 'react';
const API = 'http://localhost:3001/api';
const fetchData = async (endpoint) => {
  const res = await fetch(`${API}/${endpoint}`);
  return res.json();
};
const putData = async (endpoint, data) => {
  const res = await fetch(`${API}/${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}; 
import itemsData from './items.json';
import aggregatedBisData from './aggregated_bis_with_ids.json';
console.log(itemsData.map(item => item.slot).filter(s => s.toLowerCase().includes("ring") || s.toLowerCase().includes("trinket"))); // Debugging slot names in source data

const PHASES = ["Pre-BiS", "T4", "T5", "T6", "ZA", "SWP"];
const PHASE_JSON_KEYS = { "Pre-BiS": "pre-bis", "T4": "t4", "T5": "t5", "T6": "t6", "ZA": "za", "SWP": "swp" };

const SPECS = [
  "Prot Warrior", "Arms Warrior", "Fury Warrior", "Prot Paladin", "Holy Paladin", 
  "Ret Paladin", "BM Hunter", "MM Hunter", "Survival Hunter", "Elemental Shaman", 
  "Enhance Shaman", "Resto Shaman", "Balance Druid", "Feral (Tank)", "Feral (DPS)", 
  "Resto Druid", "Combat Rogue", "Holy Priest", "Discipline Priest", "Shadow Priest", 
  "Arcane Mage", "Fire Mage", "Frost Mage", "Destro Warlock", "Demo Warlock", "Affliction Warlock"
];

const CLASS_COLORS = {
  "Prot Warrior": "#C79C6E", "Arms Warrior": "#C79C6E", "Fury Warrior": "#C79C6E",
  "Prot Paladin": "#F58CBA", "Holy Paladin": "#F58CBA", "Ret Paladin": "#F58CBA",
  "BM Hunter": "#ABD473", "MM Hunter": "#ABD473", "Survival Hunter": "#ABD473",
  "Combat Rogue": "#FFF569",
  "Holy Priest": "#FFFFFF", "Discipline Priest": "#FFFFFF", "Shadow Priest": "#FFFFFF",
  "Elemental Shaman": "#0070DE", "Enhance Shaman": "#0070DE", "Resto Shaman": "#0070DE",
  "Arcane Mage": "#69CCF0", "Fire Mage": "#69CCF0", "Frost Mage": "#69CCF0",
  "Destro Warlock": "#8788EE", "Demo Warlock": "#8788EE", "Affliction Warlock": "#8788EE",
  "Balance Druid": "#FF7D0A", "Feral (Tank)": "#FF7D0A", "Feral (DPS)": "#FF7D0A", "Resto Druid": "#FF7D0A"
};

const LEFT_SLOTS = ["Head", "Neck", "Shoulder", "Back", "Chest", "Wrist"];
const RIGHT_SLOTS = ["Hands", "Waist", "Legs", "Feet", "Ring 1", "Ring 2", "Trinket 1", "Trinket 2"];
const BOTTOM_SLOTS = ["Main Hand", "Off Hand", "Shield", "Ranged", "Wand", "Totem", "Libram", "Idol"];

// Normalize slot names from aggregated data (lowercase) to proper casing
const normalizeSlot = (slot) => {
  if (!slot) return slot;
  const slotMap = {
    "head": "Head",
    "neck": "Neck",
    "shoulder": "Shoulder",
    "back": "Back",
    "chest": "Chest",
    "wrist": "Wrist",
    "hands": "Hands",
    "waist": "Waist",
    "legs": "Legs",
    "feet": "Feet",
    "ring": "Ring",
    "trinket": "Trinket",
    "main hand": "Main Hand",
    "off hand": "Off Hand",
    "shield": "Shield",
    "ranged": "Ranged",
    "wand": "Wand",
    "totem": "Totem",
    "libram": "Libram",
    "idol": "Idol",
    "weapon": "Main Hand",
    "relic": "Totem",
    "18 slot ammo pouch": "Ranged",
    "18 slot quiver": "Ranged"
  };
  return slotMap[slot.toLowerCase().trim()] || slot;
};

const P2_BOSSES = [
  "Hydross the Unstable", "The Lurker Below", "Leotheras the Blind", "Fathom-Lord Karathress", 
  "Morogrim Tidewalker", "Lady Vashj", "Al'ar", "Void Reaver", "High Astromancer Solarian", "Kael'thas"
];

// Mined IDs from your uploaded CSV data!
// Generate WowHead ID mapping dynamically from aggregatedBisData
// Extracts unique item names and their IDs
const generateWowheadIds = (data) => {
  const mapping = {};
  const seen = new Set();
  data.forEach(item => {
    if (item.name && item.id && !seen.has(item.name)) {
      mapping[item.name] = String(item.id);
      seen.add(item.name);
    }
  });
  return mapping;
};

export default function App() {
  // Generate WowHead ID mapping from aggregated data
  const WOWHEAD_IDS = useMemo(() => generateWowheadIds(aggregatedBisData), []);

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
  const aggregatedBisLookup = useMemo(() => {
  const lookup = {};
  aggregatedBisData.forEach(item => {
    if (!item || !item.name || !item.spec) return;
    const key = `${item.name}|${item.spec}`;
    if (!lookup[key]) lookup[key] = item;
  });
  return lookup;
}, []);

  const initializeDefaultBisPriorities = (phase) => {
    const phaseKey = PHASE_JSON_KEYS[phase];
    const defaults = {};
    aggregatedBisData.forEach(item => {
      const phaseData = item[phaseKey];
      if (phaseData && phaseData.bis === true) {
        // Convert spec from hyphenated format (e.g., "balance-druid") to display name (e.g., "Balance Druid")
        const displaySpec = getDisplayFromSlug(item.spec);
        if (displaySpec) {
          const key = `${item.name}|${displaySpec}`;
          defaults[key] = 'BiS';
        }
      }
    });
    return defaults;
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
      setBisPrioritiesLocal(Object.keys(bisData).length ? bisData : initializeDefaultBisPriorities(globalPhase));
      setScoringConfigLocal(Object.keys(configData).length ? configData : { parseWeight: 1, supportMulti: 1.5, consBonus: 10, enchantBonus: 10, gemBonus: 10, attWeight: 0.5, afkPenalty: 5 });
      setPlayerStatsLocal(statsData);
      setRaidLogsLocal(logsData);
      setMutableItemsLocal(itemsData.length ? itemsData : (() => {
        const seen = new Set();
        return aggregatedBisData
          .filter(item => item && item.name && item.slot)
          .filter(item => { if (seen.has(item.name)) return false; seen.add(item.name); return true; })
          .map(item => ({ name: item.name, slot: normalizeSlot(item.slot), itemId: item.id || '', boss: item.source_type, zone: item.source, drop_chance: item.drop_chance || null, spec: item.spec, id: item.id, rarity: item.rarity, source: item.source, source_type: item.source_type, phase: item.phase }));
      })());
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
    setDbBisPrioritiesLocal(Object.keys(data).length ? data : initializeDefaultBisPriorities(masterItemsDbPhase));
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
    if(window.confirm("Are you sure you want to permanently delete this player?")) {
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
    if(window.confirm("Delete this raid log?")) setRaidLogs(raidLogs.filter(log => log.id !== logId));
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

const clearDatabaseCache = () => {
    // Replaced window.confirm with window.prompt to ask for the password
    const pwd = window.prompt("WARNING: Doing this will wipe the cloud items database and reset it to default mappings from aggregated BiS data. Enter the officer password to confirm:");
    
    // Check if the entered password matches
    if (pwd === 'DELETE') {
const defaultItems = (() => {
  const seen = new Set();
  return aggregatedBisData
    .filter(item => item && item.name && item.slot)
    .filter(item => {
      if (seen.has(item.name)) return false;
      seen.add(item.name);
      return true;
    })
    .map(item => {
      return {
        name: item.name,
        slot: normalizeSlot(item.slot),
        itemId: item.id || '',
        boss: item.source_type,
        zone: item.source,
        drop_chance: item.drop_chance || null,
        spec: item.spec,
        id: item.id,
        rarity: item.rarity,
        source: item.source,
        source_type: item.source_type,
        phase: item.phase
      };
    });
})();
      
      setMutableItems(defaultItems);
      setBisPriorities({});
      alert("Database successfully reset to defaults.");
      
    } else if (pwd !== null) {
      // If they typed the wrong password (and didn't just click 'Cancel')
      alert("Incorrect password. Database reset aborted.");
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
    return items.sort((a,b) => a.name.localeCompare(b.name));
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
    const manualOverride = dbBisPriorities[itemKey];
    if (manualOverride === 'BiS') return true;
    if (manualOverride === 'Opt' || manualOverride === '') return false;
    // Check ALL aggregated entries for this item name
const match = aggregatedBisLookup[`${item.name}|${specKey}`];
return match?.[phaseKey]?.bis === true;
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
) : ( <span className="text-sm font-bold text-slate-500 italic leading-tight">No primary BiS</span> )}
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

          {/* Lock down all editing tabs behind authentication */}
          {isAuthenticated && (
            <>
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
<section className="overview-tab bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner">              
              <div>
                <h2 className="text-xl font-bold text-slate-100 mb-1">Master Priority Ledger</h2>
                <p className="text-sm text-slate-500">A bird's-eye view of every item that currently has an assigned Loot Council priority.</p>
              </div>
              <input 
                type="text" 
                placeholder="Search by item or player name..." 
                className="w-full md:w-96 bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner" 
                value={overviewSearch} 
                onChange={e => setOverviewSearch(e.target.value)} 
              />
            </div>
            {filteredOverviewItems.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-xl"><p className="text-slate-500 font-medium">No priorities match your search criteria.</p></div>
            ) : (
<div className="columns-1 lg:columns-2 xl:columns-3 gap-6 space-y-0">                {filteredOverviewItems.map(item => {
                  const assignedPlayers = roster.filter(p => typeof assignments[item.name]?.[p.id] === 'number');
const sortedAssignedPlayers = assignedPlayers.sort((a, b) => {
  const rankA = assignments[item.name][a.id];
  const rankB = assignments[item.name][b.id];
  if (rankA !== rankB) return rankA - rankB;
  return Number(calculateScore(b.id)) - Number(calculateScore(a.id));
});                  return (
<div key={item.name} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col break-inside-avoid mb-6">                      
                           <div className="bg-slate-900 border-b border-slate-800 p-4">
  <div className="flex items-center gap-3 mb-1">
 <div className="character-slot-icon w-10 h-10 rounded border border-purple-500/50 bg-slate-950 flex-shrink-0 flex items-center justify-center overflow-hidden relative shadow-inner">
  {item.itemId ? (
    
      <a href={"https://tbc.wowhead.com/item=" + item.itemId}
      data-wh-rename-link="false"
      data-wh-icon-size="large"
      className="item-link absolute inset-0"
      target="_blank"
      rel="noreferrer"
      onMouseLeave={hideWowheadTooltip}
      style={{fontSize: 0, lineHeight: 0}}
    />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent" />
      )}
    </div>
    <h3 className="text-lg font-bold text-purple-400 truncate drop-shadow-sm">
      {renderItemLink(item)}
    </h3>
  </div>
  <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider flex-wrap">
    <span>{item.slot}</span>
    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
    <span className="text-amber-500/80">{item.boss}</span>
    {item.drop_chance && (
      <>
        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
        <span className="text-cyan-400">{(item.drop_chance * 100).toFixed(0)}% Drop</span>
      </>
    )}
  </div>
</div>
                      <div className="p-3 flex-1">
                        {sortedAssignedPlayers.length === 0 ? ( <p className="text-xs text-slate-600 italic py-2">Only Passes recorded.</p> ) : (
                          <ul className="space-y-2">
                            {sortedAssignedPlayers.map(player => (
                                <li key={player.id} className="flex items-center gap-3 bg-slate-900/50 p-2 rounded border border-slate-800/50">
                                  <div className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-xs shadow-inner ${getRankBadgeStyle(assignments[item.name][player.id])}`}>{assignments[item.name][player.id]}</div>
                                  <div className="flex-1 min-w-0 flex items-center justify-between"><PlayerNameWithScore player={player} /></div>
                                </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {/* Hide edit button for unauthenticated users */}
                      {isAuthenticated && (
                        <div className="bg-slate-900/30 p-2 border-t border-slate-800/50 text-right">
                           <button onClick={() => { setActiveTab('loot'); setSearchQuery(item.name); setSelectedItemName(item.name); }} className="text-xs font-bold text-amber-500 hover:text-amber-400 uppercase tracking-wider px-2 py-1">Edit Priorities &rarr;</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* =========================================
            TAB: LOOT COUNCIL ASSIGNMENT
            ========================================= */}
        {activeTab === 'loot' && isAuthenticated && (
          <section className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300">
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 mb-8 shadow-inner">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Item Database Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Search Name</label>
                  <input type="text" className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Filter Zone</label>
                  <select className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none" value={filterZone} onChange={e => setFilterZone(e.target.value)}>
                    <option value="">All Zones</option>
                    {uniqueZones.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Filter Boss</label>
                  <select className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none truncate" value={filterBoss} onChange={e => setFilterBoss(e.target.value)}>
                    <option value="">All Bosses</option>
                    {uniqueBosses.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Filter Slot</label>
                  <select className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none" value={filterSlot} onChange={e => setFilterSlot(e.target.value)}>
                    <option value="">All Slots</option>
                    {uniqueSlots.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                 <select className="w-full bg-slate-900 text-purple-400 font-bold border border-slate-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer" value={selectedItemName} onChange={e => setSelectedItemName(e.target.value)}>
                  <option value="" className="text-slate-500">-- Select Dropped Item ({filteredItems.length} matches) --</option>
                  {filteredItems.map(item => <option key={item.name} value={item.name} className="text-purple-400">{item.name}</option>)}
                </select>
              </div>
            </div>

            {selectedItem ? (
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-6 border-b border-slate-800">
                  <h3 className="text-3xl font-bold text-purple-400 drop-shadow-md mb-2">
                    {renderItemLink(selectedItem)}
                  </h3>
                  <div className="flex gap-4 text-sm font-semibold text-slate-300 flex-wrap">
                    <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">{selectedItem.slot}</span>
                    <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">{selectedItem.zone}</span>
                    {selectedItem.drop_chance && (
                      <span className="bg-cyan-900/30 px-3 py-1 rounded-full border border-cyan-700/50 text-cyan-400">{(selectedItem.drop_chance * 100).toFixed(0)}% Drop Chance</span>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <h4 className="text-sm font-bold mb-4 text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">Council Priority Queue</h4>
                  {sortedEligiblePlayers.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-800"><p className="text-slate-400 font-medium text-sm">None of your active raiders need this item.</p></div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {sortedEligiblePlayers.map(player => {
                        const specDisplay = getDisplayFromId(player.spec_id) || '?';
                        const specKey = getSlugFromDisplay(specDisplay);
                        const itemKey = `${selectedItem.name}|${specDisplay}`;
                        const bisPriorityStatus = bisPriorities[itemKey];
                        const status = bisPriorityStatus || (selectedItem.spec === specKey ? 'BiS' : '');
                        const currentPriority = assignments[selectedItem.name]?.[player.id];
const playerAlts = mutableItems.filter(i => {
  if (i.slot !== selectedItem.slot || i.name === selectedItem.name) return false;
  const altItemKey = `${i.name}|${specDisplay}`;
  const altBisPriority = bisPriorities[altItemKey];
  return altBisPriority || i.spec === specKey;
}).map(i => ({ ...i, eligible: i.eligible || {} }));

                        return (
                          <div key={player.id} className={`flex flex-col p-4 rounded-xl shadow-sm border transition-all duration-300 ${currentPriority === 1 ? 'bg-slate-800/80 border-amber-500/50' : currentPriority === 'Pass' ? 'bg-slate-950/50 border-slate-900 opacity-60' : 'bg-slate-900 border-slate-700'}`}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-inner flex-shrink-0 ${getRankBadgeStyle(currentPriority)}`}>
                                  {typeof currentPriority === 'number' ? currentPriority : (currentPriority === 'Pass' ? '✕' : '-')}
                                </div>
                                <img src={getSpecById(player.spec_id)?.icon_large || 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg'} alt="" className="w-10 h-10 rounded border border-slate-600 bg-slate-800 object-cover flex-shrink-0" />
                                  <div>
                                  <PlayerNameWithScore player={player} />
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{specDisplay}</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${status === 'BiS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'}`}>{status}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 overflow-x-auto custom-scrollbar">
                                <span className="text-xs font-semibold text-slate-500 mr-2 ml-1 uppercase tracking-wider whitespace-nowrap">Assign Rank:</span>
                                {[1, 2, 3, 4, 5].map(rank => (
                                  <button key={rank} onClick={() => handleSetPriority(player.id, currentPriority === rank ? null : rank)} className={`w-8 h-8 flex-shrink-0 rounded font-bold text-sm transition-all ${currentPriority === rank ? 'bg-purple-600 text-white shadow-[0_0_8px_rgba(147,51,234,0.6)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'}`}>{rank}</button>
                                ))}
                                <div className="w-px h-6 bg-slate-800 mx-1 flex-shrink-0"></div>
                                <button onClick={() => handleSetPriority(player.id, currentPriority === 'Pass' ? null : 'Pass')} className={`px-3 h-8 flex-shrink-0 rounded font-bold text-xs uppercase transition-all ${currentPriority === 'Pass' ? 'bg-red-900/60 text-red-400 border border-red-800' : 'bg-slate-900 text-slate-500 hover:bg-red-950 hover:text-red-400'}`}>Pass</button>
                              </div>
                            </div>
                            
                            {playerAlts.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-slate-800/50">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 block flex items-center gap-1"><span className="text-slate-600">Alternative {selectedItem.slot} Options:</span></span>
                                <div className="flex flex-wrap gap-2">
                                  {playerAlts.map(alt => (
                                    <span key={alt.name} className={`text-[10px] px-2 py-1 rounded border shadow-sm flex items-center gap-1 ${alt.eligible[specDisplay] === 'BiS' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                                      {renderItemLink(alt, "")}
                                      <span className="opacity-50 text-[9px]">({alt.boss})</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
               <div className="text-center py-20 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-xl"><p className="text-slate-500 font-medium">Use the filters above and select an item to assign priorities.</p></div>
            )}
          </section>
        )}

        {/* =========================================
            TAB: ROSTER & ATTENDANCE
            ========================================= */}
        {activeTab === 'roster' && isAuthenticated && (
          <section className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300">
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Log Current Raid</h3>
                <form onSubmit={handleSaveRaidLog} className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Date</label>
                      <input type="date" required className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none" value={newRaidDate} onChange={e => setNewRaidDate(e.target.value)} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Zone</label>
                      <input type="text" required placeholder="e.g. SSC" className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none" value={newRaidZone} onChange={e => setNewRaidZone(e.target.value)} />
                    </div>
                  </div>
                  <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-lg transition shadow-lg text-sm mt-1">Save Active Roster to History</button>
                </form>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2 flex justify-between items-center"><span>Raid History Logs</span><span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px]">{raidLogs.length} Records</span></h3>
                {raidLogs.length === 0 ? ( <p className="text-xs text-slate-600 italic py-4">No raids logged yet.</p> ) : (
                  <ul className="max-h-[140px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                    {raidLogs.map(log => (
                      <li key={log.id} className="flex justify-between items-center bg-slate-900 border border-slate-800 p-2.5 rounded hover:border-slate-700 transition group">
                        <div>
                          <span className="font-bold text-sm text-amber-500 block leading-tight">{log.date}</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">{log.zone} • {log.attendees.length} Attendees</span>
                        </div>
                        <button onClick={() => handleDeleteRaidLog(log.id)} className="text-slate-600 hover:text-red-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition px-2">Delete</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner">
              <div>
                <h2 className="text-xl font-bold text-slate-100 mb-1">Master Guild Roster</h2>
                <p className="text-sm text-slate-500">Toggle players "In Raid" to include them in the Loot Council & Attendance logging.</p>
              </div>
              <form onSubmit={handleAddPlayer} className="flex flex-wrap items-center gap-3">
                <input type="text" placeholder="Player Name" className="bg-slate-900 text-white placeholder-slate-500 border border-slate-700 rounded-lg px-4 py-2.5 w-full sm:w-auto focus:outline-none" value={newName} onChange={e => setNewName(e.target.value)} />
                <select className="bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 w-full sm:w-auto focus:outline-none cursor-pointer" value={newSpec || ''} onChange={e => setNewSpec(parseInt(e.target.value))}>
                  <option value="">Select Spec...</option>
                  {specsFromDb.map(spec => <option key={spec.id} value={spec.id} style={{ color: spec.color }}>{spec.spec}</option>)}
                </select>
                <button type="submit" className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 py-2.5 rounded-lg transition shadow-lg">Add Member</button>
              </form>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Live Raid Setup</h3>
              <div className="flex gap-2">
                <button onClick={() => setAllRaidStatus(true)} className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition">Select All</button>
                <button onClick={() => setAllRaidStatus(false)} className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition">Deselect All</button>
              </div>
            </div>

            {roster.length === 0 ? ( <p className="text-center text-slate-500 py-12 border-2 border-dashed border-slate-800 rounded-xl">Your guild roster is empty.</p> ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {roster.map(player => {
                  const specData = getSpecById(player.spec_id);
                  const specDisplay = specData?.spec || '?';
                  const iconUrl = specData?.icon_large || 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg';
                  return (
                  <div key={player.id} className={`group relative flex items-center gap-3 p-3 rounded-lg transition-all duration-200 border cursor-pointer ${player.in_raid ? 'bg-slate-800/80 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-slate-950 border-slate-800 opacity-60 hover:opacity-100'}`} onClick={() => toggleRaidStatus(player.id)}>
                    <div className="relative">
                      <img src={iconUrl} alt="" className="w-10 h-10 rounded border border-slate-700 bg-slate-900 object-cover" />
                      {player.in_raid && ( <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full w-4 h-4 flex items-center justify-center border-2 border-slate-800"><svg className="w-2.5 h-2.5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg></div> )}
                    </div>
<div className="flex-1 min-w-0 pointer-events-none">
  <span className="font-bold text-lg leading-tight drop-shadow-sm" style={{ color: specsByName[specDisplay]?.color || '#FFFFFF' }}>{player.name}</span>
  <span className="bg-amber-900/60 text-amber-400 text[10px] px-1.5 py-0.5 rounded border border-amber-500/30 font-bold shadow-inner flex items-center gap-1 w-fit my-0.5">
    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
    {calculateScore(player.id)}
  </span>
  <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate font-semibold">{specDisplay}</p>
</div>
                    <button onClick={(e) => { e.stopPropagation(); handleRemovePlayer(player.id); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg">✕</button>
                  </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* =========================================
            TAB: SCORING & CONFIG
            ========================================= */}
        {activeTab === 'scoring' && isAuthenticated && (
          <section className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300">
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner mb-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Global Score Weighting Weights</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Parse Multiplier</label><input type="number" step="0.1" className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 focus:outline-none" value={scoringConfig.parseWeight} onChange={e => setScoringConfig({...scoringConfig, parseWeight: e.target.value})} /></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Support Multiplier</label><input type="number" step="0.1" className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 focus:outline-none" value={scoringConfig.supportMulti} onChange={e => setScoringConfig({...scoringConfig, supportMulti: e.target.value})} /></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Consumables (+)</label><input type="number" className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 focus:outline-none" value={scoringConfig.consBonus} onChange={e => setScoringConfig({...scoringConfig, consBonus: e.target.value})} /></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Enchants (+)</label><input type="number" className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 focus:outline-none" value={scoringConfig.enchantBonus} onChange={e => setScoringConfig({...scoringConfig, enchantBonus: e.target.value})} /></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Gems (+)</label><input type="number" className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 focus:outline-none" value={scoringConfig.gemBonus} onChange={e => setScoringConfig({...scoringConfig, gemBonus: e.target.value})} /></div>
                <div><label className="block text-xs font-semibold text-slate-500 mb-1">Attendance Multiplier</label><input type="number" step="0.1" className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 focus:outline-none" value={scoringConfig.attWeight} onChange={e => setScoringConfig({...scoringConfig, attWeight: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-red-500 mb-1">AFK Penalty (-)</label><input type="number" step="0.1" className="w-full bg-slate-900 text-red-400 font-bold border border-red-900 rounded p-2 focus:outline-none" value={scoringConfig.afkPenalty || ''} onChange={e => setScoringConfig({...scoringConfig, afkPenalty: e.target.value})} /></div>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Player Performance Profiles</h3>
            <div className="flex flex-col gap-3">
              {roster.map(player => {
                const isExpanded = expandedPlayerId === player.id;
                const stats = playerStats[player.id] || { cons: false, enchants: false, gems: false, afks: 0, parses: {} };
                return (
                  <div key={player.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden transition-all duration-300">
                    <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors" onClick={() => setExpandedPlayerId(isExpanded ? null : player.id)}>
                      <div className="flex items-center gap-4">
                        <img src={getSpecById(player.spec_id)?.icon_large || 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg'} alt="" className="w-10 h-10 rounded border border-slate-600 bg-slate-800 object-cover" />
                        <div><PlayerNameWithScore player={player} /><span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{getDisplayFromId(player.spec_id)}</span></div>
                      </div>
                      <div className="text-slate-500">{isExpanded ? '▲' : '▼'}</div>
                    </div>
                    {isExpanded && (
                      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                           <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Base Checks</h4>
                             <label className="flex items-center gap-2 mb-2 cursor-pointer"><input type="checkbox" className="rounded bg-slate-800 border-slate-600 text-amber-500 w-4 h-4" checked={stats.cons} onChange={(e) => updatePlayerStat(player.id, 'cons', e.target.checked)} /><span className="text-sm font-semibold text-slate-300">Full Consumables</span></label>
                             <label className="flex items-center gap-2 mb-2 cursor-pointer"><input type="checkbox" className="rounded bg-slate-800 border-slate-600 text-amber-500 w-4 h-4" checked={stats.enchants} onChange={(e) => updatePlayerStat(player.id, 'enchants', e.target.checked)} /><span className="text-sm font-semibold text-slate-300">Fully Enchanted</span></label>
                             <label className="flex items-center gap-2 mb-4 cursor-pointer"><input type="checkbox" className="rounded bg-slate-800 border-slate-600 text-amber-500 w-4 h-4" checked={stats.gems} onChange={(e) => updatePlayerStat(player.id, 'gems', e.target.checked)} /><span className="text-sm font-semibold text-slate-300">Fully Gemmed</span></label>
                             
                             <div className="mt-4 pt-3 border-t border-slate-800 flex gap-4">
                               <div className="flex-1">
                                 <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Attendance %</label>
                                 <div className="bg-slate-900 text-amber-400 font-bold border border-slate-700 rounded p-2 text-center text-xl shadow-inner">{calculateAttendance(player.id)}%</div>
                               </div>
                               <div className="flex-1">
                                 <label className="block text-[10px] uppercase font-bold text-red-500 mb-1">AFKs on Trash</label>
                                 <input type="number" min="0" className="w-full bg-slate-900 text-red-400 font-bold border border-red-900 rounded p-2 text-center text-xl shadow-inner focus:outline-none" value={stats.afks || 0} onChange={(e) => updatePlayerStat(player.id, 'afks', parseInt(e.target.value) || 0)} />
                               </div>
                             </div>

                           </div>
                           <div className="md:col-span-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
                             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Officer Score Adjustments</h4>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                               <div>
                                 <label className="block text-xs font-semibold text-slate-400 mb-2">Manual Point Adjustment</label>
                                 <input 
                                   type="number" 
                                   step="0.5"
                                   className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 text-sm focus:outline-none"
                                   value={stats.manualAdjustment?.value || 0}
                                   onChange={(e) => updatePlayerManualAdjustment(player.id, 'value', parseFloat(e.target.value) || 0)}
                                   placeholder="e.g. +5 or -3"
                                 />
                               </div>
                               <div>
                                 <label className="block text-xs font-semibold text-slate-400 mb-2">Reason/Note (Optional)</label>
                                 <input 
                                   type="text"
                                   className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 text-sm focus:outline-none"
                                   value={stats.manualAdjustment?.note || ''}
                                   onChange={(e) => updatePlayerManualAdjustment(player.id, 'note', e.target.value)}
                                   placeholder="e.g. Exceptional effort, Helping alts"
                                   maxLength="50"
                                 />
                               </div>
                             </div>
                             {stats.manualAdjustment?.value !== 0 && stats.manualAdjustment?.value !== undefined && (
                               <div className={`p-2 rounded text-xs font-semibold ${stats.manualAdjustment.value > 0 ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                                 {stats.manualAdjustment.value > 0 ? '+' : ''}{stats.manualAdjustment.value} point{Math.abs(stats.manualAdjustment.value) !== 1 ? 's' : ''}{stats.manualAdjustment.note && ` — ${stats.manualAdjustment.note}`}
                               </div>
                             )}
                             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-6 mb-3">Phase 2 Parse Logs</h4>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                               {P2_BOSSES.map(boss => {
                                 const pData = stats.parses?.[boss] || { val: '', support: false };
                                 return (
                                   <div key={boss} className="flex flex-col bg-slate-900 p-2 rounded border border-slate-800/80">
                                     <span className="text-xs font-bold text-amber-500/80 mb-1 truncate">{boss}</span>
                                     <div className="flex items-center gap-2">
                                       <input type="number" placeholder="Parse" min="0" max="100" className="w-16 bg-slate-950 text-white border border-slate-700 rounded p-1 text-sm focus:outline-none" value={pData.val} onChange={(e) => updatePlayerParse(player.id, boss, 'val', e.target.value)} />
                                       <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" className="rounded bg-slate-800 border-slate-600 text-purple-500 w-3.5 h-3.5" checked={pData.support} onChange={(e) => updatePlayerParse(player.id, boss, 'support', e.target.checked)} /><span className="text-[10px] font-semibold text-purple-400 uppercase">Support Role</span></label>
                                     </div>
                                   </div>
                                 );
                               })}
                             </div>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* =========================================
            TAB: BiS & ALTERNATIVES (CHARACTER SHEET)
            ========================================= */}
        {activeTab === 'bis' && (
<section className="bis-tab bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300">            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner">
              <div>
                <h2 className="text-xl font-bold text-slate-100 mb-1">Class Configuration Viewer</h2>
                <p className="text-sm text-slate-500">View primary BiS and alternate options mapped to the paper doll interface.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Phase:</span>
                  <select 
                    className="bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 min-w-[120px] focus:outline-none cursor-pointer font-bold text-sm" 
                    value={masterItemsDbPhase} 
                    onChange={e => setMasterItemsDbPhase(e.target.value)}
                  >
                    {PHASES.map(phase => <option key={phase} value={phase}>{phase}</option>)}
                  </select>
                </div>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select Spec:</span>
                <select className="bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 min-w-[200px] focus:outline-none cursor-pointer font-bold style-sm" value={selectedBisSpec || ''} onChange={e => setSelectedBisSpec(e.target.value)} style={{ color: specsByName[selectedBisSpec]?.color || '#FFFFFF' }}>
                  {specsFromDb.map(spec => <option key={spec.id} value={spec.spec} style={{ color: spec.color }}>{spec.spec}</option>)}
                </select>
              </div>
            </div>
<style>{`
  .bis-tab .character-slot-icon .iconlarge {
    margin-top: -15px !important;
    margin-left: -15px !important;
  }
`}</style>
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 lg:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                <img src={getSpecById(specsByName[selectedBisSpec]?.id)?.icon_large || 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg'} alt="" className="w-96 h-96 object-cover filter grayscale blur-sm" />
              </div>
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-6 max-w-5xl mx-auto">
                <div className="flex flex-col gap-4">{LEFT_SLOTS.map(slot => renderItemSlot(slot))}</div>
                <div className="flex flex-col gap-4">{RIGHT_SLOTS.map(slot => renderItemSlot(slot))}</div>
                <div className="lg:col-span-2 pt-6 mt-2 border-t border-slate-800/80">
                  <div className="flex flex-wrap gap-4">{BOTTOM_SLOTS.map(slot => renderItemSlot(slot)).filter(Boolean).map((slot, i) => <div key={i} className="flex-1 min-w-[160px]">{slot}</div>)}</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================
            TAB: MASTER ITEMS DATABASE EDITING TABLE
            ========================================= */}
        {activeTab === 'itemsdb' && isAuthenticated && (
          <section className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300 space-y-6">
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner">
               <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Add New Loot Item to Tables</h3>
                 <button onClick={clearDatabaseCache} className="text-xs font-bold text-red-500 hover:text-red-400 uppercase">Reset Database (Clear Cache)</button>
               </div>
               <form onSubmit={handleAddItemToDb} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                 <div className="lg:col-span-2"><label className="block text-xs font-semibold text-slate-500 mb-1">Item Name</label><input type="text" required placeholder="e.g. Ashen Scale Belt" className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 text-sm focus:outline-none" value={dbNewName} onChange={e => setDbNewName(e.target.value)} /></div>
                 <div><label className="block text-xs font-semibold text-slate-500 mb-1">Slot</label><select className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 text-sm focus:outline-none cursor-pointer" value={dbNewSlot} onChange={e => setDbNewSlot(e.target.value)}>{[...LEFT_SLOTS, ...RIGHT_SLOTS, ...BOTTOM_SLOTS].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                 <div><label className="block text-xs font-semibold text-slate-500 mb-1">Zone</label><input type="text" required placeholder="e.g. SSC" className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 text-sm focus:outline-none" value={dbNewZone} onChange={e => setDbNewZone(e.target.value)} /></div>
                 <div><label className="block text-xs font-semibold text-slate-500 mb-1">Boss</label><input type="text" required placeholder="e.g. Lady Vashj" className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 text-sm focus:outline-none" value={dbNewBoss} onChange={e => setDbNewBoss(e.target.value)} /></div>
                 <div><label className="block text-xs font-semibold text-slate-500 mb-1">Wowhead ID</label><input type="text" placeholder="e.g. 30038" className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 text-sm focus:outline-none" value={dbNewItemId} onChange={e => setDbNewItemId(e.target.value)} /></div>
                 <button type="submit" className="lg:col-span-6 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded text-sm transition shadow-lg h-9">Add to Database</button>
               </form>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div>
                 <h3 className="text-xl font-bold text-slate-100">Spreadsheet Matrix Editor</h3>
                 <p className="text-xs text-slate-500 mt-0.5">Click any grid cell to toggle its status: <span className="text-purple-400 font-bold">BiS</span> &rarr; <span className="text-amber-500 font-bold">Opt</span> &rarr; <span className="text-slate-700 font-bold">None</span></p>
               </div>
               <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-start sm:items-center">
                 <div>
                   <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-widest">BiS Phase:</label>
                   <select value={masterItemsDbPhase} onChange={e => setMasterItemsDbPhase(e.target.value)} className="bg-slate-950 text-white border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none cursor-pointer font-bold shadow-inner">
                     {PHASES.map(phase => <option key={phase} value={phase}>{phase}</option>)}
                   </select>
                 </div>
                 <input type="text" placeholder="Filter items list..." className="bg-slate-950 text-white border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none flex-1 sm:flex-none sm:w-64 shadow-inner" value={dbSearch} onChange={e => setDbSearch(e.target.value)} />
                 <label className="flex items-center gap-2 cursor-pointer bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-900 transition whitespace-nowrap">
                   <input 
                     type="checkbox" 
                     checked={showMissingWowheadFilter} 
                     onChange={e => setShowMissingWowheadFilter(e.target.checked)}
                     className="rounded bg-slate-800 border-slate-600 text-amber-500 w-4 h-4 cursor-pointer"
                   />
                   Missing Wowhead ID
                 </label>
               </div>
            </div>
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-inner max-w-full overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="p-3 min-w-[200px] sticky left-0 bg-slate-900 border-r border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">Item & Source</th>
                    <th className="p-3 text-center">Wowhead ID</th>
                    <th className="p-3 text-center">Slot</th>
                    {specsSortedByClass.map(spec => (
                      <th key={spec.id} className="p-2 text-center text-[9px] whitespace-nowrap min-w-[85px]" style={{ color: spec.color }}>{spec.spec}</th>
                    ))}
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs font-medium">
                  {dbFilteredItems.map(item => (
                    <tr key={item.name} className="hover:bg-slate-900/30 group">
                      <td className="p-3 sticky left-0 bg-slate-950 group-hover:bg-slate-900/90 border-r border-slate-800 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.3)] min-w-[200px]">
                        <div className="truncate mb-0.5">{renderItemLink(item, "font-bold text-purple-400")}</div>
                        <div className="flex gap-2 flex-wrap text-slate-500 uppercase tracking-wide text-[10px] font-semibold">
                          <span className="truncate">{item.boss} ({item.zone})</span>
                          {item.drop_chance && (
                            <span className="text-cyan-400/80 flex-shrink-0">{(item.drop_chance * 100).toFixed(0)}% Drop</span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-900 text-center">
                        <input 
                          type="text" 
                          className="w-16 bg-slate-900 border border-slate-700 text-slate-300 text-[10px] text-center rounded p-1 focus:outline-none"
                          value={item.itemId || ''}
                          onChange={(e) => handleUpdateItemId(item.name, e.target.value)}
                          placeholder="ID"
                        />
                      </td>
                      <td className="p-3 text-slate-400 font-semibold text-center whitespace-nowrap">{item.slot}</td>
                      {specsSortedByClass.map(spec => {
  const itemKey = `${item.name}|${spec.spec}`;
  const manualOverride = dbBisPriorities[itemKey];
  
  let cellStatus = manualOverride || '';
  
  if (!cellStatus) {
    const phaseKey = PHASE_JSON_KEYS[masterItemsDbPhase];
    const specKey = getSlugFromDisplay(spec.spec);
    // Check ALL entries matching this item name and spec
const match = aggregatedBisLookup[`${item.name}|${specKey}`];
if (match?.[phaseKey]?.bis === true) {
      cellStatus = 'BiS';
    }
  }
  
  return (
    <td key={spec.id} onClick={() => handleUpdateItemEligibility(item.name, spec.spec, cellStatus, true)} 
      className={`p-2 border-r border-slate-900 text-center cursor-pointer select-none font-bold uppercase text-[10px] transition-all duration-150 
        ${cellStatus === 'BiS' ? 'bg-emerald-950/20 text-emerald-400 border-b border-emerald-900' 
        : cellStatus === 'Opt' ? 'bg-amber-950/20 text-amber-500 border-b border-amber-900' 
        : 'text-slate-800 hover:bg-slate-800/30 hover:text-slate-500'}`}>
      {cellStatus || '-'}
    </td>
  );
})}
                      <td className="p-3 text-center bg-slate-950 group-hover:bg-slate-900/90 transition-colors">
                        <button onClick={() => handleDeleteItemFromDb(item.name)} className="text-red-500 hover:text-red-400 font-bold px-2 py-1 transition text-[11px] uppercase tracking-wide">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {dbFilteredItems.length === 0 && (
                    <tr><td colSpan={SPECS.length + 4} className="p-8 text-center text-slate-600 italic">No matching items found in the database matrix rows.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}