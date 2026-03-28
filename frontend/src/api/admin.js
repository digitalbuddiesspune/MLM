import { api } from './axios.js';

export async function getMyTeam() {
  const { data } = await api.get('/user/team');
  return data;
}

export async function getBinaryTree(maxDepth = 6) {
  const { data } = await api.get('/user/binary-tree', { params: { maxDepth } });
  return data;
}

/** Referral tree: only users created with your referral ID (sponsorId chain). */
export async function getReferralTree(maxDepth = 6) {
  const { data } = await api.get('/user/referral-tree', { params: { maxDepth } });
  return data;
}

export async function getAdminStats() {
  const { data } = await api.get('/admin/stats');
  return data;
}

export async function getAdminUsers(params = {}) {
  const { data } = await api.get('/admin/users', { params });
  return data;
}

export async function updateUser(id, payload) {
  const { data } = await api.patch(`/admin/users/${id}`, payload);
  return data;
}

export async function deleteUser(id) {
  const { data } = await api.delete(`/admin/users/${id}`);
  return data;
}

export async function createProduct(payload) {
  const { data } = await api.post('/admin/products', payload);
  return data;
}

export async function updateProduct(id, payload) {
  const { data } = await api.patch(`/admin/products/${id}`, payload);
  return data;
}

export async function deleteProduct(id) {
  const { data } = await api.delete(`/admin/products/${id}`);
  return data;
}

export async function getAdminOrders(params = {}) {
  const { data } = await api.get('/admin/orders', { params });
  return data;
}

export async function getAdminUserWallets(params = {}) {
  const { data } = await api.get('/admin/user-wallets', { params });
  return data;
}

export async function getAdminWithdrawalRequests(params = {}) {
  const { data } = await api.get('/admin/withdrawal-requests', { params });
  return data;
}

export async function reviewAdminWithdrawalRequest(id, payload) {
  const { data } = await api.patch(`/admin/withdrawal-requests/${id}`, payload);
  return data;
}
