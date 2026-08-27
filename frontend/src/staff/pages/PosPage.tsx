import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  QrCode,
  Money,
  CheckCircle,
  MagnifyingGlass,
  User,
  Package,
  Calendar,
  Sparkle,
  WarningCircle,
  ShieldWarning,
  Barbell,
  Ticket,
} from '@phosphor-icons/react';
import {
  getManagerCustomers,
  getBranchPackages,
  getPtPackagePlans,
  assignMembershipPackage,
  assignPtPackage,
} from '../../manager/api/manager';
import { apiErrorMessage } from '../../owner/api/client';
import { showToast } from '../../owner/utils/swal';
import Callout from '../../owner/components/Callout';
import Button from '../../owner/components/Button';
import PendingQrPaymentModal from '../../manager/components/PendingQrPaymentModal';
import { useRealtimeInvalidate } from '../../lib/useRealtimeInvalidate';

export default function StaffPosPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Package category tab: 'MEMBERSHIP' or 'PT'
  const [packageCategory, setPackageCategory] = useState<'MEMBERSHIP' | 'PT'>('MEMBERSHIP');

  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'VIETQR' | 'CASH'>('VIETQR');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pendingQr, setPendingQr] = useState<{ paymentId: string; qrUrl: string; amount: number; expiresAt: string } | null>(null);

  useRealtimeInvalidate('payment:confirmed', [['staff-dashboard-overview'], ['manager-pt-package-plans'], ['staff-currently-in-gym']]);

  // Search customers query
  const { data: customerData, isLoading: searching } = useQuery({
    queryKey: ['staff-pos-customer-search', search],
    queryFn: () => getManagerCustomers(search),
    enabled: search.trim().length >= 2,
  });

  // Fetch membership packages query
  const { data: packages = [], isLoading: loadingPackages } = useQuery({
    queryKey: ['staff-branch-packages'],
    queryFn: () => getBranchPackages(),
  });

  // Fetch approved PT packages query
  const { data: ptPackages = [], isLoading: loadingPtPackages } = useQuery({
    queryKey: ['staff-pt-packages-pos'],
    queryFn: () => getPtPackagePlans('ACTIVE'),
  });

  function clearSelection() {
    setSelectedCustomer(null);
    setSelectedPackage(null);
  }

  // Sell package mutation
  const sellMutation = useMutation({
    mutationFn: async () => {
      if (packageCategory === 'MEMBERSHIP') {
        return assignMembershipPackage(selectedCustomer.id, selectedPackage.id, startDate, paymentMethod);
      } else {
        return assignPtPackage(selectedCustomer.id, selectedPackage.id, startDate, paymentMethod);
      }
    },
    onSuccess: (res: any) => {
      setError(null);
      if (res?.requiresPayment) {
        // VietQR sale: the Membership/PT package isn't created yet — wait for the
        // SePay webhook to confirm before granting anything.
        setPendingQr({ paymentId: res.paymentId, qrUrl: res.qrUrl, amount: res.amount, expiresAt: res.expiresAt });
        return;
      }
      const typeText = packageCategory === 'MEMBERSHIP' ? 'hội viên' : 'huấn luyện PT';
      setSuccessMsg(res?.message || `Đã gán thành công gói ${typeText} ${selectedPackage.name} cho hội viên ${selectedCustomer.full_name}!`);
      clearSelection();
      queryClient.invalidateQueries({ queryKey: ['staff-dashboard-overview'] });
      queryClient.invalidateQueries({ queryKey: ['manager-pt-package-plans'] });
    },
    onError: (err) => {
      setError(apiErrorMessage(err, 'Không thể khởi tạo hợp đồng gói tập'));
      setSuccessMsg(null);
    },
  });

  // Selected package price & details helper
  const packagePrice = selectedPackage
    ? packageCategory === 'MEMBERSHIP'
      ? selectedPackage.basePrice
      : Number(selectedPackage.price)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CreditCard className="text-emerald-600 dark:text-emerald-400" size={28} />
          Bán Gói Tập & Quầy POS Thu Ngân
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Chọn hội viên, chọn gói tập Hội Viên hoặc Gói Huấn Luyện PT và khởi tạo mã thanh toán VietQR động / thu tiền mặt tại quầy.
        </p>
      </div>

      {successMsg && (
        <Callout tone="success">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        </Callout>
      )}

      {error && (
        <Callout tone="danger">
          <div className="flex items-center gap-2">
            <WarningCircle size={20} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        </Callout>
      )}

      {/* 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Selection Panel */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Step 1: Select Member */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <User size={18} className="text-emerald-600" /> 1. Chọn Hội Viên Mua Gói
            </h2>

            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedCustomer.full_name}</p>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 font-mono">SĐT: {selectedCustomer.phone} | Mã: {selectedCustomer.customer_code}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  Thay đổi
                </button>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm theo SĐT, Mã hội viên, hoặc Họ tên..."
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                  <MagnifyingGlass size={16} className="absolute left-3 top-3 text-slate-400" />
                </div>

                {search.trim().length >= 2 && (
                  <div className="mt-2 max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                    {searching ? (
                      <div className="p-3 text-center text-xs text-slate-500">Đang tìm kiếm...</div>
                    ) : customerData?.items?.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500">Không tìm thấy hội viên.</div>
                    ) : (
                      customerData?.items?.map((c: any) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setSearch('');
                          }}
                          className="flex items-center justify-between p-3 hover:bg-emerald-50/50 cursor-pointer dark:hover:bg-zinc-800"
                        >
                          <div>
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{c.full_name}</span>
                            <span className="text-[11px] text-slate-400 font-mono ml-2">({c.phone})</span>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-600">Chọn →</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Select Package */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Package size={18} className="text-emerald-600" /> 2. Chọn Loại & Gói Tập Dịch Vụ
              </h2>

              {/* Category Switcher Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setPackageCategory('MEMBERSHIP');
                    setSelectedPackage(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    packageCategory === 'MEMBERSHIP'
                      ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-zinc-300'
                  }`}
                >
                  <Ticket size={14} className="text-emerald-600" /> Gói Hội Viên
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPackageCategory('PT');
                    setSelectedPackage(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    packageCategory === 'PT'
                      ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-zinc-300'
                  }`}
                >
                  <Barbell size={14} className="text-amber-500" /> Gói Tập PT
                </button>
              </div>
            </div>

            {/* TAB 1: MEMBERSHIP PACKAGES */}
            {packageCategory === 'MEMBERSHIP' && (
              <div>
                {loadingPackages ? (
                  <div className="py-6 text-center text-xs text-slate-500">Đang tải danh mục gói hội viên...</div>
                ) : packages.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">Chưa có gói hội viên nào được gán cho chi nhánh.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {packages.map((pkg: any) => {
                      const isSelected = selectedPackage?.id === pkg.id;
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => setSelectedPackage(pkg)}
                          className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                              : 'border-slate-200 hover:border-slate-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <h3 className="font-bold text-xs text-slate-900 dark:text-white">{pkg.name}</h3>
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                                {pkg.durationValue} {pkg.durationUnit}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">
                              {pkg.description || 'Gói tập chất lượng cao đầy đủ quyền lợi'}
                            </p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                            <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pkg.basePrice)}
                            </span>
                            {isSelected && <CheckCircle size={18} className="text-emerald-600" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PT PACKAGES */}
            {packageCategory === 'PT' && (
              <div>
                {loadingPtPackages ? (
                  <div className="py-6 text-center text-xs text-slate-500">Đang tải danh mục gói tập PT...</div>
                ) : ptPackages.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Chưa có gói tập PT nào được phê duyệt mở bán tại chi nhánh.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ptPackages.map((plan: any) => {
                      const isSelected = selectedPackage?.id === plan.id;
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPackage(plan)}
                          className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 ring-2 ring-amber-500/20'
                              : 'border-slate-200 hover:border-slate-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <h3 className="font-bold text-xs text-slate-900 dark:text-white">{plan.name}</h3>
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded shrink-0">
                                {plan.sessionCount} buổi
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                              PT: {plan.ptUser?.fullName || 'PT Coach'}
                            </p>
                            {plan.description && (
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">
                                {plan.description}
                              </p>
                            )}
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                            <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(plan.price))}
                            </span>
                            {isSelected && <CheckCircle size={18} className="text-amber-600" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Date & Options */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Calendar size={18} className="text-emerald-600" /> 3. Ngày Kích Hoạt Đơn Hàng
            </h2>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>
        </div>

        {/* Right Column: Checkout Summary & VietQR Dynamic Panel */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="font-bold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkle size={20} className="text-emerald-600" /> Chi Tiết Thanh Toán & Đơn Hàng
            </h2>

            {!selectedCustomer || !selectedPackage ? (
              <div className="py-16 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                Vui lòng chọn <strong>Hội viên</strong> và <strong>Gói tập</strong> để khởi tạo đơn bán hàng.
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Summary Table */}
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-zinc-800/50 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Khách hàng:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedCustomer.full_name}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Loại gói:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {packageCategory === 'MEMBERSHIP' ? 'Gói Tập Hội Viên' : 'Gói Huấn Luyện PT'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Gói đăng ký:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedPackage.name}</span>
                  </div>

                  {packageCategory === 'MEMBERSHIP' ? (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Thời hạn:</span>
                      <span>{selectedPackage.durationValue} {selectedPackage.durationUnit}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Số buổi tập:</span>
                        <span className="font-bold text-amber-600">{selectedPackage.sessionCount} buổi ({selectedPackage.sessionDurationMinutes || 60}p/buổi)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">PT Phụ trách:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedPackage.ptUser?.fullName || 'PT Coach'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Hạn sử dụng:</span>
                        <span>{selectedPackage.validityDays || 60} ngày</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between border-t border-slate-200 pt-2 dark:border-zinc-700">
                    <span className="font-bold text-slate-700 dark:text-zinc-200">Tổng thanh toán:</span>
                    <span className="font-mono text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(packagePrice)}
                    </span>
                  </div>
                </div>

                {/* Warning Banner if Customer has no active Membership */}
                {packageCategory === 'PT' && !(selectedCustomer?.memberships && selectedCustomer.memberships.length > 0) && (
                  <div className="rounded-xl bg-amber-50 border border-amber-300 p-3.5 text-xs text-amber-800 dark:bg-amber-950/60 dark:border-amber-900/60 dark:text-amber-300 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <ShieldWarning size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-xs text-amber-900 dark:text-amber-200">
                          ⚠️ Nhắc Nhở Quy Định: Khách hàng chưa đăng ký Gói Tập Ngày!
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed">
                          Theo quy định phòng tập, hội viên <strong>bắt buộc phải có Gói Tập Ngày (Membership) đang hoạt động</strong> mới được phép đăng ký Gói Huấn Luyện PT.
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Vui lòng đăng ký Gói Tập Ngày trước</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPackageCategory('MEMBERSHIP');
                          setSelectedPackage(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition cursor-pointer shrink-0"
                      >
                        + Chuyển sang Gói Tập Ngày
                      </button>
                    </div>
                  </div>
                )}

                {/* Payment Method Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-900 dark:text-white mb-2 block">
                    Phương Thức Thanh Toán
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('VIETQR')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition ${
                        paymentMethod === 'VIETQR'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'border-slate-200 text-slate-600 dark:border-zinc-800'
                      }`}
                    >
                      <QrCode size={18} /> Mã VietQR
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition ${
                        paymentMethod === 'CASH'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'border-slate-200 text-slate-600 dark:border-zinc-800'
                      }`}
                    >
                      <Money size={18} /> Tiền Mặt
                    </button>
                  </div>
                </div>

                {paymentMethod === 'VIETQR' && (
                  <p className="text-[11px] text-slate-500 text-center">
                    Mã QR thật (theo tài khoản Owner đã cấu hình) sẽ hiện ra ở bước tiếp theo — hệ thống tự xác nhận qua SePay, không cần bấm xác nhận tay.
                  </p>
                )}

                {/* Action Submit */}
                <Button
                  onClick={() => {
                    const hasActiveMembership = Boolean(selectedCustomer?.memberships && selectedCustomer.memberships.length > 0);
                    if (packageCategory === 'PT' && !hasActiveMembership) {
                      showToast('Khách hàng chưa đăng ký gói tập ngày. Bắt buộc phải có gói tập ngày mới được phép đăng ký PT.', 'warning');
                      return;
                    }
                    sellMutation.mutate();
                  }}
                  disabled={sellMutation.isPending || (packageCategory === 'PT' && !(selectedCustomer?.memberships && selectedCustomer.memberships.length > 0))}
                  className="w-full py-3 text-sm font-bold gap-2"
                >
                  <CheckCircle size={18} />
                  {sellMutation.isPending
                    ? 'Đang xử lý...'
                    : paymentMethod === 'VIETQR'
                      ? 'Tạo Mã QR & Chờ Thanh Toán'
                      : 'Xác Nhận Thu Tiền Mặt & Kích Hoạt Gói'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {pendingQr && (
        <PendingQrPaymentModal
          open
          paymentId={pendingQr.paymentId}
          qrUrl={pendingQr.qrUrl}
          amount={pendingQr.amount}
          expiresAt={pendingQr.expiresAt}
          onConfirmed={() => {
            const typeText = packageCategory === 'MEMBERSHIP' ? 'hội viên' : 'huấn luyện PT';
            setPendingQr(null);
            setSuccessMsg(`Đã nhận thanh toán qua SePay! Gói ${typeText} ${selectedPackage?.name} đã được kích hoạt cho ${selectedCustomer?.full_name}.`);
            clearSelection();
            queryClient.invalidateQueries({ queryKey: ['staff-dashboard-overview'] });
            queryClient.invalidateQueries({ queryKey: ['manager-pt-package-plans'] });
          }}
          onCancelled={() => setPendingQr(null)}
        />
      )}
    </div>
  );
}
