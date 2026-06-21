// ============================================================
// GUILD LOOT SYSTEM - CODES, PHASES, & CLASS CONFIGURATIONS
// ============================================================

export const PHASES = ["Pre-BiS", "T4", "T5", "T6", "ZA", "SWP"];

export const PHASE_JSON_KEYS = { 
  "Pre-BiS": "pre-bis", 
  "T4": "t4", 
  "T5": "t5", 
  "T6": "t6", 
  "ZA": "za", 
  "SWP": "swp" 
};

export const LEFT_SLOTS = ["Head", "Neck", "Shoulder", "Back", "Chest", "Wrist"];

export const RIGHT_SLOTS = ["Hands", "Waist", "Legs", "Feet", "Ring 1", "Ring 2", "Trinket 1", "Trinket 2"];

export const BOTTOM_SLOTS = ["Main Hand", "Off Hand", "Shield", "Ranged", "Wand", "Totem", "Libram", "Idol"];

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
export const RAID_GROUPS = ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5'];

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
    bosses: ["Al'ar", "Void Reaver", "High Astromancer Solarian", "Kael'thas Sunstrider"] 
  },
  { 
    name: "SSC", 
    bosses: ["Hydross the Unstable", "The Lurker Below", "Leotheras the Blind", "Fathom-Lord Karathress", "Morogrim Tidewalker", "Lady Vashj"] 
  },
  { 
    name: "Gruul / Mag", 
    bosses: ["High King Maulgar", "Gruul the Dragonkiller", "Magtheridon"] 
  }
];