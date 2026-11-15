const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ABSENCE_DATES = 366;
const DISCORD_ABSENCE_NOTE = 'Added via Discord';

function isIsoDate(value) {
  const dateText = String(value || '').trim();
  if (!ISO_DATE_PATTERN.test(dateText)) return false;

  const parsed = new Date(`${dateText}T00:00:00.000Z`);
  return parsed.toISOString().slice(0, 10) === dateText;
}

function shiftDate(dateText, days) {
  const date = new Date(`${dateText}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function expandAbsenceInput(value) {
  const dates = new Set();
  const values = String(value || '')
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);

  for (const entry of values) {
    const range = entry.match(/^(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})$/i);
    if (range) {
      const [, startDate, endDate] = range;
      if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
        throw new Error('Use valid calendar dates in YYYY-MM-DD format.');
      }
      if (startDate > endDate) {
        throw new Error('Date ranges must start before they end.');
      }

      let currentDate = startDate;
      while (currentDate <= endDate) {
        dates.add(currentDate);
        if (dates.size > MAX_ABSENCE_DATES) {
          throw new Error(`A single absence update cannot contain more than ${MAX_ABSENCE_DATES} dates.`);
        }
        currentDate = shiftDate(currentDate, 1);
      }
      continue;
    }

    if (ISO_DATE_PATTERN.test(entry) && !isIsoDate(entry)) {
      throw new Error('Use valid calendar dates in YYYY-MM-DD format.');
    }
    if (!isIsoDate(entry)) {
      throw new Error('Use YYYY-MM-DD dates or ranges like 2026-10-05 to 2026-10-15.');
    }
    dates.add(entry);
    if (dates.size > MAX_ABSENCE_DATES) {
      throw new Error(`A single absence update cannot contain more than ${MAX_ABSENCE_DATES} dates.`);
    }
  }

  if (dates.size === 0) {
    throw new Error('Enter at least one absence date.');
  }

  return [...dates].sort();
}

function resolveDiscordUser(db, discordUserId) {
  const normalizedDiscordUserId = String(discordUserId || '').trim();
  if (!normalizedDiscordUserId) {
    return { userId: null, reason: 'missing-discord-id' };
  }

  const rows = db.prepare(`
    SELECT DISTINCT user_id
    FROM roster
    WHERE discord_user_id = ? AND user_id IS NOT NULL
  `).all(normalizedDiscordUserId);
  const userIds = [...new Set(rows.map(row => Number(row.user_id)).filter(Boolean))];

  if (userIds.length === 0) {
    return { userId: null, reason: 'not-linked' };
  }
  if (userIds.length > 1) {
    return { userId: null, reason: 'ambiguous-link' };
  }

  return { userId: userIds[0], reason: null };
}

function listAbsences(db, userId, today = new Date().toISOString().slice(0, 10)) {
  return db.prepare(`
    SELECT id, user_id, start_date, end_date, note, created_at, updated_at
    FROM raid_signup_absences
    WHERE user_id = ? AND end_date >= ?
    ORDER BY start_date ASC, id ASC
  `).all(userId, today);
}

function formatAbsenceRow(row) {
  const startDate = String(row.start_date || '');
  const endDate = String(row.end_date || '');
  return startDate === endDate ? startDate : `${startDate} to ${endDate}`;
}

function formatAbsenceList(rows, maxLength = 1800) {
  if (!rows.length) return 'No upcoming raid absences are recorded.';

  const lines = ['Upcoming raid absences:'];
  for (const row of rows) {
    const line = `- ${formatAbsenceRow(row)}${row.note ? ` (${row.note})` : ''}`;
    const next = `${lines.join('\n')}\n${line}`;
    if (next.length > maxLength) {
      lines.push('- More absences are recorded but could not fit in this Discord response.');
      break;
    }
    lines.push(line);
  }
  return lines.join('\n');
}

function addAbsenceDates(db, userId, dates) {
  const findExisting = db.prepare(`
    SELECT id
    FROM raid_signup_absences
    WHERE user_id = ? AND start_date <= ? AND end_date >= ?
    LIMIT 1
  `);
  const insert = db.prepare(`
    INSERT INTO raid_signup_absences (user_id, start_date, end_date, note, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  return db.transaction(() => {
    let added = 0;
    let alreadyRecorded = 0;
    dates.forEach(date => {
      if (findExisting.get(userId, date, date)) {
        alreadyRecorded += 1;
        return;
      }
      insert.run(userId, date, date, DISCORD_ABSENCE_NOTE);
      added += 1;
    });
    return { added, alreadyRecorded };
  })();
}

function removeDateFromRow(statements, userId, row, date) {
  const startDate = String(row.start_date || '');
  const endDate = String(row.end_date || '');

  if (startDate === date && endDate === date) {
    statements.delete.run(row.id);
    return;
  }

  if (startDate === date) {
    statements.updateStart.run(shiftDate(date, 1), row.id);
    return;
  }

  if (endDate === date) {
    statements.updateEnd.run(shiftDate(date, -1), row.id);
    return;
  }

  statements.updateEnd.run(shiftDate(date, -1), row.id);
  statements.insert.run(userId, shiftDate(date, 1), endDate, row.note || DISCORD_ABSENCE_NOTE);
}

function removeAbsenceDates(db, userId, dates) {
  const findExisting = db.prepare(`
    SELECT id, user_id, start_date, end_date, note
    FROM raid_signup_absences
    WHERE user_id = ? AND start_date <= ? AND end_date >= ?
    ORDER BY id ASC
  `);
  const statements = {
    delete: db.prepare('DELETE FROM raid_signup_absences WHERE id = ?'),
    updateStart: db.prepare('UPDATE raid_signup_absences SET start_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),
    updateEnd: db.prepare('UPDATE raid_signup_absences SET end_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),
    insert: db.prepare(`
      INSERT INTO raid_signup_absences (user_id, start_date, end_date, note, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
  };

  return db.transaction(() => {
    let removed = 0;
    dates.forEach(date => {
      const rows = findExisting.all(userId, date, date);
      if (rows.length === 0) return;
      rows.forEach(row => removeDateFromRow(statements, userId, row, date));
      removed += 1;
    });
    return { removed, notRecorded: dates.length - removed };
  })();
}

module.exports = {
  MAX_ABSENCE_DATES,
  addAbsenceDates,
  expandAbsenceInput,
  formatAbsenceList,
  formatAbsenceRow,
  isIsoDate,
  listAbsences,
  removeAbsenceDates,
  resolveDiscordUser,
  shiftDate
};
