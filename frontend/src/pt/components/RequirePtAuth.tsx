import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../owner/store/auth-store';

export default function RequirePtAuth() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isHydrating = useAuthStore((s) => s.isHydrating);

  if (isHydrating) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-emerald-600 dark:border-zinc-800 dark:border-t-emerald-400" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Đang kiểm tra phiên làm việc HLV PT...</p>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/owner/login" replace />;
  }

  // Allow PT, BRANCH_MANAGER, and OWNER to access PT portal
  if (
    user &&
    !user.roles.includes('PT') &&
    !user.roles.includes('BRANCH_MANAGER') &&
    !user.roles.includes('OWNER')
  ) {
    return <Navigate to="/owner/login" replace />;
  }

  return <Outlet />;
}
