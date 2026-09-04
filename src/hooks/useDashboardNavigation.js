import { useCallback, useEffect, useMemo, useState } from 'react';

const AUTH_ONLY_TABS = ['bankRequests', 'roster', 'recruitmentPlanning', 'scoring', 'itemsdb', 'officerRoles', 'discordBotConfig'];
const NAV_STORAGE_KEYS = {
  activeTab: 'active-tab',
  bankSubTab: 'bank-sub-tab',
  raidAssignmentsSubTab: 'raid-assignments-sub-tab',
  raidSignupsSubTab: 'raid-signups-sub-tab',
  lootSubTab: 'loot-sub-tab',
  recruitmentSubTab: 'recruitment-sub-tab',
  adminSubTab: 'admin-sub-tab',
  resourcesSubTab: 'resources-sub-tab'
};

export default function useDashboardNavigation({ isAuthenticated }) {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem(NAV_STORAGE_KEYS.activeTab) || 'loot');
  const [hoveredNavTab, setHoveredNavTab] = useState(null);
  const [bankSubTab, setBankSubTab] = useState(() => localStorage.getItem(NAV_STORAGE_KEYS.bankSubTab) || 'contents');
  const [raidAssignmentsSubTab, setRaidAssignmentsSubTab] = useState(() => localStorage.getItem(NAV_STORAGE_KEYS.raidAssignmentsSubTab) || 'overview');
  const [raidSignupsSubTab, setRaidSignupsSubTab] = useState(() => localStorage.getItem(NAV_STORAGE_KEYS.raidSignupsSubTab) || 'templates');
  const [lootSubTab, setLootSubTab] = useState(() => localStorage.getItem(NAV_STORAGE_KEYS.lootSubTab) || 'overview');
  const [recruitmentSubTab, setRecruitmentSubTab] = useState(() => {
    const savedRecruitmentSubTab = localStorage.getItem(NAV_STORAGE_KEYS.recruitmentSubTab);
    if (savedRecruitmentSubTab) return savedRecruitmentSubTab;

    const savedActiveTab = localStorage.getItem(NAV_STORAGE_KEYS.activeTab) || 'loot';
    if (savedActiveTab === 'recruitmentPlanning') return 'planning';
    if (savedActiveTab === 'recruitmentFocus') return 'focus';
    return 'roster';
  });
  const [adminSubTab, setAdminSubTab] = useState(() => localStorage.getItem(NAV_STORAGE_KEYS.adminSubTab) || 'officerRoles');
  const [resourcesSubTab, setResourcesSubTab] = useState(() => localStorage.getItem(NAV_STORAGE_KEYS.resourcesSubTab) || 'bis');

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
    localStorage.setItem(NAV_STORAGE_KEYS.adminSubTab, adminSubTab);
  }, [adminSubTab]);

  useEffect(() => {
    localStorage.setItem(NAV_STORAGE_KEYS.resourcesSubTab, resourcesSubTab);
  }, [resourcesSubTab]);

  useEffect(() => {
    if (isAuthenticated) return;

    if (AUTH_ONLY_TABS.includes(activeTab)) {
      if (activeTab === 'roster' || activeTab === 'recruitmentPlanning') {
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

    if (activeTab === 'bank' && ['requests', 'addon', 'update', 'history'].includes(bankSubTab)) {
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

    if (activeTab === 'recruitmentFocus' && recruitmentSubTab !== 'focus') {
      setRecruitmentSubTab('focus');
    }
  }, [activeTab, bankSubTab, isAuthenticated, lootSubTab, raidAssignmentsSubTab, raidSignupsSubTab, recruitmentSubTab]);

  useEffect(() => {
    if (activeTab === 'recruitmentPlanning' && recruitmentSubTab !== 'planning') {
      setRecruitmentSubTab('planning');
      return;
    }

    if (activeTab === 'recruitmentFocus' && recruitmentSubTab !== 'focus') {
      setRecruitmentSubTab('focus');
      return;
    }

    if (activeTab === 'recruitmentApplications' && recruitmentSubTab !== 'applications') {
      setRecruitmentSubTab('applications');
      return;
    }

    if (activeTab === 'roster' && recruitmentSubTab !== 'roster') {
      setRecruitmentSubTab('roster');
    }
  }, [activeTab, recruitmentSubTab]);

  const handleMainNavSelect = useCallback((mainTab, subTab = null) => {
    setHoveredNavTab(null);

    if (mainTab === 'overview') {
      setActiveTab('loot');
      setLootSubTab('overview');
      return;
    }

    if (mainTab === 'bank') {
      if (subTab === 'requests') {
        setActiveTab('bankRequests');
      } else {
        setActiveTab('bank');
        setBankSubTab(subTab || 'contents');
      }
    } else if (mainTab === 'raidAssignments') {
      setActiveTab('raidAssignments');
      setRaidAssignmentsSubTab(subTab || 'overview');
    } else if (mainTab === 'raidSignups') {
      setActiveTab('raidSignups');
      setRaidSignupsSubTab(subTab || 'templates');
    } else if (mainTab === 'loot') {
      if (subTab === 'scoring') {
        setActiveTab('scoring');
      } else {
        setActiveTab('loot');
        setLootSubTab(subTab || 'overview');
      }
    } else if (mainTab === 'recruitment') {
      if (subTab === 'planning') {
        setActiveTab('recruitmentPlanning');
      } else if (subTab === 'focus') {
        setActiveTab('recruitmentFocus');
      } else if (subTab === 'applications') {
        setActiveTab('recruitmentApplications');
      } else {
        setActiveTab('roster');
      }
      setRecruitmentSubTab(subTab || 'roster');
    } else if (mainTab === 'admin') {
      if (subTab === 'config') {
        setActiveTab('discordBotConfig');
      } else if (subTab === 'itemsdb') {
        setActiveTab('itemsdb');
      } else if (subTab === 'todo') {
        setActiveTab('officerRoles');
        setAdminSubTab('todo');
      } else {
        setActiveTab('officerRoles');
        setAdminSubTab(subTab || 'officerRoles');
      }
    } else if (mainTab === 'resources') {
      setActiveTab('bis');
      setResourcesSubTab(subTab || 'bis');
    } else {
      setActiveTab(mainTab);
    }
  }, []);

  const getDropdownItemActiveState = useCallback((groupKey, subTab) => {
    if (groupKey === 'bank') {
      if (subTab === 'requests') return activeTab === 'bankRequests';
      return activeTab === 'bank' && bankSubTab === subTab;
    }

    if (groupKey === 'raidAssignments') {
      return activeTab === 'raidAssignments' && raidAssignmentsSubTab === subTab;
    }

    if (groupKey === 'raidSignups') {
      return activeTab === 'raidSignups' && raidSignupsSubTab === subTab;
    }

    if (groupKey === 'loot') {
      if (subTab === 'scoring') return activeTab === 'scoring';
      return activeTab === 'loot' && lootSubTab === subTab;
    }

    if (groupKey === 'recruitment') {
      if (subTab === 'planning') return activeTab === 'recruitmentPlanning';
      if (subTab === 'focus') return activeTab === 'recruitmentFocus';
      if (subTab === 'applications') return activeTab === 'recruitmentApplications';
      return activeTab === 'roster';
    }

    if (groupKey === 'admin') {
      if (subTab === 'officerRoles') return activeTab === 'officerRoles' && adminSubTab === 'officerRoles';
      if (subTab === 'config') return activeTab === 'discordBotConfig';
      if (subTab === 'itemsdb') return activeTab === 'itemsdb';
      if (subTab === 'todo') return activeTab === 'officerRoles' && adminSubTab === 'todo';
      if (subTab === 'instructions') return activeTab === 'officerRoles' && adminSubTab === 'instructions';
      return false;
    }

    if (groupKey === 'resources') {
      return activeTab === 'bis' && resourcesSubTab === subTab;
    }

    return activeTab === groupKey;
  }, [activeTab, adminSubTab, bankSubTab, lootSubTab, raidAssignmentsSubTab, raidSignupsSubTab, resourcesSubTab]);

  const subTabs = useMemo(() => {
    const allTabs = {
      bank: [
      { value: 'contents', label: 'Contents' },
      { value: 'requests', label: 'Requests', authOnly: true },
      { value: 'addon', label: 'Addon' },
      { value: 'update', label: 'Update', authOnly: true },
      { value: 'history', label: 'History' }
      ],
      raidAssignments: [
      { value: 'overview', label: 'Overview' },
      { value: 'tactics', label: 'Tactics' },
      { value: 'history', label: 'History' }
      ],
      raidSignups: [
      { value: 'templates', label: 'Templates' },
      { value: 'events', label: 'Events' },
      { value: 'calendar', label: 'Calendar' },
      { value: 'history', label: 'History' },
      { value: 'absences', label: 'Absences' }
      ],
      loot: [
      { value: 'overview', label: 'Priority Overview' },
      { value: 'assignment', label: 'Priority Assignment', authOnly: true },
      { value: 'scoring', label: 'Scoring', authOnly: true },
      { value: 'assigned', label: 'Assigned Loot', authOnly: true }
      ],
      recruitment: [
      { value: 'roster', label: 'Roster', authOnly: true },
      { value: 'planning', label: 'Roster Planning', authOnly: true },
      { value: 'focus', label: 'Recruitment Focus' },
      { value: 'applications', label: 'Applications' }
      ],
      admin: [
      { value: 'officerRoles', label: 'Officer Roles', authOnly: true },
      { value: 'config', label: 'Config', authOnly: true },
      { value: 'itemsdb', label: 'Master Items DB', authOnly: true },
      { value: 'instructions', label: 'Site Instructions', authOnly: true },
      { value: 'todo', label: 'To-do List', authOnly: true }
      ],
      resources: [
      { value: 'bis', label: 'BiS Lists' },
      { value: 'weakauras', label: 'Weakauras' },
      { value: 'cheatsheets', label: 'Cheat Sheets' },
      { value: 'raidlogs', label: 'Raid Logs' },
      { value: 'wipefest', label: 'Wipefest' }
      ]
    };

    if (isAuthenticated) return allTabs;

    return {
      bank: allTabs.bank.filter(tab => tab.value === 'contents'),
      raidAssignments: allTabs.raidAssignments.filter(tab => tab.value === 'overview' || tab.value === 'tactics'),
      raidSignups: allTabs.raidSignups.filter(tab => tab.value === 'events' || tab.value === 'calendar' || tab.value === 'absences'),
      loot: allTabs.loot.filter(tab => tab.value === 'overview' || tab.value === 'assigned'),
      recruitment: allTabs.recruitment.filter(tab => tab.value === 'focus' || tab.value === 'applications'),
      admin: [],
      resources: allTabs.resources,
    };
  }, [isAuthenticated]);

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
    adminSubTab,
    setAdminSubTab,
    resourcesSubTab,
    setResourcesSubTab,
    handleMainNavSelect,
    getDropdownItemActiveState,
    subTabs,
  };
}
