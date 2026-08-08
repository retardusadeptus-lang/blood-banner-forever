
function normalizeList(rawText) {
  return Array.from(
    new Set(
      String(rawText || '')
        .split(/[\n,]/)
        .map(v => v.trim())
        .filter(Boolean)
        .map(v => v.toLowerCase())
    )
  );
}

function toEditorText(values) {
  if (!Array.isArray(values) || values.length === 0) return '';
  return values.join('\n');
}

export default function DiscordBotConfigTab({
  config,
  setConfig,
  hasUnsavedChanges,
  onSaveChanges,
  isSaving,
  claims,
  onUnclaimClaim,
  roster,
  specsByName,
  getDisplayFromId,
  scoringConfig,
  setScoringConfig,
  bnetAuthState
}) {
  const updateRoleList = (field, rawText) => {
    setConfig(prev => ({
      ...(prev || {}),
      [field]: normalizeList(rawText)
    }));
  };

  const requestText = toEditorText(config?.request_roles);
  const signupText = toEditorText(config?.signup_roles);
  const benchText = toEditorText(config?.bench_roles);

  const updateScoringField = (field, value) => {
    setScoringConfig?.({ ...(scoringConfig || {}), [field]: value });
  };

  return (
    <section className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">Config</h2>
          <p className="text-sm text-slate-500">Set which Discord roles can run each slash command and manage Battle.net roster claims.</p>
        </div>
        <button
          type="button"
          onClick={onSaveChanges}
          disabled={!hasUnsavedChanges || isSaving}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${hasUnsavedChanges ? 'bg-amber-600 hover:bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
        >
          {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Config' : 'No Changes'}
        </button>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-4">Global Score Weighting Weights</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Parse Multiplier</label>
            <input type="number" step="0.1" className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 focus:outline-none" value={scoringConfig?.parseWeight ?? ''} onChange={e => updateScoringField('parseWeight', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Support Multiplier</label>
            <input type="number" step="0.1" className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 focus:outline-none" value={scoringConfig?.supportMulti ?? ''} onChange={e => updateScoringField('supportMulti', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Consumables (+)</label>
            <input type="number" className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 focus:outline-none" value={scoringConfig?.consBonus ?? ''} onChange={e => updateScoringField('consBonus', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Enchants (+)</label>
            <input type="number" className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 focus:outline-none" value={scoringConfig?.enchantBonus ?? ''} onChange={e => updateScoringField('enchantBonus', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Gems (+)</label>
            <input type="number" className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 focus:outline-none" value={scoringConfig?.gemBonus ?? ''} onChange={e => updateScoringField('gemBonus', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Attendance Multiplier</label>
            <input type="number" step="0.1" className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 focus:outline-none" value={scoringConfig?.attWeight ?? ''} onChange={e => updateScoringField('attWeight', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-red-500 mb-1">AFK Penalty (-)</label>
            <input type="number" step="0.1" className="w-full bg-slate-900 text-red-400 font-bold border border-red-900 rounded p-2 focus:outline-none" value={scoringConfig?.afkPenalty ?? ''} onChange={e => updateScoringField('afkPenalty', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Request Command Roles</label>
          <textarea
            value={requestText}
            onChange={e => updateRoleList('request_roles', e.target.value)}
            className="w-full h-48 bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
            placeholder="Example:\nraider\n123456789012345678"
          />
          <p className="text-[11px] text-slate-500 mt-2">Controls access to /request. Empty list means unrestricted.</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Raid Signup Roles</label>
          <textarea
            value={signupText}
            onChange={e => updateRoleList('signup_roles', e.target.value)}
            className="w-full h-48 bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
            placeholder="Example:\nraider\ncore raider"
          />
          <p className="text-[11px] text-slate-500 mt-2">Controls access to /raid signup. Empty list means unrestricted.</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Raid Bench Roles</label>
          <textarea
            value={benchText}
            onChange={e => updateRoleList('bench_roles', e.target.value)}
            className="w-full h-48 bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
            placeholder="Example:\nofficer\nraid leader"
          />
          <p className="text-[11px] text-slate-500 mt-2">Controls access to /raid bench. Empty list means unrestricted.</p>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Your Battle.net Profile</h3>
        {bnetAuthState?.authenticated ? (
          <div className="space-y-2">
            <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
              <p className="text-sm font-semibold text-cyan-300">Logged in as: {bnetAuthState.user?.battletag || 'Unknown'}</p>
              <p className="text-xs text-slate-400 mt-1">Blizzard ID: {bnetAuthState.user?.blizzardId || 'N/A'}</p>
            </div>
            {Array.isArray(bnetAuthState.claimedCharacters) && bnetAuthState.claimedCharacters.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-400">Your Claimed Roster Characters:</p>
                {bnetAuthState.claimedCharacters.map(claim => {
                  const rosterEntry = Array.isArray(roster) ? roster.find(player => Number(player.id) === Number(claim.rosterId)) : null;
                  const specDisplay = rosterEntry ? getDisplayFromId?.(rosterEntry.spec_id) : null;
                  const color = specsByName?.[specDisplay]?.color || '#e2e8f0';
                  return (
                    <div key={claim.rosterId} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2">
                      <p className="text-xs font-semibold text-slate-100" style={{ color }}>{claim.rosterName || `Character ${claim.rosterId}`}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No roster characters claimed yet. Use the Claim button to link your Battle.net account to a roster character.</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Not logged in with Battle.net. Use the "Log in with Battle.net" button in the header.</p>
        )}
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Claimed Characters</h3>
        {(!Array.isArray(claims) || claims.length === 0) ? (
          <p className="text-sm text-slate-500">No Battle.net claims have been made yet.</p>
        ) : (
          <div className="space-y-2">
            {claims.map(claim => {
              const rosterEntry = Array.isArray(roster) ? roster.find(player => Number(player.id) === Number(claim.rosterId)) : null;
              const specDisplay = rosterEntry ? getDisplayFromId?.(rosterEntry.spec_id) : null;
              const color = specsByName?.[specDisplay]?.color || '#e2e8f0';
              return (
                <div key={`${claim.rosterId}-${claim.userId}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-100" style={{ color }}>{claim.rosterName}</p>
                    <p className="text-xs text-slate-500">{claim.battletag || 'Battle.net account'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUnclaimClaim?.(claim)}
                    className="text-[10px] font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300"
                  >
                    Clear Claim
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">How To Use The Bot</h3>
        <ol className="list-decimal list-inside text-sm text-slate-300 space-y-1">
          <li>Set DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, and DISCORD_GUILD_ID in guild-loot-api/.env.</li>
          <li>Start API + bot together using npm start from guild-loot-api.</li>
          <li>Open this tab and save role access for request, signup, and bench commands.</li>
          <li>Use /request with item autocomplete and character autocomplete.</li>
          <li>Use /raid signup or /raid bench to toggle in_raid in roster.</li>
        </ol>
      </div>
    </section>
  );
}
