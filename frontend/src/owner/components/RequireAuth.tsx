import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';

export default function RequireAuth() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isHydrating = useAuthStore((s) => s.isHydrating);

  if (isHydrating) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-emerald-600 dark:border-zinc-800 dark:border-t-emerald-400" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Đang tải phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/owner/login" replace />;
  }

  if (user && !user.roles.includes('OWNER')) {
    if (user.roles.includes('BRANCH_MANAGER')) {
      return <Navigate to="/manager" replace />;
    }
    if (user.roles.includes('STAFF')) {
      return <Navigate to="/staff" replace />;
    }
    if (user.roles.includes('PT')) {
      return <Navigate to="/pt" replace />;
    }
  }

  return <Outlet />;
}
