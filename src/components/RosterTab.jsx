import React, { useMemo, useState } from 'react';

export default function RosterTab({
  handleSaveRaidLog,
  handleImportRaidHelperJson,
  newRaidDate,
  setNewRaidDate,
  newRaidZone,
  setNewRaidZone,
  raidLogs,
  handleDeleteRaidLog,
  handleAddPlayer,
  newName,
  setNewName,
  newSpec,
  setNewSpec,
  specsFromDb,
  setAllRaidStatus,
  roster,
  getSpecById,
  toggleRaidStatus,
  handleUpdatePlayer,
  handleRemovePlayer,
  importedRaidHelperPlayerIds,
  importedRaidHelperSpecConflictIds,
  raidHelperImportSession,
  onUpdateRaidHelperImportEntry,
  onApplyRaidHelperImport,
  onCancelRaidHelperImport,
  specsByName,
  PlayerNameWithScore,
  hasUnsavedChanges,
  onSaveChanges,
  isSaving
}) {
  const [expandedLog, setExpandedLog] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [raidHelperJsonText, setRaidHelperJsonText] = useState('');

  const importedIds = useMemo(() => new Set((importedRaidHelperPlayerIds || []).map(Number)), [importedRaidHelperPlayerIds]);
  const conflictIds = useMemo(() => new Set((importedRaidHelperSpecConflictIds || []).map(Number)), [importedRaidHelperSpecConflictIds]);
  const specClasses = useMemo(() => [...new Set(specsFromDb.map(spec => spec.class))].sort((a, b) => a.localeCompare(b)), [specsFromDb]);

  const onImportRaidHelper = () => {
    const ok = handleImportRaidHelperJson(raidHelperJsonText);
    if (ok) setRaidHelperJsonText('');
  };

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

      <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Raid Logging Panel */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Log Current Raid</h3>
          <form onSubmit={handleSaveRaidLog} className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Date</label>
                <input type="date" required className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none" value={newRaidDate} onChange={e => setNewRaidDate(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Zone</label>
                <input type="text" required placeholder="e.g. SSC" className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none" value={newRaidZone} onChange={e => setNewRaidZone(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-lg transition shadow-lg text-sm mt-1">Save Active Roster to History</button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-800">
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Paste RaidHelper JSON</label>
            <textarea
              value={raidHelperJsonText}
              onChange={e => setRaidHelperJsonText(e.target.value)}
              placeholder='Paste full JSON object with "signUps" here...'
              className="w-full min-h-[120px] bg-slate-900 text-white border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none"
            />
            <button
              type="button"
              onClick={onImportRaidHelper}
              className="mt-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2 px-3 rounded-lg transition text-xs uppercase tracking-wider"
            >
              Import RaidHelper to Roster + Attendance
            </button>
            <p className="text-[10px] text-slate-500 mt-1">You will be prompted to map unknown names and resolve spec mismatches.</p>
          </div>
        </div>

        {/* Raid History List */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2 flex justify-between items-center">
            <span>Raid History Logs</span>
            <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px]">{raidLogs.length} Records</span>
          </h3>
          {raidLogs.length === 0 ? (
            <p className="text-xs text-slate-600 italic py-4">No raids logged yet.</p>
          ) : (
            <ul className="max-h-[140px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {raidLogs.map(log => (
                <li key={log.id} className="flex justify-between items-center bg-slate-900 border border-slate-800 p-2.5 rounded hover:border-slate-700 transition group">
                  <div>
                    <span className="font-bold text-sm text-amber-500 block leading-tight">{log.date}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">{log.zone} • {log.attendees.length} Attendees</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => setExpandedLog(log)} className="text-cyan-400 hover:text-cyan-300 text-xs font-bold px-2">Pop-out</button>
                    <button onClick={() => handleDeleteRaidLog(log.id)} className="text-slate-600 hover:text-red-400 text-xs font-bold px-2">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Roster Form Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner">
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">Master Guild Roster</h2>
          <p className="text-sm text-slate-500">Toggle players "In Raid" to include them in the Loot Council & Attendance logging.</p>
        </div>
        <form onSubmit={handleAddPlayer} className="flex flex-wrap items-center gap-3">
          <input type="text" placeholder="Player Name" className="bg-slate-900 text-white placeholder-slate-500 border border-slate-700 rounded-lg px-4 py-2.5 w-full sm:w-auto focus:outline-none" value={newName} onChange={e => setNewName(e.target.value)} />
          <select className="bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 w-full sm:w-auto focus:outline-none cursor-pointer" value={newSpec || ''} onChange={e => setNewSpec(parseInt(e.target.value))}>
            <option value="">Select Spec...</option>
            {specsFromDb.map(spec => <option key={spec.id} value={spec.id} style={{ color: spec.color }}>{spec.spec}</option>)}
          </select>
          <button type="submit" className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 py-2.5 rounded-lg transition shadow-lg">Add Member</button>
        </form>
      </div>

      {/* Selection Filters */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Live Raid Setup</h3>
        <div className="flex gap-2">
          <button onClick={() => setAllRaidStatus(true)} className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition">Select All</button>
          <button onClick={() => setAllRaidStatus(false)} className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition">Deselect All</button>
        </div>
      </div>

      {/* Roster Grid Elements */}
      {roster.length === 0 ? (
        <p className="text-center text-slate-500 py-12 border-2 border-dashed border-slate-800 rounded-xl">Your guild roster is empty.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
{roster.map(player => {
            const specData = getSpecById(player.spec_id);
            const specDisplay = specData?.spec || '?';
            const iconUrl = specData?.icon_large || 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg';
            
            return (
              <div 
                key={player.id} 
                className={`group relative flex items-center gap-3 p-3 rounded-lg transition-all duration-200 border cursor-pointer ${
                  importedIds.has(Number(player.id))
                    ? 'bg-cyan-950/20 border-cyan-500/60 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
                    : player.in_raid
                      ? 'bg-slate-800/80 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                      : 'bg-slate-950 border-slate-800 opacity-60 hover:opacity-100'
                }`} 
                onClick={() => toggleRaidStatus(player.id)}
              >
                <div className="relative">
                  <img src={iconUrl} alt="" className="w-10 h-10 rounded border border-slate-700 bg-slate-900 object-cover" />
                  {player.in_raid && (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full w-4 h-4 flex items-center justify-center border-2 border-slate-800">
                      <svg className="w-2.5 h-2.5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* 🔀 Swapped the hardcoded text layers for your master scoreboard component */}
                <div className="flex-1 min-w-0 pointer-events-none">
                  <PlayerNameWithScore player={player} />
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate font-semibold mt-0.5">
                    {specDisplay}
                    {conflictIds.has(Number(player.id)) && <span className="ml-2 text-amber-300">Spec Review</span>}
                  </p>
                </div>

                {importedIds.has(Number(player.id)) && (
                  <span className="absolute top-1 left-1 bg-cyan-600/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">RH</span>
                )}
                
                <button 
                  onClick={(e) => { e.stopPropagation(); handleRemovePlayer(player.id); }} 
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg z-10"
                >
                  ✕
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingPlayer(player); }}
                  className="absolute -bottom-2 -right-2 bg-cyan-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg z-10"
                  title="Edit player"
                >
                  ✎
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Edit Player</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Name</label>
                <input
                  type="text"
                  value={editingPlayer.name}
                  onChange={e => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                  className="w-full bg-slate-950 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Spec / Class</label>
                <select
                  value={editingPlayer.spec_id || ''}
                  onChange={e => setEditingPlayer({ ...editingPlayer, spec_id: Number(e.target.value) })}
                  className="w-full bg-slate-950 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
                >
                  {specsFromDb.map(spec => <option key={spec.id} value={spec.id} style={{ color: spec.color }}>{spec.class} - {spec.spec}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  handleUpdatePlayer(editingPlayer.id, { name: editingPlayer.name.trim(), spec_id: editingPlayer.spec_id });
                  setEditingPlayer(null);
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2 rounded"
              >
                Save
              </button>
              <button onClick={() => setEditingPlayer(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {expandedLog && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Raid Roster Snapshot</h3>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{expandedLog.date} • {expandedLog.zone}</p>
              </div>
              <button onClick={() => setExpandedLog(null)} className="text-slate-400 hover:text-slate-200 text-xl leading-none">✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {roster
                .filter(player => (expandedLog.attendees || []).map(Number).includes(Number(player.id)))
                .map(player => {
                  const spec = getSpecById(player.spec_id);
                  return (
                    <div key={player.id} className="bg-slate-950 border border-slate-800 rounded p-2.5">
                      <div className="text-sm font-bold" style={{ color: spec?.color || '#e2e8f0' }}>{player.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{spec?.class || 'Unknown'} • {spec?.spec || 'Unknown'}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {raidHelperImportSession && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-5xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Resolve RaidHelper Imports</h3>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{raidHelperImportSession.raidDate} • {raidHelperImportSession.raidZone}</p>
              </div>
              <button onClick={onCancelRaidHelperImport} className="text-slate-400 hover:text-slate-200 text-xl leading-none">✕</button>
            </div>

            <div className="space-y-3">
              {raidHelperImportSession.pending.map(entry => {
                const resolution = entry.resolution || 'add';
                const selectedClass = entry.selected_class || '';
                const classSpecs = selectedClass
                  ? specsFromDb.filter(spec => spec.class === selectedClass)
                  : specsFromDb;
                const mappedPlayer = roster.find(player => Number(player.id) === Number(entry.mapped_player_id));
                const matchedSpec = mappedPlayer ? getSpecById(mappedPlayer.spec_id) : null;

                return (
                  <div key={entry.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="text-sm font-bold text-amber-300">{entry.imported_name}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded">{entry.source === 'specMismatch' ? 'Spec Mismatch' : 'Missing Mapping'}</span>
                      {entry.incoming_spec_name && <span className="text-[10px] text-slate-400">JSON Spec: {entry.incoming_spec_name}</span>}
                      {matchedSpec && <span className="text-[10px] text-slate-400">Current: {matchedSpec.class} {matchedSpec.spec}</span>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Action</label>
                        <select
                          value={resolution}
                          onChange={e => onUpdateRaidHelperImportEntry(entry.id, { resolution: e.target.value })}
                          className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
                        >
                          {entry.source === 'specMismatch' ? (
                            <>
                              <option value="leave">Map & Leave Spec</option>
                              <option value="amend">Map & Amend Spec</option>
                              <option value="add">Add As New Player</option>
                            </>
                          ) : (
                            <>
                              <option value="map">Map To Existing</option>
                              <option value="add">Add As New Player</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Existing Character</label>
                        <select
                          value={entry.mapped_player_id || ''}
                          onChange={e => onUpdateRaidHelperImportEntry(entry.id, { mapped_player_id: e.target.value ? Number(e.target.value) : '' })}
                          disabled={resolution === 'add'}
                          className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
                        >
                          <option value="">-- Select Character --</option>
                          {roster.map(player => {
                            const spec = getSpecById(player.spec_id);
                            return <option key={player.id} value={player.id}>{player.name} {spec ? `(${spec.class} ${spec.spec})` : ''}</option>;
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Class</label>
                        <select
                          value={selectedClass}
                          onChange={e => onUpdateRaidHelperImportEntry(entry.id, { selected_class: e.target.value })}
                          className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
                        >
                          <option value="">-- Select Class --</option>
                          {specClasses.map(className => <option key={className} value={className}>{className}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Spec</label>
                        <select
                          value={entry.selected_spec_id || ''}
                          onChange={e => onUpdateRaidHelperImportEntry(entry.id, { selected_spec_id: e.target.value ? Number(e.target.value) : '' })}
                          className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
                        >
                          <option value="">-- Select Spec --</option>
                          {classSpecs.map(spec => <option key={spec.id} value={spec.id}>{spec.class} - {spec.spec}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button onClick={onCancelRaidHelperImport} className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded">Cancel</button>
              <button onClick={onApplyRaidHelperImport} className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2 px-4 rounded">Apply Import</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}