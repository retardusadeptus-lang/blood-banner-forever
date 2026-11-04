import { useMemo, useState } from 'react';

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

function getSpecIcon(specData) {
  if (!specData) return UNKNOWN_ICON;
  return specData.icon_large || specData.icon_medium || specData.icon_small || SPEC_ICON_FALLBACKS[specData.spec] || UNKNOWN_ICON;
}

export default function RosterTab({
  handleAddPlayer,
  newName,
  setNewName,
  newSpec,
  setNewSpec,
  specsFromDb,
  setAllRaidStatus,
  roster,
  getSpecById,
  toggleRaidStatus,
  handleUpdatePlayer,
  handleRemovePlayer,
  importedRaidHelperPlayerIds,
  importedRaidHelperSpecConflictIds,
  PlayerNameWithScore,
  hasUnsavedChanges,
  onSaveChanges,
  isSaving
}) {
  const [editingPlayer, setEditingPlayer] = useState(null);

  const importedIds = useMemo(() => new Set((importedRaidHelperPlayerIds || []).map(Number)), [importedRaidHelperPlayerIds]);
  const conflictIds = useMemo(() => new Set((importedRaidHelperSpecConflictIds || []).map(Number)), [importedRaidHelperSpecConflictIds]);

  return (
    <section className="theme-panel theme-panel-tab p-6 animate-in fade-in duration-300">
      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSaveChanges}
            disabled={!hasUnsavedChanges || isSaving}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${hasUnsavedChanges ? 'bg-amber-600 hover:bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
          >
            {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
          </button>
        </div>
      </div>

      {/* Roster Form Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner">
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">Master Guild Roster</h2>
          <p className="text-sm text-slate-500">Toggle players "In Raid" to include them in the Loot Council & Attendance logging.</p>
        </div>
        <form onSubmit={handleAddPlayer} className="flex flex-wrap items-center gap-3">
          <input type="text" placeholder="Player Name" className="bg-slate-900 text-white placeholder-slate-500 border border-slate-700 rounded-lg px-4 py-2.5 w-full sm:w-auto focus:outline-none" value={newName} onChange={e => setNewName(e.target.value)} />
          <select className="bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 w-full sm:w-auto focus:outline-none cursor-pointer" value={newSpec || ''} onChange={e => setNewSpec(parseInt(e.target.value))}>
            <option value="">Select Spec...</option>
            {specsFromDb.map(spec => <option key={spec.id} value={spec.id} style={{ color: spec.color }}>{spec.spec}</option>)}
          </select>
          <button type="submit" className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 py-2.5 rounded-lg transition shadow-lg">Add Member</button>
        </form>
      </div>

      {/* Selection Filters */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Live Raid Setup</h3>
        <div className="flex gap-2">
          <button onClick={() => setAllRaidStatus(true)} className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition">Select All</button>
          <button onClick={() => setAllRaidStatus(false)} className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded transition">Deselect All</button>
        </div>
      </div>

      {/* Roster Grid Elements */}
      {roster.length === 0 ? (
        <p className="text-center text-slate-500 py-12 border-2 border-dashed border-slate-800 rounded-xl">Your guild roster is empty.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
{roster.map(player => {
            const specData = getSpecById(player.spec_id);
            const specDisplay = specData?.spec || '?';
            const iconUrl = getSpecIcon(specData);
            
            return (
              <div 
                key={player.id} 
                className={`group relative flex items-center gap-3 p-3 rounded-lg transition-all duration-200 border cursor-pointer ${
                  importedIds.has(Number(player.id))
                    ? 'bg-cyan-950/20 border-cyan-500/60 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
                    : player.in_raid
                      ? 'bg-slate-800/80 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                      : 'bg-slate-950 border-slate-800 opacity-60 hover:opacity-100'
                }`} 
                onClick={() => toggleRaidStatus(player.id)}
              >
                <div className="relative">
                  <img src={iconUrl} alt="" className="w-10 h-10 rounded border border-slate-700 bg-slate-900 object-cover" />
                  {player.in_raid && (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full w-4 h-4 flex items-center justify-center border-2 border-slate-800">
                      <svg className="w-2.5 h-2.5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* 🔀 Swapped the hardcoded text layers for your master scoreboard component */}
                <div className="flex-1 min-w-0 pointer-events-none">
                  <PlayerNameWithScore player={player} />
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate font-semibold mt-0.5">
                    {specDisplay}
                    {conflictIds.has(Number(player.id)) && <span className="ml-2 text-amber-300">Spec Review</span>}
                  </p>
                </div>

                {importedIds.has(Number(player.id)) && (
                  <span className="absolute top-1 left-1 bg-cyan-600/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">RH</span>
                )}
                
                <button 
                  onClick={(e) => { e.stopPropagation(); handleRemovePlayer(player.id); }} 
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg z-10"
                >
                  ✕
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingPlayer(player); }}
                  className="absolute -bottom-2 -right-2 bg-cyan-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg z-10"
                  title="Edit player"
                >
                  ✎
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Edit Player</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Name</label>
                <input
                  type="text"
                  value={editingPlayer.name}
                  onChange={e => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                  className="w-full bg-slate-950 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Spec / Class</label>
                <select
                  value={editingPlayer.spec_id || ''}
                  onChange={e => setEditingPlayer({ ...editingPlayer, spec_id: Number(e.target.value) })}
                  className="w-full bg-slate-950 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
                >
                  {specsFromDb.map(spec => <option key={spec.id} value={spec.id} style={{ color: spec.color }}>{spec.class} - {spec.spec}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  handleUpdatePlayer(editingPlayer.id, { name: editingPlayer.name.trim(), spec_id: editingPlayer.spec_id });
                  setEditingPlayer(null);
                }}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2 rounded"
              >
                Save
              </button>
              <button onClick={() => setEditingPlayer(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}