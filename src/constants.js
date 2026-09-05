// ============================================================
// GUILD LOOT SYSTEM - CODES, PHASES, & CLASS CONFIGURATIONS
// ============================================================

export const PHASES = ["Pre-BiS", "T4", "T5", "T6", "ZA", "SWP"];

const configuredDefaultPhase = String(import.meta.env?.VITE_DEFAULT_PHASE || '').trim();
export const DEFAULT_GLOBAL_PHASE = PHASES.includes(configuredDefaultPhase) ? configuredDefaultPhase : 'T6';
export const CORE_SYNC_INTERVAL_MS = 15000;
export const STORAGE_KEYS = {
  activeTab: 'active-tab',
  myPlayerId: 'my-player-id',
  raidAssignmentsBossFilter: 'raid-assignments-user-boss-filter',
  tacticsBossFilter: 'tactics-user-boss-filter',
};

export const PHASE_JSON_KEYS = { 
  "Pre-BiS": "pre-bis", 
  "T4": "t4", 
  "T5": "t5", 
  "T6": "t6", 
  "ZA": "za", 
  "SWP": "swp" 
};

export const CHEAT_SHEET_PHASE_MAP = {
  1: 'Pre-BiS',
  2: 'T4',
  3: 'T5',
  4: 'T6',
  5: 'ZA',
  9: 'SWP',
};

export const LEFT_SLOTS = ["Head", "Neck", "Shoulder", "Back", "Chest", "Wrist"];

export const RIGHT_SLOTS = ["Hands", "Waist", "Legs", "Feet", "Ring 1", "Ring 2", "Trinket 1", "Trinket 2"];

export const BOTTOM_SLOTS = ["Weapon", "Main Hand", "Off Hand", "Shield", "Ranged", "Wand", "Totem", "Libram", "Idol"];

export const P2_BOSSES = [
  "Hydross the Unstable", "The Lurker Below", "Leotheras the Blind", "Fathom-Lord Karathress",
  "Morogrim Tidewalker", "Lady Vashj", "Al'ar", "Void Reaver", "High Astromancer Solarian", "Kael'thas"
];

export const CATEGORY_MAP = {
  'Consumable': 'Consumable',
  'Trade Goods': 'Materials',
  'Item Enhancement': 'Materials',
  'Gem': 'Materials',
  'Armor': 'Gear',
  'Weapon': 'Gear',
  'Recipe': 'Recipe'
};

// ==========================================
// RAID ASSIGNMENTS CONSTANTS
// ==========================================
export const RAID_MARKERS = [
  { id: 'skull', label: 'Skull', glyph: '💀', color: '#ffffff' },
  { id: 'cross', label: 'Cross', glyph: '✖', color: '#ff1111' },
  { id: 'square', label: 'Square', glyph: '■', color: '#00ccff' },
  { id: 'moon', label: 'Moon', glyph: '🌙', color: '#aaaaaa' },
  { id: 'triangle', label: 'Triangle', glyph: '▲', color: '#22ff22' },
  { id: 'diamond', label: 'Diamond', glyph: '♦', color: '#ff22ff' },
  { id: 'circle', label: 'Circle', glyph: '●', color: '#ffaa00' },
  { id: 'star', label: 'Star', glyph: '★', color: '#ffff00' }
];

export const BOSS_TARGET_ID = '__boss__';
export const RAID_WIDE_LABEL = 'Raid';
export const RAID_GROUPS = ['Tanks','Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5'];

const ILLIDARI_COUNCIL_DEFAULTS = {
  phaseCount: 1,
  phases: ["Phase 1: Boss Fight"],
  targets: [
    { name: "Gathios the Shatterer", count: 1 },
    { name: "High Nethermancer Zerevor", count: 1 },
    { name: "Lady Malande", count: 1 },
    { name: "Veras Darkshadow", count: 1 }
  ]
};

const HEX_LORD_MALACRASS_DEFAULTS = {
  phaseCount: 1,
  phases: ["Phase 1: Boss Fight"],
  targets: [
    { name: "Alyson Antille", count: 1 },
    { name: "Blood Worm", count: 1 },
    { name: "Darkheart", count: 1 },
    { name: "Fenstalker", count: 1 },
    { name: "Gazakroth", count: 1 },
    { name: "Koragg", count: 1 },
    { name: "Lord Raadar", count: 1 },
    { name: "Slither", count: 1 },
    { name: "Thurg", count: 1 }
  ]
};

export const DEFAULT_BOSS_ENCOUNTERS = {
  "High King Maulgar": {
    phaseCount: 1,
    phases: ["Phase 1: Maulgar and Council"],
    targets: [
      { name: "Kiggler the Crazed", count: 1 },
      { name: "Blindeye the Seer", count: 1 },
      { name: "Olm the Summoner", count: 1 },
      { name: "Krosh Firehand", count: 1 },
      { name: "Fel Hunter", count: 1 }
    ]
  },
  "Gruul the Dragonkiller": {
    phaseCount: 2,
    phases: ["Phase 1: Normal Form", "Phase 2: Growth"],
    targets: []
  },
  "Hydross the Unstable": {
    phaseCount: 2,
    phases: ["Phase 1: Water Phase", "Phase 2: Nature Phase"],
    targets: [
      { name: "Pure Spawn of Hydross", count: 1 },
      { name: "Tainted Spawn of Hydross", count: 2 }
    ]
  },
  "The Lurker Below": {
    phaseCount: 2,
    phases: ["Phase 1: Emerged Phase", "Phase 2: Submerged Phase"],
    targets: [
      { name: "Coilfang Ambusher", count: 2 },
      { name: "Coilfang Guardian", count: 2 }
    ]
  },
  "Leotheras the Blind": {
    phaseCount: 2,
    phases: ["Phase 1: Human Form", "Phase 2: Demon Form"],
    targets: [
      { name: "Inner Demon", count: 2 }
    ]
  },
  "Fathom-Lord Karathress": {
    phaseCount: 1,
    phases: ["Phase 1: Boss Fight"],
    targets: [
      { name: "Fathom-Guard Tidalvess", count: 1 },
      { name: "Fathom-Guard Sharkkis", count: 1 },
      { name: "Fathom-Guard Caribdis", count: 1 },
      { name: "Lurker/Sporebat", count: 1 }
    ]
  },
  "Morogrim Tidewalker": {
    phaseCount: 1,
    phases: ["Phase 1: Boss Fight"],
    targets: [
      { name: "Tidewalker Lurker", count: 1 }
    ]
  },
  "Lady Vashj": {
    phaseCount: 3,
    phases: ["Phase 1: Initial Burn", "Phase 2: Shield and Adds", "Phase 3: Final Burn"],
    targets: [
      { name: "Coilfang Elite", count: 2 },
      { name: "Coilfang Strider", count: 2 },
      { name: "Enchanted Elemental", count: 2 },
      { name: "Tainted Elemental", count: 2 },
      { name: "Toxic Sporebat", count: 3 }
    ]
  },
  "Al'ar": {
    phaseCount: 2,
    phases: ["Phase 1: Platform Phase", "Phase 2: Center Room Phase"],
    targets: [
      { name: "Ember of Al'ar", count: 2 }
    ]
  },
  "Void Reaver": {
    phaseCount: 1,
    phases: ["Phase 1: Boss Fight"],
    targets: []
  },
  "High Astromancer Solarian": {
    phaseCount: 2,
    phases: ["Phase 1: Boss and Adds", "Phase 2: Voidwalker"],
    targets: [
      { name: "Solarian Agent", count: 1 },
      { name: "Solarian Priest", count: 2 }
    ]
  },
  "Kael'thas Sunstrider": {
    phaseCount: 5,
    phases: [
      "Phase 1: Advisors",
      "Phase 2: Weapons",
      "Phase 3: Advisors Resurrected",
      "Phase 4: Kael'thas Ground Phase",
      "Phase 5: Kael'thas Air Phase"
    ],
    targets: [
      { name: "Thaladred the Darkener", count: 2 },
      { name: "Lord Sanguinar", count: 2 },
      { name: "Grand Astromancer Capernian", count: 2 },
      { name: "Master Engineer Telonicus", count: 2 },
      { name: "Devastator", count: 2 },
      { name: "Cosmic Infuser", count: 2 },
      { name: "Infinity Blade", count: 2 },
      { name: "Warp Slicer", count: 2 },
      { name: "Phaseshift Bulwark", count: 2 },
      { name: "Staff of Disintegration", count: 2 },
      { name: "Netherstrand Longbow", count: 2 },
      { name: "Phoenix", count: 2 },
      { name: "Phoenix Egg", count: 2 }
    ]
  },
  "Rage Winterchill": {
    phaseCount: 1,
    phases: ["Phase 1: Boss Fight"],
    targets: []
  },
  "Anetheron": {
    phaseCount: 1,
    phases: ["Phase 1: Boss Fight"],
    targets: [
      { name: "Towering Infernal", count: 1 }
    ]
  },
  "Kaz'rogal": {
    phaseCount: 1,
    phases: ["Phase 1: Boss Fight"],
    targets: []
  },
  "Azgalor": {
    phaseCount: 1,
    phases: ["Phase 1: Boss Fight"],
    targets: [
      { name: "Lesser Doomguard", count: 1 }
    ]
  },
  "Archimonde": {
    phaseCount: 1,
    phases: ["Phase 1: Boss Fight"],
    targets: []
  },
  "High Warlord Naj'entus": {
    phaseCount: 2,
    phases: ["Phase 1: Normal Phase", "Phase 2: Tidal Shield Phase"],
    targets: []
  },
  "Supremus": {
    phaseCount: 2,
    phases: ["Phase 1: Strike Phase", "Phase 2: Kite Phase"],
    targets: []
  },
  "Shade of Akama": {
    phaseCount: 2,
    phases: ["Phase 1: Channeler Phase", "Phase 2: Boss Burn Phase"],
    targets: [
      { name: "Ashtongue Channeler", count: 1 },
      { name: "Ashtongue Defender", count: 1 },
      { name: "Ashtongue Elementalist", count: 1 },
      { name: "Ashtongue Rogue", count: 1 },
      { name: "Ashtongue Sorcerer", count: 1 },
      { name: "Ashtongue Spiritbinder", count: 1 }
    ]
  },
  "Teron Gorefiend": {
    phaseCount: 1,
    phases: ["Phase 1: Main Encounter"],
    targets: [
      { name: "Shadowy Construct", count: 1 }
    ]
  },
  "Gurtogg Bloodboil": {
    phaseCount: 2,
    phases: ["Phase 1: Acidic Wound Phase", "Phase 2: Fel Rage Phase"],
    targets: []
  },
  "Reliquary of Souls": {
    phaseCount: 3,
    phases: ["Phase 1: Essence of Suffering", "Phase 2: Essence of Desire", "Phase 3: Essence of Anger"],
    targets: [
      { name: "Enslaved Soul", count: 1 }
    ]
  },
  "Mother Shahraz": {
    phaseCount: 1,
    phases: ["Phase 1: Boss Fight"],
    targets: []
  },
  "The Illidari Council": ILLIDARI_COUNCIL_DEFAULTS,
  "Illidari Council": ILLIDARI_COUNCIL_DEFAULTS,
  "Illidan Stormrage": {
    phaseCount: 5,
    phases: [
      "Phase 1: Human Phase",
      "Phase 2: Flames of Azzinoth",
      "Phase 3: Demon Form",
      "Phase 4: Shadow Demon",
      "Phase 5: Enrage"
    ],
    targets: [
      { name: "Flame of Azzinoth", count: 2 },
      { name: "Parasitic Shadowfiend", count: 3 },
      { name: "Shadow Demon", count: 4 }
    ]
  },
  "Nalorakk": {
    phaseCount: 2,
    phases: ["Phase 1: Troll Form", "Phase 2: Bear Form"],
    targets: []
  },
  "Akil'zon": {
    phaseCount: 1,
    phases: ["Phase 1: Boss Fight"],
    targets: [
      { name: "Amani Eagle", count: 1 }
    ]
  },
  "Jan'alai": {
    phaseCount: 1,
    phases: ["Phase 1: Boss Fight"],
    targets: [
      { name: "Amani Acolyte", count: 1 },
      { name: "Amani Hatchling", count: 1 }
    ]
  },
  "Halazzi": {
    phaseCount: 2,
    phases: ["Phase 1: Merged Form", "Phase 2: Split Form"],
    targets: [
      { name: "Lynx Spirit", count: 2 }
    ]
  },
  "Hexxlord Jin'zakk": HEX_LORD_MALACRASS_DEFAULTS,
  "Hex Lord Malacrass": HEX_LORD_MALACRASS_DEFAULTS,
  "Zul'jin": {
    phaseCount: 5,
    phases: [
      "Phase 1: Troll Form",
      "Phase 2: Bear Form",
      "Phase 3: Eagle Form",
      "Phase 4: Lynx Form",
      "Phase 5: Dragonhawk Form"
    ],
    targets: []
  },
  "Kalecgos": {
    phaseCount: 2,
    phases: ["Phase 1: Physical Realm", "Phase 2: Demon Realm"],
    targets: [
      { name: "Sathrovarr the Corruptor", count: 2 }
    ]
  },
  "Brutallus": {
    phaseCount: 1,
    phases: ["Phase 1: Boss Fight"],
    targets: []
  },
  "Felmyst": {
    phaseCount: 2,
    phases: ["Phase 1: Ground Phase", "Phase 2: Air Phase"],
    targets: [
      { name: "Unyielding Dead", count: 2 }
    ]
  },
  "Eredar Twins": {
    phaseCount: 2,
    phases: ["Phase 1: Twin Phase", "Phase 2: Empowered Phase"],
    targets: [
      { name: "Shadow Image", count: 2 }
    ]
  },
  "M'uru": {
    phaseCount: 2,
    phases: ["Phase 1: Void Phase", "Phase 2: Entropius Phase"],
    targets: [
      { name: "Dark Fiend", count: 1 },
      { name: "Entropius", count: 2 },
      { name: "Shadowsword Berserker", count: 1 },
      { name: "Shadowsword Fury Mage", count: 1 },
      { name: "Void Sentinel", count: 1 },
      { name: "Void Spawn", count: 1 }
    ]
  },
  "Kil'jaeden": {
    phaseCount: 5,
    phases: [
      "Phase 1: Deceivers Phase",
      "Phase 2: Kil'jaeden Emerges",
      "Phase 3: Darkness Phase",
      "Phase 4: Dragon Orbs Phase",
      "Phase 5: Final Burn"
    ],
    targets: [
      { name: "Hand of the Deceiver", count: 1 },
      { name: "Shield Orb", count: 4 },
      { name: "Sinister Reflection", count: 2 }
    ]
  }
};

export const CURSE_TYPES = [
  "Elements",
  "Recklessness",
  "Tongues",
  "Doom",
  "Agony",
  "Weakness",
  "Custom"
];

export const JUDGEMENT_TYPES = [
  "Wisdom",
  "Light",
  "Justice",
  "Crusader",
  "Custom"
];

export const RAID_ZONES = [
  { 
    name: "Tempest Keep", 
    bosses: ["Trash before Al'ar", "Al'ar", "Trash before Void Reaver", "Void Reaver", "Trash before High Astromancer Solarian", "High Astromancer Solarian", "Trash before Kael'thas Sunstrider", "Kael'thas Sunstrider"] 
  },
  { 
    name: "Serpentshrine Cavern", 
    bosses: ["Trash before Hydross the Unstable", "Hydross the Unstable", "Trash before The Lurker Below", "The Lurker Below", "Trash before Leotheras the Blind", "Leotheras the Blind", "Trash before Fathom-Lord Karathress", "Fathom-Lord Karathress", "Trash before Morogrim Tidewalker", "Morogrim Tidewalker", "Trash before Lady Vashj", "Lady Vashj"] 
  },
  { 
    name: "Gruul's Lair", 
    bosses: ["Trash before High King Maulgar", "High King Maulgar", "Trash before Gruul the Dragonkiller", "Gruul the Dragonkiller"] 
  },
  { 
    name: "Magtheridon's Lair", 
    bosses: ["Trash before Magtheridon", "Magtheridon"] 
  },
  { 
    name: "Battle for Mount Hyjal", 
    bosses: ["Trash before Rage Winterchill", "Rage Winterchill", "Trash before Anetheron", "Anetheron", "Trash before Kaz'rogal", "Kaz'rogal", "Trash before Azgalor", "Azgalor", "Trash before Archimonde", "Archimonde"] 
  },
  { 
    name: "Black Temple", 
    bosses: ["Trash before High Warlord Naj'entus", "High Warlord Naj'entus", "Trash before Supremus", "Supremus", "Trash before Shade of Akama", "Shade of Akama", "Trash before Teron Gorefiend", "Teron Gorefiend", "Trash before Gurtogg Bloodboil", "Gurtogg Bloodboil", "Trash before Reliquary of Souls", "Reliquary of Souls", "Trash before Mother Shahraz", "Mother Shahraz", "Trash before Illidari Council", "Illidari Council", "Trash before Illidan Stormrage", "Illidan Stormrage"] 
  },
  { 
    name: "Zul'Aman", 
    bosses: ["Trash before Akil'zon", "Akil'zon", "Trash before Nalorakk", "Nalorakk", "Trash before Jan'alai", "Jan'alai", "Trash before Halazzi", "Halazzi", "Trash before Hexxlord Jin'zakk", "Hexxlord Jin'zakk", "Trash before Zul'jin", "Zul'jin"] 
  },
  { 
    name: "Sunwell Plateau", 
    bosses: ["Trash before Kalecgos", "Kalecgos", "Trash before Sathrovarr", "Sathrovarr", "Trash before Brutallus", "Brutallus", "Trash before Felmyst", "Felmyst", "Trash before Alythess", "Alythess", "Trash before Sacrolash", "Sacrolash", "Trash before M'uru", "M'uru", "Trash before Entropius", "Entropius", "Trash before Kil'jaeden", "Kil'jaeden"] 
  }
];