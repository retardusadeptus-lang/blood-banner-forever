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

function normalizeTags(value) {
  const source = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(source.map(tag => String(tag || '').trim()).filter(Boolean))];
}

export default function WeakaurasTab({ fetchData, postData, canSubmit, canManageSections }) {
  const [entries, setEntries] = useState([]);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [error, setError] = useState('');
  const [expandedById, setExpandedById] = useState({});
  const [isSubmitExpanded, setIsSubmitExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [sectionTitle, setSectionTitle] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [isSectionMenuOpen, setIsSectionMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSectionId, setFilterSectionId] = useState('all');
  const [form, setForm] = useState({
    title: '',
    import_code: '',
    wago_url: '',
    access_password: '',
    notes: '',
    tags: ''
  });

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [entryData, sectionData] = await Promise.all([
        fetchData('weakauras'),
        fetchData('weakauras/sections')
      ]);
      setEntries(Array.isArray(entryData) ? entryData : []);
      setSections(Array.isArray(sectionData) ? sectionData : []);
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

  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''))),
    [sections]
  );

  const selectedSectionLabel = sortedSections.find(section => String(section.id) === String(selectedSectionId))?.title || 'Unsectioned';

  const filteredEntries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return sortedEntries.filter(entry => {
      const section = sortedSections.find(item => String(item.id) === String(entry.section_id));
      const sectionTitle = section?.title || 'Unsectioned';
      const sectionMatches = filterSectionId === 'all'
        || (filterSectionId === 'unsectioned' && !entry.section_id)
        || String(entry.section_id) === filterSectionId;
      if (!sectionMatches) return false;
      if (!normalizedQuery) return true;

      return [
        entry.title,
        entry.notes,
        entry.import_code,
        entry.wago_url,
        entry.access_password,
        entry.created_by,
        sectionTitle,
        ...normalizeTags(entry.tags)
      ].some(value => String(value || '').toLowerCase().includes(normalizedQuery));
    });
  }, [filterSectionId, searchQuery, sortedEntries, sortedSections]);

  const entriesBySection = useMemo(() => {
    const grouped = new Map();
    filteredEntries.forEach(entry => {
      const key = entry.section_id === null || entry.section_id === undefined ? '' : String(entry.section_id);
      const existing = grouped.get(key) || [];
      existing.push(entry);
      grouped.set(key, existing);
    });
    return grouped;
  }, [filteredEntries]);

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

  const handleCreateSection = async (event) => {
    event.preventDefault();
    if (!canManageSections || isSavingSection) return;

    const title = String(sectionTitle || '').trim();
    if (!title) {
      setError('A section title is required.');
      return;
    }

    setIsSavingSection(true);
    setError('');
    try {
      const created = await postData('weakauras/sections', { title });
      setSections(prev => [...prev, created]);
      setSectionTitle('');
    } catch (sectionError) {
      setError(sectionError?.message || 'Failed to create WeakAura section.');
    } finally {
      setIsSavingSection(false);
    }
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
        section_id: selectedSectionId || null,
        title,
        import_code: importCode,
        wago_url: wagoUrl,
        access_password: String(form.access_password || '').trim(),
        notes: String(form.notes || '').trim(),
        tags: normalizeTags(form.tags)
      });

      setEntries(prev => [created, ...prev]);
      setForm({ title: '', import_code: '', wago_url: '', access_password: '', notes: '', tags: '' });
      setSelectedSectionId('');
      setIsSubmitExpanded(false);
    } catch (submitError) {
      setError(submitError?.message || 'Failed to submit WeakAura.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderEntry = (entry) => {
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
            {normalizeTags(entry.tags).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {normalizeTags(entry.tags).map(tag => (
                  <span key={tag} className="rounded-full border border-cyan-700/50 bg-cyan-950/40 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">{tag}</span>
                ))}
              </div>
            )}
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
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-100">Weakauras</h3>
        <p className="text-sm text-slate-400">Officer-submitted WeakAuras with one-click copy for in-game import.</p>
      </div>

      {canManageSections && (
        <form onSubmit={handleCreateSection} className="flex flex-col gap-2 rounded-lg border border-amber-800/50 bg-amber-950/10 p-4 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-amber-300">Admin: Add WeakAura Section</span>
            <input
              type="text"
              value={sectionTitle}
              onChange={event => setSectionTitle(event.target.value)}
              placeholder="Example: Raid Cooldowns"
              maxLength={120}
              className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white"
            />
          </label>
          <button
            type="submit"
            disabled={isSavingSection}
            className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            {isSavingSection ? 'Adding...' : 'Add Section'}
          </button>
        </form>
      )}

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
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Section</label>
                <div className="relative">
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isSectionMenuOpen}
                    onClick={() => setIsSectionMenuOpen(value => !value)}
                    className="flex w-full items-center justify-between rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-left text-sm text-white"
                  >
                    <span>{selectedSectionLabel}</span>
                    <span
                      aria-hidden="true"
                      className={`bank-section-indicator inline-block text-slate-500 transition-transform duration-150 ${isSectionMenuOpen ? 'rotate-90' : ''}`}
                    >
                      &gt;
                    </span>
                  </button>
                  {isSectionMenuOpen && (
                    <div role="listbox" className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded border border-slate-700 bg-slate-900 p-1 shadow-xl">
                      {[
                        { id: '', title: 'Unsectioned' },
                        ...sortedSections
                      ].map(section => {
                        const isSelected = String(section.id) === String(selectedSectionId);
                        return (
                          <button
                            key={section.id || 'unsectioned'}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setSelectedSectionId(String(section.id));
                              setIsSectionMenuOpen(false);
                            }}
                            className={`block w-full rounded px-2 py-1.5 text-left text-sm ${isSelected ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                          >
                            {section.title}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
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

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Tags (optional)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(event) => handleFormField('tags', event.target.value)}
                  placeholder="Class, role, boss, cooldowns"
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-white"
                />
                <p className="mt-1 text-[10px] text-slate-500">Separate tags with commas.</p>
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

      {!isLoading && (
        <div className="grid gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Search WeakAuras</span>
            <input
              type="search"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Search title, notes, links, creator, or import code"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-amber-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Filter by Section</span>
            <select
              value={filterSectionId}
              onChange={event => setFilterSectionId(event.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
            >
              <option value="all">All Sections</option>
              <option value="unsectioned">Unsectioned</option>
              {sortedSections.map(section => (
                <option key={section.id} value={section.id}>{section.title}</option>
              ))}
            </select>
          </label>
          <div className="text-xs text-slate-500 md:col-span-2">
            Showing {filteredEntries.length} of {sortedEntries.length} WeakAuras
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">Loading WeakAuras...</div>
      ) : filteredEntries.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
          {sortedEntries.length === 0 ? 'No WeakAuras submitted yet.' : 'No WeakAuras match the current search and section filter.'}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedSections.map(section => {
            const sectionEntries = entriesBySection.get(String(section.id)) || [];
            return (
              <details key={section.id} open className="rounded-lg border border-slate-800 bg-slate-900/40">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-slate-100">
                  <span aria-hidden="true" className="bank-section-indicator mr-2 inline-block text-slate-500 transition-transform duration-150">&gt;</span>{section.title}
                  <span className="ml-2 text-xs font-normal text-slate-500">({sectionEntries.length})</span>
                </summary>
                <div className="space-y-2 border-t border-slate-800 p-3">
                  {sectionEntries.length > 0 ? sectionEntries.map(renderEntry) : (
                    <div className="px-1 py-2 text-xs text-slate-500">No WeakAuras in this section yet.</div>
                  )}
                </div>
              </details>
            );
          })}
          {(entriesBySection.get('') || []).length > 0 && (
            <details open className="rounded-lg border border-slate-800 bg-slate-900/40">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-slate-100">
                <span aria-hidden="true" className="bank-section-indicator mr-2 inline-block text-slate-500 transition-transform duration-150">&gt;</span>Unsectioned
                <span className="ml-2 text-xs font-normal text-slate-500">({entriesBySection.get('').length})</span>
              </summary>
              <div className="space-y-2 border-t border-slate-800 p-3">
                {entriesBySection.get('').map(renderEntry)}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
