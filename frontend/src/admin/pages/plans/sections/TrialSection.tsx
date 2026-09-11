import { HourglassSimple, ShieldCheck } from '@phosphor-icons/react';

interface TrialSectionProps {
  trialDays: number;
  setTrialDays: (v: number) => void;
}

export default function TrialSection({ trialDays, setTrialDays }: TrialSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-sky-50/70 border border-sky-200/80 dark:bg-sky-950/20 dark:border-sky-800/40 rounded-2xl p-4 flex items-start gap-3">
        <HourglassSimple className="w-5 h-5 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" weight="bold" />
        <div className="text-sm text-sky-900 dark:text-sky-200">
          <p className="font-bold">Dimension 7: Chính sách Dùng thử (Trial Policy)</p>
          <p className="mt-0.5 text-xs text-sky-700/80 dark:text-sky-300/80">
            Cấu hình thời gian dùng thử miễn phí trước khi bắt đầu chu kỳ tính phí chính thức. Đối với các gói thương mại chuẩn (Commercial Plans), giá trị khuyến nghị là 0 ngày hoặc dùng chính sách dùng thử riêng.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-xl space-y-4 shadow-xs">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
            Số ngày dùng thử miễn phí
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              max="90"
              value={trialDays}
              onChange={(e) => setTrialDays(Math.max(0, Number(e.target.value) || 0))}
              className="w-32 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 focus:outline-none"
            />
            <span className="text-sm text-zinc-600 dark:text-zinc-300 font-medium">ngày</span>

            <div className="flex items-center gap-1.5 ml-auto">
              {[0, 7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setTrialDays(d)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    trialDays === d
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                  }`}
                >
                  {d === 0 ? 'Không dùng thử' : `${d} ngày`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-750 rounded-xl space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2 font-bold text-zinc-800 dark:text-zinc-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" weight="bold" />
            <span>Quy tắc vận hành dùng thử:</span>
          </div>
          <p>
            • Khi <span className="font-bold text-zinc-900 dark:text-zinc-100">trial_days = 0</span>: Tenant đăng ký gói này phải thanh toán ngay để kích hoạt tài nguyên (không có trạng thái TRIAL).
          </p>
          <p>
            • Khi <span className="font-bold text-zinc-900 dark:text-zinc-100">trial_days &gt; 0</span>: Tenant được cấp quyền sử dụng miễn phí tương ứng thời gian trên. Khi hết hạn, hệ thống tự động khóa tính năng và nhắc nâng cấp gói.
          </p>
        </div>
      </div>
    </div>
  );
}
