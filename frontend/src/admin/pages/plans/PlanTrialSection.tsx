import { useState } from 'react';
import { HourglassSimple, Sparkle, ShieldCheck, ArrowRight } from '@phosphor-icons/react';
import type { Plan } from '../../api/plans';
import { inputClass } from '../../components/FormField';
import Toggle from '../../components/Toggle';

interface PlanTrialSectionProps {
  plan: Plan;
  allPlans: Plan[];
  trialDays: number;
  onChangeTrialDays: (days: number) => void;
  disabled?: boolean;
}

export default function PlanTrialSection({
  plan,
  allPlans,
  trialDays,
  onChangeTrialDays,
  disabled,
}: PlanTrialSectionProps) {
  const isTrial = plan.trial_days > 0;
  const [autoConvert, setAutoConvert] = useState(true);
  const [targetPlanCode, setTargetPlanCode] = useState('BASIC');
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [allowMultipleTrial, setAllowMultipleTrial] = useState(false);
  const [gracePeriodDays, setGracePeriodDays] = useState(3);
  const [expiryAction, setExpiryAction] = useState<'SUSPEND' | 'READONLY' | 'CONVERT'>('SUSPEND');

  const paidPlans = allPlans.filter((p) => p.trial_days === 0 && p.id !== plan.id);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Chính sách Dùng thử & Chuyển đổi (Trial Experience)
        </h3>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Cấu hình thời gian dùng thử miễn phí, điều kiện kích hoạt và hành vi sau khi hết hạn trải nghiệm.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Trial duration in days */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            Thời lượng dùng thử (Số ngày)
          </label>
          <div className="relative mt-2">
            <input
              type="number"
              min={0}
              max={90}
              disabled={disabled}
              value={trialDays}
              onChange={(e) => onChangeTrialDays(Math.max(0, Number(e.target.value) || 0))}
              className={`w-full pr-14 font-bold ${inputClass}`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
              ngày
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            {trialDays === 0
              ? 'Gói không có thời gian dùng thử (thanh toán ngay khi kích hoạt)'
              : `Tenant được sử dụng toàn bộ tính năng trong ${trialDays} ngày kể từ lúc tạo tài khoản.`}
          </p>
        </div>

        {/* Grace Period */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            Thời gian ân hạn gia hạn (Grace Period)
          </label>
          <div className="relative mt-2">
            <input
              type="number"
              min={0}
              max={30}
              disabled={disabled}
              value={gracePeriodDays}
              onChange={(e) => setGracePeriodDays(Math.max(0, Number(e.target.value) || 0))}
              className={`w-full pr-14 font-bold ${inputClass}`}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
              ngày
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            Khoảng thời gian giữ dữ liệu và cho phép tiếp tục truy cập sau ngày hết hạn trước khi khóa tính năng.
          </p>
        </div>
      </div>

      {/* Advanced Trial Policies */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Quy tắc kích hoạt & Chuyển đổi
        </h4>

        <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
          {/* 1. Payment method required */}
          <div className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Yêu cầu phương thức thanh toán trước khi kích hoạt
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Yêu cầu tenant liên kết thẻ tín dụng hoặc tài khoản ngân hàng trước khi bắt đầu dùng thử.
              </p>
            </div>
            <Toggle checked={paymentRequired} onChange={setPaymentRequired} disabled={disabled} />
          </div>

          {/* 2. Allow multiple trials */}
          <div className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Cho phép dùng thử lại trên cùng số điện thoại/MST
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Ngăn chặn việc đăng ký dùng thử nhiều lần bằng cách khóa số điện thoại và tên miền phụ.
              </p>
            </div>
            <Toggle checked={allowMultipleTrial} onChange={setAllowMultipleTrial} disabled={disabled} />
          </div>

          {/* 3. Auto convert to paid plan */}
          <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Tự động đề xuất chuyển đổi gói khi hết hạn
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Chọn gói trả phí mục tiêu để hệ thống tạo hóa đơn và nhắc nhở gia hạn.
              </p>
            </div>
            <select
              disabled={disabled}
              value={targetPlanCode}
              onChange={(e) => setTargetPlanCode(e.target.value)}
              className={`w-52 ${inputClass}`}
            >
              {paidPlans.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Action after expiration */}
          <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Hành vi khi hết hạn mà chưa thanh toán
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Xử lý quyền truy cập dữ liệu của phòng gym sau khi hết hạn dùng thử và thời gian ân hạn.
              </p>
            </div>
            <select
              disabled={disabled}
              value={expiryAction}
              onChange={(e) => setExpiryAction(e.target.value as any)}
              className={`w-52 ${inputClass}`}
            >
              <option value="SUSPEND">Tạm ngưng đăng nhập (Suspended)</option>
              <option value="READONLY">Chế độ chỉ xem dữ liệu (Read-only)</option>
              <option value="CONVERT">Tự động chuyển sang gói Cơ bản</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
