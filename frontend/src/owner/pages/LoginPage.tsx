import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { login, lookupTenant, resendOtpByEmail } from '../api/auth';
import { establishSession } from '../hooks/useBootstrapAuth';
import { apiErrorMessage } from '../api/client';
import AuthLayout from '../components/AuthLayout';
import Callout from '../components/Callout';
import Card from '../components/Card';
import Button from '../components/Button';
import FormField, { inputClass } from '../components/FormField';
import PasswordInput from '../components/PasswordInput';
import { Skeleton } from '../components/Skeleton';

import ForgotPasswordModal from '../components/ForgotPasswordModal';

// Bước 2 của đăng nhập — form mật khẩu thật, gắn nhãn theo đúng cửa hàng vừa
// tìm ở FindStorePage. Mô phỏng cho URL sau này: `{slug}.fitflow.vn/login`.
export default function LoginPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  // OW-01b. Tài khoản đăng ký xong nhưng bỏ dở bước xác thực OTP đăng nhập sẽ
  // báo lỗi này — cho họ khôi phục thẳng bằng email thay vì bị kẹt luôn.
  const [pendingActivation, setPendingActivation] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const tenantQuery = useQuery({
    queryKey: ['lookup-tenant', slug],
    queryFn: () => lookupTenant(slug!),
    enabled: !!slug,
    retry: false,
  });

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

  if (!slug) return <Navigate to="/owner/login" replace />;

  if (tenantQuery.isError) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-sm text-center">
          <p className="text-sm text-red-600 dark:text-red-400">Không tìm thấy cửa hàng "{slug}".</p>
          <Link to="/owner/login" className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
            ← Thử địa chỉ khác
          </Link>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          {tenantQuery.isLoading ? (
            <Skeleton className="h-6 w-40" />
          ) : (
            <h1 className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Đăng nhập vào {tenantQuery.data?.name}
            </h1>
          )}
          <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">{slug}.fitflow.vn</p>
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
          <Link to="/owner/login" className="hover:underline">
            ← Không phải cửa hàng của bạn?
          </Link>
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
