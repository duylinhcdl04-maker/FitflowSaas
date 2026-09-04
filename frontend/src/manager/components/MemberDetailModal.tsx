import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  Power,
  QrCode,
  Money,
  Barbell,
  XCircle,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import {
  assignMembershipPackage,
  freezeMembership,
  addFreeDays,
  toggleCustomerStatus,
  resetCustomerPassword,
  enrollFaceProfile,
  revokeFaceProfile,
  getFaceProfileStatus,
  getManagerCheckinConfig,
} from '../api/manager';
import { cancelPtPackage } from '../../pt/api/pt';
import { apiErrorMessage } from '../../owner/api/client';
import { showConfirm, showToast } from '../../owner/utils/swal';
import Callout from '../../owner/components/Callout';
import Button from '../../owner/components/Button';
import FormField from '../../owner/components/FormField';
import PendingQrPaymentModal from './PendingQrPaymentModal';
import FaceCameraCapture, { type FaceCameraCaptureHandle, type FaceDetectResult } from '../../shared/face/FaceCameraCapture';

const FACE_ENROLL_TARGET_SHOTS = 3;

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

  // Face Enrollment (backend/docs/face-checkin.md §2) — descriptor tính trên trình duyệt
  // bằng @vladmandic/face-api, chỉ gửi descriptor lên, không gửi ảnh gốc.
  const faceCameraRef = useRef<FaceCameraCaptureHandle>(null);
  const [faceConsentChecked, setFaceConsentChecked] = useState(false);
  const [capturedShots, setCapturedShots] = useState<FaceDetectResult[]>([]);
  const [faceCaptureNote, setFaceCaptureNote] = useState<string | null>(null);

  // `isFaceIdEnabled` prop hiện tại được mọi nơi gọi truyền cứng `true` (chưa đọc config
  // thật) — bù lại ở đây bằng cách tự đọc checkin_methods.face thật của tenant và AND lại
  // với prop. Mặc định `true` khi đang tải/lỗi để giữ nguyên hành vi cũ, không gây regression.
  const { data: checkinConfig } = useQuery({
    queryKey: ['manager-checkin-config'],
    queryFn: getManagerCheckinConfig,
    staleTime: 60_000,
  });
  const effectiveFaceIdEnabled = isFaceIdEnabled && (checkinConfig?.face ?? true);

  const { data: faceProfileStatus } = useQuery({
    queryKey: ['face-profile-status', customer?.id],
    queryFn: () => getFaceProfileStatus(customer.id),
    enabled: Boolean(customer?.id) && effectiveFaceIdEnabled,
  });
  const faceEnrolled = Boolean(faceProfileStatus?.active);

  // Every consumer only ever mounts this component once `isOpen && customer` is already
  // true (`{condition && <MemberDetailModal .../>}`), so this early return never actually
  // fires today — but hooks still must not be declared after a conditional return (React's
  // rules-of-hooks), so it's placed after every hook below instead of before them.
  const activeMembership = customer?.memberships?.[0] || customer?.membership;
  const ptPackagesList = customer?.customer_pt_packages || customer?.pt_packages || (customer?.ptPackage ? [customer.ptPackage] : []);
  const activePtPackage = ptPackagesList.find((p: any) => p.status === 'ACTIVE' || p.status === 'SCHEDULED') || ptPackagesList[0];

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

  const enrollFaceMutation = useMutation({
    mutationFn: () =>
      enrollFaceProfile(
        customer.id,
        capturedShots.map((s) => s.descriptor),
        capturedShots.map((s) => s.qualityScore),
      ),
    onSuccess: () => {
      setSuccess('Đã ghi nhận dữ liệu Face ID thành công!');
      setError(null);
      setCapturedShots([]);
      setFaceConsentChecked(false);
      queryClient.invalidateQueries({ queryKey: ['face-profile-status', customer.id] });
      setTimeout(() => setSuccess(null), 2000);
    },
    onError: (err) => {
      setError(apiErrorMessage(err, 'Không thể lưu dữ liệu khuôn mặt'));
      setSuccess(null);
    },
  });

  const revokeFaceMutation = useMutation({
    mutationFn: () => revokeFaceProfile(customer.id),
    onSuccess: () => {
      setSuccess('Đã thu hồi dữ liệu Face ID.');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['face-profile-status', customer.id] });
      setTimeout(() => setSuccess(null), 2000);
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể thu hồi dữ liệu khuôn mặt')),
  });

  function handleCaptureShot() {
    const result = faceCameraRef.current?.capture();
    if (!result) {
      setFaceCaptureNote('Chưa thấy khuôn mặt rõ trong khung hình, vui lòng căn chỉnh lại.');
      setTimeout(() => setFaceCaptureNote(null), 2000);
      return;
    }
    setCapturedShots((prev) => [...prev, result].slice(0, FACE_ENROLL_TARGET_SHOTS));
  }

  async function handleRevokeFace() {
    const confirmed = await showConfirm({
      title: '🗑️ Thu hồi dữ liệu khuôn mặt',
      text: `Hội viên ${customer.full_name} sẽ không còn check-in được bằng khuôn mặt cho đến khi đăng ký lại.`,
      confirmButtonText: 'Đồng ý thu hồi',
      cancelButtonText: 'Hủy bỏ',
      icon: 'warning',
    });
    if (confirmed) revokeFaceMutation.mutate();
  }

  const cancelPtPackageMutation = useMutation({
    mutationFn: (reason?: string) => cancelPtPackage(activePtPackage?.id, reason),
    onSuccess: () => {
      setSuccess('Đã chấm dứt / hủy gói tập PT thành công!');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['staff-members-list'] });
      queryClient.invalidateQueries({ queryKey: ['manager-customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['pt-clients'] });
      queryClient.invalidateQueries({ queryKey: ['pt-client-detail'] });
      queryClient.invalidateQueries({ queryKey: ['pt-overview'] });
      showToast('Đã hủy gói tập PT thành công!', 'success');
      setTimeout(() => setSuccess(null), 2500);
    },
    onError: (err) => {
      setError(apiErrorMessage(err, 'Không thể hủy gói PT'));
      setSuccess(null);
    },
  });

  const handleCancelPtPackage = async () => {
    if (!activePtPackage?.id) return;
    const confirmed = await showConfirm({
      title: '⚠️ Chấm dứt / Hủy gói tập PT',
      text: `Bạn có chắc chắn muốn chấm dứt gói PT "${activePtPackage.plan_name_snapshot || activePtPackage.planName}" của hội viên ${customer.full_name}? Các buổi tập PT chưa diễn ra của gói này sẽ tự động bị hủy.`,
      confirmButtonText: 'Đồng ý chấm dứt',
      cancelButtonText: 'Bỏ qua',
      icon: 'warning',
    });
    if (confirmed) {
      cancelPtPackageMutation.mutate('Học viên không còn nhu cầu / PT chấm dứt hợp đồng');
    }
  };

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
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-stone-200/80 bg-white shadow-2xl shadow-stone-950/20 overflow-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/50 cursor-default"
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

        {/* Segmented Pill Tab Bar */}
        <div className="border-b border-stone-200/70 bg-stone-50/80 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none rounded-2xl bg-stone-200/60 p-1.5 dark:bg-zinc-800/60">
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
                  className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
                    isActive
                      ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-stone-200/60 dark:bg-zinc-900 dark:text-emerald-400 dark:ring-zinc-700'
                      : 'text-stone-600 hover:bg-white/60 hover:text-stone-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white'
                  }`}
                >
                  <TabIcon size={16} weight={isActive ? 'fill' : 'regular'} />
                  {tab.label}
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
                <div className="space-y-4">
                  {/* 2-Column Side-by-Side Dashboard Cards (Gym & PT) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Left Column: Gym Membership Card */}
                    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-emerald-50/30 to-transparent p-4 dark:border-emerald-900/40 dark:from-emerald-500/[0.08] dark:to-transparent">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                          <CreditCard size={15} /> Gói Gym
                        </h3>
                        {activeMembership && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                            {activeMembership.status || 'ACTIVE'}
                          </span>
                        )}
                      </div>

                      {activeMembership ? (() => {
                        const startDateStr = activeMembership.start_date || activeMembership.startDate;
                        const endDateStr = activeMembership.end_date || activeMembership.endDate;

                        const start = startDateStr ? new Date(startDateStr) : new Date();
                        start.setHours(0, 0, 0, 0);

                        const end = endDateStr ? new Date(endDateStr) : new Date();
                        end.setHours(0, 0, 0, 0);

                        const now = new Date();
                        now.setHours(0, 0, 0, 0);

                        const MS_PER_DAY = 1000 * 3600 * 24;
                        const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / MS_PER_DAY));
                        const daysElapsed = Math.max(1, Math.min(totalDays, Math.round((now.getTime() - start.getTime()) / MS_PER_DAY) + 1));
                        const daysRemaining = Math.max(0, Math.round((end.getTime() - now.getTime()) / MS_PER_DAY));
                        const gymDaysTrained = customer.gym_attendance_days ?? customer.gymAttendanceDays ?? customer.used_days ?? 0;
                        const timePct = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));
                        const isNearExpiring = daysRemaining <= 5;

                        return (
                          <div className="space-y-2.5">
                            <div>
                              <p className="font-display text-sm font-extrabold text-emerald-950 dark:text-emerald-300 truncate">
                                {activeMembership.package_name_snapshot || activeMembership.packageName || activeMembership.package?.name || 'Gói hội viên Gym'}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                                Hạn hết: <strong className="font-mono text-slate-700 dark:text-zinc-300">{endDateStr ? new Date(endDateStr).toLocaleDateString('vi-VN') : '—'}</strong>
                              </p>
                            </div>

                            <div className="rounded-xl bg-white p-2.5 dark:bg-zinc-800/80 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Còn lại</span>
                                <div className={`font-mono font-black text-base ${isNearExpiring ? 'text-rose-600 animate-pulse' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                  {daysRemaining} ngày
                                </div>
                              </div>
                              <div className="text-right border-l border-stone-100 dark:border-zinc-700 pl-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Đã tập</span>
                                <div className="font-mono font-bold text-xs text-slate-700 dark:text-zinc-300">
                                  {gymDaysTrained} ngày
                                </div>
                              </div>
                            </div>

                            {/* Compact Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                                <span>Thời hạn ({daysElapsed}/{totalDays} ngày)</span>
                                <span className="font-mono">{timePct}%</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 rounded-full ${
                                    isNearExpiring ? 'bg-rose-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${timePct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })() : (
                        <div className="rounded-xl border border-dashed border-emerald-300/60 bg-white/50 p-4 text-center dark:border-emerald-800/60 dark:bg-transparent">
                          <p className="text-xs text-slate-500 dark:text-zinc-400">Chưa có gói Gym kích hoạt</p>
                          <button
                            onClick={() => setActiveTab('ASSIGN')}
                            className="mt-1.5 text-xs font-bold text-emerald-600 hover:underline"
                          >
                            + Gán gói mới
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Right Column: PT Package Card */}
                    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50/80 via-emerald-50/30 to-transparent p-4 dark:border-teal-900/40 dark:from-teal-950/20 dark:to-transparent">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                          <Barbell size={15} className="text-emerald-600" /> Gói PT
                        </h3>
                        {activePtPackage && (
                          <div className="flex items-center gap-1.5">
                            {activePtPackage.status !== 'CANCELLED' && (
                              <button
                                type="button"
                                onClick={handleCancelPtPackage}
                                disabled={cancelPtPackageMutation.isPending}
                                className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 transition-colors"
                                title="Chấm dứt gói PT"
                              >
                                <XCircle size={12} /> Hủy gói PT
                              </button>
                            )}
                            <span className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                              <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                              {activePtPackage.status || 'ACTIVE'}
                            </span>
                          </div>
                        )}
                      </div>

                      {activePtPackage ? (() => {
                        const used = activePtPackage.used_sessions ?? activePtPackage.usedSessions ?? 0;
                        const total = activePtPackage.total_sessions ?? activePtPackage.totalSessions ?? 0;
                        const remaining = activePtPackage.remaining_sessions ?? activePtPackage.remainingSessions ?? Math.max(0, total - used);
                        const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
                        const isLowSessions = remaining <= 2;

                        return (
                          <div className="space-y-2.5">
                            <div>
                              <p className="font-display text-sm font-extrabold text-teal-950 dark:text-teal-200 truncate">
                                {activePtPackage.plan_name_snapshot || activePtPackage.planName || 'Gói Huấn Luyện PT'}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                                HLV: <strong className="text-slate-700 dark:text-zinc-300 font-bold">{activePtPackage.pt_name_snapshot || 'Chưa phân công'}</strong>
                              </p>
                            </div>

                            <div className="rounded-xl bg-white p-2.5 dark:bg-zinc-800/80 border border-teal-100 dark:border-teal-900/30 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Tiến độ buổi</span>
                                <div className="font-mono font-black text-base text-teal-600 dark:text-teal-400">
                                  {used} / {total} buổi
                                </div>
                              </div>
                              <div className="text-right border-l border-stone-100 dark:border-zinc-700 pl-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Còn lại</span>
                                <div className={`font-mono font-bold text-xs ${isLowSessions ? 'text-rose-600 font-black animate-pulse' : 'text-slate-700 dark:text-zinc-300'}`}>
                                  {remaining} buổi
                                </div>
                              </div>
                            </div>

                            {/* Compact Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                                <span>Hoàn thành ({used}/{total})</span>
                                <span className="font-mono">{pct}%</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 rounded-full ${
                                    isLowSessions ? 'bg-rose-500' : 'bg-teal-500'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })() : (
                        <div className="rounded-xl border border-dashed border-teal-300/60 bg-white/50 p-4 text-center dark:border-teal-800/60 dark:bg-transparent">
                          <p className="text-xs text-slate-500 dark:text-zinc-400">Chưa đăng ký gói PT</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Compact 4-Cell Info Grid */}
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <InfoTile icon={IdentificationBadge} tone="zinc" label="Mã khách hàng" value={customer.customer_code} mono />
                    <InfoTile icon={EnvelopeSimple} tone="blue" label="Email" value={customer.email || 'Chưa cung cấp'} />

                    <div className="rounded-xl border border-stone-200/80 p-2.5 dark:border-zinc-800 bg-white dark:bg-zinc-800/40">
                      <div className="mb-0.5 flex items-center gap-1">
                        {faceEnrolled ? (
                          <ShieldCheck size={13} className="text-emerald-600" />
                        ) : (
                          <ShieldWarning size={13} className="text-zinc-400" />
                        )}
                        <span className="text-[10px] font-bold uppercase text-slate-400">Face ID</span>
                      </div>
                      {faceEnrolled ? (
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-600">
                          <CheckCircle size={13} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">
                          <WarningCircle size={13} /> Chưa có
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-stone-200/80 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                      <div>
                        <div className="mb-0.5 flex items-center gap-1">
                          <Power size={13} className={isActiveStatus ? 'text-emerald-600' : 'text-rose-500'} />
                          <span className="text-[10px] font-bold uppercase text-slate-400">Tài khoản</span>
                        </div>
                        <span
                          className={`inline-block rounded-md px-1.5 py-0.5 text-[11px] font-extrabold ${
                            isActiveStatus
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {isActiveStatus ? 'ACTIVE' : 'LOCKED'}
                        </span>
                      </div>

                      <Button
                        variant={isActiveStatus ? 'secondary' : 'primary'}
                        size="sm"
                        disabled={toggleStatusMutation.isPending}
                        onClick={() => toggleStatusMutation.mutate(isActiveStatus ? 'INACTIVE' : 'ACTIVE')}
                        className={`shrink-0 text-[11px] px-2 py-1 ${
                          isActiveStatus
                            ? 'text-rose-600 border-rose-300 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-800'
                            : ''
                        }`}
                      >
                        {isActiveStatus ? 'Khóa' : 'Mở'}
                      </Button>
                    </div>
                  </div>

                  {/* Compact Password Reset Banner */}
                  <div className="flex flex-col gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-3 dark:border-emerald-800/40 dark:bg-emerald-950/20 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="flex items-center gap-1 text-[11px] font-bold uppercase text-emerald-800 dark:text-emerald-300">
                        <LockKey size={14} className="text-emerald-600" /> Quản lý mật khẩu đăng nhập
                      </span>
                      <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                        Tự động cấp lại pass mới & gửi đến Gmail:{' '}
                        <strong className="font-mono text-slate-800 dark:text-slate-200">{customer.email || 'Chưa cập nhật Email'}</strong>
                      </p>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={resetPasswordMutation.isPending}
                      onClick={handleResetPassword}
                      className="shrink-0 gap-1 border-emerald-300 bg-white text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-zinc-800 dark:text-emerald-400"
                    >
                      <LockKey size={14} /> {resetPasswordMutation.isPending ? 'Đang gửi...' : 'Cấp lại mật khẩu'}
                    </Button>
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

                  {!effectiveFaceIdEnabled ? (
                    <Callout tone="danger">
                      <div className="flex items-center gap-2 text-xs">
                        <LockKey size={18} className="shrink-0" />
                        <span>
                          Tính năng Nhận diện Khuôn mặt (Face ID) hiện <strong>đang bị tắt bởi Owner</strong> cho chi nhánh này. Vui lòng liên hệ Chủ phòng tập để bật tính năng.
                        </span>
                      </div>
                    </Callout>
                  ) : faceEnrolled && capturedShots.length === 0 ? (
                    <>
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle size={20} />
                          <span className="text-sm font-bold">Face ID đã được đăng ký</span>
                        </div>
                        {faceProfileStatus?.registeredAt && (
                          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                            Đăng ký lúc {new Date(faceProfileStatus.registeredAt).toLocaleString('vi-VN')}
                          </p>
                        )}
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" size="sm" onClick={handleRevokeFace} disabled={revokeFaceMutation.isPending}>
                          Thu hồi Face ID
                        </Button>
                        <Button size="sm" onClick={() => setCapturedShots([])}>Chụp lại ảnh Face ID</Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Chụp {FACE_ENROLL_TARGET_SHOTS} ảnh (chính diện, hơi trái, hơi phải) để tăng độ chính xác nhận diện. Dữ liệu chỉ lưu vector khuôn mặt, không lưu ảnh gốc.
                      </p>

                      <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 accent-emerald-600"
                          checked={faceConsentChecked}
                          onChange={(e) => setFaceConsentChecked(e.target.checked)}
                        />
                        <span>
                          Hội viên <strong>{customer.full_name}</strong> đã đồng ý cho phòng tập thu thập dữ liệu khuôn mặt
                          để sử dụng cho tính năng check-in bằng khuôn mặt.
                        </span>
                      </label>

                      {faceConsentChecked && (
                        <FaceCameraCapture ref={faceCameraRef} autoStart />
                      )}

                      {faceCaptureNote && (
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">{faceCaptureNote}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                          Đã chụp: {capturedShots.length}/{FACE_ENROLL_TARGET_SHOTS}
                        </span>
                        {capturedShots.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setCapturedShots([])}
                            className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                          >
                            Chụp lại từ đầu
                          </button>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="secondary" size="sm" onClick={() => setActiveTab('OVERVIEW')}>Quay lại</Button>
                        {capturedShots.length >= FACE_ENROLL_TARGET_SHOTS ? (
                          <Button size="sm" disabled={enrollFaceMutation.isPending} onClick={() => enrollFaceMutation.mutate()}>
                            {enrollFaceMutation.isPending ? 'Đang lưu...' : 'Lưu Face ID'}
                          </Button>
                        ) : (
                          <Button size="sm" disabled={!faceConsentChecked} onClick={handleCaptureShot}>
                            Chụp ảnh ({capturedShots.length}/{FACE_ENROLL_TARGET_SHOTS})
                          </Button>
                        )}
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
