import { api } from './axios.js';

export async function getMyWallet() {
  const { data } = await api.get('/user/wallet');
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
