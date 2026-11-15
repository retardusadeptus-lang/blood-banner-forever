export const THEME_STORAGE_KEY = 'blood-banner-theme-preferences';
export const THEME_PREFERENCES_VERSION = 3;

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

export const THEME_COLOR_GROUPS = [
  {
    id: 'surfaces',
    label: 'Surfaces and borders',
  },
  {
    id: 'text',
    label: 'Text',
  },
  {
    id: 'accents',
    label: 'Accents and states',
  },
  {
    id: 'navigation',
    label: 'Navigation',
  },
];

export const THEME_COLOR_CONTROLS = [
  {
    id: 'deepBackground',
    group: 'surfaces',
    label: 'Deep background',
    description: 'Page backgrounds and the darkest surfaces.',
    cssVariable: '--color-slate-950',
    fallback: '#020617',
  },
  {
    id: 'panelSurface',
    group: 'surfaces',
    label: 'Panel surface',
    description: 'Main panels and raised content surfaces.',
    cssVariable: '--color-slate-900',
    fallback: '#0f172a',
  },
  {
    id: 'border',
    group: 'surfaces',
    label: 'Borders and dividers',
    description: 'Panel borders, dividers, and secondary surface contrast.',
    cssVariable: '--color-slate-800',
    fallback: '#1e293b',
  },
  {
    id: 'fieldBorder',
    group: 'surfaces',
    label: 'Field borders',
    description: 'Input borders and interactive field contrast.',
    cssVariable: '--color-slate-700',
    fallback: '#334155',
  },
  {
    id: 'headingText',
    group: 'text',
    label: 'Heading text',
    description: 'Bright headings and primary labels.',
    cssVariable: '--color-slate-100',
    fallback: '#f1f5f9',
  },
  {
    id: 'bodyText',
    group: 'text',
    label: 'Body text',
    description: 'Readable content and standard labels.',
    cssVariable: '--color-slate-200',
    fallback: '#e2e8f0',
  },
  {
    id: 'mutedText',
    group: 'text',
    label: 'Muted text',
    description: 'Secondary descriptions and supporting copy.',
    cssVariable: '--color-slate-400',
    fallback: '#94a3b8',
  },
  {
    id: 'subtleText',
    group: 'text',
    label: 'Subtle text',
    description: 'Hints, metadata, and low-emphasis copy.',
    cssVariable: '--color-slate-500',
    fallback: '#64748b',
  },
  {
    id: 'primaryAccent',
    group: 'accents',
    label: 'Primary accent',
    description: 'Primary actions, links, and highlighted navigation.',
    cssVariable: '--color-amber-500',
    fallback: '#f59e0b',
  },
  {
    id: 'primaryStrongAccent',
    group: 'accents',
    label: 'Strong primary accent',
    description: 'Filled primary buttons and stronger accent surfaces.',
    cssVariable: '--color-amber-600',
    fallback: '#d97706',
  },
  {
    id: 'secondaryAccent',
    group: 'accents',
    label: 'Secondary accent',
    description: 'Information actions and secondary highlights.',
    cssVariable: '--color-cyan-400',
    fallback: '#22d3ee',
  },
  {
    id: 'success',
    group: 'accents',
    label: 'Success',
    description: 'Successful states and confirmation indicators.',
    cssVariable: '--color-emerald-500',
    fallback: '#10b981',
  },
  {
    id: 'danger',
    group: 'accents',
    label: 'Danger',
    description: 'Destructive actions and warning states.',
    cssVariable: '--color-red-600',
    fallback: '#dc2626',
  },
  {
    id: 'navDefault',
    group: 'navigation',
    label: 'Default navigation',
    description: 'Subtab links that are not active or restricted.',
    cssVariable: '--theme-nav-subitem-default',
    fallback: '#fcd34d',
  },
  {
    id: 'navActive',
    group: 'navigation',
    label: 'Active navigation',
    description: 'The currently selected subtab.',
    cssVariable: '--theme-nav-subitem-active',
    fallback: '#22d3ee',
  },
  {
    id: 'navAdmin',
    group: 'navigation',
    label: 'Admin navigation',
    description: 'Subtabs restricted to administrators.',
    cssVariable: '--theme-nav-subitem-admin',
    fallback: '#f9a8d4',
  },
  {
    id: 'navOfficer',
    group: 'navigation',
    label: 'Officer navigation',
    description: 'Subtabs restricted to officers.',
    cssVariable: '--theme-nav-subitem-officer',
    fallback: '#c4b5fd',
  },
];

export const DEFAULT_THEME_PREFERENCES = {
  palette: 'azure',
  font: 'system',
  colors: {},
};

const paletteIds = new Set(THEME_PALETTES.map(({ id }) => id));
const fontIds = new Set(THEME_FONTS.map(({ id }) => id));
const hexColorPattern = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}(?:[0-9a-f]{2})?)$/i;

export function normalizeThemeColor(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return hexColorPattern.test(normalized) ? normalized : null;
}

export function normalizeThemeColors(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return THEME_COLOR_CONTROLS.reduce((colors, { id }) => {
    const color = normalizeThemeColor(value[id]);
    if (color) colors[id] = color;
    return colors;
  }, {});
}

export function normalizeThemePreferences(value, fallback = DEFAULT_THEME_PREFERENCES) {
  const normalizedFallback = {
    palette: paletteIds.has(fallback?.palette) ? fallback.palette : DEFAULT_THEME_PREFERENCES.palette,
    font: fontIds.has(fallback?.font) ? fallback.font : DEFAULT_THEME_PREFERENCES.font,
    colors: normalizeThemeColors(fallback?.colors),
  };
  const hasColors = Boolean(value && typeof value === 'object' && !Array.isArray(value) && Object.prototype.hasOwnProperty.call(value, 'colors'));
  return {
    palette: paletteIds.has(value?.palette) ? value.palette : normalizedFallback.palette,
    font: fontIds.has(value?.font) ? value.font : normalizedFallback.font,
    colors: hasColors ? normalizeThemeColors(value.colors) : normalizedFallback.colors,
  };
}

export function migrateStoredThemePreferences(value) {
  if (!value || typeof value !== 'object') return value;
  if (value.version === THEME_PREFERENCES_VERSION) return value;

  return {
    ...value,
    palette: value.version === 2 ? value.palette : value.palette === 'blood' ? 'azure' : value.palette,
    colors: normalizeThemeColors(value.colors),
    version: THEME_PREFERENCES_VERSION,
  };
}
