import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Pencil,
  Storefront,
  Users,
  UsersThree,
  MapPin,
  Phone,
  EnvelopeSimple,
  Clock,
  CalendarCheck,
  Desktop,
  IdentificationCard,
  CreditCard,
  ArrowSquareOut,
  Power,
  ShieldCheck,
  UserCheck,
} from '@phosphor-icons/react';
import { getBranch, updateBranch, type UpdateBranchInput } from '../../api/branches';
import { apiErrorMessage } from '../../api/client';
import Button from '../../components/Button';
import Callout from '../../components/Callout';
import { Skeleton } from '../../components/Skeleton';
import Modal from '../../components/Modal';
import FormField, { inputClass } from '../../components/FormField';
import OperatingHoursPicker from '../../components/OperatingHoursPicker';
import { formatOperatingTime } from '../../../manager/api/manager';
import { joinBranch } from '../../../lib/socket';

const SUGGESTIONS = ['Thứ 2 - Chủ nhật', 'Thứ 2 - Thứ 7', 'Hàng ngày', 'Thứ 2 - Thứ 6'];

function getInitials(name: string) {
  if (!name) return 'NV';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function cleanTimeStr(val?: string | null, fallback = '08:00') {
  if (!val) return fallback;
  if (val.includes('T')) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
    }
  }
  return val.slice(0, 5) || fallback;
}

export default function BranchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: branch, isLoading } = useQuery({
    queryKey: ['owner-branch', id],
    queryFn: () => getBranch(id!),
  });

  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    openingDays: '',
    openingTime: '05:00',
    closingTime: '22:00',
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'INACTIVE') => updateBranch(id!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-branch', id] });
      queryClient.invalidateQueries({ queryKey: ['owner-branches'] });
      queryClient.invalidateQueries({ queryKey: ['available-branches'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể cập nhật trạng thái chi nhánh')),
  });

  const updateBranchMutation = useMutation({
    mutationFn: (input: UpdateBranchInput) => updateBranch(id!, input),
    onSuccess: () => {
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['owner-branch', id] });
      queryClient.invalidateQueries({ queryKey: ['owner-branches'] });
      queryClient.invalidateQueries({ queryKey: ['available-branches'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể cập nhật thông tin chi nhánh')),
  });

  function handleOpenPortal(targetPath: '/manager' | '/staff') {
    if (!branch) return;
    localStorage.setItem('fitflow_active_branch_id', branch.id);
    joinBranch(branch.id);
    queryClient.invalidateQueries();
    window.dispatchEvent(new CustomEvent('fitflow:branch-changed', { detail: { branchId: branch.id } }));
    navigate(targetPath);
  }

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

  if (!branch) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-500 dark:text-zinc-400">Không tìm thấy thông tin chi nhánh.</p>
        <Link to="/owner/branches" className="mt-4 inline-block text-emerald-600 font-medium hover:underline">
          Quay lại danh sách chi nhánh
        </Link>
      </div>
    );
  }

  function handleOpenEdit() {
    if (!branch) return;
    setForm({
      name: branch.name || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      openingDays: branch.openingDays || 'Thứ 2 - Chủ nhật',
      openingTime: cleanTimeStr(branch.openingTime, '05:00'),
      closingTime: cleanTimeStr(branch.closingTime, '22:00'),
    });
    setError(null);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    updateBranchMutation.mutate({
      name: form.name,
      address: form.address || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      openingDays: form.openingDays,
      openingTime: form.openingTime,
      closingTime: form.closingTime,
    });
  }

  const operatingHoursFormatted = formatOperatingTime(branch.openingTime, branch.closingTime) || '05:00 - 22:00';
  const isActive = branch.status === 'ACTIVE';

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Back Navigation Breadcrumb */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/owner/branches')}
          className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-2xs group-hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:group-hover:bg-zinc-800">
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          </div>
          <span>Danh sách Chi Nhánh</span>
        </button>
      </div>

      {error && <Callout tone="danger">{error}</Callout>}

      {/* Hero Branch Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/60 to-emerald-50/20 p-6 sm:p-8 shadow-sm dark:border-zinc-800/80 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-emerald-950/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: Branch Identity */}
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white shadow-lg shadow-emerald-500/20">
              <Storefront size={36} weight="duotone" />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                {isActive ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-slate-400 ring-2 ring-white dark:ring-zinc-900" />
                )}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {branch.name}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700/80">
                  {branch.code}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 ring-1 ring-rose-500/30'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {isActive ? 'Đang hoạt động' : 'Tạm ngưng'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 flex-wrap">
                <MapPin size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{branch.address || 'Chưa cập nhật địa chỉ'}</span>
              </p>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t border-slate-200/60 lg:border-t-0 dark:border-zinc-800/60">
            {/* Enter Manager Portal */}
            <button
              type="button"
              onClick={() => handleOpenPortal('/manager')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
              title="Mở Bàn Quản lý của chi nhánh này"
            >
              <Desktop size={16} weight="bold" />
              <span>Bàn Quản lý</span>
            </button>

            {/* Enter Staff/POS Portal */}
            <button
              type="button"
              onClick={() => handleOpenPortal('/staff')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
              title="Mở Bàn Lễ tân & POS của chi nhánh này"
            >
              <IdentificationCard size={16} weight="bold" />
              <span>Quầy Lễ Tân (POS)</span>
            </button>

            {/* Edit Branch Info */}
            <button
              type="button"
              onClick={handleOpenEdit}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 font-semibold text-xs shadow-2xs transition-all cursor-pointer"
            >
              <Pencil size={15} />
              <span>Chỉnh sửa</span>
            </button>

            {/* Toggle Active Status */}
            <button
              type="button"
              disabled={toggleStatusMutation.isPending}
              onClick={() => toggleStatusMutation.mutate(isActive ? 'INACTIVE' : 'ACTIVE')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs shadow-2xs transition-all cursor-pointer border ${
                isActive
                  ? 'border-rose-200 bg-rose-50/80 text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300'
                  : 'border-emerald-200 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
              }`}
            >
              <Power size={15} />
              <span>{isActive ? 'Ngừng hoạt động' : 'Kích hoạt lại'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Members */}
        <Link
          to={`/owner/customers?branchId=${branch.id}`}
          className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-md hover:border-emerald-500/40 dark:border-zinc-800 dark:bg-zinc-900 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Hội viên cơ sở
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Users size={20} weight="duotone" />
            </div>
          </div>
          <p className="font-display text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {branch.memberCount}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 flex items-center gap-1">
            <span>Bấm để xem danh sách hội viên</span>
            <ArrowSquareOut size={12} />
          </p>
        </Link>

        {/* Card 2: Staff */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Nhân sự phụ trách
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <UsersThree size={20} weight="duotone" />
            </div>
          </div>
          <p className="font-display text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {branch.staffCount}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
            Bao gồm Quản lý, Lễ tân & PT
          </p>
        </div>

        {/* Card 3: Checkin Today */}
        <Link
          to={`/owner/checkin?branchId=${branch.id}`}
          className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-md hover:border-emerald-500/40 dark:border-zinc-800 dark:bg-zinc-900 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Check-in hôm nay
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <CalendarCheck size={20} weight="duotone" />
            </div>
          </div>
          <p className="font-display text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {branch.checkinToday}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 flex items-center gap-1">
            <span>Thời gian thực tại phòng</span>
            <ArrowSquareOut size={12} />
          </p>
        </Link>

        {/* Card 4: Operating Hours */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Giờ phục vụ
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
              <Clock size={20} weight="duotone" />
            </div>
          </div>
          <p className="font-display text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {operatingHoursFormatted}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 truncate">
            {branch.openingDays || 'Thứ 2 - Chủ nhật'}
          </p>
        </div>
      </div>

      {/* Main Content Grid: Detailed Info + Staff Team */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Navigation Hub */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Info Card */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Storefront size={20} className="text-emerald-600 dark:text-emerald-400" />
                <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  Thông tin vận hành & Liên hệ
                </h2>
              </div>
              <button
                type="button"
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
              >
                <Pencil size={14} />
                <span>Chỉnh sửa</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800/80">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Địa chỉ cơ sở
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-0.5 leading-relaxed">
                    {branch.address || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800/80">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Hotline chi nhánh
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-0.5">
                    {branch.phone ? (
                      <a href={`tel:${branch.phone}`} className="hover:text-blue-600 hover:underline">
                        {branch.phone}
                      </a>
                    ) : (
                      '—'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800/80">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
                  <EnvelopeSimple size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Email liên hệ
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-0.5">
                    {branch.email ? (
                      <a href={`mailto:${branch.email}`} className="hover:text-purple-600 hover:underline truncate">
                        {branch.email}
                      </a>
                    ) : (
                      '—'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800/80">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    Lịch mở cửa
                  </p>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-0.5">
                    {branch.openingDays || 'Thứ 2 - Chủ nhật'} ({operatingHoursFormatted})
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Hub Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Link
              to={`/owner/customers?branchId=${branch.id}`}
              className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-emerald-950/20 transition-all group shadow-2xs cursor-pointer"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 group-hover:scale-105 transition-transform">
                <UserCheck size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Hội viên cơ sở</p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">Xem danh sách & gói</p>
              </div>
            </Link>

            <Link
              to={`/owner/checkin?branchId=${branch.id}`}
              className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-500/50 hover:bg-blue-50/20 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-blue-950/20 transition-all group shadow-2xs cursor-pointer"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 group-hover:scale-105 transition-transform">
                <IdentificationCard size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Lịch sử Check-in</p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">Nhật ký ra vào quầy</p>
              </div>
            </Link>

            <Link
              to={`/owner/memberships?branchId=${branch.id}`}
              className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-purple-500/50 hover:bg-purple-50/20 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-purple-950/20 transition-all group shadow-2xs cursor-pointer"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 group-hover:scale-105 transition-transform">
                <CreditCard size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Gói tập & Thu phí</p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">Quản lý doanh thu</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Staff Assigned Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400" />
                <h2 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  Nhân sự phụ trách
                </h2>
              </div>
              <Link
                to="/owner/branch-managers"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Phân quyền
              </Link>
            </div>

            {branch.staff && branch.staff.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 mt-3">
                {branch.staff.map((s) => {
                  const isManager = s.roles.includes('BRANCH_MANAGER');
                  const isPt = s.roles.includes('PT');
                  return (
                    <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-2xs ${
                            isManager
                              ? 'bg-blue-600 text-white'
                              : isPt
                              ? 'bg-amber-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {getInitials(s.fullName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {s.fullName}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {s.roles.map((role) => {
                              if (role === 'BRANCH_MANAGER') {
                                return (
                                  <span
                                    key={role}
                                    className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-blue-500/10 text-blue-700 dark:text-blue-300"
                                  >
                                    Quản lý
                                  </span>
                                );
                              }
                              if (role === 'PT') {
                                return (
                                  <span
                                    key={role}
                                    className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                  >
                                    HLV (PT)
                                  </span>
                                );
                              }
                              return (
                                <span
                                  key={role}
                                  className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                >
                                  Lễ tân
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 dark:text-zinc-500 text-xs">
                <p>Chưa có nhân sự nào được phân công vào chi nhánh này.</p>
                <Link
                  to="/owner/branch-managers"
                  className="mt-2 inline-block text-emerald-600 font-bold hover:underline"
                >
                  + Phân công nhân sự ngay
                </Link>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <Link
              to="/owner/branch-managers"
              className="flex w-full items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 dark:border-zinc-800 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 dark:text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <UsersThree size={16} />
              <span>Quản lý danh sách nhân sự chuỗi</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Edit Modal with Modern OperatingHoursPicker */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Cấu hình thông tin chi nhánh">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Tên chi nhánh *" htmlFor="branch-form-name">
            <input
              id="branch-form-name"
              required
              placeholder="VD: Cầu Giấy, Hai Bà Trưng..."
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </FormField>

          <FormField label="Địa chỉ cơ sở" htmlFor="branch-form-address">
            <input
              id="branch-form-address"
              placeholder="VD: 213 Cầu Giấy, Hà Nội"
              className={inputClass}
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Hotline" htmlFor="branch-form-phone">
              <input
                id="branch-form-phone"
                placeholder="VD: 0961708655"
                className={inputClass}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </FormField>

            <FormField label="Email liên hệ" htmlFor="branch-form-email">
              <input
                id="branch-form-email"
                type="email"
                placeholder="VD: caugiay@fitflow.vn"
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="Ngày hoạt động *" htmlFor="branch-form-days">
            <div>
              <input
                id="branch-form-days"
                required
                placeholder="Ví dụ: Thứ 2 - Chủ nhật"
                className={inputClass}
                value={form.openingDays}
                onChange={(e) => setForm((f) => ({ ...f, openingDays: e.target.value }))}
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, openingDays: s }))}
                    className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </FormField>

          {/* Operating Hours Picker Component */}
          <OperatingHoursPicker
            openingTime={form.openingTime}
            closingTime={form.closingTime}
            onChange={(open, close) => setForm((f) => ({ ...f, openingTime: open, closingTime: close }))}
          />

          {updateBranchMutation.isError && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {apiErrorMessage(updateBranchMutation.error, 'Không thể cập nhật cấu hình chi nhánh')}
            </p>
          )}

          <div className="flex justify-end gap-2.5 mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={updateBranchMutation.isPending}>
              {updateBranchMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
