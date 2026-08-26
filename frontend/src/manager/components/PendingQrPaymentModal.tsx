import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QrCode, XCircle } from '@phosphor-icons/react';
import { getPaymentStatus, cancelPendingPayment } from '../api/manager';
import { useRealtimeEvent } from '../../lib/useRealtimeInvalidate';
import Modal from '../../owner/components/Modal';
import Button from '../../owner/components/Button';

interface PendingQrPaymentModalProps {
  open: boolean;
  paymentId: string;
  qrUrl: string;
  amount: number;
  expiresAt: string;
  /** Called once the payment is confirmed PAID (via socket push or the polling fallback). */
  onConfirmed: () => void;
  /** Called when the staff cancels, or the QR expires. */
  onCancelled: () => void;
}

/**
 * "Đang chờ thanh toán" modal for a real dynamic VietQR sale. Payment confirmation is
 * fully automatic via the SePay webhook — there is deliberately no manual "mark as
 * paid" button here. `payment:confirmed` (pushed over the realtime socket) is the
 * primary signal; polling `GET /manager/payments/:id/status` every 5s is the fallback
 * in case the socket connection dropped.
 */
export default function PendingQrPaymentModal({
  open,
  paymentId,
  qrUrl,
  amount,
  expiresAt,
  onConfirmed,
  onCancelled,
}: PendingQrPaymentModalProps) {
  const queryClient = useQueryClient();
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)));

  useRealtimeEvent<{ paymentId: string }>('payment:confirmed', (payload) => {
    if (payload.paymentId === paymentId) onConfirmed();
  });

  const { data: statusData } = useQuery({
    queryKey: ['payment-status', paymentId],
    queryFn: () => getPaymentStatus(paymentId),
    enabled: open,
    refetchInterval: 5000, // safety net if the socket connection dropped
  });

  useEffect(() => {
    if (statusData?.status === 'PAID') onConfirmed();
  }, [statusData?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [open, expiresAt]);

  const cancelMutation = useMutation({
    mutationFn: () => cancelPendingPayment(paymentId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['payment-status', paymentId] });
      onCancelled();
    },
  });

  const expired = secondsLeft <= 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <Modal open={open} onClose={() => cancelMutation.mutate()} title="Đang chờ thanh toán">
      <div className="flex flex-col items-center gap-4 text-center">
        <img src={qrUrl} alt="VietQR" className="w-56 h-56 rounded-xl border bg-white p-1 shadow-md" />

        <div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Số tiền cần thanh toán</p>
          <p className="font-display text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}
          </p>
        </div>

        {!expired ? (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
            <QrCode size={16} className="animate-pulse text-emerald-600 dark:text-emerald-400" />
            Đang chờ khách quét & chuyển khoản… hết hạn sau {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400">
            <XCircle size={16} /> Mã QR đã hết hạn. Vui lòng huỷ và thử lại.
          </div>
        )}

        <p className="text-[11px] text-slate-400">
          Hệ thống sẽ tự động xác nhận ngay khi SePay báo tiền đã về — không cần bấm xác nhận thủ công.
        </p>

        <Button variant="secondary" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending} className="mt-2">
          Hủy giao dịch
        </Button>
      </div>
    </Modal>
  );
}
