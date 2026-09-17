import { apiClient } from './client';
import { useAuthStore } from '../store/auth-store';
import type { AdminUser } from '../store/auth-store';

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: AdminUser;
}

export function login(email: string, password: string) {
  return apiClient
    .post<LoginResponse>('/auth/login', { email, password })
    .then((res) => res.data);
}

export function fetchMe() {
  return apiClient.get<AdminUser & { tenantId: string | null; userType: string }>('/auth/me').then((res) => res.data);
}

export function refresh(refreshToken?: string | null) {
  const token = refreshToken ?? useAuthStore.getState().refreshToken;
  return apiClient
    .post<{ accessToken: string; refreshToken?: string }>('/auth/refresh', { refreshToken: token || undefined })
    .then((res) => res.data);
}

export function logout() {
  return apiClient.post('/auth/logout');
}
