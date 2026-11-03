import { useMemo, useState } from 'react';

const EMPTY_PROFILE = {
  characterName: '',
  realm: '',
  race: '',
  className: '',
  spec: '',
  subclass: '',
  role: '',
  professions: '',
  personality: '',
  rpHooks: '',
  backstory: '',
  avatarData: ''
};

const inputClassName = 'w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/30';
const labelClassName = 'mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400';

function toFormState(profile) {
  return {
    ...EMPTY_PROFILE,
    ...(profile || {})
  };
}

export function ProfileAvatar({ profile, size = 'large' }) {
  const sizeClassName = size === 'small' ? 'h-16 w-16' : 'h-28 w-28';
  return profile?.avatarData ? (
    <img
      src={profile.avatarData}
      alt={`${profile.characterName || 'Character'} portrait`}
      className={`${sizeClassName} shrink-0 rounded-xl border border-cyan-700/40 bg-slate-900 object-cover`}
    />
  ) : (
    <div className={`${sizeClassName} flex shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950 text-3xl text-slate-700`} aria-hidden="true">
      +
    </div>
  );
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read that image.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('That file is not a readable image.'));
      image.onload = () => {
        const canvas = document.createElement('canvas');
        let maxSide = 900;
        let dataUrl = '';

        for (let attempt = 0; attempt < 4; attempt += 1) {
          const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext('2d');
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          dataUrl = canvas.toDataURL('image/jpeg', 0.82 - attempt * 0.08);
          if (dataUrl.length <= 850000) break;
          maxSide = Math.round(maxSide * 0.75);
        }

        if (dataUrl.length > 900000) {
          reject(new Error('That image is still too large after resizing. Choose a smaller image.'));
          return;
        }
        resolve(dataUrl);
      };
      image.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

function ProfileForm({ initialProfile, onCancel, onSave, onDelete }) {
  const [form, setForm] = useState(() => toFormState(initialProfile));
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isReadingImage, setIsReadingImage] = useState(false);
  const isEditing = Boolean(initialProfile?.id);

  const updateField = (field, value) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsReadingImage(true);
    setError('');
    try {
      const avatarData = await resizeImage(file);
      updateField('avatarData', avatarData);
    } catch (err) {
      setError(err.message || 'Unable to process that image.');
    } finally {
      setIsReadingImage(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.characterName.trim()) {
      setError('Character name is required.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await onSave({
        ...form,
        characterName: form.characterName.trim()
      });
    } catch (err) {
      setError(err.message || 'Unable to save this character profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this character profile?')) return;

    setIsSaving(true);
    setError('');
    try {
      await onDelete();
    } catch (err) {
      setError(err.message || 'Unable to delete this character profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-cyan-800/40 bg-slate-900/70 p-4 shadow-xl shadow-black/10 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">{isEditing ? 'Edit character' : 'New character'}</p>
          <h3 className="mt-1 text-xl font-black text-slate-100">Tell the guild who they are</h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">Add as much or as little RP flavor as feels right. Everything here is visible to guild members.</p>
        </div>
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors hover:border-slate-500 hover:text-white">
          Cancel
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
        <div className="space-y-3">
          <ProfileAvatar profile={form} />
          <label className="block cursor-pointer rounded-lg border border-slate-700 px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-cyan-300 transition-colors hover:border-cyan-500/70 hover:bg-cyan-950/30">
            {isReadingImage ? 'Processing...' : 'Choose portrait'}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleImageChange} disabled={isReadingImage} />
          </label>
          {form.avatarData && (
            <button type="button" onClick={() => updateField('avatarData', '')} className="w-full text-xs font-semibold text-slate-500 hover:text-rose-300">
              Remove portrait
            </button>
          )}
          <p className="max-w-[8rem] text-center text-[11px] leading-relaxed text-slate-600">Portraits are resized in your browser before upload.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClassName}>Character name *</span>
            <input className={inputClassName} value={form.characterName} onChange={event => updateField('characterName', event.target.value)} maxLength={80} required />
          </label>
          <label>
            <span className={labelClassName}>Realm</span>
            <input className={inputClassName} value={form.realm} onChange={event => updateField('realm', event.target.value)} maxLength={80} placeholder="Server realm" />
          </label>
          <label>
            <span className={labelClassName}>Race</span>
            <input className={inputClassName} value={form.race} onChange={event => updateField('race', event.target.value)} maxLength={80} placeholder="Human, Orc, ..." />
          </label>
          <label>
            <span className={labelClassName}>Class</span>
            <input className={inputClassName} value={form.className} onChange={event => updateField('className', event.target.value)} maxLength={80} placeholder="Paladin, Mage, ..." />
          </label>
          <label>
            <span className={labelClassName}>Specialization</span>
            <input className={inputClassName} value={form.spec} onChange={event => updateField('spec', event.target.value)} maxLength={100} placeholder="Holy, Fury, Restoration, ..." />
          </label>
          <label>
            <span className={labelClassName}>Subclass</span>
            <input className={inputClassName} value={form.subclass} onChange={event => updateField('subclass', event.target.value)} maxLength={100} placeholder="A custom path, school, or archetype" />
          </label>
          <label>
            <span className={labelClassName}>Gameplay role</span>
            <select className={inputClassName} value={form.role} onChange={event => updateField('role', event.target.value)}>
              <option value="">Choose a role</option>
              <option value="Tank">Tank</option>
              <option value="Healer">Healer</option>
              <option value="DPS">DPS</option>
              <option value="Support">Support</option>
              <option value="Flexible">Flexible</option>
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className={labelClassName}>Professions</span>
            <input className={inputClassName} value={form.professions} onChange={event => updateField('professions', event.target.value)} maxLength={200} placeholder="Alchemy, Herbalism, Cooking" />
          </label>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <label>
          <span className={labelClassName}>Personality</span>
          <textarea className={`${inputClassName} min-h-32 resize-y`} value={form.personality} onChange={event => updateField('personality', event.target.value)} maxLength={1200} placeholder="What are they like around the campfire?" />
        </label>
        <label>
          <span className={labelClassName}>RP hooks / connections</span>
          <textarea className={`${inputClassName} min-h-32 resize-y`} value={form.rpHooks} onChange={event => updateField('rpHooks', event.target.value)} maxLength={1200} placeholder="Goals, rumors, rivalries, story threads..." />
        </label>
        <label>
          <span className={labelClassName}>Backstory</span>
          <textarea className={`${inputClassName} min-h-32 resize-y`} value={form.backstory} onChange={event => updateField('backstory', event.target.value)} maxLength={4000} placeholder="The short version of their story." />
        </label>
      </div>

      {error && <p className="rounded-lg border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-sm text-rose-300">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
        <div>
          {isEditing && (
            <button type="button" onClick={handleDelete} disabled={isSaving} className="text-xs font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 disabled:opacity-50">
              {isSaving ? 'Working...' : 'Delete character'}
            </button>
          )}
        </div>
        <button type="submit" disabled={isSaving || isReadingImage} className="rounded-lg bg-cyan-600 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50">
          {isSaving ? 'Saving...' : isEditing ? 'Save changes' : 'Add character'}
        </button>
      </div>
    </form>
  );
}

function ProfileSummary({ profile, onEdit }) {
  const metadata = useMemo(() => [profile.race, profile.className, profile.subclass, profile.spec].filter(Boolean).join(' / '), [profile.race, profile.className, profile.subclass, profile.spec]);

  return (
    <article className="flex gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <ProfileAvatar profile={profile} size="small" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="truncate text-lg font-black text-slate-100">{profile.characterName}</h3>
            <p className="text-xs text-slate-500">{[metadata, profile.realm].filter(Boolean).join(' - ') || 'Character details coming soon'}</p>
          </div>
          <button type="button" onClick={onEdit} className="rounded-md border border-slate-700 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300 hover:border-cyan-500/70 hover:text-cyan-200">
            Edit
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
          {profile.role && <span className="rounded-full border border-amber-700/50 bg-amber-950/20 px-2 py-1 text-amber-300">{profile.role}</span>}
          {profile.professions && <span className="rounded-full border border-slate-700 px-2 py-1">{profile.professions}</span>}
        </div>
        {(profile.personality || profile.rpHooks) && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-400">{profile.personality || profile.rpHooks}</p>
        )}
      </div>
    </article>
  );
}

export default function ProfilesMyCharactersTab({ profiles, loading, error, isAuthenticated, onLogin, onCreate, onUpdate, onDelete }) {
  const myProfiles = useMemo(() => profiles.filter(profile => profile.isOwner), [profiles]);
  const [editingId, setEditingId] = useState(null);
  const editingProfile = editingId && editingId !== 'new' ? myProfiles.find(profile => profile.id === editingId) : null;

  if (!isAuthenticated) {
    return (
      <section className="mx-auto max-w-3xl rounded-xl border border-cyan-800/40 bg-slate-900/60 p-6 text-center shadow-xl shadow-black/10 md:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">My characters</p>
        <h2 className="mt-2 text-2xl font-black text-slate-100">Sign in to build your character shelf</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400">Use Battle.net sign-in to add multiple characters and share their stories with the guild.</p>
        <button type="button" onClick={onLogin} className="mt-6 rounded-lg bg-cyan-600 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-cyan-500">
          Sign in with Battle.net
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">My characters</p>
          <h2 className="mt-1 text-2xl font-black text-slate-100">Your guild-facing characters</h2>
          <p className="mt-1 text-sm text-slate-400">Create one profile for each character you bring into the story.</p>
        </div>
        {!editingId && (
          <button type="button" onClick={() => setEditingId('new')} className="rounded-lg bg-cyan-600 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-cyan-500">
            Add character
          </button>
        )}
      </div>

      {editingId && (
        <ProfileForm
          key={`${editingId}-${editingProfile?.updatedAt || 'new'}`}
          initialProfile={editingProfile}
          onCancel={() => setEditingId(null)}
          onSave={async profile => {
            if (editingId === 'new') await onCreate(profile);
            else await onUpdate(editingId, profile);
            setEditingId(null);
          }}
          onDelete={async () => {
            await onDelete(editingId);
            setEditingId(null);
          }}
        />
      )}

      {loading && <p className="text-sm text-slate-400">Loading your profiles...</p>}
      {error && <p className="rounded-lg border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-sm text-rose-300">{error}</p>}
      {!loading && !myProfiles.length && !editingId && (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-6 py-10 text-center">
          <p className="text-lg font-bold text-slate-200">No character profiles yet</p>
          <p className="mt-2 text-sm text-slate-500">Add your first character and give the guild a face to remember.</p>
        </div>
      )}
      {myProfiles.length > 0 && !editingId && (
        <div className="grid gap-3 lg:grid-cols-2">
          {myProfiles.map(profile => <ProfileSummary key={profile.id} profile={profile} onEdit={() => setEditingId(profile.id)} />)}
        </div>
      )}
    </section>
  );
}
