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