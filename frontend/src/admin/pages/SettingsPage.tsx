import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PaintBrush,
  CurrencyDollar,
  ShieldCheck,
  Buildings,
  BellRinging,
  CheckCircle,
  CloudCheck,
  WarningCircle,
} from '@phosphor-icons/react';
import {
  getPlatformSettings,
  upsertPlatformSetting,
  type BrandingSettings,
  type DunningSettings,
  type SecuritySettings,
  type TenantDefaultSettings,
  type NotificationSettings,
  type PlatformSettingKey,
} from '../api/settings';
import { apiErrorMessage } from '../api/client';
import Callout from '../components/Callout';
import { Skeleton } from '../components/Skeleton';
import BrandingTab from './settings/BrandingTab';
import DunningTab from './settings/DunningTab';
import SecurityTab from './settings/SecurityTab';
import TenantDefaultsTab from './settings/TenantDefaultsTab';
import NotificationsTab from './settings/NotificationsTab';

type SettingsTab = 'branding' | 'dunning' | 'security' | 'tenant_defaults' | 'notifications';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>('branding');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: getPlatformSettings,
  });

  // Local overrides per section
  const [brandingOverride, setBrandingOverride] = useState<BrandingSettings | null>(null);
  const [dunningOverride, setDunningOverride] = useState<DunningSettings | null>(null);
  const [securityOverride, setSecurityOverride] = useState<SecuritySettings | null>(null);
  const [tenantDefaultsOverride, setTenantDefaultsOverride] = useState<TenantDefaultSettings | null>(null);
  const [notificationsOverride, setNotificationsOverride] = useState<NotificationSettings | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const branding: BrandingSettings = brandingOverride ?? data?.BRANDING?.value ?? {};
  const dunning: DunningSettings = dunningOverride ?? data?.DUNNING?.value ?? {};
  const security: SecuritySettings = securityOverride ?? data?.SECURITY?.value ?? {};
  const tenantDefaults: TenantDefaultSettings = tenantDefaultsOverride ?? data?.TENANT_DEFAULTS?.value ?? {};
  const notifications: NotificationSettings = notificationsOverride ?? data?.NOTIFICATIONS?.value ?? {};

  const mutation = useMutation({
    mutationFn: (params: { key: PlatformSettingKey; value: Record<string, unknown> }) =>
      upsertPlatformSetting(params.key, params.value),
    onSuccess: (_result, params) => {
      setErrors((e) => ({ ...e, [params.key]: '' }));
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      showToast('Đã lưu cấu hình thành công!');
    },
    onError: (err, params) => {
      const msg = apiErrorMessage(err);
      setErrors((e) => ({ ...e, [params.key]: msg }));
      showToast(msg || 'Lưu cài đặt thất bại', 'error');
    },
  });

  const handleSaveTab = (key: PlatformSettingKey, value: Record<string, unknown>) => {
    mutation.mutate({ key, value });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const tabItems = [
    {
      id: 'branding' as const,
      label: 'Thương hiệu',
      icon: PaintBrush,
      desc: 'Logo, Favicon & Tên nền tảng',
    },
    {
      id: 'dunning' as const,
      label: 'Thu nợ & Gia hạn',
      icon: CurrencyDollar,
      desc: 'Lịch nhắc & Khóa nợ tự động',
    },
    {
      id: 'security' as const,
      label: 'Bảo mật & IP',
      icon: ShieldCheck,
      desc: 'IP Allowlist & Phiên đăng nhập',
    },
    {
      id: 'tenant_defaults' as const,
      label: 'Mặc định Tenant',
      icon: Buildings,
      desc: 'Dùng thử, Múi giờ & Tiền tệ',
    },
    {
      id: 'notifications' as const,
      label: 'Thông báo & Webhooks',
      icon: BellRinging,
      desc: 'Slack, Telegram & Email sự cố',
    },
  ];

  return (
    <div className="flex flex-col gap-6 relative pb-12">
      {/* Toast alert */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-900 shadow-xl transition-all dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-300">
          {toast.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" weight="fill" />
          ) : (
            <WarningCircle className="h-5 w-5 text-red-600 dark:text-red-400" weight="fill" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Cài đặt Nền tảng
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <CloudCheck className="h-3.5 w-3.5" />
              Cloudinary Active
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Trung tâm quản trị cấu hình dùng chung cho toàn bộ hệ sinh thái FitFlow SaaS.
          </p>
        </div>
      </div>

      {/* Notice Callout */}
      <Callout tone="info">
        Các cấu hình tại trang này áp dụng <strong>toàn cục</strong> cho nền tảng FitFlow. Logo và hình ảnh tải lên được lưu trữ trực tiếp trên CDN đám mây Cloudinary với băng thông tối ưu hóa tự động.
      </Callout>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto rounded-2xl border border-zinc-200/80 bg-zinc-100/70 p-1.5 backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-900/80 scrollbar-none">
        <div className="flex min-w-full sm:min-w-0 gap-1.5">
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-emerald-700 shadow-xs dark:bg-zinc-800 dark:text-emerald-400'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50'
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${
                    isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'
                  }`}
                  weight={isActive ? 'duotone' : 'regular'}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="mt-2">
        {activeTab === 'branding' && (
          <BrandingTab
            data={branding}
            onChange={setBrandingOverride}
            onSave={() => handleSaveTab('BRANDING', branding as Record<string, unknown>)}
            isSaving={mutation.isPending}
            error={errors.BRANDING}
            updatedAt={data?.BRANDING?.updatedAt}
          />
        )}

        {activeTab === 'dunning' && (
          <DunningTab
            data={dunning}
            onChange={setDunningOverride}
            onSave={() => handleSaveTab('DUNNING', dunning as Record<string, unknown>)}
            isSaving={mutation.isPending}
            error={errors.DUNNING}
            updatedAt={data?.DUNNING?.updatedAt}
          />
        )}

        {activeTab === 'security' && (
          <SecurityTab
            data={security}
            onChange={setSecurityOverride}
            onSave={() => handleSaveTab('SECURITY', security as Record<string, unknown>)}
            isSaving={mutation.isPending}
            error={errors.SECURITY}
            updatedAt={data?.SECURITY?.updatedAt}
          />
        )}

        {activeTab === 'tenant_defaults' && (
          <TenantDefaultsTab
            data={tenantDefaults}
            onChange={setTenantDefaultsOverride}
            onSave={() =>
              handleSaveTab('TENANT_DEFAULTS', tenantDefaults as Record<string, unknown>)
            }
            isSaving={mutation.isPending}
            error={errors.TENANT_DEFAULTS}
            updatedAt={data?.TENANT_DEFAULTS?.updatedAt}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationsTab
            data={notifications}
            onChange={setNotificationsOverride}
            onSave={() =>
              handleSaveTab('NOTIFICATIONS', notifications as Record<string, unknown>)
            }
            isSaving={mutation.isPending}
            error={errors.NOTIFICATIONS}
            updatedAt={data?.NOTIFICATIONS?.updatedAt}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['platform-settings'] })}
            onToast={showToast}
          />
        )}
      </div>
    </div>
  );
}
