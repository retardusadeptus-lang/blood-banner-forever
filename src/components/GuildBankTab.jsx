import React, { useState } from 'react';
import { postData } from '../services/apiService';

const FALLBACK_BANK_ICON = 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg';

export default function GuildBankTab({
  bankItems,
  bankSearch,
  setBankSearch,
  isAuthenticated,
  roster,
  myPlayerId
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');
  const [requestItem, setRequestItem] = useState(null);
  const [requestQty, setRequestQty] = useState(1);
  const [requestReason, setRequestReason] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState(myPlayerId || (roster.length > 0 ? roster[0].id : ''));
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (myPlayerId) setSelectedPlayerId(myPlayerId);
  }, [myPlayerId]);
  
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

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (window.$WowheadPower && window.$WowheadPower.refreshLinks) {
        window.$WowheadPower.refreshLinks();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [filteredBankItems]);

  const addToBasket = (e) => {
    e.preventDefault();
    const player = roster.find(p => p.id === parseInt(selectedPlayerId));
    const newRequest = {
      id: generateId(),
      player_id: parseInt(selectedPlayerId),
      player_name: player?.name || 'Unknown',
      item_wowhead_id: requestItem.item_wowhead_id,
      item_name: requestItem.name,
      quantity: parseInt(requestQty),
      reason: requestReason
    };
    setBasket([...basket, newRequest]);
    setRequestItem(null);
  };

  const removeFromBasket = (requestId) => {
    setBasket(prev => prev.filter(item => item.id !== requestId));
  };

  const submitBasket = async () => {
    setIsSubmitting(true);
    try {
      await postData('bank-requests', { basket_items: basket });
      alert(`Request submitted to officers (${basket.length} item${basket.length === 1 ? '' : 's'}).`);
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
        <div className="bg-amber-950/30 border border-amber-700 p-4 rounded-xl mb-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-amber-500 font-bold text-sm">🛒 {basket.length} Items in Basket</span>
            <button onClick={submitBasket} disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-lg transition">
              {isSubmitting ? 'Sending...' : 'Submit Basket'}
            </button>
          </div>
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto text-xs text-slate-300 pr-1 custom-scrollbar">
              {basket.map(b => (
                <span key={b.id} className="bg-slate-900 px-2 py-1.5 rounded border border-slate-800 inline-flex items-center gap-2">
                  <span className="text-amber-400 font-bold">{b.quantity}x</span>
                  <span className="flex-1 min-w-0 truncate">{b.item_name}</span>
                  <span className="text-slate-500 truncate">({b.player_name})</span>
                  <button
                    onClick={() => removeFromBasket(b.id)}
                    className="text-slate-400 hover:text-red-400 font-bold leading-none"
                    aria-label={`Remove ${b.item_name} from basket`}
                    title="Remove from basket"
                  >
                    ×
                  </button>
                </span>
              ))}
          </div>
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
        {uniqueSubCategories.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            {uniqueSubCategories.map(sub => (
              <button
                key={sub}
                onClick={() => setSelectedSubCategory(sub)}
                className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border transition-all ${
                  selectedSubCategory === sub
                    ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {sub}
              </button>
            ))}
            <span className="text-xs text-slate-500 ml-auto">{filteredBankItems.length} items</span>
          </div>
        )}
      </div>

      {/* 📦 Items List */}
      <div className="flex flex-wrap gap-1.5">
        {filteredBankItems.map((item, idx) => (
          <div key={`${item.item_wowhead_id || 'no-id'}-${item.name || 'unknown'}-${idx}`} className="bank-item-icon group relative h-[66px] w-[66px] overflow-hidden rounded-md border border-slate-800/80 bg-slate-900 shadow-[0_4px_10px_rgba(0,0,0,0.22)] transition-all hover:-translate-y-0.5 hover:border-amber-600/60 hover:shadow-[0_8px_14px_rgba(0,0,0,0.3)]">
            {item.item_wowhead_id ? (
              <a
                href={`https://www.wowhead.com/tbc/item=${item.item_wowhead_id}`}
                data-wh-rename-link="false"
                data-wh-icon-size="large"
                target="_blank"
                rel="noreferrer"
                className="item-link absolute inset-0 block"
                title={item.name}
                style={{ fontSize: 0, lineHeight: 0 }}
              />
            ) : (
              <a
                href={`https://www.wowhead.com/tbc/search?q=${encodeURIComponent(item.name)}`}
                target="_blank"
                rel="noreferrer"
                className="absolute inset-0"
                title={item.name}
              >
                <img
                  src={FALLBACK_BANK_ICON}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              </a>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-slate-950/10 opacity-70 transition-opacity group-hover:opacity-90" />

            <button
              type="button"
              onClick={() => { setRequestItem(item); setRequestQty(1); setRequestReason(''); }}
              className="absolute right-0.5 top-0.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-amber-500/60 bg-slate-950/92 text-sm font-black leading-none text-amber-300 shadow backdrop-blur hover:bg-amber-500 hover:text-slate-950"
              title={`Add ${item.name} to basket`}
              aria-label={`Add ${item.name} to basket`}
            >
              <span className="relative -top-px">+</span>
            </button>

            <span className="absolute bottom-0.5 right-0.5 z-10 rounded-md border border-slate-700/80 bg-slate-950/92 px-2 py-0 text-xs font-black leading-tight text-amber-300 shadow backdrop-blur-sm">
              {item.count || item.quantity || 0}
            </span>
          </div>
        ))}
      </div>

      {filteredBankItems.length === 0 && (
        <div className="text-center text-sm text-slate-500 border border-slate-800 rounded-xl bg-slate-950/60 py-6">
          No items match your current filters.
        </div>
      )}

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