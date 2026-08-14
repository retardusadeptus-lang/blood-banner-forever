import React, { useState } from 'react';
import { normalizeSlotKey } from '../utils/helpers';

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

function resolveSpecIcon(specObj, specDisplay) {
  if (specObj?.icon_large) return specObj.icon_large;
  if (specObj?.icon_medium) return String(specObj.icon_medium).replace('/medium/', '/large/');
  if (specObj?.icon_small) return String(specObj.icon_small).replace('/small/', '/large/');
  if (SPEC_ICON_FALLBACKS[String(specDisplay || '')]) return SPEC_ICON_FALLBACKS[String(specDisplay || '')];
  const classKey = String(specObj?.class || '').trim().toLowerCase();
  if (CLASS_ICON_FALLBACKS[classKey]) return CLASS_ICON_FALLBACKS[classKey];
  return UNKNOWN_ICON;
}

export default function LootCouncilTab({
  searchQuery,
  setSearchQuery,
  filterZone,
  setFilterZone,
  uniqueZones,
  filterBoss,
  setFilterBoss,
  uniqueBosses,
  filterSlot,
  setFilterSlot,
  filterCategory,
  setFilterCategory,
  uniqueSlots,
  selectedItemName,
  setSelectedItemName,
  filteredItems,
  selectedItem,
  sortedEligiblePlayers,
  getDisplayFromId,
  getSlugFromDisplay,
  bisPriorities,
  globalPhase,
  assignments,
  mutableItems,
  getPlayerItemPriorityStatus,
  getSpecById,
  getRankBadgeStyle,
  renderItemLink,
  handleSetPriority,
  PlayerNameWithScore,
  hasUnsavedChanges,
  onSaveChanges,
  onClearItemAssignments,
  onToggleAwardedPriority,
  isSaving
}) {
  const [limitBosses, setLimitBosses] = useState(true);
  const [maxBossOptions, setMaxBossOptions] = useState(50);
  
  const currentItemAssignments = selectedItem ? (assignments[selectedItem.name] || {}) : {};
  
  // Limit boss options if toggle is enabled
  const displayedBosses = limitBosses ? uniqueBosses.slice(0, maxBossOptions) : uniqueBosses;

  return (
    <section className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300">
      <div className="flex justify-end mb-4 gap-2">
        <button
          type="button"
          onClick={() => onClearItemAssignments?.(selectedItemName)}
          disabled={!selectedItemName}
          className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition bg-red-900/60 hover:bg-red-800 text-red-300"
        >
          Clear All Assignments
        </button>
        <button
          type="button"
          onClick={onSaveChanges}
          disabled={!hasUnsavedChanges || isSaving}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${hasUnsavedChanges ? 'bg-amber-600 hover:bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
        >
          {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
        </button>
      </div>

      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 mb-8 shadow-inner">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Item Database Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Search Name</label>
            <input type="text" className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Filter Zone</label>
            <select className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none" value={filterZone} onChange={e => setFilterZone(e.target.value)}>
              <option value="">All Zones</option>
              {uniqueZones.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Filter Boss ({displayedBosses.length}/{uniqueBosses.length})</label>
            <select className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none truncate" value={filterBoss} onChange={e => setFilterBoss(e.target.value)}>
              <option value="">All Bosses</option>
              {displayedBosses.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Filter Slot</label>
            <select className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none" value={filterSlot} onChange={e => setFilterSlot(e.target.value)}>
              <option value="">All Slots</option>
              {uniqueSlots.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Filter Category</label>
            <select className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option value="token">Tokens / Quest Tokens</option>
              <option value="item">Regular Items</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mb-5 p-3 bg-slate-900 rounded-lg border border-slate-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={limitBosses}
              onChange={e => setLimitBosses(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 cursor-pointer accent-purple-500"
            />
            <span className="text-xs font-semibold text-slate-300">Limit Boss Options</span>
          </label>
          {limitBosses && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-400">Max Options:</label>
              <input
                type="number"
                min="5"
                max={uniqueBosses.length}
                value={maxBossOptions}
                onChange={e => setMaxBossOptions(Math.min(Math.max(5, parseInt(e.target.value) || 50), uniqueBosses.length))}
                className="w-16 bg-slate-800 text-white border border-slate-600 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          )}
          <span className="text-xs text-slate-500 ml-auto">Total items in database: {mutableItems.length}</span>
        </div>
        <div>
          <select className="w-full bg-slate-900 text-purple-400 font-bold border border-slate-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer" value={selectedItemName} onChange={e => setSelectedItemName(e.target.value)}>
            <option value="" className="text-slate-500">-- Select Dropped Item ({filteredItems.length} matches) --</option>
            {filteredItems.map(item => <option key={item.name} value={item.name} className="text-purple-400">{item.name}</option>)}
          </select>
        </div>
      </div>

      {selectedItem ? (
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-6 border-b border-slate-800">
            <h3 className="text-3xl font-bold text-purple-400 drop-shadow-md mb-2">
              {renderItemLink(selectedItem)}
            </h3>
            <div className="flex gap-4 text-sm font-semibold text-slate-300 flex-wrap">
              <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">{selectedItem.slot}</span>
              <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">{selectedItem.zone}</span>
              {selectedItem.is_token && (
                <span className="bg-amber-900/40 px-3 py-1 rounded-full border border-amber-700/60 text-amber-300">{selectedItem.is_quest ? 'Quest Token' : 'Tier Token'}</span>
              )}
              {selectedItem.is_token && selectedItem.token_group && (
                <span className="bg-amber-900/20 px-3 py-1 rounded-full border border-amber-700/40 text-amber-400">{selectedItem.token_group}</span>
              )}
              {selectedItem.drop_chance && (
                <span className="bg-cyan-900/30 px-3 py-1 rounded-full border border-cyan-700/50 text-cyan-400">{(selectedItem.drop_chance * 100).toFixed(0)}% Drop Chance</span>
              )}
            </div>
          </div>

          <div className="p-6">
            <h4 className="text-sm font-bold mb-4 text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">Council Priority Queue</h4>
            {sortedEligiblePlayers.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-800"><p className="text-slate-400 font-medium text-sm">None of your active raiders need this item.</p></div>
            ) : (
              <div className="flex flex-col gap-3">
                {sortedEligiblePlayers.map(player => {
                  const specDisplay = getDisplayFromId(player.spec_id) || '?';
                  const specKey = getSlugFromDisplay(specDisplay);
                  const specObj = getSpecById(player.spec_id);
                  const specIcon = resolveSpecIcon(specObj, specDisplay);
                  const status = getPlayerItemPriorityStatus(selectedItem, specDisplay) || (selectedItem.spec === specKey ? 'BiS' : '');
                  const currentPriority = currentItemAssignments[player.id];
                  const awardedPlayerIds = Array.isArray(currentItemAssignments.awardedPlayerIds)
                    ? currentItemAssignments.awardedPlayerIds.map(id => String(id))
                    : (currentItemAssignments.awardedPlayerId ? [String(currentItemAssignments.awardedPlayerId)] : []);
                  const isAwardedPlayer = awardedPlayerIds.includes(String(player.id));
                  const PHASE_ORDER = ["PRE-BIS", "T4", "T5", "T6", "ZA", "SWP"];
                  const currentPhaseIndex = PHASE_ORDER.indexOf(String(globalPhase || '').toUpperCase());
                  const selectedNormalizedSlot = normalizeSlotKey(selectedItem.slot);

                  const playerAlts = selectedItem.is_token ? [] : mutableItems.filter(i => {
                    if (i.name === selectedItem.name) return false;
                    if (normalizeSlotKey(i.slot) !== selectedNormalizedSlot) return false;

                    const altItemKey = `${i.name}|${specDisplay}`;
                    const altBisPriority = bisPriorities[altItemKey];
                    const altEligibilityStatus = i?.eligible?.[specDisplay] || '';
                    const hasSpecMatch = i.spec && specKey && String(i.spec) === String(specKey);
                    const altStatus = altBisPriority || altEligibilityStatus || (hasSpecMatch ? 'BiS' : '');
                    if (!altStatus) return false;

                    // Only show alternates from the current phase or earlier.
                    // i.phase is expected to be a single string ("T5"). If it's
                    // an array or anything else non-string, we can't trust it
                    // represents a real phase, so exclude rather than guess.
                    if (i.phase) {
                      if (typeof i.phase !== 'string') return false;
                      const itemPhaseIndex = PHASE_ORDER.indexOf(String(i.phase || '').toUpperCase());
                      if (itemPhaseIndex === -1) return false; // unrecognized phase tag, exclude
                      if (currentPhaseIndex !== -1 && itemPhaseIndex > currentPhaseIndex) return false;
                    }
                    return true;
                  }).map(i => {
                    const altItemKey = `${i.name}|${specDisplay}`;
                    const altBisPriority = bisPriorities[altItemKey];
                    const altEligibilityStatus = i?.eligible?.[specDisplay] || '';
                    const hasSpecMatch = i.spec && specKey && String(i.spec) === String(specKey);
                    return {
                      ...i,
                      eligible: i.eligible || {},
                      _altStatus: altBisPriority || altEligibilityStatus || (hasSpecMatch ? 'BiS' : '')
                    };
                  });

                  return (
                    <div key={player.id} className={`flex flex-col p-4 rounded-xl shadow-sm border transition-all duration-300 ${isAwardedPlayer ? 'bg-emerald-950/30 border-emerald-600/40' : currentPriority === 1 ? 'bg-slate-800/80 border-amber-500/50' : currentPriority === 'Pass' ? 'bg-slate-950/50 border-slate-900 opacity-60' : 'bg-slate-900 border-slate-700'}`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-inner flex-shrink-0 ${isAwardedPlayer ? 'bg-emerald-600 text-white border border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.45)]' : getRankBadgeStyle(currentPriority)}`}>
                            {isAwardedPlayer ? 'A' : (typeof currentPriority === 'number' ? currentPriority : (currentPriority === 'Pass' ? '✕' : '-'))}
                          </div>
                          <img src={specIcon} alt="" className="w-10 h-10 rounded border border-slate-600 bg-slate-800 object-cover flex-shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <PlayerNameWithScore player={player} />
                              {player.in_raid && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider">In Raid</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{specDisplay}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${status === 'BiS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'}`}>{status}</span>
                              {selectedItem.is_token && selectedItem.token_classes && selectedItem.token_classes.includes(specObj?.class) && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400">Token Class</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 overflow-x-auto custom-scrollbar">
                          <span className="text-xs font-semibold text-slate-500 mr-2 ml-1 uppercase tracking-wider whitespace-nowrap">Assign Rank:</span>
                          {[1, 2, 3, 4, 5].map(rank => (
                            <button key={rank} onClick={() => handleSetPriority(player.id, currentPriority === rank ? null : rank)} className={`w-8 h-8 flex-shrink-0 rounded font-bold text-sm transition-all ${currentPriority === rank ? 'bg-purple-600 text-white shadow-[0_0_8px_rgba(147,51,234,0.6)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'}`}>{rank}</button>
                          ))}
                          <div className="w-px h-6 bg-slate-800 mx-1 flex-shrink-0"></div>
                          <button onClick={() => handleSetPriority(player.id, currentPriority === 'Pass' ? null : 'Pass')} className={`px-3 h-8 flex-shrink-0 rounded font-bold text-xs uppercase transition-all ${currentPriority === 'Pass' ? 'bg-red-900/60 text-red-400 border border-red-800' : 'bg-slate-900 text-slate-500 hover:bg-red-950 hover:text-red-400'}`}>Pass</button>
                          <button onClick={() => onToggleAwardedPriority?.(selectedItem.name, player.id)} className={`px-3 h-8 flex-shrink-0 rounded font-bold text-xs uppercase transition-all ${isAwardedPlayer ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                            {isAwardedPlayer ? 'Awarded' : 'Mark Awarded'}
                          </button>
                        </div>
                      </div>

                      {playerAlts.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-800/50">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 block flex items-center gap-1"><span className="text-slate-600">Alternative {selectedItem.slot} Options:</span></span>
                          <div className="flex flex-wrap gap-2">
                            {playerAlts.map(alt => (
                              <span key={alt.name} className={`text-[10px] px-2 py-1 rounded border shadow-sm flex items-center gap-1 ${alt._altStatus === 'BiS' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                                {renderItemLink(alt, "")}
                                <span className="opacity-50 text-[9px]">({alt.boss})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-xl"><p className="text-slate-500 font-medium">Use the filters above and select an item to assign priorities.</p></div>
      )}
    </section>
  );
}