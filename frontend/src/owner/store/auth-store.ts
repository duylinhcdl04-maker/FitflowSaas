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
  user: OwnerUser | null;
  isHydrating: boolean;
  setSession: (accessToken: string, user: OwnerUser) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
  setHydrating: (value: boolean) => void;
}

// Store cho App (Owner, Manager, Staff, PT, Customer) — dùng localStorage để duy trì phiên khi F5 reload.
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
      name: 'fitflow_auth_session',
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
