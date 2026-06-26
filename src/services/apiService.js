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