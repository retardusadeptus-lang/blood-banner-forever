import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_SLOTS_PER_GROUP = 5;
const UNKNOWN_ICON = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';

const CLASS_META = {
  Druid: { color: '#FF7D0A', icon: 'https://wow.zamimg.com/images/wow/icons/small/spell_nature_healingtouch.jpg' },
  Hunter: { color: '#ABD473', icon: 'https://wow.zamimg.com/images/wow/icons/small/ability_hunter_beasttaming.jpg' },
  Mage: { color: '#69CCF0', icon: 'https://wow.zamimg.com/images/wow/icons/small/spell_frost_frostbolt02.jpg' },
  Paladin: { color: '#F58CBA', icon: 'https://wow.zamimg.com/images/wow/icons/small/spell_holy_holybolt.jpg' },
  Priest: { color: '#FFFFFF', icon: 'https://wow.zamimg.com/images/wow/icons/small/spell_holy_guardianspirit.jpg' },
  Rogue: { color: '#FFF569', icon: 'https://wow.zamimg.com/images/wow/icons/small/ability_backstab.jpg' },
  Shaman: { color: '#0070DE', icon: 'https://wow.zamimg.com/images/wow/icons/small/spell_nature_lightning.jpg' },
  Warlock: { color: '#8788EE', icon: 'https://wow.zamimg.com/images/wow/icons/small/spell_shadow_deathcoil.jpg' },
  Warrior: { color: '#C79C6E', icon: 'https://wow.zamimg.com/images/wow/icons/small/inv_shield_06.jpg' },
  Unknown: { color: '#E2E8F0', icon: UNKNOWN_ICON }
};

const SPEC_ICON_FALLBACKS = {
  'Prot Warrior': 'https://wow.zamimg.com/images/wow/icons/small/inv_shield_06.jpg',
  'Arms Warrior': 'https://wow.zamimg.com/images/wow/icons/small/ability_warrior_savageblow.jpg',
  'Fury Warrior': 'https://wow.zamimg.com/images/wow/icons/small/ability_warrior_innerrage.jpg',
  'Prot Paladin': 'https://wow.zamimg.com/images/wow/icons/small/spell_holy_devotionaura.jpg',
  'Holy Paladin': 'https://wow.zamimg.com/images/wow/icons/small/spell_holy_holybolt.jpg',
  'Ret Paladin': 'https://wow.zamimg.com/images/wow/icons/small/spell_holy_auraoflight.jpg',
  'BM Hunter': 'https://wow.zamimg.com/images/wow/icons/small/ability_hunter_beasttaming.jpg',
  'MM Hunter': 'https://wow.zamimg.com/images/wow/icons/small/ability_marksmanship.jpg',
  'Survival Hunter': 'https://wow.zamimg.com/images/wow/icons/small/ability_hunter_swiftstrike.jpg',
  'Elemental Shaman': 'https://wow.zamimg.com/images/wow/icons/small/spell_nature_lightning.jpg',
  'Enhance Shaman': 'https://wow.zamimg.com/images/wow/icons/small/spell_nature_lightningshield.jpg',
  'Resto Shaman': 'https://wow.zamimg.com/images/wow/icons/small/spell_nature_magicimmunity.jpg',
  'Balance Druid': 'https://wow.zamimg.com/images/wow/icons/small/spell_nature_starfall.jpg',
  'Feral (Tank)': 'https://wow.zamimg.com/images/wow/icons/small/ability_racial_bearform.jpg',
  'Feral (DPS)': 'https://wow.zamimg.com/images/wow/icons/small/ability_druid_catform.jpg',
  'Resto Druid': 'https://wow.zamimg.com/images/wow/icons/small/spell_nature_healingtouch.jpg',
  'Combat Rogue': 'https://wow.zamimg.com/images/wow/icons/small/ability_backstab.jpg',
  'Subtlety Rogue': 'https://wow.zamimg.com/images/wow/icons/small/ability_stealth.jpg',
  'Assassination Rogue': 'https://wow.zamimg.com/images/wow/icons/small/ability_rogue_eviscerate.jpg',
  'Holy Priest': 'https://wow.zamimg.com/images/wow/icons/small/spell_holy_guardianspirit.jpg',
  'Discipline Priest': 'https://wow.zamimg.com/images/wow/icons/small/spell_holy_wordfortitude.jpg',
  'Shadow Priest': 'https://wow.zamimg.com/images/wow/icons/small/spell_shadow_shadowwordpain.jpg',
  'Arcane Mage': 'https://wow.zamimg.com/images/wow/icons/small/spell_holy_magicalsentry.jpg',
  'Fire Mage': 'https://wow.zamimg.com/images/wow/icons/small/spell_fire_firebolt02.jpg',
  'Frost Mage': 'https://wow.zamimg.com/images/wow/icons/small/spell_frost_frostbolt02.jpg',
  'Destro Warlock': 'https://wow.zamimg.com/images/wow/icons/small/spell_shadow_rainoffire.jpg',
  'Demo Warlock': 'https://wow.zamimg.com/images/wow/icons/small/spell_shadow_metamorphosis.jpg',
  'Affliction Warlock': 'https://wow.zamimg.com/images/wow/icons/small/spell_shadow_deathcoil.jpg'
};

function getSpecIcon(spec) {
  if (!spec) return UNKNOWN_ICON;
  return spec.icon_small || spec.icon_medium || spec.icon_large || SPEC_ICON_FALLBACKS[spec.spec] || CLASS_META[spec.class]?.icon || UNKNOWN_ICON;
}

function getSpecColor(spec) {
  if (!spec) return CLASS_META.Unknown.color;
  return spec.color || CLASS_META[spec.class]?.color || CLASS_META.Unknown.color;
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createSlot(slotIndex) {
  return {
    id: createId(`slot-${slotIndex + 1}`),
    specId: '',
    rosterId: '',
    note: ''
  };
}

function createGroup(groupNumber) {
  return {
    id: createId(`group-${groupNumber}`),
    groupName: `Group ${groupNumber}`,
    slots: Array.from({ length: DEFAULT_SLOTS_PER_GROUP }, (_, slotIndex) => createSlot(slotIndex))
  };
}

function buildEmptyGroups() {
  return [];
}

function normalizeGroups(payloadGroups) {
  if (!Array.isArray(payloadGroups) || payloadGroups.length === 0) {
    return buildEmptyGroups();
  }

  return payloadGroups.map((group, groupIdx) => ({
    id: String(group?.id || createId(`group-${groupIdx + 1}`)),
    groupName: String(group?.groupName || `Group ${groupIdx + 1}`),
    slots: (Array.isArray(group?.slots) ? group.slots : []).map((slot, slotIdx) => ({
      id: String(slot?.id || createId(`slot-${slotIdx + 1}`)),
      specId: slot?.specId ? String(slot.specId) : '',
      rosterId: slot?.rosterId ? String(slot.rosterId) : '',
      note: String(slot?.note || '')
    }))
  }));
}

function CustomDropdown({
  value,
  disabled = false,
  placeholder,
  options,
  onSelect,
  renderTrigger,
  renderOption,
  menuClassName = ''
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const selected = options.find((item) => item.type === 'option' && item.value === value) || null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-between gap-2 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="min-w-0 flex-1 text-left">
          {renderTrigger ? renderTrigger(selected, placeholder) : (selected?.label || placeholder)}
        </div>
        <span className="text-slate-500 text-xs">▾</span>
      </button>

      {open && !disabled ? (
        <div className={`mt-1 w-full max-h-72 overflow-y-auto rounded border border-slate-700 bg-slate-950 shadow-xl ${menuClassName}`}>
          {options.map((item, index) => {
            if (item.type === 'label') {
              return (
                <div key={`label-${item.label}-${index}`} className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 bg-slate-900/70">
                  {item.label}
                </div>
              );
            }

            const isSelected = item.value === value;
            return (
              <button
                key={`opt-${item.value}-${index}`}
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSelect(item.value);
                }}
                className={`w-full text-left px-2 py-1.5 hover:bg-slate-800 transition ${isSelected ? 'bg-slate-800/80' : 'bg-transparent'}`}
              >
                {renderOption ? renderOption(item, isSelected) : item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function RecruitmentPlanningTab({ roster, specsFromDb, fetchData, putData }) {
  const [groups, setGroups] = useState(buildEmptyGroups);
  const [lastSavedGroups, setLastSavedGroups] = useState(buildEmptyGroups);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const specsByClass = useMemo(() => {
    const map = new Map();
    (specsFromDb || []).forEach((spec) => {
      const className = String(spec.class || 'Unknown');
      if (!map.has(className)) map.set(className, []);
      map.get(className).push(spec);
    });

    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([className, specs]) => ({
        className,
        specs: [...specs].sort((a, b) => String(a.spec || '').localeCompare(String(b.spec || '')))
      }));
  }, [specsFromDb]);

  const specById = useMemo(() => {
    const map = new Map();
    (specsFromDb || []).forEach((spec) => {
      map.set(String(spec.id), spec);
    });
    return map;
  }, [specsFromDb]);

  const rosterById = useMemo(() => {
    const map = new Map();
    (roster || []).forEach((player) => {
      map.set(String(player.id), player);
    });
    return map;
  }, [roster]);

  const rosterBySpec = useMemo(() => {
    const map = new Map();
    (roster || []).forEach((player) => {
      const key = String(player.spec_id || '');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(player);
    });
    map.forEach((players) => players.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))));
    return map;
  }, [roster]);

  const specOptions = useMemo(() => {
    const items = [{ type: 'option', value: '', label: 'Select class/spec placeholder' }];
    specsByClass.forEach((entry) => {
      items.push({ type: 'label', label: entry.className });
      entry.specs.forEach((spec) => {
        items.push({
          type: 'option',
          value: String(spec.id),
          label: String(spec.spec || 'Unknown Spec'),
          color: getSpecColor(spec),
          icon: getSpecIcon(spec),
          specName: spec.spec
        });
      });
    });
    return items;
  }, [specsByClass]);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(groups) !== JSON.stringify(lastSavedGroups),
    [groups, lastSavedGroups]
  );

  useEffect(() => {
    let mounted = true;
    const loadPlanning = async () => {
      try {
        const data = await fetchData('recruitment-planning');
        if (!mounted) return;
        const normalizedGroups = normalizeGroups(data?.groups);
        setGroups(normalizedGroups);
        setLastSavedGroups(normalizedGroups);
      } catch (error) {
        if (!mounted) return;
        console.error('Failed to load recruitment planning:', error);
        const emptyGroups = buildEmptyGroups();
        setGroups(emptyGroups);
        setLastSavedGroups(emptyGroups);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadPlanning();
    return () => {
      mounted = false;
    };
  }, [fetchData]);

  const saveGroups = async (nextGroups = groups) => {
    setIsSaving(true);
    setSaveError('');
    try {
      await putData('recruitment-planning', { groups: nextGroups });
      setLastSavedGroups(nextGroups);
    } catch (error) {
      setSaveError(error?.message || 'Failed to save recruitment planning.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateGroups = (nextGroups) => {
    setGroups(nextGroups);
    setSaveError('');
  };

  const addGroup = () => {
    const nextGroupNumber = groups.length + 1;
    const next = [...groups, createGroup(nextGroupNumber)];
    updateGroups(next);
  };

  const removeGroup = (groupId) => {
    const next = groups.filter(group => group.id !== groupId);
    updateGroups(next);
  };

  const updateGroupName = (groupId, groupName) => {
    const next = groups.map(group => (group.id === groupId ? { ...group, groupName } : group));
    updateGroups(next);
  };

  const applySlotPatch = (sourceGroups, groupId, slotId, patch) => {
    return sourceGroups.map(group => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        slots: group.slots.map(slot => {
          if (slot.id !== slotId) return slot;
          return { ...slot, ...patch };
        })
      };
    });
  };

  const updateSlot = (groupId, slotId, patch) => {
    const next = applySlotPatch(groups, groupId, slotId, patch);
    updateGroups(next);
  };

  const clearSlot = (groupId, slotId) => {
    updateSlot(groupId, slotId, { specId: '', rosterId: '', note: '' });
  };

  const editSlotNote = (groupId, slotId, currentNote) => {
    const nextNote = window.prompt('Slot note (optional):', currentNote || '');
    if (nextNote === null) return;
    updateSlot(groupId, slotId, { note: String(nextNote).trim().slice(0, 240) });
  };

  const setSlotSpec = (groupId, slotId, nextSpecId) => {
    updateSlot(groupId, slotId, { specId: String(nextSpecId || ''), rosterId: '' });
  };

  const setSlotRoster = (groupId, slotId, nextRosterId) => {
    updateSlot(groupId, slotId, { rosterId: String(nextRosterId || '') });
  };

  const getRosterOptions = (slotSpecId) => {
    const options = [{ type: 'option', value: '', label: 'TBC', color: '#94A3B8', icon: UNKNOWN_ICON, subLabel: 'Recruitment target or unassigned' }];
    const players = slotSpecId ? (rosterBySpec.get(String(slotSpecId)) || []) : [];
    players.forEach((player) => {
      const playerSpec = specById.get(String(player.spec_id || ''));
      options.push({
        type: 'option',
        value: String(player.id),
        label: String(player.name || 'Unknown'),
        color: getSpecColor(playerSpec),
        icon: getSpecIcon(playerSpec),
        subLabel: playerSpec?.class && playerSpec?.spec ? `${playerSpec.class} - ${playerSpec.spec}` : ''
      });
    });
    return options;
  };

  return (
    <section className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Roster Planning</h2>
          <p className="text-sm text-slate-400 mt-1">Define target class/spec slots and optionally map each slot to a current roster player.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addGroup}
            className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-cyan-700 hover:bg-cyan-600 text-white"
          >
            Add Group
          </button>
          <button
            type="button"
            onClick={() => saveGroups(groups)}
            disabled={!hasUnsavedChanges || isSaving}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${hasUnsavedChanges ? 'bg-amber-600 hover:bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
          >
            {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading recruitment planning...</p>
      ) : null}
      {saveError ? <p className="text-xs text-rose-400">{saveError}</p> : null}
      {isSaving ? <p className="text-xs text-cyan-400">Saving...</p> : null}

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">
          <p className="text-sm text-slate-400">No recruitment groups yet.</p>
          <p className="mt-1 text-xs text-slate-500">Add a group to start planning roster targets.</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        {groups.map((group) => (
          <div key={group.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs uppercase tracking-wider text-slate-400">Group Name</label>
                <input
                  type="text"
                  value={group.groupName}
                  onChange={(event) => updateGroupName(group.id, event.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-100 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeGroup(group.id)}
                  className="text-lg leading-none font-bold text-rose-400 hover:text-rose-300"
                  title="Remove group"
                >
                  -
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {group.slots.map((slot) => {
                const specId = String(slot.specId || '');
                const rosterOptions = getRosterOptions(specId);
                const selectedSpec = specById.get(specId);
                const selectedPlayer = rosterById.get(String(slot.rosterId || ''));
                const selectedSpecIcon = getSpecIcon(selectedSpec);
                const selectedRosterOption = rosterOptions.find(option => option.type === 'option' && option.value === String(slot.rosterId || '')) || rosterOptions[0];

                return (
                  <div key={slot.id} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                    <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-start">
                      <CustomDropdown
                        value={specId}
                        placeholder="Select class/spec placeholder"
                        options={specOptions}
                        onSelect={(nextValue) => setSlotSpec(group.id, slot.id, nextValue)}
                        menuClassName="min-w-[220px]"
                        renderTrigger={(selected, fallback) => (
                          <div className="flex items-center justify-center w-6">
                            <img src={selected?.icon || UNKNOWN_ICON} alt={selected?.label || fallback} className="w-5 h-5 rounded border border-slate-700" />
                          </div>
                        )}
                        renderOption={(item, isSelected) => (
                          <div className="flex items-center gap-2 min-w-0">
                            <img src={item.icon || UNKNOWN_ICON} alt="" className="w-4 h-4 rounded border border-slate-700" />
                            <div className="min-w-0 truncate" style={{ color: item.color || '#e2e8f0' }}>{item.label}</div>
                            {isSelected ? <span className="ml-auto text-[10px] text-cyan-400">Selected</span> : null}
                          </div>
                        )}
                      />

                      <CustomDropdown
                        value={String(slot.rosterId || '')}
                        placeholder="TBC"
                        options={rosterOptions}
                        disabled={!specId}
                        onSelect={(nextValue) => setSlotRoster(group.id, slot.id, nextValue)}
                        menuClassName="min-w-0"
                        renderTrigger={(selected, fallback) => (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate" style={{ color: selected?.color || selectedRosterOption?.color || '#e2e8f0' }}>{selected?.label || selectedRosterOption?.label || fallback}</span>
                          </div>
                        )}
                        renderOption={(item, isSelected) => (
                          <div className="flex items-center gap-2 min-w-0">
                            <img src={item.icon || UNKNOWN_ICON} alt="" className="w-4 h-4 rounded border border-slate-700" />
                            <div className="min-w-0">
                              <div className="truncate" style={{ color: item.color || '#e2e8f0' }}>{item.label}</div>
                              {item.subLabel ? <div className="text-[10px] text-slate-500 truncate">{item.subLabel}</div> : null}
                            </div>
                            {isSelected ? <span className="ml-auto text-[10px] text-cyan-400">Selected</span> : null}
                          </div>
                        )}
                      />

                      <div className="flex items-center gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => clearSlot(group.id, slot.id)}
                          className="text-base leading-none text-amber-300 hover:text-amber-200"
                          title="Reset slot"
                        >
                          ↻
                        </button>
                        <button
                          type="button"
                          onClick={() => editSlotNote(group.id, slot.id, slot.note || '')}
                          className="text-sm leading-none text-slate-300 hover:text-slate-100"
                          title="Edit slot note"
                        >
                          ✎
                        </button>
                      </div>
                    </div>

                    {slot.note ? (
                      <div className="text-xs text-slate-500">{slot.note}</div>
                    ) : specId && !selectedPlayer ? (
                      <div className="text-xs text-slate-500 italic">TBC</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
