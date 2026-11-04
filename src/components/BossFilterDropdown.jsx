import { useMemo, useState } from 'react';

export default function BossFilterDropdown({
  raidZones = [],
  availableBosses = [],
  selectedBosses = null,
  onSelectionChange,
  label = 'Boss Selector'
}) {
  const [open, setOpen] = useState(false);
  const zones = useMemo(() => {
    if (raidZones.length > 0) return raidZones;
    return [{ name: 'Available Bosses', bosses: availableBosses }];
  }, [raidZones, availableBosses]);
  const allBosses = useMemo(
    () => [...new Set(zones.flatMap(zone => Array.isArray(zone?.bosses) ? zone.bosses : []))],
    [zones]
  );
  const selectedSet = selectedBosses === null || selectedBosses === undefined
    ? new Set(allBosses)
    : new Set(selectedBosses);

  const updateSelection = (nextSelection) => {
    onSelectionChange?.([...new Set(nextSelection)].filter(boss => allBosses.includes(boss)));
  };

  const toggleBoss = (bossName, checked) => {
    const nextSelection = new Set(selectedSet);
    if (checked) nextSelection.add(bossName);
    else nextSelection.delete(bossName);
    updateSelection([...nextSelection]);
  };

  const toggleZone = (zoneBosses, checked) => {
    const nextSelection = new Set(selectedSet);
    zoneBosses.forEach(bossName => {
      if (checked) nextSelection.add(bossName);
      else nextSelection.delete(bossName);
    });
    updateSelection([...nextSelection]);
  };

  const clearSelection = () => onSelectionChange?.(null);
  const selectedCount = selectedBosses === null || selectedBosses === undefined
    ? allBosses.length
    : allBosses.filter(bossName => selectedSet.has(bossName)).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        className="bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:border-purple-500 transition"
      >
        {label} ({selectedCount}/{allBosses.length})
        <span className="text-slate-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-20 w-80 max-h-96 overflow-y-auto custom-scrollbar bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-3 space-y-2">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Visible bosses</span>
              <button
                type="button"
                onClick={clearSelection}
                className="text-[10px] font-bold text-amber-300 hover:text-amber-200"
              >
                All
              </button>
            </div>
            {zones.map(zone => {
              const zoneBosses = Array.isArray(zone?.bosses) ? zone.bosses : [];
              const zoneBossesSelected = zoneBosses.filter(boss => selectedSet.has(boss)).length;
              const allSelected = zoneBosses.length > 0 && zoneBossesSelected === zoneBosses.length;
              const someSelected = zoneBossesSelected > 0 && !allSelected;
              return (
                <div key={zone.name} className="border-b border-slate-900 last:border-0 pb-1.5 mb-1.5">
                  <label className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-slate-900/60">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={element => { if (element) element.indeterminate = someSelected; }}
                      onChange={event => toggleZone(zoneBosses, event.target.checked)}
                      className="rounded bg-slate-800 border-slate-600 text-amber-500 w-3.5 h-3.5 cursor-pointer flex-shrink-0"
                    />
                    <span className="text-sm font-bold text-slate-200">{zone.name}</span>
                  </label>
                  <div className="pl-7 space-y-0.5 mt-0.5">
                    {zoneBosses.map(bossName => (
                      <label key={bossName} className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-slate-900/60">
                        <input
                          type="checkbox"
                          checked={selectedSet.has(bossName)}
                          onChange={event => toggleBoss(bossName, event.target.checked)}
                          className="rounded bg-slate-800 border-slate-600 text-amber-500 w-3.5 h-3.5 cursor-pointer flex-shrink-0"
                        />
                        <span className="text-xs text-slate-200">{bossName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
