import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UsersThree,
  MagnifyingGlass,
  Phone,
  BookOpen,
  PlusCircle,
  Scales,
  TrendUp,
  CheckCircle,
  CalendarBlank,
  PencilSimple,
  Trash,
  WarningCircle,
  XCircle,
  Barbell,
} from '@phosphor-icons/react';
import {
  getPtClients,
  getPtClientDetail,
  createPtWorkoutLog,
  updatePtWorkoutLog,
  deletePtWorkoutLog,
  createInBodyRecord,
  cancelPtPackage,
} from '../api/pt';
import { showConfirm, showToast } from '../../owner/utils/swal';
import { apiErrorMessage } from '../../owner/api/client';

export default function PtClientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'WORKOUT_LOG' | 'MEASUREMENTS'>('OVERVIEW');

  // Workout Log Form state
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [workoutContent, setWorkoutContent] = useState('');
  const [mainExercises, setMainExercises] = useState('');
  const [progressAssessment, setProgressAssessment] = useState('');
  const [notes, setNotes] = useState('');

  // Workout Log Edit Modal state
  const [editingLog, setEditingLog] = useState<any | null>(null);
  const [editWorkoutContent, setEditWorkoutContent] = useState('');
  const [editMainExercises, setEditMainExercises] = useState('');
  const [editProgressAssessment, setEditProgressAssessment] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // InBody Form state
  const [weightKg, setWeightKg] = useState<string>('');
  const [bodyFatPercent, setBodyFatPercent] = useState<string>('');
  const [muscleMassKg, setMuscleMassKg] = useState<string>('');
  const [inbodyNotes, setInbodyNotes] = useState('');

  const { data: clientsList, isLoading, isError } = useQuery({
    queryKey: ['pt-clients', search],
    queryFn: () => getPtClients(search),
  });

  const { data: clientDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['pt-client-detail', selectedClient?.customer?.id],
    queryFn: () => getPtClientDetail(selectedClient.customer.id),
    enabled: !!selectedClient,
  });

  // Past / completed bookings available for logging
  const pastBookings = (clientDetail?.pt_bookings || []).filter(
    (b: any) => b.status === 'COMPLETED' || new Date(b.scheduled_start).getTime() <= Date.now()
  );

  const logMutation = useMutation({
    mutationFn: () =>
      createPtWorkoutLog({
        customerPtPackageId: selectedClient.packageId,
        bookingId: selectedBookingId || undefined,
        workoutContent,
        mainExercises,
        progressAssessment,
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-client-detail', selectedClient?.customer?.id] });
      setSelectedBookingId('');
      setWorkoutContent('');
      setMainExercises('');
      setProgressAssessment('');
      setNotes('');
    },
  });

  const updateLogMutation = useMutation({
    mutationFn: () =>
      updatePtWorkoutLog(editingLog.id, {
        workoutContent: editWorkoutContent,
        mainExercises: editMainExercises,
        progressAssessment: editProgressAssessment,
        notes: editNotes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-client-detail', selectedClient?.customer?.id] });
      setEditingLog(null);
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: (logId: string) => deletePtWorkoutLog(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-client-detail', selectedClient?.customer?.id] });
    },
  });

  const inbodyMutation = useMutation({
    mutationFn: () =>
      createInBodyRecord({
        customerId: selectedClient.customer.id,
        weightKg: parseFloat(weightKg),
        bodyFatPercent: bodyFatPercent ? parseFloat(bodyFatPercent) : undefined,
        muscleMassKg: muscleMassKg ? parseFloat(muscleMassKg) : undefined,
        notes: inbodyNotes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-client-detail', selectedClient?.customer?.id] });
      setWeightKg('');
      setBodyFatPercent('');
      setMuscleMassKg('');
      setInbodyNotes('');
    },
  });

  function safeParseJson(str: string | null | undefined) {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }

  function handleOpenEditLog(log: any, parsedPayload?: any) {
    setEditingLog(log);
    const payload = parsedPayload || safeParseJson(log.note);
    setEditWorkoutContent(payload?.workoutContent || log.note || '');
    setEditMainExercises(payload?.mainExercises || '');
    setEditProgressAssessment(payload?.progressAssessment || '');
    setEditNotes(payload?.customNotes || '');
  }

  const cancelPtPackageMutation = useMutation({
    mutationFn: () => cancelPtPackage(selectedClient?.packageId, 'PT chấm dứt hợp đồng theo yêu cầu'),
    onSuccess: () => {
      showToast('Đã chấm dứt / hủy gói PT cho học viên thành công!', 'success');
      queryClient.invalidateQueries({ queryKey: ['pt-clients'] });
      queryClient.invalidateQueries({ queryKey: ['pt-client-detail'] });
      queryClient.invalidateQueries({ queryKey: ['pt-overview'] });
      setSelectedClient(null);
    },
    onError: (err) => {
      showToast(apiErrorMessage(err, 'Không thể hủy gói PT'), 'error');
    },
  });

  const handleCancelPtPackage = async () => {
    if (!selectedClient?.packageId) return;
    const confirmed = await showConfirm({
      title: '⚠️ Chấm dứt / Hủy hợp đồng gói PT',
      text: `Bạn có chắc chắn muốn chấm dứt gói PT "${selectedClient.planName}" của học viên ${selectedClient.customer.full_name}? Các ca tập chưa diễn ra của gói này sẽ bị hủy tự động.`,
      confirmButtonText: 'Đồng ý chấm dứt',
      cancelButtonText: 'Bỏ qua',
      icon: 'warning',
    });
    if (confirmed) {
      cancelPtPackageMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <UsersThree className="h-6 w-6 text-emerald-600 dark:text-emerald-400" /> Học Viên Của Tôi (My Clients)
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            Danh sách hội viên đang ký hợp đồng huấn luyện cá nhân trực tiếp với bạn.
          </p>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên học viên..."
            className="w-full rounded-xl border border-slate-200/80 bg-white pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>
      </div>

      {/* Roster Cards Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600 dark:border-zinc-800 dark:border-t-emerald-400" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          Không thể tải danh sách học viên.
        </div>
      ) : !clientsList || clientsList.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 dark:border-zinc-800 dark:bg-zinc-900">
          <UsersThree className="mx-auto h-12 w-12 text-slate-300 dark:text-zinc-700" />
          <p className="mt-2 text-sm font-semibold">Chưa có học viên nào được gán hợp đồng PT cho bạn</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clientsList.map((item) => {
            const usedPct = Math.min(
              100,
              Math.round((item.usedSessions / (item.totalSessions || 1)) * 100)
            );
            const isLowSessions = item.remainingSessions <= 2;

            return (
              <div
                key={item.packageId}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between hover:border-emerald-300 transition"
              >
                <div>
                  {/* Top Client Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black text-base shadow-sm">
                        {item.customer.full_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                          {item.customer.full_name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" /> {item.customer.phone || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        item.customer.isMembershipActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                      title={item.customer.isMembershipActive ? 'Thẻ tập ACTIVE' : 'Thẻ tập chưa active'}
                    >
                      {item.customer.isMembershipActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  {/* Package Progress Info */}
                  <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-zinc-300">{item.planName}</span>
                      <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">
                        {item.usedSessions} / {item.totalSessions} buổi
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isLowSessions ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${usedPct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                      <span>Còn lại: <strong className={isLowSessions ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}>{item.remainingSessions} buổi</strong></span>
                      {isLowSessions && <span className="font-bold text-rose-600 dark:text-rose-400 animate-pulse">Sắp hết gói!</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClient(item);
                      setActiveTab('OVERVIEW');
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Xem Chi Tiết & Workout Log</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Client Detail Drawer / Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/80 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-800/80">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-lg">
                  {selectedClient.customer.full_name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-black text-base text-slate-900 dark:text-white">
                    {selectedClient.customer.full_name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                    Hồ sơ tập luyện PT • SĐT: {selectedClient.customer.phone || 'N/A'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedClient(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs Header */}
            <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-2 dark:border-zinc-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('OVERVIEW')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'OVERVIEW'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                Tổng quan gói
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('WORKOUT_LOG')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'WORKOUT_LOG'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                Nhật ký bài tập (Workout Log)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MEASUREMENTS')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'MEASUREMENTS'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                Chỉ số InBody
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeTab === 'OVERVIEW' && (() => {
                const used = selectedClient.usedSessions || 0;
                const total = selectedClient.totalSessions || 0;
                const remaining = selectedClient.remainingSessions || Math.max(0, total - used);
                const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
                const isLow = remaining <= 2;

                return (
                  <div className="space-y-4 text-xs">
                    {/* Active PT Package & Progress Bar Hero Card */}
                    <div className="relative overflow-hidden rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50/80 via-emerald-50/40 to-transparent p-5 dark:border-teal-900/50 dark:from-teal-950/30 dark:to-transparent space-y-4 shadow-xs">
                      <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                          <Barbell size={16} className="text-emerald-600" /> Gói Huấn Luyện PT & Tiến Độ Buổi Tập
                        </h3>
                        <div className="flex items-center gap-2">
                          {selectedClient.packageStatus !== 'CANCELLED' && (
                            <button
                              type="button"
                              onClick={handleCancelPtPackage}
                              disabled={cancelPtPackageMutation.isPending}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60 transition-colors shadow-2xs"
                              title="Chấm dứt / Hủy hợp đồng gói PT cho học viên"
                            >
                              <XCircle size={14} />
                              Chấm dứt gói PT
                            </button>
                          )}
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            selectedClient.packageStatus === 'ACTIVE'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                            {selectedClient.packageStatus || 'ACTIVE'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-display text-base font-extrabold text-teal-950 dark:text-teal-200">
                            {selectedClient.planName}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
                            Số buổi đã tập: <strong className="text-slate-900 dark:text-white font-bold">{used} / {total} buổi</strong>
                          </p>
                        </div>

                        {/* Progress Pill */}
                        <div className="rounded-xl bg-white p-3 dark:bg-zinc-800/80 border border-teal-100 dark:border-teal-900/40 shadow-xs text-right min-w-44 shrink-0">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Tiến độ buổi tập:</span>
                          <div className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400">
                            {used} / {total} buổi
                          </div>
                          <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                            Đã tập <strong className="text-slate-900 dark:text-white">{used}</strong> • Còn <strong className={isLow ? 'text-rose-600 font-black animate-pulse' : 'text-emerald-700 dark:text-emerald-300'}>{remaining} buổi</strong>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-zinc-400">
                          <span>Tỷ lệ hoàn thành ({used}/{total} buổi)</span>
                          <span className="font-mono">{pct}%</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              isLow ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 p-4 dark:border-zinc-800 space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">Thông tin liên hệ & Quyền lợi:</h4>
                      <p className="text-slate-600 dark:text-zinc-400">Email: {selectedClient.customer.email || 'Chưa cập nhật'}</p>
                      <p className="text-slate-600 dark:text-zinc-400">Trạng thái thẻ tập Membership: <strong className={selectedClient.customer.isMembershipActive ? 'text-emerald-600' : 'text-rose-600'}>{selectedClient.customer.isMembershipActive ? 'ACTIVE' : 'INACTIVE'}</strong></p>
                    </div>
                  </div>
                );
              })()}

              {activeTab === 'WORKOUT_LOG' && (
                <div className="space-y-6 text-xs">
                  {/* Form to Add New Workout Log */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30 space-y-3">
                    <h4 className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <PlusCircle className="h-4 w-4 text-emerald-600" /> Thêm Nhật Ký Buổi Tập (Ca Đã Diễn Ra / Hoàn Thành)
                    </h4>

                    {pastBookings.length === 0 ? (
                      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-3 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 flex items-center gap-2">
                        <WarningCircle size={18} className="shrink-0 text-amber-600" />
                        <span>Học viên chưa có ca tập nào đã diễn ra trong quá khứ hoặc hoàn thành để ghi nhật ký bài tập.</span>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="font-bold text-slate-700 dark:text-zinc-300">Chọn ca tập đã diễn ra *</label>
                          <select
                            value={selectedBookingId}
                            onChange={(e) => setSelectedBookingId(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                          >
                            <option value="">-- Chọn ca tập để ghi nhật ký --</option>
                            {pastBookings.map((b: any) => (
                              <option key={b.id} value={b.id}>
                                {new Date(b.scheduled_start).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })} - {b.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đã diễn ra'}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-slate-700 dark:text-zinc-300">Nội dung buổi tập *</label>
                            <input
                              type="text"
                              value={workoutContent}
                              onChange={(e) => setWorkoutContent(e.target.value)}
                              placeholder="Ví dụ: Tập ngực & tay sau"
                              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 dark:text-zinc-300">Bài tập chính</label>
                            <input
                              type="text"
                              value={mainExercises}
                              onChange={(e) => setMainExercises(e.target.value)}
                              placeholder="Bench press 50kg, Dips..."
                              className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 dark:text-zinc-300">Đánh giá tiến bộ & Form bài tập</label>
                          <input
                            type="text"
                            value={progressAssessment}
                            onChange={(e) => setProgressAssessment(e.target.value)}
                            placeholder="Tập đúng form, thể lực tốt..."
                            className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={!workoutContent || logMutation.isPending}
                          onClick={() => logMutation.mutate()}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {logMutation.isPending ? 'Đang lưu...' : 'Lưu Nhật Ký Bài Tập'}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Workout Logs History List */}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-3">Lịch Sử Nhật Ký Ca Dạy:</h4>
                    {isDetailLoading ? (
                      <p className="text-slate-400">Đang tải lịch sử...</p>
                    ) : clientDetail?.pt_session_logs && clientDetail.pt_session_logs.length > 0 ? (
                      <div className="space-y-3">
                        {clientDetail.pt_session_logs.map((log: any) => {
                          let parsedPayload: any = null;
                          if (log.note && log.note.startsWith('{')) {
                            try {
                              parsedPayload = JSON.parse(log.note);
                            } catch (e) {
                              parsedPayload = null;
                            }
                          }
                          const canManage = log.reason === 'WORKOUT_LOG';

                          return (
                            <div key={log.id} className="rounded-xl border border-slate-200/90 p-4 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 shadow-sm space-y-2">
                              <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 border-b border-slate-100 pb-2 dark:border-zinc-800">
                                <span className="font-mono text-[11px] font-bold flex items-center gap-1.5">
                                  <CalendarBlank size={14} className="text-slate-400" />
                                  {new Date(log.created_at).toLocaleString('vi-VN')}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                                    <CheckCircle size={12} /> {log.reason === 'WORKOUT_LOG' ? 'Nhật ký bài tập' : 'Hoàn thành ca dạy'}
                                  </span>

                                  {canManage && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditLog(log, parsedPayload)}
                                        className="p-1 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                                        title="Chỉnh sửa nhật ký"
                                      >
                                        <PencilSimple size={15} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (confirm('Bạn có chắc chắn muốn xóa nhật ký bài tập này không?')) {
                                            deleteLogMutation.mutate(log.id);
                                          }
                                        }}
                                        className="p-1 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition"
                                        title="Xóa nhật ký"
                                      >
                                        <Trash size={15} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {parsedPayload ? (
                                <div className="space-y-1.5 pt-1">
                                  {parsedPayload.workoutContent && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-700 dark:text-zinc-300 min-w-24">📌 Nội dung:</span>
                                      <span className="font-semibold text-slate-900 dark:text-white">{parsedPayload.workoutContent}</span>
                                    </div>
                                  )}
                                  {parsedPayload.mainExercises && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-700 dark:text-zinc-300 min-w-24">🏋️ Bài tập chính:</span>
                                      <span className="text-slate-800 dark:text-zinc-200">{parsedPayload.mainExercises}</span>
                                    </div>
                                  )}
                                  {parsedPayload.progressAssessment && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-700 dark:text-zinc-300 min-w-24">📈 Tiến bộ:</span>
                                      <span className="text-emerald-700 dark:text-emerald-300 font-medium">{parsedPayload.progressAssessment}</span>
                                    </div>
                                  )}
                                  {parsedPayload.customNotes && (
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-700 dark:text-zinc-300 min-w-24">📝 Ghi chú:</span>
                                      <span className="text-slate-600 dark:text-zinc-400">{parsedPayload.customNotes}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="mt-1 text-slate-800 dark:text-zinc-200">{log.note || 'Không có ghi chú'}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">Chưa có nhật ký ghi nhận nào</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'MEASUREMENTS' && (() => {
                const inbodyRecords = clientDetail?.customers?.customer_inbody_records || [];
                const latestRecord = inbodyRecords[0];

                return (
                  <div className="space-y-6 text-xs">
                    {/* Add New InBody Record Form */}
                    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30 space-y-3">
                      <h4 className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                        <Scales className="h-4 w-4 text-blue-600" /> Thêm Đo Chỉ Số InBody Mới
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-bold text-slate-700 dark:text-zinc-300">Cân nặng (kg) *</label>
                          <input
                            type="number"
                            step="0.1"
                            value={weightKg}
                            onChange={(e) => setWeightKg(e.target.value)}
                            placeholder="Ví dụ: 68.5"
                            className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 dark:text-zinc-300">Tỷ lệ mỡ Body Fat (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={bodyFatPercent}
                            onChange={(e) => setBodyFatPercent(e.target.value)}
                            placeholder="Ví dụ: 18.2"
                            className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 dark:text-zinc-300">Khối lượng cơ bắp (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={muscleMassKg}
                            onChange={(e) => setMuscleMassKg(e.target.value)}
                            placeholder="Ví dụ: 32.4"
                            className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-zinc-300">Ghi chú lượt đo</label>
                        <input
                          type="text"
                          value={inbodyNotes}
                          onChange={(e) => setInbodyNotes(e.target.value)}
                          placeholder="Đo vào buổi sáng trước ăn..."
                          className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={!weightKg || inbodyMutation.isPending}
                        onClick={() => inbodyMutation.mutate()}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {inbodyMutation.isPending ? 'Đang lưu...' : 'Lưu Chỉ Số InBody'}
                      </button>
                    </div>

                    {/* Latest InBody Summary Cards */}
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <TrendUp className="h-4 w-4 text-emerald-600" /> Chỉ Số Cơ Thể InBody Gần Nhất:
                        </h4>
                        {latestRecord && (
                          <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                            Ngày đo: {new Date(latestRecord.measured_at).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>

                      {latestRecord ? (
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="rounded-lg bg-white p-3 dark:bg-zinc-900 shadow-sm border border-slate-100 dark:border-zinc-800">
                            <span className="text-slate-400 font-medium">Cân nặng</span>
                            <p className="text-lg font-black text-slate-900 dark:text-white mt-1">
                              {Number(latestRecord.weight_kg)} kg
                            </p>
                          </div>
                          <div className="rounded-lg bg-white p-3 dark:bg-zinc-900 shadow-sm border border-slate-100 dark:border-zinc-800">
                            <span className="text-slate-400 font-medium">Body Fat</span>
                            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                              {latestRecord.body_fat_percent ? `${Number(latestRecord.body_fat_percent)} %` : 'N/A'}
                            </p>
                          </div>
                          <div className="rounded-lg bg-white p-3 dark:bg-zinc-900 shadow-sm border border-slate-100 dark:border-zinc-800">
                            <span className="text-slate-400 font-medium">Cơ bắp</span>
                            <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1">
                              {latestRecord.muscle_mass_kg ? `${Number(latestRecord.muscle_mass_kg)} kg` : 'N/A'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-400 italic text-center py-4">Chưa có bản ghi InBody nào. Hãy nhập bản ghi đầu tiên ở form trên.</p>
                      )}
                    </div>

                    {/* Historical Measurements List */}
                    {inbodyRecords.length > 0 && (
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-2">Lịch Sử Các Lần Đo InBody:</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {inbodyRecords.map((r: any) => (
                            <div key={r.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs dark:border-zinc-800 bg-white dark:bg-zinc-900">
                              <div>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">
                                  {new Date(r.measured_at).toLocaleDateString('vi-VN')}
                                </span>
                                {r.notes && <p className="text-slate-500 text-[11px] mt-0.5">{r.notes}</p>}
                              </div>
                              <div className="flex gap-3 font-mono text-xs">
                                <span className="font-bold text-slate-900 dark:text-white">{Number(r.weight_kg)} kg</span>
                                {r.body_fat_percent && <span className="text-emerald-600 font-semibold">{Number(r.body_fat_percent)}% mỡ</span>}
                                {r.muscle_mass_kg && <span className="text-blue-600 font-semibold">{Number(r.muscle_mass_kg)}kg cơ</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 px-6 py-3 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedClient(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 dark:border-zinc-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Workout Log Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <PencilSimple className="h-5 w-5 text-emerald-600" /> Chỉnh Sửa Nhật Ký Bài Tập
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-zinc-300">Nội dung buổi tập *</label>
                <input
                  type="text"
                  value={editWorkoutContent}
                  onChange={(e) => setEditWorkoutContent(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-zinc-300">Bài tập chính</label>
                <input
                  type="text"
                  value={editMainExercises}
                  onChange={(e) => setEditMainExercises(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-zinc-300">Đánh giá tiến bộ</label>
                <input
                  type="text"
                  value={editProgressAssessment}
                  onChange={(e) => setEditProgressAssessment(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 dark:border-zinc-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!editWorkoutContent || updateLogMutation.isPending}
                onClick={() => updateLogMutation.mutate()}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {updateLogMutation.isPending ? 'Đang cập nhật...' : 'Cập Nhật Nhật Ký'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
