export type AccessMode = 'FULL_ACCESS' | 'READ_ONLY' | 'BLOCKED';

// BR-TRIAL-06 (frontend/docs/UI_Owner.md mục V) — 30 ngày Grace Period sau
// khi Trial/Subscription hết hạn trước khi Tenant chuyển hẳn sang SUSPENDED.
const GRACE_PERIOD_DAYS = 30;

interface AccessModeInput {
  tenantStatus: string;
  subscriptionStatus: string;
  trialEndsAt: Date | null;
  subscriptionEndDate: Date;
  now?: Date;
}

/**
 * Owner Access Mode (FULL_ACCESS/READ_ONLY/BLOCKED) — tính toán thuần tuý từ
 * `tenants.status` + `subscriptions.status`/`trial_ends_at`, KHÔNG lưu thành
 * cột riêng (tránh hai nơi giữ cùng một sự thật, dễ lệch nhau). Không có job
 * nền nào tự động chuyển Subscription TRIAL → EXPIRED khi hết hạn, nên hàm
 * này tự kiểm tra mốc thời gian thực tế thay vì tin tuyệt đối vào status đã
 * lưu — cùng tinh thần "lazy expiry" đã dùng cho SupportSessionsService.
 */
export function deriveAccessMode(input: AccessModeInput): AccessMode {
  const now = input.now ?? new Date();

  if (input.tenantStatus === 'SUSPENDED' || input.tenantStatus === 'INACTIVE') {
    return 'BLOCKED';
  }

  if (input.subscriptionStatus === 'TRIAL') {
    if (!input.trialEndsAt || input.trialEndsAt >= now) return 'FULL_ACCESS';
    return withinGracePeriod(input.trialEndsAt, now) ? 'READ_ONLY' : 'BLOCKED';
  }

  if (input.subscriptionStatus === 'ACTIVE') return 'FULL_ACCESS';

  if (
    input.subscriptionStatus === 'EXPIRED' ||
    input.subscriptionStatus === 'PAST_DUE'
  ) {
    const expiredAt = input.trialEndsAt ?? input.subscriptionEndDate;
    return withinGracePeriod(expiredAt, now) ? 'READ_ONLY' : 'BLOCKED';
  }

  // SUSPENDED / CANCELLED ở cấp Subscription — chưa có luồng nào đặt trạng
  // thái này trong phạm vi đợt này, giữ mặc định an toàn.
  return 'BLOCKED';
}

function withinGracePeriod(expiredAt: Date, now: Date): boolean {
  const graceEndsAt = new Date(expiredAt);
  graceEndsAt.setDate(graceEndsAt.getDate() + GRACE_PERIOD_DAYS);
  return now <= graceEndsAt;
}
