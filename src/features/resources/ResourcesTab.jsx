import { useEffect, useMemo, useState } from 'react';
import BisConfigTab from '../../components/BisConfigTab';
import WeakaurasTab from './WeakaurasTab';
import bossData from '../../cheat_sheet_extractv2.json';
import { CHEAT_SHEET_PHASE_MAP, DEFAULT_GLOBAL_PHASE, PHASES } from '../../constants';

const CHEAT_SHEET_STORAGE_KEY = 'cheat-sheet-data-v1';
const CHEAT_SHEET_EXPORT_FILENAME = 'cheat-sheet-export.json';

const sectionLabels = {
  armor: 'Armor',
  creature_type: 'Type',
  health: 'Health',
  attack_speed: 'Attack Speed',
  melee_damage: 'Melee Damage',
  damage_type: 'Damage Type',
  tags: 'Tags',
  spells: 'Spells',
  notes: 'Notes',
};

const defaultCardSections = () => ({
  armor: true,
  creature_type: true,
  health: true,
  attack_speed: true,
  melee_damage: true,
  damage_type: true,
  tags: true,
  spells: true,
  notes: true,
});

const normalizeBoss = (boss = {}) => ({
  ...boss,
  boss_id: boss.boss_id || `boss-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: boss.name || 'New Boss',
  level: Number.isFinite(Number(boss.level)) ? Number(boss.level) : 70,
  phase: Number.isFinite(Number(boss.phase)) ? Number(boss.phase) : 1,
  raid: boss.raid || 'Karazhan',
  creature_type: boss.creature_type || 'Uncategorized',
  armor_type: boss.armor_type || 'Paladin',
  armor: boss.armor ?? 0,
  health: boss.health || '0',
  attack_speed: Number.isFinite(Number(boss.attack_speed)) ? Number(boss.attack_speed) : Number.isFinite(Number(boss.speed)) ? Number(boss.speed) : 2.4,
  min_damage: Number.isFinite(Number(boss.min_damage)) ? Number(boss.min_damage) : 0,
  max_damage: Number.isFinite(Number(boss.max_damage)) ? Number(boss.max_damage) : 0,
  avg_melee_damage: Number.isFinite(Number(boss.avg_melee_damage)) ? Number(boss.avg_melee_damage) : Number.isFinite(Number(boss.avg_damage)) ? Number(boss.avg_damage) : 0,
  damage_type: boss.damage_type || 'Physical',
  tauntable: Boolean(boss.tauntable),
  dual_wield: Boolean(boss.dual_wield),
  parry_haste: Boolean(boss.parry_haste),
  spell_ids: Array.isArray(boss.spell_ids) ? boss.spell_ids : [],
  asset_icons: Array.isArray(boss.asset_icons) ? boss.asset_icons : [],
  notes: boss.notes || '',
  hidden: Boolean(boss.hidden),
  card_sections: {
    ...defaultCardSections(),
    ...(boss.card_sections || {}),
  },
});

const PHASE_BY_RAID = {
  'Karazhan': 'T4',
  "Gruul's Lair": 'T4',
  "Magtheridon's Lair": 'T4',
  'Tempest Keep': 'T5',
  'Serpentshrine Cavern': 'T5',
  'Black Temple': 'T6',
  'Mount Hyjal': 'T6',
  "Zul'Aman": 'ZA',
  'Sunwell Plateau': 'SWP',
};

const getPhaseFromRaid = (raid) => PHASE_BY_RAID[raid] || CHEAT_SHEET_PHASE_MAP[raid] || 'T5';

const loadCheatSheetBosses = () => {
  if (typeof window === 'undefined') return (bossData || []).map(normalizeBoss);

  const saved = window.localStorage.getItem(CHEAT_SHEET_STORAGE_KEY);
  if (!saved) return (bossData || []).map(normalizeBoss);

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(normalizeBoss);
  } catch (error) {
    console.warn('Failed to parse cheat sheet saved data:', error);
  }

  return (bossData || []).map(normalizeBoss);
};

const CHEAT_SHEET_RAIDS = [
  'All Raids',
  ...[...new Set((bossData || []).map(boss => boss.raid).filter(Boolean))].sort((a, b) => a.localeCompare(b))
];
const CHEAT_SHEET_PHASE_OPTIONS = ['All Phases', ...PHASES];

export default function ResourcesTab({
  resourcesSubTab,
  selectedBisSpec,
  setSelectedBisSpec,
  masterItemsDbPhase,
  setMasterItemsDbPhase,
  specsFromDb,
  renderItemSlot,
  specsByName,
  fetchData,
  postData,
  canSubmitWeakauras,
  isAuthenticated = false,
}) {
  const [bosses, setBosses] = useState(loadCheatSheetBosses);
  const [draftBosses, setDraftBosses] = useState(bosses);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRaid, setSelectedRaid] = useState('All Raids');
  const [selectedPhase, setSelectedPhase] = useState(DEFAULT_GLOBAL_PHASE);

  useEffect(() => {
    setBosses(loadCheatSheetBosses());
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      setDraftBosses(bosses);
    }
  }, [bosses, isEditMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CHEAT_SHEET_STORAGE_KEY, JSON.stringify(bosses));
    }
  }, [bosses]);

  const filteredBosses = useMemo(() => {
    const sourceBosses = isEditMode ? draftBosses : bosses;

    return [...(sourceBosses || [])]
      .filter(boss => {
        if (!isEditMode && boss.hidden) return false;
        const matchesRaid = selectedRaid === 'All Raids' || boss.raid === selectedRaid;
        const bossPhase = getPhaseFromRaid(boss.raid);
        const matchesPhase = selectedPhase === 'All Phases' || bossPhase === selectedPhase;
        return matchesRaid && matchesPhase;
      })
      .sort((a, b) => Number(Boolean(a.hidden)) - Number(Boolean(b.hidden)));
  }, [bosses, draftBosses, isEditMode, selectedPhase, selectedRaid]);

  const currentBosses = isEditMode ? draftBosses : bosses;
  const hasPendingChanges = JSON.stringify(draftBosses) !== JSON.stringify(bosses);

  const updateBossField = (bossId, field, value) => {
    setDraftBosses(prev => prev.map(boss => {
      if (boss.boss_id !== bossId) return boss;
      return { ...boss, [field]: value };
    }));
  };

  const updateBossSpellIds = (bossId, value) => {
    const nextSpellIds = value
      .split(',')
      .map(part => Number.parseInt(part.trim(), 10))
      .filter(number => Number.isFinite(number));

    updateBossField(bossId, 'spell_ids', nextSpellIds);
  };

  const updateSectionVisibility = (bossId, sectionKey) => {
    setDraftBosses(prev => prev.map(boss => {
      if (boss.boss_id !== bossId) return boss;
      const existingSections = { ...defaultCardSections(), ...(boss.card_sections || {}) };
      return {
        ...boss,
        card_sections: {
          ...existingSections,
          [sectionKey]: !Boolean(existingSections[sectionKey]),
        },
      };
    }));
  };

  const handleHideBossCard = (bossId) => {
    setDraftBosses(prev => prev.map(boss => {
      if (boss.boss_id !== bossId) return boss;
      return { ...boss, hidden: !Boolean(boss.hidden) };
    }));
  };

  const handleAddBossCard = () => {
    const newBoss = normalizeBoss({
      boss_id: `new-boss-${Date.now()}`,
      name: 'New Boss',
      raid: selectedRaid !== 'All Raids' ? selectedRaid : 'Karazhan',
      level: 70,
      phase: 1,
      creature_type: 'Uncategorized',
      armor_type: 'Paladin',
      armor: 0,
      health: '0',
      tauntable: true,
      dual_wield: false,
      parry_haste: false,
      spell_ids: [],
      asset_icons: [],
      notes: '',
      hidden: false,
      card_sections: defaultCardSections(),
    });

    setDraftBosses(prev => [newBoss, ...prev]);
    setIsEditMode(true);
  };

  const handleSaveChanges = () => {
    setBosses(draftBosses.map(normalizeBoss));
    setIsEditMode(false);
  };

  const handleExitEditMode = () => {
    setDraftBosses(bosses.map(normalizeBoss));
    setIsEditMode(false);
  };

  const handleExportCheatSheetJson = () => {
    const payload = JSON.stringify((bosses || []).map(normalizeBoss), null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = CHEAT_SHEET_EXPORT_FILENAME;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportCheatSheetJson = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      const normalizedBosses = Array.isArray(parsed) ? parsed.map(normalizeBoss) : [];

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(CHEAT_SHEET_STORAGE_KEY, JSON.stringify(normalizedBosses));
      }

      setBosses(normalizedBosses);
      setDraftBosses(normalizedBosses);
      setIsEditMode(false);
    } catch (error) {
      console.error('Failed to import cheat sheet JSON:', error);
      window.alert('That file could not be imported. Please make sure it is valid cheat-sheet JSON.');
    } finally {
      event.target.value = '';
    }
  };

  const handleResetToSeedData = () => {
    const seededBosses = (bossData || []).map(normalizeBoss);

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(CHEAT_SHEET_STORAGE_KEY);
    }

    setBosses(seededBosses);
    setDraftBosses(seededBosses);
    setIsEditMode(false);
  };

  return (
    <div className="space-y-4">
      {resourcesSubTab === 'bis' && (
        <BisConfigTab
          selectedBisSpec={selectedBisSpec}
          setSelectedBisSpec={setSelectedBisSpec}
          masterItemsDbPhase={masterItemsDbPhase}
          setMasterItemsDbPhase={setMasterItemsDbPhase}
          specsFromDb={specsFromDb}
          renderItemSlot={renderItemSlot}
          specsByName={specsByName}
        />
      )}

      {resourcesSubTab === 'tactics' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-100">Raid Tactics</h3>
          <p className="text-sm text-slate-400">Quick reminders for the upcoming raid plan, boss mechanics, and role-specific priorities.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4"><div className="text-sm font-semibold text-amber-400">Tank/healer calls</div><div className="mt-2 text-sm text-slate-400">Use the raid assignment view to confirm who is covering each role and where to position them.</div></div>
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-4"><div className="text-sm font-semibold text-amber-400">Encounter prep</div><div className="mt-2 text-sm text-slate-400">Review the latest signup events and group config before the pull so everyone knows their lane.</div></div>
          </div>
        </div>
      )}

      {resourcesSubTab === 'weakauras' && (
        <WeakaurasTab
          fetchData={fetchData}
          postData={postData}
          canSubmit={canSubmitWeakauras}
        />
      )}

      {resourcesSubTab === 'cheatsheets' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Cheat Sheets</h3>
              <p className="text-sm text-slate-400">Static encounter references for tanking checks, raid mechanics, and phase-specific boss context.</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex flex-col text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Raid
                <select
                  className="mt-1 min-w-[180px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                  value={selectedRaid}
                  onChange={event => setSelectedRaid(event.target.value)}
                >
                  {CHEAT_SHEET_RAIDS.map(raid => (
                    <option key={raid} value={raid}>{raid}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Phase
                <select
                  className="mt-1 min-w-[140px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                  value={selectedPhase}
                  onChange={event => setSelectedPhase(event.target.value)}
                >
                  {CHEAT_SHEET_PHASE_OPTIONS.map(phase => (
                    <option key={phase} value={phase}>{phase}</option>
                  ))}
                </select>
              </label>

              {isAuthenticated && (
                <div className="flex items-center gap-2 flex-wrap">
                  {!isEditMode ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditMode(true)}
                        className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200 transition hover:bg-amber-500/20"
                      >
                        Enter Edit Mode
                      </button>
                      <button
                        type="button"
                        onClick={handleResetToSeedData}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-200 transition hover:border-slate-500"
                      >
                        Reset Seed Data
                      </button>
                      <button
                        type="button"
                        onClick={handleExportCheatSheetJson}
                        className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200 transition hover:bg-emerald-500/20"
                      >
                        Export JSON
                      </button>
                      <label className="cursor-pointer rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-200 transition hover:bg-sky-500/20">
                        Import JSON
                        <input type="file" accept="application/json" className="hidden" onChange={handleImportCheatSheetJson} />
                      </label>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveChanges}
                        disabled={!hasPendingChanges}
                        className={`rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition ${hasPendingChanges ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20' : 'cursor-not-allowed border border-slate-700 bg-slate-800 text-slate-500'}`}
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={handleAddBossCard}
                        className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200 transition hover:bg-amber-500/20"
                      >
                        Add Boss Card
                      </button>
                      <button
                        type="button"
                        onClick={handleResetToSeedData}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-200 transition hover:border-slate-500"
                      >
                        Reset Seed Data
                      </button>
                      <button
                        type="button"
                        onClick={handleExportCheatSheetJson}
                        className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200 transition hover:bg-emerald-500/20"
                      >
                        Export JSON
                      </button>
                      <label className="cursor-pointer rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-200 transition hover:bg-sky-500/20">
                        Import JSON
                        <input type="file" accept="application/json" className="hidden" onChange={handleImportCheatSheetJson} />
                      </label>
                      <button
                        type="button"
                        onClick={handleExitEditMode}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-200 transition hover:border-slate-500"
                      >
                        Exit Edit Mode
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {filteredBosses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900 p-6 text-sm text-slate-400">
              No boss encounters match the selected raid and phase.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredBosses.map(boss => {
                const bossPhase = getPhaseFromRaid(boss.raid);
                const spellList = Array.isArray(boss.spell_ids) ? boss.spell_ids : [];
                const iconList = Array.isArray(boss.asset_icons) ? boss.asset_icons : [];
                const isBossEditing = isEditMode && currentBosses.some(entry => entry.boss_id === boss.boss_id);
                const editableBoss = currentBosses.find(entry => entry.boss_id === boss.boss_id) || boss;
                const visibleSections = { ...defaultCardSections(), ...(editableBoss.card_sections || {}) };
                const isHiddenInEditMode = Boolean(editableBoss.hidden) && isEditMode;

                return (
                  <article key={boss.boss_id} className={`rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/50 transition-all ${isHiddenInEditMode ? 'opacity-45 grayscale-[0.3] border-slate-700' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {isBossEditing ? (
                          <input
                            value={editableBoss.name || ''}
                            onChange={event => updateBossField(boss.boss_id, 'name', event.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-lg font-bold text-slate-100 focus:border-amber-500 focus:outline-none"
                          />
                        ) : (
                          <h4 className="text-lg font-bold text-slate-100">{boss.name}</h4>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-semibold uppercase tracking-[0.14em] text-amber-300">{editableBoss.raid || boss.raid}</span>
                          <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-slate-300">{bossPhase}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isBossEditing && (
                          <button
                            type="button"
                            onClick={() => handleHideBossCard(boss.boss_id)}
                            className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] transition ${editableBoss.hidden ? 'border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20' : 'border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20'}`}
                          >
                            {editableBoss.hidden ? 'Unhide Boss' : 'Hide Boss'}
                          </button>
                        )}
                        <div className="text-right text-[11px] text-slate-400">
                          {isBossEditing ? (
                            <input
                              value={editableBoss.level ?? ''}
                              onChange={event => updateBossField(boss.boss_id, 'level', Number(event.target.value) || 0)}
                              className="w-16 rounded border border-slate-700 bg-slate-950 px-1 py-1 text-right text-slate-200 focus:border-amber-500 focus:outline-none"
                            />
                          ) : (
                            <>
                              <div>Lvl {boss.level}</div>
                              <div>{boss.health}</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {isBossEditing && (
                      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Card Sections</div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(sectionLabels).map(([sectionKey, sectionLabel]) => {
                            const enabled = Boolean(visibleSections[sectionKey]);
                            return (
                              <button
                                key={`${boss.boss_id}-${sectionKey}`}
                                type="button"
                                onClick={() => updateSectionVisibility(boss.boss_id, sectionKey)}
                                className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition ${enabled ? 'border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'}`}
                              >
                                {sectionLabel}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {(visibleSections.armor || visibleSections.creature_type || visibleSections.health || visibleSections.attack_speed || visibleSections.melee_damage || visibleSections.damage_type) && (
                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-300">
                        {visibleSections.armor && (
                          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2">
                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Armor</div>
                            {isBossEditing ? (
                              <input
                                value={editableBoss.armor ?? ''}
                                onChange={event => updateBossField(boss.boss_id, 'armor', Number(event.target.value) || 0)}
                                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 focus:border-amber-500 focus:outline-none"
                              />
                            ) : (
                              <div className="mt-1 font-semibold text-slate-200">{boss.armor ?? 'N/A'}</div>
                            )}
                          </div>
                        )}

                        {visibleSections.creature_type && (
                          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2">
                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Type</div>
                            {isBossEditing ? (
                              <input
                                value={editableBoss.creature_type || ''}
                                onChange={event => updateBossField(boss.boss_id, 'creature_type', event.target.value)}
                                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 focus:border-amber-500 focus:outline-none"
                              />
                            ) : (
                              <div className="mt-1 font-semibold text-slate-200">{boss.creature_type || '—'}</div>
                            )}
                          </div>
                        )}

                        {visibleSections.health && (
                          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2">
                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Health</div>
                            {isBossEditing ? (
                              <input
                                value={editableBoss.health || ''}
                                onChange={event => updateBossField(boss.boss_id, 'health', event.target.value)}
                                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 focus:border-amber-500 focus:outline-none"
                              />
                            ) : (
                              <div className="mt-1 font-semibold text-slate-200">{boss.health || '—'}</div>
                            )}
                          </div>
                        )}

                        {visibleSections.attack_speed && (
                          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2">
                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Attack Speed</div>
                            {isBossEditing ? (
                              <input
                                value={editableBoss.attack_speed ?? ''}
                                onChange={event => updateBossField(boss.boss_id, 'attack_speed', Number(event.target.value) || 0)}
                                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 focus:border-amber-500 focus:outline-none"
                              />
                            ) : (
                              <div className="mt-1 font-semibold text-slate-200">{boss.attack_speed ?? '—'}</div>
                            )}
                          </div>
                        )}

                        {visibleSections.melee_damage && (
                          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2 col-span-2">
                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Melee Damage</div>
                            {isBossEditing ? (
                              <div className="mt-2 grid grid-cols-3 gap-2">
                                <input
                                  value={editableBoss.min_damage ?? ''}
                                  onChange={event => updateBossField(boss.boss_id, 'min_damage', Number(event.target.value) || 0)}
                                  placeholder="Min"
                                  className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 focus:border-amber-500 focus:outline-none"
                                />
                                <input
                                  value={editableBoss.max_damage ?? ''}
                                  onChange={event => updateBossField(boss.boss_id, 'max_damage', Number(event.target.value) || 0)}
                                  placeholder="Max"
                                  className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 focus:border-amber-500 focus:outline-none"
                                />
                                <input
                                  value={editableBoss.avg_melee_damage ?? ''}
                                  onChange={event => updateBossField(boss.boss_id, 'avg_melee_damage', Number(event.target.value) || 0)}
                                  placeholder="Avg"
                                  className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 focus:border-amber-500 focus:outline-none"
                                />
                              </div>
                            ) : (
                              <div className="mt-1 font-semibold text-slate-200">
                                {boss.min_damage ?? 0} - {boss.max_damage ?? 0} ({boss.avg_melee_damage ?? 0} avg)
                              </div>
                            )}
                          </div>
                        )}

                        {visibleSections.damage_type && (
                          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2">
                            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Damage Type</div>
                            {isBossEditing ? (
                              <input
                                value={editableBoss.damage_type || 'Physical'}
                                onChange={event => updateBossField(boss.boss_id, 'damage_type', event.target.value || 'Physical')}
                                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 focus:border-amber-500 focus:outline-none"
                              />
                            ) : (
                              <div className="mt-1 font-semibold text-slate-200">{boss.damage_type || 'Physical'}</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {visibleSections.tags && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {isBossEditing ? (
                          <>
                            <label className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">
                              <input
                                type="checkbox"
                                checked={Boolean(editableBoss.tauntable)}
                                onChange={event => updateBossField(boss.boss_id, 'tauntable', event.target.checked)}
                                className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-emerald-500"
                              />
                              Tauntable
                            </label>
                            <label className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-300">
                              <input
                                type="checkbox"
                                checked={Boolean(editableBoss.dual_wield)}
                                onChange={event => updateBossField(boss.boss_id, 'dual_wield', event.target.checked)}
                                className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-cyan-500"
                              />
                              Dual Wield
                            </label>
                            <label className="inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-violet-300">
                              <input
                                type="checkbox"
                                checked={Boolean(editableBoss.parry_haste)}
                                onChange={event => updateBossField(boss.boss_id, 'parry_haste', event.target.checked)}
                                className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-violet-500"
                              />
                              Parry Haste
                            </label>
                          </>
                        ) : (
                          <>
                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${boss.tauntable ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-red-500/40 bg-red-500/10 text-red-300'}`}>
                              {boss.tauntable ? 'Tauntable' : 'Not Tauntable'}
                            </span>
                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${boss.dual_wield ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
                              {boss.dual_wield ? 'Dual Wield' : 'Single Wield'}
                            </span>
                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${boss.parry_haste ? 'border-violet-500/40 bg-violet-500/10 text-violet-300' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
                              {boss.parry_haste ? 'Parry Haste' : 'No Parry Haste'}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {visibleSections.spells && (
                      <div className="mt-4">
                        {(iconList.length > 0 || spellList.length > 0) && (
                          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Abilities</div>
                        )}

                        {iconList.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {iconList.map((icon, iconIndex) => {
                              const spellId = spellList[iconIndex] || spellList[0];
                              const image = (
                                <img
                                  src={`https://wow.zamimg.com/images/wow/icons/large/${icon}.jpg`}
                                  alt={icon}
                                  className="block h-9 w-9 rounded-md border border-slate-700 bg-slate-950 object-cover"
                                />
                              );

                              if (!spellId) {
                                return <span key={`${boss.boss_id}-icon-${icon}`}>{image}</span>;
                              }

                              return (
                                <a
                                  key={`${boss.boss_id}-icon-${icon}`}
                                  href={`https://www.wowhead.com/tbc/spell=${spellId}`}
                                  data-wh-rename-link="false"
                                  data-wh-icon-size="large"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="boss-spell-icon group relative block overflow-hidden rounded-md border border-slate-700 bg-slate-950 transition hover:border-amber-500"
                                  title={icon}
                                  style={{ fontSize: 0, lineHeight: 0 }}
                                >
                                  {image}
                                </a>
                              );
                            })}
                          </div>
                        )}

                        {isBossEditing && (
                          <div className="mt-3">
                            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Spell IDs</div>
                            <input
                              value={(editableBoss.spell_ids || []).join(', ')}
                              onChange={event => updateBossSpellIds(boss.boss_id, event.target.value)}
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {visibleSections.notes && (
                      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Notes</div>
                        {isBossEditing ? (
                          <textarea
                            value={editableBoss.notes || ''}
                            onChange={event => updateBossField(boss.boss_id, 'notes', event.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                          />
                        ) : (
                          <div className="text-sm leading-relaxed text-slate-300">
                            {boss.notes || 'No notes yet.'}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {resourcesSubTab === 'raidlogs' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-100">Raid Logs</h3>
          <p className="text-sm text-slate-400">Links and notes for the most recent raid logs, parses, and attendance reviews.</p>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">Use the roster and scoring pages to review attendance and compare recent raid performance.</div>
        </div>
      )}

      {resourcesSubTab === 'wowaudit' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-100">WoWAudit</h3>
          <p className="text-sm text-slate-400">Keep a short list of important WoWAudit links, profiles, or notes for known raid goals and progress.</p>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">Add the relevant audit links here whenever you want them close at hand during planning.</div>
        </div>
      )}

      {resourcesSubTab === 'wipefest' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-100">Wipefest</h3>
          <p className="text-sm text-slate-400">Store the latest wipefest links or notes for encounter discussion and post-raid review.</p>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">Link the relevant threads or summaries so they are available during the next planning session.</div>
        </div>
      )}
    </div>
  );
}
