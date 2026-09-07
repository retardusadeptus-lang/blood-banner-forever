import { useCallback, useEffect, useMemo, useState } from 'react';

function formatCreatedAt(value) {
  if (!value) return 'Unknown date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString();
}

function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  return Promise.resolve();
}

function buildCopyPayload(entry) {
  const importCode = String(entry?.import_code || '').trim();
  if (importCode) return importCode;

  const url = String(entry?.wago_url || '').trim();
  const password = String(entry?.access_password || '').trim();
  if (url && password) return `${url}\nPassword: ${password}`;
  if (url) return url;
  return '';
}

export default function WeakaurasTab({ fetchData, postData, canSubmit }) {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedById, setExpandedById] = useState({});
  const [isSubmitExpanded, setIsSubmitExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    import_code: '',
    wago_url: '',
    access_password: '',
    notes: ''
  });

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchData('weakauras');
      setEntries(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError?.message || 'Failed to load WeakAuras.');
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    // Load external WeakAura data when the resource view mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEntries();
  }, [loadEntries]);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => Number(b.id || 0) - Number(a.id || 0)),
    [entries]
  );

  const toggleEntry = (id) => {
    setExpandedById(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = async (entry) => {
    const payload = buildCopyPayload(entry);
    if (!payload) return;

    try {
      await copyTextToClipboard(payload);
      setCopiedId(entry.id);
      window.setTimeout(() => setCopiedId(current => (current === entry.id ? null : current)), 1200);
    } catch {
      setError('Copy failed. Please copy manually.');
    }
  };

  const handleFormField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || isSaving) return;

    const title = String(form.title || '').trim();
    const importCode = String(form.import_code || '').trim();
    const wagoUrl = String(form.wago_url || '').trim();

    if (!title) {
      setError('A title is required.');
      return;
    }
    if (!importCode && !wagoUrl) {
      setError('Paste an import code or provide a Wago link.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const created = await postData('weakauras', {
        title,
        import_code: importCode,
        wago_url: wagoUrl,
        access_password: String(form.access_password || '').trim(),
        notes: String(form.notes || '').trim()
      });

      setEntries(prev => [created, ...prev]);
      setForm({ title: '', import_code: '', wago_url: '', access_password: '', notes: '' });
      setIsSubmitExpanded(false);
    } catch (submitError) {
      setError(submitError?.message || 'Failed to submit WeakAura.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-100">Weakauras</h3>
        <p className="text-sm text-slate-400">Officer-submitted WeakAuras with one-click copy for in-game import.</p>
      </div>

      {canSubmit && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60">
          <button
            type="button"
            onClick={() => setIsSubmitExpanded(value => !value)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
          >
            <span className="text-sm font-semibold text-slate-100">Submit New WeakAura</span>
            <span className="text-xs font-bold text-slate-400">{isSubmitExpanded ? 'Collapse -' : 'Expand +'}</span>
          </button>

          {isSubmitExpanded && (
            <form onSubmit={handleSubmit} className="border-t border-slate-800 p-4 space-y-3">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => handleFormField('title', event.target.value)}
                  placeholder="Example: Sunwell - Brutallus Burn Tracker"
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Import Code</label>
                <textarea
                  rows={4}
                  value={form.import_code}
                  onChange={(event) => handleFormField('import_code', event.target.value)}
                  placeholder="Paste WeakAura import string"
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Wago / WBS Link</label>
                  <input
                    type="url"
                    value={form.wago_url}
                    onChange={(event) => handleFormField('wago_url', event.target.value)}
                    placeholder="https://wago.io/..."
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Password (optional)</label>
                  <input
                    type="text"
                    value={form.access_password}
                    onChange={(event) => handleFormField('access_password', event.target.value)}
                    placeholder="Only if link is protected"
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Notes (optional)</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) => handleFormField('notes', event.target.value)}
                  placeholder="Boss phase, role notes, setup reminders"
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${isSaving ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
                >
                  {isSaving ? 'Submitting...' : 'Submit WeakAura'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {error && (
        <div className="rounded border border-rose-800/60 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">{error}</div>
      )}

      {isLoading ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">Loading WeakAuras...</div>
      ) : sortedEntries.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">No WeakAuras submitted yet.</div>
      ) : (
        <div className="space-y-2">
          {sortedEntries.map(entry => {
            const isExpanded = Boolean(expandedById[entry.id]);
            const copyPayload = buildCopyPayload(entry);
            return (
              <div key={entry.id} className="rounded-lg border border-slate-800 bg-slate-900/70">
                <div className="flex items-center gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleEntry(entry.id)}
                    className="flex-1 text-left"
                  >
                    <div className="text-sm font-semibold text-slate-100">{entry.title}</div>
                    <div className="text-[11px] text-slate-500">{formatCreatedAt(entry.created_at)}{entry.created_by ? ` by ${entry.created_by}` : ''}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(entry)}
                    disabled={!copyPayload}
                    className={`rounded px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${copyPayload ? 'border border-emerald-700/50 bg-emerald-900/25 text-emerald-300 hover:bg-emerald-900/40' : 'border border-slate-700 bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                  >
                    {copiedId === entry.id ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleEntry(entry.id)}
                    className="rounded px-2 py-1 text-xs font-bold text-slate-400"
                  >
                    {isExpanded ? '-' : '+'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-800 px-4 py-3 space-y-3 text-sm text-slate-300">
                    {entry.wago_url && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Link</div>
                        <a href={entry.wago_url} target="_blank" rel="noreferrer" className="text-amber-300 break-all hover:underline">{entry.wago_url}</a>
                      </div>
                    )}
                    {entry.access_password && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Password</div>
                        <div className="break-all">{entry.access_password}</div>
                      </div>
                    )}
                    {entry.notes && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Notes</div>
                        <div className="whitespace-pre-wrap break-words">{entry.notes}</div>
                      </div>
                    )}
                    {entry.import_code && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Import Code</div>
                        <pre className="max-h-48 overflow-auto rounded border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300 whitespace-pre-wrap break-all">{entry.import_code}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
