import { useEffect, useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import healersIcon from '../assets/icons/healers.png';
import meleeDpsIcon from '../assets/icons/melee_dps.png';
import rangedDpsIcon from '../assets/icons/ranged_dps.png';
import tanksIcon from '../assets/icons/tanks.png';
import {
  getRaidSignupAbsences,
  getRaidSignupAbsenceTargets,
  createRaidSignupAbsence,
  updateRaidSignupAbsence,
  deleteRaidSignupAbsence
} from '../services/apiService';
import { getDefaultGuildRoleName } from '../utils/appShellHelpers';

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
const RAID_SIGNUP_SYNC_INTERVAL_MS = 3 * 60 * 1000;
const RAID_SIGNUPS_EVENT_STORAGE_KEY = 'raid-signups-selected-event-id';
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

function buildGroupRows(savedRows = []) {
  const byKey = new Map(buildDefaultGroupRows().map(row => [row.localKey, row]));
  savedRows.forEach(row => {
    if (Number(row.group_number) <= 0) return;
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
  return [...byKey.values()];
}

function buildBenchAssignments(savedRows = []) {
  return savedRows
    .filter(row => Number(row.group_number) === 0 && String(row.player_name || '').trim())
    .sort((a, b) => Number(a.slot_index) - Number(b.slot_index))
    .map((row, index) => ({
      localKey: row.id ? `bench-${row.id}` : `bench-${index + 1}-${String(row.player_name || '').trim().toLowerCase()}`,
      group_number: 0,
      group_name: row.group_name || 'Bench',
      slot_index: Number(row.slot_index) || index + 1,
      player_name: row.player_name || '',
      spec_id: row.spec_id || null,
      note: row.note || '',
      spec_class: row.spec_class || null,
      spec_name: row.spec_name || null,
      class_name: row.class_name || null
    }));
}

function roleSortKey(role) {
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'tank') return 0;
  if (normalized === 'healer') return 1;
  if (normalized === 'melee') return 2;
  return 3;
}

function roleIconAsset(role) {
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'tank') return tanksIcon;
  if (normalized === 'healer') return healersIcon;
  if (normalized === 'melee') return meleeDpsIcon;
  return rangedDpsIcon;
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

function normalizeRecurrenceDays(days) {
  return [...new Set((Array.isArray(days) ? days : []).map(v => Number(v)).filter(v => Number.isInteger(v) && v >= 0 && v <= 6))].sort((a, b) => a - b);
}

function getNextRecurrenceStartDateTime(previousStart, recurrenceDays) {
  const selectedDays = normalizeRecurrenceDays(recurrenceDays);
  if (selectedDays.length === 0 || !previousStart?.isValid) return null;

  const baseUtc = previousStart.toUTC();
  for (let offset = 1; offset <= 14; offset += 1) {
    const candidate = baseUtc.plus({ days: offset });
    const jsDay = candidate.toJSDate().getUTCDay();
    if (selectedDays.includes(jsDay)) return candidate;
  }

  return null;
}

export default function RaidSignupsTab({
  fetchData,
  putData,
  postData,
  deleteData,
  isAuthenticated,
  bnetAuthState,
  roster,
  rosterClaims = [],
  guildRoleRanks = [],
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
  handleUpdateRaidLog,
  raidHelperImportSession,
  onUpdateRaidHelperImportEntry,
  onApplyRaidHelperImport,
  onCancelRaidHelperImport,
  activeSection
  ,
  onSectionChange,
  sectionVisibilityById = {},
  siteTabMetadata
}) {
  const [events, setEvents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [archivedEvents, setArchivedEvents] = useState([]);
  const [isSavingTemplates, setIsSavingTemplates] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(() => localStorage.getItem(RAID_SIGNUPS_EVENT_STORAGE_KEY) || '');
  const [eventEditDraft, setEventEditDraft] = useState({ title: '', description: '', scheduled_date: '', scheduled_time: '20:00', scheduled_timezone: 'Europe/Paris', public_groups: false });
  const [groupRows, setGroupRows] = useState(buildDefaultGroupRows());
  const [benchAssignments, setBenchAssignments] = useState([]);
  const [isSavingGroups, setIsSavingGroups] = useState(false);
  const [isEchoing, setIsEchoing] = useState(false);
  const [isUnsignedRaidersOpen, setIsUnsignedRaidersOpen] = useState(false);
  const [isEchoingUnsignedRaiders, setIsEchoingUnsignedRaiders] = useState(false);
  const [echoTagUnsignedRaiders, setEchoTagUnsignedRaiders] = useState(true);
  const [selectedUnsignedRaiderIds, setSelectedUnsignedRaiderIds] = useState(new Set());
  const [unsignedRaiderEchoResult, setUnsignedRaiderEchoResult] = useState(null);
  const [isSavingEventEdit, setIsSavingEventEdit] = useState(false);
  const [isSavingPublicGroups, setIsSavingPublicGroups] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [expandedLog, setExpandedLog] = useState(null);
  const [expandedLogStatus, setExpandedLogStatus] = useState('');
  const [expandedSummaryStatus, setExpandedSummaryStatus] = useState('');
  const [raidHelperJsonText, setRaidHelperJsonText] = useState('');
  const [raidSignupEvents, setRaidSignupEvents] = useState([]);
  const [historyEventDetails, setHistoryEventDetails] = useState({});
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('');
  const [attendanceColumnFilters, setAttendanceColumnFilters] = useState({});
  const [attendanceSort, setAttendanceSort] = useState({ key: 'name', direction: 'asc' });
  const [selectedSignupEventId, setSelectedSignupEventId] = useState('');
  const [isApplyingSignupEvent, setIsApplyingSignupEvent] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState(null);
  const [openSlotPickerKey, setOpenSlotPickerKey] = useState('');
  const [editingNoteByRow, setEditingNoteByRow] = useState({});
  const [echoTagAttendees, setEchoTagAttendees] = useState(false);
  const [isGroupConfigDirty, setIsGroupConfigDirty] = useState(false);
  const [isEventEditDirty, setIsEventEditDirty] = useState(false);
  const [isRefreshingSignups, setIsRefreshingSignups] = useState(false);
  const [loadedSelectedEventId, setLoadedSelectedEventId] = useState('');
  const activeRaidSection = siteTabMetadata?.contentOwner === 'RaidSignupsContainer'
    ? siteTabMetadata.route?.subTab || activeSection || 'templates'
    : activeSection || 'templates';
  const isReadOnly = !isAuthenticated;
  const isRaidHelperImportVisible = sectionVisibilityById['raid-signups.history.raid-helper-import'] !== false;

  useEffect(() => {
    if (selectedEventId) {
      localStorage.setItem(RAID_SIGNUPS_EVENT_STORAGE_KEY, String(selectedEventId));
    } else {
      localStorage.removeItem(RAID_SIGNUPS_EVENT_STORAGE_KEY);
    }
  }, [selectedEventId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedSummaryStatus('');
  }, [selectedEventId]);

  const [absences, setAbsences] = useState([]);
  const [isLoadingAbsences, setIsLoadingAbsences] = useState(false);
  const [isSavingAbsence, setIsSavingAbsence] = useState(false);
  const [editingAbsenceId, setEditingAbsenceId] = useState(null);
  const [absenceDraft, setAbsenceDraft] = useState({ target_key: '', start_date: '', end_date: '', note: '' });
  const [absenceTargets, setAbsenceTargets] = useState([]);
  const [absenceCalendarMonth, setAbsenceCalendarMonth] = useState(() => DateTime.now().startOf('month'));
  const [raidCalendarMonth, setRaidCalendarMonth] = useState(() => DateTime.now().startOf('month'));
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
    const interval = setInterval(load, RAID_SIGNUP_SYNC_INTERVAL_MS);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTemplates().catch(e => console.error('Failed to load raid signup templates', e));
    loadArchivedEvents().catch(e => console.error('Failed to load archived raid signup events', e));
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGroupRows(buildDefaultGroupRows());
      setBenchAssignments([]);
      setSelectedEventDetails(null);
      setOpenSlotPickerKey('');
      setEditingNoteByRow({});
      setIsGroupConfigDirty(false);
      setIsEventEditDirty(false);
      setLoadedSelectedEventId('');
      setEventEditDraft({ title: '', description: '', scheduled_date: '', scheduled_time: '20:00', scheduled_timezone: 'Europe/Paris', public_groups: false });
      return;
    }

    const loadSelectedEventContext = async () => {
      if (!isAuthenticated) {
        const publicEvent = (events || []).find(event => String(event?.id) === String(selectedEventId));
        setGroupRows(buildGroupRows(publicEvent?.groups || []));
        setBenchAssignments(buildBenchAssignments(publicEvent?.groups || []));
        setSelectedEventDetails(publicEvent || null);
        setOpenSlotPickerKey('');
        setEditingNoteByRow({});
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
        setGroupRows(buildGroupRows(rows || []));
        setBenchAssignments(buildBenchAssignments(rows || []));
        setSelectedEventDetails(eventDetails && typeof eventDetails === 'object' ? eventDetails : null);
        setOpenSlotPickerKey('');
        setEditingNoteByRow({});
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const currentBattleNetUserId = Number(bnetAuthState?.user?.id || 0);
  const canUseAbsences = !!isAuthenticated || !!bnetAuthState?.authenticated;

  useEffect(() => {
    if (!['events', 'absences', 'history'].includes(activeRaidSection)) return;
    if (!canUseAbsences) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAbsences([]);
      return;
    }

    let mounted = true;
    const loadAbsences = async () => {
      setIsLoadingAbsences(true);
      try {
        const rows = await getRaidSignupAbsences();
        if (!mounted) return;
        setAbsences(Array.isArray(rows) ? rows : []);
      } catch (error) {
        if (!mounted) return;
        setAbsences([]);
        const message = error?.payload?.error || error?.message || 'Failed to load absences.';
        alert(message);
      } finally {
        if (mounted) setIsLoadingAbsences(false);
      }
    };

    loadAbsences();
    return () => {
      mounted = false;
    };
  }, [activeRaidSection, canUseAbsences, isAuthenticated, bnetAuthState?.authenticated]);

  useEffect(() => {
    if (activeRaidSection !== 'history' || !isAuthenticated) return;
    let mounted = true;
    const historyEvents = [...readableActiveEvents, ...readableArchivedEvents];
    Promise.all(historyEvents.map(async event => {
      try {
        const details = await fetchData(`raid-signup-events/${event.id}`);
        return [String(event.id), details && typeof details === 'object' ? details : event];
      } catch {
        return [String(event.id), event];
      }
    })).then(entries => {
      if (mounted) setHistoryEventDetails(Object.fromEntries(entries));
    });
    return () => {
      mounted = false;
    };
  }, [activeRaidSection, fetchData, isAuthenticated, readableActiveEvents, readableArchivedEvents]);

  useEffect(() => {
    if (activeRaidSection !== 'absences') return;
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAbsenceTargets([]);
      return;
    }

    let mounted = true;
    const loadAbsenceTargets = async () => {
      try {
        const rows = await getRaidSignupAbsenceTargets();
        if (!mounted) return;
        setAbsenceTargets(Array.isArray(rows) ? rows : []);
      } catch {
        if (!mounted) return;
        setAbsenceTargets([]);
      }
    };

    loadAbsenceTargets();
    return () => {
      mounted = false;
    };
  }, [activeRaidSection, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAbsenceDraft(prev => ({ ...prev, target_key: `user:${String(currentBattleNetUserId || '')}` }));
      return;
    }

    const targetKeys = new Set((absenceTargets || []).map(target => `${target.target_type}:${target.target_type === 'user' ? Number(target.user_id || 0) : Number(target.roster_id || 0)}`));
    const preferredUserKey = `user:${currentBattleNetUserId}`;
    const preferred = currentBattleNetUserId && targetKeys.has(preferredUserKey)
      ? preferredUserKey
      : (absenceTargets[0] ? `${absenceTargets[0].target_type}:${absenceTargets[0].target_type === 'user' ? Number(absenceTargets[0].user_id || 0) : Number(absenceTargets[0].roster_id || 0)}` : '');

    setAbsenceDraft(prev => {
      if (editingAbsenceId) return prev;
      if (prev.target_key && targetKeys.has(prev.target_key)) return prev;
      return { ...prev, target_key: String(preferred || '') };
    });
  }, [absenceTargets, currentBattleNetUserId, editingAbsenceId, isAuthenticated]);

  const myAbsences = useMemo(() => {
    if (!Array.isArray(absences)) return [];
    if (!currentBattleNetUserId) return [];
    return absences.filter(entry => Number(entry?.user_id) === currentBattleNetUserId);
  }, [absences, currentBattleNetUserId]);

  const allAbsences = useMemo(() => {
    if (!Array.isArray(absences)) return [];
    if (!isAuthenticated) return [];
    return absences;
  }, [absences, isAuthenticated]);

  const officerAbsenceCalendar = useMemo(() => {
    if (!isAuthenticated) return new Map();
    const map = new Map();

    (absences || []).forEach(absence => {
      const names = Array.isArray(absence?.claimed_characters) ? absence.claimed_characters : [];
      const label = names.length > 0
        ? `${names.join(', ')} on holiday`
        : `${absence?.battletag || 'Unknown user'} on holiday`;

      let cursor = DateTime.fromISO(String(absence?.start_date || ''), { zone: 'utc' }).startOf('day');
      const end = DateTime.fromISO(String(absence?.end_date || ''), { zone: 'utc' }).startOf('day');
      if (!cursor.isValid || !end.isValid || cursor > end) return;

      while (cursor <= end) {
        const key = cursor.toFormat('yyyy-LL-dd');
        if (!map.has(key)) map.set(key, []);
        map.get(key).push({
          id: absence.id,
          label,
          battletag: absence?.battletag || '',
          characters: names
        });
        cursor = cursor.plus({ days: 1 });
      }
    });

    return map;
  }, [absences, isAuthenticated]);

  const signupCandidates = useMemo(() => {
    if (!selectedEventId) return [];
    const detailEntries = Array.isArray(selectedEvent?.entries) ? selectedEvent.entries : [];
    const publicEvent = (events || []).find(event => String(event?.id) === String(selectedEventId)) || null;
    const publicEntries = Array.isArray(publicEvent?.entries) ? publicEvent.entries : [];
    const entries = detailEntries.length > 0 ? detailEntries : publicEntries;
    return entries
      .filter(entry => {
        const status = String(entry.status || '').trim().toLowerCase();
        const normalizedStatus = status === 'absence' ? 'absent' : status;
        return ['signup', 'late', 'tentative', 'bench'].includes(normalizedStatus);
      })
      .sort((a, b) => {
        const roleDiff = roleSortKey(a.role_bucket) - roleSortKey(b.role_bucket);
        if (roleDiff !== 0) return roleDiff;
        return String(a.discord_username || '').localeCompare(String(b.discord_username || ''));
      });
  }, [events, selectedEvent, selectedEventId]);

  const assignedGroupNames = useMemo(() => new Set(
    groupRows
      .filter(row => String(row.player_name || '').trim())
      .map(row => String(row.player_name || '').trim().toLowerCase())
  ), [groupRows]);

  const benchAssignmentNames = useMemo(() => new Set(
    benchAssignments
      .filter(row => String(row.player_name || '').trim())
      .map(row => String(row.player_name || '').trim().toLowerCase())
  ), [benchAssignments]);

  const unassignedBenchCandidates = useMemo(() => signupCandidates.filter(candidate => {
    const status = String(candidate.status || '').trim().toLowerCase();
    const normalizedStatus = status === 'absence' ? 'absent' : status;
    const candidateName = String(candidate.discord_username || '').trim();
    const normalizedName = candidateName.toLowerCase();
    return normalizedStatus === 'bench' && !assignedGroupNames.has(normalizedName) && !benchAssignmentNames.has(normalizedName);
  }), [assignedGroupNames, benchAssignmentNames, signupCandidates]);

  const unassignedSignupCandidates = useMemo(() => signupCandidates.filter(candidate => {
    const status = String(candidate.status || '').trim().toLowerCase();
    const normalizedStatus = status === 'absence' ? 'absent' : status;
    const candidateName = String(candidate.discord_username || '').trim();
    const normalizedName = candidateName.toLowerCase();
    return ['signup', 'late', 'tentative'].includes(normalizedStatus) && !assignedGroupNames.has(normalizedName) && !benchAssignmentNames.has(normalizedName);
  }), [assignedGroupNames, benchAssignmentNames, signupCandidates]);

  const selectedEventEntries = useMemo(() => {
    if (!selectedEventId) return [];
    const detailEntries = Array.isArray(selectedEvent?.entries) ? selectedEvent.entries : [];
    const publicEvent = (events || []).find(event => String(event?.id) === String(selectedEventId)) || null;
    const publicEntries = Array.isArray(publicEvent?.entries) ? publicEvent.entries : [];
    return detailEntries.length > 0 ? detailEntries : publicEntries;
  }, [events, selectedEvent, selectedEventId]);

  const unsignedRaiders = useMemo(() => {
    const raiderRoleNames = new Set((Array.isArray(guildRoleRanks) ? guildRoleRanks : [])
      .filter(role => role?.isRaider === true)
      .map(role => String(role.name || '').trim().toLowerCase())
      .filter(Boolean));
    const defaultGuildRole = getDefaultGuildRoleName({ guildRoleRanks }).toLowerCase();
    if (!selectedEventId || raiderRoleNames.size === 0) return [];

    const signedNames = new Set();
    selectedEventEntries.forEach(entry => {
      [entry.discord_username, entry.player_name, entry.character_name, entry.roster_name]
        .map(value => String(value || '').trim().toLowerCase())
        .filter(Boolean)
        .forEach(name => signedNames.add(name));
    });

    const eventUnix = parseScheduledUnix(selectedEvent?.scheduled_for);
    const eventDate = eventUnix ? DateTime.fromSeconds(eventUnix).toISODate() : '';
    return (roster || [])
      .filter(player => {
        const rankName = String(player.guild_rank || player.rank || defaultGuildRole).trim().toLowerCase();
        const playerName = String(player.name || '').trim().toLowerCase();
        return raiderRoleNames.has(rankName) && playerName && !signedNames.has(playerName);
      })
      .map(player => {
        const playerName = String(player.name || '').trim().toLowerCase();
        const absence = (absences || []).find(entry => {
          const names = [entry.target_character_name, ...(Array.isArray(entry.claimed_characters) ? entry.claimed_characters : [])]
            .map(value => String(value || '').trim().toLowerCase());
          const matchesPlayer = names.includes(playerName);
          const coversEvent = !eventDate || (String(entry.start_date || '') <= eventDate && String(entry.end_date || '') >= eventDate);
          return matchesPlayer && coversEvent;
        });
        return { player, absence };
      });
  }, [absences, guildRoleRanks, roster, selectedEvent, selectedEventEntries, selectedEventId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedUnsignedRaiderIds(new Set(
      unsignedRaiders
        .filter(({ absence }) => !absence)
        .map(({ player }) => String(player.id))
    ));
  }, [unsignedRaiders]);

  const selectedEventEntryByName = useMemo(() => {
    const map = new Map();
    selectedEventEntries.forEach(entry => {
      const key = String(entry?.discord_username || entry?.player_name || '').trim().toLowerCase();
      if (!key || map.has(key)) return;
      map.set(key, entry);
    });
    return map;
  }, [selectedEventEntries]);

  const groupRoleSummary = useMemo(() => {
    const summary = { tank: 0, healer: 0, ranged: 0, melee: 0 };

    groupRows.forEach(row => {
      const playerName = String(row.player_name || '').trim();
      if (!playerName) return;

      const candidate = signupCandidates.find(candidate => String(candidate.discord_username || '').trim().toLowerCase() === playerName.toLowerCase())
        || selectedEventEntryByName.get(playerName.toLowerCase())
        || null;
      const role = String(candidate?.role_bucket || '').toLowerCase();
      const normalizedRole = ['tank', 'healer', 'ranged', 'melee'].includes(role) ? role : 'ranged';
      if (summary[normalizedRole] !== undefined) summary[normalizedRole] += 1;
    });

    return summary;
  }, [groupRows, selectedEventEntryByName, signupCandidates]);

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
    if (statusKey === 'late') return 'Late';
    if (statusKey === 'tentative') return 'Tentative';
    if (statusKey === 'bench') return 'Bench';
    if (statusKey === 'absent') return 'Absent';
    if (statusKey === 'total') return 'Total';
    return 'Sign-ups';
  };

  const statusMarker = (status) => {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'absence') return { glyph: 'x', color: 'text-rose-300' };
    if (normalized === 'signup') return { glyph: '✓', color: 'text-emerald-300' };
    if (normalized === 'absent') return { glyph: 'x', color: 'text-rose-300' };
    if (normalized === 'bench') return { glyph: '✓', color: 'text-amber-300' };
    if (normalized === 'late') return { glyph: 'L', color: 'text-orange-300' };
    if (normalized === 'tentative') return { glyph: '?', color: 'text-yellow-300' };
    return { glyph: '•', color: 'text-slate-400' };
  };

  const specColorByKey = new Map();
  specsFromDb.forEach(spec => {
    specColorByKey.set(`${String(spec.class || '').toLowerCase()}|${String(spec.spec || '').toLowerCase()}`, spec.color || '#e2e8f0');
  });

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

  const raidCalendarData = useMemo(() => {
    const publicEventSource = Array.isArray(events) ? events : [];
    const allKnownEvents = isAuthenticated ? [...(raidSignupEvents || []), ...(archivedEvents || [])] : publicEventSource;

    const scheduledItems = allKnownEvents
      .filter(event => {
        if (!isAuthenticated) {
          return String(event?.status || '').toLowerCase() !== 'archived';
        }
        return String(event?.status || '').toLowerCase() !== 'archived';
      })
      .map(event => {
        const timezone = normalizeTimezoneOption((event?.timezone || event?.scheduled_timezone) || 'Europe/Paris');
        const start = parseScheduleDateTime(event?.scheduled_for || '', timezone);
        if (!start?.isValid) return null;
        return {
          kind: 'scheduled',
          key: `scheduled-${event.id}`,
          id: event.id,
          templateId: Number(event?.template_id || 0) || null,
          title: String(event?.title || '').trim() || `Event #${event.id}`,
          status: String(event?.status || '').toLowerCase(),
          start,
          timezone,
          sourceLabel: 'Scheduled event'
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.start.toMillis() - b.start.toMillis());

    if (!isAuthenticated) {
      return {
        scheduledItems,
        plannedItems: [],
        allItems: scheduledItems,
        blockedTemplates: []
      };
    }

    const now = DateTime.now();
    const eventByTemplateId = new Map();
    allKnownEvents.forEach(event => {
      const templateId = Number(event?.template_id || 0);
      if (!templateId) return;
      if (!eventByTemplateId.has(templateId)) eventByTemplateId.set(templateId, []);
      eventByTemplateId.get(templateId).push(event);
    });

    const plannedItems = [];
    const blockedTemplates = [];

    (templates || []).forEach(template => {
      const templateId = Number(template?.id || 0);
      if (!templateId) return;
      if (template?.is_active === false || !template?.recurrence_enabled) return;

      const recurrenceDays = normalizeRecurrenceDays(template?.recurrence_days);
      if (recurrenceDays.length === 0) return;

      const timezone = normalizeTimezoneOption(template?.timezone || template?.timezone_text || 'Europe/Paris');
      const templateEvents = eventByTemplateId.get(templateId) || [];
      const parsedCandidates = templateEvents
        .map(event => ({
          event,
          startedAt: parseScheduleDateTime(event?.scheduled_for || '', timezone)
        }))
        .filter(row => row.startedAt?.isValid && row.startedAt.toMillis() <= now.toMillis() && row.event?.discord_channel_id)
        .sort((a, b) => b.startedAt.toMillis() - a.startedAt.toMillis());

      if (parsedCandidates.length === 0) {
        blockedTemplates.push({
          templateId,
          templateName: String(template?.name || '').trim() || `Template #${templateId}`,
          reason: 'No started event with a Discord channel was found yet.'
        });
        return;
      }

      const latest = parsedCandidates[0];
      const delayHours = Number(template?.recurrence_delay_hours || 0);
      const safeDelayHours = Number.isFinite(delayHours) ? Math.max(0, delayHours) : 0;
      const nextStartUtc = getNextRecurrenceStartDateTime(latest.startedAt, recurrenceDays);
      if (!nextStartUtc?.isValid) return;

      const recurrenceInstance = nextStartUtc.toUTC().toISO({ suppressMilliseconds: false });
      const alreadyScheduled = templateEvents.some(event => String(event?.recurrence_instance || '') === recurrenceInstance);
      if (alreadyScheduled) return;

      const readyAt = latest.startedAt.plus({ hours: safeDelayHours });
      plannedItems.push({
        kind: 'planned',
        key: `planned-${templateId}-${recurrenceInstance}`,
        id: null,
        templateId,
        title: String(template?.name || '').trim() || `Template #${templateId}`,
        status: readyAt.toMillis() <= now.toMillis() ? 'ready' : 'pending-delay',
        start: nextStartUtc.setZone(timezone),
        timezone,
        sourceLabel: readyAt.toMillis() <= now.toMillis()
          ? `Auto recurrence ready (${safeDelayHours}h delay passed)`
          : `Auto recurrence pending (${safeDelayHours}h delay)`
      });
    });

    const allItems = [...scheduledItems, ...plannedItems].sort((a, b) => a.start.toMillis() - b.start.toMillis());
    return { scheduledItems, plannedItems, allItems, blockedTemplates };
  }, [archivedEvents, events, isAuthenticated, raidSignupEvents, templates]);

  const raidCalendarByDay = useMemo(() => {
    const map = new Map();
    raidCalendarData.allItems.forEach(item => {
      const key = item.start.toFormat('yyyy-LL-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return map;
  }, [raidCalendarData]);

  const raidCalendarGrid = useMemo(() => {
    const monthStart = raidCalendarMonth.startOf('month');
    const calendarStart = monthStart.startOf('week');
    const days = [];
    for (let i = 0; i < 42; i += 1) {
      const day = calendarStart.plus({ days: i });
      const key = day.toFormat('yyyy-LL-dd');
      days.push({
        key,
        day,
        inMonth: day.hasSame(monthStart, 'month'),
        entries: raidCalendarByDay.get(key) || []
      });
    }
    return days;
  }, [raidCalendarByDay, raidCalendarMonth]);

  const raidCalendarUpcomingItems = useMemo(() => {
    const nowMs = DateTime.now().toMillis();
    return raidCalendarData.allItems
      .filter(item => item.start.toMillis() >= nowMs)
      .slice(0, 20);
  }, [raidCalendarData]);

  const navigateFromCalendarItem = (item) => {
    if (!item || item.kind !== 'scheduled' || !item.id) return;

    const status = String(item.status || '').toLowerCase();
    const targetSection = (status === 'closed' || status === 'archived') ? 'history' : 'events';
    setSelectedEventId(String(item.id));
    setSelectedSignupEventId(String(item.id));
    if (typeof onSectionChange === 'function') {
      onSectionChange(targetSection);
    }
  };

  const getHistoryEventForLog = (log) => {
    if (!log) return null;
    const byId = historyEventDetails[String(log.signupEventId)];
    if (byId) return byId;
    const eventDate = String(log.date || '');
    return [...readableActiveEvents, ...readableArchivedEvents].find(event => {
      return parseScheduleDateTime(event.scheduled_for)?.toISODate() === eventDate;
    }) || null;
  };

  const getSignupSummary = (event) => {
    const entries = Array.isArray(event?.entries) ? event.entries : [];
    const summary = entries.reduce((acc, entry) => {
      const status = String(entry?.status || '').trim().toLowerCase();
      const normalizedStatus = status === 'absence' ? 'absent' : status;
      if (normalizedStatus === 'signup') acc.signup += 1;
      else if (normalizedStatus === 'late') acc.late += 1;
      else if (normalizedStatus === 'bench') acc.bench += 1;
      else if (normalizedStatus === 'absent') acc.absent += 1;
      else if (normalizedStatus === 'tentative') acc.tentative += 1;
      acc.total += 1;
      return acc;
    }, { signup: 0, late: 0, bench: 0, absent: 0, tentative: 0, total: 0 });

    if (summary.total === 0 && event) {
      const signup = Number(event.signup_count || 0);
      const late = Number(event.late_count || 0);
      const bench = Number(event.bench_count || 0);
      const absent = Number(event.absent_count || 0);
      const tentative = Number(event.tentative_count || 0);
      return { signup, late, bench, absent, tentative, total: signup + late + bench + absent + tentative };
    }

    return summary;
  };

  const selectedEventSignupSummary = useMemo(() => {
    if (!selectedEventId) {
      return { signup: 0, late: 0, bench: 0, absent: 0, tentative: 0, total: 0 };
    }
    return getSignupSummary(selectedEvent);
  }, [selectedEvent, selectedEventId]);

  const expandedSummaryGroups = useMemo(() => {
    if (!expandedSummaryStatus) return null;
    const filtered = selectedEventEntries.filter(entry => {
      const status = String(entry?.status || '').trim().toLowerCase();
      const normalizedStatus = status === 'absence' ? 'absent' : status;
      if (expandedSummaryStatus === 'total') {
        return ['signup', 'late', 'tentative', 'bench', 'absent'].includes(normalizedStatus);
      }
      return normalizedStatus === expandedSummaryStatus;
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
    } catch {
      alert('Failed to save raid signup templates.');
    } finally {
      setIsSavingTemplates(false);
    }
  };

  const saveGroups = async () => {
    if (!selectedEventId) return;
    setIsSavingGroups(true);
    try {
      const payload = [
        ...groupRows
        .filter(row => row.group_number <= visibleGroupCount && String(row.player_name || '').trim())
        .map(row => ({
          group_number: row.group_number,
          group_name: row.group_name,
          slot_index: row.slot_index,
          player_name: row.player_name,
          spec_id: row.spec_id || null,
          note: row.note || ''
        })),
        ...benchAssignments
          .filter(row => String(row.player_name || '').trim())
          .map((row, index) => ({
            group_number: 0,
            group_name: 'Bench',
            slot_index: index + 1,
            player_name: row.player_name,
            spec_id: row.spec_id || null,
            note: row.note || ''
          }))
      ];
      await putData(`raid-signup-groups/${selectedEventId}`, payload);
      if (!!eventEditDraft.public_groups !== !!selectedEvent?.public_groups) {
        await putData(`raid-signup-events/${selectedEventId}`, {
          public_groups: !!eventEditDraft.public_groups
        });
      }
      setIsGroupConfigDirty(false);
      await loadPublic();
      alert('Raid groups saved.');
    } catch {
      alert('Failed to save raid groups.');
    } finally {
      setIsSavingGroups(false);
    }
  };

  const echoGroups = async () => {
    if (!selectedEventId) return;
    setIsEchoing(true);
    try {
      await postData(`raid-signup-events/${selectedEventId}/echo`, { tag_attendees: echoTagAttendees });
      alert('Echo message sent to Discord channel for this event.');
    } catch {
      alert('Failed to echo message. Make sure event is posted by bot and has a Discord channel binding.');
    } finally {
      setIsEchoing(false);
    }
  };

  const echoUnsignedRaiders = async () => {
    const selectedRaiders = unsignedRaiders.filter(({ player }) => selectedUnsignedRaiderIds.has(String(player.id)));
    if (!selectedEventId || selectedRaiders.length === 0) return;
    setIsEchoingUnsignedRaiders(true);
    setUnsignedRaiderEchoResult(null);
    try {
      const result = await postData(`raid-signup-events/${selectedEventId}/echo-unsigned-raiders`, {
        players: selectedRaiders.map(({ player }) => {
          const spec = specById.get(Number(player.spec_id));
          return {
            name: player.name,
            spec_name: spec?.spec || '',
            spec_class: spec?.class || ''
          };
        }),
        tag_raiders: echoTagUnsignedRaiders
      });
      setUnsignedRaiderEchoResult(result || { ok: true });
    } catch (e) {
      setUnsignedRaiderEchoResult({ error: e?.message || 'Failed to echo unsigned raiders.' });
    } finally {
      setIsEchoingUnsignedRaiders(false);
    }
  };

  const refreshSignups = async () => {
    if ((isGroupConfigDirty || isEventEditDirty) && !window.confirm('Refresh signups and discard unsaved event or group changes?')) {
      return;
    }

    setIsRefreshingSignups(true);
    try {
      const publicEvents = await fetchData('public-raid-signups');
      const normalizedPublicEvents = Array.isArray(publicEvents) ? publicEvents : [];
      setEvents(normalizedPublicEvents);

      if (isAuthenticated) {
        const [eventList, archivedList, selectedDetails, selectedGroups] = await Promise.all([
          fetchData('raid-signup-events'),
          fetchData('raid-signup-events?status=archived'),
          selectedEventId ? fetchData(`raid-signup-events/${selectedEventId}`) : Promise.resolve(null),
          selectedEventId ? fetchData(`raid-signup-groups/${selectedEventId}`) : Promise.resolve([])
        ]);
        setRaidSignupEvents((Array.isArray(eventList) ? eventList : []).filter(event => String(event.status || '').toLowerCase() !== 'archived'));
        setArchivedEvents(Array.isArray(archivedList) ? archivedList : []);
        if (selectedEventId) {
          setSelectedEventDetails(selectedDetails && typeof selectedDetails === 'object' ? selectedDetails : null);
          setGroupRows(buildGroupRows(Array.isArray(selectedGroups) ? selectedGroups : []));
          setBenchAssignments(buildBenchAssignments(Array.isArray(selectedGroups) ? selectedGroups : []));
          setLoadedSelectedEventId(String(selectedEventId));
        }
      } else if (selectedEventId) {
        const publicEvent = normalizedPublicEvents.find(event => String(event?.id) === String(selectedEventId));
        setSelectedEventDetails(publicEvent || null);
        setGroupRows(buildGroupRows(publicEvent?.groups || []));
        setBenchAssignments(buildBenchAssignments(publicEvent?.groups || []));
        setLoadedSelectedEventId(String(selectedEventId));
      }

      setIsGroupConfigDirty(false);
      setIsEventEditDirty(false);
      setOpenSlotPickerKey('');
      setEditingNoteByRow({});
    } catch (e) {
      console.error('Failed to refresh raid signups', e);
      alert('Failed to refresh signups.');
    } finally {
      setIsRefreshingSignups(false);
    }
  };

  const updateGroupRow = (rowKey, patch) => {
    setIsGroupConfigDirty(true);
    setGroupRows(prev => prev.map(row => (row.localKey === rowKey ? { ...row, ...patch } : row)));
    if (Object.prototype.hasOwnProperty.call(patch || {}, 'player_name')) {
      const normalizedName = String(patch.player_name || '').trim().toLowerCase();
      if (normalizedName) {
        setBenchAssignments(prev => prev.filter(row => String(row.player_name || '').trim().toLowerCase() !== normalizedName));
      }
    }
  };

  const addBenchAssignment = (entry) => {
    if (!entry) return;
    const playerName = String(entry.discord_username || entry.player_name || '').trim();
    if (!playerName) return;
    const normalizedName = playerName.toLowerCase();
    if (benchAssignmentNames.has(normalizedName)) return;

    setIsGroupConfigDirty(true);
    setBenchAssignments(prev => ([
      ...prev,
      {
        localKey: `bench-${Date.now()}-${normalizedName}`,
        group_number: 0,
        group_name: 'Bench',
        slot_index: prev.length + 1,
        player_name: playerName,
        spec_id: entry.spec_id || null,
        note: '',
        spec_class: entry.spec_class || null,
        spec_name: entry.spec_name || null,
        class_name: entry.class_name || null
      }
    ]));
  };

  const assignToNextOpenGroupSlot = (entry) => {
    if (!entry || isReadOnly) return;
    const nextOpenSlot = [...groupRows]
      .filter(row => Number(row.group_number) > 0 && Number(row.group_number) <= visibleGroupCount && !String(row.player_name || '').trim())
      .sort((a, b) => Number(a.group_number) - Number(b.group_number) || Number(a.slot_index) - Number(b.slot_index))[0];
    if (!nextOpenSlot) return;

    const playerName = String(entry.discord_username || entry.player_name || '').trim();
    updateGroupRow(nextOpenSlot.localKey, {
      player_name: playerName,
      spec_id: entry.spec_id || null,
      spec_class: entry.spec_class || null,
      spec_name: entry.spec_name || null,
      class_name: entry.class_name || null,
      note: ''
    });
    setBenchAssignments(prev => prev.filter(row => String(row.player_name || '').trim().toLowerCase() !== playerName.toLowerCase()));
  };

  const updateBenchAssignment = (rowKey, patch) => {
    setIsGroupConfigDirty(true);
    setBenchAssignments(prev => prev.map(row => (row.localKey === rowKey ? { ...row, ...patch } : row)));
  };

  const removeBenchAssignment = (rowKey) => {
    setIsGroupConfigDirty(true);
    setBenchAssignments(prev => prev.filter(row => row.localKey !== rowKey).map((row, index) => ({ ...row, slot_index: index + 1 })));
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
    } catch {
      alert('Failed to update event details.');
    } finally {
      setIsSavingEventEdit(false);
    }
  };

  const savePublicGroupsVisibility = async (nextValue) => {
    if (!selectedEventId || isReadOnly) return;
    const publicGroups = !!nextValue;
    setIsSavingPublicGroups(true);
    setEventEditDraft(prev => ({ ...prev, public_groups: publicGroups }));
    try {
      await putData(`raid-signup-events/${selectedEventId}`, { public_groups: publicGroups });
      await loadPublic();
      setSelectedEventDetails(prev => prev ? { ...prev, public_groups: publicGroups } : prev);
      setIsGroupConfigDirty(false);
      setIsEventEditDirty(false);
    } catch {
      setEventEditDraft(prev => ({ ...prev, public_groups: !publicGroups }));
      alert('Failed to update public group visibility.');
    } finally {
      setIsSavingPublicGroups(false);
    }
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
    } catch {
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
    } catch {
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

  const resetAbsenceDraft = () => {
    setEditingAbsenceId(null);
    const targetKeys = new Set((absenceTargets || []).map(target => `${target.target_type}:${target.target_type === 'user' ? Number(target.user_id || 0) : Number(target.roster_id || 0)}`));
    const preferredUserKey = `user:${currentBattleNetUserId}`;
    const preferred = isAuthenticated
      ? (currentBattleNetUserId && targetKeys.has(preferredUserKey)
        ? preferredUserKey
        : (absenceTargets[0] ? `${absenceTargets[0].target_type}:${absenceTargets[0].target_type === 'user' ? Number(absenceTargets[0].user_id || 0) : Number(absenceTargets[0].roster_id || 0)}` : ''))
      : preferredUserKey;

    setAbsenceDraft({ target_key: String(preferred || ''), start_date: '', end_date: '', note: '' });
  };

  const saveAbsence = async () => {
    if (!bnetAuthState?.authenticated && !isAuthenticated) {
      alert('Battle.net login required to submit absences.');
      return;
    }

    const payload = {
      start_date: String(absenceDraft.start_date || '').trim(),
      end_date: String(absenceDraft.end_date || '').trim(),
      note: String(absenceDraft.note || '').trim()
    };

    if (isAuthenticated) {
      const [targetType, targetIdRaw] = String(absenceDraft.target_key || '').split(':');
      const targetId = Number(targetIdRaw || 0);
      if (!targetType || !targetId) {
        alert('Choose a target character owner.');
        return;
      }
      if (targetType === 'user') payload.user_id = targetId;
      if (targetType === 'roster') payload.roster_id = targetId;
    }

    if (!payload.start_date || !payload.end_date) {
      alert('Choose both a start and end date.');
      return;
    }

    setIsSavingAbsence(true);
    try {
      if (editingAbsenceId) {
        await updateRaidSignupAbsence(editingAbsenceId, payload);
      } else {
        await createRaidSignupAbsence(payload);
      }
      const rows = await getRaidSignupAbsences();
      setAbsences(Array.isArray(rows) ? rows : []);
      resetAbsenceDraft();
    } catch (error) {
      const message = error?.payload?.error || error?.message || 'Failed to save absence.';
      alert(message);
    } finally {
      setIsSavingAbsence(false);
    }
  };

  const beginEditAbsence = (absence) => {
    setEditingAbsenceId(absence.id);
    const targetKey = absence.absence_type === 'roster'
      ? `roster:${Number(absence.roster_id || 0)}`
      : `user:${Number(absence.user_id || 0)}`;
    setAbsenceDraft({
      target_key: targetKey,
      start_date: absence.start_date || '',
      end_date: absence.end_date || '',
      note: absence.note || ''
    });
  };

  const removeAbsence = async (absenceId) => {
    if (!window.confirm('Delete this absence entry?')) return;
    try {
      await deleteRaidSignupAbsence(absenceId);
      const rows = await getRaidSignupAbsences();
      setAbsences(Array.isArray(rows) ? rows : []);
      if (String(editingAbsenceId || '') === String(absenceId || '')) {
        resetAbsenceDraft();
      }
    } catch (error) {
      const message = error?.payload?.error || error?.message || 'Failed to delete absence.';
      alert(message);
    }
  };

  const absenceCalendarGrid = useMemo(() => {
    const monthStart = absenceCalendarMonth.startOf('month');
    const calendarStart = monthStart.startOf('week');
    const days = [];
    for (let i = 0; i < 42; i += 1) {
      const day = calendarStart.plus({ days: i });
      const key = day.toFormat('yyyy-LL-dd');
      days.push({
        key,
        day,
        inMonth: day.hasSame(monthStart, 'month'),
        entries: officerAbsenceCalendar.get(key) || []
      });
    }
    return days;
  }, [absenceCalendarMonth, officerAbsenceCalendar]);

  const attendanceTracker = useMemo(() => {
    const logs = [...(Array.isArray(raidLogs) ? raidLogs : [])].sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
    const includedLogs = logs.filter(log => log.includeInAttendance !== false);
    const rosterPlayers = (Array.isArray(roster) ? roster : [])
      .filter(player => String(player?.name || '').trim())
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const rankOrder = new Map((Array.isArray(guildRoleRanks) ? guildRoleRanks : []).map(role => [String(role.name || '').trim().toLowerCase(), Number(role.rank) || 9999]));
    const claimByRosterId = new Map((Array.isArray(rosterClaims) ? rosterClaims : []).map(claim => [String(claim.rosterId || claim.roster_id || ''), claim]));
    const grouped = new Map();
    rosterPlayers.forEach(player => {
      const claim = claimByRosterId.get(String(player.id));
      const userId = claim?.userId || claim?.user_id;
      const groupKey = userId ? `user:${userId}` : `roster:${player.id}`;
      if (!grouped.has(groupKey)) grouped.set(groupKey, []);
      grouped.get(groupKey).push(player);
    });
    const players = [...grouped.values()].map(members => {
      const sortedMembers = [...members].sort((left, right) => {
        const leftRank = rankOrder.get(String(left.guild_rank || left.rank || '').trim().toLowerCase()) ?? 9999;
        const rightRank = rankOrder.get(String(right.guild_rank || right.rank || '').trim().toLowerCase()) ?? 9999;
        return leftRank - rightRank || String(left.name).localeCompare(String(right.name));
      });
      return {
        player: sortedMembers[0],
        memberIds: sortedMembers.map(member => Number(member.id)),
        memberNames: sortedMembers.map(member => member.name),
        memberUserIds: sortedMembers
          .map(member => claimByRosterId.get(String(member.id))?.userId || claimByRosterId.get(String(member.id))?.user_id)
          .map(Number)
          .filter(Boolean),
      };
    });
    const eventsForHistory = [...readableActiveEvents, ...readableArchivedEvents].map(event => historyEventDetails[String(event.id)] || event);
    const eventByDate = new Map();
    eventsForHistory.forEach(event => {
      const eventDate = parseScheduleDateTime(event.scheduled_for)?.toISODate();
      if (eventDate && !eventByDate.has(eventDate)) eventByDate.set(eventDate, event);
    });
    const normalizeStatus = status => String(status || '').trim().toLowerCase() === 'absence' ? 'absent' : String(status || '').trim().toLowerCase();
    const namesForEntry = entry => [entry?.discord_username, entry?.player_name, entry?.character_name, entry?.roster_name]
      .map(value => String(value || '').trim().toLowerCase()).filter(Boolean);
    const notifiedAbsence = (player, date) => (absences || []).some(absence => {
      const covered = String(absence?.start_date || '') <= date && String(absence?.end_date || '') >= date;
      const names = Array.isArray(absence?.claimed_characters) ? absence.claimed_characters : [];
      return covered && (Number(absence?.roster_id) === Number(player.id) || names.some(name => String(name).trim().toLowerCase() === String(player.name).trim().toLowerCase()) || String(absence?.target_character_name || '').trim().toLowerCase() === String(player.name).trim().toLowerCase());
    });
    const statusForCell = (playerGroup, log) => {
      const player = playerGroup.player;
      const memberNames = new Set(playerGroup.memberNames.map(name => String(name).trim().toLowerCase()));
      const memberUserIds = new Set((playerGroup.memberUserIds || []).map(Number));
      const savedAttendeeNames = new Set((log.attendeeNames || []).map(name => String(name).trim().toLowerCase()));
      const event = historyEventDetails[String(log.signupEventId)] || eventByDate.get(String(log.date || ''));
      const entry = Array.isArray(event?.entries)
        ? event.entries.find(candidate => namesForEntry(candidate).some(name => memberNames.has(name)) || memberUserIds.has(Number(candidate?.discord_user_id)))
        : null;
      const status = normalizeStatus(entry?.status);
      const logDate = String(log.date || '').slice(0, 10);
      const coveredAbsence = playerGroup.memberIds.some(memberId => notifiedAbsence({ ...player, id: memberId }, logDate));
      if (status === 'absent' && coveredAbsence) return 'absence';
      if (['signup', 'bench', 'late', 'tentative', 'absent'].includes(status)) return status;
      if (!status && coveredAbsence) return 'absence';
      return (log.attendees || []).map(Number).some(attendeeId => playerGroup.memberIds.includes(Number(attendeeId))) || [...memberNames].some(name => savedAttendeeNames.has(name)) ? 'signup' : 'no_signup';
    };
    const isAttendingLog = (playerGroup, log) => {
      const memberNames = new Set(playerGroup.memberNames.map(name => String(name).trim().toLowerCase()));
      if ((log.attendees || []).map(Number).some(attendeeId => playerGroup.memberIds.includes(Number(attendeeId))) || [...memberNames].some(name => (log.attendeeNames || []).map(attendeeName => String(attendeeName).trim().toLowerCase()).includes(name))) return true;
      const event = historyEventDetails[String(log.signupEventId)] || eventByDate.get(String(log.date || ''));
      const memberUserIds = new Set((playerGroup.memberUserIds || []).map(Number));
      const entry = Array.isArray(event?.entries)
        ? event.entries.find(candidate => namesForEntry(candidate).some(name => memberNames.has(name)) || memberUserIds.has(Number(candidate?.discord_user_id)))
        : null;
      return ['signup', 'bench', 'late', 'tentative'].includes(normalizeStatus(entry?.status));
    };
    const search = attendanceSearch.trim().toLowerCase();
    const filteredPlayers = players.filter(player => {
      const spec = getSpecById(player.player.spec_id);
      const rank = player.player.guild_rank || player.player.rank || 'Unranked';
      const className = player.player.class_name || player.player.class || spec?.class || '';
      const matchesSearch = !search || [...player.memberNames, rank, className].some(value => String(value).toLowerCase().includes(search));
      const statuses = includedLogs.map(log => statusForCell(player, log));
      const attended = includedLogs.filter(log => isAttendingLog(player, log)).length;
      const unnotified = statuses.filter(status => status === 'no_signup').length;
      const responsePercent = includedLogs.length === 0 ? 100 : Math.round(((includedLogs.length - unnotified) / includedLogs.length) * 100);
      const columnValues = {
        name: player.player.name,
        className,
        rank,
        attendance: includedLogs.length === 0 ? 100 : Math.round((attended / includedLogs.length) * 100),
        unnotified,
        response: responsePercent,
        ...Object.fromEntries(includedLogs.map((log, index) => [`log:${log.id}`, statuses[index]]))
      };
      const matchesColumns = Object.entries(attendanceColumnFilters).every(([key, value]) => {
        if (!value) return true;
        return String(columnValues[key] ?? '').toLowerCase().includes(String(value).toLowerCase());
      });
      return matchesSearch && (!attendanceStatusFilter || statuses.includes(attendanceStatusFilter)) && matchesColumns;
    });
    filteredPlayers.sort((left, right) => {
      const leftAttendance = includedLogs.filter(log => isAttendingLog(left, log)).length;
      const rightAttendance = includedLogs.filter(log => isAttendingLog(right, log)).length;
      const leftStatuses = includedLogs.map(log => statusForCell(left, log));
      const rightStatuses = includedLogs.map(log => statusForCell(right, log));
      const getSortValue = (player, statuses, attended) => {
        if (attendanceSort.key === 'name') return player.player.name;
        if (attendanceSort.key === 'className') return player.player.class_name || player.player.class || getSpecById(player.player.spec_id)?.class || '';
        if (attendanceSort.key === 'rank') return player.player.guild_rank || player.player.rank || 'Unranked';
        if (attendanceSort.key === 'attendance') return attended;
        if (attendanceSort.key === 'unnotified') return statuses.filter(status => status === 'no_signup').length;
        if (attendanceSort.key === 'response') return statuses.filter(status => status !== 'no_signup').length;
        const logIndex = includedLogs.findIndex(log => `log:${log.id}` === attendanceSort.key);
        return logIndex >= 0 ? statuses[logIndex] : '';
      };
      const leftValue = getSortValue(left, leftStatuses, leftAttendance);
      const rightValue = getSortValue(right, rightStatuses, rightAttendance);
      const comparison = typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue), undefined, { sensitivity: 'base' });
      return attendanceSort.direction === 'asc' ? comparison : -comparison;
    });
    return { logs, includedLogs, players: filteredPlayers, statusForCell, isAttendingLog };
  }, [absences, attendanceColumnFilters, attendanceSearch, attendanceSort, attendanceStatusFilter, getSpecById, guildRoleRanks, historyEventDetails, raidLogs, readableActiveEvents, readableArchivedEvents, roster, rosterClaims]);

  const toggleAttendanceSort = (key) => {
    setAttendanceSort(current => current.key === key
      ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { key, direction: 'asc' });
  };

  const attendanceSortIndicator = (key) => attendanceSort.key === key ? (attendanceSort.direction === 'asc' ? ' ^' : ' v') : '';
  const attendanceColumnFilter = (key) => attendanceColumnFilters[key] || '';
  const setAttendanceColumnFilter = (key, value) => setAttendanceColumnFilters(current => ({ ...current, [key]: value }));
  const expandedSignupEvent = expandedLog ? getHistoryEventForLog(expandedLog) : null;
  const expandedSignupSummary = getSignupSummary(expandedSignupEvent);
  const expandedSignupEntries = Array.isArray(expandedSignupEvent?.entries) ? expandedSignupEvent.entries : [];
  const expandedSignupGroups = Array.isArray(expandedSignupEvent?.groups)
    ? expandedSignupEvent.groups.filter(group => String(group.player_name || '').trim())
    : [];
  const expandedStatusEntries = expandedLogStatus === 'total'
    ? expandedSignupEntries
    : expandedSignupEntries.filter(entry => {
      const status = String(entry?.status || '').trim().toLowerCase();
      return (status === 'absence' ? 'absent' : status) === expandedLogStatus;
    });

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
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                          <img src={roleIconAsset(role)} alt="" className="w-4 h-4 object-contain" />
                          <span>{role}</span>
                        </h4>
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
                  <button
                    type="button"
                    onClick={refreshSignups}
                    disabled={isRefreshingSignups}
                    className="text-xs font-bold bg-cyan-700 hover:bg-cyan-600 disabled:opacity-60 text-white px-3 py-2 rounded"
                  >
                    {isRefreshingSignups ? 'Refreshing...' : 'Refresh Signups'}
                  </button>
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
                  {selectedEvent ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Signup Summary</p>
                      <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                        <button type="button" onClick={() => setExpandedSummaryStatus(prev => (prev === 'signup' ? '' : 'signup'))} className={`text-left rounded border px-2 py-1.5 ${expandedSummaryStatus === 'signup' ? 'border-emerald-400 bg-emerald-900/35' : 'border-emerald-700/40 bg-emerald-900/20 hover:bg-emerald-900/30'}`}>
                          <p className="text-[10px] text-emerald-300 uppercase tracking-wider">Sign-ups</p>
                          <p className="text-sm font-bold text-emerald-200">{selectedEventSignupSummary.signup}</p>
                        </button>
                        <button type="button" onClick={() => setExpandedSummaryStatus(prev => (prev === 'late' ? '' : 'late'))} className={`text-left rounded border px-2 py-1.5 ${expandedSummaryStatus === 'late' ? 'border-orange-400 bg-orange-900/35' : 'border-orange-700/40 bg-orange-900/20 hover:bg-orange-900/30'}`}>
                          <p className="text-[10px] text-orange-300 uppercase tracking-wider">Late</p>
                          <p className="text-sm font-bold text-orange-200">{selectedEventSignupSummary.late}</p>
                        </button>
                        <button type="button" onClick={() => setExpandedSummaryStatus(prev => (prev === 'tentative' ? '' : 'tentative'))} className={`text-left rounded border px-2 py-1.5 ${expandedSummaryStatus === 'tentative' ? 'border-cyan-400 bg-cyan-900/35' : 'border-cyan-700/40 bg-cyan-900/20 hover:bg-cyan-900/30'}`}>
                          <p className="text-[10px] text-cyan-300 uppercase tracking-wider">Tentative</p>
                          <p className="text-sm font-bold text-cyan-200">{selectedEventSignupSummary.tentative}</p>
                        </button>
                        <button type="button" onClick={() => setExpandedSummaryStatus(prev => (prev === 'bench' ? '' : 'bench'))} className={`text-left rounded border px-2 py-1.5 ${expandedSummaryStatus === 'bench' ? 'border-amber-400 bg-amber-900/35' : 'border-amber-700/40 bg-amber-900/20 hover:bg-amber-900/30'}`}>
                          <p className="text-[10px] text-amber-300 uppercase tracking-wider">Bench</p>
                          <p className="text-sm font-bold text-amber-200">{selectedEventSignupSummary.bench}</p>
                        </button>
                        <button type="button" onClick={() => setExpandedSummaryStatus(prev => (prev === 'absent' ? '' : 'absent'))} className={`text-left rounded border px-2 py-1.5 ${expandedSummaryStatus === 'absent' ? 'border-rose-400 bg-rose-900/35' : 'border-rose-700/40 bg-rose-900/20 hover:bg-rose-900/30'}`}>
                          <p className="text-[10px] text-rose-300 uppercase tracking-wider">Absent</p>
                          <p className="text-sm font-bold text-rose-200">{selectedEventSignupSummary.absent}</p>
                        </button>
                        <button type="button" onClick={() => setExpandedSummaryStatus(prev => (prev === 'total' ? '' : 'total'))} className={`text-left rounded border px-2 py-1.5 ${expandedSummaryStatus === 'total' ? 'border-slate-300 bg-slate-800/70' : 'border-slate-700/60 bg-slate-950/80 hover:bg-slate-800/70'}`}>
                          <p className="text-[10px] text-slate-300 uppercase tracking-wider">Total</p>
                          <p className="text-sm font-bold text-slate-100">{selectedEventSignupSummary.total}</p>
                        </button>
                        <button type="button" onClick={() => { setUnsignedRaiderEchoResult(null); setIsUnsignedRaidersOpen(true); }} className="text-left rounded border border-amber-700/60 bg-amber-900/20 px-2 py-1.5 hover:bg-amber-900/35">
                          <p className="whitespace-nowrap text-[10px] text-amber-300 uppercase tracking-wider">Unsigned Raiders</p>
                          <p className="text-sm font-bold text-amber-200">{unsignedRaiders.length}</p>
                        </button>
                      </div>

                      {expandedSummaryStatus ? (
                        <div className="mt-3 border-t border-slate-800 pt-3 space-y-2">
                          <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">{summaryStatusLabel(expandedSummaryStatus)}</p>
                          {expandedSummaryGroups && ['tank', 'healer', 'melee', 'ranged'].map(role => (
                            <div key={`summary-${role}`} className="rounded border border-slate-800 bg-slate-950/70 p-2">
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5">
                                <img src={roleIconAsset(role)} alt="" className="w-3.5 h-3.5 object-contain" />
                                <span>{role}</span>
                              </p>
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
                  ) : null}

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

                  {!isReadOnly ? (
                    <div className="space-y-4 border-t border-slate-800 pt-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Group Config</h4>
                        <p className="text-xs text-slate-500">Manage group assignments for the selected raid.</p>
                      </div>
                      <div className="flex items-center gap-2">
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

                    <p className="text-xs text-slate-400">
                      Template group size: <span className="text-amber-300 font-bold">{selectedTemplate ? `${normalizeTemplateGroupSize(selectedTemplate.group_size)}-man` : 'Unknown template'}</span>
                      {' '}• showing <span className="text-amber-300 font-bold">{visibleGroupCount}</span> groups
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['tank', 'healer', 'ranged', 'melee'].map(role => (
                        <div key={`group-summary-${role}`} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                          <div className="text-[10px] uppercase tracking-wider text-slate-500">{role === 'tank' ? 'Tanks' : role === 'healer' ? 'Healers' : role === 'ranged' ? 'Ranged' : 'Melee'}</div>
                          <div className="mt-1 text-lg font-bold text-amber-300">{groupRoleSummary[role] || 0}</div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 space-y-3">
                      {(benchAssignments.length > 0 || unassignedBenchCandidates.length > 0) ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Bench</p>
                            <span className="text-[10px] text-slate-400">{benchAssignments.length + unassignedBenchCandidates.length} players</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
                            {benchAssignments.map(row => {
                              const matchedEntry = selectedEventEntryByName.get(String(row.player_name || '').trim().toLowerCase()) || null;
                              const candidateColor = resolveEntryNameColor(matchedEntry || row);
                              return (
                                <div key={row.localKey} className="rounded border border-amber-700 bg-amber-950/20 p-2 text-xs space-y-2">
                                  <div className="flex items-center gap-2">
                                    <img src={resolveEntryIcon(matchedEntry || row)} alt="" className="w-4 h-4 rounded border border-slate-700 bg-slate-800" />
                                    <span className="truncate flex-1" style={{ color: candidateColor }}>{row.player_name}</span>
                                    {!isReadOnly ? (
                                      <button
                                        type="button"
                                        onClick={() => removeBenchAssignment(row.localKey)}
                                        className="text-[10px] font-bold text-amber-200 hover:text-amber-100"
                                        title="Remove from officer bench"
                                      >
                                        Remove
                                      </button>
                                    ) : null}
                                  </div>
                                  {!isReadOnly ? (
                                    <input
                                      type="text"
                                      value={String(row.note || '')}
                                      onChange={event => updateBenchAssignment(row.localKey, { note: event.target.value })}
                                      placeholder="Bench note"
                                      className="w-full bg-slate-950 text-slate-200 border border-amber-700/50 rounded px-2 py-1 text-[11px] focus:outline-none"
                                    />
                                  ) : null}
                                  {row.note && isReadOnly ? <div className="text-[10px] text-amber-200">{row.note}</div> : null}
                                </div>
                              );
                            })}
                            {unassignedBenchCandidates.map(candidate => {
                              const candidateColor = resolveEntryNameColor(candidate);
                              return (
                                <div key={`bench-${candidate.discord_user_id || candidate.discord_username}`} className="rounded border border-amber-700 bg-amber-950/20 p-2 text-xs space-y-2">
                                  <div className="flex items-center gap-2">
                                    <img src={resolveEntryIcon(candidate)} alt="" className="w-4 h-4 rounded border border-slate-700 bg-slate-800" />
                                    <span className="truncate flex-1" style={{ color: candidateColor }}>{candidate.discord_username}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400">Signed as bench</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Not assigned to group</p>
                        <span className="text-[10px] text-slate-400">{unassignedSignupCandidates.length} players</span>
                      </div>

                      {unassignedSignupCandidates.length === 0 ? (
                        <p className="text-xs text-slate-500">All available signups are already assigned to a group or bench.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
                          {unassignedSignupCandidates.map(candidate => {
                            const candidateColor = resolveEntryNameColor(candidate);
                            const normalizedStatus = String(candidate.status || '').trim().toLowerCase();
                            const isTentative = (normalizedStatus === 'absence' ? 'absent' : normalizedStatus) === 'tentative';
                            const isLate = (normalizedStatus === 'absence' ? 'absent' : normalizedStatus) === 'late';
                            const isBench = (normalizedStatus === 'absence' ? 'absent' : normalizedStatus) === 'bench';
                            return (
                              <div key={`unassigned-${candidate.discord_user_id || candidate.discord_username}`} className={`flex items-center gap-2 rounded border px-2 py-1.5 text-xs ${isTentative || isLate ? 'border-yellow-600 bg-yellow-950/20' : 'border-slate-700 bg-slate-950'}`}>
                                <img src={resolveEntryIcon(candidate)} alt="" className="w-4 h-4 rounded border border-slate-700 bg-slate-800" />
                                <span className="truncate" style={{ color: candidateColor }}>{candidate.discord_username}</span>
                                {isTentative ? <span className="text-yellow-300" title="Tentative player">⚠</span> : null}
                                {isLate ? <span className="text-orange-300" title="Late player">⏱</span> : null}
                                {!isReadOnly && !isBench ? (
                                  <div className="ml-auto flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => assignToNextOpenGroupSlot(candidate)}
                                      className="w-6 h-6 rounded border border-cyan-800 hover:bg-cyan-900/40 inline-flex items-center justify-center"
                                      title="Assign to next open group slot"
                                      aria-label={`Assign ${candidate.discord_username} to the next open group slot`}
                                    >
                                      <img src={healersIcon} alt="" className="w-4 h-4 object-contain grayscale opacity-70" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => addBenchAssignment(candidate)}
                                      className="w-6 h-6 rounded border border-cyan-800 hover:bg-cyan-900/40 inline-flex items-center justify-center"
                                      title="Add to officer bench"
                                      aria-label={`Add ${candidate.discord_username} to officer bench`}
                                    >
                                      🪑
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}

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

                      {!isReadOnly ? (
                        <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={!!echoTagAttendees}
                            onChange={e => setEchoTagAttendees(e.target.checked)}
                          />
                          Tag Attendees/Bench
                        </label>
                      ) : null}

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
                                  const normalizedPlayerName = String(row.player_name || '').trim().toLowerCase();
                                  const selectedCandidate = signupCandidates.find(candidate => String(candidate.discord_username || '').trim().toLowerCase() === normalizedPlayerName)
                                    || selectedEventEntryByName.get(normalizedPlayerName)
                                    || null;
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
                                  const isTentativeAssignment = String(selectedCandidate?.status || '').trim().toLowerCase() === 'tentative';
                                  const isAbsentAssignment = ['absence', 'absent'].includes(String(selectedCandidate?.status || '').trim().toLowerCase());

                                  return (
                                    <div key={row.localKey} className={`relative rounded-lg border p-2 space-y-2 ${isAbsentAssignment ? 'border-red-600 bg-red-950/20' : isTentativeAssignment ? 'border-yellow-600 bg-yellow-950/20' : 'border-slate-800 bg-slate-950'}`}>
                                      <div className="flex items-center gap-2 w-full min-w-0">
                                        <button
                                          type="button"
                                          disabled={isReadOnly}
                                          onClick={() => setOpenSlotPickerKey(prev => (prev === row.localKey ? '' : row.localKey))}
                                          className="min-w-0 flex-1 flex items-center justify-between gap-2 bg-slate-900 text-sm border border-slate-700 rounded px-2 py-2 text-left"
                                        >
                                          <span className="flex items-center gap-2 min-w-0">
                                            <img src={hasAssignedPlayer ? resolveEntryIcon(selectedCandidate || row) : UNKNOWN_ICON} alt="" className="w-4 h-4 rounded border border-slate-700 bg-slate-800 flex-shrink-0" />
                                            <span className="truncate flex items-center gap-1" style={{ color: selectedColor }}>
                                              {isAbsentAssignment ? <span className="text-red-300" title="Grouped player is now absent">🚫</span> : null}
                                              {isTentativeAssignment ? <span className="text-yellow-300" title="Tentative player">⚠</span> : null}
                                              {hasAssignedPlayer ? row.player_name : 'Open slot'}
                                            </span>
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
                    </div>
                  </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {activeRaidSection === 'calendar' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Officer Scheduling Calendar</h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" />Scheduled</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Auto planned</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                    <div className="text-slate-500 uppercase tracking-wider text-[10px]">Scheduled Events</div>
                    <div className="text-cyan-300 font-bold text-lg">{raidCalendarData.scheduledItems.length}</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                    <div className="text-slate-500 uppercase tracking-wider text-[10px]">Auto-Planned Next Runs</div>
                    <div className="text-amber-300 font-bold text-lg">{raidCalendarData.plannedItems.length}</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                    <div className="text-slate-500 uppercase tracking-wider text-[10px]">Templates Waiting</div>
                    <div className="text-rose-300 font-bold text-lg">{raidCalendarData.blockedTemplates.length}</div>
                  </div>
                </div>

                {raidCalendarData.blockedTemplates.length > 0 ? (
                  <div className="rounded-lg border border-rose-800/50 bg-rose-950/20 p-3 space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-rose-300">Auto recurrence currently blocked</p>
                    <ul className="space-y-1">
                      {raidCalendarData.blockedTemplates.map(item => (
                        <li key={`blocked-template-${item.templateId}`} className="text-xs text-rose-200">
                          {item.templateName}: {item.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Month Grid</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRaidCalendarMonth(prev => prev.minus({ months: 1 }))}
                        className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded"
                      >
                        Prev
                      </button>
                      <span className="text-xs text-slate-300 font-semibold min-w-[120px] text-center">{raidCalendarMonth.toFormat('LLLL yyyy')}</span>
                      <button
                        type="button"
                        onClick={() => setRaidCalendarMonth(prev => prev.plus({ months: 1 }))}
                        className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded"
                      >
                        Next
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-[10px] uppercase tracking-wider text-slate-500">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={`calendar-day-${day}`} className="px-2 py-1 font-bold">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {raidCalendarGrid.map(cell => (
                      <div key={`raid-calendar-cell-${cell.key}`} className={`min-h-[90px] rounded border p-1.5 ${cell.inMonth ? 'border-slate-700 bg-slate-950' : 'border-slate-800 bg-slate-950/50'}`}>
                        <div className={`text-[10px] font-bold ${cell.inMonth ? 'text-slate-300' : 'text-slate-600'}`}>{cell.day.day}</div>
                        <div className="mt-1 space-y-1">
                          {cell.entries.slice(0, 2).map(entry => (
                            <button
                              type="button"
                              key={`calendar-entry-${cell.key}-${entry.key}`}
                              onClick={() => navigateFromCalendarItem(entry)}
                              disabled={entry.kind !== 'scheduled' || !entry.id}
                              className={`w-full text-left text-[10px] rounded border px-1 py-0.5 truncate ${entry.kind === 'planned' ? 'bg-amber-900/30 border-amber-700/50 text-amber-200' : 'bg-cyan-900/30 border-cyan-700/50 text-cyan-200'} ${(entry.kind === 'scheduled' && entry.id) ? 'hover:brightness-110 cursor-pointer' : 'cursor-default opacity-85'}`}
                              title={`${entry.title} • ${entry.start.toFormat('dd-LL-yyyy HH:mm')} ${entry.timezone} • ${entry.sourceLabel}`}
                            >
                              {entry.title}
                            </button>
                          ))}
                          {cell.entries.length > 2 ? (
                            <div className="text-[10px] text-slate-400">+{cell.entries.length - 2} more</div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 space-y-2">
                  <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Upcoming (next 20)</p>
                  {raidCalendarUpcomingItems.length === 0 ? (
                    <p className="text-xs text-slate-500">No upcoming scheduled or auto-planned raids detected.</p>
                  ) : (
                    <div className="space-y-2">
                      {raidCalendarUpcomingItems.map(item => (
                        <button
                          key={`upcoming-${item.key}`}
                          type="button"
                          onClick={() => navigateFromCalendarItem(item)}
                          disabled={item.kind !== 'scheduled' || !item.id}
                          className={`w-full text-left rounded border border-slate-800 bg-slate-950 px-3 py-2 flex items-center justify-between gap-3 ${(item.kind === 'scheduled' && item.id) ? 'hover:border-cyan-700/60 cursor-pointer' : 'cursor-default opacity-90'}`}
                        >
                          <div className="min-w-0">
                            <div className={`text-xs font-bold uppercase tracking-wider ${item.kind === 'planned' ? 'text-amber-300' : 'text-cyan-300'}`}>{item.kind === 'planned' ? 'Planned Auto-Post' : 'Scheduled Event'}</div>
                            <div className="text-sm text-slate-100 font-semibold truncate">{item.title}</div>
                            <div className="text-xs text-slate-400">{item.start.toFormat('dd-LL-yyyy HH:mm')} {item.timezone}</div>
                          </div>
                          <div className="text-[11px] text-slate-400 text-right">{item.sourceLabel}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>
          )}

          {activeRaidSection === 'absences' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
              <style>{`
                details[open] > summary .absence-section-indicator {
                  transform: rotate(90deg);
                }
              `}</style>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Absences</h3>
                {isAuthenticated ? <span className="text-[11px] text-slate-400">Officer view includes all declared absences</span> : null}
              </div>

              {!canUseAbsences ? (
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
                  Battle.net login required to submit and manage your absences.
                </div>
              ) : (
                <>
                  <details open className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
                    <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                      <span aria-hidden="true" className="absence-section-indicator inline-block transition-transform duration-150">&gt;</span>
                      Declare absence
                    </summary>
                    <p className="text-xs text-slate-400">Declare your holiday window. Any characters claimed on your Battle.net account are marked as <span className="font-bold text-amber-300">on holiday</span> for officers.</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      {isAuthenticated ? (
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Character owner</label>
                          <select
                            value={absenceDraft.target_key}
                            onChange={e => setAbsenceDraft(prev => ({ ...prev, target_key: e.target.value }))}
                            className="w-full bg-slate-950 text-white border border-slate-700 rounded px-3 py-2 text-sm"
                          >
                            {absenceTargets.map(target => (
                              <option key={`absence-target-${target.target_type}-${target.user_id || target.roster_id}`} value={`${target.target_type}:${target.target_type === 'user' ? Number(target.user_id || 0) : Number(target.roster_id || 0)}`}>
                                {target.target_type === 'roster'
                                  ? `${target.characters?.[0] || 'Unknown'} (unclaimed)`
                                  : `${target.characters?.[0] || target.battletag} (${target.battletag})`}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Start date</label>
                        <input
                          type="date"
                          value={absenceDraft.start_date}
                          onChange={e => setAbsenceDraft(prev => ({ ...prev, start_date: e.target.value }))}
                          className="w-full bg-slate-950 text-white border border-slate-700 rounded px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">End date</label>
                        <input
                          type="date"
                          value={absenceDraft.end_date}
                          onChange={e => setAbsenceDraft(prev => ({ ...prev, end_date: e.target.value }))}
                          className="w-full bg-slate-950 text-white border border-slate-700 rounded px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Note (optional)</label>
                        <input
                          type="text"
                          value={absenceDraft.note}
                          onChange={e => setAbsenceDraft(prev => ({ ...prev, note: e.target.value }))}
                          placeholder="Travel / unavailable"
                          className="w-full bg-slate-950 text-white border border-slate-700 rounded px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={saveAbsence}
                        disabled={isSavingAbsence || (!bnetAuthState?.authenticated && !isAuthenticated)}
                        className="text-xs font-bold bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 px-3 py-2 rounded"
                      >
                        {isSavingAbsence ? 'Saving...' : (editingAbsenceId ? 'Update Absence' : 'Add Absence')}
                      </button>
                      {editingAbsenceId ? (
                        <button type="button" onClick={resetAbsenceDraft} className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded">Cancel Edit</button>
                      ) : null}
                    </div>
                  </details>

                  <details open className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
                    <summary className="flex cursor-pointer list-none items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      <span aria-hidden="true" className="absence-section-indicator inline-block transition-transform duration-150">&gt;</span>
                      My Absences
                    </summary>
                    {isLoadingAbsences ? (
                      <p className="text-xs text-slate-500">Loading absences...</p>
                    ) : myAbsences.length === 0 ? (
                      <p className="text-xs text-slate-500">No absences declared yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {myAbsences.map(absence => (
                          <div key={`my-absence-${absence.id}`} className="rounded border border-slate-800 bg-slate-950 px-3 py-2 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm text-slate-100 font-semibold">{absence.start_date} to {absence.end_date}</div>
                              {absence.note ? <div className="text-xs text-slate-400 truncate">{absence.note}</div> : null}
                            </div>
                            {absence.can_edit ? (
                              <div className="flex items-center gap-2 shrink-0">
                                <button type="button" onClick={() => beginEditAbsence(absence)} className="text-xs font-bold bg-cyan-700 hover:bg-cyan-600 text-white px-2.5 py-1.5 rounded">Edit</button>
                                <button type="button" onClick={() => removeAbsence(absence.id)} className="text-xs font-bold bg-red-700 hover:bg-red-600 text-white px-2.5 py-1.5 rounded">Delete</button>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </details>

                  {isAuthenticated ? (
                    <details open className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
                      <summary className="flex cursor-pointer list-none items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        <span aria-hidden="true" className="absence-section-indicator inline-block transition-transform duration-150">&gt;</span>
                        All Absences
                      </summary>
                      {isLoadingAbsences ? (
                        <p className="text-xs text-slate-500">Loading absences...</p>
                      ) : allAbsences.length === 0 ? (
                        <p className="text-xs text-slate-500">No absences declared yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {allAbsences.map(absence => (
                            <div key={`all-absence-${absence.id}`} className="rounded border border-slate-800 bg-slate-950 px-3 py-2 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm text-slate-100 font-semibold">{absence.start_date} to {absence.end_date}</div>
                                  <div className="text-xs text-amber-300 truncate">{absence.claimed_characters?.length > 0 ? absence.claimed_characters.join(', ') : (absence.target_character_name || absence.battletag || 'Unknown user')}</div>
                                {absence.note ? <div className="text-xs text-slate-400 truncate">{absence.note}</div> : null}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button type="button" onClick={() => beginEditAbsence(absence)} className="text-xs font-bold bg-cyan-700 hover:bg-cyan-600 text-white px-2.5 py-1.5 rounded">Edit</button>
                                <button type="button" onClick={() => removeAbsence(absence.id)} className="text-xs font-bold bg-red-700 hover:bg-red-600 text-white px-2.5 py-1.5 rounded">Delete</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </details>
                  ) : null}

                  {isAuthenticated ? (
                    <details open className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
                      <summary className="flex cursor-pointer list-none items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        <span aria-hidden="true" className="absence-section-indicator inline-block transition-transform duration-150">&gt;</span>
                        Officer Holiday Calendar
                      </summary>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAbsenceCalendarMonth(prev => prev.minus({ months: 1 }))}
                            className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded"
                          >
                            Prev
                          </button>
                          <span className="text-xs text-slate-300 font-semibold min-w-[120px] text-center">{absenceCalendarMonth.toFormat('LLLL yyyy')}</span>
                          <button
                            type="button"
                            onClick={() => setAbsenceCalendarMonth(prev => prev.plus({ months: 1 }))}
                            className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded"
                          >
                            Next
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-[10px] uppercase tracking-wider text-slate-500">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={`absence-day-${day}`} className="px-2 py-1 font-bold">{day}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {absenceCalendarGrid.map(cell => (
                          <div key={`absence-cell-${cell.key}`} className={`min-h-[88px] rounded border p-1.5 ${cell.inMonth ? 'border-slate-700 bg-slate-950' : 'border-slate-800 bg-slate-950/50'}`}>
                            <div className={`text-[10px] font-bold ${cell.inMonth ? 'text-slate-300' : 'text-slate-600'}`}>{cell.day.day}</div>
                            <div className="mt-1 space-y-1">
                              {cell.entries.slice(0, 2).map((entry, idx) => (
                                <div key={`absence-entry-${cell.key}-${entry.id}-${idx}`} className="text-[10px] rounded bg-amber-900/30 border border-amber-700/50 text-amber-200 px-1 py-0.5 truncate" title={entry.label}>
                                  {entry.characters?.length > 0 ? entry.characters.join(', ') : (entry.battletag || 'Unknown')}
                                </div>
                              ))}
                              {cell.entries.length > 2 ? (
                                <div className="text-[10px] text-slate-400">+{cell.entries.length - 2} more</div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </>
              )}
            </div>
          )}

          {activeRaidSection === 'history' && (
            isAuthenticated ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Raid History</h3>

              <div className="space-y-4">

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

                  {isRaidHelperImportVisible ? <details className="pt-3 border-t border-slate-800">
                    <summary className="cursor-pointer list-none text-[10px] text-slate-500 uppercase font-bold">RaidHelper import</summary>
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
                  </details> : null}

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
                      {[...raidLogs].sort((left, right) => String(right.date || '').localeCompare(String(left.date || ''))).map(log => {
                        const signupEvent = getHistoryEventForLog(log);
                        const summary = getSignupSummary(signupEvent);
                        const groupCount = Array.isArray(signupEvent?.groups)
                          ? new Set(signupEvent.groups.filter(group => Number(group.group_number) > 0).map(group => Number(group.group_number))).size
                          : 0;
                        return (
                        <li key={log.id} className="flex justify-between items-center bg-slate-950 border border-slate-800 p-2.5 rounded hover:border-slate-700 transition group">
                          <div className="min-w-0">
                            <span className="font-bold text-sm text-amber-500 block leading-tight">{log.date}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{log.zone} • {Math.max((log.attendees || []).length, (log.attendeeNames || []).length)} Attendees • {log.includeInAttendance === false ? 'Excluded from metrics' : 'Included in metrics'}</span>
                            {summary.total > 0 ? (
                              <span className="text-[10px] text-slate-500 block mt-1">
                                <span className="text-emerald-300">{summary.signup} signed</span>
                                <span> • </span>
                                <span className="text-orange-300">{summary.late} late</span>
                                <span> • </span>
                                <span className="text-amber-300">{summary.bench} bench</span>
                                <span> • </span>
                                <span className="text-rose-300">{summary.absent} absent</span>
                                {summary.tentative > 0 ? <><span> • </span><span className="text-cyan-300">{summary.tentative} tentative</span></> : null}
                                {groupCount > 0 ? <><span> • </span><span>{groupCount} groups</span></> : null}
                              </span>
                            ) : null}
                            {log.note ? <span className="text-[10px] text-cyan-300 block mt-1">{log.note}</span> : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 text-[10px] text-slate-400" title="Include this raid in attendance percentages and scoring">
                              <input type="checkbox" checked={log.includeInAttendance !== false} onChange={event => handleUpdateRaidLog(log.id, { includeInAttendance: event.target.checked })} className="accent-emerald-600" />
                              Metrics
                            </label>
                            <button onClick={() => { setExpandedLogStatus(''); setExpandedLog(log); }} className="text-cyan-400 hover:text-cyan-300 text-xs font-bold px-2">Pop-out</button>
                            <button onClick={() => handleDeleteRaidLog(log.id)} className="text-slate-600 hover:text-red-400 text-xs font-bold px-2">Delete</button>
                          </div>
                        </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex flex-col gap-2 mb-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Attendance Tracker</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Signup status by raid. Green cells are confirmed attendance or approved absences.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input type="search" value={attendanceSearch} onChange={event => setAttendanceSearch(event.target.value)} placeholder="Filter character, rank, class" className="w-full md:w-56 rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-slate-200 placeholder:text-slate-600" />
                      <select value={attendanceStatusFilter} onChange={event => setAttendanceStatusFilter(event.target.value)} className="rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-[11px] text-slate-300">
                        <option value="">All statuses</option>
                        <option value="signup">Signed up</option>
                        <option value="absence">Notified absence</option>
                        <option value="bench">Bench</option>
                        <option value="late">Late</option>
                        <option value="tentative">Tentative</option>
                        <option value="absent">Absent</option>
                        <option value="no_signup">No signup</option>
                      </select>
                    </div>
                  </div>
                  {attendanceTracker.includedLogs.length === 0 || attendanceTracker.players.length === 0 ? (
                    <p className="text-xs text-slate-600 italic py-4">Log an included raid and save an active roster to populate attendance.</p>
                  ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-max min-w-full table-fixed border-collapse text-xs">
                        <colgroup>
                          <col style={{ width: '260px' }} />
                          <col style={{ width: '110px' }} />
                          <col style={{ width: '110px' }} />
                          <col style={{ width: '70px' }} />
                          <col style={{ width: '78px' }} />
                          <col style={{ width: '70px' }} />
                          {attendanceTracker.includedLogs.map(log => <col key={`width-${log.id}`} style={{ width: '88px' }} />)}
                        </colgroup>
                        <thead>
                          <tr className="border-b border-slate-800">
                            {[
                              ['name', 'Name', 'text-left'],
                              ['className', 'Class', 'text-left'],
                              ['rank', 'Guild Rank', 'text-left'],
                              ['attendance', 'Att.%', 'text-center'],
                              ['unnotified', 'Unnotified', 'text-center'],
                              ['response', 'Resp.%', 'text-center']
                            ].map(([key, label, alignment]) => (
                              <th key={key} title={key === 'unnotified' ? 'Raids with no signup and no absence record' : key === 'response' ? 'Raids with any signup or absence response' : undefined} className={`sticky ${key === 'name' ? 'left-0 z-10' : ''} bg-slate-900 px-2 py-2 ${alignment} text-[10px] font-bold uppercase tracking-wider text-slate-500`}>
                                <div className="flex h-full flex-col justify-end gap-1">
                                  <button type="button" onClick={() => toggleAttendanceSort(key)} className={`${alignment} hover:text-cyan-300`}>{label}{attendanceSortIndicator(key)}</button>
                                  {!['attendance', 'unnotified', 'response'].includes(key) && <input type="search" value={attendanceColumnFilter(key)} onChange={event => setAttendanceColumnFilter(key, event.target.value)} placeholder="Filter" className="w-full rounded border border-slate-700 bg-slate-950 px-1 py-1 text-[10px] font-normal normal-case tracking-normal text-slate-300 placeholder:text-slate-600" />}
                                </div>
                              </th>
                            ))}
                            {attendanceTracker.includedLogs.map(log => (
                              <th key={log.id} className="min-w-[84px] px-2 py-2 text-center text-[10px] font-bold text-slate-400">
                                <div className="flex h-full flex-col justify-end gap-1">
                                  <button type="button" onClick={() => toggleAttendanceSort(`log:${log.id}`)} className="hover:text-cyan-300"><span className="block text-amber-500">{log.zone || 'Raid'}</span><span className="block text-slate-500">{log.date}{attendanceSortIndicator(`log:${log.id}`)}</span></button>
                                  <input type="search" value={attendanceColumnFilter(`log:${log.id}`)} onChange={event => setAttendanceColumnFilter(`log:${log.id}`, event.target.value)} placeholder="Filter" className="w-full rounded border border-slate-700 bg-slate-950 px-1 py-1 text-[10px] font-normal tracking-normal text-slate-300 placeholder:text-slate-600" />
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceTracker.players.map(player => {
                            const playerStatuses = attendanceTracker.includedLogs.map(log => attendanceTracker.statusForCell(player, log));
                            const attended = attendanceTracker.includedLogs.filter(log => attendanceTracker.isAttendingLog(player, log)).length;
                            const unnotifiedAbsences = playerStatuses.filter(status => status === 'no_signup').length;
                            const responseCount = playerStatuses.filter(status => status !== 'no_signup').length;
                            const responsePercent = attendanceTracker.includedLogs.length === 0
                              ? 100
                              : Math.round((responseCount / attendanceTracker.includedLogs.length) * 100);
                            const spec = getSpecById(player.player.spec_id);
                            const className = String(player.player.class_name || player.player.class || spec?.class || '').trim().toLowerCase();
                            const nameColor = CLASS_NAME_COLORS[className] || '#e2e8f0';
                            const rankName = player.player.guild_rank || player.player.rank || 'Unranked';
                            return (
                              <tr key={player.memberIds.join('-')} className="border-b border-slate-800/70 last:border-0">
                                <th className="sticky left-0 z-10 whitespace-nowrap bg-slate-900 px-3 py-2 text-left font-semibold" style={{ color: nameColor }}>
                                  {player.player.name} <span className="font-normal text-slate-500">{player.memberNames.length > 1 ? `(alts: ${player.memberNames.slice(1).join(', ')})` : ''}</span>
                                </th>
                                <td className="bg-slate-900 px-3 py-2 text-left text-slate-300">{player.player.class_name || player.player.class || spec?.class || 'Unknown'}</td>
                                <td className="bg-slate-900 px-3 py-2 text-left text-slate-500">{rankName}</td>
                                <td className="bg-slate-900 px-3 py-2 text-center font-bold text-slate-300">{attendanceTracker.includedLogs.length === 0 ? '100%' : `${Math.round((attended / attendanceTracker.includedLogs.length) * 100)}%`}</td>
                                <td className="bg-slate-900 px-2 py-2 text-center font-bold text-rose-300">{unnotifiedAbsences}</td>
                                <td className="bg-slate-900 px-2 py-2 text-center font-bold text-cyan-300">{responsePercent}%</td>
                                {attendanceTracker.includedLogs.map(log => {
                                  const status = attendanceTracker.statusForCell(player, log);
                                  const statusMeta = {
                                    signup: { symbol: '✓', label: 'Signed up', color: 'bg-emerald-700/80 text-emerald-50' },
                                    absence: { symbol: 'A', label: 'Notified absence', color: 'bg-emerald-700/80 text-emerald-50' },
                                    bench: {
                                      symbol: (
                                        <svg viewBox="0 0 24 24" className="inline-block h-4 w-4" fill="none" aria-hidden="true" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                                          <path d="M5 5l14 14" />
                                          <path d="M9 5h6a4 4 0 0 1 4 4v6" />
                                          <path d="M5 9v6a4 4 0 0 0 4 4h6" />
                                        </svg>
                                      ),
                                      label: 'Bench',
                                      color: 'bg-emerald-700/80 text-emerald-50'
                                    },
                                    late: { symbol: 'L', label: 'Late', color: 'bg-yellow-900/75 text-yellow-100' },
                                    tentative: { symbol: '?', label: 'Tentative', color: 'bg-yellow-900/75 text-yellow-100' },
                                    absent: { symbol: '×', label: 'Absent', color: 'bg-red-950/90 text-red-100' },
                                    no_signup: { symbol: '−', label: 'No signup', color: 'bg-slate-800/80 text-slate-400' }
                                  }[status];
                                  return <td key={log.id} className={`px-2 py-2 text-center font-bold ${statusMeta.color}`} aria-label={`${player.name}: ${statusMeta.label} for ${log.zone || 'raid'} ${log.date}`} title={statusMeta.label}>{statusMeta.symbol}</td>;
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
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
                {expandedLog.note ? <p className="text-xs text-cyan-300 mt-1">{expandedLog.note}</p> : null}
              </div>
              <button onClick={() => setExpandedLog(null)} className="text-slate-400 hover:text-slate-200 text-xl leading-none">✕</button>
            </div>
            {expandedSignupEvent ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {[
                    ['signup', 'Sign-ups', expandedSignupSummary.signup, 'border-emerald-700/50 text-emerald-300'],
                    ['late', 'Late', expandedSignupSummary.late, 'border-orange-700/50 text-orange-300'],
                    ['tentative', 'Tentative', expandedSignupSummary.tentative, 'border-cyan-700/50 text-cyan-300'],
                    ['bench', 'Bench', expandedSignupSummary.bench, 'border-amber-700/50 text-amber-300'],
                    ['absent', 'Absent', expandedSignupSummary.absent, 'border-rose-700/50 text-rose-300'],
                    ['total', 'Total', expandedSignupSummary.total, 'border-slate-700 text-slate-200']
                  ].map(([status, label, count, color]) => (
                    <button
                      key={`expanded-summary-${status}`}
                      type="button"
                      onClick={() => setExpandedLogStatus(current => current === status ? '' : status)}
                      className={`rounded border bg-slate-950 px-2 py-2 text-left ${color} ${expandedLogStatus === status ? 'ring-1 ring-cyan-400' : ''}`}
                    >
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
                      <div className="mt-1 text-lg font-bold">{count}</div>
                    </button>
                  ))}
                </div>

                {expandedLogStatus ? (
                  <div className="border-t border-slate-800 pt-3">
                    <h4 className="text-[11px] text-slate-400 uppercase tracking-wider font-bold mb-2">{summaryStatusLabel(expandedLogStatus)}</h4>
                    {expandedStatusEntries.length === 0 ? (
                      <p className="text-xs text-slate-600 italic">None</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {expandedStatusEntries.map(entry => {
                          return (
                            <div key={`expanded-entry-${entry.discord_user_id}-${entry.status}`} className="bg-slate-950 border border-slate-800 rounded p-2.5">
                              <div className="flex items-center gap-2 text-sm font-bold" style={{ color: resolveEntryNameColor(entry) }}>
                                <img src={resolveEntryIcon(entry)} alt="" className="h-5 w-5 shrink-0 rounded border border-slate-700 bg-slate-800" />
                                <span className="truncate">{entry.discord_username || entry.character_name || entry.player_name}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}

                {expandedSignupGroups.length > 0 ? (
                  <div className="border-t border-slate-800 pt-3 space-y-2">
                    <h4 className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">Groups</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[...new Set(expandedSignupGroups.map(group => Number(group.group_number)))].sort((a, b) => a - b).map(groupNumber => {
                        const groupMembers = expandedSignupGroups.filter(group => Number(group.group_number) === groupNumber);
                        const groupName = groupMembers[0]?.group_name || (groupNumber === 0 ? 'Bench' : `Group ${groupNumber}`);
                        return (
                          <div key={`expanded-group-${groupNumber}`} className="bg-slate-950 border border-slate-800 rounded p-2.5">
                            <div className="text-xs font-bold text-slate-200 mb-1">{groupName}</div>
                            <div className="space-y-1">
                              {groupMembers.map((member, index) => (
                                <div key={`expanded-group-member-${groupNumber}-${member.id || index}`} className="text-xs text-slate-300 flex items-center justify-between gap-2">
                                  <span className="flex min-w-0 items-center gap-1.5">
                                    <img src={resolveEntryIcon(member)} alt="" className="h-4 w-4 shrink-0 rounded border border-slate-700 bg-slate-800" />
                                    <span className="truncate" style={{ color: resolveEntryNameColor(member) }}>{member.player_name}</span>
                                  </span>
                                  {member.spec_name ? <span className="shrink-0 text-[10px] text-slate-500">{member.spec_name}</span> : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
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
            )}
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

      {isUnsignedRaidersOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" onClick={() => setIsUnsignedRaidersOpen(false)}>
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Unsigned Raiders</h3>
                <p className="mt-1 text-xs text-slate-400">{selectedEvent?.title || 'Selected event'}</p>
              </div>
              <button type="button" onClick={() => setIsUnsignedRaidersOpen(false)} className="text-xl text-slate-400 hover:text-white" aria-label="Close unsigned raiders">×</button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">{selectedUnsignedRaiderIds.size} of {unsignedRaiders.length} selected</p>
              {unsignedRaiders.length > 0 ? (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setSelectedUnsignedRaiderIds(new Set(unsignedRaiders.map(({ player }) => String(player.id))))} className="text-[11px] font-semibold text-cyan-300 hover:text-cyan-200">Select all</button>
                  <button type="button" onClick={() => setSelectedUnsignedRaiderIds(new Set())} className="text-[11px] font-semibold text-slate-400 hover:text-slate-200">Clear all</button>
                </div>
              ) : null}
            </div>

            <div className="mt-2 space-y-2">
              {unsignedRaiders.length === 0 ? (
                <p className="rounded border border-slate-800 bg-slate-950 p-3 text-sm text-slate-500">No unsigned raiders for this event.</p>
              ) : unsignedRaiders.map(({ player, absence }) => (
                <label key={`unsigned-raider-${player.id}`} className="flex cursor-pointer items-center justify-between gap-3 rounded border border-slate-800 bg-slate-950 px-3 py-2 hover:border-slate-600">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedUnsignedRaiderIds.has(String(player.id))}
                      onChange={() => setSelectedUnsignedRaiderIds(current => {
                        const next = new Set(current);
                        const playerId = String(player.id);
                        if (next.has(playerId)) next.delete(playerId);
                        else next.add(playerId);
                        return next;
                      })}
                    />
                    <img src={resolveEntryIcon(player)} alt="" className="h-5 w-5 rounded border border-slate-700 bg-slate-800" />
                    <span className="text-sm" style={{ color: resolveEntryNameColor(player) }}>{player.name}</span>
                  </span>
                  <span className={absence ? 'text-xs font-semibold text-amber-300' : 'text-xs text-slate-500'}>{absence ? 'Absence recorded' : 'No absence recorded'}</span>
                </label>
              ))}
            </div>

            {!isReadOnly && unsignedRaiders.length > 0 ? (
              <>
                <label className="mt-4 inline-flex items-center gap-2 text-xs text-slate-300">
                  <input type="checkbox" checked={echoTagUnsignedRaiders} onChange={event => setEchoTagUnsignedRaiders(event.target.checked)} />
                  Ping linked raiders in Discord
                </label>
                <p className="mt-2 text-xs text-slate-500">Only Discord users who have previously saved one of these character names will be pinged.</p>
                <button
                  type="button"
                  onClick={echoUnsignedRaiders}
                      disabled={isEchoingUnsignedRaiders || selectedUnsignedRaiderIds.size === 0}
                  className="mt-4 w-full rounded bg-amber-600 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isEchoingUnsignedRaiders ? 'Sending...' : 'Echo Unsigned Raiders to Discord'}
                </button>
              </>
            ) : null}

            {unsignedRaiderEchoResult?.error ? (
              <p className="mt-3 rounded border border-rose-800/60 bg-rose-950/30 p-2 text-xs text-rose-300">{unsignedRaiderEchoResult.error}</p>
            ) : null}
            {unsignedRaiderEchoResult?.ok ? (
              <div className="mt-3 rounded border border-emerald-800/60 bg-emerald-950/30 p-2 text-xs text-emerald-300">
                <p>Discord message sent.</p>
                {unsignedRaiderEchoResult.unmatched?.length > 0 ? <p className="mt-1 text-amber-300">No Discord ID found for: {unsignedRaiderEchoResult.unmatched.join(', ')}</p> : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
