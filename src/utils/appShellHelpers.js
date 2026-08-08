export function calculatePlayerScore({
  playerId,
  playerStats,
  scoringConfig,
  attendanceScore = 0
}) {
  const stats = playerStats[playerId] || {
    cons: false,
    enchants: false,
    gems: false,
    afks: 0,
    parses: {},
    manualAdjustment: { value: 0, note: '' }
  };

  let parseSum = 0;
  let parseCount = 0;

  Object.values(stats.parses || {}).forEach((parse) => {
    if (parse && parse.val) {
      const multiplier = parse.support ? Number(scoringConfig.supportMulti) : 1;
      parseSum += Number(parse.val) * multiplier;
      parseCount += 1;
    }
  });

  const avgParse = parseCount > 0 ? parseSum / parseCount : 0;
  const cons = stats.cons ? Number(scoringConfig.consBonus) : 0;
  const ench = stats.enchants ? Number(scoringConfig.enchantBonus) : 0;
  const gem = stats.gems ? Number(scoringConfig.gemBonus) : 0;
  const att = attendanceScore * Number(scoringConfig.attWeight);
  const afkPenalty = (stats.afks || 0) * Number(scoringConfig.afkPenalty || 5);
  const manualAdj = stats.manualAdjustment?.value || 0;

  return ((avgParse * Number(scoringConfig.parseWeight)) + cons + ench + gem + att - afkPenalty + manualAdj).toFixed(1);
}

export function getRankBadgeStyle(rank) {
  if (rank === 1) return 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-950 border border-yellow-200 shadow-[0_0_10px_rgba(253,224,71,0.6)]';
  if (rank === 2) return 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-950 border border-slate-200 shadow-[0_0_8px_rgba(203,213,225,0.5)]';
  if (rank === 3) return 'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 border border-amber-500 shadow-[0_0_8px_rgba(217,119,6,0.5)]';
  if (typeof rank === 'number') return 'bg-slate-800 text-white border border-slate-600';
  if (rank === 'Pass') return 'bg-red-950/50 text-red-400 border border-red-900';
  return 'bg-slate-900 text-slate-500 border border-slate-800 border-dashed';
}
