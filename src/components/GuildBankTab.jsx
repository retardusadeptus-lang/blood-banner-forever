import React, { useState } from 'react';

export default function GuildBankTab({
  bankItems,
  bankSearch,
  setBankSearch,
  isAuthenticated,
  roster
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');
  const [requestItem, setRequestItem] = useState(null);
  const [requestQty, setRequestQty] = useState(1);
  const [requestReason, setRequestReason] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['All', 'Gear', 'Materials', 'Consumable', 'Recipe'];

  // 1. Gather distinct sub-categories based *only* on the currently active main category
  const uniqueSubCategories = React.useMemo(() => {
    const subs = new Set();
    bankItems.forEach(item => {
      if (!item) return;
      const itemCat = item.category || 'Other';
      if ((selectedCategory === 'All' || itemCat === selectedCategory) && item.sub_type) {
        subs.add(item.sub_type);
      }
    });
    return ['All', ...Array.from(subs).sort()];
  }, [bankItems, selectedCategory]);

  // Reset the sub-category filter seamlessly if the user swaps the main category tab
  React.useEffect(() => {
    setSelectedSubCategory('All');
  }, [selectedCategory]);

  // 2. Filter items based on search term, category mapping, and sub-category criteria
  const filteredBankItems = bankItems.filter(item => {
    if (!item) return false;
    const matchesSearch = item.name.toLowerCase().includes(bankSearch.toLowerCase());
    
    const itemCat = item.category || 'Other';
    const matchesCategory = selectedCategory === 'All' || itemCat === selectedCategory;
    
    const itemSubCat = item.sub_type || '';
    const matchesSubCategory = selectedSubCategory === 'All' || itemSubCat === selectedSubCategory;
    
    return matchesSearch && matchesCategory && matchesSubCategory;
  });

  const handleOpenRequestModal = (item) => {
    setRequestItem(item);
    setRequestQty(1);
    setRequestReason('');
    if (roster.length > 0) setSelectedPlayerId(roster[0].id);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlayerId || !requestItem) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3001/api/bank-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: parseInt(selectedPlayerId),
          item_wowhead_id: requestItem.item_wowhead_id,
          item_name: requestItem.name,
          quantity: parseInt(requestQty),
          reason: requestReason
        })
      });

      if (response.ok) {
        alert(`🎉 Request submitted successfully!`);
        setRequestItem(null);
      } else {
        alert('❌ Failed to submit request.');
      }
    } catch (err) {
      console.error(err);
      alert('❌ Server error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bank-tab bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300 space-y-4">
      
      {/* 🔍 Control Bar: Search, Category, and Sub-Category Filters */}
      <div className="flex flex-col gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Main Category Row */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all duration-150 ${
                  selectedCategory === cat
                    ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <input
            type="text"
            placeholder="Search vault inventory..."
            className="w-full xl:w-80 bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
            value={bankSearch}
            onChange={e => setBankSearch(e.target.value)}
          />
        </div>

        {/* Dynamic Secondary Sub-Category Row Selector */}
        {uniqueSubCategories.length > 1 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-900/60 items-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mr-1">Sub-Filter:</span>
            {uniqueSubCategories.map(sub => (
              <button
                key={sub}
                onClick={() => setSelectedSubCategory(sub)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  selectedSubCategory === sub
                    ? 'bg-slate-800 text-amber-400 border border-slate-700'
                    : 'bg-slate-900/40 text-slate-500 border border-transparent hover:text-slate-300'
                }`}
              >
                {sub || 'Uncategorized'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 💳 Dynamic Free-Form Wrap Inline Badges */}
      {filteredBankItems.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-xl">
          <p className="text-slate-500">No items found matching those filters.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {filteredBankItems.map((item, idx) => {
            return (
              <div 
                key={idx} 
                className="flex items-center gap-3 bg-slate-950 border border-slate-800/80 px-3 py-1.5 rounded-xl hover:border-slate-700 transition-all duration-150 shadow-md h-10"
              >
                {/* 1. Number on the left */}
                <span className="text-xs font-black text-amber-400 font-mono select-none bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {item.count || item.quantity || 0}x
                </span>

                {/* 2. Item Name with Wowhead Link hook */}
                <div className="min-w-0">
                  <a
                    href={item.item_wowhead_id ? `https://www.wowhead.com/tbc/item=${item.item_wowhead_id}` : `https://www.wowhead.com/tbc/search?q=${encodeURIComponent(item.name)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-bold text-slate-200 hover:text-purple-400 hover:underline cursor-help truncate block max-w-[220px]"
                    title={item.characters ? `Vault Locations: ${item.characters}` : item.name}
                  >
                    {item.name}
                  </a>
                </div>

                {/* 3. Action Request trigger button pinned cleanly on the right */}
                <button
                  onClick={() => handleOpenRequestModal(item)}
                  className="bg-slate-900 hover:bg-amber-600 hover:text-slate-950 border border-slate-800 hover:border-amber-500 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider text-slate-400 transition-all duration-100 flex-shrink-0"
                >
                  Request
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Overlay Component Layer */}
      {requestItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Submit Bank Request</h3>
              <p className="text-xs text-slate-400 mt-1">Requesting: <span className="text-purple-400 font-bold">{requestItem.name}</span></p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Select Character</label>
                <select 
                  required
                  className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg p-2 text-sm focus:outline-none cursor-pointer"
                  value={selectedPlayerId}
                  onChange={e => setSelectedPlayerId(e.target.value)}
                >
                  {roster.map(player => (
                    <option key={player.id} value={player.id}>{player.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Quantity Requested</label>
                <input 
                  type="number" 
                  min="1" 
                  max={requestItem.count || requestItem.quantity || 100}
                  required 
                  className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg p-2 text-sm focus:outline-none"
                  value={requestQty}
                  onChange={e => setRequestQty(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Reason / Intended Use</label>
                <textarea 
                  rows="3"
                  placeholder="e.g. Progression consumables setup"
                  className="w-full bg-slate-950 text-slate-300 border border-slate-700 rounded-lg p-3 text-xs focus:outline-none resize-none"
                  value={requestReason}
                  onChange={e => setRequestReason(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold py-2 px-4 rounded-lg text-sm transition shadow-lg"
                >
                  {isSubmitting ? 'Sending...' : 'Confirm Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setRequestItem(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}