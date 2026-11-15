import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('claim modal surfaces Forever characters when that game version is selected', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { default: BnetClaimModal } = await server.ssrLoadModule('/src/components/BnetClaimModal.jsx');
    const html = renderToStaticMarkup(createElement(BnetClaimModal, {
      open: true,
      isAuthenticated: true,
      isLoading: false,
      selectedGameVersion: 'forever',
      characters: [
        { name: 'Forever Hero', realmName: 'Azeroth', gameVersion: 'Forever' },
        { name: 'TBC Hero', realmName: 'Azeroth', gameVersion: 'TBC' }
      ],
      roster: [
        { id: 1, name: 'Forever Hero' },
        { id: 2, name: 'TBC Hero' }
      ],
      claimedRosterNames: new Set(),
      onClose: () => {},
      onClaim: () => {},
      onManualClaim: () => {},
      onLogin: () => {},
      onLogout: () => {}
    }));

    assert.match(html, /Forever Hero/);
    assert.doesNotMatch(html, /TBC Hero/);
  } finally {
    await server.close();
  }
});
