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
  senderEmail?: string;
  supportDomain?: string;
}

export interface DunningSettings {
  reminderDays?: number[];
  pastDueDays?: number;
  suspendQueueDays?: number;
}

export interface SecuritySettings {
  ipAllowlist?: string[];
  sessionMinutes?: number;
}

export interface NotificationSettings {
  slackWebhookUrl?: string;
  telegramWebhookUrl?: string;
}

export interface PlatformSettings {
  BRANDING: SettingEntry<BrandingSettings>;
  DUNNING: SettingEntry<DunningSettings>;
  SECURITY: SettingEntry<SecuritySettings>;
  TENANT_DEFAULTS: SettingEntry<Record<string, unknown>>;
  NOTIFICATIONS: SettingEntry<NotificationSettings>;
}

export function getPlatformSettings() {
  return apiClient.get<PlatformSettings>('/super-admin/settings').then((r) => r.data);
}

export function upsertPlatformSetting(key: PlatformSettingKey, value: Record<string, unknown>) {
  return apiClient
    .put<SettingEntry>(`/super-admin/settings/${key}`, { value })
    .then((r) => r.data);
}
