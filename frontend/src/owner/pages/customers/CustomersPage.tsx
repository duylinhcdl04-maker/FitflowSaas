import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  Users,
  UserCheck,
  UserSwitch,
  UserPlus,
  MagnifyingGlass,
  MapPin,
  Phone,
  ArrowRight,
  Ticket,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import { listCustomers } from '../../api/customers';
import { listBranches } from '../../api/branches';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import KpiCard from '../../components/KpiCard';
import { Skeleton } from '../../components/Skeleton';

const STATUS_LABELS: Record<string, string> = { ACTIVE: 'Đang hoạt động', INACTIVE: 'Ngừng' };

const AVATAR_GRADIENTS = [
  'from-emerald-500 to-teal-700 text-white',
  'from-blue-500 to-indigo-700 text-white',
  'from-violet-500 to-purple-700 text-white',
  'from-amber-500 to-orange-700 text-white',
  'from-rose-500 to-pink-700 text-white',
  'from-cyan-500 to-blue-700 text-white',
];

function getAvatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

function getInitials(name: string) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('vi-VN');
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }
  return pages;
}

export default function CustomersPage() {
  const [searchParams] = useSearchParams();
  const initialBranchId = searchParams.get('branchId') ?? '';

  const [activeTab, setActiveTab] = useState<'MEMBER' | 'GUEST'>('MEMBER');
  const [search, setSearch] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(initialBranchId);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: branches } = useQuery({
    queryKey: ['owner-branches-list'],
    queryFn: listBranches,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['owner-customers', activeTab, search, selectedBranchId, selectedStatus, page, pageSize],
    queryFn: () =>
      listCustomers({
        type: activeTab,
        search: search || undefined,
        branchId: selectedBranchId || undefined,
        status: (selectedStatus as 'ACTIVE' | 'INACTIVE') || undefined,
        page,
        pageSize,
      }),
  });

  const stats = data?.stats;

  const startItem = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const endItem = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Quản lý Khách hàng</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Theo dõi danh sách hội viên chính thức và khách vãng lai toàn bộ chi nhánh
          </p>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Users}
          tone="emerald"
          label="Tổng số khách hàng"
          value={`${stats?.total ?? 0} khách`}
          hint="Toàn bộ hệ thống"
        />
        <KpiCard
          icon={UserCheck}
          tone="blue"
          label="Hội viên chính thức"
          value={`${stats?.memberCount ?? 0} hội viên`}
          hint={stats?.total ? `${Math.round(((stats.memberCount ?? 0) / stats.total) * 100)}% tổng số` : undefined}
        />
        <KpiCard
          icon={UserSwitch}
          tone="amber"
          label="Khách vãng lai & Vé lượt"
          value={`${stats?.guestCount ?? 0} khách`}
          hint="Sử dụng lượt lẻ/ngày"
        />
        <KpiCard
          icon={UserPlus}
          tone="violet"
          label="Khách mới trong tháng"
          value={`${stats?.newThisMonth ?? 0} khách`}
          hint="Tính từ đầu tháng"
        />
      </div>

      {/* Tab Switcher & Filter Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4 dark:border-zinc-800">
          {/* Segmented Tabs */}
          <div className="flex rounded-xl bg-stone-100 p-1 dark:bg-zinc-800">
            <button
              onClick={() => {
                setActiveTab('MEMBER');
                setPage(1);
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === 'MEMBER'
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-950 dark:text-emerald-400'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
              }`}
            >
              <UserCheck size={18} />
              <span>Hội viên chính thức</span>
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                  activeTab === 'MEMBER'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-stone-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                }`}
              >
                {stats?.memberCount ?? 0}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('GUEST');
                setPage(1);
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === 'GUEST'
                  ? 'bg-white text-blue-700 shadow-sm dark:bg-zinc-950 dark:text-blue-400'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
              }`}
            >
              <UserSwitch size={18} />
              <span>Khách vãng lai & Vé lượt</span>
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                  activeTab === 'GUEST'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    : 'bg-stone-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                }`}
              >
                {stats?.guestCount ?? 0}
              </span>
            </button>
          </div>

          {/* Search bar & Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px]">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                placeholder="Tìm theo tên, SĐT, mã..."
                className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm font-medium text-zinc-700 shadow-sm outline-none transition-colors hover:border-zinc-300 focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-700"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <select
              value={selectedBranchId}
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm outline-none transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700"
            >
              <option value="">Tất cả chi nhánh</option>
              {branches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm outline-none transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Ngừng</option>
            </select>
          </div>
        </div>

        {/* Informational Hint Banner */}
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            {activeTab === 'MEMBER'
              ? 'Danh sách các khách hàng đã đăng ký gói tập chính thức (tháng, quý, năm,...)'
              : 'Danh sách khách vãng lai, dùng thử hoặc tập theo lượt lẻ'}
          </span>
          {data && (
            <span className="font-medium">
              Hiển thị {startItem} - {endItem} trên tổng số {data.total} kết quả
            </span>
          )}
        </div>
      </div>

      {/* Main Table Content */}
      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : data && data.items.length === 0 ? (
        <Card>
          <EmptyState
            icon={activeTab === 'MEMBER' ? UserCheck : UserSwitch}
            title={activeTab === 'MEMBER' ? 'Không tìm thấy hội viên chính thức nào' : 'Không có khách vãng lai nào'}
            description={
              search
                ? 'Không có kết quả trùng khớp với từ khóa tìm kiếm.'
                : activeTab === 'MEMBER'
                ? 'Các hội viên sau khi đăng ký gói tập sẽ xuất hiện tại đây.'
                : 'Khách hàng check-in vé lượt hoặc tạo hồ sơ vãng lai sẽ xuất hiện tại đây.'
            }
          />
        </Card>
      ) : (
        <Card padded={false} className="overflow-hidden rounded-2xl border border-stone-200 shadow-sm dark:border-zinc-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
                  <th className="px-5 py-3.5">Khách hàng</th>
                  <th className="px-5 py-3.5">Số điện thoại</th>
                  <th className="px-5 py-3.5">Chi nhánh chính</th>
                  <th className="px-5 py-3.5">Gói tập & Hạn dùng</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/60">
                {data?.items.map((c) => {
                  const gradient = getAvatarGradient(c.fullName);
                  const isGuestCode = c.customerCode.startsWith('GUEST');

                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group transition-colors hover:bg-stone-50/80 dark:hover:bg-zinc-900/60"
                    >
                      {/* Customer Name & Avatar */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-display text-xs font-bold shadow-sm ${gradient}`}
                          >
                            {getInitials(c.fullName)}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/owner/customers/${c.id}`}
                              className="font-display font-semibold text-zinc-900 transition-colors group-hover:text-emerald-700 hover:underline dark:text-zinc-100 dark:group-hover:text-emerald-400"
                            >
                              {c.fullName}
                            </Link>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span
                                className={`inline-block rounded px-1.5 py-0.2 text-[10px] font-mono font-semibold ${
                                  isGuestCode
                                    ? 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                }`}
                              >
                                {c.customerCode}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-4 text-zinc-700 dark:text-zinc-300">
                        {c.phone ? (
                          <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-800 dark:text-zinc-200">
                            <Phone size={13} className="text-zinc-400" />
                            <span>{c.phone}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>

                      {/* Branch */}
                      <td className="px-5 py-4 text-zinc-700 dark:text-zinc-300">
                        {c.homeBranchName ? (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                            <MapPin size={13} className="text-zinc-400 shrink-0" />
                            <span className="truncate">{c.homeBranchName}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>

                      {/* Package info */}
                      <td className="px-5 py-4 text-zinc-700 dark:text-zinc-300">
                        {c.currentMembership ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                              {c.currentMembership.packageName}
                            </span>
                            {c.currentMembership.startDate && (
                              <span className="text-xs text-zinc-400">
                                Đăng ký: <strong className="text-zinc-600 dark:text-zinc-300 font-mono">{formatDate(c.currentMembership.startDate)}</strong>
                              </span>
                            )}
                            <span className="text-xs text-zinc-400">
                              Hạn đến: <strong className="text-zinc-600 dark:text-zinc-300 font-mono">{formatDate(c.currentMembership.endDate)}</strong>
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-zinc-400">
                            <Ticket size={14} />
                            <span>Chưa có gói dài hạn</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-stone-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              c.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                            }`}
                          />
                          {STATUS_LABELS[c.status] ?? c.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <Button
                          to={`/owner/customers/${c.id}`}
                          variant="ghost"
                          size="sm"
                          className="px-3! py-1! text-xs font-medium"
                        >
                          Chi tiết <ArrowRight size={12} />
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination Footer (Always visible when data is loaded) */}
      {data && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 text-sm">
          <div className="flex flex-wrap items-center gap-4 text-zinc-500 dark:text-zinc-400">
            <span>
              Hiển thị <strong className="font-semibold text-zinc-800 dark:text-zinc-200">{startItem} - {endItem}</strong> trong tổng số <strong className="font-semibold text-zinc-800 dark:text-zinc-200">{data.total}</strong> khách hàng
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs">Hiển thị</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 shadow-sm outline-none transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
              >
                <option value={10}>10 hàng / trang</option>
                <option value={20}>20 hàng / trang</option>
                <option value={50}>50 hàng / trang</option>
              </select>
            </div>
          </div>

          {/* Page Buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 text-xs"
            >
              <CaretLeft size={14} />
              <span>Trước</span>
            </Button>

            {getPageNumbers(data.page, data.totalPages).map((pNum, idx) =>
              typeof pNum === 'number' ? (
                <button
                  key={idx}
                  onClick={() => setPage(pNum)}
                  className={`h-8 min-w-[32px] rounded-lg px-2 text-xs font-semibold transition-all ${
                    pNum === data.page
                      ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500'
                      : 'text-zinc-600 hover:bg-stone-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {pNum}
                </button>
              ) : (
                <span key={idx} className="px-1 text-xs text-zinc-400">
                  ...
                </span>
              )
            )}

            <Button
              variant="secondary"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              className="px-2.5 py-1 text-xs"
            >
              <span>Sau</span>
              <CaretRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
