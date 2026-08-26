import { create } from 'zustand';

export interface OwnerUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  tenantId: string | null;
  mustChangePassword?: boolean;
}

interface AuthState {
  accessToken: string | null;
  user: OwnerUser | null;
  isHydrating: boolean;
  setSession: (accessToken: string, user: OwnerUser) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
  setHydrating: (value: boolean) => void;
}

// Store riêng cho Owner Portal (không dùng chung với admin/store/auth-store.ts)
// — hai khu vực là hai phiên đăng nhập độc lập theo quyết định "xây bộ nhận
// diện riêng" cho Owner.
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isHydrating: true,
  setSession: (accessToken, user) => set({ accessToken, user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clearSession: () => set({ accessToken: null, user: null }),
  setHydrating: (value) => set({ isHydrating: value }),
}));
