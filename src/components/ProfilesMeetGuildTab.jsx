import { useEffect, useMemo, useState } from 'react';
import { ProfileAvatar } from './ProfilesMyCharactersTab';

function normalizeLookupValue(value) {
  return String(value || '').trim().toLowerCase();
}

function getProfileDetails(profile) {
  return [profile.race, profile.className, profile.subclass, profile.spec].filter(Boolean).join(' / ');
}

function getProfileTeaser(profile) {
  return [profile.personality, profile.rpHooks, profile.backstory]
    .find(value => String(value || '').trim())
    ?.replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180) || '';
}

function ProfileCard({ profile, onSelect }) {
  const details = getProfileDetails(profile);
  const tags = [
    profile.guildRole && `Guild role: ${profile.guildRole}`,
    profile.role && `Character role: ${profile.role}`
  ].filter(Boolean);
  const teaser = getProfileTeaser(profile);

  return (
    <button type="button" onClick={onSelect} className="group w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70 text-left shadow-lg shadow-black/10 transition-colors hover:border-cyan-700/60 focus:border-cyan-500/80 focus:outline-none focus:ring-2 focus:ring-cyan-500/30">
      <div className="flex gap-4 border-b border-slate-800 bg-slate-900/60 p-4">
        <ProfileAvatar profile={profile} size="small" />
        <div className="min-w-0 pt-1">
          <h3 className="truncate text-xl font-black text-slate-100">{profile.characterName}</h3>
          <p className="mt-1 text-xs font-semibold text-cyan-300">{details || 'A new story in the making'}</p>
          <p className="mt-1 text-xs text-slate-500">Played by {profile.ownerBattletag || 'a guild member'}</p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => <span key={tag} className="rounded-full border border-slate-700 px-2.5 py-1 text-[11px] text-slate-400">{tag}</span>)}
          </div>
        )}
        <p className="line-clamp-2 text-sm leading-relaxed text-slate-400">{teaser || 'Open this character to read their story.'}</p>
        <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-400 transition-colors group-hover:text-cyan-300">View full details</span>
      </div>
    </button>
  );
}

export function ProfileDetailModal({ profile, onClose }) {
  if (!profile) return null;

  const details = getProfileDetails(profile);
  const sections = [
    ['Professions', profile.professions],
    ['Personality', profile.personality],
    ['RP hooks', profile.rpHooks],
    ['Backstory', profile.backstory]
  ].filter(([, value]) => value);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" role="dialog" aria-modal="true" aria-labelledby={`profile-detail-title-${profile.id}`} onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl" onClick={event => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">Guild character</p>
            <h2 id={`profile-detail-title-${profile.id}`} className="mt-1 text-2xl font-black text-slate-100">{profile.characterName}</h2>
            <p className="mt-1 text-sm text-slate-400">{details || 'Character details coming soon'}</p>
            <p className="mt-1 text-xs text-slate-500">Played by {profile.ownerBattletag || 'a guild member'}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md border border-slate-700 px-3 py-1.5 text-lg leading-none text-slate-400 hover:border-slate-500 hover:text-white" aria-label={`Close ${profile.characterName} details`}>×</button>
        </div>

        <div className="mt-5 flex gap-4">
          <ProfileAvatar profile={profile} />
          <div className="flex flex-wrap content-start gap-2">
            {profile.guildRole && <span className="rounded-full border border-cyan-700/50 bg-cyan-950/30 px-2.5 py-1 text-xs text-cyan-300">Guild role: {profile.guildRole}</span>}
            {profile.role && <span className="rounded-full border border-amber-700/50 bg-amber-950/20 px-2.5 py-1 text-xs text-amber-300">Character role: {profile.role}</span>}
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {sections.map(([label, value]) => (
            <div key={label}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-400">{label}</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-300">{value}</p>
            </div>
          ))}
          {!sections.length && <p className="text-sm italic text-slate-500">This character is keeping their cards close for now.</p>}
        </div>
      </div>
    </div>
  );
}

export default function ProfilesMeetGuildTab({ profiles = [], roster = [], loading, error }) {
  const [search, setSearch] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const rosterRolesByName = useMemo(() => {
    const rolesByName = new Map();
    roster.forEach(player => {
      const characterName = normalizeLookupValue(player.name);
      if (!characterName || rolesByName.has(characterName)) return;
      rolesByName.set(characterName, String(player.guild_rank || player.guildRank || '').trim());
    });
    return rolesByName;
  }, [roster]);
  const publicProfiles = useMemo(() => profiles
    .filter(profile => profile.visibility !== 'private')
    .map(profile => ({
      ...profile,
      guildRole: rosterRolesByName.get(normalizeLookupValue(profile.characterName)) || ''
    })), [profiles, rosterRolesByName]);
  const visibleProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return publicProfiles;
    return publicProfiles.filter(profile => [
      profile.characterName,
      profile.ownerBattletag,
      profile.race,
      profile.className,
      profile.subclass,
      profile.spec,
      profile.role,
      profile.guildRole,
      profile.professions,
      profile.personality,
      profile.rpHooks,
      profile.backstory
    ].some(value => String(value || '').toLowerCase().includes(query)));
  }, [publicProfiles, search]);

  useEffect(() => {
    if (!selectedProfile) return undefined;
    const handleKeyDown = event => {
      if (event.key === 'Escape') setSelectedProfile(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedProfile]);

  return (
    <>
      <section className="theme-panel theme-panel-tab p-6 animate-in fade-in duration-300 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4 bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner">
          <div>
            <h2 className="text-xl font-bold text-slate-100">The people behind the raid frames</h2>
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
            {visibleProfiles.map(profile => <ProfileCard key={profile.id} profile={profile} onSelect={() => setSelectedProfile(profile)} />)}
          </div>
        )}
      </section>
      <ProfileDetailModal profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
    </>
  );
}
