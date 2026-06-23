// Relative by default so requests are same-origin: nginx (Docker) and the Vite
// dev proxy both forward /api to the backend, avoiding CORS and port conflicts.
const DEFAULT_API_BASE_URL = '/api';
const DEFAULT_ADMIN_API_TOKEN = 'TBCOfficer2026!';

const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');

export const API_BASE_URL = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL);
export const ADMIN_API_TOKEN = import.meta.env.VITE_ADMIN_API_TOKEN || DEFAULT_ADMIN_API_TOKEN;
