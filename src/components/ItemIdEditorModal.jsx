import { useEffect, useState } from 'react';

export default function ItemIdEditorModal({ open, item, onClose, onSave }) {
  const [value, setValue] = useState(item?.wowheadIdInput || '');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(item?.wowheadIdInput || '');
  }, [item]);

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-slate-100 mb-2">Edit Wowhead ID</h3>
        <p className="text-xs text-slate-500 mb-4">{item.itemName}</p>

        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Wowhead Item ID</label>
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="e.g. 32505"
          className="w-full bg-slate-950 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
        />

        <div className="flex gap-2 mt-5 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(item.itemId, value)}
            className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2 px-4 rounded"
          >
            Save ID
          </button>
        </div>
      </div>
    </div>
  );
}
