
export default function AdminTodoTab({
  selectedMyPlayerName,
  roster,
  todoDraftItems,
  todoFilterMine,
  todoDirty,
  onToggleTodoFilterMine,
  onAddTodoItem,
  onUpdateTodoItem,
  onRemoveTodoItem,
  onSaveTodoItems
}) {
  const displayedTodoItems = todoDraftItems.filter(item => !todoFilterMine || String(item.owner || '').trim() === String(selectedMyPlayerName || ''));

  return (
    <div className="theme-surface rounded-xl p-6 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Officer To-do List</h3>
          <p className="text-sm text-slate-400">A lightweight planning area for the next raid week and guild upkeep.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => onToggleTodoFilterMine(!todoFilterMine)} className={`rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-wider transition ${todoFilterMine ? 'border-amber-600 bg-amber-900/30 text-amber-400' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>
            {todoFilterMine ? 'Showing Mine' : 'Filter to Mine'}
          </button>
          <button type="button" onClick={onAddTodoItem} className="rounded-lg border border-amber-700/40 bg-amber-900/20 px-3 py-2 text-xs font-bold uppercase tracking-wider text-amber-400 transition hover:bg-amber-900/40">Add Item</button>
          <button type="button" onClick={onSaveTodoItems} disabled={!todoDirty} className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition ${todoDirty ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>Save Changes</button>
        </div>
      </div>
      <div className="theme-surface-raised space-y-2 rounded-lg p-4 text-sm text-slate-300">
        <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_180px_160px_96px] gap-3 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800">
          <span>Task</span>
          <span>Owner</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {displayedTodoItems.length === 0 ? (
          <div className="rounded border border-dashed border-slate-800 px-3 py-4 text-center text-slate-500">No to-do items yet.</div>
        ) : (
          displayedTodoItems.map(item => (
            <div key={item.id} className="rounded border border-slate-800 bg-slate-950/80 p-3 space-y-2">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_160px_96px] md:items-start">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1 md:hidden">Task</label>
                  <input type="text" value={item.item} onChange={e => onUpdateTodoItem(item.id, 'item', e.target.value)} placeholder="Task" className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1 md:hidden">Owner</label>
                  <select value={item.owner || ''} onChange={e => onUpdateTodoItem(item.id, 'owner', e.target.value)} className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white">
                    <option value="">Unassigned</option>
                    {[...new Set([selectedMyPlayerName, ...roster.map(player => player.name)].filter(Boolean))].filter(Boolean).sort().map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1 md:hidden">Status</label>
                  <select value={item.status || 'Open'} onChange={e => onUpdateTodoItem(item.id, 'status', e.target.value)} className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white">
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1 md:hidden">Action</label>
                  <button type="button" onClick={() => onRemoveTodoItem(item.id)} className="w-full rounded border border-red-800/40 px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-red-400">Remove</button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Comments</label>
                <textarea value={item.comments || ''} onChange={e => onUpdateTodoItem(item.id, 'comments', e.target.value)} placeholder="Comments" rows={3} className="w-full min-h-[88px] rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
