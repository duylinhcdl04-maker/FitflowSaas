import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  refreshToken: string | null;
  user: OwnerUser | null;
  isHydrating: boolean;
  setSession: (accessToken: string, user: OwnerUser, refreshToken?: string | null) => void;
  setAccessToken: (accessToken: string) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  clearSession: () => void;
  setHydrating: (value: boolean) => void;
}

// Store cho App (Owner, Manager, Staff, PT, Customer) — dùng localStorage để duy trì phiên khi F5 reload.
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
      name: 'fitflow_auth_session',
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
