import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';
import { isAdminSubdomain } from '../../tenant/tenant-context';

export default function RequireAuth() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const isAdmin = isAdminSubdomain();

  if (isHydrating) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-purple-600 dark:border-zinc-800 dark:border-t-purple-400" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Đang xác thực phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to={isAdmin ? '/login' : '/admin/login'} replace />;
  }

  return <Outlet />;
}
