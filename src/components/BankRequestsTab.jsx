import React from 'react';

export default function BankRequestsTab({
  bankRequests,
  roster,
  specsByName,
  getDisplayFromId,
  respondingRequestId,
  setRespondingRequestId,
  approveQuantity,
  setApproveQuantity,
  approvePrice,
  setApprovePrice,
  approveNote,
  setApproveNote,
  denyReason,
  setDenyReason,
  denyCustomReason,
  setDenyCustomReason,
  handleResolveBankRequest,
  handleBankFileUpload,
  bankUploadParsed,
  handleSaveBankUpload,
  bankUploadStatus
}) {
  return (
    <section className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-slate-100 mb-6">Bank Requests</h2>

      <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner mb-8">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Update Bank Inventory</h3>
        <p className="text-xs text-slate-500 mb-4">Upload the <code className="text-amber-500">TBCBankLogger.lua</code> SavedVariables file after scanning the bank in-game.</p>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2.5 rounded-lg transition cursor-pointer text-sm">
            📂 Select Lua File
            <input type="file" accept=".lua" className="hidden" onChange={handleBankFileUpload} />
          </label>
          {bankUploadParsed && (
            <button onClick={handleSaveBankUpload} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-lg transition text-sm">
              💾 Save & Notify Discord
            </button>
          )}
          {bankUploadStatus && <span className="text-sm font-semibold text-slate-300">{bankUploadStatus}</span>}
        </div>
      </div>

      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Pending Requests</h3>
      {bankRequests.filter(r => r.status === 'pending').length === 0 ? (
        <p className="text-slate-600 italic py-4 mb-8">No pending requests.</p>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {bankRequests.filter(r => r.status === 'pending').map(req => {
            const player = roster.find(p => p.id === req.player_id);
            const isResponding = respondingRequestId === req.id;
            return (
              <div key={req.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                  <div>
                    <span className="font-bold text-purple-400">{req.item_name}</span>
                    <span className="text-slate-500 text-sm"> x{req.quantity}</span>
                    <p className="text-xs text-slate-500 mt-1">Requested by <span className="font-bold" style={{ color: player ? specsByName[getDisplayFromId(player.spec_id)]?.color : undefined }}>{player?.name || 'Unknown'}</span></p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">{new Date(req.created_at).toLocaleString()}</span>
                </div>
                {req.reason && <p className="text-sm text-slate-300 bg-slate-900 p-2 rounded mb-3">{req.reason}</p>}

                {!isResponding ? (
                  <div className="flex gap-2">
                    <button onClick={() => setRespondingRequestId(req.id)} className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded transition">Approve</button>
                    <button onClick={() => setRespondingRequestId(`deny-${req.id}`)} className="text-xs font-bold bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition">Deny</button>
                  </div>
                ) : null}

                {respondingRequestId === req.id && (
                  <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-800">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Quantity to Approve (requested: {req.quantity})</label>
                        <input type="number" min="1" max={req.quantity} className="w-full bg-slate-900 text-white border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none" value={approveQuantity} onChange={e => setApproveQuantity(e.target.value)} placeholder={String(req.quantity)} />
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
                      <button onClick={() => handleResolveBankRequest(req.id, 'approved', parseInt(approvePrice) || 0, approveNote, parseInt(approveQuantity) || req.quantity)} className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded transition">Confirm Approval</button>
                      <button onClick={() => setRespondingRequestId(null)} className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded transition">Cancel</button>
                    </div>
                  </div>
                )}

                {respondingRequestId === `deny-${req.id}` && (
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
                      <button onClick={() => handleResolveBankRequest(req.id, 'denied', null, denyReason === 'custom' ? denyCustomReason : denyReason)} className="text-xs font-bold bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition">Confirm Denial</button>
                      <button onClick={() => setRespondingRequestId(null)} className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded transition">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Resolved Requests</h3>
      {bankRequests.filter(r => r.status !== 'pending').length === 0 ? (
        <p className="text-slate-600 italic py-4">No resolved requests yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {bankRequests.filter(r => r.status !== 'pending').map(req => {
            const player = roster.find(p => p.id === req.player_id);
            return (
              <div key={req.id} className={`flex items-center justify-between gap-4 p-3 rounded border ${req.status === 'approved' ? 'bg-emerald-950/20 border-emerald-900' : 'bg-red-950/20 border-red-900'}`}>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-sm text-slate-200">{req.item_name}</span>
                  <span className="text-slate-500 text-xs"> x{req.quantity}</span>
                  <span className="text-xs text-slate-500"> — {player?.name || 'Unknown'}</span>
                </div>
                {req.status === 'approved' ? (
                  <span className="text-xs font-bold text-emerald-400" title={req.officer_note}>
                    Approved {req.approved_quantity && req.approved_quantity < req.quantity ? `(${req.approved_quantity}/${req.quantity})` : ''}{req.price ? ` — ${req.price}g` : ''}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-red-400" title={req.officer_note}>Denied{req.officer_note ? `: ${req.officer_note}` : ''}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}