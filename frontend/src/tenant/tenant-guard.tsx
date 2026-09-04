import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useTenant } from './tenant-context';
import { useAuthStore } from '../owner/store/auth-store';

/**
 * TENANT GUARD:
 * Kiểm tra Tenant Context và tính hợp lệ so với hostname:
 * - Nếu đang ở subdomain (e.g. yoyo.localhost:5173 hoặc yoyo.fitflow.io.vn):
 *   Yêu cầu BẮT BUỘC phải có Tenant Context hợp lệ và tenant.slug === hostnameSlug.
 *   Nếu CHƯA CÓ HOẶC KHÔNG KHỚP:
 *   -> Redirect ngay lập tức về Tenant Discovery (localhost:5173/owner/login).
 *   -> Không được hiển thị màn hình login hay dữ liệu của tenant.
 */
export function TenantGuard({ children }: { children?: ReactNode }) {
  const { tenant, hostnameSlug, redirectToDiscovery } = useTenant();

  const isInvalid = Boolean(hostnameSlug && (!tenant || tenant.slug !== hostnameSlug));

  useEffect(() => {
    if (isInvalid) {
      redirectToDiscovery('/owner/login');
    }
  }, [isInvalid, redirectToDiscovery]);

  if (isInvalid) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-emerald-600 dark:border-zinc-800 dark:border-t-emerald-400" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Chuyển hướng đến trang tìm cửa hàng...
          </p>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
}

/**
 * AUTHENTICATION GUARD:
 * Kiểm tra JWT authentication:
 * - Nếu đang tải phiên (isHydrating) -> hiển thị loading spinner.
 * - Nếu chưa có accessToken -> chuyển hướng về màn hình login của tenant (/owner/login).
 * - Kiểm tra nếu user thuộc tenant khác với tenant context hiện tại -> đăng xuất và redirect.
 */
export function AuthenticationGuard({ children }: { children?: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const { tenant, redirectToDiscovery } = useTenant();

  // Chống Tenant Mismatch ở Frontend
  useEffect(() => {
    if (accessToken && user?.tenantId && tenant?.id && user.tenantId !== tenant.id) {
      useAuthStore.getState().clearSession();
      redirectToDiscovery('/owner/login');
    }
  }, [accessToken, user, tenant, redirectToDiscovery]);

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

  return children ? <>{children}</> : <Outlet />;
}

/**
 * AUTHORIZATION GUARD:
 * Kiểm tra phân quyền role của user:
 * - Nếu không có role yêu cầu (ví dụ OWNER), redirect về đúng workspace tương ứng.
 */
export function AuthorizationGuard({
  allowedRoles = ['OWNER'],
  children,
}: {
  allowedRoles?: string[];
  children?: ReactNode;
}) {
  const user = useAuthStore((s) => s.user);

  if (user && !user.roles.some((r) => allowedRoles.includes(r))) {
    if (user.roles.includes('BRANCH_MANAGER')) {
      return <Navigate to="/manager" replace />;
    }
    if (user.roles.includes('STAFF')) {
      return <Navigate to="/staff" replace />;
    }
    if (user.roles.includes('PT')) {
      return <Navigate to="/pt" replace />;
    }
    if (user.roles.includes('CUSTOMER')) {
      return <Navigate to="/customer" replace />;
    }
    return <Navigate to="/owner/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
