import { api } from './axios.js';

export async function getProducts(activeOnly = true) {
  const { data } = await api.get('/products', {
    params: activeOnly ? {} : { active: 'false' },
  });
  return data;
}

export async function getProductById(id) {
  const { data } = await api.get(`/products/${id}`);
  return data;
}
