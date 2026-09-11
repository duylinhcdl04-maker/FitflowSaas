import { apiClient } from './client';

export const PLATFORM_SETTING_KEYS = [
  'BRANDING',
  'DUNNING',
  'SECURITY',
  'TENANT_DEFAULTS',
  'NOTIFICATIONS',
] as const;
export type PlatformSettingKey = (typeof PLATFORM_SETTING_KEYS)[number];

export interface SettingEntry<T = Record<string, unknown>> {
  value: T | null;
  updatedAt: string | null;
}

export interface BrandingSettings {
  name?: string;
  logoUrl?: string;
  faviconUrl?: string;
  senderEmail?: string;
  senderName?: string;
  supportDomain?: string;
  supportEmail?: string;
  hotline?: string;
}

export interface DunningSettings {
  reminderDays?: number[];
  pastDueDays?: number;
  suspendQueueDays?: number;
  gracePeriodDays?: number;
  autoCancelDays?: number;
}

export interface SecuritySettings {
  ipAllowlist?: string[];
  sessionMinutes?: number;
  enforce2FA?: boolean;
  maxFailedLogins?: number;
  lockoutDurationMinutes?: number;
}

export interface TenantDefaultSettings {
  trialDays?: number;
  defaultCurrency?: string;
  defaultTimezone?: string;
  defaultLanguage?: string;
  maxBranchesTrial?: number;
  requireEmailVerification?: boolean;
}

export interface TelegramChatInfo {
  id: string;
  title: string;
  type: string;
  username?: string;
}

export interface TelegramVerifyResult {
  valid: boolean;
  bot: {
    id: number;
    name: string;
    username: string;
  };
}

export interface TelegramConnectionState {
  configured: boolean;
  isActive: boolean;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  bot?: {
    id?: number;
    name: string;
    username: string;
  };
  chat?: {
    id: string;
    name: string;
    type: string;
    maskedChatId: string;
  };
  lastCheckedAt?: string | null;
  lastError?: string | null;
}

export interface NotificationSettings {
  slackWebhookUrl?: string;
  telegram?: TelegramConnectionState;
  systemAlertEmail?: string;
  notifyOnNewTenant?: boolean;
  notifyOnSubscriptionExpiring?: boolean;
  notifyOnSecurityAlert?: boolean;
}

export interface PlatformSettings {
  BRANDING: SettingEntry<BrandingSettings>;
  DUNNING: SettingEntry<DunningSettings>;
  SECURITY: SettingEntry<SecuritySettings>;
  TENANT_DEFAULTS: SettingEntry<TenantDefaultSettings>;
  NOTIFICATIONS: SettingEntry<NotificationSettings>;
}

export function getPlatformSettings() {
  return apiClient.get<PlatformSettings>('/super-admin/settings').then((r) => r.data);
}

export function getPublicBranding() {
  return apiClient.get<BrandingSettings>('/super-admin/settings/public').then((r) => r.data);
}

export function upsertPlatformSetting(key: PlatformSettingKey, value: Record<string, unknown>) {
  return apiClient
    .put<SettingEntry>(`/super-admin/settings/${key}`, { value })
    .then((r) => r.data);
}

export function uploadPlatformAsset(dataUri: string, folder = 'fitflow/platform-branding') {
  return apiClient
    .post<{ url: string }>('/super-admin/settings/upload', { dataUri, folder })
    .then((r) => r.data);
}

export function verifyTelegramBot(token: string) {
  return apiClient
    .post<TelegramVerifyResult>('/super-admin/settings/telegram/verify', { token })
    .then((r) => r.data);
}

export function discoverTelegramChats(token: string) {
  return apiClient
    .post<{ chats: TelegramChatInfo[] }>('/super-admin/settings/telegram/discover-chats', { token })
    .then((r) => r.data);
}

export function testTelegramMessage(params: { token?: string; chatId: string; text?: string }) {
  return apiClient
    .post<{ success: boolean; messageId: number }>('/super-admin/settings/telegram/test', params)
    .then((r) => r.data);
}

export function saveTelegramConnection(params: {
  token: string;
  chatId: string;
  chatTitle?: string;
  chatType?: string;
  botName?: string;
  botUsername?: string;
}) {
  return apiClient
    .post<TelegramConnectionState>('/super-admin/settings/telegram/save', params)
    .then((r) => r.data);
}

export function disconnectTelegram() {
  return apiClient
    .post<{ success: boolean }>('/super-admin/settings/telegram/disconnect')
    .then((r) => r.data);
}

export function toggleTelegram(isActive: boolean) {
  return apiClient
    .patch<{ success: boolean; isActive: boolean }>('/super-admin/settings/telegram/toggle', {
      isActive,
    })
    .then((r) => r.data);
}
