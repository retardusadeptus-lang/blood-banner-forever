import React from 'react';

export default function DashboardHeader({
  hasAnyUnsavedChanges,
  unsavedSections,
  handleSaveAllChanges,
  globalPhase,
  setGlobalPhase,
  globalMyPlayerId,
  onCharacterSelect,
  sortedRosterForSelector,
  currentUserClaimedRosterIds,
  selectedGlobalPlayerIsClaimed,
  setShowBnetClaimModal,
  bnetAuthState,
  handleBattleNetLogin,
  handleBattleNetLogout,
  isAuthenticated,
  handleLoginSubmit,
  passwordInput,
  setPasswordInput,
  handleLogout,
  roster,
  getDisplayFromId,
  specsByName,
  selectedBisSpec,
  setSelectedBisSpec
}) {
  const phaseOptions = ['Pre-BiS', 'T4', 'T5', 'T6', 'ZA', 'SWP'];

  return (
    <header className="flex flex-col md:flex-row md:items-stretch justify-between gap-4">
      <div className="flex flex-col justify-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 tracking-tight font-serif italic drop-shadow-sm">
          &lt;Guild Name TBC&gt;
        </h1>
        <p className="text-slate-400 mt-2 font-medium uppercase tracking-widest text-sm">
          Guild management dashboard
        </p>
      </div>

      <div className="flex items-stretch justify-end gap-4 flex-nowrap">
        <div className="w-80 flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-lg p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Unsaved Changes</span>
            <button
              type="button"
              onClick={handleSaveAllChanges}
              disabled={!hasAnyUnsavedChanges}
              className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${hasAnyUnsavedChanges ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            >
              Save All
            </button>
          </div>
          <div className="mt-2">
            {unsavedSections.length === 0 ? (
              <div className="text-[11px] text-slate-500">All tracked sections are saved.</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {unsavedSections.map(section => (
                  <span key={section} className="rounded-full border border-amber-600/40 bg-amber-900/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                    {section}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-64 flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-lg p-2">
          <div className="flex justify-center items-center mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Phase:</span>
            <select
              value={globalPhase}
              onChange={e => setGlobalPhase(e.target.value)}
              className="ml-3 bg-slate-950 text-amber-400 font-bold border border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              {phaseOptions.map(phase => <option key={phase} value={phase}>{phase}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={globalMyPlayerId}
              onChange={e => onCharacterSelect(e.target.value)}
              className="flex-1 bg-slate-950 text-amber-400 font-bold border border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="">— Select Character —</option>
              {sortedRosterForSelector.map(player => {
                const isCurrentUserClaim = currentUserClaimedRosterIds.has(Number(player.id));
                const isClaimedElsewhere = Boolean(player.user_id && !isCurrentUserClaim);
                const icon = isCurrentUserClaim ? '✔' : isClaimedElsewhere ? '■' : '◊';
                const specDisplay = getDisplayFromId(player.spec_id);
                const styleColor = isCurrentUserClaim
                  ? '#34d399'
                  : isClaimedElsewhere
                    ? '#64748b'
                    : (specsByName[specDisplay]?.color || '#e2e8f0');
                return (
                  <option key={player.id} value={player.id} style={{ color: styleColor }}>
                    {icon} {player.name}
                  </option>
                );
              })}
            </select>
            <button
              type="button"
              onClick={() => setShowBnetClaimModal(true)}
              disabled={!bnetAuthState.authenticated || selectedGlobalPlayerIsClaimed}
              className={`text-[10px] font-bold uppercase tracking-wider ${!bnetAuthState.authenticated || selectedGlobalPlayerIsClaimed ? 'text-slate-500 cursor-not-allowed' : 'text-cyan-400 hover:text-cyan-300'}`}
            >
              Claim
            </button>
          </div>
        </div>

        <div className={`flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-lg w-64 p-2`}>
          <div className="flex justify-end items-center px-3 h-6">
            {bnetAuthState.authenticated ? (
              <>
                {bnetAuthState.user?.battletag && (
                  <span className="text-[11px] font-semibold text-cyan-300 whitespace-nowrap">Logged in as {bnetAuthState.user.battletag}</span>
                )}
                <button onClick={handleBattleNetLogout} className="ml-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 h-6 flex items-center">Logout</button>
              </>
            ) : (
              <button onClick={handleBattleNetLogin} className="bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-1 px-3 rounded text-[11px] uppercase tracking-wider h-6 flex items-center justify-center">Log in with Battle.net</button>
            )}
          </div>

          <div className="flex justify-end items-center px-3 h-6">
            {isAuthenticated ? (
              <>
                <span className="text-[11px] font-semibold text-amber-300">Logged in as Officer</span>
                <button onClick={handleLogout} className="ml-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 h-6 flex items-center">Logout</button>
              </>
            ) : (
              <form onSubmit={handleLoginSubmit} className="flex items-center gap-2">
                <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="bg-slate-950 text-white border border-slate-700 rounded px-2 py-1.5 text-[11px] leading-none focus:outline-none focus:ring-1 focus:ring-amber-500 tracking-widest h-6 w-36" placeholder="Officer Password" />
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-1 px-3 rounded transition shadow-lg tracking-wider uppercase text-[11px] h-6 flex items-center justify-center">Unlock</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
