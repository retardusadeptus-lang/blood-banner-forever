import { useState } from 'react';

const ASSIGNMENT_META_KEYS = new Set(['awardedPlayerIds', 'awardedPlayerId', 'assignedAt']);
const UNKNOWN_ICON = 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg';
const CLASS_ICON_FALLBACKS = {
  druid: 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_healingtouch.jpg',
  hunter: 'https://wow.zamimg.com/images/wow/icons/large/ability_hunter_beasttaming.jpg',
  mage: 'https://wow.zamimg.com/images/wow/icons/large/spell_frost_frostbolt02.jpg',
  paladin: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_holybolt.jpg',
  priest: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_guardianspirit.jpg',
  rogue: 'https://wow.zamimg.com/images/wow/icons/large/ability_backstab.jpg',
  shaman: 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_lightning.jpg',
  warlock: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_deathcoil.jpg',
  warrior: 'https://wow.zamimg.com/images/wow/icons/large/inv_shield_06.jpg'
};
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
const CLASS_COLORS = {
  druid: '#FF7D0A',
  hunter: '#ABD473',
  mage: '#69CCF0',
  paladin: '#F58CBA',
  priest: '#FFFFFF',
  rogue: '#FFF569',
  shaman: '#0070DE',
  warlock: '#8788EE',
  warrior: '#C79C6E'
};

function getPlayerClass(player, getSpecById) {
  const directClass = player?.class || player?.className || player?.playerClass;
  const specClass = getSpecById?.(player?.spec_id)?.class;
  return String(directClass || specClass || '').trim();
}

function getClassColor(player, getSpecById) {
  return CLASS_COLORS[getPlayerClass(player, getSpecById).toLowerCase()] || '#CBD5E1';
}

function getPlayerSpec(player, getSpecById) {
  return getSpecById?.(player?.spec_id);
}

function getSpecIcon(spec) {
  if (!spec) return UNKNOWN_ICON;
  if (spec.icon_large) return spec.icon_large;
  if (spec.icon_medium) return String(spec.icon_medium).replace('/medium/', '/large/');
  if (spec.icon_small) return String(spec.icon_small).replace('/small/', '/large/');
  return SPEC_ICON_FALLBACKS[spec.spec] || CLASS_ICON_FALLBACKS[String(spec.class || '').trim().toLowerCase()] || UNKNOWN_ICON;
}

export default function AssignedLootOverview({ assignments, mutableItems, normalizeAwardedPlayerIds = assignmentData => {
  if (Array.isArray(assignmentData?.awardedPlayerIds)) return assignmentData.awardedPlayerIds;
  return assignmentData?.awardedPlayerId === undefined ? [] : [assignmentData.awardedPlayerId];
}, renderItemLink, roster, getSpecById, onOpenItemAssignment, isAuthenticated }) {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [columnFilters, setColumnFilters] = useState({ itemName: '', playerName: '', specName: '', priority: '', status: '' });

  const playerById = new Map((roster || []).map(player => [String(player.id), player]));
  const itemByName = new Map((mutableItems || []).map(item => [item.name, item]));
  const rows = Object.entries(assignments || {}).flatMap(([itemName, playerMap]) => {
    const awardedPlayerIds = normalizeAwardedPlayerIds(playerMap).map(id => String(id));
    const rankedEntries = Object.entries(playerMap || {}).filter(([key]) => !ASSIGNMENT_META_KEYS.has(key));
    const playerIds = new Set([...rankedEntries.map(([playerId]) => String(playerId)), ...awardedPlayerIds]);
    return [...playerIds].map(playerId => ({
      itemName,
      itemRecord: itemByName.get(itemName) || { name: itemName },
      player: playerById.get(playerId),
      playerId,
      priority: playerMap?.[playerId],
      awarded: awardedPlayerIds.includes(playerId),
      assignedAt: playerMap?.assignedAt
    }));
  });

  const classOptions = [...new Set(rows.map(row => getPlayerClass(row.player, getSpecById)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const normalizedSearch = search.trim().toLowerCase();
  const filteredRows = rows.filter(row => {
    const playerName = row.player?.name || row.playerId;
    const specName = getPlayerSpec(row.player, getSpecById)?.spec || 'Unknown spec';
    const status = row.awarded ? 'Awarded' : 'Assigned';
    const matchesSearch = !normalizedSearch || `${row.itemName} ${playerName} ${getPlayerClass(row.player, getSpecById)} ${specName}`.toLowerCase().includes(normalizedSearch);
    const matchesColumns = Object.entries({
      itemName: row.itemName,
      playerName,
      specName,
      priority: row.priority ?? '-',
      status
    }).every(([key, value]) => !columnFilters[key] || String(value).toLowerCase().includes(columnFilters[key].toLowerCase()));
    const matchesClass = classFilter === 'all' || getPlayerClass(row.player, getSpecById) === classFilter;
    return matchesSearch && matchesColumns && matchesClass;
  });

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-500">No gear assignments yet.</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="theme-surface flex flex-wrap items-center gap-2 rounded-lg p-3">
        <input
          type="search"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Search items, characters, class, or spec"
          className="theme-field min-w-[220px] flex-1 rounded-lg px-3 py-2 text-sm"
        />
        <select value={classFilter} onChange={event => setClassFilter(event.target.value)} className="theme-field rounded-lg px-3 py-2 text-sm">
          <option value="all">All classes</option>
          {classOptions.map(className => <option key={className} value={className}>{className}</option>)}
        </select>
        <span className="text-xs text-slate-500">{filteredRows.length} of {rows.length} assignments</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="bg-slate-950 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              {[
                ['itemName', 'Item'],
                ['playerName', 'Character'],
                ['specName', 'Spec'],
                ['priority', 'Priority']
              ].map(([key, label]) => (
                <th key={key} className="px-3 py-3">
                  <div className="flex flex-col gap-2">
                    <span>{label}</span>
                    <input
                      type="search"
                      value={columnFilters[key]}
                      onChange={event => setColumnFilters(current => ({ ...current, [key]: event.target.value }))}
                      placeholder="Filter"
                      className="theme-field w-full min-w-[90px] rounded px-2 py-1 text-[10px] font-normal normal-case tracking-normal"
                    />
                  </div>
                </th>
              ))}
              <th className="px-3 py-3">
                <div className="flex flex-col gap-2">
                  <span>Status</span>
                  <select value={columnFilters.status} onChange={event => setColumnFilters(current => ({ ...current, status: event.target.value }))} className="theme-field w-full min-w-[90px] rounded px-2 py-1 text-[10px] font-normal normal-case tracking-normal">
                    <option value="">All</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Awarded">Awarded</option>
                  </select>
                </div>
              </th>
              {isAuthenticated && <th className="px-3 py-3 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/60">
            {filteredRows.map(row => (
              <tr key={`${row.itemName}-${row.playerId}`} className="hover:bg-slate-800/40">
                <td className="max-w-[280px] px-3 py-3 font-semibold text-slate-200">{renderItemLink(row.itemRecord)}</td>
                <td className="px-3 py-3 font-semibold" style={{ color: getClassColor(row.player, getSpecById) }}>{row.player?.name || row.playerId}</td>
                <td className="px-3 py-3 text-slate-300">
                  <span className="flex items-center gap-2">
                    <img src={getSpecIcon(getPlayerSpec(row.player, getSpecById))} alt="" className="h-5 w-5 shrink-0 rounded border border-slate-700 object-cover" />
                    <span>{getPlayerSpec(row.player, getSpecById)?.spec || 'Unknown spec'}</span>
                  </span>
                </td>
                <td className="px-3 py-3 font-bold text-amber-400">{row.priority ?? '-'}</td>
                <td className="px-3 py-3">
                  <span className={row.awarded ? 'text-emerald-400' : 'text-slate-400'}>{row.awarded ? 'Awarded' : 'Assigned'}</span>
                </td>
                {isAuthenticated && (
                  <td className="px-3 py-3 text-right">
                    <button type="button" onClick={() => onOpenItemAssignment?.(row.itemName)} className="text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300">Edit</button>
                  </td>
                )}
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr><td colSpan={isAuthenticated ? 6 : 5} className="px-3 py-8 text-center text-slate-500">No assignments match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-slate-500">Showing {filteredRows.length} of {rows.length} assignments</div>
    </div>
  );
}
