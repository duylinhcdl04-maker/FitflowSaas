import {
  BellRinging,
  EnvelopeSimple,
  FloppyDisk,
  ChatCircleDots,
  ShieldWarning,
  Sparkle,
} from '@phosphor-icons/react';
import type { NotificationSettings } from '../../api/settings';
import FormField, { inputClass } from '../../components/FormField';
import Button from '../../components/Button';
import Toggle from '../../components/Toggle';
import TelegramChannelCard from './TelegramChannelCard';

interface NotificationsTabProps {
  data: NotificationSettings;
  onChange: (data: NotificationSettings) => void;
  onSave: () => void;
  isSaving: boolean;
  error?: string;
  updatedAt?: string | null;
  onRefresh: () => void;
  onToast: (message: string, type?: 'success' | 'error') => void;
}

export default function NotificationsTab({
  data,
  onChange,
  onSave,
  isSaving,
  error,
  updatedAt,
  onRefresh,
  onToast,
}: NotificationsTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Notifications & Channels (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Telegram Dedicated Channel Card */}
          <TelegramChannelCard
            telegram={data.telegram}
            onRefresh={onRefresh}
            onToast={onToast}
          />

          {/* Slack & Technical Alert Email Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
                <BellRinging className="h-5 w-5" weight="duotone" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Kênh Slack & Email Khẩn cấp
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Cấu hình tiếp nhận cảnh báo kỹ thuật qua Slack Webhook và Email nội bộ.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <FormField label="Slack Incoming Webhook URL" htmlFor="slackWebhookUrl">
                <div className="relative">
                  <ChatCircleDots className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    id="slackWebhookUrl"
                    className={`${inputClass} pl-9`}
                    placeholder="https://hooks.slack.com/services/..."
                    value={data.slackWebhookUrl ?? ''}
                    onChange={(e) =>
                      onChange({ ...data, slackWebhookUrl: e.target.value })
                    }
                  />
                </div>
              </FormField>

              <FormField
                label="Email nhận thông báo khẩn cấp kỹ thuật (DevOps)"
                htmlFor="systemAlertEmail"
              >
                <div className="relative">
                  <EnvelopeSimple className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <input
                    id="systemAlertEmail"
                    type="email"
                    className={`${inputClass} pl-9`}
                    placeholder="devops@fitflow.vn"
                    value={data.systemAlertEmail ?? ''}
                    onChange={(e) =>
                      onChange({ ...data, systemAlertEmail: e.target.value })
                    }
                  />
                </div>
              </FormField>
            </div>

            {/* Notification Triggers */}
            <div className="mt-6 flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Sự kiện gửi cảnh báo tự động
              </h3>

              <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
                <div className="flex items-center gap-3">
                  <BellRinging className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Có Tenant mới đăng ký dịch vụ
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Gửi thông báo tức thì khi có phòng gym mới hoàn tất tạo tài khoản.
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={data.notifyOnNewTenant ?? true}
                  onChange={(checked) =>
                    onChange({ ...data, notifyOnNewTenant: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
                <div className="flex items-center gap-3">
                  <ShieldWarning className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Cảnh báo sự cố bảo mật & Đăng nhập đáng ngờ
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Báo động ngay khi phát hiện đăng nhập IP lạ hoặc brute-force mật khẩu.
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={data.notifyOnSecurityAlert ?? true}
                  onChange={(checked) =>
                    onChange({ ...data, notifyOnSecurityAlert: checked })
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
              className="flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <FloppyDisk className="h-4 w-4" />
              {isSaving ? 'Đang lưu...' : 'Lưu cấu hình thông báo'}
            </Button>
          </div>
        </div>

        {/* Informative Side Panel (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="rounded-2xl border border-zinc-200 bg-linear-to-br from-zinc-50 to-sky-50/30 p-6 shadow-xs dark:border-zinc-800 dark:from-zinc-900 dark:to-sky-950/10">
            <div className="flex items-center gap-2 border-b border-zinc-200/60 pb-4 dark:border-zinc-800">
              <Sparkle className="h-5 w-5 text-sky-600 dark:text-sky-400" weight="fill" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Cơ chế Cảnh báo Outbound
              </h3>
            </div>

            <div className="mt-4 space-y-4 text-xs text-zinc-600 dark:text-zinc-400">
              <p>
                FitFlow sử dụng <strong>Telegram Bot API trực tiếp</strong> với phương thức <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono text-[11px]">sendMessage</code> để đẩy tin tức thời đến kênh nhận.
              </p>
              <div className="rounded-xl border border-sky-200/60 bg-white/80 p-3 dark:border-sky-900/40 dark:bg-zinc-800/80">
                <span className="font-bold text-zinc-800 dark:text-zinc-200 block mb-1">
                  Không cần mở cổng Webhook
                </span>
                <p className="text-[11px] text-zinc-500">
                  Hệ thống không yêu cầu cấu hình Domain công khai hay lắng nghe inbound Webhook từ Telegram.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
