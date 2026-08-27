import { useEffect } from 'react';
import { fetchMe, refresh } from '../api/auth';
import { useAuthStore } from '../store/auth-store';

/** On app load, try to silently restore a session from the httpOnly refresh cookie. */
export function useBootstrapAuth() {
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setHydrating = useAuthStore((s) => s.setHydrating);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const { accessToken } = await refresh();
        useAuthStore.getState().setAccessToken(accessToken);
        const me = await fetchMe();
        if (!cancelled) {
          setSession(accessToken, {
            id: me.id,
            email: me.email,
            fullName: me.fullName,
            roles: me.roles,
            tenantId: me.tenantId,
            mustChangePassword: me.mustChangePassword,
          });
        }
      } catch {
        if (!cancelled) clearSession();
      } finally {
        setHydrating(false);
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
export async function establishSession(accessToken: string) {
  useAuthStore.getState().setAccessToken(accessToken);
  const me = await fetchMe();
  useAuthStore.getState().setSession(accessToken, {
    id: me.id,
    email: me.email,
    fullName: me.fullName,
    roles: me.roles,
    tenantId: me.tenantId,
    mustChangePassword: me.mustChangePassword,
  });
  return me;
}
