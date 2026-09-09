
import { useEffect, useState } from 'react';
import { DEFAULT_GLOBAL_PHASE, PHASES } from '../constants';

const CONFIG_SECTION_STORAGE_KEY = 'admin-config-section-state';
const CONFIG_SECTION_KEYS = ['site', 'access', 'scoring', 'rankings', 'discord', 'claims'];
const CONFIG_SECTION_LABELS = {
  site: 'Site defaults',
  access: 'Battle.net access',
  scoring: 'Score weighting',
  rankings: 'Guild rankings',
  discord: 'Discord bot',
  claims: 'Battle.net claims'
};

function readSectionState() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG_SECTION_STORAGE_KEY) || '{}');
    return CONFIG_SECTION_KEYS.reduce((state, key) => ({ ...state, [key]: saved[key] === true }), {});
  } catch {
    return CONFIG_SECTION_KEYS.reduce((state, key) => ({ ...state, [key]: false }), {});
  }
}

export default function DiscordBotConfigTab({
  config,
  setConfig,
  discordRoles,
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
  const [selectedBnetRole, setSelectedBnetRole] = useState('guild_member');
  const [openSections, setOpenSections] = useState(readSectionState);

  useEffect(() => {
    localStorage.setItem(CONFIG_SECTION_STORAGE_KEY, JSON.stringify(openSections));
  }, [openSections]);

  const toggleSection = (section) => {
    setOpenSections(previous => ({ ...previous, [section]: !previous[section] }));
  };

  const sectionProps = section => ({
    open: openSections[section],
    onToggle: event => {
      if (event.currentTarget.open !== openSections[section]) toggleSection(section);
    },
    className: 'bg-slate-950 border border-slate-800 rounded-xl',
    id: `config-section-${section}`
  });

  const sectionSummary = (title, description) => (
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3">
      <div>
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">{title}</h3>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </div>
      <span aria-hidden="true" className="config-section-indicator inline-block text-slate-400 transition-transform duration-150">&gt;</span>
    </summary>
  );

  const assignedBnetUserIds = new Set((bnetAccessRoles || []).map(item => Number(item.user_id)).filter(Boolean));
  const unassignedCandidates = (bnetAccessRoleCandidates || []).filter(candidate => !assignedBnetUserIds.has(Number(candidate.user_id)));
  const claimedCharactersByUserId = (claims || []).reduce((lookup, claim) => {
    const userId = Number(claim.userId || claim.user_id || 0);
    if (!userId) return lookup;
    const characterName = String(claim.rosterName || claim.roster_name || '').trim();
    if (characterName) lookup[userId] = [...(lookup[userId] || []), characterName];
    return lookup;
  }, {});
  const bnetAccessRoleByUserId = new Map((bnetAccessRoles || []).map(item => [Number(item.user_id), item.role]));
  const bnetAccessRoleLabels = { admin: 'Admin', officer: 'Officer', guild_member: 'Guild Member' };
  const handleAddBnetRole = () => {
    const userId = Number(selectedBnetUserId || 0);
    if (!userId) {
      alert('Select a Battle.net user first.');
      return;
    }
    onSetBnetAccessRole?.(userId, selectedBnetRole);
    setSelectedBnetUserId('');
  };
  const updateRoleAccess = (field, role, checked) => {
    setConfig(prev => ({
      ...(prev || {}),
      [field]: Array.from(new Set([
        ...(Array.isArray(prev?.[field]) ? prev[field] : []).filter(token => (
          String(token).toLowerCase() !== String(role.id).toLowerCase()
          && String(token).toLowerCase() !== String(role.name).toLowerCase()
        )),
        ...(checked ? [String(role.id)] : [])
      ]))
    }));
  };

  const hasRoleAccess = (field, role) => (Array.isArray(config?.[field]) ? config[field] : []).some(token => (
    String(token).toLowerCase() === String(role.id).toLowerCase()
    || String(token).toLowerCase() === String(role.name).toLowerCase()
  ));

  const updateScoringField = (field, value) => {
    setScoringConfig?.(previous => ({ ...(previous || {}), [field]: value }));
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

  const allSectionsOpen = CONFIG_SECTION_KEYS.every(section => openSections[section]);
  const setAllSections = (isOpen) => {
    setOpenSections(CONFIG_SECTION_KEYS.reduce((state, section) => ({ ...state, [section]: isOpen }), {}));
  };
  const jumpToSection = (section) => {
    setOpenSections(previous => ({ ...previous, [section]: true }));
    window.requestAnimationFrame(() => document.getElementById(`config-section-${section}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <section className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300 space-y-3">
      <style>{`
        details[open] > summary .config-section-indicator {
          transform: rotate(90deg);
        }
        details:not([open]) > summary.command-guide-summary {
          margin-bottom: -1rem;
        }
      `}</style>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">Config</h2>
          <p className="text-sm text-slate-500">Set which Discord roles can run each slash command and manage Battle.net roster claims.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setAllSections(!allSectionsOpen)} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider">
            {allSectionsOpen ? 'Collapse all' : 'Expand all'}
          </button>
          <button
            type="button"
            onClick={onSaveChanges}
            disabled={!hasUnsavedChanges || isSaving}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${hasUnsavedChanges ? 'bg-amber-600 hover:bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
          >
            {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Config' : 'No Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[180px_minmax(0,1fr)] gap-3 items-start">
        <nav className="lg:sticky lg:top-4 rounded-xl border border-slate-800 bg-slate-950 p-2" aria-label="Config sections">
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Jump to</p>
          {CONFIG_SECTION_KEYS.map(section => (
            <button key={section} type="button" onClick={() => jumpToSection(section)} className="block w-full rounded px-2 py-2 text-left text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-100">
              {CONFIG_SECTION_LABELS[section]}
            </button>
          ))}
        </nav>
        <div className="space-y-2">
      <details {...sectionProps('site')}>
        {sectionSummary('Site defaults and claims', 'Choose the default dashboard destination and character claim behavior.')}
        <div className="border-t border-slate-800 px-4 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Default Site Phase</label>
            <select value={scoringConfig?.defaultSitePhase || DEFAULT_GLOBAL_PHASE} onChange={event => updateScoringField('defaultSitePhase', event.target.value)} className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none">
              {PHASES.map(phase => <option key={phase} value={phase}>{phase}</option>)}
            </select>
            <p className="text-[11px] text-slate-500 mt-2">Sets the initial phase used by priority views.</p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Default Site Tab</label>
            <select value={scoringConfig?.defaultSiteTab || 'recruitment.focus'} onChange={event => updateScoringField('defaultSiteTab', event.target.value)} className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none">
              <option value="recruitment.focus">Recruitment Focus</option><option value="guild-bank.contents">Guild Bank</option><option value="raid-assignments.overview">Raid Assignments</option><option value="raid-signups.events">Raid Signups</option><option value="recruitment.applications">Recruitment Applications</option><option value="resources.bis">BiS Lists</option><option value="resources.weakauras">Weakauras</option><option value="resources.cheatsheets">Cheat Sheets</option><option value="resources.raidlogs">Raid Logs</option><option value="resources.wipefest">Wipefest</option><option value="loot.overview">Priority Overview</option><option value="loot.assigned">Assigned Loot</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-2">Sets the first tab for visitors without a saved tab.</p>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Claim Character Game Version</label>
            <select value={scoringConfig?.claimGameVersion || 'all'} onChange={event => updateScoringField('claimGameVersion', event.target.value)} className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none">
              <option value="all">All game versions</option><option value="World of Warcraft">World of Warcraft</option><option value="Classic Anniversary">Classic Anniversary</option><option value="Classic Era">Classic Era</option><option value="Classic Progression">Classic Progression</option><option value="WoW Classic">WoW Classic</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-2">Controls which characters appear in the claim modal.</p>
          </div>
        </div>
        <label className="mt-4 flex items-start gap-3 max-w-xl cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(scoringConfig?.claimFallbackEnabled)}
            onChange={event => updateScoringField('claimFallbackEnabled', event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-amber-500"
          />
          <span>
            <span className="block text-xs font-bold uppercase tracking-wider text-amber-400">Enable manual roster fallback</span>
            <span className="block text-[11px] text-slate-500 mt-1">Shows the manual roster claim list when Battle.net character lookup does not find a match.</span>
          </span>
        </label>
        </div>
      </details>

      <details {...sectionProps('access')}>
        {sectionSummary('Battle.net access', 'Grant Officer or Admin access to authenticated Battle.net users.')}
        <div className="border-t border-slate-800 px-4 py-3">
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
          <select value={selectedBnetRole} onChange={event => setSelectedBnetRole(event.target.value)} className="bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none">
            <option value="guild_member">Guild Member</option>
            <option value="officer">Officer</option>
            <option value="admin">Admin</option>
          </select>
          <button type="button" onClick={handleAddBnetRole} className="bg-cyan-700 hover:bg-cyan-600 text-white font-bold px-4 py-2 rounded text-xs uppercase tracking-wider">Add</button>
        </div>
        {(bnetAccessRoles || []).length === 0 ? <div className="text-sm text-cyan-100/70 border border-dashed border-cyan-900/50 rounded p-3">No Battle.net access roles assigned yet.</div> : (
          <div className="space-y-2">
            {(bnetAccessRoles || []).map(item => (
              <div key={item.user_id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 border border-slate-800 bg-slate-950 rounded p-3 items-center">
                <div>
                  <div className="text-sm font-semibold text-slate-100">{item.battletag || `User ${item.user_id}`}</div>
                  <div className="text-[11px] text-slate-500">Battle.net ID: {item.blizzard_id || 'n/a'}</div>
                  <div className="mt-1 text-[11px] text-cyan-200/70">
                    Claimed characters: {claimedCharactersByUserId[Number(item.user_id)]?.join(', ') || 'None'}
                  </div>
                </div>
                <select value={item.role === 'admin' ? 'admin' : item.role === 'guild_member' ? 'guild_member' : 'officer'} onChange={event => onSetBnetAccessRole?.(item.user_id, event.target.value)} className="bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"><option value="guild_member">Guild Member</option><option value="officer">Officer</option><option value="admin">Admin</option></select>
                <button type="button" onClick={() => { if (window.confirm(`Remove Battle.net access for ${item.battletag || item.user_id}?`)) onRemoveBnetAccessRole?.(item.user_id); }} className="text-red-400 hover:text-red-300 font-bold text-xs uppercase tracking-wider px-3 py-2 border border-red-900/40 rounded">Remove</button>
              </div>
            ))}
          </div>
        )}
        </div>
      </details>

      <details {...sectionProps('scoring')}>
        {sectionSummary('Score weighting', 'Adjust the global scoring multipliers used by loot priority views.')}
        <div className="border-t border-slate-800 px-4 py-3">
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
      </details>

      <details {...sectionProps('rankings')}>
        {sectionSummary('Guild role rankings', "Lower numbers sort first in the Admin Roster. Match the character's guild rank text exactly.")}
        <div className="border-t border-slate-800 px-4 py-3">
        <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
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
      </details>

      <details {...sectionProps('discord')}>
        {sectionSummary('Discord bot', 'Review commands and choose which guild roles may use them.')}
        <div className="border-t border-slate-800 px-4 py-3 space-y-3">
        <details className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <summary className="command-guide-summary -mx-4 -mt-4 flex w-[calc(100%+2rem)] cursor-pointer list-none items-center gap-2 px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-300">
            <span aria-hidden="true" className="config-section-indicator inline-block transition-transform duration-150">&gt;</span>
            Command guide
          </summary>
          <div className="mt-3 space-y-2 border-t border-slate-800 pt-3 text-xs text-slate-400">
            <p><strong className="text-slate-200">/request</strong> lets an authorized member request an item for a character. Choose the character and item, then submit the request.</p>
            <p><strong className="text-slate-200">/raidsignup post</strong> creates a signup card from a saved template. Members use the buttons on that card to sign up, choose a class, or remove their signup.</p>
            <p><strong className="text-slate-200">/raidsignup echo</strong> posts a summary of the selected event and its groups in the current channel.</p>
            <p><strong className="text-slate-200">/raidsignup edit, lock, archive, unlock, restore, delete</strong> manage an existing signup event.</p>
            <p>Empty permission columns mean that command is unrestricted. A member needs at least one selected role for a restricted command.</p>
          </div>
        </details>
        <div className="border border-slate-800 rounded-lg p-4">

        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Discord Command Roles</h3>
            <p className="text-[11px] text-slate-500 mt-1">Roles are loaded from the configured Discord guild. Signups here means raid signup management, not clicking a signup card.</p>
          </div>
          <span className="text-[11px] text-slate-500">{Array.isArray(discordRoles) ? discordRoles.length : 0} roles</span>
        </div>
        {(!Array.isArray(discordRoles) || discordRoles.length === 0) ? (
          <p className="border border-dashed border-slate-800 rounded p-3 text-sm text-slate-500">No Discord roles are available. Make sure the bot is connected and DISCORD_GUILD_ID is configured.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[480px]">
              <div className="grid grid-cols-[minmax(0,1fr)_110px_110px] gap-3 border-b border-slate-800 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span>Role</span>
                <span className="text-center">Request</span>
                <span className="text-center">Signups</span>
              </div>
              <div className="divide-y divide-slate-800">
                {discordRoles.map(role => (
                  <div key={role.id} className="grid grid-cols-[minmax(0,1fr)_110px_110px] items-center gap-3 px-3 py-2">
                    <span className="truncate text-sm text-slate-200" title={role.id}>{role.name}</span>
                    {['request_roles', 'signup_roles'].map(field => (
                      <label key={field} className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={hasRoleAccess(field, role)}
                          onChange={event => updateRoleAccess(field, role, event.target.checked)}
                          aria-label={`${role.name} ${field === 'request_roles' ? 'request' : 'signups'} permission`}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-amber-500"
                        />
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>
        </div>
      </details>

      <details {...sectionProps('claims')}>
        {sectionSummary('Battle.net claims', 'Review your connected profile and clear roster claims when needed.')}
        <div className="border-t border-slate-800 px-4 py-3 space-y-3">
        <div className="border border-slate-800 rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Your Battle.net profile</h4>
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

        <div className="border border-slate-800 rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Claimed characters</h4>
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
                    <p className="text-xs text-slate-500">
                      {claim.battletag || 'Battle.net account'}
                      <span className="ml-2 text-cyan-200/70">({bnetAccessRoleLabels[bnetAccessRoleByUserId.get(Number(claim.userId || claim.user_id))] || 'No access role'})</span>
                    </p>
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
        </div>
      </details>
        </div>
      </div>
    </section>
  );
}
