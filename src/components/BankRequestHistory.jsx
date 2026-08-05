export default function BankRequestHistory({
  archivedBankRequests,
  archivedRequestIds,
  isArchivedRequestSelected,
  toggleAllArchivedRequestsSelection,
  restoreSelectedArchivedRequests,
  exportArchivedRequestsCsv,
  selectedArchivedRequestIds,
  toggleArchivedRequestSelection,
  onRestoreArchivedBankRequests
}) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Request History</h3>
            <p className="text-sm text-slate-400">Archived requests stay here until an officer restores them for review or follow-up.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {archivedBankRequests.length > 0 && (
              <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <input
                  type="checkbox"
                  checked={archivedRequestIds.length > 0 && archivedRequestIds.every(id => isArchivedRequestSelected(id))}
                  onChange={toggleAllArchivedRequestsSelection}
                  className="rounded border-slate-700 bg-slate-950"
                />
                Select all
              </label>
            )}
            <button
              type="button"
              onClick={restoreSelectedArchivedRequests}
              disabled={selectedArchivedRequestIds.length === 0}
              className="rounded-lg border border-emerald-700/40 bg-emerald-900/20 px-3 py-2 text-xs font-bold uppercase tracking-wider text-emerald-400 transition hover:bg-emerald-900/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Restore Selected{selectedArchivedRequestIds.length > 0 ? ` (${selectedArchivedRequestIds.length})` : ''}
            </button>
            <button type="button" onClick={exportArchivedRequestsCsv} className="rounded-lg border border-cyan-700/40 bg-cyan-900/20 px-3 py-2 text-xs font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-900/40">Export Requests CSV</button>
          </div>
        </div>
        {archivedBankRequests.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-500">No archived requests yet.</div>
        ) : (
          <div className="space-y-2">
            {archivedBankRequests.map(request => (
              <div key={request.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={isArchivedRequestSelected(request.id)}
                    onChange={() => toggleArchivedRequestSelection(request.id)}
                    className="rounded border-slate-700 bg-slate-950 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-200">{request.item_name || 'Bank request'}</div>
                    <div className="text-xs text-slate-500">{request.player_name || 'Unknown player'} • {request.status || 'unknown'}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRestoreArchivedBankRequests([request.id])}
                  className="rounded-lg border border-emerald-700/40 bg-emerald-900/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400 transition hover:bg-emerald-900/40"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
