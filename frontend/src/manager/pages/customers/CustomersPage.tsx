import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  MagnifyingGlass,
  Phone,
  Envelope,
  IdentificationCard,
  UserPlus,
  QrCode,
  CheckCircle,
  XCircle,
  ShieldCheck,
  ShieldWarning,
  Sparkle,
  Clock,
  CaretLeft,
  CaretRight,
  Eye,
  LockKey,
} from '@phosphor-icons/react';
import {
  getManagerCustomers,
  getBranchPackages,
  registerCustomerWithAccount,
  assignMembershipPackage,
  toggleCustomerStatus,
  manualCheckin,
  manualCheckout,
  resetCustomerPassword,
} from '../../api/manager';
import Card from '../../../owner/components/Card';
import Button from '../../../owner/components/Button';
import { showConfirm, showToast } from '../../../owner/utils/swal';
import { inputClass } from '../../../owner/components/FormField';
import { Skeleton } from '../../../owner/components/Skeleton';
import Callout from '../../../owner/components/Callout';
import MemberDetailModal from '../../components/MemberDetailModal';

export default function ManagerCustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterPackageId, setFilterPackageId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [detailCustomer, setDetailCustomer] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Form states - Add Customer
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('MALE');
  const [defaultPassword, setDefaultPassword] = useState('Fitflow@123');

  // Form states - Assign Package
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Notifications
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Queries
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['manager-customers-list', search, filterPackageId, filterStatus, page, limit],
    queryFn: () => getManagerCustomers(search, filterPackageId || undefined, filterStatus || undefined, page, limit),
  });

  const customers = responseData?.items || [];
  const meta = responseData?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 };

  const { data: branchPackages = [] } = useQuery({
    queryKey: ['manager-branch-packages'],
    queryFn: getBranchPackages,
  });

  // Mutations
  const registerMutation = useMutation({
    mutationFn: () =>
      registerCustomerWithAccount({
        fullName,
        email,
        phone: phone || undefined,
        gender,
        defaultPassword,
      }),
    onSuccess: (data) => {
      setSuccess('Đăng ký tài khoản khách hàng thành công!');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['manager-customers-list'] });
      
      setTimeout(() => {
        setIsAddModalOpen(false);
        setSuccess(null);
        setFullName('');
        setEmail('');
        setPhone('');
        setGender('MALE');
        setDefaultPassword('Fitflow@123');
        setSelectedCustomer(data);
        setIsAssignModalOpen(true);
      }, 1200);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Không thể đăng ký khách hàng');
      setSuccess(null);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (customerId: string) => resetCustomerPassword(customerId),
    onSuccess: (res) => {
      const msg = res.message || 'Đã cấp lại mật khẩu tạm thời thành công!';
      setSuccess(msg);
      setError(null);
      showToast(msg, 'success');
      queryClient.invalidateQueries({ queryKey: ['manager-customers-list'] });
      setTimeout(() => setSuccess(null), 4000);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Không thể cấp lại mật khẩu';
      setError(msg);
      setSuccess(null);
      showToast(msg, 'error');
      setTimeout(() => setError(null), 4000);
    },
  });

  const assignPackageMutation = useMutation({
    mutationFn: () =>
      assignMembershipPackage({
        customerId: selectedCustomer?.id,
        packageId: selectedPackageId,
        startDate,
      }),
    onSuccess: () => {
      setSuccess('Gán gói tập chi nhánh thành công!');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['manager-customers-list'] });
      setTimeout(() => {
        setIsAssignModalOpen(false);
        setSelectedCustomer(null);
        setSelectedPackageId('');
        setSuccess(null);
      }, 1200);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Không thể gán gói tập');
      setSuccess(null);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ customerId, newStatus }: { customerId: string; newStatus: 'ACTIVE' | 'INACTIVE' }) =>
      toggleCustomerStatus(customerId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-customers-list'] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Không thể thay đổi trạng thái tài khoản');
    },
  });

  const checkinMutation = useMutation({
    mutationFn: ({ customerId, membershipId }: { customerId: string; membershipId?: string }) =>
      manualCheckin(customerId, membershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-customers-list'] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Không thể check-in khách hàng');
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (attendanceId: string) => manualCheckout(attendanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-customers-list'] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'Không thể check-out khách hàng');
    },
  });

  // Event handlers
  function handleOpenAddModal() {
    setIsAddModalOpen(true);
    setError(null);
    setSuccess(null);
  }

  function handleOpenAssignModal(customer: any) {
    setSelectedCustomer(customer);
    setIsAssignModalOpen(true);
    setError(null);
    setSuccess(null);
  }

  function handleOpenQrModal(customer: any) {
    setSelectedCustomer(customer);
    setIsQrModalOpen(true);
  }

  // QR Server Data Payload
  const qrPayload = selectedCustomer
    ? JSON.stringify({
        'Mã KH': selectedCustomer.customer_code,
        'Họ tên': selectedCustomer.full_name,
        'Email': selectedCustomer.email,
        'SĐT': selectedCustomer.phone || 'Chưa cung cấp',
        'Trạng thái': selectedCustomer.status === 'ACTIVE' ? 'Kích hoạt' : 'Bị khóa',
        'Token': selectedCustomer.qr_token,
      }, null, 2)
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6 w-full max-w-full overflow-x-hidden"
    >
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
              Hội viên chi nhánh
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight mt-1.5">
            Danh sách hội viên & khách hàng
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Quản lý, đăng ký tài khoản khách hàng, phân bổ gói tập và check-in/check-out trực tiếp tại quầy.
          </p>
        </div>

        <Button onClick={handleOpenAddModal} className="self-start sm:self-auto shrink-0 flex items-center gap-2">
          <UserPlus size={18} />
          <span>+ Đăng ký khách hàng</span>
        </Button>
      </div>

      {/* Main Content Card Container */}
      <Card className="border border-slate-200/80 dark:border-zinc-800/80 shadow-xs rounded-xl overflow-hidden p-4 sm:p-5 bg-white dark:bg-zinc-950">
        
        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row gap-3 mb-5 items-stretch lg:items-center justify-between border-b border-slate-100 dark:border-zinc-800/80 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            {/* Search Input */}
            <div className="relative">
              <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className={`${inputClass} pl-9 h-10 text-xs rounded-lg`}
                placeholder="Tên, SĐT, mã hội viên..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Package Filter */}
            <select
              className={`${inputClass} text-xs h-10 rounded-lg`}
              value={filterPackageId}
              onChange={(e) => {
                setFilterPackageId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">🏢 Tất cả gói tập chi nhánh</option>
              {branchPackages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className={`${inputClass} text-xs h-10 rounded-lg`}
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">🚦 Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động (Active)</option>
              <option value="INACTIVE">Khóa/Tạm dừng (Blocked)</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(search || filterPackageId || filterStatus) && (
            <button
              onClick={() => {
                setSearch('');
                setFilterPackageId('');
                setFilterStatus('');
                setPage(1);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold self-end lg:self-auto cursor-pointer whitespace-nowrap lg:pl-3"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : (
          <>
            {/* 1. Mobile Card List View (< md) */}
            <div className="block md:hidden flex flex-col gap-3">
              {customers && customers.length > 0 ? (
                customers.map((c: any) => {
                  const activeMembership = c.memberships?.[0];
                  const activeAttendance = c.attendances?.[0];
                  return (
                    <div
                      key={c.id}
                      className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs dark:bg-emerald-950 dark:text-emerald-300">
                            {c.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-slate-900 dark:text-zinc-100 text-sm block truncate">
                              {c.full_name}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                              <IdentificationCard size={13} /> {c.customer_code}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              customerId: c.id,
                              newStatus: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                            })
                          }
                          className="flex items-center gap-1 focus:outline-none shrink-0"
                        >
                          {c.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                              <ShieldCheck size={12} /> Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                              <ShieldWarning size={12} /> Tạm khóa
                            </span>
                          )}
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/60 flex flex-col gap-1.5 text-xs text-slate-600 dark:text-zinc-400">
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">{c.phone || 'Chưa có SĐT'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Envelope size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">{c.email || 'Chưa có Email'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Clock size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">
                            Gói tập:{' '}
                            <strong className="text-slate-800 dark:text-zinc-200">
                              {activeMembership ? activeMembership.package_name_snapshot : 'Chưa gán gói'}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Mobile Actions Button Group */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/60">
                        <button
                          onClick={() => handleOpenQrModal(c)}
                          className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 transition-colors"
                        >
                          <QrCode size={14} /> Mã QR
                        </button>

                        {!activeMembership && (
                          <button
                            onClick={() => handleOpenAssignModal(c)}
                            className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 transition-colors"
                          >
                            <Sparkle size={14} /> Gán gói tập
                          </button>
                        )}

                        {activeMembership && (
                          <>
                            {activeAttendance ? (
                              <button
                                onClick={() => checkoutMutation.mutate(activeAttendance.id)}
                                className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 transition-colors"
                              >
                                <XCircle size={14} /> Check-out nhanh
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  checkinMutation.mutate({ customerId: c.id, membershipId: activeMembership.id })
                                }
                                className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors"
                              >
                                <CheckCircle size={14} /> Check-in nhanh
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  Không tìm thấy hội viên nào.
                </div>
              )}
            </div>

            {/* 2. Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200/80 dark:border-zinc-800">
              <table className="w-full text-left text-sm min-w-[900px] text-slate-600 dark:text-zinc-300">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 dark:bg-zinc-800/60 dark:text-zinc-400 border-b border-slate-200/80 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Hội viên</th>
                    <th className="px-4 py-3">Mã KH</th>
                    <th className="px-4 py-3">Số điện thoại</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Gói tập</th>
                    <th className="px-4 py-3">Vận hành</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {customers && customers.length > 0 ? (
                    customers.map((c: any) => {
                      const activeMembership = c.memberships?.[0];
                      const activeAttendance = c.attendances?.[0];
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs dark:bg-emerald-950 dark:text-emerald-300">
                              {c.full_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate">{c.full_name}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700 dark:text-zinc-300">
                            {c.customer_code}
                          </td>
                          <td className="px-4 py-3 text-xs">{c.phone || 'Chưa có SĐT'}</td>
                          <td className="px-4 py-3 text-xs">{c.email || 'Chưa có Email'}</td>
                          <td className="px-4 py-3 text-xs">
                            {activeMembership ? (
                              <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                {activeMembership.package_name_snapshot}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Chưa gán gói</span>
                            )}
                          </td>
                          
                          {/* Live Presence / Checkin state */}
                          <td className="px-4 py-3 text-xs">
                            {activeAttendance ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 font-bold border border-emerald-200 dark:border-emerald-800">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Đang ở phòng tập
                              </span>
                            ) : (
                              <span className="text-slate-400">Không có mặt</span>
                            )}
                          </td>

                          {/* Account status toggle */}
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() =>
                                toggleStatusMutation.mutate({
                                  customerId: c.id,
                                  newStatus: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                                })
                              }
                              className="focus:outline-none flex items-center gap-1 text-xs cursor-pointer"
                              title="Nhấp để chuyển đổi trạng thái kích hoạt"
                            >
                              {c.status === 'ACTIVE' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 font-bold">
                                  <ShieldCheck size={13} /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60 font-bold">
                                  <ShieldWarning size={13} /> Blocked
                                </span>
                              )}
                            </button>
                          </td>

                          {/* Action group */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Detail & 4 Actions */}
                              <button
                                onClick={() => {
                                  setDetailCustomer(c);
                                  setIsDetailModalOpen(true);
                                }}
                                className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center transition-colors cursor-pointer"
                                title="Xem thông tin chi tiết & Thao tác nghiệp vụ"
                              >
                                <Eye size={16} />
                              </button>

                              {/* QR View */}
                              <button
                                onClick={() => handleOpenQrModal(c)}
                                className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
                                title="Xem mã QR Hội viên"
                              >
                                <QrCode size={16} />
                              </button>

                              {/* Reset MK */}
                              <button
                                onClick={async () => {
                                  if (!c.email) {
                                    showToast('Hội viên chưa có email. Vui lòng bổ sung email trước khi cấp lại mật khẩu.', 'warning');
                                    return;
                                  }
                                  const confirmed = await showConfirm({
                                    title: '🔑 Cấp lại mật khẩu hội viên',
                                    text: `Bạn có chắc muốn sinh mật khẩu tạm ngẫu nhiên mới cho hội viên ${c.full_name} và gửi trực tiếp tới email ${c.email}?`,
                                    confirmButtonText: 'Đồng ý cấp lại',
                                    cancelButtonText: 'Hủy bỏ',
                                    icon: 'question',
                                  });
                                  if (confirmed) {
                                    resetPasswordMutation.mutate(c.id);
                                  }
                                }}
                                className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center transition-colors cursor-pointer"
                                title="Cấp lại mật khẩu & gửi Email về Gmail cho hội viên"
                              >
                                <LockKey size={16} />
                              </button>

                              {/* Gán gói */}
                              {!activeMembership && (
                                <button
                                  onClick={() => handleOpenAssignModal(c)}
                                  className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Gán gói tập cho khách"
                                >
                                  <Sparkle size={14} /> Gán gói
                                </button>
                              )}

                              {/* Check-in / Checkout */}
                              {activeMembership && (
                                <>
                                  {activeAttendance ? (
                                    <button
                                      onClick={() => checkoutMutation.mutate(activeAttendance.id)}
                                      className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                      title="Khách ra về, check-out"
                                    >
                                      <XCircle size={14} /> Check-out
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        checkinMutation.mutate({ customerId: c.id, membershipId: activeMembership.id })
                                      }
                                      className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                      title="Khách vào tập, check-in"
                                    >
                                      <CheckCircle size={14} /> Check-in
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-xs text-slate-400">
                        Không tìm thấy hội viên nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            {meta.total > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800/80 text-xs text-slate-500 dark:text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span>Hiển thị</span>
                  <strong className="text-slate-800 dark:text-zinc-200">
                    {(meta.page - 1) * meta.limit + 1} - {Math.min(meta.page * meta.limit, meta.total)}
                  </strong>
                  <span>trong tổng số</span>
                  <strong className="text-slate-800 dark:text-zinc-200">{meta.total}</strong>
                  <span>hội viên</span>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {/* Items per page selector */}
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="text-xs shrink-0 whitespace-nowrap">Hiển thị:</span>
                    <select
                      className="h-8 text-xs px-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                    >
                      <option value={10}>10 / trang</option>
                      <option value={20}>20 / trang</option>
                      <option value={50}>50 / trang</option>
                    </select>
                  </div>

                  {/* Page Nav Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="h-8 w-8 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Trang trước"
                    >
                      <CaretLeft size={14} />
                    </button>

                    {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
                      .map((p, index, array) => {
                        const prev = array[index - 1];
                        return (
                          <div key={p} className="flex items-center">
                            {prev && p - prev > 1 && <span className="px-1 text-slate-400">...</span>}
                            <button
                              onClick={() => setPage(p)}
                              className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                page === p
                                  ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                  : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                              }`}
                            >
                              {p}
                            </button>
                          </div>
                        );
                      })}

                    <button
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                      className="h-8 w-8 rounded-lg border border-slate-200 dark:border-zinc-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Trang sau"
                    >
                      <CaretRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* MODAL 1: Đăng ký khách hàng & tạo tài khoản */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs"
              onClick={() => setIsAddModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            >
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-zinc-50">
                  Đăng ký & tạo tài khoản khách hàng mới
                </h3>
                <p className="text-xs text-slate-500">
                  Nhập thông tin khách hàng, hệ thống sẽ tạo tài khoản đăng nhập kiêm hồ sơ hội viên.
                </p>
              </div>

              {error && <Callout tone="danger">{error}</Callout>}
              {success && <Callout tone="success">{success}</Callout>}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  registerMutation.mutate();
                }}
                className="flex flex-col gap-3.5"
              >
                {/* Họ tên */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập họ và tên khách hàng"
                    className={`${inputClass} text-xs h-10`}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                {/* Email & Phone columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Email đăng nhập *</label>
                    <input
                      type="email"
                      required
                      placeholder="ví dụ: customer@gmail.com"
                      className={`${inputClass} text-xs h-10`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Số điện thoại</label>
                    <input
                      type="tel"
                      placeholder="Số điện thoại liên hệ"
                      className={`${inputClass} text-xs h-10`}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                {/* Gender & Default Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Giới tính</label>
                    <select
                      className={`${inputClass} text-xs h-10`}
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Mật khẩu mặc định *</label>
                    <input
                      type="text"
                      required
                      placeholder="Mật khẩu khởi tạo"
                      className={`${inputClass} text-xs h-10`}
                      value={defaultPassword}
                      onChange={(e) => setDefaultPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
                  <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
                    Hủy bỏ
                  </Button>
                  <Button size="sm" type="submit" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? 'Đang tạo...' : 'Đăng ký khách hàng'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Gán gói tập chi nhánh */}
      <AnimatePresence>
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs"
              onClick={() => setIsAssignModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col gap-4"
            >
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-zinc-50">
                  Gán gói tập kinh doanh tại Chi nhánh
                </h3>
                <p className="text-xs text-slate-500">
                  Gán gói tập để kích hoạt thẻ hội viên cho khách hàng <strong>{selectedCustomer?.full_name}</strong>.
                </p>
              </div>

              {error && <Callout tone="danger">{error}</Callout>}
              {success && <Callout tone="success">{success}</Callout>}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!selectedPackageId) {
                    setError('Vui lòng chọn một gói tập');
                    return;
                  }
                  assignPackageMutation.mutate();
                }}
                className="flex flex-col gap-3.5"
              >
                {/* Chọn gói */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Danh sách gói tập khả dụng</label>
                  <select
                    required
                    className={`${inputClass} text-xs h-10`}
                    value={selectedPackageId}
                    onChange={(e) => setSelectedPackageId(e.target.value)}
                  >
                    <option value="">-- Chọn gói tập --</option>
                    {branchPackages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} ({Number(pkg.basePrice).toLocaleString('vi-VN')} đ / {pkg.durationValue} {pkg.durationUnit === 'MONTH' ? 'Tháng' : pkg.durationUnit})
                      </option>
                    ))}
                  </select>
                  {branchPackages.length === 0 && (
                    <span className="text-[10px] text-rose-500 italic mt-0.5">
                      * Chi nhánh hiện tại chưa được Owner gán gói tập nào. Vui lòng liên hệ Owner.
                    </span>
                  )}
                </div>

                {/* Chọn ngày kích hoạt */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Ngày bắt đầu kích hoạt</label>
                  <input
                    type="date"
                    required
                    className={`${inputClass} text-xs h-10`}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="mt-4 flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
                  <Button variant="secondary" size="sm" type="button" onClick={() => setIsAssignModalOpen(false)}>
                    Hủy
                  </Button>
                  <Button size="sm" type="submit" disabled={assignPackageMutation.isPending || branchPackages.length === 0}>
                    {assignPackageMutation.isPending ? 'Đang gán...' : 'Gán gói & Kích hoạt'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Xem mã QR thông tin hội viên */}
      <AnimatePresence>
        {isQrModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs"
              onClick={() => setIsQrModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col items-center gap-4 text-center"
            >
              <div className="w-full flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
                <span className="text-sm font-bold text-slate-800 dark:text-zinc-200">Mã QR Check-in hội viên</span>
                <button
                  onClick={() => setIsQrModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Đóng
                </button>
              </div>

              {/* QR Code image */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-center my-1">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrPayload)}`}
                  alt="QR Code khách hàng"
                  className="h-44 w-44 object-contain"
                />
              </div>

              {/* Customer Details */}
              <div className="w-full flex flex-col gap-1 text-xs text-left bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                <div>
                  <span className="text-slate-400">Hội viên:</span>{' '}
                  <strong className="text-slate-800 dark:text-zinc-200">{selectedCustomer?.full_name}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Mã khách hàng:</span>{' '}
                  <strong className="text-slate-800 dark:text-zinc-200 font-mono">{selectedCustomer?.customer_code}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Email:</span>{' '}
                  <span className="text-slate-800 dark:text-zinc-200">{selectedCustomer?.email}</span>
                </div>
                <div>
                  <span className="text-slate-400">SĐT:</span>{' '}
                  <span className="text-slate-800 dark:text-zinc-200">{selectedCustomer?.phone || 'Chưa cung cấp'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Trạng thái:</span>{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {selectedCustomer?.status === 'ACTIVE' ? 'Kích hoạt' : 'Khóa'}
                  </strong>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-snug">
                * Khách hàng quét mã QR này trực tiếp tại cổng kiểm soát hoặc để lễ tân tiếp quầy quét camera nhận dạng check-in.
              </p>

              <Button variant="secondary" size="sm" className="w-full" onClick={() => setIsQrModalOpen(false)}>
                Đóng cửa sổ
              </Button>
            </motion.div>
          </div>
        )}

      {/* Member Detail & 4 Actions Modal */}
      {isDetailModalOpen && (
        <MemberDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setDetailCustomer(null);
          }}
          customer={detailCustomer}
          branchPackages={branchPackages}
          isFaceIdEnabled={true}
        />
      )}
      </AnimatePresence>
    </motion.div>
  );
}
