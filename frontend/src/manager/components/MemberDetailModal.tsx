import { useState } from 'react';
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
} from '@phosphor-icons/react';
import {
  assignMembershipPackage,
  freezeMembership,
  addFreeDays,
  toggleCustomerStatus,
} from '../api/manager';
import { apiErrorMessage } from '../../owner/api/client';
import Callout from '../../owner/components/Callout';
import Button from '../../owner/components/Button';
import FormField from '../../owner/components/FormField';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any | null;
  branchPackages?: any[];
  isFaceIdEnabled?: boolean; // Owner setting toggle for Face ID
}

export default function MemberDetailModal({
  isOpen,
  onClose,
  customer,
  branchPackages = [],
  isFaceIdEnabled = true,
}: MemberDetailModalProps) {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ASSIGN' | 'FREEZE' | 'ADD_DAYS' | 'FACE'>('OVERVIEW');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>(customer?.status || 'ACTIVE');

  // Form - Assign Package
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

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

  if (!isOpen || !customer) return null;

  const activeMembership = customer.memberships?.[0] || customer.membership;

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

  // Mutations
  const assignMutation = useMutation({
    mutationFn: () =>
      assignMembershipPackage({
        customerId: customer.id,
        packageId: selectedPackageId,
        startDate,
      }),
    onSuccess: () => {
      setSuccess('Đã đăng ký / gán gói tập thành công!');
      setError(null);
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

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in cursor-pointer"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-stone-200 bg-white shadow-2xl overflow-hidden dark:border-zinc-800 dark:bg-zinc-900 cursor-default transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Profile Bar */}
        <div className="flex items-center justify-between p-6 border-b border-stone-100 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-800/30">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-extrabold text-xl shadow-lg shadow-emerald-500/20">
              {customer.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{customer.full_name}</h2>
                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-md">
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

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-stone-200/60 dark:hover:bg-zinc-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Tabs / Quick Shortcuts */}
        <div className="flex items-center gap-1 border-b border-stone-100 p-2 dark:border-zinc-800 bg-stone-100/50 dark:bg-zinc-900 overflow-x-auto">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition ${
              activeTab === 'OVERVIEW'
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-800 dark:text-emerald-400'
                : 'text-zinc-500 hover:bg-white/50 dark:text-zinc-400'
            }`}
          >
            <User size={15} /> Thông tin chung
          </button>

          <button
            onClick={() => setActiveTab('ASSIGN')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition ${
              activeTab === 'ASSIGN'
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-800 dark:text-emerald-400'
                : 'text-zinc-500 hover:bg-white/50 dark:text-zinc-400'
            }`}
          >
            <CreditCard size={15} /> Gán gói tập
          </button>

          <button
            onClick={() => setActiveTab('FREEZE')}
            disabled={!activeMembership}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === 'FREEZE'
                ? 'bg-white text-blue-700 shadow-sm dark:bg-zinc-800 dark:text-blue-400'
                : 'text-zinc-500 hover:bg-white/50 dark:text-zinc-400'
            }`}
          >
            <Snowflake size={15} /> Đóng băng gói
          </button>

          <button
            onClick={() => setActiveTab('ADD_DAYS')}
            disabled={!activeMembership}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === 'ADD_DAYS'
                ? 'bg-white text-purple-700 shadow-sm dark:bg-zinc-800 dark:text-purple-400'
                : 'text-zinc-500 hover:bg-white/50 dark:text-zinc-400'
            }`}
          >
            <CalendarPlus size={15} /> Gia hạn / Thêm ngày
          </button>

          <button
            onClick={() => setActiveTab('FACE')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition ${
              activeTab === 'FACE'
                ? 'bg-white text-amber-700 shadow-sm dark:bg-zinc-800 dark:text-amber-400'
                : 'text-zinc-500 hover:bg-white/50 dark:text-zinc-400'
            }`}
          >
            <Camera size={15} /> Face ID
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
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

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-5">
              {/* Active Package Banner */}
              <div className="rounded-2xl border border-stone-200/80 bg-stone-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <CreditCard size={15} className="text-emerald-600" /> Thẻ Tập & Gói Đăng Ký Hiện Tại
                </h3>

                {activeMembership ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200/60 dark:border-zinc-700 dark:bg-zinc-800">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {activeMembership.package_name_snapshot || activeMembership.package?.name || 'Gói hội viên'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        Thời hạn: {activeMembership.start_date ? new Date(activeMembership.start_date).toLocaleDateString('vi-VN') : 'N/A'} - {activeMembership.end_date ? new Date(activeMembership.end_date).toLocaleDateString('vi-VN') : 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {activeMembership.status || 'ACTIVE'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-stone-200 rounded-xl dark:border-zinc-700">
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

              {/* Grid Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-stone-200 p-3.5 dark:border-zinc-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Mã Khách Hàng</span>
                  <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">{customer.customer_code}</p>
                </div>
                <div className="rounded-2xl border border-stone-200 p-3.5 dark:border-zinc-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 mt-1">{customer.email || 'Chưa cung cấp'}</p>
                </div>
                <div className="rounded-2xl border border-stone-200 p-3.5 dark:border-zinc-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Trạng Thái Face ID</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {faceEnrolled ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <CheckCircle size={14} /> Đã Đăng Ký (Active)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">
                        <WarningCircle size={14} /> Chưa Đăng Ký
                      </span>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-stone-200 p-3.5 dark:border-zinc-800 flex items-center justify-between col-span-1 sm:col-span-2 bg-stone-50/50 dark:bg-zinc-800/20">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Trạng Thái Tài Khoản</span>
                    <span
                      className={`inline-block mt-1 text-xs font-extrabold px-2.5 py-0.5 rounded-md ${
                        currentStatus === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {currentStatus === 'ACTIVE' ? 'Kích hoạt (ACTIVE)' : 'Tạm khóa (INACTIVE)'}
                    </span>
                  </div>

                  <Button
                    variant={currentStatus === 'ACTIVE' ? 'secondary' : 'primary'}
                    size="sm"
                    disabled={toggleStatusMutation.isPending}
                    onClick={() =>
                      toggleStatusMutation.mutate(currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
                    }
                    className={`text-xs ${
                      currentStatus === 'ACTIVE'
                        ? 'text-rose-600 border-rose-300 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-950'
                        : ''
                    }`}
                  >
                    {toggleStatusMutation.isPending
                      ? 'Đang đổi...'
                      : currentStatus === 'ACTIVE'
                      ? 'Tạm Khóa Thẻ'
                      : 'Kích Hoạt Lại'}
                  </Button>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button variant="secondary" size="sm" onClick={() => setActiveTab('ASSIGN')} className="justify-center text-xs">
                  <CreditCard size={14} /> Gán gói
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!activeMembership}
                  onClick={() => setActiveTab('FREEZE')}
                  className="justify-center text-xs"
                >
                  <Snowflake size={14} /> Đóng băng
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!activeMembership}
                  onClick={() => setActiveTab('ADD_DAYS')}
                  className="justify-center text-xs"
                >
                  <CalendarPlus size={14} /> Thêm ngày
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setActiveTab('FACE')} className="justify-center text-xs">
                  <Camera size={14} /> Face ID
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: ASSIGN PACKAGE */}
          {activeTab === 'ASSIGN' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CreditCard size={18} className="text-emerald-600" /> Đăng Ký / Gán Gói Tập Cho Hội Viên
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Chọn gói tập khả dụng tại chi nhánh và ngày bắt đầu kích hoạt thẻ.
              </p>

              <FormField label="Chọn Gói Tập Chi Nhánh *" htmlFor="assign-pkg">
                <select
                  id="assign-pkg"
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
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

              <FormField label="Ngày Kích Hoạt (Kế Toán / Bắt Đầu) *" htmlFor="assign-start">
                <input
                  id="assign-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </FormField>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setActiveTab('OVERVIEW')}>Hủy</Button>
                <Button
                  size="sm"
                  disabled={!selectedPackageId || assignMutation.isPending}
                  onClick={() => assignMutation.mutate()}
                >
                  {assignMutation.isPending ? 'Đang lưu...' : 'Xác Nhận Gán Gói'}
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: FREEZE MEMBERSHIP */}
          {activeTab === 'FREEZE' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Snowflake size={18} className="text-blue-600" /> Đóng Băng / Tạm Ngưng Gói Tập
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Tạm dừng thời hạn thẻ cho hội viên đi tác nghiệp, du lịch hoặc bảo lưu sức khỏe.
              </p>

              <FormField label="Ngày Bắt Đầu Bảo Lưu *" htmlFor="freeze-start">
                <input
                  id="freeze-start"
                  type="date"
                  value={freezeStartDate}
                  onChange={(e) => setFreezeStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </FormField>

              <FormField label="Ngày Kết Thúc Bảo Lưu *" htmlFor="freeze-end">
                <input
                  id="freeze-end"
                  type="date"
                  value={freezeEndDate}
                  onChange={(e) => setFreezeEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </FormField>

              <FormField label="Lý Do Tạm Ngưng" htmlFor="freeze-reason">
                <textarea
                  id="freeze-reason"
                  rows={2}
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.target.value)}
                  placeholder="Nhập lý do bảo lưu (Công tác, sức khỏe...)"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </FormField>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setActiveTab('OVERVIEW')}>Hủy</Button>
                <Button
                  size="sm"
                  disabled={!freezeStartDate || !freezeEndDate || freezeMutation.isPending}
                  onClick={() => freezeMutation.mutate()}
                >
                  {freezeMutation.isPending ? 'Đang thực hiện...' : 'Xác Nhận Đóng Băng'}
                </Button>
              </div>
            </div>
          )}

          {/* TAB 4: ADD DAYS / RENEW */}
          {activeTab === 'ADD_DAYS' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CalendarPlus size={18} className="text-purple-600" /> Gia Hạn / Cộng Thêm Ngày Tập
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Thêm ngày sử dụng đền bù sự cố hoặc thưởng khuyến mãi cho hội viên.
              </p>

              <FormField label="Số Ngày Cộng Thêm *" htmlFor="add-days-count">
                <input
                  id="add-days-count"
                  type="number"
                  min={1}
                  max={365}
                  value={addDaysCount}
                  onChange={(e) => setAddDaysCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </FormField>

              <FormField label="Lý Do Gia Hạn / Cộng Ngày *" htmlFor="add-days-reason">
                <input
                  id="add-days-reason"
                  type="text"
                  required
                  value={addDaysReason}
                  onChange={(e) => setAddDaysReason(e.target.value)}
                  placeholder="Nhập lý do cộng ngày (Khuyến mãi, bù nghỉ Lễ...)"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </FormField>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setActiveTab('OVERVIEW')}>Hủy</Button>
                <Button
                  size="sm"
                  disabled={!addDaysCount || !addDaysReason || addDaysMutation.isPending}
                  onClick={() => addDaysMutation.mutate()}
                >
                  {addDaysMutation.isPending ? 'Đang thực hiện...' : 'Cộng Ngày Tập'}
                </Button>
              </div>
            </div>
          )}

          {/* TAB 5: FACE ENROLLMENT */}
          {activeTab === 'FACE' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Camera size={18} className="text-amber-600" /> Thu Thập Dữ Liệu Khuôn Mặt (Face Enrollment)
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

                  <div className="relative aspect-video w-full rounded-2xl bg-zinc-950 flex flex-col items-center justify-center text-white overflow-hidden border border-zinc-800">
                    {/* Simulated Camera Viewfinder */}
                    <div className="absolute inset-8 border-2 border-dashed border-emerald-500/70 rounded-full animate-pulse flex items-center justify-center pointer-events-none">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 bg-zinc-950/80 px-2 py-0.5 rounded">
                        {isCapturing ? 'Đang trích xuất Vector...' : 'Căn chỉnh khuôn mặt'}
                      </span>
                    </div>

                    {isCapturing ? (
                      <div className="flex flex-col items-center gap-2 z-10">
                        <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
                        <span className="text-xs text-emerald-300 font-mono">Scanning 128 Facial Landmarks...</span>
                      </div>
                    ) : faceEnrolled ? (
                      <div className="flex flex-col items-center gap-2 z-10 text-emerald-400">
                        <CheckCircle size={40} />
                        <span className="text-xs font-bold">Face ID Đã Được Đăng Ký Thành Công</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 z-10 text-zinc-400">
                        <Camera size={36} />
                        <span className="text-xs">Sẵn sàng thu thập ảnh</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" size="sm" onClick={() => setActiveTab('OVERVIEW')}>Quay lại</Button>
                    <Button
                      size="sm"
                      disabled={isCapturing}
                      onClick={handleEnrollFace}
                    >
                      {faceEnrolled ? 'Chụp Lại Ảnh Face ID' : 'Thu Thập Face Vector'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
