import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPlatformSettings, upsertPlatformSetting, type PlatformSettings } from '../api/settings';
import { apiErrorMessage } from '../api/client';
import Card from '../components/Card';
import Button from '../components/Button';
import Callout from '../components/Callout';
import FormField, { inputClass } from '../components/FormField';
import { Skeleton } from '../components/Skeleton';

interface BrandingForm {
  name: string;
  logoUrl: string;
  senderEmail: string;
  supportDomain: string;
}
interface DunningForm {
  reminderDays: string;
  pastDueDays: string;
  suspendQueueDays: string;
}
interface SecurityForm {
  ipAllowlist: string;
  sessionMinutes: string;
}
interface NotificationsForm {
  slackWebhookUrl: string;
  telegramWebhookUrl: string;
}

function csv(list?: (string | number)[]) {
  return (list ?? []).join(', ');
}
function parseCsvNumbers(text: string) {
  return text
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
}
function parseCsvStrings(text: string) {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function brandingFromData(data?: PlatformSettings): BrandingForm {
  const b = data?.BRANDING.value;
  return { name: b?.name ?? '', logoUrl: b?.logoUrl ?? '', senderEmail: b?.senderEmail ?? '', supportDomain: b?.supportDomain ?? '' };
}
function dunningFromData(data?: PlatformSettings): DunningForm {
  const d = data?.DUNNING.value;
  return {
    reminderDays: csv(d?.reminderDays),
    pastDueDays: d?.pastDueDays !== undefined ? String(d.pastDueDays) : '',
    suspendQueueDays: d?.suspendQueueDays !== undefined ? String(d.suspendQueueDays) : '',
  };
}
function securityFromData(data?: PlatformSettings): SecurityForm {
  const s = data?.SECURITY.value;
  return { ipAllowlist: csv(s?.ipAllowlist), sessionMinutes: s?.sessionMinutes !== undefined ? String(s.sessionMinutes) : '' };
}
function notificationsFromData(data?: PlatformSettings): NotificationsForm {
  const n = data?.NOTIFICATIONS.value;
  return { slackWebhookUrl: n?.slackWebhookUrl ?? '', telegramWebhookUrl: n?.telegramWebhookUrl ?? '' };
}

// SA-20. Lưu ý phạm vi: đây là kho cấu hình (giống mẫu key/value của
// tenant_settings) — trang này ghi và đọc lại giá trị đã lưu, nhưng KHÔNG có
// nghĩa các giá trị đó tự động được thực thi ở nơi khác trong hệ thống:
//   • Ngưỡng nhắc nợ (DUNNING): chưa có job lịch trình nào tiêu thụ các số này.
//   • IP allowlist (SECURITY): chưa được luồng đăng nhập kiểm tra.
//   • Mặc định Tenant: chưa được luồng "Tạo Tenant" (SA-04) áp dụng.
// Việc nối các giá trị này vào luồng nghiệp vụ tương ứng là công việc tiếp
// theo, cố tình để ngoài phạm vi lần này thay vì âm thầm giả định đã hoạt động.
export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['platform-settings'], queryFn: getPlatformSettings });

  // Mỗi nhóm giữ override cục bộ khi người dùng chỉnh sửa; null = chưa chỉnh,
  // hiển thị theo dữ liệu đã tải (cùng khuôn mẫu với `infoForm` ở TenantDetailPage).
  const [brandingOverride, setBrandingOverride] = useState<BrandingForm | null>(null);
  const [dunningOverride, setDunningOverride] = useState<DunningForm | null>(null);
  const [securityOverride, setSecurityOverride] = useState<SecurityForm | null>(null);
  const [notificationsOverride, setNotificationsOverride] = useState<NotificationsForm | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const branding = brandingOverride ?? brandingFromData(data);
  const dunning = dunningOverride ?? dunningFromData(data);
  const security = securityOverride ?? securityFromData(data);
  const notifications = notificationsOverride ?? notificationsFromData(data);

  const mutation = useMutation({
    mutationFn: (params: { key: string; value: Record<string, unknown> }) =>
      upsertPlatformSetting(params.key as never, params.value),
    onSuccess: (_result, params) => {
      setErrors((e) => ({ ...e, [params.key]: '' }));
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
    },
    onError: (err, params) => setErrors((e) => ({ ...e, [params.key]: apiErrorMessage(err) })),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <Card><Skeleton className="h-40 w-full" /></Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Cài đặt nền tảng</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Cấu hình dùng chung cho toàn bộ nền tảng FitFlow — không thuộc về bất kỳ Tenant nào.
        </p>
      </div>

      <Callout tone="warning">
        Trang này lưu cấu hình dưới dạng key/value. Ngưỡng nhắc nợ, IP allowlist và mặc định Tenant hiện
        <strong> chưa được luồng nghiệp vụ tương ứng tiêu thụ tự động</strong> (chưa có job nhắc nợ theo lịch,
        chưa có kiểm tra IP ở đăng nhập, SA-04 chưa đọc mặc định Tenant) — đây là bước lưu trữ, việc nối vào
        từng luồng là công việc kế tiếp.
      </Callout>

      <Card>
        <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Thương hiệu</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Tên hiển thị" htmlFor="brandName">
            <input id="brandName" className={inputClass} value={branding.name} onChange={(e) => setBrandingOverride({ ...branding, name: e.target.value })} />
          </FormField>
          <FormField label="URL logo" htmlFor="brandLogo">
            <input id="brandLogo" className={inputClass} value={branding.logoUrl} onChange={(e) => setBrandingOverride({ ...branding, logoUrl: e.target.value })} />
          </FormField>
          <FormField label="Email gửi đi" htmlFor="brandSender">
            <input id="brandSender" className={inputClass} value={branding.senderEmail} onChange={(e) => setBrandingOverride({ ...branding, senderEmail: e.target.value })} />
          </FormField>
          <FormField label="Domain hỗ trợ" htmlFor="brandDomain">
            <input id="brandDomain" className={inputClass} value={branding.supportDomain} onChange={(e) => setBrandingOverride({ ...branding, supportDomain: e.target.value })} />
          </FormField>
        </div>
        {errors.BRANDING && <p className="mt-2 text-sm text-red-600">{errors.BRANDING}</p>}
        <Button className="mt-4" variant="secondary" size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate({ key: 'BRANDING', value: { ...branding } })}>
          Lưu
        </Button>
      </Card>

      <Card>
        <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Thu nợ</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Lịch nhắc (ngày, phân cách bởi dấu phẩy)" htmlFor="dunReminders">
            <input id="dunReminders" placeholder="3, 7, 14" className={inputClass} value={dunning.reminderDays} onChange={(e) => setDunningOverride({ ...dunning, reminderDays: e.target.value })} />
          </FormField>
          <FormField label="Ngưỡng chuyển PAST_DUE (ngày)" htmlFor="dunPastDue">
            <input id="dunPastDue" type="number" className={inputClass} value={dunning.pastDueDays} onChange={(e) => setDunningOverride({ ...dunning, pastDueDays: e.target.value })} />
          </FormField>
          <FormField label="Ngưỡng vào hàng chờ khoá (ngày)" htmlFor="dunSuspend">
            <input id="dunSuspend" type="number" className={inputClass} value={dunning.suspendQueueDays} onChange={(e) => setDunningOverride({ ...dunning, suspendQueueDays: e.target.value })} />
          </FormField>
        </div>
        {errors.DUNNING && <p className="mt-2 text-sm text-red-600">{errors.DUNNING}</p>}
        <Button
          className="mt-4"
          variant="secondary"
          size="sm"
          disabled={mutation.isPending}
          onClick={() =>
            mutation.mutate({
              key: 'DUNNING',
              value: {
                reminderDays: parseCsvNumbers(dunning.reminderDays),
                pastDueDays: Number(dunning.pastDueDays) || undefined,
                suspendQueueDays: Number(dunning.suspendQueueDays) || undefined,
              },
            })
          }
        >
          Lưu
        </Button>
      </Card>

      <Card>
        <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Bảo mật</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="IP allowlist khu vực admin (phân cách bởi dấu phẩy)" htmlFor="secIps">
            <input id="secIps" placeholder="203.0.113.1, 203.0.113.2" className={inputClass} value={security.ipAllowlist} onChange={(e) => setSecurityOverride({ ...security, ipAllowlist: e.target.value })} />
          </FormField>
          <FormField label="Thời hạn session (phút)" htmlFor="secSession">
            <input id="secSession" type="number" className={inputClass} value={security.sessionMinutes} onChange={(e) => setSecurityOverride({ ...security, sessionMinutes: e.target.value })} />
          </FormField>
        </div>
        {errors.SECURITY && <p className="mt-2 text-sm text-red-600">{errors.SECURITY}</p>}
        <Button
          className="mt-4"
          variant="secondary"
          size="sm"
          disabled={mutation.isPending}
          onClick={() =>
            mutation.mutate({
              key: 'SECURITY',
              value: {
                ipAllowlist: parseCsvStrings(security.ipAllowlist),
                sessionMinutes: Number(security.sessionMinutes) || undefined,
              },
            })
          }
        >
          Lưu
        </Button>
      </Card>

      <Card>
        <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Thông báo nội bộ</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Slack webhook URL" htmlFor="notifSlack">
            <input id="notifSlack" className={inputClass} value={notifications.slackWebhookUrl} onChange={(e) => setNotificationsOverride({ ...notifications, slackWebhookUrl: e.target.value })} />
          </FormField>
          <FormField label="Telegram webhook URL" htmlFor="notifTelegram">
            <input id="notifTelegram" className={inputClass} value={notifications.telegramWebhookUrl} onChange={(e) => setNotificationsOverride({ ...notifications, telegramWebhookUrl: e.target.value })} />
          </FormField>
        </div>
        {errors.NOTIFICATIONS && <p className="mt-2 text-sm text-red-600">{errors.NOTIFICATIONS}</p>}
        <Button className="mt-4" variant="secondary" size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate({ key: 'NOTIFICATIONS', value: { ...notifications } })}>
          Lưu
        </Button>
      </Card>
    </div>
  );
}
