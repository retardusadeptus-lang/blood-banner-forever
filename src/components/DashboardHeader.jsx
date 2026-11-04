import ThemeControls from './ThemeControls';

export default function DashboardHeader({
  hasAnyUnsavedChanges,
  unsavedSections,
  handleSaveAllChanges,
  globalMyPlayerId,
  onCharacterSelect,
  sortedRosterForSelector,
  currentUserClaimedRosterIds,
  selectedGlobalPlayerIsClaimed,
  setShowLoginModal,
  setShowBnetClaimModal,
  bnetAuthState,
  canSaveChanges,
  handleBattleNetLogout,
  isAuthenticated,
  handleLogout,
  getDisplayFromId,
  specsByName,
  theme
}) {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-col justify-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 tracking-tight font-serif italic drop-shadow-sm">
          Blood and Banner
        </h1>
        <p className="text-slate-400 mt-2 font-medium uppercase tracking-widest text-sm">
          Guild management dashboard
        </p>
      </div>

      <div className="flex w-full items-stretch justify-end gap-4 flex-wrap lg:w-fit lg:flex-nowrap">
        {theme && (
          <div className="order-3 flex items-start">
            <ThemeControls
              palette={theme.palette}
              font={theme.font}
              onPaletteChange={theme.setPalette}
              onFontChange={theme.setFont}
            />
          </div>
        )}
        {canSaveChanges && hasAnyUnsavedChanges && (
          <div className="theme-surface-raised w-80 flex flex-col justify-between rounded-lg p-2.5">
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
        )}

        <div className="order-2 flex w-fit max-w-full flex-none flex-col gap-2">
          <div className={`flex items-center px-3 h-6 ${bnetAuthState.authenticated ? 'justify-end' : 'w-full'}`}>
            {bnetAuthState.authenticated ? (
              <>
                {bnetAuthState.user?.battletag && (
                  <span className="text-[11px] font-semibold text-cyan-300 whitespace-nowrap">Logged in as {bnetAuthState.user.battletag}</span>
                )}
                <button onClick={handleBattleNetLogout} className="ml-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 h-6 flex items-center">Logout</button>
              </>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-1 px-3 rounded text-[11px] uppercase tracking-wider h-6 flex items-center justify-center">Login</button>
            )}
          </div>

          {isAuthenticated && <div className="flex justify-end items-center px-3 h-6">
            <span className="text-[11px] font-semibold text-amber-300">Logged in as Officer</span>
            <button onClick={handleLogout} className="ml-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 h-6 flex items-center">Logout</button>
          </div>}
        </div>

        <div className="order-1 flex w-fit max-w-full flex-none items-center gap-3">
          <div className="shrink-0">
            <select
              value={globalMyPlayerId}
              onChange={e => onCharacterSelect(e.target.value)}
              className="theme-field origin-left scale-x-[1] w-auto max-w-full rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
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
          </div>
          <button
            type="button"
            onClick={() => setShowBnetClaimModal(true)}
            disabled={!bnetAuthState.authenticated || selectedGlobalPlayerIsClaimed}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${!bnetAuthState.authenticated || selectedGlobalPlayerIsClaimed ? 'border-slate-800 text-slate-500 cursor-not-allowed' : 'border-cyan-700/60 text-cyan-400 hover:border-cyan-500/80 hover:text-cyan-300'}`}
          >
            {selectedGlobalPlayerIsClaimed ? 'CLAIMED' : 'CLAIM'}
          </button>
        </div>
      </div>
    </header>
  );
}
