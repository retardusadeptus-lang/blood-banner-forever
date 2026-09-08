import test from 'node:test';
import assert from 'node:assert/strict';
import { getAttendanceChartEntries } from './attendanceChart.js';

test('sorts raid attendance entries chronologically and marks the selected player', () => {
  const entries = getAttendanceChartEntries({
    playerId: 7,
    raidLogs: [
      { id: 2, date: '2026-02-12', zone: 'Black Temple', attendees: [] },
      { id: 1, date: '2026-02-05', zone: 'Tempest Keep', attendees: ['7'] },
    ],
  });

  assert.deepEqual(entries.map(entry => [entry.date, entry.attended]), [
    ['2026-02-05', true],
    ['2026-02-12', false],
  ]);
});

test('places undated raid logs after dated entries', () => {
  const entries = getAttendanceChartEntries({
    playerId: 7,
    raidLogs: [
      { id: 1, date: '', attendees: [7] },
      { id: 2, date: '2026-02-05', attendees: [7] },
    ],
  });

  assert.deepEqual(entries.map(entry => entry.id), [2, 1]);
});
