import { useMemo, useState } from 'react';
import { LEFT_SLOTS, BOTTOM_SLOTS } from '../constants';

const RIGHT_LAYOUT_SLOTS = ['Hands', 'Waist', 'Legs', 'Feet', 'Rings', 'Trinkets'];
const CORE_WEAPON_SLOTS = ['Weapon', 'Off Hand', 'Shield'];
const BIS_SLOT_ORDER = [...LEFT_SLOTS, ...CORE_WEAPON_SLOTS, ...RIGHT_LAYOUT_SLOTS, ...BOTTOM_SLOTS.filter(slot => !CORE_WEAPON_SLOTS.includes(slot))];

export default function BisConfigTab({
  selectedBisSpec,
  setSelectedBisSpec,
  specsFromDb,
  renderItemSlot,
  specsByName,
  renderItemLink,
  mutableItems = [],
  dbBisPriorities = {}
}) {
  const [selectedBisRaids, setSelectedBisRaids] = useState([]);
  const [selectedBisStatuses, setSelectedBisStatuses] = useState([]);
  const [selectedBisSlots, setSelectedBisSlots] = useState([]);
  const [bisTableSearch, setBisTableSearch] = useState('');
  const [bisColumnFilters, setBisColumnFilters] = useState({
    slot: '',
    name: '',
    source: '',
    boss: '',
    status: ''
  });
  const rightLayoutSlots = RIGHT_LAYOUT_SLOTS;
  const bisBottomSlots = BOTTOM_SLOTS.filter(slot => slot !== 'Main Hand');
  const leftRailSlots = LEFT_SLOTS;
  const rightRailSlots = rightLayoutSlots;
  const coreWeaponSlots = CORE_WEAPON_SLOTS;
  const rangedRelicSlots = bisBottomSlots.filter(slot => !coreWeaponSlots.includes(slot));
  const unknownIcon = 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg';

  const classColorFallbackByClass = {
    Druid: '#FF7D0A',
    Hunter: '#ABD473',
    Mage: '#69CCF0',
    Paladin: '#F58CBA',
    Priest: '#FFFFFF',
    Rogue: '#FFF569',
    Shaman: '#0070DE',
    Warlock: '#9482C9',
    Warrior: '#C79C6E'
  };

  const classIconFallbacks = {
    druid: 'https://wow.zamimg.com/images/wow/icons/small/spell_nature_healingtouch.jpg',
    hunter: 'https://wow.zamimg.com/images/wow/icons/small/ability_hunter_beasttaming.jpg',
    mage: 'https://wow.zamimg.com/images/wow/icons/small/spell_frost_frostbolt02.jpg',
    paladin: 'https://wow.zamimg.com/images/wow/icons/small/spell_holy_holybolt.jpg',
    priest: 'https://wow.zamimg.com/images/wow/icons/small/spell_holy_guardianspirit.jpg',
    rogue: 'https://wow.zamimg.com/images/wow/icons/small/ability_backstab.jpg',
    shaman: 'https://wow.zamimg.com/images/wow/icons/small/spell_nature_lightning.jpg',
    warlock: 'https://wow.zamimg.com/images/wow/icons/small/spell_shadow_deathcoil.jpg',
    warrior: 'https://wow.zamimg.com/images/wow/icons/small/inv_shield_06.jpg'
  };

  const specIconFallbacks = {
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

  const isNeutralDefaultColor = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized === '#e2e8f0' || normalized === '#e2e8f0ff' || normalized === 'rgb(226, 232, 240)';
  };

  const resolveSpecColor = (spec) => {
    if (!spec) return '#FFFFFF';
    const className = String(spec.class || '').trim();
    if (className && classColorFallbackByClass[className]) {
      return classColorFallbackByClass[className];
    }

    const byName = specsByName?.[spec.spec]?.color;
    if (byName && !isNeutralDefaultColor(byName)) return byName;

    if (spec.color && !isNeutralDefaultColor(spec.color)) return spec.color;
    return '#FFFFFF';
  };

  const toLargeIconUrl = (url) => {
    if (!url) return '';
    return String(url).replace('/small/', '/large/').replace('/medium/', '/large/');
  };

  const resolveLargestSpecIcon = (spec) => {
    if (!spec) return unknownIcon;

    const candidates = [
      spec.icon_large,
      toLargeIconUrl(spec.icon_large),
      toLargeIconUrl(spec.icon_medium),
      toLargeIconUrl(spec.icon_small),
      toLargeIconUrl(spec.icon),
      toLargeIconUrl(specIconFallbacks[String(spec.spec || '')]),
      toLargeIconUrl(classIconFallbacks[String(spec.class || '').toLowerCase()])
    ].filter(Boolean);

    return candidates[0] || unknownIcon;
  };
  
  // Quick lookup helper to grab the large icon profile for the spec background art
  const currentSpecObj = specsFromDb.find(s => s.spec === selectedBisSpec);
  const selectedSpecColor = currentSpecObj
    ? resolveSpecColor(currentSpecObj)
    : (specsByName?.[selectedBisSpec]?.color || '#FFFFFF');
  const selectedSpecIcon = resolveLargestSpecIcon(currentSpecObj || specsByName?.[selectedBisSpec]);

  const eligibleBisItems = useMemo(() => mutableItems.filter(item => {
    const status = dbBisPriorities[`${item?.name}|${selectedBisSpec}`];
    return status === 'BiS' || status === 'Opt';
  }), [dbBisPriorities, mutableItems, selectedBisSpec]);

  const bisRaidOptions = useMemo(() => {
    const raids = eligibleBisItems
      .map(item => String(item?.zone || item?.source || '').trim())
      .filter(Boolean);
    return [...new Set(raids)].sort((first, second) => first.localeCompare(second));
  }, [eligibleBisItems]);

  const bisSlotOptions = useMemo(() => {
    const slots = eligibleBisItems
      .map(item => String(item?.slot || '').trim())
      .filter(Boolean);
    return [...new Set(slots)].sort((first, second) => {
      const firstIndex = BIS_SLOT_ORDER.indexOf(first);
      const secondIndex = BIS_SLOT_ORDER.indexOf(second);
      return (firstIndex === -1 ? BIS_SLOT_ORDER.length : firstIndex)
        - (secondIndex === -1 ? BIS_SLOT_ORDER.length : secondIndex);
    });
  }, [eligibleBisItems]);

  const filteredBisItems = useMemo(() => eligibleBisItems
    .filter(item => {
      const raid = String(item?.zone || item?.source || '').trim();
      const slot = String(item?.slot || '').trim();
      const status = dbBisPriorities[`${item?.name}|${selectedBisSpec}`];
      return (selectedBisRaids.length === 0 || selectedBisRaids.includes(raid))
        && (selectedBisSlots.length === 0 || selectedBisSlots.includes(slot))
        && (selectedBisStatuses.length === 0
          || selectedBisStatuses.includes(status === 'Opt' ? 'Optional' : 'BiS'));
    })
    .map(item => ({
      ...item,
      bisStatus: dbBisPriorities[`${item?.name}|${selectedBisSpec}`]
    }))
    .filter(item => {
      const rowValues = {
        slot: item.slot || 'Unassigned',
        name: item.name || '',
        source: item.source || item.zone || 'Unknown',
        boss: item.boss || item.source_type || 'Unknown',
        status: item.bisStatus === 'Opt' ? 'Optional' : 'BiS'
      };
      const search = bisTableSearch.trim().toLowerCase();
      const matchesSearch = !search || Object.values(rowValues).some(value => String(value).toLowerCase().includes(search));
      const matchesColumns = Object.entries(bisColumnFilters).every(([key, value]) => (
        !value || String(rowValues[key]).toLowerCase().includes(value.toLowerCase())
      ));
      return matchesSearch && matchesColumns;
    })
    .sort((first, second) => {
      const firstSlotIndex = BIS_SLOT_ORDER.indexOf(String(first.slot || '').trim());
      const secondSlotIndex = BIS_SLOT_ORDER.indexOf(String(second.slot || '').trim());
      const slotCompare = (firstSlotIndex === -1 ? BIS_SLOT_ORDER.length : firstSlotIndex)
        - (secondSlotIndex === -1 ? BIS_SLOT_ORDER.length : secondSlotIndex);
      if (slotCompare) return slotCompare;

      const statusCompare = (first.bisStatus === 'BiS' ? 0 : 1) - (second.bisStatus === 'BiS' ? 0 : 1);
      return statusCompare || String(first.name || '').localeCompare(String(second.name || ''));
    }),
  [bisColumnFilters, bisTableSearch, dbBisPriorities, eligibleBisItems, selectedBisRaids, selectedBisSlots, selectedBisSpec, selectedBisStatuses]);

  const renderMultiSelectFilter = (label, options, selectedValues, setSelectedValues) => (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-300">
        <span aria-hidden="true" className="bank-section-indicator inline-block transition-transform duration-150 text-slate-500">&gt;</span>
        {label}: {selectedValues.length ? `${selectedValues.length} selected` : 'All'}
      </summary>
      <div className="absolute right-0 z-30 mt-1 max-h-64 min-w-[190px] overflow-y-auto rounded border border-slate-700 bg-slate-950 p-2 shadow-xl">
        {options.map(option => (
          <label key={option} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-900">
            <input
              type="checkbox"
              checked={selectedValues.includes(option)}
              onChange={() => setSelectedValues(current => current.includes(option)
                ? current.filter(value => value !== option)
                : [...current, option])}
              className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-900"
            />
            {option}
          </label>
        ))}
      </div>
    </details>
  );

  return (
    <section className="bis-tab theme-panel theme-panel-tab p-6 animate-in fade-in duration-300">
      
      {/* Control Selector Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner">
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">Class Configuration Viewer</h2>
          <p className="text-sm text-slate-500">View primary BiS and alternate options mapped to the paper doll interface.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select Spec:</span>
          <select 
            className="bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 min-w-[200px] focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer font-bold text-sm" 
            value={selectedBisSpec || ''} 
            onChange={e => setSelectedBisSpec(e.target.value)} 
            style={{ color: selectedSpecColor }}
          >
            {specsFromDb.map(spec => (
              <option key={spec.id} value={spec.spec} style={{ color: resolveSpecColor(spec) }}>
                {spec.spec}
              </option>
            ))}
          </select>
        </div>
      </div>

      <style>{`
        .bis-tab .character-slot-icon .iconlarge {
          margin-top: -15px !important;
          margin-left: -15px !important;
        }
      `}</style>

      {/* Visual Character Sheet Paper Doll Grid Container */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 lg:p-8 shadow-2xl relative overflow-hidden">

        {/* Ambient background art layer */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
          <img
            src={selectedSpecIcon}
            alt=""
            className="w-[28rem] h-[28rem] object-cover filter grayscale blur-sm"
          />
        </div>

        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-[minmax(260px,1fr)_340px_minmax(260px,1fr)] gap-4 xl:gap-6 items-start">
          <div className="space-y-3">
            {leftRailSlots.map(slot => renderItemSlot(slot))}
          </div>

          <div className="relative flex flex-col items-center gap-4">
            <div className="w-full rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
              <div className="text-center mb-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-[0.22em] font-bold">BiS Config</div>
                <div className="text-sm text-slate-200 font-semibold">{selectedBisSpec || 'Spec'}</div>
              </div>
              <div className="relative mx-auto h-[460px] w-full max-w-[280px] rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(139,92,246,0.22),rgba(2,6,23,0)_58%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_85%,rgba(56,189,248,0.12),rgba(2,6,23,0)_62%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={selectedSpecIcon}
                    alt=""
                    className="w-60 h-60 opacity-30 saturate-75"
                  />
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-500 text-center">Primary BiS stays visible by default. Use the chevrons below slots to reveal optional items.</p>
            </div>

            <div className="w-full rounded-xl border border-slate-800 bg-slate-900/70 p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Weapon Set</div>
              <div className="space-y-3">
                {coreWeaponSlots.map(slot => renderItemSlot(slot)).filter(Boolean)}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {rightRailSlots.map(slot => renderItemSlot(slot))}
          </div>
        </div>

        <div className="relative z-10 mt-5 rounded-xl border border-slate-800 bg-slate-900/55 p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Ranged / Relic Slots</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            {rangedRelicSlots.map(slot => renderItemSlot(slot))
              .filter(Boolean)
              .map((slot, i) => <div key={i} className="min-w-0">{slot}</div>)}
          </div>
        </div>

      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-200">BiS Item List</h3>
            <p className="mt-1 text-xs text-slate-500">Filter your primary and optional items by raid, status, or slot.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {renderMultiSelectFilter('Raid', bisRaidOptions, selectedBisRaids, setSelectedBisRaids)}
            {renderMultiSelectFilter('Status', ['BiS', 'Optional'], selectedBisStatuses, setSelectedBisStatuses)}
            {renderMultiSelectFilter('Slot', bisSlotOptions, selectedBisSlots, setSelectedBisSlots)}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-800">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-950 p-3">
            <input
              type="search"
              value={bisTableSearch}
              onChange={event => setBisTableSearch(event.target.value)}
              placeholder="Search items, slots, sources, bosses, or status"
              className="min-w-[260px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <span className="text-xs text-slate-500">{filteredBisItems.length} of {eligibleBisItems.length} items</span>
          </div>
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-slate-900 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                {[
                  ['slot', 'Slot'],
                  ['name', 'Item Name'],
                  ['source', 'Source'],
                  ['boss', 'Boss'],
                  ['status', 'Status']
                ].map(([key, label]) => (
                  <th key={key} className="px-3 py-2 font-bold">
                    <div className="flex flex-col gap-2">
                      <span>{label}</span>
                      <input
                        type="search"
                        value={bisColumnFilters[key]}
                        onChange={event => setBisColumnFilters(current => ({ ...current, [key]: event.target.value }))}
                        placeholder="Filter"
                        className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] font-normal normal-case tracking-normal text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/60">
              {filteredBisItems.length > 0 ? filteredBisItems.map(item => (
                <tr key={`${item.id}-${item.bisStatus}`} className="text-slate-300">
                  <td className="px-3 py-2 font-semibold text-cyan-300">{item.slot || 'Unassigned'}</td>
                  <td className="px-3 py-2 font-semibold text-purple-300">{renderItemLink(item, 'font-semibold text-purple-300', 'small')}</td>
                  <td className="px-3 py-2 text-slate-400">{item.source || item.zone || 'Unknown'}</td>
                  <td className="px-3 py-2 text-slate-400">{item.boss || item.source_type || 'Unknown'}</td>
                  <td className={`px-3 py-2 font-bold ${item.bisStatus === 'BiS' ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {item.bisStatus === 'Opt' ? 'Optional' : 'BiS'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-3 py-6 text-center italic text-slate-500">No BiS or optional items found for this raid.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}