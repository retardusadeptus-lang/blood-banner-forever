const express = require('express');
const { hasOfficerAccess } = require('../middleware/auth');

const ABOUT_CONTENT_LIMITS = {
  eyebrow: 80,
  title: 120,
  intro: 1200,
  sectionTitle: 80,
  sectionBody: 1200,
  guildInfoTitle: 120,
  guildInfoBody: 1200,
  linkLabel: 80,
  linkUrl: 500,
  maxDiscordLinks: 4
};

const DEFAULT_RECRUITMENT_ABOUT = {
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

function sanitizeText(value, maxLength, fallback = '') {
  return String(value ?? fallback).replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function sanitizeMultilineText(value, maxLength, fallback = '') {
  return String(value ?? fallback).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().slice(0, maxLength);
}

function sanitizeExternalUrl(value) {
  const candidate = sanitizeText(value, ABOUT_CONTENT_LIMITS.linkUrl);
  if (!candidate) return '';

  try {
    const url = new URL(candidate);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

function getUniqueDiscordLinkId(value, index, usedIds) {
  const baseId = sanitizeText(value || `discord-${index + 1}`, 40, `discord-${index + 1}`);
  let id = baseId;
  let suffix = 2;
  while (usedIds.has(id)) {
    id = `${baseId.slice(0, 37)}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(id);
  return id;
}

function normalizeRecruitmentAbout(value) {
  const source = value && typeof value === 'object' ? value : {};
  const sections = Array.isArray(source.sections) ? source.sections : [];
  const guildInfoSource = source.guildInfo && typeof source.guildInfo === 'object' ? source.guildInfo : {};
  const discordLinks = Array.isArray(guildInfoSource.discordLinks)
    ? guildInfoSource.discordLinks
    : DEFAULT_RECRUITMENT_ABOUT.guildInfo.discordLinks;
  const usedDiscordLinkIds = new Set();

  return {
    eyebrow: sanitizeText(source.eyebrow, ABOUT_CONTENT_LIMITS.eyebrow, DEFAULT_RECRUITMENT_ABOUT.eyebrow),
    title: sanitizeText(source.title, ABOUT_CONTENT_LIMITS.title, DEFAULT_RECRUITMENT_ABOUT.title),
    intro: sanitizeMultilineText(source.intro, ABOUT_CONTENT_LIMITS.intro, DEFAULT_RECRUITMENT_ABOUT.intro),
    sections: DEFAULT_RECRUITMENT_ABOUT.sections.map((defaultSection, index) => {
      const section = sections[index] || {};
      return {
        id: defaultSection.id,
        title: sanitizeText(section.title, ABOUT_CONTENT_LIMITS.sectionTitle, defaultSection.title),
        body: sanitizeMultilineText(section.body, ABOUT_CONTENT_LIMITS.sectionBody, defaultSection.body)
      };
    }),
    guildInfo: {
      title: sanitizeText(guildInfoSource.title, ABOUT_CONTENT_LIMITS.guildInfoTitle, DEFAULT_RECRUITMENT_ABOUT.guildInfo.title),
      body: sanitizeMultilineText(guildInfoSource.body, ABOUT_CONTENT_LIMITS.guildInfoBody, DEFAULT_RECRUITMENT_ABOUT.guildInfo.body),
      discordLinks: discordLinks.slice(0, ABOUT_CONTENT_LIMITS.maxDiscordLinks).map((link, index) => ({
        id: getUniqueDiscordLinkId(link?.id, index, usedDiscordLinkIds),
        label: sanitizeText(link?.label, ABOUT_CONTENT_LIMITS.linkLabel, `Discord link ${index + 1}`),
        url: sanitizeExternalUrl(link?.url)
      }))
    }
  };
}

function readRecruitmentAbout(db) {
  const row = db.prepare('SELECT data_json FROM recruitment_about_config WHERE id = 1').get();
  if (!row?.data_json) return normalizeRecruitmentAbout();

  try {
    return normalizeRecruitmentAbout(JSON.parse(row.data_json));
  } catch (error) {
    console.error('Failed to parse recruitment About Us content:', error.message || error);
    return normalizeRecruitmentAbout();
  }
}

function buildRecruitmentAboutRoutes({ db, sessionSecret }) {
  const router = express.Router();

  router.get('/recruitment-about', (req, res) => {
    try {
      return res.json(readRecruitmentAbout(db));
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to load About Us content.' });
    }
  });

  router.put('/recruitment-about', (req, res) => {
    if (!hasOfficerAccess(req, { sessionSecret, db })) {
      return res.status(401).json({ error: 'Officer authentication required.' });
    }

    try {
      const content = normalizeRecruitmentAbout(req.body);
      db.prepare(`
        INSERT INTO recruitment_about_config (id, data_json, updated_at)
        VALUES (1, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json, updated_at = CURRENT_TIMESTAMP
      `).run(JSON.stringify(content));
      return res.json(content);
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Failed to save About Us content.' });
    }
  });

  return router;
}

module.exports = buildRecruitmentAboutRoutes;
module.exports.DEFAULT_RECRUITMENT_ABOUT = DEFAULT_RECRUITMENT_ABOUT;
module.exports.normalizeRecruitmentAbout = normalizeRecruitmentAbout;
