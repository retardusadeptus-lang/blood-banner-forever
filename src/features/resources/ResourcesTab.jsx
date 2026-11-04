import { useEffect, useMemo, useState } from 'react';
import BisConfigTab from '../../components/BisConfigTab';
import WeakaurasTab from './WeakaurasTab';
import { CHEAT_SHEET_PHASE_MAP, DEFAULT_GLOBAL_PHASE, PHASES } from '../../constants';
import { filterBossesByPhase } from '../../utils/bossFilterState.js';
import druidIcon from '../../assets/icons/druid.png';
import generalIcon from '../../assets/icons/general.png';
import healersIcon from '../../assets/icons/healers.png';
import hunterIcon from '../../assets/icons/hunter.png';
import mageIcon from '../../assets/icons/mage.png';
import meleeDpsIcon from '../../assets/icons/melee_dps.png';
import paladinIcon from '../../assets/icons/paladin.png';
import priestIcon from '../../assets/icons/priest.png';
import rangedDpsIcon from '../../assets/icons/ranged_dps.png';
import rogueIcon from '../../assets/icons/rogue.png';
import shamanIcon from '../../assets/icons/shaman.png';
import tanksIcon from '../../assets/icons/tanks.png';
import warlockIcon from '../../assets/icons/warlock.png';
import warriorIcon from '../../assets/icons/warrior.png';

const CHEAT_SHEET_STORAGE_KEY = 'cheat-sheet-data-v2';
const CHEAT_SHEET_PHASE_STORAGE_KEY = 'cheat-sheet-phase-v1';
const CHEAT_SHEET_EXPORT_FILENAME = 'cheat-sheet-export.json';

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  );
}

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

const TACTICS_ROLE_TAGS = [
  'General',
  'Healer',
  'Tank',
  'Ranged DPS',
  'Melee DPS',
];

const TACTICS_CLASS_TAGS = [
  'Druid',
  'Hunter',
  'Mage',
  'Paladin',
  'Priest',
  'Rogue',
  'Shaman',
  'Warlock',
  'Warrior',
];

const TACTICS_FILTER_TAGS = [...new Set([...TACTICS_ROLE_TAGS, ...TACTICS_CLASS_TAGS])];

const TACTICS_FILTER_ICONS = {
  General: generalIcon,
  Healer: healersIcon,
  Tank: tanksIcon,
  'Ranged DPS': rangedDpsIcon,
  'Melee DPS': meleeDpsIcon,
  Druid: druidIcon,
  Hunter: hunterIcon,
  Mage: mageIcon,
  Paladin: paladinIcon,
  Priest: priestIcon,
  Rogue: rogueIcon,
  Shaman: shamanIcon,
  Warlock: warlockIcon,
  Warrior: warriorIcon,
};

const normalizeTacticsTags = (value = []) => {
  let source = value;
  if (!Array.isArray(source) && typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      source = [];
    }
  }

  const normalized = (Array.isArray(source) ? source : [])
    .map(tag => String(tag || '').trim())
    .filter(Boolean)
    .map(tag => tag.replace(/\s+/g, ' '));

  return [...new Set(normalized.filter(tag => TACTICS_FILTER_TAGS.includes(tag)))];
};

const normalizeTacticsSectionItem = (item = {}, index = 0) => ({
  id: String(item?.id || `tactics-section-item-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
  text: String(item?.text || item?.content || '').trim(),
  tags: normalizeTacticsTags(Array.isArray(item?.tags) ? item.tags : []),
});

const normalizeTacticsSection = (section = {}, index = 0) => ({
  id: String(section?.id || `tactics-section-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
  title: String(section?.title || `Section ${index + 1}`).trim(),
  items: Array.isArray(section?.items)
    ? section.items.map((item, itemIndex) => normalizeTacticsSectionItem(item, itemIndex)).filter(item => item.text || item.tags.length > 0)
    : [],
});

const normalizeTacticsSections = (source = []) => {
  let parsed = source;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = [];
    }
  }

  if (!Array.isArray(parsed)) return [];
  return parsed.map((section, index) => normalizeTacticsSection(section, index));
};

const getTacticEntryFilterTags = (entry = {}) => {
  const sectionItemTags = (Array.isArray(entry?.sections) ? entry.sections : []).flatMap(section => (Array.isArray(section?.items) ? section.items : []).flatMap(item => Array.isArray(item?.tags) ? item.tags : []));
  return [...new Set([...normalizeTacticsTags(Array.isArray(entry?.tags) ? entry.tags : []), ...sectionItemTags])];
};

const normalizeTacticsEntry = (entry = {}) => ({
  bossName: String(entry.bossName || entry.boss_name || '').trim(),
  notes: String(entry.notes || '').trim(),
  tags: normalizeTacticsTags(Array.isArray(entry.tags) ? entry.tags : Array.isArray(entry.tags_json) ? entry.tags_json : (typeof entry.tags_json === 'string' ? entry.tags_json : [])),
  sections: normalizeTacticsSections(Array.isArray(entry.sections) ? entry.sections : (Array.isArray(entry.sections_json) ? entry.sections_json : entry.sections_json)),
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
  if (typeof window === 'undefined') return [];

  const saved = window.localStorage.getItem(CHEAT_SHEET_STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(normalizeBoss);
  } catch (error) {
    console.warn('Failed to parse cheat sheet saved data:', error);
  }

  return [];
};

const CHEAT_SHEET_PHASE_OPTIONS = ['All Phases', ...PHASES];

const loadCheatSheetPhase = () => {
  if (typeof window === 'undefined') return DEFAULT_GLOBAL_PHASE;
  const savedPhase = window.localStorage.getItem(CHEAT_SHEET_PHASE_STORAGE_KEY);
  return CHEAT_SHEET_PHASE_OPTIONS.includes(savedPhase) ? savedPhase : DEFAULT_GLOBAL_PHASE;
};

function BossFilterSelector({ raidZones = [], enabledBosses = [], userBossFilter = null, setUserBossFilter, label = 'Boss Selector' }) {
  const [open, setOpen] = useState(false);

  const isBossVisible = (bossName) => {
    if (userBossFilter === null || userBossFilter === undefined) return true;
    return userBossFilter.includes(bossName);
  };

  const toggleBoss = (bossName, checked) => {
    if (!setUserBossFilter) return;
    setUserBossFilter(prev => {
      const current = Array.isArray(prev) ? prev : null;
      if (current === null) {
        return checked ? [bossName] : [];
      }
      if (checked) {
        return [...new Set([...current, bossName])];
      }
      return current.filter(name => name !== bossName);
    });
  };

  const allZoneBosses = useMemo(() => {
    if (Array.isArray(raidZones) && raidZones.length > 0) {
      return raidZones.flatMap(zone => Array.isArray(zone?.bosses) ? zone.bosses : []);
    }
    return enabledBosses;
  }, [raidZones, enabledBosses]);

  const toggleZoneBosses = (zoneBosses, checked) => {
    if (!setUserBossFilter) return;
    setUserBossFilter(prev => {
      const current = Array.isArray(prev) ? prev : null;
      const nextSet = new Set(current ?? []);

      if (checked) {
        zoneBosses.forEach(boss => nextSet.add(boss));
        return [...nextSet];
      }

      zoneBosses.forEach(boss => nextSet.delete(boss));
      return [...nextSet];
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:border-purple-500 transition"
      >
        {label} ({userBossFilter === null || userBossFilter === undefined ? allZoneBosses.length : Math.min(userBossFilter.length, allZoneBosses.length)}/{allZoneBosses.length})
        <span className="text-slate-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-20 w-80 max-h-96 overflow-y-auto custom-scrollbar bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-3 space-y-2">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Visible bosses</span>
              <button
                type="button"
                onClick={() => setUserBossFilter?.(null)}
                className="text-[10px] font-bold text-amber-300 hover:text-amber-200"
              >
                All
              </button>
            </div>
            {raidZones.map(zone => {
              const zoneBosses = zone.bosses || [];
              const zoneBossesEnabled = zoneBosses.filter(boss => isBossVisible(boss)).length;
              const allEnabled = zoneBosses.length > 0 && zoneBossesEnabled === zoneBosses.length;
              const someEnabled = zoneBossesEnabled > 0 && !allEnabled;

              return (
                <div key={zone.name} className="border-b border-slate-900 last:border-0 pb-1.5 mb-1.5">
                  <label className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-slate-900/60">
                    <input
                      type="checkbox"
                      checked={allEnabled}
                      ref={el => { if (el) el.indeterminate = someEnabled; }}
                      onChange={(event) => toggleZoneBosses(zoneBosses, event.target.checked)}
                      className="rounded bg-slate-800 border-slate-600 text-amber-500 w-3.5 h-3.5 cursor-pointer flex-shrink-0"
                    />
                    <span className="text-sm font-bold text-slate-200">{zone.name}</span>
                  </label>
                  <div className="pl-7 space-y-0.5 mt-0.5">
                    {zoneBosses.map(boss => (
                      <label key={boss} className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-slate-900/60">
                        <input
                          type="checkbox"
                          checked={isBossVisible(boss)}
                          onChange={(event) => toggleBoss(boss, event.target.checked)}
                          className="rounded bg-slate-800 border-slate-600 text-amber-500 w-3.5 h-3.5 cursor-pointer flex-shrink-0"
                        />
                        <span className="text-xs text-slate-200">{boss}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
            {((!raidZones || raidZones.length === 0) && Array.isArray(enabledBosses)) && enabledBosses.map((boss) => (
              <label key={boss} className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-slate-900/60">
                <input
                  type="checkbox"
                  checked={isBossVisible(boss)}
                  onChange={(event) => toggleBoss(boss, event.target.checked)}
                  className="rounded bg-slate-800 border-slate-600 text-amber-500 w-3.5 h-3.5 cursor-pointer flex-shrink-0"
                />
                <span className="text-xs text-slate-200">{boss}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ResourcesTab({
  resourcesSubTab,
  selectedBisSpec,
  setSelectedBisSpec,
  masterItemsDbPhase,
  setMasterItemsDbPhase,
  specsFromDb,
  renderItemSlot,
  specsByName,
  renderItemLink,
  mutableItems,
  dbBisPriorities,
  fetchData,
  postData,
  putData,
  deleteData,
  canSubmitWeakauras,
  canManageWeakauraSections,
  canManageCheatSheetJson = false,
  isAuthenticated = false,
  enabledBosses = [],
  raidZones = [],
  userBossFilter = null,
  setUserBossFilter,
  defaultPhase = DEFAULT_GLOBAL_PHASE,
  roster = [],
  selectedCharacterId = '',
  siteTabMetadata
}) {
  const activeResourcesSubTab = siteTabMetadata?.contentOwner === 'ResourcesTab'
    ? siteTabMetadata.route?.subTab || resourcesSubTab
    : resourcesSubTab;
  const [bosses, setBosses] = useState(loadCheatSheetBosses);
  const [draftBosses, setDraftBosses] = useState(bosses);
  const [isEditMode, setIsEditMode] = useState(false);
  const [internalSelectedRaid, setInternalSelectedRaid] = useState('All Raids');
  const [internalSelectedPhase, setInternalSelectedPhase] = useState(loadCheatSheetPhase);
  const selectedRaid = internalSelectedRaid;
  const selectedPhase = internalSelectedPhase;
  const setSelectedRaid = setInternalSelectedRaid;
  const setSelectedPhase = setInternalSelectedPhase;
  const [recentReports, setRecentReports] = useState([]);
  const [recentReportsError, setRecentReportsError] = useState('');
  const [isTacticsEditMode, setIsTacticsEditMode] = useState(false);
  const [raidTacticsBossOrder, setRaidTacticsBossOrder] = useState([]);
  const [raidTacticsDraft, setRaidTacticsDraft] = useState({});
  const [raidTacticsSaved, setRaidTacticsSaved] = useState({});
  const [tacticsSelectedTags, setTacticsSelectedTags] = useState([]);
  const [showTacticsMineOnly, setShowTacticsMineOnly] = useState(false);
  const [tacticsError, setTacticsError] = useState('');
  const [wipefestEntries, setWipefestEntries] = useState([]);
  const [draftWipefestEntries, setDraftWipefestEntries] = useState([]);
  const [isWipefestEditMode, setIsWipefestEditMode] = useState(false);
  const [deletedWipefestEntryIds, setDeletedWipefestEntryIds] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CHEAT_SHEET_STORAGE_KEY, JSON.stringify(bosses));
    }
  }, [bosses]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CHEAT_SHEET_PHASE_STORAGE_KEY, selectedPhase);
    }
  }, [selectedPhase]);

  const tacticsBossOptions = useMemo(() => {
    const availableBosses = Array.isArray(raidZones) && raidZones.length > 0
      ? raidZones.flatMap(zone => Array.isArray(zone?.bosses) ? zone.bosses : [])
      : Array.isArray(enabledBosses) ? enabledBosses : [];

    return [...new Set(availableBosses.filter(Boolean))];
  }, [raidZones, enabledBosses]);

  useEffect(() => {
    if (activeResourcesSubTab !== 'tactics' || (userBossFilter !== null && userBossFilter !== undefined) || !setUserBossFilter || tacticsBossOptions.length === 0) return;
    setUserBossFilter(filterBossesByPhase({
      bossNames: tacticsBossOptions,
      raidZones,
      phase: defaultPhase,
    }));
  }, [activeResourcesSubTab, defaultPhase, raidZones, setUserBossFilter, tacticsBossOptions, userBossFilter]);

  const selectedMyCharacter = useMemo(() => {
    if (!selectedCharacterId) return null;
    return roster.find(player => String(player.id) === String(selectedCharacterId)) || null;
  }, [roster, selectedCharacterId]);

  const selectedMyClass = useMemo(() => {
    const className = selectedMyCharacter?.class || selectedMyCharacter?.className || selectedMyCharacter?.playerClass || '';
    return String(className).trim();
  }, [selectedMyCharacter]);

  const classTagForCharacter = (className) => {
    if (!className) return null;
    const normalized = String(className).trim();
    if (!normalized) return null;

    const lookup = normalized.toLowerCase();
    const match = TACTICS_CLASS_TAGS.find(tag => tag.toLowerCase() === lookup || lookup.includes(tag.toLowerCase()));
    return match || null;
  };

  const roleTagsForCharacter = (className) => {
    const normalized = String(className || '').trim().toLowerCase();
    if (!normalized) return ['General'];

    const classMap = {
      druid: ['General', 'Healer', 'Tank', 'Melee DPS'],
      hunter: ['General', 'Ranged DPS'],
      mage: ['General', 'Ranged DPS'],
      paladin: ['General', 'Healer', 'Tank', 'Melee DPS'],
      priest: ['General', 'Healer'],
      rogue: ['General', 'Melee DPS'],
      shaman: ['General', 'Healer', 'Ranged DPS'],
      warlock: ['General', 'Ranged DPS'],
      warrior: ['General', 'Tank', 'Melee DPS'],
    };

    const match = Object.entries(classMap).find(([key]) => normalized.includes(key));
    return match ? match[1] : ['General'];
  };

  const activeTacticsTags = useMemo(() => {
    if (!showTacticsMineOnly || !selectedMyClass) {
      return tacticsSelectedTags;
    }

    const mineClassTag = classTagForCharacter(selectedMyClass);
    const mineRoleTags = roleTagsForCharacter(selectedMyClass);
    const nextSet = new Set([...tacticsSelectedTags, ...mineRoleTags]);
    if (mineClassTag) {
      nextSet.add(mineClassTag);
    }
    nextSet.add('General');
    return [...nextSet];
  }, [showTacticsMineOnly, selectedMyClass, tacticsSelectedTags]);

  const tacticsBossNamesForSave = useMemo(() => {
    return [...new Set([
      ...(Array.isArray(raidTacticsBossOrder) ? raidTacticsBossOrder : []),
      ...(Array.isArray(tacticsBossOptions) ? tacticsBossOptions : []),
    ])].filter(bossName => tacticsBossOptions.includes(bossName));
  }, [raidTacticsBossOrder, tacticsBossOptions]);

  const filteredRaidTacticsBossOrder = useMemo(() => {
    const allAvailableBosses = [...new Set(tacticsBossNamesForSave)];
    const filteredByBoss = (userBossFilter === null || userBossFilter === undefined)
      ? allAvailableBosses
      : allAvailableBosses.filter((bossName) => userBossFilter.includes(bossName));

    if (activeTacticsTags.length === 0) {
      return filteredByBoss;
    }

    return filteredByBoss.filter((bossName) => {
      const entry = raidTacticsDraft[bossName] || raidTacticsSaved[bossName] || { tags: [], sections: [] };
      const tags = getTacticEntryFilterTags(entry);
      return activeTacticsTags.some(tag => tags.includes(tag));
    });
  }, [tacticsBossNamesForSave, userBossFilter, raidTacticsSaved, raidTacticsDraft, activeTacticsTags]);

  const renderTacticTagIcon = (tag, className = '') => {
    const iconSrc = TACTICS_FILTER_ICONS[tag];
    if (!iconSrc) {
      return (
        <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-[8px] font-bold text-slate-300 ${className}`}>
          G
        </span>
      );
    }

    return (
      <img
        src={iconSrc}
        alt={tag}
        className={`h-4 w-4 rounded-full object-contain ${className}`}
        title={tag}
      />
    );
  };

  useEffect(() => {
    if (activeResourcesSubTab !== 'tactics') return undefined;

    let isMounted = true;
    const loadTactics = async () => {
      try {
        const payload = await fetchData('tactics').catch(() => ({ bossOrder: [], entries: [] }));

        if (!isMounted) return;

        const byBoss = {};
        (Array.isArray(payload?.entries) ? payload.entries : []).forEach((entry) => {
          const normalized = normalizeTacticsEntry(entry);
          if (normalized.bossName) {
            byBoss[normalized.bossName] = normalized;
          }
        });

        const managedBosses = new Set(tacticsBossOptions);
        const fallbackBossOrder = [...new Set([
          ...(Array.isArray(payload?.bossOrder) ? payload.bossOrder : []),
          ...tacticsBossOptions,
        ])].filter(bossName => managedBosses.has(bossName));

        const bossOrder = Array.isArray(payload?.bossOrder) && payload.bossOrder.length > 0
          ? payload.bossOrder.filter(bossName => managedBosses.has(bossName))
          : fallbackBossOrder;

        const nextDraft = {};
        bossOrder.forEach((bossName) => {
          const saved = byBoss[bossName] || { bossName, notes: '', media: [], sections: [] };
          nextDraft[bossName] = {
            bossName,
            notes: saved.notes || '',
            tags: Array.isArray(saved.tags) ? saved.tags : [],
            sections: Array.isArray(saved.sections) ? saved.sections : [],
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
  }, [activeResourcesSubTab, fetchData, tacticsBossOptions]);

  useEffect(() => {
    if (activeResourcesSubTab !== 'wipefest') return undefined;

    let isMounted = true;
    const loadWipefestEntries = async () => {
      try {
        const payload = await fetchData('wipefest');
        if (!isMounted) return;
        const entries = Array.isArray(payload) ? payload.map((entry) => normalizeWipefestEntry(entry)) : [];
        setWipefestEntries(entries);
        setDraftWipefestEntries(entries);
        setDeletedWipefestEntryIds([]);
      } catch {
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
  }, [activeResourcesSubTab, fetchData]);

  useEffect(() => {
    if (activeResourcesSubTab !== 'raidlogs') return undefined;

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
  }, [activeResourcesSubTab, fetchData]);

  const cheatSheetRaidOptions = useMemo(() => {
    const sourceBosses = isEditMode ? draftBosses : bosses;
    const raids = [...new Set((sourceBosses || []).map(boss => boss.raid).filter(Boolean))]
      .filter(raid => selectedPhase === 'All Phases' || getPhaseFromRaid(raid) === selectedPhase)
      .sort((a, b) => a.localeCompare(b));
    return ['All Raids', ...raids];
  }, [bosses, draftBosses, isEditMode, selectedPhase]);

  const effectiveSelectedRaid = cheatSheetRaidOptions.includes(selectedRaid) ? selectedRaid : 'All Raids';

  const filteredBosses = useMemo(() => {
    const sourceBosses = isEditMode ? draftBosses : bosses;

    return [...(sourceBosses || [])]
      .filter(boss => {
        if (!isEditMode && boss.hidden) return false;
        const matchesRaid = effectiveSelectedRaid === 'All Raids' || boss.raid === effectiveSelectedRaid;
        const bossPhase = getPhaseFromRaid(boss.raid);
        const matchesPhase = selectedPhase === 'All Phases' || bossPhase === selectedPhase;
        return matchesRaid && matchesPhase;
      })
      .sort((a, b) => Number(Boolean(a.hidden)) - Number(Boolean(b.hidden)));
  }, [bosses, draftBosses, effectiveSelectedRaid, isEditMode, selectedPhase]);

  useEffect(() => {
    if (activeResourcesSubTab !== 'cheatsheets' || typeof window === 'undefined') return undefined;

    let cancelled = false;
    const refreshWowheadLinks = () => {
      if (!cancelled && window.$WowheadPower?.refreshLinks) {
        window.$WowheadPower.refreshLinks();
      }
    };

    const frame = window.requestAnimationFrame(refreshWowheadLinks);
    const timer = window.setTimeout(refreshWowheadLinks, 120);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [activeResourcesSubTab, filteredBosses, selectedPhase, effectiveSelectedRaid]);

  const currentBosses = isEditMode ? draftBosses : bosses;
  const hasPendingChanges = JSON.stringify(draftBosses) !== JSON.stringify(bosses);

  const handleSaveChanges = () => {
    const normalizedBosses = draftBosses.map(normalizeBoss);
    setBosses(normalizedBosses);
    setDraftBosses(normalizedBosses);
    setIsEditMode(false);
  };

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
          [sectionKey]: !existingSections[sectionKey],
        },
      };
    }));
  };

  const handleHideBossCard = (bossId) => {
    setDraftBosses(prev => prev.map(boss => {
      if (boss.boss_id !== bossId) return boss;
      return { ...boss, hidden: !boss.hidden };
    }));
  };

  const handleAddBossCard = () => {
    const newBoss = normalizeBoss({
      boss_id: `new-boss-${Date.now()}`,
      name: 'New Boss',
      raid: effectiveSelectedRaid !== 'All Raids' ? effectiveSelectedRaid : 'Karazhan',
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

  const buildTacticsDraftEntry = (currentEntry = {}, overrides = {}) => ({
    bossName: overrides.bossName ?? currentEntry.bossName ?? '',
    notes: overrides.notes ?? currentEntry.notes ?? '',
    tags: Array.isArray(overrides.tags) ? overrides.tags : Array.isArray(currentEntry.tags) ? currentEntry.tags : [],
    sections: Array.isArray(overrides.sections) ? overrides.sections : Array.isArray(currentEntry.sections) ? currentEntry.sections : [],
    media: Array.isArray(overrides.media) ? overrides.media : Array.isArray(currentEntry.media) ? currentEntry.media : [],
  });

  const handleTacticsFieldChange = (bossName, field, value) => {
    setRaidTacticsDraft(prev => ({
      ...prev,
      [bossName]: buildTacticsDraftEntry(prev[bossName], {
        bossName,
        notes: field === 'notes' ? value : prev[bossName]?.notes || '',
        tags: prev[bossName]?.tags || [],
        sections: prev[bossName]?.sections || [],
        media: prev[bossName]?.media || [],
      }),
    }));
  };

  const handleAddTacticsSection = (bossName) => {
    setRaidTacticsDraft(prev => ({
      ...prev,
      [bossName]: buildTacticsDraftEntry(prev[bossName], {
        bossName,
        notes: prev[bossName]?.notes || '',
        tags: prev[bossName]?.tags || [],
        sections: [
          ...(prev[bossName]?.sections || []),
          {
            id: `tactics-section-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            title: `Section ${((prev[bossName]?.sections || []).length + 1)}`,
            items: [],
          },
        ],
        media: prev[bossName]?.media || [],
      }),
    }));
  };

  const handleAddTacticsLineItem = (bossName, sectionId) => {
    setRaidTacticsDraft(prev => ({
      ...prev,
      [bossName]: buildTacticsDraftEntry(prev[bossName], {
        bossName,
        notes: prev[bossName]?.notes || '',
        tags: prev[bossName]?.tags || [],
        sections: (prev[bossName]?.sections || []).map(section => section.id === sectionId ? {
          ...section,
          items: [
            ...(section.items || []),
            {
              id: `tactics-line-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              text: '',
              tags: [],
            },
          ],
        } : section),
        media: prev[bossName]?.media || [],
      }),
    }));
  };

  const handleUpdateTacticsSection = (bossName, sectionId, field, value) => {
    setRaidTacticsDraft(prev => ({
      ...prev,
      [bossName]: buildTacticsDraftEntry(prev[bossName], {
        bossName,
        notes: prev[bossName]?.notes || '',
        tags: prev[bossName]?.tags || [],
        sections: (prev[bossName]?.sections || []).map(section => section.id === sectionId ? { ...section, [field]: value } : section),
        media: prev[bossName]?.media || [],
      }),
    }));
  };

  const handleUpdateTacticsLineItem = (bossName, sectionId, itemId, field, value) => {
    setRaidTacticsDraft(prev => ({
      ...prev,
      [bossName]: buildTacticsDraftEntry(prev[bossName], {
        bossName,
        notes: prev[bossName]?.notes || '',
        tags: prev[bossName]?.tags || [],
        sections: (prev[bossName]?.sections || []).map(section => section.id === sectionId ? {
          ...section,
          items: (section.items || []).map(item => item.id === itemId ? { ...item, [field]: value } : item),
        } : section),
        media: prev[bossName]?.media || [],
      }),
    }));
  };

  const handleRemoveTacticsSection = (bossName, sectionId) => {
    setRaidTacticsDraft(prev => ({
      ...prev,
      [bossName]: buildTacticsDraftEntry(prev[bossName], {
        bossName,
        notes: prev[bossName]?.notes || '',
        tags: prev[bossName]?.tags || [],
        sections: (prev[bossName]?.sections || []).filter(section => section.id !== sectionId),
        media: prev[bossName]?.media || [],
      }),
    }));
  };

  const handleRemoveTacticsLineItem = (bossName, sectionId, itemId) => {
    setRaidTacticsDraft(prev => ({
      ...prev,
      [bossName]: buildTacticsDraftEntry(prev[bossName], {
        bossName,
        notes: prev[bossName]?.notes || '',
        tags: prev[bossName]?.tags || [],
        sections: (prev[bossName]?.sections || []).map(section => section.id === sectionId ? { ...section, items: (section.items || []).filter(item => item.id !== itemId) } : section),
        media: prev[bossName]?.media || [],
      }),
    }));
  };

  const handleTacticsMediaChange = (bossName, mediaId, field, value) => {
    setRaidTacticsDraft(prev => ({
      ...prev,
      [bossName]: buildTacticsDraftEntry(prev[bossName], {
        bossName,
        notes: prev[bossName]?.notes || '',
        tags: prev[bossName]?.tags || [],
        sections: prev[bossName]?.sections || [],
        media: (prev[bossName]?.media || []).map(item => (
          item.id === mediaId ? { ...item, [field]: value } : item
        )),
      }),
    }));
  };

  const handleAddTacticsMedia = (bossName) => {
    setRaidTacticsDraft(prev => ({
      ...prev,
      [bossName]: buildTacticsDraftEntry(prev[bossName], {
        bossName,
        notes: prev[bossName]?.notes || '',
        tags: prev[bossName]?.tags || [],
        sections: prev[bossName]?.sections || [],
        media: [
          ...(prev[bossName]?.media || []),
          {
            id: `tactics-media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            type: 'image',
            url: '',
            label: 'New item',
          }
        ],
      }),
    }));
  };

  const handleRemoveTacticsMedia = (bossName, mediaId) => {
    setRaidTacticsDraft(prev => ({
      ...prev,
      [bossName]: buildTacticsDraftEntry(prev[bossName], {
        bossName,
        notes: prev[bossName]?.notes || '',
        tags: prev[bossName]?.tags || [],
        sections: prev[bossName]?.sections || [],
        media: (prev[bossName]?.media || []).filter(item => item.id !== mediaId),
      }),
    }));
  };

  const hasTacticsDirtyChanges = useMemo(() => {
    return JSON.stringify(raidTacticsDraft) !== JSON.stringify(raidTacticsSaved);
  }, [raidTacticsDraft, raidTacticsSaved]);

  const handleSaveTacticsChanges = async () => {
    if (!isAuthenticated) {
      window.alert('Officer login required to save raid tactics.');
      return;
    }

    try {
      const bossNames = tacticsBossNamesForSave;
      for (const bossName of bossNames) {
        const draftEntry = raidTacticsDraft[bossName] || raidTacticsSaved[bossName] || { bossName, notes: '', tags: [], sections: [], media: [] };
        const sanitizedMedia = (draftEntry.media || []).map((item, index) => normalizeTacticsMediaItem(item, index)).filter(Boolean);
        await putData(`tactics/${encodeURIComponent(bossName)}`, {
          bossName,
          notes: draftEntry.notes || '',
          tags: normalizeTacticsTags(draftEntry.tags || []),
          sections: Array.isArray(draftEntry.sections) ? draftEntry.sections.map(section => ({
            id: section.id,
            title: section.title || 'Section',
            items: Array.isArray(section.items) ? section.items.map(item => ({
              id: item.id,
              text: item.text || '',
              tags: normalizeTacticsTags(item.tags || []),
            })) : [],
          })) : [],
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

      setRaidTacticsBossOrder([...new Set([...tacticsBossNamesForSave, ...Object.keys(nextMap)])]);
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
    <div data-site-tab-id={siteTabMetadata?.id} data-site-tab-group={siteTabMetadata?.groupKey} className="space-y-4">
      {activeResourcesSubTab === 'bis' && (
        <BisConfigTab
          selectedBisSpec={selectedBisSpec}
          setSelectedBisSpec={setSelectedBisSpec}
          masterItemsDbPhase={masterItemsDbPhase}
          setMasterItemsDbPhase={setMasterItemsDbPhase}
          specsFromDb={specsFromDb}
          renderItemSlot={renderItemSlot}
          specsByName={specsByName}
          renderItemLink={renderItemLink}
          mutableItems={mutableItems}
          dbBisPriorities={dbBisPriorities}
        />
      )}

      {activeResourcesSubTab === 'tactics' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="text-lg font-bold text-slate-100">Raid Tactics</h3>
              <p className="text-sm text-slate-400">Boss-by-boss notes, references, and media kept in the same order as the raid assignment boss list.</p>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2 md:justify-end">
              {setUserBossFilter && (
                <BossFilterSelector
                  raidZones={raidZones}
                  enabledBosses={tacticsBossOptions}
                  userBossFilter={userBossFilter}
                  setUserBossFilter={setUserBossFilter}
                />
              )}

              <button
                type="button"
                onClick={() => setShowTacticsMineOnly(prev => !prev)}
                className={`rounded-lg border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition ${showTacticsMineOnly ? 'border-sky-500/60 bg-sky-500/10 text-sky-200' : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500'}`}
                title={selectedMyClass ? `Show tactics tagged for ${selectedMyClass}` : 'Select your character to use Show Mine'}
              >
                Show Mine
              </button>

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
                        disabled={!hasTacticsDirtyChanges}
                        className={`rounded-lg border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition ${hasTacticsDirtyChanges ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20' : 'cursor-not-allowed border-slate-700 bg-slate-800 text-slate-500'}`}
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

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Filter by tag</div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {TACTICS_ROLE_TAGS.map(tag => {
                  const active = activeTacticsTags.includes(tag);
                  const iconSrc = TACTICS_FILTER_ICONS[tag];
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setTacticsSelectedTags(prev => prev.includes(tag) ? prev.filter(value => value !== tag) : [...prev, tag])}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition ${active ? 'border-emerald-500/70 bg-emerald-500/20 text-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]' : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'}`}
                    >
                      {iconSrc ? (
                        <img src={iconSrc} alt="" className="h-4 w-4 object-contain" />
                      ) : (
                        <span aria-hidden="true" className="text-[12px]">•</span>
                      )}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {TACTICS_CLASS_TAGS.map(tag => {
                  const active = activeTacticsTags.includes(tag);
                  const iconSrc = TACTICS_FILTER_ICONS[tag];
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setTacticsSelectedTags(prev => prev.includes(tag) ? prev.filter(value => value !== tag) : [...prev, tag])}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition ${active ? 'border-emerald-500/70 bg-emerald-500/20 text-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]' : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'}`}
                    >
                      {iconSrc ? (
                        <img src={iconSrc} alt="" className="h-4 w-4 object-contain" />
                      ) : (
                        <span aria-hidden="true" className="text-[12px]">•</span>
                      )}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

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
                  <details key={bossName} open className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                    <summary className="mb-3 flex cursor-pointer list-none items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span aria-hidden="true" className="bank-section-indicator inline-block transition-transform duration-150 text-slate-500">&gt;</span>
                        <h4 className="text-base font-bold text-slate-100">{bossName}</h4>
                      </div>
                      {isAuthenticated && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleAddTacticsMedia(bossName);
                          }}
                          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200 transition hover:bg-amber-500/20"
                        >
                          Add Media
                        </button>
                      )}
                    </summary>

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

                        <div className="mt-4">
                          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Role tags</div>
                          <div className="flex flex-wrap gap-2">
                            {TACTICS_ROLE_TAGS.map(tag => {
                              const active = (draftEntry.tags || []).includes(tag);
                              return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => {
                                    const nextTags = active
                                      ? (draftEntry.tags || []).filter(value => value !== tag)
                                      : [...(draftEntry.tags || []), tag];
                                    setRaidTacticsDraft(prev => ({
                                      ...prev,
                                      [bossName]: {
                                        bossName,
                                        notes: prev[bossName]?.notes || '',
                                        tags: nextTags,
                                        sections: prev[bossName]?.sections || [],
                                        media: prev[bossName]?.media || [],
                                      },
                                    }));
                                  }}
                                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition ${active ? 'border-amber-500/60 bg-amber-500/15 text-amber-200' : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'}`}
                                >
                                  {tag}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-3">
                          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Sections</div>
                          <button
                            type="button"
                            onClick={() => handleAddTacticsSection(bossName)}
                            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200 transition hover:bg-amber-500/20"
                          >
                            Add Section
                          </button>
                        </div>

                        <div className="mt-4 space-y-4">
                          {(draftEntry.sections || []).length === 0 ? (
                            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-400">
                              No sections yet. Add a section to start building role-specific boss notes.
                            </div>
                          ) : (
                            (draftEntry.sections || []).map((section) => (
                              <div key={section.id} className="rounded-lg border border-slate-700 bg-slate-950/70 p-3">
                                <div className="mb-3 flex items-center justify-between gap-2">
                                  <input
                                    value={section.title || ''}
                                    onChange={(event) => handleUpdateTacticsSection(bossName, section.id, 'title', event.target.value)}
                                    placeholder="Section title"
                                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTacticsSection(bossName, section.id)}
                                    className="rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-red-200 transition hover:bg-red-500/20"
                                  >
                                    Remove
                                  </button>
                                </div>

                                <div className="space-y-3">
                                  {(section.items || []).map((item) => (
                                    <div key={item.id} className="rounded-lg border border-slate-700 bg-slate-900/80 p-3">
                                      <div className="mb-2 flex items-center justify-between gap-2">
                                        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Line item</div>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveTacticsLineItem(bossName, section.id, item.id)}
                                          className="rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-red-200 transition hover:bg-red-500/20"
                                        >
                                          Remove item
                                        </button>
                                      </div>
                                      <textarea
                                        value={item.text || ''}
                                        onChange={(event) => handleUpdateTacticsLineItem(bossName, section.id, item.id, 'text', event.target.value)}
                                        placeholder="Write the step, assignment, or callout for this section..."
                                        className="min-h-[64px] w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                                      />
                                      <div className="mt-3">
                                        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Assigned tags</div>
                                        <div className="flex flex-wrap gap-2">
                                          {TACTICS_FILTER_TAGS.map(tag => {
                                            const active = (item.tags || []).includes(tag);
                                            return (
                                              <button
                                                key={`${section.id}-${item.id}-${tag}`}
                                                type="button"
                                                onClick={() => {
                                                  const nextTags = active
                                                    ? (item.tags || []).filter(value => value !== tag)
                                                    : [...(item.tags || []), tag];
                                                  handleUpdateTacticsLineItem(bossName, section.id, item.id, 'tags', nextTags);
                                                }}
                                                className={`rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] transition ${active ? 'border-emerald-500/70 bg-emerald-500/20 text-emerald-100' : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'}`}
                                              >
                                                {tag}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-3 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleAddTacticsLineItem(bossName, section.id)}
                                    className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200 transition hover:bg-sky-500/20"
                                  >
                                    Add Line Item
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

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
                        {(draftEntry.tags || []).length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-2">
                            {draftEntry.tags.map(tag => (
                              <span key={tag} className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-200">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {draftEntry.notes ? (
                          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{draftEntry.notes}</p>
                        ) : (
                          <p className="text-sm text-slate-500 italic">No tactic notes saved for this boss yet.</p>
                        )}

                        {(draftEntry.sections || []).length > 0 && (
                          <div className="space-y-4 pt-3">
                            {(draftEntry.sections || []).map((section) => (
                              <div key={section.id} className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                                {section.title && (
                                  <div className="mb-2 text-sm font-bold text-slate-100">{section.title}</div>
                                )}
                                <div className="space-y-2">
                                  {((section.items || []).filter(item => activeTacticsTags.length === 0 || (item.tags || []).some(tag => activeTacticsTags.includes(tag))).length === 0) ? (
                                    <div className="rounded-md border border-dashed border-slate-700 bg-slate-900/40 p-2.5 text-xs text-slate-500">
                                      No matching line items for the current tag filters.
                                    </div>
                                  ) : (
                                    (section.items || [])
                                      .filter(item => activeTacticsTags.length === 0 || (item.tags || []).some(tag => activeTacticsTags.includes(tag)))
                                      .map((item) => (
                                        <div key={item.id} className="rounded-md border border-slate-800 bg-slate-900/70 p-2.5">
                                          <div className="flex items-start gap-2.5">
                                            {(item.tags || []).length > 0 && (
                                              <div className="mt-0.5 flex shrink-0 items-center gap-1 rounded-full border border-slate-700 bg-slate-950/80 px-1.5 py-1">
                                                {(item.tags || []).map(tag => (
                                                  <div key={`${section.id}-${item.id}-${tag}`} className="flex items-center justify-center">
                                                    {renderTacticTagIcon(tag, 'h-3.5 w-3.5')}
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                            <div className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.text || 'Empty line item.'}</div>
                                          </div>
                                        </div>
                                      ))
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
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
                                } catch {
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
                  </details>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeResourcesSubTab === 'weakauras' && (
        <WeakaurasTab
          fetchData={fetchData}
          postData={postData}
          canSubmit={canSubmitWeakauras}
          canManageSections={canManageWeakauraSections}
        />
      )}

      {activeResourcesSubTab === 'cheatsheets' && (
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
                  value={effectiveSelectedRaid}
                  onChange={event => setSelectedRaid(event.target.value)}
                >
                  {cheatSheetRaidOptions.map(raid => (
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
                      {canManageCheatSheetJson && (
                        <>
                          <button
                            type="button"
                            onClick={handleExportCheatSheetJson}
                            aria-label="Copy Cheat Sheet JSON"
                            title="Copy Cheat Sheet JSON"
                            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2 text-emerald-200 transition hover:bg-emerald-500/20"
                          >
                            <CopyIcon />
                          </button>
                          <label
                            aria-label="Upload Cheat Sheet JSON"
                            title="Upload Cheat Sheet JSON"
                            className="cursor-pointer rounded-lg border border-sky-500/40 bg-sky-500/10 p-2 text-sky-200 transition hover:bg-sky-500/20"
                          >
                            <UploadIcon />
                            <input type="file" accept="application/json" className="hidden" onChange={handleImportCheatSheetJson} />
                          </label>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsEditMode(true)}
                        className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200 transition hover:bg-amber-500/20"
                      >
                        Enter Edit Mode
                      </button>
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
                      {canManageCheatSheetJson && (
                        <>
                          <button
                            type="button"
                            onClick={handleExportCheatSheetJson}
                            aria-label="Copy Cheat Sheet JSON"
                            title="Copy Cheat Sheet JSON"
                            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2 text-emerald-200 transition hover:bg-emerald-500/20"
                          >
                            <CopyIcon />
                          </button>
                          <label
                            aria-label="Upload Cheat Sheet JSON"
                            title="Upload Cheat Sheet JSON"
                            className="cursor-pointer rounded-lg border border-sky-500/40 bg-sky-500/10 p-2 text-sky-200 transition hover:bg-sky-500/20"
                          >
                            <UploadIcon />
                            <input type="file" accept="application/json" className="hidden" onChange={handleImportCheatSheetJson} />
                          </label>
                        </>
                      )}
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
                            <span className={`rounded-full border px-2 py-2 text-[10px] font-bold uppercase tracking-[0.12em] ${boss.tauntable ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-red-500/40 bg-red-500/10 text-red-300'}`}>
                              {boss.tauntable ? 'Tauntable' : 'Not Tauntable'}
                            </span>
                            <span className={`rounded-full border px-2 py-2 text-[10px] font-bold uppercase tracking-[0.12em] ${boss.dual_wield ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
                              {boss.dual_wield ? 'Dual Wield' : (
                                <span className="relative inline-block after:absolute after:left-0 after:right-0 after:top-[43%] after:h-0.5 after:bg-slate-500 after:content-['']">
                                  Dual Wield
                                </span>
                              )}
                            </span>
                            <span className={`rounded-full border px-2 py-2 text-[10px] font-bold uppercase tracking-[0.12em] ${boss.parry_haste ? 'border-violet-500/40 bg-violet-500/10 text-violet-300' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
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
                                  src={`/api/proxy/asset?url=${encodeURIComponent(`https://wow.zamimg.com/images/wow/icons/large/${icon}.jpg`)}`}
                                  alt={icon}
                                  className="block h-9 w-9 rounded-md border border-slate-700 bg-slate-950 object-cover"
                                />
                              );

                              if (!spellId) {
                                return (
                                  <a
                                    key={`${boss.boss_id}-icon-${icon}`}
                                    href={`https://www.wowhead.com/tbc/search?q=${encodeURIComponent(icon.replaceAll('_', ' '))}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="boss-spell-icon group relative block overflow-hidden rounded-md border border-slate-700 bg-slate-950 transition hover:border-amber-500"
                                    title={`Search Wowhead for ${icon.replaceAll('_', ' ')}`}
                                    style={{ fontSize: 0, lineHeight: 0 }}
                                  >
                                    {image}
                                  </a>
                                );
                              }

                              return (
                                <a
                                  key={`${boss.boss_id}-icon-${icon}`}
                                  href={`https://www.wowhead.com/tbc/spell=${spellId}`}
                                  data-wh-rename-link="false"
                                  data-wh-icon-size="large"
                                  data-wh-tooltip={`spell:${spellId}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="boss-spell-icon group relative block overflow-hidden rounded-md border border-slate-700 bg-slate-950 transition hover:border-amber-500"
                                  title={`Spell ${spellId}`}
                                  style={{ fontSize: 0, lineHeight: 0 }}
                                >
                                  {image}
                                </a>
                              );
                            })}
                          </div>
                        )}

                        {iconList.length === 0 && spellList.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {spellList.map(spellId => (
                              <a
                                key={`${boss.boss_id}-spell-${spellId}`}
                                href={`https://www.wowhead.com/tbc/spell=${spellId}`}
                                data-wh-rename-link="false"
                                data-wh-tooltip={`spell:${spellId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300 transition hover:border-amber-500 hover:text-amber-300"
                              >
                                Spell {spellId}
                              </a>
                            ))}
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

      {activeResourcesSubTab === 'raidlogs' && (
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

      {activeResourcesSubTab === 'wowaudit' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-100">WoWAudit</h3>
          <p className="text-sm text-slate-400">Keep a short list of important WoWAudit links, profiles, or notes for known raid goals and progress.</p>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">Add the relevant audit links here whenever you want them close at hand during planning.</div>
        </div>
      )}

      {activeResourcesSubTab === 'wipefest' && (
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
