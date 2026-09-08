export function getAttendanceChartEntries({ raidLogs = [], playerId }) {
  const targetPlayerId = Number(playerId);

  return (Array.isArray(raidLogs) ? raidLogs : [])
    .map((log, originalIndex) => {
      const timestamp = Date.parse(log?.date || '');
      const attendees = Array.isArray(log?.attendees) ? log.attendees : [];

      return {
        id: log?.id ?? `${log?.date || 'unknown'}-${originalIndex}`,
        date: log?.date || '',
        zone: log?.zone || 'Raid',
        attended: attendees.map(Number).includes(targetPlayerId),
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
