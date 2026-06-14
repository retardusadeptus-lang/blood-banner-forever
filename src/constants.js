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

export const SPECS = [
  "Prot Warrior", "Arms Warrior", "Fury Warrior", "Prot Paladin", "Holy Paladin",
  "Ret Paladin", "BM Hunter", "MM Hunter", "Survival Hunter", "Elemental Shaman",
  "Enhance Shaman", "Resto Shaman", "Balance Druid", "Feral (Tank)", "Feral (DPS)",
  "Resto Druid", "Combat Rogue", "Holy Priest", "Discipline Priest", "Shadow Priest",
  "Arcane Mage", "Fire Mage", "Frost Mage", "Destro Warlock", "Demo Warlock", "Affliction Warlock"
];

export const CLASS_COLORS = {
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