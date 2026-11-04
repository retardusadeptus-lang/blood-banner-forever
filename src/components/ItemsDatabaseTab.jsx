import { LEFT_SLOTS, RIGHT_SLOTS, BOTTOM_SLOTS } from '../constants';

export default function ItemsDatabaseTab({
  dbNewName,
  setDbNewName,
  dbNewSlot,
  setDbNewSlot,
  dbNewZone,
  setDbNewZone,
  dbNewBoss,
  setDbNewBoss,
  dbNewItemId,
  setDbNewItemId,
  handleAddItemToDb,
  dbSearch,
  setDbSearch,
  dbPageSize,
  setDbPageSize,
  dbPage,
  setDbPage,
  showMissingWowheadFilter,
  setShowMissingWowheadFilter,
  showWowheadNameMismatchFilter,
  setShowWowheadNameMismatchFilter,
  dbFilteredItems,
  specsSortedByClass,
  dbBisPriorities,
  handleUpdateItemEligibility,
  handleUpdateItemId,
  handleUpdateItemSource,
  handleDeleteItemFromDb,
  renderItemLink,
  hasUnsavedChanges,
  onSaveChanges,
  isSaving,
  siteTabMetadata
}) {
  const resolvedPageSize = Number.isFinite(Number(dbPageSize)) ? Number(dbPageSize) : 25;
  const resolvedPage = Number.isFinite(Number(dbPage)) ? Number(dbPage) : 1;
  const totalPages = Math.max(1, Math.ceil(dbFilteredItems.length / Math.max(1, resolvedPageSize)));
  const safePage = Math.min(Math.max(1, resolvedPage), totalPages);
  const startIndex = (safePage - 1) * resolvedPageSize;
  const visibleItems = dbFilteredItems.slice(startIndex, startIndex + resolvedPageSize);

  return (
    <section data-site-tab-id={siteTabMetadata?.id} data-site-tab-group={siteTabMetadata?.groupKey} className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300 space-y-6">
      
      {/* ➕ FORM: Add New Item to Tables */}
      <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner">
        <div className="mb-4 border-b border-slate-800 pb-2">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Add New Loot Item to Tables</h3>
        </div>
        <form onSubmit={handleAddItemToDb} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Item Name</label>
            <input type="text" required placeholder="e.g. Ashen Scale Belt" className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 text-sm focus:outline-none" value={dbNewName} onChange={e => setDbNewName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Slot</label>
            <select className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 text-sm focus:outline-none cursor-pointer" value={dbNewSlot} onChange={e => setDbNewSlot(e.target.value)}>
              {[...LEFT_SLOTS, ...RIGHT_SLOTS, ...BOTTOM_SLOTS].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Zone</label>
            <input type="text" required placeholder="e.g. SSC" className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 text-sm focus:outline-none" value={dbNewZone} onChange={e => setDbNewZone(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Boss</label>
            <input type="text" required placeholder="e.g. Lady Vashj" className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 text-sm focus:outline-none" value={dbNewBoss} onChange={e => setDbNewBoss(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Wowhead ID</label>
            <input type="text" placeholder="e.g. 30038" className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 text-sm focus:outline-none" value={dbNewItemId} onChange={e => setDbNewItemId(e.target.value)} />
          </div>
          <button type="submit" className="lg:col-span-6 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded text-sm transition shadow-lg h-9">
            Add to Database
          </button>
        </form>
      </div>

      {/* 🔍 CONTROL PANEL: Filters & Searches */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100">Spreadsheet Matrix Editor</h3>
          <p className="text-xs text-slate-500 mt-0.5">Click any grid cell to toggle its status: <span className="text-purple-400 font-bold">BiS</span> &rarr; <span className="text-amber-500 font-bold">Opt</span> &rarr; <span className="text-slate-700 font-bold">None</span></p>
        </div>
        <button
          type="button"
          onClick={onSaveChanges}
          disabled={!hasUnsavedChanges || isSaving}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${hasUnsavedChanges ? 'bg-amber-600 hover:bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
        >
          {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
        </button>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-start sm:items-center">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-widest">Rows:</label>
            <select
              value={resolvedPageSize}
              onChange={e => {
                const nextSize = Number(e.target.value);
                setDbPageSize(nextSize);
                setDbPage(1);
              }}
              className="bg-slate-950 text-white border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none cursor-pointer font-bold shadow-inner"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <input type="text" placeholder="Filter items list..." className="bg-slate-950 text-white border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none flex-1 sm:flex-none sm:w-64 shadow-inner" value={dbSearch} onChange={e => setDbSearch(e.target.value)} />
          <label className="flex items-center gap-2 cursor-pointer bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-900 transition whitespace-nowrap">
            <input
              type="checkbox"
              checked={showMissingWowheadFilter}
              onChange={e => setShowMissingWowheadFilter(e.target.checked)}
              className="rounded bg-slate-800 border-slate-600 text-amber-500 w-4 h-4 cursor-pointer"
            />
            Missing Wowhead ID
          </label>
          <label className="flex items-center gap-2 cursor-pointer bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-900 transition whitespace-nowrap">
            <input
              type="checkbox"
              checked={showWowheadNameMismatchFilter}
              onChange={e => setShowWowheadNameMismatchFilter(e.target.checked)}
              className="rounded bg-slate-800 border-slate-600 text-amber-500 w-4 h-4 cursor-pointer"
            />
            Wowhead Name Mismatch
          </label>
        </div>
      </div>

      {/* 📊 SPREADSHEET MATRIX TABLE */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-inner max-w-full overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <th className="p-3 min-w-[200px] sticky left-0 bg-slate-900 border-r border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">Item & Source</th>
              <th className="p-3 text-center">Wowhead ID</th>
              <th className="p-3 text-center">Slot</th>
              {specsSortedByClass.map(spec => (
                <th key={spec.id} className="p-2 text-center text-[9px] whitespace-nowrap min-w-[85px]" style={{ color: spec.color }}>{spec.spec}</th>
              ))}
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs font-medium">
            {visibleItems.map(item => (
              <tr key={item.id || item.name} className="hover:bg-slate-900/30 group">
                <td className="p-3 sticky left-0 bg-slate-950 group-hover:bg-slate-900/90 border-r border-slate-800 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.3)] min-w-[200px]">
                  <div className="truncate mb-0.5">{renderItemLink(item, "font-bold text-purple-400")}</div>
                  <div className="mt-1 text-[10px] text-slate-500 font-medium italic">
                    Stored name: <span className="text-slate-400">{item.name}</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    <div className="flex flex-col gap-1 text-[10px] text-slate-500 font-semibold">
                      <label className="flex items-center gap-2 text-slate-400">
                        <span className="w-11 shrink-0">Zone</span>
                        <input
                          type="text"
                          value={item.source || ''}
                          onChange={(e) => handleUpdateItemSource(item.id, 'source', e.target.value)}
                          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-200 focus:outline-none"
                          placeholder="Black Temple"
                        />
                      </label>
                      <label className="flex items-center gap-2 text-slate-400">
                        <span className="w-11 shrink-0">Boss</span>
                        <input
                          type="text"
                          value={item.source_type || ''}
                          onChange={(e) => handleUpdateItemSource(item.id, 'source_type', e.target.value)}
                          className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-200 focus:outline-none"
                          placeholder="Illidan Stormrage"
                        />
                      </label>
                    </div>
                    <div className="flex gap-2 flex-wrap text-slate-500 uppercase tracking-wide text-[10px] font-semibold">
                      <span className="truncate">
                        {item.source || item.zone || 'No source'}
                        {item.source_type && item.source ? ` / ${item.source_type}` : item.source_type ? ` ${item.source_type}` : ''}
                      </span>
                      {item.drop_chance && (
                        <span className="text-cyan-400/80 flex-shrink-0">{(item.drop_chance * 100).toFixed(0)}% Drop</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-2 border-r border-slate-900 text-center">
                  <input
                    type="text"
                    className="w-16 bg-slate-900 border border-slate-700 text-slate-300 text-[10px] text-center rounded p-1 focus:outline-none"
                    value={item.itemId || ''}
                    onChange={(e) => handleUpdateItemId(item.id, e.target.value)}
                    placeholder="ID"
                  />
                </td>
                <td className="p-3 text-slate-400 font-semibold text-center whitespace-nowrap">{item.slot}</td>
                {specsSortedByClass.map(spec => {
                  const itemKey = `${item.name}|${spec.spec}`;
                  const manualOverride = dbBisPriorities[itemKey];
                  let cellStatus = manualOverride || '';

                  return (
                    <td 
                      key={spec.id} 
                      onClick={() => handleUpdateItemEligibility(item.name, spec.spec, cellStatus, true)}
                      className={`p-2 border-r border-slate-900 text-center cursor-pointer select-none font-bold uppercase text-[10px] transition-all duration-150 
                        ${cellStatus === 'BiS' ? 'bg-emerald-950/20 text-emerald-400 border-b border-emerald-900'
                        : cellStatus === 'Opt' ? 'bg-amber-950/20 text-amber-500 border-b border-amber-900'
                        : 'text-slate-800 hover:bg-slate-800/30 hover:text-slate-500'}`}
                    >
                      {cellStatus || '-'}
                    </td>
                  );
                })}
                <td className="p-3 text-center bg-slate-950 group-hover:bg-slate-900/90 transition-colors">
                  <button onClick={() => handleDeleteItemFromDb(item.id, item.name)} className="text-red-500 hover:text-red-400 font-bold px-2 py-1 transition text-[11px] uppercase tracking-wide">Delete</button>
                </td>
              </tr>
            ))}
            {visibleItems.length === 0 && (
              <tr><td colSpan={specsSortedByClass.length + 4} className="p-8 text-center text-slate-600 italic">No matching items found in the database matrix rows.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-2 text-xs text-slate-400">
        <div>
          Showing {dbFilteredItems.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + resolvedPageSize, dbFilteredItems.length)} of {dbFilteredItems.length} items
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDbPage(prev => Math.max(1, prev - 1))}
            disabled={safePage <= 1}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-slate-500"
          >
            Prev
          </button>
          <span className="min-w-[72px] text-center text-slate-300 font-semibold">Page {safePage}/{totalPages}</span>
          <button
            type="button"
            onClick={() => setDbPage(prev => Math.min(totalPages, prev + 1))}
            disabled={safePage >= totalPages}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-slate-500"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}