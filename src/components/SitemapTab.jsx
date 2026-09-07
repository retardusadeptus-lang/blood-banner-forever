import { useMemo, useState } from 'react';
import { getEffectiveGroupKey, getEffectiveSurfaceRoles, getEffectiveTabOrder, getSiteTabMetadata, SITE_NAV_GROUPS, SITE_ROLES, SITE_TABS } from '../config/siteRegistry';

const ROLE_COLUMNS = ['Public', 'Guild Member', 'Officer', 'Admin'];
const tab = (registryTabId, label, visibleRoles, sections, actions = []) => ({ registryTabId, label, visibleRoles, sections, actions });
const action = (label, visibleRoles, usableRoles) => ({ label, visibleRoles, usableRoles });

function getRegistryTabById(tabId) {
  return SITE_TABS.find(tabItem => tabItem.id === tabId) || null;
}

function getRegistryGroupKey(groupLabel) {
  return SITE_NAV_GROUPS.find(group => group.label === groupLabel)?.key || null;
}

function getVisibilityStatus(entries, role) {
  const visibleCount = entries.filter(entry => entry.visibleRoles.includes(role)).length;
  if (visibleCount === entries.length) return 'all';
  if (visibleCount > 0) return 'some';
  return 'none';
}

function VisibilityFlag({ status, role, legend = false }) {
  const flag = status === 'all' ? '●' : status === 'some' ? '◐' : '○';
  const label = status === 'all' ? 'Everything visible' : status === 'some' ? 'Partially visible' : 'Nothing visible';
  const color = status === 'all' ? 'text-emerald-400' : status === 'some' ? 'text-amber-300' : 'text-red-400';
  const accessibleLabel = legend ? label : `${role}: ${label}`;
  return <span className={`${color} ${status === 'all' ? 'text-[21px]' : 'text-sm'} font-bold leading-none`} title={accessibleLabel} aria-label={accessibleLabel}>{flag}</span>;
}

function VisibilitySummary({ entries }) {
  return (
    <>
      {ROLE_COLUMNS.map(role => (
        <span key={role} className="flex items-center justify-center" aria-label={`${role} visibility`}>
          <VisibilityFlag status={getVisibilityStatus(entries, role)} role={role} />
        </span>
      ))}
    </>
  );
}

function ActionVisibilityFlag({ actionEntry, role }) {
  const visible = actionEntry.visibleRoles.includes(role);
  const usable = actionEntry.usableRoles.includes(role);
  const label = `${role}: ${visible ? 'Action surfaced' : 'Action hidden'}; ${usable ? 'usable' : 'view only'}`;
  return (
    <span title={label} aria-label={label}>
      <VisibilityFlag status={visible ? 'all' : 'none'} role={role} />
    </span>
  );
}

const SITE_MAP = [
  {
    group: 'Guild Bank',
    tabs: [
      tab('guild-bank.contents', 'Contents', ['Public', 'Guild Member', 'Officer', 'Admin'], ['Inventory search', 'Category and subcategory filters', 'Item request basket'], [action('Add item request', ['Public', 'Guild Member', 'Officer', 'Admin'], ['Guild Member', 'Officer', 'Admin'])]),
      tab('guild-bank.requests', 'Requests', ['Officer', 'Admin'], ['Open requests', 'Request resolution controls', 'Archived request controls'], [action('Approve or deny request', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Process request basket', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Export requests CSV', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Copy approved requests JSON', ['Officer', 'Admin'], ['Officer', 'Admin'])]),
      tab('guild-bank.addon', 'Addon', ['Officer', 'Admin'], ['Addon download and instructions', 'Bank JSON import', 'Import preview and save controls'], [action('Import JSON', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Clear imported update', ['Officer', 'Admin'], ['Officer', 'Admin'])]),
      tab('guild-bank.history', 'History', ['Officer', 'Admin'], ['Archived request history', 'Bank contents history', 'Restorable item history'], [action('Restore archived item or request', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Delete archived request', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Export history CSV', ['Officer', 'Admin'], ['Officer', 'Admin'])]),
    ],
  },
  {
    group: 'Raid Assignments',
    tabs: [
      tab('raid-assignments.overview', 'Overview', ['Public', 'Guild Member', 'Officer', 'Admin'], ['Raid and phase selectors', 'Boss enablement and ordering', 'Assignment roster layout', 'Save and archive controls'], [action('Enter edit mode', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Save assignment changes', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Cancel edit mode', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Export raid assignments JSON', ['Public', 'Guild Member', 'Officer', 'Admin'], ['Public', 'Guild Member', 'Officer', 'Admin']), action('Copy raid assignments JSON', ['Public', 'Guild Member', 'Officer', 'Admin'], ['Public', 'Guild Member', 'Officer', 'Admin']), action('Import previous raid as baseline', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Auto-fill assignments', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Reset all assignments', ['Officer', 'Admin'], ['Officer', 'Admin'])]),
      tab('raid-assignments.tactics', 'Tactics', ['Public', 'Guild Member', 'Officer', 'Admin'], ['Boss selector', 'Role and class filters', 'Tactic sections and media']),
    ],
  },
  {
    group: 'Raid Signups',
    tabs: [
      tab('raid-signups.templates', 'Templates', ['Officer', 'Admin'], ['Signup templates', 'Group configuration', 'Template save controls']),
      tab('raid-signups.events', 'Events', ['Public', 'Guild Member', 'Officer', 'Admin'], ['Event list and signup groups', 'Signup controls', 'Attendance and import tools'], [action('Sign up for event', ['Public', 'Guild Member', 'Officer', 'Admin'], ['Guild Member', 'Officer', 'Admin']), action('Edit event', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Open, lock, or archive event', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Save event details and groups', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Import Raid Helper attendance', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Delete event or raid log', ['Officer', 'Admin'], ['Officer', 'Admin'])]),
      tab('raid-signups.calendar', 'Calendar', ['Public', 'Guild Member', 'Officer', 'Admin'], ['Monthly event calendar', 'Signup event details', 'Absence indicators']),
      tab('raid-signups.history', 'History', ['Officer', 'Admin'], ['Archived signup events', 'Historical attendance', 'Event detail views']),
      tab('raid-signups.absences', 'Absences', ['Public', 'Guild Member', 'Officer', 'Admin'], ['Personal absence view', 'Officer absence overview', 'Absence create and edit controls'], [action('Create or edit own absence', ['Guild Member', 'Officer', 'Admin'], ['Guild Member', 'Officer', 'Admin']), action('Edit or delete any absence', ['Officer', 'Admin'], ['Officer', 'Admin'])]),
    ],
  },
  {
    group: 'Recruitment',
    tabs: [
      tab('recruitment.planning', 'Roster Planning', ['Officer', 'Admin'], ['Recruitment roster', 'Class and spec needs', 'Planning notes']),
      tab('recruitment.focus', 'Recruitment Focus', ['Public', 'Guild Member', 'Officer', 'Admin'], ['Recruitment summary', 'Class and spec focus', 'Officer-only notes'], [action('Enter edit mode', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Add or remove focus', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Save recruitment focus', ['Officer', 'Admin'], ['Officer', 'Admin'])]),
      tab('recruitment.applications', 'Applications', ['Public', 'Guild Member', 'Officer', 'Admin'], ['Application form', 'Applicant status list', 'Officer review controls'], [action('Submit application', ['Public', 'Guild Member', 'Officer', 'Admin'], ['Public', 'Guild Member', 'Officer', 'Admin']), action('Edit application instructions', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Review, approve, or reject application', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Delete application', ['Officer', 'Admin'], ['Officer', 'Admin'])]),
    ],
  },
  {
    group: 'Resources',
    tabs: [
      tab('resources.bis', 'BiS Lists', ['Public', 'Guild Member', 'Officer', 'Admin'], ['Phase and spec selectors', 'Mannequin item layout', 'BiS and optional item controls'], [action('Enter edit mode', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Save BiS configuration', ['Officer', 'Admin'], ['Officer', 'Admin'])]),
      tab('resources.weakauras', 'Weakauras', ['Public', 'Guild Member', 'Officer', 'Admin'], ['WeakAura list and filters', 'Aura detail and copy controls', 'Officer create and edit controls'], [action('Copy aura string', ['Public', 'Guild Member', 'Officer', 'Admin'], ['Public', 'Guild Member', 'Officer', 'Admin']), action('Create or edit aura', ['Officer', 'Admin'], ['Officer', 'Admin'])]),
      tab('resources.cheatsheets', 'Cheat Sheets', ['Public', 'Guild Member', 'Officer', 'Admin'], ['Phase, raid, and class selectors', 'Boss tactic cards', 'Consumable and assignment details']),
      tab('resources.raidlogs', 'Raid Logs', ['Public', 'Guild Member', 'Officer', 'Admin'], ['Raid log list', 'Attendance and performance details', 'Officer sync controls'], [action('Import Raid Helper log', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Apply signup attendance', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Save raid log', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Delete raid log', ['Officer', 'Admin'], ['Officer', 'Admin'])]),
      tab('resources.wipefest', 'Wipefest', ['Public', 'Guild Member', 'Officer', 'Admin'], ['Report selector', 'Encounter summaries', 'Wipe details']),
    ],
  },
  {
    group: 'Loot Council',
    tabs: [
      tab('loot.overview', 'Priority Overview', ['Public', 'Guild Member', 'Officer', 'Admin'], ['Phase selector', 'Priority item ledger', 'Player priority queues', 'Officer clear and save controls'], [action('Clear priority queue', ['Officer', 'Admin'], ['Officer', 'Admin'])]),
      tab('loot.assignment', 'Priority Assignment', ['Officer', 'Admin'], ['Phase selector', 'Item search and filters', 'Eligible player ranking', 'Priority and awarded controls'], [action('Save priority assignment', ['Officer', 'Admin'], ['Officer', 'Admin'])]),
      tab('loot.scoring', 'Scoring', ['Admin'], ['Scoring configuration', 'Player score breakdowns', 'Attendance and parse details']),
      tab('loot.assigned', 'Assigned Loot', ['Public', 'Guild Member', 'Officer', 'Admin'], ['Assigned item list', 'Awarded player details', 'Assignment timestamps'], [action('View assignment details', ['Public', 'Guild Member', 'Officer', 'Admin'], ['Public', 'Guild Member', 'Officer', 'Admin'])]),
    ],
  },
  {
    group: 'Admin',
    tabs: [
      tab('admin.officerRoles', 'Officer Roles', ['Officer', 'Admin'], ['Officer role rankings', 'Battle.net access roles', 'Role save controls'], [action('Enter edit mode', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Add or remove role', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Save officer roles', ['Officer', 'Admin'], ['Officer', 'Admin'])]),
      tab('admin.roster', 'Roster', ['Officer', 'Admin'], ['Guild roster', 'Character claims', 'Roster and attendance editing'], [action('Edit member', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Add member', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Delete member', ['Officer', 'Admin'], ['Officer', 'Admin'])]),
      tab('admin.config', 'Config', ['Officer', 'Admin'], ['Default site phase', 'Discord and guild configuration', 'Scoring weights', 'Battle.net access configuration'], [action('Save configuration', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Add or remove Battle.net access role', ['Officer', 'Admin'], ['Admin'])]),
      tab('admin.itemsdb', 'Master Items DB', ['Officer', 'Admin'], ['Item database search and filters', 'Item eligibility and source fields', 'BiS priority maintenance'], [action('Add or edit item', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Delete item', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Save item database changes', ['Officer', 'Admin'], ['Officer', 'Admin'])]),
      tab('admin.todo', 'To-do List', ['Officer', 'Admin'], ['Task list', 'Personal task filter', 'Task editing and save controls'], [action('Add or edit task', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Delete task', ['Officer', 'Admin'], ['Officer', 'Admin']), action('Save to-do list', ['Officer', 'Admin'], ['Officer', 'Admin'])]),
      tab('admin.sitemap', 'Sitemap', ['Admin'], ['Role visibility matrix', 'Tab and sub-tab sections']),
    ],
  },
];

const SITE_TAB_DETAILS_BY_ID = Object.fromEntries(
  SITE_MAP.flatMap(section => section.tabs.map(entry => [entry.registryTabId, entry]))
);

export default function SitemapTab({
  surfaceRolesByTab = {},
  groupByTab = {},
  orderByTab = {},
  updateSiteVisibility,
  updateSiteLayout,
  saveSiteVisibility,
  siteVisibilityDirty = false,
  isSavingSiteVisibility = false,
  siteTabMetadata
}) {
  const [openGroups, setOpenGroups] = useState(() => new Set(SITE_MAP.map(section => section.group)));
  const [openTabs, setOpenTabs] = useState(() => new Set());

  const getVisibleRoles = entry => {
    const registryTab = getRegistryTabById(entry.registryTabId);
    return registryTab ? getEffectiveSurfaceRoles(registryTab, surfaceRolesByTab) : entry.visibleRoles;
  };

  const effectiveSiteMap = SITE_NAV_GROUPS.map(registryGroup => ({
    group: registryGroup.label,
    tabs: SITE_TABS.map(tabItem => getSiteTabMetadata(tabItem.id, { groupByTab, orderByTab }))
      .filter(registryTab => registryTab.groupKey === registryGroup.key)
      .slice()
      .sort((left, right) => left.order - right.order)
      .map(registryTab => {
        return SITE_TAB_DETAILS_BY_ID[registryTab.id] || null;
      })
      .filter(Boolean)
  })).filter(section => section.tabs.length > 0);

  const getTabPosition = registryTab => {
    if (!registryTab) return { groupKey: null, tabs: [], index: -1 };
    const groupKey = getEffectiveGroupKey(registryTab, groupByTab);
    const tabs = SITE_TABS.map(tabItem => getSiteTabMetadata(tabItem.id, { groupByTab, orderByTab }))
      .filter(tabItem => tabItem.groupKey === groupKey)
      .slice()
      .sort((left, right) => left.order - right.order);
    return { groupKey, tabs, index: tabs.findIndex(tabItem => tabItem.id === registryTab.id) };
  };

  const moveTab = (registryTab, direction) => {
    if (!registryTab || !updateSiteLayout) return;
    const { groupKey, tabs, index } = getTabPosition(registryTab);
    const targetIndex = index + direction;
    if (!groupKey || index < 0 || targetIndex < 0 || targetIndex >= tabs.length) return;
    const targetTab = tabs[targetIndex];
    updateSiteLayout(registryTab.id, groupKey, getEffectiveTabOrder(targetTab, orderByTab));
    updateSiteLayout(targetTab.id, groupKey, getEffectiveTabOrder(registryTab, orderByTab));
  };

  const moveTabToGroup = (registryTab, nextGroupKey) => {
    if (!registryTab || !updateSiteLayout || !nextGroupKey) return;
    const targetTabs = SITE_TABS.map(tabItem => getSiteTabMetadata(tabItem.id, { groupByTab, orderByTab }))
      .filter(tabItem => tabItem.groupKey === nextGroupKey && tabItem.id !== registryTab.id);
    const nextOrder = targetTabs.length > 0
      ? Math.max(...targetTabs.map(tabItem => getEffectiveTabOrder(tabItem, orderByTab))) + 1
      : 0;
    updateSiteLayout(registryTab.id, nextGroupKey, nextOrder);
  };

  const tabKeys = useMemo(() => SITE_MAP.flatMap(section => section.tabs.map(entry => `${section.group}-${entry.label}`)), []);

  const toggleSetValue = (setter, key) => {
    setter(previous => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    if (openGroups.size < SITE_MAP.length) {
      setOpenGroups(new Set(SITE_MAP.map(section => section.group)));
      return;
    }

    if (openTabs.size < tabKeys.length) {
      setOpenTabs(new Set(tabKeys));
      return;
    }

  };

  const collapseAll = () => {
    if (openTabs.size > 0) {
      setOpenTabs(new Set());
      return;
    }

    setOpenGroups(new Set());
  };

  return (
    <section data-site-tab-id={siteTabMetadata?.id} data-site-tab-group={siteTabMetadata?.groupKey} className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Site Sitemap</h2>
          <p className="mt-1 text-sm text-slate-400">Visibility by access level. Guild Member means a roster character claimed through Battle.net. Visibility does not imply edit access.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {saveSiteVisibility && (
            <button type="button" onClick={saveSiteVisibility} disabled={!siteVisibilityDirty || isSavingSiteVisibility} className={`rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-wider ${siteVisibilityDirty ? 'border-emerald-700/50 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40' : 'border-slate-800 bg-slate-900 text-slate-600'}`}>
              {isSavingSiteVisibility ? 'Saving...' : 'Save visibility'}
            </button>
          )}
          <button type="button" onClick={expandAll} className="rounded-lg border border-cyan-700/50 bg-cyan-950/30 px-3 py-2 text-xs font-bold uppercase tracking-wider text-cyan-300 hover:bg-cyan-900/40">Expand all</button>
          <button type="button" onClick={collapseAll} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-800">Collapse all</button>
        </div>
      </div>

      <div className="space-y-3 overflow-x-auto">
        <div className="sticky top-0 z-20 grid min-w-[760px] grid-cols-[minmax(220px,1fr)_repeat(4,minmax(90px,1fr))] items-center rounded-xl border border-slate-800 bg-slate-950/95 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 shadow-lg backdrop-blur">
          <span>Visibility</span>
          {ROLE_COLUMNS.map(role => (
            <span key={role} className="flex items-center justify-center">
              <span>{role}</span>
            </span>
          ))}
        </div>

        {effectiveSiteMap.map(section => {
          const groupOpen = openGroups.has(section.group);
          const groupEntries = section.tabs.flatMap(entry => entry.sections.map(() => ({
            ...entry,
            visibleRoles: getVisibleRoles(entry)
          })));
          return (
            <div key={section.group} className="min-w-[760px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
              <button type="button" onClick={() => toggleSetValue(setOpenGroups, section.group)} className="grid w-full grid-cols-[minmax(220px,1fr)_repeat(4,minmax(90px,1fr))] items-center bg-slate-900/80 px-4 py-3 text-left hover:bg-slate-900">
                <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-cyan-300"><span className="text-slate-500">{groupOpen ? '−' : '+'}</span>{section.group}</span>
                <VisibilitySummary entries={groupEntries} />
              </button>

              {groupOpen && (
                <div className="space-y-2 p-3">
                  {section.tabs.map(entry => {
                    const tabKey = `${section.group}-${entry.label}`;
                    const tabOpen = openTabs.has(tabKey);
                    const visibleRoles = getVisibleRoles(entry);
                    const registryTab = getRegistryTabById(entry.registryTabId);
                    const tabPosition = getTabPosition(registryTab);
                    return (
                      <div key={tabKey} className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50">
                        <button type="button" onClick={() => toggleSetValue(setOpenTabs, tabKey)} className="grid w-full grid-cols-[minmax(220px,1fr)_repeat(4,minmax(90px,1fr))] items-center px-4 py-3 text-left hover:bg-slate-900">
                          <span className="flex items-center gap-3"><span className="text-slate-500">{tabOpen ? '−' : '+'}</span><span className="font-semibold text-slate-200">{entry.label}</span>{entry.label === section.tabs[0].label && <span className="rounded-full border border-amber-600/40 bg-amber-950/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">Default tab</span>}</span>
                          <VisibilitySummary entries={entry.sections.map(() => ({ ...entry, visibleRoles }))} />
                        </button>

                        {tabOpen && (
                          <div className="border-t border-slate-800">
                            {registryTab && updateSiteVisibility && (
                              <div className="flex flex-wrap items-center gap-3 border-b border-cyan-900/40 bg-cyan-950/20 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <span className="text-cyan-300">Surfaced to</span>
                                {SITE_ROLES.map(role => (
                                  <label key={role} className="flex items-center gap-1.5 normal-case tracking-normal text-slate-300">
                                    <input
                                      type="checkbox"
                                      checked={visibleRoles.includes(role)}
                                      onChange={event => updateSiteVisibility(registryTab.id, event.target.checked
                                        ? [...visibleRoles, role]
                                        : visibleRoles.filter(currentRole => currentRole !== role))}
                                      className="accent-cyan-500"
                                    />
                                    {role}
                                  </label>
                                ))}
                              </div>
                            )}
                            {registryTab && updateSiteLayout && (
                              <div className="flex flex-wrap items-center gap-2 border-b border-cyan-900/40 bg-slate-900/70 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <label className="flex items-center gap-2">
                                  <span className="text-cyan-300">Group</span>
                                  <select
                                    value={tabPosition.groupKey || getRegistryGroupKey(section.group)}
                                    onChange={event => moveTabToGroup(registryTab, event.target.value)}
                                    className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] font-semibold normal-case tracking-normal text-slate-200"
                                  >
                                    {SITE_NAV_GROUPS.map(group => <option key={group.key} value={group.key}>{group.label}</option>)}
                                  </select>
                                </label>
                                <button type="button" onClick={() => moveTab(registryTab, -1)} disabled={tabPosition.index <= 0} className="rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-300 disabled:cursor-not-allowed disabled:text-slate-700">Move up</button>
                                <button type="button" onClick={() => moveTab(registryTab, 1)} disabled={tabPosition.index < 0 || tabPosition.index >= tabPosition.tabs.length - 1} className="rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-300 disabled:cursor-not-allowed disabled:text-slate-700">Move down</button>
                              </div>
                            )}
                            {entry.sections.map(item => (
                              <div key={`${tabKey}-${item}`} className="grid grid-cols-[minmax(220px,1fr)_repeat(4,minmax(90px,1fr))] gap-2 border-b border-slate-800/70 bg-slate-950/40 px-4 py-2 text-[11px] last:border-b-0">
                                <span className="text-slate-400">{item}</span>
                                {ROLE_COLUMNS.map(role => {
                                  const visible = visibleRoles.includes(role);
                                  return <span key={role} className="text-center"><VisibilityFlag status={visible ? 'all' : 'none'} role={role} /></span>;
                                })}
                              </div>
                            ))}
                            {entry.actions.length > 0 && (
                              <div className="border-t border-cyan-900/50 bg-slate-900/70">
                                <div className="grid grid-cols-[minmax(220px,1fr)_repeat(4,minmax(90px,1fr))] items-center border-b border-slate-800 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                                  <span>Actions</span>
                                  {ROLE_COLUMNS.map(role => <span key={role} className="text-center">Surfaced</span>)}
                                </div>
                                {entry.actions.map(actionEntry => (
                                  <div key={`${tabKey}-action-${actionEntry.label}`} className="grid grid-cols-[minmax(220px,1fr)_repeat(4,minmax(90px,1fr))] gap-2 border-b border-slate-800/70 px-4 py-2 text-[11px] last:border-b-0">
                                    <span className="flex flex-col gap-0.5 text-slate-300"><span className="flex items-center gap-2"><span className="text-cyan-400">▸</span>{actionEntry.label}</span><span className="pl-4 text-[10px] text-slate-500">Usable by: {actionEntry.usableRoles.join(', ')}</span></span>
                                    {ROLE_COLUMNS.map(role => (
                                      <span key={role} className="text-center"><ActionVisibilityFlag actionEntry={actionEntry} role={role} /></span>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
