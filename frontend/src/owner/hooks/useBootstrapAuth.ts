import { useEffect } from 'react';
import { fetchMe, refresh } from '../api/auth';
import { useAuthStore } from '../store/auth-store';

/** On app load, try to silently restore/verify session. */
export function useBootstrapAuth() {
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setHydrating = useAuthStore((s) => s.setHydrating);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const existingToken = useAuthStore.getState().accessToken;

      if (existingToken) {
        setHydrating(false);
        try {
          const me = await fetchMe();
          if (!cancelled) {
            setSession(existingToken, {
              id: me.id,
              email: me.email,
              fullName: me.fullName,
              roles: me.roles,
              tenantId: me.tenantId,
              mustChangePassword: me.mustChangePassword,
            });
          }
        } catch {
          // Token in localStorage might be expired, try refreshing
          try {
            const { accessToken, refreshToken: newRefreshToken } = await refresh();
            useAuthStore.getState().setAccessToken(accessToken);
            if (newRefreshToken) {
              useAuthStore.getState().setRefreshToken(newRefreshToken);
            }
            const me = await fetchMe();
            if (!cancelled) {
              setSession(accessToken, {
                id: me.id,
                email: me.email,
                fullName: me.fullName,
                roles: me.roles,
                tenantId: me.tenantId,
                mustChangePassword: me.mustChangePassword,
              }, newRefreshToken);
            }
          } catch {
            if (!cancelled) clearSession();
          }
        }
        return;
      }

      const existingRefreshToken = useAuthStore.getState().refreshToken;
      if (!existingRefreshToken) {
        if (!cancelled) setHydrating(false);
        return;
      }

      try {
        const { accessToken, refreshToken: newRefreshToken } = await refresh(existingRefreshToken);
        useAuthStore.getState().setAccessToken(accessToken);
        if (newRefreshToken) {
          useAuthStore.getState().setRefreshToken(newRefreshToken);
        }
        const me = await fetchMe();
        if (!cancelled) {
          setSession(accessToken, {
            id: me.id,
            email: me.email,
            fullName: me.fullName,
            roles: me.roles,
            tenantId: me.tenantId,
            mustChangePassword: me.mustChangePassword,
          }, newRefreshToken);
        }
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setHydrating(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Sau login/verify-otp: đã có accessToken nhưng response chưa có tenantId — gọi /auth/me để lấy đủ. */
export async function establishSession(accessToken: string, refreshToken?: string | null) {
  useAuthStore.getState().setAccessToken(accessToken);
  if (refreshToken) {
    useAuthStore.getState().setRefreshToken(refreshToken);
  }
  const me = await fetchMe();
  useAuthStore.getState().setSession(accessToken, {
    id: me.id,
    email: me.email,
    fullName: me.fullName,
    roles: me.roles,
    tenantId: me.tenantId,
    mustChangePassword: me.mustChangePassword,
  }, refreshToken);
  return me;
}
