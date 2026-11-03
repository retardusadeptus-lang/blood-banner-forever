const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const buildAuthRoutes = require('./auth');

function createApp() {
  const app = express();
  app.use('/api', buildAuthRoutes({
    db: {
      prepare() {
        return { get() { return null; }, all() { return []; }, run() { return { lastInsertRowid: 1 }; } };
      }
    },
    sessionSecret: 'test-secret',
    bnetConfig: {
      BNET_CLIENT_ID: 'client-id',
      BNET_CLIENT_SECRET: 'client-secret',
      BNET_REDIRECT_URI: 'http://localhost:4002/api/auth/bnet/callback',
      BNET_AUTHORIZE_URL: 'https://eu.battle.net/oauth/authorize',
      BNET_TOKEN_URL: 'https://eu.battle.net/oauth/token',
      BNET_USERINFO_URL: 'https://eu.battle.net/oauth/userinfo',
      BNET_API_BASE_URL: 'https://eu.api.blizzard.com',
      BNET_LOCALE: 'en_US',
      SITE_URL: 'http://localhost:3002/',
      ADMIN_API_TOKEN: 'admin-token'
    }
  }));
  return app;
}

test('uses the configured Battle.net redirect URI when the request arrives through a dev proxy', async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/bnet`, {
      headers: {
        'x-forwarded-host': 'localhost:3001',
        'x-forwarded-proto': 'http',
        host: 'localhost:4002'
      },
      redirect: 'manual'
    });

    assert.equal(response.status, 302);
    const location = response.headers.get('location');
    assert.match(location, /redirect_uri=http%3A%2F%2Flocalhost%3A4002%2Fapi%2Fauth%2Fbnet%2Fcallback/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('redirects back to the frontend origin captured during login', async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    const port = server.address().port;
    const startResponse = await fetch(`http://127.0.0.1:${port}/api/auth/bnet`, {
      headers: {
        origin: 'http://localhost:3001',
        host: 'localhost:4002'
      },
      redirect: 'manual'
    });

    const sessionCookie = startResponse.headers.get('set-cookie') || '';
    const location = startResponse.headers.get('location');
    assert.equal(startResponse.status, 302);
    assert.match(location, /https:\/\/eu\.battle\.net\/oauth\/authorize/);

    const stateMatch = location.match(/[?&]state=([^&]+)/);
    assert.ok(stateMatch, 'expected auth redirect to include a state parameter');
    const state = decodeURIComponent(stateMatch[1]);

    const callbackResponse = await fetch(`http://127.0.0.1:${port}/api/auth/bnet/callback?code=test-code&state=${encodeURIComponent(state)}`, {
      headers: {
        host: 'localhost:4002',
        cookie: sessionCookie
      },
      redirect: 'manual'
    });

    assert.equal(callbackResponse.status, 302);
    const callbackLocation = callbackResponse.headers.get('location');
    assert.match(callbackLocation, /^http:\/\/localhost:3001\/\?auth=failed&reason=/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
