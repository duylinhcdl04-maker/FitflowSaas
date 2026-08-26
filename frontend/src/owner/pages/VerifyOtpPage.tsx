import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { resendOtp, verifyOtp } from '../api/auth';
import { establishSession } from '../hooks/useBootstrapAuth';
import { apiErrorMessage } from '../api/client';
import AuthLayout from '../components/AuthLayout';
import Card from '../components/Card';
import Button from '../components/Button';

interface LocationState {
  userId: string;
  email: string;
  password?: string;
  businessName?: string;
  brandSlug?: string;
  seedSampleData?: boolean;
}

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const verifyMutation = useMutation({
    mutationFn: (code: string) => verifyOtp(state!.userId, code),
    onSuccess: async (data) => {
      await establishSession(data.accessToken);
      navigate('/owner/welcome', {
        replace: true,
        state: {
          trialEndsAt: data.subscription?.trialEndsAt,
          email: state!.email,
          password: state!.password,
          businessName: state!.businessName,
          brandSlug: state!.brandSlug,
          seededSampleData: data.seededSampleData,
        },
      });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Mã xác nhận không đúng')),
  });

  const resendMutation = useMutation({
    mutationFn: () => resendOtp(state!.userId),
    onSuccess: () => {
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setResendMessage('Đã gửi lại mã xác nhận, vui lòng kiểm tra email.');
      setError(null);
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  if (!state?.userId) {
    return <Navigate to="/owner/register" replace />;
  }

  function handleDigitChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value && index < 5) inputsRef.current[index + 1]?.focus();

    const combined = digits.map((d, i) => (i === index ? value : d)).join('');
    if (combined.length === 6) verifyMutation.mutate(combined);
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-sm text-center">
        <h1 className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-50">Xác thực tài khoản</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Chúng tôi đã gửi mã xác nhận đến <span className="font-medium text-zinc-700 dark:text-zinc-300">{state.email}</span>
        </p>

        {resendMessage && <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">{resendMessage}</p>}

        <div className="mt-6 flex justify-center gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              value={d}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              inputMode="numeric"
              maxLength={1}
              className="h-12 w-10 rounded-2xl border border-stone-300 text-center text-lg font-semibold text-zinc-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <Button
          className="mt-6 w-full justify-center"
          size="lg"
          disabled={verifyMutation.isPending || digits.some((d) => !d)}
          onClick={() => verifyMutation.mutate(digits.join(''))}
        >
          {verifyMutation.isPending ? 'Đang xác nhận...' : 'Xác nhận'}
        </Button>

        <button
          type="button"
          disabled={cooldown > 0 || resendMutation.isPending}
          onClick={() => resendMutation.mutate()}
          className="mt-4 text-sm font-medium text-emerald-700 disabled:text-zinc-400 dark:text-emerald-400 dark:disabled:text-zinc-600"
        >
          {cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : 'Gửi lại mã'}
        </button>
      </Card>
    </AuthLayout>
  );
}
