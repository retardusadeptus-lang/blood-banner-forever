// ============================================================
// GUILD LOOT SYSTEM - API NETWORK SERVICE
// ============================================================

import { API_BASE_URL } from '../config';

export const apiUrl = (endpoint) => `${API_BASE_URL}/${endpoint}`;

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('ar-auth-token');
  return token ? { 'x-admin-token': token } : {};
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
  if (!res.ok) return null;
  const { token } = await res.json();
  return token;
};

/**
 * Standard GET request to fetch data from the server
 * @param {string} endpoint - The API endpoint (e.g., 'specs', 'roster')
 */
export const fetchData = async (endpoint) => {
  const res = await fetch(apiUrl(endpoint));
  if (!res.ok) {
    throw new Error(`Network response was not ok for endpoint: ${endpoint}`);
  }
  return res.json();
};

/**
 * Standard PUT request to update data on the server
 * @param {string} endpoint - The API endpoint (e.g., 'roster', 'scoring-config')
 * @param {any} data - The payload to send to the server
 */
export const putData = async (endpoint, data) => {
  const res = await fetch(apiUrl(endpoint), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    throw new Error(`Network response was not ok for update on endpoint: ${endpoint}`);
  }
  return res.json();
};

/**
 * Standard POST request to create data on the server
 * @param {string} endpoint - The API endpoint (e.g., 'items')
 * @param {any} data - The payload to send to the server
 */
export const postData = async (endpoint, data) => {
  const res = await fetch(apiUrl(endpoint), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    throw new Error(`Network response was not ok for create on endpoint: ${endpoint}`);
  }
  return res.json();
};

/**
 * Standard DELETE request to remove data on the server
 * @param {string} endpoint - The API endpoint (e.g., 'items/42')
 */
export const deleteData = async (endpoint) => {
  const res = await fetch(apiUrl(endpoint), {
    method: 'DELETE',
    headers: { ...getAuthHeaders() }
  });
  if (!res.ok) {
    throw new Error(`Network response was not ok for delete on endpoint: ${endpoint}`);
  }
  return res.json();
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
  if (!res.ok) {
    throw new Error('Failed to fetch authenticated Battle.net user.');
  }
  return res.json();
};

export const startBattleNetLogin = () => {
  window.location.href = apiUrl('auth/bnet');
};

export const logoutBattleNet = async () => {
  const res = await fetch(apiUrl('auth/logout'), getSessionFetchOptions('POST', {}));
  if (!res.ok) {
    throw new Error('Failed to log out from Battle.net session.');
  }
  return res.json();
};

export const getBattleNetCharacters = async () => {
  const res = await fetch(apiUrl('profile/characters'), getSessionFetchOptions('GET'));
  if (!res.ok) {
    throw new Error('Failed to fetch Battle.net characters.');
  }
  return res.json();
};

export const getBattleNetCharactersDebug = async () => {
  const res = await fetch(apiUrl('profile/characters-debug'), getSessionFetchOptions('GET'));
  if (!res.ok) {
    throw new Error('Failed to fetch Battle.net character diagnostics.');
  }
  return res.json();
};

export const claimRosterCharacter = async (payload) => {
  const res = await fetch(apiUrl('roster/claim'), getSessionFetchOptions('POST', payload));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to claim roster character.');
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
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to claim roster character from fallback list.');
  }
  return data;
};

export const getRosterClaimsAdmin = async () => {
  const res = await fetch(apiUrl('roster/claims'), {
    method: 'GET',
    headers: { ...getAuthHeaders() }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch claimed roster links.');
  }
  return data;
};

export const unclaimRosterCharacterAdmin = async (payload) => {
  const res = await fetch(apiUrl('roster/unclaim'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to unclaim roster character.');
  }
  return data;
};

export const getRosterClaimAuditAdmin = async (limit = 50) => {
  const res = await fetch(apiUrl(`roster/claim-audit?limit=${encodeURIComponent(limit)}`), {
    method: 'GET',
    headers: { ...getAuthHeaders() }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch claim audit log.');
  }
  return data;
};