export function getAttendanceChartEntries({ raidLogs = [], playerId, playerName = '', absences = [] }) {
  const targetPlayerId = Number(playerId);

  const matchesPlayer = value => Number(value) === targetPlayerId || String(value || '').trim().toLowerCase() === String(playerName).trim().toLowerCase();
  const hasNotifiedAbsence = date => (Array.isArray(absences) ? absences : []).some(absence => {
    const covered = String(absence?.start_date || '') <= date && String(absence?.end_date || '') >= date;
    if (!covered) return false;
    const claimedCharacters = Array.isArray(absence?.claimed_characters) ? absence.claimed_characters : [];
    return matchesPlayer(absence?.roster_id)
      || matchesPlayer(absence?.target_character_name)
      || claimedCharacters.some(name => matchesPlayer(name));
  });

  return (Array.isArray(raidLogs) ? raidLogs : [])
    .map((log, originalIndex) => {
      const timestamp = Date.parse(log?.date || '');
      const date = String(log?.date || '').slice(0, 10);
      const attendees = Array.isArray(log?.attendees) ? log.attendees : [];
      const status = String(log?.playerStatuses?.[String(targetPlayerId)] || log?.statuses?.[String(targetPlayerId)] || '').trim().toLowerCase();
      const notifiedAbsence = (Array.isArray(log?.notifiedAbsences) ? log.notifiedAbsences : []).some(entry => matchesPlayer(typeof entry === 'object' ? entry?.playerId || entry?.player_id || entry?.rosterId || entry?.roster_id : entry));
      const absent = (Array.isArray(log?.absences) ? log.absences : []).some(entry => matchesPlayer(typeof entry === 'object' ? entry?.playerId || entry?.player_id || entry?.rosterId || entry?.roster_id : entry));
      const trackerAbsence = hasNotifiedAbsence(date);
      const normalizedStatus = status === 'signup' || status === 'bench' || status === 'grouped' || status === 'late' || status === 'tentative'
        ? 'signed'
        : status === 'absence' || status === 'notified_absence'
          ? 'notified_absence'
          : status === 'absent'
            ? trackerAbsence ? 'notified_absence' : 'absent'
            : notifiedAbsence
              ? 'notified_absence'
              : absent
                ? trackerAbsence ? 'notified_absence' : 'absent'
                : trackerAbsence
                  ? 'notified_absence'
                : attendees.map(Number).includes(targetPlayerId)
                  ? 'signed'
                  : 'no_response';

      return {
        id: log?.id ?? `${log?.date || 'unknown'}-${originalIndex}`,
        date: log?.date || '',
        zone: log?.zone || 'Raid',
        attended: normalizedStatus === 'signed',
        status: normalizedStatus,
        timestamp,
        originalIndex,
      };
    })
    .sort((left, right) => {
      const leftTime = Number.isNaN(left.timestamp) ? Number.POSITIVE_INFINITY : left.timestamp;
      const rightTime = Number.isNaN(right.timestamp) ? Number.POSITIVE_INFINITY : right.timestamp;
      return leftTime - rightTime || left.originalIndex - right.originalIndex;
    });
}
