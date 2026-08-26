import { IsObject } from 'class-validator';

// SA-20 §III groups: Thương hiệu, Thu nợ, Bảo mật, Mặc định Tenant, Thông báo
// nội bộ. Stored as a flexible JSON blob per key (mirrors tenant_settings)
// rather than hardcoded columns, so each group's shape can evolve on its own.
export const PLATFORM_SETTING_KEYS = [
  'BRANDING',
  'DUNNING',
  'SECURITY',
  'TENANT_DEFAULTS',
  'NOTIFICATIONS',
] as const;
export type PlatformSettingKey = (typeof PLATFORM_SETTING_KEYS)[number];

export class UpsertSettingDto {
  @IsObject()
  value!: Record<string, unknown>;
}
