import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  CURSE_TYPES, JUDGEMENT_TYPES,
  RAID_GROUPS, RAID_WIDE_LABEL, BOSS_TARGET_ID, RAID_MARKERS, DEFAULT_BOSS_ENCOUNTERS
} from '../constants';
import { buildRaidAssignmentsExport, serializeRaidAssignmentsExport } from '../services/raidAssignmentsExport.js';
import { normalizeBossState } from '../utils/raidAssignmentState.js';
import RaidAssignmentsBossCard from './RaidAssignmentsBossCard.jsx';

// --- HELPER COMPONENTS ---

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

function SpecIcon({ spec, className = "w-4 h-4" }) {
  if (!spec) return null;
  const iconUrl = resolveSpecIconUrl(spec);
  return <img src={iconUrl} alt={spec.spec || 'spec'} className={`${className} rounded-sm border border-slate-700 object-cover shrink-0`} />;
}

const SIGNUP_STATUS_LABELS = {
  signup: 'Signed up',
  bench: 'Benched',
  absent: 'Absent',
  absence: 'Absent',
  tentative: 'Tentative',
  late: 'Late'
};

const SIGNUP_STATUS_STYLES = {
  signup: 'text-emerald-400',
  bench: 'text-slate-400',
  absent: 'text-red-400',
  absence: 'text-red-400',
  tentative: 'text-amber-300',
  late: 'text-orange-300'
};

const RAID_ASSIGNMENTS_EVENT_STORAGE_KEY = 'raid-assignments-selected-event-id';

function SignupStatusIcon({ status, label }) {
  const iconPaths = {
    signup: <path d="m5 12 4 4L19 6" />,
    late: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 1.5" /></>,
    tentative: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4M12 16h.01" /></>,
    absent: <><circle cx="12" cy="12" r="8" /><path d="m9 9 6 6m0-6-6 6" /></>,
    absence: <><circle cx="12" cy="12" r="8" /><path d="m9 9 6 6m0-6-6 6" /></>,
    bench: <><path d="M5 5l14 14" /><path d="M9 5h6a4 4 0 0 1 4 4v6" /><path d="M5 9v6a4 4 0 0 0 4 4h6" /></>
  };

  return (
    <svg
      aria-label={label}
      className={`w-4 h-4 shrink-0 ${SIGNUP_STATUS_STYLES[status] || 'text-slate-500'}`}
      fill="none"
      role="img"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      title={label}
      viewBox="0 0 24 24"
    >
      {iconPaths[status] || <><circle cx="12" cy="12" r="8" /><path d="M12 8v4" /><path d="M12 16h.01" /></>}
    </svg>
  );
}

function formatSignupEventLabel(event) {
  if (!event) return '';
  const date = event.scheduled_for ? new Date(String(event.scheduled_for).replace(' ', 'T')) : null;
  const dateLabel = date && !Number.isNaN(date.getTime())
    ? ` · ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
    : '';
  return `${event.title || `Raid Signup #${event.id}`}${dateLabel}`;
}

function SignupRosterReference({ event, entries, groups, getSpecById, isLoading, error, isOpen, onToggle }) {
  const entryByName = useMemo(() => new Map(entries.map(entry => [String(entry.discord_username || entry.player_name || '').trim().toLowerCase(), entry])), [entries]);
  const groupedSections = useMemo(() => {
    const groupedNames = new Set();
    const sections = new Map();
    (Array.isArray(groups) ? groups : [])
      .filter(row => Number(row.group_number) > 0 && String(row.player_name || '').trim())
      .sort((a, b) => Number(a.group_number) - Number(b.group_number) || Number(a.slot_index) - Number(b.slot_index))
      .forEach(row => {
        const name = String(row.player_name || '').trim();
        const entry = entryByName.get(name.toLowerCase());
        if (!entry) return;
        const groupNumber = Number(row.group_number);
        if (!sections.has(groupNumber)) sections.set(groupNumber, { name: row.group_name || `Group ${groupNumber}`, entries: [] });
        sections.get(groupNumber).entries.push(entry);
        groupedNames.add(String(entry.discord_username || entry.player_name || '').trim().toLowerCase());
      });
    return { sections: [...sections.entries()].sort(([a], [b]) => a - b).map(([number, section]) => ({ number, ...section })), groupedNames };
  }, [entries, entryByName, groups]);

  const renderEntry = entry => {
    const status = String(entry.status || '').toLowerCase();
    const statusLabel = SIGNUP_STATUS_LABELS[status] || status || 'Unknown';
    const spec = getSpecById(entry.spec_id) || {
      class: entry.spec_class,
      spec: entry.spec_name,
      icon_small: entry.icon_small,
      icon_medium: entry.icon_medium,
      icon_large: entry.icon_large
    };
    return (
      <div key={entry.id || `${entry.discord_user_id}-${entry.discord_username}`} className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-2 py-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <SpecIcon spec={spec} className="w-5 h-5" />
          <div className="text-xs font-bold truncate" style={{ color: spec?.color || '#cbd5e1' }}>{entry.discord_username || entry.player_name || 'Unknown player'}</div>
        </div>
        <SignupStatusIcon status={status} label={statusLabel} />
      </div>
    );
  };

  return (
    <details open={isOpen} onToggle={event => onToggle(event.currentTarget.open)} className="bg-slate-950 border border-cyan-900/60 rounded-xl shadow-inner">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-5 py-4">
        <div>
          <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-widest">Signed-up Roster Reference</h3>
          <p className="text-xs text-slate-500 mt-1">The selected signup event is the player pool used by assignment selectors.</p>
        </div>
        <span className="text-xs font-bold text-slate-400">{isOpen ? 'Hide' : 'Show'}</span>
      </summary>
      <div className="border-t border-slate-800 px-5 py-4">
        {isLoading && <p className="text-xs text-slate-500">Loading signup roster...</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
        {!isLoading && !error && !event && <p className="text-xs text-slate-500">Select a raid signup event above to load its roster.</p>}
        {!isLoading && !error && event && entries.length === 0 && <p className="text-xs text-slate-500">No players are signed up for this event.</p>}
        {entries.length > 0 && (
          <>
            {groupedSections.sections.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {groupedSections.sections.map(section => (
                  <div key={section.number} className="rounded-lg border border-slate-800 bg-slate-900/40 p-2">
                    <h4 className="mb-2 border-b border-slate-800 pb-1 text-xs font-bold text-amber-300 truncate">{section.name}</h4>
                    <div className="space-y-1.5">{section.entries.map(renderEntry)}</div>
                  </div>
                ))}
              </div>
            )}
            {entries.some(entry => !groupedSections.groupedNames.has(String(entry.discord_username || entry.player_name || '').trim().toLowerCase())) && (
              <div className={`${groupedSections.sections.length > 0 ? 'mt-4 border-t border-slate-800 pt-3' : ''}`}>
                {groupedSections.sections.length > 0 && <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Ungrouped</h4>}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-1.5">
                  {entries.filter(entry => !groupedSections.groupedNames.has(String(entry.discord_username || entry.player_name || '').trim().toLowerCase())).map(renderEntry)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </details>
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

function ComboSelect({ value, onChange, options, placeholder = '— Select —', disabled }) {
  const [forceCustom, setForceCustom] = useState(false);

  if (disabled) {
    return (
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="text-xs font-bold text-slate-300 truncate">{value || placeholder.replace(/—/g, '').trim() || 'Unassigned'}</span>
      </div>
    );
  }

  const isPresetValue = !!value && options.includes(value);
  const showCustomInput = forceCustom || (!!value && !isPresetValue);

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <select
        className="flex-1 min-w-0 bg-slate-900 text-white border border-slate-700 rounded px-2 py-1.5 text-xs focus:outline-none"
        value={showCustomInput ? '__custom__' : (isPresetValue ? value : '')}
        onChange={e => {
          if (e.target.value === '__custom__') { setForceCustom(true); onChange(''); }
          else { setForceCustom(false); onChange(e.target.value); }
        }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
        <option value="__custom__">Custom…</option>
      </select>
      {showCustomInput && (
        <input
          type="text"
          placeholder="Custom assignment..."
          className="flex-1 min-w-0 bg-slate-950 text-white border border-slate-700 rounded px-2 py-1.5 text-xs focus:outline-none"
          value={value}
          onChange={e => onChange(e.target.value)}
          autoFocus
        />
      )}
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

function SectionWrapper({ title, isAuthenticated, onAdd, onRemoveSection, hasItems, emptyText, children }) {
  return (
    <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-1.5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</h4>
          <div className="flex items-center gap-2">
            {isAuthenticated && onAdd && (
              <button onClick={onAdd} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-purple-400 font-bold px-2 py-0.5 rounded">+</button>
            )}
            {isAuthenticated && onRemoveSection && (
              <button onClick={onRemoveSection} className="text-[10px] text-red-500 hover:text-red-400 font-bold px-1" title="Remove entire section">✕ Section</button>
            )}
          </div>
        </div>
        {!hasItems ? <p className="text-xs text-slate-600 italic mb-2">{emptyText}</p> : <div className="space-y-2 mb-2">{children}</div>}
      </div>
    </div>
  );
}

function BossSelector({ raidZones, enabledBosses, handleToggleZone, handleToggleBoss, isAuthenticated, showManageBosses, onToggleManageBosses }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:border-purple-500 transition">
        Boss Selector ({enabledBosses.length} active)
        <span className="text-slate-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-20 w-80 max-h-96 overflow-y-auto custom-scrollbar bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-3 space-y-1">
            {isAuthenticated && (
              <button
                onClick={() => {
                  onToggleManageBosses(!showManageBosses);
                  setOpen(false);
                }}
                className="w-full text-left bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 rounded px-3 py-2 text-xs font-bold uppercase tracking-wider mb-2"
              >
                {showManageBosses ? 'Hide Manage Bosses' : 'Manage Bosses'}
              </button>
            )}
            {raidZones.map(zone => {
              const zoneBossesEnabled = zone.bosses.filter(b => enabledBosses.includes(b)).length;
              const allEnabled = zoneBossesEnabled === zone.bosses.length;
              const someEnabled = zoneBossesEnabled > 0 && !allEnabled;
              return (
                <div key={zone.name} className="border-b border-slate-900 last:border-0 pb-1.5 mb-1.5">
                  <label className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-slate-900/60">
                    <input type="checkbox" checked={allEnabled} ref={el => { if (el) el.indeterminate = someEnabled; }} onChange={e => handleToggleZone(zone.name, e.target.checked)} className="rounded bg-slate-800 border-slate-600 text-amber-500 w-4 h-4 cursor-pointer flex-shrink-0" />
                    <span className="text-sm font-bold text-slate-200">{zone.name}</span>
                  </label>
                  <div className="pl-7 space-y-0.5 mt-0.5">
                    {zone.bosses.map(boss => (
                      <label key={boss} className="flex items-center gap-2 cursor-pointer py-0.5 px-1 rounded hover:bg-slate-900/60">
                        <input type="checkbox" checked={enabledBosses.includes(boss)} onChange={e => handleToggleBoss(boss, e.target.checked)} className="rounded bg-slate-800 border-slate-600 text-amber-500 w-3.5 h-3.5 cursor-pointer flex-shrink-0" />
                        <span className="text-xs text-slate-400">{boss}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function createDefaultBossState(boss, generateId) {
  const bossDefaults = DEFAULT_BOSS_ENCOUNTERS[boss] || null;
  const defaultTargets = (bossDefaults?.targets || []).flatMap((target) => {
    return Array.from({ length: target.count || 1 }, () => ({
      id: generateId(),
      name: target.name,
      markerId: null,
    }));
  });

  const phaseCount = Number.isFinite(bossDefaults?.phaseCount) ? bossDefaults.phaseCount : (bossDefaults?.phases?.length || 1);
  const defaultPhases = Array.from({ length: Math.max(phaseCount, 1) }, (_, index) => ({
    id: generateId(),
    name: bossDefaults?.phases?.[index] || `Phase ${index + 1}`,
    enabledBlocks: ['tanks', 'healers'],
    tankAssignments: [],
    healerAssignments: []
  }));

  return {
    targets: defaultTargets,
    phases: defaultPhases,
    hunterMDs: {},
    judgements: {},
    fearWards: [],
    imageUrl: '',
    bloodlustAt: ''
  };
}

// --- MAIN CONTAINER COMPONENT ---
const RaidAssignmentsTab = React.memo(function RaidAssignmentsTab({
  isAuthenticated, roster, getSpecById, enabledBosses = [], raidZones = [], handleToggleZone, handleToggleBoss, handleMoveEnabledBoss, customRaidGroups = [], handleAddCustomRaidBoss, handleRemoveCustomRaidBoss, raidAssignmentData, setRaidAssignmentData: setStoredRaidAssignmentData,
  hasUnsavedChanges, onSaveChanges, isSaving, myPlayerName, actorBattleTag = '', onCopyToArchive,
  selectedRaid = 'All Raids', setSelectedRaid, selectedPhase = 'All Phases', setSelectedPhase,
  userBossFilter = null, setUserBossFilter, fetchData,
}) {
  const [showManageBosses, setShowManageBosses] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newCustomZoneName, setNewCustomZoneName] = useState('');
  const [newCustomBossName, setNewCustomBossName] = useState('');
  const [exportStatus, setExportStatus] = useState('');
  const [archiveBossSelection, setArchiveBossSelection] = useState('');
  const [signupEvents, setSignupEvents] = useState([]);
  const [selectedSignupEventId, setSelectedSignupEventId] = useState(() => localStorage.getItem(RAID_ASSIGNMENTS_EVENT_STORAGE_KEY) || '');
  const [selectedSignupEvent, setSelectedSignupEvent] = useState(null);
  const [signupRosterLoading, setSignupRosterLoading] = useState(false);
  const [signupRosterError, setSignupRosterError] = useState('');
  const [showSignupRoster, setShowSignupRoster] = useState(false);
  const [showImportPreviousModal, setShowImportPreviousModal] = useState(false);
  const defaultBossStatesRef = useRef({});

  const activeSignupEvents = useMemo(() => signupEvents.filter(event => String(event.status || '').toLowerCase() !== 'archived'), [signupEvents]);
  const archivedSignupEvents = useMemo(() => signupEvents.filter(event => String(event.status || '').toLowerCase() === 'archived'), [signupEvents]);

  React.useEffect(() => {
    if (selectedSignupEventId) {
      localStorage.setItem(RAID_ASSIGNMENTS_EVENT_STORAGE_KEY, String(selectedSignupEventId));
    } else {
      localStorage.removeItem(RAID_ASSIGNMENTS_EVENT_STORAGE_KEY);
    }
  }, [selectedSignupEventId]);

  React.useEffect(() => {
    if (!fetchData) return undefined;
    let cancelled = false;
    fetchData('raid-signup-events')
      .then(events => {
        if (!cancelled) setSignupEvents(Array.isArray(events) ? events : []);
      })
      .catch(() => {
        if (!cancelled) setSignupRosterError('Could not load raid signup events.');
      });
    return () => { cancelled = true; };
  }, [fetchData]);

  React.useEffect(() => {
    if (!selectedSignupEventId || !fetchData) {
      setSelectedSignupEvent(null);
      return undefined;
    }

    let cancelled = false;
    setSignupRosterLoading(true);
    setSignupRosterError('');
    fetchData(`raid-signup-events/${selectedSignupEventId}`)
      .then(event => {
        if (!cancelled) {
          const publicEvent = !isAuthenticated && event?.public_groups !== true && event?.public_groups !== 1
            ? { ...event, groups: [] }
            : event;
          setSelectedSignupEvent(publicEvent);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedSignupEvent(null);
          setSignupRosterError('Could not load the selected signup roster.');
        }
      })
      .finally(() => {
        if (!cancelled) setSignupRosterLoading(false);
      });
    return () => { cancelled = true; };
  }, [fetchData, isAuthenticated, selectedSignupEventId]);

  const signupEntries = useMemo(() => (
    Array.isArray(selectedSignupEvent?.entries) ? selectedSignupEvent.entries : []
  ), [selectedSignupEvent]);

  const assignmentRoster = useMemo(() => {
    if (!selectedSignupEvent) return roster;
    const rosterByName = new Map(roster.map(player => [String(player.name || '').trim().toLowerCase(), player]));
    return signupEntries.map((entry, index) => {
      const name = String(entry.discord_username || '').trim() || `Signup ${index + 1}`;
      const existing = rosterByName.get(name.toLowerCase());
      return {
        ...(existing || {}),
        id: existing?.id || `signup-${entry.id || index}`,
        name,
        spec_id: entry.spec_id || existing?.spec_id || null,
        in_raid: true,
        signupStatus: String(entry.status || '').toLowerCase()
      };
    });
  }, [roster, selectedSignupEvent, signupEntries]);

  const activeAssignmentData = useMemo(() => {
    if (!selectedSignupEventId) return raidAssignmentData || {};
    return raidAssignmentData?.__eventAssignments?.[selectedSignupEventId] || {};
  }, [raidAssignmentData, selectedSignupEventId]);

  const previousSignupEvent = useMemo(() => {
    const currentId = Number(selectedSignupEventId);
    return signupEvents
      .filter(event => Number(event.id) < currentId)
      .sort((a, b) => Number(b.id) - Number(a.id))[0] || null;
  }, [selectedSignupEventId, signupEvents]);

  const setRaidAssignmentData = useCallback((newValueOrUpdater) => {
    if (!selectedSignupEventId) {
      setStoredRaidAssignmentData(newValueOrUpdater);
      return;
    }

    setStoredRaidAssignmentData(previous => {
      const root = { ...(previous || {}) };
      const current = root.__eventAssignments?.[selectedSignupEventId] || {};
      const next = typeof newValueOrUpdater === 'function'
        ? newValueOrUpdater(current)
        : newValueOrUpdater;
      root.__eventAssignments = {
        ...(root.__eventAssignments || {}),
        [selectedSignupEventId]: next || {}
      };
      return root;
    });
  }, [selectedSignupEventId, setStoredRaidAssignmentData]);

  const previousRaidBosses = useMemo(() => {
    if (!previousSignupEvent) return [];
    const previousData = raidAssignmentData?.__eventAssignments?.[previousSignupEvent.id];
    if (!previousData) return [];
    return Object.keys(previousData).filter(key => !key.startsWith('__') && key !== 'global');
  }, [previousSignupEvent, raidAssignmentData]);

  const handleImportPreviousRaid = useCallback(() => {
    if (!selectedSignupEventId || !previousSignupEvent) return;
    const previousData = raidAssignmentData?.__eventAssignments?.[previousSignupEvent.id];
    if (!previousData) {
      alert('No saved assignments were found for the previous raid.');
      return;
    }

    setStoredRaidAssignmentData(previous => ({
      ...(previous || {}),
      __eventAssignments: {
        ...(previous?.__eventAssignments || {}),
        [selectedSignupEventId]: JSON.parse(JSON.stringify(previousData))
      }
    }));
    setShowImportPreviousModal(false);
    setExportStatus(`Imported assignments from ${formatSignupEventLabel(previousSignupEvent)}.`);
  }, [previousSignupEvent, raidAssignmentData, selectedSignupEventId, setStoredRaidAssignmentData]);

  const visibleBosses = useMemo(() => {
    if (userBossFilter === null || userBossFilter === undefined) {
      return enabledBosses;
    }
    return enabledBosses.filter(boss => userBossFilter.includes(boss));
  }, [enabledBosses, userBossFilter]);

  const buildCurrentRaidAssignmentExport = () => buildRaidAssignmentsExport({
    raidAssignmentData: activeAssignmentData,
    roster,
    enabledBosses,
    raidZones,
    getSpecById,
    exportTimestamp: new Date().toISOString()
  });

  const selectedArchiveBosses = archiveBossSelection
    ? enabledBosses.filter(boss => boss === archiveBossSelection)
    : enabledBosses;

  const buildArchiveLiveSnapshot = () => {
    const nextData = {};

    if (activeAssignmentData?.global) {
      nextData.global = JSON.parse(JSON.stringify(activeAssignmentData.global));
    }

    if (activeAssignmentData?.__bossOrder) {
      const filteredOrder = Object.fromEntries(
        Object.entries(activeAssignmentData.__bossOrder).filter(([bossName]) => selectedArchiveBosses.includes(bossName))
      );
      if (Object.keys(filteredOrder).length > 0) {
        nextData.__bossOrder = filteredOrder;
      }
    }

    if (activeAssignmentData?.__customBossGroups) {
      nextData.__customBossGroups = JSON.parse(JSON.stringify(activeAssignmentData.__customBossGroups));
    }

    selectedArchiveBosses.forEach(bossName => {
      if (activeAssignmentData?.[bossName]) {
        nextData[bossName] = JSON.parse(JSON.stringify(activeAssignmentData[bossName]));
      }
    });

    return nextData;
  };

  const buildArchiveExport = () => buildRaidAssignmentsExport({
    raidAssignmentData: activeAssignmentData,
    roster,
    enabledBosses: selectedArchiveBosses,
    raidZones,
    getSpecById,
    exportTimestamp: new Date().toISOString()
  });

  /*
  const downloadRaidAssignmentsJson = () => {
    const payload = buildCurrentRaidAssignmentExport();
    const text = serializeRaidAssignmentsExport(payload);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `raid-assignments-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportStatus('Downloaded JSON file.');
  };
  */

  const copyRaidAssignmentsJson = async () => {
    const payload = buildCurrentRaidAssignmentExport();
    const text = serializeRaidAssignmentsExport(payload);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        setExportStatus('Copied JSON to clipboard.');
        return;
      } catch (error) {
        // fall back to manual copy below
      }
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    setExportStatus('Copied JSON to clipboard.');
  };

  const copyRaidAssignmentsToArchive = () => {
    const payload = buildArchiveExport();
    const bossLabel = archiveBossSelection || 'All selected bosses';
    onCopyToArchive?.({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      boss: bossLabel,
      actorBattleTag: actorBattleTag || 'Unknown',
      bossCount: selectedArchiveBosses.length,
      selectedBosses: [...selectedArchiveBosses],
      payload,
      liveSnapshot: buildArchiveLiveSnapshot()
    });
    setExportStatus('Copied current assignment sheet to archive.');
  };

  React.useEffect(() => {
    if (!exportStatus) return;
    const timer = setTimeout(() => setExportStatus(''), 3000);
    return () => clearTimeout(timer);
  }, [exportStatus]);
  const activeRaiders = useMemo(() => {
    const players = selectedSignupEvent
      ? assignmentRoster
      : assignmentRoster.filter(player => player.in_raid);
    if (!selectedSignupEvent) return players;

    return players.filter(player => {
      const status = String(player.signupStatus || '').trim().toLowerCase();
      return status !== 'bench' && status !== 'absent' && status !== 'absence';
    });
  }, [assignmentRoster, selectedSignupEvent]);
  const getPlayersByClass = useCallback((cls) => activeRaiders.filter(player => getSpecById(player.spec_id)?.class === cls), [activeRaiders, getSpecById]);
  const getPlayersByClasses = useCallback((classes) => activeRaiders.filter(player => classes.includes(getSpecById(player.spec_id)?.class)), [activeRaiders, getSpecById]);
  const getPlayersBySpec = useCallback((specName) => activeRaiders.filter(player => getSpecById(player.spec_id)?.spec === specName), [activeRaiders, getSpecById]);

  const globalData = useMemo(() => {
    const baseGlobal = activeAssignmentData?.global || { tankSlots: [], healerSlots: [], soulstones: {}, sheep: [], banish: [], curses: [], judgements: {} };
    let safeSoulstones = baseGlobal.soulstones;
    if (Array.isArray(safeSoulstones)) safeSoulstones = {};
    if (!safeSoulstones) safeSoulstones = {};

    return {
      ...baseGlobal,
      tankSlots: Array.isArray(baseGlobal.tankSlots) ? [...baseGlobal.tankSlots] : [],
      healerSlots: Array.isArray(baseGlobal.healerSlots) ? [...baseGlobal.healerSlots] : [],
      soulstones: safeSoulstones,
      sheep: Array.isArray(baseGlobal.sheep) ? [...baseGlobal.sheep] : [],
      banish: Array.isArray(baseGlobal.banish) ? [...baseGlobal.banish] : [],
      curses: Array.isArray(baseGlobal.curses) ? [...baseGlobal.curses] : [],
      judgements: { ...(baseGlobal.judgements || {}) },
    };
  }, [activeAssignmentData?.global]);

  const generateId = useCallback(() => Math.random().toString(36).substr(2, 9), []);
  const getBossData = useCallback((bossName) => {
    const existing = activeAssignmentData?.[bossName];
    if (existing) return existing;

    const cached = defaultBossStatesRef.current[bossName];
    if (cached) return cached;

    const created = createDefaultBossState(bossName, generateId);
    defaultBossStatesRef.current[bossName] = created;
    return created;
  }, [generateId, activeAssignmentData]);

  const updateGlobal = useCallback((mutator) => {
    if (!isAuthenticated) return;
    setRaidAssignmentData((prev) => {
      const next = { ...(prev || {}) };
      const currentGlobal = next.global || { tankSlots: [], healerSlots: [], soulstones: {}, sheep: [], banish: [], curses: [], judgements: {} };
      next.global = {
        ...currentGlobal,
        tankSlots: Array.isArray(currentGlobal.tankSlots) ? [...currentGlobal.tankSlots] : [],
        healerSlots: Array.isArray(currentGlobal.healerSlots) ? [...currentGlobal.healerSlots] : [],
        soulstones: Array.isArray(currentGlobal.soulstones) ? {} : { ...(currentGlobal.soulstones || {}) },
        sheep: Array.isArray(currentGlobal.sheep) ? [...currentGlobal.sheep] : [],
        banish: Array.isArray(currentGlobal.banish) ? [...currentGlobal.banish] : [],
        curses: Array.isArray(currentGlobal.curses) ? [...currentGlobal.curses] : [],
        judgements: { ...(currentGlobal.judgements || {}) },
      };
      mutator(next.global);
      return next;
    });
  }, [isAuthenticated, setRaidAssignmentData]);

  const tankPlayers = useMemo(() => activeRaiders.filter(player => ['Prot Warrior', 'Prot Paladin', 'Feral (Tank)'].includes(getSpecById(player.spec_id)?.spec)), [activeRaiders, getSpecById]);
  const healerPlayers = useMemo(() => activeRaiders.filter(player => ['Holy Paladin', 'Resto Shaman', 'Resto Druid', 'Holy Priest', 'Discipline Priest'].includes(getSpecById(player.spec_id)?.spec)), [activeRaiders, getSpecById]);

  const autoFillSlots = useCallback((slotKey, players) => {
    updateGlobal(global => {
      const slots = Array.isArray(global[slotKey]) ? [...global[slotKey]] : [];
      const assignedNames = new Set(slots.map(slot => slot.playerName).filter(Boolean));
      const availablePlayers = players.filter(player => !assignedNames.has(player.name));
      let playerIndex = 0;

      slots.forEach(slot => {
        if (!slot.playerName && availablePlayers[playerIndex]) {
          slot.playerName = availablePlayers[playerIndex].name;
          playerIndex += 1;
        }
      });

      while (playerIndex < availablePlayers.length) {
        slots.push({ id: generateId(), playerName: availablePlayers[playerIndex].name });
        playerIndex += 1;
      }

      global[slotKey] = slots;
    });
  }, [generateId, updateGlobal]);

  const autoFillGlobalRows = useCallback((key, players, mode) => {
    updateGlobal(global => {
      const rows = Array.isArray(global[key]) ? [...global[key]] : [];
      const assigned = new Set(rows.map(row => row.casterName).filter(Boolean));
      const available = players.filter(player => !assigned.has(player.name));
      let playerIndex = 0;

      rows.forEach(row => {
        if (!row.casterName && available[playerIndex]) {
          row.casterName = available[playerIndex].name;
          playerIndex += 1;
        }
      });
      while (playerIndex < available.length) {
        rows.push(mode === 'curse'
          ? { id: generateId(), casterName: available[playerIndex].name, curseType: '' }
          : { id: generateId(), casterName: available[playerIndex].name, markerId: null });
        playerIndex += 1;
      }
      global[key] = rows;
    });
  }, [generateId, updateGlobal]);

  const handleNuclearWipe = () => {
    if (!isAuthenticated) return;
    if (window.confirm("☢️ WARNING: This will permanently wipe ALL global assignments and ALL boss tactics. Are you absolutely sure?")) {
      setRaidAssignmentData({});
    }
  };

  const handleClearBoss = useCallback((bossName) => {
    if (!isAuthenticated) return;
    if (window.confirm(`Are you sure you want to delete all tactics and assignments for ${bossName}?`)) {
      setRaidAssignmentData((prev) => {
        const next = { ...(prev || {}) };
        delete next[bossName];
        return next;
      });
    }
  }, [isAuthenticated, setRaidAssignmentData]);

  const updateBoss = useCallback((boss, mutator) => {
    if (!isAuthenticated) return;
    setRaidAssignmentData((prev) => {
      const next = { ...(prev || {}) };
      const currentBoss = normalizeBossState(next[boss] || createDefaultBossState(boss, generateId), generateId);
      next[boss] = JSON.parse(JSON.stringify(currentBoss));
      mutator(next[boss]);
      next[boss] = normalizeBossState(next[boss], generateId);
      return next;
    });
  }, [generateId, isAuthenticated, setRaidAssignmentData]);

  const autoFillAllSelectedBosses = useCallback(() => {
    if (!isAuthenticated || !isEditMode) return;
    const druidPlayers = getPlayersByClass('Druid');

    autoFillSlots('tankSlots', tankPlayers);
    autoFillSlots('healerSlots', healerPlayers);
    updateGlobal(global => {
      if (!global.judgements) global.judgements = {};
      getPlayersByClass('Paladin').forEach(player => {
        if (!global.judgements[player.name]) global.judgements[player.name] = JUDGEMENT_TYPES[0] || '';
      });
    });
    autoFillGlobalRows('sheep', getPlayersByClasses(['Mage']), 'marker');
    autoFillGlobalRows('banish', getPlayersByClasses(['Warlock']), 'marker');
    autoFillGlobalRows('curses', getPlayersByClasses(['Warlock']), 'curse');

    visibleBosses.forEach(boss => updateBoss(boss, bossState => {
      bossState.phases = (Array.isArray(bossState.phases) ? bossState.phases : []).map(phase => {
        const nextPhase = { ...phase };
        const tankAssignments = Array.isArray(nextPhase.tankAssignments) ? [...nextPhase.tankAssignments] : [];
        const assignedTanks = new Set(tankAssignments.map(item => item.tankSlotId).filter(Boolean));
        const availableTanks = globalData.tankSlots.filter(slot => !assignedTanks.has(slot.id));
        let tankIndex = 0;
        tankAssignments.forEach(item => {
          if (!item.tankSlotId && availableTanks[tankIndex]) {
            item.tankSlotId = availableTanks[tankIndex].id;
            item.targetId = item.targetId || BOSS_TARGET_ID;
            tankIndex += 1;
          }
        });
        nextPhase.tankAssignments = [
          ...tankAssignments,
          ...availableTanks.slice(tankIndex).map(slot => ({ id: generateId(), tankSlotId: slot.id, targetId: BOSS_TARGET_ID }))
        ];

        const healerAssignments = Array.isArray(nextPhase.healerAssignments) ? [...nextPhase.healerAssignments] : [];
        const assignedHealers = new Set(healerAssignments.map(item => item.healerSlotId).filter(Boolean));
        const availableHealers = globalData.healerSlots.filter(slot => !assignedHealers.has(slot.id));
        let healerIndex = 0;
        healerAssignments.forEach(item => {
          if (!item.healerSlotId && availableHealers[healerIndex]) {
            item.healerSlotId = availableHealers[healerIndex].id;
            item.target = item.target || RAID_WIDE_LABEL;
            healerIndex += 1;
          }
        });
        nextPhase.healerAssignments = [
          ...healerAssignments,
          ...availableHealers.slice(healerIndex).map(slot => ({ id: generateId(), healerSlotId: slot.id, target: RAID_WIDE_LABEL }))
        ];

        const innervates = Array.isArray(nextPhase.innervates)
          ? [...nextPhase.innervates]
          : druidPlayers.map(player => ({ id: `default-innervate-${player.id}`, playerName: player.name, target: '' }));
        const assignedInnervates = new Set(innervates.map(item => item.playerName).filter(Boolean));
        druidPlayers.forEach(player => {
          if (!assignedInnervates.has(player.name)) {
            innervates.push({ id: generateId(), playerName: player.name, target: '' });
          }
        });
        nextPhase.innervates = innervates;
        return nextPhase;
      });
    }));
    setExportStatus(`Auto-filled global assignments and ${visibleBosses.length} selected boss${visibleBosses.length === 1 ? '' : 'es'} across all phases.`);
  }, [autoFillGlobalRows, autoFillSlots, generateId, getPlayersByClass, getPlayersByClasses, globalData.healerSlots, globalData.tankSlots, healerPlayers, isAuthenticated, isEditMode, tankPlayers, updateBoss, updateGlobal, visibleBosses]);

  const knownBosses = useMemo(() => new Set(raidZones.flatMap(zone => zone.bosses)), [raidZones]);
  const orderedActiveBosses = useMemo(() => visibleBosses.filter(boss => knownBosses.has(boss)), [visibleBosses, knownBosses]);
  const bossZoneMap = useMemo(() => new Map(raidZones.flatMap(zone => zone.bosses.map(boss => [boss, zone.name]))), [raidZones]);

  const filteredEnabledBosses = useMemo(() => {
    return visibleBosses.filter((boss) => knownBosses.has(boss));
  }, [visibleBosses, knownBosses]);

  // Shared receiver pool for Innervate & PI
  const manaReceivers = getPlayersByClasses(['Mage', 'Shaman', 'Druid', 'Priest', 'Warlock', 'Paladin']);

  const [showMyAssignments, setShowMyAssignments] = useState(false);

  const SECTION_LABELS = {
    interrupts: 'Interrupt', stuns: 'Stun', fears: 'Fear', banishes: 'Banish',
    purges: 'Purge', spellsteals: 'Spellsteal', innervates: 'Innervate',
    powerInfusions: 'Power Infusion', dispels: 'Dispel', curses: 'Curse',
    sheep: 'Sheep', bops: 'BoP'
  };

  const myAssignmentsSummary = React.useMemo(() => {
    if (!myPlayerName || !activeAssignmentData) return null;
    const global = activeAssignmentData.global || {};
    const tankSlots = global.tankSlots || [];
    const healerSlots = global.healerSlots || [];
    const soulstones = (Array.isArray(global.soulstones) ? {} : global.soulstones) || {};

    const result = { globalLines: [], bosses: [] };

    // Role
    const myTankSlot = tankSlots.find(s => s.playerName === myPlayerName);
    const myHealerSlot = healerSlots.find(s => s.playerName === myPlayerName);
    if (myTankSlot) result.globalLines.push({ label: 'Role', value: 'Tank' });
    if (myHealerSlot) result.globalLines.push({ label: 'Role', value: 'Healer' });

    // Soulstone
    if (soulstones[myPlayerName]) result.globalLines.push({ label: 'Soulstone', value: `→ ${soulstones[myPlayerName]}` });
    const ssGiver = Object.entries(soulstones).find(([, v]) => v === myPlayerName);
    if (ssGiver) result.globalLines.push({ label: 'Receiving Soulstone', value: `from ${ssGiver[0]}` });

    // Global CC
    ['sheep', 'banish'].forEach(cc => {
      (global[cc] || []).forEach(item => {
        if (item.casterName === myPlayerName) {
          const marker = RAID_MARKERS.find(m => m.id === item.markerId);
          result.globalLines.push({ label: cc === 'sheep' ? 'Sheep' : 'Banish', value: marker ? `${marker.glyph} ${marker.label}` : '(no marker)' });
        }
      });
    });
    (global.curses || []).forEach(item => {
      if (item.casterName === myPlayerName) {
        result.globalLines.push({ label: 'Curse', value: item.curseType || '—' });
      }
    });

    // Per boss
    orderedActiveBosses.forEach(boss => {
      const bData = activeAssignmentData[boss];
      if (!bData) return;

      const bossLines = [];

      // Hunter MD
      if (bData.hunterMDs?.[myPlayerName]) {
        const slot = tankSlots.find(s => s.id === bData.hunterMDs[myPlayerName]);
        bossLines.push({ label: 'Misdirect', value: `→ ${slot?.playerName || '?'}` });
      }
      const judgement = bData.judgements?.[myPlayerName] || global.judgements?.[myPlayerName];
      if (judgement) bossLines.push({ label: 'Judgement', value: judgement });

      // Phases
      (bData.phases || []).forEach(phase => {
        const phaseLines = [];
        const fullTargetList = [{ id: BOSS_TARGET_ID, name: boss }, ...(bData.targets || [])];

        // Tank assignment
        if (myTankSlot) {
          const ta = (phase.tankAssignments || []).find(t => t.tankSlotId === myTankSlot.id);
          if (ta) phaseLines.push({ label: 'Tank', value: `→ ${fullTargetList.find(t => t.id === ta.targetId)?.name || '?'}` });
        }
        // Healer assignment
        if (myHealerSlot) {
          const ha = (phase.healerAssignments || []).find(h => h.healerSlotId === myHealerSlot.id);
          if (ha) phaseLines.push({ label: 'Heal', value: `→ ${ha.target || '?'}` });
        }
        // Utility sections
        Object.keys(SECTION_LABELS).forEach(key => {
          (phase[key] || []).forEach(item => {
            if (item.playerName === myPlayerName) {
              phaseLines.push({ label: SECTION_LABELS[key], value: `→ ${item.target || '—'}` });
            }
            if ((key === 'innervates' || key === 'powerInfusions' || key === 'bops') && item.target === myPlayerName) {
              phaseLines.push({ label: `${SECTION_LABELS[key]} (receiving)`, value: `from ${item.playerName || '?'}` });
            }
          });
        });
        // Fear wards
        (phase.fearWards || []).forEach(fw => {
          if (fw.priestName === myPlayerName) phaseLines.push({ label: 'Fear Ward', value: `→ ${fw.targetName || '—'}` });
          if (fw.targetName === myPlayerName) phaseLines.push({ label: 'Fear Ward (receiving)', value: `from ${fw.priestName || '—'}` });
        });

        if (phaseLines.length) bossLines.push({ phase: phase.name, lines: phaseLines });
      });

      if (bossLines.length) result.bosses.push({ boss, bossLines });
    });

    return result;
  }, [myPlayerName, activeAssignmentData, orderedActiveBosses]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner">
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">Raid Assignment Sheets</h2>
          <p className="text-sm text-slate-500">Global configurations and customizable phase strategies.</p>
          {exportStatus ? <p className="mt-1 text-xs text-slate-400">{exportStatus}</p> : null}
        </div>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-4">
          <div className="flex items-center gap-3">
            {!isEditMode ? (
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                disabled={!isAuthenticated}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${isAuthenticated ? 'bg-amber-600 hover:bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                Enter Edit Mode
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onSaveChanges}
                  disabled={!hasUnsavedChanges || isSaving || !isAuthenticated}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${hasUnsavedChanges && isAuthenticated ? 'bg-amber-600 hover:bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                >
                  {isSaving ? 'Saving...' : !isAuthenticated ? 'Login to save' : hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditMode(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition bg-slate-800 hover:bg-slate-700 text-slate-100"
                >
                  Exit Edit Mode
                </button>
              </>
            )}
          </div>
          {/*
          {isAuthenticated && (
            <button onClick={handleNuclearWipe} className="text-xs font-bold text-red-500 hover:text-white hover:bg-red-600 px-3 py-2 rounded border border-red-900/50 transition">
              WIPE ALL DATA
            </button>
          )}
          */}
          {/*
          <button
            type="button"
            onClick={downloadRaidAssignmentsJson}
            className="text-xs font-bold bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-2 rounded transition"
          >
            Export JSON
          </button>
          */}
          <button
            type="button"
            onClick={copyRaidAssignmentsJson}
            className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded transition"
          >
            Copy JSON
          </button>
          {isAuthenticated && isEditMode && (
            <button
              type="button"
              onClick={autoFillAllSelectedBosses}
              disabled={visibleBosses.length === 0}
              className="px-3 py-2 rounded text-xs font-bold uppercase tracking-wider bg-cyan-700 hover:bg-cyan-600 text-white disabled:bg-slate-800 disabled:text-slate-600"
            >
              Auto-fill All
            </button>
          )}
          <select
            aria-label="Event Selector"
            title="Event Selector"
            value={selectedSignupEventId}
            onChange={event => {
              setSelectedSignupEventId(event.target.value);
              setShowSignupRoster(true);
            }}
            className="bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm"
          >
            <option value="">Select event...</option>
            {activeSignupEvents.length > 0 && (
              <optgroup label="Active events">
                {activeSignupEvents.map(event => (
                  <option key={`active-${event.id}`} value={event.id}>#{event.id} [{event.status}] {event.title}</option>
                ))}
              </optgroup>
            )}
            {archivedSignupEvents.length > 0 && (
              <optgroup label="Archived events">
                {archivedSignupEvents.map(event => (
                  <option key={`archived-${event.id}`} value={event.id}>#{event.id} [{event.status}] {event.title}</option>
                ))}
              </optgroup>
            )}
          </select>
          {isEditMode && selectedSignupEventId && (
            <button
              type="button"
              onClick={() => setShowImportPreviousModal(true)}
              disabled={!previousSignupEvent || !isAuthenticated}
              className={`px-3 py-2 rounded text-xs font-bold uppercase tracking-wider ${previousSignupEvent && isAuthenticated ? 'bg-cyan-700 hover:bg-cyan-600 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
            >
              Import Previous Raid
            </button>
          )}
          <BossSelector
            raidZones={raidZones}
            enabledBosses={enabledBosses}
            handleToggleZone={handleToggleZone}
            handleToggleBoss={handleToggleBoss}
            isAuthenticated={isAuthenticated}
            showManageBosses={showManageBosses}
            onToggleManageBosses={setShowManageBosses}
          />
        </div>
      </div>

      {showImportPreviousModal && previousSignupEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="import-previous-raid-title">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-950 shadow-2xl p-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
              <div>
                <h2 id="import-previous-raid-title" className="text-base font-bold text-cyan-300">Use Previous Raid as Baseline</h2>
                <p className="mt-1 text-xs text-slate-400">{formatSignupEventLabel(previousSignupEvent)}</p>
              </div>
              <button type="button" onClick={() => setShowImportPreviousModal(false)} className="text-slate-500 hover:text-slate-200 text-xl leading-none" aria-label="Close">✕</button>
            </div>
            <div className="py-4">
              <p className="text-xs text-slate-400 mb-3">This will copy the saved assignment sheet into the selected event. You can edit it afterward.</p>
              {previousRaidBosses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {previousRaidBosses.map(boss => <div key={boss} className="rounded border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs font-bold text-slate-200">{boss}</div>)}
                </div>
              ) : (
                <p className="text-xs text-amber-300">No matching saved bosses were found for the currently selected boss list.</p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
              <button type="button" onClick={() => setShowImportPreviousModal(false)} className="rounded bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700">Cancel</button>
              <button type="button" onClick={handleImportPreviousRaid} disabled={previousRaidBosses.length === 0} className="rounded bg-cyan-700 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600">Use as Baseline</button>
            </div>
          </div>
        </div>
      )}

      {(isEditMode || selectedSignupEvent) && (
        <SignupRosterReference
          event={selectedSignupEvent}
          entries={signupEntries}
          groups={selectedSignupEvent?.groups}
          getSpecById={getSpecById}
          isLoading={signupRosterLoading}
          error={signupRosterError}
          isOpen={showSignupRoster}
          onToggle={setShowSignupRoster}
        />
      )}

      {isAuthenticated && showManageBosses && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-inner">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Custom Boss Builder</h3>
            <div className="flex-1 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newCustomZoneName}
                onChange={e => setNewCustomZoneName(e.target.value)}
                placeholder="Raid / Zone (e.g. Black Temple)"
                className="sm:w-56 bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              />
              <input
                type="text"
                value={newCustomBossName}
                onChange={e => setNewCustomBossName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomRaidBoss?.(newCustomZoneName, newCustomBossName);
                    setNewCustomZoneName('');
                    setNewCustomBossName('');
                  }
                }}
                placeholder="Add new boss name..."
                className="flex-1 bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => {
                  handleAddCustomRaidBoss?.(newCustomZoneName, newCustomBossName);
                  setNewCustomZoneName('');
                  setNewCustomBossName('');
                }}
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded text-xs uppercase tracking-wider"
              >
                Add Boss
              </button>
            </div>
          </div>

          {customRaidGroups.length > 0 && (
            <div className="mt-3 space-y-3">
              {customRaidGroups.map(group => (
                <div key={group.zone} className="bg-slate-900/70 border border-slate-800 rounded p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-amber-400 font-bold mb-2">{group.zone}</p>
                  <div className="flex flex-wrap gap-2">
                    {(group.bosses || []).map(boss => (
                      <span key={`${group.zone}-${boss}`} className="inline-flex items-center gap-2 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-300">
                        <span>{boss}</span>
                        <button
                          onClick={() => handleRemoveCustomRaidBoss?.(group.zone, boss)}
                          className="text-red-400 hover:text-red-300 font-bold"
                          title={`Remove ${boss}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 border-t border-slate-800 pt-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selected Boss Order</h3>
            {enabledBosses.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Select bosses first, then reorder them here. This order drives both the display and export sequence.</p>
            ) : (
              <div className="space-y-2">
                {enabledBosses.map((boss, index) => (
                  <div key={boss} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
                    <span className="w-6 text-[10px] font-bold text-slate-500">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-200 truncate">{boss}</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">{bossZoneMap.get(boss) || 'Custom'}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveEnabledBoss?.(boss, -1)}
                        disabled={index === 0}
                        className={`rounded border px-2 py-1 text-[10px] font-bold ${index === 0 ? 'border-slate-800 text-slate-600 cursor-not-allowed' : 'border-slate-700 text-amber-400 hover:border-amber-500'}`}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveEnabledBoss?.(boss, 1)}
                        disabled={index === enabledBosses.length - 1}
                        className={`rounded border px-2 py-1 text-[10px] font-bold ${index === enabledBosses.length - 1 ? 'border-slate-800 text-slate-600 cursor-not-allowed' : 'border-slate-700 text-amber-400 hover:border-amber-500'}`}
                      >
                        Down
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MY ASSIGNMENTS SUMMARY PANEL */}
      {myPlayerName && (
        <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800 rounded-xl px-5 py-3">
          <span className="text-sm text-slate-400">
            Viewing as <span className="font-bold text-amber-400">{myPlayerName}</span>
          </span>
          <button
            onClick={() => setShowMyAssignments(prev => !prev)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition ${showMyAssignments ? 'bg-amber-500 border-amber-600 text-slate-950' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-500 hover:text-amber-400'}`}
          >
            {showMyAssignments ? '✕ Hide My Assignments' : '⚔ Show My Assignments'}
          </button>
        </div>
      )}

      {showMyAssignments && myAssignmentsSummary && (
        <div className="bg-slate-950 border border-amber-700/40 rounded-xl p-5 space-y-5 shadow-2xl">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest border-b border-slate-800 pb-2">
            My Assignments — {myPlayerName}
          </h3>

          {/* Global */}
          {myAssignmentsSummary.globalLines.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Raid-Wide</h4>
              <div className="flex flex-wrap gap-2">
                {myAssignmentsSummary.globalLines.map((line, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs">
                    <span className="text-slate-500 uppercase font-bold tracking-wider mr-1">{line.label}:</span>
                    <span className="text-slate-200 font-bold">{line.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per boss */}
          {myAssignmentsSummary.bosses.length === 0 && myAssignmentsSummary.globalLines.length === 0 && (
            <p className="text-sm text-slate-500 italic">No assignments found for {myPlayerName}. Make sure you are added to the roster and assignments have been set.</p>
          )}
          {myAssignmentsSummary.bosses.length === 0 && myAssignmentsSummary.globalLines.length > 0 && (
            <p className="text-sm text-slate-500 italic">No per-boss assignments found.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {myAssignmentsSummary.bosses.map(({ boss, bossLines }) => (
              <div key={boss} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-purple-400 font-serif italic">{boss}</h4>
                <div className="space-y-1.5">
                  {bossLines.map((entry, i) => {
                    if (entry.phase) {
                      return (
                        <div key={i} className="mt-2">
                          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">{entry.phase}</p>
                          {entry.lines.map((line, j) => (
                            <div key={j} className="flex items-center gap-2 text-xs pl-2">
                              <span className="text-slate-500 uppercase font-bold tracking-wider whitespace-nowrap">{line.label}:</span>
                              <span className="text-slate-200 font-bold">{line.value}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 uppercase font-bold tracking-wider whitespace-nowrap">{entry.label}:</span>
                        <span className="text-slate-200 font-bold">{entry.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GLOBAL ROSTER ASSIGNMENTS PANEL */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl shadow-xl p-5 space-y-6">
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest border-b border-slate-800 pb-2">Raid-Wide Global Setup</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* TANKS */}
          <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tanks</h4>
              {isAuthenticated && isEditMode && <div className="flex items-center gap-2"><button onClick={() => autoFillSlots('tankSlots', tankPlayers)} className="text-[10px] text-cyan-400 font-bold">Auto-fill</button><button onClick={() => updateGlobal(g => g.tankSlots.push({ id: generateId(), playerName: null }))} className="text-[10px] text-purple-400 font-bold">+ Add Slot</button></div>}
            </div>
            <div className="space-y-2">
              {globalData.tankSlots.map((slot, i) => (
                <div key={slot.id} className="flex items-center gap-2 group">
                  <span className="text-[10px] font-bold text-slate-600 w-6">T{i + 1}</span>
                  <PlayerSelect value={slot.playerName} onChange={val => updateGlobal(g => g.tankSlots.find(s => s.id === slot.id).playerName = val)} players={activeRaiders} fullRoster={assignmentRoster} getSpecById={getSpecById} disabled={!(isAuthenticated && isEditMode)} />
                  {isAuthenticated && isEditMode && <button onClick={() => updateGlobal(g => g.tankSlots = g.tankSlots.filter(s => s.id !== slot.id))} className="text-red-500 opacity-0 group-hover:opacity-100 font-bold px-1">✕</button>}
                </div>
              ))}
            </div>
          </div>

          {/* HEALERS */}
          <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Healers</h4>
              {isAuthenticated && isEditMode && <div className="flex items-center gap-2"><button onClick={() => autoFillSlots('healerSlots', healerPlayers)} className="text-[10px] text-cyan-400 font-bold">Auto-fill</button><button onClick={() => updateGlobal(g => g.healerSlots.push({ id: generateId(), playerName: null }))} className="text-[10px] text-purple-400 font-bold">+ Add Slot</button></div>}
            </div>
            <div className="space-y-2">
              {globalData.healerSlots.map((slot, i) => (
                <div key={slot.id} className="flex items-center gap-2 group">
                  <span className="text-[10px] font-bold text-slate-600 w-6">H{i + 1}</span>
                  <PlayerSelect value={slot.playerName} onChange={val => updateGlobal(g => g.healerSlots.find(s => s.id === slot.id).playerName = val)} players={getPlayersByClasses(['Druid', 'Priest', 'Shaman', 'Paladin'])} fullRoster={assignmentRoster} getSpecById={getSpecById} disabled={!(isAuthenticated && isEditMode)} />
                  {isAuthenticated && isEditMode && <button onClick={() => updateGlobal(g => g.healerSlots = g.healerSlots.filter(s => s.id !== slot.id))} className="text-red-500 opacity-0 group-hover:opacity-100 font-bold px-1">✕</button>}
                </div>
              ))}
            </div>
          </div>

          {/* SOULSTONES */}
          <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Soulstones</h4>
            </div>
            <div className="space-y-2">
              {getPlayersByClass('Warlock').length === 0 ? (
                <p className="text-xs text-slate-600 italic">No warlocks currently in raid.</p>
              ) : (
                getPlayersByClass('Warlock').map(w => {
                  const wSpec = getSpecById(w.spec_id);
                  return (
                    <div key={w.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 w-28 flex-shrink-0">
                        <SpecIcon spec={wSpec} className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold truncate" style={{ color: wSpec?.color || '#8788ee' }}>{w.name}</span>
                      </div>
                      <span className="text-slate-600 text-xs">&rarr;</span>
                      <PlayerSelect
                        value={globalData.soulstones[w.name] || null}
                        onChange={val => updateGlobal(g => {
                          if (!g.soulstones || Array.isArray(g.soulstones)) g.soulstones = {};
                          g.soulstones[w.name] = val;
                        })}
                        players={activeRaiders}
                        fullRoster={assignmentRoster}
                        getSpecById={getSpecById}
                        disabled={!(isAuthenticated && isEditMode)}
                        placeholder="— Target —"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* JUDGEMENTS */}
          <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Judgements</h4>
              {isAuthenticated && isEditMode && <button onClick={() => updateGlobal(g => {
                if (!g.judgements) g.judgements = {};
                getPlayersByClass('Paladin').forEach(player => {
                  if (!g.judgements[player.name]) g.judgements[player.name] = JUDGEMENT_TYPES[0] || '';
                });
              })} className="text-[10px] text-cyan-400 font-bold">Auto-fill</button>}
            </div>
            <div className="space-y-2">
              {getPlayersByClass('Paladin').map(player => {
                const playerSpec = getSpecById(player.spec_id);
                return (
                  <div key={player.id} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 w-28 min-w-0">
                      <SpecIcon spec={playerSpec} className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold truncate" style={{ color: playerSpec?.color || '#f58cba' }}>{player.name}</span>
                    </div>
                    {isAuthenticated && isEditMode ? (
                      <select className="flex-1 min-w-0 bg-slate-950 text-white border border-slate-700 rounded px-1.5 py-1 text-xs focus:outline-none" value={globalData.judgements[player.name] || ''} onChange={e => updateGlobal(g => {
                        if (!g.judgements) g.judgements = {};
                        if (e.target.value) g.judgements[player.name] = e.target.value;
                        else delete g.judgements[player.name];
                      })}>
                        <option value="">— Judgement —</option>
                        {JUDGEMENT_TYPES.map(judgement => <option key={judgement} value={judgement}>{judgement}</option>)}
                      </select>
                    ) : <span className="text-xs font-bold text-slate-300 truncate">{globalData.judgements[player.name] || '—'}</span>}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* GLOBAL CONTROL CC BLOCKS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-2">
          {[
            { key: 'sheep', title: 'Raid CC: sheep', casterClasses: ['Mage'], mode: 'marker' },
            { key: 'banish', title: 'Raid CC: banish', casterClasses: ['Warlock'], mode: 'marker' },
            { key: 'curses', title: 'Raid Curses', casterClasses: ['Warlock'], mode: 'curse' }
          ].map(config => {
            const rows = Array.isArray(globalData[config.key]) ? globalData[config.key] : [];
            return (
              <div key={config.key} className="bg-slate-900/40 p-4 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{config.title}</h4>
                  {isAuthenticated && isEditMode && <div className="flex items-center gap-2"><button onClick={() => autoFillGlobalRows(config.key, getPlayersByClasses(config.casterClasses), config.mode)} className="text-[10px] text-cyan-400 font-bold">Auto-fill</button><button onClick={() => updateGlobal(g => {
                    if (!Array.isArray(g[config.key])) g[config.key] = [];
                    g[config.key].push(config.mode === 'curse'
                      ? { id: generateId(), casterName: null, curseType: '' }
                      : { id: generateId(), casterName: null, markerId: null });
                  })} className="text-[10px] text-purple-400 font-bold">+ Add</button></div>}
                </div>
                <div className="space-y-2">
                  {rows.map(item => (
                    <div key={item.id} className="flex items-center gap-2 group">
                      <div className="flex-1 min-w-0">
                        <PlayerSelect value={item.casterName} onChange={val => updateGlobal(g => g[config.key].find(x => x.id === item.id).casterName = val)} players={getPlayersByClasses(config.casterClasses)} fullRoster={assignmentRoster} getSpecById={getSpecById} disabled={!(isAuthenticated && isEditMode)} placeholder="— Caster —" />
                      </div>
                      <span className="text-slate-600 text-xs">&rarr;</span>
                      {config.mode === 'curse' ? (
                        isAuthenticated && isEditMode ? (
                          <select className="w-32 bg-slate-950 text-white border border-slate-700 rounded px-1.5 py-1 text-xs focus:outline-none" value={item.curseType || ''} onChange={e => updateGlobal(g => g[config.key].find(x => x.id === item.id).curseType = e.target.value)}>
                            <option value="">— Curse —</option>
                            {CURSE_TYPES.map(curse => <option key={curse} value={curse}>{curse}</option>)}
                          </select>
                        ) : (
                          <span className="w-32 text-xs font-bold text-slate-300 truncate text-right">{item.curseType || '—'}</span>
                        )
                      ) : (
                        <div className="w-28 flex justify-end flex-shrink-0">
                          {isAuthenticated && isEditMode ? (
                            <MarkerSelect value={item.markerId} onChange={val => updateGlobal(g => g[config.key].find(x => x.id === item.id).markerId = val)} disabled={false} />
                          ) : (
                            <MarkerBadge markerId={item.markerId} />
                          )}
                        </div>
                      )}
                      {isAuthenticated && isEditMode && <button onClick={() => updateGlobal(g => g[config.key] = g[config.key].filter(x => x.id !== item.id))} className="text-red-500 opacity-0 group-hover:opacity-100 font-bold px-1">✕</button>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DYNAMIC LIST OF ENCOUNTERS COMPONENT SHEETS */}
      {orderedActiveBosses.length === 0 ? (
        <div className="text-center py-20 bg-slate-950/40 border-2 border-dashed border-slate-800 rounded-xl">
          <p className="text-slate-500 font-medium">No encounters selected. Choose bosses via the dropdown toggle menu.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orderedActiveBosses.map(boss => {
            const bossData = getBossData(boss);
            return (
              <RaidAssignmentsBossCard
                key={boss}
                boss={boss}
                bData={bossData}
                globalData={globalData}
                roster={assignmentRoster}
                getSpecById={getSpecById}
                getPlayersByClass={getPlayersByClass}
                getPlayersByClasses={getPlayersByClasses}
                getPlayersBySpec={getPlayersBySpec}
                activeRaiders={activeRaiders}
                manaReceivers={manaReceivers}
                isAuthenticated={isAuthenticated}
                isEditMode={isEditMode}
                updateBoss={updateBoss}
                handleClearBoss={handleClearBoss}
                generateId={generateId}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});

export default RaidAssignmentsTab;