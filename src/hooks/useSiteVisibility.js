import { useEffect, useState } from 'react';

export default function useSiteVisibility({ fetchData, putData, canEdit = false }) {
  const [surfaceRolesByTab, setSurfaceRolesByTab] = useState({});
  const [groupByTab, setGroupByTab] = useState({});
  const [orderByTab, setOrderByTab] = useState({});
  const [orderByGroup, setOrderByGroup] = useState({});
  const [sectionVisibilityById, setSectionVisibilityById] = useState({});
  const [siteVisibilityDirty, setSiteVisibilityDirty] = useState(false);
  const [isSavingSiteVisibility, setIsSavingSiteVisibility] = useState(false);
  const [siteVisibilityError, setSiteVisibilityError] = useState('');

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
        setOrderByGroup(data?.order_by_group && typeof data.order_by_group === 'object' ? data.order_by_group : {});
        setSectionVisibilityById(data?.section_visibility_by_id && typeof data.section_visibility_by_id === 'object' ? data.section_visibility_by_id : {});
        setSiteVisibilityDirty(false);
      })
      .catch(error => console.error('Failed to load site visibility:', error));
    return () => { mounted = false; };
  }, [fetchData]);

  const updateSiteVisibility = (tabId, roles) => {
    if (!canEdit || isSavingSiteVisibility) return;
    setSurfaceRolesByTab(previous => ({ ...previous, [tabId]: roles }));
    setSiteVisibilityDirty(true);
  };

  const updateSiteLayout = (tabId, groupKey, order) => {
    if (!canEdit || isSavingSiteVisibility) return;
    setGroupByTab(previous => ({ ...previous, [tabId]: groupKey }));
    setOrderByTab(previous => ({ ...previous, [tabId]: order }));
    setSiteVisibilityDirty(true);
  };

  const updateSiteOrder = orders => {
    if (!canEdit || isSavingSiteVisibility || !orders) return;
    setOrderByTab(previous => ({ ...previous, ...orders }));
    setSiteVisibilityDirty(true);
  };

  const updateSiteGroupOrder = orders => {
    if (!canEdit || isSavingSiteVisibility || !orders) return;
    setOrderByGroup(previous => ({ ...previous, ...orders }));
    setSiteVisibilityDirty(true);
  };

  const updateSectionVisibility = (sectionId, visible) => {
    if (!canEdit || isSavingSiteVisibility) return;
    setSectionVisibilityById(previous => ({ ...previous, [sectionId]: Boolean(visible) }));
    setSiteVisibilityDirty(true);
  };

  const saveSiteVisibility = async () => {
    if (!canEdit || !siteVisibilityDirty) return;
    setIsSavingSiteVisibility(true);
    setSiteVisibilityError('');
    try {
      const saved = await putData('site-visibility', { surface_roles_by_tab: surfaceRolesByTab, group_by_tab: groupByTab, order_by_tab: orderByTab, order_by_group: orderByGroup, section_visibility_by_id: sectionVisibilityById });
      setSurfaceRolesByTab(saved?.surface_roles_by_tab || surfaceRolesByTab);
      setGroupByTab(saved?.group_by_tab || groupByTab);
      setOrderByTab(saved?.order_by_tab || orderByTab);
      setOrderByGroup(saved?.order_by_group || orderByGroup);
      setSectionVisibilityById(saved?.section_visibility_by_id || sectionVisibilityById);
      setSiteVisibilityDirty(false);
    } catch (error) {
      console.error('Failed to save site settings:', error);
      setSiteVisibilityError(error?.message || 'Failed to save site settings.');
    } finally {
      setIsSavingSiteVisibility(false);
    }
  };

  return {
    surfaceRolesByTab,
    groupByTab,
    orderByTab,
    orderByGroup,
    sectionVisibilityById,
    updateSiteVisibility,
    updateSiteLayout,
    updateSiteOrder,
    updateSiteGroupOrder,
    updateSectionVisibility,
    saveSiteVisibility,
    siteVisibilityDirty,
    isSavingSiteVisibility,
    siteVisibilityError
  };
}
