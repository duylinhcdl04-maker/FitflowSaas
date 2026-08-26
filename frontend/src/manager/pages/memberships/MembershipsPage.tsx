import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  Snowflake,
  PlusCircle,
  Ticket,
  Storefront,
  Globe,
  Barbell,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MagnifyingGlass,
  CreditCard,
} from '@phosphor-icons/react';
import {
  freezeMembership,
  addFreeDays,
  getBranchPackages,
  getPtPackagePlans,
  approvePtPackagePlan,
  rejectPtPackagePlan,
  getManagerCustomers,
  assignPtPackage,
  type PtPackagePlanItem,
} from '../../api/manager';
import { apiErrorMessage } from '../../../owner/api/client';
import Card from '../../../owner/components/Card';
import Button from '../../../owner/components/Button';
import FormField, { inputClass } from '../../../owner/components/FormField';
import Modal from '../../../owner/components/Modal';
import { Skeleton } from '../../../owner/components/Skeleton';
import PendingQrPaymentModal from '../../components/PendingQrPaymentModal';
import { useRealtimeInvalidate } from '../../../lib/useRealtimeInvalidate';

const DURATION_UNITS_MAP: Record<string, string> = {
  DAY: 'Ngày',
  WEEK: 'Tuần',
  MONTH: 'Tháng',
  QUARTER: 'Quý',
  YEAR: 'Năm',
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export default function ManagerMembershipsPage() {
  const queryClient = useQueryClient();
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [addDaysModalOpen, setAddDaysModalOpen] = useState(false);

  // Rejection modal state for PT Packages
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [ptPlanFilter, setPtPlanFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED'>('PENDING_APPROVAL');

  // Assign PT Package Modal state
  const [assignPtModalOpen, setAssignPtModalOpen] = useState(false);
  const [selectedPtPlan, setSelectedPtPlan] = useState<PtPackagePlanItem | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [ptStartDate, setPtStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [ptPaymentMethod, setPtPaymentMethod] = useState<'CASH' | 'VIETQR' | 'CREDIT_CARD'>('CASH');

  const [membershipId, setMembershipId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingQr, setPendingQr] = useState<{ paymentId: string; qrUrl: string; amount: number; expiresAt: string } | null>(null);

  // 1. Lay danh sach goi tap duoc Owner gan cho co so nay
  const { data: packages, isLoading: isLoadingPackages } = useQuery({
    queryKey: ['manager-branch-packages'],
    queryFn: () => getBranchPackages(),
  });

  // 2. Lay danh sach goi tap PT do cac PT de xuat
  const { data: ptPlans, isLoading: isLoadingPtPlans } = useQuery({
    queryKey: ['manager-pt-package-plans'],
    queryFn: () => getPtPackagePlans(),
  });

  useRealtimeInvalidate('payment:confirmed', [['manager-pt-package-plans']]);

  // Customer search query for PT assignment modal
  const { data: customerSearchResults, isLoading: searchingCustomers } = useQuery({
    queryKey: ['manager-customer-search-pt', customerSearch],
    queryFn: () => getManagerCustomers(customerSearch),
    enabled: customerSearch.trim().length >= 2,
  });

  const freezeMutation = useMutation({
    mutationFn: () => freezeMembership(membershipId, startDate, endDate, reason),
    onSuccess: () => {
      setMessage('Đã đóng băng gói tập thành công!');
      setError(null);
      setFreezeModalOpen(false);
      resetForm();
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể đóng băng gói tập')),
  });

  const addDaysMutation = useMutation({
    mutationFn: () => addFreeDays(membershipId, days, reason),
    onSuccess: () => {
      setMessage(`Đã cộng thêm ${days} ngày tập thành công!`);
      setError(null);
      setAddDaysModalOpen(false);
      resetForm();
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể cộng ngày tập')),
  });

  // Approve PT Plan Mutation
  const approvePtMutation = useMutation({
    mutationFn: (planId: string) => approvePtPackagePlan(planId),
    onSuccess: () => {
      setMessage('Đã phê duyệt đề xuất gói tập PT thành công! Gói tập đã được chuyển sang danh sách Đã duyệt và mở bán tại cơ sở.');
      setError(null);
      setPtPlanFilter('ACTIVE');
      queryClient.invalidateQueries({ queryKey: ['manager-pt-package-plans'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể phê duyệt gói tập PT')),
  });

  // Reject PT Plan Mutation
  const rejectPtMutation = useMutation({
    mutationFn: () => rejectPtPackagePlan(selectedPlanId!, rejectReason),
    onSuccess: () => {
      setMessage('Đã từ chối đề xuất gói tập PT.');
      setError(null);
      setRejectModalOpen(false);
      setSelectedPlanId(null);
      setRejectReason('');
      setPtPlanFilter('REJECTED');
      queryClient.invalidateQueries({ queryKey: ['manager-pt-package-plans'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể từ chối gói tập PT')),
  });

  function resetAssignPtSelection() {
    setAssignPtModalOpen(false);
    setSelectedPtPlan(null);
    setSelectedCustomer(null);
    setCustomerSearch('');
  }

  // Assign PT Package Mutation
  const assignPtMutation = useMutation({
    mutationFn: () =>
      assignPtPackage(selectedCustomer.id, selectedPtPlan!.id, ptStartDate, ptPaymentMethod),
    onSuccess: (res: any) => {
      setError(null);
      if (res?.requiresPayment) {
        // VietQR sale: wait for the SePay webhook — the PT package isn't created yet.
        setAssignPtModalOpen(false);
        setPendingQr({ paymentId: res.paymentId, qrUrl: res.qrUrl, amount: res.amount, expiresAt: res.expiresAt });
        return;
      }
      setMessage(res?.message || `Đã gán thành công gói PT ${selectedPtPlan?.name} cho hội viên ${selectedCustomer?.full_name}!`);
      resetAssignPtSelection();
      queryClient.invalidateQueries({ queryKey: ['manager-pt-package-plans'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể gán gói PT cho hội viên')),
  });

  function resetForm() {
    setMembershipId('');
    setStartDate('');
    setEndDate('');
    setDays(7);
    setReason('');
  }

  function handleOpenReject(planId: string) {
    setSelectedPlanId(planId);
    setRejectReason('');
    setRejectModalOpen(true);
  }

  function handleOpenAssignPt(plan: PtPackagePlanItem) {
    setSelectedPtPlan(plan);
    setSelectedCustomer(null);
    setCustomerSearch('');
    setError(null);
    setAssignPtModalOpen(true);
  }

  const pendingPtPlansCount = ptPlans?.filter((p) => p.status === 'PENDING_APPROVAL').length || 0;
  const activePtPlans = ptPlans?.filter((p) => p.status === 'ACTIVE') || [];

  const filteredPtPlans = ptPlans?.filter((p) => {
    if (ptPlanFilter === 'ALL') return true;
    return p.status === ptPlanFilter;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6 w-full max-w-full overflow-x-hidden"
    >
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
          Gói tập & Duyệt Gói PT
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          Quản lý gói kinh doanh cơ sở, kiểm duyệt các đề xuất cấu hình gói tập từ Huấn luyện viên (PT) và hỗ trợ nghiệp vụ hội viên.
        </p>
      </div>

      {message && (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          {message}
        </div>
      )}

      {/* SECTION 1: DUYỆT ĐỀ XUẤT GÓI TẬP PT TỪ HUẤN LUYỆN VIÊN */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-emerald-500/5 to-transparent p-4 rounded-2xl border border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
              <Barbell size={24} weight="bold" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Duyệt Đề xuất Gói PT từ Huấn luyện viên</span>
                {pendingPtPlansCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                    {pendingPtPlansCount} chờ duyệt
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Các gói huấn luyện cá nhân do PT tại cơ sở đề xuất cần được Manager/Owner phê duyệt trước khi mở bán cho hội viên.
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl shrink-0 self-start sm:self-auto">
            {(
              [
                { id: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
                { id: 'ACTIVE', label: 'Đã duyệt' },
                { id: 'REJECTED', label: 'Từ chối' },
                { id: 'ALL', label: 'Tất cả' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPtPlanFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  ptPlanFilter === tab.id
                    ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-50 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoadingPtPlans ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : filteredPtPlans && filteredPtPlans.length === 0 ? (
          <Card className="p-8 text-center flex flex-col items-center gap-2">
            <Clock size={36} className="text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
              Không có đề xuất gói tập PT nào {ptPlanFilter === 'PENDING_APPROVAL' ? 'đang chờ duyệt' : ptPlanFilter === 'ACTIVE' ? 'đã duyệt' : ptPlanFilter === 'REJECTED' ? 'bị từ chối' : ''}
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm">
              Khi Huấn luyện viên tạo đề xuất gói tập cá nhân mới ở ứng dụng PT, danh sách sẽ hiển thị tại đây để bạn xem xét.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPtPlans?.map((plan: PtPackagePlanItem) => (
              <Card
                key={plan.id}
                className="flex flex-col justify-between hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-xs relative overflow-hidden"
              >
                <div>
                  {/* Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="font-display text-base font-bold text-slate-900 dark:text-zinc-100">
                      {plan.name}
                    </span>
                    {plan.status === 'PENDING_APPROVAL' && (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 px-2.5 py-0.5 text-xs font-semibold border border-amber-200 dark:border-amber-800">
                        <Clock size={12} /> Chờ duyệt
                      </span>
                    )}
                    {plan.status === 'ACTIVE' && (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle size={12} /> Đã duyệt
                      </span>
                    )}
                    {plan.status === 'REJECTED' && (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 px-2.5 py-0.5 text-xs font-semibold border border-red-200 dark:border-red-800">
                        <XCircle size={12} /> Từ chối
                      </span>
                    )}
                  </div>

                  {/* Price & Details */}
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(plan.price)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400">
                      / {plan.sessionCount} buổi ({plan.sessionDurationMinutes || 60}p/buổi)
                    </span>
                  </div>

                  {/* PT Creator Info */}
                  <div className="flex items-center gap-2 py-2 px-2.5 rounded-lg bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 mb-2.5 text-xs">
                    <User size={14} className="text-amber-500 shrink-0" />
                    <span className="text-slate-600 dark:text-zinc-400">PT đề xuất:</span>
                    <span className="font-bold text-slate-900 dark:text-zinc-200 truncate">
                      {plan.ptUser?.fullName || 'Huấn luyện viên'}
                    </span>
                  </div>

                  {plan.description && (
                    <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mb-3">
                      {plan.description}
                    </p>
                  )}

                  {plan.rejectReason && (
                    <div className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-xs text-red-700 dark:text-red-300 border border-red-200/60 dark:border-red-900/40">
                      <span className="font-bold">Lý do từ chối:</span> {plan.rejectReason}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {plan.status === 'PENDING_APPROVAL' && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2">
                    <Button
                      onClick={() => approvePtMutation.mutate(plan.id)}
                      disabled={approvePtMutation.isPending}
                      className="flex-1 justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
                    >
                      <CheckCircle size={16} /> Phê Duyệt
                    </Button>
                    <Button
                      onClick={() => handleOpenReject(plan.id)}
                      variant="secondary"
                      className="flex-1 justify-center text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs h-9"
                    >
                      <XCircle size={16} /> Từ Chối
                    </Button>
                  </div>
                )}

                {plan.status === 'ACTIVE' && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
                    <Button
                      onClick={() => handleOpenAssignPt(plan)}
                      className="w-full justify-center bg-amber-600 hover:bg-amber-700 text-white text-xs h-9 gap-1.5"
                    >
                      <CreditCard size={16} /> Đăng Ký Cho Hội Viên
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: DANH SÁCH GÓI TẬP KINH DOANH TẠI CƠ SỞ (MEMBERSHIP & PT) */}
      <div className="flex flex-col gap-6 pt-2">
        {/* Sub-section 2.1: Membership Packages */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Ticket size={20} className="text-emerald-600 dark:text-emerald-400" />
              <span>Gói tập Hội viên kinh doanh tại cơ sở (Membership)</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              {packages?.length || 0} gói áp dụng
            </span>
          </div>

          {isLoadingPackages ? (
            <Skeleton className="h-36 w-full" />
          ) : packages && packages.length === 0 ? (
            <Card className="p-6 text-center flex flex-col items-center gap-2">
              <Ticket size={32} className="text-slate-400" />
              <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
                Chưa có gói tập hội viên nào được gán cho chi nhánh này
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md">
                Chủ cơ sở (Owner) có thể vào mục Membership ở giao diện Owner để tạo và phân bổ gói tập kinh doanh cho chi nhánh của bạn.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packages?.map((pkg) => (
                <Card key={pkg.id} className="flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-xs">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-base font-bold text-slate-900 dark:text-zinc-100">{pkg.name}</h3>
                      <span className="shrink-0 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                        Đang bán
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-baseline gap-1">
                      <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(pkg.basePrice)}</span>
                      <span className="text-xs text-slate-500 dark:text-zinc-400">
                        / {pkg.durationValue} {DURATION_UNITS_MAP[pkg.durationUnit] || pkg.durationUnit}
                      </span>
                    </div>

                    {pkg.description && (
                      <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">
                        {pkg.description}
                      </p>
                    )}

                    {/* Scope badges */}
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap gap-1.5">
                      {pkg.appliesToAllBranches ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-800">
                          <Storefront size={12} /> Áp dụng toàn mạng lưới
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200/80 dark:border-blue-800">
                          📍 Gán riêng chi nhánh này
                        </span>
                      )}

                      {pkg.branchAccessScope === 'ALL_BRANCHES' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-300 px-2 py-0.5 rounded-md border border-purple-200/80 dark:border-purple-800">
                          <Globe size={12} /> Tập tất cả cơ sở
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 dark:bg-zinc-800 dark:text-zinc-300 px-2 py-0.5 rounded-md">
                          🏠 Tập cơ sở đăng ký
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sub-section 2.2: Active PT Packages */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Barbell size={20} className="text-amber-500" />
              <span>Gói huấn luyện PT đang kinh doanh tại cơ sở</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              {activePtPlans.length} gói PT đang bán
            </span>
          </div>

          {isLoadingPtPlans ? (
            <Skeleton className="h-32 w-full" />
          ) : activePtPlans.length === 0 ? (
            <Card className="p-5 text-center flex flex-col items-center gap-1.5 bg-slate-50/50 dark:bg-zinc-900/50 border-dashed">
              <Barbell size={28} className="text-slate-400" />
              <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                Chưa có gói tập PT nào được phê duyệt mở bán tại chi nhánh
              </p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Khi bạn phê duyệt các đề xuất từ Huấn luyện viên ở mục trên, các gói PT sẽ lập tức xuất hiện tại đây.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activePtPlans.map((plan) => (
                <Card key={plan.id} className="flex flex-col justify-between border-amber-500/30 hover:border-amber-500/60 transition-all shadow-xs">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-base font-bold text-slate-900 dark:text-zinc-100">{plan.name}</h3>
                      <span className="shrink-0 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                        Gói PT Đang bán
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-baseline gap-1">
                      <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(plan.price)}</span>
                      <span className="text-xs text-slate-500 dark:text-zinc-400">
                        / {plan.sessionCount} buổi ({plan.sessionDurationMinutes || 60}p/buổi)
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-600 dark:text-zinc-300 flex items-center gap-1.5">
                      <User size={14} className="text-amber-500 shrink-0" />
                      <span>Huấn luyện viên: <strong className="text-slate-900 dark:text-zinc-100">{plan.ptUser?.fullName || 'PT'}</strong></span>
                    </div>

                    {plan.description && (
                      <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">
                        {plan.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
                    <Button
                      onClick={() => handleOpenAssignPt(plan)}
                      className="w-full justify-center bg-amber-600 hover:bg-amber-700 text-white text-xs h-9 gap-1.5"
                    >
                      <CreditCard size={16} /> Đăng Ký Cho Hội Viên
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: NGHIỆP VỤ VẬN HÀNH */}
      <div className="flex flex-col gap-3 pt-2">
        <h2 className="font-display text-base font-bold text-slate-900 dark:text-zinc-100">
          Nghiệp vụ Vận hành & Hỗ trợ Hội viên
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Action Card 1: Freeze Membership */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="p-3 w-fit rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 mb-3">
                <Snowflake size={24} />
              </div>
              <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
                Đóng băng gói tập (Freeze)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Tạm ngưng thời gian sử dụng gói tập cho hội viên theo chính sách Freeze Policy của chi nhánh.
              </p>
            </div>
            <div className="mt-6">
              <Button onClick={() => setFreezeModalOpen(true)} className="w-full justify-center">
                Thực hiện Freeze
              </Button>
            </div>
          </Card>

          {/* Action Card 2: Add Free Days */}
          <Card className="flex flex-col justify-between">
            <div>
              <div className="p-3 w-fit rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 mb-3">
                <PlusCircle size={24} />
              </div>
              <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
                Cộng ngày tập miễn phí
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Gia hạn thêm số ngày sử dụng gói tập khi chi nhánh sửa chữa hoặc bồi thường dịch vụ.
              </p>
            </div>
            <div className="mt-6">
              <Button onClick={() => setAddDaysModalOpen(true)} variant="secondary" className="w-full justify-center">
                Cộng ngày tập
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* ASSIGN PT PACKAGE MODAL */}
      <Modal
        open={assignPtModalOpen}
        onClose={() => setAssignPtModalOpen(false)}
        title={`Đăng ký Gói PT: ${selectedPtPlan?.name || ''}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!selectedCustomer) {
              setError('Vui lòng chọn hội viên để đăng ký gói PT');
              return;
            }
            assignPtMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          {/* Plan summary */}
          {selectedPtPlan && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{selectedPtPlan.name}</p>
                <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                  PT: {selectedPtPlan.ptUser?.fullName || 'PT Coach'} | {selectedPtPlan.sessionCount} buổi ({selectedPtPlan.sessionDurationMinutes || 60}p/buổi)
                </p>
              </div>
              <span className="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                {formatMoney(selectedPtPlan.price)}
              </span>
            </div>
          )}

          {/* Customer Selection */}
          <FormField label="Chọn Hội Viên *" htmlFor="pt-customer-search">
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{selectedCustomer.full_name}</p>
                  <p className="text-slate-600 dark:text-zinc-300 font-mono">SĐT: {selectedCustomer.phone} | Mã: {selectedCustomer.customer_code}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Thay đổi
                </button>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <input
                    id="pt-customer-search"
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Nhập SĐT, Họ tên hoặc Mã hội viên..."
                    className={inputClass}
                  />
                  <MagnifyingGlass size={16} className="absolute right-3 top-3 text-slate-400" />
                </div>

                {customerSearch.trim().length >= 2 && (
                  <div className="mt-2 max-h-40 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                    {searchingCustomers ? (
                      <div className="p-3 text-center text-xs text-slate-500">Đang tìm kiếm...</div>
                    ) : customerSearchResults?.items?.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500">Không tìm thấy hội viên</div>
                    ) : (
                      customerSearchResults?.items?.map((c: any) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerSearch('');
                          }}
                          className="flex items-center justify-between p-2.5 hover:bg-emerald-50 cursor-pointer text-xs dark:hover:bg-zinc-800"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">{c.full_name}</span>
                            <span className="text-slate-400 ml-2 font-mono">({c.phone})</span>
                          </div>
                          <span className="font-semibold text-emerald-600 text-[11px]">Chọn →</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </FormField>

          {/* Start Date */}
          <FormField label="Ngày kích hoạt gói *" htmlFor="pt-start-date">
            <input
              id="pt-start-date"
              type="date"
              required
              className={inputClass}
              value={ptStartDate}
              onChange={(e) => setPtStartDate(e.target.value)}
            />
          </FormField>

          {/* Payment Method */}
          <FormField label="Phương thức thanh toán *" htmlFor="pt-payment-method">
            <select
              id="pt-payment-method"
              className={inputClass}
              value={ptPaymentMethod}
              onChange={(e: any) => setPtPaymentMethod(e.target.value)}
            >
              <option value="CASH">Tiền mặt tại quầy</option>
              <option value="VIETQR">Chuyển khoản (VietQR / Khác)</option>
              <option value="CREDIT_CARD">Thẻ ngân hàng (POS)</option>
            </select>
          </FormField>

          {error && <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setAssignPtModalOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={assignPtMutation.isPending || !selectedCustomer}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {assignPtMutation.isPending ? 'Đang kích hoạt...' : 'Xác Nhận Thanh Toán & Kích Hoạt'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* REJECT PT PACKAGE MODAL */}
      <Modal open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Từ chối Đề xuất Gói PT">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            rejectPtMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Vui lòng nhập lý do từ chối để thông báo cho Huấn luyện viên điều chỉnh cấu hình gói tập.
          </p>

          <FormField label="Lý do từ chối *" htmlFor="reject-reason">
            <textarea
              id="reject-reason"
              required
              rows={3}
              className={inputClass}
              placeholder="Ví dụ: Đơn giá chưa đúng khung niêm yết, số buổi không phù hợp..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </FormField>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setRejectModalOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={rejectPtMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Xác nhận Từ Chối
            </Button>
          </div>
        </form>
      </Modal>

      {/* FREEZE MODAL */}
      <Modal open={freezeModalOpen} onClose={() => setFreezeModalOpen(false)} title="Đóng băng gói tập (Freeze)">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            freezeMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <FormField label="Mã Gói tập (Membership ID) *" htmlFor="freeze-id">
            <input
              id="freeze-id"
              required
              className={inputClass}
              placeholder="Nhập UUID gói tập"
              value={membershipId}
              onChange={(e) => setMembershipId(e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Từ ngày *" htmlFor="freeze-start">
              <input
                id="freeze-start"
                type="date"
                required
                className={inputClass}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FormField>
            <FormField label="Đến ngày *" htmlFor="freeze-end">
              <input
                id="freeze-end"
                type="date"
                required
                className={inputClass}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Lý do đóng băng" htmlFor="freeze-reason">
            <textarea
              id="freeze-reason"
              rows={2}
              className={inputClass}
              placeholder="Ví dụ: Khách đi công tác, có giấy xác nhận y tế..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </FormField>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setFreezeModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={freezeMutation.isPending}>
              Xác nhận Freeze
            </Button>
          </div>
        </form>
      </Modal>

      {/* ADD DAYS MODAL */}
      <Modal open={addDaysModalOpen} onClose={() => setAddDaysModalOpen(false)} title="Cộng ngày tập miễn phí">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addDaysMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <FormField label="Mã Gói tập (Membership ID) *" htmlFor="add-id">
            <input
              id="add-id"
              required
              className={inputClass}
              placeholder="Nhập UUID gói tập"
              value={membershipId}
              onChange={(e) => setMembershipId(e.target.value)}
            />
          </FormField>

          <FormField label="Số ngày cộng thêm *" htmlFor="add-days-count">
            <input
              id="add-days-count"
              type="number"
              min={1}
              max={90}
              required
              className={inputClass}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </FormField>

          <FormField label="Lý do cộng ngày bắt buộc *" htmlFor="add-reason">
            <textarea
              id="add-reason"
              required
              rows={3}
              className={inputClass}
              placeholder="Nhập lý do chi tiết (bắt buộc lưu Audit Log)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </FormField>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setAddDaysModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={addDaysMutation.isPending}>
              Cộng ngày tập
            </Button>
          </div>
        </form>
      </Modal>

      {pendingQr && (
        <PendingQrPaymentModal
          open
          paymentId={pendingQr.paymentId}
          qrUrl={pendingQr.qrUrl}
          amount={pendingQr.amount}
          expiresAt={pendingQr.expiresAt}
          onConfirmed={() => {
            setPendingQr(null);
            setMessage(`Đã nhận thanh toán qua SePay! Gói PT ${selectedPtPlan?.name} đã được kích hoạt cho hội viên ${selectedCustomer?.full_name}.`);
            resetAssignPtSelection();
            queryClient.invalidateQueries({ queryKey: ['manager-pt-package-plans'] });
          }}
          onCancelled={() => {
            setPendingQr(null);
            resetAssignPtSelection();
          }}
        />
      )}
    </motion.div>
  );
}
