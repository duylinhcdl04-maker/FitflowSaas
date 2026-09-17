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
      await establishSession(data.accessToken, data.refreshToken);
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
      <Card className="w-full max-w-md text-center">
        <h1 className="font-['Be_Vietnam_Pro',sans-serif] text-2xl font-black text-white">Xác thực tài khoản</h1>
        <p className="mt-2 text-sm font-['Plus_Jakarta_Sans',sans-serif] text-[#A7A1AD]">
          Chúng tôi đã gửi mã xác thực 6 số đến <span className="font-semibold text-purple-300">{state.email}</span>
        </p>

        {resendMessage && <p className="mt-3 text-sm text-emerald-400 font-medium">{resendMessage}</p>}

        <div className="mt-8 flex justify-center gap-2.5">
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
              className="h-14 w-12 rounded-xl border border-white/10 bg-[#151119] text-center font-['JetBrains_Mono'] text-2xl font-bold text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            />
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-rose-400 font-medium">{error}</p>}

        <Button
          className="mt-8 w-full justify-center"
          size="lg"
          disabled={verifyMutation.isPending || digits.some((d) => !d)}
          onClick={() => verifyMutation.mutate(digits.join(''))}
        >
          {verifyMutation.isPending ? 'Đang xác nhận...' : 'Xác thực tài khoản'}
        </Button>

        <button
          type="button"
          disabled={cooldown > 0 || resendMutation.isPending}
          onClick={() => resendMutation.mutate()}
          className="mt-6 text-sm font-bold text-purple-400 hover:text-purple-300 disabled:text-[#6F6877] transition-colors"
        >
          {cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : 'Gửi lại mã xác nhận'}
        </button>
      </Card>
    </AuthLayout>
  );
}
