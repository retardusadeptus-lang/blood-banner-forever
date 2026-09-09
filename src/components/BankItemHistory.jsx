import { useMemo, useState } from 'react';

export default function BankItemHistory({ bankItemHistory, onRestoreBankItem }) {
  const [search, setSearch] = useState('');
  const [quantities, setQuantities] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [status, setStatus] = useState('');

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bankItemHistory.filter(item => !query || item.name.toLowerCase().includes(query));
  }, [bankItemHistory, search]);

  const restoreItem = async (item) => {
    const quantity = Number(quantities[item.item_wowhead_id] || 1);
    setSavingId(item.item_wowhead_id);
    setStatus('');
    try {
      await onRestoreBankItem(item.item_wowhead_id, quantity);
      setStatus(`${item.name} added to the bank inventory.`);
    } catch (error) {
      setStatus(error?.payload?.error || error?.message || 'Unable to add item to the bank inventory.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <details open className="bg-slate-950 border border-slate-800 rounded-xl">
      <summary className="cursor-pointer list-none p-6">
        <span aria-hidden="true" className="bank-section-indicator inline-block transition-transform duration-150 text-slate-500 mr-2">&gt;</span>
        <h3 className="text-lg font-bold text-slate-100">Item History</h3>
        <p className="mt-1 text-sm text-slate-400">Items that have previously been in the guild bank remain requestable while out of stock.</p>
      </summary>
      <div className="space-y-4 border-t border-slate-800 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search item history..."
            className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none"
          />
          <span className="text-xs text-slate-500">{filteredItems.length} items</span>
        </div>
        {status && <p className="text-xs text-emerald-400">{status}</p>}
        {filteredItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-500">No item history matches your search.</div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map(item => (
              <div key={item.item_wowhead_id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-200">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.category || 'Other'} · Current stock: {item.current_count || 0}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={quantities[item.item_wowhead_id] || 1}
                    onChange={event => setQuantities(prev => ({ ...prev, [item.item_wowhead_id]: event.target.value }))}
                    aria-label={`Quantity of ${item.name} to add`}
                    className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => restoreItem(item)}
                    disabled={savingId === item.item_wowhead_id}
                    className="rounded-lg border border-amber-600/50 bg-amber-600/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 transition hover:bg-amber-600/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingId === item.item_wowhead_id ? 'Adding...' : 'Add to Bank'}
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
