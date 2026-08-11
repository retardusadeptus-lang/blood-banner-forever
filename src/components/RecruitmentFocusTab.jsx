import { useEffect, useMemo, useRef, useState } from 'react';

const UNKNOWN_ICON = 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg';
const CLASS_META = {
  Druid: { color: '#FF7D0A', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_healingtouch.jpg' },
  Hunter: { color: '#ABD473', icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_hunter_beasttaming.jpg' },
  Mage: { color: '#69CCF0', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_frost_frostbolt02.jpg' },
  Paladin: { color: '#F58CBA', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_holybolt.jpg' },
  Priest: { color: '#FFFFFF', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_guardianspirit.jpg' },
  Rogue: { color: '#FFF569', icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_backstab.jpg' },
  Shaman: { color: '#0070DE', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_lightning.jpg' },
  Warlock: { color: '#8788EE', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_deathcoil.jpg' },
  Warrior: { color: '#C79C6E', icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_shield_06.jpg' },
  Unknown: { color: '#E2E8F0', icon: UNKNOWN_ICON }
};
const SPEC_ICON_FALLBACKS = {
  'Prot Warrior': 'https://wow.zamimg.com/images/wow/icons/large/inv_shield_06.jpg',
  'Arms Warrior': 'https://wow.zamimg.com/images/wow/icons/large/ability_warrior_savageblow.jpg',
  'Fury Warrior': 'https://wow.zamimg.com/images/wow/icons/large/ability_warrior_innerrage.jpg',
  'Prot Paladin': 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_devotionaura.jpg',
  'Holy Paladin': 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_holybolt.jpg',
  'Ret Paladin': 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_auraoflight.jpg',
  'BM Hunter': 'https://wow.zamimg.com/images/wow/icons/large/ability_hunter_beasttaming.jpg',
  'MM Hunter': 'https://wow.zamimg.com/images/wow/icons/large/ability_marksmanship.jpg',
  'Survival Hunter': 'https://wow.zamimg.com/images/wow/icons/large/ability_hunter_swiftstrike.jpg',
  'Elemental Shaman': 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_lightning.jpg',
  'Enhance Shaman': 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_lightningshield.jpg',
  'Resto Shaman': 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_magicimmunity.jpg',
  'Balance Druid': 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_starfall.jpg',
  'Feral (Tank)': 'https://wow.zamimg.com/images/wow/icons/large/ability_racial_bearform.jpg',
  'Feral (DPS)': 'https://wow.zamimg.com/images/wow/icons/large/ability_druid_catform.jpg',
  'Resto Druid': 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_healingtouch.jpg',
  'Combat Rogue': 'https://wow.zamimg.com/images/wow/icons/large/ability_backstab.jpg',
  'Subtlety Rogue': 'https://wow.zamimg.com/images/wow/icons/large/ability_stealth.jpg',
  'Assassination Rogue': 'https://wow.zamimg.com/images/wow/icons/large/ability_rogue_eviscerate.jpg',
  'Holy Priest': 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_guardianspirit.jpg',
  'Discipline Priest': 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_wordfortitude.jpg',
  'Shadow Priest': 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_shadowwordpain.jpg',
  'Arcane Mage': 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_magicalsentry.jpg',
  'Fire Mage': 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_firebolt02.jpg',
  'Frost Mage': 'https://wow.zamimg.com/images/wow/icons/large/spell_frost_frostbolt02.jpg',
  'Destro Warlock': 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_rainoffire.jpg',
  'Demo Warlock': 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_metamorphosis.jpg',
  'Affliction Warlock': 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_deathcoil.jpg'
};

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSpecIcon(spec) {
  if (!spec) return UNKNOWN_ICON;
  return spec.icon_large || spec.icon_medium || spec.icon_small || SPEC_ICON_FALLBACKS[spec.spec] || CLASS_META[spec.class]?.icon || UNKNOWN_ICON;
}

function getSpecColor(spec) {
  if (!spec) return CLASS_META.Unknown.color;
  return spec.color || CLASS_META[spec.class]?.color || CLASS_META.Unknown.color;
}

function normalizeFocusEntries(payloadFocus) {
  if (!Array.isArray(payloadFocus)) return [];
  return payloadFocus.map((entry, index) => ({
    id: String(entry?.id || createId(`focus-${index + 1}`)),
    specId: entry?.specId ? String(entry.specId) : '',
    quantity: Number.isFinite(Number(entry?.quantity)) ? Math.max(1, Math.min(99, Number(entry.quantity))) : 1,
    publicNote: String(entry?.publicNote || ''),
    officerNote: String(entry?.officerNote || '')
  }));
}

function CustomDropdown({ value, options, onSelect, renderTrigger, renderOption, disabled = false }) {
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
        <div className="min-w-0 flex-1 text-left">{renderTrigger(selected)}</div>
        <span className="text-slate-500 text-xs">▾</span>
      </button>
      {open && !disabled ? (
        <div className="mt-1 w-full max-h-72 overflow-y-auto rounded border border-slate-700 bg-slate-950 shadow-xl">
          {options.map((item, index) => {
            if (item.type === 'label') {
              return <div key={`label-${item.label}-${index}`} className="px-2 py-1 text-[10px] uppercase tracking-wider text-slate-500 bg-slate-900/70">{item.label}</div>;
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
                {renderOption(item, isSelected)}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function RecruitmentFocusTab({ isAuthenticated, specsFromDb, fetchData, putData }) {
  const [focusEntries, setFocusEntries] = useState([]);
  const [lastSavedFocusEntries, setLastSavedFocusEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const specById = useMemo(() => {
    const map = new Map();
    (specsFromDb || []).forEach((spec) => map.set(String(spec.id), spec));
    return map;
  }, [specsFromDb]);

  const specOptions = useMemo(() => {
    const classMap = new Map();
    (specsFromDb || []).forEach((spec) => {
      const className = String(spec.class || 'Unknown');
      if (!classMap.has(className)) classMap.set(className, []);
      classMap.get(className).push(spec);
    });

    const items = [{ type: 'option', value: '', label: 'Select spec', color: CLASS_META.Unknown.color, icon: UNKNOWN_ICON }];
    [...classMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).forEach(([className, specs]) => {
      items.push({ type: 'label', label: className });
      specs.sort((a, b) => String(a.spec || '').localeCompare(String(b.spec || ''))).forEach((spec) => {
        items.push({
          type: 'option',
          value: String(spec.id),
          label: String(spec.spec || 'Unknown Spec'),
          color: getSpecColor(spec),
          icon: getSpecIcon(spec)
        });
      });
    });
    return items;
  }, [specsFromDb]);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(focusEntries) !== JSON.stringify(lastSavedFocusEntries),
    [focusEntries, lastSavedFocusEntries]
  );

  useEffect(() => {
    let mounted = true;
    const loadFocus = async () => {
      try {
        const data = await fetchData('recruitment-planning');
        if (!mounted) return;
        const normalized = normalizeFocusEntries(data?.focus);
        setFocusEntries(normalized);
        setLastSavedFocusEntries(normalized);
      } catch (error) {
        if (!mounted) return;
        console.error('Failed to load recruitment focus:', error);
        setFocusEntries([]);
        setLastSavedFocusEntries([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadFocus();
    return () => {
      mounted = false;
    };
  }, [fetchData]);

  const saveFocus = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      await putData('recruitment-planning', { focus: focusEntries });
      setLastSavedFocusEntries(focusEntries);
    } catch (error) {
      setSaveError(error?.message || 'Failed to save recruitment focus.');
    } finally {
      setIsSaving(false);
    }
  };

  const addEntry = () => {
    setFocusEntries((prev) => [...prev, { id: createId('focus'), specId: '', quantity: 1, publicNote: '', officerNote: '' }]);
    setSaveError('');
  };

  const updateEntry = (entryId, patch) => {
    setFocusEntries((prev) => prev.map((entry) => (entry.id === entryId ? { ...entry, ...patch } : entry)));
    setSaveError('');
  };

  const removeEntry = (entryId) => {
    setFocusEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    setSaveError('');
  };

  if (!isAuthenticated) {
    return (
      <section className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Recruitment Focus</h2>
          <p className="text-sm text-slate-400 mt-1">Current class and spec targets for the guild.</p>
        </div>
        {isLoading ? <p className="text-sm text-slate-400">Loading recruitment focus...</p> : null}
        {focusEntries.length === 0 && !isLoading ? <p className="text-sm text-slate-500">No active recruitment targets.</p> : null}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {focusEntries.filter((entry) => entry.specId).map((entry) => {
            const spec = specById.get(entry.specId);
            return (
              <div key={entry.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={getSpecIcon(spec)} alt="" className="w-12 h-12 rounded border border-slate-700" />
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate" style={{ color: getSpecColor(spec) }}>{spec?.spec || 'Open Recruitment'}</div>
                    </div>
                  </div>
                  <div className="shrink-0 h-10 flex items-center text-4xl font-bold leading-none text-amber-300">x{entry.quantity}</div>
                </div>
                {entry.publicNote ? <p className="text-sm text-slate-300">{entry.publicNote}</p> : null}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Recruitment Focus</h2>
          <p className="text-sm text-slate-400 mt-1">Define the public recruitment targets and keep officer-only notes separately.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={addEntry} className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-cyan-700 hover:bg-cyan-600 text-white">Add Focus</button>
          <button
            type="button"
            onClick={saveFocus}
            disabled={!hasUnsavedChanges || isSaving}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${hasUnsavedChanges ? 'bg-amber-600 hover:bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
          >
            {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
          </button>
        </div>
      </div>

      {isLoading ? <p className="text-sm text-slate-400">Loading recruitment focus...</p> : null}
      {saveError ? <p className="text-xs text-rose-400">{saveError}</p> : null}

      {focusEntries.length === 0 && !isLoading ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">
          <p className="text-sm text-slate-400">No recruitment focus entries yet.</p>
          <p className="mt-1 text-xs text-slate-500">Add a focus entry to publish current hiring priorities.</p>
        </div>
      ) : null}

      <div className="space-y-4">
        {focusEntries.map((entry) => {
          const spec = specById.get(entry.specId);
          return (
            <div key={entry.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-[140px_120px_auto] gap-3 items-start">
                <CustomDropdown
                  value={entry.specId}
                  options={specOptions}
                  onSelect={(nextValue) => updateEntry(entry.id, { specId: String(nextValue || '') })}
                  renderTrigger={(selected) => (
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={selected?.icon || UNKNOWN_ICON} alt={selected?.label || 'Select spec'} className="w-8 h-8 rounded border border-slate-700" />
                      <span className="truncate" style={{ color: selected?.color || '#e2e8f0' }}>{selected?.label || 'Select spec'}</span>
                    </div>
                  )}
                  renderOption={(item, isSelected) => (
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={item.icon || UNKNOWN_ICON} alt="" className="w-8 h-8 rounded border border-slate-700" />
                      <span className="truncate" style={{ color: item.color || '#e2e8f0' }}>{item.label}</span>
                      {isSelected ? <span className="ml-auto text-[10px] text-cyan-400">Selected</span> : null}
                    </div>
                  )}
                />

                <label className="flex items-center gap-2 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300">
                  <span className="text-xs uppercase tracking-wider text-slate-500">Need</span>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={entry.quantity}
                    onChange={(event) => updateEntry(entry.id, { quantity: Math.max(1, Math.min(99, Number(event.target.value) || 1)) })}
                    className="w-16 bg-transparent text-slate-100 focus:outline-none"
                  />
                </label>

                <div className="flex justify-end">
                  <button type="button" onClick={() => removeEntry(entry.id)} className="text-rose-400 hover:text-rose-300 text-lg leading-none" title="Remove focus">-</button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Public Note</label>
                  <textarea
                    value={entry.publicNote}
                    onChange={(event) => updateEntry(entry.id, { publicNote: event.target.value.slice(0, 500) })}
                    className="w-full min-h-[90px] rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none"
                    placeholder="Visible to everyone. Describe what you need from this role."
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Officer Note</label>
                  <textarea
                    value={entry.officerNote}
                    onChange={(event) => updateEntry(entry.id, { officerNote: event.target.value.slice(0, 500) })}
                    className="w-full min-h-[90px] rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none"
                    placeholder="Officer-only context: urgency, bench coverage, trial preference, etc."
                  />
                </div>
              </div>

              {spec ? (
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                  <img src={getSpecIcon(spec)} alt="" className="w-8 h-8 rounded border border-slate-700" />
                  <span style={{ color: getSpecColor(spec) }}>{spec.spec}</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
