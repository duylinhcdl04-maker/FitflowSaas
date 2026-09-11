import {
  Buildings,
  Globe,
  Coins,
  Clock,
  FloppyDisk,
  EnvelopeSimple,
} from '@phosphor-icons/react';
import type { TenantDefaultSettings } from '../../api/settings';
import FormField, { inputClass } from '../../components/FormField';
import Button from '../../components/Button';
import Toggle from '../../components/Toggle';

interface TenantDefaultsTabProps {
  data: TenantDefaultSettings;
  onChange: (data: TenantDefaultSettings) => void;
  onSave: () => void;
  isSaving: boolean;
  error?: string;
  updatedAt?: string | null;
}

export default function TenantDefaultsTab({
  data,
  onChange,
  onSave,
  isSaving,
  error,
  updatedAt,
}: TenantDefaultsTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
                <Buildings className="h-5 w-5" weight="duotone" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Cấu hình Mặc định cho Phòng Gym mới (Tenant Defaults)
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Các thông số khởi tạo tự động khi có Tenant mới đăng ký dùng thử phần mềm.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Thời hạn dùng thử mặc định (Ngày)" htmlFor="trialDays">
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    id="trialDays"
                    type="number"
                    min={1}
                    max={90}
                    className={`${inputClass} pl-9`}
                    placeholder="14"
                    value={data.trialDays ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        trialDays: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </FormField>

              <FormField label="Số chi nhánh tối đa dùng thử" htmlFor="maxBranchesTrial">
                <div className="relative">
                  <Buildings className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    id="maxBranchesTrial"
                    type="number"
                    min={1}
                    max={10}
                    className={`${inputClass} pl-9`}
                    placeholder="1"
                    value={data.maxBranchesTrial ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        maxBranchesTrial: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
              </FormField>

              <FormField label="Múi giờ chuẩn hệ thống" htmlFor="defaultTimezone">
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <select
                    id="defaultTimezone"
                    className={`${inputClass} pl-9`}
                    value={data.defaultTimezone ?? 'Asia/Ho_Chi_Minh'}
                    onChange={(e) =>
                      onChange({ ...data, defaultTimezone: e.target.value })
                    }
                  >
                    <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7 - Việt Nam)</option>
                    <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                    <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                    <option value="UTC">UTC (Universal Coordinated Time)</option>
                  </select>
                </div>
              </FormField>

              <FormField label="Đơn vị tiền tệ hiển thị" htmlFor="defaultCurrency">
                <div className="relative">
                  <Coins className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <select
                    id="defaultCurrency"
                    className={`${inputClass} pl-9`}
                    value={data.defaultCurrency ?? 'VND'}
                    onChange={(e) =>
                      onChange({ ...data, defaultCurrency: e.target.value })
                    }
                  >
                    <option value="VND">VND (Việt Nam Đồng)</option>
                    <option value="USD">USD (Đô la Mỹ)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>
              </FormField>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
                <div className="flex items-center gap-3">
                  <EnvelopeSimple className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Bắt buộc xác thực Email chủ phòng (Owner Email Verification)
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Yêu cầu chủ phòng gym nhấp vào liên kết xác thực trong email trước khi cho phép truy cập.
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={data.requireEmailVerification ?? true}
                  onChange={(checked) =>
                    onChange({ ...data, requireEmailVerification: checked })
                  }
                />
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
              {isSaving ? 'Đang lưu...' : 'Lưu cấu hình mặc định'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
