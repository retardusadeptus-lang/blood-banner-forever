export const SITE_ROLES = ['Public', 'Guild Member', 'Officer', 'Admin'];
export const SITE_CONTENT_OWNERS = [
  'ScoringContainer',
  'AdminContainer',
  'BankContainer',
  'RaidAssignmentsContainer',
  'RaidSignupsContainer',
  'LootCouncilContainer',
  'ResourcesTab',
  'RecruitmentPlanningTab',
  'RecruitmentFocusTab',
  'RecruitmentApplicationsTab',
  'RecruitmentAboutTab',
  'Profiles',
  'ItemsDatabaseContainer'
];
export const SITE_VISIBILITY_CAPABILITIES = ['scoring', 'sitemap'];

const tab = (id, value, label, surfaceRoles = SITE_ROLES, options = {}) => ({
  id,
  value,
  label,
  surfaceRoles,
  contentOwner: options.contentOwner,
  ...options
});

export const SITE_NAV_GROUPS = [
  {
    key: 'bank',
    label: 'Guild Bank',
    tabs: [
      tab('guild-bank.contents', 'contents', 'Contents', SITE_ROLES, { contentOwner: 'BankContainer', route: { activeTab: 'bank', subTab: 'contents' } }),
      tab('guild-bank.requests', 'requests', 'Requests', ['Officer', 'Admin'], { authOnly: true, contentOwner: 'BankContainer', route: { activeTab: 'bankRequests' } }),
      tab('guild-bank.addon', 'addon', 'Addon', ['Officer', 'Admin'], { contentOwner: 'BankContainer', route: { activeTab: 'bank', subTab: 'addon' } }),
      tab('guild-bank.history', 'history', 'History', ['Officer', 'Admin'], { contentOwner: 'BankContainer', route: { activeTab: 'bank', subTab: 'history' } })
    ]
  },
  {
    key: 'raidAssignments',
    label: 'Raid Assignments',
    tabs: [
      tab('raid-assignments.overview', 'overview', 'Overview', SITE_ROLES, { contentOwner: 'RaidAssignmentsContainer', route: { activeTab: 'raidAssignments', subTab: 'overview' } }),
      tab('raid-assignments.tactics', 'tactics', 'Tactics', SITE_ROLES, { contentOwner: 'ResourcesTab', route: { activeTab: 'raidAssignments', subTab: 'tactics' } })
    ]
  },
  {
    key: 'raidSignups',
    label: 'Raid Signups',
    tabs: [
      tab('raid-signups.templates', 'templates', 'Templates', ['Officer', 'Admin'], { authOnly: true, contentOwner: 'RaidSignupsContainer', route: { activeTab: 'raidSignups', subTab: 'templates' } }),
      tab('raid-signups.events', 'events', 'Events', SITE_ROLES, { contentOwner: 'RaidSignupsContainer', route: { activeTab: 'raidSignups', subTab: 'events' } }),
      tab('raid-signups.calendar', 'calendar', 'Calendar', SITE_ROLES, { contentOwner: 'RaidSignupsContainer', route: { activeTab: 'raidSignups', subTab: 'calendar' } }),
      tab('raid-signups.history', 'history', 'History', ['Officer', 'Admin'], { authOnly: true, contentOwner: 'RaidSignupsContainer', route: { activeTab: 'raidSignups', subTab: 'history' } }),
      tab('raid-signups.absences', 'absences', 'Absences', SITE_ROLES, { contentOwner: 'RaidSignupsContainer', route: { activeTab: 'raidSignups', subTab: 'absences' } })
    ]
  },
  {
    key: 'recruitment',
    label: 'Recruitment',
    tabs: [
      tab('recruitment.planning', 'planning', 'Roster Planning', ['Officer', 'Admin'], { authOnly: true, contentOwner: 'RecruitmentPlanningTab', route: { activeTab: 'recruitmentPlanning', subTab: 'planning' } }),
      tab('recruitment.focus', 'focus', 'Recruitment Focus', SITE_ROLES, { contentOwner: 'RecruitmentFocusTab', route: { activeTab: 'recruitmentFocus', subTab: 'focus' } }),
      tab('recruitment.applications', 'applications', 'Applications', SITE_ROLES, { contentOwner: 'RecruitmentApplicationsTab', route: { activeTab: 'recruitmentApplications', subTab: 'applications' } }),
      tab('recruitment.about', 'about', 'About Us', SITE_ROLES, { contentOwner: 'RecruitmentAboutTab', route: { activeTab: 'recruitmentFocus', subTab: 'about' } })
    ]
  },
  {
    key: 'profiles',
    label: 'Profiles',
    tabs: [
      tab('profiles.my-characters', 'my-characters', 'My Characters', SITE_ROLES, { contentOwner: 'Profiles', route: { activeTab: 'profiles', subTab: 'my-characters' } }),
      tab('profiles.meet-guild', 'meet-guild', 'Meet the Guild', SITE_ROLES, { contentOwner: 'Profiles', route: { activeTab: 'profiles', subTab: 'meet-guild' } })
    ]
  },
  {
    key: 'resources',
    label: 'Resources',
    tabs: [
      tab('resources.bis', 'bis', 'BiS Lists', SITE_ROLES, { contentOwner: 'ResourcesTab', route: { activeTab: 'bis', subTab: 'bis' } }),
      tab('resources.weakauras', 'weakauras', 'Weakauras', SITE_ROLES, { contentOwner: 'ResourcesTab', route: { activeTab: 'bis', subTab: 'weakauras' } }),
      tab('resources.cheatsheets', 'cheatsheets', 'Cheat Sheets', SITE_ROLES, { contentOwner: 'ResourcesTab', route: { activeTab: 'bis', subTab: 'cheatsheets' } }),
      tab('resources.raidlogs', 'raidlogs', 'Raid Logs', SITE_ROLES, { contentOwner: 'ResourcesTab', route: { activeTab: 'bis', subTab: 'raidlogs' } }),
      tab('resources.wipefest', 'wipefest', 'Wipefest', SITE_ROLES, { contentOwner: 'ResourcesTab', route: { activeTab: 'bis', subTab: 'wipefest' } })
    ]
  },
  {
    key: 'loot',
    label: 'Loot Council',
    tabs: [
      tab('loot.overview', 'overview', 'Priority Overview', SITE_ROLES, { contentOwner: 'LootCouncilContainer', route: { activeTab: 'loot', subTab: 'overview' } }),
      tab('loot.assignment', 'assignment', 'Priority Assignment', ['Officer', 'Admin'], { authOnly: true, contentOwner: 'LootCouncilContainer', route: { activeTab: 'loot', subTab: 'assignment' } }),
      tab('loot.scoring', 'scoring', 'Scoring', ['Admin'], { authOnly: true, contentOwner: 'ScoringContainer', visibilityCapability: 'scoring', route: { activeTab: 'scoring' }, routeAliases: [{ activeTab: 'loot', subTab: 'scoring' }] }),
      tab('loot.assigned', 'assigned', 'Assigned Loot', SITE_ROLES, { contentOwner: 'LootCouncilContainer', route: { activeTab: 'loot', subTab: 'assigned' } })
    ]
  },
  {
    key: 'admin',
    label: 'Admin',
    tabs: [
      tab('admin.officerRoles', 'officerRoles', 'Officer Roles', ['Officer', 'Admin'], { authOnly: true, contentOwner: 'AdminContainer', route: { activeTab: 'officerRoles', subTab: 'officerRoles' } }),
      tab('admin.roster', 'roster', 'Roster', ['Officer', 'Admin'], { authOnly: true, contentOwner: 'AdminContainer', route: { activeTab: 'roster', subTab: 'roster' } }),
      tab('admin.bosses', 'bosses', 'Manage Bosses', ['Officer', 'Admin'], { authOnly: true, contentOwner: 'AdminContainer', route: { activeTab: 'officerRoles', subTab: 'bosses' } }),
      tab('admin.config', 'config', 'Config', ['Officer', 'Admin'], { authOnly: true, contentOwner: 'AdminContainer', route: { activeTab: 'discordBotConfig', subTab: 'config' } }),
      tab('admin.itemsdb', 'itemsdb', 'Master Items DB', ['Officer', 'Admin'], { authOnly: true, contentOwner: 'ItemsDatabaseContainer', route: { activeTab: 'itemsdb', subTab: 'itemsdb' } }),
      tab('admin.todo', 'todo', 'To-do List', ['Officer', 'Admin'], { authOnly: true, contentOwner: 'AdminContainer', route: { activeTab: 'officerRoles', subTab: 'todo' } }),
      tab('admin.sitemap', 'sitemap', 'Sitemap', ['Admin'], { authOnly: true, contentOwner: 'AdminContainer', visibilityCapability: 'sitemap', route: { activeTab: 'sitemap', subTab: 'sitemap' } })
    ]
  }
];

export const SITE_TABS = SITE_NAV_GROUPS.flatMap(group => group.tabs.map(item => ({ ...item, groupKey: group.key })));

export function getSiteTabById(tabId) {
  return SITE_TABS.find(item => item.id === tabId) || null;
}

export function getSiteTabRoute(tabId) {
  return getSiteTabById(tabId)?.route || null;
}

export function getSiteTabIdForRoute(activeTab, subTab = null) {
  return SITE_TABS.find(tabItem => {
    const route = tabItem.route;
    const routeMatches = route?.activeTab === activeTab && (route.subTab || null) === (subTab || null);
    const aliasMatches = tabItem.routeAliases?.some(alias => alias.activeTab === activeTab && (alias.subTab || null) === (subTab || null));
    return routeMatches || aliasMatches;
  })?.id || null;
}

export function getEffectiveSurfaceRoles(tabItem, surfaceRolesByTab = {}) {
  const override = surfaceRolesByTab?.[tabItem.id];
  return Array.isArray(override) ? override : tabItem.surfaceRoles;
}

export function getEffectiveGroupKey(tabItem, groupByTab = {}) {
  return groupByTab?.[tabItem.id] || tabItem.groupKey;
}

export function getEffectiveTabOrder(tabItem, orderByTab = {}) {
  const order = Number(orderByTab?.[tabItem.id]);
  return Number.isFinite(order) ? order : SITE_TABS.findIndex(item => item.id === tabItem.id);
}

export function getSiteTabMetadata(tabId, { surfaceRolesByTab = {}, groupByTab = {}, orderByTab = {} } = {}) {
  const tabItem = getSiteTabById(tabId);
  if (!tabItem) return null;
  return {
    ...tabItem,
    surfaceRoles: getEffectiveSurfaceRoles(tabItem, surfaceRolesByTab),
    groupKey: getEffectiveGroupKey(tabItem, groupByTab),
    order: getEffectiveTabOrder(tabItem, orderByTab)
  };
}

export function getSiteTabContentOwner(tabId) {
  return getSiteTabById(tabId)?.contentOwner || null;
}

export function isSiteActiveTabAuthOnly(activeTab, subTab = null) {
  const tabId = getSiteTabIdForRoute(activeTab, subTab);
  return Boolean(tabId && getSiteTabById(tabId)?.authOnly);
}

export function getSiteRegistryValidationErrors() {
  const errors = [];
  const tabIds = new Set();
  const routeKeys = new Set();

  SITE_TABS.forEach(tabItem => {
    if (tabIds.has(tabItem.id)) errors.push(`Duplicate tab ID: ${tabItem.id}`);
    tabIds.add(tabItem.id);

    const route = tabItem.route;
    if (!route?.activeTab) {
      errors.push(`Missing route: ${tabItem.id}`);
    } else {
      const routeKey = `${route.activeTab}:${route.subTab || ''}`;
      if (routeKeys.has(routeKey)) errors.push(`Duplicate route: ${routeKey}`);
      routeKeys.add(routeKey);
    }
    if (tabItem.routeAliases && !Array.isArray(tabItem.routeAliases)) {
      errors.push(`Invalid route aliases: ${tabItem.id}`);
    }
    (tabItem.routeAliases || []).forEach(alias => {
      if (!alias?.activeTab) {
        errors.push(`Missing route alias: ${tabItem.id}`);
        return;
      }
      const aliasKey = `${alias.activeTab}:${alias.subTab || ''}`;
      if (routeKeys.has(aliasKey)) errors.push(`Duplicate route: ${aliasKey}`);
      routeKeys.add(aliasKey);
    });

    if (!Array.isArray(tabItem.surfaceRoles) || tabItem.surfaceRoles.length === 0) {
      errors.push(`Missing surface roles: ${tabItem.id}`);
    }
    if (!tabItem.contentOwner) {
      errors.push(`Missing content owner: ${tabItem.id}`);
    } else if (!SITE_CONTENT_OWNERS.includes(tabItem.contentOwner)) {
      errors.push(`Unknown content owner: ${tabItem.id} (${tabItem.contentOwner})`);
    }
    if (tabItem.visibilityCapability && !SITE_VISIBILITY_CAPABILITIES.includes(tabItem.visibilityCapability)) {
      errors.push(`Unknown visibility capability: ${tabItem.id} (${tabItem.visibilityCapability})`);
    }
  });

  return errors;
}

export function getVisibleSiteTabs(groupKey, { audience = 'Public', isAuthenticated = false, canViewScoring = false, canViewSitemap = false, surfaceRolesByTab = {}, groupByTab = {}, orderByTab = {} } = {}) {
  const group = SITE_NAV_GROUPS.find(item => item.key === groupKey);
  if (!group) return [];

  return SITE_TABS.map(tabItem => getSiteTabMetadata(tabItem.id, { surfaceRolesByTab, groupByTab, orderByTab }))
    .filter(tabItem => {
    if (tabItem.groupKey !== groupKey) return false;
    const effectiveRoles = tabItem.surfaceRoles;
    if (!effectiveRoles.includes(audience)) return false;
    if (tabItem.authOnly && !isAuthenticated) return false;
    if (tabItem.visibilityCapability === 'scoring' && !canViewScoring) return false;
    if (tabItem.visibilityCapability === 'sitemap' && !canViewSitemap) return false;
    return true;
  }).sort((left, right) => left.order - right.order);
}
