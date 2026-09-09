import { useEffect, useMemo, useState } from 'react';
import { P2_BOSSES } from '../constants';
import { getDefaultGuildRoleName } from '../utils/appShellHelpers';
import { getAttendanceChartEntries } from '../utils/attendanceChart.js';
import { getRaidSignupAbsences } from '../services/apiService';

const UNKNOWN_ICON = 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg';
const SPEC_ICON_FALLBACKS = {
  'Prot Warrior': 'https://wow.zamimg.com/images/wow/icons/large/inv_shield_06.jpg',
  'Arms Warrior': 'https://wow.zamimg.com/images/wow/icons/large/ability_warrior_savageblow.jpg',
  'Fury Warrior': 'https://wow.zamimg.com/images/wow/icons/large/ability_warrior_innerrage.jpg',
  'Prot Paladin': 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_devotionaura.jpg',
  'Holy Paladin': 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_holybolt.jpg',
  'Ret Paladin': 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_auraoflight.jpg',
  'BM Hunter': 'https://wow.zamimg.com/images/wow/icons/large/ability_hunter_beasttaming.jpg',
  'MM Hunter': 'https://wow.zamimg.com/images/wow/icons/large/ability_marksmanship.jpg',
  'Survival Hunter': 'https://wow.zamimg.com/images/wow/icons/large/ability_hunter_swiftstrike.jpg',
  'Elemental Shaman': 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_lightning.jpg',
  'Enhance Shaman': 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_lightningshield.jpg',
  'Resto Shaman': 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_magicimmunity.jpg',
  'Balance Druid': 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_starfall.jpg',
  'Feral (Tank)': 'https://wow.zamimg.com/images/wow/icons/large/ability_racial_bearform.jpg',
  'Feral (DPS)': 'https://wow.zamimg.com/images/wow/icons/large/ability_druid_catform.jpg',
  'Resto Druid': 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_healingtouch.jpg',
  'Combat Rogue': 'https://wow.zamimg.com/images/wow/icons/large/ability_backstab.jpg',
  'Subtlety Rogue': 'https://wow.zamimg.com/images/wow/icons/large/ability_stealth.jpg',
  'Assassination Rogue': 'https://wow.zamimg.com/images/wow/icons/large/ability_rogue_eviscerate.jpg',
  'Holy Priest': 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_guardianspirit.jpg',
  'Discipline Priest': 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_wordfortitude.jpg',
  'Shadow Priest': 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_shadowwordpain.jpg',
  'Arcane Mage': 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_magicalsentry.jpg',
  'Fire Mage': 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_firebolt02.jpg',
  'Frost Mage': 'https://wow.zamimg.com/images/wow/icons/large/spell_frost_frostbolt02.jpg',
  'Destro Warlock': 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_rainoffire.jpg',
  'Demo Warlock': 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_metamorphosis.jpg',
  'Affliction Warlock': 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_deathcoil.jpg'
};

function getSpecIcon(spec) {
  return spec?.icon_large || spec?.icon_medium || spec?.icon_small || spec?.icon || spec?.icon_url || spec?.iconUrl || SPEC_ICON_FALLBACKS[spec?.spec] || UNKNOWN_ICON;
}

export default function GuildRosterTab({
  roster,
  specsFromDb,
  getSpecById,
  handleAddPlayer,
  newName,
  setNewName,
  newSpec,
  setNewSpec,
  calculateScore,
  calculateAttendance,
  raidLogs = [],
  playerStats = {},
  guildRoleRanks = [],
  rosterClaims,
  fetchData,
  handleUpdatePlayer,
  handleRemovePlayer,
  hasUnsavedChanges,
  onSaveChanges,
  isSaving
}) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [detailType, setDetailType] = useState(null);
  const [bankRequests, setBankRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState({ className: '', specName: '', rank: '', score: '', attendance: '', claim: '', requestedValue: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [absences, setAbsences] = useState([]);

  const claimsByRosterId = useMemo(() => new Map((rosterClaims || []).map(claim => [String(claim.rosterId), claim])), [rosterClaims]);
  const requestsByPlayerId = useMemo(() => {
    const map = new Map();
    bankRequests.forEach(request => {
      const key = String(request.player_id);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(request);
    });
    return map;
  }, [bankRequests]);

  useEffect(() => {
    let mounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingRequests(true);
    fetchData('bank-requests')
      .then(requests => { if (mounted) setBankRequests(Array.isArray(requests) ? requests : []); })
      .catch(() => { if (mounted) setBankRequests([]); })
      .finally(() => { if (mounted) setIsLoadingRequests(false); });
    return () => { mounted = false; };
  }, [fetchData]);

  useEffect(() => {
    let mounted = true;
    getRaidSignupAbsences()
      .then(rows => { if (mounted) setAbsences(Array.isArray(rows) ? rows : []); })
      .catch(() => { if (mounted) setAbsences([]); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return;
      if (editingPlayer) setEditingPlayer(null);
      else if (selectedPlayer) {
        setSelectedPlayer(null);
        setDetailType(null);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [editingPlayer, selectedPlayer]);

  const openPlayer = (player) => {
    setSelectedPlayer(player);
    setDetailType('score');
  };
  const openDetail = (player, type) => {
    setSelectedPlayer(player);
    setDetailType(type);
  };
  const selectedRequests = selectedPlayer ? (requestsByPlayerId.get(String(selectedPlayer.id)) || []) : [];
  const selectedStats = selectedPlayer ? (playerStats[selectedPlayer.id] || { cons: false, enchants: false, gems: false, afks: 0, parses: {} }) : null;
  const attendanceChartEntries = useMemo(() => getAttendanceChartEntries({
    raidLogs,
    playerId: selectedPlayer?.id,
    playerName: selectedPlayer?.name,
    absences,
  }), [absences, raidLogs, selectedPlayer?.id, selectedPlayer?.name]);
  const attendedRaidCount = attendanceChartEntries.filter(entry => entry.status === 'signed').length;
  const unnotifiedAbsenceCount = attendanceChartEntries.filter(entry => entry.status === 'no_response').length;
  const signupCount = attendanceChartEntries.filter(entry => ['signed', 'notified_absence'].includes(entry.status)).length;
  const signupPercent = attendanceChartEntries.length === 0
    ? 100
    : Math.round((signupCount / attendanceChartEntries.length) * 100);
  const roleRankByName = useMemo(() => new Map((Array.isArray(guildRoleRanks) ? guildRoleRanks : []).map(role => [String(role.name || '').trim().toLowerCase(), Number(role.rank) || 9999])), [guildRoleRanks]);
  const defaultGuildRank = getDefaultGuildRoleName({ guildRoleRanks });

  const rosterRows = useMemo(() => {
    const search = rosterSearch.trim().toLowerCase();
    const rows = (roster || []).map(player => {
      const spec = getSpecById(player.spec_id);
      const claim = claimsByRosterId.get(String(player.id));
      const requests = requestsByPlayerId.get(String(player.id)) || [];
      return {
        player,
        spec,
        claim: Boolean(claim),
        name: player.name || '',
        score: Math.round(calculateScore(player.id)),
        attendance: calculateAttendance(player.id),
        className: spec?.class || 'Unknown',
        specName: spec?.spec || 'Unknown spec',
        rank: player.guild_rank || player.rank || defaultGuildRank,
        rankOrder: roleRankByName.get(String(player.guild_rank || player.rank || defaultGuildRank).trim().toLowerCase()) ?? 9999,
        requestCount: requests.length,
        requestedValue: requests.reduce((total, request) => total + (Number(request.price) || 0) * (Number(request.quantity) || 0), 0)
      };
    }).filter(row => {
      const matchesSearch = !search || [row.player.name, row.className, row.specName, row.rank]
        .some(value => String(value).toLowerCase().includes(search));
      const matchesColumns = Object.entries(columnFilters).every(([key, value]) => {
        if (!value) return true;
        if (key === 'claim') return value === 'claimed' ? row.claim : !row.claim;
        return String(row[key]).toLowerCase().includes(value.toLowerCase());
      });
      return matchesSearch && matchesColumns;
    });

    return rows.sort((left, right) => {
      const leftValue = left[sortConfig.key] ?? '';
      const rightValue = right[sortConfig.key] ?? '';
      const comparison = typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue), undefined, { sensitivity: 'base' });
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [calculateAttendance, calculateScore, claimsByRosterId, columnFilters, defaultGuildRank, getSpecById, requestsByPlayerId, roleRankByName, roster, rosterSearch, sortConfig]);

  const toggleSort = (key) => {
    setSortConfig(current => current.key === key
      ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { key, direction: 'asc' });
  };

  const sortIndicator = (key) => sortConfig.key === key ? (sortConfig.direction === 'asc' ? ' ^' : ' v') : '';

  const saveEdit = () => {
    if (!editingPlayer) return;
    handleUpdatePlayer(editingPlayer.id, {
      name: editingPlayer.name.trim(),
      spec_id: Number(editingPlayer.spec_id),
      guild_rank: editingPlayer.guild_rank.trim()
    });
    setSelectedPlayer(selectedPlayer ? { ...selectedPlayer, ...editingPlayer, spec_id: Number(editingPlayer.spec_id) } : selectedPlayer);
    setEditingPlayer(null);
  };

  const editingClasses = Array.from(new Set((specsFromDb || []).map(spec => spec.class).filter(Boolean))).sort();
  const editingSpecs = (specsFromDb || []).filter(spec => !editingPlayer?.className || spec.class === editingPlayer.className);
  const configuredGuildRanks = (Array.isArray(guildRoleRanks) ? guildRoleRanks : []).map(role => String(role.name || '').trim()).filter(Boolean);
  const getEditableGuildRank = (player) => {
    const currentRank = String(player?.guild_rank || player?.rank || '').trim();
    return configuredGuildRanks.length > 0 && currentRank.toLowerCase() === 'guild member'
      ? defaultGuildRank
      : currentRank || defaultGuildRank;
  };
  const editingGuildRanks = Array.from(new Set([
    ...(configuredGuildRanks.length > 0 ? configuredGuildRanks : ['Guild Member']),
    ...(editingPlayer?.guild_rank && editingPlayer.guild_rank.toLowerCase() !== 'guild member' ? [editingPlayer.guild_rank] : [])
  ]));

  return (
    <section className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Guild Roster</h2>
          <p className="mt-1 text-sm text-slate-400">Review member details, claims, attendance, scores, and bank requests.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setIsAddingPlayer(current => !current)} className="rounded-lg bg-cyan-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-cyan-600">
            {isAddingPlayer ? 'Cancel' : 'Add Character'}
          </button>
          <button
            type="button"
            onClick={onSaveChanges}
            disabled={!hasUnsavedChanges || isSaving}
            className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${hasUnsavedChanges ? 'bg-amber-600 text-slate-950 hover:bg-amber-500' : 'cursor-not-allowed bg-slate-800 text-slate-500'}`}
          >
            {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
          </button>
        </div>
      </div>

      {isAddingPlayer && (
        <form onSubmit={event => { handleAddPlayer(event); setIsAddingPlayer(false); }} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 p-3">
          <input type="text" required placeholder="Character name" value={newName} onChange={event => setNewName(event.target.value)} className="min-w-[200px] flex-1 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600" />
          <select required value={newSpec || ''} onChange={event => setNewSpec(Number(event.target.value))} className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100">
            <option value="">Select spec...</option>
            {specsFromDb.map(spec => <option key={spec.id} value={spec.id}>{spec.spec}</option>)}
          </select>
          <button type="submit" className="rounded bg-emerald-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-600">Add</button>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 p-3">
        <input
          type="search"
          value={rosterSearch}
          onChange={event => setRosterSearch(event.target.value)}
          placeholder="Search characters, class, spec, or rank"
          className="min-w-[220px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
        />
        <span className="text-xs text-slate-500">{rosterRows.length} of {(roster || []).length} characters</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-950 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              {[
                ['name', 'Character'],
                ['className', 'Class'],
                ['specName', 'Spec'],
                ['rankOrder', 'Rank'],
                ['score', 'Score'],
                ['attendance', 'Attendance'],
                ['claim', 'Battle.net'],
                ['requestedValue', 'Bank Requests']
              ].map(([key, label, filterKey]) => (
                <th key={key} className="whitespace-nowrap px-3 py-3">
                  <div className="flex flex-col gap-2">
                    <button type="button" onClick={() => toggleSort(key)} className="text-left font-bold text-slate-400 hover:text-cyan-300">{label}{sortIndicator(key)}</button>
                    {key === 'claim' ? (
                      <select value={columnFilters.claim} onChange={event => setColumnFilters(current => ({ ...current, claim: event.target.value }))} className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-normal normal-case tracking-normal text-slate-300">
                        <option value="">All</option><option value="claimed">Claimed</option><option value="unclaimed">Unclaimed</option>
                      </select>
                    ) : (
                      <input type="search" value={columnFilters[filterKey] || ''} onChange={event => setColumnFilters(current => ({ ...current, [filterKey]: event.target.value }))} placeholder="Filter" className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-normal normal-case tracking-normal text-slate-300 placeholder:text-slate-600" />
                    )}
                  </div>
                </th>
              ))}
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rosterRows.map(({ player, spec, claim, score, attendance, className, specName, rank, requestCount, requestedValue }) => (
              <tr key={player.id} onClick={() => openPlayer(player)} className="cursor-pointer bg-slate-900 transition hover:bg-slate-800/80">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <img src={getSpecIcon(spec)} alt="" className="h-8 w-8 rounded border border-slate-700" />
                    <span className="font-bold" style={{ color: spec?.color || '#e2e8f0' }}>{player.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-slate-300">{className}</td>
                <td className="px-3 py-2.5 text-slate-400">
                  <div className="flex items-center gap-2">
                    <img src={getSpecIcon(spec)} alt="" className="h-5 w-5 rounded border border-slate-700" />
                    <span>{specName}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-slate-500">{rank}</td>
                <td className="px-3 py-2.5 font-bold text-amber-400"><button type="button" onClick={event => { event.stopPropagation(); openDetail(player, 'score'); }} className="cursor-pointer hover:text-amber-300">{score}</button></td>
                <td className="px-3 py-2.5 font-bold text-cyan-400"><button type="button" onClick={event => { event.stopPropagation(); openDetail(player, 'attendance'); }} className="cursor-pointer hover:text-cyan-300">{attendance}%</button></td>
                <td className={`px-3 py-2.5 font-semibold ${claim ? 'text-emerald-400' : 'text-slate-500'}`}>{claim ? 'Claimed' : 'Unclaimed'}</td>
                <td className="px-3 py-2.5 font-semibold text-slate-300"><button type="button" onClick={event => { event.stopPropagation(); openDetail(player, 'bank'); }} className="cursor-pointer hover:text-slate-100">{requestCount ? `${requestCount} · ${requestedValue.toLocaleString()}g` : 'None'}</button></td>
                <td className="px-3 py-2.5 text-right" onClick={event => event.stopPropagation()}>
                  <button type="button" onClick={() => setEditingPlayer({ ...player, className: spec?.class || '', guild_rank: getEditableGuildRank(player) })} className="rounded border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-300 hover:border-cyan-600/60 hover:text-cyan-300">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rosterRows.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No roster members match these filters.</p>}
      </div>

      {roster.length === 0 && <p className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">Your guild roster is empty.</p>}

      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" onClick={() => { setSelectedPlayer(null); setDetailType(null); }}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-100">{selectedPlayer.name} · {detailType === 'attendance' ? 'Attendance' : detailType === 'bank' ? 'Guild Bank' : 'Score'}</h3>
                <p className="text-sm text-slate-400">{getSpecById(selectedPlayer.spec_id)?.class || 'Unknown'} · {getSpecById(selectedPlayer.spec_id)?.spec || 'Unknown spec'} · {selectedPlayer.guild_rank || selectedPlayer.rank || defaultGuildRank}</p>
              </div>
              <button type="button" onClick={() => { setSelectedPlayer(null); setDetailType(null); }} className="text-xl text-slate-400 hover:text-white" aria-label="Close member details">×</button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-800 pb-4">
              {[
                ['score', 'Score'],
                ['attendance', 'Attendance'],
                ['bank', 'Guild Bank']
              ].map(([type, label]) => <button key={type} type="button" onClick={() => setDetailType(type)} className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider ${detailType === type ? 'bg-slate-700 text-cyan-300' : 'bg-slate-950 text-slate-500 hover:text-slate-200'}`}>{label}</button>)}
            </div>

            {detailType === 'score' && (
              <div className="mt-5 space-y-4">
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Score</div>
                  <div className="mt-1 text-3xl font-bold text-amber-400">{Math.round(calculateScore(selectedPlayer.id))}</div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Base Checks</h4>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-300 sm:grid-cols-3">
                    <span>{selectedStats.cons ? '✓' : '○'} Full Consumables</span>
                    <span>{selectedStats.enchants ? '✓' : '○'} Fully Enchanted</span>
                    <span>{selectedStats.gems ? '✓' : '○'} Fully Gemmed</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><span className="text-slate-500">Manual adjustment</span><div className="font-bold text-amber-400">{selectedStats.manualAdjustment?.value || 0}</div></div><div><span className="text-slate-500">AFKs on trash</span><div className="font-bold text-red-400">{selectedStats.afks || 0}</div></div></div>
                  {selectedStats.manualAdjustment?.note && <p className="mt-2 text-xs text-slate-500">{selectedStats.manualAdjustment.note}</p>}
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Phase 2 Parse Logs</h4>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {P2_BOSSES.map(boss => { const parse = selectedStats.parses?.[boss] || { val: '', support: false }; return <div key={boss} className="flex justify-between gap-2 rounded border border-slate-800 bg-slate-900 px-3 py-2 text-xs"><span className="truncate text-slate-300">{boss}</span><span className="font-bold text-amber-400">{parse.val || '—'}{parse.support ? ' · Support' : ''}</span></div>; })}
                  </div>
                </div>
              </div>
            )}

            {detailType === 'attendance' && (
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-4"><div className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Attendance</div><div className="mt-1 text-3xl font-bold text-cyan-400">{calculateAttendance(selectedPlayer.id)}%</div></div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-4"><div className="text-xs font-bold uppercase tracking-wider text-slate-500">Unnotified Absences</div><div className="mt-1 text-3xl font-bold text-rose-400">{unnotifiedAbsenceCount}</div></div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-4"><div className="text-xs font-bold uppercase tracking-wider text-slate-500">Signup %</div><div className="mt-1 text-3xl font-bold text-emerald-400">{signupPercent}%</div></div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Raid Attendance History</h4>
                      <p className="mt-1 text-xs text-slate-500">{attendedRaidCount} of {attendanceChartEntries.length} raids signed or grouped</p>
                    </div>
                    {attendanceChartEntries.length > 0 && (
                      <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-500" aria-label="Attendance chart legend">
                        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden="true" />Signed / grouped</span>
                        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden="true" />Notified absence</span>
                        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" aria-hidden="true" />Absent / no response</span>
                      </div>
                    )}
                  </div>
                  {attendanceChartEntries.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">No raid history has been recorded yet.</p>
                  ) : (
                    <div className="mt-4 overflow-x-auto pb-1">
                      <div className="flex min-w-max flex-wrap gap-2" role="list" aria-label={`Attendance history for ${selectedPlayer.name}`}>
                        {attendanceChartEntries.map(entry => {
                          const colorClass = entry.status === 'signed' ? 'bg-emerald-400' : entry.status === 'notified_absence' ? 'bg-amber-400' : 'bg-rose-400';
                          const label = entry.status === 'signed' ? 'Signed, benched, or grouped' : entry.status === 'notified_absence' ? 'Notified absence' : entry.status === 'absent' ? 'Absence' : 'No response';
                          return <span key={String(entry.id)} role="listitem" title={`${entry.date || 'Unknown date'}: ${label}`} aria-label={`${entry.date || 'Unknown date'}: ${label}`} className={`h-4 w-4 rounded-full ${colorClass}`} />;
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">Attendance contributes to the score using the current scoring configuration. AFKs on trash recorded in scoring: <span className="font-bold text-red-400">{selectedStats.afks || 0}</span>.</div>
              </div>
            )}

            {detailType === 'bank' && (
              <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950 p-4">
                <div className="mb-3 flex items-center justify-between"><h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Guild Bank Requests</h4><span className="text-sm font-bold text-slate-200">{selectedRequests.reduce((total, request) => total + (Number(request.price) || 0) * (Number(request.quantity) || 0), 0).toLocaleString()}g total</span></div>
                {isLoadingRequests ? <p className="text-sm text-slate-500">Loading requests...</p> : selectedRequests.length === 0 ? <p className="text-sm text-slate-500">No bank requests found.</p> : <div className="space-y-2">{selectedRequests.map(request => <div key={request.id} className="flex justify-between gap-3 rounded border border-slate-800 bg-slate-900 px-3 py-2 text-sm"><span className="text-slate-200">{request.item_name} × {request.quantity}</span><span className="text-right text-xs text-slate-500">{(Number(request.price) || 0) * (Number(request.quantity) || 0)}g · {request.status}</span></div>)}</div>}
              </div>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setEditingPlayer({ ...selectedPlayer, className: getSpecById(selectedPlayer.spec_id)?.class || '', guild_rank: getEditableGuildRank(selectedPlayer) })} className="cursor-pointer rounded-lg bg-cyan-700 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-600">Edit Member</button>
              <button type="button" onClick={() => { handleRemovePlayer(selectedPlayer.id); setSelectedPlayer(null); }} className="rounded-lg bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600">Delete Member</button>
            </div>
          </div>
        </div>
      )}

      {editingPlayer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4" onClick={() => setEditingPlayer(null)}>
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6" onClick={event => event.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-100">Edit Member</h3>
            <div className="mt-4 space-y-3">
              <div><label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Character name</label><input value={editingPlayer.name || ''} onChange={event => setEditingPlayer({ ...editingPlayer, name: event.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Name" /></div>
              <div><label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Class</label><select value={editingPlayer.className || ''} onChange={event => { const nextClass = event.target.value; const firstSpec = (specsFromDb || []).find(spec => spec.class === nextClass); setEditingPlayer({ ...editingPlayer, className: nextClass, spec_id: firstSpec?.id || '' }); }} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Select class</option>{editingClasses.map(className => <option key={className} value={className}>{className}</option>)}</select></div>
              <div><label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Spec</label><select value={editingPlayer.spec_id || ''} onChange={event => setEditingPlayer({ ...editingPlayer, spec_id: event.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Select spec</option>{editingSpecs.map(spec => <option key={spec.id} value={spec.id}>{spec.spec}</option>)}</select></div>
              <div><label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Guild rank</label><select value={editingPlayer.guild_rank || defaultGuildRank} onChange={event => setEditingPlayer({ ...editingPlayer, guild_rank: event.target.value })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">{editingGuildRanks.map(rank => <option key={rank} value={rank}>{rank}</option>)}</select></div>
            </div>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setEditingPlayer(null)} className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300">Cancel</button><button type="button" onClick={saveEdit} className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-slate-950">Save</button></div>
          </div>
        </div>
      )}
    </section>
  );
}
