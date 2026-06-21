import React, { useState } from 'react';
import { postData } from '../services/apiService';

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
  const [selectedPlayerId, setSelectedPlayerId] = useState(roster.length > 0 ? roster[0].id : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Shopping Basket State
  const [basket, setBasket] = useState([]);

  const categories = ['All', 'Gear', 'Materials', 'Consumable', 'Recipe'];

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

  React.useEffect(() => { setSelectedSubCategory('All'); }, [selectedCategory]);

  const filteredBankItems = bankItems.filter(item => {
    if (!item) return false;
    const matchesSearch = item.name.toLowerCase().includes(bankSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || (item.category || 'Other') === selectedCategory;
    const matchesSubCategory = selectedSubCategory === 'All' || (item.sub_type || '') === selectedSubCategory;
    return matchesSearch && matchesCategory && matchesSubCategory;
  });

  const addToBasket = (e) => {
    e.preventDefault();
    const newRequest = {
      id: generateId(),
      player_id: parseInt(selectedPlayerId),
      item_wowhead_id: requestItem.item_wowhead_id,
      item_name: requestItem.name,
      quantity: parseInt(requestQty),
      reason: requestReason
    };
    setBasket([...basket, newRequest]);
    setRequestItem(null);
  };

  const submitBasket = async () => {
    setIsSubmitting(true);
    try {
      await Promise.all(basket.map(req => postData('bank-requests', req)));
      alert(`🎉 Successfully submitted ${basket.length} requests!`);
      setBasket([]);
    } catch (err) {
      console.error(err);
      alert('❌ Server error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  return (
    <section className="bank-tab bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300 space-y-4">
      
      {/* 🛒 Shopping Basket Header */}
      {basket.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-700 p-4 rounded-xl flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-amber-500 font-bold text-sm">🛒 {basket.length} Items in Basket</span>
            <div className="flex gap-2 max-w-lg overflow-x-auto text-xs text-slate-300">
              {basket.map(b => <span key={b.id} className="bg-slate-900 px-2 py-1 rounded border border-slate-800">{b.quantity}x {b.item_name}</span>)}
            </div>
          </div>
          <button onClick={submitBasket} disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-lg transition">
            {isSubmitting ? 'Sending...' : 'Submit All Requests'}
          </button>
        </div>
      )}

      {/* 🔍 Control Bar */}
      <div className="flex flex-col gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${selectedCategory === cat ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-md' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'}`}>
                {cat}
              </button>
            ))}
          </div>
          <input type="text" placeholder="Search vault inventory..." className="w-full xl:w-80 bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none" value={bankSearch} onChange={e => setBankSearch(e.target.value)} />
        </div>
      </div>

      {/* 📦 Items List */}
      <div className="flex flex-wrap gap-2">
        {filteredBankItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 bg-slate-950 border border-slate-800/80 px-3 py-1.5 rounded-xl transition-all h-10">
            <span className="text-xs font-black text-amber-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{item.count || item.quantity || 0}x</span>
            
            {/* Wowhead Linked Item Name */}
            <a
              href={item.item_wowhead_id ? `https://www.wowhead.com/tbc/item=${item.item_wowhead_id}` : `https://www.wowhead.com/tbc/search?q=${encodeURIComponent(item.name)}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-bold text-slate-200 hover:text-purple-400 hover:underline truncate block max-w-[220px]"
            >
              {item.name}
            </a>

            <button onClick={() => { setRequestItem(item); setRequestQty(1); setRequestReason(''); }} className="bg-slate-900 hover:bg-amber-600 hover:text-slate-950 border border-slate-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider transition-all">Add to Basket</button>
          </div>
        ))}
      </div>

      {/* Request Modal */}
      {requestItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Add to Basket: {requestItem.name}</h3>
            <form onSubmit={addToBasket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Character</label>
                <select className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg p-2 text-sm" value={selectedPlayerId} onChange={e => setSelectedPlayerId(e.target.value)}>
                  {roster.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Quantity</label>
                <input type="number" min="1" max={requestItem.count || 100} className="w-full bg-slate-950 text-white border border-slate-700 rounded-lg p-2 text-sm" value={requestQty} onChange={e => setRequestQty(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Reason</label>
                <textarea rows="3" className="w-full bg-slate-950 text-slate-300 border border-slate-700 rounded-lg p-3 text-xs" value={requestReason} onChange={e => setRequestReason(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-amber-600 text-slate-950 font-bold py-2 rounded-lg text-sm">Add to Basket</button>
                <button type="button" onClick={() => setRequestItem(null)} className="bg-slate-800 text-slate-300 font-bold py-2 px-4 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}