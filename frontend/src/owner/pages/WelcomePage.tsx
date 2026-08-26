import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Copy } from '@phosphor-icons/react';
import AuthLayout from '../components/AuthLayout';
import Card from '../components/Card';
import Button from '../components/Button';

interface LocationState {
  trialEndsAt?: string;
  email?: string;
  password?: string;
  businessName?: string;
  brandSlug?: string;
  seededSampleData?: boolean;
}

function CopyRow({ label, value, tone = 'zinc' }: { label: string; value: string; tone?: 'zinc' | 'emerald' | 'amber' }) {
  const [copied, setCopied] = useState(false);
  const toneClass = {
    zinc: 'bg-stone-100 dark:bg-zinc-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10',
    amber: 'bg-amber-50 dark:bg-amber-500/10',
  }[tone];

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Trình duyệt chặn clipboard (hiếm) — bỏ qua, giá trị vẫn hiển thị để copy tay.
    }
  }

  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl p-4 ${toneClass}`}>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="truncate font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">{value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/60 hover:text-zinc-700 dark:hover:bg-black/20 dark:hover:text-zinc-200"
        aria-label="Sao chép"
      >
        {copied ? <Check size={16} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={16} />}
      </button>
    </div>
  );
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const state = (useLocation().state as LocationState | null) ?? {};

  const daysRemaining = state.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(state.trialEndsAt).getTime() - new Date().getTime()) / 86_400_000))
    : 7;

  return (
    <AuthLayout>
      <Card className="w-full max-w-md text-center">
        <p className="text-4xl">🎉</p>
        <h1 className="font-display mt-3 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Cửa hàng của bạn đã sẵn sàng
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Dùng thử miễn phí còn <strong className="text-emerald-700 dark:text-emerald-400">{daysRemaining} ngày</strong>
        </p>

        <div className="mt-6 flex flex-col gap-3 text-left">
          {state.businessName && <CopyRow label="Tên gian hàng" value={state.businessName} tone="emerald" />}
          {state.brandSlug && <CopyRow label="Địa chỉ truy cập" value={`${state.brandSlug}.fitflow.vn`} tone="emerald" />}
          {state.email && <CopyRow label="Tên đăng nhập" value={state.email} />}
          {state.password && <CopyRow label="Mật khẩu" value={state.password} tone="amber" />}
        </div>

        {state.seededSampleData ? (
          <p className="mt-6 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
            Chúng tôi đã chuẩn bị sẵn chi nhánh, khách hàng, gói tập và huấn luyện viên mẫu để bạn khám phá hệ thống.
          </p>
        ) : (
          <p className="mt-6 rounded-2xl bg-stone-100 p-3 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            Trang của bạn đang trống — hãy thiết lập chi nhánh đầu tiên để bắt đầu.
          </p>
        )}

        <Button
          size="lg"
          className="mt-4 w-full justify-center"
          onClick={() => navigate(state.seededSampleData ? '/owner' : '/owner/onboarding', { replace: true })}
        >
          {state.seededSampleData ? 'Khám phá Dashboard →' : 'Bắt đầu thiết lập →'}
        </Button>
      </Card>
    </AuthLayout>
  );
}
