import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Users, ArrowsClockwise, CheckCircle, ShieldCheck, Buildings, Calendar } from '@phosphor-icons/react';
import type { Plan } from '../../api/plans';
import { listPlanSubscribers, applyPlanToSubscriptions } from '../../api/plans';
import StatusBadge from '../../components/StatusBadge';

interface TenantSubscribersModalProps {
  plan: Plan;
  isOpen: boolean;
  onClose: () => void;
}

export default function TenantSubscribersModal({
  plan,
  isOpen,
  onClose,
}: TenantSubscribersModalProps) {
  const queryClient = useQueryClient();
  const [selectedSubIds, setSelectedSubIds] = useState<Set<string>>(new Set());
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: subscribers, isLoading } = useQuery({
    queryKey: ['plan-subscribers', plan.id],
    queryFn: () => listPlanSubscribers(plan.id),
    enabled: isOpen,
  });

  const applyMutation = useMutation({
    mutationFn: (ids: string[]) => applyPlanToSubscriptions(plan.id, ids),
    onSuccess: (data) => {
      setSuccessMsg(`Đã đồng bộ thành công cấu hình mới cho ${data.updatedCount} phòng gym.`);
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setTimeout(() => setSuccessMsg(null), 4000);
      setSelectedSubIds(new Set());
    },
  });

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedSubIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (!subscribers) return;
    if (selectedSubIds.size === subscribers.length) {
      setSelectedSubIds(new Set());
    } else {
      setSelectedSubIds(new Set(subscribers.map((s) => s.id)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Buildings className="h-4.5 w-4.5" weight="bold" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
                Doanh nghiệp đang dùng ({plan.name})
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {subscribers?.length ?? 0} phòng gym đang liên kết với gói cước này.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Header Banner */}
        <div className="border-b border-zinc-100 bg-zinc-50/70 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-850/50">
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={subscribers && subscribers.length > 0 && selectedSubIds.size === subscribers.length}
                onChange={selectAll}
                className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Chọn tất cả ({subscribers?.length ?? 0})</span>
            </label>

            <button
              type="button"
              disabled={selectedSubIds.size === 0 || applyMutation.isPending}
              onClick={() => applyMutation.mutate(Array.from(selectedSubIds))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-500 disabled:opacity-40"
            >
              <ArrowsClockwise className={`h-3.5 w-3.5 ${applyMutation.isPending ? 'animate-spin' : ''}`} />
              <span>Đồng bộ cho {selectedSubIds.size || 0} tenant</span>
            </button>
          </div>
        </div>

        {/* Body List */}
        <div className="flex-1 overflow-y-auto p-6">
          {successMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" weight="bold" />
              <span>{successMsg}</span>
            </div>
          )}

          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
              ))}
            </div>
          )}

          {!isLoading && subscribers?.length === 0 && (
            <div className="py-12 text-center text-xs text-zinc-400">
              Hiện tại chưa có phòng gym nào đang sử dụng gói này.
            </div>
          )}

          {!isLoading && (
            <div className="space-y-3">
              {subscribers?.map((sub) => {
                const isChecked = selectedSubIds.has(sub.id);
                const tenant = sub.tenants;

                return (
                  <label
                    key={sub.id}
                    className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all ${
                      isChecked
                        ? 'border-blue-300 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-950/20'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelect(sub.id)}
                      className="mt-1 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                          {tenant?.name || 'Tên phòng gym'}
                        </span>
                        <StatusBadge status={sub.status} />
                      </div>

                      <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-zinc-400">
                        <span>Code: {tenant?.code}</span>
                        <span>·</span>
                        <span>Tenant ID: {sub.tenant_id.slice(0, 8)}...</span>
                      </div>

                      <div className="mt-2.5 flex items-center gap-4 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-zinc-400" />
                          Bắt đầu: {new Date(sub.start_date || (sub as any).created_at || Date.now()).toLocaleDateString('vi-VN')}
                        </span>
                        {sub.end_date && (
                          <span>
                            Hết hạn: {new Date(sub.end_date).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-850">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
