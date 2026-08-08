import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBossState, getOrCreatePhase } from './raidAssignmentState.js';

test('normalizes malformed boss state without crashing', () => {
  const normalized = normalizeBossState(undefined, () => 'id-1');

  assert.deepEqual(normalized.phases, []);
  assert.deepEqual(normalized.targets, []);
  assert.deepEqual(normalized.fearWards, []);
});

test('creates a missing phase safely when phase data is absent', () => {
  const bossData = { phases: null };
  const phase = getOrCreatePhase(bossData, null, () => 'phase-1');

  assert.equal(phase.id, 'phase-1');
  assert.deepEqual(bossData.phases, [phase]);
});
