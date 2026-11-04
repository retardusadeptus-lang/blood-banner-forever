import { useMemo, useState } from 'react';
import { ProfileAvatar } from './ProfilesMyCharactersTab';

function ProfileCard({ profile }) {
  const details = [profile.race, profile.className, profile.subclass, profile.spec].filter(Boolean).join(' / ');
  const tags = [
    profile.realm && `Realm: ${profile.realm}`,
    profile.role
  ].filter(Boolean);

  return (
    <article className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70 shadow-lg shadow-black/10">
      <div className="flex gap-4 border-b border-slate-800 bg-slate-900/60 p-4">
        <ProfileAvatar profile={profile} size="small" />
        <div className="min-w-0 pt-1">
          <h3 className="truncate text-xl font-black text-slate-100">{profile.characterName}</h3>
          <p className="mt-1 text-xs font-semibold text-cyan-300">{details || 'A new story in the making'}</p>
          <p className="mt-1 text-xs text-slate-500">Played by {profile.ownerBattletag || 'a guild member'}</p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => <span key={tag} className="rounded-full border border-slate-700 px-2.5 py-1 text-[11px] text-slate-400">{tag}</span>)}
          </div>
        )}
        {profile.professions && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-400">Professions</p>
            <p className="mt-1 text-sm text-slate-300">{profile.professions}</p>
          </div>
        )}
        {profile.personality && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-400">Personality</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-300">{profile.personality}</p>
          </div>
        )}
        {profile.rpHooks && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-400">RP hooks</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-300">{profile.rpHooks}</p>
          </div>
        )}
        {profile.backstory && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-400">Backstory</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-300">{profile.backstory}</p>
          </div>
        )}
        {!profile.professions && !profile.personality && !profile.rpHooks && !profile.backstory && (
          <p className="text-sm italic text-slate-500">This character is keeping their cards close for now.</p>
        )}
      </div>
    </article>
  );
}

export default function ProfilesMeetGuildTab({ profiles, loading, error }) {
  const [search, setSearch] = useState('');
  const visibleProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return profiles;
    return profiles.filter(profile => [
      profile.characterName,
      profile.ownerBattletag,
      profile.realm,
      profile.race,
      profile.className,
      profile.subclass,
      profile.spec,
      profile.role,
      profile.professions,
      profile.personality,
      profile.rpHooks,
      profile.backstory
    ].some(value => String(value || '').toLowerCase().includes(query)));
  }, [profiles, search]);

  return (
    <section className="bg-slate-900 rounded-b-xl rounded-tr-xl border border-slate-800 shadow-xl p-6 animate-in fade-in duration-300 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner">
        <div>
          <h2 className="text-2xl font-black text-slate-100">The people behind the raid frames</h2>
          <p className="mt-1 text-sm text-slate-400">Character stories, familiar faces, and a few good reasons to start a tavern scene.</p>
        </div>
        <label className="w-full sm:w-64">
          <span className="sr-only">Search guild profiles</span>
          <input className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/20" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search characters or players" />
        </label>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading guild profiles...</p>}
      {error && <p className="rounded-lg border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-sm text-rose-300">{error}</p>}
      {!loading && !visibleProfiles.length && (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-6 py-12 text-center">
          <p className="text-lg font-bold text-slate-200">{search ? 'No profiles match that search' : 'The guild book is waiting for its first page'}</p>
          <p className="mt-2 text-sm text-slate-500">{search ? 'Try a character name, class, or player tag.' : 'Add a character in My Characters to introduce them to the guild.'}</p>
        </div>
      )}
      {visibleProfiles.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleProfiles.map(profile => <ProfileCard key={profile.id} profile={profile} />)}
        </div>
      )}
    </section>
  );
}
