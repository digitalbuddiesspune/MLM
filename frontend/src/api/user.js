import { api } from './axios.js';

export async function getMyWallet() {
  const { data } = await api.get('/user/wallet');
  return data;
}

export async function getMyTransactions() {
  const { data } = await api.get('/user/transactions');
  return data;
}
