import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LockKey,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  Lightning,
  CircleNotch,
  ArrowRight,
  Fingerprint,
} from '@phosphor-icons/react';
import { login } from '../api/auth';
import { apiErrorMessage } from '../api/client';
import { useAuthStore } from '../store/auth-store';
import { isAdminSubdomain } from '../../tenant/tenant-context';

export default function LoginPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const isAdmin = isAdminSubdomain();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (accessToken) {
    return <Navigate to={isAdmin ? '/' : '/admin'} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(email, password);
      setSession(res.accessToken, res.user, res.refreshToken);
      navigate(isAdmin ? '/' : '/admin', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Đăng nhập quản trị thất bại. Vui lòng kiểm tra lại thông tin.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#070609] px-4 py-12 text-[#F5F3F7]">
      {/* Dynamic Cyber Ambient Lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-purple-600/15 blur-[160px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 right-10 h-[450px] w-[450px] rounded-full bg-indigo-900/15 blur-[160px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.04)_1px,transparent_0)] bg-[length:24px_24px]"
      />

      <div className="relative w-full max-w-md">
        {/* Top Control Center Security Header */}
        <div className="mb-6 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 items-center justify-center">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </span>
            <span className="font-['JetBrains_Mono'] text-xs text-purple-300">
              {window.location.hostname || 'admin.fitfloww.store'}
            </span>
          </div>
          <span className="rounded-full bg-purple-950/70 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-bold font-['Plus_Jakarta_Sans',sans-serif] uppercase tracking-wider text-purple-300">
            Level 3 Root Auth
          </span>
        </div>

        {/* Main Glassmorphic Login Container */}
        <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-[#120F18]/90 p-8 sm:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.8),0_0_50px_rgba(168,85,247,0.15)] backdrop-blur-2xl">
          {/* Subtle Top Glowing Line */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-80" />

          {/* Platform Identity */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600/30 to-indigo-900/40 border border-purple-500/40 shadow-[0_0_28px_rgba(168,85,247,0.35)]">
              <ShieldCheck size={32} weight="fill" className="text-purple-300" />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white border-2 border-[#120F18]">
                <Lightning size={11} weight="fill" />
              </span>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-['Be_Vietnam_Pro',sans-serif] text-2xl font-black tracking-tight text-white uppercase">
                FitFlow Admin
              </h1>
            </div>
            <p className="font-['Plus_Jakarta_Sans',sans-serif] text-xs text-[#A7A1AD] max-w-[280px]">
              Khu vực xác thực quản trị trung tâm nền tảng SaaS Multi-tenant
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="admin-email"
                className="font-['Plus_Jakarta_Sans',sans-serif] text-xs font-semibold uppercase tracking-wider text-[#C5C0CD]"
              >
                Tài khoản Quản trị viên
              </label>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-3.5 text-[#A7A1AD]">
                  <EnvelopeSimple size={18} />
                </span>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="admin@fitflow.internal"
                  className="w-full rounded-xl border border-white/10 bg-[#151119] pl-10 pr-4 py-3 text-sm font-['Plus_Jakarta_Sans',sans-serif] text-white placeholder:text-[#6F6877] shadow-sm transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="admin-password"
                className="font-['Plus_Jakarta_Sans',sans-serif] text-xs font-semibold uppercase tracking-wider text-[#C5C0CD]"
              >
                Mật mã bảo mật
              </label>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-3.5 text-[#A7A1AD]">
                  <LockKey size={18} />
                </span>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-white/10 bg-[#151119] pl-10 pr-11 py-3 text-sm font-['JetBrains_Mono'] text-white placeholder:text-[#6F6877] shadow-sm transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#A7A1AD] hover:text-white transition-colors p-1"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-1 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs font-medium text-rose-300 flex items-start gap-2">
                <span className="text-rose-400 mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 py-3.5 text-sm font-bold font-['Plus_Jakarta_Sans',sans-serif] uppercase tracking-wider text-white shadow-[0_0_28px_rgba(168,85,247,0.35)] transition-all hover:shadow-[0_0_40px_rgba(168,85,247,0.55)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <CircleNotch size={18} className="animate-spin text-white" />
                  <span>Đang xác thực bảo mật...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập Quản trị</span>
                  <ArrowRight
                    size={16}
                    weight="bold"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>

          {/* Security Protocols Strip */}
          <div className="mt-6 pt-5 border-t border-white/8 flex items-center justify-between text-[11px] font-['Plus_Jakarta_Sans',sans-serif] text-[#6F6877]">
            <span className="flex items-center gap-1.5">
              <Fingerprint size={14} className="text-purple-400" />
              Mã hóa TLS 1.3 End-to-End
            </span>
            <span className="text-emerald-400 font-semibold">Máy chủ 100%</span>
          </div>
        </div>

        {/* Outer Disclaimer */}
        <p className="mt-6 text-center text-xs font-['Plus_Jakarta_Sans',sans-serif] text-[#6F6877]">
          Khu vực bảo mật nội bộ. Mọi hoạt động truy cập đều được ghi nhật ký hệ thống (Audit Log).
        </p>
      </div>
    </div>
  );
}

