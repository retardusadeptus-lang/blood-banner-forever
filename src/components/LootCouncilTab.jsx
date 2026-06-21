import React from 'react';

export default function LootCouncilTab({
  searchQuery,
  setSearchQuery,
  filterZone,
  setFilterZone,
  uniqueZones,
  filterBoss,
  setFilterBoss,
  uniqueBosses,
  filterSlot,
  setFilterSlot,
  uniqueSlots,
  selectedItemName,
  setSelectedItemName,
  filteredItems,
  selectedItem,
  sortedEligiblePlayers,
  getDisplayFromId,
  getSlugFromDisplay,
  bisPriorities,
  globalPhase,
  assignments,
  mutableItems,
  getSpecById,
  getRankBadgeStyle,
  renderItemLink,
  handleSetPriority,
  PlayerNameWithScore,
  hasUnsavedChanges,
  onSaveChanges,
  isSaving
}) {
  return (
    <section className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300">
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={onSaveChanges}
          disabled={!hasUnsavedChanges || isSaving}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${hasUnsavedChanges ? 'bg-amber-600 hover:bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
        >
          {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
        </button>
      </div>

      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 mb-8 shadow-inner">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Item Database Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Search Name</label>
            <input type="text" className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Filter Zone</label>
            <select className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none" value={filterZone} onChange={e => setFilterZone(e.target.value)}>
              <option value="">All Zones</option>
              {uniqueZones.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Filter Boss</label>
            <select className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none truncate" value={filterBoss} onChange={e => setFilterBoss(e.target.value)}>
              <option value="">All Bosses</option>
              {uniqueBosses.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Filter Slot</label>
            <select className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none" value={filterSlot} onChange={e => setFilterSlot(e.target.value)}>
              <option value="">All Slots</option>
              {uniqueSlots.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <select className="w-full bg-slate-900 text-purple-400 font-bold border border-slate-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer" value={selectedItemName} onChange={e => setSelectedItemName(e.target.value)}>
            <option value="" className="text-slate-500">-- Select Dropped Item ({filteredItems.length} matches) --</option>
            {filteredItems.map(item => <option key={item.name} value={item.name} className="text-purple-400">{item.name}</option>)}
          </select>
        </div>
      </div>

      {selectedItem ? (
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-6 border-b border-slate-800">
            <h3 className="text-3xl font-bold text-purple-400 drop-shadow-md mb-2">
              {renderItemLink(selectedItem)}
            </h3>
            <div className="flex gap-4 text-sm font-semibold text-slate-300 flex-wrap">
              <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">{selectedItem.slot}</span>
              <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">{selectedItem.zone}</span>
              {selectedItem.drop_chance && (
                <span className="bg-cyan-900/30 px-3 py-1 rounded-full border border-cyan-700/50 text-cyan-400">{(selectedItem.drop_chance * 100).toFixed(0)}% Drop Chance</span>
              )}
            </div>
          </div>

          <div className="p-6">
            <h4 className="text-sm font-bold mb-4 text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">Council Priority Queue</h4>
            {sortedEligiblePlayers.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-800"><p className="text-slate-400 font-medium text-sm">None of your active raiders need this item.</p></div>
            ) : (
              <div className="flex flex-col gap-3">
                {sortedEligiblePlayers.map(player => {
                  const specDisplay = getDisplayFromId(player.spec_id) || '?';
                  const specKey = getSlugFromDisplay(specDisplay);
                  const itemKey = `${selectedItem.name}|${specDisplay}`;
                  const bisPriorityStatus = bisPriorities[itemKey];
                  const status = bisPriorityStatus || (selectedItem.spec === specKey ? 'BiS' : '');
                  const currentPriority = assignments[selectedItem.name]?.[player.id];
                  const PHASE_ORDER = ["Pre-BiS", "T4", "T5", "T6", "ZA", "SWP"];
                  const currentPhaseIndex = PHASE_ORDER.indexOf(globalPhase);

                  const playerAlts = mutableItems.filter(i => {
                    if (i.slot !== selectedItem.slot || i.name === selectedItem.name) return false;
                    const altItemKey = `${i.name}|${specDisplay}`;
                    const altBisPriority = bisPriorities[altItemKey];
                    if (!altBisPriority && i.spec !== specKey) return false;
                    // Only show alternates from the current phase or earlier.
                    // i.phase is expected to be a single string ("T5"). If it's
                    // an array or anything else non-string, we can't trust it
                    // represents a real phase, so exclude rather than guess.
                    if (i.phase) {
                      if (typeof i.phase !== 'string') return false;
                      const itemPhaseIndex = PHASE_ORDER.indexOf(i.phase);
                      if (itemPhaseIndex === -1) return false; // unrecognized phase tag, exclude
                      if (currentPhaseIndex !== -1 && itemPhaseIndex > currentPhaseIndex) return false;
                    }
                    return true;
                  }).map(i => ({ ...i, eligible: i.eligible || {} }));

                  return (
                    <div key={player.id} className={`flex flex-col p-4 rounded-xl shadow-sm border transition-all duration-300 ${currentPriority === 1 ? 'bg-slate-800/80 border-amber-500/50' : currentPriority === 'Pass' ? 'bg-slate-950/50 border-slate-900 opacity-60' : 'bg-slate-900 border-slate-700'}`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-inner flex-shrink-0 ${getRankBadgeStyle(currentPriority)}`}>
                            {typeof currentPriority === 'number' ? currentPriority : (currentPriority === 'Pass' ? '✕' : '-')}
                          </div>
                          <img src={getSpecById(player.spec_id)?.icon_large || 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg'} alt="" className="w-10 h-10 rounded border border-slate-600 bg-slate-800 object-cover flex-shrink-0" />
                          <div>
                            <PlayerNameWithScore player={player} />
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{specDisplay}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${status === 'BiS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'}`}>{status}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 overflow-x-auto custom-scrollbar">
                          <span className="text-xs font-semibold text-slate-500 mr-2 ml-1 uppercase tracking-wider whitespace-nowrap">Assign Rank:</span>
                          {[1, 2, 3, 4, 5].map(rank => (
                            <button key={rank} onClick={() => handleSetPriority(player.id, currentPriority === rank ? null : rank)} className={`w-8 h-8 flex-shrink-0 rounded font-bold text-sm transition-all ${currentPriority === rank ? 'bg-purple-600 text-white shadow-[0_0_8px_rgba(147,51,234,0.6)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'}`}>{rank}</button>
                          ))}
                          <div className="w-px h-6 bg-slate-800 mx-1 flex-shrink-0"></div>
                          <button onClick={() => handleSetPriority(player.id, currentPriority === 'Pass' ? null : 'Pass')} className={`px-3 h-8 flex-shrink-0 rounded font-bold text-xs uppercase transition-all ${currentPriority === 'Pass' ? 'bg-red-900/60 text-red-400 border border-red-800' : 'bg-slate-900 text-slate-500 hover:bg-red-950 hover:text-red-400'}`}>Pass</button>
                        </div>
                      </div>

                      {playerAlts.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-800/50">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 block flex items-center gap-1"><span className="text-slate-600">Alternative {selectedItem.slot} Options:</span></span>
                          <div className="flex flex-wrap gap-2">
                            {playerAlts.map(alt => (
                              <span key={alt.name} className={`text-[10px] px-2 py-1 rounded border shadow-sm flex items-center gap-1 ${alt.eligible[specDisplay] === 'BiS' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                                {renderItemLink(alt, "")}
                                <span className="opacity-50 text-[9px]">({alt.boss})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-xl"><p className="text-slate-500 font-medium">Use the filters above and select an item to assign priorities.</p></div>
      )}
    </section>
  );
}