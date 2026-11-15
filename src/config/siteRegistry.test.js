import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SITE_TABS,
  getSiteNavigationGroups,
  getSiteRegistryValidationErrors,
  getSiteTabIdFromUrl,
  getSiteTabIdForRoute,
  getSiteTabMetadata,
  getSiteTabUrl,
  getVisibleSiteTabs,
  moveSiteGroup,
  moveSiteTabInGroup
} from './siteRegistry.js';

test('site registry has complete, valid metadata for every tab', () => {
  assert.deepEqual(getSiteRegistryValidationErrors(), []);
  assert.equal(SITE_TABS.length, 33);
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

test('URL page markers resolve every registered subtab and preserve existing URL state', () => {
  const location = {
    pathname: '/dashboard',
    search: '?theme=blood&page=admin.config',
    hash: '#details'
  };

  assert.equal(getSiteTabIdFromUrl(location), 'admin.config');
  assert.equal(getSiteTabIdFromUrl({ search: '?page=not-a-tab' }), null);
  assert.equal(getSiteTabUrl('admin.config', location), '/dashboard?theme=blood&page=admin.config#details');
  assert.equal(getSiteTabUrl('not-a-tab', location), null);

  SITE_TABS.forEach(tab => {
    const url = getSiteTabUrl(tab.id, { pathname: '/', search: '', hash: '' });
    assert.equal(getSiteTabIdFromUrl(new URL(url, 'https://example.test')), tab.id);
  });
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

test('reordering handles tied values, hidden tabs, and group moves', () => {
  const layout = {
    groupByTab: { 'loot.assigned': 'profiles' },
    orderByTab: { 'profiles.my-characters': 0, 'profiles.meet-guild': 0, 'loot.assigned': 0 }
  };
  const orders = moveSiteTabInGroup('profiles.meet-guild', -1, layout);
  assert.deepEqual(orders, {
    'profiles.meet-guild': 0,
    'profiles.my-characters': 1,
    'loot.assigned': 2
  });
  assert.deepEqual(getVisibleSiteTabs('profiles', { ...layout, orderByTab: orders }).map(tab => tab.id), [
    'profiles.meet-guild', 'profiles.my-characters', 'loot.assigned'
  ]);
  assert.equal(moveSiteTabInGroup('profiles.my-characters', -1, layout), null);
  assert.equal(moveSiteTabInGroup('missing', 1, layout), null);

  const bankOrders = moveSiteTabInGroup('guild-bank.history', -1);
  assert.deepEqual(Object.keys(bankOrders), ['guild-bank.contents', 'guild-bank.requests', 'guild-bank.history', 'guild-bank.addon']);
  assert.deepEqual(getVisibleSiteTabs('bank', { audience: 'Officer', isAuthenticated: true, orderByTab: bankOrders }).map(tab => tab.id), Object.keys(bankOrders));
  assert.deepEqual(getVisibleSiteTabs('bank', { audience: 'Public', orderByTab: bankOrders }).map(tab => tab.id), ['guild-bank.contents']);
});

test('each navigation group can reorder its tabs without changing another group', () => {
  for (const groupKey of ['bank', 'raidAssignments', 'raidSignups', 'recruitment', 'profiles', 'resources', 'loot', 'admin']) {
    const tabs = SITE_TABS.filter(tab => tab.groupKey === groupKey);
    const orderByTab = moveSiteTabInGroup(tabs[1].id, -1);
    assert.equal(orderByTab[tabs[1].id], 0);
    assert.equal(orderByTab[tabs[0].id], 1);
    assert.equal(Object.keys(orderByTab).length, tabs.length);
  }
});

test('main navigation groups honor persisted order overrides', () => {
  const defaultGroups = getSiteNavigationGroups().map(group => group.key);
  assert.deepEqual(defaultGroups, ['bank', 'raidAssignments', 'raidSignups', 'recruitment', 'profiles', 'resources', 'loot', 'admin']);

  let orderByGroup = {};
  for (let index = 0; index < 3; index += 1) {
    orderByGroup = moveSiteGroup('recruitment', -1, { orderByGroup });
  }

  assert.deepEqual(getSiteNavigationGroups({ orderByGroup }).map(group => group.key), [
    'recruitment', 'bank', 'raidAssignments', 'raidSignups', 'profiles', 'resources', 'loot', 'admin'
  ]);
  assert.deepEqual(Object.keys(orderByGroup), ['recruitment', 'bank', 'raidAssignments', 'raidSignups', 'profiles', 'resources', 'loot', 'admin']);
  assert.equal(moveSiteGroup('recruitment', -1, { orderByGroup }), null);
  assert.equal(moveSiteGroup('admin', 1, { orderByGroup }), null);
});