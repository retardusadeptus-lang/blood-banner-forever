export default function RaidAssignmentsHistory({
  archives,
  onViewArchive,
  onDeleteArchive,
  onRestoreArchive,
  selectedArchiveId,
  selectedRestoreBosses,
  setSelectedRestoreBosses,
  onToggleRestoreBoss
}) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-bold text-slate-100">Raid Assignment History</h3>
      <p className="text-sm text-slate-400">Saved assignment snapshots remain visible here so officers can review the latest raid planning state.</p>
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
        {Object.keys(archives?.live || {}).length === 0 ? 'No saved assignment data yet.' : `The current assignment data contains ${Object.keys(archives?.live || {}).length} tracked section${Object.keys(archives?.live || {}).length === 1 ? '' : 's'}.`}
      </div>
      {archives.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-500">No archived assignment snapshots yet.</div>
      ) : (
        <div className="space-y-2">
          {archives.map(entry => (
            <div key={entry.id} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-200">{entry.boss || 'Active bosses'}</div>
                  <div className="text-[11px] text-slate-500">{entry.bossCount || entry.selectedBosses?.length || 0} boss snapshot</div>
                </div>
                <div className="text-[11px] text-slate-500">{new Date(entry.timestamp).toLocaleString()}</div>
              </div>
              {entry.actorBattleTag && <div className="mt-1 text-xs text-amber-400">By {entry.actorBattleTag}</div>}
              {Array.isArray(entry.selectedBosses) && entry.selectedBosses.length > 0 && (
                <div className="mt-2 text-xs text-slate-400 break-words">{entry.selectedBosses.join(', ')}</div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => onViewArchive(entry)} className="rounded-lg border border-cyan-700/40 bg-cyan-900/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-900/40">View</button>
                <button type="button" onClick={() => onRestoreArchive(entry)} className="rounded-lg border border-emerald-700/40 bg-emerald-900/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-900/40">Restore to Live</button>
                <button type="button" onClick={() => onDeleteArchive(entry)} className="rounded-lg border border-red-700/40 bg-red-900/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-900/40">Delete</button>
              </div>
              {selectedArchiveId === entry.id && (
                <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">Archive Preview</h4>
                    <span className="text-[11px] text-slate-500">{entry.boss || 'All selected bosses'}</span>
                  </div>
                  {Array.isArray(entry.selectedBosses) && entry.selectedBosses.length > 1 && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Restore Bosses</div>
                      <div className="flex flex-wrap gap-2">
                        {entry.selectedBosses.map(bossName => {
                          const isSelected = selectedRestoreBosses.includes(bossName);
                          return (
                            <label key={`${entry.id}-${bossName}`} className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${isSelected ? 'border-emerald-600/40 bg-emerald-900/20 text-emerald-300' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>
                              <input type="checkbox" checked={isSelected} onChange={() => onToggleRestoreBoss(bossName)} className="rounded border-slate-600 bg-slate-950" />
                              {bossName}
                            </label>
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setSelectedRestoreBosses(entry.selectedBosses)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">Select All</button>
                        <button type="button" onClick={() => setSelectedRestoreBosses([])} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">Clear</button>
                        <button type="button" onClick={() => onRestoreArchive(entry, selectedRestoreBosses)} className="rounded-lg border border-emerald-700/40 bg-emerald-900/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-900/40">Restore Selected</button>
                      </div>
                    </div>
                  )}
                  <pre className="max-h-80 overflow-auto rounded-lg border border-slate-800 bg-slate-900 p-3 text-[11px] leading-5 text-slate-300 whitespace-pre-wrap">
                    {JSON.stringify(entry.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
