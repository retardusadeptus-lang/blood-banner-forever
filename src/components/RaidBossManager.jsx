import { useEffect, useRef, useState } from 'react';

export default function RaidBossManager({
  customRaidGroups = [],
  enabledBosses = [],
  handleAddCustomRaidBoss,
  handleAddTrashBefore,
  handleSetBossVisibility,
  handleRenameCustomRaidBoss,
  handleRemoveCustomRaidBoss,
  handleReorderEnabledBoss,
  hasUnsavedChanges,
  onSaveChanges,
  isSaving
}) {
  const [zoneName, setZoneName] = useState('');
  const [bossName, setBossName] = useState('');
  const [draggedBoss, setDraggedBoss] = useState(null);
  const [dragPreviewOrder, setDragPreviewOrder] = useState(null);
  const dragStateRef = useRef({ boss: null, order: null });
  const [editingBoss, setEditingBoss] = useState(null);
  const [editingName, setEditingName] = useState('');
  const bossInfo = new Map(customRaidGroups.flatMap(group => (group.bosses || []).map(boss => [boss, {
    zone: group.zone,
    isTrash: group.bossMeta?.[boss]?.isTrash ?? boss.startsWith('Trash before '),
    isPublic: group.bossMeta?.[boss]?.isPublic !== false
  }])));
  const getBossInfo = (boss) => bossInfo.get(boss) || {
    zone: 'Built-in',
    isTrash: boss.startsWith('Trash before '),
    isPublic: true
  };
  const renderedBosses = [...enabledBosses, ...customRaidGroups.flatMap(group => group.bosses || []).filter(boss => !enabledBosses.includes(boss))];

  const previewDropOrder = (sourceBoss, targetBoss) => {
    if (!sourceBoss || !targetBoss || sourceBoss === targetBoss) return;
    const next = [...(dragStateRef.current.order || enabledBosses)];
    const sourceIndex = next.indexOf(sourceBoss);
    const targetIndex = next.indexOf(targetBoss);
    if (sourceIndex === -1 || targetIndex === -1) return;
    next.splice(sourceIndex, 1);
    next.splice(next.indexOf(targetBoss), 0, sourceBoss);
    dragStateRef.current.order = next;
    setDragPreviewOrder(next);
    if (next.some((boss, index) => boss !== enabledBosses[index])) {
      handleReorderEnabledBoss?.(next);
    }
  };

  const addBoss = () => {
    if (!zoneName.trim() || !bossName.trim()) return;
    handleAddCustomRaidBoss?.(zoneName, bossName);
    setBossName('');
  };

  const beginEditing = (boss) => {
    setEditingBoss(boss);
    setEditingName(boss);
  };

  const commitEditing = (boss) => {
    const info = bossInfo.get(boss);
    if (info && editingName.trim()) handleRenameCustomRaidBoss?.(info.zone, boss, editingName);
    setEditingBoss(null);
  };

  useEffect(() => {
    const finishDrag = () => {
      const current = dragStateRef.current;
      if (!current.boss) return;
      if (current.moved && current.order) handleReorderEnabledBoss?.(current.order);
      dragStateRef.current = { boss: null, order: null, moved: false };
      setDraggedBoss(null);
      setDragPreviewOrder(null);
    };
    document.addEventListener('pointerup', finishDrag);
    document.addEventListener('pointercancel', finishDrag);
    return () => {
      document.removeEventListener('pointerup', finishDrag);
      document.removeEventListener('pointercancel', finishDrag);
    };
  }, [handleReorderEnabledBoss]);

  return (
    <div className="theme-panel theme-panel-tab w-full p-6 space-y-4 animate-in fade-in duration-300">
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-inner">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-xl font-bold text-slate-100">Manage Bosses</h2>
          <p className="text-sm text-slate-400">Create the raid zones and encounters used by the boss selector.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input type="text" value={zoneName} onChange={event => setZoneName(event.target.value)} placeholder="Raid / Zone" className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none sm:w-56" />
          <input type="text" value={bossName} onChange={event => setBossName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addBoss(); } }} placeholder="Boss name" className="flex-1 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none" />
          <button type="button" onClick={addBoss} className="rounded bg-amber-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-amber-500">Add Boss</button>
        </div>

        {customRaidGroups.length > 0 ? (
          <div className="mt-4 space-y-3">
            {customRaidGroups.map(group => (
              <div key={group.zone} className="rounded border border-slate-800 bg-slate-900/70 p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-400">{group.zone}</p>
                <div className="flex flex-wrap gap-2">
                  {(group.bosses || []).map(boss => (
                    <span key={`${group.zone}-${boss}`} className="inline-flex items-center gap-2 rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-300">
                      {boss}
                      <button type="button" onClick={() => handleRemoveCustomRaidBoss?.(group.zone, boss)} className="font-bold text-red-400 hover:text-red-300" title={`Remove ${boss}`}>x</button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-xs italic text-slate-500">No raid zones or bosses have been created yet.</p>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-inner">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Selected Boss Order</h3>
          <button type="button" onClick={onSaveChanges} disabled={!hasUnsavedChanges || isSaving} className={`rounded px-3 py-2 text-xs font-bold uppercase tracking-wider ${hasUnsavedChanges ? 'bg-amber-600 text-slate-950 hover:bg-amber-500' : 'cursor-not-allowed bg-slate-800 text-slate-500'}`}>
            {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
          </button>
        </div>
        {renderedBosses.length === 0 ? (
          <p className="text-xs italic text-slate-500">Add bosses above, then select them in the raid boss selector.</p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="hidden grid-cols-[2rem_7rem_minmax(12rem,1fr)_6rem_9rem_8rem_5rem] gap-3 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 lg:grid">
              <span aria-hidden="true" /><span>Zone</span><span>Boss</span><span>Type</span><span>Trash / Boss</span><span>Visibility</span><span>Order</span>
            </div>
            {renderedBosses.map((boss, index) => {
              const previewIndex = dragPreviewOrder?.indexOf(boss);
              const visualIndex = previewIndex >= 0 ? previewIndex : index;
              return (
                <div
                  key={boss}
                  style={{ order: visualIndex }}
                  data-boss-card={boss}
                  onPointerDown={event => {
                    if (!enabledBosses.includes(boss) || event.target.closest('button, select, input')) return;
                    dragStateRef.current = { boss, order: [...enabledBosses], moved: false };
                    setDraggedBoss(boss);
                    setDragPreviewOrder([...enabledBosses]);
                  }}
                  onPointerMove={event => {
                    const sourceBoss = dragStateRef.current.boss;
                    if (!sourceBoss || !enabledBosses.includes(boss)) return;
                    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-boss-card]')?.getAttribute('data-boss-card');
                    if (target && enabledBosses.includes(target) && target !== sourceBoss) {
                      dragStateRef.current.moved = true;
                      previewDropOrder(sourceBoss, target);
                    }
                  }}
                  className={`grid grid-cols-1 items-center gap-3 rounded-lg border bg-slate-900/70 px-3 py-2 touch-none select-none transition-transform lg:grid-cols-[2rem_7rem_minmax(12rem,1fr)_6rem_9rem_8rem_5rem] ${draggedBoss === boss ? 'border-amber-500 opacity-60' : 'border-slate-800'} ${draggedBoss && draggedBoss !== boss && enabledBosses.includes(boss) ? 'border-dashed border-amber-500/60' : ''} ${enabledBosses.includes(boss) ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                  <span role="img" aria-label="Drag to reorder" title="Drag to reorder" className="inline-grid grid-cols-[4px_4px] grid-rows-[4px_4px_4px] justify-self-start gap-[3px] text-slate-500">
                    {[0, 1, 2, 3, 4, 5].map(dotIndex => <span key={dotIndex} className="block h-1 w-1 shrink-0 rounded-full bg-current" />)}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">{bossInfo.get(boss)?.zone || 'Built-in'}</span>
                  <div className="min-w-0">
                    {editingBoss === boss ? (
                      <input autoFocus value={editingName} onChange={event => setEditingName(event.target.value)} onBlur={() => commitEditing(boss)} onKeyDown={event => { if (event.key === 'Enter') commitEditing(boss); if (event.key === 'Escape') setEditingBoss(null); }} className="w-full rounded border border-amber-500 bg-slate-950 px-2 py-1 text-sm font-bold text-slate-200 focus:outline-none" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="truncate text-sm font-bold text-slate-200">{boss}</div>
                        {bossInfo.has(boss) && <button type="button" onClick={() => beginEditing(boss)} aria-label={`Edit ${boss}`} title="Edit name" className="shrink-0 text-amber-400 hover:text-amber-300">Edit</button>}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 lg:hidden">{getBossInfo(boss).isTrash ? 'Trash' : 'Boss'} · {getBossInfo(boss).isPublic ? 'Public' : 'Hidden'}</div>
                  </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${getBossInfo(boss).isTrash ? 'text-orange-400' : 'text-cyan-400'}`}>{getBossInfo(boss).isTrash ? 'Trash' : 'Boss'}</span>
                  <button type="button" onClick={() => handleAddTrashBefore?.(boss)} disabled={!bossInfo.has(boss) || bossInfo.get(boss)?.isTrash} className="rounded border border-slate-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-30">Add Trash Before</button>
                    <select value={getBossInfo(boss).isPublic ? 'public' : 'hidden'} onChange={event => handleSetBossVisibility?.(getBossInfo(boss).zone, boss, event.target.value === 'public')} disabled={!bossInfo.has(boss)} className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 disabled:opacity-50">
                    <option value="public">Public</option>
                    <option value="hidden">Hidden</option>
                  </select>
                  <div className="flex items-center gap-1 lg:justify-end"><span className="mr-1 text-[10px] font-bold text-slate-500">{visualIndex + 1}</span></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
