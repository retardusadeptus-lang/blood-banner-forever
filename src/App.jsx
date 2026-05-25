import React, { useState, useMemo, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase'; 
import itemsData from './items.json';
console.log(itemsData.map(item => item.slot).filter(s => s.toLowerCase().includes("ring") || s.toLowerCase().includes("trinket"))); // Debugging slot names in source data

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
const RIGHT_SLOTS = ["Hands", "Waist", "Legs", "Feet", "Ring", "Trinket"];
const BOTTOM_SLOTS = ["Main Hand", "Off Hand", "Shield", "Ranged", "Wand", "Totem", "Libram", "Idol"];

const P2_BOSSES = [
  "Hydross the Unstable", "The Lurker Below", "Leotheras the Blind", "Fathom-Lord Karathress", 
  "Morogrim Tidewalker", "Lady Vashj", "Al'ar", "Void Reaver", "High Astromancer Solarian", "Kael'thas"
];

// Mined IDs from your uploaded CSV data!
const WOWHEAD_IDS = {
  "Destroyer Greathelm": "171910", "Tankatronic Goggles": "32473", "Warbringer Greathelm": "29011",
  "The Sun King's Talisman": "29994", "Barbed Choker of Discipline": "28516", "Destroyer Shoulderguards": "30117",
  "Warbringer Shoulderguards": "29016", "Phoenix-Wing Cloak": "29925", "Gilded Thorium Cloak": "28660",
  "Destroyer Chestguard": "171893", "Chestguard of the Warlord": "33473", "Warbringer Chestguard": "29012",
  "Bracers of the Green Fortress": "23538", "Vambraces of Courage": "28502", "Destroyer Handguards": "30114",
  "Topaz-Studded Battlegrips": "30741", "Girdle of the Invulnerable": "30096", "Crimson Girdle of the Indomitable": "28566",
  "Destroyer Legguards": "30116", "Warbringer Legguards": "29015", "Boots of the Resilient": "32267",
  "Battlescar Boots": "28747", "Band of the Abyssal Lord": "150459", "Shermanar Great-Ring": "28675",
  "Shadowmoon Insignia": "150526", "Scarab of Displacement": "30629", "Mallet of the Tides": "30058",
  "King's Defender": "28749", "Aldori Legacy Defender": "28825", "Shield of Impenetrable Darkness": "28606",
  "Gyro-Balanced Khorium Destroyer": "32756", "Rifle of the Stoic Guardian": "150477", "Destroyer Battle-Helm": "171911",
  "Warbringer Battle-Helm": "29021", "Worgen Claw Necklace": "28509", "Blood-Stained Pauldrons": "30866",
  "Thalassian Wildercloak": "171491", "Destroyer Breastplate": "171894", "Heartshatter Breastplate": "150510",
  "True-Aim Stalker Bands": "30091", "Destroyer Gauntlets": "30119", "Gauntlets of Martial Perfection": "28824",
  "Belt of One-Hundred Deaths": "171475", "Girdle of the Endless Pit": "28779", "Destroyer Greaves": "30121",
  "Skulker's Greaves": "28741", "Warboots of Obliteration": "30081", "Edgewalker Longboots": "28545",
  "Ring of Lethality": "30052", "Band of the Ranger-General": "29997", "Garona's Signet Ring": "28649",
  "Dragonspine Trophy": "28830", "Lionheart Champion": "28429", "Gorehowl": "28773",
  "Serpent Spine Longbow": "171474", "Sunfury Bow of the Phoenix": "28772", "Furious Gizmatic Goggles": "32461",
  "Bloodsea Brigand's Vest": "30101", "Bracers of Maliciousness": "28514", "Warbringer Greaves": "29022",
  "Romulo's Poison Vial": "28579", "Rod of the Sun King": "171493", "Talon of Azshara": "30082",
  "Spiteblade": "28729", "Crystalforge Faceguard": "171912", "Justicar Faceguard": "29068",
  "Crystalforge Shoulderguards": "30127", "Justicar Shoulderguards": "29070", "Crystalforge Chestguard": "171895",
  "Pendant of the Violet Eye": "28727", "Crystalforge Handguards": "30124", "Gauntlets of the Iron Tower": "23532",
  "Crystalforge Legguards": "30126", "Justicar Legguards": "29069", "Fang of the Leviathan": "30095",
  "Bloodmaw Magus-Blade": "28802", "Crystalforge Greathelm": "171914", "Justicar Diadem": "29061",
  "Justicar Pauldrons": "29064", "Sunshower Light Cloak": "171486", "Crystalforge Chestpiece": "171897",
  "Bracers of Justice": "28512", "Crystalforge Gloves": "30135", "Girdle of Truth": "28733",
  "Girdle of Hope": "30897", "Crystalforge Greaves": "30132", "Justicar Leggings": "29063",
  "Boots of Courage Unending": "30027", "Boots of Valiance": "28569", "Coral Band of the Revived": "30110",
  "Vial of the Sunwell": "34471", "Ribbon of Sacrifice": "28590", "Lightfathom Scepter": "171477",
  "Shard of the Virtuous": "28522", "Triptych Shield of the Ancients": "28754", "Crystalforge War-Helm": "171913",
  "Justicar Crown": "29073", "Choker of Animalistic Fury": "30059", "Justicar Shoulderplates": "29075",
  "Justicar Breastplate": "29071", "Crystalforge Gauntlets": "30130", "Justicar Gauntlets": "29072",
  "Justicar Greaves": "29074", "World Breaker": "30090", "Rift Stalker Helm": "171915",
  "Demon Stalker Greathelm": "29081", "Rift Stalker Mantle": "30143", "Demon Stalker Shoulderguards": "29084",
  "Blood Knight War Cloak": "29382", "Rift Stalker Hauberk": "171898", "Demon Stalker Harness": "29082",
  "Bracers of the Pathfinder": "30864", "Stalker's War Bands": "28454", "Rift Stalker Gauntlets": "30140",
  "Demon Stalker Gauntlets": "29085", "Rift Stalker Leggings": "30142", "Demon Stalker Greaves": "29083",
  "Cobra-Lash Boots": "171473", "Fiend Slayer Boots": "28746", "Legacy": "28587",
  "Cataclysm Headpiece": "171920", "Cyclone Faceguard": "29035", "Brooch of Unquenchable Fury": "28530",
  "Cataclysm Shoulderpads": "30173", "Cyclone Shoulderguards": "29037", "Ruby Drape of the Mysticant": "28766",
  "Cataclysm Chestpiece": "171903", "Cyclone Breastplate": "29038", "Bracers of Nimble Thought": "32586",
  "Bands of Negation": "29240", "Cataclysm Gloves": "30165", "Cyclone Gauntlets": "29039",
  "Belt of Blasting": "30038", "Girdle of Ruination": "24256", "Cataclysm Leggings": "30172",
  "Cyclone Kilt": "29030", "Boots of Foretelling": "28517", "Ring of Captured Storms": "32247",
  "The Lightning Capacitor": "28785", "Nathrezim Mindblade": "28770", "Mazthoril Honor Shield": "29268",
  "Dragonheart Flameshield": "28611", "Cataclysm Helm": "171921", "Cyclone Helm": "29040",
  "Cataclysm Shoulderplates": "30194", "Cyclone Shoulderplates": "29043", "Cyclone Hauberk": "29029",
  "Cataclysm Gauntlets": "30189", "Cyclone Handguards": "29034", "Cataclysm Legguards": "30167",
  "Cyclone War-Kilt": "29042", "The Decapitator": "28767", "Cataclysm Headguard": "171919",
  "Cyclone Headdress": "29028", "Cataclysm Chestguard": "171902", "Blackfathom Warbands": "30047",
  "Cyclone Gloves": "29032", "Girdle of Fallen Stars": "30030", "Nordrassil Headpiece": "171926",
  "Antlers of Malorne": "29093", "Nordrassil Wrath-Mantle": "30235", "Mantle of Malorne": "29100",
  "Nordrassil Chestpiece": "171909", "Breastplate of Malorne": "29096", "Nordrassil Gauntlets": "30232",
  "Gauntlets of Malorne": "29097", "Nordrassil Wrath-Kilt": "30234", "Greaves of Malorne": "29099",
  "Jewel of Infinite Possibilities": "28734", "Nordrassil Headguard": "171924", "Stag-Helm of Malorne": "29098",
  "Nordrassil Life-Mantle": "30221", "Nordrassil Chestguard": "171907", "Nordrassil Handgrips": "30223",
  "Nordrassil Feral-Kilt": "30229", "Boots of Natural Grace": "30041", "Wildfury Greatstaff": "30021",
  "Earthwarden": "29171", "Terestian's Stranglestaff": "28658", "Nordrassil Headdress": "171925",
  "Crown of Malorne": "29086", "Chestpiece of Malorne": "29091", "Nordrassil Gloves": "30217",
  "Handguards of Malorne": "29090", "Nordrassil Life-Kilt": "30220", "Britches of Malorne": "29094",
  "Windcaller's Orb": "29170", "Deathmantle Helm": "171916", "Netherblade Facemask": "29044",
  "Netherblade Shoulderpads": "29047", "Deathmantle Chestguard": "171899", "Netherblade Chestpiece": "29045",
  "Deathmantle Handguards": "30145", "Netherblade Gloves": "29048", "Deathmantle Legguards": "30148",
  "Netherblade Breeches": "29046", "Blinkstrike": "31332", "Robes of the Incarnate": "29050",
  "Bands of Indwelling": "28511", "Gloves of the Incarnate": "29057", "Trousers of the Incarnate": "29053",
  "Earring of Soulful Meditation": "30665", "Spellstrike Hood": "24266", "Frozen Shadoweave Shoulders": "21869",
  "Frozen Shadoweave Robe": "21871", "Spellstrike Pants": "24262", "Frozen Shadoweave Boots": "21870",
  "Orb of the Soul-Eater": "29272", "Tirisfal Wand of Ascendancy": "28673", "Cowl of the Grand Engineer": "29986",
  "Vestments of the Sea-Witch": "171476", "Gloves of the Aldor": "29080", "Nexus Key": "171485",
  "Mantle of the Corruptor": "30215", "Voidheart Mantle": "28967", "Voidheart Robe": "28964",
  "Gloves of the Corruptor": "30211", "Voidheart Gloves": "28968", "Leggings of the Corruptor": "30213"
};

export default function App() {
  // ==========================================
  // 1. ALL LOCAL UI AND FILTER STATES
  // ==========================================
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('ar-auth') === 'true');
  const [passwordInput, setPasswordInput] = useState('');

  // Default to public overview tab
  const [activeTab, setActiveTab] = useState('overview');
  const [overviewSearch, setOverviewSearch] = useState('');

  const [isDbConnected, setIsDbConnected] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSpec, setNewSpec] = useState(SPECS[0]);
  const [selectedItemName, setSelectedItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBoss, setFilterBoss] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterSlot, setFilterSlot] = useState('');
  const [selectedBisSpec, setSelectedBisSpec] = useState(SPECS[0]);
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

  // ==========================================
  // 2. CLOUD SYNCHRONIZATION STATES
  // ==========================================
  const [roster, setRosterLocal] = useState([]);
  const [assignments, setAssignmentsLocal] = useState({});
  const [scoringConfig, setScoringConfigLocal] = useState({});
  const [playerStats, setPlayerStatsLocal] = useState({});
  const [raidLogs, setRaidLogsLocal] = useState([]);
  const [mutableItems, setMutableItemsLocal] = useState([]);

  // ==========================================
  // 3. FIREBASE LIVE SYNC ENGINE
  // ==========================================
  useEffect(() => {
    const unsubs = [];

    const setupSync = (docName, setter, defaultVal) => {
      const ref = doc(db, 'guildData', docName);
      const unsub = onSnapshot(ref, (snapshot) => {
        if (snapshot.exists()) {
          setter(snapshot.data().data);
        } else {
          setDoc(ref, { data: defaultVal });
          setter(defaultVal);
        }
      });
      unsubs.push(unsub);
    };

    const defaultItems = itemsData.map(item => {
      let zone = "Other"; let boss = item.source;
      const match = item.source.match(/(.+?)\s*\((.+?)\)/);
      if (match) { boss = match[1].trim(); zone = match[2].trim(); } 
      else if (item.source === "Profession") { boss = "Crafted"; zone = "Profession"; }
      
      let slot = item.slot;


      const mappedId = WOWHEAD_IDS[item.name] || item.itemId || '';
      return { ...item, slot, boss, zone, itemId: mappedId };
    });

    setupSync('roster', setRosterLocal, []);
    setupSync('assignments', setAssignmentsLocal, {});
    
    // Added afkPenalty to default scoring sync!
    setupSync('scoringConfig', setScoringConfigLocal, { parseWeight: 1, supportMulti: 1.5, consBonus: 10, enchantBonus: 10, gemBonus: 10, attWeight: 0.5, afkPenalty: 5 });
    setupSync('playerStats', setPlayerStatsLocal, {});
    setupSync('raidLogs', setRaidLogsLocal, []);
    setupSync('mutableItems', setMutableItemsLocal, defaultItems);

    setTimeout(() => setIsDbConnected(true), 1200);

    return () => unsubs.forEach(fn => fn());
  }, []);

  // ==========================================
  // 4. CLOUD WRITERS
  // ==========================================
  const setRoster = (newVal) => { setRosterLocal(newVal); setDoc(doc(db, 'guildData', 'roster'), { data: newVal }); };
  const setAssignments = (newVal) => { setAssignmentsLocal(newVal); setDoc(doc(db, 'guildData', 'assignments'), { data: newVal }); };
  const setScoringConfig = (newVal) => { setScoringConfigLocal(newVal); setDoc(doc(db, 'guildData', 'scoringConfig'), { data: newVal }); };
  const setPlayerStats = (newVal) => { setPlayerStatsLocal(newVal); setDoc(doc(db, 'guildData', 'playerStats'), { data: newVal }); };
  const setRaidLogs = (newVal) => { setRaidLogsLocal(newVal); setDoc(doc(db, 'guildData', 'raidLogs'), { data: newVal }); };
  const setMutableItems = (newVal) => { setMutableItemsLocal(newVal); setDoc(doc(db, 'guildData', 'mutableItems'), { data: newVal }); };

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
      if (window.$WowheadPower && window.$WowheadPower.refreshLinks) { window.$WowheadPower.refreshLinks(); }
    }, 200);
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
    setRoster([...roster, { id: newId, name: newName, spec: newSpec, inRaid: true }]);
    setPlayerStats({ ...playerStats, [newId]: { cons: true, enchants: true, gems: true, afks: 0, parses: {} } });
    setNewName('');
  };

  const handleRemovePlayer = (id) => {
    if(window.confirm("Are you sure you want to permanently delete this player?")) {
      setRoster(roster.filter(p => p.id !== id));
    }
  };

  const toggleRaidStatus = (id) => setRoster(roster.map(p => p.id === id ? { ...p, inRaid: !p.inRaid } : p));
  const setAllRaidStatus = (status) => setRoster(roster.map(p => ({ ...p, inRaid: status })));
  const handleSetPriority = (playerId, priority) => {
    setAssignments({ ...assignments, [selectedItemName]: { ...(assignments[selectedItemName] || {}), [playerId]: priority } });
  };

  const calculateAttendance = (playerId) => {
    if (raidLogs.length === 0) return 100;
    const attendedCount = raidLogs.filter(log => log.attendees.includes(playerId)).length;
    return Math.round((attendedCount / raidLogs.length) * 100);
  };

  const calculateScore = (playerId) => {
    const stats = playerStats[playerId] || { cons: false, enchants: false, gems: false, afks: 0, parses: {} };
    let parseSum = 0; let parseCount = 0;
    Object.values(stats.parses || {}).forEach(p => {
        if (p && p.val) { parseSum += Number(p.val) * (p.support ? Number(scoringConfig.supportMulti) : 1); parseCount++; }
    });
    const avgParse = parseCount > 0 ? parseSum / parseCount : 0;
    const cons = stats.cons ? Number(scoringConfig.consBonus) : 0;
    const ench = stats.enchants ? Number(scoringConfig.enchantBonus) : 0;
    const gem = stats.gems ? Number(scoringConfig.gemBonus) : 0;
    const att = calculateAttendance(playerId) * Number(scoringConfig.attWeight);
    const afkPenalty = (stats.afks || 0) * Number(scoringConfig.afkPenalty || 5); // Subtracts the configured multiplier amount!

    return ((avgParse * Number(scoringConfig.parseWeight)) + cons + ench + gem + att - afkPenalty).toFixed(1);
  };

  const handleSaveRaidLog = (e) => {
    e.preventDefault();
    const activeRaiderIds = roster.filter(p => p.inRaid).map(p => p.id);
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
    const currentStats = playerStats[playerId] || { cons: false, enchants: false, gems: false, afks: 0, parses: {} };
    const currentParses = currentStats.parses || {};
    const specificParse = currentParses[bossName] || { val: '', support: false };
    setPlayerStats({ ...playerStats, [playerId]: { ...currentStats, parses: { ...currentParses, [bossName]: { ...specificParse, [field]: value } } } });
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

  const handleUpdateItemEligibility = (itemName, spec, currentStatus) => {
    let nextStatus = '';
    if (currentStatus === '') nextStatus = 'BiS';
    else if (currentStatus === 'BiS') nextStatus = 'Opt';
    else nextStatus = '';

    setMutableItems(mutableItems.map(item => {
      if (item.name === itemName) {
        const nextEligible = { ...item.eligible };
        if (nextStatus) nextEligible[spec] = nextStatus;
        else delete nextEligible[spec];
        return { ...item, eligible: nextEligible };
      }
      return item;
    }));
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
    const pwd = window.prompt("WARNING: Doing this will wipe the cloud items database and reset it to default mappings. Enter the officer password to confirm:");
    
    // Check if the entered password matches
    if (pwd === 'DELETE') {
      const defaultItems = itemsData.map(item => {
        let zone = "Other"; let boss = item.source;
        const match = item.source.match(/(.+?)\s*\((.+?)\)/);
        if (match) { boss = match[1].trim(); zone = match[2].trim(); } 
        else if (item.source === "Profession") { boss = "Crafted"; zone = "Profession"; }
        
        let slot = item.slot;
        // Keep the ring/trinket consolidation we added earlier!
        if (slot.includes("Ring")) slot = "Ring";
        if (slot.includes("Trinket")) slot = "Trinket";

        const mappedId = WOWHEAD_IDS[item.name] || item.itemId || '';
        return { ...item, slot, boss, zone, itemId: mappedId };
      });
      
      setMutableItems(defaultItems);
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
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchBoss = filterBoss === '' || item.boss === filterBoss;
    const matchZone = filterZone === '' || item.zone === filterZone;
    const matchSlot = filterSlot === '' || item.slot === filterSlot;
    return matchSearch && matchBoss && matchZone && matchSlot;
  });

  const dbFilteredItems = useMemo(() => {
    return mutableItems.filter(item => item.name.toLowerCase().includes(dbSearch.toLowerCase()))
      .sort((a,b) => a.name.localeCompare(b.name));
  }, [mutableItems, dbSearch]);

  useEffect(() => {
    if (filterZone && filterBoss && !mutableItems.some(i => i.zone === filterZone && i.boss === filterBoss)) setFilterBoss('');
  }, [filterZone, filterBoss, mutableItems]);

  const selectedItem = mutableItems.find(i => i.name === selectedItemName);
  const activeRaiders = roster.filter(p => p.inRaid);
  
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
    const eligible = activeRaiders.filter(player => selectedItem.eligible[player.spec]);
    return sortPlayersByRank(selectedItem, eligible, assignments);
  }, [selectedItem, activeRaiders, assignments, playerStats, scoringConfig, raidLogs]);

  const getRankBadgeStyle = (rank) => {
    if (rank === 1) return "bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-950 border border-yellow-200 shadow-[0_0_10px_rgba(253,224,71,0.6)]";
    if (rank === 2) return "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-950 border border-slate-200 shadow-[0_0_8px_rgba(203,213,225,0.5)]";
    if (rank === 3) return "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 border border-amber-500 shadow-[0_0_8px_rgba(217,119,6,0.5)]";
    if (typeof rank === 'number') return "bg-slate-800 text-white border border-slate-600";
    if (rank === 'Pass') return "bg-red-950/50 text-red-400 border border-red-900";
    return "bg-slate-900 text-slate-500 border border-slate-800 border-dashed";
  };

  const getItemsForSlotAndSpec = (slot, spec) => {
    const itemsInSlot = mutableItems.filter(i => i.slot === slot && i.eligible[spec]);
    const bis = itemsInSlot.filter(i => i.eligible[spec] === 'BiS');
    const opt = itemsInSlot.filter(i => i.eligible[spec] === 'Opt');
    return { bis, opt };
  };

  const renderItemSlot = (slotName) => {
    const { bis, opt } = getItemsForSlotAndSpec(slotName, selectedBisSpec);
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
        <div className="w-10 h-10 rounded border border-purple-500/50 bg-slate-950 flex-shrink-0 flex items-center justify-center relative shadow-inner overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent"></div>
           <span className="text-[9px] font-bold text-slate-500 uppercase z-10 rotate-45 opacity-30">{slotName}</span>
        </div>
        <div className="flex flex-col min-w-0 justify-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">{slotName}</span>
          {bis.length > 0 ? (
            bis.map(i => <div key={i.name} className="truncate">{renderItemLink(i, "text-sm font-bold text-purple-400 drop-shadow-sm leading-tight")}</div>)
          ) : ( <span className="text-sm font-bold text-slate-500 italic leading-tight">No primary BiS</span> )}
          {opt.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 items-center">
              <span className="text-[10px] text-amber-500/70 font-semibold uppercase">Alt:</span>
              {opt.map((i, index) => (
                <span key={i.name} className="flex items-center">
                  {renderItemLink(i, "text-[10px] text-slate-400 truncate max-w-[150px]")}
                  {index < opt.length - 1 ? <span className="text-[10px] text-slate-500 ml-0.5">,</span> : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const filteredOverviewItems = useMemo(() => {
    // 1. First get all items that have at least one assignment
    let items = mutableItems.filter(item => {
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

  const PlayerNameWithScore = ({ player }) => (
    <div className="flex items-center gap-2">
      <span className="font-bold text-lg leading-tight drop-shadow-sm" style={{ color: CLASS_COLORS[player.spec] }}>{player.name}</span>
      <span className="bg-amber-900/60 text-amber-400 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 font-bold shadow-inner flex items-center gap-1">
        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
        {calculateScore(player.id)}
      </span>
    </div>
  );

  // ==========================================
  // 7. RENDER SCREENS
  // ==========================================

  // LOADING SCREEN
  if (!isDbConnected) {
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
          
          <div className="flex items-center">
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
          
          {/* Lock down all editing tabs behind authentication */}
          {isAuthenticated && (
            <>
              <button onClick={() => setActiveTab('loot')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'loot' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>Loot Council</button>
              <button onClick={() => setActiveTab('roster')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'roster' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>Roster & Attendance</button>
              <button onClick={() => setActiveTab('scoring')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'scoring' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>Scoring & Config</button>
              <button onClick={() => setActiveTab('bis')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'bis' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>BiS Config</button>
              <button onClick={() => setActiveTab('itemsdb')} className={`whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'itemsdb' ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}>Master Items DB</button>
            </>
          )}
        </div>

        {/* =========================================
            TAB: PRIORITY OVERVIEW (MASTER LEDGER - PUBLIC)
            ========================================= */}
        {activeTab === 'overview' && (
          <section className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredOverviewItems.map(item => {
                  const assignedPlayers = roster.filter(p => typeof assignments[item.name]?.[p.id] === 'number');
                  const sortedAssignedPlayers = assignedPlayers.sort((a, b) => assignments[item.name][a.id] - assignments[item.name][b.id]);
                  return (
                    <div key={item.name} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
                      <div className="bg-slate-900 border-b border-slate-800 p-4">
                         <h3 className="text-lg font-bold text-purple-400 truncate drop-shadow-sm mb-1">
                           {renderItemLink(item)}
                         </h3>
                         <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider"><span>{item.slot}</span><span className="w-1 h-1 rounded-full bg-slate-700"></span><span className="text-amber-500/80">{item.boss}</span></div>
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
                  <div className="flex gap-4 text-sm font-semibold text-slate-300">
                    <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">{selectedItem.slot}</span>
                    <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">{selectedItem.zone}</span>
                  </div>
                </div>

                <div className="p-6">
                  <h4 className="text-sm font-bold mb-4 text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">Council Priority Queue</h4>
                  {sortedEligiblePlayers.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-800"><p className="text-slate-400 font-medium text-sm">None of your active raiders need this item.</p></div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {sortedEligiblePlayers.map(player => {
                        const status = selectedItem.eligible[player.spec]; 
                        const currentPriority = assignments[selectedItem.name]?.[player.id];
                        const playerAlts = mutableItems.filter(i => i.slot === selectedItem.slot && i.eligible[player.spec] && i.name !== selectedItem.name);

                        return (
                          <div key={player.id} className={`flex flex-col p-4 rounded-xl shadow-sm border transition-all duration-300 ${currentPriority === 1 ? 'bg-slate-800/80 border-amber-500/50' : currentPriority === 'Pass' ? 'bg-slate-950/50 border-slate-900 opacity-60' : 'bg-slate-900 border-slate-700'}`}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-inner flex-shrink-0 ${getRankBadgeStyle(currentPriority)}`}>
                                  {typeof currentPriority === 'number' ? currentPriority : (currentPriority === 'Pass' ? '✕' : '-')}
                                </div>
                                <img src={`/icons/${player.spec}.png`} alt="" className="w-10 h-10 rounded border border-slate-600 bg-slate-800 object-cover flex-shrink-0" onError={(e) => { e.target.src = 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg' }} />
                                <div>
                                  <PlayerNameWithScore player={player} />
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{player.spec}</span>
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
                                    <span key={alt.name} className={`text-[10px] px-2 py-1 rounded border shadow-sm flex items-center gap-1 ${alt.eligible[player.spec] === 'BiS' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
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
                <select className="bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 w-full sm:w-auto focus:outline-none cursor-pointer" value={newSpec} onChange={e => setNewSpec(e.target.value)}>
                  {SPECS.map(spec => <option key={spec} value={spec} style={{ color: CLASS_COLORS[spec] }}>{spec}</option>)}
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
                {roster.map(player => (
                  <div key={player.id} className={`group relative flex items-center gap-3 p-3 rounded-lg transition-all duration-200 border cursor-pointer ${player.inRaid ? 'bg-slate-800/80 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-slate-950 border-slate-800 opacity-60 hover:opacity-100'}`} onClick={() => toggleRaidStatus(player.id)}>
                    <div className="relative">
                      <img src={`/icons/${player.spec}.png`} alt="" className="w-10 h-10 rounded border border-slate-700 bg-slate-900 object-cover" onError={(e) => { e.target.src = 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg' }} />
                      {player.inRaid && ( <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full w-4 h-4 flex items-center justify-center border-2 border-slate-800"><svg className="w-2.5 h-2.5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg></div> )}
                    </div>
                    <div className="flex-1 min-w-0 pointer-events-none">
                      <PlayerNameWithScore player={player} />
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate mt-0.5 font-semibold">{player.spec}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleRemovePlayer(player.id); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg">✕</button>
                  </div>
                ))}
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
                        <img src={`/icons/${player.spec}.png`} alt="" className="w-10 h-10 rounded border border-slate-600 bg-slate-800 object-cover" onError={(e) => { e.target.src = 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg' }} />
                        <div><PlayerNameWithScore player={player} /><span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{player.spec}</span></div>
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
                             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Phase 2 Parse Logs</h4>
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
        {activeTab === 'bis' && isAuthenticated && (
          <section className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner">
              <div>
                <h2 className="text-xl font-bold text-slate-100 mb-1">Class Configuration Viewer</h2>
                <p className="text-sm text-slate-500">View primary BiS and alternate options mapped to the paper doll interface.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select Spec:</span>
                <select className="bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 min-w-[200px] focus:outline-none cursor-pointer font-bold style-sm" value={selectedBisSpec} onChange={e => setSelectedBisSpec(e.target.value)} style={{ color: CLASS_COLORS[selectedBisSpec] }}>
                  {SPECS.map(spec => <option key={spec} value={spec} style={{ color: CLASS_COLORS[spec] }}>{spec}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 lg:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                <img src={`/icons/${selectedBisSpec}.png`} alt="" className="w-96 h-96 object-cover filter grayscale blur-sm" onError={(e) => { e.target.style.display = 'none' }} />
              </div>
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-6 max-w-5xl mx-auto">
                <div className="flex flex-col gap-4">{LEFT_SLOTS.map(slot => renderItemSlot(slot))}</div>
                <div className="flex flex-col gap-4">{RIGHT_SLOTS.map(slot => renderItemSlot(slot))}</div>
                <div className="lg:col-span-2 pt-6 mt-2 border-t border-slate-800/80">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{BOTTOM_SLOTS.map(slot => renderItemSlot(slot))}</div>
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
               <input type="text" placeholder="Filter items list..." className="bg-slate-950 text-white border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none w-full sm:w-64 shadow-inner" value={dbSearch} onChange={e => setDbSearch(e.target.value)} />
            </div>
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-inner max-w-full overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="p-3 min-w-[200px] sticky left-0 bg-slate-900 border-r border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">Item & Source</th>
                    <th className="p-3 text-center">Wowhead ID</th>
                    <th className="p-3 text-center">Slot</th>
                    {SPECS.map(spec => (
                      <th key={spec} className="p-2 text-center text-[9px] whitespace-nowrap min-w-[85px]" style={{ color: CLASS_COLORS[spec] }}>{spec}</th>
                    ))}
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs font-medium">
                  {dbFilteredItems.map(item => (
                    <tr key={item.name} className="hover:bg-slate-900/30 group">
                      <td className="p-3 sticky left-0 bg-slate-950 group-hover:bg-slate-900/90 border-r border-slate-800 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.3)] min-w-[200px]">
                        <div className="truncate mb-0.5">{renderItemLink(item, "font-bold text-purple-400")}</div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide truncate block font-semibold">{item.boss} ({item.zone})</span>
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
                      {SPECS.map(spec => {
                        const cellStatus = item.eligible[spec] || '';
                        return (
                          <td key={spec} onClick={() => handleUpdateItemEligibility(item.name, spec, cellStatus)} className={`p-2 border-r border-slate-900 text-center cursor-pointer select-none font-bold uppercase text-[10px] transition-all duration-150 ${cellStatus === 'BiS' ? 'bg-emerald-950/20 text-emerald-400 border-b border-emerald-900' : cellStatus === 'Opt' ? 'bg-amber-950/20 text-amber-500 border-b border-amber-900' : 'text-slate-800 hover:bg-slate-800/30 hover:text-slate-500'}`}>
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