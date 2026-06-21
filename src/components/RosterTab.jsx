import React from 'react';

export default function RosterTab({
  handleSaveRaidLog,
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
  handleRemovePlayer,
  specsByName,
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
                  <button onClick={() => handleDeleteRaidLog(log.id)} className="text-slate-600 hover:text-red-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition px-2">Delete</button>
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
                  player.in_raid 
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
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate font-semibold mt-0.5">{specDisplay}</p>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); handleRemovePlayer(player.id); }} 
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg z-10"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}