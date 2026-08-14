import { useEffect, useMemo, useState } from 'react';

const EMPTY_FORM = {
  className: '',
  spec: '',
  name: '',
  aboutMe: ''
};

export default function RecruitmentApplicationsTab({
  isAuthenticated,
  bnetAuthState,
  fetchData,
  postData,
  putData,
  isOfficer,
  canManageBlurb = false
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
        aboutMe: form.aboutMe.trim()
      };

      const result = await postData('recruitment-applications', payload);
      setApplications((prev) => [result, ...prev]);
      setForm(EMPTY_FORM);
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

  return (
    <section className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 space-y-6">
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
            <h3 className="text-lg font-bold text-slate-100">Submit an application</h3>
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
            <span className="text-[10px] uppercase tracking-wider text-slate-500">About me</span>
            <textarea
              value={form.aboutMe}
              onChange={(event) => handleInputChange('aboutMe', event.target.value.slice(0, 5000))}
              rows={8}
              placeholder="Tell us about your prior raid experience, the kind of guild environment you are looking for, and the gaming style that fits your schedule."
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none"
              disabled={!isAuthenticated}
            />
          </label>

          {submitError ? <p className="text-xs text-rose-400">{submitError}</p> : null}

          <div className="flex justify-end">
            <button
              type="submit"
              className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider ${isAuthenticated && !isSubmitting ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              disabled={!isAuthenticated || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
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
                <article key={application.id} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-100">{application.name}</div>
                      <div className="text-xs text-slate-400">{application.applicantBattletag}</div>
                    </div>
                    <div className="text-right text-[10px] uppercase tracking-wider text-cyan-400">
                      {application.className} / {application.spec}
                    </div>
                  </div>
                  <div className="text-sm text-slate-300 whitespace-pre-wrap">{application.aboutMe}</div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
