import { useEffect, useMemo, useState } from 'react';

export default function DashboardNavigationTabs({
  activeTab,
  hoveredNavTab,
  setHoveredNavTab,
  handleMainNavSelect,
  getDropdownItemActiveState,
  isAuthenticated,
  subTabs,
}) {
  const navItems = [
    { keyName: 'bank', label: 'Guild Bank', mainTab: 'bank', items: subTabs?.bank || [] },
    { keyName: 'raidAssignments', label: 'Raid Assignments', mainTab: 'raidAssignments', items: subTabs?.raidAssignments || [] },
    { keyName: 'raidSignups', label: 'Raid Signups', mainTab: 'raidSignups', items: subTabs?.raidSignups || [] },
    { keyName: 'recruitment', label: 'Recruitment', mainTab: 'recruitment', items: subTabs?.recruitment || [] },
    { keyName: 'profiles', label: 'Profiles', mainTab: 'profiles', items: subTabs?.profiles || [] },
    { keyName: 'resources', label: 'Resources', mainTab: 'resources', items: subTabs?.resources || [] },
    { keyName: 'loot', label: 'Loot Council', mainTab: 'loot', items: subTabs?.loot || [] },
    { keyName: 'admin', label: 'Admin', mainTab: 'admin', items: subTabs?.admin || [] },
  ];

  const visibleNavItems = navItems.filter(item => item.items.length > 0);

  const isTabActive = (keyName, mainTab) => {
    if (keyName === 'bank') {
      return activeTab === 'bank' || activeTab === 'bankRequests';
    }
    if (keyName === 'loot') {
      return activeTab === 'loot' || activeTab === 'scoring';
    }
    if (keyName === 'recruitment') {
      return activeTab === 'recruitmentAbout' || activeTab === 'roster' || activeTab === 'recruitmentPlanning' || activeTab === 'recruitmentFocus' || activeTab === 'recruitmentApplications';
    }
    if (keyName === 'admin') {
      return activeTab === 'officerRoles' || activeTab === 'discordBotConfig' || activeTab === 'itemsdb';
    }
    if (keyName === 'resources') {
      return activeTab === 'bis';
    }
    return activeTab === mainTab;
  };

  const activeNavKey = useMemo(() => {
    const activeItem = visibleNavItems.find(item => isTabActive(item.keyName, item.mainTab));
    return activeItem?.keyName || visibleNavItems[0]?.keyName || null;
  }, [activeTab, visibleNavItems]);

  const [mobileOpenKey, setMobileOpenKey] = useState(activeNavKey);

  useEffect(() => {
    setMobileOpenKey(prev => prev || activeNavKey);
  }, [activeNavKey]);

  const mobileOpenItem = visibleNavItems.find(item => item.keyName === (mobileOpenKey || activeNavKey)) || null;

  return (
    <>
      <div className="md:hidden space-y-2">
        <div className="relative z-30 flex w-full flex-wrap items-start gap-2 overflow-visible pt-0 pb-0 mb-0">
          {visibleNavItems.map(item => {
            const isActive = isTabActive(item.keyName, item.mainTab);
            const isOpen = (mobileOpenKey || activeNavKey) === item.keyName;
            const shouldShowDropdown = item.items.length > 1;

            return (
              <button
                key={item.keyName}
                type="button"
                onClick={() => {
                  if (shouldShowDropdown) {
                    setMobileOpenKey(item.keyName);
                  }
                  handleMainNavSelect(item.mainTab, item.items?.[0]?.value);
                }}
                className={`relative z-20 whitespace-nowrap px-4 py-2.5 font-bold text-xs uppercase tracking-wider rounded-t-lg transition-colors ${isActive
                  ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800 -mb-px'
                  : isOpen && shouldShowDropdown
                    ? 'bg-slate-900/70 text-slate-200 border border-slate-800'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {mobileOpenItem && mobileOpenItem.items.length > 1 && (
          <div className="z-[60] flex flex-wrap gap-1 border border-slate-800 rounded-lg bg-slate-950/95 px-2 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
            {mobileOpenItem.items.map(tab => {
              const isSubActive = getDropdownItemActiveState(mobileOpenItem.keyName, tab.value);
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleMainNavSelect(mobileOpenItem.mainTab, tab.value)}
                  className={`flex-none whitespace-nowrap px-3 py-2 font-semibold text-xs uppercase tracking-wider transition-colors rounded-lg text-center ${isSubActive ? 'bg-slate-900 border border-slate-800 text-cyan-400' : 'text-amber-300 hover:text-slate-300 hover:bg-slate-900/50'}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative z-30 hidden md:flex w-full flex-wrap items-start gap-2 overflow-visible pt-0 pb-0 mb-0">
        {visibleNavItems.map(item => {
          const isActive = isTabActive(item.keyName, item.mainTab);
          const isHovered = hoveredNavTab === item.keyName;
          const shouldShowDropdown = item.items.length > 1;

          return (
            <div
              key={item.keyName}
              className="relative inline-flex items-start"
              onMouseEnter={() => !shouldShowDropdown ? setHoveredNavTab(null) : setHoveredNavTab(item.keyName)}
              onMouseLeave={() => setHoveredNavTab(null)}
            >
              <button
                type="button"
                onClick={() => handleMainNavSelect(item.mainTab, item.items?.[0]?.value)}
                className={`relative z-20 whitespace-nowrap px-5 py-3 font-bold text-sm uppercase tracking-wider rounded-t-lg transition-colors ${isActive
                  ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800 -mb-px'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}
              >
                {item.label}
              </button>
              {shouldShowDropdown && isHovered && (
                <div
                  className={`absolute top-full z-[60] flex flex-wrap gap-1 border-l border-r border-b border-slate-800 rounded-b-lg bg-slate-950/95 px-2 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.35)] overflow-visible ${item.keyName === 'bank' ? 'left-0 justify-start' : 'left-1/2 -translate-x-1/2 justify-center'}`}
                  style={{ minWidth: '240px', width: 'max-content', maxWidth: 'min(95vw, 760px)' }}
                >
                  {item.items.map(tab => {
                    const isSubActive = getDropdownItemActiveState(item.keyName, tab.value);
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => handleMainNavSelect(item.mainTab, tab.value)}
                        className={`flex-none whitespace-nowrap px-3 py-2 font-semibold text-xs uppercase tracking-wider transition-colors rounded-lg text-center ${isSubActive ? 'bg-slate-900 border border-slate-800 text-cyan-400' : 'text-amber-300 hover:text-slate-300 hover:bg-slate-900/50'}`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
