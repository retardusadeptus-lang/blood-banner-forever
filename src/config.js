// Relative by default so requests are same-origin: nginx (Docker) and the Vite
// dev proxy both forward /api to the backend, avoiding CORS and port conflicts.
const DEFAULT_API_BASE_URL = '/api';

const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');

export const API_BASE_URL = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL);
// ADMIN_API_TOKEN removed — auth now goes through POST /api/login; the browser
// only ever holds a short-lived session token, never the admin secret.
