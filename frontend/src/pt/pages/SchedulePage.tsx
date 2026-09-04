import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  PlusCircle,
  Clock,
  User,
  UserCheck,
  WarningCircle,
  CalendarPlus,
  ListNumbers,
  CalendarBlank,
} from '@phosphor-icons/react';
import {
  getPtSchedule,
  confirmPtBooking,
  rejectPtBooking,
  completePtSession,
  markPtNoShow,
  createBookingByPt,
  getPtClients,
  type PtBooking,
} from '../api/pt';
import { showToast } from '../../owner/utils/swal';
import TimeSelect from '../../customer/components/TimeSelect';
import DatePickerCustom from '../../customer/components/DatePickerCustom';

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function PtSchedulePage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'LIST' | 'WEEK'>('LIST');

  // Modals state
  const [confirmModal, setConfirmModal] = useState<PtBooking | null>(null);
  const [rejectModal, setRejectModal] = useState<PtBooking | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [completeModal, setCompleteModal] = useState<PtBooking | null>(null);
  const [sessionNote, setSessionNote] = useState('');

  const [noShowModal, setNoShowModal] = useState<PtBooking | null>(null);
  const [noShowReason, setNoShowReason] = useState('');

  // Create booking for client modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [bookingDateObj, setBookingDateObj] = useState<Date>(() => new Date());
  const bookingDate = toDateInputValue(bookingDateObj);
  const [startTimeStr, setStartTimeStr] = useState('09:00');
  const [endTimeStr, setEndTimeStr] = useState('10:00');
  const [createNote, setCreateNote] = useState('');

  const { data: scheduleList, isLoading, isError } = useQuery({
    queryKey: ['pt-schedule'],
    queryFn: () => getPtSchedule(),
  });

  const { data: clientsList } = useQuery({
    queryKey: ['pt-assigned-clients'],
    queryFn: () => getPtClients(),
    enabled: isCreateModalOpen,
  });

  // Selected client's active package item
  const selectedClientItem = (clientsList || []).find((c) => c.packageId === selectedPackageId);

  const confirmMutation = useMutation({
    mutationFn: (id: string) => confirmPtBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['pt-overview'] });
      showToast('Đã xác nhận lịch hẹn của học viên!', 'success');
      setConfirmModal(null);
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Có lỗi xảy ra khi xác nhận', 'error');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectPtBooking(rejectModal!.id, rejectReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['pt-overview'] });
      showToast('Đã từ chối lịch hẹn', 'info');
      setRejectModal(null);
      setRejectReason('');
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Có lỗi xảy ra khi từ chối', 'error');
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => completePtSession(completeModal!.id, sessionNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['pt-overview'] });
      queryClient.invalidateQueries({ queryKey: ['pt-clients'] });
      showToast('Đã hoàn thành ca dạy và trừ 1 buổi của học viên!', 'success');
      setCompleteModal(null);
      setSessionNote('');
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Có lỗi xảy ra khi hoàn thành buổi dạy', 'error');
    },
  });

  const noShowMutation = useMutation({
    mutationFn: () => markPtNoShow(noShowModal!.id, noShowReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['pt-overview'] });
      showToast('Đã ghi nhận vắng mặt ca dạy', 'info');
      setNoShowModal(null);
      setNoShowReason('');
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Có lỗi khi đánh dấu vắng mặt', 'error');
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomerId || !selectedPackageId) {
        throw new Error('Vui lòng chọn học viên và gói tập');
      }
      if (!bookingDate || !startTimeStr || !endTimeStr) {
        throw new Error('Vui lòng nhập đầy đủ ngày và giờ tập');
      }
      const scheduledStart = new Date(`${bookingDate}T${startTimeStr}:00`).toISOString();
      const scheduledEnd = new Date(`${bookingDate}T${endTimeStr}:00`).toISOString();

      return createBookingByPt({
        customerId: selectedCustomerId,
        customerPtPackageId: selectedPackageId,
        scheduledStart,
        scheduledEnd,
        sessionNote: createNote,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['pt-overview'] });
      showToast('Đã tạo lịch tập mới cho học viên thành công!', 'success');
      setIsCreateModalOpen(false);
      setSelectedCustomerId('');
      setSelectedPackageId('');
      setCreateNote('');
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || err?.message || 'Không thể tạo lịch tập', 'error');
    },
  });

  const list = scheduleList || [];
  const pendingCount = list.filter((b) => b.status === 'PENDING').length;
  const scheduledCount = list.filter((b) => b.status === 'SCHEDULED' || b.status === 'CONFIRMED').length;
  const completedCount = list.filter((b) => b.status === 'COMPLETED').length;

  const filteredList = list.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Main Primary Action Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" /> Quản Lý Lịch Dạy PT
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            Thời khóa biểu cá nhân, tiếp nhận yêu cầu đặt lịch và chủ động xếp lịch cho học viên.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-emerald-700 transition active:scale-95"
        >
          <CalendarPlus className="h-4 w-4" />
          <span>+ Tạo Lịch Tập Cho Học Viên</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Tổng Số Ca Dạy</span>
            <Clock className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{list.length}</p>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Chờ Xác Nhận</span>
            <WarningCircle className="h-5 w-5 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-700 dark:text-amber-400">{pendingCount}</p>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Đã Sắp Lịch</span>
            <UserCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-400">{scheduledCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Đã Hoàn Thành</span>
            <CheckCircle className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{completedCount}</p>
        </div>
      </div>

      {/* Control Bar (Status Filter & View Modes) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3 dark:border-zinc-800">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold">
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'PENDING', label: `Chờ duyệt (${pendingCount})` },
            { key: 'SCHEDULED', label: 'Đã duyệt' },
            { key: 'COMPLETED', label: 'Hoàn thành' },
            { key: 'NO_SHOW', label: 'Vắng mặt' },
            { key: 'CANCELLED', label: 'Đã hủy' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === tab.key
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('LIST')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
              viewMode === 'LIST'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ListNumbers className="h-4 w-4" /> Danh Sách
          </button>
          <button
            type="button"
            onClick={() => setViewMode('WEEK')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
              viewMode === 'WEEK'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <CalendarBlank className="h-4 w-4" /> Lịch Tuần
          </button>
        </div>
      </div>

      {/* Main Schedule Content */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600 dark:border-zinc-800 dark:border-t-emerald-400" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          Không thể tải danh sách lịch dạy.
        </div>
      ) : filteredList.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 dark:border-zinc-800 dark:bg-zinc-900">
          <CalendarCheck className="mx-auto h-12 w-12 text-slate-300 dark:text-zinc-700" />
          <p className="mt-2 text-sm font-semibold">Không có ca dạy nào phù hợp với bộ lọc</p>
        </div>
      ) : viewMode === 'LIST' ? (
        <div className="space-y-3">
          {filteredList.map((item) => {
            const startTime = new Date(item.scheduled_start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const endTime = new Date(item.scheduled_end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const startDateFormatted = new Date(item.scheduled_start).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });

            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 hover:border-emerald-300 transition"
              >
                <div className="flex items-start gap-4">
                  {/* Time Badge */}
                  <div className="flex flex-col items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/60 dark:border-emerald-900/60 px-3.5 py-2.5 text-center min-w-[110px]">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-800 dark:text-emerald-300">{startDateFormatted}</span>
                    <span className="font-mono text-sm font-black text-emerald-700 dark:text-emerald-400">
                      {startTime} - {endTime}
                    </span>
                  </div>

                  {/* Client Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                        <User className="h-4 w-4 text-emerald-600" />
                        {item.customers.full_name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          item.status === 'COMPLETED'
                            ? 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                            : item.status === 'SCHEDULED' || item.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : item.status === 'NO_SHOW'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {item.status === 'COMPLETED'
                          ? 'HOÀN THÀNH'
                          : item.status === 'SCHEDULED' || item.status === 'CONFIRMED'
                          ? 'ĐÃ DUYỆT'
                          : item.status === 'PENDING'
                          ? 'CHỜ DUYỆT'
                          : item.status === 'NO_SHOW'
                          ? 'VẮNG MẶT'
                          : 'ĐÃ HỦY'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2">
                      <span>Gói: <strong>{item.customer_pt_packages?.plan_name_snapshot || 'PT Package'}</strong></span>
                      <span>•</span>
                      <span>SĐT: <strong>{item.customers.phone || 'Chưa có'}</strong></span>
                    </p>

                    {item.session_note && (
                      <p className="text-xs italic text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/60 p-2 rounded-lg mt-1 border border-slate-100 dark:border-zinc-800">
                        "{item.session_note}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions Button Group */}
                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                  {item.status === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setRejectModal(item)}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 transition"
                      >
                        <XCircle className="h-4 w-4" /> Từ Chối
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmModal(item)}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                      >
                        <CheckCircle className="h-4 w-4" /> Xác Nhận
                      </button>
                    </>
                  )}

                  {(item.status === 'SCHEDULED' || item.status === 'CONFIRMED') && (
                    <>
                      <button
                        type="button"
                        onClick={() => setNoShowModal(item)}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 transition"
                      >
                        <WarningCircle className="h-4 w-4" /> Báo Vắng Mặt
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompleteModal(item)}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                      >
                        <CheckCircle className="h-4 w-4" /> Hoàn Thành (Trừ Buổi)
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Week View Grid representation */
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => {
            const now = new Date();
            const day = new Date(now.setDate(now.getDate() - now.getDay() + 1 + i));
            const dayStr = day.toISOString().substring(0, 10);
            const dayLabel = day.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });

            const dayBookings = filteredList.filter((b) => b.scheduled_start.startsWith(dayStr));

            return (
              <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-2">
                <div className="border-b border-slate-100 pb-2 text-center dark:border-zinc-800">
                  <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400">{dayLabel}</span>
                </div>

                <div className="space-y-2 min-h-[120px]">
                  {dayBookings.length === 0 ? (
                    <div className="flex h-20 items-center justify-center text-[11px] font-medium text-slate-400">
                      Trống
                    </div>
                  ) : (
                    dayBookings.map((b) => (
                      <div
                        key={b.id}
                        className={`rounded-xl p-2 text-xs border ${
                          b.status === 'COMPLETED'
                            ? 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-zinc-800 dark:border-zinc-700'
                            : b.status === 'PENDING'
                            ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900'
                        }`}
                      >
                        <p className="font-extrabold truncate">{b.customers.full_name}</p>
                        <p className="font-mono text-[11px]">
                          {new Date(b.scheduled_start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Booking for Client */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="h-6 w-6 text-emerald-600" /> Xếp Lịch Tập Cho Học Viên
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Select Client & Package */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Chọn học viên & gói PT áp dụng (*):
                </label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => {
                    const pkgId = e.target.value;
                    setSelectedPackageId(pkgId);
                    const item = (clientsList || []).find((c) => c.packageId === pkgId);
                    if (item) {
                      setSelectedCustomerId(item.customer.id);
                    } else {
                      setSelectedCustomerId('');
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-medium text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Chọn học viên và gói PT --</option>
                  {(clientsList || []).map((item) => (
                    <option key={item.packageId} value={item.packageId}>
                      {item.customer.full_name} ({item.customer.phone || 'Chưa cập nhật SĐT'}) — {item.planName} (Còn {item.remainingSessions}/{item.totalSessions} buổi)
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time Range */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <DatePickerCustom
                  label="Ngày tập (*)"
                  selectedDate={bookingDateObj}
                  onChange={(d) => d && setBookingDateObj(d)}
                  minDate={new Date()}
                />

                <TimeSelect
                  label="Bắt đầu (*)"
                  value={startTimeStr}
                  onChange={(sVal) => {
                    setStartTimeStr(sVal);
                    if (sVal) {
                      const [hh, mm] = sVal.split(':').map(Number);
                      const endMins = hh * 60 + mm + 60;
                      const endH = Math.floor(endMins / 60) % 24;
                      const endM = endMins % 60;
                      setEndTimeStr(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
                    }
                  }}
                />

                <TimeSelect
                  label="Kết thúc (*)"
                  value={endTimeStr}
                  align="right"
                  onChange={(eVal) => setEndTimeStr(eVal)}
                />
              </div>

              {/* Note */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Ghi chú buổi tập:
                </label>
                <textarea
                  value={createNote}
                  onChange={(e) => setCreateNote(e.target.value)}
                  placeholder="Ví dụ: Tập mông đùi / Ngực vai..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 p-2 text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 dark:border-zinc-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={createBookingMutation.isPending}
                onClick={() => createBookingMutation.mutate()}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {createBookingMutation.isPending ? 'Đang tạo...' : 'Xác Nhận Tạo Lịch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Booking Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-emerald-600" /> Xác Nhận Đặt Lịch Hẹn
            </h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400">
              Bạn có chắc chắn muốn chấp nhận lịch hẹn huấn luyện với học viên <strong className="text-slate-900 dark:text-white">{confirmModal.customers.full_name}</strong> vào lúc{' '}
              <strong className="font-mono text-emerald-600">{new Date(confirmModal.scheduled_start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</strong>?
            </p>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 dark:border-zinc-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={confirmMutation.isPending}
                onClick={() => confirmMutation.mutate(confirmModal.id)}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {confirmMutation.isPending ? 'Đang duyệt...' : 'Xác Nhận Đặt Lịch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Booking Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <XCircle className="h-6 w-6 text-rose-600" /> Từ Chối Đặt Lịch Hẹn
            </h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400">
              Nhập lý do từ chối yêu cầu đặt lịch hẹn của học viên <strong className="text-slate-900 dark:text-white">{rejectModal.customers.full_name}</strong>:
            </p>

            <div className="mt-4">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: PT trùng ca dạy hoặc bận việc cá nhân..."
                rows={3}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 dark:border-zinc-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate()}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Đang lưu...' : 'Xác Nhận Từ Chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Session Modal */}
      {completeModal && (() => {
        const earlyWindowMs = 30 * 60 * 1000;
        const isTooEarly = new Date().getTime() < new Date(completeModal.scheduled_start).getTime() - earlyWindowMs;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-emerald-600" /> Xác Nhận Hoàn Thành Buổi Dạy
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400">
                Xác nhận bạn đã kết thúc ca dạy với học viên <strong className="text-slate-900 dark:text-white">{completeModal.customers.full_name}</strong>.
              </p>

              {isTooEarly ? (
                <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 p-3.5 text-xs text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5">
                  <WarningCircle size={20} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900 dark:text-amber-200">Chưa đến thời gian diễn ra ca tập!</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300/90">
                      Ca tập này được lên lịch vào lúc <strong>{new Date(completeModal.scheduled_start).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</strong>. Bạn chỉ có thể bấm xác nhận hoàn thành trong vòng 30 phút trước giờ tập.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-900 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/50">
                  💡 <strong>Lưu ý:</strong> Thao tác này sẽ chính thức trừ 1 buổi tập khỏi gói PT của học viên và lưu nhật ký ca dạy.
                </div>
              )}

              <div className="mt-4 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Ghi chú nhật ký buổi dạy:
                </label>
                <textarea
                  value={sessionNote}
                  onChange={(e) => setSessionNote(e.target.value)}
                  placeholder="Ghi chú bài tập đã thực hiện..."
                  rows={3}
                  disabled={isTooEarly}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 dark:disabled:bg-zinc-800/50"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompleteModal(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 dark:border-zinc-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={completeMutation.isPending || isTooEarly}
                  onClick={() => completeMutation.mutate()}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {completeMutation.isPending ? 'Đang xử lý...' : 'Xác Nhận & Trừ Buổi'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* No-Show Modal */}
      {noShowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <WarningCircle className="h-6 w-6 text-rose-600" /> Báo Vắng Mặt Ca Dạy
            </h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400">
              Ghi nhận học viên <strong className="text-slate-900 dark:text-white">{noShowModal.customers.full_name}</strong> không đến buổi tập theo lịch hẹn:
            </p>

            <div className="mt-4">
              <textarea
                value={noShowReason}
                onChange={(e) => setNoShowReason(e.target.value)}
                placeholder="Ghi chú lý do vắng mặt (ví dụ: Học viên không đến và không báo trước)..."
                rows={3}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setNoShowModal(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 dark:border-zinc-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={noShowMutation.isPending}
                onClick={() => noShowMutation.mutate()}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {noShowMutation.isPending ? 'Đang lưu...' : 'Xác Nhận Vắng Mặt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
