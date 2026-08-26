import { create } from 'zustand';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

interface AuthState {
  accessToken: string | null;
  user: AdminUser | null;
  isHydrating: boolean;
  setSession: (accessToken: string, user: AdminUser) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
  setHydrating: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isHydrating: true,
  setSession: (accessToken, user) => set({ accessToken, user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clearSession: () => set({ accessToken: null, user: null }),
  setHydrating: (value) => set({ isHydrating: value }),
}));
