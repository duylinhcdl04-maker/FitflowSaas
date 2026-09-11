import { useState } from 'react';
import { X, GitBranch, Warning, Check, Calendar } from '@phosphor-icons/react';
import type { Plan } from '../../api/plans';
import { inputClass } from '../../components/FormField';

interface CreateVersionModalProps {
  plan: Plan;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (versionData: {
    versionName: string;
    effectiveDate: string;
    migrationBehavior: string;
    note?: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export default function CreateVersionModal({
  plan,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: CreateVersionModalProps) {
  const [versionName, setVersionName] = useState('v3');
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [migrationBehavior, setMigrationBehavior] = useState('NEW_ONLY');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      versionName,
      effectiveDate,
      migrationBehavior,
      note,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <GitBranch className="h-4 w-4" weight="bold" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
                Tạo Phiên bản Mới ({plan.name})
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Lưu lại cột mốc cấu hình mới mà không ảnh hưởng tenant đang chạy.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col justify-between overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Warning callout */}
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs dark:border-amber-900/50 dark:bg-amber-950/20">
              <Warning className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" weight="bold" />
              <div className="text-amber-900 dark:text-amber-200">
                <strong>Lưu ý bảo vệ quyền lợi:</strong> Phiên bản mới sẽ không tự động làm thay đổi hợp đồng hoặc giá cước của các phòng gym đang sử dụng phiên bản trước.
              </div>
            </div>

            {/* Version Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Tên định danh phiên bản
              </label>
              <input
                type="text"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="Ví dụ: v3 (Q4-2026)"
                className={`mt-1.5 w-full ${inputClass}`}
              />
            </div>

            {/* Effective Date */}
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Ngày bắt đầu có hiệu lực
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className={`mt-1.5 w-full ${inputClass}`}
              />
            </div>

            {/* Migration Behavior */}
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Hành vi chuyển đổi hợp đồng (Migration Policy)
              </label>
              <div className="mt-2 space-y-2">
                {[
                  {
                    id: 'NEW_ONLY',
                    title: 'Chỉ áp dụng cho tenant đăng ký mới',
                    desc: 'Tenant cũ tiếp tục giữ nguyên phiên bản và mức giá cũ trọn đời.',
                  },
                  {
                    id: 'ALLOW_UPGRADE',
                    title: 'Cho phép tenant hiện tại chủ động nâng cấp',
                    desc: 'Hiển thị thông báo gợi ý nâng cấp phiên bản trong trang quản trị Owner.',
                  },
                  {
                    id: 'MIGRATE_ON_RENEWAL',
                    title: 'Đồng bộ sang phiên bản mới khi gia hạn kỳ tiếp theo',
                    desc: 'Tự động nâng cấp snapshot của tenant khi họ thanh toán chu kỳ tiếp theo.',
                  },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-xs transition ${
                      migrationBehavior === item.id
                        ? 'border-emerald-500 bg-emerald-50/40 text-zinc-900 dark:border-emerald-500 dark:bg-emerald-950/20 dark:text-zinc-100'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-850'
                    }`}
                  >
                    <input
                      type="radio"
                      name="migrationBehavior"
                      value={item.id}
                      checked={migrationBehavior === item.id}
                      onChange={(e) => setMigrationBehavior(e.target.value)}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-semibold">{item.title}</span>
                      <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Ghi chú phát hành (Release notes)
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Lý do cập nhật phiên bản, các tính năng mới bổ sung..."
                className={`mt-1.5 w-full resize-none ${inputClass}`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
            >
              <Check className="h-4 w-4" weight="bold" />
              <span>{isSubmitting ? 'Đang tạo...' : 'Tạo Version Mới'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
