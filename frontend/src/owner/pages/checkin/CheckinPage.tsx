import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  IdentificationCard,
  UsersThree,
  UserPlus,
  Pulse,
  MagnifyingGlass,
  Storefront,
  Funnel,
  Info,
  Clock,
  CheckCircle,
  XCircle,
} from '@phosphor-icons/react';
import { getCheckinOverview } from '../../api/checkin';
import { listBranches } from '../../api/branches';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { inputClass } from '../../components/FormField';
import { Skeleton } from '../../components/Skeleton';

const METHOD_LABELS: Record<string, { label: string; icon: string }> = {
  FACE: { label: 'Nhận diện khuôn mặt', icon: '👤' },
  QR: { label: 'Quét mã QR', icon: '📱' },
  MANUAL: { label: 'Nhập thủ công', icon: '✍️' },
  AUTO: { label: 'Tự động hệ thống', icon: '🤖' },
};

function formatTime(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

export default function CheckinPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const branchId = searchParams.get('branchId') ?? '';
  
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'MEMBER' | 'GUEST' | ''>('');
  const [method, setMethod] = useState<'FACE' | 'QR' | 'MANUAL' | 'AUTO' | ''>('');
  const [status, setStatus] = useState<'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | ''>('');
  const [page, setPage] = useState(1);

  // Lay danh sach chi nhanh
  const { data: branches } = useQuery({
    queryKey: ['owner-branches'],
    queryFn: listBranches,
  });

  // Lay du lieu Check-in Overview
  const { data, isLoading } = useQuery({
    queryKey: ['owner-checkin', search, branchId, type, method, status, page],
    queryFn: () =>
      getCheckinOverview({
        search: search.trim() || undefined,
        branchId: branchId || undefined,
        type: type || undefined,
        method: method || undefined,
        status: status || undefined,
        page,
      }),
  });

  function handleBranchChange(newBranchId: string) {
    if (newBranchId) {
      setSearchParams({ branchId: newBranchId });
    } else {
      setSearchParams({});
    }
    setPage(1);
  }

  function handleResetFilters() {
    setSearch('');
    setType('');
    setMethod('');
    setStatus('');
    setSearchParams({});
    setPage(1);
  }

  const hasActiveFilters = Boolean(search || branchId || type || method || status);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-zinc-50">
            Giám sát Check-in & Lưu lượng
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            Theo dõi thời gian thực lưu lượng khách tập, loại hình truy cập và lịch sử check-in trên toàn mạng lưới phòng gym.
          </p>
        </div>

        {/* Live Refresh Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <span>Thời gian thực · Tự động cập nhật</span>
        </div>
      </div>

      {/* 4 High-End Metric Cards */}
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Metric 1: Khach da den (Daily Unique Visitors) — BR-STAT-001: 1 khach = tinh 1 lan
                du co nhieu luot check-in trong ngay. KHONG duoc nham voi tong luot ben canh. */}
            <Card className="flex flex-col justify-between p-4 bg-gradient-to-br from-white to-slate-50/80 dark:from-zinc-900 dark:to-zinc-900/60 border-slate-200/80 dark:border-zinc-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  Khách đã đến hôm nay
                </span>
                <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300 flex items-center justify-center">
                  <UsersThree size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-50">
                  {data.today.dailyUniqueVisitors}
                </span>
                <span className="text-xs text-slate-400 font-medium">khách</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Member {data.today.memberVisitors} · Guest {data.today.guestVisitors}
              </p>
            </Card>

            {/* Metric 2: Tong luot Check-in (Total Check-in Events) — mot khach co the ra vao
                nhieu lan, moi lan tinh rieng; khac voi so KHACH o Metric 1. */}
            <Card className="flex flex-col justify-between p-4 bg-gradient-to-br from-white to-blue-50/30 dark:from-zinc-900 dark:to-blue-950/20 border-slate-200/80 dark:border-zinc-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                  Tổng lượt Check-in
                </span>
                <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center">
                  <IdentificationCard size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-2xl sm:text-3xl font-extrabold text-blue-900 dark:text-blue-100">
                  {data.today.totalCheckInEvents}
                </span>
                <span className="text-xs text-blue-500 font-medium">lượt vào</span>
              </div>
            </Card>

            {/* Metric 3: Khach vang lai (unique) */}
            <Card className="flex flex-col justify-between p-4 bg-gradient-to-br from-white to-purple-50/30 dark:from-zinc-900 dark:to-purple-950/20 border-slate-200/80 dark:border-zinc-800 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                  Khách vãng lai hôm nay
                </span>
                <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300 flex items-center justify-center">
                  <UserPlus size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-2xl sm:text-3xl font-extrabold text-purple-900 dark:text-purple-100">
                  {data.today.guestVisitors}
                </span>
                <span className="text-xs text-purple-500 font-medium">khách</span>
              </div>
            </Card>

            {/* Metric 4: Dang trong phong tap */}
            <Card className="flex flex-col justify-between p-4 bg-gradient-to-br from-white to-emerald-50/40 dark:from-zinc-900 dark:to-emerald-950/20 border-emerald-500/30 dark:border-emerald-800/60 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Đang trong phòng tập
                </span>
                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center">
                  <Pulse size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
                  {data.today.currentlyInGym}
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">khách có mặt</span>
              </div>
            </Card>
          </div>
        )
      )}

      {/* Operational Notice Banner */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-xs text-slate-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 flex items-start gap-2.5 shadow-xs">
        <Info size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="leading-snug">
          <strong className="text-slate-900 dark:text-zinc-100 font-bold">Quyền hạn Giám sát Owner:</strong> Đây là trung tâm giám sát tổng thể cho Chủ phòng tập. Thao tác quẹt thẻ/nhận diện check-in hàng ngày do Lễ tân tiếp quầy vận hành trực tiếp tại từng cơ sở chi nhánh.
        </div>
      </div>

      {/* Smart Filter Toolbar */}
      <Card className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800/80 pb-2.5">
          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
            <Funnel size={16} className="text-emerald-600" />
            Bộ lọc tìm kiếm lượt Check-in
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tên khách, SĐT, Mã..."
              className={`${inputClass} pl-9 text-xs h-10`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Branch Filter */}
          <div className="relative">
            <select
              className={`${inputClass} text-xs h-10`}
              value={branchId}
              onChange={(e) => handleBranchChange(e.target.value)}
            >
              <option value="">🏢 Tất cả chi nhánh</option>
              {branches?.map((b) => (
                <option key={b.id} value={b.id}>
                  📍 {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <select
            className={`${inputClass} text-xs h-10`}
            value={type}
            onChange={(e) => {
              setType(e.target.value as typeof type);
              setPage(1);
            }}
          >
            <option value="">👥 Tất cả loại khách</option>
            <option value="MEMBER">Hội viên (Member)</option>
            <option value="GUEST">Khách vãng lai (Guest)</option>
          </select>

          {/* Method Filter */}
          <select
            className={`${inputClass} text-xs h-10`}
            value={method}
            onChange={(e) => {
              setMethod(e.target.value as typeof method);
              setPage(1);
            }}
          >
            <option value="">⚙️ Tất cả phương thức</option>
            <option value="FACE">👤 Nhận diện khuôn mặt</option>
            <option value="QR">📱 Quét mã QR</option>
            <option value="MANUAL">✍️ Thủ công quầy</option>
            <option value="AUTO">🤖 Tự động hệ thống</option>
          </select>

          {/* Status Filter */}
          <select
            className={`${inputClass} text-xs h-10`}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status);
              setPage(1);
            }}
          >
            <option value="">🚦 Tất cả trạng thái</option>
            <option value="CHECKED_IN">🟢 Đang trong phòng tập</option>
            <option value="CHECKED_OUT">⚪ Đã check-out (Ra về)</option>
            <option value="CANCELLED">❌ Đã huỷ</option>
          </select>
        </div>
      </Card>

      {/* Data-Rich Table View */}
      <Card padded={false} className="overflow-x-auto shadow-xs border-slate-200/80 dark:border-zinc-800">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/80 text-xs font-bold text-slate-600 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400">
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Chi nhánh</th>
              <th className="px-4 py-3">Loại khách</th>
              <th className="px-4 py-3">Thời gian vào / ra</th>
              <th className="px-4 py-3">Phương thức</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-4">
                  <Skeleton className="h-32 w-full" />
                </td>
              </tr>
            ) : data && data.list.items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  <Clock size={36} className="mx-auto mb-2 opacity-50" />
                  <p className="font-bold text-sm text-slate-700 dark:text-zinc-300">Không tìm thấy lượt Check-in phù hợp</p>
                  <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa hoặc bộ lọc chi nhánh/trạng thái.</p>
                </td>
              </tr>
            ) : (
              data?.list.items.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                  {/* Customer Info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200/80 dark:border-emerald-800">
                        {row.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-slate-900 dark:text-zinc-100">
                          {row.customerName}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                          {row.customerPhone || row.customerCode || 'Khách lẻ'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Branch Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300 font-medium">
                      <Storefront size={14} className="text-slate-400 shrink-0" />
                      <span>{row.branchName}</span>
                    </div>
                  </td>

                  {/* Customer Type */}
                  <td className="px-4 py-3">
                    {row.type === 'MEMBER' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        Hội viên
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        Vãng lai
                      </span>
                    )}
                  </td>

                  {/* Time In / Time Out */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col text-xs">
                      <span className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                        <Clock size={12} className="text-emerald-600" />
                        Vào: {formatTime(row.checkInAt)}
                      </span>
                      {row.checkOutAt && (
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                          Ra: {formatTime(row.checkOutAt)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Method */}
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-zinc-300 font-medium">
                    <span className="flex items-center gap-1">
                      <span>{METHOD_LABELS[row.method]?.icon || '⚙️'}</span>
                      <span>{METHOD_LABELS[row.method]?.label || row.method}</span>
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3">
                    {row.status === 'CHECKED_IN' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Đang tập
                      </span>
                    ) : row.status === 'CHECKED_OUT' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                        <CheckCircle size={13} className="text-slate-400" />
                        Đã ra về
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <XCircle size={13} />
                        Đã huỷ
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Pagination Controls */}
      {data && data.list.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
          <span>
            Hiển thị trang <strong>{data.list.page}</strong> / <strong>{data.list.totalPages}</strong> · Tổng cộng <strong>{data.list.total}</strong> lượt check-in
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Trang trước
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= data.list.totalPages} onClick={() => setPage((p) => p + 1)}>
              Trang sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
