import test from 'node:test';
import assert from 'node:assert/strict';
import { readNavigationState } from './useDashboardNavigation.js';

function createStorage(values = {}) {
  return {
    getItem(key) {
      return values[key] ?? null;
    }
  };
}

test('recovers the persisted active tab and each subtab from storage', () => {
  const state = readNavigationState(createStorage({
    'active-tab': 'bank',
    'bank-sub-tab': 'history',
    'raid-assignments-sub-tab': 'tactics',
    'raid-signups-sub-tab': 'absences',
    'loot-sub-tab': 'assigned',
    'recruitment-sub-tab': 'focus',
    'admin-sub-tab': 'sitemap',
    'resources-sub-tab': 'cheatsheets'
  }));

  assert.deepEqual(state, {
    activeTab: 'bank',
    bankSubTab: 'history',
    raidAssignmentsSubTab: 'tactics',
    raidSignupsSubTab: 'absences',
    lootSubTab: 'assigned',
    recruitmentSubTab: 'focus',
    adminSubTab: 'sitemap',
    resourcesSubTab: 'cheatsheets'
  });
});

test('derives the recruitment subtab from a persisted recruitment route when unset', () => {
  assert.equal(
    readNavigationState(createStorage({ 'active-tab': 'recruitmentPlanning' })).recruitmentSubTab,
    'planning'
  );
  assert.equal(
    readNavigationState(createStorage({ 'active-tab': 'recruitmentFocus' })).recruitmentSubTab,
    'focus'
  );
});
