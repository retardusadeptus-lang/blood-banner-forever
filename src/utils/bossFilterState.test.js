import test from 'node:test';
import assert from 'node:assert/strict';
import { getVisibleBosses, filterBossesByPhase } from './bossFilterState.js';

test('returns all available bosses when no user filter is set', () => {
  assert.deepEqual(getVisibleBosses({ availableBosses: ['A', 'B', 'C'], userSelection: null }), ['A', 'B', 'C']);
});

test('returns only the selected bosses when a user-specific filter is applied', () => {
  assert.deepEqual(getVisibleBosses({ availableBosses: ['A', 'B', 'C'], userSelection: ['B', 'C'] }), ['B', 'C']);
});

test('ignores unknown bosses and supports an explicit empty filter', () => {
  assert.deepEqual(getVisibleBosses({ availableBosses: ['A', 'B'], userSelection: ['C', 'A', ''] }), ['A']);
  assert.deepEqual(getVisibleBosses({ availableBosses: ['A', 'B'], userSelection: [] }), []);
});

test('filters boss names by phase using the raid-to-phase mapping', () => {
  const raidZones = [
    { name: 'Karazhan', bosses: ['A'] },
    { name: 'Tempest Keep', bosses: ['B', 'C'] },
    { name: 'Black Temple', bosses: ['D'] },
  ];

  assert.deepEqual(filterBossesByPhase({ bossNames: ['A', 'B', 'C', 'D'], raidZones, phase: 'T4' }), ['A']);
  assert.deepEqual(filterBossesByPhase({ bossNames: ['A', 'B', 'C', 'D'], raidZones, phase: 'T5' }), ['B', 'C']);
  assert.deepEqual(filterBossesByPhase({ bossNames: ['A', 'B', 'C', 'D'], raidZones, phase: 'T6' }), ['D']);
});
