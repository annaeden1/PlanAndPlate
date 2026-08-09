import { getUserId } from '@/shared/utils/userId';
import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const BASE_URL =
  import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${BASE_URL}/file`,
});

const attachAuthToken = (config: InternalAxiosRequestConfig) => {
  const token = getUserId();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(attachAuthToken);

type UploadResponse = {
  url: string;
};

export const fileApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return api
      .post<UploadResponse>('/', formData, {
        headers: {
          'Content-Type': file.type || 'image/jpeg',
        },
      })
      .then((response) => ({ url: response.data.url }));
  },
};