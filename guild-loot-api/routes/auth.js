const express = require('express');
const crypto = require('crypto');
const {
  getBattleNetSessionFromRequest,
  createBattleNetSession,
  setBattleNetSessionCookie,
  clearBattleNetSession,
  issueSession,
  requireOfficerAuth,
  safeEqual
} = require('../middleware/auth');

const router = express.Router();

function buildAuthRoutes({ db, sessionSecret, bnetConfig }) {
  const { BNET_CLIENT_ID, BNET_CLIENT_SECRET, BNET_REDIRECT_URI, BNET_AUTHORIZE_URL, BNET_TOKEN_URL, BNET_USERINFO_URL, BNET_API_BASE_URL, BNET_LOCALE, SITE_URL, ADMIN_API_TOKEN } = bnetConfig;

  const isBattleNetAuthConfigured = () => Boolean(BNET_CLIENT_ID && BNET_CLIENT_SECRET && BNET_REDIRECT_URI);

  async function exchangeBattleNetToken(params) {
    const basicToken = Buffer.from(`${BNET_CLIENT_ID}:${BNET_CLIENT_SECRET}`).toString('base64');
    const response = await fetch(BNET_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(params)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`Battle.net token exchange failed (${response.status}): ${data.error_description || data.error || 'unknown error'}`);
    }
    return data;
  }

  async function fetchBattleNetUserInfo(accessToken) {
    const response = await fetch(BNET_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`Battle.net userinfo fetch failed (${response.status}): ${data.error || 'unknown error'}`);
    }
    return data;
  }

  function resolveAuthRedirectTarget(req, outcome = 'success') {
    const redirectUriCandidates = [BNET_REDIRECT_URI, process.env.REDIRECT_URI].filter(Boolean);
    for (const redirectUri of redirectUriCandidates) {
      try {
        const parsed = new URL(redirectUri);
        const hostname = String(parsed.hostname || '').toLowerCase();
        if (['localhost', '127.0.0.1', '::1'].includes(hostname)) {
          return `${parsed.origin}/?auth=${outcome}`;
        }
      } catch (error) {
        // Ignore malformed redirect URIs and fall back to the request host.
      }
    }

    const forwardedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').trim();
    const forwardedProto = String(req.headers['x-forwarded-proto'] || 'http').trim();
    if (forwardedHost) {
      const normalizedHost = forwardedHost.split(',')[0].trim();
      const requestOrigin = `${forwardedProto}://${normalizedHost}`;
      return `${requestOrigin.replace(/\/+$/, '')}/?auth=${outcome}`;
    }

    if (SITE_URL) {
      return `${SITE_URL.replace(/\/+$/, '')}/?auth=${outcome}`;
    }

    return `/?auth=${outcome}`;
  }

  function upsertBattleNetUser({ battletag, blizzardId }) {
    const existing = db.prepare('SELECT id, battletag, blizzard_id FROM users WHERE lower(battletag) = lower(?) OR blizzard_id = ? LIMIT 1').get(battletag, blizzardId);
    if (existing) {
      db.prepare('UPDATE users SET battletag = ?, blizzard_id = ? WHERE id = ?').run(battletag, blizzardId, existing.id);
      return db.prepare('SELECT id, battletag, blizzard_id FROM users WHERE id = ?').get(existing.id);
    }

    const info = db.prepare('INSERT INTO users (battletag, blizzard_id) VALUES (?, ?)').run(battletag, blizzardId);
    return db.prepare('SELECT id, battletag, blizzard_id FROM users WHERE id = ?').get(info.lastInsertRowid);
  }

  function getClaimedCharactersForUser(userId) {
    const rows = db.prepare('SELECT id, name FROM roster WHERE user_id = ? ORDER BY name COLLATE NOCASE').all(userId);
    return rows.map(row => ({ rosterId: row.id, rosterName: row.name }));
  }

  router.get('/auth/bnet', (req, res) => {
    if (!isBattleNetAuthConfigured()) {
      return res.status(500).json({ error: 'Battle.net OAuth is not configured on this server.' });
    }

    const state = crypto.randomBytes(24).toString('hex');
    const { token } = createBattleNetSession({ state, pendingLogin: true });
    setBattleNetSessionCookie(res, token);

    const query = new URLSearchParams({
      response_type: 'code',
      client_id: BNET_CLIENT_ID,
      redirect_uri: BNET_REDIRECT_URI,
      scope: 'openid wow.profile',
      state
    });

    return res.redirect(`${BNET_AUTHORIZE_URL}?${query.toString()}`);
  });

  router.get('/auth/bnet/callback', async (req, res) => {
    try {
      if (!isBattleNetAuthConfigured()) {
        return res.redirect(resolveAuthRedirectTarget(req, 'failed'));
      }

      const code = String(req.query.code || '').trim();
      const state = String(req.query.state || '').trim();
      const session = getBattleNetSessionFromRequest(req);
      if (!code || !state || !session?.state || state !== session.state) {
        return res.redirect(resolveAuthRedirectTarget(req, 'failed'));
      }

      const tokenData = await exchangeBattleNetToken({
        grant_type: 'authorization_code',
        code,
        redirect_uri: BNET_REDIRECT_URI
      });

      const userInfo = await fetchBattleNetUserInfo(tokenData.access_token);
      const battletag = String(userInfo?.battletag || userInfo?.battle_tag || '').trim();
      const blizzardId = String(userInfo?.sub || userInfo?.id || '').trim();

      if (!battletag || !blizzardId) {
        throw new Error('Battle.net user profile is missing battletag or id');
      }

      const user = upsertBattleNetUser({ battletag, blizzardId });
      const { token } = createBattleNetSession({
        userId: user.id,
        battletag: user.battletag,
        blizzardId: user.blizzard_id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        expiresAt: Date.now() + (Number(tokenData.expires_in || 0) * 1000)
      });
      setBattleNetSessionCookie(res, token);

      return res.redirect(resolveAuthRedirectTarget(req, 'success'));
    } catch (error) {
      console.error('Battle.net OAuth callback failed:', error.message || error);
      return res.redirect(resolveAuthRedirectTarget(req, 'failed'));
    }
  });

  router.post('/auth/logout', (req, res) => {
    clearBattleNetSession(req, res);
    return res.json({ ok: true });
  });

  router.get('/auth/me', (req, res) => {
    const session = getBattleNetSessionFromRequest(req);
    if (!session?.userId) {
      return res.json({ authenticated: false });
    }

    const user = db.prepare('SELECT id, battletag, blizzard_id, created_at FROM users WHERE id = ?').get(session.userId);
    if (!user) {
      clearBattleNetSession(req, res);
      return res.json({ authenticated: false });
    }

    return res.json({
      authenticated: true,
      user: {
        id: user.id,
        battletag: user.battletag,
        blizzardId: user.blizzard_id,
        createdAt: user.created_at
      },
      claimedCharacters: getClaimedCharactersForUser(user.id)
    });
  });

  router.post('/login', (req, res) => {
    const { password } = req.body || {};
    if (!password || !safeEqual(password, ADMIN_API_TOKEN)) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    res.json({ token: issueSession(sessionSecret) });
  });

  return router;
}

module.exports = buildAuthRoutes;
