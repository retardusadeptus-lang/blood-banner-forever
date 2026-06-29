import React, { useState } from 'react';
import {
  CURSE_TYPES, JUDGEMENT_TYPES,
  RAID_GROUPS, RAID_WIDE_LABEL, BOSS_TARGET_ID, RAID_MARKERS
} from '../constants';

// --- HELPER COMPONENTS ---

function SpecIcon({ spec, className = "w-4 h-4" }) {
  if (!spec) return null;
  const iconUrl = spec.icon_small || spec.icon_large || spec.icon || 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg';
  return <img src={iconUrl} alt={spec.spec || 'spec'} className={`${className} rounded-sm border border-slate-700 object-cover shrink-0`} />;
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
              {p.name}
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

// --- MAIN CONTAINER COMPONENT ---
export default function RaidAssignmentsTab({
  isAuthenticated, roster, getSpecById, enabledBosses = [], raidZones = [], handleToggleZone, handleToggleBoss, customRaidGroups = [], handleAddCustomRaidBoss, handleRemoveCustomRaidBoss, raidAssignmentData, setRaidAssignmentData,
  hasUnsavedChanges, onSaveChanges, isSaving, myPlayerName
}) {
  const [showManageBosses, setShowManageBosses] = useState(false);
  const [newCustomZoneName, setNewCustomZoneName] = useState('');
  const [newCustomBossName, setNewCustomBossName] = useState('');
  const activeRaiders = roster.filter(p => p.in_raid);
  const getPlayersByClass = (cls) => activeRaiders.filter(p => getSpecById(p.spec_id)?.class === cls);
  const getPlayersByClasses = (classes) => activeRaiders.filter(p => classes.includes(getSpecById(p.spec_id)?.class));
  const getPlayersBySpec = (specName) => activeRaiders.filter(p => getSpecById(p.spec_id)?.spec === specName);

  const globalData = raidAssignmentData?.global || { tankSlots: [], healerSlots: [], sheep: [], banish: [] };

  let safeSoulstones = globalData.soulstones;
  if (Array.isArray(safeSoulstones)) safeSoulstones = {};
  if (!safeSoulstones) safeSoulstones = {};

  const updateGlobal = (mutator) => {
    if (!isAuthenticated) return;
    const next = JSON.parse(JSON.stringify(raidAssignmentData || {}));
    if (!next.global) next.global = { tankSlots: [], healerSlots: [], soulstones: {}, sheep: [], banish: [] };
    if (Array.isArray(next.global.soulstones)) next.global.soulstones = {};
    mutator(next.global);
    setRaidAssignmentData(next);
  };

  const handleNuclearWipe = () => {
    if (!isAuthenticated) return;
    if (window.confirm("☢️ WARNING: This will permanently wipe ALL global assignments and ALL boss tactics. Are you absolutely sure?")) {
      setRaidAssignmentData({});
    }
  };

  const handleClearBoss = (bossName) => {
    if (!isAuthenticated) return;
    if (window.confirm(`Are you sure you want to delete all tactics and assignments for ${bossName}?`)) {
      const next = JSON.parse(JSON.stringify(raidAssignmentData || {}));
      delete next[bossName]; // This completely removes the boss from the JSON
      setRaidAssignmentData(next);
    }
  };

  const updateBoss = (boss, mutator) => {
    if (!isAuthenticated) return;
    const next = JSON.parse(JSON.stringify(raidAssignmentData || {}));
    if (!next[boss]) next[boss] = { targets: [], phases: [], hunterMDs: {}, curses: {}, judgements: {}, fearWards: [], imageUrl: '', bloodlustAt: '' };
    mutator(next[boss]);
    setRaidAssignmentData(next);
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);
  const orderedActiveBosses = raidZones.flatMap(z => z.bosses.filter(b => enabledBosses.includes(b)));

  // Shared receiver pool for Innervate & PI
  const manaReceivers = getPlayersByClasses(['Mage', 'Shaman', 'Druid', 'Priest', 'Warlock', 'Paladin']);

  const [showMyAssignments, setShowMyAssignments] = useState(false);

  const SECTION_LABELS = {
    interrupts: 'Interrupt', stuns: 'Stun', fears: 'Fear', banishes: 'Banish',
    purges: 'Purge', spellsteals: 'Spellsteal', innervates: 'Innervate',
    powerInfusions: 'Power Infusion', dispels: 'Dispel'
  };

  const myAssignmentsSummary = React.useMemo(() => {
    if (!myPlayerName || !raidAssignmentData) return null;
    const global = raidAssignmentData.global || {};
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

    // Per boss
    orderedActiveBosses.forEach(boss => {
      const bData = raidAssignmentData[boss];
      if (!bData) return;

      const bossLines = [];

      // Hunter MD
      if (bData.hunterMDs?.[myPlayerName]) {
        const slot = tankSlots.find(s => s.id === bData.hunterMDs[myPlayerName]);
        bossLines.push({ label: 'Misdirect', value: `→ ${slot?.playerName || '?'}` });
      }
      // Curse / Judgement
      if (bData.curses?.[myPlayerName]) bossLines.push({ label: 'Curse', value: bData.curses[myPlayerName] });
      if (bData.judgements?.[myPlayerName]) bossLines.push({ label: 'Judgement', value: bData.judgements[myPlayerName] });

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
            if ((key === 'innervates' || key === 'powerInfusions') && item.target === myPlayerName) {
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
  }, [myPlayerName, raidAssignmentData, orderedActiveBosses]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner">
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">Raid Assignment Sheets</h2>
          <p className="text-sm text-slate-500">Global configurations and customizable phase strategies.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onSaveChanges}
            disabled={!hasUnsavedChanges || isSaving}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${hasUnsavedChanges ? 'bg-amber-600 hover:bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
          >
            {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
          </button>
          {isAuthenticated && (
            <button onClick={handleNuclearWipe} className="text-xs font-bold text-red-500 hover:text-white hover:bg-red-600 px-3 py-2 rounded border border-red-900/50 transition">
              WIPE ALL DATA
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
              {isAuthenticated && <button onClick={() => updateGlobal(g => g.tankSlots.push({ id: generateId(), playerName: null }))} className="text-[10px] text-purple-400 font-bold">+ Add Slot</button>}
            </div>
            <div className="space-y-2">
              {globalData.tankSlots.map((slot, i) => (
                <div key={slot.id} className="flex items-center gap-2 group">
                  <span className="text-[10px] font-bold text-slate-600 w-6">T{i + 1}</span>
                  <PlayerSelect value={slot.playerName} onChange={val => updateGlobal(g => g.tankSlots.find(s => s.id === slot.id).playerName = val)} players={activeRaiders} fullRoster={roster} getSpecById={getSpecById} disabled={!isAuthenticated} />
                  {isAuthenticated && <button onClick={() => updateGlobal(g => g.tankSlots = g.tankSlots.filter(s => s.id !== slot.id))} className="text-red-500 opacity-0 group-hover:opacity-100 font-bold px-1">✕</button>}
                </div>
              ))}
            </div>
          </div>

          {/* HEALERS */}
          <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Healers</h4>
              {isAuthenticated && <button onClick={() => updateGlobal(g => g.healerSlots.push({ id: generateId(), playerName: null }))} className="text-[10px] text-purple-400 font-bold">+ Add Slot</button>}
            </div>
            <div className="space-y-2">
              {globalData.healerSlots.map((slot, i) => (
                <div key={slot.id} className="flex items-center gap-2 group">
                  <span className="text-[10px] font-bold text-slate-600 w-6">H{i + 1}</span>
                  <PlayerSelect value={slot.playerName} onChange={val => updateGlobal(g => g.healerSlots.find(s => s.id === slot.id).playerName = val)} players={getPlayersByClasses(['Druid', 'Priest', 'Shaman', 'Paladin'])} fullRoster={roster} getSpecById={getSpecById} disabled={!isAuthenticated} />
                  {isAuthenticated && <button onClick={() => updateGlobal(g => g.healerSlots = g.healerSlots.filter(s => s.id !== slot.id))} className="text-red-500 opacity-0 group-hover:opacity-100 font-bold px-1">✕</button>}
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
                        value={safeSoulstones[w.name] || null}
                        onChange={val => updateGlobal(g => {
                          if (!g.soulstones || Array.isArray(g.soulstones)) g.soulstones = {};
                          g.soulstones[w.name] = val;
                        })}
                        players={activeRaiders}
                        fullRoster={roster}
                        getSpecById={getSpecById}
                        disabled={!isAuthenticated}
                        placeholder="— Target —"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* GLOBAL CONTROL CC BLOCKS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {['sheep', 'banish'].map(cc => {
            const rows = Array.isArray(globalData[cc]) ? globalData[cc] : [];
            return (
              <div key={cc} className="bg-slate-900/40 p-4 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Raid CC: {cc}</h4>
                  {isAuthenticated && <button onClick={() => updateGlobal(g => { if (!Array.isArray(g[cc])) g[cc] = []; g[cc].push({ id: generateId(), casterName: null, markerId: null }); })} className="text-[10px] text-purple-400 font-bold">+ Add</button>}
                </div>
                <div className="space-y-2">
                  {rows.map(item => (
                    <div key={item.id} className="flex items-center gap-2 group">
                      <div className="flex-1 min-w-0">
                        <PlayerSelect value={item.casterName} onChange={val => updateGlobal(g => g[cc].find(x => x.id === item.id).casterName = val)} players={getPlayersByClasses(cc === 'sheep' ? ['Mage'] : ['Warlock'])} fullRoster={roster} getSpecById={getSpecById} disabled={!isAuthenticated} placeholder="— Caster —" />
                      </div>
                      <span className="text-slate-600 text-xs">&rarr;</span>
                      <div className="w-28 flex justify-end flex-shrink-0">
                        {isAuthenticated ? (
                          <MarkerSelect value={item.markerId} onChange={val => updateGlobal(g => g[cc].find(x => x.id === item.id).markerId = val)} disabled={!isAuthenticated} />
                        ) : (
                          <MarkerBadge markerId={item.markerId} />
                        )}
                      </div>
                      {isAuthenticated && <button onClick={() => updateGlobal(g => g[cc] = g[cc].filter(x => x.id !== item.id))} className="text-red-500 opacity-0 group-hover:opacity-100 font-bold px-1">✕</button>}
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
            const bData = raidAssignmentData?.[boss] || { targets: [], phases: [], hunterMDs: {}, curses: {}, judgements: {}, fearWards: [], imageUrl: '', bloodlustAt: '' };
            const fullTargetList = [{ id: BOSS_TARGET_ID, name: boss }, ...(bData.targets || [])];

            // Enrich the slot options with actual player spec and color data for the UI
            const plainTanks = globalData.tankSlots.map((s, i) => {
              const p = roster.find(player => player.name === s.playerName);
              const spec = p ? getSpecById(p.spec_id) : null;
              return { id: s.id, name: p?.name || `Tank ${i + 1}`, spec, color: spec?.color };
            });
            const plainHealers = globalData.healerSlots.map((s, i) => {
              const p = roster.find(player => player.name === s.playerName);
              const spec = p ? getSpecById(p.spec_id) : null;
              return { id: s.id, name: p?.name || `Healer ${i + 1}`, spec, color: spec?.color };
            });

            return (
              <div key={boss} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-5 space-y-6">

                {/* BOSS HEADER */}
                <div className="border-b border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-baseline gap-4">
                    <h3 className="text-xl font-bold text-purple-400 font-serif italic tracking-wide">{boss}</h3>
                    {isAuthenticated && (
                      <button onClick={() => handleClearBoss(boss)} className="text-[10px] font-bold text-red-500 uppercase hover:underline">
                        Reset Boss
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bloodlust:</span>
                    {isAuthenticated ? (
                      <input type="text" className="bg-slate-950 border border-slate-700 text-xs rounded px-2 py-1 text-red-400 font-bold focus:outline-none w-48" placeholder="Pull, 20% phase 3..." value={bData.bloodlustAt || ''} onChange={e => updateBoss(boss, b => b.bloodlustAt = e.target.value)} />
                    ) : <span className="text-xs text-red-400 font-bold">{bData.bloodlustAt || '—'}</span>}
                  </div>
                </div>

                {/* DYNAMIC SYNCED CLASS GRID LIST COLS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Hunters */}
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
                            <SlotSelect disabled={!isAuthenticated} value={bData.hunterMDs?.[h.name] || ''} onChange={val => updateBoss(boss, b => { if (!b.hunterMDs) b.hunterMDs = {}; b.hunterMDs[h.name] = val; })} options={plainTanks} placeholder="— Tank —" />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Paladins */}
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
                            {isAuthenticated ? (
                              <select className="flex-1 bg-slate-950 text-white border border-slate-700 rounded px-1.5 py-1 text-xs focus:outline-none" value={bData.judgements?.[p.name] || ''} onChange={e => updateBoss(boss, b => { if (!b.judgements) b.judgements = {}; b.judgements[p.name] = e.target.value; })}>
                                <option value="">— Judgement —</option>
                                {JUDGEMENT_TYPES.map(j => <option key={j} value={j}>{j}</option>)}
                              </select>
                            ) : (
                              <span className="text-xs font-bold text-slate-300 flex-1 truncate">{bData.judgements?.[p.name] || '—'}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Warlocks */}
                  <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-800">
                    <h5 className="text-xs font-bold text-[#8788ee] uppercase tracking-widest mb-3 border-b border-slate-800 pb-1">Warlocks (Curses)</h5>
                    <div className="space-y-2">
                      {getPlayersByClass('Warlock').map(w => {
                        const wSpec = getSpecById(w.spec_id);
                        return (
                          <div key={w.id} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 w-24 flex-shrink-0">
                              <SpecIcon spec={wSpec} className="w-3.5 h-3.5" />
                              <span className="text-xs font-bold truncate" style={{ color: wSpec?.color || '#8788ee' }}>{w.name}</span>
                            </div>
                            {isAuthenticated ? (
                              <select className="flex-1 bg-slate-950 text-white border border-slate-700 rounded px-1.5 py-1 text-xs focus:outline-none" value={bData.curses?.[w.name] || ''} onChange={e => updateBoss(boss, b => { if (!b.curses) b.curses = {}; b.curses[w.name] = e.target.value; })}>
                                <option value="">— Curse —</option>
                                {CURSE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            ) : (
                              <span className="text-xs font-bold text-slate-300 flex-1 truncate">{bData.curses?.[w.name] || '—'}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* MOB INJECTION MECHANICS BLOCK */}
                <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Encounter Targets</h4>
                    {isAuthenticated && <button onClick={() => updateBoss(boss, b => b.targets.push({ id: generateId(), name: 'Spawned Add Name', markerId: null }))} className="text-[10px] text-purple-400 font-bold">+ Add Target Mob</button>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-xs font-bold text-slate-300 flex-1">{boss} (Primary Boss)</span>
                      <div className="w-28 flex justify-end flex-shrink-0">
                        {isAuthenticated ? (
                          <MarkerSelect value={bData.bossMarkerId} onChange={val => updateBoss(boss, b => b.bossMarkerId = val)} />
                        ) : (
                          <MarkerBadge markerId={bData.bossMarkerId} />
                        )}
                      </div>
                    </div>
                    {bData.targets?.map(mob => (
                      <div key={mob.id} className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800 group">
                        {isAuthenticated ? <input type="text" className="flex-1 bg-slate-900 text-white border border-slate-700 rounded px-2 py-1 text-xs focus:outline-none" value={mob.name} onChange={e => updateBoss(boss, b => b.targets.find(t => t.id === mob.id).name = e.target.value)} /> : <span className="text-xs font-bold text-slate-300 flex-1 truncate">{mob.name}</span>}
                        <div className="w-28 flex justify-end flex-shrink-0">
                          {isAuthenticated ? (
                            <MarkerSelect value={mob.markerId} onChange={val => updateBoss(boss, b => b.targets.find(t => t.id === mob.id).markerId = val)} />
                          ) : (
                            <MarkerBadge markerId={mob.markerId} />
                          )}
                        </div>
                        {isAuthenticated && <button onClick={() => updateBoss(boss, b => b.targets = b.targets.filter(t => t.id !== mob.id))} className="text-red-500 font-bold px-1">✕</button>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* PHASE COMPONENT MANAGER LAYOUT GRID */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Encounter Phases</h4>
                    {isAuthenticated && <button onClick={() => updateBoss(boss, b => b.phases.push({
                      id: generateId(),
                      name: `Phase ${b.phases.length + 1}`,
                      enabledBlocks: ['tanks', 'healers'],
                      tankAssignments: globalData.tankSlots.map(t => ({ id: generateId(), tankSlotId: t.id, targetId: BOSS_TARGET_ID })),
                      healerAssignments: globalData.healerSlots.map(h => ({ id: generateId(), healerSlotId: h.id, target: RAID_WIDE_LABEL }))
                    }))} className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded shadow">+ New Phase</button>}
                  </div>

                  {bData.phases?.map(phase => {
                    const activeBlocks = phase.enabledBlocks || ['tanks', 'healers'];

                    const utilityConfigs = [
                      { key: 'interrupts', title: 'Interrupts', casters: activeRaiders, targetType: 'combo' },
                      { key: 'stuns', title: 'Stuns', casters: getPlayersByClasses(['Warrior', 'Paladin', 'Rogue', 'Hunter']), targetType: 'combo' },
                      { key: 'fears', title: 'Fears', casters: getPlayersByClasses(['Warlock', 'Priest', 'Hunter']), targetType: 'combo' },
                      { key: 'banishes', title: 'Banishes', casters: getPlayersByClasses(['Warlock']), targetType: 'combo' },
                      { key: 'purges', title: 'Purges', casters: getPlayersByClasses(['Priest', 'Shaman', 'Hunter', 'Warlock']), targetType: 'combo' },
                      { key: 'spellsteals', title: 'Spellsteals', casters: getPlayersByClasses(['Mage']), targetType: 'combo' },
                      { key: 'innervates', title: 'Innervates', casters: getPlayersByClasses(['Druid']), targetType: 'player' },
                      { key: 'dispels', title: 'Dispels / Decurses', casters: getPlayersByClasses(['Paladin', 'Priest', 'Shaman', 'Mage', 'Druid']), targetType: 'text' },
                      { key: 'powerInfusions', title: 'Power Infusions', casters: getPlayersBySpec('Discipline Priest'), targetType: 'player' }
                    ];

                    return (
                      <div key={phase.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-800/60 pb-2 flex-wrap gap-3">
                          {isAuthenticated ? <input type="text" className="bg-transparent text-amber-400 font-bold text-base focus:outline-none border-b border-slate-700 w-48" value={phase.name} onChange={e => updateBoss(boss, b => b.phases.find(p => p.id === phase.id).name = e.target.value)} /> : <h5 className="text-amber-400 font-bold text-base">{phase.name}</h5>}

                          {/* DYNAMIC SECTION INJECTOR PANEL BUTTONS */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {isAuthenticated && (
                              <select className="bg-slate-950 text-purple-400 border border-slate-700 rounded px-2 py-1 text-xs font-semibold focus:outline-none" value="" onChange={e => {
                                const sectionType = e.target.value;
                                if (!sectionType) return;
                                updateBoss(boss, b => {
                                  const targetPhase = b.phases.find(p => p.id === phase.id);
                                  if (!targetPhase.enabledBlocks) targetPhase.enabledBlocks = ['tanks', 'healers'];
                                  if (!targetPhase.enabledBlocks.includes(sectionType)) {
                                    targetPhase.enabledBlocks.push(sectionType);
                                    if (!targetPhase[sectionType]) targetPhase[sectionType] = [];
                                  }
                                });
                                e.target.value = "";
                              }}>
                                <option value="">+ Insert Module...</option>
                                <option value="interrupts">Interrupts</option>
                                <option value="stuns">Stuns</option>
                                <option value="fears">Fears</option>
                                <option value="banishes">Banishes</option>
                                <option value="purges">Purges</option>
                                <option value="spellsteals">Spellsteals</option>
                                <option value="fearWards">Fear Wards</option>
                                <option value="innervates">Innervates</option>
                                <option value="dispels">Dispels / Decurses</option>
                                <option value="powerInfusions">Power Infusions</option>
                                <option value="notes">Phase Notes</option>
                              </select>
                            )}
                            {isAuthenticated && <button onClick={() => updateBoss(boss, b => b.phases = b.phases.filter(p => p.id !== phase.id))} className="text-[10px] font-bold text-red-500 uppercase px-2 py-1 hover:bg-red-950/20 rounded">Delete Phase</button>}
                          </div>
                        </div>

                        {/* MASTER GRID GENERATOR RENDER */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">

                          {/* CORE TANKS BLOCK */}
                          {activeBlocks.includes('tanks') && (
                            <SectionWrapper title="Tank Targets" isAuthenticated={isAuthenticated} onAdd={() => updateBoss(boss, b => { const p = b.phases.find(x => x.id === phase.id); if (!p.tankAssignments) p.tankAssignments = []; p.tankAssignments.push({ id: generateId(), tankSlotId: '', targetId: BOSS_TARGET_ID }); })} hasItems={phase.tankAssignments?.length > 0} emptyText="No targets tanked yet.">
                              {phase.tankAssignments?.map(ta => (
                                <div key={ta.id} className="flex items-center gap-1">
                                  <SlotSelect disabled={!isAuthenticated} value={ta.tankSlotId || ''} onChange={val => updateBoss(boss, b => b.phases.find(p => p.id === phase.id).tankAssignments.find(t => t.id === ta.id).tankSlotId = val)} options={plainTanks} placeholder="— Tank —" />
                                  <span className="text-slate-600 text-xs">&rarr;</span>
                                  {isAuthenticated ? (
                                    <select className="flex-1 min-w-0 bg-slate-950 text-white border border-slate-700 rounded px-1.5 py-1 text-xs focus:outline-none" value={ta.targetId || ''} onChange={e => updateBoss(boss, b => b.phases.find(p => p.id === phase.id).tankAssignments.find(t => t.id === ta.id).targetId = e.target.value)}>
                                      <option value="">— Target —</option>
                                      {fullTargetList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                  ) : (
                                    <span className="text-xs font-bold text-slate-300 flex-1 min-w-0 truncate">
                                      {fullTargetList.find(t => t.id === ta.targetId)?.name || 'Unassigned'}
                                    </span>
                                  )}
                                  {isAuthenticated && <button onClick={() => updateBoss(boss, b => { const p = b.phases.find(x => x.id === phase.id); p.tankAssignments = p.tankAssignments.filter(t => t.id !== ta.id); })} className="text-red-500 font-bold px-0.5">✕</button>}
                                </div>
                              ))}
                            </SectionWrapper>
                          )}

                          {/* CORE HEALERS BLOCK */}
                          {activeBlocks.includes('healers') && (
                            <SectionWrapper title="Healer Targets" isAuthenticated={isAuthenticated} onAdd={() => updateBoss(boss, b => { const p = b.phases.find(x => x.id === phase.id); if (!p.healerAssignments) p.healerAssignments = []; p.healerAssignments.push({ id: generateId(), healerSlotId: '', target: RAID_WIDE_LABEL }); })} hasItems={phase.healerAssignments?.length > 0} emptyText="No assigned triage targets.">
                              {phase.healerAssignments?.map(ha => (
                                <div key={ha.id} className="flex items-center gap-1">
                                  <SlotSelect disabled={!isAuthenticated} value={ha.healerSlotId || ''} onChange={val => updateBoss(boss, b => b.phases.find(p => p.id === phase.id).healerAssignments.find(h => h.id === ha.id).healerSlotId = val)} options={plainHealers} placeholder="— Healer —" />
                                  <span className="text-slate-600 text-xs">&rarr;</span>
                                  <ComboSelect disabled={!isAuthenticated} value={ha.target} onChange={val => updateBoss(boss, b => b.phases.find(p => p.id === phase.id).healerAssignments.find(h => h.id === ha.id).target = val)} options={[...plainTanks.map(t => t.name), RAID_WIDE_LABEL, ...RAID_GROUPS]} />
                                  {isAuthenticated && <button onClick={() => updateBoss(boss, b => { const p = b.phases.find(x => x.id === phase.id); p.healerAssignments = p.healerAssignments.filter(h => h.id !== ha.id); })} className="text-red-500 font-bold px-0.5">✕</button>}
                                </div>
                              ))}
                            </SectionWrapper>
                          )}

                          {/* DYNAMIC UTILITY ARRAY BLOCKS (INTERRUPTS, STUNS, PURGES, ETC) */}
                          {utilityConfigs.map(cfg => {
                            if (!activeBlocks.includes(cfg.key)) return null;
                            const rows = phase[cfg.key] || [];
                            return (
                              <SectionWrapper key={cfg.key} title={cfg.title} isAuthenticated={isAuthenticated} onAdd={() => updateBoss(boss, b => { const p = b.phases.find(x => x.id === phase.id); if (!p[cfg.key]) p[cfg.key] = []; p[cfg.key].push({ id: generateId(), playerName: null, target: '' }); })} onRemoveSection={() => updateBoss(boss, b => { const p = b.phases.find(x => x.id === phase.id); p.enabledBlocks = p.enabledBlocks.filter(k => k !== cfg.key); delete p[cfg.key]; })} hasItems={rows.length > 0} emptyText="No active assignments.">
                                {rows.map(item => (
                                  <div key={item.id} className="flex items-center gap-1">
                                    <PlayerSelect disabled={!isAuthenticated} value={item.playerName} onChange={val => updateBoss(boss, b => b.phases.find(p => p.id === phase.id)[cfg.key].find(x => x.id === item.id).playerName = val)} players={cfg.casters} fullRoster={roster} getSpecById={getSpecById} placeholder="— Player —" />
                                    <span className="text-slate-600 text-xs">&rarr;</span>

                                    {cfg.targetType === 'combo' && (
                                      <ComboSelect disabled={!isAuthenticated} value={item.target} onChange={val => updateBoss(boss, b => b.phases.find(p => p.id === phase.id)[cfg.key].find(x => x.id === item.id).target = val)} options={fullTargetList.map(t => t.name)} placeholder="Target Details" />
                                    )}
                                    {cfg.targetType === 'player' && (
                                      <PlayerSelect disabled={!isAuthenticated} value={item.target} onChange={val => updateBoss(boss, b => b.phases.find(p => p.id === phase.id)[cfg.key].find(x => x.id === item.id).target = val)} players={manaReceivers} fullRoster={roster} getSpecById={getSpecById} placeholder="— Receiver —" />
                                    )}
                                    {cfg.targetType === 'text' && (
                                      isAuthenticated ? <input type="text" placeholder="Target / Note" className="flex-1 min-w-0 bg-slate-950 text-white border border-slate-700 rounded px-2 py-1.5 text-xs focus:outline-none" value={item.target || ''} onChange={e => updateBoss(boss, b => b.phases.find(p => p.id === phase.id)[cfg.key].find(x => x.id === item.id).target = e.target.value)} />
                                        : <span className="text-xs font-bold text-slate-300 flex-1 min-w-0 truncate">{item.target || '—'}</span>
                                    )}

                                    {isAuthenticated && <button onClick={() => updateBoss(boss, b => { const p = b.phases.find(x => x.id === phase.id); p[cfg.key] = p[cfg.key].filter(x => x.id !== item.id); })} className="text-red-500 font-bold px-0.5">✕</button>}
                                  </div>
                                ))}
                              </SectionWrapper>
                            );
                          })}

                          {/* DYNAMIC FEAR WARDS SECTIONS */}
                          {activeBlocks.includes('fearWards') && (
                            <SectionWrapper title="Fear Wards" isAuthenticated={isAuthenticated} onAdd={() => updateBoss(boss, b => { const p = b.phases.find(x => x.id === phase.id); if (!p.fearWards) p.fearWards = []; p.fearWards.push({ id: generateId(), priestName: null, targetName: null }); })} onRemoveSection={() => updateBoss(boss, b => { const p = b.phases.find(x => x.id === phase.id); p.enabledBlocks = p.enabledBlocks.filter(k => k !== 'fearWards'); delete p.fearWards; })} hasItems={phase.fearWards?.length > 0} emptyText="No assigned fear wards.">
                              {phase.fearWards?.map(fw => (
                                <div key={fw.id} className="flex items-center gap-1">
                                  <PlayerSelect disabled={!isAuthenticated} value={fw.priestName} onChange={val => updateBoss(boss, b => b.phases.find(p => p.id === phase.id).fearWards.find(x => x.id === fw.id).priestName = val)} players={getPlayersByClass('Priest')} fullRoster={roster} getSpecById={getSpecById} placeholder="— Priest —" />
                                  <span className="text-slate-600 text-xs">&rarr;</span>
                                  <PlayerSelect disabled={!isAuthenticated} value={fw.targetName} onChange={val => updateBoss(boss, b => b.phases.find(p => p.id === phase.id).fearWards.find(x => x.id === fw.id).targetName = val)} players={activeRaiders} fullRoster={roster} getSpecById={getSpecById} placeholder="— Target —" />
                                  {isAuthenticated && <button onClick={() => updateBoss(boss, b => { const p = b.phases.find(x => x.id === phase.id); p.fearWards = p.fearWards.filter(x => x.id !== fw.id); })} className="text-red-500 font-bold px-0.5">✕</button>}
                                </div>
                              ))}
                            </SectionWrapper>
                          )}

                          {/* DYNAMIC PHASE COMPONENT STRATEGIES TEXT PANEL */}
                          {activeBlocks.includes('notes') && (
                            <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800 col-span-full relative group">
                              <div className="flex items-center justify-between mb-2 border-b border-slate-800 pb-1">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Notes</span>
                                {isAuthenticated && <button onClick={() => updateBoss(boss, b => { const p = b.phases.find(x => x.id === phase.id); p.enabledBlocks = p.enabledBlocks.filter(k => k !== 'notes'); delete p.phaseNotes; })} className="text-[10px] text-red-500 font-bold uppercase">✕ Notes</button>}
                              </div>
                              {isAuthenticated ? (
                                <textarea rows="3" placeholder="Enter custom positioning text, dynamic cooldown orders, or burn guidelines..." className="w-full bg-slate-950 text-slate-300 border border-slate-700 rounded p-2 text-xs focus:outline-none resize-none" value={phase.phaseNotes || ''} onChange={e => updateBoss(boss, b => b.phases.find(p => p.id === phase.id).phaseNotes = e.target.value)} />
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

                {/* FULL WIDTH POSITIONING MAP DISPLAY SECTION */}
                <div className="pt-4 border-t border-slate-900 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Encounter Layout Positioning Reference Image</h4>
                  {isAuthenticated && (
                    <input type="text" placeholder="Paste full canvas layout picture reference web URL link directly..." className="w-full bg-slate-900 text-slate-300 border border-slate-700 rounded p-2 text-xs focus:outline-none focus:border-purple-500" value={bData.imageUrl || ''} onChange={e => updateBoss(boss, b => b.imageUrl = e.target.value)} />
                  )}
                  {bData.imageUrl ? (
                    <div className="w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 mt-2">
                      <img src={bData.imageUrl} alt={`${boss} Tactical Matrix Layout Map Reference`} className="w-full h-auto object-contain max-h-[800px]" />
                    </div>
                  ) : <div className="text-xs text-slate-600 italic py-2">No custom tactics layout screenshot mapped via URL context references.</div>}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}