import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UsersThree,
  MagnifyingGlass,
  Phone,
  BookOpen,
  PlusCircle,
} from '@phosphor-icons/react';
import { getPtClients, getPtClientDetail, createPtWorkoutLog } from '../api/pt';

export default function PtClientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'WORKOUT_LOG' | 'MEASUREMENTS'>('OVERVIEW');

  // Workout Log Form state
  const [workoutContent, setWorkoutContent] = useState('');
  const [mainExercises, setMainExercises] = useState('');
  const [progressAssessment, setProgressAssessment] = useState('');
  const [notes, setNotes] = useState('');

  const { data: clientsList, isLoading, isError } = useQuery({
    queryKey: ['pt-clients', search],
    queryFn: () => getPtClients(search),
  });

  const { data: clientDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['pt-client-detail', selectedClient?.customer?.id],
    queryFn: () => getPtClientDetail(selectedClient.customer.id),
    enabled: !!selectedClient,
  });

  const logMutation = useMutation({
    mutationFn: () =>
      createPtWorkoutLog({
        customerPtPackageId: selectedClient.packageId,
        workoutContent,
        mainExercises,
        progressAssessment,
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-client-detail', selectedClient?.customer?.id] });
      setWorkoutContent('');
      setMainExercises('');
      setProgressAssessment('');
      setNotes('');
      setActiveTab('WORKOUT_LOG');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header & Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <UsersThree className="h-6 w-6 text-emerald-600 dark:text-emerald-400" /> Học Viên Của Tôi (My Clients)
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            Danh sách hội viên đang ký hợp đồng huấn luyện cá nhân trực tiếp với bạn (Bảo mật BR-PT-004).
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
                      title={item.customer.isMembershipActive ? 'Thẻ tập ACTIVE' : 'Cảnh báo BR-PT-003: Thẻ tập chưa active'}
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
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                      <span className="text-slate-500 dark:text-zinc-400 font-medium">Tên gói PT:</span>
                      <p className="mt-1 font-bold text-sm text-slate-900 dark:text-white">
                        {selectedClient.planName}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                      <span className="text-slate-500 dark:text-zinc-400 font-medium">Tiến độ số buổi:</span>
                      <p className="mt-1 font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                        {selectedClient.usedSessions} / {selectedClient.totalSessions} buổi (Còn {selectedClient.remainingSessions} buổi)
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 p-4 dark:border-zinc-800 space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white">Thông tin liên hệ & Quyền lợi:</h4>
                    <p className="text-slate-600 dark:text-zinc-400">Email: {selectedClient.customer.email || 'Chưa cập nhật'}</p>
                    <p className="text-slate-600 dark:text-zinc-400">Trạng thái thẻ tập Membership: <strong className={selectedClient.customer.isMembershipActive ? 'text-emerald-600' : 'text-rose-600'}>{selectedClient.customer.isMembershipActive ? 'ACTIVE' : 'INACTIVE'}</strong></p>
                  </div>
                </div>
              )}

              {activeTab === 'WORKOUT_LOG' && (
                <div className="space-y-6 text-xs">
                  {/* Form to Add New Workout Log */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30 space-y-3">
                    <h4 className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <PlusCircle className="h-4 w-4 text-emerald-600" /> Thêm Nhật Ký Buổi Tập Mới
                    </h4>

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
                      <label className="font-bold text-slate-700 dark:text-zinc-300">Đánh giá tiến bộ</label>
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
                  </div>

                  {/* Workout Logs History List */}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">Lịch Sử Nhật Ký Ca Dạy:</h4>
                    {isDetailLoading ? (
                      <p className="text-slate-400">Đang tải lịch sử...</p>
                    ) : clientDetail?.pt_session_logs && clientDetail.pt_session_logs.length > 0 ? (
                      <div className="space-y-2">
                        {clientDetail.pt_session_logs.map((log: any) => (
                          <div key={log.id} className="rounded-xl border border-slate-200 p-3 dark:border-zinc-800 bg-white dark:bg-zinc-800/40">
                            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
                              <span className="font-mono text-[11px] font-bold">{new Date(log.created_at).toLocaleString('vi-VN')}</span>
                              <span className="font-semibold text-emerald-600">{log.reason}</span>
                            </div>
                            <p className="mt-1 text-slate-800 dark:text-zinc-200">{log.note || 'Không có ghi chú'}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">Chưa có nhật ký ghi nhận nào</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'MEASUREMENTS' && (
                <div className="space-y-4 text-xs">
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-3">Chỉ Số Cơ Thể InBody Gần Nhất:</h4>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-lg bg-white p-3 dark:bg-zinc-900 shadow-sm">
                        <span className="text-slate-400 font-medium">Cân nặng</span>
                        <p className="text-lg font-black text-slate-900 dark:text-white mt-1">68 kg</p>
                      </div>
                      <div className="rounded-lg bg-white p-3 dark:bg-zinc-900 shadow-sm">
                        <span className="text-slate-400 font-medium">Body Fat</span>
                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">18 %</p>
                      </div>
                      <div className="rounded-lg bg-white p-3 dark:bg-zinc-900 shadow-sm">
                        <span className="text-slate-400 font-medium">Cơ bắp</span>
                        <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-1">32 kg</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
    </div>
  );
}
