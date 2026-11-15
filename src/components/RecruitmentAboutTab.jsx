import { useEffect, useState } from 'react';
import { getSiteTabUrl } from '../config/siteRegistry';

const DEFAULT_ABOUT_CONTENT = {
  eyebrow: 'Recruitment',
  title: 'About Us',
  intro: 'Blood and Banner is a guild for players who enjoy organized raids, clear communication, and a relaxed community outside the raid.',
  sections: [
    {
      id: 'guild',
      title: 'Our guild',
      body: 'We build teams that value preparation, consistency, and making room for people to improve.'
    },
    {
      id: 'raids',
      title: 'Our raids',
      body: 'We use shared plans, assignments, and honest feedback to make raid time focused and enjoyable.'
    },
    {
      id: 'community',
      title: 'Our community',
      body: 'Good attitude matters here. We welcome dependable players who want to contribute and play as a team.'
    }
  ],
  guildInfo: {
    title: 'Join the guild',
    body: 'Connect with the guild community on Discord, or start an application to join the roster.',
    discordLinks: [
      { id: 'discord-1', label: 'Join our Discord', url: '' },
      { id: 'discord-2', label: 'Recruitment Discord', url: '' }
    ]
  }
};

function cloneAboutContent(content) {
  return {
    ...content,
    sections: content.sections.map(section => ({ ...section })),
    guildInfo: {
      ...content.guildInfo,
      discordLinks: content.guildInfo.discordLinks.map(link => ({ ...link }))
    }
  };
}

function normalizeExternalUrl(value) {
  const candidate = String(value ?? '').trim().slice(0, 500);
  if (!candidate) return '';

  try {
    const url = new URL(candidate);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

function getUniqueDiscordLinkId(value, index, usedIds) {
  const baseId = String(value || `discord-${index + 1}`).slice(0, 40);
  let id = baseId;
  let suffix = 2;
  while (usedIds.has(id)) {
    id = `${baseId.slice(0, 37)}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(id);
  return id;
}

function getNextDiscordLinkId(links) {
  let index = 1;
  while (links.some(link => link.id === `discord-${index}`)) index += 1;
  return `discord-${index}`;
}

function normalizeAboutContent(value) {
  const source = value && typeof value === 'object' ? value : {};
  const sections = Array.isArray(source.sections) ? source.sections : [];
  const guildInfoSource = source.guildInfo && typeof source.guildInfo === 'object' ? source.guildInfo : {};
  const discordLinks = Array.isArray(guildInfoSource.discordLinks)
    ? guildInfoSource.discordLinks
    : DEFAULT_ABOUT_CONTENT.guildInfo.discordLinks;
  const usedDiscordLinkIds = new Set();

  return {
    eyebrow: String(source.eyebrow ?? DEFAULT_ABOUT_CONTENT.eyebrow).slice(0, 80),
    title: String(source.title ?? DEFAULT_ABOUT_CONTENT.title).slice(0, 120),
    intro: String(source.intro ?? DEFAULT_ABOUT_CONTENT.intro).replace(/\r\n/g, '\n').replace(/\r/g, '\n').slice(0, 1200),
    sections: DEFAULT_ABOUT_CONTENT.sections.map((defaultSection, index) => {
      const section = sections[index] || {};
      return {
        id: defaultSection.id,
        title: String(section.title ?? defaultSection.title).slice(0, 80),
        body: String(section.body ?? defaultSection.body).replace(/\r\n/g, '\n').replace(/\r/g, '\n').slice(0, 1200)
      };
    }),
    guildInfo: {
      title: String(guildInfoSource.title ?? DEFAULT_ABOUT_CONTENT.guildInfo.title).slice(0, 120),
      body: String(guildInfoSource.body ?? DEFAULT_ABOUT_CONTENT.guildInfo.body).replace(/\r\n/g, '\n').replace(/\r/g, '\n').slice(0, 1200),
      discordLinks: discordLinks.slice(0, 4).map((link, index) => ({
        id: getUniqueDiscordLinkId(link?.id, index, usedDiscordLinkIds),
        label: String(link?.label ?? `Discord link ${index + 1}`).slice(0, 80),
        url: normalizeExternalUrl(link?.url)
      }))
    }
  };
}

export default function RecruitmentAboutTab({
  canEdit = false,
  fetchData,
  putData,
  siteTabMetadata
}) {
  const [content, setContent] = useState(() => cloneAboutContent(DEFAULT_ABOUT_CONTENT));
  const [savedContent, setSavedContent] = useState(() => cloneAboutContent(DEFAULT_ABOUT_CONTENT));
  const [editing, setEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadContent() {
      try {
        setIsLoading(true);
        setLoadError('');
        const data = await fetchData('recruitment-about');
        if (!active) return;
        const normalized = normalizeAboutContent(data);
        setContent(normalized);
        setSavedContent(cloneAboutContent(normalized));
      } catch (error) {
        if (!active) return;
        console.error('Failed to load About Us content:', error);
        setLoadError(error?.message || 'Failed to load About Us content.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadContent();
    return () => { active = false; };
  }, [fetchData]);

  const isDirty = JSON.stringify(content) !== JSON.stringify(savedContent);

  const updateContent = (field, value) => {
    setContent(previous => ({ ...previous, [field]: value }));
  };

  const updateSection = (index, field, value) => {
    setContent(previous => ({
      ...previous,
      sections: previous.sections.map((section, sectionIndex) => (
        sectionIndex === index ? { ...section, [field]: value } : section
      ))
    }));
  };

  const handleEditToggle = () => {
    if (editing) {
      setContent(cloneAboutContent(savedContent));
      setSaveError('');
    }
    setEditing(previous => !previous);
  };

  const handleSave = async () => {
    if (!canEdit || !isDirty) return;

    try {
      setIsSaving(true);
      setSaveError('');
      const result = await putData('recruitment-about', content);
      if (!result || typeof result !== 'object') {
        throw new Error('The server returned invalid About Us content.');
      }
      const normalized = normalizeAboutContent(result);
      setContent(normalized);
      setSavedContent(cloneAboutContent(normalized));
      setEditing(false);
    } catch (error) {
      console.error('Failed to save About Us content:', error);
      setSaveError(error?.message || 'Failed to save About Us content.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section data-site-tab-id={siteTabMetadata?.id} data-site-tab-group={siteTabMetadata?.groupKey} className="theme-panel theme-panel-tab p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">{content.eyebrow}</p>
          <h2 className="text-2xl font-bold text-slate-100">{content.title}</h2>
          <p className="text-sm leading-6 text-slate-300 whitespace-pre-line">{content.intro}</p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={handleEditToggle}
            disabled={isLoading || isSaving}
            className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider text-white ${isLoading || isSaving ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-cyan-700 hover:bg-cyan-600'}`}
          >
            {editing ? 'Cancel' : 'Edit Content'}
          </button>
        )}
      </div>

      {isLoading && <p className="text-xs text-slate-500">Loading About Us content...</p>}
      {loadError && <p className="text-xs text-rose-400">{loadError}</p>}

      {editing ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-300">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Eyebrow</span>
              <input
                value={content.eyebrow}
                onChange={event => updateContent('eyebrow', event.target.value.slice(0, 80))}
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none"
              />
            </label>
            <label className="space-y-1 text-sm text-slate-300">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Title</span>
              <input
                value={content.title}
                onChange={event => updateContent('title', event.target.value.slice(0, 120))}
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none"
              />
            </label>
          </div>

          <label className="space-y-1 text-sm text-slate-300 block">
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Introduction</span>
            <textarea
              value={content.intro}
              onChange={event => updateContent('intro', event.target.value.slice(0, 1200))}
              rows={4}
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:outline-none"
            />
          </label>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Guild information</h3>
              <p className="mt-1 text-xs text-slate-500">Add Discord destinations for visitors. The application link is generated from the site navigation and is always available.</p>
            </div>
            <label className="space-y-1 text-sm text-slate-300 block">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Information title</span>
              <input
                value={content.guildInfo.title}
                onChange={event => updateContent('guildInfo', { ...content.guildInfo, title: event.target.value.slice(0, 120) })}
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:outline-none"
              />
            </label>
            <label className="space-y-1 text-sm text-slate-300 block">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Information text</span>
              <textarea
                value={content.guildInfo.body}
                onChange={event => updateContent('guildInfo', { ...content.guildInfo, body: event.target.value.slice(0, 1200) })}
                rows={3}
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:outline-none"
              />
            </label>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] uppercase tracking-wider text-slate-500">Discord links</span>
                <button
                  type="button"
                  disabled={content.guildInfo.discordLinks.length >= 4}
                  onClick={() => updateContent('guildInfo', {
                    ...content.guildInfo,
                    discordLinks: [...content.guildInfo.discordLinks, {
                      id: getNextDiscordLinkId(content.guildInfo.discordLinks),
                      label: 'Discord link',
                      url: ''
                    }]
                  })}
                  className="rounded bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add link
                </button>
              </div>
              {content.guildInfo.discordLinks.map((link, index) => (
                <div key={link.id} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1.5fr_auto]">
                  <input
                    value={link.label}
                    onChange={event => updateContent('guildInfo', {
                      ...content.guildInfo,
                      discordLinks: content.guildInfo.discordLinks.map((item, linkIndex) => linkIndex === index ? { ...item, label: event.target.value.slice(0, 80) } : item)
                    })}
                    aria-label={`Discord link ${index + 1} label`}
                    placeholder="Link label"
                    className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={event => updateContent('guildInfo', {
                      ...content.guildInfo,
                      discordLinks: content.guildInfo.discordLinks.map((item, linkIndex) => linkIndex === index ? { ...item, url: event.target.value.slice(0, 500) } : item)
                    })}
                    aria-label={`Discord link ${index + 1} URL`}
                    placeholder="https://discord.gg/..."
                    className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => updateContent('guildInfo', {
                      ...content.guildInfo,
                      discordLinks: content.guildInfo.discordLinks.filter((_, linkIndex) => linkIndex !== index)
                    })}
                    className="rounded bg-slate-800 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:bg-slate-700 hover:text-slate-100"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {content.sections.map((section, index) => (
              <div key={section.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 space-y-3">
                <label className="space-y-1 text-sm text-slate-300 block">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">Section title</span>
                  <input
                    value={section.title}
                    onChange={event => updateSection(index, 'title', event.target.value.slice(0, 80))}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-300 block">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">Section text</span>
                  <textarea
                    value={section.body}
                    onChange={event => updateSection(index, 'body', event.target.value.slice(0, 1200))}
                    rows={6}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </label>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={handleEditToggle} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-200">Discard</button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider ${isSaving || !isDirty ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-500 text-slate-900'}`}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          {saveError && <p className="text-xs text-rose-400">{saveError}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="theme-surface-raised rounded-xl p-4">
            <h3 className="text-sm font-bold text-slate-100">{content.guildInfo.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400 whitespace-pre-line">{content.guildInfo.body}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {content.guildInfo.discordLinks.filter(link => link.url).map(link => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-cyan-700/60 px-3 py-2 text-xs font-bold uppercase tracking-wider text-cyan-300 hover:border-cyan-500 hover:text-cyan-100"
                >
                  {link.label}
                </a>
              ))}
              <a
                href={getSiteTabUrl('recruitment.applications') || '#'}
                className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-amber-500"
              >
                Apply to join
              </a>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {content.sections.map(section => (
              <div key={section.id} className="theme-surface rounded-xl p-4">
                <h3 className="text-sm font-bold text-slate-100">{section.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400 whitespace-pre-line">{section.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
