// ============================================================
// GUILD LOOT SYSTEM - API NETWORK SERVICE
// ============================================================

import { API_BASE_URL } from '../config';

export const apiUrl = (endpoint) => `${API_BASE_URL}/${endpoint}`;

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('ar-auth-token');
  return token ? { 'x-admin-token': token } : {};
};

const readResponsePayload = async (res) => {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const buildApiError = (res, payload, fallbackMessage) => {
  const normalizedPayload = payload && typeof payload === 'object' && payload !== null && 'error' in payload
    ? payload
    : (typeof payload === 'string' ? { error: payload, raw: payload } : {});

  const message = normalizedPayload.error || fallbackMessage;
  const error = new Error(message);
  error.status = res.status;
  error.payload = normalizedPayload;
  return error;
};

/**
 * Exchange the admin password for a session token. Returns the token string on
 * success, or null on failure. The password is verified server-side and never
 * stored in the browser.
 * @param {string} password
 */
export const login = async (password) => {
  const res = await fetch(apiUrl('login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const payload = await readResponsePayload(res);
  if (!res.ok) return null;
  if (payload && typeof payload === 'object' && 'token' in payload) {
    return payload.token;
  }
  return typeof payload === 'string' ? payload : null;
};

/**
 * Standard GET request to fetch data from the server
 * @param {string} endpoint - The API endpoint (e.g., 'specs', 'roster')
 */
export const fetchData = async (endpoint) => {
  const res = await fetch(apiUrl(endpoint), {
    credentials: 'include',
    headers: { ...getAuthHeaders() }
  });
  const payload = await readResponsePayload(res);
  if (!res.ok) {
    throw buildApiError(res, payload, `Network response was not ok for endpoint: ${endpoint}`);
  }
  return payload;
};

/**
 * Standard PUT request to update data on the server
 * @param {string} endpoint - The API endpoint (e.g., 'roster', 'scoring-config')
 * @param {any} data - The payload to send to the server
 */
export const putData = async (endpoint, data) => {
  const res = await fetch(apiUrl(endpoint), {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data)
  });
  const payload = await readResponsePayload(res);
  if (!res.ok) {
    throw buildApiError(res, payload, `Network response was not ok for update on endpoint: ${endpoint}`);
  }
  return payload;
};

/**
 * Standard POST request to create data on the server
 * @param {string} endpoint - The API endpoint (e.g., 'items')
 * @param {any} data - The payload to send to the server
 */
export const postData = async (endpoint, data) => {
  const res = await fetch(apiUrl(endpoint), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data)
  });
  const payload = await readResponsePayload(res);
  if (!res.ok) {
    throw buildApiError(res, payload, `Network response was not ok for create on endpoint: ${endpoint}`);
  }
  return payload;
};

/**
 * Standard DELETE request to remove data on the server
 * @param {string} endpoint - The API endpoint (e.g., 'items/42')
 */
export const deleteData = async (endpoint) => {
  const res = await fetch(apiUrl(endpoint), {
    method: 'DELETE',
    credentials: 'include',
    headers: { ...getAuthHeaders() }
  });
  const payload = await readResponsePayload(res);
  if (!res.ok) {
    throw buildApiError(res, payload, `Network response was not ok for delete on endpoint: ${endpoint}`);
  }
  return payload;
};

const getSessionFetchOptions = (method = 'GET', data) => {
  const opts = {
    method,
    credentials: 'include'
  };

  if (data !== undefined) {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(data);
  }

  return opts;
};

export const getBattleNetAuthMe = async () => {
  const res = await fetch(apiUrl('auth/me'), getSessionFetchOptions('GET'));
  const payload = await readResponsePayload(res);
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to fetch authenticated Battle.net user.');
  }
  return payload;
};

export const startBattleNetLogin = () => {
  window.location.href = apiUrl('auth/bnet');
};

export const logoutBattleNet = async () => {
  const res = await fetch(apiUrl('auth/logout'), getSessionFetchOptions('POST', {}));
  const payload = await readResponsePayload(res);
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to log out from Battle.net session.');
  }
  return payload;
};

export const getBattleNetCharacters = async () => {
  const res = await fetch(apiUrl('profile/characters'), getSessionFetchOptions('GET'));
  const payload = await readResponsePayload(res);
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to fetch Battle.net characters.');
  }
  return payload;
};

export const getBattleNetCharactersDebug = async () => {
  const res = await fetch(apiUrl('profile/characters-debug'), getSessionFetchOptions('GET'));
  const payload = await readResponsePayload(res);
  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to fetch Battle.net character diagnostics.');
  }
  return payload;
};

export const claimRosterCharacter = async (payload) => {
  const res = await fetch(apiUrl('roster/claim'), getSessionFetchOptions('POST', payload));
  const data = await readResponsePayload(res);
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to claim roster character.');
  }
  return data;
};

export const claimRosterCharacterManual = async (payload) => {
  const res = await fetch(apiUrl('roster/claim-manual'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload || {})
  });
  const data = await readResponsePayload(res);
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to claim roster character from fallback list.');
  }
  return data;
};

export const getRosterClaimsAdmin = async () => {
  const res = await fetch(apiUrl('roster/claims'), {
    method: 'GET',
    credentials: 'include',
    headers: { ...getAuthHeaders() }
  });
  const data = await readResponsePayload(res);
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to fetch claimed roster links.');
  }
  return data;
};

export const unclaimRosterCharacterAdmin = async (payload) => {
  const res = await fetch(apiUrl('roster/unclaim'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload)
  });
  const data = await readResponsePayload(res);
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to unclaim roster character.');
  }
  return data;
};

export const getRosterClaimAuditAdmin = async (limit = 50) => {
  const res = await fetch(apiUrl(`roster/claim-audit?limit=${encodeURIComponent(limit)}`), {
    method: 'GET',
    credentials: 'include',
    headers: { ...getAuthHeaders() }
  });
  const data = await readResponsePayload(res);
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to fetch claim audit log.');
  }
  return data;
};

export const getRaidSignupAbsences = async () => {
  const res = await fetch(apiUrl('raid-signup-absences'), {
    method: 'GET',
    credentials: 'include',
    headers: { ...getAuthHeaders() }
  });
  const payload = await readResponsePayload(res);
  if (!res.ok) {
    throw buildApiError(res, payload, 'Failed to fetch raid signup absences.');
  }
  return payload;
};

export const getRaidSignupAbsenceTargets = async () => {
  const res = await fetch(apiUrl('raid-signup-absence-targets'), {
    method: 'GET',
    credentials: 'include',
    headers: { ...getAuthHeaders() }
  });
  const payload = await readResponsePayload(res);
  if (!res.ok) {
    throw buildApiError(res, payload, 'Failed to fetch raid signup absence targets.');
  }
  return payload;
};

export const createRaidSignupAbsence = async (data) => {
  const res = await fetch(apiUrl('raid-signup-absences'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data || {})
  });
  const payload = await readResponsePayload(res);
  if (!res.ok) {
    throw buildApiError(res, payload, 'Failed to create raid signup absence.');
  }
  return payload;
};

export const updateRaidSignupAbsence = async (absenceId, data) => {
  const res = await fetch(apiUrl(`raid-signup-absences/${absenceId}`), {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data || {})
  });
  const payload = await readResponsePayload(res);
  if (!res.ok) {
    throw buildApiError(res, payload, 'Failed to update raid signup absence.');
  }
  return payload;
};

export const deleteRaidSignupAbsence = async (absenceId) => {
  const res = await fetch(apiUrl(`raid-signup-absences/${absenceId}`), {
    method: 'DELETE',
    credentials: 'include',
    headers: { ...getAuthHeaders() }
  });
  const payload = await readResponsePayload(res);
  if (!res.ok) {
    throw buildApiError(res, payload, 'Failed to delete raid signup absence.');
  }
  return payload;
};

export const submitBankRequest = async (data) => {
  const res = await fetch(apiUrl('bank-requests'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data || {})
  });
  const payload = await readResponsePayload(res);
  if (!res.ok) {
    throw buildApiError(res, payload, 'Failed to submit bank request.');
  }
  return payload;
};