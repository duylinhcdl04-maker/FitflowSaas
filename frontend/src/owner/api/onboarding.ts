import { apiClient } from './client';

// Chi nhánh / Nhân sự / Dịch vụ & Gói tập giờ có api riêng dùng chung cho cả
// Onboarding Checklist lẫn các trang Vận hành hàng ngày — re-export tại đây
// để OnboardingPage.tsx không phải đổi import.
export * from './branches';
export * from './staff';
export * from './catalog';

// ---------- OW-04d. Check-in ----------

export interface CheckinConfig {
  qr: boolean;
  manual: boolean;
  face: boolean;
}

export function getCheckinConfig() {
  return apiClient.get<CheckinConfig>('/owner/settings/checkin-config').then((res) => res.data);
}

export function updateCheckinConfig(config: CheckinConfig) {
  return apiClient.put<CheckinConfig>('/owner/settings/checkin-config', config).then((res) => res.data);
}

// ---------- Tự động Check-out ----------

export type AutoCheckoutPolicy = { mode: 'DURATION'; hours: number } | { mode: 'CLOSING_TIME' };

export function getAutoCheckoutPolicy() {
  return apiClient.get<AutoCheckoutPolicy>('/owner/settings/auto-checkout-policy').then((res) => res.data);
}

export function updateAutoCheckoutPolicy(policy: AutoCheckoutPolicy) {
  return apiClient.put<AutoCheckoutPolicy>('/owner/settings/auto-checkout-policy', policy).then((res) => res.data);
}

// ---------- Tiến độ tổng ----------

export interface OnboardingProgress {
  branchCreated: boolean;
  staffInvited: boolean;
  packageCreated: boolean;
  checkinConfigured: boolean;
}

export function getOnboardingProgress() {
  return apiClient.get<OnboardingProgress>('/owner/settings/onboarding').then((res) => res.data);
}
