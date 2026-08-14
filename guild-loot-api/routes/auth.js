const express = require('express');
const crypto = require('crypto');
const {
  getBattleNetSessionFromRequest,
  createBattleNetSession,
  setBattleNetSessionCookie,
  clearBattleNetSession,
  issueSession,
  getBattleNetRoleForUser,
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

  function resolveBattleNetRedirectUri(req) {
    const configuredRedirectUri = BNET_REDIRECT_URI || process.env.REDIRECT_URI || '';
    if (configuredRedirectUri) {
      return configuredRedirectUri;
    }

    const forwardedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').trim();
    const forwardedProto = String(req.headers['x-forwarded-proto'] || req.protocol || (req.secure ? 'https' : 'http')).trim();

    if (forwardedHost) {
      const normalizedHost = forwardedHost.split(',')[0].trim();
      const hostname = normalizedHost.split(':')[0].toLowerCase();
      if (hostname && (['localhost', '127.0.0.1', '::1'].includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.test'))) {
        return `${forwardedProto}://${normalizedHost}/api/auth/bnet/callback`;
      }

      if (hostname) {
        return `${forwardedProto}://${normalizedHost}/api/auth/bnet/callback`;
      }
    }

    return '';
  }

  function resolveAppOrigin(req) {
    const originHeader = String(req.headers.origin || req.headers['x-forwarded-origin'] || '').trim();
    if (originHeader) {
      try {
        return new URL(originHeader).origin;
      } catch (error) {
        // Ignore malformed origins and continue with the next fallback.
      }
    }

    const refererHeader = String(req.headers.referer || '').trim();
    if (refererHeader) {
      try {
        return new URL(refererHeader).origin;
      } catch (error) {
        // Ignore malformed referrers and continue with the next fallback.
      }
    }

    const forwardedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').trim();
    const forwardedProto = String(req.headers['x-forwarded-proto'] || req.protocol || (req.secure ? 'https' : 'http')).trim();
    if (forwardedHost) {
      const normalizedHost = forwardedHost.split(',')[0].trim();
      return `${forwardedProto}://${normalizedHost}`.replace(/\/+$/, '');
    }

    if (SITE_URL) {
      try {
        return new URL(SITE_URL).origin;
      } catch (error) {
        // Ignore malformed site URLs.
      }
    }

    return '';
  }

  function resolveAuthRedirectTarget(req, outcome = 'success', session = null, reason = null) {
    const sessionOrigin = session?.origin || '';
    const baseOrigin = sessionOrigin || resolveAppOrigin(req) || '';
    const suffix = reason ? `&reason=${encodeURIComponent(reason)}` : '';
    if (baseOrigin) {
      return `${baseOrigin}/?auth=${outcome}${suffix}`;
    }

    return `/?auth=${outcome}${suffix}`;
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
    const initiatingOrigin = resolveAppOrigin(req);
    const { token } = createBattleNetSession({ state, pendingLogin: true, origin: initiatingOrigin || null });
    setBattleNetSessionCookie(res, token);

    const redirectUri = resolveBattleNetRedirectUri(req);
    const query = new URLSearchParams({
      response_type: 'code',
      client_id: BNET_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'openid wow.profile',
      state
    });

    return res.redirect(`${BNET_AUTHORIZE_URL}?${query.toString()}`);
  });

  router.get('/auth/bnet/callback', async (req, res) => {
    try {
      const session = getBattleNetSessionFromRequest(req);
      if (!isBattleNetAuthConfigured()) {
        return res.redirect(resolveAuthRedirectTarget(req, 'failed', session, 'missing-config'));
      }

      const code = String(req.query.code || '').trim();
      const state = String(req.query.state || '').trim();
      console.log('[DEBUG] Battle.net callback', {
        codePresent: Boolean(code),
        state,
        sessionState: session?.state || null,
        cookieHeader: req.headers.cookie || null,
        host: req.headers.host || null,
        path: req.path
      });
      if (!code || !state || !session?.state || state !== session.state) {
        const reason = !code ? 'missing-code' : !state ? 'missing-state' : !session?.state ? 'missing-session-state' : 'state-mismatch';
        console.log('[DEBUG] Battle.net callback rejected', {
          reason,
          sessionState: session?.state || null,
          state,
          cookieHeader: req.headers.cookie || null,
          host: req.headers.host || null,
          path: req.path
        });
        return res.redirect(resolveAuthRedirectTarget(req, 'failed', session, reason));
      }

      const tokenData = await exchangeBattleNetToken({
        grant_type: 'authorization_code',
        code,
        redirect_uri: resolveBattleNetRedirectUri(req)
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
        expiresAt: Date.now() + (Number(tokenData.expires_in || 0) * 1000),
        origin: session?.origin || null
      });
      setBattleNetSessionCookie(res, token);

      return res.redirect(resolveAuthRedirectTarget(req, 'success', session));
    } catch (error) {
      const rootCause = String(error.message || error);
      console.error('Battle.net OAuth callback failed:', rootCause);
      return res.redirect(resolveAuthRedirectTarget(req, 'failed', getBattleNetSessionFromRequest(req), rootCause));
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

    const role = getBattleNetRoleForUser(db, user.id);
    const roles = role ? [role] : [];

    return res.json({
      authenticated: true,
      user: {
        id: user.id,
        battletag: user.battletag,
        blizzardId: user.blizzard_id,
        createdAt: user.created_at
      },
      roles,
      isOfficer: role === 'officer' || role === 'admin',
      isAdmin: role === 'admin',
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
