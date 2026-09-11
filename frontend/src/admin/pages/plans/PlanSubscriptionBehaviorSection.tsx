import { useState } from 'react';
import { ShieldCheck, Info, Sparkle, Warning, ArrowsClockwise } from '@phosphor-icons/react';
import type { Plan } from '../../api/plans';

interface PlanSubscriptionBehaviorSectionProps {
  plan: Plan;
  onApplyToExistingClick?: () => void;
}

export default function PlanSubscriptionBehaviorSection({
  plan,
  onApplyToExistingClick,
}: PlanSubscriptionBehaviorSectionProps) {
  const [applyNew, setApplyNew] = useState(true);
  const [applyExisting, setApplyExisting] = useState(false);
  const [keepLegacyPrice, setKeepLegacyPrice] = useState(true);
  const [keepLegacyFeatures, setKeepLegacyFeatures] = useState(true);
  const [autoMigrateNextCycle, setAutoMigrateNextCycle] = useState(false);

  const subsCount = plan._count?.subscriptions ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Quy tắc Áp dụng Thuê bao & Snapshot (Subscription Behavior)
        </h3>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Thiết lập cách các thay đổi giá cước, tính năng và định mức ảnh hưởng tới khách hàng mới và khách hàng đang sử dụng.
        </p>
      </div>

      {/* Snapshot explanation card */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" weight="bold" />
          <div className="text-xs">
            <h4 className="font-semibold text-emerald-900 dark:text-emerald-200">
              Kiến trúc Snapshot Cách ly (Snapshot Isolation Architecture)
            </h4>
            <p className="mt-1 text-emerald-800/90 dark:text-emerald-300/80 leading-relaxed">
              Mỗi khi một tenant đăng ký hoặc gia hạn gói, hệ thống sao chép một bản chụp (snapshot) độc lập toàn bộ tính năng và giới hạn vào bảng thuê bao của tenant đó.
              Mọi thay đổi trên trang này mặc định <strong>chỉ áp dụng cho các lượt ký hợp đồng mới</strong>, không làm gián đoạn phòng gym đang vận hành ổn định.
            </p>
          </div>
        </div>
      </div>

      {/* Policy checkboxes */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Tùy chọn kế thừa & Chuyển đổi
        </h4>

        <div className="mt-4 space-y-4">
          {/* 1. Apply to new tenants */}
          <label className="flex items-start gap-3 rounded-lg border border-zinc-200/80 p-3.5 transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-850">
            <input
              type="checkbox"
              checked={applyNew}
              onChange={(e) => setApplyNew(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-800"
            />
            <div className="text-xs">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Áp dụng ngay cho các tenant đăng ký mới
              </span>
              <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
                Bất kỳ phòng gym nào tạo tài khoản hoặc chuyển sang gói này sẽ nhận cấu hình hiện tại.
              </p>
            </div>
          </label>

          {/* 2. Keep old price for existing tenants */}
          <label className="flex items-start gap-3 rounded-lg border border-zinc-200/80 p-3.5 transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-850">
            <input
              type="checkbox"
              checked={keepLegacyPrice}
              onChange={(e) => setKeepLegacyPrice(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-800"
            />
            <div className="text-xs">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Bảo lưu giá hợp đồng cũ cho tenant hiện tại (Grandfathering Price)
              </span>
              <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
                Không tự ý tăng giá hoá đơn tự động định kỳ đối với các phòng gym đã thanh toán trước đó.
              </p>
            </div>
          </label>

          {/* 3. Keep old features for existing tenants */}
          <label className="flex items-start gap-3 rounded-lg border border-zinc-200/80 p-3.5 transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-850">
            <input
              type="checkbox"
              checked={keepLegacyFeatures}
              onChange={(e) => setKeepLegacyFeatures(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-800"
            />
            <div className="text-xs">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Giữ nguyên tính năng & định mức cũ của tenant hiện tại
              </span>
              <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
                Tránh trường hợp giảm hạn mức dẫn đến việc tenant bị khóa chức năng đột ngột.
              </p>
            </div>
          </label>

          {/* 4. Auto migrate on next renewal */}
          <label className="flex items-start gap-3 rounded-lg border border-zinc-200/80 p-3.5 transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-850">
            <input
              type="checkbox"
              checked={autoMigrateNextCycle}
              onChange={(e) => setAutoMigrateNextCycle(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-800"
            />
            <div className="text-xs">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Tự động đồng bộ sang phiên bản mới khi kết thúc chu kỳ thanh toán
              </span>
              <p className="mt-0.5 text-zinc-500 dark:text-zinc-400">
                Khi hợp đồng của tenant hết hạn và họ thanh toán chu kỳ kế tiếp, hệ thống sẽ tự cập nhật snapshot mới.
              </p>
            </div>
          </label>
        </div>

        {/* Action to manually sync / apply snapshot to active subscribers */}
        {subsCount > 0 && onApplyToExistingClick && (
          <div className="mt-5 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
            <div className="text-xs">
              <span className="font-semibold text-blue-900 dark:text-blue-200">
                Đồng bộ có chủ đích cho {subsCount} doanh nghiệp đang sử dụng
              </span>
              <p className="mt-0.5 text-blue-800/80 dark:text-blue-300/80">
                Chọn danh sách cụ thể các phòng gym để ghi đè snapshot mới ngay lập tức.
              </p>
            </div>
            <button
              type="button"
              onClick={onApplyToExistingClick}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-500"
            >
              <ArrowsClockwise className="h-3.5 w-3.5" />
              <span>Đồng bộ cho Tenant...</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
