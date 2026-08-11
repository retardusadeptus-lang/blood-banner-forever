import React from 'react';
import { LEFT_SLOTS, BOTTOM_SLOTS, PHASES } from '../constants';

export default function BisConfigTab({
  selectedBisSpec,
  setSelectedBisSpec,
  masterItemsDbPhase,
  setMasterItemsDbPhase,
  specsFromDb,
  renderItemSlot,
  specsByName
}) {
  const bisBottomSlots = BOTTOM_SLOTS.filter(slot => slot !== 'Main Hand');

  const classColorFallbackByClass = {
    Druid: '#FF7D0A',
    Hunter: '#ABD473',
    Mage: '#69CCF0',
    Paladin: '#F58CBA',
    Priest: '#FFFFFF',
    Rogue: '#FFF569',
    Shaman: '#0070DE',
    Warlock: '#9482C9',
    Warrior: '#C79C6E'
  };

  const isNeutralDefaultColor = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized === '#e2e8f0' || normalized === '#e2e8f0ff' || normalized === 'rgb(226, 232, 240)';
  };

  const resolveSpecColor = (spec) => {
    if (!spec) return '#FFFFFF';
    const className = String(spec.class || '').trim();
    if (className && classColorFallbackByClass[className]) {
      return classColorFallbackByClass[className];
    }

    const byName = specsByName?.[spec.spec]?.color;
    if (byName && !isNeutralDefaultColor(byName)) return byName;

    if (spec.color && !isNeutralDefaultColor(spec.color)) return spec.color;
    return '#FFFFFF';
  };
  
  const rightLayoutSlots = ['Hands', 'Waist', 'Legs', 'Feet', 'Rings', 'Trinkets'];

  // Quick lookup helper to grab the large icon profile for the spec background art
  const currentSpecObj = specsFromDb.find(s => s.spec === selectedBisSpec);
  const selectedSpecColor = currentSpecObj
    ? resolveSpecColor(currentSpecObj)
    : (specsByName?.[selectedBisSpec]?.color || '#FFFFFF');

  return (
    <section className="bis-tab bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300">            
      
      {/* Control Selector Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner">
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">Class Configuration Viewer</h2>
          <p className="text-sm text-slate-500">View primary BiS and alternate options mapped to the paper doll interface.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Phase:</span>
            <select
              className="bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 min-w-[120px] focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer font-bold text-sm"
              value={masterItemsDbPhase}
              onChange={e => setMasterItemsDbPhase(e.target.value)}
            >
              {PHASES.map(phase => <option key={phase} value={phase}>{phase}</option>)}
            </select>
          </div>
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select Spec:</span>
          <select 
            className="bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 min-w-[200px] focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer font-bold text-sm" 
            value={selectedBisSpec || ''} 
            onChange={e => setSelectedBisSpec(e.target.value)} 
            style={{ color: selectedSpecColor }}
          >
            {specsFromDb.map(spec => (
              <option key={spec.id} value={spec.spec} style={{ color: resolveSpecColor(spec) }}>
                {spec.spec}
              </option>
            ))}
          </select>
        </div>
      </div>

      <style>{`
        .bis-tab .character-slot-icon .iconlarge {
          margin-top: -15px !important;
          margin-left: -15px !important;
        }
      `}</style>

      {/* Visual Character Sheet Paper Doll Grid Container */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 lg:p-10 shadow-2xl relative overflow-hidden">
        
        {/* Shadowed Spec Crest Silhouette in Background Layer */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
          <img 
            src={currentSpecObj?.icon_large || 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg'} 
            alt="" 
            className="w-96 h-96 object-cover filter grayscale blur-sm" 
          />
        </div>
        
        {/* Core Layout Columns */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-6 max-w-5xl mx-auto">
          <div className="flex flex-col gap-4">
            {LEFT_SLOTS.map(slot => renderItemSlot(slot))}
          </div>
          <div className="flex flex-col gap-4">
            {rightLayoutSlots.map(slot => renderItemSlot(slot))}
          </div>
          <div className="lg:col-span-2 pt-6 mt-2 border-t border-slate-800/80">
            <div className="flex flex-wrap gap-4">
              {bisBottomSlots.map(slot => renderItemSlot(slot))
                .filter(Boolean)
                .map((slot, i) => <div key={i} className="flex-1 min-w-[160px]">{slot}</div>)
              }
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}