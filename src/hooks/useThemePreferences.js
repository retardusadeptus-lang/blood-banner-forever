import { useEffect, useState } from 'react';
import {
  DEFAULT_THEME_PREFERENCES,
  migrateStoredThemePreferences,
  THEME_STORAGE_KEY,
  THEME_PREFERENCES_VERSION,
  normalizeThemePreferences,
} from '../config/theme';

function readStoredPreferences() {
  try {
    const storedPreferences = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) || '{}');
    return normalizeThemePreferences(migrateStoredThemePreferences(storedPreferences));
  } catch {
    return DEFAULT_THEME_PREFERENCES;
  }
}

export default function useThemePreferences() {
  const [preferences, setPreferences] = useState(readStoredPreferences);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.themePalette = preferences.palette;
    root.dataset.themeFont = preferences.font;
    root.style.colorScheme = 'dark';

    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({
        ...preferences,
        version: THEME_PREFERENCES_VERSION,
      }));
    } catch {
      // Preferences remain active for this session when storage is unavailable.
    }
  }, [preferences]);

  const setPalette = (palette) => {
    setPreferences(current => normalizeThemePreferences({ ...current, palette }));
  };

  const setFont = (font) => {
    setPreferences(current => normalizeThemePreferences({ ...current, font }));
  };

  return {
    ...preferences,
    setPalette,
    setFont,
  };
}
