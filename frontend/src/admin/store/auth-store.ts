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
  refreshToken: string | null;
  user: AdminUser | null;
  isHydrating: boolean;
  setSession: (accessToken: string, user: AdminUser, refreshToken?: string | null) => void;
  setAccessToken: (accessToken: string) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  clearSession: () => void;
  setHydrating: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isHydrating: true,
      setSession: (accessToken, user, refreshToken) =>
        set((state) => ({
          accessToken,
          user,
          refreshToken: refreshToken !== undefined ? refreshToken : state.refreshToken,
          isHydrating: false,
        })),
      setAccessToken: (accessToken) => set({ accessToken }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      clearSession: () => set({ accessToken: null, refreshToken: null, user: null, isHydrating: false }),
      setHydrating: (value) => set({ isHydrating: value }),
    }),
    {
      name: 'fitflow_admin_auth_session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrating(false);
      },
    }
  )
);
