import { api } from './axios.js';

export async function getMyKyc() {
  const { data } = await api.get('/kyc/me');
  return data;
}

export async function submitKyc(formData) {
  const { data } = await api.post('/kyc/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function listAdminKyc({ status, page = 1, limit = 10 } = {}) {
  const params = { page, limit };
  if (status) params.status = status;
  const { data } = await api.get('/admin/kyc', { params });
  return data;
}

export async function reviewKyc(kycId, decision, remarks = '') {
  const { data } = await api.patch(`/admin/kyc/${kycId}`, { decision, remarks });
  return data;
}
