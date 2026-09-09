import React, { useMemo } from 'react';
import {
  CURSE_TYPES,
  JUDGEMENT_TYPES,
  RAID_GROUPS,
  RAID_WIDE_LABEL,
  BOSS_TARGET_ID,
  RAID_MARKERS,
} from '../constants';
import { getOrCreatePhase } from '../utils/raidAssignmentState';

const UNKNOWN_ICON = 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg';
const CLASS_ICON_FALLBACKS = {
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
const SIGNUP_STATUS_LABELS = {
  signup: 'Signed up',
  bench: 'Benched',
  absent: 'Absent',
  absence: 'Absent',
  tentative: 'Tentative',
  late: 'Late'
};

function resolveSpecIconUrl(spec) {
  if (!spec) return null;
  return spec.icon_small
    || spec.icon_medium
    || spec.icon_large
    || spec.icon
    || SPEC_ICON_FALLBACKS[String(spec.spec || '')]
    || CLASS_ICON_FALLBACKS[String(spec.class || '').toLowerCase()]
    || UNKNOWN_ICON;
}

function SpecIcon({ spec, className = 'w-4 h-4' }) {
  if (!spec) return null;
  const iconUrl = resolveSpecIconUrl(spec);
  return <img src={iconUrl} alt={spec.spec || 'spec'} className={`${className} rounded-sm border border-slate-700 object-cover shrink-0`} />;
}

function SlotSelect({ value, onChange, options, disabled, placeholder }) {
  const isMissing = value && !options.some(o => o.id === value);
  const selectedOption = options.find(o => o.id === value);

  if (disabled) {
    return (
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {selectedOption && <SpecIcon spec={selectedOption.spec} />}
        <span className={`text-xs font-bold truncate ${isMissing ? 'text-red-400' : 'text-slate-300'}`} style={{ color: selectedOption?.color }}>
          {isMissing ? 'Deleted Slot' : (selectedOption ? selectedOption.name : placeholder.replace(/—/g, '').trim() || 'Unassigned')}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      {selectedOption && <SpecIcon spec={selectedOption.spec} />}
      <select
        className={`flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs focus:outline-none ${isMissing ? 'text-red-400 border-red-500 font-bold' : 'text-white'}`}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{ color: selectedOption?.color }}
      >
        <option value="" className="text-white">{placeholder}</option>
        {options.map(o => <option key={o.id} value={o.id} style={{ color: o.color }}>{o.name}</option>)}
        {isMissing && <option value={value} className="text-red-400 font-bold">Deleted Slot</option>}
      </select>
    </div>
  );
}

function PlayerSelect({ value, onChange, players, fullRoster, getSpecById, disabled, placeholder = '— Unassigned —' }) {
  const isMissing = value && !players.some(p => p.name === value);
  const player = fullRoster.find(p => p.name === value);
  const spec = player ? getSpecById(player.spec_id) : null;

  if (disabled) {
    return (
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {value && !isMissing && <SpecIcon spec={spec} />}
        <span className={`text-xs font-bold truncate ${isMissing ? 'text-red-400' : 'text-slate-300'}`} style={{ color: (value && !isMissing) ? spec?.color : undefined }}>
          {isMissing ? (player ? `${player.name} (Benched)` : `${value} (Benched)`) : (player ? player.name : placeholder.replace(/—/g, '').trim() || 'Unassigned')}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      {value && !isMissing && <SpecIcon spec={spec} />}
      <select
        className={`flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-purple-500 ${isMissing ? 'text-red-400 border-red-500 font-bold' : 'text-white'}`}
        value={value || ''}
        onChange={e => onChange(e.target.value || null)}
        style={{ color: (value && !isMissing) ? spec?.color : undefined }}
      >
        <option value="" className="text-white">{placeholder}</option>
        {players.map(p => {
          const pSpec = getSpecById(p.spec_id);
          return (
            <option key={p.id} value={p.name} style={{ color: pSpec?.color }}>
              {p.name}{p.signupStatus && SIGNUP_STATUS_LABELS[p.signupStatus] ? ` (${SIGNUP_STATUS_LABELS[p.signupStatus]})` : ''}
            </option>
          );
        })}
        {isMissing && (
          <option value={value} className="text-red-400 font-bold">
            {player ? `${player.name} (Benched)` : `${value} (Benched)`}
          </option>
        )}
      </select>
    </div>
  );
}

function ComboSelect({ value, onChange, options, placeholder = '— Select —', disabled }) {
  const isPresetValue = !!value && options.includes(value);

  if (disabled) {
    return (
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="text-xs font-bold text-slate-300 truncate">{value || placeholder.replace(/—/g, '').trim() || 'Unassigned'}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <select
        className="flex-1 min-w-0 bg-slate-900 text-white border border-slate-700 rounded px-2 py-1.5 text-xs focus:outline-none"
        value={isPresetValue ? value : ''}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function MarkerSelect({ value, onChange, disabled }) {
  return (
    <select disabled={disabled} className="bg-slate-900 text-white border border-slate-700 rounded px-2 py-1.5 text-xs focus:outline-none w-28 flex-shrink-0" value={value || ''} onChange={e => onChange(e.target.value || null)}>
      <option value="">No marker</option>
      {RAID_MARKERS.map(m => <option key={m.id} value={m.id}>{m.glyph} {m.label}</option>)}
    </select>
  );
}

function MarkerBadge({ markerId }) {
  const marker = RAID_MARKERS.find(m => m.id === markerId);
  if (!marker) return null;
  return <span title={marker.label} style={{ color: marker.color }} className="text-sm leading-none flex-shrink-0">{marker.glyph}</span>;
}

function SectionWrapper({ title, isAuthenticated, onAdd, onAutoFill, onRemoveSection, hasItems, emptyText, children }) {
  return (
    <details open className="bg-slate-900/40 p-4 rounded-lg border border-slate-800">
      <summary className="flex cursor-pointer list-none items-center gap-2 mb-3 border-b border-slate-800 pb-1.5">
        <span aria-hidden="true" className="bank-section-indicator inline-block transition-transform duration-150 text-slate-500">&gt;</span>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</h4>
      </summary>
      <div className="flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-end gap-2 mb-3">
          <div className="flex items-center gap-2">
            {isAuthenticated && onAdd && (
              <button onClick={onAdd} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-purple-400 font-bold px-2 py-0.5 rounded">+</button>
            )}
            {isAuthenticated && onAutoFill && (
              <button onClick={onAutoFill} className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold">Auto-fill</button>
            )}
            {isAuthenticated && onRemoveSection && (
              <button onClick={onRemoveSection} className="text-[10px] text-red-500 hover:text-red-400 font-bold px-1" title="Remove entire section">✕ Section</button>
            )}
          </div>
          </div>
        {!hasItems ? <p className="text-xs text-slate-600 italic mb-2">{emptyText}</p> : <div className="space-y-2 mb-2">{children}</div>}
        </div>
      </div>
    </details>
  );
}

const normalizeEnabledBlocks = (phase) => {
  const rawBlocks = phase?.enabledBlocks;
  if (Array.isArray(rawBlocks)) {
    return rawBlocks.filter(Boolean);
  }
  if (typeof rawBlocks === 'string' && rawBlocks.trim()) {
    return [rawBlocks];
  }
  return ['tanks', 'healers'];
};

const RaidAssignmentsBossCard = React.memo(function RaidAssignmentsBossCard({
  boss,
  bData,
  globalData,
  roster,
  getSpecById,
  getPlayersByClass,
  getPlayersByClasses,
  getPlayersBySpec,
  activeRaiders,
  manaReceivers,
  isAuthenticated,
  isEditMode,
  updateBoss,
  handleClearBoss,
  generateId,
}) {
  const canEdit = Boolean(isAuthenticated && isEditMode);
  const fullTargetList = useMemo(() => [{ id: BOSS_TARGET_ID, name: boss }, ...(bData.targets || [])], [boss, bData.targets]);

  const plainTanks = useMemo(() => globalData.tankSlots.map((s, i) => {
    const p = roster.find(player => player.name === s.playerName);
    const spec = p ? getSpecById(p.spec_id) : null;
    return { id: s.id, name: p?.name || `Tank ${i + 1}`, spec, color: spec?.color };
  }), [globalData.tankSlots, roster, getSpecById]);

  const plainHealers = useMemo(() => globalData.healerSlots.map((s, i) => {
    const p = roster.find(player => player.name === s.playerName);
    const spec = p ? getSpecById(p.spec_id) : null;
    return { id: s.id, name: p?.name || `Healer ${i + 1}`, spec, color: spec?.color };
  }), [globalData.healerSlots, roster, getSpecById]);

  const utilityConfigs = useMemo(() => [
    { key: 'interrupts', title: 'Interrupts', casters: activeRaiders, targetType: 'combo' },
    { key: 'stuns', title: 'Stuns', casters: getPlayersByClasses(['Warrior', 'Paladin', 'Rogue', 'Hunter']), targetType: 'combo' },
    { key: 'fears', title: 'Fears', casters: getPlayersByClasses(['Warlock', 'Priest', 'Hunter']), targetType: 'combo' },
    { key: 'banishes', title: 'Banishes', casters: getPlayersByClasses(['Warlock']), targetType: 'combo' },
    { key: 'sheep', title: 'Sheep', casters: getPlayersByClasses(['Mage']), targetType: 'combo' },
    { key: 'purges', title: 'Purges', casters: getPlayersByClasses(['Priest', 'Shaman', 'Hunter', 'Warlock']), targetType: 'combo' },
    { key: 'spellsteals', title: 'Spellsteals', casters: getPlayersByClasses(['Mage']), targetType: 'combo' },
    { key: 'curses', title: 'Curses', casters: getPlayersByClasses(['Warlock']), targetType: 'select', selectOptions: CURSE_TYPES, placeholder: '— Curse —' },
    { key: 'bops', title: 'Blessing of Protection', casters: getPlayersByClasses(['Paladin']), targetType: 'player', receivers: activeRaiders },
    { key: 'dispels', title: 'Dispels / Decurses', casters: getPlayersByClasses(['Paladin', 'Priest', 'Shaman', 'Mage', 'Druid']), targetType: 'text' },
    { key: 'powerInfusions', title: 'Power Infusions', casters: getPlayersBySpec('Discipline Priest'), targetType: 'player' }
  ], [activeRaiders, getPlayersByClasses, getPlayersBySpec]);

  return (
    <details open className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-5">
      <summary className="cursor-pointer list-none border-b border-slate-800 pb-3 flex items-center gap-2">
        <span aria-hidden="true" className="bank-section-indicator inline-block transition-transform duration-150 text-slate-500">&gt;</span>
        <h3 className="text-xl font-bold text-purple-400 font-serif italic tracking-wide">{boss}</h3>
      </summary>

      <div className="space-y-6 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-4">
            {canEdit && (
              <button onClick={() => handleClearBoss(boss)} className="text-[10px] font-bold text-red-500 uppercase hover:underline">
                Reset Boss
              </button>
            )}
          </div>
        <div className="flex items-center gap-2 flex-wrap bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bloodlust:</span>
            {canEdit ? (
              <input type="text" className="bg-slate-950 border border-slate-700 text-xs rounded px-2 py-1 text-red-400 font-bold focus:outline-none w-48" placeholder="Pull, 20% phase 3..." value={bData.bloodlustAt || ''} onChange={e => updateBoss(boss, b => b.bloodlustAt = e.target.value)} />
            ) : <span className="text-xs text-red-400 font-bold">{bData.bloodlustAt || '—'}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-800">
          <h5 className="text-xs font-bold text-[#abd473] uppercase tracking-widest mb-3 border-b border-slate-800 pb-1">Hunters (Misdirect)</h5>
          <div className="space-y-2">
            {getPlayersByClass('Hunter').map(h => {
              const hSpec = getSpecById(h.spec_id);
              return (
                <div key={h.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 w-24 flex-shrink-0">
                    <SpecIcon spec={hSpec} className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold truncate" style={{ color: hSpec?.color || '#abd473' }}>{h.name}</span>
                  </div>
                  <SlotSelect disabled={!canEdit} value={bData.hunterMDs?.[h.name] || ''} onChange={val => updateBoss(boss, b => { if (!b.hunterMDs) b.hunterMDs = {}; b.hunterMDs[h.name] = val; })} options={plainTanks} placeholder="— Tank —" />
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-800">
                  <h5 className="text-xs font-bold text-[#f58cba] uppercase tracking-widest mb-3 border-b border-slate-800 pb-1">Paladins (Judgements)</h5>
          <div className="space-y-2">
            {getPlayersByClass('Paladin').map(p => {
              const pSpec = getSpecById(p.spec_id);
              return (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 w-24 flex-shrink-0">
                    <SpecIcon spec={pSpec} className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold truncate" style={{ color: pSpec?.color || '#f58cba' }}>{p.name}</span>
                  </div>
                  {canEdit ? (
                    <select className="flex-1 bg-slate-950 text-white border border-slate-700 rounded px-1.5 py-1 text-xs focus:outline-none" value={bData.judgements?.[p.name] || ''} onChange={e => updateBoss(boss, b => {
                      if (!b.judgements) b.judgements = {};
                      if (e.target.value) b.judgements[p.name] = e.target.value;
                      else delete b.judgements[p.name];
                    })}>
                      <option value="">Use global ({globalData.judgements?.[p.name] || 'unassigned'})</option>
                      {JUDGEMENT_TYPES.map(j => <option key={j} value={j}>{j}</option>)}
                    </select>
                  ) : (
                    <span className="text-xs font-bold text-slate-300 flex-1 truncate">{bData.judgements?.[p.name] || globalData.judgements?.[p.name] || '—'}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-800/80">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Encounter Targets</h4>
          {canEdit && <button onClick={() => updateBoss(boss, b => b.targets.push({ id: generateId(), name: 'Spawned Add Name', markerId: null }))} className="text-[10px] text-purple-400 font-bold">+ Add Target Mob</button>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
            <span className="text-xs font-bold text-slate-300 flex-1">{boss} (Primary Boss)</span>
            <div className="w-28 flex justify-end flex-shrink-0">
              {canEdit ? (
                <MarkerSelect value={bData.bossMarkerId} onChange={val => updateBoss(boss, b => b.bossMarkerId = val)} disabled={!canEdit} />
              ) : (
                <MarkerBadge markerId={bData.bossMarkerId} />
              )}
            </div>
          </div>
          {bData.targets?.map(mob => (
            <div key={mob.id} className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800 group">
              {canEdit ? <input type="text" className="flex-1 bg-slate-900 text-white border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none" value={mob.name} onChange={e => updateBoss(boss, b => b.targets.find(t => t.id === mob.id).name = e.target.value)} /> : <span className="text-xs font-bold text-slate-300 flex-1 truncate">{mob.name}</span>}
              <div className="w-28 flex justify-end flex-shrink-0">
                {canEdit ? (
                  <MarkerSelect value={mob.markerId} onChange={val => updateBoss(boss, b => b.targets.find(t => t.id === mob.id).markerId = val)} disabled={!canEdit} />
                ) : (
                  <MarkerBadge markerId={mob.markerId} />
                )}
              </div>
              {canEdit && <button onClick={() => updateBoss(boss, b => b.targets = b.targets.filter(t => t.id !== mob.id))} className="text-red-500 font-bold px-1">✕</button>}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Encounter Phases</h4>
          {canEdit && <button onClick={() => updateBoss(boss, b => b.phases.push({ id: generateId(), name: `Phase ${b.phases.length + 1}`, enabledBlocks: ['tanks', 'healers'], tankAssignments: globalData.tankSlots.map(t => ({ id: generateId(), tankSlotId: t.id, targetId: BOSS_TARGET_ID })), healerAssignments: globalData.healerSlots.map(h => ({ id: generateId(), healerSlotId: h.id, target: RAID_WIDE_LABEL })) }))} className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded shadow">+ New Phase</button>}
        </div>

        {bData.phases?.map((phase, phaseIndex) => {
          const activeBlocks = normalizeEnabledBlocks(phase);
          const defaultInnervates = getPlayersByClass('Druid').map(player => ({ id: `default-innervate-${player.id}`, playerName: player.name, target: '' }));
          const innervateRows = Array.isArray(phase.innervates) ? phase.innervates : defaultInnervates;
          const getPhaseForEdit = (bossState) => {
            const phaseList = Array.isArray(bossState?.phases) ? bossState.phases : [];
            if (!phaseList[phaseIndex]) {
              phaseList[phaseIndex] = {
                id: phase.id || generateId(),
                name: phase.name || `Phase ${phaseList.length + 1}`,
                enabledBlocks: ['tanks', 'healers'],
                tankAssignments: [],
                healerAssignments: []
              };
            }
            return phaseList[phaseIndex];
          };
          const getInnervatesForEdit = (bossState) => {
            const targetPhase = getPhaseForEdit(bossState);
            if (!Array.isArray(targetPhase.innervates)) targetPhase.innervates = defaultInnervates.map(item => ({ ...item }));
            return targetPhase.innervates;
          };

          return (
            <div key={phase.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-2 flex-wrap gap-3">
                {canEdit ? <input type="text" className="bg-transparent text-amber-400 font-bold text-base focus:outline-none border-b border-slate-700 w-48" value={phase.name} onChange={e => updateBoss(boss, b => {
                  const p = getOrCreatePhase(b, phase.id, generateId);
                  p.name = e.target.value;
                })} /> : <h5 className="text-amber-400 font-bold text-base">{phase.name}</h5>}

                <div className="flex items-center gap-2 flex-wrap">
                  {canEdit && (
                    <select className="bg-slate-950 text-purple-400 border border-slate-700 rounded px-2 py-1 text-xs font-semibold focus:outline-none" value="" onChange={e => {
                      const sectionType = e.target.value;
                      if (!sectionType) return;
                      updateBoss(boss, b => {
                        const targetPhase = getPhaseForEdit(b);
                        const blocks = normalizeEnabledBlocks(targetPhase);
                        targetPhase.enabledBlocks = blocks;
                        if (!blocks.includes(sectionType)) {
                          blocks.push(sectionType);
                          if (!targetPhase[sectionType]) targetPhase[sectionType] = [];
                        }
                      });
                      e.target.value = '';
                    }}>
                      <option value="">+ Insert Module...</option>
                      <option value="interrupts">Interrupts</option>
                      <option value="stuns">Stuns</option>
                      <option value="fears">Fears</option>
                      <option value="banishes">Banishes</option>
                      <option value="sheep">Sheep</option>
                      <option value="purges">Purges</option>
                      <option value="spellsteals">Spellsteals</option>
                      <option value="curses">Curses</option>
                      <option value="fearWards">Fear Wards</option>
                      <option value="innervates">Innervates</option>
                      <option value="bops">Blessing of Protection</option>
                      <option value="dispels">Dispels / Decurses</option>
                      <option value="powerInfusions">Power Infusions</option>
                      <option value="notes">Phase Notes</option>
                    </select>
                  )}
                  {canEdit && <button onClick={() => updateBoss(boss, b => {
                    if (!Array.isArray(b.phases)) b.phases = [];
                    b.phases = b.phases.filter(p => p.id !== phase.id);
                  })} className="text-[10px] font-bold text-red-500 uppercase px-2 py-1 hover:bg-red-950/20 rounded">Delete Phase</button>}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeBlocks.includes('tanks') && (
                  <SectionWrapper title="Tank Targets" isAuthenticated={canEdit} onAutoFill={() => updateBoss(boss, b => {
                    const p = getPhaseForEdit(b);
                    const existing = Array.isArray(p.tankAssignments) ? p.tankAssignments : [];
                    const assigned = new Set(existing.map(item => item.tankSlotId).filter(Boolean));
                    const available = globalData.tankSlots.filter(slot => !assigned.has(slot.id));
                    let nextIndex = 0;
                    existing.forEach(item => {
                      if (!item.tankSlotId && available[nextIndex]) {
                        item.tankSlotId = available[nextIndex].id;
                        item.targetId = item.targetId || BOSS_TARGET_ID;
                        nextIndex += 1;
                      }
                    });
                    p.tankAssignments = [...existing, ...available.slice(nextIndex).map(slot => ({ id: generateId(), tankSlotId: slot.id, targetId: BOSS_TARGET_ID }))];
                  })} onAdd={() => updateBoss(boss, b => {
                    const p = getPhaseForEdit(b);
                    if (!Array.isArray(p.tankAssignments)) p.tankAssignments = [];
                    p.tankAssignments.push({ id: generateId(), tankSlotId: '', targetId: BOSS_TARGET_ID });
                  })} hasItems={phase.tankAssignments?.length > 0} emptyText="No targets tanked yet.">
                    {phase.tankAssignments?.map(ta => (
                      <div key={ta.id} className="flex items-center gap-1">
                        <SlotSelect disabled={!canEdit} value={ta.tankSlotId || ''} onChange={val => updateBoss(boss, b => {
                          const p = getPhaseForEdit(b);
                          if (!Array.isArray(p.tankAssignments)) p.tankAssignments = [];
                          const assignment = p.tankAssignments.find(t => t.id === ta.id);
                          if (assignment) assignment.tankSlotId = val;
                        })} options={plainTanks} placeholder="— Tank —" />
                        <span className="text-slate-600 text-xs">&rarr;</span>
                        {canEdit ? (
                          <select className="flex-1 min-w-0 bg-slate-950 text-white border border-slate-700 rounded px-1.5 py-1 text-xs focus:outline-none" value={ta.targetId || ''} onChange={e => updateBoss(boss, b => {
                            const p = getPhaseForEdit(b);
                            if (!Array.isArray(p.tankAssignments)) p.tankAssignments = [];
                            const assignment = p.tankAssignments.find(t => t.id === ta.id);
                            if (assignment) assignment.targetId = e.target.value;
                          })}>
                            <option value="">— Target —</option>
                            {fullTargetList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        ) : (
                          <span className="text-xs font-bold text-slate-300 flex-1 min-w-0 truncate">{fullTargetList.find(t => t.id === ta.targetId)?.name || 'Unassigned'}</span>
                        )}
                        {canEdit && <button onClick={() => updateBoss(boss, b => {
                          const p = getPhaseForEdit(b);
                          if (!Array.isArray(p.tankAssignments)) p.tankAssignments = [];
                          p.tankAssignments = p.tankAssignments.filter(t => t.id !== ta.id);
                        })} className="text-red-500 font-bold px-0.5">✕</button>}
                      </div>
                    ))}
                  </SectionWrapper>
                )}

                {activeBlocks.includes('healers') && (
                  <SectionWrapper title="Healer Targets" isAuthenticated={canEdit} onAutoFill={() => updateBoss(boss, b => {
                    const p = getPhaseForEdit(b);
                    const existing = Array.isArray(p.healerAssignments) ? p.healerAssignments : [];
                    const assigned = new Set(existing.map(item => item.healerSlotId).filter(Boolean));
                    const available = globalData.healerSlots.filter(slot => !assigned.has(slot.id));
                    let nextIndex = 0;
                    existing.forEach(item => {
                      if (!item.healerSlotId && available[nextIndex]) {
                        item.healerSlotId = available[nextIndex].id;
                        item.target = item.target || RAID_WIDE_LABEL;
                        nextIndex += 1;
                      }
                    });
                    p.healerAssignments = [...existing, ...available.slice(nextIndex).map(slot => ({ id: generateId(), healerSlotId: slot.id, target: RAID_WIDE_LABEL }))];
                  })} onAdd={() => updateBoss(boss, b => {
                    const p = getPhaseForEdit(b);
                    if (!Array.isArray(p.healerAssignments)) p.healerAssignments = [];
                    p.healerAssignments.push({ id: generateId(), healerSlotId: '', target: RAID_WIDE_LABEL });
                  })} hasItems={phase.healerAssignments?.length > 0} emptyText="No assigned triage targets.">
                    {phase.healerAssignments?.map(ha => (
                      <div key={ha.id} className="flex items-center gap-1">
                        <SlotSelect disabled={!canEdit} value={ha.healerSlotId || ''} onChange={val => updateBoss(boss, b => {
                          const p = getPhaseForEdit(b);
                          if (!Array.isArray(p.healerAssignments)) p.healerAssignments = [];
                          const assignment = p.healerAssignments.find(h => h.id === ha.id);
                          if (assignment) assignment.healerSlotId = val;
                        })} options={plainHealers} placeholder="— Healer —" />
                        <span className="text-slate-600 text-xs">&rarr;</span>
                        <ComboSelect disabled={!canEdit} value={ha.target} onChange={val => updateBoss(boss, b => {
                          const p = getPhaseForEdit(b);
                          if (!Array.isArray(p.healerAssignments)) p.healerAssignments = [];
                          const assignment = p.healerAssignments.find(h => h.id === ha.id);
                          if (assignment) assignment.target = val;
                        })} options={[...plainTanks.map(t => t.name), RAID_WIDE_LABEL, ...RAID_GROUPS]} />
                        {canEdit && <button onClick={() => updateBoss(boss, b => {
                          const p = getPhaseForEdit(b);
                          if (!Array.isArray(p.healerAssignments)) p.healerAssignments = [];
                          p.healerAssignments = p.healerAssignments.filter(h => h.id !== ha.id);
                        })} className="text-red-500 font-bold px-0.5">✕</button>}
                      </div>
                    ))}
                  </SectionWrapper>
                )}

                <SectionWrapper title="Innervates" isAuthenticated={canEdit} onAutoFill={() => updateBoss(boss, b => {
                  const rows = getInnervatesForEdit(b);
                  const assigned = new Set(rows.map(item => item.playerName).filter(Boolean));
                  getPlayersByClass('Druid').forEach(player => {
                    if (!assigned.has(player.name)) rows.push({ id: generateId(), playerName: player.name, target: '' });
                  });
                })} onAdd={() => updateBoss(boss, b => {
                  getInnervatesForEdit(b).push({ id: generateId(), playerName: null, target: '' });
                })} hasItems={innervateRows.length > 0} emptyText="No druids available for innervates.">
                  {innervateRows.map(item => (
                    <div key={item.id} className="flex items-center gap-1">
                      <PlayerSelect disabled={!canEdit} value={item.playerName} onChange={val => updateBoss(boss, b => {
                        const rows = getInnervatesForEdit(b);
                        const assignment = rows.find(entry => entry.id === item.id);
                        if (assignment) assignment.playerName = val;
                      })} players={getPlayersByClass('Druid')} fullRoster={roster} getSpecById={getSpecById} placeholder="— Druid —" />
                      <span className="text-slate-600 text-xs">&rarr;</span>
                      <PlayerSelect disabled={!canEdit} value={item.target} onChange={val => updateBoss(boss, b => {
                        const rows = getInnervatesForEdit(b);
                        const assignment = rows.find(entry => entry.id === item.id);
                        if (assignment) assignment.target = val;
                      })} players={manaReceivers} fullRoster={roster} getSpecById={getSpecById} placeholder="— Receiver —" />
                      {canEdit && <button onClick={() => updateBoss(boss, b => {
                        const rows = getInnervatesForEdit(b);
                        const targetPhase = getPhaseForEdit(b);
                        targetPhase.innervates = rows.filter(entry => entry.id !== item.id);
                      })} className="text-red-500 font-bold px-0.5">✕</button>}
                    </div>
                  ))}
                </SectionWrapper>

                {utilityConfigs.map(cfg => {
                  if (!activeBlocks.includes(cfg.key)) return null;
                  const rows = phase[cfg.key] || [];
                  return (
                    <SectionWrapper key={cfg.key} title={cfg.title} isAuthenticated={canEdit} onAdd={() => updateBoss(boss, b => {
                      const p = getOrCreatePhase(b, phase.id, generateId);
                      if (!p[cfg.key]) p[cfg.key] = [];
                      p[cfg.key].push({ id: generateId(), playerName: null, target: '' });
                    })} onRemoveSection={() => updateBoss(boss, b => {
                      const p = getOrCreatePhase(b, phase.id, generateId);
                      p.enabledBlocks = normalizeEnabledBlocks(p).filter(k => k !== cfg.key);
                      delete p[cfg.key];
                    })} hasItems={rows.length > 0} emptyText="No active assignments.">
                      {rows.map(item => (
                        <div key={item.id} className="flex items-center gap-1">
                          <PlayerSelect disabled={!canEdit} value={item.playerName} onChange={val => updateBoss(boss, b => {
                            const p = getOrCreatePhase(b, phase.id, generateId);
                            if (!Array.isArray(p[cfg.key])) p[cfg.key] = [];
                            const assignment = p[cfg.key].find(x => x.id === item.id);
                            if (assignment) assignment.playerName = val;
                          })} players={cfg.casters} fullRoster={roster} getSpecById={getSpecById} placeholder="— Player —" />
                          <span className="text-slate-600 text-xs">&rarr;</span>

                          {cfg.targetType === 'combo' && (
                            <ComboSelect disabled={!canEdit} value={item.target} onChange={val => updateBoss(boss, b => {
                              const p = getOrCreatePhase(b, phase.id, generateId);
                              if (!Array.isArray(p[cfg.key])) p[cfg.key] = [];
                              const assignment = p[cfg.key].find(x => x.id === item.id);
                              if (assignment) assignment.target = val;
                            })} options={fullTargetList.map(t => t.name)} placeholder="Target Details" />
                          )}
                          {cfg.targetType === 'player' && (
                            <PlayerSelect disabled={!canEdit} value={item.target} onChange={val => updateBoss(boss, b => {
                              const p = getOrCreatePhase(b, phase.id, generateId);
                              if (!Array.isArray(p[cfg.key])) p[cfg.key] = [];
                              const assignment = p[cfg.key].find(x => x.id === item.id);
                              if (assignment) assignment.target = val;
                            })} players={cfg.receivers || manaReceivers} fullRoster={roster} getSpecById={getSpecById} placeholder="— Receiver —" />
                          )}
                          {cfg.targetType === 'select' && (
                            canEdit ? (
                              <select className="flex-1 min-w-0 bg-slate-950 text-white border border-slate-700 rounded px-1.5 py-1 text-xs focus:outline-none" value={item.target || ''} onChange={e => updateBoss(boss, b => {
                                const p = getOrCreatePhase(b, phase.id, generateId);
                                if (!Array.isArray(p[cfg.key])) p[cfg.key] = [];
                                const assignment = p[cfg.key].find(x => x.id === item.id);
                                if (assignment) assignment.target = e.target.value;
                              })}>
                                <option value="">{cfg.placeholder || '— Select —'}</option>
                                {(cfg.selectOptions || []).map(option => <option key={option} value={option}>{option}</option>)}
                              </select>
                            ) : (
                              <span className="text-xs font-bold text-slate-300 flex-1 min-w-0 truncate">{item.target || '—'}</span>
                            )
                          )}
                          {cfg.targetType === 'text' && (
                            canEdit ? <input type="text" placeholder="Target / Note" className="flex-1 min-w-0 bg-slate-950 text-white border border-slate-700 rounded px-2 py-1.5 text-xs focus:outline-none" value={item.target || ''} onChange={e => updateBoss(boss, b => {
                              const p = getOrCreatePhase(b, phase.id, generateId);
                              if (!Array.isArray(p[cfg.key])) p[cfg.key] = [];
                              const assignment = p[cfg.key].find(x => x.id === item.id);
                              if (assignment) assignment.target = e.target.value;
                            })} />
                              : <span className="text-xs font-bold text-slate-300 flex-1 min-w-0 truncate">{item.target || '—'}</span>
                          )}

                          {canEdit && <button onClick={() => updateBoss(boss, b => {
                            const p = getOrCreatePhase(b, phase.id, generateId);
                            if (!Array.isArray(p[cfg.key])) p[cfg.key] = [];
                            p[cfg.key] = p[cfg.key].filter(x => x.id !== item.id);
                          })} className="text-red-500 font-bold px-0.5">✕</button>}
                        </div>
                      ))}
                    </SectionWrapper>
                  );
                })}

                {activeBlocks.includes('fearWards') && (
                  <SectionWrapper title="Fear Wards" isAuthenticated={canEdit} onAdd={() => updateBoss(boss, b => {
                    const p = getOrCreatePhase(b, phase.id, generateId);
                    if (!Array.isArray(p.fearWards)) p.fearWards = [];
                    p.fearWards.push({ id: generateId(), priestName: null, targetName: null });
                  })} onRemoveSection={() => updateBoss(boss, b => {
                    const p = getOrCreatePhase(b, phase.id, generateId);
                    p.enabledBlocks = normalizeEnabledBlocks(p).filter(k => k !== 'fearWards');
                    delete p.fearWards;
                  })} hasItems={phase.fearWards?.length > 0} emptyText="No assigned fear wards.">
                    {phase.fearWards?.map(fw => (
                      <div key={fw.id} className="flex items-center gap-1">
                        <PlayerSelect disabled={!canEdit} value={fw.priestName} onChange={val => updateBoss(boss, b => {
                          const p = getOrCreatePhase(b, phase.id, generateId);
                          if (!Array.isArray(p.fearWards)) p.fearWards = [];
                          const assignment = p.fearWards.find(x => x.id === fw.id);
                          if (assignment) assignment.priestName = val;
                        })} players={getPlayersByClass('Priest')} fullRoster={roster} getSpecById={getSpecById} placeholder="— Priest —" />
                        <span className="text-slate-600 text-xs">&rarr;</span>
                        <PlayerSelect disabled={!canEdit} value={fw.targetName} onChange={val => updateBoss(boss, b => {
                          const p = getOrCreatePhase(b, phase.id, generateId);
                          if (!Array.isArray(p.fearWards)) p.fearWards = [];
                          const assignment = p.fearWards.find(x => x.id === fw.id);
                          if (assignment) assignment.targetName = val;
                        })} players={activeRaiders} fullRoster={roster} getSpecById={getSpecById} placeholder="— Target —" />
                        {canEdit && <button onClick={() => updateBoss(boss, b => {
                          const p = getOrCreatePhase(b, phase.id, generateId);
                          if (!Array.isArray(p.fearWards)) p.fearWards = [];
                          p.fearWards = p.fearWards.filter(x => x.id !== fw.id);
                        })} className="text-red-500 font-bold px-0.5">✕</button>}
                      </div>
                    ))}
                  </SectionWrapper>
                )}

                {activeBlocks.includes('notes') && (
                  <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800 col-span-full relative group">
                    <div className="flex items-center justify-between mb-2 border-b border-slate-800 pb-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Notes</span>
                      {canEdit && <button onClick={() => updateBoss(boss, b => {
                        const p = getOrCreatePhase(b, phase.id, generateId);
                        p.enabledBlocks = normalizeEnabledBlocks(p).filter(k => k !== 'notes');
                        delete p.phaseNotes;
                      })} className="text-[10px] text-red-500 font-bold uppercase">✕ Notes</button>}
                    </div>
                    {canEdit ? (
                      <textarea rows="3" placeholder="Enter custom positioning text, dynamic cooldown orders, or burn guidelines..." className="w-full bg-slate-950 text-slate-300 border border-slate-700 rounded p-2 text-xs focus:outline-none resize-none" value={phase.phaseNotes || ''} onChange={e => updateBoss(boss, b => {
                        const targetPhase = getOrCreatePhase(b, phase.id, generateId);
                        targetPhase.phaseNotes = e.target.value;
                      })} />
                    ) : (
                      <p className="text-xs text-slate-300 whitespace-pre-wrap">{phase.phaseNotes || 'No tactics logged.'}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-slate-900 space-y-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Encounter Layout Positioning Reference Image</h4>
        {canEdit && (
          <input type="text" placeholder="Paste full canvas layout picture reference web URL link directly..." className="w-full bg-slate-900 text-slate-300 border border-slate-700 rounded p-2 text-xs focus:outline-none focus:border-purple-500" value={bData.imageUrl || ''} onChange={e => updateBoss(boss, b => b.imageUrl = e.target.value)} />
        )}
        {bData.imageUrl ? (
          <div className="w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 mt-2">
            <img src={bData.imageUrl} alt={`${boss} Tactical Matrix Layout Map Reference`} className="w-full h-auto object-contain max-h-[800px]" />
          </div>
        ) : <div className="text-xs text-slate-600 italic py-2">No custom tactics layout screenshot mapped via URL context references.</div>}
      </div>
    </div>
    </details>
  );
});

export default RaidAssignmentsBossCard;
