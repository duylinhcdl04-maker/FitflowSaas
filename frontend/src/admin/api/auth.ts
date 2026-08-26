import { apiClient } from './client';
import type { AdminUser } from '../store/auth-store';

export interface LoginResponse {
  accessToken: string;
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

export function refresh() {
  return apiClient.post<{ accessToken: string }>('/auth/refresh').then((res) => res.data);
}

export function logout() {
  return apiClient.post('/auth/logout');
}
