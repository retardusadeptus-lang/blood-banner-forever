import { useEffect, useMemo, useState } from 'react';
import BisConfigTab from '../../components/BisConfigTab';
import WeakaurasTab from './WeakaurasTab';
import bossData from '../../cheat_sheet_extractv2.json';

const CHEAT_SHEET_STORAGE_KEY = 'cheat-sheet-data-v1';
const CHEAT_SHEET_EXPORT_FILENAME = 'cheat-sheet-export.json';
const WIPEFEST_STORAGE_KEY = 'wipefest-data-v1';

const normalizeTacticsMediaItem = (item = {}, index = 0) => {
  const url = String(item?.url || '').trim();
  const label = String(item?.label || '').trim();

  if (!url) return null;

  const normalizedType = ['image', 'video', 'link'].includes(item?.type) ? item.type : 'link';

  return {
    id: item?.id || `tactics-media-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: normalizedType,
    url,
    label: label || url,
  };
};

const normalizeTacticsEntry = (entry = {}) => ({
  bossName: String(entry.bossName || entry.boss_name || '').trim(),
  notes: String(entry.notes || '').trim(),
  media: Array.isArray(entry.media)
    ? entry.media.map(normalizeTacticsMediaItem).filter(Boolean)
    : Array.isArray(entry.media_json)
      ? entry.media_json.map(normalizeTacticsMediaItem).filter(Boolean)
      : [],
});

const normalizeWipefestEntry = (entry = {}, fallbackReport = null) => {
  const raidDate = entry.raidDate || (fallbackReport?.startTime ? new Date(fallbackReport.startTime).toISOString().slice(0, 10) : '');
  const logsUrl = entry.logsUrl || fallbackReport?.url || '';

  return {
    id: entry.id || fallbackReport?.id || `wipefest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    raidDate,
    title: entry.title || fallbackReport?.title || 'New Raid',
    logsUrl,
    wipefestUrl: entry.wipefestUrl || '',
    notes: entry.notes || '',
  };
};

const loadWipefestEntries = () => {
  if (typeof window === 'undefined') return [];

  const saved = window.localStorage.getItem(WIPEFEST_STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed.map(entry => normalizeWipefestEntry(entry));
    }
  } catch (error) {
    console.warn('Failed to parse wipefest saved data:', error);
  }

  return [];
};

const formatWclDate = (value) => {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatDuration = (value) => {
  const ms = Number(value || 0);
  if (!Number.isFinite(ms) || ms <= 0) return 'Unknown duration';
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
};

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
  putData,
  deleteData,
  canSubmitWeakauras,
  isAuthenticated = false,
  enabledBosses = [],
}) {
  const [bosses, setBosses] = useState(loadCheatSheetBosses);
  const [draftBosses, setDraftBosses] = useState(bosses);
  const [isEditMode, setIsEditMode] = useState(false);
  const [internalSelectedRaid, setInternalSelectedRaid] = useState('All Raids');
  const selectedRaid = internalSelectedRaid;
  const setSelectedRaid = setInternalSelectedRaid;
  const [recentReports, setRecentReports] = useState([]);
  const [recentReportsError, setRecentReportsError] = useState('');
  const [isTacticsEditMode, setIsTacticsEditMode] = useState(false);
  const [raidTacticsBossOrder, setRaidTacticsBossOrder] = useState([]);
  const [raidTacticsDraft, setRaidTacticsDraft] = useState({});
  const [raidTacticsSaved, setRaidTacticsSaved] = useState({});
  const [tacticsError, setTacticsError] = useState('');
  const [wipefestEntries, setWipefestEntries] = useState([]);
  const [draftWipefestEntries, setDraftWipefestEntries] = useState([]);
  const [isWipefestEditMode, setIsWipefestEditMode] = useState(false);
  const [deletedWipefestEntryIds, setDeletedWipefestEntryIds] = useState([]);

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

  const filteredRaidTacticsBossOrder = useMemo(() => {
    if (!Array.isArray(raidTacticsBossOrder)) return [];

    const sourceBosses = Array.isArray(enabledBosses) && enabledBosses.length > 0
      ? raidTacticsBossOrder.filter((bossName) => enabledBosses.includes(bossName))
      : raidTacticsBossOrder;

    return sourceBosses;
  }, [enabledBosses, raidTacticsBossOrder]);

  useEffect(() => {
    if (resourcesSubTab !== 'tactics') return undefined;

    let isMounted = true;
    const loadTactics = async () => {
      try {
        const [payload, configuredBosses] = await Promise.all([
          fetchData('tactics').catch(() => ({ bossOrder: [], entries: [] })),
          fetchData('raid-assignment-config').catch(() => [])
        ]);

        if (!isMounted) return;

        const bossOrder = Array.isArray(payload?.bossOrder) && payload.bossOrder.length > 0
          ? payload.bossOrder
          : Array.isArray(configuredBosses) && configuredBosses.length > 0
            ? configuredBosses
            : [];

        const byBoss = {};
        (Array.isArray(payload?.entries) ? payload.entries : []).forEach((entry) => {
          const normalized = normalizeTacticsEntry(entry);
          if (normalized.bossName) {
            byBoss[normalized.bossName] = normalized;
          }
        });

        const nextDraft = {};
        bossOrder.forEach((bossName) => {
          const saved = byBoss[bossName] || { bossName, notes: '', media: [] };
          nextDraft[bossName] = {
            bossName,
            notes: saved.notes || '',
            media: Array.isArray(saved.media) ? saved.media : [],
          };
        });

        setRaidTacticsBossOrder(bossOrder);
        setRaidTacticsSaved(nextDraft);
        setRaidTacticsDraft(nextDraft);
        setTacticsError('');
      } catch (error) {
        if (!isMounted) return;
        setRaidTacticsBossOrder([]);
        setRaidTacticsSaved({});
        setRaidTacticsDraft({});
        setTacticsError(error?.message || 'Failed to load raid tactics.');
      }
    };

    loadTactics();
    return () => {
      isMounted = false;
    };
  }, [fetchData, resourcesSubTab]);

  useEffect(() => {
    if (resourcesSubTab !== 'wipefest') return undefined;

    let isMounted = true;
    const loadWipefestEntries = async () => {
      try {
        const payload = await fetchData('wipefest');
        if (!isMounted) return;
        const entries = Array.isArray(payload) ? payload.map((entry) => normalizeWipefestEntry(entry)) : [];
        setWipefestEntries(entries);
        setDraftWipefestEntries(entries);
        setDeletedWipefestEntryIds([]);
      } catch (error) {
        if (!isMounted) return;
        setWipefestEntries([]);
        setDraftWipefestEntries([]);
        setDeletedWipefestEntryIds([]);
      }
    };

    loadWipefestEntries();
    return () => {
      isMounted = false;
    };
  }, [fetchData, resourcesSubTab]);

  useEffect(() => {
    if (resourcesSubTab !== 'raidlogs') return undefined;

    let isMounted = true;

    const loadRecentReports = async () => {
      try {
        const payload = await fetchData('warcraftlogs/recent-reports');
        if (!isMounted) return;
        setRecentReports(Array.isArray(payload) ? payload : []);
        setRecentReportsError('');
      } catch (error) {
        if (!isMounted) return;
        setRecentReports([]);
        setRecentReportsError(error?.message || 'Failed to load recent WarcraftLogs reports.');
      }
    };

    loadRecentReports();

    return () => {
      isMounted = false;
    };
  }, [fetchData, resourcesSubTab]);

  const filteredBosses = useMemo(() => {
    const sourceBosses = isEditMode ? draftBosses : bosses;

    return [...(sourceBosses || [])]
      .filter(boss => {
        if (!isEditMode && boss.hidden) return false;
        const matchesRaid = selectedRaid === 'All Raids' || boss.raid === selectedRaid;
        return matchesRaid;
      })
      .sort((a, b) => Number(Boolean(a.hidden)) - Number(Boolean(b.hidden)));
  }, [bosses, draftBosses, isEditMode, selectedRaid]);

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

  const handleTacticsFieldChange = (bossName, field, value) => {
    setRaidTacticsDraft(prev => ({
      ...prev,
      [bossName]: {
        bossName,
        notes: field === 'notes' ? value : prev[bossName]?.notes || '',
        media: field === 'notes' ? prev[bossName]?.media || [] : prev[bossName]?.media || [],
      },
    }));
  };

  const handleTacticsMediaChange = (bossName, mediaId, field, value) => {
    setRaidTacticsDraft(prev => ({
      ...prev,
      [bossName]: {
        bossName,
        notes: prev[bossName]?.notes || '',
        media: (prev[bossName]?.media || []).map(item => (
          item.id === mediaId ? { ...item, [field]: value } : item
        )),
      },
    }));
  };

  const handleAddTacticsMedia = (bossName) => {
    setRaidTacticsDraft(prev => ({
      ...prev,
      [bossName]: {
        bossName,
        notes: prev[bossName]?.notes || '',
        media: [
          ...(prev[bossName]?.media || []),
          {
            id: `tactics-media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: 'image',
            url: '',
            label: 'New item',
          }
        ],
      },
    }));
  };

  const handleRemoveTacticsMedia = (bossName, mediaId) => {
    setRaidTacticsDraft(prev => ({
      ...prev,
      [bossName]: {
        bossName,
        notes: prev[bossName]?.notes || '',
        media: (prev[bossName]?.media || []).filter(item => item.id !== mediaId),
      },
    }));
  };

  const handleSaveTacticsChanges = async () => {
    if (!isAuthenticated) {
      window.alert('Officer login required to save raid tactics.');
      return;
    }

    try {
      const bossNames = raidTacticsBossOrder;
      for (const bossName of bossNames) {
        const draftEntry = raidTacticsDraft[bossName] || { bossName, notes: '', media: [] };
        const sanitizedMedia = (draftEntry.media || []).map((item, index) => normalizeTacticsMediaItem(item, index)).filter(Boolean);
        await putData(`tactics/${encodeURIComponent(bossName)}`, {
          bossName,
          notes: draftEntry.notes || '',
          media: sanitizedMedia,
        });
      }

      const refreshed = await fetchData('tactics');
      const nextMap = {};
      (Array.isArray(refreshed?.entries) ? refreshed.entries : []).forEach((entry) => {
        const normalized = normalizeTacticsEntry(entry);
        if (normalized.bossName) {
          nextMap[normalized.bossName] = normalized;
        }
      });

      setRaidTacticsSaved(nextMap);
      setRaidTacticsDraft(nextMap);
      setTacticsError('');
    } catch (error) {
      console.error('Failed to save raid tactics:', error);
      setTacticsError(error?.message || 'Failed to save raid tactics.');
      window.alert(error?.message || 'Failed to save raid tactics.');
    }
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

  const handleAddWipefestEntry = () => {
    const defaultEntry = normalizeWipefestEntry({}, recentReports[0] || null);
    const newEntry = {
      ...defaultEntry,
      id: `wipefest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      raidDate: defaultEntry.raidDate || new Date().toISOString().slice(0, 10),
      title: 'New Raid',
      logsUrl: defaultEntry.logsUrl || '',
      wipefestUrl: '',
      notes: '',
    };

    setDraftWipefestEntries(prev => [newEntry, ...prev]);
    setIsWipefestEditMode(true);
  };

  const handleSaveWipefestChanges = async () => {
    try {
      const persistEntry = async (entry) => {
        const payload = {
          raidDate: entry.raidDate || '',
          title: entry.title || 'New Raid',
          logsUrl: entry.logsUrl || '',
          wipefestUrl: entry.wipefestUrl || '',
          notes: entry.notes || ''
        };

        if (typeof entry.id === 'number' || /^\d+$/.test(String(entry.id || ''))) {
          return await putData(`wipefest/${entry.id}`, payload);
        }

        return await postData('wipefest', payload);
      };

      const idsToDelete = [...deletedWipefestEntryIds];
      for (const id of idsToDelete) {
        if (id && (typeof id === 'number' || /^\d+$/.test(String(id)))) {
          await deleteData(`wipefest/${id}`);
        }
      }

      for (const entry of draftWipefestEntries) {
        if (!entry) continue;
        const isPersisted = typeof entry.id === 'number' || /^\d+$/.test(String(entry.id || ''));
        const isDeleted = deletedWipefestEntryIds.includes(entry.id);
        if (isDeleted) continue;
        if (isPersisted || String(entry.id || '').startsWith('wipefest-')) {
          await persistEntry(entry);
        }
      }

      const payload = await fetchData('wipefest');
      const refreshedEntries = Array.isArray(payload) ? payload.map(normalizeWipefestEntry) : [];
      setWipefestEntries(refreshedEntries);
      setDraftWipefestEntries(refreshedEntries);
      setDeletedWipefestEntryIds([]);
      setIsWipefestEditMode(false);
    } catch (error) {
      console.error('Failed to save wipefest entries:', error);
      window.alert(error?.message || 'Failed to save wipefest entries.');
    }
  };

  const handleExitWipefestEditMode = () => {
    setDraftWipefestEntries(wipefestEntries.map(entry => normalizeWipefestEntry(entry)));
    setDeletedWipefestEntryIds([]);
    setIsWipefestEditMode(false);
  };

  const handleRemoveWipefestEntry = (entryId) => {
    setDeletedWipefestEntryIds(prev => prev.includes(entryId) ? prev : [...prev, entryId]);
    setDraftWipefestEntries(prev => prev.filter(entry => entry.id !== entryId));
  };

  const updateWipefestEntry = (entryId, field, value) => {
    setDraftWipefestEntries(prev => prev.map(entry => {
      if (entry.id !== entryId) return entry;
      return { ...entry, [field]: value };
    }));
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
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Raid Tactics</h3>
              <p className="text-sm text-slate-400">Boss-by-boss notes, references, and media kept in the same order as the raid assignment boss list.</p>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <div className="flex items-center gap-2">
                  {!isTacticsEditMode ? (
                    <button
                      type="button"
                      onClick={() => setIsTacticsEditMode(true)}
                      className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200 transition hover:bg-amber-500/20"
                    >
                      Enter Edit Mode
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setRaidTacticsDraft(raidTacticsSaved)}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-200 transition hover:border-slate-500"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveTacticsChanges}
                        className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200 transition hover:bg-emerald-500/20"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRaidTacticsDraft(raidTacticsSaved);
                          setIsTacticsEditMode(false);
                        }}
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

          {tacticsError && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{tacticsError}</div>
          )}

          {filteredRaidTacticsBossOrder.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900 p-6 text-sm text-slate-400">
              No bosses are currently enabled in the raid assignment selector.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRaidTacticsBossOrder.map((bossName) => {
                const draftEntry = raidTacticsDraft[bossName] || { bossName, notes: '', media: [] };
                const mediaItems = Array.isArray(draftEntry.media) ? draftEntry.media : [];

                return (
                  <section key={bossName} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h4 className="text-base font-bold text-slate-100">{bossName}</h4>
                      {isAuthenticated && (
                        <button
                          type="button"
                          onClick={() => handleAddTacticsMedia(bossName)}
                          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200 transition hover:bg-amber-500/20"
                        >
                          Add Media
                        </button>
                      )}
                    </div>

                    {isAuthenticated && isTacticsEditMode ? (
                      <>
                        <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                          Boss notes
                          <textarea
                            value={draftEntry.notes || ''}
                            onChange={(event) => handleTacticsFieldChange(bossName, 'notes', event.target.value)}
                            className="mt-2 min-h-[120px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                            placeholder="Write the encounter plan, pull call, or role-specific guidance for this boss..."
                          />
                        </label>

                        <div className="mt-4 space-y-3">
                          {mediaItems.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-400">
                              No media added yet.
                            </div>
                          ) : (
                            mediaItems.map((item) => (
                              <div key={item.id} className="rounded-lg border border-slate-700 bg-slate-950/70 p-3">
                                <div className="grid gap-3 md:grid-cols-[140px_1fr_1.2fr_auto] md:items-center">
                                  <select
                                    value={item.type || 'link'}
                                    onChange={(event) => handleTacticsMediaChange(bossName, item.id, 'type', event.target.value)}
                                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                                  >
                                    <option value="image">Image</option>
                                    <option value="video">Video</option>
                                    <option value="link">Link</option>
                                  </select>

                                  <input
                                    value={item.label || ''}
                                    onChange={(event) => handleTacticsMediaChange(bossName, item.id, 'label', event.target.value)}
                                    placeholder="Label"
                                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                                  />

                                  <input
                                    value={item.url || ''}
                                    onChange={(event) => handleTacticsMediaChange(bossName, item.id, 'url', event.target.value)}
                                    placeholder="https://..."
                                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                                  />

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTacticsMedia(bossName, item.id)}
                                    className="rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-red-200 transition hover:bg-red-500/20"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        {draftEntry.notes ? (
                          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{draftEntry.notes}</p>
                        ) : (
                          <p className="text-sm text-slate-500 italic">No tactic notes saved for this boss yet.</p>
                        )}

                        {mediaItems.length > 0 && (
                          <div className="space-y-3">
                            {mediaItems.map((item) => {
                              const renderedUrl = item.url;
                              const label = item.label || item.url;
                              const isVideo = item.type === 'video';
                              const isImage = item.type === 'image';

                              if (isImage) {
                                return (
                                  <div key={item.id} className="rounded-lg border border-slate-700 bg-slate-950/70 p-2">
                                    <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</div>
                                    <img src={renderedUrl} alt={label} className="max-h-72 w-full rounded-md object-contain" />
                                  </div>
                                );
                              }

                              if (isVideo) {
                                let embedUrl = renderedUrl;
                                try {
                                  const parsed = new URL(renderedUrl);
                                  if (parsed.hostname.includes('youtube.com') && parsed.searchParams.get('v')) {
                                    embedUrl = `https://www.youtube.com/embed/${parsed.searchParams.get('v')}`;
                                  } else if (parsed.hostname.includes('youtu.be')) {
                                    const videoId = parsed.pathname.replace('/', '');
                                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                                  }
                                } catch (error) {
                                  embedUrl = renderedUrl;
                                }

                                return (
                                  <div key={item.id} className="rounded-lg border border-slate-700 bg-slate-950/70 p-2">
                                    <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</div>
                                    <iframe
                                      src={embedUrl}
                                      title={label}
                                      className="aspect-video w-full rounded-md border-0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                      allowFullScreen
                                    />
                                  </div>
                                );
                              }

                              return (
                                <a key={item.id} href={renderedUrl} target="_blank" rel="noreferrer" className="block rounded-lg border border-slate-700 bg-slate-950/70 p-3 text-sm text-sky-300 hover:text-sky-200 hover:border-sky-500/60">
                                  {label}
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}
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
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Raid Logs</h3>
              <p className="text-sm text-slate-400">Recent guild reports from Warcraft Logs, plus quick summary links to the latest raids.</p>
            </div>
            <div className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              {recentReports.length} recent reports
            </div>
          </div>

          {recentReportsError ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              {recentReportsError}
            </div>
          ) : null}

          {recentReports.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900 p-4 text-sm text-slate-400">
              No recent Warcraft Logs reports are available yet. Add the guild ID and API key to enable automatic syncing.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {recentReports.map(report => (
                <article key={report.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">{report.zone || 'Raid'}</div>
                      <h4 className="mt-2 text-lg font-bold text-slate-100">{report.title}</h4>
                    </div>
                    {report.url ? (
                      <a
                        href={report.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border border-sky-500/40 bg-sky-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200 transition hover:bg-sky-500/15"
                      >
                        Open
                      </a>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5">{formatWclDate(report.startTime ? new Date(report.startTime).toISOString() : null)}</span>
                    <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5">{report.durationMs ? formatDuration(report.durationMs) : 'Untracked duration'}</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border border-slate-800 bg-slate-950 p-2">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Kills</div>
                      <div className="mt-1 text-lg font-bold text-emerald-300">{report.bossKills || 0}</div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950 p-2">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Fights</div>
                      <div className="mt-1 text-lg font-bold text-slate-100">{report.totalFights || 0}</div>
                    </div>
                  </div>

                  {report.fights && report.fights.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Boss breakdown</div>
                      <div className="space-y-1">
                        {report.fights.slice(0, 5).map((fight, index) => (
                          <div key={`${report.id}-${index}`} className="flex items-center justify-between rounded border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-300">
                            <span>{fight.name || 'Unknown boss'}</span>
                            <span className={fight.kill ? 'text-emerald-300' : 'text-amber-300'}>{fight.kill ? 'Kill' : 'Wipe'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
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
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Wipefest</h3>
              <p className="text-sm text-slate-400">Raid review links with the Warcraft Logs report on the left and the manual wipefest thread on the right.</p>
            </div>

            {isAuthenticated && (
              <div className="flex flex-wrap items-center gap-2">
                {!isWipefestEditMode ? (
                  <button
                    type="button"
                    onClick={() => setIsWipefestEditMode(true)}
                    className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200 transition hover:bg-amber-500/20"
                  >
                    Enter Edit Mode
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleAddWipefestEntry}
                      className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200 transition hover:bg-amber-500/20"
                    >
                      Add Entry
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveWipefestChanges}
                      className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200 transition hover:bg-emerald-500/20"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleExitWipefestEditMode}
                      className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-200 transition hover:border-slate-500"
                    >
                      Exit Edit Mode
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {draftWipefestEntries.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900 p-4 text-sm text-slate-400">
              No wipefest entries yet. Use the WCL feed or create a new note with a raid date and title.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {draftWipefestEntries.map((entry) => (
                <article key={entry.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/50">
                  {isWipefestEditMode ? (
                    <div className="space-y-3">
                      <input
                        value={entry.raidDate || ''}
                        type="date"
                        onChange={event => updateWipefestEntry(entry.id, 'raidDate', event.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                      />
                      <input
                        value={entry.title || ''}
                        onChange={event => updateWipefestEntry(entry.id, 'title', event.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">{entry.raidDate ? formatWclDate(entry.raidDate) : 'No date'}</div>
                      <h4 className="mt-2 text-lg font-bold text-slate-100">{entry.title || 'Untitled raid'}</h4>
                    </>
                  )}

                  <div className="mt-4 space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Warcraft Logs</div>
                    {entry.logsUrl ? (
                      <a
                        href={entry.logsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-200 transition hover:bg-sky-500/15"
                      >
                        Open Logs
                      </a>
                    ) : (
                      <span className="inline-flex rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        No WCL link
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Wipefest</div>
                    {isWipefestEditMode ? (
                      <input
                        value={entry.wipefestUrl || ''}
                        onChange={event => updateWipefestEntry(entry.id, 'wipefestUrl', event.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                      />
                    ) : entry.wipefestUrl ? (
                      <a
                        href={entry.wipefestUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200 transition hover:bg-amber-500/15"
                      >
                        Open Wipefest
                      </a>
                    ) : (
                      <span className="inline-flex rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        No Wipefest link
                      </span>
                    )}
                  </div>

                  {isWipefestEditMode && (
                    <>
                      <div className="mt-4">
                        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Notes</div>
                        <textarea
                          value={entry.notes || ''}
                          onChange={event => updateWipefestEntry(entry.id, 'notes', event.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveWipefestEntry(entry.id)}
                          className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-red-200 transition hover:bg-red-500/20"
                        >
                          Remove Entry
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
