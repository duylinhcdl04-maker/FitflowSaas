import { useState } from 'react';
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
} from '@phosphor-icons/react';
import {
  getManagerCustomers,
  manualCheckin,
  manualCheckout,
  undoCheckin,
  getCurrentlyInGym,
} from '../../manager/api/manager';
import { apiErrorMessage } from '../../owner/api/client';
import Modal from '../../owner/components/Modal';
import FormField from '../../owner/components/FormField';
import Button from '../../owner/components/Button';
import Callout from '../../owner/components/Callout';
import { useRealtimeInvalidate } from '../../lib/useRealtimeInvalidate';

export default function StaffCheckinPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
    </div>
  );
}
