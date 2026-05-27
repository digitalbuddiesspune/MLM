import { api } from './axios.js';

export async function createOrder(productId) {
  const { data } = await api.post('/orders', { productId });
  return data;
}

export async function verifyOrderPayment(payload) {
  const { data } = await api.post('/orders/verify', payload);
  return data;
}

export async function createCartCheckout() {
  const { data } = await api.post('/orders/cart-checkout');
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
