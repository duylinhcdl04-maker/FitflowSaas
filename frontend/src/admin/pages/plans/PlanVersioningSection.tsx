import { useState } from 'react';
import { GitBranch, Plus, ClockCounterClockwise, CheckCircle, Archive, Copy } from '@phosphor-icons/react';
import type { Plan } from '../../api/plans';

interface PlanVersioningSectionProps {
  plan: Plan;
  onCreateNewVersion: () => void;
  onDuplicatePlan: () => void;
}

export default function PlanVersioningSection({
  plan,
  onCreateNewVersion,
  onDuplicatePlan,
}: PlanVersioningSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Quản lý Phiên bản Gói (Plan Versioning & History)
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Theo dõi các phiên bản cấu hình theo thời gian. Đảm bảo hợp đồng cũ không bị ghi đè khi cập nhật gói mới.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDuplicatePlan}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Nhân bản gói</span>
          </button>
          <button
            type="button"
            onClick={onCreateNewVersion}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500"
          >
            <Plus className="h-3.5 w-3.5" weight="bold" />
            <span>Tạo version mới</span>
          </button>
        </div>
      </div>

      {/* Version timeline list */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Lịch sử phiên bản phát hành
        </h4>

        <div className="mt-4 space-y-4">
          {/* Version 2 - Active */}
          <div className="relative flex items-start gap-4 rounded-xl border border-emerald-300 bg-emerald-50/30 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white shadow-xs">
              v2
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Phiên bản hiện tại (v2)</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                  <CheckCircle className="h-3 w-3" weight="bold" />
                  Đang phát hành
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Hiệu lực từ 01/09/2026 · Áp dụng cho toàn bộ tenant đăng ký mới từ sau ngày phát hành.
              </p>
              <div className="mt-2.5 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                <span>Giá: {Number(plan.price) === 0 ? 'Miễn phí' : `${Number(plan.price).toLocaleString('vi-VN')} ₫`}</span>
                <span>·</span>
                <span>{plan._count?.subscriptions ?? 0} tenants đang sử dụng</span>
              </div>
            </div>
          </div>

          {/* Version 1 - Archived */}
          <div className="relative flex items-start gap-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-850/40">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-xs font-bold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
              v1
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Phiên bản cũ (v1)</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  <Archive className="h-3 w-3" />
                  Đã lưu trữ
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Hiệu lực từ 01/01/2026 đến 31/08/2026 · Các hợp đồng cũ trước ngày 01/09/2026 vẫn được tiếp tục bảo lưu quyền lợi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
