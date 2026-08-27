import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IdentificationCard,
  MagnifyingGlass,
  CheckCircle,
  WarningCircle,
  Clock,
  ArrowCounterClockwise,
  UserCheck,
  SignOut,
  XCircle,
  ShieldWarning,
  Scan,
  SignIn,
} from '@phosphor-icons/react';
import {
  getManagerCustomers,
  manualCheckin,
  manualCheckout,
  undoCheckin,
  getCurrentlyInGym,
  getBranchPackages,
  qrScanCheckin,
  type QrScanCustomer,
} from '../../manager/api/manager';
import { apiErrorMessage } from '../../owner/api/client';
import Modal from '../../owner/components/Modal';
import FormField, { inputClass } from '../../owner/components/FormField';
import Button from '../../owner/components/Button';
import Callout from '../../owner/components/Callout';
import MemberDetailModal from '../../manager/components/MemberDetailModal';
import QrCameraScanner from '../components/QrCameraScanner';
import { useRealtimeInvalidate } from '../../lib/useRealtimeInvalidate';

// Cổng quét QR động của khách hàng (Customer Portal) tự tắt sau chừng này giây —
// đủ để nhân viên liếc thấy ảnh + tên vừa quét mà không che khuất màn hình lâu.
const QR_TOAST_DURATION_MS = 5000;

export default function StaffCheckinPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- Dynamic QR scan gate ---
  const [qrInput, setQrInput] = useState('');
  const [qrToast, setQrToast] = useState<{ action: 'CHECKED_IN' | 'CHECKED_OUT'; customer: QrScanCustomer } | null>(null);
  const [qrDetailCustomer, setQrDetailCustomer] = useState<QrScanCustomer | null>(null);

  const { data: branchPackages = [] } = useQuery({
    queryKey: ['staff-branch-packages'],
    queryFn: getBranchPackages,
  });

  // Undo Checkin Modal State
  const [undoModalOpen, setUndoModalOpen] = useState(false);
  const [targetAttendance, setTargetAttendance] = useState<any | null>(null);
  const [undoReason, setUndoReason] = useState('');

  // Live search query for customers
  const { data: customerData, isLoading: searching } = useQuery({
    queryKey: ['staff-checkin-search', search],
    queryFn: () => getManagerCustomers(search),
    enabled: search.trim().length >= 2,
  });

  // Query currently in gym — realtime push (attendance:updated) is the primary update
  // path now; this interval is just a slow safety net.
  const { data: inGymList = [] } = useQuery({
    queryKey: ['staff-currently-in-gym'],
    queryFn: () => getCurrentlyInGym(),
    refetchInterval: 60000,
  });

  useRealtimeInvalidate('attendance:updated', [['staff-currently-in-gym']]);

  const qrScanMutation = useMutation({
    mutationFn: (token: string) => qrScanCheckin(token),
    onSuccess: (data) => {
      setQrToast(data);
      setQrInput('');
      queryClient.invalidateQueries({ queryKey: ['staff-currently-in-gym'] });
      queryClient.invalidateQueries({ queryKey: ['staff-dashboard-overview'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Mã QR không hợp lệ hoặc đã hết hạn')),
  });

  // Popup tự tắt sau QR_TOAST_DURATION_MS — đây là một timer bất đồng bộ (setTimeout),
  // không phải đồng bộ hoá state theo props/state khác, nên đúng cách dùng effect.
  useEffect(() => {
    if (!qrToast) return;
    const timer = setTimeout(() => setQrToast(null), QR_TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [qrToast]);

  function handleQrSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!qrInput.trim() || qrScanMutation.isPending) return;
    setError(null);
    qrScanMutation.mutate(qrInput.trim());
  }

  function handleCameraDecode(text: string) {
    setError(null);
    qrScanMutation.mutate(text);
  }

  const checkinMutation = useMutation({
    mutationFn: (customerId: string) => manualCheckin(customerId),
    onSuccess: () => {
      setSuccessMsg('Check-in thành công!');
      setError(null);
      setSelectedCustomer(null);
      setSearch('');
      queryClient.invalidateQueries({ queryKey: ['staff-currently-in-gym'] });
      queryClient.invalidateQueries({ queryKey: ['staff-dashboard-overview'] });
    },
    onError: (err) => {
      setError(apiErrorMessage(err, 'Check-in không thành công'));
      setSuccessMsg(null);
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (attendanceId: string) => manualCheckout(attendanceId),
    onSuccess: () => {
      setSuccessMsg('Đã Check-out thành công!');
      queryClient.invalidateQueries({ queryKey: ['staff-currently-in-gym'] });
    },
  });

  const undoMutation = useMutation({
    mutationFn: () => undoCheckin(targetAttendance.id, undoReason),
    onSuccess: () => {
      setSuccessMsg('Đã hoàn tác lượt Check-in thành công!');
      setUndoModalOpen(false);
      setTargetAttendance(null);
      setUndoReason('');
      queryClient.invalidateQueries({ queryKey: ['staff-currently-in-gym'] });
    },
    onError: (err) => {
      setError(apiErrorMessage(err, 'Không thể hủy lượt check-in'));
    },
  });

  function handleSelectCustomer(cust: any) {
    setSelectedCustomer(cust);
    setError(null);
    setSuccessMsg(null);
  }

  function handleCheckinClick(customerId: string) {
    setError(null);
    setSuccessMsg(null);
    checkinMutation.mutate(customerId);
  }

  function handleOpenUndoModal(item: any) {
    setTargetAttendance(item);
    setUndoReason('');
    setError(null);
    setUndoModalOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Title */}
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <IdentificationCard className="text-emerald-600 dark:text-emerald-400" size={28} />
          Bàn Tiếp Đón & Kiểm Soát Check-in
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Tra cứu thông tin hội viên, xác nhận lượt ra/vào và xử lý Hủy lượt check-in nhầm trong 15 phút (BR-STAFF-003).
        </p>
      </div>

      {/* Main Check-in Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Search & Checkin Panel */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          {/* Cổng quét QR động — quét/dán mã từ Customer Portal, tự Check-in/Check-out */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/10">
            <h2 className="font-bold text-slate-900 dark:text-white text-base mb-1 flex items-center gap-2">
              <Scan size={20} className="text-emerald-600 dark:text-emerald-400" /> Cổng Quét QR Hội Viên
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">
              Bật camera để tự động quét mã QR động từ app hội viên, hoặc dùng máy quét QR vật lý / dán mã thủ công bên dưới — tự động Check-in nếu đang ở ngoài, Check-out nếu đang ở trong phòng tập.
            </p>

            <QrCameraScanner onDecode={handleCameraDecode} />

            <div className="my-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <span className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" /> hoặc <span className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
            </div>

            <form onSubmit={handleQrSubmit} className="flex gap-2">
              <input
                type="text"
                className={inputClass}
                placeholder="Máy quét vật lý / dán mã tại đây..."
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
              />
              <Button type="submit" disabled={qrScanMutation.isPending || !qrInput.trim()}>
                {qrScanMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
              </Button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="font-bold text-slate-900 dark:text-white text-base mb-3 flex items-center gap-2">
              <MagnifyingGlass size={20} className="text-emerald-600" /> Tra Cứu & Quét Thẻ Hội Viên
            </h2>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nhập SĐT, Mã hội viên (HV-...), hoặc Họ tên..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
              />
              <MagnifyingGlass size={18} className="absolute left-3 top-3.5 text-slate-400" />
            </div>

            {/* Success or Error Callouts */}
            {successMsg && (
              <div className="mt-4">
                <Callout tone="success">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="shrink-0 text-emerald-600" />
                    <span>{successMsg}</span>
                  </div>
                </Callout>
              </div>
            )}

            {error && (
              <div className="mt-4">
                <Callout tone="danger">
                  <div className="flex items-center gap-2">
                    <WarningCircle size={18} className="shrink-0 text-red-600" />
                    <span>{error}</span>
                  </div>
                </Callout>
              </div>
            )}

            {/* Live Search Results */}
            {search.trim().length >= 2 && (
              <div className="mt-4 max-h-72 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                {searching ? (
                  <div className="p-4 text-center text-xs text-slate-500">Đang tìm kiếm...</div>
                ) : customerData?.items?.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">Không tìm thấy hội viên khớp từ khóa.</div>
                ) : (
                  customerData?.items?.map((cust: any) => {
                    const activePkg = cust.memberships?.[0];
                    const isInGym = cust.attendances?.length > 0;

                    return (
                      <div
                        key={cust.id}
                        onClick={() => handleSelectCustomer(cust)}
                        className={`flex items-center justify-between p-3.5 cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-zinc-800/60 transition ${
                          selectedCustomer?.id === cust.id ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-600' : ''
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">{cust.full_name}</span>
                            <span className="font-mono text-xs text-slate-400">({cust.customer_code})</span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{cust.phone || 'Không có SĐT'}</p>
                          {activePkg ? (
                            <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded">
                              {activePkg.package_name_snapshot} (HSD: {new Date(activePkg.end_date).toLocaleDateString('vi-VN')})
                            </span>
                          ) : (
                            <span className="inline-block mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded">
                              Chưa có / Hết hạn gói tập
                            </span>
                          )}
                        </div>

                        <div>
                          {isInGym ? (
                            <span className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              Đang ở phòng
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckinClick(cust.id);
                              }}
                              disabled={checkinMutation.isPending}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow"
                            >
                              Check-in
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Selected Customer Preview Card */}
          {selectedCustomer && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">Xác Nhận Check-in Cho Hội Viên</h3>
                <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-600">
                  <XCircle size={18} />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-base">
                  {selectedCustomer.full_name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-base">{selectedCustomer.full_name}</p>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 font-mono">SĐT: {selectedCustomer.phone} | Mã: {selectedCustomer.customer_code}</p>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setSelectedCustomer(null)}>Hủy</Button>
                <Button onClick={() => handleCheckinClick(selectedCustomer.id)} disabled={checkinMutation.isPending}>
                  Xác Nhận Check-in Trực Tiếp
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Currently In Gym & 15-Minute Undo Panel */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <UserCheck size={20} className="text-emerald-600" /> Danh Sách Check-in Gần Đây
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Hỗ trợ nút Undo Hủy lượt check-in thao tác nhầm trong vòng 15 phút (BR-STAFF-003)
                </p>
              </div>
              <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {inGymList.length} lượt
              </span>
            </div>

            {inGymList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 dark:text-zinc-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                Chưa có lượt check-in nào trong ca làm việc.
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                {inGymList.map((item: any) => {
                  const checkInTime = new Date(item.checkInAt);
                  const diffMinutes = Math.floor((Date.now() - checkInTime.getTime()) / (1000 * 60));
                  const canUndo = diffMinutes <= 15;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-zinc-800 dark:bg-zinc-800/40"
                    >
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{item.customerName}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                          <Clock size={13} />
                          <span className="font-mono">{checkInTime.toLocaleTimeString('vi-VN')}</span>
                          <span>•</span>
                          <span className="font-mono">({diffMinutes} phút trước)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {canUndo && (
                          <button
                            type="button"
                            onClick={() => handleOpenUndoModal(item)}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 transition"
                            title="Hủy lượt check-in do thao tác nhầm (trong vòng 15 phút)"
                          >
                            <ArrowCounterClockwise size={14} /> Undo Check-in
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => checkoutMutation.mutate(item.id)}
                          disabled={checkoutMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-300 dark:bg-zinc-700 dark:text-zinc-200 transition"
                        >
                          <SignOut size={14} /> Check-out
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Undo Check-in Modal */}
      {undoModalOpen && (
        <Modal
          open={undoModalOpen}
          onClose={() => setUndoModalOpen(false)}
          title="Hủy lượt Check-in do thao tác nhầm (BR-STAFF-003)"
        >
          <div className="flex flex-col gap-4">
            <Callout tone="warning">
              <div className="flex items-center gap-2 text-xs">
                <ShieldWarning size={18} className="shrink-0 text-amber-600" />
                <span>
                  Thao tác Undo không xóa dữ liệu mà cập nhật trạng thái CANCELLED và lưu vết nhân viên thực hiện.
                </span>
              </div>
            </Callout>

            <p className="text-xs text-slate-600 dark:text-zinc-300">
              Hội viên: <strong className="text-slate-900 dark:text-white">{targetAttendance?.customerName}</strong>
            </p>

            <FormField label="Lý do hủy lượt check-in *" htmlFor="undo-reason">
              <textarea
                id="undo-reason"
                rows={3}
                required
                value={undoReason}
                onChange={(e) => setUndoReason(e.target.value)}
                placeholder="Ví dụ: Quét nhầm mã hội viên, bấm nhầm nút..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </FormField>

            <div className="flex justify-end gap-2 mt-2">
              <Button variant="secondary" onClick={() => setUndoModalOpen(false)}>Hủy bỏ</Button>
              <Button
                onClick={() => undoMutation.mutate()}
                disabled={!undoReason.trim() || undoMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Xác Nhận Hủy Lượt
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* QR scan popup — ảnh + tên + hành động vừa quét, tự tắt sau 5s, bấm vào xem chi tiết */}
      {qrToast && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setQrDetailCustomer(qrToast.customer);
            setQrToast(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setQrDetailCustomer(qrToast.customer);
              setQrToast(null);
            }
          }}
          className="fixed right-4 top-20 z-[9998] w-80 cursor-pointer rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl shadow-emerald-950/10 transition hover:-translate-y-0.5 dark:border-emerald-900/50 dark:bg-zinc-900"
        >
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              {qrToast.customer.avatar_url ? (
                <img
                  src={qrToast.customer.avatar_url}
                  alt={qrToast.customer.full_name}
                  className="h-12 w-12 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-base font-bold text-white">
                  {qrToast.customer.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <span
                className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-white dark:border-zinc-900 ${
                  qrToast.action === 'CHECKED_IN' ? 'bg-emerald-600' : 'bg-slate-500'
                }`}
              >
                {qrToast.action === 'CHECKED_IN' ? <SignIn size={11} weight="bold" /> : <SignOut size={11} weight="bold" />}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{qrToast.customer.full_name}</p>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {qrToast.action === 'CHECKED_IN' ? 'Vừa Check-in qua QR' : 'Vừa Check-out qua QR'}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">Nhấn để xem chi tiết hội viên</p>
            </div>
          </div>
        </div>
      )}

      {/* Full detail — mở từ popup quét QR */}
      {qrDetailCustomer && (
        <MemberDetailModal
          isOpen={Boolean(qrDetailCustomer)}
          onClose={() => setQrDetailCustomer(null)}
          customer={qrDetailCustomer}
          branchPackages={branchPackages}
          isFaceIdEnabled={true}
        />
      )}
    </div>
  );
}
