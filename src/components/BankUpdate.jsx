export default function BankUpdate({
  handleBankFileUpload,
  bankUpdateJsonText,
  setBankUpdateJsonText,
  handleParseBankUpdateJson,
  clearBankUpdate,
  handleSaveBankUpload,
  bankUploadStatus,
  bankUploadMeta,
  bankUploadParsed
}) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
      <h3 className="text-lg font-bold text-slate-100">Bank Inventory Update</h3>
      <p className="text-sm text-slate-400">Upload the latest bank export or parsed snapshot to refresh the vault list.</p>
      <input type="file" onChange={handleBankFileUpload} className="block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300" />
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Paste Bank JSON</label>
          <textarea
            value={bankUpdateJsonText}
            onChange={e => setBankUpdateJsonText(e.target.value)}
            placeholder="Paste the addon-exported JSON here..."
            rows={6}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleParseBankUpdateJson} className="rounded-lg bg-cyan-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-cyan-600">Import JSON</button>
          <button
            type="button"
            onClick={clearBankUpdate}
            className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 transition hover:bg-slate-900"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={handleSaveBankUpload} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-500">Save Upload</button>
        <span className="text-xs text-slate-500">{bankUploadStatus}</span>
      </div>
      {bankUploadMeta?.gold !== null && bankUploadMeta?.gold !== undefined && (
        <div className="text-xs font-semibold text-amber-400">Detected guild gold: {bankUploadMeta.gold}</div>
      )}
      {bankUploadParsed && (
        <pre className="max-h-64 overflow-auto rounded-lg border border-slate-800 bg-slate-900 p-4 text-[11px] leading-5 text-slate-300 whitespace-pre-wrap">
          {JSON.stringify(bankUploadParsed, null, 2)}
        </pre>
      )}
    </div>
  );
}
