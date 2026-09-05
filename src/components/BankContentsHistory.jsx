export default function BankContentsHistory({ bankContentsHistory, exportBankContentsHistoryCsv }) {
  return (
    <details open className="bg-slate-950 border border-slate-800 rounded-xl">
      <summary className="cursor-pointer list-none p-6">
        <h3 className="text-lg font-bold text-slate-100">Contents History</h3>
        <p className="mt-1 text-sm text-slate-400">Recent bank inventory snapshots are kept here so the guild can compare previous bank states.</p>
      </summary>
      <div className="space-y-2 border-t border-slate-800 p-6">
        <div className="flex justify-end">
          <button type="button" onClick={exportBankContentsHistoryCsv} className="rounded-lg border border-cyan-700/40 bg-cyan-900/20 px-3 py-2 text-xs font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-900/40">Export Contents CSV</button>
        </div>
        {bankContentsHistory.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-500">No saved contents snapshots yet.</div>
        ) : (
          <div className="space-y-2">
            {bankContentsHistory.map(snapshot => (
              <div key={snapshot.id} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-200">{snapshot.itemCount || 0} items</div>
                  <div className="text-[11px] text-slate-500">{new Date(snapshot.timestamp).toLocaleString()}</div>
                </div>
                {snapshot.gold !== null && snapshot.gold !== undefined && (
                  <div className="mt-1 text-xs text-amber-400">Gold: {snapshot.gold}g</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
