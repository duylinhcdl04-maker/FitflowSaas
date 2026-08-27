import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { Link } from 'react-router-dom';
import { CalendarBlank, IdentificationCard, Barbell, ArrowRight, ShieldCheck } from '@phosphor-icons/react';
import { getCurrentMembership, getMyPtPackage, getQrToken } from '../api/customer';
import { useAuthStore } from '../../owner/store/auth-store';
import Card from '../../owner/components/Card';
import { Skeleton } from '../../owner/components/Skeleton';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  SCHEDULED: 'Sắp kích hoạt',
  FROZEN: 'Đang tạm ngưng',
  EXPIRED: 'Đã hết hạn',
  CANCELLED: 'Đã hủy',
};

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

export default function CustomerDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(45);
  const expiresAtRef = useRef<number>(0);

  const tokenQuery = useQuery({
    queryKey: ['customer-qr-token'],
    queryFn: getQrToken,
    refetchInterval: 45_000,
  });

  const membershipQuery = useQuery({ queryKey: ['customer-membership'], queryFn: getCurrentMembership });
  const ptPackageQuery = useQuery({ queryKey: ['customer-pt-package'], queryFn: getMyPtPackage });

  useEffect(() => {
    if (!tokenQuery.data) return;
    expiresAtRef.current = Date.now() + tokenQuery.data.expiresInSeconds * 1000;
    QRCode.toDataURL(tokenQuery.data.token, {
      width: 260,
      margin: 1,
      color: { dark: '#064e3b', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [tokenQuery.data]);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.round((expiresAtRef.current - Date.now()) / 1000));
      setCountdown(remaining);
    }, 250);
    return () => clearInterval(timer);
  }, []);

  const membership = membershipQuery.data;
  const ptPackage = ptPackageQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Chào, {user?.fullName?.split(' ').slice(-1)[0] || 'bạn'} 👋
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Đưa mã QR này cho nhân viên để Check-in / Check-out.</p>
      </div>

      {/* HERO — dynamic QR card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 p-6 text-white shadow-lg shadow-emerald-900/20 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-teal-300/10 blur-2xl" />

        <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
              <ShieldCheck size={14} weight="fill" /> Mã QR bảo mật động
            </p>
            <h2 className="mt-3 font-display text-xl font-bold sm:text-2xl">{user?.fullName}</h2>
            <p className="mt-1 text-sm text-emerald-50/90">
              Mã tự làm mới sau <span className="font-mono font-bold">{countdown}s</span> — không thể chụp màn hình dùng lại.
            </p>
          </div>

          <div className="flex h-[184px] w-[184px] shrink-0 items-center justify-center rounded-3xl bg-white p-3 shadow-xl shadow-black/10 sm:h-[220px] sm:w-[220px]">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Mã QR check-in" className="h-full w-full object-contain" />
            ) : (
              <div className="h-full w-full animate-pulse rounded-2xl bg-stone-200" />
            )}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <IdentificationCard size={22} weight="fill" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Gói tập hiện tại</p>
            {membershipQuery.isLoading ? (
              <Skeleton className="mt-1 h-5 w-32" />
            ) : membership ? (
              <>
                <p className="truncate font-display text-base font-bold text-zinc-900 dark:text-zinc-50">{membership.packageName}</p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {STATUS_LABEL[membership.status] ?? membership.status} · Hết hạn {formatDate(membership.endDate)}
                </p>
              </>
            ) : (
              <p className="mt-0.5 text-sm text-zinc-400">Chưa có gói tập</p>
            )}
          </div>
        </Card>

        <Card className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
            <Barbell size={22} weight="fill" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Buổi PT còn lại</p>
            {ptPackageQuery.isLoading ? (
              <Skeleton className="mt-1 h-5 w-24" />
            ) : ptPackage ? (
              <>
                <p className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
                  {ptPackage.remainingSessions} / {ptPackage.totalSessions} buổi
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">HLV: {ptPackage.ptName}</p>
              </>
            ) : (
              <p className="mt-0.5 text-sm text-zinc-400">Chưa có gói PT</p>
            )}
          </div>
        </Card>
      </div>

      <Link
        to="/customer/pt"
        className="flex items-center justify-between rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/60 px-5 py-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-500/5 dark:text-emerald-300"
      >
        <span className="flex items-center gap-2">
          <CalendarBlank size={18} /> Đặt lịch buổi tập với PT ngay
        </span>
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
