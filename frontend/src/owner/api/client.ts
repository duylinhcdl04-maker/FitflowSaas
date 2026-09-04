import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth-store';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1';
  const hostname = window.location.hostname;
  
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[parts.length - 1] === 'localhost') {
      const subdomain = parts.slice(0, -1).join('.');
      if (subdomain && subdomain !== 'www') {
        return envUrl.replace('://localhost:', `://${subdomain}.localhost:`);
      }
    }
  }
  return envUrl;
};

const baseURL = getBaseURL();

export const apiClient = axios.create({ baseURL, withCredentials: true });

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const hostname = window.location.hostname;
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.replace(/\.localhost$/, '');
    if (sub && sub !== 'www') {
      config.headers['X-Tenant-Slug'] = sub.toLowerCase();
    }
  } else {
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] !== 'www') {
      config.headers['X-Tenant-Slug'] = parts[0].toLowerCase();
    }
  }

  const activeBranchId = localStorage.getItem('fitflow_active_branch_id');
  if (activeBranchId) {
    config.headers['X-Branch-Id'] = activeBranchId;
  }

  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await axios.post<{ accessToken: string }>(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
    return res.data.accessToken;
  } catch {
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      refreshPromise ??= refreshAccessToken();
      const newToken = await refreshPromise;
      refreshPromise = null;

      if (newToken) {
        useAuthStore.getState().setAccessToken(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }

      useAuthStore.getState().clearSession();
    }

    return Promise.reject(error);
  },
);

export function apiErrorMessage(error: unknown, fallback = 'Đã có lỗi xảy ra'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message.join(', ');
    if (typeof data?.message === 'string') return data.message;
  }
  return fallback;
}
