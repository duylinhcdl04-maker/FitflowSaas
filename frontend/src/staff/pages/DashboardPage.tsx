import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Ticket,
  CurrencyCircleDollar,
  IdentificationCard,
  CreditCard,
  SignOut,
  ArrowRight,
  Sparkle,
} from '@phosphor-icons/react';
import {
  getManagerDashboardOverview,
  getCurrentlyInGym,
  manualCheckout,
} from '../../manager/api/manager';
import { useRealtimeInvalidate } from '../../lib/useRealtimeInvalidate';

export default function StaffDashboardPage() {
  const queryClient = useQueryClient();

  // Realtime push (attendance/guestvisit/payment/dashboard events) is the primary update
  // path now; these intervals are just a slow safety net if the socket connection drops.
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['staff-dashboard-overview'],
    queryFn: () => getManagerDashboardOverview(),
    refetchInterval: 60000,
  });

  const { data: inGymMembers = [], isLoading: inGymLoading } = useQuery({
    queryKey: ['staff-currently-in-gym'],
    queryFn: () => getCurrentlyInGym(),
    refetchInterval: 60000,
  });

  useRealtimeInvalidate('dashboard:refresh', [['staff-dashboard-overview']]);
  useRealtimeInvalidate('attendance:updated', [['staff-currently-in-gym'], ['staff-dashboard-overview']]);
  useRealtimeInvalidate('guestvisit:updated', [['staff-dashboard-overview']]);
  useRealtimeInvalidate('payment:confirmed', [['staff-dashboard-overview'], ['staff-currently-in-gym']]);

  const checkoutMutation = useMutation({
    mutationFn: (attendanceId: string) => manualCheckout(attendanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-currently-in-gym'] });
      queryClient.invalidateQueries({ queryKey: ['staff-dashboard-overview'] });
    },
  });

  const statCards = [
    {
      title: 'Lượt Check-in hôm nay',
      value: overview?.kpis?.todayCheckins ?? 0,
      icon: UserCheck,
      color: 'from-blue-500 to-indigo-600',
      bgLight: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      title: 'Hội viên đang ở phòng tập',
      value: overview?.kpis?.currentlyInGym ?? inGymMembers.length,
      icon: Users,
      color: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      title: 'Vé lượt vãng lai hôm nay',
      value: overview?.kpis?.todayGuestsCount ?? 0,
      icon: Ticket,
      color: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    },
    {
      title: 'Doanh thu quầy ca trực',
      value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
        overview?.kpis?.todayRevenue ?? 0,
      ),
      icon: CurrencyCircleDollar,
      color: 'from-purple-500 to-pink-600',
      bgLight: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-100">
            <Sparkle size={16} /> Bảng Điều Khiển Ca Trực Lễ Tân
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white mt-1">
            Chào ca làm việc! Tiếp đón & Phục vụ khách hàng
          </h1>
          <p className="text-xs text-emerald-100/90 mt-1 max-w-xl">
            Theo dõi danh sách khách đang tập luyện, thao tác Check-in/Check-out nhanh và xử lý thu ngân trực tiếp tại quầy.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/staff/checkin"
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-800 shadow hover:bg-emerald-50 transition"
          >
            <IdentificationCard size={18} />
            <span>Check-in Nhanh</span>
          </Link>

          <Link
            to="/staff/pos"
            className="flex items-center gap-2 rounded-xl bg-emerald-950/40 border border-emerald-300/30 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-900/50 transition backdrop-blur-sm"
          >
            <CreditCard size={18} />
            <span>Bán Gói / POS</span>
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">{card.title}</p>
                <p className="font-display text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {overviewLoading ? '...' : card.value}
                </p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.bgLight}`}>
                <Icon size={26} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/staff/checkin"
          className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-500 transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <IdentificationCard size={22} />
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-transform group-hover:translate-x-1" />
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Quầy Lễ Tân Check-in</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Xác nhận ra/vào phòng tập, quét mã & Undo Check-in 15 phút</p>
          </div>
        </Link>

        <Link
          to="/staff/guest-visits"
          className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-amber-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-amber-500 transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              <Ticket size={22} />
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-transform group-hover:translate-x-1" />
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Vé Lượt Khách Vãng Lai</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Tiếp đón khách lẻ 1 buổi, Auto Check-in & Tạm dừng (On-Hold)</p>
          </div>
        </Link>

        <Link
          to="/staff/pos"
          className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500 transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              <CreditCard size={22} />
            </div>
            <ArrowRight size={18} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-transform group-hover:translate-x-1" />
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Bán Gói Tập & POS</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Đăng ký mới, gia hạn gói tập & sinh VietQR chuyển khoản động</p>
          </div>
        </Link>
      </div>

      {/* Currently In Gym Live Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users size={20} className="text-emerald-600 dark:text-emerald-400" />
              Khách Hàng Đang Ở Trong Phòng Tập ({inGymMembers.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Danh sách trực tiếp các hội viên đang hoạt động tại chi nhánh
            </p>
          </div>
          <Link
            to="/staff/checkin"
            className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
          >
            Quản lý Check-in →
          </Link>
        </div>

        {inGymLoading ? (
          <div className="py-8 text-center text-xs text-slate-500">Đang tải danh sách...</div>
        ) : inGymMembers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-xs text-slate-500 dark:border-zinc-800 dark:text-zinc-400">
            Hiện tại không có hội viên nào trong phòng tập.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 dark:border-zinc-800">
                  <th className="py-3 px-3 font-semibold">Hội viên</th>
                  <th className="py-3 px-3 font-semibold">Số điện thoại</th>
                  <th className="py-3 px-3 font-semibold">Giờ Check-in</th>
                  <th className="py-3 px-3 font-semibold">Phương thức</th>
                  <th className="py-3 px-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {inGymMembers.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {m.customerName}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-zinc-300 font-mono">
                      {m.customerPhone || 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-zinc-300 font-mono">
                      {new Date(m.checkInAt).toLocaleTimeString('vi-VN')}
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {m.checkInMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => checkoutMutation.mutate(m.id)}
                        disabled={checkoutMutation.isPending}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950 transition"
                      >
                        <SignOut size={14} /> Check-out
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
