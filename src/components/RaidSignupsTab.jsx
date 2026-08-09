import React, { useEffect, useMemo, useState } from 'react';

const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' }
];

function emptyTemplate() {
  return {
    id: Date.now(),
    name: '',
    description: '',
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
  const raw = String(value || '').trim();
  if (!raw) return null;

  const ddmmyyyy = raw.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}))?(?:\s*CET)?$/i);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy, hh = '20', min = '00'] = ddmmyyyy;
    const iso = `${yyyy}-${mm}-${dd}T${hh}:${min}:00+01:00`;
    const parsedIso = Date.parse(iso);
    if (!Number.isNaN(parsedIso)) {
      return Math.floor(parsedIso / 1000);
    }
  }

  const yyyymmdd = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?(?:\s*CET)?$/i);
  if (yyyymmdd) {
    const [, yyyy, mm, dd, hh = '20', min = '00'] = yyyymmdd;
    const iso = `${yyyy}-${mm}-${dd}T${hh}:${min}:00+01:00`;
    const parsedIso = Date.parse(iso);
    if (!Number.isNaN(parsedIso)) {
      return Math.floor(parsedIso / 1000);
    }
  }

  const normalized = raw.replace(' ', 'T');
  const parsed = Date.parse(normalized);
  if (Number.isNaN(parsed)) return null;
  return Math.floor(parsed / 1000);
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
  const raw = String(scheduledFor || '').trim();
  if (!raw) {
    return { scheduled_date: '', scheduled_time: '20:00' };
  }

  const ddmmyyyy = raw.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}:\d{2}))?/);
  if (ddmmyyyy) {
    return {
      scheduled_date: `${ddmmyyyy[1]}-${ddmmyyyy[2]}-${ddmmyyyy[3]}`,
      scheduled_time: ddmmyyyy[4] || '20:00'
    };
  }

  const yyyymmdd = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}))?/);
  if (yyyymmdd) {
    return {
      scheduled_date: `${yyyymmdd[3]}-${yyyymmdd[2]}-${yyyymmdd[1]}`,
      scheduled_time: yyyymmdd[4] || '20:00'
    };
  }

  return { scheduled_date: '', scheduled_time: '20:00' };
}

function buildScheduledForValue(scheduledDate, scheduledTime) {
  const dateRaw = String(scheduledDate || '').trim();
  if (!dateRaw) return '';

  const dateParts = dateRaw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!dateParts) return '';

  const timeRaw = String(scheduledTime || '').trim() || '20:00';
  const timeParts = timeRaw.match(/^(\d{2}):(\d{2})$/);
  const safeTime = timeParts ? `${timeParts[1]}:${timeParts[2]}` : '20:00';
  const [, dd, mm, yyyy] = dateParts;
  return `${yyyy}-${mm}-${dd} ${safeTime} CET`;
}

export default function RaidSignupsTab({
  fetchData,
  putData,
  postData,
  deleteData,
  isAuthenticated,
  specsFromDb,
  activeSection
}) {
  const [events, setEvents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [archivedEvents, setArchivedEvents] = useState([]);
  const [isSavingTemplates, setIsSavingTemplates] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventEditDraft, setEventEditDraft] = useState({ title: '', description: '', scheduled_date: '', scheduled_time: '20:00', public_groups: false });
  const [groupRows, setGroupRows] = useState(buildDefaultGroupRows());
  const [isSavingGroups, setIsSavingGroups] = useState(false);
  const [isEchoing, setIsEchoing] = useState(false);
  const [isSavingEventEdit, setIsSavingEventEdit] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [clockNow, setClockNow] = useState(Date.now());
  const activeRaidSection = activeSection || 'templates';

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
    if (!selectedEventId) {
      setGroupRows(buildDefaultGroupRows());
      setEventEditDraft({ title: '', description: '', scheduled_date: '', scheduled_time: '20:00', public_groups: false });
      return;
    }

    const loadGroups = async () => {
      try {
        const rows = await fetchData(`raid-signup-groups/${selectedEventId}`);
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
            note: row.note || ''
          });
        });
        setGroupRows([...byKey.values()]);
      } catch (e) {
        console.error('Failed to load raid signup groups', e);
      }
    };

    loadGroups();
  }, [selectedEventId]);

  const selectedEvent = useMemo(
    () => [...events, ...archivedEvents].find(event => String(event.id) === String(selectedEventId)) || null,
    [events, archivedEvents, selectedEventId]
  );

  useEffect(() => {
    if (!selectedEvent) {
      setEventEditDraft({ title: '', description: '', scheduled_date: '', scheduled_time: '20:00', public_groups: false });
      return;
    }

    const schedule = parseScheduleParts(selectedEvent.scheduled_for);

    setEventEditDraft({
      title: selectedEvent.title || '',
      description: selectedEvent.description || '',
      scheduled_date: schedule.scheduled_date,
      scheduled_time: schedule.scheduled_time,
      public_groups: !!selectedEvent.public_groups
    });
  }, [selectedEvent]);

  useEffect(() => {
    const timer = setInterval(() => setClockNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const signupCandidates = useMemo(() => {
    if (!selectedEvent) return [];
    const entries = Array.isArray(selectedEvent.entries) ? selectedEvent.entries : [];
    return entries
      .filter(entry => String(entry.status || '').toLowerCase() === 'signup')
      .sort((a, b) => {
        const roleDiff = roleSortKey(a.role_bucket) - roleSortKey(b.role_bucket);
        if (roleDiff !== 0) return roleDiff;
        return String(a.discord_username || '').localeCompare(String(b.discord_username || ''));
      });
  }, [selectedEvent]);

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
        .filter(row => String(row.player_name || '').trim())
        .map(row => ({
          group_number: row.group_number,
          group_name: row.group_name,
          slot_index: row.slot_index,
          player_name: row.player_name,
          spec_id: row.spec_id || null,
          note: row.note || ''
        }));
      await putData(`raid-signup-groups/${selectedEventId}`, payload);
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
    setGroupRows(prev => prev.map(row => (row.localKey === rowKey ? { ...row, ...patch } : row)));
  };

  const updateGroupName = (groupNumber, groupName) => {
    setGroupRows(prev => prev.map(row => (
      row.group_number === groupNumber ? { ...row, group_name: groupName } : row
    )));
  };

  const saveEventDetails = async () => {
    if (!selectedEventId) return;
    setIsSavingEventEdit(true);
    try {
      const scheduledFor = buildScheduledForValue(eventEditDraft.scheduled_date, eventEditDraft.scheduled_time);
      await putData(`raid-signup-events/${selectedEventId}`, {
        title: eventEditDraft.title,
        description: eventEditDraft.description,
        scheduled_for: scheduledFor,
        public_groups: !!eventEditDraft.public_groups
      });
      await loadPublic();
      alert('Event details updated.');
    } catch (e) {
      alert('Failed to update event details.');
    } finally {
      setIsSavingEventEdit(false);
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
                      <p className="text-xs text-slate-400 uppercase tracking-wider">Event #{event.id} {event.scheduled_for ? `• ${event.scheduled_for}` : ''}</p>
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
                                {entry.icon_small || entry.icon_medium || entry.icon_large ? (
                                  <img src={entry.icon_small || entry.icon_medium || entry.icon_large} alt="" className="w-4 h-4 rounded border border-slate-700" />
                                ) : (
                                  <span className="w-4 h-4 rounded border border-slate-700 bg-slate-800 inline-block" />
                                )}
                                <span
                                  className="truncate"
                                  style={{
                                    color: specColorByKey.get(`${String(entry.spec_class || '').toLowerCase()}|${String(entry.spec_name || '').toLowerCase()}`) || '#e2e8f0'
                                  }}
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
                                  const rowColor = specColorByKey.get(`${String(row.spec_class || '').toLowerCase()}|${String(row.spec_name || '').toLowerCase()}`) || '#e2e8f0';
                                  return (
                                    <li key={`${row.id}-${row.slot_index}`} className="text-xs text-slate-200 flex items-center gap-2">
                                      {row.icon_small || row.icon_medium || row.icon_large ? (
                                        <img src={row.icon_small || row.icon_medium || row.icon_large} alt="" className="w-3.5 h-3.5 rounded border border-slate-700" />
                                      ) : (
                                        <span className="w-3.5 h-3.5 rounded border border-slate-700 bg-slate-800 inline-block" />
                                      )}
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
            isAuthenticated ? (
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
                    {events.length > 0 && (
                      <optgroup label="Active events">
                        {events.map(event => (
                          <option key={`active-${event.id}`} value={event.id}>#{event.id} [{event.status}] {event.title}</option>
                        ))}
                      </optgroup>
                    )}
                    {archivedEvents.length > 0 && (
                      <optgroup label="Archived events">
                        {archivedEvents.map(event => (
                          <option key={`archived-${event.id}`} value={event.id}>#{event.id} [{event.status}] {event.title}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  {selectedEvent && String(selectedEvent.status || '').toLowerCase() !== 'open' ? (
                    <button
                      type="button"
                      onClick={() => setEventStatus('open', `Reopen this raid? Signups will be enabled.`)}
                      disabled={!selectedEventId || isChangingStatus || isDeletingEvent}
                      className="text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-2 rounded"
                    >
                      {isChangingStatus ? 'Working...' : (String(selectedEvent.status || '').toLowerCase() === 'archived' ? 'Restore Raid' : 'Unlock Raid')}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setEventStatus('locked', 'Lock this raid? Signups will be disabled but it stays visible.')}
                    disabled={!selectedEventId || isChangingStatus || isDeletingEvent}
                    className="text-xs font-bold bg-orange-700 hover:bg-orange-600 text-white px-3 py-2 rounded"
                  >
                    {isChangingStatus ? 'Working...' : 'Lock Raid'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventStatus('archived', 'Archive this raid? It will be removed from the active board.')}
                    disabled={!selectedEventId || isChangingStatus || isDeletingEvent}
                    className="text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded"
                  >
                    {isChangingStatus ? 'Working...' : 'Archive Raid'}
                  </button>
                  <button
                    type="button"
                    onClick={deleteEvent}
                    disabled={!selectedEventId || isDeletingEvent || isChangingStatus}
                    className="text-xs font-bold bg-red-700 hover:bg-red-600 text-white px-3 py-2 rounded"
                  >
                    {isDeletingEvent ? 'Deleting...' : 'Delete Raid'}
                  </button>
                </div>
              </div>

              {!selectedEventId ? (
                <p className="text-xs text-slate-500">Choose an event to edit details or manage its status.</p>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={eventEditDraft.title}
                      onChange={e => setEventEditDraft(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Event title"
                      className="bg-slate-950 text-white border border-slate-700 rounded px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={eventEditDraft.scheduled_date}
                      onChange={e => setEventEditDraft(prev => ({ ...prev, scheduled_date: e.target.value }))}
                      placeholder="DD-MM-YYYY"
                      className="bg-slate-950 text-white border border-slate-700 rounded px-3 py-2 text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={eventEditDraft.scheduled_time}
                        onChange={e => setEventEditDraft(prev => ({ ...prev, scheduled_time: e.target.value }))}
                        placeholder="HH:mm"
                        className="flex-1 bg-slate-950 text-white border border-slate-700 rounded px-3 py-2 text-sm"
                      />
                      <span className="text-xs font-bold text-cyan-300">CET</span>
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
                      onChange={e => setEventEditDraft(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Event description"
                      className="md:col-span-3 bg-slate-950 text-white border border-slate-700 rounded px-3 py-2 text-sm min-h-[70px]"
                    />
                    <label className="md:col-span-3 inline-flex items-center gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={!!eventEditDraft.public_groups}
                        onChange={e => setEventEditDraft(prev => ({ ...prev, public_groups: e.target.checked }))}
                      />
                      Public groups: show group assignments in read-only public view
                    </label>
                  </div>
                </div>
              )}
            </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <p className="text-sm text-slate-300">Officer login required to manage raid events.</p>
              </div>
            )
          )}

          {activeRaidSection === 'group-config' && (
            isAuthenticated ? (
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
                    {events.length > 0 && (
                      <optgroup label="Active events">
                        {events.map(event => (
                          <option key={`active-${event.id}`} value={event.id}>#{event.id} [{event.status}] {event.title}</option>
                        ))}
                      </optgroup>
                    )}
                    {archivedEvents.length > 0 && (
                      <optgroup label="Archived events">
                        {archivedEvents.map(event => (
                          <option key={`archived-${event.id}`} value={event.id}>#{event.id} [{event.status}] {event.title}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={saveGroups}
                    disabled={!selectedEventId || isSavingGroups}
                    className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 px-3 py-2 rounded"
                  >
                    {isSavingGroups ? 'Saving...' : 'Save Groups'}
                  </button>
                  <button
                    type="button"
                    onClick={echoGroups}
                    disabled={!selectedEventId || isEchoing}
                    className="text-xs font-bold bg-purple-700 hover:bg-purple-600 text-white px-3 py-2 rounded"
                  >
                    {isEchoing ? 'Echoing...' : 'Echo To Discord'}
                  </button>
                </div>
              </div>

              {!selectedEventId ? (
                <p className="text-xs text-slate-500">Choose an event to configure groups and echo them to Discord.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  {Array.from({ length: 8 }, (_, idx) => idx + 1).map(groupNumber => {
                    const rows = groupRows.filter(row => row.group_number === groupNumber).sort((a, b) => a.slot_index - b.slot_index);
                    const activeRows = rows.filter(row => String(row.player_name || '').trim());
                    return (
                      <div key={groupNumber} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">Group {groupNumber}</h4>
                        {activeRows.length === 0 ? (
                          <p className="text-xs text-slate-600 italic">No players assigned</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {activeRows.map(row => (
                              <li key={row.localKey} className="text-sm text-slate-200">{row.player_name}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <p className="text-sm text-slate-300">Officer login required to configure raid groups.</p>
              </div>
            )
          )}

          {activeRaidSection === 'history' && (
            isAuthenticated ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Raid History</h3>
              {archivedEvents.length === 0 ? (
                <p className="text-xs text-slate-500">No archived raid events yet.</p>
              ) : (
                <div className="space-y-2">
                  {archivedEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-100">{event.title || `Event #${event.id}`}</div>
                        <div className="text-xs text-slate-500">{event.scheduled_for || 'No schedule'}</div>
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
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <p className="text-sm text-slate-300">Officer login required to view raid history.</p>
              </div>
            )
          )}

        </>
    </section>
  );
}
