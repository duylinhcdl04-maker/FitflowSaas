import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Ticket,
  UserPlus,
  PauseCircle,
  PlayCircle,
  CheckCircle,
  WarningCircle,
  QrCode,
  Money,
  SignOut,
  XCircle,
  Clock,
} from '@phosphor-icons/react';
import {
  getGuestVisits,
  createGuestVisit,
  toggleGuestHold,
  getBranchPackages,
} from '../../manager/api/manager';
import { apiErrorMessage } from '../../owner/api/client';
import Callout from '../../owner/components/Callout';
import Button from '../../owner/components/Button';
import FormField from '../../owner/components/FormField';
import Modal from '../../owner/components/Modal';
import PendingQrPaymentModal from '../../manager/components/PendingQrPaymentModal';
import { useRealtimeInvalidate } from '../../lib/useRealtimeInvalidate';

/** Mirrors guest_visits_status_check: PENDING_PAYMENT | ACTIVE | ON_HOLD | COMPLETED | CANCELLED | EXPIRED. */
function GuestVisitStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; icon: any; className: string }> = {
    ACTIVE: {
      label: 'CHECKED_IN (Đang tập)',
      icon: CheckCircle,
      className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    },
    ON_HOLD: {
      label: 'ON_HOLD (Tạm hoãn)',
      icon: PauseCircle,
      className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    },
    COMPLETED: {
      label: 'Đã rời phòng tập',
      icon: SignOut,
      className: 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300',
    },
    CANCELLED: {
      label: 'Đã huỷ',
      icon: XCircle,
      className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    },
    EXPIRED: {
      label: 'Đã hết hạn',
      icon: XCircle,
      className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    },
    PENDING_PAYMENT: {
      label: 'Chờ thanh toán',
      icon: Clock,
      className: 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300',
    },
  };
  const { label, icon: Icon, className } = config[status] || config.ACTIVE;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${className}`}>
      <Icon size={12} /> {label}
    </span>
  );
}

export default function StaffGuestVisitsPage() {
  const queryClient = useQueryClient();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [packageId, setPackageId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'VIETQR' | 'CASH'>('VIETQR');
  const [pendingQr, setPendingQr] = useState<{ paymentId: string; qrUrl: string; amount: number; expiresAt: string } | null>(null);

  const [holdReason, setHoldReason] = useState('');
  const [holdModalOpen, setHoldModalOpen] = useState(false);
  const [targetVisit, setTargetVisit] = useState<any | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Query guest visits list today — realtime push (guestvisit:updated) is the primary
  // update path now; this interval is just a slow safety net.
  const { data: guestVisits = [], isLoading } = useQuery({
    queryKey: ['staff-guest-visits'],
    queryFn: () => getGuestVisits(),
    refetchInterval: 60000,
  });

  useRealtimeInvalidate('guestvisit:updated', [['staff-guest-visits'], ['staff-currently-in-gym']]);
  useRealtimeInvalidate('payment:confirmed', [['staff-guest-visits'], ['staff-currently-in-gym'], ['staff-dashboard-overview']]);

  // Query packages (1 session or daily pass)
  const { data: packages = [] } = useQuery({
    queryKey: ['staff-branch-packages'],
    queryFn: () => getBranchPackages(),
  });

  function resetCreateForm() {
    setCreateModalOpen(false);
    setFullName('');
    setPhone('');
    setPackageId('');
    setPaymentMethod('VIETQR');
  }

  const createMutation = useMutation({
    mutationFn: () => createGuestVisit(fullName, phone, packageId, paymentMethod),
    onSuccess: (res: any) => {
      setError(null);
      if (res?.requiresPayment) {
        // VietQR sale: wait for the SePay webhook to confirm — don't close the create
        // modal's parent state yet, just swap it for the QR-wait modal.
        setCreateModalOpen(false);
        setPendingQr({ paymentId: res.paymentId, qrUrl: res.qrUrl, amount: res.amount, expiresAt: res.expiresAt });
        return;
      }
      setSuccessMsg(`Đã tiếp đón vé lượt thành công! Hệ thống tự động kích hoạt Check-in tại phòng tập.`);
      resetCreateForm();
      queryClient.invalidateQueries({ queryKey: ['staff-guest-visits'] });
      queryClient.invalidateQueries({ queryKey: ['staff-currently-in-gym'] });
      queryClient.invalidateQueries({ queryKey: ['staff-dashboard-overview'] });
    },
    onError: (err) => {
      setError(apiErrorMessage(err, 'Không thể tạo vé lượt'));
    },
  });

  const toggleHoldMutation = useMutation({
    mutationFn: (reason?: string) => toggleGuestHold(targetVisit.id, reason),
    onSuccess: (data: any) => {
      setSuccessMsg(data.message);
      setHoldModalOpen(false);
      setTargetVisit(null);
      setHoldReason('');
      queryClient.invalidateQueries({ queryKey: ['staff-guest-visits'] });
      queryClient.invalidateQueries({ queryKey: ['staff-currently-in-gym'] });
      queryClient.invalidateQueries({ queryKey: ['staff-dashboard-overview'] });
    },
    onError: (err) => {
      setError(apiErrorMessage(err, 'Không thể thay đổi trạng thái vé lượt'));
    },
  });

  function handleOpenHoldModal(visit: any) {
    setTargetVisit(visit);
    if (visit.status === 'ON_HOLD') {
      // Resume directly
      toggleHoldMutation.mutate(undefined);
    } else {
      // Open modal to enter reason for hold
      setHoldReason('');
      setHoldModalOpen(true);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Ticket className="text-amber-600 dark:text-amber-400" size={28} />
            Quản Lý Khách Vãng Lai & Vé Lượt
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Bán vé lẻ 1 buổi, tự động kích hoạt Check-in và quản lý trạng thái Tạm hoãn (On-Hold).
          </p>
        </div>

        <Button onClick={() => setCreateModalOpen(true)} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
          <UserPlus size={18} /> Tiếp Đón Khách Vãng Lai Mới
        </Button>
      </div>

      {successMsg && (
        <Callout tone="success">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        </Callout>
      )}

      {error && (
        <Callout tone="danger">
          <div className="flex items-center gap-2">
            <WarningCircle size={18} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        </Callout>
      )}

      {/* Guest Visits Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-bold text-base text-slate-900 dark:text-white mb-4">
          Danh Sách Khách Vãng Lai Hôm Nay ({guestVisits.length})
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Đang tải danh sách khách vãng lai...</div>
        ) : guestVisits.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
            Chưa có khách vãng lai nào trong ngày hôm nay.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 dark:border-zinc-800">
                  <th className="py-3 px-3 font-semibold">Khách vãng lai</th>
                  <th className="py-3 px-3 font-semibold">Số điện thoại</th>
                  <th className="py-3 px-3 font-semibold">Gói vé lượt</th>
                  <th className="py-3 px-3 font-semibold">Giá vé</th>
                  <th className="py-3 px-3 font-semibold">Trạng thái</th>
                  <th className="py-3 px-3 font-semibold">Thời gian</th>
                  <th className="py-3 px-3 text-right font-semibold">Thao tác On-Hold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {guestVisits.map((visit: any) => {
                  const isHold = visit.status === 'ON_HOLD';
                  // Only ACTIVE/ON_HOLD visits can still be toggled — a visit whose attendance
                  // already checked out (COMPLETED) or was undone (CANCELLED) is done, not pausable.
                  const canToggleHold = visit.status === 'ACTIVE' || visit.status === 'ON_HOLD';
                  return (
                    <tr key={visit.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {visit.customerName}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-zinc-300">
                        {visit.customerPhone}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700 dark:text-zinc-300">
                        {visit.packageName}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(visit.price)}
                      </td>
                      <td className="py-3 px-3">
                        <GuestVisitStatusBadge status={visit.status} />
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(visit.createdAt).toLocaleTimeString('vi-VN')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {canToggleHold ? (
                          <button
                            type="button"
                            onClick={() => handleOpenHoldModal(visit)}
                            disabled={toggleHoldMutation.isPending}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                              isHold
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {isHold ? (
                              <>
                                <PlayCircle size={14} /> Resume (Tập lại)
                              </>
                            ) : (
                              <>
                                <PauseCircle size={14} /> Tạm dừng (On-Hold)
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Create Guest Visit */}
      {createModalOpen && (
        <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Tiếp Đón Khách Vãng Lai (Vé 1 Buổi)">
          <div className="flex flex-col gap-4">
            <FormField label="Họ và tên khách *" htmlFor="guest-name">
              <input
                id="guest-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ tên khách vãng lai"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </FormField>

            <FormField label="Số điện thoại *" htmlFor="guest-phone">
              <input
                id="guest-phone"
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </FormField>

            <FormField label="Chọn Gói Vé Lượt *" htmlFor="guest-pkg">
              <select
                id="guest-pkg"
                required
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value="">-- Chọn gói vé lượt --</option>
                {packages.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.basePrice)}
                  </option>
                ))}
              </select>
            </FormField>

            <div>
              <label className="text-xs font-bold text-slate-900 dark:text-white mb-2 block">
                Hình Thức Thanh Toán
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('VIETQR')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition ${
                    paymentMethod === 'VIETQR'
                      ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
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
                      ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'border-slate-200 text-slate-600 dark:border-zinc-800'
                  }`}
                >
                  <Money size={18} /> Tiền Mặt
                </button>
              </div>
              {paymentMethod === 'VIETQR' && (
                <p className="text-[11px] text-slate-500 text-center mt-2">
                  Mã QR thật (theo tài khoản Owner đã cấu hình) sẽ hiện ra ở bước tiếp theo — hệ thống tự xác nhận qua SePay, không cần bấm xác nhận tay.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>Hủy</Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!fullName || !phone || !packageId || createMutation.isPending}
              >
                {createMutation.isPending
                  ? 'Đang xử lý...'
                  : paymentMethod === 'VIETQR'
                    ? 'Tạo Mã QR & Chờ Thanh Toán'
                    : 'Xác Nhận Thu Tiền Mặt & Auto Check-in'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Hold Reason */}
      {holdModalOpen && (
        <Modal open={holdModalOpen} onClose={() => setHoldModalOpen(false)} title="Chuyển Trạng Thái Vé Lượt Sang ON_HOLD">
          <div className="flex flex-col gap-4">
            <p className="text-xs text-slate-600 dark:text-zinc-300">
              Khách vãng lai: <strong className="text-slate-900 dark:text-white">{targetVisit?.customerName}</strong>
            </p>

            <FormField label="Lý do tạm dừng (On-Hold)" htmlFor="hold-reason">
              <input
                id="hold-reason"
                type="text"
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                placeholder="Khách có việc đột xuất quay lại sau..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </FormField>

            <div className="flex justify-end gap-2 mt-2">
              <Button variant="secondary" onClick={() => setHoldModalOpen(false)}>Hủy</Button>
              <Button
                onClick={() => toggleHoldMutation.mutate(holdReason)}
                disabled={toggleHoldMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Xác Nhận Tạm Dừng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* VietQR: waiting for the SePay webhook to confirm — auto-closes on `payment:confirmed` */}
      {pendingQr && (
        <PendingQrPaymentModal
          open
          paymentId={pendingQr.paymentId}
          qrUrl={pendingQr.qrUrl}
          amount={pendingQr.amount}
          expiresAt={pendingQr.expiresAt}
          onConfirmed={() => {
            setPendingQr(null);
            resetCreateForm();
            setSuccessMsg('Đã nhận thanh toán qua SePay! Hệ thống tự động kích hoạt Check-in tại phòng tập.');
            queryClient.invalidateQueries({ queryKey: ['staff-guest-visits'] });
            queryClient.invalidateQueries({ queryKey: ['staff-currently-in-gym'] });
            queryClient.invalidateQueries({ queryKey: ['staff-dashboard-overview'] });
          }}
          onCancelled={() => {
            setPendingQr(null);
            resetCreateForm();
          }}
        />
      )}
    </div>
  );
}
