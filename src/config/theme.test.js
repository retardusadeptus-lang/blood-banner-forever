import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_THEME_PREFERENCES,
  migrateStoredThemePreferences,
  THEME_COLOR_CONTROLS,
  THEME_FONTS,
  THEME_PALETTES,
  normalizeThemePreferences
} from './theme.js';

test('theme definitions expose unique selectable palette and font ids', () => {
  const paletteIds = THEME_PALETTES.map(palette => palette.id);
  const fontIds = THEME_FONTS.map(font => font.id);
  const colorIds = THEME_COLOR_CONTROLS.map(control => control.id);
  const colorVariables = THEME_COLOR_CONTROLS.map(control => control.cssVariable);

  assert.equal(new Set(paletteIds).size, paletteIds.length);
  assert.equal(new Set(fontIds).size, fontIds.length);
  assert.equal(new Set(colorIds).size, colorIds.length);
  assert.equal(new Set(colorVariables).size, colorVariables.length);
  assert.ok(THEME_PALETTES.every(palette => palette.label && palette.description));
  assert.ok(THEME_FONTS.every(font => font.label && font.description));
  assert.ok(THEME_COLOR_CONTROLS.every(control => control.label && control.description && control.fallback));
  assert.ok(THEME_FONTS.some(font => font.label === 'Warband Condensed'));
  assert.ok(THEME_FONTS.some(font => font.label === 'Runestone Serif'));
  assert.ok(THEME_FONTS.some(font => font.label === 'Guild Scribe'));
  assert.ok(THEME_FONTS.some(font => font.label === 'War Room Typewriter'));
  assert.ok(THEME_PALETTES.some(palette => palette.label === 'Azure & Banner'));
  assert.ok(THEME_PALETTES.some(palette => palette.label === 'Blood & Banner'));
  assert.ok(THEME_PALETTES.some(palette => palette.label === 'Classic Blood & Banner'));
  assert.ok(THEME_PALETTES.some(palette => palette.label === 'Charcoal Banner'));
  assert.ok(THEME_PALETTES.some(palette => palette.label === 'Blood & Banter'));
  assert.ok(THEME_PALETTES.some(palette => palette.label === 'Arcane Banner'));
  assert.ok(THEME_PALETTES.some(palette => palette.label === 'Emerald Banner'));
  assert.ok(THEME_PALETTES.some(palette => palette.label === 'Frost & Banner'));
  assert.ok(THEME_PALETTES.some(palette => palette.label === 'Blood & Brass'));
  assert.ok(THEME_PALETTES.some(palette => palette.label === 'Banner & Bone'));
  assert.ok(THEME_PALETTES.some(palette => palette.label === 'Blood & Iron'));
  assert.ok(THEME_PALETTES.some(palette => palette.label === 'Blood & Shadow'));
  assert.ok(THEME_PALETTES.some(palette => palette.label === 'Midnight & Banner'));
  assert.ok(THEME_PALETTES.some(palette => palette.label === 'Blood & Ash'));
});

test('theme preferences preserve valid choices and normalize invalid values', () => {
  assert.deepEqual(
    normalizeThemePreferences({ palette: 'arcane', font: 'tactical' }),
    { palette: 'arcane', font: 'tactical', colors: {} }
  );
  assert.deepEqual(
    normalizeThemePreferences({ palette: 'unknown', font: null }),
    DEFAULT_THEME_PREFERENCES
  );
  assert.deepEqual(normalizeThemePreferences(null), DEFAULT_THEME_PREFERENCES);
});

test('theme preferences can normalize against administrator defaults', () => {
  assert.deepEqual(
    normalizeThemePreferences({ palette: 'unknown', font: null }, { palette: 'blood', font: 'scribe' }),
    { palette: 'blood', font: 'scribe', colors: {} }
  );
});

test('theme preferences normalize valid granular colour overrides', () => {
  assert.deepEqual(
    normalizeThemePreferences({
      palette: 'arcane',
      font: 'tactical',
      colors: {
        deepBackground: '#ABCDEF',
        navActive: '#12345678',
        unknown: '#ffffff',
        bodyText: 'rgb(1, 2, 3)',
      },
    }),
    {
      palette: 'arcane',
      font: 'tactical',
      colors: {
        deepBackground: '#abcdef',
        navActive: '#12345678',
      },
    }
  );
});

test('legacy theme preferences migrate to the current storage version', () => {
  assert.deepEqual(
    migrateStoredThemePreferences({ palette: 'blood', font: 'system' }),
    { palette: 'azure', font: 'system', colors: {}, version: 3 }
  );
  assert.deepEqual(
    migrateStoredThemePreferences({ palette: 'blood', font: 'system', version: 2 }),
    { palette: 'blood', font: 'system', colors: {}, version: 3 }
  );
  assert.deepEqual(
    migrateStoredThemePreferences({
      palette: 'blood',
      font: 'system',
      colors: { navActive: '#ABCDEF', unknown: '#ffffff' },
      version: 2,
    }),
    { palette: 'blood', font: 'system', colors: { navActive: '#abcdef' }, version: 3 }
  );
});
