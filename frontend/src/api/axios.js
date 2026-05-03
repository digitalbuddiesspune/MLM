import axios from 'axios';
import { queryClient } from '../queryClient.js';

/** Keep in sync with AUTH_KEYS in auth.js */
const LS_TOKEN = 'token';
const LS_USER = 'user';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const GUEST_ID_KEY = 'guest_id';

function getGuestId() {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(LS_TOKEN);
  const guestId = getGuestId();
  config.headers['x-guest-id'] = guestId;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.error;
    if (status === 401 && (message === 'Invalid or expired token' || message === 'Invalid token')) {
      localStorage.removeItem(LS_TOKEN);
      localStorage.removeItem(LS_USER);
      queryClient.clear();
    }
    return Promise.reject(error);
  }
);
