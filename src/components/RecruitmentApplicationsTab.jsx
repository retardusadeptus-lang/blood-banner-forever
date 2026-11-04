import { useEffect, useMemo, useState } from 'react';

const EMPTY_FORM = {
  className: '',
  spec: '',
  name: '',
  discordId: '',
  aboutMe: '',
  isProxy: false,
  proxyName: '',
  proxyBattletag: ''
};

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderApplicationMarkdown(value = '') {
  const normalized = String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  return escapeHtml(normalized)
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<img alt="$1" src="$2" style="max-width:100%; border-radius:10px; margin:0.75rem 0; display:block;" />')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br />');
}

export default function RecruitmentApplicationsTab({
  isAuthenticated,
  bnetAuthState,
  fetchData,
  postData,
  putData,
  deleteData,
  isOfficer,
  canManageBlurb = false,
  siteTabMetadata
}) {
  const [blurb, setBlurb] = useState('');
  const [savedBlurb, setSavedBlurb] = useState('');
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingBlurb, setEditingBlurb] = useState(false);
  const [editingApplicationId, setEditingApplicationId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setIsLoading(true);
        const [config, list] = await Promise.all([
          fetchData('recruitment-applications/config'),
          fetchData('recruitment-applications')
        ]);
        if (!active) return;
        setBlurb(config?.blurb || '');
        setSavedBlurb(config?.blurb || '');
        setApplications(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error('Failed to load recruitment applications:', error);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadData();
    return () => { active = false; };
  }, [fetchData]);

  const isDirty = blurb !== savedBlurb;

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingApplicationId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      setSubmitError('You must be logged in with Battle.net to submit an application.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        className: form.className.trim(),
        spec: form.spec.trim(),
        name: form.name.trim(),
        discordId: form.discordId.trim(),
        aboutMe: form.aboutMe.trim(),
        ...(isOfficer ? { isProxy: Boolean(form.isProxy), proxyName: form.proxyName.trim(), proxyBattletag: form.proxyBattletag.trim() } : {})
      };

      const result = editingApplicationId
        ? await putData(`recruitment-applications/${editingApplicationId}`, payload)
        : await postData('recruitment-applications', payload);

      setApplications((prev) => {
        if (editingApplicationId) {
          return prev.map((application) => application.id === editingApplicationId ? result : application);
        }
        return [result, ...prev];
      });

      resetForm();
    } catch (error) {
      setSubmitError(error?.message || 'Failed to submit recruitment application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlurbSave = async () => {
    if (!canManageBlurb) return;
    try {
      setSaveError('');
      const result = await putData('recruitment-applications/config', { blurb });
      setSavedBlurb(result?.blurb || blurb);
      setEditingBlurb(false);
    } catch (error) {
      setSaveError(error?.message || 'Failed to save recruitment blurb.');
    }
  };

  const visibleApplications = useMemo(() => {
    if (!isOfficer) return applications.filter(app => app.userId === Number(bnetAuthState?.user?.id || 0) || app.applicantBattletag === bnetAuthState?.user?.battletag);
    return applications;
  }, [applications, bnetAuthState, isOfficer]);

  const updateApplicationStatus = async (applicationId, status, officerNote = '') => {
    try {
      const updated = await putData(`recruitment-applications/${applicationId}/status`, { status, officerNote });
      setApplications((prev) => prev.map((application) => application.id === applicationId ? {
        ...application,
        status: updated.status || application.status,
        officerNote: updated.officerNote || '',
        reviewedByBattletag: updated.reviewedByBattletag || null,
        reviewedAt: updated.reviewedAt || null,
        updatedAt: updated.updatedAt || application.updatedAt
      } : application));
    } catch (error) {
      console.error('Failed to update recruitment application status:', error);
      setSubmitError(error?.message || 'Failed to update application status.');
    }
  };

  const handleDeleteApplication = async (applicationId) => {
    try {
      await deleteData(`recruitment-applications/${applicationId}`);
      setApplications((prev) => prev.filter((application) => application.id !== applicationId));
    } catch (error) {
      console.error('Failed to delete recruitment application:', error);
      setSubmitError(error?.message || 'Failed to delete application.');
    }
  };

  const getStatusStyle = (status) => {
    const normalized = String(status || 'pending').toLowerCase();
    if (normalized === 'approved') return 'border-emerald-800 bg-emerald-900/20 text-emerald-200';
    if (normalized === 'rejected') return 'border-rose-800 bg-rose-900/20 text-rose-200';
    return 'border-amber-800 bg-amber-900/20 text-amber-200';
  };

  const handleEditApplication = (application) => {
    setEditingApplicationId(application.id);
    setForm({
      className: application.className || '',
      spec: application.spec || '',
      name: application.name || '',
      discordId: application.discordId || '',
      aboutMe: application.aboutMe || '',
      isProxy: Boolean(application.isProxy),
      proxyName: application.proxyName || '',
      proxyBattletag: application.proxyBattletag || ''
    });
    setSubmitError('');
  };

  const canEditApplication = (application) => {
    if (isOfficer) return true;
    const currentUserId = Number(bnetAuthState?.user?.id || 0);
    return Number(application.userId) === currentUserId || application.applicantBattletag === bnetAuthState?.user?.battletag;
  };

  return (
    <section data-site-tab-id={siteTabMetadata?.id} data-site-tab-group={siteTabMetadata?.groupKey} className="theme-panel theme-panel-tab p-6 space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Applications</h2>
            <p className="text-sm text-slate-400 mt-1">Tell potential recruits who we are and collect new applications.</p>
          </div>

          {canManageBlurb && (
            <button
              type="button"
              onClick={() => setEditingBlurb((prev) => !prev)}
              className="rounded-lg bg-cyan-700 hover:bg-cyan-600 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white"
            >
              {editingBlurb ? 'Cancel' : 'Edit Blurb'}
            </button>
          )}
        </div>

        {editingBlurb ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <textarea
              value={blurb}
              onChange={(event) => setBlurb(event.target.value.slice(0, 2000))}
              rows={6}
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none"
              placeholder="Write the top-of-tab information for recruits..."
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setBlurb(savedBlurb); setEditingBlurb(false); setSaveError(''); }} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-200">Discard</button>
              <button type="button" onClick={handleBlurbSave} disabled={!isDirty} className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider ${isDirty ? 'bg-amber-600 hover:bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>Save Changes</button>
            </div>
            {saveError ? <p className="text-xs text-rose-400">{saveError}</p> : null}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300 whitespace-pre-wrap">
            {blurb || 'We are looking for players who are engaged, reliable, and ready to bring a good attitude to the raid.'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100">{editingApplicationId ? 'Edit application' : 'Submit an application'}</h3>
            <p className="text-xs text-slate-400 mt-1">Anyone logged in with Battle.net can submit an application.</p>
          </div>

          {!isAuthenticated ? (
            <div className="rounded border border-amber-800 bg-amber-900/20 p-3 text-sm text-amber-200">
              Please log in with Battle.net to submit an application.
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="space-y-1 text-sm text-slate-300">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Class</span>
              <input
                value={form.className}
                onChange={(event) => handleInputChange('className', event.target.value.slice(0, 40))}
                placeholder="Mage"
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none"
                disabled={!isAuthenticated}
              />
            </label>

            <label className="space-y-1 text-sm text-slate-300">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Spec</span>
              <input
                value={form.spec}
                onChange={(event) => handleInputChange('spec', event.target.value.slice(0, 80))}
                placeholder="Fire"
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none"
                disabled={!isAuthenticated}
              />
            </label>
          </div>

          <label className="space-y-1 text-sm text-slate-300 block">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Name</span>
            <input
              value={form.name}
              onChange={(event) => handleInputChange('name', event.target.value.slice(0, 80))}
              placeholder="Your character or in-game name"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none"
              disabled={!isAuthenticated}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-300 block">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Discord ID (optional)</span>
            <input
              value={form.discordId}
              onChange={(event) => handleInputChange('discordId', event.target.value.slice(0, 80))}
              placeholder="Username or Discord ID"
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none"
              disabled={!isAuthenticated}
            />
          </label>

          {isOfficer ? (
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(form.isProxy)}
                onChange={(event) => handleInputChange('isProxy', event.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900"
              />
              <span>Proxy application</span>
            </label>
          ) : null}

          {isOfficer && form.isProxy ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="space-y-1 text-sm text-slate-300">
                <span className="text-[10px] uppercase tracking-wider text-slate-500">Proxy name</span>
                <input
                  value={form.proxyName}
                  onChange={(event) => handleInputChange('proxyName', event.target.value.slice(0, 80))}
                  placeholder="Applicant name"
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-sm text-slate-300">
                <span className="text-[10px] uppercase tracking-wider text-slate-500">Proxy battletag</span>
                <input
                  value={form.proxyBattletag}
                  onChange={(event) => handleInputChange('proxyBattletag', event.target.value.slice(0, 80))}
                  placeholder="Player#1234"
                  className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none"
                />
              </label>
            </div>
          ) : null}

          <label className="space-y-1 text-sm text-slate-300 block">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">About me</span>
            <textarea
              value={form.aboutMe}
              onChange={(event) => handleInputChange('aboutMe', event.target.value.slice(0, 5000))}
              rows={8}
              placeholder="Tell us about your prior raid experience, the kind of guild environment you are looking for, and the gaming style that fits your schedule. You can also use **bold**, *italics*, [links](https://example.com), or ![image](https://example.com/image.jpg)."
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none"
              disabled={!isAuthenticated}
            />
          </label>

          {submitError ? <p className="text-xs text-rose-400">{submitError}</p> : null}

          <div className="flex justify-end gap-2">
            {editingApplicationId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-200"
              >
                Cancel Edit
              </button>
            ) : null}
            <button
              type="submit"
              className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider ${isAuthenticated && !isSubmitting ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              disabled={!isAuthenticated || isSubmitting}
            >
              {isSubmitting ? (editingApplicationId ? 'Saving...' : 'Submitting...') : (editingApplicationId ? 'Save Changes' : 'Submit Application')}
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Application list</h3>
            <p className="text-xs text-slate-400 mt-1">Only you and officers can view applications.</p>
          </div>

          {isLoading ? (
            <p className="text-sm text-slate-400">Loading applications...</p>
          ) : visibleApplications.length === 0 ? (
            <p className="text-sm text-slate-500">No applications yet.</p>
          ) : (
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
              {visibleApplications.map((application) => (
                <details key={application.id} open className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-2">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 font-bold text-slate-100">
                        <span aria-hidden="true" className="bank-section-indicator inline-block transition-transform duration-150 text-slate-500">&gt;</span>
                        {application.name}
                      </div>
                      <div className="text-xs text-slate-400">{application.applicantBattletag}</div>
                      {application.discordId ? <div className="text-xs text-cyan-400">Discord: {application.discordId}</div> : null}
                    </div>
                    <div className="text-right text-[10px] uppercase tracking-wider text-cyan-400">
                      {application.className} / {application.spec}
                    </div>
                  </summary>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(application.status)}`}>
                      {String(application.status || 'pending').toLowerCase()}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {isOfficer ? (
                        <>
                          <button type="button" onClick={() => setSelectedApplication(application)} className="rounded bg-cyan-700 hover:bg-cyan-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Pop out</button>
                          <button type="button" onClick={() => updateApplicationStatus(application.id, 'approved')} className="rounded bg-emerald-700 hover:bg-emerald-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Approve</button>
                          <button type="button" onClick={() => updateApplicationStatus(application.id, 'rejected')} className="rounded bg-rose-700 hover:bg-rose-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Reject</button>
                          <button type="button" onClick={() => handleDeleteApplication(application.id)} className="rounded bg-slate-700 hover:bg-slate-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Delete</button>
                        </>
                      ) : null}
                      {canEditApplication(application) ? (
                        <button type="button" onClick={() => handleEditApplication(application)} className="rounded bg-amber-700 hover:bg-amber-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">Edit</button>
                      ) : null}
                    </div>
                  </div>
                  {application.statusChangedAt ? (
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">
                      Status changed: {new Date(application.statusChangedAt).toLocaleString()}
                    </div>
                  ) : null}
                  {application.statusHistory && application.statusHistory.length > 0 ? (
                    <div className="rounded border border-slate-700 bg-slate-950/60 p-2 text-[10px] text-slate-300 space-y-1">
                      <div className="font-bold uppercase tracking-wider text-slate-400">Status history</div>
                      {application.statusHistory.slice(-3).map((entry, index) => (
                        <div key={`${entry.changedAt}-${index}`} className="flex items-center justify-between gap-2">
                          <span className="uppercase tracking-wider">{entry.status}</span>
                          <span>{new Date(entry.changedAt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {application.officerNote ? (
                    <div className="rounded border border-slate-700 bg-slate-950/60 p-2 text-xs text-slate-300">
                      <div className="font-bold uppercase tracking-wider text-slate-400 mb-1">Officer note</div>
                      {application.officerNote}
                    </div>
                  ) : null}
                  <div className="text-sm text-slate-300 whitespace-pre-wrap">{application.aboutMe.slice(0, 220)}{application.aboutMe.length > 220 ? '…' : ''}</div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedApplication ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <div>
                <div className="text-lg font-bold text-slate-100">{selectedApplication.name}</div>
                <div className="text-xs text-slate-400">{selectedApplication.applicantBattletag}</div>
              </div>
              <button type="button" onClick={() => setSelectedApplication(null)} className="rounded bg-slate-800 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-200">Close</button>
            </div>

            <div className="max-h-[calc(90vh-72px)] overflow-y-auto p-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(selectedApplication.status)}`}>
                  {String(selectedApplication.status || 'pending').toLowerCase()}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-cyan-400">
                  {selectedApplication.className} / {selectedApplication.spec}
                </span>
                {selectedApplication.discordId ? (
                  <span className="text-[10px] uppercase tracking-wider text-cyan-400">
                    Discord: {selectedApplication.discordId}
                  </span>
                ) : null}
                {selectedApplication.statusChangedAt ? (
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">
                    Changed {new Date(selectedApplication.statusChangedAt).toLocaleString()}
                  </span>
                ) : null}
              </div>

              <div className="rounded border border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-200 leading-7">
                <div dangerouslySetInnerHTML={{ __html: renderApplicationMarkdown(selectedApplication.aboutMe || '') }} />
              </div>

              {selectedApplication.statusHistory && selectedApplication.statusHistory.length > 0 ? (
                <div className="rounded border border-slate-700 bg-slate-950/60 p-3 text-xs text-slate-300">
                  <div className="mb-2 font-bold uppercase tracking-wider text-slate-400">Status history</div>
                  <div className="space-y-1">
                    {selectedApplication.statusHistory.map((entry, index) => (
                      <div key={`${entry.changedAt}-${index}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-1 last:border-b-0 last:pb-0">
                        <span className="uppercase tracking-wider text-slate-200">{entry.status}</span>
                        <span>{entry.actorLabel || 'System'}</span>
                        <span>{new Date(entry.changedAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedApplication.officerNote ? (
                <div className="rounded border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-300">
                  <div className="mb-1 font-bold uppercase tracking-wider text-slate-400">Officer note</div>
                  {selectedApplication.officerNote}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
