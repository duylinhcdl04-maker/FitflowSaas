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
            });
          }
        } catch {
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
              });
            }
          } catch {
            if (!cancelled) clearSession();
          }
        }
        return;
      }

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
          });
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
