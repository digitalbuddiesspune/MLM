import { api } from './axios.js';

export async function getMyWallet() {
  const { data } = await api.get('/user/wallet');
  return data;
}

export async function getMySponsorTree(opts = {}) {
  const params = {};
  if (opts?.maxDepth != null && opts.maxDepth !== 'all') {
    params.maxDepth = opts.maxDepth;
  }
  if (opts?.maxDepth === 'all' || opts?.maxDepth === 'full') {
    params.maxDepth = 'all';
  }
  if (opts?.rootId) params.rootId = opts.rootId;
  if (opts?.format) params.format = opts.format;
  const { data } = await api.get('/user/binary-tree', { params });
  return data;
}

export async function getBinaryDashboard() {
  const { data } = await api.get('/user/binary-dashboard');
  return data;
}

export async function findBinaryTeamMember(referralNumber) {
  const { data } = await api.get('/user/binary-find', { params: { referralNumber } });
  return data;
}

export async function getBinaryGenealogy(memberId, params = {}) {
  const { data } = await api.get(`/user/binary-genealogy/${encodeURIComponent(memberId)}`, { params });
  return data;
}

export async function placeMyReferralInTree(payload) {
  const { data } = await api.post('/tree/place', payload);
  return data;
}

export async function getMyTransactions() {
  const { data } = await api.get('/user/transactions');
  return data;
}

export async function getMyTeam(params = {}) {
  const { data } = await api.get('/user/team', { params });
  return data;
}

export async function getMyProfile() {
  const { data } = await api.get('/user/profile');
  return data;
}

export async function changeMyPassword(payload) {
  const { data } = await api.patch('/user/password', payload);
  return data;
}

export async function getMyWithdrawalInfo() {
  const { data } = await api.get('/user/withdrawal-info');
  return data;
}

export async function createWithdrawalRequest(payload) {
  const { data } = await api.post('/user/withdrawal-request', payload);
  return data;
}

export async function getMyAddresses() {
  const { data } = await api.get('/user/addresses');
  return data;
}

export async function createMyAddress(payload) {
  const { data } = await api.post('/user/addresses', payload);
  return data;
}

export async function detectAddressStateByPincode(pincode) {
  const { data } = await api.get('/user/addresses/detect-state', { params: { pincode } });
  return data;
}
