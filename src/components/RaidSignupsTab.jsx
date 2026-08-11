import React, { useEffect, useMemo, useState } from 'react';
import { DateTime } from 'luxon';

const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' }
];

const TEMPLATE_GROUP_SIZE_OPTIONS = [10, 25, 40];
const TIMEZONE_OPTIONS = [
  { value: 'Europe/Paris', label: 'Europe/Paris' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'America/New_York', label: 'America/New_York' }
];
const UNKNOWN_ICON = 'https://wow.zamimg.com/images/wow/icons/small/inv_misc_questionmark.jpg';
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
const CLASS_NAME_COLORS = {
  druid: '#FF7D0A',
  hunter: '#ABD473',
  mage: '#69CCF0',
  paladin: '#F58CBA',
  priest: '#FFFFFF',
  rogue: '#FFF569',
  shaman: '#0070DE',
  warlock: '#8788EE',
  warrior: '#C79C6E'
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

function normalizeTemplateGroupSize(value) {
  const parsed = Number(value);
  return TEMPLATE_GROUP_SIZE_OPTIONS.includes(parsed) ? parsed : 25;
}

function normalizeTimezoneOption(value) {
  const raw = String(value || '').trim();
  if (!raw) return 'Europe/Paris';
  if (raw.toUpperCase() === 'CET' || raw.toUpperCase() === 'CEST' || raw.toUpperCase() === 'PARIS') return 'Europe/Paris';
  return TIMEZONE_OPTIONS.some(option => option.value === raw) ? raw : 'Europe/Paris';
}

function parseScheduleDateTime(value, fallbackTimezone = 'Europe/Paris') {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const zoneFallback = normalizeTimezoneOption(fallbackTimezone);
  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?(?:\s+([^\s]+))?$/i);
  if (ymd) {
    const [, yyyy, mm, dd, hh = '20', min = '00', zoneText = ''] = ymd;
    const zone = normalizeTimezoneOption(zoneText || zoneFallback);
    const dt = DateTime.fromObject(
      {
        year: Number(yyyy),
        month: Number(mm),
        day: Number(dd),
        hour: Number(hh),
        minute: Number(min),
        second: 0,
        millisecond: 0
      },
      { zone }
    );
    return dt.isValid ? dt : null;
  }

  const dmy = raw.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}))?(?:\s+([^\s]+))?$/i);
  if (dmy) {
    const [, dd, mm, yyyy, hh = '20', min = '00', zoneText = ''] = dmy;
    const zone = normalizeTimezoneOption(zoneText || zoneFallback);
    const dt = DateTime.fromObject(
      {
        year: Number(yyyy),
        month: Number(mm),
        day: Number(dd),
        hour: Number(hh),
        minute: Number(min),
        second: 0,
        millisecond: 0
      },
      { zone }
    );
    return dt.isValid ? dt : null;
  }

  const iso = DateTime.fromISO(raw, { setZone: true });
  return iso.isValid ? iso : null;
}

function groupCountFromTemplateSize(value) {
  return Math.max(1, Math.min(8, Math.ceil(normalizeTemplateGroupSize(value) / 5)));
}

function emptyTemplate() {
  return {
    id: Date.now(),
    name: '',
    description: '',
    group_size: 25,
    timezone: 'Europe/Paris',
    starts_at_text: '',
    recurrence_rule: '',
    recurrence_days: [],
    recurrence_delay_hours: 2,
    recurrence_enabled: false,
    is_active: true
  };
}

function buildDefaultGroupRows() {
  const rows = [];
  for (let g = 1; g <= 8; g += 1) {
    for (let s = 1; s <= 5; s += 1) {
      rows.push({
        localKey: `${g}-${s}`,
        group_number: g,
        group_name: `Group ${g}`,
        slot_index: s,
        player_name: '',
        spec_id: null,
        note: ''
      });
    }
  }
  return rows;
}

function roleSortKey(role) {
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'tank') return 0;
  if (normalized === 'healer') return 1;
  if (normalized === 'melee') return 2;
  return 3;
}

function roleGlyph(role) {
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'tank') return '🛡';
  if (normalized === 'healer') return '➕';
  if (normalized === 'melee') return '⚔';
  return '🏹';
}

function parseScheduledUnix(value) {
  const parsed = parseScheduleDateTime(value, 'Europe/Paris');
  if (!parsed) return null;
  return Math.floor(parsed.toSeconds());
}

function formatRelativeUntil(unix, nowMs) {
  if (!unix) return 'Not scheduled';
  const diffSec = Math.floor((unix * 1000 - nowMs) / 1000);
  const abs = Math.abs(diffSec);
  const days = Math.floor(abs / 86400);
  const hours = Math.floor((abs % 86400) / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  const text = `${days > 0 ? `${days}d ` : ''}${hours}h ${minutes}m`;
  return diffSec >= 0 ? `Starts in ${text}` : `Started ${text} ago`;
}

function parseScheduleParts(scheduledFor) {
  const parsed = parseScheduleDateTime(scheduledFor, 'Europe/Paris');
  if (!parsed) {
    return { scheduled_date: '', scheduled_time: '20:00', scheduled_timezone: 'Europe/Paris' };
  }

  return {
    scheduled_date: parsed.toFormat('dd-MM-yyyy'),
    scheduled_time: parsed.toFormat('HH:mm'),
    scheduled_timezone: normalizeTimezoneOption(parsed.zoneName)
  };
}

function buildScheduledForValue(scheduledDate, scheduledTime, scheduledTimezone) {
  const dateRaw = String(scheduledDate || '').trim();
  if (!dateRaw) return '';

  const dateParts = dateRaw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!dateParts) return '';

  const timeRaw = String(scheduledTime || '').trim() || '20:00';
  const timeParts = timeRaw.match(/^(\d{2}):(\d{2})$/);
  const safeTime = timeParts ? `${timeParts[1]}:${timeParts[2]}` : '20:00';
  const timezone = normalizeTimezoneOption(scheduledTimezone);
  const [, dd, mm, yyyy] = dateParts;
  return `${yyyy}-${mm}-${dd} ${safeTime} ${timezone}`;
}

function formatScheduledForDisplay(value, fallbackTimezone = 'Europe/Paris') {
  const parsed = parseScheduleDateTime(value, fallbackTimezone);
  if (!parsed) return String(value || '').trim() || 'Not scheduled';

  const zoneName = normalizeTimezoneOption(parsed.zoneName || fallbackTimezone);
  const shortZone = zoneName === 'Europe/Paris'
    ? (parsed.offset >= 120 ? 'CEST' : 'CET')
    : `UTC${parsed.toFormat('ZZ')}`;

  return `${parsed.toFormat('dd-MM-yyyy HH:mm')} ${shortZone}`;
}

function normalizedRole(role) {
  const value = String(role || '').toLowerCase();
  if (value === 'tank' || value === 'healer' || value === 'melee' || value === 'ranged') return value;
  return 'ranged';
}

export default function RaidSignupsTab({
  fetchData,
  putData,
  postData,
  deleteData,
  isAuthenticated,
  roster,
  getSpecById,
  specsFromDb,
  handleSaveRaidLog,
  handleApplyRaidSignupGroupsToAttendance,
  handleImportRaidHelperJson,
  newRaidDate,
  setNewRaidDate,
  newRaidZone,
  setNewRaidZone,
  raidLogs,
  handleDeleteRaidLog,
  raidHelperImportSession,
  onUpdateRaidHelperImportEntry,
  onApplyRaidHelperImport,
  onCancelRaidHelperImport,
  activeSection
}) {
  const [events, setEvents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [archivedEvents, setArchivedEvents] = useState([]);
  const [isSavingTemplates, setIsSavingTemplates] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventEditDraft, setEventEditDraft] = useState({ title: '', description: '', scheduled_date: '', scheduled_time: '20:00', scheduled_timezone: 'Europe/Paris', public_groups: false });
  const [groupRows, setGroupRows] = useState(buildDefaultGroupRows());
  const [isSavingGroups, setIsSavingGroups] = useState(false);
  const [isEchoing, setIsEchoing] = useState(false);
  const [isSavingEventEdit, setIsSavingEventEdit] = useState(false);
  const [isSavingPublicGroups, setIsSavingPublicGroups] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [clockNow, setClockNow] = useState(Date.now());
  const [expandedLog, setExpandedLog] = useState(null);
  const [raidHelperJsonText, setRaidHelperJsonText] = useState('');
  const [raidSignupEvents, setRaidSignupEvents] = useState([]);
  const [selectedSignupEventId, setSelectedSignupEventId] = useState('');
  const [isApplyingSignupEvent, setIsApplyingSignupEvent] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);
  const [openSlotPickerKey, setOpenSlotPickerKey] = useState('');
  const [editingNoteByRow, setEditingNoteByRow] = useState({});
  const [expandedSummaryStatus, setExpandedSummaryStatus] = useState('');
  const [isGroupConfigDirty, setIsGroupConfigDirty] = useState(false);
  const [isEventEditDirty, setIsEventEditDirty] = useState(false);
  const [loadedSelectedEventId, setLoadedSelectedEventId] = useState('');
  const activeRaidSection = activeSection || 'templates';
  const isReadOnly = !isAuthenticated;
  const specClasses = useMemo(() => [...new Set((specsFromDb || []).map(spec => spec.class))].sort((a, b) => a.localeCompare(b)), [specsFromDb]);

  const loadPublic = async () => {
    const data = await fetchData('public-raid-signups');
    setEvents(Array.isArray(data) ? data : []);
  };

  const loadTemplates = async () => {
    if (!isAuthenticated) return;
    const data = await fetchData('raid-signup-templates');
    setTemplates(Array.isArray(data) ? data : []);
  };

  const loadArchivedEvents = async () => {
    if (!isAuthenticated) {
      setArchivedEvents([]);
      return;
    }
    try {
      const data = await fetchData('raid-signup-events?status=archived');
      setArchivedEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load archived raid signups', e);
      setArchivedEvents([]);
    }
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (document.hidden) return;
      try {
        const data = await fetchData('public-raid-signups');
        if (!mounted) return;
        setEvents(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load public raid signups', e);
      }
    };

    load();
    const interval = setInterval(load, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    loadTemplates().catch(e => console.error('Failed to load raid signup templates', e));
    loadArchivedEvents().catch(e => console.error('Failed to load archived raid signup events', e));
  }, [isAuthenticated]);

  useEffect(() => {
    let mounted = true;

    const loadSignupEvents = async () => {
      if (!isAuthenticated) {
        if (mounted) setRaidSignupEvents([]);
        return;
      }
      try {
        const eventList = await fetchData('raid-signup-events');
        if (!mounted) return;
        const filtered = (Array.isArray(eventList) ? eventList : []).filter(event => String(event.status || '').toLowerCase() !== 'archived');
        setRaidSignupEvents(filtered);
        if (!selectedSignupEventId && filtered.length > 0) {
          setSelectedSignupEventId(String(filtered[0].id));
        }
      } catch (e) {
        console.error('Failed to load raid signup events for attendance import', e);
      }
    };

    loadSignupEvents();
    return () => {
      mounted = false;
    };
  }, [fetchData, isAuthenticated, selectedSignupEventId]);

  useEffect(() => {
    if (!selectedEventId) {
      setGroupRows(buildDefaultGroupRows());
      setSelectedEventDetails(null);
      setOpenSlotPickerKey('');
      setEditingNoteByRow({});
      setExpandedSummaryStatus('');
      setIsGroupConfigDirty(false);
      setIsEventEditDirty(false);
      setLoadedSelectedEventId('');
      setEventEditDraft({ title: '', description: '', scheduled_date: '', scheduled_time: '20:00', scheduled_timezone: 'Europe/Paris', public_groups: false });
      return;
    }

    const loadSelectedEventContext = async () => {
      if (!isAuthenticated) {
        const publicEvent = (events || []).find(event => String(event?.id) === String(selectedEventId));
        const defaults = buildDefaultGroupRows();
        const byKey = new Map(defaults.map(row => [row.localKey, { ...row }]));
        (publicEvent?.groups || []).forEach(row => {
          const key = `${row.group_number}-${row.slot_index}`;
          if (!byKey.has(key)) return;
          byKey.set(key, {
            ...byKey.get(key),
            group_name: row.group_name || `Group ${row.group_number}`,
            player_name: row.player_name || '',
            spec_id: row.spec_id || null,
            note: row.note || '',
            spec_class: row.spec_class || null,
            spec_name: row.spec_name || null,
            class_name: row.class_name || null
          });
        });
        setGroupRows([...byKey.values()]);
        setSelectedEventDetails(publicEvent || null);
        setOpenSlotPickerKey('');
        setEditingNoteByRow({});
        setExpandedSummaryStatus('');
        setLoadedSelectedEventId(String(selectedEventId));
        return;
      }

      if (String(loadedSelectedEventId) === String(selectedEventId) && (isGroupConfigDirty || isEventEditDirty)) {
        return;
      }

      try {
        const [rows, eventDetails] = await Promise.all([
          fetchData(`raid-signup-groups/${selectedEventId}`),
          fetchData(`raid-signup-events/${selectedEventId}`)
        ]);
        const defaults = buildDefaultGroupRows();
        const byKey = new Map(defaults.map(row => [row.localKey, { ...row }]));
        (rows || []).forEach(row => {
          const key = `${row.group_number}-${row.slot_index}`;
          if (!byKey.has(key)) return;
          byKey.set(key, {
            ...byKey.get(key),
            group_name: row.group_name || `Group ${row.group_number}`,
            player_name: row.player_name || '',
            spec_id: row.spec_id || null,
            note: row.note || '',
            spec_class: row.spec_class || null,
            spec_name: row.spec_name || null,
            class_name: row.class_name || null
          });
        });
        setGroupRows([...byKey.values()]);
        setSelectedEventDetails(eventDetails && typeof eventDetails === 'object' ? eventDetails : null);
        setOpenSlotPickerKey('');
        setEditingNoteByRow({});
        setExpandedSummaryStatus('');
        setIsGroupConfigDirty(false);
        setIsEventEditDirty(false);
        setLoadedSelectedEventId(String(selectedEventId));
      } catch (e) {
        console.error('Failed to load selected raid signup context', e);
        setSelectedEventDetails(null);
      }
    };

    loadSelectedEventContext();
  }, [events, fetchData, isAuthenticated, isEventEditDirty, isGroupConfigDirty, loadedSelectedEventId, selectedEventId]);

  const readableActiveEvents = useMemo(() => {
    if (isAuthenticated) return raidSignupEvents;
    return (events || []).filter(event => String(event?.status || '').toLowerCase() !== 'archived');
  }, [events, isAuthenticated, raidSignupEvents]);

  const readableArchivedEvents = useMemo(() => {
    if (isAuthenticated) return archivedEvents;
    return (events || []).filter(event => String(event?.status || '').toLowerCase() === 'archived');
  }, [archivedEvents, events, isAuthenticated]);

  useEffect(() => {
    const availableEventIds = new Set([...readableActiveEvents, ...readableArchivedEvents].map(event => String(event.id)));
    if (selectedEventId && availableEventIds.has(String(selectedEventId))) return;
    const firstEvent = [...readableActiveEvents, ...readableArchivedEvents][0];
    setSelectedEventId(firstEvent?.id ? String(firstEvent.id) : '');
  }, [readableActiveEvents, readableArchivedEvents, selectedEventId]);

  const selectedEventSummary = useMemo(
    () => [...readableActiveEvents, ...readableArchivedEvents].find(event => String(event.id) === String(selectedEventId)) || null,
    [readableActiveEvents, readableArchivedEvents, selectedEventId]
  );

  const selectedEvent = useMemo(() => {
    if (selectedEventDetails && String(selectedEventDetails.id) === String(selectedEventId)) {
      return { ...selectedEventSummary, ...selectedEventDetails };
    }
    return selectedEventSummary;
  }, [selectedEventDetails, selectedEventId, selectedEventSummary]);

  const templateById = useMemo(() => {
    const map = new Map();
    (templates || []).forEach(template => {
      map.set(String(template.id), template);
    });
    return map;
  }, [templates]);

  const selectedTemplate = useMemo(() => {
    if (!selectedEvent?.template_id) return null;
    return templateById.get(String(selectedEvent.template_id)) || null;
  }, [selectedEvent, templateById]);

  const visibleGroupCount = useMemo(() => {
    if (!selectedTemplate) return 8;
    return groupCountFromTemplateSize(selectedTemplate.group_size);
  }, [selectedTemplate]);

  useEffect(() => {
    if (!selectedEvent) {
      setEventEditDraft({ title: '', description: '', scheduled_date: '', scheduled_time: '20:00', scheduled_timezone: 'Europe/Paris', public_groups: false });
      return;
    }

    const schedule = parseScheduleParts(selectedEvent.scheduled_for);
    const templateTimezone = normalizeTimezoneOption(selectedTemplate?.timezone || selectedTemplate?.timezone_text || 'Europe/Paris');

    setEventEditDraft({
      title: selectedEvent.title || '',
      description: selectedEvent.description || '',
      scheduled_date: schedule.scheduled_date,
      scheduled_time: schedule.scheduled_time,
      scheduled_timezone: schedule.scheduled_timezone || templateTimezone,
      public_groups: !!selectedEvent.public_groups
    });
  }, [selectedEvent, selectedTemplate]);

  useEffect(() => {
    const timer = setInterval(() => setClockNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const signupCandidates = useMemo(() => {
    if (!selectedEventId) return [];
    const detailEntries = Array.isArray(selectedEvent?.entries) ? selectedEvent.entries : [];
    const publicEvent = (events || []).find(event => String(event?.id) === String(selectedEventId)) || null;
    const publicEntries = Array.isArray(publicEvent?.entries) ? publicEvent.entries : [];
    const entries = detailEntries.length > 0 ? detailEntries : publicEntries;
    return entries
      .filter(entry => String(entry.status || '').toLowerCase() === 'signup')
      .sort((a, b) => {
        const roleDiff = roleSortKey(a.role_bucket) - roleSortKey(b.role_bucket);
        if (roleDiff !== 0) return roleDiff;
        return String(a.discord_username || '').localeCompare(String(b.discord_username || ''));
      });
  }, [events, selectedEvent, selectedEventId]);

  const selectedEventEntries = useMemo(() => {
    if (!selectedEventId) return [];
    const detailEntries = Array.isArray(selectedEvent?.entries) ? selectedEvent.entries : [];
    const publicEvent = (events || []).find(event => String(event?.id) === String(selectedEventId)) || null;
    const publicEntries = Array.isArray(publicEvent?.entries) ? publicEvent.entries : [];
    return detailEntries.length > 0 ? detailEntries : publicEntries;
  }, [events, selectedEvent, selectedEventId]);

  const selectedEventEntryByName = useMemo(() => {
    const map = new Map();
    selectedEventEntries.forEach(entry => {
      const key = String(entry?.discord_username || entry?.player_name || '').trim().toLowerCase();
      if (!key || map.has(key)) return;
      map.set(key, entry);
    });
    return map;
  }, [selectedEventEntries]);

  const specById = useMemo(() => {
    const map = new Map();
    (specsFromDb || []).forEach(spec => {
      map.set(Number(spec.id), spec);
    });
    return map;
  }, [specsFromDb]);

  const specByClassAndName = useMemo(() => {
    const map = new Map();
    (specsFromDb || []).forEach(spec => {
      const key = `${String(spec.class || '').toLowerCase()}|${String(spec.spec || '').toLowerCase()}`;
      map.set(key, spec);
    });
    return map;
  }, [specsFromDb]);

  const resolveEntrySpec = (entry) => {
    const byId = specById.get(Number(entry?.spec_id));
    if (byId) return byId;
    const byNames = specByClassAndName.get(`${String(entry?.spec_class || '').toLowerCase()}|${String(entry?.spec_name || '').toLowerCase()}`);
    if (byNames) return byNames;
    const matchedEntry = selectedEventEntryByName.get(String(entry?.player_name || entry?.discord_username || '').trim().toLowerCase());
    if (!matchedEntry) return null;
    const matchedById = specById.get(Number(matchedEntry?.spec_id));
    if (matchedById) return matchedById;
    return specByClassAndName.get(`${String(matchedEntry?.spec_class || '').toLowerCase()}|${String(matchedEntry?.spec_name || '').toLowerCase()}`) || null;
  };

  const resolveEntryIcon = (entry) => {
    const spec = resolveEntrySpec(entry);
    return entry?.icon_small
      || entry?.icon_medium
      || entry?.icon_large
      || spec?.icon_small
      || spec?.icon_medium
      || spec?.icon_large
      || SPEC_ICON_FALLBACKS[String(spec?.spec || entry?.spec_name || '')]
      || CLASS_ICON_FALLBACKS[String(spec?.class || entry?.spec_class || '').toLowerCase()]
      || UNKNOWN_ICON;
  };

  const resolveEntryNameColor = (entry) => {
    const spec = resolveEntrySpec(entry);
    if (spec?.color) return spec.color;
    const specColor = specColorByKey.get(`${String(entry?.spec_class || '').toLowerCase()}|${String(entry?.spec_name || '').toLowerCase()}`);
    if (specColor) return specColor;
    const classKey = String(spec?.class || entry?.spec_class || entry?.class_name || '').toLowerCase();
    return CLASS_NAME_COLORS[classKey] || '#e2e8f0';
  };

  const summaryStatusLabel = (statusKey) => {
    if (statusKey === 'signup') return 'Sign-ups';
    if (statusKey === 'tentative') return 'Tentative';
    if (statusKey === 'bench') return 'Bench';
    if (statusKey === 'absent') return 'Absent';
    if (statusKey === 'total') return 'Total';
    return 'Sign-ups';
  };

  const statusMarker = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'signup') return { glyph: '✓', color: 'text-emerald-300' };
    if (normalized === 'absent') return { glyph: '✕', color: 'text-rose-300' };
    if (normalized === 'bench') return { glyph: '✓', color: 'text-amber-300' };
    if (normalized === 'tentative') return { glyph: '?', color: 'text-yellow-300' };
    return { glyph: '•', color: 'text-slate-400' };
  };

  const specColorByKey = useMemo(() => {
    const map = new Map();
    specsFromDb.forEach(spec => {
      map.set(`${String(spec.class || '').toLowerCase()}|${String(spec.spec || '').toLowerCase()}`, spec.color || '#e2e8f0');
    });
    return map;
  }, [specsFromDb]);

  const groupedPublic = useMemo(() => {
    return events.map(event => {
      const entries = Array.isArray(event.entries) ? event.entries : [];
      const byRole = { tank: [], healer: [], melee: [], ranged: [] };
      entries.forEach(entry => {
        if (String(entry.status || '').toLowerCase() !== 'signup') return;
        const role = String(entry.role_bucket || 'ranged').toLowerCase();
        if (!byRole[role]) byRole[role] = [];
        byRole[role].push(entry);
      });
      return { event, byRole };
    });
  }, [events]);

  const selectedEventSignupSummary = useMemo(() => {
    if (!selectedEventId) {
      return { signup: 0, bench: 0, absent: 0, total: 0 };
    }

    const entries = selectedEventEntries;

    const summary = entries.reduce((acc, entry) => {
      const status = String(entry?.status || '').toLowerCase();
      if (status === 'signup') acc.signup += 1;
      else if (status === 'bench') acc.bench += 1;
      else if (status === 'absent') acc.absent += 1;
      else if (status === 'tentative') acc.tentative += 1;
      acc.total += 1;
      return acc;
    }, { signup: 0, bench: 0, absent: 0, tentative: 0, total: 0 });

    if (summary.total === 0 && selectedEvent) {
      const signup = Number(selectedEvent.signup_count || 0);
      const bench = Number(selectedEvent.bench_count || 0);
      const absent = Number(selectedEvent.absent_count || 0);
      const tentative = Number(selectedEvent.tentative_count || 0);
      return {
        signup,
        bench,
        absent,
        tentative,
        total: signup + bench + absent + tentative
      };
    }

    return summary;
  }, [selectedEvent, selectedEventEntries, selectedEventId]);

  const expandedSummaryGroups = useMemo(() => {
    if (!expandedSummaryStatus) return null;
    const filtered = selectedEventEntries.filter(entry => {
      const status = String(entry?.status || '').toLowerCase();
      if (expandedSummaryStatus === 'total') {
        return ['signup', 'tentative', 'bench', 'absent'].includes(status);
      }
      return status === expandedSummaryStatus;
    });
    const grouped = { tank: [], healer: [], melee: [], ranged: [] };

    filtered
      .sort((a, b) => {
        const roleDiff = roleSortKey(a.role_bucket) - roleSortKey(b.role_bucket);
        if (roleDiff !== 0) return roleDiff;
        return String(a.discord_username || '').localeCompare(String(b.discord_username || ''));
      })
      .forEach(entry => {
        grouped[normalizedRole(entry.role_bucket)].push(entry);
      });

    return grouped;
  }, [expandedSummaryStatus, selectedEventEntries]);

  const selectedEventGroups = useMemo(() => {
    if (!selectedEventId) return [];
    return groupRows
      .filter(row => row.group_number <= visibleGroupCount && String(row.player_name || '').trim())
      .sort((a, b) => {
        const groupDiff = Number(a.group_number) - Number(b.group_number);
        if (groupDiff !== 0) return groupDiff;
        return Number(a.slot_index) - Number(b.slot_index);
      });
  }, [groupRows, selectedEventId, visibleGroupCount]);

  const updateTemplate = (idx, patch) => {
    setTemplates(prev => prev.map((template, i) => (i === idx ? { ...template, ...patch } : template)));
  };

  const toggleTemplateWeekday = (idx, weekdayValue) => {
    setTemplates(prev => prev.map((template, i) => {
      if (i !== idx) return template;
      const current = Array.isArray(template.recurrence_days) ? template.recurrence_days.map(v => Number(v)).filter(v => Number.isInteger(v)) : [];
      const has = current.includes(weekdayValue);
      const next = has ? current.filter(v => v !== weekdayValue) : [...current, weekdayValue];
      return { ...template, recurrence_days: next.sort((a, b) => a - b) };
    }));
  };

  const saveTemplates = async () => {
    setIsSavingTemplates(true);
    try {
      const payload = templates.map(template => ({
        name: String(template.name || '').trim(),
        description: String(template.description || '').trim(),
        group_size: normalizeTemplateGroupSize(template.group_size),
        timezone: normalizeTimezoneOption(template.timezone || template.timezone_text || 'Europe/Paris'),
        starts_at_text: String(template.starts_at_text || '').trim(),
        recurrence_rule: String(template.recurrence_rule || '').trim(),
        recurrence_days: Array.isArray(template.recurrence_days) ? template.recurrence_days.map(v => Number(v)).filter(v => Number.isInteger(v) && v >= 0 && v <= 6) : [],
        recurrence_delay_hours: Number.isFinite(Number(template.recurrence_delay_hours)) ? Number(template.recurrence_delay_hours) : 2,
        recurrence_enabled: !!template.recurrence_enabled,
        is_active: template.is_active !== false
      }));
      await putData('raid-signup-templates', payload);
      await loadTemplates();
      alert('Raid signup templates saved. Use /raidsignup post in Discord to publish one.');
    } catch (e) {
      alert('Failed to save raid signup templates.');
    } finally {
      setIsSavingTemplates(false);
    }
  };

  const saveGroups = async () => {
    if (!selectedEventId) return;
    setIsSavingGroups(true);
    try {
      const payload = groupRows
        .filter(row => row.group_number <= visibleGroupCount && String(row.player_name || '').trim())
        .map(row => ({
          group_number: row.group_number,
          group_name: row.group_name,
          slot_index: row.slot_index,
          player_name: row.player_name,
          spec_id: row.spec_id || null,
          note: row.note || ''
        }));
      await putData(`raid-signup-groups/${selectedEventId}`, payload);
      if (!!eventEditDraft.public_groups !== !!selectedEvent?.public_groups) {
        await putData(`raid-signup-events/${selectedEventId}`, {
          public_groups: !!eventEditDraft.public_groups
        });
      }
      setIsGroupConfigDirty(false);
      await loadPublic();
      alert('Raid groups saved.');
    } catch (e) {
      alert('Failed to save raid groups.');
    } finally {
      setIsSavingGroups(false);
    }
  };

  const echoGroups = async () => {
    if (!selectedEventId) return;
    setIsEchoing(true);
    try {
      await postData(`raid-signup-events/${selectedEventId}/echo`, {});
      alert('Echo message sent to Discord channel for this event.');
    } catch (e) {
      alert('Failed to echo message. Make sure event is posted by bot and has a Discord channel binding.');
    } finally {
      setIsEchoing(false);
    }
  };

  const updateGroupRow = (rowKey, patch) => {
    setIsGroupConfigDirty(true);
    setGroupRows(prev => prev.map(row => (row.localKey === rowKey ? { ...row, ...patch } : row)));
  };

  const updateGroupName = (groupNumber, groupName) => {
    setIsGroupConfigDirty(true);
    setGroupRows(prev => prev.map(row => (
      row.group_number === groupNumber ? { ...row, group_name: groupName } : row
    )));
  };

  const saveEventDetails = async () => {
    if (!selectedEventId) return;
    setIsSavingEventEdit(true);
    try {
      const scheduledFor = buildScheduledForValue(eventEditDraft.scheduled_date, eventEditDraft.scheduled_time, eventEditDraft.scheduled_timezone);
      await putData(`raid-signup-events/${selectedEventId}`, {
        title: eventEditDraft.title,
        description: eventEditDraft.description,
        scheduled_for: scheduledFor,
        scheduled_timezone: eventEditDraft.scheduled_timezone,
        public_groups: !!eventEditDraft.public_groups
      });
      setIsEventEditDirty(false);
      await loadPublic();
      alert('Event details updated.');
    } catch (e) {
      alert('Failed to update event details.');
    } finally {
      setIsSavingEventEdit(false);
    }
  };

  const savePublicGroupsVisibility = async (nextValue) => {
    setIsGroupConfigDirty(true);
    setIsEventEditDirty(true);
    setEventEditDraft(prev => ({ ...prev, public_groups: !!nextValue }));
  };

  const setEventStatus = async (status, confirmMessage) => {
    if (!selectedEventId) return;
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setIsChangingStatus(true);
    try {
      await putData(`raid-signup-events/${selectedEventId}/status`, { status });
      await loadPublic();
      await loadArchivedEvents();
      alert(`Event updated: ${status}.`);
    } catch (e) {
      alert(`Failed to set event status to ${status}.`);
    } finally {
      setIsChangingStatus(false);
    }
  };

  const deleteEvent = async () => {
    if (!selectedEventId) return;
    if (!window.confirm('Delete this raid from the website and Discord? This cannot be undone.')) return;

    setIsDeletingEvent(true);
    try {
      await deleteData(`raid-signup-events/${selectedEventId}`);
      await loadPublic();
      setSelectedEventId('');
      alert('Raid deleted from website and Discord.');
    } catch (e) {
      alert('Failed to delete raid event.');
    } finally {
      setIsDeletingEvent(false);
    }
  };

  const onImportRaidHelper = () => {
    const ok = handleImportRaidHelperJson(raidHelperJsonText);
    if (ok) setRaidHelperJsonText('');
  };

  const onApplySignupAttendance = async () => {
    if (!selectedSignupEventId) return;
    setIsApplyingSignupEvent(true);
    try {
      await handleApplyRaidSignupGroupsToAttendance(selectedSignupEventId);
    } finally {
      setIsApplyingSignupEvent(false);
    }
  };

  return (
    <section className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">Raid Signups</h2>
          <p className="text-sm text-slate-500">Public live signup board sourced from Discord interactions.</p>
        </div>
      </div>

      {activeRaidSection === 'overview' && (
        <>
          {groupedPublic.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-700 rounded-xl text-slate-500">
              No open raid signup events yet. Officers can create templates and post via /raidsignup post.
            </div>
          ) : (
            <div className="space-y-4">
              {groupedPublic.map(({ event, byRole }) => (
                <div key={event.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-amber-400">{event.title}</h3>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">Event #{event.id} {event.scheduled_for ? `• ${formatScheduledForDisplay(event.scheduled_for)}` : ''}</p>
                      <p className="text-[11px] text-cyan-400 mt-1">{formatRelativeUntil(parseScheduledUnix(event.scheduled_for), clockNow)}</p>
                      {event.description && <p className="text-sm text-slate-300 mt-1">{event.description}</p>}
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">{event.status}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                    {['tank', 'healer', 'melee', 'ranged'].map(role => (
                      <div key={role} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{roleGlyph(role)} {role}</h4>
                        {byRole[role].length === 0 ? (
                          <p className="text-xs text-slate-600 italic">None</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {byRole[role].map(entry => (
                              <li key={`${event.id}-${entry.discord_user_id}`} className="text-sm text-slate-200 flex items-center gap-2">
                                <img src={resolveEntryIcon(entry)} alt="" className="w-4 h-4 rounded border border-slate-700 bg-slate-800" />
                                <span
                                  className="truncate"
                                  style={{ color: resolveEntryNameColor(entry) }}
                                >
                                  {entry.discord_username}
                                </span>
                                {entry.spec_name && <span className="text-[10px] text-slate-500">({entry.spec_name})</span>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>

                  {event.public_groups && Array.isArray(event.groups) && event.groups.length > 0 && (
                    <div className="mt-4 border-t border-slate-800 pt-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Groups</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                        {Array.from(new Set(event.groups.map(g => Number(g.group_number)).filter(Boolean))).sort((a, b) => a - b).map(groupNumber => {
                          const rows = event.groups
                            .filter(g => Number(g.group_number) === groupNumber)
                            .sort((a, b) => Number(a.slot_index) - Number(b.slot_index));
                          const groupName = rows[0]?.group_name || `Group ${groupNumber}`;
                          return (
                            <div key={`${event.id}-pub-${groupNumber}`} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                              <h5 className="text-xs font-bold text-amber-300 mb-2">{groupName}</h5>
                              <ul className="space-y-1.5">
                                {rows.map(row => {
                                  const rowColor = resolveEntryNameColor(row);
                                  return (
                                    <li key={`${row.id}-${row.slot_index}`} className="text-xs text-slate-200 flex items-center gap-2">
                                      <img src={resolveEntryIcon(row)} alt="" className="w-3.5 h-3.5 rounded border border-slate-700 bg-slate-800" />
                                      <span className="truncate" style={{ color: rowColor }}>{row.player_name}</span>
                                      {row.note ? <span className="text-slate-500">- {row.note}</span> : null}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <>
          {activeRaidSection === 'templates' && (
            isAuthenticated ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Raid Templates (Bot Source)</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTemplates(prev => [...prev, emptyTemplate()])}
                  className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded"
                >
                  Add Template
                </button>
                <button
                  type="button"
                  onClick={saveTemplates}
                  disabled={isSavingTemplates}
                  className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 px-3 py-1.5 rounded"
                >
                  {isSavingTemplates ? 'Saving...' : 'Save Templates'}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500">After saving, officers can run /raidsignup post in Discord and choose a template.</p>

            <div className="space-y-3">
              {templates.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No templates yet.</p>
              ) : templates.map((template, idx) => (
                <div key={`${template.id}-${idx}`} className="border border-slate-800 rounded-lg p-3 bg-slate-900/50 space-y-2">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setTemplates(prev => prev.filter((_, i) => i !== idx))}
                      className="text-[10px] font-bold bg-rose-800 hover:bg-rose-700 text-rose-100 px-2 py-1 rounded uppercase tracking-wider"
                    >
                      Delete Template
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={template.name || ''}
                      onChange={e => updateTemplate(idx, { name: e.target.value })}
                      placeholder="Template name"
                      className="bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={template.starts_at_text || ''}
                      onChange={e => updateTemplate(idx, { starts_at_text: e.target.value })}
                      placeholder="Schedule text, e.g. Wed 20:00"
                      className="bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Group size</span>
                    <select
                      value={normalizeTemplateGroupSize(template.group_size)}
                      onChange={e => updateTemplate(idx, { group_size: Number(e.target.value) })}
                      className="bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm"
                    >
                      {TEMPLATE_GROUP_SIZE_OPTIONS.map(size => (
                        <option key={`${template.id}-size-${size}`} value={size}>{size}-man</option>
                      ))}
                    </select>

                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold ml-2">Timezone</span>
                    <select
                      value={normalizeTimezoneOption(template.timezone || template.timezone_text || 'Europe/Paris')}
                      onChange={e => updateTemplate(idx, { timezone: e.target.value })}
                      className="bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm"
                    >
                      {TIMEZONE_OPTIONS.map(option => (
                        <option key={`${template.id}-tz-${option.value}`} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="border border-slate-800 rounded-lg p-3 bg-slate-950/60 space-y-2">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Recurs On</div>
                    <div className="flex flex-wrap gap-1.5">
                      {WEEKDAY_OPTIONS.map(day => {
                        const selected = (template.recurrence_days || []).includes(day.value);
                        return (
                          <button
                            key={`${template.id}-${day.value}`}
                            type="button"
                            onClick={() => toggleTemplateWeekday(idx, day.value)}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold border ${selected ? 'bg-cyan-700 text-white border-cyan-500' : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'}`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Create next event after start</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={template.recurrence_delay_hours ?? 2}
                        onChange={e => updateTemplate(idx, { recurrence_delay_hours: e.target.value })}
                        className="w-24 bg-slate-900 text-white border border-slate-700 rounded px-2 py-1.5 text-xs"
                      />
                      <span className="text-xs text-slate-400">hours</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => updateTemplate(idx, { recurrence_enabled: !template.recurrence_enabled })}
                      className={`text-xs font-bold px-3 py-1.5 rounded ${template.recurrence_enabled ? 'bg-emerald-700 hover:bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                    >
                      {template.recurrence_enabled ? 'Automation Enabled' : 'Enable Auto Recurrence'}
                    </button>
                    <p className="text-[10px] text-slate-500">When enabled, the next event is auto-posted to Discord on the next selected weekday after the configured delay from the previous event start.</p>
                  </div>

                  <textarea
                    value={template.description || ''}
                    onChange={e => updateTemplate(idx, { description: e.target.value })}
                    placeholder="Template description"
                    className="w-full min-h-[70px] bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm"
                  />

                  <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={template.is_active !== false}
                      onChange={e => updateTemplate(idx, { is_active: e.target.checked })}
                    />
                    Active template
                  </label>
                </div>
              ))}
            </div>
          </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <p className="text-sm text-slate-300">Officer login required to manage raid templates.</p>
              </div>
            )
          )}

          {activeRaidSection === 'events' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Events & Status</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedEventId}
                    onChange={e => setSelectedEventId(e.target.value)}
                    className="bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select event...</option>
                    {readableActiveEvents.length > 0 && (
                      <optgroup label="Active events">
                        {readableActiveEvents.map(event => (
                          <option key={`active-${event.id}`} value={event.id}>#{event.id} [{event.status}] {event.title}</option>
                        ))}
                      </optgroup>
                    )}
                    {readableArchivedEvents.length > 0 && (
                      <optgroup label="Archived events">
                        {readableArchivedEvents.map(event => (
                          <option key={`archived-${event.id}`} value={event.id}>#{event.id} [{event.status}] {event.title}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  {isReadOnly ? (
                    <span className="text-[11px] text-slate-400">Read-only view (officer login required to edit)</span>
                  ) : null}
                  {!isReadOnly && selectedEvent && String(selectedEvent.status || '').toLowerCase() !== 'open' ? (
                    <button
                      type="button"
                      onClick={() => setEventStatus('open', `Reopen this raid? Signups will be enabled.`)}
                      disabled={!selectedEventId || isChangingStatus || isDeletingEvent}
                      className="text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-2 rounded"
                    >
                      {isChangingStatus ? 'Working...' : (String(selectedEvent.status || '').toLowerCase() === 'archived' ? 'Restore Raid' : 'Unlock Raid')}
                    </button>
                  ) : null}
                  {!isReadOnly ? (
                    <button
                      type="button"
                      onClick={() => setEventStatus('locked', 'Lock this raid? Signups will be disabled but it stays visible.')}
                      disabled={!selectedEventId || isChangingStatus || isDeletingEvent}
                      className="text-xs font-bold bg-orange-700 hover:bg-orange-600 text-white px-3 py-2 rounded"
                    >
                      {isChangingStatus ? 'Working...' : 'Lock Raid'}
                    </button>
                  ) : null}
                  {!isReadOnly ? (
                    <button
                      type="button"
                      onClick={() => setEventStatus('archived', 'Archive this raid? It will be removed from the active board.')}
                      disabled={!selectedEventId || isChangingStatus || isDeletingEvent}
                      className="text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded"
                    >
                      {isChangingStatus ? 'Working...' : 'Archive Raid'}
                    </button>
                  ) : null}
                  {!isReadOnly ? (
                    <button
                      type="button"
                      onClick={deleteEvent}
                      disabled={!selectedEventId || isDeletingEvent || isChangingStatus}
                      className="text-xs font-bold bg-red-700 hover:bg-red-600 text-white px-3 py-2 rounded"
                    >
                      {isDeletingEvent ? 'Deleting...' : 'Delete Raid'}
                    </button>
                  ) : null}
                </div>
              </div>

              {!selectedEventId ? (
                <p className="text-xs text-slate-500">Choose an event to edit details or manage its status.</p>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Signup Summary</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedSummaryStatus(prev => (prev === 'signup' ? '' : 'signup'))}
                        className={`text-left rounded border px-2 py-1.5 ${expandedSummaryStatus === 'signup' ? 'border-emerald-400 bg-emerald-900/35' : 'border-emerald-700/40 bg-emerald-900/20 hover:bg-emerald-900/30'}`}
                      >
                        <p className="text-[10px] text-emerald-300 uppercase tracking-wider">Sign-ups</p>
                        <p className="text-sm font-bold text-emerald-200">{selectedEventSignupSummary.signup}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedSummaryStatus(prev => (prev === 'tentative' ? '' : 'tentative'))}
                        className={`text-left rounded border px-2 py-1.5 ${expandedSummaryStatus === 'tentative' ? 'border-cyan-400 bg-cyan-900/35' : 'border-cyan-700/40 bg-cyan-900/20 hover:bg-cyan-900/30'}`}
                      >
                        <p className="text-[10px] text-cyan-300 uppercase tracking-wider">Tentative</p>
                        <p className="text-sm font-bold text-cyan-200">{selectedEventSignupSummary.tentative}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedSummaryStatus(prev => (prev === 'bench' ? '' : 'bench'))}
                        className={`text-left rounded border px-2 py-1.5 ${expandedSummaryStatus === 'bench' ? 'border-amber-400 bg-amber-900/35' : 'border-amber-700/40 bg-amber-900/20 hover:bg-amber-900/30'}`}
                      >
                        <p className="text-[10px] text-amber-300 uppercase tracking-wider">Bench</p>
                        <p className="text-sm font-bold text-amber-200">{selectedEventSignupSummary.bench}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedSummaryStatus(prev => (prev === 'absent' ? '' : 'absent'))}
                        className={`text-left rounded border px-2 py-1.5 ${expandedSummaryStatus === 'absent' ? 'border-rose-400 bg-rose-900/35' : 'border-rose-700/40 bg-rose-900/20 hover:bg-rose-900/30'}`}
                      >
                        <p className="text-[10px] text-rose-300 uppercase tracking-wider">Absent</p>
                        <p className="text-sm font-bold text-rose-200">{selectedEventSignupSummary.absent}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedSummaryStatus(prev => (prev === 'total' ? '' : 'total'))}
                        className={`text-left rounded border px-2 py-1.5 ${expandedSummaryStatus === 'total' ? 'border-slate-300 bg-slate-800/70' : 'border-slate-700/60 bg-slate-950/80 hover:bg-slate-800/70'}`}
                      >
                        <p className="text-[10px] text-slate-300 uppercase tracking-wider">Total</p>
                        <p className="text-sm font-bold text-slate-100">{selectedEventSignupSummary.total}</p>
                      </button>
                    </div>

                    {expandedSummaryStatus ? (
                      <div className="mt-3 border-t border-slate-800 pt-3 space-y-2">
                        <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">{summaryStatusLabel(expandedSummaryStatus)}</p>
                        {expandedSummaryGroups && ['tank', 'healer', 'melee', 'ranged'].map(role => (
                          <div key={`summary-${role}`} className="rounded border border-slate-800 bg-slate-950/70 p-2">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">{roleGlyph(role)} {role}</p>
                            {expandedSummaryGroups[role].length === 0 ? (
                              <p className="text-xs text-slate-600 italic">None</p>
                            ) : (
                              <ul className="space-y-1">
                                {expandedSummaryGroups[role].map(entry => {
                                  const color = resolveEntryNameColor(entry);
                                  const marker = statusMarker(entry.status);
                                  return (
                                    <li key={`summary-${entry.discord_user_id}-${entry.status}`} className="flex items-center gap-2 text-xs text-slate-200">
                                      <span className={`${marker.color} font-bold w-3 text-center`}>{marker.glyph}</span>
                                      <img src={resolveEntryIcon(entry)} alt="" className="w-4 h-4 rounded border border-slate-700 bg-slate-800" />
                                      <span className="truncate" style={{ color }}>{entry.discord_username}</span>
                                      {entry.spec_name ? <span className="text-[10px] text-slate-500">({entry.spec_name})</span> : null}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {isReadOnly ? (
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Event</p>
                        <p className="text-slate-100 font-semibold">{selectedEvent?.title || 'Untitled event'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Scheduled</p>
                        <p className="text-slate-300">{formatScheduledForDisplay(selectedEvent?.scheduled_for)}</p>
                      </div>
                      {selectedEvent?.description ? (
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Description</p>
                          <p className="text-slate-300">{selectedEvent.description}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={eventEditDraft.title}
                        onChange={e => {
                          setIsEventEditDirty(true);
                          setEventEditDraft(prev => ({ ...prev, title: e.target.value }));
                        }}
                        placeholder="Event title"
                        className="bg-slate-950 text-white border border-slate-700 rounded px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={eventEditDraft.scheduled_date}
                        onChange={e => {
                          setIsEventEditDirty(true);
                          setEventEditDraft(prev => ({ ...prev, scheduled_date: e.target.value }));
                        }}
                        placeholder="DD-MM-YYYY"
                        className="bg-slate-950 text-white border border-slate-700 rounded px-3 py-2 text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={eventEditDraft.scheduled_time}
                          onChange={e => {
                            setIsEventEditDirty(true);
                            setEventEditDraft(prev => ({ ...prev, scheduled_time: e.target.value }));
                          }}
                          placeholder="HH:mm"
                          className="flex-1 bg-slate-950 text-white border border-slate-700 rounded px-3 py-2 text-sm"
                        />
                        <select
                          value={normalizeTimezoneOption(eventEditDraft.scheduled_timezone)}
                          onChange={e => {
                            setIsEventEditDirty(true);
                            setEventEditDraft(prev => ({ ...prev, scheduled_timezone: e.target.value }));
                          }}
                          className="bg-slate-950 text-cyan-200 border border-slate-700 rounded px-2 py-2 text-xs font-bold"
                        >
                          {TIMEZONE_OPTIONS.map(option => (
                            <option key={`event-tz-${option.value}`} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={saveEventDetails}
                        disabled={isSavingEventEdit}
                        className="bg-cyan-700 hover:bg-cyan-600 text-white rounded px-3 py-2 text-xs font-bold uppercase tracking-wider"
                      >
                        {isSavingEventEdit ? 'Saving...' : 'Save Event Details'}
                      </button>
                      <textarea
                        value={eventEditDraft.description}
                        onChange={e => {
                          setIsEventEditDirty(true);
                          setEventEditDraft(prev => ({ ...prev, description: e.target.value }));
                        }}
                        placeholder="Event description"
                        className="md:col-span-3 bg-slate-950 text-white border border-slate-700 rounded px-3 py-2 text-sm min-h-[70px]"
                      />
                      <label className="md:col-span-3 inline-flex items-center gap-2 text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={!!eventEditDraft.public_groups}
                          onChange={e => {
                            setIsEventEditDirty(true);
                            setEventEditDraft(prev => ({ ...prev, public_groups: e.target.checked }));
                          }}
                        />
                        Public groups: show group assignments in read-only public view
                      </label>
                    </div>
                  )}

                  {selectedEvent?.public_groups && selectedEventGroups.length > 0 ? (
                    <div className="space-y-3 border-t border-slate-800 pt-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Groups</p>
                        {isReadOnly ? <span className="text-[10px] text-slate-500">Public view</span> : null}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                        {Array.from(new Set(selectedEventGroups.map(row => Number(row.group_number)).filter(Boolean))).sort((a, b) => a - b).map(groupNumber => {
                          const rows = selectedEventGroups.filter(row => Number(row.group_number) === groupNumber);
                          const groupName = rows[0]?.group_name || `Group ${groupNumber}`;
                          return (
                            <div key={`selected-group-${groupNumber}`} className={isReadOnly ? 'space-y-1.5' : 'bg-slate-900 border border-slate-800 rounded-lg p-3'}>
                              <h4 className="text-xs font-bold text-amber-300">{groupName}</h4>
                              <ul className="space-y-1.5">
                                {rows.map(row => (
                                  <li key={`selected-group-row-${row.localKey || row.id}`} className="text-xs text-slate-200 flex items-center gap-2">
                                    <img src={resolveEntryIcon(row)} alt="" className="w-3.5 h-3.5 rounded border border-slate-700 bg-slate-800" />
                                    <span className="truncate" style={{ color: resolveEntryNameColor(row) }}>{row.player_name}</span>
                                    {row.note ? <span className="text-slate-500">- {row.note}</span> : null}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {activeRaidSection === 'group-config' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Group Config</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedEventId}
                    onChange={e => setSelectedEventId(e.target.value)}
                    className="bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Select event...</option>
                    {readableActiveEvents.length > 0 && (
                      <optgroup label="Active events">
                        {readableActiveEvents.map(event => (
                          <option key={`active-${event.id}`} value={event.id}>#{event.id} [{event.status}] {event.title}</option>
                        ))}
                      </optgroup>
                    )}
                    {readableArchivedEvents.length > 0 && (
                      <optgroup label="Archived events">
                        {readableArchivedEvents.map(event => (
                          <option key={`archived-${event.id}`} value={event.id}>#{event.id} [{event.status}] {event.title}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  {isReadOnly ? <span className="text-[11px] text-slate-400">Read-only view</span> : null}
                  {!isReadOnly ? (
                    <button
                      type="button"
                      onClick={saveGroups}
                      disabled={!selectedEventId || isSavingGroups}
                      className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 px-3 py-2 rounded"
                    >
                      {isSavingGroups ? 'Saving...' : 'Save Groups'}
                    </button>
                  ) : null}
                  {!isReadOnly ? (
                    <button
                      type="button"
                      onClick={echoGroups}
                      disabled={!selectedEventId || isEchoing}
                      className="text-xs font-bold bg-purple-700 hover:bg-purple-600 text-white px-3 py-2 rounded"
                    >
                      {isEchoing ? 'Echoing...' : 'Echo To Discord'}
                    </button>
                  ) : null}
                </div>
              </div>

              {!selectedEventId ? (
                <p className="text-xs text-slate-500">Choose an event to configure groups and echo them to Discord.</p>
              ) : (
                <>
                  <p className="text-xs text-slate-400">
                    Template group size: <span className="text-amber-300 font-bold">{selectedTemplate ? `${normalizeTemplateGroupSize(selectedTemplate.group_size)}-man` : 'Unknown template'}</span>
                    {' '}• showing <span className="text-amber-300 font-bold">{visibleGroupCount}</span> groups
                  </p>

                  <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={!!eventEditDraft.public_groups}
                      disabled={isSavingPublicGroups || isReadOnly}
                      onChange={e => savePublicGroupsVisibility(e.target.checked)}
                    />
                    Make groups visible in public view
                    {isSavingPublicGroups ? <span className="text-cyan-300">(saving...)</span> : null}
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  {Array.from({ length: visibleGroupCount }, (_, idx) => idx + 1).map(groupNumber => {
                    const rows = groupRows.filter(row => row.group_number === groupNumber).sort((a, b) => a.slot_index - b.slot_index);
                    return (
                      <div key={groupNumber} className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
                        <input
                          type="text"
                          value={rows[0]?.group_name || `Group ${groupNumber}`}
                          disabled={isReadOnly}
                          onChange={e => updateGroupName(groupNumber, e.target.value)}
                          className="w-full bg-slate-950 text-amber-300 border border-slate-700 rounded px-3 py-2 text-xs font-bold uppercase tracking-wider"
                        />

                        <div className="space-y-2">
                          {rows.map(row => {
                            const selectedCandidate = signupCandidates.find(candidate => String(candidate.discord_username || '') === String(row.player_name || '')) || null;
                            const assignedElsewhereNames = new Set(
                              groupRows
                                .filter(other => other.localKey !== row.localKey)
                                .map(other => String(other.player_name || '').trim())
                                .filter(Boolean)
                            );
                            const availableCandidates = signupCandidates.filter(candidate => {
                              const candidateName = String(candidate.discord_username || '').trim();
                              if (!candidateName) return false;
                              if (candidateName === String(row.player_name || '').trim()) return true;
                              return !assignedElsewhereNames.has(candidateName);
                            });
                            const selectedColor = selectedCandidate
                              ? resolveEntryNameColor(selectedCandidate)
                              : resolveEntryNameColor(row);
                            const isPickerOpen = openSlotPickerKey === row.localKey;
                            const isEditingNote = !!editingNoteByRow[row.localKey];
                            const hasAssignedPlayer = String(row.player_name || '').trim().length > 0;

                            return (
                              <div key={row.localKey} className="relative rounded-lg border border-slate-800 bg-slate-950 p-2 space-y-2">
                                <div className="flex items-center gap-2 w-full min-w-0">
                                  <button
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() => setOpenSlotPickerKey(prev => (prev === row.localKey ? '' : row.localKey))}
                                    className="min-w-0 flex-1 flex items-center justify-between gap-2 bg-slate-900 text-sm border border-slate-700 rounded px-2 py-2 text-left"
                                  >
                                    <span className="flex items-center gap-2 min-w-0">
                                      <img src={hasAssignedPlayer ? resolveEntryIcon(selectedCandidate || row) : UNKNOWN_ICON} alt="" className="w-4 h-4 rounded border border-slate-700 bg-slate-800 flex-shrink-0" />
                                      <span className="truncate" style={{ color: selectedColor }}>{hasAssignedPlayer ? row.player_name : 'Open slot'}</span>
                                    </span>
                                    <span className="text-[10px] text-slate-400">▼</span>
                                  </button>

                                  {!isReadOnly && hasAssignedPlayer ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          updateGroupRow(row.localKey, { player_name: '', spec_id: null, note: '' });
                                          setEditingNoteByRow(prev => ({ ...prev, [row.localKey]: false }));
                                          setOpenSlotPickerKey('');
                                        }}
                                        className="w-8 h-8 flex items-center justify-center shrink-0 rounded border text-xs font-bold bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                                        title="Clear slot"
                                      >
                                        ↻
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingNoteByRow(prev => ({ ...prev, [row.localKey]: !prev[row.localKey] }))}
                                        className={`w-8 h-8 flex items-center justify-center shrink-0 rounded border text-xs font-bold ${isEditingNote ? 'bg-cyan-700 border-cyan-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'}`}
                                        title="Add or edit note"
                                      >
                                        ✎
                                      </button>
                                    </>
                                  ) : null}
                                </div>

                                {!isReadOnly && isPickerOpen ? (
                                  <div className="absolute left-2 right-2 top-[calc(100%-2px)] z-20 max-h-56 overflow-y-auto rounded-md border border-slate-700 bg-slate-900 shadow-xl">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateGroupRow(row.localKey, { player_name: '', spec_id: null, note: '' });
                                        setEditingNoteByRow(prev => ({ ...prev, [row.localKey]: false }));
                                        setOpenSlotPickerKey('');
                                      }}
                                      className="w-full text-left px-2.5 py-2 text-sm text-slate-200 hover:bg-slate-800"
                                    >
                                      Open slot
                                    </button>
                                    {availableCandidates.length === 0 ? (
                                      <div className="px-2.5 py-2 text-xs text-slate-500">No unassigned signup players available.</div>
                                    ) : availableCandidates.map(candidate => {
                                      const color = resolveEntryNameColor(candidate);
                                      return (
                                        <button
                                          key={`${candidate.discord_user_id}-${candidate.discord_username}`}
                                          type="button"
                                          onClick={() => {
                                            updateGroupRow(row.localKey, {
                                              player_name: candidate.discord_username,
                                              spec_id: candidate.spec_id || null
                                            });
                                            setOpenSlotPickerKey('');
                                          }}
                                          className="w-full text-left px-2.5 py-2 text-sm hover:bg-slate-800"
                                        >
                                          <span className="flex items-center gap-2">
                                            <img src={resolveEntryIcon(candidate)} alt="" className="w-4 h-4 rounded border border-slate-700 bg-slate-800 flex-shrink-0" />
                                            <span className="truncate" style={{ color }}>
                                              {candidate.discord_username}
                                            </span>
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                ) : null}

                                {hasAssignedPlayer && row.note && !isEditingNote ? (
                                  <p className="text-xs text-slate-400">{row.note}</p>
                                ) : null}

                                {!isReadOnly && hasAssignedPlayer && isEditingNote ? (
                                  <input
                                    type="text"
                                    value={row.note || ''}
                                    onChange={e => updateGroupRow(row.localKey, { note: e.target.value })}
                                    placeholder="Optional note"
                                    className="w-full bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1.5 text-xs focus:outline-none"
                                  />
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                </>
              )}
            </div>
          )}

          {activeRaidSection === 'history' && (
            isAuthenticated ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Raid History</h3>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Log Current Raid</h4>
                  <form onSubmit={handleSaveRaidLog} className="flex flex-col gap-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Date</label>
                        <input type="date" required className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none" value={newRaidDate} onChange={e => setNewRaidDate(e.target.value)} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Zone</label>
                        <input type="text" required placeholder="e.g. SSC" className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none" value={newRaidZone} onChange={e => setNewRaidZone(e.target.value)} />
                      </div>
                    </div>
                    <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-lg transition shadow-lg text-sm">Save Active Roster to History</button>
                  </form>

                  <div className="pt-3 border-t border-slate-800">
                    <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Paste RaidHelper JSON</label>
                    <textarea
                      value={raidHelperJsonText}
                      onChange={e => setRaidHelperJsonText(e.target.value)}
                      placeholder='Paste full JSON object with "signUps" here...'
                      className="w-full min-h-[120px] bg-slate-950 text-white border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={onImportRaidHelper}
                      className="mt-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2 px-3 rounded-lg transition text-xs uppercase tracking-wider"
                    >
                      Import RaidHelper to Roster + Attendance
                    </button>
                    <p className="text-[10px] text-slate-500 mt-1">You will be prompted to map unknown names and resolve spec mismatches.</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Import Attendees From Raid Signup Groups</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={selectedSignupEventId}
                        onChange={e => setSelectedSignupEventId(e.target.value)}
                        className="flex-1 bg-slate-950 text-white border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none"
                      >
                        <option value="">Select raid signup event...</option>
                        {raidSignupEvents.map(event => (
                          <option key={event.id} value={event.id}>
                            #{event.id} [{event.status}] {event.title}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={onApplySignupAttendance}
                        disabled={!selectedSignupEventId || isApplyingSignupEvent}
                        className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg transition text-xs uppercase tracking-wider"
                      >
                        {isApplyingSignupEvent ? 'Applying...' : 'Apply Grouped Attendees'}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Sets In Raid to grouped signup players and logs a raid attendance snapshot.</p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span>Raid History Logs</span>
                    <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px]">{raidLogs.length} Records</span>
                  </h4>
                  {raidLogs.length === 0 ? (
                    <p className="text-xs text-slate-600 italic py-4">No raids logged yet.</p>
                  ) : (
                    <ul className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                      {raidLogs.map(log => (
                        <li key={log.id} className="flex justify-between items-center bg-slate-950 border border-slate-800 p-2.5 rounded hover:border-slate-700 transition group">
                          <div>
                            <span className="font-bold text-sm text-amber-500 block leading-tight">{log.date}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{log.zone} • {(log.attendees || []).length} Attendees</span>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => setExpandedLog(log)} className="text-cyan-400 hover:text-cyan-300 text-xs font-bold px-2">Pop-out</button>
                            <button onClick={() => handleDeleteRaidLog(log.id)} className="text-slate-600 hover:text-red-400 text-xs font-bold px-2">Delete</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Archived Signup Events</h4>
              {archivedEvents.length === 0 ? (
                <p className="text-xs text-slate-500">No archived raid events yet.</p>
              ) : (
                <div className="space-y-2">
                  {archivedEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-100">{event.title || `Event #${event.id}`}</div>
                        <div className="text-xs text-slate-500">{formatScheduledForDisplay(event.scheduled_for, selectedTemplate?.timezone || selectedTemplate?.timezone_text || 'Europe/Paris')}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedEventId(String(event.id))}
                        className="text-xs font-bold bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-1.5 rounded"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <p className="text-sm text-slate-300">Officer login required to view raid history.</p>
              </div>
            )
          )}

        </>

      {expandedLog && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Raid Roster Snapshot</h3>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{expandedLog.date} • {expandedLog.zone}</p>
              </div>
              <button onClick={() => setExpandedLog(null)} className="text-slate-400 hover:text-slate-200 text-xl leading-none">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {(roster || [])
                .filter(player => (expandedLog.attendees || []).map(Number).includes(Number(player.id)))
                .map(player => {
                  const spec = getSpecById(player.spec_id);
                  return (
                    <div key={player.id} className="bg-slate-950 border border-slate-800 rounded p-2.5">
                      <div className="text-sm font-bold" style={{ color: spec?.color || '#e2e8f0' }}>{player.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{spec?.class || 'Unknown'} • {spec?.spec || 'Unknown'}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {raidHelperImportSession && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-5xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Resolve RaidHelper Imports</h3>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{raidHelperImportSession.raidDate} • {raidHelperImportSession.raidZone}</p>
              </div>
              <button onClick={onCancelRaidHelperImport} className="text-slate-400 hover:text-slate-200 text-xl leading-none">✕</button>
            </div>

            <div className="space-y-3">
              {raidHelperImportSession.pending.map(entry => {
                const resolution = entry.resolution || 'add';
                const selectedClass = entry.selected_class || '';
                const classSpecs = selectedClass
                  ? specsFromDb.filter(spec => spec.class === selectedClass)
                  : specsFromDb;
                const mappedPlayer = (roster || []).find(player => Number(player.id) === Number(entry.mapped_player_id));
                const matchedSpec = mappedPlayer ? getSpecById(mappedPlayer.spec_id) : null;

                return (
                  <div key={entry.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="text-sm font-bold text-amber-300">{entry.imported_name}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded">{entry.source === 'specMismatch' ? 'Spec Mismatch' : 'Missing Mapping'}</span>
                      {entry.incoming_spec_name && <span className="text-[10px] text-slate-400">JSON Spec: {entry.incoming_spec_name}</span>}
                      {matchedSpec && <span className="text-[10px] text-slate-400">Current: {matchedSpec.class} {matchedSpec.spec}</span>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Action</label>
                        <select
                          value={resolution}
                          onChange={e => onUpdateRaidHelperImportEntry(entry.id, { resolution: e.target.value })}
                          className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
                        >
                          {entry.source === 'specMismatch' ? (
                            <>
                              <option value="leave">Map & Leave Spec</option>
                              <option value="amend">Map & Amend Spec</option>
                              <option value="add">Add As New Player</option>
                            </>
                          ) : (
                            <>
                              <option value="map">Map To Existing</option>
                              <option value="add">Add As New Player</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Existing Character</label>
                        <select
                          value={entry.mapped_player_id || ''}
                          onChange={e => onUpdateRaidHelperImportEntry(entry.id, { mapped_player_id: e.target.value ? Number(e.target.value) : '' })}
                          disabled={resolution === 'add'}
                          className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
                        >
                          <option value="">-- Select Character --</option>
                          {(roster || []).map(player => {
                            const spec = getSpecById(player.spec_id);
                            return <option key={player.id} value={player.id}>{player.name} {spec ? `(${spec.class} ${spec.spec})` : ''}</option>;
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Class</label>
                        <select
                          value={selectedClass}
                          onChange={e => onUpdateRaidHelperImportEntry(entry.id, { selected_class: e.target.value })}
                          className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
                        >
                          <option value="">-- Select Class --</option>
                          {specClasses.map(className => <option key={className} value={className}>{className}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Spec</label>
                        <select
                          value={entry.selected_spec_id || ''}
                          onChange={e => onUpdateRaidHelperImportEntry(entry.id, { selected_spec_id: e.target.value ? Number(e.target.value) : '' })}
                          className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
                        >
                          <option value="">-- Select Spec --</option>
                          {classSpecs.map(spec => <option key={spec.id} value={spec.id}>{spec.class} - {spec.spec}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={onCancelRaidHelperImport} className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded">Cancel</button>
              <button onClick={onApplyRaidHelperImport} className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2 px-4 rounded">Apply Import</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
