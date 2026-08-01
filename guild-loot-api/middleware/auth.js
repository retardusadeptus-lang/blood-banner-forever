const crypto = require('crypto');

const BNET_SESSION_COOKIE_NAME = 'wow_loot_bnet_sid';
const BNET_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const BNET_AUTH_SESSIONS = new Map();

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function issueSession(sessionSecret, ttlMs = 12 * 60 * 60 * 1000) {
  if (!sessionSecret) {
    throw new Error('Session secret is required to issue a session token.');
  }
  const payload = String(Date.now() + ttlMs);
  const sig = crypto.createHmac('sha256', sessionSecret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifySession(token, sessionSecret) {
  if (!token) return false;
  if (!sessionSecret) {
    console.error('[ERROR] verifySession called without sessionSecret');
    return false;
  }

  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;

  try {
    console.log('[DEBUG] verifySession', { token, payload, sig, sessionSecretType: typeof sessionSecret, sessionSecretLength: sessionSecret?.length });
    const expected = crypto.createHmac('sha256', sessionSecret).update(payload).digest('hex');
    if (!safeEqual(sig, expected)) return false;
  } catch (error) {
    console.error('[ERROR] verifySession failed:', error.message, { token, payload, sig, sessionSecretType: typeof sessionSecret, sessionSecretLength: sessionSecret?.length });
    return false;
  }

  return Date.now() < Number(payload);
}

function parseCookies(cookieHeader = '') {
  const output = {};
  if (!cookieHeader) return output;
  cookieHeader.split(';').map(part => part.trim()).filter(Boolean).forEach(part => {
    const divider = part.indexOf('=');
    if (divider === -1) return;
    const key = part.slice(0, divider);
    const value = decodeURIComponent(part.slice(divider + 1));
    output[key] = value;
  });
  return output;
}

function setBattleNetSessionCookie(res, token) {
  const cookieValue = `${BNET_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax`;
  res.setHeader('Set-Cookie', process.env.NODE_ENV === 'production' ? `${cookieValue}; Secure` : cookieValue);
}

function clearBattleNetSession(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[BNET_SESSION_COOKIE_NAME];
  if (token) {
    BNET_AUTH_SESSIONS.delete(token);
  }
  res.setHeader('Set-Cookie', `${BNET_SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
}

function createBattleNetSession(sessionData) {
  const token = crypto.randomBytes(24).toString('hex');
  const session = { ...sessionData, expiresAt: Date.now() + BNET_SESSION_TTL_MS };
  BNET_AUTH_SESSIONS.set(token, session);
  return { token, session };
}

function getBattleNetSessionFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[BNET_SESSION_COOKIE_NAME];
  if (!token) return null;
  const session = BNET_AUTH_SESSIONS.get(token);
  if (!session) return null;
  if (Date.now() > Number(session.expiresAt || 0)) {
    BNET_AUTH_SESSIONS.delete(token);
    return null;
  }
  return session;
}

function requireBattleNetAuth(req, res, next) {
  const session = getBattleNetSessionFromRequest(req);
  if (!session?.userId) {
    return res.status(401).json({ error: 'Battle.net authentication required' });
  }
  req.bnetSession = session;
  return next();
}

function extractAdminToken(req) {
  const header = req.get('x-admin-token') || req.get('authorization')?.replace(/^Bearer\s+/i, '');
  return header || null;
}

function requireOfficerAuth(sessionSecret) {
  return (req, res, next) => {
    const token = extractAdminToken(req);
    if (!verifySession(token, sessionSecret)) {
      return res.status(401).json({ error: 'Officer authentication required' });
    }
    return next();
  };
}

function createWriteGuard(sessionSecret) {
  console.log('[DEBUG] createWriteGuard initialized with sessionSecret defined?', !!sessionSecret);
  return (req, res, next) => {
    const isWriteMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
    if (!isWriteMethod) return next();

    console.log('[DEBUG] write guard checking', { path: req.path, method: req.method, tokenHeader: req.get('x-admin-token'), authHeader: req.get('authorization'), sessionSecretType: typeof sessionSecret });

    if (/^\/api\/auth\//.test(req.path)) {
      return next();
    }

    if (req.path === '/api/roster/claim' || req.path === '/api/roster/claim-manual') {
      return next();
    }

    if (req.method === 'POST' && /\/bank-requests$/.test(req.path)) {
      return next();
    }

    if (req.method === 'POST' && req.path === '/api/login') {
      return next();
    }

    const token = extractAdminToken(req);
    if (!verifySession(token, sessionSecret)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return next();
  };
}

module.exports = {
  issueSession,
  verifySession,
  getBattleNetSessionFromRequest,
  createBattleNetSession,
  setBattleNetSessionCookie,
  clearBattleNetSession,
  requireBattleNetAuth,
  requireOfficerAuth,
  createWriteGuard,
  safeEqual
};
