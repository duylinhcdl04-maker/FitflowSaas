import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Lock } from '@phosphor-icons/react';
import { login } from '../api/auth';
import { apiErrorMessage } from '../api/client';
import { useAuthStore } from '../store/auth-store';
import FormField, { inputClass } from '../components/FormField';
import Button from '../components/Button';

export default function LoginPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (accessToken) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(email, password);
      setSession(res.accessToken, res.user);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Đăng nhập thất bại'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10" />

      <div className="relative w-full max-w-sm">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700" />

          <div className="p-8">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white dark:bg-emerald-500">
                F
              </span>
              <span className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">
                FitFlow Admin
              </span>
            </div>

            <div className="mt-6 flex items-center gap-1.5 text-zinc-400">
              <Lock size={13} />
              <span className="text-[11px] font-semibold tracking-wide uppercase">
                Khu vực quản trị nền tảng
              </span>
            </div>
            <h1 className="font-display mt-1.5 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Đăng nhập Super Admin
            </h1>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <FormField label="Email" htmlFor="email">
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormField>

              <FormField label="Mật khẩu" htmlFor="password">
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FormField>

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <Button type="submit" variant="primary" disabled={loading} className="mt-2 w-full">
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </form>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Chỉ dành cho nhân sự vận hành nền tảng FitFlow.
        </p>
      </div>
    </div>
  );
}
