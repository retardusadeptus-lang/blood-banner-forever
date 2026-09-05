
import { useState } from 'react';

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
  bnetAuthState,
  bnetAccessRoles,
  bnetAccessRoleCandidates,
  bnetAccessRolesDirty,
  onSetBnetAccessRole,
  onRemoveBnetAccessRole,
  onSaveBnetAccessRoles,
  isSavingBnetAccessRoles
}) {
  const [selectedBnetUserId, setSelectedBnetUserId] = useState('');
  const [selectedBnetRole, setSelectedBnetRole] = useState('officer');

  const assignedBnetUserIds = new Set((bnetAccessRoles || []).map(item => Number(item.user_id)).filter(Boolean));
  const unassignedCandidates = (bnetAccessRoleCandidates || []).filter(candidate => !assignedBnetUserIds.has(Number(candidate.user_id)));
  const handleAddBnetRole = () => {
    const userId = Number(selectedBnetUserId || 0);
    if (!userId) {
      alert('Select a Battle.net user first.');
      return;
    }
    onSetBnetAccessRole?.(userId, selectedBnetRole);
    setSelectedBnetUserId('');
  };
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

  const guildRoleRanks = Array.isArray(scoringConfig?.guildRoleRanks) ? scoringConfig.guildRoleRanks : [];
  const updateGuildRoleRank = (index, field, value) => {
    const nextRoles = guildRoleRanks.map((role, roleIndex) => roleIndex === index ? { ...role, [field]: field === 'rank' ? Number(value) || 0 : value } : role);
    updateScoringField('guildRoleRanks', nextRoles);
  };

  const addGuildRoleRank = () => {
    updateScoringField('guildRoleRanks', [...guildRoleRanks, { name: '', rank: guildRoleRanks.length + 1, weight: 1, isRaider: false }]);
  };

  const removeGuildRoleRank = (index) => {
    updateScoringField('guildRoleRanks', guildRoleRanks.filter((_, roleIndex) => roleIndex !== index));
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-cyan-200">Battle.net Access Roles</h3>
            <p className="text-xs text-cyan-100/70">Admins can grant Officer/Admin access to authenticated Battle.net users.</p>
          </div>
          <button type="button" onClick={onSaveBnetAccessRoles} disabled={!bnetAccessRolesDirty || isSavingBnetAccessRoles} className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${bnetAccessRolesDirty ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>
            {isSavingBnetAccessRoles ? 'Saving...' : bnetAccessRolesDirty ? 'Save Access Roles' : 'No Changes'}
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-2 mb-4">
          <select value={selectedBnetUserId} onChange={event => setSelectedBnetUserId(event.target.value)} className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none">
            <option value="">-- Select Battle.net user --</option>
            {unassignedCandidates.map(candidate => <option key={candidate.user_id} value={candidate.user_id}>{candidate.battletag}</option>)}
          </select>
          <select value={selectedBnetRole} onChange={event => setSelectedBnetRole(event.target.value === 'admin' ? 'admin' : 'officer')} className="bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none">
            <option value="officer">Officer</option>
            <option value="admin">Admin</option>
          </select>
          <button type="button" onClick={handleAddBnetRole} className="bg-cyan-700 hover:bg-cyan-600 text-white font-bold px-4 py-2 rounded text-xs uppercase tracking-wider">Add</button>
        </div>
        {(bnetAccessRoles || []).length === 0 ? <div className="text-sm text-cyan-100/70 border border-dashed border-cyan-900/50 rounded p-3">No Battle.net access roles assigned yet.</div> : (
          <div className="space-y-2">
            {(bnetAccessRoles || []).map(item => (
              <div key={item.user_id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 border border-slate-800 bg-slate-950 rounded p-3 items-center">
                <div><div className="text-sm font-semibold text-slate-100">{item.battletag || `User ${item.user_id}`}</div><div className="text-[11px] text-slate-500">Battle.net ID: {item.blizzard_id || 'n/a'}</div></div>
                <select value={item.role === 'admin' ? 'admin' : 'officer'} onChange={event => onSetBnetAccessRole?.(item.user_id, event.target.value)} className="bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"><option value="officer">Officer</option><option value="admin">Admin</option></select>
                <button type="button" onClick={() => { if (window.confirm(`Remove Battle.net access for ${item.battletag || item.user_id}?`)) onRemoveBnetAccessRole?.(item.user_id); }} className="text-red-400 hover:text-red-300 font-bold text-xs uppercase tracking-wider px-3 py-2 border border-red-900/40 rounded">Remove</button>
              </div>
            ))}
          </div>
        )}
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

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Guild Role Rankings</h3>
            <p className="mt-1 text-xs text-slate-500">Lower numbers sort first in the Admin Roster. Match the character's guild rank text exactly.</p>
          </div>
          <button type="button" onClick={addGuildRoleRank} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700">Add Guild Role</button>
        </div>
        <div className="space-y-2">
          {guildRoleRanks.length === 0 ? <p className="rounded border border-dashed border-slate-800 p-3 text-sm text-slate-500">No guild role rankings configured.</p> : (
            <>
              <div className="grid grid-cols-[minmax(0,1fr)_90px_100px_80px_auto] items-end gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span>Guild Rank</span>
                <span className="text-center">Rank</span>
                <span className="text-center">Score Weight</span>
                <span className="text-center">Raider</span>
                <span className="invisible rounded border px-3 py-2 text-xs">Remove</span>
              </div>
              {guildRoleRanks.map((role, index) => (
                <div key={`guild-role-${index}`} className="grid grid-cols-[minmax(0,1fr)_90px_100px_80px_auto] items-center gap-2">
                  <input type="text" value={role.name || ''} onChange={event => updateGuildRoleRank(index, 'name', event.target.value)} placeholder="Guild role name" className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
                  <input type="number" min="1" value={role.rank ?? ''} onChange={event => updateGuildRoleRank(index, 'rank', event.target.value)} aria-label={`Rank number for ${role.name || 'guild role'}`} className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
                  <input type="number" min="0" step="0.1" value={role.weight ?? 1} onChange={event => updateGuildRoleRank(index, 'weight', event.target.value)} aria-label={`Score weight for ${role.name || 'guild role'}`} className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
                  <label className="flex justify-center"><input type="checkbox" checked={role.isRaider === true} onChange={event => updateGuildRoleRank(index, 'isRaider', event.target.checked)} aria-label={`Mark ${role.name || 'guild role'} as raider`} className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-500" /></label>
                  <button type="button" onClick={() => removeGuildRoleRank(index)} className="rounded border border-rose-900/50 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-950/40">Remove</button>
                </div>
              ))}
            </>
          )}
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
