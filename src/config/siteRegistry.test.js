import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SITE_TABS,
  getSiteRegistryValidationErrors,
  getSiteTabIdForRoute,
  getSiteTabMetadata,
  getVisibleSiteTabs
} from './siteRegistry.js';

test('site registry has complete, valid metadata for every tab', () => {
  assert.deepEqual(getSiteRegistryValidationErrors(), []);
  assert.equal(SITE_TABS.length, 29);
  assert.ok(SITE_TABS.every(tab => tab.id && tab.route && tab.contentOwner));
});

test('route resolution distinguishes exact subtabs and preserves aliases', () => {
  assert.equal(getSiteTabIdForRoute('loot', 'overview'), 'loot.overview');
  assert.equal(getSiteTabIdForRoute('loot', 'scoring'), 'loot.scoring');
  assert.equal(getSiteTabIdForRoute('bankRequests'), 'guild-bank.requests');
  assert.equal(getSiteTabIdForRoute('bankRequests', 'unexpected'), null);
  assert.equal(getSiteTabIdForRoute('raidSignups', 'events'), 'raid-signups.events');
  assert.equal(getSiteTabIdForRoute('raidSignups', 'history'), 'raid-signups.history');
});

test('auth-only recovery checks the exact subtab instead of the whole group', async () => {
  const { isSiteActiveTabAuthOnly } = await import('./siteRegistry.js');

  assert.equal(isSiteActiveTabAuthOnly('raidSignups', 'events'), false);
  assert.equal(isSiteActiveTabAuthOnly('raidSignups', 'templates'), true);
  assert.equal(isSiteActiveTabAuthOnly('loot', 'overview'), false);
  assert.equal(isSiteActiveTabAuthOnly('loot', 'assignment'), true);
});

test('visibility filtering applies audience, authentication, and capabilities', () => {
  const publicBankTabs = getVisibleSiteTabs('bank', { audience: 'Public' });
  assert.deepEqual(publicBankTabs.map(tab => tab.id), ['guild-bank.contents']);

  const officerBankTabs = getVisibleSiteTabs('bank', {
    audience: 'Officer',
    isAuthenticated: true
  });
  assert.deepEqual(
    officerBankTabs.map(tab => tab.id),
    ['guild-bank.contents', 'guild-bank.requests', 'guild-bank.addon', 'guild-bank.history']
  );

  const hiddenAdminTabs = getVisibleSiteTabs('admin', {
    audience: 'Admin',
    isAuthenticated: true,
    canViewSitemap: false
  });
  assert.equal(hiddenAdminTabs.some(tab => tab.id === 'admin.sitemap'), false);

  const visibleAdminTabs = getVisibleSiteTabs('admin', {
    audience: 'Admin',
    isAuthenticated: true,
    canViewSitemap: true
  });
  assert.equal(visibleAdminTabs.some(tab => tab.id === 'admin.sitemap'), true);
});

test('effective metadata applies persisted group and order overrides', () => {
  const metadata = getSiteTabMetadata('loot.assigned', {
    groupByTab: { 'loot.assigned': 'resources' },
    orderByTab: { 'loot.assigned': 1 }
  });

  assert.equal(metadata.groupKey, 'resources');
  assert.equal(metadata.order, 1);
});

test('visible tabs honor persisted group moves and ordering', () => {
  const layout = {
    groupByTab: {
      'loot.assigned': 'resources'
    },
    orderByTab: {
      'loot.assigned': 0,
      'resources.bis': 1
    }
  };

  const movedFromLoot = getVisibleSiteTabs('loot', {
    audience: 'Public',
    ...layout
  });
  const movedToResources = getVisibleSiteTabs('resources', {
    audience: 'Public',
    ...layout
  });

  assert.equal(movedFromLoot.some(tab => tab.id === 'loot.assigned'), false);
  assert.deepEqual(movedToResources.slice(0, 2).map(tab => tab.id), ['loot.assigned', 'resources.bis']);
});

test('moving a tab changes layout metadata without changing its component contract', () => {
  const metadata = getSiteTabMetadata('guild-bank.history', {
    surfaceRolesByTab: { 'guild-bank.history': ['Admin'] },
    groupByTab: { 'guild-bank.history': 'resources' },
    orderByTab: { 'guild-bank.history': 0 }
  });

  assert.equal(metadata.groupKey, 'resources');
  assert.equal(metadata.order, 0);
  assert.deepEqual(metadata.surfaceRoles, ['Admin']);
  assert.equal(metadata.contentOwner, 'BankContainer');
  assert.deepEqual(metadata.route, { activeTab: 'bank', subTab: 'history' });
});