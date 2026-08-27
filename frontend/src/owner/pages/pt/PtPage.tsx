import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  Barbell,
  Users,
  Ticket,
  CalendarCheck,
  MagnifyingGlass,
  ArrowRight,
  Clock,
  MapPin,
  CaretLeft,
  CaretRight,
  ListDashes,
  CalendarBlank,
} from '@phosphor-icons/react';
import {
  approvePtPackagePlan,
  listPtBookings,
  listPtPackagePlans,
  listPts,
  rejectPtPackagePlan,
  type PtSummary,
  type PtPackagePlan,
  type PtBookingRow,
} from '../../api/pt';
import { listBranches } from '../../api/branches';
import { apiErrorMessage } from '../../api/client';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Callout from '../../components/Callout';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { Skeleton } from '../../components/Skeleton';
import KpiCard from '../../components/KpiCard';
import { showConfirm, showToast } from '../../utils/swal';

const TABS = [
  { key: 'pts', label: 'Huấn luyện viên PT', icon: Barbell },
  { key: 'packages', label: 'Gói PT & Duyệt giá', icon: Ticket },
  { key: 'bookings', label: 'Lịch tập PT', icon: CalendarCheck },
] as const;

const PACKAGE_STATUS_LABELS: Record<string, { label: string; style: string }> = {
  DRAFT: { label: 'Nháp', style: 'bg-stone-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
  PENDING_APPROVAL: { label: 'Chờ Owner duyệt giá', style: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold animate-pulse' },
  ACTIVE: { label: 'Đang bán', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold' },
  INACTIVE: { label: 'Ngừng bán', style: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
  REJECTED: { label: 'Đã từ chối', style: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' },
};

const BOOKING_STATUS_LABELS: Record<string, { label: string; style: string }> = {
  SCHEDULED: { label: 'Đã lên lịch', style: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  COMPLETED: { label: 'Đã hoàn thành', style: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  CANCELLED: { label: 'Đã hủy', style: 'bg-stone-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
};

const HOURLY_TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00'
];

// UNIFIED FORM CONTROL STYLING CONSTANTS (CHUẨN KÍCH THƯỚC H-10 40PX TOÀN BỘ CONTROLS)
const UNIFORM_INPUT_CLASS =
  'h-10 text-sm font-medium rounded-xl border border-stone-200 bg-white px-3.5 text-zinc-800 shadow-sm outline-none transition-all placeholder:text-zinc-400 hover:border-zinc-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-700';

const UNIFORM_SEARCH_CLASS =
  'h-10 text-sm font-medium pl-9 pr-3.5 rounded-xl border border-stone-200 bg-white text-zinc-800 shadow-sm outline-none transition-all placeholder:text-zinc-400 hover:border-zinc-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-700';

const UNIFORM_BTN_CLASS =
  'h-10 px-3.5 text-sm font-semibold rounded-xl border border-stone-200 bg-white text-zinc-700 shadow-sm transition-all hover:bg-stone-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900';

const AVATAR_GRADIENTS = [
  'from-emerald-500 to-teal-700 text-white',
  'from-blue-500 to-indigo-700 text-white',
  'from-violet-500 to-purple-700 text-white',
  'from-amber-500 to-orange-700 text-white',
  'from-rose-500 to-pink-700 text-white',
];

function getAvatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function getInitials(name: string) {
  if (!name) return 'PT';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatMoney(amount: string | number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount));
}

function formatSpecificTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = d.toLocaleDateString('vi-VN');
  return `${dateStr} lúc ${timeStr}`;
}

function formatDateISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(date: Date) {
  return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }
  return pages;
}

export default function PtPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('pts');
  const [search, setSearch] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');

  const { data: pts } = useQuery({ queryKey: ['owner-pts'], queryFn: listPts });
  const { data: packages } = useQuery({ queryKey: ['owner-pt-packages'], queryFn: () => listPtPackagePlans() });

  const totalPts = pts?.length ?? 0;
  const pendingPackages = packages?.filter((p) => p.status === 'PENDING_APPROVAL').length ?? 0;
  const totalActiveCustomers = pts?.reduce((sum, p) => sum + p.activeCustomers, 0) ?? 0;
  const totalTodaySessions = pts?.reduce((sum, p) => sum + p.todaySessions, 0) ?? 0;

  const { data: branches } = useQuery({
    queryKey: ['owner-branches-list'],
    queryFn: listBranches,
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight text-zinc-900 dark:text-zinc-50">
            Quản lý PT & Lịch tập
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Theo dõi đội ngũ Huấn luyện viên cá nhân, duyệt giá các gói PT và giám sát lịch trình huấn luyện
          </p>
        </div>
      </div>

      {/* KPI Stat Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Barbell}
          tone="emerald"
          label="Đội ngũ HLV PT"
          value={`${totalPts} HLV`}
          hint="Đang hoạt động"
        />
        <KpiCard
          icon={Ticket}
          tone="amber"
          label="Gói PT chờ duyệt giá"
          value={`${pendingPackages} gói`}
          hint={pendingPackages > 0 ? 'Cần Owner xác nhận' : 'Đã duyệt hết'}
        />
        <KpiCard
          icon={Users}
          tone="blue"
          label="Hội viên đang tập PT"
          value={`${totalActiveCustomers} hội viên`}
          hint="Đã đăng ký gói PT"
        />
        <KpiCard
          icon={CalendarCheck}
          tone="violet"
          label="Buổi tập hôm nay"
          value={`${totalTodaySessions} buổi`}
          hint="Lịch tập trong ngày"
        />
      </div>

      {/* Segmented Tabs & Filters Toolbar (UNIFORM HEIGHT H-10 ACROSS ALL CONTROLS) */}
      <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Tab Navigation (UNIFORM H-10 HEIGHT) */}
          <div className="flex rounded-xl bg-stone-100 p-1 dark:bg-zinc-800">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all ${
                    tab === t.key
                      ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-950 dark:text-emerald-400'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                  }`}
                >
                  <Icon size={18} />
                  <span>{t.label}</span>
                  {t.key === 'packages' && pendingPackages > 0 && (
                    <span className="ml-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      {pendingPackages}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Unified Search & Branch Filter Controls (UNIFORM H-10 HEIGHT) */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px]">
              <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                placeholder="Tìm kiếm HLV, hội viên, gói tập..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={UNIFORM_SEARCH_CLASS}
              />
            </div>

            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className={UNIFORM_INPUT_CLASS}
            >
              <option value="">Tất cả chi nhánh</option>
              {branches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      {tab === 'pts' && <PtsTab search={search} selectedBranchId={selectedBranchId} />}
      {tab === 'packages' && <PackagesTab search={search} selectedBranchId={selectedBranchId} />}
      {tab === 'bookings' && <BookingsTab search={search} selectedBranchId={selectedBranchId} />}
    </div>
  );
}

// TAB 1: LIST OF PTs WITH UNIFIED RICH CARDS & DETAIL MODAL
function PtsTab({ search, selectedBranchId }: { search: string; selectedBranchId: string }) {
  const { data: pts, isLoading } = useQuery({
    queryKey: ['owner-pts', selectedBranchId],
    queryFn: () => listPts(selectedBranchId || undefined),
  });
  const [selectedPt, setSelectedPt] = useState<PtSummary | null>(null);

  if (isLoading) return <Skeleton className="h-48 w-full rounded-2xl" />;

  const filteredPts = pts?.filter((pt) =>
    search ? pt.fullName.toLowerCase().includes(search.toLowerCase()) || pt.specialties.some((s) => s.toLowerCase().includes(search.toLowerCase())) : true
  );

  if (!filteredPts || filteredPts.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Barbell}
          title="Không tìm thấy Huấn luyện viên nào"
          description={search ? 'Không có HLV phù hợp với từ khóa tìm kiếm.' : 'Mời HLV PT ở trang Quản lý Nhân sự.'}
        />
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPts.map((pt) => {
          const gradient = getAvatarGradient(pt.fullName);

          return (
            <motion.div key={pt.userId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="group flex flex-col justify-between transition-all hover:border-emerald-300 hover:shadow-md dark:hover:border-emerald-800">
                <div>
                  {/* PT Header */}
                  <div className="flex items-start gap-3.5 border-b border-stone-100 pb-4 dark:border-zinc-800">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-display text-sm font-bold shadow-md ${gradient}`}
                    >
                      {getInitials(pt.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                          {pt.fullName}
                        </h3>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                          {pt.status === 'ACTIVE' ? 'Đang hoạt động' : pt.status}
                        </span>
                      </div>
                      {pt.experienceYears !== null && (
                        <p className="mt-0.5 text-xs text-zinc-400">{pt.experienceYears} năm kinh nghiệm huấn luyện</p>
                      )}
                      {pt.branchNames && pt.branchNames.length > 0 && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <MapPin size={13} />
                          {pt.branchNames.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Specialties Badges */}
                  {pt.specialties.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {pt.specialties.map((s, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg border border-stone-200/80 bg-stone-50 px-2 py-1 text-[11px] font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-stone-50 p-3 text-xs dark:bg-zinc-950">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Hội viên phụ trách</span>
                      <span className="mt-1 font-display text-lg font-extrabold text-emerald-700 dark:text-emerald-400">
                        {pt.activeCustomers} <span className="text-xs font-normal text-zinc-400">khách</span>
                      </span>
                    </div>
                    <div className="flex flex-col border-l border-stone-200 pl-3 dark:border-zinc-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Buổi hôm nay</span>
                      <span className="mt-1 font-display text-lg font-extrabold text-blue-700 dark:text-blue-400">
                        {pt.todaySessions} <span className="text-xs font-normal text-zinc-400">buổi</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-stone-100 pt-3 dark:border-zinc-800">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center h-10! text-xs font-semibold"
                    onClick={() => setSelectedPt(pt)}
                  >
                    Xem chi tiết HLV <ArrowRight size={14} />
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* PT DETAIL MODAL */}
      {selectedPt && (
        <Modal open={!!selectedPt} title={`Hồ sơ HLV ${selectedPt.fullName}`} onClose={() => setSelectedPt(null)}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3.5 rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-display text-base font-bold shadow-md ${getAvatarGradient(
                  selectedPt.fullName
                )}`}
              >
                {getInitials(selectedPt.fullName)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{selectedPt.fullName}</h3>
                <p className="text-xs text-zinc-400">
                  {selectedPt.experienceYears ? `${selectedPt.experienceYears} năm kinh nghiệm` : 'Huấn luyện viên cá nhân PT'}
                </p>
                {selectedPt.branchNames && selectedPt.branchNames.length > 0 && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <MapPin size={13} />
                    Chi nhánh: {selectedPt.branchNames.join(', ')}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {selectedPt.specialties.map((s, idx) => (
                    <span key={idx} className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-stone-100 p-3 dark:border-zinc-800">
                <span className="text-zinc-400">Hội viên đang tập</span>
                <p className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">{selectedPt.activeCustomers} hội viên</p>
              </div>
              <div className="rounded-xl border border-stone-100 p-3 dark:border-zinc-800">
                <span className="text-zinc-400">Số buổi tập hôm nay</span>
                <p className="mt-1 text-base font-bold text-blue-600 dark:text-blue-400">{selectedPt.todaySessions} buổi</p>
              </div>
            </div>

            <div className="mt-2 flex justify-end gap-2 border-t border-stone-100 pt-3 dark:border-zinc-800">
              <Button variant="ghost" size="sm" onClick={() => setSelectedPt(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

// TAB 2: PT PACKAGES APPROVAL WORKFLOW
function PackagesTab({ search, selectedBranchId }: { search: string; selectedBranchId: string }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data: packages, isLoading } = useQuery({
    queryKey: ['owner-pt-packages', statusFilter, selectedBranchId],
    queryFn: () => listPtPackagePlans(statusFilter || undefined, selectedBranchId || undefined),
  });

  const [selectedPackage, setSelectedPackage] = useState<PtPackagePlan | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const approveMutation = useMutation({
    mutationFn: (id: string) => approvePtPackagePlan(id),
    onSuccess: () => {
      showToast('Đã duyệt giá thành công gói PT', 'success');
      queryClient.invalidateQueries({ queryKey: ['owner-pt-packages'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể duyệt gói PT')),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectPtPackagePlan(rejectingId!, reason),
    onSuccess: () => {
      setRejectingId(null);
      setReason('');
      showToast('Đã từ chối gói PT', 'info');
      queryClient.invalidateQueries({ queryKey: ['owner-pt-packages'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể từ chối gói PT')),
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  const filteredPackages = packages?.filter((p) =>
    search ? p.name.toLowerCase().includes(search.toLowerCase()) || p.ptName.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="flex flex-col gap-4">
      {error && <Callout tone="danger">{error}</Callout>}

      {/* Package Status Filter Pills (UNIFORM H-10 HEIGHT) */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: '', label: 'Tất cả gói' },
          { key: 'PENDING_APPROVAL', label: 'Chờ Owner duyệt' },
          { key: 'ACTIVE', label: 'Đang bán' },
          { key: 'REJECTED', label: 'Đã từ chối' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`h-10 rounded-xl px-4 text-xs font-bold transition-all ${
              statusFilter === f.key
                ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500'
                : 'border border-stone-200 bg-stone-50 text-zinc-600 hover:bg-stone-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!filteredPackages || filteredPackages.length === 0 ? (
        <Card>
          <EmptyState icon={Barbell} title="Chưa có gói PT nào" description="PT tạo gói tập, Owner duyệt giá trước khi mở bán." />
        </Card>
      ) : (
        <Card padded={false} className="overflow-hidden rounded-2xl border border-stone-200 shadow-sm dark:border-zinc-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
                  <th className="px-5 py-3.5">Tên Gói tập</th>
                  <th className="px-5 py-3.5">PT khởi tạo</th>
                  <th className="px-5 py-3.5">Số buổi</th>
                  <th className="px-5 py-3.5">Tổng giá bán</th>
                  <th className="px-5 py-3.5">Giá / buổi</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/60">
                {filteredPackages.map((p) => {
                  const statusInfo = PACKAGE_STATUS_LABELS[p.status] ?? { label: p.status, style: 'bg-stone-100 text-zinc-600' };
                  const pricePerSession = p.sessionCount > 0 ? Number(p.price) / p.sessionCount : 0;

                  return (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group hover:bg-stone-50/80 dark:hover:bg-zinc-900/60">
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <strong className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            {p.name}
                          </strong>
                          {p.description && <span className="text-xs text-zinc-400 line-clamp-1">{p.description}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-zinc-700 dark:text-zinc-300">{p.ptName}</td>
                      <td className="px-5 py-4 font-mono font-semibold text-zinc-800 dark:text-zinc-200">{p.sessionCount} buổi</td>
                      <td className="px-5 py-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatMoney(p.price)}</td>
                      <td className="px-5 py-4 font-mono text-xs text-zinc-500">{formatMoney(pricePerSession)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusInfo.style}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {p.status === 'PENDING_APPROVAL' && (
                            <>
                              <Button
                                size="sm"
                                className="px-3! py-1.5! text-xs font-bold"
                                disabled={approveMutation.isPending}
                                onClick={async () => {
                                  const confirmed = await showConfirm({
                                    title: `Duyệt gói PT "${p.name}"?`,
                                    text: `Duyệt giá gói ${p.sessionCount} buổi với tổng số tiền ${formatMoney(p.price)} để mở bán?`,
                                    confirmButtonText: 'Duyệt bán ngay',
                                    icon: 'question',
                                  });
                                  if (confirmed) approveMutation.mutate(p.id);
                                }}
                              >
                                Duyệt giá
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="px-3! py-1.5! text-xs"
                                onClick={() => setRejectingId(p.id)}
                              >
                                Từ chối
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" className="px-2! py-1! text-xs" onClick={() => setSelectedPackage(p)}>
                            Chi tiết
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* PACKAGE DETAIL MODAL */}
      {selectedPackage && (
        <Modal open={!!selectedPackage} title={`Chi tiết Gói PT: ${selectedPackage.name}`} onClose={() => setSelectedPackage(null)}>
          <div className="flex flex-col gap-4 text-sm">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${PACKAGE_STATUS_LABELS[selectedPackage.status]?.style}`}>
                  {PACKAGE_STATUS_LABELS[selectedPackage.status]?.label || selectedPackage.status}
                </span>
                <span className="font-mono text-xs text-zinc-400">
                  Tạo ngày: {new Date(selectedPackage.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <h3 className="mt-2 text-lg font-bold text-zinc-900 dark:text-zinc-50">{selectedPackage.name}</h3>
              {selectedPackage.description && <p className="mt-1 text-xs text-zinc-500">{selectedPackage.description}</p>}
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between py-1 border-b border-stone-100 dark:border-zinc-800">
                <span className="text-zinc-500">PT Khởi tạo</span>
                <strong className="text-zinc-800 dark:text-zinc-200">{selectedPackage.ptName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100 dark:border-zinc-800">
                <span className="text-zinc-500">Số buổi tập</span>
                <strong className="font-mono text-zinc-800 dark:text-zinc-200">{selectedPackage.sessionCount} buổi</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100 dark:border-zinc-800">
                <span className="text-zinc-500">Tổng giá niêm yết</span>
                <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatMoney(selectedPackage.price)}</strong>
              </div>
              {selectedPackage.rejectReason && (
                <div className="flex flex-col gap-1 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  <span className="font-bold">Lý do từ chối:</span>
                  <p>{selectedPackage.rejectReason}</p>
                </div>
              )}
            </div>

            <div className="mt-2 flex justify-end gap-2 border-t border-stone-100 pt-3 dark:border-zinc-800">
              <Button variant="ghost" size="sm" onClick={() => setSelectedPackage(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* REJECT PACKAGE MODAL (UNIFORM FORM INPUTS) */}
      <Modal open={rejectingId !== null} onClose={() => setRejectingId(null)} title="Từ chối Gói PT">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            rejectMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <FormField label="Lý do từ chối" htmlFor="reject-reason">
            <textarea
              id="reject-reason"
              required
              rows={3}
              placeholder="Nhập lý do từ chối (vd: Đơn giá chưa phù hợp, số buổi quá ngắn...)"
              className={`${UNIFORM_INPUT_CLASS} h-auto! py-2.5`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setRejectingId(null)}>
              Hủy
            </Button>
            <Button type="submit" disabled={rejectMutation.isPending}>
              {rejectMutation.isPending ? 'Đang gửi...' : 'Từ chối gói'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// TAB 3: BOOKINGS TAB WITH DAILY TIMETABLE SCHEDULE VIEW & UNIFORM H-10 CONTROLS
function BookingsTab({ search, selectedBranchId }: { search: string; selectedBranchId: string }) {
  const [viewMode, setViewMode] = useState<'schedule' | 'table'>('schedule');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const dateIsoString = formatDateISO(selectedDate);

  const { data, isLoading } = useQuery({
    queryKey: ['owner-pt-bookings', page, selectedBranchId, statusFilter, dateIsoString],
    queryFn: () =>
      listPtBookings({
        page,
        branchId: selectedBranchId || undefined,
        date: dateIsoString,
      }),
  });

  const [selectedBooking, setSelectedBooking] = useState<PtBookingRow | null>(null);

  const handlePrevDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() - 1);
    setSelectedDate(nextDate);
  };

  const handleNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setSelectedDate(nextDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  const filteredBookings = data?.items.filter((b) => {
    const matchSearch = search
      ? b.customerName.toLowerCase().includes(search.toLowerCase()) ||
        b.ptName.toLowerCase().includes(search.toLowerCase()) ||
        b.branchName.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchStatus = statusFilter ? b.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const startItem = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const endItem = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Date Navigation & View Mode Switcher Header Bar (UNIFORM H-10 HEIGHT ACROSS ALL BUTTONS & INPUTS) */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Date Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleToday} className={UNIFORM_BTN_CLASS}>
            Hôm nay
          </button>
          <div className="flex items-center gap-1">
            <button onClick={handlePrevDay} title="Ngày trước" className={`${UNIFORM_BTN_CLASS} w-10! px-0! justify-center`}>
              <CaretLeft size={18} />
            </button>
            <button onClick={handleNextDay} title="Ngày sau" className={`${UNIFORM_BTN_CLASS} w-10! px-0! justify-center`}>
              <CaretRight size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2 border-l border-stone-200 pl-3 dark:border-zinc-800">
            <CalendarBlank size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-display text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {formatDisplayDate(selectedDate)}
            </span>
          </div>

          <input
            type="date"
            value={dateIsoString}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(new Date(e.target.value));
            }}
            className={UNIFORM_INPUT_CLASS}
          />
        </div>

        {/* View Mode Switcher Pills (UNIFORM H-10 HEIGHT) */}
        <div className="flex rounded-xl bg-stone-100 p-1 dark:bg-zinc-800">
          <button
            onClick={() => setViewMode('schedule')}
            className={`flex h-10 items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold transition-all ${
              viewMode === 'schedule'
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-950 dark:text-emerald-400'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
            }`}
          >
            <CalendarCheck size={18} />
            <span>📅 Lịch trình Ngày</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex h-10 items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold transition-all ${
              viewMode === 'table'
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-950 dark:text-emerald-400'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
            }`}
          >
            <ListDashes size={18} />
            <span>📋 Danh sách Bảng</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: DAILY TIMETABLE SCHEDULE VIEW */}
      {viewMode === 'schedule' ? (
        <Card className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-stone-200 shadow-sm dark:border-zinc-800">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3 dark:border-zinc-800">
            <div>
              <h3 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
                Lịch trình huấn luyện PT — {formatDisplayDate(selectedDate)}
              </h3>
              <p className="text-xs text-zinc-400">Khung giờ các buổi tập diễn ra trong ngày từ 06:00 đến 21:00</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {filteredBookings?.length ?? 0} buổi tập
            </span>
          </div>

          <div className="flex flex-col divide-y divide-stone-100 dark:divide-zinc-800/80">
            {HOURLY_TIME_SLOTS.map((slotHour) => {
              const slotNum = parseInt(slotHour.split(':')[0], 10);

              const slotBookings = filteredBookings?.filter((b) => {
                const bHour = new Date(b.scheduledStart).getHours();
                return bHour === slotNum;
              });

              return (
                <div key={slotHour} className="flex min-h-[64px] items-start gap-4 py-2.5 transition-colors hover:bg-stone-50/50 dark:hover:bg-zinc-950/40">
                  <div className="w-16 shrink-0 font-mono text-xs font-bold text-zinc-400">
                    {slotHour}
                  </div>

                  <div className="flex-1 flex flex-wrap gap-3">
                    {slotBookings && slotBookings.length > 0 ? (
                      slotBookings.map((b) => {
                        const statusInfo = BOOKING_STATUS_LABELS[b.status] ?? { label: b.status, style: 'bg-stone-100 text-zinc-600' };
                        const startTime = new Date(b.scheduledStart).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                        const endTime = new Date(b.scheduledEnd).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                        return (
                          <motion.div
                            key={b.id}
                            initial={{ scale: 0.96, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={() => setSelectedBooking(b)}
                            className="group flex flex-1 min-w-[260px] cursor-pointer flex-col gap-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3 shadow-sm transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-md dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:hover:border-emerald-700"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-display text-xs font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                Hội viên: {b.customerName}
                              </span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusInfo.style}`}>
                                {statusInfo.label}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-600 dark:text-zinc-300">
                              <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                                <Barbell size={13} />
                                {b.ptName}
                              </span>
                              <span className="flex items-center gap-1 text-zinc-500">
                                <MapPin size={13} />
                                {b.branchName}
                              </span>
                              <span className="flex items-center gap-1 font-mono text-zinc-400">
                                <Clock size={13} />
                                {startTime} - {endTime}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="flex items-center text-[11px] text-zinc-300 dark:text-zinc-700 italic">
                        — Không có lịch tập
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        /* VIEW MODE 2: TABLE LIST VIEW */
        <>
          {/* Booking Status Filter Pills (UNIFORM H-10 HEIGHT) */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: '', label: 'Tất cả buổi tập' },
              { key: 'SCHEDULED', label: 'Đã lên lịch' },
              { key: 'COMPLETED', label: 'Đã hoàn thành' },
              { key: 'CANCELLED', label: 'Đã hủy' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setStatusFilter(f.key);
                  setPage(1);
                }}
                className={`h-10 rounded-xl px-4 text-xs font-bold transition-all ${
                  statusFilter === f.key
                    ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500'
                    : 'border border-stone-200 bg-stone-50 text-zinc-600 hover:bg-stone-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {!filteredBookings || filteredBookings.length === 0 ? (
            <Card>
              <EmptyState icon={CalendarCheck} title="Không tìm thấy buổi tập PT nào" description="Lịch tập do PT và hội viên đăng ký sẽ xuất hiện tại đây." />
            </Card>
          ) : (
            <Card padded={false} className="overflow-hidden rounded-2xl border border-stone-200 shadow-sm dark:border-zinc-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
                      <th className="px-5 py-3.5">Thời gian</th>
                      <th className="px-5 py-3.5">Hội viên</th>
                      <th className="px-5 py-3.5">Huấn luyện viên PT</th>
                      <th className="px-5 py-3.5">Chi nhánh</th>
                      <th className="px-5 py-3.5">Trạng thái</th>
                      <th className="px-5 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/60">
                    {filteredBookings.map((b) => {
                      const statusInfo = BOOKING_STATUS_LABELS[b.status] ?? { label: b.status, style: 'bg-stone-100 text-zinc-600' };

                      return (
                        <tr key={b.id} className="group hover:bg-stone-50/80 dark:hover:bg-zinc-900/60">
                          <td className="px-5 py-4 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                            {formatSpecificTime(b.scheduledStart)}
                          </td>
                          <td className="px-5 py-4 font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            {b.customerName}
                          </td>
                          <td className="px-5 py-4 font-medium text-zinc-700 dark:text-zinc-300">{b.ptName}</td>
                          <td className="px-5 py-4 text-zinc-600 dark:text-zinc-300">{b.branchName}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusInfo.style}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Button variant="ghost" size="sm" className="px-2! py-1! text-xs font-semibold" onClick={() => setSelectedBooking(b)}>
                              Chi tiết buổi tập <ArrowRight size={12} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Pagination Footer */}
          {data && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 text-sm">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Hiển thị <strong className="font-semibold text-zinc-800 dark:text-zinc-200">{startItem} - {endItem}</strong> trong tổng số <strong className="font-semibold text-zinc-800 dark:text-zinc-200">{data.total}</strong> buổi tập
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 text-xs"
                >
                  <CaretLeft size={14} />
                  <span>Trước</span>
                </Button>

                {getPageNumbers(data.page, data.totalPages).map((pNum, idx) =>
                  typeof pNum === 'number' ? (
                    <button
                      key={idx}
                      onClick={() => setPage(pNum)}
                      className={`h-8 min-w-[32px] rounded-lg px-2 text-xs font-semibold transition-all ${
                        pNum === data.page
                          ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500'
                          : 'text-zinc-600 hover:bg-stone-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {pNum}
                    </button>
                  ) : (
                    <span key={idx} className="px-1 text-xs text-zinc-400">
                      ...
                    </span>
                  )
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  className="px-2.5 py-1 text-xs"
                >
                  <span>Sau</span>
                  <CaretRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* BOOKING DETAIL MODAL */}
      {selectedBooking && (
        <Modal open={!!selectedBooking} title="Chi tiết Buổi tập PT" onClose={() => setSelectedBooking(null)}>
          <div className="flex flex-col gap-4 text-sm">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${BOOKING_STATUS_LABELS[selectedBooking.status]?.style}`}>
                  {BOOKING_STATUS_LABELS[selectedBooking.status]?.label || selectedBooking.status}
                </span>
                <span className="font-mono text-xs text-zinc-400">
                  {formatSpecificTime(selectedBooking.scheduledStart)}
                </span>
              </div>
              <h3 className="mt-2 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Hội viên: {selectedBooking.customerName}
              </h3>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between py-1 border-b border-stone-100 dark:border-zinc-800">
                <span className="text-zinc-500">Huấn luyện viên PT</span>
                <strong className="text-zinc-800 dark:text-zinc-200">{selectedBooking.ptName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100 dark:border-zinc-800">
                <span className="text-zinc-500">Chi nhánh tập</span>
                <strong className="text-zinc-800 dark:text-zinc-200">{selectedBooking.branchName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100 dark:border-zinc-800">
                <span className="text-zinc-500">Thời gian bắt đầu</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">{formatSpecificTime(selectedBooking.scheduledStart)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100 dark:border-zinc-800">
                <span className="text-zinc-500">Thời gian kết thúc dự kiến</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">{formatSpecificTime(selectedBooking.scheduledEnd)}</span>
              </div>
            </div>

            <div className="mt-2 flex justify-end gap-2 border-t border-stone-100 pt-3 dark:border-zinc-800">
              <Button variant="ghost" size="sm" onClick={() => setSelectedBooking(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
