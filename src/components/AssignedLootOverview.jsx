export default function AssignedLootOverview({ assignments, mutableItems, normalizeAwardedPlayerIds, renderItemLink, roster }) {
  const assignmentEntries = Object.entries(assignments || {}).filter(([itemName, playerMap]) => {
    const rankedEntries = Object.entries(playerMap || {}).filter(([key]) => !['awardedPlayerIds', 'awardedPlayerId', 'assignedAt'].includes(key));
    return rankedEntries.length > 0 || normalizeAwardedPlayerIds(playerMap).length > 0;
  });

  if (assignmentEntries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-500">No gear assignments yet.</div>
    );
  }

  return (
    <div className="space-y-2">
      {assignmentEntries.slice(0, 12).map(([itemName, playerMap]) => {
        const rankedEntries = Object.entries(playerMap || {}).filter(([key]) => !['awardedPlayerIds', 'awardedPlayerId', 'assignedAt'].includes(key));
        const awardedPlayerIds = normalizeAwardedPlayerIds(playerMap);
        const assignedAt = playerMap?.assignedAt;
        const itemRecord = mutableItems.find(item => item.name === itemName) || { name: itemName };
        return (
          <div key={itemName} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
            <div className="text-sm font-semibold text-slate-200">{renderItemLink(itemRecord)}</div>
            {assignedAt && (
              <div className="mt-1 text-[11px] text-slate-500">Updated {new Date(assignedAt).toLocaleString()}</div>
            )}
            {awardedPlayerIds.length > 0 && (
              <div className="mt-1 text-xs text-amber-400">Awarded to {awardedPlayerIds.map(id => roster.find(p => String(p.id) === String(id))?.name || id).join(', ')}</div>
            )}
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
              {rankedEntries.map(([playerId, rank]) => (
                <span key={`${itemName}-${playerId}`} className="rounded-full border border-slate-700 px-2 py-1">{roster.find(p => String(p.id) === String(playerId))?.name || playerId}: {rank}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
