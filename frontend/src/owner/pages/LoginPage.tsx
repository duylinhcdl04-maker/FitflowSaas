import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { login, resolveTenant, resendOtpByEmail } from '../api/auth';
import { establishSession } from '../hooks/useBootstrapAuth';
import { apiErrorMessage } from '../api/client';
import { useTenant, getTenantSlugFromHostname, getRootDomain } from '../../tenant/tenant-context';
import AuthLayout from '../components/AuthLayout';
import Callout from '../components/Callout';
import Card from '../components/Card';
import Button from '../components/Button';
import FormField, { inputClass } from '../components/FormField';
import PasswordInput from '../components/PasswordInput';
import { Skeleton } from '../components/Skeleton';

import FindStorePage from './FindStorePage';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

export { getTenantSlugFromHostname };

// Bước 2: Tenant Login (FLOW 3) — Hiển thị form đăng nhập cho tenant cụ thể
export default function LoginPage() {
  const { tenant, hostnameSlug, redirectToDiscovery } = useTenant();
  let { slug } = useParams<{ slug?: string }>();

  if (!slug) {
    slug = hostnameSlug ?? undefined;
  }

  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingActivation, setPendingActivation] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  // Nếu không ở subdomain và không có slug -> hiển thị Tenant Discovery
  if (!slug) return <FindStorePage />;

  // Nếu tenant trong context đã có dữ liệu trùng slug, ưu tiên dùng
  const activeTenantName = tenant?.slug === slug ? tenant.name : null;

  const tenantQuery = useQuery({
    queryKey: ['lookup-tenant', slug],
    queryFn: () => resolveTenant(slug!),
    enabled: !activeTenantName && !!slug,
    retry: false,
  });

  const tenantName = activeTenantName || tenantQuery.data?.name || slug;

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: async (data) => {
      const me = await establishSession(data.accessToken);
      if (me.roles.includes('CUSTOMER') && me.roles.length === 1) {
        navigate('/customer', { replace: true });
      } else if (me.roles.includes('STAFF') && !me.roles.includes('OWNER') && !me.roles.includes('BRANCH_MANAGER')) {
        navigate('/staff', { replace: true });
      } else if (me.roles.includes('PT') && !me.roles.includes('OWNER') && !me.roles.includes('BRANCH_MANAGER')) {
        navigate('/pt', { replace: true });
      } else if (me.roles.includes('BRANCH_MANAGER') && !me.roles.includes('OWNER')) {
        navigate('/manager', { replace: true });
      } else {
        navigate('/owner', { replace: true });
      }
    },
    onError: (err) => {
      const message = apiErrorMessage(err, 'Email hoặc mật khẩu không đúng');
      setError(message);
      setPendingActivation(message.includes('chưa được kích hoạt'));
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => resendOtpByEmail(email),
    onSuccess: (data) => {
      navigate('/owner/verify-otp', { state: { userId: data.userId, email: data.email } });
    },
    onError: (err) => setResendMessage(apiErrorMessage(err, 'Không thể gửi lại mã kích hoạt')),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPendingActivation(false);
    setResendMessage(null);
    mutation.mutate();
  }

  if (tenantQuery.isError && !activeTenantName) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-sm text-center">
          <p className="text-sm text-red-600 dark:text-red-400">Không tìm thấy cửa hàng "{slug}".</p>
          <button
            type="button"
            onClick={() => redirectToDiscovery('/owner/login')}
            className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
          >
            ← Thử địa chỉ khác
          </button>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          {tenantQuery.isLoading && !activeTenantName ? (
            <Skeleton className="h-6 w-40" />
          ) : (
            <h1 className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Đăng nhập vào {tenantName}
            </h1>
          )}
          <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">
            {slug}.{window.location.hostname.endsWith('.localhost') ? 'localhost' : (getRootDomain(window.location.hostname) || 'fitfloww.store')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <FormField label="Email" htmlFor="email">
            <input id="email" type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormField>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Mật khẩu</label>
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(true)}
                className="text-xs text-emerald-700 hover:underline dark:text-emerald-400 font-medium"
              >
                Quên mật khẩu?
              </button>
            </div>
            <PasswordInput id="password" required autoComplete="current-password" value={password} onChange={setPassword} />
          </div>

          {error && !pendingActivation && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {pendingActivation && (
            <Callout
              tone="warning"
              action={
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={resendMutation.isPending}
                  onClick={() => resendMutation.mutate()}
                >
                  {resendMutation.isPending ? 'Đang gửi...' : 'Gửi lại mã kích hoạt'}
                </Button>
              }
            >
              Tài khoản chưa được kích hoạt. Bạn đã đăng ký nhưng chưa xác thực mã OTP gửi qua email?
            </Callout>
          )}
          {resendMessage && <p className="text-sm text-red-600 dark:text-red-400">{resendMessage}</p>}
          <Button type="submit" size="lg" className="w-full justify-center" disabled={mutation.isPending}>
            {mutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <button
            type="button"
            onClick={() => redirectToDiscovery('/owner/login')}
            className="hover:underline text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Không phải cửa hàng của bạn?
          </button>
        </p>

        <ForgotPasswordModal
          open={forgotPasswordOpen}
          onClose={() => setForgotPasswordOpen(false)}
          initialEmail={email}
        />
      </Card>
    </AuthLayout>
  );
}
