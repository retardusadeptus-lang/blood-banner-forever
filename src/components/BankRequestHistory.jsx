import { useState } from 'react';

export default function BankRequestHistory({
  archivedBankRequests,
  archivedRequestIds,
  exportArchivedRequestsCsv,
  onRestoreArchivedBankRequests,
  onDeleteArchivedBankRequests
}) {
  const [selectedArchivedRequestIds, setSelectedArchivedRequestIds] = useState([]);

  const normalizeRequestId = (requestId) => String(requestId);
  const isArchivedRequestSelected = (requestId) => selectedArchivedRequestIds.some(id => normalizeRequestId(id) === normalizeRequestId(requestId));

  const toggleArchivedRequestSelection = (requestId) => {
    const normalizedId = normalizeRequestId(requestId);
    setSelectedArchivedRequestIds(prev => prev.some(id => normalizeRequestId(id) === normalizedId)
      ? prev.filter(id => normalizeRequestId(id) !== normalizedId)
      : [...prev, requestId]);
  };

  const toggleAllArchivedRequestsSelection = () => {
    const allSelected = archivedRequestIds.length > 0 && archivedRequestIds.every(id => isArchivedRequestSelected(id));

    if (allSelected) {
      setSelectedArchivedRequestIds(prev => prev.filter(id => !archivedRequestIds.some(archivedId => normalizeRequestId(archivedId) === normalizeRequestId(id))));
      return;
    }

    setSelectedArchivedRequestIds(prev => {
      const next = [...prev];
      archivedRequestIds.forEach(id => {
        const normalizedId = normalizeRequestId(id);
        if (!next.some(existingId => normalizeRequestId(existingId) === normalizedId)) {
          next.push(id);
        }
      });
      return next;
    });
  };

  const restoreSelectedArchivedRequests = () => {
    if (selectedArchivedRequestIds.length === 0) return;
    const requestIds = selectedArchivedRequestIds.filter(id => archivedRequestIds.some(archivedId => normalizeRequestId(archivedId) === normalizeRequestId(id)));
    if (requestIds.length === 0) return;
    onRestoreArchivedBankRequests(requestIds);
    setSelectedArchivedRequestIds([]);
  };

  const deleteSelectedArchivedRequests = async () => {
    if (selectedArchivedRequestIds.length === 0) return;
    const requestIds = selectedArchivedRequestIds.filter(id => archivedRequestIds.some(archivedId => normalizeRequestId(archivedId) === normalizeRequestId(id)));
    if (requestIds.length === 0) return;
    await onDeleteArchivedBankRequests(requestIds);
    setSelectedArchivedRequestIds([]);
  };

  return (
    <details open className="bg-slate-950 border border-slate-800 rounded-xl">
      <summary className="cursor-pointer list-none p-6">
        <h3 className="text-lg font-bold text-slate-100">Request History</h3>
        <p className="mt-1 text-sm text-slate-400">Archived requests stay here until an officer restores them for review or follow-up.</p>
      </summary>
      <div className="space-y-2 border-t border-slate-800 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div />
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
            <button
              type="button"
              onClick={deleteSelectedArchivedRequests}
              disabled={selectedArchivedRequestIds.length === 0}
              className="rounded-lg border border-red-700/40 bg-red-900/20 px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete Selected{selectedArchivedRequestIds.length > 0 ? ` (${selectedArchivedRequestIds.length})` : ''}
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onRestoreArchivedBankRequests([request.id])}
                    className="rounded-lg border border-emerald-700/40 bg-emerald-900/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400 transition hover:bg-emerald-900/40"
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteArchivedBankRequests([request.id])}
                    className="rounded-lg border border-red-700/40 bg-red-900/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-900/40"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
