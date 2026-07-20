import { useMemo, useState } from 'react';

export default function BnetClaimModal({
  open,
  onClose,
  isAuthenticated,
  showBnetCharacterLookup,
  isLoading,
  error,
  roster,
  onClaim,
  onManualClaim,
  onLogin,
  onLogout,
  claimedRosterNames
}) {
  if (!open) return null;

  const rosterNames = new Set(roster.map(player => String(player.name || '').trim().toLowerCase()));
  const [rosterFilter, setRosterFilter] = useState('');

  const fallbackRosterChoices = useMemo(() => {
    const query = String(rosterFilter || '').trim().toLowerCase();
    return roster
      .filter(player => !player.user_id)
      .filter(player => {
        const name = String(player?.name || '').toLowerCase();
        if (!query) return true;
        return name.includes(query);
      })
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }, [roster, rosterFilter]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Claim Character</h3>
            <p className="text-xs text-slate-400 mt-1">
              Select a roster character and claim it with your Battle.net session.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={onLogout}
                className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200"
              >
                Logout
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogin}
                className="text-xs font-bold uppercase tracking-wider text-cyan-300 hover:text-cyan-200"
              >
                Login with Battle.net
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-xs text-red-300 bg-red-900/30 border border-red-700 rounded p-2">
            {error}
          </div>
        )}

        {!isAuthenticated && !isLoading && (
          <div className="mb-4 text-xs text-amber-200 bg-amber-900/20 border border-amber-700 rounded p-2">
            Battle.net session is not active. Log in with Battle.net first, then reopen this modal.
          </div>
        )}

        {isLoading ? (
          <div className="text-sm text-slate-400 py-8 text-center">Loading Battle.net characters...</div>
        ) : (
          <div className="space-y-2">
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Fallback: Claim From Roster List
              </p>
              <p className="text-[11px] text-slate-500 mb-2">
                Use this if Blizzard profile API is missing your character.
              </p>
              <input
                type="text"
                value={rosterFilter}
                onChange={(e) => setRosterFilter(e.target.value)}
                placeholder="Filter roster names..."
                className="mb-2 w-full bg-slate-950 text-slate-200 border border-slate-700 rounded px-2 py-1.5 text-xs"
              />

              {fallbackRosterChoices.length === 0 ? (
                <div className="text-xs text-slate-500 bg-slate-950 border border-slate-800 rounded p-2">
                  No unclaimed roster names match this filter.
                </div>
              ) : (
                <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                  {fallbackRosterChoices.map(player => {
                    const isAlreadyClaimedByMe = claimedRosterNames.has(String(player.name || '').toLowerCase());
                    return (
                      <div key={`fallback-${player.id}`} className="flex items-center justify-between gap-2 bg-slate-950 border border-slate-800 rounded px-2 py-1.5">
                        <p className="text-xs text-slate-200 truncate">{player.name}</p>
                        <button
                          type="button"
                          disabled={!isAuthenticated || isAlreadyClaimedByMe}
                          onClick={() => onManualClaim?.(player)}
                          className="bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-1 px-2 rounded text-[10px] uppercase tracking-wider"
                        >
                          {isAlreadyClaimedByMe ? 'Claimed' : 'Claim'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
