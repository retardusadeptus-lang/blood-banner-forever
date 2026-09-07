import { useEffect, useState } from 'react';

export default function useSiteVisibility({ fetchData, putData, canEdit = false }) {
  const [surfaceRolesByTab, setSurfaceRolesByTab] = useState({});
  const [groupByTab, setGroupByTab] = useState({});
  const [orderByTab, setOrderByTab] = useState({});
  const [siteVisibilityDirty, setSiteVisibilityDirty] = useState(false);
  const [isSavingSiteVisibility, setIsSavingSiteVisibility] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchData('site-visibility')
      .then(data => {
        if (!mounted) return;
        setSurfaceRolesByTab(data?.surface_roles_by_tab && typeof data.surface_roles_by_tab === 'object'
          ? data.surface_roles_by_tab
          : {});
        setGroupByTab(data?.group_by_tab && typeof data.group_by_tab === 'object' ? data.group_by_tab : {});
        setOrderByTab(data?.order_by_tab && typeof data.order_by_tab === 'object' ? data.order_by_tab : {});
        setSiteVisibilityDirty(false);
      })
      .catch(error => console.error('Failed to load site visibility:', error));
    return () => { mounted = false; };
  }, [fetchData]);

  const updateSiteVisibility = (tabId, roles) => {
    if (!canEdit) return;
    setSurfaceRolesByTab(previous => ({ ...previous, [tabId]: roles }));
    setSiteVisibilityDirty(true);
  };

  const updateSiteLayout = (tabId, groupKey, order) => {
    if (!canEdit) return;
    setGroupByTab(previous => ({ ...previous, [tabId]: groupKey }));
    setOrderByTab(previous => ({ ...previous, [tabId]: order }));
    setSiteVisibilityDirty(true);
  };

  const saveSiteVisibility = async () => {
    if (!canEdit || !siteVisibilityDirty) return;
    setIsSavingSiteVisibility(true);
    try {
      const saved = await putData('site-visibility', { surface_roles_by_tab: surfaceRolesByTab, group_by_tab: groupByTab, order_by_tab: orderByTab });
      setSurfaceRolesByTab(saved?.surface_roles_by_tab || surfaceRolesByTab);
      setGroupByTab(saved?.group_by_tab || groupByTab);
      setOrderByTab(saved?.order_by_tab || orderByTab);
      setSiteVisibilityDirty(false);
    } finally {
      setIsSavingSiteVisibility(false);
    }
  };

  return {
    surfaceRolesByTab,
    groupByTab,
    orderByTab,
    updateSiteVisibility,
    updateSiteLayout,
    saveSiteVisibility,
    siteVisibilityDirty,
    isSavingSiteVisibility
  };
}
