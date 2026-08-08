import { useCallback, useEffect, useMemo, useState } from 'react';

const AUTH_ONLY_TABS = ['bankRequests', 'loot', 'roster', 'scoring', 'itemsdb', 'officerRoles', 'discordBotConfig'];

export default function useDashboardNavigation({ isAuthenticated }) {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('active-tab') || 'loot');
  const [hoveredNavTab, setHoveredNavTab] = useState(null);
  const [bankSubTab, setBankSubTab] = useState('contents');
  const [raidAssignmentsSubTab, setRaidAssignmentsSubTab] = useState('overview');
  const [raidSignupsSubTab, setRaidSignupsSubTab] = useState('templates');
  const [lootSubTab, setLootSubTab] = useState('overview');
  const [adminSubTab, setAdminSubTab] = useState('officerRoles');
  const [resourcesSubTab, setResourcesSubTab] = useState('bis');

  useEffect(() => {
    localStorage.setItem('active-tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!isAuthenticated && AUTH_ONLY_TABS.includes(activeTab)) {
      setActiveTab('loot');
      setLootSubTab('overview');
    }
  }, [activeTab, isAuthenticated]);

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

    if (groupKey === 'admin') {
      if (subTab === 'officerRoles') return activeTab === 'officerRoles' && adminSubTab === 'officerRoles';
      if (subTab === 'config') return activeTab === 'discordBotConfig';
      if (subTab === 'itemsdb') return activeTab === 'itemsdb';
      if (subTab === 'todo') return activeTab === 'officerRoles' && adminSubTab === 'todo';
      return false;
    }

    if (groupKey === 'resources') {
      return activeTab === 'bis' && resourcesSubTab === subTab;
    }

    return activeTab === groupKey;
  }, [activeTab, adminSubTab, bankSubTab, lootSubTab, raidAssignmentsSubTab, raidSignupsSubTab, resourcesSubTab]);

  const subTabs = useMemo(() => ({
    bank: [
      { value: 'contents', label: 'Contents' },
      { value: 'requests', label: 'Requests', authOnly: true },
      { value: 'addon', label: 'Addon' },
      { value: 'update', label: 'Update', authOnly: true },
      { value: 'history', label: 'History' }
    ],
    raidAssignments: [
      { value: 'overview', label: 'Overview' },
      { value: 'history', label: 'History' }
    ],
    raidSignups: [
      { value: 'templates', label: 'Templates' },
      { value: 'events', label: 'Events' },
      { value: 'group-config', label: 'Group Config' },
      { value: 'history', label: 'History' }
    ],
    loot: [
      { value: 'overview', label: 'Priority Overview' },
      { value: 'assignment', label: 'Priority Assignment', authOnly: true },
      { value: 'scoring', label: 'Scoring', authOnly: true },
      { value: 'assigned', label: 'Assigned Loot', authOnly: true },
      { value: 'roster', label: 'Roster', authOnly: true }
    ],
    admin: [
      { value: 'officerRoles', label: 'Officer Roles', authOnly: true },
      { value: 'config', label: 'Config', authOnly: true },
      { value: 'itemsdb', label: 'Master Items DB', authOnly: true },
      { value: 'todo', label: 'To-do List', authOnly: true }
    ],
    resources: [
      { value: 'bis', label: 'BiS Lists' },
      { value: 'tactics', label: 'Tactics' },
      { value: 'weakauras', label: 'Weakauras' },
      { value: 'cheatsheets', label: 'Cheat Sheets' },
      { value: 'instructions', label: 'Site Instructions' },
      { value: 'raidlogs', label: 'Raid Logs' },
      { value: 'wowaudit', label: 'WoWAudit' },
      { value: 'wipefest', label: 'Wipefest' }
    ]
  }), []);

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
    adminSubTab,
    setAdminSubTab,
    resourcesSubTab,
    setResourcesSubTab,
    handleMainNavSelect,
    getDropdownItemActiveState,
    subTabs,
  };
}
