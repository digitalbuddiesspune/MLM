import { api } from './axios.js';

export async function getCart() {
  const { data } = await api.get('/cart');
  return data;
}

export async function addToCart(productId, quantity = 1) {
  const { data } = await api.post('/cart', { productId, quantity });
  return data;
}

export async function removeFromCart(productId) {
  const { data } = await api.delete(`/cart/${productId}`);
  return data;
}

export async function clearCart() {
  const { data } = await api.delete('/cart');
  return data;
}
