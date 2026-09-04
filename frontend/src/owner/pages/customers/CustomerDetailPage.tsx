import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Phone,
  EnvelopeSimple,
  Calendar,
  GenderIntersex,
  MapPin,
  Storefront,
  IdentificationCard,
  CreditCard,
  Barbell,
  CheckCircle,
  Clock,
  Receipt,
  CalendarCheck,
  ShieldCheck,
  Sparkle,
  ArrowSquareOut,
  QrCode,
  ScanSmiley,
  HandCoins,
} from '@phosphor-icons/react';
import { getCustomer } from '../../api/customers';
import { Skeleton } from '../../components/Skeleton';

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMoney(amount?: string | number | null) {
  if (!amount) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
}

function getInitials(name: string) {
  if (!name) return 'KH';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const CHECKIN_METHOD_LABELS: Record<string, { label: string; icon: typeof QrCode; color: string }> = {
  FACE_ID: { label: 'Khuôn mặt (FaceID)', icon: ScanSmiley, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-300' },
  QR_APP: { label: 'Quét mã QR', icon: QrCode, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300' },
  MANUAL: { label: 'Lễ tân Check-in', icon: IdentificationCard, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300' },
};

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'memberships' | 'pt' | 'checkins' | 'payments'>('overview');

  const { data: customer, isLoading } = useQuery({
    queryKey: ['owner-customer', id],
    queryFn: () => getCustomer(id!),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-44 w-full rounded-3xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-500 dark:text-zinc-400">Không tìm thấy thông tin khách hàng.</p>
        <Link to="/owner/customers" className="mt-4 inline-block text-emerald-600 font-medium hover:underline">
          Quay lại danh sách khách hàng
        </Link>
      </div>
    );
  }

  // Calculate totals
  const totalSpent = customer.recentPayments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);

  const activeMembership = customer.memberships.find((m) => m.status === 'ACTIVE');
  const remainingPtSessions = customer.ptPackages
    .filter((p) => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS')
    .reduce((sum, p) => sum + Math.max(0, p.totalSessions - p.usedSessions), 0);

  const hasActiveService = Boolean(activeMembership || remainingPtSessions > 0);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Back Navigation Breadcrumb */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/owner/customers')}
          className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-2xs group-hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:group-hover:bg-zinc-800">
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          </div>
          <span>Danh sách Khách hàng</span>
        </button>
      </div>

      {/* Hero Customer Profile Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/60 to-emerald-50/20 p-6 sm:p-8 shadow-sm dark:border-zinc-800/80 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-emerald-950/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: Customer Identity & Avatar */}
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-900 via-zinc-800 to-slate-700 text-white dark:from-emerald-600 dark:via-teal-600 dark:to-emerald-500 font-black text-xl sm:text-2xl shadow-lg shadow-slate-950/10 dark:shadow-emerald-500/20">
              {getInitials(customer.fullName)}
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                {hasActiveService ? (
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" title="Đang có gói tập hoạt động" />
                ) : (
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-slate-400 ring-2 ring-white dark:ring-zinc-900" title="Chưa có gói tập" />
                )}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {customer.fullName}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700/80">
                  {customer.customerCode}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    hasActiveService
                      ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                      : 'bg-slate-500/10 text-slate-700 dark:bg-zinc-700/40 dark:text-zinc-300 ring-1 ring-slate-500/20'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${hasActiveService ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {hasActiveService ? 'Hội viên hoạt động' : 'Chưa có gói tập'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-zinc-400">
                {customer.phone && (
                  <a href={`tel:${customer.phone}`} className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                    <Phone size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{customer.phone}</span>
                  </a>
                )}
                {customer.email && (
                  <a href={`mailto:${customer.email}`} className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                    <EnvelopeSimple size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="truncate max-w-[200px]">{customer.email}</span>
                  </a>
                )}
                {customer.homeBranchName && (
                  <span className="flex items-center gap-1">
                    <Storefront size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Cơ sở: <strong>{customer.homeBranchName}</strong></span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t border-slate-200/60 lg:border-t-0 dark:border-zinc-800/60">
            <Link
              to={`/owner/memberships?search=${encodeURIComponent(customer.customerCode)}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <CreditCard size={16} weight="bold" />
              <span>Gia hạn / Bán gói</span>
            </Link>

            <Link
              to={`/owner/checkin?search=${encodeURIComponent(customer.customerCode)}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 font-semibold text-xs shadow-2xs transition-all cursor-pointer"
            >
              <IdentificationCard size={16} />
              <span>Lịch sử Check-in</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Summary Bento Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Active Membership */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Gói tập Membership
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <IdentificationCard size={20} weight="duotone" />
            </div>
          </div>
          <p className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-2 truncate">
            {activeMembership ? activeMembership.packageName : 'Chưa có gói'}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
            {activeMembership ? `Hạn dùng: ${formatDate(activeMembership.endDate)}` : 'Chưa kích hoạt thẻ tập'}
          </p>
        </div>

        {/* KPI 2: PT Sessions */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Buổi tập PT còn lại
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Barbell size={20} weight="duotone" />
            </div>
          </div>
          <p className="font-display text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {remainingPtSessions} <span className="text-base font-medium text-slate-400">buổi</span>
          </p>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
            {customer.ptPackages.length} gói Huấn luyện viên
          </p>
        </div>

        {/* KPI 3: Check-in Count */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Lượt Check-in đã tập
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <CalendarCheck size={20} weight="duotone" />
            </div>
          </div>
          <p className="font-display text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {customer.recentCheckins.length}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
            {customer.recentCheckins.length > 0
              ? `Gần nhất: ${formatDate(customer.recentCheckins[0]?.checkInAt)}`
              : 'Chưa có lượt check-in'}
          </p>
        </div>

        {/* KPI 4: Total Spent */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Tổng chi tiêu tích luỹ
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
              <HandCoins size={20} weight="duotone" />
            </div>
          </div>
          <p className="font-display text-2xl font-extrabold text-slate-900 dark:text-white mt-2 text-emerald-600 dark:text-emerald-400">
            {formatMoney(totalSpent)}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
            {customer.recentPayments.length} hoá đơn giao dịch
          </p>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-zinc-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800'
          }`}
        >
          Thông tin chi tiết
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('memberships')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'memberships'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800'
          }`}
        >
          Gói tập Membership ({customer.memberships.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pt')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'pt'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800'
          }`}
        >
          Gói Huấn luyện viên PT ({customer.ptPackages.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('checkins')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'checkins'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800'
          }`}
        >
          Lịch sử Check-in ({customer.recentCheckins.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'payments'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800'
          }`}
        >
          Hoá đơn & Thanh toán ({customer.recentPayments.length})
        </button>
      </div>

      {/* Tab 1: Overview & Personal Details */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Info Box */}
          <div className="lg:col-span-2 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-zinc-800">
              <User size={20} className="text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                Hồ sơ cá nhân khách hàng
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800/80">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Số điện thoại
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-0.5">
                    {customer.phone || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800/80">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
                  <EnvelopeSimple size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Email
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-0.5 truncate">
                    {customer.email || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800/80">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Ngày sinh
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-0.5">
                    {formatDate(customer.dateOfBirth)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800/80">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-400">
                  <GenderIntersex size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Giới tính
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-0.5">
                    {customer.gender === 'MALE' ? 'Nam' : customer.gender === 'FEMALE' ? 'Nữ' : customer.gender || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800/80">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Địa chỉ cư trú
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-0.5">
                    {customer.address || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800/80">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400">
                  <Storefront size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Chi nhánh đăng ký gốc
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-0.5">
                    {customer.homeBranchName || '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Summary Highlights */}
          <div className="space-y-6">
            {/* Active Membership Snapshot */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                <h3 className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
                  Thẻ hội viên hiện tại
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {activeMembership ? 'ACTIVE' : 'NONE'}
                </span>
              </div>

              {activeMembership ? (
                <div className="pt-4 space-y-3">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20">
                    <p className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                      {activeMembership.packageName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                      {formatDate(activeMembership.startDate)} → {formatDate(activeMembership.endDate)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-zinc-500">
                  <p>Hội viên hiện chưa có thẻ tập kích hoạt.</p>
                  <Link
                    to={`/owner/memberships?search=${encodeURIComponent(customer.customerCode)}`}
                    className="mt-2 inline-block text-emerald-600 font-bold hover:underline"
                  >
                    + Đăng ký thẻ tập ngay
                  </Link>
                </div>
              )}
            </div>

            {/* Account Metadata */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 text-xs text-slate-500 dark:text-zinc-400 space-y-2">
              <div className="flex justify-between">
                <span>Mã hội viên:</span>
                <strong className="font-mono text-slate-800 dark:text-zinc-200">{customer.customerCode}</strong>
              </div>
              <div className="flex justify-between">
                <span>Ngày tạo hồ sơ:</span>
                <strong className="text-slate-800 dark:text-zinc-200">{formatDate(customer.createdAt)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Trạng thái hồ sơ:</span>
                <strong className="text-emerald-600 font-bold">{customer.status}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Memberships */}
      {activeTab === 'memberships' && (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <IdentificationCard size={20} className="text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                Danh sách gói tập Membership
              </h2>
            </div>
            <Link
              to={`/owner/memberships?search=${encodeURIComponent(customer.customerCode)}`}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              + Đăng ký gói mới
            </Link>
          </div>

          {customer.memberships.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5">
              {customer.memberships.map((m) => {
                const isItemActive = m.status === 'ACTIVE';
                return (
                  <div
                    key={m.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isItemActive
                        ? 'border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 dark:border-emerald-800/40 shadow-xs'
                        : 'border-slate-200/80 bg-slate-50/50 dark:border-zinc-800 dark:bg-zinc-800/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
                          {m.packageName}
                        </p>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {formatMoney(m.price)}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isItemActive
                            ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                            : 'bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-zinc-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                      <span>Thời hạn áp dụng:</span>
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">
                        {formatDate(m.startDate)} → {formatDate(m.endDate)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-zinc-500 text-xs">
              <p>Hội viên chưa đăng ký gói tập nào.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: PT Packages */}
      {activeTab === 'pt' && (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Barbell size={20} className="text-amber-600 dark:text-amber-400" />
              <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                Gói Huấn luyện viên cá nhân (PT)
              </h2>
            </div>
          </div>

          {customer.ptPackages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5">
              {customer.ptPackages.map((p) => {
                const remaining = Math.max(0, p.totalSessions - p.usedSessions);
                const progressPct = Math.round((p.usedSessions / p.totalSessions) * 100);
                return (
                  <div
                    key={p.id}
                    className="p-5 rounded-2xl border border-amber-500/20 bg-amber-50/20 dark:bg-amber-950/10 dark:border-amber-900/30 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
                          {p.planName}
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
                          HLV phụ trách: <strong>{p.ptName}</strong>
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 ring-1 ring-amber-500/30">
                        {p.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-zinc-300">
                        <span>Tiến độ luyện tập:</span>
                        <span>
                          {p.usedSessions} / {p.totalSessions} buổi (còn {remaining} buổi)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-zinc-500 text-xs">
              <p>Khách hàng chưa đăng ký gói tập PT cá nhân nào.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Check-in History */}
      {activeTab === 'checkins' && (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-zinc-800">
            <CalendarCheck size={20} className="text-blue-600 dark:text-blue-400" />
            <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
              Nhật ký Check-in ra vào phòng tập
            </h2>
          </div>

          {customer.recentCheckins.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 pt-2">
              {customer.recentCheckins.map((c) => {
                const methodInfo = CHECKIN_METHOD_LABELS[c.method] || {
                  label: c.method,
                  icon: IdentificationCard,
                  color: 'text-slate-600 bg-slate-100 dark:bg-zinc-800 dark:text-zinc-400',
                };
                const MethodIcon = methodInfo.icon;
                return (
                  <div key={c.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${methodInfo.color}`}
                      >
                        <MethodIcon size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {c.branchName}
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                          Phương thức: {methodInfo.label}
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <p className="font-semibold text-slate-800 dark:text-zinc-200">
                        {formatDateTime(c.checkInAt)}
                      </p>
                      {c.checkOutAt && (
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                          Check-out: {formatDateTime(c.checkOutAt)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-zinc-500 text-xs">
              <p>Chưa có lượt check-in nào được ghi nhận.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Payment History */}
      {activeTab === 'payments' && (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-zinc-800">
            <Receipt size={20} className="text-purple-600 dark:text-purple-400" />
            <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
              Lịch sử giao dịch & Hoá đơn
            </h2>
          </div>

          {customer.recentPayments.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 pt-2">
              {customer.recentPayments.map((p) => (
                <div key={p.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
                      <Receipt size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        {p.paymentCode}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                        {p.paidAt ? formatDateTime(p.paidAt) : 'Chờ thanh toán'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
                      {formatMoney(p.totalAmount)}
                    </p>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.2 rounded-full text-[9px] font-black uppercase ${
                        p.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {p.status === 'PAID' ? 'Đã thanh toán' : p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-zinc-500 text-xs">
              <p>Chưa có giao dịch thanh toán nào.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
