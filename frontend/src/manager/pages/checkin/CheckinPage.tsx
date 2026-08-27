import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QrCode, SignOut, ArrowCounterClockwise, MagnifyingGlass, Check, Scan } from '@phosphor-icons/react';
import { getCurrentlyInGym, getManagerCustomers, manualCheckin, manualCheckout, qrScanCheckin, undoCheckin } from '../../api/manager';
import { apiErrorMessage } from '../../../owner/api/client';
import Card from '../../../owner/components/Card';
import Button from '../../../owner/components/Button';
import FormField, { inputClass } from '../../../owner/components/FormField';
import Modal from '../../../owner/components/Modal';
import { Skeleton } from '../../../owner/components/Skeleton';

export default function ManagerCheckinPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [undoModalOpen, setUndoModalOpen] = useState(false);
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<string | null>(null);
  const [undoReason, setUndoReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Queries
  const { data: currentlyInGym, isLoading: isGymLoading } = useQuery({
    queryKey: ['manager-currently-in-gym'],
    queryFn: () => getCurrentlyInGym(),
    refetchInterval: 10000,
  });

  const { data: customerRes } = useQuery({
    queryKey: ['manager-customers-search', search],
    queryFn: () => getManagerCustomers(search),
    enabled: search.trim().length >= 2,
  });
  const customers = customerRes?.items || [];

  // Mutations
  const checkinMutation = useMutation({
    mutationFn: (customerId: string) => manualCheckin(customerId),
    onSuccess: () => {
      setActionSuccess('Check-in thành công!');
      setActionError(null);
      setSearch('');
      queryClient.invalidateQueries({ queryKey: ['manager-currently-in-gym'] });
      queryClient.invalidateQueries({ queryKey: ['manager-dashboard-overview'] });
      setTimeout(() => setActionSuccess(null), 3000);
    },
    onError: (err) => setActionError(apiErrorMessage(err, 'Không thể thực hiện Check-in')),
  });

  const checkoutMutation = useMutation({
    mutationFn: (attendanceId: string) => manualCheckout(attendanceId),
    onSuccess: () => {
      setActionSuccess('Check-out thành công!');
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['manager-currently-in-gym'] });
      queryClient.invalidateQueries({ queryKey: ['manager-dashboard-overview'] });
      setTimeout(() => setActionSuccess(null), 3000);
    },
    onError: (err) => setActionError(apiErrorMessage(err, 'Không thể thực hiện Check-out')),
  });

  const qrScanMutation = useMutation({
    mutationFn: (token: string) => qrScanCheckin(token),
    onSuccess: (data) => {
      setActionSuccess(
        data.action === 'CHECKED_IN'
          ? `Đã Check-in cho ${data.customer.full_name} qua mã QR!`
          : `Đã Check-out cho ${data.customer.full_name} qua mã QR!`,
      );
      setActionError(null);
      setQrInput('');
      queryClient.invalidateQueries({ queryKey: ['manager-currently-in-gym'] });
      queryClient.invalidateQueries({ queryKey: ['manager-dashboard-overview'] });
      setTimeout(() => setActionSuccess(null), 3000);
    },
    onError: (err) => setActionError(apiErrorMessage(err, 'Mã QR không hợp lệ hoặc đã hết hạn')),
  });

  function handleQrSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!qrInput.trim() || qrScanMutation.isPending) return;
    qrScanMutation.mutate(qrInput.trim());
  }

  const undoMutation = useMutation({
    mutationFn: () => undoCheckin(selectedAttendanceId!, undoReason),
    onSuccess: () => {
      setUndoModalOpen(false);
      setUndoReason('');
      setSelectedAttendanceId(null);
      setActionSuccess('Đã hoàn tác lượt Check-in!');
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['manager-currently-in-gym'] });
      queryClient.invalidateQueries({ queryKey: ['manager-dashboard-overview'] });
      setTimeout(() => setActionSuccess(null), 3000);
    },
    onError: (err) => setActionError(apiErrorMessage(err, 'Không thể hoàn tác Check-in')),
  });

  function handleOpenUndo(id: string) {
    setSelectedAttendanceId(id);
    setUndoReason('');
    setUndoModalOpen(true);
  }

  function handleUndoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!undoReason.trim()) return;
    undoMutation.mutate();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Vận hành Check-in quầy</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Thực hiện Check-in / Check-out thủ công, theo dõi danh sách khách đang có mặt tại chi nhánh
        </p>
      </div>

      {actionError && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-2">
          <Check size={18} /> {actionSuccess}
        </div>
      )}

      {/* DYNAMIC QR SCAN — consumes the customer's Customer Portal QR (auto-rotates ~45s) */}
      <Card className="max-w-2xl border-emerald-200/70 dark:border-emerald-900/40">
        <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50 mb-3 flex items-center gap-2">
          <Scan size={20} className="text-emerald-600 dark:text-emerald-400" /> Quét mã QR hội viên
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          Quét (hoặc dán) mã QR động từ ứng dụng của hội viên — hệ thống tự động Check-in nếu đang ở ngoài, Check-out nếu đang ở trong phòng tập.
        </p>
        <form onSubmit={handleQrSubmit} className="flex gap-2">
          <input
            type="text"
            autoFocus
            className={inputClass}
            placeholder="Quét mã QR hoặc dán mã tại đây..."
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
          />
          <Button type="submit" disabled={qrScanMutation.isPending || !qrInput.trim()}>
            {qrScanMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </form>
      </Card>

      {/* CHECK-IN SEARCH & QUICK DESK */}
      <Card className="max-w-2xl">
        <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50 mb-3 flex items-center gap-2">
          <QrCode size={20} className="text-emerald-600 dark:text-emerald-400" /> Tìm kiếm hội viên để Check-in
        </h2>

        <div className="relative">
          <MagnifyingGlass size={18} className="absolute left-3.5 top-3 text-zinc-400" />
          <input
            type="text"
            className={`${inputClass} pl-10`}
            placeholder="Nhập tên hội viên, số điện thoại hoặc mã QR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {search.trim().length >= 2 && (
          <div className="mt-3 flex flex-col gap-2 max-h-60 overflow-y-auto border-t border-stone-100 pt-3 dark:border-zinc-800">
            {customers && customers.length > 0 ? (
              customers.map((c) => (
                <div
                  key={c.id}
                  className="flex justify-between items-center rounded-xl bg-stone-50 p-3 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-800"
                >
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{c.full_name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">SĐT: {c.phone || 'N/A'} • Mã: {c.customer_code}</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={checkinMutation.isPending}
                    onClick={() => checkinMutation.mutate(c.id)}
                  >
                    Check-in
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center py-4 text-xs text-zinc-400">Không tìm thấy hội viên phù hợp.</p>
            )}
          </div>
        )}
      </Card>

      {/* CURRENTLY IN GYM LIST */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
            Đang ở phòng tập ngay lúc này ({currentlyInGym?.length || 0} khách)
          </h2>
          <span className="text-xs text-zinc-400">Tự động cập nhật mỗi 10 giây</span>
        </div>

        {isGymLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentlyInGym && currentlyInGym.length > 0 ? (
              currentlyInGym.map((item) => (
                <Card key={item.id} className="relative flex flex-col justify-between border border-stone-200 dark:border-zinc-800">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {item.attendanceType}
                        </span>
                        <h3 className="font-display text-sm font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                          {item.customer.full_name}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">SĐT: {item.customer.phone || 'Chưa có SĐT'}</p>
                      </div>
                      <span className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                        {new Date(item.checkInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                      Phương thức: <span className="font-medium text-zinc-800 dark:text-zinc-200">{item.checkInMethod}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 dark:border-zinc-800 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => handleOpenUndo(item.id)}
                      className="text-xs text-amber-700 hover:underline dark:text-amber-400 flex items-center gap-1 font-medium"
                    >
                      <ArrowCounterClockwise size={14} /> Hoàn tác
                    </button>

                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={checkoutMutation.isPending}
                      onClick={() => checkoutMutation.mutate(item.id)}
                      className="gap-1"
                    >
                      <SignOut size={14} /> Check-out
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-sm text-zinc-400 border border-dashed border-stone-300 dark:border-zinc-800 rounded-2xl">
                Hiện tại chưa có khách nào trong phòng tập.
              </div>
            )}
          </div>
        )}
      </div>

      {/* UNDO CHECKIN MODAL */}
      <Modal open={undoModalOpen} onClose={() => setUndoModalOpen(false)} title="Hoàn tác lượt Check-in">
        <form onSubmit={handleUndoSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Bạn đang yêu cầu hủy lượt Check-in này. Thao tác này sẽ ghi lại nhật ký Audit Log của chi nhánh.
          </p>

          <FormField label="Lý do hoàn tác *" htmlFor="undo-reason">
            <textarea
              id="undo-reason"
              required
              rows={3}
              className={inputClass}
              placeholder="Ví dụ: Staff quét nhầm mã QR, nhập sai thông tin..."
              value={undoReason}
              onChange={(e) => setUndoReason(e.target.value)}
            />
          </FormField>

          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setUndoModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={undoMutation.isPending}>
              Xác nhận hoàn tác
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
