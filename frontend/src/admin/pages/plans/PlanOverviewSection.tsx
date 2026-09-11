import { useState } from 'react';
import type { Plan } from '../../api/plans';
import { inputClass } from '../../components/FormField';
import StatusBadge from '../../components/StatusBadge';

interface PlanOverviewSectionProps {
  plan: Plan;
  formState: {
    name: string;
    description: string;
    displayOrder: number;
    isPublic: boolean;
    status: 'ACTIVE' | 'INACTIVE';
  };
  onChange: (updates: Partial<PlanOverviewSectionProps['formState']>) => void;
  disabled?: boolean;
}

export default function PlanOverviewSection({
  plan,
  formState,
  onChange,
  disabled,
}: PlanOverviewSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Thông tin cơ bản của gói
        </h3>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Thiết lập tên hiển thị, mô tả tiếp thị, thứ tự xuất hiện và trạng thái kinh doanh.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Plan Name */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Tên gói cước <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            disabled={disabled}
            value={formState.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Ví dụ: Gói Chuyên Nghiệp"
            className={`mt-1.5 w-full ${inputClass}`}
          />
        </div>

        {/* Plan Code */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Mã định danh (Plan Code)
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="text"
              disabled
              value={plan.code}
              className={`w-full bg-zinc-100 font-mono text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 ${inputClass}`}
            />
            <span className="shrink-0 text-[11px] text-zinc-400">Mã cố định</span>
          </div>
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Mô tả gói cước
          </label>
          <textarea
            rows={3}
            disabled={disabled}
            value={formState.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Mô tả mục đích sử dụng và giá trị mang lại cho phòng gym..."
            className={`mt-1.5 w-full resize-none ${inputClass}`}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Trạng thái kinh doanh
          </label>
          <select
            disabled={disabled}
            value={formState.status}
            onChange={(e) => onChange({ status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
            className={`mt-1.5 w-full ${inputClass}`}
          >
            <option value="ACTIVE">Đang bán (Active)</option>
            <option value="INACTIVE">Ngừng bán (Inactive)</option>
          </select>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Chế độ hiển thị (Visibility)
          </label>
          <select
            disabled={disabled}
            value={formState.isPublic ? 'PUBLIC' : 'PRIVATE'}
            onChange={(e) => onChange({ isPublic: e.target.value === 'PUBLIC' })}
            className={`mt-1.5 w-full ${inputClass}`}
          >
            <option value="PUBLIC">Công khai (Hiển thị trang đăng ký)</option>
            <option value="PRIVATE">Nội bộ (Chỉ Super Admin cấp)</option>
          </select>
        </div>

        {/* Display Order */}
        <div>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Thứ tự hiển thị
          </label>
          <input
            type="number"
            min={0}
            disabled={disabled}
            value={formState.displayOrder}
            onChange={(e) => onChange({ displayOrder: Number(e.target.value) || 0 })}
            className={`mt-1.5 w-full ${inputClass}`}
          />
          <p className="mt-1 text-[11px] text-zinc-400">Số càng nhỏ hiển thị càng trước trên bảng giá.</p>
        </div>
      </div>

      {/* Audit Meta Box */}
      <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-850/40 dark:text-zinc-400">
        <h4 className="font-semibold text-zinc-700 dark:text-zinc-300">Thông tin hệ thống & Kiểm toán</h4>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div>
            <span className="text-zinc-400">ID hệ thống:</span>{' '}
            <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">{plan.id}</span>
          </div>
          <div>
            <span className="text-zinc-400">Ngày tạo:</span>{' '}
            <span className="text-zinc-700 dark:text-zinc-300">
              {new Date(plan.created_at || Date.now()).toLocaleDateString('vi-VN')}
            </span>
          </div>
          <div>
            <span className="text-zinc-400">Cập nhật lần cuối:</span>{' '}
            <span className="text-zinc-700 dark:text-zinc-300">
              {new Date(plan.updated_at || Date.now()).toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
