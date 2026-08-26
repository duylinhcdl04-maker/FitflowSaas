import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { ClockCounterClockwise, ShieldCheck } from '@phosphor-icons/react';
import { getManagerAuditLogs } from '../../api/manager';
import Card from '../../../owner/components/Card';
import { Skeleton } from '../../../owner/components/Skeleton';

export default function ManagerReportsPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['manager-audit-logs'],
    queryFn: () => getManagerAuditLogs(),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
            Báo cáo & Audit Log
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Nhật ký thao tác vận hành và nhật ký kiểm toán chi nhánh
          </p>
        </div>
      </div>

      <Card className="border border-slate-200/80 dark:border-zinc-800/80 shadow-xs rounded-xl overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
            <ClockCounterClockwise size={20} className="text-emerald-600 dark:text-emerald-400" />
            Nhật ký thao tác (Audit Log)
          </h2>

          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            {logs?.length || 0} bản ghi
          </span>
        </div>

        {isLoading ? (
          <div className="p-4">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-zinc-300">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 dark:bg-zinc-800/60 dark:text-zinc-400 border-b border-slate-200/80 dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-3 font-semibold">Thời gian</th>
                  <th className="px-5 py-3 font-semibold">Đối tượng</th>
                  <th className="px-5 py-3 font-semibold">Thao tác</th>
                  <th className="px-5 py-3 font-semibold">Vai trò</th>
                  <th className="px-5 py-3 font-semibold">Lý do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {logs && logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-5 py-3.5 text-xs font-mono font-medium text-slate-700 dark:text-zinc-300">
                        {new Date(log.occurred_at).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-zinc-100">
                        {log.entity_type}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-bold tracking-wide px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-medium text-slate-600 dark:text-zinc-400">
                        {log.actor_role}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-zinc-400">
                        {log.reason || '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShieldCheck size={32} className="text-emerald-600 dark:text-emerald-400 opacity-60" />
                        <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                          Chưa có nhật ký ghi nhận tại chi nhánh
                        </p>
                        <p className="text-xs text-slate-400 dark:text-zinc-500">
                          Mọi thao tác thay đổi dữ liệu sẽ được bảo mật và ghi lại tự động tại đây.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
