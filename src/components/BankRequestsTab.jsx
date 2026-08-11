import React, { useState, useMemo } from 'react';

export default function BankRequestsTab({
  bankRequests,
  roster,
  specsByName,
  getDisplayFromId,
  handleResolveBankRequest,
  // NEW: implement this in the parent. It receives the array of resolved
  // items (with the same shape handleResolveBankRequest expects, plus the
  // pre-built `summaryMessage` string) so the parent can write all the DB
  // updates AND post a single Discord message instead of one-per-item.
  //   handleBulkResolveBankRequests(resolutions, summaryMessage)
  //   resolutions: [{ id, status: 'approved'|'denied', price, note, quantity, item_name, requester }]
  handleBulkResolveBankRequests,
  archivedBankRequests = [],
  onArchiveBankRequests,
  onRestoreArchivedBankRequests
}) {
  const [basket, setBasket] = useState([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkItems, setBulkItems] = useState([]);
  const [selectedArchiveRequestIds, setSelectedArchiveRequestIds] = useState([]);
  const [respondingRequestId, setRespondingRequestId] = useState(null);
  const [approveQuantity, setApproveQuantity] = useState('');
  const [approvePrice, setApprovePrice] = useState('');
  const [approveNote, setApproveNote] = useState('');
  const [denyReason, setDenyReason] = useState('');
  const [denyCustomReason, setDenyCustomReason] = useState('');

  const denyReasonOptions = [
    'Item reserved for raid use',
    'Insufficient justification',
    'Item not currently in bank'
  ];

  const toggleToBasket = (req) => {
    if (req.request_group_id) {
      const grouped = bankRequests.filter(r => r.status === 'pending' && r.request_group_id === req.request_group_id);
      const groupedIds = new Set(grouped.map(r => r.id));
      const allInBasket = grouped.every(r => basket.some(b => b.id === r.id));

      setBasket(prev => {
        if (allInBasket) {
          return prev.filter(b => !groupedIds.has(b.id));
        }

        const merged = [...prev];
        grouped.forEach(gr => {
          if (!merged.some(item => item.id === gr.id)) merged.push(gr);
        });
        return merged;
      });
      return;
    }

    setBasket(prev =>
      prev.find(b => b.id === req.id)
        ? prev.filter(b => b.id !== req.id)
        : [...prev, req]
    );
  };

  const openBulkModal = () => {
    const initial = basket.map(req => {
      const player = roster.find(p => p.id === req.player_id);
      return {
        id: req.id,
        item_name: req.item_name,
        requested_quantity: req.quantity,
        requester: player?.name || req.requester_name || 'Unknown',
        action: 'approve',       // 'approve' | 'deny'
        quantity: req.quantity,  // editable approved quantity
        price: '',
        reason: '',
        customReason: ''
      };
    });
    setBulkItems(initial);
    setBulkModalOpen(true);
  };

  const openBulkModalForRequests = (requests) => {
    const initial = requests.map(req => {
      const player = roster.find(p => p.id === req.player_id);
      return {
        id: req.id,
        item_name: req.item_name,
        requested_quantity: req.quantity,
        requester: player?.name || req.requester_name || 'Unknown',
        action: 'approve',
        quantity: req.quantity,
        price: '',
        reason: '',
        customReason: ''
      };
    });
    setBasket(requests);
    setBulkItems(initial);
    setBulkModalOpen(true);
  };

  const updateBulkItem = (id, patch) => {
    setBulkItems(prev => prev.map(it => (it.id === id ? { ...it, ...patch } : it)));
  };

  const closeBulkModal = () => {
    setBulkModalOpen(false);
    setBulkItems([]);
  };

  const buildSummaryMessage = (resolved) => {
    const lines = resolved.map(it => {
      if (it.status === 'approved') {
        const isPartial = it.quantity < it.requested_quantity;
        const icon = isPartial ? '⚠️' : '✅';
        const qtyLabel = isPartial ? `${it.quantity}/${it.requested_quantity}` : `${it.quantity}`;
        const priceLabel = it.price ? ` — ${it.price}g` : '';
        const noteLabel = it.note ? ` (${it.note})` : '';
        return `${icon} **${it.item_name}** x${qtyLabel} for **${it.requester}**${priceLabel}${noteLabel}`;
      }
      return `❌ **${it.item_name}** for **${it.requester}** — Denied${it.note ? `: ${it.note}` : ''}`;
    });
    return `**Bulk Bank Response**\n${lines.join('\n')}`;
  };

  const submitBulk = () => {
    const resolved = bulkItems.map(it => {
      if (it.action === 'approve') {
        return {
          id: it.id,
          item_name: it.item_name,
          requester: it.requester,
          requested_quantity: it.requested_quantity,
          status: 'approved',
          quantity: parseInt(it.quantity) || it.requested_quantity,
          price: parseInt(it.price) || 0,
          note: it.reason && it.reason !== 'custom' ? it.reason : it.customReason
        };
      }
      return {
        id: it.id,
        item_name: it.item_name,
        requester: it.requester,
        requested_quantity: it.requested_quantity,
        status: 'denied',
        quantity: 0,
        price: null,
        note: it.reason === 'custom' ? it.customReason : it.reason
      };
    });

    const summaryMessage = buildSummaryMessage(resolved);

    if (handleBulkResolveBankRequests) {
      // Preferred path: parent resolves everything and sends ONE message.
      handleBulkResolveBankRequests(resolved, summaryMessage);
    } else {
      // Fallback if the parent hasn't wired up the bulk handler yet:
      // resolve each individually (this will likely still fire one
      // notification per item on the backend).
      console.warn('handleBulkResolveBankRequests not provided — falling back to per-item resolution. Pass that prop to send a single consolidated message.');
      resolved.forEach(it => {
        handleResolveBankRequest(it.id, it.status, it.price, it.note, it.quantity);
      });
    }

    setBasket([]);
    closeBulkModal();
  };

  const allBulkItemsValid = useMemo(() => {
    return bulkItems.every(it => {
      if (it.action === 'approve') {
        return it.quantity && parseInt(it.quantity) > 0 && it.price !== '';
      }
      return it.reason && (it.reason !== 'custom' || it.customReason.trim());
    });
  }, [bulkItems]);

  const groupRequests = (requests) => {
    const grouped = requests.reduce((acc, req) => {
      const key = req.request_group_id || `single-${req.id}`;
      if (!acc[key]) {
        acc[key] = {
          key,
          request_group_id: req.request_group_id || null,
          created_at: req.created_at,
          requests: []
        };
      }
      acc[key].requests.push(req);
      if (new Date(req.created_at) > new Date(acc[key].created_at)) {
        acc[key].created_at = req.created_at;
      }
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const pendingRequestGroups = useMemo(() => groupRequests(bankRequests.filter(r => r.status === 'pending')), [bankRequests]);
  const resolvedRequestGroups = useMemo(() => groupRequests(bankRequests.filter(r => r.status !== 'pending')), [bankRequests]);
  const pendingRequestIds = useMemo(() => pendingRequestGroups.flatMap(group => group.requests.map(req => req.id)), [pendingRequestGroups]);
  const resolvedRequestIds = useMemo(() => resolvedRequestGroups.flatMap(group => group.requests.map(req => req.id)), [resolvedRequestGroups]);
  const normalizeRequestId = (requestId) => String(requestId);
  const isArchiveRequestSelected = (requestId) => selectedArchiveRequestIds.some(id => normalizeRequestId(id) === normalizeRequestId(requestId));
  const isPendingRequestInBasket = (requestId) => basket.some(req => normalizeRequestId(req.id) === normalizeRequestId(requestId));

  const toggleAllPendingBasketSelection = () => {
    const allPendingSelected = pendingRequestIds.length > 0 && pendingRequestIds.every(id => isPendingRequestInBasket(id));

    if (allPendingSelected) {
      setBasket(prev => prev.filter(req => !pendingRequestIds.some(id => normalizeRequestId(id) === normalizeRequestId(req.id))));
      return;
    }

    const allPendingRequests = pendingRequestGroups.flatMap(group => group.requests);
    setBasket(prev => {
      const merged = [...prev];
      allPendingRequests.forEach(req => {
        if (!merged.some(existing => normalizeRequestId(existing.id) === normalizeRequestId(req.id))) {
          merged.push(req);
        }
      });
      return merged;
    });
  };

  /*
  const exportRequestsCsv = (mode = 'all') => {
    const escapeCsv = (value) => {
      const raw = String(value ?? '');
      if (/[",\n]/.test(raw)) {
        return `"${raw.replace(/"/g, '""')}"`;
      }
      return raw;
    };

    const sourceRows = (Array.isArray(bankRequests) ? bankRequests : []).filter(req => {
      if (mode === 'pending') return String(req.status || '').toLowerCase() === 'pending';
      if (mode === 'resolved') return String(req.status || '').toLowerCase() !== 'pending';
      return true;
    });

    const rows = sourceRows.map(req => {
      const player = roster.find(p => Number(p.id) === Number(req.player_id));
      const requesterName = player?.name || req.requester_name || 'Unknown';
      const specName = player ? getDisplayFromId(player.spec_id) : '';

      return {
        id: req.id,
        request_group_id: req.request_group_id || '',
        created_at: req.created_at || '',
        status: req.status || '',
        item_name: req.item_name || '',
        requested_quantity: req.quantity ?? '',
        approved_quantity: req.approved_quantity ?? '',
        price: req.price ?? '',
        requester_name: requesterName,
        requester_spec: specName || '',
        player_id: req.player_id ?? '',
        reason: req.reason || '',
        officer_note: req.officer_note || ''
      };
    });

    const header = [
      'id',
      'request_group_id',
      'created_at',
      'status',
      'item_name',
      'requested_quantity',
      'approved_quantity',
      'price',
      'requester_name',
      'requester_spec',
      'player_id',
      'reason',
      'officer_note'
    ];

    const csvBody = [
      header.join(','),
      ...rows.map(row => header.map(key => escapeCsv(row[key])).join(','))
    ].join('\n');

    const blob = new Blob([csvBody], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const suffix = mode === 'pending' ? 'pending' : mode === 'resolved' ? 'resolved' : 'all';
    link.href = url;
    link.download = `bank-requests-${suffix}-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  */

  const exportVisibleApprovedRequestsJson = () => {
    const sourceRows = (Array.isArray(bankRequests) ? bankRequests : []).filter(req => String(req.status || '').toLowerCase() === 'approved');
    const payload = {
      exported_at: new Date().toISOString(),
      request_count: sourceRows.length,
      requests: sourceRows.map(req => {
        const player = roster.find(p => Number(p.id) === Number(req.player_id));
        return {
          id: req.id,
          item_wowhead_id: req.item_wowhead_id ?? null,
          item_name: req.item_name || '',
          quantity: req.quantity ?? req.approved_quantity ?? 0,
          approved_quantity: req.approved_quantity ?? req.quantity ?? 0,
          price: req.price ?? 0,
          requester_name: player?.name || req.requester_name || 'Unknown',
          requester_id: req.player_id ?? null,
          reason: req.reason || '',
          officer_note: req.officer_note || ''
        };
      })
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `approved-bank-requests-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const archiveSelectedResolvedRequests = () => {
    const requestIds = selectedArchiveRequestIds.filter(id => (Array.isArray(bankRequests) ? bankRequests : []).some(req => String(req.id) === String(id)));
    if (requestIds.length === 0) return;
    onArchiveBankRequests?.(requestIds);
    setSelectedArchiveRequestIds([]);
  };

  const toggleArchiveSelection = (requestId) => {
    const normalizedId = normalizeRequestId(requestId);
    setSelectedArchiveRequestIds(prev => prev.some(id => normalizeRequestId(id) === normalizedId)
      ? prev.filter(id => normalizeRequestId(id) !== normalizedId)
      : [...prev, requestId]);
  };

  const toggleAllResolvedArchiveSelection = () => {
    const allResolvedAreSelected = resolvedRequestIds.length > 0 && resolvedRequestIds.every(id => isArchiveRequestSelected(id));

    if (allResolvedAreSelected) {
      setSelectedArchiveRequestIds(prev => prev.filter(id => !resolvedRequestIds.some(resolvedId => normalizeRequestId(resolvedId) === normalizeRequestId(id))));
      return;
    }

    setSelectedArchiveRequestIds(prev => {
      const next = [...prev];
      resolvedRequestIds.forEach(id => {
        const normalizedId = normalizeRequestId(id);
        if (!next.some(existingId => normalizeRequestId(existingId) === normalizedId)) {
          next.push(id);
        }
      });
      return next;
    });
  };

  return (
    <section className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-slate-100">Bank Requests</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/*
          <button
            type="button"
            onClick={() => exportRequestsCsv('all')}
            className="text-xs font-bold bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-2 rounded"
          >
            Export All CSV
          </button>
          <button
            type="button"
            onClick={() => exportRequestsCsv('pending')}
            className="text-xs font-bold bg-amber-700 hover:bg-amber-600 text-white px-3 py-2 rounded"
          >
            Export Pending CSV
          </button>
          <button
            type="button"
            onClick={() => exportRequestsCsv('resolved')}
            className="text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-2 rounded"
          >
            Export Resolved CSV
          </button>
          */}
          <button
            type="button"
            onClick={exportVisibleApprovedRequestsJson}
            className="text-xs font-bold bg-purple-700 hover:bg-purple-600 text-white px-3 py-2 rounded"
          >
            Export Approved JSON
          </button>
          <button
            type="button"
            onClick={archiveSelectedResolvedRequests}
            disabled={selectedArchiveRequestIds.length === 0}
            className="text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-2 rounded"
          >
            Archive Selected Resolved{selectedArchiveRequestIds.length > 0 ? ` (${selectedArchiveRequestIds.length})` : ''}
          </button>
        </div>
      </div>

      {basket.length > 0 && (
        <div className="sticky top-0 z-20 bg-amber-900/20 border border-amber-700 p-4 rounded-xl mb-6 flex items-center justify-between shadow-lg">
          <span className="text-sm font-bold text-amber-500">🛒 {basket.length} items in approval basket</span>
          <button onClick={openBulkModal} className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-lg text-sm transition">
            Process Bulk Approval
          </button>
        </div>
      )}

      {bulkModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100">Bulk Resolve {bulkItems.length} Requests</h3>
              <button onClick={closeBulkModal} className="text-slate-500 hover:text-slate-300 text-xl leading-none">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
              {bulkItems.map(it => (
                <div key={it.id} className={`border rounded-xl p-4 ${it.action === 'approve' ? 'bg-emerald-950/10 border-emerald-900' : 'bg-red-950/10 border-red-900'}`}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <span className="font-bold text-purple-400">{it.item_name}</span>
                      <span className="text-slate-500 text-sm"> x{it.requested_quantity}</span>
                      <p className="text-xs text-slate-500 mt-0.5">Requested by <span className="font-bold text-slate-300">{it.requester}</span></p>
                    </div>
                    <div className="flex gap-1 bg-slate-950 rounded-lg p-1 border border-slate-800">
                      <button
                        onClick={() => updateBulkItem(it.id, { action: 'approve' })}
                        className={`text-xs font-bold px-3 py-1.5 rounded transition ${it.action === 'approve' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateBulkItem(it.id, { action: 'deny' })}
                        className={`text-xs font-bold px-3 py-1.5 rounded transition ${it.action === 'deny' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        Deny
                      </button>
                    </div>
                  </div>

                  {it.action === 'approve' ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Quantity</label>
                          <input
                            type="number" min="1" max={it.requested_quantity}
                            className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
                            value={it.quantity}
                            onChange={e => updateBulkItem(it.id, { quantity: e.target.value })}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Price (gold)</label>
                          <input
                            type="number" min="0"
                            className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
                            value={it.price}
                            placeholder="0"
                            onChange={e => updateBulkItem(it.id, { price: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Comment (optional)</label>
                        <input
                          type="text"
                          className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
                          value={it.reason}
                          placeholder="e.g. Only 3 in stock, rest on order"
                          onChange={e => updateBulkItem(it.id, { reason: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Reason for denial</label>
                      <select
                        className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
                        value={it.reason}
                        onChange={e => updateBulkItem(it.id, { reason: e.target.value })}
                      >
                        <option value="">-- Select a reason --</option>
                        {denyReasonOptions.map(r => <option key={r} value={r}>{r}</option>)}
                        <option value="custom">Other (write below)</option>
                      </select>
                      {it.reason === 'custom' && (
                        <input
                          type="text"
                          className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none"
                          placeholder="Enter custom reason..."
                          value={it.customReason}
                          onChange={e => updateBulkItem(it.id, { customReason: e.target.value })}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-5 border-t border-slate-800 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">This will send one consolidated message covering all {bulkItems.length} requests.</p>
              <div className="flex gap-2 shrink-0">
                <button onClick={closeBulkModal} className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg transition">Cancel</button>
                <button
                  onClick={submitBulk}
                  disabled={!allBulkItemsValid}
                  className="text-xs font-bold bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg transition"
                >
                  Send Bulk Response
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-2">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pending Requests</h3>
        {pendingRequestIds.length > 0 && (
          <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <input
              type="checkbox"
              checked={pendingRequestIds.length > 0 && pendingRequestIds.every(id => isPendingRequestInBasket(id))}
              onChange={toggleAllPendingBasketSelection}
              className="rounded border-slate-700 bg-slate-950"
            />
            Select all pending
          </label>
        )}
      </div>
      {pendingRequestGroups.length === 0 ? (
        <p className="text-slate-600 italic py-4 mb-8">No pending requests.</p>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {pendingRequestGroups.map(group => {
            const requesters = [...new Set(group.requests.map(req => {
              const player = roster.find(p => p.id === req.player_id);
              return player?.name || req.requester_name || 'Unknown';
            }))];
            const hasMultiple = group.requests.length > 1;
            const singleReq = !hasMultiple ? group.requests[0] : null;
            const isResponding = singleReq && respondingRequestId === singleReq.id;

            return (
              <div key={group.key} className="border rounded-xl p-4 transition bg-slate-950 border-slate-800">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-bold text-purple-400">{hasMultiple ? `Basket (${group.requests.length} items)` : singleReq.item_name}</span>
                      {!hasMultiple && <span className="text-slate-500 text-sm"> x{singleReq.quantity}</span>}
                      <p className="text-xs text-slate-500 mt-1">Requested by <span className="font-bold">{requesters.join(', ')}</span></p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">{new Date(group.created_at).toLocaleString()}</span>
                </div>

                <div className="space-y-2 mb-3">
                  {group.requests.map(req => {
                    const player = roster.find(p => p.id === req.player_id);
                    const requesterName = player?.name || req.requester_name || 'Unknown';
                    const inBasket = isPendingRequestInBasket(req.id);
                    return (
                      <div key={req.id} className="text-sm text-slate-300 bg-slate-900 p-2 rounded border border-slate-800">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-bold text-purple-400">{req.item_name}</span>
                            <span className="text-slate-500 text-xs"> x{req.quantity}</span>
                            <span className="text-slate-500 text-xs"> — {requesterName}</span>
                          </div>
                          <label className="text-[11px] text-slate-400 flex items-center gap-2 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={inBasket}
                              onChange={() => toggleToBasket(req)}
                              className="rounded border-slate-700 bg-slate-950"
                            />
                            Tick
                          </label>
                        </div>
                        {req.reason && <p className="text-xs text-slate-400 mt-1">{req.reason}</p>}
                      </div>
                    );
                  })}
                </div>

                {hasMultiple ? (
                  <div className="flex gap-2">
                    <button onClick={() => openBulkModalForRequests(group.requests)} className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded transition">Process Basket</button>
                  </div>
                ) : (
                  <>
                    {!isResponding ? (
                      <div className="flex gap-2">
                        <button onClick={() => setRespondingRequestId(singleReq.id)} className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded transition">Approve</button>
                        <button onClick={() => setRespondingRequestId(`deny-${singleReq.id}`)} className="text-xs font-bold bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition">Deny</button>
                        <button onClick={() => { setBasket(group.requests); openBulkModalForRequests(group.requests); }} className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded transition">Process as Basket</button>
                      </div>
                    ) : null}

                    {respondingRequestId === singleReq.id && (
                  <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-800">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Quantity (requested: {singleReq.quantity})</label>
                        <input type="number" min="1" max={singleReq.quantity} className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none" value={approveQuantity} onChange={e => setApproveQuantity(e.target.value)} placeholder={String(singleReq.quantity)} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Price (gold)</label>
                        <input type="number" min="0" className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none" value={approvePrice} onChange={e => setApprovePrice(e.target.value)} placeholder="0" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Comment (optional)</label>
                      <input type="text" className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none" value={approveNote} onChange={e => setApproveNote(e.target.value)} placeholder="e.g. Only 3 in stock, rest on order" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleResolveBankRequest(singleReq.id, 'approved', parseInt(approvePrice) || 0, approveNote, parseInt(approveQuantity) || singleReq.quantity)} className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded transition">Confirm Approval</button>
                      <button onClick={() => setRespondingRequestId(null)} className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded transition">Cancel</button>
                    </div>
                  </div>
                )}

                {respondingRequestId === `deny-${singleReq.id}` && (
                  <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-800">
                    <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Reason for denial</label>
                    <select className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none mb-2" value={denyReason} onChange={e => setDenyReason(e.target.value)}>
                      <option value="">-- Select a reason --</option>
                      <option value="Item reserved for raid use">Item reserved for raid use</option>
                      <option value="Insufficient justification">Insufficient justification</option>
                      <option value="Item not currently in bank">Item not currently in bank</option>
                      <option value="custom">Other (write below)</option>
                    </select>
                    {denyReason === 'custom' && (
                      <input type="text" className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none mb-2" placeholder="Enter custom reason..." value={denyCustomReason} onChange={e => setDenyCustomReason(e.target.value)} />
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => handleResolveBankRequest(singleReq.id, 'denied', null, denyReason === 'custom' ? denyCustomReason : denyReason)} className="text-xs font-bold bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition">Confirm Denial</button>
                      <button onClick={() => setRespondingRequestId(null)} className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded transition">Cancel</button>
                    </div>
                  </div>
                )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-2">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Resolved Requests</h3>
        {resolvedRequestGroups.length > 0 && (
          <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <input
              type="checkbox"
              checked={resolvedRequestIds.length > 0 && resolvedRequestIds.every(id => isArchiveRequestSelected(id))}
              onChange={toggleAllResolvedArchiveSelection}
              className="rounded border-slate-700 bg-slate-950"
            />
            Select all
          </label>
        )}
      </div>
      {resolvedRequestGroups.length === 0 ? (
        <p className="text-slate-600 italic py-4">No resolved requests yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {resolvedRequestGroups.map(group => {
            const hasMultiple = group.requests.length > 1;
            return (
              <div key={group.key} className="p-3 rounded border bg-slate-950 border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-300">{hasMultiple ? `Basket (${group.requests.length} items)` : 'Single Request'}</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">{new Date(group.created_at).toLocaleString()}</span>
                </div>
                <div className="space-y-2">
                  {group.requests.map(req => {
                    const player = roster.find(p => p.id === req.player_id);
                    const requesterName = player?.name || req.requester_name || 'Unknown';
                    return (
                      <div key={req.id} className={`flex items-center justify-between gap-4 p-2.5 rounded border ${req.status === 'approved' ? 'bg-emerald-950/20 border-emerald-900' : 'bg-red-950/20 border-red-900'}`}>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-sm text-slate-200">{req.item_name}</span>
                          <span className="text-slate-500 text-xs"> x{req.quantity}</span>
                          <span className="text-xs text-slate-500"> — {requesterName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-[11px] text-slate-400 flex items-center gap-2 whitespace-nowrap">
                            <input type="checkbox" checked={isArchiveRequestSelected(req.id)} onChange={() => toggleArchiveSelection(req.id)} className="rounded border-slate-700 bg-slate-950" />
                            Archive
                          </label>
                          {req.status === 'approved' ? (
                            <span className="text-xs font-bold text-emerald-400 text-right" title={req.officer_note}>
                              Approved {req.approved_quantity && req.approved_quantity < req.quantity ? `(${req.approved_quantity}/${req.quantity})` : ''}{req.price ? ` — ${req.price}g` : ''}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-red-400 text-right" title={req.officer_note}>Denied{req.officer_note ? `: ${req.officer_note}` : ''}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}