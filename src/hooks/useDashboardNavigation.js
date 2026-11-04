import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SITE_TAB } from '../constants.js';
import { getSiteTabIdForRoute, getSiteTabRoute, getVisibleSiteTabs, isSiteActiveTabAuthOnly } from '../config/siteRegistry.js';

function getNavigationSubTab(activeTab, state) {
  if (activeTab === 'bank') return state.bankSubTab;
  if (activeTab === 'raidAssignments') return state.raidAssignmentsSubTab;
  if (activeTab === 'raidSignups') return state.raidSignupsSubTab;
  if (activeTab === 'loot') return state.lootSubTab;
  if (activeTab === 'recruitmentPlanning' || activeTab === 'recruitmentFocus' || activeTab === 'recruitmentApplications') return state.recruitmentSubTab;
  if (activeTab === 'profiles') return state.profilesSubTab;
  if (activeTab === 'officerRoles' || activeTab === 'discordBotConfig' || activeTab === 'roster' || activeTab === 'itemsdb' || activeTab === 'sitemap') return state.adminSubTab;
  if (activeTab === 'bis') return state.resourcesSubTab;
  return null;
}
const NAV_STORAGE_KEYS = {
  activeTab: 'active-tab',
  bankSubTab: 'bank-sub-tab',
  raidAssignmentsSubTab: 'raid-assignments-sub-tab',
  raidSignupsSubTab: 'raid-signups-sub-tab',
  lootSubTab: 'loot-sub-tab',
  recruitmentSubTab: 'recruitment-sub-tab',
  profilesSubTab: 'profiles-sub-tab',
  adminSubTab: 'admin-sub-tab',
  resourcesSubTab: 'resources-sub-tab'
};
const BNET_LAST_SITE_TAB_PREFIX = 'bnet-last-site-tab:';

export function readNavigationState(storage = globalThis.localStorage) {
  const read = key => storage?.getItem(key) || null;
  const activeTab = read(NAV_STORAGE_KEYS.activeTab) || 'recruitmentFocus';
  const savedRecruitmentSubTab = read(NAV_STORAGE_KEYS.recruitmentSubTab);

  return {
    activeTab,
    bankSubTab: read(NAV_STORAGE_KEYS.bankSubTab) || 'contents',
    raidAssignmentsSubTab: read(NAV_STORAGE_KEYS.raidAssignmentsSubTab) || 'overview',
    raidSignupsSubTab: read(NAV_STORAGE_KEYS.raidSignupsSubTab) || 'templates',
    lootSubTab: read(NAV_STORAGE_KEYS.lootSubTab) || 'overview',
    recruitmentSubTab: savedRecruitmentSubTab || (
      activeTab === 'recruitmentPlanning'
        ? 'planning'
        : activeTab === 'recruitmentFocus'
          ? 'focus'
          : 'roster'
    ),
            profilesSubTab: read(NAV_STORAGE_KEYS.profilesSubTab) || 'my-characters',
    adminSubTab: read(NAV_STORAGE_KEYS.adminSubTab) || 'officerRoles',
    resourcesSubTab: read(NAV_STORAGE_KEYS.resourcesSubTab) || 'bis'
  };
}

export default function useDashboardNavigation({ isAuthenticated, canViewScoring = false, canViewSitemap = false, siteAudience = 'Public', surfaceRolesByTab = {}, groupByTab = {}, orderByTab = {}, defaultSiteTab = DEFAULT_SITE_TAB, bnetUserId = null, bnetAuthReady = false, defaultSiteTabReady = false }) {
  const initialNavigationState = readNavigationState();
  const [activeTab, setActiveTab] = useState(() => initialNavigationState.activeTab);
  const [hoveredNavTab, setHoveredNavTab] = useState(null);
  const [bankSubTab, setBankSubTab] = useState(() => initialNavigationState.bankSubTab);
  const [raidAssignmentsSubTab, setRaidAssignmentsSubTab] = useState(() => initialNavigationState.raidAssignmentsSubTab);
  const [raidSignupsSubTab, setRaidSignupsSubTab] = useState(() => initialNavigationState.raidSignupsSubTab);
  const [lootSubTab, setLootSubTab] = useState(() => initialNavigationState.lootSubTab);
  const [recruitmentSubTab, setRecruitmentSubTab] = useState(() => initialNavigationState.recruitmentSubTab);
  const [profilesSubTab, setProfilesSubTab] = useState(() => initialNavigationState.profilesSubTab);
  const [adminSubTab, setAdminSubTab] = useState(() => initialNavigationState.adminSubTab);
  const [resourcesSubTab, setResourcesSubTab] = useState(() => initialNavigationState.resourcesSubTab);
  const initialRouteAppliedRef = useRef(false);
  const restoredBnetUserIdRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(NAV_STORAGE_KEYS.activeTab, activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem(NAV_STORAGE_KEYS.bankSubTab, bankSubTab);
  }, [bankSubTab]);

  useEffect(() => {
    localStorage.setItem(NAV_STORAGE_KEYS.raidAssignmentsSubTab, raidAssignmentsSubTab);
  }, [raidAssignmentsSubTab]);

  useEffect(() => {
    localStorage.setItem(NAV_STORAGE_KEYS.raidSignupsSubTab, raidSignupsSubTab);
  }, [raidSignupsSubTab]);

  useEffect(() => {
    localStorage.setItem(NAV_STORAGE_KEYS.lootSubTab, lootSubTab);
  }, [lootSubTab]);

  useEffect(() => {
    localStorage.setItem(NAV_STORAGE_KEYS.recruitmentSubTab, recruitmentSubTab);
  }, [recruitmentSubTab]);

  useEffect(() => {
    localStorage.setItem(NAV_STORAGE_KEYS.profilesSubTab, profilesSubTab);
  }, [profilesSubTab]);

  useEffect(() => {
    localStorage.setItem(NAV_STORAGE_KEYS.adminSubTab, adminSubTab);
  }, [adminSubTab]);

  useEffect(() => {
    localStorage.setItem(NAV_STORAGE_KEYS.resourcesSubTab, resourcesSubTab);
  }, [resourcesSubTab]);

  useEffect(() => {
    if (activeTab === 'bank' && bankSubTab === 'update') {
      // Normalize legacy navigation state after route changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBankSubTab('addon');
      return;
    }

    if (isAuthenticated) {
      if (activeTab === 'scoring' && !canViewScoring) {
        setActiveTab('loot');
        setLootSubTab('overview');
      }
      if (activeTab === 'sitemap' && !canViewSitemap) {
        setActiveTab('loot');
        setLootSubTab('overview');
      }
      return;
    }

    if (isSiteActiveTabAuthOnly(activeTab, getNavigationSubTab(activeTab, {
      adminSubTab,
      bankSubTab,
      lootSubTab,
      raidAssignmentsSubTab,
      raidSignupsSubTab,
      recruitmentSubTab,
      profilesSubTab,
      resourcesSubTab
    }))) {
      if (activeTab === 'recruitmentPlanning') {
        setActiveTab('recruitmentFocus');
        setRecruitmentSubTab('focus');
        return;
      }

      if (activeTab === 'bankRequests') {
        setActiveTab('bank');
        setBankSubTab('contents');
        return;
      }

      setActiveTab('loot');
      setLootSubTab('overview');
      return;
    }

    if (activeTab === 'bank' && ['requests', 'addon', 'history'].includes(bankSubTab)) {
      setBankSubTab('contents');
      return;
    }

    if (activeTab === 'raidAssignments' && raidAssignmentsSubTab === 'history') {
      setRaidAssignmentsSubTab('overview');
      return;
    }

    if (activeTab === 'raidSignups' && raidSignupsSubTab === 'group-config') {
      setRaidSignupsSubTab('events');
      return;
    }

    if (activeTab === 'raidSignups' && ['templates', 'history'].includes(raidSignupsSubTab)) {
      setRaidSignupsSubTab('events');
      return;
    }

    if (activeTab === 'loot' && ['assignment', 'scoring'].includes(lootSubTab)) {
      setLootSubTab('overview');
      return;
    }

    if (activeTab === 'recruitmentFocus' && !['focus', 'about'].includes(recruitmentSubTab)) {
      setRecruitmentSubTab('focus');
    }
    if (activeTab === 'profiles' && !['my-characters', 'meet-guild'].includes(profilesSubTab)) {
      setProfilesSubTab('my-characters');
    }
  }, [activeTab, adminSubTab, bankSubTab, canViewScoring, canViewSitemap, isAuthenticated, lootSubTab, profilesSubTab, raidAssignmentsSubTab, raidSignupsSubTab, recruitmentSubTab, resourcesSubTab]);

  useEffect(() => {
    if (activeTab === 'recruitmentPlanning' && recruitmentSubTab !== 'planning') {
      // Normalize the selected subtab for the active route.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecruitmentSubTab('planning');
      return;
    }

    if (activeTab === 'recruitmentFocus' && !['focus', 'about'].includes(recruitmentSubTab)) {
      setRecruitmentSubTab('focus');
      return;
    }

    if (activeTab === 'recruitmentApplications' && recruitmentSubTab !== 'applications') {
      setRecruitmentSubTab('applications');
      return;
    }

    if (activeTab === 'profiles' && !['my-characters', 'meet-guild'].includes(profilesSubTab)) {
      setProfilesSubTab('my-characters');
    }

  }, [activeTab, profilesSubTab, recruitmentSubTab]);

  const subTabs = useMemo(() => Object.fromEntries(
    ['bank', 'raidAssignments', 'raidSignups', 'recruitment', 'resources', 'loot', 'profiles', 'admin'].map(groupKey => [
      groupKey,
      getVisibleSiteTabs(groupKey, {
        audience: siteAudience,
        isAuthenticated,
        canViewScoring,
        canViewSitemap,
        surfaceRolesByTab,
        groupByTab,
        orderByTab
      })
    ])
  ), [canViewScoring, canViewSitemap, groupByTab, isAuthenticated, orderByTab, siteAudience, surfaceRolesByTab]);

  const activeSiteTabId = getSiteTabIdForRoute(activeTab, getNavigationSubTab(activeTab, {
    adminSubTab,
    bankSubTab,
    lootSubTab,
    raidAssignmentsSubTab,
    raidSignupsSubTab,
    recruitmentSubTab,
    profilesSubTab,
    resourcesSubTab
  }));

  const applySiteTabRoute = useCallback((tabId) => {
    const route = getSiteTabRoute(tabId);
    if (!route) return false;

    setActiveTab(route.activeTab);
    if (!route.subTab) return true;
    if (route.activeTab === 'bank') setBankSubTab(route.subTab);
    if (route.activeTab === 'raidAssignments') setRaidAssignmentsSubTab(route.subTab);
    if (route.activeTab === 'raidSignups') setRaidSignupsSubTab(route.subTab);
    if (route.activeTab === 'loot') setLootSubTab(route.subTab);
    if (route.activeTab === 'recruitmentPlanning' || route.activeTab === 'recruitmentFocus' || route.activeTab === 'recruitmentApplications') setRecruitmentSubTab(route.subTab);
    if (route.activeTab === 'profiles') setProfilesSubTab(route.subTab);
    if (route.activeTab === 'officerRoles' || route.activeTab === 'discordBotConfig' || route.activeTab === 'roster' || route.activeTab === 'itemsdb' || route.activeTab === 'sitemap') setAdminSubTab(route.subTab);
    if (route.activeTab === 'bis') setResourcesSubTab(route.subTab);
    return true;
  }, []);

  const isVisibleSiteTab = useCallback((tabId) => Object.values(subTabs).some(tabs => tabs.some(tabItem => tabItem.id === tabId)), [subTabs]);

  useEffect(() => {
    if (!bnetAuthReady || !defaultSiteTabReady) return;

    const fallbackTabId = isVisibleSiteTab(defaultSiteTab)
      ? defaultSiteTab
      : isVisibleSiteTab(DEFAULT_SITE_TAB) ? DEFAULT_SITE_TAB : null;
    let requestedTabId = fallbackTabId;

    if (bnetUserId) {
      const normalizedUserId = String(bnetUserId);
      if (restoredBnetUserIdRef.current === normalizedUserId) return;
      try {
        const savedTabId = localStorage.getItem(`${BNET_LAST_SITE_TAB_PREFIX}${normalizedUserId}`);
        if (isVisibleSiteTab(savedTabId)) requestedTabId = savedTabId;
      } catch {
        requestedTabId = fallbackTabId;
      }
      restoredBnetUserIdRef.current = normalizedUserId;
    } else {
      restoredBnetUserIdRef.current = null;
      if (initialRouteAppliedRef.current) return;
    }

    if (requestedTabId) applySiteTabRoute(requestedTabId);
    initialRouteAppliedRef.current = true;
  }, [applySiteTabRoute, bnetAuthReady, bnetUserId, defaultSiteTab, defaultSiteTabReady, isVisibleSiteTab]);

  useEffect(() => {
    if (!bnetUserId || !activeSiteTabId) return;
    try {
      localStorage.setItem(`${BNET_LAST_SITE_TAB_PREFIX}${String(bnetUserId)}`, activeSiteTabId);
    } catch {
      return;
    }
  }, [activeSiteTabId, bnetUserId]);

  const handleMainNavSelect = useCallback((tabId = null) => {
    setHoveredNavTab(null);
    applySiteTabRoute(tabId);
  }, [applySiteTabRoute]);
  const getDropdownItemActiveState = useCallback((tabId = null) => {
    if (!getSiteTabRoute(tabId)) return false;
    const activeSiteTabId = getSiteTabIdForRoute(activeTab, getNavigationSubTab(activeTab, {
      adminSubTab,
      bankSubTab,
      lootSubTab,
      raidAssignmentsSubTab,
      raidSignupsSubTab,
      recruitmentSubTab,
      profilesSubTab,
      resourcesSubTab
    }));
    return activeSiteTabId === tabId;
  }, [activeTab, adminSubTab, bankSubTab, lootSubTab, profilesSubTab, raidAssignmentsSubTab, raidSignupsSubTab, recruitmentSubTab, resourcesSubTab]);

  useEffect(() => {
    if (activeTab !== 'bis') return;
    const visibleResources = subTabs.resources || [];
    if (visibleResources.length > 0 && !visibleResources.some(tab => tab.value === resourcesSubTab)) {
      startTransition(() => setResourcesSubTab(visibleResources[0].value));
    }
  }, [activeTab, resourcesSubTab, subTabs, setResourcesSubTab]);

  return {
    activeTab,
    setActiveTab,
    hoveredNavTab,
    setHoveredNavTab,
    bankSubTab,
    setBankSubTab,
    raidAssignmentsSubTab,
    setRaidAssignmentsSubTab,
    raidSignupsSubTab,
    setRaidSignupsSubTab,
    lootSubTab,
    setLootSubTab,
    recruitmentSubTab,
    setRecruitmentSubTab,
    profilesSubTab,
    setProfilesSubTab,
    adminSubTab,
    setAdminSubTab,
    resourcesSubTab,
    setResourcesSubTab,
    handleMainNavSelect,
    getDropdownItemActiveState,
    activeSiteTabId,
    subTabs,
  };
}
