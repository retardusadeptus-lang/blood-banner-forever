import { useCallback } from 'react';
import { BOTTOM_SLOTS, PHASE_JSON_KEYS } from '../constants';
import * as helpers from '../utils/helpers';

export default function useDashboardHelpers({
  fetchData,
  putData,
  roster,
  playerStats,
  scoringConfig,
  raidLogs,
  setRoster,
  setRaidLogs,
  setSelectedItemName,
  setActiveTab,
  setLootSubTab,
  setSearchQuery,
  setIsSavingScoring,
  setScoringConfigDirty,
  setPlayerStatsDirty,
  setNewRaidDate,
  setNewRaidZone,
  scoringConfigDirty,
  playerStatsDirty,
  mutableItems,
  dbBisPriorities,
  selectedBisSpec,
  setItemIdEditor,
  handleUpdateItemId,
  renderItemLink,
  hideWowheadTooltip,
  getDisplayFromId,
  getSpecById,
}) {
  const normalizeRaidHelperToken = helpers.normalizeRaidHelperToken;
  const parseRaidSignupDate = helpers.parseRaidSignupDate;
  const normalizeSlotKey = helpers.normalizeSlotKey;
  const isGroupedSlot = helpers.isGroupedSlot;

  const initializeDefaultBisPriorities = useCallback(async (phase) => {
    const phaseKey = PHASE_JSON_KEYS[phase] || phase;
    const data = await fetchData(`bis-defaults/${phaseKey}`);
    return data;
  }, [fetchData]);

  const handleApplyRaidSignupGroupsToAttendance = useCallback(async (eventId) => {
    const numericEventId = Number(eventId);
    if (!numericEventId) {
      alert('Select a raid signup event first.');
      return false;
    }

    try {
      let event = null;
      let groups = [];

      try {
        event = await fetchData(`raid-signup-events/${numericEventId}`);
        groups = Array.isArray(event?.groups) ? event.groups : [];
      } catch (eventError) {
        console.warn('Failed to fetch raid-signup-events/:id for attendance import, falling back to groups endpoint', eventError);
      }

      if (groups.length === 0) {
        try {
          const fallbackGroups = await fetchData(`raid-signup-groups/${numericEventId}`);
          groups = Array.isArray(fallbackGroups) ? fallbackGroups : [];
        } catch (groupError) {
          console.warn('Failed to fetch fallback raid-signup-groups/:eventId for attendance import', groupError);
        }
      }

      if (!event) {
        try {
          const allEvents = await fetchData('raid-signup-events');
          if (Array.isArray(allEvents)) {
            event = allEvents.find(candidate => Number(candidate?.id) === numericEventId) || null;
          }
        } catch (listError) {
          console.warn('Failed to fetch raid-signup-events list for attendance import metadata fallback', listError);
        }
      }

      const groupedNames = [...new Set(
        groups
          .map(row => String(row?.player_name || '').trim())
          .filter(Boolean)
      )];

      if (groupedNames.length === 0) {
        alert('This signup event has no grouped players assigned yet.');
        return false;
      }

      const rosterByToken = new Map();
      roster.forEach(player => {
        const token = normalizeRaidHelperToken(player.name);
        if (!rosterByToken.has(token)) rosterByToken.set(token, []);
        rosterByToken.get(token).push(player);
      });

      const attendeeIds = [];
      const unmatched = [];
      const ambiguous = [];

      groupedNames.forEach(name => {
        const token = normalizeRaidHelperToken(name);
        const matches = rosterByToken.get(token) || [];

        if (matches.length === 0) {
          unmatched.push(name);
          return;
        }

        if (matches.length > 1) {
          ambiguous.push(name);
        }

        attendeeIds.push(Number(matches[0].id));
      });

      const attendeeSet = new Set(attendeeIds);
      const rosterWithRaidState = roster.map(player => ({
        ...player,
        in_raid: attendeeSet.has(Number(player.id))
      }));

      const raidDate = parseRaidSignupDate(event?.scheduled_for);
      const raidZone = String(event?.title || 'Raid Signup Import').trim();

      setRoster(rosterWithRaidState);
      setRaidLogs([{ id: Date.now(), date: raidDate, zone: raidZone, attendees: [...attendeeSet] }, ...raidLogs]);
      setNewRaidDate(raidDate);
      setNewRaidZone(raidZone);

      let msg = `Imported ${attendeeSet.size} grouped attendees from signup #${numericEventId}.`;
      if (unmatched.length > 0) {
        msg += `\nUnmatched (${unmatched.length}): ${unmatched.slice(0, 12).join(', ')}${unmatched.length > 12 ? ', ...' : ''}`;
      }
      if (ambiguous.length > 0) {
        msg += `\nAmbiguous name matches (${ambiguous.length}) used first roster match.`;
      }

      alert(msg);
      return true;
    } catch (error) {
      const detail = error?.message ? `\n${error.message}` : '';
      alert(`Failed to import attendees from raid signup event.${detail}`);
      return false;
    }
  }, [fetchData, normalizeRaidHelperToken, parseRaidSignupDate, roster, setRoster, setRaidLogs, setNewRaidDate, setNewRaidZone, raidLogs]);

  const handleOpenItemForLootAssignment = useCallback((itemName) => {
    if (!itemName) return;
    setActiveTab('loot');
    setLootSubTab('assignment');
    setSearchQuery(itemName);
    setSelectedItemName(itemName);
  }, [setActiveTab, setLootSubTab, setSearchQuery, setSelectedItemName]);

  const handleSaveScoringChanges = useCallback(async ({ silent = false } = {}) => {
    if (!scoringConfigDirty && !playerStatsDirty) return;
    setIsSavingScoring(true);
    try {
      if (scoringConfigDirty) {
        await putData('scoring-config', scoringConfig);
      }
      if (playerStatsDirty) {
        await putData('player-stats', playerStats);
      }
      setScoringConfigDirty(false);
      setPlayerStatsDirty(false);
      if (!silent) alert('Scoring configuration saved.');
    } catch (e) {
      if (!silent) alert('Failed to save scoring changes.');
      throw e;
    } finally {
      setIsSavingScoring(false);
    }
  }, [playerStats, playerStatsDirty, putData, scoringConfig, scoringConfigDirty, setIsSavingScoring, setPlayerStatsDirty, setScoringConfigDirty]);

  const getItemsForSlotAndSpec = useCallback((slot, spec) => {
    const normalizedSlot = normalizeSlotKey(slot);
    const isGrouped = isGroupedSlot(slot);
    const slotIndex = slot === 'Ring 2' || slot === 'Trinket 2' ? 1 : 0;
    const isDualSlot = slot.endsWith(' 1') || slot.endsWith(' 2');

    const itemsInSlot = mutableItems.filter(i => {
      const itemSlot = normalizeSlotKey(i?.slot);
      if (!itemSlot) return false;
      if (isGrouped) return itemSlot === normalizedSlot;
      if (itemSlot === normalizedSlot) return true;
      if (normalizedSlot === 'weapon' && itemSlot === 'weapon') return true;
      return false;
    });

    const bis = itemsInSlot.filter(item => {
      const itemKey = `${item.name}|${spec}`;
      return dbBisPriorities[itemKey] === 'BiS';
    });
    const opt = itemsInSlot.filter(item => {
      const itemKey = `${item.name}|${spec}`;
      return dbBisPriorities[itemKey] === 'Opt';
    });

    if (!isGrouped && isDualSlot) {
      const bisForThisSlot = bis[slotIndex] ? [bis[slotIndex]] : [];
      const optForThisSlot = slotIndex === 0 && bis.length <= 1 ? opt
        : slotIndex === 1 && bis.length >= 2 ? opt
          : slotIndex === 1 && bis.length < 2 ? [...bis.slice(1), ...opt]
            : [];
      return { bis: bisForThisSlot, opt: optForThisSlot };
    }

    return { bis, opt };
  }, [dbBisPriorities, mutableItems, normalizeSlotKey, isGroupedSlot]);

  const jumpToMasterItemsDbForItem = useCallback((itemName) => {
    const targetName = String(itemName || '').trim().toLowerCase();
    if (!targetName) return;

    const item = mutableItems.find(entry => String(entry.name || '').trim().toLowerCase() === targetName);
    if (!item) {
      alert(`Item not found in Master Items DB: ${itemName}`);
      return;
    }

    setItemIdEditor({
      itemId: item.id,
      itemName: item.name,
      wowheadIdInput: String(item.itemId || '')
    });
  }, [mutableItems, setItemIdEditor]);

  const handleSaveItemIdFromModal = useCallback((itemId, wowheadIdInput) => {
    const trimmed = String(wowheadIdInput || '').trim();
    if (trimmed && !/^\d+$/.test(trimmed)) {
      alert('Wowhead ID must be numeric (or blank to clear).');
      return;
    }
    handleUpdateItemId(itemId, trimmed);
    setItemIdEditor(null);
  }, [handleUpdateItemId, setItemIdEditor]);

  const renderItemSlot = useCallback((slotName) => {
    const { bis, opt } = getItemsForSlotAndSpec(slotName, selectedBisSpec);
    const isBottomSlot = BOTTOM_SLOTS.includes(slotName);
    const isGroupedDisplaySlot = ['Rings', 'Trinkets'].includes(slotName);

    const isDualSecond = slotName === 'Ring 2' || slotName === 'Trinket 2';
    if (isDualSecond && bis.length === 0 && opt.length === 0) return null;

    if (bis.length === 0 && opt.length === 0 && !BOTTOM_SLOTS.includes(slotName)) {
      return (
        <div key={slotName} className="flex gap-3 bg-slate-900/40 border border-slate-800/50 p-2.5 rounded-lg opacity-50">
          <div className="w-10 h-10 rounded bg-slate-950 border border-slate-800 flex-shrink-0"></div>
          <div className="flex flex-col justify-center">
            <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">{slotName}</span>
            <span className="text-sm text-slate-700 font-medium">No items found</span>
          </div>
        </div>
      );
    }
    if (bis.length === 0 && opt.length === 0) return null;

    const primaryBis = isGroupedDisplaySlot ? bis.slice(0, 2) : bis;
    const extraItems = isGroupedDisplaySlot
      ? [
          ...bis.slice(2).map(item => ({ item, kind: 'bis' })),
          ...opt.map(item => ({ item, kind: 'opt' }))
        ]
      : opt.map(item => ({ item, kind: 'opt' }));
    const iconItems = isGroupedDisplaySlot ? primaryBis : bis.slice(0, 1);

    const renderItemSource = (item) => {
      const bossName = String(item?.boss || '').trim();
      if (bossName) {
        return <span className="text-[10px] text-slate-500 font-medium">Boss: {bossName}</span>;
      }

      const source = String(item?.source || '').trim();
      const sourceType = String(item?.source_type || '').trim();
      const normalizedSource = source.toLowerCase();
      const normalizedSourceType = sourceType.toLowerCase();
      const genericArmorValues = ['armor', 'cloth armor', 'leather armor', 'mail armor', 'plate armor', 'cloak', 'ring', 'trinket'];

      const fallbackValue = source && !genericArmorValues.includes(normalizedSource) ? source : (sourceType && !genericArmorValues.includes(normalizedSourceType) ? sourceType : '');
      if (!fallbackValue) return null;

      return <span className="text-[10px] text-slate-500 font-medium">Source: {fallbackValue}</span>;
    };

    return (
      <div key={slotName} className="flex gap-3 bg-slate-900 border border-slate-700 hover:border-slate-500 p-2.5 rounded-lg transition-colors shadow-sm">
        <div key={`${slotName}-${selectedBisSpec}`} className="flex flex-col gap-2 flex-shrink-0">
          {iconItems.length > 0 ? (
            iconItems.map((item, index) => (
              <div key={`${item.name}-${index}`} className="w-10 h-10 rounded border border-purple-500/50 bg-slate-950 flex items-center justify-center relative shadow-inner overflow-hidden character-slot-icon">
                {item.itemId ? (
                  <a
                    href={`https://tbc.wowhead.com/item=${item.itemId}`}
                    data-wh-rename-link="false"
                    data-wh-icon-size="large"
                    className="item-link"
                    target="_blank"
                    rel="noreferrer"
                    onMouseLeave={hideWowheadTooltip}
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent"></div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase z-10 rotate-45 opacity-30">{slotName}</span>
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="w-10 h-10 rounded border border-purple-500/50 bg-slate-950 flex items-center justify-center relative shadow-inner overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent"></div>
              <span className="text-[9px] font-bold text-slate-500 uppercase z-10 rotate-45 opacity-30">{slotName}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col min-w-0 justify-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">{slotName}</span>
          {primaryBis.length > 0 ? (
            primaryBis.map(i => (
              <div key={i.name} className="flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  {renderItemLink(i, 'text-sm font-bold text-purple-400 drop-shadow-sm leading-tight')}
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-[10px] text-amber-500/70 font-semibold">{i.boss}</span>
                    {i.drop_chance && <span className="text-[10px] text-cyan-400/70 font-semibold">{(i.drop_chance * 100).toFixed(0)}% Drop</span>}
                  </div>
                  {renderItemSource(i)}
                </div>
              </div>
            ))
          ) : (<span className="text-sm font-bold text-slate-500 italic leading-tight">No primary BiS</span>)}
          {extraItems.length > 0 && (
            <div className="mt-1 flex flex-col gap-y-1 border-t border-slate-800/70 pt-2">
              {extraItems.map(({ item: i, kind }) => (
                <div key={`${i.name}-${kind}`} className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] text-amber-500/70 font-semibold uppercase flex-shrink-0">{kind === 'bis' ? 'More BiS:' : 'Alt:'}</span>
                    <div className="flex items-center justify-between gap-2 w-full min-w-0">
                      {renderItemLink(i, 'text-[10px] text-slate-400 truncate max-w-[150px]')}
                    </div>
                    {!isBottomSlot && <span className="text-[10px] text-amber-500/70 font-semibold whitespace-nowrap">{i.boss}</span>}
                  </div>
                  {isBottomSlot && (
                    <div className="flex flex-col gap-0.5 pl-6">
                      <div className="flex gap-2">
                        <span className="text-[10px] text-amber-500/70 font-semibold">{i.boss}</span>
                        {i.drop_chance && <span className="text-[10px] text-cyan-400/70 font-semibold">{(i.drop_chance * 100).toFixed(0)}% Drop</span>}
                      </div>
                      {renderItemSource(i)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }, [getItemsForSlotAndSpec, hideWowheadTooltip, renderItemLink, selectedBisSpec]);

  return {
    initializeDefaultBisPriorities,
    handleApplyRaidSignupGroupsToAttendance,
    handleOpenItemForLootAssignment,
    handleSaveScoringChanges,
    getItemsForSlotAndSpec,
    jumpToMasterItemsDbForItem,
    handleSaveItemIdFromModal,
    renderItemSlot,
  };
}
