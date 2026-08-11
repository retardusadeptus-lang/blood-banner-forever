const { DateTime } = require('luxon');

const DEFAULT_RAID_TIMEZONE = 'Europe/Paris';

const YMD_TIME_RE = /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?(?:\s+([^\s]+))?$/i;
const DMY_TIME_RE = /^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}))?(?:\s+([^\s]+))?$/i;

function normalizeTimezone(zone) {
  const raw = String(zone || '').trim();
  if (!raw) return DEFAULT_RAID_TIMEZONE;

  const upper = raw.toUpperCase();
  if (upper === 'CET' || upper === 'CEST' || upper === 'PARIS') {
    return DEFAULT_RAID_TIMEZONE;
  }

  const dt = DateTime.now().setZone(raw);
  return dt.isValid ? raw : DEFAULT_RAID_TIMEZONE;
}

function parseScheduleText(value, fallbackZone = DEFAULT_RAID_TIMEZONE) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const normalizedFallback = normalizeTimezone(fallbackZone);

  const ymd = raw.match(YMD_TIME_RE);
  if (ymd) {
    const [, yyyy, mm, dd, hh = '20', min = '00', zoneText = ''] = ymd;
    const zone = normalizeTimezone(zoneText || normalizedFallback);
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

  const dmy = raw.match(DMY_TIME_RE);
  if (dmy) {
    const [, dd, mm, yyyy, hh = '20', min = '00', zoneText = ''] = dmy;
    const zone = normalizeTimezone(zoneText || normalizedFallback);
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
  if (iso.isValid) return iso;

  const js = new Date(raw.replace(' ', 'T'));
  if (!Number.isNaN(js.getTime())) {
    const dt = DateTime.fromJSDate(js).setZone(normalizedFallback);
    return dt.isValid ? dt : null;
  }

  return null;
}

function formatScheduleText(dateObj, zone = DEFAULT_RAID_TIMEZONE) {
  const normalized = normalizeTimezone(zone);
  const dt = DateTime.fromJSDate(dateObj).setZone(normalized);
  if (!dt.isValid) return null;
  return `${dt.toFormat('yyyy-MM-dd HH:mm')} ${normalized}`;
}

function normalizeScheduledForText(value, zone = DEFAULT_RAID_TIMEZONE) {
  const parsed = parseScheduleText(value, zone);
  if (!parsed) return String(value || '').trim();
  const normalized = normalizeTimezone(zone || parsed.zoneName || DEFAULT_RAID_TIMEZONE);
  return `${parsed.setZone(normalized).toFormat('yyyy-MM-dd HH:mm')} ${normalized}`;
}

function parseScheduledUnix(value, fallbackZone = DEFAULT_RAID_TIMEZONE) {
  const parsed = parseScheduleText(value, fallbackZone);
  if (!parsed) return null;
  return Math.floor(parsed.toSeconds());
}

function parseScheduledDate(value, fallbackZone = DEFAULT_RAID_TIMEZONE) {
  const parsed = parseScheduleText(value, fallbackZone);
  if (!parsed) return null;
  return parsed.toJSDate();
}

module.exports = {
  DEFAULT_RAID_TIMEZONE,
  normalizeTimezone,
  parseScheduleText,
  parseScheduledUnix,
  parseScheduledDate,
  formatScheduleText,
  normalizeScheduledForText
};
