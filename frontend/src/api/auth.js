import { api } from './axios.js';

const AUTH_KEYS = {
  TOKEN: 'token',
  USER: 'user',
};

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function register({ name, mobile, email, password, sponsorId = null }) {
  const body = { name, mobile, email, password };
  if (sponsorId && sponsorId.trim()) body.sponsorId = sponsorId.trim();
  const { data } = await api.post('/auth/register', body);
  return data;
}

export function setAuth(token, user) {
  if (token) localStorage.setItem(AUTH_KEYS.TOKEN, token);
  if (user) localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEYS.TOKEN);
  localStorage.removeItem(AUTH_KEYS.USER);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStoredToken() {
  return localStorage.getItem(AUTH_KEYS.TOKEN);
}

export function isAuthenticated() {
  return !!getStoredToken();
}

/**
 * Returns the dashboard path for a given role.
 * admin -> /admin/dashboard
 * user -> /user/dashboard
 */
export function getDashboardPathForRole(role) {
  if (role === 'admin') return '/admin/dashboard';
  return '/user/dashboard';
}
