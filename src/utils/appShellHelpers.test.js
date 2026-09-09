import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePlayerScore, getRankBadgeStyle } from './appShellHelpers.js';

test('calculatePlayerScore applies bonuses, attendance, and penalties', () => {
  const playerStats = {
    7: {
      cons: true,
      enchants: true,
      gems: false,
      afks: 2,
      parses: {
        one: { val: 90 },
        two: { val: 80, support: true }
      },
      manualAdjustment: { value: 5, note: '' }
    }
  };

  const scoringConfig = {
    consBonus: 20,
    enchantBonus: 15,
    gemBonus: 10,
    attWeight: 1.5,
    afkPenalty: 4,
    supportMulti: 1.5,
    parseWeight: 1
  };

  const score = calculatePlayerScore({
    playerId: 7,
    playerStats,
    scoringConfig,
    attendanceScore: 4
  });

  assert.equal(score, '143.0');
});

test('getRankBadgeStyle returns the expected styles for common ranks', () => {
  assert.equal(
    getRankBadgeStyle(1),
    'bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-950 border border-yellow-200 shadow-[0_0_10px_rgba(253,224,71,0.6)]'
  );
  assert.equal(
    getRankBadgeStyle('Pass'),
    'bg-red-950/50 text-red-400 border border-red-900'
  );
  assert.equal(
    getRankBadgeStyle(4),
    'bg-slate-800 text-white border border-slate-600'
  );
});

test('calculatePlayerScore applies the configured guild role weight', () => {
  const score = calculatePlayerScore({
    playerId: 7,
    player: { guild_rank: 'Raider' },
    playerStats: { 7: { cons: true } },
    scoringConfig: {
      parseWeight: 1,
      supportMulti: 1,
      consBonus: 100,
      enchantBonus: 0,
      gemBonus: 0,
      attWeight: 0,
      afkPenalty: 0,
      guildRoleRanks: [{ name: 'Raider', rank: 1, weight: 0.5 }]
    }
  });

  assert.equal(score, '50.0');
});
