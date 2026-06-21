// ============================================================
// GUILD LOOT SYSTEM - API NETWORK SERVICE
// ============================================================

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Standard GET request to fetch data from the server
 * @param {string} endpoint - The API endpoint (e.g., 'specs', 'roster')
 */
export const fetchData = async (endpoint) => {
  const res = await fetch(`${API_BASE_URL}/${endpoint}`);
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
  const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
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
  const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    throw new Error(`Network response was not ok for delete on endpoint: ${endpoint}`);
  }
  return res.json();
};