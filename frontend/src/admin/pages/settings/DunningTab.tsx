import {
  CurrencyDollar,
  Clock,
  WarningCircle,
  LockKey,
  FloppyDisk,
  Sparkle,
  ShieldWarning,
} from '@phosphor-icons/react';
import type { DunningSettings } from '../../api/settings';
import FormField, { inputClass } from '../../components/FormField';
import Button from '../../components/Button';

interface DunningTabProps {
  data: DunningSettings;
  onChange: (data: DunningSettings) => void;
  onSave: () => void;
  isSaving: boolean;
  error?: string;
  updatedAt?: string | null;
}

function csv(list?: number[]) {
  return (list ?? []).join(', ');
}

function parseCsvNumbers(text: string) {
  return text
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export default function DunningTab({
  data,
  onChange,
  onSave,
  isSaving,
  error,
  updatedAt,
}: DunningTabProps) {
  const reminderDaysStr = csv(data.reminderDays);

  const setPreset = (preset: number[]) => {
    onChange({ ...data, reminderDays: preset });
  };

  const pastDue = data.pastDueDays ?? 3;
  const suspend = data.suspendQueueDays ?? 7;
  const grace = data.gracePeriodDays ?? 14;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <CurrencyDollar className="h-5 w-5" weight="duotone" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Chính sách Thu nợ & Xử lý Quá hạn (Dunning)
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Quy định các mốc tự động gửi email nhắc nợ, chuyển trạng thái và tạm ngưng dịch vụ SaaS.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-6">
              <div>
                <FormField
                  label="Lịch gửi email nhắc nợ (Số ngày sau khi phát hành hóa đơn)"
                  htmlFor="reminderDays"
                >
                  <input
                    id="reminderDays"
                    className={inputClass}
                    placeholder="3, 7, 14"
                    value={reminderDaysStr}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        reminderDays: parseCsvNumbers(e.target.value),
                      })
                    }
                  />
                </FormField>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Gợi ý mẫu:</span>
                  {[
                    [3, 7, 14],
                    [1, 3, 5, 7],
                    [7, 14, 21],
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPreset(preset)}
                      className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      {preset.join(', ')} ngày
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Ngưỡng chuyển PAST_DUE (ngày quá hạn)"
                  htmlFor="pastDueDays"
                >
                  <div className="relative">
                    <WarningCircle className="absolute left-3 top-3 h-4 w-4 text-amber-500" />
                    <input
                      id="pastDueDays"
                      type="number"
                      min={1}
                      max={60}
                      className={`${inputClass} pl-9`}
                      value={data.pastDueDays ?? ''}
                      placeholder="3"
                      onChange={(e) =>
                        onChange({
                          ...data,
                          pastDueDays: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                    />
                  </div>
                </FormField>

                <FormField
                  label="Ngưỡng vào hàng chờ khoá (ngày)"
                  htmlFor="suspendQueueDays"
                >
                  <div className="relative">
                    <LockKey className="absolute left-3 top-3 h-4 w-4 text-red-500" />
                    <input
                      id="suspendQueueDays"
                      type="number"
                      min={1}
                      max={90}
                      className={`${inputClass} pl-9`}
                      value={data.suspendQueueDays ?? ''}
                      placeholder="7"
                      onChange={(e) =>
                        onChange({
                          ...data,
                          suspendQueueDays: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                    />
                  </div>
                </FormField>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Thời gian ân hạn tối đa (Grace Period - ngày)"
                  htmlFor="gracePeriodDays"
                >
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
                    <input
                      id="gracePeriodDays"
                      type="number"
                      min={1}
                      max={180}
                      className={`${inputClass} pl-9`}
                      value={data.gracePeriodDays ?? ''}
                      placeholder="14"
                      onChange={(e) =>
                        onChange({
                          ...data,
                          gracePeriodDays: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                    />
                  </div>
                </FormField>

                <FormField
                  label="Tự động Hủy hợp đồng sau (ngày)"
                  htmlFor="autoCancelDays"
                >
                  <div className="relative">
                    <ShieldWarning className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <input
                      id="autoCancelDays"
                      type="number"
                      min={1}
                      max={365}
                      className={`${inputClass} pl-9`}
                      value={data.autoCancelDays ?? ''}
                      placeholder="30"
                      onChange={(e) =>
                        onChange({
                          ...data,
                          autoCancelDays: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                    />
                  </div>
                </FormField>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {updatedAt ? (
              <span className="text-xs text-zinc-400">
                Cập nhật lần cuối: {new Date(updatedAt).toLocaleString('vi-VN')}
              </span>
            ) : (
              <span />
            )}
            <Button
              variant="primary"
              size="md"
              disabled={isSaving}
              onClick={onSave}
              className="flex items-center gap-2 shadow-md shadow-emerald-600/20"
            >
              <FloppyDisk className="h-4 w-4" />
              {isSaving ? 'Đang lưu...' : 'Lưu chính sách thu nợ'}
            </Button>
          </div>
        </div>

        {/* Visual Lifecycle Timeline (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <Sparkle className="h-5 w-5 text-amber-500" weight="fill" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Sơ đồ Vòng đời Xử lý Nợ SaaS
              </h3>
            </div>

            <div className="mt-6 flex flex-col gap-6 relative">
              {/* Timeline step 1 */}
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  1
                </div>
                <div className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-emerald-900 dark:text-emerald-200">
                      Phát hành Hóa đơn
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Ngày 0</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    Tenant nhận email thông báo đến hạn gia hạn gói cước định kỳ.
                  </p>
                </div>
              </div>

              {/* Timeline step 2 */}
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 font-bold text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  2
                </div>
                <div className="flex-1 rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-amber-900 dark:text-amber-200">
                      Chuyển PAST_DUE & Gửi Email Nhắc
                    </span>
                    <span className="text-[10px] font-bold text-amber-600 uppercase">
                      +{pastDue} Ngày
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    Kích hoạt dunning email theo các mốc ({reminderDaysStr || '3, 7, 14'}). Xuất hiện banner nợ phí.
                  </p>
                </div>
              </div>

              {/* Timeline step 3 */}
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
                  3
                </div>
                <div className="flex-1 rounded-xl border border-red-200 bg-red-50/50 p-3 dark:border-red-900/40 dark:bg-red-950/20">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-red-900 dark:text-red-200">
                      Tạm ngưng dịch vụ (SUSPENDED)
                    </span>
                    <span className="text-[10px] font-bold text-red-600 uppercase">
                      +{suspend} Ngày
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    Khóa quyền thao tác ghi dữ liệu của phòng gym. Chỉ cho phép chủ phòng gym thanh toán.
                  </p>
                </div>
              </div>

              {/* Timeline step 4 */}
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 font-bold text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  4
                </div>
                <div className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-700 dark:bg-zinc-800/40">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">
                      Lưu trữ & Hủy hợp đồng
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">
                      +{grace} Ngày
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Đóng băng tài nguyên tenant, đưa vào diện thanh lý dữ liệu lưu trữ.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
