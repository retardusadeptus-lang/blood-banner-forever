import { P2_BOSSES } from '../constants';

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
  'Prot Paladin': 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_devotionaura.jpg',
  'Holy Paladin': 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_holybolt.jpg',
  'Resto Shaman': 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_magicimmunity.jpg',
  'Balance Druid': 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_starfall.jpg',
  'Resto Druid': 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_healingtouch.jpg',
  'Holy Priest': 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_guardianspirit.jpg',
  'Shadow Priest': 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_shadowwordpain.jpg',
  'Fire Mage': 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_firebolt02.jpg',
  'Frost Mage': 'https://wow.zamimg.com/images/wow/icons/large/spell_frost_frostbolt02.jpg'
};

function getSpecIcon(spec) {
  if (!spec) return UNKNOWN_ICON;
  if (spec.icon_large) return spec.icon_large;
  if (spec.icon_medium) return String(spec.icon_medium).replace('/medium/', '/large/');
  if (spec.icon_small) return String(spec.icon_small).replace('/small/', '/large/');
  return SPEC_ICON_FALLBACKS[spec.spec] || CLASS_ICON_FALLBACKS[String(spec.class || '').trim().toLowerCase()] || UNKNOWN_ICON;
}

export default function ScoringTab({
  roster,
  playerStats,
  expandedPlayerId,
  setExpandedPlayerId,
  getSpecById,
  getDisplayFromId,
  calculateAttendance,
  updatePlayerStat,
  updatePlayerParse,
  updatePlayerManualAdjustment,
  PlayerNameWithScore,
  hasUnsavedChanges,
  onSaveChanges,
  isSaving,
  siteTabMetadata
}) {
  return (
    <section data-site-tab-id={siteTabMetadata?.id} data-site-tab-group={siteTabMetadata?.groupKey} className="theme-panel theme-panel-tab p-6 animate-in fade-in duration-300">
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
      
      {/* Individual Roster Profiles Accordion Grid */}
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Player Performance Profiles</h3>
      <div className="flex flex-col gap-3">
        {roster.map(player => {
          const isExpanded = expandedPlayerId === player.id;
          const stats = playerStats[player.id] || { cons: false, enchants: false, gems: false, afks: 0, parses: {} };
          return (
            <div key={player.id} className="theme-surface rounded-xl overflow-hidden transition-all duration-300">
              <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors" onClick={() => setExpandedPlayerId(isExpanded ? null : player.id)}>
                <div className="flex items-center gap-4">
                  <img src={getSpecIcon(getSpecById(player.spec_id))} alt="" className="w-10 h-10 rounded border border-slate-600 bg-slate-800 object-cover" onError={event => { event.currentTarget.src = UNKNOWN_ICON; }} />
                  <div>
                    <PlayerNameWithScore player={player} />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{getDisplayFromId(player.spec_id)}</span>
                  </div>
                </div>
                <div className="text-slate-500">{isExpanded ? '▲' : '▼'}</div>
              </div>
              
              {/* Profile Expansion Drawer Layout */}
              {isExpanded && (
                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Base Checks</h4>
                      <label className="flex items-center gap-2 mb-2 cursor-pointer"><input type="checkbox" className="rounded bg-slate-800 border-slate-600 text-amber-500 w-4 h-4" checked={stats.cons} onChange={(e) => updatePlayerStat(player.id, 'cons', e.target.checked)} /><span className="text-sm font-semibold text-slate-300">Full Consumables</span></label>
                      <label className="flex items-center gap-2 mb-2 cursor-pointer"><input type="checkbox" className="rounded bg-slate-800 border-slate-600 text-amber-500 w-4 h-4" checked={stats.enchants} onChange={(e) => updatePlayerStat(player.id, 'enchants', e.target.checked)} /><span className="text-sm font-semibold text-slate-300">Fully Enchanted</span></label>
                      <label className="flex items-center gap-2 mb-4 cursor-pointer"><input type="checkbox" className="rounded bg-slate-800 border-slate-600 text-amber-500 w-4 h-4" checked={stats.gems} onChange={(e) => updatePlayerStat(player.id, 'gems', e.target.checked)} /><span className="text-sm font-semibold text-slate-300">Fully Gemmed</span></label>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex gap-4">
                        <div className="flex-1">
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Attendance %</label>
                          <div className="bg-slate-900 text-amber-400 font-bold border border-slate-700 rounded p-2 text-center text-xl shadow-inner">{calculateAttendance(player.id)}%</div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] uppercase font-bold text-red-500 mb-1">AFKs on Trash</label>
                          <input type="number" min="0" className="w-full bg-slate-900 text-red-400 font-bold border border-red-900 rounded p-2 text-center text-xl shadow-inner focus:outline-none" value={stats.afks || 0} onChange={(e) => updatePlayerStat(player.id, 'afks', parseInt(e.target.value) || 0)} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:col-span-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Officer Score Adjustments</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-2">Manual Point Adjustment</label>
                          <input
                            type="number"
                            step="0.5"
                            className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 text-sm focus:outline-none"
                            value={stats.manualAdjustment?.value || 0}
                            onChange={(e) => updatePlayerManualAdjustment(player.id, 'value', parseFloat(e.target.value) || 0)}
                            placeholder="e.g. +5 or -3"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-2">Reason/Note (Optional)</label>
                          <input
                            type="text"
                            className="w-full bg-slate-900 text-white border border-slate-700 rounded p-2 text-sm focus:outline-none"
                            value={stats.manualAdjustment?.note || ''}
                            onChange={(e) => updatePlayerManualAdjustment(player.id, 'note', e.target.value)}
                            placeholder="e.g. Exceptional effort, Helping alts"
                            maxLength="50"
                          />
                        </div>
                      </div>
                      
                      {stats.manualAdjustment?.value !== 0 && stats.manualAdjustment?.value !== undefined && (
                        <div className={`p-2 rounded text-xs font-semibold mb-4 ${stats.manualAdjustment.value > 0 ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                          {stats.manualAdjustment.value > 0 ? '+' : ''}{stats.manualAdjustment.value} point{Math.abs(stats.manualAdjustment.value) !== 1 ? 's' : ''}{stats.manualAdjustment.note && ` — ${stats.manualAdjustment.note}`}
                        </div>
                      )}
                      
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-6 mb-3">Phase 2 Parse Logs</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                        {P2_BOSSES.map(boss => {
                          const pData = stats.parses?.[boss] || { val: '', support: false };
                          return (
                            <div key={boss} className="flex flex-col bg-slate-900 p-2 rounded border border-slate-800/80">
                              <span className="text-xs font-bold text-amber-500/80 mb-1 truncate">{boss}</span>
                              <div className="flex items-center gap-2">
                                <input type="number" placeholder="Parse" min="0" max="100" className="w-16 bg-slate-950 text-white border border-slate-700 rounded p-1 text-sm focus:outline-none" value={pData.val} onChange={(e) => updatePlayerParse(player.id, boss, 'val', e.target.value)} />
                                <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" className="rounded bg-slate-800 border-slate-600 text-purple-500 w-3.5 h-3.5" checked={pData.support} onChange={(e) => updatePlayerParse(player.id, boss, 'support', e.target.checked)} /><span className="text-[10px] font-semibold text-purple-400 uppercase">Support Role</span></label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}