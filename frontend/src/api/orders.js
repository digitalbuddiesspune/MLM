import { api } from './axios.js';

export async function createOrder(productId, addressId) {
  const { data } = await api.post('/orders', { productId, addressId });
  return data;
}

export async function verifyOrderPayment(payload) {
  const { data } = await api.post('/orders/verify', payload);
  return data;
}

export async function createCartCheckout(addressId) {
  const { data } = await api.post('/orders/cart-checkout', { addressId });
  return data;
}

export async function verifyCartCheckout(payload) {
  const { data } = await api.post('/orders/cart-verify', payload);
  return data;
}

export async function getMyOrders() {
  const { data } = await api.get('/orders/my');
  return data;
}
