import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSiteNavigationGroups, getSiteTabUrl } from '../config/siteRegistry';

export default function DashboardNavigationTabs({
  activeSiteTabId,
  hoveredNavTab,
  setHoveredNavTab,
  handleMainNavSelect,
  getDropdownItemActiveState,
  subTabs,
  orderByGroup = {},
}) {
  const navItems = getSiteNavigationGroups({ orderByGroup }).map(group => ({
    keyName: group.key,
    label: group.label,
    mainTab: group.key,
    items: subTabs?.[group.key] || []
  }));

  const visibleNavItems = navItems.filter(item => item.items.length > 0);

  const getRestrictedTabTone = (tab, isActive = false) => {
    const roles = tab?.surfaceRoles || [];
    if (roles.length === 1 && roles[0] === 'Admin') {
      return 'theme-nav-subitem-admin';
    }
    if (roles.includes('Officer') && !roles.includes('Public') && !roles.includes('Guild Member')) {
      return 'theme-nav-subitem-officer';
    }
    return isActive ? 'theme-nav-subitem-active' : 'theme-nav-subitem-default';
  };

  const isTabActive = useCallback((items = []) => {
    return items.some(tab => tab.id === activeSiteTabId);
  }, [activeSiteTabId]);

  const activeNavKey = useMemo(() => {
    const activeItem = visibleNavItems.find(item => isTabActive(item.items));
    return activeItem?.keyName || visibleNavItems[0]?.keyName || null;
  }, [isTabActive, visibleNavItems]);

  const [mobileOpenKey, setMobileOpenKey] = useState(activeNavKey);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpenKey(prev => prev || activeNavKey);
  }, [activeNavKey]);

  const mobileOpenItem = visibleNavItems.find(item => item.keyName === (mobileOpenKey || activeNavKey)) || null;
  const handleNavigationClick = (event, tabId, callback = null) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    callback?.();
    handleMainNavSelect(tabId);
  };

  return (
    <>
      <div className="md:hidden space-y-2">
        <div className="relative z-30 flex w-full flex-wrap items-start gap-2 overflow-visible pt-0 pb-0 mb-0">
          {visibleNavItems.map(item => {
            const isActive = isTabActive(item.items);
            const isOpen = (mobileOpenKey || activeNavKey) === item.keyName;
            const shouldShowDropdown = item.items.length > 1;

            return (
              <a
                key={item.keyName}
                href={getSiteTabUrl(item.items?.[0]?.id) || '#'}
                onClick={event => {
                  if (shouldShowDropdown) {
                    handleNavigationClick(event, item.items?.[0]?.id, () => setMobileOpenKey(item.keyName));
                    return;
                  }
                  handleNavigationClick(event, item.items?.[0]?.id);
                }}
                className={`theme-nav-item relative z-20 whitespace-nowrap px-4 py-2.5 rounded-t-lg transition-colors ${isActive
                  ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800 -mb-px'
                  : isOpen && shouldShowDropdown
                    ? 'bg-slate-900/70 text-slate-200 border border-slate-800'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}
              >
                {item.label}
              </a>
            );
          })}
        </div>

        {mobileOpenItem && mobileOpenItem.items.length > 1 && (
          <div className="z-[60] flex flex-wrap gap-1 border border-slate-800 rounded-lg bg-slate-950/95 px-2 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
            {mobileOpenItem.items.map(tab => {
              const isSubActive = getDropdownItemActiveState(tab.id);
              return (
                <a
                  key={tab.value}
                  href={getSiteTabUrl(tab.id) || '#'}
                  onClick={event => handleNavigationClick(event, tab.id)}
                  className={`theme-nav-subitem flex-none whitespace-nowrap px-3 py-2 transition-colors rounded-lg text-center ${isSubActive ? `bg-slate-900 border border-slate-800 ${getRestrictedTabTone(tab, true)}` : `${getRestrictedTabTone(tab)} hover:bg-slate-900/50`}`}
                >
                  {tab.label}
                </a>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative z-30 hidden md:flex w-full flex-wrap items-start gap-2 overflow-visible pt-0 pb-0 mb-0">
        {visibleNavItems.map(item => {
          const isActive = isTabActive(item.items);
          const isHovered = hoveredNavTab === item.keyName;
          const shouldShowDropdown = item.items.length > 1;

          return (
            <div
              key={item.keyName}
              className="relative inline-flex items-start"
              onMouseEnter={() => !shouldShowDropdown ? setHoveredNavTab(null) : setHoveredNavTab(item.keyName)}
              onMouseLeave={() => setHoveredNavTab(null)}
            >
              <a
                href={getSiteTabUrl(item.items?.[0]?.id) || '#'}
                onClick={event => handleNavigationClick(event, item.items?.[0]?.id)}
                className={`theme-nav-item relative z-20 whitespace-nowrap px-5 py-3 rounded-t-lg transition-colors ${isActive
                  ? 'bg-slate-900 text-amber-500 border-t border-l border-r border-slate-800 -mb-px'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}
              >
                {item.label}
              </a>
              {shouldShowDropdown && isHovered && (
                <div
                  className={`absolute top-full z-[60] flex flex-wrap gap-1 border-l border-r border-b border-slate-800 rounded-b-lg bg-slate-950/95 px-2 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.35)] overflow-visible ${item.keyName === visibleNavItems[0]?.keyName ? 'left-0 justify-start' : 'left-1/2 -translate-x-1/2 justify-center'}`}
                  style={{ minWidth: '240px', width: 'max-content', maxWidth: 'min(95vw, 760px)' }}
                >
                  {item.items.map(tab => {
                    const isSubActive = getDropdownItemActiveState(tab.id);
                    return (
                      <a
                        key={tab.value}
                        href={getSiteTabUrl(tab.id) || '#'}
                        onClick={event => handleNavigationClick(event, tab.id)}
                        className={`theme-nav-subitem flex-none whitespace-nowrap px-3 py-2 transition-colors rounded-lg text-center ${isSubActive ? `bg-slate-900 border border-slate-800 ${getRestrictedTabTone(tab, true)}` : `${getRestrictedTabTone(tab)} hover:bg-slate-900/50`}`}
                      >
                        {tab.label}
                      </a>
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
