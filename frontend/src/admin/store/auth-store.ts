import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isHydrating: true,
      setSession: (accessToken, user) => set({ accessToken, user, isHydrating: false }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clearSession: () => set({ accessToken: null, user: null, isHydrating: false }),
      setHydrating: (value) => set({ isHydrating: value }),
    }),
    {
      name: 'fitflow_admin_auth_session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrating(false);
      },
    }
  )
);
