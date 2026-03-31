import axios from 'axios';
import type { ProductData } from '../shared';

const api = axios.create({
  baseURL: '/barcode',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const barcodeApi = {
  scan: (userId: string, barcode: string) =>
    api.post<ProductData>(`/scan/${userId}`, { barcode }).then((r) => r.data),
};
