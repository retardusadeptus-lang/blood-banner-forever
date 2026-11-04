import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_THEME_PREFERENCES,
  migrateStoredThemePreferences,
  THEME_FONTS,
  THEME_PALETTES,
  normalizeThemePreferences
} from './theme.js';

test('theme definitions expose unique selectable palette and font ids', () => {
  const paletteIds = THEME_PALETTES.map(palette => palette.id);
  const fontIds = THEME_FONTS.map(font => font.id);

  assert.equal(new Set(paletteIds).size, paletteIds.length);
  assert.equal(new Set(fontIds).size, fontIds.length);
  assert.ok(THEME_PALETTES.every(palette => palette.label && palette.description));
  assert.ok(THEME_FONTS.every(font => font.label && font.description));
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
    { palette: 'arcane', font: 'tactical' }
  );
  assert.deepEqual(
    normalizeThemePreferences({ palette: 'unknown', font: null }),
    DEFAULT_THEME_PREFERENCES
  );
  assert.deepEqual(normalizeThemePreferences(null), DEFAULT_THEME_PREFERENCES);
});

test('legacy blood preferences migrate to the renamed blue default', () => {
  assert.deepEqual(
    migrateStoredThemePreferences({ palette: 'blood', font: 'system' }),
    { palette: 'azure', font: 'system', version: 2 }
  );
  assert.deepEqual(
    migrateStoredThemePreferences({ palette: 'blood', font: 'system', version: 2 }),
    { palette: 'blood', font: 'system', version: 2 }
  );
});
