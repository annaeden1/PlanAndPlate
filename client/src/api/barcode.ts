import axios from 'axios';
import type { ProductData } from '../shared';

const api = axios.create({
  baseURL: '/barcode',
  headers: { 'Content-Type': 'application/json' },
});

//TODO: add useId to the endpoint
export const barcodeApi = {
  scan: (barcode: string) =>
    api.post<ProductData>('/scan/123', { barcode }).then((r) => r.data),
};
