const crypto = require('crypto');

const BNET_SESSION_COOKIE_NAME = 'wow_loot_bnet_sid';
const BNET_AUTH_SESSIONS = new Map();

function parsePositiveNumber(rawValue, fallbackValue) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallbackValue;
  return parsed;
}

function getBattleNetSessionTtlMs() {
  const ttlHours = parsePositiveNumber(process.env.BNET_SESSION_TTL_HOURS, 12);
  return Math.round(ttlHours * 60 * 60 * 1000);
}

function normalizeBattletag(value) {
  return String(value || '').trim().toLowerCase();
}

function getConfiguredPrimaryAdminBattletag() {
  return normalizeBattletag(process.env.BNET_PRIMARY_ADMIN_BATTLETAG || process.env.PRIMARY_ADMIN_BATTLETAG || '');
}

function isPrimaryAdminBattletag(battletag) {
  const configured = getConfiguredPrimaryAdminBattletag();
  if (!configured) return false;
  return normalizeBattletag(battletag) === configured;
}

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
  const cookieParts = [`${BNET_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`, 'Path=/', 'HttpOnly'];
  cookieParts.push('SameSite=Lax');
  cookieParts.push(`Max-Age=${Math.floor(getBattleNetSessionTtlMs() / 1000)}`);
  res.setHeader('Set-Cookie', cookieParts.join('; '));
}

function clearBattleNetSession(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[BNET_SESSION_COOKIE_NAME];
  if (token) {
    BNET_AUTH_SESSIONS.delete(token);
  }
  const clearParts = [`${BNET_SESSION_COOKIE_NAME}=`, 'Path=/', 'Max-Age=0', 'HttpOnly'];
  clearParts.push('SameSite=Lax');
  res.setHeader('Set-Cookie', clearParts.join('; '));
}

function createBattleNetSession(sessionData) {
  const token = crypto.randomBytes(24).toString('hex');
  const session = { ...sessionData, expiresAt: Date.now() + getBattleNetSessionTtlMs() };
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

function getBattleNetRoleForUser(db, userId) {
  const numericUserId = Number(userId || 0);
  if (!db || !numericUserId) return null;
  try {
    const user = db.prepare('SELECT battletag FROM users WHERE id = ?').get(numericUserId);
    if (user && isPrimaryAdminBattletag(user.battletag)) {
      return 'admin';
    }

    const row = db.prepare('SELECT role FROM bnet_user_roles WHERE user_id = ?').get(numericUserId);
    const role = String(row?.role || '').toLowerCase();
    if (role === 'admin' || role === 'officer' || role === 'guild_member') return role;
  } catch (error) {
    console.error('[ERROR] Failed to read Battle.net role:', error.message);
  }
  return null;
}

function isPrimaryAdminUserId(db, userId) {
  const numericUserId = Number(userId || 0);
  if (!db || !numericUserId) return false;
  try {
    const row = db.prepare('SELECT battletag FROM users WHERE id = ?').get(numericUserId);
    return isPrimaryAdminBattletag(row?.battletag || '');
  } catch (error) {
    console.error('[ERROR] Failed to resolve primary admin user:', error.message);
    return false;
  }
}

function getBattleNetRoleFromRequest(req, db) {
  const session = getBattleNetSessionFromRequest(req);
  const role = getBattleNetRoleForUser(db, session?.userId);
  return {
    session,
    role,
    isOfficer: role === 'officer' || role === 'admin',
    isAdmin: role === 'admin'
  };
}

function hasOfficerAccess(req, { sessionSecret, db }) {
  const token = extractAdminToken(req);
  if (verifySession(token, sessionSecret)) return true;
  const roleInfo = getBattleNetRoleFromRequest(req, db);
  return !!roleInfo.isOfficer;
}

function hasAdminAccess(req, { sessionSecret, db }) {
  const token = extractAdminToken(req);
  if (verifySession(token, sessionSecret)) return true;
  const roleInfo = getBattleNetRoleFromRequest(req, db);
  return !!roleInfo.isAdmin;
}

function requireOfficerAccess({ sessionSecret, db }) {
  return (req, res, next) => {
    if (!hasOfficerAccess(req, { sessionSecret, db })) {
      return res.status(401).json({ error: 'Officer authentication required' });
    }
    return next();
  };
}

function requireAdminAccess({ sessionSecret, db }) {
  return (req, res, next) => {
    if (!hasAdminAccess(req, { sessionSecret, db })) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }
    return next();
  };
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

function createWriteGuard(sessionSecret, db) {
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

    if (/^\/api\/raid-signup-absences(?:\/[A-Za-z0-9-]+)?$/.test(req.path)) {
      const bnetSession = getBattleNetSessionFromRequest(req);
      if (bnetSession?.userId) {
        return next();
      }
    }

    if (req.method === 'POST' && /^\/api\/raid-signup-events\/\d+\/signup$/.test(req.path)) {
      const bnetSession = getBattleNetSessionFromRequest(req);
      if (bnetSession?.userId) {
        return next();
      }
    }

    if (req.method === 'POST' && /\/bank-requests$/.test(req.path)) {
      return next();
    }

    if (req.method === 'POST' && req.path === '/api/login') {
      return next();
    }

    if (req.method === 'POST' && req.path === '/api/recruitment-applications') {
      const bnetSession = getBattleNetSessionFromRequest(req);
      if (bnetSession?.userId) {
        return next();
      }
    }

    if (/^\/api\/profiles(?:\/\d+)?$/.test(req.path)) {
      const bnetSession = getBattleNetSessionFromRequest(req);
      if (bnetSession?.userId) {
        return next();
      }
    }

    const token = extractAdminToken(req);
    const tokenAuthorized = verifySession(token, sessionSecret);
    if (!tokenAuthorized) {
      const roleInfo = getBattleNetRoleFromRequest(req, db);
      if (roleInfo.isOfficer) {
        return next();
      }
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
  requireOfficerAccess,
  requireAdminAccess,
  hasOfficerAccess,
  hasAdminAccess,
  normalizeBattletag,
  isPrimaryAdminBattletag,
  isPrimaryAdminUserId,
  getConfiguredPrimaryAdminBattletag,
  getBattleNetRoleForUser,
  getBattleNetRoleFromRequest,
  createWriteGuard,
  safeEqual
};
