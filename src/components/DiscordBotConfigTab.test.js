import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { SITE_TABS } from '../config/siteRegistry.js';

test('Config offers every registered site tab as a default destination', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: DiscordBotConfigTab } = await server.ssrLoadModule('/src/components/DiscordBotConfigTab.jsx');
    const html = renderToStaticMarkup(createElement(DiscordBotConfigTab, {
      config: {},
      setConfig: () => {},
      discordRoles: [],
      hasUnsavedChanges: false,
      onSaveChanges: () => {},
      isSaving: false,
      claims: [],
      onUnclaimClaim: () => {},
      roster: [],
      specsByName: {},
      getDisplayFromId: () => '',
      scoringConfig: { defaultSiteTab: 'recruitment.focus' },
      setScoringConfig: () => {},
      bnetAuthState: { authenticated: false },
      bnetAccessRoles: [],
      bnetAccessRoleCandidates: [],
      bnetAccessRolesDirty: false,
      onSetBnetAccessRole: () => {},
      onRemoveBnetAccessRole: () => {},
      onSaveBnetAccessRoles: () => {},
      isSavingBnetAccessRoles: false
    }));

    SITE_TABS.forEach(tab => {
      assert.ok(html.includes(`value="${tab.id}"`), `Missing default-tab option for ${tab.id}`);
    });
    assert.match(html, /value="Forever">Forever<\/option>/);
    assert.match(html, /value="TBC">TBC<\/option>/);
  } finally {
    await server.close();
  }
});
