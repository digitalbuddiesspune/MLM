import { api } from './axios.js';

export async function getMyTeam(params = {}) {
  const { data } = await api.get('/user/team', { params });
  return data;
}

/**
 * @param {{ maxDepth?: number | 'all' }} [opts]
 * Pass a numeric maxDepth (1–50) to limit server traversal; `'all'` or omit for full subtree.
 */
export async function getBinaryTree(opts = {}) {
  const params = {};
  if (opts?.maxDepth != null && opts.maxDepth !== 'all') {
    params.maxDepth = opts.maxDepth;
  }
  const { data } = await api.get('/user/binary-tree', { params });
  return data;
}

/** Referral tree: only users created with your referral ID (sponsorId chain). */
export async function getReferralTree(maxDepth = 6) {
  const { data } = await api.get('/user/referral-tree', { params: { maxDepth } });
  return data;
}

/** Admin: referral tree rooted at another user. */
export async function getAdminUserReferralTree(userId, maxDepth = 15) {
  const { data } = await api.get(`/admin/users/${userId}/referral-tree`, { params: { maxDepth } });
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

/** Single-user admin snapshot (profile, wallet, KYC, addresses, ledger, orders, withdrawals, binary stats). */
export async function getAdminUserDetail(id) {
  const { data } = await api.get(`/admin/users/${id}`);
  return data;
}

export async function getTreeById(id, params = {}) {
  const { data } = await api.get(`/tree/${id}`, { params });
  return data;
}

export async function placeTreeUser(payload) {
  const { data } = await api.post('/tree/place', payload);
  return data;
}

export async function manualPlaceTreeUser(payload) {
  const { data } = await api.post('/tree/manual-place', payload);
  return data;
}

export async function dragDropTreeUser(payload) {
  const { data } = await api.post('/tree/drag-drop', payload);
  return data;
}

export async function getTreePairs(id = 'me') {
  const { data } = await api.get(`/tree/pairs/${id}`);
  return data;
}

export async function getTreeIncome(id = 'me') {
  const { data } = await api.get(`/tree/income/${id}`);
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
