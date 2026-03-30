import axios from 'axios';
import type { OnboardingData } from '../shared';

const api = axios.create({
  baseURL: '/userManagement',
  headers: { 'Content-Type': 'application/json' },
});

export const userManagementApi = {
  verify: (token: string | null) =>
    api
      .get(`/auth/verify`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.data),

  signin: (formData: any) =>
    api.post(`/auth/signin`, formData).then((r) => r.data),

  signup: (formData: any) =>
    api.post(`/auth/signup`, formData).then((r) => r.data),

  updatePreferences: (
    userId: string,
    preferences: OnboardingData,
    token: string | null,
  ) =>
    api
      .patch(`/userManagement/${userId}/preferences`, preferences, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data),
};
