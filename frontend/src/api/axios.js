import axios from 'axios';

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
  const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);
