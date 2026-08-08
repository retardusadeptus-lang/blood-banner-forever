import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRaidAssignmentsExport } from './raidAssignmentsExport.js';

test('buildRaidAssignmentsExport resolves references and normalizes the payload', () => {
  const raidAssignmentData = {
    global: {
      tankSlots: [{ id: 'tank-1', playerName: 'Alice' }],
      healerSlots: [{ id: 'heal-1', playerName: 'Bob' }],
      soulstones: {},
      curses: [],
      sheep: [],
      banish: []
    },
    'Hydross the Unstable': {
      bloodlustAt: 'pull',
      targets: [{ id: 'boss-target', name: 'Hydross the Unstable', markerId: 'star' }],
      hunterMDs: { HunterX: 'tank-1' },
      imageUrl: 'https://example.com/image.png',
      fearWards: [],
      phases: [{
        id: 'phase-1',
        name: 'Phase 1',
        tankAssignments: [{ id: 'ta-1', tankSlotId: 'tank-1', targetId: '__boss__' }],
        healerAssignments: [{ id: 'ha-1', healerSlotId: 'heal-1', target: 'Raid' }],
        interrupts: [{ id: 'int-1', playerName: null, target: '' }],
        powerInfusions: [{ id: 'pi-1', playerName: null, target: '' }],
        curses: [{ id: 'curse-1', playerName: 'HunterX', target: 'Elements' }],
        sheep: [{ id: 'sheep-1', playerName: 'HunterX', target: 'Coilfang Ambusher' }],
        bops: [{ id: 'bop-1', playerName: 'Bob', target: 'Alice' }],
        fearWards: [{ id: 'fw-1', priestName: 'Priesty', targetName: 'Targety' }],
        enabledBlocks: ['tanks', 'healers', 'powerInfusions', 'curses', 'sheep', 'bops']
      }]
    }
  };

  const roster = [
    { id: 1, name: 'Alice', spec_id: 1, in_raid: true },
    { id: 2, name: 'Bob', spec_id: 2, in_raid: true },
    { id: 3, name: 'HunterX', spec_id: 3, in_raid: true }
  ];

  const getSpecById = (specId) => ({
    1: { spec: 'Protection Warrior', class: 'Warrior' },
    2: { spec: 'Discipline Priest', class: 'Priest' },
    3: { spec: 'Marksmanship Hunter', class: 'Hunter' }
  }[specId] || null);

  const payload = buildRaidAssignmentsExport({
    raidAssignmentData,
    roster,
    enabledBosses: ['Hydross the Unstable'],
    raidZones: [{ name: 'SSC', bosses: ['Hydross the Unstable'] }],
    getSpecById,
    exportTimestamp: '2026-08-01T00:00:00.000Z'
  });

  assert.equal(payload.exported_at, '2026-08-01T00:00:00.000Z');
  assert.equal(payload.zones[0].zone, 'SSC');
  assert.equal(payload.zones[0].bosses[0].zone, 'SSC');
  assert.equal(payload.zones[0].bosses[0].order, 0);
  assert.equal(payload.zones[0].bosses[0].hunterMDs.HunterX, 'Alice');
  assert.equal(payload.zones[0].bosses[0].targets[0].marker, 1);
  assert.equal(payload.zones[0].bosses[0].phases[0].tankAssignments[0].playerName, 'Alice');
  assert.equal(payload.zones[0].bosses[0].phases[0].healerAssignments[0].playerName, 'Bob');
  assert.deepEqual(payload.zones[0].bosses[0].phases[0].powerInfusions, []);
  assert.equal(payload.zones[0].bosses[0].phases[0].curses[0].target, 'Elements');
  assert.equal(payload.zones[0].bosses[0].phases[0].sheep[0].target, 'Coilfang Ambusher');
  assert.equal(payload.zones[0].bosses[0].phases[0].bops[0].target, 'Alice');
  assert.equal(payload.zones[0].bosses[0].phases[0].fearWards[0].priestName, 'Priesty');
  assert.equal(payload.roster[0].spec_name, 'Protection Warrior');
  assert.ok(!('imageUrl' in payload.zones[0].bosses[0]));
});
