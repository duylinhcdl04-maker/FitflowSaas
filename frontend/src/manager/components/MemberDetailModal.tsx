import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Phone,
  CreditCard,
  Snowflake,
  CalendarPlus,
  Camera,
  CheckCircle,
  WarningCircle,
  X,
  GenderMale,
  GenderFemale,
  LockKey,
  IdentificationBadge,
  EnvelopeSimple,
  ShieldCheck,
  ShieldWarning,
  CalendarBlank,
  Power,
  QrCode,
  Money,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import {
  assignMembershipPackage,
  freezeMembership,
  addFreeDays,
  toggleCustomerStatus,
  resetCustomerPassword,
} from '../api/manager';
import { apiErrorMessage } from '../../owner/api/client';
import { showConfirm, showToast } from '../../owner/utils/swal';
import Callout from '../../owner/components/Callout';
import Button from '../../owner/components/Button';
import FormField from '../../owner/components/FormField';
import PendingQrPaymentModal from './PendingQrPaymentModal';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any | null;
  branchPackages?: any[];
  isFaceIdEnabled?: boolean; // Owner setting toggle for Face ID
}

type TabKey = 'OVERVIEW' | 'ASSIGN' | 'FREEZE' | 'ADD_DAYS' | 'FACE';

const TABS: { key: TabKey; label: string; icon: Icon; requiresMembership?: boolean }[] = [
  { key: 'OVERVIEW', label: 'Thông tin chung', icon: User },
  { key: 'ASSIGN', label: 'Gán gói tập', icon: CreditCard },
  { key: 'FREEZE', label: 'Đóng băng gói', icon: Snowflake, requiresMembership: true },
  { key: 'ADD_DAYS', label: 'Gia hạn / Thêm ngày', icon: CalendarPlus, requiresMembership: true },
  { key: 'FACE', label: 'Face ID', icon: Camera },
];

const fieldInputClass =
  'w-full rounded-xl border border-stone-300 bg-white p-2.5 text-xs text-slate-900 shadow-xs transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white';

export default function MemberDetailModal({
  isOpen,
  onClose,
  customer,
  branchPackages = [],
  isFaceIdEnabled = true,
}: MemberDetailModalProps) {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>('OVERVIEW');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>(customer?.status || 'ACTIVE');

  // Form - Assign Package
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'VIETQR' | 'CASH'>('VIETQR');
  const [pendingQr, setPendingQr] = useState<{ paymentId: string; qrUrl: string; amount: number; expiresAt: string } | null>(null);

  // Form - Freeze
  const [freezeStartDate, setFreezeStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [freezeEndDate, setFreezeEndDate] = useState('');
  const [freezeReason, setFreezeReason] = useState('');

  // Form - Add Days
  const [addDaysCount, setAddDaysCount] = useState(7);
  const [addDaysReason, setAddDaysReason] = useState('');

  // Face Enrollment simulation
  const [faceEnrolled, setFaceEnrolled] = useState(Boolean(customer?.face_data_registered || customer?.face_registered));
  const [isCapturing, setIsCapturing] = useState(false);

  // Every consumer only ever mounts this component once `isOpen && customer` is already
  // true (`{condition && <MemberDetailModal .../>}`), so this early return never actually
  // fires today — but hooks still must not be declared after a conditional return (React's
  // rules-of-hooks), so it's placed after every hook below instead of before them.
  const activeMembership = customer?.memberships?.[0] || customer?.membership;

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (newStatus: 'ACTIVE' | 'INACTIVE') => toggleCustomerStatus(customer.id, newStatus),
    onSuccess: (_, newStatus) => {
      setCurrentStatus(newStatus);
      setSuccess(
        `Đã chuyển trạng thái hội viên sang ${newStatus === 'ACTIVE' ? 'Kích hoạt (ACTIVE)' : 'Tạm khóa (INACTIVE)'}!`,
      );
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['staff-members-list'] });
      queryClient.invalidateQueries({ queryKey: ['manager-customers-list'] });
      setTimeout(() => setSuccess(null), 2000);
    },
    onError: (err) => {
      setError(apiErrorMessage(err, 'Không thể thay đổi trạng thái hội viên'));
      setSuccess(null);
    },
  });

  // Reset Password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: () => resetCustomerPassword(customer.id),
    onSuccess: (res) => {
      const msg = res.message || 'Đã cấp lại mật khẩu tạm thời thành công và gửi tới Gmail cho hội viên!';
      setSuccess(msg);
      setError(null);
      showToast(msg, 'success');
      setTimeout(() => setSuccess(null), 4000);
    },
    onError: (err) => {
      const msg = apiErrorMessage(err, 'Không thể cấp lại mật khẩu');
      setError(msg);
      setSuccess(null);
      showToast(msg, 'error');
    },
  });

  const handleResetPassword = async () => {
    if (!customer.email) {
      showToast('Hội viên chưa đăng ký Email. Vui lòng bổ sung Email cho hội viên trước khi cấp lại mật khẩu.', 'warning');
      return;
    }
    const confirmed = await showConfirm({
      title: '🔑 Cấp lại mật khẩu đăng nhập',
      text: `Bạn có chắc chắn muốn sinh mật khẩu ngẫu nhiên mới cho hội viên ${customer.full_name} và gửi trực tiếp tới email ${customer.email}?`,
      confirmButtonText: 'Đồng ý cấp lại',
      cancelButtonText: 'Hủy bỏ',
      icon: 'question',
    });
    if (confirmed) {
      resetPasswordMutation.mutate();
    }
  };

  // Mutations
  const assignMutation = useMutation({
    mutationFn: () =>
      assignMembershipPackage({
        customerId: customer.id,
        packageId: selectedPackageId,
        startDate,
        paymentMethod,
      }),
    onSuccess: (res: any) => {
      setError(null);
      // VietQR: backend only creates a PENDING Payment + QR — the Membership itself isn't
      // granted until SePay's webhook confirms it (see PendingQrPaymentModal's onConfirmed).
      if (res?.requiresPayment) {
        setPendingQr({ paymentId: res.paymentId, qrUrl: res.qrUrl, amount: res.amount, expiresAt: res.expiresAt });
        return;
      }
      // CASH: membership + PAID payment already created synchronously by the backend.
      setSuccess('Đã thu tiền mặt & kích hoạt gói tập thành công!');
      queryClient.invalidateQueries({ queryKey: ['staff-members-list'] });
      queryClient.invalidateQueries({ queryKey: ['manager-customers-list'] });
      setTimeout(() => {
        setSuccess(null);
        setActiveTab('OVERVIEW');
      }, 1500);
    },
    onError: (err) => {
      setError(apiErrorMessage(err, 'Không thể gán gói tập'));
      setSuccess(null);
    },
  });

  const freezeMutation = useMutation({
    mutationFn: () =>
      freezeMembership(activeMembership?.id, freezeStartDate, freezeEndDate, freezeReason),
    onSuccess: () => {
      setSuccess('Đã tạm dừng (đóng băng) gói tập thành công!');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['staff-members-list'] });
      queryClient.invalidateQueries({ queryKey: ['manager-customers-list'] });
      setTimeout(() => {
        setSuccess(null);
        setActiveTab('OVERVIEW');
      }, 1500);
    },
    onError: (err) => {
      setError(apiErrorMessage(err, 'Không thể đóng băng gói tập'));
      setSuccess(null);
    },
  });

  const addDaysMutation = useMutation({
    mutationFn: () =>
      addFreeDays(activeMembership?.id, Number(addDaysCount), addDaysReason),
    onSuccess: () => {
      setSuccess(`Đã cộng thêm ${addDaysCount} ngày tập cho hội viên thành công!`);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['staff-members-list'] });
      queryClient.invalidateQueries({ queryKey: ['manager-customers-list'] });
      setTimeout(() => {
        setSuccess(null);
        setActiveTab('OVERVIEW');
      }, 1500);
    },
    onError: (err) => {
      setError(apiErrorMessage(err, 'Không thể gia hạn / cộng ngày tập'));
      setSuccess(null);
    },
  });

  function handleEnrollFace() {
    setIsCapturing(true);
    setTimeout(() => {
      setIsCapturing(false);
      setFaceEnrolled(true);
      setSuccess('Đã ghi nhận dữ liệu Face ID thành công!');
      setTimeout(() => setSuccess(null), 2000);
    }, 1500);
  }

  if (!isOpen || !customer) return null;

  const isActiveStatus = currentStatus === 'ACTIVE';

  return (
    <>
      <motion.div
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm cursor-pointer"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-stone-200/80 bg-white shadow-2xl shadow-stone-950/20 overflow-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/50 cursor-default"
      >
        {/* Header Profile Bar */}
        <div className="relative flex items-center justify-between gap-4 overflow-hidden p-6 border-b border-stone-100 dark:border-zinc-800 bg-gradient-to-br from-stone-50 to-white dark:from-zinc-800/40 dark:to-zinc-900">
          <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-emerald-200/25 blur-3xl dark:bg-emerald-500/10" />

          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-xl font-extrabold text-white shadow-lg shadow-emerald-500/25 ring-4 ring-white dark:ring-zinc-900">
              {customer.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{customer.full_name}</h2>
                <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                  {customer.customer_code}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 mt-1">
                <span className="flex items-center gap-1 font-mono">
                  <Phone size={13} className="text-emerald-600" /> {customer.phone || 'Chưa có SĐT'}
                </span>
                {customer.gender && (
                  <span className="flex items-center gap-1">
                    {customer.gender === 'MALE' ? <GenderMale size={13} /> : <GenderFemale size={13} />}
                    {customer.gender === 'MALE' ? 'Nam' : customer.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-stone-200/60 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Đóng"
          >
            <X size={18} />
          </motion.button>
        </div>

        {/* Animated pill tab bar */}
        <div className="overflow-x-auto scrollbar-none border-b border-stone-100 bg-stone-50/60 px-2 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex w-max min-w-full gap-1 py-2">
            {TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isDisabled = tab.requiresMembership && !activeMembership;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    isActive
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="member-detail-tab-pill"
                      transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                      className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-stone-200/80 dark:bg-zinc-800 dark:ring-zinc-700"
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    <TabIcon size={15} weight={isActive ? 'fill' : 'regular'} />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">
          {success && (
            <Callout tone="success">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                <span>{success}</span>
              </div>
            </Callout>
          )}

          {error && (
            <Callout tone="danger">
              <div className="flex items-center gap-2 text-xs">
                <WarningCircle size={16} className="text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            </Callout>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-5">
                  {/* Active Package Hero */}
                  <div className="relative overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-transparent p-5 dark:border-emerald-900/40 dark:from-emerald-500/[0.08] dark:to-transparent">
                    <h3 className="mb-3 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-800/70 dark:text-emerald-400/80">
                      <CreditCard size={15} /> Thẻ tập & gói đăng ký hiện tại
                    </h3>

                    {activeMembership ? (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1.5">
                          <p className="font-display text-base font-extrabold text-emerald-900 dark:text-emerald-300">
                            {activeMembership.package_name_snapshot || activeMembership.packageName || activeMembership.package?.name || 'Gói hội viên'}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-zinc-300">
                            <span className="flex items-center gap-1.5">
                              <CalendarBlank size={13} className="text-emerald-600" />
                              Đăng ký:{' '}
                              <strong className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                {activeMembership.start_date || activeMembership.startDate ? new Date(activeMembership.start_date || activeMembership.startDate).toLocaleDateString('vi-VN') : '—'}
                              </strong>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <CalendarBlank size={13} className="text-amber-600" />
                              Kết thúc:{' '}
                              <strong className="font-mono font-bold text-amber-700 dark:text-amber-400">
                                {activeMembership.end_date || activeMembership.endDate ? new Date(activeMembership.end_date || activeMembership.endDate).toLocaleDateString('vi-VN') : '—'}
                              </strong>
                            </span>
                          </div>
                        </div>
                        <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-sm shadow-emerald-600/30">
                          <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                          {activeMembership.status || 'ACTIVE'}
                        </span>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-emerald-300/60 bg-white/50 py-6 text-center dark:border-emerald-800/60 dark:bg-transparent">
                        <p className="text-xs text-slate-500 dark:text-zinc-400">Hội viên chưa có gói tập đang kích hoạt.</p>
                        <button
                          onClick={() => setActiveTab('ASSIGN')}
                          className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
                        >
                          + Gán / Đăng ký gói mới ngay
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoTile icon={IdentificationBadge} tone="zinc" label="Mã khách hàng" value={customer.customer_code} mono />
                    <InfoTile icon={EnvelopeSimple} tone="blue" label="Email" value={customer.email || 'Chưa cung cấp'} />

                    <div className="rounded-2xl border border-stone-200/80 p-3.5 dark:border-zinc-800">
                      <div className="mb-1 flex items-center gap-1.5">
                        {faceEnrolled ? (
                          <ShieldCheck size={14} className="text-emerald-600" />
                        ) : (
                          <ShieldWarning size={14} className="text-zinc-400" />
                        )}
                        <span className="text-[10px] font-bold uppercase text-slate-400">Trạng thái Face ID</span>
                      </div>
                      {faceEnrolled ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                          <CheckCircle size={14} /> Đã đăng ký (Active)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">
                          <WarningCircle size={14} /> Chưa đăng ký
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-stone-200/80 bg-stone-50/50 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/20">
                      <div>
                        <div className="mb-1 flex items-center gap-1.5">
                          <Power size={14} className={isActiveStatus ? 'text-emerald-600' : 'text-rose-500'} />
                          <span className="text-[10px] font-bold uppercase text-slate-400">Trạng thái tài khoản</span>
                        </div>
                        <span
                          className={`inline-block rounded-md px-2.5 py-0.5 text-xs font-extrabold ${
                            isActiveStatus
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {isActiveStatus ? 'Kích hoạt (ACTIVE)' : 'Tạm khóa (INACTIVE)'}
                        </span>
                      </div>

                      <Button
                        variant={isActiveStatus ? 'secondary' : 'primary'}
                        size="sm"
                        disabled={toggleStatusMutation.isPending}
                        onClick={() => toggleStatusMutation.mutate(isActiveStatus ? 'INACTIVE' : 'ACTIVE')}
                        className={`shrink-0 text-xs ${
                          isActiveStatus
                            ? 'text-rose-600 border-rose-300 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-950'
                            : ''
                        }`}
                      >
                        {toggleStatusMutation.isPending ? 'Đang đổi...' : isActiveStatus ? 'Tạm khóa thẻ' : 'Kích hoạt lại'}
                      </Button>
                    </div>

                    {/* Password Reset Card */}
                    <div className="col-span-1 flex flex-col gap-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-3.5 dark:border-emerald-800/40 dark:bg-emerald-950/20 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300">
                          <LockKey size={13} className="text-emerald-600" /> Quản lý mật khẩu đăng nhập
                        </span>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-zinc-400">
                          Tự động tạo mật khẩu ngẫu nhiên mới & gửi tới Gmail:{' '}
                          <strong className="font-mono text-slate-800 dark:text-slate-200">{customer.email || 'Chưa cập nhật Email'}</strong>
                        </p>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={resetPasswordMutation.isPending}
                        onClick={handleResetPassword}
                        className="shrink-0 gap-1.5 border-emerald-300 bg-white text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-zinc-800 dark:text-emerald-400 dark:hover:bg-zinc-700"
                      >
                        <LockKey size={15} /> {resetPasswordMutation.isPending ? 'Đang gửi...' : 'Cấp lại mật khẩu'}
                      </Button>
                    </div>
                  </div>

                  {/* Quick Actions Bar */}
                  <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4">
                    <QuickAction icon={CreditCard} label="Gán gói" onClick={() => setActiveTab('ASSIGN')} />
                    <QuickAction icon={Snowflake} label="Đóng băng" disabled={!activeMembership} onClick={() => setActiveTab('FREEZE')} />
                    <QuickAction icon={CalendarPlus} label="Thêm ngày" disabled={!activeMembership} onClick={() => setActiveTab('ADD_DAYS')} />
                    <QuickAction icon={Camera} label="Face ID" onClick={() => setActiveTab('FACE')} />
                  </div>
                </div>
              )}

              {/* TAB 2: ASSIGN PACKAGE */}
              {activeTab === 'ASSIGN' && (
                <div className="space-y-4">
                  <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                    <CreditCard size={18} className="text-emerald-600" /> Đăng ký / gán gói tập cho hội viên
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Chọn gói tập khả dụng tại chi nhánh và ngày bắt đầu kích hoạt thẻ.
                  </p>

                  <FormField label="Chọn gói tập chi nhánh *" htmlFor="assign-pkg">
                    <select
                      id="assign-pkg"
                      value={selectedPackageId}
                      onChange={(e) => setSelectedPackageId(e.target.value)}
                      className={fieldInputClass}
                    >
                      <option value="">-- Chọn gói tập --</option>
                      {branchPackages.map((pkg: any) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} ({pkg.durationValue} {pkg.durationUnit === 'MONTH' ? 'Tháng' : 'Ngày'}) -{' '}
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pkg.basePrice)}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Ngày kích hoạt (kế toán / bắt đầu) *" htmlFor="assign-start">
                    <input
                      id="assign-start"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={fieldInputClass}
                    />
                  </FormField>

                  {/* Phương thức thanh toán — bắt buộc mọi lần gán gói phải đi kèm 1 khoản Payment thật,
                      tái dùng đúng flow VietQR/Tiền mặt đã có sẵn ở POS (PosPage.tsx), không tự chế lại. */}
                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-900 dark:text-white">
                      Phương thức thanh toán *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('VIETQR')}
                        className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-colors ${
                          paymentMethod === 'VIETQR'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'border-stone-200 text-slate-600 hover:border-stone-300 dark:border-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        <QrCode size={18} /> Mã VietQR
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CASH')}
                        className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-colors ${
                          paymentMethod === 'CASH'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'border-stone-200 text-slate-600 hover:border-stone-300 dark:border-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        <Money size={18} /> Tiền mặt
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">
                      {paymentMethod === 'VIETQR'
                        ? 'Mã QR thật (theo tài khoản Owner đã cấu hình) sẽ hiện ra ở bước tiếp theo — hệ thống tự xác nhận qua SePay, không cần bấm xác nhận tay.'
                        : 'Gói tập được kích hoạt ngay, đồng thời ghi nhận một khoản thu tiền mặt cho hội viên.'}
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" size="sm" onClick={() => setActiveTab('OVERVIEW')}>Hủy</Button>
                    <Button
                      size="sm"
                      disabled={!selectedPackageId || assignMutation.isPending}
                      onClick={() => assignMutation.mutate()}
                      className="gap-1.5"
                    >
                      {assignMutation.isPending
                        ? 'Đang xử lý...'
                        : paymentMethod === 'VIETQR'
                          ? 'Tạo mã QR & chờ thanh toán'
                          : 'Xác nhận thu tiền mặt & kích hoạt'}
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 3: FREEZE MEMBERSHIP */}
              {activeTab === 'FREEZE' && (
                <div className="space-y-4">
                  <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                    <Snowflake size={18} className="text-blue-600" /> Đóng băng / tạm ngưng gói tập
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Tạm dừng thời hạn thẻ cho hội viên đi tác nghiệp, du lịch hoặc bảo lưu sức khỏe.
                  </p>

                  <FormField label="Ngày bắt đầu bảo lưu *" htmlFor="freeze-start">
                    <input
                      id="freeze-start"
                      type="date"
                      value={freezeStartDate}
                      onChange={(e) => setFreezeStartDate(e.target.value)}
                      className={fieldInputClass}
                    />
                  </FormField>

                  <FormField label="Ngày kết thúc bảo lưu *" htmlFor="freeze-end">
                    <input
                      id="freeze-end"
                      type="date"
                      value={freezeEndDate}
                      onChange={(e) => setFreezeEndDate(e.target.value)}
                      className={fieldInputClass}
                    />
                  </FormField>

                  <FormField label="Lý do tạm ngưng" htmlFor="freeze-reason">
                    <textarea
                      id="freeze-reason"
                      rows={2}
                      value={freezeReason}
                      onChange={(e) => setFreezeReason(e.target.value)}
                      placeholder="Nhập lý do bảo lưu (Công tác, sức khỏe...)"
                      className={fieldInputClass}
                    />
                  </FormField>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" size="sm" onClick={() => setActiveTab('OVERVIEW')}>Hủy</Button>
                    <Button
                      size="sm"
                      disabled={!freezeStartDate || !freezeEndDate || freezeMutation.isPending}
                      onClick={() => freezeMutation.mutate()}
                    >
                      {freezeMutation.isPending ? 'Đang thực hiện...' : 'Xác nhận đóng băng'}
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 4: ADD DAYS / RENEW */}
              {activeTab === 'ADD_DAYS' && (
                <div className="space-y-4">
                  <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                    <CalendarPlus size={18} className="text-purple-600" /> Gia hạn / cộng thêm ngày tập
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Thêm ngày sử dụng đền bù sự cố hoặc thưởng khuyến mãi cho hội viên.
                  </p>

                  <FormField label="Số ngày cộng thêm *" htmlFor="add-days-count">
                    <input
                      id="add-days-count"
                      type="number"
                      min={1}
                      max={365}
                      value={addDaysCount}
                      onChange={(e) => setAddDaysCount(Number(e.target.value))}
                      className={fieldInputClass}
                    />
                  </FormField>

                  <FormField label="Lý do gia hạn / cộng ngày *" htmlFor="add-days-reason">
                    <input
                      id="add-days-reason"
                      type="text"
                      required
                      value={addDaysReason}
                      onChange={(e) => setAddDaysReason(e.target.value)}
                      placeholder="Nhập lý do cộng ngày (Khuyến mãi, bù nghỉ Lễ...)"
                      className={fieldInputClass}
                    />
                  </FormField>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" size="sm" onClick={() => setActiveTab('OVERVIEW')}>Hủy</Button>
                    <Button
                      size="sm"
                      disabled={!addDaysCount || !addDaysReason || addDaysMutation.isPending}
                      onClick={() => addDaysMutation.mutate()}
                    >
                      {addDaysMutation.isPending ? 'Đang thực hiện...' : 'Cộng ngày tập'}
                    </Button>
                  </div>
                </div>
              )}

              {/* TAB 5: FACE ENROLLMENT */}
              {activeTab === 'FACE' && (
                <div className="space-y-4">
                  <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                    <Camera size={18} className="text-amber-600" /> Thu thập dữ liệu khuôn mặt (Face Enrollment)
                  </h3>

                  {!isFaceIdEnabled ? (
                    <Callout tone="danger">
                      <div className="flex items-center gap-2 text-xs">
                        <LockKey size={18} className="shrink-0" />
                        <span>
                          Tính năng Nhận diện Khuôn mặt (Face ID) hiện <strong>đang bị tắt bởi Owner</strong> cho chi nhánh này. Vui lòng liên hệ Chủ phòng tập để bật tính năng.
                        </span>
                      </div>
                    </Callout>
                  ) : (
                    <>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Đưa khuôn mặt hội viên vào khung hình camera quầy để trích xuất vector điểm ảnh tự động.
                      </p>

                      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center text-white">
                        <div className="pointer-events-none absolute inset-8 flex items-center justify-center rounded-full border-2 border-dashed border-emerald-500/70 animate-pulse">
                          <span className="rounded bg-zinc-950/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
                            {isCapturing ? 'Đang trích xuất Vector...' : 'Căn chỉnh khuôn mặt'}
                          </span>
                        </div>

                        {isCapturing ? (
                          <div className="z-10 flex flex-col items-center gap-2">
                            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
                            <span className="font-mono text-xs text-emerald-300">Scanning 128 Facial Landmarks...</span>
                          </div>
                        ) : faceEnrolled ? (
                          <div className="z-10 flex flex-col items-center gap-2 text-emerald-400">
                            <CheckCircle size={40} />
                            <span className="text-xs font-bold">Face ID đã được đăng ký thành công</span>
                          </div>
                        ) : (
                          <div className="z-10 flex flex-col items-center gap-2 text-zinc-400">
                            <Camera size={36} />
                            <span className="text-xs">Sẵn sàng thu thập ảnh</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" size="sm" onClick={() => setActiveTab('OVERVIEW')}>Quay lại</Button>
                        <Button size="sm" disabled={isCapturing} onClick={handleEnrollFace}>
                          {faceEnrolled ? 'Chụp lại ảnh Face ID' : 'Thu thập Face Vector'}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
      </motion.div>

      {pendingQr && (
        <PendingQrPaymentModal
          open
          paymentId={pendingQr.paymentId}
          qrUrl={pendingQr.qrUrl}
          amount={pendingQr.amount}
          expiresAt={pendingQr.expiresAt}
          onConfirmed={() => {
            setPendingQr(null);
            setSuccess(`Đã nhận thanh toán qua SePay! Gói tập đã được kích hoạt cho ${customer.full_name}.`);
            queryClient.invalidateQueries({ queryKey: ['staff-members-list'] });
            queryClient.invalidateQueries({ queryKey: ['manager-customers-list'] });
            setActiveTab('OVERVIEW');
            setTimeout(() => setSuccess(null), 4000);
          }}
          onCancelled={() => setPendingQr(null)}
        />
      )}
    </>
  );
}

function InfoTile({
  icon: TileIcon,
  tone,
  label,
  value,
  mono,
}: {
  icon: Icon;
  tone: 'zinc' | 'blue';
  label: string;
  value: string;
  mono?: boolean;
}) {
  const toneClass = tone === 'blue' ? 'text-blue-500' : 'text-zinc-400';
  return (
    <div className="rounded-2xl border border-stone-200/80 p-3.5 dark:border-zinc-800">
      <div className="mb-1 flex items-center gap-1.5">
        <TileIcon size={14} className={toneClass} />
        <span className="text-[10px] font-bold uppercase text-slate-400">{label}</span>
      </div>
      <p className={`text-xs font-bold text-slate-800 dark:text-slate-200 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

function QuickAction({
  icon: ActionIcon,
  label,
  onClick,
  disabled,
}: {
  icon: Icon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-stone-200 bg-white px-3 py-3 text-center text-[11px] font-bold text-zinc-600 shadow-xs transition-colors hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-stone-200 disabled:hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        <ActionIcon size={17} />
      </span>
      {label}
    </motion.button>
  );
}
