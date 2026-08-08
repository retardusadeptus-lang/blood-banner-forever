import React from 'react';

export default function OverviewTab({
  filteredOverviewItems,
  overviewSearch,
  setOverviewSearch,
  roster,
  assignments,
  calculateScore,
  getRankBadgeStyle,
  renderItemLink,
  hideWowheadTooltip,
  isAuthenticated,
  setActiveTab,
  setSearchQuery,
  setSelectedItemName,
  onOpenItemAssignment,
  specsByName,
  getDisplayFromId,
  myPlayerName,
  onClearItemPriorities,
  onEditItemId,
  hasLootUnsavedChanges,
  onSaveAssignments
}) {
  
  // Inline mini-component to keep player names styled beautifully with their scores
  const PlayerNameWithScore = ({ player }) => {
    const specDisplay = getDisplayFromId(player.spec_id) || '?';
    return (
      <div className="flex items-center gap-2">
        <span 
          className="font-bold text-lg leading-tight drop-shadow-sm" 
          style={{ color: specsByName[specDisplay]?.color || '#FFFFFF' }}
        >
          {player.name}
        </span>
        <span className="bg-amber-900/60 text-amber-400 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 font-bold shadow-inner flex items-center gap-1">
          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
          </svg>
          {calculateScore(player.id)}
        </span>
      </div>
    );
  };

  return (
    <section className="overview-tab bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner">
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">Master Priority Ledger</h2>
          <p className="text-sm text-slate-500">A bird's-eye view of every item that currently has an assigned Loot Council priority.</p>
        </div>
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2 items-center">
          <input
            type="text"
            placeholder="Search by item or player name..."
            className="w-full md:w-96 bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
            value={overviewSearch}
            onChange={e => setOverviewSearch(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!myPlayerName) return;
                setOverviewSearch(myPlayerName);
              }}
              disabled={!myPlayerName}
              className="whitespace-nowrap bg-slate-900 border border-slate-700 text-amber-400 hover:text-amber-300 hover:border-amber-500 disabled:text-slate-600 disabled:border-slate-800 disabled:cursor-not-allowed rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition"
            >
              Show My Priorities
            </button>

            {isAuthenticated && (
              <button
                type="button"
                onClick={() => onSaveAssignments?.()}
                disabled={!hasLootUnsavedChanges}
                className="whitespace-nowrap bg-amber-600 text-slate-950 font-bold rounded-lg px-3 py-2.5 text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Priorities
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredOverviewItems.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-xl">
          <p className="text-slate-500 font-medium">No priorities match your search criteria.</p>
        </div>
      ) : (
        <div className="columns-1 lg:columns-2 xl:columns-3 gap-6 space-y-0">
          {filteredOverviewItems.map(item => {
            const itemAssignments = assignments[item.name] || {};
            const assignedPlayerIds = Object.keys(itemAssignments)
              .filter(id => !['awardedPlayerIds', 'awardedPlayerId', 'assignedAt'].includes(id))
              .map(id => Number(id))
              .filter(id => !Number.isNaN(id));
            const awardedPlayerIds = Array.isArray(itemAssignments.awardedPlayerIds)
              ? itemAssignments.awardedPlayerIds.map(id => String(id))
              : (itemAssignments.awardedPlayerId ? [String(itemAssignments.awardedPlayerId)] : []);
            const assignedPlayers = assignedPlayerIds.map(pid => roster.find(p => Number(p.id) === pid) || { id: pid, name: `Player ${pid}`, spec_id: null });
            const awardedPlayers = awardedPlayerIds.map(pid => roster.find(p => String(p.id) === String(pid)) || { id: pid, name: `Player ${pid}`, spec_id: null });
            const sortedAssignedPlayers = assignedPlayers.sort((a, b) => {
              const rankA = itemAssignments[a.id];
              const rankB = itemAssignments[b.id];
              const numA = (typeof rankA === 'number') ? rankA : Number.POSITIVE_INFINITY;
              const numB = (typeof rankB === 'number') ? rankB : Number.POSITIVE_INFINITY;
              if (numA !== numB) return numA - numB;
              return Number(calculateScore(b.id)) - Number(calculateScore(a.id));
            });

            return (
              <div key={item.name} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col break-inside-avoid mb-6">
                <div className="bg-slate-900 border-b border-slate-800 p-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="character-slot-icon w-10 h-10 rounded border border-purple-500/50 bg-slate-950 flex-shrink-0 flex items-center justify-center overflow-hidden relative shadow-inner">
                      {item.itemId ? (
                        <a 
                          href={"https://tbc.wowhead.com/item=" + item.itemId}
                          data-wh-rename-link="false"
                          data-wh-icon-size="large"
                          className="item-link absolute inset-0"
                          target="_blank"
                          rel="noreferrer"
                          onMouseLeave={hideWowheadTooltip}
                          style={{ fontSize: 0, lineHeight: 0 }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent" />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 min-w-0 w-full">
                      <h3 className="text-lg font-bold text-purple-400 truncate drop-shadow-sm">
                        {renderItemLink(item)}
                      </h3>
                      {/** Pencil temporarily disabled on the Priority Overview tab. */}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider flex-wrap">
                    <span>{item.slot}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                    <span className="text-amber-500/80">{item.boss}</span>
                    {item.drop_chance && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                        <span className="text-cyan-400">{(item.drop_chance * 100).toFixed(0)}% Drop</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-3 flex-1">
                  {awardedPlayers.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-amber-400 mb-2">Awarded</div>
                      <ul className="space-y-2">
                        {awardedPlayers.map(player => (
                          <li key={player.id} className="flex items-center gap-3 bg-emerald-950/30 p-2 rounded border border-emerald-800/40">
                            <div className="w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-xs shadow-inner bg-emerald-600 text-white">
                              A
                            </div>
                            <div className="flex-1 min-w-0 flex items-center justify-between">
                              <PlayerNameWithScore player={player} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {sortedAssignedPlayers.length === 0 ? (
                    <p className="text-xs text-slate-600 italic py-2">Only Passes recorded.</p>
                  ) : (
                    <>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">Priority Queue</div>
                      <ul className="space-y-2">
                        {sortedAssignedPlayers.map(player => (
                          <li key={player.id} className="flex items-center gap-3 bg-slate-900/50 p-2 rounded border border-slate-800/50">
                            <div className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-xs shadow-inner ${getRankBadgeStyle(assignments[item.name][player.id])}`}>
                              {assignments[item.name][player.id]}
                            </div>
                            <div className="flex-1 min-w-0 flex items-center justify-between">
                              <PlayerNameWithScore player={player} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                {isAuthenticated && (
                  <div className="bg-slate-900/30 p-2 border-t border-slate-800/50 text-right">
                    <button
                      onClick={() => onClearItemPriorities?.(item.name)}
                      className="text-xs font-bold text-red-400 hover:text-red-300 uppercase tracking-wider px-2 py-1 mr-2"
                    >
                      Remove from Priority View
                    </button>
                    <button 
                      onClick={() => onOpenItemAssignment?.(item.name)}
                      className="text-xs font-bold text-amber-500 hover:text-amber-400 uppercase tracking-wider px-2 py-1"
                    >
                      Edit Priorities &rarr;
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}