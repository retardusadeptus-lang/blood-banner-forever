import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('Meet the Guild renders compact public profiles with roster roles but excludes private profiles', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: ProfilesMeetGuildTab, ProfileDetailModal } = await server.ssrLoadModule('/src/components/ProfilesMeetGuildTab.jsx');
    const backstory = `${'A long story that belongs in the modal. '.repeat(8)}Full modal ending.`;
    const html = renderToStaticMarkup(createElement(ProfilesMeetGuildTab, {
      profiles: [
        { id: 1, characterName: 'Public Mage', visibility: 'public', className: 'Mage', realm: 'Azeroth', backstory },
        { id: 2, characterName: 'Private Rogue', visibility: 'private', className: 'Rogue' }
      ],
      roster: [
        { name: 'Public Mage', guild_rank: 'Officer' }
      ],
      loading: false,
      error: ''
    }));

    assert.match(html, /Public Mage/);
    assert.match(html, /Guild role: Officer/);
    assert.doesNotMatch(html, /Azeroth/);
    assert.doesNotMatch(html, /Full modal ending/);
    assert.doesNotMatch(html, /Private Rogue/);

    const modalHtml = renderToStaticMarkup(createElement(ProfileDetailModal, {
      profile: {
        id: 1,
        characterName: 'Public Mage',
        className: 'Mage',
        realm: 'Azeroth',
        guildRole: 'Officer',
        backstory
      },
      onClose: () => {}
    }));
    assert.match(modalHtml, /Full modal ending/);
    assert.match(modalHtml, /Guild role: Officer/);
    assert.doesNotMatch(modalHtml, /Azeroth/);
  } finally {
    await server.close();
  }
});
