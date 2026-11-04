export const THEME_STORAGE_KEY = 'blood-banner-theme-preferences';
export const THEME_PREFERENCES_VERSION = 2;

export const THEME_PALETTES = [
  {
    id: 'azure',
    label: 'Azure & Banner',
    description: 'Cool blue accents over a deep slate foundation.',
    swatches: ['#38bdf8', '#0f172a', '#67e8f9'],
  },
  {
    id: 'blood',
    label: 'Blood & Banner',
    description: 'Oxblood surfaces and crimson highlights with a Horde-inspired edge.',
    swatches: ['#dc2626', '#240b10', '#f87171'],
  },
  {
    id: 'classic',
    label: 'Classic Blood & Banner',
    description: 'The original warm amber, slate, and cyan dashboard palette.',
    swatches: ['#f59e0b', '#0f172a', '#22d3ee'],
  },
  {
    id: 'charcoal',
    label: 'Charcoal Banner',
    description: 'A restrained graphite dark mode with cool steel controls.',
    swatches: ['#94a3b8', '#15171c', '#475569'],
  },
  {
    id: 'banter',
    label: 'Blood & Banter',
    description: 'A playful hot-pink, lime, and purple palette for chaotic guild energy.',
    swatches: ['#ff2d75', '#2b0d1b', '#4ade80'],
  },
  {
    id: 'arcane',
    label: 'Arcane Banner',
    description: 'Violet and fuchsia accents beneath a mystical arcane banner.',
    swatches: ['#a78bfa', '#15112f', '#e879f9'],
  },
  {
    id: 'grove',
    label: 'Emerald Banner',
    description: 'Emerald and lime accents beneath a forest-green banner.',
    swatches: ['#34d399', '#09231c', '#bef264'],
  },
  {
    id: 'frost',
    label: 'Frost & Banner',
    description: 'Cool blue accents beneath a crisp frostbound banner.',
    swatches: ['#38bdf8', '#0b1b31', '#67e8f9'],
  },
  {
    id: 'brass',
    label: 'Blood & Brass',
    description: 'Deep red surfaces with polished gold and brass accents.',
    swatches: ['#f59e0b', '#2b1510', '#dc2626'],
  },
  {
    id: 'bone',
    label: 'Banner & Bone',
    description: 'Smoky charcoal, bone-white text, and weathered stone accents.',
    swatches: ['#e7e5e4', '#1c1917', '#78716c'],
  },
  {
    id: 'iron',
    label: 'Blood & Iron',
    description: 'Dark oxblood, umber, and muted iron for a heavier warband mood.',
    swatches: ['#8f241d', '#1b0d0a', '#8a7568'],
  },
  {
    id: 'shadow',
    label: 'Blood & Shadow',
    description: 'Near-black surfaces cut through with deep crimson and scarlet accents.',
    swatches: ['#a20e14', '#030101', '#dc4a4b'],
  },
  {
    id: 'midnight',
    label: 'Midnight & Banner',
    description: 'Deep navy surfaces, steel-grey structure, and muted golden highlights.',
    swatches: ['#d4a72c', '#0c111c', '#4c96cf'],
  },
  {
    id: 'ash',
    label: 'Blood & Ash',
    description: 'Crimson accents over charcoal-grey surfaces with ash-white contrast.',
    swatches: ['#b91c1c', '#17191d', '#f2f3f5'],
  },
];

export const THEME_FONTS = [
  {
    id: 'system',
    label: 'Modern System',
    description: 'Clean system sans-serif typography.',
  },
  {
    id: 'editorial',
    label: 'Guild Chronicle',
    description: 'Readable serif typography for an editorial feel.',
  },
  {
    id: 'tactical',
    label: 'Tactical Mono',
    description: 'Compact monospace typography for a technical interface.',
  },
  {
    id: 'warband',
    label: 'Warband Condensed',
    description: 'A narrow, forceful sans-serif style for battle-ready dashboards.',
  },
  {
    id: 'runestone',
    label: 'Runestone Serif',
    description: 'A carved, old-world serif style for a fantasy chronicle feel.',
  },
  {
    id: 'scribe',
    label: 'Guild Scribe',
    description: 'A friendly humanist sans-serif with a hand-crafted guild-hall feel.',
  },
  {
    id: 'typewriter',
    label: 'War Room Typewriter',
    description: 'A broad monospaced style inspired by campaign notes and field reports.',
  },
];

export const DEFAULT_THEME_PREFERENCES = {
  palette: 'azure',
  font: 'system',
};

const paletteIds = new Set(THEME_PALETTES.map(({ id }) => id));
const fontIds = new Set(THEME_FONTS.map(({ id }) => id));

export function normalizeThemePreferences(value) {
  return {
    palette: paletteIds.has(value?.palette) ? value.palette : DEFAULT_THEME_PREFERENCES.palette,
    font: fontIds.has(value?.font) ? value.font : DEFAULT_THEME_PREFERENCES.font,
  };
}

export function migrateStoredThemePreferences(value) {
  if (!value || typeof value !== 'object') return value;
  if (value.version === THEME_PREFERENCES_VERSION) return value;

  return {
    ...value,
    palette: value.palette === 'blood' ? 'azure' : value.palette,
    version: THEME_PREFERENCES_VERSION,
  };
}
