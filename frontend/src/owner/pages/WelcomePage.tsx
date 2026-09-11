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

function CopyRow({ label, value, tone = 'zinc' }: { label: string; value: string; tone?: 'zinc' | 'purple' | 'amber' }) {
  const [copied, setCopied] = useState(false);
  const toneClass = {
    zinc: 'bg-[#151119] border border-white/8',
    purple: 'bg-purple-950/40 border border-purple-500/30',
    amber: 'bg-amber-950/30 border border-amber-500/30',
  }[tone === 'emerald' ? 'purple' : tone];

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl p-4 ${toneClass}`}>
      <div className="min-w-0">
        <p className="text-xs text-[#A7A1AD] font-['Plus_Jakarta_Sans',sans-serif]">{label}</p>
        <p className="truncate font-['JetBrains_Mono'] text-sm font-semibold text-white">{value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#A7A1AD] transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Sao chép"
      >
        {copied ? <Check size={16} className="text-purple-400" /> : <Copy size={16} />}
      </button>
    </div>
  );
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const state = (useLocation().state as LocationState | null) ?? {};

  const daysRemaining = state.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(state.trialEndsAt).getTime() - new Date().getTime()) / 86_400_000))
    : 14;

  return (
    <AuthLayout>
      <Card className="w-full max-w-md text-center">
        <p className="text-4xl mb-2">🎉</p>
        <h1 className="font-['Be_Vietnam_Pro',sans-serif] text-2xl font-black text-white">
          Phòng gym của bạn đã sẵn sàng
        </h1>
        <p className="mt-2 text-sm font-['Plus_Jakarta_Sans',sans-serif] text-[#A7A1AD]">
          Dùng thử miễn phí còn <strong className="text-purple-400 font-bold">{daysRemaining} ngày</strong>
        </p>

        <div className="mt-8 flex flex-col gap-3 text-left">
          {state.businessName && <CopyRow label="Tên phòng tập" value={state.businessName} tone="purple" />}
          {state.brandSlug && <CopyRow label="Địa chỉ đăng nhập" value={`${state.brandSlug}.fitfloww.store`} tone="purple" />}
          {state.email && <CopyRow label="Tên đăng nhập" value={state.email} />}
          {state.password && <CopyRow label="Mật khẩu" value={state.password} tone="amber" />}
        </div>

        {state.seededSampleData ? (
          <p className="mt-6 rounded-xl bg-purple-950/40 border border-purple-500/20 p-3.5 text-xs font-['Plus_Jakarta_Sans',sans-serif] text-purple-200">
            Hệ thống đã khởi tạo sẵn dữ liệu mẫu (chi nhánh, hội viên, gói tập, PT) để bạn trải nghiệm ngay.
          </p>
        ) : (
          <p className="mt-6 rounded-xl bg-[#151119] border border-white/8 p-3.5 text-xs font-['Plus_Jakarta_Sans',sans-serif] text-[#A7A1AD]">
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
