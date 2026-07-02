import axios from "axios";
import type { OnboardingData } from "@/shared";

const managementApi = axios.create({
  baseURL: "/userManagement",
  headers: { "Content-Type": "application/json" },
});

const authApi = axios.create({
  headers: { "Content-Type": "application/json" },
});

export const userManagementApi = {
  verify: (token: string | null) =>
    authApi
      .get(`/auth/verify`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.data),

  signin: (formData: any) =>
    authApi.post(`/auth/signin`, formData).then((r) => r.data),

  signup: (formData: any) =>
    authApi.post(`/auth/signup`, formData).then((r) => r.data),

  getAccountData: (userId: string, token: string | null) =>
    managementApi
      .get(`/${userId}/account`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data),

  updateAccountData: (
    userId: string,
    accountData: { name: string },
    token: string | null,
  ) =>
    managementApi
      .patch(`/${userId}/account`, accountData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data),

  updatePassword: (
    userId: string,
    payload: { oldPassword: string; newPassword: string },
    token: string | null,
  ) =>
    managementApi
      .patch(`/${userId}/password`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data),

  getPreferences: (userId: string, token: string | null) =>
    managementApi
      .get(`/${userId}/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data),

  updatePreferences: (
    userId: string,
    preferences: OnboardingData,
    token: string | null,
  ) =>
    managementApi
      .patch(`/${userId}/preferences`, preferences, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data),

  logout: (token: string | null) =>
    managementApi
      .post(`/auth/logout`, null, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data),
};
