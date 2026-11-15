import { useEffect, useState } from 'react';
import {
  DEFAULT_THEME_PREFERENCES,
  migrateStoredThemePreferences,
  THEME_STORAGE_KEY,
  THEME_PREFERENCES_VERSION,
  THEME_COLOR_CONTROLS,
  normalizeThemePreferences,
} from '../config/theme';

function readStoredPreferences(defaultPreferences) {
  const normalizedDefaults = normalizeThemePreferences(defaultPreferences);
  try {
    const storedValue = localStorage.getItem(THEME_STORAGE_KEY);
    if (!storedValue) {
      return { preferences: normalizedDefaults, userCustomized: false };
    }

    const storedPreferences = migrateStoredThemePreferences(JSON.parse(storedValue));
    if (!storedPreferences || typeof storedPreferences !== 'object' || Array.isArray(storedPreferences)) {
      return { preferences: normalizedDefaults, userCustomized: false };
    }

    return {
      preferences: normalizeThemePreferences(storedPreferences),
      userCustomized: storedPreferences.preferenceSource !== 'default',
    };
  } catch {
    return { preferences: normalizedDefaults, userCustomized: false };
  }
}

export default function useThemePreferences({ defaultPreferences = DEFAULT_THEME_PREFERENCES } = {}) {
  const normalizedDefaults = normalizeThemePreferences(defaultPreferences);
  const [storedPreferences] = useState(() => readStoredPreferences(normalizedDefaults));
  const [preferences, setPreferences] = useState(storedPreferences.preferences);
  const [userCustomized, setUserCustomized] = useState(storedPreferences.userCustomized);
  const effectivePalette = userCustomized ? preferences.palette : normalizedDefaults.palette;
  const effectiveFont = userCustomized ? preferences.font : normalizedDefaults.font;
  const effectivePreferences = {
    palette: effectivePalette,
    font: effectiveFont,
    colors: preferences.colors,
  };

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.themePalette = effectivePalette;
    root.dataset.themeFont = effectiveFont;
    root.style.colorScheme = 'dark';
    THEME_COLOR_CONTROLS.forEach(({ id, cssVariable }) => {
      const color = effectivePreferences.colors[id];
      if (color) {
        root.style.setProperty(cssVariable, color);
      } else {
        root.style.removeProperty(cssVariable);
      }
    });

    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({
        palette: effectivePalette,
        font: effectiveFont,
        colors: effectivePreferences.colors,
        version: THEME_PREFERENCES_VERSION,
        preferenceSource: userCustomized ? 'user' : 'default',
      }));
    } catch {
      // Preferences remain active for this session when storage is unavailable.
    }
  }, [effectivePalette, effectiveFont, effectivePreferences.colors, userCustomized]);

  const setPalette = (palette) => {
    setUserCustomized(true);
    setPreferences(() => normalizeThemePreferences({ ...effectivePreferences, palette }));
  };

  const setFont = (font) => {
    setUserCustomized(true);
    setPreferences(() => normalizeThemePreferences({ ...effectivePreferences, font }));
  };

  const setColor = (colorId, color) => {
    setPreferences(previous => normalizeThemePreferences({
      ...previous,
      colors: {
        ...previous.colors,
        [colorId]: color,
      },
    }));
  };

  const resetColors = () => {
    setPreferences(previous => ({ ...previous, colors: {} }));
  };

  return {
    ...effectivePreferences,
    setPalette,
    setFont,
    setColor,
    resetColors,
  };
}
