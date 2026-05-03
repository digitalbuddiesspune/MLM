import { api } from './axios.js';

export async function getMyWallet() {
  const { data } = await api.get('/user/wallet');
  return data;
}

/**
 * Swap left/right placement legs under a parent in your tree (default: you).
 * @param {{ parentId?: string }} [opts]
 */
export async function swapMyBinaryChildren(opts = {}) {
  const body = {};
  if (opts.parentId != null && String(opts.parentId).trim() !== '') {
    body.parentId = String(opts.parentId).trim();
  }
  const { data } = await api.post('/user/binary-tree/swap-children', body);
  return data;
}

export async function getMyTransactions() {
  const { data } = await api.get('/user/transactions');
  return data;
}

export async function getMyTeam() {
  const { data } = await api.get('/user/team');
  return data;
}

export async function getMyProfile() {
  const { data } = await api.get('/user/profile');
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
